# AGENTS.md — Super Effective Build Guide

## Working Principles

- **Ask questions** — if anything is ambiguous, ask before implementing
- **Small, focused commits** — one logical change per commit using conventional commit messages. Commit messages are single-line only — no body, no Co-Authored-By trailer, no Claude Code footer/URL. All commits are authored by Ethan Look-Potts <ethanlookpotts@gmail.com>; never set the author to Claude or any other identity, and never add a co-author trailer.
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

Single-page React app built with Vite, served as static files from GitHub Pages. Data layer is backend-agnostic so static data, localStorage, or GitHub Gists can be swapped behind the same interface.

### File Structure
```
index.html                Vite entry — references src/main.tsx
vite.config.ts            base '/super-effective/' for GH Pages
tsconfig.*.json           Strict TS; erasableSyntaxOnly; verbatimModuleSyntax
biome.json                Lint + format + import-sort config (single tool)
package.json              All deps; npm scripts for dev / build / lint / typecheck / test
src/
  main.tsx, App.tsx       Entry + StrictMode
  providers.tsx           QueryClientProvider + RepositoryProvider
  routes.tsx              HashRouter + route table
  vite-env.d.ts           Vite client types
  styles/index.css        Tailwind v4 @import + @theme tokens (palette + radii)
  schemas/index.ts        Zod: Store, Playthrough, PartyMember, PartyMove, Settings
  repositories/           Backend-agnostic data layer
    types.ts                StoreRepository / SettingsRepository interfaces
    local-storage.ts        Default — parses/validates via Zod
    gist.ts                 GitHub Gist sync
    in-memory.ts            Test + story impl
    index.tsx               RepositoryProvider context + useRepositories hook
  hooks/                  React Query hooks — one file per repo method cluster
    use-store.ts            useStore, useSaveStore, useActivePlaythrough
    use-settings.ts         useSettings, useSaveSettings
  routes/                 One file per page
    search.tsx, party.tsx, gyms.tsx, where-am-i.tsx, tms.tsx, settings.tsx
  components/shell.tsx    Masthead + nav tabs (44px min touch target)
  data/                   Typed game data (ported from vanilla js/data-*.js) — per-game modules
  lib/                    Sprite URLs, colour helpers
test/                     Vitest unit tests — mirror src/ layout
e2e/                      Playwright tests (selectors re-ported for React DOM)
  seed.spec.ts              Baseline environment setup
  specs/*.md                Human-readable test plans
skills/                   Flat skill files — symlinked into .claude/skills/
.github/workflows/
  ci.yml                    Biome + tsc + Vitest + build on every PR / main push
  pages-deploy.yml          main → gh-pages root
  pages-preview.yml         PR → gh-pages/pr-preview/pr-N/
AGENTS.md                 Canonical build guide (this file)
CLAUDE.md                 Thin wrapper — @AGENTS.md include
README.md                 Brief overview, file map, deploy instructions
WORKLOG.md                Session log, todos, backlog, notes
```

**Keep files small and focused** — each file should cover one feature area. Small files reduce agent context overhead: when fixing a bug in party logic, an agent reads only `src/routes/party.tsx` + `src/hooks/use-store.ts` instead of the entire codebase. When adding a new feature, identify the 1–2 relevant files before opening anything else. Components, routes, repositories, hooks, and schemas all follow one-thing-per-file.

Split content into multiple files wherever it aids maintainability — e.g. per-game data modules, per-route files, per-repository files.

### Rules

- **Build step required** — `npm run build` produces `dist/`, served by GitHub Pages. Dev loop is `npm run dev` (Vite HMR at localhost:5173).
- **TypeScript strict** — no `any`, prefer `import type`, `erasableSyntaxOnly` (no parameter properties, no enums), `verbatimModuleSyntax`. Biome enforces `useImportType` and `noExplicitAny`.
- **Data layer is backend-agnostic** — all persistence flows through a `Repository` implementation. Components and hooks depend on the `StoreRepository` / `SettingsRepository` interface, never on `localStorage` / `fetch` / gists directly.
- **Zod at the boundary** — every repository read parses untrusted data through a schema. Invalid data never reaches components. Schemas in `src/schemas/` are the source of truth; types are `z.infer<typeof X>`.
- **React Query owns server state** — no `useState` for anything that comes from a repository. Use query keys + `invalidateQueries` on mutations. Default `staleTime: 30_000`.
- **Tailwind utility-first** — theme tokens in `src/styles/index.css` mirror the original CSS variables; dark mode via `[data-theme="dark"]` on `<html>`.
- **Accessibility first** — `getByRole` / `getByLabel` / `getByText` over CSS selectors in tests. Add `aria-label` to JSX when an element lacks an accessible name. Minimum touch target 44px.
- **Biome is the only linter/formatter** — no ESLint, no Prettier. `npm run lint` in CI blocks merges.
- **Single localStorage** store key: `se_v1` (unchanged — data backwards-compatible with the vanilla app).
- **No personal data** — never commit credentials, usernames, or identifying info.
- **PokeAPI sprites** from CDN: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png`. Official artwork: `.../other/official-artwork/{id}.png`. No API key needed. Always render with a graceful fallback for offline.

### Key State Shape (see `src/schemas/index.ts` for authoritative Zod)

```ts
Store = { playthroughs: Playthrough[], activePtId: string | null }
Playthrough = { id, name, gameId, party: PartyMember[], pc: PartyMember[],
                recents: number[], rivalStarter, tmInventory }
PartyMember = { n, name, types, moves: PartyMove[], level?, ability?, item?, ... }
PartyMove = { name, type, cat? }
```

### Gen III Type Chart Rules
- Physical types (use Atk/Def): Normal Fighting Flying Poison Ground Rock Bug Ghost Steel
- Special types (use SpAtk/SpDef): Fire Water Grass Electric Ice Psychic Dragon Dark
- Type chart is STATIC in `src/data/` — do not replace with PokeAPI (Gen IX chart differs)
- Fairy type is included for completeness but is not catchable in FRLG

### Do Not Change
- `HOW` obtain data (carefully compiled for FRLG)
- Type effectiveness chart (Gen III specific)
- `BOSSES` team compositions and levels
- `LOCATIONS` encounter data

## GitHub Pages Setup

Pages is served from the `gh-pages` branch (managed by GitHub Actions — do not edit directly).

**One-time repo config (already done):**
1. Settings → Actions → General → Workflow permissions: **Read and write**
2. Settings → Pages → Source: Deploy from a branch → `gh-pages`, folder `/ (root)`

**Deployment flow:**
- `.github/workflows/pages-deploy.yml` — every push to `main` builds and publishes to `gh-pages` root
- `.github/workflows/pages-preview.yml` — every PR builds and publishes to `gh-pages/pr-preview/pr-N/`; preview URL auto-posted as a PR comment; teardown on PR close
- Main deploys use `keep_files: true` so PR previews survive main pushes

Live site: `https://ethanlookpotts.github.io/super-effective/`. PR previews: `https://ethanlookpotts.github.io/super-effective/pr-preview/pr-N/`.

## Browser Screenshots

When using MCP browser tools to take screenshots (smoke-testing, visual debugging, research), always save them to `screenshots/`.

Ad-hoc screenshots are git-ignored. Only the 4 README screenshots are tracked:
- `screenshots/search-party-matchup.png`
- `screenshots/search-gengar-detail.png`
- `screenshots/gyms-misty-expanded.png`
- `screenshots/where-am-i-safari.png`

README screenshot regeneration uses Playwright against the running Vite dev server — add a `scripts/screenshot-readme.ts` helper when the relevant routes are ported.

## Commit Style

Use conventional commits:
- `feat: description` — new feature
- `fix: description` — bug fix
- `refactor: description` — code restructure, no behaviour change
- `docs: description` — README/AGENTS/WORKLOG updates
- `data: description` — game data additions or corrections
- `style: description` — Tailwind / CSS-only changes
- `chore: description` — tooling, deps, scaffolding
- `ci: description` — workflow changes
- `test: description` — test-only changes

Keep commits small and focused — one logical change per commit. Commit messages must be a single line only — no body, no Co-Authored-By trailer, and no "Generated with Claude Code" / `https://claude.ai/code/...` footer.

**Authorship:** every commit must be authored by `Ethan Look-Potts <ethanlookpotts@gmail.com>`. Do not commit as `Claude <noreply@anthropic.com>` (or any other identity) and do not add a co-author trailer — Ethan is the sole author on the record. If `git config user.name` / `user.email` is not already set to this identity, set it locally (not globally) before committing, or pass `--author="Ethan Look-Potts <ethanlookpotts@gmail.com>"` to `git commit`.

## Skills

All skills live in `skills/` and are symlinked to `.claude/skills/` for automatic Claude Code loading. Each `SKILL.md` contains YAML frontmatter (name + description for triggering) followed by instructions usable by any AI agent.

| Skill | When to use |
|---|---|
| `skills/worklogger.md` | Executing Active Todos, managing backlog, maintaining WORKLOG structure |
| `skills/pokemon.md` | Researching accurate game data (obtain methods, boss teams, move learnsets) |
| `skills/playwright-planner.md` | Writing new E2E test plans in `e2e/specs/` |
| `skills/playwright-generator.md` | Converting spec plans into runnable `e2e/*.spec.ts` files against the Vite dev server |
| `skills/playwright-healer.md` | Repairing broken tests after UI changes |

## Developer Workflow

```bash
npm install        # install
npm run dev        # Vite dev server at http://localhost:5173
npm run build      # typecheck + production build to dist/
npm run preview    # serve dist/ locally
npm run lint       # Biome check (lint + format + import-sort)
npm run lint:fix   # auto-fix
npm run typecheck  # tsc --noEmit
npm test           # Vitest
```

CI (`.github/workflows/ci.yml`) runs `lint → typecheck → test → build` on every PR and main push. All four must be green to merge. Biome uses `--reporter=github` in CI so lint errors annotate PR files inline.

## Testing

### Unit Tests (Vitest, `test/`)

Pure logic lives in `src/`, tests mirror the source layout in `test/`:

```
test/
  repositories.test.ts   # round-trip tests for StoreRepository / SettingsRepository
  <module>.test.ts       # one test file per pure-logic module
```

When adding a pure-logic module (scoring, parsing, type math), add a matching test file. Tests import from `~/` (the src alias).

### E2E Tests (Playwright, `e2e/`)

Tests use [Playwright](https://playwright.dev) and run against `npm run preview` (or `npm run dev` locally):

```
e2e/
  seed.spec.ts          # baseline environment setup
  *.spec.ts             # generated test files (one per spec plan)
  specs/*.md            # human-readable test plans (source of truth for generators)
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
- Use `locator('#id')` only for stable semantic IDs
- Never use CSS class selectors — they are implementation details and break silently
- If an element has no accessible name, add `aria-label="..."` to the JSX before writing the test

## Adding a New Game Module

Future games (RBY, GSC, RSE, etc.) follow this pattern:

```ts
// src/data/games/<game-id>.ts
import type { GameModule } from "~/data/games/types";

export const GAME_GAMEID: GameModule = {
  id: "gameid",
  name: "Game Name",
  gen: 3,
  dexRange: [1, 251],   // which Pokémon are relevant
  bosses: [...],         // gym leaders, E4, champion
  locations: [...],      // encounter data
  obtain: { /* dex number → obtain methods */ },
};
```

Shell UI (`App.tsx`, routes, components) stays identical. The game module provides data. Type chart differences per generation go through a `TypeChart` interface (Gen I lacks Dark/Steel; Gen II+ differs from Gen VI+).

## Recurring Patterns

### Toast notification
Use the `useToast()` hook — renders into a portal. Call `toast("Message")` or `toast("Error", "red")`.

### Navigate to Search with type filter
Use `useNavigate()` + hash query: `navigate("/search?type=Electric")`. The Search route reads `useSearchParams()` and activates the Electric pill.

### Add Pokémon to current playthrough party
Call the `useAddToParty()` hook; it handles full-party swap via a modal automatically.

### Read / write the active playthrough
```ts
const active = useActivePlaythrough();   // read-only
const save = useSaveStore();             // mutation
save.mutate({ ...store, playthroughs: [...] });
```

Never touch `localStorage` directly — always go through `useStoreRepository()` or one of the hooks above.
