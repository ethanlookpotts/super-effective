import type { Store } from "~/schemas";

export interface SyncStatus {
  lastSynced: string | null;
  syncing: boolean;
  error: string | null;
  gistId: string | null;
  hasToken: boolean;
}

export interface SyncConflict {
  remoteLastModified: string;
  localSummary: string[];
  remoteSummary: string[];
  remoteStore: Store;
}
