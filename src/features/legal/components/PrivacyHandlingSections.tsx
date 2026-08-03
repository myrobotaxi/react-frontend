import { CONTACT_EMAIL } from '@/lib/constants';

import {
  PolicyCallout,
  PolicyList,
  PolicySection,
  PolicyTerm,
  PolicyText,
} from './PolicyPrimitives';

/**
 * Policy sections covering the companies that process data on our behalf,
 * security, retention, deletion, and your choices.
 *
 * The security and retention sections each contain a paragraph that describes
 * something unfinished. They are deliberate: an internal design document
 * requires column encryption on data that the code has not finished migrating,
 * and specifies a drive-pruning job that is not running. Saying so is the only
 * honest option, and both notes come out when the code catches up.
 */
export function PrivacyHandlingSections() {
  return (
    <>
      <PolicySection id="processors" title="Who else touches your data">
        <PolicyText>
          We are a small operation and we do not run our own hardware. These companies process data
          on our behalf, each for one job:
        </PolicyText>
        <PolicyList
          items={[
            <>
              <PolicyTerm>Apple</PolicyTerm> — sign-in, push notifications, and the Maps services the
              app uses on your device to turn coordinates and searches into place names.
            </>,
            <>
              <PolicyTerm>Tesla</PolicyTerm> — the source of all vehicle data, and the recipient of
              the commands and navigation destinations we send on your behalf.
            </>,
            <>
              <PolicyTerm>Fly.io</PolicyTerm> — hosts our server.
            </>,
            <>
              <PolicyTerm>Supabase</PolicyTerm> — hosts our database and its backups.
            </>,
            <>
              <PolicyTerm>Vercel</PolicyTerm> — hosts this website.
            </>,
            <>
              <PolicyTerm>Mapbox</PolicyTerm> — turns coordinates into street addresses on the
              server. When we work out where a drive started and ended, or the address a car is
              parked at, we send those exact coordinates to Mapbox.
            </>,
            <>
              <PolicyTerm>Sentry</PolicyTerm> — error monitoring for this website, as described
              above.
            </>,
          ]}
        />
        <PolicyText>
          We may also disclose data if the law requires it, but no such request has been made.
        </PolicyText>
      </PolicySection>

      <PolicySection id="security" title="How it is protected">
        <PolicyText>
          Everything travels over encrypted connections. Cars connect to our server using mutual TLS,
          so both ends prove who they are. Invite codes and notification tokens are treated as
          credentials and kept out of our logs, and VINs appear in logs only as their last four
          characters. Coordinates, addresses, email addresses, and tokens are not written to logs at
          all.
        </PolicyText>
        <PolicyText>
          <PolicyTerm>
            Ride pickup and dropoff coordinates, and your saved Home and Work coordinates, are
            encrypted in the database
          </PolicyTerm>{' '}
          with AES-256-GCM, under a key held outside the database. There is no unencrypted copy of
          them.
        </PolicyText>
        <PolicyCallout title="Being straight about what is not encrypted yet">
          <p>
            Three things are partway through the same migration: your Tesla access tokens, your
            car&rsquo;s live coordinates, and stored route lines. Encrypted copies are being written,
            but unencrypted copies still exist alongside them and have not been removed. Until that
            work is finished, treat those three as protected by our database host&rsquo;s
            disk encryption and access controls rather than by encryption of our own.
          </p>
          <p>
            Names, email addresses, street addresses and place names, licence plates, passenger phone
            numbers, and notification tokens are not separately encrypted either, and rely on the
            same protections. We will update this page when that changes.
          </p>
        </PolicyCallout>
      </PolicySection>

      <PolicySection id="retention" title="How long we keep it">
        <PolicyList
          items={[
            <>
              <PolicyTerm>Live vehicle state</PolicyTerm> — overwritten each time it updates. We keep
              no history of it.
            </>,
            <>
              <PolicyTerm>Drives and their GPS trails</PolicyTerm> — kept until you remove the car or
              delete your account. We had intended to age these out after a year; that job is not
              running yet, so today they are kept indefinitely. When we switch it on, this page will
              say so.
            </>,
            <>
              <PolicyTerm>Rides</PolicyTerm> — kept as history for both the rider and the owner.
            </>,
            <>
              <PolicyTerm>Invite codes</PolicyTerm> — stop working after seven days, or as soon as
              the owner revokes them.
            </>,
            <>
              <PolicyTerm>Sign-in sessions</PolicyTerm> — expire after ninety days without use, and
              are revoked immediately when you sign out or delete your account.
            </>,
            <>
              <PolicyTerm>Live Activity tokens</PolicyTerm> — deleted when the ride ends; anything
              left over is swept within 24 hours.
            </>,
            <>
              <PolicyTerm>Our audit log</PolicyTerm> — a permanent record of significant actions,
              holding identifiers, action names, and timestamps only. No names, locations, or
              addresses.
            </>,
            <>
              <PolicyTerm>Server logs</PolicyTerm> — kept for our hosting provider&rsquo;s default
              period. We have not set a shorter one, and we would rather say that than quote a number
              we do not enforce.
            </>,
            <>
              <PolicyTerm>Backups</PolicyTerm> — our database host keeps encrypted backups for up to
              about thirty days, with a seven-day window for point-in-time restore. Deleted data can
              survive in a backup for that long.
            </>,
          ]}
        />
      </PolicySection>

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
              someone else&rsquo;s car, that ride is their record too, and it stays. Your name is no
              longer shown against it.
            </>,
            <>
              <PolicyTerm>A record that a share was revoked</PolicyTerm>, including the label the
              owner typed for the person, and a record that a VIN was removed.
            </>,
            <>
              <PolicyTerm>Your notification preference toggles</PolicyTerm> — five on/off settings,
              orphaned. They should be deleted with everything else and are not; we will fix that.
            </>,
            <>
              <PolicyTerm>Backups</PolicyTerm>, for up to about thirty days, as above.
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
          <a className="text-gold hover:text-gold-light" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>{' '}
          and we will sort it out by hand.
        </PolicyText>
      </PolicySection>

      <PolicySection id="children" title="Children">
        <PolicyText>
          MyRoboTaxi is not intended for children under 13, and we do not knowingly collect their
          information. If you believe a child has given us data, email us and we will delete it.
        </PolicyText>
      </PolicySection>
    </>
  );
}
