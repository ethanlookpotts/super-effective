import { useEffect, useMemo, useRef, useState } from "react";
import { TypeBadge } from "~/components/type-badge";
import { ALL_MOVES, type Move } from "~/data/moves";
import { POKEMON, type Pokemon } from "~/data/pokemon";

export type SearchPick = { kind: "pokemon"; dex: number } | { kind: "move"; name: string };

export function SearchInput({
  value,
  onChangeValue,
  onPick,
  onClear,
}: {
  value: string;
  onChangeValue: (v: string) => void;
  onPick: (pick: SearchPick) => void;
  onClear: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const query = value.trim().toLowerCase();
  const hasQuery = query.length > 0;

  const { pokes, moves } = useMemo(() => {
    if (!hasQuery) return { pokes: [] as Pokemon[], moves: [] as Move[] };
    return {
      pokes: POKEMON.filter((p) => p.name.toLowerCase().includes(query)).slice(0, 8),
      moves: ALL_MOVES.filter((m) => m.name.toLowerCase().includes(query)).slice(0, 8),
    };
  }, [hasQuery, query]);

  const showDrop = focused && hasQuery && (pokes.length > 0 || moves.length > 0);

  useEffect(() => {
    if (!focused) return;
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setFocused(false);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [focused]);

  return (
    <div ref={boxRef} className="relative">
      <div className="flex items-center gap-2 rounded-card border-[1.5px] border-border-2 bg-card-2 px-3 focus-within:border-gold focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-gold)_18%,transparent)]">
        <input
          id="s-in"
          type="text"
          aria-label="Search Pokémon"
          placeholder="Pokémon name…"
          value={value}
          onChange={(e) => onChangeValue(e.target.value)}
          onFocus={() => setFocused(true)}
          className="min-h-11 flex-1 bg-transparent text-sm text-text outline-none"
        />
        {value && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              onClear();
              setFocused(false);
            }}
            className="min-h-11 px-2 text-text-3"
          >
            ×
          </button>
        )}
      </div>
      {showDrop && (
        <div
          role="listbox"
          aria-label="Search results dropdown"
          tabIndex={-1}
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-[60vh] overflow-y-auto rounded-card border border-border bg-card shadow-lg"
        >
          {pokes.length > 0 && (
            <>
              <div className="px-3 pb-1 pt-2 font-pixel text-[9px] text-text-3">POKÉMON</div>
              {pokes.map((p) => (
                <button
                  key={p.n}
                  type="button"
                  role="option"
                  aria-label={p.name}
                  aria-selected={false}
                  onClick={() => {
                    setFocused(false);
                    onPick({ kind: "pokemon", dex: p.n });
                  }}
                  className="flex min-h-11 w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-card-2"
                >
                  <span className="w-12 font-pixel text-[10px] text-text-3">
                    #{String(p.n).padStart(3, "0")}
                  </span>
                  <span className="flex-1 text-sm text-text">{p.name}</span>
                  <span className="flex gap-1">
                    {p.types.map((t) => (
                      <TypeBadge key={t} type={t} size="sm" />
                    ))}
                  </span>
                </button>
              ))}
            </>
          )}
          {moves.length > 0 && (
            <>
              <div className="px-3 pb-1 pt-2 font-pixel text-[9px] text-text-3">MOVES</div>
              {moves.map((m) => {
                const catLabel = m.cat === "phys" ? "PHY" : m.cat === "spec" ? "SPE" : "STA";
                return (
                  <button
                    key={m.name}
                    type="button"
                    role="option"
                    aria-label={`Move ${m.name}`}
                    aria-selected={false}
                    onClick={() => {
                      setFocused(false);
                      onPick({ kind: "move", name: m.name });
                    }}
                    className="flex min-h-11 w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-card-2"
                  >
                    <span className="flex-1 text-sm text-text">{m.name}</span>
                    <span className="flex items-center gap-1">
                      <TypeBadge type={m.type} size="sm" />
                      <span className="rounded bg-card-2 px-1.5 py-0.5 font-pixel text-[9px] text-text-2">
                        {catLabel}
                      </span>
                    </span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
