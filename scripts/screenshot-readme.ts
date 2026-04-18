/**
 * Regenerate the 4 README screenshots against the React + Tailwind build.
 *
 * Usage:
 *   npm run build
 *   npm run screenshots
 *
 * Spawns `vite preview` on a fixed port, seeds a full-party playthrough into
 * `se_v1`, walks the app, and overwrites the tracked PNGs under `screenshots/`.
 */
import { type ChildProcess, spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { type Page, chromium } from "@playwright/test";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const OUT_DIR = resolve(ROOT, "screenshots");
const PORT = 4174;
const BASE = `http://localhost:${PORT}/super-effective/`;

const SEED_PT_ID = "00000000-0000-4000-8000-000000000042";

const SEED_STORE = {
  playthroughs: [
    {
      id: SEED_PT_ID,
      name: "Kanto Run",
      gameId: "frlg-fr",
      party: [
        {
          n: 3,
          name: "Venusaur",
          types: ["Grass", "Poison"],
          level: 40,
          moves: [
            { name: "Giga Drain", type: "Grass", cat: "spec" },
            { name: "Sludge Bomb", type: "Poison", cat: "spec" },
            { name: "Sleep Powder", type: "Grass", cat: "stat" },
            { name: "Leech Seed", type: "Grass", cat: "stat" },
          ],
        },
        {
          n: 94,
          name: "Gengar",
          types: ["Ghost", "Poison"],
          level: 38,
          moves: [
            { name: "Shadow Ball", type: "Ghost", cat: "spec" },
            { name: "Psychic", type: "Psychic", cat: "spec" },
            { name: "Thunderbolt", type: "Electric", cat: "spec" },
            { name: "Hypnosis", type: "Psychic", cat: "stat" },
          ],
        },
        {
          n: 130,
          name: "Gyarados",
          types: ["Water", "Flying"],
          level: 39,
          moves: [
            { name: "Surf", type: "Water", cat: "spec" },
            { name: "Dragon Dance", type: "Dragon", cat: "stat" },
            { name: "Earthquake", type: "Ground", cat: "phys" },
            { name: "Return", type: "Normal", cat: "phys" },
          ],
        },
        {
          n: 59,
          name: "Arcanine",
          types: ["Fire"],
          level: 40,
          moves: [
            { name: "Flamethrower", type: "Fire", cat: "spec" },
            { name: "Extreme Speed", type: "Normal", cat: "phys" },
            { name: "Crunch", type: "Dark", cat: "spec" },
            { name: "Iron Tail", type: "Steel", cat: "phys" },
          ],
        },
        {
          n: 65,
          name: "Alakazam",
          types: ["Psychic"],
          level: 39,
          moves: [
            { name: "Psychic", type: "Psychic", cat: "spec" },
            { name: "Shadow Ball", type: "Ghost", cat: "spec" },
            { name: "Calm Mind", type: "Psychic", cat: "stat" },
            { name: "Recover", type: "Normal", cat: "stat" },
          ],
        },
        {
          n: 76,
          name: "Golem",
          types: ["Rock", "Ground"],
          level: 38,
          moves: [
            { name: "Earthquake", type: "Ground", cat: "phys" },
            { name: "Rock Slide", type: "Rock", cat: "phys" },
            { name: "Brick Break", type: "Fighting", cat: "phys" },
            { name: "Double-Edge", type: "Normal", cat: "phys" },
          ],
        },
      ],
      pc: [],
      recents: [
        { n: 121, name: "Starmie", types: ["Water", "Psychic"] },
        { n: 94, name: "Gengar", types: ["Ghost", "Poison"] },
        { n: 3, name: "Venusaur", types: ["Grass", "Poison"] },
      ],
      rivalStarter: "bulbasaur",
      tmInventory: {},
    },
  ],
  activePtId: SEED_PT_ID,
};

const SEED_SETTINGS = { theme: "light" };

async function waitForServer(url: string, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok || res.status === 304) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`preview server never came up at ${url}`);
}

function startPreview(): ChildProcess {
  // Invoke vite directly (not via `npm run preview`) so we control a single
  // child PID and can SIGTERM it cleanly on exit.
  const bin = resolve(ROOT, "node_modules/.bin/vite");
  const child = spawn(bin, ["preview", `--port=${PORT}`, "--strictPort"], {
    cwd: ROOT,
    stdio: "pipe",
    env: { ...process.env, BROWSER: "none" },
  });
  child.stdout?.on("data", (buf) => process.stdout.write(`[preview] ${buf}`));
  child.stderr?.on("data", (buf) => process.stderr.write(`[preview] ${buf}`));
  return child;
}

async function seed(page: Page) {
  await page.goto(BASE);
  await page.evaluate(
    ({ store, settings }) => {
      localStorage.clear();
      localStorage.setItem("se_v1", JSON.stringify(store));
      localStorage.setItem("se_settings_v1", JSON.stringify(settings));
      document.documentElement.dataset.theme = "light";
    },
    { store: SEED_STORE, settings: SEED_SETTINGS },
  );
  await page.reload();
  await page.getByLabel("Search Pokémon").waitFor({ state: "visible" });
  // Re-assert light theme after React mounts — settings hook may reset it.
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "light";
  });
}

async function resetScroll(page: Page) {
  // The shell isn't height-capped, so long routes let the window scroll.
  // Reset between shots so each screenshot starts from a known baseline.
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
}

async function takeSearchPartyMatchup(page: Page) {
  // Starmie's dex number is 121; navigate directly via URL param so the shot
  // is deterministic (no dropdown timing).
  await page.goto(`${BASE}#/search?n=121`);
  await page.getByRole("heading", { name: "Starmie" }).waitFor({ state: "visible" });
  await resetScroll(page);
  // Anchor the "MY PARTY — WHO TO USE" heading near the top of the viewport
  // so the Venusaur + Gengar GREAT rows are framed in the screenshot.
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll("h3"));
    const hit = headings.find((h) => h.textContent?.trim() === "MY PARTY — WHO TO USE");
    if (hit) {
      hit.scrollIntoView({ block: "start" });
      window.scrollBy(0, -70); // peek the ADD TO PARTY button above
    }
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: resolve(OUT_DIR, "search-party-matchup.png") });
}

async function takeSearchGengarDetail(page: Page) {
  await page.goto(`${BASE}#/search?n=94`);
  await page.getByRole("heading", { name: "Gengar" }).waitFor({ state: "visible" });
  await resetScroll(page);
  await page.waitForTimeout(250);
  await page.screenshot({ path: resolve(OUT_DIR, "search-gengar-detail.png") });
}

async function takeGymsMistyExpanded(page: Page) {
  await page.goto(`${BASE}#/gyms`);
  await page.getByRole("region", { name: "Gyms page" }).waitFor({ state: "visible" });
  await resetScroll(page);
  const misty = page.getByRole("button", { name: "Expand Misty" });
  await misty.scrollIntoViewIfNeeded();
  await misty.click();
  // After expanding, anchor Misty's name near the top so the Staryu +
  // Starmie roster and tip are visible beneath it.
  await misty.evaluate((el: HTMLElement) => {
    el.scrollIntoView({ block: "start" });
    window.scrollBy(0, -60); // peek the card above for context
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: resolve(OUT_DIR, "gyms-misty-expanded.png") });
}

async function takeWhereAmISafari(page: Page) {
  await page.goto(`${BASE}#/where`);
  await page.getByRole("region", { name: "Where Am I page" }).waitFor({ state: "visible" });
  await page.getByLabel("Filter locations").fill("safari");
  await resetScroll(page);
  await page.waitForTimeout(300);
  await page.screenshot({ path: resolve(OUT_DIR, "where-am-i-safari.png") });
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const preview = startPreview();
  try {
    await waitForServer(BASE);

    const browser = await chromium.launch();
    try {
      const ctx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        colorScheme: "light",
      });
      const page = await ctx.newPage();

      await seed(page);
      await takeSearchPartyMatchup(page);
      await takeSearchGengarDetail(page);
      await takeGymsMistyExpanded(page);
      await takeWhereAmISafari(page);

      await ctx.close();
    } finally {
      await browser.close();
    }
    console.warn("README screenshots regenerated ->", OUT_DIR);
  } finally {
    preview.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
