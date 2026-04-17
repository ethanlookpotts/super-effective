import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { BreakdownOverlay, type BreakdownTarget } from "~/components/breakdown-overlay";
import { TypeBadge } from "~/components/type-badge";
import { MOVE_DATA, type MoveStats } from "~/data/moves";
import { POKEMON } from "~/data/pokemon";
import {
  STATS,
  computeAttackerStats,
  damageRangePct,
  estimateEnemyHP,
  estimateEnemyStat,
} from "~/data/stats";
import { PHYS, dmult } from "~/data/types";
import { applyAbilityMod, moveBreakdown } from "~/lib/damage";
import type { PartyMember, TypeName } from "~/schemas";

function effClass(eff: string): string {
  const e = eff.toLowerCase();
  if (e.includes("burn") || e.includes("fire")) return "text-[var(--color-red)]";
  if (e.includes("para")) return "text-[var(--color-gold)]";
  if (e.includes("sleep")) return "text-[var(--color-blue)]";
  if (e.includes("psn") || e.includes("poison")) return "text-[#b84fb8]";
  if (e.includes("freeze")) return "text-[var(--color-blue)]";
  if (e.includes("flinch")) return "text-[var(--color-text-2)]";
  if (e.includes("drain")) return "text-[var(--color-green)]";
  if (e.includes("ohko")) return "text-[var(--color-red)]";
  return "text-[var(--color-text-2)]";
}

interface ScoredMove {
  name: string;
  type: TypeName;
  raw: number;
  stab: boolean;
  pow: number | null;
  acc: number | null;
  effNote: string | null;
  eff: number;
}

interface Scored {
  pm: PartyMember;
  bestOff: number;
  bestAtkType: TypeName | null;
  sm: ScoredMove[];
  defRisk: number;
  defBestType: TypeName | null;
  pmImm: TypeName[];
  statLabel: string | null;
  statCls: "phy" | "spe" | "even" | null;
  score: number;
}

export function PartyMatchupList({
  enemyDex,
  enemyTypes,
  party,
}: {
  enemyDex: number;
  enemyTypes: readonly TypeName[];
  party: readonly PartyMember[];
}) {
  const scored = useMemo<Scored[]>(() => {
    const list: Scored[] = party.map((pm) => {
      // Offense via types
      let bestOff = 0;
      let bestAtkType: TypeName | null = null;
      for (const at of pm.types) {
        const m = applyAbilityMod(dmult(at, enemyTypes), at, enemyDex) * 1.5;
        if (m > bestOff) {
          bestOff = m;
          bestAtkType = at;
        }
      }

      // Offense via moves
      const sm: ScoredMove[] = [];
      for (const mv of pm.moves ?? []) {
        const raw = applyAbilityMod(dmult(mv.type, enemyTypes), mv.type, enemyDex);
        const stab = pm.types.includes(mv.type);
        const md: MoveStats | undefined = MOVE_DATA[mv.name];
        const pow = md ? md[0] : null;
        const acc = md ? md[1] : null;
        const effNote = md ? md[2] : null;
        sm.push({
          name: mv.name,
          type: mv.type,
          raw,
          stab,
          pow,
          acc,
          effNote,
          eff: raw * (stab ? 1.5 : 1),
        });
      }
      sm.sort((a, b) => b.eff - a.eff || (b.pow ?? 0) - (a.pow ?? 0));
      if (sm.length) bestOff = sm[0].eff;

      // Defense
      const defRisks = enemyTypes.map((at) => ({
        type: at,
        m: applyAbilityMod(dmult(at, pm.types), at, pm.n),
      }));
      const defRisk = defRisks.reduce((max, r) => (r.m > max ? r.m : max), 0);
      const defBest = defRisks.find((r) => r.m === defRisk) ?? null;
      const pmImm = enemyTypes.filter((at) => applyAbilityMod(dmult(at, pm.types), at, pm.n) === 0);

      const pmSt = STATS[pm.n];
      let statLabel: string | null = null;
      let statCls: "phy" | "spe" | "even" | null = null;
      if (pmSt) {
        if (pmSt[1] > pmSt[3]) {
          statCls = "phy";
          statLabel = `PHY · Atk ${pmSt[1]}`;
        } else if (pmSt[1] < pmSt[3]) {
          statCls = "spe";
          statLabel = `SPE · SpA ${pmSt[3]}`;
        } else {
          statCls = "even";
          statLabel = `ATK = SpA ${pmSt[1]}`;
        }
      }

      return {
        pm,
        bestOff,
        bestAtkType,
        sm,
        defRisk,
        defBestType: defBest?.type ?? null,
        pmImm,
        statLabel,
        statCls,
        score: bestOff * 3 - defRisk,
      };
    });
    list.sort((a, b) => b.score - a.score);
    return list;
  }, [enemyDex, enemyTypes, party]);

  const [breakdown, setBreakdown] = useState<BreakdownTarget | null>(null);

  if (party.length === 0) {
    return (
      <section className="flex flex-col gap-2">
        <h3 className="font-[var(--font-pixel)] text-xs text-[var(--color-text)]">
          MY PARTY — WHO TO USE
        </h3>
        <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-card-2)] p-4 text-center">
          <p className="font-[var(--font-pixel)] text-[10px] text-[var(--color-text-3)]">
            ADD POKEMON TO PARTY
            <br />
            FOR BATTLE SUGGESTIONS
          </p>
        </div>
      </section>
    );
  }

  function openMoveBreakdown(pm: PartyMember, moveName: string, moveType: TypeName) {
    const defender = POKEMON.find((p) => p.n === enemyDex);
    if (!defender) return;
    setBreakdown({
      kind: "move",
      data: moveBreakdown(moveName, moveType, defender, {
        n: pm.n,
        name: pm.name,
        types: pm.types,
      }),
    });
  }

  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-[var(--font-pixel)] text-xs text-[var(--color-text)]">
        MY PARTY — WHO TO USE
      </h3>
      <div className="flex flex-col gap-2">
        {scored.map((s, i) => (
          <ScoredCard
            key={s.pm.n}
            s={s}
            isTop={i === 0}
            enemyDex={enemyDex}
            onMoveClick={openMoveBreakdown}
          />
        ))}
      </div>
      <BreakdownOverlay target={breakdown} onClose={() => setBreakdown(null)} />
    </section>
  );
}

function ratingBadge(bestOff: number): { label: string; color: string } {
  if (bestOff >= 6) return { label: "💥 NUKE", color: "var(--color-red)" };
  if (bestOff >= 3) return { label: "⭐ GREAT", color: "var(--color-gold)" };
  if (bestOff >= 2) return { label: "✅ GOOD", color: "var(--color-green)" };
  if (bestOff < 1) return { label: "✗ WEAK", color: "var(--color-text-3)" };
  return { label: "~ OK", color: "var(--color-text-2)" };
}

function ScoredCard({
  s,
  isTop,
  enemyDex,
  onMoveClick,
}: {
  s: Scored;
  isTop: boolean;
  enemyDex: number;
  onMoveClick: (pm: PartyMember, moveName: string, moveType: TypeName) => void;
}) {
  const rating = ratingBadge(s.bestOff);
  const pm = s.pm;
  const atkLevel = typeof pm.level === "number" ? pm.level : 50;
  const enemyBase = STATS[enemyDex];
  const enemyLevel = atkLevel;
  const atkStats = useMemo(() => computeAttackerStats(pm), [pm]);
  const risky = s.defRisk >= 4;

  return (
    <div
      className={`rounded-[var(--radius-card)] border bg-[var(--color-card)] p-3 ${
        isTop ? "border-[var(--color-gold)]" : "border-[var(--color-border)]"
      } ${risky ? "ring-1 ring-[var(--color-red)]/40" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-semibold text-[var(--color-text)]">
              {isTop ? "⭐ " : ""}
              {pm.name}
            </span>
            {pm.level !== undefined && (
              <span className="font-[var(--font-pixel)] text-[9px] text-[var(--color-text-3)]">
                Lv.{pm.level}
              </span>
            )}
          </div>
          <div className="flex gap-1">
            {pm.types.map((t) => (
              <TypeBadge key={t} type={t} size="sm" />
            ))}
          </div>
          {s.statLabel && (
            <div
              className="font-[var(--font-pixel)] text-[9px]"
              style={{
                color:
                  s.statCls === "phy"
                    ? "var(--color-red)"
                    : s.statCls === "spe"
                      ? "var(--color-blue)"
                      : "var(--color-text-2)",
              }}
            >
              {s.statLabel}
            </div>
          )}
        </div>
        <span
          className="shrink-0 rounded-[var(--radius-card)] px-2 py-1 font-[var(--font-pixel)] text-[9px] text-white"
          style={{ backgroundColor: rating.color }}
        >
          {rating.label}
        </span>
      </div>

      {s.sm.length > 0 ? (
        <div className="mt-2 flex flex-col gap-1">
          {s.sm.map((mv) => {
            const phys = PHYS.has(mv.type);
            const tags: ReactNode[] = [];
            if (mv.raw >= 4)
              tags.push(
                <span
                  key="4x"
                  className="rounded bg-[var(--color-red)] px-1 py-0.5 text-[9px] text-white"
                >
                  4×
                </span>,
              );
            else if (mv.raw >= 2)
              tags.push(
                <span
                  key="2x"
                  className="rounded bg-[var(--color-green)] px-1 py-0.5 text-[9px] text-white"
                >
                  2×
                </span>,
              );
            else if (mv.raw === 0)
              tags.push(
                <span
                  key="0x"
                  className="rounded bg-[var(--color-text-3)] px-1 py-0.5 text-[9px] text-white"
                >
                  0×
                </span>,
              );
            if (mv.stab)
              tags.push(
                <span
                  key="stab"
                  className="rounded bg-[var(--color-gold)] px-1 py-0.5 text-[9px] text-white"
                >
                  STAB
                </span>,
              );
            tags.push(
              <span
                key="cat"
                className={`rounded px-1 py-0.5 text-[9px] text-white ${
                  phys ? "bg-[var(--color-red)]/80" : "bg-[var(--color-blue)]/80"
                }`}
              >
                {phys ? "PHY" : "SPE"}
              </span>,
            );

            let dmg: string | null = null;
            if (atkStats && enemyBase && mv.pow && mv.pow > 0 && mv.eff > 0) {
              const atkStat = phys ? atkStats.atk : atkStats.spa;
              const defStat = estimateEnemyStat(enemyBase[phys ? 2 : 4], enemyLevel);
              const defHP = estimateEnemyHP(enemyBase[0], enemyLevel);
              const rng = damageRangePct(atkLevel, atkStat, defStat, defHP, mv.pow, mv.eff);
              if (rng) dmg = `~${rng[0]}–${rng[1]}%`;
            }

            const subParts: ReactNode[] = [];
            if (mv.pow && mv.pow > 0)
              subParts.push(
                <span key="pow" className="text-[var(--color-text-2)]">
                  {mv.pow}bp
                </span>,
              );
            else if (mv.pow === 0 && mv.effNote)
              subParts.push(
                <span key="pow" className="text-[var(--color-text-3)]">
                  status
                </span>,
              );
            if (dmg)
              subParts.push(
                <span key="dmg" className="text-[var(--color-gold)]">
                  {dmg}
                </span>,
              );
            if (mv.acc !== null && mv.acc > 0 && mv.acc < 100)
              subParts.push(
                <span key="acc" className="text-[var(--color-text-3)]">
                  {mv.acc}%
                </span>,
              );
            else if (mv.acc === 0 && mv.pow && mv.pow > 0)
              subParts.push(
                <span key="acc" className="text-[var(--color-text-3)]">
                  ∞ acc
                </span>,
              );
            if (mv.effNote)
              subParts.push(
                <span key="eff" className={effClass(mv.effNote)}>
                  {mv.effNote}
                </span>,
              );

            return (
              <button
                key={mv.name}
                type="button"
                aria-label={`${mv.name} breakdown`}
                onClick={() => onMoveClick(pm, mv.name, mv.type)}
                className="flex w-full items-start gap-2 rounded-[var(--radius-card)] bg-[var(--color-card-2)] p-2 text-left text-xs hover:bg-[var(--color-card)]"
              >
                <span className="mt-0.5">
                  <TypeBadge type={mv.type} size="sm" />
                </span>
                <span className="flex-1">
                  <span className="text-[var(--color-text)]">{mv.name}</span>
                  {subParts.length > 0 && (
                    <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                      {subParts}
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 flex-wrap justify-end gap-0.5">{tags}</span>
              </button>
            );
          })}
        </div>
      ) : s.bestAtkType ? (
        <div className="mt-2 text-[11px] text-[var(--color-text-2)]">
          Best type:{" "}
          <span className="inline-block align-middle">
            <TypeBadge type={s.bestAtkType} size="sm" />
          </span>{" "}
          — <span className="text-[var(--color-text-3)]">add moves for full breakdown</span>
        </div>
      ) : null}

      {s.pmImm.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px] text-[var(--color-green)]">
          🛡 {pm.name} immune to
          {s.pmImm.map((t) => (
            <span key={t} className="inline-block">
              <TypeBadge type={t} size="sm" />
            </span>
          ))}
        </div>
      )}
      {s.defRisk >= 4 && s.defBestType && (
        <div className="mt-1 flex items-center gap-1 text-[11px] text-[var(--color-red)]">
          ⚠️ Enemy hits {pm.name} <strong>4×</strong> with{" "}
          <TypeBadge type={s.defBestType} size="sm" /> — HIGH RISK
        </div>
      )}
      {s.defRisk >= 2 && s.defRisk < 4 && s.defBestType && (
        <div className="mt-1 flex items-center gap-1 text-[11px] text-[var(--color-red)]">
          ⚠️ Enemy hits {pm.name} <strong>{s.defRisk}×</strong> with{" "}
          <TypeBadge type={s.defBestType} size="sm" />
        </div>
      )}
      {s.defRisk <= 0.5 && (
        <div className="mt-1 text-[11px] text-[var(--color-green)]">
          🛡 {pm.name} resists enemy ({s.defRisk}×)
        </div>
      )}
    </div>
  );
}
