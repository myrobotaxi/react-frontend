import { INVITE_EXPIRY_DAYS } from '@/lib/constants';

import {
  PolicyCallout,
  PolicyList,
  PolicySection,
  PolicyTerm,
  PolicyText,
} from './PolicyPrimitives';

/**
 * Policy sections covering sharing, notifications, location, on-device storage,
 * the absence of analytics, and this website.
 */
export function PrivacySharingSections() {
  return (
    <>
      <PolicySection id="sharing" title="Sharing a car with someone">
        <PolicyText>
          An owner can share a car by generating a six-character invite code and sending the
          recipient a link. The code stops working after {INVITE_EXPIRY_DAYS} days if it is not
          used.
        </PolicyText>
        <PolicyText>
          That link looks like <code className="text-text-primary">myrobotaxi.app/join/ABC123</code>{' '}
          and carries the sender&rsquo;s and the recipient&rsquo;s <PolicyTerm>first names</PolicyTerm>{' '}
          in the web address itself. We deliberately put only a first name there — the first word,
          letters only, cut off at twenty characters — because the link travels by text message, and
          a link that arrives by text should not carry somebody&rsquo;s surname. Whatever messaging
          app you send it through can see those names, as can anyone who can see the message or its
          link preview.
        </PolicyText>
        <PolicyCallout title="What someone you share a car with can see">
          <p>
            A viewer sees where the car is and its street address, where it is navigating to and the
            route it is taking, the trail of the trip in progress, its charge, range and charge
            state, its licence plate, its model, year and colour, its odometer, and whether it is
            available for a ride — live, for as long as the share lasts.
          </p>
          <p>
            A viewer does not see what is playing on its screen, the cabin temperature or climate
            settings, the seat heaters, whether the car is locked, whether the trunk, frunk or charge
            port is open, or the VIN, and cannot send the car any command. Our server enforces this
            rather than the app: withheld fields are never sent, and an update consisting only of
            withheld fields is not sent at all, so its timing reveals nothing either.
          </p>
          <p>
            Drive history is not shared. It is visible to the owner alone, and a request for it from
            anyone else is refused. An owner can revoke or suspend any share at any time, and access
            stops immediately.
          </p>
        </PolicyCallout>
      </PolicySection>

      <PolicySection id="notifications" title="Notifications">
        <PolicyText>
          If you turn on notifications, Apple issues a device token that we store against your
          account so we can reach that iPhone. When you sign out, the app hands the token back and we
          delete it, so a shared phone stops receiving the previous account&rsquo;s alerts.
        </PolicyText>
        <PolicyText>
          A ride in progress also uses a Live Activity, which has its own token tied to that one
          ride. We delete it when the ride ends, and a sweep clears any that are left behind within
          24 hours.
        </PolicyText>
        <PolicyList
          items={[
            <>
              <PolicyTerm>What a notification says</PolicyTerm> — at most the requester&rsquo;s first
              name and the car&rsquo;s nickname. Never an address, a place name, or coordinates.
            </>,
            <>
              <PolicyTerm>What the Live Activity shows</PolicyTerm> — ride status, estimated arrival,
              the car&rsquo;s nickname, and your destination&rsquo;s label, such as
              &ldquo;Home.&rdquo; That label is on your lock screen and is readable without
              unlocking the phone.
            </>,
          ]}
        />
        <PolicyText>
          You can turn off each kind of alert separately in the app, and all of them in iOS Settings.
        </PolicyText>
      </PolicySection>

      <PolicySection id="location" title="Your phone's location">
        <PolicyText>
          The app asks for your location only while you are using it, and uses it to centre the map,
          to fill in &ldquo;Current location&rdquo; as a pickup point, to bias place search toward
          where you are, and to draw the blue dot. There is no background location and no continuous
          tracking — the app never follows you around when it is closed.
        </PolicyText>
        <PolicyText>
          Your location reaches our server only as the pickup point of a ride you request. Turning a
          coordinate or a typed search into a place name uses Apple&rsquo;s Maps services on your
          device, which means those coordinates and search terms go to Apple under Apple&rsquo;s
          privacy policy, not ours.
        </PolicyText>
      </PolicySection>

      <PolicySection id="on-device" title="What stays on your phone">
        <PolicyText>These never leave your device, and we never receive them:</PolicyText>
        <PolicyList
          items={[
            <>
              <PolicyTerm>Recent destinations</PolicyTerm> — the last five places you chose, so they
              are one tap away next time.
            </>,
            <>
              <PolicyTerm>Last known vehicle positions</PolicyTerm> — a small cache, up to twelve
              cars and thirty days, so the map opens where the car was last seen.
            </>,
            <>
              <PolicyTerm>Your view preference</PolicyTerm> — whether you last used owner or rider
              view.
            </>,
            <>
              <PolicyTerm>Whether we have already asked</PolicyTerm> about notifications, so you are
              not asked twice.
            </>,
          ]}
        />
        <PolicyText>
          The recent-destinations list is never uploaded. If you choose one of those places and book
          a ride to it, that single destination is sent as part of the ride request, like any other.
        </PolicyText>
      </PolicySection>

      <PolicySection id="analytics" title="No analytics, no ads, no tracking">
        <PolicyText>
          The iOS app contains no third-party analytics, crash-reporting, advertising, or attribution
          software. Its only outside code dependency is a package we wrote ourselves. There is no
          advertising identifier, no App Tracking Transparency prompt, and no cross-app or
          cross-website tracking, because there is nothing in the app that could do it.
        </PolicyText>
        <PolicyText>
          We do not sell your personal information and we do not share it with advertisers or data
          brokers. No code path for doing so exists in the app, the server, or this website.
        </PolicyText>
      </PolicySection>

      <PolicySection id="website" title="This website">
        <PolicyText>
          myrobotaxi.app serves three pages: a coming-soon page, this policy, and the invite landing
          page at <code className="text-text-primary">/join/&#123;CODE&#125;</code>.
        </PolicyText>
        <PolicyList
          items={[
            <>
              <PolicyTerm>The invite page does not look your code up.</PolicyTerm> It renders the
              code and the names straight from the address you arrived on. It makes no call to our
              server and never touches our database.
            </>,
            <>
              <PolicyTerm>No cookies and no tracking</PolicyTerm> on any of these pages. We set no
              cookie for a visitor without an account, and there are no analytics scripts or tracking
              pixels.
            </>,
            <>
              <PolicyTerm>Fonts are served from this domain</PolicyTerm>, not fetched from Google, so
              loading a page here does not tell anyone else that you did.
            </>,
            <>
              <PolicyTerm>Standard server logs.</PolicyTerm> Our host, Vercel, records the usual web
              server access log — IP address, time, page requested, browser — for every request.
            </>,
            <>
              <PolicyTerm>Error monitoring.</PolicyTerm> We use Sentry to catch server errors, and
              invite codes are stripped out of web addresses before anything is sent to it, because a
              code in a link is itself a credential. The route that browser-side error reports would
              travel through is closed on these public pages, so nothing is sent to Sentry from your
              browser.
            </>,
          ]}
        />
      </PolicySection>
    </>
  );
}
