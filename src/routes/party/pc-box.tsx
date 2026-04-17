import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TypeBadge } from "~/components/type-badge";
import { useUpdateActivePlaythrough } from "~/hooks/use-playthroughs";
import { spriteUrl } from "~/lib/sprites";
import type { PartyMember } from "~/schemas";
import { FullPartySwapModal } from "./full-party-swap-modal";
import { PARTY_MAX } from "./party-grid";

export function PcBox({
  party,
  pc,
}: {
  party: readonly PartyMember[];
  pc: readonly PartyMember[];
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [confirmIdx, setConfirmIdx] = useState<number | null>(null);
  const [swapFromIdx, setSwapFromIdx] = useState<number | null>(null);
  const update = useUpdateActivePlaythrough();
  const navigate = useNavigate();

  const arrow = collapsed ? "▶" : "▼";

  function removePc(idx: number) {
    update.mutate((pt) => ({
      ...pt,
      pc: pt.pc.filter((_, i) => i !== idx),
    }));
    setConfirmIdx(null);
  }

  function moveToParty(idx: number) {
    if (party.length < PARTY_MAX) {
      update.mutate((pt) => {
        const pm = pt.pc[idx];
        if (!pm) return pt;
        return {
          ...pt,
          party: [...pt.party, pm],
          pc: pt.pc.filter((_, i) => i !== idx),
        };
      });
    } else {
      setSwapFromIdx(idx);
    }
  }

  function applySwap(slotIdx: number) {
    const sourceIdx = swapFromIdx;
    if (sourceIdx === null) return;
    update.mutate(
      (pt) => {
        const incoming = pt.pc[sourceIdx];
        if (!incoming) return pt;
        const displaced = pt.party[slotIdx];
        const nextParty = pt.party.map((pm, i) => (i === slotIdx ? incoming : pm));
        const nextPc = pt.pc.filter((_, i) => i !== sourceIdx);
        if (displaced) nextPc.push(displaced);
        return { ...pt, party: nextParty, pc: nextPc };
      },
      { onSuccess: () => setSwapFromIdx(null) },
    );
  }

  function addNew() {
    // Edit modal lands in a follow-up commit; redirect to Search for now.
    navigate("/search");
  }

  const incoming = swapFromIdx !== null ? pc[swapFromIdx] : null;

  return (
    <section aria-label="PC Box" className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
        aria-label="Toggle PC Box"
        className="flex min-h-11 w-full items-center gap-2 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-left"
      >
        <span className="font-[var(--font-pixel)] text-xs text-[var(--color-text)]">📦 PC BOX</span>
        <span className="font-[var(--font-pixel)] text-[10px] text-[var(--color-text-3)]">
          ({pc.length} CAUGHT)
        </span>
        <span className="ml-auto text-[var(--color-text-3)]">{arrow}</span>
      </button>

      {!collapsed && (
        <ul className="grid grid-cols-2 gap-2">
          <li>
            <button
              type="button"
              onClick={addNew}
              aria-label="Add new Pokémon to PC"
              className="flex min-h-11 w-full flex-col items-center justify-center gap-1 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border-2)] bg-[var(--color-card-2)] p-4 text-[var(--color-text-3)]"
            >
              <span className="text-2xl leading-none">＋</span>
              <span className="font-[var(--font-pixel)] text-[9px]">ADD NEW</span>
            </button>
          </li>
          {pc.map((pm, idx) =>
            confirmIdx === idx ? (
              <li key={`pc-confirm-${idx}-${pm.n}`}>
                <div
                  role="group"
                  aria-label={`Confirm remove ${pm.name}`}
                  className="flex min-h-11 w-full flex-col items-center justify-center gap-1 rounded-[var(--radius-card)] border border-[var(--color-red)] bg-[var(--color-card)] p-2 text-center"
                >
                  <span className="font-[var(--font-pixel)] text-[10px] text-[var(--color-red)]">
                    REMOVE?
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => removePc(idx)}
                      aria-label={`Confirm remove ${pm.name}`}
                      className="min-h-11 rounded-[var(--radius-card)] bg-[var(--color-red)] px-2 font-[var(--font-pixel)] text-[9px] text-white"
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmIdx(null)}
                      aria-label="Cancel remove"
                      className="min-h-11 rounded-[var(--radius-card)] bg-[var(--color-card-2)] px-2 font-[var(--font-pixel)] text-[9px] text-[var(--color-text-2)]"
                    >
                      NO
                    </button>
                  </div>
                </div>
              </li>
            ) : (
              <li key={`pc-${idx}-${pm.n}`}>
                <PcSlot
                  member={pm}
                  onMove={() => moveToParty(idx)}
                  onRemove={() => setConfirmIdx(idx)}
                />
              </li>
            ),
          )}
        </ul>
      )}

      {incoming && (
        <FullPartySwapModal
          party={party}
          incoming={incoming}
          onSwap={applySwap}
          onClose={() => setSwapFromIdx(null)}
        />
      )}
    </section>
  );
}

function PcSlot({
  member,
  onMove,
  onRemove,
}: {
  member: PartyMember;
  onMove: () => void;
  onRemove: () => void;
}) {
  const shortName = member.name.length > 9 ? `${member.name.slice(0, 8)}…` : member.name;
  return (
    <div className="flex min-h-11 w-full flex-col gap-1 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-2">
      <img
        src={spriteUrl(member.n, { shiny: member.shiny })}
        alt=""
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
        className="mx-auto h-10 w-10 object-contain"
      />
      <div className="flex items-center justify-between font-[var(--font-pixel)] text-[9px] text-[var(--color-text-3)]">
        <span>
          #{String(member.n).padStart(3, "0")}
          {member.shiny ? <span className="ml-1 text-[var(--color-gold)]">✦</span> : null}
        </span>
      </div>
      <span className="font-[var(--font-pixel)] text-[10px] text-[var(--color-text)]">
        {shortName}
      </span>
      <span className="flex flex-wrap gap-1">
        {member.types.map((t) => (
          <TypeBadge key={t} type={t} size="sm" />
        ))}
      </span>
      <div className="mt-1 flex gap-1">
        <button
          type="button"
          onClick={onMove}
          aria-label={`Move ${member.name} to party`}
          className="min-h-11 flex-1 rounded-[var(--radius-card)] bg-[var(--color-gold)] px-2 font-[var(--font-pixel)] text-[9px] text-black"
        >
          → PARTY
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${member.name} from PC`}
          className="min-h-11 w-11 rounded-[var(--radius-card)] border border-[var(--color-border-2)] bg-[var(--color-card-2)] font-[var(--font-pixel)] text-[10px] text-[var(--color-text-3)]"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
