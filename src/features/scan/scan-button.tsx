import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "~/hooks/use-settings";

const DEFAULT_CLASS =
  "min-h-11 w-full rounded-[var(--radius-card)] border border-[color-mix(in_srgb,var(--color-gold)_25%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_7%,transparent)] px-3 font-[var(--font-pixel)] text-xs text-[var(--color-gold)] disabled:opacity-50";

export function ScanButton({
  label,
  busyLabel = "SCANNING…",
  accept = "image/*",
  multiple = true,
  onFiles,
  busy = false,
  className,
  ariaLabel,
}: {
  label: string;
  busyLabel?: string;
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[], apiKey: string) => Promise<void> | void;
  busy?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const { data: settings } = useSettings();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const apiKey = settings?.claudeApiKey ?? "";
  const needsKey = !apiKey;

  function open() {
    if (needsKey) {
      navigate("/settings");
      return;
    }
    inputRef.current?.click();
  }

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    await onFiles(files, apiKey);
  }

  const display = busy ? busyLabel : needsKey ? `${label} · SET KEY` : label;

  return (
    <>
      <button
        type="button"
        onClick={open}
        disabled={busy}
        aria-label={ariaLabel ?? label}
        className={className ?? DEFAULT_CLASS}
      >
        {display}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={onChange}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
    </>
  );
}
