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
        className="w-full max-w-[420px] rounded-card-lg bg-card p-4"
      >
        <h3 className="font-pixel text-xs text-gold">SYNC CONFLICT</h3>
        <p className="mt-2 text-sm text-text-2">
          Data changed on another device since your last sync. Choose which version to keep.
        </p>

        <div className="mt-3 flex flex-col gap-3">
          <div className="rounded-card border border-border bg-card-2 p-3">
            <div className="text-[10px] font-pixel text-text-3">THIS DEVICE</div>
            <div className="mt-1 text-xs text-text">
              Runs: {conflict.localSummary.join(", ") || "none"}
            </div>
            <button
              type="button"
              onClick={() => onResolve("local")}
              className="mt-2 min-h-11 w-full rounded-card bg-gold px-3 text-xs font-semibold text-black"
            >
              KEEP LOCAL
            </button>
          </div>
          <div className="rounded-card border border-border bg-card-2 p-3">
            <div className="text-[10px] font-pixel text-text-3">CLOUD DATA</div>
            <div className="mt-1 text-xs text-text">
              Runs: {conflict.remoteSummary.join(", ") || "none"}
            </div>
            <div className="mt-0.5 text-[10px] text-text-3">Last modified: {remoteTime}</div>
            <button
              type="button"
              onClick={() => onResolve("remote")}
              className="mt-2 min-h-11 w-full rounded-card bg-blue px-3 text-xs font-semibold text-white"
            >
              USE CLOUD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
