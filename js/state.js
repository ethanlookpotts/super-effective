// ═══════════════════════════════
// STATE — multi-playthrough
// Persistence handled by DataManager (js/data-manager.js)
// ═══════════════════════════════
// store = { playthroughs: [...], activePtId: '...' }
// playthrough = { id, name, gameId, party[], recents[] }
// party member = { n, name, types[], moves[], level }
// move = { name, type }
let store = { playthroughs: [], activePtId: null };

// ═══════════════════════════════
// GAME REGISTRY
// ═══════════════════════════════
const GAMES = [
  { gen: 'III', region: 'Kanto', games: [
    { id: 'frlg-fr', name: 'FireRed', icon: '🔴' },
    { id: 'frlg-lg', name: 'LeafGreen', icon: '🟢' },
  ]},
];

function makePt(name, gameId){
  return { id: crypto.randomUUID(), name, gameId: gameId||'frlg-fr', party: [], pc: [], recents: [], rivalStarter: 'bulbasaur', tmInventory: {} };
}

function activePt(){
  return store.playthroughs.find(p=>p.id===store.activePtId) || store.playthroughs[0];
}

// ═══════════════════════════════
// SEARCH STATE
// ═══════════════════════════════
let activePoke = null;
let activeTypeFilter = null;
let activeMove = null; // move name when viewing move detail (who can learn it)

// Modal state
let mSlot = -1, mPoke = null, mMoves = [], mTypeFilter = null, mMoveQ = '', mLv = '', mNature = '';
let mHPPicking = false; // true while the Hidden Power type selector is open
let mMovesOpen = false; // moves section collapsed by default
let mInfoOpen = false;  // info section (ability/item/gender/stats) collapsed by default
let mAbility = '';
let mItem = '';
let mGender = '';       // 'M' | 'F' | ''
let mStats = null;      // { hp, atk, def, spatk, spdef, spe } — actual in-game max stats
let mShiny = false;
let mOtName = '';
let mOtId = '';
let mPokeball = '';
let mTrainerMemo = '';
let mScanResult = null; // last scan result — persists across renderModal() calls
let mMode = 'party';   // 'party' | 'pc' — determines where saveModal() writes

// ═══════════════════════════════
// RIVAL STARTER — stored per playthrough
// one of: 'bulbasaur' | 'charmander' | 'squirtle'
// ═══════════════════════════════
function setRivalStarter(s){
  activePt().rivalStarter = s;
  DataManager.save();
  renderGyms();
}

function getLearnset(dexNum){
  const moves = LEARNSETS[dexNum] || [];
  return new Set(moves);
}

// Combined party + PC as a single pool tagged with _src and _srcIdx so callers
// can later map suggestions / learners / carriers back to their origin slot.
function taggedPool(pt){
  pt = pt || activePt();
  if(!pt) return [];
  return [
    ...(pt.party || []).map((pm,idx) => ({ ...pm, _src:'party', _srcIdx: idx })),
    ...(pt.pc    || []).map((pm,idx) => ({ ...pm, _src:'pc',    _srcIdx: idx })),
  ];
}

// ═══════════════════════════════
// RECENT HELPERS
// ═══════════════════════════════
function addRecent(p){
  const pt = activePt();
  pt.recents = pt.recents.filter(r=>r.n!==p.n);
  pt.recents.unshift({n:p.n,name:p.name,types:p.types});
  if(pt.recents.length>6) pt.recents.pop();
  DataManager.save();
}
