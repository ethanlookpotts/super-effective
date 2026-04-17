# Architecture

## Stack

| Concern | Choice | Notes |
|---|---|---|
| Bundler / dev server | Vite 6 | `base: '/super-effective/'` for Pages |
| Framework | React 19 | Strict mode on; Suspense-ready |
| Types | TypeScript 5.7 strict | `erasableSyntaxOnly`, `verbatimModuleSyntax` |
| Styling | Tailwind CSS v4 | Theme tokens in `src/styles/index.css` mirror legacy CSS vars |
| Routing | React Router 7 `HashRouter` | No 404 fallback needed on Pages |
| Server state | TanStack Query v5 | Natural seam over swappable repositories |
| Validation | Zod 3 | Parsed at every repository boundary |
| Lint + format | Biome 1.9 | Single tool; PR annotations via `--reporter=github` |
| Unit tests | Vitest 2 | Replaces `node:vm` hack from vanilla |
| E2E | Playwright | Selectors re-ported, accessible locators only |

Deliberate non-choices:
- **Not Redux / Zustand.** All persistent state lives behind the Repository interface; TanStack Query caches it. React local state is only for ephemeral UI (modal open, search query).
- **Not Next.js / Remix.** Pages is static-only. SPA + `HashRouter` is sufficient and keeps the bundle small.
- **Not ESLint + Prettier.** Biome replaces both.

## Layered architecture

```
┌─────────────────────────────────────────────────────────────┐
│ routes/ + components/   UI only — no fetch, no localStorage  │
├─────────────────────────────────────────────────────────────┤
│ hooks/                  React Query hooks + mutation hooks   │
├─────────────────────────────────────────────────────────────┤
│ repositories/           StoreRepository / SettingsRepository │
│   local-storage.ts  (default)                                │
│   in-memory.ts      (tests)                                  │
│   gist.ts           (removed — see features/sync instead)    │
├─────────────────────────────────────────────────────────────┤
│ schemas/                Zod — the boundary between layers    │
├─────────────────────────────────────────────────────────────┤
│ data/                   Static bundled game data (typed)     │
│ lib/                    Pure helpers (damage math, colours)  │
│ features/sync/          Gist sync client + conflict UI       │
│ features/scan/          Claude Vision OCR client             │
└─────────────────────────────────────────────────────────────┘
```

## Repository pattern

`StoreRepository` is the **only** thing that writes to localStorage. Components and hooks never touch `window.localStorage` directly. Swap implementations by passing a different `repositories` prop to `<RepositoryProvider>`:

```ts
interface StoreRepository {
  id: string;
  capabilities: StoreCapabilities;
  loadStore(): Promise<Store>;
  saveStore(store: Store): Promise<void>;
  subscribe?(listener: (store: Store) => void): () => void;
}
```

Current impls:
- `LocalStorageStoreRepository` — default, validates via Zod on load/save, runs migrations for legacy `se_v1` payloads
- `InMemoryStoreRepository` — tests and stories

Future impls (drop-in, no component changes needed):
- `StaticRepository` — read-only demo data
- `SupabaseRepository` or similar — cloud-native backend

### Gist sync is NOT a repository

An earlier design made `GistStoreRepository` a `StoreRepository`. That was wrong — gist is remote and slow, it can't be the primary store. The correct model:

- Primary store: `LocalStorageStoreRepository` (or whatever is injected)
- Sync layer: `features/sync/` pushes/pulls between the local repo and a gist, independently

`useSync()` hook provides: `pull`, `push`, `markLocalChanged` (debounced), `resolveConflict`, `disconnect`, and a `status` observable.

## Data flow for a mutation

```
User action  →  component onClick  →  useMutation (hook)
                                      └─> repo.saveStore(next)
                                          └─> Zod.parse → localStorage
                                          └─> dispatch 'storage' event
                                      └─> qc.invalidateQueries(['store'])
                                          └─> all useStore consumers refetch
                                      └─> (if sync) markLocalChanged()
                                          └─> debounced push to gist
```

## Schema lives at the boundary

```ts
// src/schemas/index.ts  ← source of truth
Store = { playthroughs: Playthrough[], activePtId: string | null }
Playthrough = { id, name, gameId, party, pc, recents, rivalStarter, tmInventory }
PartyMember = { n, name, types, moves, level?, ability?, item?, ... }
```

All types are `z.infer<typeof X>`. No hand-rolled `interface` duplicates. Legacy `se_v1` payloads run through `migrateLegacyStore()` before `Store.safeParse()`.

## URL state

`HashRouter` paths; search params preserve state across reloads:

- `#/search` — blank
- `#/search?n=<dex>` — selected Pokémon detail
- `#/search?type=<TypeName>` — active type filter
- `#/search?m=<moveName>` — move detail
- `#/search?q=<text>` — raw query (for cross-route links)
- `#/party?teach=<dex>:<moveName>` — deep-link to teach modal
