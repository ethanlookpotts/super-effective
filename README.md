# Super Effective — Pokémon FireRed & LeafGreen Companion

Your complete companion for FireRed & LeafGreen.

**[Check it out →](https://ethanlookpotts.github.io/super-effective/)**

---

### Build the perfect party

Catch Pokémon to your PC Box, get smart suggestions that maximise type coverage, and see at a glance exactly which party members to use against any opponent.

![Party matchup showing Venusaur and Gengar rated GREAT against Starmie](screenshots/search-party-matchup.png)

---

### Look up any Pokémon instantly

Type matchups, base stats, ability, obtain method, and evolution chain — everything you need before the next turn.

![Gengar detail card showing type chart, base stats, and obtain method](screenshots/search-gengar-detail.png)

---

### Scout every boss before you walk in

Full teams with levels, types, and tactical tips for every gym leader, rival encounter, and Elite Four member.

![Gyms page with Misty expanded showing Staryu and Starmie](screenshots/gyms-misty-expanded.png)

---

### Find what's in your area

Browse wild encounters by location. Tap any Pokémon to look it up.

![Where Am I page showing Safari Zone encounters by zone](screenshots/where-am-i-safari.png)

---

## Stack

- **Vite 6** + **React 19** + **TypeScript 5.7** (strict)
- **Tailwind CSS v4** with theme tokens
- **TanStack Query v5** over a **Zod**-validated, backend-agnostic Repository layer (static / localStorage / GitHub Gist)
- **Biome 1.9** — lint + format + import-sort
- **Vitest 2** (unit) + **Playwright** (E2E)

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build to dist/
npm test           # Vitest
npm run lint       # Biome check
npm run typecheck  # tsc --noEmit
```

## Deploy

Served statically from the `gh-pages` branch, published by GitHub Actions on every push to `main`. PRs get a live preview at `/pr-preview/pr-N/` (commented on the PR automatically). See `AGENTS.md` for the full build guide.
