import { auth } from '@/auth';
import {
  isBetaGateEnabled,
  isBetaExcludedPath,
  BETA_COOKIE_NAME,
  BETA_COOKIE_VALUE,
} from '@/lib/beta-gate';
import {
  isLockdownEnabled,
  isLockdownExempt,
  LOCKDOWN_REDIRECT_PATH,
  LOCKDOWN_REDIRECT_STATUS,
} from '@/lib/lockdown';
import { isPublicPath } from '@/lib/public-paths';

const AUTH_PAGES = ['/signin', '/signup'];

function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((path) => pathname === path);
}

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;

  // ─── LOCKDOWN (see lib/lockdown.ts; revert that commit to undo) ───────────
  // The web app is retired. Everything except a code-shaped invite link and
  // the endpoints outside systems are registered against goes to the
  // coming-soon teaser at `/`.
  if (isLockdownEnabled() && !isLockdownExempt(pathname)) {
    // Same idiom as the gates below. Note that auth() rewrites `req.url` to
    // AUTH_URL, so the Location is always the apex — correct in production,
    // but it means localhost and preview deploys bounce to production too.
    // (A relative Location would avoid that; Next's proxy runtime rejects one.)
    // The original query string is dropped: nothing from a retired route
    // should ride along to the teaser.
    return Response.redirect(
      new URL(LOCKDOWN_REDIRECT_PATH, req.url),
      LOCKDOWN_REDIRECT_STATUS,
    );
  }

  // The teaser is the redirect target, so it has to be reachable by anyone: the
  // gates below would bounce an anonymous visitor at `/` to /signin (or /beta),
  // which the lockdown bounces straight back here — a loop. Only while the
  // lockdown is on; with it off, `/` is the app's Home screen and stays gated.
  if (isLockdownEnabled() && pathname === LOCKDOWN_REDIRECT_PATH) {
    return;
  }
  // ─── end lockdown ─────────────────────────────────────────────────────────

  // Beta gate — redirect to /beta if gate is enabled and user has no access.
  // Users with an active session always bypass the gate.
  if (isBetaGateEnabled() && !isBetaExcludedPath(pathname)) {
    const hasBetaCookie = req.cookies.get(BETA_COOKIE_NAME)?.value === BETA_COOKIE_VALUE;
    if (!req.auth && !hasBetaCookie) {
      return Response.redirect(new URL('/beta', req.url));
    }
  }

  // Authenticated user on sign-in/sign-up page → redirect to home
  if (isAuthPage(pathname) && req.auth) {
    return Response.redirect(new URL('/', req.url));
  }

  // Unauthenticated user on protected route → redirect to sign-in
  // Preserve original URL as callbackUrl so user returns after auth
  if (!isPublicPath(pathname) && !req.auth) {
    const signInUrl = new URL('/signin', req.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return Response.redirect(signInUrl);
  }
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
