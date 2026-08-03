import { LegalFooter } from '@/components/layout/LegalFooter';
import { Logo } from '@/components/ui/Logo';
import { TESTFLIGHT_JOIN_URL } from '@/lib/constants';
import { inviteHeadline, inviteSubline } from '@/lib/invite-copy';

import { InviteCodeBlock } from './InviteCodeBlock';
import { JoinSteps } from './JoinSteps';

/** Props for the JoinInviteScreen component. */
export interface JoinInviteScreenProps {
  /**
   * Sanitized invite code, or `null` when the link carried no code or an
   * unparseable one. `null` renders generic copy with no code section.
   */
  code: string | null;
  /**
   * Sanitized sender first name from `?from=`, or `null` (MYR-359, MYR-368).
   * Sanitizing is the caller's job (`sanitizeInviterName`), on the page, before
   * this ever renders — a component that scrubbed its own props would put the
   * guard one layer below the one place the raw value is known. Since MYR-368
   * the page also verifies that the link's signature covers this value.
   */
  inviterName?: string | null;
  /** Sanitized recipient first name from `?to=`, under the same contract. */
  recipientName?: string | null;
}

/**
 * Public invite landing page — the fallback surface for
 * `https://myrobotaxi.app/join/{CODE}` when Universal Links do not hand the
 * link to the installed iOS app.
 *
 * Deliberately standalone: no navigation and no network calls. The code is
 * rendered straight from the URL — this page never validates or redeems it. The
 * only route it links to on this (retired) site is the privacy policy, in the
 * footer.
 */
export function JoinInviteScreen({
  code,
  inviterName = null,
  recipientName = null,
}: JoinInviteScreenProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-6 py-12">
      <div className="w-full max-w-sm animate-fade-in text-center">
        {/* Glowing mark, per the design system's first-run lockup. */}
        <Logo size="lg" glow />

        {/*
          Heading and sub-line are the SAME STRINGS as the link-preview card the
          recipient already tapped (MYR-359, MYR-368) — both come from
          `lib/invite-copy.ts`, which the page's `generateMetadata` also reads. A
          card that says "You're in, Mira" opening a page that says something
          else reads as a different page than the one they tapped.

          The "install the app / enter your code" line that used to sit here is
          gone rather than moved: it said the same three things the numbered
          steps below say, and it promised rides — which is wrong for a
          location-only invite. The steps are unchanged and still carry the
          instructions.
        */}
        <h2 className="mt-2 text-xl font-semibold leading-8 text-text-primary">
          {inviteHeadline(inviterName, recipientName)}
        </h2>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          {inviteSubline(inviterName, recipientName)}
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

        {/*
          The one link off this page, and the only reason it is allowed: a
          recipient deciding whether to install the app should be able to read
          what it collects first (MYR-427). In flow rather than anchored — this
          page is already taller than a small phone's viewport.
        */}
        <LegalFooter variant="inline" />
      </div>
    </main>
  );
}
