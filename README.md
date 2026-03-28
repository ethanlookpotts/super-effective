# Super Effective — Pokémon Battle Aide

A fast, mobile-first Pokémon battle companion. Designed for one-handed iPhone use mid-battle.

**Live app:** deploy via GitHub Pages — see `CLAUDE.md` for setup.

## What it does

- **Search** any Kanto Pokémon → see type chart, party match-up scores, obtain method
- **Party** tracker with type coverage gap bar (tap gaps to find Pokémon that fill them)
- **Gyms & Elite Four** quick-reference with full teams and tactical tips
- **Where Am I** — browse encounters by location, tap any Pokémon to look it up
- **Add to Party** from the Search tab — instant add or swap out if full
- **Multiple playthroughs** — isolate party/recents per run (Nuzlocke, randomizer, etc.)

## Current game: FireRed / LeafGreen (Gen III · Kanto)

Type chart uses the **Gen III physical/special split** (split is by type, not by move).

## Tech

- Pure HTML + CSS + JS — zero dependencies except Google Fonts
- PokeAPI CDN sprites (graceful offline fallback)
- `localStorage` for all party/playthrough data — stays on your device
- No server, no accounts, no tracking

## Files

```
index.html          main HTML shell
style.css           all styles
js/
  data.js           game data (Pokémon, types, moves, bosses, locations)
  app.js            all app logic
agents/
  pokemon.md        Pokémon data sub-agent spec
CLAUDE.md           build guide for Claude Code sessions
WORKLOG.md          progress log, todos, future ideas
```

## GitHub Pages deployment

1. Push to your branch
2. Repo Settings → Pages → deploy from that branch, root `/`
3. Live at `https://YOUR-USERNAME.github.io/super-effective/`
