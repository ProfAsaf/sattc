// Practice bot: greedy one-step lookahead. It tries every legal action,
// scores the resulting position, and takes the best one until nothing
// beats ending the turn. Simple, quick on a phone, and it trades sensibly.

import { apply, legalActions, opponents, power, vitality } from './engine.js';
import { BY_ID } from './cards.js';

const lifeValue = (l) => (l <= 0 ? -200 : Math.sqrt(l) * 7 + l * 0.5);

function creatureValue(s, c) {
  const d = BY_ID[c.cid];
  // one-turn boosts are worth half: they help this turn's attacks only
  const p = power(s, c) - (c.tP || 0) * 0.5;
  const v = vitality(s, c) - (c.tV || 0) * 0.5 - (c.dmg || 0);
  let val = 1.2 + p * 1.5 + v * 1.0;
  if (d.keywords.includes('guard')) val += 1;
  if (d.keywords.includes('lastBreath')) val += 0.8;
  if (['standard-keeper', 'lightning-theorist', 'mirror-mage', 'forbidden-archivist', 'kindly-undertaker', 'little-gardener', 'ash-collector'].includes(c.cid)) val += 1.5;
  if (c.sacEnd) val *= 0.2;
  return val;
}

const boardValue = (s, i) => s.players[i].board.reduce((sum, u) => sum + creatureValue(s, s.cards[u]), 0);

export function evaluate(s, me) {
  if (s.phase === 'over') return s.winner === me ? 1e6 : -1e6;
  const P = s.players[me];
  if (P.out) return -1e6;
  const opps = opponents(s, me);
  let v = lifeValue(P.life) + boardValue(s, me) + P.hand.length * 1.6 + P.traps.length * 2.2;
  v += Math.min(P.deck.length, 6) * 0.3;
  for (const o of opps) {
    const w = 1 / opps.length;
    v -= (lifeValue(o.life) + boardValue(s, o.i) * 1.05 + o.hand.length * 1.2 + o.traps.length * 2) * w;
  }
  return v;
}

// Positions without their log are much cheaper to copy.
const lean = (s) => ({ ...s, log: [], events: [] });

export function chooseAction(s, me, { noise = 0.4, rand = Math.random } = {}) {
  const P = s.players[me];
  if (s.phase === 'mulligan') {
    const costs = P.hand.map((u) => BY_ID[s.cards[u].cid].cost);
    const cheap = costs.filter((c) => c <= 3).length;
    const heavy = costs.filter((c) => c >= 6).length;
    return { t: 'mulligan', p: me, redraw: cheap < 2 || heavy >= 3 };
  }
  const base = lean(s);
  const now = evaluate(base, me);
  let best = null, bestV = -Infinity;
  for (const a of legalActions(base, me)) {
    if (a.t === 'end') continue;
    const r = apply(base, a);
    if (r.error) continue;
    let v = evaluate(r.state, me);
    // The Spark only pays off through what the extra Energy lets you play next.
    if (a.t === 'play' && s.cards[a.uid].cid === 'spark') v = bestFollowUp(r.state, me, v);
    v += noise ? (rand() - 0.5) * noise : 0;
    if (v > bestV) { bestV = v; best = a; }
  }
  return best && bestV > now + 0.05 ? best : { t: 'end', p: me };
}

function bestFollowUp(s, me, fallback) {
  let best = fallback;
  for (const a of legalActions(s, me)) {
    if (a.t !== 'play' || s.cards[a.uid].cid === 'spark') continue;
    const r = apply(s, a);
    if (!r.error) best = Math.max(best, evaluate(r.state, me));
  }
  return best;
}
