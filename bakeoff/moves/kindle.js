// Kindle: the warrior draws her burning blade back, sweeps it round and throws its fire, which wreathes
// its target in flame: more strength, and speed.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support (as suggested: a buff, +2 Power and Swift),
// element fire (as suggested). Facing right.
//   0-520     (only if T lies behind her: she turns round through a sliver, mirrored about x = 150.)
//   200-950   gather: the arc she left behind gutters and is drawn into the blade, embers streaming along
//             it to the tip; the blade swells with white-hot light and flames lick at its tip; she crouches
//             and leans back, the cape drawn after.
//   950-1000  the wind-up: one breath held, leaning furthest back.
//   1000      RELEASE: she lunges into the stroke, a fresh arc of fire sweeping round behind the blade, and
//             the fire is flung off its tip in a stream of billows along an arc to T.
//   1450      IMPACT at T: flash, rings, rays; flames wreath it (the power) and streaks stream back off it (the
//             speed); the warrior surges with the gift at once (alone, T is her own heart: the stream curls
//             back over her head and into her chest, and she swells with it).
//   1700-3400 the arc cools to its drawn glow, she rises and settles, the last motes drifting up. At rest as
//             drawn from 3400 (END 3800).
// Aimed: T = k.aim || her own chest (spec.hit). The fire leaves the blade's tip and goes to T; if T is
// behind her she mirrors. Everything flung or landing is on the overlay (k.pic / k.light).
import { SPARK, kit } from './_fx.js';
export const END = 3800;
export const BEATS = { release: 1000, impact: 1450, settle: 3400 };
export const STILLS = [450, 850, 1000, 1150, 1480, 1800, 2600, 3600];
export const textures = {
  spark: SPARK,
  mote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 220 + 30 * c, 140 + 100 * c * c, Math.min(1, c * c * c * 2.4)]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const arc = k.part('arc'), body = k.part('body'), blade = k.part('blade');
  const S = k.spec, HIPS = S.hips, MID = S.mid;
  const T = k.aim || S.hit;
  const m = T[0] < 130 ? -1 : 1; // she faces left to throw at something behind her
  const X = (x) => (m < 0 ? 2 * HIPS[0] - x : x), P = ([x, y]) => [X(x), y];
  const RE = 1000, IM = 1450;
  const E = P(S.emit); // the blade's tip, where the fire leaves
  const dir = T[0] >= E[0] ? 1 : -1;

  // ── her pose: [ms, move x, move y (toward where she faces), lean (+ = forward), scale], turned about her hips
  const sxAt = (t) => (m > 0 ? 1 : t <= 0 ? 1 : t < 260 ? 0.06 : -1);
  const tf = (x, y, lean, sc = 1, sx = m) => `${k.T(x * m, y)} rotate(${(lean * m).toFixed(1)}deg) scale(${(sx * sc).toFixed(3)}, ${sc.toFixed(3)})`;
  const turn = m > 0 ? [] : [[260, { transform: tf(0, 0, 0, 1, 0.06) }, eio], [520, { transform: tf(0, 0, 0) }, eio]];
  void sxAt;
  const pose = [[0, { transform: tf(0, 0, 0, 1, 1) }, eio], ...turn,
    [m > 0 ? 450 : 700, { transform: tf(-1.2, 1.4, -3.5) }, eio], [880, { transform: tf(-2.2, 2.4, -6.5) }, 'ease-in'], [RE - 10, { transform: tf(-2.6, 2.6, -7.5) }, 'ease-in'],
    [RE + 130, { transform: tf(4.5, -1.2, 6.5) }, 'ease-out'], [IM, { transform: tf(3.2, -0.6, 4.5) }, eio], [IM + 120, { transform: tf(2.5, -2.4, 2, 1.03) }, 'ease-out'], [IM + 420, { transform: tf(1.4, -0.8, 1, 1.018) }, eio],
    [2300, { transform: tf(0.6, 0, 0.3, 1.005) }, eio], [3400, { transform: 'none' }]];
  act(body, pose);
  act(blade, pose);

  // ── the arc: gutters and is drawn into the blade, then sweeps round afresh behind the blade at the release
  const sw = (a, o, sc) => `rotate(${(a * m).toFixed(1)}deg) scale(${(m * sc).toFixed(3)}, ${sc.toFixed(3)})`;
  void sw;
  const at = (a, sc, sx = m) => `rotate(${(a * m).toFixed(1)}deg) scale(${(sx * sc).toFixed(3)}, ${sc.toFixed(3)})`;
  act(arc, [[0, { transform: at(0, 1, 1), opacity: 1 }, eio], ...(m > 0 ? [] : [[260, { transform: at(0, 1, 0.06), opacity: 0.8 }, eio], [520, { transform: at(0, 1), opacity: 0.6 }, eio]]),
    [m > 0 ? 300 : 600, { transform: at(0, 0.97), opacity: 0.55 }, eio], [880, { transform: at(8, 0.9), opacity: 0.12 }, 'ease-in'], [RE - 20, { transform: at(14, 0.88), opacity: 0 }, 'ease-out'],
    [RE + 40, { transform: at(-95, 0.96), opacity: 0.5 }, 'ease-out'], [RE + 300, { transform: at(4, 1.04), opacity: 1 }, 'ease-out'], [IM + 120, { transform: at(0, 1.05), opacity: 1 }, eio], [2400, { transform: at(0, 1.01), opacity: 1 }, eio], [3400, { transform: at(0, 1, m), opacity: 1 }]]);

  // ── light: the blade swelling, the old arc's light drawn in, flaring at the release, cooling after
  const BL = P([222, 122]);
  const bl = [[(m > 0 ? 100 : 560), { transform: 'scale(.6)', opacity: 0 }, 'ease-out']];
  for (let t = 520, i = 0; t < 960; t += 110, i++) bl.push([t, { transform: `scale(${(0.9 + (t / 960) * 0.5 + (i % 2 ? 0.1 : -0.05)).toFixed(2)})`, opacity: +(0.45 + 0.4 * (t / 960)).toFixed(2) }, eio]);
  bl.push([RE + 40, { transform: 'scale(1.9)', opacity: 1 }, 'ease-out'], [1400, { transform: 'scale(1.2)', opacity: 0.6 }, eio], [2200, { transform: 'scale(.8)', opacity: 0.25 }, eio], [3000, { transform: 'scale(.6)', opacity: 0 }]);
  fx(k.lightIn('g-warm', BL, 70, 28), bl);
  fx(k.light('g-warm', E, 36), [[(m > 0 ? 300 : 620), { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [RE - 10, { transform: 'scale(1.5)', opacity: 0.95 }, eio], [RE + 80, { transform: 'scale(2)', opacity: 1 }, 'ease-out'], [RE + 500, { transform: 'scale(.8)', opacity: 0.2 }, eio], [RE + 900, { transform: 'scale(.5)', opacity: 0 }]]);
  fx(k.lightIn('g-city', [150, 96], 300, 190), [[RE - 50, { opacity: 0 }, 'ease-out'], [RE + 250, { opacity: 0.7 }, eio], [IM + 100, { opacity: 0.95 }, eio], [2300, { opacity: 0.3 }, eio], [3000, { opacity: 0 }]]);

  // ── flames licking at the blade's tip as it swells
  for (let i = 0; i < 4; i++) h.flicker(k.pic(i % 2 ? 'flame' : 'flame2', [E[0] - 4 + (i - 1.5) * 4, E[1] + 2], 8 + rand() * 3, 15 + rand() * 7, { base: true }), (m > 0 ? 420 : 700) + i * 90, RE + 20 + rand() * 80, dir * 8);

  // ── embers drawn from where the arc was, along its curve, into the blade's tip
  const arcPt = (a) => { const r = (a * Math.PI) / 180; return P([150 + 98 * Math.cos(r), 114 + 82 * Math.sin(r)]); };
  for (let i = 0; i < 16; i++) {
    const t0 = (m > 0 ? 200 : 520) + i * 38 + rand() * 30, from = arcPt(-190 + i * 13 + rand() * 8), dur = 460 + rand() * 120, ks = [], sz = 3 + rand() * 3;
    for (let t = t0; t <= t0 + dur + 1; t += 50) {
      const f = Math.min(1, (t - t0) / dur), e = f * f * (3 - 2 * f);
      ks.push([Math.min(t, t0 + dur), { transform: `${k.T((E[0] - from[0]) * e, (E[1] - from[1]) * e)} scale(${(0.5 + 0.9 * Math.sin(Math.PI * f)).toFixed(2)})`, opacity: f > 0.95 ? 0 : f < 0.1 ? f * 10 : 1 }, 'linear']);
    }
    fx(k.pic('mote', from, sz, sz), ks);
  }

  // ── the throw (1000-1450): billows of fire off the tip along an arc to T
  const bz = h.arcPath(E, T, 22 + Math.min(26, Math.hypot(T[0] - E[0], T[1] - E[1]) * 0.18));
  for (let i = 0; i < 22; i++) {
    const t0 = RE + 6 + i * 13, t1 = IM + 10 + i * 6, id = i % 3, sz = [18, 5, 14][id], side = (rand() - 0.5) * 8;
    const bz2 = (f) => { const p = bz(f); return [p[0], p[1] + side * Math.sin(Math.PI * f)]; };
    h.fly(k.pic(['puffHot', 'spark', 'puff'][id], E, sz, sz), E, bz2, t0, t1, (f) => (id === 1 ? 1.2 - 0.4 * f : 0.6 + 0.8 * f), (f) => (f < 0.1 ? f * 9 : f > 0.94 ? 0.2 : 0.92), Math.round(rand() * 360), 100, 40, (f) => f * f * 0.5 + f * 0.5);
  }
  fx(k.pic('spark', E, 24, 24), [[RE - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [RE + 40, { transform: 'scale(1.9) rotate(25deg)', opacity: 1 }, 'ease-out'], [RE + 280, { transform: 'scale(.6) rotate(70deg)', opacity: 0 }]]);

  // ── the gift lands (1450): flash, rings, rays; flames wreathe T; streaks of speed; embers rise
  const ring = h.ring;
  const rays = k.svg('<defs><radialGradient id="r" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbe8"/><stop offset="1" stop-color="#ffb04a" stop-opacity="0"/></radialGradient></defs>' +
    Array.from({ length: 8 }, (_, i) => `<path d="M50,50 L${(50 + 48 * Math.cos((i * Math.PI) / 4 - 0.07)).toFixed(1)},${(50 + 48 * Math.sin((i * Math.PI) / 4 - 0.07)).toFixed(1)} L${(50 + 48 * Math.cos((i * Math.PI) / 4 + 0.07)).toFixed(1)},${(50 + 48 * Math.sin((i * Math.PI) / 4 + 0.07)).toFixed(1)}Z" fill="url(#r)"/>`).join(''), 100, 100);
  const flash = [[IM - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [IM + 250, { transform: 'scale(1.9)', opacity: 0.65 }]];
  for (let t = IM + 450, i = 0; t < IM + 1100; t += 150, i++) flash.push([t, { transform: `scale(${i % 2 ? 1.45 : 1.25})`, opacity: i % 2 ? 0.55 : 0.4 }, eio]);
  flash.push([IM + 1600, { transform: 'scale(.9)', opacity: 0 }]);
  fx(k.light('g-warm', T, 62), flash);
  fx(k.light('g-warm', T, 22), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.6)', opacity: 1 }], [IM + 200, { transform: 'scale(2.6)', opacity: 0 }]]);
  fx(k.pic(ring, T, 60, 60), [[IM, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(.4)', opacity: 0.95 }, 'ease-out'], [IM + 540, { transform: 'scale(1.1)', opacity: 0 }]]);
  fx(k.pic(ring, T, 60, 60), [[IM + 120, { transform: 'scale(.1)', opacity: 0 }, 'ease-out'], [IM + 180, { transform: 'scale(.3)', opacity: 0.6 }, 'ease-out'], [IM + 680, { transform: 'scale(.85)', opacity: 0 }]]);
  fx(k.pic(rays, T, 58, 58), [[IM - 10, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [IM + 90, { transform: 'scale(.95) rotate(10deg)', opacity: 0.95 }, 'ease-out'], [IM + 680, { transform: 'scale(1.35) rotate(36deg)', opacity: 0 }]]);
  // a wreath of flames standing round T (and licking up) while the gift takes
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3, p = [T[0] + Math.cos(a) * 15, T[1] + Math.sin(a) * 9 + 8];
    h.flicker(k.pic(i % 2 ? 'flame' : 'flame2', p, 10 + rand() * 3, 16 + rand() * 9, { base: true }), IM + 60 + i * 50, IM + 800 + rand() * 450, Math.cos(a) * 7);
  }
  // the speed: streaks flung back off T (the way it came)
  const streak = k.svg('<defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd27a" stop-opacity="0"/><stop offset=".7" stop-color="#ffd27a"/><stop offset="1" stop-color="#fff4d8"/></linearGradient></defs><path d="M0,3 L60,0 L60,6Z" fill="url(#s)"/>', 60, 6);
  for (let i = 0; i < 5; i++) {
    const t = IM + 140 + i * 55, p = [T[0] - dir * 16, T[1] - 14 + i * 7], sx = dir;
    fx(k.pic(streak, p, 30, 3, {}), [[t, { transform: `${k.T(-dir * 2, 0)} scale(${sx * 0.2}, 1)`, opacity: 0 }, 'ease-out'], [t + 100, { transform: `${k.T(-dir * 8, 0)} scale(${sx * 1}, 1)`, opacity: 0.95 }, 'ease-out'], [t + 420, { transform: `${k.T(-dir * 26, 0)} scale(${sx * 1.2}, .6)`, opacity: 0 }]]);
  }
  // embers lifting off T
  for (let i = 0; i < 16; i++) {
    const a = rand() * Math.PI * 2, d = 8 + rand() * 18, t = IM + 40 + rand() * 500, p = [T[0] + Math.cos(a) * d, T[1] + Math.sin(a) * d * 0.6 + 6], sz = 3 + rand() * 3;
    fx(k.pic(rand() < 0.5 ? 'mote' : 'spark', p, sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 120, { transform: 'scale(1)', opacity: 1 }], [t + 900 + rand() * 500, { transform: `${k.T((rand() - 0.5) * 12, -26 - rand() * 26)} scale(.25)`, opacity: 0 }]]);
  }
}
