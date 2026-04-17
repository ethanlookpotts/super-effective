import { describe, expect, it } from "vitest";
import { LEARNSETS } from "~/data/learnsets";
import {
  type CalcMember,
  type CanLearnFn,
  type TeachMoveInput,
  makePartyCalc,
} from "~/lib/party-calc";
import type { PartyMove, TypeName } from "~/schemas";

const calc = makePartyCalc();

/** Build a minimal Pokémon-like object for testing. */
function mon(n: number, types: TypeName[], moves: PartyMove[] = []): CalcMember {
  return {
    n,
    types,
    moves,
    level: 50,
  };
}

// ─── bst ────────────────────────────────────────────────────────────────────
describe("bst", () => {
  it("returns sum of all 6 base stats for Pikachu (#25)", () => {
    // STATS[25] = [35,55,40,50,50,90]
    expect(calc.bst(25)).toBe(35 + 55 + 40 + 50 + 50 + 90);
  });

  it("returns sum for Mewtwo (#150)", () => {
    // STATS[150] = [106,110,90,154,90,130]
    expect(calc.bst(150)).toBe(106 + 110 + 90 + 154 + 90 + 130);
  });

  it("returns 300 for unknown dex number", () => {
    expect(calc.bst(9999)).toBe(300);
  });
});

// ─── countOffCov ────────────────────────────────────────────────────────────
describe("countOffCov", () => {
  it("single Fire-type covers Grass, Ice, Bug, Steel = 4 types", () => {
    const team = [mon(4, ["Fire"])];
    expect(calc.countOffCov(team)).toBe(4);
  });

  it("diverse team covers more types than a single Pokémon", () => {
    const single = [mon(1, ["Fire"])];
    const diverse = [mon(1, ["Fire"]), mon(2, ["Water"]), mon(3, ["Electric"])];
    expect(calc.countOffCov(diverse)).toBeGreaterThan(calc.countOffCov(single));
  });

  it("counts move types toward coverage when moves are set", () => {
    const withoutMove = [mon(1, ["Normal"])];
    const withMove = [mon(1, ["Normal"], [{ name: "Ember", type: "Fire" }])];
    expect(calc.countOffCov(withMove)).toBeGreaterThan(calc.countOffCov(withoutMove));
  });

  it("empty team returns 0", () => {
    expect(calc.countOffCov([])).toBe(0);
  });
});

// ─── unresistedCov ──────────────────────────────────────────────────────────
describe("unresistedCov", () => {
  it("monotype Fire hits ≥14 types neutrally", () => {
    // Fire hits Grass/Ice/Bug/Steel 2× and most others 1×;
    // only Fire/Water/Rock/Dragon resist.
    const team = [mon(6, ["Fire"])];
    expect(calc.unresistedCov(team)).toBeGreaterThanOrEqual(14);
  });

  it("unresistedCov ≥ countOffCov always", () => {
    const team = [mon(6, ["Fire"]), mon(9, ["Water"]), mon(65, ["Psychic"])];
    expect(calc.unresistedCov(team)).toBeGreaterThanOrEqual(calc.countOffCov(team));
  });

  it("empty team returns 0", () => {
    expect(calc.unresistedCov([])).toBe(0);
  });
});

// ─── individualScore ────────────────────────────────────────────────────────
describe("individualScore", () => {
  it("Fire scores higher than Normal (Normal hits nothing 2×)", () => {
    const fire = mon(6, ["Fire"]);
    const normal = mon(143, ["Normal"]);
    expect(calc.individualScore(fire)).toBeGreaterThan(calc.individualScore(normal));
  });

  it("higher BST breaks ties between equally-covering Pokémon", () => {
    const blastoise = mon(9, ["Water"]);
    const squirtle = mon(7, ["Water"]);
    expect(calc.individualScore(blastoise)).toBeGreaterThan(calc.individualScore(squirtle));
  });
});

// ─── marginalScore ──────────────────────────────────────────────────────────
describe("marginalScore", () => {
  it("adding new coverage outscores redundant coverage", () => {
    const team = [mon(1, ["Fire"])];
    const newCov = mon(2, ["Water"]);
    const overlap = mon(3, ["Fire"]);
    expect(calc.marginalScore(newCov, team)).toBeGreaterThan(calc.marginalScore(overlap, team));
  });

  it("unrelated weaknesses outscore stacked weaknesses", () => {
    const team = [mon(9, ["Water"])];
    const stackedWater = mon(131, ["Water", "Ice"]);
    const fighting = mon(68, ["Fighting"]);
    expect(calc.marginalScore(fighting, team)).toBeGreaterThan(
      calc.marginalScore(stackedWater, team),
    );
  });

  it("higher BST breaks ties when coverage is equal", () => {
    const weak = mon(7, ["Water"]);
    const strong = mon(9, ["Water"]);
    const team = [mon(4, ["Fire"])];
    expect(calc.marginalScore(strong, team)).toBeGreaterThan(calc.marginalScore(weak, team));
  });
});

// ─── scoreTeam ──────────────────────────────────────────────────────────────
describe("scoreTeam", () => {
  it("wider type coverage scores higher than mono-typed team", () => {
    const diverse = [
      mon(6, ["Fire", "Flying"]),
      mon(9, ["Water"]),
      mon(65, ["Psychic"]),
      mon(68, ["Fighting"]),
      mon(94, ["Ghost", "Poison"]),
      mon(131, ["Water", "Ice"]),
    ];
    const mono = [
      mon(7, ["Water"]),
      mon(8, ["Water"]),
      mon(9, ["Water"]),
      mon(54, ["Water"]),
      mon(60, ["Water"]),
      mon(79, ["Water", "Psychic"]),
    ];
    expect(calc.scoreTeam(diverse)).toBeGreaterThan(calc.scoreTeam(mono));
  });

  it("stacked weaknesses reduce the score (or hold equal)", () => {
    const base = [
      mon(6, ["Fire", "Flying"]),
      mon(9, ["Water"]),
      mon(65, ["Psychic"]),
      mon(68, ["Fighting"]),
      mon(94, ["Ghost", "Poison"]),
      mon(112, ["Ground", "Rock"]),
    ];
    const stacked = [
      mon(6, ["Fire", "Flying"]),
      mon(9, ["Water"]),
      mon(65, ["Psychic"]),
      mon(68, ["Fighting"]),
      mon(94, ["Ghost", "Poison"]),
      mon(131, ["Water", "Ice"]),
    ];
    expect(calc.scoreTeam(base)).toBeGreaterThanOrEqual(calc.scoreTeam(stacked));
  });

  it("adding a Fire move cannot lower the team score (additivity)", () => {
    const withoutMoves = [
      mon(1, ["Normal"]),
      mon(2, ["Water"]),
      mon(3, ["Electric"]),
      mon(4, ["Fighting"]),
      mon(5, ["Ground"]),
      mon(6, ["Rock"]),
    ];
    const withMoves: CalcMember[] = withoutMoves.map((p, i) =>
      i === 0 ? { ...p, moves: [{ name: "Ember", type: "Fire" as TypeName }] } : p,
    );
    expect(calc.scoreTeam(withMoves)).toBeGreaterThanOrEqual(calc.scoreTeam(withoutMoves));
  });

  it("empty team returns 0", () => {
    expect(calc.scoreTeam([])).toBe(0);
  });
});

// ─── buildGreedyTeam ────────────────────────────────────────────────────────
describe("buildGreedyTeam", () => {
  const pool: CalcMember[] = [
    mon(6, ["Fire", "Flying"]),
    mon(9, ["Water"]),
    mon(65, ["Psychic"]),
    mon(68, ["Fighting"]),
    mon(94, ["Ghost", "Poison"]),
    mon(131, ["Water", "Ice"]),
    mon(112, ["Ground", "Rock"]),
    mon(25, ["Electric"]),
  ];

  it("returns exactly 6 members from a larger pool", () => {
    const team = calc.buildGreedyTeam(pool, pool[0]);
    expect(team).toHaveLength(6);
  });

  it("includes the seed as the first member", () => {
    const seed = pool[3];
    const team = calc.buildGreedyTeam(pool, seed);
    expect(team[0]).toBe(seed);
  });

  it("returns all members when pool size equals 6", () => {
    const small = pool.slice(0, 6);
    const team = calc.buildGreedyTeam(small, small[0]);
    expect(team).toHaveLength(6);
  });

  it("returns all available when pool is smaller than 6", () => {
    const tiny = pool.slice(0, 3);
    const team = calc.buildGreedyTeam(tiny, tiny[0]);
    expect(team).toHaveLength(3);
  });

  it("no duplicate members in the team", () => {
    const team = calc.buildGreedyTeam(pool, pool[0]);
    const unique = new Set(team.map((m) => m.n));
    expect(unique.size).toBe(team.length);
  });
});

// ─── computeSuggestions ─────────────────────────────────────────────────────
describe("computeSuggestions", () => {
  const pool: CalcMember[] = [
    mon(6, ["Fire", "Flying"]),
    mon(9, ["Water"]),
    mon(65, ["Psychic"]),
    mon(68, ["Fighting"]),
    mon(94, ["Ghost", "Poison"]),
    mon(131, ["Water", "Ice"]),
    mon(112, ["Ground", "Rock"]),
    mon(25, ["Electric"]),
    mon(3, ["Grass", "Poison"]),
  ];

  it("returns empty array for empty pool", () => {
    expect(calc.computeSuggestions([])).toHaveLength(0);
  });

  it("returns at most 5 suggestions by default", () => {
    const results = calc.computeSuggestions(pool);
    expect(results.length).toBeLessThanOrEqual(5);
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it("respects maxResults parameter", () => {
    const results = calc.computeSuggestions(pool, 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it("suggestions are sorted by score descending", () => {
    const results = calc.computeSuggestions(pool);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it("each suggestion has 6 members when pool is large enough", () => {
    const results = calc.computeSuggestions(pool);
    for (const s of results) {
      expect(s.members).toHaveLength(6);
    }
  });

  it("each suggestion has a coverage count between 0 and 18", () => {
    const results = calc.computeSuggestions(pool);
    for (const s of results) {
      expect(s.coverage).toBeGreaterThanOrEqual(0);
      expect(s.coverage).toBeLessThanOrEqual(18);
    }
  });

  it("no duplicate teams across suggestions", () => {
    const results = calc.computeSuggestions(pool);
    const keys = results.map((s) =>
      s.members
        .map((m) => m.n)
        .sort((a, b) => a - b)
        .join(","),
    );
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it("works with pool of exactly 6", () => {
    const tiny = pool.slice(0, 6);
    const results = calc.computeSuggestions(tiny);
    expect(results).toHaveLength(1);
    expect(results[0].members).toHaveLength(6);
  });

  it("preserves extra properties on pool members", () => {
    type Tagged = CalcMember & { _src: string; _srcIdx: number };
    const tagged: Tagged[] = pool.map((pm, i) => ({ ...pm, _src: "pc", _srcIdx: i }));
    const results = calc.computeSuggestions(tagged);
    for (const s of results) {
      for (const m of s.members) {
        expect(m._src).toBe("pc");
        expect(typeof m._srcIdx).toBe("number");
      }
    }
  });
});

// ─── Damage-aware scoring ───────────────────────────────────────────────────
describe("damage-aware scoring", () => {
  it("bestDamageAgainst returns a positive value when a move is set", () => {
    const pm: CalcMember = {
      ...mon(6, ["Fire", "Flying"]),
      level: 50,
      moves: [{ name: "Flamethrower", type: "Fire" }],
    };
    expect(calc.bestDamageAgainst(pm, "Grass")).toBeGreaterThan(0);
  });

  it("higher-level attacker deals more damage than lower-level", () => {
    const base = {
      ...mon(6, ["Fire", "Flying"]),
      moves: [{ name: "Flamethrower", type: "Fire" as TypeName }],
    };
    const low: CalcMember = { ...base, level: 20 };
    const high: CalcMember = { ...base, level: 80 };
    expect(calc.bestDamageAgainst(high, "Grass")).toBeGreaterThan(
      calc.bestDamageAgainst(low, "Grass"),
    );
  });

  it("team of higher-level members scores higher than same team at lower level", () => {
    const mkTeam = (lvl: number): CalcMember[] => [
      {
        ...mon(6, ["Fire", "Flying"]),
        level: lvl,
        moves: [{ name: "Flamethrower", type: "Fire" }],
      },
      { ...mon(9, ["Water"]), level: lvl, moves: [{ name: "Surf", type: "Water" }] },
      {
        ...mon(25, ["Electric"]),
        level: lvl,
        moves: [{ name: "Thunderbolt", type: "Electric" }],
      },
    ];
    expect(calc.scoreTeam(mkTeam(80))).toBeGreaterThan(calc.scoreTeam(mkTeam(20)));
  });

  it("avgAtkPower is 0 for an empty team", () => {
    expect(calc.avgAtkPower([])).toBe(0);
  });
});

// ─── computeTeachImpact ─────────────────────────────────────────────────────
describe("computeTeachImpact", () => {
  it("null for a move the member already knows", () => {
    const team: CalcMember[] = [
      {
        ...mon(6, ["Fire", "Flying"]),
        level: 50,
        moves: [{ name: "Flamethrower", type: "Fire" }],
      },
    ];
    const move: TeachMoveInput = { name: "Flamethrower", type: "Fire" };
    expect(calc.computeTeachImpact(team, 0, move)).toBeNull();
  });

  it("appends to an open slot (returns replaceIdx=-1)", () => {
    const team: CalcMember[] = [
      {
        ...mon(6, ["Fire", "Flying"]),
        level: 50,
        moves: [{ name: "Ember", type: "Fire" }],
      },
    ];
    const imp = calc.computeTeachImpact(team, 0, { name: "Earthquake", type: "Ground" });
    expect(imp).not.toBeNull();
    expect(imp?.replaceIdx).toBe(-1);
  });

  it("teaching a new-type move increases score", () => {
    const team: CalcMember[] = [
      {
        ...mon(6, ["Fire", "Flying"]),
        level: 50,
        moves: [{ name: "Flamethrower", type: "Fire" }],
      },
    ];
    const imp = calc.computeTeachImpact(team, 0, { name: "Earthquake", type: "Ground" });
    expect(imp?.scoreDelta).toBeGreaterThan(0);
  });

  it("reports coverageLost ≥ 0 when all slots are full", () => {
    const team: CalcMember[] = [
      {
        ...mon(6, ["Fire", "Flying"]),
        level: 50,
        moves: [
          { name: "Flamethrower", type: "Fire" },
          { name: "Earthquake", type: "Ground" },
          { name: "Rock Slide", type: "Rock" },
          { name: "Aerial Ace", type: "Flying" },
        ],
      },
    ];
    const imp = calc.computeTeachImpact(team, 0, { name: "Fire Blast", type: "Fire" });
    expect(imp).not.toBeNull();
    expect(imp?.coverageLost).toBeGreaterThanOrEqual(0);
  });

  it("returns null when memberIdx is out of range", () => {
    const team: CalcMember[] = [mon(6, ["Fire", "Flying"])];
    expect(calc.computeTeachImpact(team, 5, { name: "Earthquake", type: "Ground" })).toBeNull();
  });
});

// ─── rankTeachTargets ───────────────────────────────────────────────────────
describe("rankTeachTargets", () => {
  it("filters out members that cannot learn the move", () => {
    const team: CalcMember[] = [
      { ...mon(10, ["Bug"]), level: 20, moves: [] },
      {
        ...mon(6, ["Fire", "Flying"]),
        level: 40,
        moves: [{ name: "Flamethrower", type: "Fire" }],
      },
    ];
    const canLearn = new Set<number>([6]);
    const ranked = calc.rankTeachTargets(team, { name: "Earthquake", type: "Ground" }, canLearn);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].memberIdx).toBe(1);
  });

  it("ordered by score delta descending when multiple members can learn", () => {
    const team: CalcMember[] = [
      {
        ...mon(6, ["Fire", "Flying"]),
        level: 40,
        moves: [{ name: "Flamethrower", type: "Fire" }],
      },
      { ...mon(9, ["Water"]), level: 40, moves: [{ name: "Surf", type: "Water" }] },
    ];
    const canLearn = new Set<number>([6, 9]);
    const ranked = calc.rankTeachTargets(team, { name: "Ice Beam", type: "Ice" }, canLearn);
    expect(ranked.length).toBeGreaterThanOrEqual(1);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].impact.scoreDelta).toBeGreaterThanOrEqual(ranked[i].impact.scoreDelta);
    }
  });

  it("returns empty when no member can learn", () => {
    const team: CalcMember[] = [mon(10, ["Bug"])];
    const ranked = calc.rankTeachTargets(team, { name: "Psychic", type: "Psychic" }, new Set());
    expect(ranked).toHaveLength(0);
  });
});

// ─── computeHMCarriers ──────────────────────────────────────────────────────
describe("computeHMCarriers", () => {
  const canLearn: CanLearnFn = (dex, move) => (LEARNSETS[dex] ?? []).includes(move);

  it("returns empty when no HMs owned", () => {
    const pool = [mon(54, ["Water"])];
    expect(calc.computeHMCarriers(pool, [], canLearn)).toHaveLength(0);
  });

  it("returns empty when pool is empty", () => {
    expect(calc.computeHMCarriers([], ["Surf"], canLearn)).toHaveLength(0);
  });

  it("Psyduck line outranks Goldeen as multi-HM carrier", () => {
    const psyduck = mon(54, ["Water"]);
    const goldeen = mon(118, ["Water"]);
    const result = calc.computeHMCarriers(
      [psyduck, goldeen],
      ["Cut", "Surf", "Strength", "Rock Smash", "Waterfall"],
      canLearn,
    );
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].pm.n).toBe(54);
    expect(result[0].hmsLearnable).toBeGreaterThanOrEqual(3);
  });

  it("returns descending by score", () => {
    const pool = [mon(54, ["Water"]), mon(118, ["Water"]), mon(6, ["Fire", "Flying"])];
    const result = calc.computeHMCarriers(pool, ["Cut", "Surf", "Fly"], canLearn);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score);
    }
  });
});
