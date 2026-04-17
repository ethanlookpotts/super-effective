import type { GameScreenAggregate } from "./game-screen";

const LABEL = "font-[var(--font-pixel)] text-[9px] text-[var(--color-text-3)]";
const VALUE = "text-[11px] text-[var(--color-text)]";

function formatCost(inputTokens: number, outputTokens: number): string {
  const cost = inputTokens * 0.000001 + outputTokens * 0.000005;
  if (cost < 0.0001) return "<$0.0001";
  return `~$${cost.toFixed(4)}`;
}

function statsLine(stats: GameScreenAggregate["stats"]): string {
  if (!stats) return "";
  const order: (keyof NonNullable<GameScreenAggregate["stats"]>)[] = [
    "hp",
    "atk",
    "def",
    "spatk",
    "spdef",
    "spe",
  ];
  return order
    .filter((k) => stats[k] != null)
    .map((k) => `${k.toUpperCase()} ${stats[k]}`)
    .join(" · ");
}

interface Row {
  label: string;
  value: string;
}

function rowsFromAggregate(agg: GameScreenAggregate): Row[] {
  const rows: Row[] = [];
  if (agg.poke) {
    const bits = [agg.poke.name];
    if (agg.gender) bits.push(agg.gender === "M" ? "♂" : "♀");
    if (agg.shiny) bits.push("✦");
    rows.push({ label: "NAME", value: bits.join(" ") });
  }
  if (agg.level != null) rows.push({ label: "LEVEL", value: String(agg.level) });
  if (agg.nature) rows.push({ label: "NATURE", value: agg.nature });
  if (agg.ability) rows.push({ label: "ABILITY", value: agg.ability });
  if (agg.hasItem) rows.push({ label: "ITEM", value: agg.item || "none" });
  if (agg.pokeball) rows.push({ label: "BALL", value: agg.pokeball });
  if (agg.otName || agg.otId != null) {
    const parts: string[] = [];
    if (agg.otName) parts.push(agg.otName);
    if (agg.otId != null) parts.push(`#${agg.otId}`);
    rows.push({ label: "OT", value: parts.join(" ") });
  }
  const stats = statsLine(agg.stats);
  if (stats) rows.push({ label: "STATS", value: stats });
  if (agg.moves.length) {
    rows.push({ label: "MOVES", value: agg.moves.map((m) => m.name).join(", ") });
  }
  if (agg.trainerMemo) rows.push({ label: "MEMO", value: agg.trainerMemo });
  return rows;
}

export function ScanResultBox({
  aggregate,
  error,
  onReset,
}: {
  aggregate: GameScreenAggregate | null;
  error?: string | null;
  onReset: () => void;
}) {
  if (!aggregate && !error) return null;
  const rows = aggregate ? rowsFromAggregate(aggregate) : [];
  const totalTokens = aggregate ? aggregate.inputTokens + aggregate.outputTokens : 0;

  return (
    <div
      role="region"
      aria-label="Scan result"
      className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-[color-mix(in_srgb,var(--color-gold)_25%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_5%,transparent)] p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-[var(--font-pixel)] text-[10px] text-[var(--color-gold)]">
          📷 SCAN RESULT
        </span>
        {aggregate && rows.length > 0 && (
          <button
            type="button"
            onClick={onReset}
            aria-label="Reset form to scan values"
            className="min-h-11 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card-2)] px-2 font-[var(--font-pixel)] text-[9px] text-[var(--color-text-2)]"
          >
            ↺ RESET TO SCAN
          </button>
        )}
      </div>
      {error && (
        <div role="alert" className="text-[11px] text-[var(--color-red)]">
          {error}
        </div>
      )}
      {aggregate &&
        (rows.length > 0 ? (
          <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
            {rows.map((r) => (
              <div key={r.label} className="contents">
                <span className={LABEL}>{r.label}</span>
                <span className={VALUE}>{r.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-[var(--color-text-3)]">Nothing recognised.</div>
        ))}
      {aggregate && totalTokens > 0 && (
        <div className="font-[var(--font-pixel)] text-[9px] text-[var(--color-text-3)]">
          {totalTokens} tok · {formatCost(aggregate.inputTokens, aggregate.outputTokens)} ·{" "}
          <a
            href="https://console.anthropic.com/settings/usage"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            exact usage ↗
          </a>
        </div>
      )}
    </div>
  );
}
