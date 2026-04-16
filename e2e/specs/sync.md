# E2E Test Plan — GitHub Gist Sync

## Settings UI

1. **GitHub Sync section visible** — open Settings, verify GITHUB SYNC heading, token input, TEST and SAVE buttons are present
2. **NOT SET UP badge when no token** — ensure no token in localStorage, verify badge reads NOT SET UP
3. **CONNECTED badge after saving token** — fill token input, click SAVE, verify CONNECTED badge appears
4. **Test token validates gist scope** — mock gist API to return x-oauth-scopes: gist, click TEST, verify TOKEN VALID message
5. **Test token error for missing scope** — mock gist API to return x-oauth-scopes: repo, click TEST, verify error about missing gist scope
6. **Forget token clears to NOT SET UP** — seed a token, open Settings, click FORGET, verify NOT SET UP badge

## Sync Operations

7. **Sync Now triggers pull** — seed token + gist id, mock gist API, click SYNC NOW, verify pull was called and success toast
8. **Conflict modal appears** — seed stale lastSynced, make local change, pull with newer remote, verify SYNC CONFLICT modal with both options
9. **Use Cloud applies remote data** — trigger conflict, click "Use Cloud", verify modal closes and "Synced from cloud" toast
10. **Keep Local pushes local data** — trigger conflict, click "Keep Local", verify modal closes, "Keeping local data" toast, and PATCH request sent

## Mocking Strategy

All tests use `page.route('**/api.github.com/gists**')` to intercept GitHub API calls. No real GitHub token is needed. Conflict tests inject the token after page load to avoid the initial pull in `DataManager.load()`.
