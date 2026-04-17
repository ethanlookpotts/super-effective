export interface Game {
  id: string;
  name: string;
  icon: string;
}

export interface GameGeneration {
  gen: "I" | "II" | "III" | "IV" | "V" | "VI" | "VII" | "VIII" | "IX";
  region: string;
  games: readonly Game[];
}

export const GAMES: readonly GameGeneration[] = [
  {
    gen: "III",
    region: "Kanto",
    games: [
      { id: "frlg-fr", name: "FireRed", icon: "🔴" },
      { id: "frlg-lg", name: "LeafGreen", icon: "🟢" },
    ],
  },
] as const;

export const DEFAULT_GAME_ID = "frlg-fr";

export function gameById(id: string): Game | undefined {
  for (const gen of GAMES) {
    const hit = gen.games.find((g) => g.id === id);
    if (hit) return hit;
  }
  return undefined;
}

export function gameName(id: string): string {
  return gameById(id)?.name ?? id;
}
