// spec: e2e/specs/gyms.md
// seed: e2e/seed.spec.ts
import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.getByRole("link", { name: "GYMS" }).click();
});

function starterRegion(page: import("@playwright/test").Page) {
  return page.getByRole("region", { name: "Rival starter" });
}

test("gyms tab renders all gym leaders", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Expand Brock" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Expand Misty" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Expand Giovanni" })).toBeVisible();
});

test("rival section renders with starter selector", async ({ page }) => {
  await expect(page.getByText(/GARY/)).toBeVisible();
  const starter = starterRegion(page);
  await expect(starter.getByRole("button", { name: /Bulbasaur/ })).toBeVisible();
  await expect(starter.getByRole("button", { name: /Charmander/ })).toBeVisible();
  await expect(starter.getByRole("button", { name: /Squirtle/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Expand Route 22" }).first()).toBeVisible();
});

test("rival starter selector swaps Gary team", async ({ page }) => {
  // Default starter = Bulbasaur → Gary has Charmander on Route 22
  await page.getByRole("button", { name: "Expand Route 22" }).first().click();
  await expect(page.getByRole("button", { name: "Charmander Lv.9" })).toBeVisible();

  // Switch to Charmander starter → Gary has Squirtle. The open card re-renders with the new team.
  await starterRegion(page)
    .getByRole("button", { name: /Charmander/ })
    .click();
  await expect(page.getByRole("button", { name: "Squirtle Lv.9" })).toBeVisible();
});

test("rival starter persists across reload", async ({ page }) => {
  const starter = starterRegion(page);
  await starter.getByRole("button", { name: /Squirtle/ }).click();
  await expect(starter.getByRole("button", { name: /Squirtle/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.reload();
  await page.getByRole("link", { name: "GYMS" }).click();
  await expect(starterRegion(page).getByRole("button", { name: /Squirtle/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
