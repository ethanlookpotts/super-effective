// spec: TMs & HMs page — inventory, filters, learners, HM Carrier, TM Suggestions
import { type SeedMember, expect, seedPlaythrough, test } from "./fixtures";

async function openTmsPage(page: import("@playwright/test").Page) {
  await page.getByRole("link", { name: "TMS" }).click();
}

async function seed(
  page: import("@playwright/test").Page,
  opts: { party?: SeedMember[]; pc?: SeedMember[]; tmInventory?: Record<string, number> },
) {
  await seedPlaythrough(page, opts);
}

test("TMs page renders filter bar with total counts", async ({ page }) => {
  await openTmsPage(page);
  const filters = page.getByRole("group", { name: "Filter by ownership" });
  await expect(filters.getByRole("button", { name: /ALL/ })).toBeVisible();
  await expect(filters.getByRole("button", { name: /OWNED/ })).toBeVisible();
  await expect(filters.getByRole("button", { name: /MISSING/ })).toBeVisible();
});

test("incrementing a TM inventory toggles owned state", async ({ page }) => {
  await openTmsPage(page);
  const incBtn = page.getByRole("button", { name: "Increase TM01" });
  await incBtn.click();
  // Filter to Owned and verify TM01 appears
  await page.getByRole("button", { name: /OWNED/ }).click();
  await expect(page.getByText("Focus Punch")).toBeVisible();
});

test("decrementing removes the TM from inventory (button disabled at 0)", async ({ page }) => {
  await openTmsPage(page);
  const dec = page.getByRole("button", { name: "Decrease TM01" });
  await expect(dec).toBeDisabled();
  await page.getByRole("button", { name: "Increase TM01" }).click();
  await page.getByRole("button", { name: "Increase TM01" }).click();
  await expect(dec).toBeEnabled();
  await dec.click();
  await dec.click();
  await expect(dec).toBeDisabled();
});

test("HM toggle button switches between NEED and HAVE states", async ({ page }) => {
  await openTmsPage(page);
  const toggle = page.getByRole("button", { name: "Need HM01" });
  await toggle.click();
  await expect(page.getByRole("button", { name: "Have HM01" })).toBeVisible();
});

test("WHO CAN LEARN expansion shows party + PC members who learn the move", async ({ page }) => {
  await seed(page, {
    party: [{ n: 6 }, { n: 9 }],
    pc: [{ n: 25 }], // Pikachu
  });
  await openTmsPage(page);
  // TM24 Thunderbolt — Pikachu + many party mons can learn
  const thunderboltCard = page.getByRole("listitem", { name: /Thunderbolt/ });
  await thunderboltCard.getByText(/WHO CAN LEARN/).click();
  const learnersBlock = page.getByRole("region", { name: "Learners for Thunderbolt" });
  await expect(learnersBlock).toBeVisible();
  await expect(learnersBlock.getByText("IN PC")).toBeVisible();
});

test("HM Carrier card appears when ≥2 HMs owned with party+PC members", async ({ page }) => {
  await seed(page, {
    party: [{ n: 54, level: 25 }], // Psyduck
    tmInventory: { HM01: 1, HM03: 1, HM04: 1 }, // Cut + Surf + Strength
  });
  await openTmsPage(page);
  await expect(page.getByText(/HM CARRIER/)).toBeVisible();
  await expect(page.getByText(/CARRIES \d\/\d HMs/).first()).toBeVisible();
});

test("HM Carrier card hidden when fewer than 2 HMs owned", async ({ page }) => {
  await seed(page, {
    party: [{ n: 54 }], // Psyduck
    tmInventory: { HM01: 1 },
  });
  await openTmsPage(page);
  await expect(page.getByLabel("Recommended HM Carrier")).toHaveCount(0);
});

test("Move Tutors section renders with Cape Brink starter entries", async ({ page }) => {
  await openTmsPage(page);
  await expect(page.getByText(/MOVE TUTORS/)).toBeVisible();
  await expect(page.getByText("Frenzy Plant")).toBeVisible();
  await expect(page.getByText("Blast Burn")).toBeVisible();
  await expect(page.getByText("Hydro Cannon")).toBeVisible();
});

test("Utility NPCs section lists Move Reminder and Move Deleter", async ({ page }) => {
  await openTmsPage(page);
  await expect(page.getByText(/UTILITY NPCs/)).toBeVisible();
  await expect(page.getByText(/Move Reminder|Move Maniac/)).toBeVisible();
  await expect(page.getByText(/Move Deleter/)).toBeVisible();
});

test("MISSING filter hides owned entries", async ({ page }) => {
  await seed(page, { tmInventory: { TM01: 1 } });
  await openTmsPage(page);
  await page.getByRole("button", { name: /MISSING/ }).click();
  // Focus Punch (TM01) should NOT be in the list; another TM should
  await expect(page.getByRole("listitem", { name: /Focus Punch/ })).toHaveCount(0);
  await expect(page.getByRole("listitem", { name: /Dragon Claw/ })).toBeVisible();
});

test("TM scan button is visible in the TMs page header", async ({ page }) => {
  await openTmsPage(page);
  await expect(page.getByRole("button", { name: "Scan TM Case" })).toBeVisible();
});

test("TM Suggestions section appears on Party page when a TM is owned", async ({ page }) => {
  await seed(page, {
    party: [
      {
        n: 6,
        level: 40,
        moves: [{ name: "Flamethrower", type: "Fire" }],
      },
    ],
    tmInventory: { TM26: 1 }, // Earthquake
  });
  await page.getByRole("link", { name: "PARTY" }).click();
  await expect(page.getByText(/TM SUGGESTIONS/)).toBeVisible();
  await expect(
    page.getByRole("region", { name: "TM suggestions" }).getByText("Earthquake"),
  ).toBeVisible();
});

test("TM Suggestion row opens the teach modal with move pre-queued", async ({ page }) => {
  await seed(page, {
    party: [
      {
        n: 6,
        level: 40,
        moves: [{ name: "Flamethrower", type: "Fire" }],
      },
    ],
    tmInventory: { TM26: 1 }, // Earthquake
  });
  await page.getByRole("link", { name: "PARTY" }).click();
  await page
    .getByRole("region", { name: "TM suggestions" })
    .getByRole("button", { name: /Teach Earthquake/ })
    .click();
  // Modal is open with Charizard
  await expect(page.getByRole("dialog", { name: "EDIT POKÉMON" })).toBeVisible();
  // Earthquake is now in the moves list
  await expect(page.getByText("Earthquake").first()).toBeVisible();
});
