import { useMemo } from "react";
import { TypeBadge } from "~/components/type-badge";
import { LEARNSETS } from "~/data/learnsets";
import { ALL_MOVES, MOVE_DATA, TM_HM } from "~/data/moves";
import { POKEMON } from "~/data/pokemon";
import { MOVE_TUTORS } from "~/data/tutors";

export function MoveDetail({
  moveName,
  onPickPoke,
}: {
  moveName: string;
  onPickPoke: (dex: number) => void;
}) {
  const mv = useMemo(() => ALL_MOVES.find((m) => m.name === moveName), [moveName]);
  const md = mv ? MOVE_DATA[mv.name] : undefined;
  const tm = useMemo(() => TM_HM.find((t) => t.move === moveName), [moveName]);
  const tutor = useMemo(() => MOVE_TUTORS.find((t) => t.move === moveName), [moveName]);
  const learners = useMemo(() => {
    if (!mv) return [];
    return POKEMON.filter((p) => (LEARNSETS[p.n] ?? []).includes(mv.name));
  }, [mv]);

  if (!mv) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-center text-sm text-[var(--color-text-2)]">
        Move not found.
      </div>
    );
  }

  const pow = md ? md[0] : null;
  const acc = md ? md[1] : null;
  const eff = md ? md[2] : null;
  const catLabel = mv.cat === "phys" ? "PHY" : mv.cat === "spec" ? "SPE" : "STA";

  const metaItems: { label: string; value: string }[] = [];
  if (pow !== null && pow > 0) metaItems.push({ label: "PWR", value: String(pow) });
  else if (pow === 0 && mv.cat !== "stat") metaItems.push({ label: "PWR", value: "—" });
  if (acc !== null && acc > 0 && acc < 100) metaItems.push({ label: "ACC", value: `${acc}%` });
  else if (acc === 100) metaItems.push({ label: "ACC", value: "100%" });
  else if (acc === 0 && pow !== null && pow > 0) metaItems.push({ label: "ACC", value: "∞" });
  if (eff) metaItems.push({ label: "EFFECT", value: eff });

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-3">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="font-[var(--font-pixel)] text-sm text-[var(--color-text)]"
            role="heading"
            aria-level={2}
          >
            {mv.name}
          </h3>
          <div className="flex items-center gap-1">
            <TypeBadge type={mv.type} />
            <span
              className={`rounded px-1.5 py-1 font-[var(--font-pixel)] text-[10px] text-white ${
                mv.cat === "phys"
                  ? "bg-[var(--color-red)]"
                  : mv.cat === "spec"
                    ? "bg-[var(--color-blue)]"
                    : "bg-[var(--color-text-3)]"
              }`}
            >
              {catLabel}
            </span>
          </div>
        </div>
        {metaItems.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {metaItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-1.5 rounded-[var(--radius-card)] bg-[var(--color-card-2)] px-2 py-1 text-[11px]"
              >
                <span className="font-[var(--font-pixel)] text-[9px] text-[var(--color-text-3)]">
                  {item.label}
                </span>
                <span className="text-[var(--color-text)]">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {(tm || tutor) && (
        <section className="flex flex-col gap-2">
          <h3 className="font-[var(--font-pixel)] text-xs text-[var(--color-text)]">
            📀 TM / HM / TUTOR
          </h3>
          <div className="flex flex-col gap-1.5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-3">
            {tm && (
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded bg-[var(--color-gold)] px-1.5 py-0.5 font-[var(--font-pixel)] text-[10px] text-white">
                  {tm.tmType === "hm" ? "HM" : "TM"}
                  {String(tm.num).padStart(2, "0")}
                </span>
                <span className="text-[var(--color-text-2)]">{tm.loc}</span>
              </div>
            )}
            {tutor && (
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded bg-[var(--color-blue)] px-1.5 py-0.5 font-[var(--font-pixel)] text-[10px] text-white">
                  TUTOR
                </span>
                <span className="text-[var(--color-text-2)]">{tutor.loc}</span>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h3 className="font-[var(--font-pixel)] text-xs text-[var(--color-text)]">
          📚 WHO CAN LEARN ({learners.length})
        </h3>
        {learners.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-card-2)] p-4 text-center">
            <p className="font-[var(--font-pixel)] text-[10px] text-[var(--color-text-3)]">
              NO POKÉMON LEARN THIS MOVE
              <br />
              IN FRLG
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {learners.map((p) => (
              <button
                key={p.n}
                type="button"
                aria-label={`View ${p.name}`}
                onClick={() => onPickPoke(p.n)}
                className="flex min-h-11 w-full items-center gap-2 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-2 text-left"
              >
                <span className="flex-1">
                  <span className="block text-sm text-[var(--color-text)]">{p.name}</span>
                  <span className="block font-[var(--font-pixel)] text-[9px] text-[var(--color-text-3)]">
                    #{String(p.n).padStart(3, "0")}
                  </span>
                </span>
                <span className="flex gap-1">
                  {p.types.map((t) => (
                    <TypeBadge key={t} type={t} size="sm" />
                  ))}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
