import { Logo } from '@/components/ui/Logo';
import { TESTFLIGHT_JOIN_URL } from '@/lib/constants';

import { InviteCodeBlock } from './InviteCodeBlock';
import { JoinSteps } from './JoinSteps';

/** Props for the JoinInviteScreen component. */
export interface JoinInviteScreenProps {
  /**
   * Sanitized invite code, or `null` when the link carried no code or an
   * unparseable one. `null` renders generic copy with no code section.
   */
  code: string | null;
}

/**
 * Public invite landing page — the fallback surface for
 * `https://myrobotaxi.app/join/{CODE}` when Universal Links do not hand the
 * link to the installed iOS app.
 *
 * Deliberately standalone: no navigation, no links to any other route on this
 * (retired) site, and no network calls. The code is rendered straight from the
 * URL — this page never validates or redeems it.
 */
export function JoinInviteScreen({ code }: JoinInviteScreenProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-6 py-12">
      <div className="w-full max-w-sm animate-fade-in text-center">
        {/* Glowing mark, per the design system's first-run lockup. */}
        <Logo size="lg" glow />

        <h2 className="mt-2 text-xl font-semibold leading-8 text-text-primary">
          You&rsquo;re invited to ride a Tesla on MyRoboTaxi
        </h2>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          {code
            ? 'Install the app, sign in, and enter your code to request rides.'
            : 'Install the app, sign in, and enter your invite code to request rides.'}
        </p>

        {code && (
          <div className="mt-8">
            <InviteCodeBlock code={code} />
          </div>
        )}

        <a
          href={TESTFLIGHT_JOIN_URL}
          className="mt-8 flex w-full items-center justify-center rounded-xl bg-gold px-6 py-4 text-base font-semibold text-bg-primary transition-colors hover:bg-gold-light"
          rel="noreferrer noopener external"
        >
          Get the app on TestFlight
        </a>

        <div className="mt-10">
          <JoinSteps hasCode={Boolean(code)} />
        </div>
      </div>
    </main>
  );
}
