# Work Log — Super Effective

## Overview

Mobile-first Pokémon battle aide. Started from a single-file FRLG battle aide (~81KB HTML).
Evolving into a multi-game companion app with playthrough support.

---

## Backlog

### High Priority

### Medium Priority
- [ ] Per-Pokémon actual stat entry (IVs/EVs/nature/level → compute real Atk/SpA/Spe) and exact damage formula display — show calculated damage range per move in party matchup cards; replaces base-stat heuristics with precise battle math
- [ ] Search by move name → show all Pokémon that can learn it
- [ ] Audit and replace E2E locators that use CSS id/class selectors (e.g. #move-section) with accessible role/heading/label alternatives so tests behave like real users — add appropriate aria labels to HTML where needed to enable this

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

