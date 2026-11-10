// Stats tests: bot games and drafts, analysed and reviewed (js/stats.js).
//   node tools/test-stats.mjs            40 games, 30 drafts
//   node tools/test-stats.mjs 200 60     more
// Checks the counts add up (damage dealt vs Life lost, kills vs deaths, the
// Life line vs the final Life), times the review, and prints how the bot
// grades a careful bot, a noisy one and a random player, which is what the
// grade thresholds are tuned against. Half the games and drafts are SATTC Ultra.

import { newGame, apply, actor, legalActions } from '../js/engine.js';
import { chooseAction } from '../js/ai.js';
import { STARTERS, ULTRA, ULTRA_STARTERS } from '../js/cards.js';
import { cardList } from '../js/decks.js';
import { botPick, botRand, replay as replayDraft, newSeed } from '../js/draft.js';
const ULTRA_IDS = new Set(ULTRA.map((c) => c.id)); // (any Ultra card, the newer ones too)
import { analyzeGame, reviewPlay, reviewDraft, summarize, roomResult, nightAwards } from '../js/stats.js';
import { glicko2, gameResults, myRating } from '../js/rating.js';

const GAMES = Number(process.argv[2] || 40);
const DRAFTS = Number(process.argv[3] || 30);
let fails = 0, oks = 0;
const check = (ok, msg) => { if (ok) oks++; else { fails++; if (fails < 25) console.log('FAIL', msg); } };

function rng(seed) { let x = seed >>> 0; return () => (x = (Math.imul(x, 1103515245) + 12345) >>> 0) / 4294967296; }

// seat 0 plays with `style`: 'bot' (no noise), 'noisy' (the practice bot), 'random' (any legal move, ending turns often)
function playGame(seed, n, style, ultra = false) {
  const starters = ultra ? ULTRA_STARTERS : STARTERS;
  const decks = [0, 1, 2].map((k) => starters[(seed + k * 3) % starters.length]);
  const setup = { seed, players: decks.slice(0, n).map((d, i) => ({ name: i ? `Bot · ${d.name}` : 'You', deck: cardList(d.counts) })), ...(ultra ? { ultra: true, startEnergy: 3 } : {}) };
  let s = newGame(setup);
  const rand = rng(seed * 7 + 1);
  const actions = [];
  for (let steps = 0; s.phase !== 'over' && steps < 3000; steps++) {
    const p = s.phase === 'mulligan' ? s.players.findIndex((P) => !P.mull) : actor(s);
    let a;
    if (p === 0 && style === 'random') {
      const opts = legalActions(s, 0);
      const end = opts.find((x) => x.t === 'end');
      a = end && rand() < 0.25 ? end : opts[Math.floor(rand() * opts.length)];
    } else a = chooseAction(s, p, { noise: p === 0 ? (style === 'bot' ? 0 : style === 'noisy' ? 0.4 : 0.4) : 0.4, rand });
    const r = apply(s, a);
    if (r.error) throw new Error(`${r.error} (${JSON.stringify(a)})`);
    s = r.state;
    actions.push(a);
  }
  return { setup, actions, final: s };
}

const t0 = Date.now();
const records = [];
const byStyle = { bot: [], noisy: [], random: [] };
let reviewMs = 0, reviewMax = 0, analyzeMs = 0;
for (let g = 0; g < GAMES; g++) {
  const style = ['bot', 'noisy', 'random'][g % 3];
  const n = g % 4 === 3 ? 3 : 2;
  const ultra = (g >> 1) % 2 === 1;
  const { setup, actions, final } = playGame(1000 + g * 31, n, style, ultra);
  const ta = Date.now();
  const rec = analyzeGame(setup, actions, { me: 0 });
  analyzeMs += Date.now() - ta;
  // the counts add up
  const lifeEnd = rec.life[rec.life.length - 1];
  check(lifeEnd.every((l, i) => l === Math.max(0, final.players[i].life)), `game ${g}: the Life line ends on the final Life`);
  check(rec.winner === final.winner && rec.over === (final.phase === 'over'), `game ${g}: winner`);
  check(!!rec.ultra === ultra, `game ${g}: the record says ${ultra ? 'Ultra' : 'standard'}`);
  check(rec.players.every((P, i) => P.low <= rec.life[0][i] && rec.life[0][i] === (ultra ? (n > 2 ? 25 : 30) : 20)), `game ${g}: Life starts at ${rec.life[0].join('/')} and the lowest is counted from there`);
  const dealt = rec.players.reduce((t, P) => t + P.dealt, 0), taken = rec.players.reduce((t, P) => t + P.taken, 0), paid = rec.players.reduce((t, P) => t + P.paid, 0);
  check(dealt + paid <= taken, `game ${g}: damage dealt ${dealt} + Life paid ${paid} ≤ Life lost ${taken}`);
  check(taken - dealt - paid <= Math.max(6, taken * 0.25), `game ${g}: most Life lost is credited to someone (${taken - dealt - paid} of ${taken} not)`);
  const kills = rec.players.reduce((t, P) => t + P.kills, 0), lost = rec.players.reduce((t, P) => t + P.lost, 0);
  check(kills <= lost, `game ${g}: kills ${kills} ≤ creatures lost ${lost}`);
  check(rec.adv.length === rec.life.length && rec.adv.every((x) => x >= -1 && x <= 1), `game ${g}: the advantage line`);
  check(rec.adv[rec.adv.length - 1] === (final.winner === 0 ? 1 : -1) || final.phase !== 'over', `game ${g}: the line ends on the result`);
  check(rec.players.every((P) => P.spent <= P.had + 12), `game ${g}: Energy spent ≤ Energy had (plus Sparks)`);
  const cardDmg = Object.values(rec.mine).reduce((t, c) => t + c[1], 0);
  check(cardDmg <= rec.players[0].dealt, `game ${g}: my cards' damage ≤ my damage`);
  check(JSON.stringify(rec).length < (ultra ? 12000 : 9000), `game ${g}: the record is small (${JSON.stringify(rec).length} bytes)`);
  const tr = Date.now();
  const review = await reviewPlay(setup, actions, 0, { pause: () => Promise.resolve() });
  const ms = Date.now() - tr;
  reviewMs += ms;
  reviewMax = Math.max(reviewMax, ms);
  check(review.acc == null || (review.acc >= 0 && review.acc <= 100), `game ${g}: accuracy in range`);
  rec.review = review;
  Object.assign(rec, { id: `t:${g}`, at: g, mode: g % 2 ? 'online' : 'practice' });
  records.push(rec);
  byStyle[style].push(review);
  const room = roomResult(rec);
  check(JSON.stringify(room).length < 600, `game ${g}: the room result is small`);
}

// Your rating (rating.js): Glicko-2 as in Glickman's worked example, and which games count
{
  const p = glicko2({ r: 1500, rd: 200, vol: 0.06 }, [{ r: 1400, rd: 30, s: 1 }, { r: 1550, rd: 100, s: 0 }, { r: 1700, rd: 300, s: 0 }]);
  check(Math.abs(p.r - 1464.06) < 0.05 && Math.abs(p.rd - 151.52) < 0.05 && Math.abs(p.vol - 0.05999) < 0.0001, `Glicko-2 matches Glickman's example (${p.r.toFixed(2)}, ${p.rd.toFixed(2)}, ${p.vol.toFixed(5)})`);
  const g = (o) => ({ mode: 'practice', over: true, winner: 0, me: 0, takebacks: 0, players: [{}, {}], outs: [], at: 1, id: 'x', ...o });
  check(gameResults(g({}))?.[0].r === 1500 && gameResults(g({}))[0].s === 1, 'a won game from before the levels: one win against Practice (1500)');
  check(gameResults(g({ level: 'expert', winner: 1 }))[0].r === 1650 && gameResults(g({ level: 'expert', winner: 1 }))[0].s === 0, 'a lost game at Expert: a loss against 1650');
  check(gameResults(g({ takebacks: 1 })) === null && gameResults(g({ mode: 'online' })) === null && gameResults(g({ over: false })) === null, 'take-backs, online games and unfinished ones aren’t rated');
  const three = gameResults(g({ players: [{}, {}, {}], winner: 2, outs: [{ v: 1 }, { v: 0 }] }));
  check(three.length === 2 && three[0].s === 1 && three[1].s === 0 && three.every((x) => x.w === 0.5), 'three players: outlasting a bot beats it, the winner beats you, each at half weight');
  check(myRating([]).n === 0 && myRating([g({ at: 2 }), g({ at: 1, winner: 1 })]).history[0].change < 0, 'no rating before a rated game; games are taken oldest first');
}

const avg = (xs) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : '-');
console.log(`games: ${GAMES} analysed in ${analyzeMs} ms; reviewed in ${reviewMs} ms (max ${reviewMax} ms per game)`);
for (const [k, rs] of Object.entries(byStyle)) {
  const c = { inaccuracy: 0, mistake: 0, blunder: 0 };
  for (const r of rs) for (const g of Object.keys(c)) c[g] += r.counts[g];
  const per = (x) => (rs.length ? (x / rs.length).toFixed(1) : '-');
  console.log(`  ${k.padEnd(7)} accuracy ${avg(rs.map((r) => r.acc).filter((x) => x != null))}%  decisions/game ${per(rs.reduce((t, r) => t + r.n, 0))}  per game: ${per(c.inaccuracy)} inaccuracies, ${per(c.mistake)} mistakes, ${per(c.blunder)} blunders  great Tricks ${per(rs.reduce((t, r) => t + r.great.length, 0))}`);
}
const ex = records.find((r) => r.review.marks.length);
if (ex) console.log('  e.g.', JSON.stringify(ex.review.marks[0]), '| moments', JSON.stringify(ex.moments).slice(0, 300));

// the Insights summary
const sum = summarize(records, [], 'all');
check(sum.n === records.filter((r) => r.over).length, 'summary counts every finished game');
check(sum.w + sum.l === sum.n, 'wins + losses');
check(sum.rivals.length > 0 && sum.cards.all.length > 0, 'rivals and cards');
const fr = summarize(records, [], 'friends'), bo = summarize(records, [], 'bots');
check(fr.n + bo.n === sum.n, 'friends + bots = all');
const su = summarize(records, [], 'all', 'ultra'), ss = summarize(records, [], 'all', 'standard');
check(su.n + ss.n === sum.n && su.n > 0 && ss.n > 0, `Ultra ${su.n} + standard ${ss.n} = all ${sum.n}`);
console.log(`Ultra games: ${su.n}, ${su.rate}% won, accuracy ${su.play.acc}%, mvp ${su.cards.mvp.map((c) => c.cid).join(', ')}`);
console.log(`summary: ${sum.n} games, ${sum.rate}% won, accuracy ${sum.play.acc}%, Energy ${sum.play.energy}% (bots ${sum.play.botEnergy}%), first ${sum.when.first.w}/${sum.when.first.n}, mvp ${sum.cards.mvp.map((c) => c.cid).join(', ')}`);
const night = nightAwards(Object.fromEntries(records.slice(0, 6).map((r, i) => [i + 1, roomResult(r)])));
check(night.people.reduce((t, P) => t + P.wins, 0) <= night.games && night.people.length >= 2, "night wins");
console.log('night:', JSON.stringify(night));

// drafts: a careful bot, the practice bots' noise, and a random picker, all graded
const dstyle = { careful: [], noisy: [], random: [] };
let draftMs = 0;
for (let d = 0; d < DRAFTS; d++) {
  const n = d % 2 ? 3 : 2;
  const seed = 5000 + d * 17;
  const style = ['careful', 'noisy', 'random'][d % 3];
  const ultra = (d >> 1) % 2 === 1;
  const rand = rng(seed);
  const picks = [];
  let st = replayDraft({ seed, n, ultra }, picks);
  while (!st.done) {
    const p = st.who;
    const cid = p === 0 && style === 'random' ? st.table[Math.floor(rand() * st.table.length)]
      : p === 0 && style === 'careful' ? botPick(st.table, st.pools[p], () => 0.5, 0)
        : botPick(st.table, st.pools[p], botRand(seed, st.round, p));
    picks.push({ p, k: st.round, cid });
    st = replayDraft({ seed, n, ultra }, picks);
  }
  const td = Date.now();
  const rv = reviewDraft({ seed, n, ultra }, picks, 0);
  check(!ultra || rv.pool.some((id) => ULTRA_IDS.has(id)), `draft ${d}: an Ultra draft's deck has Ultra cards`);
  draftMs += Date.now() - td;
  check(rv.done && rv.picks.length === 30, `draft ${d}: 30 picks reviewed`);
  check(style !== 'careful' || rv.score === 100, `draft ${d}: the bot's own picks score 100 (${rv.score})`);
  dstyle[style].push(rv);
}
console.log(`drafts: ${DRAFTS} reviewed in ${draftMs} ms`);
for (const [k, rs] of Object.entries(dstyle)) {
  const c = {};
  for (const r of rs) for (const [g, v] of Object.entries(r.counts)) c[g] = (c[g] || 0) + v;
  console.log(`  ${k.padEnd(8)} score ${avg(rs.map((r) => r.score))}  picks: ${Object.entries(c).map(([g, v]) => `${g} ${(v / rs.length).toFixed(1)}`).join(', ')}`);
}

console.log(`\n${oks} passed, ${fails} failed, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
process.exit(fails ? 1 : 0);
