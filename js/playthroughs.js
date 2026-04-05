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

function _refreshUI(){
  activePoke = null;
  activeTypeFilter = null;
  buildTypePills();
  renderSearch();
  renderParty();
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
