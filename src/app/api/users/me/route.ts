/**
 * DELETE /api/users/me
 *
 * Implements FR-10.1 / FR-10.2 / NFR-3.29 — user-initiated account deletion
 * with an immutable audit trail.
 *
 * The handler runs a single Prisma `$transaction`:
 *   1. Count vehicles, drives, and invites owned by the user.
 *   2. INSERT an `account_deleted` AuditLog row (action enum per
 *      data-lifecycle.md §4.2) with metadata = {vehicleCount, driveCount,
 *      inviteCount}. CG-DL-5: P0 values only — no email, name, GPS, etc.
 *   3. DELETE the User row. Prisma `onDelete: Cascade` propagates to:
 *        Account, Vehicle (→ Drive, TripStop, vehicle-scoped Invite),
 *        Invite (sender side), Settings.
 *
 * Owned by the Next.js app per rest-api.md §10 DV-23 (RESOLVED 2026-05-08,
 * MYR-69). Session strategy is JWT, so there is no DB session table to
 * cascade — the WS-session cleanup happens later via the Go telemetry
 * server's vehicle-deletion detector (data-lifecycle.md §3.5, MYR-73).
 *
 * Error envelope follows rest-api.md §4.1.
 */

import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    subCode: string | null;
  };
}

function errorEnvelope(
  code: string,
  message: string,
  subCode: string | null = null,
): ErrorEnvelope {
  return { error: { code, message, subCode } };
}

export async function DELETE(): Promise<NextResponse> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      errorEnvelope('auth_failed', 'authentication required'),
      { status: 401 },
    );
  }

  try {
    const auditLogId = await prisma.$transaction(async (tx) => {
      const [vehicleCount, driveCount, inviteCount] = await Promise.all([
        tx.vehicle.count({ where: { userId } }),
        tx.drive.count({ where: { vehicle: { userId } } }),
        tx.invite.count({ where: { senderId: userId } }),
      ]);

      const auditEntry = await tx.auditLog.create({
        data: {
          userId,
          action: 'account_deleted',
          targetType: 'user',
          targetId: userId,
          initiator: 'user',
          // CG-DL-5: P0 values only. Aggregate counts and opaque IDs only —
          // never email, name, last-login timestamp, GPS, or any other P1
          // field. See data-lifecycle.md §4.4.
          metadata: { vehicleCount, driveCount, inviteCount },
        },
        select: { id: true },
      });

      // Prisma cascades handle Account, Vehicle (→ Drive, TripStop,
      // vehicle-scoped Invite), Invite (sender side), Settings.
      await tx.user.delete({ where: { id: userId } });

      return auditEntry.id;
    });

    return NextResponse.json({ deleted: true, auditLogId }, { status: 200 });
  } catch (err) {
    // CG-DC-2: error.message must not contain P1 values. Use opaque userId
    // for correlation only via structured logs (not in the response body).
    console.error('DELETE /api/users/me transaction failed', {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      errorEnvelope('internal_error', 'account deletion failed'),
      { status: 500 },
    );
  }
}
