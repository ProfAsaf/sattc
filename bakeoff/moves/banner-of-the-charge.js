// Banner of the Charge: the charge surges ("your creatures have Rush").
//
// PLAN (drawing units 300 x 210, ms of the move). Role: aura (a relic: the
// place itself acts), element: fire. Not aimed.
//   0-700     a hush before the charge (anticipation): the banner droops and
//             its fire sinks, the riders gather (rear back, crouch), the sun
//             on the horizon dims a little.
//   900       SURGE (BEATS.release): the bearer lunges and the whole line
//             follows, each rider a beat after the one nearer him; the banner
//             snaps out and a ripple runs from the pole to its tail; the fire
//             roars (a hot copy of each piece lit over it, a wave of it
//             running down the banner); sparks stream back off the burning
//             edge; light runs along the line of riders; dust kicks up behind
//             the hooves; speed streaks flash by.
//   1500      PEAK (BEATS.impact): a ring of golden light bursts out from the
//             banner over the whole picture and past its frame; the sun flares;
//             the line gallops at full stretch.
//   1500-3300 the riders gallop in place (a bob and a pitch, each on its own
//             beat), the banner streams and flutters, fire and sparks ebb.
//   3700      at rest as drawn (the move ends at END).
export const END = 4300;
export const BEATS = { release: 900, impact: 1500, settle: 3700 };
export const STILLS = [400, 850, 1050, 1350, 1600, 2200, 3000, 4000];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 200 + 55 * c * c, 110 + 110 * c * c, Math.min(1, c * c * 2.2)]; }],
  dust: [48, 48, (x, y) => { const r = Math.hypot((x - 0.5) * 1.1, (y - 0.5) * 1.4) * 2, c = Math.max(0, 1 - r); return [214, 150, 96, Math.min(0.75, c * c * 1.3)]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, J = S.joints, RD = S.riders, L = S.lead, SUN = S.sun, H = S.heart;

  k.css(`.g-banner { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,246,214,.95), rgba(255,206,120,.55) 28%, rgba(255,150,60,.2) 58%, rgba(255,110,30,0) 100%); }
    .fx-copy.f-hot { mix-blend-mode: plus-lighter; filter: brightness(1.35) saturate(1.3); }`);

  const track = (keys) => (t) => {
    let i = keys.length - 1;
    while (i > 0 && keys[i][0] > t) i--;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const f = b[0] === a[0] ? 0 : sm(Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))));
    return a.slice(1).map((v, j) => v + (b[j + 1] - v) * f);
  };
  const grid = [];
  for (let t = 0; t <= 3660; t += 30) grid.push(t);
  const sample = (fn, last = { transform: 'none' }) => [...grid.map((t) => [t, fn(t), 'linear']), [3800, last]];
  const rot = (v, a) => { const r = (a * Math.PI) / 180; return [v[0] * Math.cos(r) - v[1] * Math.sin(r), v[0] * Math.sin(r) + v[1] * Math.cos(r)]; };

  // ── a rider's pose: gathers (rears back, crouches), lunges at `t0`, then gallops in place, easing out
  const gait = (t0, ph, amp) => {
    const lunge = track([[0, 0, 0, 0], [t0 - 300, -1.6, 1.4, -0.4], [t0 - 120, -2.2, 1.8, -0.6], [t0 + 160, 2.4, -1.3, 4.5], [t0 + 600, 1.6, -0.4, 3], [3000, 0.6, 0, 1.2], [3700, 0, 0, 0]]);
    return (t) => {
      const [rt, dy, dx] = lunge(t), g = t > t0 + 200 && t < 3300 ? Math.min(1, (t - t0 - 200) / 200, (3300 - t) / 500) : 0;
      return { rot: rt + g * amp * 0.8 * Math.sin(t / 82 + ph), dy: dy + g * amp * 1.5 * Math.sin(t / 82 + ph + 1.2), dx };
    };
  };
  const rid = [[0, 1], [1, 2], [2, 3], [3, 4]].map(([i, ph]) => gait(900 + Math.abs(RD[i][0] - L[0]) * 1.4 + 20, ph, 1.1));
  const lead = gait(900, 0.3, 1.3);
  const pose = (g) => (t) => { const p = g(t); return { transform: `${k.T(p.dx, p.dy)} rotate(${p.rot.toFixed(2)}deg)` }; };
  rid.forEach((g, i) => act(k.part(`r${i}`), sample(pose(g))));
  act(k.part('lead'), sample(pose(lead)));

  // ── the banner: four pieces chained from the pole (it rides with the bearer), a ripple running out to the tail
  const env = track([[0, 0.5], [600, 0.4], [900, 1.5], [1300, 7.5], [1700, 6.5], [2400, 3.6], [3000, 1.6], [3700, 0.0]]);
  const droop = track([[0, 0, 0], [600, -1, 0.8], [900, 0, 0], [1300, 2.2, 0], [2400, 1, 0], [3700, 0, 0]]); // (tail lifts on the surge)
  const chain = (t) => {
    const lp = lead(t), th = lp.rot, [vx, vy] = [J[0][0] - L[0], J[0][1] - L[1]], [rx, ry] = rot([vx, vy], th);
    let P = [L[0] + rx + lp.dx, L[1] + ry + lp.dy], A = th, out = [];
    for (let i = 0; i < 4; i++) {
      const a = env(t)[0] * Math.sin(t / 135 - i * 1.15 + 0.4) * (0.55 + i * 0.3) * (i === 0 ? 0.5 : 1) + droop(t)[0] * 2 - droop(t)[1];
      A += a;
      out.push({ d: [P[0] - J[i][0], P[1] - J[i][1]], A });
      if (i < 3) { const [ex, ey] = rot([J[i + 1][0] - J[i][0], J[i + 1][1] - J[i][1]], A); P = [P[0] + ex, P[1] + ey]; }
    }
    return out;
  };
  const stripTf = (t, i) => { const c = chain(t)[i]; return `${k.T(c.d[0], c.d[1])} rotate(${c.A.toFixed(2)}deg)`; };
  const hot = [0, 1, 2, 3].map((i) => track([[0, 0], [880 + i * 120, 0], [1000 + i * 130, 0.9], [1250 + i * 130, 0.35], [1800 + i * 100, 0.6], [2000 + i * 100, 0.25], [2900, 0.1], [3500, 0]]));
  [0, 1, 2, 3].forEach((i) => {
    act(k.part(`flag${i}`), sample((t) => ({ transform: stripTf(t, i) })));
    act(k.copy(`flag${i}`, 'f-hot'), sample((t) => ({ transform: stripTf(t, i), opacity: +hot[i](t)[0].toFixed(2) }), { transform: 'none', opacity: 0 }));
  });

  // ── light: the banner's fire roars; the sun answers; a wave runs along the line of riders; a pulse past the frame
  fx(k.lightIn('g-banner', [34, 60], 110, 100), [[0, { transform: 'scale(.9)', opacity: 0 }, 'ease-out'], [700, { transform: 'scale(.8)', opacity: 0 }, eio], [1000, { transform: 'scale(1.1)', opacity: 0.95 }, eio], [1500, { transform: 'scale(1.35)', opacity: 1 }, eio], [2600, { transform: 'scale(1.1)', opacity: 0.5 }, eio], [3500, { transform: 'scale(.9)', opacity: 0 }]]);
  fx(k.lightIn('g-banner', H, 90, 70), [[900, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [1300, { transform: 'scale(1.1)', opacity: 0.8 }, eio], [2200, { transform: 'scale(1)', opacity: 0.4 }, eio], [3300, { transform: 'scale(.9)', opacity: 0 }]]);
  fx(k.lightIn('g-banner', SUN, 170, 140), [[500, { transform: 'scale(.8)', opacity: 0 }, 'ease-out'], [1100, { transform: 'scale(1)', opacity: 0.6 }, eio], [1500, { transform: 'scale(1.35)', opacity: 1 }, eio], [2500, { transform: 'scale(1.1)', opacity: 0.45 }, eio], [3500, { transform: 'scale(.9)', opacity: 0 }]]);
  fx(k.light('g-banner', [150, 100], 380, 270), [[900, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1500, { transform: 'scale(1)', opacity: 0.55 }, 'ease-out'], [2000, { transform: 'scale(1.15)', opacity: 0.3 }, eio], [2900, { transform: 'scale(1.2)', opacity: 0 }]]);
  [...RD.map((p, i) => [p, 900 + Math.abs(p[0] - L[0]) * 1.4 + 40, 40 - i * 4]), [L, 900, 56]].forEach(([p, t, sz]) => {
    fx(k.lightIn('g-banner', [p[0] + 4, p[1] - 22], sz * 1.5, sz * 1.2), [[t - 60, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 130, { transform: 'scale(1.1)', opacity: 0.85 }, eio], [t + 800, { transform: 'scale(1)', opacity: 0.45 }, eio], [t + 1900, { transform: 'scale(.9)', opacity: 0 }]]);
  });

  // ── the ring that bursts from the banner at the peak, out past the frame
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#ffe3a0" stroke-width="3" filter="url(#b)"/>', 60, 60);
  [[1450, 10, 0.85], [1640, 8, 0.55]].forEach(([t, sc, o]) => fx(k.pic(ring, [130, 70], 50, 50), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 60, { transform: 'scale(.7)', opacity: o }, 'ease-out'], [t + 950, { transform: `scale(${sc})`, opacity: 0 }]]));

  // ── sparks flung back off the burning edge, and flames licking along it
  const edgePts = [[44, 21], [14, 33], [22, 42], [31, 50], [40, 58], [30, 70], [16, 82], [28, 92], [41, 98], [54, 103], [80, 95]];
  for (let i = 0; i < 44; i++) {
    const [x, y] = edgePts[Math.floor(rand() * edgePts.length)], t = 800 + rand() * 1700, s = 3 + rand() * 5, dx = -(30 + rand() * 70), dy = -22 + rand() * 36;
    const P = (f, sc, o) => ({ transform: `${k.T(dx * f, dy * f - 14 * Math.sin(Math.PI * f * 0.7))} scale(${sc})`, opacity: o });
    fx(k.pic('spark', [x, y], s, s), [[t, P(0, 0.5, 0), 'ease-out'], [t + 60, P(0.07, 1.1, 1), 'linear'], [t + 500, P(0.5, 0.9, 0.9), 'linear'], [t + 900 + rand() * 500, P(1, 0.3, 0)]]);
  }
  const flicker = (el, on, off, lean = 0) => {
    const sk = (d) => `skewX(${(lean + d).toFixed(1)}deg)`;
    const list = [[on, { transform: `scale(.6, .12) ${sk(0)}`, opacity: 0 }, 'ease-out'], [on + 120, { transform: `scale(1, 1) ${sk(0)}`, opacity: 0.95 }, eio]];
    for (let t = on + 120, i = 1; (t += 80 + rand() * 60) < off; i++) { const s = i % 2 ? 1 : -1; list.push([t, { transform: `scale(${(1 - s * 0.08 - rand() * 0.06).toFixed(2)}, ${(1 + s * 0.14 + rand() * 0.12).toFixed(2)}) ${sk(s * (2 + rand() * 5))}`, opacity: +(0.8 + rand() * 0.2).toFixed(2) }, eio]); }
    list.push([Math.min(k.END, off + 260), { transform: `scale(.5, .15) ${sk(0)}`, opacity: 0 }]);
    fx(el, list);
  };
  edgePts.slice(1, 10).forEach(([x, y], i) => {
    const on = 950 + i * 90, big = 1 + 0.3 * rand();
    flicker(k.picIn(i % 2 ? 'flame' : 'flame2', [x - 2, y + 2], 11 * big, 20 * big, { base: true }), on, 2500 + rand() * 500, -14);
  });

  // ── dust kicked up behind the hooves, and speed streaks flashing past
  [...RD, L].forEach((p, i) => {
    const t0 = 900 + (i === 4 ? 0 : Math.abs(p[0] - L[0]) * 1.4) + 60, n = i === 4 ? 6 : 4;
    for (let j = 0; j < n; j++) {
      const t = t0 + j * 190 + rand() * 90, r = Math.round(rand() * 360), s = 16 + rand() * 10;
      fx(k.picIn('dust', [p[0] - 10 - rand() * 8, p[1] - 2], s, s, { lit: false }), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 160, { transform: `${k.T(-6, -3)} rotate(${r + 20}deg) scale(.9)`, opacity: 0.65 }], [t + 900, { transform: `${k.T(-26, -10)} rotate(${r + 50}deg) scale(1.9)`, opacity: 0 }]]);
    }
  });
  const streak = k.svg('<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#ffe9b0" stop-opacity="0"/><stop offset="1" stop-color="#fff6d8" stop-opacity=".95"/></linearGradient></defs><rect x="0" y="2" width="60" height="2.6" rx="1.3" fill="url(#g)"/>', 60, 6);
  for (let i = 0; i < 12; i++) {
    const x = 120 + rand() * 170, y = 118 + rand() * 74, t = 950 + rand() * 900, w = 30 + rand() * 26;
    fx(k.picIn(streak, [x, y], w, 4), [[t, { transform: 'scaleX(.3)', opacity: 0 }, 'ease-out'], [t + 90, { transform: `${k.T(-14, 0)} scaleX(1)`, opacity: 0.85 }, 'linear'], [t + 380, { transform: `${k.T(-60, 0)} scaleX(1.3)`, opacity: 0 }]]);
  }
  // a glint at the spear-tip as the charge begins
  fx(k.lightIn('g-banner', [146.6, 6], 26, 26), [[880, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(1.2)', opacity: 1 }, eio], [1700, { transform: 'scale(1)', opacity: 0.5 }, eio], [2600, { transform: 'scale(.6)', opacity: 0 }]]);
}
