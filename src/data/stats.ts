import type { PartyMember } from "~/schemas";

/**
 * Gen III stat calculation helpers.
 * Natures, stat formulas, and damage estimation for Gen III FRLG.
 */

export type StatKey = "atk" | "def" | "spa" | "spd" | "spe";

/** [hp, atk, def, spatk, spdef, spe] — base stat spread per dex number. */
export type BaseStats = readonly [number, number, number, number, number, number];

/** Base stats keyed by dex number. Populated by the data loader. */
export const STATS: Readonly<Record<number, BaseStats>> = {};

/**
 * NATURES — Gen III
 * [boostStat, reduceStat]: null indicates a neutral nature.
 */
export const NATURES: Readonly<Record<string, readonly [StatKey | null, StatKey | null]>> = {
  Hardy: [null, null],
  Lonely: ["atk", "def"],
  Brave: ["atk", "spe"],
  Adamant: ["atk", "spa"],
  Naughty: ["atk", "spd"],
  Bold: ["def", "atk"],
  Docile: [null, null],
  Relaxed: ["def", "spe"],
  Impish: ["def", "spa"],
  Lax: ["def", "spd"],
  Timid: ["spe", "atk"],
  Hasty: ["spe", "def"],
  Serious: [null, null],
  Jolly: ["spe", "spa"],
  Naive: ["spe", "spd"],
  Modest: ["spa", "atk"],
  Mild: ["spa", "def"],
  Quiet: ["spa", "spe"],
  Bashful: [null, null],
  Rash: ["spa", "spd"],
  Calm: ["spd", "atk"],
  Gentle: ["spd", "def"],
  Sassy: ["spd", "spe"],
  Careful: ["spd", "spa"],
  Quirky: [null, null],
};

export const NATURE_NAMES: readonly string[] = Object.keys(NATURES).sort();

export function natureMult(nature: string | null | undefined, stat: StatKey): number {
  if (!nature) return 1;
  const entry = NATURES[nature];
  if (!entry) return 1;
  const [boost, reduce] = entry;
  if (boost === stat) return 1.1;
  if (reduce === stat) return 0.9;
  return 1;
}

/** Summary string for the combat-relevant stats affected by a nature (e.g. "+ATK −SpA"). */
export function natureSummary(nature: string | null | undefined): string {
  if (!nature) return "";
  const entry = NATURES[nature];
  if (!entry) return "";
  const [boost, reduce] = entry;
  const labels: Record<StatKey, string> = {
    atk: "ATK",
    def: "DEF",
    spa: "SpA",
    spd: "SpD",
    spe: "SPE",
  };
  if (!boost && !reduce) return "Neutral";
  const parts: string[] = [];
  if (boost) parts.push(`+${labels[boost]}`);
  if (reduce) parts.push(`\u2212${labels[reduce]}`);
  return parts.join(" ");
}

/** Gen III stat formula (non-HP stats). */
export function computeStat(
  base: number,
  iv: number,
  ev: number,
  level: number,
  mult: number,
): number {
  const ivSafe = iv || 0;
  const evSafe = ev || 0;
  const levelSafe = level || 50;
  const multSafe = mult || 1;
  return Math.floor(
    Math.floor(((2 * base + ivSafe + Math.floor(evSafe / 4)) * levelSafe) / 100 + 5) * multSafe,
  );
}

/** Gen III HP formula. */
export function computeHP(base: number, iv: number, ev: number, level: number): number {
  const ivSafe = iv || 0;
  const evSafe = ev || 0;
  const levelSafe = level || 50;
  return Math.floor(
    ((2 * base + ivSafe + Math.floor(evSafe / 4)) * levelSafe) / 100 + levelSafe + 10,
  );
}

export interface AttackerStats {
  atk: number;
  spa: number;
  spe: number;
}

/**
 * Compute Atk, SpA, Spe for a party member.
 * Uses nature if provided; assumes 15 IVs / 0 EVs (in-game values not accessible).
 * Returns null when base stats are unknown for the dex number.
 */
export function computeAttackerStats(
  pm: Pick<PartyMember, "n" | "level"> & {
    nature?: string | null;
    advStats?: { nature?: string | null } | null;
  },
): AttackerStats | null {
  const base = STATS[pm.n];
  if (!base) return null;
  const lv = typeof pm.level === "number" ? pm.level : Number.parseInt(`${pm.level ?? ""}`) || 50;
  const nat = pm.nature ?? pm.advStats?.nature ?? null;
  return {
    atk: computeStat(base[1], 15, 0, lv, natureMult(nat, "atk")),
    spa: computeStat(base[3], 15, 0, lv, natureMult(nat, "spa")),
    spe: computeStat(base[5], 15, 0, lv, natureMult(nat, "spe")),
  };
}

/** Estimate a single enemy stat (non-HP): 0 EVs, 15 IVs, neutral nature. */
export function estimateEnemyStat(baseVal: number, level: number): number {
  return computeStat(baseVal, 15, 0, level || 50, 1);
}

/** Estimate enemy HP: 0 EVs, 15 IVs. */
export function estimateEnemyHP(baseHP: number, level: number): number {
  return computeHP(baseHP, 15, 0, level || 50);
}

/**
 * Damage range as % of enemy HP: [minPct, maxPct].
 * `eff` is the combined type-effectiveness × STAB multiplier.
 * Returns null for status moves (power=0) or immune matchups (eff=0).
 */
export function damageRangePct(
  atkLevel: number,
  atkStat: number,
  defStat: number,
  defHP: number,
  power: number,
  eff: number,
): readonly [number, number] | null {
  if (!power || power <= 0 || !eff || eff === 0) return null;
  const lf = Math.floor((2 * atkLevel) / 5 + 2);
  const raw = Math.floor((lf * power * atkStat) / defStat / 50) + 2;
  const withEff = Math.floor(raw * eff);
  const minDmg = Math.floor((withEff * 217) / 255);
  const maxDmg = withEff;
  return [Math.floor((minDmg / defHP) * 100), Math.floor((maxDmg / defHP) * 100)];
}
