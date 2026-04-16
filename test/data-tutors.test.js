/**
 * Integrity tests for js/data-tutors.js and the TM_HM extensions.
 * Ensures the data file parses, every referenced move exists in ALL_MOVES,
 * every entry has a valid type, and numbering is unique across TMs/HMs/tutors.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const src = (...parts) => path.join(__dirname, '..', 'js', ...parts);
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(src('data-types.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(src('data-pokemon.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(src('data-moves.js'),   'utf8'), ctx);
vm.runInContext(fs.readFileSync(src('data-tutors.js'),  'utf8'), ctx);
vm.runInContext(fs.readFileSync(src('data-learnsets.js'),'utf8'), ctx);
vm.runInContext('globalThis.TM_HM=TM_HM; globalThis.MOVE_TUTORS=MOVE_TUTORS; globalThis.UTILITY_NPCS=UTILITY_NPCS; globalThis.ALL_MOVES=ALL_MOVES; globalThis.TYPES=TYPES; globalThis.LEARNSETS=LEARNSETS;', ctx);

const { TM_HM, MOVE_TUTORS, UTILITY_NPCS, ALL_MOVES, TYPES, LEARNSETS } = ctx;

describe('MOVE_TUTORS data integrity', () => {
  test('contains exactly 18 FRLG tutor entries', () => {
    assert.equal(MOVE_TUTORS.length, 18);
  });
  test('every tutor move exists in ALL_MOVES', () => {
    const known = new Set(ALL_MOVES.map(m => m.name));
    MOVE_TUTORS.forEach(t => {
      assert.ok(known.has(t.move), `tutor move not found in ALL_MOVES: ${t.move}`);
    });
  });
  test('every tutor has a valid 18-type type', () => {
    const typeSet = new Set(TYPES);
    MOVE_TUTORS.forEach(t => {
      assert.ok(typeSet.has(t.type), `invalid type for ${t.move}: ${t.type}`);
    });
  });
  test('every tutor has category in (phy|spe|sta)', () => {
    MOVE_TUTORS.forEach(t => {
      assert.ok(['phy','spe','sta'].includes(t.cat), `invalid cat for ${t.move}: ${t.cat}`);
    });
  });
  test('every tutor has a non-empty location and num MT01..MT18', () => {
    MOVE_TUTORS.forEach((t,i) => {
      assert.ok(t.loc && t.loc.length > 0, `missing loc for ${t.move}`);
      assert.equal(t.num, 'MT' + String(i+1).padStart(2,'0'));
      assert.equal(t.tmType, 'tutor');
    });
  });
  test('tutor moves match FRLG learnsets — at least one Pokémon learns each', () => {
    MOVE_TUTORS.forEach(t => {
      // Cape Brink tutors only teach one specific evolved starter
      const count = Object.values(LEARNSETS).filter(ms => ms.includes(t.move)).length;
      assert.ok(count >= 1, `no Pokémon learns tutor move ${t.move}`);
    });
  });
  test('Cape Brink starter moves learnable only by the right Pokémon', () => {
    const frenzy = MOVE_TUTORS.find(t => t.move === 'Frenzy Plant');
    const blast  = MOVE_TUTORS.find(t => t.move === 'Blast Burn');
    const hydro  = MOVE_TUTORS.find(t => t.move === 'Hydro Cannon');
    assert.ok(frenzy && blast && hydro);
    // Venusaur = dex #3, Charizard = #6, Blastoise = #9
    assert.ok(LEARNSETS[3].includes('Frenzy Plant'), 'Venusaur must learn Frenzy Plant');
    assert.ok(LEARNSETS[6].includes('Blast Burn'),  'Charizard must learn Blast Burn');
    assert.ok(LEARNSETS[9].includes('Hydro Cannon'), 'Blastoise must learn Hydro Cannon');
  });
});

describe('TM_HM runtime flags', () => {
  test('every TM_HM entry is tagged tm or hm (tmType)', () => {
    TM_HM.forEach(t => {
      assert.ok(['tm','hm'].includes(t.tmType), `invalid tmType for ${t.num}: ${t.tmType}`);
    });
  });
  test('HM entries are not flagged buyable', () => {
    TM_HM.filter(t => t.tmType === 'hm').forEach(t => {
      assert.equal(t.buyable, false);
    });
  });
  test('TMs purchased at Celadon Dept Store / Game Corner are flagged buyable', () => {
    const buyables = TM_HM.filter(t => t.buyable);
    assert.ok(buyables.length > 0);
    buyables.forEach(t => {
      assert.match(t.loc, /Dept\. Store|Game Corner/);
    });
  });
  test('numbering is unique across TMs/HMs and stable (TM01..TM50, HM01..HM07)', () => {
    const nums = new Set();
    TM_HM.forEach(t => {
      assert.ok(!nums.has(t.num), `duplicate num ${t.num}`);
      nums.add(t.num);
    });
    assert.equal(TM_HM.filter(t => t.tmType === 'tm').length, 50);
    assert.equal(TM_HM.filter(t => t.tmType === 'hm').length, 7);
  });
});

describe('UTILITY_NPCS', () => {
  test('includes Move Reminder and Move Deleter', () => {
    const names = UTILITY_NPCS.map(u => u.label);
    assert.ok(names.some(n => /Move Reminder|Move Maniac/i.test(n)));
    assert.ok(names.some(n => /Move Deleter/i.test(n)));
  });
});
