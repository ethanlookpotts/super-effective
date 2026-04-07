# AGENTS.md — Super Effective Build Guide

## Working Principles

- **Ask questions** — if anything is ambiguous, ask before implementing
- **Small, focused commits** — one logical change per commit using conventional commit messages. Commit messages are single-line only — no body, no Co-Authored-By trailer.
- **WORKLOG flow** — use the `worklogger` skill (or `skills/worklogger.md`) to execute any Active Todo or manage the backlog; it owns the implement → test → mark → commit sequence and all WORKLOG structure rules.
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
index.html              HTML shell — imports CSS + JS, no inline logic
style.css               All styles — CSS variables, components, animations
js/data-types.js        Gen III type chart, PHYS set, gm()/dmult() helpers
js/data-abilities.js    ABILITY_MODS, getAbilityMod()
js/data-pokemon.js      POKEMON (151), HOW obtain data, getObtain()
js/data-locations.js    LOCATIONS encounter data (Where Am I)
js/data-moves.js        ALL_MOVES, TM_HM
js/data-bosses.js       BOSSES, RIVALS, tc() color helper
js/breakdown.js         Sprite helpers, applyAbilityMod, breakdown overlay
js/state.js             Store (localStorage), playthrough state, learnset cache, addRecent
js/search.js            Search page, type filter pills, renderPokeDetail, renderPDrop
js/party.js             Party page, edit modal, PC swap modal
js/gyms.js              Gyms & Elite Four page rendering
js/pages.js             Nav/drawer, masthead, Where Am I page, TMs page, goSearch
js/playthroughs.js      Playthrough menu (create/switch/delete/rename)
js/init.js              showToast, app initialisation
skills/                 Flat skill files (any agent) — symlinked into .claude/skills/ for Claude Code
AGENTS.md               Canonical build guide (this file)
CLAUDE.md               Thin wrapper — @AGENTS.md include
README.md               Brief overview, file map, deploy instructions
WORKLOG.md              Session log, todos, backlog, notes
```

**Keep files small and focused** — each file should cover one feature area. Small files reduce agent context overhead: when fixing a bug in party logic, an agent reads only `js/party.js` (~220 lines) instead of the entire codebase. When adding a new feature, identify the 1–2 relevant files before opening anything else.

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

## Browser Screenshots

When using MCP browser tools to take screenshots (smoke-testing, visual debugging, research), always save them to `screenshots/`:

```
browser_take_screenshot filename="screenshots/my-description.png"
```

The `screenshots/` folder is git-ignored. Never save screenshots to the repo root or any tracked path.

## Commit Style

Use conventional commits:
- `feat: description` — new feature
- `fix: description` — bug fix
- `refactor: description` — code restructure, no behaviour change
- `docs: description` — README/AGENTS/WORKLOG updates
- `data: description` — game data additions or corrections
- `style: description` — CSS-only changes

Keep commits small and focused — one logical change per commit. Commit messages must be a single line only — no body, no Co-Authored-By trailer.

## Skills

All skills live in `skills/` and are symlinked to `.claude/skills/` for automatic Claude Code loading. Each `SKILL.md` contains YAML frontmatter (name + description for triggering) followed by instructions usable by any AI agent.

| Skill | When to use |
|---|---|
| `skills/worklogger.md` | Executing Active Todos, managing backlog, maintaining WORKLOG structure |
| `skills/pokemon.md` | Researching accurate game data (obtain methods, boss teams, move learnsets) |
| `skills/playwright-planner.md` | Writing new E2E test plans in `e2e/specs/` |
| `skills/playwright-generator.md` | Converting spec plans into runnable `e2e/*.spec.ts` files |
| `skills/playwright-healer.md` | Repairing broken tests after UI changes |

## Testing

`npm test` runs the full suite (unit + E2E). Both must pass before every commit and in CI.

```bash
npm run test:unit   # node:test unit tests — fast, no browser needed
npm run test:e2e    # Playwright E2E tests — requires a browser
npm test            # runs both in sequence
```

### Unit Tests (`test/`)

Pure logic tests for calculation modules. Live in `test/`:

```
test/
  party-calc.test.js   # scoring, greedy algorithm, computeSuggestions
```

**Strategy:** load browser source files as-is via `node:vm` — tests run the literal browser code, no dual exports, no mocks of core logic.

When adding a new pure-logic module, add a corresponding `test/<module>.test.js`.

### E2E Tests (`e2e/`)

Tests use [Playwright](https://playwright.dev). All test-related files live in `e2e/`:

```
e2e/
  seed.spec.ts          # baseline environment setup (all tests build on this)
  *.spec.ts             # generated test files (one per spec plan)
  specs/
    *.md                # human-readable test plans (source of truth for generators)
```

**Workflow:**
1. When adding a feature, add a plan to `e2e/specs/` (or use the `playwright-planner` skill)
2. Generate tests with the `playwright-generator` skill
3. If tests break after a change, use the `playwright-healer` skill to repair them

**Selector convention — accessible locators only:**
Tests must behave like a real user, not a machine inspecting the DOM.

| Preferred | Avoid |
|---|---|
| `getByRole('button', { name: 'Open menu' })` | `.locator('.hamburger-btn')` |
| `getByLabel('Pokémon name…')` | `.locator('#s-in')` |
| `getByText('Brock')` | `.locator('.gym-name')` |

- Use `getByRole` / `getByLabel` / `getByText` as the default
- Use `locator('#id')` only for stable semantic IDs (form fields, page containers)
- Never use CSS class selectors — they are implementation details and break silently
- If an element has no accessible name, add `aria-label="..."` to the HTML before writing the test

**Local setup:**
```bash
npm ci
npx playwright install chromium
npm test
```

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
