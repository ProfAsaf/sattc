// The bots' brains: the weights a bot scores a position with (ai.js evaluate,
// one weight per term of features()). CLASSIC is the hand-set brain every bot
// used until 2026-11-09; tools/train.mjs learns others from self-play and a
// learned brain is kept only if it beats the one before it.
//
// Terms (each from the bot's side; "their" ones are the opponents' average):
//   life, theirLife       Life, through a curve (each point counts for more when Life is low)
//   board, theirBoard     creatures: Power, Vitality, keywords, engines (creatureValue)
//   relics, theirRelics   Relics and Rituals in progress
//   hand, theirHand       cards in hand
//   traps, theirTraps     face-down Traps
//   deck                  cards left in the deck (up to 6)
//   invest, theirInvest   permanent Energy from Invest
//   inc, inc3             on its own turn: what their creatures could push past its ready blockers (duel, three players)
//   out                   on its own turn: what its creatures could push past theirs
//   race, theirRace       either turn: the share of the other's Life that gets past every blocker each attack ("the race")
//   swing, theirSwing     either turn: all of a side's Power, as a share of the other's Life
//   fixed                 the rest: extra turns, the Crown, Choking Smoke, a Granary's saving, the Field
export const CLASSIC = {
  life: 1, theirLife: 1, board: 1, theirBoard: 1.05, relics: 1, theirRelics: 1, hand: 1.6, theirHand: 1.2,
  traps: 2.2, theirTraps: 2, deck: 0.3, invest: 1, theirInvest: 1, inc: 0.7, inc3: 0.45, out: 0.25,
  race: 0, theirRace: 0, swing: 0, theirSwing: 0, fixed: 1,
};

export const BRAINS = { classic: CLASSIC };
