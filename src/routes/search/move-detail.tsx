import { TypeBadge } from "~/components/type-badge";
import { ALL_MOVES, MOVE_DATA, TM_HM } from "~/data/moves";
import { POKEMON } from "~/data/pokemon";
import { MOVE_TUTORS } from "~/data/tutors";
import { useLearnsets } from "~/hooks/use-learnsets";

export function MoveDetail({
  moveName,
  onPickPoke,
}: {
  moveName: string;
  onPickPoke: (dex: number) => void;
}) {
  const mv = ALL_MOVES.find((m) => m.name === moveName);
  const md = mv ? MOVE_DATA[mv.name] : undefined;
  const tm = TM_HM.find((t) => t.move === moveName);
  const tutor = MOVE_TUTORS.find((t) => t.move === moveName);
  const learnsets = useLearnsets();
  const learners =
    mv && learnsets ? POKEMON.filter((p) => (learnsets[p.n] ?? []).includes(mv.name)) : [];

  if (!mv) {
    return (
      <div className="rounded-card border border-border bg-card p-4 text-center text-sm text-text-2">
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
      <div className="rounded-card border border-border bg-card p-3">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-pixel text-sm text-text">{mv.name}</h2>
          <div className="flex items-center gap-1">
            <TypeBadge type={mv.type} />
            <span
              className={`rounded px-1.5 py-1 font-pixel text-[10px] text-white ${
                mv.cat === "phys" ? "bg-red" : mv.cat === "spec" ? "bg-blue" : "bg-text-3"
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
                className="flex items-center gap-1.5 rounded-card bg-card-2 px-2 py-1 text-[11px]"
              >
                <span className="font-pixel text-[9px] text-text-3">{item.label}</span>
                <span className="text-text">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {(tm || tutor) && (
        <section className="flex flex-col gap-2">
          <h3 className="font-pixel text-xs text-text">📀 TM / HM / TUTOR</h3>
          <div className="flex flex-col gap-1.5 rounded-card border border-border bg-card p-3">
            {tm && (
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded bg-gold px-1.5 py-0.5 font-pixel text-[10px] text-white">
                  {tm.tmType === "hm" ? "HM" : "TM"}
                  {String(tm.num).padStart(2, "0")}
                </span>
                <span className="text-text-2">{tm.loc}</span>
              </div>
            )}
            {tutor && (
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded bg-blue px-1.5 py-0.5 font-pixel text-[10px] text-white">
                  TUTOR
                </span>
                <span className="text-text-2">{tutor.loc}</span>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h3 className="font-pixel text-xs text-text">📚 WHO CAN LEARN ({learners.length})</h3>
        {learners.length === 0 ? (
          <div className="rounded-card border border-dashed border-border bg-card-2 p-4 text-center">
            <p className="font-pixel text-[10px] text-text-3">
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
                className="flex min-h-11 w-full items-center gap-2 rounded-card border border-border bg-card p-2 text-left"
              >
                <span className="flex-1">
                  <span className="block text-sm text-text">{p.name}</span>
                  <span className="block font-pixel text-[9px] text-text-3">
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
