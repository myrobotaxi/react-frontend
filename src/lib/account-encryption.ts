/**
 * Account-token encryption helpers (MYR-62 Phase 1 — TS side).
 *
 * Centralises the dual-write/dual-read pattern for the encrypted
 * shadow columns added to `Account` (`access_token_enc`,
 * `refresh_token_enc`, `id_token_enc`). Call sites should never reach
 * past these helpers to read/write the columns directly — that's how
 * we keep the rollout reversible and ensure the *_enc columns get
 * populated on every code path that touches OAuth tokens.
 *
 * Rollout phases:
 *
 *   1. Dual-write (this PR — MYR-62 Phase 1):
 *      - Writes go to BOTH `<col>` (plaintext) AND `<col>_enc` (ciphertext).
 *      - Reads prefer `<col>_enc`, fall back to `<col>` for legacy rows.
 *
 *   2. Backfill (separate post-rollout issue): one-shot script encrypts
 *      every plaintext value into its `*_enc` shadow.
 *
 *   3. Read-flip (separate post-rollout issue): reads stop falling
 *      back; writes still dual-write.
 *
 *   4. Drop plaintext (final post-rollout issue): drop the plaintext
 *      columns and stop writing them.
 *
 * The Encryptor is constructed lazily so a misconfigured environment
 * surfaces as an error on the first OAuth login (loud, scoped) instead
 * of a module-load crash that takes down all unrelated routes.
 */

import {
  type Encryptor,
  loadKeySetFromEnv,
  newEncryptor,
} from '@/lib/cryptox';

let cachedEncryptor: Encryptor | null = null;

/**
 * Returns the process-wide Encryptor. Loads the KeySet from env on
 * first call. Throws a descriptive error if env is misconfigured.
 *
 * Exposed for tests so they can clear the cache (`__resetEncryptor`)
 * after mutating `process.env`.
 */
export function getEncryptor(): Encryptor {
  if (cachedEncryptor === null) {
    const ks = loadKeySetFromEnv();
    cachedEncryptor = newEncryptor(ks);
  }
  return cachedEncryptor;
}

/** Test-only: clear the cached Encryptor so the next call re-reads env. */
export function __resetEncryptor(): void {
  cachedEncryptor = null;
}

/**
 * The slice of an `Account` row's token fields used by both readers
 * and writers. We accept partial data (NextAuth supplies token strings
 * as `string | null | undefined` depending on provider) and emit
 * normalised `string | null` results.
 */
export interface AccountTokenFields {
  access_token?: string | null;
  refresh_token?: string | null;
  id_token?: string | null;
  access_token_enc?: string | null;
  refresh_token_enc?: string | null;
  id_token_enc?: string | null;
}

/**
 * Resolve a single OAuth token by reading the `*_enc` column first
 * and falling back to the plaintext column. Returns `null` for
 * absent/empty values. Used by every consumer of `Account` token
 * fields during the dual-read window.
 */
export function readAccountToken(
  row: AccountTokenFields,
  field: 'access_token' | 'refresh_token' | 'id_token',
): string | null {
  const encField = `${field}_enc` as
    | 'access_token_enc'
    | 'refresh_token_enc'
    | 'id_token_enc';
  const enc = row[encField];
  if (enc) {
    // Empty-string sentinel preserved by decryptString — but for the
    // dual-write window we treat empty *_enc as "fall back to
    // plaintext" since legacy rows have NULL/undefined here, not "".
    const enc_ = getEncryptor().decryptString(enc);
    if (enc_ !== '') return enc_;
  }
  const pt = row[field];
  return pt ?? null;
}

/**
 * Build the dual-write data payload for an Account create or update.
 * Given a partial set of plaintext token fields, returns a payload
 * containing both the plaintext columns AND their encrypted shadows
 * (with `null` shadows for absent inputs, so an explicit
 * "clear this token" still nulls out the *_enc column).
 *
 * Empty-string inputs are treated as "absent" to align with the
 * cryptox empty-string sentinel — the *_enc column is set to `null`
 * rather than the encrypted form of `""`.
 */
export function buildEncryptedAccountWrite(
  fields: Pick<
    AccountTokenFields,
    'access_token' | 'refresh_token' | 'id_token'
  >,
): {
  access_token: string | null | undefined;
  refresh_token: string | null | undefined;
  id_token: string | null | undefined;
  access_token_enc: string | null | undefined;
  refresh_token_enc: string | null | undefined;
  id_token_enc: string | null | undefined;
} {
  const enc = getEncryptor();

  const encOf = (
    v: string | null | undefined,
  ): string | null | undefined => {
    // `undefined` → leave column untouched (Prisma drops undefined).
    // `null`      → explicitly clear both columns.
    // ""          → treat as "no value", clear shadow column.
    // string      → encrypt into the shadow column.
    if (v === undefined) return undefined;
    if (v === null || v === '') return null;
    return enc.encryptString(v);
  };

  return {
    access_token: fields.access_token,
    refresh_token: fields.refresh_token,
    id_token: fields.id_token,
    access_token_enc: encOf(fields.access_token),
    refresh_token_enc: encOf(fields.refresh_token),
    id_token_enc: encOf(fields.id_token),
  };
}
