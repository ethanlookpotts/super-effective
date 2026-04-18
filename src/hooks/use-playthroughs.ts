import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DEFAULT_GAME_ID } from "~/data/games";
import { useMarkLocalChanged } from "~/features/sync/sync-context";
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

function useStoreMutation<TInput>(reducer: (store: Store, input: TInput) => Store) {
  const repo = useStoreRepository();
  const qc = useQueryClient();
  const markLocalChanged = useMarkLocalChanged();
  const { data: store } = useStore();
  return useMutation({
    mutationFn: async (input: TInput) => {
      if (!store) throw new Error("store not loaded");
      const next = reducer(store, input);
      await repo.saveStore(next);
      return next;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["store"] });
      markLocalChanged();
    },
  });
}

export function useCreatePlaythrough() {
  return useStoreMutation<{ name?: string; gameId?: string }>((store, { name, gameId }) => {
    const ptName = name?.trim() || `RUN ${store.playthroughs.length + 1}`;
    const pt = makePlaythrough(ptName, gameId ?? DEFAULT_GAME_ID);
    return {
      playthroughs: [...store.playthroughs, pt],
      activePtId: pt.id,
    };
  });
}

export function useSwitchPlaythrough() {
  return useStoreMutation<string>((store, id) => ({ ...store, activePtId: id }));
}

export function useRenamePlaythrough() {
  return useStoreMutation<{ id: string; name: string }>((store, { id, name }) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("name required");
    return {
      ...store,
      playthroughs: store.playthroughs.map((p) => (p.id === id ? { ...p, name: trimmed } : p)),
    };
  });
}

export function useDeletePlaythrough() {
  return useStoreMutation<string>((store, id) => {
    if (store.playthroughs.length <= 1) throw new Error("cannot delete the only run");
    const playthroughs = store.playthroughs.filter((p) => p.id !== id);
    const activePtId = store.activePtId === id ? (playthroughs[0]?.id ?? null) : store.activePtId;
    return { playthroughs, activePtId };
  });
}

export function useUpdateActivePlaythrough() {
  return useStoreMutation<(pt: Playthrough) => Playthrough>((store, update) => {
    const activeId = store.activePtId ?? store.playthroughs[0]?.id;
    if (!activeId) throw new Error("no active playthrough");
    return {
      ...store,
      playthroughs: store.playthroughs.map((p) => (p.id === activeId ? update(p) : p)),
    };
  });
}
