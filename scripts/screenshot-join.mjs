/**
 * Captures the public invite pages for the PR description.
 *
 * Expects a server on BASE (default http://localhost:3100 — the production
 * build via `npm run start`, so the lockdown proxy is exercised too).
 *
 * Run: node scripts/screenshot-join.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = process.env.BASE ?? 'http://localhost:3100';
const OUT = './screenshots';

const shots = [
  { path: '/join/RBO246', name: '10-join-with-code' },
  { path: '/join', name: '11-join-landing-no-code' },
  { path: '/join/not-a-code', name: '12-join-invalid-code' },
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
