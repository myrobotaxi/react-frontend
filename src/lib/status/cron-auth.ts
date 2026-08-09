/**
 * Who may make the prober run (MYR-510).
 *
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET` on every scheduled
 * invocation — the platform's documented pattern, and the reason CRON_SECRET is
 * a plain environment variable rather than anything cleverer.
 *
 * Pure, so the failure modes below are unit tests rather than hopes.
 */

/**
 * Whether this request may write a round of probe rows.
 *
 * Two refusals worth naming:
 *
 *  - No secret configured refuses everything. A missing variable must close the
 *    endpoint, not open it. The cost is that a misconfigured deployment stops
 *    collecting data, and that is visible on the page within ten minutes as
 *    "No data" — which is the correct thing for it to say.
 *  - No header refuses too. There is no unauthenticated path here at all: the
 *    endpoint writes to the database and reaches out to two hosts, so anyone
 *    who can call it can use us to make requests and rows.
 */
export function isAuthorizedCronRequest(
  authorizationHeader: string | null,
  secret: string | undefined,
): boolean {
  if (!secret) return false;
  if (!authorizationHeader) return false;
  return timingSafeEquals(authorizationHeader, `Bearer ${secret}`);
}

/**
 * Constant-time string comparison.
 *
 * Length is allowed to leak — it always does, and the secret's length is not
 * the secret. What must not leak is how far a guess got, which a short-circuit
 * `===` on a long token measurably does.
 */
function timingSafeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
}
