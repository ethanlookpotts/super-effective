/**
 * Unit tests for js/party-calc.js
 *
 * Strategy: load the browser source files exactly as-is using node:vm,
 * so we test the literal code that runs in the app — no exports, no mocks,
 * no dual code paths.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

// ─── Load browser globals into a shared vm context ────────────────────────
// Data files use `const` at top level, which does NOT become a property of
// the context object. We run each file then promote the globals we need to
// `globalThis` so they're accessible outside the vm.
const src = (...parts) => path.join(__dirname, '..', 'js', ...parts);
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(src('data-types.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(src('data-pokemon.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(src('party-calc.js'), 'utf8'), ctx);
vm.runInContext(
  'globalThis.TYPES=TYPES; globalThis.STATS=STATS; globalThis.gm=gm; globalThis.dmult=dmult; globalThis.makePartyCalc=makePartyCalc;',
  ctx
);

const { makePartyCalc, TYPES, STATS, gm, dmult } = ctx;
const calc = makePartyCalc(TYPES, STATS, gm, dmult);

// ─── Helpers ──────────────────────────────────────────────────────────────
// Build a minimal Pokémon-like object for testing
function mon(n, types, moves = []) {
  return { n, name: `Mon${n}`, types, moves, level: '' };
}

// ─── bst ──────────────────────────────────────────────────────────────────
describe('bst', () => {
  test('returns sum of all 6 base stats for Pikachu (#25)', () => {
    // STATS[25] = [35,55,40,50,50,90]
    assert.equal(calc.bst(25), 35 + 55 + 40 + 50 + 50 + 90);
  });

  test('returns sum for Mewtwo (#150)', () => {
    // STATS[150] = [106,110,90,154,90,130]
    assert.equal(calc.bst(150), 106 + 110 + 90 + 154 + 90 + 130);
  });

  test('returns 300 for unknown dex number', () => {
    assert.equal(calc.bst(9999), 300);
  });
});

// ─── countOffCov ──────────────────────────────────────────────────────────
describe('countOffCov', () => {
  test('single Fire-type covers Grass, Ice, Bug, Steel = 4 types', () => {
    const team = [mon(4, ['Fire'])];
    assert.equal(calc.countOffCov(team), 4);
  });

  test('diverse team covers more types than single Pokémon', () => {
    const single = [mon(1, ['Fire'])];
    const diverse = [mon(1, ['Fire']), mon(2, ['Water']), mon(3, ['Electric'])];
    assert.ok(calc.countOffCov(diverse) > calc.countOffCov(single));
  });

  test('counts move types toward coverage when moves are set', () => {
    // Normal-type Pokémon covers nothing by type, but add a Fire move
    const withoutMove = [mon(1, ['Normal'])];
    const withMove    = [mon(1, ['Normal'], [{ type: 'Fire' }])];
    assert.ok(calc.countOffCov(withMove) > calc.countOffCov(withoutMove));
  });

  test('empty team returns 0', () => {
    assert.equal(calc.countOffCov([]), 0);
  });
});

// ─── individualScore ──────────────────────────────────────────────────────
describe('individualScore', () => {
  test('Fire-type scores higher than Normal-type (Normal hits nothing 2×)', () => {
    const fire   = mon(6,  ['Fire']);   // hits Grass, Ice, Bug, Steel
    const normal = mon(143, ['Normal']); // hits nothing super-effectively
    assert.ok(calc.individualScore(fire) > calc.individualScore(normal));
  });

  test('higher BST breaks ties between equally-covering Pokémon', () => {
    // Both pure Water-type; Pokémon #9 (Blastoise, BST 530) vs #7 (Squirtle, BST 314)
    const blastoise = mon(9,  ['Water']);
    const squirtle  = mon(7, ['Water']);
    assert.ok(calc.individualScore(blastoise) > calc.individualScore(squirtle));
  });
});

// ─── marginalScore ────────────────────────────────────────────────────────
describe('marginalScore', () => {
  test('adding a type that covers new types scores higher than redundant coverage', () => {
    const team = [mon(1, ['Fire'])]; // already covers Grass, Ice, Bug, Steel
    const newCov  = mon(2, ['Water']); // covers Fire, Ground, Rock — all new
    const overlap = mon(3, ['Fire']);  // covers same types as existing Fire member
    assert.ok(calc.marginalScore(newCov, team) > calc.marginalScore(overlap, team));
  });

  test('stacked weakness penalises score', () => {
    // Team already has a Water-type (weak to Electric, Grass)
    const team = [mon(9, ['Water'])];
    // Adding another Water-type stacks both weaknesses
    const stackedWater    = mon(131, ['Water', 'Ice']); // weak to Electric, Rock, Fighting, Grass, Steel
    // Adding a Fire-type introduces different weaknesses
    const differentWeak   = mon(6,  ['Fire', 'Flying']); // weak to Water, Rock, Electric
    // The stacked water should be penalised more for shared Electric weakness with the existing Water
    const scoreStacked    = calc.marginalScore(stackedWater,   team);
    const scoreUnrelated  = calc.marginalScore(mon(68, ['Fighting']), team);
    // Fighting adds new coverage (Normal, Ice, Rock, Dark, Steel) with no shared weaknesses to Water
    // so it should score higher than adding another Water-weak type
    assert.ok(scoreUnrelated > scoreStacked);
  });

  test('higher BST breaks ties when coverage is equal', () => {
    // Two identical type coverage Pokémon — only BST differs
    const weak = { ...mon(7,  ['Water']), n: 7  }; // Squirtle, BST 314
    const strong = { ...mon(9, ['Water']), n: 9  }; // Blastoise, BST 530
    const team = [mon(4, ['Fire'])];
    assert.ok(calc.marginalScore(strong, team) > calc.marginalScore(weak, team));
  });
});

// ─── scoreTeam ────────────────────────────────────────────────────────────
describe('scoreTeam', () => {
  test('team with wider type coverage scores higher', () => {
    const diverse = [
      mon(6,   ['Fire', 'Flying']),
      mon(9,   ['Water']),
      mon(65,  ['Psychic']),
      mon(68,  ['Fighting']),
      mon(94,  ['Ghost', 'Poison']),
      mon(131, ['Water', 'Ice']),
    ];
    const mono = [
      mon(7,  ['Water']),
      mon(8,  ['Water']),
      mon(9,  ['Water']),
      mon(54, ['Water']),
      mon(60, ['Water']),
      mon(79, ['Water', 'Psychic']),
    ];
    assert.ok(calc.scoreTeam(diverse) > calc.scoreTeam(mono));
  });

  test('stacked weaknesses reduce the score', () => {
    // Base team: 6 diverse types
    const base = [
      mon(6,  ['Fire', 'Flying']),
      mon(9,  ['Water']),
      mon(65, ['Psychic']),
      mon(68, ['Fighting']),
      mon(94, ['Ghost', 'Poison']),
      mon(112,['Ground', 'Rock']),
    ];
    // Swap out Ground/Rock (Rock+Ground weak to Water) for another Water-type
    // This stacks Water weakness across more members
    const stacked = [
      mon(6,  ['Fire', 'Flying']),
      mon(9,  ['Water']),
      mon(65, ['Psychic']),
      mon(68, ['Fighting']),
      mon(94, ['Ghost', 'Poison']),
      mon(131,['Water', 'Ice']),
    ];
    assert.ok(calc.scoreTeam(base) >= calc.scoreTeam(stacked));
  });

  test('moves bonus: team with Fire move covers more and scores >= same team without', () => {
    const withoutMoves = [
      mon(1, ['Normal']),
      mon(2, ['Water']),
      mon(3, ['Electric']),
      mon(4, ['Fighting']),
      mon(5, ['Ground']),
      mon(6, ['Rock']),
    ];
    const withMoves = withoutMoves.map((p, i) =>
      i === 0 ? { ...p, moves: [{ type: 'Fire' }] } : p
    );
    assert.ok(calc.scoreTeam(withMoves) >= calc.scoreTeam(withoutMoves));
  });
});

// ─── buildGreedyTeam ──────────────────────────────────────────────────────
describe('buildGreedyTeam', () => {
  const pool = [
    mon(6,   ['Fire', 'Flying']),
    mon(9,   ['Water']),
    mon(65,  ['Psychic']),
    mon(68,  ['Fighting']),
    mon(94,  ['Ghost', 'Poison']),
    mon(131, ['Water', 'Ice']),
    mon(112, ['Ground', 'Rock']),
    mon(25,  ['Electric']),
  ];

  test('returns exactly 6 members from a larger pool', () => {
    const team = calc.buildGreedyTeam(pool, pool[0]);
    assert.equal(team.length, 6);
  });

  test('includes the seed as the first member', () => {
    const seed = pool[3];
    const team = calc.buildGreedyTeam(pool, seed);
    assert.equal(team[0], seed);
  });

  test('returns all members when pool size equals 6', () => {
    const small = pool.slice(0, 6);
    const team  = calc.buildGreedyTeam(small, small[0]);
    assert.equal(team.length, 6);
  });

  test('returns all available when pool is smaller than 6', () => {
    const tiny = pool.slice(0, 3);
    const team = calc.buildGreedyTeam(tiny, tiny[0]);
    assert.equal(team.length, 3);
  });

  test('no duplicate members in the team', () => {
    const team = calc.buildGreedyTeam(pool, pool[0]);
    const unique = new Set(team.map(m => m.n));
    assert.equal(unique.size, team.length);
  });
});

// ─── computeSuggestions ───────────────────────────────────────────────────
describe('computeSuggestions', () => {
  const pool = [
    mon(6,   ['Fire', 'Flying']),
    mon(9,   ['Water']),
    mon(65,  ['Psychic']),
    mon(68,  ['Fighting']),
    mon(94,  ['Ghost', 'Poison']),
    mon(131, ['Water', 'Ice']),
    mon(112, ['Ground', 'Rock']),
    mon(25,  ['Electric']),
    mon(3,   ['Grass', 'Poison']),
  ];

  test('returns empty array for empty pool', () => {
    assert.equal(calc.computeSuggestions([]).length, 0);
  });

  test('returns at most 5 suggestions by default', () => {
    const results = calc.computeSuggestions(pool);
    assert.ok(results.length <= 5);
    assert.ok(results.length >= 1);
  });

  test('respects maxResults parameter', () => {
    const results = calc.computeSuggestions(pool, 2);
    assert.ok(results.length <= 2);
  });

  test('suggestions are sorted by score descending', () => {
    const results = calc.computeSuggestions(pool);
    for(let i = 1; i < results.length; i++) {
      assert.ok(results[i-1].score >= results[i].score,
        `suggestion ${i-1} score ${results[i-1].score} should be >= suggestion ${i} score ${results[i].score}`);
    }
  });

  test('each suggestion has 6 members when pool is large enough', () => {
    const results = calc.computeSuggestions(pool);
    results.forEach((s, i) => {
      assert.equal(s.members.length, 6, `suggestion ${i} should have 6 members`);
    });
  });

  test('each suggestion has a coverage count between 0 and 18', () => {
    const results = calc.computeSuggestions(pool);
    results.forEach((s, i) => {
      assert.ok(s.coverage >= 0 && s.coverage <= 18,
        `suggestion ${i} coverage ${s.coverage} out of range`);
    });
  });

  test('no duplicate teams across suggestions', () => {
    const results = calc.computeSuggestions(pool);
    const keys = results.map(s => s.members.map(m => m.n).sort((a,b)=>a-b).join(','));
    const unique = new Set(keys);
    assert.equal(unique.size, keys.length, 'duplicate team found');
  });

  test('works with pool of exactly 6', () => {
    const tiny = pool.slice(0, 6);
    const results = calc.computeSuggestions(tiny);
    assert.equal(results.length, 1);
    assert.equal(results[0].members.length, 6);
  });

  test('preserves extra properties on pool members (e.g. _src, _srcIdx)', () => {
    const tagged = pool.map((pm, i) => ({ ...pm, _src: 'pc', _srcIdx: i }));
    const results = calc.computeSuggestions(tagged);
    results.forEach(s => {
      s.members.forEach(m => {
        assert.ok('_src' in m, 'missing _src on returned member');
        assert.ok('_srcIdx' in m, 'missing _srcIdx on returned member');
      });
    });
  });
});
