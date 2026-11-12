// Flood Rite: the circle pours its light into the great wave, and the wave takes the blows.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: defender (a ritual that
// turns the sea into a wall behind the circle: the suggestion stands), element:
// water.
//   0-850     the gather: the circle's light draws in and the robed figures stoop
//             a little, the wave sinks back on itself; motes of light stream
//             from the ring up into the wave's face.
//   900       THE RISE (BEATS.release): the figures straighten and reach, the ring
//             flares, and the wave surges up, taller and leaning in, its crest
//             blazing, foam shaken off its lip.
//   1300, 1850, 2400 (alone; else k.blows)  a black lance of glass flies in at
//             the wave's face (BEATS.impact: the first). At each blow: the wave
//             takes it with a heave and a rebound, a ring runs along its face, a
//             flash, a plume of foam and flung droplets; the lance sinks and
//             dissolves; the figures rock and the ring flares. Each a little
//             stronger.
//   2800-3600 it holds, then the wave sinks back, the figures settle and the
//             ring's light calms.
//   3600      at rest as drawn (the move ends at END).
//
// The contract (bakeoff/recipe.md): blows come as k.blows || its own three
// lances; each lands at its time `at` on the nearest of its `guard` points
// (points on the wave's face). The lance is drawn only when it plays alone: with
// k.blows given, the attacker brings its own attack and the wave only answers it.
// The wave, the figures and the ring are each one sampled list (every 30 ms),
// the sum of every blow's damped shake, so blows may come as close as they like.
export const END = 4200;
export const BEATS = { release: 900, impact: 1300, settle: 3600 };
export const STILLS = [400, 800, 1050, 1290, 1400, 1900, 2900, 3900];

export const textures = {
  drop: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [236, 252, 250, Math.min(1, c * c * 2.4)]; }],
  foam: [48, 48, (x, y) => {
    let a = 0;
    for (const [cx, cy, r] of [[0.5, 0.58, 0.3], [0.32, 0.5, 0.22], [0.68, 0.5, 0.22], [0.5, 0.34, 0.2]]) a = Math.max(a, Math.max(0, 1 - Math.hypot(x - cx, y - cy) / r));
    return [240, 252, 250, Math.min(1, a * 1.6)];
  }],
};

export function build(k) {
  const { act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const fx = (el, list) => { let last = -1; k.fx(el, list.slice().sort((a, b) => a[0] - b[0]).map((e) => { last = Math.max(last + 1, Math.min(e[0], k.END - 1)); return [last, ...e.slice(1)]; })); };
  const G = k.spec.guard, RING = k.spec.ring, CREST = k.spec.crest;
  const alone = !k.blows;
  const own = [{ at: 1300, to: G[2] }, { at: 1850, to: G[1] }, { at: 2400, to: G[0] }];
  const near = (to) => G.reduce((b, g) => (Math.hypot(g[0] - to[0], g[1] - to[1]) < Math.hypot(b[0] - to[0], b[1] - to[1]) ? g : b), G[0]);
  const B = (k.blows || own).slice().sort((a, b) => a.at - b.at).map((b, i) => { const g = near(b.to); return { t: Math.max(1000, Math.min(3000, b.at)), g, s: 1 + 0.12 * i, i, side: g[0] >= 150 ? -1 : 1 }; });
  const last = B.at(-1).t;
  k.css(`.g-flood { border-radius: 50%; background: radial-gradient(closest-side, rgba(240,255,252,.95), rgba(190,246,244,.55) 28%, rgba(140,225,230,.16) 58%, rgba(110,210,220,0) 100%); }
    .fx-copy.f-hot { mix-blend-mode: plus-lighter; filter: brightness(1.35) saturate(1.2); }`);

  // ── what shakes it: the dip and brace (0..1) and each blow's damped shake and flash
  const holdTo = last + 700, relaxTo = Math.min(holdTo + 800, 3560);
  const ramp = (t, a, b) => sm(Math.max(0, Math.min(1, (t - a) / (b - a))));
  const brace = (t) => ramp(t, 780, 1250) * (1 - ramp(t, holdTo, relaxTo));
  const dip = (t) => ramp(t, 100, 600) * (1 - ramp(t, 650, 900)); // the gather: stooping, drawing back
  const shake = (tau) => (tau <= 0 ? 0 : (Math.exp(-tau / 200) * Math.sin((2 * Math.PI * tau) / 320)) / 0.66);
  const flash = (tau) => (tau < -15 ? 0 : tau < 0 ? 1 + tau / 15 : Math.exp(-tau / 260));
  const sum = (t, f) => B.reduce((a, b) => a + b.s * f(t - b.t, b), 0);
  const grid = [];
  for (let t = 0; t <= 3570; t += 30) grid.push(t);
  const rest = { transform: 'none' };
  const list = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3700, rest]];

  // the wave: draws back, surges, takes each blow (a heave and rebound), then sinks back
  act(k.part('wave'), list((t) => {
    const b = brace(t), d = dip(t), sh = sum(t, (tau, bl) => shake(tau) * bl.side), sq = sum(t, (tau) => Math.abs(shake(tau)));
    return { transform: `rotate(${(0.9 * d - 0.7 * b + 1.1 * sh).toFixed(2)}deg) scale(${(1 - 0.02 * d + 0.045 * b - 0.012 * sq).toFixed(4)}, ${(1 - 0.03 * d + 0.075 * b - 0.02 * sq).toFixed(4)})` };
  }));
  // the figures: stoop, straighten and reach, and rock at each blow (the front row a little more)
  const fig = (lagMs, amp, reach) => (t) => {
    const tt = t - lagMs, b = brace(tt), d = dip(tt), sh = sum(tt, (tau, bl) => shake(tau) * bl.side * 0.6);
    return { transform: `rotate(${(amp * sh).toFixed(2)}deg) scale(${(1 + 0.004 * b).toFixed(4)}, ${(1 - 0.03 * d + reach * b - 0.012 * Math.abs(sh)).toFixed(4)})` };
  };
  act(k.part('back'), list(fig(60, 1.4, 0.05)));
  act(k.part('front'), list(fig(0, 1.8, 0.06)));
  // the ring: its light draws in, flares as the figures reach, and at every blow
  const rg = (t) => { const b = brace(t), d = dip(t), f = sum(t, (tau) => flash(tau)); return { b, d, f }; };
  act(k.part('ring'), list((t) => { const { b, d, f } = rg(t); return { transform: `scale(${(1 - 0.05 * d + 0.07 * b + 0.04 * f).toFixed(4)})`, opacity: +(1 - 0.35 * d).toFixed(2) }; }));
  act(k.copy('ring', 'f-hot'), list((t) => { const { b, f } = rg(t); return { transform: `scale(${(1 + 0.07 * b + 0.04 * f).toFixed(4)})`, opacity: +Math.min(1, 0.55 * b + 0.5 * f).toFixed(2) }; }));
  fx(k.lightIn('g-flood', [RING[0], RING[1] - 4], 150, 44), [[200, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [700, { transform: 'scale(.8)', opacity: 0.45 }, eio], [1000, { transform: 'scale(1.15)', opacity: 0.9 }, eio], [2900, { transform: 'scale(1.1)', opacity: 0.65 }, eio], [3500, { transform: 'scale(.9)', opacity: 0 }]]);

  // ── the circle pours its light up into the wave's face (300-1100)
  const face = [150, 96];
  for (let i = 0; i < 20; i++) {
    const a = rand() * Math.PI * 2, sx = RING[0] + Math.cos(a) * 42, sy = RING[1] + Math.sin(a) * 8, t0 = 250 + i * 34 + rand() * 60, ex = face[0] + (rand() - 0.5) * 70, ey = face[1] + (rand() - 0.5) * 26, s = 3 + rand() * 3;
    const P = (f, sc, o) => ({ transform: `${k.T((ex - sx) * f * f * (3 - 2 * f) * 0.8 + Math.sin(f * 6 + i) * 4 * f, (ey - sy) * f)} scale(${sc})`, opacity: o });
    fx(k.pic('drop', [sx, sy], s, s), [[t0, P(0, 0.5, 0), 'ease-out'], [t0 + 100, P(0.08, 1, 0.95), 'linear'], [t0 + 500, P(0.55, 1.1, 0.9), 'linear'], [t0 + 900, P(1, 0.5, 0)]]);
  }
  // the wave's face lights as it takes the light, then holds it; its crest blazes at the rise
  fx(k.lightIn('g-flood', [140, 92], 210, 120), [[500, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(1)', opacity: 0.4 }, eio], [2900, { transform: 'scale(1.05)', opacity: 0.3 }, eio], [3600, { transform: 'scale(.9)', opacity: 0 }]]);
  fx(k.lightIn('g-flood', CREST, 110, 60), [[820, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1100, { transform: 'scale(1.2)', opacity: 0.85 }, eio], [2900, { transform: 'scale(1.1)', opacity: 0.6 }, eio], [3600, { transform: 'scale(.8)', opacity: 0 }]]);
  // foam shaken off its lip, falling down the curl (900-2200)
  for (let i = 0; i < 16; i++) {
    const x = 50 + rand() * 60, y = 14 + rand() * 18, t = 900 + rand() * 1300, s = 2.4 + rand() * 2.4, dx = -6 + rand() * 12, dy = 26 + rand() * 40;
    const P = (f, sc, o) => ({ transform: `${k.T(dx * f, dy * f * f + 4 * f)} scale(${sc})`, opacity: o });
    fx(k.picIn('drop', [x, y], s, s), [[t, P(0, 0.5, 0), 'ease-out'], [t + 100, P(0.1, 1, 0.95), 'linear'], [t + 600, P(0.75, 1, 0.9), 'linear'], [t + 900, P(1, 0.8, 0)]]);
  }

  // ── each blow
  const lance = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".5"/></filter></defs><path d="M0,3.4L44,.6L52,3.4L44,6.2Z" fill="#0a1a24"/><path d="M0,3.4L44,.6L52,3.4" fill="none" stroke="#8fe6ec" stroke-width=".9" filter="url(#b)"/><path d="M8,3.4H40" stroke="#4fa6b0" stroke-width=".7"/>', 52, 7);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><ellipse cx="30" cy="30" rx="26" ry="26" fill="none" stroke="#e2fbf8" stroke-width="3" filter="url(#b)"/>', 60, 60);
  const starts = [[200, -70], [175, -100], [215, -40]];
  B.forEach((b) => {
    const [gx, gy] = b.g, t = b.t, s = b.s;
    if (alone) {
      // the lance flies in at its target from above and the right, and is taken by the wave
      const [ox, oy] = starts[b.i % 3], sx = gx + ox, sy = gy + oy, ang = (Math.atan2(gy - sy, gx - sx) * 180) / Math.PI;
      const at = (f, sc) => ({ transform: `${k.T((gx - sx) * f, (gy - sy) * f)} rotate(${ang.toFixed(1)}deg) scale(${sc})` });
      fx(k.pic(lance, [sx, sy], 26, 3.5), [[t - 300, { ...at(0, 1), opacity: 0 }, 'ease-in'], [t - 250, { ...at(0.05, 1), opacity: 1 }, 'ease-in'], [t - 20, { ...at(0.98, 1), opacity: 1 }, 'linear'], [t + 40, { ...at(1.0, 0.9), opacity: 1 }, 'ease-out'], [t + 260, { ...at(1.06, 0.5), opacity: 0 }]]);
    }
    // a flash and a ring running along the wave's face
    fx(k.lightIn('g-flood', b.g, 58 * s, 58 * s), [[t - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(1.1)', opacity: 1 }, eio], [t + 360, { transform: 'scale(1.35)', opacity: 0.45 }, eio], [t + 800, { transform: 'scale(1.6)', opacity: 0 }]]);
    [[t, 4 * s, 0.95], [t + 150, 2.8 * s, 0.7]].forEach(([tt, sc, o]) => fx(k.picIn(ring, b.g, 22, 22, { lit: true }), [[tt, { transform: 'scale(.3, .22)', opacity: 0 }, 'ease-out'], [tt + 50, { transform: 'scale(.6, .4)', opacity: o }], [tt + 700, { transform: `scale(${sc}, ${(sc * 0.55).toFixed(2)})`, opacity: 0 }]]));
    // a plume of foam bursting up from the strike, and droplets flung off on arcs
    for (let j = 0; j < 3; j++) {
      const dx = (j - 1) * 7 + (rand() - 0.5) * 4, r = Math.round((rand() - 0.5) * 30);
      fx(k.picIn('foam', [gx + dx, gy + 4], 16 * s, 16 * s), [[t, { transform: `rotate(${r}deg) scale(.2)`, opacity: 0 }, 'ease-out'], [t + 90, { transform: `${k.T(dx * 0.3, -6)} rotate(${r}deg) scale(.8)`, opacity: 0.95 }, 'ease-out'], [t + 420, { transform: `${k.T(dx, -20 - j * 3)} rotate(${r + 10}deg) scale(1.3)`, opacity: 0.5 }], [t + 720, { transform: `${k.T(dx * 1.4, -30 - j * 4)} rotate(${r + 15}deg) scale(1.5)`, opacity: 0 }]]);
    }
    for (let j = 0; j < 14; j++) {
      const a = -Math.PI / 2 + (rand() - 0.5) * 2.4, v = 16 + rand() * 30 * s, sz = 2.6 + rand() * 3, tt = t + rand() * 50;
      const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * v * f, Math.sin(a) * v * f + 46 * f * f)} scale(${sc})`, opacity: o });
      fx(k.pic('drop', [gx, gy], sz, sz), [[tt, P(0, 0.5, 0), 'ease-out'], [tt + 60, P(0.12, 1.1, 1), 'ease-out'], [tt + 380, P(0.7, 1, 0.9), 'linear'], [tt + 640, P(1, 0.6, 0)]]);
    }
  });
}
