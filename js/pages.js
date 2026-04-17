// ═══════════════════════════════
// PAGE ROUTING
// ═══════════════════════════════
function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  document.querySelectorAll('.drawer-item').forEach(b=>b.classList.remove('active'));
  const di = document.querySelector(`.drawer-item[data-page="${id}"]`);
  if(di) di.classList.add('active');
  if(id==='party') renderParty();
  if(id==='settings') renderSettings();
  if(id==='tms') renderTMs();
  closeDrawer();
  if(id==='search'){
    const params = activePoke ? {n:activePoke.n}
      : activeMove ? {m:activeMove}
      : activeTypeFilter ? {type:activeTypeFilter}
      : {};
    setRoute('search', params);
  } else {
    setRoute(id);
  }
}
function openDrawer(){ document.getElementById('drawer-overlay').classList.add('open'); }
function closeDrawer(){ document.getElementById('drawer-overlay').classList.remove('open'); }
function drawerOvClick(e){ if(e.target===document.getElementById('drawer-overlay')) closeDrawer(); }

// ═══════════════════════════════
// MASTHEAD
// ═══════════════════════════════
function updateMasthead(){
  const pt = activePt();
  if(!pt) return;
  const gameEntry = GAMES.flatMap(g=>g.games).find(g=>g.id===pt.gameId);
  const gameTitle = gameEntry ? gameEntry.icon+' '+gameEntry.name.toUpperCase() : '🔴 FIRERED';
  const genEntry = GAMES.find(g=>g.games.some(gm=>gm.id===pt.gameId));
  const gameSub = genEntry ? 'BATTLE AIDE · GEN '+genEntry.gen+' · '+genEntry.region.toUpperCase() : 'BATTLE AIDE · GEN III · KANTO';
  document.getElementById('mast-pt-label').textContent = pt.name;
  document.getElementById('sidebar-pt-label').textContent = pt.name;
  document.getElementById('mast-game').textContent = gameTitle;
  document.getElementById('mast-game-mobile').textContent = gameTitle;
  document.getElementById('mast-pt').textContent = gameSub;
  document.getElementById('mast-pt-mobile').textContent = gameSub;
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
// ═══════════════════════════════
// TMs & HMs PAGE — inventory, filters, learnability, tutors
// ═══════════════════════════════
let tmsFilter   = 'all';         // 'all' | 'owned' | 'missing'
let tmsQuery    = '';
let tmsExpanded = new Set();     // nums currently showing the "who can learn" section

function _tmInv(){ const pt=activePt(); return (pt && pt.tmInventory) || {}; }
function _tmCount(num){ return _tmInv()[num] || 0; }
function _tmOwned(num){ return _tmCount(num) > 0; }

function _setTmCount(num, count){
  const pt = activePt();
  if(!pt.tmInventory) pt.tmInventory = {};
  if(count > 0) pt.tmInventory[num] = count;
  else delete pt.tmInventory[num];
  DataManager.save();
  renderTMs();
}
function incTmCount(num, delta){ _setTmCount(num, Math.max(0, _tmCount(num) + delta)); }
function toggleTmOwned(num){ _setTmCount(num, _tmOwned(num) ? 0 : 1); }

function setTmsFilter(f){ tmsFilter = f; renderTMs(); }
function toggleTmExpand(num){
  if(tmsExpanded.has(num)) tmsExpanded.delete(num);
  else tmsExpanded.add(num);
  renderTMs();
}

function filterTMs(v){ tmsQuery = v; renderTMs(); }

// All items (TMs + HMs + Tutors) share the same { num, move, type, cat, loc, tmType, buyable? } shape.
function _allTmItems(){ return [...TM_HM, ...MOVE_TUTORS]; }

function _matchesSearch(t){
  const q = tmsQuery.toLowerCase().trim();
  if(!q) return true;
  return t.move.toLowerCase().includes(q) || t.num.toLowerCase().replace(' ','').includes(q) || (t.loc||'').toLowerCase().includes(q);
}
function _matchesOwnership(t){
  if(tmsFilter === 'owned')   return _tmOwned(t.num);
  if(tmsFilter === 'missing') return !_tmOwned(t.num);
  return true;
}

function _learnersOf(moveName){
  const pool = taggedPool(activePt());
  const canLearn = pm => (LEARNSETS[pm.n] || []).includes(moveName);
  return {
    inParty: pool.filter(pm => pm._src === 'party' && canLearn(pm)),
    inPC:    pool.filter(pm => pm._src === 'pc'    && canLearn(pm)),
  };
}

const _TM_TOGGLE_LABEL = { hm: ['+ HAVE', '✓ HAVE', 'Need', 'Have'], tutor: ['○ TEACH', '✓ TAUGHT', 'Not taught', 'Taught'] };
function _tmInvCtl(t, count, owned){
  if(t.tmType === 'tm'){
    return `<div class="tm-inv" role="group" aria-label="${t.num} inventory">
      <button class="tm-inv-btn" aria-label="Decrease ${t.num}" onclick="event.stopPropagation();incTmCount('${t.num}',-1)" ${count===0?'disabled':''}>−</button>
      <span class="tm-inv-count ${owned?'owned':''}" aria-label="Owned: ${count}">${count}</span>
      <button class="tm-inv-btn" aria-label="Increase ${t.num}" onclick="event.stopPropagation();incTmCount('${t.num}',1)">+</button>
    </div>`;
  }
  const [offLbl, onLbl, offAria, onAria] = _TM_TOGGLE_LABEL[t.tmType];
  const labelFor = t.tmType === 'hm' ? t.num : `${t.move} tutor`;
  return `<button class="tm-own-toggle ${owned?'owned':''}" aria-pressed="${owned}" aria-label="${owned?onAria:offAria} ${labelFor}" onclick="event.stopPropagation();toggleTmOwned('${t.num}')">${owned?onLbl:offLbl}</button>`;
}

function _tmCardHtml(t){
  const mc=t.cat==='phy'?'mphy':t.cat==='spe'?'mspe':'mstab';
  const cl=t.cat==='phy'?'PHY':t.cat==='spe'?'SPE':'STA';
  const count = _tmCount(t.num);
  const owned = count > 0;
  const isExpanded = tmsExpanded.has(t.num);
  const learners = _learnersOf(t.move);
  const learnersCount = learners.inParty.length + learners.inPC.length;
  const learnersHtml = isExpanded ? _renderLearnersHtml(t.move, learners) : '';

  return `<div class="tm-card${owned?' tm-owned':''}${t.tmType==='tutor'&&owned?' tm-faded':''}">
    <div class="tm-card-top">
      <span class="tm-card-num">${t.num}</span>
      <span class="tm-card-move">${t.move}</span>
      <span class="tb sm t-${t.type}">${t.type}</span>
      <span class="mtag ${mc}">${cl}</span>
      ${_tmInvCtl(t, count, owned)}
    </div>
    <div class="tm-card-loc">${t.loc}</div>
    <button class="tm-expand" aria-expanded="${isExpanded}" onclick="toggleTmExpand('${t.num}')">
      ${isExpanded?'▾':'▶'} WHO CAN LEARN <span class="tm-expand-count">${learnersCount}</span>
    </button>
    ${learnersHtml}
  </div>`;
}

function _renderLearnersHtml(moveName, { inParty, inPC }){
  if(!inParty.length && !inPC.length) return `<div class="tm-learn-empty">No current party or PC member can learn this move.</div>`;
  const row = pm => `<button class="tm-learner" onclick="openTeachModal(${pm.n},'${moveName.replace(/'/g,"\\'")}','${pm._src}',${pm._srcIdx})" aria-label="Teach ${moveName} to ${pm.name}">
    <img class="tm-learner-sprite" src="${spriteUrl(pm.n)}" onerror="this.style.display='none'">
    <span class="tm-learner-name">${pm.name}</span>
    <span class="tm-learner-types">${pm.types.map(t=>`<span class="tb sm t-${t}">${t}</span>`).join('')}</span>
  </button>`;
  let html = `<div class="tm-learners">`;
  if(inParty.length) html += `<div class="tm-learn-lbl">IN PARTY</div><div class="tm-learn-list">${inParty.map(row).join('')}</div>`;
  if(inPC.length)    html += `<div class="tm-learn-lbl">IN PC</div><div class="tm-learn-list">${inPC.map(row).join('')}</div>`;
  html += `</div>`;
  return html;
}


// ─── HM Carrier suggestion ─────────────────────────────────
function _ownedHmMoves(){
  return TM_HM.filter(t => t.tmType==='hm' && _tmOwned(t.num)).map(t => t.move);
}

function _renderHmCarrierHtml(){
  const ownedHms = _ownedHmMoves();
  if(ownedHms.length < 2) return '';
  const pool = taggedPool();
  if(!pool.length) return '';
  const canLearn = (dex, move) => (LEARNSETS[dex]||[]).includes(move);
  const ranked = _calc.computeHMCarriers(pool, ownedHms, canLearn).slice(0,3);
  if(!ranked.length) return '';
  const rows = ranked.map((c,i) => {
    const pm = c.pm;
    const cantLearn = ownedHms.filter(m => !c.hmList.includes(m));
    const hmChips = c.hmList.map(m => `<span class="hmc-chip hmc-can">${m}</span>`).join('');
    const missChips = cantLearn.map(m => `<span class="hmc-chip hmc-cant">${m}</span>`).join('');
    const srcBadge = pm._src==='party' ? `<span class="hmc-src hmc-src-party">PARTY</span>` : `<span class="hmc-src hmc-src-pc">PC</span>`;
    return `<div class="hmc-row">
      <span class="hmc-rank">#${i+1}</span>
      <img class="hmc-sprite" src="${spriteUrl(pm.n)}" onerror="this.style.display='none'">
      <div class="hmc-info">
        <div class="hmc-name">${pm.name} ${srcBadge}</div>
        <div class="hmc-score">CARRIES ${c.hmsLearnable}/${ownedHms.length} HMs</div>
        <div class="hmc-chips">${hmChips}${missChips}</div>
      </div>
    </div>`;
  }).join('');
  return `<div class="hmc-card" aria-label="Recommended HM Carrier">
    <div class="hmc-hd">🎒 HM CARRIER — BEST FIELD-MOVE HOLDERS</div>
    <div class="hmc-sub">Keep a utility mon for HMs so your battlers don't burn moveslots.</div>
    ${rows}
  </div>`;
}

// ─── OCR TM Case scan ─────────────────────────────
async function scanTMCase(){
  if(!getClaudeKey()){ showPage('settings'); return; }
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;
  input.onchange = async () => {
    const files = Array.from(input.files);
    if(!files.length) return;
    const pt = activePt();
    if(!pt.tmInventory) pt.tmInventory = {};
    let totalAdded = 0, totalTok = 0;
    showToast('Reading TM Case…');
    for(const file of files){
      try {
        const result = await readTMCase(file);
        result.tms.forEach(r => {
          // Merge by max — handles multi-shot scans of paginated TM Case
          const prev = pt.tmInventory[r.num] || 0;
          if(r.count > prev){ pt.tmInventory[r.num] = r.count; totalAdded++; }
        });
        totalTok += (result._inputTokens||0) + (result._outputTokens||0);
      } catch(e){
        if(e.code === 'no_key' || e.code === 'bad_key'){ showPage('settings'); return; }
        showToast(e.detail || 'Could not read image', 'red');
      }
    }
    DataManager.save();
    renderTMs();
    if(totalAdded) showToast(`Scanned: ${totalAdded} entries updated (${totalTok} tok)`);
    else           showToast('No TMs recognised', 'red');
  };
  input.click();
}

function renderTMs(){
  const s = document.getElementById('tms-scroll');
  if(!s) return;

  const tms     = TM_HM.filter(t => t.tmType==='tm' && _matchesSearch(t) && _matchesOwnership(t));
  const hms     = TM_HM.filter(t => t.tmType==='hm' && _matchesSearch(t) && _matchesOwnership(t));
  const tutors  = MOVE_TUTORS.filter(t => _matchesSearch(t) && _matchesOwnership(t));

  const allOwned   = _allTmItems().filter(t => _tmOwned(t.num)).length;
  const allMissing = _allTmItems().length - allOwned;
  const allTotal   = _allTmItems().length;

  const filterBar = `<div class="tms-filter" role="group" aria-label="Filter by ownership">
    <button class="tms-fbtn ${tmsFilter==='all'?'active':''}"     onclick="setTmsFilter('all')"     aria-pressed="${tmsFilter==='all'}">ALL <span class="tms-fbtn-n">${allTotal}</span></button>
    <button class="tms-fbtn ${tmsFilter==='owned'?'active':''}"   onclick="setTmsFilter('owned')"   aria-pressed="${tmsFilter==='owned'}">OWNED <span class="tms-fbtn-n">${allOwned}</span></button>
    <button class="tms-fbtn ${tmsFilter==='missing'?'active':''}" onclick="setTmsFilter('missing')" aria-pressed="${tmsFilter==='missing'}">MISSING <span class="tms-fbtn-n">${allMissing}</span></button>
  </div>`;

  const carrierHtml = _renderHmCarrierHtml();

  const section = (label, list) => list.length
    ? `<div class="tm-section-lbl">${label} <span class="tm-section-n">(${list.length})</span></div>${list.map(_tmCardHtml).join('')}`
    : '';

  const utilHtml = `<div class="tm-section-lbl">UTILITY NPCS</div>` +
    UTILITY_NPCS.map(u => `<div class="tm-util-card">
      <div class="tm-util-hd">${u.label}</div>
      <div class="tm-util-loc">${u.loc}</div>
      <div class="tm-util-meta"><span class="tm-util-cost">${u.cost}</span> · <span class="tm-util-note">${u.note}</span></div>
    </div>`).join('');

  if(!tms.length && !hms.length && !tutors.length){
    s.innerHTML = filterBar + carrierHtml + `<div class="empty"><div class="ei">📀</div><p>NO RESULTS</p></div>` + utilHtml;
    return;
  }
  s.innerHTML = filterBar + carrierHtml + section('TMs', tms) + section('HMs', hms) + section('MOVE TUTORS', tutors) + utilHtml;
}

function goSearch(name){
  const p = POKEMON.find(x=>x.name===name);
  if(!p) return;
  showPage('search');
  pickPoke(p.n);
}
