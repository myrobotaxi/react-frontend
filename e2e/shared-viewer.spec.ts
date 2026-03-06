import { test, expect } from '@playwright/test';

/**
 * Shared viewer page — standalone view without bottom nav.
 * The shared viewer renders a Mapbox map — requires WebGL (SwiftShader in headless).
 */
test.describe('shared viewer', () => {
  test('shared viewer page loads with vehicle info', async ({ page }) => {
    await page.goto('/shared/test-token');
    // The SharedViewerScreen renders vehicle data in the bottom sheet peek content
    await expect(page.getByText('Midnight Runner')).toBeVisible({ timeout: 15_000 });
  });

  test('no bottom nav visible on shared viewer', async ({ page }) => {
    await page.goto('/shared/test-token');
    await expect(page.getByText('Midnight Runner')).toBeVisible({ timeout: 15_000 });

    const nav = page.getByRole('navigation', { name: /main navigation/i });
    await expect(nav).not.toBeVisible();
  });
});
