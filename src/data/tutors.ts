import type { MoveCategory, TypeName } from "~/schemas";

/**
 * FRLG Move Tutors — 18 moves.
 *
 * Source: PokéAPI firered-leafgreen version group (tutor method) for the move list,
 * cross-referenced with pret/pokefirered decompilation for location mapping where
 * unambiguous. All 18 tutor moves below are ONE-TIME per save file and FREE.
 * Additional NPCs (Move Reminder, Move Deleter) are listed separately.
 *
 * Learnability is derived from LEARNSETS (already includes tutor moves), so this
 * file only carries the move list + location metadata for the TMs & HMs page.
 */

export interface MoveTutor {
  /** Move name. */
  move: string;
  /** Elemental type of the move. */
  type: TypeName;
  /** Move category (physical / special / status). */
  cat: MoveCategory;
  /** In-game location of the tutor NPC. */
  loc: string;
  /** Tutor number for inventory-style tracking ("teach flag"). Format: 'MT01'..'MT18'. */
  num: string;
  /** Marker so tutor entries can coexist with TM/HM entries in mixed lists. */
  tmType: "tutor";
}

export interface UtilityNpc {
  /** Display label for the NPC. */
  label: string;
  /** In-game location of the NPC. */
  loc: string;
  /** Cost to use the service. */
  cost: string;
  /** Extra detail shown alongside the entry. */
  note: string;
}

const TUTORS: ReadonlyArray<Omit<MoveTutor, "num" | "tmType">> = [
  { move: "Mega Punch", type: "Normal", cat: "phys", loc: "Route 4 (house by Mt. Moon)" },
  { move: "Mega Kick", type: "Normal", cat: "phys", loc: "Route 4 (house by Mt. Moon)" },
  { move: "Swords Dance", type: "Normal", cat: "stat", loc: "Seven Island (house in town)" },
  { move: "Body Slam", type: "Normal", cat: "phys", loc: "Four Island (House 1)" },
  { move: "Double-Edge", type: "Normal", cat: "phys", loc: "Victory Road (2F)" },
  {
    move: "Counter",
    type: "Fighting",
    cat: "phys",
    loc: "Celadon Dept. Store (TV section)",
  },
  { move: "Seismic Toss", type: "Fighting", cat: "phys", loc: "Pewter City Museum (1F)" },
  { move: "Thunder Wave", type: "Electric", cat: "stat", loc: "Silph Co. (Saffron City)" },
  {
    move: "Mimic",
    type: "Normal",
    cat: "stat",
    loc: "Saffron City — Copycat's House (bring Poké Doll)",
  },
  { move: "Metronome", type: "Normal", cat: "stat", loc: "Cinnabar Island Pokémon Lab" },
  {
    move: "Soft-Boiled",
    type: "Normal",
    cat: "stat",
    loc: "Celadon City (house w/ pool, needs Surf) — Chansey only",
  },
  { move: "Dream Eater", type: "Psychic", cat: "spec", loc: "Viridian City (house, SW area)" },
  { move: "Explosion", type: "Normal", cat: "phys", loc: "Mt. Ember (Exterior, Island 1)" },
  { move: "Rock Slide", type: "Rock", cat: "phys", loc: "Rock Tunnel (B1F)" },
  { move: "Substitute", type: "Normal", cat: "stat", loc: "Fuchsia City (house)" },
  {
    move: "Frenzy Plant",
    type: "Grass",
    cat: "spec",
    loc: "Two Island — Cape Brink (Venusaur, max friendship)",
  },
  {
    move: "Blast Burn",
    type: "Fire",
    cat: "spec",
    loc: "Two Island — Cape Brink (Charizard, max friendship)",
  },
  {
    move: "Hydro Cannon",
    type: "Water",
    cat: "spec",
    loc: "Two Island — Cape Brink (Blastoise, max friendship)",
  },
];

export const MOVE_TUTORS: readonly MoveTutor[] = TUTORS.map((t, i) => ({
  ...t,
  num: `MT${String(i + 1).padStart(2, "0")}`,
  tmType: "tutor",
}));

/** Other utility NPCs (not inventory-tracked, shown for reference). */
export const UTILITY_NPCS: readonly UtilityNpc[] = [
  {
    label: "Move Reminder (Move Maniac)",
    loc: "Two Island (house near Pokémon Center)",
    cost: "1 Heart Scale",
    note: "Re-teaches any level-up move — repeatable",
  },
  {
    label: "Move Deleter",
    loc: "Fuchsia City (house near Safari Zone gate)",
    cost: "Free",
    note: "Deletes any move, including HMs — repeatable",
  },
];
