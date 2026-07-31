import type { Metadata } from 'next';

import { signIn, auth } from '@/auth';
import { HomeScreen, HomeEmptyScreen, HomeSyncingScreen, getCachedVehicles, getVehicles, syncVehicles, generateWsToken } from '@/features/vehicles';
import { getSettings, deferKeyPairing, shouldShowPairingModal, PairingModalTrigger } from '@/features/settings';
import { getDrives } from '@/features/drives';
import { ComingSoonScreen } from '@/features/landing';
import { BottomNav } from '@/components/layout/BottomNav';
import { isLockdownEnabled } from '@/lib/lockdown';

import { buildComingSoonMetadata } from './coming-soon-metadata';

/** Server action to initiate Tesla OAuth account linking. */
async function handleLinkTesla() {
  'use server';
  await signIn('tesla', { redirectTo: '/' });
}

/** Server action to defer virtual key pairing. */
async function handleDeferPairing() {
  'use server';
  await deferKeyPairing();
}

/**
 * Preview tags for the teaser, server-rendered — the card a shared link shows
 * is built by scrapers that never run this page's JavaScript.
 *
 * With the lockdown off, `/` is the app's Home screen and inherits the layout's
 * tags exactly as it did before, so the head always describes the body.
 */
export async function generateMetadata(): Promise<Metadata> {
  return isLockdownEnabled() ? buildComingSoonMetadata() : {};
}

/**
 * Root route.
 *
 * While the retired-app lockdown is on — which is every deployed environment
 * (see `lib/lockdown.ts`) — this is the coming-soon teaser, and the proxy sends
 * every locked-down route here. The Home screen below is the retired app
 * underneath: unreachable in production, still rendered when the lockdown is
 * switched off, which is how the Playwright suite keeps covering it. Reverting
 * the lockdown commit makes it the root route again.
 */
export default async function RootPage() {
  if (isLockdownEnabled()) {
    return <ComingSoonScreen />;
  }

  const [cachedVehicles, settings, drives, session] = await Promise.all([
    getCachedVehicles(),
    getSettings(),
    getDrives(),
    auth(),
  ]);

  // If no cached vehicles, try a full sync — the user may have just linked Tesla
  const vehicles = cachedVehicles.length === 0 ? await getVehicles() : cachedVehicles;

  if (vehicles.length === 0) {
    // Tesla is linked but sync hasn't completed yet (race condition on OAuth redirect).
    // Show a syncing state with polling instead of the empty "Add Your Tesla" screen.
    if (settings?.teslaLinked) {
      return <HomeSyncingScreen fetchVehicles={getCachedVehicles} onLinkTesla={handleLinkTesla} />;
    }
    return <HomeEmptyScreen onLinkTesla={handleLinkTesla} />;
  }

  const showPairingModal = settings ? shouldShowPairingModal(settings) : false;
  const wsToken = await generateWsToken();
  const userId = session?.user?.id ?? undefined;

  return (
    <div className="min-h-screen bg-bg-primary">
      <HomeScreen vehicles={vehicles} drives={drives} onSync={syncVehicles} wsToken={wsToken ?? undefined} userId={userId} />
      {showPairingModal && (
        <PairingModalTrigger autoShow onDefer={handleDeferPairing} />
      )}
      <BottomNav />
    </div>
  );
}
