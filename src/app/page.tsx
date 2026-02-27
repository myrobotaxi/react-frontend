import { HomeScreen } from '@/features/vehicles';
import { MOCK_VEHICLES, MOCK_DRIVES } from '@/lib/mock-data';
import { BottomNav } from '@/components/layout/BottomNav';

/**
 * Root route — renders the Home screen with map.
 * Auth gate will redirect unauthenticated users to /signin once NextAuth is integrated.
 */
export default function RootPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <HomeScreen vehicles={MOCK_VEHICLES} drives={MOCK_DRIVES} />
      <BottomNav />
    </div>
  );
}
