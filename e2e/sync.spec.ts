import { SEED_STORE, expect, test } from "./fixtures";

async function goSettings(page: import("@playwright/test").Page) {
  await page.getByRole("link", { name: "SETTINGS" }).click();
}

function githubSection(page: import("@playwright/test").Page) {
  return page.getByRole("group", { name: /GITHUB SYNC/ });
}

const MOCK_GIST_ID = "gist-abc-123";
const MOCK_TOKEN = "ghp_fake_token_for_testing";

function mockGistPayload(storeOverride?: object) {
  const store = storeOverride ?? JSON.parse(SEED_STORE);
  return {
    version: 1,
    lastModified: new Date().toISOString(),
    store,
  };
}

function mockGistResponse(payload: object) {
  return {
    id: MOCK_GIST_ID,
    files: {
      "super-effective-sync.json": {
        content: JSON.stringify(payload),
      },
    },
  };
}

async function seedSettings(page: import("@playwright/test").Page, patch: Record<string, unknown>) {
  await page.evaluate((p) => {
    const raw = localStorage.getItem("se_settings_v1");
    const current = raw ? JSON.parse(raw) : { theme: "system" };
    localStorage.setItem("se_settings_v1", JSON.stringify({ ...current, ...p }));
  }, patch);
  await page.reload();
  await page.getByLabel("Search Pokémon").waitFor({ state: "visible" });
}

// ── Settings UI tests ──

test("GitHub Sync section visible in settings", async ({ page }) => {
  await goSettings(page);
  const sync = githubSection(page);
  await expect(sync).toBeVisible();
  await expect(sync.getByLabel("GitHub personal access token")).toBeVisible();
  await expect(sync.getByRole("button", { name: "TEST" })).toBeVisible();
  await expect(sync.getByRole("button", { name: "SAVE" })).toBeVisible();
});

test("no token shows 'No token.' status", async ({ page }) => {
  await goSettings(page);
  await expect(githubSection(page).getByText("No token.")).toBeVisible();
});

test("saving a token transitions out of 'No token.' state", async ({ page }) => {
  await page.route("**/api.github.com/gists*", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: MOCK_GIST_ID, files: {} }),
    });
  });

  await goSettings(page);
  const sync = githubSection(page);
  await sync.getByLabel("GitHub personal access token").fill(MOCK_TOKEN);
  await sync.getByRole("button", { name: "SAVE" }).click();
  // Either "synced <t> ago" if the push succeeded, or "token saved; first sync pending".
  await expect(sync.getByText("No token.")).not.toBeVisible();
});

test("TEST shows 'Token OK' when the gist scope is present", async ({ page }) => {
  await page.route("**/api.github.com/gists*", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "x-oauth-scopes": "gist",
        "access-control-expose-headers": "x-oauth-scopes",
        "access-control-allow-origin": "*",
      },
      body: JSON.stringify([]),
    });
  });

  await goSettings(page);
  const sync = githubSection(page);
  await sync.getByLabel("GitHub personal access token").fill(MOCK_TOKEN);
  await sync.getByRole("button", { name: "TEST" }).click();
  await expect(sync.getByText(/Test:\s*Token OK/)).toBeVisible();
});

test("TEST surfaces an error when the gist scope is missing", async ({ page }) => {
  await page.route("**/api.github.com/gists*", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "x-oauth-scopes": "repo",
        "access-control-expose-headers": "x-oauth-scopes",
        "access-control-allow-origin": "*",
      },
      body: JSON.stringify([]),
    });
  });

  await goSettings(page);
  const sync = githubSection(page);
  await sync.getByLabel("GitHub personal access token").fill(MOCK_TOKEN);
  await sync.getByRole("button", { name: "TEST" }).click();
  await expect(sync.getByText(/missing "gist" scope/)).toBeVisible();
});

test("FORGET clears the token and returns to 'No token.'", async ({ page }) => {
  await seedSettings(page, { githubToken: MOCK_TOKEN, gistId: MOCK_GIST_ID });
  // Mock any gist API calls triggered by the initial pull.
  await page.route("**/api.github.com/gists/**", (route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  await goSettings(page);
  const sync = githubSection(page);
  await sync.getByRole("button", { name: "FORGET" }).click();
  await expect(sync.getByText("No token.")).toBeVisible();
});

// ── SYNC NOW + conflict flows ──
// The gist endpoint is mocked, and `se_last_synced` / `se_last_local_change`
// are seeded in localStorage so `useSync.pull()`'s timestamp comparison is
// deterministic: both-newer → conflict.

const LAST_SYNCED = "2024-01-01T00:00:00.000Z";
const LAST_LOCAL_CHANGE = "2024-01-02T00:00:00.000Z";
const REMOTE_PT_ID = "11111111-2222-4333-8444-555555555555";

async function seedSyncTimestamps(page: import("@playwright/test").Page) {
  await page.evaluate(
    ({ lastSynced, lastLocal }) => {
      localStorage.setItem("se_last_synced", lastSynced);
      localStorage.setItem("se_last_local_change", lastLocal);
    },
    { lastSynced: LAST_SYNCED, lastLocal: LAST_LOCAL_CHANGE },
  );
}

test("sync now button triggers pull", async ({ page }) => {
  let gistGets = 0;
  await page.route("**/api.github.com/gists/**", (route) => {
    if (route.request().method() === "GET") gistGets++;
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        mockGistResponse({
          version: 1,
          // Older than LAST_SYNCED so no change is applied on boot — avoids conflict races.
          lastModified: "2020-01-01T00:00:00.000Z",
          store: JSON.parse(SEED_STORE),
        }),
      ),
    });
  });
  await page.evaluate((ts) => localStorage.setItem("se_last_synced", ts), LAST_SYNCED);
  await seedSettings(page, { githubToken: MOCK_TOKEN, gistId: MOCK_GIST_ID });
  await goSettings(page);
  const before = gistGets;
  await githubSection(page).getByRole("button", { name: "SYNC NOW" }).click();
  await expect.poll(() => gistGets).toBeGreaterThan(before);
});

test("conflict modal appears when both local and remote changed", async ({ page }) => {
  await page.route("**/api.github.com/gists/**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockGistResponse(mockGistPayload())),
    });
  });
  await seedSyncTimestamps(page);
  await seedSettings(page, { githubToken: MOCK_TOKEN, gistId: MOCK_GIST_ID });
  await expect(page.getByRole("dialog", { name: "Sync conflict" })).toBeVisible();
});

test("choosing USE CLOUD in conflict applies remote data", async ({ page }) => {
  const remoteStore = {
    playthroughs: [
      {
        id: REMOTE_PT_ID,
        name: "REMOTE-RUN",
        gameId: "frlg-fr",
        party: [],
        pc: [],
        recents: [],
        rivalStarter: "bulbasaur",
        tmInventory: {},
      },
    ],
    activePtId: REMOTE_PT_ID,
  };
  await page.route("**/api.github.com/gists/**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockGistResponse(mockGistPayload(remoteStore))),
    });
  });
  await seedSyncTimestamps(page);
  await seedSettings(page, { githubToken: MOCK_TOKEN, gistId: MOCK_GIST_ID });
  await page.getByRole("dialog", { name: "Sync conflict" }).waitFor();
  await page.getByRole("button", { name: "USE CLOUD" }).click();
  await expect(page.getByRole("button", { name: /REMOTE-RUN/ })).toBeVisible();
});

test("choosing KEEP LOCAL in conflict pushes local data", async ({ page }) => {
  let patched: string | null = null;
  await page.route("**/api.github.com/gists/**", (route) => {
    const req = route.request();
    if (req.method() === "PATCH") {
      const body = req.postDataJSON() as {
        files?: Record<string, { content?: string } | undefined>;
      };
      patched = body.files?.["super-effective-sync.json"]?.content ?? null;
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: MOCK_GIST_ID }),
      });
      return;
    }
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockGistResponse(mockGistPayload())),
    });
  });
  await seedSyncTimestamps(page);
  await seedSettings(page, { githubToken: MOCK_TOKEN, gistId: MOCK_GIST_ID });
  await page.getByRole("dialog", { name: "Sync conflict" }).waitFor();
  await page.getByRole("button", { name: "KEEP LOCAL" }).click();
  await expect.poll(() => patched).toContain("RUN 1");
});

// SYNC NOW — reachable when a token is saved and no conflict is triggered.
test("SYNC NOW button is visible once a token is saved", async ({ page }) => {
  await page.route("**/api.github.com/gists/**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockGistResponse(mockGistPayload())),
    });
  });
  await seedSettings(page, { githubToken: MOCK_TOKEN, gistId: MOCK_GIST_ID });
  await goSettings(page);
  await expect(githubSection(page).getByRole("button", { name: "SYNC NOW" })).toBeVisible();
});
