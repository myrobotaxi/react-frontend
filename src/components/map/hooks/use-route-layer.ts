'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

import type { LngLat } from '@/types/drive';
import {
  MAPBOX_GOLD,
  MAPBOX_START_MARKER_COLOR,
} from '@/lib/mapbox';

/** GeoJSON Feature for a LineString with lineMetrics support. */
function lineFeature(coords: LngLat[]): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: coords },
  };
}

/** Empty LineString feature. */
const EMPTY_LINE: GeoJSON.Feature<GeoJSON.LineString> = lineFeature([]);

/** Dim gold for the completed portion of the route. */
const GOLD_DIM = 'rgba(201, 168, 76, 0.3)';
/** Bright gold for the remaining portion. */
const GOLD_BRIGHT = 'rgba(201, 168, 76, 0.9)';

/** Return type of the useRouteLayer hook. */
export interface UseRouteLayerReturn {
  remainingRoute: LngLat[] | undefined;
}

/**
 * Renders the route as a single line with a two-tone gradient.
 *
 * Uses Mapbox's `line-gradient` with `lineMetrics: true` — the gradient
 * stop position is updated via `setPaintProperty` which is a GPU-side
 * operation with zero flicker (unlike setData which re-renders geometry).
 */
export function useRouteLayer(
  map: React.RefObject<mapboxgl.Map | null>,
  mapLoaded: boolean,
  showRoute: boolean,
  routeCoordinates: LngLat[] | undefined,
  vehiclePosition: LngLat,
): UseRouteLayerReturn {
  const startMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const endMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const sourceAddedRef = useRef(false);
  const [remainingRoute, setRemainingRoute] = useState<LngLat[] | undefined>(undefined);
  const progressRef = useRef(0);

  // ── Create source and layer once when route first appears ──────────────
  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded) return;

    if (!showRoute || !routeCoordinates || routeCoordinates.length < 2) {
      cleanup(m, startMarkerRef, endMarkerRef);
      sourceAddedRef.current = false;
      setRemainingRoute(undefined);
      return;
    }

    if (!sourceAddedRef.current) {
      const setup = () => {
        try {
          if (!m.getSource('route')) {
            m.addSource('route', {
              type: 'geojson',
              data: lineFeature(routeCoordinates),
              lineMetrics: true,
            });
          }
          if (!m.getLayer('route-line')) {
            m.addLayer({
              id: 'route-line',
              type: 'line',
              source: 'route',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: {
                'line-width': 4,
                'line-gradient': [
                  'interpolate', ['linear'], ['line-progress'],
                  0, GOLD_BRIGHT,
                  1, GOLD_BRIGHT,
                ],
              },
            });
          }
        } catch (err) {
          console.error('[useRouteLayer] setup failed:', err);
        }

        sourceAddedRef.current = true;
        addEndpointMarkers(m, routeCoordinates, startMarkerRef, endMarkerRef);
        setRemainingRoute(routeCoordinates);
      };

      if (m.isStyleLoaded()) {
        setup();
      } else {
        m.once('style.load', setup);
      }
    } else {
      // Route coordinates changed — update source data
      const src = m.getSource('route') as mapboxgl.GeoJSONSource | undefined;
      if (src) {
        src.setData(lineFeature(routeCoordinates));
      }
      setRemainingRoute(routeCoordinates);
    }

    return () => {
      cleanup(m, startMarkerRef, endMarkerRef);
      sourceAddedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, mapLoaded, showRoute, routeCoordinates]);

  // ── Update gradient progress on vehicle position change ────────────────
  // setPaintProperty is a GPU-side operation — zero flicker.
  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded || !showRoute || !routeCoordinates || routeCoordinates.length < 2) {
      return;
    }
    if (!sourceAddedRef.current || !m.getLayer('route-line')) return;

    const progress = computeProgress(routeCoordinates, vehiclePosition);
    progressRef.current = progress;

    // Clamp to avoid gradient artifacts at boundaries
    const p = Math.max(0.001, Math.min(progress, 0.999));

    try {
      m.setPaintProperty('route-line', 'line-gradient', [
        'interpolate', ['linear'], ['line-progress'],
        0, GOLD_DIM,
        p, GOLD_DIM,
        p, GOLD_BRIGHT,
        1, GOLD_BRIGHT,
      ]);
    } catch {
      // Layer might not exist yet during initial render
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, mapLoaded, showRoute, routeCoordinates, vehiclePosition[0], vehiclePosition[1]]);

  return { remainingRoute };
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Compute vehicle's progress along the route as a fraction 0-1. */
function computeProgress(route: LngLat[], vehiclePos: LngLat): number {
  if (route.length < 2) return 0;

  let totalDist = 0;
  const segDists: number[] = [];
  for (let i = 1; i < route.length; i++) {
    const d = quickDist(route[i - 1], route[i]);
    segDists.push(d);
    totalDist += d;
  }
  if (totalDist === 0) return 0;

  // Find closest segment to vehicle
  let minDist = Infinity;
  let closestIdx = 0;
  for (let i = 0; i < route.length; i++) {
    const d = quickDist(route[i], vehiclePos);
    if (d < minDist) {
      minDist = d;
      closestIdx = i;
    }
  }

  // Sum distance up to closest point
  let traveled = 0;
  for (let i = 0; i < closestIdx && i < segDists.length; i++) {
    traveled += segDists[i];
  }

  return traveled / totalDist;
}

/** Fast approximate distance (squared degrees — fine for comparison). */
function quickDist(a: LngLat, b: LngLat): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}

/** Add start (green) and end (gold) endpoint markers. */
function addEndpointMarkers(
  m: mapboxgl.Map,
  route: LngLat[],
  startRef: React.MutableRefObject<mapboxgl.Marker | null>,
  endRef: React.MutableRefObject<mapboxgl.Marker | null>,
): void {
  const startEl = document.createElement('div');
  startEl.style.cssText = `width:10px;height:10px;border-radius:50%;background:${MAPBOX_START_MARKER_COLOR};border:2px solid rgba(255,255,255,0.5);box-shadow:0 0 6px rgba(48,209,88,0.5);`;
  startRef.current = new mapboxgl.Marker({ element: startEl })
    .setLngLat(route[0])
    .addTo(m);

  const endEl = document.createElement('div');
  endEl.style.cssText = `width:10px;height:10px;border-radius:50%;background:${MAPBOX_GOLD};border:2px solid rgba(255,255,255,0.5);box-shadow:0 0 6px rgba(201,168,76,0.5);`;
  endRef.current = new mapboxgl.Marker({ element: endEl })
    .setLngLat(route[route.length - 1])
    .addTo(m);
}

/** Remove route layer, source, and markers. */
function cleanup(
  m: mapboxgl.Map,
  startRef: React.MutableRefObject<mapboxgl.Marker | null>,
  endRef: React.MutableRefObject<mapboxgl.Marker | null>,
): void {
  try { if (m.getLayer('route-line')) m.removeLayer('route-line'); } catch { /* */ }
  try { if (m.getSource('route')) m.removeSource('route'); } catch { /* */ }
  // Also clean up old two-source layers if present
  for (const id of ['route-completed', 'route-remaining']) {
    try { if (m.getLayer(id)) m.removeLayer(id); } catch { /* */ }
    try { if (m.getSource(id)) m.removeSource(id); } catch { /* */ }
  }
  startRef.current?.remove();
  startRef.current = null;
  endRef.current?.remove();
  endRef.current = null;
}
