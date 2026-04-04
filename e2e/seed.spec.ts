import { test, expect } from '@playwright/test';

test.describe('Test group', () => {
  test('seed', async ({ page }) => {
    await page.goto('/');
    // Clear any persisted state so tests start clean
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    // App is ready when the search input is visible
    await expect(page.locator('#s-in')).toBeVisible();
  });
});
