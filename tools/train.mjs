// Training the bots' brains (2026-11-09): the weights a bot scores positions
// with (js/brains.js, ai.js evaluate). Two ways, used in turn:
//
//   1. Learn from self-play (the "Texel" method chess engines use): bots play
//      thousands of duels; every position is saved with the terms the bot
//      weighs (ai.js features) and who won in the end; a logistic regression
//      finds the weights that best predict the winner. Positions in the middle
//      of a fight are left out: they aren't settled.
//   2. Fine-tune by matches (SPSA, the way Stockfish tunes its numbers): nudge
//      every weight at once, up for one bot and down for the other, play them
//      against each other, and step toward the winner.
//
// A brain is kept only if it beats the one before in a match on deals it never
// trained on (`match`). Every game is a duel with two Ultra starters dealt at
// random, and in a match each deal is played twice with the seats swapped
// (duplicate format), so the luck of the deal cancels out.
//
//   node tools/train.mjs data  [games=3000] [brain=classic] [noise=0.4]  self-play positions → .phone-tests/train/data-<brain>.bin
//   node tools/train.mjs fit   [data=classic] [name]                    the regression → .phone-tests/train/brain-<name>.json
//   node tools/train.mjs match <brainA> <brainB> [deals=400] [noise=0.15]  A's score against B, with a 95% interval and the Elo gap
//   node tools/train.mjs spsa  <brain> [iterations=500] [name]          fine-tuned → .phone-tests/train/brain-<name>.json
//   node tools/train.mjs ladder [deals per pair=40]                     the difficulty levels (ai.js LEVELS) rated by Elo, Practice = 1500
//   node tools/train.mjs decks [level=tough] [deals=150]                each starter's win rate when both sides play at that level
// A brain is a name in js/brains.js, or a name saved by this tool. WORKERS=n (default: cores − 2).

import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { availableParallelism } from 'node:os';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { newGame, apply, actor } from '../js/engine.js';
import { chooseAction, planAction, features, BRAIN_KEYS, LEVELS } from '../js/ai.js';
import { BRAINS, CLASSIC } from '../js/brains.js';
import { RULES, ULTRA_STARTERS, ULTRA_V, legendFor } from '../js/cards.js';
import { cardList } from '../js/decks.js';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '.phone-tests', 'train');
const DECKS = ULTRA_STARTERS.map((d) => { const list = cardList(d.counts); return { name: d.name, list, legend: legendFor(list) }; });
const K = BRAIN_KEYS.length;
const rng = (seed) => { let x = seed >>> 0 || 1; return () => (x = (Math.imul(x, 1103515245) + 12345) >>> 0) / 4294967296; };

export function loadBrain(name) {
  if (name && typeof name === 'object') return name;
  if (!name || name === 'classic') return CLASSIC;
  if (BRAINS[name]) return BRAINS[name];
  const f = existsSync(name) ? name : join(OUT, `brain-${name}.json`);
  return JSON.parse(readFileSync(f, 'utf8')).brain;
}

// A bot: { brain, noise, beam } (ai.js chooseAction), or { brain, plan, tries } (the Planner).
function botMove(bot, s, p, rand) {
  if (bot.plan && s.phase === 'main' && s.active === p) return planAction(s, p, { rand, beam: bot.plan, tries: bot.tries || 1, brain: bot.brain, margin: bot.margin ?? 0.5 });
  return chooseAction(s, p, { rand, noise: bot.noise ?? 0, beam: bot.beam || 0, brain: bot.brain, top: bot.top || 0 });
}

// One duel. bots[k] plays seat k with deck dk[k]. `record`: save positions (features from both sides).
function duel(bots, dk, seed, record = false) {
  let s = newGame({ seed, players: dk.map((k, i) => ({ name: `P${i}`, deck: DECKS[k].list, legend: DECKS[k].legend })), startEnergy: RULES.startEnergy, deckClock: true, ultra: ULTRA_V });
  const rand = rng(seed * 2654435761);
  const rows = [];
  for (let k = 0; k < 5000 && s.phase !== 'over'; k++) {
    const p = s.phase === 'mulligan' ? s.players.findIndex((P) => !P.mull) : actor(s);
    const r = apply(s, botMove(bots[p], s, p, rand));
    if (r.error) throw new Error(r.error);
    s = r.state;
    // a settled position: someone's main phase, no fight going on
    if (record && s.phase === 'main' && !s.combat) for (const me of [0, 1]) {
      if (s.players[me].out) continue;
      const f = features(s, me);
      rows.push([...BRAIN_KEYS.map((key) => f[key]), s.active === me ? 1 : 0, me]);
    }
  }
  return { winner: s.phase === 'over' ? s.winner : null, rows };
}

// ── workers ─────────────────────────────────────────────────────────
if (!isMainThread) {
  parentPort.on('message', (job) => {
    if (job.kind === 'data') {
      const out = [];
      for (const g of job.games) {
        const bot = { brain: job.brain, noise: job.noise };
        const { winner, rows } = duel([bot, bot], g.dk, g.seed, true);
        if (winner == null) continue;
        for (const r of rows) out.push(...r.slice(0, K + 1), r[K + 1] === winner ? 1 : 0, g.id);
      }
      parentPort.postMessage({ id: job.id, data: Float64Array.from(out) });
    } else if (job.kind === 'match') {
      // each deal twice: A in seat 0, then B in seat 0
      let score = 0, n = 0;
      for (const g of job.games) for (const swap of [false, true]) {
        const A = job.A.brain !== undefined || job.A.plan ? job.A : { brain: job.A, noise: job.noise }, B = job.B.brain !== undefined || job.B.plan ? job.B : { brain: job.B, noise: job.noise };
        const { winner } = duel(swap ? [B, A] : [A, B], g.dk, g.seed);
        n++;
        if (winner == null) score += 0.5;
        else if ((winner === 0) !== swap) score += 1;
      }
      parentPort.postMessage({ id: job.id, score, n });
    } else if (job.kind === 'decks') {
      // the same bot in both seats; each deal both ways: which deck won
      const out = [];
      for (const g of job.games) for (const swap of [false, true]) {
        const dk = swap ? [g.dk[1], g.dk[0]] : g.dk;
        const { winner } = duel([job.A, job.A], dk, g.seed);
        if (winner != null) out.push([dk[winner], dk[1 - winner]]);
      }
      parentPort.postMessage({ id: job.id, out });
    }
  });
}

// A pool of workers running jobs; resolves with each job's reply, in order.
function pool(n) {
  const ws = Array.from({ length: n }, () => new Worker(fileURLToPath(import.meta.url)));
  let next = 0;
  const waiting = new Map();
  for (const w of ws) w.on('message', (m) => { const r = waiting.get(m.id); waiting.delete(m.id); r(m); });
  return {
    run(jobs) {
      return Promise.all(jobs.map((job, i) => new Promise((res) => { const id = ++next; waiting.set(id, res); ws[i % ws.length].postMessage({ ...job, id }); })));
    },
    close() { for (const w of ws) w.terminate(); },
  };
}
const chunk = (xs, n) => Array.from({ length: n }, (_, i) => xs.filter((_, k) => k % n === i)).filter((c) => c.length);
// deals: a seeded random pair of decks and a game seed
const deals = (n, seed) => { const R = rng(seed); return Array.from({ length: n }, (_, id) => ({ id, dk: [Math.floor(R() * DECKS.length), Math.floor(R() * DECKS.length)], seed: 1 + Math.floor(R() * 1e9) })); };

// ── the regression ──────────────────────────────────────────────────
// Logistic regression by Newton's method, on standardized terms, with a small
// ridge. Columns: the brain's terms, then "it's my turn" (a nuisance: it
// changes no decision), and an intercept.
function logit(X, y, cols, lambda = 1) {
  const n = y.length, k = cols + 1;
  const mean = new Float64Array(cols), sd = new Float64Array(cols);
  for (let i = 0; i < n; i++) for (let j = 0; j < cols; j++) mean[j] += X[i * cols + j] / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < cols; j++) sd[j] += (X[i * cols + j] - mean[j]) ** 2 / n;
  for (let j = 0; j < cols; j++) sd[j] = Math.sqrt(sd[j]) || 1;
  const z = (i, j) => (j === cols ? 1 : (X[i * cols + j] - mean[j]) / sd[j]);
  let b = new Float64Array(k);
  let H = null;
  for (let it = 0; it < 25; it++) {
    const g = new Float64Array(k);
    H = Array.from({ length: k }, () => new Float64Array(k));
    const row = new Float64Array(k);
    for (let i = 0; i < n; i++) {
      let eta = 0;
      for (let j = 0; j < k; j++) { row[j] = z(i, j); eta += b[j] * row[j]; }
      const p = 1 / (1 + Math.exp(-eta)), w = p * (1 - p);
      for (let j = 0; j < k; j++) {
        g[j] += (y[i] - p) * row[j];
        const wr = w * row[j];
        for (let l = 0; l <= j; l++) H[j][l] += wr * row[l];
      }
    }
    for (let j = 0; j < k; j++) { for (let l = 0; l < j; l++) H[l][j] = H[j][l]; if (j < cols) { H[j][j] += lambda; g[j] -= lambda * b[j]; } }
    const step = solve(H, g);
    let size = 0;
    for (let j = 0; j < k; j++) { b[j] += step[j]; size = Math.max(size, Math.abs(step[j])); }
    if (size < 1e-7) break;
  }
  const inv = invert(H);
  return { beta: Array.from({ length: cols }, (_, j) => b[j] / sd[j]), se: Array.from({ length: cols }, (_, j) => Math.sqrt(inv[j][j]) / sd[j]), intercept: b[cols] - Array.from({ length: cols }, (_, j) => (b[j] * mean[j]) / sd[j]).reduce((a, c) => a + c, 0), mean, sd };
}
function solve(A, v) {
  const n = v.length, M = A.map((r, i) => [...r, v[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let j = c; j <= n; j++) M[r][j] -= f * M[c][j]; }
  }
  return M.map((r, i) => r[n] / r[i]);
}
function invert(A) { return A.map((_, i) => solve(A, A.map((__, j) => (i === j ? 1 : 0)))).map((col, i, all) => all.map((c) => c[i])); }
const logLoss = (X, y, cols, score) => { let L = 0; for (let i = 0; i < y.length; i++) { const p = Math.min(1 - 1e-9, Math.max(1e-9, 1 / (1 + Math.exp(-score(i))))); L -= y[i] ? Math.log(p) : Math.log(1 - p); } return L / y.length; };

// ── commands ────────────────────────────────────────────────────────
async function main() {
  mkdirSync(OUT, { recursive: true });
  const [cmd, ...args] = process.argv.slice(2);
  const nw = Number(process.env.WORKERS || Math.max(1, availableParallelism() - 2));
  const t0 = Date.now();
  const secs = () => `${((Date.now() - t0) / 1000).toFixed(0)}s`;

  if (cmd === 'data') {
    const [games = 3000, name = 'classic', noise = 0.4] = args;
    const brain = loadBrain(name);
    const P = pool(nw);
    const all = deals(Number(games), 424242 + name.length);
    const parts = await P.run(chunk(all, nw * 4).map((games) => ({ kind: 'data', games, brain, noise: Number(noise) })));
    P.close();
    const data = Float64Array.from(parts.flatMap((p) => Array.from(p.data)));
    const file = join(OUT, `data-${name}.bin`);
    writeFileSync(file, Buffer.from(data.buffer));
    console.log(`${games} self-play duels (brain ${name}, noise ${noise}): ${data.length / (K + 3)} positions → ${file} (${secs()})`);
    return;
  }

  if (cmd === 'fit') {
    const [from = 'classic', name = `fit-${from}`] = args;
    const raw = new Float64Array(readFileSync(join(OUT, `data-${from}.bin`)).buffer.slice(0));
    const W = K + 3, rows = raw.length / W;
    // hold out every fifth game for checking
    const tr = [], te = [];
    for (let i = 0; i < rows; i++) (raw[i * W + K + 2] % 5 === 0 ? te : tr).push(i);
    // ONLY=race,theirRace,…: learn just those weights; the rest stay the classic
    // brain's, as one term ("rest") whose weight sets the scale.
    const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
    const free = BRAIN_KEYS.filter((k) => k !== 'inc3'); // (duels: the three-player weight isn't in the data)
    const used = only ? ['rest', ...only] : free;
    const val = (i, k) => (k === 'rest' ? free.filter((x) => !only.includes(x)).reduce((a, x) => a + CLASSIC[x] * raw[i * W + BRAIN_KEYS.indexOf(x)], 0) : raw[i * W + BRAIN_KEYS.indexOf(k)]);
    const colsOf = (idx) => { const X = new Float64Array(idx.length * (used.length + 1)), y = new Float64Array(idx.length); idx.forEach((i, r) => { used.forEach((k, j) => { X[r * (used.length + 1) + j] = val(i, k); }); X[r * (used.length + 1) + used.length] = raw[i * W + K]; y[r] = raw[i * W + K + 1]; }); return { X, y }; };
    const T = colsOf(tr), E = colsOf(te);
    const cols = used.length + 1;
    const m = logit(T.X, T.y, cols);
    // the classic brain's score, rescaled to odds by a one-variable fit, for comparison
    const classicScore = only ? (X, i) => X[i * cols] : (X, i) => used.reduce((a, k, j) => a + CLASSIC[k] * X[i * cols + j], 0);
    const cs = new Float64Array(T.y.length); for (let i = 0; i < T.y.length; i++) cs[i] = classicScore(T.X, i);
    const c1 = logit(cs, T.y, 1);
    const lossNew = logLoss(E.X, E.y, cols, (i) => m.intercept + m.beta.reduce((a, b, j) => a + b * E.X[i * cols + j], 0));
    const lossOld = logLoss(E.X, E.y, cols, (i) => c1.intercept + c1.beta[0] * classicScore(E.X, i));
    const base = E.y.reduce((a, b) => a + b, 0) / E.y.length;
    const lossNone = -(base * Math.log(base) + (1 - base) * Math.log(1 - base));
    // the brain: weights in the classic brain's units (Life counts 1)
    const life = m.beta[used.indexOf(only ? 'rest' : 'life')];
    const brain = { ...CLASSIC };
    used.forEach((k, j) => { if (k !== 'rest') brain[k] = +(m.beta[j] / life).toFixed(4); });
    brain.inc3 = +(brain.inc * (CLASSIC.inc3 / CLASSIC.inc)).toFixed(4);
    console.log(`fit on ${tr.length} positions, checked on ${te.length} from games it didn't see (${secs()})`);
    console.log(`held-out log loss: coin flip ${lossNone.toFixed(4)}, classic brain ${lossOld.toFixed(4)}, learned ${lossNew.toFixed(4)}  (lower is better)`);
    console.log('term          classic   learned   ± (2 s.e.)');
    used.forEach((k, j) => console.log(`  ${k.padEnd(12)} ${String(CLASSIC[k] ?? 1).padStart(7)}  ${(k === 'rest' ? 1 : brain[k]).toFixed(3).padStart(8)}   ${(2 * m.se[j] / Math.abs(life)).toFixed(3)}`));
    console.log(`  (my turn: ${(m.beta[used.length] / life).toFixed(3)} in the same units; not part of the brain)`);
    writeFileSync(join(OUT, `brain-${name}.json`), JSON.stringify({ name, from, brain, loss: { none: lossNone, classic: lossOld, learned: lossNew } }, null, 1));
    console.log(`→ ${join(OUT, `brain-${name}.json`)}`);
    return;
  }

  if (cmd === 'match') {
    const [a, b, n = 400, noise = 0.15] = args;
    const A = loadBrain(a), B = loadBrain(b);
    const P = pool(nw);
    const res = await P.run(chunk(deals(Number(n), 777 + Number(n)), nw * 3).map((games) => ({ kind: 'match', games, A, B, noise: Number(noise) })));
    P.close();
    const score = res.reduce((x, r) => x + r.score, 0), games = res.reduce((x, r) => x + r.n, 0);
    const p = score / games, se = Math.sqrt(p * (1 - p) / games);
    const elo = (q) => -400 * Math.log10(1 / Math.min(0.999, Math.max(0.001, q)) - 1);
    console.log(`${a} vs ${b}: ${a} scores ${(100 * p).toFixed(1)}% of ${games} games (95%: ${(100 * (p - 2 * se)).toFixed(1)}–${(100 * (p + 2 * se)).toFixed(1)}%), about ${elo(p) >= 0 ? '+' : ''}${Math.round(elo(p))} Elo (${secs()})`);
    return;
  }

  if (cmd === 'spsa') {
    const [from = 'classic', iters = 500, name = `spsa-${from}`] = args;
    const keys = BRAIN_KEYS.filter((k) => k !== 'inc3');
    const FLOOR = { race: 4, theirRace: 4, swing: 4, theirSwing: 4 };
    const theta = { ...loadBrain(from) };
    const P = pool(nw);
    const DEALS = Number(process.env.DEALS || 12); // deals per step (each played both ways)
    const R = rng(90210);
    let sum = 0;
    for (let t = 1; t <= Number(iters); t++) {
      const c = 0.15 / t ** 0.101, a = 0.6 / (t + 50) ** 0.602 * 50 ** 0.602; // (gain sequences: Spall's standard exponents)
      const delta = Object.fromEntries(keys.map((k) => [k, R() < 0.5 ? -1 : 1]));
      const step = (k) => c * Math.max(Math.abs(theta[k]), FLOOR[k] || 0.25); // (each weight moves in proportion to its size; the race terms are shares of Life, so bigger)
      const plus = { ...theta }, minus = { ...theta };
      for (const k of keys) { plus[k] = theta[k] + step(k) * delta[k]; minus[k] = theta[k] - step(k) * delta[k]; }
      plus.inc3 = plus.inc * (CLASSIC.inc3 / CLASSIC.inc); minus.inc3 = minus.inc * (CLASSIC.inc3 / CLASSIC.inc);
      const res = await P.run(chunk(deals(DEALS, 31 * t + 5), Math.min(nw, DEALS)).map((games) => ({ kind: 'match', games, A: plus, B: minus, noise: 0.15 })));
      const score = res.reduce((x, r) => x + r.score, 0) / res.reduce((x, r) => x + r.n, 0); // plus's share, 0..1
      sum += score;
      for (const k of keys) theta[k] += a * (score - 0.5) * 2 * step(k) * delta[k];
      theta.inc3 = theta.inc * (CLASSIC.inc3 / CLASSIC.inc);
      if (t % 25 === 0) console.log(`step ${t}: plus won ${(100 * sum / 25).toFixed(0)}% of the last 25 steps' games (${secs()})`), sum = 0;
    }
    P.close();
    const brain = Object.fromEntries(Object.entries(theta).map(([k, v]) => [k, +v.toFixed(4)]));
    writeFileSync(join(OUT, `brain-${name}.json`), JSON.stringify({ name, from, brain }, null, 1));
    console.log('term          from      tuned');
    for (const k of keys) console.log(`  ${k.padEnd(12)} ${loadBrain(from)[k].toFixed(3).padStart(7)}  ${brain[k].toFixed(3).padStart(8)}`);
    console.log(`→ ${join(OUT, `brain-${name}.json`)} (${secs()})`);
    return;
  }
  if (cmd === 'ladder') {
    // every level against every other, the same deals both ways; Bradley–Terry ratings (as tools/elo.mjs)
    const [n = 40] = args;
    // LADDER='[{"name":"Noise 4","brain":"classic","noise":4}, …]' rates other bots instead (one of them named Practice)
    const levels = process.env.LADDER ? JSON.parse(process.env.LADDER) : LEVELS;
    const bots = levels.map((L) => ({ name: L.name, bot: { brain: loadBrain(L.brain), noise: L.noise, beam: L.beam || 0, plan: L.plan || 0, tries: L.tries || 1, top: L.top || 0, margin: L.margin } }));
    const P = pool(nw);
    const pairs = [];
    for (let i = 0; i < bots.length; i++) for (let j = i + 1; j < bots.length; j++) pairs.push([i, j]);
    const jobs = pairs.flatMap(([i, j], q) => chunk(deals(Number(n), 5000 + q), 3).map((games) => ({ kind: 'match', games, A: bots[i].bot, B: bots[j].bot, i, j })));
    const res = await P.run(jobs);
    P.close();
    const m = bots.length, won = bots.map(() => bots.map(() => 0)), games = bots.map(() => bots.map(() => 0));
    res.forEach((r, q) => { const { i, j } = jobs[q]; won[i][j] += r.score; won[j][i] += r.n - r.score; games[i][j] += r.n; games[j][i] += r.n; });
    let p = bots.map(() => 1);
    for (let it = 0; it < 3000; it++) {
      const nx = p.map((pi, i) => { const Wn = won[i].reduce((a, b) => a + b, 0) + 0.5; let d = 1 / (pi + 1); for (let j = 0; j < m; j++) if (j !== i && games[i][j]) d += games[i][j] / (pi + p[j]); return Wn / d; });
      const g = Math.exp(nx.reduce((a, b) => a + Math.log(b), 0) / m);
      p = nx.map((x) => x / g);
    }
    const elo = p.map((x) => 400 * Math.log10(x)), anchor = bots.findIndex((b) => b.name === 'Practice');
    const rating = elo.map((e) => Math.round(e - elo[anchor] + 1500));
    const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : '');
    const lines = [`# The difficulty levels by Elo (${n} deals per pair, both ways; ${secs()})`, '', '| Level | Elo |', '|---|---|', ...bots.map((b, i) => `| ${b.name} | ${rating[i]} |`), '', `| row beat column | ${bots.map((b) => b.name).join(' | ')} |`, `|---|${bots.map(() => '---').join('|')}|`, ...bots.map((b, i) => `| ${b.name} | ${bots.map((_, j) => (i === j ? '' : pct(won[i][j], games[i][j]))).join(' | ')} |`)];
    const NL = String.fromCharCode(10);
    writeFileSync(join(OUT, `ladder${process.env.TAG ? `-${process.env.TAG}` : ''}.md`), lines.join(NL) + NL);
    console.log(lines.join(NL));
    return;
  }
  if (cmd === 'decks') {
    const [lv = 'tough', n = 150] = args;
    const L = LEVELS.find((x) => x.id === lv);
    const bot = { brain: loadBrain(L.brain), noise: L.noise, beam: L.beam || 0, plan: L.plan || 0, tries: L.tries || 1, top: L.top || 0, margin: L.margin };
    const P = pool(nw);
    // (deals between two different decks)
    const ds = deals(Number(n) * 2, 4040 + Number(n)).filter((g) => g.dk[0] !== g.dk[1]).slice(0, Number(n));
    const res = await P.run(chunk(ds, nw * 3).map((games) => ({ kind: 'decks', games, A: bot })));
    P.close();
    const w = DECKS.map(() => 0), g = DECKS.map(() => 0);
    for (const r of res) for (const [win, lose] of r.out) { w[win]++; g[win]++; g[lose]++; }
    console.log(`${L.name} against ${L.name}, ${res.reduce((a, r) => a + r.out.length, 0)} duels (${secs()}):`);
    DECKS.map((d, i) => [d.name, w[i], g[i]]).sort((x, y) => y[1] / y[2] - x[1] / x[2]).forEach(([name, a, b]) => console.log(`  ${name.padEnd(22)} ${Math.round((100 * a) / b)}% of ${b}`));
    return;
  }
  console.log('usage: node tools/train.mjs data|fit|match|spsa|ladder|decks …');
}
if (isMainThread) await main();
