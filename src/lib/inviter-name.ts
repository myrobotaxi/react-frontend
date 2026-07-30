/**
 * The sender's first name, as it may arrive on `/join/{CODE}?from={Name}`.
 *
 * The iOS app appends this parameter so the landing page — and, more
 * importantly, the link-preview card the recipient sees before tapping anything
 * — can say "{Name} invited you to ride their Tesla" instead of the generic
 * line (MYR-359).
 *
 * It is UNTRUSTED INPUT with an unusually wide blast radius. The value lands in
 * an `og:title`, which messaging platforms scrape, cache, and show to everyone
 * a link is forwarded to. Anyone can craft the URL, so the only safe contract is
 * an allow-list: a value either IS a plain name or it does not exist. Nothing is
 * "cleaned up" — a partially-salvaged value is exactly how junk ends up in a
 * cached page title with nobody having decided to put it there.
 *
 * No React code — importable from server components, `generateMetadata`, and
 * route handlers.
 */

/** Longest name that travels. Matches `InviteLink.inviterNameMaxLength` on iOS. */
export const INVITER_NAME_MAX_LENGTH = 20;

/**
 * Canonical shape of an inviter name: 1–20 ASCII letters, nothing else.
 *
 * Deliberately narrower than "a name": the sending client (`InviteLink
 * .inviterName`) already strips the punctuation real names carry — "Mary-Jane"
 * leaves the app as `MaryJane` — so a link this project produced always matches
 * this pattern, and a link that does not match was not written by us.
 *
 * Non-ASCII letters ("José", "Ольга") are outside it in BOTH directions: the app
 * omits such names rather than misspelling them, and this page declines to
 * render them rather than becoming the one place a name arrives unfiltered.
 * Widening the alphabet means widening both sides together.
 */
const INVITER_NAME_PATTERN = new RegExp(`^[A-Za-z]{1,${INVITER_NAME_MAX_LENGTH}}$`);

/**
 * Normalizes the `from` search param into a name safe to render, or `null`.
 *
 * @param raw - Untrusted search param, already URL-decoded by Next.js. A
 *   repeated parameter (`?from=a&from=b`) arrives as an array and is rejected
 *   outright: two answers to "who sent this" is not a name, it is someone
 *   probing.
 * @returns The trimmed name, or `null` when the caller must fall back to the
 *   generic copy. `null` is the safe default for every unexpected shape.
 */
export function sanitizeInviterName(raw: string | string[] | undefined | null): string | null {
  if (typeof raw !== 'string') return null;

  const trimmed = raw.trim();
  if (!INVITER_NAME_PATTERN.test(trimmed)) return null;

  return trimmed;
}
