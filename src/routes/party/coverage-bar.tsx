import { TYPES, gm } from "~/data/types";
import { tc } from "~/lib/colors";
import type { PartyMember, TypeName } from "~/schemas";

function coveredTypes(party: readonly PartyMember[]): ReadonlySet<TypeName> {
  const covered = new Set<TypeName>();
  for (const pm of party) {
    const atkTypes: readonly TypeName[] = [...pm.types, ...(pm.moves ?? []).map((m) => m.type)];
    for (const def of TYPES) {
      if (atkTypes.some((at) => gm(at, def) >= 2)) covered.add(def);
    }
  }
  return covered;
}

export function CoverageBar({ party }: { party: readonly PartyMember[] }) {
  if (!party.length) return null;
  const covered = coveredTypes(party);
  return (
    <div
      aria-label="Type coverage"
      className="flex flex-wrap gap-1 rounded-card border border-border bg-card p-2"
    >
      {TYPES.map((t) => {
        const on = covered.has(t);
        return (
          <span
            key={t}
            className="rounded px-1.5 py-0.5 font-pixel text-[8px] tracking-wider"
            style={{
              backgroundColor: on ? tc(t) : "transparent",
              color: on ? "#fff" : "var(--color-text-3)",
              border: on ? "none" : "1px solid var(--color-border-2)",
              opacity: on ? 1 : 0.55,
            }}
          >
            {t.slice(0, 3).toUpperCase()}
          </span>
        );
      })}
    </div>
  );
}
