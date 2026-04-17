// spec: e2e/specs/playthrough.md
// seed: e2e/seed.spec.ts
import { test, expect } from './fixtures';

test('rename a playthrough updates the masthead', async ({ page }) => {
  await page.getByRole('button', { name: 'Switch playthrough' }).click();
  await page.getByRole('button', { name: /Rename/ }).click();
  await page.getByLabel('Rename playthrough').fill('NUZLOCKE');
  await page.getByLabel('Rename playthrough').press('Enter');
  await page.getByRole('button', { name: /CLOSE/ }).click();
  await expect(page.getByRole('button', { name: 'Switch playthrough' })).toContainText('NUZLOCKE');
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
  await expect(page.getByLabel('Current game')).toContainText('FIRERED');
});

test('new run game picker shows game options', async ({ page }) => {
  await page.getByRole('button', { name: 'Switch playthrough' }).click();
  await page.getByRole('button', { name: '＋ NEW RUN' }).click();
  await expect(page.getByRole('button', { name: /FIRERED/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /LEAFGREEN/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /BACK/ })).toBeVisible();
});

test('new run with LeafGreen updates masthead to LeafGreen', async ({ page }) => {
  await page.getByRole('button', { name: 'Switch playthrough' }).click();
  await page.getByRole('button', { name: '＋ NEW RUN' }).click();
  await page.getByRole('button', { name: /LEAFGREEN/ }).click();
  await expect(page.getByLabel('Current game')).toContainText('LEAFGREEN');
});

test('FR-exclusive Pokémon shows not obtainable on LeafGreen run', async ({ page }) => {
  await page.getByRole('button', { name: 'Switch playthrough' }).click();
  await page.getByRole('button', { name: '＋ NEW RUN' }).click();
  await page.getByRole('button', { name: /LEAFGREEN/ }).click();
  await page.getByLabel('Search Pokémon').fill('Ekans');
  await page.getByRole('option', { name: 'Ekans' }).click();
  await expect(page.getByText('Not obtainable in this version')).toBeVisible();
});
