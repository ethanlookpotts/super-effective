import { useNavigate } from "react-router-dom";
import { useActivePlaythrough } from "~/hooks/use-store";
import { CoverageBar } from "./party/coverage-bar";
import { PARTY_MAX, PartyGrid } from "./party/party-grid";

export function PartyRoute() {
  const active = useActivePlaythrough();
  const navigate = useNavigate();

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

  function goPickPokemon() {
    navigate("/search");
  }

  function editMember(_idx: number) {
    // Edit modal lands in a follow-up commit (Phase 5).
    navigate("/search");
  }

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

      <PartyGrid party={party} onEdit={editMember} onAdd={goPickPokemon} />

      <CoverageBar party={party} />
    </section>
  );
}
