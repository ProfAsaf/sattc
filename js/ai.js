// Practice bot. On its own turn it tries every play and a handful of attacks,
// plays each fight out (guessing how the defender would block), scores the
// resulting position, and takes the best move until nothing beats ending the
// turn. When attacked it compares a few ways to block, with and without a
// Trick; after blockers are chosen it plays a Trick only if that wins more
// than holding the card. Quick enough for a phone.

import { apply, legalActions, opponents, power, vitality, actor, hasKw, canBlock, blockLimit, forcedBlocks, canAttack, playOptions, useOptions, splitDamage } from './engine.js';
import { BY_ID, isTrick } from './cards.js';

const lifeValue = (l) => (l <= 0 ? -200 : Math.sqrt(l) * 7 + l * 0.5);
const CROWN = 4.5; // a card at the end of every turn, for as long as you keep it

const KW_VALUE = { soar: 1.3, venom: 1.2, drain: 0.8, swift: 0.8, overrun: 0.6, watchful: 0.5, reach: 0.4, guard: 0.6, hunt: 0.7, lastBreath: 0.8 };
const ENGINES = new Set(['standard-keeper', 'lightning-theorist', 'mirror-mage', 'forbidden-archivist', 'kindly-undertaker', 'little-gardener',
  'ash-collector', 'grandmother-bramble', 'choirmother', 'the-pale-abbess', 'hungry-ghoul', 'brook-hydra', 'patient-giant']);
const RELIC_VALUE = { 'the-kiln': 3, 'heartwood-totem': 4, 'the-drowned-clock': 6, 'bone-altar': 2, 'beacon-of-hope': 5, 'banner-of-the-charge': 3 };

// One-turn boosts are worth nothing here: they only matter through the fight
// they win, and fights are played out before positions are scored.
export function creatureValue(s, c) {
  const d = BY_ID[c.cid];
  const p = power(s, c) - (c.tP || 0);
  const v = vitality(s, c) - (c.tV || 0);
  let val = 1.2 + Math.max(0, p) * 1.5 + Math.max(1, v);
  for (const k in KW_VALUE) if (d.keywords.includes(k) || (k === 'soar' && hasKw(s, c, 'soar'))) val += KW_VALUE[k];
  if (d.cantBlock) val -= 1;
  if (ENGINES.has(c.cid)) val += 1.5;
  if (d.ability) val += 0.8;
  if (c.sacEnd || c.stolen) val *= 0.2;
  return val;
}

const boardValue = (s, i) => s.players[i].board.reduce((sum, u) => sum + creatureValue(s, s.cards[u]), 0);
const relicValue = (s, i) => s.players[i].relics.reduce((sum, u) => {
  const r = s.cards[u];
  return sum + (RELIC_VALUE[r.cid] || 3) + (r.cid === 'the-drowned-clock' ? (r.chimes || 0) * 2.5 : 0);
}, 0);

// Damage `atk`'s creatures could push past `def`'s ready blockers next time they attack.
function threat(s, atk, def, allBlock) {
  const attackers = s.players[atk].board.map((u) => s.cards[u]).filter((c) => !c.frozen && !c.stolen && !c.sacEnd)
    .sort((x, y) => power(s, y) - power(s, x));
  const blockers = s.players[def].board.map((u) => s.cards[u]).filter((b) => (allBlock || !b.ex) && !BY_ID[b.cid].cantBlock);
  const used = new Set();
  let through = 0;
  for (const a of attackers) {
    const b = blockers.find((x) => !used.has(x.uid) && (!hasKw(s, a, 'soar') || hasKw(s, x, 'soar') || hasKw(s, x, 'reach')));
    if (b) used.add(b.uid);
    else through += power(s, a) - (a.tP || 0);
  }
  return through;
}

export function evaluate(s, me) {
  if (s.phase === 'over') return s.winner === me ? 1e6 : -1e6;
  const P = s.players[me];
  if (P.out) return -1e6;
  const opps = opponents(s, me);
  // an extra turn coming up is worth about a turn's worth of cards and attacks
  let v = lifeValue(P.life) + boardValue(s, me) + relicValue(s, me) + P.hand.length * 1.6 + P.traps.length * 2.2 + (P.extra || 0) * 9;
  v += Math.min(P.deck.length, 6) * 0.3;
  if (s.crown === me) v += CROWN;
  const w = 1 / opps.length;
  for (const o of opps) {
    v -= (lifeValue(o.life) + boardValue(s, o.i) * 1.05 + relicValue(s, o.i) + o.hand.length * 1.2 + o.traps.length * 2 + (o.extra || 0) * 9 + (s.crown === o.i ? CROWN : 0)) * w;
    if (s.active === me) {
      // Creatures that attacked can't block on the turns in between: count the risk.
      const inc = threat(s, o.i, me, false);
      if (inc > 0) v -= (lifeValue(P.life) - lifeValue(P.life - inc)) * (opps.length > 1 ? 0.45 : 0.7);
      const out = threat(s, me, o.i, true);
      if (out > 0) v += (lifeValue(o.life) - lifeValue(o.life - out)) * 0.25 * w;
    }
  }
  return v;
}

// Positions without their log are much cheaper to copy.
const lean = (s) => ({ ...s, log: [], events: [] });
const tryApply = (s, a) => { const r = apply(s, a); return r.error ? null : r.state; };

// ── fights ──────────────────────────────────────────────────────────
// What happens if `b` blocks `a`, ignoring Tricks.
function duel(s, a, b) {
  const pa = power(s, a), pb = power(s, b);
  const la = vitality(s, a) - (a.dmg || 0), lb = vitality(s, b) - (b.dmg || 0);
  const aVen = hasKw(s, a, 'venom'), bVen = hasKw(s, b, 'venom');
  const aSw = hasKw(s, a, 'swift'), bSw = hasKw(s, b, 'swift');
  const killsB = pa > 0 && (pa >= lb || aVen);
  const killsA = pb > 0 && (pb >= la || bVen);
  let aDies, bDies;
  if (aSw && !bSw) { bDies = killsB; aDies = !bDies && killsA; }
  else if (bSw && !aSw) { aDies = killsA; bDies = !aDies && killsB; }
  else { aDies = killsA; bDies = killsB; }
  const strikes = !(bSw && !aSw && aDies);
  let through = 0;
  if (strikes && hasKw(s, a, 'overrun')) through = Math.max(0, pa - (aVen ? Math.min(1, lb) : lb));
  return { aDies, bDies, through };
}

// What happens if several creatures block `a` together, ignoring Tricks.
function gang(s, a, bs) {
  const la = vitality(s, a) - (a.dmg || 0);
  const aSw = hasKw(s, a, 'swift');
  const kills = (n, ven) => n > 0 && (n >= la || ven);
  // Swift blockers strike first; if that kills the attacker, it never swings.
  const early = bs.filter((b) => hasKw(s, b, 'swift') && !aSw);
  let hit = early.reduce((n, b) => n + power(s, b), 0);
  let ven = early.some((b) => hasKw(s, b, 'venom') && power(s, b) > 0);
  if (kills(hit, ven)) return { aDies: true, dead: [], through: 0 };
  const { parts, rest } = splitDamage(s, a, bs, power(s, a));
  const dead = parts.filter(([b, n]) => n > 0 && (n >= vitality(s, b) - (b.dmg || 0) || hasKw(s, a, 'venom'))).map(([b]) => b);
  for (const b of bs) {
    if (early.includes(b) || (aSw && !hasKw(s, b, 'swift') && dead.includes(b))) continue;
    hit += power(s, b);
    ven ||= hasKw(s, b, 'venom') && power(s, b) > 0;
  }
  return { aDies: kills(hit, ven), dead, through: rest };
}

// A defender's likely blocks: good blocks first, then two creatures on an
// attacker neither could stop alone, then chumps if the hit would be lethal.
export function quickBlocks(s, me, { chump = 'auto', gangUp = true } = {}) {
  const C = s.combat;
  const forced = forcedBlocks(s, C);
  const out = [...forced];
  const used = new Map();
  for (const [b] of forced) used.set(b, (used.get(b) || 0) + 1);
  const free = (b) => (used.get(b.uid) || 0) < blockLimit(s, b);
  const take = (b, a) => { out.push([b.uid, a.uid]); used.set(b.uid, (used.get(b.uid) || 0) + 1); };
  const P = s.players[me];
  const blockers = P.board.map((u) => s.cards[u]);
  const open = C.att.map((u) => s.cards[u]).filter((a) => a.zone === 'board' && !forced.some(([, x]) => x === a.uid))
    .sort((x, y) => power(s, y) - power(s, x));
  const left = [];
  for (const a of open) {
    let best = null, bestScore = 0.4;
    for (const b of blockers) {
      if (!free(b) || !canBlock(s, b, a)) continue;
      const o = duel(s, a, b);
      const va = creatureValue(s, a), vb = creatureValue(s, b);
      let score;
      if (o.aDies && !o.bDies) score = va + 2;
      else if (!o.bDies) score = 0.6 + (power(s, a) - o.through) * 0.25;
      else if (o.aDies) score = va - vb + 0.4;
      else score = -1;
      if (score > bestScore) { bestScore = score; best = b; }
    }
    if (best) take(best, a); else left.push(a);
  }
  if (gangUp) {
    for (const a of [...left]) {
      const cands = blockers.filter((b) => free(b) && canBlock(s, b, a));
      let best = null, bestScore = 0.8;
      for (let i = 0; i < cands.length; i++) for (let j = i + 1; j < cands.length; j++) {
        const o = gang(s, a, [cands[i], cands[j]]);
        if (!o.aDies) continue;
        const score = creatureValue(s, a) - o.dead.reduce((n, b) => n + creatureValue(s, b), 0) + (power(s, a) - o.through) * 0.15;
        if (score > bestScore) { bestScore = score; best = [cands[i], cands[j]]; }
      }
      if (best) { for (const b of best) take(b, a); left.splice(left.indexOf(a), 1); }
    }
  }
  const incoming = left.reduce((n, a) => n + power(s, a), 0);
  if (chump === 'all' || (chump === 'auto' && incoming >= P.life)) {
    for (const a of left) {
      const b = blockers.filter((x) => free(x) && canBlock(s, x, a)).sort((x, y) => creatureValue(s, x) - creatureValue(s, y))[0];
      if (b) take(b, a);
    }
  }
  return out;
}

// Play the rest of a fight out: the defender blocks as above, nobody plays Tricks.
function finishFight(s) {
  for (let i = 0; i < 24 && s.phase === 'combat'; i++) {
    const C = s.combat;
    const a = C.step === 'block'
      ? { t: 'block', p: C.d, blocks: quickBlocks(s, C.d) }
      : { t: 'pass', p: C.prio };
    s = tryApply(s, a) || tryApply(s, { t: 'block', p: C.d, blocks: forcedBlocks(s, C) });
    if (!s) return null;
  }
  return s;
}

export function scoreAfterFight(s, me) {
  const t = s.phase === 'combat' ? finishFight(s) : s;
  return t ? evaluate(t, me) : -Infinity;
}

// Sensible attacks: everyone, the safe ones, each alone, all but one.
export function attackCandidates(s, me) {
  const P = s.players[me];
  if (P.attackedOn === s.turn) return [];
  const ready = P.board.map((u) => s.cards[u]).filter((c) => canAttack(s, me, c));
  if (!ready.length) return [];
  const out = [];
  for (const Q of opponents(s, me)) {
    const theirs = Q.board.map((u) => s.cards[u]);
    const safe = ready.filter((a) => !theirs.some((b) => canBlock(s, b, a) && duel(s, a, b).aDies));
    const byPower = [...ready].sort((x, y) => power(s, y) - power(s, x));
    const sets = [ready, safe, ...ready.map((c) => [c]), byPower.slice(0, 2)];
    if (ready.length > 2 && ready.length <= 6) for (const c of ready) sets.push(ready.filter((x) => x !== c));
    const seen = new Set();
    for (const set of sets) {
      if (!set.length) continue;
      const key = set.map((c) => c.uid).sort((x, y) => x - y).join(',');
      if (seen.has(key)) continue;
      seen.add(key);
      const hunt = [];
      for (const a of set) {
        if (!hasKw(s, a, 'hunt')) continue;
        // Hunt the most valuable creature it can kill, preferably surviving.
        let best = null, bestScore = -Infinity;
        for (const b of theirs) {
          if (!canBlock(s, b, a)) continue;
          const o = duel(s, a, b);
          const sc = (o.bDies ? creatureValue(s, b) : -2) - (o.aDies ? creatureValue(s, a) : 0);
          if (sc > bestScore) { bestScore = sc; best = b; }
        }
        if (best && bestScore > 0) hunt.push([a.uid, best.uid]);
      }
      out.push({ t: 'attack', p: me, target: Q.i, att: set.map((c) => c.uid), ...(hunt.length ? { hunt } : {}) });
    }
  }
  return out;
}

// What can be done in a fight: Tricks from the hand, and creatures' abilities.
export const trickPlays = (s, me) => [
  ...s.players[me].hand.filter((u) => isTrick(BY_ID[s.cards[u].cid])).flatMap((u) => playOptions(s, me, s.cards[u], 'hand', 24)),
  ...s.players[me].board.flatMap((u) => useOptions(s, me, s.cards[u], 12)),
];

// ── deciding ────────────────────────────────────────────────────────
export function chooseAction(s, me, { noise = 0.4, rand = Math.random } = {}) {
  const P = s.players[me];
  const jitter = () => (noise ? (rand() - 0.5) * noise : 0);
  if (s.phase === 'mulligan') {
    const costs = P.hand.map((u) => BY_ID[s.cards[u].cid].cost);
    const cheap = costs.filter((c) => c <= 3).length;
    const heavy = costs.filter((c) => c >= 6).length;
    return { t: 'mulligan', p: me, redraw: cheap < 2 || heavy >= 3 };
  }
  const base = lean(s);
  if (base.phase === 'combat') return base.combat.step === 'block' ? chooseBlock(base, me, jitter) : chooseTrick(base, me, jitter);

  const now = evaluate(base, me);
  let best = null, bestV = -Infinity;
  const consider = (a, v) => { v += jitter(); if (v > bestV) { bestV = v; best = a; } };
  for (const a of legalActions(base, me)) {
    if (a.t === 'end' || a.t === 'attack') continue;
    // (A Trick that only boosts for a turn scores nothing here, so it waits for a fight.)
    const t = tryApply(base, a);
    if (!t) continue;
    let v = evaluate(t, me);
    if (a.t === 'play' && s.cards[a.uid].cid === 'spark') v = bestFollowUp(t, me, v);
    consider(a, v);
  }
  for (const a of attackCandidates(base, me)) {
    const t = tryApply(base, a);
    if (t) consider(a, scoreAfterFight(t, me));
  }
  return best && bestV > now + 0.05 ? best : { t: 'end', p: me };
}

function chooseBlock(s, me, jitter) {
  const C = s.combat;
  const options = [];
  const seen = new Set();
  const addBlocks = (blocks) => {
    const key = JSON.stringify(blocks);
    if (seen.has(key)) return;
    seen.add(key);
    options.push({ t: 'block', p: me, blocks });
  };
  addBlocks(forcedBlocks(s, C));
  addBlocks(quickBlocks(s, me));
  addBlocks(quickBlocks(s, me, { gangUp: false }));
  addBlocks(quickBlocks(s, me, { chump: 'all' }));
  addBlocks(quickBlocks(s, me, { chump: 'none' }));
  let best = null, bestV = -Infinity;
  for (const a of options) {
    const t = tryApply(s, a);
    if (!t) continue;
    const v = scoreAfterFight(t, me) + jitter();
    if (v > bestV) { bestV = v; best = a; }
  }
  // A Trick before blocking (an ambush, a removal spell, a boost for a blocker).
  for (const a of trickPlays(s, me)) {
    const t = tryApply(s, a);
    if (!t) continue;
    let v;
    if (t.phase === 'combat' && t.combat.step === 'block') {
      const blk = tryApply(t, { t: 'block', p: me, blocks: quickBlocks(t, me) });
      v = blk ? scoreAfterFight(blk, me) : -Infinity;
    } else v = scoreAfterFight(t, me);
    v += jitter();
    if (v > bestV + 0.3) { bestV = v; best = a; }
  }
  return best || { t: 'block', p: me, blocks: forcedBlocks(s, C) };
}

function chooseTrick(s, me, jitter) {
  const pass = { t: 'pass', p: me };
  const t0 = tryApply(s, pass);
  let best = pass, bestV = t0 ? scoreAfterFight(t0, me) : -Infinity;
  for (const a of trickPlays(s, me)) {
    const t = tryApply(s, a);
    if (!t) continue;
    const v = scoreAfterFight(t, me) + jitter();
    if (v > bestV + 0.3) { bestV = v; best = a; }
  }
  return best;
}

function bestFollowUp(s, me, fallback) {
  let best = fallback;
  for (const a of legalActions(s, me)) {
    if (a.t !== 'play' || s.cards[a.uid].cid === 'spark') continue;
    const t = tryApply(s, a);
    if (t) best = Math.max(best, evaluate(t, me));
  }
  return best;
}

// Who should the app ask next? (The bot moves for every seat it plays.)
export { actor };
