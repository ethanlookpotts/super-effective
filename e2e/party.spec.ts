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
  await page.getByRole('button', { name: 'Moves section' }).click();
  const moveSection = page.locator('#move-section');
  await expect(moveSection.getByText('LOADING MOVES')).not.toBeVisible();
  await expect(moveSection.getByText('Roar')).toBeVisible();
  await expect(moveSection.getByText('Take Down')).toBeVisible();
});

test('edit modal sections are collapsed and disabled until Pokémon selected', async ({ page }) => {
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: 'MY PARTY' }).click();
  await page.getByText('ADD POKEMON').first().click();

  // Section headers visible but not interactive (no button role) before Pokémon picked
  await expect(page.getByRole('button', { name: 'Moves section' })).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Advanced stats section' })).not.toBeVisible();
  await expect(page.getByLabel('Moves section')).toBeVisible();
  await expect(page.getByLabel('Advanced stats section')).toBeVisible();

  // Select a Pokémon — sections become interactive
  await page.getByRole('textbox', { name: 'Search Pokémon...' }).fill('Pikachu');
  await page.getByRole('option', { name: 'Pikachu' }).click();
  await expect(page.getByRole('button', { name: 'Moves section' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Advanced stats section' })).toBeVisible();

  // Expand Moves — move search input appears
  await page.getByRole('button', { name: 'Moves section' }).click();
  await expect(page.getByRole('textbox', { name: 'Search moves...' })).toBeVisible();

  // Expand Advanced Stats — IV inputs appear
  await page.getByRole('button', { name: 'Advanced stats section' }).click();
  await expect(page.getByLabel('Attack IV', { exact: true })).toBeVisible();
});

test('advanced stats entry computes and saves stats', async ({ page }) => {
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: 'MY PARTY' }).click();
  await page.getByText('ADD POKEMON').first().click();
  await page.getByRole('textbox', { name: 'Search Pokémon...' }).fill('Pikachu');
  await page.getByRole('option', { name: 'Pikachu' }).click();
  await page.getByRole('button', { name: 'Advanced stats section' }).click();

  // Fill level, nature, and one IV
  await page.locator('#f-lv').fill('50');
  await page.locator('#f-nature').selectOption('Timid');
  await page.getByLabel('Attack IV', { exact: true }).fill('31');

  // Computed stats line shows precise values (no ~ prefix)
  await expect(page.locator('#adv-computed')).toContainText('ATK');
  await expect(page.locator('#adv-computed')).not.toContainText('~');

  // Save and reopen
  await page.getByRole('button', { name: /ADD TO PARTY/ }).click();
  await page.getByRole('button', { name: 'Edit Pikachu' }).click();
  await page.getByRole('button', { name: 'Advanced stats section' }).click();

  // Saved values persist
  await expect(page.locator('#f-lv')).toHaveValue('50');
  await expect(page.locator('#f-nature')).toHaveValue('Timid');
  await expect(page.getByLabel('Attack IV', { exact: true })).toHaveValue('31');
});

test('Hidden Power type selection', async ({ page }) => {
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: 'MY PARTY' }).click();
  await page.getByText('ADD POKEMON').first().click();
  await page.getByRole('textbox', { name: 'Search Pokémon...' }).fill('Pikachu');
  await page.getByRole('option', { name: 'Pikachu' }).click();
  await page.getByRole('button', { name: 'Moves section' }).click();
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
