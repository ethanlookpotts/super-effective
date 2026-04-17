# Plans

Each subdirectory here is a long-lived project plan. A plan is the source of truth for architecture, phases, status, risks, testing, and deployment for one ongoing effort. `WORKLOG.md` references these instead of duplicating the content.

## Active plans

- [`react-tailwind-rewrite/`](./react-tailwind-rewrite/) — rewrite of the vanilla-JS FRLG app into Vite + React + TS + Tailwind, tracked on branch `refactor/react-tailwind`

## Conventions

- One subdirectory per project, kebab-case (`<descriptive-name>/`)
- `README.md` inside each subdirectory indexes the project's plan files
- Numbered files (`01-architecture.md`, `02-status.md`, …) for the predictable slots: architecture, status, phases, testing, deployment, risks. Add more as needed.
- Update the `status` file in the same commit as any code change that flips a phase item
- When a project finishes, move its subdirectory to `plan/archive/<name>/` rather than deleting — it preserves the design history
