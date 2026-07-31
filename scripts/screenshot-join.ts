/**
 * Captures the public pages — the coming-soon teaser at the apex and the invite
 * landing — for the PR description.
 *
 * Expects a server on BASE (default http://localhost:3100 — the production
 * build via `npm run start`, so the lockdown proxy is exercised too: every path
 * below other than `/` and `/join/{CODE}` would 302 to `/`).
 *
 * Run: node scripts/screenshot-join.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = process.env.BASE ?? 'http://localhost:3100';
const OUT = './screenshots';

const shots = [
  // The root: what anyone who types the bare domain gets, phone and desktop.
  { path: '/', name: '20-coming-soon-root' },
  { path: '/', name: '21-coming-soon-root-desktop', viewport: { width: 1280, height: 800 } },
  { path: '/join/RBO246', name: '10-join-with-code' },
  // No `/join` shot: the codeless landing is retired behind a 302 to `/`, and
  // that redirect carries a Location of AUTH_URL — so capturing it here would
  // photograph the production site rather than the build under test.
  { path: '/join/not-a-code', name: '12-join-invalid-code' },
  // MYR-359 — the same page named by the link, and the guard that a name which
  // is not plainly a name falls back to the generic heading.
  { path: '/join/RBO246?from=Thomas', name: '14-join-personalized' },
  {
    path: `/join/RBO246?from=${encodeURIComponent('<script>alert(1)</script>')}`,
    name: '15-join-junk-from-falls-back',
  },
];

async function run() {
  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  });

  for (const shot of shots) {
    const page = await context.newPage();
    // Phone by default; a shot may ask for its own viewport (the teaser is the
    // whole viewport, so it is worth seeing on a wide one too).
    if (shot.viewport) await page.setViewportSize(shot.viewport);
    await page.goto(`${BASE}${shot.path}`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `${OUT}/${shot.name}.png`, fullPage: true });
    await page.close();
    console.log(`Captured ${shot.path} -> ${OUT}/${shot.name}.png`);
  }

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
