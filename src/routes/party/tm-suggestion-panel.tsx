import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TypeBadge } from "~/components/type-badge";
import { LEARNSETS } from "~/data/learnsets";
import { TM_HM } from "~/data/moves";
import { MOVE_TUTORS } from "~/data/tutors";
import { makePartyCalc } from "~/lib/party-calc";
import { spriteUrl } from "~/lib/sprites";
import type { PartyMember, TypeName } from "~/schemas";

const calc = makePartyCalc();

interface TeachSource {
  num: string;
  move: string;
  type: TypeName;
  cat: "phys" | "spec" | "stat";
  tmType: "tm" | "hm" | "tutor";
}

interface Suggestion {
  source: TeachSource;
  target: PartyMember;
  targetIdx: number;
  replacedName: string | null;
  scoreDelta: number;
  superDelta: number;
  coverageLost: number;
}

function ownedTeachSources(inventory: Record<string, number>): TeachSource[] {
  const owned: TeachSource[] = [];
  const seen = new Set<string>();
  for (const src of [...TM_HM, ...MOVE_TUTORS]) {
    if ((inventory[src.num] ?? 0) <= 0) continue;
    if (seen.has(src.move)) continue;
    seen.add(src.move);
    // Status moves don't affect offensive coverage scoring; skip non-HM status items.
    if (src.cat === "stat" && src.tmType !== "hm") continue;
    owned.push({
      num: src.num,
      move: src.move,
      type: src.type,
      cat: src.cat,
      tmType: src.tmType,
    });
  }
  return owned;
}

function computeSuggestions(
  party: readonly PartyMember[],
  inventory: Record<string, number>,
  maxResults = 6,
): Suggestion[] {
  if (party.length === 0) return [];
  const owned = ownedTeachSources(inventory);
  if (owned.length === 0) return [];

  const results: Suggestion[] = [];
  for (const src of owned) {
    const learnable = new Set(
      party.filter((pm) => (LEARNSETS[pm.n] ?? []).includes(src.move)).map((pm) => pm.n),
    );
    if (learnable.size === 0) continue;
    const ranked = calc.rankTeachTargets(party, { name: src.move, type: src.type }, learnable);
    const best = ranked[0];
    if (!best || best.impact.scoreDelta <= 0.01) continue;
    const target = party[best.memberIdx];
    const replacedName =
      best.impact.replaceIdx >= 0 ? (target?.moves?.[best.impact.replaceIdx]?.name ?? null) : null;
    results.push({
      source: src,
      target,
      targetIdx: best.memberIdx,
      replacedName,
      scoreDelta: best.impact.scoreDelta,
      superDelta: best.impact.superDelta,
      coverageLost: best.impact.coverageLost,
    });
  }
  results.sort((a, b) => b.scoreDelta - a.scoreDelta);
  return results.slice(0, maxResults);
}

export function TmSuggestionPanel({
  party,
  inventory,
}: {
  party: readonly PartyMember[];
  inventory: Record<string, number>;
}) {
  const navigate = useNavigate();
  const suggestions = useMemo(() => computeSuggestions(party, inventory), [party, inventory]);

  if (suggestions.length === 0) return null;

  return (
    <section aria-label="TM suggestions" className="flex flex-col gap-2">
      <h3 className="font-[var(--font-pixel)] text-xs text-[var(--color-gold)]">
        📀 TM SUGGESTIONS — BEST MOVES TO TEACH NOW
      </h3>
      <ul className="flex flex-col gap-2">
        {suggestions.map((s) => (
          <li key={`${s.source.num}-${s.target.n}-${s.targetIdx}`}>
            <button
              type="button"
              onClick={() =>
                // Edit modal (Phase 5) consumes `?teach=<dex>:<move>` to pre-queue the teach flow.
                navigate(`/party?teach=${s.target.n}:${encodeURIComponent(s.source.move)}`)
              }
              aria-label={`Teach ${s.source.move} to ${s.target.name}`}
              className="flex min-h-11 w-full items-center gap-2 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-2 text-left"
            >
              <img
                src={spriteUrl(s.target.n, { shiny: s.target.shiny })}
                alt=""
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
                className="h-10 w-10 shrink-0 object-contain"
              />
              <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                <div className="flex flex-wrap items-center gap-1 text-[11px] text-[var(--color-text)]">
                  <span className="font-[var(--font-pixel)] text-[10px]">{s.target.name}</span>
                  <span className="text-[var(--color-text-3)]">·</span>
                  {s.replacedName ? (
                    <>
                      <span className="text-[var(--color-text-3)] line-through">
                        {s.replacedName}
                      </span>
                      <span className="text-[var(--color-text-3)]">→</span>
                    </>
                  ) : (
                    <span className="text-[var(--color-green)]">+</span>
                  )}
                  <TypeBadge type={s.source.type} size="sm" />
                  <span className="text-[var(--color-text)]">{s.source.move}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px]">
                  {s.superDelta > 0 && (
                    <span className="text-[var(--color-green)]">+{s.superDelta} cov</span>
                  )}
                  {s.coverageLost > 0 && (
                    <span className="text-[var(--color-red)]">−{s.coverageLost} cov</span>
                  )}
                  <span className="text-[var(--color-gold)]">+{s.scoreDelta.toFixed(1)} score</span>
                </div>
              </div>
              <span className="shrink-0 text-[var(--color-text-3)]">▶</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
