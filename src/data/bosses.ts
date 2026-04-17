import type { RivalStarter, TypeName } from "~/schemas";

/**
 * BOSSES — FRLG Gym Leaders, Elite Four, and Champion.
 * RIVALS — Gary/Blue encounter teams, keyed by the player's chosen starter.
 *
 * DO NOT alter team compositions or levels — verified against FRLG
 * via Bulbapedia + Serebii.
 */

export interface BossMember {
  readonly name: string;
  readonly lv: number;
  readonly types: readonly TypeName[];
}

export interface Boss {
  readonly name: string;
  readonly sub: string;
  readonly icon: string;
  readonly color: string;
  readonly tip: string;
  readonly team: readonly BossMember[];
}

export interface RivalEncounter {
  readonly location: string;
  readonly sub: string;
  readonly icon: string;
  readonly tip: string;
  readonly teams: Readonly<Record<RivalStarter, readonly BossMember[]>>;
}

export const BOSSES: readonly Boss[] = [
  {
    name: "Brock",
    sub: "Pewter City · Rock",
    icon: "🪨",
    color: "#786820",
    tip: "Water or Grass moves — Vine Whip and Water Gun one-shot his team.",
    team: [
      { name: "Geodude", lv: 12, types: ["Rock", "Ground"] },
      { name: "Onix", lv: 14, types: ["Rock", "Ground"] },
    ],
  },
  {
    name: "Misty",
    sub: "Cerulean City · Water",
    icon: "💧",
    color: "#2850c0",
    tip: "Electric or Grass. Starmie has Recover — hit hard fast.",
    team: [
      { name: "Staryu", lv: 18, types: ["Water"] },
      { name: "Starmie", lv: 21, types: ["Water", "Psychic"] },
    ],
  },
  {
    name: "Lt. Surge",
    sub: "Vermilion City · Electric",
    icon: "⚡",
    color: "#b89800",
    tip: "Ground types are immune to Electric. Raichu is fast — go first or use Ground.",
    team: [
      { name: "Voltorb", lv: 21, types: ["Electric"] },
      { name: "Pikachu", lv: 18, types: ["Electric"] },
      { name: "Raichu", lv: 24, types: ["Electric"] },
    ],
  },
  {
    name: "Erika",
    sub: "Celadon City · Grass",
    icon: "🌿",
    color: "#3a8820",
    tip: "Fire, Ice, Flying, Bug all work. Watch for Sleep Powder.",
    team: [
      { name: "Victreebel", lv: 29, types: ["Grass", "Poison"] },
      { name: "Tangela", lv: 24, types: ["Grass"] },
      { name: "Vileplume", lv: 29, types: ["Grass", "Poison"] },
    ],
  },
  {
    name: "Koga",
    sub: "Fuchsia City · Poison",
    icon: "☠️",
    color: "#621880",
    tip: "Ground and Psychic. Beware Minimize and Self-Destruct on Weezing.",
    team: [
      { name: "Koffing", lv: 37, types: ["Poison"] },
      { name: "Muk", lv: 39, types: ["Poison"] },
      { name: "Koffing", lv: 37, types: ["Poison"] },
      { name: "Weezing", lv: 43, types: ["Poison"] },
    ],
  },
  {
    name: "Sabrina",
    sub: "Saffron City · Psychic",
    icon: "🔮",
    color: "#b02050",
    tip: "Ghost, Bug, Dark. Alakazam is incredibly fast — have a counter ready.",
    team: [
      { name: "Kadabra", lv: 38, types: ["Psychic"] },
      { name: "Mr. Mime", lv: 37, types: ["Psychic"] },
      { name: "Venomoth", lv: 38, types: ["Bug", "Poison"] },
      { name: "Alakazam", lv: 43, types: ["Psychic"] },
    ],
  },
  {
    name: "Blaine",
    sub: "Cinnabar Island · Fire",
    icon: "🔥",
    color: "#b84018",
    tip: "Water destroys everything. Rock and Ground also work.",
    team: [
      { name: "Growlithe", lv: 42, types: ["Fire"] },
      { name: "Ponyta", lv: 40, types: ["Fire"] },
      { name: "Rapidash", lv: 42, types: ["Fire"] },
      { name: "Arcanine", lv: 47, types: ["Fire"] },
    ],
  },
  {
    name: "Giovanni",
    sub: "Viridian City · Ground",
    icon: "🌍",
    color: "#907030",
    tip: "Water, Grass, Ice all work. Ground is immune to Electric — bring Fire or Water.",
    team: [
      { name: "Rhyhorn", lv: 45, types: ["Ground", "Rock"] },
      { name: "Dugtrio", lv: 42, types: ["Ground"] },
      { name: "Nidoqueen", lv: 44, types: ["Poison", "Ground"] },
      { name: "Nidoking", lv: 45, types: ["Poison", "Ground"] },
      { name: "Rhydon", lv: 50, types: ["Ground", "Rock"] },
    ],
  },
  {
    name: "Lorelei",
    sub: "Elite Four · Ice",
    icon: "🧊",
    color: "#488888",
    tip: "Electric crushes Dewgong & Lapras. Fire/Fight for Jynx. Rock for Cloyster.",
    team: [
      { name: "Dewgong", lv: 54, types: ["Water", "Ice"] },
      { name: "Cloyster", lv: 53, types: ["Water", "Ice"] },
      { name: "Slowbro", lv: 54, types: ["Water", "Psychic"] },
      { name: "Jynx", lv: 56, types: ["Ice", "Psychic"] },
      { name: "Lapras", lv: 60, types: ["Water", "Ice"] },
    ],
  },
  {
    name: "Bruno",
    sub: "Elite Four · Fighting",
    icon: "👊",
    color: "#801818",
    tip: "Psychic and Flying dominate. Onix is Ground/Rock — use Water or Grass.",
    team: [
      { name: "Onix", lv: 53, types: ["Rock", "Ground"] },
      { name: "Hitmonchan", lv: 55, types: ["Fighting"] },
      { name: "Hitmonlee", lv: 55, types: ["Fighting"] },
      { name: "Onix", lv: 54, types: ["Rock", "Ground"] },
      { name: "Machamp", lv: 58, types: ["Fighting"] },
    ],
  },
  {
    name: "Agatha",
    sub: "Elite Four · Ghost",
    icon: "👻",
    color: "#402860",
    tip: "Dark, Ghost, Psychic. Watch for Confuse Ray + Hypnosis chains.",
    team: [
      { name: "Gengar", lv: 54, types: ["Ghost", "Poison"] },
      { name: "Haunter", lv: 53, types: ["Ghost", "Poison"] },
      { name: "Gengar", lv: 58, types: ["Ghost", "Poison"] },
      { name: "Arbok", lv: 54, types: ["Poison"] },
      { name: "Haunter", lv: 53, types: ["Ghost", "Poison"] },
    ],
  },
  {
    name: "Lance",
    sub: "Elite Four · Dragon",
    icon: "🐉",
    color: "#3808d8",
    tip: "Ice is the only reliable Dragon counter. Aerodactyl & Gyarados — use Electric or Rock.",
    team: [
      { name: "Gyarados", lv: 58, types: ["Water", "Flying"] },
      { name: "Dragonair", lv: 56, types: ["Dragon"] },
      { name: "Dragonair", lv: 56, types: ["Dragon"] },
      { name: "Aerodactyl", lv: 60, types: ["Rock", "Flying"] },
      { name: "Dragonite", lv: 62, types: ["Dragon", "Flying"] },
    ],
  },
  {
    name: "Rival (Gary)",
    sub: "Champion · Mixed",
    icon: "⭐",
    color: "#ffc93c",
    tip: "Bring Ice for Dragonite. A strong special attacker covers most of his team.",
    team: [
      { name: "Pidgeot", lv: 61, types: ["Normal", "Flying"] },
      { name: "Alakazam", lv: 59, types: ["Psychic"] },
      { name: "Rhydon", lv: 61, types: ["Ground", "Rock"] },
      { name: "Gyarados", lv: 61, types: ["Water", "Flying"] },
      { name: "Arcanine", lv: 61, types: ["Fire"] },
      { name: "Dragonite", lv: 65, types: ["Dragon", "Flying"] },
    ],
  },
];

export const RIVALS: readonly RivalEncounter[] = [
  {
    location: "Route 22",
    sub: "Encounter 1 · Optional",
    icon: "🏁",
    tip: "Only 2 Pokémon — quick fight. Good early XP if you want it.",
    teams: {
      bulbasaur: [
        { name: "Pidgey", lv: 9, types: ["Normal", "Flying"] },
        { name: "Charmander", lv: 9, types: ["Fire"] },
      ],
      charmander: [
        { name: "Pidgey", lv: 9, types: ["Normal", "Flying"] },
        { name: "Squirtle", lv: 9, types: ["Water"] },
      ],
      squirtle: [
        { name: "Pidgey", lv: 9, types: ["Normal", "Flying"] },
        { name: "Bulbasaur", lv: 9, types: ["Grass", "Poison"] },
      ],
    },
  },
  {
    location: "Cerulean City",
    sub: "Encounter 2 · Nugget Bridge",
    icon: "🌉",
    tip: "Abra will Teleport if low HP — hit hard fast. Rattata hits surprisingly hard.",
    teams: {
      bulbasaur: [
        { name: "Pidgeotto", lv: 17, types: ["Normal", "Flying"] },
        { name: "Abra", lv: 16, types: ["Psychic"] },
        { name: "Rattata", lv: 15, types: ["Normal"] },
        { name: "Charmander", lv: 18, types: ["Fire"] },
      ],
      charmander: [
        { name: "Pidgeotto", lv: 17, types: ["Normal", "Flying"] },
        { name: "Abra", lv: 16, types: ["Psychic"] },
        { name: "Rattata", lv: 15, types: ["Normal"] },
        { name: "Squirtle", lv: 18, types: ["Water"] },
      ],
      squirtle: [
        { name: "Pidgeotto", lv: 17, types: ["Normal", "Flying"] },
        { name: "Abra", lv: 16, types: ["Psychic"] },
        { name: "Rattata", lv: 15, types: ["Normal"] },
        { name: "Bulbasaur", lv: 18, types: ["Grass", "Poison"] },
      ],
    },
  },
  {
    location: "S.S. Anne",
    sub: "Encounter 3 · Upper Deck",
    icon: "🚢",
    tip: "Raticate hits fast with Hyper Fang. Kadabra uses Disable — lead with a heavy hitter.",
    teams: {
      bulbasaur: [
        { name: "Pidgeotto", lv: 19, types: ["Normal", "Flying"] },
        { name: "Raticate", lv: 16, types: ["Normal"] },
        { name: "Kadabra", lv: 18, types: ["Psychic"] },
        { name: "Charmeleon", lv: 20, types: ["Fire"] },
      ],
      charmander: [
        { name: "Pidgeotto", lv: 19, types: ["Normal", "Flying"] },
        { name: "Raticate", lv: 16, types: ["Normal"] },
        { name: "Kadabra", lv: 18, types: ["Psychic"] },
        { name: "Wartortle", lv: 20, types: ["Water"] },
      ],
      squirtle: [
        { name: "Pidgeotto", lv: 19, types: ["Normal", "Flying"] },
        { name: "Raticate", lv: 16, types: ["Normal"] },
        { name: "Kadabra", lv: 18, types: ["Psychic"] },
        { name: "Ivysaur", lv: 20, types: ["Grass", "Poison"] },
      ],
    },
  },
  {
    location: "Pokémon Tower",
    sub: "Encounter 4 · Lavender Town",
    icon: "👻",
    tip: "Exeggcute uses Hypnosis — bring Awakening. Gyarados/Growlithe add coverage. Watch your types.",
    teams: {
      bulbasaur: [
        { name: "Pidgeotto", lv: 25, types: ["Normal", "Flying"] },
        { name: "Exeggcute", lv: 23, types: ["Grass", "Psychic"] },
        { name: "Gyarados", lv: 22, types: ["Water", "Flying"] },
        { name: "Kadabra", lv: 20, types: ["Psychic"] },
        { name: "Charmeleon", lv: 25, types: ["Fire"] },
      ],
      charmander: [
        { name: "Pidgeotto", lv: 25, types: ["Normal", "Flying"] },
        { name: "Growlithe", lv: 23, types: ["Fire"] },
        { name: "Exeggcute", lv: 22, types: ["Grass", "Psychic"] },
        { name: "Kadabra", lv: 20, types: ["Psychic"] },
        { name: "Wartortle", lv: 25, types: ["Water"] },
      ],
      squirtle: [
        { name: "Pidgeotto", lv: 25, types: ["Normal", "Flying"] },
        { name: "Gyarados", lv: 23, types: ["Water", "Flying"] },
        { name: "Growlithe", lv: 22, types: ["Fire"] },
        { name: "Kadabra", lv: 20, types: ["Psychic"] },
        { name: "Ivysaur", lv: 25, types: ["Grass", "Poison"] },
      ],
    },
  },
  {
    location: "Silph Co.",
    sub: "Encounter 5 · Saffron City",
    icon: "🏢",
    tip: "Starter fully evolved at Lv.40. Alakazam has Recover — hit it hard. Pidgeot is fast.",
    teams: {
      bulbasaur: [
        { name: "Pidgeot", lv: 37, types: ["Normal", "Flying"] },
        { name: "Exeggcute", lv: 38, types: ["Grass", "Psychic"] },
        { name: "Gyarados", lv: 35, types: ["Water", "Flying"] },
        { name: "Alakazam", lv: 35, types: ["Psychic"] },
        { name: "Charizard", lv: 40, types: ["Fire", "Flying"] },
      ],
      charmander: [
        { name: "Pidgeot", lv: 37, types: ["Normal", "Flying"] },
        { name: "Growlithe", lv: 38, types: ["Fire"] },
        { name: "Exeggcute", lv: 35, types: ["Grass", "Psychic"] },
        { name: "Alakazam", lv: 35, types: ["Psychic"] },
        { name: "Blastoise", lv: 40, types: ["Water"] },
      ],
      squirtle: [
        { name: "Pidgeot", lv: 37, types: ["Normal", "Flying"] },
        { name: "Gyarados", lv: 38, types: ["Water", "Flying"] },
        { name: "Growlithe", lv: 35, types: ["Fire"] },
        { name: "Alakazam", lv: 35, types: ["Psychic"] },
        { name: "Venusaur", lv: 40, types: ["Grass", "Poison"] },
      ],
    },
  },
  {
    location: "Route 22",
    sub: "Encounter 6 · Pre-League",
    icon: "🚪",
    tip: "Full 6-mon team. Rhyhorn is Ground/Rock — Water or Grass covers most threats here.",
    teams: {
      bulbasaur: [
        { name: "Pidgeot", lv: 47, types: ["Normal", "Flying"] },
        { name: "Rhyhorn", lv: 45, types: ["Ground", "Rock"] },
        { name: "Exeggcute", lv: 45, types: ["Grass", "Psychic"] },
        { name: "Gyarados", lv: 45, types: ["Water", "Flying"] },
        { name: "Alakazam", lv: 47, types: ["Psychic"] },
        { name: "Charizard", lv: 53, types: ["Fire", "Flying"] },
      ],
      charmander: [
        { name: "Pidgeot", lv: 47, types: ["Normal", "Flying"] },
        { name: "Rhyhorn", lv: 45, types: ["Ground", "Rock"] },
        { name: "Growlithe", lv: 45, types: ["Fire"] },
        { name: "Exeggcute", lv: 45, types: ["Grass", "Psychic"] },
        { name: "Alakazam", lv: 47, types: ["Psychic"] },
        { name: "Blastoise", lv: 53, types: ["Water"] },
      ],
      squirtle: [
        { name: "Pidgeot", lv: 47, types: ["Normal", "Flying"] },
        { name: "Rhyhorn", lv: 45, types: ["Ground", "Rock"] },
        { name: "Gyarados", lv: 45, types: ["Water", "Flying"] },
        { name: "Growlithe", lv: 45, types: ["Fire"] },
        { name: "Alakazam", lv: 47, types: ["Psychic"] },
        { name: "Venusaur", lv: 53, types: ["Grass", "Poison"] },
      ],
    },
  },
];
