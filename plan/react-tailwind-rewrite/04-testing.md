# Testing

## Unit tests — Vitest

Location: `test/*.test.ts`. Run with `npm test`.

Current suites:
- `test/repositories.test.ts` — 4 tests. Round-trip + Zod boundary rejection for the in-memory repos.
- `test/party-calc.test.ts` — 49 tests across 12 describe blocks covering every method on the `PartyCalc` interface: `bst`, `countOffCov`, `unresistedCov`, `individualScore`, `marginalScore`, `scoreTeam`, `buildGreedyTeam`, `computeSuggestions`, damage-aware scoring, `computeTeachImpact`, `rankTeachTargets`, `computeHMCarriers`.

Import from `~/` (src alias). No `node:vm` hacks, no dual-export files.

### When to add unit tests

Add a matching `test/<module>.test.ts` whenever you add a pure-logic module. **Pure** = no DOM, no fetch, no React. If it does need React, write a component test later in Phase 8.

### Coverage priorities

- Every new pure helper → tests for happy path + edge case (empty input, single element, max-size input)
- Every schema migration → a test with the pre-migration payload as a string fixture + assertion that `loadStore()` returns the migrated shape

## E2E tests — Playwright

Location: `e2e/*.spec.ts`. Currently **disabled in CI** (ignored by Biome, no CI job) until Phase 8.

### Selector convention (non-negotiable)

| Preferred | Avoid |
|---|---|
| `getByRole('button', { name: 'Open menu' })` | `.locator('.hamburger-btn')` |
| `getByLabel('Pokémon name…')` | `.locator('#s-in')` |
| `getByText('Brock')` | `.locator('.gym-name')` |

Rules:
- Use `getByRole` / `getByLabel` / `getByText` as the default
- Use `locator('#id')` only for stable semantic IDs (form fields)
- **Never** use CSS class selectors — they are implementation details
- If an element has no accessible name, add `aria-label="..."` to the JSX before writing the test

### Workflow

1. Add a plan to `e2e/specs/*.md` (human-readable)
2. Generate the spec with the `playwright-generator` skill
3. Broke? Use the `playwright-healer` skill

### What re-porting looks like (Phase 8)

Most vanilla E2E specs already use accessible locators (Session 28 work on main). The port will mostly be:
- Update any `.drawer-nav` / `.pslot.empty-s` / `.party-grid` selectors that snuck back
- Adjust selector for React-specific DOM differences (e.g. the playthrough menu is a `<dialog>` now)
- Verify each scenario still passes against `npm run preview`

### Running locally

```bash
npm run build && npm run preview    # terminal 1
npx playwright install chromium     # once
npx playwright test                 # terminal 2
```

## CI gates

`.github/workflows/ci.yml` on every PR + main push:

1. `biome check . --reporter=github` — lint + format + import-sort; annotates PRs inline
2. `tsc -b --noEmit` — strict typecheck
3. `vitest run` — unit tests
4. `vite build` — production bundle

All four must pass. Playwright will join this list in Phase 8.
