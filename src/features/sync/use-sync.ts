import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSaveSettings, useSettings } from "~/hooks/use-settings";
import { useStoreRepository } from "~/repositories";
import type { Settings, Store } from "~/schemas";
import {
  createGist as createGistApi,
  fetchGist,
  listGists as listGistsApi,
  pushGist,
  testToken as testTokenApi,
} from "./gist-client";
import type { SyncConflict, SyncStatus } from "./types";

const POLL_MS = 60_000;
const DEBOUNCE_MS = 2_000;
const LAST_SYNCED_KEY = "se_last_synced";
const LAST_LOCAL_CHANGE_KEY = "se_last_local_change";

function read(key: string): string | null {
  return localStorage.getItem(key);
}

function write(key: string, val: string | null) {
  if (val == null) localStorage.removeItem(key);
  else localStorage.setItem(key, val);
}

function summarise(store: Store): string[] {
  return store.playthroughs.map((p) => p.name);
}

export function useSync() {
  const storeRepo = useStoreRepository();
  const { data: settings } = useSettings();
  const saveSettings = useSaveSettings();
  const qc = useQueryClient();

  const [status, setStatus] = useState<SyncStatus>({
    lastSynced: read(LAST_SYNCED_KEY),
    syncing: false,
    error: null,
    gistId: settings?.gistId ?? null,
    hasToken: !!settings?.githubToken,
  });
  const [conflict, setConflict] = useState<SyncConflict | null>(null);

  const syncingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setStatus((s) => ({
      ...s,
      gistId: settings?.gistId ?? null,
      hasToken: !!settings?.githubToken,
    }));
  }, [settings?.gistId, settings?.githubToken]);

  const pull = useCallback(async () => {
    if (syncingRef.current) return;
    const token = settings?.githubToken;
    const gistId = settings?.gistId;
    if (!token || !gistId) return;
    syncingRef.current = true;
    setStatus((s) => ({ ...s, syncing: true, error: null }));
    try {
      const remote = await fetchGist(token, gistId);
      if (!remote) {
        // No remote payload yet — nothing to reconcile.
        syncingRef.current = false;
        setStatus((s) => ({ ...s, syncing: false }));
        return;
      }
      const lastSynced = read(LAST_SYNCED_KEY);
      const lastLocalChange = read(LAST_LOCAL_CHANGE_KEY);
      const remoteModified = remote.lastModified || "";
      const remoteIsNewer = !!remoteModified && (!lastSynced || remoteModified > lastSynced);
      const localIsNewer = !!lastLocalChange && (!lastSynced || lastLocalChange > lastSynced);

      if (remoteIsNewer && localIsNewer) {
        const local = await storeRepo.loadStore();
        setConflict({
          remoteLastModified: remoteModified,
          localSummary: summarise(local),
          remoteSummary: summarise(remote.store),
          remoteStore: remote.store,
        });
      } else if (remoteIsNewer) {
        await storeRepo.saveStore(remote.store);
        write(LAST_SYNCED_KEY, remoteModified);
        write(LAST_LOCAL_CHANGE_KEY, null);
        qc.invalidateQueries({ queryKey: ["store"] });
        setStatus((s) => ({ ...s, lastSynced: remoteModified }));
      }
    } catch (e) {
      setStatus((s) => ({ ...s, error: (e as Error).message }));
    } finally {
      syncingRef.current = false;
      setStatus((s) => ({ ...s, syncing: false }));
    }
  }, [settings?.githubToken, settings?.gistId, storeRepo, qc]);

  const push = useCallback(async () => {
    if (syncingRef.current) return;
    const token = settings?.githubToken;
    if (!token) return;
    syncingRef.current = true;
    setStatus((s) => ({ ...s, syncing: true, error: null }));
    try {
      const store = await storeRepo.loadStore();
      const { gistId: newGistId, payload } = await pushGist(token, settings?.gistId ?? null, store);
      write(LAST_SYNCED_KEY, payload.lastModified);
      write(LAST_LOCAL_CHANGE_KEY, null);
      setStatus((s) => ({ ...s, lastSynced: payload.lastModified, gistId: newGistId }));
      if (newGistId !== settings?.gistId) {
        saveSettings.mutate({ ...(settings as Settings), gistId: newGistId });
      }
    } catch (e) {
      setStatus((s) => ({ ...s, error: (e as Error).message }));
    } finally {
      syncingRef.current = false;
      setStatus((s) => ({ ...s, syncing: false }));
    }
  }, [settings, storeRepo, saveSettings]);

  const markLocalChanged = useCallback(() => {
    if (!settings?.githubToken) return;
    write(LAST_LOCAL_CHANGE_KEY, new Date().toISOString());
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void push();
    }, DEBOUNCE_MS);
  }, [settings?.githubToken, push]);

  const resolveConflict = useCallback(
    async (choice: "local" | "remote") => {
      if (!conflict) return;
      if (choice === "remote") {
        await storeRepo.saveStore(conflict.remoteStore);
        write(LAST_SYNCED_KEY, conflict.remoteLastModified);
        write(LAST_LOCAL_CHANGE_KEY, null);
        qc.invalidateQueries({ queryKey: ["store"] });
        setStatus((s) => ({ ...s, lastSynced: conflict.remoteLastModified }));
      } else {
        write(LAST_SYNCED_KEY, new Date().toISOString());
        await push();
      }
      setConflict(null);
    },
    [conflict, storeRepo, qc, push],
  );

  const disconnect = useCallback(async () => {
    saveSettings.mutate({
      ...(settings as Settings),
      githubToken: undefined,
      gistId: undefined,
    });
    write(LAST_SYNCED_KEY, null);
    write(LAST_LOCAL_CHANGE_KEY, null);
    setStatus({
      lastSynced: null,
      syncing: false,
      error: null,
      gistId: null,
      hasToken: false,
    });
    if (pollRef.current) clearInterval(pollRef.current);
  }, [settings, saveSettings]);

  // Boot pull + periodic poll when token exists.
  useEffect(() => {
    if (!settings?.githubToken || !settings?.gistId) return;
    void pull();
    pollRef.current = setInterval(() => {
      void pull();
    }, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [settings?.githubToken, settings?.gistId, pull]);

  return {
    status,
    conflict,
    pull,
    push,
    markLocalChanged,
    resolveConflict,
    disconnect,
    testToken: testTokenApi,
    createGist: (store: Store) => {
      if (!settings?.githubToken) throw new Error("No token configured");
      return createGistApi(settings.githubToken, store);
    },
    listGists: () => {
      if (!settings?.githubToken) throw new Error("No token configured");
      return listGistsApi(settings.githubToken);
    },
  };
}
