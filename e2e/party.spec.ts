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
  await page.locator('.nb', { hasText: 'PARTY' }).click();
  await expect(page.locator('.pslot.filled')).toBeVisible();
  await expect(page.locator('.ps-name')).toHaveText('Pikachu');
});
