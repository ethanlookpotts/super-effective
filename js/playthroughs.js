// ═══════════════════════════════
// PLAYTHROUGH MENU
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
      <div class="pt-name-wrap" id="ptnw-${pt.id}">
        <span class="pt-name${pt.id===active.id?' active-pt':''}">${pt.name}</span>
        <button class="pt-edit-btn" onclick="startRenamePt('${pt.id}')" aria-label="Rename ${pt.name}">✏</button>
      </div>
      ${pt.id===active.id
        ? '<span style="font-family:var(--fp);font-size:5px;color:var(--gold);">ACTIVE</span>'
        : `<button class="pt-switch-btn" onclick="switchPt('${pt.id}')">SWITCH</button>`}
      <button class="pt-del-btn" onclick="deletePt('${pt.id}')">🗑</button>
    </div>`).join('') +
    `<button class="pt-new-btn" onclick="createPlaythrough()">＋ NEW RUN</button>`;
}

function startRenamePt(id){
  const wrap = document.getElementById('ptnw-'+id);
  const pt = store.playthroughs.find(p=>p.id===id);
  wrap.innerHTML = `<input class="pt-rename-input" value="${pt.name}"
    aria-label="Rename playthrough"
    onblur="commitRename('${id}',this.value)"
    onkeydown="if(event.key==='Enter')this.blur();if(event.key==='Escape')renderPtMenu();">`;
  const input = wrap.querySelector('input');
  input.focus();
  input.select();
}

function commitRename(id, name){
  renamePt(id, name);
  renderPtMenu();
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

function _refreshUI(){
  activePoke = null;
  activeTypeFilter = null;
  buildTypePills();
  renderSearch();
  renderParty();
}

// ═══════════════════════════════
// GAME PICKER (new run, in PT menu)
// ═══════════════════════════════
function createPlaythrough(){
  const body = document.getElementById('pt-body');
  body.innerHTML = `
    <div class="pt-picker-back">
      <button class="pt-back-btn" onclick="renderPtMenu()">← BACK</button>
      <div class="pt-picker-title">SELECT GAME</div>
    </div>
    ${_gamePickerRowsHtml('confirmNewRun')}`;
}

function confirmNewRun(gameId){
  const n = store.playthroughs.length + 1;
  const pt = makePt('RUN '+n, gameId);
  store.playthroughs.push(pt);
  store.activePtId = pt.id;
  saveStore();
  updateMasthead();
  closePtMenu();
  _refreshUI();
  showToast('Started '+pt.name);
}

function switchPt(id){
  store.activePtId = id;
  saveStore();
  updateMasthead();
  renderPtMenu();
  closePtMenu();
  _refreshUI();
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
  _refreshUI();
}

// ═══════════════════════════════
// FIRST-RUN GAME GATE
// ═══════════════════════════════
function showGameGate(){
  const gate = document.getElementById('game-gate');
  gate.style.display = 'flex';
  document.getElementById('gg-gens').innerHTML = _gamePickerRowsHtml('selectGameForGate');
}

function selectGameForGate(gameId){
  const pt = makePt('RUN 1', gameId);
  store.playthroughs = [pt];
  store.activePtId = pt.id;
  saveStore();
  document.getElementById('game-gate').style.display = 'none';
  initApp();
}

// ═══════════════════════════════
// SHARED GAME PICKER HTML
// ═══════════════════════════════
function _gamePickerRowsHtml(callbackFn){
  return GAMES.map(g=>`
    <div class="gg-gen-label">GEN ${g.gen} · ${g.region.toUpperCase()}</div>
    <div class="gg-game-row">
      ${g.games.map(gm=>`
        <button class="gg-game-btn" onclick="${callbackFn}('${gm.id}')">
          <span class="gg-game-icon">${gm.icon}</span>
          <span class="gg-game-name">${gm.name.toUpperCase()}</span>
        </button>`).join('')}
    </div>`).join('');
}
