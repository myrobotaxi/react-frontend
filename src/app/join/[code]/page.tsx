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
 * neither is sent to an API, validated, or logged. An unparseable segment falls
 * back to the codeless copy and still returns 200 (a 404 would tell a link
 * scraper which codes are well-formed); an unparseable `from` falls back to the
 * generic heading.
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
