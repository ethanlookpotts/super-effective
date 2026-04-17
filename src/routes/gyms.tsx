import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TypeBadge } from "~/components/type-badge";
import { BOSSES, type BossMember, RIVALS } from "~/data/bosses";
import { useUpdateActivePlaythrough } from "~/hooks/use-playthroughs";
import { useActivePlaythrough } from "~/hooks/use-store";
import type { RivalStarter } from "~/schemas";

const STARTER_LABEL: Record<RivalStarter, string> = {
  bulbasaur: "🌿 Bulbasaur",
  charmander: "🔥 Charmander",
  squirtle: "💧 Squirtle",
};

type OrderEntry = { type: "rival"; i: number } | { type: "boss"; i: number };

const ORDER: readonly OrderEntry[] = [
  { type: "rival", i: 0 },
  { type: "boss", i: 0 },
  { type: "rival", i: 1 },
  { type: "boss", i: 1 },
  { type: "rival", i: 2 },
  { type: "boss", i: 2 },
  { type: "rival", i: 3 },
  { type: "boss", i: 3 },
  { type: "boss", i: 4 },
  { type: "rival", i: 4 },
  { type: "boss", i: 5 },
  { type: "boss", i: 6 },
  { type: "boss", i: 7 },
  { type: "rival", i: 5 },
  { type: "boss", i: 8 },
  { type: "boss", i: 9 },
  { type: "boss", i: 10 },
  { type: "boss", i: 11 },
  { type: "boss", i: 12 },
];

export function GymsRoute() {
  const active = useActivePlaythrough();
  const updatePt = useUpdateActivePlaythrough();
  const navigate = useNavigate();
  const [openKey, setOpenKey] = useState<string | null>(null);

  if (!active) {
    return (
      <section>
        <h2 className="font-[var(--font-pixel)] text-sm text-[var(--color-text)]">GYMS</h2>
        <p className="mt-2 text-sm text-[var(--color-text-2)]">
          Create a playthrough to view gym leaders.
        </p>
      </section>
    );
  }

  const rivalStarter = active.rivalStarter;

  function setStarter(s: RivalStarter) {
    updatePt.mutate((pt) => ({ ...pt, rivalStarter: s }));
  }

  function goSearch(name: string) {
    navigate(`/search?q=${encodeURIComponent(name)}`);
  }

  function keyFor(entry: OrderEntry) {
    return `${entry.type}-${entry.i}`;
  }

  return (
    <section className="flex flex-col gap-3">
      <header>
        <h2 className="font-[var(--font-pixel)] text-sm text-[var(--color-text)]">
          GYMS &amp; ELITE FOUR
        </h2>
      </header>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-3">
        <div className="mb-2 font-[var(--font-pixel)] text-xs text-[var(--color-gold)]">
          🏁 GARY — YOUR STARTER
        </div>
        <div className="flex gap-2">
          {(Object.keys(STARTER_LABEL) as RivalStarter[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStarter(s)}
              className={`min-h-11 flex-1 rounded-[var(--radius-card)] border px-2 text-xs ${
                rivalStarter === s
                  ? "border-[var(--color-gold)] bg-[var(--color-card-2)] text-[var(--color-text)]"
                  : "border-[var(--color-border)] text-[var(--color-text-2)]"
              }`}
            >
              {STARTER_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {ORDER.map((entry) => {
          const key = keyFor(entry);
          const open = openKey === key;
          if (entry.type === "rival") {
            const r = RIVALS[entry.i];
            if (!r) return null;
            const team = r.teams[rivalStarter];
            return (
              <BossCard
                key={key}
                title={r.location}
                sub={r.sub}
                icon={r.icon}
                color="#ffc93c"
                team={team}
                tip={r.tip}
                open={open}
                onToggle={() => setOpenKey(open ? null : key)}
                onPick={goSearch}
              />
            );
          }
          const b = BOSSES[entry.i];
          if (!b) return null;
          return (
            <BossCard
              key={key}
              title={b.name}
              sub={b.sub}
              icon={b.icon}
              color={b.color}
              team={b.team}
              tip={b.tip}
              open={open}
              onToggle={() => setOpenKey(open ? null : key)}
              onPick={goSearch}
            />
          );
        })}
      </div>
    </section>
  );
}

function BossCard({
  title,
  sub,
  icon,
  color,
  team,
  tip,
  open,
  onToggle,
  onPick,
}: {
  title: string;
  sub: string;
  icon: string;
  color: string;
  team: readonly BossMember[];
  tip?: string;
  open: boolean;
  onToggle: () => void;
  onPick: (name: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={`Expand ${title}`}
        className="flex min-h-11 w-full items-center gap-3 p-3 text-left"
      >
        <span
          className="grid h-10 w-10 place-items-center rounded-[var(--radius-card)] border text-lg"
          style={{ backgroundColor: `${color}22`, borderColor: `${color}44` }}
        >
          {icon}
        </span>
        <span className="flex-1">
          <span className="block font-[var(--font-pixel)] text-xs text-[var(--color-text)]">
            {title}
          </span>
          <span className="block text-[10px] text-[var(--color-text-3)]">{sub}</span>
        </span>
        <span className={`text-[var(--color-text-3)] transition ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
      {open && (
        <div className="flex flex-col gap-2 border-t border-[var(--color-border)] p-3">
          <ul className="flex flex-col gap-1.5">
            {team.map((p) => (
              <li key={`${p.name}-${p.lv}`}>
                <button
                  type="button"
                  onClick={() => onPick(p.name)}
                  aria-label={`${p.name} Lv.${p.lv}`}
                  className="flex w-full items-center gap-2 rounded-[var(--radius-card)] bg-[var(--color-card-2)] p-2 text-left"
                >
                  <span className="w-14 text-[10px] font-[var(--font-pixel)] text-[var(--color-gold)]">
                    Lv.{p.lv}
                  </span>
                  <span className="flex-1 text-sm text-[var(--color-text)]">{p.name}</span>
                  <span className="flex gap-1">
                    {p.types.map((t) => (
                      <TypeBadge key={t} type={t} size="sm" />
                    ))}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {tip && (
            <div className="rounded-[var(--radius-card)] bg-[var(--color-card-2)] p-2 text-xs text-[var(--color-text-2)]">
              💡 {tip}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
