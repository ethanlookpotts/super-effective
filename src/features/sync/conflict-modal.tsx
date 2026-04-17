import type { SyncConflict } from "./types";

export function ConflictModal({
  conflict,
  onResolve,
}: {
  conflict: SyncConflict | null;
  onResolve: (choice: "local" | "remote") => void;
}) {
  if (!conflict) return null;
  const remoteTime = new Date(conflict.remoteLastModified).toLocaleString();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-label="Sync conflict"
        aria-modal="true"
        className="w-full max-w-[420px] rounded-[var(--radius-card-lg)] bg-[var(--color-card)] p-4"
      >
        <h3 className="font-[var(--font-pixel)] text-xs text-[var(--color-gold)]">SYNC CONFLICT</h3>
        <p className="mt-2 text-sm text-[var(--color-text-2)]">
          Data changed on another device since your last sync. Choose which version to keep.
        </p>

        <div className="mt-3 flex flex-col gap-3">
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card-2)] p-3">
            <div className="text-[10px] font-[var(--font-pixel)] text-[var(--color-text-3)]">
              THIS DEVICE
            </div>
            <div className="mt-1 text-xs text-[var(--color-text)]">
              Runs: {conflict.localSummary.join(", ") || "none"}
            </div>
            <button
              type="button"
              onClick={() => onResolve("local")}
              className="mt-2 min-h-11 w-full rounded-[var(--radius-card)] bg-[var(--color-gold)] px-3 text-xs font-semibold text-black"
            >
              KEEP LOCAL
            </button>
          </div>
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card-2)] p-3">
            <div className="text-[10px] font-[var(--font-pixel)] text-[var(--color-text-3)]">
              CLOUD DATA
            </div>
            <div className="mt-1 text-xs text-[var(--color-text)]">
              Runs: {conflict.remoteSummary.join(", ") || "none"}
            </div>
            <div className="mt-0.5 text-[10px] text-[var(--color-text-3)]">
              Last modified: {remoteTime}
            </div>
            <button
              type="button"
              onClick={() => onResolve("remote")}
              className="mt-2 min-h-11 w-full rounded-[var(--radius-card)] bg-[var(--color-blue)] px-3 text-xs font-semibold text-white"
            >
              USE CLOUD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
