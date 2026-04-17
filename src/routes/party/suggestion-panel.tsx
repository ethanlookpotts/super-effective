import { useEffect, useMemo, useState } from "react";
import { Sprite } from "~/components/sprite";
import { TypeBadge } from "~/components/type-badge";
import { TYPES, dmult, gm } from "~/data/types";
import { useUpdateActivePlaythrough } from "~/hooks/use-playthroughs";
import { tc } from "~/lib/colors";
import { type CalcMember, type TeamSuggestion, makePartyCalc } from "~/lib/party-calc";
import type { PartyMember, TypeName } from "~/schemas";

type Src = "party" | "pc";

type TaggedMember = PartyMember & { _src: Src; _srcIdx: number };

const calc = makePartyCalc();

function buildPool(party: readonly PartyMember[], pc: readonly PartyMember[]): TaggedMember[] {
  return [
    ...party.map((pm, i) => ({ ...pm, _src: "party" as const, _srcIdx: i })),
    ...pc.map((pm, i) => ({ ...pm, _src: "pc" as const, _srcIdx: i })),
  ];
}

function coveredSuper(members: readonly CalcMember[]): Set<TypeName> {
  const covered = new Set<TypeName>();
  for (const pm of members) {
    const at: TypeName[] = [...pm.types, ...(pm.moves ?? []).map((m) => m.type)];
    for (const def of TYPES) {
      if (at.some((t) => gm(t, def) >= 2)) covered.add(def);
    }
  }
  return covered;
}

function exposedWeak(members: readonly CalcMember[]): Set<TypeName> {
  const exposed = new Set<TypeName>();
  for (const pm of members) {
    for (const at of TYPES) {
      if (dmult(at, pm.types) >= 2) exposed.add(at);
    }
  }
  return exposed;
}

export function SuggestionPanel({
  party,
  pc,
}: {
  party: readonly PartyMember[];
  pc: readonly PartyMember[];
}) {
  const suggestions = useMemo<TeamSuggestion<TaggedMember>[]>(() => {
    const pool = buildPool(party, pc);
    if (pool.length === 0) return [];
    return calc.computeSuggestions(pool, 5);
  }, [party, pc]);

  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (party.length + pc.length === 0) {
    return (
      <section
        aria-label="Party suggestions"
        className="rounded-card border border-dashed border-border bg-card-2 p-3 text-center"
      >
        <p className="font-pixel text-[10px] text-text-3">
          ADD POKÉMON TO YOUR PARTY OR PC
          <br />
          FOR PARTY SUGGESTIONS
        </p>
      </section>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <section aria-label="Party suggestions" className="flex flex-col gap-2">
      <h3 className="font-pixel text-xs text-gold">✨ SUGGESTED PARTIES</h3>
      <ul className="flex flex-col gap-2">
        {suggestions.map((s, idx) => (
          <li key={s.members.map((m) => m.n).join("-")}>
            <SuggestionCard idx={idx} suggestion={s} onOpen={() => setOpenIdx(idx)} />
          </li>
        ))}
      </ul>
      {openIdx !== null && suggestions[openIdx] ? (
        <SuggestionModal
          idx={openIdx}
          suggestion={suggestions[openIdx]}
          onClose={() => setOpenIdx(null)}
        />
      ) : null}
    </section>
  );
}

function SuggestionCard({
  idx,
  suggestion,
  onOpen,
}: {
  idx: number;
  suggestion: TeamSuggestion<TaggedMember>;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Suggestion ${idx + 1}: ${suggestion.coverage} of 18 types covered`}
      className="flex min-h-11 w-full items-center gap-2 rounded-card border border-border bg-card p-2 text-left"
    >
      <span className="font-pixel text-[10px] text-text-3">#{idx + 1}</span>
      <span className="flex flex-1 items-center gap-1 overflow-hidden">
        {suggestion.members.map((pm) => (
          <Sprite
            key={`${pm._src}-${pm._srcIdx}-${pm.n}`}
            dex={pm.n}
            shiny={pm.shiny}
            className="h-8 w-8 shrink-0 object-contain"
          />
        ))}
      </span>
      <span className="shrink-0 font-pixel text-[9px] text-gold">{suggestion.coverage}/18</span>
      <span className="shrink-0 text-text-3">▶</span>
    </button>
  );
}

function SuggestionModal({
  idx,
  suggestion,
  onClose,
}: {
  idx: number;
  suggestion: TeamSuggestion<TaggedMember>;
  onClose: () => void;
}) {
  const update = useUpdateActivePlaythrough();
  const covered = coveredSuper(suggestion.members);
  const exposed = exposedWeak(suggestion.members);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function apply() {
    update.mutate(
      (pt) => {
        const usedParty = new Set(
          suggestion.members.filter((m) => m._src === "party").map((m) => m._srcIdx),
        );
        const usedPc = new Set(
          suggestion.members.filter((m) => m._src === "pc").map((m) => m._srcIdx),
        );
        const nextParty: PartyMember[] = suggestion.members.map((m) => {
          const { _src, _srcIdx, ...rest } = m;
          return rest;
        });
        const nextPc: PartyMember[] = [
          ...pt.pc.filter((_, i) => !usedPc.has(i)),
          ...pt.party.filter((_, i) => !usedParty.has(i)),
        ];
        return { ...pt, party: nextParty, pc: nextPc };
      },
      { onSuccess: onClose },
    );
  }

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div
        role="dialog"
        aria-label="Suggested party"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-[420px] overflow-y-auto rounded-card-lg bg-card p-4"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-pixel text-xs text-gold">
            OPTION {idx + 1} · {suggestion.coverage}/18 COVERED
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close suggestion"
            className="min-h-11 min-w-11 font-pixel text-xs text-text-3"
          >
            ✕
          </button>
        </div>

        <ul className="mt-3 grid grid-cols-3 gap-2">
          {suggestion.members.map((pm) => {
            const shortName = pm.name.length > 9 ? `${pm.name.slice(0, 8)}…` : pm.name;
            return (
              <li
                key={`${pm._src}-${pm._srcIdx}-${pm.n}`}
                className="flex flex-col items-center gap-1 rounded-card bg-card-2 p-2 text-center"
              >
                <Sprite dex={pm.n} shiny={pm.shiny} className="h-12 w-12 object-contain" />
                <span className="font-pixel text-[9px] text-text">{shortName}</span>
                <span className="flex flex-wrap justify-center gap-0.5">
                  {pm.types.map((t) => (
                    <TypeBadge key={t} type={t} size="sm" />
                  ))}
                </span>
                <span
                  className="font-pixel text-[8px] tracking-wider"
                  style={{
                    color: pm._src === "party" ? "var(--color-gold)" : "var(--color-blue)",
                  }}
                >
                  {pm._src === "party" ? "IN PARTY" : "FROM PC"}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-3">
          <div className="font-pixel text-[10px] text-text-3">COVERS</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {TYPES.map((t) => {
              const on = covered.has(t);
              return (
                <span
                  key={t}
                  className="rounded px-1.5 py-0.5 font-pixel text-[8px] tracking-wider"
                  style={{
                    backgroundColor: on ? tc(t) : "transparent",
                    color: on ? "#fff" : "var(--color-text-3)",
                    border: on ? "none" : "1px solid var(--color-border-2)",
                    opacity: on ? 1 : 0.55,
                  }}
                >
                  {t.slice(0, 3).toUpperCase()}
                </span>
              );
            })}
          </div>
        </div>

        {exposed.size > 0 && (
          <div className="mt-3">
            <div className="font-pixel text-[10px] text-text-3">WEAK TO</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {[...exposed].map((t) => (
                <TypeBadge key={t} type={t} size="sm" />
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={apply}
          disabled={update.isPending}
          className="mt-4 min-h-11 w-full rounded-card bg-gold px-3 font-pixel text-xs text-black disabled:opacity-60"
        >
          {update.isPending ? "APPLYING…" : "USE THIS PARTY"}
        </button>
      </div>
    </div>
  );
}
