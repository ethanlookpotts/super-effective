import { describe, expect, it } from "vitest";
import {
  applyAbilityMod,
  formatMult,
  matchupBreakdown,
  moveBreakdown,
  multClass,
  multLabel,
} from "~/lib/damage";
import type { TypeName } from "~/schemas";

const charizard = { n: 6, name: "Charizard", types: ["Fire", "Flying"] as TypeName[] };
const gengar = { n: 94, name: "Gengar", types: ["Ghost", "Poison"] as TypeName[] };
const gyarados = { n: 130, name: "Gyarados", types: ["Water", "Flying"] as TypeName[] };

// ─── applyAbilityMod ────────────────────────────────────────────────────────
describe("applyAbilityMod", () => {
  it("levitate grants immunity to Ground (Gengar #94)", () => {
    expect(applyAbilityMod(2, "Ground", 94)).toBe(0);
  });

  it("flash fire grants immunity to Fire (Vulpix #37)", () => {
    expect(applyAbilityMod(1, "Fire", 37)).toBe(0);
  });

  it("thick fat halves Fire damage (Snorlax #143)", () => {
    expect(applyAbilityMod(2, "Fire", 143)).toBe(1);
  });

  it("thick fat halves Ice damage (Snorlax #143)", () => {
    expect(applyAbilityMod(1, "Ice", 143)).toBe(0.5);
  });

  it("passes through for non-affected types", () => {
    expect(applyAbilityMod(2, "Water", 94)).toBe(2);
  });

  it("no-op when defender has no tracked ability", () => {
    expect(applyAbilityMod(4, "Electric", 25)).toBe(4);
  });
});

// ─── matchupBreakdown ───────────────────────────────────────────────────────
describe("matchupBreakdown", () => {
  it("Electric → Gyarados = 2 × 2 = 4×", () => {
    const b = matchupBreakdown("Electric", gyarados);
    expect(b.typeProduct).toBe(4);
    expect(b.final).toBe(4);
    expect(b.typeRows).toHaveLength(2);
    expect(b.typeRows[0]).toEqual({ defType: "Water", mult: 2 });
    expect(b.typeRows[1]).toEqual({ defType: "Flying", mult: 2 });
  });

  it("Rock → Charizard = 2 × 2 = 4×", () => {
    const b = matchupBreakdown("Rock", charizard);
    expect(b.final).toBe(4);
  });

  it("Ground → Gengar applies Levitate immunity", () => {
    const b = matchupBreakdown("Ground", gengar);
    expect(b.typeProduct).toBe(2);
    expect(b.ability).not.toBeNull();
    expect(b.ability?.kind).toBe("immune");
    expect(b.ability?.name).toBe("Levitate");
    expect(b.final).toBe(0);
  });

  it("Normal → Gengar is 0× (Normal can't hit Ghost)", () => {
    const b = matchupBreakdown("Normal", gengar);
    expect(b.final).toBe(0);
  });

  it("Grass → Charizard = 0.5 × 0.5 = 0.25×", () => {
    const b = matchupBreakdown("Grass", charizard);
    expect(b.typeProduct).toBe(0.25);
    expect(b.final).toBe(0.25);
  });

  it("records a noop ability step for irrelevant types", () => {
    // Gengar has Levitate but Water is neither immune nor resisted
    const b = matchupBreakdown("Water", gengar);
    expect(b.ability?.kind).toBe("noop");
    expect(b.final).toBe(b.typeProduct);
  });
});

// ─── moveBreakdown ──────────────────────────────────────────────────────────
describe("moveBreakdown", () => {
  const pikachu = { n: 25, name: "Pikachu", types: ["Electric"] as TypeName[] };

  it("Thunderbolt from Pikachu → Gyarados includes STAB", () => {
    const b = moveBreakdown("Thunderbolt", "Electric", gyarados, pikachu);
    expect(b.typeProduct).toBe(4);
    expect(b.final).toBe(4);
    expect(b.stab).toBe(true);
    expect(b.finalWithStab).toBe(6);
  });

  it("Non-STAB move keeps final × 1", () => {
    const charmander = { n: 4, name: "Charmander", types: ["Fire"] as TypeName[] };
    const b = moveBreakdown("Ember", "Fire", charizard, charmander);
    // Fire → Fire/Flying = 0.5 × 1 = 0.5, STAB 1.5 = 0.75
    expect(b.stab).toBe(true);
    expect(b.finalWithStab).toBeCloseTo(0.75);
  });

  it("stab is false when attacker does not share the move type", () => {
    const b = moveBreakdown("Surf", "Water", gengar, pikachu);
    expect(b.stab).toBe(false);
    expect(b.finalWithStab).toBe(b.final);
  });

  it("ability immunity stays 0 even with STAB", () => {
    const dugtrio = { n: 51, name: "Dugtrio", types: ["Ground"] as TypeName[] };
    const b = moveBreakdown("Earthquake", "Ground", gengar, dugtrio);
    expect(b.stab).toBe(true);
    expect(b.final).toBe(0);
    expect(b.finalWithStab).toBe(0);
  });

  it("populates move metadata from MOVE_DATA", () => {
    const b = moveBreakdown("Thunderbolt", "Electric", gyarados, pikachu);
    expect(b.pow).toBeGreaterThan(0);
    expect(b.phys).toBe(false);
  });
});

// ─── formatters ─────────────────────────────────────────────────────────────
describe("formatMult / multLabel / multClass", () => {
  it("formats integer and fractional multipliers", () => {
    expect(formatMult(0)).toBe("0×");
    expect(formatMult(2)).toBe("2×");
    expect(formatMult(0.5)).toBe("0.5×");
    expect(formatMult(0.25)).toBe("0.25×");
  });

  it("labels each tier", () => {
    expect(multLabel(0)).toBe("Immune");
    expect(multLabel(4)).toBe("Super Effective");
    expect(multLabel(2)).toBe("Super Effective");
    expect(multLabel(0.5)).toBe("Resisted");
    expect(multLabel(0.25)).toBe("Barely Resisted");
    expect(multLabel(1)).toBe("Neutral");
  });

  it("classes each tier", () => {
    expect(multClass(0)).toBe("zero");
    expect(multClass(4)).toBe("good");
    expect(multClass(0.5)).toBe("bad");
    expect(multClass(1)).toBe("neutral");
  });
});
