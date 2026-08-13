import type { Metadata } from 'next';

import { RideJoinScreen } from '@/features/rides';
import { sanitizeRideCode } from '@/lib/ride-code';

import { buildRideMetadata } from '../ride-metadata';

interface RideJoinPageProps {
  params: Promise<{ code: string }>;
}

/**
 * Link-preview tags for `/ride/{CODE}` (MYR-540).
 *
 * Constant tags for every ride link — see `ride-metadata.ts` for why a card
 * that is forwarded into a group chat must not describe the ride. The code is
 * passed for the dormant smart app banner's `app-argument` and reaches no tag
 * a scraper renders.
 */
export async function generateMetadata({ params }: RideJoinPageProps): Promise<Metadata> {
  const { code } = await params;

  return buildRideMetadata(sanitizeRideCode(code));
}

/**
 * Group-ride join landing — `/ride/{CODE}`.
 *
 * The sibling of `/join/{CODE}`, and the web half of MYR-540. Its whole job is
 * the visitor who does NOT have the app: iOS hands a Universal Link straight to
 * an installed app and nobody sees this page at all, but a link tapped inside a
 * third-party in-app browser (Telegram, WhatsApp, Instagram) is loaded by that
 * app's own webview and the universal-link machinery never runs. So: install
 * steps, and a `myrobotaxi://` button for the person who has the app already.
 *
 * ── WHAT THE JOIN PAGE DOES THAT THIS ONE DELIBERATELY DOES NOT ─────────────
 * `/join/{CODE}` verifies an Ed25519 signature over the code, expiry and names
 * (MYR-368) and REDIRECTS to `/` when it fails. This page performs no
 * verification, no expiry check and no lookup of any kind, and that is a
 * decision, not an omission:
 *
 *  • **What the signature is for does not exist here.** MYR-368 added the check
 *    so that `?from=` / `?to=` names could be rendered into a preview card that
 *    messaging platforms scrape and cache — a crafted URL could otherwise write
 *    arbitrary text into a card shown to a whole group chat. This page renders
 *    no names, no query values, and nothing derived from the code. There is
 *    nothing for a signature to make trustworthy.
 *  • **It is not the credential.** A MYR-368 signature proves *we minted this
 *    URL*; it never proves the code is live. Joining is a server-side, signed-in
 *    redemption against the telemetry service — that is where a revoked,
 *    expired or ended ride is refused, and that check cannot be moved here
 *    without turning an open page into an oracle for which rides are running.
 *  • **Failing closed would break the one job.** The share link's expiry is the
 *    ride's terminal time plus a linger, which is short. A visitor who taps a
 *    link minutes late and gets bounced to the teaser learns nothing and cannot
 *    even install the app; the same visitor on this page gets install steps and
 *    an honest line saying the link may have closed. The invite page can afford
 *    to redirect because its rejection matrix protects a cached preview card.
 *    This page has no card to protect and a person to help.
 *
 * The gate that DOES run is the shape gate in `lib/lockdown.ts`, in the proxy:
 * a segment that is not code-shaped is 302'd to the teaser before it reaches
 * this file. With the lockdown off (the Playwright suite) a malformed segment
 * lands here, `sanitizeRideCode` returns `null`, and the page renders the same
 * words with no app-open button — a dead end is never rendered as a live one.
 *
 * ── NOTE WHAT IS NOT IN THE SIGNATURE OF THIS FUNCTION ──────────────────────
 * There is no `searchParams`. The page cannot read the query even by accident,
 * which is the strongest available statement that no URL-supplied value reaches
 * the rendered tree. Rendering is a pure function of one path segment's shape:
 * no API, no database, no cache, no log.
 */
export default async function RideJoinPage({ params }: RideJoinPageProps) {
  const { code } = await params;

  return <RideJoinScreen code={sanitizeRideCode(code)} />;
}
