import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDriveSort } from '@/features/drives/hooks/use-drive-sort';
import type { Drive } from '@/types/drive';

/** Factory for test drives with minimal required fields. */
function makeDrive(overrides: Partial<Drive>): Drive {
  return {
    id: 'd0',
    vehicleId: 'v1',
    date: '2026-02-22',
    startTime: '10:00 AM',
    endTime: '10:30 AM',
    startLocation: 'A',
    startAddress: 'Addr A',
    endLocation: 'B',
    endAddress: 'Addr B',
    distanceMiles: 10,
    durationMinutes: 30,
    avgSpeedMph: 30,
    maxSpeedMph: 50,
    energyUsedKwh: 3,
    startChargeLevel: 90,
    endChargeLevel: 85,
    fsdMiles: 8,
    fsdPercentage: 80,
    interventions: 0,
    routePoints: [],
    ...overrides,
  };
}

const drives: Drive[] = [
  makeDrive({ id: 'd1', date: '2026-02-20', startTime: '8:00 AM', distanceMiles: 5, durationMinutes: 20 }),
  makeDrive({ id: 'd2', date: '2026-02-22', startTime: '2:00 PM', distanceMiles: 18, durationMinutes: 75 }),
  makeDrive({ id: 'd3', date: '2026-02-21', startTime: '6:00 PM', distanceMiles: 4, durationMinutes: 45 }),
];

describe('useDriveSort', () => {
  it('defaults to sorting by date (newest first)', () => {
    const { result } = renderHook(() => useDriveSort(drives));

    expect(result.current.sortBy).toBe('date');
    expect(result.current.sortedDrives.map((d) => d.id)).toEqual(['d2', 'd3', 'd1']);
  });

  it('sorts by distance (longest first)', () => {
    const { result } = renderHook(() => useDriveSort(drives));

    act(() => result.current.setSortBy('distance'));

    expect(result.current.sortBy).toBe('distance');
    expect(result.current.sortedDrives.map((d) => d.id)).toEqual(['d2', 'd1', 'd3']);
  });

  it('sorts by duration (longest first)', () => {
    const { result } = renderHook(() => useDriveSort(drives));

    act(() => result.current.setSortBy('duration'));

    expect(result.current.sortBy).toBe('duration');
    expect(result.current.sortedDrives.map((d) => d.id)).toEqual(['d2', 'd3', 'd1']);
  });

  it('can switch back to date sort', () => {
    const { result } = renderHook(() => useDriveSort(drives));

    act(() => result.current.setSortBy('distance'));
    act(() => result.current.setSortBy('date'));

    expect(result.current.sortBy).toBe('date');
    expect(result.current.sortedDrives[0].id).toBe('d2');
  });

  it('returns an empty array when given no drives', () => {
    const { result } = renderHook(() => useDriveSort([]));
    expect(result.current.sortedDrives).toEqual([]);
  });

  it('does not mutate the original array', () => {
    const original = [...drives];
    const { result } = renderHook(() => useDriveSort(drives));

    act(() => result.current.setSortBy('distance'));

    expect(drives.map((d) => d.id)).toEqual(original.map((d) => d.id));
  });
});
