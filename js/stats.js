// The Collective — what happened in a finished game, how the bot rates your
// decisions in it, and how your draft picks compare with its pick ratings.
// No screen here (insights.js draws all of it), so tools/test-stats.mjs runs
// it in node. Finished games and drafts are kept on this phone.
//
// A game is its setup and its move list (engine.js), so it is read by
// replaying it: every move's events say who hit whom, with which card, and
// what died. The review replays it again and, at each of your attacks,
// blocks, fight Tricks and ends of turn, asks the bot (ai.js) what it would
// have done and how much better that leaves you by its own scoring. It is a
// chess engine's game review with a much simpler engine, so it speaks as
// "the bot", never as the truth.

import { BY_ID, RULES, isTrick } from './cards.js';
import { apply, costOf, forcedBlocks, legalActions, newGame } from './engine.js';
import { attackCandidates, chooseAction, evaluate, quickBlocks, scoreAfterFight } from './ai.js';
import { pickScore, replay as replayDraft } from './draft.js';
import * as Decks from './decks.js';

// Positions without their log are much cheaper to copy, and a move's own
// log lines are then all the log there is.
const lean = (s) => ({ ...s, log: [], events: [] });
const step = (s, a) => { const r = apply(lean(s), a); return r.error ? null : r.state; };
const isToken = (cid) => !!BY_ID[cid]?.token;
const r2 = (x) => Math.round(x * 100) / 100;

// Who is ahead, by the bot's own scoring, from -1 (lost) to 1 (won). The
// scoring's "whose turn is it" terms are left out, so the line doesn't
// zigzag from one turn to the next.
const SCALE = 25;
export function advantage(s, me) {
  if (s.phase === 'over') return s.winner === me ? 1 : -1;
  if (s.players[me].out) return -1;
  return Math.tanh(evaluate({ ...s, active: -1 }, me) / SCALE);
}

// The two factions a deck has the most cards of (one if it is nearly all one).
export function deckFactions(cids) {
  const n = {};
  for (const id of cids) for (const f of BY_ID[id]?.factions || []) n[f] = (n[f] || 0) + 1;
  const fs = Object.entries(n).sort((a, b) => b[1] - a[1]);
  return fs.filter(([, k], i) => i === 0 || (i === 1 && k >= 5)).map(([f]) => f);
}

// ── one game ─────────────────────────────────────────────────────────
/**
 * Replay a game and count what happened: for every player their damage,
 * kills, plays, blocks, Energy and lowest Life; for `me` also each card's
 * part (drawn, played, damage, kills) and the opponents' cards that hurt
 * them most; the Life and "who's ahead" lines turn by turn; the fights; and
 * the moments worth telling. Plain data, ready to save.
 */
export function analyzeGame(setup, actions, { me = 0 } = {}) {
  const n = setup.players.length;
  let s = newGame(setup);
  const first = s.first;
  const pl = setup.players.map((p) => ({
    name: p.name, dealt: 0, taken: 0, paid: 0, gained: 0, kills: 0, lost: 0, // (paid: Life lost to your own cards, or to an empty deck)
    plays: 0, creatures: 0, spells: 0, tricks: 0, traps: 0, relics: 0, sprung: 0,
    attacks: 0, swings: 0, blocks: 0, drawn: 0, full: 0, crown: 0, spent: 0, had: 0,
    low: s.players[0].life, big: 0, out: null, mull: null, conceded: false, // (the Life everyone starts with)
  }));
  const cards = setup.players.map(() => ({})); // cid -> { p: played, dmg, k: kills }
  const card = (p, cid) => (cards[p][cid] ||= { p: 0, dmg: 0, k: 0 });
  const seen = setup.players.map(() => new Set()); // cards each player held
  const nem = {}; // opponents' cards: damage they did to me
  const life = [s.players.map((P) => P.life)];
  const adv = [0];
  const marks = [null]; // the turn each checkpoint closes: { t, p, k }
  const fights = [];
  const outs = [];
  let how = null;

  for (const a of actions) {
    const before = s;
    const after = step(before, a);
    if (!after) continue; // the table skipped it too
    s = after;
    let played = null, fight = null;
    const lastHit = new Map(); // creature -> what last damaged it in this move
    // whose a card was when it acted (cards leaving play forget their controller)
    const ctrlOf = (uid) => {
      const b = before.cards[uid], c = after.cards[uid];
      if (b?.zone === 'board' && b.ctrl != null) return b.ctrl;
      if (c?.zone === 'board' && c.ctrl != null) return c.ctrl;
      if (played?.uid === uid) return played.p;
      return (c || b)?.owner ?? null;
    };
    const cidOf = (uid) => (before.cards[uid]?.zone === 'board' ? before.cards[uid].cid : after.cards[uid]?.cid ?? before.cards[uid]?.cid);
    const credit = (by, src, victim, dmg) => {
      if (by == null || by === victim) return;
      pl[by].dealt += dmg;
      const cid = src != null ? cidOf(src) : null;
      if (cid && !isToken(cid)) {
        card(by, cid).dmg += dmg;
        if (victim === me) nem[cid] = (nem[cid] || 0) + dmg;
      }
    };
    const evs = after.events;
    for (let k = 0; k < evs.length; k++) {
      const e = evs[k];
      switch (e.k) {
        case 'play': {
          const cid = before.cards[e.uid]?.cid ?? after.cards[e.uid]?.cid;
          const d = BY_ID[cid];
          if (!d) break;
          played = { uid: e.uid, cid, p: e.p };
          const P = pl[e.p];
          P.plays++;
          if (d.type === 'creature') P.creatures++;
          else if (d.type === 'relic') P.relics++;
          else if (d.subtype === 'Trap') P.traps++;
          else if (isTrick(d)) P.tricks++;
          else P.spells++;
          if (!d.token) card(e.p, cid).p++;
          break;
        }
        case 'dmg': {
          const src = e.src ?? played?.uid ?? null;
          if (src != null) lastHit.set(e.uid, src);
          break;
        }
        case 'hitPlayer': {
          const src = e.src ?? (played && played.p !== e.p ? played.uid : null);
          const by = src != null ? ctrlOf(src) : null;
          if (by === e.p) pl[e.p].paid += e.n; // (your own Unstable creature erupting)
          credit(by, src, e.p, e.n);
          if (fight && e.p === fight.d) fight.hit += e.n;
          break;
        }
        case 'life': {
          if (e.n > 0) { pl[e.p].gained += e.n; break; }
          pl[e.p].taken -= e.n;
          // Life lost without damage (the Drowned Clock, a tithe): count it for whoever made it happen
          const prev = evs[k - 1];
          if (!(prev?.k === 'hitPlayer' && prev.p === e.p && prev.n === -e.n)) {
            const by = e.by ?? (played && played.p !== e.p ? played.p : after.active !== e.p ? after.active : null);
            const own = e.by === e.p || (e.by == null && played?.p === e.p) || (by == null && after.log.some((l) => l.p === e.p && /no cards left/.test(l.text)));
            if (own) pl[e.p].paid -= e.n;
            else if (by != null && by !== e.p) pl[by].dealt -= e.n;
          }
          break;
        }
        case 'die': {
          if (pl[e.ctrl]) pl[e.ctrl].lost++;
          let src = lastHit.get(e.uid) ?? null;
          let by = src != null ? ctrlOf(src) : null;
          if (src == null && played && played.p !== e.ctrl) { src = played.uid; by = played.p; } // destroyed by a spell
          if (by != null && by !== e.ctrl) {
            pl[by].kills++;
            const cid = cidOf(src);
            if (cid && !isToken(cid)) card(by, cid).k++;
          }
          if (fight) fight.deaths.push({ cid: e.cid, p: e.ctrl });
          break;
        }
        case 'attack': pl[a.p].swings++; break;
        case 'block': { const b = ctrlOf(e.uid); if (b != null) pl[b].blocks++; break; }
        case 'trap': pl[e.p].sprung++; break;
        case 'crownDraw': pl[e.p].crown++; break;
        case 'draw': pl[e.p].drawn++; break;
        case 'turn': pl[e.p].had += after.players[e.p].energy; break;
        case 'fight':
          fight = { t: before.turn, k: before.players[e.a].turns, a: e.a, d: e.d, att: (before.combat?.att || []).map(cidOf), hit: 0, deaths: [] };
          fights.push(fight);
          break;
      }
    }
    if (a.t === 'attack') pl[a.p].attacks++;
    if (a.t === 'mulligan') pl[a.p].mull = a.redraw ? 'redrew' : 'kept';
    if (a.t === 'concede') pl[a.p].conceded = true;
    if (a.t === 'play' || a.t === 'use' || a.t === 'phoenix') {
      const d = before.players[a.p].energy - after.players[a.p].energy;
      if (d > 0) pl[a.p].spent += d;
    }
    for (const l of after.log) if (l.p != null && /hand is full/.test(l.text)) pl[l.p].full++;
    if (fight && fight.hit > pl[fight.a].big) pl[fight.a].big = fight.hit;
    for (const P of after.players) {
      pl[P.i].low = Math.min(pl[P.i].low, Math.max(0, P.life));
      if (after.phase !== 'mulligan') for (const u of P.hand) seen[P.i].add(after.cards[u].cid);
      if (P.out && !before.players[P.i].out) {
        const t = { t: before.turn, p: before.active, k: before.players[before.active].turns };
        pl[P.i].out = t;
        outs.push({ ...t, v: P.i });
        // how the last one fell, said from the winner's side
        if (after.phase === 'over') {
          // (attackers' damage counts as the fight even when a Trick or an ability went first in the same move)
          const byFight = !!before.combat && (after.events || []).some((e) => e.k === 'hitPlayer' && e.p === P.i && e.src != null && before.combat.att.includes(e.src));
          how = a.t === 'concede' ? 'concede'
            : byFight ? 'fight'
            : a.t === 'play' || a.t === 'use' ? 'spell'
              : a.t === 'end' ? (after.log.some((l) => /no cards left/.test(l.text)) ? 'deck' : 'effect')
                : 'fight';
        }
      }
    }
    // a checkpoint at each turn's end (and the game's)
    if (a.t === 'end' || (after.phase === 'over' && before.phase !== 'over')) {
      life.push(after.players.map((P) => Math.max(0, P.life)));
      adv.push(r2(advantage(after, me)));
      marks.push({ t: before.turn, p: before.active, k: before.players[before.active].turns });
    }
  }

  const players = pl.map((P, i) => {
    const deck = setup.players[i].deck || [];
    const mvp = Object.entries(cards[i]).map(([cid, c]) => ({ cid, dmg: c.dmg, k: c.k, v: c.dmg + c.k * 3 }))
      .filter((x) => x.v > 0).sort((x, y) => y.v - x.v)[0] || null;
    return { ...P, life: Math.max(0, s.players[i].life), turns: s.players[i].turns, fac: deckFactions(deck), mvp };
  });
  const deckCounts = Object.fromEntries((setup.players[me].deck || []).filter((cid) => !isToken(cid)).map((cid) => [cid, 1]));
  const mine = {};
  for (const [cid, c] of Object.entries(cards[me])) mine[cid] = [c.p, c.dmg, c.k];
  const rec = {
    v: 1, n, me, first, winner: s.winner, over: s.phase === 'over', how, turns: s.turn, ...(setup.ultra ? { ultra: true } : {}),
    rounds: Math.max(0, ...s.players.map((P) => P.turns)),
    players, life, adv, marks, outs,
    fights: [...fights].sort((x, y) => y.hit - x.hit || y.deaths.length - x.deaths.length).slice(0, 6),
    deck: Decks.encode(deckCounts),
    seen: [...seen[me]].filter((cid) => !isToken(cid)),
    mine,
    nem: Object.entries(nem).sort((x, y) => y[1] - x[1]).slice(0, 3),
  };
  rec.moments = momentsOf(rec);
  return rec;
}

// The few things worth telling about a game, in the order they happened:
// the biggest hit, the turn that swung it most (by the bot's reading), the
// turning point after which the winner stayed ahead (if they had been
// behind), players going out, and a comeback from low Life. Each is data
// ({ k, t, … }); insights.js words it.
function momentsOf(rec) {
  const out = [];
  const big = rec.fights[0];
  if (big && big.hit >= 4) out.push({ k: 'hit', t: big.t, p: big.a, kk: big.k, v: big.d, n: big.hit, cids: big.att, deaths: big.deaths });
  let swing = null;
  for (let i = 1; i < rec.adv.length; i++) {
    const d = rec.adv[i] - rec.adv[i - 1];
    if (!rec.marks[i] || Math.abs(rec.adv[i]) === 1) continue; // the game's last move is no swing
    if (!swing || Math.abs(d) > Math.abs(swing.d)) swing = { d, i };
  }
  if (swing && Math.abs(swing.d) >= 0.3) {
    const m = rec.marks[swing.i];
    const f = rec.fights.find((x) => x.t === m.t);
    out.push({ k: 'swing', t: m.t, p: m.p, kk: m.k, d: r2(swing.d), fight: f ? { a: f.a, d: f.d, hit: f.hit, deaths: f.deaths } : null });
  }
  // from which checkpoint on the final result's side stayed ahead
  if (rec.winner != null) {
    const sign = rec.winner === rec.me ? 1 : -1;
    let from = null;
    for (let i = rec.adv.length - 1; i >= 1; i--) {
      if (rec.adv[i] * sign > 0.05) from = i;
      else break;
    }
    // only a real turning point: the other side was ahead before it
    const flipped = from != null && rec.adv.slice(1, from).some((x) => x * sign < -0.05);
    if (flipped && from < rec.adv.length - 1 && rec.marks[from]) {
      const m = rec.marks[from];
      if (!out.some((x) => x.k === 'swing' && x.t === m.t)) out.push({ k: 'lead', t: m.t, p: m.p, kk: m.k, won: sign > 0 });
    }
  }
  for (const o of rec.outs) if (rec.n > 2 && o.v !== rec.winner) out.push({ k: 'out', t: o.t, p: o.p, kk: o.k, v: o.v });
  const w = rec.winner != null ? rec.players[rec.winner] : null;
  if (w && w.low <= 5 && !w.conceded) out.push({ k: 'comeback', t: rec.turns, p: rec.winner, n: w.low });
  return out.sort((x, y) => x.t - y.t);
}

// ── the bot's review of your decisions ──────────────────────────────
// Each judged decision has a loss: the winning chances it gave up next to
// the bot's choice, in percentage points. The bot's score becomes a chance on
// the same curve as "Your chances" (advantage above). So a move that leaves
// you 99% to win is no blunder, however much a bolder one would have scored,
// and a move in a close game that turns 60% into 40% is. This is how chess
// sites grade (Lichess: 5, 10 and 15 points; reviews before 2026-11-10
// graded the raw score, and say so with no `v`). Accuracy averages a score
// per move that falls off quickly with the points lost.
export const REVIEW_V = 3; // (3, 2026-11-10: the cards you play each turn are judged too)
export const GRADES = [
  { min: 15, key: 'blunder', name: 'Blunder' },
  { min: 10, key: 'mistake', name: 'Mistake' },
  { min: 5, key: 'inaccuracy', name: 'Inaccuracy' },
];
export const gradeOf = (loss) => GRADES.find((g) => loss >= g.min) || null;
const accOf = (loss) => 100 * Math.exp(-loss / ACC_K);
const ACC_K = 10; // (points of chances: a 5-point slip scores 61, a 15-point blunder 22. Lichess's own curve, 81 and 51, left a random player at 78%.)
const GREAT_TRICK = 5; // a Trick that won this many points of winning chances over holding it
// A move that loses (or wins) the game scores ±1e6: a chance of 0 (or 1). A
// choice where every move leaves the game as good as settled (under 3% or
// over 97% either way) is no choice at all: it isn't judged, so a won game
// played out slowly, or a lost one played out at random, doesn't count.
const chance = (v) => (v >= 1e5 ? 1 : v <= -1e5 ? 0 : (1 + Math.tanh(v / SCALE)) / 2);
const lossOf = (best, mine) => r2(Math.max(0, 100 * (chance(best) - chance(mine))));
const decided = (...vs) => vs.every((v) => chance(v) <= 0.03) || vs.every((v) => chance(v) >= 0.97);

// What the bot would do, as data for insights.js to word.
function sayAction(s, a) {
  const cid = (u) => s.cards[u]?.cid;
  switch (a.t) {
    case 'play': return { t: 'play', cid: cid(a.uid) };
    case 'use': return { t: 'use', cid: cid(a.uid) };
    case 'attack': return { t: 'attack', cids: a.att.map(cid), v: a.target };
    case 'block': return a.blocks.length ? { t: 'block', pairs: a.blocks.map(([b, x]) => [cid(b), cid(x)]) } : { t: 'noblock' };
    case 'phoenix': return { t: 'phoenix' };
    case 'dig': return { t: 'dig' };
    case 'unhex': return { t: 'unhex', cid: cid(a.uid) };
    case 'pass': return { t: 'pass' };
    default: return { t: 'end' };
  }
}

// The ways the bot thinks about blocking (as in ai.js), as block actions.
function blockChoices(s, me) {
  const seen = new Set(), out = [];
  for (const blocks of [forcedBlocks(s, s.combat), quickBlocks(s, me), quickBlocks(s, me, { gangUp: false }),
    quickBlocks(s, me, { chump: 'all' }), quickBlocks(s, me, { chump: 'none' })]) {
    const key = JSON.stringify(blocks);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ t: 'block', p: me, blocks });
  }
  return out;
}

// Did `me` play a Trick (or use an ability) later in the fight `i` is part of?
function trickLater(actions, i, me) {
  for (let j = i + 1; j < actions.length; j++) {
    const b = actions[j];
    if (b.t === 'end' || b.t === 'attack') return false;
    if (b.p === me && (b.t === 'play' || b.t === 'use')) return true;
  }
  return false;
}

function judge(s, a, me, actions, i) {
  const base = lean(s);
  const when = { t: s.turn, p: s.active, kk: s.players[s.active].turns };
  const P = s.players[me];
  if (s.phase === 'mulligan' && a.t === 'mulligan') {
    const bot = chooseAction(base, me, { noise: 0 });
    return { k: 'mull', ...when, same: !!bot.redraw === !!a.redraw, redraw: !!a.redraw };
  }
  if (s.phase === 'main' && s.active === me && a.t === 'end') {
    const left = P.energy;
    if (legalActions(base, me).length <= 1) return null; // nothing else to do
    const bot = chooseAction(base, me, { noise: 0 });
    // (cards it would still play are judged with the turn's plays, judgePlays: here, an attack you didn't make)
    if (bot.t === 'end' || bot.t !== 'attack') return { k: 'turn', ...when, loss: 0, left };
    // Energy kept for a Trick in hand is a plan the bot's scoring doesn't see,
    // so then only an attack it would have made (which costs no Energy) counts.
    const held = P.hand.some((u) => isTrick(BY_ID[s.cards[u].cid]) && costOf(s, me, s.cards[u]) <= left);
    if (held && bot.t !== 'attack') return { k: 'turn', ...when, loss: 0, left, held: true };
    const t = step(base, bot);
    if (!t) return null;
    const v = bot.t === 'attack' ? scoreAfterFight(t, me) : evaluate(t, me), now = evaluate(base, me);
    if (decided(v, now)) return null;
    return { k: 'turn', ...when, loss: lossOf(v, now), left, alt: sayAction(s, bot) };
  }
  if (s.phase === 'main' && a.t === 'attack') {
    const t = step(base, a);
    if (!t) return null;
    const mine = scoreAfterFight(t, me);
    let best = evaluate(base, me), alt = { t: 'end' }; // holding back
    for (const c of attackCandidates(base, me)) {
      const t2 = step(base, c);
      if (!t2) continue;
      const v = scoreAfterFight(t2, me);
      if (v > best) { best = v; alt = c; }
    }
    if (decided(best, mine)) return null;
    const loss = lossOf(best, mine);
    return { k: 'attack', ...when, loss, cids: a.att.map((u) => s.cards[u].cid), alt: loss > 0.5 ? (alt.t === 'end' ? { t: 'hold' } : sayAction(s, alt)) : null };
  }
  if (s.phase === 'combat' && a.t === 'block') {
    const t = step(base, a);
    if (!t) return null;
    // a Trick of yours later in this fight: the block was part of a plan, judged with the Trick
    if (trickLater(actions, i, me)) return { k: 'block', ...when, loss: 0, planned: true };
    const mine = scoreAfterFight(t, me);
    let best = mine, alt = null;
    for (const b of blockChoices(base, me)) {
      const t2 = step(base, b);
      if (!t2) continue;
      const v = scoreAfterFight(t2, me);
      if (v > best + 1e-6) { best = v; alt = b; }
    }
    if (decided(best, mine)) return null;
    const loss = lossOf(best, mine);
    return { k: 'block', ...when, loss, alt: alt && loss > 0.5 ? sayAction(s, alt) : null };
  }
  if (s.phase === 'combat' && (a.t === 'play' || a.t === 'use')) {
    const t = step(base, a);
    if (!t) return null;
    const v = scoreAfterFight(t, me);
    let alt = -Infinity;
    if (s.combat.step === 'block') { // before blocking: against the best plain block
      for (const b of blockChoices(base, me)) { const t2 = step(base, b); if (t2) alt = Math.max(alt, scoreAfterFight(t2, me)); }
    } else {
      const t2 = step(base, { t: 'pass', p: me });
      if (t2) alt = scoreAfterFight(t2, me);
    }
    if (!Number.isFinite(alt) || decided(v, alt)) return null;
    return { k: 'trick', ...when, cid: s.cards[a.uid].cid, gain: r2(100 * (chance(v) - chance(alt))), loss: lossOf(alt, v) };
  }
  return null;
}

// The cards you played on a turn (and abilities used, Digs, Hexes broken),
// against the bot's own: both put on the turn's starting position, with no
// fights, and the two positions compared. Attacks, blocks and fight Tricks are
// judged on their own, so nothing counts twice. `i`: the turn's first move.
const PLAYS = new Set(['play', 'use', 'dig', 'unhex', 'phoenix', 'rite']);
function judgePlays(s, me, actions, i) {
  const when = { t: s.turn, p: s.active, kk: s.players[s.active].turns };
  // your main-phase moves this turn, in order (walking the real game to know which were in a fight)
  const mine = [];
  let t = s, end = null, inFights = 0;
  const fallen = new Set(); // creatures your fights this turn took off the table (either side)
  for (let j = i; j < actions.length; j++) {
    const b = actions[j];
    if (b.p === me && b.t === 'end') { end = t; break; }
    if (b.p === me && t.phase === 'main' && t.active === me && PLAYS.has(b.t)) mine.push(b);
    const n = step(t, b) || t;
    if (b.p === me && t.phase === 'combat') inFights += Math.max(0, t.players[me].energy - n.players[me].energy); // (Energy you spent in fights)
    if (b.t === 'attack' || t.phase === 'combat') for (const Q of t.players) for (const u of Q.board) if (!n.players.some((R) => R.board.includes(u))) fallen.add(u);
    t = n;
    if (t.phase === 'over' || t.active !== me) break;
  }
  if (!end) return null; // (the game ended in the turn)
  // Energy kept for a Trick in hand: a plan the bot's scoring doesn't see
  const E = end.players[me];
  if (E.hand.some((u) => isTrick(BY_ID[end.cards[u].cid]) && costOf(end, me, end.cards[u]) <= E.energy)) return null;
  const base = lean(s);
  let u = base;
  for (const b of mine) u = step(u, b) || u; // (a play that needed a fight's outcome is left out)
  // the bot's own plays from the same start: no attacking (as if it had attacked already),
  // and without the Energy you spent in fights (that went to Tricks, judged on their own)
  let v = inFights ? { ...base, players: base.players.map((Q) => (Q.i === me ? { ...Q, energy: Math.max(0, Q.energy - inFights) } : Q)) } : base;
  const bot = [];
  for (let k = 0; k < 15; k++) {
    const noAttack = { ...v, players: v.players.map((Q) => (Q.i === me ? { ...Q, attackedOn: v.turn } : Q)) };
    const a = chooseAction(noAttack, me, { noise: 0 });
    if (!PLAYS.has(a.t)) break;
    const n = step(v, a);
    if (!n || n.phase !== 'main' || n.active !== me) break;
    bot.push(a);
    v = n;
  }
  if (!mine.length && !bot.length) return null;
  // the same cards as the bot's (in another order, or after a fight): agreed
  const key = (xs, st) => xs.map((x) => `${x.t}:${x.uid != null ? st.cards[x.uid]?.cid : ''}`).sort().join('|');
  if (key(mine, s) === key(bot, s)) return { k: 'plays', ...when, loss: 0, mine: mine.map((b) => sayAction(s, b)), alt: null };
  // (what your fights killed is gone in both: a Spell on a creature that died in the fight anyway earns nothing)
  const after = (st) => (fallen.size ? { ...st, players: st.players.map((Q) => ({ ...Q, board: Q.board.filter((x) => !fallen.has(x)) })) } : st);
  const vMine = evaluate(after(u), me), vBot = evaluate(after(v), me);
  if (decided(vBot, vMine)) return null;
  const loss = lossOf(vBot, vMine);
  return { k: 'plays', ...when, loss, mine: mine.map((b) => sayAction(s, b)), alt: loss > 0.5 ? { t: 'plays', moves: bot.map((b) => sayAction(s, b)) } : null };
}

/**
 * The bot's review of `me`'s decisions (async: it hands the phone back
 * every few milliseconds, so the screen stays smooth while it works).
 * Returns { acc, n, by: { turn, attack, block, trick: { n, ok } }, marks,
 * great, mull }: accuracy 0..100, the judged decisions by kind, the worst
 * few (graded), the Tricks that won fights, and the opening hand call.
 */
export async function reviewPlay(setup, actions, me, { pause = () => new Promise((r) => setTimeout(r, 0)), slice = 14, raw = false } = {}) {
  let s = newGame(setup);
  const all = [];
  let t0 = Date.now(), playsOn = -1;
  for (let i = 0; i < actions.length; i++) {
    const a = actions[i];
    if (a.p === me && s.phase !== 'over' && !s.players[me].out) {
      // a turn of yours begins: the cards you'll play on it
      if (s.phase === 'main' && s.active === me && s.turn !== playsOn) {
        playsOn = s.turn;
        try { const j = judgePlays(s, me, actions, i); if (j) all.push(j); } catch (e) { /* leave it out */ }
      }
      try { const j = judge(s, a, me, actions, i); if (j) all.push(j); } catch (e) { /* something the bot can't think about: leave it out */ }
    }
    s = step(s, a) || s;
    if (Date.now() - t0 > slice) { await pause(); t0 = Date.now(); }
  }
  return raw ? all : reviewSummary(all);
}

export function reviewSummary(all) {
  const judged = all.filter((x) => x.k !== 'mull');
  const by = {};
  for (const k of ['plays', 'turn', 'attack', 'block', 'trick']) {
    const xs = judged.filter((x) => x.k === k);
    by[k] = { n: xs.length, ok: xs.filter((x) => x.loss < GRADES[GRADES.length - 1].min).length };
  }
  const acc = judged.length ? Math.round(judged.reduce((t, x) => t + accOf(x.loss), 0) / judged.length) : null;
  const marks = judged.filter((x) => gradeOf(x.loss)).sort((x, y) => y.loss - x.loss).slice(0, 4)
    .map((x) => ({ ...x, g: gradeOf(x.loss).key })).sort((x, y) => x.t - y.t);
  const great = judged.filter((x) => x.k === 'trick' && x.gain >= GREAT_TRICK).sort((x, y) => y.gain - x.gain).slice(0, 2);
  const counts = Object.fromEntries(GRADES.map((g) => [g.key, judged.filter((x) => gradeOf(x.loss)?.key === g.key).length]));
  const m = all.find((x) => x.k === 'mull');
  return { v: REVIEW_V, acc, n: judged.length, by, marks, great, counts, mull: m ? { same: m.same, redraw: m.redraw } : null };
}

// One thing to take from the game: the costliest decision if there was one
// worth mentioning, else what the numbers say (Energy left unused, a full
// hand), else a word on what went well. Data again: { k, … }.
export function tipFor(rec, review) {
  const P = rec.players[rec.me];
  const worst = review?.marks?.slice().sort((x, y) => y.loss - x.loss)[0];
  if (worst && worst.loss >= (review.v >= 2 ? GRADES.find((g) => g.key === 'mistake').min : 6)) return { k: 'mark', m: worst }; // (a mistake or worse; older reviews counted the raw score)
  const unused = P.had ? 1 - P.spent / P.had : 0;
  if (P.had >= 12 && unused > 0.3) return { k: 'energy', pct: Math.round((1 - unused) * 100) };
  if (P.full >= 2) return { k: 'full', n: P.full };
  if (worst) return { k: 'mark', m: worst };
  if (review?.great?.length) return { k: 'great', m: review.great[0] };
  if (review?.acc != null) return { k: 'clean', acc: review.acc };
  return null;
}

// ── a draft ──────────────────────────────────────────────────────────
// Each of your picks against the bot's rating of every card on the table
// for your deck at that moment (draft.js pickScore: the card's strength,
// your factions so far, your curve, enough creatures). The bot's tip is
// its top-rated card; the loss is how far below it your pick was.
const DRAFT_K = 1.6;
export const PICK_GRADES = [
  { max: 0.25, key: 'best', name: 'Best' },
  { max: 1, key: 'good', name: 'Good' },
  { max: 2, key: 'ok', name: 'OK' },
  { max: Infinity, key: 'miss', name: 'Miss' },
];
export const pickGrade = (loss) => PICK_GRADES.find((g) => loss <= g.max);

export function reviewDraft(cfg, picks, me) {
  const full = replayDraft(cfg, picks);
  const out = [];
  for (let i = 0; i < full.log.length; i++) {
    const e = full.log[i];
    if (e.p !== me) continue;
    if (e.auto) { out.push({ r: e.r, cid: e.cid, auto: true }); continue; }
    const st = replayDraft(cfg, full.log.slice(0, i).map((x) => ({ p: x.p, k: x.r, cid: x.cid })));
    if (st.who !== me || !st.table.includes(e.cid)) continue;
    const pool = st.pools[me];
    const opts = st.table.map((cid) => ({ cid, v: pickScore(BY_ID[cid], pool) })).sort((x, y) => y.v - x.v);
    const at = opts.findIndex((o) => o.cid === e.cid);
    const loss = r2(Math.max(0, opts[0].v - opts[at].v));
    out.push({ r: e.r, cid: e.cid, best: opts[0].cid, loss, rank: at + 1, of: opts.length, g: pickGrade(loss).key });
  }
  const judged = out.filter((x) => !x.auto);
  const score = judged.length ? Math.round(judged.reduce((t, x) => t + 100 * Math.exp(-x.loss / DRAFT_K), 0) / judged.length) : null;
  const counts = Object.fromEntries(PICK_GRADES.map((g) => [g.key, judged.filter((x) => x.g === g.key).length]));
  return { score, picks: out, counts, done: !!full.done, pool: full.pools[me] };
}

// ── many games: the Insights page ────────────────────────────────────
const pct = (w, n) => (n ? Math.round((100 * w) / n) : null);
const won = (g) => g.winner === g.me;
const isBot = (P) => /^Bot · /.test(P.name);
const keyName = (name) => String(name || '').trim().toLowerCase();
export const FILTERS = { all: () => true, friends: (g) => g.mode === 'online', bots: (g) => g.mode !== 'online' };
// Which rules: both, the standard game, or SATTC Ultra (games and drafts carry `ultra`).
export const RULESETS = { any: () => true, standard: (g) => !g.ultra, ultra: (g) => !!g.ultra };

/**
 * Everything the Insights page shows, from your saved games (filtered: all,
 * friends or bots) and drafts: the record and form, how the bot rates your
 * play, when you win (first or second, game length, factions, opening
 * hands), rivals, cards (17lands-style: win rate when drawn and not drawn),
 * records, and the recent games.
 */
export function summarize(allGames, drafts = [], filter = 'all', rules = 'any') {
  const games = allGames.filter((g) => g.over && g.winner !== undefined && FILTERS[filter](g) && RULESETS[rules](g)).sort((x, y) => x.at - y.at);
  drafts = drafts.filter(RULESETS[rules]);
  const n = games.length, w = games.filter(won).length;
  const form = games.slice(-10).map(won);
  let streak = 0;
  for (let i = games.length - 1; i >= 0 && won(games[i]) === won(games[games.length - 1]); i--) streak++;
  const split = (f) => { const xs = games.filter(f); return { n: xs.length, w: xs.filter(won).length }; };

  // how you play, with the bots' numbers from games against them for comparison
  const reviewed = games.filter((g) => g.review?.acc != null);
  const sumBy = (k) => reviewed.reduce((t, g) => ({ n: t.n + (g.review.by[k]?.n || 0), ok: t.ok + (g.review.by[k]?.ok || 0) }), { n: 0, ok: 0 });
  const mineE = games.reduce((t, g) => ({ spent: t.spent + g.players[g.me].spent, had: t.had + g.players[g.me].had }), { spent: 0, had: 0 });
  const botE = { spent: 0, had: 0 };
  for (const g of allGames) if (g.over && g.mode !== 'online') for (const P of g.players) if (isBot(P)) { botE.spent += P.spent; botE.had += P.had; }
  const perGame = (f) => (n ? Math.round((games.reduce((t, g) => t + f(g), 0) / n) * 10) / 10 : null);
  const play = {
    acc: reviewed.length ? Math.round(reviewed.reduce((t, g) => t + g.review.acc, 0) / reviewed.length) : null,
    trend: reviewed.slice(-12).map((g) => g.review.acc),
    plays: sumBy('plays'), turn: sumBy('turn'), attack: sumBy('attack'), block: sumBy('block'), trick: sumBy('trick'),
    great: reviewed.reduce((t, g) => t + (g.review.great?.length || 0), 0),
    counts: Object.fromEntries(GRADES.map((x) => [x.key, reviewed.reduce((t, g) => t + (g.review.counts?.[x.key] || 0), 0)])),
    energy: mineE.had ? Math.min(100, pct(mineE.spent, mineE.had)) : null,
    botEnergy: botE.had ? Math.min(100, pct(botE.spent, botE.had)) : null,
    dealt: perGame((g) => g.players[g.me].dealt), taken: perGame((g) => g.players[g.me].taken),
    kills: perGame((g) => g.players[g.me].kills), lost: perGame((g) => g.players[g.me].lost),
    full: games.reduce((t, g) => t + g.players[g.me].full, 0),
  };

  // when you win
  const lengths = [[0, 6, 'Short (6 turns or less)'], [7, 10, 'Medium (7–10)'], [11, Infinity, 'Long (11+)']]
    .map(([a, b, label]) => ({ label, ...split((g) => g.players[g.me].turns >= a && g.players[g.me].turns <= b) })).filter((x) => x.n);
  const facs = {};
  for (const g of games) { const f = g.players[g.me].fac.join('/') || '—'; (facs[f] ||= { f, n: 0, w: 0 }).n++; if (won(g)) facs[f].w++; }
  const when = {
    first: split((g) => g.first === g.me), second: split((g) => g.first !== g.me),
    lengths, factions: Object.values(facs).sort((x, y) => y.n - x.n),
    kept: split((g) => g.players[g.me].mull === 'kept'), redrew: split((g) => g.players[g.me].mull === 'redrew'),
  };

  // rivals: every opponent you've played, friends by name, bots by deck
  const riv = {};
  for (const g of games) for (const P of g.players) {
    if (P === g.players[g.me]) continue;
    const r = (riv[keyName(P.name)] ||= { name: P.name.replace(/^Bot · /, ''), bot: isBot(P), n: 0, w: 0, l: 0 });
    r.n++;
    if (won(g)) r.w++;
    else if (g.winner === g.players.indexOf(P)) r.l++;
  }
  const rivals = Object.values(riv).sort((x, y) => x.bot - y.bot || y.n - x.n);

  // cards: drawn or not (17lands' GIH WR and GNS WR, and the gap: IWD), played, damage, kills
  const cs = {};
  for (const g of games) {
    const deck = Object.keys(Decks.decode(g.deck) || {});
    const seenSet = new Set(g.seen);
    for (const cid of deck) {
      const c = (cs[cid] ||= { cid, gp: 0, gpw: 0, gih: 0, gihw: 0, played: 0, dmg: 0, k: 0, stuck: 0 });
      c.gp++;
      if (won(g)) c.gpw++;
      const m = g.mine[cid];
      if (seenSet.has(cid) || m) { c.gih++; if (won(g)) c.gihw++; }
      if (m) { c.played += m[0]; c.dmg += m[1]; c.k += m[2]; }
      if (seenSet.has(cid) && !(m && m[0] > 0)) c.stuck++;
    }
  }
  const cardList = Object.values(cs).map((c) => {
    const gns = c.gp - c.gih, gnsw = c.gpw - c.gihw;
    return { ...c, gihWr: pct(c.gihw, c.gih), gnsWr: pct(gnsw, gns), gns, iwd: c.gih >= 3 && gns >= 2 ? pct(c.gihw, c.gih) - pct(gnsw, gns) : null, v: c.dmg + c.k * 3 };
  });
  const nemesis = {};
  for (const g of games) for (const [cid, d] of g.nem || []) nemesis[cid] = (nemesis[cid] || 0) + d;
  const cards = {
    mvp: cardList.filter((c) => c.v > 0).sort((x, y) => y.v - x.v).slice(0, 3),
    lift: cardList.filter((c) => c.iwd != null).sort((x, y) => y.iwd - x.iwd),
    stuck: cardList.filter((c) => c.stuck >= 2).sort((x, y) => y.stuck - x.stuck || y.stuck / y.gih - x.stuck / x.gih).slice(0, 3),
    nemesis: Object.entries(nemesis).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([cid, dmg]) => ({ cid, dmg })),
    all: cardList,
  };

  // records
  const wins = games.filter(won);
  const records = {
    hit: games.reduce((b, g) => (g.players[g.me].big > (b?.n || 0) ? { n: g.players[g.me].big, g } : b), null),
    fastest: wins.reduce((b, g) => (!b || g.players[g.me].turns < b.n ? { n: g.players[g.me].turns, g } : b), null),
    comeback: wins.reduce((b, g) => (!g.players[g.me].conceded && g.players[g.me].low <= 8 && (!b || g.players[g.me].low < b.n) ? { n: g.players[g.me].low, g } : b), null),
    flawless: wins.reduce((b, g) => (g.players[g.me].taken === 0 ? { n: 0, g } : b), null),
  };

  // drafts: the bot's score of your picks
  const ds = [...drafts].filter((d) => d.review?.score != null).sort((x, y) => x.at - y.at);
  const draft = ds.length ? {
    n: ds.length, score: Math.round(ds.reduce((t, d) => t + d.review.score, 0) / ds.length),
    last: ds[ds.length - 1], trend: ds.slice(-8).map((d) => d.review.score),
    counts: Object.fromEntries(PICK_GRADES.map((x) => [x.key, ds.reduce((t, d) => t + (d.review.counts?.[x.key] || 0), 0)])),
    record: ds.map((d) => { const xs = games.filter((g) => g.deck === d.deck); return { d, n: xs.length, w: xs.filter(won).length }; }),
  } : null;

  return { n, w, l: n - w, rate: pct(w, n), form, streak: n ? { won: won(games[n - 1]), n: streak } : null, play, when, rivals, cards, records, draft, recent: games.slice(-20).reverse() };
}

// ── the room's scoreboard ───────────────────────────────────────────
// Every phone in a room works out the same summary of each game it saw end
// (the games are the same everywhere) and puts it in the room, so the lobby
// shows everyone tonight's wins and a few awards. Only plain counts: no
// one's review or accuracy leaves their phone.
export function roomResult(rec) {
  return {
    w: rec.winner ?? -1, r: rec.rounds, names: rec.players.map((P) => P.name),
    p: rec.players.map((P) => ({ d: P.dealt, k: P.kills, b: P.blocks, h: P.big, c: P.crown, m: P.mvp ? [P.mvp.cid, P.mvp.dmg, P.mvp.k] : null })),
  };
}

/**
 * Tonight in a room, from its results ({ round: roomResult }): everyone who
 * played (by name, so a seat changing hands between games doesn't muddle
 * it) with their wins and totals, and the awards worth giving.
 */
export function nightAwards(results) {
  const list = Object.values(results || {}).filter((x) => x && Array.isArray(x.p) && Array.isArray(x.names));
  const people = [];
  const person = (name) => {
    const k = keyName(name);
    let P = people.find((x) => x.k === k);
    if (!P) people.push(P = { k, name: String(name || ''), wins: 0, games: 0, d: 0, kills: 0, b: 0, h: 0, c: 0 });
    return P;
  };
  const byCard = {};
  for (const x of list) x.names.forEach((nm, seat) => {
    const P = person(nm), q = x.p[seat] || {};
    P.games++;
    if (x.w === seat) P.wins++;
    P.d += q.d || 0; P.kills += q.k || 0; P.b += q.b || 0; P.c += q.c || 0; P.h = Math.max(P.h, q.h || 0);
    if (q.m) { const [cid, d, k] = q.m; const c = (byCard[`${P.k}:${cid}`] ||= { who: P, cid, v: 0, d: 0, k: 0 }); c.v += d + k * 3; c.d += d; c.k += k; }
  });
  // an award goes to one player clearly ahead, over a bar worth mentioning
  const top = (f, min) => {
    const m = Math.max(0, ...people.map(f));
    const ps = people.filter((P) => f(P) === m);
    return m >= min && ps.length === 1 ? { who: ps[0], n: m } : null;
  };
  const awards = [];
  for (const [k, f, min] of [['dealt', (P) => P.d, 10], ['kills', (P) => P.kills, 3], ['hit', (P) => P.h, 5], ['blocks', (P) => P.b, 4], ['crown', (P) => P.c, 3]]) {
    const t = top(f, min);
    if (t) awards.push({ k, ...t });
  }
  const best = Object.values(byCard).sort((x, y) => y.v - x.v)[0];
  if (best && best.v >= 8) awards.push({ k: 'card', who: best.who, cid: best.cid, n: best.d, kills: best.k });
  return { games: list.length, people, awards };
}

// ── this phone's saved games and drafts ─────────────────────────────
const GAMES = 'collective.games.v1';
const DRAFTS = 'collective.drafts.v1';
const MAX_GAMES = 250, MAX_DRAFTS = 40;
const KEEP_MOVES = 12; // the newest games also keep their setup and move list (`play`), so they can be shared and replayed
const load = (k) => { try { const v = JSON.parse(localStorage.getItem(k)); return Array.isArray(v) ? v : []; } catch { return []; } };
function keep(k, list, max) {
  // when storage is full, the oldest go first
  for (let cut = Math.max(0, list.length - max); cut <= list.length; cut += Math.max(1, Math.ceil(list.length / 4))) {
    try { localStorage.setItem(k, JSON.stringify(list.slice(cut))); return true; } catch { /* full: try with fewer */ }
  }
  return false;
}
export const loadGames = () => load(GAMES);
export const loadDrafts = () => load(DRAFTS);
export function saveGame(rec) {
  const all = loadGames().filter((g) => g.id !== rec.id);
  all.push(rec);
  for (const g of all.slice(0, -KEEP_MOVES)) delete g.play;
  return keep(GAMES, all, MAX_GAMES);
}
export function saveDraft(rec) {
  const all = loadDrafts().filter((d) => d.id !== rec.id);
  all.push(rec);
  return keep(DRAFTS, all, MAX_DRAFTS);
}
export const findGame = (id) => loadGames().find((g) => g.id === id) || null;
/** Notes the code a saved game was shared under (Net.shareGame), leaving it where it is in the list. */
export function markShared(id, code) {
  const all = loadGames();
  const g = all.find((x) => x.id === id);
  if (!g) return false;
  g.shared = code;
  return keep(GAMES, all, MAX_GAMES);
}
export const findDraft = (id) => loadDrafts().find((d) => d.id === id) || null;
