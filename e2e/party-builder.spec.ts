// spec: e2e/specs/party-builder.md
import { expect, seedPlaythrough, test } from "./fixtures";

async function seedPC(page: import("@playwright/test").Page, dexNums: number[]) {
  await seedPlaythrough(page, { pc: dexNums.map((n) => ({ n })) });
}

// The React rewrite does not expose a "Send to PC" button from the search
// detail card — the only way to add a Pokémon to the PC Box is via the Party
// route's PC Box "ADD NEW" tile. The three tests below are parked as fixme
// pending a decision on whether to re-introduce the shortcut.
test.fixme("send Pokémon to PC from search (feature absent in React rewrite)", async () => {});
test.fixme(
  "PC Box shows caught count after adding from search (feature absent in React rewrite)",
  async () => {},
);
test.fixme(
  "IN PC BOX button is inactive when Pokémon already in PC (feature absent in React rewrite)",
  async () => {},
);

test("add new Pokémon to PC via PC Box ADD NEW tile", async ({ page }) => {
  await page.getByRole("link", { name: "PARTY" }).click();
  await page.getByRole("button", { name: "Add new Pokémon to PC" }).click();
  const addModal = page.getByRole("dialog", { name: "ADD TO PC" });
  await addModal.getByLabel("Search Pokémon").fill("Pikachu");
  await page.getByRole("option", { name: "Pikachu" }).click();
  await page.getByRole("button", { name: /ADD TO PC/ }).click();
  await expect(page.getByText("(1 CAUGHT)")).toBeVisible();
  await expect(page.getByRole("region", { name: "PC Box" }).getByText("Pikachu")).toBeVisible();
});

test("move Pokémon from PC to party (party not full)", async ({ page }) => {
  await seedPC(page, [25]); // Pikachu
  await page.getByRole("link", { name: "PARTY" }).click();
  await page.getByRole("button", { name: "Move Pikachu to party" }).click();
  // Pikachu now appears in party
  await expect(page.getByRole("button", { name: "Edit Pikachu" })).toBeVisible();
  // PC is empty
  await expect(page.getByText("(0 CAUGHT)")).toBeVisible();
});

test("remove Pokémon from PC — cancel then confirm", async ({ page }) => {
  await seedPC(page, [25]); // Pikachu
  await page.getByRole("link", { name: "PARTY" }).click();
  // Tap ✕ to enter confirm state
  await page.getByRole("button", { name: "Remove Pikachu from PC" }).click();
  const confirm = page.getByRole("group", { name: "Confirm remove Pikachu" });
  await expect(confirm).toBeVisible();
  // Cancel
  await page.getByRole("button", { name: "Cancel remove" }).click();
  await expect(page.getByRole("region", { name: "PC Box" }).getByText("Pikachu")).toBeVisible();
  // Confirm removal
  await page.getByRole("button", { name: "Remove Pikachu from PC" }).click();
  await page.getByRole("button", { name: "Confirm remove Pikachu" }).click();
  await expect(page.getByText("(0 CAUGHT)")).toBeVisible();
});

test("PC Box collapses and expands", async ({ page }) => {
  await seedPC(page, [25]);
  await page.getByRole("link", { name: "PARTY" }).click();
  await expect(page.getByRole("region", { name: "PC Box" }).getByText("Pikachu")).toBeVisible();
  // Collapse
  await page.getByRole("button", { name: "Toggle PC Box" }).click();
  await expect(page.getByRole("region", { name: "PC Box" }).getByText("Pikachu")).not.toBeVisible();
  // Expand
  await page.getByRole("button", { name: "Toggle PC Box" }).click();
  await expect(page.getByRole("region", { name: "PC Box" }).getByText("Pikachu")).toBeVisible();
});

test("no suggestions shown when no Pokémon available", async ({ page }) => {
  await page.getByRole("link", { name: "PARTY" }).click();
  await expect(page.getByText(/SUGGESTED PARTIES/)).not.toBeVisible();
});

test("suggestion strip cards appear with Pokémon in PC", async ({ page }) => {
  await seedPC(page, [6, 9, 3, 94, 65, 131]);
  await page.getByRole("link", { name: "PARTY" }).click();
  await expect(page.getByRole("button", { name: /Suggestion 1/ })).toBeVisible();
});

test("suggestion uses party + PC as combined pool", async ({ page }) => {
  // 3 in party, 3 in PC — should still produce a valid suggestion
  await seedPlaythrough(page, {
    party: [{ n: 6 }, { n: 9 }, { n: 3 }],
    pc: [{ n: 94 }, { n: 65 }, { n: 131 }],
  });
  await page.getByRole("link", { name: "PARTY" }).click();
  await expect(page.getByRole("button", { name: /Suggestion 1/ })).toBeVisible();
  await page.getByRole("button", { name: /Suggestion 1/ }).click();
  await expect(page.getByText(/\d+\/18 COVERED/)).toBeVisible();
  await expect(page.getByRole("button", { name: "USE THIS PARTY" })).toBeVisible();
});

test("suggestion modal shows coverage score and sprites", async ({ page }) => {
  await seedPC(page, [6, 9, 3, 94, 65, 131]);
  await page.getByRole("link", { name: "PARTY" }).click();
  await page.getByRole("button", { name: /Suggestion 1/ }).click();
  // Modal title shows coverage score
  await expect(page.getByText(/OPTION 1 · \d+\/18 COVERED/)).toBeVisible();
  await expect(page.getByRole("button", { name: "USE THIS PARTY" })).toBeVisible();
});

test("applying a suggestion fills the party and empties the PC", async ({ page }) => {
  await seedPC(page, [6, 9, 3, 94, 65, 131]);
  await page.getByRole("link", { name: "PARTY" }).click();
  await page.getByRole("button", { name: /Suggestion 1/ }).click();
  await page.getByRole("button", { name: "USE THIS PARTY" }).click();
  // Modal closed, party has 6 filled slots
  await expect(page.getByText("6 / 6 IN PARTY")).toBeVisible();
  // PC is now empty (suggested Pokémon moved to party)
  await expect(page.getByText("(0 CAUGHT)")).toBeVisible();
});
