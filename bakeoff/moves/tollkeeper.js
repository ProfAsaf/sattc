// Tollkeeper (a 2/3 who draws a card whenever an opponent Invests; the toll paid is the card drawn: a support whose boon is a
// card of light). The coins stacked on the gatepost glint and hop, and three of them fly through the dawn to his ledger, which
// takes them with a flick of its page and a flash; a card of pale gold forms in it and rises to the lantern. He raises the
// lantern, winds back, and swings it out toward T, throwing the card from it: it spins along an arc, a trail of gold motes
// behind it, and lands (blooming in a flash and a ring, motes rising) where it is given, and rests glowing there before
// it fades. He lowers the lantern, and the glints die down.
//
// PLAN (drawing units 300 x 210, ms). Role support (as suggested: the card drawn is a boon for its owner), element light
// (as suggested). T = k.aim, else the road ahead of him (`road`). The lantern arm turns about the shoulder to point the
// lantern at T (at most 75 degrees up, 70 down), carrying the lantern's glass and its glow with it; the card leaves from
// the lantern where it is then. Everything that flies or lands is on the overlay (k.pic, k.light): T may be another card.
//   0-500     the arm raises the lantern, its glow swelling; the coins glint and hop (the toll paid)
//   350-900   three coins arc from the post to the ledger; it flicks and flashes at each; the card of light forms in it
//   900-1150  the card rises to the lantern; the arm winds back
//   1150-1330 the swing toward T; RELEASE 1250
//   1250-1750 the card flies to T; IMPACT 1750: flash, ring, motes, the card hangs there glowing
//   1750-2900 the card glows and fades; the arm holds, then eases back down (overshoots, settles)
//   3500      SETTLE: as drawn
import { mul, rot, curve, kit } from './_fx.js';

export const END = 4000;
export const BEATS = { release: 1250, impact: 1750, settle: 3500 };
export const STILLS = [300, 650, 1000, 1250, 1500, 1800, 2400, 3700];

export const textures = {
  coin: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2; if (r > 1) return [0, 0, 0, 0]; const e = r > 0.7; return e ? [190, 130, 40, 1] : [255, 226 - 40 * r, 120 - 40 * r, 1]; }],
  card: [32, 44, (x, y) => {
    const dx = Math.abs(x - 0.5), dy = Math.abs(y - 0.5);
    if (dx > 0.44 || dy > 0.46) return [255, 214, 120, Math.max(0, 1 - Math.max((dx - 0.44) * 30, (dy - 0.46) * 30))];
    if (dx > 0.36 || dy > 0.38) return [255, 200, 90, 1];
    const line = (Math.abs(y - 0.3) < 0.025 || Math.abs(y - 0.45) < 0.025 || Math.abs(y - 0.6) < 0.025) && dx < 0.26;
    return line ? [214, 160, 60, 1] : [255, 244, 206, 1];
  }],
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 226 + 29 * c, 150 + 100 * c, Math.min(1, c * c * 2.4)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const F = kit(k), { drive, ride } = F;
  const S = k.spec, SH = S.shoulder, LC = S.emit, LG = S.ledger, CO = S.coins;
  const T = k.aim || S.road;
  const REL = BEATS.release, IM = BEATS.impact, BACK = BEATS.settle;
  k.css('.g-gold { border-radius: 50%; background: radial-gradient(circle, rgba(255,244,200,.95), rgba(255,208,112,.55) 30%, rgba(255,182,80,.18) 55%, rgba(255,170,60,0) 72%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#ffe39a" stroke-width="5" filter="url(#b)"/>', 100, 100);
  const deg = (r) => (r * 180) / Math.PI;

  // ── the lantern arm: turns about the shoulder; its angle over time (deg): raised, wound back, swung at T, held, eased back
  const a0 = deg(Math.atan2(LC[1] - SH[1], LC[0] - SH[0]));
  const aT = deg(Math.atan2(T[1] - SH[1], T[0] - SH[0]));
  const dT = Math.max(-75, Math.min(70, ((aT - a0 + 540) % 360) - 180));
  const th = curve([[0, 0], [500, -12, 'eio'], [1000, -12], [1130, -24, 'eio'], [1330, dT, 'out'], [2500, dT], [2900, dT * 0.1 - 4, 'eio'], [3200, 3, 'eio'], [BACK, 0]]);
  const W = (t) => rot(th(t), SH[0], SH[1]);
  const lampAt = (t) => { const r = (th(t) * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r), dx = LC[0] - SH[0], dy = LC[1] - SH[1]; return [SH[0] + dx * c - dy * s, SH[1] + dx * s + dy * c]; };
  drive(k.part('arm'), SH, W, BACK);
  drive(k.part('lamp'), SH, W, BACK);
  drive(k.part('lampglow'), SH, W, BACK);
  // the lantern's own light swells over its glow as it is raised and as the card leaves it
  ride(k.lightIn('g-gold', LC, 46, 46), LC, W, [[0, 0.5, 0], [450, 1.0, 0.8], [1000, 1.15, 0.9], [1250, 1.5, 1], [1450, 1.2, 0.8], [2300, 1.0, 0.5], [3000, 0.8, 0.15], [BACK, 0.6, 0]]);

  // ── the toll paid: the coins glint and hop, three fly to the ledger
  act(k.part('coins'), [[0, { transform: 'none' }, eio], [250, { transform: 'translateY(0px) scale(1.02, .98)' }, 'ease-out'], [380, { transform: `${k.T(0, -2.2)} scale(.98, 1.04)` }, 'ease-in'], [470, { transform: 'none' }, 'ease-out'],
    [620, { transform: `${k.T(0, -1.6)}` }, 'ease-in'], [700, { transform: 'none' }, 'ease-out'], [880, { transform: `${k.T(0, -1.2)}` }, 'ease-in'], [950, { transform: 'none' }]]);
  fx(k.lightIn('g-gold', [CO[0], CO[1] - 2], 40, 28), [[100, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [400, { transform: 'scale(1.2)', opacity: 0.9 }, eio], [900, { transform: 'scale(1.1)', opacity: 0.7 }, eio], [1500, { transform: 'scale(.7)', opacity: 0 }]]);
  const toLedger = F.arcPath([CO[0], CO[1] - 2], [LG[0], LG[1] - 2], 26);
  for (let i = 0; i < 3; i++) {
    const t0 = 380 + i * 160, el = k.pic('coin', [CO[0], CO[1] - 2], 5, 5);
    F.fly(el, [CO[0], CO[1] - 2], toLedger, t0, t0 + 380, (f) => 0.7 + 0.5 * Math.sin(f * 3.14), (f) => (f < 0.08 ? f * 12 : f > 0.92 ? (1 - f) * 12 : 1), 0, 540, 40);
    // the clink at the ledger as each arrives
    fx(k.pic('mote', [LG[0], LG[1] - 4], 9, 9), [[t0 + 340, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t0 + 390, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [t0 + 620, { transform: 'scale(.6)', opacity: 0 }]]);
  }
  act(k.part('ledger'), [[0, { transform: 'none' }, eio], [720, { transform: 'none' }, 'ease-out'], [800, { transform: `${k.T(0, 1.2)} rotate(-3deg)` }, 'ease-out'], [900, { transform: `${k.T(0, -0.6)} rotate(1.5deg)` }, eio], [1020, { transform: `${k.T(0, 0.5)} rotate(-1deg)` }, eio],
    [1160, { transform: 'none' }]]);
  fx(k.lightIn('g-gold', LG, 30, 24), [[700, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(1.2)', opacity: 0.9 }, eio], [1100, { transform: 'scale(1)', opacity: 0.7 }, eio], [1350, { transform: 'scale(.6)', opacity: 0 }]]);

  // ── the card of light: forms in the ledger, rises to the lantern, is thrown from it along an arc to T, and rests there
  const C = [(LC[0] + T[0]) / 2, Math.min(LC[1], T[1]) - 32];
  const L1 = lampAt(REL);
  const bz = (t) => { const q = 1 - t; return [q * q * L1[0] + 2 * q * t * C[0] + t * t * T[0], q * q * L1[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const card = k.pic('card', LG, 13, 18);
  const ck = [];
  const at = (p, sc, o, r) => ({ transform: `${k.T(p[0] - LG[0], p[1] - LG[1])} rotate(${r.toFixed(1)}deg) scale(${sc.toFixed(3)})`, opacity: +o.toFixed(3) });
  ck.push([700, at([LG[0], LG[1] - 2], 0.2, 0, -8), 'ease-out']);
  for (let t = 760; t <= REL; t += 40) {
    const rise = k.smooth(Math.min(1, Math.max(0, (t - 850) / 330)));
    const L = lampAt(t), p = [LG[0] + (L[0] - LG[0]) * rise, LG[1] + (L[1] - LG[1]) * rise - 8 * Math.sin(Math.min(1, (t - 760) / 420) * 1.5) * (1 - rise)];
    ck.push([t, at(p, 0.2 + 0.8 * Math.min(1, (t - 700) / 300) - 0.1 * rise, Math.min(1, (t - 700) / 150), -8 + 8 * rise), 'linear']);
  }
  const FL = IM - REL;
  for (let t = REL + 40; t <= IM; t += 40) {
    const f = (t - REL) / FL, e = f * f * 0.45 + f * 0.55;
    ck.push([t, at(bz(e), 1 + 0.5 * Math.sin(f * 3.14), 1, (f * 330) % 360), 'linear']);
  }
  ck.push([IM + 40, at(T, 1.5, 1, 360), 'ease-out'], [IM + 260, at([T[0], T[1] - 3], 1.25, 1, 372), eio]);
  for (let t = IM + 520, i = 0; t < 2300; t += 280, i++) ck.push([t, at([T[0], T[1] - 3 - (i % 2) * 1.2], 1.25 + (i % 2) * 0.06, 0.95, 372), eio]);
  ck.push([2900, at([T[0], T[1] - 9], 1.1, 0, 372)]);
  fx(card, ck);
  // a light riding the card as it goes
  const gl = [];
  gl.push([760, { transform: `${k.T(LG[0] - LG[0], LG[1] - LG[1])} scale(.3)`, opacity: 0 }, 'ease-out']);
  for (let t = 800; t <= REL; t += 60) { const rise = k.smooth(Math.min(1, Math.max(0, (t - 850) / 330))), L = lampAt(t); gl.push([t, { transform: `${k.T((L[0] - LG[0]) * rise, (L[1] - LG[1]) * rise)} scale(.9)`, opacity: 0.8 }, 'linear']); }
  for (let t = REL + 60; t <= IM; t += 60) { const p = bz(((t - REL) / FL) ** 2 * 0.45 + ((t - REL) / FL) * 0.55); gl.push([t, { transform: `${k.T(p[0] - LG[0], p[1] - LG[1])} scale(1.1)`, opacity: 0.9 }, 'linear']); }
  gl.push([IM + 100, { transform: `${k.T(T[0] - LG[0], T[1] - LG[1])} scale(1.8)`, opacity: 1 }, 'ease-out'], [IM + 500, { transform: `${k.T(T[0] - LG[0], T[1] - LG[1])} scale(1.2)`, opacity: 0.8 }, eio], [2500, { transform: `${k.T(T[0] - LG[0], T[1] - LG[1])} scale(1)`, opacity: 0.45 }, eio], [2950, { transform: `${k.T(T[0] - LG[0], T[1] - LG[1])} scale(.7)`, opacity: 0 }]);
  fx(k.light('g-gold', LG, 28), gl);
  // motes trailing the card
  for (let i = 0; i < 12; i++) {
    const f0 = i / 12, t = REL + f0 * FL * 0.9, sz = 3 + rand() * 3, sx = (rand() - 0.5) * 8, sy = (rand() - 0.5) * 8;
    const p0 = bz(f0 * f0 * 0.45 + f0 * 0.55);
    fx(k.pic('mote', LG, sz, sz), [[t, { transform: `${k.T(p0[0] - LG[0], p0[1] - LG[1])} scale(.4)`, opacity: 0 }, 'ease-out'], [t + 90, { transform: `${k.T(p0[0] - LG[0] + sx * 0.4, p0[1] - LG[1] + sy * 0.4)} scale(1)`, opacity: 0.95 }],
      [t + 420, { transform: `${k.T(p0[0] - LG[0] + sx, p0[1] - LG[1] + sy + 6)} scale(.3)`, opacity: 0 }]]);
  }
  // ── where it lands (IMPACT): flash, two rings, motes thrown up and drifting
  fx(k.light('g-gold', T, 70), [[IM - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [IM + 400, { transform: 'scale(1.05)', opacity: 0.75 }, eio], [IM + 1100, { transform: 'scale(1.2)', opacity: 0.4 }, eio], [IM + 1700, { transform: 'scale(1.3)', opacity: 0 }]]);
  fx(k.pic(ring, T, 56, 56), [[IM, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(.4)', opacity: 0.95 }, 'ease-out'], [IM + 480, { transform: 'scale(1.1)', opacity: 0 }]]);
  fx(k.pic(ring, T, 56, 56), [[IM + 110, { transform: 'scale(.1)', opacity: 0 }, 'ease-out'], [IM + 170, { transform: 'scale(.3)', opacity: 0.6 }, 'ease-out'], [IM + 620, { transform: 'scale(.8)', opacity: 0 }]]);
  for (let i = 0; i < 14; i++) {
    const a = -Math.PI * (0.05 + rand() * 0.9), v = 12 + rand() * 24, t = IM + rand() * 80, life = 600 + rand() * 600, sz = 3 + rand() * 3.5;
    fx(k.pic('mote', T, sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 100, { transform: `${k.T(Math.cos(a) * v * 0.4, Math.sin(a) * v * 0.4)} scale(1)`, opacity: 1 }, 'ease-out'],
      [t + life, { transform: `${k.T(Math.cos(a) * v, Math.sin(a) * v - 8)} scale(.5)`, opacity: 0 }]]);
  }
  // and the coins on the post and the lantern's glints die back as the card fades (the coins' glow above fades by 1500)
}
