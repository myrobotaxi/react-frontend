import { formatUtcTimestamp } from '@/lib/status/presentation';
import type { ComponentView } from '@/lib/status/view';

import { StatusChip } from './StatusChip';
import { UptimeStrip } from './UptimeStrip';

/** Props for the ComponentCard component. */
export interface ComponentCardProps {
  view: ComponentView;
  days: number;
}

/**
 * One component: name, verdict, what we asked it, and ninety days of history.
 *
 * The evidence line under the chip is unusual for a status page and deliberate.
 * A reader who has just been told "Operational" while their app does not work
 * deserves to see exactly what we measured — `healthz 200 in 84ms, readyz 200
 * in 61ms` — so they can tell the difference between us being wrong and us
 * measuring something other than their problem.
 */
export function ComponentCard({ view, days }: ComponentCardProps) {
  const { component, health } = view;

  return (
    <article className="border-t border-border-default py-6 first:border-0 first:pt-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold leading-6 text-text-primary">{component.name}</h3>
          <p className="mt-1 text-sm leading-6 text-text-secondary">{component.description}</p>
        </div>
        <StatusChip state={health.state} />
      </div>

      <UptimeStrip bars={view.bars} uptimePct={view.uptimePct} days={days} />

      <p className="mt-4 text-xs leading-5 text-text-muted">{component.probes}</p>

      <p className="mt-2 text-xs leading-5 text-text-muted">
        {health.lastCheckedAt ? (
          <>
            Last check{' '}
            <time dateTime={health.lastCheckedAt.toISOString()}>
              {formatUtcTimestamp(health.lastCheckedAt)}
            </time>
            {health.detail ? <> — {health.detail}</> : null}
          </>
        ) : (
          // The live view only reads the last hour, so this is "not recently"
          // rather than "not ever" — the strip above covers the rest.
          'No check recorded in the past hour.'
        )}
      </p>
    </article>
  );
}
