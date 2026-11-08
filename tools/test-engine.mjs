// Engine tests: one scenario per card rule, then random-play fuzzing.
//   node tools/test-engine.mjs            all tests + 400 fuzz games
//   node tools/test-engine.mjs 3000       more fuzz games

import { newGame, apply, addCard, power, vitality, costOf, legalActions, replay, check, actor, hasKw, canAttack, canBlock, useOptions, champLevel, draw, needs } from '../js/engine.js';
import { BY_ID, RULES, STARTERS, ULTRA_STARTERS } from '../js/cards.js';
import { canAdd, cardList, validate } from '../js/decks.js';

let pass = 0, fail = 0;
const failures = [];
function ok(cond, msg) { if (cond) pass++; else { fail++; failures.push(msg); } }
function eq(a, b, msg) { ok(a === b, `${msg}: expected ${b}, got ${a}`); }

// A blank mid-game position: A to act on turn 5 with `energy`, everyone at 20 Life.
function scene({ energy = 8, players = 2 } = {}) {
  const s = newGame({ seed: 7, players: Array.from({ length: players }, (_, i) => ({ name: 'ABC'[i], deck: [] })) });
  for (const P of s.players) { P.hand = []; P.mull = 'kept'; P.maxEnergy = energy; P.energy = energy; P.turns = 3; }
  Object.assign(s, { phase: 'main', turn: 5, active: 0, first: 1 });
  return s;
}
const A = 0, B = 1;
const act = (s, a) => { const r = apply(s, a); if (r.error) throw new Error(`${a.t} ${s.cards[a.uid]?.cid || ''}: ${r.error}`); return r.state; };
const play = (s, uid, extra = {}) => act(s, { t: 'play', p: actor(s), uid, ...extra });
const attack = (s, att, d = B, hunt) => act(s, { t: 'attack', p: s.active, target: d, att: [].concat(att), ...(hunt ? { hunt } : {}) });
const block = (s, blocks) => act(s, { t: 'block', p: s.combat.d, blocks });
const pass_ = (s) => act(s, { t: 'pass', p: s.combat.prio });
// Finish a fight: choose blockers if asked, then everyone passes.
function fight(s, blocks = []) {
  if (s.phase === 'combat' && s.combat.step === 'block') s = block(s, blocks);
  for (let i = 0; i < 10 && s.phase === 'combat'; i++) s = pass_(s);
  return s;
}
const end = (s) => act(s, { t: 'end', p: s.active });
const zoneOf = (s, uid) => s.cards[uid].zone;
const deckOf = (s, p, n, cid = 'grave-rat') => { for (let i = 0; i < n; i++) addCard(s, cid, p, 'deck'); };
const err = (s, a) => apply(s, a).error;

function test(name, fn) {
  try { fn(); } catch (e) { fail++; failures.push(`${name}: threw ${e.message}`); }
}

// ── Combat rules ────────────────────────────────────────────────────
test('Unblocked attack, one attack a turn, summoning sickness', () => {
  let s = scene({ energy: 4 });
  const m = addCard(s, 'mossback', A, 'board');
  const fresh = addCard(s, 'lightweaver', A, 'hand');
  s = play(s, fresh.uid);
  ok(!canAttack(s, A, s.cards[fresh.uid]), 'new creature cannot attack');
  s = attack(s, m.uid);
  eq(s.phase, 'main', 'no blockers and no Tricks: the fight resolved at once');
  eq(s.players[B].life, 17, '3 damage');
  ok(s.cards[m.uid].ex, 'attacker is exhausted');
  ok(err(s, { t: 'attack', p: A, target: B, att: [m.uid] }), 'only one attack a turn');
});

test('Blocking, trading, and an exhausted creature cannot block', () => {
  let s = scene();
  const c = addCard(s, 'cinderling', A, 'board');
  const mb = addCard(s, 'mossback', B, 'board');
  const lw = addCard(s, 'lightweaver', A, 'board');
  deckOf(s, A, 3); deckOf(s, B, 3);
  s = attack(s, c.uid);
  eq(s.combat.step, 'block', 'B decides on blockers');
  eq(actor(s), B, 'it is B’s move');
  s = fight(s, [[mb.uid, c.uid]]);
  eq(zoneOf(s, c.uid), 'discard', 'Cinderling died');
  eq(s.players[B].life, 19, 'Last Breath burned B for 1');
  eq(s.cards[mb.uid].dmg, 2, 'Mossback took 2');
  s = end(s);
  // B attacks back; A's Lightweaver is ready, Mossback attacks.
  s = attack(s, mb.uid, A);
  eq(s.combat.step, 'block', 'A may block with Lightweaver');
  s = fight(s, []);
  eq(s.players[A].life, 17, 'A took 3');
  s = end(s);
  // Mossback attacked, so it is still exhausted on A's turn: it cannot block.
  ok(s.cards[mb.uid].ex, 'Mossback exhausted during A’s turn');
  s = attack(s, lw.uid);
  ok(s.phase === 'main' || !legalActions(s, B).some((a) => a.t === 'block' && a.blocks.length), 'nothing could block');
  s = fight(s);
  eq(s.players[B].life, 18, 'Lightweaver hit for 1');
});

test('A blocked attacker whose blocker vanished deals nothing', () => {
  let s = scene();
  const m = addCard(s, 'mossback', A, 'board');
  const lw = addCard(s, 'lightweaver', B, 'board');
  const sc = addCard(s, 'scorch', A, 'hand');
  s = attack(s, m.uid);
  s = block(s, [[lw.uid, m.uid]]);
  eq(actor(s), A, 'attacker answers first after blocks');
  s = play(s, sc.uid, { target: { uid: lw.uid } });
  s = fight(s);
  eq(zoneOf(s, lw.uid), 'discard', 'blocker scorched');
  eq(s.players[B].life, 20, 'no damage got through');
});

test('Only Tricks during a fight', () => {
  let s = scene();
  const m = addCard(s, 'mossback', A, 'board');
  addCard(s, 'lightweaver', B, 'board');
  const w = addCard(s, 'wildfire', B, 'hand');
  s = attack(s, m.uid);
  ok(err(s, { t: 'play', p: B, uid: w.uid }), 'Wildfire is not a Trick');
  ok(err(s, { t: 'end', p: A }), 'cannot end the turn mid-fight');
});

test('Energy carries over to opponents’ turns', () => {
  let s = scene({ energy: 3 });
  deckOf(s, B, 2);
  s = end(s);
  eq(s.players[A].energy, 3, 'A kept 3 Energy for Tricks');
});

test('Swift and Overrun with Venom', () => {
  let s = scene();
  const k = addCard(s, 'dawnwatch-knight', A, 'board');
  const ar = addCard(s, 'canopy-archer', B, 'board');
  s = attack(s, k.uid);
  s = fight(s, [[ar.uid, k.uid]]);
  eq(zoneOf(s, ar.uid), 'discard', 'Swift killed the 2/2 first');
  eq(s.cards[k.uid].dmg, 0, 'and took nothing back');
  ok(!s.cards[k.uid].ex, 'Watchful: still ready');
  let t = scene();
  const ch = addCard(t, 'ironhide-charger', A, 'board', { tKw: ['venom'] });
  const mb = addCard(t, 'mossback', B, 'board');
  t = attack(t, ch.uid);
  t = fight(t, [[mb.uid, ch.uid]]);
  eq(zoneOf(t, mb.uid), 'discard', 'Venom killed the blocker with 1');
  eq(t.players[B].life, 17, '3 overran');
});

// ── Ember ───────────────────────────────────────────────────────────
test('Reckless Initiate hurts itself when attacking', () => {
  let s = scene();
  const r = addCard(s, 'reckless-initiate', A, 'board');
  s = fight(attack(s, r.uid));
  eq(s.players[B].life, 18, 'dealt 2');
  eq(s.cards[r.uid].dmg, 1, 'took 1');
});

test('Spark Runner has Rush', () => {
  let s = scene();
  const sr = addCard(s, 'spark-runner', A, 'hand');
  s = play(s, sr.uid);
  s = attack(s, sr.uid);
  eq(s.players[B].life, 17, 'rushed for 3');
});

test('Feed the Flame with Last Breath, and The Kiln', () => {
  let s = scene();
  const c = addCard(s, 'cinderling', A, 'board');
  const f = addCard(s, 'feed-the-flame', A, 'hand');
  s = play(s, f.uid, { sac: c.uid, target: { p: B } });
  eq(s.players[B].life, 15, '4 from Feed the Flame + 1 from Last Breath');
  eq(s.players[A].energy, 6, 'paid 2');
  let t = scene();
  addCard(t, 'the-kiln', A, 'relics');
  const c2 = addCard(t, 'cinderling', A, 'board');
  const f2 = addCard(t, 'feed-the-flame', A, 'hand');
  t = play(t, f2.uid, { sac: c2.uid, target: { p: B } });
  eq(t.players[B].life, 14, 'plus 1 from The Kiln');
});

test('Ash Collector and Wildfire', () => {
  let s = scene();
  const ash = addCard(s, 'ash-collector', A, 'board');
  addCard(s, 'grave-rat', A, 'board');
  addCard(s, 'cinderling', A, 'board');
  const sp = addCard(s, 'street-recruit', B, 'board');
  deckOf(s, A, 5); deckOf(s, B, 5);
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

test('Phoenix: Soar, Reach, and returning next turn', () => {
  let s = scene();
  const ph = addCard(s, 'phoenix-of-the-last-spark', A, 'board');
  const mb = addCard(s, 'mossback', B, 'board');
  const g = addCard(s, 'patient-giant', B, 'board');
  deckOf(s, A, 3); deckOf(s, B, 3);
  s = attack(s, ph.uid);
  ok(err(s, { t: 'block', p: B, blocks: [[mb.uid, ph.uid]] }), 'Mossback cannot block a flier');
  s = fight(s, [[g.uid, ph.uid]]);
  eq(zoneOf(s, ph.uid), 'discard', 'Phoenix died to the Giant');
  eq(power(s, s.cards[g.uid]), 4, 'Patient Giant survived and grew');
  ok(err(s, { t: 'phoenix', p: A, uid: ph.uid }), 'cannot return the same turn');
  s = end(s); s = end(s);
  s = act(s, { t: 'phoenix', p: A, uid: ph.uid });
  eq(zoneOf(s, ph.uid), 'hand', 'back in hand');
});

test('Scorch and Kindle', () => {
  let s = scene();
  const lw = addCard(s, 'lightweaver', B, 'board');
  const sc = addCard(s, 'scorch', A, 'hand');
  s = play(s, sc.uid, { target: { uid: lw.uid } });
  eq(zoneOf(s, lw.uid), 'discard', 'Scorch killed a 1/2');
  let t = scene();
  const a1 = addCard(t, 'canopy-archer', A, 'board');
  const b1 = addCard(t, 'canopy-archer', B, 'board');
  const kd = addCard(t, 'kindle', A, 'hand');
  t = attack(t, a1.uid);
  t = block(t, [[b1.uid, a1.uid]]);
  t = play(t, kd.uid, { target: { uid: a1.uid } });
  t = fight(t);
  eq(zoneOf(t, b1.uid), 'discard', 'Kindled archer struck first');
  eq(t.cards[a1.uid].dmg, 0, 'and was not hit back');
});

test('Ember Duelist hunts', () => {
  let s = scene();
  const d = addCard(s, 'ember-duelist', A, 'board');
  const lw = addCard(s, 'lightweaver', B, 'board');
  const sh = addCard(s, 'shieldbearer', B, 'board');
  s = attack(s, d.uid, B, [[d.uid, lw.uid]]);
  ok(err(s, { t: 'block', p: B, blocks: [[sh.uid, d.uid]] }), 'the hunted creature must block');
  ok(err(s, { t: 'block', p: B, blocks: [] }), 'it cannot stay back');
  s = fight(s, [[lw.uid, d.uid]]);
  eq(zoneOf(s, lw.uid), 'discard', 'prey killed');
  eq(s.cards[d.uid].dmg, 0, 'Swift: no damage back');
});

test('Mutiny and Bone Altar', () => {
  let s = scene();
  const mu = addCard(s, 'mutiny', A, 'hand');
  const alt = addCard(s, 'bone-altar', A, 'relics');
  const mb = addCard(s, 'mossback', B, 'board');
  deckOf(s, A, 3);
  s = play(s, mu.uid, { target: { uid: mb.uid } });
  eq(s.cards[mb.uid].ctrl, A, 'A controls Mossback');
  s = fight(attack(s, mb.uid));
  eq(s.players[B].life, 17, 'B hit by their own Mossback');
  s = act(s, { t: 'use', p: A, uid: alt.uid, sac: mb.uid });
  eq(zoneOf(s, mb.uid), 'discard', 'sacrificed');
  ok(s.players[B].discard.includes(mb.uid), 'into its owner’s discard pile');
  eq(s.players[A].hand.length, 1, 'A drew');
  let t = scene();
  const mu2 = addCard(t, 'mutiny', A, 'hand');
  const mb2 = addCard(t, 'mossback', B, 'board');
  deckOf(t, B, 2);
  t = play(t, mu2.uid, { target: { uid: mb2.uid } });
  t = end(t);
  eq(t.cards[mb2.uid].ctrl, B, 'it goes home at the end of the turn');
});

test('Molten Berserker cannot block', () => {
  let s = scene();
  const c = addCard(s, 'cinderling', A, 'board');
  addCard(s, 'molten-berserker', B, 'board');
  s = attack(s, c.uid);
  eq(s.phase, 'main', 'nobody could block');
  eq(s.players[B].life, 18, 'hit for 2');
});

test('Smoldering Golem goes out with a bang', () => {
  let s = scene();
  const g = addCard(s, 'smoldering-golem', A, 'board');
  const lw = addCard(s, 'lightweaver', B, 'board');
  const mb = addCard(s, 'mossback', B, 'board');
  const dd = addCard(s, 'death-is-a-door', A, 'hand');
  s = play(s, dd.uid, { target: { uid: g.uid } });
  eq(zoneOf(s, lw.uid), 'discard', 'Lightweaver burned');
  eq(s.cards[mb.uid].dmg, 2, 'Mossback took 2');
  eq(s.players[B].life, 18, 'B took 2');
});

test('Ashmaw breathes before blockers', () => {
  let s = scene();
  const as = addCard(s, 'ashmaw', A, 'board');
  const sp = addCard(s, 'spirit', B, 'board');
  const lw = addCard(s, 'lightweaver', B, 'board');
  const mb = addCard(s, 'mossback', B, 'board');
  s = fight(attack(s, as.uid));
  eq(zoneOf(s, sp.uid), 'gone', 'Spirit burned away');
  eq(zoneOf(s, lw.uid), 'discard', 'Lightweaver burned');
  eq(s.cards[mb.uid].dmg, 2, 'Mossback singed');
  eq(s.players[B].life, 14, 'nothing could block the dragon');
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

test('Two Little Gardeners and Grandmother Bramble do not loop', () => {
  let s = scene();
  const g1 = addCard(s, 'little-gardener', A, 'board');
  const g2 = addCard(s, 'little-gardener', A, 'board');
  addCard(s, 'grandmother-bramble', A, 'board');
  const m = addCard(s, 'mossback', A, 'board');
  const wg = addCard(s, 'wild-growth', A, 'hand');
  s = play(s, wg.uid, { target: { uid: m.uid } });
  ok(vitality(s, s.cards[g1.uid]) <= 7 && vitality(s, s.cards[g2.uid]) <= 7, 'finite growth');
  eq(power(s, s.cards[m.uid]), 6, 'Mossback +2 and +1 more from Bramble');
});

test('Grandmother Bramble with one Gardener', () => {
  let s = scene();
  addCard(s, 'grandmother-bramble', A, 'board');
  const lg = addCard(s, 'little-gardener', A, 'board');
  const m = addCard(s, 'mossback', A, 'board');
  const wg = addCard(s, 'wild-growth', A, 'hand');
  s = play(s, wg.uid, { target: { uid: m.uid } });
  eq(vitality(s, s.cards[m.uid]), 7, 'Mossback 4 + 2 + 1');
  eq(vitality(s, s.cards[lg.uid]), 5, 'Gardener 3 + 1 + 1');
});

test('Seedling sacrifices itself to draw once grown', () => {
  let s = scene();
  const sd = addCard(s, 'seedling', A, 'board');
  deckOf(s, A, 5); deckOf(s, B, 5);
  s.cards[sd.uid].pV = 1;
  s = end(s); s = end(s);
  eq(zoneOf(s, sd.uid), 'discard', 'Seedling gone');
  eq(s.players[A].hand.length, 2, 'drew for turn and for Seedling');
});

test('Ancient Roots and Grove Druid', () => {
  let s = scene({ energy: 4 });
  const ar = addCard(s, 'ancient-roots', A, 'hand');
  s = play(s, ar.uid);
  eq(s.players[A].maxEnergy, 5, 'max Energy 5');
  const gd = addCard(s, 'grove-druid', A, 'hand');
  s.players[A].energy = 4;
  s = play(s, gd.uid);
  eq(s.players[A].maxEnergy, 6, 'Druid ramped');
  const be = addCard(s, 'beacon-of-hope', B, 'relics');
  const gd2 = addCard(s, 'grove-druid', A, 'hand');
  s.players[A].energy = 4;
  s = play(s, gd2.uid, { target: { uid: be.uid } });
  eq(zoneOf(s, be.uid), 'discard', 'Relic destroyed');
  eq(s.players[A].maxEnergy, 6, 'no ramp that time');
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

test('Sudden Growth while blocking', () => {
  let s = scene();
  const mb = addCard(s, 'mossback', A, 'board');
  const lw = addCard(s, 'lightweaver', B, 'board');
  const sg = addCard(s, 'sudden-growth', B, 'hand');
  s = attack(s, mb.uid);
  s = play(s, sg.uid, { target: { uid: lw.uid } });
  eq(actor(s), B, 'B still chooses blockers');
  s = fight(s, [[lw.uid, mb.uid]]);
  eq(zoneOf(s, mb.uid), 'discard', 'the 4/5 Lightweaver killed Mossback');
  eq(zoneOf(s, lw.uid), 'board', 'and survived');
});

test('Canopy Archer reaches a Cloud Ray', () => {
  let s = scene();
  const ray = addCard(s, 'cloud-ray', A, 'board');
  const ca = addCard(s, 'canopy-archer', B, 'board');
  const mb = addCard(s, 'mossback', B, 'board');
  s = attack(s, ray.uid);
  ok(err(s, { t: 'block', p: B, blocks: [[mb.uid, ray.uid]] }), 'no Reach, no block');
  s = fight(s, [[ca.uid, ray.uid]]);
  eq(zoneOf(s, ray.uid), 'discard', 'Ray shot down');
});

test('Savage Clash and Heartwood Totem', () => {
  let s = scene();
  const mb = addCard(s, 'mossback', A, 'board');
  const lw = addCard(s, 'lightweaver', B, 'board');
  const sc = addCard(s, 'savage-clash', A, 'hand');
  s = play(s, sc.uid, { fighter: mb.uid, target: { uid: lw.uid } });
  eq(zoneOf(s, lw.uid), 'discard', 'Lightweaver lost the fight');
  eq(s.cards[mb.uid].dmg, 1, 'Mossback took 1');
  let t = scene();
  addCard(t, 'heartwood-totem', A, 'relics');
  addCard(t, 'mossback', A, 'board');
  const small = addCard(t, 'lightweaver', A, 'board');
  deckOf(t, A, 3); deckOf(t, B, 3);
  t = end(t); t = end(t);
  eq(power(t, t.cards[small.uid]), 2, 'smallest creature grew');
});

test('Ironhide Charger hunts and overruns; Stampede', () => {
  let s = scene();
  const ch = addCard(s, 'ironhide-charger', A, 'board');
  const lw = addCard(s, 'lightweaver', B, 'board');
  addCard(s, 'mossback', B, 'board');
  s = attack(s, ch.uid, B, [[ch.uid, lw.uid]]);
  s = fight(s, [[lw.uid, ch.uid]]);
  eq(zoneOf(s, lw.uid), 'discard', 'prey trampled');
  eq(s.players[B].life, 18, '2 overran');
  let t = scene();
  const a1 = addCard(t, 'canopy-archer', A, 'board');
  const a2 = addCard(t, 'lightweaver', A, 'board');
  const sp = addCard(t, 'spirit', B, 'board');
  const st = addCard(t, 'stampede', A, 'hand');
  t = attack(t, [a1.uid, a2.uid]);
  t = block(t, [[sp.uid, a1.uid]]);
  t = play(t, st.uid);
  t = fight(t);
  eq(t.players[B].life, 14, '3 overran the Spirit, 3 unblocked');
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

test('Not Yet: mid-fight, on tokens, on Relics', () => {
  let s = scene();
  const mb = addCard(s, 'mossback', A, 'board');
  addCard(s, 'lightweaver', B, 'board');
  const ny = addCard(s, 'not-yet', B, 'hand');
  s = attack(s, mb.uid);
  s = play(s, ny.uid, { target: { uid: mb.uid } });
  eq(zoneOf(s, mb.uid), 'hand', 'attacker sent home');
  eq(s.phase, 'main', 'the fight is over');
  eq(s.players[B].life, 20, 'no damage');
  let t = scene();
  const sp = addCard(t, 'spirit', B, 'board');
  const ht = addCard(t, 'heartwood-totem', B, 'relics');
  const n1 = addCard(t, 'not-yet', A, 'hand'), n2 = addCard(t, 'not-yet', A, 'hand');
  t = play(t, n1.uid, { target: { uid: sp.uid } });
  eq(zoneOf(t, sp.uid), 'gone', 'token vanished');
  t = play(t, n2.uid, { target: { uid: ht.uid } });
  eq(zoneOf(t, ht.uid), 'hand', 'Relic back in hand');
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
  let t = scene();
  const own = addCard(t, 'countercurrent', A, 'hand');
  t = play(t, own.uid);
  eq(zoneOf(t, own.uid), 'trap', 'set as a trap');
});

test('Riptide sends the biggest attacker home', () => {
  let s = scene();
  const rt = addCard(s, 'riptide', B, 'traps');
  const lw = addCard(s, 'lightweaver', A, 'board');
  const mb = addCard(s, 'mossback', A, 'board');
  s = attack(s, [lw.uid, mb.uid]);
  eq(zoneOf(s, mb.uid), 'hand', 'Mossback washed back');
  eq(zoneOf(s, rt.uid), 'discard', 'trap used');
  eq(s.players[B].life, 19, 'Lightweaver still hit');
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

test('Sea Change', () => {
  let s = scene();
  const ch = addCard(s, 'ironhide-charger', B, 'board', { pP: 2, pV: 2 });
  const sc = addCard(s, 'sea-change', A, 'hand');
  s = play(s, sc.uid, { target: { uid: ch.uid } });
  eq(s.cards[ch.uid].cid, 'fish', 'it is a Fish');
  eq(power(s, s.cards[ch.uid]), 1, '1 Power');
  ok(!hasKw(s, s.cards[ch.uid], 'overrun'), 'no Overrun');
  const sc2 = addCard(s, 'scorch', A, 'hand');
  s = play(s, sc2.uid, { target: { uid: ch.uid } });
  eq(s.cards[ch.uid].cid, 'ironhide-charger', 'back to itself in the discard pile');
  eq(zoneOf(s, ch.uid), 'discard', 'dead');
});

test('Windborne Sage, Brook Hydra', () => {
  let s = scene();
  const hy = addCard(s, 'brook-hydra', A, 'board');
  deckOf(s, A, 3);
  const ws = addCard(s, 'windborne-sage', A, 'hand');
  s = play(s, ws.uid);
  eq(s.players[A].hand.length, 1, 'drew a card');
  eq(power(s, s.cards[hy.uid]), 2, 'Hydra grew');
});

test('Tidal Mimic copies', () => {
  let s = scene();
  const g = addCard(s, 'patient-giant', B, 'board');
  const tm = addCard(s, 'tidal-mimic', A, 'hand');
  s = play(s, tm.uid, { target: { uid: g.uid } });
  eq(s.cards[tm.uid].cid, 'patient-giant', 'a second Giant');
  eq(vitality(s, s.cards[tm.uid]), 6, '6 Vitality');
  ok(hasKw(s, s.cards[tm.uid], 'reach'), 'with Reach');
  const dd = addCard(s, 'death-is-a-door', A, 'hand');
  s.players[A].energy = 8;
  s = play(s, dd.uid, { target: { uid: tm.uid } });
  eq(s.cards[tm.uid].cid, 'tidal-mimic', 'a Mimic again in the discard pile');
});

test('The Drowned Clock strikes three', () => {
  let s = scene();
  const dc = addCard(s, 'the-drowned-clock', A, 'relics');
  deckOf(s, A, 6); deckOf(s, B, 6);
  for (let k = 0; k < 4; k++) s = end(s);
  eq(s.cards[dc.uid].chimes, 2, 'two chimes');
  eq(s.players[B].life, 20, 'not yet');
  s = end(s); s = end(s);
  eq(s.players[B].life, 14, 'B lost 6');
  eq(s.cards[dc.uid].chimes, 0, 'count starts over');
});

test('One More Wave', () => {
  let s = scene();
  deckOf(s, A, 3);
  const ow = addCard(s, 'one-more-wave', A, 'hand');
  s = play(s, ow.uid);
  const t0 = s.turn;
  s = end(s);
  eq(s.active, A, 'A again');
  eq(s.turn, t0 + 1, 'a new turn');
  s = end(s);
  eq(s.active, B, 'then B');
});

test('Nerissa takes a creature for good', () => {
  let s = scene();
  const mb = addCard(s, 'mossback', B, 'board');
  const st = addCard(s, 'worldtree-stag', B, 'board');
  const ne = addCard(s, 'nerissa', A, 'hand');
  ok(err(s, { t: 'play', p: A, uid: ne.uid, target: { uid: st.uid } }), 'the Stag costs too much');
  s = play(s, ne.uid, { target: { uid: mb.uid } });
  eq(s.cards[mb.uid].ctrl, A, 'Mossback is A’s');
  ok(!canAttack(s, A, s.cards[mb.uid]), 'not this turn');
  deckOf(s, A, 2); deckOf(s, B, 2);
  s = end(s); s = end(s);
  eq(s.cards[mb.uid].ctrl, A, 'still A’s');
});

// ── Umbral ──────────────────────────────────────────────────────────
test('Grave Rat: Venom and Last Breath', () => {
  let s = scene();
  const mb = addCard(s, 'mossback', A, 'board');
  const gr = addCard(s, 'grave-rat', B, 'board');
  deckOf(s, B, 4, 'seedling');
  s = attack(s, mb.uid);
  s = fight(s, [[gr.uid, mb.uid]]);
  eq(zoneOf(s, mb.uid), 'discard', 'Venom killed Mossback');
  eq(s.players[B].discard.length, 3, 'rat + 2 milled');
});

test('Kindly Undertaker and The Pale Abbess', () => {
  let s = scene();
  addCard(s, 'kindly-undertaker', A, 'board');
  addCard(s, 'the-pale-abbess', A, 'board');
  const c = addCard(s, 'cinderling', A, 'board');
  const f = addCard(s, 'feed-the-flame', A, 'hand');
  s = play(s, f.uid, { sac: c.uid, target: { p: B } });
  eq(s.players[A].life, 21, 'gained 1');
  eq(s.players[B].life, 14, '4 + 1 Last Breath + 1 Abbess');
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

test('Bonepicker and Death Is a Door get cheaper; Door hits Relics', () => {
  let s = scene();
  const bp = addCard(s, 'bonepicker', A, 'hand');
  const dd = addCard(s, 'death-is-a-door', A, 'hand');
  eq(costOf(s, A, s.cards[bp.uid]), 3, 'Bonepicker 3');
  const c = addCard(s, 'cinderling', A, 'board');
  const m = addCard(s, 'mossback', B, 'board');
  s = attack(s, c.uid);
  s = fight(s, [[m.uid, c.uid]]);
  eq(costOf(s, A, s.cards[bp.uid]), 2, 'Bonepicker 2 after a death');
  eq(costOf(s, A, s.cards[dd.uid]), 3, 'Death Is a Door 3 after own death');
  s = play(s, dd.uid, { target: { uid: m.uid } });
  eq(zoneOf(s, m.uid), 'discard', 'Mossback destroyed');
  let t = scene();
  const be = addCard(t, 'beacon-of-hope', B, 'relics');
  const d2 = addCard(t, 'death-is-a-door', A, 'hand');
  t = play(t, d2.uid, { target: { uid: be.uid } });
  eq(zoneOf(t, be.uid), 'discard', 'Relic destroyed');
});

test('Borrowed Time', () => {
  let s = scene();
  const c = addCard(s, 'cinderling', A, 'discard');
  const bt = addCard(s, 'borrowed-time', A, 'hand');
  deckOf(s, B, 3);
  s = play(s, bt.uid, { pick: c.uid });
  s = attack(s, c.uid);
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

test('Kiss of Night on a chump blocker', () => {
  let s = scene();
  const st = addCard(s, 'worldtree-stag', A, 'board');
  const sp = addCard(s, 'spirit', B, 'board');
  const kn = addCard(s, 'kiss-of-night', B, 'hand');
  s = attack(s, st.uid);
  s = play(s, kn.uid, { target: { uid: sp.uid } });
  s = fight(s, [[sp.uid, st.uid]]);
  eq(zoneOf(s, st.uid), 'discard', 'the Stag died to Venom');
  eq(s.players[B].life, 21, 'Drain gained 1');
});

test('Vesper Bat drains; Hungry Ghoul feeds', () => {
  let s = scene();
  const vb = addCard(s, 'vesper-bat', A, 'board');
  s = fight(attack(s, vb.uid));
  eq(s.players[B].life, 19, 'hit for 1');
  eq(s.players[A].life, 21, 'drained 1');
  let t = scene();
  const hg = addCard(t, 'hungry-ghoul', A, 'board');
  const x = addCard(t, 'lightweaver', B, 'board'), y = addCard(t, 'spirit', B, 'board');
  for (const v of [x, y]) { const sc = addCard(t, 'scorch', A, 'hand'); t = play(t, sc.uid, { target: { uid: v.uid } }); }
  eq(power(t, t.cards[hg.uid]), 4, 'Ghoul +2/+2');
});

test('Bone Altar once a turn', () => {
  let s = scene();
  const alt = addCard(s, 'bone-altar', A, 'relics');
  const a1 = addCard(s, 'spirit', A, 'board'), a2 = addCard(s, 'spirit', A, 'board');
  deckOf(s, A, 3);
  s = act(s, { t: 'use', p: A, uid: alt.uid, sac: a1.uid });
  eq(s.players[A].hand.length, 1, 'drew');
  ok(err(s, { t: 'use', p: A, uid: alt.uid, sac: a2.uid }), 'once a turn');
});

test('The Culling', () => {
  let s = scene();
  const mb = addCard(s, 'mossback', A, 'board');
  const lw = addCard(s, 'lightweaver', A, 'board');
  const ca = addCard(s, 'canopy-archer', B, 'board');
  const ch = addCard(s, 'ironhide-charger', B, 'board');
  const cu = addCard(s, 'the-culling', A, 'hand');
  s = play(s, cu.uid);
  eq(zoneOf(s, mb.uid), 'board', 'Mossback spared');
  eq(zoneOf(s, ch.uid), 'board', 'Charger spared');
  eq(zoneOf(s, lw.uid), 'discard', 'Lightweaver culled');
  eq(zoneOf(s, ca.uid), 'discard', 'Archer culled');
});

test('Carrion Wyrm vs Gloomweb Spider', () => {
  let s = scene();
  const wy = addCard(s, 'carrion-wyrm', A, 'board');
  const gs = addCard(s, 'gloomweb-spider', B, 'board');
  s = attack(s, wy.uid);
  s = fight(s, [[gs.uid, wy.uid]]);
  eq(zoneOf(s, wy.uid), 'discard', 'Venom spider killed the Wyrm');
  eq(zoneOf(s, gs.uid), 'discard', 'and died to its Venom');
});

test('The Barrow Queen raids another discard pile', () => {
  let s = scene();
  const st = addCard(s, 'worldtree-stag', B, 'discard');
  const q = addCard(s, 'the-barrow-queen', A, 'hand');
  s = play(s, q.uid, { pick: st.uid });
  eq(s.cards[st.uid].ctrl, A, 'the Stag fights for A');
  eq(s.cards[st.uid].owner, B, 'still B’s card');
  s.players[A].energy = 8;
  const dd = addCard(s, 'death-is-a-door', A, 'hand');
  s = play(s, dd.uid, { target: { uid: st.uid } });
  ok(s.players[B].discard.includes(st.uid), 'back to B’s discard pile');
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

test('Guard blocks two', () => {
  let s = scene();
  const a1 = addCard(s, 'lightweaver', A, 'board');
  const a2 = addCard(s, 'canopy-archer', A, 'board');
  const sh = addCard(s, 'shieldbearer', B, 'board');
  const sp = addCard(s, 'spirit', B, 'board');
  s = attack(s, [a1.uid, a2.uid]);
  ok(err(s, { t: 'block', p: B, blocks: [[sp.uid, a1.uid], [sp.uid, a2.uid]] }), 'a Spirit blocks only one');
  s = fight(s, [[sh.uid, a1.uid], [sh.uid, a2.uid]]);
  eq(s.cards[sh.uid].dmg, 3, 'Shieldbearer took 1 + 2');
  eq(zoneOf(s, sh.uid), 'board', 'and held');
  eq(s.cards[a1.uid].dmg, 1, 'hit back');
  eq(s.cards[a2.uid].dmg, 1, 'both');
  eq(s.players[B].life, 20, 'nothing got through');
});

test('Twin Souls as an ambush; Ambush at Dawn', () => {
  let s = scene();
  const mb = addCard(s, 'mossback', A, 'board');
  const ts = addCard(s, 'twin-souls', B, 'hand');
  s = attack(s, mb.uid);
  eq(s.combat?.step, 'block', 'B holds a Trick, so B gets to answer');
  s = play(s, ts.uid);
  const sp = s.players[B].board[0];
  s = fight(s, [[sp, mb.uid]]);
  eq(s.players[B].life, 20, 'the Spirit took the hit');
  let t = scene();
  const ad = addCard(t, 'ambush-at-dawn', B, 'traps');
  const mb2 = addCard(t, 'mossback', A, 'board');
  t = attack(t, mb2.uid);
  eq(zoneOf(t, ad.uid), 'discard', 'trap sprang');
  eq(t.players[B].board.length, 2, 'two Spirits');
  t = fight(t, [[t.players[B].board[0], mb2.uid]]);
  eq(t.players[B].life, 20, 'blocked by a fresh Spirit');
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

test('Dawn Captain, Watchful, A Thousand Lights', () => {
  let s = scene();
  deckOf(s, A, 3); deckOf(s, B, 3);
  const dc = addCard(s, 'dawn-captain', A, 'hand');
  s = play(s, dc.uid);
  eq(s.players[A].board.length, 3, 'Captain + 2 Spirits');
  s = end(s); s = end(s);
  s = attack(s, dc.uid);
  ok(!s.cards[dc.uid].ex, 'Watchful: not exhausted');
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

test('Bastion and Dawn’s Judgment', () => {
  let s = scene();
  const mb = addCard(s, 'mossback', A, 'board');
  const lw = addCard(s, 'lightweaver', B, 'board');
  const ba = addCard(s, 'bastion', B, 'hand');
  s = attack(s, mb.uid);
  s = play(s, ba.uid, { target: { uid: lw.uid } });
  s = fight(s, [[lw.uid, mb.uid]]);
  eq(zoneOf(s, lw.uid), 'board', 'the 2/5 Lightweaver held');
  let t = scene();
  const st = addCard(t, 'worldtree-stag', A, 'board');
  const dj = addCard(t, 'dawns-judgment', B, 'hand');
  ok(err(t, { t: 'play', p: B, uid: dj.uid, target: { uid: st.uid } }), 'only during a fight');
  t = attack(t, st.uid);
  t = play(t, dj.uid, { target: { uid: st.uid } });
  eq(zoneOf(t, st.uid), 'discard', 'attacker destroyed');
  eq(t.phase, 'main', 'fight over');
  eq(t.players[B].life, 20, 'no damage');
});

test('Lightweaver, Choirmother, Beacon of Hope', () => {
  let s = scene();
  deckOf(s, A, 3); deckOf(s, B, 3);
  const lw = addCard(s, 'lightweaver', A, 'hand');
  s = play(s, lw.uid);
  const sp = s.players[A].board[1];
  addCard(s, 'choirmother', A, 'board');
  eq(power(s, s.cards[sp]), 2, 'Spirit 2/2');
  ok(hasKw(s, s.cards[sp], 'soar'), 'Spirit soars');
  addCard(s, 'beacon-of-hope', A, 'relics');
  s = end(s); s = end(s);
  eq(s.players[A].board.length, 4, 'a new Spirit at the start of the turn');
});

test('Seraphine', () => {
  let s = scene();
  const se = addCard(s, 'seraphine', A, 'board');
  s = attack(s, se.uid);
  eq(s.players[B].life, 16, 'hit for 4');
  eq(s.players[A].life, 24, 'drained 4');
  ok(!s.cards[se.uid].ex, 'Watchful');
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
  ok(err(s, { t: 'play', p: A, uid: ap.uid }), 'must fight when it can');
  s = play(s, ap.uid, { target: { uid: m.uid } });
  eq(zoneOf(s, m.uid), 'discard', 'Mossback died');
  eq(power(s, s.cards[ap.uid]), 7, 'grew +2/+2');
});

test('Banner of the Charge', () => {
  let s = scene();
  addCard(s, 'banner-of-the-charge', A, 'relics');
  const lw = addCard(s, 'lightweaver', A, 'hand');
  s = play(s, lw.uid);
  ok(canAttack(s, A, s.cards[lw.uid]), 'Rush from the Banner');
});

test('Sky Warden pins a creature down', () => {
  let s = scene();
  const mb = addCard(s, 'mossback', B, 'board');
  const sw = addCard(s, 'sky-warden', A, 'hand');
  deckOf(s, A, 3); deckOf(s, B, 3);
  s = play(s, sw.uid, { target: { uid: mb.uid } });
  ok(s.cards[mb.uid].ex, 'exhausted');
  s = end(s);
  ok(!canAttack(s, B, s.cards[mb.uid]), 'cannot attack on its next turn');
  s = end(s); s = end(s);
  ok(canAttack(s, B, s.cards[mb.uid]), 'ready the turn after');
});

// ── Rules ───────────────────────────────────────────────────────────
test('Opening, Spark and first draw', () => {
  const deck = cardList(STARTERS[0].counts);
  const players = [{ name: 'A', deck }, { name: 'B', deck }];
  let s = newGame({ seed: 42, players, startEnergy: RULES.startEnergy });
  const first = s.first, second = 1 - first;
  eq(s.players[second].hand.length, 6, 'second player has 5 + Spark');
  s = act(s, { t: 'mulligan', p: first, redraw: true });
  s = act(s, { t: 'mulligan', p: second, redraw: false });
  eq(s.phase, 'main', 'game started');
  eq(s.players[first].hand.length, 5, 'first player skipped the draw');
  eq(s.players[first].energy, RULES.startEnergy, `${RULES.startEnergy} Energy on turn one`);
  s = end(s);
  eq(s.players[second].hand.length, 7, 'second player drew');
  eq(s.players[second].energy, RULES.startEnergy, 'the same on their first turn');
  const spark = s.players[second].hand.find((u) => s.cards[u].cid === 'spark');
  s = play(s, spark);
  eq(s.players[second].energy, RULES.startEnergy + 1, 'Spark: +1 Energy');
  eq(s.players[second].maxEnergy, RULES.startEnergy, 'but not +1 maximum');
  s = end(s);
  eq(s.players[first].energy, RULES.startEnergy + 1, 'one more on turn two');
  // a game saved before the change (no startEnergy in its setup) replays with the old 1
  let old = newGame({ seed: 42, players });
  old = act(old, { t: 'mulligan', p: first, redraw: true });
  old = act(old, { t: 'mulligan', p: second, redraw: false });
  eq(old.players[first].energy, 1, 'an old setup starts at 1');
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

test('Three players: each opponent, elimination, turn order, who you attack', () => {
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
  let t = scene({ players: 3 });
  const m = addCard(t, 'mossback', A, 'board');
  addCard(t, 'lightweaver', B, 'board');
  t = attack(t, m.uid, 2);
  ok(t.phase === 'main' || t.combat.step === 'tricks', 'C had no blockers; B’s creature stays out of it');
  t = fight(t);
  eq(t.players[2].life, 17, 'C took 3');
});

// ── Double blocks ───────────────────────────────────────────────────
test('Two creatures block one attacker', () => {
  let s = scene();
  const ac = addCard(s, 'ash-collector', A, 'board');           // 3/3
  const ku = addCard(s, 'kindly-undertaker', B, 'board');       // 2/3, costs 2
  const lw = addCard(s, 'lightweaver', B, 'board');             // 1/2, costs 2
  s = attack(s, ac.uid);
  s = block(s, [[ku.uid, ac.uid], [lw.uid, ac.uid]]);
  ok(s.log.some((l) => l.text.includes('Kindly Undertaker and Lightweaver block Ash Collector')), 'both are blocking it');
  s = fight(s);
  eq(zoneOf(s, ac.uid), 'discard', 'the attacker took 2 + 1 and died');
  eq(zoneOf(s, ku.uid), 'discard', 'it killed the stronger blocker');
  eq(zoneOf(s, lw.uid), 'board', 'the other survived');
  eq(s.players[B].life, 20, 'nothing got through');
});

test('Double blocks: the same pair twice is not allowed, a Guard can still block two', () => {
  let s = scene();
  const a1 = addCard(s, 'lightweaver', A, 'board');
  const a2 = addCard(s, 'canopy-archer', A, 'board');
  const sh = addCard(s, 'shieldbearer', B, 'board');
  const sp = addCard(s, 'spirit', B, 'board');
  s = attack(s, [a1.uid, a2.uid]);
  ok(err(s, { t: 'block', p: B, blocks: [[sp.uid, a1.uid], [sp.uid, a1.uid]] }), 'the same pair twice');
  s = fight(s, [[sh.uid, a1.uid], [sh.uid, a2.uid], [sp.uid, a2.uid]]);
  eq(zoneOf(s, a2.uid), 'discard', 'Canopy Archer met the Shieldbearer and the Spirit');
  eq(zoneOf(s, sp.uid), 'gone', 'the archer took the Spirit with it');
  eq(s.cards[sh.uid].dmg, 2, 'the Shieldbearer took 1 from each attacker (the archer killed the Spirit first)');
});

test('Overrun and Venom through two blockers', () => {
  let s = scene();
  const ic = addCard(s, 'ironhide-charger', A, 'board');        // 4/4 Overrun
  const s1 = addCard(s, 'spirit', B, 'board'), s2 = addCard(s, 'spirit', B, 'board');
  s = fight(attack(s, ic.uid), [[s1.uid, ic.uid], [s2.uid, ic.uid]]);
  eq(zoneOf(s, s1.uid), 'gone', 'first Spirit');
  eq(zoneOf(s, s2.uid), 'gone', 'second Spirit');
  eq(s.players[B].life, 18, '2 trampled over');
  let t = scene();
  const gs = addCard(t, 'gloomweb-spider', A, 'board');         // 2/3 Venom
  const mb = addCard(t, 'mossback', B, 'board'), pg = addCard(t, 'patient-giant', B, 'board');
  t = fight(attack(t, gs.uid), [[mb.uid, gs.uid], [pg.uid, gs.uid]]);
  eq(zoneOf(t, mb.uid), 'discard', 'Venom: 1 damage is enough for Mossback');
  eq(zoneOf(t, pg.uid), 'discard', 'and for the Giant');
  eq(zoneOf(t, gs.uid), 'discard', 'the spider died too');
});

// ── The Crown (three players) ───────────────────────────────────────
test('The Crown: first hit takes it, the holder draws, hitting them takes it', () => {
  let s = scene({ players: 3 });
  ok(s.crownOn && s.crown == null, 'on, and nobody holds it yet');
  const C3 = 2;
  const sr = addCard(s, 'spark-runner', A, 'board');
  const lw = addCard(s, 'shieldbearer', B, 'board');
  const sp = addCard(s, 'spirit', C3, 'board');
  for (const p of [A, B, C3]) deckOf(s, p, 5);
  s = fight(attack(s, sr.uid, B), [[lw.uid, sr.uid]]);
  eq(s.crown, null, 'a blocked attack takes nothing');
  s.players[A].attackedOn = -1;
  s.cards[sr.uid].ex = false;
  const lw2 = addCard(s, 'lightweaver', A, 'board');
  s = fight(attack(s, lw2.uid, B));
  eq(s.crown, A, 'A hit B first: A takes the Crown');
  const hand = s.players[A].hand.length;
  s = end(s);
  eq(s.players[A].hand.length, hand + 1, 'A drew a card for the Crown at the end of the turn');
  // B's turn: B hits C, who does not hold it: nothing changes.
  s = fight(attack(s, lw.uid, C3));
  eq(s.crown, A, 'hitting someone else does not take it');
  s = end(s);
  // C's turn: C hits A, the holder.
  s = fight(attack(s, sp.uid, A));
  eq(s.crown, C3, 'C hit the holder: C takes the Crown');
  ok(s.log.some((l) => /takes the Crown from/.test(l.text)), 'it says so in the log');
});

test('The Crown: knocked out, conceding, and two-player games', () => {
  let s = scene({ players: 3 });
  s.crown = B;
  s.players[B].life = 2;
  const sr = addCard(s, 'spark-runner', A, 'board');
  s = fight(attack(s, sr.uid, B));
  ok(s.players[B].out, 'B is out');
  eq(s.crown, A, 'the Crown goes to the player who knocked them out');
  s = act(s, { t: 'concede', p: A });
  eq(s.phase, 'over', 'A conceded, only C is left');
  let t = scene({ players: 3 });
  t.crown = A;
  t = act(t, { t: 'concede', p: A });
  eq(t.crown, null, 'conceding on your own turn sends it back to the middle');
  let d = scene();
  ok(!d.crownOn, 'no Crown with two players');
  d = fight(attack(d, addCard(d, 'spark-runner', A, 'board').uid));
  eq(d.crown, null, 'nobody takes it');
});

// ── Abilities: "Pay N Energy: …" ────────────────────────────────────
const use = (s, uid, extra = {}) => act(s, { t: 'use', p: actor(s), uid, ...extra });

test('Reckless Initiate pumps after blockers, once a turn', () => {
  let s = scene();
  const r = addCard(s, 'reckless-initiate', A, 'board');
  const ku = addCard(s, 'mossback', B, 'board');                // 3/4, and B could answer with its ability
  s = attack(s, r.uid);
  s = block(s, [[ku.uid, r.uid]]);
  eq(actor(s), A, 'A may answer the block');
  s = use(s, r.uid);
  eq(s.players[A].energy, 6, 'paid 2 Energy');
  eq(power(s, s.cards[r.uid]), 4, '+2 Power');
  ok(err(s, { t: 'use', p: actor(s), uid: r.uid }), 'only once each turn');
  s = fight(s);
  eq(zoneOf(s, ku.uid), 'discard', 'the pumped Initiate killed its blocker');
});

test('Ember Duelist and Canopy Archer shoot', () => {
  let s = scene();
  const ed = addCard(s, 'ember-duelist', A, 'board');
  const sp = addCard(s, 'spirit', B, 'board');
  s = use(s, ed.uid, { target: { uid: sp.uid } });
  eq(zoneOf(s, sp.uid), 'gone', 'the Spirit is shot down');
  const ca = addCard(s, 'canopy-archer', A, 'board');
  const lw = addCard(s, 'lightweaver', B, 'board');
  const cr = addCard(s, 'cloud-ray', B, 'board');
  ok(err(s, { t: 'use', p: A, uid: ca.uid, target: { uid: lw.uid } }), 'the Archer only shoots creatures with Soar');
  s = use(s, ca.uid, { target: { uid: cr.uid } });
  eq(zoneOf(s, cr.uid), 'discard', 'Cloud Ray (2/1) falls');
  eq(s.players[A].energy, 4, 'two abilities, 2 Energy each');
  s.players[A].energy = 1;
  const ed2 = addCard(s, 'ember-duelist', A, 'board');
  ok(err(s, { t: 'use', p: A, uid: ed2.uid, target: { uid: lw.uid } }), 'not enough Energy');
});

test('Mossback grows for good; Curious Wisp draws; Choirmother calls Spirits', () => {
  let s = scene();
  const mb = addCard(s, 'mossback', A, 'board');
  s = use(s, mb.uid);
  eq(vitality(s, s.cards[mb.uid]), 5, '+1/+1');
  eq(s.players[A].life, 22, 'Awaken: gain 2 Life');
  s = end(s); s = end(s);
  eq(power(s, s.cards[mb.uid]), 4, 'still bigger next turn');
  let t = scene();
  const cw = addCard(t, 'curious-wisp', A, 'board');
  deckOf(t, A, 2);
  t = use(t, cw.uid);
  eq(t.players[A].hand.length, 1, 'drew a card');
  const cm = addCard(t, 'choirmother', A, 'board');
  t.players[A].energy = 4;
  t = use(t, cm.uid);
  const spirit = t.cards[t.players[A].board[t.players[A].board.length - 1]];
  eq(spirit.cid, 'spirit', 'a Spirit');
  eq(power(t, spirit), 2, 'with Choirmother it is a 2/2');
});

test('Cloud Ray escapes a block; Dawnwatch Knight shields a blocker', () => {
  let s = scene();
  const sr = addCard(s, 'spark-runner', A, 'board');            // 3/1
  const cr = addCard(s, 'cloud-ray', B, 'board');
  s = attack(s, sr.uid);
  s = block(s, [[cr.uid, sr.uid]]);
  eq(actor(s), B, 'A had nothing to play; B gets a chance');
  s = use(s, cr.uid);
  eq(zoneOf(s, cr.uid), 'hand', 'Cloud Ray went back to B’s hand');
  s = fight(s);
  eq(s.players[B].life, 20, 'the Runner was blocked: no damage');
  let t = scene();
  const as = addCard(t, 'ash-collector', A, 'board');           // 3/3
  const dk = addCard(t, 'dawnwatch-knight', B, 'board');
  const ku = addCard(t, 'kindly-undertaker', B, 'board');       // 2/3
  t = attack(t, as.uid);
  t = block(t, [[ku.uid, as.uid]]);
  t = use(t, dk.uid, { target: { uid: ku.uid } });
  t = fight(t);
  eq(zoneOf(t, ku.uid), 'board', 'the Undertaker (2/5 this turn) survived');
});

test('Vesper Bat and Hungry Ghoul', () => {
  let s = scene({ players: 3 });
  const vb = addCard(s, 'vesper-bat', A, 'board');
  s = use(s, vb.uid);
  eq(s.players[1].life, 19, 'B lost 1');
  eq(s.players[2].life, 19, 'C lost 1');
  eq(s.players[A].life, 21, 'A gained 1');
  let t = scene();
  const hg = addCard(t, 'hungry-ghoul', A, 'board');
  const lw = addCard(t, 'lightweaver', A, 'board');
  ok(err(t, { t: 'use', p: A, uid: hg.uid, target: { uid: hg.uid } }), 'not itself');
  t = use(t, hg.uid, { target: { uid: lw.uid } });
  eq(zoneOf(t, lw.uid), 'discard', 'sacrificed');
  eq(power(t, t.cards[hg.uid]), 3, 'the Ghoul fed');
  eq(t.players[A].energy, 7, 'for 1 Energy');
});

test('Abilities: whose turn, fights, Fish, and the move list', () => {
  let s = scene();
  const sr = addCard(s, 'spark-runner', A, 'board');
  const mb = addCard(s, 'mossback', B, 'board');
  ok(err(s, { t: 'use', p: B, uid: mb.uid }), 'not on someone else’s turn outside a fight');
  ok(legalActions(s, A).every((a) => a.t !== 'use' || a.uid !== mb.uid), 'A cannot use B’s creature');
  s = attack(s, sr.uid);
  eq(actor(s), B, 'B chooses blockers');
  s = use(s, mb.uid);
  eq(vitality(s, s.cards[mb.uid]), 5, 'B grew Mossback before blocking');
  s = fight(s, [[mb.uid, sr.uid]]);
  eq(zoneOf(s, sr.uid), 'discard', 'and blocked with it');
  let t = scene();
  const ri = addCard(t, 'reckless-initiate', A, 'board');
  const sc = addCard(t, 'sea-change', A, 'hand');
  ok(useOptions(t, A, t.cards[ri.uid]).length === 1, 'usable');
  t = play(t, sc.uid, { target: { uid: ri.uid } });
  ok(err(t, { t: 'use', p: A, uid: ri.uid }), 'a Fish has no abilities');
  let u = scene();
  addCard(u, 'reckless-initiate', A, 'board');
  ok(legalActions(u, A).some((a) => a.t === 'use'), 'abilities are in the move list');
});

test('Replay is deterministic', () => {
  const deck = cardList(STARTERS[1].counts);
  const setup = { seed: 99, players: [{ name: 'A', deck }, { name: 'B', deck: cardList(STARTERS[2].counts) }] };
  let s = newGame(setup);
  const actions = [];
  for (let k = 0; k < 160 && s.phase !== 'over'; k++) {
    const p = s.phase === 'mulligan' ? s.players.findIndex((P) => !P.mull) : actor(s);
    const legal = legalActions(s, p);
    const a = legal[(k * 7919) % legal.length];
    actions.push(a);
    s = apply(s, a).state;
  }
  const r = replay(setup, actions);
  eq(JSON.stringify(r.players), JSON.stringify(s.players), 'same players after replay');
});

test('Two of each card in a deck, one of a Legendary', () => {
  ok(canAdd({ cinderling: 1 }, 'cinderling').ok, 'a second Cinderling goes in');
  ok(!canAdd({ cinderling: 2 }, 'cinderling').ok, 'not a third');
  ok(!canAdd({ 'grandmother-bramble': 1 }, 'grandmother-bramble').ok, 'one Legendary only');
  ok(!validate({ ...STARTERS[0].counts, cinderling: 3 }).ok, 'three copies make a deck illegal');
  for (const d of STARTERS) ok(validate(d.counts).ok && Object.values(d.counts).reduce((a, n) => a + n, 0) === 30, `${d.name}: a legal 30-card deck`);
  ok(STARTERS.every((d) => Object.values(d.counts).some((n) => n === 2)), 'every starter has cards it holds two of');
});

// ── Champions (a prototype) ─────────────────────────────────────────
// A Champion of player p on the table, as newGame puts it there.
const AT = (cid) => BY_ID[cid].xp.at; // (its totals for Levels 2 and 3, as tuned)
function champ(s, p, cid) {
  const c = addCard(s, cid, p, 'board');
  Object.assign(s.players[p], { champ: cid, cxp: 0 });
  return c;
}

test('SATTC Ultra: off unless a game asks for it, and kept on the game', () => {
  const players = [{ name: 'A', deck: cardList(STARTERS[0].counts) }, { name: 'B', deck: cardList(STARTERS[1].counts) }];
  eq(newGame({ seed: 3, players }).ultra, false, 'a setup without it (every saved game) plays the standard rules');
  const s = newGame({ seed: 3, players, startEnergy: 3, ultra: true });
  eq(s.ultra, true, 'an Ultra setup');
  eq(replay({ seed: 3, players, startEnergy: 3, ultra: true }, []).ultra, true, 'a replay keeps it');
});

test('Champions start on the table, one each, from the deck', () => {
  const ed = cardList(STARTERS[0].counts), mm = cardList(STARTERS[1].counts);
  const s = newGame({ seed: 3, players: [{ name: 'A', deck: ed }, { name: 'B', deck: mm }], startEnergy: 3, champions: true });
  eq(s.players[A].board.map((u) => s.cards[u].cid).join(), 'champion-umbral', 'Everything Dies brings Morwen');
  eq(s.players[B].board.map((u) => s.cards[u].cid).join(), 'champion-radiant', 'More Is More brings Aurelia');
  eq(champLevel(s, A), 1, 'at Level 1');
  ok(!canAttack(s, A, s.cards[s.players[A].board[0]]), 'a Level 1 Champion can’t attack');
  const old = newGame({ seed: 3, players: [{ name: 'A', deck: ed }, { name: 'B', deck: mm }] });
  eq(old.players[A].board.length, 0, 'none without champions');
});

test('Aurelia: Spirits level her; then Spirits grow, then double', () => {
  let s = scene();
  const au = champ(s, A, 'champion-radiant');
  const spirits = () => s.players[A].board.filter((u) => s.cards[u].cid === 'spirit');
  ok(AT('champion-radiant')[0] === 3, '(this test reckons with Level 2 at 3 Spirits)');
  const ts = addCard(s, 'twin-souls', A, 'hand');
  s = play(s, ts.uid);
  eq(champLevel(s, A), 1, '2 Spirits: still Level 1');
  ok(canAttack(s, A, s.cards[au.uid]) === false, 'and still only a defender');
  const lw = addCard(s, 'lightweaver', A, 'hand');
  s = play(s, lw.uid);
  eq(champLevel(s, A), 2, '3 Spirits: Level 2');
  eq(power(s, s.cards[au.uid]), 2, 'Aurelia 2/5');
  eq(vitality(s, s.cards[au.uid]), 5, 'Aurelia 2/5 (Vitality)');
  eq(power(s, s.cards[spirits()[0]]), 2, 'Spirits are 2/2');
  ok(canAttack(s, A, s.cards[au.uid]), 'and she can attack now');
  s.players[A].cxp = AT('champion-radiant')[1] - 1;
  const ts2 = addCard(s, 'twin-souls', A, 'hand');
  s = play(s, ts2.uid);
  eq(champLevel(s, A), 3, 'Level 3');
  eq(spirits().length, 5, 'two more Spirits fill the table: 7 creatures, so the doubling has no room');
  eq(s.players[A].board.length, 7, 'the table holds 7');
  ok(hasKw(s, s.cards[au.uid], 'soar'), 'Level 3 Soar');
});

test('Pyra: Spells level her; then each Spell burns, then they cost less', () => {
  let s = scene();
  champ(s, A, 'champion-ember');
  s.players[A].cxp = AT('champion-ember')[0] - 1;
  const sc = addCard(s, 'scorch', A, 'hand'), sc2 = addCard(s, 'scorch', A, 'hand');
  const rat = addCard(s, 'grave-rat', B, 'board'), rat2 = addCard(s, 'grave-rat', B, 'board');
  s = play(s, sc.uid, { target: { uid: rat.uid } });
  eq(champLevel(s, A), 2, 'one more Spell: Level 2');
  eq(s.players[B].life, 19, 'and it already burns: 1 damage');
  s.players[A].cxp = AT('champion-ember')[1] - 1;
  s = play(s, sc2.uid, { target: { uid: rat2.uid } });
  eq(champLevel(s, A), 3, 'Level 3');
  const w = addCard(s, 'wildfire', A, 'hand');
  eq(costOf(s, A, s.cards[w.uid]), 2, 'Spells cost 1 less');
});

test('Old Root: growth levels him; then the smallest grows each turn, then every boost grows more', () => {
  let s = scene();
  const root = champ(s, A, 'champion-verdant');
  const m = addCard(s, 'mossback', A, 'board'), sd = addCard(s, 'grave-rat', A, 'board');
  deckOf(s, A, 4); deckOf(s, B, 4);
  ok(hasKw(s, s.cards[root.uid], 'reach'), 'Reach from Level 1');
  s.players[A].cxp = AT('champion-verdant')[0] - 1;
  const wg = addCard(s, 'wild-growth', A, 'hand');
  s = play(s, wg.uid, { target: { uid: m.uid } });
  eq(champLevel(s, A), 2, 'one more boost: Level 2');
  s = end(s); s = end(s);
  eq(power(s, s.cards[sd.uid]), 2, 'his turn: the smallest (the Rat) grows +1/+1');
  s.players[A].cxp = AT('champion-verdant')[1];
  const wg2 = addCard(s, 'wild-growth', A, 'hand');
  s = play(s, wg2.uid, { target: { uid: m.uid } });
  eq(power(s, s.cards[m.uid]), 3 + 2 + 2 + 1, 'Level 3: Wild Growth gives +1/+1 more');
});

test('Morwen: deaths level her; then deaths drain, then the grave gives back', () => {
  let s = scene();
  champ(s, A, 'champion-umbral');
  s.players[A].cxp = AT('champion-umbral')[0] - 1;
  deckOf(s, A, 4); deckOf(s, B, 4);
  const rat = addCard(s, 'grave-rat', A, 'board');
  const w = addCard(s, 'wildfire', A, 'hand');
  s = play(s, w.uid);
  eq(champLevel(s, A), 2, 'one more death: Level 2');
  eq(s.players[B].life, 19, 'and the Rat’s death drains 1');
  ok(s.cards[rat.uid].zone === 'discard', 'the Rat is in the discard pile');
  s.players[A].cxp = AT('champion-umbral')[1];
  s = end(s); s = end(s);
  ok(s.players[A].board.some((u) => s.cards[u].cid === 'grave-rat'), 'Level 3: her turn brings a Rat back');
});

test('Nim: extra cards level her; then she draws more, then every card drains', () => {
  let s = scene();
  champ(s, A, 'champion-tide');
  deckOf(s, A, 10); deckOf(s, B, 10);
  s = end(s); s = end(s);
  eq(s.players[A].cxp, 0, 'the turn’s own draw doesn’t count');
  s.players[A].cxp = AT('champion-tide')[0] - 2;
  const st = addCard(s, 'second-thought', A, 'hand');
  s = play(s, st.uid, { discard: s.players[A].hand.find((u) => s.cards[u].cid === 'grave-rat') });
  eq(champLevel(s, A), 2, 'Second Thought’s cards: Level 2');
  const n = s.players[A].hand.length;
  s = end(s); s = end(s);
  eq(s.players[A].hand.length, n + 2, 'her turn: the turn’s card and an extra one');
  s.players[A].cxp = AT('champion-tide')[1];
  const life = s.players[B].life;
  draw(s, A, 1);
  eq(s.players[B].life, life - 1, 'Level 3: a card drawn costs them 1 Life');
});

test('A Champion that leaves the table comes back to hand, dearer each time', () => {
  let s = scene();
  const au = champ(s, A, 'champion-radiant');
  s.players[A].cxp = AT('champion-radiant')[0];
  const sc = addCard(s, 'scorch', B, 'hand');
  s.active = B;
  s = play(s, sc.uid, { target: { uid: au.uid } });
  s = play(s, addCard(s, 'scorch', B, 'hand').uid, { target: { uid: au.uid } });
  s = play(s, addCard(s, 'scorch', B, 'hand').uid, { target: { uid: au.uid } });
  eq(s.cards[au.uid].zone, 'hand', 'Aurelia goes back to hand');
  eq(costOf(s, A, s.cards[au.uid]), 4, 'and costs 4 now');
  eq(champLevel(s, A), 2, 'she keeps her level');
  const ts = addCard(s, 'twin-souls', A, 'hand');
  s.active = A;
  s = play(s, ts.uid);
  eq(power(s, s.cards[s.players[A].board.find((u) => s.cards[u].cid === 'spirit')]), 1, 'her Level 2 works only while she is on the table');
});

// ── cards that multiply (n 91–97) ───────────────────────────────────
test('The Bright Choir doubles Spirits; Dawnsinger drains for each', () => {
  let s = scene();
  addCard(s, 'the-bright-choir', A, 'relics');
  addCard(s, 'dawnsinger', A, 'board');
  const spirits = () => s.players[A].board.filter((u) => s.cards[u].cid === 'spirit').length;
  const ts = addCard(s, 'twin-souls', A, 'hand');
  s = play(s, ts.uid);
  eq(spirits(), 4, 'two Spirits, and two more (the Choir’s own don’t call it again)');
  eq(s.players[B].life, 16, 'Dawnsinger: 1 Life for each of the 4');
  const tl = addCard(s, 'a-thousand-lights', A, 'hand');
  s.players[A].energy = 8;
  s = play(s, tl.uid);
  eq(s.players[A].board.length, 7, 'the table holds 7: it stops there');
  eq(s.players[B].life, 14, 'and only the Spirits made count');
});

test('Crescendo counts the Spells played this turn', () => {
  let s = scene();
  const sc = addCard(s, 'scorch', A, 'hand'), cr = addCard(s, 'crescendo', A, 'hand');
  const rat = addCard(s, 'grave-rat', B, 'board');
  deckOf(s, B, 3);
  s = play(s, sc.uid, { target: { uid: rat.uid } });
  s = play(s, cr.uid, { target: { p: B } });
  eq(s.players[B].life, 18, 'second Spell of the turn: 2 damage');
  s = end(s); s = end(s);
  const cr2 = addCard(s, 'crescendo', A, 'hand');
  s = play(s, cr2.uid, { target: { p: B } });
  eq(s.players[B].life, 17, 'a new turn counts from 1');
});

test('Ripple draws, and the next Spell costs 1 less', () => {
  let s = scene({ energy: 6 });
  deckOf(s, A, 3); deckOf(s, B, 3);
  const rp = addCard(s, 'ripple', A, 'hand'), w = addCard(s, 'wildfire', A, 'hand'), w2 = addCard(s, 'wildfire', A, 'hand');
  const n = s.players[A].hand.length;
  s = play(s, rp.uid);
  eq(s.players[A].hand.length, n, 'Ripple went, a card came');
  eq(costOf(s, A, s.cards[w.uid]), 2, 'Wildfire costs 2 now');
  s = play(s, w.uid);
  eq(s.players[A].energy, 6 - 1 - 2, 'paid 1, then 2');
  eq(costOf(s, A, s.cards[w2.uid]), 3, 'the one after costs 3 again');
  const rp2 = addCard(s, 'ripple', A, 'hand');
  s.players[A].energy = 1;
  s = play(s, rp2.uid);
  s = end(s); s = end(s);
  eq(costOf(s, A, s.cards[w2.uid]), 3, 'a discount left over ends with the turn');
});

test('Season of Plenty grows what has already grown', () => {
  let s = scene();
  addCard(s, 'season-of-plenty', A, 'relics');
  const m = addCard(s, 'mossback', A, 'board'), rat = addCard(s, 'grave-rat', A, 'board');
  Object.assign(s.cards[m.uid], { pP: 1, pV: 1, grown: true });
  deckOf(s, A, 4); deckOf(s, B, 4);
  s = end(s); s = end(s);
  eq(power(s, s.cards[m.uid]), 5, 'Mossback 3 + 1 + 1');
  eq(power(s, s.cards[rat.uid]), 1, 'the Rat never grew: no change');
  s = end(s); s = end(s);
  eq(power(s, s.cards[m.uid]), 6, 'and again the next turn');
});

test('Lantern Ferryman: a Spirit for each creature of yours that dies, not tokens', () => {
  let s = scene();
  addCard(s, 'lantern-ferryman', A, 'board');
  addCard(s, 'grave-rat', A, 'board');
  deckOf(s, A, 4);
  const spirits = () => s.players[A].board.filter((u) => s.cards[u].cid === 'spirit');
  const w = addCard(s, 'wildfire', A, 'hand');
  s = play(s, w.uid);
  eq(spirits().length, 1, 'the Rat rises as a Spirit');
  const sc = addCard(s, 'scorch', A, 'hand');
  s = play(s, sc.uid, { target: { uid: spirits()[0] } });
  eq(spirits().length, 0, 'a token that dies brings nothing back');
});

test('Wild Bloom doubles Power and Vitality for the turn', () => {
  let s = scene();
  const m = addCard(s, 'mossback', A, 'board');
  Object.assign(s.cards[m.uid], { pP: 2, grown: true });
  const wb = addCard(s, 'wild-bloom', A, 'hand');
  s = play(s, wb.uid, { target: { uid: m.uid } });
  eq(power(s, s.cards[m.uid]), 10, 'Power 5, doubled');
  eq(vitality(s, s.cards[m.uid]), 8, 'Vitality 4, doubled');
  deckOf(s, A, 2); deckOf(s, B, 2);
  s = end(s);
  eq(power(s, s.cards[m.uid]), 5, 'back after the turn');
});

// ── SATTC Ultra ─────────────────────────────────────────────────────
// A blank mid-game position with the Ultra rules on, and a creature on the
// table that is past its Shelter.
function uscene(opts = {}) {
  const s = scene(opts);
  s.ultra = true;
  s.field = null;
  for (const P of s.players) { P.invest = 0; P.life = 30; }
  return s;
}
const ub = (s, cid, p, extra = {}) => { const c = addCard(s, cid, p, 'board', extra); delete c.shelter; return c; };
const endT = (s) => act(s, { t: 'end', p: s.active });
const onBoard = (s, p, cid) => s.players[p].board.filter((u) => s.cards[u].cid === cid);

test('Ultra: 30 Life; Energy grows to 6 by itself, and each Invest raises that for good', () => {
  const players = [{ name: 'A', deck: cardList(ULTRA_STARTERS[0].counts) }, { name: 'B', deck: cardList(ULTRA_STARTERS[1].counts) }];
  let s = newGame({ seed: 5, players, startEnergy: 3, ultra: true });
  eq(s.players[A].life, 30, 'Ultra starts at 30 Life');
  eq(newGame({ seed: 5, players }).players[A].life, 20, 'the standard game still starts at 20');
  s = act(s, { t: 'mulligan', p: A, redraw: false });
  s = act(s, { t: 'mulligan', p: B, redraw: false });
  for (let k = 0; k < 14; k++) s = endT(s);
  const me = s.active;
  eq(s.players[me].maxEnergy, 6, 'max Energy stops at 6');
  const life = s.players[me].life, bp = addCard(s, 'blood-pact', me, 'hand');
  s = play(s, bp.uid);
  eq(s.players[me].maxEnergy, 7, 'Blood Pact: 7 now');
  eq(s.players[me].invest, 1, 'one Investment');
  eq(s.players[me].life, life - 3, 'Blood Pact costs 3 Life');
  s = endT(endT(s));
  eq(s.players[me].maxEnergy, 7, 'and it stays 7');
});

test('Ultra: wounds stay, and heal half (rounded up) at the start of their owner’s turn', () => {
  let s = uscene();
  const w = ub(s, 'bastion-wall', B);
  w.dmg = 3;
  s = endT(s);
  eq(s.cards[w.uid].dmg, 1, '3 damage: 2 heal');
  s = endT(s);
  eq(s.cards[w.uid].dmg, 1, 'only on its owner’s turn');
  s = endT(s);
  eq(s.cards[w.uid].dmg, 0, 'then the last 1');
});

test('Ultra: a new creature is Sheltered from opponents’ Spells until its owner’s next turn', () => {
  let s = uscene();
  s.active = B;
  const c = addCard(s, 'shieldbearer', B, 'hand');
  s = play(s, c.uid);
  ok(s.cards[c.uid].shelter, 'Sheltered when it arrives');
  s = endT(s);
  const sc = addCard(s, 'scorch', A, 'hand');
  ok(!needs(s, A, s.cards[sc.uid]).target.some((t) => t.uid === c.uid), 'Scorch can’t aim at it');
  ok(needs(s, B, s.cards[c.uid]) && true, '(its owner still can)');
  s = endT(s);
  ok(!s.cards[c.uid].shelter, 'its owner’s next turn ends the Shelter');
});

test('Ultra, Legacy: half of a dying creature’s growth passes to the weakest of its side', () => {
  let s = uscene();
  const big = ub(s, 'bastion-wall', A, { pP: 4, pV: 2 });
  const small = ub(s, 'shieldbearer', A);
  const f = addCard(s, 'feed-the-flame', A, 'hand');
  s = play(s, f.uid, { sac: big.uid, target: { p: B } });
  eq(s.cards[small.uid].pP, 2, 'half of +4 Power');
  eq(s.cards[small.uid].pV, 1, 'half of +2 Vitality');
});

test('Ultra: Venom poisons instead of killing, and only a cure heals poison', () => {
  let s = uscene();
  const adder = ub(s, 'marsh-adder', A);
  const w = ub(s, 'bastion-wall', B);
  s = attack(s, [adder.uid]);
  s = fight(s, [[w.uid, adder.uid]]);
  ok(s.cards[w.uid].zone === 'board', 'the Wall survives the Venom');
  eq(s.cards[w.uid].poison, 1, 'poisoned: 1');
  s = endT(s);
  eq(s.cards[w.uid].dmg, 1, 'poison doesn’t heal');
  const h = addCard(s, 'menders-hymn', B, 'hand');
  s = play(s, h.uid, { target: { uid: w.uid } });
  eq(s.cards[w.uid].dmg, 0, 'Mender’s Hymn cures it');
});

test('Ultra: a creature sent back to its owner’s hand keeps its growth', () => {
  let s = uscene();
  const g = ub(s, 'shieldbearer', A, { pP: 2, pV: 2 });
  const ny = addCard(s, 'not-yet', A, 'hand');
  s = play(s, ny.uid, { target: { uid: g.uid } });
  ok(s.cards[g.uid].zone === 'hand', 'back in hand');
  s = play(s, g.uid);
  eq(power(s, s.cards[g.uid]), 3, 'played again with its +2 Power');
  eq(vitality(s, s.cards[g.uid]), 6, 'and +2 Vitality');
});

test('Ultra, Hex: Shackles stops a creature attacking or blocking until its controller pays 4', () => {
  let s = uscene();
  const t = ub(s, 'ironhide-charger', B);
  const sh = addCard(s, 'shackles', A, 'hand');
  s = play(s, sh.uid, { target: { uid: t.uid } });
  eq(s.cards[t.uid].hex, 4, 'Hex 4');
  ok(!canBlock(s, s.cards[t.uid], null), 'it can’t block');
  s = endT(s);
  ok(!canAttack(s, B, s.cards[t.uid]), 'or attack');
  ok(legalActions(s, B).some((a) => a.t === 'unhex' && a.uid === t.uid), 'its controller may break it');
  const e = s.players[B].energy;
  s = act(s, { t: 'unhex', p: B, uid: t.uid });
  ok(!s.cards[t.uid].hex && s.players[B].energy === e - 4, 'paying 4 breaks it');
  ok(canAttack(s, B, s.cards[t.uid]), 'and it can attack again');
});

test('Ultra, Fields: one for the table; Scorched Earth stops healing, Sanctuary Spring heals fully', () => {
  let s = uscene();
  const w = ub(s, 'bastion-wall', B);
  w.dmg = 4;
  const se = addCard(s, 'scorched-earth', A, 'hand');
  s = play(s, se.uid);
  eq(s.field, se.uid, 'Scorched Earth is the Field');
  s = endT(s);
  eq(s.cards[w.uid].dmg, 4, 'no healing under Scorched Earth');
  const sp = addCard(s, 'sanctuary-spring', B, 'hand');
  s = play(s, sp.uid);
  eq(s.field, sp.uid, 'a new Field replaces it');
  ok(s.players[A].discard.includes(se.uid), 'the old one goes to its owner’s discard pile');
  s = endT(endT(s));
  eq(s.cards[w.uid].dmg, 0, 'Sanctuary Spring heals it fully');
});

test('Ultra: Overgrowth makes every permanent boost +1/+1 bigger', () => {
  let s = uscene();
  const c = ub(s, 'shieldbearer', A);
  const o = addCard(s, 'overgrowth', A, 'hand');
  s = play(s, o.uid);
  const wg = addCard(s, 'wild-growth', A, 'hand');
  s = play(s, wg.uid, { target: { uid: c.uid } });
  eq(s.cards[c.uid].pP, 3, 'Wild Growth’s +2 becomes +3');
});

test('Ultra: Grows and Multiply at the start of their owner’s turn', () => {
  let s = uscene();
  const sp = ub(s, 'sproutling', B);
  ub(s, 'mycelium-bud', B);
  s = endT(s);
  eq(s.cards[sp.uid].pP, 1, 'Sproutling grows 1');
  eq(onBoard(s, B, 'mycelium-bud').length, 2, 'Mycelium Bud makes a copy');
  ok(onBoard(s, B, 'mycelium-bud').some((u) => s.cards[u].token), 'the copy is a token');
  s = endT(endT(s));
  eq(onBoard(s, B, 'mycelium-bud').length, 4, 'and the copies multiply too');
  eq(s.cards[sp.uid].pP, 2, 'Sproutling again');
});

test('Ultra: an Unstable creature erupts at 10 Power and starts again', () => {
  let s = uscene();
  const heart = ub(s, 'kindling-heart', B, { pP: 8, pV: 8 });
  const w = ub(s, 'bastion-wall', A), mine = ub(s, 'bastion-wall', B);
  const lifeA = s.players[A].life;
  s = endT(s);
  eq(power(s, s.cards[heart.uid]), 0, 'it reached 10, erupted, and is back to 0/1');
  eq(s.cards[w.uid].dmg, 3, 'every other creature took 3');
  eq(s.cards[mine.uid].dmg, 3, 'its own side’s too');
  eq(s.players[A].life, lifeA - 3, 'and every player');
});

test('Ultra, Fuse: Molten Core joins another creature, which keeps its stats and Swift', () => {
  let s = uscene();
  const core = ub(s, 'molten-core', A), host = ub(s, 'ironhide-charger', A);
  const p0 = power(s, s.cards[host.uid]), v0 = vitality(s, s.cards[host.uid]);
  s = act(s, { t: 'use', p: A, uid: core.uid, target: { uid: host.uid } });
  eq(power(s, s.cards[host.uid]), p0 + 2, '+2 Power');
  eq(vitality(s, s.cards[host.uid]), v0 + 1, '+1 Vitality');
  ok(hasKw(s, s.cards[host.uid], 'swift'), 'and Swift');
  ok(!hasKw(s, s.cards[host.uid], 'fuse'), 'but not Fuse');
  ok(s.players[A].discard.includes(core.uid), 'Molten Core goes to the discard pile');
});

test('Ultra, Rituals: Flood Rite in three stages, one a turn, ending in an extra turn', () => {
  let s = uscene();
  for (let k = 0; k < 6; k++) addCard(s, 'scorch', A, 'deck');
  const fr = addCard(s, 'flood-rite', A, 'hand');
  const t = ub(s, 'shieldbearer', B);
  const hand0 = s.players[A].hand.length;
  s = play(s, fr.uid);
  eq(s.players[A].hand.length, hand0 + 1, 'stage I: draw 2');
  ok(s.players[A].relics.includes(fr.uid) && s.cards[fr.uid].stage === 1, 'it stays in front of A');
  eq(useOptions(s, A, s.cards[fr.uid]).length, 0, 'not again this turn');
  const gr = addCard(s, 'grave-rite', A, 'hand');
  ok(check(s, { t: 'play', p: A, uid: gr.uid }) != null, 'one Ritual at a time');
  s = endT(endT(s));
  s = act(s, { t: 'use', p: A, uid: fr.uid, target: { uid: t.uid } });
  eq(s.cards[t.uid].zone, 'hand', 'stage II: back to its owner’s hand');
  s = endT(endT(s));
  s = act(s, { t: 'use', p: A, uid: fr.uid });
  ok(s.players[A].discard.includes(fr.uid), 'stage III completes it');
  s = endT(s);
  eq(s.active, A, 'A takes an extra turn');
});

test('Ultra, Rituals: Grave Rite brings creatures back from the discard pile', () => {
  let s = uscene();
  const d1 = addCard(s, 'shieldbearer', A, 'discard'), d2 = addCard(s, 'marsh-adder', A, 'discard'), d3 = addCard(s, 'ironhide-charger', A, 'discard');
  const gr = addCard(s, 'grave-rite', A, 'hand');
  s = play(s, gr.uid, { pick: d1.uid });
  ok(s.players[A].hand.includes(d1.uid), 'stage I: a creature card back to hand');
  s = endT(endT(s));
  const lifeB = s.players[B].life, lifeA = s.players[A].life;
  s = act(s, { t: 'use', p: A, uid: gr.uid });
  ok(s.players[B].life === lifeB - 2 && s.players[A].life === lifeA + 2, 'stage II: 2 Life from each opponent');
  s = endT(endT(s));
  s = act(s, { t: 'use', p: A, uid: gr.uid, picks: [d2.uid, d3.uid] });
  ok(s.players[A].board.includes(d2.uid) && s.players[A].board.includes(d3.uid), 'stage III: two creatures return to play');
});

test('Ultra: Thornback Archer covers a flier, striking what it fights first', () => {
  let s = uscene();
  ub(s, 'thornback-archer', A);
  const flier = ub(s, 'cloud-ray', A);
  const blocker = ub(s, 'canopy-archer', B);
  s = attack(s, [flier.uid]);
  s = fight(s, [[blocker.uid, flier.uid]]);
  ok(s.cards[blocker.uid].zone !== 'board', 'the blocker falls to the cover before it strikes');
  eq(s.cards[flier.uid].zone, 'board', 'and the flier lives');
});

test('Ultra: Shield Captain strengthens the other Guards; Guards grow as they block; Bastion Wall bites', () => {
  let s = uscene();
  ub(s, 'shield-captain', B);
  const w = ub(s, 'bastion-wall', B);
  eq(vitality(s, s.cards[w.uid]), 8, 'Bastion Wall gets +0/+2');
  const att = ub(s, 'spark-runner', A);
  const lifeA = s.players[A].life;
  s = attack(s, [att.uid]);
  s = fight(s, [[w.uid, att.uid]]);
  eq(s.cards[w.uid].pV, 1, 'blocking: +0/+1 for good');
  eq(s.players[A].life, lifeA - 2, 'Bastion Wall: the attacker loses 2 Life');
});

test('Ultra: Field Medic heals 2 more, and Rootmother grows whatever heals', () => {
  let s = uscene();
  ub(s, 'field-medic', B);
  ub(s, 'rootmother', B);
  const w = ub(s, 'bastion-wall', B);
  w.dmg = 5;
  s = endT(s);
  eq(s.cards[w.uid].dmg, 0, '3 (half of 5) and 2 more');
  eq(s.cards[w.uid].pP, 1, 'Rootmother: +1/+1 for healing');
});

test('Ultra: with Bloodbinder, a Drain creature heals itself for what it deals', () => {
  let s = uscene();
  ub(s, 'bloodbinder', A);
  const bat = ub(s, 'vesper-bat', A);
  bat.dmg = 1;
  s = attack(s, [bat.uid]);
  s = fight(s, []);
  eq(s.cards[bat.uid].dmg, 0, 'Vesper Bat heals the 1 it deals');
});

test('Ultra: Gravewarden, Bloodrage Berserker, Wavewarden, Ember Volley', () => {
  let s = uscene();
  ub(s, 'gravewarden', A);
  const x = ub(s, 'shieldbearer', A), y = ub(s, 'bastion-wall', A);
  y.dmg = 2;
  const f = addCard(s, 'feed-the-flame', A, 'hand');
  s = play(s, f.uid, { sac: x.uid, target: { p: B } });
  eq(s.cards[y.uid].dmg, 0, 'Gravewarden: Bastion Wall heals 2');
  eq(s.cards[y.uid].pP, 1, 'and gets +1/+0 for good');
  const br = ub(s, 'bloodrage-berserker', A);
  br.dmg = 2;
  eq(power(s, br), 4, 'Bloodrage Berserker: +1/+0 for each damage on it');
  let t = uscene();
  ub(t, 'wavewarden', B);
  ub(t, 'shieldbearer', B);
  const sc = addCard(t, 'scorch', A, 'hand');
  const ts = needs(t, A, t.cards[sc.uid]).target.filter((x2) => x2.uid != null);
  ok(ts.length === 1 && t.cards[ts[0].uid].cid === 'wavewarden', 'Wavewarden: Scorch can aim only at it');
  let v = uscene();
  const e = [1, 2, 3].map(() => ub(v, 'shieldbearer', B));
  const vol = addCard(v, 'ember-volley', A, 'hand');
  v = play(v, vol.uid, { targets: e.map((c) => c.uid) });
  ok(e.every((c) => v.cards[c.uid].dmg === 1), 'Ember Volley: 1 damage to each of three');
});

test('Ultra: the Invest cards, and Tidecaller’s Library', () => {
  const others = {
    'stoke-the-furnace': (s0, s) => s.players[B].life === s0.players[B].life - 1,
    'tide-of-fortune': (s0, s) => s.players[A].hand.length === s0.players[A].hand.length + 1,
    'tithe-of-light': (s0, s) => s.players[A].life === s0.players[A].life + 3,
    'deep-roots': (s0, s) => s.cards[s.players[A].board[0]].pP === 1,
  };
  for (const [cid, fn] of Object.entries(others)) {
    let s = uscene();
    for (let k = 0; k < 3; k++) addCard(s, 'scorch', A, 'deck');
    ub(s, 'shieldbearer', A);
    const c = addCard(s, cid, A, 'hand');
    const s0 = s;
    s = play(s, c.uid);
    eq(s.players[A].maxEnergy, 9, `${cid}: Invest (8 → 9)`);
    ok(fn(s0, s), `${cid}: and its other half`);
  }
  let s = uscene();
  for (let k = 0; k < 6; k++) addCard(s, 'scorch', A, 'deck');
  addCard(s, 'tidecallers-library', A, 'relics');
  s = endT(s);
  const h0 = s.players[A].hand.length;
  s = endT(s);
  eq(s.players[A].hand.length, h0 + 2, 'Library: an extra card each turn');
});

// ── fuzz: random legal play ─────────────────────────────────────────
// (`ultra`: SATTC Ultra games, with the Ultra starter decks)
function fuzz(games, ultra = false) {
  let crashes = 0, unfinished = 0, totalActions = 0, fights = 0;
  const decks = (ultra ? ULTRA_STARTERS : STARTERS).map((d) => cardList(d.counts));
  let seed = 1;
  for (let g = 0; g < games; g++) {
    const n = g % 4 === 3 ? 3 : 2;
    const players = Array.from({ length: n }, (_, i) => ({ name: `P${i}`, deck: decks[(g + i * 2) % decks.length] }));
    let s = newGame({ seed: seed++, players, startEnergy: g % 2 ? RULES.startEnergy : 1, champions: g % 3 !== 0, ultra });
    let rand = g * 2654435761 >>> 0;
    const libs = s.players.map(() => 0); // (the most Libraries each player has had: a hand can stay over 10 after one goes)
    const R = () => (rand = (Math.imul(rand, 1103515245) + 12345) >>> 0) / 4294967296;
    try {
      for (let k = 0; k < 3000 && s.phase !== 'over'; k++) {
        const p = s.phase === 'mulligan' ? s.players.findIndex((P) => !P.mull) : actor(s);
        const legal = legalActions(s, p);
        if (!legal.length) throw new Error('no legal actions');
        const nonEnd = legal.filter((a) => a.t !== 'end');
        const a = nonEnd.length && R() < 0.85 ? nonEnd[Math.floor(R() * nonEnd.length)] : legal[legal.length - 1];
        const r = apply(s, a);
        if (r.error) throw new Error('legal action rejected: ' + r.error + ' ' + JSON.stringify(a));
        if (a.t === 'attack') fights++;
        s = r.state;
        totalActions++;
        for (const P of s.players) {
          if (P.board.length > 7) throw new Error('board over 7');
          if (P.relics.filter((u) => !BY_ID[s.cards[u].cid].stages).length > 3) throw new Error('relics over 3');
          if (P.relics.filter((u) => BY_ID[s.cards[u].cid].stages).length > 1) throw new Error('two Rituals at once');
          libs[P.i] = Math.max(libs[P.i], P.relics.filter((u) => s.cards[u].cid === 'tidecallers-library').length);
          if (P.hand.filter((u) => !BY_ID[s.cards[u].cid]?.champion).length > 10 + 2 * libs[P.i]) throw new Error('hand over 10'); // (a Champion goes back even to a full hand)
          for (const [z, want] of [['hand', 'hand'], ['deck', 'deck'], ['discard', 'discard'], ['board', 'board'], ['exile', 'exile'], ['relics', 'relic'], ['traps', 'trap']]) for (const u of P[z]) {
            if (s.cards[u].zone !== want) throw new Error(`zone mismatch ${s.cards[u].cid} in ${z} says ${s.cards[u].zone}`);
            if ((z === 'board' || z === 'relics') && s.cards[u].ctrl !== P.i) throw new Error(`control mismatch ${s.cards[u].cid}`);
          }
          if (!Number.isFinite(P.life)) throw new Error('life not finite');
        }
        if (s.phase === 'combat' && (s.players[s.combat.a].out || s.players[s.combat.d].out)) throw new Error('fight with a player who is out');
        if (s.field != null && s.cards[s.field].zone !== 'field') throw new Error('the Field is not in play');
        for (const P of s.players) for (const u of P.board) if (s.cards[u].dmg < 0 || (s.cards[u].poison || 0) > s.cards[u].dmg) throw new Error('wounds out of order');
      }
      if (s.phase !== 'over') unfinished++;
    } catch (e) {
      crashes++;
      if (crashes <= 5) failures.push(`fuzz game ${g}: ${e.message}\n${e.stack.split('\n').slice(1, 4).join('\n')}`);
    }
  }
  ok(crashes === 0, `${crashes} fuzz games crashed`);
  return { games, crashes, unfinished, totalActions, fights };
}

const games = Number(process.argv[2] || 400);
const t0 = Date.now();
const f = fuzz(games);
const t1 = Date.now();
const fu = fuzz(Math.ceil(games / 2), true);
console.log(`scenario + invariant checks: ${pass} passed, ${fail} failed`);
console.log(`fuzz: ${f.games} random games, ${f.totalActions} actions, ${f.fights} attacks, ${f.crashes} crashes, ${f.unfinished} unfinished, ${((t1 - t0) / 1000).toFixed(1)}s`);
console.log(`Ultra fuzz: ${fu.games} random games, ${fu.totalActions} actions, ${fu.fights} attacks, ${fu.crashes} crashes, ${fu.unfinished} unfinished, ${((Date.now() - t1) / 1000).toFixed(1)}s`);
if (failures.length) { console.log('\nFAILURES:'); for (const m of failures) console.log(' - ' + m); process.exit(1); }
