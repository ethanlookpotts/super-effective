import type { TypeName } from "~/schemas";

/**
 * ABILITY MODS — Gen III FRLG
 * Abilities that alter type effectiveness for specific Pokémon.
 *
 * - `immune`: types this ability grants immunity to.
 * - `resist`: partial map of type → multiplier (e.g. Thick Fat halves Fire/Ice).
 * - `multi`: true when the Pokémon has multiple ability slots, so the effect
 *   is not guaranteed for a given individual.
 *
 * DO NOT regenerate from PokeAPI — curated for Gen III FRLG accuracy.
 */

export interface AbilityMod {
  name: string;
  immune?: readonly TypeName[];
  resist?: Partial<Record<TypeName, number>>;
  multi?: boolean;
}

export const ABILITY_MODS: Readonly<Record<number, AbilityMod>> = {
  // Levitate — immune to Ground
  92: { name: "Levitate", immune: ["Ground"] },
  93: { name: "Levitate", immune: ["Ground"] },
  94: { name: "Levitate", immune: ["Ground"] },
  109: { name: "Levitate", immune: ["Ground"] },
  110: { name: "Levitate", immune: ["Ground"] },
  // Flash Fire — immune to Fire (some have dual ability slots)
  37: { name: "Flash Fire", immune: ["Fire"] },
  38: { name: "Flash Fire", immune: ["Fire"] },
  77: { name: "Flash Fire", immune: ["Fire"], multi: true },
  78: { name: "Flash Fire", immune: ["Fire"], multi: true },
  58: { name: "Flash Fire", immune: ["Fire"], multi: true },
  59: { name: "Flash Fire", immune: ["Fire"], multi: true },
  136: { name: "Flash Fire", immune: ["Fire"] },
  // Water Absorb — immune to Water
  131: { name: "Water Absorb", immune: ["Water"], multi: true },
  134: { name: "Water Absorb", immune: ["Water"] },
  // Volt Absorb — immune to Electric
  135: { name: "Volt Absorb", immune: ["Electric"] },
  // Thick Fat — ½× Fire and Ice
  143: { name: "Thick Fat", resist: { Fire: 0.5, Ice: 0.5 }, multi: true },
  115: { name: "Thick Fat", resist: { Fire: 0.5, Ice: 0.5 }, multi: true },
};

export function getAbilityMod(name: string): AbilityMod | null {
  const key = Number(name);
  if (!Number.isFinite(key)) return null;
  return ABILITY_MODS[key] ?? null;
}
