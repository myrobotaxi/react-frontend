import type { Metadata } from 'next';

import { PrivacyPolicyScreen } from '@/features/legal';
import { PRIVACY_EFFECTIVE_DATE, PRIVACY_ROUTE, SITE_ORIGIN } from '@/lib/constants';

/**
 * Static tags. Unlike the invite landing, nothing here depends on the request —
 * the policy is the same document for everybody, which is rather the point.
 *
 * `alternates.canonical` matters because this URL is registered in App Store
 * Connect and will be linked to from outside; the apex is the only address it
 * should ever resolve as.
 */
export const metadata: Metadata = {
  title: 'Privacy Policy — MyRoboTaxi',
  description: `What MyRoboTaxi collects, where it lives, who can see it, and how to delete it. Effective ${PRIVACY_EFFECTIVE_DATE}.`,
  alternates: { canonical: `${SITE_ORIGIN}${PRIVACY_ROUTE}` },
};

/**
 * `https://myrobotaxi.app/privacy` — required by App Store Connect for external
 * TestFlight distribution, and reachable by anyone regardless of the lockdown,
 * the beta gate, or whether they have an account (MYR-427).
 *
 * A pure render of a static document: no database, no API call, no session
 * lookup, nothing derived from the request.
 */
export default function PrivacyPage() {
  return <PrivacyPolicyScreen />;
}
