import { useMemo } from "react";
import { TypeBadge } from "~/components/type-badge";
import { getAbilityMod } from "~/data/abilities";
import { TYPES, dmult } from "~/data/types";
import type { TypeName } from "~/schemas";

function applyAbilityMod(m: number, atkType: TypeName, defN: number): number {
  const mod = getAbilityMod(String(defN));
  if (!mod) return m;
  if (mod.immune?.includes(atkType)) return 0;
  const resist = mod.resist?.[atkType];
  if (resist !== undefined) return m * resist;
  return m;
}

interface Group {
  cls: string;
  label: string;
  icon: string;
  types: TypeName[];
}

export function TypeMatchup({
  defenderDex,
  defenderTypes,
  onSelectType,
}: {
  defenderDex: number;
  defenderTypes: readonly TypeName[];
  onSelectType?: (atkType: TypeName) => void;
}) {
  const groups = useMemo<Group[]>(() => {
    const g: Record<string, TypeName[]> = {
      "4": [],
      "2": [],
      "0": [],
      "0.5": [],
      "0.25": [],
    };
    for (const at of TYPES) {
      const m = applyAbilityMod(dmult(at, defenderTypes), at, defenderDex);
      if (m >= 4) g["4"].push(at);
      else if (m === 2) g["2"].push(at);
      else if (m === 0) g["0"].push(at);
      else if (m <= 0.25) g["0.25"].push(at);
      else if (m === 0.5) g["0.5"].push(at);
    }
    return [
      { cls: "x4", label: "4× Weak", icon: "💥", types: g["4"] },
      { cls: "x2", label: "2× Weak", icon: "✅", types: g["2"] },
      { cls: "x0", label: "0× Immune", icon: "🚫", types: g["0"] },
      { cls: "xq", label: "¼× Resists", types: g["0.25"], icon: "🛡" },
      { cls: "xh", label: "½× Resists", types: g["0.5"], icon: "🛡" },
    ].filter((row) => row.types.length > 0);
  }, [defenderDex, defenderTypes]);

  const labelColor = (cls: string): string => {
    switch (cls) {
      case "x4":
        return "var(--color-red)";
      case "x2":
        return "var(--color-red)";
      case "x0":
        return "var(--color-text-2)";
      case "xq":
        return "var(--color-green)";
      case "xh":
        return "var(--color-green)";
      default:
        return "var(--color-text-2)";
    }
  };

  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-pixel text-xs text-text">📊 TYPE CHART — DEFENDING</h3>
      <div className="flex flex-col gap-1.5 rounded-card border border-border bg-card p-3">
        {groups.map((row) => (
          <div key={row.cls} className="flex items-start gap-2">
            <div
              className="w-16 shrink-0 font-pixel text-[10px]"
              style={{ color: labelColor(row.cls) }}
            >
              {row.icon} {row.label}
            </div>
            <div className="flex flex-wrap gap-1">
              {row.types.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-label={`${t} matchup breakdown`}
                  onClick={() => onSelectType?.(t)}
                  className="appearance-none border-0 bg-transparent p-0"
                >
                  <TypeBadge type={t} size="sm" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
