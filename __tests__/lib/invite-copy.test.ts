import { describe, it, expect } from 'vitest';

import { inviteHeadline, inviteSubline } from '@/lib/invite-copy';

/**
 * MYR-368 — client-approved copy, asserted verbatim.
 *
 * These strings were reviewed and signed off word for word, emoji included, and
 * they are the same strings that go into the `og:title` a messaging platform
 * caches. Paraphrasing one is a product change, not a refactor, which is why
 * this file compares whole strings rather than matching patterns.
 */
describe('inviteHeadline', () => {
  it('greets the recipient by name when the link carried both', () => {
    expect(inviteHeadline('Alex', 'Mira')).toBe("You're in, Mira! 🎉");
  });

  it('welcomes without a name when only the owner is named', () => {
    expect(inviteHeadline('Alex', null)).toBe("You're in! 🎉");
  });

  it('invites generically when the link names nobody', () => {
    expect(inviteHeadline(null, null)).toBe("You're invited! 🎉");
  });

  /**
   * Not a shape the app mints and not one the client specified — the greeting
   * rule simply does not need the owner's name, so it falls out here rather
   * than being special-cased into a fourth string nobody approved.
   */
  it('greets a recipient named without an owner', () => {
    expect(inviteHeadline(null, 'Mira')).toBe("You're in, Mira! 🎉");
  });
});

describe('inviteSubline', () => {
  it('names the owner and the product when the link carried both names', () => {
    expect(inviteSubline('Alex', 'Mira')).toBe('Alex is sharing their Tesla with you on MyRoboTaxi.');
  });

  /** Shorter when the headline did not already say the recipient's name. */
  it('drops the product name in the owner-only variant', () => {
    expect(inviteSubline('Alex', null)).toBe('Alex is sharing their Tesla with you.');
  });

  it('says "Someone" when the link names nobody', () => {
    expect(inviteSubline(null, null)).toBe('Someone is sharing their Tesla with you on MyRoboTaxi.');
  });

  it('says "Someone" when only the recipient is named', () => {
    expect(inviteSubline(null, 'Mira')).toBe('Someone is sharing their Tesla with you on MyRoboTaxi.');
  });
});

/**
 * The reason this copy changed at all. Some invites grant location only — the
 * recipient sees where the car is and cannot request anything — so any promise
 * of a ride is a lie on that tier. "Sharing their Tesla" is true of all of them.
 */
describe('tier-agnostic phrasing', () => {
  const EVERY_VARIANT = [
    ['Alex', 'Mira'],
    ['Alex', null],
    [null, 'Mira'],
    [null, null],
  ] as const;

  it('never promises a ride', () => {
    for (const [from, to] of EVERY_VARIANT) {
      expect(inviteHeadline(from, to)).not.toMatch(/ride/i);
      expect(inviteSubline(from, to)).not.toMatch(/ride/i);
    }
  });

  it('always describes sharing a Tesla instead', () => {
    for (const [from, to] of EVERY_VARIANT) {
      expect(inviteSubline(from, to)).toContain('sharing their Tesla with you');
    }
  });
});
