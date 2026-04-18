import { expect, test } from "./fixtures";

const SETTINGS_KEY = "se_settings_v1";

async function setSettings(page: import("@playwright/test").Page, patch: Record<string, unknown>) {
  await page.evaluate(
    ({ key, patch }) => {
      const raw = localStorage.getItem(key);
      const current = raw ? JSON.parse(raw) : { theme: "system" };
      localStorage.setItem(key, JSON.stringify({ ...current, ...patch }));
    },
    { key: SETTINGS_KEY, patch },
  );
  await page.reload();
  await page.getByLabel("Search Pokémon").waitFor({ state: "visible" });
}

test("settings accessible from nav", async ({ page }) => {
  await page.getByRole("link", { name: "SETTINGS" }).click();
  await expect(page.getByRole("heading", { name: "SETTINGS" })).toBeVisible();
});

function claudeSection(page: import("@playwright/test").Page) {
  return page.getByRole("group", { name: /CLAUDE API KEY/ });
}

test("API key input and action buttons are present", async ({ page }) => {
  await page.getByRole("link", { name: "SETTINGS" }).click();
  const claude = claudeSection(page);
  await expect(claude.getByLabel("Claude API key")).toBeVisible();
  await expect(claude.getByRole("button", { name: "TEST" })).toBeVisible();
  await expect(claude.getByRole("button", { name: "SAVE" })).toBeVisible();
});

test("no key set shows 'No key set.' status", async ({ page }) => {
  await setSettings(page, { claudeApiKey: undefined });
  await page.getByRole("link", { name: "SETTINGS" }).click();
  await expect(claudeSection(page).getByText("No key set.")).toBeVisible();
});

test("saving a key shows 'Key saved.' status", async ({ page }) => {
  await setSettings(page, { claudeApiKey: undefined });
  await page.getByRole("link", { name: "SETTINGS" }).click();
  const claude = claudeSection(page);
  await claude.getByLabel("Claude API key").fill("sk-ant-fake-key-for-testing");
  await claude.getByRole("button", { name: "SAVE" }).click();
  await expect(claude.getByText("Key saved.")).toBeVisible();
});

test("FORGET button clears back to 'No key set.'", async ({ page }) => {
  await setSettings(page, { claudeApiKey: "sk-ant-fake" });
  await page.getByRole("link", { name: "SETTINGS" }).click();
  const claude = claudeSection(page);
  await claude.getByRole("button", { name: "FORGET" }).click();
  await expect(claude.getByText("No key set.")).toBeVisible();
  await expect(claude.getByRole("button", { name: "FORGET" })).not.toBeVisible();
});

test("scan button with no key navigates to settings", async ({ page }) => {
  await setSettings(page, { claudeApiKey: undefined });
  await page.getByRole("link", { name: "PARTY" }).click();
  await page.getByRole("button", { name: "Add Pokémon" }).first().click();
  await page.getByLabel("Scan game screens").click();
  await expect(page.getByRole("heading", { name: "SETTINGS" })).toBeVisible();
});
