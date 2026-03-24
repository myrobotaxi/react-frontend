import { test, expect } from '@playwright/test';

/**
 * Home screen — authenticated user with seeded vehicles.
 * Uses the saved auth session from the setup project.
 */
test.describe('home screen', () => {
  test('renders with vehicle name', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Midnight Runner')).toBeVisible({ timeout: 15_000 });
  });

  test('vehicle card carousel is visible with 2 cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Midnight Runner')).toBeVisible({ timeout: 15_000 });

    const cards = page.getByRole('tab');
    await expect(cards).toHaveCount(2);
  });

  test('tapping second card switches to Pearl', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Midnight Runner')).toBeVisible({ timeout: 15_000 });

    const secondCard = page.getByRole('tab', { name: /pearl/i });
    await secondCard.click();
    await expect(page.getByText('Pearl')).toBeVisible();
  });

  test('bottom sheet is visible with vehicle stats', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Midnight Runner')).toBeVisible({ timeout: 15_000 });

    const bottomSheet = page.getByRole('region', { name: /vehicle details/i });
    await expect(bottomSheet).toBeVisible();
  });

  test('refresh button is visible in bottom sheet', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Midnight Runner')).toBeVisible({ timeout: 15_000 });

    const refreshBtn = page.getByRole('button', { name: /refresh vehicle data/i });
    await expect(refreshBtn).toBeVisible();
  });
});
