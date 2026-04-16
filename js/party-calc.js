// ═══════════════════════════════
// PARTY SCORING ENGINE — pure module
// ═══════════════════════════════
// Browser: makePartyCalc(TYPES, STATS, gm, dmult, opts?) where
//   opts = { MOVE_DATA, PHYS, LEARNSETS, computeAttackerStats, damageRangePct }
// All extras are optional — when omitted, damage-aware scoring is skipped and
// the calc falls back to pure type-coverage scoring (same behaviour as pre-26).
//
// Scoring model
// ─────────────
//   scoreTeam = 3 × unresisted + 2 × superEff − stackedWeakness + avgAtkPower/40 + avgBST/600
//
//   unresisted      = number of defender types (0–18) hit ≥1× by any member attack
//   superEff        = number of defender types hit ≥2× by any member attack
//   stackedWeakness = Σ tri(k)   where k = # team members weak to a given type
//   avgAtkPower     = mean over members of member's best-damage-% against a
//                     generic Lv50 neutral target. Scales with level + stats, so
//                     stronger / higher-level mons with the same moves rank higher.
//   avgBST          = mean base-stat total as final tiebreaker
// ═══════════════════════════════
function makePartyCalc(TYPES, STATS, gm, dmult, opts) {
  opts = opts || {};
  const MOVE_DATA    = opts.MOVE_DATA;
  const PHYS         = opts.PHYS;
  const LEARNSETS    = opts.LEARNSETS;
  const computeAtk   = opts.computeAttackerStats;
  const dmgRangePct  = opts.damageRangePct;
  const DAMAGE_READY = !!(MOVE_DATA && PHYS && computeAtk && dmgRangePct);

  function bst(n) {
    const s = STATS[n];
    return s ? s[0]+s[1]+s[2]+s[3]+s[4]+s[5] : 300;
  }

  // ─── Coverage ────────────────────────────────────────────────────────────
  function _atkTypes(pm){ return [...pm.types, ...(pm.moves||[]).map(m=>m.type)]; }

  // Types hit for ≥2× by any member (legacy name kept for tests)
  function countOffCov(members) {
    const covered = new Set();
    members.forEach(pm => {
      const at = _atkTypes(pm);
      TYPES.forEach(def => { if(at.some(t=>gm(t,def)>=2)) covered.add(def); });
    });
    return covered.size;
  }

  // Types hit neutral-or-better (≥1×) by any member — the key offensive metric
  function unresistedCov(members) {
    const covered = new Set();
    members.forEach(pm => {
      const at = _atkTypes(pm);
      TYPES.forEach(def => { if(at.some(t=>gm(t,def)>=1)) covered.add(def); });
    });
    return covered.size;
  }

  // Defender is normalised to Lv50 / base 80. Fixed level lets higher-level
  // attackers post bigger % — that's the "stronger mons score higher" signal.
  const _BASELINE_LV = 50, _BASELINE_BASE = 80;
  const _BASELINE_DEF = Math.floor((2*_BASELINE_BASE + 15)*_BASELINE_LV/100 + 5);
  const _BASELINE_HP  = Math.floor((2*_BASELINE_BASE + 15)*_BASELINE_LV/100 + _BASELINE_LV + 10);

  // Per-member profile: computed once then reused across all 18 defender types.
  // Cached on the pm via a non-enumerable slot so one profile survives a full
  // render pass even across scoreTeam → avgAtkPower → bestDamageAgainst calls.
  const _PROFILE_KEY = Symbol('se_dmg_profile');
  function _profile(pm) {
    let p = pm[_PROFILE_KEY];
    if(p) return p;
    const atk = computeAtk(pm);
    if(!atk) return (pm[_PROFILE_KEY] = null);
    let candidates = (pm.moves || []).map(mv => {
      const md = MOVE_DATA[mv.name];
      return { type: mv.type, pow: md ? md[0] : 0 };
    }).filter(c => c.pow > 0);
    if(!candidates.length) candidates = pm.types.map(t => ({ type: t, pow: 60 }));
    const stabSet = new Set(pm.types);
    const lv = parseInt(pm.level) || 50;
    p = { lv, atk, candidates, stabSet, dmgByType: Object.create(null) };
    Object.defineProperty(pm, _PROFILE_KEY, { value: p, configurable: true });
    return p;
  }

  function bestDamageAgainst(pm, defType) {
    if(!DAMAGE_READY) return 0;
    const p = _profile(pm);
    if(!p) return 0;
    if(defType in p.dmgByType) return p.dmgByType[defType];
    let best = 0;
    for(const c of p.candidates) {
      const eff = dmult(c.type, [defType]);
      if(eff === 0) continue;
      const stab = p.stabSet.has(c.type) ? 1.5 : 1;
      const atkStat = PHYS.has(c.type) ? p.atk.atk : p.atk.spa;
      const range = dmgRangePct(p.lv, atkStat, _BASELINE_DEF, _BASELINE_HP, c.pow, stab*eff);
      if(range && range[1] > best) best = range[1];
    }
    p.dmgByType[defType] = best;
    return best;
  }

  function avgAtkPower(members) {
    if(!DAMAGE_READY || !members.length) return 0;
    let total = 0;
    members.forEach(pm => {
      let memberTotal = 0;
      TYPES.forEach(def => { memberTotal += bestDamageAgainst(pm, def); });
      total += memberTotal / TYPES.length;
    });
    return total / members.length;
  }

  // ─── Defensive stacking ──────────────────────────────────────────────────
  function _weakCounts(members) {
    const counts = {};
    members.forEach(pm =>
      TYPES.forEach(at => { if(dmult(at, pm.types) >= 2) counts[at] = (counts[at]||0)+1; })
    );
    return counts;
  }
  function _stackPenalty(counts) {
    return Object.values(counts).reduce((s,k) => s + k*(k-1)/2, 0);
  }

  // ─── Seed / marginal ─────────────────────────────────────────────────────
  function individualScore(pm) {
    const unres = TYPES.filter(def => _atkTypes(pm).some(t=>gm(t,def)>=1)).length;
    const superE = TYPES.filter(def => _atkTypes(pm).some(t=>gm(t,def)>=2)).length;
    const power  = DAMAGE_READY ? TYPES.reduce((s,d)=>s+bestDamageAgainst(pm,d),0) / TYPES.length : 0;
    return unres*3 + superE*2 + power/40 + bst(pm.n)/600;
  }

  function marginalScore(candidate, team) {
    const teamAtk = new Set();
    team.forEach(pm => _atkTypes(pm).forEach(at =>
      TYPES.forEach(def => { if(gm(at,def)>=1) teamAtk.add('U:'+def); if(gm(at,def)>=2) teamAtk.add('S:'+def); })
    ));
    const candAtk = _atkTypes(candidate);
    const newUnres = TYPES.filter(def => !teamAtk.has('U:'+def) && candAtk.some(t=>gm(t,def)>=1)).length;
    const newSup   = TYPES.filter(def => !teamAtk.has('S:'+def) && candAtk.some(t=>gm(t,def)>=2)).length;
    // Stacked-weakness penalty: count team members weak to each of candidate's weaknesses
    let wkPenalty = 0;
    TYPES.forEach(at => {
      if(dmult(at, candidate.types) >= 2) wkPenalty += team.filter(pm=>dmult(at,pm.types)>=2).length;
    });
    const power = DAMAGE_READY ? TYPES.reduce((s,d)=>s+bestDamageAgainst(candidate,d),0) / TYPES.length : 0;
    return newUnres*3 + newSup*2 - wkPenalty + power/40 + bst(candidate.n)/600;
  }

  // ─── Team score ──────────────────────────────────────────────────────────
  function scoreTeam(members) {
    if(!members.length) return 0;
    const unres  = unresistedCov(members);
    const sup    = countOffCov(members);
    const defPen = _stackPenalty(_weakCounts(members));
    const power  = avgAtkPower(members);
    const avgBst = members.reduce((s,pm)=>s+bst(pm.n),0) / members.length;
    return unres*3 + sup*2 - defPen + power/40 + avgBst/600;
  }

  // ─── Greedy builder ──────────────────────────────────────────────────────
  function buildGreedyTeam(pool, seed) {
    const team = [seed];
    const remaining = pool.filter(p=>p!==seed);
    while(team.length < 6 && remaining.length > 0) {
      let best = -Infinity, bestIdx = -1;
      remaining.forEach((p,i) => {
        const s = marginalScore(p, team);
        if(s > best) { best=s; bestIdx=i; }
      });
      if(bestIdx >= 0) { team.push(remaining[bestIdx]); remaining.splice(bestIdx,1); } else break;
    }
    return team;
  }

  function computeSuggestions(pool, maxResults) {
    maxResults = maxResults || 5;
    if(!pool.length) return [];
    const tagged = pool.map((pm,i) => ({...pm, _pi:i}));
    const sorted = [...tagged].sort((a,b) => individualScore(b)-individualScore(a));
    const suggestions = [];
    const seen = new Set();
    for(const seed of sorted) {
      if(suggestions.length >= maxResults) break;
      const team = buildGreedyTeam(tagged, seed);
      const key = team.map(m=>m._pi).sort((a,b)=>a-b).join(',');
      if(seen.has(key)) continue;
      seen.add(key);
      const members = team.map(({_pi, ...pm}) => pm).sort((a,b) => a.n - b.n);
      suggestions.push({ members, score: scoreTeam(members), coverage: countOffCov(members), unresisted: unresistedCov(members) });
    }
    return suggestions.sort((a,b) => b.score-a.score);
  }

  // Simulate teaching `move` to team[memberIdx] across every replace slot
  // (and appending if a slot is free). Returns the best swap by score delta.
  function computeTeachImpact(team, memberIdx, move) {
    const pm = team[memberIdx];
    if(!pm) return null;
    const baseline    = scoreTeam(team);
    const baseUnres   = unresistedCov(team);
    const baseSup     = countOffCov(team);
    const existing    = pm.moves || [];
    if(existing.some(mv => mv.name === move.name)) return null;

    const candidates = [];
    if(existing.length < 4) candidates.push({ replaceIdx: -1, replaced: null });
    existing.forEach((mv,i) => candidates.push({ replaceIdx: i, replaced: mv }));

    let best = null;
    for(const c of candidates) {
      const newMoves = [...existing];
      if(c.replaceIdx === -1) newMoves.push(move);
      else newMoves[c.replaceIdx] = move;
      const newTeam = team.map((m,i) => i===memberIdx ? {...m, moves:newMoves} : m);
      const newScore = scoreTeam(newTeam);
      const newUnres = unresistedCov(newTeam);
      const newSup   = countOffCov(newTeam);
      const result = {
        replaceIdx: c.replaceIdx,
        replaced:   c.replaced,
        scoreDelta: newScore - baseline,
        unresistedDelta: newUnres - baseUnres,
        superDelta: newSup - baseSup,
        coverageLost: 0,
      };
      if(c.replaceIdx >= 0) {
        const oldCoveredSup = new Set();
        team.forEach(m => _atkTypes(m).forEach(at => TYPES.forEach(def => { if(gm(at,def)>=2) oldCoveredSup.add(def); })));
        const newCoveredSup = new Set();
        newTeam.forEach(m => _atkTypes(m).forEach(at => TYPES.forEach(def => { if(gm(at,def)>=2) newCoveredSup.add(def); })));
        oldCoveredSup.forEach(t => { if(!newCoveredSup.has(t)) result.coverageLost++; });
      }
      if(!best || result.scoreDelta > best.scoreDelta) best = result;
    }
    return best;
  }

  // Rank team members by teach-impact for `move`. Members not in canLearnIds
  // (Set of dex numbers) are filtered out.
  function rankTeachTargets(team, move, canLearnIds) {
    const ranked = [];
    team.forEach((pm,idx) => {
      if(!canLearnIds.has(pm.n)) return;
      const impact = computeTeachImpact(team, idx, move);
      if(impact) ranked.push({ memberIdx: idx, impact });
    });
    ranked.sort((a,b) => b.impact.scoreDelta - a.impact.scoreDelta);
    return ranked;
  }

  // Rank pool members by HMs-learnable minus battle cost.
  // canLearn(dexNum, moveName) is supplied by the caller (uses LEARNSETS).
  function computeHMCarriers(pool, ownedHmMoves, canLearn) {
    if(!pool.length || !ownedHmMoves.length) return [];
    return pool.map(pm => {
      const hmList = ownedHmMoves.filter(mv => canLearn(pm.n, mv));
      const battleScore = individualScore(pm);
      const score = hmList.length * 10 - battleScore;
      return { pm, hmsLearnable: hmList.length, hmList, battleScore, score };
    })
    .filter(c => c.hmsLearnable > 0)
    .sort((a,b) => b.score - a.score);
  }

  return {
    // Legacy + new coverage
    bst, countOffCov, unresistedCov,
    // Scoring primitives
    individualScore, marginalScore, scoreTeam,
    // Damage model
    bestDamageAgainst, avgAtkPower,
    // Team builder
    buildGreedyTeam, computeSuggestions,
    // TM planning
    computeTeachImpact, rankTeachTargets,
    // HM Carrier
    computeHMCarriers,
  };
}
