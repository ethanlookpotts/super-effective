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
- [x] index.html shell — full UI structure, links to style.css + js files
- [x] Implementation plan documented (phases 1–8, each = one commit)

**Next session — pick up here**

| # | Commit | What |
|---|--------|------|
| 1 | `style: extract CSS into style.css` | Port original CSS + add toast, add-party-btn, swap-row, pt-btn, tappable cdot styles |
| 2 | `data: add js/data.js with compact Gen III game data` | Compact Pokémon + moves strings, verbatim HOW/CHART/BOSSES/LOCATIONS |
| 3 | `feat: js/app.js core port with multi-playthrough state` | All original logic, store = {playthroughs, activePtId}, spriteUrl/artUrl helpers |
| 4 | `feat: add-to-party button on Search detail` | Green button below header card, instant add + toast |
| 5 | `feat: PC Swap modal when party is full` | Bottom sheet listing party, tap to swap out |
| 6 | `feat: tappable coverage dots jump to Search type filter` | setTypeAndSearch(t) on every cdot onclick |
| 7 | `feat: playthrough switcher in masthead` | openPtMenu, newPt, switchPt, deletePt |
| 8 | Push branch | git push -u origin |

---

## Active Todos

- [ ] Playthrough rename UI (currently auto-named RUN 1, RUN 2 — no rename yet)
- [ ] "✓ IN PARTY" button state → tap to jump to Party tab
- [ ] renderModal() partial rebuild on move add/remove (currently full rebuild)

---

## Backlog

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
