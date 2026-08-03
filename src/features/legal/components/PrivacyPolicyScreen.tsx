import { Logo } from '@/components/ui/Logo';
import { CONTACT_EMAIL, PRIVACY_EFFECTIVE_DATE, PRIVACY_EFFECTIVE_DATE_ISO } from '@/lib/constants';

import { PolicyList, PolicySection, PolicyText } from './PolicyPrimitives';
import { PrivacyAccountSections } from './PrivacyAccountSections';
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
 * rule: no sentence that the source code does not support. Where the honest
 * answer is unflattering — a viewer sees nearly everything, three columns are
 * mid-migration to encryption, drive history is not being aged out yet — it says
 * so plainly instead of reaching for a softer word.
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
              source code, not by filling in a template, so it is specific — and where something is
              unfinished, it says so rather than rounding up.
            </PolicyText>
            <PolicyList
              items={[
                'Sign in with Apple is the only way into the app. There are no passwords.',
                'If you link a Tesla, we store detailed data about it, including its location and the full GPS trail of every drive.',
                'Someone you share a car with sees almost everything about it except the VIN.',
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

          <PolicySection id="changes" title="When this page changes">
            <PolicyText>
              We update this page whenever what we actually do changes — a new kind of data, a new
              company processing it, a different retention period — and we move the effective date at
              the top when we do. If a change materially affects you, we will say so in the app
              rather than quietly editing this page. Several sections above describe work in
              progress; those paragraphs will be rewritten as that work lands, not deleted early.
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
