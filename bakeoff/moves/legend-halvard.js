// Halvard, the Unbroken: he plants his shield and takes the blows, and the line behind him holds.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: defender, element: nature.
//   60-400    he braces (BEATS.release): sets his weight, drives the point of the great
//             shield down into the earth (it settles an inch deeper), the roots under it
//             flare green and run out to either side; the vines wake, their buds
//             lighting; down both ranks the shield-bearers shuffle in one after another
//             (nearest first) and lock their shields, a click of gold light at each.
//   1000, 1650, 2300 (alone; else k.blows)  a spear of shadow comes at the shield
//             (from the left, or the right for blows on the right of it) and strikes
//             it (BEATS.impact: the first). At each blow: the shield is driven back and
//             rebounds, he rocks on his feet, the sun on the shield flares, a flash and
//             a ring of gold at the guard, sparks and splinters of leaf flung back, dust
//             at his feet; the roots run green out from the point, the vines and buds
//             flare; and the shock RUNS OUT DOWN THE RANKS: each pair of bearers in turn
//             jolts and rebounds, gold light pulsing on their shields, dust at their feet.
//             Each blow a little stronger.
//   after the last, he holds, then eases; the green and the gold die down.
//   3700      at rest as drawn (the move ends at END).
//
// The contract (bakeoff/recipe.md): blows come as k.blows || his own three spears; each is
// taken at its time `at`, on the nearest of his `guard` points. A spear is drawn only when he
// plays alone. His shield (with its vines, buds and gauntlets), body, sun and each pair of
// bearers are one sampled list each (every 40 ms), the sum of every blow's damped shake.
export const END = 4000;
export const BEATS = { release: 400, impact: 1000, settle: 3700 };
export const STILLS = [250, 700, 980, 1060, 1300, 1720, 2400, 3800];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 226 + 29 * c * c, 150 + 105 * c * c, Math.min(1, c * c * 2.2)]; }],
  dust: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, n = 0.75 + 0.25 * Math.sin(x * 17 + y * 11) * Math.cos(y * 13 - x * 7); return [190, 160, 112, Math.max(0, 1 - r) * 0.8 * n]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, G = S.guard, feet = S.feet, point = S.point, bodyC = S.hit, RF = S.rankFeet, NP = S.rankPairs;
  const alone = !k.blows;
  const own = [{ at: 1000, to: G[1] }, { at: 1650, to: G[2] }, { at: 2300, to: G[0] }];
  const near = (to) => G.reduce((b, g) => (Math.hypot(g[0] - to[0], g[1] - to[1]) < Math.hypot(b[0] - to[0], b[1] - to[1]) ? g : b), G[0]);
  const B = (k.blows || own).slice().sort((a, b) => a.at - b.at).map((b, i) => ({ t: Math.max(300, Math.min(2600, b.at)), g: near(b.to), s: 1 + 0.12 * i }));
  const last = B.at(-1).t;
  // the bearers as drawn (left rank; the right is its mirror), for the clicks of light and the dust
  const LEFT = []; for (let i = 0, x = 106, b = 182, kk = 0.74; i < 10; i++) { LEFT.push([x, b, kk]); x -= 20 * kk; b -= 2.2; kk *= 0.93; }

  k.css(`.g-dawn { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,252,236,.95), rgba(255,230,160,.55) 28%, rgba(255,200,110,.16) 58%, rgba(255,180,80,0) 100%); }
    .g-grow { border-radius: 50%; background: radial-gradient(closest-side, rgba(246,255,214,.95), rgba(176,232,110,.55) 30%, rgba(120,200,80,.16) 60%, rgba(100,190,70,0) 100%); }
    .fx-copy.f-hot { mix-blend-mode: plus-lighter; filter: brightness(1.5) saturate(1.3) hue-rotate(-8deg); }`);

  // ── what shakes him: the brace (0..1), and each blow's damped shake (push, then rebound)
  const holdTo = Math.min(last + 800, 2800), relaxTo = 3560;
  const brace = (t) => sm(Math.max(0, Math.min(1, (t - 60) / 340))) * (1 - sm(Math.max(0, Math.min(1, (t - holdTo) / (relaxTo - holdTo)))));
  const shake = (tau) => (tau <= 0 ? 0 : (Math.exp(-tau / 170) * Math.sin((2 * Math.PI * tau) / 280)) / 0.66);
  const flash = (tau) => (tau < -15 ? 0 : tau < 0 ? 1 + tau / 15 : Math.exp(-tau / 240));
  const hit = (t) => Math.max(0, ...B.map((b) => flash(t - b.t) * b.s));
  const away = (g, p) => { const d = [p[0] - g[0], p[1] - g[1]], n = Math.hypot(...d) || 1; return [d[0] / n, d[1] / n]; };
  const push = (g) => (g[0] < 150 ? 1 : -1); // a blow from the left (x < 150) pushes right

  // ── where he and his shield are at ms t (a pose: drawing units and degrees)
  const man = (t) => {
    const b = brace(t);
    let dx = 0, dy = 0.5 * b, th = 0;
    for (const bl of B) { const x = shake(t - bl.t - 25) * bl.s, d = push(bl.g); dx += d * 1.1 * x; dy += 0.35 * Math.abs(x); th += d * 1.1 * x; }
    return { dx, dy, th };
  };
  // a point of his carried by the body's pose (it turns about his feet)
  const carry = (p, m, c = feet) => { const r = (m.th * Math.PI) / 180, vx = p[0] - c[0], vy = p[1] - c[1]; return [c[0] + vx * Math.cos(r) - vy * Math.sin(r) + m.dx, c[1] + vx * Math.sin(r) + vy * Math.cos(r) + m.dy]; };
  const shield = (t) => {
    const b = brace(t);
    let dx = 0, dy = 1.4 * b, th = 0;
    for (const bl of B) {
      const x = shake(t - bl.t) * bl.s, d = push(bl.g), side = Math.max(-1, Math.min(1, (bl.g[1] - 140) / 30));
      dx += d * 2.4 * x; dy += 0.8 * Math.abs(x) * (side + 1.2); th += x * (1.1 * d + 0.4 * side);
    }
    return { dx, dy, th };
  };
  const rank = (t, i) => { // pair i (0..9): feet at RF[i], 'dist' from the centre
    const [x] = RF[i], dist = Math.abs(x - 150);
    const tb = t - 90 - dist * 2.4, bi = sm(Math.max(0, Math.min(1, tb / 240))) * (1 - sm(Math.max(0, Math.min(1, (t - holdTo - dist * 0.5) / (relaxTo - holdTo - 250)))));
    let dx = -Math.sign(x - 150) * 0.5 * bi, dy = 0.5 * bi, th = 0;
    for (const bl of B) {
      const d2 = Math.abs(x - bl.g[0]), tau = t - bl.t - 60 - d2 * 1.9, a = bl.s / (1 + d2 / 120), sx = shake(tau) * a, dr = Math.sign(x - bl.g[0]) || 1;
      dx += dr * 1.2 * sx; dy += 0.5 * Math.abs(sx); th += dr * 1.6 * sx;
    }
    return { dx, dy, th };
  };
  const tf = (p) => `${k.T(p.dx, p.dy)} rotate(${p.th.toFixed(2)}deg)`;
  const grid = [];
  for (let t = 0; t <= 3560; t += 40) grid.push(t);
  const sample = (fn, last0 = {}) => [...grid.map((t) => [t, fn(t), 'linear']), [3700, { transform: 'none', ...last0 }]];
  act(k.part('him'), sample((t) => ({ transform: tf(man(t)) })));
  for (const nm of ['shield', 'vines', 'hands', 'buds']) act(k.part(nm), sample((t) => ({ transform: tf(shield(t)) })));
  act(k.part('roots'), sample((t) => { const s = shield(t); return { transform: `${k.T(s.dx * 0.5, s.dy * 0.4)}` }; }));
  // the sun on his shield rides with it (its centre carried round the shield's point) and flares at each blow
  const sunC = S.sunmark;
  act(k.part('sunmark'), sample((t) => { const s = shield(t), c = carry(sunC, s, point); return { transform: `${k.T(c[0] - sunC[0], c[1] - sunC[1])} rotate(${s.th.toFixed(2)}deg) scale(${(1 + 0.2 * hit(t) + 0.06 * brace(t)).toFixed(3)})` }; }));
  RF.forEach((_, i) => act(k.part(i < NP ? `rankL${i}` : `rankR${i - NP}`), sample((t) => ({ transform: tf(rank(t, i)) }))));

  // ── the gold edge of his shield: a gold copy behind it, 5% larger, lit by the brace and at each blow
  const rim = k.copy('shield', 'fx-rim', { behind: true });
  act(rim, sample((t) => ({ transform: `${tf(shield(t))} scale(1.05)`, opacity: +Math.min(1, 0.03 + 0.28 * brace(t) + 0.9 * hit(t)).toFixed(2) }), { opacity: 0 }));
  // the vines, hot and green, a bright copy over them
  const hotV = k.copy('vines', 'f-hot'), hotR = k.copy('roots', 'f-hot');
  const run = (t, off) => Math.max(0, ...B.map((b) => flash(t - b.t - off) * b.s));
  act(hotV, sample((t) => ({ transform: tf(shield(t)), opacity: +Math.min(1, 0.55 * brace(t) + 0.5 * run(t, 80)).toFixed(2) }), { opacity: 0 }));
  act(hotR, sample((t) => { const s = shield(t); return { transform: `${k.T(s.dx * 0.5, s.dy * 0.4)}`, opacity: +Math.min(1, 0.7 * brace(t) + 0.6 * run(t, 40)).toFixed(2) }; }, { opacity: 0 }));

  // ── the buds light and flare, the green wave running up the vines from the ground
  const BUDS = [[123, 121], [180, 133], [112, 71], [188, 69], [138, 183], [94, 151]];
  BUDS.forEach(([x, y], i) => {
    const delay = (203 - y) * 0.9, l = [[0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [120 + delay, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [320 + delay, { transform: 'scale(1)', opacity: 0.7 }, eio]];
    for (const bl of B) l.push([bl.t + 60 + delay * 0.6, { transform: 'scale(1.1)', opacity: 0.7 }, 'ease-out'], [bl.t + 130 + delay * 0.6, { transform: `scale(${(1.7 * bl.s).toFixed(2)})`, opacity: 1 }, eio], [bl.t + 520 + delay * 0.6, { transform: 'scale(1.1)', opacity: 0.6 }, eio]);
    l.push([holdTo + 500, { transform: 'scale(1)', opacity: 0.5 }, eio], [3500, { transform: 'scale(.5)', opacity: 0 }]);
    fx(k.lightIn('g-grow', [x, y], 24, 24), l.sort((p, q) => p[0] - q[0]).filter((e, j, a) => j === 0 || e[0] > a[j - 1][0]));
  });

  // ── the roots drink the force: a green light runs out along them from the point, at the brace and at each blow
  const rootPts = [[[132, 202], [112, 202], [92, 206]], [[168, 203], [188, 202], [208, 205]]];
  const pulse = (t, amp) => rootPts.forEach((side, sd) => side.forEach((p, j) => {
    const t0 = t + j * 70 + sd * 15;
    fx(k.lightIn('g-grow', p, 34, 18), [[t0, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t0 + 80, { transform: `scale(${(1.1 * amp).toFixed(2)})`, opacity: Math.min(1, 0.9 * amp) }, eio], [t0 + 560, { transform: 'scale(1.6)', opacity: 0 }]]);
  }));
  pulse(150, 0.8); B.forEach((b) => pulse(b.t + 10, b.s));
  // and where the point is driven in: a burst of green at the earth
  fx(k.lightIn('g-grow', [150, 201], 70, 28), [[100, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [300, { transform: 'scale(1.2)', opacity: 0.95 }, eio], [900, { transform: 'scale(1)', opacity: 0.4 }, eio], [3500, { transform: 'scale(.7)', opacity: 0.35 }, eio], [3700, { transform: 'scale(.6)', opacity: 0 }]]);

  // ── the line locking: a click of gold at each shield as the bearers shuffle in, and the shock passing
  LEFT.forEach(([x0, b, kk], i) => [x0, 300 - x0].forEach((x, side) => {
    const sy = b - 27 * kk * 0.85, w = 22 * kk, dist = Math.abs(x - 150), list = [[0, { opacity: 0, transform: 'scale(.5)' }, 'ease-out']];
    const ts = 90 + dist * 2.4 + 200;
    list.push([ts, { opacity: 0, transform: 'scale(.5)' }, 'ease-out'], [ts + 50, { opacity: 0.9, transform: 'scale(1.1)' }], [ts + 320, { opacity: 0, transform: 'scale(1.5)' }]);
    for (const bl of B) {
      const d2 = Math.abs(x - bl.g[0]), tp = Math.round(bl.t + 60 + d2 * 1.9), a = Math.min(1, bl.s / (1 + d2 / 220));
      list.push([tp - 20, { opacity: 0, transform: 'scale(.6)' }, 'ease-out'], [tp + 30, { opacity: +a.toFixed(2), transform: 'scale(1.2)' }], [tp + 320, { opacity: 0, transform: 'scale(1.7)' }]);
    }
    list.sort((p, q) => p[0] - q[0]);
    fx(k.lightIn('g-dawn', [x, sy], w, w * 1.5), list.filter((e, j, a) => j === 0 || e[0] > a[j - 1][0]));
    // dust kicked up at his feet as the shock passes
    if (i % 2 === 0) for (const bl of B) {
      const d2 = Math.abs(x - bl.g[0]), tp = Math.round(bl.t + 80 + d2 * 1.9), r = Math.round(rand() * 360), sc = 0.5 + 0.5 * Math.min(1, bl.s / (1 + d2 / 140));
      fx(k.picIn('dust', [x, b + 1], 11, 10, { lit: false }), [[tp, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [tp + 120, { transform: `${k.T(1.5, -2)} rotate(${r + 15}deg) scale(${sc.toFixed(2)})`, opacity: 0.5 * sc }], [tp + 560, { transform: `${k.T(5, -8)} rotate(${r + 40}deg) scale(${(1.3 * sc).toFixed(2)})`, opacity: 0 }]]);
    }
  }));

  // ── at each blow: a flash and a ring of gold at the guard, the sun flaring, sparks and leaves flung back, dust at his feet
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#fff3cc" stroke-width="3" filter="url(#b)"/>', 60, 60);
  const leaf = k.svg('<path d="M1,6Q4,0 12,1Q10,8 1,6Z" fill="#d8f08c"/><path d="M2,5.4Q7,3.6 11,1.6" stroke="#7ea84a" stroke-width=".7" fill="none"/>', 13, 8);
  const bolt = k.svg('<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a1d38" stop-opacity="0"/><stop offset=".6" stop-color="#241a30" stop-opacity=".9"/><stop offset="1" stop-color="#0d0812"/></linearGradient></defs>' +
    '<path d="M0,5Q14,1 28,5Q14,9 0,5Z" fill="url(#g)"/><path d="M20,4.6Q27,4 30,5Q27,6 20,5.4Z" fill="#8c6bd0" opacity=".7"/>', 30, 10);
  B.forEach((bl, i) => {
    const t = bl.t, [gx, gy] = bl.g, s = bl.s, side = gx < 150 ? -1 : 1; // sparks fly back the way the blow came
    fx(k.light('g-dawn', bl.g, 66), [[t - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 20, { transform: `scale(${(1.3 * s).toFixed(2)})`, opacity: 1 }, eio], [t + 160, { transform: `scale(${(1.6 * s).toFixed(2)})`, opacity: 0.5 }, eio], [t + 440, { transform: 'scale(2.1)', opacity: 0 }]]);
    fx(k.pic(ring, bl.g, 26, 26), [[t, { transform: 'scale(.3, .2)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(.6, .45)', opacity: 0.95 }], [t + 420, { transform: `scale(${(1.9 * s).toFixed(2)}, ${(1.4 * s).toFixed(2)})`, opacity: 0 }]]);
    // the sun mark flaring, and a green wave over the shield
    fx(k.light('g-dawn', [150, 133], 56), [[t - 20, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 30, { transform: `scale(${(1.1 * s).toFixed(2)})`, opacity: 0.95 }], [t + 380, { transform: 'scale(1.5)', opacity: 0 }]]);
    fx(k.light('g-grow', [150, 150], 100), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 90, { transform: `scale(${(0.9 * s).toFixed(2)})`, opacity: 0.55 }, eio], [t + 520, { transform: 'scale(1.3)', opacity: 0 }]]);
    for (let j = 0; j < 11; j++) {
      const a = Math.atan2(-0.7, side) + (rand() - 0.5) * 2, dist = 14 + rand() * 30, g = 10 + rand() * 12, sz = 6 + rand() * 6, t0 = t + rand() * 40;
      const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * dist * f, Math.sin(a) * dist * f + g * f * f)} scale(${sc})`, opacity: o });
      fx(k.pic('spark', bl.g, sz, sz), [[t0, P(0, 0.5, 0), 'ease-out'], [t0 + 40, P(0.2, 1.1, 1), 'ease-out'], [t0 + 240, P(0.75, 0.9, 0.9), 'ease-in'], [t0 + 480 + rand() * 160, P(1, 0.3, 0)]]);
    }
    for (let j = 0; j < 6; j++) { // splinters of leaf
      const a = Math.atan2(-0.9, side) + (rand() - 0.5) * 2.4, dist = 16 + rand() * 34, g = 14 + rand() * 14, sz = 6 + rand() * 4, t0 = t + 10 + rand() * 50, r0 = Math.round(rand() * 360);
      const P = (f, o) => ({ transform: `${k.T(Math.cos(a) * dist * f, Math.sin(a) * dist * f + g * f * f)} rotate(${Math.round(r0 + f * 300)}deg)`, opacity: o });
      fx(k.pic(leaf, bl.g, sz * 1.5, sz * 0.9, { lit: false }), [[t0, P(0, 0), 'ease-out'], [t0 + 50, P(0.1, 1), 'ease-out'], [t0 + 500, P(0.8, 0.9), 'ease-in'], [t0 + 800, P(1, 0)]]);
    }
    for (let j = 0; j < 3; j++) {
      const x = feet[0] + (j - 1) * 14 + (rand() - 0.5) * 4, t0 = t + 30 + j * 30, r = Math.round(rand() * 360);
      fx(k.picIn('dust', [x, feet[1] + 1], 18, 16, { lit: false }), [[t0, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 120, { transform: `${k.T((j - 1) * 3, -3)} rotate(${r + 15}deg) scale(.9)`, opacity: 0.55 }], [t0 + 650, { transform: `${k.T((j - 1) * 7, -11)} rotate(${r + 40}deg) scale(1.6)`, opacity: 0 }]]);
    }
    // alone: a spear of shadow comes at the shield (190 ms of flight) and bursts into gloom the light thins away
    if (alone) {
      const Sx = [gx + side * 125 + side * rand() * 12, gy - 30 + (i - 1) * 14], C = [(Sx[0] + gx) / 2, Math.min(Sx[1], gy) - 14];
      const pts = k.arc(Sx, C, bl.g, 7, (u) => Math.pow(u, 1.5)), [X0, Y0] = k.P(...Sx), T0 = t - 190;
      const ang = (p, q) => (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI;
      const GP = k.P(...bl.g);
      fx(k.pic(bolt, Sx, 40, 13), [...pts.map((p, j) => { const [x, y] = k.P(...p), a = ang(pts[Math.max(0, j - 1)], pts[Math.min(7, j + 1)]); return [Math.round(T0 + (190 * j) / 7), { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) rotate(${a.toFixed(1)}deg)`, opacity: j === 0 ? 0 : 1 }, 'linear']; }), [t + 18, { transform: `translate(${(GP[0] - X0).toFixed(1)}px, ${(GP[1] - Y0).toFixed(1)}px) rotate(${ang(pts[6], pts[7]).toFixed(1)}deg)`, opacity: 0 }]]);
      for (let j = 1; j < 7; j++) fx(k.pic('gloom', pts[j], 20, 20, { lit: false }), [[Math.round(T0 + (190 * j) / 7), { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [Math.round(T0 + (190 * j) / 7) + 80, { transform: 'scale(.8)', opacity: 0.5 }], [Math.round(T0 + (190 * j) / 7) + 240, { transform: `${k.T(-2, -4)} scale(1.4)`, opacity: 0 }]]);
      for (let j = 0; j < 5; j++) {
        const a = Math.atan2(-0.4, side) + (rand() - 0.5) * 2.2, d = 8 + rand() * 12, r = Math.round(rand() * 360);
        fx(k.pic('gloom', bl.g, 20, 20, { lit: false }), [[t - 5, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 70, { transform: `${k.T(Math.cos(a) * d * 0.5, Math.sin(a) * d * 0.5 - 2)} rotate(${r + 20}deg) scale(1)`, opacity: 0.7 }], [t + 600, { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d - 12)} rotate(${r + 60}deg) scale(1.8)`, opacity: 0 }]]);
      }
    }
  });
}
