import { Settings, Store } from "~/schemas";
import type { SettingsRepository, StoreCapabilities, StoreRepository } from "./types";

const STORE_KEY = "se_v1";
const SETTINGS_KEY = "se_settings_v1";

const CAPS: StoreCapabilities = {
  readOnly: false,
  syncsRemotely: false,
  supportsConflictResolution: false,
};

const EMPTY_STORE: Store = { playthroughs: [], activePtId: null };
const EMPTY_SETTINGS: Settings = { theme: "system" };

function readJson<T>(key: string): unknown {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Best-effort migrations applied before Zod validation so legacy data from the
 * vanilla app loads cleanly. Mirrors the migrations in the old DataManager.load().
 */
function migrateLegacyStore(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const store = raw as { playthroughs?: unknown[]; activePtId?: unknown };
  if (!Array.isArray(store.playthroughs)) return raw;
  for (const pt of store.playthroughs) {
    if (!pt || typeof pt !== "object") continue;
    const p = pt as Record<string, unknown>;
    if (!p.gameId || p.gameId === "frlg") p.gameId = "frlg-fr";
    if (!p.pc) p.pc = [];
    if (!p.tmInventory) p.tmInventory = {};
    if (!p.rivalStarter) p.rivalStarter = "bulbasaur";
    if (!Array.isArray(p.recents)) p.recents = [];
  }
  if (store.playthroughs.length) {
    const first = store.playthroughs[0] as { id?: string };
    const activeValid =
      typeof store.activePtId === "string" &&
      store.playthroughs.some((pt): pt is { id: string } => {
        return Boolean(pt) && typeof (pt as { id?: unknown }).id === "string";
      });
    if (!activeValid && first?.id) store.activePtId = first.id;
  } else if (!store.activePtId) {
    store.activePtId = null;
  }
  return raw;
}

export class LocalStorageStoreRepository implements StoreRepository {
  readonly id = "local-storage";
  readonly capabilities = CAPS;

  async loadStore(): Promise<Store> {
    const raw = readJson(STORE_KEY);
    if (raw == null) return EMPTY_STORE;
    const migrated = migrateLegacyStore(raw);
    const parsed = Store.safeParse(migrated);
    if (!parsed.success) {
      console.warn("[store] corrupted payload, returning empty", parsed.error);
      return EMPTY_STORE;
    }
    return parsed.data;
  }

  async saveStore(store: Store): Promise<void> {
    const validated = Store.parse(store);
    localStorage.setItem(STORE_KEY, JSON.stringify(validated));
    window.dispatchEvent(new StorageEvent("storage", { key: STORE_KEY }));
  }

  subscribe(listener: (store: Store) => void): () => void {
    const handler = (e: StorageEvent) => {
      if (e.key !== STORE_KEY) return;
      this.loadStore().then(listener);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }
}

export class LocalStorageSettingsRepository implements SettingsRepository {
  readonly id = "local-storage";

  async loadSettings(): Promise<Settings> {
    const raw = readJson(SETTINGS_KEY);
    if (raw == null) return EMPTY_SETTINGS;
    const parsed = Settings.safeParse(raw);
    return parsed.success ? parsed.data : EMPTY_SETTINGS;
  }

  async saveSettings(settings: Settings): Promise<void> {
    const validated = Settings.parse(settings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(validated));
  }
}
