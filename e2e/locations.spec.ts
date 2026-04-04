// spec: e2e/specs/locations.md
// seed: e2e/seed.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.locator('.hamburger-btn').click();
  await page.locator('.drawer-item', { hasText: 'WHERE AM I' }).click();
});

test('where am I tab renders location list', async ({ page }) => {
  await expect(page.locator('.lcn', { hasText: 'Viridian Forest' })).toBeVisible();
  await expect(page.locator('.lcn', { hasText: 'Safari Zone' })).toBeVisible();
});

test('TMs page is reachable from drawer', async ({ page }) => {
  await page.locator('.hamburger-btn').click();
  await page.locator('.drawer-item', { hasText: 'TMs' }).click();
  await expect(page.locator('#page-tms')).toHaveClass(/active/);
  await expect(page.locator('.tm-card').first()).toBeVisible();
});

test('TM search by move name shows TM card', async ({ page }) => {
  await page.locator('.hamburger-btn').click();
  await page.locator('.drawer-item', { hasText: 'TMs' }).click();
  await page.locator('#tms-in').fill('earthquake');
  await expect(page.locator('.tm-card-num', { hasText: 'TM26' })).toBeVisible();
  await expect(page.locator('.tm-card-move', { hasText: 'Earthquake' })).toBeVisible();
  await expect(page.locator('.tm-card-loc', { hasText: 'Viridian Gym' })).toBeVisible();
});

test('TM search by number shows TM card', async ({ page }) => {
  await page.locator('.hamburger-btn').click();
  await page.locator('.drawer-item', { hasText: 'TMs' }).click();
  await page.locator('#tms-in').fill('tm26');
  await expect(page.locator('.tm-card-move', { hasText: 'Earthquake' })).toBeVisible();
});
