// Bone Altar (a relic, an aura: once each turn a creature is sacrificed to draw a card). The place itself acts: the
// cold flame sinks and the candle flames lean in toward it, the three skulls begin to rattle and their eyes
// kindle; a pale spirit rises up the steps, in front of the skulls, in a slow S and is drawn into the flame (the
// sacrifice). The flame leaps tall and white, the candles flare, the skulls hop, a violet ring spreads across the
// vault and out past the frame, light floods the bones, and a glowing card lifts from the flame and sweeps down and
// out toward the viewer (the card drawn). Bone-dust drifts up; the flame sinks back, the candles calm, the skulls
// settle: as drawn.
//
// PLAN (drawing units 300 x 210, ms of the move). Role aura (as suggested), element bone. An aura isn't aimed.
// Parts: flame (the big tongues), six candle flames (candA-D on the altar, candE-F on the floor), three skulls.
//   0-700    SWELL: flame sinks low and flickers faster; candles lean in; skulls rattle, their eyes kindle; the
//            vault's light swells.
//   700-1400 the spirit climbs the steps (700-1400) and is drawn into the flame.
//   1450     PEAK: flame leaps (tall, white), candles flare, skulls hop; flash, rings, light floods the bones; the
//            card lifts out (1550) and sweeps down and off the bottom (to 2400); bone-dust rises.
//   2000-3600 CALM: the flame sinks and settles, the candles quiver and steady, the skulls stop, the light ebbs.
// BEATS: release 700 (the spirit starts up), impact 1450, settle 3600.
import { mul, rot, scl, tr, app, curve, kit } from './_fx.js';

export const END = 4200;
export const BEATS = { release: 700, impact: 1450, settle: 3600 };
export const STILLS = [350, 800, 1150, 1450, 1650, 2000, 2800, 3900];

export const textures = {
  dust: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226 + 20 * c, 210 + 30 * c, 255, Math.min(1, c * c * 2.4)]; }],
  wisp: [64, 64, (x, y) => { const dx = (x - 0.5) * 2, dy = (y - 0.55) * 2, r = Math.hypot(dx, dy * 0.75), c = Math.max(0, 1 - r); const tail = dy > 0 ? Math.max(0, 1 - Math.abs(dx) * (2 + dy * 2) - dy * 0.6) : 0; return [215 + 40 * c, 200 + 50 * c, 255, Math.min(1, c * c * 2.2 + tail * 0.5)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const F = kit(k), { drive } = F;
  const S = k.spec, FL = S.flame, SK = S.skulls, CD = S.candles;
  const IM = BEATS.impact, BACK = BEATS.settle, END_ = BACK + 100;
  const tidy = (l) => l.filter((q, i) => i === 0 || q[0] > l[i - 1][0]);
  const env = curve([[0, 0], [300, 0.7], [700, 1], [1450, 1.4], [2300, 0.8], [3000, 0.3], [BACK, 0]]); // how lively the flames flicker

  // ── the big flame: sinks, leaps white and tall at the peak, sinks back, settles
  const sy = curve([[0, 1], [400, 0.9], [700, 0.8, 'out'], [1100, 0.9], [1380, 0.86, 'in'], [1480, 1.42], [1700, 1.28], [2100, 1.1], [2800, 1.04], [BACK, 1]]);
  const flameW = (t) => {
    const e = env(t), y = sy(t) * (1 + 0.05 * e * Math.sin(t / 61) + 0.03 * e * Math.sin(t / 37)), x = 1 + (1 - sy(t)) * 0.45 - 0.03 * e * Math.sin(t / 61 + 1);
    return mul(scl(x, y, FL[0], FL[1]), rot(3.2 * e * Math.sin(t / 130), FL[0], FL[1]));
  };
  drive(k.part('flame'), FL, flameW, END_, 40);

  // ── the candle flames: lean in toward the altar's flame, flare at the peak, flicker, steady
  ['candA', 'candB', 'candC', 'candD', 'candE', 'candF'].forEach((n, i) => {
    const [cx, cy] = CD[i], toward = cx < 150 ? 1 : -1, ph = i * 1.7;
    const lean = curve([[0, 0], [600, 14 * toward], [1380, 18 * toward], [1480, -10 * toward], [2000, 4 * toward], [BACK, 0]]);
    const gs = curve([[0, 1], [700, 0.9], [1400, 0.9, 'in'], [1500, 1.9], [1800, 1.4], [2400, 1.12], [BACK, 1]]);
    const W = (t) => { const e = env(t), g = gs(t) * (1 + 0.14 * e * Math.sin(t / 53 + ph)); return mul(scl(1 + (1 - g) * 0.3 + 0.08 * e * Math.sin(t / 47 + ph), g, cx, cy), rot(lean(t) + 5 * e * Math.sin(t / 71 + ph), cx, cy)); };
    drive(k.part(n), CD[i], W, END_, 40);
  });

  // ── the skulls: rattle while it swells, hop at the peak (one after another), settle
  const eyes = [];
  SK.forEach(([sx, sb], i) => {
    const hop = (t) => { const t0 = IM + i * 70; if (t < t0 || t > t0 + 500) return 0; const f = (t - t0) / 500; return -4.5 * Math.sin(Math.PI * f) * (1 - 0.5 * f); };
    const rat = curve([[0, 0], [350, 0.3], [800, 1], [1400, 1.6], [IM + 120, 0], [BACK, 0]]);
    const W = (t) => { const r = rat(t), a = 4 * r * Math.sin(t / (41 + i * 9) + i), j = 0.7 * r * Math.sin(t / 29 + i * 2); return mul(tr(0, hop(t) + j), rot(a, sx, sb)); };
    drive(k.part(`skull${i}`), [sx, sb], W, END_, 40);
    // the skull's eyes kindle (each follows the skull)
    for (const dx of [-3.3, 3.3]) eyes.push([i, [sx + dx, sb - 8.5], W]);
  });
  for (const [i, pt, W] of eyes) {
    F.ride(k.lightIn('g-violet', pt, 9, 9), pt, W, [[300 + i * 90, 0.3, 0], [800, 0.9, 0.55], [IM, 1.3, 1], [IM + 400, 1.1, 0.75], [2400, 0.8, 0.3], [3200, 0.5, 0]]);
  }
  // the skulls in the side niches kindle too
  for (const [x, y] of [[55.5, 166], [244.5, 166]]) fx(k.lightIn('g-violet', [x, y], 22, 22), [[500, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM, { transform: 'scale(1.1)', opacity: 0.9 }, eio], [2200, { transform: 'scale(.9)', opacity: 0.35 }, eio], [3200, { transform: 'scale(.6)', opacity: 0 }]]);

  // ── light: the vault swells, floods at the peak, ebbs; the bones lit; the candles' glows flare
  fx(k.lightIn('g-violet', [150, 80], 260, 180), [[100, { transform: 'scale(.8)', opacity: 0 }, 'ease-out'], [IM - 80, { transform: 'scale(.95)', opacity: 0.18 }, 'ease-in'], [IM + 60, { transform: 'scale(1.05)', opacity: 0.55 }, 'ease-out'], [2200, { transform: 'scale(1)', opacity: 0.2 }, eio], [BACK, { transform: 'scale(.9)', opacity: 0 }]]);
  fx(k.lightIn('g-violet', [150, 142], 150, 70), [[600, { transform: 'scale(.7)', opacity: 0 }, 'ease-out'], [IM - 60, { transform: 'scale(.9)', opacity: 0.25 }, 'ease-in'], [IM + 80, { transform: 'scale(1.1)', opacity: 0.8 }, 'ease-out'], [IM + 600, { transform: 'scale(1)', opacity: 0.45 }, eio], [2800, { transform: 'scale(.9)', opacity: 0 }]]);
  CD.forEach(([x, y], i) => fx(k.lightIn('g-violet', [x, y - 6], 24, 24), [[IM - 60, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(1.4)', opacity: 0.95 }, eio], [IM + 400, { transform: 'scale(1)', opacity: 0.55 }, eio], [2300, { transform: 'scale(.9)', opacity: 0.2 }, eio], [3000, { transform: 'scale(.6)', opacity: 0 }]]));
  // the peak's flash over the flame, spilling past the card's frame (the overlay)
  fx(k.light('g-violet', [150, 70], 100), [[IM - 70, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.4)', opacity: 0.7 }, 'ease-out'], [IM + 300, { transform: 'scale(1.1)', opacity: 0.55 }, eio], [2300, { transform: 'scale(1.2)', opacity: 0.2 }, eio], [3100, { transform: 'scale(1.4)', opacity: 0 }]]);
  fx(k.lightIn('g-violet', [150, 78], 50, 70), [[IM - 70, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 30, { transform: 'scale(1.1)', opacity: 0.55 }, 'ease-out'], [IM + 330, { transform: 'scale(.8)', opacity: 0 }]]);

  // ── the spirit: a pale wisp climbing the steps in an S, drawn up into the flame (700-1400), with a tail of motes
  const path = (f) => { const e = f * f * (3 - 2 * f); return [150 + Math.sin(f * Math.PI * 2.2) * 15 * (1 - f * 0.6), 190 - 88 * e]; };
  const wk = [];
  for (let j = 0; j <= 14; j++) {
    const f = j / 14, [x, y] = path(f), [x2, y2] = path(Math.min(1, f + 0.04)), ang = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI + 90;
    wk.push([700 + f * 700, { transform: `${k.T(x - 150, y - 190)} rotate(${(f === 1 ? ang : ang).toFixed(0)}deg) scale(${(f < 0.12 ? 0.5 + f * 4 : 1 - 0.5 * Math.pow(f, 3)).toFixed(2)}, ${(1 + 0.35 * Math.sin(f * 9)).toFixed(2)})`, opacity: j === 0 ? 0 : j === 14 ? 0 : f > 0.85 ? 0.6 : 0.95 }, 'linear']);
  }
  fx(k.pic('wisp', [150, 190], 20, 26), wk);
  fx(k.light('g-violet', [150, 190], 26), wk.map(([t, kf], j) => [t, { transform: kf.transform.replace(/rotate\([^)]*\)/, ''), opacity: kf.opacity * 0.5 }, 'linear']));
  for (let i = 0; i < 12; i++) {
    const f = 0.1 + i * 0.07, [x, y] = path(f), t0 = 700 + f * 700, sz = 2.2 + rand() * 2.6;
    fx(k.pic('dust', [x, y], sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 70, { transform: 'scale(1)', opacity: 0.9 }, 'linear'], [t0 + 480, { transform: `${k.T((rand() - 0.5) * 8, 7 + rand() * 6)} scale(.4)`, opacity: 0 }]]);
  }

  // ── the card: lifts from the flame at 1550 and sweeps down and out toward the viewer
  const card = k.svg('<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4ecff"/><stop offset="1" stop-color="#9b6bff"/></linearGradient><filter id="b" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><rect x="2" y="2" width="20" height="28" rx="2.5" fill="#b07cff" filter="url(#b)" opacity=".8"/><rect x="3" y="3" width="18" height="26" rx="2" fill="url(#g)"/><rect x="5.5" y="5.5" width="13" height="11" rx="1" fill="#2a1d4a" opacity=".55"/><path d="M6,20H18M6,23H15" stroke="#4a3480" stroke-width="1.2" stroke-linecap="round" opacity=".6"/>', 24, 32);
  fx(k.pic(card, [150, 60], 15, 20), [[1500, { transform: `${k.T(0, 14)} rotate(0deg) scale(.4)`, opacity: 0 }, 'ease-out'], [1650, { transform: `${k.T(0, -8)} rotate(-4deg) scale(.95)`, opacity: 1 }, eio], [1850, { transform: `${k.T(2, -14)} rotate(6deg) scale(1.05)`, opacity: 1 }, 'ease-in'],
    [2150, { transform: `${k.T(14, 40)} rotate(-12deg) scale(1.5)`, opacity: 1 }, 'ease-in'], [2450, { transform: `${k.T(34, 150)} rotate(-30deg) scale(2.3)`, opacity: 0.9 }], [2600, { transform: `${k.T(44, 190)} rotate(-40deg) scale(2.6)`, opacity: 0 }]]);
  fx(k.light('g-violet', [150, 60], 30), [[1500, { transform: `${k.T(0, 14)} scale(.4)`, opacity: 0 }, 'ease-out'], [1650, { transform: `${k.T(0, -8)} scale(1)`, opacity: 0.8 }, eio], [1850, { transform: `${k.T(2, -14)} scale(1.1)`, opacity: 0.8 }, 'ease-in'], [2150, { transform: `${k.T(14, 40)} scale(1.6)`, opacity: 0.7 }, 'ease-in'], [2450, { transform: `${k.T(34, 150)} scale(2.4)`, opacity: 0.5 }], [2600, { transform: `${k.T(44, 190)} scale(2.6)`, opacity: 0 }]]);

  // ── rings: two across the vault and out past the frame
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#9b6bff" stroke-width="6" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#e7d7ff" stroke-width="1.4"/>', 100, 100);
  for (let i = 0; i < 3; i++) { const t0 = IM + i * 170; fx(k.pic(ring, [150, 92], 70, 70), [[t0, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [t0 + 80, { transform: 'scale(.5)', opacity: 0.95 }, 'ease-out'], [t0 + 1000, { transform: `scale(${(5.5 - i * 0.8).toFixed(1)})`, opacity: 0 }]]); }

  // ── bone-dust and violet motes rising from the altar, drifting and thinning
  for (let i = 0; i < 26; i++) {
    const x = 104 + rand() * 92, y = 160 - rand() * 55, t0 = IM + 40 + rand() * 700, sz = 1.8 + rand() * 3, rise = 22 + rand() * 46, dx = (rand() - 0.5) * 26;
    fx(k.pic('dust', [x, y], sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 120, { transform: `${k.T(dx * 0.1, -rise * 0.1)} scale(1)`, opacity: 0.95 }, 'linear'], [t0 + 1000, { transform: `${k.T(dx, -rise)} scale(.7)`, opacity: 0 }]]);
  }
}
