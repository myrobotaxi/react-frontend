import { test, expect } from '@playwright/test';

/**
 * Public invite landing — the fallback for https://myrobotaxi.app/join/{CODE}
 * when Universal Links do not hand the invite to the installed iOS app.
 *
 * An invite recipient is anonymous by definition: no session, no beta cookie.
 * These tests run with empty storage to match.
 *
 * The lockdown redirect that fronts these routes in production is off in this
 * suite (see playwright.config.ts) and is covered by unit tests instead.
 */
const ANONYMOUS = { cookies: [], origins: [] };

test.describe('invite landing page', () => {
  test.use({ storageState: ANONYMOUS });

  test('renders the invite code from the URL', async ({ page }) => {
    await page.goto('/join/RBO246');

    await expect(page.getByTestId('invite-code')).toHaveText('RBO246');
    await expect(page).toHaveURL(/\/join\/RBO246$/);
  });

  test('upper-cases a lowercase code', async ({ page }) => {
    await page.goto('/join/rbo246');

    await expect(page.getByTestId('invite-code')).toHaveText('RBO246');
  });

  test('shows generic copy and no code for an invalid code', async ({ page }) => {
    const response = await page.goto('/join/not-a-valid-code');

    expect(response?.status()).toBe(200);
    await expect(page.getByTestId('invite-code')).toHaveCount(0);
    await expect(page.getByText('Enter the code the sender gave you')).toBeVisible();
  });

  test('links to the public TestFlight build', async ({ page }) => {
    await page.goto('/join/RBO246');

    await expect(page.getByRole('link', { name: /get the app on testflight/i })).toHaveAttribute(
      'href',
      'https://testflight.apple.com/join/uarZRUbg',
    );
  });

  test('is reachable without a session or beta cookie', async ({ page }) => {
    const response = await page.goto('/join');

    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/join$/);
  });

  test('is standalone — the only link leaves the site', async ({ page }) => {
    await page.goto('/join/RBO246');

    const hrefs = await page.locator('a').evaluateAll((links) =>
      links.map((link) => link.getAttribute('href')),
    );

    expect(hrefs).toEqual(['https://testflight.apple.com/join/uarZRUbg']);
  });

  test('names the sender in the heading and the preview card when the link does', async ({
    page,
  }) => {
    await page.goto('/join/RBO246?from=Thomas');

    await expect(
      page.getByRole('heading', { name: 'Thomas invited you to ride their Tesla' }),
    ).toBeVisible();
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'Thomas invited you to ride their Tesla',
    );
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
      'content',
      'Thomas invited you to ride their Tesla',
    );
    // The code still renders, and still never reaches the head.
    await expect(page.getByTestId('invite-code')).toHaveText('RBO246');
    expect(await page.locator('head').innerHTML()).not.toContain('RBO246');
  });

  test('names the sender on the codeless landing too', async ({ page }) => {
    await page.goto('/join?from=Thomas');

    await expect(
      page.getByRole('heading', { name: 'Thomas invited you to ride their Tesla' }),
    ).toBeVisible();
    await expect(page.getByTestId('invite-code')).toHaveCount(0);
  });

  test('falls back to the generic card when the link names nobody', async ({ page }) => {
    await page.goto('/join/RBO246');

    await expect(
      page.getByRole('heading', { name: /invited to ride a Tesla on MyRoboTaxi/i }),
    ).toBeVisible();
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      "You're invited to ride a Tesla",
    );
  });

  /**
   * `from` is attacker-controllable by construction — anyone can craft the URL,
   * and the value it carries lands in a page title that messaging platforms
   * scrape, cache, and show to everyone the link is forwarded to. Anything that
   * is not plainly a name is treated as absent, never salvaged.
   */
  const JUNK_FROM_VALUES = [
    '<script>alert(1)</script>',
    '"><img src=x onerror=alert(1)>',
    '</title><meta property="og:title" content="pwned">',
    'https://evil.example',
    'Thomas Mallory',
    'Thomas3',
    '',
  ];

  for (const junk of JUNK_FROM_VALUES) {
    test(`ignores a junk from value: ${junk || '(empty)'}`, async ({ page }) => {
      let dialogRaised = false;
      page.on('dialog', async (dialog) => {
        dialogRaised = true;
        await dialog.dismiss();
      });

      await page.goto(`/join/RBO246?from=${encodeURIComponent(junk)}`);

      await expect(
        page.getByRole('heading', { name: /invited to ride a Tesla on MyRoboTaxi/i }),
      ).toBeVisible();
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        'content',
        "You're invited to ride a Tesla",
      );

      if (junk) {
        // The two places the value would do damage: the HEAD, which is what
        // every scraper reads and caches on behalf of people who never opened
        // the link, and the rendered page itself.
        expect(await page.locator('head').innerHTML()).not.toContain(junk);
        expect(await page.locator('main').innerHTML()).not.toContain(junk);
      }

      // Next serializes the request URL into its own RSC flight payload, HTML-
      // escaped — framework behaviour on every route that reads searchParams,
      // and inert. The property that matters is that nothing in it RUNS.
      expect(dialogRaised).toBe(false);
    });
  }

  test('ignores a repeated from parameter rather than picking one', async ({ page }) => {
    await page.goto('/join/RBO246?from=Thomas&from=Mallory');

    await expect(
      page.getByRole('heading', { name: /invited to ride a Tesla on MyRoboTaxi/i }),
    ).toBeVisible();
  });

  test('serves link-preview metadata to scrapers, without the code', async ({ page }) => {
    await page.goto('/join/RBO246');

    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      "You're invited to ride a Tesla",
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    );

    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute('content');
    expect(ogImage).toContain('/og/invite-card.png');

    const head = await page.locator('head').innerHTML();
    expect(head).not.toContain('RBO246');
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
