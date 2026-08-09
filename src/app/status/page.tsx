import type { Metadata } from 'next';

import { loadStatusData, StatusScreen } from '@/features/status';
import { SITE_ORIGIN, STATUS_ROUTE } from '@/lib/constants';
import { buildStatusView } from '@/lib/status/view';

export const metadata: Metadata = {
  title: 'Service status — MyRoboTaxi',
  description:
    'Live status of the MyRoboTaxi telemetry API, real-time updates and website, with 90 days of uptime history and a written incident log.',
  alternates: { canonical: `${SITE_ORIGIN}${STATUS_ROUTE}` },
  // A status page in a search result is stale by definition; the URL is the
  // thing worth indexing, not a snapshot of a green dot from last Tuesday.
  robots: { index: true, follow: true },
};

/**
 * Regenerate once a minute, which is the rate the prober writes at.
 *
 * Server-rendered and cached rather than polled from the browser: an incident
 * is when this page gets its traffic, and a few thousand tabs each fetching
 * every few seconds is a self-inflicted second outage. One render per minute
 * serves everyone.
 */
export const revalidate = 60;

/**
 * `https://myrobotaxi.app/status` — public, no session, no client JavaScript
 * required to read it.
 *
 * A thin orchestrator: read, derive, render. The derivation is pure and lives
 * in `lib/status`; the reads never throw, so this page answers even when its
 * own database does not.
 */
export default async function StatusPage() {
  return <StatusScreen view={buildStatusView(await loadStatusData())} />;
}
