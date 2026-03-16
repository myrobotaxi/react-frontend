/**
 * Shared drive utility constants and helpers.
 * Used by drive-detection.ts (server) and HomeScreen.tsx (client).
 * Lives in lib/ so both features/ and lib/ can import it.
 */

import type { Drive } from '@/types/drive';
import { parseTime12h } from '@/lib/format';

/**
 * Sentinel value for a drive that is still in progress.
 * The Prisma schema defines endTime as a required String (not nullable),
 * so we use an empty string to signal "not yet ended".
 */
export const DRIVE_IN_PROGRESS_SENTINEL = '';

/** Returns true if the drive is still in progress (has not ended). */
export function isDriveInProgress(drive: Pick<Drive, 'endTime'>): boolean {
  return drive.endTime === DRIVE_IN_PROGRESS_SENTINEL;
}

/**
 * Select the current drive for a vehicle from a list of drives.
 * Prefers an in-progress drive; falls back to the most recent completed drive
 * (by date descending, then startTime descending using 12h parse).
 */
export function selectCurrentDrive(
  drives: Drive[],
  vehicleId: string,
): Drive | undefined {
  const vehicleDrives = drives.filter((d) => d.vehicleId === vehicleId);

  const activeDrive = vehicleDrives.find((d) => isDriveInProgress(d));
  if (activeDrive) return activeDrive;

  vehicleDrives.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return parseTime12h(b.startTime) - parseTime12h(a.startTime);
  });
  return vehicleDrives[0] as Drive | undefined;
}
