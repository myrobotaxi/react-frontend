'use client';

import 'mapbox-gl/dist/mapbox-gl.css';

import type { LngLat } from '@/types/drive';
import { MAPBOX_DEFAULT_CENTER, MAPBOX_DEFAULT_ZOOM, MAPBOX_GOLD } from '@/lib/mapbox';

import { useMapInstance } from './hooks/use-map-instance';
import { useVehicleMarker } from './hooks/use-vehicle-marker';
import { useRouteLayer } from './hooks/use-route-layer';
import { useMapFollow } from './hooks/use-map-follow';
import { MapModeButton } from './MapModeButton';

/** Props for the VehicleMap component. */
export interface VehicleMapProps {
  /** Show the pulsing gold vehicle marker. */
  showVehicleMarker?: boolean;
  /** Show the two-tone route line. */
  showRoute?: boolean;
  /** Route coordinates as [lng, lat] pairs. */
  routeCoordinates?: LngLat[];
  /** Current vehicle position [lng, lat]. */
  vehiclePosition?: LngLat;
  /** Vehicle heading in degrees (0=North). */
  heading?: number;
  /** Vehicle speed in mph (used for speed-based zoom). */
  speed?: number;
  /** Map center [lng, lat]. */
  center?: LngLat;
  /** Map zoom level. */
  zoom?: number;
  /** Whether map is interactive (pan/zoom). */
  interactive?: boolean;
  /** Bottom offset for the recenter button (pixels). Defaults to 310. */
  fitButtonBottom?: number;
  /** Children rendered as overlays on the map. */
  children?: React.ReactNode;
}

/**
 * Full-screen Mapbox GL JS map with vehicle marker, route rendering, and overlays.
 * Must be dynamically imported with `ssr: false` — Mapbox depends on `window`.
 *
 * Composed from focused hooks:
 * - useMapInstance: map creation + lifecycle
 * - useVehicleMarker: gold pulsing marker + heading rotation
 * - useRouteLayer: two-tone route + start/end markers
 * - useMapFollow: Tesla-like follow/free mode with snap-back
 */
export function VehicleMap({
  showVehicleMarker = true,
  showRoute = false,
  routeCoordinates,
  vehiclePosition,
  heading = 0,
  speed = 0,
  center = MAPBOX_DEFAULT_CENTER,
  zoom = MAPBOX_DEFAULT_ZOOM,
  fitButtonBottom = 310,
  interactive = true,
  children,
}: VehicleMapProps) {
  // Guard against 0,0 coordinates (Tesla returns null when vehicle is asleep/offline,
  // mapper defaults to 0). Fall back to the Mapbox default center.
  const validCenter: LngLat =
    center[0] === 0 && center[1] === 0 ? MAPBOX_DEFAULT_CENTER : center;

  const { mapContainer, map, mapLoaded } = useMapInstance(validCenter, zoom, interactive);

  const markerPos = vehiclePosition ?? validCenter;
  useVehicleMarker(map, mapLoaded, showVehicleMarker, markerPos, heading);

  const hasActiveRoute = showRoute && !!routeCoordinates && routeCoordinates.length >= 2;

  const { remainingRoute } = useRouteLayer(
    map, mapLoaded, showRoute, routeCoordinates, markerPos,
  );

  const { mapMode, isDisabled, isOffCenter, cycleMode, recenter } = useMapFollow(
    map, mapLoaded, markerPos, heading, speed, hasActiveRoute, remainingRoute,
  );

  return (
    <div className="absolute inset-0" role="img" aria-label="Vehicle map">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" aria-hidden="true" />

      {/* Map mode button — top-right, always visible when interactive */}
      {interactive && (
        <MapModeButton
          mapMode={mapMode}
          isDisabled={isDisabled}
          onClick={cycleMode}
        />
      )}

      {/* Recenter button — bottom-right, only when off-center */}
      {isOffCenter && (
        <RecenterButton onClick={recenter} bottom={fitButtonBottom} />
      )}

      {children}
    </div>
  );
}

/** Shared style object for floating map buttons. */
const MAP_BUTTON_STYLE = {
  background: 'rgba(30,30,30,0.85)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,0.12)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
};

/** Recenter-on-vehicle floating button — shown when map is panned away. */
function RecenterButton({ onClick, bottom }: { onClick: () => void; bottom: number }) {
  return (
    <button
      onClick={onClick}
      className="absolute z-30 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer animate-in fade-in duration-300"
      style={{ bottom, right: 16, ...MAP_BUTTON_STYLE }}
      aria-label="Recenter on vehicle"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="3" stroke={MAPBOX_GOLD} strokeWidth="1.5" />
        <line x1="10" y1="2" x2="10" y2="5" stroke={MAPBOX_GOLD} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="10" y1="15" x2="10" y2="18" stroke={MAPBOX_GOLD} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="2" y1="10" x2="5" y2="10" stroke={MAPBOX_GOLD} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="15" y1="10" x2="18" y2="10" stroke={MAPBOX_GOLD} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}
