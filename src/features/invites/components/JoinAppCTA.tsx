import { TESTFLIGHT_JOIN_URL } from '@/lib/constants';
import { appJoinURL } from '@/lib/app-link';

/** Props for the JoinAppCTA component. */
export interface JoinAppCTAProps {
  /**
   * Sanitized invite code from the URL PATH, or `null` when the link carried
   * none. `null` drops the app-open button entirely — see below.
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
 * The two ways off this page, in the order a recipient should consider them
 * (MYR-453).
 *
 * ── WHY TWO BUTTONS AND NOT A REDIRECT ──────────────────────────────────────
 * The obvious-looking implementation is the "did the app open?" heuristic: fire
 * the scheme URL, start a ~2s timer, and if the page is still visible when it
 * expires assume the app is missing and send the visitor to TestFlight. THIS
 * PAGE DELIBERATELY DOES NOT DO THAT.
 *
 * The heuristic is unreliable exactly where this page matters. Its signal is a
 * `visibilitychange` / timer race, and inside a third-party in-app browser —
 * the ONLY reason this page is the landing spot at all — the webview may not
 * fire visibility events on backgrounding, and iOS's "Open in MyRoboTaxi?"
 * confirmation sheet freezes the page while the user reads it, so the timer
 * expires with the app about to open. Both failure modes point the same way: a
 * FALSE NEGATIVE that yanks somebody who has the app off to an installer. That
 * is MYR-453's original bug, re-implemented in JavaScript and now firing
 * automatically instead of only when they pressed the wrong button.
 *
 * The honest version is the one below. Two plainly labelled links, no timers, no
 * sniffing, no client JavaScript at all — this stays a server component. The
 * visitor knows whether they installed the app, which is the one fact the
 * heuristic is trying and failing to guess. If the scheme URL goes nowhere
 * because the app is not installed, NOTHING BREAKS: no navigation happens, the
 * page is still on screen with the code still legible, and the second button is
 * right there. The cost of the graceful path is one tap, paid only by people who
 * guessed wrong about their own phone.
 *
 * With no code (`/join`, the retired codeless route) there is no in-app URL to
 * build — `myrobotaxi://join/` parses to nothing on the app side — so that arm
 * renders the TestFlight button alone, as the gold primary, exactly as this page
 * did before MYR-453.
 */
export function JoinAppCTA({ code }: JoinAppCTAProps) {
  const appURL = appJoinURL(code);

  return (
    <>
      {appURL && (
        <a
          href={appURL}
          className={`mt-8 ${PRIMARY_CTA_CLASS}`}
          // `noreferrer` is inert on a custom scheme — there is no referrer to
          // send to a scheme handler — but it is kept identical to the outbound
          // link below so no future reader has to work out whether the
          // difference was meaningful.
          rel="noreferrer noopener external"
        >
          Open in the app
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
