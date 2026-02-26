/**
 * Mapbox configuration constants.
 * The access token is read from the NEXT_PUBLIC_MAPBOX_TOKEN env var.
 * Map components import the token from here — never hardcode in component files.
 */

/** Mapbox GL access token for map rendering. */
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

/** Dark map style matching the Tesla Robotaxi aesthetic. */
export const MAPBOX_STYLE = 'mapbox://styles/mapbox/dark-v11';

/** Default map center: Austin, TX. */
export const MAPBOX_DEFAULT_CENTER: [number, number] = [-97.7431, 30.2672];

/** Default map zoom level. */
export const MAPBOX_DEFAULT_ZOOM = 12;

/** Padding for fitBounds — bottom accounts for the bottom sheet. */
export const MAPBOX_FIT_BOUNDS_PADDING = {
  top: 80,
  bottom: 300,
  left: 60,
  right: 60,
};

/** Maximum zoom when fitting to route bounds. */
export const MAPBOX_FIT_BOUNDS_MAX_ZOOM = 15;

/** Brand gold color used for route lines and markers. */
export const MAPBOX_GOLD = '#C9A84C';

/** Green color for route start markers. */
export const MAPBOX_START_MARKER_COLOR = '#30D158';

if (!MAPBOX_TOKEN && typeof window !== 'undefined') {
  console.error('[Mapbox] NEXT_PUBLIC_MAPBOX_TOKEN is not set.');
}
