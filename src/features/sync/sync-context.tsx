import { type ReactNode, createContext, useContext } from "react";
import { useSync } from "./use-sync";

type SyncApi = ReturnType<typeof useSync>;

const SyncContext = createContext<SyncApi | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const sync = useSync();
  return <SyncContext.Provider value={sync}>{children}</SyncContext.Provider>;
}

export function useSyncContext(): SyncApi {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSyncContext must be used inside <SyncProvider>");
  return ctx;
}

export function useMarkLocalChanged(): () => void {
  const ctx = useContext(SyncContext);
  return ctx?.markLocalChanged ?? (() => {});
}
