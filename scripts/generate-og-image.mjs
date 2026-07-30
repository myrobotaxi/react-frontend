/**
 * Regenerates the static link-preview card served as og:image for /join.
 *
 * The card is deliberately GENERIC — no invite code, no sender or recipient
 * name. Messaging apps cache previews and show them to everyone in a thread,
 * so anything baked in here is public.
 *
 * Run: node scripts/generate-og-image.mjs
 * Output: public/og/invite-card.png (1200x630)
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const OUT_DIR = resolve('./public/og');
const OUT_FILE = resolve(OUT_DIR, 'invite-card.png');

const WIDTH = 1200;
const HEIGHT = 630;

const GOLD = '#C9A84C';
const BG = '#0A0A0A';

const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        width: ${WIDTH}px;
        height: ${HEIGHT}px;
        background: ${BG};
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #fff;
        overflow: hidden;
      }
      .glow {
        position: absolute;
        width: 900px;
        height: 900px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(201,168,76,0.13) 0%, rgba(201,168,76,0) 62%);
      }
      .card { position: relative; text-align: center; }
      .mark { margin-bottom: 40px; }
      .wordmark {
        font-size: 76px;
        font-weight: 600;
        letter-spacing: -0.02em;
      }
      .wordmark .accent { color: ${GOLD}; }
      .tagline {
        margin-top: 26px;
        font-size: 30px;
        font-weight: 400;
        color: #A0A0A0;
        letter-spacing: 0.01em;
      }
      .rule {
        margin: 44px auto 0;
        width: 120px;
        height: 2px;
        background: linear-gradient(90deg, rgba(201,168,76,0) 0%, ${GOLD} 50%, rgba(201,168,76,0) 100%);
      }
    </style>
  </head>
  <body>
    <div class="glow"></div>
    <div class="card">
      <svg class="mark" width="132" height="132" viewBox="0 0 48 48" fill="none">
        <path d="M24 4L6 16v16l18 12 18-12V16L24 4z" stroke="${GOLD}" stroke-width="1.25" fill="none" />
        <circle cx="24" cy="24" r="3" fill="${GOLD}" />
      </svg>
      <div class="wordmark">My<span class="accent">Robo</span>Taxi</div>
      <div class="tagline">You&rsquo;re invited to ride a Tesla</div>
      <div class="rule"></div>
    </div>
  </body>
</html>`;

async function run() {
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
  });

  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: OUT_FILE, type: 'png' });
  await browser.close();

  console.log(`Wrote ${OUT_FILE} (${WIDTH}x${HEIGHT})`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
