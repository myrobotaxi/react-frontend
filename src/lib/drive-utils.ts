/**
 * Shared drive utility constants and helpers.
 * Used by drive-detection.ts (server) and HomeScreen.tsx (client).
 * Lives in lib/ so both features/ and lib/ can import it.
 */

import type { Drive } from '@/types/drive';

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
