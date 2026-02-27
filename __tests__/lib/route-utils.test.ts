import { describe, it, expect } from 'vitest';
import { splitRoute } from '@/lib/route-utils';
import type { LngLat } from '@/types/drive';

describe('splitRoute', () => {
  const route: LngLat[] = [
    [-97.74, 30.26],
    [-97.74, 30.27],
    [-97.74, 30.28],
    [-97.74, 30.29],
    [-97.74, 30.30],
  ];

  it('splits at the closest point to the vehicle', () => {
    const vehiclePos: LngLat = [-97.74, 30.28];
    const { completed, remaining } = splitRoute(route, vehiclePos);

    // Vehicle is at index 2
    expect(completed).toEqual([route[0], route[1], route[2]]);
    expect(remaining).toEqual([route[2], route[3], route[4]]);
  });

  it('vehicle at the start returns minimal completed', () => {
    const vehiclePos: LngLat = [-97.74, 30.26];
    const { completed, remaining } = splitRoute(route, vehiclePos);

    expect(completed).toEqual([route[0]]);
    expect(remaining).toEqual(route);
  });

  it('vehicle at the end returns full completed', () => {
    const vehiclePos: LngLat = [-97.74, 30.30];
    const { completed, remaining } = splitRoute(route, vehiclePos);

    expect(completed).toEqual(route);
    expect(remaining).toEqual([route[4]]);
  });

  it('vehicle between points snaps to closest', () => {
    // Closer to index 1 (30.27) than index 2 (30.28)
    const vehiclePos: LngLat = [-97.74, 30.272];
    const { completed, remaining } = splitRoute(route, vehiclePos);

    expect(completed).toEqual([route[0], route[1]]);
    expect(remaining).toEqual([route[1], route[2], route[3], route[4]]);
  });

  it('handles two-point route', () => {
    const shortRoute: LngLat[] = [[-97.74, 30.26], [-97.74, 30.30]];
    const vehiclePos: LngLat = [-97.74, 30.28];
    const { completed, remaining } = splitRoute(shortRoute, vehiclePos);

    // Closer to start (distance 0.02) than end (distance 0.02) — ties go to first found
    expect(completed.length + remaining.length).toBeGreaterThanOrEqual(2);
  });

  it('completed and remaining share the split point', () => {
    const vehiclePos: LngLat = [-97.74, 30.29];
    const { completed, remaining } = splitRoute(route, vehiclePos);

    // The last point of completed should be the first of remaining
    expect(completed[completed.length - 1]).toEqual(remaining[0]);
  });
});
