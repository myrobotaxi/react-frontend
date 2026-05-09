/**
 * Unit tests for `src/lib/cryptox/`. Coverage:
 *
 * - encryptString → decryptString round-trip under a single-key KeySet
 * - random nonce → distinct ciphertexts for the same plaintext
 * - tamper rejection (ciphertext byte flip → auth-tag failure)
 * - empty-string sentinel parity (encrypt "" → "", decrypt "" → "")
 * - cross-impl fixture decrypts to the recorded plaintext
 * - versioned KeySet round-trip + leading version-byte assertion
 * - reject ciphertext with version 0x00 (ErrInvalidVersion)
 * - reject ciphertext shorter than MIN_CIPHERTEXT_LEN
 * - reject ciphertext whose version byte is not in the KeySet
 *   (ErrUnknownKeyVersion)
 * - loadKeySetFromEnv: single-key shape, versioned shape, ambiguity,
 *   missing config, missing write key, invalid key length
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, it, expect } from 'vitest';

import {
  AesGcmEncryptor,
  CryptoxError,
  ErrCiphertextTooShort,
  ErrInvalidVersion,
  ErrUnknownKeyVersion,
  KeySet,
  KEY_LEN,
  loadKeySetFromEnv,
  MIN_CIPHERTEXT_LEN,
  newEncryptor,
  VERSION_V1,
} from '@/lib/cryptox';

// Helper: build a KeySet with one or more synthetic keys of the given
// version bytes. Keeps tests free of base64 boilerplate.
function makeKeySet(
  writeVersion: number,
  versions: number[] = [writeVersion],
): KeySet {
  const keys = new Map<number, Buffer>();
  for (const v of versions) {
    // Deterministic per-version key so test failures are reproducible.
    const k = Buffer.alloc(KEY_LEN);
    k.fill(v);
    keys.set(v, k);
  }
  return new KeySet(writeVersion, keys);
}

describe('AesGcmEncryptor — round-trip', () => {
  it('encrypts and decrypts a typical OAuth-token-shaped payload', () => {
    const ks = makeKeySet(VERSION_V1);
    const enc = newEncryptor(ks);

    const plaintext =
      'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMyJ9.payload.signature';
    const ct = enc.encryptString(plaintext);

    expect(ct).not.toEqual(plaintext);
    expect(enc.decryptString(ct)).toEqual(plaintext);
  });

  it('produces distinct ciphertexts for the same plaintext (random nonce)', () => {
    const enc = newEncryptor(makeKeySet(VERSION_V1));
    const plaintext = 'rotate-me';

    const ct1 = enc.encryptString(plaintext);
    const ct2 = enc.encryptString(plaintext);

    expect(ct1).not.toEqual(ct2);
    expect(enc.decryptString(ct1)).toEqual(plaintext);
    expect(enc.decryptString(ct2)).toEqual(plaintext);
  });

  it('places the active write version at byte 0 of the blob', () => {
    const ks = makeKeySet(0x02, [0x02]);
    const enc = newEncryptor(ks);

    const ct = enc.encryptString('versioned');
    const blob = Buffer.from(ct, 'base64');

    expect(blob[0]).toEqual(0x02);
  });
});

describe('AesGcmEncryptor — empty-string sentinel', () => {
  it('encryptString("") returns ""', () => {
    const enc = newEncryptor(makeKeySet(VERSION_V1));
    expect(enc.encryptString('')).toEqual('');
  });

  it('decryptString("") returns ""', () => {
    const enc = newEncryptor(makeKeySet(VERSION_V1));
    expect(enc.decryptString('')).toEqual('');
  });
});

describe('AesGcmEncryptor — tamper rejection', () => {
  it('rejects ciphertext when a byte in the body is flipped', () => {
    const enc = newEncryptor(makeKeySet(VERSION_V1));
    const ct = enc.encryptString('protect-me');
    const blob = Buffer.from(ct, 'base64');

    // Flip a byte in the ct region (just past version + nonce, before tag).
    const tamperIdx = 1 + 12 + 1;
    blob[tamperIdx] ^= 0xff;
    const tampered = blob.toString('base64');

    expect(() => enc.decryptString(tampered)).toThrow();
  });

  it('rejects a ciphertext shorter than MIN_CIPHERTEXT_LEN', () => {
    const enc = newEncryptor(makeKeySet(VERSION_V1));
    // 8 bytes < MIN_CIPHERTEXT_LEN (29).
    const tooShort = Buffer.alloc(8, 0x01).toString('base64');
    expect(() => enc.decryptString(tooShort)).toThrow(ErrCiphertextTooShort);
  });

  it('confirms MIN_CIPHERTEXT_LEN is 29 (1 version + 12 nonce + 16 tag)', () => {
    expect(MIN_CIPHERTEXT_LEN).toEqual(29);
  });

  it('rejects ciphertext with reserved 0x00 version byte', () => {
    const enc = newEncryptor(makeKeySet(VERSION_V1));
    // Take a real ciphertext, flip the version byte to 0x00.
    const ct = enc.encryptString('valid');
    const blob = Buffer.from(ct, 'base64');
    blob[0] = 0x00;
    expect(() => enc.decryptString(blob.toString('base64'))).toThrow(
      ErrInvalidVersion,
    );
  });

  it('rejects ciphertext whose version is not in the KeySet (ErrUnknownKeyVersion)', () => {
    // Encrypt under v2, then attempt to decrypt with a KeySet that
    // only knows v1.
    const v2Enc = newEncryptor(makeKeySet(0x02, [0x02]));
    const ctV2 = v2Enc.encryptString('written-with-v2');

    const v1OnlyEnc = newEncryptor(makeKeySet(VERSION_V1));
    expect(() => v1OnlyEnc.decryptString(ctV2)).toThrowError(
      /unknown key version/i,
    );

    try {
      v1OnlyEnc.decryptString(ctV2);
    } catch (err) {
      expect((err as Error).name).toEqual(ErrUnknownKeyVersion.name);
    }
  });
});

describe('AesGcmEncryptor — versioned KeySet', () => {
  it('encrypts under the active write version and decrypts older versions transparently', () => {
    // KeySet readable at v1 and v2; write at v2.
    const ks = makeKeySet(0x02, [0x01, 0x02]);
    const enc = newEncryptor(ks);

    // Simulate an older v1 ciphertext via a v1-only encryptor that
    // shares the same v1 key. We rebuild a KeySet whose v1 key
    // matches `ks`'s v1 key so the v2-write encryptor can decrypt it.
    const v1Key = (ks as unknown as { keyForVersion(v: number): Buffer })
      .keyForVersion(0x01)!;
    const v1KeysOnly = new Map<number, Buffer>([[0x01, v1Key]]);
    const v1Enc = newEncryptor(new KeySet(0x01, v1KeysOnly));
    const ctV1 = v1Enc.encryptString('legacy-v1-row');

    // The dual-version encryptor decrypts the v1 ciphertext...
    expect(enc.decryptString(ctV1)).toEqual('legacy-v1-row');

    // ...and writes new ciphertexts at v2.
    const ctV2 = enc.encryptString('fresh-v2-row');
    expect(Buffer.from(ctV2, 'base64')[0]).toEqual(0x02);
    expect(enc.decryptString(ctV2)).toEqual('fresh-v2-row');
  });
});

describe('AesGcmEncryptor — constructor guards', () => {
  it('throws when constructed with a KeySet missing the write-version key', () => {
    // Bypass loadKeySetFromEnv and hand-roll an inconsistent KeySet:
    // writeVersion claims v3 but the keys map only has v1.
    const k1 = Buffer.alloc(KEY_LEN, 0x11);
    const ks = new KeySet(0x03, new Map([[0x01, k1]]));
    expect(() => new AesGcmEncryptor(ks)).toThrowError(
      /write version 3 has no key/,
    );
  });
});

describe('cross-impl fixture (Go-encrypt → TS-decrypt)', () => {
  it('decrypts the Go-generated ciphertext under the recorded key', () => {
    const fixturePath = resolve(
      __dirname,
      '../../../src/lib/cryptox/__fixtures__/cross-impl.json',
    );
    const fixture = JSON.parse(readFileSync(fixturePath, 'utf8')) as {
      key_b64: string;
      ciphertext_b64: string;
      plaintext: string;
      version: number;
    };

    expect(fixture.version).toEqual(1);
    const key = Buffer.from(fixture.key_b64, 'base64');
    expect(key.length).toEqual(KEY_LEN);

    const ks = new KeySet(VERSION_V1, new Map([[VERSION_V1, key]]));
    const enc = newEncryptor(ks);

    expect(enc.decryptString(fixture.ciphertext_b64)).toEqual(
      fixture.plaintext,
    );
  });
});

describe('loadKeySetFromEnv', () => {
  // 32 zero-bytes, base64-encoded — used as a safe synthetic key.
  const ZERO_KEY_B64 = Buffer.alloc(KEY_LEN, 0x00).toString('base64');
  const ONES_KEY_B64 = Buffer.alloc(KEY_LEN, 0x01).toString('base64');

  it('loads a single-key shorthand env into a v1 KeySet', () => {
    const ks = loadKeySetFromEnv({ ENCRYPTION_KEY: ZERO_KEY_B64 });
    expect(ks.writeVersion).toEqual(VERSION_V1);
    expect(ks.hasVersion(VERSION_V1)).toBe(true);
    expect(ks.hasVersion(0x02)).toBe(false);
  });

  it('loads a versioned env shape with ENCRYPTION_KEY_V{N} + ENCRYPTION_WRITE_VERSION', () => {
    const ks = loadKeySetFromEnv({
      ENCRYPTION_KEY_V1: ZERO_KEY_B64,
      ENCRYPTION_KEY_V2: ONES_KEY_B64,
      ENCRYPTION_WRITE_VERSION: '2',
    });
    expect(ks.writeVersion).toEqual(0x02);
    expect(ks.hasVersion(0x01)).toBe(true);
    expect(ks.hasVersion(0x02)).toBe(true);
  });

  it('rejects setting both single-key and versioned shapes simultaneously', () => {
    expect(() =>
      loadKeySetFromEnv({
        ENCRYPTION_KEY: ZERO_KEY_B64,
        ENCRYPTION_KEY_V1: ONES_KEY_B64,
        ENCRYPTION_WRITE_VERSION: '1',
      }),
    ).toThrowError(/pick one shape/);
  });

  it('rejects a versioned env with no write version selected', () => {
    expect(() =>
      loadKeySetFromEnv({ ENCRYPTION_KEY_V1: ZERO_KEY_B64 }),
    ).toThrowError(/ENCRYPTION_WRITE_VERSION is required/);
  });

  it('rejects a write version that has no matching key', () => {
    expect(() =>
      loadKeySetFromEnv({
        ENCRYPTION_KEY_V1: ZERO_KEY_B64,
        ENCRYPTION_WRITE_VERSION: '2',
      }),
    ).toThrowError(/no ENCRYPTION_KEY_V2 found/);
  });

  it('rejects an env with neither shape configured', () => {
    expect(() => loadKeySetFromEnv({})).toThrowError(
      /neither ENCRYPTION_KEY nor ENCRYPTION_KEY_VN are set/,
    );
  });

  it('rejects a key whose decoded length is not 32 bytes', () => {
    const tooShort = Buffer.alloc(16, 0x07).toString('base64');
    let caught: Error | undefined;
    try {
      loadKeySetFromEnv({ ENCRYPTION_KEY: tooShort });
    } catch (err) {
      caught = err as Error;
    }
    expect(caught).toBeDefined();
    expect((caught as Error).message).toMatch(/32 bytes/);
  });

  it('treats an empty-string env value as not-set', () => {
    expect(() =>
      loadKeySetFromEnv({ ENCRYPTION_KEY: '' }),
    ).toThrowError(/neither ENCRYPTION_KEY nor/);
  });

  it('rejects a non-numeric ENCRYPTION_WRITE_VERSION', () => {
    expect(() =>
      loadKeySetFromEnv({
        ENCRYPTION_KEY_V1: ZERO_KEY_B64,
        ENCRYPTION_WRITE_VERSION: '1a',
      }),
    ).toThrowError(/not a valid integer/);
  });

  it('rejects a write version outside 1..255', () => {
    expect(() =>
      loadKeySetFromEnv({
        ENCRYPTION_KEY_V1: ZERO_KEY_B64,
        ENCRYPTION_WRITE_VERSION: '256',
      }),
    ).toThrowError(/out of range/);
  });
});

describe('redaction', () => {
  it('toString / toJSON on KeySet returns "<KeySet:redacted>"', () => {
    const ks = makeKeySet(VERSION_V1);
    expect(String(ks)).toEqual('<KeySet:redacted>');
    expect(JSON.stringify(ks)).toEqual('"<KeySet:redacted>"');
  });

  it('toString / toJSON on Encryptor returns "<Encryptor:redacted>"', () => {
    const enc = newEncryptor(makeKeySet(VERSION_V1));
    expect(String(enc)).toEqual('<Encryptor:redacted>');
    expect(JSON.stringify(enc)).toEqual('"<Encryptor:redacted>"');
  });
});

describe('CryptoxError', () => {
  it('exposes a stable code matching the error name', () => {
    const e = new CryptoxError('ErrThing', 'thing went wrong');
    expect(e.name).toEqual('ErrThing');
    expect(e.code).toEqual('ErrThing');
    expect(e).toBeInstanceOf(Error);
  });
});
