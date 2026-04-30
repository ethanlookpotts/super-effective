import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sprite } from "~/components/sprite";
import { TypeBadge } from "~/components/type-badge";
import { TM_HM, type TmHmEntry } from "~/data/moves";
import { MOVE_TUTORS, type MoveTutor, UTILITY_NPCS } from "~/data/tutors";
import { ScanButton } from "~/features/scan/scan-button";
import { ScanError, readTMCase } from "~/features/scan/vision-client";
import { useLearnsets } from "~/hooks/use-learnsets";
import { useUpdateActivePlaythrough } from "~/hooks/use-playthroughs";
import { useActivePlaythrough } from "~/hooks/use-store";
import { makePartyCalc } from "~/lib/party-calc";
import type { PartyMember } from "~/schemas";

interface TmScanSummary {
  updated: number;
  tokens: number;
  cost: number;
  error: string | null;
}

type Filter = "all" | "owned" | "missing";
type AnyEntry = TmHmEntry | MoveTutor;

const calc = makePartyCalc();

type Learners = { inParty: { pm: PartyMember }[]; inPC: { pm: PartyMember }[] };
const EMPTY_LEARNERS: Learners = { inParty: [], inPC: [] };

export function TmsRoute() {
  const active = useActivePlaythrough();
  const updatePt = useUpdateActivePlaythrough();
  const navigate = useNavigate();
  const learnsets = useLearnsets();

  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [scanBusy, setScanBusy] = useState(false);
  const [scanSummary, setScanSummary] = useState<TmScanSummary | null>(null);

  const inv = active?.tmInventory ?? {};
  const tmCount = (num: string) => inv[num] ?? 0;
  const tmOwned = (num: string) => tmCount(num) > 0;

  const setCount = (num: string, count: number) => {
    if (!active) return;
    updatePt.mutate((pt) => {
      const next = { ...(pt.tmInventory ?? {}) };
      if (count > 0) next[num] = count;
      else delete next[num];
      return { ...pt, tmInventory: next };
    });
  };

  const { tms, hms, tutors, ownedHms } = useMemo(() => {
    const q = query.toLowerCase().trim();
    const ownedNum = (num: string) => (inv[num] ?? 0) > 0;
    const matchesSearch = (t: AnyEntry) =>
      !q ||
      t.move.toLowerCase().includes(q) ||
      t.num.toLowerCase().replace(" ", "").includes(q) ||
      (t.loc || "").toLowerCase().includes(q);
    const matchesFilter = (t: AnyEntry) =>
      filter === "owned" ? ownedNum(t.num) : filter === "missing" ? !ownedNum(t.num) : true;
    return {
      tms: TM_HM.filter((t) => t.tmType === "tm" && matchesSearch(t) && matchesFilter(t)),
      hms: TM_HM.filter((t) => t.tmType === "hm" && matchesSearch(t) && matchesFilter(t)),
      tutors: MOVE_TUTORS.filter((t) => matchesSearch(t) && matchesFilter(t)),
      ownedHms: TM_HM.filter((t) => t.tmType === "hm" && ownedNum(t.num)).map((t) => t.move),
    };
  }, [query, filter, inv]);

  // Build a move-name → learners index once per (active, learnsets) so the
  // per-card lookup in render is O(1) instead of a pool-filter per card.
  const learnersByMove = useMemo(() => {
    const map: Record<string, Learners> = {};
    if (!active || !learnsets) return map;
    const allMoves = new Set<string>([
      ...TM_HM.map((t) => t.move),
      ...MOVE_TUTORS.map((t) => t.move),
    ]);
    for (const move of allMoves) {
      const inParty = active.party
        .filter((pm) => (learnsets[pm.n] ?? []).includes(move))
        .map((pm) => ({ pm }));
      const inPC = active.pc
        .filter((pm) => (learnsets[pm.n] ?? []).includes(move))
        .map((pm) => ({ pm }));
      map[move] = { inParty, inPC };
    }
    return map;
  }, [active, learnsets]);

  const carrierRanking = useMemo(() => {
    if (!active || ownedHms.length < 2 || !learnsets) return [];
    const pool = [...active.party, ...active.pc];
    if (!pool.length) return [];
    return calc
      .computeHMCarriers(pool, ownedHms, (dex, move) => (learnsets[dex] ?? []).includes(move))
      .slice(0, 3);
  }, [active, ownedHms, learnsets]);

  const toggleExpand = (num: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const openTeach = (dex: number, move: string) => {
    navigate(`/party?teach=${dex}:${encodeURIComponent(move)}`);
  };

  async function onScanFiles(files: File[], apiKey: string) {
    if (!active) return;
    setScanBusy(true);
    setScanSummary(null);
    let updated = 0;
    let inputTokens = 0;
    let outputTokens = 0;
    let error: string | null = null;
    const merged: Record<string, number> = { ...(active.tmInventory ?? {}) };
    for (const file of files) {
      try {
        const result = await readTMCase(apiKey, file);
        inputTokens += result._inputTokens;
        outputTokens += result._outputTokens;
        for (const row of result.tms) {
          const prev = merged[row.num] ?? 0;
          if (row.count > prev) {
            merged[row.num] = row.count;
            updated++;
          }
        }
      } catch (e) {
        if (e instanceof ScanError && (e.code === "no_key" || e.code === "bad_key")) {
          navigate("/settings");
          setScanBusy(false);
          return;
        }
        error = e instanceof Error ? e.message : "Scan failed";
      }
    }
    if (updated > 0) {
      updatePt.mutate((pt) => ({ ...pt, tmInventory: merged }));
    }
    const totalTokens = inputTokens + outputTokens;
    const cost = inputTokens * 0.000001 + outputTokens * 0.000005;
    setScanSummary({ updated, tokens: totalTokens, cost, error });
    setScanBusy(false);
  }

  if (!active) {
    return (
      <section>
        <h2 className="font-pixel text-sm text-text">TMs &amp; HMs</h2>
        <p className="mt-2 text-sm text-text-2">Create a playthrough to track your TM inventory.</p>
      </section>
    );
  }

  const allOwned = [...TM_HM, ...MOVE_TUTORS].filter((t) => tmOwned(t.num)).length;
  const allTotal = TM_HM.length + MOVE_TUTORS.length;
  const allMissing = allTotal - allOwned;

  return (
    <section aria-label="TMs and HMs page" className="flex flex-col">
      <div className="page-header-tms shrink-0 border-b border-border px-4 pt-3 pb-3">
        <h2 className="mb-2 font-pixel text-[9px] tracking-wider text-blue">📀 TMs &amp; HMs</h2>
        <div className="flex items-stretch gap-2">
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="sr-only">Search TMs and HMs</span>
            <input
              type="search"
              aria-label="Search TMs and HMs"
              placeholder="Move name or TM number…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-11 w-full rounded-card border border-border-2 bg-card-2 px-3 text-base text-text focus:border-blue focus:outline-none"
            />
          </label>
          <ScanButton
            label="📷 SCAN"
            ariaLabel="Scan TM Case"
            busy={scanBusy}
            onFiles={onScanFiles}
            className="min-h-11 shrink-0 rounded-card border border-[color-mix(in_srgb,var(--color-gold)_25%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_7%,transparent)] px-3 font-pixel text-[10px] text-gold disabled:opacity-50"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {scanSummary && <TmScanSummaryRow summary={scanSummary} />}

        <div
          role="group"
          aria-label="Filter by ownership"
          className="flex gap-2 rounded-card border border-border bg-card p-1"
        >
          {(["all", "owned", "missing"] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`min-h-11 flex-1 rounded-card px-2 text-xs ${
                filter === f ? "bg-card-2 text-text" : "text-text-2"
              }`}
            >
              {f.toUpperCase()}{" "}
              <span className="ml-1 text-text-3">
                {f === "all" ? allTotal : f === "owned" ? allOwned : allMissing}
              </span>
            </button>
          ))}
        </div>

        {carrierRanking.length > 0 && (
          <div
            aria-label="Recommended HM Carrier"
            className="rounded-card border border-gold bg-card p-3"
          >
            <div className="font-pixel text-xs text-gold">
              🎒 HM CARRIER — BEST FIELD-MOVE HOLDERS
            </div>
            <div className="mt-1 text-[10px] text-text-3">
              Keep a utility mon for HMs so your battlers don't burn moveslots.
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {carrierRanking.map((c, i) => (
                <div
                  key={`${c.pm.n}-${i}`}
                  className="flex items-center gap-2 rounded-card bg-card-2 p-2"
                >
                  <span className="w-6 text-[10px] font-pixel text-text-3">#{i + 1}</span>
                  <Sprite dex={c.pm.n} className="h-8 w-8" />
                  <div className="flex-1">
                    <div className="text-sm text-text">{c.pm.name}</div>
                    <div className="text-[10px] text-text-3">
                      CARRIES {c.hmsLearnable}/{ownedHms.length} HMs
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tms.length === 0 && hms.length === 0 && tutors.length === 0 ? (
          <div className="p-4 text-center text-sm text-text-2">
            <div className="text-2xl">📀</div>
            NO RESULTS
          </div>
        ) : (
          <>
            {tms.length > 0 && (
              <Section label={`TMs (${tms.length})`}>
                {tms.map((t) => (
                  <TmCard
                    key={t.num}
                    entry={t}
                    count={tmCount(t.num)}
                    owned={tmOwned(t.num)}
                    expanded={expanded.has(t.num)}
                    onToggleExpand={toggleExpand}
                    onSetCount={setCount}
                    learners={learnersByMove[t.move] ?? EMPTY_LEARNERS}
                    onOpenTeach={openTeach}
                  />
                ))}
              </Section>
            )}
            {hms.length > 0 && (
              <Section label={`HMs (${hms.length})`}>
                {hms.map((t) => (
                  <TmCard
                    key={t.num}
                    entry={t}
                    count={tmCount(t.num)}
                    owned={tmOwned(t.num)}
                    expanded={expanded.has(t.num)}
                    onToggleExpand={toggleExpand}
                    onSetCount={setCount}
                    learners={learnersByMove[t.move] ?? EMPTY_LEARNERS}
                    onOpenTeach={openTeach}
                  />
                ))}
              </Section>
            )}
            {tutors.length > 0 && (
              <Section label={`MOVE TUTORS (${tutors.length})`}>
                {tutors.map((t) => (
                  <TmCard
                    key={t.num}
                    entry={t}
                    count={tmCount(t.num)}
                    owned={tmOwned(t.num)}
                    expanded={expanded.has(t.num)}
                    onToggleExpand={toggleExpand}
                    onSetCount={setCount}
                    learners={learnersByMove[t.move] ?? EMPTY_LEARNERS}
                    onOpenTeach={openTeach}
                  />
                ))}
              </Section>
            )}
          </>
        )}

        <Section label="UTILITY NPCs">
          {UTILITY_NPCS.map((u) => (
            <div key={u.label} className="rounded-card border border-border bg-card p-3">
              <div className="font-pixel text-xs text-text">{u.label}</div>
              <div className="mt-1 text-[10px] text-text-3">{u.loc}</div>
              <div className="mt-1 text-xs text-text-2">
                <span className="text-gold">{u.cost}</span> · {u.note}
              </div>
            </div>
          ))}
        </Section>
      </div>
    </section>
  );
}

function TmScanSummaryRow({ summary }: { summary: TmScanSummary }) {
  const costStr = summary.cost < 0.0001 ? "<$0.0001" : `~$${summary.cost.toFixed(4)}`;
  const message = summary.error
    ? summary.error
    : summary.updated > 0
      ? `Scanned: ${summary.updated} entries updated`
      : "No TMs recognised";
  return (
    <div
      role={summary.error ? "alert" : "status"}
      aria-label="TM scan result"
      className={`rounded-card border px-3 py-2 text-xs ${
        summary.error
          ? "border-red text-red"
          : "border-[color-mix(in_srgb,var(--color-gold)_25%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_5%,transparent)] text-text"
      }`}
    >
      <div>{message}</div>
      {!summary.error && summary.tokens > 0 && (
        <div className="mt-1 font-pixel text-[9px] text-text-3">
          {summary.tokens} tok · {costStr} ·{" "}
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

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="font-pixel text-[10px] text-text-3">{label}</div>
      {children}
    </div>
  );
}

function TmCard({
  entry,
  count,
  owned,
  expanded,
  onToggleExpand,
  onSetCount,
  learners,
  onOpenTeach,
}: {
  entry: AnyEntry;
  count: number;
  owned: boolean;
  expanded: boolean;
  onToggleExpand: (num: string) => void;
  onSetCount: (num: string, count: number) => void;
  learners: { inParty: { pm: PartyMember }[]; inPC: { pm: PartyMember }[] };
  onOpenTeach: (dex: number, move: string) => void;
}) {
  const learnersCount = learners.inParty.length + learners.inPC.length;
  return (
    <div
      role="listitem"
      aria-label={`${entry.num} ${entry.move}`}
      className={`rounded-card border border-border bg-card p-3 ${
        owned ? "bg-[color-mix(in_srgb,var(--color-green)_12%,var(--color-card))]" : ""
      } ${entry.tmType === "tutor" && owned ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-2">
        <span className="w-12 font-pixel text-[10px] text-text-3">{entry.num}</span>
        <span className="flex-1 text-sm text-text">{entry.move}</span>
        <TypeBadge type={entry.type} size="sm" />
        {entry.tmType === "tm" ? (
          <div
            role="group"
            aria-label={`${entry.num} inventory`}
            className="flex items-center gap-1"
          >
            <button
              type="button"
              aria-label={`Decrease ${entry.num}`}
              disabled={count === 0}
              onClick={() => onSetCount(entry.num, Math.max(0, count - 1))}
              className="min-h-11 w-8 rounded-full bg-card-2 text-text disabled:opacity-30"
            >
              −
            </button>
            <span
              aria-label={`Owned: ${count}`}
              className={`w-6 text-center text-sm ${owned ? "text-green" : "text-text-3"}`}
            >
              {count}
            </span>
            <button
              type="button"
              aria-label={`Increase ${entry.num}`}
              onClick={() => onSetCount(entry.num, count + 1)}
              className="min-h-11 w-8 rounded-full bg-card-2 text-text"
            >
              +
            </button>
          </div>
        ) : (
          <button
            type="button"
            aria-pressed={owned}
            aria-label={
              entry.tmType === "hm"
                ? `${owned ? "Have" : "Need"} ${entry.num}`
                : `${owned ? "Taught" : "Not taught"} ${entry.move} tutor`
            }
            onClick={() => onSetCount(entry.num, owned ? 0 : 1)}
            className={`min-h-11 rounded-card border px-3 text-xs ${
              owned ? "border-green text-green" : "border-border text-text-2"
            }`}
          >
            {entry.tmType === "hm" ? (owned ? "✓ HAVE" : "+ HAVE") : owned ? "✓ TAUGHT" : "○ TEACH"}
          </button>
        )}
      </div>
      <div className="mt-1 pl-14 text-[10px] text-text-3">{entry.loc}</div>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => onToggleExpand(entry.num)}
        className="mt-2 min-h-11 w-full rounded-card bg-card-2 px-3 text-left text-[10px] font-pixel text-text-2"
      >
        {expanded ? "▾" : "▶"} WHO CAN LEARN <span className="text-gold">{learnersCount}</span>
      </button>
      {expanded && (
        <div
          role="region"
          aria-label={`Learners for ${entry.move}`}
          className="mt-2 flex flex-col gap-2"
        >
          {learnersCount === 0 ? (
            <div className="text-[10px] text-text-3">
              No current party or PC member can learn this move.
            </div>
          ) : (
            <>
              {learners.inParty.length > 0 && (
                <LearnerGroup
                  label="IN PARTY"
                  list={learners.inParty.map((e) => e.pm)}
                  onPick={(pm) => onOpenTeach(pm.n, entry.move)}
                />
              )}
              {learners.inPC.length > 0 && (
                <LearnerGroup
                  label="IN PC"
                  list={learners.inPC.map((e) => e.pm)}
                  onPick={(pm) => onOpenTeach(pm.n, entry.move)}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function LearnerGroup({
  label,
  list,
  onPick,
}: {
  label: string;
  list: readonly PartyMember[];
  onPick: (pm: PartyMember) => void;
}) {
  return (
    <div>
      <div className="mb-1 text-[9px] font-pixel text-text-3">{label}</div>
      <div className="flex flex-wrap gap-1">
        {list.map((pm, i) => (
          <button
            key={`${pm.n}-${i}`}
            type="button"
            onClick={() => onPick(pm)}
            className="flex min-h-11 items-center gap-1 rounded-full bg-card-2 p-1 pr-3"
          >
            <Sprite dex={pm.n} className="h-8 w-8" />
            <span className="text-xs text-text">{pm.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
