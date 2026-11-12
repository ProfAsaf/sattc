// Grave Harvest: he hauls the bulbs out of the grave, and throws them: they burst where they land.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support (Draw a card; with an Offering, draw
// three: the three bulbs), element: nature (bulbs and roots; the suggestion stands). He faces right, hands
// out to the grave's side. Aimed: the bulbs go to T = k.aim, or, alone, across to the lantern on its post
// (`alone`). If T is behind him he throws them over his shoulder; he does not turn.
//   0-1400    the gather: he plants his feet and leans back, arms drawing up, the roots going taut and the bulbs
//             swinging, the light in the grave mouth swelling, motes rising from it.
//   1450      the heave: he flings his weight back, the roots rip out of the earth: a flare from the grave,
//             clods and root-fibres thrown up, the bulbs blazing.
//   1580      RELEASE: he swings forward and lets go: the three bulbs leave his fists (his own fade), each
//             trailing pale roots and spores along its own arc to T.
//   2000      IMPACT: they burst at T: violet light, a ring, spores; three lights rise, glow and go out (the
//             cards drawn); sparks and motes.
//   2200-3300 he straightens and settles; the grave's light comes back; the bulbs and their roots grow back in
//             his fists.
//   3700      at rest as drawn (BEATS.settle); the move ends at END.
// Contract: T = k.aim || alone; each bulb's arc is worked out from where it is in his fists at the throw
// (his chain of motion: feet, shoulder, fists) to T; everything that flies or lands is on the overlay.
export const END = 4200;
export const BEATS = { release: 1580, impact: 2000, settle: 3700 };
export const STILLS = [600, 1200, 1480, 1620, 1800, 2050, 2700, 3900];

export const textures = {
  bulb: [32, 40, (x, y) => {
    // an onion: round below, drawn up to a point; white core, violet rim
    const u = (x - 0.5) * 2, v = (y - 0.58) * 2;
    const w = v < 0 ? Math.max(0, 1 + v * 1.15) ** 0.9 * 0.9 : Math.sqrt(Math.max(0, 1 - v * v)) * 0.9;
    const r = Math.abs(u) / Math.max(0.001, w);
    if (r > 1 || v < -0.85 || v > 0.95) return [0, 0, 0, 0];
    const a = Math.min(1, (1 - r) * 8), hi = Math.max(0, 1 - Math.hypot(x - 0.42, y - 0.5) * 2.6);
    const c = Math.min(1, hi * 1.2 + (1 - r) * 0.35);
    return [122 + 133 * c, 68 + 170 * c, 208 + 47 * c, a];
  }],
  glow: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [200, 160, 255, Math.min(1, c * c * 1.7)]; }],
  spore: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226, 204, 255, Math.min(1, c * c * 1.6)]; }],
  spark: [32, 32, (x, y) => {
    const dx = Math.abs(x - 0.5) * 2, dy = Math.abs(y - 0.5) * 2, c = Math.max(0, 1 - Math.hypot(dx, dy)), cross = Math.max(0, 1 - Math.min(dx * 7 + dy, dy * 7 + dx));
    const v = Math.min(1, c * c * 1.6 + cross * 0.9); return [226 + 29 * v, 204 + 51 * v, 255, v];
  }],
  clod: [24, 24, (x, y) => {
    const r = Math.hypot(x - 0.5, (y - 0.5) * 1.2) * 2, n = 0.5 + 0.5 * Math.sin(x * 23 + y * 13) * Math.cos(y * 19 - x * 9);
    if (r > 0.78 + 0.18 * n) return [0, 0, 0, 0];
    const hi = Math.max(0, 1 - Math.hypot(x - 0.35, y - 0.32) * 2.6);
    return [30 + 40 * hi, 20 + 28 * hi, 44 + 50 * hi, Math.min(1, (0.78 + 0.18 * n - r) * 12)];
  }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, H = S.hands, SH = S.shoulder, FT = S.feet, GR = S.grave;
  const T = k.aim || S.alone, REL = 1580, IMP = 2000, HOME = 3300;
  const rad = (d) => (d * Math.PI) / 180;
  k.css(`.g-bulb { border-radius: 50%; background: radial-gradient(closest-side, rgba(250,240,255,.95), rgba(196,150,255,.6) 28%, rgba(150,96,240,.22) 60%, rgba(120,70,220,0) 100%); }
    .g-grave { border-radius: 50%; background: radial-gradient(closest-side, rgba(236,214,255,.9), rgba(176,124,255,.5) 34%, rgba(140,90,240,.16) 66%, rgba(120,70,220,0) 100%); }`);

  // ── motion curves (ms -> value, smooth between points)
  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  // he leans back from his feet (counter-clockwise: negative), heaves, then swings forward and straightens
  const mRot = curve([[0, 0], [200, 0], [800, -3], [1150, -4.6], [1440, -9.6], [1540, -9.8], [1660, 5.8], [1900, 2.6], [2400, -0.9], [3000, 0.3], [HOME, 0]]);
  const mTx = curve([[0, 0], [1150, -0.4], [1500, -1.6], [1660, 1.3], [2200, 0.2], [HOME, 0]]);
  // his arms at the shoulder: drawing up, hauled high, flung down and forward
  const aRot = curve([[0, 0], [200, 0], [800, -6], [1150, -9.5], [1440, -21], [1540, -22], [1660, 16], [1780, 12], [2200, 2], [3000, 0], [HOME, 0]]);
  // the bulbs and roots swing from his fists, whipping with the arms
  const bRot = curve([[0, 0], [300, 2], [650, -3], [1000, 3], [1300, -4], [1440, -8], [1540, 6], [1580, -13], [1600, 0], [HOME, 0]]);
  const rSy = curve([[0, 1], [200, 1], [800, 1.04], [1150, 1.12], [1440, 1.24], [1540, 1.26], [1580, 1.1], [1600, 1], [HOME, 1]]);
  const grow = curve([[0, 1], [1560, 1], [1600, 0], [2900, 0], [HOME, 1]]);   // opacity: they leave his fists, and grow back
  const glowS = curve([[0, 1], [300, 1], [1100, 1.5], [1440, 1.9], [1500, 2.5], [1700, 0.4], [2300, 0.6], [3000, 1.1], [HOME, 1]]);

  // ── affine maps: [a, b, c, d, e, f]; x' = a x + c y + e, y' = b x + d y + f
  const mul = (p, q) => [p[0] * q[0] + p[2] * q[1], p[1] * q[0] + p[3] * q[1], p[0] * q[2] + p[2] * q[3], p[1] * q[2] + p[3] * q[3], p[0] * q[4] + p[2] * q[5] + p[4], p[1] * q[4] + p[3] * q[5] + p[5]];
  const rotAbout = (deg, [px, py]) => { const c = Math.cos(rad(deg)), s = Math.sin(rad(deg)); return [c, s, -s, c, px - c * px + s * py, py - s * px - c * py]; };
  const scaleAbout = (sx, sy, [px, py]) => [sx, 0, 0, sy, px - sx * px, py - sy * py];
  const move = (dx, dy) => [1, 0, 0, 1, dx, dy];
  const ap = (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  const Wman = (t) => mul(move(mTx(t), 0), rotAbout(mRot(t), FT));
  const Warm = (t) => mul(Wman(t), rotAbout(aRot(t), SH));
  const Wbulb = (t) => mul(Warm(t), rotAbout(bRot(t), H));
  const Wroot = (t) => mul(Wbulb(t), scaleAbout(1, rSy(t), H));
  const css = (W, P) => { // the sprite's transform (about its pivot P) for the world map W
    const [x, y] = ap(W, P);
    return `matrix(${W[0].toFixed(4)}, ${W[1].toFixed(4)}, ${W[2].toFixed(4)}, ${W[3].toFixed(4)}, ${((x - P[0]) * u).toFixed(1)}, ${((y - P[1]) * u).toFixed(1)})`;
  };
  const times = []; for (let t = 0; t <= HOME; t += 50) times.push(t);
  const keys = (W, P, op) => times.map((t) => [t, op ? { transform: css(W(t), P), opacity: +op(t).toFixed(3) } : { transform: css(W(t), P) }, 'linear']);
  act(k.part('body'), keys(Wman, FT));
  act(k.part('arms'), keys(Warm, SH));
  act(k.part('bulbs'), keys(Wbulb, H, grow));
  act(k.part('roots'), keys(Wroot, H, grow));
  act(k.part('graveglow'), times.map((t) => [t, { transform: `scale(${glowS(t).toFixed(3)}, ${(glowS(t) * 1.1).toFixed(3)})`, opacity: +Math.min(1, 0.4 + 0.6 * glowS(t) / 1.3).toFixed(3) }, 'linear']));

  // ── the grave: its light swells and spills, motes of violet rise from the open earth, the lantern answers
  fx(k.lightIn('g-grave', GR, 80, 50), [[100, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(1)', opacity: 0.6 }, eio], [1450, { transform: 'scale(1.3)', opacity: 0.95 }, eio], [1600, { transform: 'scale(1.5)', opacity: 0.7 }, eio], [2400, { transform: 'scale(.9)', opacity: 0.3 }, eio], [3300, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.lightIn('g-bulb', [H[0] + 8, H[1] + 18], 70, 50), [[300, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [1100, { transform: 'scale(1)', opacity: 0.6 }, eio], [1500, { transform: 'scale(1.2)', opacity: 0.85 }, eio], [1620, { transform: 'scale(.8)', opacity: 0.3 }, 'ease-in'], [2000, { transform: 'scale(.5)', opacity: 0 }]]);
  for (let i = 0; i < 14; i++) {
    const t = 200 + i * 95 + rand() * 60, x = GR[0] + (rand() - 0.5) * 16, s = 2.5 + rand() * 3;
    fx(k.picIn('spore', [x, GR[1]], s, s), [[t, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t + 160, { transform: `${k.T(0, -4)} scale(1)`, opacity: 0.9 }, 'linear'], [t + 1300, { transform: `${k.T((rand() - 0.5) * 18, -38 - rand() * 24)} scale(.5)`, opacity: 0 }]]);
  }
  // the roots tear out (HEAVE): a flare, clods and fibres thrown up, a puff of violet
  fx(k.lightIn('g-grave', [GR[0], GR[1] - 4], 70, 56), [[1400, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1490, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [1900, { transform: 'scale(1.7)', opacity: 0 }]]);
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI * (0.15 + 0.7 * rand()), d = 14 + rand() * 26, t = 1430 + rand() * 90, s = 2.6 + rand() * 3;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * d * f, Math.sin(a) * d * f + 34 * f * f)} rotate(${Math.round(f * 300)}deg) scale(${sc})`, opacity: o });
    fx(k.picIn('clod', [GR[0] + (rand() - 0.5) * 10, GR[1] - 2], s, s, { lit: false }), [[t, P(0, 0.5, 0), 'ease-out'], [t + 70, P(0.3, 1, 1), 'ease-out'], [t + 500, P(0.9, 1, 0.9), 'ease-in'], [t + 760, P(1, 0.8, 0)]]);
  }
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * (0.1 + 0.8 * rand()), d = 12 + rand() * 18, t = 1440 + rand() * 80, s = 2 + rand() * 2.5;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * d * f, Math.sin(a) * d * f * 1.2 + 10 * f * f)} scale(${sc})`, opacity: o });
    fx(k.picIn('spark', [GR[0], GR[1] - 2], s * 2, s * 2), [[t, P(0, 0.4, 0), 'ease-out'], [t + 60, P(0.3, 1.1, 1), 'ease-out'], [t + 360, P(0.9, 0.6, 0.8), 'ease-in'], [t + 600, P(1, 0.2, 0)]]);
  }

  // ── the throw (RELEASE): where each bulb is in his fist at the throw, then its arc to T
  const rel = Wbulb(REL - 40);
  const BU = S.bulbs.map(([x, y, r]) => ({ at: ap(rel, [x, y]), r }));
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".8"/></filter></defs><circle cx="30" cy="30" r="25" fill="none" stroke="#efe0ff" stroke-width="3" filter="url(#b)"/>', 60, 60);
  fx(k.pic(ring, ap(rel, [H[0] + 8, H[1] + 18]), 36, 36), [[REL - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [REL + 70, { transform: 'scale(.7)', opacity: 0.9 }], [REL + 700, { transform: 'scale(3.4)', opacity: 0 }]]);
  const FLT = IMP - REL;
  const rootTail = k.svg('<path d="M2,0Q4.2,3.5 2,7T2,14" fill="none" stroke="#e2d2f6" stroke-width="1" stroke-linecap="round"/>', 4, 14);
  BU.forEach((b, i) => {
    const O = b.at, dxT = T[0] - O[0], arcH = 26 + Math.min(34, Math.abs(dxT) * 0.12) + i * 8, off = [(i - 1) * 6, (i - 1) * 4];
    const C = [(O[0] + T[0]) / 2 + (i - 1) * 8, Math.min(O[1], T[1]) - arcH];
    const bz = (f) => { const q = 1 - f; return [q * q * O[0] + 2 * q * f * C[0] + f * f * (T[0] + off[0]), q * q * O[1] + 2 * q * f * C[1] + f * f * (T[1] + off[1])]; };
    const t0 = REL + i * 55, dur = FLT - i * 30, w = b.r * 2.2, kf = [];
    for (let j = 0; j <= 6; j++) {
      const f = j / 6, [x, y] = bz(f), [x2, y2] = bz(Math.min(1, f + 0.05)), ang = Math.atan2(y2 - y, x2 - x) * 180 / Math.PI + 90;
      const sc = (0.8 + 0.3 * Math.sin(f * Math.PI)) * (1 + 0.5 * sm(Math.max(0, (f - 0.85) / 0.15)));
      kf.push([Math.round(t0 + dur * f), { transform: `${k.T(x - O[0], y - O[1])} rotate(${Math.round(ang * 0.5 + f * 200)}deg) scale(${sc.toFixed(2)})`, opacity: j === 0 ? 0 : 1 }, j === 0 ? 'ease-out' : 'linear']);
    }
    const [lx, ly] = bz(1);
    kf.push([t0 + dur + 120, { transform: `${k.T(lx - O[0], ly - O[1])} rotate(300deg) scale(2.1)`, opacity: 0.8 }, 'ease-out'], [t0 + dur + 320, { transform: `${k.T(lx - O[0], ly - O[1] - 3)} rotate(340deg) scale(3)`, opacity: 0 }]);
    fx(k.pic('bulb', O, w, w * 1.25), kf);
    fx(k.light('g-bulb', O, w * 2.6), kf.map(([t, v, e]) => [t, { transform: v.transform.replace(/rotate\([^)]*\) /, ''), opacity: v.opacity * 0.9 }, e]));
    // the trail: pale roots and spores streaming back along the arc
    for (let j = 0; j < 9; j++) {
      const f = 0.05 + j * 0.1, [x, y] = bz(f), ts = Math.round(t0 + dur * f), s = 5 - j * 0.3;
      fx(k.pic(j % 2 ? 'spore' : 'spark', [x + (rand() - 0.5) * 5, y + (rand() - 0.5) * 5], s + 2, s + 2), [[ts, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [ts + 90, { transform: 'scale(1)', opacity: 0.95 }, 'ease-in'], [ts + 500, { transform: `${k.T((rand() - 0.5) * 6, 5)} scale(.3)`, opacity: 0 }]]);
    }
    // two pale root-tails dragging behind it
    for (let j = 0; j < 2; j++) {
      const sgn = j ? 1 : -1, tailKf = [];
      for (let q = 0; q <= 6; q++) {
        const f = q / 6, [x, y] = bz(Math.max(0, f - 0.14)), [bx, by] = bz(f);
        tailKf.push([Math.round(t0 + dur * f) + 30, { transform: `${k.T(x - O[0] + sgn * 2, y - O[1] + 3)} rotate(${Math.round(sgn * 18 + f * 70)}deg) scale(${(0.5 + 0.5 * Math.sin(f * Math.PI)).toFixed(2)}, ${(1 + Math.sin(f * 9 + j) * 0.2).toFixed(2)})`, opacity: q === 0 ? 0 : 0.8 }, q === 0 ? 'ease-out' : 'linear']);
      }
      const [lx2, ly2] = bz(1);
      tailKf.push([t0 + dur + 220, { transform: `${k.T(lx2 - O[0], ly2 - O[1] + 2)} rotate(120deg) scale(.5)`, opacity: 0 }]);
      fx(k.pic(rootTail, O, 4, 14, { lit: false }), tailKf);
    }
  });

  // ── the landing (IMPACT): the bulbs burst: violet light, rings, spores, three lights rise and go out, sparks
  const il = [[IMP - 70, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 60, { transform: 'scale(1.15)', opacity: 1 }, eio]];
  for (let t = IMP + 230, i = 0; t < 2700; t += 150, i++) il.push([t, { transform: `scale(${i % 2 ? 1.1 : 0.94})`, opacity: i % 2 ? 0.95 : 0.78 }, eio]);
  il.push([3300, { transform: 'scale(.8)', opacity: 0 }]);
  fx(k.light('g-bulb', T, 90), il);
  fx(k.light('g-grave', T, 120, 70), [[IMP - 30, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IMP + 130, { transform: 'scale(1)', opacity: 0.8 }, eio], [2500, { transform: 'scale(1.25)', opacity: 0 }]]);
  [[IMP, 5.2, 0.95], [IMP + 170, 4, 0.7], [IMP + 340, 3, 0.5]].forEach(([t, sc, o]) => fx(k.pic(ring, T, 36, 36), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 70, { transform: 'scale(.6)', opacity: o }], [t + 900, { transform: `scale(${sc})`, opacity: 0 }]]));
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + rand() * 0.3, d = 12 + rand() * 24, t = IMP + rand() * 90, s = 3 + rand() * 4;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * d * f, Math.sin(a) * d * f - 8 * f + 8 * f * f)} scale(${sc})`, opacity: o });
    fx(k.pic(i % 2 ? 'spore' : 'spark', T, s * 1.6, s * 1.6), [[t, P(0, 0.5, 0), 'ease-out'], [t + 60, P(0.25, 1.1, 1), 'ease-out'], [t + 360, P(0.8, 0.9, 0.9), 'ease-in'], [t + 800 + rand() * 250, P(1, 0.3, 0)]]);
  }
  // the three cards drawn: three lights rise from the landing, hang, and go out
  [[-13, 0, -4], [0, 130, -11], [13, 260, -4]].forEach(([dx, dt, up]) => {
    const t = IMP + 120 + dt, P = (f, sc, o) => ({ transform: `${k.T(dx * (0.3 + 0.7 * f), (-26 + up * 0.4) * f + 6 * f * f)} scale(${sc})`, opacity: o });
    fx(k.pic('bulb', [T[0], T[1] - 2], 9, 11.5), [[t, P(0, 0.3, 0), 'ease-out'], [t + 160, P(0.5, 1, 1), 'ease-out'], [t + 700, P(0.95, 1.1, 1), 'linear'], [t + 1000, P(1, 1.5, 0)]]);
    fx(k.light('g-bulb', [T[0], T[1] - 2], 24), [[t, { ...P(0, 0.3, 0), transform: 'scale(.3)' }, 'ease-out'], [t + 160, P(0.5, 1, 0.9), 'ease-out'], [t + 700, P(0.95, 1.2, 0.9), 'linear'], [t + 1000, P(1, 1.8, 0)]]);
  });
  for (let i = 0; i < 10; i++) {
    const x = (rand() - 0.5) * 36, t = IMP + 160 + rand() * 800, s = 3 + rand() * 4;
    fx(k.pic('spore', [T[0] + x, T[1] + 2], s, s), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 160, { transform: `${k.T(x * 0.1, -6)} scale(1)`, opacity: 0.95 }, 'linear'], [t + 1100, { transform: `${k.T(x * 0.3, -34 - rand() * 18)} scale(.5)`, opacity: 0 }]]);
  }

  // ── after: his hands: new bulbs sprout in his fists (a pulse and sparks), the grave glows back
  fx(k.lightIn('g-bulb', [H[0] + 8, H[1] + 18], 50, 40), [[2900, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [3250, { transform: 'scale(1)', opacity: 0.8 }, eio], [3700, { transform: 'scale(1.1)', opacity: 0 }]]);
  for (let i = 0; i < 6; i++) {
    const [x, y, r] = S.bulbs[i % 3], t = 2950 + i * 80;
    fx(k.pic('spark', [x + (rand() - 0.5) * 6, y - r * 0.5], 6, 6), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 120, { transform: 'scale(1) rotate(25deg)', opacity: 1 }], [t + 480, { transform: 'scale(.3) rotate(70deg)', opacity: 0 }]]);
  }
}
