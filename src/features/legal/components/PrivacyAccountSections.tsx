import { PolicyList, PolicySection, PolicyTerm, PolicyText } from './PolicyPrimitives';

/**
 * Policy sections covering the account, the linked Tesla, and rides.
 *
 * Every claim on this page is written from an audit of the three repositories
 * that make up the product (the iOS app, the Go telemetry server, and this
 * site). Where the code and an internal design document disagree, the code
 * wins — a policy describes the system that runs, not the one that was
 * specified.
 */
export function PrivacyAccountSections() {
  return (
    <>
      <PolicySection id="account" title="Your account">
        <PolicyText>
          Sign in with Apple is the only way to sign in to the MyRoboTaxi app. There are no
          passwords, so there is no password for us to store or lose.
        </PolicyText>
        <PolicyText>
          Apple sends us a signed token proving it is you, your email address, and — only the very
          first time you authorize the app — your name. Apple never sends it again, so we keep the
          name from that first sign-in. If you chose &ldquo;Hide My Email,&rdquo; the only address we
          ever see is Apple&rsquo;s private relay address.
        </PolicyText>
        <PolicyText>We store, on our server:</PolicyText>
        <PolicyList
          items={[
            <>
              <PolicyTerm>Your name and email address</PolicyTerm>, as Apple provided them.
            </>,
            <>
              <PolicyTerm>The account identifier Apple uses for you</PolicyTerm>, which is how we
              recognize you on your next sign-in.
            </>,
            <>
              <PolicyTerm>Sign-in sessions</PolicyTerm> — we keep a hash of each session token, not
              the token itself.
            </>,
          ]}
        />
        <PolicyText>
          On your iPhone, the app keeps your session token in the iOS Keychain and caches your name
          and email in app storage so it can show them before it reaches the network. Signing out
          clears both.
        </PolicyText>
      </PolicySection>

      <PolicySection id="vehicle" title="Your Tesla, if you link one">
        <PolicyText>
          Linking a car happens through Tesla&rsquo;s own sign-in. We never see your Tesla password.
          You grant us permission to read your profile and vehicle data, read your vehicle&rsquo;s
          location, and send commands to the car, including charging commands. You can withdraw that
          permission at any time from the Tesla app.
        </PolicyText>
        <PolicyText>
          While a car is linked, our server stores and keeps up to date:
        </PolicyText>
        <PolicyList
          items={[
            <>
              <PolicyTerm>Identity</PolicyTerm> — VIN, the name you give it, model, year, colour,
              trim, licence plate, software version, and Full Self-Driving version.
            </>,
            <>
              <PolicyTerm>Where it is</PolicyTerm> — precise coordinates, a street address we look
              up from them, speed, heading, gear, and odometer.
            </>,
            <>
              <PolicyTerm>Where it is going</PolicyTerm> — the current navigation destination, its
              address, and the route line to it.
            </>,
            <>
              <PolicyTerm>Drive history</PolicyTerm> — each drive&rsquo;s start and end time and
              place, distance, duration, speeds, energy used, and the full GPS trail of the route
              taken.
            </>,
            <>
              <PolicyTerm>Battery and charging</PolicyTerm> — charge level, charge state, estimated
              range, and time to full.
            </>,
            <>
              <PolicyTerm>Cabin state</PolicyTerm> — interior and exterior temperature, climate
              settings, fan speed, seat heaters and coolers, and media volume.
            </>,
            <>
              <PolicyTerm>What is playing</PolicyTerm> — the title, artist, album or station showing
              on the car&rsquo;s screen. The app displays it; we store it as part of the car&rsquo;s
              state. It is the one piece of vehicle data that says something about you rather than
              the car, and nobody you share the car with sees it.
            </>,
            <>
              <PolicyTerm>Service status</PolicyTerm> — whether the car is in service and when it is
              expected back.
            </>,
          ]}
        />
        <PolicyText>
          We can also send commands to the car: lock and unlock, start and stop climate and set
          temperatures, start and stop charging and set a charge limit, open the charge port and
          trunk, honk and flash, adjust the seats and media, and set a navigation destination. We
          send a command when you ask us to, with one exception: when you accept a ride we
          automatically send the car the pickup point, and when the ride starts we send the dropoff.
        </PolicyText>
        <PolicyText>
          The MyRoboTaxi key you add to the car is what lets those commands be signed and accepted.
          Only you can remove it, from the car&rsquo;s own touchscreen.
        </PolicyText>
      </PolicySection>

      <PolicySection id="rides" title="Rides">
        <PolicyText>When a ride is requested, we store:</PolicyText>
        <PolicyList
          items={[
            <>
              <PolicyTerm>Pickup and dropoff</PolicyTerm> — the exact coordinates, plus the place
              name and street address shown in the app.
            </>,
            <>
              <PolicyTerm>Who and which car</PolicyTerm> — the rider, the owner, and the vehicle.
            </>,
            <>
              <PolicyTerm>Times and status</PolicyTerm> — when it was requested, any scheduled time,
              and each status change through to completion or cancellation.
            </>,
            <>
              <PolicyTerm>A passenger&rsquo;s name and phone number</PolicyTerm>, but only if you
              fill them in when booking a ride for somebody else. We store them with the ride and
              show them to the vehicle&rsquo;s owner, so they know who they are collecting. We do not
              text that number — there is no SMS anywhere in the product.
            </>,
          ]}
        />
        <PolicyText>
          Pickup and dropoff coordinates are sent to Tesla, because sending the car a destination is
          how the car learns where to go.
        </PolicyText>
        <PolicyText>
          If you save a Home or Work place, we store its coordinates and the label you gave it.
        </PolicyText>
      </PolicySection>
    </>
  );
}
