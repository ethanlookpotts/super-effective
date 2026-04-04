// spec: e2e/specs/playthrough.md
// seed: e2e/seed.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('#s-in')).toBeVisible();
});

test('rename a playthrough updates the masthead', async ({ page }) => {
  await page.locator('#mast-pt-btn').click();
  const input = page.locator('.pt-name-input').first();
  await input.fill('NUZLOCKE');
  await input.press('Enter');
  await page.locator('#pt-overlay .modal-x').click();
  await expect(page.locator('#mast-pt-label')).toHaveText('NUZLOCKE');
});
