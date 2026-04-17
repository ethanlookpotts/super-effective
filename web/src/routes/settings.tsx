import { useEffect } from "react";
import { useSaveSettings, useSettings } from "~/hooks/use-settings";
import { useStoreRepository } from "~/repositories";

const THEMES = ["light", "system", "dark"] as const;

export function SettingsRoute() {
  const { data: settings, isLoading } = useSettings();
  const save = useSaveSettings();
  const storeRepo = useStoreRepository();

  useEffect(() => {
    if (!settings) return;
    applyTheme(settings.theme);
  }, [settings]);

  if (isLoading || !settings) {
    return <div className="p-4 text-[var(--color-text-2)]">Loading…</div>;
  }

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h2 className="font-[var(--font-pixel)] text-sm text-[var(--color-text)]">SETTINGS</h2>
        <p className="mt-1 text-xs text-[var(--color-text-3)]">
          Backend: <code>{storeRepo.id}</code>
          {storeRepo.capabilities.syncsRemotely ? " (syncs remotely)" : ""}
        </p>
      </header>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-[var(--font-pixel)] text-xs text-[var(--color-text-2)]">
          THEME
        </legend>
        <div className="flex gap-2">
          {THEMES.map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => save.mutate({ ...settings, theme })}
              className={`min-h-11 flex-1 rounded-[var(--radius-card)] border px-3 text-xs uppercase ${
                settings.theme === theme
                  ? "border-[var(--color-gold)] bg-[var(--color-card)] text-[var(--color-text)]"
                  : "border-[var(--color-border)] bg-[var(--color-card-2)] text-[var(--color-text-2)]"
              }`}
            >
              {theme}
            </button>
          ))}
        </div>
      </fieldset>
    </section>
  );
}

function applyTheme(theme: "light" | "system" | "dark") {
  const root = document.documentElement;
  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = prefersDark ? "dark" : "light";
    return;
  }
  root.dataset.theme = theme;
}
