// spec: e2e/specs/gyms.md
// seed: e2e/seed.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: /GYMS/ }).click();
});

test('gyms tab renders all gym leaders', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Expand Brock' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Expand Misty' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Expand Giovanni' })).toBeVisible();
});

test('rival section renders with starter selector', async ({ page }) => {
  await expect(page.getByText(/GARY/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Bulbasaur/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Charmander/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Squirtle/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Expand Route 22' }).first()).toBeVisible();
});

test('rival starter selector swaps Gary team', async ({ page }) => {
  // Default starter = Bulbasaur → Gary has Charmander on Route 22
  await page.getByRole('button', { name: 'Expand Route 22' }).first().click();
  await expect(page.getByRole('button', { name: 'Charmander Lv.9' })).toBeVisible();

  // Switch to Charmander starter → Gary has Squirtle (card re-renders closed)
  await page.getByRole('button', { name: /Charmander/ }).first().click();
  await page.getByRole('button', { name: 'Expand Route 22' }).first().click();
  await expect(page.getByRole('button', { name: 'Squirtle Lv.9' })).toBeVisible();
});

test('rival starter persists across reload', async ({ page }) => {
  await page.getByRole('button', { name: /Squirtle/ }).click();
  await expect(page.getByRole('button', { name: /Squirtle/ })).toHaveClass(/active/);

  await page.reload();
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: /GYMS/ }).click();
  await expect(page.getByRole('button', { name: /Squirtle/ })).toHaveClass(/active/);
});
