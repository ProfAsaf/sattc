# SATTC Ultra — plan for version 1 (revised)

Ultra is the switch on Home. Everything here applies only to Ultra games; the standard game stays as it is.

## What it's for

From the user's notes, 2026-11-07:

1. **Strategies emerge on their own.** They come from your deck, from what you draw early, and from what your opponents do. There are no tracks or levels.
2. **Many cards are weak alone.** They become strong with each other, or later in the game.
3. **Constant trade-offs between ways to grow:**
   - Energy for good, or a creature that grows?
   - Creatures that copy themselves, or spells in parts?
   - Bringing back the dead, or drawing more cards?
4. **Lots of different powers, as in Worm, but no rock-paper-scissors.**
   - Answers slow a build down; they never wipe it out for free.
   - Whatever an opponent does to your build either wears off or can be undone at a cost.
   - Building something always keeps some value.
5. **Party building, as in an RPG.** Creatures protect, heal and strengthen each other, so there's always another combination to find. Two examples:
   - Defenders that make each other stronger and grow fast.
   - A flier covered by an archer.

## What the bot games say now

From 500 bot games with today's rules:

- **Games are short:** about 7 rounds.
- **Creatures die fast:** a quarter to a third are gone before their owner's next turn. About half are gone within one more turn. Only 15% ever grow.

## Ultra rules

1. **30 Life** instead of 20. I'll tune it so games last 10 to 12 rounds.
2. **Energy grows by 1 a turn up to 6.** Cards with **Invest** raise your max Energy by 1 for good, up to 12.
3. **Wounds:**
   - Damage stays on creatures.
   - At the start of your turn, each of your creatures heals half its damage, rounded up.
   - Healers heal faster. A Field can stop healing. Venom wounds don't heal.
4. **Sheltered:** a new creature can't be targeted by opponents' Spells or abilities, or forced to block, until its owner's next turn.
5. **Legacy:** when a creature that has grown dies, half its growth (rounded up) passes to your weakest creature.
6. **Hexes instead of permanent answers.** Ultra's answers shrink or bind a creature only until its owner pays to break the Hex.
7. **The Field:** one Field card is in play at a time, shared by everyone. A new Field replaces the old one.
8. **Changes to the base cards in Ultra:**
   - **Venom poisons:** its wounds don't heal, instead of killing outright.
   - **A creature sent back to its owner's hand keeps its growth.**
   - **Four base cards that destroy or steal for good stay out of Ultra decks:** Death Is a Door, The Culling, Dawn's Judgment and Nerissa.

## New words on cards

- **Invest:** +1 max Energy for good, up to 12.
- **Grows N:** at the start of your turn, it gets +N/+N for good.
- **Multiply:** at the start of your turn, it makes a token copy of itself, while you have room on the table. The copies multiply too.
- **Unstable:**
  - It grows 2 a turn.
  - At 10 Power it erupts: 3 damage to every other creature and every player, you too.
  - Then it shrinks back to its printed size and starts again.
- **Fuse:** pay 1 on your turn: this creature joins another of yours. That creature keeps its Power, Vitality and keywords for good.
- **Ritual:** a Spell that stays in front of you in stages.
  - Pay one stage a turn to get its effect; the last stage is the big one.
  - You can have one Ritual at a time.
- **Hex N:** the effect lasts until the creature's owner pays N Energy on their turn.
- **Field:** see the rules.

## Version 1: the rules plus 31 cards

More cards come once you've played this.

### Ember

- **Kindling Heart** (3, creature 0/1): Unstable.
- **Bloodrage Berserker** (2, creature 2/3): +1/+0 for each damage on it.
- **Stoke the Furnace** (5, Spell): Invest. Deal 1 damage to each opponent.
- **Ember Volley** (2, Spell): 1 damage to each of up to three creatures.
- **Molten Core** (2, creature 2/1): Swift. Fuse.
- **Scorched Earth** (3, Field): creatures don't heal.

### Verdant

- **Sproutling** (1, creature 0/1): Grows 1.
- **Mycelium Bud** (2, creature 1/1): Multiply.
- **Rootmother** (4, creature 2/5): whenever a creature of yours heals, it also gets +1/+1 for good.
- **Thornback Archer** (3, creature 2/3): Reach. Whenever one of your creatures with Soar fights, the Archer first deals 2 damage to the creature it's fighting.
- **Deep Roots** (4, Spell): Invest. Your weakest creature gets +1/+1 for good.
- **Bark Graft** (2, creature 1/3): Reach. Fuse.
- **Overgrowth** (4, Field): every permanent boost gives +1/+1 more.

### Tide

- **Tidecaller's Library** (4, Relic): draw an extra card at the start of your turn. Your hand holds 12.
- **Flood Rite** (Ritual; stages cost 2, 3, 5):
  - I: draw 2.
  - II: return a creature to its owner's hand.
  - III: take an extra turn.
- **Tide of Fortune** (5, Spell): Invest. Draw 2.
- **Wavewarden** (3, creature 1/5): Bodyguard. Opponents' Spells and abilities aimed at your other creatures hit Wavewarden instead.
- **Wing Graft** (2, creature 1/1): Soar. Fuse.

### Umbral

- **Blood Pact** (3, Spell): Invest. Lose 3 Life.
- **Bloodbinder** (3, creature 2/3): Drain. Your creatures with Drain heal themselves for the damage they deal.
- **Gravewarden** (4, creature 2/4): whenever another creature of yours dies, your creatures heal 2 and get +1/+0 for good.
- **Grave Rite** (Ritual; stages cost 2, 3, 4):
  - I: return a creature card from your discard pile to your hand.
  - II: each opponent loses 2 Life and you gain 2.
  - III: two creatures from your discard pile come back into play.
- **Shackles** (3, Spell): Hex 4. A creature can't attack or block.
- **Venom Shard** (1, creature 1/1): Venom. Fuse.

### Radiant

- **Shield Captain** (3, creature 1/4): Guard. Your other Guard creatures get +0/+2. Whenever a Guard creature of yours blocks, it gets +0/+1 for good.
- **Bastion Wall** (3, creature 0/6): Guard. Whenever it blocks, the attacking player loses 2 Life.
- **Field Medic** (2, creature 1/2): at the start of your turn, your creatures heal 2 more.
- **Lantern Moth** (2, creature 1/1): Soar. Multiply.
- **Mender's Hymn** (1, Trick): heal a creature fully. It gets +0/+2 until the end of the turn.
- **Tithe of Light** (4, Spell): Invest. Gain 3 Life.
- **Sanctuary Spring** (3, Field): creatures heal fully at the start of their owner's turn.

## Parties that could come out of it

Each of these mixes Ultra cards with base cards.

- **The wall:**
  - Pieces: Shield Captain, Bastion Wall, Shieldbearer, Field Medic, Rootmother.
  - Each block makes the Guards bigger. Wounds heal fast, and every heal makes them grow again.
  - What slows it: Scorched Earth stops the healing. Fliers go over it.
- **Fliers with cover:**
  - Pieces: Lantern Moth or the base set's fliers, covered by Thornback Archer and Canopy Archer.
  - Whatever blocks or attacks your fliers takes 2 damage first.
- **Getting hurt on purpose:**
  - Pieces: Bloodrage Berserker with Bloodbinder and Vesper Bat or the Pale Abbess.
  - It hits harder while wounded, heals itself by draining, and with Rootmother grows each time it heals.
- **A swarm that feeds itself:**
  - Pieces: Mycelium Bud copies with Gravewarden.
  - Every copy that dies makes the rest stronger and heals them.
  - Ember Volley wears the swarm down, but doesn't wipe it out.
- **One giant:**
  - Pieces: fuse Molten Core, Wing Graft, Bark Graft and Venom Shard into one creature. It's Swift and has Soar, Reach and Venom.
  - What slows it: Shackles (until you pay 4), blockers thrown in front of it, and poison.
- **Economy first:**
  - Pieces: Blood Pact or Deep Roots early, then Tidecaller's Library, then Flood Rite's extra turn.
  - What beats it: pressure while it's still building.

## Status (2026-11-07)

Version 1 is built: the rules, the 31 cards, five Ultra starter decks, bots that use everything, the table display, rooms and the card pages.

Changes from the plan:
- Three-player games start at 25 Life; at 30 they ran about 13 rounds.
- Two starters were retuned after bot games.

Bot games:

| | standard | Ultra |
|---|---|---|
| Rounds, duels | about 7.5 | about 10 |
| Rounds, three players | about 8 | about 12 |
| Creatures that ever grow | 15% | 42% |

- Starter decks win 42–56% in duels and 31–35% with three players (33% is even), after the 2026-11-08 retune (README, "SATTC Ultra"). Before it, three-player games ran 22–46%.
- Weakest now: Endless Swarm in duels (about 42%).

Added 2026-11-08:
- An Unstable creature shows how close it is to erupting (💥8/10), and pulses red the turn before.
- Tapping a creature shows what's helping it ("Helping it": Shield Captain, archer cover, Field Medic, Rootmother, Bloodbinder, Gravewarden, a Bodyguard, the Field…).
- The first Ultra game on a phone opens with "What's different" before the opening hand.

Not done yet:
- (Done since: draft night and "Draft my deck" deal from the Ultra pool, stats and Insights know Ultra games, and suggestions word the Ultra moves.)
- People haven't played it.

## Building it

1. **Engine:** the Ultra rules and the 31 cards, all behind `s.ultra`, with engine tests for each.
2. **Decks:**
   - An Ultra card pool: the base set minus those four cards, plus the Ultra cards.
   - Five Ultra starter decks, each able to go two or three ways.
   - Deck checks for Ultra rooms, and "Draft my deck" in Ultra.
3. **Bots:** taught to value Energy, wounds, healing, growth, Rituals, Fuse, Hexes and Fields.
4. **Table:**
   - The Field as a banner.
   - Ritual stage dots.
   - A shield on Sheltered creatures.
   - Lasting wounds.
   - Buttons to break a Hex and to Fuse.
   - Tapping a creature shows what's helping it, e.g. "Shield Captain: +0/+2".
5. **Art:** drawn in code, like the rest.
6. **Tuning with bot games.** Targets:
   - games of 10 to 12 rounds;
   - more creatures that live and grow;
   - each starter deck winning 45–55%;
   - each party able to win.
7. **Tests:** phone tests at iPhone size. Then publish once no friends' game is in progress.

Later, after you've played it:

- More cards: Elder Root, World-Tree Seed, Forgefire Rite, Dawn Rite, Sky Banner, Hallowed Ground and Mimic.
- Draft night online with the Ultra pool.
- Identical tokens shown as one stacked card.
