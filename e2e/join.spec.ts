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
