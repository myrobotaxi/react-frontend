/**
 * App-wide layout constants and configuration values.
 * No React code — importable from both server and client contexts.
 */

/** Bottom sheet peek height in pixels. */
export const SHEET_PEEK_HEIGHT = 260;

/** Bottom sheet half-state height as a fraction of viewport height. */
export const SHEET_HALF_FRACTION = 0.5;

/** Bottom sheet full-state height as a fraction of viewport height (leaves room for status bar). */
export const SHEET_FULL_FRACTION = 0.9;

/** Shared viewer bottom sheet peek height in pixels (no BottomNav overlap). */
export const SHARED_SHEET_PEEK_HEIGHT = 200;

/** Shared viewer bottom sheet half height in pixels. */
export const SHARED_SHEET_HALF_HEIGHT = 340;

/** Sheet height transition duration (seconds). */
export const SHEET_TRANSITION_DURATION = 0.3;

/** Sheet transition easing function. */
export const SHEET_TRANSITION_EASING = 'ease-out';

/** WebSocket reconnection config. */
export const WS_RECONNECT_BASE_DELAY = 1_000;
export const WS_RECONNECT_MAX_DELAY = 30_000;
export const WS_RECONNECT_MULTIPLIER = 2;
export const WS_RECONNECT_JITTER_FACTOR = 0.1;

/** Fallback polling interval when WebSocket is unavailable (ms). */
export const FALLBACK_POLL_INTERVAL = 10_000;

/** Routes where the bottom nav is hidden. */
export const HIDDEN_NAV_ROUTES = ['/signin', '/signup', '/empty', '/shared'];

/** JWT claims for telemetry server authentication. Must match auth.token_issuer / auth.token_audience in the Go server config. */
export const JWT_ISSUER = 'myrobotaxi';
export const JWT_AUDIENCE = 'telemetry';

/** Tesla virtual key pairing deep link. */
export const TESLA_KEY_PAIRING_URL = 'https://tesla.com/_ak/myrobotaxi.app';

/** Public origin this app is served from. Used to absolutize link-preview asset URLs. */
export const SITE_ORIGIN = 'https://myrobotaxi.app';

/**
 * Public TestFlight join link for the iOS app (Friends & Family external group).
 * Mirrors `AppDistribution.testFlightPublicJoinURL` in the iOS repo — the two
 * must quote the same URL. Capped at 100 testers by App Store Connect.
 */
export const TESTFLIGHT_JOIN_URL = 'https://testflight.apple.com/join/uarZRUbg';

/** Route prefix for the public invite landing page. */
export const JOIN_ROUTE = '/join';

/** The apex route — the coming-soon teaser while the web app is retired. */
export const ROOT_ROUTE = '/';

/** How long an invite code stays valid after the sender creates it. */
export const INVITE_EXPIRY_DAYS = 7;

/** Static link-preview card served to messaging-app scrapers (1200x630). */
export const INVITE_OG_IMAGE_PATH = '/og/invite-card.png';
