import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LOCATIONS, type Location } from "~/data/locations";

export function WhereAmIRoute() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const q = query.toLowerCase().trim();
  const list = useMemo(() => filterLocations(LOCATIONS, q), [q]);

  function goSearch(name: string) {
    navigate(`/search?q=${encodeURIComponent(name)}`);
  }

  return (
    <section aria-label="Where Am I page" className="flex flex-col">
      <div className="page-header-loc shrink-0 border-b border-border px-4 pt-3 pb-3">
        <h2 className="mb-2 font-pixel text-[9px] tracking-wider text-green">🗺 WHERE AM I?</h2>
        <label className="flex flex-col gap-1">
          <span className="sr-only">Filter locations</span>
          <input
            type="search"
            aria-label="Filter locations"
            placeholder="Location or Pokémon name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-11 rounded-card border border-border-2 bg-card-2 px-3 text-base text-text focus:border-green focus:outline-none"
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {list.length === 0 ? (
          <div className="p-4 text-center text-sm text-text-2">
            <div className="text-2xl">🗺️</div>
            NO RESULTS
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {list.map((loc, i) => {
              const open = q ? true : openIdx === i;
              return (
                <li
                  key={loc.name}
                  className="overflow-hidden rounded-card border border-border bg-card"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIdx(open ? null : i)}
                    aria-expanded={open}
                    className="flex min-h-11 w-full items-center justify-between px-3 py-2 text-left"
                  >
                    <span className="text-sm text-text">{loc.name}</span>
                    <span className={`text-text-3 ${open ? "rotate-180" : ""}`}>▾</span>
                  </button>
                  {open && (
                    <div className="flex flex-col gap-2 border-t border-border p-3">
                      {loc.methods.map((m) => (
                        <div key={m.label}>
                          <div className="mb-1 text-[10px] font-pixel text-text-3">{m.label}</div>
                          <div className="flex flex-wrap gap-1">
                            {m.p.map((name) => (
                              <button
                                key={name}
                                type="button"
                                onClick={() => goSearch(name)}
                                className="min-h-11 rounded-full bg-card-2 px-3 text-xs text-text"
                              >
                                {name}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function filterLocations(all: readonly Location[], q: string): readonly Location[] {
  if (!q) return all;
  return all.filter(
    (l) =>
      l.name.toLowerCase().includes(q) ||
      l.methods.some((m) => m.p.some((p) => p.toLowerCase().includes(q))),
  );
}
