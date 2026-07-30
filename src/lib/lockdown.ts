/**
 * Retired-app lockdown.
 *
 * MyRoboTaxi's web app is deprecated as a product, but the apex domain is still
 * the public face of the iOS app's invite links. Everything except a live invite
 * link and the endpoints that outside systems are registered against is
 * redirected to `/` — the coming-soon teaser — so nobody can wander into a
 * retired product, and so the invite experience stays something only a real
 * invite link opens.
 *
 * This module is the whole policy. Reverting the commit that added it (and its
 * six-line call site in proxy.ts) restores the previous routing exactly.
 *
 * No React code — imported by the proxy, which runs on the edge runtime.
 */

import { JOIN_ROUTE, ROOT_ROUTE } from './constants';

/**
 * Whether the lockdown is active. On unless explicitly switched off, so a
 * missing or misspelled env var leaves the site locked rather than open.
 *
 * The only intended consumer of the off switch is the Playwright suite, which
 * still exercises the retired app's routes end-to-end (see playwright.config).
 * Production sets nothing.
 *
 * NOTE: this file runs in the edge proxy, where Next inlines `process.env.*` at
 * BUILD time. Verified locally: the switch takes effect in `next dev`, and in a
 * production build only if the variable was set when the build ran. Flipping it
 * on Vercel therefore needs a redeploy — which a Vercel env-var change triggers
 * anyway. To undo the lockdown for good, revert its commit rather than relying
 * on the switch.
 */
export function isLockdownEnabled(): boolean {
  return process.env.LOCKDOWN_DISABLED !== '1';
}

/**
 * Where every locked-down route lands: the coming-soon teaser at the root.
 *
 * It used to be `/join`. That handed the invite landing to everyone who typed
 * the bare domain, which is exactly backwards — invite links are uniquely
 * generated, and the page behind one should be reachable only by someone
 * holding one.
 */
export const LOCKDOWN_REDIRECT_PATH = ROOT_ROUTE;

/** Temporary, not permanent — this is a product decision, not a moved URL. */
export const LOCKDOWN_REDIRECT_STATUS = 302;

/**
 * Path prefixes that stay reachable, with or without a subpath.
 *
 * Each entry is load-bearing:
 *
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
 * The two paths NOT in this list because they are not simple prefixes — the
 * redirect target itself and a code-bearing invite link — are handled in
 * `isLockdownExempt`.
 *
 * Deliberately NOT exempt: `/monitoring`, the Sentry tunnel from
 * next.config.mjs. The pre-existing auth gate below already redirects it for
 * anyone without a session, and every invite recipient is anonymous by
 * definition — so browser-side Sentry never reached the tunnel from the public
 * pages, with or without this lockdown. Exempting it would lengthen the list
 * without changing behaviour.
 */
export const LOCKDOWN_EXEMPT_PREFIXES = [
  '/.well-known',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/og',
] as const;

/**
 * Returns true when `pathname` may be served normally.
 *
 * Three ways to qualify:
 *
 * 1. The redirect target `/` itself — the teaser. Exempting it is what stops
 *    the redirect from looping.
 * 2. `/join/{CODE}` — an invite link. The code is what makes it one: bare
 *    `/join` carries no invitation, so it goes to the teaser like any other
 *    retired route. Whether the segment is a *valid* code is deliberately not
 *    checked here — the URL shape is the signal, and `/join/[code]` answers 200
 *    with generic copy for anything unparseable rather than telling a scraper
 *    which codes are well-formed.
 * 3. One of the prefixes above, with or without a subpath.
 *
 * Prefix matching is boundary-aware: `/joinery` is not exempt just because it
 * starts with `/join`.
 */
export function isLockdownExempt(pathname: string): boolean {
  if (pathname === LOCKDOWN_REDIRECT_PATH) return true;

  if (pathname.startsWith(`${JOIN_ROUTE}/`) && pathname.length > JOIN_ROUTE.length + 1) {
    return true;
  }

  return LOCKDOWN_EXEMPT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
