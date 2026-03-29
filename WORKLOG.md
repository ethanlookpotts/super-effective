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

**Current state after Session 2**
- `index.html` — complete HTML shell with all tab panes, modals (party-edit, pc-swap, playthrough-menu), nav, masthead, toast element, and `<script>` tags referencing `style.css`, `js/data.js`, `js/app.js`
- `style.css` — **does not exist yet**
- `js/data.js` — **does not exist yet**
- `js/app.js` — **does not exist yet**
- `legacy-frlg-battle-aide.html` — reference implementation (~81 KB); contains all CSS, data, and logic to port

---

## Next Session — Pick Up Here

All HTML scaffolding is done. The entire remaining work is CSS + data + JS. Do each phase as one focused commit. Reference `legacy-frlg-battle-aide.html` for the source of truth on all styling, data, and logic.

### Phase 1 — `style: extract CSS into style.css`

Copy every rule from `<style>` in the legacy file verbatim into `style.css`. Then **add** the following rules that are new (not in legacy):

| Selector | Purpose |
|---|---|
| `.toast` | Fixed bottom-center notification; gold bg; fade+slide-up animation; `z-index: 9999` |
| `.toast.red` | Error variant; red bg |
| `.add-party-btn` | Full-width green button below the Pokémon header card in search detail |
| `.swap-row` | Row in PC-swap modal: sprite + name + types; tap to swap out |
| `.pt-btn` | Playthrough switcher button in masthead (top-right pill) |
| `.cdot[data-type]` | Make coverage dots have `cursor: pointer` + subtle hover scale when tappable |

**Design reference from legacy:**
- Dark theme: `#1a1a2e` page bg, `#16213e` card bg, `#0f3460` accent
- Gold: `#ffc93c`, green: `#3ddc84`, red: `#ff3d5a`, blue: `#4dabf7`
- Noise grain overlay via SVG filter on `body::before`
- Type badge colors — 18 type-specific CSS custom properties already in legacy
- Font: system-ui / -apple-system stack
- `max-width: 480px` centered, `100vw` on mobile
- Animations: `fadeUp` (cards stagger in), `slideUp` (modals), `rotateIcon` (expandable chevron)

---

### Phase 2 — `data: add js/data.js with Gen III FRLG data`

Create `js/data.js`. Copy the following verbatim from the legacy file (do NOT alter values — all data is production-accurate):

| Constant | Description |
|---|---|
| `TYPES` | Array of 18 type name strings |
| `PHYS` | Set of type names that are Physical in Gen III (Normal Fighting Flying Poison Ground Rock Bug Ghost Steel) |
| `CHART` | Type effectiveness map: `CHART[attacker][defender]` → multiplier (0, 0.5, 1, 2) |
| `POKEMON` | Array of 151 objects `{n, name, types[]}` |
| `HOW` | Object keyed by dex number → array of obtain-method strings (FRLG-specific; includes version exclusives) |
| `ALL_MOVES` | Array of objects `{name, type, cat}` where cat is `'phy'|'spe'|'sta'` |
| `BOSSES` | Array of boss objects `{name, sub, icon, color, tip, team[{name,lv,types[]}]}` — 8 gym leaders, 4 E4, Champion |
| `LOCATIONS` | Array of location objects `{name, methods[{label, pokemon[]}]}` — ~31 FRLG locations |

Also add helper functions (copy verbatim):
```js
function gm(attType, defTypes) { /* returns effectiveness multiplier */ }
function dmult(attType, defTypes) { /* returns display string '4×','2×','½×','¼×','0×' or '' */ }
```

---

### Phase 3 — `feat: js/app.js core port with multi-playthrough state`

Port ALL logic from the legacy file's `<script>` tag into `js/app.js`, with these **changes**:

**State model** (new — not in legacy):
```js
// Old (legacy):
let party = [];           // stored under 'frlg_party'
let recents = [];         // stored under 'frlg_recents'

// New (app.js):
let store = {
  playthroughs: [],       // array of playthrough objects
  activePtId: null        // id of active playthrough
};
// localStorage key: 'se_v1'

// Playthrough object:
{ id: crypto.randomUUID(), name: 'RUN 1', gameId: 'frlg', party: [], recents: [] }
```

**Sprite helpers** (new — not in legacy):
```js
function spriteUrl(n) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${n}.png`;
}
function artUrl(n) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${n}.png`;
}
```

Everything else — search, party render, gym render, location render, modal open/close, type pills, dropdown — ports verbatim from legacy. Wire all localStorage reads/writes to the new `se_v1` / `store` shape.

**Key functions to port (names can match legacy exactly):**

| Function | Tab/Feature |
|---|---|
| `showPage(id)` | Tab switching |
| `renderSearch()` | SEARCH default state (recents + type hint) |
| `doSearch(q)` | Query-mode search |
| `showPokemon(n)` | Pokémon detail card |
| `setTypeAndSearch(type)` | Jump to SEARCH with type pill active |
| `renderParty()` | PARTY tab render |
| `renderGyms()` | GYMS tab render |
| `renderLocations()` | WHERE AM I tab render |
| `openModal(pokemonN)` | Open party-edit modal for a slot |
| `saveModal()` | Save party member edits |
| `showToast(msg, color)` | Toast notification |
| `loadStore()` / `saveStore()` | localStorage r/w |

---

### Phase 4 — `feat: add-to-party button in search detail`

In `showPokemon(n)`, after rendering the header card, inject:

```html
<button class="add-party-btn" onclick="addToParty(${n})">➕ ADD TO PARTY</button>
```

`addToParty(n)`:
- If party has < 6 members → push `{n, name, types, moves:[], level:''}` → `saveStore()` → `showToast('Added to party')` → update button to "✓ IN PARTY"
- If party has 6 members → open PC-swap modal

---

### Phase 5 — `feat: PC Swap modal when party is full`

`openSwapModal(n)`:
- Renders `.swap-row` for each of the 6 party members (sprite, name, types)
- Tap a row → replace that slot with the new Pokémon → close modal → toast "Swapped in"

---

### Phase 6 — `feat: tappable coverage dots jump to Search type filter`

In `renderParty()`, for each `.cdot`:
```html
<span class="cdot ${isGap ? 'gap' : ''}" data-type="${t}" onclick="setTypeAndSearch('${t}')">${symbol}</span>
```

---

### Phase 7 — `feat: playthrough switcher in masthead`

Add `openPtMenu()`:
- Renders list of all playthroughs; active one highlighted
- "＋ NEW RUN" button → `createPlaythrough()` → auto-switch → close menu
- Each row has a tap-to-switch and a delete (🗑) button
- `switchPt(id)` → sets `store.activePtId` → `saveStore()` → re-render all tabs → close menu
- `deletePt(id)` → confirm → remove → if active was deleted, switch to first remaining or create new

---

### Phase 8 — Push

```bash
git push -u origin claude/update-worklog-legacy-ref-DFcMK
```

Verify GitHub Pages is deployed (Settings → Pages → branch `claude/update-worklog-legacy-ref-DFcMK`, folder `/`).

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
- The legacy file's `HOW`, `CHART`, `BOSSES`, `LOCATIONS` are carefully hand-curated — never regenerate from PokeAPI or any other source; copy verbatim only.
