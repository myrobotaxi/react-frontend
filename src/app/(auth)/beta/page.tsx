import { Suspense } from 'react';

import { BetaGate } from '@/features/auth';

/**
 * Beta access gate page — requires a password before reaching sign-in.
 * Suspense boundary for client component hydration.
 */
export default function BetaPage() {
  return (
    <Suspense>
      <BetaGate />
    </Suspense>
  );
}
