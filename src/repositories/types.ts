import type { Playthrough, Settings, Store } from "~/schemas";

/**
 * Backend-agnostic contract for persistent app state.
 *
 * Implementations: LocalStorageRepository (default), GistRepository (cloud sync),
 * StaticRepository (read-only demo), InMemoryRepository (tests).
 *
 * All methods are async so implementations can be remote. All data crossing the
 * boundary is validated with Zod — bad data never reaches React components.
 */
export interface StoreRepository {
  readonly id: string;
  readonly capabilities: StoreCapabilities;
  loadStore(): Promise<Store>;
  saveStore(store: Store): Promise<void>;
  subscribe?(listener: (store: Store) => void): () => void;
}

export interface SettingsRepository {
  readonly id: string;
  loadSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
}

export interface StoreCapabilities {
  readOnly: boolean;
  syncsRemotely: boolean;
  supportsConflictResolution: boolean;
}

export interface Repositories {
  store: StoreRepository;
  settings: SettingsRepository;
}

/** Convenience slice used by most hooks. */
export type ActiveSlice = {
  store: Store;
  active: Playthrough | null;
};
