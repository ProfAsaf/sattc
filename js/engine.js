// The Collective — rules engine.
//
// Pure and deterministic: a game is newGame(setup) followed by a list of
// actions, and every client that replays the same list gets the same game.
// That makes online play an append-only action log, and undo a replay
// without the last action. Randomness (shuffles, who goes first) comes from
// a seeded generator stored in the state.
//
// Every decision is made by the acting player when they act: targets, which
// card Memory Diver keeps, what Second Thought discards. Nothing ever waits
// for an answer from someone whose turn it isn't.

import { BY_ID, RULES } from './cards.js';

// ── small helpers ───────────────────────────────────────────────────
const def = (c) => BY_ID[c.cid];
const has = (c, kw) => def(c).keywords.includes(kw);
const nameOf = (c) => def(c).name;
const removeFrom = (arr, uid) => { const i = arr.indexOf(uid); if (i >= 0) arr.splice(i, 1); return i >= 0; };

function rnd(s) {
  s.rng = (s.rng + 0x6d2b79f5) | 0;
  let t = Math.imul(s.rng ^ (s.rng >>> 15), 1 | s.rng);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function shuffle(s, arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd(s) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function log(s, p, text) {
  s.log.push({ turn: s.turn, p, text });
  if (s.log.length > 400) s.log.splice(0, s.log.length - 400);
}
const ev = (s, e) => s.events.push(e);

export const opponents = (s, i) => s.players.filter((p) => p.i !== i && !p.out);
export const living = (s) => s.players.filter((p) => !p.out);

// ── setup ───────────────────────────────────────────────────────────
function mk(s, cid, owner, zone) {
  const c = { uid: s.nextUid++, cid, owner, zone, token: !!BY_ID[cid].token };
  s.cards[c.uid] = c;
  return c;
}

// setup: { seed, players: [{ name, deck: [cardId × 30] }] }
export function newGame({ seed = 1, players }) {
  const s = {
    v: 1, rng: seed | 0, mode: players.length > 2 ? 'ffa' : 'duel',
    turn: 0, active: 0, first: 0, phase: 'mulligan', winner: null,
    players: [], cards: {}, nextUid: 1, died: 0, diedOwn: [], log: [], events: [],
  };
  players.forEach((pl, i) => {
    const P = {
      i, name: pl.name || `Player ${i + 1}`, life: RULES.startLife, maxEnergy: 0, energy: 0,
      deck: [], hand: [], discard: [], exile: [], board: [], traps: [],
      out: false, mull: null, turns: 0, spells: 0, mirror: false,
    };
    s.players.push(P);
    s.diedOwn.push(0);
    for (const cid of pl.deck) P.deck.push(mk(s, cid, i, 'deck').uid);
    shuffle(s, P.deck);
  });
  s.first = Math.floor(rnd(s) * players.length);
  s.active = s.first;
  for (const P of s.players) {
    const n = RULES.openingHand + (P.i !== s.first ? RULES.laterPlayerExtraCards : 0);
    for (let k = 0; k < n; k++) drawRaw(s, P);
  }
  for (const P of s.players) if (P.i !== s.first) P.hand.push(mk(s, 'spark', P.i, 'hand').uid);
  log(s, null, `${s.players[s.first].name} goes first. Everyone else gets a Spark.`);
  return s;
}

function drawRaw(s, P) {
  const uid = P.deck.shift();
  if (uid == null) return;
  s.cards[uid].zone = 'hand';
  P.hand.push(uid);
}

// ── stats and costs ─────────────────────────────────────────────────
export function power(s, c) {
  let p = def(c).power + (c.pP || 0) + (c.tP || 0);
  if (c.zone === 'board') {
    const board = s.players[c.owner].board;
    for (const u of board) if (u !== c.uid && s.cards[u].cid === 'standard-keeper') p += 1;
    if (c.cid === 'street-recruit' && board.length > 1) p += 1;
  }
  return Math.max(0, p);
}
export const vitality = (s, c) => def(c).vitality + (c.pV || 0) + (c.tV || 0);

const creaturesIn = (s, uids) => uids.filter((u) => def(s.cards[u]).type === 'creature').length;

function price(s, pi, c, from = 'hand') {
  const d = def(c), P = s.players[pi];
  let cost = from === 'discard' ? d.echo : d.cost;
  if (from === 'hand') {
    switch (c.cid) {
      case 'the-mountain-is-angry': cost = Math.max(3, cost - s.died); break;
      case 'bonepicker': if (s.died > 0) cost -= 1; break;
      case 'something-beneath': cost = Math.max(2, cost - Math.floor(creaturesIn(s, P.discard) / 2)); break;
      case 'death-is-a-door': if (s.diedOwn[pi] > 0) cost = 3; break;
      case 'the-forest-remembers': cost = Math.max(3, cost - P.board.filter((u) => s.cards[u].grown).length); break;
    }
  }
  let usesMirror = false;
  if (d.type === 'spell' && !P.mirror && cost <= 2) {
    const mages = P.board.filter((u) => s.cards[u].cid === 'mirror-mage').length;
    if (mages) { cost -= mages; usesMirror = true; }
  }
  return { cost: Math.max(0, cost), usesMirror };
}
export const costOf = (s, pi, c, from = 'hand') => price(s, pi, c, from).cost;

// ── zones ───────────────────────────────────────────────────────────
function resetPlay(c) {
  for (const k of ['dmg', 'pP', 'pV', 'tP', 'tV', 'played', 'attacked', 'rush', 'awake', 'grown', 'sacEnd', 'gTurn', 'aTurn', 'hurt']) delete c[k];
}

function enterPlay(s, c, pi) {
  resetPlay(c);
  Object.assign(c, { zone: 'board', dmg: 0, pP: 0, pV: 0, tP: 0, tV: 0, played: s.turn, attacked: false, gTurn: -1, aTurn: -1 });
  s.players[pi].board.push(c.uid);
}

// Anything headed for a discard pile comes through here: tokens vanish,
// Echo cards are removed from the game, and Forbidden Archivist watches
// for cards leaving hand or deck.
function toDiscard(s, c, from) {
  const P = s.players[c.owner];
  if (c.token) { c.zone = 'gone'; return; }
  if (c.echoed) { c.zone = 'exile'; P.exile.push(c.uid); return; }
  c.zone = 'discard';
  P.discard.push(c.uid);
  if (from === 'hand' || from === 'deck') archivist(s, c.owner);
}

function toHand(s, c, from) {
  const P = s.players[c.owner];
  c.echoed = false;
  if (c.token) { c.zone = 'gone'; return; }
  if (P.hand.length >= RULES.handMax) { log(s, c.owner, `${P.name}'s hand is full; ${nameOf(c)} goes to the discard pile.`); toDiscard(s, c, from); return; }
  c.zone = 'hand';
  P.hand.push(c.uid);
}

export function draw(s, pi, n = 1) {
  const P = s.players[pi];
  for (let k = 0; k < n && !P.out; k++) {
    if (!P.deck.length) {
      log(s, pi, `${P.name} has no cards left to draw and loses ${RULES.emptyDeckDamage} Life.`);
      loseLife(s, pi, RULES.emptyDeckDamage);
      continue;
    }
    const c = s.cards[P.deck.shift()];
    if (P.hand.length >= RULES.handMax) {
      log(s, pi, `${P.name}'s hand is full; ${nameOf(c)} goes to the discard pile.`);
      toDiscard(s, c, 'deck');
      continue;
    }
    c.zone = 'hand';
    P.hand.push(c.uid);
    ev(s, { k: 'draw', p: pi });
  }
}

function mill(s, pi, n) {
  const P = s.players[pi];
  for (let k = 0; k < n && P.deck.length; k++) {
    const c = s.cards[P.deck.shift()];
    log(s, pi, `${nameOf(c)} goes from ${P.name}'s deck to the discard pile.`);
    toDiscard(s, c, 'deck');
  }
}

function archivist(s, pi) {
  const P = s.players[pi];
  for (const u of [...P.board]) {
    const a = s.cards[u];
    if (a.cid !== 'forbidden-archivist' || a.zone !== 'board' || a.aTurn === s.turn) continue;
    a.aTurn = s.turn;
    log(s, pi, `Forbidden Archivist: ${P.name} loses 1 Life and draws a card.`);
    loseLife(s, pi, 1);
    draw(s, pi, 1);
  }
}

// ── life ────────────────────────────────────────────────────────────
function loseLife(s, pi, n) {
  const P = s.players[pi];
  if (n <= 0 || P.out) return;
  P.life -= n;
  ev(s, { k: 'life', p: pi, n: -n });
  if (P.life <= 0) eliminate(s, pi);
}
function gainLife(s, pi, n) {
  const P = s.players[pi];
  if (n <= 0 || P.out) return;
  P.life += n;
  ev(s, { k: 'life', p: pi, n });
}
function eliminate(s, pi) {
  const P = s.players[pi];
  if (P.out) return;
  P.out = true;
  log(s, pi, `${P.name} is out!`);
  for (const u of P.board) s.cards[u].zone = 'gone';
  P.board = [];
  for (const u of P.traps) s.cards[u].zone = 'gone';
  P.traps = [];
  const alive = living(s);
  if (alive.length <= 1) {
    s.phase = 'over';
    s.winner = alive.length ? alive[0].i : null;
    log(s, s.winner, alive.length ? `${alive[0].name} wins!` : 'Nobody is left standing.');
  }
}

// ── creatures: buffs, damage, death ─────────────────────────────────
function buff(s, c, dP, dV, permanent) {
  if (c.zone !== 'board' || (dP <= 0 && dV <= 0)) return;
  if (permanent) { c.pP += dP; c.pV += dV; } else { c.tP += dP; c.tV += dV; }
  ev(s, { k: 'buff', uid: c.uid, dP, dV });
  if (!c.awake) {
    c.awake = true;
    if (c.cid === 'mossback') { log(s, c.owner, 'Mossback awakens: gain 2 Life.'); gainLife(s, c.owner, 2); }
  }
  if (permanent) {
    c.grown = true;
    for (const u of [...s.players[c.owner].board]) {
      const g = s.cards[u];
      if (g.cid !== 'little-gardener' || g.uid === c.uid || g.gTurn === s.turn) continue;
      g.gTurn = s.turn;
      log(s, c.owner, 'Little Gardener grows +1/+1.');
      buff(s, g, 1, 1, true);
    }
  }
}

function damage(s, c, n) {
  if (n <= 0 || c.zone !== 'board') return;
  c.dmg += n;
  c.hurt = true;
  ev(s, { k: 'dmg', uid: c.uid, n });
}

function damagePlayer(s, pi, n) {
  if (n <= 0) return;
  log(s, pi, `${s.players[pi].name} takes ${n} damage.`);
  loseLife(s, pi, n);
}

// target: { p } for a player, { uid } for a creature
function hit(s, target, n) {
  if (!target) return;
  if (target.p != null) damagePlayer(s, target.p, n);
  else if (s.cards[target.uid]?.zone === 'board') { log(s, null, `${nameOf(s.cards[target.uid])} takes ${n} damage.`); damage(s, s.cards[target.uid], n); }
}

// Creatures dying together all leave first, then their triggers happen,
// so a Kindly Undertaker that dies alongside a friend still sees it go.
function killBatch(s, dead) {
  const before = s.players.map((P) => [...P.board]);
  const lb = [];
  for (const c of dead) {
    if (c.zone !== 'board') continue;
    const P = s.players[c.owner];
    removeFrom(P.board, c.uid);
    s.died += 1;
    s.diedOwn[c.owner] += 1;
    log(s, c.owner, `${nameOf(c)} dies.`);
    ev(s, { k: 'die', uid: c.uid, cid: c.cid, owner: c.owner });
    resetPlay(c);
    toDiscard(s, c, 'board');
    lb.push(c);
  }
  for (const c of lb) {
    for (const u of before[c.owner]) {
      if (u === c.uid) continue;
      const o = s.cards[u];
      if (o.cid === 'ash-collector' && o.zone === 'board') buff(s, o, 1, 0, false);
      if (o.cid === 'kindly-undertaker') { log(s, c.owner, 'Kindly Undertaker: gain 1 Life.'); gainLife(s, c.owner, 1); }
    }
    if (has(c, 'lastBreath')) lastBreath(s, c);
  }
}

function lastBreath(s, c) {
  const P = s.players[c.owner];
  switch (c.cid) {
    case 'cinderling':
      log(s, c.owner, 'Cinderling’s Last Breath burns each opponent.');
      for (const o of opponents(s, c.owner)) damagePlayer(s, o.i, 1);
      break;
    case 'grave-rat':
      mill(s, c.owner, 2);
      break;
    case 'phoenix-of-the-last-spark':
      c.phoenixTurn = P.turns + 1;
      log(s, c.owner, `The Phoenix can return to ${P.name}'s hand next turn for 2 Energy.`);
      break;
  }
}

function settle(s) {
  for (let guard = 0; guard < 60; guard++) {
    const dead = [];
    for (const P of s.players) for (const u of P.board) {
      const c = s.cards[u];
      if (c.dmg >= vitality(s, c)) dead.push(c);
    }
    if (!dead.length) break;
    killBatch(s, dead);
  }
  for (const P of s.players) for (const u of [...P.board]) {
    const c = s.cards[u];
    if (!c.hurt) continue;
    c.hurt = false;
    if (c.cid === 'patient-giant') { log(s, c.owner, 'Patient Giant survives and gets +1 Power.'); buff(s, c, 1, 0, true); }
  }
}

function sacrifice(s, c) {
  log(s, c.owner, `${s.players[c.owner].name} sacrifices ${nameOf(c)}.`);
  killBatch(s, [c]);
}

function bounce(s, c) {
  if (c.zone !== 'board') return;
  removeFrom(s.players[c.owner].board, c.uid);
  log(s, c.owner, `${nameOf(c)} returns to ${s.players[c.owner].name}'s hand.`);
  resetPlay(c);
  toHand(s, c, 'board');
}

function makeTokens(s, pi, cid, n) {
  const P = s.players[pi];
  let made = 0;
  for (let k = 0; k < n && P.board.length < RULES.boardMax; k++, made++) enterPlay(s, mk(s, cid, pi, 'board'), pi);
  if (made) log(s, pi, `${P.name} creates ${made} Spirit${made === 1 ? '' : 's'}.`);
}

// ── what a card needs from the player ───────────────────────────────
// Returns the choices a card asks for when played, with legal options.
// UI and bot both use this, and check() validates against it.
export function needs(s, pi, c, from = 'hand') {
  const P = s.players[pi];
  const allCreatures = s.players.flatMap((Q) => Q.board);
  const own = [...P.board];
  const anyTarget = [...living(s).map((Q) => ({ p: Q.i })), ...allCreatures.map((u) => ({ uid: u }))];
  const discardOf = (pred) => P.discard.filter((u) => pred(def(s.cards[u])));
  switch (c.cid) {
    case 'feed-the-flame':
    case 'funeral-pyre':
      return { sac: own, target: anyTarget };
    case 'the-mountain-is-angry':
      return { target: opponents(s, pi).map((Q) => ({ p: Q.i })) };
    case 'wild-growth':
      return { target: own.map((u) => ({ uid: u })) };
    case 'worldtree-stag':
      return { target: own.map((u) => ({ uid: u })), optional: true };
    case 'not-yet':
      return { target: allCreatures.filter((u) => def(s.cards[u]).cost <= 3).map((u) => ({ uid: u })) };
    case 'deepwater-leviathan':
      return { target: allCreatures.map((u) => ({ uid: u })), optional: true };
    case 'death-is-a-door':
      return { target: allCreatures.map((u) => ({ uid: u })) };
    case 'apex-predator':
      return { target: allCreatures.map((u) => ({ uid: u })), optional: allCreatures.length === 0 };
    case 'unearth':
      return { pick: discardOf((d) => d.type === 'creature' && d.cost <= 2) };
    case 'borrowed-time':
      return { pick: discardOf((d) => d.type === 'creature') };
    case 'perfect-recall':
      return { picks: discardOf((d) => d.type === 'spell'), max: 3 };
    case 'we-grow-together':
      return { targets: own, count: Math.min(own.length, own.length >= 4 ? 3 : 2) };
    case 'memory-diver':
      return { keep: P.deck.slice(0, 3) };
    case 'curious-wisp':
      return { bottom: P.deck.slice(0, 1) };
    case 'second-thought':
      return { discard: [...P.hand.filter((u) => u !== c.uid), ...P.deck.slice(0, 2)] };
    default:
      return {};
  }
}

const sameTarget = (a, b) => a && b && (a.p != null ? a.p === b.p : a.uid === b.uid);

export function canAttack(s, pi, c) {
  return c && c.zone === 'board' && c.owner === pi && !c.attacked &&
    (c.played < s.turn || c.rush || has(c, 'rush'));
}

export function attackTargets(s, pi) {
  const out = [];
  for (const Q of opponents(s, pi)) {
    const guards = Q.board.filter((u) => has(s.cards[u], 'guard'));
    if (guards.length) for (const g of guards) out.push({ uid: g });
    else { out.push({ p: Q.i }); for (const u of Q.board) out.push({ uid: u }); }
  }
  return out;
}

export function phoenixReady(s, pi) {
  const P = s.players[pi];
  return P.discard.filter((u) => s.cards[u].cid === 'phoenix-of-the-last-spark' && s.cards[u].phoenixTurn === P.turns);
}

// Is this action legal right now? Returns null, or a reason it isn't.
export function check(s, a) {
  if (!a || !a.t) return 'Unknown action.';
  if (a.t === 'fix') return null;
  const P = s.players[a.p];
  if (!P) return 'Unknown player.';
  if (a.t === 'concede') return P.out || s.phase === 'over' ? 'Already out.' : null;
  if (s.phase === 'over') return 'The game is over.';
  if (a.t === 'mulligan') return s.phase !== 'mulligan' ? 'Not now.' : P.mull ? 'Already decided.' : null;
  if (s.phase !== 'main') return 'Decide on your opening hand first.';
  if (s.active !== a.p) return 'It is not your turn.';
  if (a.t === 'end') return null;

  if (a.t === 'phoenix') {
    if (!phoenixReady(s, a.p).includes(a.uid)) return 'The Phoenix cannot return now.';
    if (P.energy < 2) return 'Not enough Energy.';
    if (P.hand.length >= RULES.handMax) return 'Your hand is full.';
    return null;
  }

  if (a.t === 'attack') {
    const c = s.cards[a.uid];
    if (!canAttack(s, a.p, c)) return c && c.attacked ? 'It already attacked this turn.' : 'It cannot attack yet.';
    if (!attackTargets(s, a.p).some((t) => sameTarget(t, a.target))) return 'That is not a legal target (Guard?).';
    return null;
  }

  if (a.t === 'play') {
    const c = s.cards[a.uid];
    const from = a.from === 'discard' ? 'discard' : 'hand';
    if (!c || !(from === 'hand' ? P.hand : P.discard).includes(a.uid)) return 'That card is not available.';
    const d = def(c);
    if (from === 'discard' && !d.echo) return 'Only Echo cards can be played from the discard pile.';
    if (price(s, a.p, c, from).cost > P.energy) return 'Not enough Energy.';
    if (d.type === 'creature' && P.board.length >= RULES.boardMax) return 'You already have 7 creatures.';
    const n = needs(s, a.p, c, from);
    if (n.sac) {
      if (!n.sac.includes(a.sac)) return 'Choose one of your creatures to sacrifice.';
      if (!n.target.some((t) => sameTarget(t, a.target)) || sameTarget(a.target, { uid: a.sac })) return 'Choose a target.';
    } else if (n.target) {
      if (a.target == null) { if (!n.optional && n.target.length) return 'Choose a target.'; if (!n.optional) return 'There is nothing to target.'; }
      else if (!n.target.some((t) => sameTarget(t, a.target))) return 'That is not a legal target.';
    }
    if (n.pick) {
      if (!n.pick.includes(a.pick)) return n.pick.length ? 'Choose a card from your discard pile.' : 'There is nothing to return.';
      if (c.cid === 'borrowed-time' && P.board.length >= RULES.boardMax) return 'You already have 7 creatures.';
    }
    if (n.picks) {
      const ps = a.picks || [];
      if (ps.length > n.max || new Set(ps).size !== ps.length || ps.some((u) => !n.picks.includes(u))) return 'Choose up to three Spells.';
    }
    if (n.targets) {
      const ts = a.targets || [];
      if (n.count && ts.length < 1) return 'Choose your creatures.';
      if (ts.length > n.count || new Set(ts).size !== ts.length || ts.some((u) => !n.targets.includes(u))) return 'Choose different creatures you control.';
    }
    if (n.keep && n.keep.length && !n.keep.includes(a.keep)) return 'Choose the card to keep.';
    if (n.discard && !n.discard.includes(a.discard)) return 'Choose a card to discard.';
    return null;
  }
  return 'Unknown action.';
}

// ── doing things ────────────────────────────────────────────────────
function resolveSpell(s, pi, c, a) {
  const P = s.players[pi];
  const tc = (t) => (t && t.uid != null ? s.cards[t.uid] : null);
  switch (c.cid) {
    case 'spark':
      P.energy += 1;
      break;
    case 'feed-the-flame': {
      const sac = s.cards[a.sac], hadLB = has(sac, 'lastBreath');
      sacrifice(s, sac);
      hit(s, a.target, hadLB ? 4 : 3);
      break;
    }
    case 'funeral-pyre': {
      const sac = s.cards[a.sac], pw = power(s, sac), hadLB = has(sac, 'lastBreath');
      sacrifice(s, sac);
      hit(s, a.target, pw);
      if (hadLB) { log(s, pi, `${nameOf(sac)}’s Last Breath happens again.`); lastBreath(s, sac); }
      break;
    }
    case 'wildfire':
      log(s, pi, 'Wildfire deals 2 damage to every creature.');
      for (const Q of s.players) for (const u of [...Q.board]) damage(s, s.cards[u], 2);
      break;
    case 'the-mountain-is-angry':
      hit(s, a.target, 7);
      break;
    case 'wild-growth':
      buff(s, tc(a.target), 2, 2, true);
      break;
    case 'ancient-roots':
      P.maxEnergy = Math.min(RULES.maxEnergy, P.maxEnergy + 1);
      break;
    case 'not-yet':
      bounce(s, tc(a.target));
      break;
    case 'second-thought': {
      draw(s, pi, 2);
      const u = P.hand.includes(a.discard) ? a.discard : P.hand[P.hand.length - 1];
      if (u != null) { removeFrom(P.hand, u); log(s, pi, `${P.name} discards ${nameOf(s.cards[u])}.`); toDiscard(s, s.cards[u], 'hand'); }
      break;
    }
    case 'perfect-recall':
      for (const u of a.picks || []) if (removeFrom(P.discard, u)) toHand(s, s.cards[u], 'discard');
      break;
    case 'unearth':
      if (removeFrom(P.discard, a.pick)) { log(s, pi, `${nameOf(s.cards[a.pick])} returns to ${P.name}'s hand.`); toHand(s, s.cards[a.pick], 'discard'); }
      break;
    case 'borrowed-time': {
      const t = s.cards[a.pick];
      if (removeFrom(P.discard, a.pick)) {
        enterPlay(s, t, pi);
        t.rush = true;
        t.sacEnd = true;
        log(s, pi, `${nameOf(t)} returns to play until the end of the turn.`);
      }
      break;
    }
    case 'death-is-a-door':
      if (tc(a.target)?.zone === 'board') { log(s, pi, `${nameOf(tc(a.target))} is destroyed.`); killBatch(s, [tc(a.target)]); }
      break;
    case 'twin-souls':
      makeTokens(s, pi, 'spirit', 2);
      break;
    case 'rally':
      for (const u of [...P.board]) buff(s, s.cards[u], 1, 0, false);
      break;
    case 'stand-together':
      for (const u of [...P.board]) buff(s, s.cards[u], 1, 1, false);
      if (P.board.length >= 4) draw(s, pi, 1);
      break;
    case 'a-thousand-lights':
      makeTokens(s, pi, 'spirit', 5);
      for (const u of [...P.board]) buff(s, s.cards[u], 1, 1, true);
      break;
    case 'we-grow-together':
      for (const u of a.targets || []) buff(s, s.cards[u], 1, 2, true);
      break;
  }
}

function creatureEnters(s, pi, c, a, from) {
  const P = s.players[pi];
  const tc = (t) => (t && t.uid != null ? s.cards[t.uid] : null);
  switch (c.cid) {
    case 'curious-wisp':
      if (a.bottom && P.deck.length) { P.deck.push(P.deck.shift()); log(s, pi, `${P.name} puts the top card of their deck on the bottom.`); }
      break;
    case 'memory-diver': {
      const top = P.deck.splice(0, 3);
      const keep = top.includes(a.keep) ? a.keep : top[0];
      for (const u of top) {
        if (u === keep) { s.cards[u].zone = 'deck'; toHand(s, s.cards[u], 'deck'); }
        else { log(s, pi, `${nameOf(s.cards[u])} goes to ${P.name}'s discard pile.`); toDiscard(s, s.cards[u], 'deck'); }
      }
      break;
    }
    case 'worldtree-stag':
      if (tc(a.target)) buff(s, tc(a.target), 2, 2, true);
      break;
    case 'deepwater-leviathan':
      if (tc(a.target)) bounce(s, tc(a.target));
      break;
    case 'dawn-captain':
      makeTokens(s, pi, 'spirit', 2);
      break;
    case 'apex-predator': {
      const t = tc(a.target);
      if (t && t.zone === 'board') {
        log(s, pi, `Apex Predator fights ${nameOf(t)}.`);
        const pa = power(s, c), pt = power(s, t);
        damage(s, t, pa);
        damage(s, c, pt);
        settle(s);
        if (c.zone === 'board') buff(s, c, 2, 2, true);
      }
      break;
    }
    case 'the-one-who-came-back':
      if (from === 'discard') {
        log(s, pi, 'The One Who Came Back: each opponent loses 3 Life.');
        for (const o of opponents(s, pi)) loseLife(s, o.i, 3);
      }
      break;
  }
}

function play(s, pi, a) {
  const P = s.players[pi];
  const c = s.cards[a.uid];
  const d = def(c);
  const from = a.from === 'discard' ? 'discard' : 'hand';
  const { cost, usesMirror } = price(s, pi, c, from);
  P.energy -= cost;
  removeFrom(from === 'hand' ? P.hand : P.discard, c.uid);
  if (from === 'discard') c.echoed = true;
  log(s, pi, `${P.name} plays ${d.name}${from === 'discard' ? ' from the discard pile (Echo)' : ''}.`);
  ev(s, { k: 'play', p: pi, uid: c.uid, cid: c.cid });

  if (d.type === 'creature') {
    enterPlay(s, c, pi);
    creatureEnters(s, pi, c, a, from);
    settle(s);
    return;
  }

  // Spells
  c.zone = 'stack';
  if (usesMirror) P.mirror = true;
  P.spells += 1;
  if (P.spells === 2) {
    for (const u of [...P.board]) if (s.cards[u].cid === 'lightning-theorist') {
      log(s, pi, 'Lightning Theorist: 2 damage to each opponent.');
      for (const o of opponents(s, pi)) damagePlayer(s, o.i, 2);
    }
  }
  // An opponent's Countercurrent springs on the first Spell it sees.
  const trapOwner = opponents(s, pi).find((Q) => Q.traps.length);
  if (trapOwner) {
    const t = s.cards[trapOwner.traps.shift()];
    t.zone = 'discard';
    trapOwner.discard.push(t.uid);
    if (a.payTax && P.energy >= 2) {
      P.energy -= 2;
      log(s, pi, `${trapOwner.name}'s Countercurrent! ${P.name} pays 2 more Energy.`);
    } else {
      log(s, pi, `${trapOwner.name}'s Countercurrent cancels ${d.name}.`);
      ev(s, { k: 'countered', uid: c.uid });
      toDiscard(s, c, 'stack');
      settle(s);
      return;
    }
  }
  resolveSpell(s, pi, c, a);
  if (c.cid === 'countercurrent') { c.zone = 'trap'; P.traps.push(c.uid); log(s, pi, `${P.name} sets a trap.`); }
  else toDiscard(s, c, 'stack');
  settle(s);
}

function attack(s, pi, a) {
  const c = s.cards[a.uid];
  c.attacked = true;
  const tgt = a.target.p != null ? s.players[a.target.p].name : nameOf(s.cards[a.target.uid]);
  log(s, pi, `${nameOf(c)} attacks ${tgt}.`);
  ev(s, { k: 'attack', uid: c.uid, target: a.target });
  if (c.cid === 'reckless-initiate') { damage(s, c, 1); settle(s); if (c.zone !== 'board') return; }
  if (a.target.p != null) {
    damagePlayer(s, a.target.p, power(s, c));
  } else {
    const t = s.cards[a.target.uid];
    if (t.zone !== 'board') return;
    const pc = power(s, c), pt = power(s, t);
    damage(s, t, pc);
    damage(s, c, pt);
  }
  settle(s);
}

function startTurn(s, i) {
  s.turn += 1;
  s.active = i;
  const P = s.players[i];
  P.turns += 1;
  P.spells = 0;
  P.mirror = false;
  P.maxEnergy = Math.min(RULES.maxEnergy, P.maxEnergy + 1);
  P.energy = P.maxEnergy;
  log(s, i, `${P.name}'s turn.`);
  ev(s, { k: 'turn', p: i });
  if (!(i === s.first && P.turns === 1)) draw(s, i, 1);
  for (const u of [...P.board]) {
    const c = s.cards[u];
    if (c.cid === 'seedling' && c.zone === 'board' && vitality(s, c) >= 3) {
      log(s, i, 'Seedling has grown: sacrifice it and draw a card.');
      killBatch(s, [c]);
      draw(s, i, 1);
    }
  }
  settle(s);
  if (P.out && s.phase !== 'over') nextTurn(s);
}

function nextTurn(s) {
  if (s.phase === 'over') return;
  let i = s.active;
  for (let k = 0; k < s.players.length; k++) {
    i = (i + 1) % s.players.length;
    if (!s.players[i].out) break;
  }
  startTurn(s, i);
}

function endTurn(s) {
  const ending = s.players.flatMap((Q) => Q.board.map((u) => s.cards[u])).filter((c) => c.sacEnd);
  for (const c of ending) if (c.zone === 'board') { log(s, c.owner, `Borrowed Time runs out for ${nameOf(c)}.`); killBatch(s, [c]); }
  settle(s);
  for (const Q of s.players) for (const u of Q.board) {
    const c = s.cards[u];
    c.dmg = 0; c.tP = 0; c.tV = 0; c.attacked = false;
  }
  s.died = 0;
  s.diedOwn = s.diedOwn.map(() => 0);
  s.players[s.active].energy = 0; // unspent Energy is gone; it refills next turn
  nextTurn(s);
}

function mulligan(s, pi, redraw) {
  const P = s.players[pi];
  P.mull = redraw ? 'redrew' : 'kept';
  if (redraw) {
    const back = P.hand.filter((u) => !s.cards[u].token);
    P.hand = P.hand.filter((u) => s.cards[u].token);
    for (const u of back) { s.cards[u].zone = 'deck'; P.deck.push(u); }
    shuffle(s, P.deck);
    for (let k = 0; k < RULES.openingHand; k++) drawRaw(s, P);
    log(s, pi, `${P.name} draws a new opening hand.`);
  } else log(s, pi, `${P.name} keeps their hand.`);
  if (s.players.every((Q) => Q.mull)) {
    s.phase = 'main';
    startTurn(s, s.first);
  }
}

// Manual fixes for game night: if something goes wrong, players can put it right.
function fix(s, a) {
  const who = s.players[a.by]?.name || 'Someone';
  if (a.op === 'life') { const P = s.players[a.p]; P.life += a.n; log(s, a.p, `🛠 ${who} adjusts ${P.name}'s Life by ${a.n > 0 ? '+' : ''}${a.n}.`); if (P.life <= 0) eliminate(s, a.p); }
  else if (a.op === 'energy') { const P = s.players[a.p]; P.energy = Math.max(0, P.energy + a.n); log(s, a.p, `🛠 ${who} adjusts ${P.name}'s Energy by ${a.n > 0 ? '+' : ''}${a.n}.`); }
  else if (a.op === 'stat') { const c = s.cards[a.uid]; if (c?.zone === 'board') { c.pP += a.dP || 0; c.pV += a.dV || 0; log(s, c.owner, `🛠 ${who} adjusts ${nameOf(c)} by ${a.dP || 0}/${a.dV || 0}.`); settle(s); } }
  else if (a.op === 'move') {
    const c = s.cards[a.uid];
    if (!c) return;
    const P = s.players[c.owner];
    for (const z of ['hand', 'deck', 'discard', 'board', 'exile', 'traps']) removeFrom(P[z], c.uid);
    if (a.to === 'board') enterPlay(s, c, c.owner);
    else { resetPlay(c); c.zone = a.to; (a.to === 'deck' ? P.deck.unshift(c.uid) : P[a.to].push(c.uid)); }
    log(s, c.owner, `🛠 ${who} moves ${nameOf(c)} to ${a.to}.`);
    settle(s);
  }
}

// Apply one action. Returns { state, error }; on error the state is unchanged.
export function apply(state, a) {
  const error = check(state, a);
  if (error) return { state, error };
  const s = structuredClone(state);
  s.events = [];
  switch (a.t) {
    case 'mulligan': mulligan(s, a.p, !!a.redraw); break;
    case 'play': play(s, a.p, a); break;
    case 'attack': attack(s, a.p, a); break;
    case 'phoenix': {
      const P = s.players[a.p];
      P.energy -= 2;
      removeFrom(P.discard, a.uid);
      s.cards[a.uid].phoenixTurn = 0;
      toHand(s, s.cards[a.uid], 'discard');
      log(s, a.p, `${P.name} pays 2 Energy and the Phoenix returns to their hand.`);
      break;
    }
    case 'end': log(s, a.p, `${s.players[a.p].name} ends their turn.`); endTurn(s); break;
    case 'concede': log(s, a.p, `${s.players[a.p].name} concedes.`); eliminate(s, a.p); break;
    case 'fix': fix(s, a); break;
  }
  if (s.phase === 'main' && s.players[s.active].out) nextTurn(s);
  return { state: s, error: null };
}

// Put a card straight into a zone. For tests and scenario set-up only.
export function addCard(s, cid, owner, zone, extra = {}) {
  const c = mk(s, cid, owner, zone);
  const P = s.players[owner];
  if (zone === 'board') { enterPlay(s, c, owner); c.played = s.turn - 2; }
  else if (zone === 'traps') { c.zone = 'trap'; P.traps.push(c.uid); }
  else P[zone].push(c.uid);
  Object.assign(c, extra);
  return c;
}

export function replay(setup, actions) {
  let s = newGame(setup);
  for (const a of actions) s = apply(s, a).state;
  return s;
}

// Every legal action for a player, targets and choices included.
// Used by the bot and by the fuzz tests.
export function legalActions(s, pi) {
  const out = [];
  const P = s.players[pi];
  if (s.phase === 'over' || P.out) return out;
  if (s.phase === 'mulligan') return P.mull ? out : [{ t: 'mulligan', p: pi, redraw: false }, { t: 'mulligan', p: pi, redraw: true }];
  if (s.active !== pi) return out;
  const push = (a) => { if (!check(s, a)) out.push(a); };
  const sources = [...P.hand.map((u) => ['hand', u]), ...P.discard.filter((u) => def(s.cards[u]).echo).map((u) => ['discard', u])];
  for (const [from, uid] of sources) {
    const c = s.cards[uid];
    const base = { t: 'play', p: pi, uid, ...(from === 'discard' ? { from } : {}), payTax: true };
    if (price(s, pi, c, from).cost > P.energy) continue;
    const n = needs(s, pi, c, from);
    if (n.sac) { for (const sac of n.sac) for (const target of n.target) push({ ...base, sac, target }); continue; }
    if (n.target) { for (const target of n.target) push({ ...base, target }); if (n.optional || !n.target.length) push(base); continue; }
    if (n.pick) { for (const pick of n.pick) push({ ...base, pick }); continue; }
    if (n.picks) {
      const best = [...n.picks].sort((x, y) => def(s.cards[y]).cost - def(s.cards[x]).cost).slice(0, n.max);
      push({ ...base, picks: best });
      continue;
    }
    if (n.targets) {
      const own = n.targets;
      const k = n.count;
      const combos = [];
      const rec = (start, acc) => { if (acc.length === k) { combos.push([...acc]); return; } for (let i = start; i < own.length; i++) { acc.push(own[i]); rec(i + 1, acc); acc.pop(); } };
      if (k > 0) rec(0, []);
      for (const targets of combos.slice(0, 40)) push({ ...base, targets });
      continue;
    }
    if (n.keep) { if (n.keep.length) for (const keep of n.keep) push({ ...base, keep }); else push(base); continue; }
    if (n.bottom) { push({ ...base, bottom: false }); if (n.bottom.length) push({ ...base, bottom: true }); continue; }
    if (n.discard) { for (const discard of n.discard) push({ ...base, discard }); continue; }
    push(base);
  }
  for (const u of phoenixReady(s, pi)) push({ t: 'phoenix', p: pi, uid: u });
  const targets = attackTargets(s, pi);
  for (const u of P.board) if (canAttack(s, pi, s.cards[u])) for (const target of targets) push({ t: 'attack', p: pi, uid: u, target });
  out.push({ t: 'end', p: pi });
  return out;
}
