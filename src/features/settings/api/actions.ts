'use server';

import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

import type { UserSettings, NotificationPreferences } from '../types';

/**
 * Map from NotificationPreferences keys to Prisma Settings column names.
 */
const NOTIFICATION_COLUMN_MAP: Record<keyof NotificationPreferences, string> = {
  driveStarted: 'notifyDriveStarted',
  driveCompleted: 'notifyDriveCompleted',
  chargingComplete: 'notifyChargingComplete',
  viewerJoined: 'notifyViewerJoined',
};

/**
 * Validate the session and verify the user exists in the database.
 * Returns the userId if valid, or null if not authenticated / user deleted.
 * A stale JWT may reference a deleted user (e.g. orphan cleanup from Tesla OAuth).
 */
interface VerifiedUser {
  id: string;
  name: string;
  email: string;
}

async function getVerifiedUser(): Promise<VerifiedUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!user) return null;

  return {
    id: user.id,
    name: session.user.name ?? '',
    email: session.user.email ?? '',
  };
}

/**
 * Fetch the current user's settings, creating defaults if none exist.
 * Returns null if the user is not authenticated.
 */
export async function getSettings(): Promise<UserSettings | null> {
  const user = await getVerifiedUser();
  if (!user) return null;

  const [settings, teslaAccount] = await Promise.all([
    prisma.settings.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    }),
    prisma.account.findFirst({
      where: { userId: user.id, provider: 'tesla' },
      select: { id: true },
    }),
  ]);

  // Derive teslaLinked from whether a Tesla Account record exists.
  // This is more reliable than the Settings flag alone, which depends
  // on the linkAccount event having fired successfully.
  const teslaLinked = teslaAccount !== null;

  return {
    name: user.name,
    email: user.email,
    teslaLinked,
    teslaVehicleName: settings.teslaVehicleName ?? undefined,
    virtualKeyPaired: settings.virtualKeyPaired,
    keyPairingDeferredAt: settings.keyPairingDeferredAt?.toISOString(),
    keyPairingReminderCount: settings.keyPairingReminderCount,
    notifications: {
      driveStarted: settings.notifyDriveStarted,
      driveCompleted: settings.notifyDriveCompleted,
      chargingComplete: settings.notifyChargingComplete,
      viewerJoined: settings.notifyViewerJoined,
    },
  };
}

/**
 * Update the current user's notification preferences.
 * Accepts a partial object so callers can update individual toggles.
 */
export async function updateSettings(
  prefs: Partial<NotificationPreferences>,
): Promise<void> {
  const user = await getVerifiedUser();
  if (!user) throw new Error('Not authenticated');

  const data: Record<string, boolean> = {};

  for (const [key, value] of Object.entries(prefs)) {
    const column = NOTIFICATION_COLUMN_MAP[key as keyof NotificationPreferences];
    if (column && typeof value === 'boolean') {
      data[column] = value;
    }
  }

  if (Object.keys(data).length === 0) {
    return;
  }

  await prisma.settings.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });
}

/**
 * Unlink the Tesla account for the current user.
 * Deletes the Tesla Account record (removing stored tokens) and
 * clears the teslaLinked flag and vehicle name in Settings.
 */
export async function unlinkTesla(): Promise<void> {
  const user = await getVerifiedUser();
  if (!user) throw new Error('Not authenticated');

  await prisma.$transaction([
    prisma.vehicle.deleteMany({ where: { userId: user.id } }),
    prisma.account.deleteMany({ where: { userId: user.id, provider: 'tesla' } }),
    prisma.settings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        teslaLinked: false,
        teslaVehicleName: null,
        virtualKeyPaired: false,
        keyPairingDeferredAt: null,
        keyPairingReminderCount: 0,
      },
      update: {
        teslaLinked: false,
        teslaVehicleName: null,
        virtualKeyPaired: false,
        keyPairingDeferredAt: null,
        keyPairingReminderCount: 0,
      },
    }),
  ]);

  revalidatePath('/settings');
}

/**
 * Defer the virtual key pairing prompt.
 * Increments the reminder count and stores the first deferral timestamp.
 */
export async function deferKeyPairing(): Promise<void> {
  const user = await getVerifiedUser();
  if (!user) throw new Error('Not authenticated');

  const settings = await prisma.settings.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });

  await prisma.settings.update({
    where: { userId: user.id },
    data: {
      keyPairingReminderCount: settings.keyPairingReminderCount + 1,
      keyPairingDeferredAt: settings.keyPairingDeferredAt ?? new Date(),
    },
  });
}
