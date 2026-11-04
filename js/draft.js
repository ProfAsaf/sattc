// Draft night: the rules of the draft, with no screen attached (the screens
// are in draft-ui.js), so tools/test-draft.mjs can run all of it in node.
//
// A snake draft in typed rounds. The cards are sorted into six piles by kind
// (small, medium and big creatures, spells, tricks & traps, relics), each
// shuffled from the seed. 30 rounds, each of one kind in a fixed order: up to
// 6 cards from the top of that pile go on the table, and everyone takes one,
// in turn. The cards nobody took go back on the bottom of their pile, so the
// next round of that kind shows fresh cards first. The order snakes: a seeded
// order for round 1 (A B C), reversed for round 2 (C B A), and so on, so
// whoever picks last in a round picks first in the next. The last 3 rounds
// ("last call") deal from every card still unpicked. 30 picks each, and your
// 30 picks are your deck (any factions). With three players every one of the
// 90 cards is picked exactly once; with two, 60 are.
//
// A draft is its seed, its number of players and its pick list, a list of
// { p, k, cid }: seat p's pick in round k was card cid. Every phone replays
// the same list and agrees on the table, like the game's move list.

import { BY_ID, CARDS, FACTION_ORDER } from './cards.js';

export const TABLE = 6; // cards laid out each round, at most
export const KINDS = ['small', 'medium', 'big', 'spells', 'tricks', 'relics'];
export const ROUNDS = [
  'small', 'medium', 'spells', 'small', 'big', 'tricks', 'medium', 'spells', 'small', 'medium',
  'relics', 'big', 'spells', 'tricks', 'small', 'medium', 'spells', 'big', 'tricks', 'medium',
  'small', 'spells', 'relics', 'medium', 'big', 'tricks', 'spells', 'last', 'last', 'last',
];
export const PICKS = ROUNDS.length; // 30 per player: the deck

// Plain words for new players.
export const KIND_INFO = {
  small: { name: 'Small creatures', short: 'Small', line: 'Small creatures: cheap fighters you can play early.' },
  medium: { name: 'Medium creatures', short: 'Medium', line: 'Medium creatures: the heart of your deck, for 3 or 4 Energy.' },
  big: { name: 'Big creatures', short: 'Big', line: 'Big creatures: 5 Energy or more. Slow to arrive, hard to stop.' },
  spells: { name: 'Spells', short: 'Spells', line: 'Spells: they happen once, on your turn.' },
  tricks: { name: 'Tricks & Traps', short: 'Tricks', line: 'Tricks & Traps: surprises for the middle of a fight.' },
  relics: { name: 'Relics', short: 'Relics', line: 'Relics: they stay on the table and keep working.' },
  last: { name: 'Last call', short: 'Last call', line: 'Last call: anything left over.' },
};

export function kindOf(card) {
  if (card.type === 'relic') return 'relics';
  if (card.type === 'creature') return card.cost <= 2 ? 'small' : card.cost <= 4 ? 'medium' : 'big';
  const kw = card.keywords || [];
  return card.subtype === 'Trick' || card.subtype === 'Trap' || kw.includes('trick') || kw.includes('trap') ? 'tricks' : 'spells';
}

// The engine's little generator (mulberry32), so a seed means the same everywhere.
export function rng(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const newSeed = () => Math.floor(Math.random() * 2 ** 31);

function shuffle(list, rand) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

// A fingerprint of this draft format and the card list (ids, in order): the
// piles come from it, so every phone in a draft must have the same one. Card
// text may differ.
const FORMAT = 'snake-1';
export function poolKey() {
  let h = 2166136261;
  for (const ch of `${FORMAT}|${CARDS.filter((c) => !c.token).map((c) => c.id).join(',')}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (h >>> 0).toString(36);
}

// The six piles, top card first, each shuffled from the seed.
export function makePiles(seed) {
  const rand = rng(seed);
  const piles = Object.fromEntries(KINDS.map((k) => [k, []]));
  for (const c of CARDS) if (!c.token) piles[kindOf(c)].push(c.id);
  for (const k of KINDS) shuffle(piles[k], rand);
  return piles;
}

// Who picks in what order: a seeded order for round 1, then it snakes.
export const firstOrder = (seed, n) => shuffle([...Array(n).keys()], rng((seed ^ 0x2545f491) | 0));
export const roundOrder = (first, r) => (r % 2 ? [...first].reverse() : [...first]);

const isPick = (x, n) => x && Number.isInteger(x.p) && Number.isInteger(x.k) && x.p >= 0 && x.p < n
  && x.k >= 0 && x.k < PICKS && typeof x.cid === 'string';

// Rebuild the draft from its picks: walk the rounds and turns in order. For
// each turn, seat p's pick is the first one listed for (p, round) whose card
// is on the table, so strays and duplicates (a double tap, a reload mid-send,
// the host picking for someone at the same moment) are ignored, and the order
// of the list doesn't matter. When only one card is left for you, it is yours
// without a pick. The replay stops at the first turn with no pick: whose turn
// it is.
export function replay({ seed, n }, picks = []) {
  if (n < 2 || n > 3) throw new Error('A draft is for two or three players.');
  const piles = makePiles(seed);
  if (KINDS.reduce((s, k) => s + piles[k].length, 0) < n * PICKS) throw new Error(`A ${n}-player draft needs ${n * PICKS} cards.`);
  const first = firstOrder(seed, n);
  const wanted = new Map(); // "p:k" -> card ids, in list order
  for (const x of picks) {
    if (!isPick(x, n)) continue;
    const key = `${x.p}:${x.k}`;
    if (!wanted.has(key)) wanted.set(key, []);
    wanted.get(key).push(x.cid);
  }
  const pools = Array.from({ length: n }, () => []);
  const log = []; // every pick so far: { r, p, cid, auto }
  let last = null; // the last-call pile: everything left when last call starts
  const base = { seed, n, first, pools, log, piles };
  for (let r = 0; r < PICKS; r++) {
    const kind = ROUNDS[r];
    if (kind === 'last' && !last) last = piles.last = shuffle(KINDS.flatMap((k) => piles[k].splice(0)), rng((seed ^ 0x1a57ca11) | 0));
    const pile = kind === 'last' ? last : piles[kind];
    const dealt = pile.splice(0, TABLE);
    // Not enough for everyone (only if the card list changes): top up from the other piles.
    for (const k of KINDS) while (dealt.length < n && piles[k].length) dealt.push(piles[k].shift());
    const table = [...dealt];
    const order = roundOrder(first, r);
    for (let i = 0; i < order.length; i++) {
      const p = order[i];
      const auto = table.length === 1;
      const cid = auto ? table[0] : (wanted.get(`${p}:${r}`) || []).find((c) => table.includes(c));
      if (cid == null) return { ...base, done: false, round: r, kind, order, turn: i, who: p, dealt, table };
      table.splice(table.indexOf(cid), 1);
      pools[p].push(cid);
      log.push({ r, p, cid, auto });
    }
    pile.push(...table); // nobody took these: back on the bottom of their pile
  }
  return { ...base, done: true, round: PICKS - 1, kind: ROUNDS[PICKS - 1], order: roundOrder(first, PICKS - 1), turn: n, who: -1, dealt: [], table: [] };
}

export const canPick = (st, p, cid) => !st.done && st.who === p && st.table.includes(cid);

// This round's picks so far, and the last few picks of one seat (newest first).
export const roundPicks = (st) => st.log.filter((e) => e.r === st.round && !st.done);
export const lastPicks = (st, p, n = 3) => st.log.filter((e) => e.p === p).slice(-n).reverse();

// ── decks from picks ────────────────────────────────────────────────
export const deckCounts = (pool) => Object.fromEntries(pool.map((id) => [id, 1]));

export function byCost(pool) {
  return pool.map((id) => BY_ID[id]).filter(Boolean).sort((a, b) => a.cost - b.cost || a.n - b.n);
}

// { small, medium, big, spells, tricks, relics }: the shape of a deck.
export function kindCounts(pool) {
  const n = Object.fromEntries(KINDS.map((k) => [k, 0]));
  for (const id of pool) if (BY_ID[id]) n[kindOf(BY_ID[id])]++;
  return n;
}

// [[faction, cards], …], most first (a two-faction card counts for both).
export function factionCounts(pool) {
  const n = {};
  for (const id of pool) for (const f of BY_ID[id]?.factions || []) n[f] = (n[f] || 0) + 1;
  return FACTION_ORDER.filter((f) => n[f]).map((f) => [f, n[f]]).sort((a, b) => b[1] - a[1]);
}

// "Ember/Umbral": the deck's main factions, for naming a bot's deck.
export function deckName(pool) {
  const fs = factionCounts(pool);
  if (!fs.length) return 'Drafted';
  const name = (f) => f[0].toUpperCase() + f.slice(1);
  return fs.length > 1 && fs[1][1] >= 4 ? `${name(fs[0][0])}/${name(fs[1][0])}` : name(fs[0][0]);
}

// ── the bots ────────────────────────────────────────────────────────
// How good a card is on its own, roughly 2..9: stats for the cost, keywords,
// what the text does, and a bonus for the rares (Legendaries).
const KW_VALUE = {
  rush: 0.5, soar: 1.4, reach: 0.4, guard: 0.7, swift: 0.9, venom: 1.4, drain: 0.9, overrun: 0.7,
  watchful: 0.7, hunt: 0.7, lastBreath: 0.5, awaken: 0.4, echo: 1, bond: 0.2, trick: 0.5, trap: 0.3,
};
const has = (re, t) => re.test(t);

function textValue(card) {
  // "Pay 2 Energy: …" abilities are extras on top of the card: a flat bonus,
  // and they stay out of the reading below (returning itself is not a bounce spell)
  const lines = (card.text || '').split('\n');
  const paid = lines.filter((l) => /^\W*Pay \d+ Energy:/i.test(l)).length;
  const t = lines.filter((l) => !/^\W*Pay \d+ Energy:/i.test(l)).join('\n');
  let v = paid * 0.5;
  if (has(/\bDestroy (a|an) (attacking )?creature\b/i, t)) v += 3;
  else if (has(/\bdestroy a Relic\b/i, t)) v += 0.3;
  if (has(/\bDestroy every\b/i, t)) v += 1.6;
  if (has(/becomes a copy/i, t)) v += 3.5;
  const dmg = t.match(/\bDeal (\d+) damage\b/i);
  if (dmg) v += Math.min(3, Number(dmg[1]) * 0.6) + (has(/any target|an opponent|each opponent/i, t) ? 0.4 : 0) - (has(/every creature/i, t) ? 0.8 : 0);
  if (has(/\bfights?\b/i, t)) v += 1.4;
  if (has(/take control/i, t)) v += 2.4;
  if (has(/becomes a 1\/1 Fish/i, t)) v += 2.2;
  if (has(/\bdraw (a|\d|two) cards?\b/i, t)) v += 1;
  if (has(/extra turn/i, t)) v += 1.8;
  const spirits = t.match(/Create (a|two|five) 1\/1 Spirit/i);
  if (spirits) v += { a: 0.8, two: 1.5, five: 3 }[spirits[1].toLowerCase()];
  if (has(/permanently/i, t)) v += 0.8;
  if (has(/\+\d\/\+\d/, t)) v += 0.5;
  if (has(/return .* to (its owner's|your) hand/i, t)) v += 0.9;
  if (has(/from (your|any) discard pile/i, t)) v += 0.7;
  if (has(/to play under your control/i, t)) v += 2.2;
  if (has(/when played/i, t)) v += 0.4;
  if (has(/costs? \d less/i, t)) v += 0.3;
  if (has(/your other creatures have|your spirits have/i, t)) v += 1;
  if (has(/can.t block/i, t)) v -= 0.8;
  if (has(/takes 1 damage/i, t)) v -= 0.3;
  if (card.type === 'relic') v += 0.8;
  return v;
}

export function cardValue(card) {
  let v = 4;
  if (card.type === 'creature') {
    const par = 1.6 * card.cost + 1.6; // a fair body: 1 → 3.2 stats, 4 → 8, 7 → 12.8
    v += (card.power + card.vitality - par) * 0.55;
  }
  for (const k of card.keywords) v += KW_VALUE[k] || 0;
  v += textValue(card);
  if (card.legendary) v += 2.5;
  if (card.cost >= 7) v -= 0.4;
  return v;
}

// The curve a 30-card deck should end up with (index 7 means 7+).
const CURVE = [0, 3, 7, 7, 5, 3, 3, 2];

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// How much a bot wants this card, given what it has picked so far.
export function pickScore(card, pool) {
  let s = cardValue(card);
  const n = pool.length;
  const cards = pool.map((id) => BY_ID[id]);
  // After the first few picks, lean into the two factions it has the most of.
  if (n >= 3) {
    const top = factionCounts(pool).slice(0, 2).map(([f]) => f);
    const commit = Math.min(1, (n - 2) / 8);
    const inTop = card.factions.filter((f) => top.includes(f)).length;
    s += (inTop === card.factions.length ? 1.8 : inTop ? 0.6 : -1.4) * commit;
  }
  // Keep a curve: room at this cost is good, a full slot is not.
  const c = Math.min(7, card.cost);
  const haveAt = cards.filter((x) => Math.min(7, x.cost) === c).length;
  s += clamp((CURVE[c] * (n + 1) / PICKS - haveAt) * 0.45, -1.6, 0.8);
  // And enough creatures (about 18 of 30).
  const creatures = cards.filter((x) => x.type === 'creature').length;
  const lack = 18 * (n + 1) / PICKS - creatures;
  s += card.type === 'creature' ? clamp(lack * 0.3, -1, 1) : clamp(-lack * 0.3, -1, 0.5);
  return s;
}

// A bot's pick from the cards on the table, given its picks so far.
// `rand` adds a little noise; with noise 0 it is the bot's honest best (the tip).
export function botPick(table, pool, rand = Math.random, noise = 0.6) {
  let best = null, bestScore = -Infinity;
  for (const id of table) {
    const card = BY_ID[id];
    if (!card) continue;
    const s = pickScore(card, pool) + (rand() - 0.5) * noise;
    if (s > bestScore) { best = id; bestScore = s; }
  }
  return best;
}

// The noise a bot uses for one pick: the same for the same draft, round and seat.
export const botRand = (seed, round, p) => rng((seed ^ Math.imul(round + 1, 7919) ^ Math.imul(p + 1, 104729)) | 0);
// The pick a bot makes for seat p now (practice bots, and the host's "Pick for").
export const botChoice = (st, p = st.who) => botPick(st.table, st.pools[p], botRand(st.seed, st.round, p));
// The tip for seat p: the bot's honest best for that deck.
export const tipFor = (st, p) => botPick(st.table, st.pools[p], () => 0.5, 0);
