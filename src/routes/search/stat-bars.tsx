import { useState } from "react";
import type { BaseStats } from "~/data/stats";

const STAT_LABELS: readonly [string, string, string][] = [
  ["HP", "hp", "#3ddc84"],
  ["ATK", "atk", "#ff7043"],
  ["DEF", "def", "#ffb300"],
  ["SpA", "spa", "#4dabf7"],
  ["SpD", "spd", "#9775fa"],
  ["SPE", "spe", "#ff79c6"],
];

const STAT_ROWS: readonly { cls: string; color: string; title: string; desc: string }[] = [
  {
    cls: "hp",
    color: "#3ddc84",
    title: "HP — Hit Points",
    desc: "Damage absorbed before fainting.",
  },
  {
    cls: "atk",
    color: "#ff7043",
    title: "ATK — Physical Attack",
    desc: "Power of Physical moves (Normal, Fighting, Flying, Poison, Ground, Rock, Bug, Ghost, Steel).",
  },
  {
    cls: "def",
    color: "#ffb300",
    title: "DEF — Physical Defence",
    desc: "Resistance to incoming Physical moves.",
  },
  {
    cls: "spa",
    color: "#4dabf7",
    title: "SpA — Special Attack",
    desc: "Power of Special moves (Fire, Water, Grass, Electric, Ice, Psychic, Dragon, Dark).",
  },
  {
    cls: "spd",
    color: "#9775fa",
    title: "SpD — Special Defence",
    desc: "Resistance to incoming Special moves.",
  },
  {
    cls: "spe",
    color: "#ff79c6",
    title: "SPE — Speed",
    desc: "Higher Speed goes first each turn.",
  },
];

export function StatBars({ stats }: { stats: BaseStats }) {
  const [open, setOpen] = useState(false);
  const [hp, atk, def, spa, spd, spe] = stats;
  const values = [hp, atk, def, spa, spd, spe];
  const physFav = atk > spa;
  const even = atk === spa;
  const atkHi = physFav && !even;
  const spaHi = !physFav && !even;

  return (
    <section className="flex flex-col gap-2">
      <header className="flex items-center gap-2">
        <h3 className="font-pixel text-xs text-text">📊 BASE STATS</h3>
        <button
          type="button"
          aria-label="Base stats help"
          onClick={() => setOpen(true)}
          className="grid h-6 w-6 place-items-center rounded-full border border-border bg-card-2 text-[11px] text-text-2"
        >
          ℹ
        </button>
      </header>
      <div
        role="region"
        aria-label="Base stats"
        className="flex flex-col gap-1.5 rounded-card border border-border bg-card p-3"
      >
        {STAT_LABELS.map(([label, _cls, color], i) => {
          const v = values[i];
          const hi = (i === 1 && atkHi) || (i === 3 && spaHi);
          return (
            <div key={label} className="flex items-center gap-2 text-[11px]">
              <span
                className={`w-10 shrink-0 font-pixel text-[10px] ${
                  hi ? "text-gold" : "text-text-2"
                }`}
              >
                {label}
              </span>
              <span
                className={`w-8 shrink-0 text-right tabular-nums ${hi ? "text-gold" : "text-text"}`}
              >
                {v}
              </span>
              <div className="relative h-3 flex-1 overflow-hidden rounded bg-card-2">
                <div
                  className="absolute inset-y-0 left-0"
                  style={{ width: `${Math.round((v / 255) * 100)}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {open && <StatsInfoModal atk={atk} spa={spa} onClose={() => setOpen(false)} />}
    </section>
  );
}

function StatsInfoModal({
  atk,
  spa,
  onClose,
}: {
  atk: number;
  spa: number;
  onClose: () => void;
}) {
  let rec: { text: string; color: string } | null = null;
  if (atk > spa) {
    rec = {
      text: `⚔ Physical attacker — ATK ${atk} > SpA ${spa}\nPHY-tagged moves will hit harder. Prefer them in matchups.`,
      color: "var(--color-red)",
    };
  } else if (spa > atk) {
    rec = {
      text: `✦ Special attacker — SpA ${spa} > ATK ${atk}\nSPE-tagged moves will hit harder. Prefer them in matchups.`,
      color: "var(--color-blue)",
    };
  } else {
    rec = {
      text: `ATK = SpA ${atk} — either category works equally.`,
      color: "var(--color-text-2)",
    };
  }

  return (
    <div
      role="dialog"
      aria-label="Base Stats Explained"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-t-card-lg border border-border bg-card p-4 sm:rounded-card-lg">
        <header className="mb-3 flex items-center justify-between">
          <h3 className="font-pixel text-xs text-text">BASE STATS EXPLAINED</h3>
          <button
            type="button"
            aria-label="Close base stats help"
            onClick={onClose}
            className="min-h-11 rounded-card border border-border bg-card-2 px-3 font-pixel text-[10px] text-text-2"
          >
            CLOSE
          </button>
        </header>
        <div
          className="mb-3 whitespace-pre-line rounded-card border p-3 text-xs"
          style={{ borderColor: rec.color, color: rec.color }}
        >
          {rec.text}
        </div>
        <div className="mb-2 font-pixel text-[9px] text-text-3">WHAT EACH STAT MEANS</div>
        <ul className="flex flex-col gap-2">
          {STAT_ROWS.map((s) => (
            <li key={s.cls} className="flex items-start gap-2">
              <span
                className="mt-1 h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <div>
                <div className="font-pixel text-[10px] text-text">{s.title}</div>
                <div className="text-[11px] text-text-2">{s.desc}</div>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-3 font-pixel text-[9px] text-text-3">WHY YOUR ACTUAL STATS DIFFER</div>
        <p className="mt-1 text-[11px] leading-snug text-text-2">
          These are <strong>species base stats</strong> — identical for every member of that
          species. Your individual Pokémon's real numbers are higher, shaped by IVs (random 0–31),
          EVs (from battles), nature (±10%), and level. The ATK vs SpA ratio stays the same
          regardless, so the recommendation above is still reliable.
        </p>
      </div>
    </div>
  );
}
