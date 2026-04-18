import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSettingsRepository } from "~/repositories";
import type { Settings } from "~/schemas";

const SETTINGS_KEY = ["settings"] as const;

export function useSettings() {
  const repo = useSettingsRepository();
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: () => repo.loadSettings(),
  });
}

export function useSaveSettings() {
  const repo = useSettingsRepository();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: Settings) => repo.saveSettings(settings),
    onSuccess: () => qc.invalidateQueries({ queryKey: SETTINGS_KEY }),
  });
}
