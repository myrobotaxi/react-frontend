/**
 * Signed invite links (MYR-368).
 *
 * A join link now carries a detached Ed25519 signature:
 *
 *   /join/{CODE}?k={keyId}.{expUnix}.{sigB64url}&from={From}&to={To}
 *
 * The signature covers the code, an expiry, and both display names, so the
 * landing page can tell a link this project minted from one somebody typed —
 * WITHOUT asking a database whether the code exists.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * STILL NO ORACLE. Do not "improve" this by looking the code up.
 *
 * The no-oracle stance from `lib/lockdown.ts` and `app/join/[code]/page.tsx` is
 * unchanged and this module extends it rather than replacing it. Verification
 * here is a pure function of the URL and a compiled-in public key: no network,
 * no Prisma, no I/O of any kind. A valid signature says "we minted this link",
 * never "this code is live" — an invite can be signed, unexpired, and already
 * redeemed or revoked, and this page will still render it. Redemption is the
 * app's job, after the recipient installs it.
 *
 * What the signature buys is the opposite direction: a link we did NOT mint no
 * longer renders. That is what makes the names in `?from=`/`?to=` safe to put
 * in a page title and an og:title (see `app/join/join-metadata.ts`) — they are
 * covered by the signature, so a stranger cannot craft a URL that makes a
 * cached preview card say whatever they like.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * No React code — importable from server components, `generateMetadata`, and
 * route handlers.
 */

/**
 * Production Ed25519 verification key, base64 (standard alphabet), raw 32 bytes.
 *
 * A STATIC CONSTANT on purpose: this is public key material, it is not a secret,
 * and reading it from an env var would mean a missing or mistyped variable
 * silently turning every invite link into a redirect. Compiled in, the only way
 * to break verification is to change this file.
 *
 * Derived from the signing seed held as a Fly secret by the backend, via:
 *
 *     ops invite-link public-key
 *
 * Key id "1". Rotating the seed means a new key id and a new entry here; the
 * `k` parameter carries the id precisely so both can be accepted during a
 * rollover, and an unrecognised id is rejected rather than tried against
 * whatever key happens to be current.
 */
export const INVITE_LINK_PUBLIC_KEY_B64 = 'fPMNjXE+zzvuZ0asiKTNRpG3oG9ixVMXOv9CchOJ+U0=';

/** The key id the production key is published under. */
export const INVITE_LINK_KEY_ID = '1';

/** Raw Ed25519 signature length, in bytes. */
const SIGNATURE_BYTE_LENGTH = 64;

/** Raw Ed25519 public key length, in bytes. */
const PUBLIC_KEY_BYTE_LENGTH = 32;

/** `{keyId}.{expUnix}.{sigB64url}` — three fields, exactly two dots. */
const SIGNATURE_PARAM_PATTERN = /^([A-Za-z0-9]+)\.([0-9]+)\.([A-Za-z0-9_-]+)$/;

/**
 * Environment variable that swaps in a test verification key.
 *
 * READ ONLY OUTSIDE PRODUCTION (see `invitePublicKeyB64`). It exists so the
 * Playwright suite can mint genuinely-signed links with a throwaway keypair
 * rather than asserting on a fixture that expires — end-to-end coverage of the
 * verifier needs links this build accepts, and the production signing seed is a
 * Fly secret that no test process should ever hold.
 */
const TEST_PUBLIC_KEY_ENV = 'INVITE_LINK_TEST_PUBLIC_KEY';

/**
 * The key this build verifies against.
 *
 * Production always gets the compiled-in constant: the override is gated on
 * `NODE_ENV !== 'production'`, which Next sets for `next build` and for every
 * Vercel deployment, so a variable set by accident (or by someone who should
 * not have set it) cannot weaken a deployed build.
 */
export function invitePublicKeyB64(): string {
  if (process.env.NODE_ENV !== 'production') {
    const override = process.env[TEST_PUBLIC_KEY_ENV];
    if (override) return override;
  }

  return INVITE_LINK_PUBLIC_KEY_B64;
}

/**
 * The exact bytes the backend signs.
 *
 * FIVE fields, ALWAYS four colons — an absent name is an empty field, never a
 * dropped one, so `join:RBO246:1785942245::` and `join:RBO246:1785942245:A:B`
 * can never collide with each other or with any shorter form. Both signer and
 * verifier build this string the same way or nothing verifies; it is written
 * out here rather than assembled at the call site so there is one place to read.
 *
 * `code` is the path segment AS IT APPEARS IN THE URL. The server mints links
 * with an uppercase code and signs that, so a link whose path has been
 * lower-cased in transit (messaging apps do this) will FAIL verification even
 * though the shape gate in `lib/invite-code.ts` would happily upper-case it for
 * rendering. That is accepted, not a bug: canonicalising before verifying means
 * deciding what the signer "meant", and a signature that covers a value the
 * verifier then transforms is not covering it. Such a link redirects to `/`,
 * and the recipient can ask the sender to resend.
 *
 * `from` and `to` are the query values AS-IS — exactly what the URL carried,
 * before `sanitizeInviterName` sees them. Sanitizing first would, again, verify
 * something other than what was signed.
 */
export function buildInviteSignaturePayload(
  code: string,
  expUnix: number,
  from: string,
  to: string,
): string {
  return `join:${code}:${expUnix}:${from}:${to}`;
}

/** The three fields of a parsed `k` parameter. */
interface ParsedSignatureParam {
  keyId: string;
  expUnix: number;
  signature: Uint8Array<ArrayBuffer>;
}

/** Decodes unpadded base64url into bytes, or `null` if it is not valid base64. */
function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    value.length + ((4 - (value.length % 4)) % 4),
    '=',
  );

  try {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

/** Decodes standard base64 into bytes, or `null` if it is not valid base64. */
function decodeBase64(value: string): Uint8Array<ArrayBuffer> | null {
  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

/**
 * Splits `k` into its three fields.
 *
 * Structural only — says nothing about whether the signature is good. Anything
 * that is not exactly `{keyId}.{expUnix}.{sigB64url}`, with a 64-byte
 * signature, is `null`: a repeated parameter (which arrives as an array), a
 * missing one, extra dots, a non-numeric expiry, a truncated signature.
 */
export function parseInviteSignatureParam(
  raw: string | string[] | undefined | null,
): ParsedSignatureParam | null {
  if (typeof raw !== 'string') return null;

  const match = SIGNATURE_PARAM_PATTERN.exec(raw);
  if (!match) return null;

  const [, keyId, expRaw, sigRaw] = match;

  const expUnix = Number(expRaw);
  if (!Number.isSafeInteger(expUnix)) return null;

  const signature = decodeBase64Url(sigRaw);
  if (!signature || signature.length !== SIGNATURE_BYTE_LENGTH) return null;

  return { keyId, expUnix, signature };
}

/**
 * A single query value as the payload sees it.
 *
 * An omitted parameter is the empty string, because that is what the signer
 * put in the payload for a name it did not have. A REPEATED parameter arrives
 * as an array and is `null` — two answers to "who is this from" is not a value
 * the signer could have signed, and picking one of them would let an attacker
 * append a second `from=` to a legitimately signed link and choose which one
 * the page reads.
 */
function singleValue(raw: string | string[] | undefined | null): string | null {
  if (raw === undefined || raw === null) return '';
  if (typeof raw === 'string') return raw;
  return null;
}

/** Everything `verifyInviteLink` needs, straight off the URL. */
export interface InviteLinkVerificationInput {
  /** Path segment exactly as it appears in the URL — NOT upper-cased. */
  code: string;
  /** The `k` search param, raw. */
  k: string | string[] | undefined | null;
  /** The `from` search param, raw. Omitted is fine; repeated is not. */
  from?: string | string[] | undefined | null;
  /** The `to` search param, raw. Omitted is fine; repeated is not. */
  to?: string | string[] | undefined | null;
}

/** Test seams. Both default to the values a real request is judged against. */
export interface InviteLinkVerificationOptions {
  /** Seconds since the epoch. Defaults to the wall clock. */
  nowUnix?: number;
  /** Base64 (standard) raw public key. Defaults to `invitePublicKeyB64()`. */
  publicKeyB64?: string;
}

/**
 * Whether a join link was minted by us, is unexpired, and has not been edited.
 *
 * Returns a plain boolean: the caller redirects on `false` and MUST NOT
 * distinguish the reasons. A page that said "expired" for one bad link and
 * "not found" for another would hand back exactly the information the flat
 * redirect is there to withhold.
 *
 * Rejects, all the same way:
 *  • missing, repeated, or malformed `k`
 *  • a key id this build does not know
 *  • an expiry that has passed (`expUnix < now`; equal is still valid)
 *  • a repeated `from` or `to`
 *  • a signature that does not verify — which covers a tampered code, expiry,
 *    or either name, a swapped pair of names, and a signature from another key
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FAILS CLOSED. This is the property to preserve above all others here.
 *
 * If the key cannot be decoded, is the wrong length, cannot be imported, or the
 * runtime has no usable Ed25519 at all, this returns `false` — so EVERY link
 * redirects. That is a total, immediately visible outage of the invite surface,
 * and that is the point: the alternative failure mode is every link rendering,
 * which looks exactly like a working site while the signature check is silently
 * off. One gets noticed in minutes; the other gets noticed by an attacker.
 *
 * Two things enforce it structurally, and both must stay:
 *
 *  1. `true` is returned from EXACTLY ONE place, and only on a strict `=== true`
 *     from `crypto.subtle.verify`. A runtime that returned some other truthy
 *     value cannot be mistaken for a verified signature.
 *  2. Every other path — including anything thrown out of WebCrypto, and
 *     including `crypto.subtle` being absent entirely — lands on the single
 *     `return false` below.
 *
 * So this never throws. A landing page that 500s on a hostile URL is a worse
 * failure than one that redirects, and a 500 is not a rejection the caller can
 * act on.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function verifyInviteLink(
  input: InviteLinkVerificationInput,
  options: InviteLinkVerificationOptions = {},
): Promise<boolean> {
  try {
    const parsed = parseInviteSignatureParam(input.k);
    if (!parsed) return false;

    if (parsed.keyId !== INVITE_LINK_KEY_ID) return false;

    const nowUnix = options.nowUnix ?? Math.floor(Date.now() / 1_000);
    if (parsed.expUnix < nowUnix) return false;

    const from = singleValue(input.from);
    const to = singleValue(input.to);
    if (from === null || to === null) return false;

    const publicKeyBytes = decodeBase64(options.publicKeyB64 ?? invitePublicKeyB64());
    if (!publicKeyBytes || publicKeyBytes.length !== PUBLIC_KEY_BYTE_LENGTH) return false;

    const payload = buildInviteSignaturePayload(input.code, parsed.expUnix, from, to);

    const key = await crypto.subtle.importKey(
      'raw',
      publicKeyBytes,
      { name: 'Ed25519' },
      false,
      ['verify'],
    );

    const verified = await crypto.subtle.verify(
      { name: 'Ed25519' },
      key,
      parsed.signature,
      new TextEncoder().encode(payload),
    );

    // The only `true` in this function, and it is strict on purpose.
    return verified === true;
  } catch {
    return false;
  }
}
