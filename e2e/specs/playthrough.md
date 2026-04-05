# Playthrough Menu

## First-run game gate

1. Clear localStorage (no saved playthroughs)
2. Open the app
3. Expect: a full-screen "SUPER EFFECTIVE — CHOOSE YOUR GAME TO BEGIN" overlay is visible
4. Expect: game buttons for FireRed and LeafGreen are shown under a "GEN III · KANTO" heading
5. Expect: the normal app content (search, nav) is not visible/interactive behind the gate
6. Click "FireRed"
7. Expect: the gate disappears and the app loads normally
8. Expect: the masthead shows "🔴 FIRERED" as the game title

## Game selection on new run

1. Go to the app (existing playthrough already present)
2. Click the run-switcher button in the masthead
3. Click "＋ NEW RUN"
4. Expect: a game picker appears with FireRed and LeafGreen buttons (and a ← BACK button)
5. Click "LeafGreen"
6. Expect: a new playthrough is created, the menu closes, and a toast confirms
7. Expect: the masthead now shows "🟢 LEAFGREEN"

## Rename a playthrough

1. Go to the app
2. Click the run-switcher button in the masthead
3. Expect: each playthrough row shows a ✏ edit button (not a bare input field)
4. Click the ✏ button on the active playthrough
5. Expect: a text input appears pre-filled with the current name
6. Clear the input, type "NUZLOCKE", press Enter
7. Close the menu
8. Expect: the masthead button now reads "NUZLOCKE"

## Version-exclusive obtain filtering

1. Go to the app with a FireRed playthrough active
2. Search for "Ekans"
3. Expect: the HOW TO OBTAIN section shows the Ekans route (contains "FireRed")
4. Switch to a LeafGreen playthrough (or create one)
5. Search for "Ekans"
6. Expect: the HOW TO OBTAIN section shows "Not obtainable in this version"
7. Search for "Sandshrew"
8. Expect: Sandshrew's obtain entry IS shown (it's LeafGreen-exclusive)
