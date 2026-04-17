import { type ReactNode, createContext, useContext, useMemo } from "react";
import { LocalStorageSettingsRepository, LocalStorageStoreRepository } from "./local-storage";
import type { Repositories } from "./types";

const RepositoryContext = createContext<Repositories | null>(null);

export function RepositoryProvider({
  children,
  repositories,
}: {
  children: ReactNode;
  repositories?: Repositories;
}) {
  const value = useMemo<Repositories>(
    () =>
      repositories ?? {
        store: new LocalStorageStoreRepository(),
        settings: new LocalStorageSettingsRepository(),
      },
    [repositories],
  );

  return <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>;
}

export function useRepositories(): Repositories {
  const ctx = useContext(RepositoryContext);
  if (!ctx) throw new Error("useRepositories must be called within <RepositoryProvider>");
  return ctx;
}

export function useStoreRepository() {
  return useRepositories().store;
}

export function useSettingsRepository() {
  return useRepositories().settings;
}

export * from "./types";
