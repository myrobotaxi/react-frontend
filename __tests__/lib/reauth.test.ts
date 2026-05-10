/**
 * MYR-76: unit tests for the recent-login re-auth helper.
 *
 * The helper backs `DELETE /api/users/me` and `GET /api/users/me/export`
 * (rest-api.md §7.6 / §7.7). End-to-end behavior is exercised in the
 * route handler tests; these cases focus on the pure-function edges.
 */

import { describe, it, expect, afterEach } from 'vitest';

import { isRecentlyAuthenticated, reauthMaxAgeSec } from '@/lib/reauth';

const FIVE_MINUTES_SEC = 5 * 60;

describe('reauthMaxAgeSec', () => {
  const prev = process.env.REAUTH_MAX_AGE_SEC;
  afterEach(() => {
    if (prev === undefined) delete process.env.REAUTH_MAX_AGE_SEC;
    else process.env.REAUTH_MAX_AGE_SEC = prev;
  });

  it('defaults to 300 s when the env var is unset', () => {
    delete process.env.REAUTH_MAX_AGE_SEC;
    expect(reauthMaxAgeSec()).toBe(FIVE_MINUTES_SEC);
  });

  it('respects a positive integer override', () => {
    process.env.REAUTH_MAX_AGE_SEC = '60';
    expect(reauthMaxAgeSec()).toBe(60);
  });

  it('falls back to the default for non-numeric values', () => {
    process.env.REAUTH_MAX_AGE_SEC = 'banana';
    expect(reauthMaxAgeSec()).toBe(FIVE_MINUTES_SEC);
  });

  it('falls back to the default for zero', () => {
    process.env.REAUTH_MAX_AGE_SEC = '0';
    expect(reauthMaxAgeSec()).toBe(FIVE_MINUTES_SEC);
  });

  it('falls back to the default for negatives', () => {
    process.env.REAUTH_MAX_AGE_SEC = '-30';
    expect(reauthMaxAgeSec()).toBe(FIVE_MINUTES_SEC);
  });

  it('falls back to the default for an empty string', () => {
    process.env.REAUTH_MAX_AGE_SEC = '';
    expect(reauthMaxAgeSec()).toBe(FIVE_MINUTES_SEC);
  });
});

describe('isRecentlyAuthenticated', () => {
  // Pin "now" so the window math is deterministic across CI loads.
  const NOW = 1_730_000_000;

  it('returns false for missing authTime (legacy session)', () => {
    expect(isRecentlyAuthenticated(undefined, NOW)).toBe(false);
    expect(isRecentlyAuthenticated(null, NOW)).toBe(false);
  });

  it('returns true for an authTime exactly at now', () => {
    expect(isRecentlyAuthenticated(NOW, NOW)).toBe(true);
  });

  it('returns true at the inclusive edge of the default window (now - 300 s)', () => {
    expect(isRecentlyAuthenticated(NOW - FIVE_MINUTES_SEC, NOW)).toBe(true);
  });

  it('returns false one second past the edge', () => {
    expect(isRecentlyAuthenticated(NOW - FIVE_MINUTES_SEC - 1, NOW)).toBe(
      false,
    );
  });

  it('returns false for a stale authTime well outside the window', () => {
    expect(isRecentlyAuthenticated(NOW - 60 * 60, NOW)).toBe(false);
  });

  it('honors REAUTH_MAX_AGE_SEC override on the boundary check', () => {
    const prev = process.env.REAUTH_MAX_AGE_SEC;
    try {
      process.env.REAUTH_MAX_AGE_SEC = '60';
      // 90 s ago — passes the 300 s default but fails the 60 s override.
      expect(isRecentlyAuthenticated(NOW - 90, NOW)).toBe(false);
      expect(isRecentlyAuthenticated(NOW - 30, NOW)).toBe(true);
    } finally {
      if (prev === undefined) delete process.env.REAUTH_MAX_AGE_SEC;
      else process.env.REAUTH_MAX_AGE_SEC = prev;
    }
  });

  it('treats a future authTime as recent (clock-skew tolerance)', () => {
    // If the server clock skews behind the IdP clock, authTime can be in
    // the future. The check is `now - authTime <= maxAge`, which is
    // negative for future authTime — well within the window.
    expect(isRecentlyAuthenticated(NOW + 30, NOW)).toBe(true);
  });
});
