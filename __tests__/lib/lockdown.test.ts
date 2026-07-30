import { describe, it, expect } from 'vitest';

import {
  isLockdownExempt,
  LOCKDOWN_EXEMPT_PREFIXES,
  LOCKDOWN_REDIRECT_PATH,
  LOCKDOWN_REDIRECT_STATUS,
} from '@/lib/lockdown';

describe('isLockdownExempt — reachable', () => {
  const exempt = [
    '/join',
    '/join/RBO246',
    '/join/anything',
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
  ];

  it.each(exempt)('keeps %s reachable', (pathname) => {
    expect(isLockdownExempt(pathname)).toBe(true);
  });
});

describe('isLockdownExempt — locked down', () => {
  const locked = [
    '/',
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

  it('treats the root as locked down', () => {
    expect(isLockdownExempt('/')).toBe(false);
  });
});

describe('lockdown configuration', () => {
  it('redirects to the codeless invite landing', () => {
    expect(LOCKDOWN_REDIRECT_PATH).toBe('/join');
  });

  it('uses a temporary redirect so the decision can be reversed', () => {
    expect(LOCKDOWN_REDIRECT_STATUS).toBe(302);
  });

  it('exempts its own redirect target, so the redirect cannot loop', () => {
    expect(isLockdownExempt(LOCKDOWN_REDIRECT_PATH)).toBe(true);
  });

  it('keeps the exemption list short and reviewable', () => {
    // Every entry here is a live external dependency or a static asset path.
    // Growing this list silently is how a lockdown stops being one.
    expect(LOCKDOWN_EXEMPT_PREFIXES).toEqual([
      '/join',
      '/.well-known',
      '/api/auth',
      '/_next',
      '/favicon.ico',
      '/og',
    ]);
  });
});
