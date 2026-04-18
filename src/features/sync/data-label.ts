import type { SyncStatus } from "./types";

export function dataLabel(status: SyncStatus): string {
  if (!status.hasToken) return "LOCAL ONLY";
  if (status.syncing) return "SYNCING…";
  if (status.error) return "SYNC ERROR";
  if (status.lastSynced) return `SYNCED · ${timeSince(status.lastSynced).toUpperCase()}`;
  return "LOCAL · SYNC PENDING";
}

export function timeSince(iso: string, now: number = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}
