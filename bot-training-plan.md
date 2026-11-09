# Training the bots, difficulty levels and ratings (plan, 2026-11-09)

Asaf: "I would love to have you have a method to train the bots. Would make it
easier to choose the difficulty level of the bot for people playing.
Eventually even something like Elo for bots and people against bots (and
other people)."

## Where things stand

- The app has one bot: `chooseAction(s, p, { noise: 0.4 })` in `js/ai.js`.
  It scores positions with about 30 hand-set numbers in `evaluate()` (Life,
  board, cards in hand, Traps, Invest, threats, keyword values, Relic values…).
- `tools/elo.mjs` rates bots against each other (Bradley–Terry, duplicate
  deals). The ladder: Random 634, Shaky 40 1177, Shaky 20 1324, Practice 1500,
  Careful 1486, Expert 1510, Planner about 1540, Deep Planner 1610.
- Everything above the practice bot sits within about 100 points of it, so
  there is no real "hard" bot to offer yet.
- A known weakness, from game MGFK: the bot blocks when racing would win (it
  threw its fliers in front of bigger attackers instead of racing).

## Phase 1: a trainable bot brain

1. Gather the evaluation's hand-set numbers into one weights table that a
   bot can load (the current numbers stay the default, so nothing changes
   until a trained table wins).
2. Add race features: how many turns each side needs to knock the other out
   with what can't be blocked, and with everything. That's the "count the
   race" decision the bot gets wrong today.
3. Train in two steps:
   - **Learn from self-play.** Bots play a few thousand games. Every position
     is saved with who won in the end, and a logistic regression fits the
     weights that best predict the winner. The bot then plays toward its best
     predicted chance. Repeat two or three rounds with the new bot. Every
     position is a data point, so this needs few games. It also gives a
     calibrated "chance to win" for the game review's graph.
   - **Fine-tune by matches** (SPSA, the way chess engines tune their numbers):
     nudge all weights at once, play the two versions against each other, step
     toward the winner.
4. Keep a trained bot only if it beats the current one in a fresh Elo run, on
   deals it never trained on. Then rerun the duel balance table, since a
   stronger bot can shift deck win rates.

Compute: games run about 0.4 s each and this PC has 14 cores, so 2,000 games
take about 1.5 minutes on 10 workers. The whole phase is about an hour of
background runs, not more.

## Phase 2: difficulty levels by Elo

- About five named levels on one scale, each calibrated with `tools/elo.mjs`:
  Beginner (~1100), Casual (~1300), Practice (~1500, today's bot), Tough
  (~1700), Expert (as high as training gets). (Built as four: see below.)
- Weaker levels make more mistakes (noise). Stronger ones use the trained
  brain and look ahead (the Planner). Keep each level's thinking time under
  about a second on a phone.
- A picker on the Play page (and for draft nights against bots) shows each
  level's rating and remembers your choice.

## Phase 3: your rating against bots

- Each practice game updates your Elo from the bot's rating: bigger steps for
  your first 20 games, then smaller.
- Stored on the phone and shown in Insights with a graph over time.
- Option: allow for deck matchups (The Wall vs Sky and Arrows is about 40/60
  between equal bots), so a bad matchup costs less.
- People's results also check the bots: if people beat Tough far more often
  than its rating says, its rating moves.

## Phase 4: ratings between people

- Online games update both players' ratings, kept in Firebase next to the
  rooms, with a friends' ladder.
- A three-player game counts as pairwise results: the winner beats both, and
  the first one out loses to the other.
- Needs a stable player id on each phone (names can change), and everyone in
  the group sees the ladder. Settle both before building.

## What happened (phases 1 and 2, 2026-11-09)

- **Brains:** built. The classic numbers live in `js/brains.js`, and the bot
  plays move for move as before. New race terms count on both turns. The
  tools live in `tools/train.mjs` (`data`, `fit`, `match`, `spsa`, `ladder`).
- **Learning from self-play** (3,000 duels, 425,000 positions):
  - The learned weights predict the winner better (log loss 0.568 vs 0.579), but play worse: 44% against the classic brain.
  - Adding only the race terms on top of the classic brain: 46–51%, even.
  - The research agrees this is the known trap: terms that predict winning aren't always good to chase. Chess engines also used about 20× more games.
- **Tuning by matches** (SPSA, 400 steps, about 10,000 games): it moved the weights a little and scored 51.3% over 2,000 games (+9 Elo, within noise).
- **Conclusion:** the hand-set brain is already near the best this kind of
  scoring allows. Strength comes from look-ahead (the Planner), so the
  levels use it.
- **Planner improvements from the research:** every candidate move is
  scored on the same shuffled futures ("common random numbers"), and the bot
  leaves its best-looking move only for a clear gain. On phones it thinks
  within a time budget.
- **Weak levels:** they choose among their 4 best moves (`top`), with noise,
  never any move at all. Random blunders feel bad (the research: Maia,
  Stockfish).
- **The levels as built:**
  - Beginner 1050, Casual 1300, Practice 1500, Expert 1650. Each beats the one below about 75–80%.
  - The Planner went from about +40 to about +150 over Practice with the shared futures and the margin.
  - Every Planner setting tried rated 1630–1680 (2 to 4 moves, 1 to 3 futures each), so there are four levels, not five. Expert uses the cheapest setting (3 moves, 1 future each, 500 ms on a phone).
- **Next for strength,** if wanted (from the research):
  - An exact "can I win this turn" check.
  - The opponent's best reply in the look-ahead.
  - More shuffled futures per move, with a little noise in the played-out moves.
  - A Texel fit at 20× the data, labeled by the Planner rather than the greedy bot.

## Research notes for phases 3 and 4

- Use Glicko-2 (rating deviation + volatility) rather than plain Elo for a
  small group: start at 1500 with deviation 350, and show "?" until the
  deviation drops below 110 (Lichess's rule).
- The bot levels are fixed anchors at their measured ratings. Count games
  against bots at half weight, as Lichess does for bot accounts.
- Score three-player games as pairwise results (or use TrueSkill).
- After a few hundred games by people, refit everything together.
- Show a level name or tier, with the number secondary.

## Order

Phases 1 and 2 first: training is what makes the levels worth choosing.
Phase 3 is small once levels have ratings. Phase 4 waits for a decision on
sharing.
