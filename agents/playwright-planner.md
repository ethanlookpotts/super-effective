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
app — open `index.html` directly in the browser via its absolute file path (e.g. `file:///absolute/path/to/super-effective/index.html`). No server needed.

1. Navigate to the file URL using `browser_navigate`. Then call `browser_snapshot` on each page reachable via the hamburger menu: SEARCH, MY PARTY, GYMS & ELITE FOUR, WHERE AM I, TMs & HMs. The snapshot returns the real accessibility tree — use the actual ARIA roles and labels you see there when writing plans. Call `browser_console_messages` after each navigation to catch any JS errors.
2. Identify user journeys worth testing — focus on critical paths, not edge cases
3. Write a markdown test plan to `e2e/specs/<feature-name>.md` using this format:

```markdown
# <Feature Name>

## <Journey name>

1. Step description (describe what the user does, using visible labels and button names)
2. Step description
3. Expect: what the user should see (use visible text, not CSS classes)
```

## Constraints

- Plans must be concrete enough that a test generator can produce code from them
- Describe interactions using **user-visible text and ARIA roles**, not CSS class names or DOM structure — e.g. "tap the button labelled 'Open menu'" not "click `.hamburger-btn`"
- Each plan file should cover one feature area (search, party, gyms, locations, tms)
- Keep plans short — one happy path per journey, no exhaustive edge cases
- The seed file is at `e2e/seed.spec.ts` — generator should use it as the base environment setup
