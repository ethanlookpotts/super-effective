// spec: e2e/specs/party.md
// seed: e2e/seed.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('#s-in')).toBeVisible();
});

test('add to party fills a party slot', async ({ page }) => {
  await page.fill('#s-in', 'Pikachu');
  await page.locator('.prow').first().click();
  await page.locator('.add-party-btn').click();
  await page.locator('.hamburger-btn').click();
  await page.locator('.drawer-item', { hasText: 'MY PARTY' }).click();
  await expect(page.locator('.pslot.filled')).toBeVisible();
  await expect(page.locator('.ps-name')).toHaveText('Pikachu');
});

test('IN PARTY button navigates to Party tab', async ({ page }) => {
  // Add Pikachu to party
  await page.fill('#s-in', 'Pikachu');
  await page.locator('.prow').first().click();
  await page.locator('.add-party-btn').click();
  // Re-select Pikachu — button should now say IN PARTY
  await page.fill('#s-in', 'Pikachu');
  await page.locator('.prow').first().click();
  await expect(page.locator('.add-party-btn.in-party')).toHaveText('✓ IN PARTY — VIEW PARTY ›');
  await page.locator('.add-party-btn.in-party').click();
  await expect(page.locator('#page-party')).toHaveClass(/active/);
});
