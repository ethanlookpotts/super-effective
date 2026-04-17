import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ALL_MOVES } from "~/data/moves";
import { useActivePlaythrough } from "~/hooks/use-store";
import { CoverageBar } from "./party/coverage-bar";
import { EditModal, type EditModalState } from "./party/edit-modal";
import { PARTY_MAX, PartyGrid } from "./party/party-grid";
import { PcBox } from "./party/pc-box";
import { SuggestionPanel } from "./party/suggestion-panel";
import { TmSuggestionPanel } from "./party/tm-suggestion-panel";

export function PartyRoute() {
  const active = useActivePlaythrough();
  const [editState, setEditState] = useState<EditModalState | null>(null);
  const [teachMove, setTeachMove] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const teachParam = searchParams.get("teach");

  // biome-ignore lint/correctness/useExhaustiveDependencies: we only want to run when the URL param changes.
  useEffect(() => {
    if (!teachParam || !active) return;
    const [rawDex, rawMove] = teachParam.split(":");
    const dex = Number.parseInt(rawDex ?? "", 10);
    const move = rawMove ? decodeURIComponent(rawMove) : "";
    if (!Number.isFinite(dex) || !move) return;
    const idx = active.party.findIndex((pm) => pm.n === dex);
    if (idx < 0) return;
    setEditState({ mode: "party", slot: idx });
    setTeachMove(move);
    const next = new URLSearchParams(searchParams);
    next.delete("teach");
    setSearchParams(next, { replace: true });
  }, [teachParam]);

  if (!active) {
    return (
      <section>
        <h2 className="font-pixel text-sm text-text">PARTY</h2>
        <p className="mt-2 text-sm text-text-2">
          No active playthrough yet. Create one from the playthrough menu.
        </p>
      </section>
    );
  }

  const party = active.party;
  const count = party.length;

  function closeModal() {
    setEditState(null);
    setTeachMove(null);
  }

  return (
    <section aria-label="Party page" className="flex flex-col gap-3">
      <header className="flex items-baseline justify-between">
        <h2 className="font-pixel text-sm text-text">PARTY</h2>
        {count > 0 && (
          <span className="font-pixel text-[9px] text-text-3">
            {count} / {PARTY_MAX} IN PARTY
          </span>
        )}
      </header>

      <PartyGrid
        party={party}
        onEdit={(idx) => setEditState({ mode: "party", slot: idx })}
        onAdd={() => setEditState({ mode: "party", slot: -1 })}
      />

      <CoverageBar party={party} />

      <TmSuggestionPanel party={party} inventory={active.tmInventory} />

      <SuggestionPanel party={party} pc={active.pc} />

      <PcBox
        party={party}
        pc={active.pc}
        onEdit={(idx) => setEditState({ mode: "pc", slot: idx })}
        onAdd={() => setEditState({ mode: "pc", slot: -1 })}
      />

      {editState && (
        <EditModal
          state={editState}
          party={party}
          pc={active.pc}
          initialTeachMove={teachMove ? resolveTeachMove(teachMove) : null}
          onClose={closeModal}
        />
      )}
    </section>
  );
}

function resolveTeachMove(name: string) {
  const m = ALL_MOVES.find((mv) => mv.name === name);
  if (!m) return null;
  return { name: m.name, type: m.type };
}
