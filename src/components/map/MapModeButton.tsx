'use client';

import type { MapMode } from '@/lib/map-math';
import { MAP_BUTTON_STYLE, MAPBOX_GOLD } from '@/lib/mapbox';

/** Disabled (free mode) icon color. */
const DISABLED_COLOR = 'rgba(255,255,255,0.3)';

/** Props for the MapModeButton component. */
interface MapModeButtonProps {
  /** Current tracking mode. */
  mapMode: MapMode;
  /** Whether tracking is disabled (free/user-gesture mode). */
  isDisabled: boolean;
  /** Handler for button tap — cycles mode or recenters. */
  onClick: () => void;
}

/**
 * Compass/orientation button that cycles through map tracking modes.
 *
 * Positioned top-right of the map. Displays different icons per mode:
 * - North-Up: arrow pointing up (compass north)
 * - Heading-Up: navigation cone/triangle
 * - Route Overview: four-corner expand icon
 *
 * Active color is gold; gray when tracking is disabled.
 */
export function MapModeButton({ mapMode, isDisabled, onClick }: MapModeButtonProps) {
  const color = isDisabled ? DISABLED_COLOR : MAPBOX_GOLD;
  const label = isDisabled
    ? 'Recenter on vehicle'
    : mapMode === 'north-up'
      ? 'Switch to heading-up mode'
      : mapMode === 'heading-up'
        ? 'Switch to route overview'
        : 'Switch to north-up mode';

  return (
    <button
      onClick={onClick}
      className="absolute z-30 w-10 h-10 rounded-[10px] flex items-center justify-center cursor-pointer"
      style={{ top: 16, right: 16, ...MAP_BUTTON_STYLE, transition: 'color 300ms ease' }}
      aria-label={label}
    >
      {mapMode === 'north-up' && <NorthUpIcon color={color} />}
      {mapMode === 'heading-up' && <HeadingUpIcon color={color} />}
      {mapMode === 'route-overview' && <RouteOverviewIcon color={color} />}
    </button>
  );
}

/** North-Up icon: compass arrow pointing north with "N" label. */
function NorthUpIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <polygon points="10,2 7,12 10,10 13,12" fill={color} />
      <text x="10" y="18" textAnchor="middle" fill={color} fontSize="5" fontWeight="600">
        N
      </text>
    </svg>
  );
}

/** Heading-Up icon: navigation cone/triangle pointing up. */
function HeadingUpIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <polygon points="10,1 4,18 10,14 16,18" fill={color} opacity="0.9" />
    </svg>
  );
}

/** Route Overview icon: four-corner expand brackets. */
function RouteOverviewIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 7V3H7" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 3H17V7" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 13V17H13" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 17H3V13" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
