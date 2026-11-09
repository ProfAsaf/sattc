// The Elo ladder (2026-11-08): how much does skill decide a SATTC Ultra game?
// Bots of different strength play Ultra duels with the Ultra starter decks,
// and a Bradley–Terry fit (the model behind Elo ratings) turns the results
// into ratings, with the practice bot at 1500. A 100-point gap means the
// stronger bot wins 64%, 200 points 76%, 400 points 91%.
//
// The bots, weakest first:
//   Random    a random legal move, every time (a floor)
//   Shaky 40  the practice bot, but 40% of its moves are random
//   Shaky 20  the same, 20% (the "shaky hand" of .phone-tests/skill.mjs)
//   Practice  the bot people play against (ai.js chooseAction, noise 0.4)
//   Careful   the same bot with no noise
//   Expert    Careful, plus a second look at its best 4 moves: each scored by
//             the best move it leads to this turn (ai.js `beam`)
//   Planner   for its best 3 moves and ending the turn, plays on to its next
//             turn (the careful bot moving for everyone, with what it can't
//             see shuffled) and keeps the move that ends best (ai.js
//             planAction). About 4 times slower.
//   Deep Planner  the same with its best 4 moves, each played on 3 times
//             (about 15 times slower). The planners only play when BOTS names them.
// Every pair of bots plays the same deals twice, swapping seats and decks
// (duplicate format), so the luck of the deal cancels out between them.
//
//   node tools/elo.mjs [deals per pair=20] [seed=1]
//   BOTS=Careful,Expert node tools/elo.mjs 30     (only some bots)
// Writes .phone-tests/lab/elo-<seed>.md.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { newGame, apply, actor, legalActions } from '../js/engine.js';
import { chooseAction, planAction } from '../js/ai.js';
import { RULES, ULTRA_STARTERS, ULTRA_V, legendFor } from '../js/cards.js';
import { cardList } from '../js/decks.js';

const DEALS = Number(process.argv[2] || 20), SEED = Number(process.argv[3] || 1);
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '.phone-tests', 'lab');
mkdirSync(OUT, { recursive: true });

const ALL = [
  { name: 'Random', eps: 1 },
  { name: 'Shaky 40', eps: 0.4, noise: 0.4 },
  { name: 'Shaky 20', eps: 0.2, noise: 0.4 },
  { name: 'Practice', eps: 0, noise: 0.4 },
  { name: 'Careful', eps: 0, noise: 0 },
  { name: 'Expert', eps: 0, noise: 0, beam: 4 },
  { name: 'Planner', eps: 0, plan: 3 },
  { name: 'Deep Planner', eps: 0, plan: 4, tries: 3 },
];
const BOTS = process.env.BOTS ? ALL.filter((b) => process.env.BOTS.split(',').includes(b.name)) : ALL.filter((b) => !b.plan);
const decks = ULTRA_STARTERS.map((d) => ({ name: d.name, list: cardList(d.counts) }));
decks.forEach((d) => { d.legend = legendFor(d.list); });

function move(bot, s, p, rand) {
  if (s.phase !== 'mulligan' && bot.eps && rand() < bot.eps) {
    const legal = legalActions(s, p);
    if (legal.length) return legal[Math.floor(rand() * legal.length)];
  }
  if (bot.plan) return planAction(s, p, { rand, beam: bot.plan, tries: bot.tries || 1 });
  return chooseAction(s, p, { rand, noise: bot.noise ?? 0, beam: bot.beam || 0 });
}

// One duel: bots[k] plays deck dk in seat k. Returns the winning seat (null: no end).
function duel(bots, dk, seed) {
  let s = newGame({ seed, players: dk.map((k, i) => ({ name: `${bots[i].name} (${decks[k].name})`, deck: decks[k].list, legend: decks[k].legend })), startEnergy: RULES.startEnergy, ultra: ULTRA_V });
  let x = (seed * 2654435761) >>> 0;
  const rand = () => (x = (Math.imul(x, 1103515245) + 12345) >>> 0) / 4294967296;
  for (let k = 0; k < 5000 && s.phase !== 'over'; k++) {
    const p = s.phase === 'mulligan' ? s.players.findIndex((P) => !P.mull) : actor(s);
    const r = apply(s, move(bots[p], s, p, rand));
    if (r.error) throw new Error(r.error);
    s = r.state;
  }
  return { winner: s.phase === 'over' ? s.winner : null, rounds: s.players[s.first].turns };
}

// ── play ────────────────────────────────────────────────────────────
let rs = SEED >>> 0;
const R = () => (rs = (Math.imul(rs, 1103515245) + 12345) >>> 0) / 4294967296;
const n = BOTS.length;
const wins = BOTS.map(() => BOTS.map(() => 0)), games = BOTS.map(() => BOTS.map(() => 0));
const byDeck = {}; // Careful-or-better against a shaky bot, by the stronger bot's deck: [wins, games]
let unfinished = 0, rounds = 0, played = 0;
const t0 = Date.now();
for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
  for (let g = 0; g < DEALS; g++) {
    const dk = [Math.floor(R() * decks.length), Math.floor(R() * decks.length)];
    const seed = 1 + Math.floor(R() * 1e9);
    // the same deal twice: i in seat 0 with deck dk[0], then j there
    for (const [a, b] of [[i, j], [j, i]]) {
      const { winner, rounds: r } = duel([BOTS[a], BOTS[b]], dk, seed);
      played++;
      if (winner == null) { unfinished++; continue; }
      rounds += r;
      const w = winner === 0 ? a : b;
      wins[w][w === a ? b : a] += 1;
      games[a][b] += 1; games[b][a] += 1;
      const strong = BOTS[a].eps === 0 && BOTS[b].eps > 0 && BOTS[b].eps < 1 ? 0 : BOTS[b].eps === 0 && BOTS[a].eps > 0 && BOTS[a].eps < 1 ? 1 : -1;
      if (strong >= 0) {
        const name = decks[dk[strong]].name;
        byDeck[name] ||= [0, 0];
        byDeck[name][1] += 1;
        if (winner === strong) byDeck[name][0] += 1;
      }
    }
  }
  process.stdout.write(`${BOTS[i].name} vs ${BOTS[j].name}: ${wins[i][j]}–${wins[j][i]}  (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
}

// ── Bradley–Terry ratings (minorize–maximize), the practice bot at 1500 ──
let p = BOTS.map(() => 1);
for (let it = 0; it < 2000; it++) {
  const next = p.map((pi, i) => {
    const W = wins[i].reduce((a, b) => a + b, 0) + 0.5; // (a half-win prior keeps an unbeaten bot finite)
    let d = 0;
    for (let j = 0; j < n; j++) if (j !== i && games[i][j]) d += games[i][j] / (pi + p[j]);
    d += 1 / (pi + 1); // (the prior's game, against a bot of strength 1)
    return W / d;
  });
  const g = Math.exp(next.reduce((a, b) => a + Math.log(b), 0) / n);
  p = next.map((x) => x / g);
}
const elo = p.map((x) => 400 * Math.log10(x));
const anchor = BOTS.findIndex((b) => b.name === 'Practice');
const shift = 1500 - (anchor >= 0 ? elo[anchor] : 0);
const rating = elo.map((e) => Math.round(e + shift));
const expect = (d) => 1 / (1 + 10 ** (-d / 400));

const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : '—');
const lines = [];
lines.push(`# The Elo ladder, seed ${SEED}`, '');
lines.push(`Ultra version ${ULTRA_V}, duels, the ${decks.length} Ultra starters dealt at random; ${DEALS} deals per pair, each played both ways: ${played} games, ${unfinished} unfinished, ${(rounds / Math.max(1, played - unfinished)).toFixed(1)} rounds a game, ${((Date.now() - t0) / 60000).toFixed(1)} minutes.`, '');
lines.push('| Bot | Elo | won | against the practice bot |', '|---|---|---|---|');
BOTS.forEach((b, i) => {
  const W = wins[i].reduce((a, c) => a + c, 0), G = games[i].reduce((a, c) => a + c, 0);
  lines.push(`| ${b.name} | ${rating[i]} | ${pct(W, G)} | ${anchor >= 0 && i !== anchor ? `${Math.round(100 * expect(rating[i] - 1500))}% expected, ${pct(wins[i][anchor], games[i][anchor])} played` : ''} |`);
});
lines.push('', 'Head to head (row beat column):', '', `| | ${BOTS.map((b) => b.name).join(' | ')} |`, `|---|${BOTS.map(() => '---').join('|')}|`);
BOTS.forEach((b, i) => lines.push(`| ${b.name} | ${BOTS.map((_, j) => (i === j ? '' : pct(wins[i][j], games[i][j]))).join(' | ')} |`));
if (Object.keys(byDeck).length) {
  lines.push('', 'A careful bot (or better) against a shaky one, by the careful bot’s deck:', '');
  for (const [name, [w, g]] of Object.entries(byDeck).sort((x, y) => y[1][0] / y[1][1] - x[1][0] / x[1][1])) lines.push(`- ${name}: ${pct(w, g)} of ${g}`);
}
const text = lines.join('\n') + '\n';
writeFileSync(join(OUT, `elo-${SEED}.md`), text);
console.log('\n' + text);
