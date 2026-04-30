import { useState } from "react";
import { GAMES } from "~/data/games";
import {
  useCreatePlaythrough,
  useDeletePlaythrough,
  useRenamePlaythrough,
  useSwitchPlaythrough,
} from "~/hooks/use-playthroughs";
import { useStore } from "~/hooks/use-store";

export function PlaythroughMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: store } = useStore();
  const [mode, setMode] = useState<"list" | "picker">("list");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const createMut = useCreatePlaythrough();
  const switchMut = useSwitchPlaythrough();
  const renameMut = useRenamePlaythrough();
  const deleteMut = useDeletePlaythrough();

  if (!open || !store) return null;
  const activeId = store.activePtId;

  function handleCreate(gameId: string) {
    createMut.mutate(
      { gameId },
      {
        onSuccess: () => {
          setMode("list");
          onClose();
        },
      },
    );
  }

  function handleSwitch(id: string) {
    switchMut.mutate(id, { onSuccess: () => onClose() });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    deleteMut.mutate(id);
  }

  function startRename(id: string, current: string) {
    setRenamingId(id);
    setRenameValue(current);
  }

  function commitRename() {
    if (!renamingId) return;
    const trimmed = renameValue.trim();
    if (trimmed) renameMut.mutate({ id: renamingId, name: trimmed });
    setRenamingId(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Close playthrough menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <dialog
        open
        aria-label="Playthrough menu"
        className="relative w-full max-w-[480px] rounded-t-card-lg bg-card p-4"
      >
        {mode === "list" ? (
          <div className="flex flex-col gap-2">
            {store.playthroughs.map((pt) => (
              <div
                key={pt.id}
                className={`flex items-center gap-2 rounded-card border p-2 ${
                  pt.id === activeId ? "border-gold bg-card-2" : "border-border"
                }`}
              >
                {renamingId === pt.id ? (
                  <input
                    aria-label="Rename playthrough"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    ref={(el) => el?.focus()}
                    className="flex-1 rounded bg-transparent px-2 py-1 text-base text-text"
                  />
                ) : (
                  <>
                    <span className="flex-1 text-sm text-text">{pt.name}</span>
                    <button
                      type="button"
                      onClick={() => startRename(pt.id, pt.name)}
                      aria-label={`Rename ${pt.name}`}
                      className="min-h-11 px-2 text-xs text-text-2"
                    >
                      ✏
                    </button>
                  </>
                )}
                {pt.id === activeId ? (
                  <span className="text-[10px] font-pixel text-gold">ACTIVE</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSwitch(pt.id)}
                    className="min-h-11 rounded bg-card-2 px-3 text-xs text-text"
                  >
                    SWITCH
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(pt.id, pt.name)}
                  aria-label={`Delete ${pt.name}`}
                  className="min-h-11 px-2 text-xs text-red"
                >
                  🗑
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setMode("picker")}
              className="min-h-11 rounded-card border border-dashed border-border px-3 text-xs font-pixel text-text-2"
            >
              ＋ NEW RUN
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setMode("list")}
              className="self-start text-xs text-text-2"
            >
              ← BACK
            </button>
            <h3 className="font-pixel text-xs text-text">SELECT GAME</h3>
            {GAMES.map((gen) => (
              <div key={gen.region} className="flex flex-col gap-2">
                <div className="text-[10px] font-pixel text-text-3">
                  GEN {gen.gen} · {gen.region.toUpperCase()}
                </div>
                <div className="flex gap-2">
                  {gen.games.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => handleCreate(g.id)}
                      className="min-h-11 flex-1 rounded-card border border-border bg-card-2 p-2 text-sm text-text"
                    >
                      <span className="mr-2">{g.icon}</span>
                      {g.name.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </dialog>
    </div>
  );
}
