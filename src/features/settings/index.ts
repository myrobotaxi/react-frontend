/**
 * Settings feature — public API.
 * Only export what app/ pages and other features need.
 */

// Components
export { SettingsScreen } from './components/SettingsScreen';
export { VirtualKeyPairingDialog } from './components/VirtualKeyPairingDialog';

// Server actions
export { getSettings, updateSettings, unlinkTesla, deferKeyPairing } from './api/actions';

// Utils
export { shouldShowPairingModal } from './utils';

// Types
export type { UserSettings, NotificationPreferences } from './types';
