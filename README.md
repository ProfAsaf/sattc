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
| `js/net.js` | Online play over Firebase Realtime Database: rooms, seats (each with its phone's version), the shared move list, draft picks |
| `js/awake.js` | Keeps the screen on during a game, a draft or an online room (Screen Wake Lock) |
| `js/draft.js` | Draft night's rules with no screen attached: the six piles, the 30 typed rounds, snake order, replay from the pick list, the draft bots |
| `js/draft-ui.js` | Draft night's screens (practice against bots, and online in a room), plus its hooks into the Play page and lobby |
| `js/stats.js` | Insights, the numbers: a finished game replayed and counted, the bot's review of your decisions, a draft's picks graded, tonight's results in a room, the summaries for the Insights page, and the games and drafts saved on the phone |
| `js/insights.js` | Insights, the words and pictures: the Insights page (`#/insights`), a game's review, a draft's review, the end screen's lines and the lobby's board for tonight |
| `css/insights.css` | Insights' look |
| `js/fightview.js` | A fight you are in, big and step by step: `fightStory` turns a move's events into steps with words on what happened and why, `playStory` plays them over the table |
| `css/fightview.css` | The big fight's look |
| `tools/test-stats.mjs` | Insights checks over bot games and drafts, and how the grades come out for careful, noisy and random players (`node tools/test-stats.mjs`) |
| `css/draft.css` | Draft night's look |
| `tools/test-draft.mjs` | Draft checks: seeds, snake order, the recipe, replay, bots, Pick for (`node tools/test-draft.mjs`) |
| `js/firebase-config.js` | Paste the Firebase web config here to switch online play on |
| `js/push.js` | "It's your turn" alerts: turning them on (a Web Push subscription written into the room), and asking the alert worker to wake the next player |
| `js/push-config.js` | The alert worker's address (empty: no alerts, nothing said about them) |
| `sw.js` | The service worker: shows an alert and opens the game when it's tapped, an invite into its room (it caches no pages) |
| `push/` | The alert worker (Cloudflare), with how to deploy it |
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
`rooms/{CODE}/rounds/{n}/actions`; how each game went (for tonight's board) at
`rooms/{CODE}/results/{created}/{n}`. Because the engine is deterministic, every
phone replays the same move list and agrees on the game; a phone that sleeps or
reloads catches up from the list. To switch it on, paste the web config into
`js/firebase-config.js`.

- **Delay:** a move reaches the other phones in well under a second (about
  65 ms measured from a computer to the database and back out); your own
  moves show at once. A phone that falls behind skips the animations to catch up.
- **Screens stay on** during a game, a draft and while in an online room
  (`js/awake.js`, the Screen Wake Lock API), so a phone doesn't lock and drop
  out mid-game. The browser lets go whenever the page is hidden; it is asked
  for again on return and on the next tap. Where it isn't supported, Auto-Lock
  applies as usual.
- **Same version on every phone:** phones replay each other's moves, so they
  must run the same rules. A phone's version is the stamp of `engine.js`,
  `cards.js` and `draft.js` (`Net.version()`, from the import map). Every seat
  stores its phone's version (updated after a reload); the lobby names any
  phone on another version and the host can't start a game or a draft until
  every phone matches. A game remembers the version it started with, and a
  phone that comes back on another one is told to reload. Don't publish while
  friends are mid-game: reload every phone before starting instead.

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
- 90 different cards, one of each (since 2026-11-07: 97 cards, two of each in a
  deck; see "Combos that escalate"). Unspent Energy stays until your next turn,
  so you can hold it for Tricks.
- Guard now means "can block two attackers". Attacks no longer target creatures.
- On the table, fighting creatures meet in a battle zone in the middle and
  fights resolve one pair at a time; the move that carries the game on
  (End turn, Attack, Block, Fight) is a button at the bottom right (see
  "Fights, step by step").

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
- **💡 in the draft** (top right, as in a game): advice for the round, never
  which card to take. Three short lines from `adviceFor` in `js/draft.js`: what
  this kind of card is for and how to tell a good one (Power + Vitality for the
  cost, keywords, removal), what your deck could use (a 1-Energy creature, a
  way to get rid of enemy creatures, something that blocks Soar, a cheaper big
  one...), and what kinds of cards are on the table (costs and keywords, or
  what the spells and tricks do). `tools/test-draft.mjs` checks over 80
  simulated drafts that it never names a card on the table. It stays open for
  the round; a tap on it puts it away.
- **💡 Suggest** (top right on the table, hidden during the lesson): asks the
  practice bot what it would do in your place, without peeking at face-down
  Traps. A play comes with "Do it"; an attack or a block is set up on the
  table for you to confirm (tap Attack or Block) or change. The mulligan screen says whether the
  bot would keep the hand.
- **👑 The Crown** (three or more players; `crown` in the setup turns it off).
  The first player to hit an opponent in a fight takes it; the holder draws an
  extra card at the end of each of their turns; hitting the holder in a fight
  takes it. If the holder is knocked out it goes to whoever's turn it is.

## Insights (2026-11-04)

How you're doing, the way chess.com's Insights and Game Review and 17lands
(for Magic) do it, with no login: everything is kept on the phone
(`collective.games.v1`, `collective.drafts.v1` in local storage; the newest
250 games and 40 drafts).

- **A finished game** (`analyzeGame` in `js/stats.js`) is replayed from its
  setup and moves, and every move's events say who hit whom with which card
  and what died: damage dealt and taken, creatures destroyed and lost, cards
  played by kind, attacks, blocks, Energy used, cards lost to a full hand,
  lowest Life, the Crown; for you, each card's part (drawn, played, damage,
  kills) and the opponents' cards that hurt you most; the Life of everyone
  and the bot's reading of "your chances" turn by turn; and the moments worth
  telling (the biggest hit, the turn that swung it, the turning point if the
  winner had been behind, players going out, a comeback).
- **The bot's review** (`reviewPlay`, in the background after the game) asks
  the practice bot, at each of your attacks, blocks, fight Tricks and ends of
  turn, what it would have done and how much better that leaves you by its own
  scoring (`evaluate` in `js/ai.js`, fights played out as the bot plays them).
  Accuracy is 100 when it agreed every time and falls off like chess sites'
  (`100·e^(−loss/8)`); the worst decisions are graded Inaccuracy, Mistake or
  Blunder, Tricks that won a fight are Great. Energy kept for a Trick in hand
  isn't counted against you, and a decision with no choice (or whose every
  option loses) isn't counted. On bot games: a careful bot scores about 100%,
  a random player about 70% (`tools/test-stats.mjs` prints both).
- **The end screen** adds how long it took, tonight's score (or your record
  against the bots), a small chart of your chances, one tip from the game, and
  **Game review**: the chart (or everyone's Life), key moments, the bot's
  notes, everyone's numbers, your best card and the one that hurt you most.
- **Drafts** (`reviewDraft`): each of your picks against the bot's rating of
  every card on the table for your deck at that moment (`pickScore` in
  `js/draft.js`). Graded Best, Good, OK or Miss, with the card it liked more;
  the draft score is the average (`100·e^(−loss/1.6)`). On the deck screen at
  the end of a draft, and in Insights with how that deck then did.
- **Tonight**: every phone in a room writes the same short summary of each
  game it saw end (`roomResult`: the winner, everyone's damage, kills, blocks,
  biggest hit, Crown turns and best card, under the players' names). The
  lobby shows the wins and up to four awards (most damage, most creatures
  destroyed, biggest hit, the wall, the Crown, the card of the night), and a
  way back into your last game's review. No one's accuracy leaves their phone.
- **The Insights page** (☰ on Home): your record and last ten games; how the
  bot rates your play (accuracy and its trend; ends of turn, attacks, blocks
  and Tricks; Energy used against the bots'; an average game); when you win
  (going first or second, short or long games, kept or new opening hand, your
  decks' factions); your cards (did the most; winning when drawn, 17lands'
  IWD: win rate in games you drew it against games it stayed in your deck,
  once there are enough games; stuck in your hand; hurt you most); rivals,
  friends by name and bots by deck; drafting; records; recent games, each
  opening its review. All games, or only friends' or bots'.

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

## The lesson's coach box (2026-11-05)

On Asaf's iPhone the page gets about 800px of the screen, and the middle strip
of the table (between the two rows of creatures) is only about 80px tall, so
the coach box was cut off and had to be scrolled inside. Now it floats over
the table (`placeCoach` in game-ui.js): in the middle when it fits there,
otherwise spilling onto the rows next to it where it hides the fewest
creatures, and never over what the step is talking about or a fight in the
middle. Its bottom row is gone: Next is the button at the bottom right, a gold
line along the top of the box shows how far through the lesson you are, and
Skip the lesson is in ☰.

## One move at a time (2026-11-05)

Asaf wanted to tap to see the next thing happen, "even when it is bots
fighting each other or other users fighting each other": then it doesn't
matter if it moves fast or slow, or if you look away. So what the other
players do waits for your tap (`tapToGoOn` in game-ui.js):

- A card someone else plays stays up big until you tap anywhere, with a line
  low down saying who played it and on what. A Trap springing does the same.
- An attack or a block between the other two, and an ability someone uses,
  wait on the table with their line.
- Every fight comes up big, yours and two others', and each step waits for
  your tap instead of moving on by itself.
- No extra tap when the game waits for you anyway: an attack on you goes
  straight to your block, a block of your attack to your Trick window.
- "Skip to your move" passes over the rest; "Since your last turn" only comes
  up after a Skip. ☰ has "Others’ moves: automatic" for moves that play by
  themselves (`collective.tapThrough` = '0'; the older tests use it).
- Online, each phone goes at its own pace: moves that arrive meanwhile queue
  up, and a phone that was put away shows them when it's back.

## Three players, two sides at a time (2026-11-05)

Asaf found the duel table "much better than the mess that is 3 player games",
and asked for the same screen "just focusing on whichever two players are
interacting", with a way to open and fold the others. So with three players
the table is laid out, and sized, as a duel (`openSides` in game-ui.js):

- On your turn: you and one opponent; the other folds to a slim bar at the
  top ("4 creatures ▾"). Tap it, or swipe sideways across the top, to swap.
  Picking whom to attack brings that player up.
- Whoever moves comes up, so their card lands on an open side. An attack on
  you opens you and the attacker; two others fighting open the two of them
  (attacker on top) and fold your side to its bar.
- In a fight the opponents' other creatures step out of view (they can't
  join it); yours stay for their ⚡ abilities.
- A move that touches a folded side opens it first, all three for one that
  touches everyone, then the table folds back. A tap on a folded bar
  mid-fight opens everyone until the fight is over. Choosing a target opens
  every side with something to pick.

## Deciding a fight on its own screen (2026-11-06)

After the first game night: "Players are just unsure when attacking and
defending where to click when, and what it means." On short phones the fight
in the middle of the table had 36px cards, the "block here" place sat under
the banner, and the attack arrow ran through the words. So each decision in a
fight now has a screen of its own over the table (`decideHTML` in
game-ui.js), with ☰ and 💡 still at the top:

- **Attack.** On your turn the button at the bottom right is a gold
  **Attack** while something can attack (End turn waits on the left). Its
  screen: whom (three players), the creatures of theirs that could block,
  your creatures (the ones that can't attack yet are dimmed: tap one for
  why), then **Attack ‹name›**. One line says what to tap next, one what
  attacking means, and one how much they take if nothing is blocked. Tapping a
  ready creature on the table opens it with that one picked; a Hunt attacker
  picks its prey there.
- **Block.** When you're attacked: the attackers on top, a place in front of
  each, your creatures below. Tap one of yours: with one attacker it can stop
  it steps in front of it, with several it lifts and the attackers it can
  block light up (an attacker tapped first works too). Tap a blocker to send
  it back. ☠ marks what would be destroyed; the line under it says it in words;
  **No block (take 7)** says what not blocking costs.
- **Tricks.** Before a fight, only when you have a Trick or ability you could
  use: the fight as it stands, the Tricks you can play (tap one: your hand,
  big, with Play), the ⚡ abilities, and **Fight**.
- The lesson's coach speaks in the line at the top of these screens.
- The cards are sized to the space they have (`fitDecision`), from an SE to a
  Pro Max; `dec-check.mjs` (session scratchpad) drives games through every
  screen at five sizes and checks nothing is covered, cut off or too small.

Your Energy on your bar is now a number as big as your Life ("⚡ 3/7"): with
three players the pips lost their number at 6+, and spent ones were nearly
invisible. The big hand says "You have ⚡ 3 Energy" next to Play.

## Turn alerts (2026-11-06)

For playing over days: "we need a push notification or something that says
it's your turn." A phone that turns alerts on (🔔 in the game's room, or ☰ in
an online game) hears when another player's move leaves the next one to it:
your turn, you're attacked, your move in a fight, the game has started. A
small Cloudflare Worker sends them (`push/`, with how to deploy it); the game
says nothing about alerts until `js/push-config.js` points at it. No alert
while your game is open in front of you. iPhones: iOS 16.4+, the game opened
from its Home Screen icon.

## SATTC Ultra (2026-11-07)

A switch on Home (`js/mode.js`) for trying bigger changes beside the standard
game. Its design notes are in `ultra-plan.md`. The aims:

- Strategies you steer into as the game goes, from your deck, your early draws
  and what the others do, with no tracks.
- Cards that are weak alone and strong together.
- Constant trade-offs between ways to grow.
- Many different powers, none beaten for free, like the web serial Worm.
- Party-style combos, as in an RPG.

**The switch.** This phone remembers it. New practice games and new rooms take
it, and a room keeps its own (`info.ultra`, which the host can flip in the
lobby), so a table always plays one set of rules. Engine: `setup.ultra` →
`s.ultra`. A setup without it plays the standard rules: every saved game, and
the lesson.

**Rules** (engine.js, all behind `s.ultra`):

- 30 Life, or 25 with three players.
- Energy grows by itself to 6; **Invest** raises it for good, up to 12.
- **Wounds stay**, healing half (rounded up) at the start of their owner's turn.
  Venom's damage is poison, which doesn't heal.
- **Sheltered** until its owner's next turn: no opponent's Spell or ability can
  target it, and it can't be hunted.
- **Legacy**: half a dying creature's growth passes to the weakest of its side.
- A creature sent back to the hand keeps its growth.
- One shared **Field** at a time.
- **Hexes** last until paid off.
- Death Is a Door, The Culling, Dawn's Judgment and Nerissa stay out of Ultra
  decks.

**Cards.** There are 31 Ultra cards (`ULTRA` in cards.js, numbered 101–131;
`ULTRA_POOL` is what an Ultra deck may use). Their new words are Invest,
Grows N, Multiply, Unstable, Fuse, Ritual, Hex, Field and Bodyguard. There are
also party pieces: Shield Captain, Field Medic, Rootmother, Thornback Archer,
Bloodbinder and Gravewarden. Five Ultra starters (`ULTRA_STARTERS`) each mix
two or three ways to build.

**Deck codes.** Decks with Ultra cards add a `~` part to their share code.
`Decks.validate(counts, { ultra })` keeps Ultra cards out of standard games and
`ULTRA_OUT` out of Ultra ones. An Ultra room won't start until every deck fits.

**Bot games** (`ultra-sim.mjs`, `pace.mjs`, `lifespan.mjs` in the session
scratchpad):

| | standard | Ultra |
|---|---|---|
| Rounds, duels | about 7.5 | about 10 |
| Rounds, three players | about 8 | about 12 |
| Creatures that ever grow | 15% | 42% |

- Every new mechanic turns up in a typical game. Per duel: 1.5 Invests, 1
  Ritual, 1.2 Fuses, about 5 Legacies and 2.5 Multiply copies.
- Starter decks win 36–58% in duels and 20–44% with three players (33% is even).
  Sky and Arrows is weakest with three players, and Endless Swarm in duels.

**On the table.**

- **Drafts.** Draft night and "Draft my deck" deal from `ULTRA_DRAFT_POOL` in Ultra.
  - That pool is 117 cards: the Week One 90 without `ULTRA_OUT`, plus the 31 Ultra cards. Fields go in the Relics pile.
  - A room's draft keeps the rules it was dealt with (`draft.ultra`, and a pool key of its own). The game after it plays by the same rules.
  - The draft bots value the Ultra keywords, and their advice has Ultra lines.
- **Stats.** A game record carries `ultra`, and Life is counted from the real start.
  - The stats now credit Life lost to eruptions, Bastion Wall and Grave Rite to whoever caused it. Self-inflicted losses (Blood Pact, an empty deck) count as `paid`.
  - Insights adds a Standard / SATTC Ultra filter.
- **Suggestions and pop-ups.** 💡 suggestions and the opponents' move lines put Ritual stages, Fuse and breaking a Hex into words. A Ritual never gets a "would do nothing" pop-up.
- **Champions.** Ultra games leave them out by default: practice hides the switch, and an Ultra room starts with them off.
- **Stress tests.**
  - 1,500 Ultra fuzz games and 2,000 Ultra bot drafts.
  - 80 drafted Ultra games, counted and reviewed (`ultra-chain.mjs`).
  - Draft nights on 2 and 3 phones, a two-phone online game and the practice draft, all run with `ULTRA=1`.
  - Ultra suggestions and the Insights filter, on a phone.
- The Field is a banner in the middle; tap it to read it.
- A Ritual sits in the Relic row with its stage count; tap it to pay the next
  stage.
- Marks on creatures: 🛡 Sheltered, ⛓N a Hex (tap the creature to break it),
  ☠N poison.
- Wounds show in the Vitality number.

## Champions, a prototype (2026-11-07)

"Starting everybody with one defender or something… what I like about Dominion
is you are always building and growing… and on a phone it could automatically
figure it out for you." With Champions on (a switch on the Play page, on by
default, and one in a game's room for the host), every deck starts with a
Champion on the table: the faction it has most cards of (`championFor`; the five
starters get five different ones). A Champion can block from the start but can't
attack until Level 2. It levels up as its player does its faction's thing, and
each level brings bigger stats and an ability that works on the rest of the deck
(CHAMPIONS in cards.js; `champLevel`, `gainXP`, `champOn` in engine.js):

| Champion | levels with | Level 2 | Level 3 |
|---|---|---|---|
| Aurelia (Radiant) | Spirits created (3, 6) | Spirits +1/+1 and Soar | each Spirit brings another |
| Pyra (Ember) | Spells played (3, 6) | each Spell: 1 damage to each opponent | Spells cost 1 less |
| Old Root (Verdant) | permanent boosts (4, 10) | the smallest grows each turn | every boost +1/+1 more |
| Morwen (Umbral) | creatures dying, anyone's (8, 14) | your creatures' deaths drain 1 | a dead creature (cost ≤ 3) returns each turn |
| Nim (Tide) | extra cards drawn (2, 5) | an extra card each turn | each card drawn drains 1 |

Its powers work only while it's on the table; if it leaves, it goes back to its
owner's hand (even a full one), 2 Energy dearer each time. Tuned with bots (1,200
duels): each Champion reaches Level 2 in 71–80% of games around its 4th–6th turn,
Level 3 in 20–49%, and the starters win 43–59%, as without Champions. A setup
without `champions` has none (old saves, the lesson). The table shows the level
as a gold ★ on the card, a level up gets the whole screen, and a player's sheet
(tap their bar) says how far along their Champion is.

## Combos that escalate (2026-11-07)

"There was something very exciting about combos and how things start
escalating exponentially that felt less true for this game." Bot games agreed:
about 1.5 cards a turn all game, the board stalled after turn 5, and only 12% of
turns ended with two engine creatures out. Three reasons: one copy of each card
(a two-card combo had turned up by turn 5 only 10% of the time; with two of each,
30%), about one card a turn, and synergies that add instead of multiply.

- **Two of each card in a deck** (`RULES.maxCopies`, `Decks.maxCopies`; one of a
  Legendary). Draft night keeps Week One's 90 cards, one of each (`DRAFT_POOL`):
  its rounds are built to use them up exactly.
- **Seven cards that multiply** (n 91–97, art in `js/art/scenes/new-d.js`):
  The Bright Choir (each Spirit you create brings another), Dawnsinger (every
  Spirit costs each opponent 1 Life), Crescendo (damage for each Spell this turn),
  Ripple (draw; the next Spell costs 1 less), Season of Plenty (every creature
  that has grown grows again each turn), Lantern Ferryman (your creatures that
  die come back as Spirits), Wild Bloom (double a creature for the turn).
- **Starter decks** are now chosen lists with two of the cards each deck is
  built around. In 1,200 bot games they win 46–54% each, as even as before.
- After the change: total Power on your side keeps climbing (15 by turn 7, 21
  by turn 10, against 13 and 15) and turns with two engines out went from 12% to
  19%. Bots don't plan a combo turn, so big single turns are for people to find.
- Bigger boards needed room: a fight with 5 or more attackers uses short words
  ("−7" under a column, the total in the line below) and smaller gaps, and wraps
  to two lines if it still won't fit (`fitDecision`). A folded side says
  "7 creatures · 2 Relics" on one line instead of showing its Relics, and on
  short phones Relics sit small in their player's bar.

## Invites that open the app (2026-11-07)

"If I make a game room, a link I can post in text that opens the app and takes
them into the game." On an iPhone no link can open a Home Screen app (a tapped
link opens Safari, which keeps its own name, decks and storage), but a tapped
alert does. So a new room's lobby offers **🔔 Invite Howard and T-Bone**: the
players of this phone's last few rooms whose phones have alerts on
(`Net.recentRooms`, `Net.invitees`). The tap asks the alert worker (`/invite`)
to wake them; tapping the alert opens the game straight into the room, seated
with the phone's name and deck (`acceptInvite`), with no code to type.
iPhones may open the app without the address the alert gives, so `sw.js` also
leaves the room's code in the cache, where the game looks when it starts or
comes to the front (`Push.takeInvite`). A friend has to turn alerts on once,
in any room, for this to reach them; until then there's the code and the
invite link.

## Asking first (2026-11-07)

"A message that pops up to confirm if people try to do obviously stupid
things." Before a legal move that is almost surely a slip, a sheet asks: Go
back, or do it anyway (`tryMove` / `slip` in game-ui.js):

- a spell or an ability that would change nothing right now (the move is
  played out on a copy and compared, apart from the card itself, its Energy
  and the log);
- one aimed at the wrong side, when the choice had both sides: destroying,
  weakening, freezing or handing over your own creature, making theirs
  stronger, Life lost by you or given to them;
- ending the turn with Energy and a creature or Relic still to play (Energy
  left over is only good for Tricks until your next turn);
- not blocking when that puts you out, while a creature of yours could block.

Not in the lesson, and never for the 💡 suggestion's own move.

## Starting at 3 Energy (2026-11-07)

"Players in the first few rounds just sit around doing nothing." With 1
Energy on the first turn, a third of players did nothing on it in bot games,
and the next turns were about one card each. Everyone now has 3 Energy on
their first turn (`RULES.startEnergy`), then 1 more each turn, up to 8.
Going first doesn't run away with it: in 1,000 bot games per setting the
first player won 57% starting at 1 and 53% at 3, since new creatures still
can't attack the turn they arrive, so everyone has put down blockers before
the first real attack. A setup carries `startEnergy`; one without it starts
at 1, so games saved before the change (and the lesson, which teaches one
card at a time) replay as they were played.

Energy is drawn in the same bronze hexagon as a card's cost (players read the
⚡ and the hexagon as two different things): your bar, the others' bars, the
hand view and the fight screens. An ability chip keeps its ⚡, with its cost in
a hexagon.

## Fights, step by step (2026-11-04)

Asaf found blocking "super hard to follow" and the swipe that confirmed a move
"not very intuitive and still often hard to see", so a fight now explains
itself on the table.

- **One button moves the game on:** End turn, Attack, Block (or No block)
  and Fight, at the right of the strip above your hand, under the thumb, always
  in the same place, where nothing on the table can cover it. It is gold when
  it is the thing to do. End turn stays plain while you could still play a card
  or attack, and then its first tap only asks ("End turn anyway", with a note
  saying what you could still do), so a stray tap never throws a turn away.
  Cancel and Clear sit on the left. (The swipe across the table is gone.)
- **What to tap** is written just above the fighting creatures: "Tap your
  creatures to add or take out attackers", "Tap your creatures to block. Two
  can team up on one attacker", "Tap a blocker again to move it or take it
  back", "Play a Trick now (it glows in your hand), or tap Fight". On short
  phones in a three-player fight, where that label is hidden, the banner under
  the fight carries it (`fightHow` in `js/game-ui.js`).
- **Blocking is taps:** tap one of your creatures and it steps in front of an
  attacker it can stop (the first one nobody blocks yet). Tap it again and it
  moves on to the next attacker, and after the last one back home
  (`cycleBlock`). Dragging it onto an attacker puts it exactly there (a Guard
  takes a second attacker that way).
- **Why it works or not:** while you decide, ☠ marks every creature that would
  be destroyed if no one plays a Trick, and the banner says what you would
  take and lose (`fightPreview`, worked out once for each set of blocks).
  Tapping a creature that can't block says why: exhausted (it attacked),
  frozen, "can't block" on its card, or the attacker has Soar and only Soar or
  Reach can block it. A hunted creature says what it must block.
- **"Agree to fight":** after blockers are chosen, whoever could still play a
  Trick (or use an ability) gets the chance, and the button says Fight.
- **Room on short phones:** during a fight on a short phone with three
  players, both opponents fold to their bars, the hand sinks lower, the fight's
  cards are a little smaller and its banner compact, so the attackers, your
  blockers and the banner all fit an iPhone SE without covering each other.

## Fights, big (2026-11-04)

Asaf's idea: when creatures fight, the cards come up big and you move
through what happens step by step, with words saying what happened and why.

- **When:** every fight you are in (attacking or blocking), in place of the
  small fight on the table. A fight between two others plays on the table as
  before; tapping the note it leaves under the table ("⚔ … ▶ Replay") plays it
  big too, as it does for your own.
- **The steps** (`fightStory` in `js/fightview.js`, from the move's events and
  the table before and after it): one per attacker that was blocked (its
  blockers below it, yours always at the bottom), one for the attackers nobody
  blocked (charging the player's Life), and one at the end (everyone's Life,
  what each side lost, and anything else that happened, in the game's words).
- **The words** say what happened and why: who blocks whom with their Power
  and Vitality; who strikes first (Swift) and "Then …"; how an attacker splits
  its damage among creatures that team up (the costliest first); Overrun
  carrying the rest through; and for each creature, destroyed or surviving
  with its damage against its Vitality (counting a Guard's two attackers and a
  burst like Smoldering Golem's; Venom destroys with any damage). The first
  time, a line says the rule: a creature is destroyed once its damage reaches
  its Vitality. Repeats are counted ("your two Spirits", "both your
  Spirits"). Numbers that couldn't tell the whole story are left out.
- **Moving through it**, the way phone stories work: bars at the top, one per
  step. Tap to go on, tap the left edge to go back, hold to pause, Skip to
  close. Each step also moves on by itself once there has been time to read
  it (longer for more words), so an online game never waits on a tap. The hits
  play on the big cards (clashes, lunges, the numbers, Vitality going down);
  the destroyed crumble and stay dimmed under a ☠.
- `collective.bigFights` = `0` in local storage turns it off (the older phone
  tests do this; `tools`-side tests of the big view leave it on).

## Your hand, and gestures

Where a gesture is easy to guess, it replaces a button or a line of text:
looking through cards and putting things away. Committing to a move is a
button. Things the thumb uses sit low on the screen, in the same place
whatever the text above them says.

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
- An iPhone SE in Safari (about 550px tall, `max-height: 600px`): smaller
  creatures on the table (and a smaller hand with three players), so the
  whole table fits above the strip and the hand instead of spilling over
  them. The middle of the table can shrink to almost nothing there; a 💡 tip
  taller than it grows up over the row above instead of being cut off.

## Rule changes from the first draft

- Up to **3 factions** per deck (with 2, a pair had only 32–34 legal cards).
- **Countercurrent** is a Trap set on your own turn, so nothing is played on an opponent's turn.
- The first player skips their first draw; everyone else starts with a **Spark** (0: gain 1 Energy this turn).
- Everyone has **3 Energy** on their first turn (it was 1 until 2026-11-07), then 1 more each turn.
- Empty deck: lose 2 Life per missing draw. Board max 7 creatures; hand max 10.
- "The opposing player" became "each opponent" / "an opponent" so cards work in 3-player games.
- Little Gardener triggers once per turn (two of them would otherwise loop forever).
- Phoenix returns during your next turn (no start-of-turn prompt); Forbidden Archivist costs 1 Life instead of an optional Energy payment, so neither needs a decision on someone else's turn.
- Buff spells target your own creatures; Deepwater Leviathan's bounce is optional.
