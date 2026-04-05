// spec: e2e/specs/playthrough.md
// seed: e2e/seed.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByLabel('Search Pokémon')).toBeVisible();
});

test('rename a playthrough updates the masthead', async ({ page }) => {
  await page.locator('#mast-pt-btn').click();
  await page.locator('#pt-overlay').getByRole('textbox').fill('NUZLOCKE');
  await page.locator('#pt-overlay').getByRole('textbox').press('Enter');
  await page.getByRole('button', { name: /CLOSE/ }).click();
  await expect(page.locator('#mast-pt-label')).toContainText('NUZLOCKE');
});
