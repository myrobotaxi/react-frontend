/**
 * Reading the status tables (MYR-510).
 *
 * Three queries per render, and the render is cached for a minute, so the page
 * costs the database roughly one round of work per minute no matter how many
 * people are watching. That matters: the moment this page gets traffic is the
 * moment something is broken, and it must not add load to the incident.
 */

import { prisma } from '@/lib/prisma';
import { HISTORY_DAYS } from '@/lib/status/derivation';
import type {
  DayAggregate,
  StatusCheckRow,
  StatusData,
  StatusIncidentRecord,
} from '@/lib/status/types';

/**
 * How much recent history the live view reads.
 *
 * The debounce only looks two probes deep and staleness only ten minutes back,
 * so an hour is generous — and it is a fixed ~180 rows rather than a number
 * that grows with how long we have been up.
 */
const RECENT_WINDOW_MS = 60 * 60 * 1000;

/** How many written incidents the log shows. */
const INCIDENT_LIMIT = 25;

/**
 * Everything one render needs.
 *
 * Never throws. A status page that 500s because its own database is unreachable
 * has failed at the one job it has, so the failure path returns empty data with
 * `available: false` and the page says it cannot see its records. This also
 * makes the route safe to prerender in CI, where there is no database at all.
 */
export async function loadStatusData(now: Date = new Date()): Promise<StatusData> {
  try {
    const [recentChecks, dayAggregates, incidents] = await Promise.all([
      readRecentChecks(now),
      readDayAggregates(now),
      readIncidents(),
    ]);

    return { generatedAt: now, recentChecks, dayAggregates, incidents, available: true };
  } catch (error) {
    // One line, not a stack: this path is expected during a CI build, where
    // there is no database, and the page's own banner is the real report.
    console.error(
      '[status] could not read status tables:',
      error instanceof Error ? error.message : error,
    );
    return {
      generatedAt: now,
      recentChecks: [],
      dayAggregates: [],
      incidents: [],
      available: false,
    };
  }
}

async function readRecentChecks(now: Date): Promise<StatusCheckRow[]> {
  return prisma.statusCheck.findMany({
    where: { checkedAt: { gte: new Date(now.getTime() - RECENT_WINDOW_MS) } },
    orderBy: { checkedAt: 'desc' },
    select: { component: true, ok: true, latencyMs: true, detail: true, checkedAt: true },
  });
}

async function readIncidents(): Promise<StatusIncidentRecord[]> {
  return prisma.statusIncident.findMany({
    orderBy: { startedAt: 'desc' },
    take: INCIDENT_LIMIT,
    select: {
      id: true,
      startedAt: true,
      resolvedAt: true,
      title: true,
      bodyMd: true,
      components: true,
    },
  });
}

/** Shape of one row of the roll-up. Postgres returns the column names as-is. */
interface RawDayAggregate {
  component: string;
  date: string;
  total: number;
  failed: number;
  max_fail_streak: number;
}

/**
 * Ninety days of history, counted in Postgres.
 *
 * At one probe per component per minute this table holds a few hundred thousand
 * rows per quarter, so the counting cannot happen in JavaScript. The window
 * expression is the standard gaps-and-islands trick: two row numbers, one over
 * the day and one over the day-and-outcome, differ by a constant exactly while
 * a run of identical outcomes continues, so grouping on that difference gives
 * one group per run and `MAX(count)` gives the longest run of failures.
 *
 * This is the same arithmetic as `summarizeDayRows` in lib/status/derivation.ts,
 * which is the readable definition and the one the tests pin. If you change the
 * debounce, change both.
 */
async function readDayAggregates(now: Date): Promise<DayAggregate[]> {
  const cutoff = new Date(now.getTime() - HISTORY_DAYS * 24 * 60 * 60 * 1000);

  const rows = await prisma.$queryRaw<RawDayAggregate[]>`
    WITH base AS (
      SELECT
        component,
        (checked_at AT TIME ZONE 'UTC')::date AS day,
        ok,
        ROW_NUMBER() OVER (
          PARTITION BY component, (checked_at AT TIME ZONE 'UTC')::date
          ORDER BY checked_at, id
        ) - ROW_NUMBER() OVER (
          PARTITION BY component, (checked_at AT TIME ZONE 'UTC')::date, ok
          ORDER BY checked_at, id
        ) AS island
      FROM status_checks
      WHERE checked_at >= ${cutoff}
    ),
    totals AS (
      SELECT
        component,
        day,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE NOT ok)::int AS failed
      FROM base
      GROUP BY component, day
    ),
    streaks AS (
      SELECT component, day, MAX(run_length)::int AS max_fail_streak
      FROM (
        SELECT component, day, island, COUNT(*)::int AS run_length
        FROM base
        WHERE NOT ok
        GROUP BY component, day, island
      ) runs
      GROUP BY component, day
    )
    SELECT
      totals.component,
      to_char(totals.day, 'YYYY-MM-DD') AS date,
      totals.total,
      totals.failed,
      COALESCE(streaks.max_fail_streak, 0)::int AS max_fail_streak
    FROM totals
    LEFT JOIN streaks
      ON streaks.component = totals.component AND streaks.day = totals.day
    ORDER BY totals.component, totals.day
  `;

  return rows.map((row) => ({
    component: row.component,
    date: row.date,
    total: Number(row.total),
    failed: Number(row.failed),
    maxFailStreak: Number(row.max_fail_streak),
  }));
}
