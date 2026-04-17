import { tc } from "~/lib/colors";
import type { TypeName } from "~/schemas";

export function TypeBadge({
  type,
  size = "md",
}: {
  type: TypeName;
  size?: "sm" | "md";
}) {
  const scale = size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[10px]";
  return (
    <span
      className={`inline-block rounded font-[var(--font-pixel)] tracking-wider text-white ${scale}`}
      style={{ backgroundColor: tc(type) }}
    >
      {type.toUpperCase()}
    </span>
  );
}
