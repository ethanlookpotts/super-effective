// spec: e2e/specs/gyms.md
// seed: e2e/seed.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.locator('.hamburger-btn').click();
  await page.locator('.drawer-item', { hasText: 'GYMS' }).click();
});

test('gyms tab renders all gym leaders', async ({ page }) => {
  await expect(page.locator('.gym-name', { hasText: 'Brock' })).toBeVisible();
  await expect(page.locator('.gym-name', { hasText: 'Misty' })).toBeVisible();
  await expect(page.locator('.gym-name', { hasText: 'Giovanni' })).toBeVisible();
});

test('rival section renders with starter selector', async ({ page }) => {
  await expect(page.locator('.rival-hd-title')).toBeVisible();
  await expect(page.locator('.starter-btn.s-bulbasaur')).toBeVisible();
  await expect(page.locator('.starter-btn.s-charmander')).toBeVisible();
  await expect(page.locator('.starter-btn.s-squirtle')).toBeVisible();
  await expect(page.locator('.gym-name', { hasText: 'Route 22' }).first()).toBeVisible();
});

test('rival starter selector swaps Gary team', async ({ page }) => {
  // Default starter = Bulbasaur → Gary has Charmander on Route 22
  const route22 = page.locator('#rc-0');
  await route22.locator('.gym-hd').click();
  await expect(route22.locator('.gym-poke-name', { hasText: 'Charmander' })).toBeVisible();

  // Switch to Charmander starter → Gary has Squirtle (re-open card after re-render)
  await page.locator('.starter-btn.s-charmander').click();
  await route22.locator('.gym-hd').click();
  await expect(route22.locator('.gym-poke-name', { hasText: 'Squirtle' })).toBeVisible();
});

test('rival starter persists across reload', async ({ page }) => {
  await page.locator('.starter-btn.s-squirtle').click();
  await expect(page.locator('.starter-btn.s-squirtle')).toHaveClass(/active/);

  await page.reload();
  await page.locator('.hamburger-btn').click();
  await page.locator('.drawer-item', { hasText: 'GYMS' }).click();
  await expect(page.locator('.starter-btn.s-squirtle')).toHaveClass(/active/);
});
