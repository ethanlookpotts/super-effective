# Agent Prompt: Pokémon Data Researcher

Use this prompt when you need accurate Pokémon game data before writing or updating code.

## When to use

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
- Boss levels must be exact for the specified game, not just the generation
- If uncertain about any entry, flag it with ⚠️
```

## Accuracy notes

### Gen III type chart
- Physical/special split is by TYPE (not by individual move — that came in Gen IV)
- Physical types: Normal Fighting Flying Poison Ground Rock Bug Ghost Steel
- Special types: Fire Water Grass Electric Ice Psychic Dragon Dark
- Fairy type does NOT exist in Gen III

### FRLG-specific
- Some Pokémon are version-exclusive (e.g. Ekans/Arbok = FireRed, Sandshrew/Sandslash = LeafGreen)
- Sevii Islands unlock after defeating Blaine — adds Pokémon not available on mainland
- Trade evolutions (Gengar, Alakazam, Golem, Machamp) require link cable trade
- Safari Zone encounters have low catch rates and limited steps

### Reliable sources
- Bulbapedia (bulbapedia.bulbagarden.net) — most accurate wiki
- Serebii (serebii.net) — good for encounter tables
- PokeAPI (pokeapi.co) — programmatic access to official data

When researching from these sites, prefer using `browser_navigate` to open the page and `browser_snapshot` to read the content as structured text. This is more reliable than text search for dense tables (encounter rates, learnsets, boss movesets). Use `browser_take_screenshot filename="screenshots/..."` to capture a complex table for reference if needed. Always save screenshots to `screenshots/` (git-ignored), never to the repo root.

## Expected output formats

```js
// Obtain data
HOW[n] = ['Method: Location details'];

// Location entry
{ name: 'Route Name', methods: [{ label: '🌿 Grass', p: ['Pokémon1', 'Pokémon2'] }] }

// Boss entry
{ name: 'Name', sub: 'City · Type', icon: '🔥', color: '#hex',
  tip: 'Tactical advice.',
  team: [{ name: 'Pokémon', lv: 42, types: ['Fire'] }] }
```
