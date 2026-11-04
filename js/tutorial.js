// The guided first game. Both decks are stacked, you go first, and the bot's
// first three turns are scripted, so every lesson lands on cue. After that
// the bot plays for real (gently) and you finish the game yourself.
//
// Step kinds:
//   { say, show, next: true }          explain, wait for "Next"
//   { say, show, expect, sheet? }      wait until you do exactly this
//   { bot: [moves], say }              the bot plays these moves, slowly
// `show` lists CSS selectors to ring with a glow; `sheet` is extra advice
// shown on the card's big view when you tap the card you're meant to play.
// tools/check-tutorial.mjs plays the whole script against the engine.

const YOU = [
  'cinderling', 'spark-runner', 'kindle', 'lightweaver', 'dawnwatch-knight', // opening hand
  'street-recruit', 'shieldbearer', 'ember-duelist', 'twin-souls', 'rally',
  'standard-keeper', 'scorch', 'dawn-captain', 'phoenix-of-the-last-spark', 'stand-together',
  'bastion', 'molten-berserker', 'banner-of-the-charge', 'choirmother', 'reckless-initiate',
  'feed-the-flame', 'ash-collector', 'wildfire', 'seraphine', 'ashmaw',
  'beacon-of-hope', 'dawns-judgment', 'a-thousand-lights', 'the-kiln', 'smoldering-golem',
];

const BOT = [
  'street-recruit', 'shieldbearer', 'spark-runner', 'mossback', 'seedling', // opening hand
  'grave-rat', 'little-gardener', 'kindly-undertaker', 'canopy-archer', 'patient-giant',
  'marsh-adder', 'curious-wisp', 'wild-growth', 'hungry-ghoul', 'bonepicker',
  'worldtree-stag', 'sudden-growth', 'gloomweb-spider', 'grove-druid', 'carrion-wyrm',
  'vesper-bat', 'savage-clash', 'ironhide-charger', 'unearth', 'brook-hydra',
  'the-culling', 'heartwood-totem', 'death-is-a-door', 'something-beneath', 'the-forest-remembers',
];

// Creatures are found wherever they are: in their row or in the battle zone.
const me = (cid) => `.tcard.on-board:not(.foe)[data-cid="${cid}"]`;
const bot = (cid) => `.tcard.on-board.foe[data-cid="${cid}"]`;
const hand = (cid) => `.g-hand .tcard[data-cid="${cid}"]`;
const BOT_LIFE = '.pbar[data-p="1"] .pb-life';
const MY_LIFE = '.pbar[data-p="0"] .pb-life';

export const TUTORIAL = {
  setup: { seed: 11, stacked: true, first: 0, players: [{ name: 'You', deck: YOU }, { name: 'Bot', deck: BOT }] },
  steps: [
    { next: true, show: ['.pbar .pb-life'],
      say: 'Welcome! You are at the bottom, the bot is at the top. You both start with 20 Life ❤. Get the bot down to 0 and you win.' },
    { next: true, show: ['.g-hand'],
      say: 'These are your cards: your hand. The number in the dark hexagon is what a card costs to play, in Energy.' },
    { next: true, show: ['.pbar[data-p="0"] .pb-energy'],
      say: 'This is your Energy. You get 1 on your first turn, 2 on your second, and so on up to 8. It refills every turn.' },
    { expect: { t: 'play', cid: 'cinderling' }, show: [hand('cinderling')],
      say: 'Let’s play a creature. Drag Cinderling up onto the table (or tap it, then tap Play).',
      sheet: 'Cinderling costs 1 and you have 1 Energy. Tap Play.' },
    { next: true, show: [me('cinderling')],
      say: 'Cinderling is on the table. The left number is its Power (the damage it deals), the right one its Vitality (the damage it can take). A new creature needs a turn before it can attack.' },
    { expect: { t: 'end' }, show: ['.end-btn'], say: 'You’re out of Energy. Tap End turn.' },

    { bot: [{ t: 'play', cid: 'street-recruit' }, { t: 'end' }], say: 'The bot is taking its turn…' },
    { next: true, show: [bot('street-recruit'), '.pbar[data-p="0"] .pb-energy'],
      say: 'The bot played Street Recruit (1 Power, 2 Vitality). Your turn again: you drew a card and have 2 Energy.' },
    { expect: { t: 'play', cid: 'spark-runner' }, show: [hand('spark-runner')],
      say: 'Play Spark Runner. It has Rush: it can attack the turn it arrives.',
      sheet: 'Spark Runner costs 2: all your Energy. Tap Play.' },
    { expect: { t: 'attack', att: ['cinderling', 'spark-runner'], target: 1 }, show: [me('cinderling'), me('spark-runner'), '.atk-btn'],
      say: 'Time to attack! Tap Cinderling and Spark Runner: they step into the middle of the table. Then tap Attack! (bottom right). The bot decides which of its creatures block.' },
    { bot: [{ t: 'block', blocks: [['street-recruit', 'cinderling']] }], say: 'The bot decides how to block…' },
    { next: true, show: [BOT_LIFE],
      say: 'The bot blocked Cinderling with Street Recruit. Blocked creatures hit each other: both died. Cinderling’s Last Breath burned the bot for 1, and unblocked Spark Runner hit for 3. The bot is at 16.' },
    { next: true, show: [me('spark-runner')],
      say: 'See Spark Runner leaning over? Attacking exhausts a creature: it can’t block until your next turn. Every attack is a choice: hit now, or stay home to defend.' },
    { expect: { t: 'end' }, show: ['.end-btn'], say: 'Tap End turn.' },

    { bot: [{ t: 'play', cid: 'shieldbearer' }, { t: 'end' }], say: 'The bot is taking its turn…' },
    { next: true, show: [bot('shieldbearer')],
      say: 'The bot played Shieldbearer: 1 Power, 4 Vitality and Guard (it can block two attackers). If Spark Runner attacks, Shieldbearer will block it and survive…' },
    { next: true, show: [hand('kindle')],
      say: '…unless you have a Trick. Tricks are Spells you can play in the middle of a fight. Kindle gives a creature +2 Power and Swift: it strikes first.' },
    { expect: { t: 'attack', att: ['spark-runner'], target: 1 }, show: [me('spark-runner'), '.atk-btn'],
      say: 'Attack with Spark Runner: tap it, then tap Attack.' },
    { bot: [{ t: 'block', blocks: [['shieldbearer', 'spark-runner']] }], say: 'The bot decides how to block…' },
    { expect: { t: 'play', cid: 'kindle', target: { cid: 'spark-runner' } }, show: [hand('kindle'), me('spark-runner')],
      say: 'Shieldbearer blocked, just as planned. Now play Kindle on Spark Runner: tap Kindle, Play, then tap Spark Runner.',
      sheet: 'Kindle costs 1. Tap Play, then tap your Spark Runner.' },
    { next: true, show: [me('spark-runner')],
      say: 'Spark Runner struck first with 5 Power. Shieldbearer is gone, and your Runner took no damage. That’s a Trick!' },
    { expect: { t: 'play', cid: 'lightweaver' }, show: [hand('lightweaver')],
      say: 'You have 2 Energy left. Play Lightweaver: she brings a 1/1 Spirit with her.',
      sheet: 'Lightweaver costs 2. Tap Play.' },
    { expect: { t: 'end' }, show: ['.end-btn'], say: 'Tap End turn.' },

    { bot: [{ t: 'play', cid: 'spark-runner' }, { t: 'attack', att: ['spark-runner'], target: 0 }], say: 'The bot is taking its turn…' },
    { expect: { t: 'block', blocks: [['spirit', 'spark-runner']] }, show: [me('spirit'), bot('spark-runner'), '.blk-btn'],
      say: 'The bot attacks you with its own Spark Runner (3 Power, 1 Vitality)! Yours is exhausted, so it can’t help. Block with your Spirit: tap it and it steps in front of the attacker. Then tap Done.' },
    { next: true, show: [MY_LIFE],
      say: 'Your Spirit and its Runner traded, and you took no damage. That’s blocking. Unblocked attackers hit you; blocked ones fight your creature instead.' },
    { bot: [{ t: 'end' }], say: 'The bot ends its turn…' },
    { next: true, final: true,
      say: 'You know the basics! From now on the bot plays for real. Attack when the trade is good, keep blockers home when you need them, and save Energy for Tricks. The line under this box always says what you can do, and ? explains the screen. Good luck!' },
  ],
};

const cidOf = (s, u) => s.cards[u]?.cid;
const sameSet = (xs, ys) => xs.length === ys.length && [...xs].sort().join() === [...ys].sort().join();

// Does action `a` (in position `s`) do what the step asks?
export function matches(s, a, want) {
  if (a.t !== want.t) return false;
  if (want.cid && cidOf(s, a.uid) !== want.cid) return false;
  if (want.t === 'attack') return a.target === want.target && sameSet((a.att || []).map((u) => cidOf(s, u)), want.att);
  if (want.t === 'block') return sameSet((a.blocks || []).map(([b, at]) => `${cidOf(s, b)}>${cidOf(s, at)}`), want.blocks.map(([b, at]) => `${b}>${at}`));
  if (!want.target) return true;
  if (want.target.p != null) return a.target?.p === want.target.p;
  return a.target?.uid != null && cidOf(s, a.target.uid) === want.target.cid;
}

// Turn a scripted bot move into a real action in the current position.
export function botAction(s, p, m) {
  const P = s.players[p];
  const onBoard = (cid, pi) => s.players[pi].board.find((u) => s.cards[u].cid === cid);
  switch (m.t) {
    case 'end': return { t: 'end', p };
    case 'play': return { t: 'play', p, uid: P.hand.find((u) => s.cards[u].cid === m.cid) };
    case 'attack': return { t: 'attack', p, target: m.target, att: m.att.map((cid) => onBoard(cid, p)) };
    case 'block': return { t: 'block', p, blocks: m.blocks.map(([b, at]) => [onBoard(b, p), s.combat.att.find((u) => s.cards[u].cid === at)]) };
  }
  return null;
}

// The move a step asks for, as a real action (for tools/check-tutorial.mjs).
export function expectedAction(s, p, want) {
  const onBoard = (cid, pi) => s.players[pi].board.find((u) => s.cards[u].cid === cid);
  const P = s.players[p];
  switch (want.t) {
    case 'end': return { t: 'end', p };
    case 'play': {
      const a = { t: 'play', p, uid: P.hand.find((u) => s.cards[u].cid === want.cid) };
      if (want.target?.cid) a.target = { uid: onBoard(want.target.cid, p) ?? s.players.flatMap((Q) => Q.board).find((u) => s.cards[u].cid === want.target.cid) };
      return a;
    }
    case 'attack': return { t: 'attack', p, target: want.target, att: want.att.map((cid) => onBoard(cid, p)) };
    case 'block': return { t: 'block', p, blocks: want.blocks.map(([b, at]) => [onBoard(b, p), s.combat.att.find((u) => s.cards[u].cid === at)]) };
  }
  return null;
}
