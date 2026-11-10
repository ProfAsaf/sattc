// Your rating (2026-11-10): Glicko-2, the rating Lichess uses, from your games
// against the bots. Each bot level's Elo is a fixed anchor (ai.js LEVELS,
// measured by tools/train.mjs ladder). It is worked out again from the games
// saved on this phone whenever it's shown, so nothing new is stored.
//
// - You start at 1500 with a deviation of 350; while the deviation is above
//   110 the rating is provisional and shows a "?" (Lichess's rule).
// - Each game is one rating period. A duel is one result against the bot. A
//   three-player game is a result against each bot, by who outlasted whom
//   (the winner beat both; of the others, the one out later did better), each
//   at half weight (weights scale both sums in Glicko-2's update).
// - Rated: finished practice games against the bots, played straight. A game
//   where you took back a move isn't rated (as on chess sites), nor online
//   games (people's ratings come later), nor the lesson.
// - Games from before the levels (2026-11-09) were against the Practice bot.
import { LEVELS } from './ai.js';

const Q = 173.7178; // (Glicko-2's scale: 400 / ln 10)
const TAU = 0.5; // how fast the volatility may change (Glickman suggests 0.3–1.2)
const BOT_RD = 50; // how sure the bots' own ratings are (the ladder's spread)
export const START = { r: 1500, rd: 350, vol: 0.06 };
export const PROVISIONAL = 110;
const MIN_RD = 45;

const levelElo = (id) => (LEVELS.find((L) => L.id === (id || 'practice')) || LEVELS.find((L) => L.id === 'practice')).elo || 1500;

/** One game's results for you, [{ r, rd, s, w }], or null if it isn't rated. */
export function gameResults(g) {
  if (!g || g.mode !== 'practice' || !g.over || g.winner == null || g.takebacks > 0) return null;
  const n = g.players.length;
  if (n < 2) return null;
  const elo = levelElo(g.level);
  const outAt = (i) => { const k = (g.outs || []).findIndex((o) => o.v === i); return k < 0 ? Infinity : k; };
  return g.players.map((_, i) => i).filter((i) => i !== g.me).map((b) => ({
    r: elo, rd: BOT_RD, w: 1 / (n - 1),
    s: g.winner === g.me ? 1 : g.winner === b ? 0 : outAt(g.me) > outAt(b) ? 1 : 0,
  }));
}

/** Glicko-2's update for one rating period (Glickman, "Example of the Glicko-2 system"), with weighted results. */
export function glicko2(p, results, tau = TAU) {
  const mu = (p.r - 1500) / Q, phi = p.rd / Q;
  if (!results.length) return { ...p, rd: Math.min(START.rd, Q * Math.sqrt(phi * phi + p.vol * p.vol)) };
  let vInv = 0, sum = 0;
  for (const o of results) {
    const w = o.w ?? 1, phij = o.rd / Q;
    const g = 1 / Math.sqrt(1 + (3 * phij * phij) / (Math.PI * Math.PI));
    const E = 1 / (1 + Math.exp(-g * (mu - (o.r - 1500) / Q)));
    vInv += w * g * g * E * (1 - E);
    sum += w * g * (o.s - E);
  }
  const v = 1 / vInv, delta = v * sum;
  // the new volatility: the root of f, found by the Illinois method
  const a = Math.log(p.vol * p.vol);
  const f = (x) => { const ex = Math.exp(x); return (ex * (delta * delta - phi * phi - v - ex)) / (2 * (phi * phi + v + ex) ** 2) - (x - a) / (tau * tau); };
  let A = a, B;
  if (delta * delta > phi * phi + v) B = Math.log(delta * delta - phi * phi - v);
  else { let k = 1; while (f(a - k * tau) < 0 && k < 100) k++; B = a - k * tau; }
  let fA = f(A), fB = f(B);
  for (let i = 0; i < 100 && Math.abs(B - A) > 1e-6; i++) {
    const C = A + ((A - B) * fA) / (fB - fA), fC = f(C);
    if (fC * fB <= 0) { A = B; fA = fB; } else fA /= 2;
    B = C; fB = fC;
  }
  const vol = Math.exp(A / 2);
  const phiStar = Math.sqrt(phi * phi + vol * vol);
  const phiNew = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
  return { r: Q * (mu + phiNew * phiNew * sum) + 1500, rd: Math.max(MIN_RD, Q * phiNew), vol };
}

/**
 * Your rating from your saved games: { r, rd, n, provisional, history: [{ id,
 * at, r, rd, change }] } (oldest first), or { n: 0 } before any rated game.
 */
export function myRating(games) {
  let p = { ...START };
  const history = [];
  for (const g of [...games].sort((x, y) => x.at - y.at)) {
    const res = gameResults(g);
    if (!res) continue;
    const before = p.r;
    p = glicko2(p, res);
    history.push({ id: g.id, at: g.at, r: p.r, rd: p.rd, change: p.r - before });
  }
  return history.length ? { r: p.r, rd: p.rd, n: history.length, provisional: p.rd > PROVISIONAL, history } : { n: 0, history };
}

/** A rating as people read it: "1543", or "1543?" while it's provisional. */
export const ratingText = (R) => (R.n ? `${Math.round(R.r)}${R.provisional ? '?' : ''}` : '');

/** Where a rating sits among the bot levels, in words. */
export function nearLevel(r) {
  const ls = LEVELS.filter((L) => L.elo).sort((x, y) => x.elo - y.elo);
  if (r < ls[0].elo) return `below ${ls[0].name} (${ls[0].elo})`;
  if (r >= ls[ls.length - 1].elo) return `at or above ${ls[ls.length - 1].name} (${ls[ls.length - 1].elo})`;
  const i = ls.findIndex((L, k) => r >= L.elo && r < ls[k + 1].elo);
  return `between ${ls[i].name} (${ls[i].elo}) and ${ls[i + 1].name} (${ls[i + 1].elo})`;
}
