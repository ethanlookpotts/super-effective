import { Sprite } from "~/components/sprite";
import { TypeBadge } from "~/components/type-badge";
import type { PartyMember } from "~/schemas";

export function PartySlot({
  member,
  onEdit,
  onInfo,
}: {
  member: PartyMember;
  onEdit: () => void;
  onInfo: () => void;
}) {
  const lv = member.level;
  const moves = member.moves ?? [];
  return (
    <div
      role="group"
      aria-label={`${member.name} party slot`}
      className="relative rounded-card border border-border bg-card"
    >
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${member.name}`}
        className="flex min-h-11 w-full flex-col items-start gap-1 p-2 text-left"
      >
        <div className="flex w-full items-start gap-2">
          <Sprite
            dex={member.n}
            shiny={member.shiny}
            className="h-10 w-10 shrink-0 object-contain"
          />
          <div className="flex flex-1 flex-col gap-0.5">
            <div className="flex items-baseline gap-2">
              <span className="font-pixel text-[9px] text-text-3">
                #{String(member.n).padStart(3, "0")}
                {member.shiny ? <span className="ml-1 text-gold">✦</span> : null}
              </span>
              {lv ? <span className="font-pixel text-[9px] text-gold">Lv.{lv}</span> : null}
            </div>
            <span className="font-pixel text-[10px] text-text">{member.name}</span>
            <span className="flex gap-1">
              {member.types.map((t) => (
                <TypeBadge key={t} type={t} size="sm" />
              ))}
            </span>
          </div>
        </div>
        <div className="flex w-full flex-col gap-0.5 pl-12">
          {moves.length > 0 ? (
            moves.map((m) => (
              <span key={m.name} className="text-[10px] text-text-2">
                ▸ {m.name}
              </span>
            ))
          ) : (
            <span className="text-[9px] italic text-text-3">no moves set</span>
          )}
        </div>
      </button>
      <button
        type="button"
        onClick={onInfo}
        aria-label={`View ${member.name} details`}
        className="absolute right-1 top-1 flex min-h-11 min-w-11 items-center justify-center rounded-card border border-border-2 bg-card-2 font-pixel text-[14px] text-text-3"
      >
        ⓘ
      </button>
    </div>
  );
}

export function EmptyPartySlot({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label="Add Pokémon"
      className="flex min-h-11 w-full flex-col items-center justify-center gap-1 rounded-card border border-dashed border-border-2 bg-card-2 p-4 text-center text-text-3"
    >
      <span className="text-2xl leading-none">＋</span>
      <span className="font-pixel text-[9px]">ADD POKÉMON</span>
    </button>
  );
}
