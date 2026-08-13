/**
 * Which routes an anonymous visitor may reach.
 *
 * Extracted from `proxy.ts` for the same reason `lockdown.ts` lives here: the
 * proxy runs on the edge runtime behind `auth()`, which makes it awkward to
 * import into a unit test, and this list is a policy worth asserting on
 * directly. The proxy still owns the decision — this module only answers the
 * question.
 *
 * Note the third gate: `beta-gate.ts` keeps its own allow-list, and a route
 * that must stay public needs to appear in both.
 *
 * No React code — imported by the proxy, which runs on the edge runtime.
 */

import {
  JOIN_ROUTE,
  PRIVACY_ROUTE,
  RIDE_ROUTE,
  STATUS_CRON_ROUTE,
  STATUS_ROUTE,
} from './constants';

/**
 * Prefixes served without a session.
 *
 * `/privacy` is public for the same reason `/join` is: it is read by people who
 * have no account and never will — App Store review among them. Its URL is
 * registered against the app record in App Store Connect, so a redirect to
 * /signin here is a failed review, not a broken page.
 *
 * `/status` is public for a sharper version of the same reason: a status page
 * that requires a session is unreadable in exactly the situation it exists for.
 * `/api/cron/status` is here because Vercel Cron cannot hold a session either —
 * it presents `Authorization: Bearer $CRON_SECRET`, which the handler checks
 * before it does anything. Being past this gate is not the same as being open.
 *
 * `/ride` is public for the plainest reason of all (MYR-540): the whole point
 * of that page is the visitor who does not have the app, and by definition does
 * not have an account either. Bouncing them to /signin is the dead end the page
 * exists to prevent. It is safe to open because it holds nothing — install
 * steps and two links, identical for every code. The ride itself is behind
 * sign-in, in the app.
 */
export const PUBLIC_PATHS = [
  '/signin',
  '/signup',
  '/beta',
  JOIN_ROUTE,
  RIDE_ROUTE,
  PRIVACY_ROUTE,
  STATUS_ROUTE,
  STATUS_CRON_ROUTE,
  '/api/auth',
  '/.well-known',
] as const;

/** Returns true when `pathname` may be served to a visitor with no session. */
export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}
