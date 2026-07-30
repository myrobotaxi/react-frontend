import type { Metadata } from 'next';

// Imported by path rather than through the invites barrel: that barrel also
// re-exports the invite server actions, which pull in Prisma. This page must
// stay free of any backend dependency.
import { JoinInviteScreen } from '@/features/invites/components/JoinInviteScreen';
import { sanitizeInviterName } from '@/lib/inviter-name';

import { buildJoinMetadata } from './join-metadata';

interface JoinPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Link-preview tags for `/join?from={Name}` (MYR-359).
 *
 * The codeless route reads the name for the same reason the code-carrying one
 * does: a recipient who trimmed the code off the link, or who was sent the
 * landing page directly, still sees a card — and a card that names the sender is
 * the difference between "someone shared something" and an invitation.
 */
export async function generateMetadata({ searchParams }: JoinPageProps): Promise<Metadata> {
  const { from } = await searchParams;

  return buildJoinMetadata(sanitizeInviterName(from));
}

/**
 * Codeless invite landing — `/join`.
 *
 * Reached by anyone who trims the code off the link, and the destination the
 * lockdown proxy sends every other route to. Shows branding, the TestFlight
 * link, and the steps; no code section.
 */
export default async function JoinPage({ searchParams }: JoinPageProps) {
  const { from } = await searchParams;

  return <JoinInviteScreen code={null} inviterName={sanitizeInviterName(from)} />;
}
