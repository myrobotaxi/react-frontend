/**
 * Unit tests for `src/lib/account-encryption.ts` — the dual-write /
 * dual-read helpers that bridge OAuth-token columns onto the cryptox
 * package during the MYR-62 rollout.
 *
 * Coverage:
 *   - readAccountToken prefers *_enc and decrypts it
 *   - readAccountToken falls back to plaintext when *_enc is null/empty
 *   - buildEncryptedAccountWrite produces ciphertext for non-empty fields
 *   - buildEncryptedAccountWrite preserves null/undefined semantics
 *   - empty-string inputs clear the *_enc column (cryptox sentinel parity)
 */

import { Buffer } from 'node:buffer';

import { afterEach, beforeEach, describe, it, expect } from 'vitest';

import {
  __resetEncryptor,
  buildEncryptedAccountWrite,
  readAccountToken,
  type AccountTokenFields,
} from '@/lib/account-encryption';
import { KEY_LEN } from '@/lib/cryptox';

const TEST_KEY_B64 = Buffer.alloc(KEY_LEN, 0x42).toString('base64');

beforeEach(() => {
  process.env.ENCRYPTION_KEY = TEST_KEY_B64;
  __resetEncryptor();
});

afterEach(() => {
  delete process.env.ENCRYPTION_KEY;
  __resetEncryptor();
});

describe('buildEncryptedAccountWrite', () => {
  it('encrypts every non-empty token into its shadow column', () => {
    const dual = buildEncryptedAccountWrite({
      access_token: 'access-abc',
      refresh_token: 'refresh-xyz',
      id_token: 'id-789',
    });

    expect(dual.access_token).toEqual('access-abc');
    expect(dual.refresh_token).toEqual('refresh-xyz');
    expect(dual.id_token).toEqual('id-789');

    expect(typeof dual.access_token_enc).toEqual('string');
    expect(typeof dual.refresh_token_enc).toEqual('string');
    expect(typeof dual.id_token_enc).toEqual('string');

    // Sanity: the ciphertext is base64 of >= 29 bytes (MIN_CIPHERTEXT_LEN).
    expect(
      Buffer.from(dual.access_token_enc as string, 'base64').length,
    ).toBeGreaterThanOrEqual(29);
  });

  it('preserves undefined as "leave column unchanged"', () => {
    const dual = buildEncryptedAccountWrite({});
    expect(dual.access_token).toBeUndefined();
    expect(dual.access_token_enc).toBeUndefined();
    expect(dual.refresh_token_enc).toBeUndefined();
    expect(dual.id_token_enc).toBeUndefined();
  });

  it('treats null as "clear both plaintext and shadow"', () => {
    const dual = buildEncryptedAccountWrite({
      access_token: null,
      refresh_token: null,
      id_token: null,
    });
    expect(dual.access_token).toBeNull();
    expect(dual.access_token_enc).toBeNull();
    expect(dual.refresh_token).toBeNull();
    expect(dual.refresh_token_enc).toBeNull();
    expect(dual.id_token).toBeNull();
    expect(dual.id_token_enc).toBeNull();
  });

  it('treats empty string as "no value" (clears *_enc to NULL)', () => {
    const dual = buildEncryptedAccountWrite({
      access_token: '',
      refresh_token: '',
      id_token: '',
    });
    // Plaintext column gets the empty string passed through (caller
    // chose to write ""), but the *_enc column is nulled out so the
    // dual-read fallback path does the right thing.
    expect(dual.access_token).toEqual('');
    expect(dual.access_token_enc).toBeNull();
  });
});

describe('readAccountToken', () => {
  it('decrypts the *_enc column when present', () => {
    const dual = buildEncryptedAccountWrite({
      access_token: 'real-access-token',
    });
    const row: AccountTokenFields = {
      // simulate a row where the dual-write happened
      access_token: 'real-access-token',
      access_token_enc: dual.access_token_enc as string,
    };
    expect(readAccountToken(row, 'access_token')).toEqual('real-access-token');
  });

  it('falls back to the plaintext column when *_enc is null', () => {
    const row: AccountTokenFields = {
      access_token: 'legacy-plaintext-only',
      access_token_enc: null,
    };
    expect(readAccountToken(row, 'access_token')).toEqual(
      'legacy-plaintext-only',
    );
  });

  it('falls back to plaintext when *_enc is missing entirely', () => {
    const row: AccountTokenFields = {
      access_token: 'legacy-row',
    };
    expect(readAccountToken(row, 'access_token')).toEqual('legacy-row');
  });

  it('returns null when neither column has a value', () => {
    expect(readAccountToken({}, 'access_token')).toBeNull();
    expect(
      readAccountToken({ access_token: null, access_token_enc: null }, 'access_token'),
    ).toBeNull();
  });

  it('handles each of access_token / refresh_token / id_token independently', () => {
    const dual = buildEncryptedAccountWrite({
      access_token: 'A',
      refresh_token: 'R',
      id_token: 'I',
    });
    const row: AccountTokenFields = {
      access_token_enc: dual.access_token_enc as string,
      refresh_token_enc: dual.refresh_token_enc as string,
      id_token_enc: dual.id_token_enc as string,
    };
    expect(readAccountToken(row, 'access_token')).toEqual('A');
    expect(readAccountToken(row, 'refresh_token')).toEqual('R');
    expect(readAccountToken(row, 'id_token')).toEqual('I');
  });

  it('prefers *_enc over a stale plaintext column (proves rollout direction)', () => {
    // After backfill, *_enc holds the canonical value. If the
    // plaintext column ever drifts (e.g., a partial write), reads
    // should still return the *_enc value.
    const dual = buildEncryptedAccountWrite({
      access_token: 'CANONICAL',
    });
    const row: AccountTokenFields = {
      access_token: 'STALE-DRIFT',
      access_token_enc: dual.access_token_enc as string,
    };
    expect(readAccountToken(row, 'access_token')).toEqual('CANONICAL');
  });
});
