// ═══════════════════════════════
// DATA MANAGER — persistence gateway + GitHub Gist sync
// ═══════════════════════════════
// All persistence flows through DataManager.
// The rest of the app calls DataManager.save() / DataManager.load().
// Gist sync is transparent — the app is unaware of it.

var DataManager = (function(){
  const STORE_KEY = 'se_v1';
  const TOKEN_KEY = 'se_github_token';
  const GIST_ID_KEY = 'se_gist_id';
  const LAST_SYNCED_KEY = 'se_last_synced';
  const GIST_FILENAME = 'super-effective-sync.json';
  const GIST_API = 'https://api.github.com/gists';
  const DEBOUNCE_MS = 2000;
  const POLL_MS = 60000;

  let _debounceTimer = null;
  let _pollInterval = null;
  let _syncing = false;
  let _lastLocalChange = null;  // ISO string — when we last called save()
  let _lastSyncError = null;

  // ── localStorage helpers ──

  function _getToken(){ return localStorage.getItem(TOKEN_KEY) || ''; }
  function _getGistId(){ return localStorage.getItem(GIST_ID_KEY) || ''; }
  function _getLastSynced(){ return localStorage.getItem(LAST_SYNCED_KEY) || ''; }
  function _setGistId(id){ if(id) localStorage.setItem(GIST_ID_KEY, id); else localStorage.removeItem(GIST_ID_KEY); }
  function _setLastSynced(ts){ if(ts) localStorage.setItem(LAST_SYNCED_KEY, ts); else localStorage.removeItem(LAST_SYNCED_KEY); }

  // ── Gist API helpers ──

  function _headers(){
    return {
      'Authorization': 'Bearer ' + _getToken(),
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
    };
  }

  async function _createGist(data){
    const body = {
      description: 'Super Effective — sync data (do not edit manually)',
      public: false,
      files: { [GIST_FILENAME]: { content: JSON.stringify(data) } },
    };
    const resp = await fetch(GIST_API, { method: 'POST', headers: _headers(), body: JSON.stringify(body) });
    if(!resp.ok) throw new Error('Failed to create gist: ' + resp.status);
    const json = await resp.json();
    _setGistId(json.id);
    return json;
  }

  async function _updateGist(data){
    const gistId = _getGistId();
    if(!gistId) return _createGist(data);
    const body = {
      files: { [GIST_FILENAME]: { content: JSON.stringify(data) } },
    };
    const resp = await fetch(GIST_API + '/' + gistId, { method: 'PATCH', headers: _headers(), body: JSON.stringify(body) });
    if(resp.status === 404){
      // Gist was deleted remotely — create a new one
      _setGistId('');
      return _createGist(data);
    }
    if(!resp.ok) throw new Error('Failed to update gist: ' + resp.status);
    return resp.json();
  }

  async function _fetchGist(){
    const gistId = _getGistId();
    if(!gistId) return null;
    const resp = await fetch(GIST_API + '/' + gistId, { headers: _headers() });
    if(resp.status === 404){
      _setGistId('');
      return null;
    }
    if(!resp.ok) throw new Error('Failed to fetch gist: ' + resp.status);
    const json = await resp.json();
    const file = json.files && json.files[GIST_FILENAME];
    if(!file || !file.content) return null;
    try { return JSON.parse(file.content); } catch(e){ return null; }
  }

  async function _deleteGist(){
    const gistId = _getGistId();
    if(!gistId) return;
    try {
      await fetch(GIST_API + '/' + gistId, { method: 'DELETE', headers: _headers() });
    } catch(e){ /* best effort */ }
    _setGistId('');
    _setLastSynced('');
  }

  // ── Sync logic ──

  function _buildSyncPayload(){
    return {
      version: 1,
      lastModified: new Date().toISOString(),
      store: JSON.parse(JSON.stringify(store)),
    };
  }

  function _applyRemoteStore(remoteStore){
    // Replace the global store with remote data, then run migrations
    store.playthroughs = remoteStore.playthroughs || [];
    store.activePtId = remoteStore.activePtId || null;
    // Run same migrations as load()
    if(store.playthroughs) store.playthroughs.forEach(function(pt){
      if(!pt.gameId || pt.gameId==='frlg') pt.gameId='frlg-fr';
      if(!pt.pc) pt.pc = [];
    });
    if(store.playthroughs.length){
      if(!store.activePtId || !store.playthroughs.find(function(p){ return p.id===store.activePtId; })){
        store.activePtId = store.playthroughs[0].id;
      }
    }
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  }

  function _refreshAppUI(){
    // Re-render everything the app displays
    if(typeof updateMasthead === 'function') updateMasthead();
    if(typeof buildTypePills === 'function') buildTypePills();
    if(typeof renderSearch === 'function') renderSearch();
    if(typeof renderParty === 'function') renderParty();
    if(typeof renderGyms === 'function') renderGyms();
    if(typeof renderLocs === 'function' && typeof LOCATIONS !== 'undefined') renderLocs(LOCATIONS);
    if(typeof renderTMs === 'function' && typeof TM_HM !== 'undefined') renderTMs(TM_HM);
  }

  function _showConflictModal(remoteData){
    const overlay = document.getElementById('sync-conflict-overlay');
    if(!overlay) return;

    // Build a summary of differences
    const localPts = store.playthroughs || [];
    const remotePts = (remoteData.store && remoteData.store.playthroughs) || [];
    const localNames = localPts.map(function(p){ return p.name; }).join(', ') || 'none';
    const remoteNames = remotePts.map(function(p){ return p.name; }).join(', ') || 'none';
    const remoteTime = remoteData.lastModified ? new Date(remoteData.lastModified).toLocaleString() : 'unknown';

    const body = document.getElementById('sync-conflict-body');
    body.innerHTML =
      '<div class="sync-conflict-msg">Data was changed on another device since your last sync. Choose which version to keep.</div>' +
      '<div class="sync-conflict-option">' +
        '<div class="sync-conflict-label">THIS DEVICE</div>' +
        '<div class="sync-conflict-detail">Runs: ' + localNames + '</div>' +
        '<button class="sync-conflict-btn sync-conflict-local" onclick="DataManager._resolveConflict(\'local\')" aria-label="Keep this device data">KEEP LOCAL</button>' +
      '</div>' +
      '<div class="sync-conflict-option">' +
        '<div class="sync-conflict-label">CLOUD DATA</div>' +
        '<div class="sync-conflict-detail">Runs: ' + remoteNames + '<br>Last modified: ' + remoteTime + '</div>' +
        '<button class="sync-conflict-btn sync-conflict-remote" onclick="DataManager._resolveConflict(\'remote\')" aria-label="Keep cloud data">USE CLOUD</button>' +
      '</div>';

    overlay.classList.add('open');

    // Stash remote data so _resolveConflict can access it
    DataManager._pendingRemote = remoteData;
  }

  // ── Public API ──

  return {
    _pendingRemote: null,

    _resolveConflict: function(choice){
      const overlay = document.getElementById('sync-conflict-overlay');
      if(overlay) overlay.classList.remove('open');

      if(choice === 'remote' && DataManager._pendingRemote && DataManager._pendingRemote.store){
        _applyRemoteStore(DataManager._pendingRemote.store);
        _setLastSynced(DataManager._pendingRemote.lastModified);
        _lastLocalChange = null;
        _refreshAppUI();
        if(typeof showToast === 'function') showToast('Synced from cloud');
      } else {
        // Keep local — push to overwrite remote
        _setLastSynced(new Date().toISOString());
        DataManager.push();
        if(typeof showToast === 'function') showToast('Keeping local data');
      }
      DataManager._pendingRemote = null;
      _updateSyncStatusUI();
    },

    load: function(){
      // Read from localStorage
      try {
        var raw = localStorage.getItem(STORE_KEY);
        if(raw) store = JSON.parse(raw);
      } catch(e){}
      // Migrate
      if(store.playthroughs) store.playthroughs.forEach(function(pt){
        if(!pt.gameId || pt.gameId==='frlg') pt.gameId='frlg-fr';
        if(!pt.pc) pt.pc = [];
      });
      if(store.playthroughs && store.playthroughs.length){
        if(!store.activePtId || !store.playthroughs.find(function(p){ return p.id===store.activePtId; })){
          store.activePtId = store.playthroughs[0].id;
        }
        localStorage.setItem(STORE_KEY, JSON.stringify(store));
      }
      // Start sync polling if token exists
      if(_getToken()){
        DataManager.startPolling();
        // Initial pull (non-blocking)
        DataManager.pull();
      }
    },

    save: function(){
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
      _lastLocalChange = new Date().toISOString();
      // Debounced push to gist
      if(_getToken()){
        clearTimeout(_debounceTimer);
        _debounceTimer = setTimeout(function(){ DataManager.push(); }, DEBOUNCE_MS);
      }
    },

    pull: async function(){
      if(!_getToken() || _syncing) return;
      _syncing = true;
      _lastSyncError = null;
      _updateSyncStatusUI();
      try {
        var remote = await _fetchGist();
        if(!remote || !remote.store){
          // No remote data yet — push current state
          _syncing = false;
          await DataManager.push();
          return;
        }
        var lastSynced = _getLastSynced();
        var remoteModified = remote.lastModified || '';
        var remoteIsNewer = remoteModified && (!lastSynced || remoteModified > lastSynced);
        var localIsNewer = _lastLocalChange && (!lastSynced || _lastLocalChange > lastSynced);

        if(remoteIsNewer && localIsNewer){
          // Conflict — both sides changed
          _syncing = false;
          _showConflictModal(remote);
          return;
        }

        if(remoteIsNewer){
          // Remote wins — apply silently
          _applyRemoteStore(remote.store);
          _setLastSynced(remoteModified);
          _lastLocalChange = null;
          _refreshAppUI();
          if(typeof showToast === 'function') showToast('Synced from cloud');
        }
        // If only local is newer, push will handle it
        _lastSyncError = null;
      } catch(e){
        _lastSyncError = e.message || 'Sync failed';
      }
      _syncing = false;
      _updateSyncStatusUI();
    },

    push: async function(){
      if(!_getToken() || _syncing) return;
      _syncing = true;
      _lastSyncError = null;
      _updateSyncStatusUI();
      try {
        var payload = _buildSyncPayload();
        await _updateGist(payload);
        _setLastSynced(payload.lastModified);
        _lastLocalChange = null;
        _lastSyncError = null;
      } catch(e){
        _lastSyncError = e.message || 'Push failed';
      }
      _syncing = false;
      _updateSyncStatusUI();
    },

    startPolling: function(){
      DataManager.stopPolling();
      _pollInterval = setInterval(function(){ DataManager.pull(); }, POLL_MS);
    },

    stopPolling: function(){
      if(_pollInterval){ clearInterval(_pollInterval); _pollInterval = null; }
    },

    // ── Token management ──

    getToken: function(){ return _getToken(); },

    saveToken: function(token){
      if(token) localStorage.setItem(TOKEN_KEY, token.trim());
      else localStorage.removeItem(TOKEN_KEY);
    },

    forgetToken: function(deleteGist){
      DataManager.stopPolling();
      if(deleteGist) _deleteGist();
      localStorage.removeItem(TOKEN_KEY);
      _setGistId('');
      _setLastSynced('');
      _lastLocalChange = null;
      _lastSyncError = null;
      _updateSyncStatusUI();
    },

    getGistId: function(){ return _getGistId(); },

    // ── Status ──

    getSyncStatus: function(){
      return {
        lastSynced: _getLastSynced(),
        syncing: _syncing,
        error: _lastSyncError,
        gistId: _getGistId(),
        hasToken: !!_getToken(),
      };
    },

    // ── Test token ──

    testToken: async function(token){
      var testHeaders = {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/vnd.github+json',
      };
      var resp = await fetch(GIST_API + '?per_page=1', { headers: testHeaders });
      if(!resp.ok) throw new Error('Invalid token (HTTP ' + resp.status + ')');
      // Check scopes header
      var scopes = resp.headers.get('x-oauth-scopes') || '';
      if(scopes.indexOf('gist') === -1){
        throw new Error('Token missing "gist" scope. Current scopes: ' + (scopes || 'none'));
      }
      return true;
    },
  };
})();

function _updateSyncStatusUI(){
  var el = document.getElementById('sync-status');
  if(!el) return;
  var s = DataManager.getSyncStatus();
  if(!s.hasToken){
    el.textContent = '';
    el.className = 'sync-status';
    return;
  }
  if(s.syncing){
    el.textContent = 'syncing\u2026';
    el.className = 'sync-status syncing';
    return;
  }
  if(s.error){
    el.textContent = 'sync error';
    el.className = 'sync-status error';
    el.title = s.error;
    return;
  }
  if(s.lastSynced){
    var ago = _timeSince(s.lastSynced);
    el.textContent = 'synced ' + ago;
    el.className = 'sync-status ok';
    el.title = 'Last synced: ' + new Date(s.lastSynced).toLocaleString();
  } else {
    el.textContent = '';
    el.className = 'sync-status';
  }
}

function _timeSince(isoStr){
  var diff = Date.now() - new Date(isoStr).getTime();
  if(diff < 60000) return 'just now';
  if(diff < 3600000) return Math.floor(diff/60000) + 'm ago';
  if(diff < 86400000) return Math.floor(diff/3600000) + 'h ago';
  return Math.floor(diff/86400000) + 'd ago';
}
