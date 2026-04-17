// spec: e2e/specs/search.md
// seed: e2e/seed.spec.ts
import { test, expect } from './fixtures';

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
});

test('evolution chain absent for Pokémon with no evolutions', async ({ page }) => {
  await page.getByLabel('Search Pokémon').fill('Tauros');
  await page.getByRole('option', { name: 'Tauros' }).click();
  await expect(page.locator('#s-scroll').getByText('EVOLUTION CHAIN')).not.toBeVisible();
});

test('EVOLVE button appears when party member can evolve', async ({ page }) => {
  await page.getByLabel('Search Pokémon').fill('Bulbasaur');
  await page.getByRole('option', { name: 'Bulbasaur' }).click();
  await page.getByRole('button', { name: /ADD TO PARTY/ }).click();
  await page.getByLabel('Search Pokémon').fill('Ivysaur');
  await page.getByRole('option', { name: 'Ivysaur' }).click();
  await expect(page.locator('#s-scroll').getByRole('button', { name: /EVOLVE Bulbasaur/ })).toBeVisible();
});

test('base stats section shows all 6 stats for a Pokémon', async ({ page }) => {
  await page.getByLabel('Search Pokémon').fill('Charizard');
  await page.getByRole('option', { name: 'Charizard' }).click();
  const stats = page.locator('.stats-section');
  await expect(stats).toBeVisible();
  await expect(stats.getByText('HP')).toBeVisible();
  await expect(stats.getByText('ATK')).toBeVisible();
  await expect(stats.getByText('SpA')).toBeVisible();
  await expect(stats.getByText('109')).toBeVisible(); // Charizard SpA
});

test('base stats info button opens explanation modal', async ({ page }) => {
  await page.getByLabel('Search Pokémon').fill('Charizard');
  await page.getByRole('option', { name: 'Charizard' }).click();
  await page.getByRole('button', { name: 'Base stats help' }).click();
  await expect(page.getByText('BASE STATS EXPLAINED')).toBeVisible();
  await expect(page.getByText('HP — Hit Points')).toBeVisible();
  await expect(page.getByText('SPE — Speed')).toBeVisible();
  // Recommendation shown for Charizard (SpA 109 > ATK 84)
  await expect(page.getByText(/Special attacker.*SpA 109/)).toBeVisible();
});

test('base stats info modal closes', async ({ page }) => {
  await page.getByLabel('Search Pokémon').fill('Pikachu');
  await page.getByRole('option', { name: 'Pikachu' }).click();
  await page.getByRole('button', { name: 'Base stats help' }).click();
  await expect(page.getByText('BASE STATS EXPLAINED')).toBeVisible();
  await page.locator('#stats-info-overlay').getByRole('button', { name: /CLOSE/ }).click();
  await expect(page.getByText('BASE STATS EXPLAINED')).not.toBeVisible();
});

test('party matchup shows stat category note and move power/effect', async ({ page }) => {
  // Add Charizard to party
  await page.getByLabel('Search Pokémon').fill('Charizard');
  await page.getByRole('option', { name: 'Charizard' }).click();
  await page.getByRole('button', { name: /ADD TO PARTY/ }).click();
  // Add Flamethrower via edit modal
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: 'MY PARTY' }).click();
  await page.getByRole('button', { name: 'Edit Charizard' }).click();
  await page.getByRole('button', { name: 'Moves section' }).click();
  await page.getByRole('textbox', { name: 'Search moves...' }).fill('Flamethrower');
  await page.locator('#move-section').getByText('Flamethrower').click();
  await page.getByRole('button', { name: /SAVE/ }).click();
  // Navigate back to search
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: 'SEARCH' }).click();
  // Search a Grass enemy — Charizard should be top suggestion
  await page.getByLabel('Search Pokémon').fill('Oddish');
  await page.getByRole('option', { name: 'Oddish' }).click();
  const scroll = page.locator('#s-scroll');
  // Stat note: Charizard SpA 109 > ATK 84 → SPE
  await expect(scroll.getByText('SPE · SpA 109')).toBeVisible();
  // Move row sub-line: power and effect
  await expect(scroll.getByText('95bp')).toBeVisible();
  await expect(scroll.getByText('burn 10%')).toBeVisible();
});

test('EVOLVE button swaps party member to next form', async ({ page }) => {
  await page.getByLabel('Search Pokémon').fill('Bulbasaur');
  await page.getByRole('option', { name: 'Bulbasaur' }).click();
  await page.getByRole('button', { name: /ADD TO PARTY/ }).click();
  await page.getByLabel('Search Pokémon').fill('Ivysaur');
  await page.getByRole('option', { name: 'Ivysaur' }).click();
  await page.locator('#s-scroll').getByRole('button', { name: /EVOLVE Bulbasaur/ }).click();
  await expect(page.locator('#s-scroll').getByRole('button', { name: /EVOLVE Ivysaur/ })).toBeVisible();
});

test('search by move name surfaces move in dropdown', async ({ page }) => {
  await page.getByLabel('Search Pokémon').fill('Flamethrower');
  const drop = page.locator('#s-drop');
  await expect(drop.getByText('MOVES')).toBeVisible();
  await expect(drop.getByRole('option', { name: 'Move Flamethrower' })).toBeVisible();
});

test('picking a move opens move detail with metadata', async ({ page }) => {
  await page.getByLabel('Search Pokémon').fill('Flamethrower');
  await page.getByRole('option', { name: 'Move Flamethrower' }).click();
  const scroll = page.locator('#s-scroll');
  await expect(scroll.getByRole('heading', { name: 'Flamethrower' })).toBeVisible();
  await expect(scroll.getByText('95', { exact: true })).toBeVisible();
  await expect(scroll.getByText('100%', { exact: true })).toBeVisible();
  await expect(scroll.getByText('burn 10%')).toBeVisible();
});

test('move detail lists Pokémon that can learn the move', async ({ page }) => {
  await page.getByLabel('Search Pokémon').fill('Flamethrower');
  await page.getByRole('option', { name: 'Move Flamethrower' }).click();
  const scroll = page.locator('#s-scroll');
  await expect(scroll.getByText(/WHO CAN LEARN/)).toBeVisible();
  await expect(scroll.getByText('Charmander', { exact: true })).toBeVisible();
  await expect(scroll.getByText('Charizard', { exact: true })).toBeVisible();
});

test('tapping a learner opens that Pokémon detail', async ({ page }) => {
  await page.getByLabel('Search Pokémon').fill('Flamethrower');
  await page.getByRole('option', { name: 'Move Flamethrower' }).click();
  await page.locator('#s-scroll').getByText('Charizard', { exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Charizard' })).toBeVisible();
});

test('move detail shows TM source when applicable', async ({ page }) => {
  await page.getByLabel('Search Pokémon').fill('Earthquake');
  await page.getByRole('option', { name: 'Move Earthquake' }).click();
  const scroll = page.locator('#s-scroll');
  await expect(scroll.getByText('TM / HM / TUTOR')).toBeVisible();
  await expect(scroll.getByText('TM26')).toBeVisible();
});
