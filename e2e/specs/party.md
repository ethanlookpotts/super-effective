# Party Page

## Add to party

1. Go to the app (with empty localStorage)
2. Search for "Pikachu" and select it from the dropdown
3. Click the "ADD TO PARTY" button
4. Switch to the Party tab
5. Expect: a filled party slot showing "Pikachu"

## IN PARTY button navigates to Party tab

1. Go to the app (with empty localStorage)
2. Search for "Pikachu" and add it to the party
3. Search for "Pikachu" again and select it
4. Expect: the button reads "✓ IN PARTY — VIEW PARTY ›"
5. Click the button
6. Expect: the Party tab is now active

## Edit modal sections are collapsed and disabled until Pokémon selected

1. Go to the Party tab and open the edit modal for an empty slot
2. Expect: "MOVES" section header is visible but in a disabled/greyed state
3. Expect: "ADVANCED STATS" section header is visible but in a disabled/greyed state
4. Expect: clicking either section header does nothing
5. Search for "Pikachu" and select it
6. Expect: both section headers are now interactive (not greyed out)
7. Click the "MOVES" header
8. Expect: the move picker expands
9. Click the "ADVANCED STATS" header
10. Expect: the advanced stats inputs expand (Level, Nature, IV/EV grid)

## Advanced stats entry computes and saves stats

1. Go to the Party tab and open the edit modal for an empty slot
2. Search for "Pikachu" and select it
3. Open the "ADVANCED STATS" section
4. Enter Level 50, choose Timid nature, set Attack IV to 31
5. Expect: the computed stats line updates (shows ATK · SpA · Spe values)
6. Click SAVE / ADD TO PARTY
7. Reopen the edit modal for that slot
8. Open the "ADVANCED STATS" section
9. Expect: Level 50, Timid, and IV 31 are still present

## Move picker shows learnset instantly (no loading state)

1. Go to the Party tab and open the edit modal for a new slot
2. Search for "Growlithe" and select it
3. Open the "MOVES" section
4. Expect: the move list is immediately visible — no "LOADING MOVES…" text
5. Expect: "Roar" is visible in the move list
6. Expect: "Take Down" is visible in the move list

## Hidden Power type selection

1. Go to the Party tab and open the edit modal for a new slot
2. Search for "Pikachu" and select it (Pikachu can learn Hidden Power)
3. Expect: "Hidden Power" is visible in the move list with a rainbow "HP" badge
4. Click "Hidden Power"
5. Expect: a type picker row appears below it (labelled "Select Hidden Power type")
6. Click "Electric" in the type picker
7. Expect: "Hidden Power" is now shown as picked with an Electric type badge
8. Expect: the type picker row is gone
