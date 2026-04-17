# Status

As of the last commit on `refactor/react-tailwind`. Update this doc in the same commit that changes status.

## Done

### Infra
- [x] Vite + React 19 + TS strict scaffold, flat repo layout
- [x] Tailwind v4 with `@theme` tokens mapped from vanilla `style.css`
- [x] Biome lint + format + import-sort (only linter/formatter)
- [x] Vitest (4 repository + 49 party-calc tests = 53 total, all green)
- [x] CI workflow `.github/workflows/ci.yml` — Biome + tsc + Vitest + build on every PR
- [x] Pages deploy workflow `pages-deploy.yml` — main → `gh-pages` root
- [x] PR preview workflow `pages-preview.yml` — PR → `gh-pages/pr-preview/pr-N/`

### Data layer
- [x] Zod schemas: `Store`, `Playthrough`, `PartyMember`, `PartyMove`, `Settings`, `RecentPokemon`
- [x] `data/types.ts` — Gen III CHART + `gm` + `dmult` + PHYS
- [x] `data/pokemon.ts` — 151 `POKEMON` + `HOW` + `getObtain`
- [x] `data/evos.ts` — `EVOS` + `getEvoChain` (126 entries)
- [x] `data/stats.ts` — 151 `STATS` + natures + damage helpers
- [x] `data/moves.ts` — 354 `ALL_MOVES` + 232 `MOVE_DATA` entries + 50 TMs + 7 HMs
- [x] `data/learnsets.ts` — 151 learnset entries + `getLearnset`
- [x] `data/tutors.ts` — 18 `MOVE_TUTORS` + 2 `UTILITY_NPCS`
- [x] `data/bosses.ts` — 13 bosses + 6 rival encounters × 3 starters
- [x] `data/locations.ts` — 34 FRLG encounter areas
- [x] `data/abilities.ts` — ability modifier table
- [x] `data/games.ts` — game registry (FR/LG)
- [x] `lib/sprites.ts` — sprite / art URLs
- [x] `lib/colors.ts` — `tc(type)` helper
- [x] `lib/party-calc.ts` — pure scoring engine (49 unit tests)
- [x] `lib/damage.ts` — `applyAbilityMod` / `matchupBreakdown` / `moveBreakdown` + formatters (20 unit tests)

### Repositories + hooks
- [x] `LocalStorageStoreRepository` with legacy `se_v1` migrations
- [x] `InMemoryStoreRepository` for tests
- [x] `LocalStorageSettingsRepository`
- [x] `RepositoryProvider` context + `useRepositories` hook
- [x] `useStore` / `useSaveStore` / `useActivePlaythrough`
- [x] `useSettings` / `useSaveSettings`
- [x] `useCreatePlaythrough` / `useSwitchPlaythrough` / `useRenamePlaythrough` / `useDeletePlaythrough` / `useUpdateActivePlaythrough`

### Sync
- [x] `features/sync/gist-client.ts` — `fetchGist`, `pushGist`, `createGist`, `deleteGist`, `testToken`
- [x] `features/sync/use-sync.ts` — hook with pull/push/debounce/poll/conflict/disconnect
- [x] `features/sync/sync-context.tsx` — `SyncProvider` (singleton mount) + `useSyncContext` + `useMarkLocalChanged`
- [x] `features/sync/conflict-modal.tsx`
- [x] `markLocalChanged` wired into every store-mutating hook (`useSaveStore`, `useCreatePlaythrough`, `useSwitchPlaythrough`, `useRenamePlaythrough`, `useDeletePlaythrough`, `useUpdateActivePlaythrough`) — debounced push fires automatically when a GitHub token is configured

### OCR
- [x] `features/scan/vision-client.ts` — `readGameScreen`, `readTMCase`, `fuzzyMatchMove`, `ScanError`
- [x] `features/scan/scan-button.tsx` — shared button + hidden file input + `useSettings` token guard (redirects to `/settings` if no key)
- [x] `features/scan/game-screen.ts` — pure `mergeGameScreen` + `GameScreenAggregate` accumulator (first-found wins; tracks tokens)
- [x] `features/scan/scan-result-box.tsx` — rows + token/cost line + "↺ RESET TO SCAN"
- [x] Party edit modal: scan button + result box above the picker; batch merges fresh fields into draft and accumulates across shots
- [x] TMs route: `📷 SCAN TM CASE` merges `readTMCase` rows into `tmInventory` (max count wins); inline success/error summary with token cost

### UI — shell + navigation
- [x] `components/shell.tsx` — masthead + nav tabs + playthrough button + sync badge
- [x] `components/playthrough-menu.tsx` — create/switch/rename/delete + game picker
- [x] `components/type-badge.tsx`

### UI — routes
- [x] `routes/search.tsx` + 8 subcomponents — Pokémon + move detail, type filter, matchup, evolution chain, stat bars, breakdown overlay wiring
- [x] `routes/gyms.tsx` — all 13 bosses + 6 rivals, starter toggle
- [x] `routes/where-am-i.tsx` — 34 locations with filter
- [x] `routes/tms.tsx` — TMs + HMs + Tutors + HM Carrier ranking
- [x] `routes/settings.tsx` — theme + Claude key + gist sync + conflict modal

### Breakdown overlay
- [x] `components/breakdown-overlay.tsx` — accessible dialog (type-matchup rows, ability step, STAB, result block)
- [x] Type-matchup rows in Search detail open a matchup breakdown
- [x] Move chips in Party matchup list open a move breakdown (STAB-aware)

## Outstanding

### Party route ✅ DONE
See [03-phases.md](./03-phases.md) Phase 5.
- [x] `routes/party.tsx` — composition root (reads active playthrough, wires grid + coverage, consumes `?teach=` deep-link)
- [x] `routes/party/party-grid.tsx` — 6-slot grid with stable slot keys
- [x] `routes/party/party-slot.tsx` — filled + empty slot cards (sprite, name, level, types, move chips)
- [x] `routes/party/coverage-bar.tsx` — offensive type coverage strip (18 types)
- [x] `routes/party/edit-modal.tsx` — Pokémon picker, level, nature + computed stats, collapsible MOVES and INFO sections
- [x] `routes/party/edit-modal-moves.tsx` — moves picker (search + 18-type filter, learnset pool, Hidden Power type picker, max 4)
- [x] `routes/party/edit-modal-info.tsx` — ability / item / gender / shiny / ball / OT name+id / memo / in-game max stats grid
- [x] `routes/party/pc-box.tsx` — PC grid (collapsible, ADD NEW, remove w/ confirm, → party swap)
- [x] `routes/party/full-party-swap-modal.tsx` — reusable swap picker when party is full
- [x] `routes/party/suggestion-panel.tsx` — top-5 team suggestions from `calc.computeSuggestions` (strip + dialog + apply writes active playthrough)
- [x] `routes/party/tm-suggestion-panel.tsx` — top-6 `rankTeachTargets` rows (owned TMs/HMs/tutors, replaced→TM, cov/score delta, deep-link URL primed for edit modal)
- [x] Teach modal deep-link (`?teach=<dex>:<move>`) — TM suggestion rows navigate, PartyRoute consumes param, EditModal pre-queues the move

### E2E tests ✅ DONE
See [03-phases.md](./03-phases.md) Phase 8.
- [x] `@playwright/test` installed (pinned to `^1.56.0`), `e2e/` unignored in Biome
- [x] `e2e/fixtures.ts` — UUID seed id, shared `seedPlaythrough({ party, pc, tmInventory })` helper that writes directly to `se_v1`
- [x] Every spec walked against `npm run preview`: 90 passing, 8 parked as `test.fixme` — 3 for missing-in-React "Send to PC from search" UX, 4 for the sync conflict flow (needs a deterministic `useSync` test hook), 1 for the vanilla 3-column desktop party grid
- [x] Accessible-label touch-ups on React components to support role/label selectors: `aria-label="Current game"` on the masthead; `aria-label="Party page" / "Gyms page" / "TMs and HMs page" / "Where Am I page"` on route sections; `aria-label="Rival starter"` on the Gyms starter region; `aria-pressed` on starter buttons; `aria-label="Computed stats"` on the edit-modal summary; HM toggle label clarified to `Need HM01` / `Have HM01`
- [x] `.github/workflows/ci.yml` — new `e2e` job runs `npx playwright install --with-deps chromium`, builds, and invokes `npx playwright test`; uploads `playwright-report/` + `test-results/` on failure

### README screenshots ✅ DONE
See [03-phases.md](./03-phases.md) Phase 9.
- [x] `scripts/screenshot-readme.ts` + `npm run screenshots` — spawns `vite preview` on port 4174, seeds a full-party FireRed run into `se_v1`, and walks the React app at a 390×844 @2× mobile viewport in light mode
- [x] Regenerated all 4 tracked PNGs (`search-party-matchup.png`, `search-gengar-detail.png`, `gyms-misty-expanded.png`, `where-am-i-safari.png`); README image references resolve

## File inventory

Current repo (on branch):
- `src/` — ~50 files (+scan button/result-box/game-screen accumulator)
- `test/` — 3 files (73 tests: 4 repositories + 49 party-calc + 20 damage)
- `plan/` — this directory

Bundle (last measured, after route-level + learnsets code-splitting):
- `index.html` — 0.52 KB
- CSS — 23.2 KB / 5.3 KB gzip
- JS — 13 chunks, total ~608 KB / ~172 KB gzip
  - Initial entry: `index-*.js` 350 KB / 106 KB gzip (shell, router, providers, sync, vendor)
  - Per-route chunks: `search` 45 KB / 12 KB, `party` 47 KB / 12 KB, `gyms` 13 KB / 4 KB, `tms` 11 KB / 4 KB, `settings` 9 KB / 3 KB, `where-am-i` 7 KB / 2 KB gzip
  - Shared chunks pulled when a dependent route mounts: `sprites` (ALL_MOVES + MOVE_DATA) 35 KB / 10 KB, `pokemon` 12 KB / 3 KB, `party-calc` 9 KB / 4 KB, `type-badge` 0.7 KB / 0.5 KB gzip
  - `learnsets` 69 KB / 7 KB gzip — lazy-fetched via `useLearnsets` (React Query); consumed only when a component that reads learnsets mounts (Search move-detail, Party edit modal, Party TM suggestions, TMs page). Users who never view a move's learners pay zero.
  - No more Vite 500 KB chunk warning.
