# Search Page

## Search by name

1. Go to the app
2. Type "Pikachu" in the search input
3. Click the first result in the dropdown
4. Expect: a detail card appears showing the name "Pikachu" and an "Electric" type badge

## Type filter pill

1. Go to the app
2. Click the "Electric" type pill in the filter row
3. Expect: a browse list appears containing a card for "Pikachu"

## Type filter scroll reset

1. Go to the app
2. Click the "Electric" type pill — scroll the browse list to the bottom
3. Click the "Fire" type pill
4. Expect: the scroll position resets to the top (first browse card is visible)

## Evolution chain — shows full linear chain

1. Go to the app
2. Search for "Bulbasaur" and open its detail card
3. Expect: an "EVOLUTION CHAIN" section shows all three stages: Bulbasaur (highlighted), Ivysaur, and Venusaur; the condition "Lv.16" is visible

## Evolution chain — clicking a stage navigates to it

1. Go to the app
2. Search for "Bulbasaur" and open its detail card
3. Click the "View Ivysaur" button in the evolution chain
4. Expect: the detail card switches to show Ivysaur (heading reads "Ivysaur")

## Evolution chain — full chain visible for middle-stage Pokémon

1. Go to the app
2. Search for "Ivysaur" and open its detail card
3. Expect: EVOLUTION CHAIN section shows Bulbasaur, Ivysaur (highlighted), and Venusaur with conditions Lv.16 and Lv.32

## Evolution chain — absent for Pokémon with no evolutions

1. Go to the app
2. Search for "Tauros" and open its detail card
3. Expect: no "EVOLUTION CHAIN" label appears

## Evolution chain — EVOLVE button appears for party member in chain

1. Go to the app
2. Add Charmander to party (search → add to party)
3. Search for Charmander again and open its detail card
4. Expect: an "EVOLVE Charmander → Charmeleon" button is visible in the evolution chain section

## Evolution chain — EVOLVE button swaps party member form

1. Go to the app
2. Add Charmander to party
3. Search for Charmander and open its detail card
4. Click the "EVOLVE Charmander → Charmeleon" button
5. Expect: the detail card switches to show Charmeleon

## Search by move name — dropdown shows move matches

1. Go to the app
2. Type "Flamethrower" in the search input
3. Expect: the dropdown contains a "MOVES" section with a "Flamethrower" option tagged as a Fire type move

## Search by move name — opens move detail

1. Go to the app
2. Type "Flamethrower" in the search input
3. Click the "Move Flamethrower" option in the dropdown
4. Expect: a move detail view appears with the heading "Flamethrower", Fire type badge, "95" power, "100%" accuracy, and a "burn 10%" effect

## Move detail — lists all Pokémon that can learn the move

1. Go to the app
2. Search for the move "Flamethrower" and open its detail
3. Expect: a "WHO CAN LEARN" section lists Charmander, Charmeleon, and Charizard (all Fire-type starters that learn it)

## Move detail — tapping a learner opens its detail card

1. Go to the app
2. Search for the move "Flamethrower" and open its detail
3. Click the "Charizard" card in the WHO CAN LEARN list
4. Expect: the detail card switches to show the Charizard Pokémon heading

## Move detail — shows TM source when applicable

1. Go to the app
2. Search for the move "Earthquake" and open its detail
3. Expect: a "TM / HM / TUTOR" section lists TM26 with its FRLG location
