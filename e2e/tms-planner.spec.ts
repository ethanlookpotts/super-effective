// spec: TMs & HMs page — inventory, filters, learners, HM Carrier, TM Suggestions
import { expect, test } from "./fixtures";

async function openTmsPage(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: /TMs & HMs/ }).click();
}

// TODO(phase-8): re-port — the React build doesn't expose these globals.
// Seed via localStorage `se_v1` when this spec is walked.
interface PartyMemberSeed {
  n: number;
  name: string;
  types: string[];
  moves?: { name: string; type: string; cat?: string }[];
  level?: string;
}
interface LegacyPlaythrough {
  party: PartyMemberSeed[];
  tmInventory: Record<string, number>;
}
interface LegacyWindow {
  activePt(): LegacyPlaythrough;
  addToPC(n: number): void;
  DataManager: { save(): void };
  renderParty(): void;
}

async function seedParty(page: import("@playwright/test").Page, party: PartyMemberSeed[]) {
  await page.evaluate((p) => {
    const w = window as unknown as LegacyWindow;
    const pt = w.activePt();
    pt.party = p.map((m) => ({ ...m, moves: m.moves || [], level: m.level || "" }));
    w.DataManager.save();
    w.renderParty();
  }, party);
}

async function seedPC(page: import("@playwright/test").Page, nums: number[]) {
  await page.evaluate((ns: number[]) => {
    const w = window as unknown as LegacyWindow;
    for (const n of ns) w.addToPC(n);
  }, nums);
}

async function seedInventory(page: import("@playwright/test").Page, inv: Record<string, number>) {
  await page.evaluate((i: Record<string, number>) => {
    const w = window as unknown as LegacyWindow;
    const pt = w.activePt();
    pt.tmInventory = { ...i };
    w.DataManager.save();
  }, inv);
}

test("TMs page renders filter bar with total counts", async ({ page }) => {
  await openTmsPage(page);
  await expect(page.getByRole("button", { name: /ALL/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /OWNED/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /MISSING/ })).toBeVisible();
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
  await seedParty(page, [
    { n: 6, name: "Charizard", types: ["Fire", "Flying"] },
    { n: 9, name: "Blastoise", types: ["Water"] },
  ]);
  await seedPC(page, [25]); // Pikachu
  await openTmsPage(page);
  // TM24 Thunderbolt — Pikachu + many party mons can learn
  // Expand via the card's WHO CAN LEARN button. It's unique because only one is open at a time
  const thunderboltCard = page.getByRole("listitem", { name: /Thunderbolt/ });
  await thunderboltCard.getByText("WHO CAN LEARN").click();
  // Party section
  const learnersBlock = page.getByRole("region", { name: "Learners for Thunderbolt" });
  await expect(learnersBlock).toBeVisible();
  await expect(learnersBlock.getByText("IN PC")).toBeVisible();
});

test("HM Carrier card appears when ≥2 HMs owned with party+PC members", async ({ page }) => {
  await seedParty(page, [{ n: 54, name: "Psyduck", types: ["Water"], level: "25" }]);
  await seedInventory(page, { HM01: 1, HM03: 1, HM04: 1 }); // Cut + Surf + Strength
  await openTmsPage(page);
  await expect(page.getByText("HM CARRIER")).toBeVisible();
  await expect(page.getByText(/CARRIES \d\/\d HMs/).first()).toBeVisible();
});

test("HM Carrier card hidden when fewer than 2 HMs owned", async ({ page }) => {
  await seedParty(page, [{ n: 54, name: "Psyduck", types: ["Water"] }]);
  await seedInventory(page, { HM01: 1 });
  await openTmsPage(page);
  await expect(page.getByText("HM CARRIER")).toHaveCount(0);
});

test("Move Tutors section renders with Cape Brink starter entries", async ({ page }) => {
  await openTmsPage(page);
  await expect(page.getByText("MOVE TUTORS")).toBeVisible();
  await expect(page.getByText("Frenzy Plant")).toBeVisible();
  await expect(page.getByText("Blast Burn")).toBeVisible();
  await expect(page.getByText("Hydro Cannon")).toBeVisible();
});

test("Utility NPCs section lists Move Reminder and Move Deleter", async ({ page }) => {
  await openTmsPage(page);
  await expect(page.getByText("UTILITY NPCS")).toBeVisible();
  await expect(page.getByText(/Move Reminder|Move Maniac/)).toBeVisible();
  await expect(page.getByText(/Move Deleter/)).toBeVisible();
});

test("MISSING filter hides owned entries", async ({ page }) => {
  await seedInventory(page, { TM01: 1 });
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
  await seedParty(page, [
    {
      n: 6,
      name: "Charizard",
      types: ["Fire", "Flying"],
      level: "40",
      moves: [{ name: "Flamethrower", type: "Fire" }],
    },
  ]);
  await seedInventory(page, { TM26: 1 }); // Earthquake
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: /MY PARTY/ }).click();
  await expect(page.getByText("TM SUGGESTIONS")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "TM suggestions" }).getByText("Earthquake"),
  ).toBeVisible();
});

test("TM Suggestion row opens the teach modal with move pre-queued", async ({ page }) => {
  await seedParty(page, [
    {
      n: 6,
      name: "Charizard",
      types: ["Fire", "Flying"],
      level: "40",
      moves: [{ name: "Flamethrower", type: "Fire" }],
    },
  ]);
  await seedInventory(page, { TM26: 1 }); // Earthquake
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: /MY PARTY/ }).click();
  await page
    .getByRole("region", { name: "TM suggestions" })
    .getByRole("button", { name: /Teach Earthquake/ })
    .click();
  // Modal is open with Charizard
  await expect(page.getByText("EDIT POKÉMON")).toBeVisible();
  // Earthquake is now in the moves list
  await expect(page.getByText("Earthquake").first()).toBeVisible();
});
