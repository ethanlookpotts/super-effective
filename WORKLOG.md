# Work Log — Super Effective

## Overview

Mobile-first Pokémon battle aide. Started from a single-file FRLG battle aide (~81KB HTML).
Evolving into a multi-game companion app with playthrough support.

---

## Progress

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

### Session 2 — Repo Setup & Architecture

**Completed**
- [x] AGENTS.md as canonical build guide (agent-agnostic; works with Claude, Codex, Gemini)
- [x] CLAUDE.md thin-wraps AGENTS.md via `@AGENTS.md` include
- [x] README.md — overview, file map, GitHub Pages instructions (no personal info)
- [x] WORKLOG.md — progress log, backlog, notes
- [x] agents/pokemon.md — reusable data research prompt for any agent
- [x] index.html shell — full UI structure, links to style.css + js files; all tab/modal/masthead scaffolding in place
- [x] Implementation plan documented (phases 1–8, each = one commit)

### Session 3 — CSS + Data + JS Implementation

**Completed**
- [x] Phase 1 — `style.css`: all legacy CSS extracted + en-dash var() bug fixed + new classes for index.html elements + `.toast`, `.toast.red`, `.add-party-btn`, `.swap-row`, `.cdot[data-type]`, `.mast-pt-btn`, playthrough menu styles
- [x] Phase 2 — `js/data.js`: TYPES, PHYS, CHART, POKEMON (151), HOW, ALL_MOVES, BOSSES, LOCATIONS verbatim from legacy + `gm()`, `dmult()`, `getObtain()`, `tc()` helpers
- [x] Phase 3 — `js/app.js`: full logic port with multi-playthrough `se_v1` store shape + sprite helpers
- [x] Phase 4 — Add-to-party button in search detail (`addToParty(n)`)
- [x] Phase 5 — PC Swap modal when party is full (`openSwapModal(n)`, `swapIn(slot)`)
- [x] Phase 6 — Tappable coverage dots → `setTypeAndSearch(type)`
- [x] Phase 7 — Playthrough switcher in masthead (`openPtMenu`, `createPlaythrough`, `switchPt`, `deletePt`)

**Current state**
- `index.html` — complete HTML shell ✅
- `style.css` — all styles ✅
- `js/data.js` — all Gen III FRLG data ✅
- `js/app.js` — all app logic ✅
- App is fully functional. Open `index.html` in a browser to test.

---

## Next Session — Pick Up Here

### Phase 8 — Deploy

Push to `main`, configure GitHub Pages (Settings → Pages → branch `main`, folder `/`).

### Generate tests from specs (do next)

Playwright agent infrastructure is in place (`npm ci && npx playwright install chromium` to set up).
Test plans are in `e2e/e2e/specs/critical-journeys.md`. Next step: invoke the **Generator** agent to produce
test files. Then add GitHub Actions CI — see Backlog → Testing.

---

## Active Todos

- [x] Push to main + configure GitHub Pages
- [x] Playthrough rename UI — inline input in PT menu, saves on blur/Enter
- [x] "✓ IN PARTY" button → tapping navigates to Party tab (blue, reads "VIEW PARTY ›")
- [x] Remove `legacy-frlg-battle-aide.html` — functionality fully superseded by the current app; file is dead weight in the repo
- [x] renderModal() partial rebuild on move add/remove (currently full rebuild)
- [ ] Bug: type filter browse cards render off-screen/blank — visible in Playwright screenshot; cards animate in below the fold when Electric pill is tapped

---

## Backlog

### Testing

Playwright E2E — 6 tests passing. Three agent prompts in `agents/` for any AI to maintain tests:
- `agents/playwright-planner.md` — write new spec plans in `e2e/specs/`
- `agents/playwright-generator.md` — generate `e2e/*.spec.ts` from specs
- `agents/playwright-healer.md` — repair broken tests after UI changes

CI runs on push to main and PRs via `.github/workflows/test.yml`.

**Covered journeys** (`e2e/specs/critical-journeys.md` → `e2e/critical-journeys.spec.ts`):
1. Search by name → Pikachu detail card with Electric badge
2. Type filter pill → Electric browse list includes Pikachu
3. Add to party → party slot filled
4. Gyms tab → Brock, Misty, Giovanni cards present
5. Where Am I tab → Viridian Forest, Safari Zone present

### High Priority
- [ ] **[1] Investigate API alternatives** — research whether a maintained Pokémon API (e.g. PokéAPI, GraphQL variants) can replace or supplement hard-coded data for types, movesets, and Pokémon lists; document findings and recommendation in WORKLOG
- [ ] **[2] Audit and correct data accuracy** — verify Gen III type chart, full Pokémon list (151), and move learnsets against authoritative sources (Bulbapedia, Serebii); fix any discrepancies in `js/data.js`
- [ ] **[3] Filter move picker to learnable moves only** — when a Pokémon is selected in party, restrict the move picker to only moves that Pokémon can actually learn (level-up, TM/HM, tutor); requires accurate learnset data from [2]
- [ ] Rival (Gary) battle encounters — similar to Gyms, location-triggered
- [ ] TM/HM location reference ("where do I get Earthquake?")

### Medium Priority
- [ ] **[4] Desktop responsive layout** — extend mobile-first layout to work well on wider screens (sidebar nav, wider cards, responsive breakpoints); keep mobile experience unchanged
- [ ] Evolution tracker (level/stone/trade conditions)
- [ ] Pokémon base stats display (Attack vs Sp.Atk to guide move choice)
- [ ] Search by move name → show all Pokémon that can learn it

### Future Games
- [ ] Red / Blue / Yellow (Gen I)
- [ ] Gold / Silver / Crystal (Gen II)
- [ ] Ruby / Sapphire / Emerald (Gen III Hoenn)
- [ ] Diamond / Pearl / Platinum (Gen IV)

### Architecture
- [ ] **[5] Evaluate modern web stack** — assess migrating to a modern stack (Next.js + React + Tailwind is the primary candidate; Svelte/SvelteKit is a lighter alternative) for better DX, component model, and community ecosystem; document trade-offs vs current no-build vanilla approach before committing
- [ ] Game module loader (lazy-load data for selected game)
- [ ] Per-game obtain data files
- [ ] Shared type chart per generation (Gen I differs from Gen II+)

---

## Ideas / Notes

- Coverage gap dots → type browse is the fastest path to fixing a gap mid-game
- Sprites from PokeAPI CDN load fast on WiFi, gracefully hidden offline
- Multi-playthrough useful for: Nuzlocke runs, randomisers, gift-only challenges
- Physical/special split note: Gen III split is by TYPE. Flareon has high Atk but
  all Fire moves are Special — this is the classic Flareon problem. App correctly
  labels all Fire moves as SPE.
- Type chart includes Fairy for completeness but it does not exist in FRLG
- The legacy file's `HOW`, `CHART`, `BOSSES`, `LOCATIONS` are carefully hand-curated — never regenerate from PokeAPI or any other source; copy verbatim only.
- CSS en-dash bug: legacy file used `–` (U+2013) in `var()` calls instead of `--`. Fixed in style.css by using proper double-hyphen throughout.
