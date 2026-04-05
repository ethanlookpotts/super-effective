import { test as base, expect } from '@playwright/test';

export { expect };

export const SEED_STORE = JSON.stringify({
  playthroughs: [{ id: 'seed-001', name: 'RUN 1', gameId: 'frlg-fr', party: [], recents: [] }],
  activePtId: 'seed-001'
});

/**
 * Extends the Playwright `page` fixture to seed localStorage with a valid
 * FireRed playthrough before each test, so the game gate never blocks.
 * Tests that specifically test the gate can clear localStorage themselves.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto('/');
    await page.evaluate((store: string) => {
      localStorage.clear();
      localStorage.setItem('se_v1', store);
    }, SEED_STORE);
    await page.reload();
    await page.getByLabel('Search Pokémon').waitFor({ state: 'visible' });
    await use(page);
  },
});
