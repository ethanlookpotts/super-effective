// spec: e2e/specs/routing.md
// seed: e2e/seed.spec.ts
import { expect, test } from "./fixtures";

test("drawer navigation updates URL hash per page", async ({ page }) => {
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "MY PARTY" }).click();
  await expect(page).toHaveURL(/#\/party$/);

  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "GYMS & ELITE FOUR" }).click();
  await expect(page).toHaveURL(/#\/gyms$/);

  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "WHERE AM I" }).click();
  await expect(page).toHaveURL(/#\/location$/);

  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "TMs & HMs" }).click();
  await expect(page).toHaveURL(/#\/tms$/);

  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "SETTINGS" }).click();
  await expect(page).toHaveURL(/#\/settings$/);
});

test("selecting a Pokémon writes dex number to URL", async ({ page }) => {
  await page.getByLabel("Search Pokémon").fill("Pikachu");
  await page.getByRole("option", { name: "Pikachu" }).click();
  await expect(page).toHaveURL(/#\/search\?n=25$/);
});

test("type filter pill writes type to URL and clears on toggle off", async ({ page }) => {
  await page.getByRole("button", { name: "Electric" }).click();
  await expect(page).toHaveURL(/#\/search\?type=Electric$/);
  await page.getByRole("button", { name: "Electric" }).click();
  await expect(page).toHaveURL(/#\/search$/);
});

test("reload preserves the current page", async ({ page }) => {
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "MY PARTY" }).click();
  await expect(page).toHaveURL(/#\/party$/);
  await page.reload();
  await expect(page.getByText("🎒 MY PARTY")).toBeVisible();
});

test("reload preserves the selected Pokémon", async ({ page }) => {
  await page.getByLabel("Search Pokémon").fill("Charizard");
  await page.getByRole("option", { name: "Charizard" }).click();
  await expect(page.getByRole("heading", { name: "Charizard" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Charizard" })).toBeVisible();
});

test("reload preserves the type filter", async ({ page }) => {
  await page.getByRole("button", { name: "Fire" }).click();
  await expect(
    page.getByRole("region", { name: "Search page" }).getByText("Charmander", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("region", { name: "Search page" }).getByText("Charmander", { exact: true }),
  ).toBeVisible();
});

test("direct deep link opens a Pokémon detail card", async ({ page }) => {
  await page.goto("/#/search?n=150");
  await expect(page.getByRole("heading", { name: "Mewtwo" })).toBeVisible();
});

test("direct deep link opens a non-search page", async ({ page }) => {
  await page.goto("/#/gyms");
  await expect(page.getByText("🏆 GYMS, RIVAL & ELITE FOUR")).toBeVisible();
});

test("browser back restores prior view", async ({ page }) => {
  await page.getByLabel("Search Pokémon").fill("Pikachu");
  await page.getByRole("option", { name: "Pikachu" }).click();
  await expect(page.getByRole("heading", { name: "Pikachu" })).toBeVisible();
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("navigation").getByRole("button", { name: "MY PARTY" }).click();
  await expect(page).toHaveURL(/#\/party$/);
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Pikachu" })).toBeVisible();
});

test("switching playthrough resets the URL to default search", async ({ page }) => {
  await page.getByLabel("Search Pokémon").fill("Pikachu");
  await page.getByRole("option", { name: "Pikachu" }).click();
  await expect(page).toHaveURL(/#\/search\?n=25$/);
  await page.getByRole("button", { name: "Switch playthrough" }).click();
  await page.getByRole("button", { name: "＋ NEW RUN" }).click();
  await page.getByRole("button", { name: /FIRERED/ }).click();
  await expect(page).toHaveURL(/#\/search$/);
});
