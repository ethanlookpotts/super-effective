import { POKEMON, type Pokemon } from "~/data/pokemon";
import { NATURE_NAMES } from "~/data/stats";
import type { PartyMove, PartyStats } from "~/schemas";
import { type GameScreenScan, fuzzyMatchMove } from "./vision-client";

export interface GameScreenAggregate {
  poke: Pokemon | null;
  level: number | null;
  nature: string | null;
  ability: string | null;
  item: string | null;
  hasItem: boolean;
  stats: PartyStats | null;
  gender: "M" | "F" | null;
  shiny: boolean | null;
  otName: string | null;
  otId: number | null;
  pokeball: string | null;
  trainerMemo: string | null;
  moves: PartyMove[];
  inputTokens: number;
  outputTokens: number;
}

export const EMPTY_AGGREGATE: GameScreenAggregate = {
  poke: null,
  level: null,
  nature: null,
  ability: null,
  item: null,
  hasItem: false,
  stats: null,
  gender: null,
  shiny: null,
  otName: null,
  otId: null,
  pokeball: null,
  trainerMemo: null,
  moves: [],
  inputTokens: 0,
  outputTokens: 0,
};

function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z]/g, "");
}

function matchPokemon(scan: GameScreenScan): Pokemon | null {
  if (scan.name) {
    const n = normalise(scan.name);
    const byName = POKEMON.find((p) => normalise(p.name) === n);
    if (byName) return byName;
  }
  if (scan.dex) return POKEMON.find((p) => p.n === scan.dex) ?? null;
  return null;
}

function matchNature(raw: string): string | null {
  const n = raw.toLowerCase();
  return NATURE_NAMES.find((name) => name.toLowerCase() === n) ?? null;
}

function hasAnyStat(stats: GameScreenScan["stats"]): boolean {
  return Boolean(stats && Object.keys(stats).length);
}

/**
 * Merge a single scan into the running aggregate: earlier finds win, later
 * scans only fill in blanks. Returns { aggregate, fresh } where `fresh` holds
 * the subset of fields newly discovered from `scan`.
 */
export function mergeGameScreen(
  prev: GameScreenAggregate,
  scan: GameScreenScan,
): { aggregate: GameScreenAggregate; fresh: Partial<GameScreenAggregate> } {
  const fresh: Partial<GameScreenAggregate> = {};
  const next: GameScreenAggregate = {
    ...prev,
    inputTokens: prev.inputTokens + (scan._inputTokens ?? 0),
    outputTokens: prev.outputTokens + (scan._outputTokens ?? 0),
  };

  if (!prev.poke) {
    const poke = matchPokemon(scan);
    if (poke) {
      next.poke = poke;
      fresh.poke = poke;
    }
  }

  if (prev.level == null && scan.level) {
    next.level = scan.level;
    fresh.level = scan.level;
  }

  if (!prev.nature && scan.nature) {
    const nature = matchNature(scan.nature);
    if (nature) {
      next.nature = nature;
      fresh.nature = nature;
    }
  }

  if (!prev.ability && scan.ability) {
    next.ability = scan.ability;
    fresh.ability = scan.ability;
  }

  if (!prev.hasItem && scan.item !== undefined) {
    next.item = scan.item ?? "";
    next.hasItem = true;
    fresh.item = next.item;
    fresh.hasItem = true;
  }

  if (!prev.stats && hasAnyStat(scan.stats)) {
    next.stats = { ...(scan.stats as PartyStats) };
    fresh.stats = next.stats;
  }

  if (!prev.gender && scan.gender) {
    next.gender = scan.gender;
    fresh.gender = scan.gender;
  }

  if (prev.shiny == null && typeof scan.shiny === "boolean") {
    next.shiny = scan.shiny;
    fresh.shiny = scan.shiny;
  }

  if (!prev.otName && scan.ot_name) {
    next.otName = scan.ot_name;
    fresh.otName = scan.ot_name;
  }

  if (prev.otId == null && typeof scan.ot_id === "number") {
    next.otId = scan.ot_id;
    fresh.otId = scan.ot_id;
  }

  if (!prev.pokeball && scan.pokeball) {
    next.pokeball = scan.pokeball;
    fresh.pokeball = scan.pokeball;
  }

  if (!prev.trainerMemo && scan.trainer_memo) {
    next.trainerMemo = scan.trainer_memo;
    fresh.trainerMemo = scan.trainer_memo;
  }

  if (scan.moves?.length) {
    const added: PartyMove[] = [];
    for (const raw of scan.moves) {
      if (next.moves.length + added.length >= 4) break;
      const match = fuzzyMatchMove(raw);
      if (!match) continue;
      if (next.moves.some((m) => m.name === match.name)) continue;
      if (added.some((m) => m.name === match.name)) continue;
      added.push({ name: match.name, type: match.type });
    }
    if (added.length) {
      next.moves = [...next.moves, ...added];
      fresh.moves = added;
    }
  }

  return { aggregate: next, fresh };
}
