// spec: e2e/specs/locations.md
// seed: e2e/seed.spec.ts
import { test, expect } from './fixtures';

test.beforeEach(async ({ page }) => {
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: 'WHERE AM I' }).click();
});

test('where am I tab renders location list', async ({ page }) => {
  await expect(page.getByText('Viridian Forest')).toBeVisible();
  await expect(page.locator('#page-location').getByText('Safari Zone')).toBeVisible();
});

test('TMs page is reachable from drawer', async ({ page }) => {
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: /TMs/ }).click();
  await expect(page.locator('#page-tms').getByText('TMs & HMs')).toBeVisible();
  await expect(page.getByText('TM01')).toBeVisible();
});

test('TM search by move name shows TM card', async ({ page }) => {
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: /TMs/ }).click();
  await page.getByPlaceholder('Move name or TM number…').fill('earthquake');
  await expect(page.getByText('TM26')).toBeVisible();
  await expect(page.getByText('Earthquake')).toBeVisible();
  await expect(page.getByText(/Viridian Gym/)).toBeVisible();
});

test('TM search by number shows TM card', async ({ page }) => {
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: /TMs/ }).click();
  await page.getByPlaceholder('Move name or TM number…').fill('tm26');
  await expect(page.getByText('Earthquake')).toBeVisible();
});
