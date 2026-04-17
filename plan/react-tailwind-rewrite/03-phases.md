# Phases

Each phase should produce a push-ready state: lint ✓ typecheck ✓ tests ✓ build ✓. Check items off as they complete; keep this doc honest.

## Phase 0 — Infrastructure  ✅ DONE

- [x] Scaffold, Tailwind, Biome, CI, Pages deploy + preview workflows, tracking PR
- See: [01-architecture.md](./01-architecture.md), [05-deployment.md](./05-deployment.md)

## Phase 1 — Data layer  ✅ DONE

- [x] Zod schemas + all bundled data modules ported (pokemon, moves, tutors, bosses, locations, learnsets, abilities, stats, evos, types, games)
- [x] Pure-logic `lib/party-calc.ts` + 49 unit tests
- [x] `lib/sprites.ts`, `lib/colors.ts`
- See: [02-status.md](./02-status.md)

## Phase 2 — Repositories + hooks  ✅ DONE

- [x] `StoreRepository` + `SettingsRepository` interfaces
- [x] LocalStorage impl with legacy `se_v1` migrations
- [x] In-memory impl for tests
- [x] `RepositoryProvider`, `useStore`, `useSettings`, playthrough mutation hooks

## Phase 3 — Sync  ✅ DONE

- [x] `features/sync/gist-client.ts`
- [x] `features/sync/use-sync.ts` (pull, push, debounce, poll, conflict state)
- [x] `features/sync/sync-context.tsx` — singleton `SyncProvider` + `useSyncContext` / `useMarkLocalChanged`
- [x] `features/sync/conflict-modal.tsx`
- [x] `markLocalChanged` wired into every store-mutating hook (`useSaveStore`, `useCreatePlaythrough`, `useSwitchPlaythrough`, `useRenamePlaythrough`, `useDeletePlaythrough`, `useUpdateActivePlaythrough`)

## Phase 4 — Shell + simple routes  ✅ DONE

- [x] Shell masthead + nav + playthrough switcher + sync badge
- [x] Playthrough menu (create / switch / rename / delete + game picker)
- [x] Search route (Pokémon + move detail, type filter, matchup, evolution chain, stat bars)
- [x] Gyms route
- [x] Where Am I route
- [x] TMs route (inventory stepper, HM Carrier ranking, learners)
- [x] Settings route (theme + Claude key + gist sync + conflict modal)

## Phase 5 — Party route  ✅ DONE

The biggest route (959 lines of vanilla). Split into subcomponents:

- [x] `routes/party.tsx` composition root
- [x] `routes/party/party-grid.tsx` — 6-slot grid with empty "+" tile
- [x] `routes/party/party-slot.tsx` — sprite, name, level, types, move chips
- [x] `routes/party/coverage-bar.tsx` — offensive type coverage strip
- [x] `routes/party/edit-modal.tsx` + `edit-modal-moves.tsx` + `edit-modal-info.tsx`:
  - [x] Pokémon search + pick
  - [x] Level input (1–100)
  - [x] Nature dropdown (with computed ATK/SpA/Spe preview)
  - [x] Move picker (up to 4, learnset-filtered, 18-type chip filter, Hidden Power type picker)
  - [x] Advanced (collapsed by default): ability, item, gender, shiny, OT name/id, ball, memo, in-game max stats
  - [x] Save / Cancel / Delete
  - [x] Deep-link via `?teach=<dex>:<moveName>` — consumed by PartyRoute, pre-queues move into draft
- [x] `routes/party/pc-box.tsx` — scrolling grid + "ADD NEW" tile
- [x] `routes/party/full-party-swap-modal.tsx` — when adding to full party
- [x] `routes/party/suggestion-panel.tsx` — top-5 from `calc.computeSuggestions`
- [x] `routes/party/tm-suggestion-panel.tsx` — `calc.rankTeachTargets` best moves to teach

**Schema extension**: added optional `nature`, `pokeball`, `otName`, `otId`, `trainerMemo`, `stats` to `PartyMember` so the edit modal round-trips all vanilla fields.

## Phase 6 — Breakdown overlay  ✅ DONE

- [x] `lib/damage.ts` — pure helpers: `applyAbilityMod`, `matchupBreakdown(atkType, defender)`, `moveBreakdown(moveName, moveType, defender, attacker)` + 20 unit tests
- [x] `components/breakdown-overlay.tsx` — accessible dialog rendering type-matchup rows, ability step, STAB, and result block
- [x] Wire from Search detail's type-matchup rows (opens matchup breakdown)
- [x] Wire from Party matchup's move chips (opens move breakdown with STAB)

## Phase 7 — OCR scan UI  ✅ DONE

Vision client already existed at `features/scan/vision-client.ts`.

- [x] `features/scan/scan-button.tsx` — shared button, token-guard (redirect to Settings if no key)
- [x] `features/scan/game-screen.ts` — pure aggregate + `mergeGameScreen` (first-found wins, fresh fields returned for per-scan draft patching)
- [x] Party edit modal: scan INFO / SKILLS / MOVES screens; accumulate scan result across shots; "↺ RESET TO SCAN" to re-apply
- [x] TMs route: scan TM Case; merge results by max count per num
- [x] Scan result box UI showing parsed fields + token count + cost estimate

## Phase 8 — E2E test re-port  ✅ DONE

- [x] Unignore `e2e/` in Biome
- [x] Walk each `e2e/*.spec.ts` against the running React app (`npm run preview`) — 90 passing, 8 parked as `test.fixme` (see [02-status.md](./02-status.md))
- [x] Update selectors where React DOM differs — mechanical nav-button → nav-link rewrite, new `seedPlaythrough` helper in `e2e/fixtures.ts` that writes `se_v1` directly, component-level `aria-label` touch-ups where tests needed stable names
- [x] Add new scenarios where React differs (e.g. `creating a new FireRed run from empty state updates the masthead` replaces the vanilla "first-run game gate")
- [x] Re-enable in CI with Playwright install step — `.github/workflows/ci.yml` `e2e` job runs `npx playwright install --with-deps chromium` + `npx playwright test` and uploads failure artifacts

## Phase 9 — README screenshots  ✅ DONE

- [x] `scripts/screenshot-readme.ts` — spawns `vite preview` on port 4174, seeds a full-party run into `se_v1`, and walks the React app at a 390×844 @2× mobile viewport. Exposed as `npm run screenshots`.
- [x] Regenerated the 4 tracked PNGs (search-party-matchup, search-gengar-detail, gyms-misty-expanded, where-am-i-safari)
- [x] README image references all resolve against the regenerated files

## Phase 10 — Parity sweep + merge  ⏳ TODO

Before merging to `main`:

- [ ] Side-by-side comparison: vanilla at `https://ethanlookpotts.github.io/super-effective/` vs preview at `…/pr-preview/pr-N/` — **needs human eye**
- [x] Manually exercise every feature path documented in `e2e/specs/*.md` — covered by the 90 passing `e2e/*.spec.ts` against `npm run preview` (see Phase 8). The 8 `test.fixme` cases are documented divergences (Send-to-PC UX absent in React, sync-conflict test hook pending, vanilla 3-col desktop grid)
- [x] Verify `se_v1` round-trip — `test/local-storage-migration.test.ts` feeds representative vanilla `se_v1` shapes (full playthrough, legacy `gameId: "frlg"`, full save→load with every optional field, corrupted JSON) through `LocalStorageStoreRepository`; asserts migrations + Zod defaults fill in new-required fields (`pc`, `tmInventory`, `rivalStarter`, `recents`) and that save→load is idempotent
- [x] Lighthouse pass (mobile): **Performance 98, Accessibility 95** (both meet threshold). FCP 1.8s / LCP 2.1s / TBT 40ms / CLS 0 / TTI 2.1s / total transfer 137 KiB. Remaining a11y deltas (blocking 100): `label-content-name-mismatch` fixed on masthead run-switcher; `color-contrast` on `--color-text-3` (#70718a) vs `--color-card-2` (#e8e9f0) at 3.92:1 — deferred as a theme-token decision, not gating parity
- [x] Bundle-size review — route-level code-splitting via `React.lazy` in `src/routes.tsx` + `<Suspense>`; data-side split of `LEARNSETS` via `useLearnsets` React Query hook in `src/hooks/use-learnsets.ts`. Initial entry dropped 603 KB → 350 KB (160 KB → 106 KB gzip); `learnsets` (69 KB / 7 KB gzip) only fetched when a dependent component mounts; no more Vite chunk-size warning
- [ ] Merge PR; monitor gh-pages deploy; remove `pr-preview/pr-N/` directory — **needs explicit go-ahead**

## Phase 11 — Post-merge cleanup (optional)

- [ ] Delete `refactor/react-tailwind` branch
- [ ] Drop this `plan/` directory (or move to `docs/archive/`)
- [ ] Close any remaining tracking issues
- [ ] Update `AGENTS.md` to remove "migration in progress" language (currently none — already removed)
