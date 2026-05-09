/**
 * KeySet and key-loading helpers for the column-level encryption
 * package. Mirrors `internal/cryptox/key.go` semantics so deployments
 * can use the same env-var shape across the Go service and the Next.js
 * app.
 *
 * Two env shapes are supported:
 *
 *   1. Single-key shorthand (v1 deployments before any rotation):
 *
 *        ENCRYPTION_KEY=<base64(32B)>
 *
 *      Implies write version = 1, readable versions = {1}.
 *
 *   2. Versioned shape (during/after a rotation):
 *
 *        ENCRYPTION_KEY_V1=<base64(32B)>
 *        ENCRYPTION_KEY_V2=<base64(32B)>
 *        ENCRYPTION_WRITE_VERSION=2
 *
 *      All present versioned keys are added to the readable set; the
 *      one selected by ENCRYPTION_WRITE_VERSION is the active write
 *      version. The single-key and versioned shapes are mutually
 *      exclusive — setting both is a configuration error.
 *
 * Empty-string env values are treated as not-set so that a deployment
 * cannot silently launch with an empty key.
 */

// ─── Wire-format constants ──────────────────────────────────────────────────

/** Version byte for the first ciphertext format. AES-256-GCM, 12B nonce. */
export const VERSION_V1: number = 0x01;

/** GCM standard nonce length (NIST SP 800-38D §5.2.1.1). */
export const NONCE_LEN = 12;

/** AES-GCM authentication tag length appended to ciphertext. */
export const AES_GCM_TAG_LEN = 16;

/** AES-256 key length in bytes. */
export const KEY_LEN = 32;

/**
 * Minimum size in bytes of a valid raw (pre-base64) ciphertext blob:
 * `version + nonce + tag`. A blob shorter than this cannot have come
 * from this package — reject before invoking AES.
 */
export const MIN_CIPHERTEXT_LEN = 1 + NONCE_LEN + AES_GCM_TAG_LEN;

// ─── Sentinel errors ────────────────────────────────────────────────────────

/**
 * CryptoxError carries a stable `code` so call sites can route on
 * identity (`err.code === 'ErrCiphertextTooShort'`) without depending
 * on instance equality across module boundaries.
 */
export class CryptoxError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = code;
    this.code = code;
  }
}

/** Returned when a ciphertext blob is shorter than `MIN_CIPHERTEXT_LEN`. */
export const ErrCiphertextTooShort = new CryptoxError(
  'ErrCiphertextTooShort',
  'cryptox: ciphertext shorter than minimum',
);

/**
 * Returned when decryptString sees a version byte for which no key is
 * registered in the KeySet. Surfaced after a key retirement on a row
 * still encrypted under the retired key — operator must restore the
 * retired key (read-only) or re-encrypt before retiring.
 */
export const ErrUnknownKeyVersion = new CryptoxError(
  'ErrUnknownKeyVersion',
  'cryptox: unknown key version',
);

/**
 * Returned for the reserved `0x00` version byte. `0x00` is reserved as
 * INVALID so a zero-initialized buffer at position 0 cannot be silently
 * accepted.
 */
export const ErrInvalidVersion = new CryptoxError(
  'ErrInvalidVersion',
  'cryptox: invalid ciphertext version 0x00',
);

/** Returned when a configured key, base64-decoded, is not 32 bytes. */
export const ErrInvalidKeyLength = new CryptoxError(
  'ErrInvalidKeyLength',
  'cryptox: key must be 32 bytes (AES-256)',
);

// ─── Env var names ──────────────────────────────────────────────────────────

const ENV_SINGLE_KEY = 'ENCRYPTION_KEY';
const ENV_WRITE_VERSION = 'ENCRYPTION_WRITE_VERSION';
const ENV_VERSIONED_KEY_PREFIX = 'ENCRYPTION_KEY_V';

// ─── KeySet ─────────────────────────────────────────────────────────────────

/**
 * Holds the active write key plus 0..N retired-but-still-readable
 * keys, indexed by version byte. `encryptString` always uses
 * `writeVersion`; `decryptString` fans out by the version byte at the
 * head of the ciphertext.
 *
 * Construct via `loadKeySetFromEnv()`. Direct construction is exposed
 * for tests; production code paths should always go through the env
 * loader so config validation runs.
 *
 * KeySet deliberately overrides `toJSON` / `toString` / inspect so an
 * accidental log of the value cannot leak key material.
 */
export class KeySet {
  readonly writeVersion: number;
  readonly #keys: Map<number, Buffer>;

  constructor(writeVersion: number, keys: Map<number, Buffer>) {
    this.writeVersion = writeVersion;
    this.#keys = keys;
  }

  /** Reports whether the KeySet can decrypt under the given version. */
  hasVersion(v: number): boolean {
    return this.#keys.has(v);
  }

  /**
   * Returns the key for a ciphertext version. Package-internal in
   * spirit — exported only because Encryptor lives in a sibling file.
   * External callers MUST NOT use this to encrypt with raw keys,
   * which would bypass the version-prefix protocol.
   *
   * @internal
   */
  keyForVersion(v: number): Buffer | undefined {
    return this.#keys.get(v);
  }

  // Redacted serialization — defense-in-depth against accidental logs.
  toJSON(): string {
    return '<KeySet:redacted>';
  }
  toString(): string {
    return '<KeySet:redacted>';
  }
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return '<KeySet:redacted>';
  }
}

// ─── Loader ─────────────────────────────────────────────────────────────────

interface EnvLike {
  readonly [k: string]: string | undefined;
}

/**
 * Read encryption keys from `process.env` (or a supplied env-like
 * object for tests). Returns a populated KeySet or throws a
 * descriptive error. See file-level doc for the two supported env
 * shapes.
 */
export function loadKeySetFromEnv(env: EnvLike = process.env): KeySet {
  const single = env[ENV_SINGLE_KEY] ?? '';
  const hasSingle = single !== '';

  const versioned = versionedKeysFromEnv(env);

  if (hasSingle && versioned.size > 0) {
    throw new Error(
      `cryptox.loadKeySetFromEnv: both ${ENV_SINGLE_KEY} and ${ENV_VERSIONED_KEY_PREFIX}N keys are set; pick one shape`,
    );
  }

  if (hasSingle) {
    const key = decodeAndValidate(single);
    return new KeySet(VERSION_V1, new Map<number, Buffer>([[VERSION_V1, key]]));
  }

  if (versioned.size > 0) {
    const writeVer = writeVersionFromEnv(env);
    const keys = new Map<number, Buffer>();
    for (const [v, b64] of versioned) {
      try {
        keys.set(v, decodeAndValidate(b64));
      } catch (err) {
        throw new Error(
          `cryptox.loadKeySetFromEnv(${ENV_VERSIONED_KEY_PREFIX}${v}): ${(err as Error).message}`,
        );
      }
    }
    if (!keys.has(writeVer)) {
      throw new Error(
        `cryptox.loadKeySetFromEnv: ${ENV_WRITE_VERSION}=${writeVer} but no ${ENV_VERSIONED_KEY_PREFIX}${writeVer} found`,
      );
    }
    return new KeySet(writeVer, keys);
  }

  throw new Error(
    `cryptox.loadKeySetFromEnv: neither ${ENV_SINGLE_KEY} nor ${ENV_VERSIONED_KEY_PREFIX}N are set`,
  );
}

function versionedKeysFromEnv(env: EnvLike): Map<number, string> {
  const out = new Map<number, string>();
  for (const name of Object.keys(env)) {
    if (!name.startsWith(ENV_VERSIONED_KEY_PREFIX)) continue;
    const suffix = name.slice(ENV_VERSIONED_KEY_PREFIX.length);
    // strict integer check — match Go strconv.Atoi semantics, reject
    // anything that isn't pure digits (avoids partial parses like "1a").
    if (!/^[0-9]+$/.test(suffix)) continue;
    const n = Number.parseInt(suffix, 10);
    if (n < 1 || n > 255) continue;
    const val = env[name] ?? '';
    if (val === '') continue;
    out.set(n, val);
  }
  return out;
}

function writeVersionFromEnv(env: EnvLike): number {
  const raw = env[ENV_WRITE_VERSION] ?? '';
  if (raw === '') {
    throw new Error(
      `${ENV_WRITE_VERSION} is required when using ${ENV_VERSIONED_KEY_PREFIX}N keys`,
    );
  }
  if (!/^[0-9]+$/.test(raw)) {
    throw new Error(`${ENV_WRITE_VERSION}=${JSON.stringify(raw)} is not a valid integer`);
  }
  const n = Number.parseInt(raw, 10);
  if (n < 1 || n > 255) {
    throw new Error(`${ENV_WRITE_VERSION}=${n} out of range (must be 1..255)`);
  }
  return n;
}

/**
 * Decode a base64-encoded key (standard or URL-safe) and verify it's
 * exactly 32 bytes (AES-256). Whitespace tolerant.
 */
function decodeAndValidate(b64: string): Buffer {
  const trimmed = b64.trim();
  // Buffer.from with 'base64' accepts both standard and URL-safe
  // alphabets (the Node implementation normalizes - → +, _ → /). It
  // does NOT throw on invalid chars; instead it silently truncates,
  // which is why we validate the resulting length.
  let decoded: Buffer;
  try {
    decoded = Buffer.from(trimmed, 'base64');
  } catch (err) {
    throw new Error(`base64 decode: ${(err as Error).message}`);
  }
  if (decoded.length !== KEY_LEN) {
    throw new CryptoxError(
      ErrInvalidKeyLength.code,
      `${ErrInvalidKeyLength.message}: got ${decoded.length} bytes`,
    );
  }
  return decoded;
}
