/**
 * GET /api/users/me/export
 *
 * MYR-75 — GDPR Art. 15 (right of access) and Art. 20 (right to data
 * portability) data-export endpoint. Returns a JSON archive of every row
 * the authenticated user owns, with all P1 columns decrypted at the
 * crypto boundary (this is the whole point: the user is requesting a
 * machine-readable copy of their own data). The endpoint is
 * authenticated and only ever returns rows belonging to the caller —
 * we never serve another user's data.
 *
 * Owned by the Next.js app, mirroring the MYR-72 / MYR-73 ownership of
 * `DELETE /api/users/me` (rest-api.md §10 DV-23, RESOLVED 2026-05-08).
 *
 * The handler runs a single Prisma `$transaction` for read-consistency
 * and to atomically insert the audit-log row alongside the export read:
 *
 *   1. Read profile / settings / vehicles (with stops) / drives /
 *      invites (sender + recipient) / audit log rows where userId == self.
 *   2. INSERT a `data_exported` AuditLog row with metadata =
 *      {vehicleCount, driveCount, inviteCount, auditCount}. CG-DL-5
 *      forbids any P1 values in metadata; counts only.
 *   3. Return the archive plus the freshly-inserted `auditLogId`.
 *
 * P1 decryption policy — what the response contains:
 *   • Vehicle GPS pairs (latitude/longitude, destination*, origin*) via
 *     `readVehicleGPS`.
 *   • Vehicle.navRouteCoordinatesEnc via `readNavRouteCoordinates`.
 *   • Drive.routePointsEnc via `readRoutePoints`.
 *
 * Excluded from the response on principle (security regression test
 * `__tests__/.../route.test.ts` enforces these):
 *   • `Account.access_token` / `Account.refresh_token` / `Account.id_token`
 *     and their `*_enc` shadow columns. OAuth credentials are issued by
 *     Google for our app to call Google APIs on the user's behalf — they
 *     are NOT user-owned data and are explicitly out of scope for an
 *     Art. 15 export.
 *   • `User.image` and `User.emailVerified` are included for completeness;
 *     `Account.providerAccountId` is included because it identifies the
 *     OAuth identity (P0, not credential material).
 *
 * Error envelope follows rest-api.md §4.1.
 */

import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { readNavRouteCoordinates, readRoutePoints } from '@/lib/route-blob-encryption';
import { readVehicleGPS } from '@/lib/vehicle-gps-encryption';

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

// ─── Response shapes ─────────────────────────────────────────────────────────

interface ExportProfile {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  emailVerified: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ExportAccountIdentity {
  id: string;
  type: string;
  provider: string;
  providerAccountId: string;
  scope: string | null;
  expiresAt: number | null;
}

interface ExportSettings {
  teslaLinked: boolean;
  teslaVehicleName: string | null;
  virtualKeyPaired: boolean;
  keyPairingDeferredAt: string | null;
  keyPairingReminderCount: number;
  notifyDriveStarted: boolean;
  notifyDriveCompleted: boolean;
  notifyChargingComplete: boolean;
  notifyViewerJoined: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ExportTripStop {
  id: string;
  name: string;
  address: string;
  type: string;
}

interface ExportVehicle {
  id: string;
  teslaVehicleId: string | null;
  vin: string | null;
  name: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  chargeLevel: number;
  estimatedRange: number;
  chargeState: string | null;
  timeToFull: number | null;
  status: string;
  speed: number;
  gearPosition: string | null;
  heading: number;
  locationName: string;
  locationAddress: string;
  latitude: number | null;
  longitude: number | null;
  interiorTemp: number;
  exteriorTemp: number;
  odometerMiles: number;
  fsdMilesSinceReset: number;
  virtualKeyPaired: boolean;
  setupStatus: string;
  destinationName: string | null;
  destinationAddress: string | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
  originLatitude: number | null;
  originLongitude: number | null;
  etaMinutes: number | null;
  tripDistanceMiles: number | null;
  tripDistanceRemaining: number | null;
  navRouteCoordinates: Array<[number, number]> | null;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
  stops: ExportTripStop[];
}

interface ExportDrive {
  id: string;
  vehicleId: string;
  date: string;
  startTime: string;
  endTime: string;
  startLocation: string;
  startAddress: string;
  endLocation: string;
  endAddress: string;
  distanceMiles: number;
  durationMinutes: number;
  avgSpeedMph: number;
  maxSpeedMph: number;
  energyUsedKwh: number;
  startChargeLevel: number;
  endChargeLevel: number;
  fsdMiles: number;
  fsdPercentage: number;
  interventions: number;
  routePoints: Array<{ lat: number; lng: number; timestamp: string; speed: number }>;
  createdAt: string;
}

interface ExportInvite {
  id: string;
  vehicleId: string;
  senderId: string;
  label: string;
  email: string;
  status: string;
  permission: string;
  sentDate: string;
  acceptedDate: string | null;
  lastSeen: string | null;
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
  role: 'sender' | 'recipient';
}

interface ExportAuditLog {
  id: string;
  userId: string;
  timestamp: string;
  action: string;
  targetType: string;
  targetId: string;
  initiator: string;
  metadata: unknown;
  createdAt: string;
}

interface ExportArchive {
  exportVersion: 1;
  exportedAt: string;
  auditLogId: string;
  profile: ExportProfile;
  accounts: ExportAccountIdentity[];
  settings: ExportSettings | null;
  vehicles: ExportVehicle[];
  drives: ExportDrive[];
  invites: ExportInvite[];
  auditLog: ExportAuditLog[];
}

// ─── Handler ─────────────────────────────────────────────────────────────────

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

      if (!user) {
        // Authenticated session but no user row — treat as auth failure
        // rather than leaking an empty archive.
        return null;
      }

      const accounts = await tx.account.findMany({
        where: { userId },
        // Explicit `select` — never leak OAuth tokens, plaintext or
        // encrypted, in the export response. Token columns
        // (`access_token`, `refresh_token`, `id_token`, and their
        // `_enc` shadows) are intentionally excluded.
        select: {
          id: true,
          type: true,
          provider: true,
          providerAccountId: true,
          scope: true,
          expires_at: true,
        },
      });

      const settings = await tx.settings.findUnique({
        where: { userId },
      });

      const vehicles = await tx.vehicle.findMany({
        where: { userId },
        include: { stops: true },
        orderBy: { createdAt: 'asc' },
      });

      const drives = await tx.drive.findMany({
        where: { vehicle: { userId } },
        orderBy: { createdAt: 'asc' },
      });

      const invites = await tx.invite.findMany({
        where: {
          OR: [
            { senderId: userId },
            { vehicle: { userId } },
          ],
        },
        orderBy: { sentDate: 'asc' },
      });

      const auditLog = await tx.auditLog.findMany({
        where: { userId },
        orderBy: { timestamp: 'asc' },
      });

      // Insert the data_exported row in the same transaction. CG-DL-5:
      // P0 metadata only — counts and opaque IDs, never P1 values.
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

      const profile: ExportProfile = {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified ? user.emailVerified.toISOString() : null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };

      const accountsOut: ExportAccountIdentity[] = accounts.map((a) => ({
        id: a.id,
        type: a.type,
        provider: a.provider,
        providerAccountId: a.providerAccountId,
        scope: a.scope ?? null,
        expiresAt: a.expires_at ?? null,
      }));

      const settingsOut: ExportSettings | null = settings
        ? {
            teslaLinked: settings.teslaLinked,
            teslaVehicleName: settings.teslaVehicleName,
            virtualKeyPaired: settings.virtualKeyPaired,
            keyPairingDeferredAt: settings.keyPairingDeferredAt
              ? settings.keyPairingDeferredAt.toISOString()
              : null,
            keyPairingReminderCount: settings.keyPairingReminderCount,
            notifyDriveStarted: settings.notifyDriveStarted,
            notifyDriveCompleted: settings.notifyDriveCompleted,
            notifyChargingComplete: settings.notifyChargingComplete,
            notifyViewerJoined: settings.notifyViewerJoined,
            createdAt: settings.createdAt.toISOString(),
            updatedAt: settings.updatedAt.toISOString(),
          }
        : null;

      const vehiclesOut: ExportVehicle[] = vehicles.map((v) => {
        const gps = readVehicleGPS(v);
        const navRoute = readNavRouteCoordinates(v);
        return {
          id: v.id,
          teslaVehicleId: v.teslaVehicleId,
          vin: v.vin,
          name: v.name,
          model: v.model,
          year: v.year,
          color: v.color,
          licensePlate: v.licensePlate,
          chargeLevel: v.chargeLevel,
          estimatedRange: v.estimatedRange,
          chargeState: v.chargeState,
          timeToFull: v.timeToFull,
          status: v.status,
          speed: v.speed,
          gearPosition: v.gearPosition,
          heading: v.heading,
          locationName: v.locationName,
          locationAddress: v.locationAddress,
          latitude: gps.latitude,
          longitude: gps.longitude,
          interiorTemp: v.interiorTemp,
          exteriorTemp: v.exteriorTemp,
          odometerMiles: v.odometerMiles,
          fsdMilesSinceReset: v.fsdMilesSinceReset,
          virtualKeyPaired: v.virtualKeyPaired,
          setupStatus: v.setupStatus,
          destinationName: v.destinationName,
          destinationAddress: v.destinationAddress,
          destinationLatitude: gps.destinationLatitude,
          destinationLongitude: gps.destinationLongitude,
          originLatitude: gps.originLatitude,
          originLongitude: gps.originLongitude,
          etaMinutes: v.etaMinutes,
          tripDistanceMiles: v.tripDistanceMiles,
          tripDistanceRemaining: v.tripDistanceRemaining,
          navRouteCoordinates: navRoute,
          lastUpdated: v.lastUpdated.toISOString(),
          createdAt: v.createdAt.toISOString(),
          updatedAt: v.updatedAt.toISOString(),
          stops: v.stops.map((s) => ({
            id: s.id,
            name: s.name,
            address: s.address,
            type: s.type,
          })),
        };
      });

      const drivesOut: ExportDrive[] = drives.map((d) => ({
        id: d.id,
        vehicleId: d.vehicleId,
        date: d.date,
        startTime: d.startTime,
        endTime: d.endTime,
        startLocation: d.startLocation,
        startAddress: d.startAddress,
        endLocation: d.endLocation,
        endAddress: d.endAddress,
        distanceMiles: d.distanceMiles,
        durationMinutes: d.durationMinutes,
        avgSpeedMph: d.avgSpeedMph,
        maxSpeedMph: d.maxSpeedMph,
        energyUsedKwh: d.energyUsedKwh,
        startChargeLevel: d.startChargeLevel,
        endChargeLevel: d.endChargeLevel,
        fsdMiles: d.fsdMiles,
        fsdPercentage: d.fsdPercentage,
        interventions: d.interventions,
        routePoints: readRoutePoints(d),
        createdAt: d.createdAt.toISOString(),
      }));

      const invitesOut: ExportInvite[] = invites.map((i) => ({
        id: i.id,
        vehicleId: i.vehicleId,
        senderId: i.senderId,
        label: i.label,
        email: i.email,
        status: i.status,
        permission: i.permission,
        sentDate: i.sentDate.toISOString(),
        acceptedDate: i.acceptedDate ? i.acceptedDate.toISOString() : null,
        lastSeen: i.lastSeen ? i.lastSeen.toISOString() : null,
        isOnline: i.isOnline,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
        role: i.senderId === userId ? 'sender' : 'recipient',
      }));

      const auditLogOut: ExportAuditLog[] = [
        ...auditLog.map((row) => ({
          id: row.id,
          userId: row.userId,
          timestamp: row.timestamp.toISOString(),
          action: row.action,
          targetType: row.targetType,
          targetId: row.targetId,
          initiator: row.initiator,
          metadata: row.metadata,
          createdAt: row.createdAt.toISOString(),
        })),
        exportedAuditRow,
      ];

      const out: ExportArchive = {
        exportVersion: 1,
        exportedAt: new Date().toISOString(),
        auditLogId: auditEntry.id,
        profile,
        accounts: accountsOut,
        settings: settingsOut,
        vehicles: vehiclesOut,
        drives: drivesOut,
        invites: invitesOut,
        auditLog: auditLogOut,
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
    // CG-DC-2: error.message must not leak P1 values. Correlate via
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
