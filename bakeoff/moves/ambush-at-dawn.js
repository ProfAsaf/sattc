// Ambush at Dawn: the trap is sprung, and the riders ride onto the spears.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: defender (a Trap whose
// spirits are made "in time to block"; the suggestion was support), element: spirit.
//   0-400     the soldiers sink back into the mist as it swells, thick and low;
//             the riders gallop on, a little nearer.
//   760-1000  SPRUNG (BEATS.release; alone, 700 ms before the first blow): the
//             soldiers burst up out of the mist one by one, 80 ms apart (the near
//             one last), spears levelled: a pillar of light up from each one's
//             feet, a flat ring of light, billows of mist thrown out, motes
//             flung up, a flash at the chest; each lunges and settles.
//   1450, 1700, 1950 (alone; else k.blows)  a rider hits the spears (BEATS.impact:
//             the first). The riders are the attack when it plays alone: each
//             rides in faster, the nearest first, and meets a spear point; at
//             each blow: a flash and a star and a ring at the guard, sparks, the
//             rider rears and is shattered into gloom that the light thins away,
//             and the soldiers are shoved back and rock; the nearest most.
//   2300-3600 the soldiers hold, then ease; the mist settles; the riders ride on
//             out of the glare again, from the right, as drawn.
//   3600      at rest as drawn (the move ends at END).
//
// The contract (bakeoff/recipe.md): blows come as k.blows || the riders' own three;
// each is taken at its time `at`, on the nearest of his `guard` points (the spear
// points and the soldiers' chests). The riders charge only when it plays alone: with
// k.blows given, the attacker brings its own attack and the soldiers only answer it
// (the ambush is sprung 700 ms ahead of the first blow). Each soldier's motion is
// one sampled list (every 30 ms): the sum of the blows' damped shakes, so blows may
// come as close together as they like.
export const END = 4200;
export const BEATS = { release: 760, impact: 1450, settle: 3600 };
export const STILLS = [300, 850, 1000, 1400, 1500, 1750, 2300, 3900];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 226 + 29 * c * c, 150 + 105 * c * c, Math.min(1, c * c * 2.2)]; }],
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 244, 200, Math.min(1, c * c * 1.4)]; }],
  cloud: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, n = 0.8 + 0.2 * Math.sin(x * 15 + y * 9) * Math.cos(y * 12 - x * 7); return [250, 238, 210, Math.max(0, 1 - r) * 0.85 * n]; }],
  dust: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, n = 0.75 + 0.25 * Math.sin(x * 17 + y * 11) * Math.cos(y * 13 - x * 7); return [196, 168, 120, Math.max(0, 1 - r) * 0.8 * n]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const G = k.spec.guard, SOL = k.spec.soldiers, RID = k.spec.riders;
  const alone = !k.blows;
  const own = [{ at: 1450, to: G[0] }, { at: 1700, to: G[0] }, { at: 1950, to: G[1] }];
  const near = (to) => G.reduce((b, g) => (Math.hypot(g[0] - to[0], g[1] - to[1]) < Math.hypot(b[0] - to[0], b[1] - to[1]) ? g : b), G[0]);
  const B = (k.blows || own).slice().sort((a, b) => a.at - b.at).map((b, i) => ({ t: Math.max(1000, Math.min(3000, b.at)), g: near(b.to), s: 1 + 0.12 * i, i }));
  const T1 = B[0].t, last = B.at(-1).t, BURST = T1 - 700;
  const SC = [0.86, 0.96, 1.44];
  const chest = SOL.map(([x, y], i) => [x, y - 28 * SC[i]]);

  k.css(`.g-amb { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,252,236,.95), rgba(255,230,160,.55) 28%, rgba(255,200,110,.16) 58%, rgba(255,180,80,0) 100%); }`);

  const shake = (tau) => (tau <= 0 ? 0 : (Math.exp(-tau / 180) * Math.sin((2 * Math.PI * tau) / 290)) / 0.66);
  const flash = (tau) => (tau < -15 ? 0 : tau < 0 ? 1 + tau / 15 : Math.exp(-tau / 250));
  const grid = [];
  for (let t = 0; t <= 3570; t += 30) grid.push(t);
  const rest = { transform: 'none' };
  const sample = (fn, last0 = {}) => [...grid.map((t) => [t, fn(t), 'linear']), [3700, { ...rest, ...last0 }]];
  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  // ── the soldiers: sink into the mist, burst out (80 ms apart), lunge, hold, ease; shoved at each blow
  const hold = Math.min(3000, last + 800);
  SOL.forEach((f, i) => {
    const tb = BURST + (2 - i) * 80, c = chest[i], lunge = Math.sign(B[0].g[0] - f[0]) || 1;
    const pose = (t) => {
      const down = sm(clamp01(t / Math.max(250, tb - 380))) * (1 - sm(clamp01((t - tb) / 240)));
      const up = sm(clamp01((t - tb) / 240)) * (1 - sm(clamp01((t - tb - 240) / 260)));
      const ease = 1 - sm(clamp01((t - hold) / (3600 - hold)));
      let dx = (2.6 * clamp01((t - tb) / 300) * ease + 4 * up) * lunge, dy = 13 * down - 5 * up, sc = 1 + 0.08 * up - 0.04 * down, th = 0, op = 1 - 0.7 * down;
      for (const b of B) {
        const x = shake(t - b.t - 20) * b.s, d = c[0] - b.g[0], w = Math.exp(-Math.hypot(c[0] - b.g[0], c[1] - b.g[1]) / 55) + 0.15;
        dx += Math.sign(d || -1) * 2.4 * w * x; dy += 0.5 * w * Math.abs(x); th += (Math.sign(d || -1)) * 2.2 * w * x;
      }
      return { transform: `${k.T(dx, dy)} rotate(${th.toFixed(2)}deg) scale(${sc.toFixed(3)})`, opacity: +op.toFixed(2) };
    };
    act(k.part(`sol${i}`), sample(pose, { opacity: 1 }));
  });

  // ── the mist: swells thick and low as they sink, settles after
  act(k.part('mist'), [[0, { transform: 'scale(1, 1)', opacity: 1 }, eio], [350, { transform: 'scale(1, 1.7)', opacity: 1 }, eio], [BURST + 300, { transform: 'scale(1, 1.9)', opacity: 1 }, eio], [hold, { transform: 'scale(1, 1.3)', opacity: 1 }, eio], [3600, { transform: 'none', opacity: 1 }]]);
  for (let i = 0; i < 9; i++) {
    const x = 20 + i * 32 + (rand() - 0.5) * 16, y = 190 + rand() * 12, t = 120 + rand() * 300, r = Math.round(rand() * 360), s = 38 + rand() * 20;
    fx(k.picIn('cloud', [x, y], s, s * 0.6, { lit: false }), [[t, { transform: `rotate(${r}deg) scale(.5, .4)`, opacity: 0 }, 'ease-out'], [t + 400, { transform: `${k.T(3, -4)} rotate(${r}deg) scale(1, .8)`, opacity: 0.6 }, eio], [hold, { transform: `${k.T(-4, -6)} rotate(${r}deg) scale(1.1, .9)`, opacity: 0.4 }, eio], [3500, { transform: `${k.T(-8, -8)} rotate(${r}deg) scale(1.2, .9)`, opacity: 0 }]]);
  }

  // ── sprung: a pillar of light, a ring, mist thrown out, motes flung up, a flash, for each soldier in turn
  const pillar = k.svg('<defs><linearGradient id="g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff6d8" stop-opacity=".95"/><stop offset=".55" stop-color="#ffe39a" stop-opacity=".4"/><stop offset="1" stop-color="#ffe39a" stop-opacity="0"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation="1.4"/></filter></defs><rect x="8" y="0" width="14" height="80" fill="url(#g)" filter="url(#b)"/>', 30, 80);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#fff3cc" stroke-width="3" filter="url(#b)"/>', 60, 60);
  const star = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".6"/></filter></defs><path d="M30,2L33,27L58,30L33,33L30,58L27,33L2,30L27,27Z" fill="#fff8e0" filter="url(#b)"/><circle cx="30" cy="30" r="5" fill="#fff"/>', 60, 60);
  SOL.forEach((f, i) => {
    const tb = BURST + (2 - i) * 80, kk = SC[i], [fx0, fy0] = [f[0], f[1]];
    fx(k.picIn(pillar, [fx0, fy0 + 2], 20 * kk, 62 * kk, { base: true }), [[tb - 10, { transform: 'scale(.4, .1)', opacity: 0 }, 'ease-out'], [tb + 70, { transform: 'scale(1, 1)', opacity: 0.95 }, eio], [tb + 520, { transform: 'scale(1.15, 1.2)', opacity: 0 }]]);
    fx(k.picIn(ring, [fx0, fy0 + 1], 40 * kk, 40 * kk), [[tb, { transform: 'scale(.3, .09)', opacity: 0 }, 'ease-out'], [tb + 50, { transform: 'scale(.6, .18)', opacity: 0.95 }], [tb + 640, { transform: 'scale(2.3, .62)', opacity: 0 }]]);
    fx(k.lightIn('g-amb', chest[i], 46 * kk, 46 * kk), [[tb - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [tb + 80, { transform: 'scale(1.2)', opacity: 1 }, eio], [tb + 420, { transform: 'scale(1.5)', opacity: 0.35 }, eio], [hold, { transform: 'scale(1.4)', opacity: 0.25 }, eio], [3500, { transform: 'scale(1)', opacity: 0 }]]);
    for (let j = 0; j < 4; j++) {
      const a = (j < 2 ? -1 : 1) * (6 + rand() * 12), r = Math.round(rand() * 360), s = 22 * kk + rand() * 8;
      fx(k.picIn('cloud', [fx0 + (j < 2 ? -6 : 6) * kk, fy0 - 2], s, s * 0.7, { lit: false }), [[tb, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [tb + 160, { transform: `${k.T(a * 0.8, -4)} rotate(${r + 15}deg) scale(1)`, opacity: 0.7 }, 'linear'], [tb + 900, { transform: `${k.T(a * 2, -12)} rotate(${r + 40}deg) scale(1.7)`, opacity: 0 }]]);
    }
    for (let j = 0; j < 9; j++) {
      const a = -Math.PI * (0.15 + 0.7 * rand()), dist = 18 + rand() * 40, g = 14 + rand() * 12, sz = 5 + rand() * 6, t0 = tb + rand() * 80;
      const P = (q, sc, o) => ({ transform: `${k.T(Math.cos(a) * dist * q * kk, Math.sin(a) * dist * q * kk + g * q * q)} scale(${sc})`, opacity: o });
      fx(k.pic('spark', [fx0, fy0 - 8 * kk], sz, sz), [[t0, P(0, 0.5, 0), 'ease-out'], [t0 + 50, P(0.2, 1.1, 1), 'ease-out'], [t0 + 340, P(0.75, 0.9, 0.9), 'ease-in'], [t0 + 650 + rand() * 250, P(1, 0.3, 0)]]);
    }
  });
  // the spear points glint, in turn
  [[89.6, 112.8], [187.6, 117.1], [170.4, 111.1]].forEach(([x, y], i) => {
    const tb = BURST + (2 - i) * 80 + 160;
    fx(k.pic(star, [x, y], 22, 22), [[tb, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [tb + 80, { transform: 'scale(1) rotate(15deg)', opacity: 1 }], [tb + 460, { transform: 'scale(.4) rotate(40deg)', opacity: 0 }]]);
  });

  // ── the riders ride in (alone only), hit the spears, are shattered, and ride on out of the glare again
  const dist = [88, 40, 9], hitT = [1950, 1700, 1450];
  if (alone) {
    [0, 1, 2].forEach((i) => {
      const th = hitT[i], t0 = 400, R = RID[i];
      const x = (t) => -dist[i] * Math.pow(clamp01((t - t0) / (th - t0)), 1.6);
      const pose = (t) => {
        const run = t < th, bob = run ? Math.sin(t / 85 + i) * 0.9 * clamp01((t - 200) / 400) : 0;
        let dx = x(Math.min(t, th)), dy = bob, rt = run ? -0.8 * Math.sin(t / 85 + i) : 0, op = 1, sc = 1;
        if (t >= th) {
          const q = clamp01((t - th) / 220), v = sm(clamp01((t - th - 60) / 300));
          dx += 7 * sm(q); dy += -3 * sm(q) - 8 * v; rt = -15 * sm(q); op = 1 - v; sc = 1 + 0.06 * v;
        }
        if (t > 2900) { const q = sm(clamp01((t - 2900) / 700)); dx = 18 * (1 - q); dy = 0; rt = 0; op = q; sc = 1; }
        return { transform: `${k.T(dx, dy)} rotate(${rt.toFixed(2)}deg) scale(${sc.toFixed(3)})`, opacity: +op.toFixed(2) };
      };
      act(k.part(`rider${i}`), sample(pose, { opacity: 1 }));
      // dust kicked up behind as it gallops
      for (let q = 0, tt = 520; tt < th - 40; tt += 100, q++) {
        const px = R[0] + x(tt) + 10, py = R[1] + 2, r = Math.round(rand() * 360);
        fx(k.picIn('dust', [px, py], 14, 12, { lit: false }), [[tt, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [tt + 140, { transform: `${k.T(3, -3)} rotate(${r + 15}deg) scale(.9)`, opacity: 0.5 }], [tt + 700, { transform: `${k.T(10, -9)} rotate(${r + 40}deg) scale(1.7)`, opacity: 0 }]]);
      }
    });
  }

  // ── at each blow: a flash, a star and a ring at the guard, sparks, shadow shattering and thinned by the light
  B.forEach((bl) => {
    const t = bl.t, [gx, gy] = bl.g, s = bl.s;
    fx(k.light('g-amb', bl.g, 66), [[t - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 20, { transform: `scale(${(1.3 * s).toFixed(2)})`, opacity: 1 }, eio], [t + 160, { transform: `scale(${(1.6 * s).toFixed(2)})`, opacity: 0.5 }, eio], [t + 440, { transform: 'scale(2.1)', opacity: 0 }]]);
    fx(k.pic(star, bl.g, 38, 38), [[t - 10, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [t + 25, { transform: `scale(${(0.8 * s).toFixed(2)}) rotate(12deg)`, opacity: 1 }], [t + 300, { transform: `scale(${(1.15 * s).toFixed(2)}) rotate(30deg)`, opacity: 0 }]]);
    fx(k.pic(ring, bl.g, 26, 26), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(.6)', opacity: 0.95 }], [t + 460, { transform: `scale(${(2.2 * s).toFixed(2)})`, opacity: 0 }]]);
    for (let j = 0; j < 11; j++) {
      const a = -Math.PI * (0.05 + 0.9 * rand()), d = 14 + rand() * 30, g = 10 + rand() * 12, sz = 6 + rand() * 6, t0 = t + rand() * 40;
      const P = (q, sc, o) => ({ transform: `${k.T(Math.cos(a) * d * q, Math.sin(a) * d * q + g * q * q)} scale(${sc})`, opacity: o });
      fx(k.pic('spark', bl.g, sz, sz), [[t0, P(0, 0.5, 0), 'ease-out'], [t0 + 40, P(0.2, 1.1, 1), 'ease-out'], [t0 + 240, P(0.75, 0.9, 0.9), 'ease-in'], [t0 + 480 + rand() * 160, P(1, 0.3, 0)]]);
    }
    for (let j = 0; j < 5; j++) {
      const a = Math.PI * (0.1 + 0.8 * rand()), d = 8 + rand() * 12, r = Math.round(rand() * 360);
      fx(k.pic('gloom', [gx + 6 + rand() * 8, gy + 8 + rand() * 12], 22, 22, { lit: false }), [[t - 5, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 70, { transform: `${k.T(Math.cos(a) * d * 0.5, -Math.sin(a) * d * 0.5)} rotate(${r + 20}deg) scale(1)`, opacity: 0.7 }], [t + 620, { transform: `${k.T(Math.cos(a) * d, -Math.sin(a) * d - 10)} rotate(${r + 60}deg) scale(1.8)`, opacity: 0 }]]);
    }
  });
}
