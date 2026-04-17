// spec: e2e/specs/party.md
// seed: e2e/seed.spec.ts
import { expect, test } from "./fixtures";

test("add to party fills a party slot", async ({ page }) => {
  await page.getByLabel("Search Pokémon").fill("Pikachu");
  await page.getByRole("option", { name: "Pikachu" }).click();
  await page.getByRole("button", { name: /ADD TO PARTY/ }).click();
  await page.getByRole("link", { name: "PARTY" }).click();
  await expect(page.getByRole("button", { name: "Edit Pikachu" })).toBeVisible();
});

test("IN PARTY button navigates to Party tab", async ({ page }) => {
  await page.getByLabel("Search Pokémon").fill("Pikachu");
  await page.getByRole("option", { name: "Pikachu" }).click();
  await page.getByRole("button", { name: /ADD TO PARTY/ }).click();
  // Re-select Pikachu — button should now say IN PARTY
  await page.getByLabel("Search Pokémon").fill("Pikachu");
  await page.getByRole("option", { name: "Pikachu" }).click();
  await expect(page.getByRole("button", { name: /IN PARTY/ })).toHaveText(
    "✓ IN PARTY — VIEW PARTY ›",
  );
  await page.getByRole("button", { name: /IN PARTY/ }).click();
  await expect(page.getByRole("button", { name: "Edit Pikachu" })).toBeVisible();
});

test("move picker shows learnset instantly with no loading state", async ({ page }) => {
  await page.getByRole("link", { name: "PARTY" }).click();
  await page.getByRole("button", { name: "Add Pokémon" }).first().click();
  await page.getByRole("textbox", { name: "Search Pokémon..." }).fill("Growlithe");
  await page.getByRole("option", { name: "Growlithe" }).click();
  await page.getByRole("button", { name: "Moves section" }).click();
  const moveSection = page.getByRole("region", { name: "Move picker" });
  await expect(moveSection.getByText("LOADING MOVES")).not.toBeVisible();
  await expect(moveSection.getByText("Roar")).toBeVisible();
  await expect(moveSection.getByText("Take Down")).toBeVisible();
});

test("edit modal sections are collapsed and disabled until Pokémon selected", async ({ page }) => {
  await page.getByRole("link", { name: "PARTY" }).click();
  await page.getByRole("button", { name: "Add Pokémon" }).first().click();

  // Moves section header visible but not interactive before Pokémon picked
  await expect(page.getByRole("button", { name: "Moves section" })).not.toBeVisible();
  await expect(page.getByLabel("Moves section")).toBeVisible();

  // Level / Nature not rendered before Pokémon picked
  await expect(page.getByLabel("Level")).not.toBeVisible();

  // Select a Pokémon — moves section becomes interactive, level/nature appear
  await page.getByRole("textbox", { name: "Search Pokémon..." }).fill("Pikachu");
  await page.getByRole("option", { name: "Pikachu" }).click();
  await expect(page.getByRole("button", { name: "Moves section" })).toBeVisible();
  await expect(page.getByLabel("Level")).toBeVisible();
  await expect(page.getByLabel("Nature")).toBeVisible();

  // Expand Moves — move search input appears
  await page.getByRole("button", { name: "Moves section" }).click();
  await expect(page.getByRole("textbox", { name: "Search moves..." })).toBeVisible();
});

test("level and nature entry computes and saves", async ({ page }) => {
  await page.getByRole("link", { name: "PARTY" }).click();
  await page.getByRole("button", { name: "Add Pokémon" }).first().click();
  await page.getByRole("textbox", { name: "Search Pokémon..." }).fill("Pikachu");
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

test("Hidden Power type selection", async ({ page }) => {
  await page.getByRole("link", { name: "PARTY" }).click();
  await page.getByRole("button", { name: "Add Pokémon" }).first().click();
  await page.getByRole("textbox", { name: "Search Pokémon..." }).fill("Pikachu");
  await page.getByRole("option", { name: "Pikachu" }).click();
  await page.getByRole("button", { name: "Moves section" }).click();
  // HP badge visible before type is chosen
  await expect(page.getByLabel("Hidden Power — select type")).toBeVisible();
  // Click Hidden Power to open type picker
  await page.getByLabel("Hidden Power — select type").click();
  await expect(page.getByLabel("Select Hidden Power type")).toBeVisible();
  // Choose Electric
  await page.getByLabel("Select Hidden Power type").getByText("Electric").click();
  // Type picker gone, move added as picked with Electric type
  await expect(page.getByLabel("Select Hidden Power type")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Remove Hidden Power" })).toBeVisible();
});
