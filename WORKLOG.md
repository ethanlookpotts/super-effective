# Work Log — Super Effective

## Overview

Mobile-first Pokémon battle aide. Started from a single-file FRLG battle aide (~81KB HTML).
Evolving into a multi-game companion app with playthrough support.

---

## Backlog

### High Priority — React migration port

🚧 **In progress on long-lived branch `refactor/react-tailwind`. See [`plan/react-tailwind-rewrite/`](./plan/react-tailwind-rewrite/) for the full rewrite plan — phases, status, risks, architecture, deployment.** Do not merge the tracking PR until every phase in [`plan/react-tailwind-rewrite/03-phases.md`](./plan/react-tailwind-rewrite/03-phases.md) is `DONE`.

### Medium Priority
- [ ] IV/EV input — add back once accessible in-game (Gen III has no in-game IV/EV display; consider IV range calculator from scanned stats + nature + level, or EV tracking from battle history)

### Future Games
- [ ] Red / Blue / Yellow (Gen I)
- [ ] Gold / Silver / Crystal (Gen II)
- [ ] Ruby / Sapphire / Emerald (Gen III Hoenn)
- [ ] Diamond / Pearl / Platinum (Gen IV)

### Architecture
- [ ] Game module loader (lazy-load data for selected game)
- [ ] Per-game obtain data files
- [ ] Shared type chart per generation (Gen I differs from Gen II+)

---

## Progress

### Session 30 — LoC Simplification Pass on `refactor/react-tailwind`

Reviewer-driven source shrink (-443 net LoC, 5 focused commits):

- [x] **Tailwind `@theme` tokens consumed everywhere** — 467 raw `var(--color-…)` / `var(--radius-…)` / `var(--font-…)` arbitrary values across 30+ `.tsx` files replaced with the short utility classes that `@theme` already generates (`bg-card`, `text-text-3`, `rounded-card`, `font-pixel`, etc.). Biome re-wrap collapsed long multi-line classNames. 31 files, **−219 LoC**.
- [x] **`<Sprite>` primitive** (`src/components/sprite.tsx`) replaces 11 duplicated `<img src={spriteUrl(...) } onError={(e) => ...hide}>` blocks. **−65 LoC**.
- [x] **Generic `useStoreMutation<T>(reducer)`** inside `hooks/use-playthroughs.ts` replaces 5 near-identical mutation hooks (create/switch/rename/delete/updateActive). Public API unchanged. **−56 LoC**.
- [x] **Dropped unjustified `useCallback`/`useMemo`** in `routes/search.tsx`, `routes/search/move-detail.tsx`, `routes/search/poke-detail.tsx`, `routes/tms.tsx`. No consumer was `React.memo`'d; stable refs were noise.
- [x] **`tms.tsx` N+1 fix** — `learnersByMove` map built once per `(active, learnsets)` change; per-card render lookup goes from O(pool) to O(1). **−54 LoC combined with the `useCallback` sweep.**
- [x] **`lib/party-calc.ts` cleanup** — dropped the `PartyCalc` interface boilerplate and the factory-closure pattern in favour of top-level named exports (`makePartyCalc()` kept as a thin back-compat wrapper so existing callers and the 49-test suite stay untouched). Exported `coveredSuper`/`exposedWeak` so `suggestion-panel.tsx` stopped redefining them, and `computeTeachImpact` now reuses `coveredSuper` instead of rebuilding two coverage sets by hand. **−66 LoC**.

**Deferred (judgement call):**
- `<FilterPill>` / `<ApiKeyFieldset>` primitives — the variants differ too much (coloured type pills vs text pills; Claude key section vs GitHub sync section with extra buttons + status line). Would have traded readability for a modest line count.
- Inlining single-use sub-components in `edit-modal.tsx` / `settings.tsx` / `tms.tsx` — ~150 LoC on paper but hurts readability of the already-large files.
- Collapsing the `repositories/` layer (`types.ts` + `index.tsx` + `local-storage.ts` + `in-memory.ts` = 228 LoC) to free functions — touches sync, tests, providers; ~100 LoC for noticeable risk during a parity sweep. Deferred until after merge.

Bundle regenerates slightly smaller (`search` 45 KB → 41 KB, `party` 47 KB → 43 KB gzip unchanged). 77 unit tests, TS strict, Biome, and production build all green after each commit.

### Session 29 — React + Tailwind Rewrite (ongoing, long-lived branch)

**Branch**: `refactor/react-tailwind` (long-lived). **Plan**: [`plan/react-tailwind-rewrite/`](./plan/react-tailwind-rewrite/). **Tracking PR**: open against `main`, not to be merged until every phase in [`plan/react-tailwind-rewrite/03-phases.md`](./plan/react-tailwind-rewrite/03-phases.md) is `DONE`.

**Highlights so far**
- Full infra + data layer + repositories + sync client + playthrough hooks done
- Routes ported: Search, Gyms, Where Am I, TMs, Settings — all live end-to-end behind the new Repository pattern
- Party route in progress (subagent drafted subcomponents; assembly pending)
- Breakdown overlay, OCR UI wiring, E2E re-port, screenshots all outstanding

For the authoritative status snapshot, see [`plan/react-tailwind-rewrite/02-status.md`](./plan/react-tailwind-rewrite/02-status.md).

Detailed per-commit progress lives in git log on `refactor/react-tailwind` (not mirrored here — the plan and git log are the two sources of truth).

### Session 28 — Accessible E2E Locators

**Completed**
- [x] Audit and replace E2E locators that use CSS id/class selectors with accessible role/label alternatives — added `role="region"` + `aria-label` to each of the 6 `#page-*` containers in `index.html`; `role="dialog"` + `aria-label`/`aria-labelledby` to 7 modal overlays (party edit, PC swap, playthrough menu, breakdown, party suggestion, stats info, sync conflict); `role="listbox"` on `#s-drop`; `role="list"` on `#party-grid`; `aria-label` on `#s-scroll`, `#pc-section`, `#tm-sugg-wrap`, `#mast-game`; empty party pslot now `role="button" aria-label="Add Pokémon to party"` (`js/party.js`); `#move-section` container `role="region" aria-label="Move picker"`; `#adv-computed` `aria-label="Computed stats"`; `.stats-section` `role="region" aria-label="Base stats"` (`js/search.js`); `.tm-card` `role="listitem" aria-label="<num> <move>"` and `.tm-learners` `role="region" aria-label="Learners for <move>"` (`js/pages.js`). Updated all 10 E2E spec files to replace class selectors (`.drawer-nav`, `.pslot.empty-s`, `.party-grid`, `.stats-section`, `.tm-card`, `.tm-learners`, `#overlay .modal`) and most id selectors (`#move-section`, `#pc-section`, `#tm-sugg-wrap`, `#adv-computed`, `#s-in`, `#s-scroll`, `#s-drop`, `#mast-pt-btn`, `#mast-pt-label`, `#mast-game`, `#sidebar-pt-label`, `#stats-info-overlay`, `#pt-overlay`, `#drawer-overlay`, `#page-*`) with `getByRole`, `getByLabel`, and region-scoped queries. 72 unit + 97 E2E = 169 tests pass.

### Session 27 — Move Search + Move Detail

**Completed**
- [x] Search by move name → shows all Pokémon that can learn it — `onSearch` in `js/search.js` now searches `ALL_MOVES` alongside `POKEMON`; new `renderSearchDrop` splits the dropdown into labelled **POKÉMON** and **MOVES** sections (`.pd-lbl`); new `activeMove` state + `pickMove(name)` + `renderMoveDetail()` render a move detail view with type/category badges, PWR / ACC / EFFECT meta chips (from `MOVE_DATA`), a TM / HM / TUTOR source row (when applicable, pulled from `TM_HM` + `MOVE_TUTORS`), and a `WHO CAN LEARN` list of all learners sorted by dex number (tap to open that Pokémon); hash router gains `#/search?m=<moveName>` so reload / back restores the move detail; `showPage('search')` preserves the move param; `e2e/specs/search.md` adds 5 scenarios; 5 new tests in `e2e/search.spec.ts` (dropdown MOVES section, move detail metadata, WHO CAN LEARN list, learner → Pokémon navigation, TM source row); 72 unit + 97 E2E = 169 tests pass

### Session 26 — TM/HM Planner, Scoring Upgrade, HM Carrier

**Completed**
- [x] **Data foundation** — new `js/data-tutors.js` with `MOVE_TUTORS` (18 FRLG tutors) and `UTILITY_NPCS` (Move Reminder + Move Deleter); move list compiled directly from PokéAPI's `pokemon_moves.csv` filtered by `version_group_id=7` / `method=tutor`; NPC locations cross-checked with `pret/pokefirered` decompilation scripts (`data/scripts/move_tutors.inc`). `TM_HM` entries now auto-tagged with `tmType` (`tm`|`hm`) and `buyable` (derived from loc string matching Dept Store / Game Corner).
- [x] **Playthrough model** — new `tmInventory: { [num]: count }` field; migration via `DataManager.load` and `_applyRemoteStore` (defaults to `{}`). TM counts decrement on teach in-game; HMs binary; tutors treated as one-time teach flags.
- [x] **Scoring engine upgrade** (`js/party-calc.js`) — opt-in `MOVE_DATA`/`PHYS`/`computeAttackerStats`/`damageRangePct` injected via `makePartyCalc(..., opts)`. New primitives: `unresistedCov(members)` (neutral-or-better coverage, 0–18), `bestDamageAgainst(pm, defType)` (% damage vs a Lv50 baseline defender — fixed level so higher-level attackers score higher), `avgAtkPower(members)`. Rewritten `scoreTeam = 3·unresisted + 2·superEff − stackedWeakness + avgAtkPower/40 + avgBST/600`. New `computeTeachImpact(team, memberIdx, move)` returns best replace-slot with `{ scoreDelta, unresistedDelta, superDelta, coverageLost }`. New `rankTeachTargets(team, move, canLearnSet)` and `computeHMCarriers(pool, ownedHmMoves, canLearn)` used by the TMs page.
- [x] **TMs & HMs page overhaul** — `js/pages.js` fully rewritten; single scroll with filter bar (`ALL` / `OWNED` / `MISSING`), HM Carrier card at top, TMs / HMs / Tutors sections with headers, Utility NPCs footer. Each card has an inventory control (stepper for TMs; toggle for HMs/tutors) and a `WHO CAN LEARN` expansion that groups party + PC mons who can learn the move. Tapping a learner opens their edit modal with the move pre-queued for review. Owned cards get a green-tinted background; taught tutors fade. All new CSS scoped to `.tm-*`/`.tmsg-*`/`.hmc-*`/`.tms-*` classes.
- [x] **HM Carrier card** — uses the politically-neutral term "HM CARRIER" rather than "HM slave". Shown at the top of the TMs page when ≥2 HMs are owned. Ranks top 3 carriers by HMs-learnable − battle-utility cost. Missing HMs are shown struck through next to green chips for carry-able ones.
- [x] **Party page TM Suggestions** — new `renderTmSuggestions()` renders a `📀 TM SUGGESTIONS — BEST MOVES TO TEACH NOW` section under Party Suggestions. Each row: target mon, replaced-move → TM move, coverage delta (`+N cov` / `−N cov`), score delta, and tap to open the teach modal with the move pre-queued.
- [x] **OCR TM Case scan** — new `readTMCase(file)` in `js/ocr.js` sends a TM Case screenshot to Claude Vision (haiku-4-5); response is parsed, validated against the TM/HM num regex, and merged into `tmInventory` by taking the max per num (so multi-shot scans of a paginated TM Case aggregate correctly). New `📷 SCAN` button in the TMs page header.
- [x] **Tests** — 72 unit tests (+29 new across `party-calc.test.js` and new `data-tutors.test.js`: unresisted coverage, damage-aware scoring with level scaling, `computeTeachImpact`, `rankTeachTargets`, `computeHMCarriers`, and full data integrity for `MOVE_TUTORS` / `UTILITY_NPCS` / `TM_HM` runtime flags). 92 E2E tests (+13 new `tms-planner.spec.ts`: filter bar, stepper, HM toggle, `WHO CAN LEARN` expansion, HM Carrier show/hide thresholds, Move Tutors rendering, Utility NPCs, MISSING filter, scan button, TM Suggestions + teach modal pre-queue). All 164 tests pass.
- [x] **Docs** — AGENTS.md file map updated with `js/data-tutors.js`. Session entry written.

### Session 25 — URL Routing

**Completed**
- [x] URL routing — hash-based router (`js/router.js`) so reloading restores the current view; routes cover all 6 pages plus `#/search?n=<dex>` (selected Pokémon) and `#/search?type=<Type>` (active type filter); nav actions (`showPage`, `pickPoke`, `setTypeFilter`, `setTypeAndSearch`, `clearSearch`) push state via `history.pushState`; `popstate` listener applies route on back/forward; `applyRoute()` called once in `initApp`; playthrough switch calls `replaceRoute('search')` to reset stale URL; 14 unit tests (`test/router.test.js` — pure parse/build helpers) + 10 E2E tests (`e2e/routing.spec.ts`); package.json `test:unit` glob now picks up all `test/*.test.js`; 43 unit + 79 E2E = 122 tests passing

### Session 24 — Readability Overhaul, Light Theme, CI Fix

**Completed**
- [x] Full readability audit — captured 33 screenshots across all pages (mobile + desktop), identified 11 issues ranked by severity
- [x] Color contrast fix — bumped `--text2` (#9899b8 → #b4b5d0, ~7:1) and `--text3` (#4a4b6a → #6e6f94, ~4.5:1 WCAG AA); brightened all 18 type badge backgrounds for better white-on-color legibility
- [x] Font size overhaul — raised pixel font (Press Start 2P) minimum from 5-6px to 8px across all components per Apple HIG / Material Design guidelines; bumped body text (DM Mono) from 11-13px to 13-15px; thickened stat bars (4px → 6px mobile / 8px desktop) and enlarged coverage dots
- [x] Light theme — new default; light palette with warm off-white background (#f0f1f6), white cards, deep text (#1a1b2e); all hardcoded dark gradient backgrounds converted to CSS custom properties; dark theme preserved as `[data-theme="dark"]` override
- [x] Theme toggle — Settings page gains Light / System / Dark toggle; persists to localStorage; System mode tracks `prefers-color-scheme` media query with live listener; defaults to system preference
- [x] Type pill scroll fade — mask-image gradient on mobile type filter row fades the right edge to hint at more pills; removed when fully scrolled
- [x] Fixed "undefined" in recent chips — defensive name lookup in search.js handles legacy plain-number recents format
- [x] Desktop improvements — content max-width (800px) constrains detail views for readability; larger font overrides for stats, gyms, TMs, settings at ≥720px
- [x] CI fix — added missing CORS headers (`access-control-expose-headers`, `access-control-allow-origin`) to e2e/sync.spec.ts mock so `x-oauth-scopes` header is exposed to fetch, fixing the gist scope check test
- [x] README screenshots regenerated in light mode
- [x] Git history rewritten — all commits authored by Ethan Look-Potts

### Session 23 — GitHub Gist Sync

**Completed**
- [x] GitHub Gist sync — cross-device playthrough sync via private GitHub Gist; new `js/data-manager.js` persistence gateway wraps all localStorage operations and handles gist CRUD, debounced push (2s), periodic pull (60s), conflict detection with user-facing modal ("Keep Local" / "Use Cloud"); refactored all `saveStore()`/`loadStore()` calls across `state.js`, `party.js`, `playthroughs.js`, `init.js` to use `DataManager.save()`/`DataManager.load()`; Settings page gains GITHUB SYNC section with token input, TEST (validates gist scope), SAVE, SYNC NOW, and FORGET TOKEN; sync status indicator in sidebar; conflict modal shows playthrough names and last-modified timestamp; offline-resilient (graceful catch on all API calls); 10 new E2E tests (`e2e/sync.spec.ts`) using `page.route()` to mock the GitHub Gist API; 69 E2E + 29 unit = 98 tests passing

### Session 22 — Claude Vision Scan + Full Static Info

**Completed**
- [x] Replaced Tesseract.js with Claude Vision API (`claude-haiku-4-5-20251001`, browser-direct) — `js/ocr.js` rewritten; `readGameScreen(file)` returns structured JSON; key stored in `localStorage` under `se_claude_key`
- [x] Settings page (`js/settings.js`, `page-settings` in index.html) — API key input, TEST button, KEY ACTIVE / NO KEY SET badge, FORGET KEY; scan button redirects to Settings if key is missing; 6 E2E tests (`e2e/settings.spec.ts`)
- [x] PC Box redesign — ADD NEW tile as first slot (same size as Pokémon slots); all PC slots clickable → opens edit modal; scan available inside PC modal via shared `mMode='pc'` state
- [x] Scan captures all static info from all 3 FRLG screens (INFO / SKILLS / MOVES): name, level, dex, nature, ability, item, gender, moves, max stats; + trainer memo, OT name, OT ID, Poké Ball, shiny detection
- [x] Scan result box in modal — persists across re-renders, accumulates across multiple scans (scan one screen then another); shows all parsed fields + token count + cost estimate + usage link; `↺ RESET TO SCAN` button re-applies scan data to form
- [x] INFO collapsible section in edit modal — ability, item, gender, shiny toggle (✦, shows gold highlight + shiny sprite in PC), ball, OT name/ID, trainer memo, 6-stat grid; populated from scan and manually editable; all saved to party/PC entry
- [x] Shiny state — toggle in INFO section; ✦ shown in party slots and PC slots; PC uses shiny sprite URL when shiny=true
- [x] Robust JSON parsing — extracts first `{…}` block so trailing Claude notes don't break parse; improved prompt names all 3 FRLG screen types; `max_tokens: 256`
- [x] 59 tests passing

### Session 21 — Photo Ingestion (Stats / Memo / Moves Screens)

**Completed**
- [x] [OCR-1] OCR foundation — Tesseract.js v5 loaded from jsDelivr CDN; `js/ocr.js` with `runOCR(file)` helper (cached worker, progress + error toasts); handles Switch screenshots and phone-camera photos of TV (docked Switch 2)
- [x] [OCR-2] Stats + memo screen ingestion — `parseLevel()` (handles "Lv.XX" and "Level XX"), `parseNature()` (prioritises "[Nature] nature" MEMO pattern, falls back to lone nature word); auto-fills level and nature fields
- [x] [OCR-3] Moves screen ingestion — `parseMovesFromOCR()` with `fuzzyMatchMove()` (OCR substitution normalisation: 0→o, 1/l→i); strips PP counters from lines; auto-fills up to 4 moves
- [x] UI — single "📷 SCAN GAME SCREENS" button in party edit modal (visible when Pokémon selected); accepts multiple images; opens ADVANCED STATS / MOVES sections after fill; toast summarises what was found; 53 tests still passing

### Session 20 — Advanced Stats Entry + Damage Range

**Completed**
- [x] Party edit modal redesigned: Pokémon search always visible; MOVES and ADVANCED STATS sections are collapsible (collapsed by default, disabled until a Pokémon is selected); switching Pokémon mid-entry resets advStats and moves
- [x] Advanced Stats section: Level + Nature (25-option dropdown with effect hint), IV/EV grid (Atk/SpA/Spe only), computed stats line updates live (shows precise values without ~ when any stat entered, ~ estimated when using defaults)
- [x] Gen III stat/damage helpers in `js/data-stats.js`: `NATURES`, `computeStat`, `computeHP`, `computeAttackerStats`, `estimateEnemyStat/HP`, `damageRangePct`; `natureSummary` shows +/− effect on nature select
- [x] Damage range in party matchup move rows: `~94–111%` (estimated, muted) or `94–111%` (precise, green) HP damage vs estimated enemy stats at attacker level; only shown for damaging moves vs non-immune targets; enemy stats estimated from STATS base + attacker's level (normalised comparison)
- [x] 2 new E2E tests (53 total passing): collapsible sections disabled/enabled flow; advanced stats persist across save/reopen

### Session 19 — Party Suggestion Overhaul + Unit Tests

**Completed**
- [x] Reworked party suggestion engine: extracted to `js/party-calc.js` pure module (`makePartyCalc` factory); improved greedy algorithm uses marginal coverage scoring (new types ×3 − stacked weakness penalty + BST/600 tiebreaker) instead of team-rescore heuristic; 5 diverse suggestions generated from top-scoring seeds, each sorted by dex number; `_computeSuggestions` in `party.js` delegates to module
- [x] UI: replaced single "SUGGEST MY PARTY" button with 5 sprite-strip cards (sprites + X/18 score inline, tap to open detail modal); detail modal shows single suggestion with full coverage bar, weak-to badges, USE THIS PARTY; desktop layout renders strip cards as horizontal row; suggestion members sorted by dex number
- [x] Unit test suite: `test/party-calc.test.js` — 29 tests across `bst`, `countOffCov`, `individualScore`, `marginalScore`, `scoreTeam`, `buildGreedyTeam`, `computeSuggestions`; loads browser source via `node:vm` with no conditional exports; `npm run test:unit` / `npm run test:e2e` / `npm test`
- [x] CI fixed: `test.yml` now runs `npm test` (was `npx playwright test`, skipping unit tests); AGENTS.md updated with full Testing section covering both suites; worklogger skill updated

### Session 18 — Party Builder: PC Box & Party Suggestions

**Completed**
- [x] Party Builder — PC Box (unlimited caught Pokémon storage) + automated party suggestion engine; `pc[]` array added to playthrough model with migration; "📦 SEND TO PC" / "📦 IN PC BOX" buttons in search detail card; PC Box collapsible 3-column grid on party page with sprite, type badges, "→ PARTY" and inline-confirm remove; "✨ SUGGEST MY PARTY" button appears when ≥6 in PC; suggestion modal scores teams by base-type offensive coverage (×3) + move bonus (×1) − defensive exposure (×0.5) using greedy algorithm with 3 diverse seeds, shows up to 3 options with coverage bar and "USE THIS PARTY" CTA; applying a suggestion swaps current party to PC and fills party from PC; 10 new E2E tests (50 total passing)

### Session 17 — Base Stats, Move Guidance & Info Modal

**Completed**
- [x] Pokémon base stats display + move guidance overhaul — added STATS constant (all 151 Gen I Pokémon) and MOVE_DATA constant (350+ moves with base power, accuracy, secondary effect); base stats shown as colour-coded bars in detail card with dominant stat highlighted; PHY/SPE stat note on each party matchup card; move rows in party matchup show power (e.g. 95bp), imperfect accuracy, and coloured effect badges (burn/para/sleep/psn/freeze/flinch/drain); moves sorted by power when type effectiveness is equal; ℹ button in BASE STATS heading opens explanation modal with per-stat descriptions, PHY vs SPE recommendation, and IVs/EVs/nature/level caveat; breakdown overlay shows power/accuracy/effect at top; 4 new E2E tests (40 total passing)

### Session 16 — Static Learnsets + Hidden Power UI

**Completed**
- [x] Replace PokéAPI runtime dependency with static FRLG learnsets — compiled learnsets for all 151 Pokémon into `js/data-learnsets.js`; removed `fetchLearnset()`, learnset cache (`se_learnsets_v1`), and all PokéAPI calls; move picker now instant (no loading state); added missing `Psybeam` and `Hidden Power` to ALL_MOVES; fixed slug aliases (`feint-attack`→Faint Attack, `smelling-salts`→Smelling Salt); removed PokéAPI from skills/pokemon.md
- [x] Hidden Power type-picker UI — Hidden Power shown as special "HP" rainbow badge in move list; clicking opens inline type selector (all types except Fairy); after type chosen, shown as a normal picked move with chosen type badge; `aria-label` on picker and type selector rows for testability; 2 new E2E tests; 36 tests passing

### Session 15 — Playthrough Model Overhaul

**Completed**
- [x] Playthrough model overhaul — game selection, first-run gating, rename UX, version-filtered obtain data — `GAMES` registry + `gameId` on every playthrough; first-time users gated behind a full-screen game picker (FireRed / LeafGreen organised by Gen); "New Run" flow shows in-menu game picker with back button; ✏ edit button replaces invisible inline input for renaming; `getObtain` filters `HOW` rows by `(FR)`/`(LG)` tags so version-exclusive obtains hide; masthead updates dynamically per game; existing playthroughs migrated to `frlg-fr`; `e2e/fixtures.ts` shared seed fixture; 34 tests passing (5 new playthrough tests)

### Session 14 — Complete Gen III Moveset Audit

**Completed**
- [x] Complete Gen III moveset audit — updated `js/data-moves.js` with all 354 Generation III moves; ensures all moves in FRLG learnsets appear correctly in the move picker; fixed issue where moves like Double Kick and Roar were missing from the app's master list.

### Session 13 — Evolution Tracker

**Completed**
- [x] Evolution tracker (level/stone/trade conditions) — EVOLUTION section in Pokémon detail card; shows next evolution(s) with condition (level/stone/trade) and pre-evolution for middle-stage Pokémon; names are tappable to navigate; EVOS data covers all 151 Gen I Pokémon; 4 new E2E tests in search.spec.ts (27 total passing)

### Session 12 — Desktop Responsive Layout

**Completed**
- [x] **[4] Desktop responsive layout** — persistent sidebar nav (240px) at ≥720px; game title + run switcher in sidebar header; masthead hidden on desktop; mobile masthead unchanged (hamburger + game title + run switcher); type filter pills wrap on desktop; 3-column party grid at ≥900px; modals become centered dialogs instead of bottom sheets; 8 desktop-viewport E2E tests added (`e2e/desktop.spec.ts`); screenshots convention added (`screenshots/` git-ignored, documented in AGENTS.md and agent prompts); Playwright config set to 390×844 mobile viewport for existing tests
- [x] Refactor E2E tests to use accessible selectors — replaced class/id-based locators with `getByRole`, `getByLabel`, `getByText`; added `aria-label` to key interactive elements; updated AGENTS.md E2E section to enforce this convention going forward

### Session 11 — File Splitting & Stack Evaluation

**Completed**
- [x] Split data.js (44KB) into 6 focused files: data-types, data-abilities, data-pokemon, data-locations, data-moves, data-bosses — each covering one data domain
- [x] Split app.js (46KB) into 8 focused files: breakdown, state, search, party, gyms, pages, playthroughs, init — each covering one feature area
- [x] Updated AGENTS.md file map and added guidance to keep files small for agent context efficiency
- [x] Evaluated modern stack migration (task [5]) — rejected: React+Next.js runtime alone (~170KB gzipped) exceeds current entire app (~50KB); no bundle size benefit; GitHub Pages static export adds build complexity; vanilla approach optimal for this use case. Stack finding documented in Ideas / Notes.

### Session 10 — Code Simplification

**Completed**
- [x] Run /simplify on the codebase — extracted `_resetSearchInput`, `_refreshUI`, fixed `_fmtM` no-op, simplified `goSearch`, deduplicated `onMS`; 30 lines removed, no behaviour change

### Session 9 — TMs & HMs + Hamburger Nav

**Completed**
- [x] TM/HM location reference — dedicated TMs & HMs page (57 moves), searchable by name or TM number; FRLG locations verified via Serebii + Bulbapedia
- [x] Hamburger drawer navigation — replaces tab bar; slide-in drawer with all 5 pages; TMs & HMs promoted to first-class nav item

### Session 8 — Rival Encounters

**Completed**
- [x] Rival (Gary) battle encounters — 6 encounters interleaved chronologically with gym leaders; starter selector (Bulbasaur / Charmander / Squirtle) swaps Gary's team; persisted in localStorage (`se_starter`)

### Session 7 — Learnset Filtering

**Completed**
- [x] **[3] Filter move picker to learnable moves only** — fetches FRLG learnset from PokéAPI, caches in se_learnsets_v1; always-on filter with loading state and offline fallback

### Session 6 — Data Accuracy & Battle Matchup Overhaul

**Completed**
- [x] **[2] Audit and correct data accuracy** — fixed Ghost→Steel and Dark→Steel missing 0.5× resistances (Gen II–V; removed in Gen VI); fixed Shadow Ball cat spe→phy (Ghost is Physical in Gen III)
- [x] Add ability mods (Levitate, Flash Fire, Water Absorb, Volt Absorb, Thick Fat) — applied to type chart and party defense calculations
- [x] Move type chart above party suggestions; show ability name in Pokémon card
- [x] Party matchup cards show explicit defense matchup (enemy best type + multiplier) alongside offense
- [x] Move breakdown sheet — tap any move row in party matchup to see step-by-step math (type interactions, STAB, ability overrides)

### Session 5 — API Research & WORKLOG Housekeeping

**Completed**
- [x] **[1] Investigate API alternatives** — researched PokéAPI REST + GraphQL; recommendation: use PokéAPI only for learnsets (task [3]); all other data stays static; findings in Ideas / Notes

### Session 4 — Polish & Bug Fixes

**Completed**
- [x] Push to main + configure GitHub Pages
- [x] Playthrough rename UI — inline input in PT menu, saves on blur/Enter
- [x] "✓ IN PARTY" button → tapping navigates to Party tab (blue, reads "VIEW PARTY ›")
- [x] Remove `legacy-frlg-battle-aide.html` — functionality fully superseded by the current app; file is dead weight in the repo
- [x] renderModal() partial rebuild on move add/remove (currently full rebuild)
- [x] Bug: type filter browse cards render off-screen/blank — visible in Playwright screenshot; cards animate in below the fold when Electric pill is tapped

### Session 3 — CSS + Data + JS Implementation

**Completed**
- [x] Phase 1 — `style.css`: all legacy CSS extracted + en-dash var() bug fixed + new classes for index.html elements + `.toast`, `.toast.red`, `.add-party-btn`, `.swap-row`, `.cdot[data-type]`, `.mast-pt-btn`, playthrough menu styles
- [x] Phase 2 — `js/data.js`: TYPES, PHYS, CHART, POKEMON (151), HOW, ALL_MOVES, BOSSES, LOCATIONS verbatim from legacy + `gm()`, `dmult()`, `getObtain()`, `tc()` helpers
- [x] Phase 3 — `js/app.js`: full logic port with multi-playthrough `se_v1` store shape + sprite helpers
- [x] Phase 4 — Add-to-party button in search detail (`addToParty(n)`)
- [x] Phase 5 — PC Swap modal when party is full (`openSwapModal(n)`, `swapIn(slot)`)
- [x] Phase 6 — Tappable coverage dots → `setTypeAndSearch(type)`
- [x] Phase 7 — Playthrough switcher in masthead (`openPtMenu`, `createPlaythrough`, `switchPt`, `deletePt`)

### Session 2 — Repo Setup & Architecture

**Completed**
- [x] AGENTS.md as canonical build guide (agent-agnostic; works with Claude, Codex, Gemini)
- [x] CLAUDE.md thin-wraps AGENTS.md via `@AGENTS.md` include
- [x] README.md — overview, file map, GitHub Pages instructions (no personal info)
- [x] WORKLOG.md — progress log, backlog, notes
- [x] agents/pokemon.md — reusable data research prompt for any agent
- [x] index.html shell — full UI structure, links to style.css + js files; all tab/modal/masthead scaffolding in place
- [x] Implementation plan documented (phases 1–8, each = one commit)

### Session 1 — Foundation & Feature Sprint

**Completed**
- [x] Type chart always expanded
- [x] Move picker: searchable by name + 18 type filter pills
- [x] Gym Leaders & Elite Four with full teams + tips
- [x] Level field per party Pokémon (optional)
- [x] Catchable badge in Search
- [x] Party type coverage gap bar (colored dots)
- [x] Recently searched Pokémon chips (max 6, persisted)
- [x] Page masthead with game title
- [x] Type pill browser (tap type → see all Pokémon of that type)
- [x] Gym + Location Pokémon tappable → jump to Search
- [x] 4-tab structure: SEARCH · PARTY · GYMS · WHERE AM I

