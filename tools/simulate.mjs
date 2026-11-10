// Bot vs bot across the starter decks: a rough balance read.
//   node tools/simulate.mjs 40        40 games per pairing (each side goes first half the time)

import { newGame, apply, actor } from '../js/engine.js';
import { chooseAction } from '../js/ai.js';
import { RULES, STARTERS } from '../js/cards.js';
import { cardList } from '../js/decks.js';

const N = Number(process.argv[2] || 20);
const decks = STARTERS.map((d) => ({ name: d.name, list: cardList(d.counts) }));

function game(a, b, seed) {
  let s = newGame({ seed, players: [{ name: a.name, deck: a.list }, { name: b.name, deck: b.list }], startEnergy: RULES.startEnergy, deckClock: true });
  // RAMP=1: experiment where whoever goes second stays one Energy ahead
  if (process.env.RAMP) for (const P of s.players) if (P.i !== s.first) P.maxEnergy = Number(process.env.RAMP);
  if (process.env.NOSPARK) for (const P of s.players) P.hand = P.hand.filter((u) => s.cards[u].cid !== 'spark');
  let x = seed >>> 0;
  const rand = () => (x = (Math.imul(x, 1103515245) + 12345) >>> 0) / 4294967296;
  let steps = 0;
  while (s.phase !== 'over' && steps < 4000) {
    const p = s.phase === 'mulligan' ? s.players.findIndex((P) => !P.mull) : actor(s);
    const r = apply(s, chooseAction(s, p, { rand }));
    if (r.error) throw new Error(r.error);
    s = r.state;
    steps++;
  }
  return { winner: s.winner, turns: s.turn, first: s.first, ended: s.phase === 'over' };
}

const t0 = Date.now();
const wins = decks.map(() => decks.map(() => 0));
const played = decks.map(() => decks.map(() => 0));
let firstWins = 0, total = 0, turns = 0, stalls = 0;
for (let i = 0; i < decks.length; i++) for (let j = i + 1; j < decks.length; j++) {
  for (let g = 0; g < N; g++) {
    const r = game(decks[i], decks[j], 1000 + i * 100 + j * 10 + g * 7919);
    total++; turns += r.turns;
    if (!r.ended) { stalls++; continue; }
    if (r.winner === r.first) firstWins++;
    played[i][j]++; played[j][i]++;
    if (r.winner === 0) wins[i][j]++; else wins[j][i]++;
  }
}

const pad = (t, n) => String(t).padEnd(n);
console.log(`\n${total} games, ${((Date.now() - t0) / 1000).toFixed(0)}s, avg ${(turns / total).toFixed(1)} turns, first player won ${(100 * firstWins / (total - stalls)).toFixed(0)}%, ${stalls} unfinished\n`);
console.log(pad('row beats column', 24) + decks.map((d) => pad(d.name.slice(0, 12), 14)).join('') + 'overall');
decks.forEach((d, i) => {
  let w = 0, n = 0;
  const cells = decks.map((_, j) => {
    if (i === j) return pad('—', 14);
    w += wins[i][j]; n += played[i][j];
    return pad(played[i][j] ? `${Math.round(100 * wins[i][j] / played[i][j])}%` : '-', 14);
  });
  console.log(pad(d.name, 24) + cells.join('') + `${Math.round(100 * w / n)}%`);
});
