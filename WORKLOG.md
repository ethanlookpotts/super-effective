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

### Session 4 — Polish & Bug Fixes

**Completed**
- [x] Push to main + configure GitHub Pages
- [x] Playthrough rename UI — inline input in PT menu, saves on blur/Enter
- [x] "✓ IN PARTY" button → tapping navigates to Party tab (blue, reads "VIEW PARTY ›")
- [x] Remove `legacy-frlg-battle-aide.html` — functionality fully superseded by the current app; file is dead weight in the repo
- [x] renderModal() partial rebuild on move add/remove (currently full rebuild)
- [x] Bug: type filter browse cards render off-screen/blank — visible in Playwright screenshot; cards animate in below the fold when Electric pill is tapped

### Session 5 — API Research & WORKLOG Housekeeping

**Completed**
- [x] **[1] Investigate API alternatives** — researched PokéAPI REST + GraphQL; recommendation: use PokéAPI only for learnsets (task [3]); all other data stays static; findings in Ideas / Notes

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
- [x] Refactor E2E tests to use accessible selectors — replace class/id-based locators with `getByRole`, `getByLabel`, `getByText`; add `aria-label` attributes to key interactive elements; update playwright-generator, playwright-planner, playwright-healer agent prompts and AGENTS.md E2E section to enforce this convention going forward

### Medium Priority
- [ ] Run /simplify on the codebase — reduce duplication and clean up JS/CSS without changing behaviour
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

### API Alternatives Research (task [1] findings)

**PokéAPI REST** (pokeapi.co) — actively maintained, no API key, rate-limited at ~100 req/min.
**GraphQL PokéAPI** (beta.graphql.pokeapi.co) — same data, more flexible queries, still beta.

| Data | PokéAPI available? | Use it? | Reason |
|---|---|---|---|
| Type chart (CHART) | Yes — but Gen IX | **No** | Gen III differs: no Fairy, Steel doesn't resist Dark/Ghost. Correction overhead > benefit. |
| Pokémon list + types | Yes (151+) | **No** | Static data is correct; no runtime benefit for fixed 151. |
| Base stats | Yes | Maybe (future) | Not currently displayed; low priority. |
| Move learnsets | Yes — filterable by `version_group "firered-leafgreen"` | **Yes, for task [3]** | Best candidate: enables filtering move picker to learnable moves. Cache under `se_learnsets_v1` in localStorage. |
| FRLG obtain methods (HOW) | Not in useful form | **No** | Hand-curated; PokéAPI encounter data doesn't map cleanly to FRLG obtain strings. |
| Boss teams (BOSSES) | No | **No** | Not in PokéAPI. |
| Location encounters (LOCATIONS) | Partial | **No** | Format mismatch; hand-curation is authoritative. |
| Sprites | Yes (CDN URLs) | **Already done** | Static CDN URLs, no API call needed. |

**Recommendation:** Use PokéAPI exclusively for learnsets (needed by task [3]), with `localStorage` caching for offline resilience. Fetch once per Pokémon on first party add, store in `se_learnsets_v1 = { [dexNum]: [moveName, ...] }`. All other data stays static.

- Coverage gap dots → type browse is the fastest path to fixing a gap mid-game
- Sprites from PokeAPI CDN load fast on WiFi, gracefully hidden offline
- Multi-playthrough useful for: Nuzlocke runs, randomisers, gift-only challenges
- Physical/special split note: Gen III split is by TYPE. Flareon has high Atk but
  all Fire moves are Special — this is the classic Flareon problem. App correctly
  labels all Fire moves as SPE.
- Type chart includes Fairy for completeness but it does not exist in FRLG
- The legacy file's `HOW`, `CHART`, `BOSSES`, `LOCATIONS` are carefully hand-curated — never regenerate from PokeAPI or any other source; copy verbatim only.
- CSS en-dash bug: legacy file used `–` (U+2013) in `var()` calls instead of `--`. Fixed in style.css by using proper double-hyphen throughout.
