import { test, expect } from '@playwright/test';

/**
 * Invites screen — authenticated user with seeded invites (2 accepted, 2 pending).
 */
test.describe('invites', () => {
  test('invites page loads with heading', async ({ page }) => {
    await page.goto('/invites');
    await expect(page.getByRole('heading', { name: 'Share Your Tesla' })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('shows active viewers and pending invites', async ({ page }) => {
    await page.goto('/invites');
    await expect(page.getByRole('heading', { name: 'Share Your Tesla' })).toBeVisible({
      timeout: 15_000,
    });

    // 2 accepted viewers (Mom, Alex) — use exact match to avoid matching emails
    await expect(page.getByText('Mom', { exact: true })).toBeVisible();
    await expect(page.getByText('Alex', { exact: true })).toBeVisible();

    // 2 pending invites (Jamie, Dad) — use exact match
    await expect(page.getByText('Jamie', { exact: true })).toBeVisible();
    await expect(page.getByText('Dad', { exact: true })).toBeVisible();
  });

  test('viewer count headers are correct', async ({ page }) => {
    await page.goto('/invites');
    await expect(page.getByRole('heading', { name: 'Share Your Tesla' })).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.getByText(/Viewers\s*·\s*2/i)).toBeVisible();
    await expect(page.getByText(/Pending\s*·\s*2/i)).toBeVisible();
  });

  test('revoke button is visible for accepted viewers', async ({ page }) => {
    await page.goto('/invites');
    await expect(page.getByRole('heading', { name: 'Share Your Tesla' })).toBeVisible({
      timeout: 15_000,
    });

    const revokeButtons = page.getByRole('button', { name: /revoke access/i });
    await expect(revokeButtons.first()).toBeVisible();
  });
});
