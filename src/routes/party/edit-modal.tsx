import { useEffect, useMemo, useRef, useState } from "react";
import { TypeBadge } from "~/components/type-badge";
import { POKEMON, type Pokemon } from "~/data/pokemon";
import { NATURE_NAMES, computeAttackerStats, natureSummary } from "~/data/stats";
import { useUpdateActivePlaythrough } from "~/hooks/use-playthroughs";
import { spriteUrl } from "~/lib/sprites";
import type { PartyMember, PartyMove, PartyStats } from "~/schemas";
import { AdvancedInfoSection } from "./edit-modal-info";
import { MovesSection } from "./edit-modal-moves";

export type EditMode = "party" | "pc";

export interface EditModalState {
  mode: EditMode;
  /** -1 when adding a new member; otherwise the index in the source list. */
  slot: number;
}

export interface Draft {
  poke: Pokemon | null;
  level: string;
  nature: string;
  moves: PartyMember["moves"];
  shiny: boolean;
  ability: string;
  item: string;
  gender: "M" | "F" | "";
  pokeball: string;
  otName: string;
  otId: string;
  trainerMemo: string;
  stats: PartyStats | null;
}

function pokemonFromMember(pm: PartyMember): Pokemon | null {
  return POKEMON.find((p) => p.n === pm.n) ?? null;
}

function draftFromMember(pm: PartyMember | undefined): Draft {
  if (!pm) {
    return {
      poke: null,
      level: "",
      nature: "",
      moves: [],
      shiny: false,
      ability: "",
      item: "",
      gender: "",
      pokeball: "",
      otName: "",
      otId: "",
      trainerMemo: "",
      stats: null,
    };
  }
  return {
    poke: pokemonFromMember(pm),
    level: pm.level !== undefined ? String(pm.level) : "",
    nature: pm.nature ?? "",
    moves: pm.moves ?? [],
    shiny: pm.shiny ?? false,
    ability: pm.ability ?? "",
    item: pm.item ?? "",
    gender: pm.gender ?? "",
    pokeball: pm.pokeball ?? "",
    otName: pm.otName ?? "",
    otId: pm.otId ?? "",
    trainerMemo: pm.trainerMemo ?? "",
    stats: pm.stats ?? null,
  };
}

function hasAnyStat(s: PartyStats | null): boolean {
  if (!s) return false;
  return Object.values(s).some((v) => typeof v === "number");
}

function hasAnyInfo(d: Draft): boolean {
  return Boolean(
    d.ability ||
      d.item ||
      d.gender ||
      d.shiny ||
      d.pokeball ||
      d.otName ||
      d.otId ||
      d.trainerMemo ||
      hasAnyStat(d.stats),
  );
}

function infoSummary(d: Draft): string {
  const parts: string[] = [];
  if (d.ability) parts.push(d.ability);
  if (d.item) parts.push(d.item);
  if (d.gender === "M") parts.push("♂");
  else if (d.gender === "F") parts.push("♀");
  if (d.shiny) parts.push("✦ SHINY");
  return parts.join(" · ");
}

function draftToMember(draft: Draft): PartyMember | null {
  if (!draft.poke) return null;
  const lv = Number.parseInt(draft.level, 10);
  const base: PartyMember = {
    n: draft.poke.n,
    name: draft.poke.name,
    types: [...draft.poke.types],
    moves: draft.moves,
  };
  if (Number.isFinite(lv) && lv >= 1 && lv <= 100) base.level = lv;
  if (draft.shiny) base.shiny = true;
  if (draft.ability) base.ability = draft.ability;
  if (draft.item) base.item = draft.item;
  if (draft.gender) base.gender = draft.gender;
  if (draft.nature) base.nature = draft.nature;
  if (draft.pokeball) base.pokeball = draft.pokeball;
  if (draft.otName) base.otName = draft.otName;
  if (draft.otId) base.otId = draft.otId;
  if (draft.trainerMemo) base.trainerMemo = draft.trainerMemo;
  if (hasAnyStat(draft.stats)) base.stats = draft.stats ?? undefined;
  return base;
}

export function EditModal({
  state,
  party,
  pc,
  onClose,
}: {
  state: EditModalState;
  party: readonly PartyMember[];
  pc: readonly PartyMember[];
  onClose: () => void;
}) {
  const { mode, slot } = state;
  const source = mode === "pc" ? pc : party;
  const existing = slot >= 0 ? source[slot] : undefined;
  const isEditing = slot >= 0 && slot < source.length;

  const [draft, setDraft] = useState<Draft>(() => draftFromMember(existing));
  const update = useUpdateActivePlaythrough();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function patch(p: Partial<Draft>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  function save() {
    const member = draftToMember(draft);
    if (!member) return;
    update.mutate(
      (pt) => {
        if (mode === "pc") {
          const nextPc = [...pt.pc];
          if (isEditing) nextPc[slot] = member;
          else nextPc.push(member);
          return { ...pt, pc: nextPc };
        }
        const nextParty = [...pt.party];
        if (isEditing) nextParty[slot] = member;
        else nextParty.push(member);
        return { ...pt, party: nextParty };
      },
      { onSuccess: onClose },
    );
  }

  function remove() {
    if (!isEditing) return;
    update.mutate(
      (pt) => {
        if (mode === "pc") {
          return { ...pt, pc: pt.pc.filter((_, i) => i !== slot) };
        }
        return { ...pt, party: pt.party.filter((_, i) => i !== slot) };
      },
      { onSuccess: onClose },
    );
  }

  const title = isEditing
    ? mode === "pc"
      ? "EDIT PC POKÉMON"
      : "EDIT POKÉMON"
    : mode === "pc"
      ? "ADD TO PC"
      : "ADD POKÉMON";

  const saveLabel = isEditing
    ? "💾 SAVE CHANGES"
    : mode === "pc"
      ? "➕ ADD TO PC"
      : "➕ ADD TO PARTY";

  const removeLabel = mode === "pc" ? "✕ REMOVE FROM PC" : "✕ REMOVE FROM PARTY";

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
    >
      <div
        role="dialog"
        aria-label={title}
        aria-modal="true"
        className="flex max-h-[95vh] w-full max-w-[480px] flex-col rounded-t-[var(--radius-card-lg)] border border-[var(--color-border)] bg-[var(--color-card)] sm:rounded-[var(--radius-card-lg)]"
      >
        <header className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] p-3">
          <h3 className="font-[var(--font-pixel)] text-xs text-[var(--color-gold)]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="min-h-11 min-w-11 font-[var(--font-pixel)] text-xs text-[var(--color-text-3)]"
          >
            ✕
          </button>
        </header>

        <div className="flex flex-col gap-3 overflow-y-auto p-3">
          <PokemonPicker draft={draft} onPick={(poke) => patch({ poke, moves: [] })} />

          {draft.poke && (
            <>
              <SelectedPokeCard poke={draft.poke} shiny={draft.shiny} />
              <LevelAndNature draft={draft} onPatch={patch} />
              <CollapsibleSection
                title="MOVES"
                summary={`${draft.moves.length}/4 SET`}
                defaultOpen={draft.moves.length > 0}
              >
                <MovesSection
                  dexN={draft.poke.n}
                  moves={draft.moves}
                  onChange={(moves: PartyMove[]) => patch({ moves })}
                />
              </CollapsibleSection>
              <CollapsibleSection
                title="INFO"
                summary={infoSummary(draft)}
                defaultOpen={hasAnyInfo(draft)}
              >
                <AdvancedInfoSection draft={draft} onPatch={patch} />
              </CollapsibleSection>
            </>
          )}
        </div>

        <footer className="flex flex-col gap-2 border-t border-[var(--color-border)] p-3">
          <button
            type="button"
            onClick={save}
            disabled={!draft.poke || update.isPending}
            className="min-h-11 w-full rounded-[var(--radius-card)] bg-[var(--color-gold)] px-3 font-[var(--font-pixel)] text-xs text-black disabled:opacity-50"
          >
            {update.isPending ? "SAVING…" : saveLabel}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={remove}
              disabled={update.isPending}
              className="min-h-11 w-full rounded-[var(--radius-card)] border border-[var(--color-red)] bg-transparent px-3 font-[var(--font-pixel)] text-[10px] text-[var(--color-red)] disabled:opacity-50"
            >
              {removeLabel}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  summary,
  defaultOpen,
  children,
}: {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card-2)] p-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`${open ? "Collapse" : "Expand"} ${title}`}
        className="flex min-h-11 w-full items-center gap-2 text-left"
      >
        <span className="font-[var(--font-pixel)] text-[10px] text-[var(--color-text)]">
          {title}
        </span>
        {summary && (
          <span className="font-[var(--font-pixel)] text-[10px] text-[var(--color-text-3)]">
            {summary}
          </span>
        )}
        <span className="ml-auto text-[var(--color-text-3)]">{open ? "▾" : "▶"}</span>
      </button>
      {open && children}
    </div>
  );
}

function PokemonPicker({
  draft,
  onPick,
}: {
  draft: Draft;
  onPick: (poke: Pokemon) => void;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!focused) return;
    function onClick(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setFocused(false);
    }
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [focused]);

  const q = query.trim().toLowerCase();
  const results = useMemo<Pokemon[]>(() => {
    if (!q) return [];
    return POKEMON.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [q]);

  const showDrop = focused && q.length > 0 && results.length > 0;

  return (
    <div ref={boxRef}>
      <label
        htmlFor="edit-poke-search"
        className="font-[var(--font-pixel)] text-[10px] text-[var(--color-text-3)]"
      >
        POKÉMON
      </label>
      <div className="relative mt-1">
        <div className="flex items-center gap-2 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card-2)] px-3">
          <input
            id="edit-poke-search"
            type="text"
            placeholder={draft.poke ? draft.poke.name : "Search Pokémon…"}
            value={query}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            aria-label="Search Pokémon"
            className="min-h-11 flex-1 bg-transparent text-sm text-[var(--color-text)] outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear Pokémon search"
              className="min-h-11 px-2 text-[var(--color-text-3)]"
            >
              ×
            </button>
          )}
        </div>
        {showDrop && (
          <div
            role="listbox"
            aria-label="Pokémon results"
            tabIndex={-1}
            className="absolute left-0 right-0 top-[calc(100%+4px)] z-10 max-h-[40vh] overflow-y-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg"
          >
            {results.map((p) => (
              <button
                key={p.n}
                type="button"
                role="option"
                aria-selected={draft.poke?.n === p.n}
                onClick={() => {
                  onPick(p);
                  setQuery("");
                  setFocused(false);
                }}
                className="flex min-h-11 w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-[var(--color-card-2)]"
              >
                <span className="w-12 font-[var(--font-pixel)] text-[10px] text-[var(--color-text-3)]">
                  #{String(p.n).padStart(3, "0")}
                </span>
                <span className="flex-1 text-sm text-[var(--color-text)]">{p.name}</span>
                <span className="flex gap-1">
                  {p.types.map((t) => (
                    <TypeBadge key={t} type={t} size="sm" />
                  ))}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SelectedPokeCard({ poke, shiny }: { poke: Pokemon; shiny: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-card)] bg-[var(--color-card-2)] p-3">
      <img
        src={spriteUrl(poke.n, { shiny })}
        alt=""
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
        className="h-14 w-14 shrink-0 object-contain"
      />
      <div className="flex flex-col gap-1">
        <div className="font-[var(--font-pixel)] text-[9px] text-[var(--color-text-3)]">
          #{String(poke.n).padStart(3, "0")}
          {shiny ? <span className="ml-1 text-[var(--color-gold)]">✦</span> : null}
        </div>
        <div className="font-[var(--font-pixel)] text-[10px] text-[var(--color-gold)]">
          {poke.name}
        </div>
        <div className="flex gap-1">
          {poke.types.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LevelAndNature({
  draft,
  onPatch,
}: {
  draft: Draft;
  onPatch: (p: Partial<Draft>) => void;
}) {
  const computed = useMemo(() => {
    if (!draft.poke) return null;
    const lv = Number.parseInt(draft.level, 10);
    return computeAttackerStats({
      n: draft.poke.n,
      level: Number.isFinite(lv) ? lv : 50,
      nature: draft.nature || null,
    });
  }, [draft.poke, draft.level, draft.nature]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="edit-level"
            className="font-[var(--font-pixel)] text-[10px] text-[var(--color-text-3)]"
          >
            LEVEL
          </label>
          <input
            id="edit-level"
            type="number"
            min={1}
            max={100}
            placeholder="50"
            inputMode="numeric"
            value={draft.level}
            onChange={(e) => onPatch({ level: e.target.value })}
            aria-label="Level"
            className="min-h-11 w-20 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card-2)] px-3 text-sm text-[var(--color-text)] outline-none"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label
            htmlFor="edit-nature"
            className="font-[var(--font-pixel)] text-[10px] text-[var(--color-text-3)]"
          >
            NATURE
          </label>
          <select
            id="edit-nature"
            value={draft.nature}
            onChange={(e) => onPatch({ nature: e.target.value })}
            aria-label="Nature"
            className="min-h-11 w-full rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card-2)] px-2 text-sm text-[var(--color-text)] outline-none"
          >
            <option value="">— neutral</option>
            {NATURE_NAMES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
      {draft.nature && (
        <div className="font-[var(--font-pixel)] text-[9px] text-[var(--color-text-3)]">
          {natureSummary(draft.nature)}
        </div>
      )}
      {computed && (
        <div className="font-[var(--font-pixel)] text-[9px] text-[var(--color-text-2)]">
          ~ATK {computed.atk} · SpA {computed.spa} · Spe {computed.spe}
        </div>
      )}
    </div>
  );
}
