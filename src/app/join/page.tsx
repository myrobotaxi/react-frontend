import type { Metadata } from 'next';

// Imported by path rather than through the invites barrel: that barrel also
// re-exports the invite server actions, which pull in Prisma. This page must
// stay free of any backend dependency.
import { JoinInviteScreen } from '@/features/invites/components/JoinInviteScreen';

import { buildJoinMetadata } from './join-metadata';

/**
 * Link-preview tags for `/join`.
 *
 * ALWAYS GENERIC — the codeless route no longer reads `?from=` (MYR-368).
 * Names on a join link are trusted because a signature covers them, and a
 * signature covers the CODE; with no code there is nothing to verify against,
 * so a name here would be exactly the crafted-URL-into-a-cached-og:title
 * problem that MYR-368 closed on the route next door. It renders the no-names
 * copy instead.
 */
export function generateMetadata(): Metadata {
  return buildJoinMetadata(null, null);
}

/**
 * Codeless invite landing — `/join`.
 *
 * RETIRED IN PRODUCTION. It used to be the lockdown's redirect target, which
 * meant every visitor to the bare domain was handed the invite experience;
 * invite links are uniquely generated and the page behind one should be too, so
 * the lockdown now sends `/join` to the coming-soon teaser at `/` along with
 * every other codeless route (see `lib/lockdown.ts`). Only `/join/{CODE}`
 * renders an invite.
 *
 * The route itself stays: like the rest of the retired app it is gated by
 * policy, not deleted, so reverting the lockdown restores it — and it is what
 * the Playwright suite renders with the lockdown switched off.
 */
export default function JoinPage() {
  return <JoinInviteScreen code={null} />;
}
