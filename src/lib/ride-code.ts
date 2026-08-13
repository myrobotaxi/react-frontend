/**
 * Ride-join-code parsing for the public /ride landing page (MYR-540).
 *
 * A group ride mints ONE shareable link when the owner accepts it. The code in
 * that link is a bearer credential exactly like an invite code — whoever holds
 * it can join the ride, see the car on a live map, and edit the trip — so it
 * must never be logged, echoed into telemetry, or baked into a shared asset
 * (link-preview images, og:*).
 *
 * ── WHY THIS IS A SEPARATE MODULE FROM `invite-code.ts` ─────────────────────
 * The two shapes are IDENTICAL today, and the temptation is to import one from
 * the other. They are kept apart on purpose. An invite code is minted by the
 * iOS app and admits somebody to an ACCOUNT relationship that outlives any
 * single trip; a ride code is minted by the telemetry service at accept and
 * dies with the ride. Two servers, two lifetimes, two contracts — the day one
 * of them widens its alphabet or its length, the other must NOT silently
 * follow, and a shared regex is how that happens without anyone deciding it.
 * The duplication is the seam.
 *
 * ── SHAPE IS AN ASSUMPTION THIS FILE OWNS ───────────────────────────────────
 * MYR-540 specifies the share URL as "the MYR-368 signed-link idiom" and does
 * not otherwise pin the code's alphabet, so this mirrors the invite code: six
 * `[A-Z0-9]`. If the contracts repo mints a different shape, THIS FILE is the
 * one to change — and `lib/lockdown.ts` must change with it, because a
 * `/ride/{CODE}` that fails the shape test is 302'd to the teaser before it
 * ever reaches the page.
 *
 * No React code — importable from server components, route handlers, and the
 * proxy (edge runtime).
 */

/** Number of characters in a well-formed ride join code. */
export const RIDE_CODE_LENGTH = 6;

/** Canonical shape of a ride code: exactly six uppercase alphanumerics. */
const RIDE_CODE_PATTERN = /^[A-Z0-9]{6}$/;

/**
 * The same shape as it may appear in a URL, where case is not the sender's to
 * control: messaging apps lowercase links, and people hand-type them.
 *
 * Nothing else is forgiven. No trimming, no separators, no percent escapes — a
 * segment either looks exactly like a code or it is not a ride link.
 */
const RIDE_CODE_SEGMENT_PATTERN = /^[A-Za-z0-9]{6}$/;

/**
 * Whether a raw URL path segment has the shape of a ride join code.
 *
 * A SHAPE test, not a validity test: it says the URL is addressed to the ride
 * join surface, nothing about whether the ride exists, is still running, or is
 * joinable. Used by the lockdown (`lib/lockdown.ts`) to decide whether a
 * `/ride/…` URL is a share link at all.
 *
 * The oracle argument from `invite-code.ts` applies here with more force: ride
 * membership is an ACL that grants viewer-tier access to somebody's car, so a
 * gate that answered differently for a live ride than for a well-formed fake
 * one would be an enumeration API pointed at exactly that. Shape is public
 * information — the format is in every share link ever sent. Existence is not.
 *
 * @param segment - Untrusted path segment, exactly as it appears in the URL.
 */
export function isRideCodeShaped(segment: string | undefined | null): boolean {
  return typeof segment === 'string' && RIDE_CODE_SEGMENT_PATTERN.test(segment);
}

/**
 * Normalizes a raw route segment into a canonical ride join code.
 *
 * Lowercase input is upper-cased (messaging apps and keyboards mangle case),
 * surrounding whitespace is trimmed, and anything else — wrong length, symbols,
 * separators, non-ASCII lookalikes — yields `null` rather than a "cleaned up"
 * guess. A caller that receives `null` renders the surface with no app-open
 * button, never a partially-salvaged code.
 *
 * @param raw - Untrusted route segment (already URL-decoded by the router).
 * @returns The canonical code, or `null` when the input is not a valid code.
 */
export function sanitizeRideCode(raw: string | undefined | null): string | null {
  if (typeof raw !== 'string') return null;

  const normalized = raw.trim().toUpperCase();
  if (!RIDE_CODE_PATTERN.test(normalized)) return null;

  return normalized;
}

/** Placeholder substituted for a code in any string headed for a log sink. */
export const REDACTED_RIDE_CODE_PATH = '/ride/[code]';

/**
 * Matches a code-carrying ride path anywhere inside a larger string (a full
 * URL, a transaction name, a breadcrumb message). The trailing boundary check
 * keeps a longer segment from being partially rewritten.
 */
const RIDE_PATH_WITH_CODE = /\/ride\/[A-Za-z0-9]{6}(?![A-Za-z0-9])/g;

/**
 * Replaces `/ride/{CODE}` with `/ride/[code]` in an arbitrary string.
 *
 * Request URLs are the back door through which a bearer-grade code ends up in
 * a log or an error tracker without anyone deciding to log it.
 */
export function redactRideCodePaths(value: string): string {
  return value.replace(RIDE_PATH_WITH_CODE, REDACTED_RIDE_CODE_PATH);
}
