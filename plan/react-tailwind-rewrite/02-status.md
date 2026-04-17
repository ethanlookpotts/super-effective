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
- [x] `features/sync/conflict-modal.tsx`

### OCR
- [x] `features/scan/vision-client.ts` — `readGameScreen`, `readTMCase`, `fuzzyMatchMove`, `ScanError`
- [ ] UI wiring — Scan button on Party + TMs routes; scan result display; token-guard redirect

### UI — shell + navigation
- [x] `components/shell.tsx` — masthead + nav tabs + playthrough button + sync badge
- [x] `components/playthrough-menu.tsx` — create/switch/rename/delete + game picker
- [x] `components/type-badge.tsx`

### UI — routes
- [x] `routes/search.tsx` + 8 subcomponents — Pokémon + move detail, type filter, matchup, evolution chain, stat bars
- [x] `routes/gyms.tsx` — all 13 bosses + 6 rivals, starter toggle
- [x] `routes/where-am-i.tsx` — 34 locations with filter
- [x] `routes/tms.tsx` — TMs + HMs + Tutors + HM Carrier ranking
- [x] `routes/settings.tsx` — theme + Claude key + gist sync + conflict modal

## Outstanding

### Party route (in progress)
See [03-phases.md](./03-phases.md) Phase 5. Subcomponents status:
- [x] `routes/party.tsx` — composition root (reads active playthrough, wires grid + coverage)
- [x] `routes/party/party-grid.tsx` — 6-slot grid with stable slot keys
- [x] `routes/party/party-slot.tsx` — filled + empty slot cards (sprite, name, level, types, move chips)
- [x] `routes/party/coverage-bar.tsx` — offensive type coverage strip (18 types)
- [ ] `routes/party/edit-modal.tsx` — biggest piece: Pokémon picker, level, nature, moves, advanced stats
- [x] `routes/party/pc-box.tsx` — PC grid (collapsible, ADD NEW, remove w/ confirm, → party swap)
- [x] `routes/party/full-party-swap-modal.tsx` — reusable swap picker when party is full
- [x] `routes/party/suggestion-panel.tsx` — top-5 team suggestions from `calc.computeSuggestions` (strip + dialog + apply writes active playthrough)
- [ ] `routes/party/tm-suggestion-panel.tsx` — "best moves to teach now"
- [ ] Teach modal deep-link (`?teach=<dex>:<move>`)

Grid currently redirects taps (both filled and empty slots) to `/search` as a placeholder until the edit modal lands.

### Breakdown overlay
See [03-phases.md](./03-phases.md) Phase 6. Type-matchup rows in Search detail link to a breakdown component that explains the final multiplier (STAB × type product × ability mod). Pure component — depends only on `data/types`, `data/abilities`, `lib/damage`.

### OCR UI wiring
See [03-phases.md](./03-phases.md) Phase 7. Vision client exists; routes don't yet invoke it. Needs:
- "Scan" button on Party edit modal (INFO / SKILLS / MOVES screens)
- "Scan TM Case" button on TMs route
- Scan result box UI (persist across re-renders, accumulate across multi-shot)
- Token-guard: redirect to Settings if no key configured

### E2E tests
See [03-phases.md](./03-phases.md) Phase 8. Existing `e2e/*.spec.ts` target the vanilla DOM and are disabled in CI for now (Biome ignores `e2e/`). After routes stabilise:
- Verify each spec file still expresses the right scenario
- Update selectors where React changed DOM structure (accessible locators should mostly survive)
- Re-enable in CI

### README screenshots
See [03-phases.md](./03-phases.md) Phase 9. Add `scripts/screenshot-readme.ts` to regenerate the 4 tracked PNGs via Playwright against Vite preview.

## File inventory

Current repo (on branch):
- `src/` — ~45 files
- `test/` — 2 files (53 tests)
- `plan/` — this directory

Bundle (last measured):
- `index.html` — 0.52 KB
- CSS — 18.9 KB / 4.6 KB gzip
- JS — 474 KB / 127 KB gzip
  - Above the 500 KB warning threshold. Code-splitting on routes is a Phase 10 follow-up (not blocking parity).
