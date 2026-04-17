// spec: e2e/specs/desktop-layout.md
// Runs at desktop viewport (1280×800) — tests layout + navigation at large
// width. The React rewrite uses the same responsive top-nav at every size
// (no separate desktop sidebar, no hamburger drawer), so a handful of
// vanilla-specific layout expectations are parked as fixme.
import { expect, test } from "./fixtures";

test.use({ viewport: { width: 1280, height: 800 } });

test("nav is always visible without opening a drawer", async ({ page }) => {
  await expect(page.getByRole("link", { name: "SEARCH" })).toBeVisible();
  await expect(page.getByRole("link", { name: "PARTY" })).toBeVisible();
  await expect(page.getByRole("link", { name: "GYMS" })).toBeVisible();
  await expect(page.getByRole("link", { name: "WHERE" })).toBeVisible();
  await expect(page.getByRole("link", { name: "TMS" })).toBeVisible();
  await expect(page.getByRole("link", { name: "SETTINGS" })).toBeVisible();
});

test("game title and run switcher appear in the masthead", async ({ page }) => {
  await expect(page.getByLabel("Current game")).toBeVisible();
  await expect(page.getByRole("button", { name: "Switch playthrough" })).toBeVisible();
});

test("nav navigates without modal backdrop", async ({ page }) => {
  await page.getByRole("link", { name: "GYMS" }).click();
  await expect(page.getByRole("region", { name: "Gyms page" })).toBeVisible();
  // Nav is always present — no drawer state to manage.
  await expect(page.getByRole("navigation")).toBeVisible();
});

test("type filter pills are all reachable at desktop width", async ({ page }) => {
  // The vanilla app wrapped pills to multiple lines on desktop. React keeps
  // them in a single horizontal scroll row. Assert that every type pill is
  // rendered so nothing is cut off by the container width.
  for (const t of ["Normal", "Fire", "Water", "Electric", "Psychic", "Dragon", "Dark", "Fairy"]) {
    await expect(page.getByRole("button", { name: t })).toBeVisible();
  }
});

test.fixme(
  "party grid shows 3 columns at desktop width (React uses fixed 2-col grid)",
  async () => {},
);

test("edit modal renders as a centered dialog", async ({ page }) => {
  await page.getByRole("link", { name: "PARTY" }).click();
  await page.getByRole("button", { name: "Add Pokémon" }).first().click();
  const modal = page.getByRole("dialog", { name: /ADD POKÉMON|EDIT POKÉMON/ });
  await expect(modal).toBeVisible();
  const box = await modal.boundingBox();
  const vp = page.viewportSize();
  if (!box || !vp) throw new Error("modal bounding box or viewport missing");
  // Modal should be roughly vertically centered (within 200px of center)
  const modalCenterY = box.y + box.height / 2;
  expect(Math.abs(modalCenterY - vp.height / 2)).toBeLessThan(200);
});

test("run switcher opens the playthrough menu dialog", async ({ page }) => {
  await page.getByRole("button", { name: "Switch playthrough" }).click();
  await expect(page.getByRole("dialog", { name: "Playthrough menu" })).toBeVisible();
  await page.getByLabel("Close playthrough menu").click();
  await expect(page.getByRole("dialog", { name: "Playthrough menu" })).not.toBeVisible();
});
