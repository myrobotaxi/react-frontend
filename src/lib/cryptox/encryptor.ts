/**
 * Column-level encryption (AES-256-GCM) for OAuth tokens and other P1
 * data classified per docs/contracts/data-classification.md §3.3.
 *
 * This is the TypeScript port of the Go-side `internal/cryptox` package
 * (my-robo-taxi-telemetry). The wire format is byte-equal across
 * implementations so a row encrypted by either side is decryptable by
 * the other:
 *
 *   ciphertext blob = [1B version][12B nonce][N B ciphertext + 16B tag]
 *   stored value    = base64(StdEncoding) of the blob
 *
 * Wire format and KeySet semantics MUST stay in lockstep with the Go
 * implementation. See `__fixtures__/cross-impl.json` for the fixture
 * that proves byte-equality.
 *
 * # Empty-string sentinel
 *
 * `encryptString("")` returns `""` and `decryptString("")` returns `""`.
 * This represents an absent value (NULL column, optional field) so the
 * call site can keep the encrypt-on-write/decrypt-on-read code path
 * uniform for nullable P1 columns. Callers MUST NOT use the empty
 * string to encrypt genuine zero-length payloads — there is no signal
 * distinguishing "absent" from "encrypted empty".
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import {
  AES_GCM_TAG_LEN,
  ErrCiphertextTooShort,
  ErrInvalidVersion,
  ErrUnknownKeyVersion,
  KeySet,
  MIN_CIPHERTEXT_LEN,
  NONCE_LEN,
  VERSION_V1,
} from './key';

/**
 * Encryptor is the public surface for column-level encryption. The
 * interface accepts/returns base64 strings on the wire because every P1
 * column today is a Postgres Text or JSON value — base64 keeps the
 * stored shape uniform. Raw byte ciphertext is intentionally NOT
 * exposed outside this module.
 *
 * The interface is isolated so a Web Crypto backend (browser /
 * edge-runtime) can be swapped in later without changing call sites.
 */
export interface Encryptor {
  /**
   * Seal `s` under the active write key and return the base64-encoded
   * ciphertext blob (`version || nonce || ct || tag`). Empty input
   * returns `""` per the empty-string sentinel contract.
   */
  encryptString(s: string): string;

  /**
   * Open a base64 ciphertext produced by `encryptString` (or a
   * compatible Go-side producer using the same KeySet). Throws
   * `ErrCiphertextTooShort`, `ErrInvalidVersion`, or
   * `ErrUnknownKeyVersion` for malformed input; throws a tag-failure
   * error for tampered/wrong-key input. Empty input returns `""`.
   */
  decryptString(ciphertext: string): string;
}

/**
 * AES-256-GCM Encryptor backed by Node's `node:crypto` module.
 *
 * Construct via `newEncryptor(keySet)` — direct construction is allowed
 * but the helper validates that the KeySet has a key for its
 * `writeVersion`, matching the Go-side `NewEncryptor` defensive check.
 */
export class AesGcmEncryptor implements Encryptor {
  readonly #ks: KeySet;

  constructor(ks: KeySet) {
    if (!ks) {
      throw new Error('cryptox.AesGcmEncryptor: nil KeySet');
    }
    if (!ks.hasVersion(ks.writeVersion)) {
      throw new Error(
        `cryptox.AesGcmEncryptor: write version ${ks.writeVersion} has no key in KeySet`,
      );
    }
    this.#ks = ks;
  }

  /**
   * Redacts the encryptor when a structured logger walks fields.
   * Defense-in-depth alongside `KeySet.toString` — even though the
   * encryptor doesn't directly expose key material, a careless
   * `console.log({ enc })` could otherwise traverse private fields via
   * util.inspect customizations.
   */
  toJSON(): string {
    return '<Encryptor:redacted>';
  }
  toString(): string {
    return '<Encryptor:redacted>';
  }
  // Node's util.inspect honors this symbol for log redaction.
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return '<Encryptor:redacted>';
  }

  encryptString(s: string): string {
    if (s === '') {
      return '';
    }
    const writeKey = this.#ks.keyForVersion(this.#ks.writeVersion);
    if (!writeKey) {
      throw new Error(
        `cryptox.encryptString: write key missing for version ${this.#ks.writeVersion}`,
      );
    }

    const nonce = randomBytes(NONCE_LEN);
    const cipher = createCipheriv('aes-256-gcm', writeKey, nonce);
    const ct = Buffer.concat([cipher.update(s, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Layout: [1B version][12B nonce][N B ct][16B tag]
    const blob = Buffer.alloc(1 + nonce.length + ct.length + tag.length);
    blob[0] = this.#ks.writeVersion;
    nonce.copy(blob, 1);
    ct.copy(blob, 1 + nonce.length);
    tag.copy(blob, 1 + nonce.length + ct.length);

    return blob.toString('base64');
  }

  decryptString(ciphertext: string): string {
    if (ciphertext === '') {
      return '';
    }
    let blob: Buffer;
    try {
      blob = Buffer.from(ciphertext, 'base64');
    } catch (err) {
      throw new Error(
        `cryptox.decryptString: base64 decode: ${(err as Error).message}`,
      );
    }
    // Node's Buffer.from with base64 silently ignores invalid chars
    // rather than throwing. A short result still indicates malformed
    // input — guard against truncation/corruption explicitly.
    if (blob.length < MIN_CIPHERTEXT_LEN) {
      throw ErrCiphertextTooShort;
    }
    const version = blob[0];
    if (version === 0x00) {
      throw ErrInvalidVersion;
    }
    const key = this.#ks.keyForVersion(version);
    if (!key) {
      const e = new Error(
        `cryptox.decryptString: ${ErrUnknownKeyVersion.message}: version=${version}`,
      );
      // Preserve identity check via .cause + name match for callers
      // that route by error type rather than instance.
      (e as Error & { cause?: Error }).cause = ErrUnknownKeyVersion;
      e.name = ErrUnknownKeyVersion.name;
      throw e;
    }

    const nonce = blob.subarray(1, 1 + NONCE_LEN);
    const tagStart = blob.length - AES_GCM_TAG_LEN;
    const ct = blob.subarray(1 + NONCE_LEN, tagStart);
    const tag = blob.subarray(tagStart);

    const decipher = createDecipheriv('aes-256-gcm', key, nonce);
    decipher.setAuthTag(tag);
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    return pt.toString('utf8');
  }
}

/**
 * Construct an Encryptor from a KeySet. Mirrors Go's
 * `cryptox.NewEncryptor(ks)` factory.
 */
export function newEncryptor(ks: KeySet): Encryptor {
  return new AesGcmEncryptor(ks);
}

// Re-export the version constant for callers that want to assert on
// write-version expectations without importing key.ts directly.
export { VERSION_V1 };
