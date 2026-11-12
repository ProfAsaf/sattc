// Savage Clash: the great bear and the horned beast crash together, and the blow goes out across the
// clearing as a shockwave of leaves and dust.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker (changed from the suggested support: it is a
// fight spell, "a creature fights an enemy creature", so the spell is the blow), element nature.
//   0-900     GATHER: both beasts draw back. The bear drops, then rears up and back on its hind legs; the
//             beast stamps and hauls itself back, head lifting. Dust is kicked up behind their feet, motes of
//             green light gather at the place where they will meet.
//   900-1000  CHARGE: both slam in from their feet, faster than they drew back.
//   1000      RELEASE: they crash. A flash, two rings and a starburst at the meeting point (emit), leaves and
//             dust flung every way, a ring of dust running out along the ground; the shockwave leaves
//             for T as a stream of leaves and light on a low arc, a ring riding with it.
//   1450      IMPACT at T: a flash and ring, leaves burst and settle, dust rolls, sparks of light fall.
//   1000-3600 follow-through: both recoil, then lean into each other twice more, straining, dust at their
//             feet; they ease apart and settle exactly as drawn at 3600 (END 4200). Leaves drift down.
// Aimed: T = k.aim || [258, 178] (alone: the far clearing floor, the shockwave rolling away right).
// The stream, the ring that rides with it and the burst at T are on the overlay (T may be on another card);
// everything at the clash and at the feet is in the card's picture.
import { kit } from './_fx.js';
export const END = 4200;
export const BEATS = { release: 1000, impact: 1450, settle: 3600 };
export const STILLS = [450, 850, 1000, 1080, 1450, 1800, 2700, 3900];
export const textures = {
  dust: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r), n = 0.85 + 0.15 * Math.sin(x * 19 + y * 13); return [240, 233, 196, Math.min(1, c * c * 1.5) * n * 0.9]; }],
  mote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [244, 255, 180 + 60 * c, Math.min(1, c * c * c * 2.4)]; }],
  star: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); const ax = Math.abs(x - 0.5) * 2, ay = Math.abs(y - 0.5) * 2, ray = Math.max(0, 1 - Math.min(ax, ay) * 9) * Math.max(0, 1 - Math.max(ax, ay)); return [252, 255, 200 + 55 * c * c, Math.min(1, c * c * c * 1.8 + ray * 0.85)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  k.css('.g-clash { border-radius: 50%; background: radial-gradient(circle, rgba(255,253,226,.97), rgba(240,248,168,.6) 30%, rgba(190,226,112,.22) 56%, rgba(170,210,90,0) 72%); }');
  const S = k.spec, E = S.emit, GY = S.ground;
  const T = k.aim || [258, 178];
  const bear = k.part('bear'), beast = k.part('beast');

  // ── the two beasts: `pose` = translate (drawing units), rotate (deg), scale about their feet
  const pose = (tx, ty, r, sx = 1, sy = 1) => ({ transform: `translate(${(tx * u).toFixed(1)}px, ${(ty * u).toFixed(1)}px) rotate(${r}deg) scale(${sx}, ${sy})` });
  const ID = pose(0, 0, 0);
  act(bear, [[0, ID, eio], [300, pose(-1, 0.8, -1.5, 1.02, 0.97), eio], [620, pose(-3, -1, -6, 0.99, 1.025), eio], [860, pose(-7, -1.5, -9.5, 0.985, 1.04), 'ease-in'],
    [1000, pose(5, 0, 4, 1.04, 0.95), 'ease-out'], [1120, pose(-2, 0, -3, 0.99, 1.02), eio], [1300, pose(3, 0, 1.8, 1.025, 0.975), eio], [1560, pose(0, 0, -0.8), eio],
    [1800, pose(4, 0, 2.4, 1.03, 0.97), eio], [2080, pose(1, 0, 0.2), eio], [2500, pose(3, 0, 1.4, 1.015, 0.985), eio], [2900, pose(1, 0, 0.3), eio], [3300, pose(-0.6, 0, -0.5), eio], [3600, ID]]);
  act(beast, [[0, ID, eio], [300, pose(1, 1.2, 1, 1.0, 0.97), eio], [470, pose(1, -0.4, 1.4, 1, 1.01), eio], [560, pose(1.5, 1.6, 2, 1.01, 0.96), eio], [860, pose(8, -1, 4.2, 0.99, 1.03), 'ease-in'],
    [1000, pose(-5, 0, -3.2, 1.03, 0.96), 'ease-out'], [1120, pose(2, 0, 2, 0.99, 1.02), eio], [1300, pose(-3, 0, -1.8, 1.025, 0.975), eio], [1560, pose(0, 0, 0.5), eio],
    [1800, pose(-4, 0, -2.2, 1.03, 0.97), eio], [2080, pose(-1, 0, -0.2), eio], [2500, pose(-3, 0, -1.2, 1.015, 0.985), eio], [2900, pose(-1, 0, -0.3), eio], [3300, pose(0.6, 0, 0.4), eio], [3600, ID]]);

  // ── little pictures
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.5"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#f6ffc4" stroke-width="5.5" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#ffffff" stroke-width="1.4"/>', 100, 100);
  const burstSvg = (() => { let d = ''; for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, l = i % 2 ? 30 : 46, w = 0.1; d += `M50,50L${(50 + Math.cos(a - w) * 10).toFixed(1)},${(50 + Math.sin(a - w) * 10).toFixed(1)}L${(50 + Math.cos(a) * l).toFixed(1)},${(50 + Math.sin(a) * l).toFixed(1)}L${(50 + Math.cos(a + w) * 10).toFixed(1)},${(50 + Math.sin(a + w) * 10).toFixed(1)}Z`; } return k.svg(`<path d="${d}" fill="#fffbe0"/>`, 100, 100); })();
  const leafA = k.svg('<path d="M10,1 C17,6 17,17 10,25 C3,17 3,6 10,1Z" fill="#4a6634"/><path d="M10,4 L10,22" stroke="#cfe590" stroke-width=".9" fill="none"/>', 20, 26);
  const leafB = k.svg('<path d="M10,1 C17,6 17,17 10,25 C3,17 3,6 10,1Z" fill="#dbeba0"/><path d="M10,4 L10,22" stroke="#6f8e46" stroke-width=".9" fill="none"/>', 20, 26);
  const leafC = k.svg('<path d="M10,1 C17,6 17,17 10,25 C3,17 3,6 10,1Z" fill="#7da24a"/><path d="M10,4 L10,22" stroke="#e8f6b0" stroke-width=".9" fill="none"/>', 20, 26);
  const leaves = [leafA, leafB, leafC, leafA];

  // ── a puff of dust: rises and spreads from p, drifts by (dx, dy)
  const dustPuff = (p, t, size, dx, dy, o = 0.8, life = 900, cover = false) => {
    const r = Math.round(rand() * 360);
    fx(k.picIn('dust', p, size, size, { lit: false }), [[t, { transform: `rotate(${r}deg) scale(.35)`, opacity: 0 }, 'ease-out'], [t + life * 0.25, { transform: `${k.T(dx * 0.5, dy * 0.5)} rotate(${r + 20}deg) scale(.85)`, opacity: o }, 'ease-out'],
      [t + life, { transform: `${k.T(dx, dy)} rotate(${r + 45}deg) scale(1.5)`, opacity: 0 }]]);
  };

  // ── 0-900 gather: dust kicked up behind their feet, motes of light drawn to where they will meet
  [[84, 186], [104, 187], [90, 186]].forEach(([x, y], i) => dustPuff([x - 6, y - 2], 260 + i * 170, 16 + i * 2, -10 - i * 3, -8, 0.7, 700));
  [[256, 184], [232, 184], [244, 185]].forEach(([x, y], i) => dustPuff([x + 6, y - 2], 330 + i * 150, 15 + i * 2, 11 + i * 3, -7, 0.7, 700));
  dustPuff([170, 185], 560, 14, 8, -6, 0.65, 600);
  fx(k.lightIn('g-clash', [E[0], E[1] + 2], 50, 40), [[500, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [920, { transform: 'scale(.9)', opacity: 0.55 }, 'ease-in'], [1000, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [1220, { transform: 'scale(1.2)', opacity: 0.6 }, eio], [2300, { transform: 'scale(1)', opacity: 0.25 }, eio], [3300, { transform: 'scale(.7)', opacity: 0 }]]);
  for (let i = 0; i < 12; i++) {
    const t0 = 420 + i * 40 + rand() * 30, dur = 420 + rand() * 120, sz = 3 + rand() * 3, a = rand() * Math.PI * 2, r0 = 26 + rand() * 30;
    const from = [E[0] + Math.cos(a) * r0, E[1] + Math.sin(a) * r0 * 0.7 + 4], ks = [];
    for (let j = 0; j <= 4; j++) { const f = j / 4, g = f * f; ks.push([t0 + dur * f, { transform: `${k.T((E[0] - from[0]) * g, (E[1] - from[1]) * g)} scale(${(0.5 + 0.8 * Math.sin(Math.PI * f)).toFixed(2)})`, opacity: j === 0 || j === 4 ? 0 : 1 }, 'linear']); }
    fx(k.picIn('mote', from, sz, sz), ks);
  }

  // ── 1000 release: the crash
  const IM0 = 1000;
  fx(k.light('g-clash', E, 86), [[IM0 - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM0 + 40, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [IM0 + 260, { transform: 'scale(1.9)', opacity: 0.55 }, eio], [IM0 + 560, { transform: 'scale(1.5)', opacity: 0.4 }, eio], [IM0 + 1100, { transform: 'scale(1)', opacity: 0 }]]);
  fx(k.light('g-clash', E, 28), [[IM0 - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM0 + 30, { transform: 'scale(1.7)', opacity: 1 }], [IM0 + 190, { transform: 'scale(2.8)', opacity: 0 }]]);
  fx(k.picIn(burstSvg, E, 80, 80, { lit: true }), [[IM0 - 10, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [IM0 + 40, { transform: 'scale(.8) rotate(6deg)', opacity: 1 }, 'ease-out'], [IM0 + 330, { transform: 'scale(1.5) rotate(14deg)', opacity: 0 }]]);
  fx(k.pic(ring, E, 60, 60), [[IM0, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM0 + 50, { transform: 'scale(.45)', opacity: 0.95 }, 'ease-out'], [IM0 + 520, { transform: 'scale(1.6)', opacity: 0 }]]);
  fx(k.pic(ring, E, 60, 60), [[IM0 + 100, { transform: 'scale(.1)', opacity: 0 }, 'ease-out'], [IM0 + 160, { transform: 'scale(.3)', opacity: 0.6 }, 'ease-out'], [IM0 + 700, { transform: 'scale(1.1)', opacity: 0 }]]);
  // leaves flung every way from the meeting point, then drifting down
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + rand() * 0.5, sp = 22 + rand() * 40, t = IM0 + rand() * 50, life = 1100 + rand() * 900, r0 = Math.round(rand() * 360), sw = rand() < 0.5 ? 1 : -1, sz = 6 + rand() * 4;
    const px = (f) => Math.cos(a) * sp * Math.min(1, f * 2.6) * (1 + f * 0.25) + sw * Math.sin(f * 9 + i) * 3 * f, py = (f) => Math.sin(a) * sp * 0.8 * Math.min(1, f * 2.6) - 12 * Math.min(1, f * 3) + 62 * f * f;
    const ks = [0, 0.1, 0.3, 0.6, 1].map((f, j) => [t + life * f, { transform: `${k.T(px(f), py(f))} rotate(${Math.round(r0 + sw * 420 * f)}deg) scale(${(0.5 + 0.6 * Math.min(1, f * 8)).toFixed(2)})`, opacity: j === 0 ? 0 : j === 4 ? 0 : 1 }, j ? 'linear' : 'ease-out']);
    fx(k.pic(leaves[i % 4], E, sz, sz * 1.3, { lit: false }), ks);
  }
  // sparks of light thrown out
  for (let i = 0; i < 16; i++) {
    const a = -Math.PI * (0.02 + rand() * 0.96), v = 18 + rand() * 38, t = IM0 + rand() * 40, life = 450 + rand() * 450, sz = 3 + rand() * 3;
    const px = (f) => Math.cos(a) * v * f, py = (f) => Math.sin(a) * v * f + 34 * f * f;
    fx(k.pic('mote', E, sz, sz), [0, 0.3, 0.65, 1].map((f, j) => [t + life * f, { transform: `${k.T(px(f), py(f))} scale(${(1 - 0.7 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']));
  }
  // dust thrown up round the beasts, a ring of dust running out along the ground
  [[96, 184, -14], [118, 186, -8], [196, 186, 10], [220, 185, 14], [157, 187, 0], [140, 188, -4], [176, 188, 5]].forEach(([x, y, dx], i) => dustPuff([x, y], IM0 + 30 + i * 35, 18 + (i % 3) * 5, dx * 1.6, -8 - (i % 3) * 4, 0.8, 1100));
  for (const [sx, dly, o] of [[1, 0, 0.85], [-1, 20, 0.85]]) {
    fx(k.picIn('dust', [157, GY], 40, 22, { lit: false }), [[IM0 + dly, { transform: `scale(${0.2 * sx}, .3)`, opacity: 0 }, 'ease-out'], [IM0 + dly + 150, { transform: `${k.T(sx * 14, 0)} scale(${1.2 * sx}, .8)`, opacity: o }, 'ease-out'], [IM0 + dly + 800, { transform: `${k.T(sx * 62, -2)} scale(${2.6 * sx}, 1.3)`, opacity: 0 }]]);
  }
  fx(k.lightIn('g-clash', [157, GY - 2], 150, 24), [[IM0, { opacity: 0 }, 'ease-out'], [IM0 + 120, { opacity: 0.8 }, eio], [IM0 + 700, { opacity: 0.45 }, eio], [IM0 + 1400, { opacity: 0 }]]);

  // ── 1000 → 1450: the shockwave leaves for T: a stream of leaves and light on a low arc, a ring riding with it
  const IM = 1450;
  const dist = Math.hypot(T[0] - E[0], T[1] - E[1]);
  const bz = h.arcPath(E, T, 10 + Math.min(26, dist * 0.12));
  const ride = [[IM0 + 30, { transform: 'scale(.3, .3)', opacity: 0 }, 'ease-out']];
  for (let j = 0; j <= 8; j++) { const f = j / 8, p = bz(f * f * 0.4 + f * 0.6), ang = Math.atan2(T[1] - E[1], T[0] - E[0]); ride.push([IM0 + 80 + f * (IM - IM0 - 80), { transform: `${k.T(p[0] - E[0], p[1] - E[1])} rotate(${(ang * 180 / Math.PI).toFixed(0)}deg) scale(${(0.5 + 1.0 * f).toFixed(2)}, ${(0.9 + 0.5 * f).toFixed(2)})`, opacity: f < 0.9 ? 0.9 : 0.5 }, 'linear']); }
  ride.push([IM + 90, { transform: `${k.T(T[0] - E[0], T[1] - E[1])} scale(1.8, 1.4)`, opacity: 0 }]);
  fx(k.pic(ring, E, 34, 34), ride);
  fx(k.pic('star', E, 26, 26), [[IM0 + 20, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], ...[0, 1, 2, 3, 4, 5, 6].map((j) => { const f = j / 6, p = bz(f * f * 0.4 + f * 0.6); return [IM0 + 80 + f * (IM - IM0 - 80), { transform: `${k.T(p[0] - E[0], p[1] - E[1])} scale(${(1.4 - 0.4 * f).toFixed(2)}) rotate(${Math.round(f * 240)}deg)`, opacity: 1 }, 'linear']; }), [IM + 90, { transform: `${k.T(T[0] - E[0], T[1] - E[1])} scale(1.6) rotate(280deg)`, opacity: 0 }]]);
  for (let i = 0; i < 22; i++) {
    const t0 = IM0 + 40 + i * 20 + rand() * 20, t1 = IM + 60 + rand() * 90, sd = (rand() - 0.5) * 12, sz = 5 + rand() * 4, rr = Math.round(rand() * 360);
    const bz2 = (f) => { const p = bz(f); return [p[0], p[1] + sd * Math.sin(Math.PI * f)]; };
    const ks = [], n = 9;
    for (let j = 0; j <= n; j++) { const f = j / n, [x, y] = bz2(f * f * 0.45 + f * 0.55); ks.push([t0 + (t1 - t0) * f, { transform: `${k.T(x - E[0], y - E[1])} rotate(${Math.round(rr + f * 520)}deg) scale(${(0.6 + 0.6 * Math.sin(Math.PI * Math.min(1, f * 1.1))).toFixed(2)})`, opacity: j === 0 ? 0 : j === n ? 0.2 : 0.95 }, 'linear']); }
    fx(k.pic(i % 3 === 0 ? 'mote' : leaves[i % 4], E, i % 3 === 0 ? sz * 0.8 : sz, i % 3 === 0 ? sz * 0.8 : sz * 1.3, { lit: i % 3 === 0 }), ks);
  }

  // ── 1450 impact: a burst at T
  fx(k.light('g-clash', T, 70), [[IM - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(1.4)', opacity: 1 }, 'ease-out'], [IM + 250, { transform: 'scale(1.7)', opacity: 0.55 }, eio], [IM + 600, { transform: 'scale(1.3)', opacity: 0.35 }, eio], [IM + 1100, { transform: 'scale(1)', opacity: 0 }]]);
  fx(k.light('g-clash', T, 24), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.6)', opacity: 1 }], [IM + 200, { transform: 'scale(2.6)', opacity: 0 }]]);
  fx(k.pic(ring, T, 56, 56), [[IM, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(.4)', opacity: 0.95 }, 'ease-out'], [IM + 440, { transform: 'scale(1.1)', opacity: 0 }]]);
  fx(k.pic(ring, T, 56, 56), [[IM + 90, { transform: 'scale(.1)', opacity: 0 }, 'ease-out'], [IM + 150, { transform: 'scale(.3)', opacity: 0.6 }, 'ease-out'], [IM + 560, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.pic(burstSvg, T, 52, 52), [[IM - 10, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(.8) rotate(-6deg)', opacity: 1 }, 'ease-out'], [IM + 300, { transform: 'scale(1.4) rotate(-12deg)', opacity: 0 }]]);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + rand() * 0.4, d = 16 + rand() * 24, t = IM + rand() * 40, life = 800 + rand() * 700, r0 = Math.round(rand() * 360), sw = rand() < 0.5 ? 1 : -1, sz = 6 + rand() * 3;
    const ks = [0, 0.15, 0.5, 0.8, 1].map((f, j) => [t + life * f, { transform: `${k.T(Math.cos(a + sw * f * 0.6) * d * (0.3 + f), Math.sin(a + sw * f * 0.6) * d * 0.7 * (0.3 + f) + 22 * f * f - 8 * Math.min(1, f * 4))} rotate(${Math.round(r0 + sw * 400 * f)}deg) scale(${(0.5 + 0.6 * Math.min(1, f * 6)).toFixed(2)})`, opacity: j === 0 || j === 4 ? 0 : 1 }, j ? 'linear' : 'ease-out']);
    fx(k.pic(leaves[i % 4], T, sz, sz * 1.3, { lit: false }), ks);
  }
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI * (0.05 + rand() * 0.9), v = 14 + rand() * 26, t = IM + rand() * 40, life = 400 + rand() * 400, sz = 3 + rand() * 3;
    const px = (f) => Math.cos(a) * v * f, py = (f) => Math.sin(a) * v * f + 30 * f * f;
    fx(k.pic('mote', T, sz, sz), [0, 0.3, 0.65, 1].map((f, j) => [t + life * f, { transform: `${k.T(px(f), py(f))} scale(${(1 - 0.7 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']));
  }
  for (let i = 0; i < 4; i++) {
    const t = IM + 40 + i * 90, r = Math.round(rand() * 360), p = [T[0] + (i - 1.5) * 9, T[1] + 4], sz = 22 + rand() * 8;
    fx(k.pic('dust', p, sz, sz, { lit: false, low: true }), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 250, { transform: `${k.T((i - 1.5) * 6, -5)} rotate(${r + 20}deg) scale(1)`, opacity: 0.75 }, 'ease-out'], [t + 1000, { transform: `${k.T((i - 1.5) * 12, -16)} rotate(${r + 45}deg) scale(1.7)`, opacity: 0 }]]);
  }

  // ── 1000-3300 the strain: dust at their feet each time they lean in, leaves drifting down from the clash
  [1300, 1800, 2500].forEach((t, i) => {
    dustPuff([100 + i * 6, 186], t, 14 + i * 2, -10, -6, 0.6, 800);
    dustPuff([196 - i * 6, 186], t + 40, 14 + i * 2, 10, -6, 0.6, 800);
    fx(k.lightIn('g-clash', [E[0], E[1] + 4], 44, 34), [[t - 160, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [t + 20, { transform: 'scale(1.15)', opacity: 0.55 }, eio], [t + 380, { transform: 'scale(.9)', opacity: 0 }]]);
  });
  for (let i = 0; i < 9; i++) {
    const t = 1300 + i * 150 + rand() * 60, x = E[0] + (rand() - 0.5) * 70, y = E[1] - 14 + rand() * 12, r0 = Math.round(rand() * 360), sw = rand() < 0.5 ? 1 : -1, life = 1300 + rand() * 200;
    const ks = [0, 0.2, 0.5, 0.8, 1].map((f, j) => [t + life * f, { transform: `${k.T(sw * Math.sin(f * 7) * 7 + sw * 6 * f, 64 * f)} rotate(${Math.round(r0 + sw * 300 * f)}deg) scale(${(0.8 + 0.2 * f).toFixed(2)})`, opacity: j === 0 || j === 4 ? 0 : 0.95 }, j ? 'linear' : 'ease-out']);
    fx(k.picIn(leaves[i % 4], [x, y], 6, 8, { lit: false }), ks);
  }
}
