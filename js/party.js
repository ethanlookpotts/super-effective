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
  renderSuggestBtn();
  renderPC();
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
  mHPPicking = false;
  if(idx>=0 && idx<pt.party.length){
    const pm = pt.party[idx];
    mPoke = {n:pm.n, name:pm.name, types:pm.types};
    mMoves = [...(pm.moves||[])];
    mLv = pm.level||'';
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
    html += `<div class="pmrow"><span class="tb sm t-${mv.type}">${mv.type}</span><span class="pm-name">${mv.name}</span><span class="pm-stat" style="color:${phys?'#907030':'#5080b8'}">${phys?'PHY':'SPE'}</span><button class="pm-rm" aria-label="Remove ${mv.name}" onclick="rmMv(${i})">✕</button></div>`;
  });

  if(mMoves.length < 4){
    html += `<div class="sbox" style="margin-top:10px;margin-bottom:7px;">
      <input class="move-si" id="mv-q" placeholder="Search moves..." oninput="onMQ(this.value)" value="${mMoveQ}"
        autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
    </div>
    <div class="tf-row">`;
    TYPES.forEach(t=>{html+=`<div class="tf t-${t}${mTypeFilter===t?' active':''}" onclick="setMTF('${t}')">${t}</div>`;});
    html += `</div>`;
    const q = mMoveQ.toLowerCase();
    const learnset = mPoke ? getLearnset(mPoke.n) : null;
    const pool = learnset ? ALL_MOVES.filter(mv=>learnset.has(mv.name)) : ALL_MOVES;
    const picked = pool.filter(mv=>mMoves.some(m=>m.name===mv.name)&&(!mTypeFilter||mv.type===mTypeFilter)&&(!q||mv.name.toLowerCase().includes(q)));
    const rest = pool.filter(mv=>!mMoves.some(m=>m.name===mv.name)&&(!mTypeFilter||mv.type===mTypeFilter)&&(!q||mv.name.toLowerCase().includes(q)));
    const display = [...picked,...rest].slice(0,50);
    html += `<div class="move-results">`;
    if(!display.length) html+=`<div class="no-moves">No moves found</div>`;
    else display.forEach(mv=>{
      if(mv.name==='Hidden Power'){
        const ip = mMoves.some(m=>m.name==='Hidden Power');
        if(ip){
          const chosenType = mMoves.find(m=>m.name==='Hidden Power').type;
          html+=`<div class="mres-row picked" onclick="togMv('Hidden Power','${chosenType}')">
            <span class="tb sm t-${chosenType}">${chosenType}</span>
            <span class="mres-name">Hidden Power</span>
            <span class="mres-tags"><span class="mres-cat mres-spe">SPE</span><span class="mres-chk">✓</span></span>
          </div>`;
        } else {
          html+=`<div class="mres-row${mHPPicking?' picked':''}" onclick="pickHPType()" aria-label="Hidden Power — select type">
            <span class="tb sm t-hidden-power">HP</span>
            <span class="mres-name">Hidden Power</span>
            <span class="mres-tags"><span class="mres-cat mres-spe">SPE</span>${mHPPicking?'<span class="mres-chk">▾</span>':''}</span>
          </div>`;
          if(mHPPicking) html+=`<div class="tf-row hp-type-picker" aria-label="Select Hidden Power type">${TYPES.filter(t=>t!=='Fairy').map(t=>`<div class="tf t-${t}" onclick="selectHPType('${t}')">${t}</div>`).join('')}</div>`;
        }
      } else {
        const ip = mMoves.some(m=>m.name===mv.name);
        const cc = mv.cat==='phy'?'mres-phy':mv.cat==='spe'?'mres-spe':'mres-sta';
        const cl = mv.cat==='phy'?'PHY':mv.cat==='spe'?'SPE':'STA';
        html+=`<div class="mres-row${ip?' picked':''}" onclick="togMv('${mv.name}','${mv.type}')">
          <span class="tb sm t-${mv.type}">${mv.type}</span>
          <span class="mres-name">${mv.name}</span>
          <span class="mres-tags"><span class="mres-cat ${cc}">${cl}</span>${ip?'<span class="mres-chk">✓</span>':''}</span>
        </div>`;
      }
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
function pickMP(n){ mPoke=POKEMON.find(p=>p.n===n); mMoves=[]; mHPPicking=false; document.getElementById('ms-drop').style.display='none'; renderModal(); document.getElementById('ms-in').value=mPoke.name; }
function clearMP(){ mPoke=null; mMoves=[]; mLv=''; mHPPicking=false; renderModal(); }
function pickHPType(){ mHPPicking=!mHPPicking; renderMoveSection(); }
function selectHPType(t){ mMoves.push({name:'Hidden Power',type:t}); mHPPicking=false; renderMoveSection(); }
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
// PC SWAP MODAL (search → party)
// ═══════════════════════════════
let swapTargetN = null;
let swapSourcePcIdx = -1;

function openSwapModal(n){
  swapTargetN = n;
  swapSourcePcIdx = -1;
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
function closeSwapModal(){ document.getElementById('swap-overlay').classList.remove('open'); swapTargetN=null; swapSourcePcIdx=-1; }
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

// ═══════════════════════════════
// PC BOX
// ═══════════════════════════════
let pcCollapsed = false;
let pcConfirmIdx = -1;

function addToPC(n){
  const pt = activePt();
  const poke = POKEMON.find(p=>p.n===n);
  if(!poke) return;
  pt.pc.push({n:poke.n, name:poke.name, types:[...poke.types], moves:[], level:''});
  saveStore();
  showToast('Sent to PC Box');
  if(activePoke && activePoke.n===n) renderPokeDetail();
  renderSuggestBtn();
  renderPC();
}

function confirmRemovePC(idx){
  pcConfirmIdx = idx;
  renderPC();
}
function cancelRemovePC(){
  pcConfirmIdx = -1;
  renderPC();
}
function removeFromPC(idx){
  const pt = activePt();
  pt.pc.splice(idx, 1);
  pcConfirmIdx = -1;
  saveStore();
  renderSuggestBtn();
  renderPC();
}

function moveToPartyFromPC(idx){
  const pt = activePt();
  const pm = pt.pc[idx];
  if(!pm) return;
  if(pt.party.length >= 6){
    swapSourcePcIdx = idx;
    const body = document.getElementById('swap-body');
    body.innerHTML = `<div style="font-family:var(--fp);font-size:5.5px;color:var(--text3);margin-bottom:10px;line-height:1.8;">PARTY FULL — TAP A POKÉMON TO REPLACE IT</div>` +
      pt.party.map((pm2,i)=>`
        <div class="swap-row" onclick="swapInFromPC(${i})">
          <img class="swap-row-sprite" src="${spriteUrl(pm2.n)}" onerror="this.style.display='none'">
          <span class="swap-row-name">${pm2.name}</span>
          <span class="swap-row-types">${pm2.types.map(t=>`<span class="tb sm t-${t}">${t}</span>`).join('')}</span>
        </div>`).join('');
    document.getElementById('swap-overlay').classList.add('open');
  } else {
    pt.party.push({...pm});
    pt.pc.splice(idx, 1);
    saveStore();
    renderParty();
    showToast('Moved to party');
  }
}

function swapInFromPC(slotIdx){
  if(swapSourcePcIdx === -1) return;
  const pt = activePt();
  const pm = pt.pc[swapSourcePcIdx];
  if(!pm) return;
  const displaced = {...pt.party[slotIdx]};
  pt.party[slotIdx] = {...pm};
  pt.pc.splice(swapSourcePcIdx, 1);
  pt.pc.push(displaced);
  swapSourcePcIdx = -1;
  saveStore();
  closeSwapModal();
  showToast('Moved to party');
  renderParty();
}

function togglePC(){
  pcCollapsed = !pcCollapsed;
  renderPC();
}

function renderSuggestions(){
  const wrap = document.getElementById('suggest-wrap');
  if(!wrap) return;
  const pt = activePt();
  const total = pt.party.length + pt.pc.length;
  if(!total){
    wrap.innerHTML = `<div class="sugg-empty-note">Add Pokémon to your party or PC Box to get party suggestions.</div>`;
    return;
  }
  const suggestions = _computeSuggestions();
  if(!suggestions.length){ wrap.innerHTML=''; return; }
  let html = `<div class="sugg-strip-hd">✨ SUGGESTED PARTIES</div>`;
  suggestions.forEach((s,idx)=>{
    const sprites = s.members.map(pm=>`<img class="sugg-strip-sprite" src="${spriteUrl(pm.n)}" onerror="this.style.display='none'">`).join('');
    html += `<button class="sugg-strip-card" onclick="openSuggestModal(${idx})" aria-label="Suggestion ${idx+1}: ${s.coverage}/18 covered">
      <span class="sugg-strip-num">#${idx+1}</span>
      <span class="sugg-strip-sprites">${sprites}</span>
      <span class="sugg-strip-score">${s.coverage}/18</span>
      <span class="sugg-strip-arrow">▶</span>
    </button>`;
  });
  wrap.innerHTML = html;
  // Cache so modal can reference without recomputing
  _suggestions = suggestions;
}
// Keep old name as alias so renderParty() still works
function renderSuggestBtn(){ renderSuggestions(); }

function renderPC(){
  const section = document.getElementById('pc-section');
  if(!section) return;
  const pt = activePt();
  const pc = pt.pc;
  const arrow = pcCollapsed ? '▶' : '▼';
  let html = `<div class="pc-hd" role="button" aria-label="Toggle PC Box" onclick="togglePC()">
    <span class="pc-hd-title">📦 PC BOX</span>
    <span class="pc-hd-count">(${pc.length} CAUGHT)</span>
    <span class="pc-hd-arrow">${arrow}</span>
  </div>`;
  if(!pcCollapsed){
    if(!pc.length){
      html += `<div class="pc-empty">Pokémon you catch but aren't in your active party live here. Add from the Search page.</div>`;
    } else {
      html += `<div class="pc-grid">`;
      pc.forEach((pm,idx)=>{
        if(pcConfirmIdx === idx){
          html += `<div class="pc-slot confirming">
            <div class="pcs-confirm-msg">REMOVE?</div>
            <div class="pcs-confirm-btns">
              <button class="pcs-confirm-yes" onclick="removeFromPC(${idx})">YES</button>
              <button class="pcs-confirm-no" onclick="cancelRemovePC()">NO</button>
            </div>
          </div>`;
        } else {
          const shortName = pm.name.length > 9 ? pm.name.slice(0,8)+'…' : pm.name;
          html += `<div class="pc-slot">
            <img class="pcs-sprite" src="${spriteUrl(pm.n)}" onerror="this.style.display='none'">
            <div class="pcs-num">#${String(pm.n).padStart(3,'0')}</div>
            <div class="pcs-name">${shortName}</div>
            <div class="pcs-types">${pm.types.map(t=>`<span class="tb sm t-${t}">${t}</span>`).join('')}</div>
            <div class="pcs-actions">
              <button class="pcs-move-btn" aria-label="Move ${pm.name} to party" onclick="moveToPartyFromPC(${idx})">→ PARTY</button>
              <button class="pcs-rm-btn" aria-label="Remove ${pm.name} from PC" onclick="confirmRemovePC(${idx})">✕</button>
            </div>
          </div>`;
        }
      });
      html += `</div>`;
    }
  }
  section.innerHTML = html;
}

// ═══════════════════════════════
// PARTY SUGGESTION ENGINE — delegates to party-calc.js
// ═══════════════════════════════
const _calc = makePartyCalc(TYPES, STATS, gm, dmult);

function _computeSuggestions(){
  const pt = activePt();
  const pool = [
    ...pt.party.map((pm,idx)=>({...pm, _src:'party', _srcIdx:idx})),
    ...pt.pc.map((pm,idx)=>({...pm, _src:'pc', _srcIdx:idx})),
  ];
  return _calc.computeSuggestions(pool);
}

// ═══════════════════════════════
// SUGGESTION MODAL
// ═══════════════════════════════
let _suggestions = [];
let _suggIdx = 0;

function openSuggestModal(idx){
  _suggIdx = idx || 0;
  renderSuggestModal();
  document.getElementById('suggest-overlay').classList.add('open');
}
function closeSuggestModal(){ document.getElementById('suggest-overlay').classList.remove('open'); }
function suggestOvClick(e){ if(e.target===document.getElementById('suggest-overlay')) closeSuggestModal(); }

function renderSuggestModal(){
  const hd = document.getElementById('suggest-modal-ttl');
  const body = document.getElementById('suggest-body');
  const s = _suggestions[_suggIdx];
  if(!s){
    if(hd) hd.textContent = 'PARTY SUGGESTIONS';
    body.innerHTML = `<div style="text-align:center;padding:20px;font-family:var(--fp);font-size:6px;color:var(--text3);line-height:2.2;">NO POKÉMON AVAILABLE.<br>ADD SOME TO YOUR PARTY OR PC BOX FIRST.</div>`;
    return;
  }
  if(hd) hd.textContent = `OPTION ${_suggIdx+1} · ${s.coverage}/18 COVERED`;
  // Sprites row with type badges + source
  let html = `<div class="sugg-sprites">`;
  s.members.forEach(pm=>{
    const n = pm.name.length > 9 ? pm.name.slice(0,8)+'…' : pm.name;
    const srcBadge = pm._src==='party'
      ? `<div class="sugg-src-party">IN PARTY</div>`
      : `<div class="sugg-src-pc">FROM PC</div>`;
    const typeBadges = pm.types.map(t=>`<span class="tb sm t-${t}">${t}</span>`).join('');
    html += `<div class="sugg-poke">
      <img src="${spriteUrl(pm.n)}" class="sugg-sprite" onerror="this.style.display='none'">
      <div class="sugg-pname">${n}</div>
      <div class="sugg-ptypes">${typeBadges}</div>
      ${srcBadge}
    </div>`;
  });
  html += `</div>`;
  // Offensive coverage bar
  const covered = new Set();
  s.members.forEach(pm=>{
    const atkTypes=[...pm.types,...(pm.moves||[]).map(m=>m.type)];
    TYPES.forEach(def=>{ if(atkTypes.some(at=>gm(at,def)>=2)) covered.add(def); });
  });
  html += `<div class="sugg-section-lbl">COVERS</div>`;
  html += `<div class="sugg-cov-bar">${TYPES.map(t=>`<span class="cdot t-${t} ${covered.has(t)?'covered':'gap'}">${t.slice(0,3).toUpperCase()}</span>`).join('')}</div>`;
  // Defensive exposures
  const exposed = new Set();
  s.members.forEach(pm=>{ TYPES.forEach(at=>{ if(dmult(at,pm.types)>=2) exposed.add(at); }); });
  if(exposed.size){
    html += `<div class="sugg-section-lbl">WEAK TO</div>`;
    html += `<div class="sugg-weak-row">${[...exposed].map(t=>`<span class="tb sm t-${t}">${t}</span>`).join('')}</div>`;
  }
  html += `<button class="sugg-apply-btn" onclick="applySuggestion(${_suggIdx})">USE THIS PARTY</button>`;
  body.innerHTML = html;
}

function applySuggestion(idx){
  const s = _suggestions[idx];
  if(!s) return;
  const pt = activePt();
  const usedPartyIdx = new Set(s.members.filter(m=>m._src==='party').map(m=>m._srcIdx));
  const usedPcIdx    = new Set(s.members.filter(m=>m._src==='pc').map(m=>m._srcIdx));
  // New PC = original PC (minus those moving to party) + displaced party members
  pt.pc = [
    ...pt.pc.filter((_,i)=>!usedPcIdx.has(i)),
    ...pt.party.filter((_,i)=>!usedPartyIdx.has(i)),
  ];
  // New party = the suggested team, stripped of internal tracking props
  pt.party = s.members.map(({_src,_srcIdx,...pm})=>({...pm}));
  saveStore();
  closeSuggestModal();
  renderParty();
  showToast(`PARTY UPDATED — ${s.coverage}/18 TYPES COVERED`);
}
