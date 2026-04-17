import { SEED_STORE, expect, test } from "./fixtures";

// Helper: navigate to Settings page
async function goSettings(page) {
  await page.getByLabel("Open menu").click();
  await page.getByRole("button", { name: "SETTINGS" }).click();
}

// Mock gist data matching the seed store
const MOCK_GIST_ID = "gist-abc-123";
const MOCK_TOKEN = "ghp_fake_token_for_testing";

function mockGistPayload(storeOverride?: object) {
  const store = storeOverride || JSON.parse(SEED_STORE);
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

// ── Settings UI tests ──

test("GitHub Sync section visible in settings", async ({ page }) => {
  await goSettings(page);
  await expect(page.getByText("GITHUB SYNC")).toBeVisible();
  await expect(page.getByLabel("GitHub personal access token")).toBeVisible();
  await expect(page.getByLabel("Test GitHub token")).toBeVisible();
  await expect(page.getByLabel("Save GitHub token")).toBeVisible();
});

test("no token shows NOT SET UP badge", async ({ page }) => {
  await page.evaluate(() => localStorage.removeItem("se_github_token"));
  await goSettings(page);
  await expect(page.getByLabel("Sync status: not set")).toBeVisible();
});

test("saving a token shows CONNECTED badge", async ({ page }) => {
  // Mock the gist API so push after save doesn't fail
  await page.route("**/api.github.com/gists**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: MOCK_GIST_ID, files: {} }),
    });
  });

  await goSettings(page);
  await page.getByLabel("GitHub personal access token").fill(MOCK_TOKEN);
  await page.getByLabel("Save GitHub token").click();
  await expect(page.getByLabel("Sync status: connected")).toBeVisible();
});

test("test token validates gist scope", async ({ page }) => {
  await page.route("**/api.github.com/gists**", (route) => {
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
  await page.getByLabel("GitHub personal access token").fill(MOCK_TOKEN);
  await page.getByLabel("Test GitHub token").click();
  await expect(page.getByText("TOKEN VALID")).toBeVisible();
});

test("test token shows error for missing gist scope", async ({ page }) => {
  await page.route("**/api.github.com/gists**", (route) => {
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
  await page.getByLabel("GitHub personal access token").fill(MOCK_TOKEN);
  await page.getByLabel("Test GitHub token").click();
  await expect(page.getByText('missing "gist" scope')).toBeVisible();
});

test("forget token clears back to NOT SET UP", async ({ page }) => {
  // Seed a token and gist id
  await page.evaluate((token: string) => {
    localStorage.setItem("se_github_token", token);
    localStorage.setItem("se_gist_id", "gist-xyz");
  }, MOCK_TOKEN);

  // Mock any gist API calls
  await page.route("**/api.github.com/gists**", (route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  await page.reload();
  await page.getByLabel("Search Pokémon").waitFor({ state: "visible" });
  await goSettings(page);
  await page.getByLabel("Forget GitHub token").click();
  // Accept the confirm dialog
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Forget GitHub token").click();
  await expect(page.getByLabel("Sync status: not set")).toBeVisible();
});

// ── Sync Now button ──

test("sync now button triggers pull", async ({ page }) => {
  const payload = mockGistPayload();
  const gistResp = mockGistResponse(payload);
  let pullCalled = false;

  // Seed token + gist id
  await page.evaluate(
    ({ token, gistId }) => {
      localStorage.setItem("se_github_token", token);
      localStorage.setItem("se_gist_id", gistId);
    },
    { token: MOCK_TOKEN, gistId: MOCK_GIST_ID },
  );

  await page.route("**/api.github.com/gists/**", (route) => {
    pullCalled = true;
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(gistResp) });
  });

  await page.reload();
  await page.getByLabel("Search Pokémon").waitFor({ state: "visible" });
  await goSettings(page);
  await page.getByLabel("Sync now").click();
  await expect(page.getByText("Sync complete")).toBeVisible();
  expect(pullCalled).toBe(true);
});

// ── Conflict modal ──

test("conflict modal appears when both local and remote changed", async ({ page }) => {
  // Don't set token before reload — set it after so initial load() doesn't pull
  const remoteStore = {
    playthroughs: [
      { id: "seed-001", name: "CLOUD RUN", gameId: "frlg-fr", party: [], pc: [], recents: [] },
    ],
    activePtId: "seed-001",
  };
  const remotePayload = { version: 1, lastModified: new Date().toISOString(), store: remoteStore };
  const gistResp = mockGistResponse(remotePayload);

  await page.route(`**/api.github.com/gists/${MOCK_GIST_ID}`, (route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(gistResp) });
  });

  // After page has loaded (no token yet, so no initial pull), inject token + stale sync timestamp
  await page.evaluate(
    ({ token, gistId }) => {
      localStorage.setItem("se_github_token", token);
      localStorage.setItem("se_gist_id", gistId);
      localStorage.setItem("se_last_synced", "2020-01-01T00:00:00.000Z");
    },
    { token: MOCK_TOKEN, gistId: MOCK_GIST_ID },
  );

  // Make a local change (sets _lastLocalChange > _lastSynced)
  await page.evaluate(() => DataManager.save());
  // Pull — remote lastModified > lastSynced AND local changed > lastSynced → conflict
  await page.evaluate(() => DataManager.pull());

  await expect(page.getByText("SYNC CONFLICT")).toBeVisible();
  await expect(page.getByText("CLOUD RUN")).toBeVisible();
  await expect(page.getByLabel("Keep this device data")).toBeVisible();
  await expect(page.getByLabel("Keep cloud data")).toBeVisible();
});

test('choosing "Use Cloud" in conflict applies remote data', async ({ page }) => {
  const remoteStore = {
    playthroughs: [
      { id: "seed-001", name: "FROM CLOUD", gameId: "frlg-fr", party: [], pc: [], recents: [] },
    ],
    activePtId: "seed-001",
  };
  const remotePayload = { version: 1, lastModified: new Date().toISOString(), store: remoteStore };
  const gistResp = mockGistResponse(remotePayload);

  await page.route(`**/api.github.com/gists/${MOCK_GIST_ID}`, (route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(gistResp) });
  });

  // Set token after load to avoid initial pull
  await page.evaluate(
    ({ token, gistId }) => {
      localStorage.setItem("se_github_token", token);
      localStorage.setItem("se_gist_id", gistId);
      localStorage.setItem("se_last_synced", "2020-01-01T00:00:00.000Z");
    },
    { token: MOCK_TOKEN, gistId: MOCK_GIST_ID },
  );

  await page.evaluate(() => DataManager.save());
  await page.evaluate(() => DataManager.pull());

  await expect(page.getByText("SYNC CONFLICT")).toBeVisible();
  await page.getByLabel("Keep cloud data").click();

  await expect(page.getByText("SYNC CONFLICT")).not.toBeVisible();
  await expect(page.getByText("Synced from cloud")).toBeVisible();
});

test('choosing "Keep Local" in conflict pushes local data', async ({ page }) => {
  const remoteStore = {
    playthroughs: [
      { id: "seed-001", name: "CLOUD RUN", gameId: "frlg-fr", party: [], pc: [], recents: [] },
    ],
    activePtId: "seed-001",
  };
  const remotePayload = { version: 1, lastModified: new Date().toISOString(), store: remoteStore };
  const gistResp = mockGistResponse(remotePayload);
  let pushCalled = false;

  await page.route(`**/api.github.com/gists/${MOCK_GIST_ID}`, (route) => {
    if (route.request().method() === "PATCH") {
      pushCalled = true;
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(gistResp),
      });
    } else {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(gistResp),
      });
    }
  });

  // Set token after load to avoid initial pull
  await page.evaluate(
    ({ token, gistId }) => {
      localStorage.setItem("se_github_token", token);
      localStorage.setItem("se_gist_id", gistId);
      localStorage.setItem("se_last_synced", "2020-01-01T00:00:00.000Z");
    },
    { token: MOCK_TOKEN, gistId: MOCK_GIST_ID },
  );

  await page.evaluate(() => DataManager.save());
  await page.evaluate(() => DataManager.pull());

  await expect(page.getByText("SYNC CONFLICT")).toBeVisible();
  await page.getByLabel("Keep this device data").click();

  await expect(page.getByText("SYNC CONFLICT")).not.toBeVisible();
  await expect(page.getByText("Keeping local data")).toBeVisible();
  await page.waitForTimeout(500);
  expect(pushCalled).toBe(true);
});
