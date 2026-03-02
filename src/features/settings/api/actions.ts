'use server';

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
 * Fetch the current user's settings, creating defaults if none exist.
 * Returns null if the user is not authenticated.
 */
export async function getSettings(): Promise<UserSettings | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;

  const settings = await prisma.settings.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  return {
    name: session.user.name ?? '',
    email: session.user.email ?? '',
    teslaLinked: settings.teslaLinked,
    teslaVehicleName: settings.teslaVehicleName ?? undefined,
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
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

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
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  });
}

/**
 * Unlink the Tesla account for the current user.
 * Sets teslaLinked to false and clears the vehicle name.
 * Full Tesla unlink with vehicle data deletion is a TODO for issue #11.
 */
export async function unlinkTesla(): Promise<void> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  await prisma.settings.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, teslaLinked: false, teslaVehicleName: null },
    update: { teslaLinked: false, teslaVehicleName: null },
  });
}
