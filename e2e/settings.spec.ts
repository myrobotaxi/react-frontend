import { test, expect } from '@playwright/test';

/**
 * Settings screen — toggles, sign out, persistence.
 */
test.describe('settings', () => {
  test('settings page loads with heading', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('shows profile, tesla status, and notification toggles', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({
      timeout: 15_000,
    });

    // Profile section
    await expect(page.getByText('Thomas Nandola')).toBeVisible();

    // Tesla Account section — linked via seeded Account record
    await expect(page.getByText(/Linked to/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Unlink' })).toBeVisible();

    // Notification toggles
    await expect(page.getByText('Drive started')).toBeVisible();
    await expect(page.getByText('Drive completed')).toBeVisible();
    await expect(page.getByText('Charging complete')).toBeVisible();
    await expect(page.getByText('Viewer joined')).toBeVisible();
  });

  test('notification toggles are interactive', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({
      timeout: 15_000,
    });

    // Get the first toggle and read its current state
    const firstToggle = page.getByRole('switch').first();
    const initialValue = await firstToggle.getAttribute('aria-checked');

    // Click to toggle — value should flip
    await firstToggle.click();
    const flippedValue = initialValue === 'true' ? 'false' : 'true';
    await expect(firstToggle).toHaveAttribute('aria-checked', flippedValue);

    // Click again — value should flip back
    await firstToggle.click();
    await expect(firstToggle).toHaveAttribute('aria-checked', initialValue!);
  });

  test('sign out button is visible', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
  });

  test('version text is displayed', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.getByText('MyRoboTaxi v1.0')).toBeVisible();
  });
});
