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
//
// SATTC Ultra drafts (`ultra`) deal from ULTRA_DRAFT_POOL instead: the same 90
// without the four cards Ultra leaves out, and the 31 Ultra cards (117, so
// three players' 90 picks leave some over). Fields go in the Relics pile.

import { BY_ID, CARDS, FACTION_ORDER, KEYWORDS, RULES, ULTRA, ULTRA_OUT } from './cards.js';

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
// In a SATTC Ultra draft the Relics pile has the Fields in it too.
export const kindInfo = (kind, ultra = false) => (ultra && kind === 'relics'
  ? { name: 'Relics & Fields', short: 'Relics', line: 'Relics & Fields: they stay on the table and keep working; a Field changes the rules for everyone.' }
  : KIND_INFO[kind]);

export function kindOf(card) {
  if (card.type === 'relic' || card.type === 'field') return 'relics';
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

// The draft's pool: Week One's 90 cards, one of each. Three players' 30 picks
// use up exactly these (the piles and rounds are built around them), so the
// later cards (n 91 on, for decks you build) stay out of the draft.
export const DRAFT_POOL = CARDS.filter((c) => !c.token && c.n <= 90);
export const ULTRA_DRAFT_POOL = [...DRAFT_POOL.filter((c) => !ULTRA_OUT.includes(c.id)), ...ULTRA];
export const draftPool = (ultra = false) => (ultra ? ULTRA_DRAFT_POOL : DRAFT_POOL);

// A fingerprint of this draft format and the card list (ids, in order): the
// piles come from it, so every phone in a draft must have the same one. Card
// text may differ.
const FORMAT = 'snake-1';
export function poolKey(ultra = false) {
  let h = 2166136261;
  for (const ch of `${FORMAT}|${draftPool(ultra).map((c) => c.id).join(',')}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (h >>> 0).toString(36);
}

// The six piles, top card first, each shuffled from the seed.
export function makePiles(seed, ultra = false) {
  const rand = rng(seed);
  const piles = Object.fromEntries(KINDS.map((k) => [k, []]));
  for (const c of draftPool(ultra)) piles[kindOf(c)].push(c.id);
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
export function replay({ seed, n, ultra = false }, picks = []) {
  if (n < 2 || n > 3) throw new Error('A draft is for two or three players.');
  const piles = makePiles(seed, ultra);
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
  const base = { seed, n, ultra: !!ultra, first, pools, log, piles };
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
  // SATTC Ultra (a creature that grows, copies itself or swells is worth more than its printed size)
  invest: 1.4, grows: 2.2, multiply: 2.6, unstable: 3, fuse: 0.9, ritual: 1.2, hex: 0.4, field: 1.2, bodyguard: 0.9,
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
  if (has(/\bHex \d/i, t)) v += 2.2; // (Ultra: an answer that holds until it is paid off)
  if (has(/\bheals?\b/i, t)) v += 0.7;
  if (has(/your other creatures with|whenever (a|another) creature of yours/i, t)) v += 0.8;
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

// ── 💡 advice for a round: what to look for, never which card to take ──
// Three short lines at most: what this kind of card is for and how to tell a
// good one, what your deck could use, and what kinds of cards are on the
// table. It never names a card (tools/test-draft.mjs checks that).
const ROUND_ADVICE = {
  small: 'Cheap creatures fight in the first turns and block while your bigger ones arrive. A fair one has Power + Vitality of about 3 for 1 Energy, or 5 for 2; a keyword is worth about a point more.',
  medium: 'Most of your fighters cost 3 or 4. A fair one has Power + Vitality of about 6 for 3 Energy, or 8 for 4; a keyword, or something that happens when it is played, makes it better.',
  big: 'Big creatures win games, but each takes a whole turn to play, so two or three are plenty. The best are hard to stop: Soar, Venom, or a big effect when played.',
  spells: 'Spells happen once, on your turn. The most useful get rid of an enemy creature (destroy it, damage it, make it fight); drawing cards comes next.',
  tricks: 'Tricks are played in the middle of a fight, so they can turn one you would lose: more Power, Swift (strikes first) or a save. Traps wait face down and spring by themselves.',
  relics: 'Relics stay on the table and work every turn, so a cheap one pays off over a long game.',
  last: 'Last call: anything left over. Take what your deck is most short of.',
};
// In a SATTC Ultra draft some rounds say it differently.
const ULTRA_ADVICE = {
  spells: 'Spells happen once, on your turn. In Ultra nothing wipes out a creature for free: look for damage (wounds last), a Hex that holds one down, or a card that grows your own side for good (Invest, a Ritual).',
  relics: 'Relics and Fields stay on the table and keep working. A Field changes the rules for everyone, so take one that suits your deck better than theirs.',
  big: 'Big creatures win games, but each takes a whole turn to play. In Ultra games last longer and wounds heal, so a big one that survives keeps paying off.',
};

const kws = (c) => (c.keywords || []).filter((k) => k !== 'trick' && k !== 'trap');
const removes = (c) => /\bdestroys? (a|an|every|each) (attacking )?creature|\bdeals? \d+ damage\b|\bfights?\b|take control|becomes a 1\/1 Fish|\bHex \d/i.test(c.text || '');
const draws = (c) => /\bdraws? (a|\d|two|three) cards?\b/i.test(c.text || '');
const pumps = (c) => /\+\d+\/\+\d+|\bgets? \+\d/i.test(c.text || '');
const saves = (c) => /return .* to (its owner's|your) hand|can'?t be (blocked|destroyed|targeted)|\bprevent/i.test(c.text || '');
const blocksSoar = (c) => c.type === 'creature' && (kws(c).includes('soar') || kws(c).includes('reach'));
const range = (xs) => { const a = Math.min(...xs), b = Math.max(...xs); return a === b ? `${a}` : `${a}–${b}`; };
const kwName = (k) => KEYWORDS[k]?.name || k;
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// What your deck could use, given the kind of round (null: nothing to say).
function needFor(kind, pool, table) {
  if (pool.length < 3) return 'Your deck is just starting: take what you like best and see where it leads.';
  const cr = pool.filter((c) => c.type === 'creature');
  const onTable = (f) => table.some(f);
  const soarGap = !cr.some(blocksSoar) && cr.length >= 3 && onTable(blocksSoar)
    ? 'None of your creatures can block Soar yet (Soar or Reach can).' : null;
  const removal = pool.filter(removes).length;
  switch (kind) {
    case 'small':
      if (!cr.some((c) => c.cost === 1) && cr.filter((c) => c.cost === 2).length >= 2 && onTable((c) => c.cost === 1)) {
        return `Your cheap creatures all cost 2: a 1-Energy one goes with a 2 to use all ${RULES.startEnergy} Energy of your first turn.`;
      }
      return soarGap;
    case 'medium': {
      const three = cr.filter((c) => c.cost === 3).length, four = cr.filter((c) => c.cost === 4).length;
      if (three + four >= 3 && four - three >= 2 && onTable((c) => c.cost === 3)) return `Your medium creatures lean to 4 Energy (${four} of ${three + four}): a 3 would smooth out your turns.`;
      if (three + four >= 3 && three - four >= 2 && onTable((c) => c.cost === 4)) return `Your medium creatures lean to 3 Energy (${three} of ${three + four}): a 4 hits harder later.`;
      return soarGap;
    }
    case 'big': {
      const big = cr.filter((c) => c.cost >= 5);
      if (big.length >= 2 && big.every((c) => c.cost >= 6) && onTable((c) => c.cost === 5)) {
        return `${big.length === 2 ? 'Both your big creatures cost' : `Your ${big.length} big creatures all cost`} 6 or more: a 5 comes down a turn sooner.`;
      }
      return soarGap;
    }
    case 'spells':
      if (!removal) return 'Your deck has no way yet to get rid of an enemy creature: worth looking for one.';
      if (removal >= 4) return `You already have ${removal} ways to deal with enemy creatures: drawing cards may help more now.`;
      return `Your deck has ${plural(removal, 'way')} to get rid of an enemy creature so far.`;
    case 'tricks': {
      const tricks = pool.filter((c) => c.subtype === 'Trick').length;
      return tricks ? `You have ${plural(tricks, 'Trick')}: cheap ones are the easiest to keep Energy for.`
        : 'Your first Trick: in a game, keep an Energy or two unspent on your turn so you can play it in a fight.';
    }
    case 'last':
      if (!removal) return 'Your deck has no way yet to get rid of an enemy creature.';
      if (soarGap) return soarGap;
      if (pool.filter((c) => c.cost <= 2).length < 6) return 'Your deck is short of cheap cards (1 or 2 Energy).';
      return 'Your deck is in good shape: take the strongest card left.';
  }
  return null;
}

// What kinds of cards are on the table (null: none left).
function tableSummary(kind, table) {
  const n = table.length;
  if (!n) return null;
  if (kind === 'small' || kind === 'medium' || kind === 'big') {
    const count = {};
    for (const c of table) for (const k of kws(c)) count[k] = (count[k] || 0) + 1;
    const list = Object.entries(count).sort((a, b) => b[1] - a[1]).map(([k, m]) => (m > 1 ? `${kwName(k)} ×${m}` : kwName(k)));
    return `On the table: ${plural(n, 'creature')} for ${range(table.map((c) => c.cost))} Energy. `
      + (list.length ? `Keywords: ${list.join(', ')}.` : 'No keywords among them: compare Power + Vitality.');
  }
  if (kind === 'relics') return `On the table: ${plural(n, 'Relic')} for ${range(table.map((c) => c.cost))} Energy.`;
  if (kind === 'last') {
    const k = { creature: 0, spell: 0, trick: 0, relic: 0 };
    for (const c of table) k[c.type === 'creature' ? 'creature' : c.type === 'relic' ? 'relic' : kindOf(c) === 'tricks' ? 'trick' : 'spell']++;
    const parts = [plural(k.creature, 'creature'), plural(k.spell, 'spell'), plural(k.trick, 'Trick or Trap', 'Tricks or Traps'), plural(k.relic, 'Relic')]
      .filter((t) => !t.startsWith('0 '));
    return `On the table: ${parts.join(', ')}.`;
  }
  // spells, tricks: what they do (Traps counted on their own)
  const traps = kind === 'tricks' ? table.filter((c) => c.subtype === 'Trap') : [];
  const rest = table.filter((c) => !traps.includes(c));
  const rem = rest.filter(removes), drw = rest.filter((c) => !removes(c) && draws(c));
  const pmp = rest.filter((c) => !removes(c) && !draws(c) && pumps(c));
  const sav = rest.filter((c) => !removes(c) && !draws(c) && !pumps(c) && saves(c));
  const parts = [];
  if (rem.length) parts.push(`${rem.length} that ${rem.length === 1 ? 'gets' : 'get'} rid of a creature`);
  if (drw.length) parts.push(`${drw.length} that ${drw.length === 1 ? 'draws' : 'draw'} cards`);
  if (pmp.length) parts.push(`${pmp.length} that ${pmp.length === 1 ? 'makes' : 'make'} creatures stronger`);
  if (sav.length) parts.push(`${sav.length} that ${sav.length === 1 ? 'saves or protects' : 'save or protect'}`);
  const other = rest.length - rem.length - drw.length - pmp.length - sav.length;
  if (traps.length) parts.push(plural(traps.length, 'Trap'));
  if (other > 0 && parts.length) parts.push(plural(other, 'other'));
  return parts.length ? `On the table: ${parts.join(', ')}.` : `On the table: ${plural(n, 'card')}.`;
}

/** 💡 advice for seat p in the round now on: { kind, lines } (lines: one to three plain sentences that name no card). */
export function adviceFor(st, p) {
  const kind = st.kind;
  const pool = (st.pools[p] || []).map((id) => BY_ID[id]).filter(Boolean);
  const table = (st.table || []).map((id) => BY_ID[id]).filter(Boolean);
  return { kind, lines: [(st.ultra && ULTRA_ADVICE[kind]) || ROUND_ADVICE[kind], needFor(kind, pool, table), tableSummary(kind, table)].filter(Boolean) };
}
