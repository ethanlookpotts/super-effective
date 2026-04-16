// ═══════════════════════════════
// SEARCH PAGE
// ═══════════════════════════════
function buildTypePills(){
  const row = document.getElementById('type-filter-row');
  row.innerHTML = TYPES.map(t=>`<div class="tpill t-${t}${activeTypeFilter===t?' active':''}" role="button" onclick="setTypeFilter('${t}')">${t}</div>`).join('');
  row.addEventListener('scroll', _onPillScroll, {passive:true});
  _onPillScroll();
}
function _onPillScroll(){
  const row = document.getElementById('type-filter-row');
  if(!row) return;
  const atEnd = row.scrollLeft + row.clientWidth >= row.scrollWidth - 4;
  row.classList.toggle('scrolled-end', atEnd);
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
  setRoute('search', activeTypeFilter ? {type:activeTypeFilter} : {});
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
  activeTypeFilter = type;
  activePoke = null;
  _resetSearchInput();
  showPage('search');
  buildTypePills();
  renderSearch();
  setRoute('search', {type});
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
  setRoute('search');
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
  setRoute('search', {n});
}

// Default search state: recents + type browse
function renderSearch(){
  const scroll = document.getElementById('s-scroll');

  if(activePoke){ renderPokeDetail(); return; }

  const pt = activePt();
  let html = '';

  if(pt.recents.length){
    html += `<div class="section-label">RECENT</div>
    <div class="recent-chips">${pt.recents.map(r=>{
      const n = r.n || r;
      const name = r.name || (POKEMON.find(p=>p.n===n)||{}).name || '#'+n;
      return `<div class="rchip" onclick="pickPoke(${n})">${name}</div>`;
    }).join('')}</div>`;
  }

  if(activeTypeFilter){
    const filtered = POKEMON.filter(p=>p.types.includes(activeTypeFilter));
    html += `<div class="section-label">${activeTypeFilter.toUpperCase()} TYPE (${filtered.length})</div>`;
    filtered.forEach(p=>{
      const obtain = getObtain(p.n, activePt().gameId);
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

  const obtain = getObtain(p.n, activePt().gameId);
  const obtainHtml = obtain.map(o=>`<div class="obtain-row">${o}</div>`).join('');

  // Ability badge
  let abilityHtml = '';
  if(abilityMod){
    const note = abilityMod.multi ? '<span style="color:var(--text3);font-size:9px"> (may vary)</span>' : '';
    abilityHtml = `<div class="obtain-label" style="margin-top:8px;">ABILITY</div>
      <div class="obtain-row" style="color:var(--gold);font-weight:600;">${abilityMod.name}${note}</div>`;
  }

  // Evolution chain section
  const evoHtml = buildEvoChainHtml(p);

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
      ${evoHtml}
    </div>
  </div>`;

  // Base stats section
  const st = STATS[p.n];
  if(st){
    const [hp,atk,def,spa,spd,spe] = st;
    const physFav = atk > spa, even = atk === spa;
    const pct = v => Math.round(v/255*100)+'%';
    const lhi = (lbl,cls) => `<span class="stat-label${cls?' hi':''}">${lbl}</span>`;
    const nhi = (v,cls) => `<span class="stat-num${cls?' hi':''}">${v}</span>`;
    const recCls = even?'even':physFav?'phy':'spe';
    const recTxt = even ? `ATK = SpA ${atk} · either category fine`
      : physFav ? `⚔ Physical attacker — ATK ${atk} > SpA ${spa}`
      : `✦ Special attacker — SpA ${spa} > ATK ${atk}`;
    html += `<div class="sec-head">📊 BASE STATS <button class="stat-info-btn" aria-label="Base stats help" onclick="showStatsInfo(${atk},${spa})">ℹ</button></div>
    <div class="stats-section">
      <div class="stat-row">${lhi('HP',false)}${nhi(hp,false)}<div class="stat-bar"><div class="stat-fill hp" style="width:${pct(hp)}"></div></div></div>
      <div class="stat-row">${lhi('ATK',physFav&&!even)}${nhi(atk,physFav&&!even)}<div class="stat-bar"><div class="stat-fill atk" style="width:${pct(atk)}"></div></div></div>
      <div class="stat-row">${lhi('DEF',false)}${nhi(def,false)}<div class="stat-bar"><div class="stat-fill def" style="width:${pct(def)}"></div></div></div>
      <div class="stat-row">${lhi('SpA',!physFav&&!even)}${nhi(spa,!physFav&&!even)}<div class="stat-bar"><div class="stat-fill spa" style="width:${pct(spa)}"></div></div></div>
      <div class="stat-row">${lhi('SpD',false)}${nhi(spd,false)}<div class="stat-bar"><div class="stat-fill spd" style="width:${pct(spd)}"></div></div></div>
      <div class="stat-row">${lhi('SPE',false)}${nhi(spe,false)}<div class="stat-bar"><div class="stat-fill spe" style="width:${pct(spe)}"></div></div></div>
    </div>`;
  }

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

  // Add to party / PC buttons
  if(inParty){
    html += `<button class="add-party-btn in-party" onclick="showPage('party')">✓ IN PARTY — VIEW PARTY ›</button>`;
  } else {
    html += `<button class="add-party-btn" onclick="addToParty(${p.n})">➕ ADD TO PARTY</button>`;
    const inPC = pt.pc && pt.pc.some(pm=>pm.n===p.n);
    if(inPC){
      html += `<button class="add-pc-btn in-pc" disabled>📦 IN PC BOX</button>`;
    } else {
      html += `<button class="add-pc-btn" onclick="addToPC(${p.n})">📦 SEND TO PC</button>`;
    }
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
          const md = MOVE_DATA[mv.name];
          const pow = md ? md[0] : null;
          const acc = md ? md[1] : null;
          const effNote = md ? md[2] : null;
          sm.push({...mv,raw,stab,pow,acc,effNote,eff:raw*(stab?1.5:1)});
        });
        sm.sort((a,b)=>b.eff-a.eff||(b.pow||0)-(a.pow||0));
        bestOff = sm[0].eff;
      }
      // Defense: how well the enemy hits pm (with ability mods on pm)
      const defRisks = et.map(at=>({type:at,m:applyAbilityMod(dmult(at,pm.types),at,pm.n)}));
      const defRisk = Math.max(...defRisks.map(r=>r.m));
      const defBestType = defRisks.find(r=>r.m===defRisk);
      const pmImm = et.filter(at=>applyAbilityMod(dmult(at,pm.types),at,pm.n)===0);
      const pmSt = STATS[pm.n];
      const statNote = pmSt ? (pmSt[1]>pmSt[3]?`phy`:pmSt[1]<pmSt[3]?`spe`:`even`) : null;
      const statLabel = pmSt ? (pmSt[1]>pmSt[3]?`PHY · Atk ${pmSt[1]}`:pmSt[1]<pmSt[3]?`SPE · SpA ${pmSt[3]}`:`ATK = SpA ${pmSt[1]}`) : null;
      const atkStats = computeAttackerStats(pm);
      return{pm,bestOff,bestAtkType,sm,defRisk,defBestType,pmImm,statNote,statLabel,atkStats,score:bestOff*3-defRisk};
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
      const atkLevel = parseInt(pm.level) || 50;
      const enemyBase = STATS[p.n];
      const enemyLevel = atkLevel;
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
          // Damage range
          let dmgHtml = '';
          if(s.atkStats && enemyBase && mv.pow > 0 && mv.eff > 0){
            const atkStat = phys ? s.atkStats.atk : s.atkStats.spa;
            const defStat = estimateEnemyStat(enemyBase[phys?2:4], enemyLevel);
            const defHP = estimateEnemyHP(enemyBase[0], enemyLevel);
            const rng = damageRangePct(atkLevel, atkStat, defStat, defHP, mv.pow, mv.eff);
            if(rng) dmgHtml = `<span class="mv-dmg mv-dmg-est">~${rng[0]}–${rng[1]}%</span>`;
          }
          // Move metadata sub-line
          let mvSub = '';
          {
            let parts = [];
            if(mv.pow > 0) parts.push(`<span class="mv-pow">${mv.pow}bp</span>`);
            else if(mv.pow === 0 && mv.effNote) parts.push(`<span class="mv-pow">status</span>`);
            if(dmgHtml) parts.push(dmgHtml);
            if(mv.acc > 0 && mv.acc < 100) parts.push(`<span class="mv-acc">${mv.acc}%</span>`);
            else if(mv.acc === 0 && mv.pow > 0) parts.push(`<span class="mv-acc">∞ acc</span>`);
            if(mv.effNote){
              const ec = _mvEffClass(mv.effNote);
              parts.push(`<span class="mv-eff ${ec}">${mv.effNote}</span>`);
            }
            if(parts.length) mvSub = `<div class="mv-sub">${parts.join('')}</div>`;
          }
          atkHtml+=`<div class="sc-mr why" onclick="showMoveBreakdown('${mv.name}','${mv.type}',${p.n},${pm.n})"><span class="tb sm t-${mv.type}" style="margin-top:1px;">${mv.type}</span><span style="flex:1">${mv.name}${mvSub}</span><span class="sc-tags">${tags}</span></div>`;
        });
        atkHtml += '</div>';
      } else if(s.bestAtkType){
        const raw = applyAbilityMod(dmult(s.bestAtkType,et),s.bestAtkType,p.n);
        const stHint = s.statLabel ? ` · <span class="sc-stat-note ${s.statNote}">${s.statLabel}</span>` : '';
        atkHtml = `<div class="sc-hint">Best type: <span class="tb sm t-${s.bestAtkType}">${s.bestAtkType}</span>${raw>=2?` <span class="mtag m2x" style="display:inline-block">${raw}×</span>`:''} · <span style="color:var(--text3);font-size:11px">add moves for full breakdown</span>${stHint}</div>`;
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
      const stNoteHtml = s.statLabel ? `<div class="sc-stat-note ${s.statNote}">${s.statLabel}</div>` : '';
      html += `<div class="scard${isTop?' top':''}${s.defRisk>=4?' risky':''}">
        <div class="sc-r1">
          <div><div style="display:flex;align-items:baseline;gap:4px;"><span class="sc-name">${isTop?'⭐ ':''}${pm.name}</span>${lvTxt}</div>
          <div class="sc-types" style="margin-top:3px;">${tBadges}</div>${stNoteHtml}</div>
          <span class="sc-badge ${bc}">${bt}</span>
        </div>
        ${atkHtml}${defHtml}
      </div>`;
    });
  }

  scroll.innerHTML = html;
  scroll.scrollTop = 0;
}

// Full evolution chain HTML for the detail card obtain section.
// Shows all stages horizontally, highlights the current Pokémon, and adds
// EVOLVE buttons for any party member in the same chain.
function buildEvoChainHtml(p){
  if(!EVOS[p.n]) return '';
  const chain = getEvoChain(p.n);
  const hasBranch = chain.some(s=>s.branches);
  let html = '';

  if(hasBranch){
    const root = chain[0];
    const rp = POKEMON.find(pk=>pk.n===root.n);
    html += `<div class="evo-chain">`;
    html += `<div class="evo-stage${root.n===p.n?' current':''}" role="button" aria-label="View ${rp.name}" onclick="pickPoke(${root.n})">`;
    html += `<span class="es-name">${rp.name}</span><span class="es-num">#${String(root.n).padStart(3,'0')}</span></div>`;
    html += `<div class="evo-step"><span class="es-arr">→</span></div>`;
    html += `<div class="evo-branches">`;
    root.branches.forEach(b=>{
      const bp = POKEMON.find(pk=>pk.n===b.n);
      html += `<div class="evo-branch-item">`;
      html += `<div class="evo-stage${b.n===p.n?' current':''}" role="button" aria-label="View ${bp.name}" onclick="pickPoke(${b.n})">`;
      html += `<span class="es-name">${bp.name}</span><span class="es-num">#${String(b.n).padStart(3,'0')}</span></div>`;
      html += `<span class="es-cond">${b.c}</span></div>`;
    });
    html += `</div></div>`;
  } else {
    html += `<div class="evo-chain">`;
    chain.forEach(stage=>{
      const sp = POKEMON.find(pk=>pk.n===stage.n);
      html += `<div class="evo-stage${stage.n===p.n?' current':''}" role="button" aria-label="View ${sp.name}" onclick="pickPoke(${sp.n})">`;
      html += `<span class="es-name">${sp.name}</span><span class="es-num">#${String(sp.n).padStart(3,'0')}</span></div>`;
      if(stage.next){
        html += `<div class="evo-step"><span class="es-arr">→</span><span class="es-cond">${stage.next}</span></div>`;
      }
    });
    html += `</div>`;
  }

  // Evolve buttons for party members that can evolve within this chain
  const allNums = new Set(chain.map(s=>s.n));
  chain.forEach(s=>{ if(s.branches) s.branches.forEach(b=>allNums.add(b.n)); });
  const pt = activePt();
  let btnHtml = '';
  pt.party.forEach(pm=>{
    if(!allNums.has(pm.n)) return;
    const pmEvo = EVOS[pm.n];
    if(!pmEvo||!pmEvo.into) return;
    pmEvo.into.forEach(e=>{
      const tp = POKEMON.find(pk=>pk.n===e.n);
      if(tp) btnHtml += `<button class="evo-btn" onclick="evolvePartyMember(${pm.n},${e.n})">EVOLVE ${pm.name} → ${tp.name} <span class="evo-btn-cond">${e.c}</span></button>`;
    });
  });
  if(btnHtml) html += `<div class="evo-evolve-btns">${btnHtml}</div>`;

  return `<div class="obtain-label" style="margin-top:8px;">EVOLUTION CHAIN</div>${html}`;
}

// ─── Base stats info overlay ───────────────────────────────────────────────
function statsInfoOvClick(e){ if(e.target===document.getElementById('stats-info-overlay')) closeStatsInfo(); }
function closeStatsInfo(){ document.getElementById('stats-info-overlay').classList.remove('open'); }

function showStatsInfo(atk, spa){
  const STAT_ROWS = [
    {cls:'hp',  title:'HP — Hit Points',      desc:'Damage absorbed before fainting.'},
    {cls:'atk', title:'ATK — Physical Attack', desc:'Power of Physical moves (Normal, Fighting, Flying, Poison, Ground, Rock, Bug, Ghost, Steel).'},
    {cls:'def', title:'DEF — Physical Defence',desc:'Resistance to incoming Physical moves.'},
    {cls:'spa', title:'SpA — Special Attack',  desc:'Power of Special moves (Fire, Water, Grass, Electric, Ice, Psychic, Dragon, Dark).'},
    {cls:'spd', title:'SpD — Special Defence', desc:'Resistance to incoming Special moves.'},
    {cls:'spe', title:'SPE — Speed',           desc:'Higher Speed goes first each turn.'},
  ];

  let recHtml = '';
  if(atk != null && spa != null){
    if(atk > spa)
      recHtml = `<div class="si-rec phy">⚔ Physical attacker — ATK ${atk} &gt; SpA ${spa}<br>PHY-tagged moves will hit harder. Prefer them in matchups.</div>`;
    else if(spa > atk)
      recHtml = `<div class="si-rec spe">✦ Special attacker — SpA ${spa} &gt; ATK ${atk}<br>SPE-tagged moves will hit harder. Prefer them in matchups.</div>`;
    else
      recHtml = `<div class="si-rec even">ATK = SpA ${atk} — either category works equally.</div>`;
  }

  const rows = STAT_ROWS.map(s=>`
    <div class="si-stat-row">
      <div class="si-stat-dot ${s.cls}"></div>
      <div><div class="si-stat-title">${s.title}</div><div class="si-stat-desc">${s.desc}</div></div>
    </div>`).join('');

  document.getElementById('stats-info-body').innerHTML = `
    ${recHtml}
    <div class="si-section-lbl">WHAT EACH STAT MEANS</div>
    ${rows}
    <div class="si-section-lbl" style="margin-top:14px;">WHY YOUR ACTUAL STATS DIFFER</div>
    <div class="si-note">These are <strong>species base stats</strong> — identical for every member of that species. Your individual Pokémon's real numbers are higher, shaped by IVs (random 0–31), EVs (from battles), nature (±10%), and level. The ATK vs SpA ratio stays the same regardless, so the recommendation above is still reliable.</div>`;
  document.getElementById('stats-info-overlay').classList.add('open');
}
// ───────────────────────────────────────────────────────────────────────────

// Map effect string to CSS colour class for the move-effect badge
function _mvEffClass(eff){
  const e = eff.toLowerCase();
  if(e.includes('burn') || e.includes('fire')) return 'burn';
  if(e.includes('para')) return 'para';
  if(e.includes('sleep')) return 'sleep';
  if(e.includes('psn') || e.includes('poison')) return 'psn';
  if(e.includes('freeze')) return 'freeze';
  if(e.includes('flinch')) return 'flinch';
  if(e.includes('drain')) return 'drain';
  if(e.includes('ohko')) return 'ohko';
  return 'stat';
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
