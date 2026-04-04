// spec: e2e/specs/search.md
// seed: e2e/seed.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('#s-in')).toBeVisible();
});

test('search by name shows Pokémon detail card', async ({ page }) => {
  await page.fill('#s-in', 'Pikachu');
  await page.locator('.prow').first().click();
  await expect(page.locator('.pc-name')).toHaveText('Pikachu');
  await expect(page.locator('.pc-types .tb.t-Electric')).toBeVisible();
});

test('type filter pill browses Pokémon of that type', async ({ page }) => {
  await page.locator('.tpill.t-Electric').click();
  await expect(page.locator('.browse-card').first()).toBeVisible();
  await expect(page.locator('.bc-name', { hasText: 'Pikachu' })).toBeVisible();
});

test('switching type filter resets scroll to top', async ({ page }) => {
  await page.locator('.tpill.t-Electric').click();
  await expect(page.locator('.browse-card').first()).toBeVisible();
  await page.evaluate(() => { document.getElementById('s-scroll').scrollTop = 9999; });
  await page.locator('.tpill.t-Fire').click();
  await expect(page.locator('.browse-card').first()).toBeVisible();
  const scrollTop = await page.evaluate(() => document.getElementById('s-scroll').scrollTop);
  expect(scrollTop).toBe(0);
});
