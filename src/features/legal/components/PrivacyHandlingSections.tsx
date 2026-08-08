import {
  PolicyCallout,
  PolicyList,
  PolicySection,
  PolicyTerm,
  PolicyText,
} from './PolicyPrimitives';

/**
 * Policy sections covering the companies that process data on our behalf, how
 * data is stored and protected, and how long it is kept.
 *
 * The storage section is a three-way inventory — encrypted, text, hashed —
 * rather than a paragraph about encryption followed by a caveat. The shape is
 * the point, and it is load-bearing in both directions: coordinates, trails,
 * routes and tokens being ciphertext is a checkable claim, and so is addresses
 * and place names being text. A future edit that keeps the first bullet and
 * drops the second turns a precise statement into an overclaim, which is why
 * `PrivacyPolicyScreen.test.tsx` pins the two together.
 *
 * "Your data is safe" appears nowhere, in any phrasing. It is the one sentence
 * that would swallow every specific claim around it.
 */
export function PrivacyHandlingSections() {
  return (
    <>
      <PolicySection id="processors" title="Who else touches your data">
        <PolicyText>
          We do not run our own hardware. These companies process data on our behalf, each for a
          single purpose:
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
              <PolicyTerm>Mapbox</PolicyTerm> — turns coordinates into street addresses, on our
              server and nowhere else. When we work out where a drive started and ended, where a car
              is parked, or the address it is navigating to, we send those exact coordinates to
              Mapbox. Neither the iOS app nor this website contacts Mapbox at all.
            </>,
            <>
              <PolicyTerm>Sentry</PolicyTerm> — error monitoring for this website, as described
              above.
            </>,
          ]}
        />
        <PolicyText>
          That is the whole list, and we review it with every update to this page. Adding a company
          that handles your data means changing this section first.
        </PolicyText>
        <PolicyText>
          We may also disclose data if the law requires it, but no such request has been made.
        </PolicyText>
      </PolicySection>

      <PolicySection id="security" title="How it is stored and protected">
        <PolicyText>Everything we store is held in one of three forms:</PolicyText>
        <PolicyList
          items={[
            <>
              <PolicyTerm>Encrypted, as AES-256-GCM ciphertext and in no other form</PolicyTerm> —
              your car&rsquo;s coordinates, the route it is following, the GPS trail of every drive,
              the pickup and dropoff coordinates of every ride, the coordinates of the Home and Work
              you save, the Tesla tokens that let us talk to your car, and the sign-in tokens from
              every provider we support.
            </>,
            <>
              <PolicyTerm>Stored as text</PolicyTerm> — your name and email address, the street
              address and place name for a drive&rsquo;s start and end and for where a car is parked,
              licence plates, and notification tokens. These are protected by our database
              host&rsquo;s disk encryption and access controls.
            </>,
            <>
              <PolicyTerm>Stored as a hash</PolicyTerm> — your sign-in sessions. We hold a fingerprint
              of each session token rather than the token itself.
            </>,
          ]}
        />
        <PolicyCallout title="The encryption key is held outside the database">
          <p>
            It lives in our hosting platform&rsquo;s secret store and is given to the server as a
            setting when it starts. It is never written to a table and it is not present in any
            database backup. A copy of the database on its own — leaked, stolen, or lawfully demanded
            — is ciphertext with no means to read it.
          </p>
          <p>
            We cannot read your drives or your car&rsquo;s location from the database, and neither
            can anyone who obtains a copy of it. The server decrypts a value at the moment it sends
            it to your app or to your car, and at no other time.
          </p>
        </PolicyCallout>
        <PolicyText>
          Data in transit is encrypted as well. Cars connect to our server using mutual TLS, so both
          ends prove who they are. Invite codes and notification tokens are treated as credentials and
          kept out of our logs, and VINs appear in logs only as their last four characters.
          Coordinates, addresses, email addresses, and tokens are not written to logs.
        </PolicyText>
      </PolicySection>

      <PolicySection id="retention" title="How long we keep it">
        <PolicyList
          items={[
            <>
              <PolicyTerm>Live vehicle state</PolicyTerm> — overwritten each time it updates. We keep
              no history of it.
            </>,
            <>
              <PolicyTerm>Drives and their GPS trails</PolicyTerm> — kept for one year, then deleted
              automatically. A job runs once a day and removes every drive older than 365 days,
              taking its trail with it. The one-year window is fixed in our code rather than being a
              setting. Each pass records one audit entry per car — how many drives it removed and the
              dates they span, with no coordinates, addresses, or routes.
            </>,
            <>
              <PolicyTerm>Rides</PolicyTerm> — kept as history for both the rider and the owner, and
              deleted when the car is removed or when either of you deletes your account. Historic
              ride records are subject to the same retention windows as current ones.
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
              <PolicyTerm>Server logs</PolicyTerm> — retained for our hosting provider&rsquo;s
              standard period.
            </>,
            <>
              <PolicyTerm>Backups</PolicyTerm> — our database host retains encrypted backups for up
              to thirty days, with a seven-day window for point-in-time restore. Deleted data remains
              recoverable from a backup for that period.
            </>,
          ]}
        />
      </PolicySection>
    </>
  );
}
