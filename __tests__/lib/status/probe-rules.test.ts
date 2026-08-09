import { describe, expect, it } from 'vitest';

import {
  healthFailure,
  realtimeFailure,
  summarizeProbe,
  wellKnownFailure,
  WELL_KNOWN_EXPECTATIONS,
} from '@/lib/status/probe-rules';

describe('healthFailure', () => {
  it('accepts only 200', () => {
    expect(healthFailure('readyz', 200)).toBeNull();
  });

  it('rejects the 503 a service returns when its database is gone', () => {
    expect(healthFailure('readyz', 503)).toBe('readyz returned HTTP 503');
  });

  it('rejects a redirect — nothing should be in front of a health endpoint', () => {
    expect(healthFailure('healthz', 302)).toBe('healthz returned HTTP 302');
  });

  it('rejects the synthetic zero a transport failure records', () => {
    expect(healthFailure('healthz', 0)).toBe('healthz returned HTTP 0');
  });
});

describe('realtimeFailure', () => {
  it('accepts the 4xx a WebSocket route gives a plain GET', () => {
    expect(realtimeFailure(400)).toBeNull();
    expect(realtimeFailure(426)).toBeNull();
  });

  it('accepts a 200 as well — any answer from the service will do', () => {
    expect(realtimeFailure(200)).toBeNull();
  });

  it('rejects the 502 an edge returns when nothing is behind it', () => {
    expect(realtimeFailure(502)).toBe('WebSocket endpoint returned HTTP 502');
    expect(realtimeFailure(503)).toBe('WebSocket endpoint returned HTTP 503');
  });
});

describe('wellKnownFailure', () => {
  const aasa = WELL_KNOWN_EXPECTATIONS[0];
  const pem = WELL_KNOWN_EXPECTATIONS[1];

  it('accepts the real documents', () => {
    expect(
      wellKnownFailure(aasa, {
        status: 200,
        contentType: 'application/json',
        body: '{"applinks":{"details":[]}}',
      }),
    ).toBeNull();

    expect(
      wellKnownFailure(pem, {
        status: 200,
        contentType: 'application/x-pem-file',
        body: '-----BEGIN PUBLIC KEY-----\nMFkw...\n-----END PUBLIC KEY-----\n',
      }),
    ).toBeNull();
  });

  it('ignores content-type parameters and case', () => {
    expect(
      wellKnownFailure(aasa, {
        status: 200,
        contentType: 'Application/JSON; charset=utf-8',
        body: '{"applinks":{}}',
      }),
    ).toBeNull();
  });

  it('catches the AASA being served as HTML — the MYR-504 failure', () => {
    expect(
      wellKnownFailure(aasa, {
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: '<!doctype html>',
      }),
    ).toBe('apple-app-site-association served as text/html, expected application/json');
  });

  it('catches a 200 with nothing in it', () => {
    expect(
      wellKnownFailure(pem, { status: 200, contentType: 'application/x-pem-file', body: '   \n' }),
    ).toBe('tesla public key is empty');
  });

  it('catches a 200 with the wrong thing in it', () => {
    expect(
      wellKnownFailure(pem, {
        status: 200,
        contentType: 'application/x-pem-file',
        body: 'not a key at all',
      }),
    ).toBe('tesla public key is missing -----BEGIN PUBLIC KEY-----');
  });

  it('catches the file being gone', () => {
    expect(wellKnownFailure(aasa, { status: 404, contentType: 'text/plain', body: '' })).toBe(
      'apple-app-site-association returned HTTP 404',
    );
  });

  it('catches a missing content type without printing "null"', () => {
    expect(wellKnownFailure(aasa, { status: 200, contentType: null, body: '{"applinks":{}}' })).toBe(
      'apple-app-site-association served as no content type, expected application/json',
    );
  });
});

describe('summarizeProbe', () => {
  it('passes only when every part passed, and keeps the evidence', () => {
    expect(
      summarizeProbe([
        { summary: 'healthz 200 in 84ms', failure: null },
        { summary: 'readyz 200 in 61ms', failure: null },
      ]),
    ).toEqual({ ok: true, detail: 'healthz 200 in 84ms, readyz 200 in 61ms' });
  });

  it('fails on one bad part and reports every failure', () => {
    expect(
      summarizeProbe([
        { summary: 'healthz 200 in 84ms', failure: null },
        { summary: '', failure: 'readyz returned HTTP 503' },
      ]),
    ).toEqual({ ok: false, detail: 'readyz returned HTTP 503' });

    expect(
      summarizeProbe([
        { summary: '', failure: 'healthz returned HTTP 502' },
        { summary: '', failure: 'readyz returned HTTP 502' },
      ]).detail,
    ).toBe('healthz returned HTTP 502; readyz returned HTTP 502');
  });
});
