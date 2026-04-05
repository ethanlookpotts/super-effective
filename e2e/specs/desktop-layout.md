# Spec: Desktop Responsive Layout

Viewport breakpoints: mobile (<720px), desktop (≥720px), wide (≥900px).

## Desktop sidebar (≥720px)

- The drawer nav is **permanently visible** as a left sidebar (220px wide).
- The hamburger "Open menu" button is **hidden** — no longer needed.
- Clicking any sidebar nav item (`SEARCH`, `MY PARTY`, `GYMS & ELITE FOUR`, `WHERE AM I`, `TMs & HMs`) navigates to that page without opening an overlay.
- The masthead (game title + playthrough switcher) appears above the active page in the right column.

## Modal dialogs (≥720px)

- Modals (party edit, PC swap, playthrough menu, breakdown sheet) appear as **centered dialogs** rather than bottom sheets.
- The dialog is vertically centered in the viewport with rounded corners on all sides.

## Wide layout (≥900px)

- The party grid switches from **2 columns** (mobile) to **3 columns**, allowing all 6 party slots to be visible in two rows.

## Mobile unchanged (<720px)

- Hamburger button is visible and opens the slide-in drawer overlay.
- All pages, modals, and party grid behave exactly as before.

## Test notes

- Mobile E2E tests run at 390×844 — test hamburger drawer flow (`e2e/*.spec.ts`).
- Desktop E2E tests run at 1280×800 — test sidebar layout (`e2e/desktop.spec.ts`):
  1. Hamburger button is hidden
  2. Sidebar nav is always visible without opening a drawer
  3. Game title and run switcher appear in the sidebar
  4. Sidebar nav navigates without opening drawer overlay
  5. Type filter pills wrap to multiple lines (all 18 types visible)
  6. Party grid shows 3 columns
  7. Edit modal is centered, not a bottom sheet
  8. Run switcher in sidebar opens playthrough menu
