// Vesh, the Red Widow: she calls the blood of her roses into her hands and throws it.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker, element: blood.
//   100-700   the crimson drops over her palms fall in on themselves (gathering); from the
//             briar roses round her, motes of red light draw in to her hands as the roses
//             glow; both arms lift outward and a bright red orb swells in each palm.
//   700-1180  wind-up: the throwing arm (the one nearer T) is drawn back through rest,
//             the orb swelling; the veil lifts and begins to stream harder; the ravens
//             on the graves startle.
//   1180-1300 she throws (BEATS.release 1250): the arm snaps to point at T, a flash and
//             ring at the palm, and a fan of seven blood-lances goes from the palm to T
//             along arcs, each with two drops trailing; the veil whips back.
//   1700      (BEATS.impact) the first lance lands: a flash, a ring, a spray of drops, thorn
//             spikes, a crimson mist, rose petals flung out and drifting down.
//   2050-2900 the drain: red wisps run back from T into her chest; her chest flares and a
//             pale ring spreads from her; the off hand's orb dies down.
//   2100-3300 the arm eases home; the drops reform over her palms (3300-3800); ravens land.
//   3700      at rest as drawn (the move ends at END).
//
// The contract (bakeoff/recipe.md): her blood goes to T = k.aim || her own target (the
// graves on her right); the throwing arm is the nearer one and points at T, every lance is
// worked out from the palm's emit point and T; what flies and lands is on the overlay.
// BEATS: when the lances leave, when the first lands, when she is at rest again.
export const END = 4200;
export const BEATS = { release: 1250, impact: 1700, settle: 3700 };
export const STILLS = [450, 950, 1260, 1480, 1760, 2100, 2800, 3900];

export const textures = {
  drop: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, (y - 0.5) * 1.05) * 2, c = Math.max(0, 1 - r), h = Math.max(0, 1 - Math.hypot(x - 0.4, y - 0.38) * 5); return [255, 46 + 190 * h, 70 + 170 * h, Math.min(1, c * 2.6)]; }],
  orb: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 70 + 185 * c * c * c, 90 + 160 * c * c * c, Math.min(1, c * 1.8)]; }],
  mist: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, n = 0.7 + 0.3 * Math.sin(x * 13 + 2) * Math.cos(y * 11 - 1); return [190, 24, 46, Math.max(0, 1 - r * r) * 0.75 * n]; }],
  petal: [32, 32, (x, y) => { const u = (x - 0.5) * 2, v = (y - 0.5) * 3.2, r = Math.hypot(u, v), c = Math.max(0, 1 - r); return [200 - 60 * y, 20, 44, Math.min(1, c * 3)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out', sm = k.smooth, D2R = Math.PI / 180;
  const S = k.spec, SH = S.shoulders, PALM = S.palms;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const L = { part: 'armL', hand: 'handL', drops: 'dropsL', sh: SH[0], emit: [300 - S.emit[0], S.emit[1]], palm: PALM[0], dir: -1 };
  const R = { part: 'armR', hand: 'handR', drops: 'dropsR', sh: SH[1], emit: S.emit, palm: PALM[1], dir: 1 };

  k.css(`.g-blood { border-radius: 50%; background: radial-gradient(circle, rgba(255,226,230,.95), rgba(255,70,96,.62) 30%, rgba(220,24,52,.22) 56%, rgba(190,10,40,0) 72%); }
    .g-rose { border-radius: 50%; background: radial-gradient(circle, rgba(255,120,140,.8), rgba(220,30,60,.35) 45%, rgba(200,20,50,0) 70%); }`);
  const lance = k.svg('<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c01632" stop-opacity="0"/><stop offset=".55" stop-color="#ff2e4a"/><stop offset="1" stop-color="#ffe2e6"/></linearGradient></defs><path d="M0,3 C6,1 15,.5 26,3 C15,5.5 6,5 0,3Z" fill="url(#g)"/><path d="M8,3 L25,3" stroke="#fff" stroke-width=".7" stroke-linecap="round" opacity=".8"/>', 26, 6);
  const ring = k.svg('<circle cx="20" cy="20" r="17" fill="none" stroke="#ff4a62" stroke-width="2.4"/><circle cx="20" cy="20" r="17" fill="none" stroke="#ffd6dc" stroke-width=".8"/>', 40, 40);
  const thorn = k.svg('<defs><linearGradient id="t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a0c22"/><stop offset="1" stop-color="#ff5068"/></linearGradient></defs><path d="M0,0 L22,3.4 L0,6.8 Q3,3.4 0,0Z" fill="url(#t)"/>', 22, 6.8);

  // ── where her blood goes, and which arm throws
  const T = k.aim || [244, 132];
  const side = T[0] >= 150 ? R : L, off = side === R ? L : R;
  const rot = (p, c, deg) => { const r = deg * D2R, x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * Math.cos(r) - y * Math.sin(r), c[1] + x * Math.sin(r) + y * Math.cos(r)]; };
  const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) / D2R;
  // the throwing arm's pose that points its palm at T, and the other arm's lifted pose
  const dThrow = clamp(ang(side.sh, T) - ang(side.sh, side.emit), -85, 85);
  const dWind = dThrow < 0 ? Math.min(40, dThrow + 52) : Math.max(-40, dThrow - 52);
  const dLift = (a) => (a.dir > 0 ? -34 : 34), dLift2 = (a) => (a.dir > 0 ? -22 : 22);
  // an arm's angle at ms t: piecewise through waypoints, each leg eased
  const way = (pts, t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const [t0, a0] = pts[i - 1], [t1, a1, f] = pts[i]; let q = (t - t0) / (t1 - t0); q = f === 'out' ? 1 - (1 - q) ** 3 : f === 'in' ? q * q : sm(q); return a0 + (a1 - a0) * q; }
    return pts.at(-1)[1];
  };
  const throwPts = [[0, 0], [150, 0], [850, dLift(side) * 0.9], [1180, dWind, 'in'], [1300, dThrow, 'out'], [2100, dThrow], [3300, 0]];
  const liftPts = [[0, 0], [250, 0], [900, dLift(off)], [2400, dLift2(off)], [3300, 0]];
  const ARM = { [side.part]: throwPts, [off.part]: liftPts };
  const wob = (a, t) => a + (t > 300 && t < 3300 ? 1.3 * Math.sin(t / 150) * Math.min(1, (t - 300) / 300) * Math.min(1, (3300 - t) / 400) : 0);
  const angle = (A, t) => wob(way(ARM[A.part], t), t);
  const emitAt = (A, t) => rot(A.emit, A.sh, angle(A, t));
  const grid = []; for (let t = 0; t <= 3360; t += 40) grid.push(t);
  const sample = (fn, tail, step = 1) => [...grid.filter((_, i) => i % step === 0).map((t) => [t, fn(t), 'linear']), [3400, tail]];
  for (const A of [L, R]) {
    const f = (t) => ({ transform: `rotate(${angle(A, t).toFixed(2)}deg)` });
    act(k.part(A.part), sample(f, { transform: 'none' }));
    act(k.part(A.hand), sample(f, { transform: 'none' }));
    // the crimson drops over her palm fall in on themselves, and reform at the end
    act(k.part(A.drops), [[0, { transform: 'scale(1)', opacity: 1 }, 'ease-in'], [220, { transform: 'scale(1)', opacity: 1 }, 'ease-in'], [560, { transform: 'scale(.25)', opacity: 0 }], [3250, { transform: 'scale(.25)', opacity: 0 }, 'ease-out'], [3800, { transform: 'scale(1)', opacity: 1 }]]);
  }

  // ── the veil: three lengths, each riding the last, streaming harder as the power gathers and whipping back at the throw
  const env = (t) => sm(clamp((t - 200) / 900, 0, 1)) * (1 - sm(clamp((t - 2600) / 900, 0, 1)));
  const gust = (t) => (t < 1180 ? 0 : t < 1320 ? sm((t - 1180) / 140) : Math.exp(-(t - 1320) / 420));
  const V = [{ n: 'veil0', p: [152, 72], A: 1.2, P: 520, ph: 0, g: -1.5 }, { n: 'veil1', p: [196, 98], A: 2.6, P: 430, ph: 0.9, g: -6 }, { n: 'veil2', p: [244, 94], A: 3.6, P: 380, ph: 1.9, g: -10 }];
  const veilA = (i, t) => env(t) * V[i].A * Math.sin((t / V[i].P) * 2 * Math.PI + V[i].ph) + gust(t) * V[i].g * (T[0] >= 150 ? 1 : 0.5);
  const veilTf = (i, t) => {
    let c = V[i].p.slice(), tot = 0, dx = 0, dy = 0;
    // each length's joint is carried by the shorter ones before it
    const chain = []; for (let j = 0; j <= i; j++) chain.push(j);
    let pt = V[i].p;
    for (let j = i - 1; j >= 0; j--) pt = rot(pt, V[j].p, veilA(j, t));
    dx = pt[0] - V[i].p[0]; dy = pt[1] - V[i].p[1];
    for (let j = 0; j <= i; j++) tot += veilA(j, t);
    return { transform: `${k.T(dx, dy)} rotate(${tot.toFixed(2)}deg)` };
  };
  V.forEach((v, i) => act(k.part(v.n), sample((t) => veilTf(i, t), { transform: 'none' })));

  // ── the ravens startle off the graves at the throw, circle, and settle back
  S.ravens.forEach(([x, y], i) => {
    const t0 = 1120 + i * 130 + (rand() - 0.5) * 60, up = [-6, 8, -8][i] + (x < 150 ? -1 : 1) * 4;
    const dxF = (x < 150 ? -1 : 1) * (20 + 10 * i), dyF = -(24 + 6 * i);
    const pose = (t) => {
      let dx = 0, dy = 0, sy = 1, r = 0;
      if (t > t0 - 160 && t < t0) { const q = (t - t0 + 160) / 160; sy = 1 - 0.1 * sm(q); dy = 0.6 * sm(q); }
      else if (t >= t0 && t < t0 + 600) { const q = sm((t - t0) / 600); dx = dxF * q; dy = dyF * q + 5 * Math.sin(q * Math.PI); sy = 1 + 0.35 * Math.sin((t - t0) / 38) * (1 - q * 0.4); r = (x < 150 ? -1 : 1) * 8 * Math.sin(q * Math.PI); }
      else if (t >= t0 + 600 && t < 2300 + i * 140) { const w = (t - t0 - 600) / 700; dx = dxF + 7 * Math.sin(w + i); dy = dyF + 4 * Math.sin(w * 1.3 + i * 2); sy = 1 + 0.35 * Math.sin((t - t0) / 44); r = 4 * Math.sin(w * 1.1 + i); }
      else if (t >= 2300 + i * 140 && t < 2900 + i * 140) { const q = sm((t - 2300 - i * 140) / 600); dx = dxF * (1 - q); dy = dyF * (1 - q); sy = 1 + 0.3 * Math.sin((t - 2300) / 40) * (1 - q); r = 0; }
      else if (t >= 2900 + i * 140 && t < 3100 + i * 140) { const q = (t - 2900 - i * 140) / 200; sy = 1 - 0.08 * Math.sin(q * Math.PI); }
      return { transform: `${k.T(dx, dy)} rotate(${r.toFixed(1)}deg) scale(${(1 + (sy - 1) * 0.3).toFixed(3)}, ${sy.toFixed(3)})` };
    };
    act(k.part(`rv${i}`), sample(pose, { transform: 'none' }));
  });

  // ── a pic or light travelling along the points of a path: keyframes from sampled positions
  const O = (p) => k.P(...p);
  const mvTo = (from, p) => { const [a, b] = O(from), [c, d] = O(p); return `translate(${(c - a).toFixed(1)}px, ${(d - b).toFixed(1)}px)`; };
  const flightPts = (A, B, Cc, n = 9) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, q = 1 - t; o.push([q * q * A[0] + 2 * q * t * Cc[0] + t * t * B[0], q * q * A[1] + 2 * q * t * Cc[1] + t * t * B[1]]); } return o; };

  // ── gathering: roses glow and motes of red light draw in to her palms
  const roses = [[24, 176], [48, 158], [70, 182], [276, 172], [252, 156], [232, 184], [124, 200], [178, 201], [150, 208], [292, 150], [8, 152]];
  roses.forEach(([x, y], i) => {
    const t0 = 120 + i * 70, A = x < 150 ? L : R, ta = t0 + 620, E = emitAt(A, ta);
    fx(k.lightIn('g-rose', [x, y], 26, 26), [[t0 - 60, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t0 + 120, { transform: 'scale(1)', opacity: 0.95 }, eio], [t0 + 560, { transform: 'scale(.9)', opacity: 0.5 }, eio], [t0 + 900, { transform: 'scale(.6)', opacity: 0 }]]);
    if (i % 1 === 0) {
      const C = [(x + E[0]) / 2 + (x < 150 ? -12 : 12), Math.min(y, E[1]) - 22 - rand() * 12], pts = flightPts([x, y], E, C, 6);
      fx(k.pic('drop', [x, y - 3], 5 + rand() * 2, 5 + rand() * 2), [[t0 + 40, { transform: `${mvTo([x, y - 3], pts[0])} scale(.3)`, opacity: 0 }, 'ease-out'],
        ...pts.map((p, j) => [t0 + 100 + (j / 6) * 560, { transform: `${mvTo([x, y - 3], p)} scale(${(0.7 + 0.5 * Math.sin((j / 6) * Math.PI)).toFixed(2)})`, opacity: 0.95 }, 'linear']),
        [t0 + 720, { transform: `${mvTo([x, y - 3], E)} scale(.2)`, opacity: 0 }]]);
    }
  });
  // the orbs in her palms: swell, burn, and (the throwing hand's) spend itself at the throw
  for (const A of [L, R]) {
    const thr = A === side, ps = (t, s) => { const E = emitAt(A, t); return { transform: `${mvTo(A.emit, E)} scale(${s.toFixed(2)})` }; };
    const orb = (cls, size, kind) => {
      const lst = [];
      const sc = (t) => (t < 250 ? 0.15 : t < 900 ? 0.15 + 0.85 * sm((t - 250) / 650) : 1) * (thr ? (t < 1300 ? 1 + 0.4 * sm(clamp((t - 700) / 480, 0, 1)) + 0.07 * Math.sin(t / 70) : 1.4 * (1 - sm(clamp((t - 1300) / 200, 0, 1)))) : (t < 1200 ? 1 : t < 1320 ? 1 + 0.5 * sm((t - 1200) / 120) : 1.5 - 0.5 * sm(clamp((t - 1320) / 300, 0, 1)) - 0.5 * sm(clamp((t - 2500) / 700, 0, 1))) + 0.06 * Math.sin(t / 90));
      const op = (t) => (t < 200 ? 0 : t < 520 ? sm((t - 200) / 320) : thr ? (t < 1300 ? 1 : 1 - sm(clamp((t - 1300) / 240, 0, 1))) : t < 2500 ? 1 : 1 - sm(clamp((t - 2500) / 800, 0, 1)));
      for (const t of grid) lst.push([t, { ...ps(t, sc(t)), opacity: +clamp(op(t) * (kind === 'glow' ? 0.9 : 1), 0, 1).toFixed(2) }, 'linear']);
      lst.push([3400, { transform: ps(3300, 0.1).transform, opacity: 0 }]);
      return lst;
    };
    fx(k.pic('orb', A.emit, 11, 11), orb('orb', 11, 'core'));
    fx(k.light('g-blood', A.emit, 36), orb('g-blood', 36, 'glow'));
  }

  // ── the throw: a flash and ring at the palm, then seven blood-lances from the palm to T
  const E1 = emitAt(side, 1300);
  fx(k.light('g-blood', E1, 60), [[1170, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1260, { transform: 'scale(1.2)', opacity: 1 }, eio], [1600, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.pic(ring, E1, 26, 26), [[1240, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [1280, { transform: 'scale(.4)', opacity: 0.95 }, 'ease-out'], [1560, { transform: 'scale(1.5)', opacity: 0 }]]);
  const dist = Math.hypot(T[0] - E1[0], T[1] - E1[1]), nrm = [-(T[1] - E1[1]) / dist, (T[0] - E1[0]) / dist], FL = 450;
  const lift = Math.min(34, 10 + dist * 0.16);
  for (let i = 0; i < 7; i++) {
    const off7 = (i - 3) * 3.6, t0 = 1250 + i * 55, size = 0.9 + 0.25 * rand();
    const mid = [(E1[0] + T[0]) / 2 + nrm[0] * off7 * 2.2, (E1[1] + T[1]) / 2 + nrm[1] * off7 * 2.2 - lift - Math.abs(i - 3) * 1.5];
    const goal = [T[0] + nrm[0] * (i - 3) * 1.6, T[1] + nrm[1] * (i - 3) * 1.6 + (rand() - 0.5) * 3];
    const pts = flightPts(E1, goal, mid, 8);
    const tangent = (j) => { const a = pts[Math.max(0, j - 1)], b = pts[Math.min(8, j + 1)]; return ang(a, b); };
    const run = (src, w, h, lag, op, lenScale, rotate) => {
      const o = [src === lance ? 0 : 0];
      const lst = [[t0 + lag - 30, { transform: `${mvTo(E1, pts[0])} ${rotate ? `rotate(${tangent(0).toFixed(0)}deg)` : ''} scale(.2)`, opacity: 0 }, 'ease-out']];
      pts.forEach((p, j) => lst.push([t0 + lag + (j / 8) * FL, { transform: `${mvTo(E1, p)} ${rotate ? `rotate(${tangent(j).toFixed(0)}deg)` : ''} scale(${(size * lenScale * (0.6 + 0.4 * Math.min(1, j / 2))).toFixed(2)})`, opacity: op }, 'linear']));
      lst.push([t0 + lag + FL + 90, { transform: `${mvTo(E1, goal)} ${rotate ? `rotate(${tangent(8).toFixed(0)}deg)` : ''} scale(${(size * lenScale * 0.5).toFixed(2)})`, opacity: 0 }]);
      return lst;
    };
    fx(k.pic(lance, E1, 38, 8.7), run(lance, 26, 6, 0, 1, 1, true));
    fx(k.pic('drop', E1, 4.2, 4.2), run('drop', 4, 4, 45, 0.85, 1, false));
    fx(k.pic('drop', E1, 3, 3), run('drop', 3, 3, 95, 0.6, 1, false));
  }

  // ── where it lands (BEATS.impact): flash, ring, spray, thorns, mist, petals
  const IM = 1700;
  fx(k.light("g-blood", T, 100), [[IM - 60, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 80, { transform: 'scale(1.15)', opacity: 1 }, eio], [IM + 220, { transform: 'scale(.95)', opacity: 0.8 }, eio], [IM + 420, { transform: 'scale(1.05)', opacity: 0.85 }, eio], [IM + 900, { transform: 'scale(.7)', opacity: 0 }]]);
  fx(k.pic(ring, T, 48, 48), [[IM - 20, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(.4)', opacity: 1 }, 'ease-out'], [IM + 420, { transform: 'scale(1.7)', opacity: 0 }]]);
  fx(k.pic(ring, T, 48, 48), [[IM + 180, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 240, { transform: 'scale(.4)', opacity: 0.7 }, 'ease-out'], [IM + 680, { transform: 'scale(2.2)', opacity: 0 }]]);
  for (let i = 0; i < 16; i++) {
    const a = rand() * 360 * D2R, d = 22 + rand() * 30, t = IM + 20 + rand() * 140, sz = 3 + rand() * 3, up = 10 + rand() * 8;
    const at = (q) => `translate(${(Math.cos(a) * d * q * u).toFixed(1)}px, ${((Math.sin(a) * d * q * 0.7 - up * Math.sin(q * Math.PI * 0.8) + 14 * q * q) * u).toFixed(1)}px)`;
    fx(k.pic('drop', T, sz, sz), [[t, { transform: `${at(0)} scale(.4)`, opacity: 0 }, 'ease-out'], [t + 60, { transform: `${at(0.3)} scale(1)`, opacity: 1 }, 'linear'], [t + 220, { transform: `${at(0.65)} scale(.9)`, opacity: 0.9 }, 'linear'], [t + 440, { transform: `${at(1)} scale(.5)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * 360 + (rand() - 0.5) * 30, d = 10 + rand() * 8, t = IM + 10 + rand() * 60, len = 20 + rand() * 12;
    const at = (q, s) => `translate(${(Math.cos(a * D2R) * d * q * u).toFixed(1)}px, ${(Math.sin(a * D2R) * d * q * u).toFixed(1)}px) rotate(${a.toFixed(0)}deg) scale(${s.toFixed(2)})`;
    fx(k.pic(thorn, T, len, len * 0.31), [[t, { transform: at(0.2, 0.2), opacity: 0 }, 'ease-out'], [t + 70, { transform: at(0.9, 1), opacity: 1 }, 'ease-out'], [t + 300, { transform: at(1, 0.85), opacity: 0.7 }, eio], [t + 560, { transform: at(1.1, 0.3), opacity: 0 }]]);
  }
  for (let i = 0; i < 6; i++) {
    const t = IM + 60 + i * 120, r = Math.round(rand() * 360), sc = 0.8 + rand() * 0.5, dx = (rand() - 0.5) * 22, dy = -(6 + rand() * 12);
    fx(k.pic('mist', [T[0] + (rand() - 0.5) * 8, T[1] - 4], 30, 30, { lit: false }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 260, { transform: `${k.T(dx * 0.5, dy * 0.6)} rotate(${r + 20}deg) scale(${sc.toFixed(2)})`, opacity: 0.6 }], [t + 1200, { transform: `${k.T(dx, dy * 2)} rotate(${r + 50}deg) scale(${(sc * 1.9).toFixed(2)})`, opacity: 0 }]]);
  }
  for (let i = 0; i < 9; i++) {
    const t = IM + 80 + i * 70, r = Math.round(rand() * 360), dx = (rand() - 0.5) * 70, rise = 8 + rand() * 12, fall = 24 + rand() * 26, sz = 4 + rand() * 2.5, spin = (rand() - 0.5) * 540;
    const at = (q) => `translate(${(dx * q * u).toFixed(1)}px, ${((-rise * Math.sin(Math.min(1, q * 2.2) * Math.PI / 2) + fall * q * q) * u).toFixed(1)}px) rotate(${(r + spin * q).toFixed(0)}deg)`;
    fx(k.pic('petal', T, sz, sz * 1.1, { lit: false }), [[t, { transform: `${at(0)} scale(.3)`, opacity: 0 }, 'ease-out'], [t + 100, { transform: `${at(0.12)} scale(1)`, opacity: 0.95 }, 'linear'], [t + 600, { transform: `${at(0.5)} scale(1)`, opacity: 0.9 }, 'linear'], [t + 1250, { transform: `${at(1)} scale(.9)`, opacity: 0 }]]);
  }

  // ── the drain: red wisps run back from T into her heart, and she flares
  const H = S.hit;
  for (let i = 0; i < 10; i++) {
    const t0 = 2000 + i * 85, FLB = 640, st = [T[0] + (rand() - 0.5) * 16, T[1] + (rand() - 0.5) * 12];
    const mid = [(st[0] + H[0]) / 2 + (rand() - 0.5) * 30, Math.min(st[1], H[1]) - 20 - rand() * 18], pts = flightPts(st, [H[0] + (rand() - 0.5) * 8, H[1] + (rand() - 0.5) * 8], mid, 8), sz = 4 + rand() * 3;
    fx(k.pic('drop', st, sz, sz), [[t0 - 20, { transform: `${k.T(0, 0)} scale(.3)`, opacity: 0 }, 'ease-out'], ...pts.map((p, j) => [t0 + (j / 8) * FLB, { transform: `${mvTo(st, p)} scale(${(0.8 + 0.3 * Math.sin((j / 8) * Math.PI)).toFixed(2)})`, opacity: 0.9 }, 'linear']), [t0 + FLB + 70, { transform: `${mvTo(st, pts[8])} scale(.3)`, opacity: 0 }]]);
  }
  fx(k.light('g-blood', H, 56), [[2450, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [2700, { transform: 'scale(.9)', opacity: 0.7 }, eio], [2900, { transform: 'scale(1.15)', opacity: 0.95 }, eio], [3150, { transform: 'scale(1)', opacity: 0.55 }, eio], [3600, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.pic(ring, [150, 140], 120, 120, { low: true }), [[2820, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [2880, { transform: 'scale(.4)', opacity: 0.55 }, 'ease-out'], [3500, { transform: 'scale(1.1)', opacity: 0 }]]);
  // and the roses flare once more as the blood comes home
  roses.forEach(([x, y], i) => fx(k.lightIn('g-rose', [x, y], 22, 22), [[2800 + i * 25, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [2980 + i * 25, { transform: 'scale(1)', opacity: 0.7 }, eio], [3500, { transform: 'scale(.7)', opacity: 0 }]]));
}
