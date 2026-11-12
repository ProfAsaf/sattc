// The Merchant Tortoise: it rears, then stamps, and the river rises in a surge of water and leaves.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker (Reach, Overrun, 7/7: the suggestion
// stands), element: nature (river and leaf, as suggested). Facing left as drawn; when its target is to
// its right it turns about (a card-flip through a sliver) and turns back at the end. Aimed: the surge
// goes to T = k.aim, or, alone, along the water ahead of it (`alone`).
//   0-1250    the gather: it draws its head in and lifts it, the shell rocks back on its hind legs, the
//             water round its feet draws back (ripples), the town leans, the lamps in the windows gutter.
//   1340      RELEASE: it stamps and lunges: the head thrusts out, the shell dips and the town sways on
//             after it; a ring and spray burst at its foot, leaves shake loose from the trees on its
//             back, and a surge of water, foam and leaves leaves its foot, rising as it runs along an arc
//             to T, the boats bobbing as the shock passes them.
//   1790      IMPACT: the surge bursts at T: a column of water, foam, rings, a swirl of leaves rising, golden
//             green light, sparks.
//   2000-3300 it rears back from the lunge and settles (the town swaying on, damped), the ripples run out,
//             the leaves float down.
//   3900      at rest as drawn (BEATS.settle); the move ends at END (and, if it turned, it is back as drawn).
// Contract: T = k.aim || alone; the surge's arc is worked out from its foot (`foot`, mirrored if it turned)
// to T; all that flies or lands is on the overlay (T may be on another card).
export const END = 4600;
export const BEATS = { release: 1340, impact: 1790, settle: 3900 };
export const STILLS = [700, 1200, 1400, 1560, 1800, 2100, 2900, 4300];

export const textures = {
  foam: [48, 48, (x, y) => {
    const r = Math.hypot(x - 0.5, y - 0.5) * 2, n = 0.5 + 0.5 * Math.sin(x * 19 + y * 11) * Math.cos(y * 17 - x * 7);
    const c = Math.max(0, 1 - r * (0.85 + 0.3 * n)); return [240, 253, 246, Math.min(1, c * c * 1.5)];
  }],
  swell: [64, 40, (x, y) => {
    const u = (x - 0.5) * 2, top = 0.9 - 0.8 * Math.max(0, 1 - u * u) ** 0.8; // a dome of water, flat underneath
    if (y < top || y > 0.96) return [0, 0, 0, 0];
    const d = (y - top), a = Math.min(1, d * 14) * Math.min(1, (0.96 - y) * 16) * Math.min(1, (1 - Math.abs(u)) * 7);
    const crest = Math.max(0, 1 - d * 7);
    return [(96 + 150 * crest), (176 + 76 * crest), (176 + 62 * crest), a * 0.95];
  }],
  leaf: [32, 32, (x, y) => {
    const c = Math.cos(0.7), s = Math.sin(0.7), u = ((x - 0.5) * c + (y - 0.5) * s), v = (-(x - 0.5) * s + (y - 0.5) * c);
    const w = 0.17 * Math.sqrt(Math.max(0, 1 - (u / 0.46) ** 2));
    const a = Math.min(1, (w - Math.abs(v)) * 40);
    if (a <= 0) return [0, 0, 0, 0];
    const vein = Math.max(0, 1 - Math.abs(v) * 70), g = 0.5 + 0.5 * (u / 0.46);
    return [90 + 70 * g + 80 * vein, 150 + 50 * g + 50 * vein, 52 + 30 * g, a];
  }],
  leaf2: [32, 32, (x, y) => {
    const c = Math.cos(-0.6), s = Math.sin(-0.6), u = ((x - 0.5) * c + (y - 0.5) * s), v = (-(x - 0.5) * s + (y - 0.5) * c);
    const w = 0.16 * Math.sqrt(Math.max(0, 1 - (u / 0.46) ** 2));
    const a = Math.min(1, (w - Math.abs(v)) * 40);
    if (a <= 0) return [0, 0, 0, 0];
    const vein = Math.max(0, 1 - Math.abs(v) * 70), g = 0.5 + 0.5 * (u / 0.46);
    return [196 + 40 * g + 20 * vein, 190 + 20 * g + 30 * vein, 70 + 20 * g, a];
  }],
  drop: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, (y - 0.5) * 0.8) * 2, c = Math.max(0, 1 - r); return [232, 252, 248, Math.min(1, c * 2.6)]; }],
  spark: [32, 32, (x, y) => {
    const dx = Math.abs(x - 0.5) * 2, dy = Math.abs(y - 0.5) * 2, c = Math.max(0, 1 - Math.hypot(dx, dy)), cross = Math.max(0, 1 - Math.min(dx * 7 + dy, dy * 7 + dx));
    const v = Math.min(1, c * c * 1.6 + cross * 0.9); return [255, 244 + 11 * v, 196 + 59 * v, v];
  }],
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 240, 176, Math.min(1, c * c * 1.5)]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, AX = S.axis, WL = S.waterline;
  const T = k.aim || S.alone, REL = 1340, IMP = 1790, HOME = 3300;
  const R = T[0] > AX;                                   // its target is behind it: it turns about
  const mir = (p) => (R ? [2 * AX - p[0], p[1]] : p);
  const E = mir(S.foot), M = mir(S.mouth), pv = [172, 172];
  const g0 = R ? 600 : 150;
  const rad = (d) => (d * Math.PI) / 180;
  k.css(`.g-leaf { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,250,210,.95), rgba(214,236,140,.6) 28%, rgba(150,210,110,.22) 60%, rgba(120,200,110,0) 100%); }
    .g-splash { border-radius: 50%; background: radial-gradient(closest-side, rgba(240,255,250,.9), rgba(180,236,230,.42) 36%, rgba(140,220,220,.12) 66%, rgba(140,220,220,0) 100%); }`);

  // ── motion curves (ms -> value, smooth between points), sampled into keyframes
  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  // the shell (and all it carries) rocks back on its hind legs, dips and lunges forward (left, as drawn), rebounds
  const sRot = curve([[0, 0], [g0, 0], [800, 1.3], [1150, 2.3], [1260, 2.5], [1345, -2.4], [1520, -1.1], [1760, 0.8], [2100, -0.45], [2600, 0.2], [HOME, 0]]);
  const sTx = curve([[0, 0], [g0, 0], [1260, 0.4], [1345, -2.4], [1600, -1.3], [2300, -0.3], [HOME, 0]]);
  const sTy = curve([[0, 0], [g0, 0], [1150, -0.7], [1345, 1.7], [1700, 0.4], [2400, 0], [HOME, 0]]);
  // the town sways on, damped, after the shell
  const sway = curve([[0, 0], [g0, 0], [800, -0.6], [1250, -1.0], [1420, 2.8], [1700, -2.0], [1980, 1.3], [2260, -0.8], [2540, 0.45], [2820, -0.2], [HOME, 0]]);
  // the head: draws in and up, then thrusts out and down, recoils, settles (its own motion, about the neck)
  const hRot = curve([[0, 0], [g0, 0], [700, 3], [1150, 7], [1260, 8], [1345, -8], [1520, -9], [1900, -8], [2300, -3], [2800, 1.8], [3100, 0.5], [HOME, 0]]);
  const hTx = curve([[0, 0], [g0, 0], [1150, 6], [1260, 7], [1345, -8], [1520, -10], [1900, -9], [2300, -4], [2800, 1.5], [HOME, 0]]);
  const hTy = curve([[0, 0], [g0, 0], [1150, 3], [1345, 4], [1520, 5], [1900, 5], [2300, 2], [HOME, 0]]);
  const hSc = curve([[0, 1], [g0, 1], [1150, 0.95], [1260, 0.94], [1345, 1.06], [1520, 1.08], [1900, 1.07], [2300, 1.03], [HOME, 1]]);

  // flipping about the body's axis (if it turns): its transform prefix at flip state f (0 = as drawn, 1 = turned)
  const prefix = (px, fl, sx) => `translate(${(fl * 2 * (AX - px) * u).toFixed(1)}px, 0px) scaleX(${sx})`;
  const motion = (dx, dy, rot, sc) => `translate(${(dx * u).toFixed(1)}px, ${(dy * u).toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
  const turned = (px, mot, t) => { // its full transform at t: the flip, then its motion
    if (!R) return `translate(0px, 0px) scaleX(1) ${mot}`;
    if (t < 300) return `${prefix(px, 0.5 * (t / 300), 1 - 0.94 * sm(t / 300))} ${mot}`;
    if (t < 600) return `${prefix(px, 0.5 + 0.5 * ((t - 300) / 300), 0.06 - 1.06 * sm((t - 300) / 300))} ${mot}`;
    if (t < 3300) return `${prefix(px, 1, -1)} ${mot}`;
    if (t < 3600) return `${prefix(px, 1 - 0.5 * ((t - 3300) / 300), -1 + 1.06 * sm((t - 3300) / 300))} ${mot}`;
    return `${prefix(px, 0.5 - 0.5 * Math.min(1, (t - 3600) / 300), 0.06 + 0.94 * sm(Math.min(1, (t - 3600) / 300)))} ${mot}`;
  };
  const times = []; for (let t = 0; t <= 3900; t += (t >= g0 && t <= 3300 ? 50 : 150)) times.push(t); // samples
  if (R) for (const t of [300, 600, 3300, 3600, 3900]) if (!times.includes(t)) times.push(t);
  times.sort((a, b) => a - b);
  const keys = (px, mot) => times.map((t) => [t, { transform: turned(px, mot(t), t) }, 'linear']);
  // the shell's own transform about (172, 172), and what it does to a point riding it
  const shellTf = (t) => motion(sTx(t), sTy(t), sRot(t), 1);
  const N = S.neck;
  const rideN = (t) => { // the neck's joint as the shell carries it, and the head's own transform composed on it
    const th = rad(sRot(t)), c = Math.cos(th), s = Math.sin(th), vx = N[0] - pv[0], vy = N[1] - pv[1];
    const nx = pv[0] + c * vx - s * vy + sTx(t), ny = pv[1] + s * vx + c * vy + sTy(t);
    const hx = hTx(t), hy = hTy(t);
    return motion(nx - N[0] + c * hx - s * hy, ny - N[1] + s * hx + c * hy, sRot(t) + hRot(t), hSc(t));
  };
  act(k.part('shell'), keys(pv[0], (t) => shellTf(t)));
  act(k.part('shellfx'), keys(pv[0], (t) => shellTf(t)));
  act(k.part('town'), keys(pv[0], (t) => motion(sTx(t), sTy(t), sRot(t) + sway(t), 1)));
  for (const nm of ['head', 'face', 'eye']) act(k.part(nm), keys(N[0], (t) => rideN(t)));

  // ── the boats bob as the shock passes them (it reaches each after a beat that grows with its distance)
  S.boats.forEach(([bx, by], i) => {
    const tb = REL + 60 + Math.hypot(bx - E[0], (by - E[1]) * 2) * 5.5, a = i % 2 ? 1 : -1, l = [[0, { transform: 'translate(0px, 0px) rotate(0deg)' }, eio]];
    [[0, -2.4, 7], [0.18, 1.4, -5], [0.4, -1.4, 4], [0.64, 0.7, -2.4], [0.9, -0.3, 1], [1.2, 0, 0]].forEach(([f, dy, r]) => l.push([Math.round(tb + f * 1300), { transform: `${k.T(0, dy)} rotate(${(a * r).toFixed(1)}deg)` }, eio]));
    act(k.part(['boatL', 'boatM', 'boatR'][i]), l);
  });

  // ── the gather: the water round its feet draws back, the windows gutter, a breath of motes
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="25" fill="none" stroke="#f4fffa" stroke-width="3" filter="url(#b)"/>', 60, 60);
  const ripple = (c, t, sz, sc, o, fl = 0.3, dur = 1100) => fx(k.pic(ring, c, sz, sz), [[t, { transform: `scale(.3, ${(0.3 * fl).toFixed(2)})`, opacity: 0 }, 'ease-out'], [t + 90, { transform: `scale(.6, ${(0.6 * fl).toFixed(2)})`, opacity: o }], [t + dur, { transform: `scale(${sc}, ${(sc * fl).toFixed(2)})`, opacity: 0 }]]);
  ripple([E[0], WL + 5], g0 + 150, 34, 1.3, 0.5, 0.28, 900);
  ripple([E[0], WL + 5], g0 + 600, 38, 1.4, 0.55, 0.28, 900);
  ripple([mir([228, 0])[0], WL + 7], g0 + 400, 34, 1.3, 0.4, 0.28, 900);
  const WIN = [[142, 78.4], [175, 59.1], [175, 69.2], [209, 79.9], [209, 85.9]].map(mir);
  WIN.forEach(([x, y], i) => fx(k.pic('spark', [x, y], 7, 7), [[g0 + 300 + i * 70, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [g0 + 440 + i * 70, { transform: 'scale(1) rotate(20deg)', opacity: 0.9 }, eio], [1335, { transform: 'scale(.7)', opacity: 0.3 }, 'ease-in'], [1345, { transform: 'scale(1.5) rotate(40deg)', opacity: 1 }, 'ease-out'], [1560 + i * 40, { transform: 'scale(.4) rotate(70deg)', opacity: 0 }]]));
  fx(k.lightIn('g-leaf', [AX, 95], 190, 110), [[500, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [1250, { transform: 'scale(1)', opacity: 0.28 }, eio], [1450, { transform: 'scale(1.05)', opacity: 0.4 }, eio], [2600, { transform: 'scale(1)', opacity: 0 }]]);

  // ── the stamp (RELEASE): a flash on the water, a ring, spray thrown up, leaves shaken from the trees on its back
  fx(k.light('g-splash', [E[0], WL], 56, 30), [[REL - 30, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [REL + 60, { transform: 'scale(1.15)', opacity: 0.95 }, eio], [REL + 700, { transform: 'scale(1.5)', opacity: 0 }]]);
  ripple([E[0], WL + 4], REL, 30, 4.4, 0.95, 0.3, 1000);
  ripple([E[0], WL + 4], REL + 170, 30, 3.2, 0.65, 0.3, 1000);
  ripple([E[0], WL + 4], REL + 360, 30, 2.4, 0.45, 0.3, 1000);
  for (let i = 0; i < 16; i++) {
    const a = -Math.PI * (0.08 + 0.84 * rand()), d = 8 + rand() * 22, t = REL - 10 + rand() * 90, s = 2.4 + rand() * 3.4, big = i % 3 === 0;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * d * f, Math.sin(a) * d * f + 20 * f * f)} scale(${sc})`, opacity: o });
    fx(k.pic(big ? 'foam' : 'drop', [E[0], WL + 1], big ? s * 2.6 : s, big ? s * 2.6 : s * 1.4), [[t, P(0, 0.5, 0), 'ease-out'], [t + 90, P(0.4, 1, 0.95), 'ease-out'], [t + 380, P(0.9, 1, 0.85), 'ease-in'], [t + 640, P(1, 0.7, 0)]]);
  }
  const TREES = [[110, 112], [162, 80], [220, 95], [245, 121]].map(mir);
  for (let i = 0; i < 14; i++) {
    const [tx, ty] = TREES[i % 4], t = REL + 40 + i * 55 + rand() * 40, r0 = Math.round(rand() * 360), dx = (rand() - 0.5) * 22, fall = 20 + rand() * 40;
    const P = (f, o, rr) => ({ transform: `${k.T(dx * f + Math.sin(f * 7 + i) * 4, fall * f * f + 4 * f)} rotate(${Math.round(r0 + rr * f)}deg) scale(${(0.5 + 0.6 * Math.min(1, f * 4)).toFixed(2)})`, opacity: o });
    fx(k.pic(i % 3 === 2 ? 'leaf2' : 'leaf', [tx + (rand() - 0.5) * 6, ty], 6 + rand() * 3, 6 + rand() * 3, { lit: false }), [[t, P(0, 0, 0), 'ease-out'], [t + 80, P(0.1, 0.95, 60), 'linear'], [t + 700, P(0.6, 0.9, 340), 'linear'], [t + 1400, P(1, 0, 600)]]);
  }

  // ── the surge: swells of water, foam and leaves from its foot along an arc to T (RELEASE .. IMPACT)
  const dist = Math.hypot(T[0] - E[0], T[1] - E[1]), arcH = 10 + Math.min(34, dist * 0.14);
  const C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - arcH];
  const bz = (f, off = [0, 0]) => { const q = 1 - f; return [q * q * E[0] + 2 * q * f * C[0] + f * f * (T[0] + off[0]), q * q * E[1] + 2 * q * f * C[1] + f * f * (T[1] + off[1])]; };
  const FT = IMP - REL;
  const fly = (src, w, h, t0, dur, off, o = {}) => {
    const { spin = 0, lit = true, grow = 1, fade = 360, flatten = 0 } = o, kf = [], n = 6, a0 = Math.round(rand() * 360);
    for (let j = 0; j <= n; j++) {
      const f = j / n, [x, y] = bz(f, off), sc = (0.35 + 0.65 * sm(Math.min(1, f * 2.5))) * (1 + (grow - 1) * Math.sin(f * Math.PI * 0.9));
      kf.push([Math.round(t0 + dur * f), { transform: `${k.T(x - E[0], y - WL)} rotate(${Math.round(a0 + f * 360 * spin)}deg) scale(${(sc * (1 + flatten * 0.5)).toFixed(2)}, ${(sc * (1 - flatten * 0.4)).toFixed(2)})`, opacity: j === 0 ? 0 : (j === 1 ? 0.95 : 1) }, j === 0 ? 'ease-out' : 'linear']);
    }
    const [lx, ly] = bz(1, off), sl = 1 + (grow - 1) * 0.1;
    kf.push([t0 + dur + fade * 0.5, { transform: `${k.T(lx - E[0], ly - WL - 2)} rotate(${Math.round(a0 + 380 * spin)}deg) scale(${sl.toFixed(2)})`, opacity: 0.9 }, 'ease-in'], [t0 + dur + fade, { transform: `${k.T(lx - E[0], ly - WL + 1)} rotate(${Math.round(a0 + 420 * spin)}deg) scale(${(sl * 0.8).toFixed(2)})`, opacity: 0 }]);
    fx(k.pic(src, [E[0], WL], w, h, { lit }), kf);
  };
  for (let i = 0; i < 9; i++) fly('swell', 20 + rand() * 8, 12 + rand() * 4, REL + i * 40, FT - i * 12, [(rand() - 0.5) * 14, (rand() - 0.5) * 6], { lit: false, spin: 0, grow: 1.5, fade: 300 });
  for (let i = 0; i < 18; i++) fly('foam', 14 + rand() * 8, 12 + rand() * 6, REL + 10 + i * 24, FT - 30 - i * 6, [(rand() - 0.5) * 18, (rand() - 0.5) * 8], { spin: 0.3, fade: 280, grow: 1.3 });
  for (let i = 0; i < 16; i++) fly(i % 3 === 2 ? 'leaf2' : 'leaf', 7 + rand() * 3, 7 + rand() * 3, REL + 40 + i * 28, FT - 70 + rand() * 60, [(rand() - 0.5) * 22, (rand() - 0.5) * 10], { spin: 1 + rand() * 0.8, lit: false, grow: 1.4, fade: 460 });
  for (let i = 0; i < 12; i++) fly('drop', 3 + rand() * 3, 4 + rand() * 4, REL + 20 + i * 36, FT - 50 + rand() * 50, [(rand() - 0.5) * 20, -4 - rand() * 8], { fade: 300, grow: 1.2 });
  // glints along the flight
  for (let i = 0; i < 10; i++) {
    const f = 0.1 + 0.8 * rand(), [x, y] = bz(f), t = REL + 30 + f * FT * 0.95 + rand() * 120, s = 5 + rand() * 4;
    fx(k.pic('spark', [x + (rand() - 0.5) * 8, y - 4 - rand() * 6], s, s), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 90, { transform: 'scale(1) rotate(20deg)', opacity: 1 }], [t + 380, { transform: `${k.T(0, 4)} scale(.3) rotate(60deg)`, opacity: 0 }]]);
  }

  // ── the landing (IMPACT): a column of water, foam and rings, a swirl of leaves rising, golden-green light
  const il = [[IMP - 70, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 60, { transform: 'scale(1.15)', opacity: 1 }, eio]];
  for (let t = IMP + 230, i = 0; t < 2500; t += 160, i++) il.push([t, { transform: `scale(${i % 2 ? 1.1 : 0.94})`, opacity: i % 2 ? 0.95 : 0.78 }, eio]);
  il.push([3100, { transform: 'scale(.8)', opacity: 0 }]);
  fx(k.light('g-leaf', T, 88), il);
  fx(k.light('g-splash', T, 90, 60), [[IMP - 30, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IMP + 130, { transform: 'scale(1)', opacity: 0.85 }, eio], [2200, { transform: 'scale(1.25)', opacity: 0 }]]);
  [[IMP, 5.2, 0.95, 0.4], [IMP + 170, 4, 0.7, 0.4], [IMP + 360, 3, 0.5, 0.4]].forEach(([t, sc, o, fl]) => ripple([T[0], T[1] + 3], t, 38, sc, o, fl, 1000));
  // the column: a swell thrown up and falling back
  [[0, 22, 1.4], [90, 15, 1.9]].forEach(([dt, w, sy], i) => fx(k.pic('swell', [T[0] + (i ? 4 : -2), T[1] + 4], w, 14, { lit: false }), [[IMP - 20 + dt, { transform: 'scale(.4, .2)', opacity: 0 }, 'ease-out'], [IMP + 90 + dt, { transform: `${k.T(0, -8 * sy)} scale(1, ${sy + 0.8})`, opacity: 1 }, 'ease-out'], [IMP + 300 + dt, { transform: `${k.T(0, -12 * sy)} scale(.9, ${sy + 1})`, opacity: 0.9 }, 'ease-in'], [IMP + 640 + dt, { transform: `${k.T(0, 2)} scale(1.2, .5)`, opacity: 0 }]]));
  for (let i = 0; i < 12; i++) {
    const a = rad(-180 + (180 * (i + 0.5)) / 12 + (rand() - 0.5) * 10), d = 12 + rand() * 22, t = IMP - 20 + rand() * 80, s = 8 + rand() * 7;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * d * f, Math.sin(a) * d * f * 0.8 + 12 * f * f)} scale(${sc})`, opacity: o });
    fx(k.pic('foam', T, s, s), [[t, P(0, 0.4, 0), 'ease-out'], [t + 80, P(0.35, 1, 0.95), 'ease-out'], [t + 300, P(0.85, 1.1, 0.8), 'ease-in'], [t + 620, P(1, 1.3, 0)]]);
  }
  // leaves swirling up from the landing, turning as they rise, drifting down
  for (let i = 0; i < 16; i++) {
    const a0 = rand() * Math.PI * 2, d = 6 + rand() * 12, t = IMP + 20 + rand() * 260, rise = 22 + rand() * 30, turn = (rand() < 0.5 ? -1 : 1) * (1.2 + rand() * 1.4);
    const P = (f, o, sc) => ({ transform: `${k.T(Math.cos(a0 + turn * f) * d * (0.4 + f), -rise * Math.sin(f * 1.5) + Math.sin(a0 + turn * f) * d * 0.3 + 14 * Math.max(0, f - 0.6))} rotate(${Math.round(f * 400 * turn)}deg) scale(${sc})`, opacity: o });
    fx(k.pic(i % 3 === 0 ? 'leaf2' : 'leaf', [T[0], T[1] + 2], 7 + rand() * 3, 7 + rand() * 3, { lit: false }), [[t, P(0, 0, 0.4), 'ease-out'], [t + 100, P(0.12, 0.95, 0.9), 'linear'], [t + 560, P(0.5, 1, 1), 'linear'], [t + 1200, P(0.85, 0.8, 0.9), 'linear'], [t + 1700, P(1, 0, 0.8)]]);
  }
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + rand() * 0.3, d = 12 + rand() * 22, t = IMP + rand() * 90, s = 4 + rand() * 5;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * d * f, Math.sin(a) * d * f - 10 * f + 8 * f * f)} scale(${sc})`, opacity: o });
    fx(k.pic('spark', T, s, s), [[t, P(0, 0.5, 0), 'ease-out'], [t + 60, P(0.25, 1.1, 1), 'ease-out'], [t + 330, P(0.8, 0.9, 0.9), 'ease-in'], [t + 700 + rand() * 200, P(1, 0.3, 0)]]);
  }
  for (let i = 0; i < 8; i++) {
    const x = (rand() - 0.5) * 34, t = IMP + 200 + rand() * 700, s = 3 + rand() * 4;
    fx(k.pic('mote', [T[0] + x, T[1] + 2], s, s), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 160, { transform: `${k.T(x * 0.1, -6)} scale(1)`, opacity: 0.95 }, 'linear'], [t + 1100, { transform: `${k.T(x * 0.3, -34 - rand() * 18)} scale(.5)`, opacity: 0 }]]);
  }

  // ── after: its ripples run out wide over the water, and a last few leaves float down on the shell's side
  ripple([E[0], WL + 6], 2000, 40, 4.8, 0.4, 0.26, 1300);
  ripple([E[0], WL + 6], 2350, 40, 4.2, 0.3, 0.26, 1300);
  ripple([mir([232, 0])[0], WL + 8], 1900, 36, 3.6, 0.35, 0.26, 1300);
}
