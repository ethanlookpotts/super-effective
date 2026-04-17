/**
 * Evolution data for Gen I species in FRLG.
 *
 * `EVOS[n].from` is the dex number of the pre-evolution (if any).
 * `EVOS[n].into` is the list of evolutions with their condition string.
 * Only Pokémon that participate in an evolution are listed; final-stage
 * species only carry `from`.
 *
 * DO NOT add Gen II+ evolutions (Blissey, Steelix, Scizor, etc.) — this is
 * the strict FRLG scope.
 */

/** One branch of an evolution: target dex number `n` and condition string `c`. */
export interface EvoLink {
  readonly n: number;
  readonly c: string;
}

/** Evolution entry for a single dex number. */
export interface EvoEntry {
  /** Dex number of the pre-evolution, if any. */
  readonly from?: number;
  /** Evolutions this species can branch into, if any. */
  readonly into?: readonly EvoLink[];
}

export const EVOS: Readonly<Record<number, EvoEntry>> = {
  1: { into: [{ n: 2, c: "Lv.16" }] },
  2: { from: 1, into: [{ n: 3, c: "Lv.32" }] },
  3: { from: 2 },
  4: { into: [{ n: 5, c: "Lv.16" }] },
  5: { from: 4, into: [{ n: 6, c: "Lv.36" }] },
  6: { from: 5 },
  7: { into: [{ n: 8, c: "Lv.16" }] },
  8: { from: 7, into: [{ n: 9, c: "Lv.36" }] },
  9: { from: 8 },
  10: { into: [{ n: 11, c: "Lv.7" }] },
  11: { from: 10, into: [{ n: 12, c: "Lv.10" }] },
  12: { from: 11 },
  13: { into: [{ n: 14, c: "Lv.7" }] },
  14: { from: 13, into: [{ n: 15, c: "Lv.10" }] },
  15: { from: 14 },
  16: { into: [{ n: 17, c: "Lv.18" }] },
  17: { from: 16, into: [{ n: 18, c: "Lv.36" }] },
  18: { from: 17 },
  19: { into: [{ n: 20, c: "Lv.20" }] },
  20: { from: 19 },
  21: { into: [{ n: 22, c: "Lv.20" }] },
  22: { from: 21 },
  23: { into: [{ n: 24, c: "Lv.22" }] },
  24: { from: 23 },
  25: { into: [{ n: 26, c: "Thunder Stone" }] },
  26: { from: 25 },
  27: { into: [{ n: 28, c: "Lv.22" }] },
  28: { from: 27 },
  29: { into: [{ n: 30, c: "Lv.16" }] },
  30: { from: 29, into: [{ n: 31, c: "Moon Stone" }] },
  31: { from: 30 },
  32: { into: [{ n: 33, c: "Lv.16" }] },
  33: { from: 32, into: [{ n: 34, c: "Moon Stone" }] },
  34: { from: 33 },
  35: { into: [{ n: 36, c: "Moon Stone" }] },
  36: { from: 35 },
  37: { into: [{ n: 38, c: "Fire Stone" }] },
  38: { from: 37 },
  39: { into: [{ n: 40, c: "Moon Stone" }] },
  40: { from: 39 },
  41: { into: [{ n: 42, c: "Lv.22" }] },
  42: { from: 41 },
  43: { into: [{ n: 44, c: "Lv.21" }] },
  44: { from: 43, into: [{ n: 45, c: "Leaf Stone" }] },
  45: { from: 44 },
  46: { into: [{ n: 47, c: "Lv.24" }] },
  47: { from: 46 },
  48: { into: [{ n: 49, c: "Lv.31" }] },
  49: { from: 48 },
  50: { into: [{ n: 51, c: "Lv.26" }] },
  51: { from: 50 },
  52: { into: [{ n: 53, c: "Lv.28" }] },
  53: { from: 52 },
  54: { into: [{ n: 55, c: "Lv.33" }] },
  55: { from: 54 },
  56: { into: [{ n: 57, c: "Lv.28" }] },
  57: { from: 56 },
  58: { into: [{ n: 59, c: "Fire Stone" }] },
  59: { from: 58 },
  60: { into: [{ n: 61, c: "Lv.25" }] },
  61: { from: 60, into: [{ n: 62, c: "Water Stone" }] },
  62: { from: 61 },
  63: { into: [{ n: 64, c: "Lv.16" }] },
  64: { from: 63, into: [{ n: 65, c: "Trade" }] },
  65: { from: 64 },
  66: { into: [{ n: 67, c: "Lv.28" }] },
  67: { from: 66, into: [{ n: 68, c: "Trade" }] },
  68: { from: 67 },
  69: { into: [{ n: 70, c: "Lv.21" }] },
  70: { from: 69, into: [{ n: 71, c: "Leaf Stone" }] },
  71: { from: 70 },
  72: { into: [{ n: 73, c: "Lv.30" }] },
  73: { from: 72 },
  74: { into: [{ n: 75, c: "Lv.25" }] },
  75: { from: 74, into: [{ n: 76, c: "Trade" }] },
  76: { from: 75 },
  77: { into: [{ n: 78, c: "Lv.40" }] },
  78: { from: 77 },
  79: { into: [{ n: 80, c: "Lv.37" }] },
  80: { from: 79 },
  81: { into: [{ n: 82, c: "Lv.30" }] },
  82: { from: 81 },
  84: { into: [{ n: 85, c: "Lv.31" }] },
  85: { from: 84 },
  86: { into: [{ n: 87, c: "Lv.34" }] },
  87: { from: 86 },
  88: { into: [{ n: 89, c: "Lv.38" }] },
  89: { from: 88 },
  90: { into: [{ n: 91, c: "Water Stone" }] },
  91: { from: 90 },
  92: { into: [{ n: 93, c: "Lv.25" }] },
  93: { from: 92, into: [{ n: 94, c: "Trade" }] },
  94: { from: 93 },
  96: { into: [{ n: 97, c: "Lv.26" }] },
  97: { from: 96 },
  98: { into: [{ n: 99, c: "Lv.28" }] },
  99: { from: 98 },
  100: { into: [{ n: 101, c: "Lv.30" }] },
  101: { from: 100 },
  102: { into: [{ n: 103, c: "Leaf Stone" }] },
  103: { from: 102 },
  104: { into: [{ n: 105, c: "Lv.28" }] },
  105: { from: 104 },
  109: { into: [{ n: 110, c: "Lv.35" }] },
  110: { from: 109 },
  111: { into: [{ n: 112, c: "Lv.42" }] },
  112: { from: 111 },
  116: { into: [{ n: 117, c: "Lv.32" }] },
  117: { from: 116 },
  118: { into: [{ n: 119, c: "Lv.33" }] },
  119: { from: 118 },
  120: { into: [{ n: 121, c: "Water Stone" }] },
  121: { from: 120 },
  129: { into: [{ n: 130, c: "Lv.20" }] },
  130: { from: 129 },
  133: {
    into: [
      { n: 134, c: "Water Stone" },
      { n: 135, c: "Thunder Stone" },
      { n: 136, c: "Fire Stone" },
    ],
  },
  134: { from: 133 },
  135: { from: 133 },
  136: { from: 133 },
  138: { into: [{ n: 139, c: "Lv.40" }] },
  139: { from: 138 },
  140: { into: [{ n: 141, c: "Lv.40" }] },
  141: { from: 140 },
  147: { into: [{ n: 148, c: "Lv.30" }] },
  148: { from: 147, into: [{ n: 149, c: "Lv.55" }] },
  149: { from: 148 },
};

/**
 * Return the full evolution chain for a dex number as a flat list of dex
 * numbers: pre-evolutions first, then the queried species, then every
 * evolution reachable from the root.
 *
 * For unevolved/standalone species not present in `EVOS` (e.g. Tauros, Mew),
 * the chain is just `[dexNum]`.
 *
 * Branching chains (e.g. Eevee) traverse every branch in the order declared
 * by `EVOS[root].into`, so `getEvoChain(133)` yields
 * `[133, 134, 135, 136]`.
 */
export function getEvoChain(dexNum: number): readonly number[] {
  // Walk backwards to the root of the chain.
  let root = dexNum;
  while (EVOS[root]?.from !== undefined) {
    const prev = EVOS[root]?.from;
    if (prev === undefined) break;
    root = prev;
  }

  const chain: number[] = [];
  const walk = (n: number): void => {
    chain.push(n);
    const into = EVOS[n]?.into;
    if (!into) return;
    for (const link of into) {
      walk(link.n);
    }
  };
  walk(root);
  return chain;
}
