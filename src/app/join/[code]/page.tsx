import type { Metadata } from 'next';

// Imported by path rather than through the invites barrel: that barrel also
// re-exports the invite server actions, which pull in Prisma. This page must
// stay free of any backend dependency.
import { JoinInviteScreen } from '@/features/invites/components/JoinInviteScreen';
import { sanitizeInviteCode } from '@/lib/invite-code';
import { sanitizeInviterName } from '@/lib/inviter-name';

import { buildJoinMetadata } from '../join-metadata';

interface JoinCodePageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Link-preview tags for `/join/{CODE}?from={Name}` (MYR-359).
 *
 * SERVER-RENDERED, which is the whole point: the card a recipient sees is built
 * by a scraper that never runs the page's JavaScript, so a name applied on the
 * client would be invisible exactly where it matters.
 */
export async function generateMetadata({ searchParams }: JoinCodePageProps): Promise<Metadata> {
  const { from } = await searchParams;

  return buildJoinMetadata(sanitizeInviterName(from));
}

/**
 * Invite landing with a code — `/join/{CODE}`.
 *
 * Rendering is a pure function of the URL: the code is sanitized and echoed
 * back, the sender's name is sanitized and used only to title the page, and
 * neither is sent to an API, validated, or logged. An unparseable `from` falls
 * back to the generic heading.
 *
 * THIS PAGE DOES NOT CHECK WHETHER THE CODE IS REAL, and must not start.
 * Everything that reaches it in production is already code-SHAPED — the
 * lockdown turns anything else away before it gets here (`lib/lockdown.ts`) —
 * and shape is where the checking stops. A page that answered differently for a
 * real code than for a well-formed fake one would be an enumeration oracle for
 * what is a bearer credential; every well-formed segment gets the same 200 and
 * the same page. The app validates and redeems, after the recipient installs
 * it.
 *
 * The sanitizer's `null` branch — generic copy, no code, still 200 — therefore
 * covers only what the shape gate cannot: a run of the app with the lockdown
 * switched off, and whitespace-padded segments the gate rejects but the
 * sanitizer would trim. It is a fallback, not a validity check.
 */
export default async function JoinCodePage({ params, searchParams }: JoinCodePageProps) {
  const { code } = await params;
  const { from } = await searchParams;

  return (
    <JoinInviteScreen
      code={sanitizeInviteCode(code)}
      inviterName={sanitizeInviterName(from)}
    />
  );
}
