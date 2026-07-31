/**
 * The words on the invite surface (MYR-368) — client-approved, verbatim.
 *
 * ONE source for two consumers that must never disagree: the `og:title` /
 * description a messaging app scrapes and caches (`app/join/join-metadata.ts`)
 * and the heading and sub-line the recipient reads after tapping it
 * (`features/invites/components/JoinInviteScreen`). A card that says one thing
 * opening a page that says another reads as the wrong page.
 *
 * TIER-AGNOSTIC ON PURPOSE. The old copy promised a ride ("invited you to ride
 * their Tesla"), which is wrong for the location-only invites this product also
 * sends — those share where the car is and nothing else. "Sharing their Tesla"
 * is true of every tier, so no invite arrives promising something the sender
 * did not grant.
 *
 * The names are safe to render here because they are covered by the link's
 * signature (`lib/invite-signature.ts`): callers pass values that verified.
 * `sanitizeInviterName` still runs on them first, as defence in depth — see the
 * page.
 *
 * No React code — importable from server components and `generateMetadata`.
 */

/**
 * Headline, and the `og:title` verbatim.
 *
 * Keyed on which names the link carried:
 *
 *  • recipient named → greet them by name
 *  • only the owner named → greet without one
 *  • neither → the generic invitation
 *
 * The client approved three cases (both names, owner only, neither). A link
 * that names ONLY the recipient is not one they specified and is not a shape
 * the app mints; it falls out of the same rule as "greet them by name" with the
 * generic sub-line, which is the reading that keeps all three approved cases
 * exact.
 */
export function inviteHeadline(inviterName: string | null, recipientName: string | null): string {
  if (recipientName) return `You're in, ${recipientName}! 🎉`;
  if (inviterName) return "You're in! 🎉";

  return "You're invited! 🎉";
}

/** Sub-line, and the `description` / `og:description` verbatim. */
export function inviteSubline(inviterName: string | null, recipientName: string | null): string {
  if (inviterName && recipientName) {
    return `${inviterName} is sharing their Tesla with you on MyRoboTaxi.`;
  }
  if (inviterName) return `${inviterName} is sharing their Tesla with you.`;

  return 'Someone is sharing their Tesla with you on MyRoboTaxi.';
}
