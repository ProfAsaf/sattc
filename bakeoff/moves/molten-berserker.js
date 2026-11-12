// Molten Berserker: the brute coils, its seams flaring white, hauls its front fist up and back, then lunges
// into the blow: the fist comes down in a hail of molten drops, the ground splits under it, and the blow
// goes to its target in a hurled burst of lava that bursts there.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker (as suggested: 5 Power, can't block),
// element fire (as suggested: magma). Facing left.
//   0-520      (only if T lies behind it: it turns round through a sliver, mirrored about its hips.)
//   100-950    gather: it crouches and leans back, the fist hauled up and back, its seams heating (the chest
//              light swelling), molten drops dripping off the raised fist, embers drawn in from its chest.
//   950-1000   the held breath: furthest back.
//   1000       RELEASE: it lunges, the arm swinging down through the blow to point at T, the fist flaring white;
//              a hail of billows and drops hurled off the fist along an arc to T; a crack races over the
//              ground; dust kicks up.
//   1380       IMPACT at T: flash, rings, sparks, drops raining, flames catch.
//   1500-3400  it rocks back from the blow, the arm drawn home, seams cooling, the crack dimming; it settles.
//              At rest as drawn from 3400 (END 3800).
// Aimed: T = k.aim || a foe just beyond its left edge. The arm swings to point at T (a little down to a
// little up); if T lies to its right it mirrors. Everything flung or landing is on the overlay (k.pic / k.light).
import { SPARK, kit, mul, rot, scl, tr, app, curve } from './_fx.js';
export const END = 3800;
export const BEATS = { release: 1000, impact: 1380, settle: 3400 };
export const STILLS = [500, 900, 1080, 1250, 1400, 1650, 2400, 3600];
export const textures = {
  spark: SPARK,
  mote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 190 + 55 * c, 110 + 110 * c * c, Math.min(1, c * c * c * 2.4)]; }],
};

export function build(k) {
  const { fx, rand, u } = k, eio = 'ease-in-out';
  const h = kit(k);
  const S = k.spec, HIPS = S.hips, SH = S.shoulder, FIST = S.emit;
  const T = k.aim || [20, 98];
  const m = T[0] > HIPS[0] + 20 ? -1 : 1;
  const X = (x) => (m < 0 ? 2 * HIPS[0] - x : x), Pm = ([x, y]) => [X(x), y];
  const RE = 1000, IM = 1380, A0 = m > 0 ? 100 : 560;
  const Tm = Pm(T);
  const rest = Math.atan2(FIST[1] - SH[1], FIST[0] - SH[0]);
  let aim = (((Math.atan2(Tm[1] - SH[1], Tm[0] - SH[0]) - rest) * 180) / Math.PI + 540) % 360 - 180;
  aim = Math.max(-35, Math.min(22, aim));

  // ── its pose over time (its own frame, facing left): [ms, shift back (+x), drop, lean back (cw), arm raise (cw about the shoulder), arm reach]
  const pose = [[0, 0, 0, 0, 0, 1], [A0, 0, 0, 0, 0, 1], [A0 + 450, 3, 2.2, 4.2, 30, 1], [900, 6.5, 4, 8, 66, 1], [RE - 15, 7, 4.2, 8.6, 70, 1],
    [RE + 130, -9, -1.2, -7.5, aim - 4, 1.06], [IM, -7.5, -0.8, -6, aim, 1.04], [IM + 160, -10, -2.4, -9.5, aim - 6, 1.07], [1800, -4.2, -1.6, -3, aim * 0.5, 1.03], [2500, -1.2, -0.3, -0.8, 5, 1], [3300, 0, 0, 0, 0, 1]];
  const ease = (i) => (i <= 1 ? undefined : i < 4 ? 'in' : i === 4 ? 'out' : undefined);
  const col = (c) => curve(pose.map((p, i) => [p[0], p[c], i === 3 ? 'lin' : ease(i)]));
  const px = col(1), py = col(2), lean = col(3), raise = col(4), reach = col(5);
  const sx = curve(m > 0 ? [[0, 1]] : [[0, 1, 'in'], [260, 0.06], [520, -1], [2900, -1], [3100, 0.06], [3350, 1]]);
  const outer = (t) => scl(sx(t), 1, HIPS[0], HIPS[1]);
  const local = (t) => mul(tr(px(t), py(t)), rot(lean(t), HIPS[0], HIPS[1] + 6));
  const WB = (t) => mul(outer(t), local(t));
  const WA = (t) => mul(outer(t), mul(local(t), mul(rot(raise(t), SH[0], SH[1]), scl(reach(t), reach(t), SH[0], SH[1]))));
  h.drive(k.part('body'), HIPS, WB, 3400);
  h.drive(k.part('eyes'), HIPS, WB, 3400);
  h.drive(k.part('arm'), SH, WA, 3400);
  h.drive(k.part('fistfx'), SH, WA, 3400);

  const E = app(WA(RE + 130), FIST), dir = T[0] >= E[0] ? 1 : -1;
  const x0 = X(104), ground = 188;

  // ── light: the fist heating (riding the arm), the seams of its chest swelling, the picture's glow
  const pulse = (a, b, lo, hi) => { const l = []; for (let t = a, i = 0; t < b; t += 120, i++) l.push([t, 1 + (i % 2 ? 0.1 : -0.06), i % 2 ? hi : lo]); return l; };
  h.ride(k.light('g-warm', FIST, 40), FIST, WA, [[A0, 0.5, 0], [A0 + 250, 0.8, 0.3], ...pulse(A0 + 400, 950, 0.45, 0.75).map(([t, s, o]) => [t, s * (0.8 + (t / 950) * 0.6), o]),
    [RE + 60, 2.2, 1], [IM, 1.7, 0.85], [IM + 400, 1.2, 0.5], [2400, 0.9, 0.25], [3100, 0.6, 0]]);
  const chest = Pm([158, 100]);
  fx(k.lightIn('g-warm', chest, 120, 70), [[A0, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [A0 + 500, { transform: 'scale(.9)', opacity: 0.45 }, eio], [940, { transform: 'scale(1.15)', opacity: 0.75 }, eio],
    [RE + 120, { transform: 'scale(1.25)', opacity: 0.95 }, 'ease-out'], [IM + 300, { transform: 'scale(1.1)', opacity: 0.6 }, eio], [2400, { transform: 'scale(.95)', opacity: 0.25 }, eio], [3200, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.lightIn('g-city', [150, 120], 300, 160), [[RE - 60, { opacity: 0 }, 'ease-out'], [RE + 250, { opacity: 0.55 }, eio], [IM + 100, { opacity: 0.9 }, eio], [2300, { opacity: 0.3 }, eio], [3100, { opacity: 0 }]]);

  // ── molten drops dripping off the raised fist (in its drawn frame: ride the fist, fall under gravity)
  for (let i = 0; i < 9; i++) {
    const t = A0 + 500 + i * 55 + rand() * 30, sz = 3 + rand() * 3, dx = (rand() - 0.5) * 8, life = 520 + rand() * 200, f0 = app(WA(Math.min(t, 960)), [FIST[0] - 4 + (rand() - 0.5) * 12, FIST[1] + 8]);
    const fall = (f) => ({ transform: `${k.T(dx * f * 0.4, 38 * f * f + 3 * f)} scale(${(1 - 0.5 * f).toFixed(2)})`, opacity: f < 0.1 ? f * 9 : f > 0.85 ? 0 : 1 });
    fx(k.pic(i % 2 ? 'spark' : 'mote', f0, sz, sz), [[t, fall(0), 'ease-out'], [t + life * 0.3, fall(0.3), 'linear'], [t + life * 0.65, fall(0.65), 'linear'], [t + life, fall(1)]]);
  }
  // embers drawn in from its chest to the fist while it gathers
  const c0 = chest, f1 = Pm([FIST[0] + 12, FIST[1] + 4]), arcC = h.arcPath(c0, f1, 26);
  for (let i = 0; i < 14; i++) {
    const t0 = A0 + 100 + i * 48 + rand() * 30, dur = 420 + rand() * 120, sz = 3 + rand() * 3, side = (rand() - 0.5) * 10;
    h.fly(k.pic(i % 3 ? 'mote' : 'spark', c0, sz, sz), c0, (f) => { const p = arcC(f); return [p[0], p[1] + side * Math.sin(Math.PI * f)]; }, t0, t0 + dur,
      (f) => 0.5 + 0.9 * Math.sin(Math.PI * f), (f) => (f < 0.12 ? f * 8 : f > 0.92 ? 0 : 1), 0, 0, 40, (f) => f * f * 0.4 + f * 0.6);
  }

  // ── the ground splits under the lunge: a glowing crack racing out, and dust
  const crack = k.svg('<defs><filter id="b" x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur stdDeviation="1.3"/></filter></defs>' +
    '<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M148,8L120,5L104,10L84,6L66,11L48,7L30,10L12,6L0,9" stroke="#ff6a1f" stroke-width="5" filter="url(#b)"/><path d="M148,8L120,5L104,10L84,6L66,11L48,7L30,10L12,6L0,9" stroke="#ffe08a" stroke-width="1.6"/><path d="M104,10L98,15M66,11L60,15M30,10L24,14" stroke="#ffd88a" stroke-width="1"/></g>', 148, 20);
  const xe = dir < 0 ? 8 : 292, L = Math.abs(xe - x0) + 4, cx = (x0 + xe) / 2, cr = (s, o) => ({ transform: `translate(${((x0 - cx) * (1 - s) * u).toFixed(1)}px, 0px) scale(${(dir < 0 ? s : -s).toFixed(3)}, 1)`, opacity: o });
  fx(k.picIn(crack, [cx, ground + 6], L, 14, { lit: false }), [[RE + 40, cr(0.02, 0), 'ease-out'], [RE + 90, cr(0.08, 1), 'ease-out'], [RE + 420, cr(1, 1), eio], [IM + 600, cr(1, 0.8), eio], [2400, cr(1, 0.25), eio], [3100, cr(1, 0)]]);
  for (let i = 0; i < 4; i++) {
    const t = RE + 40 + i * 70, p = [X(98 + i * 9), 188], r = Math.round(rand() * 360);
    fx(k.pic('smoke', p, 22, 22, { lit: false, low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 220, { transform: `${k.T(dir * 6, -4)} rotate(${r + 20}deg) scale(1)`, opacity: 0.4 }], [t + 900, { transform: `${k.T(dir * 14, -9)} rotate(${r + 40}deg) scale(1.7)`, opacity: 0 }]]);
  }

  // ── the blow, hurled (RELEASE to IMPACT): billows, big blobs and sparks of lava off the fist along an arc to T
  const bz = h.arcPath(E, T, 14 + Math.min(26, Math.hypot(T[0] - E[0], T[1] - E[1]) * 0.14));
  for (let i = 0; i < 24; i++) {
    const t0 = RE + 4 + i * 12, t1 = IM + 10 + i * 5, id = i % 4, sz = [20, 5, 15, 5][id], side = (rand() - 0.5) * 9;
    const bz2 = (f) => { const p = bz(f); return [p[0], p[1] + side * Math.sin(Math.PI * f) + 14 * f * f * (id === 3 ? 1 : 0)]; };
    h.fly(k.pic(['puffHot', 'spark', 'puff', 'mote'][id], E, sz, sz), E, bz2, t0, t1, (f) => (id === 1 || id === 3 ? 1.2 - 0.4 * f : 0.6 + 0.8 * f), (f) => (f < 0.1 ? f * 9 : f > 0.94 ? 0.2 : 0.92), Math.round(rand() * 360), 120, 40, (f) => f * f * 0.5 + f * 0.5);
  }
  fx(k.pic('spark', E, 28, 28), [[RE - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [RE + 50, { transform: 'scale(2) rotate(25deg)', opacity: 1 }, 'ease-out'], [RE + 320, { transform: 'scale(.6) rotate(70deg)', opacity: 0 }]]);

  // ── it lands (IMPACT): a burst of lava, and drops raining down round T
  h.burst(T, IM, { size: 1.1, flames: 5, linger: 800 });
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI * (0.1 + rand() * 0.8), v = 18 + rand() * 26, t = IM + 20 + rand() * 80, sz = 4 + rand() * 4, life = 700 + rand() * 300;
    const at = (f, o) => ({ transform: `${k.T(Math.cos(a) * v * f, Math.sin(a) * v * f * 1.4 + 55 * f * f)} scale(${(1 - 0.4 * f).toFixed(2)})`, opacity: o });
    fx(k.pic('puffHot', T, sz, sz), [[t, at(0, 0), 'ease-out'], [t + 60, at(0.1, 1), 'linear'], [t + life * 0.5, at(0.5, 0.95), 'linear'], [t + life, at(1, 0)]]);
  }
}
