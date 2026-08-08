import { PRIVACY_CONTACT_EMAIL } from '@/lib/constants';

import { PolicyCallout, PolicyList, PolicySection, PolicyTerm, PolicyText } from './PolicyPrimitives';

/**
 * Policy sections covering account deletion, the choices a reader has, and
 * children.
 *
 * Separate from `PrivacyHandlingSections` because "what we do with it while we
 * hold it" and "how to make us stop holding it" are separate questions, and
 * because one file covering both exceeds the size rule.
 *
 * The deletion list is deliberately a list of what the code does, in the order
 * it does it, including the parts that survive — a deletion section that only
 * describes the deleting is the easiest place on a policy page to be quietly
 * untrue.
 */
export function PrivacyDeletionSections() {
  return (
    <>
      <PolicySection id="deletion" title="Deleting your account">
        <PolicyText>
          You can delete your account from inside the app, under Settings. It is not a request and
          there is no waiting period — it happens immediately. We:
        </PolicyText>
        <PolicyList
          items={[
            'cancel any ride you have open',
            'ask Tesla to revoke our access to your account',
            'delete every car you added, along with its drives, trip stops, route data, and ride records',
            'revoke every share you granted and every share granted to you',
            'delete your notification devices and your saved places',
            'revoke your sign-in sessions',
            'delete your Apple sign-in link and your account itself',
          ]}
        />
        <PolicyCallout title="Two steps only you can do">
          <p>
            If you linked a car, two things live on Tesla&rsquo;s side and there is no way for us to
            do them for you. Remove the MyRoboTaxi key from the car&rsquo;s touchscreen, under
            Controls → Locks, and remove our access in the Tesla app under Profile → Third-Party
            Apps. The app shows you both at the end of deletion.
          </p>
        </PolicyCallout>
        <PolicyText>What survives deletion, and why:</PolicyText>
        <PolicyList
          items={[
            <>
              <PolicyTerm>Audit log entries</PolicyTerm>, which record that something happened and
              when. They hold no names or locations.
            </>,
            <>
              <PolicyTerm>Rides in the other party&rsquo;s history.</PolicyTerm> If you rode in
              someone else&rsquo;s car, that ride is their record too, and it stays. Your name is not
              shown against it.
            </>,
            <>
              <PolicyTerm>A record that a share was revoked</PolicyTerm>, including the label the
              owner typed for the person, and a record that a VIN was removed.
            </>,
            <>
              <PolicyTerm>Your notification preference toggles</PolicyTerm> — five on/off settings,
              which hold no personal information and are not attached to a working account once yours
              is gone.
            </>,
            <>
              <PolicyTerm>Backups</PolicyTerm>, for up to thirty days, as above.
            </>,
          ]}
        />
        <PolicyText>
          One consequence worth knowing: if an <PolicyTerm>owner</PolicyTerm> deletes their account,
          the ride records for their cars go too — including from the ride history of everyone who
          rode in them. A rider deleting their account does not remove anything from the
          owner&rsquo;s history.
        </PolicyText>
      </PolicySection>

      <PolicySection id="choices" title="Your choices">
        <PolicyList
          items={[
            'Delete your account, and everything above happens.',
            'Revoke or suspend any share you have granted, at any time, from the app.',
            'Unlink your Tesla, or revoke our access from the Tesla app directly.',
            'Turn off any category of notification in the app, or all of them in iOS Settings.',
            'Turn off location access for the app in iOS Settings. Pickup will need to be chosen manually.',
          ]}
        />
        <PolicyText>
          If you want a copy of what we hold about you, or you want something corrected, email{' '}
          <a className="text-gold hover:text-gold-light" href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>
            {PRIVACY_CONTACT_EMAIL}
          </a>{' '}
          and we will take care of it.
        </PolicyText>
      </PolicySection>

      <PolicySection id="children" title="Children">
        <PolicyText>
          MyRoboTaxi is not intended for children under 13, and we do not knowingly collect their
          information. If you believe a child has given us data, write to{' '}
          <a className="text-gold hover:text-gold-light" href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>
            {PRIVACY_CONTACT_EMAIL}
          </a>{' '}
          and we will delete it.
        </PolicyText>
      </PolicySection>
    </>
  );
}
