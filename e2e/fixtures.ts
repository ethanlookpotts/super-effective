import { type Page, test as base, expect } from "@playwright/test";
import { POKEMON } from "../src/data/pokemon";
import type { PartyMove } from "../src/schemas";

export { expect };

const SEED_PT_ID = "00000000-0000-4000-8000-000000000001";

export const SEED_STORE = JSON.stringify({
  playthroughs: [
    {
      id: SEED_PT_ID,
      name: "RUN 1",
      gameId: "frlg-fr",
      party: [],
      pc: [],
      recents: [],
      rivalStarter: "bulbasaur",
      tmInventory: {},
    },
  ],
  activePtId: SEED_PT_ID,
});

/**
 * Extends the Playwright `page` fixture to seed localStorage with a valid
 * FireRed playthrough before each test, so the game gate never blocks.
 * Tests that specifically test the gate can clear localStorage themselves.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto("/");
    await page.evaluate((store: string) => {
      localStorage.clear();
      localStorage.setItem("se_v1", store);
    }, SEED_STORE);
    await page.reload();
    await page.getByLabel("Search Pokémon").waitFor({ state: "visible" });
    await use(page);
  },
});

/**
 * Minimal party-member shape accepted by the seed helpers — expanded with
 * optional moves / level so individual tests can populate what they need.
 */
export interface SeedMember {
  n: number;
  level?: number;
  moves?: PartyMove[];
}

function memberFor(seed: SeedMember) {
  const p = POKEMON.find((x) => x.n === seed.n);
  if (!p) throw new Error(`unknown dex number: ${seed.n}`);
  return {
    n: p.n,
    name: p.name,
    types: [...p.types],
    moves: seed.moves ?? [],
    ...(seed.level != null ? { level: seed.level } : {}),
  };
}

type StorePatch = {
  party?: SeedMember[];
  pc?: SeedMember[];
  tmInventory?: Record<string, number>;
};

/**
 * Overwrite fields on the seeded playthrough by writing directly to
 * `se_v1` localStorage and reloading. Preferable to simulating click paths
 * when a test only cares about downstream behaviour.
 */
export async function seedPlaythrough(page: Page, patch: StorePatch) {
  const payload = {
    party: patch.party?.map(memberFor),
    pc: patch.pc?.map(memberFor),
    tmInventory: patch.tmInventory,
  };
  await page.evaluate(
    ({ id, payload }) => {
      const raw = localStorage.getItem("se_v1");
      if (!raw) throw new Error("se_v1 missing — did the fixture run?");
      const store = JSON.parse(raw);
      const pt = store.playthroughs.find((p: { id: string }) => p.id === id);
      if (!pt) throw new Error("seed playthrough missing");
      if (payload.party) pt.party = payload.party;
      if (payload.pc) pt.pc = payload.pc;
      if (payload.tmInventory) pt.tmInventory = payload.tmInventory;
      localStorage.setItem("se_v1", JSON.stringify(store));
    },
    { id: SEED_PT_ID, payload },
  );
  await page.reload();
  await page.getByLabel("Search Pokémon").waitFor({ state: "visible" });
}
