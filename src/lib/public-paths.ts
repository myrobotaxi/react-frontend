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

import { JOIN_ROUTE, PRIVACY_ROUTE } from './constants';

/**
 * Prefixes served without a session.
 *
 * `/privacy` is public for the same reason `/join` is: it is read by people who
 * have no account and never will — App Store review among them. Its URL is
 * registered against the app record in App Store Connect, so a redirect to
 * /signin here is a failed review, not a broken page.
 */
export const PUBLIC_PATHS = [
  '/signin',
  '/signup',
  '/beta',
  JOIN_ROUTE,
  PRIVACY_ROUTE,
  '/api/auth',
  '/.well-known',
] as const;

/** Returns true when `pathname` may be served to a visitor with no session. */
export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}
