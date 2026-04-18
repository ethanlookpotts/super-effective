import type { TypeName } from "~/schemas";

/**
 * Type -> hex color mapping used for dynamic styling of type pills,
 * boss headers, and move categorization throughout the UI.
 */
const TYPE_COLORS: Record<TypeName, string> = {
  Normal: "#6a6a5a",
  Fire: "#b84018",
  Water: "#2850c0",
  Grass: "#3a8820",
  Electric: "#b89800",
  Ice: "#488888",
  Fighting: "#801818",
  Poison: "#621880",
  Ground: "#907030",
  Flying: "#5848c0",
  Psychic: "#b02050",
  Bug: "#607210",
  Rock: "#786820",
  Ghost: "#402860",
  Dragon: "#3808d8",
  Dark: "#382818",
  Steel: "#686880",
  Fairy: "#a03860",
};

const FALLBACK_COLOR = "#888";

/** Return a hex color for a given type name; falls back to grey if unknown. */
export function tc(type: TypeName): string {
  return TYPE_COLORS[type] ?? FALLBACK_COLOR;
}
