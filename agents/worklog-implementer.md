# Agent Prompt: WORKLOG Implementer

Use this prompt when executing a task from WORKLOG.md, managing the backlog, or maintaining WORKLOG structure.

---

## Mode A — Picking what to work on next

When no specific task is given, select the next task using this priority order:

1. **Backlog › High Priority** — top item first
2. **Backlog › Medium Priority** — only after High Priority is clear
3. **Backlog › Architecture / Future Games** — only when explicitly asked

Before picking, check:
- Does the task have a numbered dependency (e.g. "requires [2]")? If so, confirm the dependency is `[x]` first.
- Is the task clearly defined? If not, ask one clarifying question before doing anything.
- Does the task touch data marked **Do Not Change** in AGENTS.md? If so, stop and ask before proceeding.

---

## Mode B — Implementing a task

**Input:** the exact todo text to implement, or "next" to auto-select per Mode A.

**Steps — follow in order, do not skip:**

1. Read WORKLOG.md — confirm the task is unchecked in the Backlog and its dependencies are met
2. Read every file relevant to the feature area before writing any code
3. If anything is ambiguous, ask one question — do not guess and proceed
4. Implement the feature across the minimum necessary files
5. Add or update a spec plan in `e2e/specs/` describing the new behaviour in plain English
6. Generate or update the corresponding `e2e/*.spec.ts` file (use `agents/playwright-generator.md`)
7. Run `npm test` — fix any failures before proceeding; do not commit with broken tests
8. Present a summary of changes to the user and **ask for confirmation** that the task is complete before proceeding
9. After user confirms: move the task from the Backlog into the current session heading under **Progress** (mark it `[x]`); if no session heading exists for this session, create one: `### Session N — <title>`
10. Commit all changed files in one commit: `feat: <description>` (single line, no body)
11. Push to the remote branch

**Exit criteria:**
- `npm test` passes, no skipped tests
- User has confirmed the task is complete
- Task is `[x]` under a session heading in **Progress**; removed from Backlog
- One commit, conventional message, single line
- Changes pushed to remote

---

## Mode C — Managing tasks (add / remove / update)

When asked to add, remove, or change tasks, follow these rules exactly.

### Adding a task

1. Decide the correct section:
   - Important but not immediate → **Backlog › High Priority**
   - Nice to have → **Backlog › Medium Priority**
   - Big architectural or multi-session decision → **Backlog › Architecture**
   - A future game port → **Backlog › Future Games**
2. If the task depends on another task, note it inline: `— requires [N]`
3. If the task is part of a sequence, assign a sequence number `[N]` consistent with existing numbered tasks
4. Write the entry as a single line: `- [ ] <description> — <one-line rationale if non-obvious>`
5. Place it at the top of its section unless ordering within the section matters, in which case insert it where the sequence dictates

### Removing a task

- If the task was never started: delete the line entirely
- If the task was completed: remove from Backlog and add `[x]` under the current session heading in Progress — completed work is a record, not clutter
- If the task is being replaced by a better-scoped task: delete the old line and add the new one; add a note in **Ideas / Notes** if the context is worth preserving

### Updating a task

- Change the description in place — do not duplicate the line
- If the scope changed significantly, note the old intent briefly in **Ideas / Notes**
- Never change a `[x]` completed task — add a new follow-up task instead

### Proposing an order

When asked to sequence tasks, explain the rationale briefly (dependencies, risk, value), then insert them into the Backlog in that order with `[N]` labels. Do not just list them — place them.

---

## WORKLOG structure rules

Always maintain this exact section order. Never add new top-level sections without being asked.

```
## Progress
  ### Session N — <title>
    **Completed**
    - [x] ...

## Next Session — Pick Up Here   ← brief orientation note; update each session

## Backlog
  ### Testing
  ### High Priority
  ### Medium Priority
  ### Future Games
  ### Architecture

## Ideas / Notes
```

**Formatting rules:**
- Every entry is a single line: `- [ ]` or `- [x]`
- Rationale goes inline after an em dash: `— reason`
- Do not nest bullets under todo items — if a task needs sub-steps, write a spec or a separate agent prompt instead
- When a task is completed, remove it from the Backlog and add it `[x]` under the session heading in Progress — never leave completed work in the Backlog
- Keep **Ideas / Notes** as a freeform scratchpad; anything that doesn't fit elsewhere goes there

---

## What NOT to do

- Do not start implementing before reading the relevant source files
- Do not commit without running `npm test`
- Do not modify `HOW`, `CHART`, `BOSSES`, or `LOCATIONS` in `js/data.js` without explicit instruction
- Do not create new top-level WORKLOG sections
- Do not rewrite or reformat tasks that were not part of the current request
- Do not add a Co-Authored-By trailer or multi-line commit body
