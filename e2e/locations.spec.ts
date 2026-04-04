// spec: e2e/specs/locations.md
// seed: e2e/seed.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.locator('.nb', { hasText: 'WHERE AM I' }).click();
});

test('where am I tab renders location list', async ({ page }) => {
  await expect(page.locator('.lcn', { hasText: 'Viridian Forest' })).toBeVisible();
  await expect(page.locator('.lcn', { hasText: 'Safari Zone' })).toBeVisible();
});
