# Gyms Page

## Gym leaders render

1. Go to the app
2. Click the Gyms tab
3. Expect: "Brock" gym card is visible
4. Expect: "Misty" gym card is visible
5. Expect: "Giovanni" gym card is visible

## Rival section renders

1. Go to the app
2. Click the Gyms tab
3. Expect: rival section header "RIVAL — GARY" is visible
4. Expect: starter buttons for Bulbasaur, Charmander, and Squirtle are visible
5. Expect: "Route 22" rival encounter card is visible

## Rival starter selector changes team

1. Go to the app
2. Click the Gyms tab
3. Open the "Route 22" rival encounter card
4. Expect: default starter (Bulbasaur) — Gary has "Charmander" in the team
5. Click the "Charmander" starter button
6. Open the "Route 22" rival encounter card
7. Expect: Gary now has "Squirtle" in the team

## Rival starter persists across page reloads

1. Go to the app
2. Click the Gyms tab
3. Click the "Squirtle" starter button
4. Reload the page
5. Click the Gyms tab
6. Expect: "Squirtle" starter button is still active
