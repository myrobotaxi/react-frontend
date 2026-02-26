import { SettingsScreen } from '@/features/settings';

import type { UserSettings } from '@/features/settings';

/** Mock settings for development — will be replaced with server data. */
const MOCK_SETTINGS: UserSettings = {
  name: 'Thomas Nandola',
  email: 'thomas@example.com',
  teslaLinked: true,
  teslaVehicleName: "Thomas's Model Y",
  notifications: {
    driveStarted: true,
    driveCompleted: true,
    chargingComplete: false,
    viewerJoined: true,
  },
};

/**
 * Settings page — user preferences and Tesla account linking.
 * Fetches settings data and passes to SettingsScreen.
 */
export default function SettingsPage() {
  return <SettingsScreen settings={MOCK_SETTINGS} />;
}
