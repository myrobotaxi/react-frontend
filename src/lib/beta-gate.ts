/**
 * Beta access gate — constants and helpers.
 * The gate is controlled by the BETA_ACCESS_PASSWORD env var.
 * When absent, the gate is completely disabled.
 */

export const BETA_COOKIE_NAME = 'beta-access';
export const BETA_COOKIE_VALUE = 'granted';
export const BETA_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

// Paths that bypass the beta gate. Some overlap with PUBLIC_PATHS in proxy.ts
// (which controls auth bypass) — keep both in sync when adding new public routes.
//
// `/privacy` is here because the gate is the one of the three gates that can be
// switched on from the Vercel dashboard without a code change. If it ever is,
// the privacy policy must not disappear behind a password prompt: its URL is
// registered in App Store Connect and Apple's review fetches it anonymously.
//
// `/status` and `/api/cron/status` are here for the same reason and then some:
// a password prompt in front of the status page hides it from everyone outside
// the team, and one in front of the cron URL would quietly stop the monitoring
// the next time someone sets BETA_ACCESS_PASSWORD from the dashboard.
const BETA_EXCLUDED_PATHS = [
  '/beta',
  '/join',
  '/privacy',
  '/status',
  '/api/cron/status',
  '/api/auth',
  '/.well-known',
];

/**
 * Returns true when the beta gate is active (env var is set).
 */
export function isBetaGateEnabled(): boolean {
  return !!process.env.BETA_ACCESS_PASSWORD;
}

/**
 * Returns true if the given pathname should bypass the beta gate check.
 */
export function isBetaExcludedPath(pathname: string): boolean {
  return BETA_EXCLUDED_PATHS.some((path) => pathname.startsWith(path));
}
