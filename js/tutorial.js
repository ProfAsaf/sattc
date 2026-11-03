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

const YOU = [
  'cinderling', 'spark-runner', 'rally', 'standard-keeper', 'dawn-captain', // opening hand
  'ash-collector', 'reckless-initiate', 'twin-souls', 'stand-together', 'street-recruit',
  'shieldbearer', 'cinderling', 'spark-runner', 'rally', 'standard-keeper',
  'dawn-captain', 'a-thousand-lights', 'ash-collector', 'reckless-initiate', 'twin-souls',
  'street-recruit', 'shieldbearer', 'stand-together', 'phoenix-of-the-last-spark', 'phoenix-of-the-last-spark',
  'a-thousand-lights', 'the-mountain-is-angry', 'the-mountain-is-angry',
];

const BOT = [
  'street-recruit', 'shieldbearer', 'mossback', 'grave-rat', 'seedling', // opening hand
  'kindly-undertaker', 'little-gardener', 'patient-giant', 'curious-wisp', 'mossback',
  'grave-rat', 'seedling', 'street-recruit', 'kindly-undertaker', 'little-gardener',
  'bonepicker', 'patient-giant', 'curious-wisp', 'shieldbearer', 'bonepicker',
  'mirror-mage', 'mirror-mage', 'wild-growth', 'wild-growth', 'rally', 'rally',
];

const me = (cid) => `.g-side.me .tok[data-cid="${cid}"]`;
const bot = (cid) => `.g-side.opp .tok[data-cid="${cid}"]`;
const hand = (cid) => `.hc[data-cid="${cid}"]`;
const BOT_LIFE = '.pbar[data-p="1"] .pb-life';

export const TUTORIAL = {
  setup: { seed: 11, stacked: true, first: 0, players: [{ name: 'You', deck: YOU }, { name: 'Bot', deck: BOT }] },
  steps: [
    { next: true, show: ['.pbar .pb-life'],
      say: 'Welcome! You are at the bottom, the bot is at the top. You both start with 20 Life ❤. Get the bot down to 0 and you win.' },
    { next: true, show: ['.g-hand'],
      say: 'These are your cards: your hand. The number in the dark hexagon is what a card costs to play, in Energy.' },
    { next: true, show: ['.pbar[data-p="0"] .pb-energy'],
      say: 'This is your Energy. You get 1 on your first turn, 2 on your second, and so on up to 8. It refills every turn, so spend it!' },
    { expect: { t: 'play', cid: 'cinderling' }, show: [hand('cinderling')],
      say: 'Let\'s play a creature. Tap Cinderling, then tap Play.',
      sheet: 'Cinderling costs 1 and you have 1 Energy. Tap Play.' },
    { next: true, show: [me('cinderling')],
      say: 'Cinderling is on the table now. Creatures stay until they die. The left number is its Power (the damage it deals). The right number is its Vitality (the damage it can take).' },
    { next: true, show: [me('cinderling')],
      say: 'A new creature needs a turn to get ready, so it can\'t attack yet. You\'re also out of Energy, so you\'re done for this turn.' },
    { expect: { t: 'end' }, show: ['.end-btn'], say: 'Tap End turn.' },

    { bot: [{ t: 'play', cid: 'street-recruit' }, { t: 'end' }], say: 'The bot is taking its turn…' },
    { next: true, show: [bot('street-recruit'), '.pbar[data-p="0"] .pb-energy'],
      say: 'The bot played Street Recruit: 1 Power, 2 Vitality. Now it\'s your turn again. You drew a card and you have 2 Energy.' },
    { next: true, show: [me('cinderling')],
      say: 'Cinderling is glowing: it\'s ready to attack. You choose what to hit: the bot itself, or one of its creatures. When two creatures fight, both deal their Power to each other at the same time.' },
    { expect: { t: 'attack', cid: 'cinderling', target: { cid: 'street-recruit' } }, show: [me('cinderling'), bot('street-recruit')],
      say: 'Tap Cinderling, then tap the bot\'s Street Recruit.' },
    { next: true, show: [BOT_LIFE],
      say: 'Both died: Cinderling dealt 2 (all the Recruit could take) and took 1. But Cinderling has Last Breath: when it dies, it deals 1 damage to each opponent. The bot is down to 19.' },
    { expect: { t: 'play', cid: 'spark-runner' }, show: [hand('spark-runner')],
      say: 'Now play Spark Runner. It costs 2: all your Energy.',
      sheet: 'Spark Runner has Rush: it can attack the turn it arrives. Tap Play.' },
    { expect: { t: 'attack', cid: 'spark-runner', target: { p: 1 } }, show: [me('spark-runner'), '.pbar[data-p="1"]'],
      say: 'Spark Runner has Rush, so it can attack right away. Tap it, then tap the bot\'s name bar at the top to hit the bot directly.' },
    { next: true, show: [BOT_LIFE],
      say: '3 damage! The bot is at 16. Tip: you can tap any card, yours or the bot\'s, to read what it does.' },
    { expect: { t: 'end' }, show: ['.end-btn'], say: 'That\'s all for this turn. Tap End turn.' },

    { bot: [{ t: 'play', cid: 'shieldbearer' }, { t: 'end' }], say: 'The bot is taking its turn…' },
    { next: true, show: [bot('shieldbearer')],
      say: 'The bot played Shieldbearer. The shield badge means Guard: while it\'s there, you must attack it before you can hit the bot or its other creatures.' },
    { next: true, show: [me('spark-runner'), bot('shieldbearer')],
      say: 'Shieldbearer can take 4 damage. Spark Runner only deals 3… unless you make it stronger.' },
    { expect: { t: 'play', cid: 'rally' }, show: [hand('rally')],
      say: 'Rally is a Spell. A Spell happens once, then goes to your discard pile. Rally gives your creatures +1 Power this turn. Play Rally.',
      sheet: 'Rally costs 2. You have 3 Energy this turn. Tap Play.' },
    { expect: { t: 'attack', cid: 'spark-runner', target: { cid: 'shieldbearer' } }, show: [me('spark-runner'), bot('shieldbearer')],
      say: 'Spark Runner has 4 Power now. Attack Shieldbearer!' },
    { next: true, show: ['.g-side.opp .g-row'],
      say: 'Shieldbearer is gone. Spark Runner went too: Shieldbearer hit back for 1, and the Runner could only take 1. Creatures that survive heal at the end of every turn.' },
    { expect: { t: 'end' }, show: ['.end-btn'], say: 'End your turn.' },

    { bot: [{ t: 'play', cid: 'mossback' }, { t: 'end' }], say: 'The bot is taking its turn…' },
    { next: true, final: true,
      say: 'You know the basics! From now on the bot plays for real. Play creatures, attack when it\'s a good trade, and bring the bot to 0. The line under this box always says what you can do, and the ? button explains the screen. Good luck!' },
  ],
};

// Does action `a` (in position `s`) do what the step asks?
export function matches(s, a, want) {
  if (a.t !== want.t) return false;
  if (want.cid && s.cards[a.uid]?.cid !== want.cid) return false;
  if (!want.target) return true;
  if (want.target.p != null) return a.target?.p === want.target.p;
  return a.target?.uid != null && s.cards[a.target.uid]?.cid === want.target.cid;
}

// Turn a scripted bot move into a real action in the current position.
export function botAction(s, p, m) {
  if (m.t === 'end') return { t: 'end', p };
  const uid = s.players[p].hand.find((u) => s.cards[u].cid === m.cid);
  return { t: 'play', p, uid };
}
