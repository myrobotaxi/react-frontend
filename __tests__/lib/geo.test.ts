import { describe, it, expect } from 'vitest';

import { routePointsToLngLat } from '@/lib/geo';
import type { RoutePoint } from '@/lib/geo';

// ─── routePointsToLngLat ─────────────────────────────────────────────────────

describe('routePointsToLngLat', () => {
  it('returns empty array for empty input', () => {
    expect(routePointsToLngLat([])).toEqual([]);
  });

  it('converts {lat, lng} objects to [lng, lat] tuples (GeoJSON order)', () => {
    const points: RoutePoint[] = [
      { lat: 33.09, lng: -96.82, timestamp: '2026-01-01T12:00:00Z', speed: 45 },
      { lat: 30.267, lng: -97.743, timestamp: '2026-01-01T12:05:00Z', speed: 55 },
    ];
    const result = routePointsToLngLat(points);
    expect(result).toEqual([
      [-96.82, 33.09],
      [-97.743, 30.267],
    ]);
  });

  it('puts longitude first and latitude second in each tuple', () => {
    const points: RoutePoint[] = [
      { lat: 30.325, lng: -97.738, timestamp: '2026-01-01T12:00:00Z', speed: 0 },
    ];
    const result = routePointsToLngLat(points);
    expect(result).toHaveLength(1);
    // result[0][0] = longitude, result[0][1] = latitude
    expect(result[0][0]).toBe(-97.738);
    expect(result[0][1]).toBe(30.325);
  });

  it('preserves all points in order', () => {
    const points: RoutePoint[] = [
      { lat: 30.0, lng: -97.0, timestamp: '2026-01-01T12:00:00Z', speed: 30 },
      { lat: 30.1, lng: -97.1, timestamp: '2026-01-01T12:01:00Z', speed: 40 },
      { lat: 30.2, lng: -97.2, timestamp: '2026-01-01T12:02:00Z', speed: 50 },
      { lat: 30.3, lng: -97.3, timestamp: '2026-01-01T12:03:00Z', speed: 60 },
    ];
    const result = routePointsToLngLat(points);
    expect(result).toHaveLength(4);
    expect(result[0]).toEqual([-97.0, 30.0]);
    expect(result[3]).toEqual([-97.3, 30.3]);
  });
});
