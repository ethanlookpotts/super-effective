// spec: e2e/specs/party.md
// seed: e2e/seed.spec.ts
import { expect, seedPlaythrough, test } from "./fixtures";

function modal(page: import("@playwright/test").Page) {
  return page.getByRole("dialog", { name: /ADD POKÉMON|EDIT POKÉMON/ });
}

test("add to party fills a party slot", async ({ page }) => {
  await page.getByLabel("Search Pokémon").fill("Pikachu");
  await page.getByRole("option", { name: "Pikachu" }).click();
  await page.getByRole("button", { name: /Add .+ to party/ }).click();
  await page.getByRole("link", { name: "PARTY" }).click();
  await expect(page.getByRole("button", { name: "Edit Pikachu" })).toBeVisible();
});

test("IN PARTY button navigates to Party tab", async ({ page }) => {
  await page.getByLabel("Search Pokémon").fill("Pikachu");
  await page.getByRole("option", { name: "Pikachu" }).click();
  await page.getByRole("button", { name: /Add .+ to party/ }).click();
  // Re-select Pikachu — button should now say IN PARTY
  await page.getByLabel("Search Pokémon").fill("Pikachu");
  await page.getByRole("option", { name: "Pikachu" }).click();
  await expect(page.getByRole("button", { name: /in party/i })).toBeVisible();
});

test("move picker shows learnset instantly with no loading state", async ({ page }) => {
  await page.getByRole("link", { name: "PARTY" }).click();
  await page.getByRole("button", { name: "Add Pokémon" }).first().click();
  await modal(page).getByLabel("Search Pokémon").fill("Growlithe");
  await page.getByRole("option", { name: "Growlithe" }).click();
  await page.getByRole("button", { name: /Expand MOVES|Collapse MOVES/ }).click();
  const moveList = page.getByRole("listbox", { name: "Move results" });
  await expect(moveList.getByText("LOADING MOVES")).not.toBeVisible();
  await expect(moveList.getByText("Roar")).toBeVisible();
  await expect(moveList.getByText("Take Down")).toBeVisible();
});

test("edit modal only renders MOVES / INFO sections once a Pokémon is picked", async ({ page }) => {
  // React differs from vanilla: instead of rendering disabled collapsed
  // sections, the modal omits the MOVES/INFO/LEVEL/NATURE blocks until a
  // Pokémon is selected.
  await page.getByRole("link", { name: "PARTY" }).click();
  await page.getByRole("button", { name: "Add Pokémon" }).first().click();

  await expect(page.getByRole("button", { name: /Expand MOVES|Collapse MOVES/ })).not.toBeVisible();
  await expect(page.getByLabel("Level")).not.toBeVisible();

  await modal(page).getByLabel("Search Pokémon").fill("Pikachu");
  await page.getByRole("option", { name: "Pikachu" }).click();
  await expect(page.getByRole("button", { name: /Expand MOVES|Collapse MOVES/ })).toBeVisible();
  await expect(page.getByLabel("Level")).toBeVisible();
  await expect(page.getByLabel("Nature")).toBeVisible();

  // Expand Moves — move search input appears
  await page.getByRole("button", { name: /Expand MOVES/ }).click();
  await expect(page.getByRole("textbox", { name: "Search moves" })).toBeVisible();
});

test("level and nature entry computes and saves", async ({ page }) => {
  await page.getByRole("link", { name: "PARTY" }).click();
  await page.getByRole("button", { name: "Add Pokémon" }).first().click();
  await modal(page).getByLabel("Search Pokémon").fill("Pikachu");
  await page.getByRole("option", { name: "Pikachu" }).click();

  // Fill level and nature
  await page.getByLabel("Level").fill("50");
  await page.getByLabel("Nature").selectOption("Timid");

  // Computed stats line appears with ~ prefix (always estimated)
  await expect(page.getByLabel("Computed stats")).toContainText("~ATK");

  // Save and reopen — values persist
  await page.getByRole("button", { name: /ADD TO PARTY/ }).click();
  await page.getByRole("button", { name: "Edit Pikachu" }).click();
  await expect(page.getByLabel("Level")).toHaveValue("50");
  await expect(page.getByLabel("Nature")).toHaveValue("Timid");
});

test("info button on party slot opens Pokémon detail page", async ({ page }) => {
  await seedPlaythrough(page, { party: [{ n: 25 }] }); // Pikachu
  await page.getByRole("link", { name: "PARTY" }).click();
  await page.getByRole("button", { name: "View Pikachu details" }).click();
  await expect(page).toHaveURL(/#\/search\?n=25/);
  await expect(
    page.getByRole("region", { name: "Search page" }).getByRole("heading", { name: "Pikachu" }),
  ).toBeVisible();
});

test("info button on PC slot opens Pokémon detail page", async ({ page }) => {
  await seedPlaythrough(page, { pc: [{ n: 94 }] }); // Gengar
  await page.getByRole("link", { name: "PARTY" }).click();
  await page.getByRole("button", { name: "View Gengar details" }).click();
  await expect(page).toHaveURL(/#\/search\?n=94/);
  await expect(
    page.getByRole("region", { name: "Search page" }).getByRole("heading", { name: "Gengar" }),
  ).toBeVisible();
});

test("Hidden Power type selection", async ({ page }) => {
  await page.getByRole("link", { name: "PARTY" }).click();
  await page.getByRole("button", { name: "Add Pokémon" }).first().click();
  await modal(page).getByLabel("Search Pokémon").fill("Pikachu");
  await page.getByRole("option", { name: "Pikachu" }).click();
  await page.getByRole("button", { name: /Expand MOVES/ }).click();
  // HP toggle visible before type is chosen
  await expect(page.getByRole("button", { name: "Add Hidden Power" })).toBeVisible();
  // Click Hidden Power toggle to open type picker
  await page.getByRole("button", { name: "Add Hidden Power" }).click();
  const hpPicker = page.getByRole("group", { name: "Pick Hidden Power type" });
  await expect(hpPicker).toBeVisible();
  // Choose Electric
  await hpPicker.getByRole("button", { name: "Hidden Power Electric" }).click();
  // Type picker gone, move added as picked with Electric type
  await expect(hpPicker).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Remove Hidden Power" }).first()).toBeVisible();
});
