// ═══════════════════════════════
// SETTINGS PAGE
// ═══════════════════════════════

function renderSettings() {
  const body = document.getElementById('settings-body');
  if (!body) return;
  const hasKey = !!getClaudeKey();

  const statusBadge = hasKey
    ? `<span class="settings-key-status ok" aria-label="API key status: active">KEY ACTIVE</span>`
    : `<span class="settings-key-status none" aria-label="API key status: not set">NO KEY SET</span>`;

  // GitHub Sync section
  const syncStatus = DataManager.getSyncStatus();
  const hasToken = syncStatus.hasToken;
  const syncBadge = hasToken
    ? `<span class="settings-key-status ok" aria-label="Sync status: connected">CONNECTED</span>`
    : `<span class="settings-key-status none" aria-label="Sync status: not set">NOT SET UP</span>`;
  const lastSynced = syncStatus.lastSynced
    ? `<div class="settings-sync-time">Last synced: ${new Date(syncStatus.lastSynced).toLocaleString()}</div>`
    : '';
  const syncError = syncStatus.error
    ? `<div class="settings-test-status error">${syncStatus.error}</div>`
    : '';

  body.innerHTML = `
    <div class="settings-section">
      <div class="settings-sec-hd">
        <span class="settings-sec-ttl">CLAUDE API KEY</span>
        ${statusBadge}
      </div>
      <p class="settings-desc">Required for the 📷 SCAN feature. Sent directly to Anthropic — never stored anywhere except this browser.</p>
      <div class="settings-steps">
        <div class="settings-step">1. Go to <strong>console.anthropic.com</strong></div>
        <div class="settings-step">2. Sign in or create a free account</div>
        <div class="settings-step">3. Open <strong>API Keys</strong> → <strong>Create Key</strong></div>
        <div class="settings-step">4. Copy the key — starts with <code>sk-ant-</code></div>
      </div>
      <label class="mlbl" for="settings-key-in" style="display:block;margin-top:16px;">API KEY</label>
      <input class="field-in" id="settings-key-in" type="password"
        placeholder="${hasKey ? 'Key saved — enter new key to replace' : 'sk-ant-…'}"
        autocomplete="off" autocorrect="off" spellcheck="false"
        aria-label="Claude API key">
      <div class="settings-btn-row">
        <button class="settings-test-btn" onclick="testApiKey()" aria-label="Test API key">🧪 TEST</button>
        <button class="settings-save-btn" onclick="saveSettingsKey()" aria-label="Save API key">💾 SAVE</button>
      </div>
      <div id="settings-test-status" class="settings-test-status" role="status"></div>
      ${hasKey ? `<button class="rm-btn" onclick="forgetSettingsKey()" aria-label="Forget API key" style="margin-top:8px;">✕ FORGET KEY</button>` : ''}
    </div>
    <div class="settings-section">
      <div class="settings-sec-hd">
        <span class="settings-sec-ttl">GITHUB SYNC</span>
        ${syncBadge}
      </div>
      <p class="settings-desc">Sync your playthroughs across devices via a private GitHub Gist. Requires a fine-grained personal access token with <strong>Gists</strong> read &amp; write permission.</p>
      <div class="settings-steps">
        <div class="settings-step">1. Go to <strong><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener" class="settings-link">github.com → Settings → Tokens</a></strong></div>
        <div class="settings-step">2. Choose <strong>Fine-grained token</strong></div>
        <div class="settings-step">3. Under <strong>Account permissions</strong>, set <strong>Gists</strong> → <strong>Read and write</strong></div>
        <div class="settings-step">4. Copy the token — starts with <code>github_pat_</code></div>
      </div>
      <label class="mlbl" for="settings-gh-token" style="display:block;margin-top:16px;">GITHUB TOKEN</label>
      <input class="field-in" id="settings-gh-token" type="password"
        placeholder="${hasToken ? 'Token saved — enter new token to replace' : 'github_pat_…'}"
        autocomplete="off" autocorrect="off" spellcheck="false"
        aria-label="GitHub personal access token">
      <div class="settings-btn-row">
        <button class="settings-test-btn" onclick="testGithubToken()" aria-label="Test GitHub token">🧪 TEST</button>
        <button class="settings-save-btn" onclick="saveGithubToken()" aria-label="Save GitHub token">💾 SAVE</button>
      </div>
      <div id="settings-gh-test-status" class="settings-test-status" role="status"></div>
      ${hasToken ? `
        ${lastSynced}
        ${syncStatus.gistId ? `<div class="settings-sync-time"><a href="https://gist.github.com/${syncStatus.gistId}" target="_blank" rel="noopener" class="settings-link" aria-label="View gist">View synced gist ↗</a></div>` : ''}
        ${syncError}
        <div class="settings-btn-row" style="margin-top:10px;">
          <button class="settings-sync-btn" onclick="triggerSyncNow()" aria-label="Sync now">SYNC NOW</button>
        </div>
        <button class="rm-btn" onclick="forgetGithubToken()" aria-label="Forget GitHub token" style="margin-top:8px;">✕ FORGET TOKEN</button>
      ` : ''}
    </div>`;
}

function saveSettingsKey() {
  const val = document.getElementById('settings-key-in').value.trim();
  if (!val) { showToast('Enter a key first', 'red'); return; }
  saveClaudeKey(val);
  renderSettings();
  showToast('API key saved');
}

function forgetSettingsKey() {
  saveClaudeKey('');
  renderSettings();
  showToast('API key removed');
}

// ═══════════════════════════════
// GITHUB SYNC SETTINGS
// ═══════════════════════════════

function saveGithubToken() {
  const val = document.getElementById('settings-gh-token').value.trim();
  if (!val) { showToast('Enter a token first', 'red'); return; }
  DataManager.saveToken(val);
  DataManager.startPolling();
  DataManager.push();
  renderSettings();
  showToast('GitHub token saved');
}

function forgetGithubToken() {
  if (confirm('Remove GitHub token? Your synced data on GitHub will be kept unless you also delete the gist.')) {
    DataManager.forgetToken(false);
    renderSettings();
    showToast('GitHub token removed');
  }
}

async function testGithubToken() {
  const inputVal = document.getElementById('settings-gh-token').value.trim();
  const tokenToTest = inputVal || DataManager.getToken();
  const statusEl = document.getElementById('settings-gh-test-status');

  if (!tokenToTest) {
    if (statusEl) { statusEl.textContent = 'Enter a token first'; statusEl.className = 'settings-test-status error'; }
    return;
  }

  if (statusEl) { statusEl.textContent = 'TESTING\u2026'; statusEl.className = 'settings-test-status loading'; }

  try {
    await DataManager.testToken(tokenToTest);
    if (statusEl) { statusEl.textContent = '\u2713 TOKEN VALID (gist scope confirmed)'; statusEl.className = 'settings-test-status ok'; }
  } catch(e) {
    if (statusEl) { statusEl.textContent = e.message || 'Token test failed'; statusEl.className = 'settings-test-status error'; }
  }
}

async function triggerSyncNow() {
  showToast('Syncing\u2026');
  await DataManager.pull();
  const status = DataManager.getSyncStatus();
  if (status.error) {
    showToast('Sync failed: ' + status.error, 'red');
  } else {
    showToast('Sync complete');
  }
  renderSettings();
}

async function testApiKey() {
  const inputVal = document.getElementById('settings-key-in').value.trim();
  const keyToTest = inputVal || getClaudeKey();
  const statusEl = document.getElementById('settings-test-status');

  if (!keyToTest) {
    if (statusEl) { statusEl.textContent = 'Enter a key first'; statusEl.className = 'settings-test-status error'; }
    return;
  }

  if (statusEl) { statusEl.textContent = 'TESTING…'; statusEl.className = 'settings-test-status loading'; }

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': keyToTest,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1,
        messages: [{ role: 'user', content: '.' }],
      }),
    });
    if (resp.ok) {
      if (statusEl) { statusEl.textContent = '✓ KEY VALID'; statusEl.className = 'settings-test-status ok'; }
    } else {
      const err = await resp.json().catch(() => ({}));
      const msg = err.error?.message || ('Error ' + resp.status);
      if (statusEl) { statusEl.textContent = msg; statusEl.className = 'settings-test-status error'; }
    }
  } catch(e) {
    if (statusEl) { statusEl.textContent = 'Network error'; statusEl.className = 'settings-test-status error'; }
  }
}
