# The Collective

A card game for friends: everyone owns the same 90 cards each week (one of
each) and builds a 30-card deck. Magic-style fights: you attack, the defender
chooses blockers, and both sides can answer with Tricks. Phone-first web app,
no build step.

## Layout

| Path | What it is |
|---|---|
| `js/cards.js` | Card data, rules constants, starter decks: the single source of truth |
| `js/render.js` | Card frames, card back, deckbuilder rows (HTML/CSS, no images needed) |
| `js/decks.js` | Deck rules (30 cards, 2 copies, 3 factions), local storage, `W1-…` share codes |
| `js/app.js` | Router and views: home (one screen: Learn to play, Play, and a quiet ☰ for the cards, decks and rules), gallery, decks, builder, rules |
| `js/engine.js` | Rules engine: deterministic, event-sourced (`newGame` + `apply(state, action)`); fights, blocking, Tricks, Traps, Relics and every card's effect. `actor(s)` says whose move it is |
| `js/ai.js` | Practice bot: tries every play and a handful of attacks, plays each fight out (guessing the defender's blocks) and scores the result; compares block plans and Tricks when attacked |
| `js/game-ui.js` | The table (practice, lesson and online), the Play page (Friends, then Bots, on one screen), the online lobby and the help in the ☰ menu. Each move is animated on the old table, then redrawn and FLIP-glided |
| `js/fx.js` | The physical layer: table cards (`tcardHTML`), the hand carousel, drag-to-play, swipe physics (`velocity`, `glide`, `rubber`), aiming arrows, FLIP, lunges, clashes, deaths, shown cards, banners |
| `js/tutorial.js` | The guided lesson: stacked decks, the coach's 28 steps, the bot's scripted first turns |
| `js/net.js` | Online play over Firebase Realtime Database: rooms, seats, the shared move list, draft picks |
| `js/draft.js` | Draft night's rules with no screen attached: the six piles, the 30 typed rounds, snake order, replay from the pick list, the draft bots |
| `js/draft-ui.js` | Draft night's screens (practice against bots, and online in a room), plus its hooks into the Play page and lobby |
| `css/draft.css` | Draft night's look |
| `tools/test-draft.mjs` | Draft checks: seeds, snake order, the recipe, replay, bots, Pick for (`node tools/test-draft.mjs`) |
| `js/firebase-config.js` | Paste the Firebase web config here to switch online play on |
| `js/art/` | Card art drawn in code: `kit.js` (drawing tools), `scenes.js` (style rules), `scenes/*.js` (one file per faction) |
| `css/card.css` | The physical-card look, sized in `cqw` so one component scales from thumbnail to zoom |
| `css/game.css` | The table, laid out for an iPhone held upright |
| `css/table.css` | Table cards, hand, effects (used by `js/fx.js`) |
| `art-lab.html` | Art review: `?only=a,b` large views, `?sheet` contact sheet (`?sheet&only=a,b` for a few) |
| `fx-lab.html` | Animation review: every effect on real cards, at phone size |
| `tools/test-engine.mjs` | One scenario per card rule, then random-play fuzzing (`node tools/test-engine.mjs 1500`) |
| `tools/check-tutorial.mjs` | Plays the lesson script against the engine and prints the table at every step |
| `tools/simulate.mjs` | Bot vs bot across the starter decks (`node tools/simulate.mjs 40`) |
| `tools/phone.html` | 390×844 frame for screenshots, e.g. `tools/phone.html?demo=3&moves=14` |
| `art/` | Baked pictures (`<card-id>.webp`) of the drawn art, shown in every small view; `art/raw/` keeps the PNGs locally |
| `tools/bake-art.mjs` | Renders each card's drawn art once in headless Chrome and saves it as WebP (+ `js/art-manifest.js`). Re-run after changing any scene |
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

## Balance notes (bot vs bot)

- 1v1: the first player wins about 54–59%; games run about 17 turns in total.
  After trimming Wild Hunt (no Ashmaw or Stampede) and You Didn't Need That (fewer
  7-drops), the five starters land between 46% and 58%.
- Three players, 60 games: about 28 turns in total (9 each), wins by seat
  35% / 37% / 28%, about 15 attacks a game.
- After the Crown, double blocks and abilities (2026-11-04): 1v1 starters at
  48–56%, first player 58%. Three players, 30 games: about 30 turns either
  way (the Crown's extra cards cancel out the extra attacking), and the Crown
  changes hands about 7 times a game.

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

The pictures are drawn in code (`js/art/`). Phones would have to render
every card's SVG filters (glow, blur, grain) whenever the table changes, so
small views show baked WebP pictures instead; only the big zoom view draws the
live, animated SVG. After changing a scene, bake again (with the local server
running):

```bash
node tools/bake-art.mjs
```

Paintings from elsewhere (the old OpenAI fallback below) would also go through `art/`.

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

## Week One, second edition (rules v2)

- **Fights work like Magic's.** Once a turn you attack one opponent with any of
  your ready creatures; attacking exhausts them (they can't block until your
  next turn). The defender chooses blockers; each blocks one attacker (Guard: two).
  Then Tricks, attacker first, back and forth until both pass. Blocked
  attackers never hit the player unless they have Overrun.
- New keywords: Soar, Reach, Swift, Venom, Drain, Overrun, Watchful, Hunt.
  New card kinds: Tricks (playable mid-fight, even on others' turns), Relics
  (stay on the table, at most 3), Legendary (gold foil, no extra rules).
- 90 different cards, one of each. Unspent Energy stays until your next turn,
  so you can hold it for Tricks.
- Guard now means "can block two attackers". Attacks no longer target creatures.
- On the table, fighting creatures meet in a battle zone in the middle and
  fights resolve one pair at a time; the move that carries the game on
  (End turn, Attack, Block, Fight) is a swipe right across the table (see
  "Your hand, and swipes instead of buttons").

## More from Magic (2026-11-04)

- **Double blocks.** Several creatures may block one attacker (`C.blk` maps
  each attacker to a list of blockers). The attacker splits its damage
  automatically (`splitDamage` in the engine): it destroys the costliest
  blockers it can, one after another, puts what is left on the next blocker,
  and with Overrun sends the rest to the player once every blocker has its
  fill. Venom makes 1 damage enough for each blocker.
- **⚡ Abilities.** Ten creatures got a "Pay N Energy: …" ability (`ability:
  { cost, short }` in `js/cards.js`, effects in `use()` in the engine):
  Reckless Initiate, Ember Duelist, Mossback, Canopy Archer, Curious Wisp,
  Cloud Ray, Vesper Bat, Hungry Ghoul, Choirmother, Dawnwatch Knight. Each
  works once a turn, whenever you could play a Trick, so a fight also stops
  for a player who could use one. On the table a ⚡ chip on the card glows
  when it can be used; tap it for the card with a Use button.
- **Draft night**, a snake draft for new players. Six piles by kind of card
  (small, medium and big creatures, spells, tricks and traps, relics); 30
  rounds, each one kind (fixed order) with 6 cards face up; everyone takes
  one in snake order (A-B-C, then C-B-A), the rest go to the bottom of their
  pile. Everyone ends with 5 small, 6 medium, 4 big, 6 spells, 4 tricks, 2
  relics and 3 "last call" picks. With three players all 90 cards are dealt
  once. Online: the Draft night switch under Friends on the Play page;
  practice: the "Draft my deck" switch under Bots, then 1 bot or 2 bots.
- **💡 Suggest** (top right on the table, hidden during the lesson): asks the
  practice bot what it would do in your place, without peeking at face-down
  Traps. A play comes with "Do it"; an attack or a block is set up on the
  table for you to confirm (swipe right) or change. The mulligan screen says whether the
  bot would keep the hand.
- **👑 The Crown** (three or more players; `crown` in the setup turns it off).
  The first player to hit an opponent in a fight takes it; the holder draws an
  extra card at the end of each of their turns; hitting the holder in a fight
  takes it. If the holder is knocked out it goes to whoever's turn it is.

## Keeping the table calm

The rule of thumb, borrowed from how the best phone card games do it (three
"reads": big shapes first, a few key numbers second, details only on request),
and Asaf's own: if it isn't critical, less is more.

- **At a glance:** the cards, everyone's Life, your Energy pips. Opponents show
  Life, Energy (one number) and cards in hand; a deck count appears only when 5
  or fewer cards are left. The top line says whose turn it is and nothing else
  (your Energy is on your bar). Whoever's turn it is has their name in gold.
- **Nothing that says "nothing":** an empty row of creatures is just empty
  table, and an empty discard pile isn't drawn.
- **On a tap:** a player's bar opens their details (deck, discard pile,
  Relics, the Crown); a card opens the card. The menu (☰, top left) has help,
  the game log and take-back. 💡 (top right, only when it's your move) asks
  the bot what it would do.
- **One line in the middle at most:** how the last fight went, or in a fight
  what will happen if no one plays a Trick. No running log, no "what you can
  do" hints (the glow says it; the lesson and 💡 teach the rest).
- **The whole screen only for you:** "Your turn", attacks on or by you, the
  first Crown and any Crown you win or lose. Someone else's turn, two others
  fighting, or another player's ability get a small note in the middle that
  fades by itself.
- **Little motion:** your playable hand cards and fighting creatures pulse
  together, slowly; ready creatures and ⚡ chips glow without pulsing. A spent
  creature lies sideways with a small ↻, no stamp over its art. ⚡ chips show
  on your own creatures only.

## The first screens: less is more

- **Home** is one screen with no scrolling: the title, the fan of three cards,
  and two buttons low down: **Learn to play** (the guided lesson) and
  **Play**. A quiet ☰ in the corner holds All 90 cards, Decks and Rules; those
  pages start with a ‹ back to Home. No top bar, no tab bar.
- **Play** is one screen too: **Friends** first (your name, the Draft night
  switch, your deck while Draft night is off, New game for 2 or 3 players, and
  a code to join), then **Bots** (1 bot, 2 bots, a "Draft my deck" switch, and
  the deck choices folded away under Decks ▾). A saved game shows as one
  Resume button. No explanations: the lesson teaches, and Draft night's lobby
  keeps "How the draft works" a tap away.

## Your hand, and swipes instead of buttons

Where a gesture is easy to guess, it replaces a button or a line of text.
Things the thumb uses sit low on the screen, in the same place whatever the
text above them says.

- **Swipe right to move on:** no big End turn button. A faded line in the middle
  of the table says what the move is ("End turn ›››", or Attack, Block,
  Don't block, Fight) and you swipe right anywhere on the table to make it.
  The line follows the finger and lights up gold past the mark; let go there
  (or flick) to do it, or short of it and it slides back. It gets brighter, its
  arrow running, when there is nothing else to do. A tap only nudges it (and
  says "Swipe right"); a click from a keyboard or screen reader does it. Swipes
  start away from the screen's left edge (the browser's back swipe), your hand,
  buttons and your own creatures (you drag those to aim). With three players
  you first tap whose name to attack.
- **The hand is a carousel:** the focal card sits in the middle, poking up, a
  little bigger, with its rules in small print; the others fan out to either
  side, the far ones off the screen. Slide the hand sideways and it follows the
  finger; let go and it glides on (further the faster the flick) and settles
  on a card, which stays the focal card. A finger on a gliding hand catches it.
  Only the focal card wears its Power and Vitality; the others show their cost.
- **The whole hand, big:** tap a card to see your whole hand full size. Swipe
  sideways to go through it (the cards shift and tilt like a hand of cards,
  with the same glide: a normal swipe moves one card, a hard flick several);
  tap a side card to bring it to the middle. Details sit at the top; the
  cards, the Play button and the handle sit at the bottom.
- **The draft's cards, big:** the same row of cards. Tap a card on the draft
  table and all of that round's cards come up side by side, the one you tapped
  in the middle, its rules on top, **Take it** low by your thumb, dots below
  showing where you are. They swipe, glide, catch and close exactly like your
  hand big; your deck so far opens the same way (without Take it, and with a
  count instead of dots once it's long). The deck list closes with the same
  handle as a game's sheets.
- **Swipe up to close:** every info screen (a card, a player, the menu, help,
  the log) ends with a small handle at the bottom instead of a Close button.
  Swipe it up or tap it. In the big hand, swiping the cards up or down puts
  them away. On the table, dragging a hand card up still plays it.
- **The 💡 tip** goes away when you tap it.
- Choices (a target, a discard) keep their Cancel button: there, a stray
  gesture could be taken for a choice.
- The physics: `FX.velocity()` judges a finger's speed from its last ~100 ms,
  `FX.glide()` springs a position to where a flick would carry it (about an
  eighth of a second's worth), starting at the finger's speed so nothing stops
  dead, and `FX.rubber()` makes the ends of a row resist. A row of big cards
  (`.hv-track` of `.hv-card`s) is driven by `FX.swipeTrack()` (sideways to look,
  up or down to close), `FX.moveTrack()` (glide to a card) and
  `FX.placeTrack()`; the game's big hand and the draft both use them, and
  `FX.grabSwipe()` is every sheet's swipe-up handle.

## Keeping it smooth on phones

- The table is updated in place (`morphChildren` in `js/game-ui.js`): cards
  keep their elements between moves, so only what changed is laid out and
  painted. Rebuilding everything cost about 50–80 ms a move on a slow CPU.
- Card art is baked to WebP (see Art), and the paper grain is a small PNG
  tile rather than an SVG noise filter.
- `?demo=8&moves=46` plus `window.collectiveDebug.redraw()` is handy for timing
  a redraw in the browser's performance tools.
- Big cards shown during play (a bot's card, a card's sheet) use the baked
  picture: drawing the live SVG art the first time took up to 2.5 s on a slow
  CPU. Only the gallery's zoom view draws it live.
- The hand reads its sizes once per screen size (`layoutHand`), and the
  table's class is only rewritten when it changes, so a tap restyles the
  page fewer times.
- Three players on a short phone: in a fight, the player who isn't in it
  folds to just their bar, unblocked attackers get a small label instead of
  an empty slot, and the line saying what will happen is pinned in view.

## Rule changes from the first draft

- Up to **3 factions** per deck (with 2, a pair had only 32–34 legal cards).
- **Countercurrent** is a Trap set on your own turn, so nothing is played on an opponent's turn.
- The first player skips their first draw; everyone else starts with a **Spark** (0: gain 1 Energy this turn).
- Empty deck: lose 2 Life per missing draw. Board max 7 creatures; hand max 10.
- "The opposing player" became "each opponent" / "an opponent" so cards work in 3-player games.
- Little Gardener triggers once per turn (two of them would otherwise loop forever).
- Phoenix returns during your next turn (no start-of-turn prompt); Forbidden Archivist costs 1 Life instead of an optional Energy payment, so neither needs a decision on someone else's turn.
- Buff spells target your own creatures; Deepwater Leviathan's bounce is optional.
