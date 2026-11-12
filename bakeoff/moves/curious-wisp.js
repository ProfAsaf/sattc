// Curious Wisp: it ducks, then pops up over the lip of the pool, looks around, and a card of light
// appears at its brow (the top card of your deck). It peers at it, then sends it away to the bottom:
// the card arcs off to T and lands in a ring of light.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support (a card-selection creature: it
// looks at your top card and may put it on the bottom; the suggestion fits), element spirit.
//   0-450     ANTICIPATION: it ducks lower behind the lip, squashing, tail curled tight, eyes
//             sliding down to the pool; the pool's reflection stirs.
//   450-900   it pops up, stretching tall (squash and stretch), the tail whipping straight and
//             swaying on, its little hands pressing on the lip; its glow swells, light spilling on the rim.
//   900-1300  it looks about (left, right) with the eyes, a few motes of light lifting off its head.
//   1000      a card of pale spirit-light unfolds at its brow, flips over once and hovers, bobbing.
//             Its eyes settle on the card.
//   1560      RELEASE: it squashes (the throw), eyes snapping to T, leaning toward it; the card
//             flings off along an arc, tumbling, trailing motes, to T (k.aim, else the pool below).
//   2000      IMPACT at T: a flash, rings of light spreading, motes lifting; alone, the card sinks
//             into the pool (the bottom of the deck) with ripples, the reflection flaring.
//   2000-3500 it watches it go, a satisfied bob, a blink, sinks back to where it was drawn, tail
//             settling; its glow and the rim light fade. At rest from 3500.
// BEATS: release 1560, impact 2000, settle 3500.
import { mul, rot, scl, tr, app, curve, kit } from './_fx.js';
export const END = 3900;
export const BEATS = { release: 1560, impact: 2000, settle: 3500 };
export const STILLS = [250, 700, 1100, 1400, 1760, 2050, 2600, 3500];

export const textures = {
  orb: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [214 + 30 * c, 255, 250, Math.min(1, c * c * 2.4)]; }],
  mote: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [225, 255, 252, Math.min(1, c * c * 3)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const S = k.spec, E = S.emit, POOL = S.pool;
  const tail = k.part('tail'), body = k.part('body'), eyes = k.part('eyes'), handL = k.part('handL'), handR = k.part('handR');
  const T = k.aim || POOL;
  const REL = 1560, IM = 2000, END_ = 3500;
  k.css('.g-spirit { border-radius: 50%; background: radial-gradient(circle, rgba(236,255,252,.95), rgba(190,244,246,.55) 30%, rgba(120,214,226,.2) 58%, rgba(90,200,215,0) 72%); }');
  const card = k.svg('<defs><filter id="b" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1"/></filter></defs>' +
    '<rect x="2.5" y="2.5" width="15" height="21" rx="2.6" fill="#bff0f2" opacity=".6" filter="url(#b)"/>' +
    '<rect x="3.5" y="3.5" width="13" height="19" rx="2" fill="#effffd"/><rect x="5.3" y="5.3" width="9.4" height="15.4" rx="1.2" fill="none" stroke="#8fd3dc" stroke-width=".8"/>' +
    '<circle cx="10" cy="13" r="3" fill="#bdeef0"/><circle cx="10" cy="13" r="1.3" fill="#ffffff"/>', 20, 26);
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.3"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#d6fbfa" stroke-width="4.5" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#f3ffff" stroke-width="1.3"/>', 100, 100);

  // ── where it looks and sends: T. The eyes and the lean follow it.
  const dir = Math.max(-1, Math.min(1, (T[0] - 169) / 60));
  const tx = Math.max(-4.2, Math.min(4.2, (T[0] - 169) * 0.07)), ty = Math.max(-3, Math.min(3.4, (T[1] - 131) * 0.07));
  const CARD = [150, 98]; // where the card hovers (left of the tail, above its brow)

  // ── the wisp as one body: rises (a stretch about the lip), leans, squashes at the throw
  const AX = [169, 148];
  const sy = curve([[0, 1], [330, 0.92, 'out'], [450, 0.92, 'in'], [820, 1.15, 'out'], [1200, 1.11], [1480, 1.13, 'in'], [1580, 0.97, 'out'], [1820, 1.1], [2250, 1.07], [2900, 1.0], [END_, 1]]);
  const lean = curve([[0, 0], [450, 0], [900, -3.5], [1300, 3.5], [1500, 0], [1600, dir * 7, 'out'], [2300, dir * 3], [2900, 0], [END_, 0]]);
  const W = (t) => { const s = sy(t); return mul(rot(lean(t), AX[0], AX[1]), scl(1 + (1 - s) * 0.55, s, AX[0], AX[1])); };
  h.drive(body, [169, 140], W, END_, 40);
  const EX = curve([[0, 0], [330, 0], [450, 0], [820, -0.5], [980, -3.6], [1180, 3.8], [1380, -2.2], [1470, -2.4], [1580, tx, 'out'], [2500, tx], [2900, 0], [END_, 0]]);
  const EY = curve([[0, 0], [250, 2.4], [560, 2.4], [820, -1.2], [1180, -1.6], [1380, -2.6], [1470, -2.6], [1580, ty], [2500, ty], [2900, 0], [END_, 0]]);
  const blink = curve([[0, 1], [2640, 1], [2700, 0.12], [2780, 1], [END_, 1]]);
  const widen = curve([[0, 1], [450, 0.94], [820, 1.1], [1500, 1.1], [1700, 1.02], [2500, 1.02], [END_, 1]]);
  h.drive(eyes, [169, 134], (t) => { const b = blink(t), w = widen(t); return mul(W(t), mul(tr(EX(t), EY(t)), scl(w, w * b, 169, 134))); }, END_, 40);
  // tail: curled tight while it ducks, whipping straight as it rises, then swaying on and on, calming
  const tailBase = curve([[0, 0], [450, 9], [820, -7, 'out'], [1200, -2], [1580, -9, 'out'], [2000, 3], [2500, 0], [END_, 0]]);
  const tailAmp = curve([[0, 0], [450, 0], [830, 4.5], [1500, 6], [2300, 3], [3200, 0.4], [END_, 0]]);
  h.drive(tail, [171, 120], (t) => mul(W(t), rot(tailBase(t) + tailAmp(t) * Math.sin(t / 150), 171, 120)), END_, 40);
  // hands: pressing the lip as it springs up, then tapping their fingers while it peers
  const tap = curve([[0, 0], [820, 0], [980, 1], [1500, 1], [2100, 0.3], [2600, 0], [END_, 0]]);
  const hp = (side) => (t) => { const a = Math.max(0, Math.sin(t / 105 + side * 2.4)); const rise = curve([[0, 0], [450, 0.6], [820, -1.2], [1500, -0.6], [2500, -0.2], [END_, 0]])(t); return tr(0, rise - 1.5 * tap(t) * a); };
  h.drive(handL, [150, 151.5], hp(0), END_, 40);
  h.drive(handR, [189, 150.6], hp(1), END_, 40);

  // ── light: its glow swells as it perks up, spilling on the rim of the pool; the reflection stirs
  const glowList = [[250, 0.7, 0], [820, 1.0, 0.4], [1000, 1.2, 0.5]];
  for (let t = 1200, i = 0; t < 2500; t += 220, i++) glowList.push([t, i % 2 ? 1.2 : 1.1, i % 2 ? 0.5 : 0.35]);
  glowList.push([3300, 0.8, 0]);
  fx(k.lightIn('g-spirit', [169, 124], 100, 100), glowList.map(([t, s, o]) => [t, { transform: `scale(${s})`, opacity: o }, eio]));
  fx(k.lightIn('g-spirit', [169, 150], 130, 26), [[300, { transform: 'scale(.6, .8)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(1, 1)', opacity: 0.8 }, eio], [1700, { transform: 'scale(1.1, 1)', opacity: 0.7 }, eio], [2500, { transform: 'scale(.9)', opacity: 0.35 }, eio], [3300, { transform: 'scale(.7)', opacity: 0 }]]);
  fx(k.lightIn('g-spirit', POOL, 78, 28), [[200, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [520, { transform: 'scale(1)', opacity: 0.6 }, eio], [900, { transform: 'scale(.8)', opacity: 0.25 }, eio], [1300, { transform: 'scale(.9)', opacity: 0.4 }, eio], [2000, { transform: 'scale(.9)', opacity: 0.3 }, eio], [3300, { transform: 'scale(.7)', opacity: 0 }]]);
  // ripples in the pool, as it ducks and as it pops up (flat rings)
  for (const [t0, w] of [[420, 44], [560, 62], [880, 52]]) {
    fx(k.picIn(ring, [170, 182], w, w * 0.28, { lit: true }), [[t0, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t0 + 90, { transform: 'scale(.5)', opacity: 0.55 }, 'ease-out'], [t0 + 750, { transform: 'scale(1.5)', opacity: 0 }]]);
  }

  // ── motes of light lifting off its head as it perks up and looks about
  for (let i = 0; i < 12; i++) {
    const t0 = 760 + i * 120 + Math.round(rand() * 60), x = 160 + rand() * 24, y = 116 - rand() * 6, life = 900 + rand() * 500, sz = 2.5 + rand() * 3;
    const pts = k.arc([0, 0], [(rand() - 0.5) * 20, -22], [(rand() - 0.5) * 24, -44 - rand() * 14], 5);
    fx(k.picIn(i % 3 ? 'mote' : 'orb', [x, y], sz, sz), [[t0 - 1, { transform: `${k.T(0, 0)} scale(.3)`, opacity: 0 }, 'ease-out'],
      ...pts.map(([px, py], j) => [Math.round(t0 + life * j / 5), { transform: `${k.T(px, py)} scale(${(1 - 0.5 * j / 5).toFixed(2)})`, opacity: j === 0 || j === 5 ? 0 : 0.9 }, 'ease-out'])]);
  }

  // ── the card at its brow: a spark gathers, the card unfolds, flips over once, hovers
  fx(k.light('g-spirit', CARD, 40), [[860, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1060, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [1250, { transform: 'scale(1)', opacity: 0.7 }, eio], [1450, { transform: 'scale(1.25)', opacity: 0.9 }, eio], [REL, { transform: 'scale(1.4)', opacity: 1 }, 'ease-in'], [REL + 220, { transform: 'scale(.9)', opacity: 0 }]]);
  // flight: along an arc from the hover to T (alone, round to the left and down into the pool)
  const C = k.aim ? [(CARD[0] + T[0]) / 2, Math.min(CARD[1], T[1]) - 30] : [112, 150];
  const bz = (t) => { const q = 1 - t; return [q * q * CARD[0] + 2 * q * t * C[0] + t * t * T[0], q * q * CARD[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const [X0, Y0] = k.P(...CARD);
  const at = (f, sx, sc, o, r) => { const [x, y] = k.P(...bz(f)); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) rotate(${r}deg) scale(${(sc * sx).toFixed(2)}, ${sc})`, opacity: o }; };
  const hov = (dy, sx, sc, o, r = 0) => ({ transform: `${k.T(0, dy)} rotate(${r}deg) scale(${(sc * sx).toFixed(2)}, ${sc})`, opacity: o });
  const FLY0 = REL + 40;
  const cardList = [[900, hov(4, 0.1, 0.3, 0), 'ease-out'], [1060, hov(-1, 0.1, 1.05, 1), 'ease-out'], [1200, hov(-2, 1, 1.1, 1), eio], [1300, hov(-1.5, -0.1, 1.1, 1), eio], [1400, hov(-3, -1, 1.1, 1, -4), eio], [1500, hov(-1.6, 1, 1.1, 1, 3), 'ease-in'], [REL, hov(-1.2, 1, 1.15, 1, 0), 'ease-in']];
  const N = 8;
  for (let j = 0; j <= N; j++) { const f = j / N, e = f * f * 0.55 + f * 0.45; cardList.push([Math.round(FLY0 + (IM - 40 - FLY0) * f), at(e, Math.cos(f * 7), 1.1 - 0.15 * f, 1, Math.round(f * 330)), 'linear']); }
  cardList.push([IM + 60, at(1, 1, k.aim ? 1.7 : 0.7, 0, 400)]);
  fx(k.pic(card, CARD, 15, 19.5, { lit: true }), cardList);
  // its trail of motes
  for (let j = 0; j < 9; j++) {
    const f = 0.06 + j * 0.1, ts = Math.round(FLY0 + (IM - 40 - FLY0) * (f * f * 0.55 + f * 0.45)), a = (s, o) => { const [x, y] = k.P(...bz(f)); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) scale(${s})`, opacity: o }; };
    fx(k.pic(j % 2 ? 'mote' : 'orb', CARD, j % 2 ? 5 : 8, j % 2 ? 5 : 8), [[ts, a(0.5, 0), 'ease-out'], [ts + 40, a(1, 0.9)], [ts + 320, a(0.3, 0)]]);
  }
  // a light riding the card
  const lr = [[REL, { transform: 'scale(.6)', opacity: 0 }, 'ease-out']];
  for (let j = 0; j <= N; j++) { const f = j / N, e = f * f * 0.55 + f * 0.45, [x, y] = k.P(...bz(e)); lr.push([Math.round(FLY0 + (IM - 40 - FLY0) * f), { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) scale(1)`, opacity: 0.8 }, 'linear']); }
  lr.push([IM + 80, { transform: `${lr[lr.length - 1][1].transform.replace('scale(1)', 'scale(1.5)')}`, opacity: 0 }]);
  fx(k.pic('orb', CARD, 22, 22), lr);

  // ── impact at T: flash, rings, motes; alone, the card sinks into the pool: ripples, the reflection flaring
  const flat = k.aim ? 1 : 0.34;
  fx(k.light('g-spirit', T, 62), [[IM - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [IM + 500, { transform: 'scale(1.2)', opacity: 0.6 }, eio], [IM + 1400, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.light('g-spirit', T, 26), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.6)', opacity: 1 }], [IM + 250, { transform: 'scale(2.6)', opacity: 0 }]]);
  for (const [d, w, o] of [[0, 72, 0.95], [140, 52, 0.7], [300, 86, 0.5]]) {
    fx(k.pic(ring, T, w, w * flat), [[IM + d - 1, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + d + 50, { transform: 'scale(.3)', opacity: o }, 'ease-out'], [IM + d + 800, { transform: 'scale(1.15)', opacity: 0 }]]);
  }
  for (let i = 0; i < 12; i++) {
    const dx = (rand() - 0.5) * 46, t0 = IM + 40 + rand() * 700, life = 800 + rand() * 600, sz = 2.5 + rand() * 3;
    const pts = k.arc([0, 0], [dx * 0.4 + (rand() - 0.5) * 14, -18], [dx * 0.7, -40 - rand() * 14], 5);
    fx(k.pic(i % 3 ? 'mote' : 'orb', [T[0] + dx * 0.3, T[1] + 3 + rand() * 6], sz, sz), [[t0 - 1, { transform: `${k.T(0, 0)} scale(.3)`, opacity: 0 }, 'ease-out'],
      ...pts.map(([px, py], j) => [Math.round(t0 + life * j / 5), { transform: `${k.T(px, py)} scale(${(1 - 0.5 * j / 5).toFixed(2)})`, opacity: j === 0 || j === 5 ? 0 : 0.9 }, 'ease-out'])]);
  }
}
