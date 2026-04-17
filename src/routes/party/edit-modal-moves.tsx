import { useMemo, useState } from "react";
import { TypeBadge } from "~/components/type-badge";
import { getLearnset } from "~/data/learnsets";
import { ALL_MOVES, type Move } from "~/data/moves";
import { TYPES } from "~/data/types";
import { tc } from "~/lib/colors";
import type { PartyMove, TypeName } from "~/schemas";

const HP_TYPES: readonly TypeName[] = TYPES.filter((t) => t !== "Fairy");
const MAX_MOVES = 4;

function catLabel(m: Move): { label: string; color: string } {
  if (m.cat === "phys") return { label: "PHY", color: "var(--color-red)" };
  if (m.cat === "spec") return { label: "SPE", color: "var(--color-blue)" };
  return { label: "STA", color: "var(--color-text-3)" };
}

export function MovesSection({
  dexN,
  moves,
  onChange,
}: {
  dexN: number;
  moves: readonly PartyMove[];
  onChange: (next: PartyMove[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeName | null>(null);
  const [hpPicking, setHpPicking] = useState(false);

  const learnset = useMemo(() => getLearnset(dexN), [dexN]);
  const q = query.trim().toLowerCase();

  const pool = useMemo(() => {
    return ALL_MOVES.filter((m) => learnset.has(m.name));
  }, [learnset]);

  const filtered = useMemo(() => {
    const f = pool.filter(
      (m) => (!typeFilter || m.type === typeFilter) && (!q || m.name.toLowerCase().includes(q)),
    );
    const picked = f.filter((m) => moves.some((pm) => pm.name === m.name));
    const rest = f.filter((m) => !moves.some((pm) => pm.name === m.name));
    return [...picked, ...rest].slice(0, 50);
  }, [pool, typeFilter, q, moves]);

  function toggleMove(name: string, type: TypeName) {
    const existing = moves.findIndex((m) => m.name === name);
    if (existing >= 0) {
      onChange(moves.filter((_, i) => i !== existing));
      return;
    }
    if (moves.length >= MAX_MOVES) return;
    onChange([...moves, { name, type }]);
  }

  function pickHiddenPower(type: TypeName) {
    if (moves.some((m) => m.name === "Hidden Power")) return;
    if (moves.length >= MAX_MOVES) return;
    onChange([...moves, { name: "Hidden Power", type }]);
    setHpPicking(false);
  }

  function removeMove(idx: number) {
    onChange(moves.filter((_, i) => i !== idx));
  }

  const canAddMore = moves.length < MAX_MOVES;

  return (
    <section aria-label="Moves" className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-[var(--font-pixel)] text-[10px] text-[var(--color-text-3)]">
          MOVES
        </span>
        <span className="font-[var(--font-pixel)] text-[10px] text-[var(--color-text-3)]">
          {moves.length}/{MAX_MOVES} SET
        </span>
      </div>

      <div className="flex gap-1">
        {Array.from({ length: MAX_MOVES }).map((_, i) => {
          const mv = moves[i];
          return (
            <span
              key={`slot-${i}-${mv?.name ?? "empty"}`}
              aria-hidden="true"
              className="h-2 flex-1 rounded-full"
              style={{
                backgroundColor: mv ? tc(mv.type) : "var(--color-border-2)",
                opacity: mv ? 1 : 0.4,
              }}
            />
          );
        })}
      </div>

      {moves.length > 0 && (
        <ul className="flex flex-col gap-1">
          {moves.map((mv, i) => {
            const md = ALL_MOVES.find((m) => m.name === mv.name);
            const cat = md ? catLabel(md) : { label: "—", color: "var(--color-text-3)" };
            return (
              <li key={`${mv.name}-${i}`}>
                <div className="flex min-h-11 items-center gap-2 rounded-[var(--radius-card)] bg-[var(--color-card-2)] px-2 py-1.5">
                  <TypeBadge type={mv.type} size="sm" />
                  <span className="flex-1 text-[11px] text-[var(--color-text)]">{mv.name}</span>
                  <span
                    className="rounded px-1 py-0.5 font-[var(--font-pixel)] text-[9px] text-white"
                    style={{ backgroundColor: cat.color }}
                  >
                    {cat.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMove(i)}
                    aria-label={`Remove ${mv.name}`}
                    className="min-h-11 min-w-11 font-[var(--font-pixel)] text-[10px] text-[var(--color-text-3)]"
                  >
                    ✕
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {canAddMore && (
        <>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search moves…"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Search moves"
            className="min-h-11 w-full rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card-2)] px-3 text-sm text-[var(--color-text)] outline-none"
          />
          <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by type">
            {TYPES.map((t) => {
              const active = typeFilter === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(active ? null : t)}
                  aria-pressed={active}
                  aria-label={`Filter ${t}`}
                  className="rounded px-1.5 py-0.5 font-[var(--font-pixel)] text-[8px] tracking-wider"
                  style={{
                    backgroundColor: active ? tc(t) : "transparent",
                    color: active ? "#fff" : "var(--color-text-3)",
                    border: active ? "none" : "1px solid var(--color-border-2)",
                    opacity: active ? 1 : 0.7,
                  }}
                >
                  {t.slice(0, 3).toUpperCase()}
                </button>
              );
            })}
          </div>
          <div
            role="listbox"
            tabIndex={-1}
            aria-label="Move results"
            className="flex max-h-[40vh] flex-col gap-1 overflow-y-auto"
          >
            {filtered.length === 0 ? (
              <div className="py-3 text-center font-[var(--font-pixel)] text-[10px] text-[var(--color-text-3)]">
                NO MOVES FOUND
              </div>
            ) : (
              filtered.map((mv) => {
                if (mv.name === "Hidden Power") {
                  return (
                    <HiddenPowerRow
                      key="hidden-power"
                      picked={moves.find((m) => m.name === "Hidden Power") ?? null}
                      picking={hpPicking}
                      onToggle={() => {
                        const idx = moves.findIndex((m) => m.name === "Hidden Power");
                        if (idx >= 0) {
                          removeMove(idx);
                          return;
                        }
                        setHpPicking((p) => !p);
                      }}
                      onSelectType={pickHiddenPower}
                    />
                  );
                }
                const isPicked = moves.some((m) => m.name === mv.name);
                const cat = catLabel(mv);
                return (
                  <button
                    key={mv.name}
                    type="button"
                    onClick={() => toggleMove(mv.name, mv.type)}
                    role="option"
                    aria-selected={isPicked}
                    aria-label={`${isPicked ? "Remove" : "Add"} ${mv.name}`}
                    className="flex min-h-11 items-center gap-2 rounded-[var(--radius-card)] bg-[var(--color-card-2)] px-2 py-1.5 text-left"
                    style={{
                      border: isPicked ? "1px solid var(--color-gold)" : "1px solid transparent",
                    }}
                  >
                    <TypeBadge type={mv.type} size="sm" />
                    <span className="flex-1 text-[11px] text-[var(--color-text)]">{mv.name}</span>
                    <span
                      className="rounded px-1 py-0.5 font-[var(--font-pixel)] text-[9px] text-white"
                      style={{ backgroundColor: cat.color }}
                    >
                      {cat.label}
                    </span>
                    {isPicked && (
                      <span className="font-[var(--font-pixel)] text-[10px] text-[var(--color-gold)]">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </section>
  );
}

function HiddenPowerRow({
  picked,
  picking,
  onToggle,
  onSelectType,
}: {
  picked: PartyMove | null;
  picking: boolean;
  onToggle: () => void;
  onSelectType: (t: TypeName) => void;
}) {
  const displayType: TypeName = picked?.type ?? "Normal";
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onToggle}
        aria-label={picked ? "Remove Hidden Power" : "Add Hidden Power"}
        className="flex min-h-11 items-center gap-2 rounded-[var(--radius-card)] bg-[var(--color-card-2)] px-2 py-1.5 text-left"
        style={{
          border: picked || picking ? "1px solid var(--color-gold)" : "1px solid transparent",
        }}
      >
        {picked ? (
          <TypeBadge type={displayType} size="sm" />
        ) : (
          <span className="rounded bg-[var(--color-border-2)] px-1.5 py-0.5 font-[var(--font-pixel)] text-[9px] tracking-wider text-white">
            HP
          </span>
        )}
        <span className="flex-1 text-[11px] text-[var(--color-text)]">Hidden Power</span>
        <span
          className="rounded px-1 py-0.5 font-[var(--font-pixel)] text-[9px] text-white"
          style={{ backgroundColor: "var(--color-blue)" }}
        >
          SPE
        </span>
        {picked ? (
          <span className="font-[var(--font-pixel)] text-[10px] text-[var(--color-gold)]">✓</span>
        ) : picking ? (
          <span className="font-[var(--font-pixel)] text-[10px] text-[var(--color-gold)]">▾</span>
        ) : null}
      </button>
      {picking && !picked && (
        <div role="group" aria-label="Pick Hidden Power type" className="flex flex-wrap gap-1 pl-2">
          {HP_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onSelectType(t)}
              aria-label={`Hidden Power ${t}`}
              className="min-h-11 rounded px-2 font-[var(--font-pixel)] text-[9px] tracking-wider text-white"
              style={{ backgroundColor: tc(t) }}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
