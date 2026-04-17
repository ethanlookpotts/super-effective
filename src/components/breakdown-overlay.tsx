import { useEffect } from "react";
import type { AbilityStep, MatchupBreakdown, MoveBreakdown } from "~/lib/damage";
import { formatMult, multClass, multLabel } from "~/lib/damage";
import { TypeBadge } from "./type-badge";

export type BreakdownTarget =
  | { kind: "matchup"; data: MatchupBreakdown }
  | { kind: "move"; data: MoveBreakdown };

export function BreakdownOverlay({
  target,
  onClose,
}: {
  target: BreakdownTarget | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!target) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [target, onClose]);

  if (!target) return null;

  const title =
    target.kind === "move"
      ? `${target.data.moveName.toUpperCase()} → ${target.data.defenderName.toUpperCase()}`
      : `${target.data.attackerType.toUpperCase()} → ${target.data.defenderName.toUpperCase()}`;

  const final = target.kind === "move" ? target.data.finalWithStab : target.data.final;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Matchup breakdown"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[85dvh] w-full max-w-[480px] flex-col gap-3 overflow-y-auto rounded-t-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 sm:rounded-[var(--radius-card)]">
        <header className="flex items-start justify-between gap-2">
          <h3 className="font-[var(--font-pixel)] text-xs text-[var(--color-text)]">{title}</h3>
          <button
            type="button"
            aria-label="Close breakdown"
            onClick={onClose}
            className="min-h-8 min-w-8 rounded border border-[var(--color-border)] bg-[var(--color-card-2)] px-2 font-[var(--font-pixel)] text-[10px] text-[var(--color-text-2)]"
          >
            ×
          </button>
        </header>

        {target.kind === "move" && <MoveMeta data={target.data} />}

        <TypeMatchupSection
          attackerType={
            target.kind === "move" ? target.data.attackerType : target.data.attackerType
          }
          typeRows={target.data.typeRows}
          typeProduct={target.data.typeProduct}
        />

        {target.data.ability && target.data.ability.kind !== "noop" && (
          <AbilitySection ability={target.data.ability} atkType={target.data.attackerType} />
        )}
        {target.data.ability && target.data.ability.kind === "noop" && (
          <p className="text-[11px] text-[var(--color-text-3)]">
            Ability <strong>{target.data.ability.name}</strong> doesn't affect{" "}
            {target.data.attackerType}.
          </p>
        )}

        {target.kind === "move" && target.data.stab && <StabSection data={target.data} />}

        <ResultBlock final={final} />
      </div>
    </div>
  );
}

function MoveMeta({ data }: { data: MoveBreakdown }) {
  const items: { label: string; value: string; color?: string }[] = [];
  if (data.pow && data.pow > 0) items.push({ label: "PWR", value: String(data.pow) });
  if (data.acc !== null && data.acc > 0 && data.acc < 100)
    items.push({ label: "ACC", value: `${data.acc}%` });
  else if (data.acc === 0 && data.pow && data.pow > 0) items.push({ label: "ACC", value: "∞" });
  if (data.effNote) items.push({ label: "EFFECT", value: data.effNote });
  items.push({
    label: "CAT",
    value: data.phys ? "PHY" : "SPE",
    color: data.phys ? "var(--color-red)" : "var(--color-blue)",
  });

  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-card)] bg-[var(--color-card-2)] p-2">
      <div className="flex items-center gap-2">
        <TypeBadge type={data.attackerType} />
        <span className="font-[var(--font-pixel)] text-[10px] text-[var(--color-text-2)]">
          {data.moveName}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 text-[10px]">
        {items.map((it) => (
          <span
            key={it.label}
            className="rounded bg-[var(--color-card)] px-2 py-0.5 text-[var(--color-text-3)]"
          >
            {it.label}{" "}
            <strong style={{ color: it.color ?? "var(--color-text)" }}>{it.value}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

function TypeMatchupSection({
  attackerType,
  typeRows,
  typeProduct,
}: {
  attackerType: MatchupBreakdown["attackerType"];
  typeRows: MatchupBreakdown["typeRows"];
  typeProduct: number;
}) {
  return (
    <section className="flex flex-col gap-1.5">
      <div className="font-[var(--font-pixel)] text-[10px] text-[var(--color-text-3)]">
        TYPE MATCHUP
      </div>
      {typeRows.map((r) => (
        <div key={r.defType} className="flex items-center gap-2 text-[11px]">
          <TypeBadge type={attackerType} size="sm" />
          <span className="text-[var(--color-text-3)]">→</span>
          <TypeBadge type={r.defType} size="sm" />
          <span className="text-[var(--color-text-3)]">=</span>
          <span className={`font-semibold ${multClassToColor(r.mult)}`}>{formatMult(r.mult)}</span>
        </div>
      ))}
      {typeRows.length > 1 && (
        <div className="text-[10px] text-[var(--color-text-3)]">
          {typeRows.map((r) => formatMult(r.mult)).join(" × ")} = {formatMult(typeProduct)}
        </div>
      )}
    </section>
  );
}

function AbilitySection({
  ability,
  atkType,
}: {
  ability: AbilityStep;
  atkType: MatchupBreakdown["attackerType"];
}) {
  return (
    <section className="flex flex-col gap-1 rounded-[var(--radius-card)] border border-[var(--color-gold)]/40 bg-[var(--color-card-2)] p-2">
      <div className="font-[var(--font-pixel)] text-[10px] text-[var(--color-gold)]">
        ABILITY: {ability.name.toUpperCase()}
        {ability.multi && <span className="ml-1 text-[var(--color-text-3)]"> (may vary)</span>}
      </div>
      <div className="text-[11px] text-[var(--color-text-2)]">
        {ability.kind === "immune"
          ? `${ability.name} grants full immunity to ${atkType}.`
          : `${ability.name} × ${ability.multiplier} to ${atkType}.`}
        <br />
        {formatMult(ability.before)} × {ability.multiplier} ={" "}
        <strong className={multClassToColor(ability.after)}>{formatMult(ability.after)}</strong>
      </div>
    </section>
  );
}

function StabSection({ data }: { data: MoveBreakdown }) {
  const before =
    data.ability && data.ability.kind !== "noop" ? data.ability.after : data.typeProduct;
  return (
    <section className="flex flex-col gap-1 rounded-[var(--radius-card)] border border-[var(--color-gold)]/40 bg-[var(--color-card-2)] p-2">
      <div className="font-[var(--font-pixel)] text-[10px] text-[var(--color-gold)]">
        STAB (SAME-TYPE ATTACK BONUS)
      </div>
      <div className="text-[11px] text-[var(--color-text-2)]">
        {data.attackerName} is {data.attackerType} type — 1.5× bonus.
        <br />
        {formatMult(before)} × 1.5 ={" "}
        <strong className={multClassToColor(data.finalWithStab)}>
          {formatMult(data.finalWithStab)}
        </strong>
      </div>
    </section>
  );
}

function ResultBlock({ final }: { final: number }) {
  return (
    <div
      className={`mt-1 flex items-center justify-between rounded-[var(--radius-card)] border-2 ${resultBorder(final)} bg-[var(--color-card-2)] p-3`}
    >
      <div>
        <div className="font-[var(--font-pixel)] text-[10px] text-[var(--color-text-3)]">
          RESULT
        </div>
        <div className="text-[11px] text-[var(--color-text)]">{multLabel(final)}</div>
      </div>
      <div
        className={`font-[var(--font-pixel)] text-xl ${multClassToColor(final)}`}
        aria-label={`Final multiplier ${formatMult(final)}`}
      >
        {formatMult(final)}
      </div>
    </div>
  );
}

function multClassToColor(m: number): string {
  switch (multClass(m)) {
    case "zero":
      return "text-[var(--color-text-3)]";
    case "good":
      return "text-[var(--color-green)]";
    case "bad":
      return "text-[var(--color-red)]";
    default:
      return "text-[var(--color-text-2)]";
  }
}

function resultBorder(m: number): string {
  switch (multClass(m)) {
    case "zero":
      return "border-[var(--color-text-3)]";
    case "good":
      return "border-[var(--color-green)]";
    case "bad":
      return "border-[var(--color-red)]";
    default:
      return "border-[var(--color-border)]";
  }
}
