import { useState } from "react";
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

  if (!active) {
    return (
      <section>
        <h2 className="font-[var(--font-pixel)] text-sm text-[var(--color-text)]">PARTY</h2>
        <p className="mt-2 text-sm text-[var(--color-text-2)]">
          No active playthrough yet. Create one from the playthrough menu.
        </p>
      </section>
    );
  }

  const party = active.party;
  const count = party.length;

  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-baseline justify-between">
        <h2 className="font-[var(--font-pixel)] text-sm text-[var(--color-text)]">PARTY</h2>
        {count > 0 && (
          <span className="font-[var(--font-pixel)] text-[9px] text-[var(--color-text-3)]">
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
          onClose={() => setEditState(null)}
        />
      )}
    </section>
  );
}
