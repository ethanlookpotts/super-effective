// spec: e2e/specs/party.md
// seed: e2e/seed.spec.ts
import { test, expect } from './fixtures';

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

test('move picker shows learnset instantly with no loading state', async ({ page }) => {
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: 'MY PARTY' }).click();
  await page.getByText('ADD POKEMON').first().click();
  await page.getByRole('textbox', { name: 'Search Pokémon...' }).fill('Growlithe');
  await page.getByRole('option', { name: 'Growlithe' }).click();
  const moveSection = page.locator('#move-section');
  await expect(moveSection.getByText('LOADING MOVES')).not.toBeVisible();
  await expect(moveSection.getByText('Roar')).toBeVisible();
  await expect(moveSection.getByText('Take Down')).toBeVisible();
});

test('Hidden Power type selection', async ({ page }) => {
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: 'MY PARTY' }).click();
  await page.getByText('ADD POKEMON').first().click();
  await page.getByRole('textbox', { name: 'Search Pokémon...' }).fill('Pikachu');
  await page.getByRole('option', { name: 'Pikachu' }).click();
  // HP badge visible before type is chosen
  await expect(page.getByLabel('Hidden Power — select type')).toBeVisible();
  // Click Hidden Power to open type picker
  await page.getByLabel('Hidden Power — select type').click();
  await expect(page.getByLabel('Select Hidden Power type')).toBeVisible();
  // Choose Electric
  await page.getByLabel('Select Hidden Power type').getByText('Electric').click();
  // Type picker gone, move added as picked with Electric type
  await expect(page.getByLabel('Select Hidden Power type')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove Hidden Power' })).toBeVisible();
});
