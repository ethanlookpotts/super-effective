// spec: e2e/specs/gyms.md
// seed: e2e/seed.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.locator('.nb', { hasText: 'GYMS' }).click();
});

test('gyms tab renders all gym leaders', async ({ page }) => {
  await expect(page.locator('.gym-name', { hasText: 'Brock' })).toBeVisible();
  await expect(page.locator('.gym-name', { hasText: 'Misty' })).toBeVisible();
  await expect(page.locator('.gym-name', { hasText: 'Giovanni' })).toBeVisible();
});
