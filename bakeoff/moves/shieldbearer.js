// Shieldbearer: he takes a volley on his shield.
//
// PLAN (drawing units 300 x 210, ms of the move)
//   0-500     he braces: leans into the shield, the shield settles forward; the
//             three arrows in flight hang and tremble, then begin to come on.
//   620-1000  the first arrow (the low one) streaks in along a falling arc and
//             strikes the shield at 1000. It GLANCES: spins off up and away.
//   1120-1500 the second (the middle one) strikes at 1500 and SHATTERS in
//             splinters.
//   1620-2000 the third (the high one) plunges onto the shield's top edge at
//             2000 and GLANCES off.
//   at each blow: the shield (with the three arrows stuck in it) jolts back
//             into him and rebounds, the arrows in it quiver, he is shoved and
//             rocks; a flash of gold light runs along the shield's rim (a gold
//             copy of the shield, 7% larger, as Home's angel's shield edge),
//             gold sparks fly off, a pulse of light from the low sun behind;
//             grit and dust kick up at his knee and foot.
//   2400-3100 he holds, then sags and settles; the gold fades.
//   2900-3450 the three arrows fade back in, in flight, where they are drawn.
//   3500      at rest as drawn.
export const END = 4000;
export const STILLS = [300, 800, 990, 1090, 1520, 2020, 2700, 3700];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 214 + 40 * c * c, 120 + 120 * c * c, Math.min(1, c * c * 2.2)]; }],
  grit: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2; return [96, 74, 48, Math.max(0, Math.min(1, (1 - r) * 3))]; }],
  dust: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, n = 0.75 + 0.25 * Math.sin(x * 17 + y * 11) * Math.cos(y * 13 - x * 7); return [176, 146, 100, Math.max(0, 1 - r) * 0.8 * n]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out';
  const man = k.part('man'), shield = k.part('shield'), stuck = k.part('stuck'), fly = [k.part('fly0'), k.part('fly1'), k.part('fly2')];
  const H = k.spec.hits;
  // the arrows' start (tail x, y, angle as drawn) and tip (their pivot)
  const AR = [[266, 56, 160], [240, 32, 163], [284, 90, 156]];
  const tip = ([x, y, a]) => [x + 22 * Math.cos(a * Math.PI / 180), y + 22 * Math.sin(a * Math.PI / 180)];
  // order they land: low one (fly2) first, then the middle (fly0), then the high (fly1)
  const VOLLEY = [{ i: 2, t: 1000, hit: H[0], kind: 'glance', s: 1 }, { i: 0, t: 1500, hit: H[1], kind: 'shatter', s: 1.15 }, { i: 1, t: 2000, hit: H[2], kind: 'glance', s: 1.3 }];

  k.css(`.g-gold { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,246,214,.95), rgba(255,208,130,.5) 25%, rgba(255,170,70,.14) 55%, rgba(255,150,40,0) 100%); }`);

  // ── the shield, and what rides on it: a list of poses [ms, dx, dy, deg, easing]
  const Bs = [1.4, 0.2, 0.6], Bm = [0.6, 0, 1.3]; // the brace
  const shieldPoses = [[0, 0, 0, 0, eio], [450, ...Bs, eio]];
  const manPoses = [[0, 0, 0, 0, eio], [450, ...Bm, eio]];
  for (const v of VOLLEY) {
    const t = v.t, s = v.s;
    shieldPoses.push([t - 1, ...Bs, 'ease-out'], [t + 28, Bs[0] - 3.2 * s, Bs[1] + 0.9 * s, Bs[2] - 2.1 * s, eio], [t + 105, Bs[0] + 1.3 * s, Bs[1] - 0.3, Bs[2] + 0.9 * s, eio],
      [t + 200, Bs[0] - 0.9 * s, Bs[1] + 0.2, Bs[2] - 0.5 * s, eio], [t + 330, ...Bs, eio]);
    manPoses.push([t + 10, ...Bm, 'ease-out'], [t + 70, Bm[0] - 1.6 * s, Bm[1] + 0.4, Bm[2] - 1.5 * s, eio], [t + 170, Bm[0] + 0.7 * s, Bm[1], Bm[2] + 0.6 * s, eio], [t + 290, Bm[0] - 0.4 * s, Bm[1], Bm[2] - 0.3 * s, eio], [t + 440, ...Bm, eio]);
  }
  // he holds, then sags and settles
  shieldPoses.push([2500, ...Bs, eio], [2850, -0.5, 0.5, -0.3, eio], [3250, 0, 0, 0]);
  manPoses.push([2500, ...Bm, eio], [2900, -0.3, 1.0, 0.2, eio], [3300, 0.2, 0, -0.1, eio], [3600, 0, 0, 0]);
  const pose = (p, extra = '') => ({ transform: `${k.T(p[1], p[2])} rotate(${p[3].toFixed(2)}deg)${extra}` });
  act(shield, shieldPoses.map((p) => [p[0], pose(p), p[4]]));
  act(man, manPoses.map((p) => [p[0], pose(p), p[4]]));
  // the arrows stuck in the shield ride with it, and quiver after each blow
  const stuckK = shieldPoses.map((p) => [p[0], pose(p), p[4]]);
  for (const v of VOLLEY) for (let j = 0; j < 5; j++) stuckK.push([v.t + 40 + j * 38, pose([0, Bs[0] + 0.2, Bs[1], Bs[2] + (j % 2 ? 1 : -1) * (1.5 - j * 0.28) * v.s]), eio]);
  stuckK.sort((a, b) => a[0] - b[0]);
  // (drop any moment that comes at the same ms as an earlier one)
  act(stuck, stuckK.filter((x, i, a) => i === 0 || x[0] > a[i - 1][0]));

  // ── the gold edge of the shield: a gold copy, 7% larger, behind it, lit at each blow
  const rim = k.copy('shield', 'fx-rim', { behind: true });
  const rimK = shieldPoses.map((p) => ({ ms: p[0], p }));
  const op = (ms) => {
    let o = 0.04;
    for (const v of VOLLEY) { const d = ms - v.t; if (d >= 0 && d < 520) o = Math.max(o, 0.95 * Math.pow(1 - d / 520, 1.6)); }
    if (ms > 2050 && ms < 3100) o = Math.max(o, 0.22 * (1 - (ms - 2050) / 1050));
    return o;
  };
  const rimList = []; const times = new Set([0, 3300]);
  for (const v of VOLLEY) [v.t - 1, v.t, v.t + 28, v.t + 80, v.t + 160, v.t + 280, v.t + 420, v.t + 520].forEach((t) => times.add(t));
  [450, 2050, 2500, 2850].forEach((t) => times.add(t));
  const posAt = (ms) => { const L = shieldPoses; let i = L.length - 1; while (i > 0 && L[i][0] > ms) i--; const a = L[i], b = L[Math.min(i + 1, L.length - 1)]; const f = b[0] === a[0] ? 0 : Math.min(1, Math.max(0, (ms - a[0]) / (b[0] - a[0]))); return [0, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, a[3] + (b[3] - a[3]) * f]; };
  for (const t of [...times].sort((a, b) => a - b)) {
    const o = op(t); // (the pulse is held at the moment of the blow, then dies away)
    rimList.push([t, { ...pose(posAt(t), ' scale(1.07)'), opacity: +o.toFixed(2) }, 'ease-out']);
  }
  act(rim, rimList.filter((x, i, a) => i === 0 || x[0] > a[i - 1][0]));

  // ── the arrows: hang and tremble, come on along a falling arc, strike, then glance off or shatter; fade back in at the end
  const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
  for (const v of VOLLEY) {
    const A = AR[v.i], T0 = tip(A), a0 = A[2], E = v.hit, ts = v.t - 400;
    const dir = [Math.cos(a0 * Math.PI / 180), Math.sin(a0 * Math.PI / 180)], d = Math.hypot(E[0] - T0[0], E[1] - T0[1]);
    const ctrl = [T0[0] + dir[0] * d * 0.5, T0[1] + dir[1] * d * 0.5];
    const path = k.arc(T0, ctrl, E, 10, (t) => Math.pow(t, 1.45));
    const rel = (p) => [p[0] - T0[0], p[1] - T0[1]];
    const arrowPose = (dx, dy, rot) => ({ transform: `${k.T(dx, dy)} rotate(${rot.toFixed(1)}deg)` });
    const list = [[0, arrowPose(0, 0, 0), eio]];
    // hanging in the air, trembling, drifting a little toward him
    for (let t = 160, j = 0; t < ts - 80; t += 140 + rand() * 40, j++) list.push([t, arrowPose(-(t / ts) * 3, (t / ts) * 1.2 + (j % 2 ? 0.6 : -0.4), (j % 2 ? 1 : -1) * (0.8 + rand() * 0.8)), eio]);
    const drift = [-3, 1.2];
    // the flight (starting from where it drifted to)
    path.forEach((p, j) => {
      const [dx, dy] = rel(p), f = j / 10, rot = j === 0 ? 0 : ang(path[j - 1], p) - a0 + (j === 10 ? 0 : 0);
      list.push([Math.round(ts + 400 * f), arrowPose(dx + drift[0] * (1 - f), dy + drift[1] * (1 - f), rot), 'linear']);
    });
    // (the flight's own times: j/10 along an accelerating pace; make sure they run forward)
    const fl = list.filter((x, i, a) => i === 0 || x[0] > a[i - 1][0]);
    const hitRel = rel(E), hitRot = ang(path[9], path[10]) - a0;
    const th = v.t, out = [...fl];
    if (v.kind === 'glance') {
      // knocked aside: spins up and away, falling, fading
      out.push([th, arrowPose(hitRel[0], hitRel[1], hitRot), 'ease-out']);
      out.push([th + 60, { ...arrowPose(hitRel[0] + 3, hitRel[1] - 9, hitRot - 40), opacity: 1 }, 'linear']);
      out.push([th + 170, { ...arrowPose(hitRel[0] + 14, hitRel[1] - 18, hitRot - 120), opacity: 0.95 }, 'linear']);
      out.push([th + 300, { ...arrowPose(hitRel[0] + 28, hitRel[1] - 14, hitRot - 220), opacity: 0.7 }, 'linear']);
      out.push([th + 460, { ...arrowPose(hitRel[0] + 40, hitRel[1] + 16, hitRot - 330), opacity: 0 }, 'linear']);
    } else {
      // gone in a burst
      out.push([th, { ...arrowPose(hitRel[0], hitRel[1], hitRot), opacity: 1 }, 'linear']);
      out.push([th + 22, { ...arrowPose(hitRel[0] + 1, hitRel[1], hitRot), opacity: 0 }]);
    }
    // (as `fl` is already in flight order, the opacity is 1 until the blow)
    for (const e of out) if (!('opacity' in e[1])) e[1].opacity = 1;
    out.push([2950, { ...arrowPose(0, 0, 0), opacity: 0 }, 'linear'], [3450, { ...arrowPose(0, 0, 0), opacity: 1 }]);
    act(fly[v.i], out);
  }

  // ── at each blow: gold flash on the rim, sparks, shards, a pulse of the sun, grit and dust
  const sunPulse = [];
  for (const v of VOLLEY) {
    const t = v.t, [hx, hy] = v.hit, s = v.s;
    // the rim's light flaring where it struck
    fx(k.lightIn('g-gold', [hx, hy], 44, 44), [[t - 1, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 12, { transform: 'scale(1.15)', opacity: 1 }, 'ease-out'], [t + 90, { transform: 'scale(1.4)', opacity: 0.7 }], [t + 360, { transform: 'scale(1.9)', opacity: 0 }]]);
    fx(k.lightIn('g-gold', [hx - 1, hy], 16, 64 * s * 0.8 + 10), [[t - 1, { transform: 'scale(1, .4)', opacity: 0 }, 'ease-out'], [t + 18, { transform: 'scale(1, 1)', opacity: 0.95 }], [t + 120, { transform: 'scale(1, 1.15)', opacity: 0.55 }], [t + 420, { transform: 'scale(.7, 1.3)', opacity: 0 }]]);
    // golden sparks thrown off (up, out and down)
    for (let n = 0; n < 11; n++) {
      const a = (-1.15 + rand() * 2.3) * 0.9, r = 12 + rand() * 20 * s, ex = Math.cos(a) * r * 0.9 + 5, ey = Math.sin(a) * r * 0.9 - 5 + 6 * rand();
      const sz = 2.5 + rand() * 3.2, t0 = t + rand() * 40, life = 280 + rand() * 260;
      const pts = k.arc([0, 0], [ex * 0.6, ey - 6 - rand() * 6], [ex + 3, ey + 9 + rand() * 6], 5);
      fx(k.picIn('spark', [hx + 1, hy], sz, sz), pts.map(([x, y], j) => [Math.round(t0 + life * j / 5), { transform: `${k.T(x, y)} scale(${(1 - 0.6 * j / 5).toFixed(2)})`, opacity: j === 5 ? 0 : 1 - 0.12 * j }, j < 2 ? 'ease-out' : 'linear']));
    }
    // the sun behind him pulses
    sunPulse.push([t - 1, { opacity: 0.05 }], [t + 14, { opacity: 0.32 }], [t + 330, { opacity: 0.05 }]);
    // grit and dust at his knee and foot
    for (const [gx, gy, side] of [[112, 187.5, -1], [152, 188, 1]]) {
      fx(k.picIn('dust', [gx, gy - 4], 26, 20, { lit: false }), [[t + 40, { transform: `${k.T(0, 2)} scale(.35, .3)`, opacity: 0 }, 'ease-out'], [t + 130, { transform: `${k.T(side * 3, -2)} scale(.9, .75)`, opacity: 0.65 * Math.min(1, s) }, 'ease-out'], [t + 700, { transform: `${k.T(side * 9, -9)} scale(1.7, 1.2)`, opacity: 0 }]]);
      for (let n = 0; n < 5; n++) {
        const dx = side * (3 + rand() * 12) + (rand() - 0.5) * 6, rise = 5 + rand() * 9, sz = 1.4 + rand() * 1.8, t0 = t + 30 + rand() * 60, life = 360 + rand() * 200;
        const pts = k.arc([0, 0], [dx * 0.55, -rise * 1.8], [dx, 1 + rand() * 2], 5);
        fx(k.picIn('grit', [gx + (rand() - 0.5) * 6, gy], sz, sz, { lit: false }), pts.map(([x, y], j) => [Math.round(t0 + life * j / 5), { transform: `${k.T(x, y)}`, opacity: j === 5 ? 0 : 0.9 }, j < 2 ? 'ease-out' : 'ease-in']));
      }
    }
    // splinters when it shatters: dark wood and pale heartwood, flying out and spinning
    if (v.kind === 'shatter') {
      const wood = k.svg('<path d="M0,1.5 L11,0 L12,2.2 L1,2.6Z" fill="#3b2b1b"/>', 12, 3), pale = k.svg('<path d="M0,1 L8,0 L9,1.6 L1,2Z" fill="#e6cd96"/>', 9, 2.4), fea = k.svg('<path d="M0,0 L5,-2 L6,2 L0,1Z M0,0 L4,3 L2,-1Z" fill="#2b2016"/>', 8, 6);
      for (let n = 0; n < 9; n++) {
        const a = (-1.3 + rand() * 2.6) * 0.95, r = 14 + rand() * 26, ex = Math.cos(a) * r + 6, ey = Math.sin(a) * r * 0.9 + (rand() - 0.2) * 8 + 8;
        const src = [wood, pale, fea][n % 3], w = src === wood ? 9 : src === pale ? 7 : 6, h = w * 0.3 + 1.5, t0 = t + 5 + rand() * 30, life = 420 + rand() * 280, spin = (rand() - 0.5) * 700;
        const pts = k.arc([0, 0], [ex * 0.55, ey - 14 - rand() * 8], [ex + 3, ey + 14 + rand() * 8], 6);
        fx(k.picIn(src, [hx + 3, hy], w, h, { lit: false }), pts.map(([x, y], j) => [Math.round(t0 + life * j / 6), { transform: `${k.T(x, y)} rotate(${(spin * j / 6).toFixed(0)}deg)`, opacity: j === 6 ? 0 : 1 }, j < 2 ? 'ease-out' : 'linear']));
      }
    }
  }
  // the low sun behind him pulsing with the blows
  fx(k.lightIn('g-gold', [98, 140], 150, 130), [[0, { opacity: 0 }], ...sunPulse.filter((x, i, a) => i === 0 || x[0] >= a[i - 1][0]), [2500, { opacity: 0 }]]);
}
