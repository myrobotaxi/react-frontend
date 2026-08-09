/**
 * Turning probe rows into the four words the page is allowed to say (MYR-510).
 *
 * Every function here is pure and takes `now` as an argument. That is not
 * ceremony: the interesting cases are all about time — a prober that stopped
 * running, a failure that has not been confirmed yet, a day that has no rows —
 * and none of them are testable against a hidden clock.
 *
 * No React, no database, no network.
 */

import type {
  ComponentHealth,
  ComponentState,
  DayAggregate,
  DayBar,
  StatusCheckRow,
} from './types';

/**
 * How long a component may go unprobed before the page stops describing it.
 *
 * The cron runs every minute, so ten minutes is roughly ten consecutive misses
 * — comfortably past a slow run or a redeploy, and well short of a reader
 * mistaking a stale green chip for a live one. Past this line the component
 * reads "No data", which is the only honest thing a dead prober can produce.
 */
export const STALE_AFTER_MS = 10 * 60 * 1000;

/** How much history the page shows, and how long the cron keeps rows. */
export const HISTORY_DAYS = 90;

/**
 * The state of one component, from its rows.
 *
 * The debounce is the whole design. A single failed probe is a fact about the
 * network as much as about the service, and publishing "Outage" on one timeout
 * would make the page cry wolf several times a week. So:
 *
 *   - two most recent probes both failed  → outage   (confirmed, not a blip)
 *   - exactly one of the two failed       → degraded (failing, or just back)
 *   - both passed                         → operational
 *   - nothing recent to look at           → no data
 *
 * The "just recovered" case landing on degraded rather than operational is
 * deliberate: one good probe after a failure is the same amount of evidence as
 * one bad probe after a good one, and it should read the same way.
 */
export function deriveComponentState(
  rows: readonly StatusCheckRow[],
  now: Date,
  staleAfterMs: number = STALE_AFTER_MS,
): ComponentState {
  const recent = sortNewestFirst(rows);
  if (recent.length === 0) return 'no_data';

  const newest = recent[0];
  if (now.getTime() - newest.checkedAt.getTime() > staleAfterMs) return 'no_data';

  const previous = recent[1];
  if (!newest.ok && previous && !previous.ok) return 'outage';
  if (!newest.ok) return 'degraded';
  if (previous && !previous.ok) return 'degraded';
  return 'operational';
}

/** The state plus the evidence the page prints next to it. */
export function deriveComponentHealth(
  rows: readonly StatusCheckRow[],
  now: Date,
  staleAfterMs: number = STALE_AFTER_MS,
): ComponentHealth {
  const recent = sortNewestFirst(rows);
  const newest = recent[0] ?? null;

  return {
    state: deriveComponentState(rows, now, staleAfterMs),
    lastCheckedAt: newest?.checkedAt ?? null,
    latencyMs: newest?.latencyMs ?? null,
    detail: newest?.detail ?? null,
  };
}

/**
 * The banner at the top: the worst thing true of any component.
 *
 * Note where `no_data` sits — worse than operational. "All systems operational"
 * is a claim about every component, so one component we cannot see is enough to
 * withdraw it. The banner then says we do not know, which is true, instead of
 * quietly reporting on the two thirds we can still reach.
 */
export function deriveOverallState(states: readonly ComponentState[]): ComponentState {
  if (states.length === 0) return 'no_data';
  if (states.includes('outage')) return 'outage';
  if (states.includes('degraded')) return 'degraded';
  if (states.includes('no_data')) return 'no_data';
  return 'operational';
}

/**
 * One day's colour, from that day's counts.
 *
 * Same debounce as the live view, applied to history: an isolated failed probe
 * is a blip (degraded), two in a row is an outage. A day nobody probed is not a
 * good day — it is an unknown one.
 */
export function deriveDayState(aggregate: Pick<DayAggregate, 'total' | 'failed' | 'maxFailStreak'>): ComponentState {
  if (aggregate.total === 0) return 'no_data';
  if (aggregate.failed === 0) return 'operational';
  return aggregate.maxFailStreak >= 2 ? 'outage' : 'degraded';
}

/**
 * Count a day's rows the way the SQL roll-up does.
 *
 * The page never calls this — at a probe a minute the history is far too large
 * to pull into memory, so `status-queries.ts` does the same arithmetic in
 * Postgres. This is that arithmetic written out in one readable place, and the
 * tests hold the two definitions to the same answers.
 */
export function summarizeDayRows(
  rows: readonly StatusCheckRow[],
): Pick<DayAggregate, 'total' | 'failed' | 'maxFailStreak'> {
  const chronological = [...rows].sort(
    (a, b) => a.checkedAt.getTime() - b.checkedAt.getTime(),
  );

  let failed = 0;
  let streak = 0;
  let maxFailStreak = 0;

  for (const row of chronological) {
    if (row.ok) {
      streak = 0;
      continue;
    }
    failed += 1;
    streak += 1;
    if (streak > maxFailStreak) maxFailStreak = streak;
  }

  return { total: chronological.length, failed, maxFailStreak };
}

/**
 * The 90-day strip for one component: oldest bar first, today last.
 *
 * Days with no rows are filled in rather than skipped. A gap in the prober's
 * record is information — a strip of grey is what a status page owes a reader
 * whose outage happened while nobody was looking.
 */
export function buildDayBars(
  aggregates: readonly DayAggregate[],
  now: Date,
  days: number = HISTORY_DAYS,
): DayBar[] {
  const byDate = new Map(aggregates.map((aggregate) => [aggregate.date, aggregate]));

  return utcDaysEndingAt(now, days).map((date) => {
    const aggregate = byDate.get(date);
    if (!aggregate) {
      return { date, state: 'no_data', total: 0, failed: 0, uptimePct: null };
    }

    return {
      date,
      state: deriveDayState(aggregate),
      total: aggregate.total,
      failed: aggregate.failed,
      uptimePct: uptimePct(aggregate.total, aggregate.failed),
    };
  });
}

/** Uptime across a set of days, or null when none of them were probed. */
export function windowUptimePct(bars: readonly DayBar[]): number | null {
  const total = bars.reduce((sum, bar) => sum + bar.total, 0);
  if (total === 0) return null;
  const failed = bars.reduce((sum, bar) => sum + bar.failed, 0);
  return uptimePct(total, failed);
}

/** The `YYYY-MM-DD` UTC days ending at (and including) `now`, oldest first. */
export function utcDaysEndingAt(now: Date, days: number): string[] {
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const dayMs = 24 * 60 * 60 * 1000;

  return Array.from({ length: days }, (_, index) =>
    utcDateKey(new Date(end - (days - 1 - index) * dayMs)),
  );
}

/** The UTC calendar day a timestamp falls in, as `YYYY-MM-DD`. */
export function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function uptimePct(total: number, failed: number): number {
  return ((total - failed) / total) * 100;
}

function sortNewestFirst(rows: readonly StatusCheckRow[]): StatusCheckRow[] {
  return [...rows].sort((a, b) => b.checkedAt.getTime() - a.checkedAt.getTime());
}
