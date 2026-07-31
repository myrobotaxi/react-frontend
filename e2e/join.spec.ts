import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

import { signedJoinLink, tamper } from './helpers/invite-link';

/**
 * Public invite landing — the fallback for https://myrobotaxi.app/join/{CODE}
 * when Universal Links do not hand the invite to the installed iOS app.
 *
 * An invite recipient is anonymous by definition: no session, no beta cookie.
 * These tests run with empty storage to match.
 *
 * TWO GATES FRONT THIS ROUTE, and they are not the same gate:
 *
 *  1. The lockdown (`lib/lockdown.ts`), in the proxy, which serves only
 *     code-SHAPED `/join/{CODE}` paths and 302s everything else to the
 *     coming-soon teaser at `/`. It is OFF in this suite (see
 *     playwright.config.ts) and unit-tested instead, so specs below that load
 *     `/join` or a non-code-shaped segment cover a route only reachable with it
 *     off.
 *  2. The signature check (MYR-368), in the PAGE, which redirects to `/` unless
 *     the URL carries a valid Ed25519 signature over the code, expiry and both
 *     names. It is ON here — it is the thing under test — so every link below
 *     that expects to render is minted by `signedJoinLink`, against a throwaway
 *     keypair the dev server is configured to trust.
 */
const ANONYMOUS = { cookies: [], origins: [] };

/**
 * Assert that a link was REJECTED by the signature check.
 *
 * Asserted on the page's OWN response — a 3xx whose `Location` is `/` — rather
 * than on where the browser eventually stops. That distinction cost a red CI
 * run: `/` is not a public path, so the proxy's pre-existing auth gate bounces
 * an anonymous visitor straight on to `/signin?callbackUrl=%2F`, and the
 * browser's final URL is a fact about the auth gate, not about this feature.
 *
 * Worse, where that chain ENDS depends on `AUTH_URL`. With it pointing at the
 * production apex — as a developer's `.env.local` does — the proxy's redirect
 * leaves localhost entirely and lands on the real site, whose lockdown sends
 * `/signin` to `/`. So an assertion on the final URL passed locally by
 * navigating to production, and failed in CI, where `AUTH_URL` is localhost.
 * (playwright.config.ts now pins `AUTH_URL` to localhost so the suite can never
 * do that again.)
 *
 * The two things that are actually this feature's business, and are true under
 * any auth or lockdown configuration:
 *
 *   1. the page answered the invite URL with a redirect to `/`, and
 *   2. no invite ever rendered.
 */
async function expectRejected(request: APIRequestContext, page: Page, link: string) {
  const response = await request.get(link, { maxRedirects: 0 });

  expect(response.status()).toBeGreaterThanOrEqual(300);
  expect(response.status()).toBeLessThan(400);
  expect(response.headers()['location']).toBe('/');

  await page.goto(link);
  await expect(page).not.toHaveURL(/\/join\//);
  await expect(page.getByTestId('invite-code')).toHaveCount(0);
}

test.describe('invite landing page — a signed link', () => {
  test.use({ storageState: ANONYMOUS });

  test('renders the invite code from the URL', async ({ page }) => {
    await page.goto(signedJoinLink('RBO246'));

    await expect(page.getByTestId('invite-code')).toHaveText('RBO246');
    await expect(page).toHaveURL(/\/join\/RBO246\?/);
  });

  test('renders a code-shaped segment without asking whether the code is real', async ({
    page,
  }) => {
    // Well-formed, correctly signed, and almost certainly not a live invite. It
    // gets the same page and the same 200 as a real one — the signature proves
    // we minted the LINK, never that the code is redeemable, and the route is
    // still not an oracle for which codes exist.
    const response = await page.goto(signedJoinLink('ZZZZZZ'));

    expect(response?.status()).toBe(200);
    await expect(page.getByTestId('invite-code')).toHaveText('ZZZZZZ');
  });

  test('links to the public TestFlight build', async ({ page }) => {
    await page.goto(signedJoinLink('RBO246'));

    await expect(page.getByRole('link', { name: /get the app on testflight/i })).toHaveAttribute(
      'href',
      'https://testflight.apple.com/join/uarZRUbg',
    );
  });

  test('is reachable without a session or beta cookie', async ({ page }) => {
    const response = await page.goto(signedJoinLink('RBO246'));

    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/join\/RBO246\?/);
  });

  test('is standalone — the only link leaves the site', async ({ page }) => {
    await page.goto(signedJoinLink('RBO246'));

    const hrefs = await page.locator('a').evaluateAll((links) =>
      links.map((link) => link.getAttribute('href')),
    );

    expect(hrefs).toEqual(['https://testflight.apple.com/join/uarZRUbg']);
  });
});

/**
 * MYR-368 — the rejection matrix.
 *
 * Every one of these lands on `/` with no invite on screen, and they all land
 * there THE SAME WAY. A page that distinguished "expired" from "forged" from
 * "never minted" would hand back the information the flat redirect exists to
 * withhold.
 */
test.describe('invite landing page — an unverifiable link', () => {
  test.use({ storageState: ANONYMOUS });

  const SIGNED = signedJoinLink('RBO246', { from: 'Alex', to: 'Mira' });

  const REJECTED: ReadonlyArray<readonly [string, string]> = [
    ['no signature at all', '/join/RBO246'],
    ['no signature, but names', '/join/RBO246?from=Alex&to=Mira'],
    ['a malformed k', '/join/RBO246?k=nonsense'],
    ['an empty k', '/join/RBO246?k='],
    ['a key id we do not publish', signedJoinLink('RBO246', { keyId: '9' })],
    ['an expiry in the past', signedJoinLink('RBO246', { expUnix: 1_000_000_000 })],
    ['a code the signature does not cover', SIGNED.replace('/join/RBO246', '/join/RBO247')],
    ['a from the signature does not cover', tamper(SIGNED, 'from', 'Mallory')],
    ['a to the signature does not cover', tamper(SIGNED, 'to', 'Mallory')],
    ['the names swapped', tamper(tamper(SIGNED, 'from', 'Mira'), 'to', 'Alex')],
    ['a signature borrowed from another link', tamper(SIGNED, 'k', signedJoinLink('ZZZZZZ').split('k=')[1])],
  ];

  for (const [label, link] of REJECTED) {
    test(`redirects to the teaser: ${label}`, async ({ request, page }) => {
      await expectRejected(request, page, link);
    });
  }

  /**
   * The signed payload carries the code as the server minted it — always
   * uppercase — so a path lower-cased in transit verifies against different
   * bytes and fails. Documented and accepted (see `lib/invite-signature.ts`):
   * canonicalising before verifying would mean verifying something other than
   * what was signed. The sender resends.
   */
  test('rejects a lower-cased path even though the code shape allows one', async ({
    request,
    page,
  }) => {
    await expectRejected(
      request,
      page,
      signedJoinLink('RBO246').replace('/join/RBO246', '/join/rbo246'),
    );
  });

  /**
   * A link signed over the lowercase code verifies — the verifier is honest
   * about what it covers, and the reason the case rule bites is that the SERVER
   * never mints one of these, not that the page second-guesses the payload.
   */
  test('accepts a lower-cased path when that is what was signed', async ({ page }) => {
    await page.goto(signedJoinLink('rbo246'));

    // Rendered upper-cased: the shape gate still normalises for display.
    await expect(page.getByTestId('invite-code')).toHaveText('RBO246');
  });

  /**
   * Appending a second `from=` to a legitimately signed link. Two answers to
   * "who sent this" is not a value the signer could have signed, and picking
   * one would let an attacker choose which the page reads.
   */
  test('rejects a repeated name parameter rather than picking one', async ({ request, page }) => {
    await expectRejected(request, page, `${SIGNED}&from=Mallory`);
  });

  // A malformed segment 302s to `/` in production via the lockdown; with the
  // lockdown off it reaches the page, which now redirects it for want of a
  // signature. Same destination, different gate.
  test('sends a malformed segment to the teaser with the lockdown off too', async ({
    request,
    page,
  }) => {
    await expectRejected(request, page, '/join/not-a-valid-code');
  });
});

/**
 * MYR-368 — the client-approved copy, on the page and in the head at once.
 *
 * These names render because the signature covers them. That is the whole
 * point of the ticket: before it, anyone could craft a URL that put arbitrary
 * text into an og:title that messaging platforms scrape, cache, and show to
 * everyone the link is forwarded to.
 */
test.describe('invite landing page — personalized copy', () => {
  test.use({ storageState: ANONYMOUS });

  test('greets the recipient and names the owner when the link carried both', async ({ page }) => {
    await page.goto(signedJoinLink('RBO246', { from: 'Alex', to: 'Mira' }));

    await expect(page.getByRole('heading', { name: "You're in, Mira! 🎉" })).toBeVisible();
    await expect(
      page.getByText('Alex is sharing their Tesla with you on MyRoboTaxi.'),
    ).toBeVisible();
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      "You're in, Mira! 🎉",
    );
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
      'content',
      "You're in, Mira! 🎉",
    );
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
      'content',
      'Alex is sharing their Tesla with you on MyRoboTaxi.',
    );

    // The code still renders, and still never reaches the head.
    await expect(page.getByTestId('invite-code')).toHaveText('RBO246');
    expect(await page.locator('head').innerHTML()).not.toContain('RBO246');
  });

  test('welcomes without a name when only the owner is named', async ({ page }) => {
    await page.goto(signedJoinLink('RBO246', { from: 'Alex' }));

    await expect(page.getByRole('heading', { name: "You're in! 🎉" })).toBeVisible();
    await expect(page.getByText('Alex is sharing their Tesla with you.')).toBeVisible();
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      "You're in! 🎉",
    );
  });

  test('falls back to the generic card when the link names nobody', async ({ page }) => {
    await page.goto(signedJoinLink('RBO246'));

    await expect(page.getByRole('heading', { name: "You're invited! 🎉" })).toBeVisible();
    await expect(
      page.getByText('Someone is sharing their Tesla with you on MyRoboTaxi.'),
    ).toBeVisible();
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      "You're invited! 🎉",
    );
  });

  /**
   * Some invites grant location only. Nothing on the page may promise a ride.
   */
  test('promises no ride anywhere on the page or in the head', async ({ page }) => {
    await page.goto(signedJoinLink('RBO246', { from: 'Alex', to: 'Mira' }));

    expect(await page.locator('main').innerText()).not.toMatch(/ride/i);
    expect(await page.locator('title').innerText()).not.toMatch(/ride/i);
  });

  /**
   * `from` and `to` are signature-covered now, so junk can only reach the page
   * on a link we signed. `sanitizeInviterName` stays as defence in depth — the
   * guard that does not depend on the key being right — and this pins that it
   * still fires. Each value below IS correctly signed; none of them renders.
   */
  const JUNK_NAMES = [
    '<script>alert(1)</script>',
    '"><img src=x onerror=alert(1)>',
    '</title><meta property="og:title" content="pwned">',
    'https://evil.example',
    'Thomas Mallory',
    'Thomas3',
  ];

  for (const junk of JUNK_NAMES) {
    test(`ignores a signed but junk name: ${junk}`, async ({ page }) => {
      let dialogRaised = false;
      page.on('dialog', async (dialog) => {
        dialogRaised = true;
        await dialog.dismiss();
      });

      await page.goto(signedJoinLink('RBO246', { from: junk }));

      await expect(page.getByRole('heading', { name: "You're invited! 🎉" })).toBeVisible();
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        'content',
        "You're invited! 🎉",
      );

      // The two places the value would do damage: the HEAD, which is what every
      // scraper reads and caches on behalf of people who never opened the link,
      // and the rendered page itself.
      expect(await page.locator('head').innerHTML()).not.toContain(junk);
      expect(await page.locator('main').innerHTML()).not.toContain(junk);

      // Next serializes the request URL into its own RSC flight payload, HTML-
      // escaped — framework behaviour on every route that reads searchParams,
      // and inert. The property that matters is that nothing in it RUNS.
      expect(dialogRaised).toBe(false);
    });
  }

  test('serves link-preview metadata to scrapers, without the code', async ({ page }) => {
    await page.goto(signedJoinLink('RBO246'));

    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    );

    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toContain('/og/invite-card.png');

    const head = await page.locator('head').innerHTML();
    expect(head).not.toContain('RBO246');
  });
});

/**
 * The codeless landing, which the lockdown retires behind a redirect to `/` in
 * production. It has no code, so there is nothing for a signature to cover —
 * and since MYR-368 it therefore reads no names at all, rather than being the
 * one route left where a crafted URL writes a cached preview card.
 */
test.describe('invite landing page — the codeless route', () => {
  test.use({ storageState: ANONYMOUS });

  test('still renders with the lockdown off', async ({ page }) => {
    const response = await page.goto('/join');

    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/join$/);
    await expect(page.getByTestId('invite-code')).toHaveCount(0);
  });

  test('ignores a name it cannot verify', async ({ page }) => {
    await page.goto('/join?from=Thomas');

    await expect(page.getByRole('heading', { name: "You're invited! 🎉" })).toBeVisible();
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      "You're invited! 🎉",
    );
    expect(await page.locator('main').innerHTML()).not.toContain('Thomas');
  });
});

test.describe('apple-app-site-association', () => {
  test.use({ storageState: ANONYMOUS });

  test('is served as JSON at the exact path, with no redirect', async ({ request }) => {
    const response = await request.get('/.well-known/apple-app-site-association', {
      maxRedirects: 0,
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    expect(body.applinks.details[0].appID).toBe('NFKX777598.app.myrobotaxi.ios');
    expect(body.applinks.details[0].components[0]['/']).toBe('/join/*');
  });
});
