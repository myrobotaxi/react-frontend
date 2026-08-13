import { LegalFooter } from '@/components/layout/LegalFooter';
import { Logo } from '@/components/ui/Logo';
import { RIDE_JOIN_SUBLINE, RIDE_JOIN_TITLE } from '@/lib/ride-copy';

import { RideAppCTA } from './RideAppCTA';
import { RideJoinSteps } from './RideJoinSteps';

/** Props for the RideJoinScreen component. */
export interface RideJoinScreenProps {
  /**
   * Sanitized ride join code from the URL PATH, or `null` when the segment was
   * not code-shaped.
   *
   * THE ONLY PROP, and it stays that way. The code reaches exactly one place —
   * the `myrobotaxi://ride/{CODE}` href — and is never rendered as text. There
   * is no prop for a rider name, a pickup, an ETA or a member count, because a
   * prop is where the first one would arrive; see the surface note below.
   */
  code: string | null;
}

/**
 * Public group-ride join landing — the fallback surface for
 * `https://myrobotaxi.app/ride/{CODE}` when Universal Links do not hand the
 * link to the installed iOS app (MYR-540).
 *
 * `/join/{CODE}`'s sibling: same standalone shell, same lockup, same two-button
 * CTA, same three steps, same privacy-policy footer. What differs is the copy
 * and one deliberate absence.
 *
 * ── THIS PAGE RENDERS ZERO RIDE DATA ────────────────────────────────────────
 * Not "no data yet" — no data, ever, by construction. No car position, no
 * member names, no ETA, no pickup or drop-off, no ride status, and not the code
 * itself. Nothing on screen is derived from the code beyond the fact that the
 * URL carries one.
 *
 * The reason is that this surface is OPEN, and the thing behind it is a live
 * location. A ride link is designed to be forwarded into a group chat; every
 * messaging platform that sees it scrapes the page, caches a preview, and shows
 * that preview to people who never opened the link. Anything rendered here is
 * therefore published to an audience nobody chose. MYR-540 answers this by
 * putting the whole rider experience behind the app and sign-in — positions
 * live behind the WS handshake access set and the MYR-435 viewer mask — and by
 * making the web half a doorway with nothing in it.
 *
 * The structural guarantees, so this is not merely a promise in a comment:
 *
 *  • The page component takes ONE prop, a code, and never prints it.
 *  • `app/ride/[code]/page.tsx` does not read `searchParams` at all, so no
 *    query value can reach this tree even by accident.
 *  • Nothing here touches an API, a database, a cache or a log. It is a pure
 *    function of a path segment's SHAPE.
 *  • It never asks whether the code is real. Every well-formed segment renders
 *    identically, so the route cannot be walked to learn which rides exist —
 *    the same non-oracle rule `/join/{CODE}` follows, and it matters more here
 *    because a ride code admits its holder to somebody's car.
 *
 * A reviewer's shortcut: if a change to this file adds a prop, an `await`, or
 * a string that varies per visitor, it is out of scope for this page.
 */
export function RideJoinScreen({ code }: RideJoinScreenProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-6 py-12">
      <div className="w-full max-w-sm animate-fade-in text-center">
        {/* Glowing mark, per the design system's first-run lockup. */}
        <Logo size="lg" glow />

        {/*
          The SAME two strings as the link-preview card the recipient already
          tapped — both come from `lib/ride-copy.ts`, which the page's
          `generateMetadata` also reads. A card that says one thing opening a
          page that says another reads as the wrong page.
        */}
        <h2 className="mt-2 text-xl font-semibold leading-8 text-text-primary">
          {RIDE_JOIN_TITLE}
        </h2>
        <p className="mt-3 text-sm leading-6 text-text-secondary">{RIDE_JOIN_SUBLINE}</p>

        {/*
          No code block here, and that is the one visible difference from the
          invite screen. The invite code is printed there because the recipient
          types it into the app; a ride code enables no manual action, so
          printing a bearer credential would be cost with no benefit.
        */}
        <RideAppCTA code={code} />

        <div className="mt-10">
          <RideJoinSteps hasCode={Boolean(code)} />
        </div>

        {/*
          The one link off this page: somebody deciding whether to install the
          app to join a friend's ride should be able to read what it collects
          first (MYR-427).
        */}
        <LegalFooter variant="inline" />
      </div>
    </main>
  );
}
