const BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

export function spriteUrl(dexNum: number, options?: { shiny?: boolean }): string {
  const shiny = options?.shiny ? "/shiny" : "";
  return `${BASE}${shiny}/${dexNum}.png`;
}

export function artUrl(dexNum: number, options?: { shiny?: boolean }): string {
  const shiny = options?.shiny ? "/shiny" : "";
  return `${BASE}/other/official-artwork${shiny}/${dexNum}.png`;
}
