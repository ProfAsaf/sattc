// Spark: the single spark over an open palm gathers itself, is flicked away, and is kindled anew.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support (as suggested: it gives Energy),
// element light (changed from the suggested shadow: the picture is a bright spark and gold light
// in the dark; nothing in it is shadow).
//   0-1000    gather: the hand cups and lifts a little; the spark trembles and swells, its glow
//             spills warm over the palm; fine motes of light are drawn in from the dark.
//   1000-1100 the spark draws down small (a wind-up) and the hand dips.
//   1100      RELEASE: the hand flicks and the spark darts away along an arc to T, a comet of
//             light behind it.
//   1500      IMPACT at T: it blooms: flash, two rings and rays, motes thrown out, and a small
//             star is left there, pulsing, giving its Energy: it drifts up and fades.
//   1500-2900 the hand settles; a new spark is kindled over the palm: a pinprick that swells
//             back to the drawn spark, with a few motes falling into it. At rest as drawn from
//             3200 (END 3600).
// Aimed: T = k.aim || [228, 56] (the dark above its hand, to the upper right). The spark's
// path and the hand's flick are worked from spec.emit and T, whichever side T is.
import { curve, kit } from './_fx.js';
export const END = 3600;
export const BEATS = { release: 1100, impact: 1500, settle: 3200 };
export const STILLS = [450, 950, 1100, 1250, 1520, 1900, 2500, 3400];
export const textures = {
  mote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 232 + 20 * c, 150 + 90 * c * c, Math.min(1, c * c * c * 2.4)]; }],
  star: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); const ax = Math.abs(x - 0.5) * 2, ay = Math.abs(y - 0.5) * 2, ray = Math.max(0, 1 - Math.min(ax, ay) * 9) * Math.max(0, 1 - Math.max(ax, ay)); return [255, 236 + 18 * c, 170 + 70 * c * c, Math.min(1, c * c * c * 1.6 + ray * 0.85)]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const hand = k.part('hand'), spark = k.part('spark');
  const E = k.spec.emit, WR = k.spec.wrist;
  const T = k.aim || [228, 56];
  const dx = T[0] - E[0], dy = T[1] - E[1], len = Math.hypot(dx, dy) || 1;
  const kick = dx >= 0 ? -1 : 1; // the hand flicks away from where the spark goes (a hand reaching from the right turns its fingers toward -x)
  const bz = h.arcPath(E, T, 12 + Math.min(18, len * 0.1));

  // ── the hand: cups and lifts as it gathers, dips, flicks at the release, settles
  act(hand, [[0, { transform: 'none' }, eio], [600, { transform: `${k.T(0, -1.2)} rotate(-2.2deg)` }, eio], [1020, { transform: `${k.T(0, 1.6)} rotate(1.6deg)` }, 'ease-in'],
    [1130, { transform: `${k.T(0, -2.2)} rotate(${(-3.2 * kick).toFixed(1)}deg)` }, 'ease-out'], [1500, { transform: `${k.T(0, 0.8)} rotate(${(1.2 * kick).toFixed(1)}deg)` }, eio], [2100, { transform: `${k.T(0, -0.6)} rotate(-.6deg)` }, eio], [3000, { transform: 'none' }]]);

  // ── the spark: trembles and swells, draws down, darts off, and is kindled anew
  const sk = [[0, { transform: 'scale(1)', opacity: 1 }, eio]];
  for (let t = 150, i = 0; t < 1000; t += 110, i++) sk.push([t, { transform: `${k.T(0, -0.8 * (i % 2 ? 1 : -1) - 0.5)} scale(${(1 + 0.45 * ((t - 100) / 900) + (i % 2 ? 0.05 : -0.03)).toFixed(2)})`, opacity: 1 }, eio]);
  sk.push([1070, { transform: `${k.T(0, 1)} scale(.7)`, opacity: 1 }, 'ease-in']);
  for (let f = 0; f <= 1.001; f += 0.125) {
    const q = f * f * 0.55 + f * 0.45, p = bz(q);
    sk.push([1100 + f * 380, { transform: `${k.T(p[0] - E[0], p[1] - E[1])} scale(${(1.2 - 0.55 * f).toFixed(2)}) rotate(${Math.round(f * 160)}deg)`, opacity: f > 0.99 ? 0 : 1 }, 'linear']);
  }
  // unseen while it is gone; then a pinprick kindles over the palm and swells back to the drawn spark
  sk.push([1960, { transform: 'scale(.05)', opacity: 0 }, 'ease-out'], [2300, { transform: 'scale(.55)', opacity: 0.9 }, 'ease-out'], [2600, { transform: 'scale(1.18)', opacity: 1 }, eio], [2950, { transform: 'scale(.97)', opacity: 1 }, eio], [3200, { transform: 'none', opacity: 1 }]);
  act(spark, sk);

  // ── the warmth of it on the palm and in the dark
  const warm = [[100, { transform: 'scale(.6)', opacity: 0 }, 'ease-out']];
  for (let t = 500, i = 0; t < 1050; t += 110, i++) warm.push([t, { transform: `scale(${(1.0 + 0.4 * ((t - 100) / 900) + (i % 2 ? 0.08 : -0.04)).toFixed(2)})`, opacity: +(0.45 + 0.4 * ((t - 100) / 900)).toFixed(2) }, eio]);
  warm.push([1130, { transform: 'scale(1.9)', opacity: 1 }, 'ease-out'], [1600, { transform: 'scale(1)', opacity: 0.1 }, eio], [2100, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'],
    [2500, { transform: 'scale(.9)', opacity: 0.45 }, eio], [2900, { transform: 'scale(1.1)', opacity: 0.5 }, eio], [3300, { transform: 'scale(.8)', opacity: 0 }]);
  fx(k.light('g-warm', E, 70), warm);
  fx(k.lightIn('g-heal', [178, 146], 90, 34), [[300, { opacity: 0 }, 'ease-out'], [1000, { opacity: 0.8 }, eio], [1150, { opacity: 1 }, eio], [1700, { opacity: 0.2 }, eio], [2400, { opacity: 0.3 }, eio], [3200, { opacity: 0 }]]);

  // ── gathering: fine motes drawn in from the dark; and after, a few falling into the new spark
  const pull = (t0, dur, from, sz) => {
    const ks = [];
    for (let t = t0; t <= t0 + dur + 1; t += 50) {
      const f = Math.min(1, (t - t0) / dur), g = f * f * (3 - 2 * f);
      ks.push([Math.min(t, t0 + dur), { transform: `${k.T((E[0] - from[0]) * g, (E[1] - from[1]) * g)} scale(${(0.5 + 0.8 * Math.sin(Math.PI * f)).toFixed(2)})`, opacity: f > 0.95 ? 0 : f < 0.1 ? f * 10 : 1 }, 'linear']);
    }
    fx(k.pic('mote', from, sz, sz), ks);
  };
  for (let i = 0; i < 18; i++) {
    const a = rand() * Math.PI * 2, r0 = 30 + rand() * 40;
    pull(150 + i * 50 + rand() * 30, 520 + rand() * 120, [E[0] + Math.cos(a) * r0 * 1.2, E[1] + Math.sin(a) * r0 * 0.8], 3 + rand() * 3);
  }
  for (let i = 0; i < 8; i++) {
    const a = rand() * Math.PI * 2, r0 = 24 + rand() * 24;
    pull(1950 + i * 90 + rand() * 40, 480 + rand() * 100, [E[0] + Math.cos(a) * r0 * 1.2, E[1] + Math.sin(a) * r0 * 0.8], 3 + rand() * 2.5);
  }

  // ── the dart (1100 - 1500): a comet of light along its arc
  for (let i = 0; i < 16; i++) {
    const t0 = 1110 + i * 16, t1 = 1420 + i * 14, sz = [9, 4, 12][i % 3], sd = (rand() - 0.5) * 6;
    const bz2 = (f) => { const p = bz(f); return [p[0], p[1] + sd * Math.sin(Math.PI * f)]; };
    h.fly(k.pic('mote', E, sz, sz), E, bz2, t0, t1, (f) => 1.1 - 0.7 * f, (f) => (f < 0.1 ? f * 9 : 0.9 * (1 - f * 0.5)), 0, 0, 50, (f) => f * f * 0.55 + f * 0.45);
  }
  fx(k.pic('star', E, 16, 16), [[1090, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1130, { transform: 'scale(1.8) rotate(20deg)', opacity: 1 }, 'ease-out'], [1330, { transform: 'scale(.6) rotate(60deg)', opacity: 0 }]]);

  // ── the bloom at T (1500): flash, rings, rays, thrown motes, and the Energy it leaves
  const IM = 1500;
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#ffe3a0" stroke-width="5" filter="url(#b)"/>', 100, 100);
  const rays = k.svg('<defs><radialGradient id="r" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbe8"/><stop offset="1" stop-color="#ffc861" stop-opacity="0"/></radialGradient></defs>' +
    Array.from({ length: 8 }, (_, i) => `<path d="M50,50 L${(50 + 48 * Math.cos((i * Math.PI) / 4 - 0.07)).toFixed(1)},${(50 + 48 * Math.sin((i * Math.PI) / 4 - 0.07)).toFixed(1)} L${(50 + 48 * Math.cos((i * Math.PI) / 4 + 0.07)).toFixed(1)},${(50 + 48 * Math.sin((i * Math.PI) / 4 + 0.07)).toFixed(1)}Z" fill="url(#r)"/>`).join(''), 100, 100);
  const flash = [[IM - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(1.4)', opacity: 1 }, 'ease-out'], [IM + 250, { transform: 'scale(1.8)', opacity: 0.6 }]];
  for (let t = IM + 450, i = 0; t < IM + 1000; t += 150, i++) flash.push([t, { transform: `scale(${i % 2 ? 1.4 : 1.2})`, opacity: i % 2 ? 0.5 : 0.36 }, eio]);
  flash.push([IM + 1500, { transform: 'scale(.9)', opacity: 0 }]);
  fx(k.light('g-warm', T, 58), flash);
  fx(k.light('g-warm', T, 20), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.6)', opacity: 1 }], [IM + 200, { transform: 'scale(2.6)', opacity: 0 }]]);
  fx(k.pic(ring, T, 54, 54), [[IM, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(.4)', opacity: 0.95 }, 'ease-out'], [IM + 520, { transform: 'scale(1.1)', opacity: 0 }]]);
  fx(k.pic(ring, T, 54, 54), [[IM + 110, { transform: 'scale(.1)', opacity: 0 }, 'ease-out'], [IM + 170, { transform: 'scale(.3)', opacity: 0.6 }, 'ease-out'], [IM + 640, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.pic(rays, T, 52, 52), [[IM - 10, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [IM + 80, { transform: 'scale(.95) rotate(10deg)', opacity: 0.95 }, 'ease-out'], [IM + 650, { transform: 'scale(1.35) rotate(36deg)', opacity: 0 }]]);
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + rand() * 0.4, d = 14 + rand() * 20, t = IM + rand() * 40, life = 600 + rand() * 500, sz = 3 + rand() * 3.5;
    const ks = [0, 0.25, 0.6, 1].map((f, j) => [t + life * f, { transform: `${k.T(Math.cos(a) * d * (0.3 + f), Math.sin(a) * d * 0.75 * (0.3 + f) + 12 * f * f)} scale(${(1.1 - 0.7 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']);
    fx(k.pic('mote', T, sz, sz), ks);
  }
  // the Energy it leaves: a small star pulsing at T, then drifting up and out
  const st = [[IM + 60, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [IM + 250, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out']];
  for (let t = IM + 450, i = 0; t < IM + 1100; t += 150, i++) st.push([t, { transform: `scale(${i % 2 ? 1.2 : 0.95}) rotate(${i * 8}deg)`, opacity: i % 2 ? 1 : 0.8 }, eio]);
  st.push([IM + 1500, { transform: `${k.T(0, -8)} scale(.6) rotate(50deg)`, opacity: 0 }]);
  fx(k.pic('star', T, 20, 20), st);
  for (let i = 0; i < 6; i++) {
    const t = IM + 350 + i * 130 + rand() * 60, p = [T[0] + (rand() - 0.5) * 20, T[1] + 4 + rand() * 6];
    fx(k.pic('mote', p, 4, 4), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 150, { transform: 'scale(1)', opacity: 1 }], [t + 1000, { transform: `${k.T((rand() - 0.5) * 8, -24 - rand() * 12)} scale(.3)`, opacity: 0 }]]);
  }
}
