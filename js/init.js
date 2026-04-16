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
initTheme();
DataManager.load();
if(!store.playthroughs.length){
  showGameGate();
} else {
  initApp();
}

function initApp(){
  updateMasthead();
  buildTypePills();
  renderSearch();
  renderLocs(LOCATIONS);
  renderTMs();
  renderGyms();
  renderParty();
  applyRoute();
}
