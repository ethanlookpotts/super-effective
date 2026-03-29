# AGENTS.md — Super Effective Build Guide

## Working Principles

- **Ask questions** — if anything is ambiguous, ask before implementing
- **Small, focused commits** — one logical change per commit using conventional commit messages
- **Keep docs current** — update README, WORKLOG, and CLAUDE.md alongside code changes
- **WORKLOG.md** tracks progress, active todos, backlog, and session notes — update it every session so the next agent can pick up instantly
- **README.md** — brief repo overview: what it is, file map, how to run/deploy locally
- **CLAUDE.md** — thin wrapper: `@AGENTS.md` include only; keep it current so Claude picks up all context

## Project Charter

Build the best, most useful mobile Pokémon game companion app. Prioritise:
1. Speed of use mid-battle (one tap = answer)
2. Accuracy of game data (Gen III type chart, FRLG obtain methods)
3. Mobile-first layout (max-width 480px, min touch target 44px)
4. Offline resilience (localStorage caching, graceful API fallback)

## Architecture

### File Structure
```
index.html           HTML shell — imports CSS + JS, no inline logic
style.css            All styles — CSS variables, components, animations
js/data.js           Static game data (type chart, Pokémon, moves, bosses, locations)
js/app.js            All app logic — state, rendering, event handlers
agents/              Sub-agent prompt specs (see agents/pokemon.md)
AGENTS.md            Canonical build guide (this file)
CLAUDE.md            Thin wrapper — @AGENTS.md include
README.md            Brief overview, file map, deploy instructions
WORKLOG.md           Session log, todos, backlog, notes
```

Split content into multiple files wherever it aids maintainability — e.g. separate data files per game, separate CSS files per feature area. The app is served directly from GitHub Pages so any file structure that is flat or uses relative paths works.

### Rules
- **No build step** — pure HTML/CSS/JS, edit files directly; GitHub Pages serves them as-is
- **No frameworks** — vanilla JS only
- **Single localStorage** store key: `se_v1` (JSON blob with all playthroughs)
- **No personal data** — never commit credentials, usernames, or identifying info
- **PokeAPI sprites** are loaded from CDN URLs — no API key needed
- Split files for maintainability, but no module bundler

### Key State (js/app.js)
```
store = { playthroughs: [...], activePtId: '...' }
  playthrough = { id, name, gameId, party[], recents[] }
  party member = { n, name, types[], moves[], level }
  move = { name, type, cat }
```

### Gen III Type Chart Rules
- Physical types (use Atk/Def): Normal Fighting Flying Poison Ground Rock Bug Ghost Steel
- Special types (use SpAtk/SpDef): Fire Water Grass Electric Ice Psychic Dragon Dark
- Type chart is STATIC in data.js — do not replace with PokeAPI (Gen IX chart differs)
- Fairy type is included for completeness but is not catchable in FRLG

### PokeAPI Usage
- Sprites only: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png`
- Official artwork: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{id}.png`
- No API calls needed — these are static CDN URLs
- Always add `onerror="this.style.display='none'"` for offline fallback

### Do Not Change
- `HOW` obtain data (carefully compiled for FRLG)
- `CHART` type effectiveness (Gen III specific)
- `BOSSES` team compositions and levels
- `LOCATIONS` encounter data

## GitHub Pages Setup

1. Repo Settings → Pages → Deploy from branch
2. Select the active `claude/...` branch, folder `/`
3. Save → live in ~60 seconds at `https://USERNAME.github.io/super-effective/`

Every push to that branch auto-redeploys. No Actions needed.

### Leveraging GitHub Pages
- All assets are served statically — no server-side logic needed
- Split large data files (e.g. per-game data) so each is a separate `<script>` tag; this avoids one huge JS file and makes future game modules easy to add
- Use relative paths only (`js/data.js`, not absolute URLs) so the app works both on GitHub Pages and locally via `file://`
- Test locally by opening `index.html` directly in a browser — no dev server needed

## Commit Style

Use conventional commits:
- `feat: description` — new feature
- `fix: description` — bug fix
- `refactor: description` — code restructure, no behaviour change
- `docs: description` — README/AGENTS/WORKLOG updates
- `data: description` — game data additions or corrections
- `style: description` — CSS-only changes

Keep commits small and focused — one logical change per commit.

## Sub-Agent Prompts

See `agents/pokemon.md` for the Pokémon data research prompt.

Use sub-agents for:
- Researching accurate game data (obtain methods, move learnsets, boss teams)
- Auditing code for size/quality before large refactors
- Designing UX flows before implementing

## Adding a New Game Module

Future games (RBY, GSC, RSE, etc.) follow this pattern:

```js
// In js/data-GAMEID.js:
const GAME_GAMEID = {
  id: 'gameid',
  name: 'Game Name',
  gen: 3,
  dexRange: [1, 251],   // which Pokémon are relevant
  bosses: [...],         // gym leaders, E4, champion
  locations: [...],      // encounter data
  obtain: {},            // dex number → obtain methods
};
```

Shell UI (index.html, style.css, app.js) stays identical. The game module provides data.

## Recurring Patterns

### Toast notification
```js
showToast('Message text');       // gold style
showToast('Error text', 'red');
```

### Navigate to Search with type filter
```js
setTypeAndSearch('Electric');  // jumps to Search, activates Electric pill
```

### Add Pokémon to current playthrough party
```js
addToParty(pokemonDexNumber);  // handles full-party swap modal automatically
```
