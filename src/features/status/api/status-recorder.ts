/**
 * Writing the status tables (MYR-510).
 *
 * The only writer is the cron handler. Everything about this module is about
 * keeping that true and keeping the table finite.
 */

import { prisma } from '@/lib/prisma';
import { HISTORY_DAYS } from '@/lib/status/derivation';
import type { ProbeResult } from '@/lib/status/probes';

/**
 * The floor on how often a run may be recorded.
 *
 * The schedule is one run a minute, so this never fires in normal operation.
 * It is a bound, not a rate limiter: the endpoint is authenticated, but if the
 * secret ever leaked, the damage a caller could do is capped at three rows and
 * three outbound requests per twenty seconds rather than "as fast as they can
 * hold the connection open". Retention then caps the table regardless.
 */
export const MIN_WRITE_INTERVAL_MS = 20_000;

/** What a run did, for the response body and the logs. */
export interface RecordOutcome {
  written: number;
  pruned: number;
}

/**
 * Whether a run arriving now is too soon after the last one.
 *
 * Checked BEFORE probing, not after. Doing it the other way round still bounds
 * the table, but leaves a caller able to make us fire three outbound requests
 * as fast as they can ask — a monitor that can be turned into a traffic source
 * against the thing it monitors is worse than no monitor.
 */
export async function isProbeThrottled(now: Date = new Date()): Promise<boolean> {
  const newest = await prisma.statusCheck.findFirst({
    orderBy: { checkedAt: 'desc' },
    select: { checkedAt: true },
  });

  return newest !== null && now.getTime() - newest.checkedAt.getTime() < MIN_WRITE_INTERVAL_MS;
}

/**
 * Store one round of probe results and drop anything past the retention line.
 *
 * Callers must ask `isProbeThrottled` first — the cron handler is the only one,
 * and it does. This function does not re-check, so that the normal path costs
 * one read rather than two.
 *
 * Pruning runs on every invocation rather than on a schedule of its own: it is
 * one indexed delete that removes at most a few minutes' worth of rows once the
 * table is 90 days old, and a retention job that needs its own cron is a
 * retention job that will one day silently stop.
 */
export async function recordProbeRun(
  results: readonly ProbeResult[],
  now: Date = new Date(),
): Promise<RecordOutcome> {
  // One timestamp for the whole run, so "the two most recent checks" is a
  // question about rounds of probing rather than about who finished first.
  const created = await prisma.statusCheck.createMany({
    data: results.map((result) => ({
      component: result.component,
      ok: result.ok,
      latencyMs: result.latencyMs,
      detail: result.detail.slice(0, 500),
      checkedAt: now,
    })),
  });

  const pruned = await prisma.statusCheck.deleteMany({
    where: { checkedAt: { lt: retentionCutoff(now) } },
  });

  return { written: created.count, pruned: pruned.count };
}

/** Rows older than this are deleted. Matches the window the page shows. */
export function retentionCutoff(now: Date): Date {
  return new Date(now.getTime() - HISTORY_DAYS * 24 * 60 * 60 * 1000);
}
