/**
 * Captures the group-ride join landing (MYR-540) for the PR description.
 *
 * Unlike `screenshot-join.ts`, this needs NOTHING set up: `/ride/{CODE}`
 * verifies no signature and reads no query, so a plain dev server renders the
 * real page. The lockdown stays ON (its default), which is also the production
 * configuration — a code-shaped `/ride/{CODE}` is exempt from it.
 *
 * Run:
 *
 *   npx next dev -p 3100
 *   npx tsx scripts/screenshot-ride.ts
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = process.env.BASE ?? 'http://localhost:3100';
const OUT = './screenshots';

interface Shot {
  path: string;
  name: string;
  viewport?: { width: number; height: number };
}

const shots: Shot[] = [
  // The page as a recipient meets it: a code-shaped path, phone-sized. Every
  // ride link renders exactly this — the code appears only in the gold
  // button's `myrobotaxi://` href, never on screen.
  { path: '/ride/RBO246', name: '30-ride-join-landing' },
  { path: '/ride/RBO246', name: '31-ride-join-landing-desktop', viewport: { width: 1280, height: 800 } },
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
    if (shot.viewport) await page.setViewportSize(shot.viewport);
    await page.goto(`${BASE}${shot.path}`, { waitUntil: 'networkidle' });
    // `next dev` paints its dev-tools badge into a <nextjs-portal>. It is not
    // part of the page and must not appear in a PR screenshot.
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
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
