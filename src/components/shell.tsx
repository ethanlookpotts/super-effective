import { type ReactNode, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { gameById } from "~/data/games";
import { ConflictModal } from "~/features/sync/conflict-modal";
import { useSyncContext } from "~/features/sync/sync-context";
import { useActivePlaythrough } from "~/hooks/use-store";
import { PlaythroughMenu } from "./playthrough-menu";

const navItems = [
  { to: "/search", label: "SEARCH", icon: "🔍" },
  { to: "/party", label: "PARTY", icon: "🎒" },
  { to: "/gyms", label: "GYMS", icon: "🏆" },
  { to: "/where", label: "WHERE", icon: "🗺" },
  { to: "/tms", label: "TMS", icon: "📀" },
  { to: "/settings", label: "SETTINGS", icon: "⚙" },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const active = useActivePlaythrough();
  const sync = useSyncContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  const syncLabel = buildSyncLabel(sync.status);
  const game = active ? gameById(active.gameId) : null;
  const gameTitle = active
    ? game
      ? `${game.icon} ${game.name.toUpperCase()}`
      : active.gameId.toUpperCase()
    : "NO PLAYTHROUGH";
  const gameSub = game ? "BATTLE AIDE · GEN III · KANTO" : "CHOOSE A GAME TO BEGIN";

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (sync.status.error) console.error("[sync]", sync.status.error);
  }, [sync.status.error]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      {/* Mobile masthead: hamburger + game title + playthrough pill */}
      <header className="masthead flex items-center justify-between gap-2 border-b border-border px-4 py-2 md:hidden">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
          className="min-h-11 w-11 shrink-0 text-xl text-text active:text-gold"
        >
          ☰
        </button>
        <div className="min-w-0 flex-1 text-center">
          <div className="truncate font-pixel text-[9px] tracking-wider text-gold">{gameTitle}</div>
          <div className="truncate font-pixel text-[8px] text-text-3">{gameSub}</div>
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label={active ? `Switch playthrough: ${active.name}` : "Switch playthrough"}
          className="min-h-11 shrink-0 rounded-full border border-[color-mix(in_srgb,var(--color-gold)_28%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_10%,transparent)] px-3 font-pixel text-[9px] text-gold"
        >
          {active?.name ?? "＋ NEW RUN"} ▾
        </button>
      </header>

      {/* Permanent desktop sidebar — hidden on mobile via display:none so aria-label matches only one DOM element */}
      <aside className="hidden border-r border-border-2 bg-card md:flex md:w-60 md:flex-col">
        <DrawerBody
          aria-label="Current game"
          gameTitle={gameTitle}
          gameSub={gameSub}
          syncLabel={syncLabel}
          activeName={active?.name ?? null}
          onOpenMenu={() => setMenuOpen(true)}
          onClose={null}
          showGameAriaLabel
        />
      </aside>

      {/* Mobile slide-in drawer (no aria-label "Current game" — that lives on the masthead) */}
      {drawerOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setDrawerOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setDrawerOpen(false);
          }}
          role="presentation"
          className="fixed inset-0 z-40 bg-black/45 md:hidden"
        >
          <aside className="flex h-dvh w-[82%] max-w-[260px] flex-col border-r border-border-2 bg-card">
            <DrawerBody
              gameTitle={gameTitle}
              gameSub={gameSub}
              syncLabel={syncLabel}
              activeName={active?.name ?? null}
              onOpenMenu={() => setMenuOpen(true)}
              onClose={() => setDrawerOpen(false)}
              showGameAriaLabel={false}
            />
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
      <PlaythroughMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <ConflictModal conflict={sync.conflict} onResolve={sync.resolveConflict} />
    </div>
  );
}

function DrawerBody({
  gameTitle,
  gameSub,
  syncLabel,
  activeName,
  onOpenMenu,
  onClose,
  showGameAriaLabel,
}: {
  gameTitle: string;
  gameSub: string;
  syncLabel: { text: string; cls: string } | null;
  activeName: string | null;
  onOpenMenu: () => void;
  onClose: (() => void) | null;
  showGameAriaLabel: boolean;
}) {
  return (
    <>
      <div className="flex items-start gap-2 border-b border-border p-4">
        <div className="min-w-0 flex-1">
          <div
            aria-label={showGameAriaLabel ? "Current game" : undefined}
            className="truncate font-pixel text-[10px] tracking-wider text-gold"
          >
            {gameTitle}
          </div>
          <div className="mt-1 truncate font-pixel text-[8px] text-text-3">{gameSub}</div>
          {syncLabel && (
            <div className={`mt-2 font-pixel text-[8px] ${syncLabel.cls}`}>{syncLabel.text}</div>
          )}
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label={activeName ? `Switch playthrough: ${activeName}` : "Switch playthrough"}
            className="mt-3 w-full rounded-full border border-[color-mix(in_srgb,var(--color-gold)_28%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_10%,transparent)] px-3 py-2 font-pixel text-[9px] text-gold"
          >
            {activeName ?? "＋ NEW RUN"} ▾
          </button>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="shrink-0 rounded-card border border-border-2 px-2 py-1 text-sm text-text-3"
          >
            ✕
          </button>
        )}
      </div>
      <div className="border-b border-border px-4 py-2">
        <div className="font-pixel text-[8px] tracking-wider text-gold">SUPER EFFECTIVE</div>
      </div>
      <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-card px-3 py-3 font-pixel text-[10px] tracking-wider transition ${
                isActive
                  ? "bg-[color-mix(in_srgb,var(--color-gold)_10%,transparent)] text-gold"
                  : "text-text-2 active:bg-card-2"
              }`
            }
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}

function buildSyncLabel(status: ReturnType<typeof useSyncContext>["status"]) {
  if (!status.hasToken) return null;
  if (status.syncing) return { text: "syncing…", cls: "text-text-3" };
  if (status.error) return { text: "sync error", cls: "text-red" };
  if (status.lastSynced) return { text: "synced", cls: "text-green" };
  return { text: "pending", cls: "text-text-3" };
}
