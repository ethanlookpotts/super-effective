import type { PartyMember } from "~/schemas";
import { EmptyPartySlot, PartySlot } from "./party-slot";

export const PARTY_MAX = 6;

const SLOT_IDS = ["slot-0", "slot-1", "slot-2", "slot-3", "slot-4", "slot-5"] as const;

export function PartyGrid({
  party,
  onEdit,
  onAdd,
}: {
  party: readonly PartyMember[];
  onEdit: (idx: number) => void;
  onAdd: () => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {SLOT_IDS.map((id, i) => {
        const pm = party[i];
        if (pm) return <PartySlot key={id} member={pm} onEdit={() => onEdit(i)} />;
        return <EmptyPartySlot key={id} onAdd={onAdd} />;
      })}
    </div>
  );
}
