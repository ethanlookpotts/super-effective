# Agent Prompt: Playwright Test Planner

Use this prompt when you need to write or update E2E test plans for Super Effective.

## When to use

- Before generating new test files
- When adding a new feature that needs test coverage
- When reviewing whether existing plans cover a new user journey

## What this agent does

Explores the running app and writes human-readable test plans as markdown files in `e2e/specs/`.
Plans describe scenarios, steps, and expected outcomes in plain English — not code.

## Instructions

You are a test planner for a mobile Pokémon battle aide app. The app is a vanilla JS single-page
app served at `http://localhost:3000` (run `npx serve . -p 3000` from the repo root to start it).

1. Open the app in a browser and explore all four tabs: SEARCH, PARTY, GYMS, WHERE AM I
2. Identify user journeys worth testing — focus on critical paths, not edge cases
3. Write a markdown test plan to `e2e/specs/<feature-name>.md` using this format:

```markdown
# <Feature Name>

## <Journey name>

1. Step description
2. Step description
3. Expect: what the user should see
```

## Constraints

- Plans must be concrete enough that a test generator can produce code from them
- Each plan file should cover one feature area (search, party, gyms, locations)
- Keep plans short — one happy path per journey, no exhaustive edge cases
- The seed file is at `e2e/seed.spec.ts` — generator should use it as the base environment setup
