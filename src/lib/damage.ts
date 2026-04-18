import { type AbilityMod, getAbilityMod } from "~/data/abilities";
import { MOVE_DATA, type MoveStats } from "~/data/moves";
import { PHYS, dmult, gm } from "~/data/types";
import type { TypeName } from "~/schemas";

/**
 * Apply the defender's ability modifier on top of the raw type multiplier.
 * Pure — mirrors the vanilla `applyAbilityMod` helper.
 */
export function applyAbilityMod(raw: number, atkType: TypeName, defDex: number): number {
  const mod = getAbilityMod(String(defDex));
  if (!mod) return raw;
  if (mod.immune?.includes(atkType)) return 0;
  const resist = mod.resist?.[atkType];
  if (resist !== undefined) return raw * resist;
  return raw;
}

export interface AbilityStep {
  name: string;
  multi: boolean;
  kind: "immune" | "resist" | "noop";
  multiplier: number;
  before: number;
  after: number;
}

export interface MatchupBreakdown {
  attackerType: TypeName;
  defenderDex: number;
  defenderName: string;
  defenderTypes: readonly TypeName[];
  typeRows: readonly { defType: TypeName; mult: number }[];
  typeProduct: number;
  ability: AbilityStep | null;
  final: number;
}

export interface MoveBreakdown extends MatchupBreakdown {
  moveName: string;
  pow: number | null;
  acc: number | null;
  effNote: string | null;
  phys: boolean;
  attackerName: string;
  attackerTypes: readonly TypeName[];
  stab: boolean;
  finalWithStab: number;
}

function buildAbilityStep(mod: AbilityMod, atkType: TypeName, before: number): AbilityStep | null {
  if (mod.immune?.includes(atkType)) {
    return {
      name: mod.name,
      multi: !!mod.multi,
      kind: "immune",
      multiplier: 0,
      before,
      after: 0,
    };
  }
  const resist = mod.resist?.[atkType];
  if (resist !== undefined) {
    return {
      name: mod.name,
      multi: !!mod.multi,
      kind: "resist",
      multiplier: resist,
      before,
      after: before * resist,
    };
  }
  return {
    name: mod.name,
    multi: !!mod.multi,
    kind: "noop",
    multiplier: 1,
    before,
    after: before,
  };
}

/** Pure breakdown of a single attacker-type vs defender matchup. */
export function matchupBreakdown(
  atkType: TypeName,
  defender: { n: number; name: string; types: readonly TypeName[] },
): MatchupBreakdown {
  const typeRows = defender.types.map((defType) => ({
    defType,
    mult: gm(atkType, defType),
  }));
  const typeProduct = dmult(atkType, defender.types);
  const mod = getAbilityMod(String(defender.n));
  const ability = mod ? buildAbilityStep(mod, atkType, typeProduct) : null;
  const final = ability && ability.kind !== "noop" ? ability.after : typeProduct;
  return {
    attackerType: atkType,
    defenderDex: defender.n,
    defenderName: defender.name,
    defenderTypes: defender.types,
    typeRows,
    typeProduct,
    ability,
    final,
  };
}

/** Pure breakdown of a specific move from an attacker vs a defender (adds STAB + move meta). */
export function moveBreakdown(
  moveName: string,
  moveType: TypeName,
  defender: { n: number; name: string; types: readonly TypeName[] },
  attacker: { n: number; name: string; types: readonly TypeName[] },
): MoveBreakdown {
  const base = matchupBreakdown(moveType, defender);
  const stab = attacker.types.includes(moveType);
  const finalWithStab = base.final * (stab ? 1.5 : 1);
  const md: MoveStats | undefined = MOVE_DATA[moveName];
  return {
    ...base,
    moveName,
    pow: md ? md[0] : null,
    acc: md ? md[1] : null,
    effNote: md ? md[2] : null,
    phys: PHYS.has(moveType),
    attackerName: attacker.name,
    attackerTypes: attacker.types,
    stab,
    finalWithStab,
  };
}

export function formatMult(m: number): string {
  if (!Number.isFinite(m)) return `${m}×`;
  if (m === 0) return "0×";
  if (Number.isInteger(m)) return `${m}×`;
  return `${m}×`;
}

export function multLabel(m: number): string {
  if (m === 0) return "Immune";
  if (m >= 4) return "Super Effective";
  if (m >= 2) return "Super Effective";
  if (m <= 0.25) return "Barely Resisted";
  if (m < 1) return "Resisted";
  return "Neutral";
}

export type MultClass = "zero" | "good" | "bad" | "neutral";

export function multClass(m: number): MultClass {
  if (m === 0) return "zero";
  if (m >= 2) return "good";
  if (m < 1) return "bad";
  return "neutral";
}
