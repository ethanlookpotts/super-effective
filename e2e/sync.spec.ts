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
//
// The React rewrite currently doesn't expose a deterministic hook for forcing
// a conflict from a test — it relies on timestamp comparisons across
// localStorage, the last-modified header, and debounce timers. These
// scenarios are parked until a future pass either adds a test helper on
// `window.__syncTestHelpers__` or refactors `useSync` so the conflict path
// is reachable purely through the UI.

test.fixme("sync now button triggers pull (needs test hook)", async () => {});
test.fixme(
  "conflict modal appears when both local and remote changed (needs test hook)",
  async () => {},
);
test.fixme("choosing USE CLOUD in conflict applies remote data (needs test hook)", async () => {});
test.fixme("choosing KEEP LOCAL in conflict pushes local data (needs test hook)", async () => {});

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
