import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BreakdownOverlay, type BreakdownTarget } from "~/components/breakdown-overlay";
import { TypeBadge } from "~/components/type-badge";
import { POKEMON, getObtain } from "~/data/pokemon";
import { TYPES } from "~/data/types";
import { useUpdateActivePlaythrough } from "~/hooks/use-playthroughs";
import { useActivePlaythrough } from "~/hooks/use-store";
import { matchupBreakdown } from "~/lib/damage";
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
  const pc = active?.pc ?? [];
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

  const activePoke = activeDex !== null ? (pokeByDex(activeDex) ?? null) : null;

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

  function goPoke(n: number) {
    setParams({ n: String(n) });
  }

  function goMove(name: string) {
    setParams({ m: name });
  }

  function clearAll() {
    setParams({});
  }

  function toggleType(t: TypeName) {
    setParams(activeType === t ? {} : { type: t });
  }

  function handlePick(pick: SearchPick) {
    if (pick.kind === "pokemon") goPoke(pick.dex);
    else goMove(pick.name);
  }

  function newMemberFromPoke(poke: {
    n: number;
    name: string;
    types: readonly TypeName[];
  }): PartyMember {
    return { n: poke.n, name: poke.name, types: [...poke.types], moves: [] };
  }

  function handleAddToParty(n: number) {
    if (!active) return;
    const poke = pokeByDex(n);
    if (!poke) return;
    if (active.party.length >= 6) {
      const confirm = window.confirm(
        `Party is full. Replace ${active.party[active.party.length - 1].name} with ${poke.name}?`,
      );
      if (!confirm) return;
      updatePt.mutate((pt) => ({
        ...pt,
        party: [...pt.party.slice(0, -1), newMemberFromPoke(poke)],
      }));
      return;
    }
    updatePt.mutate((pt) => ({ ...pt, party: [...pt.party, newMemberFromPoke(poke)] }));
  }

  function handleAddToPC(n: number) {
    if (!active) return;
    const poke = pokeByDex(n);
    if (!poke) return;
    if (active.pc.some((pm) => pm.n === n)) return;
    updatePt.mutate((pt) => ({ ...pt, pc: [...pt.pc, newMemberFromPoke(poke)] }));
  }

  function handleEvolve(memberDex: number, targetDex: number) {
    const tp = pokeByDex(targetDex);
    if (!tp) return;
    updatePt.mutate((pt) => ({
      ...pt,
      party: pt.party.map((pm) =>
        pm.n === memberDex ? { ...pm, n: tp.n, name: tp.name, types: [...tp.types] } : pm,
      ),
    }));
  }

  const [breakdown, setBreakdown] = useState<BreakdownTarget | null>(null);
  function openTypeBreakdown(atkType: string) {
    if (!activePoke || !isTypeName(atkType)) return;
    setBreakdown({
      kind: "matchup",
      data: matchupBreakdown(atkType as TypeName, activePoke),
    });
  }

  return (
    <section aria-label="Search page" className="flex min-h-full flex-col">
      <div className="page-header-search shrink-0 border-b border-border px-4 pt-3 pb-1">
        <h2 className="mb-2 font-pixel text-[9px] tracking-wider text-red">🔍 SEARCH</h2>
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
      </div>

      <div
        id="s-scroll"
        ref={scrollRef}
        role="region"
        aria-label="Search content"
        className="min-h-0 flex-1 overflow-y-auto p-4"
      >
        {activeMove ? (
          <MoveDetail moveName={activeMove} onPickPoke={goPoke} />
        ) : activePoke ? (
          <PokeDetail
            poke={activePoke}
            gameId={gameId}
            party={party}
            pc={pc}
            onPick={goPoke}
            onAddToParty={handleAddToParty}
            onAddToPC={handleAddToPC}
            onEvolve={handleEvolve}
            onBreakdown={openTypeBreakdown}
          />
        ) : (
          <DefaultView recents={recents} activeType={activeType} gameId={gameId} onPick={goPoke} />
        )}
      </div>

      <BreakdownOverlay target={breakdown} onClose={() => setBreakdown(null)} />
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
          <div className="font-pixel text-[10px] text-text-3">RECENT</div>
          <div className="flex flex-wrap gap-1.5">
            {recents.slice(0, 6).map((r) => (
              <button
                key={r.n}
                type="button"
                aria-label={`Recent ${r.name}`}
                onClick={() => onPick(r.n)}
                className="min-h-11 rounded-card border border-border bg-card px-2 py-1 text-xs text-text"
              >
                {r.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {activeType ? (
        <section className="flex flex-col gap-2">
          <div className="font-pixel text-[10px] text-text-3">
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
                  className="flex min-h-11 w-full items-center gap-2 rounded-card border border-border bg-card p-2 text-left"
                >
                  <span className="flex-1">
                    <span className="block text-sm text-text">{p.name}</span>
                    <span className="block text-[10px] text-text-3">{short}</span>
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
        <div className="rounded-card border border-dashed border-border bg-card-2 p-6 text-center">
          <div className="text-2xl">🔍</div>
          <p className="mt-2 font-pixel text-[10px] text-text-3">
            SEARCH BY NAME ABOVE
            <br />
            OR TAP A TYPE TO BROWSE
          </p>
        </div>
      ) : (
        <p className="text-center font-pixel text-[9px] leading-relaxed text-text-3">
          TAP A TYPE PILL TO BROWSE ALL POKEMON OF THAT TYPE
        </p>
      )}
    </div>
  );
}
