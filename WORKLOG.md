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

### Testing Infrastructure (HIGH PRIORITY — do next)

We need lightweight automated tests to guard critical user journeys. See **Backlog → Testing** below for the full plan. In short:

- Use **Playwright** for end-to-end tests (headless browser)
- Tests live in `tests/` and cover the 5 critical journeys
- Run locally via `npx playwright test`
- Run on PR via GitHub Actions (`.github/workflows/test.yml`)
- Update AGENTS.md with: "Run `npx playwright test` to validate before committing"

---

## Active Todos

- [ ] Set up Playwright E2E tests + GitHub Actions CI (see Backlog → Testing)
- [ ] Push to main + configure GitHub Pages
- [ ] Playthrough rename UI (currently auto-named RUN 1, RUN 2 — no rename yet)
- [ ] "✓ IN PARTY" button state → tap to jump to Party tab
- [ ] renderModal() partial rebuild on move add/remove (currently full rebuild)

---

## Backlog

### Testing

Set up **Playwright** E2E tests to guard critical user journeys. No build step — Playwright runs against a local `file://` URL or a simple static server.

**File structure:**
```
tests/
  journeys.spec.js   # all E2E tests
playwright.config.js  # config pointing at index.html
.github/
  workflows/
    test.yml         # run Playwright on every PR
```

**Critical journeys to cover (minimum viable suite):**
1. **Search by name** — type "Pikachu", expect detail card appears with type badge "Electric"
2. **Type filter** — tap Electric pill, expect browse list shows Pikachu
3. **Add to party** — search Pikachu, tap "ADD TO PARTY", expect party slot filled
4. **Gym render** — open Gyms tab, expect "Brock" card is present
5. **Where Am I** — open Where Am I tab, expect "Viridian Forest" card is present

**GitHub Actions config** (`.github/workflows/test.yml`):
```yaml
name: E2E Tests
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
```

**package.json** needed (minimal):
```json
{
  "devDependencies": { "@playwright/test": "^1.44.0" },
  "scripts": { "test": "playwright test" }
}
```

**AGENTS.md addition**: Add "Run `npm test` before committing. All tests must pass." to the Working Principles section.

### High Priority
- [ ] Rival (Gary) battle encounters — similar to Gyms, location-triggered
- [ ] TM/HM location reference ("where do I get Earthquake?")

### Medium Priority
- [ ] Evolution tracker (level/stone/trade conditions)
- [ ] Pokémon base stats display (Attack vs Sp.Atk to guide move choice)
- [ ] Search by move name → show all Pokémon that can learn it

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
