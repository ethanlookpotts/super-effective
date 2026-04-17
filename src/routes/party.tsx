import { useActivePlaythrough } from "~/hooks/use-store";

export function PartyRoute() {
  const active = useActivePlaythrough();
  return (
    <section>
      <h2 className="font-[var(--font-pixel)] text-sm text-[var(--color-text)]">PARTY</h2>
      <p className="mt-2 text-sm text-[var(--color-text-2)]">
        {active
          ? `Active playthrough: ${active.name} (${active.party.length} party, ${active.pc.length} PC)`
          : "No active playthrough yet. Create one from the playthrough menu."}
      </p>
    </section>
  );
}
