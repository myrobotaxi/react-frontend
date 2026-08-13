import { appRideURL } from '@/lib/app-link';
import { TESTFLIGHT_JOIN_URL } from '@/lib/constants';

/** Props for the RideAppCTA component. */
export interface RideAppCTAProps {
  /**
   * Sanitized ride join code from the URL PATH, or `null` when the segment was
   * not code-shaped. `null` drops the app-open button entirely.
   */
  code: string | null;
}

/** Gold, filled: the one action most visitors should take. */
const PRIMARY_CTA_CLASS =
  'flex w-full items-center justify-center rounded-xl bg-gold px-6 py-4 text-base font-semibold text-bg-primary transition-colors hover:bg-gold-light';

/** Outlined: present, tappable, visibly the other path. */
const SECONDARY_CTA_CLASS =
  'flex w-full items-center justify-center rounded-xl border border-border-default px-6 py-4 text-base font-medium text-text-primary transition-colors hover:bg-bg-surface-hover';

/**
 * The two ways off the ride landing page, in the order a recipient should
 * consider them.
 *
 * Deliberately the same shape as `JoinAppCTA` (MYR-453), including the refusal
 * that matters most: THERE IS NO "DID THE APP OPEN?" HEURISTIC. Firing the
 * scheme URL, starting a timer and sending anyone still here to TestFlight
 * fails exactly where this page is reached from — a third-party in-app browser
 * may not fire `visibilitychange` on backgrounding, and iOS's "Open in
 * MyRoboTaxi?" sheet freezes the page while the user reads it. Both produce a
 * false negative that yanks somebody who HAS the app off to an installer, which
 * is the bug, automated. Two labelled links, no timers, no client JavaScript —
 * this stays a server component, and if the scheme URL goes nowhere, nothing
 * navigates and the second button is right there.
 *
 * A group ride raises the stakes on that: the link is shared into a chat where
 * some people already have the app and some do not, so BOTH paths are the
 * common case here rather than one being a fallback.
 */
export function RideAppCTA({ code }: RideAppCTAProps) {
  const appURL = appRideURL(code);

  return (
    <>
      {appURL && (
        <a
          href={appURL}
          className={`mt-8 ${PRIMARY_CTA_CLASS}`}
          // Inert on a custom scheme — there is no referrer to send to a scheme
          // handler — but kept identical to the outbound link below so no
          // future reader has to work out whether the difference was meant.
          rel="noreferrer noopener external"
        >
          Open the ride in the app
        </a>
      )}

      {appURL ? (
        <>
          <p className="mt-6 text-xs leading-5 text-text-muted">Don&apos;t have the app yet?</p>
          <a
            href={TESTFLIGHT_JOIN_URL}
            className={`mt-2 ${SECONDARY_CTA_CLASS}`}
            rel="noreferrer noopener external"
          >
            Get the app on TestFlight
          </a>
        </>
      ) : (
        <a
          href={TESTFLIGHT_JOIN_URL}
          className={`mt-8 ${PRIMARY_CTA_CLASS}`}
          rel="noreferrer noopener external"
        >
          Get the app on TestFlight
        </a>
      )}
    </>
  );
}
