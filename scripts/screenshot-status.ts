/**
 * Captures the public status page for a PR description (MYR-510).
 *
 * The page is a pure function of what is in `status_checks` and
 * `status_incidents`, so it has two shots worth taking and they need two
 * different databases behind them — which is why the label is an argument
 * rather than a loop:
 *
 *   LABEL=live     — a database with probe history in it
 *   LABEL=no-data  — an empty one, showing what the page says when it knows
 *                    nothing. This is the shot that proves the honesty rule,
 *                    and the one most likely to rot silently, so take it.
 *
 * Run against a dev server pointed at whichever database you want in frame:
 *
 *   DATABASE_URL=... npx next dev -p 3112
 *   BASE=http://localhost:3112 LABEL=live npx tsx scripts/screenshot-status.ts
 *
 * Never point this at production and never write to production from it: the
 * only writer of those tables is the cron handler.
 */
import { mkdirSync } from 'fs';

import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:3112';
const LABEL = process.env.LABEL ?? 'live';
const OUT = './screenshots';

const shots = [
  { name: `30-status-${LABEL}`, viewport: { width: 390, height: 844 } },
  { name: `31-status-${LABEL}-desktop`, viewport: { width: 1280, height: 900 } },
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
    await page.setViewportSize(shot.viewport);
    await page.goto(`${BASE}/status`, { waitUntil: 'networkidle' });
    // `next dev` paints its dev-tools badge into a <nextjs-portal>; it is not
    // part of the page and must not appear in a PR screenshot.
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
    await page.screenshot({ path: `${OUT}/${shot.name}.png`, fullPage: true });
    await page.close();
    console.log(`Captured /status -> ${OUT}/${shot.name}.png`);
  }

  await browser.close();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
