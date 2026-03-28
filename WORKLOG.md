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

### Session 2 — Multi-File + New Features

**Completed**
- [x] Split single HTML into index.html + style.css + js/data.js + js/app.js
- [x] Compact-encoded Pokémon and move arrays (string format, decoded at runtime)
- [x] PokeAPI sprite CDN integration (official artwork in detail, small sprite in cards)
- [x] Add to Party button on Search detail view (instant add with toast)
- [x] PC Swap modal when party is full (bottom sheet, tap to swap out)
- [x] Tappable coverage dots → jump to Search with type filter active
- [x] Multi-playthrough support (isolated party/recents per run)
- [x] Playthrough switcher in masthead
- [x] renderModal() partial update optimisation (move search no longer full-rebuilds)
- [x] README.md, CLAUDE.md, WORKLOG.md, agents/pokemon.md

---

## Active Todos

- [ ] `renderModal()` still fully rebuilds on move add/remove — could optimise further
- [ ] Playthrough rename (currently only auto-named RUN 1, RUN 2…)
- [ ] "IN PARTY" button state should open Party tab for quick editing

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
