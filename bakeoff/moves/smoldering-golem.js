// Smoldering Golem: the stacked stones heave a great breath, steam hissing from every seam, the seams
// swelling white, both fists hauled overhead; then it slams them down. The floor cracks, and a wall of fire
// races over it to its target and bursts there.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker (as suggested: 3 Power, and its dying
// breath deals damage), element fire (as suggested: hot stone, flame). Facing front.
//   200-900   gather: it stretches up on its feet, the arms rising overhead one stone after the other, the
//             head tipped back; its seams heat (the torso's light swelling), steam jetting from the seams in
//             faster and faster puffs, embers lifting off.
//   900-1000  the held breath: arms highest, a last shudder.
//   960       the slam begins; at 1080 (RELEASE) the fists strike the floor between its feet: it squashes down,
//             the head nodding, a flash and sparks at the fists, a flat ring and dust, a crack racing over the
//             floor, and a wall of flame set running from the fists toward T (billows and flames standing up
//             in turn along the floor).
//   1500      IMPACT at T: flash, rings, rays, sparks, flames catch.
//   1200-3400 it rebounds and rocks, the arms swinging up a little and falling home, the vents breathing out
//             a last steam, seams cooling; it settles. At rest as drawn from 3400 (END 3800).
// Aimed: T = k.aim || the floor beyond its right edge. The wave leaves the point between its fists
// (spec.emit) and runs to T; its head turns toward T. Everything running or landing is on the overlay
// (k.pic / k.light), never picIn.
import { SPARK, kit, mul, rot, scl, tr, curve } from './_fx.js';
export const END = 3800;
export const BEATS = { release: 1080, impact: 1500, settle: 3400 };
export const STILLS = [550, 920, 1080, 1180, 1500, 1750, 2500, 3600];
export const textures = {
  spark: SPARK,
  mote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 200 + 50 * c, 120 + 100 * c * c, Math.min(1, c * c * c * 2.4)]; }],
  steam: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 226, 206, Math.min(0.6, c * c * 1.3)]; }],
};

export function build(k) {
  const { fx, rand, u } = k, eio = 'ease-in-out';
  const h = kit(k);
  const S = k.spec, FEET = S.feet, [SL, SR] = S.shoulders, NECK = S.neck, E = S.emit;
  const T = k.aim || [266, 172];
  const dir = T[0] >= E[0] ? 1 : -1;
  const RE = 1080, IM = 1500, A0 = 200;

  // ── its motion over time
  const arm = curve([[0, 0], [A0, 0], [560, 72], [900, 138], [980, 142, 'in'], [1080, -24], [1180, -8], [1500, 7], [2300, 2], [3300, 0]]);
  const body = curve([[0, 1], [A0, 1], [900, 1.045], [980, 1.052, 'in'], [1085, 0.9, 'out'], [1180, 0.95], [1330, 1.018], [1700, 1.002], [3300, 1]]);
  const head = curve([[0, 0], [A0 + 100, 0], [880, -7], [980, -9, 'in'], [1085, 8 * dir], [1250, 5 * dir], [1600, 1 * dir], [3300, 0]]);
  const hdy = curve([[0, 0], [980, -1.2, 'in'], [1085, 2.4], [1300, 0.8], [1800, 0], [3300, 0]]);
  const W0 = (t) => mul(tr(0, body(t) < 1 ? (1 - body(t)) * 18 * -0.5 : 0), scl(1 / Math.sqrt(body(t)), body(t), FEET[0], FEET[1]));
  h.drive(k.part('body'), FEET, W0, 3400);
  h.drive(k.part('cracks'), FEET, W0, 3400);
  h.drive(k.part('legs'), FEET, W0, 3400);
  const WH = (t) => mul(W0(t), mul(tr(0, hdy(t)), rot(head(t), NECK[0], NECK[1])));
  h.drive(k.part('head'), NECK, WH, 3400);
  h.drive(k.part('armL'), SL, (t) => mul(W0(t), rot(arm(t), SL[0], SL[1])), 3400);
  h.drive(k.part('armR'), SR, (t) => mul(W0(t), rot(-arm(t), SR[0], SR[1])), 3400);

  // ── light: its seams heating (the torso), its eyes, the picture's glow
  const pulse = (a, b, lo, hi, sl, sh) => { const l = []; for (let t = a, i = 0; t < b; t += 120, i++) l.push([t, i % 2 ? sh : sl, i % 2 ? hi : lo]); return l; };
  fx(k.lightIn('g-warm', [150, 130], 150, 110), [[A0, { transform: 'scale(.7)', opacity: 0 }, 'ease-out'], [A0 + 300, { transform: 'scale(.85)', opacity: 0.35 }, eio],
    ...pulse(A0 + 450, 960, 0.5, 0.8, 0.95, 1.08).map(([t, s, o]) => [t, { transform: `scale(${s})`, opacity: o }, eio]),
    [1090, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [IM, { transform: 'scale(1.15)', opacity: 0.7 }, eio], [2300, { transform: 'scale(.95)', opacity: 0.3 }, eio], [3200, { transform: 'scale(.8)', opacity: 0 }]]);
  h.ride(k.light('g-warm', [151, 90], 22), [151, 90], WH, [[A0 + 200, 0.5, 0], [800, 1.1, 0.6], [1000, 1.4, 0.85], [1090, 1.9, 1], [1500, 1.3, 0.6], [2400, 0.9, 0.25], [3100, 0.6, 0]]);
  fx(k.lightIn('g-city', [150, 140], 300, 150), [[RE - 100, { opacity: 0 }, 'ease-out'], [RE + 200, { opacity: 0.55 }, eio], [IM + 100, { opacity: 0.85 }, eio], [2400, { opacity: 0.3 }, eio], [3200, { opacity: 0 }]]);

  // ── steam jetting from the seams, faster and faster (and one great hiss at the slam)
  const vents = [[146, 82, -3], [124, 92, -4], [178, 92, 4], [106, 140, -3], [194, 140, 3], [150, 150, 1]];
  for (let n = 0, t = A0 + 100; t < 1060; n++, t += Math.max(55, 210 - n * 12)) {
    const [x, y, dx] = vents[n % vents.length], r = Math.round(rand() * 360), life = 700 + rand() * 300;
    const p = (f, o) => ({ transform: `${k.T(dx * f * 2 + (rand() - 0.5) * 2, -22 * f - 4 * f * f)} rotate(${(r + f * 30).toFixed(0)}deg) scale(${(0.5 + 1.3 * f).toFixed(2)})`, opacity: o });
    fx(k.picIn('steam', [x, y], 14, 14, { lit: false }), [[t, p(0, 0), 'ease-out'], [t + life * 0.25, p(0.25, 0.55 + 0.2 * n / 12), 'linear'], [t + life, p(1, 0)]]);
  }
  for (let i = 0; i < 10; i++) {
    const [x, y, dx] = vents[i % vents.length], t = RE + 10 + i * 40, r = Math.round(rand() * 360), side = (x - 150) * 0.25 + dx;
    fx(k.picIn('steam', [x, y], 18, 18, { lit: false }), [[t, { transform: `rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 160, { transform: `${k.T(side * 2, -12)} rotate(${r + 20}deg) scale(1.3)`, opacity: 0.6 }], [t + 1200, { transform: `${k.T(side * 4, -42)} rotate(${r + 60}deg) scale(2.4)`, opacity: 0 }]]);
  }
  // a last breath of steam as it settles
  for (let i = 0; i < 6; i++) {
    const [x, y, dx] = vents[i], t = 1900 + i * 110 + rand() * 60, r = Math.round(rand() * 360);
    fx(k.picIn('steam', [x, y], 14, 14, { lit: false }), [[t, { transform: `rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 300, { transform: `${k.T(dx, -10)} rotate(${r + 20}deg) scale(1)`, opacity: 0.4 }], [t + 1300, { transform: `${k.T(dx * 2, -34)} rotate(${r + 40}deg) scale(1.9)`, opacity: 0 }]]);
  }
  // embers lifting off it while it gathers
  for (let i = 0; i < 14; i++) {
    const x = 110 + rand() * 80, y = 100 + rand() * 70, t = A0 + 200 + i * 55 + rand() * 40, sz = 2.5 + rand() * 3;
    fx(k.picIn(i % 2 ? 'mote' : 'spark', [x, y], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 150, { transform: 'scale(1)', opacity: 1 }], [t + 900 + rand() * 400, { transform: `${k.T((rand() - 0.5) * 12, -30 - rand() * 28)} scale(.25)`, opacity: 0 }]]);
  }

  // ── the slam (RELEASE): a flash and sparks at each fist, a flat ring, dust, the floor cracking
  for (const x of [122, 178]) {
    fx(k.pic('spark', [x, 174], 24, 24), [[RE - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [RE + 20, { transform: 'scale(1.8) rotate(20deg)', opacity: 1 }, 'ease-out'], [RE + 260, { transform: 'scale(.6) rotate(60deg)', opacity: 0 }]]);
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI * (0.1 + rand() * 0.8), v = 16 + rand() * 26, t = RE - 10 + rand() * 30, sz = 3 + rand() * 3, life = 420 + rand() * 300;
      const at = (f, o) => ({ transform: `${k.T(Math.cos(a) * v * f, Math.sin(a) * v * f + 42 * f * f)} scale(${(1 - 0.7 * f).toFixed(2)})`, opacity: o });
      fx(k.pic('spark', [x, 174], sz, sz), [[t, at(0, 0), 'ease-out'], [t + 50, at(0.1, 1), 'linear'], [t + life * 0.5, at(0.5, 0.9), 'linear'], [t + life, at(1, 0)]]);
    }
  }
  fx(k.light('g-warm', [150, 176], 90), [[RE - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [RE + 50, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [RE + 500, { transform: 'scale(1.3)', opacity: 0.4 }, eio], [RE + 1100, { transform: 'scale(.9)', opacity: 0 }]]);
  for (const [dt, a, b] of [[0, 0.15, 1.2], [110, 0.1, 0.9]]) fx(k.pic(h.ring, [150, 186], 110, 110, { low: true }), [[RE + dt, { transform: 'scale(.12, .035)', opacity: 0 }, 'ease-out'], [RE + dt + 60, { transform: `scale(${a * 3}, ${a * 0.9})`, opacity: 0.9 }, 'ease-out'], [RE + dt + 560, { transform: `scale(${b}, ${b * 0.25})`, opacity: 0 }]]);
  for (let i = 0; i < 6; i++) {
    const side = i % 2 ? 1 : -1, t = RE + 20 + (i >> 1) * 60, r = Math.round(rand() * 360);
    fx(k.pic('smoke', [150 + side * (20 + rand() * 14), 188], 24, 24, { lit: false, low: true }), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 260, { transform: `${k.T(side * 12, -4)} rotate(${r + 20}deg) scale(1)`, opacity: 0.4 }], [t + 1000, { transform: `${k.T(side * 28, -10)} rotate(${r + 40}deg) scale(1.8)`, opacity: 0 }]]);
  }
  // the floor splits: a crack racing out toward T, and a shorter one the other way
  const crack = k.svg('<defs><filter id="b" x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur stdDeviation="1.3"/></filter></defs>' +
    '<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M0,8L24,5L40,10L62,6L80,11L102,7L120,10L140,6L148,9" stroke="#ff6a1f" stroke-width="5" filter="url(#b)"/><path d="M0,8L24,5L40,10L62,6L80,11L102,7L120,10L140,6L148,9" stroke="#ffe08a" stroke-width="1.6"/><path d="M40,10L34,15M102,7L96,12" stroke="#ffd88a" stroke-width="1"/></g>', 148, 20);
  for (const [d, len, t0, t1] of [[dir, Math.min(140, Math.abs((dir > 0 ? 296 : 4) - 150)), 40, 460], [-dir, 120, 60, 380]]) {
    const xe = 150 + d * len, L = len, cx = (150 + xe) / 2;
    const cr = (s, o) => ({ transform: `translate(${((150 - cx) * (1 - s) * u).toFixed(1)}px, 0px) scale(${(d > 0 ? s : -s).toFixed(3)}, 1)`, opacity: o });
    fx(k.picIn(crack, [cx, 194], L, 14, { lit: false }), [[RE + t0 - 40, cr(0.02, 0), 'ease-out'], [RE + t0, cr(0.1, 1), 'ease-out'], [RE + t1, cr(1, 1), eio], [IM + 500, cr(1, 0.8), eio], [2500, cr(1, 0.25), eio], [3200, cr(1, 0)]]);
  }

  // ── the wall of fire (RELEASE to IMPACT): billows along the floor to T, flames standing up in turn
  const dx = T[0] - E[0], dy = T[1] - E[1], bz = h.arcPath(E, T, 6 + Math.min(24, Math.hypot(dx, dy) * 0.1));
  for (let i = 0; i < 22; i++) {
    const t0 = RE + 10 + i * 12, t1 = IM + 10 + i * 5, id = i % 3, sz = [20, 6, 15][id], side = (rand() - 0.5) * 6;
    const bz2 = (f) => { const p = bz(f); return [p[0], p[1] + side * Math.sin(Math.PI * f)]; };
    h.fly(k.pic(['puffHot', 'spark', 'puff'][id], E, sz, sz), E, bz2, t0, t1, (f) => (id === 1 ? 1.2 - 0.4 * f : 0.6 + 0.8 * f), (f) => (f < 0.1 ? f * 9 : f > 0.94 ? 0.2 : 0.9), Math.round(rand() * 360), 100, 40, (f) => f * 0.9 + 0.1 * f * f);
  }
  for (let i = 0; i < 10; i++) {
    const f = (i + 0.5) / 10, p = bz(f * 0.97), on = RE + 40 + f * (IM - RE - 60);
    h.flicker(k.pic(i % 2 ? 'flame' : 'flame2', [p[0], p[1] + 5], 10 + rand() * 3, 16 + rand() * 9, { base: true }), on, on + 420 + rand() * 260, dir * 6);
  }

  // ── it lands (IMPACT)
  h.burst(T, IM, { size: 1, flames: 5, linger: 800 });
  const rays = k.svg('<defs><radialGradient id="r" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbe8"/><stop offset="1" stop-color="#ffb04a" stop-opacity="0"/></radialGradient></defs>' +
    Array.from({ length: 8 }, (_, i) => `<path d="M50,50 L${(50 + 48 * Math.cos((i * Math.PI) / 4 - 0.07)).toFixed(1)},${(50 + 48 * Math.sin((i * Math.PI) / 4 - 0.07)).toFixed(1)} L${(50 + 48 * Math.cos((i * Math.PI) / 4 + 0.07)).toFixed(1)},${(50 + 48 * Math.sin((i * Math.PI) / 4 + 0.07)).toFixed(1)}Z" fill="url(#r)"/>`).join(''), 100, 100);
  fx(k.pic(rays, T, 56, 56), [[IM - 10, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [IM + 90, { transform: 'scale(.95) rotate(10deg)', opacity: 0.95 }, 'ease-out'], [IM + 680, { transform: 'scale(1.35) rotate(36deg)', opacity: 0 }]]);
}
