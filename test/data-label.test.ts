import { describe, expect, it } from "vitest";
import { dataLabel, timeSince } from "~/features/sync/data-label";
import type { SyncStatus } from "~/features/sync/types";

function status(overrides: Partial<SyncStatus> = {}): SyncStatus {
  return {
    hasToken: false,
    syncing: false,
    error: null,
    lastSynced: null,
    gistId: null,
    ...overrides,
  };
}

describe("dataLabel", () => {
  it("shows LOCAL ONLY when no token is set", () => {
    expect(dataLabel(status())).toBe("LOCAL ONLY");
  });

  it("shows SYNCING… while a sync is in flight", () => {
    expect(dataLabel(status({ hasToken: true, syncing: true }))).toBe("SYNCING…");
  });

  it("shows SYNC ERROR when status has an error", () => {
    expect(dataLabel(status({ hasToken: true, error: "boom" }))).toBe("SYNC ERROR");
  });

  it("shows SYNCED with time since when lastSynced is present", () => {
    const iso = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(dataLabel(status({ hasToken: true, lastSynced: iso }))).toBe("SYNCED · 5M AGO");
  });

  it("shows LOCAL · SYNC PENDING when token saved but no sync has happened", () => {
    expect(dataLabel(status({ hasToken: true }))).toBe("LOCAL · SYNC PENDING");
  });

  it("prioritises syncing over error and lastSynced", () => {
    expect(
      dataLabel(
        status({
          hasToken: true,
          syncing: true,
          error: "boom",
          lastSynced: new Date().toISOString(),
        }),
      ),
    ).toBe("SYNCING…");
  });
});

describe("timeSince", () => {
  const base = Date.parse("2026-04-18T12:00:00Z");

  it("returns 'just now' under a minute", () => {
    expect(timeSince("2026-04-18T11:59:30Z", base)).toBe("just now");
  });

  it("returns minutes for < 1 hour", () => {
    expect(timeSince("2026-04-18T11:55:00Z", base)).toBe("5m ago");
  });

  it("returns hours for < 1 day", () => {
    expect(timeSince("2026-04-18T09:00:00Z", base)).toBe("3h ago");
  });

  it("returns days otherwise", () => {
    expect(timeSince("2026-04-15T12:00:00Z", base)).toBe("3d ago");
  });
});
