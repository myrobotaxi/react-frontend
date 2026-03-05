import { test, expect } from '@playwright/test';

/**
 * Drive history and drive summary — authenticated user with seeded drives.
 */
test.describe('drive history', () => {
  test('drive history page loads with heading', async ({ page }) => {
    await page.goto('/drives');
    await expect(page.getByRole('heading', { name: 'Drives' })).toBeVisible({ timeout: 15_000 });
  });

  test('drive list contains drive entries', async ({ page }) => {
    await page.goto('/drives');
    await expect(page.getByRole('heading', { name: 'Drives' })).toBeVisible({ timeout: 15_000 });

    const driveItems = page.getByTestId('drive-list-item');
    await expect(driveItems.first()).toBeVisible();
  });

  test('clicking a drive navigates to drive summary', async ({ page }) => {
    await page.goto('/drives');
    await expect(page.getByRole('heading', { name: 'Drives' })).toBeVisible({ timeout: 15_000 });

    const firstDrive = page.getByTestId('drive-list-item').first();
    await firstDrive.click();
    await expect(page).toHaveURL(/\/drives\/d\d/);
  });

  test('drive summary shows route details', async ({ page }) => {
    await page.goto('/drives/d1');
    // Use heading role to avoid strict mode violation (text appears in heading + timeline)
    await expect(
      page.getByRole('heading', { name: /Thompson Hotel to Domain Northside/ }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Distance')).toBeVisible();
  });

  test('back navigation returns to drive list', async ({ page }) => {
    await page.goto('/drives/d1');
    await expect(
      page.getByRole('heading', { name: /Thompson Hotel to Domain Northside/ }),
    ).toBeVisible({ timeout: 15_000 });

    const backLink = page.getByRole('link', { name: /back|drives/i }).first();
    await backLink.click();
    await expect(page.getByRole('heading', { name: 'Drives' })).toBeVisible();
  });
});
