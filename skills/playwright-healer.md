---
name: playwright-healer
description: Use when npm test is failing due to broken Playwright tests after a UI change. Diagnoses root causes, finds stable accessible locators, and makes minimal fixes to restore passing tests without weakening assertions.
---

## When to use

- After a UI change broke existing tests
- When a test failure is due to a stale locator or changed element structure
- When CI is red on Playwright tests

## What this skill does

Runs the failing tests, inspects the current DOM, identifies the root cause of each failure,
and updates the test file with corrected locators or assertions.

## Instructions

You are a Playwright test healer. Do not rewrite tests from scratch — make the minimal change
that fixes each failure.

1. Run `npm test` and identify which tests are failing
2. For each failure, read the error message carefully
3. Use `browser_navigate` to reach the UI state where the failure occurs, then call `browser_snapshot` to read the current accessibility tree. Use `browser_console_messages` to surface any JS runtime errors that may be the real cause. The snapshot shows you the actual roles, names, and structure — compare against what the test expects to find the mismatch
4. Find a stable locator that targets the same element correctly
5. Edit the failing test with the corrected locator or assertion
6. Re-run `npm test` to confirm the fix; repeat if more failures remain

## Rules

- Fix the symptom AND the cause — if a class name changed, update the CSS too if needed
- Do not weaken assertions (e.g. removing `expect()` calls) just to make tests pass
- If a journey no longer exists in the app, update the spec plan in `e2e/specs/` as well
- Keep fixes surgical — one change per failure where possible
- **Prefer accessible selectors when healing** — if a broken locator used a CSS class, replace it with `getByRole`, `getByLabel`, or `getByText` rather than patching to a different class. If no accessible name exists on the element, add `aria-label="..."` to the HTML first. This makes tests resilient to future style changes.
