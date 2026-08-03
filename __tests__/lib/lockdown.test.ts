import { describe, it, expect, afterEach } from 'vitest';

import { isBetaExcludedPath } from '@/lib/beta-gate';
import { PRIVACY_ROUTE } from '@/lib/constants';
import {
  isLockdownEnabled,
  isLockdownExempt,
  LOCKDOWN_EXEMPT_PREFIXES,
  LOCKDOWN_REDIRECT_PATH,
  LOCKDOWN_REDIRECT_STATUS,
} from '@/lib/lockdown';
import { isPublicPath } from '@/lib/public-paths';

describe('isLockdownExempt — reachable', () => {
  const exempt = [
    // The coming-soon teaser, and the redirect target.
    '/',
    // An invite link: a code-shaped segment is what makes it one.
    '/join/RBO246',
    '/join/rbo246',
    '/join/123456',
    '/.well-known/apple-app-site-association',
    '/.well-known/appspecific/com.tesla.3p.public-key.pem',
    '/api/auth/session',
    '/api/auth/callback/tesla',
    '/api/auth/callback/google',
    '/api/auth/callback/apple',
    '/api/auth/signin',
    '/_next/static/chunks/main.js',
    '/_next/image',
    '/favicon.ico',
    '/og/invite-card.png',
    // The privacy policy — registered in App Store Connect, fetched by Apple's
    // review with no session and no invite link (MYR-427).
    '/privacy',
  ];

  it.each(exempt)('keeps %s reachable', (pathname) => {
    expect(isLockdownExempt(pathname)).toBe(true);
  });
});

describe('isLockdownExempt — locked down', () => {
  const locked = [
    '/signin',
    '/signup',
    '/beta',
    '/drives',
    '/drives/123',
    '/invites',
    '/settings',
    '/empty',
    '/shared/some-token',
    '/api/users/me',
    '/api/users/me/export',
    // The Sentry tunnel: already unreachable to anonymous visitors via the
    // pre-existing auth gate, so the lockdown does not special-case it.
    '/monitoring',
  ];

  it.each(locked)('redirects %s', (pathname) => {
    expect(isLockdownExempt(pathname)).toBe(false);
  });
});

/**
 * The invite experience is what a uniquely generated link opens. A URL that
 * could not be one — no code, or a segment that is not shaped like a code —
 * gets the teaser like everyone else.
 */
describe('isLockdownExempt — only a code-shaped invite link', () => {
  const invites = ['/join/RBO246', '/join/rbo246', '/join/rBo2G6', '/join/123456', '/join/ABCDEF'];

  it.each(invites)('keeps %s reachable', (pathname) => {
    expect(isLockdownExempt(pathname)).toBe(true);
  });

  const notInvites = [
    ['the codeless landing', '/join'],
    ['an empty code segment', '/join/'],
    ['too short', '/join/1234'],
    ['five characters', '/join/RBO24'],
    ['seven characters', '/join/RBO2467'],
    ['a hyphen', '/join/RBO-24'],
    ['an underscore', '/join/RBO_24'],
    ['a percent escape', '/join/RB%246'],
    ['a percent-encoded space', '/join/RBO246%20'],
    ['angle brackets', '/join/<b>abc'],
    ['a dot', '/join/RBO.46'],
    ['non-ascii digits', '/join/１２３４５６'],
    ['cyrillic lookalikes', '/join/АВС123'],
    ['a nested path under a real code', '/join/RBO246/extra'],
    ['a trailing slash after a real code', '/join/RBO246/'],
    ['a word', '/join/not-a-valid-code'],
  ] as const;

  it.each(notInvites)('locks down %s', (_label, pathname) => {
    expect(isLockdownExempt(pathname)).toBe(false);
  });

  /**
   * The gate spends public information only. The FORMAT of a code is in every
   * invite link ever sent; which codes EXIST is a bearer secret, and answering
   * differently for a real code than for a well-formed fake one would turn this
   * into an enumeration oracle. A well-formed segment is served either way.
   */
  it('does not judge whether a well-formed code is real', () => {
    expect(isLockdownExempt('/join/ZZZZZZ')).toBe(true);
    expect(isLockdownExempt('/join/000000')).toBe(true);
  });
});

describe('isLockdownExempt — prefix boundaries', () => {
  it('does not exempt a path that merely starts with an exempt prefix', () => {
    expect(isLockdownExempt('/joinery')).toBe(false);
    expect(isLockdownExempt('/join-us')).toBe(false);
    expect(isLockdownExempt('/api/authorize')).toBe(false);
  });

  it('does not exempt an exempt segment appearing later in the path', () => {
    expect(isLockdownExempt('/settings/join')).toBe(false);
    expect(isLockdownExempt('/x/api/auth/session')).toBe(false);
  });

  it('exempts the root exactly, not everything under it', () => {
    expect(isLockdownExempt('/')).toBe(true);
    expect(isLockdownExempt('/drives')).toBe(false);
  });
});

describe('isLockdownEnabled', () => {
  const original = process.env.LOCKDOWN_DISABLED;

  afterEach(() => {
    if (original === undefined) delete process.env.LOCKDOWN_DISABLED;
    else process.env.LOCKDOWN_DISABLED = original;
  });

  it('is on when nothing is configured', () => {
    delete process.env.LOCKDOWN_DISABLED;
    expect(isLockdownEnabled()).toBe(true);
  });

  it('is off only for the exact opt-out value', () => {
    process.env.LOCKDOWN_DISABLED = '1';
    expect(isLockdownEnabled()).toBe(false);
  });

  it('stays on for any other value, so a typo cannot open the site', () => {
    for (const value of ['0', 'true', 'yes', '', 'disabled']) {
      process.env.LOCKDOWN_DISABLED = value;
      expect(isLockdownEnabled()).toBe(true);
    }
  });
});

describe('lockdown configuration', () => {
  it('redirects to the coming-soon teaser at the root, not the invite landing', () => {
    expect(LOCKDOWN_REDIRECT_PATH).toBe('/');
  });

  it('uses a temporary redirect so the decision can be reversed', () => {
    expect(LOCKDOWN_REDIRECT_STATUS).toBe(302);
  });

  it('exempts its own redirect target, so the redirect cannot loop', () => {
    expect(isLockdownExempt(LOCKDOWN_REDIRECT_PATH)).toBe(true);
  });

  it('keeps the exemption list short and reviewable', () => {
    // Every entry here is a live external dependency or a static asset path.
    // Growing this list silently is how a lockdown stops being one. The root
    // and `/join/{CODE}` are not prefixes; they are asserted above.
    expect(LOCKDOWN_EXEMPT_PREFIXES).toEqual([
      '/.well-known',
      '/api/auth',
      '/_next',
      '/favicon.ico',
      '/og',
      '/privacy',
    ]);
  });

  /**
   * The policy is behind three independent gates, and only the lockdown is
   * asserted above. The auth gate in `proxy.ts` and the beta gate both have
   * their own allow-lists, and the beta gate is the one that can be switched on
   * from the Vercel dashboard without a code change — so a reader could lose
   * the policy to a password prompt without anyone touching this repo.
   */
  it('is public to the auth gate and the beta gate as well', () => {
    expect(isPublicPath(PRIVACY_ROUTE)).toBe(true);
    expect(isBetaExcludedPath(PRIVACY_ROUTE)).toBe(true);
  });
});
