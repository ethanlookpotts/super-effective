import { EVOS } from "~/data/evos";
import { POKEMON } from "~/data/pokemon";
import type { PartyMember } from "~/schemas";

interface EvoNode {
  n: number;
  cond?: string;
}

/** Walk EVOS from the root of the chain and produce a rendering structure. */
function chainRoot(dex: number): number {
  let root = dex;
  while (EVOS[root]?.from !== undefined) {
    const prev = EVOS[root]?.from;
    if (prev === undefined) break;
    root = prev;
  }
  return root;
}

function hasBranches(root: number): boolean {
  const intos = EVOS[root]?.into;
  if (!intos) return false;
  return intos.length > 1;
}

/** Linear chain as [{n}, {n, cond}, ...]. Works when each stage has ≤1 evolution. */
function linearChain(root: number): EvoNode[] {
  const out: EvoNode[] = [{ n: root }];
  let cur = root;
  while (true) {
    const nextList = EVOS[cur]?.into;
    if (!nextList || nextList.length === 0) break;
    const next = nextList[0];
    out.push({ n: next.n, cond: next.c });
    cur = next.n;
  }
  return out;
}

function nameFor(n: number): string {
  return POKEMON.find((p) => p.n === n)?.name ?? `#${n}`;
}

export function EvolutionChain({
  dex,
  party,
  onPick,
  onEvolve,
}: {
  dex: number;
  party: readonly PartyMember[];
  onPick: (n: number) => void;
  onEvolve: (memberDex: number, targetDex: number) => void;
}) {
  if (!EVOS[dex]) return null;
  const root = chainRoot(dex);
  const branching = hasBranches(root);

  const allNums = new Set<number>();
  const collect = (n: number) => {
    allNums.add(n);
    const into = EVOS[n]?.into;
    if (!into) return;
    for (const link of into) collect(link.n);
  };
  collect(root);

  return (
    <section className="flex flex-col gap-2">
      <div className="font-[var(--font-pixel)] text-[10px] text-[var(--color-text-3)]">
        EVOLUTION CHAIN
      </div>

      {branching ? (
        <BranchView root={root} currentDex={dex} onPick={onPick} />
      ) : (
        <LinearView chain={linearChain(root)} currentDex={dex} onPick={onPick} />
      )}

      <EvolveButtons party={party} allNums={allNums} onEvolve={onEvolve} />
    </section>
  );
}

function LinearView({
  chain,
  currentDex,
  onPick,
}: {
  chain: EvoNode[];
  currentDex: number;
  onPick: (n: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chain.map((stage, i) => (
        <div key={stage.n} className="flex items-center gap-1.5">
          {i > 0 && (
            <div className="flex items-center gap-1 text-[var(--color-text-3)]">
              <span>→</span>
              {stage.cond && (
                <span className="rounded bg-[var(--color-card-2)] px-1.5 py-0.5 text-[10px]">
                  {stage.cond}
                </span>
              )}
            </div>
          )}
          <StageButton n={stage.n} current={stage.n === currentDex} onPick={onPick} />
        </div>
      ))}
    </div>
  );
}

function BranchView({
  root,
  currentDex,
  onPick,
}: {
  root: number;
  currentDex: number;
  onPick: (n: number) => void;
}) {
  const intos = EVOS[root]?.into ?? [];
  return (
    <div className="flex items-start gap-2">
      <StageButton n={root} current={root === currentDex} onPick={onPick} />
      <span className="mt-2 text-[var(--color-text-3)]">→</span>
      <div className="flex flex-col gap-1.5">
        {intos.map((link) => (
          <div key={link.n} className="flex items-center gap-1.5">
            <StageButton n={link.n} current={link.n === currentDex} onPick={onPick} />
            <span className="rounded bg-[var(--color-card-2)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-3)]">
              {link.c}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StageButton({
  n,
  current,
  onPick,
}: {
  n: number;
  current: boolean;
  onPick: (n: number) => void;
}) {
  const name = nameFor(n);
  return (
    <button
      type="button"
      aria-label={`View ${name}`}
      onClick={() => onPick(n)}
      className={`flex min-h-11 flex-col items-start rounded-[var(--radius-card)] border px-2 py-1 text-left ${
        current
          ? "border-[var(--color-gold)] bg-[var(--color-card-2)]"
          : "border-[var(--color-border)] bg-[var(--color-card)]"
      }`}
    >
      <span className="text-xs text-[var(--color-text)]">{name}</span>
      <span className="font-[var(--font-pixel)] text-[9px] text-[var(--color-text-3)]">
        #{String(n).padStart(3, "0")}
      </span>
    </button>
  );
}

function EvolveButtons({
  party,
  allNums,
  onEvolve,
}: {
  party: readonly PartyMember[];
  allNums: Set<number>;
  onEvolve: (memberDex: number, targetDex: number) => void;
}) {
  const buttons: { memberDex: number; targetDex: number; label: string; cond: string }[] = [];
  for (const pm of party) {
    if (!allNums.has(pm.n)) continue;
    const into = EVOS[pm.n]?.into;
    if (!into) continue;
    for (const link of into) {
      const targetName = nameFor(link.n);
      buttons.push({
        memberDex: pm.n,
        targetDex: link.n,
        label: `EVOLVE ${pm.name} → ${targetName}`,
        cond: link.c,
      });
    }
  }
  if (buttons.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      {buttons.map((b) => (
        <button
          key={`${b.memberDex}-${b.targetDex}`}
          type="button"
          aria-label={b.label}
          onClick={() => onEvolve(b.memberDex, b.targetDex)}
          className="flex min-h-11 items-center justify-between gap-2 rounded-[var(--radius-card)] border border-[var(--color-gold)] bg-[var(--color-card-2)] px-3 py-2 text-left"
        >
          <span className="font-[var(--font-pixel)] text-[10px] text-[var(--color-gold)]">
            {b.label}
          </span>
          <span className="rounded bg-[var(--color-card)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-2)]">
            {b.cond}
          </span>
        </button>
      ))}
    </div>
  );
}
