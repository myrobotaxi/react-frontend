/**
 * Entity → export-shape transformations for `GET /api/users/me/export`
 * (MYR-75). Pure functions; no Prisma calls, no I/O. Each mapper takes
 * the loaded entity and produces a serialisable export entry.
 *
 * Decryption boundaries (called inside `mapVehicleToExport` /
 * `mapDriveToExport`) live in `@/lib/vehicle-gps-encryption` and
 * `@/lib/route-blob-encryption`. Keeping the mappers here keeps the
 * route handler short.
 */

import {
  readNavRouteCoordinates,
  readRoutePoints,
} from '@/lib/route-blob-encryption';
import { readVehicleGPS } from '@/lib/vehicle-gps-encryption';

import type {
  ExportAccountIdentity,
  ExportAuditLog,
  ExportDrive,
  ExportInvite,
  ExportProfile,
  ExportSettings,
  ExportTripStop,
  ExportVehicle,
} from './types';

export function mapProfileToExport(user: {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ExportProfile {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    emailVerified: user.emailVerified ? user.emailVerified.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function mapAccountToExport(a: {
  id: string;
  type: string;
  provider: string;
  providerAccountId: string;
  scope: string | null;
  expires_at: number | null;
}): ExportAccountIdentity {
  return {
    id: a.id,
    type: a.type,
    provider: a.provider,
    providerAccountId: a.providerAccountId,
    scope: a.scope ?? null,
    expiresAt: a.expires_at ?? null,
  };
}

export function mapSettingsToExport(settings: {
  teslaLinked: boolean;
  teslaVehicleName: string | null;
  virtualKeyPaired: boolean;
  keyPairingDeferredAt: Date | null;
  keyPairingReminderCount: number;
  notifyDriveStarted: boolean;
  notifyDriveCompleted: boolean;
  notifyChargingComplete: boolean;
  notifyViewerJoined: boolean;
  createdAt: Date;
  updatedAt: Date;
} | null): ExportSettings | null {
  if (!settings) return null;
  return {
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
  };
}

type VehicleRow = Parameters<typeof readVehicleGPS>[0] & Parameters<typeof readNavRouteCoordinates>[0] & {
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
  interiorTemp: number;
  exteriorTemp: number;
  odometerMiles: number;
  fsdMilesSinceReset: number;
  virtualKeyPaired: boolean;
  setupStatus: string;
  destinationName: string | null;
  destinationAddress: string | null;
  etaMinutes: number | null;
  tripDistanceMiles: number | null;
  tripDistanceRemaining: number | null;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
  stops: Array<{ id: string; name: string; address: string; type: string }>;
};

export function mapVehicleToExport(v: VehicleRow): ExportVehicle {
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
    stops: v.stops.map(
      (s): ExportTripStop => ({
        id: s.id,
        name: s.name,
        address: s.address,
        type: s.type,
      }),
    ),
  };
}

type DriveRow = Parameters<typeof readRoutePoints>[0] & {
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
  createdAt: Date;
};

export function mapDriveToExport(d: DriveRow): ExportDrive {
  return {
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
  };
}

export function mapInviteToExport(
  i: {
    id: string;
    vehicleId: string;
    senderId: string;
    label: string;
    email: string;
    status: string;
    permission: string;
    sentDate: Date;
    acceptedDate: Date | null;
    lastSeen: Date | null;
    isOnline: boolean;
    createdAt: Date;
    updatedAt: Date;
  },
  selfUserId: string,
): ExportInvite {
  return {
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
    role: i.senderId === selfUserId ? 'sender' : 'recipient',
  };
}

export function mapAuditLogToExport(row: {
  id: string;
  userId: string;
  timestamp: Date;
  action: string;
  targetType: string;
  targetId: string;
  initiator: string;
  metadata: unknown;
  createdAt: Date;
}): ExportAuditLog {
  return {
    id: row.id,
    userId: row.userId,
    timestamp: row.timestamp.toISOString(),
    action: row.action,
    targetType: row.targetType,
    targetId: row.targetId,
    initiator: row.initiator,
    metadata: row.metadata,
    createdAt: row.createdAt.toISOString(),
  };
}
