# makefun-cooking-game

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/reyzn02/makefun-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/reyzn02/makefun-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Sizzle & Serve — a tiny kitchen cooking game. Take orders from the board, chop on the board, grill patties until the ding, build each dish on the plating counter, and serve it at the window before the customer walks out. A full 3-minute shift with four recipes, tips, combos and a dinner rush.

## Run it

```sh
python3 -m http.server 8080 --directory game
```

Then open http://localhost:8080 in a desktop browser. No build step, no network requests: the game is plain static files under `game/`.

## How to play

- Move with WASD / arrow keys, or click anywhere to walk there.
- Press E (or click a station) to use it: grab ingredients from the pantry, chop lettuce/tomato/onion on the board (3 chops), grill raw patties until the ding — grab them before they burn — build the dish on the plating counter, pick up the plate and serve it at the window.
- Serve the dish an order asks for to earn its price plus a tip for speed. Wrong dishes and walked-out customers cost you. The dinner rush in the last 45 seconds brings orders faster.
- M mutes the sound, P pauses, Enter starts a new shift.

## Hand in

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=jqzhkth7&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
