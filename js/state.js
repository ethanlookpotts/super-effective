// ═══════════════════════════════
// STATE — multi-playthrough
// localStorage key: 'se_v1'
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

function loadStore(){
  try {
    const raw = localStorage.getItem('se_v1');
    if(raw) store = JSON.parse(raw);
  } catch(e){}
  // Migrate playthroughs with legacy gameId 'frlg' → 'frlg-fr'
  if(store.playthroughs) store.playthroughs.forEach(pt=>{
    if(!pt.gameId || pt.gameId==='frlg') pt.gameId='frlg-fr';
  });
  if(store.playthroughs && store.playthroughs.length){
    if(!store.activePtId || !store.playthroughs.find(p=>p.id===store.activePtId)){
      store.activePtId = store.playthroughs[0].id;
    }
    saveStore();
  }
  // If no playthroughs: leave empty — init.js will show the game gate
}

function saveStore(){
  localStorage.setItem('se_v1', JSON.stringify(store));
}

function makePt(name, gameId){
  return { id: crypto.randomUUID(), name, gameId: gameId||'frlg-fr', party: [], recents: [] };
}

function activePt(){
  return store.playthroughs.find(p=>p.id===store.activePtId) || store.playthroughs[0];
}

// ═══════════════════════════════
// SEARCH STATE
// ═══════════════════════════════
let activePoke = null;
let activeTypeFilter = null;

// Modal state
let mSlot = -1, mPoke = null, mMoves = [], mTypeFilter = null, mMoveQ = '', mLv = '';
let mHPPicking = false; // true while the Hidden Power type selector is open

// ═══════════════════════════════
// RIVAL STARTER
// localStorage key: 'se_starter'  one of: 'bulbasaur' | 'charmander' | 'squirtle'
// ═══════════════════════════════
let rivalStarter = 'bulbasaur';
function loadRivalStarter(){
  try{ const r = localStorage.getItem('se_starter'); if(r) rivalStarter = r; }catch(e){}
}
function saveRivalStarter(){
  try{ localStorage.setItem('se_starter', rivalStarter); }catch(e){}
}
function setRivalStarter(s){
  rivalStarter = s;
  saveRivalStarter();
  renderGyms();
}

function getLearnset(dexNum){
  const moves = LEARNSETS[dexNum] || [];
  return new Set(moves);
}

// ═══════════════════════════════
// RECENT HELPERS
// ═══════════════════════════════
function addRecent(p){
  const pt = activePt();
  pt.recents = pt.recents.filter(r=>r.n!==p.n);
  pt.recents.unshift({n:p.n,name:p.name,types:p.types});
  if(pt.recents.length>6) pt.recents.pop();
  saveStore();
}
