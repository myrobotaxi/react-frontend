import { describe, it, expect } from 'vitest';

import {
  DRIVE_IN_PROGRESS_SENTINEL,
  isDriveInProgress,
  selectCurrentDrive,
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

// ─── selectCurrentDrive ─────────────────────────────────────────────────────

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
        startTime: '10:00 AM',
        endTime: '10:30 AM',
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
        startTime: '2:00 PM',
        endTime: '2:30 PM',
      }),
      makeDrive({
        id: 'in-progress',
        vehicleId: 'vehicle-1',
        date: '2026-03-16',
        startTime: '3:00 PM',
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
        startTime: '8:00 PM',
        endTime: '8:30 PM',
      }),
      makeDrive({
        id: 'newer',
        vehicleId: 'vehicle-1',
        date: '2026-03-16',
        startTime: '8:00 AM',
        endTime: '8:30 AM',
      }),
    ];

    const result = selectCurrentDrive(drives, 'vehicle-1');
    expect(result?.id).toBe('newer');
  });

  it('breaks date ties by startTime descending (handles 12h format correctly)', () => {
    const drives = [
      makeDrive({
        id: 'morning',
        vehicleId: 'vehicle-1',
        date: '2026-03-16',
        startTime: '9:00 AM',
        endTime: '9:30 AM',
      }),
      makeDrive({
        id: 'afternoon',
        vehicleId: 'vehicle-1',
        date: '2026-03-16',
        startTime: '2:15 PM',
        endTime: '2:45 PM',
      }),
    ];

    // "2:15 PM" > "9:00 AM" in real time, but localeCompare would sort wrong.
    // parseTime12h ensures correct ordering.
    const result = selectCurrentDrive(drives, 'vehicle-1');
    expect(result?.id).toBe('afternoon');
  });

  it('correctly sorts 10:30 AM after 9:00 AM on the same date', () => {
    const drives = [
      makeDrive({
        id: 'later-morning',
        vehicleId: 'vehicle-1',
        date: '2026-03-16',
        startTime: '10:30 AM',
        endTime: '11:00 AM',
      }),
      makeDrive({
        id: 'early-morning',
        vehicleId: 'vehicle-1',
        date: '2026-03-16',
        startTime: '9:00 AM',
        endTime: '9:30 AM',
      }),
    ];

    // localeCompare("9:00 AM", "10:30 AM") > 0 (wrong), parseTime12h gets it right
    const result = selectCurrentDrive(drives, 'vehicle-1');
    expect(result?.id).toBe('later-morning');
  });

  it('filters drives by vehicleId', () => {
    const drives = [
      makeDrive({
        id: 'other-car',
        vehicleId: 'vehicle-2',
        date: '2026-03-16',
        startTime: '4:00 PM',
        endTime: '4:30 PM',
      }),
      makeDrive({
        id: 'my-car',
        vehicleId: 'vehicle-1',
        date: '2026-03-16',
        startTime: '10:00 AM',
        endTime: '10:30 AM',
      }),
    ];

    const result = selectCurrentDrive(drives, 'vehicle-1');
    expect(result?.id).toBe('my-car');
  });
});
