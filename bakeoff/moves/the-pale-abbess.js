// The Pale Abbess: she lifts her lantern, sends the gathered dead out of it to drain
// her enemy, and the stolen light comes home.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker, element: spirit
// (the suggestion was defender; but her card is Drain: "each opponent loses 1 Life",
// which is an attack, and nothing in her picture blocks).
//   0-700     the gather. She leans back a little and raises the lantern high (her arm
//             turns up from the shoulder, the lantern swinging on its hook); the dead
//             rise from the far graves and stream, one after another, into the flame,
//             which swells; the lantern's light flares.
//   700-860   she draws the lantern back, then casts it out toward the target: she leans
//             into it, the arm swings out (and the lantern swings on, a pendulum).
//   860       RELEASE: the souls burst from the lantern, a stream of nine, each along
//             its own curve to T, over a thread of pale light.
//   1180      IMPACT at T: a flash of pale light, a ring, wisps flung up, gloom gathers
//             where the life goes out.
//   1260-2100 the DRAIN: the stolen light comes back as gold motes, from T along their own
//             curves, into the lantern, which flares gold as each arrives; a glow spreads
//             over her.
//   1700-2900 the lantern swings, she straightens, the arm comes down; the gloom thins.
//   3000      at rest as drawn (BEATS.settle); the move ends at END.
//
// The contract (bakeoff/recipe.md): T = k.aim, or its own spot (the dark by the tree on
// the right). The arm is turned to point at T (at most 110 degrees up and 45 down), and
// every point of the souls' path is worked out from the lantern's flame (spec.emit,
// carried through the arm's turn, the lean and the swing) and T.
export const END = 3800;
export const BEATS = { release: 860, impact: 1180, settle: 3000 };
export const STILLS = [320, 640, 860, 980, 1200, 1600, 2100, 3500];

const noise = (x, y) => 0.75 + 0.2 * Math.sin(x * 13 + y * 5) * Math.cos(y * 9 - x * 4) + 0.1 * Math.sin(x * 25 - y * 17);
export const textures = {
  // a soul: a bright head on the right, a tail drawn out behind it
  soul: [48, 24, (x, y) => {
    const hx = 0.84, dx = (x - hx) * 2.2, dy = (y - 0.5) * 2.2, head = Math.pow(Math.max(0, 1 - Math.hypot(dx, dy) * 1.5), 1.2);
    const t = Math.max(0, Math.min(1, x / hx)), tail = x < hx ? Math.max(0, 1 - Math.abs(y - 0.5) / (0.04 + 0.2 * t)) * Math.pow(t, 1.4) * 0.8 : 0;
    const a = Math.min(1, head + tail), w = Math.min(1, head * 1.1);
    return [208 + 47 * w, 192 + 52 * w, 255 - 20 * w, a];
  }],
  // a spark of gold light
  lspark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 224 + 31 * c * c, 150 + 100 * c * c, Math.min(1, c * c * 2.4)]; }],
  // gloom: dark shadow gathering
  shade: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2; return [28, 16, 52, Math.pow(Math.max(0, 1 - r), 1.2) * noise(x * 1.3, y) * 0.8]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const sp = k.spec, F = sp.feet, S0 = sp.shoulder, HK = sp.hook, LP = sp.lamp, E0 = sp.emit;
  const T = k.aim || sp.alone;
  const rad = (d) => (d * Math.PI) / 180, deg = (r) => (r * 180) / Math.PI;
  const norm = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  k.css(`.g-lamp { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,246,214,.95), rgba(255,214,130,.55) 28%, rgba(255,190,100,.17) 58%, rgba(255,170,80,0) 100%); }
    .g-soul { border-radius: 50%; background: radial-gradient(closest-side, rgba(250,246,255,.95), rgba(206,190,255,.55) 28%, rgba(170,140,255,.18) 58%, rgba(150,120,255,0) 100%); }`);

  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  const rotAbout = (p, c, d) => { const a = rad(d), vx = p[0] - c[0], vy = p[1] - c[1]; return [c[0] + vx * Math.cos(a) - vy * Math.sin(a), c[1] + vx * Math.sin(a) + vy * Math.cos(a)]; };
  // how far the arm turns to point at T: its rest line (shoulder to lantern) is 54 degrees up from the right
  const angT = deg(Math.atan2(T[1] - S0[1], T[0] - S0[0])), restDir = deg(Math.atan2(LP[1] - S0[1], LP[0] - S0[0]));
  const aT = clamp(norm(angT - restDir), -110, 45);
  const BETA = curve([[0, 0], [500, -1.8], [700, -1.8], [880, 2.8], [1500, 1.6], [2800, 0]]);        // her lean about her feet
  const ARM = curve([[0, 0], [520, -16], [720, -16], [880, aT], [1700, aT * 0.9], [2800, 0]]);         // her arm about the shoulder
  const pend = (t) => { const tau = t - 900; return tau > 0 && tau < 2000 ? 8 * Math.exp(-tau / 520) * Math.sin(tau / 130) : 0; };   // the lantern's swing
  const ang = (t) => BETA(t) + 0.15 * ARM(t) + pend(t);
  const hook = (t) => rotAbout(rotAbout(HK, S0, ARM(t)), F, BETA(t));
  const lamp = (t) => { const h = hook(t); return rotAbout([h[0] + LP[0] - HK[0], h[1] + LP[1] - HK[1]], h, ang(t)); };
  const grid = [];
  for (let t = 0; t <= 3000; t += 40) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3200, { transform: 'none' }]];
  act(k.part('body'), sample((t) => ({ transform: `rotate(${BETA(t).toFixed(2)}deg)` })));
  act(k.part('arm'), sample((t) => { const q = rotAbout(S0, F, BETA(t)); return { transform: `${k.T(q[0] - S0[0], q[1] - S0[1])} rotate(${(BETA(t) + ARM(t)).toFixed(2)}deg)` }; }));
  act(k.part('lantern'), sample((t) => { const h = hook(t); return { transform: `${k.T(h[0] - HK[0], h[1] - HK[1])} rotate(${ang(t).toFixed(2)}deg)` }; }));

  // ── the lantern's light (it rides with the lantern): swells as the dead come in, bursts at the release, flares as the light returns
  const follow = (t0, t1, f, step = 40) => {
    const out = [];
    for (let t = t0; t <= t1; t += step) { const q = lamp(t), e = f(t); out.push([t, { transform: `${k.T(q[0] - LP[0], q[1] - LP[1])} scale(${e.s.toFixed(3)})`, opacity: +e.o.toFixed(2) }, 'linear']); }
    return out;
  };
  const RET = 1700; // the first of the stolen light arrives
  const flare = (t) => 0.85 * sm((t - 150) / 650) * (1 - 0.5 * sm((t - 900) / 500)) + 0.9 * sm((t - RET) / 250) * (1 - sm((t - RET - 250) / 800));
  fx(k.lightIn('g-lamp', LP, 54, 54), follow(150, 2900, (t) => ({ s: 0.8 + 0.7 * sm((t - 150) / 700) + 0.5 * sm((t - RET) / 250) * (1 - sm((t - RET - 250) / 700)), o: clamp(flare(t), 0, 1) * (1 - sm((t - 2300) / 600)) })));
  fx(k.lightIn('g-soul', E0, 40, 40), follow(300, 1500, (t) => ({ s: 0.6 + 0.9 * sm((t - 300) / 500), o: 0.85 * Math.min(sm((t - 300) / 400), 1 - sm((t - 860) / 600)) })));
  const E = lamp(860); // where the souls leave from
  fx(k.light('g-soul', E, 66), [[820, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [880, { transform: 'scale(1.2)', opacity: 0.95 }], [1200, { transform: 'scale(1.7)', opacity: 0 }]]);

  // ── souls along a path: a list of points -> keyframe stops (each turned along its way)
  const along = (pts, t0, dur) => {
    const n = pts.length;
    return pts.map((p, j) => {
      const q = pts[Math.min(n - 1, j + 1)], r = pts[Math.max(0, j - 1)];
      return [Math.round(t0 + dur * (j / (n - 1))), { p, a: deg(Math.atan2(q[1] - r[1], q[0] - r[0])), f: j / (n - 1) }];
    });
  };
  const sprite = (base, kf, scl, o, mk) => {
    const [X0, Y0] = k.P(...base);
    return kf.map(([t, { p, a, f }], j) => { const [x, y] = k.P(...p); return [t, { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) rotate(${a.toFixed(1)}deg) scale(${(scl(f) * mk).toFixed(2)}, ${scl(f).toFixed(2)})`, opacity: j === 0 || j === kf.length - 1 ? 0 : o * Math.min(1, f * 6) * (1 - Math.max(0, f - 0.85) / 0.15) }, 'linear']; });
  };
  // the dead rise from the far graves into the flame, one after another
  sp.graves.forEach((g, i) => {
    const t0 = 60 + i * 110, dur = 560 + i * 30, L = lamp(t0 + dur), ctrl = [(g[0] + L[0]) / 2 + (i % 2 ? 16 : -16), Math.min(g[1], L[1]) - 20];
    const pts = Array.from({ length: 9 }, (_, j) => { const f = Math.pow(j / 8, 1.3), q = 1 - f; return [q * q * g[0] + 2 * q * f * ctrl[0] + f * f * L[0], q * q * g[1] + 2 * q * f * ctrl[1] + f * f * L[1]]; });
    fx(k.picIn('soul', g, 20, 10), sprite(g, along(pts, t0, dur), (f) => 0.9 - 0.4 * f, 0.9, 1.1));
  });

  // ── the release (BEATS.release): nine souls and a thread of light, from the flame to T
  const L0 = Math.hypot(T[0] - E[0], T[1] - E[1]), a0 = deg(Math.atan2(T[1] - E[1], T[0] - E[0]));
  const nrm = [-(T[1] - E[1]) / L0, (T[0] - E[0]) / L0];
  const FLY = BEATS.impact - BEATS.release;
  const bzp = (s, c, e, f) => { const q = 1 - f; return [q * q * s[0] + 2 * q * f * c[0] + f * f * e[0], q * q * s[1] + 2 * q * f * c[1] + f * f * e[1]]; };
  for (let i = 0; i < 9; i++) {
    const t0 = BEATS.release + Math.round(rand() * 120), dur = FLY - 20 + Math.round(rand() * 90), bend = (rand() - 0.5) * Math.min(34, L0 * 0.3), c = [(E[0] + T[0]) / 2 + nrm[0] * bend, (E[1] + T[1]) / 2 + nrm[1] * bend - Math.min(10, L0 * 0.08)];
    const end = [T[0] + (rand() - 0.5) * 8, T[1] + (rand() - 0.5) * 8];
    const pts = Array.from({ length: 8 }, (_, j) => bzp(E, c, end, Math.pow(j / 7, 0.85)));
    fx(k.pic('soul', E, i < 3 ? 26 : 20, i < 3 ? 13 : 10), sprite(E, along(pts, t0, dur), (f) => 1.1 - 0.35 * f, 1, 1.5));
  }
  // a thread of pale light drawn from the flame to T (its right half only, turned about the flame)
  const sa = a0.toFixed(1);
  const thread = k.svg(`<defs><filter id="b"><feGaussianBlur stdDeviation="1"/></filter></defs><path d="M${L0.toFixed(1)},3L${(2 * L0).toFixed(1)},3" stroke="#b9a6ff" stroke-width="2.4" opacity=".6" filter="url(#b)"/><path d="M${L0.toFixed(1)},3L${(2 * L0).toFixed(1)},3" stroke="#f4eeff" stroke-width=".7"/>`, 2 * L0, 6);
  fx(k.pic(thread, E, 2 * L0, 6, { low: true }), [[BEATS.release - 20, { transform: `rotate(${sa}deg) scale(.02, 1)`, opacity: 0 }, 'ease-out'], [BEATS.release + 20, { transform: `rotate(${sa}deg) scale(.06, 1)`, opacity: 0.9 }, 'ease-out'], [BEATS.impact, { transform: `rotate(${sa}deg) scale(1, 1)`, opacity: 0.9 }],
    [1700, { transform: `rotate(${sa}deg) scale(1, 1)`, opacity: 0.5 }, eio], [2200, { transform: `rotate(${sa}deg) scale(1, 1)`, opacity: 0 }]]);

  // ── where they land (BEATS.impact): light, a ring, wisps flung up, gloom where the life goes out
  const IMP = BEATS.impact;
  const il = [[IMP - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 40, { transform: 'scale(1.25)', opacity: 0.95 }]];
  for (let t = IMP + 180, i = 0; t < 1700; t += 140, i++) il.push([t, { transform: `scale(${i % 2 ? 1.08 : 0.94})`, opacity: i % 2 ? 0.8 : 0.55 }, eio]);
  il.push([2100, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.light('g-soul', T, 76), il);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#efe6ff" stroke-width="3" filter="url(#b)"/>', 60, 60);
  fx(k.pic(ring, T, 36, 36), [[IMP, { transform: 'scale(.25)', opacity: 0 }, 'ease-out'], [IMP + 50, { transform: 'scale(.6)', opacity: 0.95 }], [IMP + 560, { transform: 'scale(2.2)', opacity: 0 }]]);
  // wisps flung up and curling away
  for (let i = 0; i < 8; i++) {
    const x = (rand() - 0.5) * 22, t0 = Math.round(IMP + rand() * 100), lean = (rand() - 0.5) * 16, up = 24 + rand() * 24, r = -90 + lean * 2;
    fx(k.pic('soul', [T[0] + x, T[1]], 16 + rand() * 6, 8 + rand() * 3), [[t0, { transform: `rotate(${r}deg) scale(.4, .4)`, opacity: 0 }, 'ease-out'], [t0 + 120, { transform: `${k.T(lean * 0.3, -up * 0.35)} rotate(${r}deg) scale(1.3, 1)`, opacity: 0.95 }], [Math.round(t0 + 800 + rand() * 300), { transform: `${k.T(lean, -up)} rotate(${r + lean}deg) scale(1, .6)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 5; i++) {
    const t = IMP + 60 + i * 150, r = Math.round(rand() * 360), x = (rand() - 0.5) * 18;
    fx(k.pic('shade', [T[0] + x, T[1] + 3], 26, 26, { lit: false, low: true }), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 350, { transform: `rotate(${r + 15}deg) scale(1)`, opacity: 0.8 }], [t + 1100, { transform: `${k.T(0, -6)} rotate(${r + 40}deg) scale(1.5)`, opacity: 0 }]]);
  }

  // ── the drain: the stolen light flies home to the lantern, one gold mote after another
  for (let i = 0; i < 8; i++) {
    const t0 = IMP + 110 + i * 70, dur = 380 + i * 25, arrive = t0 + dur, Lp = lamp(Math.min(arrive, 3000)), s0 = [T[0] + (rand() - 0.5) * 12, T[1] + (rand() - 0.5) * 8];
    const bend = (rand() - 0.5) * 36, nn = [-(Lp[1] - s0[1]), Lp[0] - s0[0]], nl = Math.hypot(...nn) || 1, c = [(s0[0] + Lp[0]) / 2 + (nn[0] / nl) * bend, (s0[1] + Lp[1]) / 2 + (nn[1] / nl) * bend - 10];
    const [X0, Y0] = k.P(...s0), sz = 6 + rand() * 4, kf = [];
    for (let j = 0; j <= 8; j++) {
      const f = Math.pow(j / 8, 1.25), q = bzp(s0, c, Lp, f), [x, y] = k.P(...q);
      kf.push([Math.round(t0 + dur * (j / 8)), { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) scale(${(0.7 + 0.5 * Math.sin(Math.PI * f) - 0.2 * f).toFixed(2)})`, opacity: j === 0 ? 0 : j === 8 ? 0 : 0.95 }, 'linear']);
    }
    fx(k.pic('lspark', s0, sz, sz), kf);
  }
  // her glow: the light spreads over her as it comes home
  const hg = [[RET - 100, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [RET + 250, { transform: 'scale(1)', opacity: 0.8 }]];
  for (let t = RET + 400, i = 0; t < 2500; t += 180, i++) hg.push([t, { transform: `scale(${i % 2 ? 1.06 : 0.97})`, opacity: i % 2 ? 0.75 : 0.55 }, eio]);
  hg.push([2900, { transform: 'scale(1.1)', opacity: 0 }]);
  fx(k.lightIn('g-lamp', [122, 120], 90, 130), hg);
}
