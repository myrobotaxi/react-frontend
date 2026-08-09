import { Logo } from '@/components/ui/Logo';
import type { StatusView } from '@/lib/status/view';

import { ComponentCard } from './ComponentCard';
import { HowThisPageWorks } from './HowThisPageWorks';
import { IncidentLog } from './IncidentLog';
import { StatusBanner } from './StatusBanner';

/** Props for the StatusScreen component. */
export interface StatusScreenProps {
  view: StatusView;
}

/**
 * `https://myrobotaxi.app/status` — the public service status page.
 *
 * Standalone, like the privacy policy: the brand lockup, the document, and no
 * navigation into the rest of the site. Someone reaching this page is usually
 * having a bad time already and wants one question answered.
 *
 * A pure render of an already-derived view. Every judgement — what counts as
 * down, what a day's colour is, what to say when there is nothing to say — was
 * made by pure functions in `lib/status` and is covered by tests. This file
 * only arranges the result.
 */
export function StatusScreen({ view }: StatusScreenProps) {
  return (
    <main className="min-h-screen bg-bg-primary px-6 py-16">
      <div className="mx-auto w-full max-w-2xl animate-fade-in">
        <header className="text-center">
          <Logo size="sm" />
          <h1 className="mt-2 text-2xl font-semibold leading-8 text-text-primary">
            Service status
          </h1>
        </header>

        <div className="mt-10">
          <StatusBanner
            state={view.overall}
            lastCheckedAt={view.lastCheckedAt}
            available={view.available}
          />
        </div>

        <section className="mt-12">
          <h2 className="text-lg font-semibold leading-7 text-text-primary">Components</h2>
          <div className="mt-6">
            {view.components.map((componentView) => (
              <ComponentCard
                key={componentView.component.id}
                view={componentView}
                days={view.historyDays}
              />
            ))}
          </div>
        </section>

        <IncidentLog incidents={view.incidents} />
        <HowThisPageWorks days={view.historyDays} />
      </div>
    </main>
  );
}
