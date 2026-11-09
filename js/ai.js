// Practice bot. On its own turn it tries every play and a handful of attacks,
// plays each fight out (guessing how the defender would block), scores the
// resulting position, and takes the best move until nothing beats ending the
// turn. When attacked it compares a few ways to block, with and without a
// Trick; after blockers are chosen it plays a Trick only if that wins more
// than holding the card. Quick enough for a phone.

import { apply, legalActions, opponents, power, vitality, actor, hasKw, canBlock, blockLimit, forcedBlocks, canAttack, playOptions, useOptions, splitDamage, ultraV2 } from './engine.js';
import { BY_ID, ULTRA_V2, isTrick } from './cards.js';
import { CLASSIC, BRAINS } from './brains.js';

const lifeValue = (l) => (l <= 0 ? -200 : Math.sqrt(l) * 7 + l * 0.5);
const CROWN = 4.5; // a card at the end of every turn, for as long as you keep it

const KW_VALUE = { soar: 1.3, venom: 1.2, drain: 0.8, swift: 0.8, overrun: 0.6, watchful: 0.5, reach: 0.4, guard: 0.6, hunt: 0.7, lastBreath: 0.8,
  grows: 1.8, multiply: 2.4, unstable: 1.4, bodyguard: 0.8, fuse: 0.4, ambush: 0.5 }; // (the last line: SATTC Ultra)
const ENGINES = new Set(['spellwright-apprentice', 'mire-witch', 'war-drummer', 'weatherwitch', 'keeper-of-the-skies', 'storm-shepherd', 'pearl-diver', 'the-puppeteer', // (version 4)
  'tollkeeper', 'blight-beetle', 'pickpocket', // (version 5)
  'standard-keeper', 'lightning-theorist', 'mirror-mage', 'forbidden-archivist', 'kindly-undertaker', 'little-gardener',
  'ash-collector', 'grandmother-bramble', 'choirmother', 'the-pale-abbess', 'hungry-ghoul', 'brook-hydra', 'patient-giant', 'dawnsinger', 'lantern-ferryman',
  'rootmother', 'shield-captain', 'field-medic', 'gravewarden', 'bloodbinder', 'thornback-archer', 'shieldwright']);
const RELIC_VALUE = { 'the-kiln': 3, 'heartwood-totem': 4, 'the-drowned-clock': 6, 'bone-altar': 2, 'beacon-of-hope': 5, 'banner-of-the-charge': 3, 'the-bright-choir': 4, 'season-of-plenty': 4,
  'tidecallers-library': 5, 'the-granary': 3, 'the-arcane-well': 4, 'war-chest': 3 };
// Energy a Granary saves for next turn (version 4), each.
const SAVED = 0.55;
// SATTC Ultra: a permanent +1 Energy, a Ritual on its way, the Field you chose.
const INVEST = 2.6, RITUAL_STAGE = 2.4, OWN_FIELD = 2.2;
// (version 4) A permanent +1 Energy is worth more the more turns are left to spend it in (games run about 13 rounds); late, the old flat value.
const investWorth = (s, P) => (s.uv >= 4 ? Math.max(INVEST, 0.75 * (13 - (P.turns || 0))) : INVEST);

// Play styles, for testing the game (the tournament lab, tools/lab.mjs): weights
// on what the bot values. 1 is the ordinary bot for the first seven, 0 for
// the extras (per creature on the table, its biggest creature's Power, engine
// creatures, creature cards in its discard pile to raise again, Tricks held).
// Without a style (the practice bot, reviews, suggestions) nothing changes.
export const STYLE_KEYS = ['life', 'aggro', 'board', 'cards', 'invest', 'traps', 'defense', 'width', 'tall', 'combo', 'necro'];
const NEUTRAL = { life: 1, aggro: 1, board: 1, cards: 1, invest: 1, traps: 1, defense: 1, width: 0, tall: 0, combo: 0, necro: 0 };
export const STYLES = {
  balanced: { ...NEUTRAL },
  brute: { ...NEUTRAL, aggro: 1.3, board: 1.1, tall: 0.8 },
  swarm: { ...NEUTRAL, board: 0.9, width: 1.2 },
  trickster: { ...NEUTRAL, traps: 1.6, cards: 1.2, defense: 1.3 },
  burn: { ...NEUTRAL, aggro: 1.5, cards: 1.3, board: 0.9 },
  combo: { ...NEUTRAL, cards: 1.2, combo: 1.5 },
  economy: { ...NEUTRAL, invest: 1.8, cards: 1.5, aggro: 0.8 },
  necromancer: { ...NEUTRAL, board: 0.9, necro: 0.8 },
  defender: { ...NEUTRAL, life: 1.3, defense: 1.6, aggro: 0.7 },
};

// One-turn boosts are worth nothing here: they only matter through the fight
// they win, and fights are played out before positions are scored.
export function creatureValue(s, c) {
  const d = BY_ID[c.cid];
  const p = power(s, c) - (c.tP || 0);
  const v = vitality(s, c) - (c.tV || 0);
  let val = 1.2 + Math.max(0, p) * 1.5 + Math.max(1, s.ultra ? v - (c.dmg || 0) * 0.7 : v); // (Ultra: wounds last)
  for (const k in KW_VALUE) if (d.keywords.includes(k) || ((k === 'soar' || c.fuseKw) && hasKw(s, c, k))) val += KW_VALUE[k] * (k === 'grows' ? d.grows || 1 : 1);
  if (c.fuseGrows) val += KW_VALUE.grows * c.fuseGrows; // (Ultra: Grows fused in from the hand)
  if (c.shield > 0) val += 1.2 * c.shield + 0.3 * Math.max(0, p - 2); // (Ultra: a Shield, worth more on a creature that hits hard)
  if (d.cantBlock) val -= 1;
  if (ENGINES.has(c.cid)) val += 1.5;
  if (d.champion) val += 2.5; // (its level-ups work on the whole deck)
  if (d.ability) val += 0.8;
  if (c.sacEnd || c.stolen) val *= 0.2;
  if (c.hex) val *= 0.45; // (until it's paid off)
  return val;
}

const boardValue = (s, i) => s.players[i].board.reduce((sum, u) => sum + creatureValue(s, s.cards[u]), 0);
const relicValue = (s, i) => s.players[i].relics.reduce((sum, u) => {
  const r = s.cards[u];
  if (BY_ID[r.cid].stages) return sum + 2 + RITUAL_STAGE * (r.stage || 0); // (a Ritual in progress)
  return sum + (RELIC_VALUE[r.cid] || 3) + (r.cid === 'the-drowned-clock' ? (r.chimes || 0) * 2.5 : 0) + (r.stored || 0) * SAVED;
}, 0);

// Damage `atk`'s creatures could push past `def`'s ready blockers next time they attack.
function threat(s, atk, def, allBlock) {
  const attackers = s.players[atk].board.map((u) => s.cards[u]).filter((c) => !c.frozen && !c.stolen && !c.sacEnd && !c.hex)
    .sort((x, y) => power(s, y) - power(s, x));
  const blockers = s.players[def].board.map((u) => s.cards[u]).filter((b) => (allBlock || !b.ex) && !BY_ID[b.cid].cantBlock && !b.hex);
  const used = new Set();
  let through = 0;
  for (const a of attackers) {
    const b = blockers.find((x) => !used.has(x.uid) && (!hasKw(s, a, 'soar') || hasKw(s, x, 'soar') || hasKw(s, x, 'reach')));
    if (b) used.add(b.uid);
    else through += power(s, a) - (a.tP || 0);
  }
  return through;
}

// `st`: a play style (STYLES) and/or a brain (js/brains.js: the weight on each
// term below). Without one, the classic brain: nothing changes for the bots of
// before. With the classic brain's numbers the sums come out exactly as before.
export function evaluate(s, me, st = null) {
  if (s.phase === 'over') return s.winner === me ? 1e6 : -1e6;
  const P = s.players[me];
  if (P.out) return -1e6;
  const W = st || NEUTRAL, B = (st && st.brain) || CLASSIC;
  const opps = opponents(s, me);
  // an extra turn coming up is worth about a turn's worth of cards and attacks
  let v = lifeValue(P.life) * W.life * B.life + boardValue(s, me) * W.board * B.board + relicValue(s, me) * B.relics + P.hand.length * B.hand * W.cards + P.traps.length * B.traps * W.traps + (P.extra || 0) * 9 * B.fixed;
  v += Math.min(P.deck.length, 6) * B.deck;
  if (s.crown === me) v += CROWN * B.fixed;
  if (s.ultra) {
    v += (P.invest || 0) * investWorth(s, P) * W.invest * B.invest;
    v -= (P.smoke || 0) * 0.6 * B.fixed; // (version 5: Energy Choking Smoke will take from me)
    if (s.active === me && s.phase === 'main') { // (what a Granary would save if the turn ended now)
      const barns = P.relics.filter((u) => s.cards[u].cid === 'the-granary').length;
      if (barns) v += Math.min(3 * barns, Math.max(0, P.energy)) * SAVED * B.fixed;
    }
    if (s.field != null) v += (s.cards[s.field].ctrl === me ? OWN_FIELD : -OWN_FIELD / 2) * B.fixed;
  }
  if (st && st.styled !== false) v += styleExtras(s, P, st);
  const w = 1 / opps.length;
  const racing = B.race || B.theirRace || B.swing || B.theirSwing;
  for (const o of opps) {
    v -= (lifeValue(o.life) * W.aggro * B.theirLife + boardValue(s, o.i) * B.theirBoard + relicValue(s, o.i) * B.theirRelics + o.hand.length * B.theirHand + o.traps.length * B.theirTraps + (o.extra || 0) * 9 * B.fixed + (s.crown === o.i ? CROWN * B.fixed : 0) + (o.invest || 0) * (s.ultra ? investWorth(s, o) : INVEST) * B.theirInvest) * w;
    if (s.ultra && s.uv >= 5) v += ((o.smoke || 0) - o.hand.filter((u) => BY_ID[s.cards[u].cid].cost >= 4).length) * 0.6 * w * B.fixed; // (version 5: Energy Choking Smoke takes from them; their big cards still waiting in hand)
    if (s.active === me) {
      // Creatures that attacked can't block on the turns in between: count the risk.
      const inc = threat(s, o.i, me, false);
      if (inc > 0) v -= (lifeValue(P.life) - lifeValue(P.life - inc)) * (opps.length > 1 ? B.inc3 : B.inc) * W.defense;
      const out = threat(s, me, o.i, true);
      if (out > 0) v += (lifeValue(o.life) - lifeValue(o.life - out)) * B.out * w * W.aggro;
    }
    // The race, on either side's turn (blocks are chosen on theirs): how much
    // of each side's Life the other takes per attack, past every blocker and
    // in all. A chump block that loses a flier loses its share of the race.
    if (racing) {
      const [r, tr, sw, tsw] = raceTerms(s, me, o.i);
      v += (r * B.race - tr * B.theirRace + sw * B.swing - tsw * B.theirSwing) * w;
    }
  }
  return v;
}

// The race between `me` and `o`: what gets past every blocker next attack, and
// all Power, each as a share of the other side's Life (at most 1.5).
function raceTerms(s, me, o) {
  const share = (n, life) => Math.min(1.5, Math.max(0, n) / Math.max(1, life));
  const all = (i) => s.players[i].board.reduce((n, u) => { const c = s.cards[u]; return c.frozen || c.stolen || c.sacEnd || c.hex ? n : n + Math.max(0, power(s, c) - (c.tP || 0)); }, 0);
  const lifeMe = s.players[me].life, lifeO = s.players[o].life;
  return [share(threat(s, me, o, true), lifeO), share(threat(s, o, me, true), lifeMe), share(all(me), lifeO), share(all(o), lifeMe)];
}

// The terms evaluate() weighs, one per brain key, for learning a brain
// (tools/train.mjs): evaluate(s, me, { brain: B }) is the sum of B[key] times
// the term (no play style). The sign is folded in, so a brain's weights are
// positive when more of the thing is good for `me`.
export const BRAIN_KEYS = Object.keys(CLASSIC);
export function features(s, me) {
  const f = Object.fromEntries(BRAIN_KEYS.map((k) => [k, 0]));
  const P = s.players[me];
  const opps = opponents(s, me);
  f.life = lifeValue(P.life);
  f.board = boardValue(s, me);
  f.relics = relicValue(s, me);
  f.hand = P.hand.length;
  f.traps = P.traps.length;
  f.fixed = (P.extra || 0) * 9 + (s.crown === me ? CROWN : 0);
  f.deck = Math.min(P.deck.length, 6);
  if (s.ultra) {
    f.invest = (P.invest || 0) * investWorth(s, P);
    f.fixed -= (P.smoke || 0) * 0.6;
    if (s.active === me && s.phase === 'main') {
      const barns = P.relics.filter((u) => s.cards[u].cid === 'the-granary').length;
      if (barns) f.fixed += Math.min(3 * barns, Math.max(0, P.energy)) * SAVED;
    }
    if (s.field != null) f.fixed += s.cards[s.field].ctrl === me ? OWN_FIELD : -OWN_FIELD / 2;
  }
  const w = 1 / opps.length;
  for (const o of opps) {
    f.theirLife -= lifeValue(o.life) * w;
    f.theirBoard -= boardValue(s, o.i) * w;
    f.theirRelics -= relicValue(s, o.i) * w;
    f.theirHand -= o.hand.length * w;
    f.theirTraps -= o.traps.length * w;
    f.fixed -= ((o.extra || 0) * 9 + (s.crown === o.i ? CROWN : 0)) * w;
    f.theirInvest -= (o.invest || 0) * (s.ultra ? investWorth(s, o) : INVEST) * w;
    if (s.ultra && s.uv >= 5) f.fixed += ((o.smoke || 0) - o.hand.filter((u) => BY_ID[s.cards[u].cid].cost >= 4).length) * 0.6 * w;
    if (s.active === me) {
      const inc = threat(s, o.i, me, false);
      if (inc > 0) f[opps.length > 1 ? 'inc3' : 'inc'] -= lifeValue(P.life) - lifeValue(P.life - inc);
      const out = threat(s, me, o.i, true);
      if (out > 0) f.out += (lifeValue(o.life) - lifeValue(o.life - out)) * w;
    }
    const [r, tr, sw, tsw] = raceTerms(s, me, o.i);
    f.race += r * w; f.theirRace -= tr * w; f.swing += sw * w; f.theirSwing -= tsw * w;
  }
  return f;
}

// A brain by name (js/brains.js), or the weights themselves.
export const brainFor = (b) => (typeof b === 'string' ? BRAINS[b] || CLASSIC : b || CLASSIC);
// A style's extras: a wide table, one big creature, engines, the dead to raise, Tricks held.
function styleExtras(s, P, st) {
  let v = 0;
  const board = P.board.map((u) => s.cards[u]);
  if (st.width) v += st.width * board.length;
  if (st.tall && board.length) v += st.tall * Math.max(...board.map((c) => power(s, c)));
  if (st.combo) v += st.combo * board.filter((c) => ENGINES.has(c.cid)).length;
  if (st.necro) v += st.necro * P.discard.filter((u) => BY_ID[s.cards[u].cid].type === 'creature').length;
  if (st.traps !== 1) v += (st.traps - 1) * 1.5 * P.hand.filter((u) => isTrick(BY_ID[s.cards[u].cid])).length;
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
  const killsB = pa > 0 && (pa >= lb || aVen) && !(b.shield > 0); // (a Shield stops the hit)
  const killsA = pb > 0 && (pb >= la || bVen) && !(a.shield > 0);
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
  const plus = ultraV2(s) && bs.length >= 2 ? ULTRA_V2.together : 0; // (Ultra: ganging up)
  const shieldOff = a.shield > 0 ? Math.max(...bs.map((b) => power(s, b) + plus)) : 0; // (its Shield stops the biggest blow)
  // Swift blockers strike first; if that kills the attacker, it never swings.
  const early = bs.filter((b) => hasKw(s, b, 'swift') && !aSw);
  let hit = early.reduce((n, b) => n + power(s, b) + plus, 0);
  let ven = early.some((b) => hasKw(s, b, 'venom') && power(s, b) > 0);
  if (kills(hit - shieldOff, ven && !shieldOff)) return { aDies: true, dead: [], through: 0 };
  const { parts, rest } = splitDamage(s, a, bs, power(s, a));
  const dead = parts.filter(([b, n]) => n > 0 && !(b.shield > 0) && (n >= vitality(s, b) - (b.dmg || 0) || hasKw(s, a, 'venom'))).map(([b]) => b);
  for (const b of bs) {
    if (early.includes(b) || (aSw && !hasKw(s, b, 'swift') && dead.includes(b))) continue;
    hit += power(s, b) + plus;
    ven ||= hasKw(s, b, 'venom') && power(s, b) > 0;
  }
  return { aDies: kills(hit - shieldOff, ven && !shieldOff), dead, through: rest };
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
      // three when two aren't enough (with ganging up in Ultra, each strikes harder)
      if (!best && ultraV2(s)) for (let i = 0; i < cands.length; i++) for (let j = i + 1; j < cands.length; j++) for (let k = j + 1; k < cands.length; k++) {
        const o = gang(s, a, [cands[i], cands[j], cands[k]]);
        if (!o.aDies) continue;
        const score = creatureValue(s, a) - o.dead.reduce((n, b) => n + creatureValue(s, b), 0) + (power(s, a) - o.through) * 0.15;
        if (score > bestScore) { bestScore = score; best = [cands[i], cands[j], cands[k]]; }
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

export function scoreAfterFight(s, me, st = null) {
  const t = s.phase === 'combat' ? finishFight(s) : s;
  return t ? evaluate(t, me, st) : -Infinity;
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

// What can be done in a fight: Tricks from the hand, creatures' abilities, and
// (Ultra, version 2) creature cards fused into one of yours in the fight.
export const trickPlays = (s, me) => [
  ...s.players[me].hand.filter((u) => isTrick(BY_ID[s.cards[u].cid]) || (ultraV2(s) && BY_ID[s.cards[u].cid].type === 'creature')).flatMap((u) => playOptions(s, me, s.cards[u], 'hand', 24)),
  ...s.players[me].board.flatMap((u) => useOptions(s, me, s.cards[u], 12)),
];

// ── deciding ────────────────────────────────────────────────────────
// `beam`: a stronger bot (the Elo ladder's Expert, tools/elo.mjs) looks at its
// best `beam` moves again with the best move each one leads to this turn.
// `top`: weigh only its best `top` moves (noise then makes it choose among
// sensible ones, as a beginner would, instead of anything at all); its blocks
// and Tricks then misjudge a little, not wildly.
export function chooseAction(s, me, { noise = 0.4, rand = Math.random, style = null, beam = 0, brain = null, top = 0 } = {}) {
  const P = s.players[me];
  // (a brain rides along with the style: evaluate() reads both from it)
  if (brain) style = { ...(style || NEUTRAL), brain: brainFor(brain), styled: !!style };
  const jitter = () => (noise ? (rand() - 0.5) * noise : 0);
  if (s.phase === 'mulligan') {
    const costs = P.hand.map((u) => BY_ID[s.cards[u].cid].cost);
    const cheap = costs.filter((c) => c <= 3).length;
    const heavy = costs.filter((c) => c >= 6).length;
    return { t: 'mulligan', p: me, redraw: cheap < 2 || heavy >= 3 };
  }
  const base = lean(s);
  if (base.phase === 'combat') {
    const jit = top && noise > 6 ? () => (rand() - 0.5) * 6 : jitter;
    return base.combat.step === 'block' ? chooseBlock(base, me, jit, style) : chooseTrick(base, me, jit, style);
  }
  // Others' Traps are face down: the bot plans as if they weren't there, so they can catch it.
  if (s.ultra) base.players = base.players.map((Q) => (Q.i === me || !Q.traps.length ? Q : { ...Q, traps: [] }));

  const now = evaluate(base, me, style);
  if (beam > 0) return lookAhead(base, me, now, beam, jitter, style);
  const all = [];
  for (const a of legalActions(base, me)) {
    if (a.t === 'end' || a.t === 'attack') continue;
    // (A Trick that only boosts for a turn scores nothing here, so it waits for a fight.)
    const t = tryApply(base, a);
    if (!t) continue;
    let v = evaluate(t, me, style);
    if (a.t === 'play' && s.cards[a.uid].cid === 'spark') v = bestFollowUp(t, me, v, style);
    all.push([a, v]);
  }
  for (const a of attackCandidates(base, me)) {
    const t = tryApply(base, a);
    if (t) all.push([a, scoreAfterFight(t, me, style)]);
  }
  let best = null, bestV = -Infinity;
  for (const [a, v0] of top ? all.sort((x, y) => y[1] - x[1]).slice(0, top) : all) { const v = v0 + jitter(); if (v > bestV) { bestV = v; best = a; } }
  return best && bestV > now + 0.05 ? best : { t: 'end', p: me };
}

function chooseBlock(s, me, jitter, style = null) {
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
    const v = scoreAfterFight(t, me, style) + jitter();
    if (v > bestV) { bestV = v; best = a; }
  }
  // A Trick before blocking (an ambush, a removal spell, a boost for a blocker).
  for (const a of trickPlays(s, me)) {
    const t = tryApply(s, a);
    if (!t) continue;
    let v;
    if (t.phase === 'combat' && t.combat.step === 'block') {
      const blk = tryApply(t, { t: 'block', p: me, blocks: quickBlocks(t, me) });
      v = blk ? scoreAfterFight(blk, me, style) : -Infinity;
    } else v = scoreAfterFight(t, me, style);
    v += jitter();
    if (v > bestV + 0.3) { bestV = v; best = a; }
  }
  return best || { t: 'block', p: me, blocks: forcedBlocks(s, C) };
}

function chooseTrick(s, me, jitter, style = null) {
  const pass = { t: 'pass', p: me };
  const t0 = tryApply(s, pass);
  let best = pass, bestV = t0 ? scoreAfterFight(t0, me, style) : -Infinity;
  for (const a of trickPlays(s, me)) {
    const t = tryApply(s, a);
    if (!t) continue;
    const v = scoreAfterFight(t, me, style) + jitter();
    if (v > bestV + 0.3) { bestV = v; best = a; }
  }
  return best;
}

// Every move this turn, with the score it leads to (a fight played out).
function scoredMoves(s, me, style) {
  const out = [];
  for (const a of legalActions(s, me)) {
    if (a.t === 'end' || a.t === 'attack') continue;
    const t = tryApply(s, a);
    if (t) out.push({ a, t, v: evaluate(t, me, style) });
  }
  for (const a of attackCandidates(s, me)) {
    const t = tryApply(s, a);
    if (!t) continue;
    const after = t.phase === 'combat' ? finishFight(t) : t;
    if (after) out.push({ a, t: after, v: evaluate(after, me, style) });
  }
  return out;
}

// The beam: the best few moves, each scored by the best place it can lead this turn.
function lookAhead(s, me, now, beam, jitter, style) {
  const first = scoredMoves(s, me, style).sort((x, y) => y.v - x.v).slice(0, beam);
  let best = null, bestV = now + 0.05;
  for (const { a, t, v } of first) {
    let w = v;
    if (t.phase === 'main' && t.active === me) for (const m of scoredMoves(t, me, style)) w = Math.max(w, m.v);
    w += jitter();
    if (w > bestV) { bestV = w; best = a; }
  }
  return best || { t: 'end', p: me };
}

// ── the Planner (the Elo ladder's strongest bot, tools/elo.mjs) ─────
// On its own turn it takes its best `beam` moves (and ending the turn), plays
// each one on: the rest of its turn and the next opponent's turn, the careful
// bot moving for both, `tries` times with what it can't see shuffled (the
// others' hands and decks, its own deck; face-down Traps left out). It keeps
// the move whose futures score best. Slow: for tests, not for phones.
// `budget`: milliseconds to think (a phone): its best move and ending the
// turn always get a future; the other moves, and more futures, while time is
// left. Tests and ratings leave it out.
export function planAction(s, me, { rand = Math.random, beam = 3, tries = 1, brain = null, budget = Infinity, margin = 0.5 } = {}) {
  if (s.phase !== 'main' || s.active !== me) return chooseAction(s, me, { rand, noise: 0, brain });
  const base = lean(s);
  if (s.ultra) base.players = base.players.map((Q) => (Q.i === me || !Q.traps.length ? Q : { ...Q, traps: [] }));
  const end = { t: 'end', p: me };
  const st = brain ? { ...NEUTRAL, brain: brainFor(brain), styled: false } : null;
  const top = scoredMoves(base, me, st).sort((x, y) => y.v - x.v).slice(0, beam);
  const cands = [...top.slice(0, 1), { a: end, t: tryApply(base, end) }, ...top.slice(1)];
  // Every candidate meets the same futures (the k-th shuffle is the same for
  // all: "common random numbers"), so they're compared on the luck they share;
  // and it leaves its best-looking move only for a clear gain (`margin`).
  const t0 = Date.now(), sum = cands.map(() => 0), n = cands.map(() => 0);
  run: for (let k = 0; k < tries; k++) {
    const seed = Math.floor(rand() * 4294967296);
    for (let i = 0; i < cands.length; i++) {
      if ((k || i >= 2) && Date.now() - t0 > budget) break run;
      if (cands[i].t) { let x = seed; sum[i] += playOn(cands[i].t, me, () => (x = (Math.imul(x, 1103515245) + 12345) >>> 0) / 4294967296, brain); n[i]++; }
    }
  }
  const avg = (i) => (n[i] ? sum[i] / n[i] : -Infinity);
  let bi = 0;
  cands.forEach((_, i) => { if (i && avg(i) > avg(bi) + (bi === 0 ? margin : 0)) bi = i; });
  return n[bi] ? cands[bi].a : end;
}
// Shuffle what `me` can't see, then play on to the start of its next turn.
function playOn(s, me, rand, brain = null) {
  let t = unseen(s, me, rand);
  let away = t.active !== me;
  for (let k = 0; k < 400 && t.phase !== 'over'; k++) {
    if (t.phase === 'main' && t.active === me && away) break;
    if (t.active !== me) away = true;
    const p = actor(t);
    const a = chooseAction(t, p, { rand, noise: 0, brain });
    const r = apply(t, a);
    if (r.error) break;
    t = lean(r.state);
  }
  return evaluate(t, me, brain ? { ...NEUTRAL, brain: brainFor(brain), styled: false } : null);
}
function unseen(s, me, rand) {
  const cards = { ...s.cards };
  const shuffled = (xs) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const players = s.players.map((Q) => {
    if (Q.i === me) return { ...Q, deck: shuffled(Q.deck) };
    const keep = Q.hand.filter((u) => BY_ID[cards[u].cid].token || BY_ID[cards[u].cid].champion); // (a Spark, a Champion: known)
    const pool = shuffled([...Q.hand.filter((u) => !keep.includes(u)), ...Q.deck]);
    const n = Q.hand.length - keep.length;
    pool.forEach((u, i) => { cards[u] = { ...cards[u], zone: i < n ? 'hand' : 'deck' }; });
    return { ...Q, hand: [...keep, ...pool.slice(0, n)], deck: pool.slice(n), traps: [] };
  });
  return { ...s, cards, players };
}

function bestFollowUp(s, me, fallback, style = null) {
  let best = fallback;
  for (const a of legalActions(s, me)) {
    if (a.t !== 'play' || s.cards[a.uid].cid === 'spark') continue;
    const t = tryApply(s, a);
    if (t) best = Math.max(best, evaluate(t, me, style));
  }
  return best;
}

// ── difficulty levels (2026-11-09) ──────────────────────────────────
// From the gentlest to the strongest, each rated by Elo (tools/train.mjs
// ladder; Practice, the bot everyone played before, is 1500). Weaker levels
// make mistakes (`noise`: a random amount, in the score's units, added to
// each move's score), but only among their few best moves (`top`), so they
// misjudge rather than blunder at random. Stronger ones look ahead.
// The strongest play its own turns out a turn ahead (the Planner: `plan`
// moves, `tries` futures each, within `budget` ms on a phone).
// (Rated 2026-11-09, 30–40 deals per pair both ways: each level beats the one
// below it about 75–80% of the time. More planning than Expert's, 4 moves
// with 3 futures each, rated the same, so there's no fifth level.)
export const LEVELS = [
  { id: 'beginner', name: 'Beginner', elo: 1050, brain: 'classic', noise: 1000, top: 4 }, // (any of its 4 best moves, at random)
  { id: 'casual', name: 'Casual', elo: 1300, brain: 'classic', noise: 30, top: 4 },
  { id: 'practice', name: 'Practice', elo: 1500, brain: 'classic', noise: 0.4 },
  { id: 'expert', name: 'Expert', elo: 1650, brain: 'classic', plan: 3, tries: 1, budget: 500 },
];
export const levelOf = (id) => LEVELS.find((L) => L.id === id) || LEVELS.find((L) => L.id === 'practice');
// A level's move (`full`: no thinking-time limit, for ratings).
export function levelMove(s, me, id, rand = Math.random, full = false) {
  const L = levelOf(id);
  if (L.plan && s.phase === 'main' && s.active === me) return planAction(s, me, { rand, beam: L.plan, tries: L.tries || 1, brain: L.brain, budget: full ? Infinity : L.budget ?? Infinity, margin: L.margin ?? 0.5 });
  return chooseAction(s, me, { rand, noise: L.noise ?? 0, beam: L.beam || 0, brain: L.brain, top: L.top || 0 });
}

// Who should the app ask next? (The bot moves for every seat it plays.)
export { actor };
