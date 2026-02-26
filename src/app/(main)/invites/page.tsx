import { InvitesScreen } from '@/features/invites';
import { MOCK_INVITES } from '@/lib/mock-data';

/**
 * Invites page — invite management screen.
 * Fetches invite data and passes to InvitesScreen.
 */
export default function InvitesPage() {
  return <InvitesScreen invites={MOCK_INVITES} />;
}
