// ═══════════════════════════════
// SCREEN READER — Claude Vision API
// ═══════════════════════════════
// Sends game screen photos to Claude for structured data extraction.
// Works with Switch screenshots and phone-camera photos of a TV (docked Switch 2).

const CLAUDE_KEY_STORE = 'se_claude_key';

function getClaudeKey() {
  return localStorage.getItem(CLAUDE_KEY_STORE) || '';
}
function saveClaudeKey(key) {
  if (key) localStorage.setItem(CLAUDE_KEY_STORE, key.trim());
  else localStorage.removeItem(CLAUDE_KEY_STORE);
}

// ─── Vision API ────────────────

async function _fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// Send one image to Claude. Returns { name?, level?, nature?, moves?: string[] }
// Throws with .code = 'no_key' | 'bad_key' | 'api_error' | 'parse_error'
async function readGameScreen(file) {
  const key = getClaudeKey();
  if (!key) throw Object.assign(new Error('No API key'), { code: 'no_key' });

  const base64 = await _fileToBase64(file);
  const mediaType = (file.type || '').startsWith('image/') ? file.type : 'image/jpeg';

  // Normalise media type — browsers sometimes report "image/jpg" which is invalid
  const safeMediaType = mediaType === 'image/jpg' ? 'image/jpeg' : mediaType;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: safeMediaType, data: base64 } },
          { type: 'text', text: 'FireRed/LeafGreen screenshot. Three possible screens — INFO: name/dex/gender/nature/item/OT name+OT ID/trainer memo/Poké Ball; SKILLS: ability + 6 max stats (not current HP); MOVES: name/level/4 moves. Return ONLY valid JSON, no extra text. Omit keys absent from this screen. Keys: name(str), level(int), dex(int), nature(str), ability(str), item(str|null), gender("M"|"F"), moves([name strings no PP]), stats({hp,atk,def,spatk,spdef,spe} ints), ot_name(str), ot_id(int), trainer_memo(str), pokeball(str), shiny(bool — true only if sprite color clearly differs from standard). Example: {"name":"Blastoise","level":39,"dex":9,"nature":"Bold","ability":"Torrent","item":null,"gender":"M","moves":["Protect","Bite","Water Pulse","Rapid Spin"],"stats":{"hp":115,"atk":72,"def":99,"spatk":79,"spdef":96,"spe":76},"ot_name":"RED","ot_id":12345,"trainer_memo":"Bold nature. Met at Lv. 5. Route 1.","pokeball":"Poké Ball","shiny":false}' }
        ]
      }]
    })
  });

  if (!resp.ok) {
    const errBody = await resp.json().catch(() => ({}));
    const detail = errBody.error?.message || ('API error ' + resp.status);
    console.error('Anthropic API error:', detail);
    if (resp.status === 401) throw Object.assign(new Error(detail), { code: 'bad_key' });
    throw Object.assign(new Error(detail), { code: 'api_error', detail });
  }

  const data = await resp.json();
  // Extract the first {...} block — handles trailing notes or code fences from Claude
  const text = data.content[0].text.trim();
  const start = text.indexOf('{');
  const end   = text.lastIndexOf('}');
  let parsed;
  try {
    if (start === -1 || end === -1) throw new Error('no JSON object');
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch(e) {
    throw Object.assign(new Error('Could not parse response'), { code: 'parse_error' });
  }
  return {
    ...parsed,
    _inputTokens:  data.usage?.input_tokens  || 0,
    _outputTokens: data.usage?.output_tokens || 0,
  };
}

// Send a TM Case / Key Items / Bag screenshot to Claude.
// Returns { tms: [{ num, count }], _inputTokens, _outputTokens }.
// num must match the app's format ("TM01".."TM50", "HM01".."HM07").
async function readTMCase(file) {
  const key = getClaudeKey();
  if (!key) throw Object.assign(new Error('No API key'), { code: 'no_key' });

  const base64 = await _fileToBase64(file);
  const mediaType = (file.type || '').startsWith('image/') ? file.type : 'image/jpeg';
  const safeMediaType = mediaType === 'image/jpg' ? 'image/jpeg' : mediaType;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: safeMediaType, data: base64 } },
          { type: 'text', text: 'FireRed/LeafGreen TM Case screenshot. Read every visible TM or HM row and report it. For each row extract the number ("TM01".."TM50" or "HM01".."HM07") and the count on the right of the row (usually displayed after "x", e.g. "x2"; if no number shown, count is 1). Return ONLY valid JSON, no extra text. Shape: {"tms":[{"num":"TM24","count":1},{"num":"HM01","count":1}]}. Omit entries you cannot read confidently. Do not guess unseen TMs.' }
        ]
      }]
    })
  });

  if (!resp.ok) {
    const errBody = await resp.json().catch(() => ({}));
    const detail = errBody.error?.message || ('API error ' + resp.status);
    if (resp.status === 401) throw Object.assign(new Error(detail), { code: 'bad_key' });
    throw Object.assign(new Error(detail), { code: 'api_error', detail });
  }

  const data = await resp.json();
  const text = data.content[0].text.trim();
  const start = text.indexOf('{');
  const end   = text.lastIndexOf('}');
  let parsed;
  try {
    if (start === -1 || end === -1) throw new Error('no JSON object');
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch(e) {
    throw Object.assign(new Error('Could not parse response'), { code: 'parse_error' });
  }
  // Sanitise: accept only valid TM/HM numbers
  const valid = (parsed.tms || []).filter(r => r && typeof r.num === 'string' && /^(TM(0[1-9]|[1-4][0-9]|50)|HM0[1-7])$/.test(r.num));
  return {
    tms: valid.map(r => ({ num: r.num, count: Math.max(1, parseInt(r.count) || 1) })),
    _inputTokens:  data.usage?.input_tokens  || 0,
    _outputTokens: data.usage?.output_tokens || 0,
  };
}

// ─── Move matching ─────────────

// Fuzzy-match a move name from Claude's response against ALL_MOVES.
// Handles case and punctuation differences (e.g. "Mud-Slap" → "Mud Slap").
function fuzzyMatchMove(raw) {
  if (!raw || raw.length < 3) return null;
  const norm = s => s.toLowerCase().replace(/[^a-z]/g, '');
  const n = norm(raw);
  return ALL_MOVES.find(m => norm(m.name) === n) ||
    (n.length >= 4 ? ALL_MOVES.find(m => { const mn = norm(m.name); return mn.startsWith(n) || n.startsWith(mn); }) : null) ||
    null;
}
