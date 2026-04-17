import { MOVE_DATA, type MoveStats } from "~/data/moves";
import { type AttackerStats, STATS, computeAttackerStats, damageRangePct } from "~/data/stats";
import { PHYS, TYPES, dmult, gm } from "~/data/types";
import type { PartyMember, PartyMove, TypeName } from "~/schemas";

/**
 * PARTY SCORING ENGINE — pure module.
 *
 *   scoreTeam = 3 × unresisted + 2 × superEff − stackedWeakness + avgAtkPower/40 + avgBST/600
 */

export type CalcMember = Pick<PartyMember, "n" | "types" | "moves"> & {
  level?: PartyMember["level"] | string;
  nature?: string | null;
  advStats?: { nature?: string | null } | null;
};

export interface TeachMoveInput {
  name: string;
  type: TypeName;
}

export interface TeachImpact {
  replaceIdx: number;
  replaced: PartyMove | null;
  scoreDelta: number;
  unresistedDelta: number;
  superDelta: number;
  coverageLost: number;
}

export interface TeachRanking {
  memberIdx: number;
  impact: TeachImpact;
}

export interface TeamSuggestion<M extends CalcMember> {
  members: M[];
  score: number;
  coverage: number;
  unresisted: number;
}

export interface HMCarrier<M extends CalcMember> {
  pm: M;
  hmsLearnable: number;
  hmList: string[];
  battleScore: number;
  score: number;
}

export type CanLearnFn = (dexNum: number, moveName: string) => boolean;

interface DamageProfile {
  lv: number;
  atk: AttackerStats;
  candidates: { type: TypeName; pow: number }[];
  stabSet: Set<TypeName>;
  dmgByType: Record<string, number>;
}

const BASELINE_LV = 50;
const BASELINE_BASE = 80;
const BASELINE_DEF = Math.floor(((2 * BASELINE_BASE + 15) * BASELINE_LV) / 100 + 5);
const BASELINE_HP = Math.floor(((2 * BASELINE_BASE + 15) * BASELINE_LV) / 100 + BASELINE_LV + 10);

const PROFILE_CACHE: WeakMap<CalcMember, DamageProfile | null> = new WeakMap();

function atkTypes(pm: CalcMember): TypeName[] {
  return [...pm.types, ...(pm.moves ?? []).map((m) => m.type)];
}

export function bst(n: number): number {
  const s = STATS[n];
  return s ? s[0] + s[1] + s[2] + s[3] + s[4] + s[5] : 300;
}

/** Set of defender types covered at multiplier ≥ threshold by any team attack. */
function coveredAt(members: readonly CalcMember[], threshold: number): Set<TypeName> {
  const covered = new Set<TypeName>();
  for (const pm of members) {
    const at = atkTypes(pm);
    for (const def of TYPES) {
      if (at.some((t) => gm(t, def) >= threshold)) covered.add(def);
    }
  }
  return covered;
}

export function coveredSuper(members: readonly CalcMember[]): Set<TypeName> {
  return coveredAt(members, 2);
}

export function coveredUnresisted(members: readonly CalcMember[]): Set<TypeName> {
  return coveredAt(members, 1);
}

/** Types to which at least one team member has a 2× defensive weakness. */
export function exposedWeak(members: readonly CalcMember[]): Set<TypeName> {
  const exposed = new Set<TypeName>();
  for (const at of TYPES) {
    if (members.some((pm) => dmult(at, pm.types) >= 2)) exposed.add(at);
  }
  return exposed;
}

export function countOffCov(members: readonly CalcMember[]): number {
  return coveredSuper(members).size;
}

export function unresistedCov(members: readonly CalcMember[]): number {
  return coveredUnresisted(members).size;
}

function profile(pm: CalcMember): DamageProfile | null {
  if (PROFILE_CACHE.has(pm)) return PROFILE_CACHE.get(pm) ?? null;
  const atk = computeAttackerStats({
    n: pm.n,
    level: typeof pm.level === "number" ? pm.level : Number.parseInt(`${pm.level ?? ""}`) || 50,
    nature: pm.nature ?? null,
    advStats: pm.advStats ?? null,
  });
  if (!atk) {
    PROFILE_CACHE.set(pm, null);
    return null;
  }
  let candidates: { type: TypeName; pow: number }[] = (pm.moves ?? [])
    .map((mv) => {
      const md: MoveStats | undefined = MOVE_DATA[mv.name];
      return { type: mv.type, pow: md ? md[0] : 0 };
    })
    .filter((c) => c.pow > 0);
  if (candidates.length === 0) {
    candidates = pm.types.map((t) => ({ type: t, pow: 60 }));
  }
  const lv = typeof pm.level === "number" ? pm.level : Number.parseInt(`${pm.level ?? ""}`) || 50;
  const p: DamageProfile = {
    lv,
    atk,
    candidates,
    stabSet: new Set<TypeName>(pm.types),
    dmgByType: Object.create(null),
  };
  PROFILE_CACHE.set(pm, p);
  return p;
}

export function bestDamageAgainst(pm: CalcMember, defType: TypeName): number {
  const p = profile(pm);
  if (!p) return 0;
  if (defType in p.dmgByType) return p.dmgByType[defType];
  let best = 0;
  for (const c of p.candidates) {
    const eff = dmult(c.type, [defType]);
    if (eff === 0) continue;
    const stab = p.stabSet.has(c.type) ? 1.5 : 1;
    const atkStat = PHYS.has(c.type) ? p.atk.atk : p.atk.spa;
    const range = damageRangePct(p.lv, atkStat, BASELINE_DEF, BASELINE_HP, c.pow, stab * eff);
    if (range && range[1] > best) best = range[1];
  }
  p.dmgByType[defType] = best;
  return best;
}

export function avgAtkPower(members: readonly CalcMember[]): number {
  if (members.length === 0) return 0;
  let total = 0;
  for (const pm of members) {
    let memberTotal = 0;
    for (const def of TYPES) memberTotal += bestDamageAgainst(pm, def);
    total += memberTotal / TYPES.length;
  }
  return total / members.length;
}

function weakCounts(members: readonly CalcMember[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const pm of members) {
    for (const at of TYPES) {
      if (dmult(at, pm.types) >= 2) counts[at] = (counts[at] ?? 0) + 1;
    }
  }
  return counts;
}

function stackPenalty(counts: Record<string, number>): number {
  return Object.values(counts).reduce((s, k) => s + (k * (k - 1)) / 2, 0);
}

export function individualScore(pm: CalcMember): number {
  const at = atkTypes(pm);
  const unres = TYPES.filter((def) => at.some((t) => gm(t, def) >= 1)).length;
  const superE = TYPES.filter((def) => at.some((t) => gm(t, def) >= 2)).length;
  const power = TYPES.reduce((s, d) => s + bestDamageAgainst(pm, d), 0) / TYPES.length;
  return unres * 3 + superE * 2 + power / 40 + bst(pm.n) / 600;
}

export function marginalScore(candidate: CalcMember, team: readonly CalcMember[]): number {
  const teamAtk = new Set<string>();
  for (const pm of team) {
    for (const at of atkTypes(pm)) {
      for (const def of TYPES) {
        if (gm(at, def) >= 1) teamAtk.add(`U:${def}`);
        if (gm(at, def) >= 2) teamAtk.add(`S:${def}`);
      }
    }
  }
  const candAtk = atkTypes(candidate);
  const newUnres = TYPES.filter(
    (def) => !teamAtk.has(`U:${def}`) && candAtk.some((t) => gm(t, def) >= 1),
  ).length;
  const newSup = TYPES.filter(
    (def) => !teamAtk.has(`S:${def}`) && candAtk.some((t) => gm(t, def) >= 2),
  ).length;
  let wkPenalty = 0;
  for (const at of TYPES) {
    if (dmult(at, candidate.types) >= 2) {
      wkPenalty += team.filter((pm) => dmult(at, pm.types) >= 2).length;
    }
  }
  const power = TYPES.reduce((s, d) => s + bestDamageAgainst(candidate, d), 0) / TYPES.length;
  return newUnres * 3 + newSup * 2 - wkPenalty + power / 40 + bst(candidate.n) / 600;
}

export function scoreTeam(members: readonly CalcMember[]): number {
  if (members.length === 0) return 0;
  const unres = unresistedCov(members);
  const sup = countOffCov(members);
  const defPen = stackPenalty(weakCounts(members));
  const power = avgAtkPower(members);
  const avgBst = members.reduce((s, pm) => s + bst(pm.n), 0) / members.length;
  return unres * 3 + sup * 2 - defPen + power / 40 + avgBst / 600;
}

export function buildGreedyTeam<M extends CalcMember>(pool: readonly M[], seed: M): M[] {
  const team: M[] = [seed];
  const remaining: M[] = pool.filter((p) => p !== seed);
  while (team.length < 6 && remaining.length > 0) {
    let best = Number.NEGATIVE_INFINITY;
    let bestIdx = -1;
    for (let i = 0; i < remaining.length; i++) {
      const s = marginalScore(remaining[i], team);
      if (s > best) {
        best = s;
        bestIdx = i;
      }
    }
    if (bestIdx < 0) break;
    team.push(remaining[bestIdx]);
    remaining.splice(bestIdx, 1);
  }
  return team;
}

export function computeSuggestions<M extends CalcMember>(
  pool: readonly M[],
  maxResults = 5,
): TeamSuggestion<M>[] {
  if (pool.length === 0) return [];
  type Tagged = M & { _pi: number };
  const tagged: Tagged[] = pool.map((pm, i) => ({ ...pm, _pi: i }) as Tagged);
  const sorted = [...tagged].sort((a, b) => individualScore(b) - individualScore(a));
  const suggestions: TeamSuggestion<M>[] = [];
  const seen = new Set<string>();
  for (const seed of sorted) {
    if (suggestions.length >= maxResults) break;
    const team = buildGreedyTeam(tagged, seed);
    const key = team
      .map((m) => m._pi)
      .sort((a, b) => a - b)
      .join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    const members = team
      .map((tm) => {
        const { _pi, ...rest } = tm;
        return rest as unknown as M;
      })
      .sort((a, b) => a.n - b.n);
    suggestions.push({
      members,
      score: scoreTeam(members),
      coverage: countOffCov(members),
      unresisted: unresistedCov(members),
    });
  }
  return suggestions.sort((a, b) => b.score - a.score);
}

export function computeTeachImpact(
  team: readonly CalcMember[],
  memberIdx: number,
  move: TeachMoveInput,
): TeachImpact | null {
  const pm = team[memberIdx];
  if (!pm) return null;
  const baseline = scoreTeam(team);
  const baseUnres = unresistedCov(team);
  const baseSup = countOffCov(team);
  const existing: readonly PartyMove[] = pm.moves ?? [];
  if (existing.some((mv) => mv.name === move.name)) return null;

  const candidates: { replaceIdx: number; replaced: PartyMove | null }[] = [];
  if (existing.length < 4) candidates.push({ replaceIdx: -1, replaced: null });
  existing.forEach((mv, i) => candidates.push({ replaceIdx: i, replaced: mv }));

  const newMove: PartyMove = { name: move.name, type: move.type };
  const oldCoveredSup = coveredSuper(team);

  let best: TeachImpact | null = null;
  for (const c of candidates) {
    const newMoves: PartyMove[] = [...existing];
    if (c.replaceIdx === -1) newMoves.push(newMove);
    else newMoves[c.replaceIdx] = newMove;
    const newTeam: CalcMember[] = team.map((m, i) =>
      i === memberIdx ? { ...m, moves: newMoves } : m,
    );
    const newCoveredSup = coveredSuper(newTeam);
    let coverageLost = 0;
    if (c.replaceIdx >= 0) {
      for (const t of oldCoveredSup) if (!newCoveredSup.has(t)) coverageLost++;
    }
    const result: TeachImpact = {
      replaceIdx: c.replaceIdx,
      replaced: c.replaced,
      scoreDelta: scoreTeam(newTeam) - baseline,
      unresistedDelta: unresistedCov(newTeam) - baseUnres,
      superDelta: newCoveredSup.size - baseSup,
      coverageLost,
    };
    if (!best || result.scoreDelta > best.scoreDelta) best = result;
  }
  return best;
}

export function rankTeachTargets<M extends CalcMember>(
  team: readonly M[],
  move: TeachMoveInput,
  canLearnIds: ReadonlySet<number>,
): TeachRanking[] {
  const ranked: TeachRanking[] = [];
  team.forEach((pm, idx) => {
    if (!canLearnIds.has(pm.n)) return;
    const impact = computeTeachImpact(team, idx, move);
    if (impact) ranked.push({ memberIdx: idx, impact });
  });
  ranked.sort((a, b) => b.impact.scoreDelta - a.impact.scoreDelta);
  return ranked;
}

export function computeHMCarriers<M extends CalcMember>(
  pool: readonly M[],
  ownedHmMoves: readonly string[],
  canLearn: CanLearnFn,
): HMCarrier<M>[] {
  if (pool.length === 0 || ownedHmMoves.length === 0) return [];
  return pool
    .map((pm) => {
      const hmList = ownedHmMoves.filter((mv) => canLearn(pm.n, mv));
      const battleScore = individualScore(pm);
      return {
        pm,
        hmsLearnable: hmList.length,
        hmList,
        battleScore,
        score: hmList.length * 10 - battleScore,
      };
    })
    .filter((c) => c.hmsLearnable > 0)
    .sort((a, b) => b.score - a.score);
}

/**
 * Backwards-compatible factory so legacy `calc.bst(...)` callers keep working.
 * Prefer the named exports above for new code.
 */
export function makePartyCalc() {
  return {
    bst,
    countOffCov,
    unresistedCov,
    individualScore,
    marginalScore,
    scoreTeam,
    bestDamageAgainst,
    avgAtkPower,
    buildGreedyTeam,
    computeSuggestions,
    computeTeachImpact,
    rankTeachTargets,
    computeHMCarriers,
  };
}
