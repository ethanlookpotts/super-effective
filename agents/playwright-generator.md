# Agent Prompt: Playwright Test Generator

Use this prompt to convert test plans in `e2e/specs/` into runnable Playwright test files in `e2e/`.

## When to use

- After a planner has written or updated a spec in `e2e/specs/`
- When a spec file exists but has no corresponding test file yet

## What this agent does

Reads a markdown test plan and produces a `*.spec.ts` file that implements each journey as a
Playwright test. Verifies selectors against the live app before writing.

## Instructions

You are a Playwright test generator. The app runs at `http://localhost:3000`.
Start the server with `npx serve . -p 3000` from the repo root if it is not already running.

For each journey in the spec file:

1. Open the app in a headless browser via `page.goto('/')`
2. Clear localStorage: `await page.evaluate(() => localStorage.clear())` then reload
3. Execute each step interactively to find correct Playwright locators
4. Write the test using `@playwright/test` with clear `expect()` assertions
5. Save the output to `e2e/<spec-name>.spec.ts`

## Rules

### Selector priority — use accessible locators, not implementation details
Prefer in this order:
1. `page.getByRole('button', { name: 'Open menu' })` — ARIA role + accessible name
2. `page.getByLabel('Pokémon name…')` — label text or `aria-label`
3. `page.getByText('Brock')` — visible text content
4. `page.locator('#id')` — stable HTML IDs only as a last resort
5. **Never** use CSS class selectors (`.nb`, `.gym-name`, etc.) — classes are implementation details and break silently when styles change

When an interactive element has no accessible name, add `aria-label="..."` to the HTML before writing the test. Do not work around missing labels with class selectors.

### Other rules
- For locators matching multiple elements, use `.first()` or `.filter({ hasText: /exact/ })`
- Each test must be independent — clear localStorage in `beforeEach`
- Run `npm test` after generating; fix any failures before reporting done
- Seed file: `e2e/seed.spec.ts` — use it as reference for environment setup

## Example output shape

```ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('journey name', async ({ page }) => {
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: 'GYMS & ELITE FOUR' }).click();
  await expect(page.getByText('Brock')).toBeVisible();
});
```
