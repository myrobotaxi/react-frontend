import { Logo } from '@/components/ui/Logo';
import {
  PRIVACY_CONTACT_EMAIL,
  PRIVACY_EFFECTIVE_DATE,
  PRIVACY_EFFECTIVE_DATE_ISO,
} from '@/lib/constants';

import { PolicyList, PolicySection, PolicyText } from './PolicyPrimitives';
import { PrivacyAccountSections } from './PrivacyAccountSections';
import { PrivacyCommitmentSections } from './PrivacyCommitmentSections';
import { PrivacyCompanySections } from './PrivacyCompanySections';
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
 * The document is written from an audit of the iOS app, the telemetry server,
 * and this repository rather than from a template, and it holds itself to one
 * rule: no sentence that the source code does not support.
 *
 * It is written entirely in the present tense. A privacy policy describes the
 * system as it stands; a reader deciding whether to trust the product is not
 * served by a history of it, and change-log paragraphs make a live product read
 * as unfinished. The effective date carries that job by itself, which is what
 * effective dates are for.
 *
 * Present tense raises the bar on accuracy rather than lowering it. Stating a
 * protection without the story of how it arrived means each sentence has to be
 * exactly as broad as the code makes it and no broader — which is why the
 * storage section states what is encrypted AND what is stored as text, in one
 * inventory, in the same breath. Neither half may be edited away alone.
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
              it for a ride. That means handling data about where your car is and where people are
              going, which is about as personal as data gets. This page sets out precisely what we
              collect, who can see it, how long we hold it, and how to delete it.
            </PolicyText>
            <PolicyList
              items={[
                'Sign in with Apple is the only way into the app. There are no passwords.',
                'If you link a Tesla, we store detailed data about it, including its location and the full GPS trail of every drive.',
                'Location data is stored exclusively as encrypted ciphertext, under a key held outside the database. We cannot read your drives from the database, and neither can anyone who obtains a copy of it.',
                'Drives and their GPS trails are deleted automatically after one year.',
                'Someone you share a car with sees where it is, where it is going, and how charged it is — not what is playing, not the cabin, not the locks, and no controls.',
                'We do not sell your data. There is no advertising, tracking, or analytics code anywhere in the app.',
                'You can delete your account from inside the app, and two final steps happen on Tesla’s side.',
              ]}
            />
            <PolicyText>
              Questions, corrections, or a request for your data:{' '}
              <a className="text-gold hover:text-gold-light" href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>
                {PRIVACY_CONTACT_EMAIL}
              </a>
              .
            </PolicyText>
          </PolicySection>

          <PrivacyCompanySections />
          <PrivacyAccountSections />
          <PrivacySharingSections />
          <PrivacyHandlingSections />
          <PrivacyDeletionSections />
          <PrivacyCommitmentSections />

          <PolicySection id="changes" title="When this page changes">
            <PolicyText>
              We update this page whenever our practices change — a new kind of data, a new company
              processing it, a different retention period — and we move the effective date at the top
              when we do. If a change materially affects you, we tell you in the app rather than
              editing this page quietly.
            </PolicyText>
            <PolicyText>
              One thing to weigh the rest of this page against: it is written from a direct audit of
              our own source code — the iOS app, the server, and this website — and we are the ones
              who conducted it. No independent party has reviewed our systems or verified the claims
              here. That is the honest standing of this document, and you should read it knowing so.
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
