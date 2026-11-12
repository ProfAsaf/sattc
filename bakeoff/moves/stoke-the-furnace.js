// Stoke the Furnace: feed it today; it feeds you forever.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker (a damage spell: the
// furnace's fire is the attack), element: fire.
//   0-880     the smith draws the poker back, leaning away, gathering himself; the
//             furnace glows harder with his waiting, its fire in the chimney swelling.
//   880-1000  he lunges: the poker is driven into the furnace's mouth.
//   1000-1380 the mouth flares white, sparks spit out over his hands, a ring leaves the
//             mouth, and a white-hot surge races up the chimney.
//   1380      RELEASE: the fire bursts from the chimney's top, roars up, and a great ball
//             of flame is flung out over the sky with a tail of tongues and billows.
//   1800      IMPACT at T: a flash, rings, a burst of fire and sparks, burning embers
//             falling, smoke rolling away (a scorch if T is low).
//   1800-3600 the smith steps back, the furnace roars down, the chimney fire settles,
//             sparks go on rising from the top and the light dies down.
//   3600      at rest as drawn (BEATS.settle); the move ends at END.
//
// The contract (bakeoff/recipe.md): T = k.aim, or its own spot (the sky to its left).
// Every point of the fire's flight is worked out from the chimney's top (spec.emit) and T.
export const END = 4300;
export const BEATS = { release: 1380, impact: 1800, settle: 3600 };
export const STILLS = [600, 950, 1150, 1400, 1650, 1850, 2600, 3900];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, h = Math.max(0, 1 - r); return [255, 200 + 55 * h * h, 110 + 130 * h * h * h, Math.min(1, h * h * 1.8)]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const E0 = k.spec.emit, M = k.spec.mouth, TIP = k.spec.tip, F = k.spec.feet, STK = k.spec.stack;
  const T = k.aim || k.spec.alone;
  const REL = 1380, FLY = 420, IMP = REL + FLY;
  const rad = (d) => (d * Math.PI) / 180;
  k.css(`.g-white { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,252,232,.98), rgba(255,226,150,.6) 30%, rgba(255,150,60,.2) 62%, rgba(255,120,40,0) 100%); }`);
  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  // ── the smith: draws back, lunges, holds, steps back
  const SX = curve([[0, 0], [200, 0], [700, -4.5], [880, -5.5], [1000, 7], [1100, 8.5], [1400, 6], [2300, 2.5], [3300, 0.3], [3600, 0]]);
  const SR = curve([[0, 0], [200, 0], [700, -3], [880, -4], [1000, 3.5], [1100, 4], [1400, 3], [2300, 1], [3600, 0]]);
  const grid = [];
  for (let t = 0; t <= 3600; t += 40) grid.push(t);
  const smithTf = (t) => `${k.T(SX(t), 0)} rotate(${SR(t).toFixed(2)}deg)`;
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3700, { transform: 'none' }]];
  act(k.part('smith'), sample((t) => ({ transform: smithTf(t) })));
  act(k.part('tip'), sample((t) => ({ transform: smithTf(t) })));
  const onSmith = (p, t) => { const a = rad(SR(t)), c = Math.cos(a), s = Math.sin(a), vx = p[0] - F[0], vy = p[1] - F[1]; return [F[0] + vx * c - vy * s + SX(t), F[1] + vx * s + vy * c]; };
  // ── the furnace's mouth surges; the chimney fire swells, and roars at the release
  const MS = curve([[0, 1], [700, 1.03], [1000, 1.12], [1100, 1.12], [1450, 1.04], [2300, 1.02], [3400, 1]]);
  act(k.part('mouth'), sample((t) => ({ transform: `scale(${(MS(t) + (t > 800 && t < 2400 ? 0.025 * Math.sin(t / 60) : 0)).toFixed(3)})` })));
  const SY = curve([[0, 1], [500, 1], [1000, 1.18], [1300, 1.3], [1380, 1.75], [1550, 1.5], [2100, 1.22], [3000, 1.05], [3600, 1]]);
  const SXS = curve([[0, 1], [1000, 1.06], [1380, 1.25], [1550, 1.16], [2100, 1.06], [3600, 1]]);
  const flick = (t) => (t > 350 && t < 3300 ? 0.05 * sm(Math.min(1, (t - 350) / 400)) * Math.sin(t / 61) * Math.min(1, (3300 - t) / 600) : 0);
  act(k.part('stack'), sample((t) => ({ transform: `scale(${(SXS(t) - flick(t) * 0.8).toFixed(4)}, ${(SY(t) + flick(t)).toFixed(4)})` })));

  // ── the light: the furnace's, spilling over the smith and the ground; the chimney's, up in the sky
  const HEAT = curve([[0, 0.2], [700, 0.55], [1000, 1], [1300, 0.9], [1450, 1], [2300, 0.6], [3200, 0.2], [3700, 0]]);
  fx(k.lightIn('g-warm', [196, 168], 140, 110), sample((t) => ({ transform: `scale(${(0.75 + 0.35 * HEAT(t)).toFixed(3)})`, opacity: +Math.min(1, HEAT(t) * 0.95).toFixed(3) })).slice(0, -1));
  const SKY = curve([[300, 0], [1000, 0.4], [1380, 1], [1700, 0.8], [2500, 0.5], [3300, 0.1], [3700, 0]]);
  fx(k.lightIn('g-warm', [204, 30], 170, 130), grid.filter((t) => t >= 300).map((t) => [t, { transform: `scale(${(0.7 + 0.5 * SKY(t)).toFixed(3)})`, opacity: +SKY(t).toFixed(3) }, 'linear']));
  // it spills on the smith (riding him) and on the ground in front of the furnace
  const SPILL = curve([[200, 0], [880, 0.5], [1050, 1], [1450, 0.9], [2300, 0.5], [3200, 0.12], [3600, 0]]);
  const spill = [128, 150];
  fx(k.lightIn('g-warm', spill, 70, 90), grid.filter((t) => t >= 200).map((t) => { const q = onSmith(spill, t); return [t, { transform: `${k.T(q[0] - spill[0], q[1] - spill[1])} scale(${(0.7 + 0.4 * SPILL(t)).toFixed(3)})`, opacity: +(SPILL(t) * 0.85).toFixed(3) }, 'linear']; }));
  fx(k.lightIn('g-warm', [150, 192], 130, 30), [[300, { opacity: 0 }, 'ease-out'], [1050, { opacity: 0.9 }, eio], [2300, { opacity: 0.5 }, eio], [3500, { opacity: 0 }]]);
  // the poker's tip: white-hot as it goes in
  const TIPL = curve([[500, 0], [880, 0.5], [1040, 1], [1400, 0.7], [2000, 0.2], [2600, 0]]);
  fx(k.lightIn('g-white', TIP, 34, 34), grid.filter((t) => t >= 500 && t <= 2700).map((t) => { const q = onSmith(TIP, t); return [t, { transform: `${k.T(q[0] - TIP[0], q[1] - TIP[1])} scale(${(0.5 + 0.9 * TIPL(t)).toFixed(3)})`, opacity: +TIPL(t).toFixed(3) }, 'linear']; }));
  // the mouth flares white
  fx(k.lightIn('g-white', [M[0], M[1] + 2], 70, 70), [[900, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1040, { transform: 'scale(1.2)', opacity: 1 }], [1180, { transform: 'scale(1)', opacity: 0.85 }, eio], [1500, { transform: 'scale(1.15)', opacity: 0.6 }, eio], [2100, { transform: 'scale(.8)', opacity: 0 }]]);

  // ── rings: at the mouth as the poker goes in, at the chimney's top at the release, at the landing
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1"/></filter></defs><circle cx="30" cy="30" r="25" fill="none" stroke="#ffc878" stroke-width="2.6" filter="url(#b)"/>', 60, 60);
  const ringAt = (t0, big, o, c, dur = 600, flat = 1, sz = 40) => fx(k.pic(ring, c, sz, sz, { low: true }), [[t0, { transform: `scale(.5, ${(0.5 * flat).toFixed(2)})`, opacity: 0 }, 'ease-out'], [t0 + 40, { transform: `scale(.8, ${(0.8 * flat).toFixed(2)})`, opacity: o }, 'ease-out'], [t0 + dur, { transform: `scale(${big}, ${(big * flat).toFixed(2)})`, opacity: 0 }]]);
  ringAt(1010, 1.9, 0.8, [M[0], M[1] - 4], 600, 1, 36);
  ringAt(1100, 1.2, 0.5, [M[0], M[1] - 4], 500, 1, 36);
  ringAt(REL, 3.4, 0.9, E0, 750, 0.55, 50);
  ringAt(REL + 90, 2.2, 0.6, E0, 560, 0.55, 50);

  // ── sparks spat out of the mouth over his hands as the poker goes in
  for (let i = 0; i < 16; i++) {
    const t0 = 1000 + Math.round(rand() * 160), a = -Math.PI * (0.35 + 0.55 * rand()), d = 16 + rand() * 34, g = 14 + rand() * 18, sz = 3 + rand() * 3;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * d * f, Math.sin(a) * d * f + g * f * f)} scale(${sc})`, opacity: o });
    fx(k.pic('spark', [M[0] - 8, M[1] - 2], sz, sz), [[t0, P(0, 0.6, 0), 'ease-out'], [t0 + 40, P(0.2, 1.1, 1), 'ease-out'], [t0 + 320, P(0.8, 0.9, 0.9), 'ease-in'], [t0 + 560 + Math.round(rand() * 200), P(1, 0.3, 0)]]);
  }
  // ── the surge up the chimney: a white-hot glow racing up from the mouth to the top
  const rise = [[1040, { transform: `${k.T(0, 0)} scale(.6)`, opacity: 0 }, 'ease-out'], [1100, { transform: `${k.T(0, -4)} scale(1)`, opacity: 0.95 }, 'ease-in']];
  const dTop = (M[1] - 10) - E0[1];
  for (let j = 1; j <= 4; j++) rise.push([Math.round(1100 + (REL - 1100) * j / 4), { transform: `${k.T(0, -dTop * j / 4)} scale(${(1 - 0.12 * j).toFixed(2)})`, opacity: 0.95 }, 'linear']);
  rise.push([REL + 60, { transform: `${k.T(0, -dTop)} scale(1.6)`, opacity: 0 }]);
  fx(k.lightIn('g-white', [204, M[1] - 10], 40, 40), rise);
  fx(k.lightIn('g-warm', [204, M[1] - 10], 60, 90), rise.map(([t, v, e]) => [t, { ...v, opacity: (v.opacity ?? 1) * 0.7 }, e]));

  // ── the chimney roars: tongues of flame rising off the top
  const lick = (on, off, dx, w, h, hot) => {
    const L = [[on, { transform: 'scale(.5, .1)', opacity: 0 }, 'ease-out'], [on + 160, { transform: 'scale(1,1)', opacity: 0.9 * hot }, eio]];
    for (let t = on + 160, i = 0; (t += 90 + rand() * 60) < off; i++) L.push([Math.round(t), { transform: `translateY(${(-rand() * 2).toFixed(1)}px) scale(${(0.9 + (i % 2) * 0.22 - rand() * 0.06).toFixed(2)}, ${(1 + (i % 2 ? 0.18 : -0.1) + rand() * 0.1).toFixed(2)}) skewX(${((i % 2 ? 1 : -1) * (2 + rand() * 4)).toFixed(1)}deg)`, opacity: +(hot * (0.8 + rand() * 0.2)).toFixed(2) }, eio]);
    L.push([off, { transform: 'scale(.5, .1)', opacity: 0 }]);
    fx(k.picIn(rand() < 0.5 ? 'flame' : 'flame2', [E0[0] + dx, E0[1] + 4], w, h, { base: true }), L);
  };
  lick(1000, 1500, -14, 14, 26, 0.7); lick(1060, 1500, 14, 14, 26, 0.7);
  lick(REL, 2400, -16, 16, 46, 1); lick(REL + 20, 2600, 0, 20, 58, 1); lick(REL + 40, 2500, 16, 16, 46, 1); lick(REL + 80, 2200, -6, 12, 36, 0.9); lick(REL + 100, 2300, 8, 12, 36, 0.9);

  // ── the ball of fire, from the chimney's top to T: a high arc, a head, a tail of tongues, billows, sparks
  const L = Math.hypot(T[0] - E0[0], T[1] - E0[1]), ang = (Math.atan2(T[1] - E0[1], T[0] - E0[0]) * 180) / Math.PI;
  const C = [(E0[0] + T[0]) / 2, (E0[1] + T[1]) / 2 - Math.min(34, 8 + L * 0.22)];
  const bz = (t) => { const q = 1 - t; return [q * q * E0[0] + 2 * q * t * C[0] + t * t * T[0], q * q * E0[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const bzAng = (t) => { const q = 1 - t, dx = 2 * q * (C[0] - E0[0]) + 2 * t * (T[0] - C[0]), dy = 2 * q * (C[1] - E0[1]) + 2 * t * (T[1] - C[1]); return (Math.atan2(dy, dx) * 180) / Math.PI; };
  const [X0, Y0] = k.P(...E0);
  const along = (tex, t0, dur, lat, sz, sc0, sc1, o, spin = 0, drop = 0, face = null) => {
    const kf = [];
    for (let j = 0; j <= 9; j++) {
      const f = j / 9, w = Math.pow(f, 0.9), q = bz(w), [x, y] = k.P(...q), off = lat * Math.sin(Math.PI * w) * u + drop * f * f * u, s = sc0 + (sc1 - sc0) * f;
      const r = face === null ? spin * f : bzAng(w) + face;
      kf.push([Math.round(t0 + dur * f), { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + off).toFixed(1)}px) rotate(${r.toFixed(0)}deg) scale(${s.toFixed(2)})`, opacity: j === 0 ? 0 : j === 9 ? 0.85 * o : o }, j < 9 ? 'linear' : 'ease-out']);
    }
    kf.push([Math.round(t0 + dur + 60), { ...kf.at(-1)[1], opacity: 0 }]);
    return kf;
  };
  const flyer = (tex, w, h, kf, o) => fx(k.pic(tex, E0, w, h, o), kf);
  flyer('puffHot', 46, 46, along('puffHot', REL, FLY, 0, 46, 0.7, 1.15, 1, 40));
  flyer('puffHot', 28, 28, along('puffHot', REL + 8, FLY - 12, 0, 28, 0.9, 0.85, 1, -30));
  flyer('spark', 18, 18, along('spark', REL, FLY, 0, 18, 1.3, 1, 1));
  for (let i = 0; i < 7; i++) flyer(i % 2 ? 'flame' : 'flame2', 16, 30, along('flame', REL + 14 + i * 28, FLY - 40 + i * 12, (rand() - 0.5) * 6, 30, 0.9, 0.5, 0.85, 0, 0, 90));
  for (let i = 0; i < 9; i++) flyer(i % 3 === 2 ? 'puffCool' : 'puff', 24, 24, along('puff', REL + 20 + i * 28, FLY - 20 + i * 14, (rand() - 0.5) * 9, 24, 0.9, 0.5, 0.8, (rand() - 0.5) * 90, 3 + rand() * 4));
  for (let i = 0; i < 14; i++) flyer('spark', 7, 7, along('spark', REL + 10 + Math.round(rand() * 220), FLY - 20 + Math.round(rand() * 120), (rand() - 0.5) * 20, 7, 1, 0.6, 0.95, 0, 6 + rand() * 14));

  // ── where it lands (BEATS.impact)
  const il = [[IMP - 50, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 40, { transform: 'scale(1.3)', opacity: 1 }]];
  for (let t = IMP + 170, i = 0; t < 2700; t += 120, i++) il.push([t, { transform: `scale(${i % 2 ? 1.12 : 0.94})`, opacity: i % 2 ? 0.8 : 0.55 }, eio]);
  il.push([3300, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.light('g-warm', T, 130), il);
  fx(k.light('g-white', T, 64), [[IMP - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 30, { transform: 'scale(1.3)', opacity: 1 }], [IMP + 280, { transform: 'scale(.8)', opacity: 0 }]]);
  ringAt(IMP, 3, 0.9, T, 680, 1, 44);
  ringAt(IMP + 100, 1.9, 0.6, T, 540, 1, 44);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + (rand() - 0.5) * 0.4, d = 14 + rand() * 14, t0 = IMP + Math.round(rand() * 40), sz = 20 + rand() * 8;
    const P = (f, s, o) => ({ transform: `${k.T(Math.cos(a) * d * f * 1.3, Math.sin(a) * d * f)} rotate(${Math.round(f * 60)}deg) scale(${s})`, opacity: o });
    fx(k.pic(i % 3 === 2 ? 'puffCool' : 'puffHot', T, sz, sz), [[t0, P(0, 0.3, 0), 'ease-out'], [t0 + 60, P(0.35, 0.9, 0.95), 'ease-out'], [t0 + 280, P(1, 1.4, 0.55)], [t0 + 540, P(1.25, 1.8, 0)]]);
  }
  for (let i = 0; i < 22; i++) {
    const a = rand() * Math.PI * 2, dist = 16 + rand() * 44, g = 16 + rand() * 22, sz = 3 + rand() * 4, t0 = IMP + Math.round(rand() * 50);
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * dist * f * 1.3, Math.sin(a) * dist * f + g * f * f)} scale(${sc})`, opacity: o });
    fx(k.pic('spark', T, sz, sz), [[t0, P(0, 0.6, 0), 'ease-out'], [t0 + 40, P(0.2, 1.1, 1), 'ease-out'], [t0 + 320, P(0.7, 0.9, 0.9), 'ease-in'], [Math.round(t0 + 600 + rand() * 300), P(1, 0.3, 0)]]);
  }
  // burning embers raining down from where it burst
  for (let i = 0; i < 9; i++) {
    const t0 = IMP + 100 + Math.round(rand() * 400), x = (rand() - 0.5) * 36, y = (rand() - 0.5) * 14, sz = 3 + rand() * 3, fall = 30 + rand() * 36;
    fx(k.pic('spark', [T[0] + x, T[1] + y], sz, sz), [[t0, { transform: `${k.T(0, 0)} scale(.6)`, opacity: 0 }, 'ease-out'], [t0 + 60, { transform: `${k.T(x * 0.05, 2)} scale(1)`, opacity: 0.95 }, 'ease-out'], [t0 + 900, { transform: `${k.T(x * 0.15, fall)} scale(.4)`, opacity: 0 }, 'ease-in']]);
  }
  if (T[1] > 125) {
    const sr = ((rand() - 0.5) * 16).toFixed(1), sc = (o, s) => ({ transform: `rotate(${sr}deg) scale(${s}, ${(s * 0.5).toFixed(2)})`, opacity: o });
    fx(k.pic('scorch1:char', T, 60, 60, { lit: false }), [[IMP, sc(0, 0.15), 'cubic-bezier(.2,.7,.4,1)'], [IMP + 260, sc(1, 1)], [3000, sc(1, 1), eio], [3600, sc(0, 1)]]);
    fx(k.pic('scorch1:glow', T, 60, 60), [[IMP, sc(0, 0.15), 'cubic-bezier(.2,.7,.4,1)'], [IMP + 260, sc(0.95, 1)], [2800, sc(0.4, 1), eio], [3300, sc(0, 1)]]);
  }
  for (let i = 0; i < 5; i++) {
    const t = IMP + 250 + i * 190, r = Math.round(rand() * 360), x = (rand() - 0.5) * 14;
    fx(k.pic('smoke', [T[0] + x, T[1] - 4], 32, 32, { lit: false, low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 320, { transform: `${k.T(-2, -10)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 1250, { transform: `${k.T(-8, -40)} rotate(${r + 50}deg) scale(2)`, opacity: 0 }]]);
  }
  // sparks and smoke go on rising from the chimney's top after the throw
  for (let i = 0; i < 16; i++) {
    const t0 = REL + 100 + Math.round(rand() * 1100), dx = (rand() - 0.2) * 46, dy = -(18 + rand() * 40), sz = 3 + rand() * 3, x = (rand() - 0.5) * 24;
    fx(k.pic('spark', [E0[0] + x, E0[1]], sz, sz), [[t0, { transform: `${k.T(0, 0)} scale(.5)`, opacity: 0 }, 'ease-out'], [t0 + 60, { transform: `${k.T(dx * 0.1, dy * 0.15)} scale(1)`, opacity: 1 }, 'ease-out'], [t0 + 800, { transform: `${k.T(dx, dy)} scale(.3)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 4; i++) {
    const t = REL + 300 + i * 330, r = Math.round(rand() * 360);
    fx(k.picIn('smoke', [E0[0] + (rand() - 0.5) * 14, E0[1] - 8], 34, 34, { lit: false, low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 360, { transform: `${k.T(0, -8)} rotate(${r + 20}deg) scale(1)`, opacity: 0.4 }], [t + 1300, { transform: `${k.T(-4, -30)} rotate(${r + 50}deg) scale(1.9)`, opacity: 0 }]]);
  }
  void STK;
}
