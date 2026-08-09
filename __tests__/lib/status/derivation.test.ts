import { describe, expect, it } from 'vitest';

import {
  buildDayBars,
  deriveComponentHealth,
  deriveComponentState,
  deriveDayState,
  deriveOverallState,
  HISTORY_DAYS,
  STALE_AFTER_MS,
  summarizeDayRows,
  utcDateKey,
  utcDaysEndingAt,
  windowUptimePct,
} from '@/lib/status/derivation';
import type { DayAggregate, StatusCheckRow } from '@/lib/status/types';

const NOW = new Date('2026-08-09T12:00:00.000Z');

/** A row `minutesAgo` before NOW. Newest-first order is the caller's business. */
function check(minutesAgo: number, ok: boolean): StatusCheckRow {
  return {
    component: 'telemetry-api',
    ok,
    latencyMs: 42,
    detail: ok ? 'healthz 200' : 'healthz 503',
    checkedAt: new Date(NOW.getTime() - minutesAgo * 60_000),
  };
}

describe('deriveComponentState — the debounce', () => {
  it('calls two consecutive failures an outage', () => {
    expect(deriveComponentState([check(0, false), check(1, false), check(2, true)], NOW)).toBe(
      'outage',
    );
  });

  it('calls a single newest failure degraded, not an outage', () => {
    expect(deriveComponentState([check(0, false), check(1, true), check(2, true)], NOW)).toBe(
      'degraded',
    );
  });

  it('calls a just-recovered component degraded for one more round', () => {
    expect(deriveComponentState([check(0, true), check(1, false), check(2, true)], NOW)).toBe(
      'degraded',
    );
  });

  it('calls two consecutive passes operational', () => {
    expect(deriveComponentState([check(0, true), check(1, true)], NOW)).toBe('operational');
  });

  it('ignores older failures once two good checks are in', () => {
    expect(
      deriveComponentState([check(0, true), check(1, true), check(2, false), check(3, false)], NOW),
    ).toBe('operational');
  });

  it('does not depend on the order rows arrive in', () => {
    const rows = [check(2, true), check(0, false), check(1, false)];
    expect(deriveComponentState(rows, NOW)).toBe('outage');
  });

  it('treats a lone failing row as degraded — one probe is not a confirmation', () => {
    expect(deriveComponentState([check(0, false)], NOW)).toBe('degraded');
  });

  it('treats a lone passing row as operational', () => {
    expect(deriveComponentState([check(0, true)], NOW)).toBe('operational');
  });
});

describe('deriveComponentState — the no-data guard', () => {
  it('says no data when there are no rows at all', () => {
    expect(deriveComponentState([], NOW)).toBe('no_data');
  });

  it('says no data rather than operational when the prober went quiet', () => {
    const stale = STALE_AFTER_MS / 60_000 + 1;
    expect(deriveComponentState([check(stale, true), check(stale + 1, true)], NOW)).toBe('no_data');
  });

  it('still reports on rows that are old but not yet stale', () => {
    const nearlyStale = STALE_AFTER_MS / 60_000 - 1;
    expect(deriveComponentState([check(nearlyStale, true), check(nearlyStale + 1, true)], NOW)).toBe(
      'operational',
    );
  });

  it('says no data for a stale failure too — silence is not an outage either', () => {
    const stale = STALE_AFTER_MS / 60_000 + 5;
    expect(deriveComponentState([check(stale, false), check(stale + 1, false)], NOW)).toBe(
      'no_data',
    );
  });
});

describe('deriveComponentHealth', () => {
  it('carries the newest row’s evidence, whatever order it was given in', () => {
    const health = deriveComponentHealth([check(3, true), check(0, false), check(1, false)], NOW);

    expect(health.state).toBe('outage');
    expect(health.detail).toBe('healthz 503');
    expect(health.lastCheckedAt).toEqual(NOW);
    expect(health.latencyMs).toBe(42);
  });

  it('reports nulls, not zeroes, when there is nothing to report', () => {
    expect(deriveComponentHealth([], NOW)).toEqual({
      state: 'no_data',
      lastCheckedAt: null,
      latencyMs: null,
      detail: null,
    });
  });
});

describe('deriveOverallState', () => {
  it('is the worst component', () => {
    expect(deriveOverallState(['operational', 'outage', 'degraded'])).toBe('outage');
    expect(deriveOverallState(['operational', 'degraded'])).toBe('degraded');
    expect(deriveOverallState(['operational', 'operational'])).toBe('operational');
  });

  it('withdraws the all-clear when any component is unknown', () => {
    expect(deriveOverallState(['operational', 'operational', 'no_data'])).toBe('no_data');
  });

  it('still reports a known outage over an unknown component', () => {
    expect(deriveOverallState(['no_data', 'outage'])).toBe('outage');
    expect(deriveOverallState(['no_data', 'degraded'])).toBe('degraded');
  });

  it('says no data when asked about nothing', () => {
    expect(deriveOverallState([])).toBe('no_data');
  });
});

describe('deriveDayState — worst of day', () => {
  it('is operational on a clean day', () => {
    expect(deriveDayState({ total: 1440, failed: 0, maxFailStreak: 0 })).toBe('operational');
  });

  it('is degraded when the failures never ran together', () => {
    expect(deriveDayState({ total: 1440, failed: 5, maxFailStreak: 1 })).toBe('degraded');
  });

  it('is an outage as soon as two failures ran back to back', () => {
    expect(deriveDayState({ total: 1440, failed: 2, maxFailStreak: 2 })).toBe('outage');
  });

  it('is no data on a day nobody probed — not a good day', () => {
    expect(deriveDayState({ total: 0, failed: 0, maxFailStreak: 0 })).toBe('no_data');
  });
});

describe('summarizeDayRows — the definition the SQL mirrors', () => {
  it('counts the longest run of failures, not the total', () => {
    const rows = [
      check(9, true),
      check(8, false),
      check(7, false),
      check(6, false),
      check(5, true),
      check(4, false),
    ];

    expect(summarizeDayRows(rows)).toEqual({ total: 6, failed: 4, maxFailStreak: 3 });
  });

  it('reads rows in time order however they are handed over', () => {
    const scrambled = [check(4, false), check(9, true), check(6, false), check(5, true)];
    expect(summarizeDayRows(scrambled)).toEqual({ total: 4, failed: 2, maxFailStreak: 1 });
  });

  it('is empty for an empty day', () => {
    expect(summarizeDayRows([])).toEqual({ total: 0, failed: 0, maxFailStreak: 0 });
  });
});

describe('buildDayBars', () => {
  const aggregate = (date: string, extra: Partial<DayAggregate> = {}): DayAggregate => ({
    date,
    component: 'telemetry-api',
    total: 1440,
    failed: 0,
    maxFailStreak: 0,
    ...extra,
  });

  it('always returns one bar per day, oldest first, ending today', () => {
    const bars = buildDayBars([], NOW, HISTORY_DAYS);

    expect(bars).toHaveLength(HISTORY_DAYS);
    expect(bars[bars.length - 1].date).toBe('2026-08-09');
    expect(bars[0].date).toBe('2026-05-12');
  });

  it('fills unprobed days with no data rather than skipping them', () => {
    const bars = buildDayBars([aggregate('2026-08-09')], NOW, 3);

    expect(bars.map((bar) => bar.state)).toEqual(['no_data', 'no_data', 'operational']);
    expect(bars[0].uptimePct).toBeNull();
    expect(bars[0].total).toBe(0);
  });

  it('computes each day’s uptime from its own counts', () => {
    const bars = buildDayBars(
      [aggregate('2026-08-09', { total: 1000, failed: 10, maxFailStreak: 4 })],
      NOW,
      1,
    );

    expect(bars[0].state).toBe('outage');
    expect(bars[0].uptimePct).toBeCloseTo(99, 5);
  });

  it('ignores aggregates outside the window', () => {
    const bars = buildDayBars([aggregate('2020-01-01')], NOW, 3);
    expect(bars.every((bar) => bar.state === 'no_data')).toBe(true);
  });
});

describe('windowUptimePct', () => {
  it('is null when nothing in the window was measured', () => {
    expect(windowUptimePct(buildDayBars([], NOW, 90))).toBeNull();
  });

  it('pools every day’s checks rather than averaging percentages', () => {
    const bars = buildDayBars(
      [
        { date: '2026-08-08', component: 'web', total: 100, failed: 0, maxFailStreak: 0 },
        { date: '2026-08-09', component: 'web', total: 900, failed: 9, maxFailStreak: 3 },
      ],
      NOW,
      2,
    );

    expect(windowUptimePct(bars)).toBeCloseTo(99.1, 5);
  });
});

describe('UTC day helpers', () => {
  it('keys a timestamp by its UTC day, not the runner’s', () => {
    expect(utcDateKey(new Date('2026-08-09T23:59:59.999Z'))).toBe('2026-08-09');
    expect(utcDateKey(new Date('2026-08-10T00:00:00.000Z'))).toBe('2026-08-10');
  });

  it('walks back over a month boundary', () => {
    expect(utcDaysEndingAt(new Date('2026-03-02T05:00:00Z'), 3)).toEqual([
      '2026-02-28',
      '2026-03-01',
      '2026-03-02',
    ]);
  });
});
