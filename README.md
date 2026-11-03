# The Collective

A card game for friends: everyone gets the same 90 cards each week (Week One:
45 designs × 2) and builds a 30-card deck. Phone-first web app, no build step.

## Layout

| Path | What it is |
|---|---|
| `js/cards.js` | Card data, rules constants, starter decks: the single source of truth |
| `js/render.js` | Card frames, card back, deckbuilder rows (HTML/CSS, no images needed) |
| `js/decks.js` | Deck rules (30 cards, 2 copies, 3 factions), local storage, `W1-…` share codes |
| `js/app.js` | Router and views: home, gallery, decks, builder, rules |
| `js/engine.js` | Rules engine: deterministic, event-sourced (`newGame` + `apply(state, action)`); every card's effect |
| `js/ai.js` | Practice bot: greedy one-step lookahead over `legalActions` |
| `js/game-ui.js` | The table (practice and online), the Play page and the online lobby |
| `js/net.js` | Online play over Firebase Realtime Database: rooms, seats, the shared move list |
| `js/firebase-config.js` | Paste the Firebase web config here to switch online play on |
| `js/art/` | Card art drawn in code: `kit.js` (drawing tools), `scenes.js` (style rules), `scenes/*.js` (one file per faction) |
| `css/card.css` | The physical-card look, sized in `cqw` so one component scales from thumbnail to zoom |
| `css/game.css` | The table, laid out for an iPhone held upright |
| `art-lab.html` | Art review: `?only=a,b` large views, `?sheet` contact sheet |
| `tools/test-engine.mjs` | One scenario per card rule, then random-play fuzzing (`node tools/test-engine.mjs 1500`) |
| `tools/simulate.mjs` | Bot vs bot across the starter decks (`node tools/simulate.mjs 40`) |
| `tools/phone.html` | 390×844 frame for screenshots, e.g. `tools/phone.html?demo=3&moves=14` |
| `art/` | Optional paintings (`<card-id>.webp`) that override the drawn art; `art/raw/` keeps originals locally |
| `tools/gen-art.mjs` | Fallback: paintings via the OpenAI Images API (`--test`, `--only a,b`, `--force`, `--dry-run`) |
| `tools/art_post.py` | Shrinks `art/raw/*` to WebP and rewrites `js/art-manifest.js` |
| `tools/make_icons.py` | Home-screen icons |

## Online play

Firebase Realtime Database, free plan. Rooms live at `rooms/{CODE}/info`
(seats, names, deck codes, round, seeds) and the moves of game *n* at
`rooms/{CODE}/rounds/{n}/actions`. Because the engine is deterministic, every
phone replays the same move list and agrees on the game; a phone that sleeps or
reloads catches up from the list. To switch it on, paste the web config into
`js/firebase-config.js`.

## Balance notes (bot vs bot, 400 games)

- First player wins about 58% with the Spark and the skipped first draw.
- Four starters land between 49% and 64%; "You Didn't Need That" (the graveyard
  deck) wins about 20–27%, partly because a greedy bot can't plan graveyard combos.

## Run locally

```bash
python tools/serve.py 8770
```

Then open http://localhost:8770. (`serve.py` turns caching off, so edited modules are always picked up together.)

## Publish

GitHub Pages lets browsers cache files for ten minutes, and a phone holding a
mix of old and new modules breaks. Stamp versions into `index.html` first:

```bash
node tools/stamp.mjs
```

Then commit and push; Pages serves `main` from the repository root.

## Art

The API key is read from `~/.secrets/openai_key.txt` (or `OPENAI_API_KEY`).
Never put it inside this folder.

```bash
node tools/gen-art.mjs --test
```

```bash
node tools/gen-art.mjs
```

A painting made elsewhere can be dropped into `art/raw/<card-id>.png`; then run
`python tools/art_post.py`.

## Rule changes from the first draft

- Up to **3 factions** per deck (with 2, a pair had only 32–34 legal cards).
- **Countercurrent** is a Trap set on your own turn, so nothing is played on an opponent's turn.
- The first player skips their first draw; everyone else starts with a **Spark** (0: gain 1 Energy this turn).
- Empty deck: lose 2 Life per missing draw. Board max 7 creatures; hand max 10.
- "The opposing player" became "each opponent" / "an opponent" so cards work in 3-player games.
- Little Gardener triggers once per turn (two of them would otherwise loop forever).
- Phoenix returns during your next turn (no start-of-turn prompt); Forbidden Archivist costs 1 Life instead of an optional Energy payment, so neither needs a decision on someone else's turn.
- Buff spells target your own creatures; Deepwater Leviathan's bounce is optional.
