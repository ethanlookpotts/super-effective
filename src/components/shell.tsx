import { type ReactNode, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { gameName } from "~/data/games";
import { useSyncContext } from "~/features/sync/sync-context";
import { useActivePlaythrough } from "~/hooks/use-store";
import { PlaythroughMenu } from "./playthrough-menu";

const navItems = [
  { to: "/search", label: "SEARCH" },
  { to: "/party", label: "PARTY" },
  { to: "/gyms", label: "GYMS" },
  { to: "/where", label: "WHERE" },
  { to: "/tms", label: "TMS" },
  { to: "/settings", label: "SETTINGS" },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const active = useActivePlaythrough();
  const sync = useSyncContext();
  const [menuOpen, setMenuOpen] = useState(false);

  // Sync indicator drives the top-right status pill.
  const syncLabel = buildSyncLabel(sync.status);

  useEffect(() => {
    if (sync.status.error) {
      console.error("[sync]", sync.status.error);
    }
  }, [sync.status.error]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3">
        <div className="flex flex-col">
          <h1 className="font-[var(--font-pixel)] text-xs tracking-wider text-[var(--color-text)]">
            SUPER EFFECTIVE
          </h1>
          <span className="text-[10px] text-[var(--color-text-3)]">
            {active ? gameName(active.gameId) : "No playthrough"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {syncLabel && (
            <span
              aria-label="Sync status"
              className={`text-[10px] font-[var(--font-pixel)] ${syncLabel.cls}`}
            >
              {syncLabel.text}
            </span>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Switch playthrough"
            className="min-h-11 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card-2)] px-3 text-xs text-[var(--color-text)]"
          >
            {active?.name ?? "＋ NEW"}
          </button>
        </div>
      </header>
      <nav className="flex gap-1 overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-card-2)]">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `min-h-11 whitespace-nowrap px-3 py-2 text-xs font-medium ${
                isActive
                  ? "border-b-2 border-[var(--color-gold)] text-[var(--color-text)]"
                  : "text-[var(--color-text-2)] hover:text-[var(--color-text)]"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <main className="flex-1 p-4">{children}</main>
      <PlaythroughMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}

function buildSyncLabel(status: ReturnType<typeof useSyncContext>["status"]) {
  if (!status.hasToken) return null;
  if (status.syncing) return { text: "syncing…", cls: "text-[var(--color-text-3)]" };
  if (status.error) return { text: "sync error", cls: "text-[var(--color-red)]" };
  if (status.lastSynced) return { text: "synced", cls: "text-[var(--color-green)]" };
  return { text: "pending", cls: "text-[var(--color-text-3)]" };
}
