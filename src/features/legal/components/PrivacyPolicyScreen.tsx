import { Logo } from '@/components/ui/Logo';
import { CONTACT_EMAIL, PRIVACY_EFFECTIVE_DATE, PRIVACY_EFFECTIVE_DATE_ISO } from '@/lib/constants';

import { PolicyList, PolicySection, PolicyTerm, PolicyText } from './PolicyPrimitives';
import { PrivacyAccountSections } from './PrivacyAccountSections';
import { PrivacyDeletionSections } from './PrivacyDeletionSections';
import { PrivacyHandlingSections } from './PrivacyHandlingSections';
import { PrivacySharingSections } from './PrivacySharingSections';

/**
 * The privacy policy at `https://myrobotaxi.app/privacy`.
 *
 * Public and standalone, like the invite landing: the brand lockup, the
 * document, and no navigation into the rest of the (retired) site. It is the URL
 * registered in App Store Connect, so it has to answer for a reader with no
 * account, no invite, and no reason to trust us yet.
 *
 * The document was written from an audit of the iOS app, the telemetry server,
 * and this repository rather than from a template, and it holds itself to one
 * rule: no sentence that the source code does not support.
 *
 * The first version of this page had three unflattering answers to give — a
 * viewer saw nearly everything, three columns were mid-migration to encryption,
 * and drive history was never aged out — and gave them. All three have since
 * been fixed in the product (MYR-433, MYR-435, MYR-439), so this version states
 * the protections instead. The rule did not change, and it is doing more work
 * now than it was before: a page that is allowed to say "we cannot read your
 * drives" is a page where every such sentence has to be exactly as narrow as
 * the code makes it. See the security section's "honest limit" paragraph.
 */
export function PrivacyPolicyScreen() {
  return (
    <main className="min-h-screen bg-bg-primary px-6 py-16">
      <div className="mx-auto w-full max-w-2xl animate-fade-in">
        <header className="text-center">
          <Logo size="sm" />
          <h2 className="mt-2 text-2xl font-semibold leading-8 text-text-primary">
            Privacy policy
          </h2>
          <p className="mt-3 text-sm leading-6 text-text-muted">
            Effective{' '}
            <time dateTime={PRIVACY_EFFECTIVE_DATE_ISO}>{PRIVACY_EFFECTIVE_DATE}</time>
          </p>
        </header>

        <div className="mt-12">
          <PolicySection id="summary" title="The short version">
            <PolicyText>
              MyRoboTaxi lets you watch your Tesla, share it with people you trust, and let them ask
              it for a ride. Doing that means handling data about where your car is and where people
              are going, which is about as personal as data gets. This page describes exactly what we
              collect, who can see it, and how to get rid of it. It was written by reading our own
              source code, not by filling in a template, so it is specific — and it says where each
              protection stops rather than rounding up.
            </PolicyText>
            <PolicyList
              items={[
                'Sign in with Apple is the only way into the app. There are no passwords.',
                'If you link a Tesla, we store detailed data about it, including its location and the full GPS trail of every drive.',
                'Every coordinate we hold is encrypted, under a key that is not in the database. We cannot read your drives out of it, and neither can anyone who obtains it.',
                'Drives and their GPS trails are deleted automatically after a year.',
                'Someone you share a car with sees where it is, where it is going, and how charged it is — not what is playing, not the cabin, not the locks, and no controls.',
                'We do not sell your data. There is no advertising, tracking, or analytics code anywhere in the app.',
                'You can delete your account from inside the app, and two final steps happen on Tesla’s side.',
              ]}
            />
            <PolicyText>
              Questions, corrections, or a request for your data:{' '}
              <a className="text-gold hover:text-gold-light" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
              .
            </PolicyText>
          </PolicySection>

          <PrivacyAccountSections />
          <PrivacySharingSections />
          <PrivacyHandlingSections />
          <PrivacyDeletionSections />

          <PolicySection id="changes" title="When this page changes">
            <PolicyText>
              <PolicyTerm>What changed on August 3, 2026.</PolicyTerm> Three things, all of them
              narrowing what is exposed. Coordinates and tokens are now stored only as ciphertext and
              the unencrypted copies have been deleted, so the paragraph admitting that three of them
              were mid-migration is gone. Drives and their GPS trails are now deleted automatically
              after a year, where before they were kept indefinitely. And people you share a car with
              no longer see what is playing, the cabin, the seats, the locks, or any controls state.
            </PolicyText>
            <PolicyText>
              One loose end, since the page above claims nothing unencrypted is written any more:
              this website still carries the Tesla-linking route from the retired web app, which is
              the last code that could deposit an unencrypted token or coordinate. Nobody links a car
              that way — the iOS app does it — and the rest of the retired app is closed off, but the
              route stays reachable because Tesla has it registered. Until we remove it, we re-run the
              sweep that clears anything it leaves behind.
            </PolicyText>
            <PolicyText>
              We update this page whenever what we actually do changes — a new kind of data, a new
              company processing it, a different retention period — and we move the effective date at
              the top when we do. If a change materially affects you, we will say so in the app
              rather than quietly editing this page.
            </PolicyText>
            <PolicyText>
              MyRoboTaxi is an independent product and is not affiliated with or endorsed by Tesla,
              Inc. or Apple Inc.
            </PolicyText>
          </PolicySection>
        </div>
      </div>
    </main>
  );
}
