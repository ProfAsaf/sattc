// The Collective — rules engine.
//
// Pure and deterministic: a game is newGame(setup) followed by a list of
// actions, and every client that replays the same list gets the same game.
// That makes online play an append-only action log, and undo a replay
// without the last action. Randomness (shuffles, who goes first) comes from
// a seeded generator stored in the state.
//
// Every choice is made by the acting player when they act: targets, which
// card Memory Diver keeps, which creatures block. `actor(s)` says whose move
// it is: the active player, or during a fight whoever must answer next
// (the defender choosing blockers, then both sides taking turns to play
// Tricks until both pass).

import { BY_ID, RULES, isTrick } from './cards.js';

// ── small helpers ───────────────────────────────────────────────────
const def = (c) => BY_ID[c.cid];
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
const listNames = (names) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

// Whose move is it? null during the mulligan (everyone decides at once) and once the game is over.
export function actor(s) {
  if (s.phase === 'combat') return s.combat.prio;
  if (s.phase === 'main') return s.active;
  return null;
}

// ── setup ───────────────────────────────────────────────────────────
function mk(s, cid, owner, zone) {
  const c = { uid: s.nextUid++, cid, owner, zone, token: !!BY_ID[cid].token };
  s.cards[c.uid] = c;
  return c;
}

// setup: { seed, players: [{ name, deck: [cardId × 30] }] }
// The tutorial adds `stacked: true` (decks keep their order, top card first)
// and `first` (who goes first), so every step of the lesson is predictable.
// `crown` turns the Crown on or off (on by default with three or more players).
export function newGame({ seed = 1, players, stacked = false, first = null, crown = null }) {
  const s = {
    v: 2, rng: seed | 0, mode: players.length > 2 ? 'ffa' : 'duel',
    turn: 0, active: 0, first: 0, phase: 'mulligan', winner: null, combat: null,
    crownOn: crown ?? players.length > 2, crown: null,
    players: [], cards: {}, nextUid: 1, died: 0, diedOwn: [], log: [], events: [],
  };
  players.forEach((pl, i) => {
    const P = {
      i, name: pl.name || `Player ${i + 1}`, life: RULES.startLife, maxEnergy: 0, energy: 0,
      deck: [], hand: [], discard: [], exile: [], board: [], traps: [], relics: [],
      out: false, mull: null, turns: 0, spells: 0, mirror: false, attackedOn: -1, extra: 0,
    };
    s.players.push(P);
    s.diedOwn.push(0);
    for (const cid of pl.deck) P.deck.push(mk(s, cid, i, 'deck').uid);
    if (!stacked) shuffle(s, P.deck);
  });
  s.first = first ?? Math.floor(rnd(s) * players.length);
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

// ── stats, keywords and costs ───────────────────────────────────────
const boardOf = (s, c) => s.players[c.ctrl].board;
const countOn = (s, uids, cid) => uids.reduce((n, u) => n + (s.cards[u].cid === cid ? 1 : 0), 0);

export function power(s, c) {
  let p = def(c).power + (c.pP || 0) + (c.tP || 0);
  if (c.zone === 'board') {
    const board = boardOf(s, c);
    for (const u of board) if (u !== c.uid && s.cards[u].cid === 'standard-keeper') p += 1;
    if (c.cid === 'street-recruit' && board.length > 1) p += 1;
    if (c.cid === 'spirit') p += countOn(s, board, 'choirmother');
  }
  return Math.max(0, p);
}
export function vitality(s, c) {
  let v = def(c).vitality + (c.pV || 0) + (c.tV || 0);
  if (c.zone === 'board' && c.cid === 'spirit') v += countOn(s, boardOf(s, c), 'choirmother');
  return v;
}

// Printed keywords, plus what other cards grant and this turn's Tricks.
export function hasKw(s, c, kw) {
  if (def(c).keywords.includes(kw)) return true;
  if (c.tKw && c.tKw.includes(kw)) return true;
  if (c.zone !== 'board') return false;
  if (kw === 'soar' && c.cid === 'spirit' && countOn(s, boardOf(s, c), 'choirmother')) return true;
  if (kw === 'rush' && s.players[c.ctrl].relics.some((u) => s.cards[u].cid === 'banner-of-the-charge')) return true;
  return false;
}

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
    const mages = countOn(s, P.board, 'mirror-mage');
    if (mages) { cost -= mages; usesMirror = true; }
  }
  return { cost: Math.max(0, cost), usesMirror };
}
export const costOf = (s, pi, c, from = 'hand') => price(s, pi, c, from).cost;

// ── zones ───────────────────────────────────────────────────────────
const TABLE_STATE = ['dmg', 'pP', 'pV', 'tP', 'tV', 'played', 'rush', 'awake', 'grown', 'sacEnd', 'gTurn', 'aTurn', 'hurt',
  'ex', 'frozen', 'tKw', 'ctrl', 'stolen', 'venomed', 'chimes', 'usedOn'];
function resetPlay(c) {
  for (const k of TABLE_STATE) delete c[k];
  if (c.baseCid) { c.cid = c.baseCid; delete c.baseCid; }
}

function enterPlay(s, c, pi) {
  resetPlay(c);
  Object.assign(c, { zone: 'board', ctrl: pi, dmg: 0, pP: 0, pV: 0, tP: 0, tV: 0, played: s.turn, ex: false, gTurn: -1, aTurn: -1 });
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
    for (const u of [...P.board]) if (s.cards[u].cid === 'brook-hydra') buff(s, s.cards[u], 1, 1, true);
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
  // Their cards leave the table; creatures they had taken go back home.
  for (const Q of s.players) for (const u of [...Q.board]) {
    const c = s.cards[u];
    if (c.owner === pi) { removeFrom(Q.board, u); c.zone = 'gone'; }
    else if (Q.i === pi) {
      removeFrom(Q.board, u);
      const O = s.players[c.owner];
      if (!O.out && O.board.length < RULES.boardMax) { O.board.push(u); c.ctrl = O.i; delete c.stolen; } else { resetPlay(c); toDiscard(s, c, 'board'); }
    }
  }
  for (const u of [...P.relics, ...P.traps]) s.cards[u].zone = 'gone';
  P.relics = [];
  P.traps = [];
  // Their Crown goes to whoever's turn it is (back to the middle if it was their own).
  if (s.crown === pi) setCrown(s, s.active !== pi && !s.players[s.active].out ? s.active : null);
  if (s.combat && (s.combat.a === pi || s.combat.d === pi)) { clearCombatMarks(s); s.combat = null; s.phase = 'main'; }
  const alive = living(s);
  if (alive.length <= 1) {
    s.phase = 'over';
    s.combat = null;
    s.winner = alive.length ? alive[0].i : null;
    log(s, s.winner, alive.length ? `${alive[0].name} wins!` : 'Nobody is left standing.');
  }
}

// ── the Crown ───────────────────────────────────────────────────────
// Three-player games: the first player to hit someone in a fight takes the
// Crown, hitting whoever holds it takes it from them, and the holder draws
// an extra card at the end of each of their turns. It keeps everyone attacking.
function setCrown(s, to) {
  if (!s.crownOn || s.crown === to) return;
  const from = s.crown;
  s.crown = to;
  if (to == null) log(s, null, 'The Crown goes back to the middle: the next player to hit someone in a fight takes it.');
  else log(s, to, from == null ? `${s.players[to].name} takes the Crown!` : `${s.players[to].name} takes the Crown from ${s.players[from].name}!`);
  ev(s, { k: 'crown', p: to, from });
}

// ── creatures: buffs, damage, death ─────────────────────────────────
function buff(s, c, dP, dV, permanent, fromBramble = false) {
  if (!c || c.zone !== 'board' || (dP <= 0 && dV <= 0)) return;
  if (permanent) { c.pP += dP; c.pV += dV; } else { c.tP += dP; c.tV += dV; }
  ev(s, { k: 'buff', uid: c.uid, dP, dV, perm: !!permanent });
  if (!c.awake) {
    c.awake = true;
    if (c.cid === 'mossback') { log(s, c.ctrl, 'Mossback awakens: gain 2 Life.'); gainLife(s, c.ctrl, 2); }
  }
  if (!permanent) return;
  c.grown = true;
  const board = s.players[c.ctrl].board;
  if (!fromBramble) {
    for (const u of [...board]) {
      if (u === c.uid || s.cards[u].cid !== 'grandmother-bramble' || c.zone !== 'board') continue;
      log(s, c.ctrl, `Grandmother Bramble: ${nameOf(c)} gets +1/+1 more.`);
      buff(s, c, 1, 1, true, true);
    }
  }
  for (const u of [...board]) {
    const g = s.cards[u];
    if (g.cid !== 'little-gardener' || g.uid === c.uid || g.gTurn === s.turn) continue;
    g.gTurn = s.turn;
    log(s, c.ctrl, 'Little Gardener grows +1/+1.');
    buff(s, g, 1, 1, true);
  }
}

const giveKw = (c, ...kws) => { if (c && c.zone === 'board') c.tKw = [...(c.tKw || []), ...kws]; };

// `src` is the creature dealing the damage, for Venom and Drain.
function damage(s, c, n, src = null) {
  if (n <= 0 || !c || c.zone !== 'board') return;
  c.dmg += n;
  c.hurt = true;
  if (src && hasKw(s, src, 'venom')) c.venomed = true;
  ev(s, { k: 'dmg', uid: c.uid, n, src: src ? src.uid : null });
  if (src && hasKw(s, src, 'drain')) gainLife(s, src.ctrl ?? src.owner, n);
}

function damagePlayer(s, pi, n, src = null) {
  if (n <= 0 || s.players[pi].out) return;
  log(s, pi, `${s.players[pi].name} takes ${n} damage.`);
  ev(s, { k: 'hitPlayer', p: pi, n, src: src ? src.uid : null });
  loseLife(s, pi, n);
  if (src && hasKw(s, src, 'drain')) gainLife(s, src.ctrl ?? src.owner, n);
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
  const gone = [];
  for (const c of dead) {
    if (c.zone !== 'board') continue;
    const ctrl = c.ctrl, as = c.cid;
    removeFrom(s.players[ctrl].board, c.uid);
    s.died += 1;
    s.diedOwn[ctrl] += 1;
    log(s, ctrl, `${nameOf(c)} dies.`);
    ev(s, { k: 'die', uid: c.uid, cid: as, owner: c.owner, ctrl });
    resetPlay(c);
    toDiscard(s, c, 'board');
    gone.push({ c, as, ctrl });
  }
  for (const { c, as, ctrl } of gone) {
    const P = s.players[ctrl];
    for (const u of before[ctrl]) {
      if (u === c.uid) continue;
      const o = s.cards[u];
      if (o.cid === 'ash-collector' && o.zone === 'board' && o.ctrl === ctrl) buff(s, o, 1, 0, false);
      if (o.cid === 'kindly-undertaker') { log(s, ctrl, 'Kindly Undertaker: gain 1 Life.'); gainLife(s, ctrl, 1); }
      if (o.cid === 'the-pale-abbess') {
        log(s, ctrl, 'The Pale Abbess takes her tithe: each opponent loses 1 Life.');
        for (const o2 of opponents(s, ctrl)) loseLife(s, o2.i, 1);
      }
    }
    for (const u of P.relics) if (s.cards[u].cid === 'the-kiln') {
      log(s, ctrl, 'The Kiln flares: 1 damage to each opponent.');
      for (const o of opponents(s, ctrl)) damagePlayer(s, o.i, 1);
    }
    for (const Q of s.players) for (const u of [...Q.board]) if (s.cards[u].cid === 'hungry-ghoul') buff(s, s.cards[u], 1, 1, true);
    if (BY_ID[as].keywords.includes('lastBreath')) lastBreath(s, c, as, ctrl);
  }
}

function lastBreath(s, c, as, ctrl) {
  switch (as) {
    case 'cinderling':
      log(s, ctrl, 'Cinderling’s Last Breath burns each opponent.');
      for (const o of opponents(s, ctrl)) damagePlayer(s, o.i, 1);
      break;
    case 'grave-rat':
      mill(s, ctrl, 2);
      break;
    case 'phoenix-of-the-last-spark': {
      const O = s.players[c.owner];
      if (c.zone !== 'discard' || c.cid !== 'phoenix-of-the-last-spark') break;
      c.phoenixTurn = O.turns + 1;
      log(s, c.owner, `The Phoenix can return to ${O.name}'s hand next turn for 2 Energy.`);
      break;
    }
    case 'smoldering-golem':
      log(s, ctrl, 'Smoldering Golem bursts: 2 damage to every creature and each opponent.');
      for (const Q of s.players) for (const u of [...Q.board]) damage(s, s.cards[u], 2);
      for (const o of opponents(s, ctrl)) damagePlayer(s, o.i, 2);
      break;
  }
}

function settle(s) {
  for (let guard = 0; guard < 60; guard++) {
    const dead = [];
    for (const P of s.players) for (const u of P.board) {
      const c = s.cards[u];
      if (c.dmg >= vitality(s, c) || (c.venomed && c.dmg > 0)) dead.push(c);
    }
    if (!dead.length) break;
    killBatch(s, dead);
  }
  for (const P of s.players) for (const u of [...P.board]) {
    const c = s.cards[u];
    if (!c.hurt) continue;
    c.hurt = false;
    if (c.cid === 'patient-giant') { log(s, c.ctrl, 'Patient Giant survives and gets +1 Power.'); buff(s, c, 1, 0, true); }
  }
}

function sacrifice(s, c) {
  log(s, c.ctrl, `${s.players[c.ctrl].name} sacrifices ${nameOf(c)}.`);
  killBatch(s, [c]);
}

function bounce(s, c) {
  if (!c) return;
  if (c.zone === 'board') removeFrom(s.players[c.ctrl].board, c.uid);
  else if (c.zone === 'relic') removeFrom(s.players[c.ctrl].relics, c.uid);
  else return;
  log(s, c.owner, `${nameOf(c)} returns to ${s.players[c.owner].name}'s hand.`);
  ev(s, { k: 'bounce', uid: c.uid });
  resetPlay(c);
  toHand(s, c, 'board');
}

function destroyRelic(s, c) {
  if (!c || c.zone !== 'relic') return;
  removeFrom(s.players[c.ctrl].relics, c.uid);
  log(s, c.ctrl, `${nameOf(c)} is destroyed.`);
  ev(s, { k: 'die', uid: c.uid, cid: c.cid, owner: c.owner, ctrl: c.ctrl });
  resetPlay(c);
  toDiscard(s, c, 'board');
}

// Move a creature onto another player's side of the table.
function takeControl(s, c, pi, until) {
  if (!c || c.zone !== 'board' || c.ctrl === pi) return false;
  const P = s.players[pi];
  if (P.board.length >= RULES.boardMax) { log(s, pi, `${P.name} has no room for ${nameOf(c)}.`); return false; }
  const from = c.ctrl;
  removeFrom(s.players[from].board, c.uid);
  P.board.push(c.uid);
  c.ctrl = pi;
  if (until) c.stolen = c.stolen || { back: from };
  else delete c.stolen;
  ev(s, { k: 'steal', uid: c.uid, from, to: pi });
  return true;
}

function makeTokens(s, pi, cid, n) {
  const P = s.players[pi];
  let made = 0;
  for (let k = 0; k < n && P.board.length < RULES.boardMax; k++, made++) {
    const t = mk(s, cid, pi, 'board');
    enterPlay(s, t, pi);
    ev(s, { k: 'token', uid: t.uid, p: pi });
  }
  if (made) log(s, pi, `${P.name} creates ${made} ${BY_ID[cid].name}${made === 1 ? '' : 's'}.`);
}

// ── fighting ────────────────────────────────────────────────────────
export function canAttack(s, pi, c) {
  return !!c && c.zone === 'board' && c.ctrl === pi && !c.ex &&
    (c.played < s.turn || !!c.rush || hasKw(s, c, 'rush'));
}

// Can creature b block attacker a?
export function canBlock(s, b, a) {
  if (!b || b.zone !== 'board' || b.ex || def(b).cantBlock) return false;
  if (a && hasKw(s, a, 'soar') && !hasKw(s, b, 'soar') && !hasKw(s, b, 'reach')) return false;
  return true;
}

export const blockLimit = (s, b) => (hasKw(s, b, 'guard') ? 2 : 1);

const otherSide = (C) => (C.prio === C.a ? C.d : C.a);
const combatOver = (s, C) => s.combat !== C;

function clearCombatMarks(s) {
  for (const P of s.players) for (const u of P.board) { delete s.cards[u].attacking; delete s.cards[u].blocking; }
}

function endCombat(s) {
  if (!s.combat) return;
  clearCombatMarks(s);
  s.combat = null;
  if (s.phase === 'combat') s.phase = 'main';
  ev(s, { k: 'combatEnd' });
}

// Attackers that died, went home or changed sides leave the fight.
function pruneCombat(s) {
  const C = s.combat;
  if (!C) return;
  C.att = C.att.filter((u) => s.cards[u].zone === 'board' && s.cards[u].ctrl === C.a);
  if (!C.att.length) { log(s, C.a, 'No attackers are left; the fight is over.'); endCombat(s); }
}

function attack(s, pi, a) {
  const P = s.players[pi], d = a.target, Q = s.players[d];
  P.attackedOn = s.turn;
  const att = a.att.map((u) => s.cards[u]);
  s.phase = 'combat';
  const C = s.combat = { a: pi, d, att: [...a.att], hunt: (a.hunt || []).map((h) => [...h]), blk: {}, step: 'block', prio: d, passes: 0 };
  log(s, pi, `${P.name} attacks ${Q.name} with ${listNames(att.map(nameOf))}.`);
  for (const c of att) {
    c.attacking = true;
    if (!hasKw(s, c, 'watchful')) c.ex = true;
    ev(s, { k: 'attack', uid: c.uid, target: { p: d } });
  }
  for (const [au, tu] of C.hunt) log(s, pi, `${nameOf(s.cards[au])} hunts ${nameOf(s.cards[tu])}: it must block.`);
  // "Whenever it attacks"
  for (const c of att) {
    if (c.zone !== 'board') continue;
    if (c.cid === 'reckless-initiate') { log(s, pi, 'Reckless Initiate singes itself.'); damage(s, c, 1); }
    if (c.cid === 'ashmaw') {
      log(s, pi, `Ashmaw breathes fire over ${Q.name}'s creatures.`);
      ev(s, { k: 'breath', uid: c.uid, p: d });
      for (const u of [...Q.board]) damage(s, s.cards[u], 2, c);
    }
  }
  settle(s);
  if (combatOver(s, C)) return;
  // The defender's Traps spring now.
  for (const u of [...Q.traps]) {
    const t = s.cards[u];
    if (t.cid === 'riptide') {
      const live = C.att.map((x) => s.cards[x]).filter((x) => x.zone === 'board' && x.ctrl === pi);
      if (!live.length) continue;
      springTrap(s, Q, t);
      const big = live.reduce((m, x) => (def(x).cost > def(m).cost ? x : m), live[0]);
      bounce(s, big);
    } else if (t.cid === 'ambush-at-dawn') {
      springTrap(s, Q, t);
      makeTokens(s, d, 'spirit', 2);
    }
  }
  settle(s);
  if (combatOver(s, C)) return;
  pruneCombat(s);
}

function springTrap(s, Q, t) {
  removeFrom(Q.traps, t.uid);
  log(s, Q.i, `${Q.name}'s Trap springs: ${nameOf(t)}!`);
  ev(s, { k: 'trap', p: Q.i, uid: t.uid, cid: t.cid });
  t.zone = 'stack';
  toDiscard(s, t, 'trap');
}

// C.blk maps each blocked attacker to its blockers, in the order they were chosen.
function declareBlocks(s, pi, blocks) {
  const C = s.combat, Q = s.players[pi];
  C.blk = {};
  for (const [b, at] of blocks) {
    (C.blk[at] ||= []).push(b);
    s.cards[b].blocking = true;
    ev(s, { k: 'block', uid: b, att: at });
  }
  const said = Object.entries(C.blk).map(([at, bs]) => `${listNames(bs.map((b) => nameOf(s.cards[b])))} ${bs.length > 1 ? 'block' : 'blocks'} ${nameOf(s.cards[at])}`);
  log(s, pi, said.length ? `${Q.name}: ${said.join('; ')}.` : `${Q.name} doesn't block.`);
  C.step = 'tricks';
  C.prio = C.a;
  C.passes = 0;
}

// Combat damage: Swift creatures strike first, then everyone still standing.
function fight(s) {
  const C = s.combat, d = C.d;
  const live = (c, side) => !!c && c.zone === 'board' && c.ctrl === side;
  const groups = C.att.map((u) => s.cards[u]).filter((c) => live(c, C.a))
    .map((a) => ({ a, bs: (C.blk[a.uid] || []).map((u) => s.cards[u]) }));
  ev(s, { k: 'fight', a: C.a, d });
  for (const first of [true, false]) {
    for (const { a, bs } of groups) {
      const standing = bs.filter((b) => live(b, d));
      if (live(a, C.a) && hasKw(s, a, 'swift') === first) strike(s, a, bs, standing, d);
      for (const b of standing) {
        if (!live(a, C.a) || hasKw(s, b, 'swift') !== first) continue;
        ev(s, { k: 'strike', uid: b.uid, to: a.uid });
        damage(s, a, power(s, b), b);
      }
    }
    settle(s);
    if (combatOver(s, C)) return;
  }
  endCombat(s);
}

// `bs` are the creatures that blocked `a`; `standing` those still there.
function strike(s, a, bs, standing, d) {
  const pw = power(s, a);
  if (!bs.length) { hitInFight(s, a, d, pw); return; }
  // Its blockers are gone: only Overrun carries the damage through.
  if (!standing.length) { if (hasKw(s, a, 'overrun')) hitInFight(s, a, d, pw); return; }
  const { parts, rest } = splitDamage(s, a, standing, pw);
  for (const [b, n] of parts) {
    ev(s, { k: 'strike', uid: a.uid, to: b.uid });
    damage(s, b, n, a);
  }
  if (rest > 0) { log(s, a.ctrl, `${nameOf(a)} overruns!`); hitInFight(s, a, d, rest); }
}

// An attacker blocked by several creatures splits its damage: it destroys
// the costliest blockers it can, one after another; what is left lands on
// the next blocker, or with Overrun (once every blocker has its fill) on the player.
export function splitDamage(s, a, bs, pw) {
  const venom = hasKw(s, a, 'venom');
  const lethal = (b) => { const left = Math.max(0, vitality(s, b) - b.dmg); return venom ? Math.min(1, left) : left; };
  const order = [...bs].sort((x, y) => def(y).cost - def(x).cost || power(s, y) - power(s, x) || x.uid - y.uid);
  const got = new Map();
  let rest = pw;
  for (const b of order) {
    const need = lethal(b);
    if (need > 0 && need <= rest) { got.set(b, need); rest -= need; }
  }
  if (rest > 0) {
    const spare = order.find((b) => !got.has(b));
    if (spare) { got.set(spare, rest); rest = 0; }
    else if (!hasKw(s, a, 'overrun')) { got.set(order[0], got.get(order[0]) + rest); rest = 0; }
  }
  return { parts: order.filter((b) => got.has(b)).map((b) => [b, got.get(b)]), rest };
}

// Combat damage to a player. It takes the Crown if they hold it (or if nobody does yet).
function hitInFight(s, a, d, n) {
  ev(s, { k: 'strike', uid: a.uid, to: { p: d } });
  damagePlayer(s, d, n, a);
  if (n > 0 && s.crownOn && s.phase !== 'over' && (s.crown == null || s.crown === d) && !s.players[a.ctrl].out) setCrown(s, a.ctrl);
}

// After every move in a fight: skip anyone who has nothing they could do.
function advance(s) {
  for (let guard = 0; guard < 12 && s.phase === 'combat'; guard++) {
    const C = s.combat;
    if (C.step === 'block') {
      if (blockersExist(s, C) || canRespond(s, C.d)) return;
      declareBlocks(s, C.d, forcedBlocks(s, C));
      continue;
    }
    if (C.passes >= 2) { fight(s); return; }
    if (canRespond(s, C.prio)) return;
    C.passes += 1;
    C.prio = otherSide(C);
  }
}

function blockersExist(s, C) {
  const att = C.att.map((u) => s.cards[u]);
  return s.players[C.d].board.some((u) => att.some((a) => canBlock(s, s.cards[u], a)));
}

// Hunt targets that can still block their hunter must do so.
export function forcedBlocks(s, C = s.combat) {
  const out = [];
  for (const [au, tu] of C.hunt) {
    const a = s.cards[au], t = s.cards[tu];
    if (!C.att.includes(au) || a.zone !== 'board' || !t || t.zone !== 'board' || t.ctrl !== C.d || !canBlock(s, t, a)) continue;
    if (out.some(([b, x]) => x === au)) continue;
    if (out.filter(([b]) => b === tu).length >= blockLimit(s, t)) continue;
    out.push([tu, au]);
  }
  return out;
}

// Does this player have anything to do in a fight: a Trick, or a creature's ability?
function canRespond(s, pi) {
  const P = s.players[pi];
  if (P.out) return false;
  return P.hand.some((u) => isTrick(def(s.cards[u])) && playOptions(s, pi, s.cards[u], 'hand', 1).length > 0)
    || P.board.some((u) => def(s.cards[u]).ability && useOptions(s, pi, s.cards[u], 1).length > 0);
}

// ── abilities ───────────────────────────────────────────────────────
// "Pay N Energy: …" on a creature. Each works once each turn, whenever you
// could play a Trick: on your own turn, or during a fight you are in.
export function abilityNeeds(s, pi, c) {
  const T = (uids) => uids.map((u) => ({ uid: u }));
  const others = s.players[pi].board.filter((u) => u !== c.uid);
  switch (c.cid) {
    case 'ember-duelist': return { target: T(s.players.flatMap((Q) => Q.board)) };
    case 'canopy-archer': return { target: T(s.players.flatMap((Q) => Q.board).filter((u) => hasKw(s, s.cards[u], 'soar'))) };
    case 'hungry-ghoul': case 'dawnwatch-knight': return { target: T(others) };
    default: return {};
  }
}

// Every legal way to use a creature's ability or a Relic, up to `limit` (whose move it is aside).
export function useOptions(s, pi, c, limit = Infinity) {
  const out = [];
  if (!c) return out;
  const base = { t: 'use', p: pi, uid: c.uid };
  const push = (a) => { if (out.length < limit && !checkUse(s, a)) out.push(a); };
  if (c.zone === 'relic') {
    if (c.cid === 'bone-altar') for (const sac of s.players[pi].board) push({ ...base, sac });
    return out;
  }
  if (!def(c).ability || c.zone !== 'board') return out;
  const n = abilityNeeds(s, pi, c);
  if (n.target) for (const target of n.target) push({ ...base, target });
  else push(base);
  return out;
}

// ── what a card needs from the player ───────────────────────────────
// Returns the choices a card asks for when played, with legal options.
// UI and bot both use this, and check() validates against it.
// Keys: target (one of a list; `optional` if it may be skipped), sac (your
// creature to sacrifice), fighter (your creature that fights), pick / picks
// (cards in a discard pile), targets (several of your creatures), keep /
// bottom / discard (looking at your own cards).
export function needs(s, pi, c, from = 'hand') {
  const P = s.players[pi];
  const all = s.players.flatMap((Q) => Q.board);
  const own = [...P.board];
  const enemy = opponents(s, pi).flatMap((Q) => Q.board);
  const relics = s.players.flatMap((Q) => Q.relics);
  const T = (uids) => uids.map((u) => ({ uid: u }));
  const anyTarget = [...living(s).map((Q) => ({ p: Q.i })), ...T(all)];
  const discardOf = (pred) => P.discard.filter((u) => pred(def(s.cards[u])));
  const creature = def(c).type === 'creature';
  // A creature's "when played" choice is skipped when there's nothing to choose.
  const pickOne = (uids, optional = false) => ({ target: T(uids), optional: optional || (creature && !uids.length) });
  switch (c.cid) {
    case 'feed-the-flame':
    case 'funeral-pyre':
      return { sac: own, target: anyTarget };
    case 'the-mountain-is-angry':
      return { target: opponents(s, pi).map((Q) => ({ p: Q.i })) };
    case 'wild-growth': case 'kindle': case 'sudden-growth': case 'kiss-of-night': case 'bastion':
      return pickOne(own);
    case 'worldtree-stag':
      return pickOne(own, true);
    case 'not-yet':
      return pickOne([...all, ...relics].filter((u) => def(s.cards[u]).cost <= 3));
    case 'deepwater-leviathan': case 'tidal-mimic':
      return pickOne(all, true);
    case 'death-is-a-door':
      return pickOne([...all, ...relics]);
    case 'apex-predator': case 'scorch': case 'sea-change':
      return pickOne(all);
    case 'mutiny': case 'sky-warden':
      return pickOne(enemy);
    case 'nerissa':
      return pickOne(enemy.filter((u) => def(s.cards[u]).cost <= 4), true);
    case 'savage-clash':
      return { fighter: own, target: T(enemy) };
    case 'grove-druid':
      return pickOne(relics, true);
    case 'dawns-judgment':
      return pickOne(s.combat ? s.combat.att.filter((u) => s.cards[u].zone === 'board') : []);
    case 'unearth':
      return { pick: discardOf((d) => d.type === 'creature' && d.cost <= 2) };
    case 'borrowed-time':
      return { pick: discardOf((d) => d.type === 'creature') };
    case 'the-barrow-queen':
      return { pick: living(s).flatMap((Q) => Q.discard.filter((u) => def(s.cards[u]).type === 'creature')), optional: true };
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

export function phoenixReady(s, pi) {
  const P = s.players[pi];
  return P.discard.filter((u) => s.cards[u].cid === 'phoenix-of-the-last-spark' && s.cards[u].phoenixTurn === P.turns);
}

// Could this card be played right now (ignoring whose move it is)?
function checkPlay(s, a) {
  const P = s.players[a.p];
  const c = s.cards[a.uid];
  const from = a.from === 'discard' ? 'discard' : 'hand';
  if (!c || !(from === 'hand' ? P.hand : P.discard).includes(a.uid)) return 'That card is not available.';
  const d = def(c);
  if (from === 'discard' && !d.echo) return 'Only Echo cards can be played from the discard pile.';
  if (s.phase === 'combat' && !isTrick(d)) return 'During a fight you can only play Tricks.';
  if (price(s, a.p, c, from).cost > P.energy) return 'Not enough Energy.';
  if (d.type === 'creature' && P.board.length >= RULES.boardMax) return `You already have ${RULES.boardMax} creatures.`;
  if (d.type === 'relic' && P.relics.length >= RULES.relicMax) return `You already have ${RULES.relicMax} Relics.`;
  if (c.cid === 'mutiny' && P.board.length >= RULES.boardMax) return 'You have no room for another creature.';
  const n = needs(s, a.p, c, from);
  if (n.sac || n.fighter) {
    const mine = n.sac || n.fighter, chosen = n.sac ? a.sac : a.fighter;
    if (!mine.includes(chosen)) return n.sac ? 'Choose one of your creatures to sacrifice.' : 'Choose one of your creatures to fight.';
    if (!n.target.some((t) => sameTarget(t, a.target)) || sameTarget(a.target, { uid: chosen })) return 'Choose a target.';
  } else if (n.target) {
    if (a.target == null) { if (!n.optional) return n.target.length ? 'Choose a target.' : 'There is nothing to target.'; }
    else if (!n.target.some((t) => sameTarget(t, a.target))) return 'That is not a legal target.';
  }
  if (n.pick) {
    if (a.pick == null) { if (!n.optional) return n.pick.length ? 'Choose a card from a discard pile.' : 'There is nothing to return.'; }
    else if (!n.pick.includes(a.pick)) return 'Choose a card from a discard pile.';
    if (c.cid === 'borrowed-time' && P.board.length >= RULES.boardMax) return `You already have ${RULES.boardMax} creatures.`;
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

function checkAttack(s, a) {
  const P = s.players[a.p];
  if (P.attackedOn === s.turn) return 'You already attacked this turn.';
  const Q = s.players[a.target];
  if (!Q || Q.out || a.target === a.p) return 'Choose an opponent to attack.';
  const att = a.att || [];
  if (!att.length) return 'Choose at least one creature to attack with.';
  if (new Set(att).size !== att.length) return 'Each creature attacks once.';
  for (const u of att) if (!canAttack(s, a.p, s.cards[u])) return `${s.cards[u] ? nameOf(s.cards[u]) : 'That'} can't attack now.`;
  const hunted = new Set();
  for (const h of a.hunt || []) {
    const [au, tu] = h || [];
    const ac = s.cards[au], tc = s.cards[tu];
    if (!att.includes(au) || !hasKw(s, ac, 'hunt')) return 'Only an attacker with Hunt can choose its prey.';
    if (hunted.has(au)) return 'Each hunter chooses one creature.';
    hunted.add(au);
    if (!tc || tc.zone !== 'board' || tc.ctrl !== a.target || !canBlock(s, tc, ac)) return 'Hunt a creature that could block it.';
  }
  return null;
}

function checkBlock(s, a) {
  const C = s.combat;
  if (C.step !== 'block') return 'Blockers are already chosen.';
  const blocks = a.blocks || [];
  const seen = new Set(), count = {};
  for (const pair of blocks) {
    const [b, at] = pair || [];
    const bc = s.cards[b], ac = s.cards[at];
    if (!C.att.includes(at) || !ac || ac.zone !== 'board') return 'That creature is not attacking.';
    if (seen.has(`${b}>${at}`)) return 'That creature is already blocking it.';
    seen.add(`${b}>${at}`);
    if (!bc || bc.zone !== 'board' || bc.ctrl !== a.p) return 'Block with your own creatures.';
    if (!canBlock(s, bc, ac)) return `${nameOf(bc)} can't block ${nameOf(ac)}.`;
    count[b] = (count[b] || 0) + 1;
    if (count[b] > blockLimit(s, bc)) return `${nameOf(bc)} can only block one attacker.`;
  }
  for (const [tu, au] of forcedBlocks(s, C)) {
    if (!blocks.some(([b, x]) => b === tu && x === au)) return `${nameOf(s.cards[tu])} must block ${nameOf(s.cards[au])} (Hunt).`;
  }
  return null;
}

function checkUse(s, a) {
  const P = s.players[a.p];
  const c = s.cards[a.uid];
  if (c?.zone === 'relic') {
    if (!P.relics.includes(a.uid)) return 'That Relic is not yours.';
    if (c.cid !== 'bone-altar') return 'That Relic works by itself.';
    if (a.p !== s.active) return 'Only on your turn.';
    if (c.usedOn === s.turn) return 'Already used this turn.';
    if (!P.board.includes(a.sac)) return 'Choose one of your creatures to sacrifice.';
    return null;
  }
  if (!c || c.zone !== 'board' || c.ctrl !== a.p) return 'Use your own creatures.';
  const ab = def(c).ability;
  if (!ab) return `${nameOf(c)} has no ability to use.`;
  if (c.usedOn === s.turn) return 'Already used this turn.';
  if (ab.cost > P.energy) return 'Not enough Energy.';
  if (c.cid === 'choirmother' && P.board.length >= RULES.boardMax) return `You already have ${RULES.boardMax} creatures.`;
  const n = abilityNeeds(s, a.p, c);
  if (n.target && !n.target.some((t) => sameTarget(t, a.target))) return n.target.length ? 'Choose a target.' : 'There is nothing to target.';
  return null;
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
  if (s.phase === 'mulligan') return 'Decide on your opening hand first.';
  if (P.out) return 'You are out of the game.';
  if (actor(s) !== a.p) return s.phase === 'combat' ? 'Wait: someone else is deciding.' : 'It is not your turn.';

  if (s.phase === 'combat') {
    switch (a.t) {
      case 'play': return checkPlay(s, a);
      case 'block': return checkBlock(s, a);
      case 'pass': return s.combat.step === 'tricks' ? null : 'Choose your blockers first.';
      case 'use': return checkUse(s, a);
      default: return 'Finish the fight first.';
    }
  }
  switch (a.t) {
    case 'end': return null;
    case 'play': return checkPlay(s, a);
    case 'attack': return checkAttack(s, a);
    case 'use': return checkUse(s, a);
    case 'phoenix':
      if (!phoenixReady(s, a.p).includes(a.uid)) return 'The Phoenix cannot return now.';
      if (P.energy < 2) return 'Not enough Energy.';
      if (P.hand.length >= RULES.handMax) return 'Your hand is full.';
      return null;
    case 'block': case 'pass': return 'Nobody is attacking.';
  }
  return 'Unknown action.';
}

// ── doing things ────────────────────────────────────────────────────
function resolveSpell(s, pi, c, a) {
  const P = s.players[pi];
  const tc = (t) => (t && t.uid != null ? s.cards[t.uid] : null);
  const t = tc(a.target);
  switch (c.cid) {
    case 'spark':
      P.energy += 1;
      break;
    case 'feed-the-flame': {
      const sac = s.cards[a.sac], hadLB = def(sac).keywords.includes('lastBreath');
      sacrifice(s, sac);
      hit(s, a.target, hadLB ? 4 : 3);
      break;
    }
    case 'funeral-pyre': {
      const sac = s.cards[a.sac], pw = power(s, sac), as = sac.cid, ctrl = sac.ctrl;
      sacrifice(s, sac);
      hit(s, a.target, pw);
      if (BY_ID[as].keywords.includes('lastBreath')) { log(s, pi, `${BY_ID[as].name}’s Last Breath happens again.`); lastBreath(s, sac, as, ctrl); }
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
      buff(s, t, 2, 2, true);
      break;
    case 'ancient-roots':
      P.maxEnergy = Math.min(RULES.maxEnergy, P.maxEnergy + 1);
      break;
    case 'not-yet':
      bounce(s, t);
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
      const b = s.cards[a.pick];
      if (removeFrom(P.discard, a.pick)) {
        enterPlay(s, b, pi);
        b.rush = true;
        b.sacEnd = true;
        log(s, pi, `${nameOf(b)} returns to play until the end of the turn.`);
      }
      break;
    }
    case 'death-is-a-door':
      if (t?.zone === 'board') { log(s, pi, `${nameOf(t)} is destroyed.`); killBatch(s, [t]); }
      else if (t?.zone === 'relic') destroyRelic(s, t);
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
    // ── the second half ──
    case 'scorch':
      hit(s, a.target, 2);
      break;
    case 'kindle':
      buff(s, t, 2, 0, false);
      giveKw(t, 'swift');
      break;
    case 'mutiny':
      if (takeControl(s, t, pi, true)) {
        t.ex = false;
        t.rush = true;
        log(s, pi, `${P.name} takes ${nameOf(t)} until the end of the turn.`);
      }
      break;
    case 'sudden-growth':
      buff(s, t, 3, 3, false);
      break;
    case 'savage-clash': {
      const f = s.cards[a.fighter];
      if (f?.zone === 'board' && t?.zone === 'board') {
        log(s, pi, `${nameOf(f)} fights ${nameOf(t)}.`);
        ev(s, { k: 'clash', uid: f.uid, to: t.uid });
        const pf = power(s, f), pt = power(s, t);
        damage(s, t, pf, f);
        damage(s, f, pt, t);
      }
      break;
    }
    case 'stampede':
      for (const u of [...P.board]) { buff(s, s.cards[u], 2, 2, false); giveKw(s.cards[u], 'overrun'); }
      break;
    case 'sea-change':
      if (t?.zone === 'board') {
        log(s, pi, `${nameOf(t)} becomes a Fish.`);
        t.baseCid = t.baseCid || t.cid;
        t.cid = 'fish';
        Object.assign(t, { pP: 0, pV: 0, tP: 0, tV: 0, awake: true });
        delete t.tKw;
        ev(s, { k: 'transform', uid: t.uid });
      }
      break;
    case 'one-more-wave':
      P.extra += 1;
      log(s, pi, `${P.name} will take an extra turn.`);
      break;
    case 'kiss-of-night':
      giveKw(t, 'venom', 'drain');
      if (t) ev(s, { k: 'buff', uid: t.uid, dP: 0, dV: 0 });
      break;
    case 'the-culling': {
      const doomed = s.players.flatMap((Q) => Q.board.map((u) => s.cards[u])).filter((x) => power(s, x) <= 2);
      log(s, pi, 'The Culling: every creature with 2 or less Power is destroyed.');
      killBatch(s, doomed);
      break;
    }
    case 'bastion':
      buff(s, t, 1, 3, false);
      break;
    case 'dawns-judgment':
      if (t?.zone === 'board') { log(s, pi, `Dawn’s Judgment destroys ${nameOf(t)}.`); killBatch(s, [t]); }
      break;
  }
}

function creatureEnters(s, pi, c, a, from) {
  const P = s.players[pi];
  const tc = (t) => (t && t.uid != null ? s.cards[t.uid] : null);
  const t = tc(a.target);
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
      if (t) buff(s, t, 2, 2, true);
      break;
    case 'deepwater-leviathan':
      if (t) bounce(s, t);
      break;
    case 'dawn-captain':
      makeTokens(s, pi, 'spirit', 2);
      break;
    case 'apex-predator':
      if (t && t.zone === 'board') {
        log(s, pi, `Apex Predator fights ${nameOf(t)}.`);
        ev(s, { k: 'clash', uid: c.uid, to: t.uid });
        const pa = power(s, c), pt = power(s, t);
        damage(s, t, pa, c);
        damage(s, c, pt, t);
        settle(s);
        if (c.zone === 'board') buff(s, c, 2, 2, true);
      }
      break;
    case 'the-one-who-came-back':
      if (from === 'discard') {
        log(s, pi, 'The One Who Came Back: each opponent loses 3 Life.');
        for (const o of opponents(s, pi)) loseLife(s, o.i, 3);
      }
      break;
    // ── the second half ──
    case 'grove-druid':
      if (t?.zone === 'relic') destroyRelic(s, t);
      else { P.maxEnergy = Math.min(RULES.maxEnergy, P.maxEnergy + 1); log(s, pi, `${P.name}'s maximum Energy grows to ${P.maxEnergy}.`); }
      break;
    case 'windborne-sage':
      draw(s, pi, 1);
      break;
    case 'tidal-mimic':
      if (t && t.zone === 'board' && t.uid !== c.uid) {
        log(s, pi, `Tidal Mimic becomes a copy of ${nameOf(t)}.`);
        c.baseCid = 'tidal-mimic';
        c.cid = t.cid;
        ev(s, { k: 'transform', uid: c.uid });
      }
      break;
    case 'nerissa':
      if (t && takeControl(s, t, pi, false)) {
        t.played = s.turn;
        log(s, pi, `Nerissa sings: ${nameOf(t)} joins ${P.name} for good.`);
      }
      break;
    case 'the-barrow-queen': {
      const b = s.cards[a.pick];
      if (!b || b.zone !== 'discard') break;
      if (P.board.length >= RULES.boardMax) { log(s, pi, `${P.name} has no room for another creature.`); break; }
      removeFrom(s.players[b.owner].discard, b.uid);
      enterPlay(s, b, pi);
      log(s, pi, `The Barrow Queen calls ${nameOf(b)} back from ${s.players[b.owner].name}'s discard pile.`);
      ev(s, { k: 'token', uid: b.uid, p: pi });
      break;
    }
    case 'lightweaver':
      makeTokens(s, pi, 'spirit', 1);
      break;
    case 'sky-warden':
      if (t?.zone === 'board') {
        t.ex = true;
        t.frozen = true;
        log(s, pi, `${nameOf(t)} is pinned down: it stays exhausted through its next turn.`);
        ev(s, { k: 'freeze', uid: t.uid });
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
  const set = d.subtype === 'Trap';
  log(s, pi, set ? `${P.name} sets a Trap face-down.` : `${P.name} plays ${d.name}${from === 'discard' ? ' from the discard pile (Echo)' : ''}.`);
  ev(s, { k: 'play', p: pi, uid: c.uid, cid: set ? null : c.cid, target: a.target || null, sac: a.sac ?? a.fighter ?? null });

  if (d.type === 'creature') {
    enterPlay(s, c, pi);
    creatureEnters(s, pi, c, a, from);
    settle(s);
    return;
  }
  if (d.type === 'relic') {
    c.zone = 'relic';
    c.ctrl = pi;
    c.chimes = 0;
    P.relics.push(c.uid);
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
  for (const Q of opponents(s, pi)) {
    const tu = Q.traps.find((u) => s.cards[u].cid === 'countercurrent');
    if (tu == null) continue;
    springTrap(s, Q, s.cards[tu]);
    if (a.payTax && P.energy >= 2) {
      P.energy -= 2;
      log(s, pi, `${P.name} pays 2 more Energy to get past it.`);
    } else {
      log(s, pi, `Countercurrent cancels ${d.name}.`);
      ev(s, { k: 'countered', uid: c.uid });
      toDiscard(s, c, 'stack');
      settle(s);
      return;
    }
    break;
  }
  resolveSpell(s, pi, c, a);
  if (set) { c.zone = 'trap'; P.traps.push(c.uid); }
  else toDiscard(s, c, 'stack');
  settle(s);
}

function use(s, pi, a) {
  const c = s.cards[a.uid];
  const P = s.players[pi];
  c.usedOn = s.turn;
  if (c.zone === 'relic') {
    const sac = s.cards[a.sac];
    log(s, pi, `Bone Altar: ${P.name} sacrifices ${nameOf(sac)} and draws a card.`);
    ev(s, { k: 'use', uid: c.uid, p: pi, cid: c.cid });
    sacrifice(s, sac);
    draw(s, pi, 1);
    settle(s);
    return;
  }
  const d = def(c);
  const t = a.target?.uid != null ? s.cards[a.target.uid] : null;
  P.energy -= d.ability.cost;
  log(s, pi, `${P.name} pays ${d.ability.cost} Energy: ${d.name} — ${d.ability.short}${t ? ` (${nameOf(t)})` : ''}.`);
  ev(s, { k: 'use', uid: c.uid, p: pi, cid: c.cid, target: a.target || null });
  switch (c.cid) {
    case 'reckless-initiate': buff(s, c, 2, 0, false); break;
    case 'ember-duelist': damage(s, t, 1, c); break;
    case 'mossback': buff(s, c, 1, 1, true); break;
    case 'canopy-archer': damage(s, t, 1, c); break;
    case 'curious-wisp': draw(s, pi, 1); break;
    case 'cloud-ray': bounce(s, c); break;
    case 'vesper-bat':
      for (const o of opponents(s, pi)) loseLife(s, o.i, 1);
      gainLife(s, pi, 1);
      break;
    case 'hungry-ghoul': if (t?.zone === 'board') sacrifice(s, t); break;
    case 'choirmother': makeTokens(s, pi, 'spirit', 1); break;
    case 'dawnwatch-knight': buff(s, t, 0, 2, false); break;
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
  for (const u of P.board) {
    const c = s.cards[u];
    if (c.frozen) c.frozen = false;
    else c.ex = false;
  }
  log(s, i, `${P.name}'s turn.`);
  ev(s, { k: 'turn', p: i });
  for (const u of [...P.relics]) {
    const r = s.cards[u];
    if (r.zone !== 'relic') continue;
    if (r.cid === 'heartwood-totem' && P.board.length) {
      const small = P.board.map((x) => s.cards[x]).reduce((m, x) => (power(s, x) < power(s, m) ? x : m));
      log(s, i, `Heartwood Totem strengthens ${nameOf(small)}.`);
      buff(s, small, 1, 1, true);
    }
    if (r.cid === 'beacon-of-hope') makeTokens(s, i, 'spirit', 1);
    if (r.cid === 'the-drowned-clock') {
      r.chimes = (r.chimes || 0) + 1;
      ev(s, { k: 'chime', uid: r.uid, n: r.chimes });
      if (r.chimes >= 3) {
        r.chimes = 0;
        log(s, i, 'The Drowned Clock strikes three: each opponent loses 6 Life.');
        for (const o of opponents(s, i)) loseLife(s, o.i, 6);
      } else log(s, i, `The Drowned Clock chimes (${r.chimes} of 3).`);
    }
  }
  for (const u of [...P.board]) {
    const c = s.cards[u];
    if (c.cid === 'seedling' && c.zone === 'board' && vitality(s, c) >= 3) {
      log(s, i, 'Seedling has grown: sacrifice it and draw a card.');
      killBatch(s, [c]);
      draw(s, i, 1);
    }
  }
  if (!(i === s.first && P.turns === 1)) draw(s, i, 1);
  settle(s);
  if (P.out && s.phase !== 'over') nextTurn(s);
}

function nextTurn(s) {
  if (s.phase === 'over') return;
  const cur = s.players[s.active];
  if (cur.extra > 0 && !cur.out) {
    cur.extra -= 1;
    log(s, cur.i, `${cur.name} takes an extra turn!`);
    startTurn(s, cur.i);
    return;
  }
  let i = s.active;
  for (let k = 0; k < s.players.length; k++) {
    i = (i + 1) % s.players.length;
    if (!s.players[i].out) break;
  }
  startTurn(s, i);
}

function endTurn(s) {
  const all = () => s.players.flatMap((Q) => Q.board.map((u) => s.cards[u]));
  const P = s.players[s.active];
  if (s.crownOn && s.crown === P.i && !P.out) {
    log(s, P.i, `${P.name} holds the Crown and draws a card.`);
    ev(s, { k: 'crownDraw', p: P.i });
    draw(s, P.i, 1);
    if (s.phase === 'over') return;
  }
  for (const c of all().filter((x) => x.sacEnd)) if (c.zone === 'board') { log(s, c.ctrl, `Borrowed Time runs out for ${nameOf(c)}.`); killBatch(s, [c]); }
  settle(s);
  // Borrowed creatures go home.
  for (const c of all().filter((x) => x.stolen)) {
    const back = s.players[c.stolen.back];
    removeFrom(s.players[c.ctrl].board, c.uid);
    delete c.stolen;
    delete c.rush;
    if (!back.out && back.board.length < RULES.boardMax) { back.board.push(c.uid); c.ctrl = back.i; log(s, back.i, `${nameOf(c)} returns to ${back.name}.`); ev(s, { k: 'steal', uid: c.uid, to: back.i }); }
    else { resetPlay(c); toDiscard(s, c, 'board'); }
  }
  for (const Q of s.players) for (const u of Q.board) {
    const c = s.cards[u];
    c.dmg = 0; c.tP = 0; c.tV = 0;
    delete c.tKw;
    delete c.venomed;
  }
  settle(s);
  s.died = 0;
  s.diedOwn = s.diedOwn.map(() => 0);
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
  else if (a.op === 'stat') { const c = s.cards[a.uid]; if (c?.zone === 'board') { c.pP += a.dP || 0; c.pV += a.dV || 0; log(s, c.ctrl, `🛠 ${who} adjusts ${nameOf(c)} by ${a.dP || 0}/${a.dV || 0}.`); settle(s); } }
  else if (a.op === 'move') {
    const c = s.cards[a.uid];
    if (!c) return;
    for (const Q of s.players) for (const z of ['hand', 'deck', 'discard', 'board', 'exile', 'traps', 'relics']) removeFrom(Q[z], c.uid);
    const P = s.players[c.owner];
    if (a.to === 'board') enterPlay(s, c, c.owner);
    else { resetPlay(c); c.zone = a.to; (a.to === 'deck' ? P.deck.unshift(c.uid) : P[a.to].push(c.uid)); }
    log(s, c.owner, `🛠 ${who} moves ${nameOf(c)} to ${a.to}.`);
    if (s.combat) pruneCombat(s);
    settle(s);
  }
}

// Apply one action. Returns { state, error }; on error the state is unchanged.
export function apply(state, a) {
  const error = check(state, a);
  if (error) return { state, error };
  const s = structuredClone(state);
  s.events = [];
  const inFight = s.phase === 'combat';
  switch (a.t) {
    case 'mulligan': mulligan(s, a.p, !!a.redraw); break;
    case 'play': play(s, a.p, a); break;
    case 'attack': attack(s, a.p, a); break;
    case 'block': declareBlocks(s, a.p, a.blocks || []); break;
    case 'pass': s.combat.passes += 1; s.combat.prio = otherSide(s.combat); break;
    case 'use': use(s, a.p, a); break;
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
  if (s.phase === 'combat') {
    // A Trick (or an ability) after blockers gives the other side a chance to answer.
    if (inFight && (a.t === 'play' || a.t === 'use') && s.combat.step === 'tricks') { s.combat.passes = 0; s.combat.prio = otherSide(s.combat); }
    pruneCombat(s);
    advance(s);
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
  else if (zone === 'relics') { c.zone = 'relic'; c.ctrl = owner; c.chimes = 0; P.relics.push(c.uid); }
  else P[zone].push(c.uid);
  Object.assign(c, extra);
  return c;
}

export function replay(setup, actions) {
  let s = newGame(setup);
  for (const a of actions) s = apply(s, a).state;
  return s;
}

// ── every legal move (for the bot and the fuzz tests) ──────────────
// All the ways to play one card, up to `limit` of them.
export function playOptions(s, pi, c, from = 'hand', limit = Infinity) {
  const out = [];
  const P = s.players[pi];
  const d = def(c);
  if (s.phase === 'combat' && !isTrick(d)) return out;
  if (price(s, pi, c, from).cost > P.energy) return out;
  const base = { t: 'play', p: pi, uid: c.uid, ...(from === 'discard' ? { from } : {}), payTax: true };
  const push = (a) => { if (out.length < limit && !checkPlay(s, a)) out.push(a); };
  const n = needs(s, pi, c, from);
  if (n.sac || n.fighter) {
    const key = n.sac ? 'sac' : 'fighter';
    for (const x of n.sac || n.fighter) for (const target of n.target) push({ ...base, [key]: x, target });
  } else if (n.target) {
    for (const target of n.target) push({ ...base, target });
    if (n.optional || !n.target.length) push(base);
  } else if (n.pick) {
    for (const pick of n.pick) push({ ...base, pick });
    if (n.optional || !n.pick.length) push(base);
  } else if (n.picks) {
    const best = [...n.picks].sort((x, y) => def(s.cards[y]).cost - def(s.cards[x]).cost).slice(0, n.max);
    push({ ...base, picks: best });
  } else if (n.targets) {
    const own = n.targets, k = n.count, combos = [];
    const rec = (start, acc) => { if (acc.length === k) { combos.push([...acc]); return; } for (let i = start; i < own.length; i++) { acc.push(own[i]); rec(i + 1, acc); acc.pop(); } };
    if (k > 0) rec(0, []);
    for (const targets of combos.slice(0, 40)) push({ ...base, targets });
  } else if (n.keep) {
    if (n.keep.length) for (const keep of n.keep) push({ ...base, keep }); else push(base);
  } else if (n.bottom) {
    push({ ...base, bottom: false });
    if (n.bottom.length) push({ ...base, bottom: true });
  } else if (n.discard) {
    for (const discard of n.discard) push({ ...base, discard });
  } else push(base);
  return out;
}

// A handful of sensible attack declarations against one opponent.
export function attackOptions(s, pi) {
  const out = [];
  const P = s.players[pi];
  if (P.attackedOn === s.turn || s.phase !== 'main') return out;
  const ready = P.board.filter((u) => canAttack(s, pi, s.cards[u]));
  if (!ready.length) return out;
  for (const Q of opponents(s, pi)) {
    const sets = [ready, ...ready.map((u) => [u])];
    if (ready.length > 2) for (const u of ready) sets.push(ready.filter((x) => x !== u));
    const seen = new Set();
    for (const att of sets) {
      const key = att.join(',');
      if (seen.has(key)) continue;
      seen.add(key);
      // Each hunter picks the toughest creature it could pin down.
      const hunt = [];
      for (const u of att) {
        const a = s.cards[u];
        if (!hasKw(s, a, 'hunt')) continue;
        const prey = Q.board.map((x) => s.cards[x]).filter((b) => canBlock(s, b, a));
        if (prey.length) hunt.push([u, prey.reduce((m, b) => (power(s, b) > power(s, m) ? b : m)).uid]);
      }
      out.push({ t: 'attack', p: pi, target: Q.i, att, ...(hunt.length ? { hunt } : {}) });
    }
  }
  return out.filter((a) => !checkAttack(s, a));
}

// A few block declarations: none, each single block, one blocker per
// attacker, and everyone who can piling onto the first attacker.
export function blockOptions(s, pi) {
  const C = s.combat;
  if (!C || C.step !== 'block' || C.d !== pi) return [];
  const forced = forcedBlocks(s, C);
  const free = s.players[pi].board.filter((u) => !forced.some(([b]) => b === u));
  const open = C.att.filter((u) => !forced.some(([, x]) => x === u));
  const out = [forced];
  for (const b of free) for (const at of open) if (canBlock(s, s.cards[b], s.cards[at])) out.push([...forced, [b, at]]);
  const greedy = [...forced], used = new Set();
  for (const at of open) {
    const b = free.find((x) => !used.has(x) && canBlock(s, s.cards[x], s.cards[at]));
    if (b != null) { used.add(b); greedy.push([b, at]); }
  }
  out.push(greedy);
  if (C.att.length) out.push([...forced, ...free.filter((b) => canBlock(s, s.cards[b], s.cards[C.att[0]])).map((b) => [b, C.att[0]])]);
  return out.map((blocks) => ({ t: 'block', p: pi, blocks })).filter((a) => !checkBlock(s, a));
}

export function legalActions(s, pi) {
  const out = [];
  const P = s.players[pi];
  if (s.phase === 'over' || P.out) return out;
  if (s.phase === 'mulligan') return P.mull ? out : [{ t: 'mulligan', p: pi, redraw: false }, { t: 'mulligan', p: pi, redraw: true }];
  if (actor(s) !== pi) return out;
  const sources = [...P.hand.map((u) => ['hand', u]), ...P.discard.filter((u) => def(s.cards[u]).echo).map((u) => ['discard', u])];
  for (const [from, uid] of sources) out.push(...playOptions(s, pi, s.cards[uid], from));
  for (const u of [...P.relics, ...P.board]) out.push(...useOptions(s, pi, s.cards[u]));
  if (s.phase === 'combat') {
    if (s.combat.step === 'block') out.push(...blockOptions(s, pi));
    else out.push({ t: 'pass', p: pi });
    return out;
  }
  for (const u of phoenixReady(s, pi)) { const a = { t: 'phoenix', p: pi, uid: u }; if (!check(s, a)) out.push(a); }
  out.push(...attackOptions(s, pi));
  out.push({ t: 'end', p: pi });
  return out;
}
