import { test, expect } from '@playwright/test';

/**
 * The public status page (MYR-510).
 *
 * Run against a freshly pushed, unseeded database, so this suite exercises the
 * case that matters most and is hardest to check by looking: what the page says
 * when it knows nothing. Every component must read "No data" and the banner
 * must decline to claim health — a green page here would be the bug.
 *
 * No session and no beta cookie: a status page that needs either is unreadable
 * in the situation it exists for. (The third gate, the lockdown, is off for
 * this whole suite — see playwright.config.ts — and is unit-tested instead in
 * __tests__/lib/lockdown.test.ts.)
 */
test.describe('public status page', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('is readable with no session at all', async ({ page }) => {
    await page.goto('/status');

    await expect(page).toHaveURL(/\/status$/);
    await expect(page.getByRole('heading', { name: 'Service status' })).toBeVisible();
  });

  test('with no checks recorded, says so instead of claiming health', async ({ page }) => {
    await page.goto('/status');

    await expect(page.getByRole('heading', { name: 'Status unknown' })).toBeVisible();
    await expect(page.getByText('All systems operational')).toHaveCount(0);
    await expect(page.getByText('No checks recorded yet.')).toBeVisible();
  });

  test('lists every component we probe, each with no data', async ({ page }) => {
    await page.goto('/status');

    for (const name of ['Telemetry API', 'Real-time updates', 'Website and app links']) {
      const card = page
        .getByRole('article')
        .filter({ has: page.getByRole('heading', { name, exact: true }) });

      await expect(card).toHaveCount(1);
      await expect(card.getByText('No data', { exact: true }).first()).toBeVisible();
      await expect(card.getByText('Operational')).toHaveCount(0);
    }
  });

  test('shows an empty incident log without claiming a clean history', async ({ page }) => {
    await page.goto('/status');

    await expect(page.getByRole('heading', { name: 'Incident history' })).toBeVisible();
    await expect(
      page.getByText('No incidents have been written up here yet.'),
    ).toBeVisible();
  });

  test('publishes what it does and does not measure', async ({ page }) => {
    await page.goto('/status');

    await expect(page.getByRole('heading', { name: 'How this page works' })).toBeVisible();
    await expect(page.getByText(/two consecutive failed checks/)).toBeVisible();
  });
});

/**
 * The prober's endpoint. Vercel Cron authenticates with a bearer secret; a
 * browser has none, so the one thing a public E2E run can prove is that the
 * endpoint refuses it — and that the proxy lets the request reach the handler
 * to be refused, rather than bouncing it to /signin.
 */
test.describe('status cron endpoint', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('refuses an unauthenticated caller with 401, not a redirect', async ({ request }) => {
    const response = await request.get('/api/cron/status', { maxRedirects: 0 });

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ error: 'unauthorized' });
  });
});
