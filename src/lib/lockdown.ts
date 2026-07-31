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
import { isInviteCodeShaped } from './invite-code';

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
 * redirect target itself and a code-shaped invite link — are handled in
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
 * 2. `/join/{CODE}`, where the segment is SHAPED like a code (six
 *    alphanumerics, either case). Bare `/join` carries no invitation, and
 *    neither does `/join/1234` — those go to the teaser like any other retired
 *    route, so a URL that could not be an invite link never reaches the invite
 *    page.
 * 3. One of the prefixes above, with or without a subpath.
 *
 * Prefix matching is boundary-aware: `/joinery` is not exempt just because it
 * starts with `/join`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SHAPE, NOT VALIDITY — do not "fix" this by looking the code up.
 *
 * A well-formed segment is served whether or not the code exists, is unexpired,
 * or was ever minted. That is deliberate, and it is the whole design:
 *
 *  • This runs in the edge proxy on EVERY request. A database lookup here would
 *    put the invite table in front of unauthenticated traffic from anyone who
 *    can type a URL.
 *  • Answering differently for a real code than for a well-formed fake one
 *    turns this route into an oracle: 36^6 guesses, answered by a redirect, is
 *    an enumeration API for bearer-grade codes. `/join/[code]` returns 200 for
 *    every well-formed segment for exactly this reason, and the page never
 *    validates or redeems — the app does that, after the recipient installs it.
 *
 * Shape is public information (the format is in every invite link ever sent);
 * existence is not. This gate only spends the former.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function isLockdownExempt(pathname: string): boolean {
  if (pathname === LOCKDOWN_REDIRECT_PATH) return true;

  if (pathname.startsWith(`${JOIN_ROUTE}/`)) {
    return isInviteCodeShaped(pathname.slice(JOIN_ROUTE.length + 1));
  }

  return LOCKDOWN_EXEMPT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
