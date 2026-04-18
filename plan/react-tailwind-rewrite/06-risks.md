# Risks

Things to watch before merging to `main`. Each risk has a mitigation and a verification step.

## Data loss on first load

**Risk**: a user on the live site has `se_v1` in localStorage from the vanilla app. The React app loads it, Zod rejects an unexpected field, user sees empty PC.

**Mitigation**:
- `migrateLegacyStore()` in `LocalStorageStoreRepository.loadStore()` runs before Zod parse. Handles `gameId='frlg' → 'frlg-fr'`, missing `pc`, missing `tmInventory`, missing `rivalStarter`, missing `recents`.
- On `safeParse` failure, falls back to empty store (logged to console) — does NOT erase the legacy payload. So the vanilla site would still read it.

**Verify before merge**:
- [ ] Snapshot localStorage from live vanilla site
- [ ] Paste into preview; confirm party + PC + TMs + recents all render
- [ ] Exercise a full save cycle; confirm the persisted shape round-trips through vanilla without breakage

## Gist sync edge cases

**Risk**: debounced push isn't wired from mutation hooks yet. Mutations save locally but don't push until the next manual "SYNC NOW" or next poll.

**Mitigation**:
- Phase 3 follow-up: inject `markLocalChanged` into each mutation hook's `onSuccess`.
- Alternatively, subscribe the sync hook to `StoreRepository.subscribe()` (already emits on save).

**Verify**:
- [ ] Edit a Pokémon on device A → wait 5 seconds → refresh device B → see the change
- [ ] Conflict flow: disconnect, edit on A, edit on B, reconnect on A → conflict modal appears

## Bundle size

**Risk**: 474 KB / 127 KB gzip. Above Vite's 500 KB warning. Mobile on slow 4G feels the extra 40 KB vs the vanilla app.

**Mitigation**:
- Route-level code splitting (Phase 10). `React.lazy(() => import('./routes/party'))` for each route.
- Lazy-load Claude Vision only when scan button is tapped (OCR code + Anthropic SDK imports).

**Verify**:
- [ ] Lighthouse mobile score ≥ 90 perf
- [ ] 3G throttled TTI ≤ 3.5s on a mid-tier device

## Curse type fidelity

**Risk**: vanilla data had `Curse` typed as `???`. React port normalised to `Ghost` (Gen V+ canon, fits `TypeName`).

**Mitigation**: `Curse` is a status move (no damage calc), so coverage math is unaffected.

**Verify**:
- [ ] Search "Curse" shows Ghost type badge — acceptable
- [ ] No user regression reports (Curse isn't commonly teachable anyway in FRLG via TM — it's an egg move / Shuckle tutor)

## Fine-grained GitHub token rejection

**Risk**: the `testToken` flow creates + deletes a dummy gist to validate fine-grained tokens. If the user's token can't delete gists, we leak a test gist.

**Mitigation**: document in Settings UI that the token needs both `gist: read + write`. The test gist delete is fire-and-forget (`.catch(() => undefined)`), so a failure doesn't block the test result.

**Verify**:
- [ ] Intentionally provide a read-only fine-grained token — error message is clear
- [ ] Intentionally provide a token without `gist` scope — error message is clear

## E2E ignored in CI

**Risk**: during the migration, Playwright specs don't run in CI. Regressions in UI behaviour go undetected until manual smoke tests.

**Mitigation**: accept the risk for the length of the migration. Compensate with:
- Aggressive unit-test coverage on pure logic (53 tests today)
- PR preview URL for manual smoke
- Re-enable E2E in Phase 8 before merging

**Verify at Phase 8**: full spec suite green against `npm run preview`.

## Abandoning the branch

**Risk**: `refactor/react-tailwind` sits open for weeks; `main` diverges; rebase becomes painful.

**Mitigation**:
- `main` is frozen for features during the migration. Only bug fixes go to `main`.
- Periodic `git fetch origin && git rebase origin/main` on this branch.
- Each phase pushes independently — if the migration is abandoned, completed phases can be cherry-picked.

**Verify**: if no commit on this branch in 30 days, decide: resume, rebase, or park.

## Accessibility regressions

**Risk**: Biome disables `useSemanticElements`, `useKeyWithClickEvents`, `noStaticElementInteractions` (the last isn't a real Biome rule, but the others were noisy). Real a11y issues might slip through.

**Mitigation**:
- Maintain the "accessible locators only" rule for E2E tests — breaks immediately on semantic regressions
- Manual screen-reader smoke pass in Phase 10
- Keep `useFocusableInteractive` + `noRedundantRoles` enabled (caught real issues already)

**Verify at Phase 10**: Lighthouse a11y ≥ 95 + VoiceOver walk of each route.
