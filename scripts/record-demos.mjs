import { chromium } from 'playwright';
import { mkdirSync, rmSync } from 'fs';
import { execSync } from 'child_process';

const BASE = 'http://localhost:3000';
const OUT = './demos';
mkdirSync(OUT, { recursive: true });

const demos = [
  {
    name: '01-protected-redirect',
    description: 'Visit / while signed out → redirects to /signin',
    steps: async (page) => {
      await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForURL('**/signin', { timeout: 10000 });
      await page.waitForTimeout(2000);
    },
  },
  {
    name: '02-public-route-access',
    description: 'Visit /shared/demo-token while signed out → page loads normally',
    steps: async (page) => {
      await page.goto(`${BASE}/shared/demo-token`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
    },
  },
];

async function recordDemo(browser, demo) {
  console.log(`Recording: ${demo.name} — ${demo.description}`);
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
    recordVideo: { dir: OUT, size: { width: 390, height: 844 } },
  });

  const page = await ctx.newPage();
  try {
    await demo.steps(page);
  } catch (e) {
    console.error(`  FAIL ${demo.name}: ${e.message}`);
  }
  await page.close();
  await ctx.close();

  const videoPath = await page.video().path();
  const mp4Path = `${OUT}/${demo.name}.mp4`;

  try {
    execSync(
      `ffmpeg -y -i "${videoPath}" -c:v libx264 -pix_fmt yuv420p "${mp4Path}"`,
      { stdio: 'pipe' }
    );
    rmSync(videoPath);
    console.log(`  OK ${demo.name} -> ${mp4Path}`);
  } catch (e) {
    console.error(`  FAIL ${demo.name} ffmpeg conversion: ${e.message}`);
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  for (const demo of demos) {
    await recordDemo(browser, demo);
  }

  await browser.close();
  console.log('\nDone! Videos in demos/');
}

run().catch(console.error);
