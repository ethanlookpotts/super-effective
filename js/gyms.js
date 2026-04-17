// ═══════════════════════════════
// GYMS PAGE
// ═══════════════════════════════
function renderGyms(){
  const starterLabels = {bulbasaur:'🌿 Bulbasaur',charmander:'🔥 Charmander',squirtle:'💧 Squirtle'};
  const rivalStarter = (activePt() && activePt().rivalStarter) || 'bulbasaur';
  // Chronological order: rival encounters interleaved with gym leaders / E4
  const order = [
    {type:'rival',i:0},  // Route 22 (before Brock)
    {type:'boss',i:0},   // Brock
    {type:'rival',i:1},  // Cerulean / Nugget Bridge
    {type:'boss',i:1},   // Misty
    {type:'rival',i:2},  // S.S. Anne
    {type:'boss',i:2},   // Lt. Surge
    {type:'rival',i:3},  // Pokémon Tower
    {type:'boss',i:3},   // Erika
    {type:'boss',i:4},   // Koga
    {type:'rival',i:4},  // Silph Co.
    {type:'boss',i:5},   // Sabrina
    {type:'boss',i:6},   // Blaine
    {type:'boss',i:7},   // Giovanni
    {type:'rival',i:5},  // Route 22 (pre-League)
    {type:'boss',i:8},   // Lorelei
    {type:'boss',i:9},   // Bruno
    {type:'boss',i:10},  // Agatha
    {type:'boss',i:11},  // Lance
    {type:'boss',i:12},  // Rival Gary — Champion
  ];
  const starterBar = `
    <div class="rival-hd">
      <div class="rival-hd-title">🏁 GARY — YOUR STARTER</div>
      <div class="rival-starter-bar">
        ${['bulbasaur','charmander','squirtle'].map(s=>`
          <button class="starter-btn s-${s}${rivalStarter===s?' active':''}" onclick="setRivalStarter('${s}')">${starterLabels[s]}</button>
        `).join('')}
      </div>
    </div>`;
  const cards = order.map(entry=>{
    if(entry.type==='rival'){
      const r = RIVALS[entry.i];
      return `
        <div class="gym-card" id="rc-${entry.i}">
          <div class="gym-hd" role="button" aria-label="Expand ${r.location}" onclick="document.getElementById('rc-${entry.i}').classList.toggle('open')">
            <div class="gym-icon" style="background:#ffc93c22;border-color:#ffc93c44;">${r.icon}</div>
            <div class="gym-info"><div class="gym-name">${r.location}</div><div class="gym-sub">${r.sub}</div></div>
            <div class="gym-arr">▾</div>
          </div>
          <div class="gym-body">
            <div class="gym-team">${r.teams[rivalStarter].map(p=>`<div class="gym-poke" role="button" aria-label="${p.name} Lv.${p.lv}" onclick="goSearch('${p.name}')">
              <span class="gym-poke-lv">Lv.${p.lv}</span>
              <span class="gym-poke-name">${p.name}</span>
              <span class="pbadges">${p.types.map(t=>`<span class="tb sm t-${t}">${t}</span>`).join('')}</span>
            </div>`).join('')}</div>
          </div>
        </div>`;
    } else {
      const boss = BOSSES[entry.i];
      return `
        <div class="gym-card" id="gc-${entry.i}">
          <div class="gym-hd" role="button" aria-label="Expand ${boss.name}" onclick="document.getElementById('gc-${entry.i}').classList.toggle('open')">
            <div class="gym-icon" style="background:${boss.color}22;border-color:${boss.color}44;">${boss.icon}</div>
            <div class="gym-info"><div class="gym-name">${boss.name}</div><div class="gym-sub">${boss.sub}</div></div>
            <div class="gym-arr">▾</div>
          </div>
          <div class="gym-body">
            <div class="gym-team">${boss.team.map(p=>`<div class="gym-poke" role="button" aria-label="${p.name} Lv.${p.lv}" onclick="goSearch('${p.name}')">
              <span class="gym-poke-lv">Lv.${p.lv}</span>
              <span class="gym-poke-name">${p.name}</span>
              <span class="pbadges">${p.types.map(t=>`<span class="tb sm t-${t}">${t}</span>`).join('')}</span>
            </div>`).join('')}</div>
            <div class="gym-tip">💡 ${boss.tip}</div>
          </div>
        </div>`;
    }
  }).join('');
  document.getElementById('gyms-scroll').innerHTML = starterBar + cards;
}
