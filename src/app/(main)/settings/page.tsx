import { redirect } from 'next/navigation';

import { signOut } from '@/auth';
import { getSettings, updateSettings, SettingsScreen } from '@/features/settings';

import type { NotificationPreferences } from '@/features/settings';

/** Server action wrapper for sign out with redirect. */
async function handleSignOut() {
  'use server';
  await signOut({ redirectTo: '/signin' });
}

/** Server action wrapper to persist a single notification toggle. */
async function handleToggle(key: keyof NotificationPreferences, value: boolean) {
  'use server';
  await updateSettings({ [key]: value });
}

/**
 * Settings page — user preferences and Tesla account linking.
 * Fetches real settings from the database via server action.
 */
export default async function SettingsPage() {
  const settings = await getSettings();

  if (!settings) {
    redirect('/signin');
  }

  return (
    <SettingsScreen
      settings={settings}
      onSignOut={handleSignOut}
      onToggle={handleToggle}
    />
  );
}
