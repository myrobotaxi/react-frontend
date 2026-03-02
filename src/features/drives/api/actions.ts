'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { Drive, DriveSortBy, LngLat } from '@/types/drive';

/**
 * Map a Prisma Drive record to the shared Drive interface.
 * `routePoints` is stored as Json in Prisma — cast to LngLat[].
 */
function mapDrive(record: {
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
  routePoints: unknown;
}): Drive {
  return {
    id: record.id,
    vehicleId: record.vehicleId,
    date: record.date,
    startTime: record.startTime,
    endTime: record.endTime,
    startLocation: record.startLocation,
    startAddress: record.startAddress,
    endLocation: record.endLocation,
    endAddress: record.endAddress,
    distanceMiles: record.distanceMiles,
    durationMinutes: record.durationMinutes,
    avgSpeedMph: record.avgSpeedMph,
    maxSpeedMph: record.maxSpeedMph,
    energyUsedKwh: record.energyUsedKwh,
    startChargeLevel: record.startChargeLevel,
    endChargeLevel: record.endChargeLevel,
    fsdMiles: record.fsdMiles,
    fsdPercentage: record.fsdPercentage,
    interventions: record.interventions,
    routePoints: record.routePoints as LngLat[],
  };
}

/** Prisma orderBy clause for a given sort option. */
function buildOrderBy(sortBy: DriveSortBy) {
  switch (sortBy) {
    case 'distance':
      return { distanceMiles: 'desc' as const };
    case 'duration':
      return { durationMinutes: 'desc' as const };
    case 'date':
    default:
      return { date: 'desc' as const };
  }
}

/**
 * Fetch drives for the current user's vehicles.
 * Optionally filter by vehicleId and sort by date/distance/duration.
 */
export async function getDrives(
  vehicleId?: string,
  sortBy: DriveSortBy = 'date',
): Promise<Drive[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const where: Record<string, unknown> = {
    vehicle: { userId: session.user.id },
  };

  if (vehicleId) {
    where.vehicleId = vehicleId;
  }

  const records = await prisma.drive.findMany({
    where,
    orderBy: buildOrderBy(sortBy),
  });

  return records.map(mapDrive);
}

/**
 * Fetch a single drive by ID, verifying it belongs to the current user.
 * Returns null if not found or unauthorized.
 */
export async function getDriveById(driveId: string): Promise<Drive | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const record = await prisma.drive.findFirst({
    where: {
      id: driveId,
      vehicle: { userId: session.user.id },
    },
  });

  if (!record) return null;

  return mapDrive(record);
}
