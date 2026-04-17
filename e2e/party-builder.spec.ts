// spec: e2e/specs/party-builder.md
import { test, expect } from './fixtures';

// Helper: send N Pokémon to PC via the JS API
async function seedPC(page: import('@playwright/test').Page, dexNums: number[]) {
  await page.evaluate((nums: number[]) => {
    nums.forEach((n: number) => (window as any).addToPC(n));
  }, dexNums);
}

test('send Pokémon to PC from search', async ({ page }) => {
  await page.getByLabel('Search Pokémon').fill('Pikachu');
  await page.getByRole('option', { name: 'Pikachu' }).click();
  await expect(page.getByRole('button', { name: '📦 SEND TO PC' })).toBeVisible();
  await page.getByRole('button', { name: '📦 SEND TO PC' }).click();
  // Button switches to inactive "IN PC BOX"
  await expect(page.getByRole('button', { name: '📦 IN PC BOX' })).toBeVisible();
});

test('PC Box shows caught count after adding from search', async ({ page }) => {
  await page.getByLabel('Search Pokémon').fill('Charizard');
  await page.getByRole('option', { name: 'Charizard' }).click();
  await page.getByRole('button', { name: '📦 SEND TO PC' }).click();
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: '🎒 MY PARTY' }).click();
  await expect(page.getByText('(1 CAUGHT)')).toBeVisible();
  await expect(page.getByRole('region', { name: 'PC Box' }).getByText('Charizard')).toBeVisible();
});

test('IN PC BOX button is inactive when Pokémon already in PC', async ({ page }) => {
  await page.getByLabel('Search Pokémon').fill('Pikachu');
  await page.getByRole('option', { name: 'Pikachu' }).click();
  await page.getByRole('button', { name: '📦 SEND TO PC' }).click();
  // Re-open Pikachu detail
  await page.getByLabel('Search Pokémon').fill('Pikachu');
  await page.getByRole('option', { name: 'Pikachu' }).click();
  const inPcBtn = page.getByRole('button', { name: '📦 IN PC BOX' });
  await expect(inPcBtn).toBeVisible();
  await expect(inPcBtn).toBeDisabled();
});

test('move Pokémon from PC to party (party not full)', async ({ page }) => {
  await seedPC(page, [25]); // Pikachu
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: 'MY PARTY' }).click();
  await page.getByRole('button', { name: 'Move Pikachu to party' }).click();
  // Pikachu now appears in party
  await expect(page.getByRole('button', { name: 'Edit Pikachu' })).toBeVisible();
  // PC is empty
  await expect(page.getByText('(0 CAUGHT)')).toBeVisible();
});

test('remove Pokémon from PC — cancel then confirm', async ({ page }) => {
  await seedPC(page, [25]); // Pikachu
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: 'MY PARTY' }).click();
  // Tap ✕ to enter confirm state
  await page.getByRole('button', { name: 'Remove Pikachu from PC' }).click();
  await expect(page.getByRole('button', { name: 'YES' })).toBeVisible();
  // Cancel
  await page.getByRole('button', { name: 'NO' }).click();
  await expect(page.getByRole('region', { name: 'PC Box' }).getByText('Pikachu')).toBeVisible();
  // Confirm removal
  await page.getByRole('button', { name: 'Remove Pikachu from PC' }).click();
  await page.getByRole('button', { name: 'YES' }).click();
  await expect(page.getByText('(0 CAUGHT)')).toBeVisible();
});

test('PC Box collapses and expands', async ({ page }) => {
  await seedPC(page, [25]);
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: 'MY PARTY' }).click();
  await expect(page.getByRole('region', { name: 'PC Box' }).getByText('Pikachu')).toBeVisible();
  // Collapse
  await page.getByRole('button', { name: 'Toggle PC Box' }).click();
  await expect(page.getByRole('region', { name: 'PC Box' }).getByText('Pikachu')).not.toBeVisible();
  // Expand
  await page.getByRole('button', { name: 'Toggle PC Box' }).click();
  await expect(page.getByRole('region', { name: 'PC Box' }).getByText('Pikachu')).toBeVisible();
});

test('no suggestions shown when no Pokémon available', async ({ page }) => {
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: 'MY PARTY' }).click();
  await expect(page.getByText(/SUGGESTED PARTIES/)).not.toBeVisible();
});

test('suggestion strip cards appear with Pokémon in PC', async ({ page }) => {
  await seedPC(page, [6, 9, 3, 94, 65, 131]);
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: 'MY PARTY' }).click();
  await expect(page.getByRole('button', { name: /Suggestion 1/ })).toBeVisible();
});

test('suggestion uses party + PC as combined pool', async ({ page }) => {
  // 3 in party, 3 in PC — should still produce a valid suggestion
  await page.evaluate(() => {
    [6, 9, 3].forEach((n: number) => (window as any).addToParty(n));
    [94, 65, 131].forEach((n: number) => (window as any).addToPC(n));
    (window as any).showPage('party');
  });
  await expect(page.getByRole('button', { name: /Suggestion 1/ })).toBeVisible();
  await page.getByRole('button', { name: /Suggestion 1/ }).click();
  await expect(page.getByText(/\d+\/18 COVERED/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'USE THIS PARTY' })).toBeVisible();
});

test('suggestion modal shows coverage score and sprites', async ({ page }) => {
  await seedPC(page, [6, 9, 3, 94, 65, 131]);
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: 'MY PARTY' }).click();
  await page.getByRole('button', { name: /Suggestion 1/ }).click();
  // Modal title shows coverage score
  await expect(page.getByText(/OPTION 1 · \d+\/18 COVERED/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'USE THIS PARTY' })).toBeVisible();
});

test('applying a suggestion fills the party and empties the PC', async ({ page }) => {
  await seedPC(page, [6, 9, 3, 94, 65, 131]);
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: 'MY PARTY' }).click();
  await page.getByRole('button', { name: /Suggestion 1/ }).click();
  await page.getByRole('button', { name: 'USE THIS PARTY' }).click();
  // Modal closed, party has 6 filled slots
  await expect(page.getByText('6 / 6 IN PARTY')).toBeVisible();
  // PC is now empty (suggested Pokémon moved to party)
  await expect(page.getByText('(0 CAUGHT)')).toBeVisible();
});
