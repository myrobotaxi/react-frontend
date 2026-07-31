import { loadEnvConfig } from '@next/env';
import { defineConfig, devices } from '@playwright/test';

import { TEST_INVITE_PUBLIC_KEY_B64 } from './e2e/helpers/invite-link';

// Load .env.local so DATABASE_URL and AUTH_SECRET are available to Playwright
// setup scripts (prisma db push/seed, JWT generation).
loadEnvConfig(process.cwd());

/**
 * Playwright E2E test configuration for MyRoboTaxi.
 *
 * Two projects:
 *   1. "setup" — seeds the database and creates an authenticated session cookie.
 *   2. "chromium" — runs all E2E tests using the saved auth session.
 *
 * Mobile-first: 390x844 viewport, 2x scale, dark color scheme (matches demo scripts).
 * Uses SwiftShader for software WebGL rendering (Mapbox GL needs WebGL).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'html' : 'list',
  timeout: 30_000,

  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        colorScheme: 'dark',
        storageState: 'e2e/.auth/session.json',
        launchOptions: {
          args: ['--use-gl=angle', '--use-angle=swiftshader'],
        },
      },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/,
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      // The retired-app lockdown (lib/lockdown.ts) redirects every route
      // except a code-shaped invite link to the coming-soon teaser at `/` in
      // production. Switched off here so this suite keeps covering the app
      // underneath — which still exists and would be restored if the lockdown
      // is reverted.
      //
      // The lockdown cannot be exercised from this suite: with it on, `/` is
      // the teaser rather than the app, so every authenticated spec below
      // would test the wrong page. Locally there is a second obstacle — its
      // redirects carry a Location of AUTH_URL, which .env.local sets to the
      // production apex, so a browser following one leaves localhost
      // altogether. (CI sets AUTH_URL to localhost, so only the first reason
      // applies there.) The policy is unit-tested instead:
      // __tests__/lib/lockdown.test.ts for the redirect target and the
      // exemptions, __tests__/features/landing/ and
      // __tests__/app/coming-soon-metadata.test.ts for the teaser itself.
      LOCKDOWN_DISABLED: '1',

      // Keep every redirect on localhost.
      //
      // `auth()` rewrites `req.url` to AUTH_URL, so the proxy's redirects carry
      // whatever this is set to. A developer's .env.local points it at the
      // production apex, which meant a redirect chain in this suite could leave
      // localhost and land on the REAL SITE — where the production lockdown
      // answers differently from the build under test. MYR-368 lost a CI run to
      // exactly that: a rejected invite link was asserted to end at `/`, which
      // passed locally only because it had navigated to production, and failed
      // in CI, where AUTH_URL is localhost. CI already sets this; pinning it
      // here makes a local run mean the same thing.
      AUTH_URL: 'http://localhost:3000',

      // Signed invite links (MYR-368). `/join/{CODE}` now redirects to `/`
      // unless the URL carries a signature this build can verify, so a suite
      // that cannot sign cannot reach the invite page at all. It verifies
      // against a throwaway keypair instead of the production key, whose
      // signing seed is a Fly secret no test process holds.
      //
      // `lib/invite-signature.ts` reads this variable ONLY when
      // `NODE_ENV !== 'production'` — which is true for the `next dev` server
      // started here and false for `next build` and every Vercel deployment —
      // so setting it cannot weaken a deployed build. The private half lives
      // in e2e/helpers/invite-link.ts, derived from the same constant, so the
      // key the server trusts and the key the specs sign with cannot drift.
      INVITE_LINK_TEST_PUBLIC_KEY: TEST_INVITE_PUBLIC_KEY_B64,
    },
  },
});
