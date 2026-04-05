// spec: e2e/specs/search.md
// seed: e2e/seed.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByLabel('Search Pokémon')).toBeVisible();
});

test('search by name shows Pokémon detail card', async ({ page }) => {
  await page.getByLabel('Search Pokémon').fill('Pikachu');
  await page.getByRole('option', { name: 'Pikachu' }).click();
  await expect(page.getByRole('heading', { name: 'Pikachu' })).toBeVisible();
  await expect(page.getByText('Electric').first()).toBeVisible();
});

test('type filter pill browses Pokémon of that type', async ({ page }) => {
  await page.getByRole('button', { name: 'Electric' }).click();
  await expect(page.locator('#page-search').getByText('Pikachu', { exact: true })).toBeVisible();
});

test('switching type filter resets scroll to top', async ({ page }) => {
  await page.getByRole('button', { name: 'Electric' }).click();
  await expect(page.locator('#page-search').getByText('Pikachu', { exact: true })).toBeVisible();
  await page.evaluate(() => { document.getElementById('s-scroll').scrollTop = 9999; });
  await page.getByRole('button', { name: 'Fire' }).click();
  await expect(page.locator('#page-search').getByText('Charmander', { exact: true })).toBeVisible();
  const scrollTop = await page.evaluate(() => document.getElementById('s-scroll').scrollTop);
  expect(scrollTop).toBe(0);
});
