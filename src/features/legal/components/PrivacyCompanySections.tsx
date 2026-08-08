import { LEGAL_ENTITY_NAME, PRIVACY_CONTACT_EMAIL, SUPPORT_CONTACT_EMAIL } from '@/lib/constants';

import { PolicyList, PolicySection, PolicyTerm, PolicyText } from './PolicyPrimitives';

/**
 * Who is publishing this document, how to reach them, and where the data
 * physically sits.
 *
 * These sections open the policy rather than closing it. A reader with no
 * account is being asked to trust a name they have not heard of; "who we are"
 * and "where your data goes" are the questions that come before any detail
 * about encryption, and a page that answers them last has answered them too
 * late.
 *
 * The mailboxes are split — privacy@ for rights, support@ for everything else —
 * so that a data request is not competing with bug reports for attention. No
 * personal address appears: the commitment belongs to the company.
 *
 * The regions are named specifically, not waved at with "the cloud". Both are
 * verifiable and neither is likely to be a pleasant surprise for a reader
 * outside the United States, which is exactly why the consequence for non-US
 * users is stated in the same breath rather than buried in a rights section
 * further down.
 */
export function PrivacyCompanySections() {
  return (
    <>
      <PolicySection id="who-we-are" title="Who we are">
        <PolicyText>
          {LEGAL_ENTITY_NAME
            ? `MyRoboTaxi is operated by ${LEGAL_ENTITY_NAME} (“we”), from the United States.`
            : 'MyRoboTaxi (“we”) operates from the United States.'}{' '}
          We write and run the iOS app, the server it talks to, and this website. We are the only
          party deciding what is collected and why, which makes us the ones answerable for it.
        </PolicyText>
        <PolicyText>Two addresses reach us, and both are read by a person:</PolicyText>
        <PolicyList
          items={[
            <>
              <PolicyTerm>
                <a
                  className="text-gold hover:text-gold-light"
                  href={`mailto:${PRIVACY_CONTACT_EMAIL}`}
                >
                  {PRIVACY_CONTACT_EMAIL}
                </a>
              </PolicyTerm>{' '}
              — for a copy of your data, a correction, a deletion, or any question about this page.
            </>,
            <>
              <PolicyTerm>
                <a
                  className="text-gold hover:text-gold-light"
                  href={`mailto:${SUPPORT_CONTACT_EMAIL}`}
                >
                  {SUPPORT_CONTACT_EMAIL}
                </a>
              </PolicyTerm>{' '}
              — for help with the app and everything else.
            </>,
          ]}
        />
      </PolicySection>

      <PolicySection id="data-location" title="Where your data is held">
        <PolicyText>
          Your data is hosted in the United States. Our database and its backups sit in Supabase&rsquo;s
          us-west-2 region in Oregon, our server runs on Fly.io in Ashburn, Virginia, and this website
          is served by Vercel. Nothing is stored outside the United States.
        </PolicyText>
        <PolicyText>
          If you use MyRoboTaxi from anywhere else, your data is transferred to the United States and
          processed there, under United States law and the protections set out on this page. Using
          the app is your consent to that transfer. It is a real trade-off rather than a formality,
          which is why it is stated here and not in a footnote.
        </PolicyText>
      </PolicySection>
    </>
  );
}
