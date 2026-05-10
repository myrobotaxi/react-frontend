/**
 * GET /api/users/me/export
 *
 * MYR-75 — GDPR Art. 15 (right of access) and Art. 20 (right to data
 * portability). Returns a JSON archive of every row the authenticated
 * user owns, with all P1 columns decrypted at the crypto boundary.
 *
 * Owned by the Next.js app per `rest-api.md` §10 DV-23 (RESOLVED 2026-05-08).
 *
 * Single Prisma `$transaction` reads the ownership graph and inserts the
 * `data_exported` AuditLog row atomically. Audit metadata is P0 counts only
 * per CG-DL-5 (`{vehicleCount, driveCount, inviteCount, auditCount}`).
 *
 * What the response contains: User profile (excluding tokens), Account
 * identities (provider/scope only — never tokens or *_enc shadows),
 * Settings, Vehicles (GPS + nav route decrypted), Drives (route points
 * decrypted), Invites (sender + recipient), AuditLog rows where
 * `userId == self`. The freshly-inserted `data_exported` row is appended
 * to `auditLog` so the export contains its own audit footprint.
 *
 * What the response excludes: OAuth credentials (`access_token`,
 * `refresh_token`, `id_token`, and their `*_enc` shadows). Issued by
 * Google for our app to call Google APIs on the user's behalf — not
 * user-owned data; out of scope for an Art. 15 export. Enforced by the
 * explicit `select` on `account.findMany` and asserted by the security
 * regression test.
 *
 * Error envelope per `rest-api.md` §4.1.
 */

import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { errorEnvelope } from '@/lib/api-errors';
import { prisma } from '@/lib/prisma';

import {
  mapAccountToExport,
  mapAuditLogToExport,
  mapDriveToExport,
  mapInviteToExport,
  mapProfileToExport,
  mapSettingsToExport,
  mapVehicleToExport,
} from './mappers';
import type { ExportArchive, ExportAuditLog } from './types';

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      errorEnvelope('auth_failed', 'authentication required'),
      { status: 401 },
    );
  }

  try {
    const archive = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      if (!user) return null;

      const accounts = await tx.account.findMany({
        where: { userId },
        // Explicit allowlist — never leak OAuth tokens (plaintext or
        // encrypted shadows) in the export.
        select: {
          id: true,
          type: true,
          provider: true,
          providerAccountId: true,
          scope: true,
          expires_at: true,
        },
      });

      const settings = await tx.settings.findUnique({ where: { userId } });

      const vehicles = await tx.vehicle.findMany({
        where: { userId },
        include: { stops: true },
        orderBy: { createdAt: 'asc' },
      });

      const drives = await tx.drive.findMany({
        where: { vehicle: { userId } },
        orderBy: { createdAt: 'asc' },
      });

      // Invite scope: invites the user sent OR invites on vehicles the
      // user owns. Invites where someone else invited the caller's email
      // address but neither side maps to a User row are intentionally
      // out of scope (no `recipientId` column to query against).
      const invites = await tx.invite.findMany({
        where: {
          OR: [{ senderId: userId }, { vehicle: { userId } }],
        },
        orderBy: { sentDate: 'asc' },
      });

      const auditLog = await tx.auditLog.findMany({
        where: { userId },
        orderBy: { timestamp: 'asc' },
      });

      // Insert the data_exported row in the same transaction. CG-DL-5:
      // P0 counts only — no PII, GPS, or tokens.
      const auditEntry = await tx.auditLog.create({
        data: {
          userId,
          action: 'data_exported',
          targetType: 'user',
          targetId: userId,
          initiator: 'user',
          metadata: {
            vehicleCount: vehicles.length,
            driveCount: drives.length,
            inviteCount: invites.length,
            auditCount: auditLog.length,
          },
        },
        select: { id: true, timestamp: true, createdAt: true, metadata: true },
      });

      const exportedAuditRow: ExportAuditLog = {
        id: auditEntry.id,
        userId,
        timestamp: auditEntry.timestamp.toISOString(),
        action: 'data_exported',
        targetType: 'user',
        targetId: userId,
        initiator: 'user',
        metadata: auditEntry.metadata,
        createdAt: auditEntry.createdAt.toISOString(),
      };

      const out: ExportArchive = {
        exportVersion: 1,
        // Use the audit row's timestamp so `exportedAt` and the
        // canonical audit moment are guaranteed identical (no
        // millisecond drift between two `new Date()` calls).
        exportedAt: auditEntry.timestamp.toISOString(),
        auditLogId: auditEntry.id,
        profile: mapProfileToExport(user),
        accounts: accounts.map(mapAccountToExport),
        settings: mapSettingsToExport(settings),
        vehicles: vehicles.map(mapVehicleToExport),
        drives: drives.map(mapDriveToExport),
        invites: invites.map((i) => mapInviteToExport(i, userId)),
        auditLog: [...auditLog.map(mapAuditLogToExport), exportedAuditRow],
      };
      return out;
    });

    if (archive === null) {
      return NextResponse.json(
        errorEnvelope('auth_failed', 'authentication required'),
        { status: 401 },
      );
    }

    return NextResponse.json(archive, { status: 200 });
  } catch (err) {
    // CG-DC-2: error.message must not leak P1 values; correlate via
    // structured logs only.
    console.error('GET /api/users/me/export transaction failed', {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      errorEnvelope('internal_error', 'data export failed'),
      { status: 500 },
    );
  }
}
