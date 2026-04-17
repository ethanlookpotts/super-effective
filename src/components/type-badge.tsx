import { tc } from "~/lib/colors";
import type { TypeName } from "~/schemas";

export function TypeBadge({
  type,
  size = "md",
}: {
  type: TypeName;
  size?: "sm" | "md";
}) {
  const scale = size === "sm" ? "px-[7px] py-[2px] text-[8px]" : "px-2 py-[3px] text-[9px]";
  return (
    <span
      className={`inline-block rounded-[5px] font-pixel leading-[1.5] tracking-[0.04em] text-white ${scale}`}
      style={{ backgroundColor: tc(type) }}
    >
      {type}
    </span>
  );
}
