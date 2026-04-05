// ═══════════════════════════════
// SEARCH PAGE
// ═══════════════════════════════
function buildTypePills(){
  const row = document.getElementById('type-filter-row');
  row.innerHTML = TYPES.map(t=>`<div class="tpill t-${t}${activeTypeFilter===t?' active':''}" role="button" onclick="setTypeFilter('${t}')">${t}</div>`).join('');
}

function setTypeFilter(t){
  if(activeTypeFilter===t){
    activeTypeFilter = null;
  } else {
    activeTypeFilter = t;
    _resetSearchInput();
  }
  buildTypePills();
  renderSearch();
}

function _resetSearchInput(){
  activePoke = null;
  document.getElementById('s-in').value = '';
  document.getElementById('s-cl').style.display = 'none';
  document.getElementById('s-drop').style.display = 'none';
  document.getElementById('s-scroll').scrollTop = 0;
}

// Jump to Search with a specific type pill active (used by coverage dots + other tabs)
function setTypeAndSearch(type){
  showPage('search');
  activeTypeFilter = type;
  _resetSearchInput();
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
  const abilityMod = getAbilityMod(p.n);

  const obtain = getObtain(p.n);
  const obtainHtml = obtain.map(o=>`<div class="obtain-row">${o}</div>`).join('');

  // Ability badge
  let abilityHtml = '';
  if(abilityMod){
    const note = abilityMod.multi ? '<span style="color:var(--text3);font-size:9px"> (may vary)</span>' : '';
    abilityHtml = `<div class="obtain-label" style="margin-top:8px;">ABILITY</div>
      <div class="obtain-row" style="color:var(--gold);font-weight:600;">${abilityMod.name}${note}</div>`;
  }

  let html = `<div class="poke-card">
    <div class="poke-card-row">
      <div>
        <div class="pc-num">#${String(p.n).padStart(3,'0')}</div>
        <div class="pc-name" role="heading">${p.name}</div>
        <div class="pc-types">${et.map(t=>`<span class="tb t-${t}">${t}</span>`).join('')}</div>
      </div>
      <img src="${spriteUrl(p.n)}" style="width:64px;height:64px;object-fit:contain;opacity:.9;" onerror="this.style.display='none'">
    </div>
    <div class="obtain-section">
      <div class="obtain-label">HOW TO OBTAIN</div>
      ${obtainHtml}
      ${abilityHtml}
    </div>
  </div>`;

  // Type chart — shown ABOVE party suggestions
  const dc = {}; TYPES.forEach(at=>{dc[at]=applyAbilityMod(dmult(at,et),at,p.n);});
  const g = {4:[],2:[],0:[],.5:[],.25:[]};
  Object.entries(dc).forEach(([t,m])=>{
    if(m>=4) g[4].push(t); else if(m===2) g[2].push(t);
    else if(m===0) g[0].push(t); else if(m<=.25) g[.25].push(t);
    else if(m===.5) g[.5].push(t);
  });
  const sec=(cls,lbl,arr)=>arr.length?`<div class="rcrow"><div class="rch ${cls}">${lbl}</div><div class="rcbody">${arr.map(t=>`<span class="tb t-${t}">${t}</span>`).join('')}</div></div>`:'';
  html += `<div class="sec-head">📊 TYPE CHART — DEFENDING</div>
    ${sec('x4','💥 4× Weak',g[4])}
    ${sec('x2','✅ 2× Weak',g[2])}
    ${sec('x0','🚫 0× Immune',g[0])}
    ${sec('xq','¼× Resists',g[.25])}
    ${sec('xh','½× Resists',g[.5])}`;

  // Add to party button
  if(inParty){
    html += `<button class="add-party-btn in-party" onclick="showPage('party')">✓ IN PARTY — VIEW PARTY ›</button>`;
  } else {
    html += `<button class="add-party-btn" onclick="addToParty(${p.n})">➕ ADD TO PARTY</button>`;
  }

  // Party suggestions — with both attack and defense matchups
  html += `<div class="sec-head">MY PARTY — WHO TO USE</div>`;
  if(!pt.party.length){
    html += `<div class="no-party"><div class="np-txt">ADD POKEMON TO PARTY<br>FOR BATTLE SUGGESTIONS</div><button class="go-btn" onclick="showPage('party')">GO TO MY PARTY ›</button></div>`;
  } else {
    const scored = pt.party.map(pm=>{
      // Offense: how well pm hits the enemy (with ability mods on enemy)
      let bestOff = 0, bestAtkType = null;
      pm.types.forEach(at=>{
        const m = applyAbilityMod(dmult(at,et),at,p.n)*1.5;
        if(m>bestOff){bestOff=m;bestAtkType=at;}
      });
      let sm = [];
      if(pm.moves && pm.moves.length){
        pm.moves.forEach(mv=>{
          const raw = applyAbilityMod(dmult(mv.type,et),mv.type,p.n);
          const stab = pm.types.includes(mv.type);
          sm.push({...mv,raw,stab,eff:raw*(stab?1.5:1)});
        });
        sm.sort((a,b)=>b.eff-a.eff); bestOff = sm[0].eff;
      }
      // Defense: how well the enemy hits pm (with ability mods on pm)
      const defRisks = et.map(at=>({type:at,m:applyAbilityMod(dmult(at,pm.types),at,pm.n)}));
      const defRisk = Math.max(...defRisks.map(r=>r.m));
      const defBestType = defRisks.find(r=>r.m===defRisk);
      const pmImm = et.filter(at=>applyAbilityMod(dmult(at,pm.types),at,pm.n)===0);
      return{pm,bestOff,bestAtkType,sm,defRisk,defBestType,pmImm,score:bestOff*3-defRisk};
    }).sort((a,b)=>b.score-a.score);

    scored.forEach((s,i)=>{
      const pm = s.pm; const isTop = i===0;
      const tBadges = pm.types.map(t=>`<span class="tb sm t-${t}">${t}</span>`).join('');
      // Offense badge
      let bc='bo', bt='~ OK';
      if(s.bestOff>=6){bc='bn';bt='💥 NUKE';}
      else if(s.bestOff>=3){bc='bg';bt='⭐ GREAT';}
      else if(s.bestOff>=2){bc='bgo';bt='✅ GOOD';}
      else if(s.bestOff<1){bc='bb';bt='✗ WEAK';}

      // Offense section
      let atkHtml = '';
      if(s.sm.length){
        atkHtml = '<div class="sc-moves">';
        s.sm.forEach(mv=>{
          const phys = PHYS.has(mv.type);
          let tags = '';
          if(mv.raw>=4) tags+=`<span class="mtag m4x">4×</span>`;
          else if(mv.raw>=2) tags+=`<span class="mtag m2x">2×</span>`;
          else if(mv.raw===0) tags+=`<span class="mtag m0x">0×</span>`;
          if(mv.stab) tags+=`<span class="mtag mstab">STAB</span>`;
          tags+=`<span class="mtag ${phys?'mphy':'mspe'}">${phys?'PHY':'SPE'}</span>`;
          atkHtml+=`<div class="sc-mr why" onclick="showMoveBreakdown('${mv.name}','${mv.type}',${p.n},${pm.n})"><span class="tb sm t-${mv.type}">${mv.type}</span><span style="flex:1">${mv.name}</span><span class="sc-tags">${tags}</span></div>`;
        });
        atkHtml += '</div>';
      } else if(s.bestAtkType){
        const raw = applyAbilityMod(dmult(s.bestAtkType,et),s.bestAtkType,p.n);
        atkHtml = `<div class="sc-hint">Best type: <span class="tb sm t-${s.bestAtkType}">${s.bestAtkType}</span>${raw>=2?` <span class="mtag m2x" style="display:inline-block">${raw}×</span>`:''} · <span style="color:var(--text3);font-size:11px">add moves for full breakdown</span></div>`;
      }

      // Defense section
      let defHtml = '';
      if(s.pmImm.length){
        defHtml += `<div class="sc-imm">🛡 ${pm.name} immune to ${s.pmImm.map(t=>`<span class="tb sm t-${t}">${t}</span>`).join(' ')}</div>`;
      }
      if(s.defRisk>=4){
        defHtml += `<div class="sc-warn">⚠️ Enemy hits ${pm.name} <strong>4×</strong> with <span class="tb sm t-${s.defBestType.type}">${s.defBestType.type}</span> — HIGH RISK</div>`;
      } else if(s.defRisk>=2){
        defHtml += `<div class="sc-warn">⚠️ Enemy hits ${pm.name} <strong>${s.defRisk}×</strong> with <span class="tb sm t-${s.defBestType.type}">${s.defBestType.type}</span></div>`;
      } else if(s.defRisk<=.5){
        defHtml += `<div class="sc-imm">🛡 ${pm.name} resists enemy (${s.defRisk}×)</div>`;
      }

      const lvTxt = pm.level ? ` <span class="sc-lv">Lv.${pm.level}</span>` : '';
      html += `<div class="scard${isTop?' top':''}${s.defRisk>=4?' risky':''}">
        <div class="sc-r1">
          <div><div style="display:flex;align-items:baseline;gap:4px;"><span class="sc-name">${isTop?'⭐ ':''}${pm.name}</span>${lvTxt}</div>
          <div class="sc-types" style="margin-top:3px;">${tBadges}</div></div>
          <span class="sc-badge ${bc}">${bt}</span>
        </div>
        ${atkHtml}${defHtml}
      </div>`;
    });
  }

  scroll.innerHTML = html;
  scroll.scrollTop = 0;
}

// Shared dropdown renderer
function renderPDrop(id, list, fn){
  const dd = document.getElementById(id);
  if(!list.length){ dd.style.display='none'; return; }
  dd.style.display = 'block';
  dd.innerHTML = list.map(p=>`<div class="prow" role="option" aria-label="${p.name}" onclick="${fn}(${p.n})">
    <span class="pnum">#${String(p.n).padStart(3,'0')}</span>
    <span class="pname">${p.name}</span>
    <span class="pbadges">${p.types.map(t=>`<span class="tb sm t-${t}">${t}</span>`).join('')}</span>
  </div>`).join('');
}
