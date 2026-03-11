/**
 * Beta access gate — constants and helpers.
 * The gate is controlled by the BETA_ACCESS_PASSWORD env var.
 * When absent, the gate is completely disabled.
 */

export const BETA_COOKIE_NAME = 'beta-access';
export const BETA_COOKIE_VALUE = 'granted';
export const BETA_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

const BETA_EXCLUDED_PATHS = ['/beta', '/api/auth', '/.well-known'];

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
