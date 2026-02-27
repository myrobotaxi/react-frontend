import { DriveHistoryScreen } from '@/features/drives';
import { MOCK_VEHICLES, MOCK_DRIVES } from '@/lib/mock-data';

/**
 * Drive history page — list of completed drives.
 * Fetches vehicle + drive data and passes to DriveHistoryScreen.
 */
export default function DrivesPage() {
  const vehicle = MOCK_VEHICLES[0];
  const drives = MOCK_DRIVES.filter((d) => d.vehicleId === vehicle.id);

  return <DriveHistoryScreen vehicle={vehicle} drives={drives} />;
}
