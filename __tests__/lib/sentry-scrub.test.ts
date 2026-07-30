import { describe, it, expect } from 'vitest';

import { scrubInviteCodes } from '@/lib/sentry-scrub';
import { redactInviteCodePaths } from '@/lib/invite-code';

describe('redactInviteCodePaths', () => {
  it('redacts a code in a bare path', () => {
    expect(redactInviteCodePaths('/join/RBO246')).toBe('/join/[code]');
  });

  it('redacts a code in a full URL', () => {
    expect(redactInviteCodePaths('https://myrobotaxi.app/join/RBO246')).toBe(
      'https://myrobotaxi.app/join/[code]',
    );
  });

  it('redacts a lowercase code', () => {
    expect(redactInviteCodePaths('/join/rbo246')).toBe('/join/[code]');
  });

  it('redacts a code followed by a query string', () => {
    expect(redactInviteCodePaths('/join/RBO246?utm=sms')).toBe('/join/[code]?utm=sms');
  });

  it('redacts every occurrence', () => {
    expect(redactInviteCodePaths('/join/RBO246 then /join/ZZ9999')).toBe(
      '/join/[code] then /join/[code]',
    );
  });

  it('leaves the codeless landing alone', () => {
    expect(redactInviteCodePaths('/join')).toBe('/join');
    expect(redactInviteCodePaths('https://myrobotaxi.app/join')).toBe(
      'https://myrobotaxi.app/join',
    );
  });

  it('leaves the parameterized route name alone', () => {
    expect(redactInviteCodePaths('/join/[code]')).toBe('/join/[code]');
  });

  it('does not partially rewrite a longer segment', () => {
    expect(redactInviteCodePaths('/join/RBO246EXTRA')).toBe('/join/RBO246EXTRA');
  });

  it('leaves unrelated paths untouched', () => {
    expect(redactInviteCodePaths('/drives/abc123')).toBe('/drives/abc123');
  });
});

describe('scrubInviteCodes', () => {
  it('redacts nested string values in an event-shaped object', () => {
    const event = {
      transaction: 'GET /join/RBO246',
      request: { url: 'https://myrobotaxi.app/join/RBO246', method: 'GET' },
      breadcrumbs: [{ data: { url: '/join/RBO246' } }],
      contexts: { trace: { data: { 'url.path': '/join/RBO246' } } },
    };

    const scrubbed = scrubInviteCodes(event);

    expect(scrubbed.transaction).toBe('GET /join/[code]');
    expect(scrubbed.request.url).toBe('https://myrobotaxi.app/join/[code]');
    expect(scrubbed.breadcrumbs[0].data.url).toBe('/join/[code]');
    expect(scrubbed.contexts.trace.data['url.path']).toBe('/join/[code]');
  });

  it('leaves the original event unmutated', () => {
    const event = { request: { url: '/join/RBO246' } };
    scrubInviteCodes(event);
    expect(event.request.url).toBe('/join/RBO246');
  });

  it('preserves non-string values', () => {
    const event = {
      timestamp: 1_700_000_000,
      sampled: true,
      tags: null,
      missing: undefined,
    };

    expect(scrubInviteCodes(event)).toEqual(event);
  });

  it('passes class instances through untouched', () => {
    const error = new Error('boom');
    const scrubbed = scrubInviteCodes({ exception: error });
    expect(scrubbed.exception).toBe(error);
  });

  it('handles arrays of strings', () => {
    expect(scrubInviteCodes(['/join/RBO246', '/drives'])).toEqual([
      '/join/[code]',
      '/drives',
    ]);
  });

  it('does not recurse past the depth cap', () => {
    // 12 levels deep — past MAX_DEPTH, so the value is returned as-is rather
    // than throwing or hanging.
    let nested: Record<string, unknown> = { url: '/join/RBO246' };
    for (let i = 0; i < 12; i += 1) nested = { nested };

    expect(() => scrubInviteCodes(nested)).not.toThrow();
  });
});
