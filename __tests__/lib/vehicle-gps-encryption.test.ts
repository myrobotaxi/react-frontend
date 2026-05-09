/**
 * Unit tests for `src/lib/vehicle-gps-encryption.ts` — dual-write /
 * dual-read helpers for the encrypted Vehicle GPS shadow columns
 * (MYR-63 Phase 1).
 */

import { Buffer } from 'node:buffer';

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';

import { __resetEncryptor } from '@/lib/account-encryption';
import { KEY_LEN, newEncryptor, loadKeySetFromEnv } from '@/lib/cryptox';
import {
  buildEncryptedVehicleGPSWrite,
  readVehicleGPS,
  type VehicleGPSFields,
} from '@/lib/vehicle-gps-encryption';

const TEST_KEY_B64 = Buffer.alloc(KEY_LEN, 0x33).toString('base64');

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

function encryptForTest(plaintext: string): string {
  const ks = loadKeySetFromEnv();
  return newEncryptor(ks).encryptString(plaintext);
}

describe('buildEncryptedVehicleGPSWrite', () => {
  it('encrypts both halves of a complete pair', () => {
    const out = buildEncryptedVehicleGPSWrite({
      latitude: 37.7749,
      longitude: -122.4194,
    });
    expect(out.latitudeEnc).toBeTruthy();
    expect(out.longitudeEnc).toBeTruthy();
    expect(out.latitudeEnc).not.toEqual(out.longitudeEnc);
  });

  it('round-trips through the encryptor lossless on doubles', () => {
    const out = buildEncryptedVehicleGPSWrite({
      latitude: 37.77491234567,
      longitude: -122.41947654321,
    });
    const ks = loadKeySetFromEnv();
    const enc = newEncryptor(ks);
    expect(Number(enc.decryptString(out.latitudeEnc!))).toBe(37.77491234567);
    expect(Number(enc.decryptString(out.longitudeEnc!))).toBe(-122.41947654321);
  });

  it('clears both shadows on null pair', () => {
    const out = buildEncryptedVehicleGPSWrite({
      destinationLatitude: null,
      destinationLongitude: null,
    });
    expect(out.destinationLatitudeEnc).toBeNull();
    expect(out.destinationLongitudeEnc).toBeNull();
  });

  it('leaves shadows untouched on undefined pair', () => {
    const out = buildEncryptedVehicleGPSWrite({});
    expect(out.latitudeEnc).toBeUndefined();
    expect(out.longitudeEnc).toBeUndefined();
    expect(out.destinationLatitudeEnc).toBeUndefined();
    expect(out.originLatitudeEnc).toBeUndefined();
  });

  it('rejects half-pair input — leaves shadow untouched + warns', () => {
    const out = buildEncryptedVehicleGPSWrite({
      latitude: 37.7749,
      // longitude omitted
    });
    expect(out.latitudeEnc).toBeUndefined();
    expect(out.longitudeEnc).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('half-pair input for (latitude, longitude)'),
    );
  });

  it('handles all three pairs independently', () => {
    const out = buildEncryptedVehicleGPSWrite({
      latitude: 1,
      longitude: 2,
      destinationLatitude: 3,
      destinationLongitude: 4,
      originLatitude: 5,
      originLongitude: 6,
    });
    expect(out.latitudeEnc).toBeTruthy();
    expect(out.longitudeEnc).toBeTruthy();
    expect(out.destinationLatitudeEnc).toBeTruthy();
    expect(out.destinationLongitudeEnc).toBeTruthy();
    expect(out.originLatitudeEnc).toBeTruthy();
    expect(out.originLongitudeEnc).toBeTruthy();
  });
});

describe('readVehicleGPS', () => {
  it('prefers *Enc when both halves of a pair are populated', () => {
    const row: VehicleGPSFields = {
      latitude: 0,
      longitude: 0,
      latitudeEnc: encryptForTest('37.7749'),
      longitudeEnc: encryptForTest('-122.4194'),
    };
    const out = readVehicleGPS(row);
    expect(out.latitude).toBe(37.7749);
    expect(out.longitude).toBe(-122.4194);
  });

  it('falls back to plaintext when *Enc is NULL on both halves', () => {
    const row: VehicleGPSFields = {
      latitude: 1.23,
      longitude: 4.56,
      latitudeEnc: null,
      longitudeEnc: null,
    };
    const out = readVehicleGPS(row);
    expect(out.latitude).toBe(1.23);
    expect(out.longitude).toBe(4.56);
  });

  it('treats half-pair *Enc (one populated, one NULL) as null + warns', () => {
    const row: VehicleGPSFields = {
      latitude: 1,
      longitude: 2,
      latitudeEnc: encryptForTest('37.7749'),
      longitudeEnc: null,
    };
    const out = readVehicleGPS(row);
    expect(out.latitude).toBeNull();
    expect(out.longitude).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('half-pair *Enc detected'),
    );
  });

  it('returns null pairs when both plaintext and *Enc are null/undefined', () => {
    const row: VehicleGPSFields = {};
    const out = readVehicleGPS(row);
    expect(out.latitude).toBeNull();
    expect(out.longitude).toBeNull();
    expect(out.destinationLatitude).toBeNull();
    expect(out.destinationLongitude).toBeNull();
    expect(out.originLatitude).toBeNull();
    expect(out.originLongitude).toBeNull();
  });

  it('reads destination + origin pairs independently of main pair', () => {
    const row: VehicleGPSFields = {
      latitudeEnc: encryptForTest('1'),
      longitudeEnc: encryptForTest('2'),
      destinationLatitude: 30,
      destinationLongitude: 40,
      destinationLatitudeEnc: null,
      destinationLongitudeEnc: null,
      originLatitudeEnc: encryptForTest('500'),
      originLongitudeEnc: encryptForTest('600'),
    };
    const out = readVehicleGPS(row);
    expect(out.latitude).toBe(1);
    expect(out.longitude).toBe(2);
    expect(out.destinationLatitude).toBe(30); // plaintext fallback
    expect(out.destinationLongitude).toBe(40);
    expect(out.originLatitude).toBe(500);
    expect(out.originLongitude).toBe(600);
  });

  it('round-trips a Float written by buildEncryptedVehicleGPSWrite', () => {
    const w = buildEncryptedVehicleGPSWrite({
      latitude: 37.77491234567,
      longitude: -122.41947654321,
    });
    const row: VehicleGPSFields = {
      latitude: 37.77491234567,
      longitude: -122.41947654321,
      latitudeEnc: w.latitudeEnc,
      longitudeEnc: w.longitudeEnc,
    };
    const out = readVehicleGPS(row);
    expect(out.latitude).toBe(37.77491234567);
    expect(out.longitude).toBe(-122.41947654321);
  });
});
