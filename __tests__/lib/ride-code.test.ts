import { describe, it, expect } from 'vitest';

import { isInviteCodeShaped, sanitizeInviteCode } from '@/lib/invite-code';
import {
  isRideCodeShaped,
  redactRideCodePaths,
  RIDE_CODE_LENGTH,
  sanitizeRideCode,
} from '@/lib/ride-code';

/**
 * MYR-540 — the shape gate in front of `/ride/{CODE}`.
 *
 * A ride code is a bearer credential that admits its holder to viewer-tier
 * access to somebody's car for the length of a trip, so the two properties
 * worth pinning are that a well-formed segment is served and that a malformed
 * one never reaches the page.
 */
describe('isRideCodeShaped', () => {
  const shaped = ['RBO246', 'rbo246', 'rBo2G6', '123456', 'ABCDEF', 'ZZZZZZ', '000000'];

  it.each(shaped)('accepts %s', (segment) => {
    expect(isRideCodeShaped(segment)).toBe(true);
  });

  const notShaped = [
    ['nothing at all', ''],
    ['too short', '1234'],
    ['five characters', 'RBO24'],
    ['seven characters', 'RBO2467'],
    ['a hyphen', 'RBO-24'],
    ['an underscore', 'RBO_24'],
    ['a percent escape', 'RB%246'],
    ['a dot', 'RBO.46'],
    ['angle brackets', '<b>abc'],
    ['non-ascii digits', '１２３４５６'],
    ['cyrillic lookalikes', 'АВС123'],
    ['a word', 'not-a-valid-code'],
    ['surrounding space', ' RBO246 '],
  ] as const;

  it.each(notShaped)('rejects %s', (_label, segment) => {
    expect(isRideCodeShaped(segment)).toBe(false);
  });

  it('rejects a missing segment rather than throwing', () => {
    expect(isRideCodeShaped(null)).toBe(false);
    expect(isRideCodeShaped(undefined)).toBe(false);
  });

  /**
   * The gate spends public information only. The FORMAT of a ride code is in
   * every share link ever sent; which rides are RUNNING is not, and answering
   * differently for a live ride than for a well-formed fake one would make the
   * route an enumeration API pointed at live vehicle positions.
   */
  it('does not judge whether a well-formed code is real', () => {
    expect(isRideCodeShaped('ZZZZZZ')).toBe(true);
    expect(isRideCodeShaped('000000')).toBe(true);
  });
});

describe('sanitizeRideCode', () => {
  it('returns a canonical code unchanged', () => {
    expect(sanitizeRideCode('RBO246')).toBe('RBO246');
  });

  it('upper-cases a code a messaging app lower-cased', () => {
    expect(sanitizeRideCode('rbo246')).toBe('RBO246');
  });

  it('trims surrounding whitespace', () => {
    expect(sanitizeRideCode('  RBO246 ')).toBe('RBO246');
  });

  /**
   * A partially-salvaged code would render an app-open button that opens the
   * app on nothing. `null` is the caller's signal to render no button at all.
   */
  it('returns null rather than a guess for anything that is not a code', () => {
    for (const junk of [
      null,
      undefined,
      '',
      'ABC',
      'ABCDEFG',
      'RBO-246',
      '../../etc',
      'RBO24!',
      'АВС123',
    ]) {
      expect(sanitizeRideCode(junk)).toBeNull();
    }
  });

  it('publishes the length the shape is built on', () => {
    expect(RIDE_CODE_LENGTH).toBe(6);
    expect(sanitizeRideCode('A'.repeat(RIDE_CODE_LENGTH))).toBe('A'.repeat(RIDE_CODE_LENGTH));
    expect(sanitizeRideCode('A'.repeat(RIDE_CODE_LENGTH + 1))).toBeNull();
  });
});

/**
 * Ride codes and invite codes share a shape TODAY, and this file exists partly
 * to make that a checked coincidence rather than an assumption.
 *
 * They are two contracts: an invite code is minted by the iOS app and opens an
 * account relationship; a ride code is minted by the telemetry service at
 * accept and dies with the ride. `lib/ride-code.ts` therefore duplicates the
 * pattern rather than importing it, so that the day one contract widens its
 * alphabet the other does not silently follow. If this case ever fails, that is
 * the seam working — delete the case, do not re-couple the modules.
 */
describe('ride codes and invite codes — separate contracts, same shape today', () => {
  const probes = ['RBO246', 'rbo246', '123456', '', 'ABC', 'ABCDEFG', 'RBO-24', 'АВС123'];

  it.each(probes)('agrees on the shape of %s', (segment) => {
    expect(isRideCodeShaped(segment)).toBe(isInviteCodeShaped(segment));
    expect(sanitizeRideCode(segment)).toBe(sanitizeInviteCode(segment));
  });
});

/**
 * A ride code in a request URL is a credential nobody decided to log — Sentry
 * records the URL of every sampled transaction on its own.
 */
describe('redactRideCodePaths', () => {
  it('redacts a code in a bare path', () => {
    expect(redactRideCodePaths('/ride/RBO246')).toBe('/ride/[code]');
  });

  it('redacts a code in a full URL', () => {
    expect(redactRideCodePaths('https://myrobotaxi.app/ride/RBO246')).toBe(
      'https://myrobotaxi.app/ride/[code]',
    );
  });

  it('redacts a lowercase code', () => {
    expect(redactRideCodePaths('/ride/rbo246')).toBe('/ride/[code]');
  });

  /**
   * The share link carries a MYR-368 signature in `?k=`. The code still has to
   * go, and the query is left alone — a signature is not a secret.
   */
  it('redacts the code but keeps the signed query recognisable', () => {
    expect(redactRideCodePaths('/ride/RBO246?k=1.99.abc')).toBe('/ride/[code]?k=1.99.abc');
  });

  it('redacts every occurrence', () => {
    expect(redactRideCodePaths('/ride/RBO246 then /ride/ZZ9999')).toBe(
      '/ride/[code] then /ride/[code]',
    );
  });

  it('leaves the parameterized route name alone', () => {
    expect(redactRideCodePaths('/ride/[code]')).toBe('/ride/[code]');
  });

  it('does not partially rewrite a longer segment', () => {
    expect(redactRideCodePaths('/ride/RBO246EXTRA')).toBe('/ride/RBO246EXTRA');
  });

  it('leaves unrelated paths untouched', () => {
    expect(redactRideCodePaths('/rides')).toBe('/rides');
    expect(redactRideCodePaths('/join/RBO246')).toBe('/join/RBO246');
  });
});
