import { Settings, Store } from "~/schemas";
import type { SettingsRepository, StoreCapabilities, StoreRepository } from "./types";

const CAPS: StoreCapabilities = {
  readOnly: false,
  syncsRemotely: false,
  supportsConflictResolution: false,
};

/** For tests and stories. Holds state in a closure — no side effects. */
export class InMemoryStoreRepository implements StoreRepository {
  readonly id = "in-memory";
  readonly capabilities = CAPS;
  private state: Store;

  constructor(initial?: Partial<Store>) {
    this.state = Store.parse({ playthroughs: [], activePtId: null, ...initial });
  }

  async loadStore(): Promise<Store> {
    return structuredClone(this.state);
  }

  async saveStore(store: Store): Promise<void> {
    this.state = Store.parse(store);
  }
}

export class InMemorySettingsRepository implements SettingsRepository {
  readonly id = "in-memory";
  private state: Settings;

  constructor(initial?: Partial<Settings>) {
    this.state = Settings.parse({ theme: "system", ...initial });
  }

  async loadSettings(): Promise<Settings> {
    return structuredClone(this.state);
  }

  async saveSettings(settings: Settings): Promise<void> {
    this.state = Settings.parse(settings);
  }
}
