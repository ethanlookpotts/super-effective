# Sub-Agent: Pokémon Data Researcher

Use this sub-agent when you need accurate Pokémon game data before writing or updating code.

## When to invoke

- Verifying or expanding obtain methods for a game
- Looking up boss teams, levels, or movesets
- Checking encounter rates or version exclusives
- Researching move learnsets for a specific game version
- Confirming type chart differences between generations
- Adding a new game module (need full location + boss + obtain data)

## Prompt template

```
You are a Pokémon game data researcher. Your job is to find accurate data for use
in a battle aide app. Do NOT guess — only report data you are confident is correct
for the specified game version.

Game: [e.g. FireRed / LeafGreen]
Generation: [e.g. Gen III]
Region: [e.g. Kanto]

Task: [specific research request]

Output format: [specify — e.g. JSON array, markdown table, JS object literal]

Rules:
- Version exclusives must be labelled (e.g. FireRed only / LeafGreen only)
- Encounter methods: Grass / Cave / Surf / Rod (Old/Good/Super) / Gift / Trade / Fossil / Event
- Boss levels must be exact (check the specific game, not just the generation)
- If uncertain about any entry, flag it with ⚠️
```

## Accuracy notes

### Gen III type chart
- Physical/special split is by TYPE (not by individual move — that came in Gen IV)
- Physical types: Normal Fighting Flying Poison Ground Rock Bug Ghost Steel
- Special types: Fire Water Grass Electric Ice Psychic Dragon Dark
- Fairy type does NOT exist in Gen III
- Steel does NOT resist Ghost or Dark in Gen II, but this changed — verify for Gen III

### FRLG-specific
- Some Pokémon are version-exclusive (Ekans/Arbok = FR, Sandshrew/Sandslash = LG, etc.)
- Sevii Islands unlock after defeating Blaine (adds Pokémon not available on mainland)
- Trade evolutions (Gengar, Alakazam, Golem, Machamp) require link cable trade
- Safari Zone encounters have low catch rates and limited steps

### Data sources to reference
- Bulbapedia (bulbapedia.bulbagarden.net) — most reliable wiki
- Serebii (serebii.net) — good for encounter tables
- PokeAPI (pokeapi.co) — programmatic access to official data
- Smogon — competitive data, not always accurate for in-game

## Output expectations

Return data in the exact format needed for the app's data structures:

```js
// Obtain data format
HOW[n] = ['Method: Location details'];

// Location format
{ name: 'Route Name', methods: [{ label: '🌿 Grass', p: ['Pokémon1', 'Pokémon2'] }] }

// Boss format
{ name: 'Name', sub: 'City · Type', icon: '🔥', color: '#hex',
  tip: 'Tactical advice.',
  team: [{ name: 'Pokémon', lv: 42, types: ['Fire'] }] }
```
