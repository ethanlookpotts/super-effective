import { describe, expect, it } from "vitest";
import { InMemorySettingsRepository, InMemoryStoreRepository } from "~/repositories/in-memory";
import { Playthrough } from "~/schemas";

describe("InMemoryStoreRepository", () => {
  it("round-trips a valid store", async () => {
    const repo = new InMemoryStoreRepository();
    const pt = Playthrough.parse({
      id: "11111111-1111-1111-1111-111111111111",
      name: "Test",
      gameId: "frlg-fr",
    });
    await repo.saveStore({ playthroughs: [pt], activePtId: pt.id });
    const loaded = await repo.loadStore();
    expect(loaded.playthroughs).toHaveLength(1);
    expect(loaded.activePtId).toBe(pt.id);
  });

  it("rejects invalid playthrough data at the boundary", async () => {
    const repo = new InMemoryStoreRepository();
    await expect(
      // biome-ignore lint/suspicious/noExplicitAny: testing invalid input
      repo.saveStore({ playthroughs: [{ id: "not-a-uuid" }] as any, activePtId: null }),
    ).rejects.toThrow();
  });
});

describe("InMemorySettingsRepository", () => {
  it("defaults theme to system when unset", async () => {
    const repo = new InMemorySettingsRepository();
    const s = await repo.loadSettings();
    expect(s.theme).toBe("system");
  });

  it("persists theme choice", async () => {
    const repo = new InMemorySettingsRepository();
    await repo.saveSettings({ theme: "dark" });
    const s = await repo.loadSettings();
    expect(s.theme).toBe("dark");
  });
});
