// ═══════════════════════════════
// SPRITE HELPERS
// ═══════════════════════════════
function spriteUrl(n){
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${n}.png`;
}
function artUrl(n){
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${n}.png`;
}

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

// ═══════════════════════════════
// PAGE ROUTING
// ═══════════════════════════════
function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nb').forEach(b=>b.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  ['search','party','gyms','location'].forEach((p,i)=>{
    if(p===id) document.querySelectorAll('.nb')[i].classList.add('active');
  });
  if(id==='party') renderParty();
}

// ═══════════════════════════════
// MASTHEAD
// ═══════════════════════════════
function updateMasthead(){
  const pt = activePt();
  document.getElementById('mast-pt-label').textContent = pt.name;
}

// ═══════════════════════════════
// SEARCH PAGE
// ═══════════════════════════════
function buildTypePills(){
  const row = document.getElementById('type-filter-row');
  row.innerHTML = TYPES.map(t=>`<div class="tpill t-${t}${activeTypeFilter===t?' active':''}" onclick="setTypeFilter('${t}')">${t}</div>`).join('');
}

function setTypeFilter(t){
  if(activeTypeFilter===t){
    activeTypeFilter = null;
  } else {
    activeTypeFilter = t;
    activePoke = null;
    document.getElementById('s-in').value = '';
    document.getElementById('s-cl').style.display = 'none';
    document.getElementById('s-drop').style.display = 'none';
  }
  buildTypePills();
  renderSearch();
}

// Jump to Search with a specific type pill active (used by coverage dots + other tabs)
function setTypeAndSearch(type){
  showPage('search');
  activeTypeFilter = type;
  activePoke = null;
  document.getElementById('s-in').value = '';
  document.getElementById('s-cl').style.display = 'none';
  document.getElementById('s-drop').style.display = 'none';
  buildTypePills();
  renderSearch();
}

function onSearch(v){
  document.getElementById('s-cl').style.display = v ? 'block' : 'none';
  if(!v.trim()){
    document.getElementById('s-drop').style.display = 'none';
    if(!activePoke) renderSearch();
    return;
  }
  const q = v.toLowerCase();
  const list = POKEMON.filter(p=>p.name.toLowerCase().includes(q)).slice(0,10);
  renderPDrop('s-drop', list, 'pickPoke');
}

function clearSearch(){
  document.getElementById('s-in').value = '';
  document.getElementById('s-cl').style.display = 'none';
  document.getElementById('s-drop').style.display = 'none';
  activePoke = null;
  renderSearch();
}

function pickPoke(n){
  activePoke = POKEMON.find(p=>p.n===n);
  document.getElementById('s-in').value = activePoke.name;
  document.getElementById('s-cl').style.display = 'block';
  document.getElementById('s-drop').style.display = 'none';
  activeTypeFilter = null;
  buildTypePills();
  addRecent(activePoke);
  renderSearch();
}

// Default search state: recents + type browse
function renderSearch(){
  const scroll = document.getElementById('s-scroll');

  if(activePoke){ renderPokeDetail(); return; }

  const pt = activePt();
  let html = '';

  if(pt.recents.length){
    html += `<div class="section-label">RECENT</div>
    <div class="recent-chips">${pt.recents.map(r=>`<div class="rchip" onclick="pickPoke(${r.n})">${r.name}</div>`).join('')}</div>`;
  }

  if(activeTypeFilter){
    const filtered = POKEMON.filter(p=>p.types.includes(activeTypeFilter));
    html += `<div class="section-label">${activeTypeFilter.toUpperCase()} TYPE (${filtered.length})</div>`;
    filtered.forEach(p=>{
      const obtain = getObtain(p.n);
      const shortObtain = obtain[0].length>42 ? obtain[0].slice(0,42)+'…' : obtain[0];
      html += `<div class="browse-card" onclick="pickPoke(${p.n})">
        <div class="bc-left">
          <div class="bc-name">${p.name}</div>
          <div class="bc-obtain">${shortObtain}</div>
        </div>
        <div class="bc-badges">${p.types.map(t=>`<span class="tb sm t-${t}">${t}</span>`).join('')}</div>
      </div>`;
    });
  } else if(!pt.recents.length){
    html += `<div class="empty"><div class="ei">🔍</div><p>SEARCH BY NAME ABOVE<br>OR TAP A TYPE TO BROWSE</p></div>`;
  } else {
    html += `<div style="font-family:var(--fp);font-size:5.5px;color:var(--text3);line-height:2;text-align:center;margin-top:8px;">TAP A TYPE PILL TO BROWSE ALL POKEMON OF THAT TYPE</div>`;
  }

  scroll.innerHTML = html;
}

// Full Pokémon detail view
function renderPokeDetail(){
  if(!activePoke) return;
  const p = activePoke;
  const et = p.types;
  const pt = activePt();
  const scroll = document.getElementById('s-scroll');
  const inParty = pt.party.some(pm=>pm.n===p.n);

  const obtain = getObtain(p.n);
  const obtainHtml = obtain.map(o=>`<div class="obtain-row">${o}</div>`).join('');

  let html = `<div class="poke-card">
    <div class="poke-card-row">
      <div>
        <div class="pc-num">#${String(p.n).padStart(3,'0')}</div>
        <div class="pc-name">${p.name}</div>
        <div class="pc-types">${et.map(t=>`<span class="tb t-${t}">${t}</span>`).join('')}</div>
      </div>
      <img src="${spriteUrl(p.n)}" style="width:64px;height:64px;object-fit:contain;opacity:.9;" onerror="this.style.display='none'">
    </div>
    <div class="obtain-section">
      <div class="obtain-label">HOW TO OBTAIN</div>
      ${obtainHtml}
    </div>
  </div>`;

  // Add to party button (Phase 4)
  if(inParty){
    html += `<button class="add-party-btn in-party" onclick="showPage('party')">✓ IN PARTY — VIEW PARTY ›</button>`;
  } else {
    html += `<button class="add-party-btn" onclick="addToParty(${p.n})">➕ ADD TO PARTY</button>`;
  }

  // Party suggestions
  html += `<div class="sec-head">MY PARTY — WHO TO USE</div>`;
  if(!pt.party.length){
    html += `<div class="no-party"><div class="np-txt">ADD POKEMON TO PARTY<br>FOR BATTLE SUGGESTIONS</div><button class="go-btn" onclick="showPage('party')">GO TO MY PARTY ›</button></div>`;
  } else {
    const scored = pt.party.map(pm=>{
      let bestOff = 0, bestAtkType = null;
      pm.types.forEach(at=>{const m=dmult(at,et)*1.5;if(m>bestOff){bestOff=m;bestAtkType=at;}});
      let sm = [];
      if(pm.moves && pm.moves.length){
        pm.moves.forEach(mv=>{const raw=dmult(mv.type,et);const stab=pm.types.includes(mv.type);sm.push({...mv,raw,stab,eff:raw*(stab?1.5:1)});});
        sm.sort((a,b)=>b.eff-a.eff); bestOff = sm[0].eff;
      }
      const defRisk = Math.max(...et.map(at=>dmult(at,pm.types)));
      return{pm,bestOff,bestAtkType,sm,defRisk,score:bestOff*3-defRisk};
    }).sort((a,b)=>b.score-a.score);

    scored.forEach((s,i)=>{
      const pm = s.pm; const isTop = i===0;
      const tBadges = pm.types.map(t=>`<span class="tb sm t-${t}">${t}</span>`).join('');
      let bc='bo', bt='~ OK';
      if(s.bestOff>=6){bc='bn';bt='💥 NUKE';}
      else if(s.bestOff>=3){bc='bg';bt='⭐ GREAT';}
      else if(s.bestOff>=2){bc='bgo';bt='✅ GOOD';}
      else if(s.bestOff<1){bc='bb';bt='✗ WEAK';}

      let movesHtml = '';
      if(s.sm.length){
        movesHtml = '<div class="sc-moves">';
        s.sm.forEach(mv=>{
          const phys = PHYS.has(mv.type);
          let tags = '';
          if(mv.raw>=4) tags+=`<span class="mtag m4x">4×</span>`;
          else if(mv.raw>=2) tags+=`<span class="mtag m2x">2×</span>`;
          else if(mv.raw===0) tags+=`<span class="mtag m0x">0×</span>`;
          if(mv.stab) tags+=`<span class="mtag mstab">STAB</span>`;
          tags+=`<span class="mtag ${phys?'mphy':'mspe'}">${phys?'PHY':'SPE'}</span>`;
          movesHtml+=`<div class="sc-mr"><span class="tb sm t-${mv.type}">${mv.type}</span><span style="flex:1">${mv.name}</span><span class="sc-tags">${tags}</span></div>`;
        });
        movesHtml += '</div>';
      } else if(s.bestAtkType){
        const raw = dmult(s.bestAtkType,et);
        movesHtml = `<div class="sc-hint">Best type: <span class="tb sm t-${s.bestAtkType}">${s.bestAtkType}</span>${raw>=2?` <span class="mtag m2x" style="display:inline-block">${raw}×</span>`:''} · <span style="color:var(--text3);font-size:11px">add moves for full breakdown</span></div>`;
      }

      let extra = '';
      if(s.defRisk>=4) extra+=`<div class="sc-warn">⚠️ ENEMY HITS YOU 4× — HIGH RISK</div>`;
      else if(s.defRisk>=2) extra+=`<div class="sc-warn">⚠️ Weak to this enemy (${s.defRisk}×)</div>`;
      const imm = et.filter(at=>dmult(at,pm.types)===0);
      if(imm.length) extra+=`<div class="sc-imm">🛡 IMMUNE to ${imm.map(t=>`<span class="tb sm t-${t}">${t}</span>`).join(' ')}</div>`;

      const lvTxt = pm.level ? ` <span class="sc-lv">Lv.${pm.level}</span>` : '';
      html += `<div class="scard${isTop?' top':''}${s.defRisk>=4?' risky':''}">
        <div class="sc-r1">
          <div><div style="display:flex;align-items:baseline;gap:4px;"><span class="sc-name">${isTop?'⭐ ':''}${pm.name}</span>${lvTxt}</div>
          <div class="sc-types" style="margin-top:3px;">${tBadges}</div></div>
          <span class="sc-badge ${bc}">${bt}</span>
        </div>
        ${movesHtml}${extra}
      </div>`;
    });
  }

  // Type chart
  const dc = {}; TYPES.forEach(at=>{dc[at]=dmult(at,et);});
  const g = {4:[],2:[],0:[],.5:[],.25:[]};
  Object.entries(dc).forEach(([t,m])=>{
    if(m>=4) g[4].push(t); else if(m===2) g[2].push(t);
    else if(m===0) g[0].push(t); else if(m<=.25) g[.25].push(t);
    else if(m===.5) g[.5].push(t);
  });
  const sec=(cls,lbl,arr)=>arr.length?`<div class="rcrow"><div class="rch ${cls}">${lbl}</div><div class="rcbody">${arr.map(t=>`<span class="tb t-${t}">${t}</span>`).join('')}</div></div>`:'';
  html += `<div class="sec-head">📊 TYPE CHART</div>
    ${sec('x4','💥 4× Super Effective',g[4])}
    ${sec('x2','✅ 2× Super Effective',g[2])}
    ${sec('x0','🚫 0× Immune — avoid',g[0])}
    ${sec('xq','⚠️ ¼× Very Resisted',g[.25])}
    ${sec('xh','⚠️ ½× Resisted',g[.5])}`;

  scroll.innerHTML = html;
  scroll.scrollTop = 0;
}

// Shared dropdown renderer
function renderPDrop(id, list, fn){
  const dd = document.getElementById(id);
  if(!list.length){ dd.style.display='none'; return; }
  dd.style.display = 'block';
  dd.innerHTML = list.map(p=>`<div class="prow" onclick="${fn}(${p.n})">
    <span class="pnum">#${String(p.n).padStart(3,'0')}</span>
    <span class="pname">${p.name}</span>
    <span class="pbadges">${p.types.map(t=>`<span class="tb sm t-${t}">${t}</span>`).join('')}</span>
  </div>`).join('');
}

// ═══════════════════════════════
// ADD TO PARTY (Phase 4)
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
    html += `<div class="pslot filled" onclick="openModal(${i})">
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
    <div style="margin-bottom:2px;">
      <div class="field-lbl">LEVEL (OPTIONAL)</div>
      <input class="field-in" id="f-lv" type="number" min="1" max="100" placeholder="—" value="${mLv}" oninput="mLv=this.value" style="width:90px;">
    </div>`;
  }

  html += `<div class="mlbl" style="margin-top:12px;">STEP 2 — MOVES (OPTIONAL, MAX 4)</div>
  <div class="sdots">`;
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
    html += `<div class="sbox" style="margin-top:10px;margin-bottom:7px;">
      <input class="move-si" id="mv-q" placeholder="Search moves..." oninput="onMQ(this.value)" value="${mMoveQ}"
        autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
    </div>
    <div class="tf-row">`;
    TYPES.forEach(t=>{html+=`<div class="tf t-${t}${mTypeFilter===t?' active':''}" onclick="setMTF('${t}')">${t}</div>`;});
    html += `</div>`;
    const q = mMoveQ.toLowerCase();
    const picked = ALL_MOVES.filter(mv=>mMoves.some(m=>m.name===mv.name)&&(!mTypeFilter||mv.type===mTypeFilter)&&(!q||mv.name.toLowerCase().includes(q)));
    const rest = ALL_MOVES.filter(mv=>!mMoves.some(m=>m.name===mv.name)&&(!mTypeFilter||mv.type===mTypeFilter)&&(!q||mv.name.toLowerCase().includes(q)));
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

  html += `<button class="save-btn" onclick="saveModal()" ${mPoke?'':'disabled'}>${mSlot>=0&&mSlot<pt.party.length?'💾 SAVE CHANGES':'➕ ADD TO PARTY'}</button>`;
  if(mSlot>=0 && mSlot<pt.party.length) html+=`<button class="rm-btn" onclick="rmParty(${mSlot})">✕ REMOVE FROM PARTY</button>`;

  const sp = body.scrollTop; body.innerHTML = html; body.scrollTop = sp;
  if(mMoveQ){ const q=document.getElementById('mv-q'); if(q){q.focus();q.setSelectionRange(mMoveQ.length,mMoveQ.length);} }
}

function onMS(v){
  const dd=document.getElementById('ms-drop');
  document.getElementById('ms-cl').style.display=v?'block':'none';
  if(!v.trim()){dd.style.display='none';return;}
  const list=POKEMON.filter(p=>p.name.toLowerCase().includes(v.toLowerCase())).slice(0,8);
  if(!list.length){dd.style.display='none';return;}
  dd.style.display='block';
  dd.innerHTML=list.map(p=>`<div class="prow" onclick="pickMP(${p.n})"><span class="pnum">#${String(p.n).padStart(3,'0')}</span><span class="pname">${p.name}</span><span class="pbadges">${p.types.map(t=>`<span class="tb sm t-${t}">${t}</span>`).join('')}</span></div>`).join('');
}
function pickMP(n){ mPoke=POKEMON.find(p=>p.n===n); mMoves=[]; document.getElementById('ms-drop').style.display='none'; renderModal(); document.getElementById('ms-in').value=mPoke.name; }
function clearMP(){ mPoke=null; mMoves=[]; mLv=''; renderModal(); }
function onMQ(v){ mMoveQ=v; const sp=document.getElementById('modal-body').scrollTop; renderModal(); document.getElementById('modal-body').scrollTop=sp; const q=document.getElementById('mv-q'); if(q){q.focus();q.setSelectionRange(v.length,v.length);} }
function setMTF(t){ mTypeFilter=mTypeFilter===t?null:t; mMoveQ=''; const sp=document.getElementById('modal-body').scrollTop; renderModal(); document.getElementById('modal-body').scrollTop=sp; }
function togMv(name,type){ const idx=mMoves.findIndex(m=>m.name===name); if(idx>=0) mMoves.splice(idx,1); else{if(mMoves.length>=4)return; mMoves.push({name,type});} const sp=document.getElementById('modal-body').scrollTop; renderModal(); document.getElementById('modal-body').scrollTop=sp; const q=document.getElementById('mv-q'); if(q&&mMoveQ){q.focus();q.value=mMoveQ;q.setSelectionRange(mMoveQ.length,mMoveQ.length);} }
function rmMv(i){ mMoves.splice(i,1); const sp=document.getElementById('modal-body').scrollTop; renderModal(); document.getElementById('modal-body').scrollTop=sp; }

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
// PC SWAP MODAL (Phase 5)
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

// ═══════════════════════════════
// GYMS PAGE
// ═══════════════════════════════
function renderGyms(){
  document.getElementById('gyms-scroll').innerHTML = BOSSES.map((boss,i)=>`
    <div class="gym-card" id="gc-${i}">
      <div class="gym-hd" onclick="document.getElementById('gc-${i}').classList.toggle('open')">
        <div class="gym-icon" style="background:${boss.color}22;border-color:${boss.color}44;">${boss.icon}</div>
        <div class="gym-info"><div class="gym-name">${boss.name}</div><div class="gym-sub">${boss.sub}</div></div>
        <div class="gym-arr">▾</div>
      </div>
      <div class="gym-body">
        <div class="gym-team">${boss.team.map(p=>`<div class="gym-poke" onclick="goSearch('${p.name}')">
          <span class="gym-poke-lv">Lv.${p.lv}</span>
          <span class="gym-poke-name">${p.name}</span>
          <span class="pbadges">${p.types.map(t=>`<span class="tb sm t-${t}">${t}</span>`).join('')}</span>
        </div>`).join('')}</div>
        <div class="gym-tip">💡 ${boss.tip}</div>
      </div>
    </div>`).join('');
}

// ═══════════════════════════════
// WHERE AM I PAGE
// ═══════════════════════════════
function filterLocs(v){
  const q = v.toLowerCase().trim();
  const list = q ? LOCATIONS.filter(l=>l.name.toLowerCase().includes(q)||l.methods.some(m=>m.p.some(p=>p.toLowerCase().includes(q)))) : LOCATIONS;
  renderLocs(list, !!q);
}
function renderLocs(list, autoOpen=false){
  const s = document.getElementById('loc-scroll');
  if(!list.length){ s.innerHTML=`<div class="empty"><div class="ei">🗺️</div><p>NO RESULTS</p></div>`; return; }
  s.innerHTML = list.map((loc,i)=>`
    <div class="loc-card${autoOpen?' open':''}" id="lc-${i}">
      <div class="lch" onclick="this.parentElement.classList.toggle('open')">
        <div class="lcn">${loc.name}</div><div class="lcx">▾</div>
      </div>
      <div class="lcm">
        ${loc.methods.map(m=>`<div class="lml">${m.label}</div><div class="lplist">${m.p.map(n=>`<span class="lpchip" onclick="goSearch('${n}')">${n}</span>`).join('')}</div>`).join('')}
      </div>
    </div>`).join('');
}

function goSearch(name){
  const p = POKEMON.find(x=>x.name===name);
  if(!p) return;
  showPage('search');
  activePoke = p; activeTypeFilter = null;
  buildTypePills();
  document.getElementById('s-in').value = p.name;
  document.getElementById('s-cl').style.display = 'block';
  document.getElementById('s-drop').style.display = 'none';
  addRecent(p); renderPokeDetail();
}

// ═══════════════════════════════
// PLAYTHROUGH MENU (Phase 7)
// ═══════════════════════════════
function openPtMenu(){
  renderPtMenu();
  document.getElementById('pt-overlay').classList.add('open');
}
function closePtMenu(){ document.getElementById('pt-overlay').classList.remove('open'); }
function ptOvClick(e){ if(e.target===document.getElementById('pt-overlay')) closePtMenu(); }

function renderPtMenu(){
  const body = document.getElementById('pt-body');
  const active = activePt();
  body.innerHTML = store.playthroughs.map(pt=>`
    <div class="pt-list-row${pt.id===active.id?' active-pt':''}">
      <input class="pt-name-input${pt.id===active.id?' active-pt':''}" value="${pt.name}"
        onblur="renamePt('${pt.id}',this.value)"
        onkeydown="if(event.key==='Enter')this.blur()">
      ${pt.id===active.id
        ? '<span style="font-family:var(--fp);font-size:5px;color:var(--gold);">ACTIVE</span>'
        : `<button class="pt-switch-btn" onclick="switchPt('${pt.id}')">SWITCH</button>`}
      <button class="pt-del-btn" onclick="deletePt('${pt.id}')">🗑</button>
    </div>`).join('') +
    `<button class="pt-new-btn" onclick="createPlaythrough()">＋ NEW RUN</button>`;
}

function renamePt(id, name){
  const trimmed = name.trim();
  if(!trimmed) return;
  const pt = store.playthroughs.find(p=>p.id===id);
  if(!pt || pt.name===trimmed) return;
  pt.name = trimmed;
  saveStore();
  updateMasthead();
}

function createPlaythrough(){
  const n = store.playthroughs.length + 1;
  const pt = makePt('RUN ' + n);
  store.playthroughs.push(pt);
  store.activePtId = pt.id;
  saveStore();
  updateMasthead();
  renderPtMenu();
  closePtMenu();
  activePoke = null;
  activeTypeFilter = null;
  buildTypePills();
  renderSearch();
  renderParty();
  showToast('Started '+pt.name);
}

function switchPt(id){
  store.activePtId = id;
  saveStore();
  updateMasthead();
  renderPtMenu();
  closePtMenu();
  activePoke = null;
  activeTypeFilter = null;
  buildTypePills();
  renderSearch();
  renderParty();
  showToast('Switched to '+activePt().name);
}

function deletePt(id){
  if(store.playthroughs.length <= 1){
    showToast('Cannot delete the only run', 'red');
    return;
  }
  const pt = store.playthroughs.find(p=>p.id===id);
  if(!confirm(`Delete "${pt.name}"? This cannot be undone.`)) return;
  store.playthroughs = store.playthroughs.filter(p=>p.id!==id);
  if(store.activePtId===id) store.activePtId = store.playthroughs[0].id;
  saveStore();
  updateMasthead();
  renderPtMenu();
  activePoke = null;
  activeTypeFilter = null;
  buildTypePills();
  renderSearch();
  renderParty();
}

// ═══════════════════════════════
// TOAST
// ═══════════════════════════════
let _toastTimer = null;
function showToast(msg, color){
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show' + (color==='red'?' red':'');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(()=>{ el.className='toast'; }, 2200);
}

// ═══════════════════════════════
// INIT
// ═══════════════════════════════
loadStore();
updateMasthead();
buildTypePills();
renderSearch();
renderLocs(LOCATIONS);
renderGyms();
renderParty();
