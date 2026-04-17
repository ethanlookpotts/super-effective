import { test, expect, SEED_STORE } from './fixtures';

test.describe('Test group', () => {
  test('seed', async ({ page }) => {
    await expect(page.getByLabel('Search Pokémon')).toBeVisible();
  });
});
