// ═══════════════════════════════
// NATURES — Gen III
// [boostStat, reduceStat]: keys are 'atk'|'def'|'spa'|'spd'|'spe'|null
// ═══════════════════════════════
const NATURES = {
  Hardy:   [null,null],   Lonely:  ['atk','def'],  Brave:   ['atk','spe'],
  Adamant: ['atk','spa'], Naughty: ['atk','spd'],  Bold:    ['def','atk'],
  Docile:  [null,null],   Relaxed: ['def','spe'],  Impish:  ['def','spa'],
  Lax:     ['def','spd'], Timid:   ['spe','atk'],  Hasty:   ['spe','def'],
  Serious: [null,null],   Jolly:   ['spe','spa'],  Naive:   ['spe','spd'],
  Modest:  ['spa','atk'], Mild:    ['spa','def'],  Quiet:   ['spa','spe'],
  Bashful: [null,null],   Rash:    ['spa','spd'],  Calm:    ['spd','atk'],
  Gentle:  ['spd','def'], Sassy:   ['spd','spe'],  Careful: ['spd','spa'],
  Quirky:  [null,null],
};

const NATURE_NAMES = Object.keys(NATURES).sort();

function natureMult(nature, stat){
  if(!nature || !NATURES[nature]) return 1;
  const [boost, reduce] = NATURES[nature];
  if(boost === stat) return 1.1;
  if(reduce === stat) return 0.9;
  return 1;
}

// Summary string for the combat-relevant stats affected by a nature (e.g. "+ATK −SpA")
function natureSummary(nature){
  if(!nature || !NATURES[nature]) return '';
  const [boost, reduce] = NATURES[nature];
  const labels = {atk:'ATK', def:'DEF', spa:'SpA', spd:'SpD', spe:'SPE'};
  if(!boost && !reduce) return 'Neutral';
  const parts = [];
  if(boost) parts.push(`+${labels[boost]}`);
  if(reduce) parts.push(`\u2212${labels[reduce]}`);
  return parts.join(' ');
}

// Gen III stat formula (non-HP stats)
function computeStat(base, iv, ev, level, mult){
  iv = iv || 0; ev = ev || 0; level = level || 50; mult = mult || 1;
  return Math.floor(Math.floor((2*base + iv + Math.floor(ev/4)) * level/100 + 5) * mult);
}

// Gen III HP formula
function computeHP(base, iv, ev, level){
  iv = iv || 0; ev = ev || 0; level = level || 50;
  return Math.floor((2*base + iv + Math.floor(ev/4)) * level/100 + level + 10);
}

// Compute Atk, SpA, Spe for a party member using advStats if available.
// Returns {atk, spa, spe, precise} — precise=true when actual stats were entered.
function computeAttackerStats(pm){
  const base = STATS[pm.n];
  if(!base) return null;
  const lv = parseInt(pm.level) || 50;
  const adv = pm.advStats;
  const hasAdv = adv && Object.values(adv).some(v => v !== '' && v != null);
  if(hasAdv){
    const nat = adv.nature || null;
    return {
      atk: computeStat(base[1], parseInt(adv.ivAtk)||0, parseInt(adv.evAtk)||0, lv, natureMult(nat,'atk')),
      spa: computeStat(base[3], parseInt(adv.ivSpa)||0, parseInt(adv.evSpa)||0, lv, natureMult(nat,'spa')),
      spe: computeStat(base[5], parseInt(adv.ivSpe)||0, parseInt(adv.evSpe)||0, lv, natureMult(nat,'spe')),
      precise: true,
    };
  }
  // Default: base stats with representative IVs (15), no EVs, neutral nature
  return {
    atk: computeStat(base[1], 15, 0, lv, 1),
    spa: computeStat(base[3], 15, 0, lv, 1),
    spe: computeStat(base[5], 15, 0, lv, 1),
    precise: false,
  };
}

// Estimate a single enemy stat (non-HP): 0 EVs, 15 IVs, neutral nature
function estimateEnemyStat(baseVal, level){
  return computeStat(baseVal, 15, 0, level || 50, 1);
}

// Estimate enemy HP: 0 EVs, 15 IVs
function estimateEnemyHP(baseHP, level){
  return computeHP(baseHP, 15, 0, level || 50);
}

// Damage range as % of enemy HP: [minPct, maxPct]
// eff: combined type-effectiveness × STAB multiplier
// Returns null for status moves (power=0) or immune matchups (eff=0)
function damageRangePct(atkLevel, atkStat, defStat, defHP, power, eff){
  if(!power || power <= 0 || !eff || eff === 0) return null;
  const lf = Math.floor(2*atkLevel/5 + 2);
  const raw = Math.floor(lf * power * atkStat / defStat / 50) + 2;
  const withEff = Math.floor(raw * eff);
  const minDmg = Math.floor(withEff * 217/255);
  const maxDmg = withEff;
  return [Math.floor(minDmg/defHP*100), Math.floor(maxDmg/defHP*100)];
}
