// Imported by path rather than through the invites barrel: that barrel also
// re-exports the invite server actions, which pull in Prisma. This page must
// stay free of any backend dependency.
import { JoinInviteScreen } from '@/features/invites/components/JoinInviteScreen';
import { sanitizeInviteCode } from '@/lib/invite-code';

interface JoinCodePageProps {
  params: Promise<{ code: string }>;
}

/**
 * Invite landing with a code — `/join/{CODE}`.
 *
 * Rendering is a pure function of the URL segment: the code is sanitized and
 * echoed back, never sent to an API, never validated, never logged. An
 * unparseable segment falls back to the codeless copy and still returns 200
 * (a 404 would tell a link scraper which codes are well-formed).
 */
export default async function JoinCodePage({ params }: JoinCodePageProps) {
  const { code } = await params;

  return <JoinInviteScreen code={sanitizeInviteCode(code)} />;
}
