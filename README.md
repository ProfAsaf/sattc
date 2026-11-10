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
| `tools/lab.mjs` | The tournament lab: bots with their own Ultra deck and play style (ai.js `STYLES`) evolve in winner-stays duels; it reports the champions (and how they do against the starters), the cards winners keep and drop, and games that look broken (`node tools/lab.mjs 20 24 8 <seed>`; `KNOBS='{"growthCap":true}'` tries a rule switch) |
| `tools/elo.mjs` | The Elo ladder: bots from Random to Planner play Ultra duels on the same deals both ways, and a Bradley–Terry fit rates them, the practice bot at 1500 (`node tools/elo.mjs 30 <seed>`; `BOTS="Practice,Planner"` for some) |
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
  - **Grading by winning chances** (since 2026-11-10; the review has `v: 2`):
    - The score becomes a chance on the same curve as "your chances", and a decision's loss is the percentage points of winning chance it gave up.
    - Thresholds, as Lichess grades chess: Inaccuracy 5, Mistake 10, Blunder 15.
    - Decisions where every option leaves the game as good as settled (under 3% or over 97%) aren't judged. Before, the review graded the raw score: in game ERZN, a 70–3 win, holding back attackers while 99% to win was four "blunders" and 63% accuracy. Now it gets 74%, with its three real slips from the close part of the game.
    - Accuracy averages `100·e^(−loss/10)` per decision. On bot games a careful bot scores 100%, a noisy one 99% and a random player 64% (`tools/test-stats.mjs` prints them).
    - Older saved reviews keep their old grades.
  - **The cards you play** (since 2026-11-10, review `v: 3`):
    - At the start of each of your turns, the review takes the cards you played (and abilities used, Digs, Ritual stages) and puts them back on the turn's starting position, without the fights. The bot does the same with its own choice of plays, no attacking, and its budget is cut by the Energy you spent in fights.
    - It compares the two positions after removing from both whatever your fights killed, so a Spell on a creature that died in the fight anyway earns nothing.
    - The same cards in another order count as agreeing. Turns where you kept Energy for a Trick in hand aren't judged.
    - Ending your turn is now judged only for an attack you didn't make; the cards are judged here.
    - A careful bot still scores 100% with no notes; a random player scores 70%.
    - **Checked against the future when it's economy:** a position's score can't see Energy and cards paying off a turn or two later.
      - So when your plays were economy (Invest, raising maximum Energy, drawing, a Dig), a loss worth a note is checked: both positions are played on by the bot through your next two turns, 4 times with what you can't see shuffled.
      - The note needs both to agree, and the smaller loss counts.
      - The futures run a step at a time, so the phone doesn't stall.
      - Game VCGW: a ramp turn the plain score called a blunder (bot play-outs: 71% as played against 56%) is no longer one.
    - Game JXJH's review now catches round 6: "You played The Merchant Tortoise and Windborne Sage. The bot would have played Grand Illusion and Patient Giant."
  - Tricks that won a fight by 5 points or more are Great.
  - Energy kept for a Trick in hand isn't counted against you, and neither is a decision with no choice.
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
- **Share this game** (2026-11-08), at the end of every review: it sends the
  saved game to `rooms/{code}/shared` under a fresh 4-letter code (as JSON
  text: `Net.shareGame`) and shows the code, so someone else can look at it.
  The newest 12 saved games also keep their setup and move list (`play`), so
  theirs replays move by move; older ones share their summary and review.
  Read one with `node .phone-tests/shared-game.mjs CODE`.

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

**Bot games** (`ultra-sim.mjs`, `pace.mjs`, `lifespan.mjs` in `.phone-tests/`,
which git ignores):

| | standard | Ultra |
|---|---|---|
| Rounds, duels | about 7.5 | about 10 |
| Rounds, three players | about 8 | about 12 |
| Creatures that ever grow | 15% | 42% |

- Every new mechanic turns up in a typical game. Per duel: 1.5 Invests, 1
  Ritual, 1.2 Fuses, about 5 Legacies and 2.5 Multiply copies.
- Starter decks win 42–56% in duels and 31–35% with three players (33% is even),
  over 2,600 bot games after the 2026-11-08 retune. Before it, three-player games
  ran 22–46%: Blood and Bone and Endless Swarm hit *each opponent* at once,
  which counts double with three players, while Sky and Arrows and The Giant
  could only hit one at a time. The retune:
  - The Giant: a second Stoke the Furnace and Patient Giant, and Smoldering
    Golem, for Reckless Initiate, Ash Collector and Kindle. It builds slowly,
    so with three players both opponents attacked it before it was big.
  - Sky and Arrows: a second Drowned Clock and Wavewarden, for one Tidecaller's
    Library and one Sky Warden. It had won 61% of duels.
  - Blood and Bone: a second Carrion Wyrm for The Pale Abbess.
  - Endless Swarm: a second Choirmother and Standard Keeper, for one Dawnsinger
    and The Pale Abbess.
  - The variants were tried with `bal.mjs` in `.phone-tests/` (deck swaps from
    a JSON file, both formats, without touching cards.js).

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

**Seeing it build (2026-11-08).**

- **💥8/10** on an Unstable creature: its Power, out of the 10 that sets it off.
  It pulses red the turn before it erupts, and its sheet says how many turns are
  left (`unstableClock` in engine.js counts what makes each swell bigger:
  Overgrowth, Grandmother Bramble, Season of Plenty).
- **Helping it.** A creature's sheet lists what is doing something for it right
  now (`helpers` in engine.js, by the same rules as `power` and `vitality`):
  - its own growth and this turn's boosts;
  - the cards on its side: "Shield Captain: +0/+2, and +0/+1 for good each time
    it blocks", "Thornback Archer: 2 damage to whatever it fights, before anyone
    strikes", Field Medic, Rootmother, Bloodbinder, Gravewarden, a Bodyguard
    beside it;
  - the Field.
  Standard games list their boosts too (Standard Keeper, Choirmother, Banner of
  the Charge…). The wounds line says what the Field does to healing.
- **The first Ultra game** on a phone opens with "What's different" before the
  opening hand (`collective.ultraIntro`). After that, ☰ → How the table works
  has the same.

## SATTC Ultra, second version (2026-11-08)

After the first Ultra game the user reported five problems:
- late in the game there were no cards left and nothing to do;
- no Legendary characters;
- few of the strategies we'd talked about;
- one or two super-powered creatures just crush;
- not tricky or clever enough.

Bot games (`.phone-tests/ultra-feel.mjs`) agreed:
- a real choice on 96% of turns in rounds 2–3, but about half from round 8;
- 2+ Energy left over on 40–50% of late turns;
- one Legendary in the five starters;
- no Traps and 1–2 Tricks per starter.

New Ultra games are set up with `ultra: ULTRA_V` (2: `s.uv`). A setup with
`ultra: true` is version 1, so saved games replay unchanged (checked: the old
decks' fuzz games come out move for move as before).
- **Legends** (`LEGENDS` in cards.js; `legendFor` gives a deck its own):
  - Each deck's Legend waits beside the deck (`P.legend`, zone `legend`) and
    plays from there (`from: 'legend'`).
  - It levels like a Champion (`P.champ`, `P.cxp`), from its strategy, even
    before it is played: Halvard from Guard creatures at the start of your
    turns, Aeris from flier hits on players, Vesh from wounds, Ymra from lasting
    boosts, Lumen from tokens.
  - If it dies it goes back beside the deck, 2 Energy dearer. Nothing can be
    fused into a Legend (`ULTRA_V2.fuseLegend`).
- **Symbiotes** (the user's design, chosen over "fuse any creature card from
  the hand"):
  - The four Fuse creatures are Symbiotes: Molten Core, Bark Graft, Wing Graft
    and Venom Shard.
  - From the turn after one arrives, its ability (`{ t: 'use', uid, prey,
    target }`, 1 Energy) kills a creature it can kill in one hit
    (`symbioteNeeds`: Vitality left no more than its Power, no Shield, on either
    side). It then fuses into another creature of yours.
  - It arrives without Shelter, so opponents get a turn to kill it. A swarm of
    weak creatures is its food.
  - Fusing any creature card from the hand (`fuseIn`, `fuseHosts`, "Fuse in" on
    the table) is still in the code, switched off by `ULTRA_V2.fuseHand`.
- **Dig**: `{ t: 'dig' }`, 3 Energy for a card, once a turn.
- **Ganging up**: each of 2+ blockers on one attacker strikes 2 harder
  (`ULTRA_V2.together`).
- **Traps** (n 132–136): Pitfall, Mirror Shield, Fog Bank, Grave Snare and
  Backdraft each stop a big attacker for a while (`leaveFight`, `C.fog`).
- **Shields** (the user's glass-cannon idea):
  - Each one stops one hit, and they stack (`c.shield`, `giveShield`).
  - n 137–141: Sunglass Lancer (4/1), Prism Duelist (3/1 Soar with a Shield),
    Aegis Acolyte, Ward of Dawn and Shieldwright.
- **Starters**:
  - each names its Legend, and has 2–3 Traps or Tricks;
  - Sky and Arrows became fliers and glass cannons behind Shields.
- **Bots**:
  - they fuse (mid-fight too), dig and play their Legend;
  - they don't see others' face-down Traps in Ultra;
  - they gang up three-on-one;
  - they count Shields in their fight math.
- **Table**:
  - the Legend sits first in the hand row, in gold, and the hand turns to it the
    first time it can be played;
  - a Symbiote's ⚡ asks what it kills, then what it joins;
  - Dig on the strip;
  - ◈ and a glassy ring for Shields;
  - an opponent's waiting Legend is a ★ on their bar;
  - "What's new" once per phone (`collective.ultraIntro2`);
  - the help and the rules page explain it all.

Tuning (`bal.mjs` takes `KNOBS` and `CARDS` patches; `skill.mjs` is new):
- **Legends at first decided games.** Ymra dealt 20 damage a game, and The
  Giant won 79% of its duels while The Wall won 19%. The fixes:
  - no fusing into Legends;
  - smaller Ymra and Aeris;
  - Halvard levels from his own wall, not from being attacked.
- **Vesh levelled too fast with three players** (two opponents wound you), so
  she needs 8 and 18 wounds there (`xp.at3`, `xpAt`) and 5 and 12 in a duel.
- **With Symbiotes (as published)**, against version 1 and against fusing any
  card from the hand:
  - late turns with a real choice: 85% (31–53%; 89–95%);
  - Energy left late: 0.6 a turn (about 2; 0.5);
  - the first to an 8-Power creature wins 67% (66–76%; 72–80%);
  - the Life leader at round 6 wins 54% (58–67%; 69–75%): more comebacks;
  - a Legend played in every game; 10 rounds a game.
- **Skill** (`skill.mjs`: careful bot against one that makes a random move 20%
  of the time):
  - careful wins 76% (71% under version 1, 69% with fusing from the hand);
  - the strongest deck (The Giant, 61% careful against careful) loses the most
    when played shakily (−32 points), and Sky and Arrows the least (−15).
- **Balance** is still open: duels 41–60% (The Giant strong, Endless Swarm
  weak), three players 25–49% (Blood and Bone strong).
- **Tests**:
  - engine: 576 checks plus a version 2 fuzz;
  - `.phone-tests/ui-ultra2.mjs` 26/26 (Legend, Symbiote, Dig, Shields, What's
    new, help);
  - the two-phone online Ultra game 16/16.

### The tournament lab, and version 3 (2026-11-08)

The user asked for bots of different styles and skills playing big
winner-stays tournaments, a genetic algorithm to find what always wins and
what loops forever.
- **Bots now have play styles.** In ai.js, `chooseAction({ style })` reads
  `STYLES`: balanced, brute, swarm, trickster, burn, combo, economy,
  necromancer and defender. A style weighs Life, attacking, the table, cards,
  Investing, Traps and Tricks, and the threat it faces. It also adds bonuses
  for a wide table, one big creature, engines, and creatures in the discard
  pile. Without a style, nothing changes.
- **`tools/lab.mjs` runs the tournaments.**
  - Each bot is an Ultra deck of two factions plus a style.
  - Each generation, every bot plays 8 duels. The better half stays, smoothed
    over generations.
  - Children of survivors get 1–3 cards swapped and a nudged style, sometimes
    a crossed deck. A few random newcomers join each time.
  - It flags unfinished games, chains of extra turns, a hand of 14+, 60+ Life
    and 25+ rounds.
- **What its first runs found** (20 generations of 24 bots, about 2,200 games
  each):
  - **A fight bug.** A blocker struck back with Power from the wounds it had
    just taken (Bloodrage Berserker, Vesh at Level 3), and with Drain from them
    (Vesh at Level 2). Vesh decks rose to the top, and Life reached 120–218.
    **Version 3** makes every strike in a step simultaneous, with the Power,
    Drain and Venom the strikers had before anyone was hurt (`strikePlan`).
  - **Runaway growth.** The Wall reached 36/34 by round 22. **Version 3 adds
    the growth cap** (`ULTRA_V2.growthCap`, `growthCap`): no more lasting
    growth than your maximum Energy. Unstable still swells past it, then
    erupts and starts again. This is the user's rule that the really powerful
    things need Energy beyond the normal maximum: with the cap, the evolved
    winners value Investing, and the peak Life in the same matchup fell from
    211 to 91.
  - **Ember/Verdant is the strongest faction pair.** Every run with the fixed
    fights ended with all survivors there. They keep Apex Predator, Grove
    Druid, Patient Giant and Sproutling.
  - **No single winner.** Different runs found different champions, and each
    had a starter that beat it.
  - Cards no survivor kept: in the old runs, much of the Shield set, Shield
    Captain, Carrion Wyrm, Season of Plenty, Blood Pact, Scorched Earth and
    others; in the fixed runs, The Mountain Is Angry, Heartwood Totem and
    Backdraft.
  - The user is fine with long games (13 rounds).
- **Version 3, by bot games:**
  - first to an 8-Power creature wins 62%;
  - late turns with a real choice: 86%;
  - the Life leader at round 6 wins 55%;
  - three players 26–39% per starter;
  - careful beats shaky 72%;
  - after trimming The Giant (Seedling and Smoldering Golem in for a Grove
    Druid and a Patient Giant): duels 46–56% and three players 28–40% per
    starter.
- Version 3 games are set up with `ultra: 3`. Version 2 games keep the old fight
  order and no cap.

## SATTC Ultra, version 5: a rules audit, discovered decks, guerrilla cards (2026-11-09)

The user asked three things: whether the bots discovered strategies we hadn't
named; whether rush or guerrilla play checks the strong decks; and how much
there is to learn ("I love deep strategy but it won't work if they need to
memorize a million things"). After the answers they said: do all three
follow-ups.

- **What the bots found.** `tools/lab.mjs` now takes `PAIR=ember,umbral`
  (evolve inside one faction pair) and `BENCH=n`, and saves its last
  survivors. `.phone-tests/pairs.mjs` reads such runs, and
  `.phone-tests/fingerprint.mjs` records how a deck plays (win round, early
  damage, board, Invests, draws, removal, Traps).
  - Plans no starter had: spell-fed growth (Verdant/Tide, 70% against the
    starters), death burn (Ember/Umbral), growth plus Shackles
    (Verdant/Umbral), the fog lock (Tide/Umbral), a flying rush (Tide/Radiant),
    walls plus Wildfire (Ember/Radiant), a midrange stomp (Ember/Verdant).
  - Every Tide pair's winner kept two Spellwright Apprentices, and three of
    four kept the Rolling Fog.
- **Rush and guerrilla play.** The Charge wins around round 7 (others 9–13)
  and checks the slow decks; walls check it. Disruption worked as lockdown,
  not tricks, and nothing in the pool touched an opponent's economy, discard
  pile or hand.
- **The rules audit.** New switches in `ULTRA_V2` (`shelter`, `legacy`,
  `keepGrowth`, `poison`, `wounds`, beside `legends`, `dig`, `together`,
  `growthCap`); `tools/elo.mjs` and `bal.mjs` take `KNOBS`. Each rule was
  switched off for a skill ladder (a 1-in-5 blunderer, the practice bot, the
  Planner) and a balance run; `.phone-tests/rulefreq.mjs` counts how often each
  rule comes up.
  - No rule on its own changed skill measurably, and none made balance
    clearly better when gone.
  - Most are the user's own rules (wounds that heal half, the growth ceiling),
    their requests (ganging up, Dig, Legends), or keep their principle that no
    answer erases a build for free (Hexes, Venom's poison, Legacy). Without
    Venom's poison, Venom kills any giant outright and balance swings up to
    14 points.
  - **Cut:** a creature sent back to the hand keeping its growth (it came up
    0.6 times a game and changed nothing). In version 5 games it comes back
    fresh.
- **Version 5** (`ULTRA_V` 5, `ultraV5`):
  - Spellwright Apprentice grows with your first Spell each turn.
  - The Rolling Fog lifts at the start of its owner's third turn (`clock`;
    the banner counts down).
  - Two starters from the lab's winners, each with its Legend (`since: 5`):
    **Spellbloom** (Verdant/Tide, Ione) and **Fogbound** (Tide/Umbral, Hush).
  - Six guerrilla cards (n 173–178): Choking Smoke, Tollkeeper, Grave Robber,
    Pickpocket, Whispered Doubt, Blight Beetle. Smoke and Mirrors took
    Pickpockets, Whispered Doubt and a Grave Robber; The Charge Choking Smoke;
    Rot and Bloom a Blight Beetle; Weathermakers a Tollkeeper.
  - Older games keep version 4's rules, cards and Legends.
- **Balance** (936 duels, 286 three-player games, thirteen starters):
  - Spellbloom and Fogbound came out of the lab at 67% and 71% and were
    trimmed: fewer doubles and bombs, and their Legends level more slowly.
  - Duels 40–60% per starter: The Wall and Spellbloom 60, Blood and Bone 40.
  - Three players 12–45% (a fair share is 33%): Smoke and Mirrors (12%) and
    The Charge (23%) still trail. That's the open three-player question.
- **Tests:** 720 engine checks with the fuzz over all thirteen starters;
  `.phone-tests/ui-ultra5.mjs` (13 checks).

## SATTC Ultra, version 4: six more ways to build (2026-11-08)

The user asked for the strategies still missing a deck (economy and extra
cards, necromancers who sacrifice for power, tricksters, Spells, controlling
the Field, hitting early), with one rule across all of them: the really
powerful things only come with Energy beyond the usual 6. So each new deck has
its own way to Invest, its top card costs 7 or more, and it brings a Legend
that levels up from its plan. `ultra-plan.md` ("Version 4") has the table.

- **31 cards** (n 142–172) and **six Legends** (`since: 4`):
  - The Long Game: The Granary, Pearl Diver, Compound Interest, The Merchant Tortoise; Marisol.
  - Rot and Bloom: Grave Harvest, Bone Lance, Bone Tithe, Mire Witch, Danse Macabre; Morrow.
  - Smoke and Mirrors: Turnabout, Bluff, Reed Lurker, Gloom Stalker, The Puppeteer, Grand Illusion; Mirelle.
  - Storm Rising: Spellwright Apprentice, Static Spark, The Arcane Well, The Last Storm; Seren.
  - Weathermakers: Weatherwitch, Storm Shepherd, Gale Winds, Rolling Fog, Hallowed Ground, Keeper of the Skies, The Eye of the Storm; Oriel.
  - The Charge: Ash Squire, War Drummer, War Chest, Blitz Captain, Hour of Glory; Kasimir.
- **New words:**
  - **Ambush**: a creature you can play in a fight like a Trick. Played before
    you block, it can block. The block screen offers it.
  - **Offering**: as you play the card, you may sacrifice a creature of yours
    for the stronger effect. On the table it is the first step, with a
    "No Offering" button; `a.offer` in an action.
  - **"Your Field"**: one you played (`fieldMine`). The banner says whose it is.
- **Engine** (`js/engine.js`):
  - `v4Bonus` (Power and Vitality from the Field and the new cards), `v4Price`
    (what the new cards change about costs), `sacrificed` (every sacrifice,
    for the Mire Witch and Morrow), `offering`, `fieldArrives`, `spellPlayed`.
  - The Granary stores Energy at the end of a turn (`stored`) and gives it
    back at the start of the next.
  - The Puppeteer's ability takes `fighter` and `target`. Rolling Fog checks
    attacks; Hallowed Ground checks `canAttack`.
  - **Version 4** (`ULTRA_V` 4) only changes which Legends a deck can get:
    `legendFor(deck, v)` chooses among the Legends a game's version has, so
    older saves replay with the Legend they had. The new cards are just cards.
- **Bots** (`js/ai.js`):
  - They value Investing by the turns left to use it (`investWorth`). A flat
    2.6 made every bot skip Grove Druid, Tide of Fortune and the like for the
    biggest creature it could afford, which sank The Long Game.
  - They value Energy a Granary would save, play Ambush creatures before
    blocking, make Offerings, and attack with two at most in the Rolling Fog.
- **Tuning** (12 duels for each of the 55 pairings, five rounds):
  - Buffs to the four engine decks: sturdier early creatures, cheaper engines,
    top cards at 7, Legends a size bigger, Grand Illusion and Canopy Archers
    for The Long Game, Overrun on the Tortoise.
  - The Wall lost a Bastion Wall, and Halvard needs 5 and 11 Guard-turns.
  - Three-player rounds: Endless Swarm lost Dawnsinger. Bluff also draws a
    card, and Gloom Stalker is 2/4. Kasimir starts 2/3. The Charge has two
    Cinderlings, two Watchful knights and a Shieldbearer. Smoke and Mirrors has
    Bonepicker and Hungry Ghoul in place of two answers.
  - **Duels: 39–59% per starter.** The Wall and The Charge 59, The Giant 57,
    Sky and Arrows 56, Endless Swarm 54, Weathermakers 50, Rot and Bloom 49,
    Storm Rising 44, Blood and Bone 42, The Long Game 41, Smoke and Mirrors 39.
  - **Three players: uneven, 14–49%** (a fair share is 33%). The Giant 49 and
    Endless Swarm 48 lead; Smoke and Mirrors 16 and The Charge 14 trail. With
    two opponents, the bots attack whoever has the fewest blockers: the
    reactive deck, and the fast deck whose attackers just exhausted. The bot's
    aggro also spreads its hits instead of finishing one player. Still open: a
    three-player rule (a bounty for knocking a player out, say) or more tuning.
  - The tournament lab (12 generations, 1,812 games): no loops or runaway
    Energy. Winners keep Bone Tithe, Bone Lance, Ash Squire, Gloom Stalker and
    Bluff, and the survivors were Radiant/Umbral and Ember/Umbral. About 2% of
    games still run to 60–112 Life (death and Drain life gain).
- **The Elo ladder** (`tools/elo.mjs`): the user asked how much skill there really is. Bots of seven
  strengths played 1,260 Ultra duels with the eleven starters, every deal both
  ways (seed 21); a second run added the deepest bot (seed 22). Ratings, with
  the practice bot at 1500:

  | Bot | Elo | How it plays |
  |---|---|---|
  | Random | 559 | a random legal move |
  | Shaky 40 | 1188 | the practice bot, but 2 moves in 5 at random |
  | Shaky 20 | 1297 | 1 move in 5 at random |
  | Careful | 1458 | the practice bot without its small noise |
  | Practice | 1500 | the bot in the app |
  | Expert | 1516 | also looks at what its best 4 moves lead to this turn |
  | Planner | 1516–1567 | plays its best 3 moves on to its next turn, with the cards it can't see shuffled (`planAction`) |
  | Deep Planner | 1610 | 4 moves, each played on 3 times |

  - Mistakes cost the most: a random move 1 time in 5 is about 200 points (it
    wins 27% against the practice bot); 2 in 5, about 310 (8%).
  - Looking further ahead keeps paying, with no ceiling yet: the Planner beats
    the practice bot 57–60%, the Deep Planner 65% (and the Planner 57%). A
    second look within the turn adds little.
  - The decks that reward care most: a careful bot beats a shaky one 90% with
    The Long Game, 89% Rot and Bloom, 86% The Giant, and least with Storm
    Rising (71%) and The Charge (72%).
- **Tests:** 687 engine checks, with the v4 fuzz now over all eleven
  starters; `.phone-tests/ui-ultra4.mjs` (20 checks: an Offering, the
  Puppeteer, an Ambush on the block screen, the Fog, the Granary, whose Field,
  the help); `ui-ultra2.mjs` checks the new "What's new" (key
  `collective.ultraIntro4`, shown once more to every phone).

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
- **The whole hand, big:** tap a card to see your whole hand full size (your
  opening hand, and either side of the table, open the same way). Swipe
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

## When the app restarts, and moves that knock you out (2026-11-10)

Asaf: "sometimes it freezes with a white flash and takes me out of game".
- No code reloads the page: the service worker only handles turn alerts.
- A whole game on a 4× slowed CPU kept the JS heap at 6–7 MB, about 570 elements, and no stall over 0.6 s.
- So it is most likely iOS closing the page, in the background or when short of memory, and opening it afresh.
- **Back in by itself:** a practice game saved in the last 20 minutes, and not left on purpose, opens again on start-up from Home or Play (`autoResume`). Online games already rejoined (`autoRejoin`).
- **A move that would knock you out asks first:** playing a card, using an ability or Digging (`outSlip`). It says how: "Grand Illusion would make you draw 7 cards from your empty deck: 2 Life each, 14 in all, and you have 14." Game DTSN was lost exactly so.
- **An empty deck says so** on your bar ("empty"; held: each draw costs 2 Life).
- **The summary:** a game lost to empty draws now reads as the deck, not a spell.
- Test: `.phone-tests/ui-resume.mjs`.

## Busy moments, lighter (2026-11-10)

Asaf, on the white flash: "It is in the middle of play. Often if a lot of things are happening in the game at once."
On an iPhone everything that moves is a layer of its own, as big as it is. A screen of layer is about 12.6 MB at 3x. A page that runs out of room is closed: a white flash, then the home screen.

Measured on a 402×874 screen at 3x with the CPU slowed 4×, at the busiest moment (`.phone-tests/ui-busy.mjs`):

| moment | moving at once | their area | effect elements |
|---|---|---|---|
| Wildfire over two full tables (14 die) | 413 → 118 | 3.9 → 3.1 screens | 3,486 → 463 |
| the same with Smoldering Golems | 330 → 128 | 5.2 → 3.1 screens | 3,118 → 697 |
| attacking with five, a big fight | | 6.1 → 3.1 screens | |

- **Attack arrows** were each a full-screen layer, redrawn every frame. Five attackers meant five screens, about 63 MB. Each arrow now covers only its own box, about a fifth of the screen (`fitArrow`).
- **Deaths** broke a card into up to about 20 copies of the whole card, each cut by a clip-path (which doesn't make its layer smaller). How many pieces now depends on how many die together (`death(…, { of })`):
  - one: about 14;
  - two: about 9 each;
  - three or four: four each;
  - five or more: each flashes and falls away in one piece, at slightly different times (`sink`).
  - Shards in flight never cover more than 1.5 screens, so tapping quickly through a big fight can't pile them up.
- **Limits on the other effects:**
  - at most 90 particles at once (was 200), 6 rings, 4 glows;
  - rings at most 200 px across and glows 320 px (a hit on a Life bar made a ring the width of the screen);
  - a sweep that hits four or more gives each a lighter hit, and its full-table tint is gone.
- **Sheets** have no backdrop blur (it keeps a blurred copy of the whole screen); they are a little darker instead. The table's attack lines keep still under a fight played big.
- Tests: `ui-busy.mjs` checks four busy moments against limits (at most 220 moving, 4.5 screens of them, 900 effect elements). It also checks that each moment plays out. `look-deaths.mjs` takes screenshots of deaths partway through.

## The deck clock (2026-11-10)

Asaf: "I had no idea that trying to draw cards when you have none hurts you. Is that necessary? It is confusing. There is already an obvious punishment from not being able to draw any new cards."

Bot duels, both ways (`.phone-tests/deck-out.mjs`; `DAMAGE=0` turns the Life loss off; `CLOCK=1` plays the new rule):

| | starters (1,560 games) | Asaf's DTSN deck vs each starter (260 games) |
|---|---|---|
| a deck runs out | 6% of games, first around round 16 | about 7% |
| the Life loss decides the game | 1.7% | 2.7% |
| with it off: games that never end | 3 (0.2%) | 0 |
| average length, on → off | 10.1 → 10.1 rounds | 10.0 → 10.1 rounds |
| DTSN deck's win rate, on → off | | 66.9% → 67.7% |

Not drawing is punishment enough. Still, something has to end the stalemates that come once both decks are gone.
The confusing part was card effects: in game DTSN, Grand Illusion's 7 draws cost 14 Life at once.

- **The rule now:** if your deck is empty when your turn starts, you lose 2 Life instead of drawing. Any other draw from an empty deck does nothing: draw spells, Tidecaller's Library's extra card, the Crown's card.
- **Old games:** new games are set up with `deckClock: true` (`newGame`; practice, online, rematches, `?seed=`, and the bot tools). A setup without it keeps the old rule, so games saved before replay as they were played.
- **Your bar** says so when your deck is empty (held: "you lose 2 Life at the start of each of your turns"). The rules page says so too.
- **The knockout warning** (`outSlip`) now comes from paying Life, such as Blood Pact at 3 Life. Draws only cost Life in old games.
- Tests: `test-engine` "The deck clock" (7 checks, and half the random games play it) and `ui-resume.mjs`.

## Your rating (2026-11-10)

Asaf asked where to see their estimated Elo. This is phase 3 of
`bot-training-plan.md`, in `js/rating.js`:

- **Glicko-2**, the rating Lichess uses, against the bot levels as fixed
  anchors (their measured Elo in `ai.js LEVELS`; deviation 50).
  - You start at 1500 with a deviation of 350.
  - Below a deviation of 110 the rating settles; until then it shows a "?".
  - The update follows Glickman's paper and is checked against its worked example in `tools/test-stats.mjs`.
- **What counts:** finished practice games against the bots, worked out
  again from the games saved on the phone, so there's nothing new to store.
  - A game where you took back a move isn't rated (as on chess sites), and neither are online games or the lesson.
  - Games from before the levels were against Practice (1500).
  - A three-player game is a result against each bot, by who outlasted whom, at half weight each.
- **Where it shows:**
  - The Play page, over the Level picker: "Your rating: 1543? · between Practice (1500) and Expert (1650)".
  - An Insights card with its line over your games.
  - The end screen: "Rating 1547 (+15)", or "Not rated: a move was taken back".
- Tests: `.phone-tests/ui-rating.mjs`.

## Bot levels, and training the bots (2026-11-09)

Asaf wanted a way to train the bots, difficulty levels to choose from, and
eventually Elo ratings for bots and people (plan: `bot-training-plan.md`).

- **Brains.** The numbers a bot scores positions with moved into a "brain"
  (`js/brains.js`, one weight per term of `ai.js features()`). `CLASSIC` is
  the hand-set brain: with it the bot plays exactly as before (checked move
  for move). `chooseAction(…, { brain })` and `planAction(…, { brain })` take
  any brain.
- **The race.** New terms say how much of each side's Life the other takes
  per attack, past every blocker and in all, on either side's turn. The old
  threat terms counted only on the bot's own turn, so when it chose blocks on
  yours it ignored the race (game MGFK: it threw fliers in front of bigger
  attackers instead of racing). The classic brain gives them weight 0.
- **Training** (`tools/train.mjs`, parallel workers):
  - `data`: self-play positions with who won.
  - `fit`: a logistic regression on them (the "Texel" method chess engines use); `ONLY=…` learns just some terms on top of the classic ones.
  - `match`: one brain against another on fresh duplicate deals.
  - `spsa`: tuning by matches (the way Stockfish tunes its numbers).
  - `ladder`: rates the levels by Elo.
- **What training found** (3,000 self-play duels, 425,000 positions):
  - The learned weights predict the winner better than the classic brain (held-out log loss 0.568 vs 0.579), but play worse: 44% against it over 800 games. Terms that predict winning (a big board, a strong attack) aren't always good to chase move by move, and cards in hand even came out nearly worthless.
  - Adding only the race terms on top of the classic brain was even, at 46–51%.
  - Tuning by matches (SPSA, about 10,000 games) scored 51.3% over 2,000 games (+9 Elo, within noise).
  - So the hand-set brain is near the best this kind of scoring allows, and every level uses it. Chess engines tune with about 20× more games; the tools are there for another round.
- **Look-ahead is the strength.** The Planner (`planAction`) plays each of its
  best moves on to its next turn, with what it can't see shuffled. Two ideas
  from card-game AI research (Forge's Monte Carlo layer, MCTS in Magic):
  - Every candidate move meets the same shuffled futures ("common random numbers"), so the moves are compared on shared luck.
  - It leaves its best-looking move only for a clear gain (`margin`).
  - Together these lifted it from about +40 to about +150 Elo over Practice. More planning (4 moves, 3 futures each) rated the same as 3 moves with 1 future.
- **Levels** (`ai.js LEVELS`, picked on the Play page and remembered on the
  phone; a game keeps its level when saved, resumed and played again, and
  the finished game's record keeps it). Rated with `tools/train.mjs
  ladder`, 30–40 deals per pair both ways. Each beats the one below about
  75–80% of the time:

  | Level | Elo | How it plays |
  |---|---|---|
  | Beginner | 1050 | any of its 4 best moves, at random (`top` 4) |
  | Casual | 1300 | its 4 best moves, with noise 30 |
  | Practice | 1500 | the bot everyone played before (noise 0.4) |
  | Expert | 1650 | the Planner: its 3 best moves, a future each |

  - Weak levels choose among their few best moves: random blunders feel bad (Maia; Stockfish's skill levels), and plain noise blundered at random.
  - On a phone Expert thinks within 500 ms: its best move and ending the turn always get a future, the rest while time is left. The app waits only the rest of its usual pause between moves. On a 4× slowed CPU, a turn's decision took 0.5 s (median) to 1.4 s (worst).
- Tests: `.phone-tests/ui-levels.mjs` (the picker, a game's level kept when saved and resumed).

## Reading cards, and moves that aren't attacks (2026-11-09)

After a game against the Rot and Bloom bot (shared game RWDN), Asaf said
setting a Trap warned it "wouldn't apply", a card on the table couldn't be
read (tapping it started an attack), the cards' text wanted explaining, the
opening hand should swipe, and Dig and the moves that aren't attacks
(abilities, Relics) weren't clear.

- **Traps:** setting one no longer asks "would do nothing now" (`slip`: a Trap
  only waits once set). Its button says **Set it face-down**; the Trap keyword
  says it stays set, turn after turn, until it springs; your own Traps are
  listed by name in your details (tap your bar); and ending a turn with Energy
  and a Trap you could set asks first, as a creature you could play does.
- **Cards, big, everywhere:** the big view (`openViewer(uid, kind)`,
  `viewerRow`) opens for your opening hand (`'mull'`) and for one side of the
  table (`'table'`) as well as your hand, and swipes along any of them. Tapping
  your ready creature opens it big with **Send it into the attack** (and its ⚡
  ability) instead of the attack screen; Attack (bottom right) and dragging
  still start an attack. `cardInfo()` is what a sheet and the big view share.
- **The card in plain words** (`cardGuide`), over a big card: its kind and
  cost, its Power and Vitality (`2/4 — 2 Power (the damage it deals) …`), each
  keyword, and the words in its text that carry a rule without being keywords
  (`TERMS`: +1/+0, for good and the growth ceiling, this turn, heal, Spirit,
  token, discard pile, back to its owner's hand, fight, any target, maximum
  Energy, ready).
- **Hold to read:** on the attack and block screens, where a tap picks a card,
  holding one (450 ms) opens it (`holdToRead`); lifting the finger picks nothing.
- **Moves that aren't attacks:** Dig's button says *draw a card* under its
  name; a Relic you can use now glows (`relicCan`: Bone Altar, a Ritual's next
  stage), like a ⚡ you can use; the ⚡ chip opens its creature big, with the
  ability's button; the help says so.
- Test: `.phone-tests/ui-cards.mjs` at 402×874.

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
- Empty deck: if your deck is empty when your turn starts, you lose 2 Life instead of drawing; any other draw from an empty deck does nothing (since 2026-11-10; until then, 2 Life for every card you couldn't draw). Board max 7 creatures; hand max 10.
- "The opposing player" became "each opponent" / "an opponent" so cards work in 3-player games.
- Little Gardener triggers once per turn (two of them would otherwise loop forever).
- Phoenix returns during your next turn (no start-of-turn prompt); Forbidden Archivist costs 1 Life instead of an optional Energy payment, so neither needs a decision on someone else's turn.
- Buff spells target your own creatures; Deepwater Leviathan's bounce is optional.
