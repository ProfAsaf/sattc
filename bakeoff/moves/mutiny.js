// Mutiny: the soldier turns his burning spear back on his own army. His eyes burn ember-red; he draws
// the spear back, his will pouring into its head, and thrusts: a command of fire streaks out and the eyes
// of whoever it strikes flare ember-red, theirs no longer.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support (as suggested: a boon, control of an enemy
// creature), element fire (as suggested: ember-red eyes, the burning spear). Facing left.
//   0-520      (only if T lies behind him: he turns round through a sliver, mirrored about his hips.)
//   100-950    gather: his eye swells red and embers stream from it down the arm into the spear's head, which
//              swells and flickers; he draws the spear back, tip raised, leaning away, the cloak after him.
//   950-1000   the held breath: furthest back.
//   1000       RELEASE: he lunges, the spear thrust level at T, the head flaring white; a command of fire
//              (billows, sparks) streams off it along an arc to T; dust kicks up at his feet, the cloak
//              streams out behind.
//   1500       IMPACT at T: flash, rings, rays, sparks, a burst of ember-red; two red eyes flare there and burn
//              (the control), the picture beyond catching the light.
//   1650-3400  he recoils and withdraws, the spear lowering to rest, flame and eye dying down; the red eyes
//              at T burn on a while and fade; he settles. At rest as drawn from 3400 (END 3800).
// Aimed: T = k.aim || a soldier of the army at his left (spear levelled at them). The spear turns about
// his front hand to point at T (at most 40 degrees off level); if T lies to his right he mirrors. Everything
// flung or landing is on the overlay (k.pic / k.light).
import { SPARK, kit, mul, rot, scl, tr, app, curve } from './_fx.js';
export const END = 3800;
export const BEATS = { release: 1000, impact: 1500, settle: 3400 };
export const STILLS = [450, 900, 1060, 1300, 1520, 1750, 2500, 3600];
export const textures = {
  spark: SPARK,
  mote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 150 + 90 * c, 70 + 100 * c * c, Math.min(1, c * c * c * 2.4)]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  k.css('.g-redeye { border-radius: 50%; background: radial-gradient(circle, rgba(255,238,200,.95), rgba(255,86,40,.75) 26%, rgba(255,50,20,.28) 52%, rgba(255,30,0,0) 72%); }');
  const S = k.spec, HIPS = S.hips, HAND = S.hand, EYE = S.eye;
  const T = k.aim || [62, 140];
  const m = T[0] > HIPS[0] ? -1 : 1; // he turns about to throw at something behind him
  const X = (x) => (m < 0 ? 2 * HIPS[0] - x : x), Pm = ([x, y]) => [X(x), y];
  const RE = 1000, IM = 1500, A0 = m > 0 ? 100 : 560;
  const Tm = Pm(T);
  // the spear's own turn about his hand, to point at T (in his own, unmirrored frame)
  const rest = Math.atan2(S.emit[1] - HAND[1], S.emit[0] - HAND[0]);
  let aim = (((Math.atan2(Tm[1] - HAND[1], Tm[0] - HAND[0]) - rest) * 180) / Math.PI + 540) % 360 - 180;
  aim = Math.max(-40, Math.min(40, aim));
  const ax = (S.emit[0] - HAND[0]) / Math.hypot(S.emit[0] - HAND[0], S.emit[1] - HAND[1]), ay = (S.emit[1] - HAND[1]) / Math.hypot(S.emit[0] - HAND[0], S.emit[1] - HAND[1]);

  // ── his pose over time (in his own frame, facing left): [ms, shift back (+x), drop, lean back (cw), spear raise (cw), spear slide, cloak]
  const pose = [[0, 0, 0, 0, 0, 0, 0], [A0, 0, 0, 0, 0, 0, 0], [A0 + 480, 1.6, 1.2, 3.2, 9, -3, 3], [900, 3, 2.2, 6.2, 17, -6.5, 7], [RE - 15, 3.2, 2.4, 6.8, 18, -7, 8],
    [RE + 140, -5.5, -1.2, -6.5, aim - 1, 9, -11], [IM, -4, -0.8, -5, aim, 8, -6], [IM + 220, -2.6, -1.6, -2.4, aim * 0.8 + 2, 5.5, -2], [2300, -0.8, -0.2, -0.6, aim * 0.2, 1.8, 1.2], [3300, 0, 0, 0, 0, 0, 0]];
  const ease = (i) => (i === 0 || i === 1 ? undefined : i < 4 ? 'in' : i === 4 ? 'out' : undefined);
  const col = (c) => curve(pose.map((p, i) => [p[0], p[c], i === 3 ? 'lin' : ease(i)]));
  const px = col(1), py = col(2), lean = col(3), raise = col(4), slide = col(5), cl = col(6);
  const sx = curve(m > 0 ? [[0, 1]] : [[0, 1, 'in'], [260, 0.06], [520, -1], [2900, -1], [3100, 0.06], [3350, 1]]);
  const outer = (t) => scl(sx(t), 1, HIPS[0], HIPS[1]);
  const local = (t) => mul(tr(px(t), py(t)), rot(lean(t), HIPS[0], HIPS[1] + 4));
  const WB = (t) => mul(outer(t), local(t));
  const sp = (t) => mul(rot(raise(t), HAND[0], HAND[1]), tr(slide(t) * ax, slide(t) * ay));
  const WS = (t) => mul(outer(t), mul(local(t), sp(t)));
  // the flame swells about the spear's head while it gathers, flares at the release, dies back to its drawn size
  const fs = curve([[0, 1], [A0, 1], [900, 1.45], [RE + 30, 1.9, 'out'], [IM, 1.4], [2300, 1.25], [3000, 1.05], [3400, 1]]);
  const WF = (t) => mul(WS(t), scl(fs(t), fs(t), S.emit[0], S.emit[1]));
  // the cloak lags and streams: turning about his shoulder
  const WC = (t) => mul(outer(t), mul(local(t), rot(cl(t), 210, 92)));
  h.drive(k.part('body'), HIPS, WB, 3400);
  h.drive(k.part('trim'), HIPS, WB, 3400);
  h.drive(k.part('cloak'), HIPS, WC, 3400);
  h.drive(k.part('spear'), HIPS, WS, 3400);
  h.drive(k.part('flame'), HIPS, WF, 3400);

  const tip = (t) => app(WS(t), S.emit);
  const E = tip(RE + 140);
  const dir = T[0] >= E[0] ? 1 : -1;

  // ── light: the spear's head (riding it), his eye, the picture's glow
  const ember = (n, t0, t1, hi) => { const l = []; for (let t = t0, i = 0; t < t1; t += 110, i++) l.push([t, 1 + (i % 2 ? 0.12 : -0.08), hi * (i % 2 ? 1 : 0.82)]); return l; };
  h.ride(k.light('g-warm', S.emit, 34), S.emit, WS, [[A0, 0.4, 0], [A0 + 200, 0.8, 0.35], ...ember(0, A0 + 400, 950, 0.7).map(([t, s, o]) => [t, s * (0.8 + (t / 950) * 0.7), o]), [RE + 30, 2.2, 1], [IM, 1.5, 0.75], [2300, 1.1, 0.4], [3100, 0.7, 0]]);
  h.ride(k.light('g-redeye', EYE, 26), EYE, WB, [[A0 - 60, 0.4, 0], [A0 + 300, 1, 0.55], [900, 1.5, 0.85], [RE + 60, 1.9, 1], [IM, 1.5, 0.8], [2300, 1.1, 0.45], [3100, 0.7, 0]]);
  fx(k.lightIn('g-city', [150, 110], 300, 190), [[RE - 60, { opacity: 0 }, 'ease-out'], [RE + 250, { opacity: 0.55 }, eio], [IM + 100, { opacity: 0.85 }, eio], [2300, { opacity: 0.25 }, eio], [3100, { opacity: 0 }]]);

  // ── flames licking at the spear's head as it gathers
  for (let i = 0; i < 4; i++) {
    const t = A0 + 300 + i * 120;
    h.ride(k.pic(i % 2 ? 'flame' : 'flame2', [S.emit[0] + 6 + (i - 1.5) * 4, S.emit[1] + 2], 8 + rand() * 3, 15 + rand() * 7, { base: true }), [S.emit[0] + 6 + (i - 1.5) * 4, S.emit[1] + 2], WS,
      [[t, 0.2, 0], [t + 150, 1, 0.95], [RE + 100, 1.2, 0.9], [RE + 380, 0.3, 0]]);
  }

  // ── his will drawn from his eye down into the spear: embers along an arc
  const eye0 = Pm(EYE), tip0 = Pm(S.emit);
  const arcE = h.arcPath(eye0, [tip0[0] + 8, tip0[1]], 18);
  for (let i = 0; i < 16; i++) {
    const t0 = A0 + 150 + i * 44 + rand() * 30, dur = 420 + rand() * 120, sz = 3 + rand() * 3, side = (rand() - 0.5) * 10;
    h.fly(k.pic(i % 3 ? 'mote' : 'spark', eye0, sz, sz), eye0, (f) => { const p = arcE(f); return [p[0], p[1] + side * Math.sin(Math.PI * f)]; }, t0, t0 + dur,
      (f) => 0.5 + 0.9 * Math.sin(Math.PI * f), (f) => (f < 0.12 ? f * 8 : f > 0.92 ? 0 : 1), 0, 0, 40, (f) => f * f * 0.4 + f * 0.6);
  }

  // ── dust kicked up at his feet by the lunge
  for (let i = 0; i < 4; i++) {
    const t = RE + 40 + i * 60, fx0 = Pm([186 + i * 8, 186]), r = Math.round(rand() * 360);
    fx(k.pic('smoke', fx0, 22, 22, { lit: false, low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 220, { transform: `${k.T(dir * 6, -4)} rotate(${r + 20}deg) scale(1)`, opacity: 0.4 }], [t + 900, { transform: `${k.T(dir * 14, -9)} rotate(${r + 40}deg) scale(1.7)`, opacity: 0 }]]);
  }

  // ── the command (RELEASE to IMPACT): billows of fire and sparks off the spear's head along an arc to T
  const bz = h.arcPath(E, T, 18 + Math.min(26, Math.hypot(T[0] - E[0], T[1] - E[1]) * 0.15));
  for (let i = 0; i < 22; i++) {
    const t0 = RE + 4 + i * 14, t1 = IM + 10 + i * 6, id = i % 3, sz = [18, 5, 14][id], side = (rand() - 0.5) * 7;
    const bz2 = (f) => { const p = bz(f); return [p[0], p[1] + side * Math.sin(Math.PI * f)]; };
    h.fly(k.pic(['puffHot', 'spark', 'puff'][id], E, sz, sz), E, bz2, t0, t1, (f) => (id === 1 ? 1.2 - 0.4 * f : 0.6 + 0.8 * f), (f) => (f < 0.1 ? f * 9 : f > 0.94 ? 0.2 : 0.92), Math.round(rand() * 360), 100, 40, (f) => f * f * 0.5 + f * 0.5);
  }
  fx(k.pic('spark', E, 26, 26), [[RE - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [RE + 40, { transform: 'scale(1.9) rotate(25deg)', opacity: 1 }, 'ease-out'], [RE + 300, { transform: 'scale(.6) rotate(70deg)', opacity: 0 }]]);

  // ── it lands (IMPACT): a burst of ember, and two red eyes flare at T and burn on
  h.burst(T, IM, { size: 0.85, flames: 3, linger: 600 });
  const rays = k.svg('<defs><radialGradient id="r" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff4d8"/><stop offset="1" stop-color="#ff5a2a" stop-opacity="0"/></radialGradient></defs>' +
    Array.from({ length: 8 }, (_, i) => `<path d="M50,50 L${(50 + 48 * Math.cos((i * Math.PI) / 4 - 0.07)).toFixed(1)},${(50 + 48 * Math.sin((i * Math.PI) / 4 - 0.07)).toFixed(1)} L${(50 + 48 * Math.cos((i * Math.PI) / 4 + 0.07)).toFixed(1)},${(50 + 48 * Math.sin((i * Math.PI) / 4 + 0.07)).toFixed(1)}Z" fill="url(#r)"/>`).join(''), 100, 100);
  fx(k.pic(rays, T, 54, 54), [[IM - 10, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [IM + 90, { transform: 'scale(.95) rotate(10deg)', opacity: 0.9 }, 'ease-out'], [IM + 680, { transform: 'scale(1.35) rotate(36deg)', opacity: 0 }]]);
  for (const dx of [-4.5, 4.5]) {
    const p = [T[0] + dx, T[1] - 7], l = [[IM + 40, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [IM + 140, { transform: 'scale(1.6)', opacity: 1 }, 'ease-out'], [IM + 300, { transform: 'scale(1)', opacity: 0.9 }, eio]];
    for (let t = IM + 450, i = 0; t < 2900; t += 170, i++) l.push([t, { transform: `scale(${i % 2 ? 1.12 : 0.92})`, opacity: i % 2 ? 0.95 : 0.75 }, eio]);
    l.push([3300, { transform: 'scale(.5)', opacity: 0 }]);
    fx(k.light('g-redeye', p, 15), l);
  }
  fx(k.light('g-redeye', T, 50), [[IM, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 120, { transform: 'scale(1.3)', opacity: 0.8 }, 'ease-out'], [IM + 700, { transform: 'scale(1)', opacity: 0.3 }, eio], [2600, { transform: 'scale(.8)', opacity: 0.2 }, eio], [3300, { transform: 'scale(.6)', opacity: 0 }]]);
  // embers lifting off T
  for (let i = 0; i < 14; i++) {
    const a = rand() * Math.PI * 2, d = 6 + rand() * 16, t = IM + 40 + rand() * 600, p = [T[0] + Math.cos(a) * d, T[1] + Math.sin(a) * d * 0.6 + 4], sz = 3 + rand() * 3;
    fx(k.pic(rand() < 0.5 ? 'mote' : 'spark', p, sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 120, { transform: 'scale(1)', opacity: 1 }], [t + 900 + rand() * 500, { transform: `${k.T((rand() - 0.5) * 12, -24 - rand() * 24)} scale(.25)`, opacity: 0 }]]);
  }
}
