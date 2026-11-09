// The tournament lab (2026-11-08): bots with their own deck and play style
// play SATTC Ultra duels in winner-stays tournaments, and the winners' decks
// and styles evolve (a genetic algorithm), to find what the game rewards:
// a deck, card or style that always wins, loops that never end (endless
// Energy, cards or extra turns), and cards nobody keeps.
//
// Each generation every bot plays GAMES duels against random others (both
// seats). The better half (by win rate, smoothed over generations) stays;
// the rest are replaced by children of survivors (1–3 cards swapped, the
// style nudged, now and then two survivors' decks crossed) and a few
// random newcomers. Decks come from the Ultra pool and keep their factions;
// styles are ai.js STYLES weights. Games that look broken are kept: ones that
// don't finish, chains of extra turns, hands or Life that run away.
//
//   node tools/lab.mjs [generations=20] [population=24] [games=8] [seed=1]
//   PAIR=ember,umbral   every bot plays those two factions (to see what a pair evolves into)
//   BENCH=20            games each champion plays against each starter at the end
// Writes .phone-tests/lab/run-<seed>.json (with the last survivors) and run-<seed>.md.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { newGame, apply, actor, power } from '../js/engine.js';
import { chooseAction, STYLES, STYLE_KEYS } from '../js/ai.js';
import { BY_ID, FACTION_ORDER, RULES, ULTRA_POOL, ULTRA_STARTERS, ULTRA_V, ULTRA_V2, legendFor } from '../js/cards.js';
import { cardList, validate } from '../js/decks.js';

const [GENS, POP, GAMES, SEED] = [20, 24, 8, 1].map((d, i) => Number(process.argv[2 + i] || d));
// rule switches to try (cards.js ULTRA_V2), e.g. KNOBS='{"growthCap":true}'; the run's files get a tag
if (process.env.KNOBS) Object.assign(ULTRA_V2, JSON.parse(process.env.KNOBS));
const PAIR = process.env.PAIR ? process.env.PAIR.split(',') : null, BENCH = Number(process.env.BENCH ?? 20);
const TAG = (process.env.KNOBS ? `-${Object.entries(JSON.parse(process.env.KNOBS)).map(([k, v]) => `${k}${v}`).join('-')}` : '') + (PAIR ? `-${PAIR.join('-')}` : '');
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '.phone-tests', 'lab');
mkdirSync(OUT, { recursive: true });

// ── randomness (all of it seeded, so a run can be repeated) ─────────
let rs = SEED >>> 0;
const R = () => (rs = (Math.imul(rs, 1103515245) + 12345) >>> 0) / 4294967296;
const pick = (xs) => xs[Math.floor(R() * xs.length)];
const gauss = () => Math.sqrt(-2 * Math.log(R() + 1e-12)) * Math.cos(2 * Math.PI * R());

// ── decks ───────────────────────────────────────────────────────────
const fits = (c, fs) => c.factions.length > 0 && c.factions.every((f) => fs.includes(f));
const poolFor = (fs) => ULTRA_POOL.filter((c) => fits(c, fs));
const maxOf = (c) => (c.legendary ? 1 : RULES.maxCopies);
const total = (counts) => Object.values(counts).reduce((a, b) => a + b, 0);
function addOne(counts, pool, wantCreature = null) {
  for (let tries = 0; tries < 60; tries++) {
    const c = pick(wantCreature == null ? pool : pool.filter((x) => (x.type === 'creature') === wantCreature));
    if (c && (counts[c.id] || 0) < maxOf(c)) { counts[c.id] = (counts[c.id] || 0) + 1; return true; }
  }
  return false;
}
function randomDeck(fs) {
  const pool = poolFor(fs), counts = {};
  while (total(counts) < 16) if (!addOne(counts, pool, true)) break;
  while (total(counts) < RULES.deckSize) if (!addOne(counts, pool)) break;
  return counts;
}
function mutateDeck(counts, fs) {
  const c2 = { ...counts }, pool = poolFor(fs);
  for (let k = 1 + Math.floor(R() * 3); k > 0; k--) {
    const out = pick(Object.keys(c2).flatMap((id) => Array(c2[id]).fill(id)));
    c2[out] -= 1;
    if (!c2[out]) delete c2[out];
    addOne(c2, pool);
  }
  return c2;
}
function crossDecks(a, b, fs) {
  const all = [...cardList(a), ...cardList(b)], counts = {};
  for (let guard = 0; total(counts) < RULES.deckSize && guard < 500; guard++) {
    const id = pick(all);
    if ((counts[id] || 0) < maxOf(BY_ID[id])) counts[id] = (counts[id] || 0) + 1;
  }
  while (total(counts) < RULES.deckSize) addOne(counts, poolFor(fs));
  return counts;
}

// ── styles ──────────────────────────────────────────────────────────
const EXTRA = new Set(['width', 'tall', 'combo', 'necro']);
function mutateStyle(st) {
  const s2 = { ...st };
  for (const k of STYLE_KEYS) {
    if (R() < 0.5) continue;
    if (EXTRA.has(k)) s2[k] = Math.min(2.5, Math.max(0, s2[k] + gauss() * 0.3));
    else s2[k] = Math.min(3, Math.max(0.3, s2[k] * Math.exp(gauss() * 0.25)));
  }
  return s2;
}
// the preset a style is closest to
const nearest = (st) => Object.entries(STYLES).reduce((m, [name, p]) => {
  const d = STYLE_KEYS.reduce((t, k) => t + (st[k] - p[k]) ** 2, 0);
  return d < m.d ? { name, d } : m;
}, { name: '', d: Infinity }).name;

// ── agents ──────────────────────────────────────────────────────────
let nextId = 1;
function agent(fs, counts, style, origin, parent = null) {
  const v = validate(counts, { ultra: true });
  if (!v.ok) return null;
  return { id: nextId++, fs, counts, style, origin, parent, born: gen, fit: null, w: 0, g: 0, allW: 0, allG: 0 };
}
const pairsOfFactions = PAIR ? [PAIR] : FACTION_ORDER.flatMap((a, i) => FACTION_ORDER.slice(i + 1).map((b) => [a, b]));
function newcomer() {
  for (let tries = 0; tries < 20; tries++) {
    const fs = pick(pairsOfFactions), name = pick(Object.keys(STYLES));
    const a = agent(fs, randomDeck(fs), { ...STYLES[name] }, `new ${name}`);
    if (a) return a;
  }
  throw new Error('could not build a random deck');
}

// ── a duel ──────────────────────────────────────────────────────────
const flagged = [];
const totals = { games: 0, rounds: 0, unfinished: 0 };
function duel(A, B, seed) {
  const setup = { seed, players: [A, B].map((x) => ({ name: `#${x.id}`, deck: cardList(x.counts) })), startEnergy: RULES.startEnergy, ultra: ULTRA_V };
  let s = newGame(setup);
  let x = seed >>> 0;
  const rand = () => (x = (Math.imul(x, 1103515245) + 12345) >>> 0) / 4294967296;
  const peak = { hand: 0, life: 0, extra: 0, tokens: 0 };
  let steps = 0;
  for (; steps < 4000 && s.phase !== 'over'; steps++) {
    const p = s.phase === 'mulligan' ? s.players.findIndex((P) => !P.mull) : actor(s);
    const r = apply(s, chooseAction(s, p, { rand, noise: 0.15, style: (p === 0 ? A : B).style }));
    if (r.error) throw new Error(r.error);
    s = r.state;
    for (const e of s.events) if (e.k === 'token') peak.tokens++;
    for (const P of s.players) { peak.hand = Math.max(peak.hand, P.hand.length); peak.life = Math.max(peak.life, P.life); }
    if (s.log.length && /takes an extra turn/.test(s.log[s.log.length - 1].text)) peak.extra++;
  }
  const rounds = s.players[s.first].turns;
  totals.games++; totals.rounds += rounds;
  const why = [];
  if (s.phase !== 'over') { why.push(`no end after ${steps} moves`); totals.unfinished++; }
  if (peak.extra >= 3) why.push(`${peak.extra} extra turns`);
  if (peak.hand >= 14) why.push(`a hand of ${peak.hand}`);
  if (peak.life >= 60) why.push(`${peak.life} Life`);
  if (peak.tokens >= 40) why.push(`${peak.tokens} tokens`);
  if (rounds >= 25) why.push(`${rounds} rounds`);
  if (why.length && flagged.length < 30) flagged.push({ gen, why, seed, a: A.id, b: B.id, decks: setup.players.map((p) => p.deck), styles: [A.style, B.style] });
  return s.phase === 'over' ? s.winner : -1;
}

// ── the run ─────────────────────────────────────────────────────────
let gen = 0;
let pop = ULTRA_STARTERS.filter((d) => !PAIR || d.factions.every((f) => PAIR.includes(f))).map((d) => agent([...new Set(d.factions)], { ...d.counts }, { ...STYLES.balanced }, `starter ${d.name}`));
while (pop.length < POP) pop.push(newcomer());
const history = [];
const t0 = Date.now();
for (gen = 1; gen <= GENS; gen++) {
  for (const a of pop) { a.w = 0; a.g = 0; }
  for (let r = 0; r < GAMES / 2; r++) {
    const order = [...pop].sort(() => R() - 0.5);
    for (let i = 0; i + 1 < order.length; i += 2) {
      const [A, B] = [order[i], order[i + 1]];
      for (const [x, y] of [[A, B], [B, A]]) {
        const w = duel(x, y, (SEED * 1000003 + gen * 7919 + r * 104729 + i * 31 + (x === A ? 0 : 1)) | 0);
        x.g++; y.g++;
        if (w === 0) x.w++; else if (w === 1) y.w++;
      }
    }
  }
  for (const a of pop) {
    const now = a.g ? a.w / a.g : 0;
    a.fit = a.fit == null ? now : 0.5 * a.fit + 0.5 * now; // (smoothed: one lucky generation isn't enough)
    a.allW += a.w; a.allG += a.g;
  }
  pop.sort((x, y) => y.fit - x.fit);
  const keep = pop.slice(0, Math.ceil(POP / 2));
  history.push({
    gen, rounds: +(totals.rounds / totals.games).toFixed(1),
    top: keep.slice(0, 3).map((a) => ({ id: a.id, fit: +a.fit.toFixed(2), fs: a.fs, style: nearest(a.style), origin: a.origin })),
    elite: keep.map((a) => ({ id: a.id, counts: a.counts, style: a.style, fs: a.fs })),
  });
  console.log(`gen ${String(gen).padStart(2)}  best ${keep.slice(0, 3).map((a) => `#${a.id} ${a.fs.join('/')} ${nearest(a.style)} ${(a.fit * 100).toFixed(0)}%`).join(' · ')}  (${((Date.now() - t0) / 1000).toFixed(0)}s, ${totals.unfinished} unfinished)`);
  if (gen === GENS) { pop = keep.concat(pop.slice(keep.length)); break; }
  // the rest: children of the survivors (better ones more often), and a few newcomers
  const kids = [];
  while (keep.length + kids.length < POP) {
    if (R() < 0.12) { kids.push(newcomer()); continue; }
    const p = keep[Math.min(keep.length - 1, Math.floor(R() ** 1.6 * keep.length))];
    const mate = keep.find((q) => q !== p && q.fs.join() === p.fs.join() && R() < 0.5);
    const counts = mate && R() < 0.25 ? crossDecks(p.counts, mate.counts, p.fs) : mutateDeck(p.counts, p.fs);
    const kid = agent(p.fs, counts, R() < 0.7 ? mutateStyle(p.style) : { ...p.style }, p.origin, p.id);
    if (kid) kids.push(kid);
  }
  pop = keep.concat(kids);
}

// ── what it found ───────────────────────────────────────────────────
const late = history.slice(-Math.min(8, history.length));
const copies = {}, eliteDecks = late.flatMap((h) => h.elite);
for (const e of eliteDecks) for (const [id, n] of Object.entries(e.counts)) copies[id] = (copies[id] || 0) + n;
const per = (id) => (copies[id] || 0) / eliteDecks.length; // copies per elite deck
const factionsSeen = new Set(eliteDecks.flatMap((e) => e.fs));
const loved = Object.keys(copies).sort((a, b) => per(b) - per(a)).slice(0, 15);
const ignored = ULTRA_POOL.filter((c) => c.factions.some((f) => factionsSeen.has(f)) && fits(c, [...factionsSeen]) && !copies[c.id]).map((c) => c.id);
const styleAvg = Object.fromEntries(STYLE_KEYS.map((k) => [k, +(eliteDecks.reduce((t, e) => t + e.style[k], 0) / eliteDecks.length).toFixed(2)]));
const factionCount = {};
for (const e of eliteDecks) factionCount[e.fs.join('/')] = (factionCount[e.fs.join('/')] || 0) + 1;

// the champions against the starters, played as they are (the ordinary bot)
const champs = pop.slice(0, 3);
const starters = ULTRA_STARTERS.map((d) => ({ id: d.name, counts: d.counts, style: null }));
const bench = champs.map((c) => {
  const vs = starters.map((st) => {
    let w = 0, n = 0;
    for (let k = 0; k < BENCH; k++) {
      const seed = (SEED * 77 + c.id * 1009 + k * 13 + st.id.length) | 0;
      const win = k % 2 ? duel(st, c, seed) : duel(c, st, seed);
      n++;
      if ((k % 2 ? win === 1 : win === 0)) w++;
    }
    return { vs: st.id, pct: Math.round((100 * w) / n) };
  });
  return { id: c.id, fs: c.fs, style: nearest(c.style), legend: BY_ID[legendFor(cardList(c.counts))].name, vs };
});

const deckText = (counts) => Object.entries(counts).sort((a, b) => b[1] - a[1] || BY_ID[a[0]].cost - BY_ID[b[0]].cost).map(([id, n]) => `${n > 1 ? `${n}× ` : ''}${BY_ID[id].name}`).join(', ');
const md = [
  `# Tournament lab, run ${SEED}${process.env.KNOBS ? ` (${process.env.KNOBS})` : ''}${PAIR ? ` (${PAIR.join('/')} only)` : ''}`,
  `${GENS} generations of ${POP} bots, ${GAMES} duels each per generation: ${totals.games} games, ${(totals.rounds / totals.games).toFixed(1)} rounds a game, ${totals.unfinished} unfinished, ${((Date.now() - t0) / 1000).toFixed(0)}s.`,
  '',
  '## The champions',
  ...champs.map((c, i) => `${i + 1}. #${c.id} (${c.fs.join('/')}, plays like "${nearest(c.style)}", from ${c.origin}; ${Math.round(c.fit * 100)}% in its last generations; Legend ${bench[i].legend})\n   - against the starters: ${BENCH ? bench[i].vs.map((v) => `${v.vs} ${v.pct}%`).join(', ') : '(not played)'}\n   - deck: ${deckText(c.counts)}`),
  '',
  '## Factions of the last generations’ survivors',
  Object.entries(factionCount).sort((a, b) => b[1] - a[1]).map(([f, n]) => `${f} ${n}`).join(' · '),
  '',
  '## Cards evolution keeps (copies per surviving deck)',
  loved.map((id) => `${BY_ID[id].name} ${per(id).toFixed(2)}`).join(' · '),
  '',
  '## Cards no survivor kept (of the factions they play)',
  ignored.map((id) => BY_ID[id].name).join(', ') || 'none',
  '',
  '## The survivors’ average style',
  Object.entries(styleAvg).map(([k, v]) => `${k} ${v}`).join(' · '),
  '',
  '## Games that looked broken',
  flagged.length ? flagged.map((f) => `- gen ${f.gen}, #${f.a} vs #${f.b}, seed ${f.seed}: ${f.why.join(', ')}`).join('\n') : 'none',
].join('\n');
writeFileSync(join(OUT, `run-${SEED}${TAG}.md`), md);
writeFileSync(join(OUT, `run-${SEED}${TAG}.json`), JSON.stringify({ args: { GENS, POP, GAMES, SEED }, totals, history: history.map(({ elite, ...h }) => h), champs: champs.map((c) => ({ id: c.id, fs: c.fs, style: c.style, counts: c.counts, origin: c.origin })), survivors: history[history.length - 1].elite, bench, loved, ignored, styleAvg, flagged }, null, 1));
console.log('\n' + md);
