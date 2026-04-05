// spec: e2e/specs/playthrough.md
// seed: e2e/seed.spec.ts
import { test, expect } from '@playwright/test';

const SEED_STORE = JSON.stringify({
  playthroughs: [{ id: 'seed-001', name: 'RUN 1', gameId: 'frlg-fr', party: [], recents: [] }],
  activePtId: 'seed-001'
});

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate((store) => {
    localStorage.clear();
    localStorage.setItem('se_v1', store);
  }, SEED_STORE);
  await page.reload();
  await expect(page.getByLabel('Search Pokémon')).toBeVisible();
});

test('rename a playthrough updates the masthead', async ({ page }) => {
  await page.locator('#mast-pt-btn').click();
  await page.getByRole('button', { name: /Rename/ }).click();
  await page.getByLabel('Rename playthrough').fill('NUZLOCKE');
  await page.getByLabel('Rename playthrough').press('Enter');
  await page.getByRole('button', { name: /CLOSE/ }).click();
  await expect(page.locator('#mast-pt-label')).toContainText('NUZLOCKE');
});

test('first-run game gate shows on empty localStorage', async ({ page }) => {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByText('CHOOSE YOUR GAME TO BEGIN')).toBeVisible();
  await expect(page.getByRole('button', { name: /FIRERED/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /LEAFGREEN/ })).toBeVisible();
});

test('selecting a game from the gate loads the app', async ({ page }) => {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: /FIRERED/ }).click();
  await expect(page.getByLabel('Search Pokémon')).toBeVisible();
  await expect(page.locator('#mast-game')).toContainText('FIRERED');
});

test('new run game picker shows game options', async ({ page }) => {
  await page.locator('#mast-pt-btn').click();
  await page.getByRole('button', { name: '＋ NEW RUN' }).click();
  await expect(page.getByRole('button', { name: /FIRERED/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /LEAFGREEN/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /BACK/ })).toBeVisible();
});

test('new run with LeafGreen updates masthead to LeafGreen', async ({ page }) => {
  await page.locator('#mast-pt-btn').click();
  await page.getByRole('button', { name: '＋ NEW RUN' }).click();
  await page.getByRole('button', { name: /LEAFGREEN/ }).click();
  await expect(page.locator('#mast-game')).toContainText('LEAFGREEN');
});

test('FR-exclusive Pokémon shows not obtainable on LeafGreen run', async ({ page }) => {
  // Switch to LeafGreen run
  await page.locator('#mast-pt-btn').click();
  await page.getByRole('button', { name: '＋ NEW RUN' }).click();
  await page.getByRole('button', { name: /LEAFGREEN/ }).click();
  // Search for Ekans (FireRed exclusive)
  await page.getByLabel('Search Pokémon').fill('Ekans');
  await page.getByRole('option', { name: 'Ekans' }).click();
  await expect(page.getByText('Not obtainable in this version')).toBeVisible();
});
