---
name: update-readme
description: Use when updating README.md to showcase the app with screenshots and a compelling feature overview. Triggers when the user asks to "update the README", "add screenshots to the README", "make the README look better", "show off the app in README", or wants the README to be more of a product pitch or feature showcase. Takes live screenshots using the Playwright MCP, proposes a structure for approval, then rewrites README.md as a short, polished sales pitch with embedded images.
---

## What this skill does

Rewrites README.md as a compelling product showcase — "what can this app do?" — not an implementation reference. Uses the Playwright MCP to take live screenshots of the running app and embeds them. Keeps the README short and scannable.

---

## Step 1 — Read and understand the current state

1. Read the current `README.md`
2. Read `AGENTS.md` for project charter and feature list
3. Scan `WORKLOG.md` for recently shipped features worth highlighting

---

## Step 2 — Explore the app

Navigate the live app with the Playwright MCP to get a feel for every screen before proposing screenshots.

**Local server URL:** `http://localhost:3000` (never use `file://` paths — the Playwright MCP blocks them)

> If the server isn't running, tell the user: "Please start a local server first — e.g. `python3 -m http.server 3000` from the repo root."

Visit every page reachable from the hamburger menu: Search, My Party, Gyms & Elite Four, Where Am I, TMs & HMs. Also exercise key interactions: search for a Pokémon, open the type breakdown overlay, browse the party page. Take a `browser_snapshot` on each to understand what's there.

---

## Step 3 — Propose an outline (wait for approval before continuing)

Draft a README outline and present it to the user. The README should read like a short product pitch, not a technical doc. Keep it brief — a few sentences, 3–4 screenshots, and a tight feature list. Nothing more.

### Outline template to adapt:

```
# [App name + punchy one-liner tagline]

[2-3 sentence pitch: who it's for, what problem it solves, why it's great]

## Screenshots
  - [Feature 1] — what the screenshot shows
  - [Feature 2] — what the screenshot shows
  - [Feature 3] — what the screenshot shows

## Features (short bullet list)

## Try it (one line — live link)
```

**Ask the user:** "Here's the outline I'm planning — does this look right? Any sections to add, remove, or reorder before I take screenshots?"

Do not proceed to Step 4 until the user approves (or adjusts) the outline.

---

## Step 4 — Take screenshots

Screenshots are committed to `screenshots/` in the repo root. The folder is already tracked (not git-ignored). Any ad-hoc dev shots should be in `notes/` (which is git-ignored) — do not save to `notes/` here.

For each planned screenshot:
1. Set a mobile viewport: `browser_resize width=390 height=844`
2. Navigate to the right page and set up the state (search for a Pokémon, open an overlay, etc.)
3. Capture a focused crop of the relevant UI region — not a full-page browser dump. Use `browser_take_screenshot` with a `clip` option if available, otherwise crop to just the app chrome at mobile width.
4. Save to `screenshots/<descriptive-kebab-name>.png`

**Good screenshot subjects** (adapt based on what the app actually looks like):
- Search results with type matchup bars for a Pokémon
- Type breakdown overlay open
- Party page with coverage bar
- Gyms page showing a gym leader's team
- Where Am I encounter list for a location

Aim for 3–4 screenshots total. Prefer action shots (something filled in, overlays open) over empty/default states.

---

## Step 5 — Write the new README

Write `README.md` using the approved outline. Rules:
- **Short** — aim for under 60 lines total. This is a pitch, not a wiki.
- **Lead with value, not internals.** No file maps, no architecture notes.
- **Embed screenshots** as relative markdown images: `![Alt text](screenshots/filename.png)`
- **Keep it scannable** — short paragraphs, bold key terms, bullet lists for features.
- **One live link** to the GitHub Pages deploy near the top (use existing URL if present in current README, else leave `[DEPLOY_URL]` placeholder).
- **Minimal how-to-run** at the very bottom — one or two lines only.
- Do not include implementation details, file structure tables, or JS architecture notes — those belong in AGENTS.md.

---

## Step 6 — Confirm before committing

Show the user the new README content and ask: "Happy with this? I'll commit `README.md` and the new `screenshots/` together."

Only commit after explicit approval. Use:
```
docs: update README with screenshots and feature showcase
```
