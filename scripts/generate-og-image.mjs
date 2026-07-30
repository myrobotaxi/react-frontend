/**
 * Regenerates the static link-preview card served as og:image for /join.
 *
 * The card is deliberately GENERIC — no invite code, no sender or recipient
 * name. Messaging apps cache previews and show them to everyone in a thread,
 * so anything baked in here is public.
 *
 * The lockup is the canonical brand: the two-tone gold facet arrow on a matte
 * near-black tile, above the single-color uppercase wordmark. It is duplicated
 * here as plain HTML/CSS rather than imported, because this art-board is
 * rendered by a bare headless browser with no React and no Tailwind. Keep it in
 * step with `src/components/ui/Logo.tsx`, whose source of truth is
 * `ios-app/design/app/components.jsx:9-45`. No hexagons.
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

const BG = '#0A0A0A';

/** Brand mark tile, in px. Every other number below is a ratio of it. */
const TILE = 168;
const RADIUS = TILE * 0.225;
const ARROW = TILE * 0.56;
const GLOW = TILE * 0.92;

const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Roboto:wght@500&display=block"
      rel="stylesheet"
    />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        width: ${WIDTH}px;
        height: ${HEIGHT}px;
        background: ${BG};
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Roboto', -apple-system, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif;
        color: #FFFFFF;
        overflow: hidden;
      }
      /* Soft gold wash from the top — the sign-in screen's own backdrop
         (design app/screens.jsx:184), scaled to the card. */
      .wash {
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 440px;
        background: radial-gradient(140% 100% at 50% -20%, rgba(201,168,76,0.3) 0%, rgba(0,0,0,0) 65%);
      }
      .card { position: relative; text-align: center; }
      .tile {
        position: relative;
        width: ${TILE}px;
        height: ${TILE}px;
        margin: 0 auto 46px;
        border-radius: ${RADIUS}px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(155deg, #1b1407 0%, #0d0b06 55%, #090806 100%);
        box-shadow:
          0 ${TILE * 0.04}px ${TILE * 0.12}px rgba(0,0,0,0.5),
          inset 0 0 0 0.5px rgba(255,255,255,0.07);
      }
      .tile .rake {
        position: absolute;
        inset: 0;
        background: radial-gradient(95% 80% at 32% 2%, rgba(201,168,76,0.16), rgba(201,168,76,0) 60%);
      }
      .tile .glow {
        position: absolute;
        width: ${GLOW}px;
        height: ${GLOW}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(201,168,76,0.28), rgba(201,168,76,0) 62%);
      }
      .tile svg { position: relative; display: block; }
      .wordmark {
        font-size: 76px;
        font-weight: 500;
        letter-spacing: 0.04em;
        line-height: 1;
        text-transform: uppercase;
      }
      .tagline {
        margin-top: 34px;
        font-size: 30px;
        font-weight: 400;
        color: #A0A0A0;
        letter-spacing: 0.01em;
      }
    </style>
  </head>
  <body>
    <div class="wash"></div>
    <div class="card">
      <div class="tile">
        <div class="rake"></div>
        <div class="glow"></div>
        <svg width="${ARROW}" height="${ARROW}" viewBox="0 0 100 100">
          <g transform="rotate(-22 50 50)">
            <polygon points="50,12 50,64 18,85" fill="#E4D08A" />
            <polygon points="50,12 82,85 50,64" fill="#9C7E2C" />
          </g>
        </svg>
      </div>
      <div class="wordmark">myrobotaxi</div>
      <div class="tagline">You&rsquo;re invited to ride a Tesla</div>
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

  await page.setContent(html, { waitUntil: 'networkidle' });

  // The wordmark is the whole point of the card, so fail loudly rather than
  // silently shipping it in a fallback face.
  const loaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.check('500 76px Roboto');
  });
  if (!loaded) {
    throw new Error('Roboto 500 did not load — refusing to render the wordmark in a fallback face');
  }

  await page.screenshot({ path: OUT_FILE, type: 'png' });
  await browser.close();

  console.log(`Wrote ${OUT_FILE} (${WIDTH}x${HEIGHT})`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
