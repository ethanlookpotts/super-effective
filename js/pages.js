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
  closeDrawer();
  if(id==='search'){
    const params = activePoke ? {n:activePoke.n} : (activeTypeFilter ? {type:activeTypeFilter} : {});
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
function _tmCardHtml(t){
  const mc=t.cat==='phy'?'mphy':t.cat==='spe'?'mspe':'mstab';
  const cl=t.cat==='phy'?'PHY':t.cat==='spe'?'SPE':'STA';
  return `<div class="tm-card">
    <div class="tm-card-top">
      <span class="tm-card-num">${t.num}</span>
      <span class="tm-card-move">${t.move}</span>
      <span class="tb sm t-${t.type}">${t.type}</span>
      <span class="mtag ${mc}">${cl}</span>
    </div>
    <div class="tm-card-loc">${t.loc}</div>
  </div>`;
}

// ═══════════════════════════════
// TMs & HMs PAGE
// ═══════════════════════════════
function filterTMs(v){
  const q = v.toLowerCase().trim();
  const list = q ? TM_HM.filter(t=>t.move.toLowerCase().includes(q)||t.num.toLowerCase().replace(' ','').includes(q)||t.loc.toLowerCase().includes(q)) : TM_HM;
  renderTMs(list);
}
function renderTMs(list){
  const s = document.getElementById('tms-scroll');
  if(!list.length){ s.innerHTML=`<div class="empty"><div class="ei">📀</div><p>NO RESULTS</p></div>`; return; }
  s.innerHTML = list.map(_tmCardHtml).join('');
}

function goSearch(name){
  const p = POKEMON.find(x=>x.name===name);
  if(!p) return;
  showPage('search');
  pickPoke(p.n);
}
