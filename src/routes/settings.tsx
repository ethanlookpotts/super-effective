import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { dataLabel, timeSince } from "~/features/sync/data-label";
import { useSyncContext } from "~/features/sync/sync-context";
import { useSaveSettings, useSettings } from "~/hooks/use-settings";
import type { Settings } from "~/schemas";

const THEMES = ["light", "system", "dark"] as const;

export function SettingsRoute() {
  const { data: settings, isLoading } = useSettings();
  const save = useSaveSettings();
  const sync = useSyncContext();

  useEffect(() => {
    if (!settings) return;
    applyTheme(settings.theme);
  }, [settings]);

  if (isLoading || !settings) {
    return <div className="p-4 text-text-2">Loading…</div>;
  }

  function patch(update: Partial<Settings>) {
    save.mutate({ ...(settings as Settings), ...update });
  }

  return (
    <section aria-label="Settings page" className="flex flex-col">
      <div className="page-header-settings shrink-0 border-b border-border px-4 pt-3 pb-3">
        <h2 className="font-pixel text-[9px] tracking-wider text-gold">⚙ SETTINGS</h2>
        <p className="mt-1 font-pixel text-[8px] text-text-3">DATA: {dataLabel(sync.status)}</p>
      </div>

      <div className="flex flex-col gap-6 p-4 pb-12">
        <ThemeSection theme={settings.theme} onChange={(theme) => patch({ theme })} />

        <ClaudeKeySection
          claudeApiKey={settings.claudeApiKey ?? ""}
          onChange={(claudeApiKey) => patch({ claudeApiKey: claudeApiKey || undefined })}
        />

        <GitHubSyncSection sync={sync} settings={settings} onPatch={patch} />
      </div>
    </section>
  );
}

function ThemeSection({
  theme,
  onChange,
}: {
  theme: Settings["theme"];
  onChange: (t: Settings["theme"]) => void;
}) {
  const icon: Record<(typeof THEMES)[number], string> = {
    light: "☀",
    system: "💻",
    dark: "🌙",
  };
  return (
    <fieldset className="flex flex-col gap-2 border-b border-border pb-6">
      <legend className="font-pixel text-[10px] tracking-wider text-text-2">THEME</legend>
      <p className="text-sm text-text-2">Choose light, dark, or match your device setting.</p>
      <div className="mt-1 flex gap-2">
        {THEMES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            className={`flex min-h-11 flex-1 items-center justify-center gap-1 rounded-card border px-3 font-pixel text-[10px] uppercase tracking-wider ${
              theme === t ? "border-gold bg-card text-text" : "border-border bg-card-2 text-text-2"
            }`}
          >
            <span className="text-base leading-none">{icon[t]}</span> {t}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function ClaudeKeySection({
  claudeApiKey,
  onChange,
}: {
  claudeApiKey: string;
  onChange: (key: string) => void;
}) {
  const [draft, setDraft] = useState(claudeApiKey);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => setDraft(claudeApiKey), [claudeApiKey]);

  async function test() {
    setStatus("idle");
    setError("");
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": draft,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 8,
          messages: [{ role: "user", content: "ok" }],
        }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`HTTP ${resp.status}: ${text.slice(0, 80)}`);
      }
      setStatus("ok");
    } catch (e) {
      setStatus("error");
      setError((e as Error).message);
    }
  }

  const keyStatus = claudeApiKey ? (
    <span className="rounded-full bg-[color-mix(in_srgb,var(--color-green)_14%,transparent)] px-2 py-0.5 font-pixel text-[9px] text-green">
      KEY ACTIVE
    </span>
  ) : (
    <span className="rounded-full bg-card-2 px-2 py-0.5 font-pixel text-[9px] text-text-3">
      NO KEY SET
    </span>
  );
  return (
    <fieldset className="flex flex-col gap-2 border-b border-border pb-6">
      <legend className="flex items-center gap-2 font-pixel text-[10px] tracking-wider text-text-2">
        CLAUDE API KEY {keyStatus}
      </legend>
      <p className="text-sm text-text-2">
        Required for the 📷 SCAN feature. Sent directly to Anthropic — never stored anywhere except
        this browser.
      </p>
      <ol className="mt-1 list-decimal pl-6 text-sm text-text-2 marker:text-text-3">
        <li>
          Go to <code className="text-text">console.anthropic.com</code>
        </li>
        <li>Sign in or create a free account</li>
        <li>
          Open <strong>API Keys → Create Key</strong>
        </li>
        <li>
          Copy the key — starts with <code className="text-gold">sk-ant-</code>
        </li>
      </ol>
      <label
        htmlFor="settings-claude-key"
        className="mt-2 block font-pixel text-[9px] tracking-wider text-text-3"
      >
        API KEY
      </label>
      <input
        id="settings-claude-key"
        type="password"
        aria-label="Claude API key"
        placeholder={claudeApiKey ? "Key saved — enter new key to replace" : "sk-ant-…"}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="min-h-11 rounded-card border-[1.5px] border-border-2 bg-card-2 px-3 text-sm text-text focus:border-gold focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={test}
          disabled={!draft}
          className="min-h-11 flex-1 rounded-card border border-border bg-card-2 px-3 text-xs text-text disabled:opacity-40"
        >
          TEST
        </button>
        <button
          type="button"
          onClick={() => onChange(draft)}
          disabled={!draft || draft === claudeApiKey}
          className="min-h-11 flex-1 rounded-card bg-gold px-3 text-xs font-semibold text-black disabled:opacity-40"
        >
          SAVE
        </button>
        {claudeApiKey && (
          <button
            type="button"
            onClick={() => {
              setDraft("");
              onChange("");
            }}
            className="min-h-11 rounded-card border border-red px-3 text-xs text-red"
          >
            FORGET
          </button>
        )}
      </div>
      <div
        className={`text-xs ${
          status === "ok" ? "text-green" : status === "error" ? "text-red" : "text-text-3"
        }`}
      >
        {claudeApiKey ? "Key saved." : "No key set."}
        {status === "ok" && " · Test OK"}
        {status === "error" && ` · ${error}`}
      </div>
    </fieldset>
  );
}

function GitHubSyncSection({
  sync,
  settings,
  onPatch,
}: {
  sync: ReturnType<typeof useSyncContext>;
  settings: Settings;
  onPatch: (update: Partial<Settings>) => void;
}) {
  const [tokenDraft, setTokenDraft] = useState(settings.githubToken ?? "");
  const [testState, setTestState] = useState<"idle" | "ok" | "error">("idle");
  const [testMsg, setTestMsg] = useState("");

  useEffect(() => setTokenDraft(settings.githubToken ?? ""), [settings.githubToken]);

  async function testToken() {
    setTestState("idle");
    setTestMsg("");
    try {
      await sync.testToken(tokenDraft);
      setTestState("ok");
      setTestMsg("Token OK");
    } catch (e) {
      setTestState("error");
      setTestMsg((e as Error).message);
    }
  }

  function saveToken() {
    onPatch({ githubToken: tokenDraft || undefined });
  }

  const tokenStatus = settings.githubToken ? (
    <span className="rounded-full bg-[color-mix(in_srgb,var(--color-green)_14%,transparent)] px-2 py-0.5 font-pixel text-[9px] text-green">
      CONNECTED
    </span>
  ) : (
    <span className="rounded-full bg-card-2 px-2 py-0.5 font-pixel text-[9px] text-text-3">
      NOT SET UP
    </span>
  );
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="flex items-center gap-2 font-pixel text-[10px] tracking-wider text-text-2">
        GITHUB SYNC {tokenStatus}
      </legend>
      <p className="text-sm text-text-2">
        Sync your playthroughs across devices via a private GitHub Gist. Requires a fine-grained
        personal access token with <strong>Gists</strong> read &amp; write permission.
      </p>
      <label
        htmlFor="settings-github-token"
        className="mt-2 block font-pixel text-[9px] tracking-wider text-text-3"
      >
        TOKEN
      </label>
      <input
        id="settings-github-token"
        type="password"
        aria-label="GitHub personal access token"
        placeholder="ghp_… or github_pat_…"
        value={tokenDraft}
        onChange={(e) => setTokenDraft(e.target.value)}
        className="min-h-11 rounded-card border-[1.5px] border-border-2 bg-card-2 px-3 text-sm text-text focus:border-gold focus:outline-none"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={testToken}
          disabled={!tokenDraft}
          className="min-h-11 flex-1 rounded-card border border-border bg-card-2 px-3 text-xs text-text disabled:opacity-40"
        >
          TEST
        </button>
        <button
          type="button"
          onClick={saveToken}
          disabled={!tokenDraft || tokenDraft === settings.githubToken}
          className="min-h-11 flex-1 rounded-card bg-gold px-3 text-xs font-semibold text-black disabled:opacity-40"
        >
          SAVE
        </button>
        {settings.githubToken && (
          <>
            <button
              type="button"
              onClick={() => sync.pull()}
              disabled={sync.status.syncing || !settings.gistId}
              className="min-h-11 flex-1 rounded-card border border-blue px-3 text-xs text-blue disabled:opacity-40"
            >
              SYNC NOW
            </button>
            <button
              type="button"
              onClick={() => {
                setTokenDraft("");
                sync.disconnect();
              }}
              className="min-h-11 rounded-card border border-red px-3 text-xs text-red"
            >
              FORGET
            </button>
          </>
        )}
      </div>
      {settings.githubToken && (
        <GistPickerSection sync={sync} settings={settings} onPatch={onPatch} />
      )}
      <SyncStatusLine sync={sync} testState={testState} testMsg={testMsg} />
    </fieldset>
  );
}

function GistPickerSection({
  sync,
  settings,
  onPatch,
}: {
  sync: ReturnType<typeof useSyncContext>;
  settings: Settings;
  onPatch: (update: Partial<Settings>) => void;
}) {
  const [picking, setPicking] = useState(!settings.gistId);

  useEffect(() => {
    if (!settings.gistId) setPicking(true);
  }, [settings.gistId]);

  if (settings.gistId && !picking) {
    return (
      <div className="mt-1 rounded-card border border-border bg-card-2 px-3 py-2 text-xs">
        <div className="font-pixel text-[9px] tracking-wider text-text-3">LINKED GIST</div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <code className="truncate text-text">{settings.gistId}</code>
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="min-h-9 shrink-0 rounded-card border border-border px-3 text-[11px] text-text-2"
          >
            CHANGE
          </button>
        </div>
      </div>
    );
  }

  return (
    <GistPicker
      sync={sync}
      currentGistId={settings.gistId ?? null}
      onCancel={settings.gistId ? () => setPicking(false) : undefined}
      onPick={(id) => {
        onPatch({ gistId: id });
        setPicking(false);
      }}
    />
  );
}

function GistPicker({
  sync,
  currentGistId,
  onPick,
  onCancel,
}: {
  sync: ReturnType<typeof useSyncContext>;
  currentGistId: string | null;
  onPick: (id: string) => void;
  onCancel?: () => void;
}) {
  const query = useQuery({
    queryKey: ["gists"],
    queryFn: () => sync.listGists(),
    staleTime: 30_000,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  async function createNew() {
    setCreating(true);
    setCreateError("");
    try {
      await sync.push();
    } catch (e) {
      setCreateError((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div
      aria-label="Pick sync gist"
      className="mt-1 flex flex-col gap-2 rounded-card border border-border bg-card-2 p-3"
    >
      <div className="flex items-center justify-between">
        <div className="font-pixel text-[9px] tracking-wider text-text-3">PICK A GIST</div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="font-pixel text-[9px] tracking-wider text-text-3 underline"
          >
            CANCEL
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={createNew}
        disabled={creating}
        className="min-h-11 rounded-card bg-gold px-3 text-xs font-semibold text-black disabled:opacity-40"
      >
        {creating ? "CREATING…" : "+ CREATE NEW SYNC GIST"}
      </button>
      {createError && <div className="text-xs text-red">{createError}</div>}

      <div className="font-pixel text-[9px] tracking-wider text-text-3">YOUR GISTS</div>
      {query.isLoading && <div className="text-xs text-text-3">Loading gists…</div>}
      {query.error && (
        <div className="text-xs text-red">Error: {(query.error as Error).message}</div>
      )}
      {query.data && query.data.length === 0 && (
        <div className="text-xs text-text-3">No gists on this account yet.</div>
      )}
      {query.data && query.data.length > 0 && (
        <ul className="flex flex-col gap-1">
          {query.data.map((g) => {
            const isCurrent = g.id === currentGistId;
            return (
              <li
                key={g.id}
                className="flex items-center justify-between gap-2 rounded-card border border-border bg-card px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-xs text-text">
                      {g.description || "(no description)"}
                    </div>
                    {g.isSyncGist && (
                      <span className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--color-green)_14%,transparent)] px-2 py-0.5 font-pixel text-[8px] text-green">
                        SYNC-READY
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 truncate text-[10px] text-text-3">
                    {g.filenames.join(", ")} · updated {timeSince(g.updatedAt)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onPick(g.id)}
                  disabled={isCurrent}
                  className="min-h-9 shrink-0 rounded-card bg-blue px-3 text-[11px] font-semibold text-white disabled:opacity-40"
                >
                  {isCurrent ? "CURRENT" : "USE"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-[11px] text-text-3">
        Picking a gist without the <code>super-effective-sync.json</code> file is fine — the next
        local change will add it.
      </p>
    </div>
  );
}

function SyncStatusLine({
  sync,
  testState,
  testMsg,
}: {
  sync: ReturnType<typeof useSyncContext>;
  testState: "idle" | "ok" | "error";
  testMsg: string;
}) {
  const { status } = sync;
  let text = "No token.";
  let tone: "ok" | "error" | "muted" = "muted";
  if (status.hasToken) {
    if (status.syncing) {
      text = "syncing…";
      tone = "muted";
    } else if (status.error) {
      text = `sync error: ${status.error}`;
      tone = "error";
    } else if (status.lastSynced) {
      text = `synced ${timeSince(status.lastSynced)}`;
      tone = "ok";
    } else {
      text = "token saved; first sync pending";
      tone = "muted";
    }
  }
  const testLine =
    testState === "ok"
      ? `Test: ${testMsg}`
      : testState === "error"
        ? `Test failed: ${testMsg}`
        : "";
  const cls = tone === "ok" ? "text-green" : tone === "error" ? "text-red" : "text-text-3";
  return (
    <div className={`text-xs ${cls}`}>
      {text}
      {testLine && <div>{testLine}</div>}
    </div>
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
