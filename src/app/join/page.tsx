// Imported by path rather than through the invites barrel: that barrel also
// re-exports the invite server actions, which pull in Prisma. This page must
// stay free of any backend dependency.
import { JoinInviteScreen } from '@/features/invites/components/JoinInviteScreen';

/**
 * Codeless invite landing — `/join`.
 *
 * Reached by anyone who trims the code off the link, and the destination the
 * lockdown proxy sends every other route to. Shows branding, the TestFlight
 * link, and the steps; no code section.
 */
export default function JoinPage() {
  return <JoinInviteScreen code={null} />;
}
