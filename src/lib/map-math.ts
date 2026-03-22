/**
 * Pure math utilities for map camera behavior.
 *
 * Extracted from use-map-follow to keep the hook focused on React state,
 * and to make these functions independently testable.
 */

import type { LngLat } from '@/types/drive';

// ── Map mode types ──────────────────────────────────────────────────────────

/** Selectable map tracking modes (excludes the implicit free/disabled state). */
export type MapMode = 'north-up' | 'heading-up' | 'route-overview';

// ── Speed-based zoom ────────────────────────────────────────────────────────

/** Returns the target zoom level based on vehicle speed in mph. */
export function getSpeedBasedZoom(speedMph: number): number {
  if (speedMph <= 5) return 18;
  if (speedMph <= 15) return 17;
  if (speedMph <= 25) return 16.5;
  if (speedMph <= 35) return 16;
  if (speedMph <= 45) return 15.5;
  if (speedMph <= 55) return 15;
  if (speedMph <= 65) return 14.5;
  return 14;
}

/** Smoothly interpolate between current and target zoom (avoids jarring jumps). */
export function interpolateZoom(current: number, target: number, factor = 0.15): number {
  return current + (target - current) * factor;
}

// ── Bearing math ────────────────────────────────────────────────────────────

/** Computes shortest rotation path between two bearings. */
export function shortestRotation(from: number, to: number): number {
  const diff = ((to - from + 540) % 360) - 180;
  return from + diff;
}

// ── Distance calculation ────────────────────────────────────────────────────

/** Haversine distance between two LngLat points, in meters. */
export function haversineMeters(a: LngLat, b: LngLat): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * sinLon * sinLon;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// ── Mode cycling logic ──────────────────────────────────────────────────────

/**
 * Determines the next mode when the compass button is tapped.
 * From disabled (free mode): first tap recenters without cycling.
 */
export function cycleMapMode(
  current: MapMode,
  hasActiveRoute: boolean,
  isDisabled: boolean,
): MapMode {
  if (isDisabled) return current;
  if (current === 'north-up') return 'heading-up';
  if (current === 'heading-up') return hasActiveRoute ? 'route-overview' : 'north-up';
  if (current === 'route-overview') return 'north-up';
  return 'north-up';
}

// ── Camera movement helper ──────────────────────────────────────────────────

/** Options for moving the camera to match a given mode. */
export interface MoveCameraOptions {
  position: LngLat;
  heading: number;
  speedMph: number;
  currentBearing: number;
  containerHeight: number;
}

/** Camera parameters computed for a given map mode. */
export interface CameraParams {
  center: LngLat;
  bearing: number;
  pitch: number;
  zoom: number;
  offset?: [number, number];
}

/**
 * Computes the camera parameters for a given map mode.
 * Centralises the bearing/pitch/zoom/offset logic that was duplicated
 * across snapBack, cycleMode, recenter, and the follow effect.
 */
export function getCameraParams(
  mode: MapMode,
  opts: MoveCameraOptions,
): CameraParams {
  const zoom = getSpeedBasedZoom(opts.speedMph);

  if (mode === 'heading-up') {
    return {
      center: opts.position,
      bearing: shortestRotation(opts.currentBearing, -opts.heading),
      pitch: 50,
      zoom,
      offset: [0, opts.containerHeight * 0.15],
    };
  }

  // north-up (and fallback for route-overview when used as a flyTo)
  return {
    center: opts.position,
    bearing: 0,
    pitch: 0,
    zoom,
  };
}
