/**
 * Captures the public pages — the coming-soon teaser at the apex and the invite
 * landing — for the PR description.
 *
 * SINCE MYR-368 THIS NEEDS A DEV SERVER, not a production build. The invite
 * page rejects any link it cannot verify, and the production signing seed is a
 * Fly secret that no local process holds, so the shots are taken against a
 * server told to trust the suite's throwaway keypair — an override
 * `lib/invite-signature.ts` reads only when `NODE_ENV !== 'production'`.
 *
 * The lockdown stays ON (its default), so `/` is the teaser rather than the
 * app's authenticated Home — which is what a rejected link has to land on for
 * the shot to mean anything.
 *
 * Run:
 *
 *   INVITE_LINK_TEST_PUBLIC_KEY=$(npx tsx --eval \
 *     "import { TEST_INVITE_PUBLIC_KEY_B64 } from './e2e/helpers/invite-link'; \
 *      console.log(TEST_INVITE_PUBLIC_KEY_B64);") npx next dev -p 3100
 *   npx tsx scripts/screenshot-join.ts
 *
 * TypeScript, run under `tsx` rather than plain `node`: the links are signed by
 * the same helper the Playwright suite uses, so a shot can never be captured
 * from a link the suite would not accept.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

import { signedJoinLink } from '../e2e/helpers/invite-link';

const BASE = process.env.BASE ?? 'http://localhost:3100';
const OUT = './screenshots';

interface Shot {
  path: string;
  name: string;
  viewport?: { width: number; height: number };
}

const shots: Shot[] = [
  // The root: what anyone who types the bare domain gets, phone and desktop.
  { path: '/', name: '20-coming-soon-root' },
  { path: '/', name: '21-coming-soon-root-desktop', viewport: { width: 1280, height: 800 } },

  // MYR-368 — the three approved copy variants, each on a signed link.
  { path: signedJoinLink('RBO246'), name: '10-join-with-code' },
  { path: signedJoinLink('RBO246', { from: 'Alex', to: 'Mira' }), name: '14-join-personalized' },
  { path: signedJoinLink('RBO246', { from: 'Alex' }), name: '16-join-owner-only' },

  // The rejections, both landing on the teaser: a link with no signature at
  // all, and one whose name was edited after signing.
  { path: '/join/RBO246?from=Alex&to=Mira', name: '17-join-unsigned-redirects' },

  // A signed name that is still not plainly a name. The signature covers it;
  // `sanitizeInviterName` declines it anyway, and the generic copy renders.
  {
    path: signedJoinLink('RBO246', { from: '<script>alert(1)</script>' }),
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
    // `next dev` paints its dev-tools badge into a <nextjs-portal>. It is not
    // part of the page and must not appear in a PR screenshot — the price of
    // shooting against a dev server, which MYR-368 made necessary.
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
