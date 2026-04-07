// ═══════════════════════════════
// PARTY SUGGESTION ENGINE — pure module
// Usage (browser): makePartyCalc(TYPES, STATS, gm, dmult)
// Usage (Node):    load via vm, then call makePartyCalc(TYPES, STATS, gm, dmult)
//
// NOTE: Level is not factored into suggestions. Real computed stats require
// IVs/EVs/nature/level (backlog item). BST is used as a proxy for overall strength.
// ═══════════════════════════════
function makePartyCalc(TYPES, STATS, gm, dmult) {

  function bst(n) {
    const s = STATS[n];
    return s ? s[0]+s[1]+s[2]+s[3]+s[4]+s[5] : 300;
  }

  // Count types the team hits for 2× or more (including move types)
  function countOffCov(members) {
    const covered = new Set();
    members.forEach(pm => {
      const atkTypes = [...pm.types, ...(pm.moves||[]).map(m=>m.type)];
      TYPES.forEach(def => { if(atkTypes.some(at=>gm(at,def)>=2)) covered.add(def); });
    });
    return covered.size;
  }

  // Score for a single Pokémon as a greedy seed candidate
  function individualScore(pm) {
    const cov = TYPES.filter(def => pm.types.some(at=>gm(at,def)>=2)).length;
    return cov * 3 + bst(pm.n) / 600;
  }

  // Marginal value of adding candidate to an existing team:
  //   +3 per new type covered, −(stacked weakness count) for each shared vulnerable type, +BST tiebreaker
  function marginalScore(candidate, team) {
    const teamCov = new Set();
    team.forEach(pm => pm.types.forEach(at =>
      TYPES.forEach(def => { if(gm(at,def)>=2) teamCov.add(def); })
    ));
    const newCov = TYPES.filter(def =>
      !teamCov.has(def) && candidate.types.some(at=>gm(at,def)>=2)
    ).length;
    // For each type the candidate is weak to, penalise by how many existing
    // team members are also weak to it (punishes stacking vulnerabilities)
    let weakPenalty = 0;
    TYPES.forEach(at => {
      if(dmult(at, candidate.types) >= 2)
        weakPenalty += team.filter(pm=>dmult(at,pm.types)>=2).length;
    });
    return newCov * 3 - weakPenalty + bst(candidate.n) / 600;
  }

  // Final team score used to rank suggestions
  function scoreTeam(members) {
    // Offensive coverage (type + moves)
    const covered = new Set();
    members.forEach(pm => {
      const atkTypes = [...pm.types, ...(pm.moves||[]).map(m=>m.type)];
      TYPES.forEach(def => { if(atkTypes.some(at=>gm(at,def)>=2)) covered.add(def); });
    });
    const offScore = covered.size * 3;
    // Stacked weakness penalty: triangular number per shared vulnerable type
    // 1 weak = 0, 2 weak = 1, 3 weak = 3, 4 weak = 6 …
    const wkCounts = {};
    members.forEach(pm =>
      TYPES.forEach(at => { if(dmult(at,pm.types)>=2) wkCounts[at]=(wkCounts[at]||0)+1; })
    );
    const defPenalty = Object.values(wkCounts).reduce((s,k)=>s+k*(k-1)/2, 0);
    // Average BST as tiebreaker
    const avgBst = members.reduce((s,pm)=>s+bst(pm.n),0) / members.length;
    return offScore - defPenalty + avgBst / 600;
  }

  // Build one greedy team starting from seed
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

  // Generate up to maxResults diverse suggestions from pool, sorted by score
  function computeSuggestions(pool, maxResults) {
    maxResults = maxResults || 5;
    if(!pool.length) return [];
    // Tag each pool member with its index for deduplication
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
      // Strip internal tag, sort members by dex number for consistent display
      const members = team.map(({_pi, ...pm}) => pm).sort((a,b) => a.n - b.n);
      suggestions.push({ members, score: scoreTeam(members), coverage: countOffCov(members) });
    }
    return suggestions.sort((a,b) => b.score-a.score);
  }

  return { bst, countOffCov, individualScore, marginalScore, scoreTeam, buildGreedyTeam, computeSuggestions };
}

