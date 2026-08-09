/**
 * From rows to the thing the page renders (MYR-510).
 *
 * One pure function between the database and JSX. It exists so the question
 * "what does this page say when there is no data?" has an answer you can assert
 * in a test, rather than one you have to boot a database to find out.
 */

import { STATUS_COMPONENTS, type StatusComponent } from './components';
import {
  buildDayBars,
  deriveComponentHealth,
  deriveOverallState,
  HISTORY_DAYS,
  windowUptimePct,
} from './derivation';
import type {
  ComponentHealth,
  ComponentState,
  DayBar,
  StatusData,
  StatusIncidentRecord,
} from './types';

/** One component's row on the page. */
export interface ComponentView {
  component: StatusComponent;
  health: ComponentHealth;
  /** Oldest day first, today last. Always `HISTORY_DAYS` long. */
  bars: DayBar[];
  /** Uptime across the whole strip, or null when nothing was measured. */
  uptimePct: number | null;
}

/** Everything the page renders. */
export interface StatusView {
  generatedAt: Date;
  overall: ComponentState;
  components: ComponentView[];
  incidents: StatusIncidentRecord[];
  /** The most recent probe of any component — the "last checked" stamp. */
  lastCheckedAt: Date | null;
  /** False when the database could not be read for this render. */
  available: boolean;
  historyDays: number;
}

export function buildStatusView(data: StatusData): StatusView {
  const components = STATUS_COMPONENTS.map((component): ComponentView => {
    const rows = data.recentChecks.filter((row) => row.component === component.id);
    const bars = buildDayBars(
      data.dayAggregates.filter((aggregate) => aggregate.component === component.id),
      data.generatedAt,
      HISTORY_DAYS,
    );

    return {
      component,
      health: deriveComponentHealth(rows, data.generatedAt),
      bars,
      uptimePct: windowUptimePct(bars),
    };
  });

  return {
    generatedAt: data.generatedAt,
    overall: deriveOverallState(components.map((view) => view.health.state)),
    components,
    incidents: data.incidents,
    lastCheckedAt: mostRecent(components),
    available: data.available,
    historyDays: HISTORY_DAYS,
  };
}

function mostRecent(components: readonly ComponentView[]): Date | null {
  return components.reduce<Date | null>((latest, view) => {
    const candidate = view.health.lastCheckedAt;
    if (!candidate) return latest;
    if (!latest || candidate.getTime() > latest.getTime()) return candidate;
    return latest;
  }, null);
}
