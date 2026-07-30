/**
 * Retired-app lockdown.
 *
 * MyRoboTaxi's web app is deprecated as a product, but the apex domain is still
 * the public face of the iOS app's invite links. Everything except the invite
 * surface and the endpoints that outside systems are registered against is
 * redirected to /join, so a recipient who taps an invite link cannot wander
 * into a retired product.
 *
 * This module is the whole policy. Reverting the commit that added it (and its
 * six-line call site in proxy.ts) restores the previous routing exactly.
 *
 * No React code — imported by the proxy, which runs on the edge runtime.
 */

import { JOIN_ROUTE } from './constants';

/** Where every locked-down route lands: the codeless invite landing. */
export const LOCKDOWN_REDIRECT_PATH = JOIN_ROUTE;

/** Temporary, not permanent — this is a product decision, not a moved URL. */
export const LOCKDOWN_REDIRECT_STATUS = 302;

/**
 * Path prefixes that stay reachable.
 *
 * Each entry is load-bearing:
 *
 * - `/join` — the invite surface itself, and the redirect target. Exempting it
 *   is also what stops the redirect from looping.
 * - `/.well-known` — `apple-app-site-association` (Apple's CDN fetches it to
 *   enable Universal Links; a redirect here silently disables them) and
 *   `appspecific/com.tesla.3p.public-key.pem` (registered with Tesla's Fleet
 *   API partner account; virtual-key pairing at tesla.com/_ak/myrobotaxi.app
 *   reads it from this domain).
 * - `/api/auth` — NextAuth callbacks. `/api/auth/callback/tesla` is registered
 *   as an Allowed Redirect URI in the Tesla developer portal, and the Google
 *   and Apple equivalents are registered with those providers. Redirecting
 *   them breaks a live third-party registration rather than a page.
 * - `/_next`, `/favicon.ico`, `/og` — build output, icon, and the link-preview
 *   card. Scrapers fetch the og image directly and must not be bounced.
 *
 * Deliberately NOT exempt: `/monitoring`, the Sentry tunnel from
 * next.config.mjs. The pre-existing auth gate below already redirects it for
 * anyone without a session, and every invite recipient is anonymous by
 * definition — so browser-side Sentry never reached the tunnel from /join,
 * with or without this lockdown. Exempting it would lengthen the list without
 * changing behaviour.
 */
export const LOCKDOWN_EXEMPT_PREFIXES = [
  '/join',
  '/.well-known',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/og',
] as const;

/**
 * Returns true when `pathname` may be served normally.
 *
 * Prefix matching is boundary-aware: `/joinery` is not exempt just because it
 * starts with `/join`.
 */
export function isLockdownExempt(pathname: string): boolean {
  return LOCKDOWN_EXEMPT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
