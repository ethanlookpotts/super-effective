import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests are currently PARKED — the legacy `e2e/*.spec.ts` files target the
 * vanilla-JS DOM and will fail until Phase 8 of the rewrite re-ports them.
 * This config is kept so CI / local runs find the Vite preview server once
 * tests are reenabled. See `plan/react-tailwind-rewrite/03-phases.md`.
 */
export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["**/*.md", "**/specs/**"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:4173/super-effective/",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run preview -- --port=4173 --strictPort",
    url: "http://localhost:4173/super-effective/",
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
