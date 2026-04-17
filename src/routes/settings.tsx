import { useEffect, useState } from "react";
import { useSyncContext } from "~/features/sync/sync-context";
import { useSaveSettings, useSettings } from "~/hooks/use-settings";
import { useStoreRepository } from "~/repositories";
import type { Settings } from "~/schemas";

const THEMES = ["light", "system", "dark"] as const;

export function SettingsRoute() {
  const { data: settings, isLoading } = useSettings();
  const save = useSaveSettings();
  const storeRepo = useStoreRepository();
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
    <section className="flex flex-col gap-6 pb-12">
      <header>
        <h2 className="font-pixel text-sm text-text">SETTINGS</h2>
        <p className="mt-1 text-xs text-text-3">
          Backend: <code>{storeRepo.id}</code>
          {storeRepo.capabilities.syncsRemotely ? " (syncs remotely)" : ""}
        </p>
      </header>

      <ThemeSection theme={settings.theme} onChange={(theme) => patch({ theme })} />

      <ClaudeKeySection
        claudeApiKey={settings.claudeApiKey ?? ""}
        onChange={(claudeApiKey) => patch({ claudeApiKey: claudeApiKey || undefined })}
      />

      <GitHubSyncSection sync={sync} settings={settings} onPatch={patch} />
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
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-pixel text-xs text-text-2">THEME</legend>
      <div className="flex gap-2">
        {THEMES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            className={`min-h-11 flex-1 rounded-card border px-3 text-xs uppercase ${
              theme === t ? "border-gold bg-card text-text" : "border-border bg-card-2 text-text-2"
            }`}
          >
            {t}
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

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-pixel text-xs text-text-2">
        CLAUDE API KEY <span className="text-text-3">(for OCR scan)</span>
      </legend>
      <input
        type="password"
        aria-label="Claude API key"
        placeholder="sk-ant-…"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="min-h-11 rounded-card border border-border bg-card px-3 text-sm text-text"
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

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-pixel text-xs text-text-2">
        GITHUB SYNC <span className="text-text-3">(cross-device)</span>
      </legend>
      <input
        type="password"
        aria-label="GitHub personal access token"
        placeholder="ghp_… or github_pat_…"
        value={tokenDraft}
        onChange={(e) => setTokenDraft(e.target.value)}
        className="min-h-11 rounded-card border border-border bg-card px-3 text-sm text-text"
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
              disabled={sync.status.syncing}
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
      <SyncStatusLine sync={sync} testState={testState} testMsg={testMsg} />
    </fieldset>
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

function timeSince(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
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
