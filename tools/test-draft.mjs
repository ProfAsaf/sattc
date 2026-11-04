// Draft night tests (snake draft in typed rounds): piles and rounds from the
// seed, the snake order, the recipe per player, untaken cards to the bottom,
// replaying the pick list, legal bot picks, two players, and "Pick for".
//   node tools/test-draft.mjs           all checks + 300 bot drafts of each size
//   node tools/test-draft.mjs 2000      more bot drafts

import { BY_ID, CARDS } from '../js/cards.js';
import { decode, encode, validateDrafted } from '../js/decks.js';
import {
  KINDS, PICKS, ROUNDS, TABLE, botChoice, botPick, botRand, byCost, canPick, cardValue, deckCounts, deckName,
  factionCounts, firstOrder, kindCounts, kindOf, lastPicks, makePiles, pickScore, poolKey, replay, rng, roundOrder,
  roundPicks, tipFor,
} from '../js/draft.js';

let pass = 0, fail = 0;
const failures = [];
function ok(cond, msg) { if (cond) pass++; else { fail++; failures.push(msg); } }
function eq(a, b, msg) { ok(a === b, `${msg}: expected ${b}, got ${a}`); }
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function test(name, fn) {
  try { fn(); } catch (e) { fail++; failures.push(`${name}: threw ${e.stack.split('\n').slice(0, 3).join(' | ')}`); }
}

const ALL = CARDS.filter((c) => !c.token).map((c) => c.id);
const RECIPE = { small: 5, medium: 6, spells: 6, big: 4, tricks: 4, relics: 2, last: 3 };

// Everyone picks with the bot, turn by turn; returns the pick list.
function botDraft(seed, n) {
  const picks = [];
  let st = replay({ seed, n }, picks);
  while (!st.done) {
    const cid = botChoice(st);
    if (!st.table.includes(cid)) throw new Error(`bot ${st.who} picked ${cid}, not on the table in round ${st.round + 1}`);
    picks.push({ p: st.who, k: st.round, cid });
    const next = replay({ seed, n }, picks);
    if (next.log.length <= st.log.length) throw new Error(`round ${st.round + 1}: the pick did not count`);
    st = next;
  }
  return picks;
}

// ── piles and rounds ────────────────────────────────────────────────
test('the same seed gives the same piles, order and rounds', () => {
  ok(same(makePiles(1234), makePiles(1234)), 'same seed, same piles');
  ok(!same(makePiles(1234), makePiles(1235)), 'another seed, other piles');
  ok(same(firstOrder(77, 3), firstOrder(77, 3)), 'same seed, same first order');
  const orders = new Set(Array.from({ length: 40 }, (_, s) => firstOrder(s, 3).join('')));
  ok(orders.size >= 4, `the first order depends on the seed (${orders.size} different orders in 40 seeds)`);
  const picks = botDraft(4242, 3);
  ok(same(replay({ seed: 4242, n: 3 }, picks), replay({ seed: 4242, n: 3 }, JSON.parse(JSON.stringify(picks)))), 'same seed and picks, same draft');
  ok(/^[0-9a-z]+$/.test(poolKey()) && poolKey() === poolKey(), 'the card-list fingerprint is stable');
});

test('six piles by kind, 90 cards in all', () => {
  const piles = makePiles(9);
  ok(same(Object.keys(piles), KINDS), 'the six kinds');
  ok(same(KINDS.map((k) => piles[k].length), [17, 21, 14, 18, 14, 6]), `pile sizes ${KINDS.map((k) => piles[k].length).join('/')} (small/medium/big/spells/tricks/relics)`);
  ok(same(Object.values(piles).flat().sort(), [...ALL].sort()), 'every card in exactly one pile');
  for (const k of KINDS) ok(piles[k].every((id) => kindOf(BY_ID[id]) === k), `${k}: only ${k}`);
  ok(piles.small.every((id) => BY_ID[id].type === 'creature' && BY_ID[id].cost <= 2), 'small = creatures costing 1-2');
  ok(piles.big.every((id) => BY_ID[id].cost >= 5), 'big = creatures costing 5+');
  ok(piles.tricks.every((id) => ['Trick', 'Trap'].includes(BY_ID[id].subtype)), 'tricks = Tricks and Traps');
  eq(ROUNDS.length, 30, 'rounds');
  const per = {};
  for (const k of ROUNDS) per[k] = (per[k] || 0) + 1;
  ok(same(per, { small: 5, medium: 6, spells: 6, big: 4, tricks: 4, relics: 2, last: 3 }), `rounds per kind ${JSON.stringify(per)}`);
});

// ── the snake ───────────────────────────────────────────────────────
test('snake order: A B C, then C B A, then A B C', () => {
  const first = [1, 2, 0];
  ok(same(roundOrder(first, 0), [1, 2, 0]), 'round 1 as dealt');
  ok(same(roundOrder(first, 1), [0, 2, 1]), 'round 2 reversed');
  ok(same(roundOrder(first, 2), [1, 2, 0]), 'round 3 as round 1');
  for (const n of [2, 3]) {
    const seed = 31 + n;
    const picks = botDraft(seed, n);
    const st = replay({ seed, n }, picks);
    const f = firstOrder(seed, n);
    for (let r = 0; r < PICKS; r++) {
      const seats = st.log.filter((e) => e.r === r).map((e) => e.p);
      ok(same(seats, r % 2 ? [...f].reverse() : f), `n=${n} round ${r + 1}: picks in snake order ${seats.join('')}`);
      if (r) ok(seats[0] === st.log.filter((e) => e.r === r - 1).map((e) => e.p).pop(), `n=${n} round ${r + 1}: last picker of the round before goes first`);
    }
  }
});

test('only the seat whose turn it is can pick', () => {
  const seed = 8, n = 3;
  const st = replay({ seed, n }, []);
  const [a, b] = st.order;
  eq(st.who, a, 'the first seat of round 1 is up');
  ok(canPick(st, a, st.table[0]) && !canPick(st, b, st.table[0]), 'canPick: only the seat up');
  // a pick written early by the next seat waits for its turn
  const early = [{ p: b, k: 0, cid: st.table[1] }];
  const st1 = replay({ seed, n }, early);
  eq(st1.who, a, 'an early pick from the next seat does not move the turn');
  const st2 = replay({ seed, n }, [{ p: a, k: 0, cid: st.table[0] }, ...early]);
  eq(st2.pools[b][0], st.table[1], 'it counts once its turn comes (if the card is still there)');
  eq(st2.who, st.order[2], 'then the third seat is up');
});

// ── recipe, piles, last call ────────────────────────────────────────
test('the recipe per player, and three players pick every card once', () => {
  for (const seed of [1, 2, 3, 1000, 123456789]) {
    const st = replay({ seed, n: 3 }, botDraft(seed, 3));
    ok(st.done && st.pools.every((pool) => pool.length === PICKS), `seed ${seed}: 30 picks each`);
    for (let p = 0; p < 3; p++) {
      const got = {};
      for (const e of st.log.filter((x) => x.p === p)) got[ROUNDS[e.r]] = (got[ROUNDS[e.r]] || 0) + 1;
      ok(same(Object.keys(RECIPE).map((k) => got[k]), Object.values(RECIPE)), `seed ${seed} seat ${p}: ${JSON.stringify(got)}`);
    }
    ok(st.log.every((e) => ROUNDS[e.r] === 'last' || kindOf(BY_ID[e.cid]) === ROUNDS[e.r]), `seed ${seed}: every typed round deals its own kind`);
    const all = st.pools.flat();
    ok(same([...all].sort(), [...ALL].sort()), `seed ${seed}: all 90 cards picked exactly once`);
    eq(st.log.filter((e) => ROUNDS[e.r] === 'last').length, 9, `seed ${seed}: last call deals the 9 cards left`);
  }
});

test('cards nobody took go to the bottom of their pile', () => {
  const seed = 2024, n = 3;
  const picks = botDraft(seed, n);
  const piles0 = makePiles(seed);
  const r1 = replay({ seed, n }, picks.filter((x) => x.k < 1)); // round 1 (small) done, round 2 up
  const taken = r1.log.filter((e) => e.r === 0).map((e) => e.cid);
  const dealt = piles0.small.slice(0, TABLE);
  const left = dealt.filter((id) => !taken.includes(id));
  eq(left.length, TABLE - n, 'three cards left on the table after round 1');
  ok(same(r1.piles.small, [...piles0.small.slice(TABLE), ...left]), 'the small pile: the rest, then the three left over at the bottom');
  // the next small round (round 4) shows fresh cards first
  const r4 = replay({ seed, n }, picks.filter((x) => x.k < 3));
  eq(r4.round, 3, 'round 4 is up');
  eq(r4.kind, 'small', 'round 4 is small creatures again');
  ok(same(r4.dealt, piles0.small.slice(TABLE, 2 * TABLE)), 'round 4 deals the next six, not the leftovers');
  // spells: 18 cards, 6 rounds of 3 picks, the last round deals the last 3
  const st = replay({ seed, n }, picks);
  const spellRounds = ROUNDS.map((k, r) => (k === 'spells' ? r : -1)).filter((r) => r >= 0);
  const lastSpells = replay({ seed, n }, picks.filter((x) => x.k < spellRounds[5]));
  eq(lastSpells.dealt.length, 3, 'the sixth spells round deals the 3 spells left');
  const auto = st.log.filter((e) => e.r === spellRounds[5]);
  ok(auto[2].auto && !auto[0].auto, 'the last card of a round is taken automatically');
  ok(!picks.some((x) => x.k === spellRounds[5] && x.p === auto[2].p), '(with no pick in the list)');
});

test('two players: 6 cards a round, 2 picks a round, 60 cards used', () => {
  for (const seed of [5, 6, 7]) {
    const picks = botDraft(seed, 2);
    const st = replay({ seed, n: 2 }, picks);
    ok(st.done && st.pools.every((pool) => pool.length === PICKS), `seed ${seed}: 30 picks each`);
    eq(new Set(st.pools.flat()).size, 60, `seed ${seed}: 60 different cards`);
    for (let r = 0; r < PICKS; r++) {
      const at = replay({ seed, n: 2 }, picks.filter((x) => x.k < r));
      const before = at.piles[at.kind].length + at.dealt.length; // the pile before this deal
      eq(at.dealt.length, Math.min(TABLE, before), `seed ${seed} round ${r + 1}: up to 6 cards on the table`);
      if (at.kind !== 'relics') eq(at.dealt.length, TABLE, `seed ${seed} round ${r + 1}: 6 cards on the table`);
    }
    const relics2 = replay({ seed, n: 2 }, picks.filter((x) => x.k < ROUNDS.lastIndexOf('relics')));
    eq(relics2.dealt.length, 4, `seed ${seed}: the second relics round shows the 4 relics nobody took`);
    for (let p = 0; p < 2; p++) {
      const got = {};
      for (const e of st.log.filter((x) => x.p === p)) got[ROUNDS[e.r]] = (got[ROUNDS[e.r]] || 0) + 1;
      ok(same(Object.keys(RECIPE).map((k) => got[k]), Object.values(RECIPE)), `seed ${seed} seat ${p}: the recipe`);
    }
    ok(!st.log.some((e) => e.auto), `seed ${seed}: never down to one card with two players`);
  }
});

// ── replay ──────────────────────────────────────────────────────────
test('replay: order-tolerant, ignores strays and duplicates', () => {
  for (const n of [2, 3]) {
    const seed = 777 + n;
    const picks = botDraft(seed, n);
    const good = replay({ seed, n }, picks);
    const r = rng(5);
    const shuffled = [...picks].map((x) => ({ x, key: r() })).sort((u, v) => u.key - v.key).map((u) => u.x);
    ok(same(replay({ seed, n }, shuffled).pools, good.pools), `n=${n}: a shuffled list replays the same`);
    ok(same(replay({ seed, n }, [...picks].reverse()).pools, good.pools), `n=${n}: a reversed list replays the same`);
    for (let i = 0; i <= picks.length; i += 7) {
      const st = replay({ seed, n }, picks.slice(0, i));
      ok(st.log.length >= i, `n=${n}: a prefix of ${i} picks replays at least ${i} picks (plus automatic last cards)`);
      ok(st.done || st.who === roundOrder(firstOrder(seed, n), st.round)[st.turn], `n=${n}: after ${i} picks the state says whose turn it is`);
    }
    // strays: junk, unknown cards, cards not on the table, picks out of range
    const st0 = replay({ seed, n }, []);
    const offTable = ALL.find((id) => !st0.table.includes(id));
    const noise = [null, {}, { p: 0 }, { p: 9, k: 0, cid: st0.table[0] }, { p: 0, k: -1, cid: 'scorch' }, { p: 0, k: 30, cid: 'scorch' },
      { p: st0.who, k: 0, cid: 'not-a-card' }, { p: st0.who, k: 0, cid: offTable }, { p: String(st0.who), k: 0, cid: st0.table[0] }];
    ok(same(replay({ seed, n }, [...noise, ...picks]).pools, good.pools), `n=${n}: strays change nothing`);
    // duplicates: a second pick for the same seat and round never counts
    const dups = picks.map((x) => {
      const at = replay({ seed, n }, picks.slice(0, picks.indexOf(x)));
      return { ...x, cid: at.table.find((c) => c !== x.cid) || x.cid };
    });
    ok(same(replay({ seed, n }, [...picks, ...dups]).pools, good.pools), `n=${n}: later duplicates are ignored`);
    // a first pick that is not on the table gives way to the next listed one
    ok(same(replay({ seed, n }, [{ p: st0.who, k: 0, cid: offTable }, ...picks]).pools, good.pools), `n=${n}: an impossible pick gives way`);
  }
});

test('"Pick for": the host picks the bot\'s choice for the seat that is up', () => {
  const seed = 99, n = 3;
  let picks = [];
  let st = replay({ seed, n }, picks);
  const away = st.order[1]; // this player wandered off: the host picks for them every time
  while (!st.done) {
    const cid = st.who === away ? botChoice(st) : st.table[0];
    if (st.who === away) ok(cid === botPick(st.table, st.pools[away], botRand(seed, st.round, away)), `round ${st.round + 1}: Pick for uses the bot's choice for that seat`);
    picks.push({ p: st.who, k: st.round, cid });
    const next = replay({ seed, n }, picks);
    if (st.who === away) ok(next.pools[away].includes(cid), `round ${st.round + 1}: the pick counts as that seat's`);
    st = next;
  }
  eq(st.pools[away].length, 30, 'the absent player still ends with 30 cards');
  // the host and the player picking at the same moment: the first listed counts, the other is ignored
  const s0 = replay({ seed, n }, []);
  const both = [{ p: s0.who, k: 0, cid: s0.table[2] }, { p: s0.who, k: 0, cid: botChoice(s0) }];
  eq(replay({ seed, n }, both).pools[s0.who][0], s0.table[2], 'two picks for one turn: the first listed counts');
  ok(tipFor(s0, s0.who) && s0.table.includes(tipFor(s0, s0.who)), 'the tip is a card on the table');
});

// ── decks ───────────────────────────────────────────────────────────
test('drafted decks become deck codes', () => {
  const seed = 2026, n = 3;
  const st = replay({ seed, n }, botDraft(seed, n));
  for (const pool of st.pools) {
    const counts = deckCounts(pool);
    ok(validateDrafted(counts).ok, `drafted deck is valid: ${validateDrafted(counts).errors.join(' ')}`);
    ok(same(Object.keys(decode(encode(counts))).sort(), [...pool].sort()), 'deck code round-trips the 30 picks');
    ok(byCost(pool).every((c, i, a) => i === 0 || a[i - 1].cost <= c.cost), 'byCost sorts by cost');
    eq(Object.values(kindCounts(pool)).reduce((a, b) => a + b, 0), 30, 'kindCounts covers the deck');
    ok(factionCounts(pool).length > 0 && typeof deckName(pool) === 'string', 'summary helpers work');
  }
  ok(same(lastPicks(st, 0, 3).map((e) => e.cid), st.pools[0].slice(-3).reverse()), 'lastPicks: newest first');
  eq(roundPicks(replay({ seed, n }, [])).length, 0, 'roundPicks: nothing yet');
  ok(!validateDrafted({ scorch: 1 }).ok, 'a short deck is not a drafted deck');
});

// ── the bots ────────────────────────────────────────────────────────
test('bots: sensible values', () => {
  ok(CARDS.every((c) => Number.isFinite(cardValue(c))), 'every card has a value');
  const v = (id) => cardValue(BY_ID[id]);
  ok(v('seraphine') > v('cloud-ray'), 'Seraphine (Legendary) over a plain flyer');
  ok(v('dawns-judgment') > v('rally'), 'removal over a small Trick');
  ok(v('ashmaw') > v('molten-berserker'), 'Ashmaw over Molten Berserker');
  const avg = CARDS.reduce((s, c) => s + cardValue(c), 0) / CARDS.length;
  ok(CARDS.filter((c) => c.legendary).every((c) => cardValue(c) > avg), 'every Legendary is above the average card');
});

test('bots: lean into their factions, keep a curve', () => {
  const ember = CARDS.filter((c) => c.factions.length === 1 && c.factions[0] === 'ember').map((c) => c.id);
  eq(botPick(['spark-runner', 'cloud-ray'], ember.slice(0, 8), () => 0.5), 'spark-runner', 'an Ember drafter takes the Ember card');
  eq(botPick(['spark-runner', 'cloud-ray'], [], () => 0.5), 'cloud-ray', 'with no picks yet it takes the better card');
  const bigs = CARDS.filter((c) => c.cost >= 5 && c.id !== 'seraphine').map((c) => c.id).slice(0, 10);
  ok(pickScore(BY_ID['seraphine'], bigs) < pickScore(BY_ID['seraphine'], []), 'a big card is worth less to a deck full of big cards');
});

const runs = Number(process.argv[2] || 300);
test('bots: legal picks in many whole drafts', () => {
  let decks = 0, cheap = 0;
  for (let g = 0; g < runs; g++) {
    for (const n of [2, 3]) {
      const seed = (g * 7919 + n * 13) | 0;
      const st = replay({ seed, n }, botDraft(seed, n)); // throws on an illegal pick
      ok(st.done && st.pools.every((pool) => pool.length === PICKS), `seed ${seed}, n=${n}: finished`);
      for (const pool of st.pools) {
        decks++;
        ok(validateDrafted(deckCounts(pool)).ok, `seed ${seed}: legal deck`);
        if (byCost(pool).filter((c) => c.cost <= 3).length >= 12) cheap++;
      }
    }
  }
  ok(botPick([], [], Math.random) === null, 'no pick from an empty table');
  ok(cheap / decks > 0.9, `decks keep cheap cards: ${cheap}/${decks} with 12+ cards costing 3 or less`);
  console.log(`bot drafts: ${runs * 2} drafts, ${decks} decks; ${(100 * cheap / decks).toFixed(0)}% with 12+ cards costing 3 or less`);
});

console.log(`draft checks: ${pass} passed, ${fail} failed`);
if (failures.length) { console.log('\nFAILURES:'); for (const m of failures.slice(0, 40)) console.log(' - ' + m); process.exit(1); }
