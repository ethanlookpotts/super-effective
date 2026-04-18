import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMarkLocalChanged } from "~/features/sync/sync-context";
import { useStoreRepository } from "~/repositories";
import type { Playthrough, Store } from "~/schemas";

const STORE_KEY = ["store"] as const;

export function useStore() {
  const repo = useStoreRepository();
  return useQuery({
    queryKey: STORE_KEY,
    queryFn: () => repo.loadStore(),
  });
}

export function useSaveStore() {
  const repo = useStoreRepository();
  const qc = useQueryClient();
  const markLocalChanged = useMarkLocalChanged();
  return useMutation({
    mutationFn: (store: Store) => repo.saveStore(store),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STORE_KEY });
      markLocalChanged();
    },
  });
}

export function useActivePlaythrough(): Playthrough | null {
  const { data } = useStore();
  if (!data) return null;
  return data.playthroughs.find((p) => p.id === data.activePtId) ?? data.playthroughs[0] ?? null;
}
