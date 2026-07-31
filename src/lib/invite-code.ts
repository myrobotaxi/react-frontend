/**
 * Invite-code parsing for the public /join landing page.
 *
 * An invite code is a 6-character `[A-Z0-9]` string minted by the iOS app and
 * handed to a recipient over a messaging app. It behaves like a bearer secret:
 * whoever holds it can claim the invite, so it must never be logged, echoed
 * into telemetry, or embedded in shared assets (link-preview images, og:*).
 *
 * No React code — importable from server components, route handlers, and the
 * proxy (edge runtime).
 */

/** Number of characters in a well-formed invite code. */
export const INVITE_CODE_LENGTH = 6;

/** Canonical shape of an invite code: exactly six uppercase alphanumerics. */
const INVITE_CODE_PATTERN = /^[A-Z0-9]{6}$/;

/**
 * The same shape as it may appear in a URL, where case is not the sender's to
 * control: messaging apps lowercase links, and people hand-type them.
 *
 * Nothing else is forgiven. No trimming, no separators, no percent escapes — a
 * segment either looks exactly like a code or it is not an invite link.
 */
const INVITE_CODE_SEGMENT_PATTERN = /^[A-Za-z0-9]{6}$/;

/**
 * Whether a raw URL path segment has the shape of an invite code.
 *
 * A SHAPE test, not a validity test: it says the URL is addressed to the invite
 * surface, nothing about whether the code exists, is unexpired, or is
 * redeemable. Used by the lockdown (`lib/lockdown.ts`) to decide whether a
 * `/join/…` URL is an invite link at all; `sanitizeInviteCode` is what the page
 * then renders through.
 *
 * @param segment - Untrusted path segment, exactly as it appears in the URL.
 */
export function isInviteCodeShaped(segment: string | undefined | null): boolean {
  return typeof segment === 'string' && INVITE_CODE_SEGMENT_PATTERN.test(segment);
}

/**
 * Normalizes a raw route segment into a canonical invite code.
 *
 * The page renders this value verbatim, so the contract is deliberately strict:
 * lowercase input is upper-cased (messaging apps and keyboards mangle case),
 * surrounding whitespace is trimmed, and anything else — wrong length, symbols,
 * separators, non-ASCII lookalikes — yields `null` rather than a "cleaned up"
 * guess. A caller that receives `null` shows the generic invite copy with no
 * code, never a partially-salvaged one.
 *
 * @param raw - Untrusted route segment (already URL-decoded by the router).
 * @returns The canonical code, or `null` when the input is not a valid code.
 */
export function sanitizeInviteCode(raw: string | undefined | null): string | null {
  if (typeof raw !== 'string') return null;

  const normalized = raw.trim().toUpperCase();
  if (!INVITE_CODE_PATTERN.test(normalized)) return null;

  return normalized;
}

/** Placeholder substituted for a code in any string headed for a log sink. */
export const REDACTED_INVITE_CODE_PATH = '/join/[code]';

/**
 * Matches a code-carrying join path anywhere inside a larger string (a full
 * URL, a transaction name, a breadcrumb message). The trailing boundary check
 * keeps a longer segment from being partially rewritten.
 */
const JOIN_PATH_WITH_CODE = /\/join\/[A-Za-z0-9]{6}(?![A-Za-z0-9])/g;

/**
 * Replaces `/join/{CODE}` with `/join/[code]` in an arbitrary string.
 *
 * Request URLs are the back door through which a bearer-grade code ends up in
 * a log or an error tracker without anyone deciding to log it.
 */
export function redactInviteCodePaths(value: string): string {
  return value.replace(JOIN_PATH_WITH_CODE, REDACTED_INVITE_CODE_PATH);
}
