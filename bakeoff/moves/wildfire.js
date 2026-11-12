// Wildfire: the wall of fire surges.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker (a damage spell: the fire
// is the attack), element fire.
//   0-500     draw back: both walls of flame lean away from the target and shrink,
//             a breath held; the glow dips; the runners start to bound.
//   500-1050  swell: the walls rear up, flickering harder, the light and smoke rise,
//             embers streaming up off the crest; the deer, soldiers and fox bound faster,
//             the birds flap up.
//   1050      RELEASE: the walls snap over toward T and a surge runs along the crest:
//             flames leaping up one after another from its heart out toward T, a roll of
//             billows and a travelling light flying an arc to T.
//   1600      IMPACT at T: flash, rings, billows and sparks flung, flames catch, smoke.
//   1600-3100 the walls sink back and sway upright, the runners slow and stop where
//             they were, the surge flames die down, the light and smoke fade. At rest from 3100.
// Aimed: T = k.aim || [272, 124]. The surge runs from the wall's heart (spec.emit) toward T,
// along the crest as far as the picture goes, and its billows fly the arc to T on the overlay.
import { SPARK, mul, scl, tr, rot, curve, kit } from './_fx.js';
export const END = 3600;
export const BEATS = { release: 1050, impact: 1600, settle: 3100 };
export const STILLS = [300, 800, 1100, 1350, 1600, 1900, 2500, 3300];
export const textures = { spark: SPARK };

export function build(k) {
  const { fx, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const [ex, ey] = k.spec.emit, by = k.spec.front;
  const T = k.aim || [272, 124];
  const dir = T[0] >= ex ? 1 : -1;
  const TAU = Math.PI * 2;

  // ── the two walls: scaled up about their bases and thrown over toward T (a shear), flickering as they rear
  const rear = curve([[0, 1], [450, 0.88], [1050, 1.42, 'out'], [1300, 1.55], [1750, 1.32], [2400, 1.08], [3050, 1]]);
  const lean = curve([[0, 0], [450, -0.1], [1000, 0.04], [1250, 0.34, 'out'], [1700, 0.3], [2400, 0.1], [3050, 0]]);
  const heat = curve([[0, 0], [550, 0], [900, 1], [2300, 1], [3000, 0]]);
  const wall = (part, P, gain, lag, ph) => h.drive(part, P, (t) => {
    const tt = Math.max(0, t - lag), s = 1 + (rear(tt) - 1) * gain + heat(tt) * 0.07 * Math.sin((tt / 85) * TAU * 0.5 + ph), lx = dir * lean(tt) * gain;
    return mul([1, 0, lx, 1, -lx * by, 0], scl(1 + (s - 1) * 0.25, s, P[0], by));
  }, 3100, 40);
  wall(k.part('wallA'), [150, 142], 0.85, 0, 0);
  wall(k.part('wallB'), [150, 146], 1, 70, 2);
  h.drive(k.part('pines'), [150, 146], () => [1, 0, 0, 1, 0, 0], 40); // (cut so the far wall doesn't cover them; they stand still)

  // ── everything running before it bounds faster as it swells, then stops where it was
  const env = curve([[0, 0], [250, 0.3, 'out'], [700, 1], [2300, 1], [3000, 0]]);
  const surge = curve([[0, 0], [1100, 0], [1600, 1], [2300, 0.6], [3000, 0]]);
  const run = (name, pv, amp, per, ph, dxm, tilt) => h.drive(k.part(name), pv, (t) => {
    const e = env(t), c = 0.5 - 0.5 * Math.cos((t / per) * TAU + ph);
    return mul(tr(dxm * surge(t), -amp * e * c), rot(tilt * e * Math.sin((t / per) * TAU + ph), pv[0], pv[1]));
  }, 3100, 40);
  run('deer', [140, 126], 5, 380, 0, 8, 2.5);
  run('soldierL', [56, 149], 2.6, 310, 1.7, 7, 2);
  run('soldierR', [236, 160], 2.4, 290, 0.6, 5, 2);
  run('fox', [196, 157], 3.6, 250, 2.4, 9, 3);
  h.drive(k.part('birds'), [238, 100], (t) => { const e = env(t); return mul(tr(7 * surge(t), -7 * e - 2 * e * Math.sin((t / 420) * TAU)), rot(4 * e * Math.sin((t / 520) * TAU), 238, 100)); }, 3100, 40);

  // ── light: the whole picture swells with firelight; smoke boils off the top
  fx(k.lightIn('g-city', [150, 130], 340, 150), [[100, { opacity: 0 }, 'ease-out'], [500, { opacity: 0.25 }, eio], [1100, { opacity: 0.75 }, eio], [1700, { opacity: 0.95 }, eio], [2500, { opacity: 0.45 }], [3300, { opacity: 0 }]]);
  fx(k.lightIn('g-warm', [150, 120], 260, 120, { under: true }), [[300, { opacity: 0 }, 'ease-out'], [1100, { opacity: 0.6 }, eio], [1700, { opacity: 0.8 }, eio], [2600, { opacity: 0.25 }], [3300, { opacity: 0 }]]);
  for (let i = 0; i < 6; i++) {
    const t = 600 + i * 270, x = 40 + i * 44 + (rand() - 0.5) * 20, r = Math.round(rand() * 360);
    fx(k.picIn('smoke', [x, 70 + rand() * 20], 42, 42, { lit: false }), [[t, { transform: `rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'],
      [t + 500, { transform: `${k.T(dir * 4, -10)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 1500, { transform: `${k.T(dir * 14, -38)} rotate(${r + 50}deg) scale(1.9)`, opacity: 0 }]]);
  }
  // embers streaming up off the crest, blown toward T
  for (let i = 0; i < 26; i++) {
    const t = 700 + i * 60 + rand() * 40, x = 8 + rand() * 284, y = 108 + rand() * 30, life = 600 + rand() * 400, sz = 3 + rand() * 3;
    fx(k.picIn('spark', [x, y], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 120, { transform: 'scale(1)', opacity: 1 }], [t + life, { transform: `${k.T(dir * (10 + rand() * 24), -(30 + rand() * 44))} scale(.2)`, opacity: 0 }]]);
  }

  // ── the surge (1050-1600): flames leap along the crest one after another from the heart toward T
  const xEnd = Math.max(8, Math.min(292, T[0]));
  const n = 15, run0 = Math.abs(xEnd - ex) || 1;
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1), x = ex + dir * run0 * f + (rand() - 0.5) * 6, on = 1050 + 520 * f + rand() * 40;
    h.flicker(k.picIn(i % 2 ? 'flame' : 'flame2', [x, by + 4], 15 + rand() * 6, 28 + rand() * 18, { base: true }), on, 2350 + rand() * 350, dir * 6);
    if (i % 2 === 0) h.flicker(k.picIn(i % 4 ? 'flame2' : 'flame', [x + dir * 5, by + 5], 11 + rand() * 4, 18 + rand() * 10, { base: true }), on + 90, 2200 + rand() * 300, dir * 8);
  }
  // billows and a travelling light roll out along an arc to T (on the overlay: T may be on another card)
  const M = [ex, ey + 4], bz = h.arcPath(M, T, 12);
  h.fly(k.light('g-warm', M, 34), M, bz, 1050, 1600, (f) => 0.9 + 0.5 * f, (f) => (f > 0.97 ? 0.4 : 1));
  for (let i = 0; i < 20; i++) {
    const t0 = 1040 + i * 30, t1 = 1570 + i * 18, id = i % 3, side = (rand() - 0.5) * 12, r = Math.round(rand() * 360);
    const bz2 = (f) => { const p = bz(f); return [p[0], p[1] + side * Math.sin(Math.PI * f)]; };
    h.fly(k.pic(['puff', 'puffHot', 'puffCool'][id], M, 18, 18), M, bz2, t0, t1, (f) => 0.6 + 1.0 * f, (f) => (f < 0.08 ? f * 11 : f > 0.94 ? 0.2 : 0.9), r, 120);
  }
  for (let i = 0; i < 8; i++) {
    const t0 = 1080 + i * 55, t1 = 1560 + i * 25;
    h.fly(k.pic(i % 2 ? 'flame' : 'flame2', M, 9, 16, { base: true }), M, (f) => { const p = bz(f); return [p[0], p[1] + (i - 3.5) * 2]; }, t0, t1, (f) => 0.8 + 0.5 * f, (f) => (f > 0.9 ? 0.2 : 0.9), (i - 3.5) * 5, 20);
  }
  h.burst(T, 1600, { size: 1.3, flames: 6, linger: 900 });
}
