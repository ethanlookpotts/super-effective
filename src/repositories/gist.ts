import { Store } from "~/schemas";
import type { StoreCapabilities, StoreRepository } from "./types";

const GIST_API = "https://api.github.com/gists";
const GIST_FILENAME = "super-effective-sync.json";

const CAPS: StoreCapabilities = {
  readOnly: false,
  syncsRemotely: true,
  supportsConflictResolution: true,
};

/**
 * Port of js/data-manager.js gist sync. Stubbed for now — full port comes after
 * the scaffold is approved. Keeps the shape so the provider can instantiate it
 * once the user enables sync in Settings.
 */
export class GistStoreRepository implements StoreRepository {
  readonly id = "gist";
  readonly capabilities = CAPS;
  private readonly token: string;
  private gistId: string | null;

  constructor(token: string, gistId: string | null) {
    this.token = token;
    this.gistId = gistId;
  }

  async loadStore(): Promise<Store> {
    if (!this.gistId) throw new Error("no gist id configured");
    const resp = await fetch(`${GIST_API}/${this.gistId}`, {
      headers: this.headers(),
    });
    if (!resp.ok) throw new Error(`gist fetch failed: ${resp.status}`);
    const json = (await resp.json()) as { files: Record<string, { content: string }> };
    const content = json.files?.[GIST_FILENAME]?.content;
    if (!content) throw new Error("gist missing sync file");
    return Store.parse(JSON.parse(content));
  }

  async saveStore(store: Store): Promise<void> {
    const validated = Store.parse(store);
    const body = {
      files: { [GIST_FILENAME]: { content: JSON.stringify(validated, null, 2) } },
    };
    if (!this.gistId) {
      const resp = await fetch(GIST_API, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          description: "Super Effective — sync data (do not edit manually)",
          public: false,
          ...body,
        }),
      });
      if (!resp.ok) throw new Error(`gist create failed: ${resp.status}`);
      const json = (await resp.json()) as { id: string };
      this.gistId = json.id;
      return;
    }
    const resp = await fetch(`${GIST_API}/${this.gistId}`, {
      method: "PATCH",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error(`gist update failed: ${resp.status}`);
  }

  private headers(): HeadersInit {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    };
  }
}
