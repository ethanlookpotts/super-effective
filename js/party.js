// ═══════════════════════════════
// EVOLVE PARTY MEMBER
// ═══════════════════════════════
function evolvePartyMember(fromN, toN){
  const pt = activePt();
  const member = pt.party.find(m=>m.n===fromN);
  if(!member) return;
  const toPoke = POKEMON.find(p=>p.n===toN);
  if(!toPoke) return;
  const oldName = member.name;
  member.n = toN;
  member.name = toPoke.name;
  member.types = [...toPoke.types];
  saveStore();
  activePoke = toPoke;
  document.getElementById('s-in').value = toPoke.name;
  addRecent(toPoke);
  renderParty();
  renderSearch();
  showToast(oldName + ' evolved to ' + toPoke.name + '!');
}

// ═══════════════════════════════
// ADD TO PARTY
// ═══════════════════════════════
function addToParty(n){
  const pt = activePt();
  const poke = POKEMON.find(p=>p.n===n);
  if(!poke) return;
  if(pt.party.length >= 6){
    openSwapModal(n);
  } else {
    pt.party.push({n:poke.n, name:poke.name, types:poke.types, moves:[], level:''});
    saveStore();
    showToast('Added to party');
    if(activePoke && activePoke.n===n) renderPokeDetail();
    renderParty();
  }
}

// ═══════════════════════════════
// PARTY PAGE
// ═══════════════════════════════
function renderParty(){
  const pt = activePt();
  const g = document.getElementById('party-grid');
  let html = '';
  pt.party.forEach((pm,i)=>{
    const tb = pm.types.map(t=>`<span class="tb sm t-${t}">${t}</span>`).join('');
    const mv = pm.moves && pm.moves.length
      ? pm.moves.map(m=>`<div class="ps-mv">▸ ${m.name}</div>`).join('')
      : `<div class="ps-mv" style="color:var(--text3);font-style:italic;font-size:9px;">no moves set</div>`;
    const lvTxt = pm.level ? `<span class="ps-lv">Lv.${pm.level}</span>` : '';
    html += `<div class="pslot filled" role="button" aria-label="Edit ${pm.name}" onclick="openModal(${i})">
      <div class="ps-num">#${String(pm.n).padStart(3,'0')}</div>
      <div class="ps-head"><span class="ps-name">${pm.name}</span>${lvTxt}</div>
      <div class="ps-types">${tb}</div>
      <div class="ps-moves">${mv}</div>
    </div>`;
  });
  for(let i=pt.party.length; i<6; i++){
    html += `<div class="pslot empty-s" onclick="openModal(-1)"><div class="ps-icon">＋</div><div class="ps-add">ADD POKEMON</div></div>`;
  }
  g.innerHTML = html;
  document.getElementById('party-ct').textContent = pt.party.length ? `${pt.party.length} / 6 IN PARTY` : '';
  renderCoverage();
}

function renderCoverage(){
  const pt = activePt();
  const wrap = document.getElementById('cov-wrap');
  const bar = document.getElementById('cov-bar');
  if(!pt.party.length){ wrap.style.display='none'; return; }
  wrap.style.display = 'block';
  const covered = new Set();
  pt.party.forEach(pm=>{
    const atkTypes = [...pm.types, ...(pm.moves||[]).map(m=>m.type)];
    TYPES.forEach(def=>{if(atkTypes.some(at=>gm(at,def)>=2)) covered.add(def);});
  });
  bar.innerHTML = TYPES.map(t=>`<span class="cdot t-${t}${covered.has(t)?' covered':' gap'}" data-type="${t}" onclick="setTypeAndSearch('${t}')">${t.slice(0,3).toUpperCase()}</span>`).join('');
}

// ═══════════════════════════════
// PARTY EDIT MODAL
// ═══════════════════════════════
function openModal(idx){
  const pt = activePt();
  mSlot = idx;
  mLearnset = null;
  if(idx>=0 && idx<pt.party.length){
    const pm = pt.party[idx];
    mPoke = {n:pm.n, name:pm.name, types:pm.types};
    mMoves = [...(pm.moves||[])];
    mLv = pm.level||'';
    fetchLearnset(pm.n);
  } else {
    mPoke = null; mMoves = []; mLv = '';
  }
  mTypeFilter = null; mMoveQ = '';
  document.getElementById('modal-ttl').textContent = (idx>=0 && idx<pt.party.length) ? 'EDIT POKEMON' : 'ADD POKEMON';
  renderModal();
  document.getElementById('overlay').classList.add('open');
}
function closeModal(){
  document.getElementById('overlay').classList.remove('open');
  mPoke = null; mMoves = [];
}
function oClick(e){ if(e.target===document.getElementById('overlay')) closeModal(); }

function renderModal(){
  const body = document.getElementById('modal-body');
  const pt = activePt();
  let html = `<div class="mlbl">STEP 1 — CHOOSE POKEMON</div>
  <div class="sbox" style="margin-bottom:8px;">
    <input class="si" id="ms-in" placeholder="Search Pokémon..." oninput="onMS(this.value)"
      autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" value="${mPoke?mPoke.name:''}">
    <button class="xcl" id="ms-cl" onclick="clearMP()" style="display:${mPoke?'block':'none'}">✕</button>
  </div>
  <div id="ms-drop" class="pdrop" style="display:none;margin:0;border-radius:var(--r);border-top:1.5px solid var(--border2);margin-bottom:8px;"></div>`;

  if(mPoke){
    const tb = mPoke.types.map(t=>`<span class="tb t-${t}">${t}</span>`).join(' ');
    html += `<div style="background:var(--card2);border:1px solid var(--border2);border-radius:9px;padding:9px 12px;margin-bottom:10px;">
      <div style="font-size:10px;color:var(--text3);margin-bottom:2px;">#${String(mPoke.n).padStart(3,'0')}</div>
      <div style="font-family:var(--fp);font-size:8.5px;color:var(--gold);margin-bottom:5px;">${mPoke.name}</div>
      <div>${tb}</div>
    </div>
    <div style="margin-bottom:12px;">
      <div class="field-lbl">LEVEL (OPTIONAL)</div>
      <input class="field-in" id="f-lv" type="number" min="1" max="100" placeholder="—" value="${mLv}" oninput="mLv=this.value" style="width:90px;">
    </div>`;
  }

  html += `<div class="mlbl" style="margin-top:12px;">STEP 2 — MOVES (OPTIONAL, MAX 4)</div>
  <div id="move-section"></div>`;

  html += `<button class="save-btn" onclick="saveModal()" ${mPoke?'':'disabled'}>${mSlot>=0&&mSlot<pt.party.length?'💾 SAVE CHANGES':'➕ ADD TO PARTY'}</button>`;
  if(mSlot>=0 && mSlot<pt.party.length) html+=`<button class="rm-btn" onclick="rmParty(${mSlot})">✕ REMOVE FROM PARTY</button>`;

  const sp = body.scrollTop; body.innerHTML = html; body.scrollTop = sp;
  renderMoveSection();
}

function renderMoveSection(){
  const container = document.getElementById('move-section');
  if(!container) return;
  const body = document.getElementById('modal-body');
  const sp = body.scrollTop;
  let html = `<div class="sdots">`;
  for(let i=0;i<4;i++){
    if(i<mMoves.length) html+=`<div class="sdot on t-${mMoves[i].type}"></div>`;
    else html+=`<div class="sdot"></div>`;
  }
  html += `</div>`;

  mMoves.forEach((mv,i)=>{
    const phys = PHYS.has(mv.type);
    html += `<div class="pmrow"><span class="tb sm t-${mv.type}">${mv.type}</span><span class="pm-name">${mv.name}</span><span class="pm-stat" style="color:${phys?'#907030':'#5080b8'}">${phys?'PHY':'SPE'}</span><button class="pm-rm" onclick="rmMv(${i})">✕</button></div>`;
  });

  if(mMoves.length < 4){
    if(mPoke && mLearnset === null){
      html += `<div style="font-family:var(--fp);font-size:5px;color:var(--text3);text-align:center;padding:12px 0;">LOADING MOVES…</div>`;
      container.innerHTML = html;
      body.scrollTop = sp;
      return;
    }
    html += `<div class="sbox" style="margin-top:10px;margin-bottom:7px;">
      <input class="move-si" id="mv-q" placeholder="Search moves..." oninput="onMQ(this.value)" value="${mMoveQ}"
        autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
    </div>
    <div class="tf-row">`;
    TYPES.forEach(t=>{html+=`<div class="tf t-${t}${mTypeFilter===t?' active':''}" onclick="setMTF('${t}')">${t}</div>`;});
    html += `</div>`;
    const q = mMoveQ.toLowerCase();
    // Filter to learnable moves when learnset is ready; show all on failure or when no Pokémon selected
    const pool = (mPoke && mLearnset instanceof Set)
      ? ALL_MOVES.filter(mv=>mLearnset.has(normMoveName(mv.name)))
      : ALL_MOVES;
    const picked = pool.filter(mv=>mMoves.some(m=>m.name===mv.name)&&(!mTypeFilter||mv.type===mTypeFilter)&&(!q||mv.name.toLowerCase().includes(q)));
    const rest = pool.filter(mv=>!mMoves.some(m=>m.name===mv.name)&&(!mTypeFilter||mv.type===mTypeFilter)&&(!q||mv.name.toLowerCase().includes(q)));
    const display = [...picked,...rest].slice(0,50);
    html += `<div class="move-results">`;
    if(!display.length) html+=`<div class="no-moves">No moves found</div>`;
    else display.forEach(mv=>{
      const ip = mMoves.some(m=>m.name===mv.name);
      const cc = mv.cat==='phy'?'mres-phy':mv.cat==='spe'?'mres-spe':'mres-sta';
      const cl = mv.cat==='phy'?'PHY':mv.cat==='spe'?'SPE':'STA';
      html+=`<div class="mres-row${ip?' picked':''}" onclick="togMv('${mv.name}','${mv.type}')">
        <span class="tb sm t-${mv.type}">${mv.type}</span>
        <span class="mres-name">${mv.name}</span>
        <span class="mres-tags"><span class="mres-cat ${cc}">${cl}</span>${ip?'<span class="mres-chk">✓</span>':''}</span>
      </div>`;
    });
    html += `</div>`;
  }

  container.innerHTML = html;
  body.scrollTop = sp;
  if(mMoveQ){ const q=document.getElementById('mv-q'); if(q){q.focus();q.setSelectionRange(mMoveQ.length,mMoveQ.length);} }
}

function onMS(v){
  document.getElementById('ms-cl').style.display = v ? 'block' : 'none';
  if(!v.trim()){ document.getElementById('ms-drop').style.display='none'; return; }
  const list = POKEMON.filter(p=>p.name.toLowerCase().includes(v.toLowerCase())).slice(0,8);
  renderPDrop('ms-drop', list, 'pickMP');
}
function pickMP(n){ mPoke=POKEMON.find(p=>p.n===n); mMoves=[]; mLearnset=null; document.getElementById('ms-drop').style.display='none'; renderModal(); document.getElementById('ms-in').value=mPoke.name; fetchLearnset(n); }
function clearMP(){ mPoke=null; mMoves=[]; mLv=''; mLearnset=null; renderModal(); }
function onMQ(v){ mMoveQ=v; renderMoveSection(); }
function setMTF(t){ mTypeFilter=mTypeFilter===t?null:t; mMoveQ=''; renderMoveSection(); }
function togMv(name,type){ const idx=mMoves.findIndex(m=>m.name===name); if(idx>=0) mMoves.splice(idx,1); else{if(mMoves.length>=4)return; mMoves.push({name,type});} renderMoveSection(); }
function rmMv(i){ mMoves.splice(i,1); renderMoveSection(); }

function saveModal(){
  if(!mPoke) return;
  const pt = activePt();
  const lv = document.getElementById('f-lv');
  const entry = {n:mPoke.n, name:mPoke.name, types:mPoke.types, moves:[...mMoves], level:lv?lv.value:''};
  if(mSlot>=0 && mSlot<pt.party.length) pt.party[mSlot]=entry;
  else { if(pt.party.length>=6) return; pt.party.push(entry); }
  saveStore(); closeModal(); renderParty();
  if(activePoke) renderPokeDetail();
}

function rmParty(i){
  const pt = activePt();
  pt.party.splice(i,1);
  saveStore(); closeModal(); renderParty();
  if(activePoke) renderPokeDetail();
}

// ═══════════════════════════════
// PC SWAP MODAL
// ═══════════════════════════════
let swapTargetN = null;

function openSwapModal(n){
  swapTargetN = n;
  const pt = activePt();
  const body = document.getElementById('swap-body');
  body.innerHTML = `<div style="font-family:var(--fp);font-size:5.5px;color:var(--text3);margin-bottom:10px;line-height:1.8;">PARTY FULL — TAP A POKEMON TO REPLACE IT</div>` +
    pt.party.map((pm,i)=>`
      <div class="swap-row" onclick="swapIn(${i})">
        <img class="swap-row-sprite" src="${spriteUrl(pm.n)}" onerror="this.style.display='none'">
        <span class="swap-row-name">${pm.name}</span>
        <span class="swap-row-types">${pm.types.map(t=>`<span class="tb sm t-${t}">${t}</span>`).join('')}</span>
      </div>`).join('');
  document.getElementById('swap-overlay').classList.add('open');
}
function closeSwapModal(){ document.getElementById('swap-overlay').classList.remove('open'); swapTargetN=null; }
function swapOvClick(e){ if(e.target===document.getElementById('swap-overlay')) closeSwapModal(); }

function swapIn(slotIdx){
  if(swapTargetN===null) return;
  const pt = activePt();
  const poke = POKEMON.find(p=>p.n===swapTargetN);
  if(!poke) return;
  pt.party[slotIdx] = {n:poke.n, name:poke.name, types:poke.types, moves:[], level:''};
  saveStore();
  closeSwapModal();
  showToast('Swapped in '+poke.name);
  renderParty();
  if(activePoke) renderPokeDetail();
}
