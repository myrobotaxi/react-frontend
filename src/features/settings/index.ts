/**
 * Settings feature — public API.
 * Only export what app/ pages and other features need.
 */

// Components
export { SettingsScreen } from './components/SettingsScreen';

// Server actions
export { getSettings, updateSettings, unlinkTesla } from './api/actions';

// Types
export type { UserSettings, NotificationPreferences } from './types';
