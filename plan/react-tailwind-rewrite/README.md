# React + Tailwind Rewrite — Plan

Long-lived rewrite of the vanilla-JS FRLG companion app into Vite + React + TypeScript, preserving the static GitHub Pages deployment model. This directory is the source of truth for the migration plan; `WORKLOG.md` just references it.

## Branch & PR

- **Long-lived branch**: `refactor/react-tailwind` (this branch)
- **Tracking PR**: open against `main` — NOT to be merged until every phase in [03-phases.md](./03-phases.md) is `DONE` AND the PR preview matches the vanilla app's behaviour side-by-side
- **Live site**: `main` (vanilla) continues to deploy to `gh-pages` root; this PR gets a preview at `…/pr-preview/pr-N/` automatically via the workflow in `.github/workflows/pages-preview.yml`

## Plan index

- [01-architecture.md](./01-architecture.md) — stack choices, repository pattern, data flow
- [02-status.md](./02-status.md) — what's done vs outstanding, file inventory, size/gzip
- [03-phases.md](./03-phases.md) — phase-by-phase port plan with completion checkboxes
- [04-testing.md](./04-testing.md) — unit + E2E strategy, selector conventions
- [05-deployment.md](./05-deployment.md) — Pages deploy flow, preview flow, repo settings
- [06-risks.md](./06-risks.md) — open risks, tradeoffs, things to verify before merge

## Working principles

- **One phase at a time.** Complete a phase, commit, push, let CI + preview verify. Then move to the next.
- **Keep the plan current.** When something changes (scope, approach, a surprise), edit the relevant plan doc in the same commit as the code.
- **Preserve game data fidelity.** Obtain methods, boss teams, Gen III type chart, learnsets are all carefully compiled. Any change requires cross-checking Bulbapedia / Serebii / pret decomp.
- **Accessibility-first.** `getByRole` / `getByLabel` are the long-term selectors for tests; add `aria-label` at the component level, not in tests.
- **Biome is the only formatter.** Do not introduce Prettier or ESLint configs.
- **Never merge until feature parity.** The vanilla app at `main` stays live during the entire migration. The PR preview is for evaluation only.
