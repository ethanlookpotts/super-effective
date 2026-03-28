# CLAUDE.md — Super Effective Build Guide

## Project Charter

Build the best, most useful mobile Pokémon game companion app. Prioritise:
1. Speed of use mid-battle (one tap = answer)
2. Accuracy of game data (Gen III type chart, FRLG obtain methods)
3. Mobile-first iPhone layout (max-width 480px, min touch target 44px)
4. Offline resilience (localStorage caching, graceful API fallback)

## Developer Context

- Developer works entirely from **iPhone** (Claude iOS app)
- No Mac/PC, no terminal — all steps must be iOS-friendly
- Never suggest CLI steps; flag anything requiring a computer
- GitHub operations via Safari or Claude Code only

## Architecture

### File Structure
```
index.html      HTML shell — imports CSS + JS, no inline logic
style.css       All styles — CSS variables, components, animations
js/data.js      Static game data (type chart, Pokémon, moves, bosses, locations)
js/app.js       All app logic — state, rendering, event handlers
agents/         Sub-agent specs (see agents/pokemon.md)
```

### Rules
- **No build step** — pure HTML/CSS/JS, edit files directly
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

## GitHub Pages Setup (iPhone)

1. Safari → github.com/YOUR-USERNAME/super-effective → Settings → Pages
2. Source: Deploy from branch
3. Branch: select the current `claude/...` branch, folder `/`
4. Save → live in ~60 seconds at `https://YOUR-USERNAME.github.io/super-effective/`

Every push to that branch auto-redeploys. No Actions needed.

## Commit Style

Use conventional commits:
- `feat: description` — new feature
- `fix: description` — bug fix
- `refactor: description` — code restructure, no behaviour change
- `docs: description` — README/CLAUDE/WORKLOG updates
- `data: description` — game data additions or corrections
- `style: description` — CSS-only changes

Keep commits small and focused — one logical change per commit.

## Sub-Agents

See `agents/pokemon.md` for the Pokémon data research sub-agent.

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
showToast('Message text');  // gold style
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
