import { PRIVACY_CONTACT_EMAIL } from '@/lib/constants';

import { PolicyList, PolicySection, PolicyTerm, PolicyText } from './PolicyPrimitives';

/**
 * The four promises the rest of the document is measured against: what you can
 * make us do, what we do if we lose your data, what happens to it if the
 * company does not survive, and the fact that nobody outside the company has
 * checked any of this.
 *
 * These are the sections most privacy policies fill with conditionals — "where
 * required by applicable law", "as soon as reasonably practicable" — and each
 * one of those is a way of promising nothing at length. The commitments here
 * are unconditional and have numbers attached, because a commitment a reader
 * cannot hold us to is not worth the space it takes.
 *
 * "Your rights" sits apart from "Your choices" on purpose. Choices are the
 * switches in the product; rights are what you are owed whether or not a switch
 * exists for them, and collapsing the two would let a missing feature quietly
 * read as a missing right.
 *
 * The closing note on the absence of an external audit is the least flattering
 * sentence on the page and the reason the rest of it can be taken at face
 * value. A document that lists its own protections and omits who verified them
 * is inviting an assumption it has not earned.
 */
export function PrivacyCommitmentSections() {
  return (
    <>
      <PolicySection id="rights" title="Your rights">
        <PolicyText>
          These hold wherever you live. We do not ask for a reason and we do not charge for any of
          them.
        </PolicyText>
        <PolicyList
          items={[
            <>
              <PolicyTerm>See what we hold about you.</PolicyTerm> Most of it is already in the app —
              your cars, your drives, your rides, your saved places. For a complete export, including
              anything the app does not display, email{' '}
              <a className="text-gold hover:text-gold-light" href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>
                {PRIVACY_CONTACT_EMAIL}
              </a>
              .
            </>,
            <>
              <PolicyTerm>Correct it.</PolicyTerm> A car&rsquo;s details and your saved places are
              editable in the app. Your name and email come from Apple, so write to us and we will
              change them by hand.
            </>,
            <>
              <PolicyTerm>Delete it.</PolicyTerm> Settings, then delete your account — it runs
              immediately, with no request to approve and no waiting period, exactly as described
              above. Write to us instead if you would rather we did it.
            </>,
          ]}
        />
        <PolicyText>
          We never sell personal data. That is not a policy we could quietly reverse: no code path
          for selling, sharing, or brokering it exists anywhere in the app, the server, or this
          website, and building one would be a change large enough to appear on this page first.
        </PolicyText>
      </PolicySection>

      <PolicySection id="breach" title="If your data is exposed">
        <PolicyText>
          If personal data is exposed, we notify the users affected without undue delay, and in any
          case within 72 hours of confirming it. The clock starts when we confirm a breach, not when
          we finish investigating it — a notice that waits for a complete picture arrives after it
          was useful.
        </PolicyText>
        <PolicyText>
          The notice tells you what was exposed, when, what we have done about it, and what you
          should do. We notify regulators as well where the law requires it. If we are still working
          out the scope, we say so rather than delaying the notice until we are not.
        </PolicyText>
      </PolicySection>

      <PolicySection id="change-of-control" title="If MyRoboTaxi changes hands">
        <PolicyText>
          If the product is sold, merged, or otherwise transferred, your data goes only to a party
          that has committed in writing to protections at least as strong as the ones on this page.
          We tell you before that happens, not after, so that deleting your account first is a real
          option rather than a theoretical one.
        </PolicyText>
        <PolicyText>
          If MyRoboTaxi shuts down instead, user data is deleted within thirty days of the service
          ending. It is not held for a buyer who might appear later.
        </PolicyText>
      </PolicySection>
    </>
  );
}
