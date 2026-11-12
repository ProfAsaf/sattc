// Something Beneath (a creature, an attacker: a shadowy horror rising from the black lake beneath the
// drowned towers). It sinks a little, gathering, then surges up out of the water: its two great arms
// rear in over it, its eyes flare and the seam of violet light in its maw splits wider, rings spread
// across the lake. It lets go: a surge of darkness pours out of the maw to T (dark billows laced with
// violet light), and the great arm on that side lashes after it; the darkness breaks over T in a burst
// of shadow and violet fire, leaving a stain that thins away. The horror holds, then sinks back, arms
// lowering, eyes calming, the lake settling.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker, element shadow (suggestion kept).
//   0-500     ANTICIPATION: it sinks into the water (body squashes down), the arms draw in, the eyes
//             dim and narrow; rings on the lake.
//   500-1450  SURGE: it rises, stretching up; arms rear in over it (tips drawn toward the middle), the
//             tip tentacles thrash; the eyes flare, the seam widens; violet light gathers about it
//             and in the maw.
//   1500      RELEASE: it lurches forward; the darkness leaves the maw (billows along an arc to T) and
//             the arm on T's side lashes out (the other arm sinks back).
//   1850      IMPACT: the darkness breaks over T: flash, ring, billows flung out, violet sparks, a
//             lingering stain; the lake slaps in rings at its foot.
//   1850-3500 it holds, then sinks back, arms lowering; eyes and light die down; the lake calms.
// BEATS: release 1500, impact 1850, settle 3500.
export const END = 4200;
export const BEATS = { release: 1500, impact: 1850, settle: 3500 };
export const STILLS = [300, 800, 1250, 1500, 1700, 1950, 2600, 3700];

import { kit } from './_fx.js';

export const textures = {
  orb: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [200 + 55 * c * c, 150 + 90 * c * c, 255, Math.min(1, c * c * 2.4)]; }],
  vio: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [196, 160, 255, Math.min(1, c * c * 3)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const S = k.spec, M = S.emit, WL = S.waterline;
  const body = k.part('body'), armL = k.part('armL'), armR = k.part('armR'), tipL = k.part('tipL'), tipR = k.part('tipR'), eyes = k.part('eyes'), seam = k.part('seam');
  const T = k.aim || [256, 122];
  const REL = 1500, IM = 1850, BACK = 3500;
  const right = T[0] >= 150, sgn = right ? 1 : -1;
  k.css('.g-shade { border-radius: 50%; background: radial-gradient(circle, rgba(240,226,255,.9), rgba(176,124,255,.55) 30%, rgba(120,70,220,.22) 55%, rgba(90,40,200,0) 72%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.5"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#b79cf0" stroke-width="5" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#e4d8ff" stroke-width="1.4"/>', 100, 100);

  // ── the body: sinks, surges up (stretching from the waterline), lurches at the release, holds, sinks back
  act(body, [[0, { transform: 'none' }, eio], [480, { transform: 'scale(1.02, .95)' }, 'ease-out'], [1150, { transform: 'scale(.985, 1.06)' }, eio],
    [REL - 60, { transform: 'scale(.98, 1.07)' }, 'ease-out'], [REL + 150, { transform: 'scale(1.05, 1.08)' }, eio],
    [2400, { transform: 'scale(1.03, 1.05)' }, eio], [BACK, { transform: 'none' }]]);
  // the arms: draw in, rear in over it; then the near one lashes to T's side, the far one sinks back
  const reared = (s) => `rotate(${(-s * 13).toFixed(1)}deg) scale(1, 1.05)`; // s = -1 left arm, +1 right arm: tips drawn toward the middle
  const lashAt = (s) => `rotate(${(s * 40).toFixed(1)}deg) scale(1, .96)`;
  for (const [part, s] of [[armL, -1], [armR, 1]]) {
    const near = s === sgn;
    const quiver = [];
    for (let t = 1250, i = 0; t < REL - 80; t += 110, i++) quiver.push([t, { transform: `rotate(${(-s * (13 + (i % 2 ? 2 : -1.5))).toFixed(1)}deg) scale(1, ${i % 2 ? 1.06 : 1.04})` }, eio]);
    act(part, [[0, { transform: 'none' }, eio], [480, { transform: `rotate(${(-s * -4).toFixed(1)}deg) scale(1, .97)` }, 'ease-out'], [1000, { transform: reared(s) }, eio], ...quiver,
      near ? [REL - 60, { transform: reared(s) }, 'ease-in'] : [REL, { transform: reared(s) }, eio],
      ...(near ? [[REL + 170, { transform: lashAt(s) }, 'ease-out'], [REL + 420, { transform: lashAt(s) }, eio], [2500, { transform: `rotate(${(s * 18).toFixed(1)}deg)` }, eio]]
        : [[REL + 300, { transform: `rotate(${(-s * 4).toFixed(1)}deg) scale(1, .98)` }, 'ease-out'], [2500, { transform: `rotate(${(s * 4).toFixed(1)}deg)` }, eio]]),
      [BACK, { transform: 'none' }]]);
  }
  // the small tentacles at the lake's edges thrash as it surges
  for (const [part, s] of [[tipL, -1], [tipR, 1]]) {
    const l = [[0, { transform: 'none' }, eio], [450, { transform: `rotate(${3 * s}deg) scale(1, .95)` }, eio]];
    for (let t = 800, i = 0; t < 2500; t += 170 + rand() * 60, i++) l.push([t, { transform: `rotate(${((i % 2 ? -1 : 1) * (6 + rand() * 6) * s).toFixed(1)}deg) scale(1, ${(1.04 + rand() * 0.1).toFixed(2)})` }, eio]);
    l.push([BACK, { transform: 'none' }]);
    act(part, l);
  }
  // the eyes: narrow and dim as it sinks, flare as it rises, blaze at the release, calm
  const el = [[0, { transform: 'none', opacity: 1 }, eio], [300, { transform: 'scale(1, .6)', opacity: 0.45 }, 'ease-in'], [480, { transform: 'scale(1, .5)', opacity: 0.35 }, 'ease-out'], [820, { transform: 'scale(1.1, 1.15)', opacity: 1 }, eio]];
  for (let t = 1000, i = 0; t < REL - 60; t += 130, i++) el.push([t, { transform: `scale(${i % 2 ? 1.14 : 1.06}, ${i % 2 ? 1.2 : 1.1})`, opacity: 1 }, eio]);
  el.push([REL + 40, { transform: 'scale(1.3, 1.4)', opacity: 1 }, 'ease-out'], [2300, { transform: 'scale(1.1, 1.1)', opacity: 1 }, eio], [BACK, { transform: 'none', opacity: 1 }]);
  act(eyes, el);
  // the seam: pales, then splits wider and brighter, flaring wide as the darkness leaves
  const sl = [[0, { transform: 'none', opacity: 1 }, eio], [450, { transform: 'scale(.7, .8)', opacity: 0.55 }, eio], [900, { transform: 'scale(1.4, 1.1)', opacity: 1 }, eio]];
  for (let t = 1100, i = 0; t < REL - 60; t += 140, i++) sl.push([t, { transform: `scale(${i % 2 ? 1.9 : 1.6}, ${i % 2 ? 1.2 : 1.1})`, opacity: 1 }, eio]);
  sl.push([REL + 60, { transform: 'scale(3.2, 1.35)', opacity: 1 }, 'ease-out'], [REL + 600, { transform: 'scale(2.2, 1.15)', opacity: 1 }, eio], [2600, { transform: 'scale(1.3, 1.05)', opacity: 1 }, eio], [BACK, { transform: 'none', opacity: 1 }]);
  act(seam, sl);

  // ── violet light gathering about it and in its maw
  const aura = [[300, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(1)', opacity: 0.55 }, eio]];
  for (let t = 1150, i = 0; t < REL; t += 150, i++) aura.push([t, { transform: `scale(${i % 2 ? 1.06 : 0.97})`, opacity: i % 2 ? 0.7 : 0.55 }, eio]);
  aura.push([REL + 60, { transform: 'scale(1.2)', opacity: 0.95 }, 'ease-out'], [2300, { transform: 'scale(1.05)', opacity: 0.5 }, eio], [3300, { transform: 'scale(.8)', opacity: 0 }]);
  fx(k.lightIn('g-shade', [150, 100], 190, 150), aura);
  const maw = [[900, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1250, { transform: 'scale(1)', opacity: 0.8 }, eio]];
  for (let t = 1350, i = 0; t < REL - 40; t += 90, i++) maw.push([t, { transform: `scale(${i % 2 ? 1.25 : 0.95})`, opacity: i % 2 ? 0.95 : 0.7 }, eio]);
  maw.push([REL + 50, { transform: 'scale(1.9)', opacity: 1 }, 'ease-out'], [REL + 400, { transform: 'scale(1.2)', opacity: 0.8 }, eio], [2300, { transform: 'scale(.5)', opacity: 0 }]);
  fx(k.lightIn('g-shade', M, 46, 56), maw);

  // ── the lake: rings spreading from its foot as it sinks and surges, slapping when it lurches and lashes
  const flatRing = (x, y, w, t0, o = 0.7) => fx(k.picIn(ring, [x, y], w, w * 0.2), [[t0, { transform: 'scale(.25)', opacity: 0 }, 'ease-out'], [t0 + 80, { transform: 'scale(.5)', opacity: o }, 'ease-out'], [t0 + 1000, { transform: 'scale(1.4)', opacity: 0 }]]);
  flatRing(150, WL + 3, 150, 150, 0.45); flatRing(150, WL + 5, 190, 600, 0.5); flatRing(150, WL + 4, 150, 1000, 0.55);
  flatRing(150, WL + 4, 200, REL + 60, 0.7); flatRing(150, WL + 6, 240, REL + 260, 0.45);
  flatRing(100 + sgn * 100, WL + 2, 80, REL + 300, 0.55);
  flatRing(60, WL + 3, 50, 800, 0.4); flatRing(260, WL + 3, 50, 900, 0.4);
  // drops flung up where the lashing arm hits the water
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI * (0.1 + rand() * 0.8), v = 10 + rand() * 20, t0 = REL + 330 + rand() * 60, life = 420 + rand() * 260, sz = 2 + rand() * 2.4, bx = 150 + sgn * (62 + rand() * 30), px = (f) => Math.cos(a) * v * f, py = (f) => Math.sin(a) * v * f + 36 * f * f;
    fx(k.picIn('vio', [bx, WL + 2], sz, sz), [0, 0.35, 0.7, 1].map((f, j) => [Math.round(t0 + life * f), { transform: `${k.T(px(f), py(f))} scale(${(1 - 0.5 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']));
  }
  // darkness seeping off it as it surges: gloom puffs drifting up from the water
  for (let i = 0; i < 8; i++) {
    const t = 500 + i * 120 + rand() * 60, x = 100 + rand() * 100, r = Math.round(rand() * 360);
    fx(k.picIn('gloom', [x, WL - 2], 34, 34, { lit: false }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 350, { transform: `${k.T(-2, -12)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 1400, { transform: `${k.T(-8, -50)} rotate(${r + 50}deg) scale(1.9)`, opacity: 0 }]]);
  }

  // ── the darkness pouring out of the maw to T (on the overlay: T may be on another card)
  const C = [(M[0] + T[0]) / 2, Math.min(M[1], T[1]) - 26], bz0 = (t) => { const q = 1 - t; return [q * q * M[0] + 2 * q * t * C[0] + t * t * T[0], q * q * M[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  for (let i = 0; i < 15; i++) {
    const t0 = REL + i * 34, side = (rand() - 0.5) * 9, f = (t) => t, dur = 340;
    const bz = (t) => { const p = bz0(t); return [p[0], p[1] + side * Math.sin(t * Math.PI)]; };
    h.fly(k.pic('gloom', M, 26, 26, { lit: false }), M, bz, t0, t0 + dur, (g) => 0.5 + g * 1.1, (g) => (g < 0.1 ? g * 8 : g > 0.88 ? Math.max(0, (1 - g) / 0.12 * 0.8) : 0.8), Math.round(rand() * 360), 80, 40, (g) => g * g * 0.5 + g * 0.5);
  }
  for (let i = 0; i < 11; i++) {
    const t0 = REL + 10 + i * 40, side = (rand() - 0.5) * 12, dur = 330;
    const bz = (t) => { const p = bz0(t); return [p[0], p[1] + side * Math.sin(t * Math.PI)]; };
    h.fly(k.pic(i % 3 ? 'vio' : 'orb', M, i % 3 ? 5 : 9, i % 3 ? 5 : 9), M, bz, t0, t0 + dur, (g) => 1 - g * 0.4, (g) => (g < 0.1 ? g * 9 : g > 0.9 ? Math.max(0, (1 - g) / 0.1) : 0.95), 0, 0, 40, (g) => g * g * 0.5 + g * 0.5);
  }
  // the head of the stream: a travelling light
  h.fly(k.light('g-shade', M, 40), M, bz0, REL, IM, (g) => 0.7 + g * 0.5, (g) => (g < 0.08 ? g * 12 : g > 0.92 ? 0.3 : 0.95), 0, 0, 40, (g) => g * g * 0.5 + g * 0.5);

  // ── where it breaks (BEATS.impact): flash, ring, billows flung out, violet sparks, a lingering stain
  const flash = [[IM - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [IM + 250, { transform: 'scale(1.3)', opacity: 0.7 }]];
  for (let t = IM + 380, i = 0; t < IM + 900; t += 120, i++) flash.push([t, { transform: `scale(${i % 2 ? 1.2 : 1})`, opacity: i % 2 ? 0.55 : 0.4 }, eio]);
  flash.push([IM + 1300, { transform: 'scale(.8)', opacity: 0 }]);
  fx(k.light('g-shade', T, 64), flash);
  fx(k.light('g-shade', T, 22), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 30, { transform: 'scale(1.6)', opacity: 1 }], [IM + 170, { transform: 'scale(2.6)', opacity: 0 }]]);
  for (const [d, w, o] of [[0, 64, 0.95], [100, 44, 0.65]]) fx(k.pic(ring, T, w, w), [[IM + d - 1, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + d + 50, { transform: 'scale(.4)', opacity: o }, 'ease-out'], [IM + d + 520, { transform: 'scale(1.1)', opacity: 0 }]]);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + rand() * 0.5, d = 14 + rand() * 14, r = Math.round(rand() * 360), t = IM + rand() * 30, dx = Math.cos(a) * d, dy = Math.sin(a) * d * 0.75 - 2;
    fx(k.pic('gloom', T, 20, 20, { lit: false }), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 90, { transform: `${k.T(dx * 0.5, dy * 0.5)} rotate(${r + 30}deg) scale(1)`, opacity: 0.85 }, 'ease-out'],
      [t + 400, { transform: `${k.T(dx, dy - 3)} rotate(${r + 70}deg) scale(1.6)`, opacity: 0.55 }], [t + 900, { transform: `${k.T(dx * 1.1, dy - 12)} rotate(${r + 100}deg) scale(2.1)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 16; i++) {
    const a = -Math.PI * (0.05 + rand() * 0.9), v = 16 + rand() * 32, t = IM + rand() * 40, life = 400 + rand() * 360, sz = 3 + rand() * 3, px = (f) => Math.cos(a) * v * f, py = (f) => Math.sin(a) * v * f + 38 * f * f;
    fx(k.pic(i % 3 ? 'vio' : 'orb', T, sz, sz), [0, 0.3, 0.65, 1].map((f, j) => [Math.round(t + life * f), { transform: `${k.T(px(f), py(f))} scale(${(1 - 0.75 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']));
  }
  // the stain it leaves: a pool of shadow spreading at T, thinning away
  const stain = [[IM + 60, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 500, { transform: 'scale(1)', opacity: 0.7 }, eio], [2900, { transform: 'scale(1.1)', opacity: 0.55 }, eio], [3500, { transform: 'scale(1.25)', opacity: 0 }]];
  fx(k.pic('gloom', [T[0], T[1] + 4], 54, 40, { lit: false, low: true }), stain);
  for (let i = 0; i < 3; i++) {
    const t = IM + 240 + i * 200, r = Math.round(rand() * 360);
    fx(k.pic('gloom', [T[0] + (rand() - 0.5) * 12, T[1] - 4], 26, 26, { lit: false, low: true }), [[t, { transform: `rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 300, { transform: `${k.T(-2, -12)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 1300, { transform: `${k.T(-8, -46)} rotate(${r + 50}deg) scale(2)`, opacity: 0 }]]);
  }
}
