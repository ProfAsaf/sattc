// Ash Collector: the sweeper flings a wave of glowing ash.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker, element fire (changed
// from the suggested light: what he throws is embers and hot ash, not light).
//   0-450     if his target is on his right he turns on the spot (a flip through a sliver);
//             the lantern begins to swell and sway.
//   450-1150  gather: he crouches and draws the broom back under him; the lantern flares
//             and sparks stream down from it to the besom's head, which heats to a glow.
//   1200      RELEASE: he lunges toward T and sweeps the broom through; the ash leaves its head.
//   1200-1600 a long low wave of ash, embers and smoke flies an arc to T.
//   1600      IMPACT at T: flash, rings, billows and sparks flung, flames catch, smoke
//             rises, a scorch is left.
//   1600-3300 follow-through: the broom lifts and swings back, he rocks back from the
//             effort and settles; the lantern swings like a pendulum and dies down;
//             if he turned, he turns back. At rest as drawn from 3300 (END 3700).
// Aimed: T = k.aim || [34, 170]. Everything is worked in his own (left-facing) space and
// mirrored as a whole when T is on his right, so every point of the stream comes from his
// besom head (spec.emit, carried by the same transforms) to T.
import { SPARK, ID, mul, rot, scl, tr, app, curve, kit } from './_fx.js';
export const END = 3700;
export const BEATS = { release: 1200, impact: 1600, settle: 3300 };
export const STILLS = [300, 800, 1150, 1300, 1600, 1900, 2700, 3500];
export const textures = { spark: SPARK };

export function build(k) {
  const { fx, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const body = k.part('body'), sweep = k.part('sweep'), lantern = k.part('lantern');
  const [fx0, fy0] = k.spec.feet, SH = k.spec.shoulder, TIP = k.spec.tip, LAMP = k.spec.lamp, E = k.spec.emit;
  const T = k.aim || [34, 170];
  const mirrored = T[0] > fx0 + 10;

  // ── how he moves, in his own space (target to the left); a mirror over everything flips him to face a target on the right
  const flip = mirrored ? curve([[0, 1], [420, -1], [2780, -1], [3200, 1]]) : () => 1;
  const MIR = (t) => { const v = flip(t); return scl(Math.sign(v || 1) * Math.max(0.06, Math.abs(v)), 1, fx0, 0); };
  const lean = curve([[0, 0], [450, -3], [1000, -5.5], [1180, -6, 'in'], [1330, 8, 'out'], [1500, 5], [1800, -2.5], [2300, 1], [3000, 0]]); // degrees toward the target
  const hop = curve([[0, 0], [1000, 2], [1180, 2, 'in'], [1330, -5, 'out'], [1700, -3], [2400, 0.5], [3000, 0]]);
  const squash = curve([[0, 1], [450, 0.97], [1000, 0.955], [1180, 0.955, 'in'], [1330, 1.02, 'out'], [1700, 0.99], [2200, 1], [3000, 1]]);
  const psi = curve([[0, 0], [500, -4], [1000, -20], [1160, -22, 'in'], [1330, 26, 'out'], [1500, 30], [1850, 12], [2400, -3], [3000, 0]]); // the broom, about his shoulder
  const pend = (t) => { // the lantern's swing about the pole's tip: kicked by the lunge, then by the recoil
    let a = 0;
    for (const [t0, A] of [[250, 3], [1150, -15], [1700, 9]]) if (t > t0) a += A * Math.exp(-(t - t0) / 430) * Math.sin(((t - t0) * 2 * Math.PI) / 740);
    return a;
  };
  const BODY = (t) => mul(tr(hop(t), 0), mul(rot(-lean(t), fx0, fy0), scl(1, squash(t), fx0, fy0)));
  const WB = (t) => mul(MIR(t), BODY(t));
  const WS = (t) => mul(WB(t), rot(psi(t), SH[0], SH[1]));
  const WL = (t) => mul(WB(t), rot(pend(t), TIP[0], TIP[1]));
  h.drive(body, [fx0, fy0], WB, 3300);
  h.drive(sweep, SH, WS, 3300);
  h.drive(lantern, TIP, WL, 3300);

  // ── light: the lantern swells and flares; the besom heats; the ground takes the glow
  h.ride(k.light('g-warm', LAMP, 52), LAMP, WL, [[150, 0.8, 0], [600, 1.1, 0.7], [1000, 1.3, 0.95], [1200, 1.7, 1], [1700, 1.2, 0.8], [2500, 0.9, 0.3], [3300, 0.8, 0]]);
  h.ride(k.light('g-ember', E, 30), E, WS, [[500, 0.3, 0], [900, 0.8, 0.6], [1160, 1, 0.9], [1300, 1.4, 1], [1800, 0.9, 0.5], [2400, 0.6, 0]]);
  fx(k.lightIn('g-city', [150, 165], 300, 100, { under: true }), [[200, { opacity: 0 }, 'ease-out'], [1100, { opacity: 0.4 }, eio], [1500, { opacity: 0.6 }, eio], [2500, { opacity: 0.15 }], [3300, { opacity: 0 }]]);

  // ── gathering: sparks run down from the lantern to the besom's head
  for (let i = 0; i < 9; i++) {
    const t0 = 640 + i * 60 + rand() * 30, dur = 380 + rand() * 90, off = (rand() - 0.5) * 8, sz = 3.5 + rand() * 2.5, ks = [];
    for (let t = t0; t <= t0 + dur + 1; t += 50) {
      const f = Math.min(1, (t - t0) / dur), a = app(WL(t), LAMP), b = app(WS(t), E), g = f * f * (3 - 2 * f);
      ks.push([Math.min(t, t0 + dur), { transform: `${k.T(a[0] + (b[0] - a[0]) * g + off * Math.sin(Math.PI * f) - LAMP[0], a[1] + (b[1] - a[1]) * g - 7 * Math.sin(Math.PI * f) - LAMP[1])} scale(${(0.5 + 0.6 * Math.sin(Math.PI * f)).toFixed(2)})`, opacity: f > 0.96 ? 0 : f < 0.08 ? f * 10 : 1 }, 'linear']);
    }
    fx(k.pic('spark', LAMP, sz, sz), ks);
  }

  // ── the sweep (1200): ash lifted off the ground and thrown, an arc from the besom's head to T
  const M = app(WS(1270), E), bz = h.arcPath(M, T, 18);
  const kick = app(WS(1280), E);
  for (let i = 0; i < 16; i++) { // dust and embers kicked up where the besom scrapes
    const t = 1190 + i * 22 + rand() * 20, ang = rand() * Math.PI, v = 8 + rand() * 16, p = app(WS(Math.min(t, 1400)), E);
    fx(k.pic(i % 3 ? 'spark' : 'smoke', p, i % 3 ? 4 : 14, i % 3 ? 4 : 14, i % 3 ? {} : { lit: false, low: true }), [[t, { transform: `${k.T(0, 0)} scale(.5)`, opacity: 0 }, 'ease-out'],
      [t + 100, { transform: `${k.T(Math.cos(ang) * v * 0.5 * (mirrored ? 1 : -1), -Math.sin(ang) * v * 0.7)} scale(1)`, opacity: i % 3 ? 1 : 0.5 }], [t + 520, { transform: `${k.T(Math.cos(ang) * v * (mirrored ? 1 : -1), -Math.sin(ang) * v * 0.4 + 6)} scale(${i % 3 ? 0.2 : 1.7})`, opacity: 0 }]]);
  }
  void kick;
  for (let i = 0; i < 24; i++) { // the wave: hot embers, glowing billows and heavy ash, in a long loose ribbon
    const t0 = 1220 + i * 30, t1 = 1540 + i * 22, id = i % 4, sz = [24, 6, 20, 18][id], side = (rand() - 0.5) * 10, r = Math.round(rand() * 360);
    const bz2 = (f) => { const p = bz(f); return [p[0], p[1] + side * Math.sin(Math.PI * f)]; };
    h.fly(k.pic(['smoke', 'spark', 'puffHot', 'puff'][id], M, sz, sz, id === 0 ? { lit: false } : {}), M, bz2, t0, t1, (f) => (id === 1 ? 1.3 - 0.5 * f : 0.6 + 1.0 * f), (f) => (f < 0.1 ? f * 9 : f > 0.94 ? 0.2 : id === 0 ? 0.7 : 0.95), r, 120);
  }

  // ── the strike (1600), with a scorch of ash left where it lands
  h.burst(T, 1600, { flames: 4, linger: 900 });
  const sc = ((rand() - 0.5) * 16).toFixed(1), gl = [[1640, { transform: `rotate(${sc}deg) scale(.15, .07)`, opacity: 0 }, 'ease-out'], [2200, { transform: `rotate(${sc}deg) scale(1, .45)`, opacity: 0.95 }]];
  for (let t = 2350, i = 0; t < 3000; t += 150, i++) gl.push([t, { transform: `rotate(${sc}deg) scale(1, .45)`, opacity: i % 2 ? 1 : 0.7 }, eio]);
  gl.push([3350, { transform: `rotate(${sc}deg) scale(1, .45)`, opacity: 0 }]);
  fx(k.pic('scorch2:char', [T[0], T[1] + 8], 46, 46, { lit: false, low: true }), [[1640, { transform: `rotate(${sc}deg) scale(.15, .07)`, opacity: 0 }, 'ease-out'], [2200, { transform: `rotate(${sc}deg) scale(1, .45)`, opacity: 1 }], [3000, { transform: `rotate(${sc}deg) scale(1, .45)`, opacity: 1 }, eio], [3500, { transform: `rotate(${sc}deg) scale(1, .45)`, opacity: 0 }]]);
  fx(k.pic('scorch2:glow', [T[0], T[1] + 8], 46, 46), gl);

  // ── embers popping off the besom and his coat after the swing, drifting up
  for (let i = 0; i < 8; i++) {
    const t = 1800 + i * 130 + rand() * 60, p0 = [100 + rand() * 60, 130 + rand() * 50];
    fx(k.pic('spark', p0, 4, 4), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 90, { transform: 'scale(1)', opacity: 1 }], [t + 700, { transform: `${k.T((rand() - 0.5) * 14, -20 - rand() * 12)} scale(.25)`, opacity: 0 }]]);
  }
  void ID;
}
