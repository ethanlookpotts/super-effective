import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocalStorageStoreRepository } from "~/repositories/local-storage";
import type { Store } from "~/schemas";

const KEY = "se_v1";

class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  key(i: number) {
    return Array.from(this.data.keys())[i] ?? null;
  }
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, String(v));
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

// biome-ignore lint/suspicious/noExplicitAny: test shim for browser globals
const g = globalThis as any;

beforeEach(() => {
  g.localStorage = new MemoryStorage();
  g.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  };
  g.StorageEvent = class StorageEventShim {
    key?: string;
    type: string;
    constructor(type: string, init?: { key?: string }) {
      this.type = type;
      this.key = init?.key;
    }
  };
});

afterEach(() => {
  (g.localStorage as Storage).clear();
});

describe("LocalStorageStoreRepository — legacy vanilla se_v1 round-trip", () => {
  it("loads a real-world vanilla playthrough and fills in new required fields", async () => {
    // Shape matches js/state.js on main: { playthroughs: [{ id, name, gameId, party[], pc[], recents[], rivalStarter }], activePtId }.
    // Party members use minimal { n, name, types, moves[], level }. Moves use { name, type }.
    const legacy = {
      playthroughs: [
        {
          id: "3f0c5d6e-4b84-4bdc-8fcb-1c2e8ab5e4b0",
          name: "Red Run",
          gameId: "frlg-fr",
          party: [
            {
              n: 25,
              name: "Pikachu",
              types: ["Electric"],
              moves: [{ name: "Thunderbolt", type: "Electric" }],
              level: 36,
            },
          ],
          pc: [
            {
              n: 133,
              name: "Eevee",
              types: ["Normal"],
              moves: [],
              level: 5,
            },
          ],
          recents: [{ n: 25, name: "Pikachu", types: ["Electric"] }],
          rivalStarter: "squirtle",
        },
      ],
      activePtId: "3f0c5d6e-4b84-4bdc-8fcb-1c2e8ab5e4b0",
    };
    (g.localStorage as Storage).setItem(KEY, JSON.stringify(legacy));

    const repo = new LocalStorageStoreRepository();
    const loaded = await repo.loadStore();

    expect(loaded.playthroughs).toHaveLength(1);
    const pt = loaded.playthroughs[0];
    expect(pt.id).toBe(legacy.playthroughs[0].id);
    expect(pt.name).toBe("Red Run");
    expect(pt.gameId).toBe("frlg-fr");
    expect(pt.rivalStarter).toBe("squirtle");
    expect(pt.party[0].name).toBe("Pikachu");
    expect(pt.party[0].moves).toEqual([{ name: "Thunderbolt", type: "Electric" }]);
    expect(pt.pc[0].name).toBe("Eevee");
    expect(pt.recents).toEqual([{ n: 25, name: "Pikachu", types: ["Electric"] }]);
    // Fields new to React schema filled in via zod defaults:
    expect(pt.tmInventory).toEqual({});
    expect(loaded.activePtId).toBe(legacy.activePtId);
  });

  it("migrates legacy gameId 'frlg' → 'frlg-fr' and fills missing pc/tmInventory/rivalStarter/recents", async () => {
    const ancient = {
      playthroughs: [
        {
          id: "11111111-2222-3333-4444-555555555555",
          name: "Ancient",
          gameId: "frlg",
          party: [],
        },
      ],
      activePtId: "11111111-2222-3333-4444-555555555555",
    };
    (g.localStorage as Storage).setItem(KEY, JSON.stringify(ancient));

    const repo = new LocalStorageStoreRepository();
    const loaded = await repo.loadStore();

    const pt = loaded.playthroughs[0];
    expect(pt.gameId).toBe("frlg-fr");
    expect(pt.pc).toEqual([]);
    expect(pt.recents).toEqual([]);
    expect(pt.tmInventory).toEqual({});
    expect(pt.rivalStarter).toBe("bulbasaur");
  });

  it("round-trips through saveStore → loadStore without data loss", async () => {
    const repo = new LocalStorageStoreRepository();
    const initial: Store = {
      playthroughs: [
        {
          id: "3f0c5d6e-4b84-4bdc-8fcb-1c2e8ab5e4b0",
          name: "Save/Load",
          gameId: "frlg-lg",
          party: [
            {
              n: 6,
              name: "Charizard",
              types: ["Fire", "Flying"],
              moves: [
                { name: "Flamethrower", type: "Fire" },
                { name: "Wing Attack", type: "Flying" },
              ],
              level: 72,
              nature: "Adamant",
              shiny: true,
              otName: "RED",
              otId: "12345",
              pokeball: "Premier",
              trainerMemo: "starter",
              stats: { hp: 240, atk: 200, def: 160, spatk: 210, spdef: 170, spe: 188 },
            },
          ],
          pc: [],
          recents: [],
          rivalStarter: "bulbasaur",
          tmInventory: { TM24: 1, HM01: 1 },
        },
      ],
      activePtId: "3f0c5d6e-4b84-4bdc-8fcb-1c2e8ab5e4b0",
    };
    await repo.saveStore(initial);
    const reloaded = await repo.loadStore();
    expect(reloaded).toEqual(initial);
  });

  it("returns an empty store when se_v1 is missing or malformed", async () => {
    const repo = new LocalStorageStoreRepository();
    let loaded = await repo.loadStore();
    expect(loaded).toEqual({ playthroughs: [], activePtId: null });

    (g.localStorage as Storage).setItem(KEY, "{not valid json");
    loaded = await repo.loadStore();
    expect(loaded).toEqual({ playthroughs: [], activePtId: null });
  });
});
