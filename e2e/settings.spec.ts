import { expect, test } from "./fixtures";

test("settings accessible from drawer", async ({ page }) => {
  await page.getByLabel("Open menu").click();
  await page.getByRole("link", { name: "SETTINGS" }).click();
  await expect(page.getByText("⚙ SETTINGS")).toBeVisible();
});

test("API key input and action buttons are present", async ({ page }) => {
  await page.getByLabel("Open menu").click();
  await page.getByRole("link", { name: "SETTINGS" }).click();
  await expect(page.getByLabel("Claude API key")).toBeVisible();
  await expect(page.getByLabel("Test API key")).toBeVisible();
  await expect(page.getByLabel("Save API key")).toBeVisible();
});

test("no key set shows NO KEY SET badge", async ({ page }) => {
  await page.evaluate(() => localStorage.removeItem("se_claude_key"));
  await page.getByLabel("Open menu").click();
  await page.getByRole("link", { name: "SETTINGS" }).click();
  await expect(page.getByLabel("API key status: not set")).toBeVisible();
});

test("saving a key shows KEY ACTIVE badge", async ({ page }) => {
  await page.evaluate(() => localStorage.removeItem("se_claude_key"));
  await page.getByLabel("Open menu").click();
  await page.getByRole("link", { name: "SETTINGS" }).click();
  await page.getByLabel("Claude API key").fill("sk-ant-fake-key-for-testing");
  await page.getByLabel("Save API key").click();
  await expect(page.getByLabel("API key status: active")).toBeVisible();
});

test("forget key clears back to NO KEY SET", async ({ page }) => {
  await page.evaluate(() => localStorage.setItem("se_claude_key", "sk-ant-fake"));
  await page.getByLabel("Open menu").click();
  await page.getByRole("link", { name: "SETTINGS" }).click();
  await page.getByLabel("Forget API key").click();
  await expect(page.getByLabel("API key status: not set")).toBeVisible();
  await expect(page.getByLabel("Forget API key")).not.toBeVisible();
});

test("scan button with no key navigates to settings", async ({ page }) => {
  await page.evaluate(() => localStorage.removeItem("se_claude_key"));
  await page.getByLabel("Open menu").click();
  await page.getByRole("link", { name: "PARTY" }).click();
  await page.getByRole("button", { name: "Add Pokémon to party" }).first().click();
  await page.getByLabel("Scan game screens").click();
  await expect(page.getByText("⚙ SETTINGS")).toBeVisible();
});
