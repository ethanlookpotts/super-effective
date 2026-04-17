import { expect, test } from "./fixtures";

test.describe("Test group", () => {
  test("seed", async ({ page }) => {
    await expect(page.getByLabel("Search Pokémon")).toBeVisible();
  });
});
