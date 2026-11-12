// Pitfall: the forest path gives way under the great horned aurochs, and the pit shuts over it.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: defender (suggestion changed from
// support: the Trap protects you: whatever charges you falls in), element: nature (kept).
// Alone, the "blows" are the charge coming down the path: three strikes on the pit's lips.
//   0-700     the gathering (BEATS.release): the ground trembles, the lip shudders, dust and leaves
//             lift off the edge and the pit's far wall glows green-gold; the beast rears a little as
//             it feels the earth go; the vines draw back, tense.
//   1200, 1600, 2000 (alone; else k.blows)  a blow meets the pit at its nearest guard point
//             (BEATS.impact: the first): a flash and a ring of light there, leaves flung up, dust
//             and sparks of green; the nearer vines whip in over the pit; the beast lurches deeper
//             (a jolt and a heave each time) and the lip jolts.
//   2400-2750 the vines close: a carpet of leaves races in from both edges and knits over the pit,
//             the beast gone to the neck, a great puff of dust and leaves.
//   3050-3700 the trap lets go: the carpet thins away, the vines unfurl, the beast heaves back
//             up to where it stood (BEATS.settle 3700), the glow goes out.
// Contract: each blow is read at its time `at` and snapped to the nearest `guard` point; the
// effects at a blow are on the overlay, built from that point, and the vines nearer it lash harder.
export const END = 4600;
export const BEATS = { release: 700, impact: 1200, settle: 3700 };
export const STILLS = [350, 900, 1230, 1500, 2000, 2800, 3300, 4100];

export const textures = {
  leaf: [24, 24, (x, y) => { const u = (x - 0.5) * 2, v = (y - 0.5) * 2, c = Math.cos(0.7), s = Math.sin(0.7), a = u * c + v * s, b = -u * s + v * c, r = (a * a) / 0.9 + (b * b) / 0.18, vein = Math.abs(b) < 0.05 ? 0.12 : 0; return [110 + 70 * (x > 0.5 ? 1 : 0) + 40 * vein, 160 + 40 * vein, 60, r < 1 ? Math.min(1, (1 - r) * 4) : 0]; }],
  leafy: [24, 24, (x, y) => { const u = (x - 0.5) * 2, v = (y - 0.5) * 2, c = Math.cos(-0.5), s = Math.sin(-0.5), a = u * c + v * s, b = -u * s + v * c, r = (a * a) / 0.9 + (b * b) / 0.2; return [196, 200, 100, r < 1 ? Math.min(1, (1 - r) * 4) : 0]; }],
  dust: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, n = 0.75 + 0.25 * Math.sin(x * 17 + y * 11) * Math.cos(y * 13 - x * 7); return [176, 168, 104, Math.max(0, 1 - r) * 0.8 * n]; }],
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226 + 29 * c * c, 255, 150 + 80 * c * c, Math.min(1, c * c * 1.8)]; }],
  carpet: [64, 32, (x, y) => { const u = (x - 0.5) * 2, v = (y - 0.5) * 2, r = Math.hypot(u, v * 1.1), n = Math.sin(x * 61 + y * 23) * Math.cos(y * 47 - x * 19), tone = 0.5 + 0.5 * n; return [74 + 50 * tone, 106 + 56 * tone, 48 + 20 * tone, Math.max(0, Math.min(1, (1 - r) * 5)) * 0.9]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, G = S.guard, PIT = S.pit;
  const near = (to) => G.reduce((b, g) => (Math.hypot(g[0] - to[0], g[1] - to[1]) < Math.hypot(b[0] - to[0], b[1] - to[1]) ? g : b), G[0]);
  const own = [{ at: 1200, to: G[2] }, { at: 1600, to: G[0] }, { at: 2000, to: G[1] }];
  const B = (k.blows || own).slice().sort((a, b) => a.at - b.at).map((b) => { const g = near(b.to), gi = G.indexOf(g); return { t: Math.max(800, Math.min(2200, b.at)), g, gi, wl: [1, 0.7, 0.2][gi], wr: [0.2, 0.7, 1][gi] }; });
  const last = B.at(-1).t, CLOSE = last + 400, FULL = CLOSE + 350, OPEN = Math.max(FULL + 300, 3000), HOME = Math.max(3700, OPEN + 450);

  k.css(`.g-leaf { border-radius: 50%; background: radial-gradient(closest-side, rgba(250,255,206,.95), rgba(196,238,120,.55) 28%, rgba(120,190,70,.2) 58%, rgba(90,170,60,0) 100%); }
    .g-pitglow { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,240,170,.55), rgba(170,220,100,.34) 50%, rgba(110,180,70,.12) 75%, rgba(90,170,60,0) 100%); }`);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1"/></filter></defs><circle cx="30" cy="30" r="25" fill="none" stroke="#e8ffb0" stroke-width="2.6" filter="url(#b)"/>', 60, 60);

  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  const grid = [];
  for (let t = 0; t <= HOME + 20; t += 40) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [HOME + 100, { transform: 'none' }]];
  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  // how deep the beast has gone (0 at rest, 1 closed over), a step with each blow
  const dp = [[0, 0], [700, 0]];
  B.forEach((b, i) => { dp.push([b.t - 20, dp.at(-1)[1]], [b.t + 260, (0.7 * (i + 1)) / B.length]); });
  dp.push([FULL, 1], [OPEN, 1], [HOME, 0]);
  const depth = curve(dp.filter((p, i, a) => i === 0 || p[0] > a[i - 1][0]));
  const rear = curve([[0, 0], [250, 0.2], [520, 1], [700, 0.55], [1000, 0.3], [HOME, 0]]);
  const jolt = (tau) => (tau < 0 ? 0 : (Math.exp(-tau / 170) * Math.sin((2 * Math.PI * tau) / 280)));
  const lash = (tau) => (tau < -100 ? 0 : tau < 0 ? -0.4 * Math.sin((Math.PI * (tau + 100)) / 100) : Math.exp(-tau / 240) * Math.cos((2 * Math.PI * tau) / 380) * sm(clamp01((tau + 15) / 60)));
  const calm = (t) => 1 - sm(clamp01((t - OPEN) / (HOME - OPEN)));

  // ── the beast: rears as the ground goes, lurches deeper at each blow, goes under, heaves back
  act(k.part('bull'), sample((t) => {
    let j = 0;
    for (const b of B) j += jolt(t - b.t);
    j *= calm(t);
    return { transform: `${k.T(-4 * depth(t) - 0.6 * j, 9 * depth(t) + 1.6 * Math.abs(j) - 1.6 * rear(t))} rotate(${(-7 * depth(t) + 2.6 * rear(t) - 1.4 * j).toFixed(2)}deg)` };
  }));
  // ── the lip: shudders as the ground gives, jolts at each blow, shivers as the carpet closes
  act(k.part('lip'), sample((t) => {
    let j = 0;
    for (const b of B) j += jolt(t - b.t);
    const trem = (sm(clamp01(t / 300)) * (1 - sm(clamp01((t - 700) / 400)))) * Math.sin(t / 26);
    const clo = sm(clamp01((t - CLOSE) / 200)) * (1 - sm(clamp01((t - FULL) / 400))) * Math.sin(t / 30);
    return { transform: `${k.T(0, 0.9 * trem + 0.8 * Math.abs(j) * calm(t) + 0.8 * clo)} scale(1, ${(1 + 0.012 * j * calm(t)).toFixed(4)})` };
  }));
  // ── the vines: draw back tensed, whip in over the pit at the blows near them, then close over it
  const vine = (name, w, sign) => {
    act(k.part(name), sample((t) => {
      let a = 0;
      for (const b of B) a += 15 * b[w] * lash(t - b.t) * calm(t);
      const shut = sm(clamp01((t - CLOSE) / 450)) * calm(t);
      const ang = sign * (-7 * sm(clamp01(t / 520)) * (1 - sm(clamp01((t - 700) / 300))) + a + 24 * shut);
      return { transform: `rotate(${ang.toFixed(2)}deg) scale(${(1 + 0.08 * shut).toFixed(3)})` };
    }));
  };
  vine('vinesL', 'wl', 1);
  vine('vinesR', 'wr', -1);

  // ── the gathering: the pit's far wall glows, dust and leaves lift off the edge
  const GL = curve([[0, 0], [700, 0.7], [CLOSE, 0.85], [FULL, 1], [OPEN, 0.8], [HOME, 0]]);
  fx(k.lightIn('g-pitglow', PIT, 210, 76), [...grid.filter((t) => t >= 40).map((t) => [t, { transform: `scale(${(0.85 + 0.2 * GL(t)).toFixed(3)})`, opacity: +(GL(t) * 0.85).toFixed(3) }, 'linear']), [HOME + 100, { transform: 'scale(.85)', opacity: 0 }]]);
  for (let i = 0; i < 14; i++) {
    const t0 = 60 + Math.round(rand() * 560), side = i % 2 ? 1 : -1, x = PIT[0] + side * (30 + rand() * 54), y = PIT[1] + 8 + rand() * 12, r = Math.round(rand() * 360), sz = 4 + rand() * 3;
    fx(k.picIn(i % 3 ? 'leaf' : 'leafy', [x, y], sz, sz), [[t0, { transform: `rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t0 + 300, { transform: `${k.T(side * 2, -8 - rand() * 6)} rotate(${r + 60}deg) scale(1)`, opacity: 0.95 }, eio],
      [t0 + 900, { transform: `${k.T(side * (6 + rand() * 6), -24 - rand() * 10)} rotate(${r + 160}deg) scale(.9)`, opacity: 0.9 }, 'ease-in'], [t0 + 1500, { transform: `${k.T(side * (10 + rand() * 8), -2)} rotate(${r + 240}deg) scale(.7)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 8; i++) {
    const t0 = 100 + Math.round(rand() * 560), x = PIT[0] - 70 + rand() * 140, r = Math.round(rand() * 360);
    fx(k.picIn('dust', [x, PIT[1] + 14 + rand() * 8], 18, 18, { lit: false }), [[t0, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 400, { transform: `${k.T((rand() - 0.5) * 8, -8)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t0 + 1300, { transform: `${k.T((rand() - 0.5) * 16, -26)} rotate(${r + 50}deg) scale(1.8)`, opacity: 0 }]]);
  }

  // ── each blow: a flash and ring at the guard, leaves flung up, dust and sparks of green
  for (const b of B) {
    const [gx, gy] = b.g, t = b.t;
    fx(k.light('g-leaf', b.g, 60), [[t - 50, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [t + 300, { transform: 'scale(.9)', opacity: 0.55 }, eio], [t + 800, { transform: 'scale(1.05)', opacity: 0 }]]);
    [[0, 3.2, 0.9], [130, 4.4, 0.5]].forEach(([d, big, o]) => fx(k.pic(ring, b.g, 30, 30, { low: true }), [[t + d, { transform: 'scale(.3, .15)', opacity: 0 }, 'ease-out'], [t + d + 40, { transform: 'scale(.6, .3)', opacity: o }, 'ease-out'], [t + d + 650, { transform: `scale(${big}, ${(big * 0.5).toFixed(2)})`, opacity: 0 }]]));
    for (let i = 0; i < 12; i++) {
      const a = -Math.PI * (0.1 + 0.8 * rand()), d = 14 + rand() * 28, t0 = t + Math.round(rand() * 60), sz = 4.5 + rand() * 3, r = Math.round(rand() * 360), px = Math.cos(a) * d, py = Math.sin(a) * d;
      fx(k.pic(i % 3 ? 'leaf' : 'leafy', b.g, sz, sz), [[t0, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 110, { transform: `${k.T(px * 0.55, py * 0.55)} rotate(${r + 70}deg) scale(1)`, opacity: 1 }, 'ease-out'],
        [t0 + 420, { transform: `${k.T(px, py - 4)} rotate(${r + 190}deg) scale(1)`, opacity: 1 }, 'ease-in'], [t0 + 850 + Math.round(rand() * 250), { transform: `${k.T(px * 1.25, py + 16 + rand() * 10)} rotate(${r + 300}deg) scale(.8)`, opacity: 0 }]]);
    }
    for (let i = 0; i < 10; i++) {
      const a = rand() * Math.PI * 2, d = 8 + rand() * 20, t0 = t + Math.round(rand() * 120), sz = 2.4 + rand() * 2.6;
      fx(k.pic('mote', b.g, sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 90, { transform: `${k.T(Math.cos(a) * d * 0.4, Math.sin(a) * d * 0.4)} scale(1)`, opacity: 1 }, 'ease-out'], [t0 + 700 + Math.round(rand() * 400), { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d * 0.6 - 14 - rand() * 12)} scale(.3)`, opacity: 0 }]]);
    }
    for (let i = 0; i < 4; i++) {
      const r = Math.round(rand() * 360), t0 = t + 30 + i * 60;
      fx(k.picIn('dust', [gx + (rand() - 0.5) * 20, gy + 2], 20, 20, { lit: false }), [[t0, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 300, { transform: `${k.T((rand() - 0.5) * 8, -8)} rotate(${r + 20}deg) scale(1)`, opacity: 0.6 }], [t0 + 1200, { transform: `${k.T((rand() - 0.5) * 16, -28)} rotate(${r + 50}deg) scale(2)`, opacity: 0 }]]);
    }
  }

  // ── the trap shuts: a carpet of leaves races in from both edges and knits over the pit; leaves rush in
  fx(k.picIn('carpet', [PIT[0], PIT[1] - 2], 176, 46), [[CLOSE - 60, { transform: 'scale(.1, .5)', opacity: 0 }, 'ease-in'], [CLOSE + 120, { transform: 'scale(.5, .8)', opacity: 0.55 }, 'ease-out'], [FULL, { transform: 'scale(1, 1)', opacity: 0.8 }], [OPEN, { transform: 'scale(1, 1)', opacity: 0.8 }, eio], [HOME - 150, { transform: 'scale(1.02, 1)', opacity: 0 }]]);
  for (let i = 0; i < 14; i++) {
    const side = i % 2 ? 1 : -1, [sx, sy] = [PIT[0] + side * (78 + rand() * 8), PIT[1] + 4 + (rand() - 0.5) * 14], t0 = CLOSE - 80 + Math.round(rand() * 260), r = Math.round(rand() * 360), sz = 5 + rand() * 3;
    const ex = (rand() - 0.5) * 50, ey = (rand() - 0.5) * 8;
    fx(k.pic(i % 3 ? 'leaf' : 'leafy', [sx, sy], sz, sz), [[t0, { transform: `${k.T(0, 4)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t0 + 140, { transform: `${k.T(-side * 14, -6)} rotate(${r + 90}deg) scale(1)`, opacity: 1 }, 'linear'],
      [t0 + 420, { transform: `${k.T(-side * 78 + ex, ey)} rotate(${r + 250}deg) scale(1)`, opacity: 1 }, 'ease-in'], [t0 + 520, { transform: `${k.T(-side * 78 + ex, ey + 1)} rotate(${r + 270}deg) scale(.7)`, opacity: 0 }]]);
  }
  // the thud as it shuts: a puff of dust and leaves from the middle, a light
  fx(k.light('g-leaf', PIT, 90), [[FULL - 60, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [FULL + 50, { transform: 'scale(1.2)', opacity: 0.9 }, 'ease-out'], [FULL + 250, { transform: 'scale(1.05)', opacity: 0.3 }, eio], [OPEN, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.pic(ring, PIT, 40, 40, { low: true }), [[FULL - 20, { transform: 'scale(.4, .2)', opacity: 0 }, 'ease-out'], [FULL + 30, { transform: 'scale(1, .5)', opacity: 0.8 }, 'ease-out'], [FULL + 700, { transform: 'scale(4.4, 2.2)', opacity: 0 }]]);
  for (let i = 0; i < 6; i++) {
    const r = Math.round(rand() * 360), t0 = FULL - 20 + i * 60, x = PIT[0] + (rand() - 0.5) * 100;
    fx(k.picIn('dust', [x, PIT[1] + 2], 26, 26, { lit: false, low: true }), [[t0, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 320, { transform: `${k.T((rand() - 0.5) * 8, -12)} rotate(${r + 20}deg) scale(1)`, opacity: 0.6 }], [t0 + 1400, { transform: `${k.T((rand() - 0.5) * 18, -42)} rotate(${r + 50}deg) scale(2.1)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 14; i++) {
    const a = -Math.PI * (0.05 + 0.9 * rand()), d = 24 + rand() * 38, t0 = FULL + Math.round(rand() * 120), r = Math.round(rand() * 360), sz = 4.5 + rand() * 3, px = Math.cos(a) * d, py = Math.sin(a) * d * 0.9;
    fx(k.pic(i % 3 ? 'leaf' : 'leafy', PIT, sz, sz), [[t0, { transform: `${k.T(0, 6)} rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 150, { transform: `${k.T(px * 0.5, py * 0.5)} rotate(${r + 80}deg) scale(1)`, opacity: 1 }, 'ease-out'], [t0 + 520, { transform: `${k.T(px, py - 4)} rotate(${r + 200}deg) scale(1)`, opacity: 1 }, 'ease-in'], [t0 + 1100 + Math.round(rand() * 300), { transform: `${k.T(px * 1.2, py + 30)} rotate(${r + 330}deg) scale(.8)`, opacity: 0 }]]);
  }
  // as it lets go: motes rise off the pit and thin away
  for (let i = 0; i < 12; i++) {
    const t0 = OPEN + Math.round(rand() * 400), x = PIT[0] - 60 + rand() * 120, sz = 2.4 + rand() * 2.4;
    fx(k.picIn('mote', [x, PIT[1] + 2 + rand() * 8], sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 160, { transform: `${k.T(0, -4)} scale(1)`, opacity: 0.9 }, 'ease-out'], [t0 + 900, { transform: `${k.T((rand() - 0.5) * 10, -26 - rand() * 14)} scale(.3)`, opacity: 0 }]]);
  }
}
