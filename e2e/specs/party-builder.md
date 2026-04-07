# Party Builder — E2E Spec

## Overview
The Party Builder extends the My Party page with a PC Box (unlimited Pokémon storage) and an
automated party suggestion flow that scores candidate teams by type coverage.

## Scenarios

### 1. Send Pokémon to PC from Search
- Open the app and navigate to Search
- Search for "Pikachu" and tap it to open its detail card
- The detail card shows two buttons: "➕ ADD TO PARTY" and "📦 SEND TO PC"
- Tap "SEND TO PC"
- A toast appears: "Sent to PC Box"
- Navigating to My Party shows the PC Box section with Pikachu listed

### 2. PC Box renders with correct count
- With at least one Pokémon in PC, navigate to My Party
- A "📦 PC BOX" header row is visible below the party grid
- The count label "(N CAUGHT)" reflects the number of PC Pokémon
- Tap the header to collapse; tap again to expand

### 3. Move Pokémon from PC to party (party not full)
- With at least one Pokémon in PC and fewer than 6 in the party
- Tap the "→ PARTY" button on a PC slot
- The Pokémon disappears from the PC grid
- It appears in the next empty party slot
- A toast "Moved to party" appears

### 4. Move Pokémon from PC to party (party full — swap)
- With 6 Pokémon in the active party and at least one in PC
- Tap "→ PARTY" on a PC slot
- The PC swap modal opens: "PARTY FULL — TAP A POKÉMON TO REPLACE IT"
- Tap one of the party members in the modal
- That party member moves to PC; the PC Pokémon takes its slot
- Toast "Moved to party" appears

### 5. Remove Pokémon from PC (inline confirm)
- With at least one Pokémon in the PC grid
- Tap the "✕" button on a PC slot
- The slot switches to a REMOVE? YES / NO confirmation state
- Tap NO → slot returns to normal without removing
- Tap ✕ again, then tap YES → the Pokémon is removed from the PC grid

### 6. "IN PC BOX" button when Pokémon already in PC
- Send a Pokémon to PC from Search
- Navigate back to Search and view the same Pokémon's detail card
- The second button now reads "📦 IN PC BOX" and is inactive (not tappable)

### 7. Suggest My Party button appears with 6+ Pokémon in PC
- With fewer than 6 Pokémon in PC, no "SUGGEST MY PARTY" button is shown on the party page
- Add a 6th Pokémon to PC
- The "✨ SUGGEST MY PARTY" button appears below the party grid/coverage bar

### 8. Party suggestion modal — basic flow
- With at least 6 Pokémon in PC, tap "✨ SUGGEST MY PARTY"
- The suggestion modal opens titled "✨ PARTY SUGGESTIONS"
- Option 1 is expanded and shows: 6 Pokémon sprites, a score label "N/18 COVERED",
  a mini coverage bar, and a "USE THIS PARTY" button
- Options 2 and 3 (if available) are collapsed; tapping their header expands them

### 9. Apply a suggestion
- With at least 6 Pokémon in PC, open the suggestion modal and tap "USE THIS PARTY" on Option 1
- The modal closes
- The party page now shows the 6 suggested Pokémon in the party grid
- A toast appears: "PARTY UPDATED — N/18 TYPES COVERED"
- The previously active party members appear in the PC Box (they were displaced)
