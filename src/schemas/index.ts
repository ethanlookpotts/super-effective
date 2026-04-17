import { z } from "zod";

export const TypeName = z.enum([
  "Normal",
  "Fighting",
  "Flying",
  "Poison",
  "Ground",
  "Rock",
  "Bug",
  "Ghost",
  "Steel",
  "Fire",
  "Water",
  "Grass",
  "Electric",
  "Ice",
  "Psychic",
  "Dragon",
  "Dark",
  "Fairy",
]);
export type TypeName = z.infer<typeof TypeName>;

export const MoveCategory = z.enum(["phys", "spec", "stat"]);
export type MoveCategory = z.infer<typeof MoveCategory>;

export const PartyMove = z.object({
  name: z.string().min(1),
  type: TypeName,
  cat: MoveCategory.optional(),
});
export type PartyMove = z.infer<typeof PartyMove>;

export const PartyMember = z.object({
  n: z.number().int().positive(),
  name: z.string().min(1),
  types: z.array(TypeName).min(1).max(2),
  moves: z.array(PartyMove).max(4).default([]),
  level: z.number().int().min(1).max(100).optional(),
  ability: z.string().optional(),
  item: z.string().optional(),
  gender: z.enum(["M", "F", ""]).optional(),
  shiny: z.boolean().optional(),
});
export type PartyMember = z.infer<typeof PartyMember>;

export const RivalStarter = z.enum(["bulbasaur", "charmander", "squirtle"]);
export type RivalStarter = z.infer<typeof RivalStarter>;

export const RecentPokemon = z.object({
  n: z.number().int().positive(),
  name: z.string().min(1),
  types: z.array(TypeName).min(1).max(2),
});
export type RecentPokemon = z.infer<typeof RecentPokemon>;

export const Playthrough = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  gameId: z.string().min(1),
  party: z.array(PartyMember).default([]),
  pc: z.array(PartyMember).default([]),
  recents: z.array(RecentPokemon).default([]),
  rivalStarter: RivalStarter.default("bulbasaur"),
  tmInventory: z.record(z.string(), z.number().int().min(0)).default({}),
});
export type Playthrough = z.infer<typeof Playthrough>;

export const Store = z.object({
  playthroughs: z.array(Playthrough).default([]),
  activePtId: z.string().uuid().nullable().default(null),
});
export type Store = z.infer<typeof Store>;

export const Settings = z.object({
  theme: z.enum(["light", "system", "dark"]).default("system"),
  claudeApiKey: z.string().optional(),
  githubToken: z.string().optional(),
  gistId: z.string().optional(),
});
export type Settings = z.infer<typeof Settings>;
