import { test, expect } from '@playwright/test';

/**
 * Public group-ride join landing (MYR-540) — the fallback for
 * https://myrobotaxi.app/ride/{CODE} when Universal Links do not hand the share
 * link to the installed iOS app.
 *
 * Somebody joining a friend's ride is anonymous by definition: no session, no
 * beta cookie, and very possibly no app. These tests run with empty storage to
 * match.
 *
 * ONE GATE FRONTS THIS ROUTE, not two. The lockdown (`lib/lockdown.ts`) serves
 * only code-SHAPED `/ride/{CODE}` paths and 302s everything else to the teaser;
 * it is OFF in this suite (see playwright.config.ts) and unit-tested instead.
 * There is deliberately no second, page-level gate: `/join/{CODE}` verifies a
 * MYR-368 signature and redirects when it fails, because it renders names from
 * the query into a cached preview card. This page renders nothing from the URL
 * at all, so there is nothing for a signature to make safe — and failing closed
 * would bounce the one visitor the page exists for. See `app/ride/[code]/page.tsx`.
 */
const ANONYMOUS = { cookies: [], origins: [] };

test.describe('ride join landing', () => {
  test.use({ storageState: ANONYMOUS });

  test('renders for a code-shaped path without asking whether the ride is real', async ({
    page,
  }) => {
    // Well-formed and almost certainly not a live ride. It gets the same page
    // and the same 200 as a real one: the route is not an oracle for which
    // rides are running, and it holds no ride data to answer with anyway.
    const response = await page.goto('/ride/ZZZZZZ');

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { name: "You're invited to join a ride 🎉" }),
    ).toBeVisible();
  });

  test('is reachable without a session or beta cookie', async ({ page }) => {
    const response = await page.goto('/ride/RBO246');

    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/ride\/RBO246$/);
  });

  test('offers an app-open CTA carrying the code from the path', async ({ page }) => {
    await page.goto('/ride/RBO246');

    await expect(page.getByRole('link', { name: /open the ride in the app/i })).toHaveAttribute(
      'href',
      'myrobotaxi://ride/RBO246',
    );
  });

  /** Built per page, not frozen to a constant somebody could hard-code. */
  test('builds the in-app URL from whichever code the path carried', async ({ page }) => {
    await page.goto('/ride/ZZZZZZ');

    await expect(page.getByRole('link', { name: /open the ride in the app/i })).toHaveAttribute(
      'href',
      'myrobotaxi://ride/ZZZZZZ',
    );
  });

  /**
   * The signed share link arrives as `/ride/{CODE}?k=…`. Nothing in the query
   * reaches the in-app URL — the code comes from the PATH, matching the iOS
   * parser, which ignores the query too.
   */
  test('takes the code from the path and ignores the signed query', async ({ page }) => {
    await page.goto('/ride/RBO246?k=1.4102444800.abc&from=Mallory');

    await expect(page.getByRole('link', { name: /open the ride in the app/i })).toHaveAttribute(
      'href',
      'myrobotaxi://ride/RBO246',
    );
    expect(await page.locator('main').innerHTML()).not.toContain('Mallory');
  });

  test('links to the public TestFlight build', async ({ page }) => {
    await page.goto('/ride/RBO246');

    await expect(page.getByRole('link', { name: /get the app on testflight/i })).toHaveAttribute(
      'href',
      'https://testflight.apple.com/join/uarZRUbg',
    );
  });

  test('lists the three onboarding steps, ending at the link rather than a code screen', async ({
    page,
  }) => {
    await page.goto('/ride/RBO246');

    await expect(page.getByText(/install myrobotaxi from testflight/i)).toBeVisible();
    await expect(page.getByText(/sign in with apple/i)).toBeVisible();
    await expect(page.getByText(/open this link again to join the ride/i)).toBeVisible();
    expect(await page.locator('main').innerText()).not.toMatch(/enter the code/i);
  });

  /**
   * The page links off the site to the installed app and to TestFlight, and to
   * exactly one route on this (retired) site: the privacy policy (MYR-427).
   * The exact list, so a link back into the app cannot appear without failing.
   */
  test('is standalone — the app, TestFlight and the privacy policy, nothing else', async ({
    page,
  }) => {
    await page.goto('/ride/RBO246');

    const hrefs = await page
      .locator('a')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')));

    expect(hrefs).toEqual([
      'myrobotaxi://ride/RBO246',
      'https://testflight.apple.com/join/uarZRUbg',
      '/privacy',
    ]);
  });

  test('the privacy policy it links to actually serves', async ({ page }) => {
    const response = await page.goto('/privacy');

    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: /privacy policy/i })).toBeVisible();
  });

  /**
   * The smart app banner is built but dormant on both public surfaces: the app
   * has no App Store record yet and `app-id` is the one attribute Safari
   * requires. This is what ships today; the unit suite covers the shape it
   * takes when the id exists.
   */
  test('emits no smart app banner while the app has no App Store id', async ({ page }) => {
    await page.goto('/ride/RBO246');

    await expect(page.locator('meta[name="apple-itunes-app"]')).toHaveCount(0);
  });

  /**
   * Bare `/ride` is not a page. `/join` has a codeless arm because an invite
   * code can be read out over the phone; a ride cannot be joined without its
   * link, so there is nothing to render. In production the lockdown 302s it to
   * the teaser before it gets this far.
   */
  test('has no codeless arm, even with the lockdown off', async ({ page }) => {
    const response = await page.goto('/ride');

    expect(response?.status()).toBe(404);
  });

  /**
   * A malformed segment 302s to the teaser in production via the lockdown. With
   * the lockdown off it reaches the page, which renders the same words and NO
   * app-open button — a link that would open the app on nothing is never
   * rendered as a live one.
   */
  test('renders no app-open CTA for a segment it cannot read as a code', async ({ page }) => {
    const response = await page.goto('/ride/not-a-valid-code');

    expect(response?.status()).toBe(200);
    await expect(page.getByRole('link', { name: /open the ride in the app/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /get the app on testflight/i })).toBeVisible();
  });
});

/**
 * MYR-540's absolute rule, on the real rendered route: THE LANDING PAGE RENDERS
 * ZERO RIDE DATA.
 *
 * The surface is open and the thing behind it is a live location. A ride link
 * is forwarded into group chats by design, and every platform that sees it
 * scrapes the page and re-displays the preview to people who never opened it.
 */
test.describe('ride join landing — renders zero ride data', () => {
  test.use({ storageState: ANONYMOUS });

  test('never shows the code, in the body or the head', async ({ page }) => {
    await page.goto('/ride/RBO246');

    expect(await page.locator('main').innerText()).not.toContain('RBO246');
    expect(await page.locator('head').innerHTML()).not.toContain('RBO246');
  });

  /**
   * The code reaches EXACTLY ONE place in the document: the scheme URL of the
   * app-open button. Counted over the whole rendered HTML, so a data attribute
   * or a hidden field would fail this too.
   *
   * Next serializes the request URL into its own RSC flight payload — framework
   * behaviour on every dynamic route — so the count is taken over `main` rather
   * than the whole document, and the head is asserted separately above.
   */
  test('lets the code reach the app-open href and nowhere else on the page', async ({ page }) => {
    await page.goto('/ride/RBO246');

    const html = await page.locator('main').innerHTML();

    expect((html.match(/RBO246/g) ?? []).length).toBe(1);
    expect(html).toContain('myrobotaxi://ride/RBO246');
  });

  /** Two different codes must render the same page but for that one href. */
  test('renders the same words for every code', async ({ page }) => {
    await page.goto('/ride/RBO246');
    const first = await page.locator('main').innerText();

    await page.goto('/ride/ZZZZZZ');
    const second = await page.locator('main').innerText();

    expect(first).toBe(second);
  });

  test('says out loud that it will never show the ride', async ({ page }) => {
    await page.goto('/ride/RBO246');

    await expect(page.getByText(/this page never shows the ride/i)).toBeVisible();
    await expect(page.getByText(/stops working once the ride ends/i)).toBeVisible();
  });

  test('embeds no image, map or frame', async ({ page }) => {
    await page.goto('/ride/RBO246');

    await expect(page.locator('main img, main canvas, main iframe, main video')).toHaveCount(0);
  });
});

/**
 * The card a group chat sees. Constant for every ride link — see
 * `app/ride/ride-metadata.ts` for why a preview that is re-displayed to a whole
 * thread must not describe the ride.
 */
test.describe('ride join landing — link preview', () => {
  test.use({ storageState: ANONYMOUS });

  test('serves the ride card and the ride copy, without the code', async ({ page }) => {
    await page.goto('/ride/RBO246');

    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      "You're invited to join a ride 🎉",
    );
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
      'content',
      'Someone shared their MyRoboTaxi ride with you. Open it in the app to join.',
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    );

    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toContain('/og/ride-card.png');
    expect(ogImage).not.toContain('invite-card');
  });

  test('carries no og:url, because the URL contains the code', async ({ page }) => {
    await page.goto('/ride/RBO246');

    await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
  });

  test('keeps code-bearing URLs out of search engines', async ({ page }) => {
    await page.goto('/ride/RBO246');

    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toContain('noindex');
  });

  test('serves the og image it points at', async ({ request }) => {
    const response = await request.get('/og/ride-card.png');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
  });
});
