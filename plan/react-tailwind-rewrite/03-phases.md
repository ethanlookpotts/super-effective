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

## Phase 9 — README screenshots  ⏳ TODO

- [ ] `scripts/screenshot-readme.ts` — Playwright against `npm run preview`
- [ ] Regenerate the 4 tracked PNGs (search-party-matchup, search-gengar-detail, gyms-misty-expanded, where-am-i-safari)
- [ ] Update README.md with the new stack mention (already done) + verify image references still resolve

## Phase 10 — Parity sweep + merge  ⏳ TODO

Before merging to `main`:

- [ ] Side-by-side comparison: vanilla at `https://ethanlookpotts.github.io/super-effective/` vs preview at `…/pr-preview/pr-N/`
- [ ] Manually exercise every feature path documented in `e2e/specs/*.md`
- [ ] Verify `se_v1` round-trip: back up localStorage from live site, paste into preview, confirm no data loss
- [ ] Lighthouse pass (mobile): perf ≥ 90, a11y ≥ 95
- [ ] Bundle-size review — code-split at the route boundary if > 500 KB gzip
- [ ] Merge PR; monitor gh-pages deploy; remove `pr-preview/pr-N/` directory

## Phase 11 — Post-merge cleanup (optional)

- [ ] Delete `refactor/react-tailwind` branch
- [ ] Drop this `plan/` directory (or move to `docs/archive/`)
- [ ] Close any remaining tracking issues
- [ ] Update `AGENTS.md` to remove "migration in progress" language (currently none — already removed)
