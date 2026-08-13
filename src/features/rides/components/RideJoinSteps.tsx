/** Props for the RideJoinSteps component. */
export interface RideJoinStepsProps {
  /** Whether the visitor arrived with a code-shaped segment in the link. */
  hasCode: boolean;
}

/**
 * The three things a recipient does, in the order they do them.
 *
 * ── WHY THE THIRD STEP IS "OPEN THIS LINK AGAIN" AND NOT "ENTER THE CODE" ────
 * The invite surface next door ends with "Enter the code above", because an
 * invite code is something a person types into the app's six-box screen. A ride
 * join code is not: there is no ride-code screen, the app is reached by the
 * link, and the code rides in the URL. So the last step sends them back to the
 * link — by then the app is installed, iOS honours the Universal Link, and the
 * ride opens. Telling somebody to type a code at a screen that does not exist
 * would be the same dead end MYR-453 was about, one step later.
 *
 * That is also why the code is never printed on this page. On the invite
 * surface the code is shown because the recipient has to read it out to
 * themselves; here it enables no action a person can take by hand, so
 * displaying a bearer credential would be cost with no benefit.
 */
export function RideJoinSteps({ hasCode }: RideJoinStepsProps) {
  const steps = [
    'Install MyRoboTaxi from TestFlight',
    'Sign in with Apple',
    hasCode ? 'Open this link again to join the ride' : 'Open the ride link you were sent',
  ];

  return (
    <div className="w-full">
      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li key={step} className="flex items-start gap-3 text-left">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/40 font-mono text-xs text-gold">
              {index + 1}
            </span>
            <span className="text-sm leading-6 text-text-secondary">{step}</span>
          </li>
        ))}
      </ol>
      {/*
        The honest limits of this page, in the two directions a visitor could
        be surprised by. First: it shows nothing about the ride, and that is a
        decision rather than a loading state — a ride is a live location, and
        this page is open to anyone the link is forwarded to. Second: the link
        expires with the ride, and this page cannot tell whether it already has,
        for the same reason the invite page cannot check a code. Saying so is
        cheaper than an error the app has to deliver later.
      */}
      <p className="mt-5 text-xs leading-5 text-text-muted">
        This page never shows the ride — where the car is, who is on board, or
        when it arrives is in the app, after you sign in. A ride link stops
        working once the ride ends, and this page cannot tell whether it has; if
        the app says the link is closed, ask for a new one.
      </p>
    </div>
  );
}
