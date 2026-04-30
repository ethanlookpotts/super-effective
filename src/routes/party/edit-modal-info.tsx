import type { PartyStats } from "~/schemas";
import type { Draft } from "./edit-modal";

const STAT_KEYS: readonly (keyof PartyStats)[] = ["hp", "atk", "def", "spatk", "spdef", "spe"];
const STAT_LABELS: Record<keyof PartyStats, string> = {
  hp: "HP",
  atk: "ATK",
  def: "DEF",
  spatk: "SpA",
  spdef: "SpD",
  spe: "SPE",
};

const ROW_INPUT =
  "min-h-11 w-full rounded-card border border-border bg-card px-3 text-base text-text outline-none";
const ROW_LABEL = "w-16 shrink-0 font-pixel text-[9px] text-text-3";

export function AdvancedInfoSection({
  draft,
  onPatch,
}: {
  draft: Draft;
  onPatch: (p: Partial<Draft>) => void;
}) {
  function patchStat(key: keyof PartyStats, raw: string) {
    const next: PartyStats = { ...(draft.stats ?? {}) };
    if (raw === "") {
      next[key] = null;
    } else {
      const n = Number.parseInt(raw, 10);
      next[key] = Number.isFinite(n) ? n : null;
    }
    onPatch({ stats: next });
  }

  return (
    <div className="flex flex-col gap-2">
      <Row label="ABILITY" htmlFor="info-ability">
        <input
          id="info-ability"
          type="text"
          value={draft.ability}
          onChange={(e) => onPatch({ ability: e.target.value })}
          placeholder="e.g. Torrent"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Ability"
          className={ROW_INPUT}
        />
      </Row>

      <Row label="ITEM" htmlFor="info-item">
        <input
          id="info-item"
          type="text"
          value={draft.item}
          onChange={(e) => onPatch({ item: e.target.value })}
          placeholder="none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Held item"
          className={ROW_INPUT}
        />
      </Row>

      <Row label="GENDER" htmlFor="info-gender">
        <select
          id="info-gender"
          value={draft.gender}
          onChange={(e) => onPatch({ gender: e.target.value as Draft["gender"] })}
          aria-label="Gender"
          className={ROW_INPUT}
        >
          <option value="">—</option>
          <option value="M">♂ Male</option>
          <option value="F">♀ Female</option>
        </select>
      </Row>

      <Row label="SHINY" htmlFor="info-shiny">
        <button
          id="info-shiny"
          type="button"
          onClick={() => onPatch({ shiny: !draft.shiny })}
          aria-pressed={draft.shiny}
          aria-label="Shiny toggle"
          className="min-h-11 rounded-card border border-border px-3 font-pixel text-[10px]"
          style={{
            backgroundColor: draft.shiny ? "var(--color-gold)" : "transparent",
            color: draft.shiny ? "black" : "var(--color-text-3)",
          }}
        >
          {draft.shiny ? "✦ YES" : "◇ NO"}
        </button>
      </Row>

      <Row label="BALL" htmlFor="info-ball">
        <input
          id="info-ball"
          type="text"
          value={draft.pokeball}
          onChange={(e) => onPatch({ pokeball: e.target.value })}
          placeholder="Poké Ball"
          autoComplete="off"
          spellCheck={false}
          aria-label="Poké Ball"
          className={ROW_INPUT}
        />
      </Row>

      <div className="flex items-center gap-2">
        <label htmlFor="info-ot" className={ROW_LABEL}>
          OT
        </label>
        <input
          id="info-ot"
          type="text"
          value={draft.otName}
          onChange={(e) => onPatch({ otName: e.target.value })}
          placeholder="Trainer name"
          autoComplete="off"
          spellCheck={false}
          aria-label="Original Trainer name"
          className={`${ROW_INPUT} flex-1`}
        />
        <input
          type="number"
          value={draft.otId}
          onChange={(e) => onPatch({ otId: e.target.value })}
          placeholder="ID"
          min={0}
          max={65535}
          inputMode="numeric"
          aria-label="Trainer ID"
          className={`${ROW_INPUT} w-20 shrink-0`}
        />
      </div>

      <div>
        <div className={`${ROW_LABEL} mb-1`}>TRAINER MEMO</div>
        <textarea
          rows={2}
          value={draft.trainerMemo}
          onChange={(e) => onPatch({ trainerMemo: e.target.value })}
          placeholder="e.g. Bold nature. Met at Lv. 5. Route 1."
          aria-label="Trainer memo"
          className={`${ROW_INPUT} resize-none py-1`}
        />
      </div>

      <div>
        <div className={`${ROW_LABEL} mb-1`}>STATS</div>
        <div className="grid grid-cols-6 gap-1">
          {STAT_KEYS.map((k) => (
            <div key={k} className="flex flex-col items-center gap-1">
              <span className="font-pixel text-[8px] text-text-3">{STAT_LABELS[k]}</span>
              <input
                type="number"
                min={1}
                max={999}
                inputMode="numeric"
                value={draft.stats?.[k] ?? ""}
                placeholder="—"
                onChange={(e) => patchStat(k, e.target.value)}
                aria-label={`${STAT_LABELS[k]} stat`}
                className={`${ROW_INPUT} text-center`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={htmlFor} className={ROW_LABEL}>
        {label}
      </label>
      <div className="flex-1">{children}</div>
    </div>
  );
}
