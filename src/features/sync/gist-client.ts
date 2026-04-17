import { Store } from "~/schemas";

const GIST_API = "https://api.github.com/gists";
const GIST_FILENAME = "super-effective-sync.json";

export interface SyncPayload {
  version: 1;
  lastModified: string;
  store: Store;
}

export interface SyncFetchResult {
  payload: SyncPayload | null;
  gistId: string | null;
}

function headers(token: string, json = false): HeadersInit {
  const base: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };
  if (json) base["Content-Type"] = "application/json";
  return base;
}

function buildPayload(store: Store): SyncPayload {
  return {
    version: 1,
    lastModified: new Date().toISOString(),
    store,
  };
}

/**
 * Fetches the sync gist. Returns `{ payload: null }` if the gist doesn't exist
 * or its content isn't a valid store. Throws on network / auth failure.
 */
export async function fetchGist(token: string, gistId: string): Promise<SyncPayload | null> {
  const resp = await fetch(`${GIST_API}/${gistId}`, { headers: headers(token) });
  if (resp.status === 404) return null;
  if (!resp.ok) throw new Error(`gist fetch failed: ${resp.status}`);
  const json = (await resp.json()) as { files?: Record<string, { content: string } | undefined> };
  const content = json.files?.[GIST_FILENAME]?.content;
  if (!content) return null;
  try {
    const parsed = JSON.parse(content) as SyncPayload;
    if (!parsed || typeof parsed !== "object" || !parsed.store) return null;
    parsed.store = Store.parse(parsed.store);
    return parsed;
  } catch {
    return null;
  }
}

export async function createGist(token: string, store: Store): Promise<{
  gistId: string;
  payload: SyncPayload;
}> {
  const payload = buildPayload(store);
  const resp = await fetch(GIST_API, {
    method: "POST",
    headers: headers(token, true),
    body: JSON.stringify({
      description: "Super Effective — sync data (do not edit manually)",
      public: false,
      files: { [GIST_FILENAME]: { content: JSON.stringify(payload, null, 2) } },
    }),
  });
  if (!resp.ok) throw new Error(`gist create failed: ${resp.status}`);
  const json = (await resp.json()) as { id: string };
  return { gistId: json.id, payload };
}

/**
 * Upserts the sync gist. If `gistId` is null or the remote returns 404, a new
 * gist is created and its id returned. Otherwise the existing gist is patched.
 */
export async function pushGist(
  token: string,
  gistId: string | null,
  store: Store,
): Promise<{ gistId: string; payload: SyncPayload }> {
  if (!gistId) return createGist(token, store);
  const payload = buildPayload(store);
  const resp = await fetch(`${GIST_API}/${gistId}`, {
    method: "PATCH",
    headers: headers(token, true),
    body: JSON.stringify({
      files: { [GIST_FILENAME]: { content: JSON.stringify(payload, null, 2) } },
    }),
  });
  if (resp.status === 404) return createGist(token, store);
  if (!resp.ok) throw new Error(`gist update failed: ${resp.status}`);
  return { gistId, payload };
}

export async function deleteGist(token: string, gistId: string): Promise<void> {
  await fetch(`${GIST_API}/${gistId}`, { method: "DELETE", headers: headers(token) }).catch(
    () => undefined,
  );
}

/**
 * Validates a token has gist read + write access. Mirrors the vanilla testToken
 * logic — checks `x-oauth-scopes` for classic tokens, or round-trips a test gist
 * for fine-grained tokens (which don't expose scopes).
 */
export async function testToken(token: string): Promise<void> {
  const resp = await fetch(`${GIST_API}?per_page=1`, {
    headers: headers(token),
  });
  if (!resp.ok) throw new Error(`Invalid token (HTTP ${resp.status})`);
  const scopes = resp.headers.get("x-oauth-scopes");
  if (scopes !== null && !scopes.includes("gist")) {
    throw new Error(`Token missing "gist" scope. Current scopes: ${scopes || "none"}`);
  }
  if (scopes === null) {
    // Fine-grained token — probe write access with a disposable gist.
    const createResp = await fetch(GIST_API, {
      method: "POST",
      headers: headers(token, true),
      body: JSON.stringify({
        description: "Super Effective — token test (safe to delete)",
        public: false,
        files: { "test.txt": { content: "token validation" } },
      }),
    });
    if (!createResp.ok) {
      throw new Error("Token cannot create gists — set Gists permission to Read and write");
    }
    const testGist = (await createResp.json()) as { id: string };
    await deleteGist(token, testGist.id);
  }
}
