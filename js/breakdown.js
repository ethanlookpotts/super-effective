// ═══════════════════════════════
// SPRITE HELPERS
// ═══════════════════════════════
function spriteUrl(n){
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${n}.png`;
}
function artUrl(n){
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${n}.png`;
}

// Apply ability-based modifiers on top of the type chart result.
// m = raw dmult value, atkType = the attacking move's type, defN = dex number of defender
function applyAbilityMod(m, atkType, defN){
  const mod = getAbilityMod(defN);
  if(!mod) return m;
  if(mod.immune && mod.immune.includes(atkType)) return 0;
  if(mod.resist && mod.resist[atkType]) return m * mod.resist[atkType];
  return m;
}

// ═══════════════════════════════
// TYPE / MOVE BREAKDOWN SHEET
// ═══════════════════════════════
function bdOvClick(e){ if(e.target===document.getElementById('bd-overlay')) closeBreakdown(); }
function closeBreakdown(){ document.getElementById('bd-overlay').classList.remove('open'); }

function _multClass(m){
  if(m===0) return 'zero'; if(m>=2) return 'good'; if(m<1) return 'bad'; return 'neutral';
}
function _multLabel(m){
  if(m===0) return '0× — Immune';
  if(m>=4) return m+'× — Super Effective';
  if(m>=2) return m+'× — Super Effective';
  if(m<=.25) return m+'× — Barely Resisted';
  if(m<1) return m+'× — Resisted';
  return m+'× — Neutral';
}
function _multResultClass(m){
  if(m===0) return 'r0x'; if(m>=4) return 'r4x'; if(m>=2) return 'r2x'; if(m<1) return 'rhalf'; return '';
}
function _fmtM(m){ return m+'×'; }

// Show why an attacking type hits the defending Pokémon as it does
function showTypeBreakdown(atkType, defN){
  const poke = POKEMON.find(p=>p.n===defN);
  if(!poke) return;
  const mod = getAbilityMod(defN);
  const typeProduct = dmult(atkType, poke.types);
  const final = applyAbilityMod(typeProduct, atkType, defN);

  document.getElementById('bd-ttl').textContent = atkType.toUpperCase()+' → '+poke.name.toUpperCase();
  let html = '';

  // Per-type rows
  html += `<div class="bd-section"><div class="bd-lbl">TYPE MATCHUP</div>`;
  poke.types.forEach(defType=>{
    const m = gm(atkType, defType);
    html += `<div class="bd-row">
      <span class="tb sm t-${atkType}">${atkType}</span>
      <span class="bd-arrow">→</span>
      <span class="tb sm t-${defType}">${defType}</span>
      <span class="bd-eq">=</span>
      <span class="bd-val ${_multClass(m)}">${_fmtM(m)}</span>
    </div>`;
  });
  if(poke.types.length>1){
    html += `<div class="bd-product">${poke.types.map(t=>_fmtM(gm(atkType,t))).join(' × ')} = ${_fmtM(typeProduct)}</div>`;
  }
  html += `</div>`;

  // Ability section
  if(mod && (mod.immune&&mod.immune.includes(atkType) || mod.resist&&mod.resist[atkType])){
    const multi = mod.multi ? ' <span style="color:var(--text3);font-size:9px">(may vary)</span>' : '';
    if(mod.immune && mod.immune.includes(atkType)){
      html += `<div class="bd-ability">
        <div class="bd-ability-name">Ability: ${mod.name}${multi}</div>
        <div class="bd-ability-note">${mod.name} grants full immunity to ${atkType} moves.<br>${_fmtM(typeProduct)} × 0 = <strong>0×</strong></div>
      </div>`;
    } else if(mod.resist && mod.resist[atkType]){
      html += `<div class="bd-ability">
        <div class="bd-ability-name">Ability: ${mod.name}${multi}</div>
        <div class="bd-ability-note">${mod.name} halves ${atkType} damage.<br>${_fmtM(typeProduct)} × ${mod.resist[atkType]} = <strong>${_fmtM(final)}</strong></div>
      </div>`;
    }
  } else if(mod){
    html += `<div style="font-size:11px;color:var(--text3);margin:6px 0 10px;">Ability <strong>${mod.name}</strong> doesn't affect ${atkType} type.</div>`;
  }

  // Result
  html += `<div class="bd-result">
    <div><div class="bd-result-lbl">RESULT</div><div class="bd-result-desc">${_multLabel(final)}</div></div>
    <div class="bd-result-val ${_multResultClass(final)}">${_fmtM(final)}</div>
  </div>`;

  document.getElementById('bd-body').innerHTML = html;
  document.getElementById('bd-overlay').classList.add('open');
}

// Show why a specific move from a party member hits the enemy as it does
function showMoveBreakdown(moveName, moveType, defN, pmN){
  const defPoke = POKEMON.find(p=>p.n===defN);
  const pmPoke = POKEMON.find(p=>p.n===pmN);
  if(!defPoke || !pmPoke) return;
  const mod = getAbilityMod(defN);
  const typeProduct = dmult(moveType, defPoke.types);
  const afterAbility = applyAbilityMod(typeProduct, moveType, defN);
  const stab = pmPoke.types.includes(moveType);
  const final = afterAbility * (stab ? 1.5 : 1);
  const phys = PHYS.has(moveType);

  document.getElementById('bd-ttl').textContent = moveName.toUpperCase()+' → '+defPoke.name.toUpperCase();
  let html = '';

  // Move info line with power / accuracy / effect
  const md = MOVE_DATA[moveName];
  const pow = md ? md[0] : null;
  const acc = md ? md[1] : null;
  const effNote = md ? md[2] : null;
  let metaItems = [];
  if(pow > 0) metaItems.push(`<div class="bd-meta-item">PWR <span>${pow}</span></div>`);
  if(acc > 0 && acc < 100) metaItems.push(`<div class="bd-meta-item">ACC <span>${acc}%</span></div>`);
  else if(acc === 0 && pow > 0) metaItems.push(`<div class="bd-meta-item">ACC <span>∞</span></div>`);
  if(effNote) metaItems.push(`<div class="bd-meta-item">EFFECT <span>${effNote}</span></div>`);
  metaItems.push(`<div class="bd-meta-item" style="margin-left:auto;">CAT <span style="color:${phys?'#c08030':'#5080b8'}">${phys?'PHY':'SPE'}</span></div>`);

  html += `<div style="display:flex;align-items:center;gap:7px;margin-bottom:8px;">
    <span class="tb t-${moveType}">${moveType}</span>
    <span style="font-family:var(--fp);font-size:6.5px;color:var(--text2);flex:1;">${moveName}</span>
  </div>
  <div class="bd-move-meta">${metaItems.join('')}</div>`;

  // Type matchup rows
  html += `<div class="bd-section"><div class="bd-lbl">TYPE MATCHUP</div>`;
  defPoke.types.forEach(defType=>{
    const m = gm(moveType, defType);
    html += `<div class="bd-row">
      <span class="tb sm t-${moveType}">${moveType}</span>
      <span class="bd-arrow">→</span>
      <span class="tb sm t-${defType}">${defType}</span>
      <span class="bd-eq">=</span>
      <span class="bd-val ${_multClass(m)}">${_fmtM(m)}</span>
    </div>`;
  });
  if(defPoke.types.length>1){
    html += `<div class="bd-product">${defPoke.types.map(t=>_fmtM(gm(moveType,t))).join(' × ')} = ${_fmtM(typeProduct)}</div>`;
  }
  html += `</div>`;

  // Ability section
  if(mod && (mod.immune&&mod.immune.includes(moveType) || mod.resist&&mod.resist[moveType])){
    const multi = mod.multi ? ' <span style="color:var(--text3);font-size:9px">(may vary)</span>' : '';
    if(mod.immune && mod.immune.includes(moveType)){
      html += `<div class="bd-ability">
        <div class="bd-ability-name">Ability: ${mod.name}${multi}</div>
        <div class="bd-ability-note">${defPoke.name}'s ${mod.name} grants immunity to ${moveType}.<br>${_fmtM(typeProduct)} → <strong>0×</strong></div>
      </div>`;
    } else if(mod.resist && mod.resist[moveType]){
      html += `<div class="bd-ability">
        <div class="bd-ability-name">Ability: ${mod.name}${multi}</div>
        <div class="bd-ability-note">${defPoke.name}'s ${mod.name} halves ${moveType} damage.<br>${_fmtM(typeProduct)} × ${mod.resist[moveType]} = <strong>${_fmtM(afterAbility)}</strong></div>
      </div>`;
    }
  }

  // STAB
  if(stab){
    html += `<div class="bd-section"><div class="bd-lbl">STAB (SAME-TYPE ATTACK BONUS)</div>
      <div class="bd-row">
        <span style="font-size:11px;color:var(--text2);flex:1">${pmPoke.name} is ${moveType} type — 1.5× bonus</span>
        <span class="bd-val good">${_fmtM(afterAbility)} × 1.5 = ${_fmtM(final)}</span>
      </div>
    </div>`;
  }

  // Result
  html += `<div class="bd-result">
    <div><div class="bd-result-lbl">RESULT</div><div class="bd-result-desc">${_multLabel(final)}</div></div>
    <div class="bd-result-val ${_multResultClass(final)}">${_fmtM(final)}</div>
  </div>`;

  document.getElementById('bd-body').innerHTML = html;
  document.getElementById('bd-overlay').classList.add('open');
}
