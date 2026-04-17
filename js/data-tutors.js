// ═══════════════════════════════
// FRLG MOVE TUTORS — 18 moves
// ═══════════════════════════════
// Source: PokéAPI firered-leafgreen version group (tutor method) for the move list,
// cross-referenced with pret/pokefirered decompilation for location mapping where
// unambiguous. All 18 tutor moves below are ONE-TIME per save file and FREE.
// Additional NPCs (Move Reminder, Move Deleter) are listed separately.
//
// Learnability is derived from LEARNSETS (already includes tutor moves), so this
// file only carries the move list + location metadata for the TMs & HMs page.
// ═══════════════════════════════
const MOVE_TUTORS = [
  {move:'Mega Punch',   type:'Normal',  cat:'phy', loc:'Route 4 (house by Mt. Moon)'},
  {move:'Mega Kick',    type:'Normal',  cat:'phy', loc:'Route 4 (house by Mt. Moon)'},
  {move:'Swords Dance', type:'Normal',  cat:'sta', loc:'Seven Island (house in town)'},
  {move:'Body Slam',    type:'Normal',  cat:'phy', loc:'Four Island (House 1)'},
  {move:'Double-Edge',  type:'Normal',  cat:'phy', loc:'Victory Road (2F)'},
  {move:'Counter',      type:'Fighting',cat:'phy', loc:'Celadon Dept. Store (TV section)'},
  {move:'Seismic Toss', type:'Fighting',cat:'phy', loc:'Pewter City Museum (1F)'},
  {move:'Thunder Wave', type:'Electric',cat:'sta', loc:'Silph Co. (Saffron City)'},
  {move:'Mimic',        type:'Normal',  cat:'sta', loc:"Saffron City — Copycat's House (bring Poké Doll)"},
  {move:'Metronome',    type:'Normal',  cat:'sta', loc:'Cinnabar Island Pokémon Lab'},
  {move:'Soft-Boiled',  type:'Normal',  cat:'sta', loc:'Celadon City (house w/ pool, needs Surf) — Chansey only'},
  {move:'Dream Eater',  type:'Psychic', cat:'spe', loc:'Viridian City (house, SW area)'},
  {move:'Explosion',    type:'Normal',  cat:'phy', loc:'Mt. Ember (Exterior, Island 1)'},
  {move:'Rock Slide',   type:'Rock',    cat:'phy', loc:'Rock Tunnel (B1F)'},
  {move:'Substitute',   type:'Normal',  cat:'sta', loc:'Fuchsia City (house)'},
  {move:'Frenzy Plant', type:'Grass',   cat:'spe', loc:'Two Island — Cape Brink (Venusaur, max friendship)'},
  {move:'Blast Burn',   type:'Fire',    cat:'spe', loc:'Two Island — Cape Brink (Charizard, max friendship)'},
  {move:'Hydro Cannon', type:'Water',   cat:'spe', loc:'Two Island — Cape Brink (Blastoise, max friendship)'},
];

// Tutor numbering used for inventory-style tracking ("teach flag"). Format: 'MT01'..'MT18'.
MOVE_TUTORS.forEach((t,i) => { t.num = 'MT' + String(i+1).padStart(2,'0'); t.tmType = 'tutor'; });

// Other utility NPCs (not inventory-tracked, shown for reference)
const UTILITY_NPCS = [
  {label:'Move Reminder (Move Maniac)', loc:'Two Island (house near Pokémon Center)', cost:'1 Heart Scale', note:'Re-teaches any level-up move — repeatable'},
  {label:'Move Deleter',                 loc:'Fuchsia City (house near Safari Zone gate)', cost:'Free',          note:'Deletes any move, including HMs — repeatable'},
];
