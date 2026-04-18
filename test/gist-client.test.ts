import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchGist, listGists } from "~/features/sync/gist-client";

function stubFetch(impl: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  vi.stubGlobal("fetch", vi.fn(impl));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("listGists", () => {
  it("maps GitHub gists and flags sync-ready ones", async () => {
    stubFetch(
      () =>
        new Response(
          JSON.stringify([
            {
              id: "abc123",
              description: "My sync gist",
              files: { "super-effective-sync.json": {} },
              updated_at: "2026-04-18T00:00:00Z",
              html_url: "https://gist.github.com/abc123",
            },
            {
              id: "def456",
              description: null,
              files: { "notes.md": {}, "extra.txt": {} },
              updated_at: "2026-04-17T00:00:00Z",
              html_url: "https://gist.github.com/def456",
            },
          ]),
          { status: 200 },
        ),
    );

    const result = await listGists("tok");

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: "abc123",
      description: "My sync gist",
      filenames: ["super-effective-sync.json"],
      isSyncGist: true,
      updatedAt: "2026-04-18T00:00:00Z",
      htmlUrl: "https://gist.github.com/abc123",
    });
    expect(result[1].isSyncGist).toBe(false);
    expect(result[1].filenames).toEqual(["notes.md", "extra.txt"]);
  });

  it("passes the token as a bearer header", async () => {
    const fetchMock = vi.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve(new Response("[]", { status: 200 })),
    );
    vi.stubGlobal("fetch", fetchMock);

    await listGists("secret-token");

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer secret-token");
  });

  it("throws on non-ok response", async () => {
    stubFetch(() => new Response("unauthorized", { status: 401 }));
    await expect(listGists("tok")).rejects.toThrow(/401/);
  });

  it("returns empty list when account has no gists", async () => {
    stubFetch(() => new Response("[]", { status: 200 }));
    expect(await listGists("tok")).toEqual([]);
  });
});

describe("fetchGist filename contract", () => {
  it("returns null when gist lacks super-effective-sync.json", async () => {
    stubFetch(
      () =>
        new Response(JSON.stringify({ files: { "some-other.json": { content: "{}" } } }), {
          status: 200,
        }),
    );
    expect(await fetchGist("tok", "gist-id")).toBeNull();
  });

  it("returns null on 404", async () => {
    stubFetch(() => new Response("", { status: 404 }));
    expect(await fetchGist("tok", "gist-id")).toBeNull();
  });

  it("throws on other non-ok responses", async () => {
    stubFetch(() => new Response("boom", { status: 500 }));
    await expect(fetchGist("tok", "gist-id")).rejects.toThrow(/500/);
  });

  it("returns null when the file content is not a valid store", async () => {
    stubFetch(
      () =>
        new Response(
          JSON.stringify({
            files: { "super-effective-sync.json": { content: "not json at all" } },
          }),
          { status: 200 },
        ),
    );
    expect(await fetchGist("tok", "gist-id")).toBeNull();
  });

  it("parses a valid payload into a Store", async () => {
    const payload = {
      version: 1,
      lastModified: "2026-04-18T00:00:00Z",
      store: { playthroughs: [], activePtId: null },
    };
    stubFetch(
      () =>
        new Response(
          JSON.stringify({
            files: { "super-effective-sync.json": { content: JSON.stringify(payload) } },
          }),
          { status: 200 },
        ),
    );
    const result = await fetchGist("tok", "gist-id");
    expect(result).not.toBeNull();
    expect(result?.lastModified).toBe("2026-04-18T00:00:00Z");
    expect(result?.store.playthroughs).toEqual([]);
  });
});
