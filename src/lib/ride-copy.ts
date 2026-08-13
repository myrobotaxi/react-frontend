/**
 * The words on the group-ride join surface (MYR-540).
 *
 * ONE source for two consumers that must never disagree: the `og:title` /
 * description a messaging app scrapes and caches (`app/ride/ride-metadata.ts`)
 * and the heading and sub-line the recipient reads after tapping it
 * (`features/rides/components/RideJoinScreen`). A card that says one thing
 * opening a page that says another reads as the wrong page. That is the same
 * arrangement `lib/invite-copy.ts` makes for the invite surface next door.
 *
 * ── CONSTANTS, NOT FUNCTIONS — AND THAT IS THE FEATURE ──────────────────────
 * `invite-copy.ts` exports FUNCTIONS, because an invite link carries verified
 * `?from=` / `?to=` names and the copy is a function of them. This file exports
 * two frozen strings, because the ride surface has no personalized variant and
 * must never grow one.
 *
 * MYR-540's security note is absolute: *the landing page renders zero ride
 * data*. No positions, no member names, no ETA, no pickup, no times — nothing
 * derived from the code beyond the code's presence in the URL. A ride share
 * link is forwarded through group chats, and every messaging platform scrapes
 * it and re-displays the preview to people who never opened it; a ride is a
 * live location, so anything personalized here would be broadcasting where
 * somebody physically is to an audience nobody chose. The web half of MYR-540
 * exists to hand people to the app, where positions live behind sign-in and the
 * MYR-435 viewer mask. Two constants make "there is nothing to personalize"
 * a property of the module rather than a rule somebody has to remember.
 *
 * The word "ride" is used freely here, unlike on the invite surface, where
 * `invite-copy.ts` is deliberately tier-agnostic because some invites grant
 * location only. A group-ride link is a ride by construction.
 *
 * No React code — importable from server components and `generateMetadata`.
 */

/** Headline, and the `og:title` verbatim. */
export const RIDE_JOIN_TITLE = "You're invited to join a ride 🎉";

/** Sub-line, and the `description` / `og:description` verbatim. */
export const RIDE_JOIN_SUBLINE =
  'Someone shared their MyRoboTaxi ride with you. Open it in the app to join.';
