/**
 * Recent-login re-auth gate (MYR-76).
 *
 * `DELETE /api/users/me` (rest-api.md §7.6) and `GET /api/users/me/export`
 * (§7.7) require a session refreshed within the last N minutes on top of
 * the standard Bearer-token check. Defends against stolen-token deletion
 * and stolen-token bulk export per the GDPR Art. 17 recent-auth corollary.
 *
 * Mechanism: the NextAuth `jwt` callback stamps `token.authTime`
 * (Unix-seconds, mirroring the OIDC `auth_time` claim) on every fresh
 * sign-in — i.e., whenever the callback receives a non-null `account`.
 * Subsequent JWT refreshes preserve the original value. The session
 * callback forwards `authTime` to `session.user.authTime` so route
 * handlers can check freshness without re-decoding the cookie.
 */

const FIVE_MINUTES_SEC = 5 * 60;

/**
 * Maximum age of the most-recent OAuth sign-in (in seconds) for the
 * re-auth gate on destructive / bulk-export endpoints. Configurable via
 * `REAUTH_MAX_AGE_SEC` for ops drills or test overrides; default 5 min
 * matches the suggested value in MYR-76's scope.
 */
export function reauthMaxAgeSec(): number {
  const raw = process.env.REAUTH_MAX_AGE_SEC;
  if (!raw) return FIVE_MINUTES_SEC;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : FIVE_MINUTES_SEC;
}

/**
 * Returns true when the session's `authTime` is within `reauthMaxAgeSec()`
 * of now. A missing `authTime` (legacy session predating the JWT-claim
 * rollout) is treated as stale — the user must re-sign-in to acquire the
 * claim before the gated endpoints accept the request.
 */
export function isRecentlyAuthenticated(
  authTime: number | null | undefined,
  now: number = Math.floor(Date.now() / 1000),
): boolean {
  if (typeof authTime !== 'number') return false;
  return now - authTime <= reauthMaxAgeSec();
}
