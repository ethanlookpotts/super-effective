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

test('evolution chain shows full linear chain with condition', async ({ page }) => {
  await page.getByLabel('Search Pokémon').fill('Bulbasaur');
  await page.getByRole('option', { name: 'Bulbasaur' }).click();
  await expect(page.locator('#s-scroll').getByText('EVOLUTION CHAIN')).toBeVisible();
  await expect(page.locator('#s-scroll').getByRole('button', { name: 'View Ivysaur' })).toBeVisible();
  await expect(page.locator('#s-scroll').getByRole('button', { name: 'View Venusaur' })).toBeVisible();
  await expect(page.locator('#s-scroll').getByText('Lv.16')).toBeVisible();
});

test('evolution chain stage click navigates to that Pokémon', async ({ page }) => {
  await page.getByLabel('Search Pokémon').fill('Bulbasaur');
  await page.getByRole('option', { name: 'Bulbasaur' }).click();
  await page.locator('#s-scroll').getByRole('button', { name: 'View Ivysaur' }).click();
  await expect(page.getByRole('heading', { name: 'Ivysaur' })).toBeVisible();
});

test('evolution chain shows all stages for middle-stage Pokémon', async ({ page }) => {
  await page.getByLabel('Search Pokémon').fill('Ivysaur');
  await page.getByRole('option', { name: 'Ivysaur' }).click();
  await expect(page.locator('#s-scroll').getByRole('button', { name: 'View Bulbasaur' })).toBeVisible();
  await expect(page.locator('#s-scroll').getByRole('button', { name: 'View Venusaur' })).toBeVisible();
  await expect(page.locator('#s-scroll').getByText('Lv.32')).toBeVisible();
});

test('evolution chain absent for Pokémon with no evolutions', async ({ page }) => {
  await page.getByLabel('Search Pokémon').fill('Tauros');
  await page.getByRole('option', { name: 'Tauros' }).click();
  await expect(page.getByRole('heading', { name: 'Tauros' })).toBeVisible();
  await expect(page.locator('#s-scroll').getByText('EVOLUTION CHAIN')).not.toBeVisible();
});

test('EVOLVE button appears when party member can evolve', async ({ page }) => {
  await page.getByLabel('Search Pokémon').fill('Charmander');
  await page.getByRole('option', { name: 'Charmander' }).click();
  await page.getByRole('button', { name: /ADD TO PARTY/ }).click();
  await page.getByLabel('Search Pokémon').fill('Charmander');
  await page.getByRole('option', { name: 'Charmander' }).click();
  await expect(page.getByRole('button', { name: /EVOLVE Charmander → Charmeleon/ })).toBeVisible();
});

test('EVOLVE button swaps party member to next form', async ({ page }) => {
  await page.getByLabel('Search Pokémon').fill('Charmander');
  await page.getByRole('option', { name: 'Charmander' }).click();
  await page.getByRole('button', { name: /ADD TO PARTY/ }).click();
  await page.getByLabel('Search Pokémon').fill('Charmander');
  await page.getByRole('option', { name: 'Charmander' }).click();
  await page.getByRole('button', { name: /EVOLVE Charmander → Charmeleon/ }).click();
  await expect(page.getByRole('heading', { name: 'Charmeleon' })).toBeVisible();
});
