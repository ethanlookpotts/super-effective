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
