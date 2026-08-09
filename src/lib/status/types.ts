/**
 * The vocabulary of the status page (MYR-510).
 *
 * Kept in `lib/` rather than in the feature because the cron handler and the
 * page both speak it, and because the derivation these types describe is pure
 * — the whole point is that it can be reasoned about without a database.
 */

/**
 * What we are willing to say about a component right now.
 *
 * `no_data` is the load-bearing one. A status page's worst failure mode is not
 * being wrong about an outage — it is claiming everything is fine because the
 * thing that would have noticed is itself dead. Absence of evidence renders as
 * absence of evidence, never as health.
 */
export type ComponentState = 'operational' | 'degraded' | 'outage' | 'no_data';

/** One probe of one component at one moment, as read back from the database. */
export interface StatusCheckRow {
  component: string;
  ok: boolean;
  latencyMs: number | null;
  detail: string | null;
  checkedAt: Date;
}

/** What the page says about one component in the "current status" list. */
export interface ComponentHealth {
  state: ComponentState;
  /** When the most recent probe ran, or null when there has never been one. */
  lastCheckedAt: Date | null;
  /** Latency of the most recent probe. */
  latencyMs: number | null;
  /** Evidence from the most recent probe — the string the prober wrote. */
  detail: string | null;
}

/**
 * One UTC day's worth of checks for one component, already counted.
 *
 * Produced by SQL over ~400k rows rather than in JavaScript, which is why the
 * day-level derivation takes counts instead of rows.
 */
export interface DayAggregate {
  /** UTC calendar day, `YYYY-MM-DD`. */
  date: string;
  component: string;
  total: number;
  failed: number;
  /** Longest run of consecutive failures within the day. Drives the debounce. */
  maxFailStreak: number;
}

/** One bar in the 90-day history strip. */
export interface DayBar {
  /** UTC calendar day, `YYYY-MM-DD`. */
  date: string;
  state: ComponentState;
  total: number;
  failed: number;
  /** Percentage of checks that passed, or null on a day with no checks. */
  uptimePct: number | null;
}

/** A written incident record, as read back from the database. */
export interface StatusIncidentRecord {
  id: string;
  startedAt: Date;
  resolvedAt: Date | null;
  title: string;
  bodyMd: string;
  components: string[];
}

/**
 * Everything one render of the page reads, and the instant it read it.
 *
 * `available` is false when the database could not be reached at all. It exists
 * so the page can distinguish "the prober found nothing" from "we cannot see
 * our own records" — both render as No data, but only one of them is worth
 * saying out loud.
 */
export interface StatusData {
  generatedAt: Date;
  /** The last hour of checks — enough for the two-deep debounce and staleness. */
  recentChecks: StatusCheckRow[];
  /** Per-component, per-UTC-day counts for the history strip. */
  dayAggregates: DayAggregate[];
  incidents: StatusIncidentRecord[];
  available: boolean;
}
