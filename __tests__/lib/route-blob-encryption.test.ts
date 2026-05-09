/**
 * Unit tests for `src/lib/route-blob-encryption.ts` — dual-write /
 * dual-read helpers for the encrypted route-blob shadow columns
 * (Vehicle.navRouteCoordinatesEnc, Drive.routePointsEnc) — MYR-64
 * Phase 1.
 */

import { Buffer } from 'node:buffer';

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';

import { __resetEncryptor } from '@/lib/account-encryption';
import { KEY_LEN, newEncryptor, loadKeySetFromEnv } from '@/lib/cryptox';
import {
  buildEncryptedNavRouteWrite,
  buildEncryptedRoutePointsWrite,
  readNavRouteCoordinates,
  readRoutePoints,
  type NavRouteCoordinate,
  type RoutePoint,
} from '@/lib/route-blob-encryption';

const TEST_KEY_B64 = Buffer.alloc(KEY_LEN, 0x44).toString('base64');

let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  process.env.ENCRYPTION_KEY = TEST_KEY_B64;
  __resetEncryptor();
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  delete process.env.ENCRYPTION_KEY;
  __resetEncryptor();
  warnSpy.mockRestore();
});

const sampleCoords: NavRouteCoordinate[] = [
  [-122.4194, 37.7749],
  [-122.41, 37.77],
  [-122.405, 37.765],
];

const samplePoints: RoutePoint[] = [
  { lat: 37.7749, lng: -122.4194, timestamp: '2026-01-01T00:00:00Z', speed: 0 },
  { lat: 37.7755, lng: -122.4188, timestamp: '2026-01-01T00:00:01Z', speed: 12.3 },
  { lat: 37.7762, lng: -122.4181, timestamp: '2026-01-01T00:00:02Z', speed: 18.7 },
];

describe('buildEncryptedNavRouteWrite', () => {
  it('encrypts populated coordinates into the shadow column', () => {
    const out = buildEncryptedNavRouteWrite(sampleCoords);
    expect(out.navRouteCoordinatesEnc).toBeTruthy();
    expect(typeof out.navRouteCoordinatesEnc).toBe('string');
  });

  it('clears the shadow on null', () => {
    const out = buildEncryptedNavRouteWrite(null);
    expect(out.navRouteCoordinatesEnc).toBeNull();
  });

  it('clears the shadow on empty array', () => {
    const out = buildEncryptedNavRouteWrite([]);
    expect(out.navRouteCoordinatesEnc).toBeNull();
  });

  it('leaves the shadow untouched on undefined', () => {
    const out = buildEncryptedNavRouteWrite(undefined);
    expect(out.navRouteCoordinatesEnc).toBeUndefined();
  });

  it('produces ciphertext that round-trips back to the input array', () => {
    const out = buildEncryptedNavRouteWrite(sampleCoords);
    const ks = loadKeySetFromEnv();
    const enc = newEncryptor(ks);
    const decoded = JSON.parse(enc.decryptString(out.navRouteCoordinatesEnc!));
    expect(decoded).toEqual(sampleCoords);
  });

  it('handles a large polyline (5000 points)', () => {
    const big: NavRouteCoordinate[] = Array.from({ length: 5000 }, (_, i) => [
      -122 + i * 1e-5,
      37 + i * 1e-5,
    ]);
    const out = buildEncryptedNavRouteWrite(big);
    expect(out.navRouteCoordinatesEnc).toBeTruthy();
    const ks = loadKeySetFromEnv();
    const enc = newEncryptor(ks);
    const decoded = JSON.parse(enc.decryptString(out.navRouteCoordinatesEnc!));
    expect(decoded).toEqual(big);
  });
});

describe('readNavRouteCoordinates', () => {
  it('prefers *Enc when populated', () => {
    const w = buildEncryptedNavRouteWrite(sampleCoords);
    const out = readNavRouteCoordinates({
      navRouteCoordinates: [[0, 0]],
      navRouteCoordinatesEnc: w.navRouteCoordinatesEnc!,
    });
    expect(out).toEqual(sampleCoords);
  });

  it('falls back to plaintext when *Enc is null', () => {
    const out = readNavRouteCoordinates({
      navRouteCoordinates: sampleCoords,
      navRouteCoordinatesEnc: null,
    });
    expect(out).toEqual(sampleCoords);
  });

  it('returns null when both columns are null', () => {
    const out = readNavRouteCoordinates({
      navRouteCoordinates: null,
      navRouteCoordinatesEnc: null,
    });
    expect(out).toBeNull();
  });

  it('falls back to plaintext on decrypt failure + warns', () => {
    const out = readNavRouteCoordinates({
      navRouteCoordinates: sampleCoords,
      navRouteCoordinatesEnc: 'bogus-not-real-ciphertext',
    });
    expect(out).toEqual(sampleCoords);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'navRouteCoordinatesEnc decrypt/parse failed',
      ),
    );
  });

  it('falls back to plaintext when *Enc decodes to non-array + warns', () => {
    const ks = loadKeySetFromEnv();
    const enc = newEncryptor(ks);
    const badEnc = enc.encryptString(JSON.stringify({ not: 'an array' }));
    const out = readNavRouteCoordinates({
      navRouteCoordinates: sampleCoords,
      navRouteCoordinatesEnc: badEnc,
    });
    expect(out).toEqual(sampleCoords);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('decoded to non-array'),
    );
  });
});

describe('buildEncryptedRoutePointsWrite', () => {
  it('encrypts populated points into the shadow column', () => {
    const out = buildEncryptedRoutePointsWrite(samplePoints);
    expect(out.routePointsEnc).toBeTruthy();
  });

  it('clears the shadow on null / empty array', () => {
    expect(buildEncryptedRoutePointsWrite(null).routePointsEnc).toBeNull();
    expect(buildEncryptedRoutePointsWrite([]).routePointsEnc).toBeNull();
  });

  it('leaves the shadow untouched on undefined', () => {
    const out = buildEncryptedRoutePointsWrite(undefined);
    expect(out.routePointsEnc).toBeUndefined();
  });

  it('round-trips through the encryptor', () => {
    const out = buildEncryptedRoutePointsWrite(samplePoints);
    const ks = loadKeySetFromEnv();
    const enc = newEncryptor(ks);
    const decoded = JSON.parse(enc.decryptString(out.routePointsEnc!));
    expect(decoded).toEqual(samplePoints);
  });
});

describe('readRoutePoints', () => {
  it('prefers *Enc when populated', () => {
    const w = buildEncryptedRoutePointsWrite(samplePoints);
    const out = readRoutePoints({
      routePoints: [],
      routePointsEnc: w.routePointsEnc!,
    });
    expect(out).toEqual(samplePoints);
  });

  it('falls back to plaintext when *Enc is null', () => {
    const out = readRoutePoints({
      routePoints: samplePoints,
      routePointsEnc: null,
    });
    expect(out).toEqual(samplePoints);
  });

  it('returns empty array when both columns are absent', () => {
    expect(readRoutePoints({})).toEqual([]);
  });

  it('falls back to plaintext on decrypt failure + warns', () => {
    const out = readRoutePoints({
      routePoints: samplePoints,
      routePointsEnc: 'bogus-not-real-ciphertext',
    });
    expect(out).toEqual(samplePoints);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('routePointsEnc decrypt/parse failed'),
    );
  });

  it('falls back to plaintext on non-array decode + warns', () => {
    const ks = loadKeySetFromEnv();
    const enc = newEncryptor(ks);
    const badEnc = enc.encryptString(JSON.stringify({ not: 'an array' }));
    const out = readRoutePoints({
      routePoints: samplePoints,
      routePointsEnc: badEnc,
    });
    expect(out).toEqual(samplePoints);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('decoded to non-array'),
    );
  });
});
