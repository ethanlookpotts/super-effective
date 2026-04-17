import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { TypeBadge } from "~/components/type-badge";
import { POKEMON, getObtain } from "~/data/pokemon";
import { TYPES } from "~/data/types";
import { useUpdateActivePlaythrough } from "~/hooks/use-playthroughs";
import { useActivePlaythrough } from "~/hooks/use-store";
import type { PartyMember, RecentPokemon, TypeName } from "~/schemas";
import { MoveDetail } from "./search/move-detail";
import { PokeDetail, pokeByDex } from "./search/poke-detail";
import { SearchInput, type SearchPick } from "./search/search-input";
import { TypeFilter } from "./search/type-filter";

function isTypeName(s: string): s is TypeName {
  return (TYPES as readonly string[]).includes(s);
}

export function SearchRoute() {
  const active = useActivePlaythrough();
  const gameId = active?.gameId ?? "frlg-fr";
  const party = active?.party ?? [];
  const recents = active?.recents ?? [];

  const [params, setParams] = useSearchParams();
  const updatePt = useUpdateActivePlaythrough();

  const dexParam = params.get("n");
  const moveParam = params.get("m");
  const typeParam = params.get("type");

  const activeDex = dexParam ? Number(dexParam) : null;
  const activeMove = moveParam ?? null;
  const activeType: TypeName | null =
    typeParam && isTypeName(typeParam) ? (typeParam as TypeName) : null;

  const activePoke = useMemo(
    () => (activeDex !== null ? (pokeByDex(activeDex) ?? null) : null),
    [activeDex],
  );

  const [query, setQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Reset scroll when the selection changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll only resets when the view switches
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [activeDex, activeMove, activeType]);

  // Keep the input value synced with the currently selected Pokémon / move.
  useEffect(() => {
    if (activePoke) setQuery(activePoke.name);
    else if (activeMove) setQuery(activeMove);
    else setQuery("");
  }, [activePoke, activeMove]);

  // Persist recent picks when the user opens a Pokémon.
  const lastRecentRef = useRef<number | null>(null);
  useEffect(() => {
    if (!active || !activePoke) return;
    if (lastRecentRef.current === activePoke.n) return;
    lastRecentRef.current = activePoke.n;
    const poke = activePoke;
    updatePt.mutate((pt) => {
      const filtered = pt.recents.filter((r) => r.n !== poke.n);
      const entry: RecentPokemon = {
        n: poke.n,
        name: poke.name,
        types: [...poke.types],
      };
      const next = [entry, ...filtered].slice(0, 6);
      return { ...pt, recents: next };
    });
  }, [active, activePoke, updatePt]);

  const goPoke = useCallback(
    (n: number) => {
      setParams({ n: String(n) });
    },
    [setParams],
  );

  const goMove = useCallback(
    (name: string) => {
      setParams({ m: name });
    },
    [setParams],
  );

  const clearAll = useCallback(() => {
    setParams({});
  }, [setParams]);

  const toggleType = useCallback(
    (t: TypeName) => {
      if (activeType === t) {
        setParams({});
      } else {
        setParams({ type: t });
      }
    },
    [activeType, setParams],
  );

  const handlePick = useCallback(
    (pick: SearchPick) => {
      if (pick.kind === "pokemon") goPoke(pick.dex);
      else goMove(pick.name);
    },
    [goPoke, goMove],
  );

  // Add-to-party with simple confirm when the party is full.
  const handleAddToParty = useCallback(
    (n: number) => {
      if (!active) return;
      const poke = pokeByDex(n);
      if (!poke) return;
      if (active.party.length >= 6) {
        // Simple confirm-and-swap: replace the last member.
        const confirm = window.confirm(
          `Party is full. Replace ${active.party[active.party.length - 1].name} with ${poke.name}?`,
        );
        if (!confirm) return;
        updatePt.mutate((pt) => {
          const next: PartyMember[] = pt.party.slice(0, -1);
          next.push({
            n: poke.n,
            name: poke.name,
            types: [...poke.types],
            moves: [],
          });
          return { ...pt, party: next };
        });
        return;
      }
      updatePt.mutate((pt) => ({
        ...pt,
        party: [
          ...pt.party,
          {
            n: poke.n,
            name: poke.name,
            types: [...poke.types],
            moves: [],
          },
        ],
      }));
    },
    [active, updatePt],
  );

  // Evolve a party member to a target dex.
  const handleEvolve = useCallback(
    (memberDex: number, targetDex: number) => {
      const tp = pokeByDex(targetDex);
      if (!tp) return;
      updatePt.mutate((pt) => ({
        ...pt,
        party: pt.party.map((pm) =>
          pm.n === memberDex ? { ...pm, n: tp.n, name: tp.name, types: [...tp.types] } : pm,
        ),
      }));
    },
    [updatePt],
  );

  return (
    <section role="region" aria-label="Search page" className="flex min-h-full flex-col gap-3">
      <SearchInput
        value={query}
        onChangeValue={setQuery}
        onPick={handlePick}
        onClear={() => {
          setQuery("");
          clearAll();
        }}
      />

      <TypeFilter active={activeType} onToggle={toggleType} />

      <div
        id="s-scroll"
        ref={scrollRef}
        role="region"
        aria-label="Search content"
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {activeMove ? (
          <MoveDetail moveName={activeMove} onPickPoke={goPoke} />
        ) : activePoke ? (
          <PokeDetail
            poke={activePoke}
            gameId={gameId}
            party={party}
            onPick={goPoke}
            onAddToParty={handleAddToParty}
            onEvolve={handleEvolve}
          />
        ) : (
          <DefaultView recents={recents} activeType={activeType} gameId={gameId} onPick={goPoke} />
        )}
      </div>
    </section>
  );
}

function DefaultView({
  recents,
  activeType,
  gameId,
  onPick,
}: {
  recents: readonly RecentPokemon[];
  activeType: TypeName | null;
  gameId: string;
  onPick: (n: number) => void;
}) {
  const filtered = useMemo(
    () => (activeType ? POKEMON.filter((p) => p.types.includes(activeType)) : []),
    [activeType],
  );

  return (
    <div className="flex flex-col gap-3">
      {recents.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="font-[var(--font-pixel)] text-[10px] text-[var(--color-text-3)]">
            RECENT
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recents.slice(0, 6).map((r) => (
              <button
                key={r.n}
                type="button"
                aria-label={`Recent ${r.name}`}
                onClick={() => onPick(r.n)}
                className="min-h-11 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-1 text-xs text-[var(--color-text)]"
              >
                {r.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {activeType ? (
        <section className="flex flex-col gap-2">
          <div className="font-[var(--font-pixel)] text-[10px] text-[var(--color-text-3)]">
            {activeType.toUpperCase()} TYPE ({filtered.length})
          </div>
          <div className="flex flex-col gap-1.5">
            {filtered.map((p) => {
              const first = getObtain(p.n, gameId)[0] ?? "";
              const short = first.length > 42 ? `${first.slice(0, 42)}…` : first;
              return (
                <button
                  key={p.n}
                  type="button"
                  aria-label={`View ${p.name}`}
                  onClick={() => onPick(p.n)}
                  className="flex min-h-11 w-full items-center gap-2 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-2 text-left"
                >
                  <span className="flex-1">
                    <span className="block text-sm text-[var(--color-text)]">{p.name}</span>
                    <span className="block text-[10px] text-[var(--color-text-3)]">{short}</span>
                  </span>
                  <span className="flex gap-1">
                    {p.types.map((t) => (
                      <TypeBadge key={t} type={t} size="sm" />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : recents.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-card-2)] p-6 text-center">
          <div className="text-2xl">🔍</div>
          <p className="mt-2 font-[var(--font-pixel)] text-[10px] text-[var(--color-text-3)]">
            SEARCH BY NAME ABOVE
            <br />
            OR TAP A TYPE TO BROWSE
          </p>
        </div>
      ) : (
        <p className="text-center font-[var(--font-pixel)] text-[9px] leading-relaxed text-[var(--color-text-3)]">
          TAP A TYPE PILL TO BROWSE ALL POKEMON OF THAT TYPE
        </p>
      )}
    </div>
  );
}
