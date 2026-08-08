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

/**
 * The app's numeric App Store ID — THE ONE STRING TO EDIT to switch on Safari's
 * smart app banner (MYR-453).
 *
 * Empty string means "no App Store record exists yet", which is the truth today:
 * MyRoboTaxi ships to a Friends & Family TestFlight group and the App Store
 * Connect app record in `RELEASING.md`'s checklist has never been created, so
 * there is no numeric id to quote. It is NOT a placeholder to be filled with
 * something plausible — `app-id` is the one part of `apple-itunes-app` Safari
 * treats as mandatory, and it validates the value against the store. A guessed
 * or invented id renders a banner that either does not appear or offers a
 * download that 404s, on the one surface an invite recipient has no way to
 * recover from.
 *
 * So the banner is BUILT AND DORMANT: `buildJoinMetadata` emits the tag only
 * when this holds a value, and emits nothing at all while it does not, rather
 * than shipping markup that is inert at best. Once the app record exists, read
 * "Apple ID" off App Store Connect ▸ App Information, paste the digits here, and
 * the tag starts appearing on `/join/{CODE}` with the code as its
 * `app-argument`. Nothing else needs to change — `join-metadata.ts` documents
 * what that argument is and why it is the scheme URL. That flip was exercised
 * once against a dev server before this landed, to be sure the dormant path is
 * a working feature and not an untested branch: with an id set, the page emits
 * `<meta name="apple-itunes-app" content="app-id=…, app-argument=myrobotaxi://join/RBO246">`.
 *
 * Worth knowing before switching it on: the banner is a SAFARI feature. It does
 * nothing in the Telegram/WhatsApp webviews that made MYR-453 a bug, and Safari
 * with the app installed already opens the app via the Universal Link without
 * any banner. Its real value is the not-installed path, which is exactly the
 * path that needs the store listing this constant is waiting on.
 */
export const APPLE_APP_STORE_ID = '';

/** Route prefix for the public invite landing page. */
export const JOIN_ROUTE = '/join';

/**
 * The privacy policy — a public, permanently reachable page.
 *
 * App Store Connect stores this URL against the app record and Apple's review
 * fetches it, so it must answer for an anonymous visitor with no session and no
 * invite link. That is why it appears in `LOCKDOWN_EXEMPT_PREFIXES` and in the
 * proxy's `PUBLIC_PATHS`.
 */
export const PRIVACY_ROUTE = '/privacy';

/**
 * When the current text of the privacy policy took effect.
 *
 * Two spellings of one date: the machine-readable form for `<time dateTime>`
 * and the rendered form. Bump BOTH whenever the policy's substance changes —
 * the page promises the reader that this date tracks the text.
 */
export const PRIVACY_EFFECTIVE_DATE_ISO = '2026-08-03';
export const PRIVACY_EFFECTIVE_DATE = 'August 3, 2026';

/**
 * The two addresses the privacy policy publishes.
 *
 * Split on purpose. A privacy policy that routes "delete my data" and "the app
 * crashed" to one inbox makes the rights it grants harder to exercise than the
 * support it offers, and a data request has to be answerable on a clock. No
 * personal address appears on the page: a policy is a commitment by the
 * company, and the mailbox it names has to outlive whoever is reading it today.
 */
export const PRIVACY_CONTACT_EMAIL = 'privacy@myrobotaxi.app';
export const SUPPORT_CONTACT_EMAIL = 'support@myrobotaxi.app';

/**
 * The legal entity that operates MyRoboTaxi — THE ONE STRING TO EDIT when the
 * client confirms it.
 *
 * Empty string means "not yet provided", and the policy's "Who we are" section
 * renders the honest short form ("MyRoboTaxi operates from the United States").
 * Fill this in with the registered name exactly as incorporated — for example
 * `'MyRoboTaxi, Inc.'` — and the same sentence becomes "MyRoboTaxi is operated
 * by MyRoboTaxi, Inc.". Nothing else needs to change, here or in the page.
 *
 * Deliberately NOT a placeholder like 'TBD': an unfilled slot must degrade to a
 * true sentence, never to a visible gap on a public legal page.
 */
export const LEGAL_ENTITY_NAME = '';

/** The apex route — the coming-soon teaser while the web app is retired. */
export const ROOT_ROUTE = '/';

/** How long an invite code stays valid after the sender creates it. */
export const INVITE_EXPIRY_DAYS = 7;

/**
 * Static link-preview cards served to messaging-app scrapers (1200x630), both
 * generated by `scripts/generate-og-image.mjs`.
 *
 * Same brand ground and lockup, one different line of copy — because the two
 * surfaces are shared with different people. The invite card goes to a
 * recipient who was sent a code; the apex domain is posted publicly, and a card
 * telling the public they are invited would undo the point of putting the
 * invite experience behind a uniquely generated link.
 */
export const INVITE_OG_IMAGE_PATH = '/og/invite-card.png';
export const COMING_SOON_OG_IMAGE_PATH = '/og/coming-soon.png';
