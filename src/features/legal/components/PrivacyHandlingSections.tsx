import {
  PolicyCallout,
  PolicyList,
  PolicySection,
  PolicyTerm,
  PolicyText,
} from './PolicyPrimitives';

/**
 * Policy sections covering the companies that process data on our behalf,
 * security, and retention.
 *
 * These three sections carried the page's two unflattering admissions when it
 * was first published: three columns mid-migration to encryption, and drive
 * history that was never aged out. Both pieces of work have since landed
 * (MYR-433 and MYR-439), so both paragraphs are rewritten here rather than
 * softened — the encryption paragraph now states what is ciphertext, and the
 * retention list states the one-year window the pruner actually enforces.
 *
 * The rule the rewrite is held to is the original one: no sentence the source
 * code does not support. That is why the security section still names, in the
 * same breath, the things that are NOT encrypted — addresses, place names,
 * plates, names. Coordinates being unreadable is a real and checkable claim;
 * "your data is safe" is not, and the second sentence would swallow the first.
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
          Coordinates are the part of this that could follow you around, so coordinates are the part
          we encrypt. Every one we hold is stored as AES-256-GCM ciphertext and in no other form:
          where your car is, where it is heading and the route it is taking, the full GPS trail of
          every drive, the pickup and dropoff of every ride, and the Home and Work you saved. The
          same goes for the Tesla tokens that let us talk to your car and the sign-in tokens from
          every provider we support. The unencrypted copies that used to sit beside them have been
          deleted.
        </PolicyText>
        <PolicyCallout title="The key is not in the database">
          <p>
            It is held in our hosting platform&rsquo;s secret store and handed to the server as a
            setting when it starts. It is never written to a table, and it is not in any backup of
            the database. A copy of our database on its own — leaked, stolen, or lawfully demanded —
            is therefore ciphertext with nothing to read it with.
          </p>
          <p>
            So: we cannot read your drives or your car&rsquo;s location out of the database, and
            neither can anyone who obtains it. The server decrypts a value at the moment it has to
            send it — to your app, or to the car — and not otherwise.
          </p>
        </PolicyCallout>
        <PolicyText>
          <PolicyTerm>The honest limit of that sentence.</PolicyTerm> The words are not encrypted,
          only the coordinates. The street address and place name we look up for a drive&rsquo;s
          start and end, or for where a car is parked, are stored as ordinary text — as are names,
          email addresses, licence plates, passenger phone numbers, and notification tokens. Those
          rely on our database host&rsquo;s disk encryption and access controls rather than on a key
          of our own. A map of your movements cannot be reconstructed from what we store; a line
          saying a drive ended on your street can still be read.
        </PolicyText>
        <PolicyText>
          Everything also travels over encrypted connections. Cars connect to our server using mutual
          TLS, so both ends prove who they are. Invite codes and notification tokens are treated as
          credentials and kept out of our logs, and VINs appear in logs only as their last four
          characters. Coordinates, addresses, email addresses, and tokens are not written to logs at
          all.
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
              taking the trail with it. The window is fixed in the code rather than being a setting
              somebody can quietly lengthen.
            </>,
            <>
              <PolicyTerm>What that deletion records</PolicyTerm> — one audit entry per car: how many
              drives went, and the dates of the oldest and newest. No coordinates, no addresses, no
              route.
            </>,
            <>
              <PolicyTerm>Rides</PolicyTerm> — kept as history for both the rider and the owner. The
              one-year sweep covers drives, not rides; a ride goes when the car is removed or when
              one of you deletes your account.
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
              survive in a backup for that long, and so can the unencrypted copies we removed, until
              the backups taken before that work roll off.
            </>,
          ]}
        />
      </PolicySection>
    </>
  );
}
