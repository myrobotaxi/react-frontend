import { describe, expect, it } from 'vitest';

import {
  COMPONENT_IDS,
  STATUS_COMPONENTS,
  TELEMETRY_HEALTH_PATHS,
} from '@/lib/status/components';
import { HISTORY_DAYS } from '@/lib/status/derivation';
import type { StatusCheckRow, StatusData } from '@/lib/status/types';
import { buildStatusView } from '@/lib/status/view';

const NOW = new Date('2026-08-09T12:00:00.000Z');

function emptyData(overrides: Partial<StatusData> = {}): StatusData {
  return {
    generatedAt: NOW,
    recentChecks: [],
    dayAggregates: [],
    incidents: [],
    available: true,
    ...overrides,
  };
}

function check(component: string, minutesAgo: number, ok: boolean): StatusCheckRow {
  return {
    component,
    ok,
    latencyMs: 30,
    detail: 'probe detail',
    checkedAt: new Date(NOW.getTime() - minutesAgo * 60_000),
  };
}

describe('buildStatusView — with nothing in the database', () => {
  const view = buildStatusView(emptyData());

  it('renders every component we probe and nothing else', () => {
    expect(view.components.map((entry) => entry.component.id)).toEqual([...COMPONENT_IDS]);
    expect(view.components).toHaveLength(STATUS_COMPONENTS.length);
  });

  it('says No data for every component rather than Operational', () => {
    expect(view.components.map((entry) => entry.health.state)).toEqual([
      'no_data',
      'no_data',
      'no_data',
    ]);
  });

  it('says the overall status is unknown', () => {
    expect(view.overall).toBe('no_data');
  });

  it('has no last-checked stamp to show', () => {
    expect(view.lastCheckedAt).toBeNull();
  });

  it('still draws a full history strip, entirely unknown', () => {
    for (const entry of view.components) {
      expect(entry.bars).toHaveLength(HISTORY_DAYS);
      expect(entry.bars.every((bar) => bar.state === 'no_data')).toBe(true);
      expect(entry.uptimePct).toBeNull();
    }
  });

  it('has an empty incident log', () => {
    expect(view.incidents).toEqual([]);
  });
});

describe('buildStatusView — a dead prober cannot be mistaken for health', () => {
  it('reports No data when the last checks are hours old, even though they passed', () => {
    const view = buildStatusView(
      emptyData({
        recentChecks: COMPONENT_IDS.flatMap((id) => [check(id, 55, true), check(id, 56, true)]),
      }),
    );

    expect(view.overall).toBe('no_data');
    expect(view.components.every((entry) => entry.health.state === 'no_data')).toBe(true);
    // The stamp is still shown, so a reader can see how stale it is.
    expect(view.lastCheckedAt).toEqual(new Date(NOW.getTime() - 55 * 60_000));
  });
});

describe('buildStatusView — mixed states', () => {
  it('keeps each component’s rows to itself and takes the worst for the banner', () => {
    const view = buildStatusView(
      emptyData({
        recentChecks: [
          check('telemetry-api', 0, true),
          check('telemetry-api', 1, true),
          check('realtime-ws', 0, false),
          check('realtime-ws', 1, false),
          check('web', 0, true),
          check('web', 1, true),
        ],
      }),
    );

    const byId = new Map(view.components.map((entry) => [entry.component.id, entry.health.state]));
    expect(byId.get('telemetry-api')).toBe('operational');
    expect(byId.get('realtime-ws')).toBe('outage');
    expect(byId.get('web')).toBe('operational');
    expect(view.overall).toBe('outage');
  });

  it('is operational overall only when every component is', () => {
    const view = buildStatusView(
      emptyData({
        recentChecks: COMPONENT_IDS.flatMap((id) => [check(id, 0, true), check(id, 1, true)]),
      }),
    );

    expect(view.overall).toBe('operational');
    expect(view.lastCheckedAt).toEqual(NOW);
  });

  it('routes each component’s day aggregates to its own strip', () => {
    const view = buildStatusView(
      emptyData({
        recentChecks: COMPONENT_IDS.flatMap((id) => [check(id, 0, true), check(id, 1, true)]),
        dayAggregates: [
          { date: '2026-08-09', component: 'web', total: 100, failed: 4, maxFailStreak: 4 },
        ],
      }),
    );

    const web = view.components.find((entry) => entry.component.id === 'web');
    const telemetry = view.components.find((entry) => entry.component.id === 'telemetry-api');

    expect(web?.bars.at(-1)?.state).toBe('outage');
    expect(web?.uptimePct).toBeCloseTo(96, 5);
    expect(telemetry?.bars.at(-1)?.state).toBe('no_data');
    expect(telemetry?.uptimePct).toBeNull();
  });
});

describe('buildStatusView — when the database itself cannot be read', () => {
  it('passes the failure through so the page can say so', () => {
    const view = buildStatusView(emptyData({ available: false }));

    expect(view.available).toBe(false);
    expect(view.overall).toBe('no_data');
  });
});

describe('the component catalogue', () => {
  it('describes what is probed for every row it publishes', () => {
    for (const component of STATUS_COMPONENTS) {
      expect(component.probes.length).toBeGreaterThan(20);
      expect(component.description.length).toBeGreaterThan(20);
    }
  });

  it('has no id that is not probed by the prober', () => {
    // The prober writes exactly these three ids; a fourth row here would be a
    // chip with nothing behind it.
    expect([...COMPONENT_IDS]).toEqual(['telemetry-api', 'realtime-ws', 'web']);
  });

  /**
   * The telemetry service has `/healthz` and no readiness endpoint — `/readyz`
   * answers 404 in production. The probe therefore cannot see the database, and
   * the copy under the component has to admit it. These two facts are one fact,
   * so they are asserted together: whoever adds `/readyz` to the probe will
   * fail this test until they also delete the caveat.
   */
  it('admits, in the copy, what the shortened health check cannot see', () => {
    const telemetry = STATUS_COMPONENTS.find((entry) => entry.id === 'telemetry-api');

    expect([...TELEMETRY_HEALTH_PATHS]).toEqual(['/healthz']);
    expect(telemetry?.probes).toContain('/healthz');
    expect(telemetry?.probes).not.toContain('/readyz');
    expect(telemetry?.probes).toContain('database');
  });
});
