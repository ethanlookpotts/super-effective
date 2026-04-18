import { useEffect, useRef, useState } from "react";
import { TYPES } from "~/data/types";
import { tc } from "~/lib/colors";
import type { TypeName } from "~/schemas";

export function TypeFilter({
  active,
  onToggle,
}: {
  active: TypeName | null;
  onToggle: (type: TypeName) => void;
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const check = () => {
      setAtEnd(row.scrollLeft + row.clientWidth >= row.scrollWidth - 4);
    };
    check();
    row.addEventListener("scroll", check, { passive: true });
    return () => row.removeEventListener("scroll", check);
  }, []);

  return (
    <div
      className="relative -mx-4"
      style={{
        maskImage: atEnd
          ? "none"
          : "linear-gradient(to right, black 0, black calc(100% - 24px), transparent 100%)",
        WebkitMaskImage: atEnd
          ? "none"
          : "linear-gradient(to right, black 0, black calc(100% - 24px), transparent 100%)",
      }}
    >
      <div
        ref={rowRef}
        className="flex gap-1.5 overflow-x-auto px-4 py-1"
        style={{ scrollbarWidth: "none" }}
        role="group"
        aria-label="Type filter"
      >
        {TYPES.map((t) => {
          const isActive = active === t;
          return (
            <button
              key={t}
              type="button"
              aria-label={t}
              aria-pressed={isActive}
              onClick={() => onToggle(t)}
              className={`min-h-8 shrink-0 rounded-full border-[1.5px] px-2.5 py-[5px] font-pixel text-[8px] leading-[1.5] tracking-[0.04em] text-white transition active:scale-95 ${
                isActive ? "opacity-100 shadow-[0_0_6px_rgba(0,0,0,0.08)]" : "opacity-55"
              }`}
              style={{
                backgroundColor: tc(t),
                borderColor: isActive ? "rgba(0,0,0,.45)" : "transparent",
              }}
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}
