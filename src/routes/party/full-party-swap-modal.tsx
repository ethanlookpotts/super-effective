import { useEffect } from "react";
import { TypeBadge } from "~/components/type-badge";
import { spriteUrl } from "~/lib/sprites";
import type { PartyMember } from "~/schemas";

/**
 * Shown when the user tries to add a Pokémon to a party that's already at 6.
 * Lets them pick which slot to displace. The displaced member's fate is the
 * parent's responsibility (e.g. PC → party moves it to PC; Search add discards it).
 */
export function FullPartySwapModal({
  party,
  incoming,
  onSwap,
  onClose,
}: {
  party: readonly PartyMember[];
  incoming: Pick<PartyMember, "n" | "name" | "types" | "shiny">;
  onSwap: (slotIdx: number) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
    >
      <div
        role="dialog"
        aria-label={`Swap ${incoming.name} into party`}
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-[420px] overflow-y-auto rounded-t-[var(--radius-card-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 sm:rounded-[var(--radius-card-lg)]"
      >
        <header className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-[var(--font-pixel)] text-xs text-[var(--color-gold)]">
            SWAP IN {incoming.name.toUpperCase()}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close swap"
            className="min-h-11 min-w-11 font-[var(--font-pixel)] text-xs text-[var(--color-text-3)]"
          >
            ✕
          </button>
        </header>

        <p className="mb-2 font-[var(--font-pixel)] text-[9px] leading-relaxed text-[var(--color-text-3)]">
          PARTY FULL — TAP A POKÉMON TO REPLACE IT
        </p>

        <div className="flex items-center gap-2 rounded-[var(--radius-card)] bg-[var(--color-card-2)] p-2">
          <img
            src={spriteUrl(incoming.n, { shiny: incoming.shiny })}
            alt=""
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            className="h-10 w-10 shrink-0 object-contain"
          />
          <span className="font-[var(--font-pixel)] text-[10px] text-[var(--color-text)]">
            {incoming.name}
          </span>
          <span className="ml-auto flex gap-1">
            {incoming.types.map((t) => (
              <TypeBadge key={t} type={t} size="sm" />
            ))}
          </span>
        </div>

        <div className="mt-3 font-[var(--font-pixel)] text-[9px] text-[var(--color-text-3)]">
          REPLACE WITH
        </div>
        <ul className="mt-1 flex flex-col gap-1">
          {party.map((pm, i) => (
            <li key={`${pm.n}-${i}`}>
              <button
                type="button"
                onClick={() => onSwap(i)}
                aria-label={`Replace ${pm.name}`}
                className="flex min-h-11 w-full items-center gap-2 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card-2)] p-2 text-left"
              >
                <img
                  src={spriteUrl(pm.n, { shiny: pm.shiny })}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                  className="h-10 w-10 shrink-0 object-contain"
                />
                <span className="flex-1 font-[var(--font-pixel)] text-[10px] text-[var(--color-text)]">
                  {pm.name}
                  {pm.level ? (
                    <span className="ml-1 text-[var(--color-text-3)]">Lv.{pm.level}</span>
                  ) : null}
                </span>
                <span className="flex shrink-0 gap-1">
                  {pm.types.map((t) => (
                    <TypeBadge key={t} type={t} size="sm" />
                  ))}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
