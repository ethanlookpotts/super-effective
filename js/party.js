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
      <div class="ps-num">#${String(pm.n).padStart(3,'0')}${pm.shiny?' <span style="color:#FFD700">✦</span>':''}</div>
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
function _loadModalMember(pm){
  mPoke = {n:pm.n, name:pm.name, types:pm.types};
  mMoves = [...(pm.moves||[])];
  mLv = pm.level||'';
  mNature = pm.nature || pm.advStats?.nature || '';
  mAbility      = pm.ability||'';
  mItem         = pm.item != null ? pm.item : '';
  mGender       = pm.gender||'';
  mStats        = pm.stats ? {...pm.stats} : null;
  mShiny        = pm.shiny || false;
  mOtName       = pm.otName||'';
  mOtId         = pm.otId||'';
  mPokeball     = pm.pokeball||'';
  mTrainerMemo  = pm.trainerMemo||'';
}
function _clearModalMember(){
  mPoke = null; mMoves = []; mLv = ''; mNature = '';
  mAbility = ''; mItem = ''; mGender = ''; mStats = null;
  mShiny = false; mOtName = ''; mOtId = ''; mPokeball = ''; mTrainerMemo = '';
}
function _openModal(){
  mHPPicking = false; mMovesOpen = false; mInfoOpen = false;
  mTypeFilter = null; mMoveQ = ''; mScanResult = null;
  renderModal();
  document.getElementById('overlay').classList.add('open');
}

function openModal(idx){
  const pt = activePt();
  mMode = 'party'; mSlot = idx;
  if(idx>=0 && idx<pt.party.length) _loadModalMember(pt.party[idx]);
  else _clearModalMember();
  document.getElementById('modal-ttl').textContent = (idx>=0 && idx<pt.party.length) ? 'EDIT POKÉMON' : 'ADD POKÉMON';
  _openModal();
}

function openPCModal(idx){
  const pt = activePt();
  mMode = 'pc'; mSlot = idx;
  if(idx>=0 && idx<pt.pc.length) _loadModalMember(pt.pc[idx]);
  else _clearModalMember();
  document.getElementById('modal-ttl').textContent = (idx>=0 && idx<pt.pc.length) ? 'EDIT PC POKÉMON' : 'ADD TO PC';
  _openModal();
}
function closeModal(){
  document.getElementById('overlay').classList.remove('open');
  mPoke = null; mMoves = []; mLv = ''; mNature = '';
  mAbility = ''; mItem = ''; mGender = ''; mStats = null;
  mShiny = false; mOtName = ''; mOtId = ''; mPokeball = ''; mTrainerMemo = '';
  mMovesOpen = false; mInfoOpen = false; mScanResult = null;
}
function oClick(e){ if(e.target===document.getElementById('overlay')) closeModal(); }

function renderModal(){
  const body = document.getElementById('modal-body');
  const pt = activePt();

  // Pokémon search
  let html = `<div class="mlbl">POKÉMON</div>
  <div class="sbox" style="margin-bottom:8px;">
    <input class="si" id="ms-in" placeholder="Search Pokémon..." oninput="onMS(this.value)"
      autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" value="${mPoke?mPoke.name:''}">
    <button class="xcl" id="ms-cl" onclick="clearMP()" style="display:${mPoke?'block':'none'}">✕</button>
  </div>
  <div id="ms-drop" class="pdrop" style="display:none;margin:0;border-radius:var(--r);border-top:1.5px solid var(--border2);margin-bottom:8px;"></div>`;

  html += `<button class="ocr-scan-btn" onclick="_triggerOCRScan()" aria-label="Scan game screens">📷 SCAN GAME SCREENS</button>`;
  html += _renderScanResultBox();

  if(mPoke){
    const tb = mPoke.types.map(t=>`<span class="tb t-${t}">${t}</span>`).join(' ');
    html += `<div style="background:var(--card2);border:1px solid var(--border2);border-radius:9px;padding:9px 12px;margin-bottom:10px;">
      <div style="font-size:10px;color:var(--text3);margin-bottom:2px;">#${String(mPoke.n).padStart(3,'0')}</div>
      <div style="font-family:var(--fp);font-size:8.5px;color:var(--gold);margin-bottom:5px;">${mPoke.name}</div>
      <div>${tb}</div>
    </div>`;
  }

  // Moves section (collapsible)
  const moveCount = mMoves.length;
  const moveSummary = mPoke ? `${moveCount}/4 SET` : '';
  const movesDisabled = !mPoke;
  html += `<div class="modal-sec-hd${movesDisabled?' sec-disabled':''}" ${mPoke?`onclick="toggleMovesSection()" role="button" aria-expanded="${mMovesOpen}"`:''} aria-label="Moves section">
    <span class="modal-sec-ttl">MOVES</span>
    <span class="modal-sec-info">${moveSummary}</span>
    <span class="modal-sec-arr">${mMovesOpen?'▾':'▶'}</span>
  </div>
  <div class="modal-sec-body" style="display:${mMovesOpen&&mPoke?'block':'none'}">
    <div id="move-section"></div>
  </div>`;

  // Info section — ability / item / gender / full stats / shiny / OT / memo (collapsible)
  const hasInfo = mAbility || mItem !== '' || mGender || mStats || mShiny || mOtName || mPokeball || mTrainerMemo;
  const infoDisabled = !mPoke;
  const infoSummary = mPoke && hasInfo
    ? [mAbility, mItem!==''?(mItem||'no item'):'', mGender==='M'?'♂':mGender==='F'?'♀':'', mShiny?'✦ SHINY':''].filter(Boolean).join(' · ')
    : '';
  const statKeys = ['hp','atk','def','spatk','spdef','spe'];
  const statLabels = {hp:'HP',atk:'ATK',def:'DEF',spatk:'SpA',spdef:'SpD',spe:'SPE'};
  const statsInputs = statKeys.map(k =>
    `<div style="display:flex;flex-direction:column;gap:3px;">
      <div class="adv-row-hd" style="text-align:center;">${statLabels[k]}</div>
      <input class="adv-in" type="number" min="1" max="999" placeholder="—"
        value="${mStats&&mStats[k]!=null?mStats[k]:''}"
        oninput="if(!mStats)mStats={};mStats['${k}']=this.value?parseInt(this.value):null"
        inputmode="numeric" aria-label="${statLabels[k]} stat" style="text-align:center;">
    </div>`
  ).join('');
  html += `<div class="modal-sec-hd${infoDisabled?' sec-disabled':''}" ${mPoke?`onclick="toggleInfoSection()" role="button" aria-expanded="${mInfoOpen}"`:''} aria-label="Info section">
    <span class="modal-sec-ttl">INFO</span>
    <span class="modal-sec-info">${infoSummary}</span>
    <span class="modal-sec-arr">${mInfoOpen?'▾':'▶'}</span>
  </div>
  <div class="modal-sec-body" style="display:${mInfoOpen&&mPoke?'block':'none'}">
    <div style="display:flex;flex-direction:column;gap:7px;padding-bottom:4px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <label class="adv-row-hd" for="info-ability" style="width:52px;flex-shrink:0;">ABILITY</label>
        <input class="adv-in" id="info-ability" type="text" placeholder="e.g. Torrent"
          value="${mAbility}" oninput="mAbility=this.value" autocomplete="off" autocorrect="off" spellcheck="false" aria-label="Ability" style="flex:1;min-width:0;">
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <label class="adv-row-hd" for="info-item" style="width:52px;flex-shrink:0;">ITEM</label>
        <input class="adv-in" id="info-item" type="text" placeholder="none"
          value="${mItem}" oninput="mItem=this.value" autocomplete="off" autocorrect="off" spellcheck="false" aria-label="Held item" style="flex:1;min-width:0;">
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <label class="adv-row-hd" for="info-gender" style="width:52px;flex-shrink:0;">GENDER</label>
        <select class="adv-in" id="info-gender" onchange="mGender=this.value" aria-label="Gender" style="flex:1;min-width:0;">
          <option value="" ${!mGender?'selected':''}>—</option>
          <option value="M" ${mGender==='M'?'selected':''}>♂ Male</option>
          <option value="F" ${mGender==='F'?'selected':''}>♀ Female</option>
        </select>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <label class="adv-row-hd" for="info-shiny" style="width:52px;flex-shrink:0;">SHINY</label>
        <button id="info-shiny" class="shiny-toggle${mShiny?' shiny-on':''}" onclick="mShiny=!mShiny;renderModal()" aria-label="Shiny toggle" aria-pressed="${mShiny}">
          ${mShiny?'✦ YES':'◇ NO'}
        </button>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <label class="adv-row-hd" for="info-ball" style="width:52px;flex-shrink:0;">BALL</label>
        <input class="adv-in" id="info-ball" type="text" placeholder="Poké Ball"
          value="${mPokeball}" oninput="mPokeball=this.value" autocomplete="off" spellcheck="false" aria-label="Poké Ball" style="flex:1;min-width:0;">
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <label class="adv-row-hd" for="info-ot" style="width:52px;flex-shrink:0;">OT</label>
        <input class="adv-in" id="info-ot" type="text" placeholder="Trainer name"
          value="${mOtName}" oninput="mOtName=this.value" autocomplete="off" spellcheck="false" aria-label="Original Trainer name" style="flex:1.5;min-width:0;">
        <input class="adv-in" type="number" placeholder="ID" min="0" max="65535"
          value="${mOtId}" oninput="mOtId=this.value" inputmode="numeric" aria-label="Trainer ID" style="width:64px;flex-shrink:0;">
      </div>
      <div>
        <div class="adv-row-hd" style="margin-bottom:5px;">TRAINER MEMO</div>
        <textarea class="adv-in" rows="2" placeholder="e.g. Bold nature. Met at Lv. 5. Route 1."
          oninput="mTrainerMemo=this.value" aria-label="Trainer memo" style="width:100%;resize:none;box-sizing:border-box;">${mTrainerMemo}</textarea>
      </div>
      <div>
        <div class="adv-row-hd" style="margin-bottom:5px;">STATS</div>
        <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:5px;">${statsInputs}</div>
      </div>
    </div>
  </div>`;

  // Level + Nature inline (always visible when Pokémon selected)
  if(mPoke){
    const natOpts = `<option value="">— neutral</option>` +
      NATURE_NAMES.map(n=>`<option value="${n}"${mNature===n?' selected':''}>${n}</option>`).join('');
    const natNote = mNature ? `<div class="adv-nat-note">${natureSummary(mNature)}</div>` : '';
    const atkStats = computeAttackerStats({n:mPoke.n, level:mLv, nature:mNature});
    const computed = atkStats ? `~ATK\u00a0${atkStats.atk}\u00a0·\u00a0SpA\u00a0${atkStats.spa}\u00a0·\u00a0Spe\u00a0${atkStats.spe}` : '';
    html += `<div class="adv-top-row">
      <div>
        <div class="field-lbl">LEVEL</div>
        <input class="field-in" id="f-lv" type="number" min="1" max="100" placeholder="50"
          value="${mLv}" oninput="mLv=this.value;_refreshComputed()" style="width:72px;" inputmode="numeric" aria-label="Level">
      </div>
      <div style="flex:1;">
        <div class="field-lbl">NATURE</div>
        <select class="field-in adv-nature-sel" id="f-nature" onchange="mNature=this.value;_refreshComputed()" aria-label="Nature">${natOpts}</select>
      </div>
    </div>
    ${natNote}
    <div class="adv-computed" id="adv-computed">${computed}</div>`;
  }

  const isEditing = mMode==='pc' ? (mSlot>=0&&mSlot<pt.pc.length) : (mSlot>=0&&mSlot<pt.party.length);
  const saveLabel = isEditing ? '💾 SAVE CHANGES' : (mMode==='pc' ? '➕ ADD TO PC' : '➕ ADD TO PARTY');
  const rmLabel = mMode==='pc' ? '✕ REMOVE FROM PC' : '✕ REMOVE FROM PARTY';
  html += `<button class="save-btn" onclick="saveModal()" ${mPoke?'':'disabled'}>${saveLabel}</button>`;
  if(isEditing) html+=`<button class="rm-btn" onclick="rmParty(${mSlot})">${rmLabel}</button>`;

  const sp = body.scrollTop; body.innerHTML = html; body.scrollTop = sp;
  renderMoveSection();
}

function _refreshComputed(){
  if(!mPoke) return;
  const s = computeAttackerStats({n:mPoke.n, level:mLv, nature:mNature});
  const el = document.getElementById('adv-computed');
  if(el && s) el.textContent = `~ATK\u00a0${s.atk}\u00a0·\u00a0SpA\u00a0${s.spa}\u00a0·\u00a0Spe\u00a0${s.spe}`;
}

function _applyFromScanResult(){
  if(!mScanResult) return;
  const { poke, level, nature, moves, ability, item, stats, gender, shiny, otName, otId, pokeball, trainerMemo } = mScanResult;
  if(poke && !mPoke){
    mPoke = {n:poke.n, name:poke.name, types:poke.types};
    mMoves = []; mHPPicking = false; mNature = '';
  }
  if(level)        mLv     = level;
  if(nature)       mNature = nature;
  if(ability)      mAbility          = ability;
  if(item != null) mItem             = item || '';
  if(gender)       mGender           = gender;
  if(stats)        mStats            = {...stats};
  if(shiny != null) mShiny           = shiny;
  if(otName)       mOtName           = otName;
  if(otId)         mOtId             = String(otId);
  if(pokeball)     mPokeball         = pokeball;
  if(trainerMemo)  mTrainerMemo      = trainerMemo;
  if(moves && moves.length){
    mMoves = [];
    moves.slice(0,4).forEach(m => mMoves.push(m));
    mMovesOpen = true;
  }
  if(ability || item != null || gender || stats || shiny != null || otName || pokeball) mInfoOpen = true;
  if(level || nature || ability || item != null || gender || stats || shiny != null || otName || pokeball) mInfoOpen = true;
  renderModal();
}

function _renderScanResultBox(){
  if(!mScanResult) return '';
  const { poke, level, nature, moves, ability, item, stats, gender, shiny, otName, otId, pokeball, trainerMemo, totalInputTokens, totalOutputTokens } = mScanResult;
  const rows = [];
  const nameStr = poke ? poke.name + (gender ? ` (${gender==='M'?'♂':'♀'})` : '') + (shiny ? ' ✦' : '') : null;
  if(nameStr)      rows.push(['NAME',    nameStr]);
  if(level)        rows.push(['LEVEL',   level]);
  if(nature)       rows.push(['NATURE',  nature]);
  if(ability)      rows.push(['ABILITY', ability]);
  if(item != null) rows.push(['ITEM',    item || 'none']);
  if(pokeball)     rows.push(['BALL',    pokeball]);
  if(otName || otId != null) rows.push(['OT', [otName, otId != null ? `#${otId}` : null].filter(Boolean).join(' ')]);
  if(stats){
    const statLine = ['hp','atk','def','spatk','spdef','spe']
      .filter(k => stats[k] != null)
      .map(k => `${k.toUpperCase()}\u00a0${stats[k]}`)
      .join(' · ');
    if(statLine) rows.push(['STATS', statLine]);
  }
  if(moves && moves.length) rows.push(['MOVES', moves.map(m=>m.name).join(', ')]);
  if(trainerMemo)  rows.push(['MEMO',   trainerMemo]);
  const gridHtml = rows.length
    ? rows.map(([k,v])=>`<span class="srb-lbl">${k}</span><span class="srb-val">${v}</span>`).join('')
    : `<span class="srb-lbl"></span><span class="srb-val" style="color:var(--text3)">Nothing recognized</span>`;
  const tok = totalInputTokens + totalOutputTokens;
  const cost = totalInputTokens * 0.000001 + totalOutputTokens * 0.000005;
  const costStr = cost < 0.0001 ? '<$0.0001' : '~$' + cost.toFixed(4);
  return `<div class="scan-result-box">
    <div class="srb-hd-row">
      <span class="srb-hd">📷 SCAN RESULT</span>
      <button class="srb-reset-btn" onclick="_applyFromScanResult()" aria-label="Reset form to scan values">↺ RESET TO SCAN</button>
    </div>
    <div class="srb-grid">${gridHtml}</div>
    <div class="srb-usage">${tok} tok · ${costStr} · <a class="srb-link" href="https://console.anthropic.com/settings/usage" target="_blank" rel="noopener">exact usage ↗</a></div>
  </div>`;
}

function toggleMovesSection(){
  mMovesOpen = !mMovesOpen;
  renderModal();
}

function toggleInfoSection(){
  mInfoOpen = !mInfoOpen;
  renderModal();
}

// ─── OCR scan ──────────────────

// Send image Files to Claude Vision and return extracted data.
// Returns null if the key modal was opened (caller should abort).
async function _processOCRFiles(files) {
  let foundPoke = null, foundLevel = null, foundNature = null, foundMoves = [];
  let foundAbility = null, foundItem = null, foundStats = null, foundGender = null;
  let foundShiny = null, foundOtName = null, foundOtId = null, foundPokeball = null, foundTrainerMemo = null;
  let totalInputTokens = 0, totalOutputTokens = 0;
  for(const file of files){
    let result;
    try {
      showToast('Reading screen…');
      result = await readGameScreen(file);
    } catch(e){
      if(e.code === 'no_key' || e.code === 'bad_key'){
        showPage('settings');
        return null;
      }
      showToast(e.detail || 'Could not read image', 'red');
      continue;
    }
    totalInputTokens  += result._inputTokens  || 0;
    totalOutputTokens += result._outputTokens || 0;
    // Identify Pokémon by name first, dex number as fallback
    if(!foundPoke){
      if(result.name){
        const n = result.name.toLowerCase().replace(/[^a-z]/g,'');
        foundPoke = POKEMON.find(p => p.name.toLowerCase().replace(/[^a-z]/g,'') === n) || null;
      }
      if(!foundPoke && result.dex){
        foundPoke = POKEMON.find(p => p.n === result.dex) || null;
      }
    }
    if(!foundLevel  && result.level)   foundLevel  = String(result.level);
    if(!foundNature && result.nature)  foundNature = NATURE_NAMES.find(n => n.toLowerCase() === result.nature.toLowerCase()) || null;
    if(!foundAbility     && result.ability)      foundAbility     = result.ability;
    if(foundItem == null && result.item != null) foundItem        = result.item || null;
    if(!foundStats       && result.stats && Object.keys(result.stats).length) foundStats = result.stats;
    if(!foundGender      && result.gender)       foundGender      = result.gender;
    if(foundShiny == null && result.shiny != null) foundShiny     = result.shiny;
    if(!foundOtName      && result.ot_name)      foundOtName      = result.ot_name;
    if(!foundOtId        && result.ot_id)        foundOtId        = result.ot_id;
    if(!foundPokeball    && result.pokeball)     foundPokeball    = result.pokeball;
    if(!foundTrainerMemo && result.trainer_memo) foundTrainerMemo = result.trainer_memo;
    if(result.moves){
      result.moves.forEach(name => {
        const m = fuzzyMatchMove(name);
        if(m && !foundMoves.some(fm => fm.name === m.name)) foundMoves.push(m);
      });
    }
  }
  return { foundPoke, foundLevel, foundNature, foundMoves, foundAbility, foundItem, foundStats, foundGender, foundShiny, foundOtName, foundOtId, foundPokeball, foundTrainerMemo, totalInputTokens, totalOutputTokens };
}

// Open multi-image picker, run OCR, and fill the party edit modal.
// If no Pokémon is selected yet, auto-identifies from the stats screen.
function _triggerOCRScan(){
  if(!getClaudeKey()){ closeModal(); showPage('settings'); return; }
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;
  input.onchange = async () => {
    const files = Array.from(input.files);
    if(!files.length) return;
    const result = await _processOCRFiles(files);
    if(!result) return;
    const { foundPoke, foundLevel, foundNature, foundMoves, foundAbility, foundItem, foundStats, foundGender, foundShiny, foundOtName, foundOtId, foundPokeball, foundTrainerMemo, totalInputTokens, totalOutputTokens } = result;
    if(!mPoke && foundPoke){
      mPoke = {n:foundPoke.n, name:foundPoke.name, types:foundPoke.types};
      mMoves = []; mHPPicking = false; mNature = '';
    }
    if(foundLevel)        mLv = foundLevel;
    if(foundNature)       mNature = foundNature;
    if(foundAbility)      mAbility = foundAbility;
    if(foundItem != null) mItem = foundItem || '';
    if(foundGender)       mGender = foundGender;
    if(foundStats)        mStats = {...foundStats};
    if(foundShiny != null) mShiny = foundShiny;
    if(foundOtName)       mOtName = foundOtName;
    if(foundOtId)         mOtId   = String(foundOtId);
    if(foundPokeball)     mPokeball = foundPokeball;
    if(foundTrainerMemo)  mTrainerMemo = foundTrainerMemo;
    foundMoves.slice(0,4).forEach(m => {
      if(mMoves.length < 4 && !mMoves.some(mv => mv.name === m.name)) mMoves.push(m);
    });
    // Accumulate into existing mScanResult so multi-screen scans build up
    const prev = mScanResult || { moves: [], totalInputTokens: 0, totalOutputTokens: 0 };
    const prevMoves = prev.moves || [];
    const mergedMoves = [...prevMoves];
    foundMoves.forEach(m => { if(!mergedMoves.some(p => p.name === m.name)) mergedMoves.push(m); });
    mScanResult = {
      poke:         mPoke,
      level:        foundLevel        || prev.level,
      nature:       foundNature       || prev.nature,
      ability:      foundAbility      || prev.ability,
      item:         foundItem != null  ? foundItem        : prev.item,
      stats:        foundStats        || prev.stats,
      gender:       foundGender       || prev.gender,
      shiny:        foundShiny != null ? foundShiny       : prev.shiny,
      otName:       foundOtName       || prev.otName,
      otId:         foundOtId         || prev.otId,
      pokeball:     foundPokeball     || prev.pokeball,
      trainerMemo:  foundTrainerMemo  || prev.trainerMemo,
      moves:        mergedMoves.slice(0, 4),
      totalInputTokens:  (prev.totalInputTokens  || 0) + totalInputTokens,
      totalOutputTokens: (prev.totalOutputTokens || 0) + totalOutputTokens,
    };
    if(!mPoke) { showToast("Couldn't identify Pokémon", 'red'); renderModal(); return; }
    if(foundLevel || foundNature)                                      {} // level/nature now always visible
    if(foundMoves.length)                                              mMovesOpen = true;
    if(foundAbility || foundItem != null || foundGender || foundStats) mInfoOpen  = true;
    renderModal();
  };
  input.click();
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
function pickMP(n){ mPoke=POKEMON.find(p=>p.n===n); mMoves=[]; mHPPicking=false; mNature=''; mAbility=''; mItem=''; mGender=''; mStats=null; mShiny=false; mOtName=''; mOtId=''; mPokeball=''; mTrainerMemo=''; document.getElementById('ms-drop').style.display='none'; renderModal(); document.getElementById('ms-in').value=mPoke.name; }
function clearMP(){ mPoke=null; mMoves=[]; mLv=''; mNature=''; mHPPicking=false; mAbility=''; mItem=''; mGender=''; mStats=null; mShiny=false; mOtName=''; mOtId=''; mPokeball=''; mTrainerMemo=''; renderModal(); }
function pickHPType(){ mHPPicking=!mHPPicking; renderMoveSection(); }
function selectHPType(t){ mMoves.push({name:'Hidden Power',type:t}); mHPPicking=false; renderMoveSection(); }
function onMQ(v){ mMoveQ=v; renderMoveSection(); }
function setMTF(t){ mTypeFilter=mTypeFilter===t?null:t; mMoveQ=''; renderMoveSection(); }
function togMv(name,type){ const idx=mMoves.findIndex(m=>m.name===name); if(idx>=0) mMoves.splice(idx,1); else{if(mMoves.length>=4)return; mMoves.push({name,type});} renderMoveSection(); }
function rmMv(i){ mMoves.splice(i,1); renderMoveSection(); }

function saveModal(){
  if(!mPoke) return;
  const pt = activePt();
  const hasStats = mStats && Object.values(mStats).some(v => v != null && v !== '');
  const entry = {
    n:mPoke.n, name:mPoke.name, types:mPoke.types, moves:[...mMoves], level:mLv,
    nature: mNature || null,
    ability:      mAbility || null,
    item:         mItem !== '' ? mItem : null,
    gender:       mGender || null,
    stats:        hasStats ? {...mStats} : null,
    shiny:        mShiny || false,
    otName:       mOtName || null,
    otId:         mOtId || null,
    pokeball:     mPokeball || null,
    trainerMemo:  mTrainerMemo || null,
  };
  if(mMode === 'pc'){
    if(mSlot>=0 && mSlot<pt.pc.length) pt.pc[mSlot]=entry;
    else pt.pc.push(entry);
    saveStore(); closeModal(); renderSuggestBtn(); renderPC();
  } else {
    if(mSlot>=0 && mSlot<pt.party.length) pt.party[mSlot]=entry;
    else { if(pt.party.length>=6) return; pt.party.push(entry); }
    saveStore(); closeModal(); renderParty();
    if(activePoke) renderPokeDetail();
  }
}

function rmParty(i){
  const pt = activePt();
  if(mMode === 'pc'){
    if(i>=0) pt.pc.splice(i,1);
    saveStore(); closeModal(); renderSuggestBtn(); renderPC();
  } else {
    pt.party.splice(i,1);
    saveStore(); closeModal(); renderParty();
    if(activePoke) renderPokeDetail();
  }
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
    html += `<div class="pc-grid">
      <div class="pc-slot pc-slot-add" role="button" aria-label="Add new Pokémon to PC" onclick="openPCModal(-1)">
        <div class="pcs-add-icon">＋</div>
        <div class="pcs-add-label">ADD NEW</div>
      </div>`;
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
        const pcSprite = pm.shiny
          ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pm.n}.png`
          : spriteUrl(pm.n);
        html += `<div class="pc-slot" role="button" aria-label="Edit ${pm.name}" onclick="openPCModal(${idx})">
          <img class="pcs-sprite" src="${pcSprite}" onerror="this.style.display='none'">
          <div class="pcs-num">#${String(pm.n).padStart(3,'0')}${pm.shiny?' <span style="color:#FFD700">✦</span>':''}</div>
          <div class="pcs-name">${shortName}</div>
          <div class="pcs-types">${pm.types.map(t=>`<span class="tb sm t-${t}">${t}</span>`).join('')}</div>
          <div class="pcs-actions">
            <button class="pcs-move-btn" aria-label="Move ${pm.name} to party" onclick="event.stopPropagation();moveToPartyFromPC(${idx})">→ PARTY</button>
            <button class="pcs-rm-btn" aria-label="Remove ${pm.name} from PC" onclick="event.stopPropagation();confirmRemovePC(${idx})">✕</button>
          </div>
        </div>`;
      }
    });
    html += `</div>`;
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
