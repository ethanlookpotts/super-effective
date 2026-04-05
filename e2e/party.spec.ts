// spec: e2e/specs/party.md
// seed: e2e/seed.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByLabel('Search Pokémon')).toBeVisible();
});

test('add to party fills a party slot', async ({ page }) => {
  await page.getByLabel('Search Pokémon').fill('Pikachu');
  await page.getByRole('option', { name: 'Pikachu' }).click();
  await page.getByRole('button', { name: /ADD TO PARTY/ }).click();
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: 'MY PARTY' }).click();
  await expect(page.getByRole('button', { name: 'Edit Pikachu' })).toBeVisible();
});

test('IN PARTY button navigates to Party tab', async ({ page }) => {
  await page.getByLabel('Search Pokémon').fill('Pikachu');
  await page.getByRole('option', { name: 'Pikachu' }).click();
  await page.getByRole('button', { name: /ADD TO PARTY/ }).click();
  // Re-select Pikachu — button should now say IN PARTY
  await page.getByLabel('Search Pokémon').fill('Pikachu');
  await page.getByRole('option', { name: 'Pikachu' }).click();
  await expect(page.getByRole('button', { name: /IN PARTY/ })).toHaveText('✓ IN PARTY — VIEW PARTY ›');
  await page.getByRole('button', { name: /IN PARTY/ }).click();
  await expect(page.getByRole('button', { name: 'Edit Pikachu' })).toBeVisible();
});
