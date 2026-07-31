import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

// Imported by path rather than through the invites barrel: that barrel also
// re-exports the invite server actions, which pull in Prisma. This page must
// stay free of any backend dependency.
import { JoinInviteScreen } from '@/features/invites/components/JoinInviteScreen';
import { ROOT_ROUTE } from '@/lib/constants';
import { sanitizeInviteCode } from '@/lib/invite-code';
import { verifyInviteLink } from '@/lib/invite-signature';
import { sanitizeInviterName, sanitizeRecipientName } from '@/lib/inviter-name';

import { buildJoinMetadata } from '../join-metadata';

interface JoinCodePageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/** What both `generateMetadata` and the page itself need out of a URL. */
interface VerifiedLink {
  inviterName: string | null;
  recipientName: string | null;
}

/**
 * Verify once per request, for both entry points.
 *
 * `cache()` is what makes that true: Next calls `generateMetadata` and the
 * component separately, and without deduping a single request would run two
 * signature verifications and could — if the clock ticked past the expiry
 * between them — render a page whose head and body disagreed. The arguments are
 * primitives so the memo key is stable; `searchParams` is a fresh object each
 * call and would never hit.
 *
 * Returns `null` for every rejection, with the reason discarded. See
 * `verifyInviteLink`: the caller must not be able to tell an expired link from
 * a forged one.
 */
const verifyLink = cache(
  async (
    code: string,
    k: string | string[] | undefined,
    from: string | string[] | undefined,
    to: string | string[] | undefined,
  ): Promise<VerifiedLink | null> => {
    const ok = await verifyInviteLink({ code, k, from, to });
    if (!ok) return null;

    // Sanitized even though the signature already covers these values —
    // defence in depth, and the reason `sanitizeInviterName` still exists. A
    // name that verified but is not name-SHAPED (a key rotation that outlived
    // this deploy, a signer that widened its alphabet before this side did)
    // falls back to the generic copy rather than rendering unfiltered into an
    // og:title.
    return {
      inviterName: sanitizeInviterName(from),
      recipientName: sanitizeRecipientName(to),
    };
  },
);

/**
 * Link-preview tags for `/join/{CODE}?k=…&from={Name}&to={Name}` (MYR-359, MYR-368).
 *
 * SERVER-RENDERED, which is the whole point: the card a recipient sees is built
 * by a scraper that never runs the page's JavaScript, so a name applied on the
 * client would be invisible exactly where it matters.
 *
 * An unverified link gets the generic card rather than a redirect — the page
 * below redirects, and that is the response a scraper actually receives. Next
 * may still resolve metadata for a request that is about to be redirected, and
 * this is what it resolves to.
 */
export async function generateMetadata({
  params,
  searchParams,
}: JoinCodePageProps): Promise<Metadata> {
  const { code } = await params;
  const { k, from, to } = await searchParams;

  const verified = await verifyLink(code, k, from, to);

  return buildJoinMetadata(verified?.inviterName ?? null, verified?.recipientName ?? null);
}

/**
 * Invite landing with a code — `/join/{CODE}?k={keyId}.{expUnix}.{sigB64url}`.
 *
 * Rendering is a pure function of the URL and a compiled-in public key. Nothing
 * here touches an API, a database, or a log.
 *
 * ── WHY THE SIGNATURE CHECK LIVES HERE, NOT IN THE PROXY ────────────────────
 * `proxy.ts` runs on the edge runtime, whose WebCrypto does not reliably offer
 * Ed25519 — the algorithm is a recent addition to the Web Crypto spec, Vercel's
 * supported-algorithm table for the Edge Runtime is no longer maintained, and a
 * verifier that throws in production while passing in `next dev` would fail
 * open or 500 on every invite link. This page is a Node.js-runtime server
 * component, where `crypto.subtle` Ed25519 support is guaranteed by the Node
 * version this project pins. Verifying here also means the check sits next to
 * the only consumer of its result — the names — instead of in a proxy that
 * would have to pass a trust decision downstream in a header.
 *
 * The shape gate in `lib/lockdown.ts` is unchanged and still runs first: it
 * turns away anything that is not code-SHAPED before a request reaches this
 * file, cheaply and synchronously. Shape gate in the proxy, signature here.
 *
 * ── STILL NOT AN ORACLE ─────────────────────────────────────────────────────
 * THIS PAGE STILL DOES NOT CHECK WHETHER THE CODE IS REAL, and must not start.
 * MYR-368 added a check on the LINK, not on the invite: a valid signature says
 * "we minted this URL", never "this code is live". A signed code that has been
 * redeemed, revoked, or was issued to somebody else renders exactly the same
 * page as one that is still open. Every well-formed signed link gets the same
 * 200, so the route cannot be walked to learn which codes exist — the app
 * validates and redeems, after the recipient installs it.
 *
 * What is new is the other direction. An UNSIGNED or badly-signed link — no
 * `k`, a key id we do not know, an expiry in the past, a tampered code or name,
 * a signature from another key — redirects to `/`, indistinguishably, the same
 * answer a malformed code already got from the lockdown. That is what makes the
 * names safe to put in a cached preview card: a stranger can no longer craft a
 * URL that renders.
 *
 * One accepted consequence: a link whose PATH was lower-cased in transit fails
 * verification, because the signed payload carries the code as the server
 * minted it (always uppercase) and canonicalising before verifying would mean
 * verifying something other than what was signed. Server-minted links always
 * carry an uppercase code, so this only affects a link somebody re-typed or a
 * client mangled. It redirects like any other bad signature; the sender resends.
 */
export default async function JoinCodePage({ params, searchParams }: JoinCodePageProps) {
  const { code } = await params;
  const { k, from, to } = await searchParams;

  const verified = await verifyLink(code, k, from, to);
  if (!verified) redirect(ROOT_ROUTE);

  return (
    <JoinInviteScreen
      code={sanitizeInviteCode(code)}
      inviterName={verified.inviterName}
      recipientName={verified.recipientName}
    />
  );
}
