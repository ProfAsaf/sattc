// Gravewarden: each loss is a lesson, and the lesson is paid forward.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support (the suggestion was defender:
// but its text heals and strengthens the creatures beside it, and it has no guard), element:
// spirit (the grave's violet light). The boon goes to T = k.aim, or, alone, to the far end of
// the soldiers' line (270, 128). The soldiers (its own picture's) always take the light too.
//   0-1300    the grave tolls: three slow tolls, each a ring of violet light out of the earth, the
//             mound heaving; the streams that run to the soldiers dim as their light is drawn back
//             into the grave, which blazes through its cracks; the shade bows over it, its
//             lantern swinging and flaring.
//   1450      RELEASE: the grave bursts, a column of light, the shade rears back; light runs along
//             the streams, bead after bead, to each soldier in turn, and a ribbon of it is flung
//             from the grave in an arc to T.
//   1560-1840 the soldiers take it one by one (a flash at the chest, a ring, a rising of motes),
//             each standing taller, spear flaring (the heal and the +1/+0).
//   1850      IMPACT at T: a flash, two rings, a swell of violet light, motes rising.
//   2000-3500 the soldiers hold their height and glow, then ease back; the streams' light
//             returns; the lantern settles; the shade straightens.
//   3600      at rest as drawn (BEATS.settle); the move ends at END.
export const END = 4200;
export const BEATS = { release: 1450, impact: 1850, settle: 3600 };
export const STILLS = [320, 800, 1250, 1460, 1700, 1860, 2600, 3900];

export const textures = {
  spark: [32, 32, (x, y) => { const dx = Math.abs(x - 0.5) * 2, dy = Math.abs(y - 0.5) * 2, c = Math.max(0, 1 - Math.hypot(dx, dy)), cr = Math.max(0, 1 - Math.min(dx * 7 + dy, dy * 7 + dx)), v = Math.min(1, c * c * 1.6 + cr * 0.8); return [215 + 40 * v, 175 + 70 * v, 255, v]; }],
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [190 + 60 * c * c, 140 + 90 * c * c, 255, Math.min(1, c * c * 1.6)]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const E = k.spec.emit, H = k.spec.hook, F = k.spec.feet, LAMP = k.spec.lamp;
  const T = k.aim || [270, 128];
  const REL = 1450, FLY = 400, IMP = REL + FLY;
  const rad = (d) => (d * Math.PI) / 180;
  k.css(`.g-spirit { border-radius: 50%; background: radial-gradient(closest-side, rgba(248,242,255,.95), rgba(190,146,255,.62) 28%, rgba(140,80,255,.24) 58%, rgba(120,60,255,0) 100%); }
    .g-column { border-radius: 50%; background: radial-gradient(closest-side, rgba(244,236,255,.9), rgba(178,128,255,.5) 40%, rgba(130,70,255,.16) 70%, rgba(120,60,255,0) 100%); }`);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1"/></filter></defs><circle cx="30" cy="30" r="25" fill="none" stroke="#c9a6ff" stroke-width="2.6" filter="url(#b)"/>', 60, 60);
  const streak = k.svg('<defs><linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#9a5cff" stop-opacity="0"/><stop offset=".7" stop-color="#c9a6ff"/><stop offset="1" stop-color="#fbf6ff"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation=".5"/></filter></defs><path d="M0,4 Q10,1.2 24,3 Q30,4 24,5 Q10,6.8 0,4Z" fill="url(#s)" filter="url(#b)"/>', 30, 8);

  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  const grid = [];
  for (let t = 0; t <= 3700; t += 35) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3800, { transform: 'none' }]];

  // ── the shade: bows over the grave, rears back at the release, straightens
  const LEAN = curve([[0, 0], [250, 0], [900, 2.6], [1300, 3.4], [1440, 3.8], [REL + 130, -2.4], [2000, -1.4], [2900, -0.4], [3600, 0]]);
  const leanTf = (t) => `rotate(${LEAN(t).toFixed(2)}deg)`;
  const hookAt = (t) => { const a = rad(LEAN(t)), c = Math.cos(a), s = Math.sin(a), vx = H[0] - F[0], vy = H[1] - F[1]; return [F[0] + vx * c - vy * s, F[1] + vx * s + vy * c]; };
  // the lantern: a pendulum that is knocked at each toll and at the release
  const SW = (t) => {
    let a = 0;
    for (const [tt, amp] of [[300, 8], [800, 10], [1250, 12], [REL, 16]]) if (t > tt) a += amp * Math.exp(-(t - tt) / 520) * Math.sin((t - tt) / 95);
    return a;
  };
  for (const n of ['shade', 'fold', 'eyes']) act(k.part(n), sample((t) => ({ transform: leanTf(t) })));
  act(k.part('lantern'), sample((t) => { const h = hookAt(t); return { transform: `${k.T(h[0] - H[0], h[1] - H[1])} rotate(${(LEAN(t) + SW(t)).toFixed(2)}deg)` }; }));
  const lampAt = (t) => { // the lantern's glass: swung about the hook, carried by the lean
    const a = rad(SW(t)), c = Math.cos(a), s = Math.sin(a), vx = LAMP[0] - H[0], vy = LAMP[1] - H[1], p = [H[0] + vx * c - vy * s, H[1] + vx * s + vy * c];
    const b = rad(LEAN(t)), c2 = Math.cos(b), s2 = Math.sin(b), wx = p[0] - F[0], wy = p[1] - F[1];
    return [F[0] + wx * c2 - wy * s2, F[1] + wx * s2 + wy * c2];
  };
  const LF = curve([[0, 0.2], [300, 0.5], [800, 0.7], [1250, 0.9], [REL, 1], [REL + 300, 0.6], [2600, 0.3], [3400, 0]]);
  const lk = [];
  for (let t = 0; t <= 3500; t += 35) { const q = lampAt(t); lk.push([t, { transform: `${k.T(q[0] - LAMP[0], q[1] - LAMP[1])} scale(${(0.7 + 0.6 * LF(t)).toFixed(2)})`, opacity: +(LF(t) * 0.85).toFixed(2) }, 'linear']); }
  lk.push([3600, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.lightIn('g-spirit', LAMP, 46, 46), lk);

  // ── the grave: heaves at each toll, bursts at the release; its cracks blaze
  const GR = [[0, { transform: 'none' }, eio]];
  for (const [t, a] of [[300, 1], [800, 1.2], [1250, 1.5]]) GR.push([t, { transform: `scale(${(1 + 0.012 * a).toFixed(3)}, ${(1 + 0.05 * a).toFixed(3)})` }, 'ease-out'], [t + 160, { transform: `scale(${(1 + 0.003 * a).toFixed(3)}, ${(1 + 0.012 * a).toFixed(3)})` }, eio]);
  GR.push([REL, { transform: 'scale(1.025, 1.11)' }, 'ease-out'], [REL + 250, { transform: 'scale(.995, .98)' }, eio], [2200, { transform: 'scale(1.004, 1.012)' }, eio], [3100, { transform: 'none' }]);
  act(k.part('grave'), GR);
  const CR = [[0, { transform: 'none', opacity: 1 }, eio]];
  for (const [t, a] of [[300, 1], [800, 1.2], [1250, 1.5]]) CR.push([t, { transform: `scale(${(1 + 0.1 * a).toFixed(3)}, ${(1 + 0.25 * a).toFixed(3)})`, opacity: 1 }, 'ease-out'], [t + 200, { transform: 'scale(1)', opacity: 0.7 }, eio]);
  CR.push([REL, { transform: 'scale(1.3, 1.7)', opacity: 1 }, 'ease-out'], [REL + 300, { transform: 'scale(1.1, 1.2)', opacity: 0.8 }, eio], [2400, { transform: 'scale(1.03)', opacity: 0.9 }, eio], [3100, { transform: 'none', opacity: 1 }]);
  act(k.part('cracks'), CR);
  // the streams: their light is drawn back into the grave while it tolls, and surges out again
  act(k.part('streams'), [[0, { opacity: 1 }, eio], [500, { opacity: 0.5 }, eio], [1000, { opacity: 0.22 }, eio], [1300, { opacity: 0.12 }, 'ease-in'], [REL + 120, { opacity: 1 }, eio], [2300, { opacity: 0.85 }, eio], [3200, { opacity: 1 }]]);

  // the light at the grave, swelling with each toll, bursting up at the release
  const gl = [[40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out']];
  for (const [t, a] of [[300, 1], [800, 1.2], [1250, 1.5]]) gl.push([t, { transform: `scale(${(0.9 + 0.35 * a).toFixed(2)})`, opacity: +Math.min(1, 0.5 + 0.3 * a).toFixed(2) }, 'ease-out'], [t + 180, { transform: `scale(${(0.7 + 0.2 * a).toFixed(2)})`, opacity: +(0.35 + 0.1 * a).toFixed(2) }, eio]);
  gl.push([REL, { transform: 'scale(1.9)', opacity: 1 }, 'ease-out'], [REL + 300, { transform: 'scale(1.2)', opacity: 0.65 }, eio], [2400, { transform: 'scale(.9)', opacity: 0.3 }, eio], [3200, { transform: 'scale(.5)', opacity: 0 }]);
  fx(k.light('g-spirit', E, 66), gl);
  fx(k.lightIn('g-column', [160, 138], 44, 110), [[REL - 60, { transform: 'scale(.4, .2)', opacity: 0 }, 'ease-out'], [REL + 40, { transform: 'scale(1, 1.05)', opacity: 0.95 }, 'ease-out'], [REL + 420, { transform: 'scale(.7, 1.15)', opacity: 0 }]]);
  fx(k.lightIn('g-aura', [150, 100], 300, 190), [[200, { opacity: 0 }, 'ease-out'], [REL, { opacity: 0.7 }, 'ease-out'], [IMP + 300, { opacity: 0.45 }, eio], [3000, { opacity: 0 }]]);
  [[300, 1], [800, 1.2], [1250, 1.5]].forEach(([t, a]) => fx(k.pic(ring, [E[0], E[1] + 2], 34, 34, { low: true }), [[t, { transform: 'scale(.3, .15)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(.6, .3)', opacity: 0.6 + 0.1 * a }, 'ease-out'], [t + 700, { transform: `scale(${(2.6 + 0.4 * a).toFixed(1)}, ${(1.1 + 0.2 * a).toFixed(1)})`, opacity: 0 }]]));
  // motes lifting out of the earth through the gathering
  for (let i = 0; i < 18; i++) {
    const t0 = 200 + Math.round(rand() * 1100), x = E[0] + (rand() - 0.5) * 36, sz = 3 + rand() * 3;
    fx(k.pic('mote', [x, E[1] + 2], sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 120, { transform: `${k.T(0, -4)} scale(1)`, opacity: 0.9 }, 'ease-out'], [t0 + 800 + Math.round(rand() * 300), { transform: `${k.T((rand() - 0.5) * 14, -26 - rand() * 20)} scale(.3)`, opacity: 0 }]]);
  }

  // ── the soldiers: each takes the light in turn, standing taller, spear flaring
  const SOLD = [[190, 162], [218, 160], [243, 158], [265, 156.5], [285, 155]], KS = [1.4, 1.28, 1.17, 1.07, 0.98];
  SOLD.forEach(([x, b], i) => {
    const ta = REL + 110 + i * 70, sx = 1.04, sy = 1.08, lift = 0.5;
    act(k.part(`sold${i}`), [[0, { transform: 'none' }, eio], [ta - 120, { transform: 'scale(1.01, .975)' }, 'ease-out'], [ta + 90, { transform: `${k.T(0, -lift)} scale(${sx + 0.025}, ${sy + 0.03})` }, eio], [ta + 330, { transform: `${k.T(0, -lift)} scale(${sx}, ${sy})` }, eio],
      [2900, { transform: `${k.T(0, -lift)} scale(${sx - 0.005}, ${sy - 0.005})` }, eio], [3500, { transform: 'none' }]]);
    const [tx, ty] = k.spec.tips[i], [cx, cy] = k.spec.chests[i];
    const pt = ([px, py], s1, s2, l) => ({ x: x + (px - x) * s1, y: b + (py - b) * s2 - l });
    const tip0 = pt([tx, ty], 1, 1, 0), tip1 = pt([tx, ty], sx, sy, lift), tipB = [tx, ty], ch1 = pt([cx, cy], sx, sy, lift);
    // the spear's tip flares
    fx(k.lightIn('g-spirit', tipB, 16, 16), [[ta - 60, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [ta + 90, { transform: `${k.T(tip1.x - tx, tip1.y - ty)} scale(1.3)`, opacity: 1 }, 'ease-out'], [ta + 500, { transform: `${k.T(tip1.x - tx, tip1.y - ty)} scale(.8)`, opacity: 0.7 }, eio],
      [2900, { transform: `${k.T(tip1.x - tx, tip1.y - ty)} scale(.6)`, opacity: 0.35 }, eio], [3400, { transform: `${k.T(0, 0)} scale(.3)`, opacity: 0 }]]);
    // a flash at the chest and a ring: the heal
    fx(k.lightIn('g-heal spirit', [cx, cy], 28, 28), [[ta - 50, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [ta + 70, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [ta + 280, { transform: 'scale(.9)', opacity: 0.8 }, eio], [ta + 800, { transform: 'scale(1.4)', opacity: 0 }]]);
    fx(k.pic(ring, [cx, cy], 20, 20, { low: true }), [[ta, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [ta + 40, { transform: 'scale(.7)', opacity: 0.8 }, 'ease-out'], [ta + 640, { transform: 'scale(2.4)', opacity: 0 }]]);
    for (let j = 0; j < 5; j++) {
      const t0 = ta + 40 + Math.round(rand() * 160), sz = 2.4 + rand() * 2.4;
      fx(k.pic(j % 2 ? 'spark' : 'mote', [cx + (rand() - 0.5) * 8, cy + (rand() - 0.5) * 10], sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 100, { transform: `${k.T(0, -4)} scale(1)`, opacity: 1 }, 'ease-out'], [t0 + 750 + Math.round(rand() * 250), { transform: `${k.T((rand() - 0.5) * 10, -24 - rand() * 14)} scale(.3)`, opacity: 0 }]]);
    }
    // beads of light running from the grave along the stream to this soldier
    const C = [(160 + x) / 2 - 10, b - 46], G = [cx - 3 * KS[i] + 3 * KS[i], cy];
    const bz = (t) => { const q = 1 - t; return [q * q * 160 + 2 * q * t * C[0] + t * t * G[0], q * q * 176 + 2 * q * t * C[1] + t * t * G[1]]; };
    for (let j = 0; j < 5; j++) {
      const t0 = ta - 340 + j * 48, kf = [];
      for (let n = 0; n <= 6; n++) { const f = n / 6, [px, py] = bz(f); kf.push([t0 + Math.round(300 * f), { transform: `${k.T(px - E[0], py - E[1])} scale(${(0.8 + 0.5 * f).toFixed(2)})`, opacity: n === 0 ? 0 : n === 6 ? 0.9 : 1 }, 'linear']); }
      kf.push([t0 + 360, { ...kf.at(-1)[1], opacity: 0 }]);
      fx(k.pic(j % 2 ? 'spark' : 'mote', E, 5 - j * 0.3, 5 - j * 0.3), kf);
    }
  });

  // ── the gift: a ribbon of violet light from the grave along an arc to T
  const C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 30];
  const bz = (t) => { const q = 1 - t; return [q * q * E[0] + 2 * q * t * C[0] + t * t * T[0], q * q * E[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const [X0, Y0] = k.P(...E);
  const along = (tex, t0, dur, lat, sx, sy, s0, s1, o, tangent, linger = 0) => {
    const kf = [], n = 8;
    for (let j = 0; j <= n; j++) {
      const f = j / n, w = Math.pow(f, 0.9), q = bz(w), q2 = bz(Math.min(1, w + 0.02)), q1 = bz(Math.max(0, w - 0.02)), [x, y] = k.P(...q);
      const ang = (Math.atan2(q2[1] - q1[1], q2[0] - q1[0]) * 180) / Math.PI, off = lat * Math.sin(Math.PI * w) * u;
      kf.push([Math.round(t0 + dur * f), { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + off).toFixed(1)}px) rotate(${tangent ? ang.toFixed(1) : 0}deg) scale(${(s0 + (s1 - s0) * f).toFixed(2)})`, opacity: j === 0 ? 0 : o }, 'linear']);
    }
    kf.push([Math.round(t0 + dur + 50 + linger), { ...kf.at(-1)[1], opacity: 0 }]);
    fx(k.pic(tex, E, sx, sy), kf);
  };
  for (let i = 0; i < 9; i++) along(streak, REL + i * 22, FLY - 40 + i * 6, (rand() - 0.5) * 6, 26, 7, 0.7, 1, 0.9, true, 80);
  along('mote', REL, FLY, 0, 18, 18, 0.9, 1.1, 1, false);
  along('spark', REL + 10, FLY - 10, 0, 12, 12, 1, 1.2, 1, false);
  for (let i = 0; i < 14; i++) along(i % 2 ? 'spark' : 'mote', REL + 10 + Math.round(rand() * 220), FLY - 60 + Math.round(rand() * 120), (rand() - 0.5) * 16, 4 + rand() * 4, 4 + rand() * 4, 1, 0.5, 0.95, false, 120);
  const lt = [];
  for (let j = 0; j <= 8; j++) { const f = j / 8, q = bz(f), [x, y] = k.P(...q); lt.push([Math.round(REL + FLY * f), { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) scale(${(1.1 - 0.4 * f).toFixed(2)})`, opacity: j === 0 ? 0 : 0.95 }, 'linear']); }
  lt.push([IMP + 80, { ...lt.at(-1)[1], opacity: 0 }]);
  fx(k.light('g-spirit', E, 34), lt);

  // ── where it lands (BEATS.impact)
  fx(k.light('g-spirit', T, 62), [[IMP - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 50, { transform: 'scale(1.2)', opacity: 1 }, 'ease-out'], [IMP + 260, { transform: 'scale(.9)', opacity: 0.7 }, eio],
    [IMP + 520, { transform: 'scale(1.05)', opacity: 0.8 }, eio], [IMP + 900, { transform: 'scale(.9)', opacity: 0.5 }, eio], [3100, { transform: 'scale(.6)', opacity: 0 }]]);
  fx(k.light('g-heal spirit', T, 30), [[IMP - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 60, { transform: 'scale(1)', opacity: 0.95 }, 'ease-out'], [IMP + 700, { transform: 'scale(1.4)', opacity: 0 }]]);
  [[0, 3.0, 0.8], [150, 4.2, 0.5]].forEach(([d, big, o]) => fx(k.pic(ring, T, 30, 30, { low: true }), [[IMP + d, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + d + 40, { transform: 'scale(.6)', opacity: o }, 'ease-out'], [IMP + d + 700, { transform: `scale(${big})`, opacity: 0 }]]));
  for (let i = 0; i < 18; i++) {
    const a = rand() * Math.PI * 2, d = 10 + rand() * 20, t0 = IMP + Math.round(rand() * 160), sz = 3 + rand() * 4;
    fx(k.pic(i % 3 ? 'mote' : 'spark', T, sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 90, { transform: `${k.T(Math.cos(a) * d * 0.4, Math.sin(a) * d * 0.4)} scale(1)`, opacity: 1 }, 'ease-out'],
      [t0 + 800 + Math.round(rand() * 500), { transform: `${k.T(Math.cos(a) * d * 0.9, Math.sin(a) * d * 0.5 - 18 - rand() * 14)} scale(.3)`, opacity: 0 }]]);
  }
}
