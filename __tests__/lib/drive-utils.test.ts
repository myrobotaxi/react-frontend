import { describe, it, expect } from 'vitest';

import {
  DRIVE_IN_PROGRESS_SENTINEL,
  isDriveInProgress,
} from '@/lib/drive-utils';
import type { Drive } from '@/types/drive';

// ─── DRIVE_IN_PROGRESS_SENTINEL ──────────────────────────────────────────────

describe('DRIVE_IN_PROGRESS_SENTINEL', () => {
  it('is an empty string', () => {
    expect(DRIVE_IN_PROGRESS_SENTINEL).toBe('');
  });
});

// ─── isDriveInProgress ───────────────────────────────────────────────────────

describe('isDriveInProgress', () => {
  it('returns true when endTime equals the sentinel (empty string)', () => {
    expect(isDriveInProgress({ endTime: '' })).toBe(true);
  });

  it('returns false when endTime is an ISO timestamp', () => {
    expect(isDriveInProgress({ endTime: '2026-03-16T14:30:00.000Z' })).toBe(false);
  });

  it('returns false when endTime is a non-empty string', () => {
    expect(isDriveInProgress({ endTime: '10:30 AM' })).toBe(false);
  });
});

// ─── currentDrive selection logic ────────────────────────────────────────────

/**
 * This suite tests the same selection algorithm used in HomeScreen.tsx:
 * 1. Prefer in-progress drives (endTime === DRIVE_IN_PROGRESS_SENTINEL)
 * 2. Fall back to the most recent completed drive (by date, then startTime)
 *
 * The logic is extracted here as a pure function to test without rendering.
 */
function selectCurrentDrive(
  drives: Drive[],
  vehicleId: string,
): Drive | undefined {
  const vehicleDrives = drives.filter((d) => d.vehicleId === vehicleId);

  const activeDrive = vehicleDrives.find((d) => isDriveInProgress(d));
  if (activeDrive) return activeDrive;

  vehicleDrives.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.startTime.localeCompare(a.startTime);
  });
  return vehicleDrives[0] as Drive | undefined;
}

/** Helper to build a minimal Drive object for testing. */
function makeDrive(overrides: Partial<Drive> & Pick<Drive, 'id' | 'vehicleId' | 'date' | 'startTime' | 'endTime'>): Drive {
  return {
    startLocation: '',
    startAddress: '',
    endLocation: '',
    endAddress: '',
    distanceMiles: 0,
    durationMinutes: 0,
    avgSpeedMph: 0,
    maxSpeedMph: 0,
    energyUsedKwh: 0,
    startChargeLevel: 80,
    endChargeLevel: 75,
    fsdMiles: 0,
    fsdPercentage: 0,
    interventions: 0,
    routePoints: [],
    ...overrides,
  };
}

describe('selectCurrentDrive', () => {
  it('returns undefined when there are no drives', () => {
    expect(selectCurrentDrive([], 'vehicle-1')).toBeUndefined();
  });

  it('returns undefined when no drives match the vehicle', () => {
    const drives = [
      makeDrive({
        id: 'd1',
        vehicleId: 'vehicle-2',
        date: '2026-03-16',
        startTime: '2026-03-16T10:00:00Z',
        endTime: '2026-03-16T10:30:00Z',
      }),
    ];
    expect(selectCurrentDrive(drives, 'vehicle-1')).toBeUndefined();
  });

  it('prefers the in-progress drive over completed drives', () => {
    const drives = [
      makeDrive({
        id: 'completed',
        vehicleId: 'vehicle-1',
        date: '2026-03-16',
        startTime: '2026-03-16T14:00:00Z',
        endTime: '2026-03-16T14:30:00Z',
      }),
      makeDrive({
        id: 'in-progress',
        vehicleId: 'vehicle-1',
        date: '2026-03-16',
        startTime: '2026-03-16T15:00:00Z',
        endTime: DRIVE_IN_PROGRESS_SENTINEL,
      }),
    ];

    const result = selectCurrentDrive(drives, 'vehicle-1');
    expect(result?.id).toBe('in-progress');
  });

  it('falls back to most recent completed drive by date', () => {
    const drives = [
      makeDrive({
        id: 'older',
        vehicleId: 'vehicle-1',
        date: '2026-03-15',
        startTime: '2026-03-15T20:00:00Z',
        endTime: '2026-03-15T20:30:00Z',
      }),
      makeDrive({
        id: 'newer',
        vehicleId: 'vehicle-1',
        date: '2026-03-16',
        startTime: '2026-03-16T08:00:00Z',
        endTime: '2026-03-16T08:30:00Z',
      }),
    ];

    const result = selectCurrentDrive(drives, 'vehicle-1');
    expect(result?.id).toBe('newer');
  });

  it('breaks date ties by startTime descending (ISO format sorts correctly)', () => {
    const drives = [
      makeDrive({
        id: 'morning',
        vehicleId: 'vehicle-1',
        date: '2026-03-16',
        startTime: '2026-03-16T08:00:00Z',
        endTime: '2026-03-16T08:30:00Z',
      }),
      makeDrive({
        id: 'afternoon',
        vehicleId: 'vehicle-1',
        date: '2026-03-16',
        startTime: '2026-03-16T14:00:00Z',
        endTime: '2026-03-16T14:30:00Z',
      }),
    ];

    const result = selectCurrentDrive(drives, 'vehicle-1');
    expect(result?.id).toBe('afternoon');
  });

  it('filters drives by vehicleId', () => {
    const drives = [
      makeDrive({
        id: 'other-car',
        vehicleId: 'vehicle-2',
        date: '2026-03-16',
        startTime: '2026-03-16T16:00:00Z',
        endTime: '2026-03-16T16:30:00Z',
      }),
      makeDrive({
        id: 'my-car',
        vehicleId: 'vehicle-1',
        date: '2026-03-16',
        startTime: '2026-03-16T10:00:00Z',
        endTime: '2026-03-16T10:30:00Z',
      }),
    ];

    const result = selectCurrentDrive(drives, 'vehicle-1');
    expect(result?.id).toBe('my-car');
  });
});
