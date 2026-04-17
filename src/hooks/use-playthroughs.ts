import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DEFAULT_GAME_ID } from "~/data/games";
import { useStoreRepository } from "~/repositories";
import type { Playthrough, Store } from "~/schemas";
import { useStore } from "./use-store";

function makePlaythrough(name: string, gameId: string): Playthrough {
  return {
    id: crypto.randomUUID(),
    name,
    gameId: gameId || DEFAULT_GAME_ID,
    party: [],
    pc: [],
    recents: [],
    rivalStarter: "bulbasaur",
    tmInventory: {},
  };
}

function saveAndInvalidate(store: Store) {
  return store;
}

export function useCreatePlaythrough() {
  const repo = useStoreRepository();
  const qc = useQueryClient();
  const { data: store } = useStore();
  return useMutation({
    mutationFn: async ({ name, gameId }: { name?: string; gameId?: string }) => {
      const current = store ?? { playthroughs: [], activePtId: null };
      const ptName = name?.trim() || `RUN ${current.playthroughs.length + 1}`;
      const pt = makePlaythrough(ptName, gameId ?? DEFAULT_GAME_ID);
      const next: Store = {
        playthroughs: [...current.playthroughs, pt],
        activePtId: pt.id,
      };
      await repo.saveStore(next);
      return saveAndInvalidate(next);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["store"] }),
  });
}

export function useSwitchPlaythrough() {
  const repo = useStoreRepository();
  const qc = useQueryClient();
  const { data: store } = useStore();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!store) throw new Error("store not loaded");
      const next: Store = { ...store, activePtId: id };
      await repo.saveStore(next);
      return next;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["store"] }),
  });
}

export function useRenamePlaythrough() {
  const repo = useStoreRepository();
  const qc = useQueryClient();
  const { data: store } = useStore();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      if (!store) throw new Error("store not loaded");
      const trimmed = name.trim();
      if (!trimmed) throw new Error("name required");
      const next: Store = {
        ...store,
        playthroughs: store.playthroughs.map((p) => (p.id === id ? { ...p, name: trimmed } : p)),
      };
      await repo.saveStore(next);
      return next;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["store"] }),
  });
}

export function useDeletePlaythrough() {
  const repo = useStoreRepository();
  const qc = useQueryClient();
  const { data: store } = useStore();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!store) throw new Error("store not loaded");
      if (store.playthroughs.length <= 1) throw new Error("cannot delete the only run");
      const playthroughs = store.playthroughs.filter((p) => p.id !== id);
      const activePtId = store.activePtId === id ? (playthroughs[0]?.id ?? null) : store.activePtId;
      const next: Store = { playthroughs, activePtId };
      await repo.saveStore(next);
      return next;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["store"] }),
  });
}

/**
 * Replace the active playthrough with a modified copy. Used by party edits,
 * PC operations, recents, TM inventory, rival starter selection, etc.
 */
export function useUpdateActivePlaythrough() {
  const repo = useStoreRepository();
  const qc = useQueryClient();
  const { data: store } = useStore();
  return useMutation({
    mutationFn: async (update: (pt: Playthrough) => Playthrough) => {
      if (!store) throw new Error("store not loaded");
      const activeId = store.activePtId ?? store.playthroughs[0]?.id;
      if (!activeId) throw new Error("no active playthrough");
      const next: Store = {
        ...store,
        playthroughs: store.playthroughs.map((p) => (p.id === activeId ? update(p) : p)),
      };
      await repo.saveStore(next);
      return next;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["store"] }),
  });
}
