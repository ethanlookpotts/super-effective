import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/search", label: "SEARCH" },
  { to: "/party", label: "PARTY" },
  { to: "/gyms", label: "GYMS" },
  { to: "/where", label: "WHERE" },
  { to: "/tms", label: "TMS" },
  { to: "/settings", label: "SETTINGS" },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3">
        <h1 className="font-[var(--font-pixel)] text-sm tracking-wider text-[var(--color-text)]">
          SUPER EFFECTIVE
        </h1>
      </header>
      <nav className="flex gap-1 border-b border-[var(--color-border)] bg-[var(--color-card-2)] overflow-x-auto">
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
    </div>
  );
}
