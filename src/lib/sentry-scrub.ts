/**
 * Keeps invite codes out of Sentry.
 *
 * With tracing on, Sentry records the request URL of every sampled transaction
 * and error. For /join/{CODE} that URL *is* the credential — nobody has to
 * write a log line for the code to be stored, indexed, and retained by a third
 * party. This walks an outgoing event and rewrites those paths before send.
 *
 * No React code — imported by the server, edge, and client Sentry configs.
 */

import { redactInviteCodePaths } from './invite-code';

/** Guards against pathological nesting in an event payload. */
const MAX_DEPTH = 8;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function scrub(value: unknown, depth: number): unknown {
  if (depth > MAX_DEPTH) return value;

  if (typeof value === 'string') return redactInviteCodePaths(value);

  if (Array.isArray(value)) return value.map((item) => scrub(item, depth + 1));

  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      result[key] = scrub(item, depth + 1);
    }
    return result;
  }

  // Class instances, functions, Dates, and primitives pass through untouched —
  // rebuilding them would lose behaviour Sentry depends on.
  return value;
}

/**
 * Returns a copy of `event` with every `/join/{CODE}` path redacted.
 *
 * Typed loosely on purpose: the three Sentry configs (node, edge, browser) each
 * pass a differently-shaped Event, and this only cares about strings.
 */
export function scrubInviteCodes<T>(event: T): T {
  return scrub(event, 0) as T;
}
