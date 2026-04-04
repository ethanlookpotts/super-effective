// spec: e2e/specs/critical-journeys.md
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

test('add to party fills a party slot', async ({ page }) => {
  await page.fill('#s-in', 'Pikachu');
  await page.locator('.prow').first().click();
  await page.locator('.add-party-btn').click();
  await page.locator('.nb', { hasText: 'PARTY' }).click();
  await expect(page.locator('.pslot.filled')).toBeVisible();
  await expect(page.locator('.ps-name')).toHaveText('Pikachu');
});

test('gyms tab renders all gym leaders', async ({ page }) => {
  await page.locator('.nb', { hasText: 'GYMS' }).click();
  await expect(page.locator('.gym-name', { hasText: 'Brock' })).toBeVisible();
  await expect(page.locator('.gym-name', { hasText: 'Misty' })).toBeVisible();
  await expect(page.locator('.gym-name', { hasText: 'Giovanni' })).toBeVisible();
});

test('where am I tab renders location list', async ({ page }) => {
  await page.locator('.nb', { hasText: 'WHERE AM I' }).click();
  await expect(page.locator('.lcn', { hasText: 'Viridian Forest' })).toBeVisible();
  await expect(page.locator('.lcn', { hasText: 'Safari Zone' })).toBeVisible();
});
