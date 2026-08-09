import {
  formatUtcTimestamp,
  OVERALL_HEADLINE,
  OVERALL_SUBHEAD,
  STATE_DOT_CLASSES,
} from '@/lib/status/presentation';
import type { ComponentState } from '@/lib/status/types';

/** Props for the StatusBanner component. */
export interface StatusBannerProps {
  state: ComponentState;
  /** The most recent probe of any component, or null when there is none. */
  lastCheckedAt: Date | null;
  /** False when this render could not read the status tables at all. */
  available: boolean;
}

/**
 * The headline: the worst thing currently true, and when we last looked.
 *
 * Calm by construction. No siren red backgrounds, no animation — the surface
 * that tells someone their service is down should be the steadiest thing on
 * their screen. The state is carried by a dot and a sentence.
 */
export function StatusBanner({ state, lastCheckedAt, available }: StatusBannerProps) {
  return (
    <section className="rounded-2xl border border-border-default bg-bg-surface px-6 py-6">
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${STATE_DOT_CLASSES[state]}`} aria-hidden />
        <h2 className="text-lg font-semibold leading-7 text-text-primary">
          {OVERALL_HEADLINE[state]}
        </h2>
      </div>

      <p className="mt-3 text-sm leading-6 text-text-secondary">{OVERALL_SUBHEAD[state]}</p>

      {!available && (
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          This page could not read its own records just now, so it has nothing to report either
          way. That is a fault with the status page rather than a statement about the services
          below.
        </p>
      )}

      <p className="mt-4 text-xs leading-5 text-text-muted">
        {lastCheckedAt ? (
          <>
            Last checked <time dateTime={lastCheckedAt.toISOString()}>
              {formatUtcTimestamp(lastCheckedAt)}
            </time>
          </>
        ) : (
          'No checks recorded yet.'
        )}
      </p>
    </section>
  );
}
