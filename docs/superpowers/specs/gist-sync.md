# GitHub Gist Sync — Design Spec

## Goal

Enable seamless cross-device sync of playthrough data via a private GitHub Gist.
Users paste a GitHub personal access token (PAT) with `gist` scope into Settings.
The app syncs automatically on saves (debounced) and polls every 60 seconds for
remote changes. Conflicts (both local and remote changed since last sync) prompt
the user to choose "this device" or "cloud data."

## Architecture

### New file: `js/data-manager.js`

Single persistence gateway. All existing `saveStore()` / `loadStore()` calls are
replaced with `DataManager.save()` / `DataManager.load()`. The rest of the app
is unaware of gist sync — it just calls DataManager.

```
DataManager = {
  // Persistence
  load(),              // reads localStorage -> store, migrates, starts sync polling
  save(),              // writes store -> localStorage, triggers debounced gist push

  // Sync
  pull(),              // fetch gist -> compare -> apply or show conflict modal
  push(),              // write current store to gist immediately
  startPolling(),      // begin 60s interval (called by load() if token exists)
  stopPolling(),       // clear interval

  // GitHub token
  getToken(),          // reads from localStorage 'se_github_token'
  saveToken(token),    // writes to localStorage
  forgetToken(),       // removes token + optionally deletes gist

  // Status
  getSyncStatus(),     // { lastSynced, syncing, error, gistId }
}
```

### Internal state (private to module)

- `_gistId` — persisted in localStorage `se_gist_id`
- `_lastSynced` — ISO timestamp of last successful sync
- `_lastLocalChange` — ISO timestamp of last local save
- `_debounceTimer` — coalesces rapid saves (2s debounce)
- `_pollInterval` — the 60s setInterval handle
- `_syncing` — boolean lock to prevent concurrent sync operations

### Gist structure

One private gist. One file: `super-effective-sync.json`.

```json
{
  "version": 1,
  "lastModified": "2026-04-16T12:00:00.000Z",
  "store": { /* full se_v1 blob */ }
}
```

### Conflict detection

Each `DataManager.save()` stamps `_lastLocalChange = now`.

On pull:
1. Fetch gist, parse its `lastModified`
2. If remote `lastModified` > `_lastSynced` AND `_lastLocalChange` > `_lastSynced` -> CONFLICT
3. Show conflict modal: "Use This Device" vs "Use Cloud Data"
4. If only remote is newer -> silently apply, refresh UI
5. If only local is newer -> no action (next push handles it)

### What gets synced

The full `se_v1` store blob (all playthroughs, party, PC, recents, etc.).

### What does NOT get synced

- `se_claude_key` (Claude API key)
- `se_github_token` (GitHub PAT)
- `se_gist_id` (local gist reference)

## File changes

| File | Change |
|---|---|
| `js/data-manager.js` | NEW — persistence gateway + gist sync |
| `js/state.js` | Remove `saveStore()` and `loadStore()` definitions |
| `js/party.js` | `saveStore()` -> `DataManager.save()` (12 sites) |
| `js/playthroughs.js` | `saveStore()` -> `DataManager.save()` (5 sites) |
| `js/init.js` | `loadStore()` -> `DataManager.load()` |
| `js/settings.js` | Add GitHub Sync section below Claude API Key |
| `index.html` | Add `<script src="js/data-manager.js">` before state.js; add sync conflict modal |
| `style.css` | Add styles for sync status indicator, conflict modal, settings sync section |

## Settings UI — "GITHUB SYNC" section

Below existing Claude API Key section:
- Token input + SAVE button (same pattern)
- TEST button (validates token has gist scope)
- SYNC NOW button (manual pull + push)
- Last synced timestamp display
- FORGET TOKEN button

## Sync status indicator

Small status text near masthead or in settings showing:
- Last sync time
- "Syncing..." during operations
- Error state with retry

## Offline behavior

- All gist operations wrapped in try/catch
- App continues working from localStorage on network failure
- Sync status shows error; retries on next save or poll cycle
- No queuing — just best-effort on each trigger
