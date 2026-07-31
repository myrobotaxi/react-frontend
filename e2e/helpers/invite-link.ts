import { createPrivateKey, createPublicKey, sign } from 'node:crypto';

/**
 * Signed-join-link fixtures for the Playwright suite (MYR-368).
 *
 * The page under test rejects any link it cannot verify, so an end-to-end suite
 * that cannot SIGN cannot reach the invite page at all — every spec would
 * collapse into an assertion that `/join/{CODE}` redirects to `/`. So this
 * module mints real links with a throwaway keypair, and the dev server the
 * suite starts is told to verify against its public half (see
 * `playwright.config.ts` → `INVITE_LINK_TEST_PUBLIC_KEY`, which
 * `lib/invite-signature.ts` reads only when `NODE_ENV !== 'production'`).
 *
 * TWO PROPERTIES MAKE THIS SAFE TO CHECK IN:
 *
 *  1. The seed below signs NOTHING real. It is 32 bytes of test data; the
 *     production signing seed is a Fly secret and no test process holds it.
 *  2. The keypair is DERIVED, not stored. The config and the specs both compute
 *     it from the same constant, so the public key the server trusts and the
 *     private key the specs sign with cannot drift apart.
 *
 * The reference vectors published with the ticket are unit-tested instead
 * (`__tests__/lib/invite-signature.test.ts`), where the clock is injectable.
 * They carry a fixed expiry and would start failing on a wall clock; links
 * minted here get a far-future one.
 */

/** Throwaway Ed25519 seed. Signs test links and nothing else. */
const TEST_SEED_HEX = '4d59524f424f5441584920453245204a4f494e204c494e4b205445535420534b';

/** DER prefix for a PKCS#8-wrapped raw Ed25519 seed. */
const PKCS8_ED25519_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex');

const privateKey = createPrivateKey({
  key: Buffer.concat([PKCS8_ED25519_PREFIX, Buffer.from(TEST_SEED_HEX, 'hex')]),
  format: 'der',
  type: 'pkcs8',
});

/**
 * The public half, base64, raw 32 bytes — the form
 * `lib/invite-signature.ts` imports.
 *
 * An SPKI export is 44 bytes: a 12-byte algorithm header, then the key.
 */
export const TEST_INVITE_PUBLIC_KEY_B64 = createPublicKey(privateKey)
  .export({ format: 'der', type: 'spki' })
  .subarray(-32)
  .toString('base64');

/**
 * The key id the app accepts. A link minted under any other id is rejected
 * before the signature is even checked, which is one of the cases the specs
 * exercise.
 */
export const TEST_INVITE_KEY_ID = '1';

/** Far enough out that no spec fails because time passed. */
const DEFAULT_TTL_SECONDS = 365 * 24 * 60 * 60;

/** What a link may carry. Everything but the code is optional. */
export interface SignedJoinLinkOptions {
  /** Sender's name for `?from=`. Omitted means the parameter is absent. */
  from?: string;
  /** Recipient's name for `?to=`. Omitted means the parameter is absent. */
  to?: string;
  /** Absolute expiry, seconds since the epoch. Defaults to a year out. */
  expUnix?: number;
  /** Key id to publish in `k`. Defaults to the one the app accepts. */
  keyId?: string;
}

/** The exact payload the app rebuilds and verifies. Kept in step by the specs. */
function payload(code: string, expUnix: number, from: string, to: string): string {
  return `join:${code}:${expUnix}:${from}:${to}`;
}

/**
 * Mints `/join/{CODE}?k=…&from=…&to=…` with a valid signature.
 *
 * The code is signed AS PASSED. Pass a lowercase one and the link will be
 * signed over the lowercase form — which is a different link from the one the
 * server would mint, and the suite uses that to pin the documented behaviour
 * that a lower-cased path fails verification.
 */
export function signedJoinLink(code: string, options: SignedJoinLinkOptions = {}): string {
  const expUnix = options.expUnix ?? Math.floor(Date.now() / 1_000) + DEFAULT_TTL_SECONDS;
  const from = options.from ?? '';
  const to = options.to ?? '';

  const signature = sign(null, Buffer.from(payload(code, expUnix, from, to), 'utf8'), privateKey)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const query = new URLSearchParams({
    k: `${options.keyId ?? TEST_INVITE_KEY_ID}.${expUnix}.${signature}`,
  });
  if (options.from !== undefined) query.set('from', options.from);
  if (options.to !== undefined) query.set('to', options.to);

  return `/join/${code}?${query.toString()}`;
}

/**
 * Replaces one query parameter on an already-signed link, leaving `k` alone.
 *
 * The tamper primitive: the signature stays valid for what it covered, and the
 * URL no longer matches it.
 */
export function tamper(link: string, param: string, value: string): string {
  const url = new URL(link, 'http://localhost');
  url.searchParams.set(param, value);

  return `${url.pathname}${url.search}`;
}
