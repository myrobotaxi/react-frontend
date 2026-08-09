import type { StatusIncidentRecord } from '@/lib/status/types';

import { IncidentEntry } from './IncidentEntry';

/** Props for the IncidentLog component. */
export interface IncidentLogProps {
  incidents: readonly StatusIncidentRecord[];
}

/**
 * The written record.
 *
 * Separate from the automated history above it on purpose: the bars say what
 * the prober measured, the log says what we understood and what we changed.
 * Only the second one is worth a reader's time after the fact, and only a
 * person can write it.
 *
 * An empty log says the log is empty. It does not say there have been no
 * incidents — this record starts on 9 August 2026 and claiming a clean history
 * before that would be the same lie as a green chip with no probe behind it.
 */
export function IncidentLog({ incidents }: IncidentLogProps) {
  return (
    <section className="mt-12 border-t border-border-default pt-10">
      <h2 className="text-lg font-semibold leading-7 text-text-primary">Incident history</h2>

      {incidents.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-text-secondary">
          No incidents have been written up here yet. This log begins on 9 August 2026; it is not
          a record of everything that happened before then.
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          {incidents.map((incident) => (
            <IncidentEntry key={incident.id} incident={incident} />
          ))}
        </div>
      )}
    </section>
  );
}
