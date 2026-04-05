// ═══════════════════════════════
// STATE — multi-playthrough
// localStorage key: 'se_v1'
// ═══════════════════════════════
// store = { playthroughs: [...], activePtId: '...' }
// playthrough = { id, name, gameId, party[], recents[] }
// party member = { n, name, types[], moves[], level }
// move = { name, type }
let store = { playthroughs: [], activePtId: null };

function loadStore(){
  try {
    const raw = localStorage.getItem('se_v1');
    if(raw) store = JSON.parse(raw);
  } catch(e){}
  if(!store.playthroughs || !store.playthroughs.length){
    const pt = makePt('RUN 1');
    store.playthroughs = [pt];
    store.activePtId = pt.id;
    saveStore();
  }
  if(!store.activePtId || !store.playthroughs.find(p=>p.id===store.activePtId)){
    store.activePtId = store.playthroughs[0].id;
    saveStore();
  }
}

function saveStore(){
  localStorage.setItem('se_v1', JSON.stringify(store));
}

function makePt(name){
  return { id: crypto.randomUUID(), name, gameId: 'frlg', party: [], recents: [] };
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
let mLearnset = null; // null=loading, false=failed/unknown, Set=ready

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

// ═══════════════════════════════
// LEARNSET CACHE
// localStorage key: 'se_learnsets_v1'  { [dexNum]: string[] }
// ═══════════════════════════════
let learnsetCache = {};
function loadLearnsetCache(){
  try { const r = localStorage.getItem('se_learnsets_v1'); if(r) learnsetCache = JSON.parse(r); } catch(e){}
}
function saveLearnsetCache(){
  try { localStorage.setItem('se_learnsets_v1', JSON.stringify(learnsetCache)); } catch(e){}
}

// Normalize move names for comparison: lowercase, strip all non-alphanumeric
// Handles mismatches like "Double-Edge" vs "double-edge", "Thunder Shock" vs "thunder-shock"
function normMoveName(s){ return s.toLowerCase().replace(/[^a-z0-9]/g,''); }

function fetchLearnset(dexNum){
  if(learnsetCache[dexNum]){
    mLearnset = new Set(learnsetCache[dexNum].map(normMoveName));
    renderMoveSection();
    return;
  }
  mLearnset = null;
  renderMoveSection();
  fetch('https://pokeapi.co/api/v2/pokemon/'+dexNum+'/')
    .then(r=>r.json())
    .then(data=>{
      const slugs = [];
      (data.moves||[]).forEach(m=>{
        const inFRLG = m.version_group_details.some(v=>v.version_group.name==='firered-leafgreen');
        if(inFRLG) slugs.push(m.move.name);
      });
      learnsetCache[dexNum] = slugs;
      saveLearnsetCache();
      if(mPoke && mPoke.n===dexNum){
        mLearnset = new Set(slugs.map(normMoveName));
        renderMoveSection();
      }
    })
    .catch(()=>{
      if(mPoke && mPoke.n===dexNum){ mLearnset = false; renderMoveSection(); }
    });
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
