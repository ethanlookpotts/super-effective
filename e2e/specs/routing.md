# URL Routing

The app uses hash-based routing so reloading the page restores the current view.
Routes:
- `#/search` — search page (default)
- `#/search?type=<Type>` — search with a type filter pill active
- `#/search?n=<dex>` — search showing a Pokémon detail card
- `#/party` — party page
- `#/gyms` — gyms & rival & E4 page
- `#/location` — where am I page
- `#/tms` — TMs & HMs page
- `#/settings` — settings page

## Page navigation updates the URL

1. Go to the app (default URL)
2. Open the drawer, click "MY PARTY"
3. Expect: URL ends with `#/party`
4. Open the drawer, click "GYMS & ELITE FOUR"
5. Expect: URL ends with `#/gyms`
6. Open the drawer, click "WHERE AM I"
7. Expect: URL ends with `#/location`
8. Open the drawer, click "TMs & HMs"
9. Expect: URL ends with `#/tms`
10. Open the drawer, click "SETTINGS"
11. Expect: URL ends with `#/settings`

## Selecting a Pokémon updates the URL

1. Go to the app
2. Search for "Pikachu" and click the dropdown result
3. Expect: URL ends with `#/search?n=25`

## Type filter pill updates the URL

1. Go to the app
2. Click the "Electric" type pill
3. Expect: URL ends with `#/search?type=Electric`
4. Click the same pill again to toggle off
5. Expect: URL ends with `#/search`

## Reload preserves the current page

1. Go to the app
2. Navigate to the Party page
3. Reload the page
4. Expect: the Party page is still active (🎒 MY PARTY heading visible)

## Reload preserves the selected Pokémon

1. Go to the app
2. Search for "Charizard" and open its detail card
3. Reload the page
4. Expect: the Charizard detail card is still visible (Charizard heading)

## Reload preserves the type filter

1. Go to the app
2. Click the "Fire" type pill
3. Reload the page
4. Expect: the Fire type browse list is still visible (Charmander card present)

## Direct deep link to a Pokémon

1. Go directly to `/#/search?n=150`
2. Expect: the Mewtwo detail card is shown (Mewtwo heading visible)

## Direct deep link to a page

1. Go directly to `/#/gyms`
2. Expect: the Gyms page is active (🏆 heading visible)

## Browser back button restores prior view

1. Go to the app
2. Search for "Pikachu" and open its detail card
3. Navigate to the Party page via the drawer
4. Press the browser back button
5. Expect: the Pikachu detail card is visible again

## Switching playthrough resets the route

1. Go to the app and open a Pokémon detail card (e.g. Pikachu)
2. Open the run switcher, create a new run
3. Expect: URL is `#/search` (not `#/search?n=25`) and the default search view is shown
