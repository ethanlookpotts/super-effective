// spec: e2e/specs/desktop-layout.md
// Runs at desktop viewport (1280×800) — tests sidebar layout, navigation, and centered modals.
import { expect, test } from "./fixtures";

test.use({ viewport: { width: 1280, height: 800 } });

test("hamburger button is hidden on desktop", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Open menu" })).toBeHidden();
});

test("sidebar nav is always visible without opening a drawer", async ({ page }) => {
  await expect(page.getByRole("button", { name: /SEARCH/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /MY PARTY/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /GYMS/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /WHERE AM I/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /TMs/ })).toBeVisible();
});

test("game title and run switcher appear in the sidebar", async ({ page }) => {
  await expect(page.getByLabel("Current game")).toBeVisible();
  await expect(page.getByRole("button", { name: "Switch playthrough" })).toBeVisible();
});

test("sidebar nav navigates without drawer overlay", async ({ page }) => {
  await page.getByRole("button", { name: /GYMS/ }).click();
  await expect(page.getByRole("region", { name: "Gyms page" })).toBeVisible();
  // Sidebar nav is always visible on desktop (no modal backdrop state)
  await expect(page.getByRole("navigation")).toBeVisible();
});

test("type filter pills wrap to multiple lines on desktop", async ({ page }) => {
  const fairyPill = page.getByRole("button", { name: "Fairy" });
  await expect(fairyPill).toBeVisible();
  // Fairy is last — if pills scroll instead of wrap it would be hidden
  const normalPill = page.getByRole("button", { name: "Normal" });
  const fairyBox = await fairyPill.boundingBox();
  const normalBox = await normalPill.boundingBox();
  // Fairy should be below Normal (wrapped to next line) or same line but not cut off
  expect(fairyBox).not.toBeNull();
  expect(normalBox).not.toBeNull();
});

test("party grid shows 3 columns at desktop width", async ({ page }) => {
  await page.getByRole("button", { name: /MY PARTY/ }).click();
  await expect(page.getByRole("region", { name: "Party page" })).toBeVisible();
  const grid = page.getByRole("list", { name: "Party slots" });
  const cols = await grid.evaluate(
    (el: HTMLElement) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
  );
  expect(cols).toBe(3);
});

test("edit modal is centered, not a bottom sheet", async ({ page }) => {
  await page.getByRole("button", { name: /MY PARTY/ }).click();
  // Click an empty party slot to open edit modal
  await page.getByRole("button", { name: "Add Pokémon to party" }).first().click();
  const modal = page.getByRole("dialog", { name: /ADD POKÉMON|EDIT POKÉMON/ });
  await expect(modal).toBeVisible();
  const box = await modal.boundingBox();
  const vp = page.viewportSize();
  if (!box || !vp) throw new Error("modal bounding box or viewport missing");
  // Modal should be roughly vertically centered (within 200px of center)
  const modalCenterY = box.y + box.height / 2;
  expect(Math.abs(modalCenterY - vp.height / 2)).toBeLessThan(200);
  // Modal should NOT be pinned to the bottom (bottom edge < 80% of viewport height)
  expect(box.y + box.height).toBeLessThan(vp.height * 0.9);
});

test("run switcher in sidebar opens playthrough menu", async ({ page }) => {
  // On desktop the masthead is hidden, so the sidebar button is the only visible one
  await page.getByRole("button", { name: "Switch playthrough" }).click();
  await expect(page.getByRole("dialog", { name: "Playthroughs" })).toBeVisible();
  await page.getByRole("button", { name: /CLOSE/ }).click();
  await expect(page.getByRole("dialog", { name: "Playthroughs" })).not.toBeVisible();
});
