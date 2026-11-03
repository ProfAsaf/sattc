// Engine tests: one scenario per card rule, then random-play fuzzing.
//   node tools/test-engine.mjs            all tests + 400 fuzz games
//   node tools/test-engine.mjs 3000       more fuzz games

import { newGame, apply, addCard, power, vitality, costOf, legalActions, replay, check } from '../js/engine.js';
import { STARTERS, CARDS } from '../js/cards.js';
import { cardList } from '../js/decks.js';

let pass = 0, fail = 0;
const failures = [];
function ok(cond, msg) { if (cond) pass++; else { fail++; failures.push(msg); } }
function eq(a, b, msg) { ok(a === b, `${msg}: expected ${b}, got ${a}`); }

// A blank mid-game position: A to act on turn 5 with `energy`, both at 20 Life.
function scene({ energy = 8, players = 2 } = {}) {
  const s = newGame({ seed: 7, players: Array.from({ length: players }, (_, i) => ({ name: 'ABC'[i], deck: [] })) });
  for (const P of s.players) { P.hand = []; P.mull = 'kept'; P.maxEnergy = energy; P.energy = energy; P.turns = 3; }
  Object.assign(s, { phase: 'main', turn: 5, active: 0, first: 1 });
  return s;
}
const A = 0, B = 1;
const act = (s, a) => { const r = apply(s, a); if (r.error) throw new Error(`${a.t} ${s.cards[a.uid]?.cid || ''}: ${r.error}`); return r.state; };
const play = (s, uid, extra = {}) => act(s, { t: 'play', p: s.active, uid, ...extra });
const hitP = (s, uid, p) => act(s, { t: 'attack', p: s.active, uid, target: { p } });
const hitC = (s, uid, t) => act(s, { t: 'attack', p: s.active, uid, target: { uid: t } });
const end = (s) => act(s, { t: 'end', p: s.active });
const zoneOf = (s, uid) => s.cards[uid].zone;
const deckOf = (s, p, n, cid = 'grave-rat') => { for (let i = 0; i < n; i++) addCard(s, cid, p, 'deck'); };

function test(name, fn) {
  try { fn(); } catch (e) { fail++; failures.push(`${name}: threw ${e.message}`); }
}

// ── Ember ───────────────────────────────────────────────────────────
test('Cinderling Last Breath', () => {
  let s = scene();
  const c = addCard(s, 'cinderling', A, 'board');
  const m = addCard(s, 'mossback', B, 'board');
  s = hitC(s, c.uid, m.uid);
  eq(zoneOf(s, c.uid), 'discard', 'Cinderling died');
  eq(s.players[B].life, 19, 'opponent took 1 from Last Breath');
  eq(s.cards[m.uid].dmg, 2, 'Mossback took 2');
});

test('Reckless Initiate hurts itself when attacking', () => {
  let s = scene();
  const r = addCard(s, 'reckless-initiate', A, 'board');
  s = hitP(s, r.uid, B);
  eq(s.players[B].life, 18, 'dealt 2');
  eq(s.cards[r.uid].dmg, 1, 'took 1');
});

test('Spark Runner has Rush', () => {
  let s = scene();
  const sr = addCard(s, 'spark-runner', A, 'hand');
  s = play(s, sr.uid);
  s = hitP(s, sr.uid, B);
  eq(s.players[B].life, 17, 'rushed for 3');
});

test('Feed the Flame with Last Breath', () => {
  let s = scene();
  const c = addCard(s, 'cinderling', A, 'board');
  const f = addCard(s, 'feed-the-flame', A, 'hand');
  s = play(s, f.uid, { sac: c.uid, target: { p: B } });
  eq(s.players[B].life, 15, '4 from Feed the Flame + 1 from Last Breath');
  eq(s.players[A].energy, 6, 'paid 2');
});

test('Ash Collector and Wildfire', () => {
  let s = scene();
  const ash = addCard(s, 'ash-collector', A, 'board');
  addCard(s, 'grave-rat', A, 'board');
  addCard(s, 'cinderling', A, 'board');
  const sp = addCard(s, 'street-recruit', B, 'board');
  deckOf(s, A, 5);
  const w = addCard(s, 'wildfire', A, 'hand');
  s = play(s, w.uid);
  eq(s.players[A].board.length, 1, 'only Ash Collector survives');
  eq(power(s, s.cards[ash.uid]), 5, 'Ash Collector +2 Power this turn');
  eq(zoneOf(s, sp.uid), 'discard', 'Street Recruit died');
  eq(s.players[B].life, 19, 'Cinderling burned for 1');
  eq(s.died, 3, 'three creatures died this turn');
  s = end(s);
  eq(power(s, s.cards[ash.uid]), 3, 'bonus gone next turn');
});

test('The Mountain Is Angry gets cheaper', () => {
  let s = scene({ energy: 3 });
  for (let i = 0; i < 4; i++) addCard(s, 'grave-rat', B, 'board');
  deckOf(s, B, 10);
  const w = addCard(s, 'wildfire', A, 'hand');
  const m = addCard(s, 'the-mountain-is-angry', A, 'hand');
  s.players[A].energy = 6;
  s = play(s, w.uid);
  eq(costOf(s, A, s.cards[m.uid]), 3, 'costs 3 after 4 deaths');
  s = play(s, m.uid, { target: { p: B } });
  eq(s.players[B].life, 13, '7 damage');
});

test('Phoenix returns next turn for 2', () => {
  let s = scene();
  const ph = addCard(s, 'phoenix-of-the-last-spark', A, 'board');
  const g = addCard(s, 'patient-giant', B, 'board');
  s = hitC(s, ph.uid, g.uid);
  eq(zoneOf(s, ph.uid), 'discard', 'Phoenix died');
  ok(apply(s, { t: 'phoenix', p: A, uid: ph.uid }).error, 'cannot return the same turn');
  s = end(s); s = end(s);
  s = act(s, { t: 'phoenix', p: A, uid: ph.uid });
  eq(zoneOf(s, ph.uid), 'hand', 'back in hand');
});

// ── Verdant ─────────────────────────────────────────────────────────
test('Wild Growth, Awaken, Little Gardener', () => {
  let s = scene();
  const mb = addCard(s, 'mossback', A, 'board');
  const lg = addCard(s, 'little-gardener', A, 'board');
  const wg = addCard(s, 'wild-growth', A, 'hand');
  const wg2 = addCard(s, 'wild-growth', A, 'hand');
  s = play(s, wg.uid, { target: { uid: mb.uid } });
  eq(power(s, s.cards[mb.uid]), 5, 'Mossback 5 Power');
  eq(s.players[A].life, 22, 'Awaken gained 2');
  eq(vitality(s, s.cards[lg.uid]), 4, 'Gardener grew');
  s = play(s, wg2.uid, { target: { uid: mb.uid } });
  eq(vitality(s, s.cards[lg.uid]), 4, 'Gardener only once per turn');
  eq(s.players[A].life, 22, 'Awaken only once');
});

test('Two Little Gardeners do not loop', () => {
  let s = scene();
  const g1 = addCard(s, 'little-gardener', A, 'board');
  const g2 = addCard(s, 'little-gardener', A, 'board');
  const m = addCard(s, 'mossback', A, 'board');
  const wg = addCard(s, 'wild-growth', A, 'hand');
  s = play(s, wg.uid, { target: { uid: m.uid } });
  ok(vitality(s, s.cards[g1.uid]) <= 5 && vitality(s, s.cards[g2.uid]) <= 5, 'finite growth');
});

test('Patient Giant grows when it survives', () => {
  let s = scene();
  const pg = addCard(s, 'patient-giant', B, 'board');
  const r = addCard(s, 'cinderling', A, 'board');
  s = hitC(s, r.uid, pg.uid);
  eq(power(s, s.cards[pg.uid]), 4, 'Giant +1 Power');
});

test('Seedling sacrifices itself to draw once grown', () => {
  let s = scene();
  const sd = addCard(s, 'seedling', A, 'board');
  deckOf(s, A, 5);
  s.cards[sd.uid].pV = 1;
  s = end(s); s = end(s);
  eq(zoneOf(s, sd.uid), 'discard', 'Seedling gone');
  eq(s.players[A].hand.length, 2, 'drew for turn and for Seedling');
});

test('Ancient Roots', () => {
  let s = scene({ energy: 4 });
  const ar = addCard(s, 'ancient-roots', A, 'hand');
  s = play(s, ar.uid);
  eq(s.players[A].maxEnergy, 5, 'max Energy 5');
});

test('The Forest Remembers gets cheaper', () => {
  let s = scene();
  const m = addCard(s, 'mossback', A, 'board');
  const g = addCard(s, 'patient-giant', A, 'board');
  s.cards[m.uid].grown = true; s.cards[g.uid].grown = true;
  const tf = addCard(s, 'the-forest-remembers', A, 'hand');
  eq(costOf(s, A, s.cards[tf.uid]), 5, '7 - 2 = 5');
});

test('Worldtree Stag', () => {
  let s = scene();
  const m = addCard(s, 'street-recruit', A, 'board');
  const st = addCard(s, 'worldtree-stag', A, 'hand');
  s = play(s, st.uid, { target: { uid: m.uid } });
  eq(vitality(s, s.cards[m.uid]), 4, 'Recruit +2/+2');
});

// ── Tide ────────────────────────────────────────────────────────────
test('Memory Diver and Forbidden Archivist', () => {
  let s = scene();
  addCard(s, 'forbidden-archivist', A, 'board');
  const d1 = addCard(s, 'grave-rat', A, 'deck'), d2 = addCard(s, 'wildfire', A, 'deck'), d3 = addCard(s, 'rally', A, 'deck');
  deckOf(s, A, 3, 'seedling');
  const md = addCard(s, 'memory-diver', A, 'hand');
  s = play(s, md.uid, { keep: d2.uid });
  eq(zoneOf(s, d2.uid), 'hand', 'kept Wildfire');
  eq(zoneOf(s, d1.uid), 'discard', 'Grave Rat discarded');
  eq(zoneOf(s, d3.uid), 'discard', 'Rally discarded');
  eq(s.players[A].life, 19, 'Archivist: lost 1');
  eq(s.players[A].hand.length, 2, 'Archivist drew once');
});

test('Curious Wisp puts a card on the bottom', () => {
  let s = scene();
  const top = addCard(s, 'wildfire', A, 'deck');
  deckOf(s, A, 3);
  const w = addCard(s, 'curious-wisp', A, 'hand');
  s = play(s, w.uid, { bottom: true });
  eq(s.players[A].deck[s.players[A].deck.length - 1], top.uid, 'Wildfire on the bottom');
});

test('Not Yet and tokens', () => {
  let s = scene();
  const sr = addCard(s, 'street-recruit', B, 'board');
  const sp = addCard(s, 'spirit', B, 'board');
  const n1 = addCard(s, 'not-yet', A, 'hand'), n2 = addCard(s, 'not-yet', A, 'hand');
  s = play(s, n1.uid, { target: { uid: sr.uid } });
  eq(zoneOf(s, sr.uid), 'hand', 'Recruit back in hand');
  s = play(s, n2.uid, { target: { uid: sp.uid } });
  eq(zoneOf(s, sp.uid), 'gone', 'token vanished');
});

test('Second Thought', () => {
  let s = scene();
  const keep = addCard(s, 'rally', A, 'hand');
  const t1 = addCard(s, 'wildfire', A, 'deck'), t2 = addCard(s, 'grave-rat', A, 'deck');
  const st = addCard(s, 'second-thought', A, 'hand');
  s = play(s, st.uid, { discard: t2.uid });
  eq(zoneOf(s, t1.uid), 'hand', 'drew Wildfire');
  eq(zoneOf(s, t2.uid), 'discard', 'discarded Grave Rat');
  eq(zoneOf(s, keep.uid), 'hand', 'kept Rally');
});

test('Mirror Mage discount', () => {
  let s = scene({ energy: 2 });
  addCard(s, 'mirror-mage', A, 'board');
  const r1 = addCard(s, 'rally', A, 'hand'), r2 = addCard(s, 'rally', A, 'hand');
  eq(costOf(s, A, s.cards[r1.uid]), 1, 'first cheap spell costs 1');
  s = play(s, r1.uid);
  eq(costOf(s, A, s.cards[r2.uid]), 2, 'second costs 2');
});

test('Countercurrent', () => {
  let s = scene();
  const cc = addCard(s, 'countercurrent', B, 'traps');
  const r = addCard(s, 'rally', A, 'hand');
  const w = addCard(s, 'wildfire', A, 'hand');
  addCard(s, 'grave-rat', A, 'board');
  s = play(s, r.uid);
  eq(zoneOf(s, cc.uid), 'discard', 'trap used up');
  eq(zoneOf(s, r.uid), 'discard', 'Rally canceled');
  eq(s.players[A].energy, 6, 'Rally cost still paid');
  const cc2 = addCard(s, 'countercurrent', B, 'traps');
  s = play(s, w.uid, { payTax: true });
  eq(s.players[A].energy, 1, 'paid 3 + 2');
  eq(s.players[A].board.length, 0, 'Wildfire resolved');
  eq(zoneOf(s, cc2.uid), 'discard', 'second trap used up');
  // setting your own trap
  let t = scene();
  const own = addCard(t, 'countercurrent', A, 'hand');
  t = play(t, own.uid);
  eq(zoneOf(t, own.uid), 'trap', 'set as a trap');
});

test('Deepwater Leviathan bounce is optional', () => {
  let s = scene();
  const l1 = addCard(s, 'deepwater-leviathan', A, 'hand');
  s = play(s, l1.uid);
  eq(s.players[A].board.length, 1, 'played with no target');
  const g = addCard(s, 'patient-giant', B, 'board');
  const l2 = addCard(s, 'deepwater-leviathan', A, 'hand');
  s.players[A].energy = 8;
  s = play(s, l2.uid, { target: { uid: g.uid } });
  eq(zoneOf(s, g.uid), 'hand', 'Giant bounced');
});

test('Perfect Recall', () => {
  let s = scene();
  const a = addCard(s, 'rally', A, 'discard'), b = addCard(s, 'wildfire', A, 'discard');
  addCard(s, 'grave-rat', A, 'discard');
  const pr = addCard(s, 'perfect-recall', A, 'hand');
  s = play(s, pr.uid, { picks: [a.uid, b.uid] });
  eq(s.players[A].hand.length, 2, 'two spells back');
});

// ── Umbral ──────────────────────────────────────────────────────────
test('Grave Rat mills two', () => {
  let s = scene();
  const gr = addCard(s, 'grave-rat', A, 'board');
  deckOf(s, A, 4, 'seedling');
  const m = addCard(s, 'mossback', B, 'board');
  s = hitC(s, gr.uid, m.uid);
  eq(s.players[A].discard.length, 3, 'rat + 2 milled');
});

test('Kindly Undertaker', () => {
  let s = scene();
  addCard(s, 'kindly-undertaker', A, 'board');
  const c = addCard(s, 'cinderling', A, 'board');
  const f = addCard(s, 'feed-the-flame', A, 'hand');
  s = play(s, f.uid, { sac: c.uid, target: { p: B } });
  eq(s.players[A].life, 21, 'gained 1');
});

test('Unearth and Echo', () => {
  let s = scene();
  const gr = addCard(s, 'grave-rat', A, 'discard');
  const u = addCard(s, 'unearth', A, 'discard');
  eq(costOf(s, A, s.cards[u.uid], 'discard'), 4, 'Echo cost 4');
  s = play(s, u.uid, { from: 'discard', pick: gr.uid });
  eq(zoneOf(s, gr.uid), 'hand', 'Rat back');
  eq(zoneOf(s, u.uid), 'exile', 'Unearth removed from the game');
});

test('Bonepicker and Death Is a Door get cheaper', () => {
  let s = scene();
  const bp = addCard(s, 'bonepicker', A, 'hand');
  const dd = addCard(s, 'death-is-a-door', A, 'hand');
  eq(costOf(s, A, s.cards[bp.uid]), 3, 'Bonepicker 3');
  const c = addCard(s, 'cinderling', A, 'board');
  const m = addCard(s, 'mossback', B, 'board');
  s = hitC(s, c.uid, m.uid);
  eq(costOf(s, A, s.cards[bp.uid]), 2, 'Bonepicker 2 after a death');
  eq(costOf(s, A, s.cards[dd.uid]), 3, 'Death Is a Door 3 after own death');
  s = play(s, dd.uid, { target: { uid: m.uid } });
  eq(zoneOf(s, m.uid), 'discard', 'Mossback destroyed');
});

test('Borrowed Time', () => {
  let s = scene();
  const c = addCard(s, 'cinderling', A, 'discard');
  const bt = addCard(s, 'borrowed-time', A, 'hand');
  deckOf(s, B, 3);
  s = play(s, bt.uid, { pick: c.uid });
  s = hitP(s, c.uid, B);
  eq(s.players[B].life, 18, 'attacked with Rush');
  s = end(s);
  eq(zoneOf(s, c.uid), 'discard', 'sacrificed at end of turn');
  eq(s.players[B].life, 17, 'Last Breath on the way out');
});

test('Something Beneath cost', () => {
  let s = scene();
  for (let i = 0; i < 5; i++) addCard(s, 'grave-rat', A, 'discard');
  const sb = addCard(s, 'something-beneath', A, 'hand');
  eq(costOf(s, A, s.cards[sb.uid]), 4, '6 - floor(5/2)');
  for (let i = 0; i < 9; i++) addCard(s, 'grave-rat', A, 'discard');
  eq(costOf(s, A, s.cards[sb.uid]), 2, 'minimum 2');
});

test('The One Who Came Back via Echo', () => {
  let s = scene();
  const o = addCard(s, 'the-one-who-came-back', A, 'discard');
  s = play(s, o.uid, { from: 'discard' });
  eq(s.players[B].life, 17, 'opponent loses 3');
  const d = addCard(s, 'death-is-a-door', B, 'hand');
  s = end(s);
  s = act(s, { t: 'play', p: B, uid: d.uid, target: { uid: o.uid } });
  eq(zoneOf(s, o.uid), 'exile', 'removed from the game');
});

// ── Radiant ─────────────────────────────────────────────────────────
test('Street Recruit Bond and Standard Keeper', () => {
  let s = scene();
  const sr = addCard(s, 'street-recruit', A, 'board');
  eq(power(s, s.cards[sr.uid]), 1, 'alone: 1');
  const sk = addCard(s, 'standard-keeper', A, 'board');
  eq(power(s, s.cards[sr.uid]), 3, 'Bond +1, Keeper +1');
  eq(power(s, s.cards[sk.uid]), 2, 'Keeper does not buff itself');
});

test('Guard', () => {
  let s = scene();
  const c = addCard(s, 'cinderling', A, 'board');
  const sh = addCard(s, 'shieldbearer', B, 'board');
  addCard(s, 'grave-rat', B, 'board');
  ok(apply(s, { t: 'attack', p: A, uid: c.uid, target: { p: B } }).error, 'cannot hit the player');
  s = hitC(s, c.uid, sh.uid);
  eq(s.cards[sh.uid].dmg, 2, 'hit the Shieldbearer');
});

test('Twin Souls and the board limit', () => {
  let s = scene();
  for (let i = 0; i < 6; i++) addCard(s, 'grave-rat', A, 'board');
  const t = addCard(s, 'twin-souls', A, 'hand');
  s = play(s, t.uid);
  eq(s.players[A].board.length, 7, 'only one Spirit fits');
});

test('Rally, Stand Together, Awaken from a one-turn boost', () => {
  let s = scene();
  const mb = addCard(s, 'mossback', A, 'board');
  for (let i = 0; i < 3; i++) addCard(s, 'grave-rat', A, 'board');
  deckOf(s, A, 3);
  const r = addCard(s, 'rally', A, 'hand');
  const st = addCard(s, 'stand-together', A, 'hand');
  s = play(s, r.uid);
  eq(s.players[A].life, 22, 'Mossback awakened by Rally');
  s = play(s, st.uid);
  eq(power(s, s.cards[mb.uid]), 5, '+2 Power this turn');
  eq(s.players[A].hand.length, 1, 'drew with 4 creatures');
});

test('Dawn Captain and A Thousand Lights', () => {
  let s = scene();
  const dc = addCard(s, 'dawn-captain', A, 'hand');
  s = play(s, dc.uid);
  eq(s.players[A].board.length, 3, 'Captain + 2 Spirits');
  s = end(s); s = end(s);
  const tl = addCard(s, 'a-thousand-lights', A, 'hand');
  s.players[A].energy = 8;
  s = play(s, tl.uid);
  eq(s.players[A].board.length, 7, 'board full');
  eq(vitality(s, s.cards[dc.uid]), 6, 'Captain +1/+1 permanently');
});

test('We Grow Together', () => {
  let s = scene();
  const ids = [0, 1, 2, 3].map(() => addCard(s, 'grave-rat', A, 'board').uid);
  const w = addCard(s, 'we-grow-together', A, 'hand');
  s = play(s, w.uid, { targets: ids.slice(0, 3) });
  eq(vitality(s, s.cards[ids[2]]), 3, 'third target grew');
  ok(check(scene(), { t: 'play', p: A, uid: 999, targets: [] }), 'bad card rejected');
});

// ── Two-faction ─────────────────────────────────────────────────────
test('Funeral Pyre', () => {
  let s = scene();
  const c = addCard(s, 'cinderling', A, 'board');
  const fp = addCard(s, 'funeral-pyre', A, 'hand');
  s = play(s, fp.uid, { sac: c.uid, target: { p: B } });
  eq(s.players[B].life, 16, '2 from the Pyre + Last Breath twice');
});

test('Lightning Theorist', () => {
  let s = scene();
  addCard(s, 'lightning-theorist', A, 'board');
  const r1 = addCard(s, 'rally', A, 'hand'), r2 = addCard(s, 'rally', A, 'hand');
  s = play(s, r1.uid); s = play(s, r2.uid);
  eq(s.players[B].life, 18, '2 damage on the second spell');
});

test('Apex Predator fights and grows', () => {
  let s = scene();
  const m = addCard(s, 'mossback', B, 'board');
  const ap = addCard(s, 'apex-predator', A, 'hand');
  ok(apply(s, { t: 'play', p: A, uid: ap.uid }).error, 'must fight when it can');
  s = play(s, ap.uid, { target: { uid: m.uid } });
  eq(zoneOf(s, m.uid), 'discard', 'Mossback died');
  eq(power(s, s.cards[ap.uid]), 7, 'grew +2/+2');
});

// ── Rules ───────────────────────────────────────────────────────────
test('Opening, Spark and first draw', () => {
  const deck = cardList(STARTERS[0].counts);
  let s = newGame({ seed: 42, players: [{ name: 'A', deck }, { name: 'B', deck }] });
  const first = s.first, second = 1 - first;
  eq(s.players[second].hand.length, 6, 'second player has 5 + Spark');
  s = act(s, { t: 'mulligan', p: first, redraw: true });
  s = act(s, { t: 'mulligan', p: second, redraw: false });
  eq(s.phase, 'main', 'game started');
  eq(s.players[first].hand.length, 5, 'first player skipped the draw');
  eq(s.players[first].energy, 1, '1 Energy on turn one');
  s = end(s);
  eq(s.players[second].hand.length, 7, 'second player drew');
  const spark = s.players[second].hand.find((u) => s.cards[u].cid === 'spark');
  s = play(s, spark);
  eq(s.players[second].energy, 2, 'Spark: +1 Energy');
});

test('Empty deck and full hand', () => {
  let s = scene();
  s = end(s);
  eq(s.players[B].life, 18, 'B lost 2 drawing from an empty deck');
  let t = scene();
  for (let i = 0; i < 10; i++) addCard(t, 'grave-rat', B, 'hand');
  const top = addCard(t, 'wildfire', B, 'deck');
  t = end(t);
  eq(zoneOf(t, top.uid), 'discard', 'eleventh card burned');
});

test('Three players: each opponent, elimination, turn order', () => {
  let s = scene({ players: 3 });
  s.players[2].life = 1;
  addCard(s, 'lightning-theorist', A, 'board');
  const r1 = addCard(s, 'rally', A, 'hand'), r2 = addCard(s, 'rally', A, 'hand');
  s = play(s, r1.uid); s = play(s, r2.uid);
  eq(s.players[1].life, 18, 'B took 2');
  ok(s.players[2].out, 'C is out');
  s = end(s);
  eq(s.active, 1, 'B is next');
  s = end(s);
  eq(s.active, 0, 'C is skipped');
});

test('Replay is deterministic', () => {
  const deck = cardList(STARTERS[1].counts);
  const setup = { seed: 99, players: [{ name: 'A', deck }, { name: 'B', deck: cardList(STARTERS[2].counts) }] };
  let s = newGame(setup);
  const actions = [];
  for (let k = 0; k < 120 && s.phase !== 'over'; k++) {
    const p = s.phase === 'mulligan' ? s.players.findIndex((P) => !P.mull) : s.active;
    const legal = legalActions(s, p);
    const a = legal[(k * 7919) % legal.length];
    actions.push(a);
    s = apply(s, a).state;
  }
  const r = replay(setup, actions);
  eq(JSON.stringify(r.players), JSON.stringify(s.players), 'same players after replay');
});

// ── fuzz: random legal play ─────────────────────────────────────────
function fuzz(games) {
  let crashes = 0, unfinished = 0, totalActions = 0;
  const decks = STARTERS.map((d) => cardList(d.counts));
  let seed = 1;
  for (let g = 0; g < games; g++) {
    const n = g % 4 === 3 ? 3 : 2;
    const players = Array.from({ length: n }, (_, i) => ({ name: `P${i}`, deck: decks[(g + i * 2) % decks.length] }));
    let s = newGame({ seed: seed++, players });
    let rand = g * 2654435761 >>> 0;
    const R = () => (rand = (Math.imul(rand, 1103515245) + 12345) >>> 0) / 4294967296;
    try {
      for (let k = 0; k < 2500 && s.phase !== 'over'; k++) {
        const p = s.phase === 'mulligan' ? s.players.findIndex((P) => !P.mull) : s.active;
        const legal = legalActions(s, p);
        if (!legal.length) throw new Error('no legal actions');
        const nonEnd = legal.filter((a) => a.t !== 'end');
        const a = nonEnd.length && R() < 0.85 ? nonEnd[Math.floor(R() * nonEnd.length)] : legal[legal.length - 1];
        const r = apply(s, a);
        if (r.error) throw new Error('legal action rejected: ' + r.error + ' ' + JSON.stringify(a));
        s = r.state;
        totalActions++;
        for (const P of s.players) {
          if (P.board.length > 7) throw new Error('board over 7');
          if (P.hand.length > 10) throw new Error('hand over 10');
          for (const z of ['hand', 'deck', 'discard', 'board', 'exile']) for (const u of P[z]) {
            const want = z === 'board' ? 'board' : z;
            if (s.cards[u].zone !== want) throw new Error(`zone mismatch ${s.cards[u].cid} in ${z} says ${s.cards[u].zone}`);
          }
          if (!Number.isFinite(P.life)) throw new Error('life not finite');
        }
      }
      if (s.phase !== 'over') unfinished++;
    } catch (e) {
      crashes++;
      if (crashes <= 5) failures.push(`fuzz game ${g}: ${e.message}`);
    }
  }
  ok(crashes === 0, `${crashes} fuzz games crashed`);
  return { games, crashes, unfinished, totalActions };
}

const games = Number(process.argv[2] || 400);
const t0 = Date.now();
const f = fuzz(games);
console.log(`scenario + invariant checks: ${pass} passed, ${fail} failed`);
console.log(`fuzz: ${f.games} random games, ${f.totalActions} actions, ${f.crashes} crashes, ${f.unfinished} unfinished, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
if (failures.length) { console.log('\nFAILURES:'); for (const m of failures) console.log(' - ' + m); process.exit(1); }
