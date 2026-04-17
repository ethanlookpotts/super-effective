import { Sprite } from "~/components/sprite";
import { TypeBadge } from "~/components/type-badge";
import { getAbilityMod } from "~/data/abilities";
import { POKEMON, type Pokemon, getObtain } from "~/data/pokemon";
import { STATS } from "~/data/stats";
import type { PartyMember } from "~/schemas";
import { EvolutionChain } from "./evolution-chain";
import { PartyMatchupList } from "./party-matchup";
import { StatBars } from "./stat-bars";
import { TypeMatchup } from "./type-matchup";

export function PokeDetail({
  poke,
  gameId,
  party,
  pc,
  onPick,
  onAddToParty,
  onAddToPC,
  onEvolve,
  onBreakdown,
}: {
  poke: Pokemon;
  gameId: string;
  party: readonly PartyMember[];
  pc: readonly PartyMember[];
  onPick: (dex: number) => void;
  onAddToParty: (dex: number) => void;
  onAddToPC: (dex: number) => void;
  onEvolve: (memberDex: number, targetDex: number) => void;
  onBreakdown?: (atkType: string) => void;
}) {
  const obtain = getObtain(poke.n, gameId);
  const stats = STATS[poke.n];
  const inParty = party.some((pm) => pm.n === poke.n);
  const inPC = pc.some((pm) => pm.n === poke.n);
  const abilityMod = getAbilityMod(String(poke.n));

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-card border border-border bg-card p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="font-pixel text-[10px] text-text-3">
              #{String(poke.n).padStart(3, "0")}
            </span>
            <h2 className="font-pixel text-base text-text">{poke.name}</h2>
            <div className="mt-1 flex gap-1">
              {poke.types.map((t) => (
                <TypeBadge key={t} type={t} />
              ))}
            </div>
          </div>
          <Sprite dex={poke.n} art className="h-24 w-24 shrink-0 object-contain opacity-90" />
        </div>

        <div className="mt-3 border-t border-border pt-3">
          <div className="font-pixel text-[10px] text-text-3">HOW TO OBTAIN</div>
          <ul className="mt-1 flex flex-col gap-1">
            {obtain.map((o, i) => (
              <li
                // biome-ignore lint/suspicious/noArrayIndexKey: obtain strings are free-form and may repeat
                key={`${o}-${i}`}
                className="text-xs text-text-2"
              >
                {o}
              </li>
            ))}
          </ul>
          {abilityMod && (
            <>
              <div className="mt-2 font-pixel text-[10px] text-text-3">ABILITY</div>
              <div className="text-xs font-semibold text-gold">
                {abilityMod.name}
                {abilityMod.multi && <span className="ml-1 text-text-3"> (may vary)</span>}
              </div>
            </>
          )}
          <div className="mt-3">
            <EvolutionChain dex={poke.n} party={party} onPick={onPick} onEvolve={onEvolve} />
          </div>
        </div>
      </div>

      {stats && <StatBars stats={stats} />}

      <TypeMatchup defenderDex={poke.n} defenderTypes={poke.types} onSelectType={onBreakdown} />

      <div className="flex flex-col gap-2">
        {inParty ? (
          <button
            type="button"
            aria-label={`${poke.name} in party`}
            className="min-h-11 rounded-card border border-green bg-card-2 px-3 py-2 font-pixel text-[10px] text-green"
            disabled
          >
            ✓ IN PARTY
          </button>
        ) : (
          <button
            type="button"
            aria-label={`Add ${poke.name} to party`}
            onClick={() => onAddToParty(poke.n)}
            className="min-h-11 rounded-card border border-gold bg-gold/10 px-3 py-2 font-pixel text-[10px] text-gold"
          >
            ➕ ADD TO PARTY
          </button>
        )}
        {inPC ? (
          <button
            type="button"
            aria-label={`${poke.name} in PC box`}
            className="min-h-11 rounded-card border border-border bg-card-2 px-3 py-2 font-pixel text-[10px] text-text-3"
            disabled
          >
            📦 IN PC BOX
          </button>
        ) : (
          <button
            type="button"
            aria-label={`Send ${poke.name} to PC`}
            onClick={() => onAddToPC(poke.n)}
            className="min-h-11 rounded-card border border-border bg-card-2 px-3 py-2 font-pixel text-[10px] text-text"
          >
            📦 SEND TO PC
          </button>
        )}
      </div>

      <PartyMatchupList enemyDex={poke.n} enemyTypes={poke.types} party={party} />
    </div>
  );
}

/** Look up by dex number from the POKEMON array. */
export function pokeByDex(n: number): Pokemon | undefined {
  return POKEMON.find((p) => p.n === n);
}
