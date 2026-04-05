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

## Move picker shows learnset instantly (no loading state)

1. Go to the Party tab and open the edit modal for a new slot
2. Search for "Growlithe" and select it
3. Expect: the move list is immediately visible — no "LOADING MOVES…" text
4. Expect: "Roar" is visible in the move list
5. Expect: "Take Down" is visible in the move list

## Hidden Power type selection

1. Go to the Party tab and open the edit modal for a new slot
2. Search for "Pikachu" and select it (Pikachu can learn Hidden Power)
3. Expect: "Hidden Power" is visible in the move list with a rainbow "HP" badge
4. Click "Hidden Power"
5. Expect: a type picker row appears below it (labelled "Select Hidden Power type")
6. Click "Electric" in the type picker
7. Expect: "Hidden Power" is now shown as picked with an Electric type badge
8. Expect: the type picker row is gone
