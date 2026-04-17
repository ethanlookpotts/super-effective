# Super Effective — React + TypeScript rewrite

Big-bang rewrite of the vanilla-JS app into **Vite + React 19 + TypeScript**, preserving the static-GitHub-Pages deployment model. Draft lives on branch `claude/plan-react-tailwind-redesign-sjNE8`.

## Stack

- **Vite 6** — dev server + bundler, base path `/super-effective/`
- **React 19** + **React Router 7** (HashRouter) — no 404 fallback needed on Pages
- **TypeScript 5.7** — strict, `erasableSyntaxOnly`, `verbatimModuleSyntax`
- **Tailwind CSS v4** — via `@tailwindcss/vite`, theme tokens in `src/styles/index.css` mapped from the existing CSS variables
- **TanStack Query (React Query) v5** — data layer + caching; every repository read goes through a `queryFn`
- **Zod 3** — runtime validation at the repository boundary; all data entering components is parsed
- **Biome 1.9** — lint + format + import-sort in a single tool, CI reporter emits GitHub annotations
- **Vitest 2** — unit tests, node environment
- **Playwright** — E2E tests (shared with old app, in `/e2e`)

## Backend-agnostic data layer

```
src/repositories/
  types.ts            Repository interfaces — the public contract
  local-storage.ts    Default — parses/serialises through Zod
  gist.ts             GitHub Gist sync (ports js/data-manager.js)
  in-memory.ts        For tests + stories
  index.tsx           RepositoryProvider + hooks (useRepositories, etc.)
```

Swap implementations by passing a different `repositories` prop to `<RepositoryProvider>` — components and hooks are unchanged. A future backend (REST API, Supabase, IndexedDB…) only needs to implement `StoreRepository` + `SettingsRepository`.

## Scripts

```bash
npm install        # install
npm run dev        # Vite dev server at http://localhost:5173
npm run build      # typecheck + production build to dist/
npm run preview    # serve dist/ locally
npm run lint       # Biome lint + format check
npm run lint:fix   # Biome auto-fix
npm run typecheck  # tsc --noEmit
npm test           # Vitest
```

## CI

`.github/workflows/web.yml` runs on any change under `web/**`:

1. `biome check` with GitHub reporter → inline PR annotations
2. `tsc -b --noEmit`
3. `vitest run`
4. `vite build`

Build artifact uploaded as `web-dist` for PR previews.

## GitHub Pages preview

See root-repo `.github/workflows/pages-*.yml` — main deploy publishes to `gh-pages` root, PR previews deploy to `gh-pages/pr-preview/pr-N/`.
