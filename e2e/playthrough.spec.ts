// spec: e2e/specs/playthrough.md
// seed: e2e/seed.spec.ts
import { expect, test } from "./fixtures";

test("rename a playthrough updates the masthead", async ({ page }) => {
  await page.getByRole("button", { name: "Switch playthrough" }).click();
  const menu = page.getByRole("dialog", { name: "Playthrough menu" });
  await menu.getByRole("button", { name: /Rename/ }).click();
  await menu.getByLabel("Rename playthrough").fill("NUZLOCKE");
  await menu.getByLabel("Rename playthrough").press("Enter");
  await page.getByLabel("Close playthrough menu").click();
  await expect(page.getByRole("button", { name: "Switch playthrough" })).toContainText("NUZLOCKE");
});

test("empty localStorage shows no-playthrough state", async ({ page }) => {
  // The React rewrite does not render a first-run game gate — the party/search
  // views simply show empty state and the user creates a run via ＋ NEW.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByLabel("Current game")).toContainText("NO PLAYTHROUGH");
  await expect(page.getByRole("button", { name: "Switch playthrough" })).toContainText("＋ NEW");
});

test("creating a new FireRed run from empty state updates the masthead", async ({ page }) => {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Switch playthrough" }).click();
  await page.getByRole("button", { name: "＋ NEW RUN" }).click();
  await page.getByRole("button", { name: /FIRERED/ }).click();
  await expect(page.getByLabel("Search Pokémon")).toBeVisible();
  await expect(page.getByLabel("Current game")).toContainText("FIRERED");
});

test("new run game picker shows game options", async ({ page }) => {
  await page.getByRole("button", { name: "Switch playthrough" }).click();
  await page.getByRole("button", { name: "＋ NEW RUN" }).click();
  await expect(page.getByRole("button", { name: /FIRERED/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /LEAFGREEN/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /BACK/ })).toBeVisible();
});

test("new run with LeafGreen updates masthead to LeafGreen", async ({ page }) => {
  await page.getByRole("button", { name: "Switch playthrough" }).click();
  await page.getByRole("button", { name: "＋ NEW RUN" }).click();
  await page.getByRole("button", { name: /LEAFGREEN/ }).click();
  await expect(page.getByLabel("Current game")).toContainText("LEAFGREEN");
});

test("FR-exclusive Pokémon shows not obtainable on LeafGreen run", async ({ page }) => {
  await page.getByRole("button", { name: "Switch playthrough" }).click();
  await page.getByRole("button", { name: "＋ NEW RUN" }).click();
  await page.getByRole("button", { name: /LEAFGREEN/ }).click();
  await page.getByLabel("Search Pokémon").fill("Ekans");
  await page.getByRole("option", { name: "Ekans" }).click();
  await expect(page.getByText("Not obtainable in this version")).toBeVisible();
});
