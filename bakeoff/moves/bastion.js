// Bastion: the dome of light takes a spear and shatters it.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: defender (the card is a
// Trick that guards a creature: the picture is a ward taking a blow, so it
// blocks; the suggestion was support), element: light.
//   0-700     the frozen instant lets go: the drawn flash and cracks fade, the
//             broken spear draws back out of the picture and its shards drift
//             away and go out.
//   500-900   he braces (BEATS.release): the boy sets his feet and leans into his
//             shield; the dome swells and brightens, its skin lights, and motes of
//             light lift off the ground inside it.
//   1250, 1750, 2250 (alone; else k.blows)  a black spear flies in at the dome
//             and strikes its skin (BEATS.impact: the first). At each blow: the
//             dome flexes and rebounds, its skin flares, a flash, a ring along
//             the skin, cracks that heal, sparks flung off; the spear snaps, its
//             head breaking into shards that scatter; the boy is shoved and
//             rocks behind his shield. Each is a little stronger.
//   2800-3600 it holds, then calms; the spear and the flash and cracks of the
//             drawing come back as they were, gently.
//   3600      at rest as drawn (the move ends at END).
//
// The contract (bakeoff/recipe.md): blows come as k.blows || his own three
// spears; each is taken at its time `at`, on the nearest of his `guard` points
// (points on the dome's skin). The spear is drawn only when he plays alone: with
// k.blows given, the attacker brings its own attack and he only answers it.
// The dome, the boy and the skin's light are each one sampled list (every 30 ms),
// the sum of every blow's damped shake, so blows may come as close as they like.
export const END = 4200;
export const BEATS = { release: 900, impact: 1250, settle: 3600 };
export const STILLS = [350, 800, 1180, 1290, 1420, 1830, 2900, 3900];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 226 + 29 * c * c, 150 + 105 * c * c, Math.min(1, c * c * 2.2)]; }],
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 244, 200, Math.min(1, c * c * 1.4)]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const G = k.spec.guard, [cx, cy] = k.spec.dome, feet = k.spec.feet, tip = k.spec.tip, ax = k.spec.axis, hit = k.spec.hit;
  const RX = 94, RY = 122;
  const alone = !k.blows;
  const own = [{ at: 1250, to: G[1] }, { at: 1750, to: G[2] }, { at: 2250, to: G[0] }];
  const near = (to) => G.reduce((b, g) => (Math.hypot(g[0] - to[0], g[1] - to[1]) < Math.hypot(b[0] - to[0], b[1] - to[1]) ? g : b), G[0]);
  const normal = (g) => { const x = (g[0] - cx) / (RX * RX), y = (g[1] - cy) / (RY * RY), l = Math.hypot(x, y); return [x / l, y / l]; };
  const B = (k.blows || own).slice().sort((a, b) => a.at - b.at).map((b, i) => {
    const g = near(b.to); return { t: Math.max(950, Math.min(3000, b.at)), g, n: normal(g), s: 1 + 0.12 * i, i };
  });
  const last = B.at(-1).t;

  k.css(`.g-bast { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,252,236,.95), rgba(255,230,160,.55) 28%, rgba(255,200,110,.16) 58%, rgba(255,180,80,0) 100%); }
    .fx-copy.f-hot { mix-blend-mode: plus-lighter; filter: brightness(1.3) saturate(1.2); }`);

  // ── what shakes it: the brace (0..1), and each blow's damped shake (push, then rebound)
  const holdTo = last + 700, relaxTo = Math.min(holdTo + 800, 3600);
  const brace = (t) => sm(Math.max(0, Math.min(1, (t - 450) / 450))) * (1 - sm(Math.max(0, Math.min(1, (t - holdTo) / (relaxTo - holdTo)))));
  const shake = (tau) => (tau <= 0 ? 0 : (Math.exp(-tau / 190) * Math.sin((2 * Math.PI * tau) / 300)) / 0.66);
  const flash = (tau) => (tau < -15 ? 0 : tau < 0 ? 1 + tau / 15 : Math.exp(-tau / 260));
  const grid = [];
  for (let t = 0; t <= 3570; t += 30) grid.push(t);
  const rest = { transform: 'none' };
  const sample = (fn, last0 = {}) => [...grid.map((t) => [t, fn(t), 'linear']), [3700, { ...rest, ...last0 }]];
  const F = (t) => Math.max(0, ...B.map((b) => flash(t - b.t) * (0.7 + 0.3 * b.s)));

  // ── the dome (and its skin, on the same keyframes): swells as it braces, flexes at each blow
  const domeTf = (t) => {
    const b = brace(t);
    let sx = 1 + 0.012 * b, sy = 1 + 0.016 * b, th = 0;
    for (const bl of B) {
      const x = shake(t - bl.t) * bl.s;
      sx += 0.012 * x; sy -= 0.014 * x; th += (bl.n[0] > 0 ? -1 : 1) * 0.7 * x;
    }
    return `rotate(${th.toFixed(2)}deg) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
  };
  act(k.part('dome'), sample((t) => ({ transform: domeTf(t) })));
  act(k.part('skin'), sample((t) => ({ transform: domeTf(t) })));
  // its skin lit: a hot copy, brighter as it braces, flaring at each blow
  act(k.copy('skin', 'f-hot'), sample((t) => ({ transform: domeTf(t), opacity: +Math.min(1, 0.05 + 0.5 * brace(t) + 0.8 * F(t)).toFixed(2) }), { opacity: 0 }));
  // the dome's light, inside and at its foot
  fx(k.lightIn('g-bast', [cx, 130], 210, 250), [[450, { transform: 'scale(.7)', opacity: 0 }, 'ease-out'], [950, { transform: 'scale(1)', opacity: 0.5 }, eio],
    ...B.flatMap((b) => [[b.t, { transform: 'scale(1.04)', opacity: 0.8 }, eio], [b.t + 300, { transform: 'scale(1)', opacity: 0.5 }, eio]]), [3000, { transform: 'scale(1)', opacity: 0.45 }, eio], [3600, { transform: 'scale(.9)', opacity: 0 }]]);
  fx(k.lightIn('g-bast', [cx, 184], 230, 36), [[420, { transform: 'scale(.5, .6)', opacity: 0 }, 'ease-out'], [950, { transform: 'scale(1)', opacity: 0.8 }, eio], [3000, { transform: 'scale(1)', opacity: 0.6 }, eio], [3600, { transform: 'scale(.9, .8)', opacity: 0 }]]);

  // ── the boy: sets his feet and leans into the shield; shoved and rocking at each blow
  const kid = (t) => {
    const b = brace(t);
    let dx = 0.6 * b, dy = 0.5 * b, th = 1.4 * b, sy = 1 - 0.03 * b;
    for (const bl of B) {
      const x = shake(t - bl.t - 30) * bl.s, d = [hit[0] - bl.g[0], hit[1] - bl.g[1]], n = Math.hypot(...d);
      dx += (d[0] / n) * 2 * x; dy += 0.4 * Math.abs(x); th += -2.4 * x; sy -= 0.012 * Math.abs(x);
    }
    return `${k.T(dx, dy)} rotate(${th.toFixed(2)}deg) scale(1, ${sy.toFixed(3)})`;
  };
  act(k.part('kid'), sample((t) => ({ transform: kid(t) })));

  // ── the drawing's frozen strike lets go, and comes back at the end
  const away = [-ax[0], -ax[1]]; // back up the spear's line
  act(k.part('strike'), [[0, { opacity: 1 }, 'ease-out'], [450, { opacity: 0 }], [3050, { opacity: 0 }, eio], [3600, { opacity: 1 }]]);
  act(k.part('flare'), [[0, { transform: 'scale(1)', opacity: 1 }, 'ease-out'], [300, { transform: 'scale(1.5)', opacity: 0 }], [3100, { transform: 'scale(1.5)', opacity: 0 }, eio], [3600, { transform: 'scale(1)', opacity: 1 }]]);
  act(k.part('shaft'), [[0, { transform: 'none', opacity: 1 }, 'ease-in'], [700, { transform: `${k.T(away[0] * 70, away[1] * 70)}`, opacity: 0 }], [2900, { transform: `${k.T(away[0] * 40, away[1] * 40)}`, opacity: 0 }, 'ease-out'], [3600, { transform: 'none', opacity: 1 }]]);
  const sh = [[0, { transform: `${k.T(0, 0)} rotate(0deg)`, opacity: 1 }, 'ease-out'], [650, { transform: `${k.T(16, -9)} rotate(30deg) scale(1.15)`, opacity: 0 }],
    [3000, { transform: `${k.T(10, -6)} rotate(20deg) scale(1.1)`, opacity: 0 }, 'ease-out'], [3600, { transform: `${k.T(0, 0)} rotate(0deg) scale(1)`, opacity: 1 }]];
  act(k.part('shards'), sh);

  // ── motes of light lifting off the ground inside the dome while it gathers
  for (let i = 0; i < 16; i++) {
    const x = cx - 70 + rand() * 140, y = 176 + rand() * 6, t = 450 + rand() * 650, s = 3 + rand() * 4, rise = 40 + rand() * 60, dx = (rand() - 0.5) * 14;
    fx(k.picIn('mote', [x, y], s, s), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 250, { transform: `${k.T(dx * 0.3, -rise * 0.25)} scale(1)`, opacity: 0.9 }, 'linear'], [t + 1500 + rand() * 800, { transform: `${k.T(dx, -rise)} scale(.6)`, opacity: 0 }]]);
  }

  // ── the broken shards of the drawing and a quick light as it lets go
  fx(k.light('g-bast', [204, 118], 80), [[0, { transform: 'scale(1)', opacity: 0.35 }, 'ease-out'], [420, { transform: 'scale(1.3)', opacity: 0 }]]);

  // ── at each blow
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#fff3cc" stroke-width="3" filter="url(#b)"/>', 60, 60);
  const star = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".6"/></filter></defs><path d="M30,2L33,27L58,30L33,33L30,58L27,33L2,30L27,27Z" fill="#fff8e0" filter="url(#b)"/><circle cx="30" cy="30" r="5" fill="#fff"/>', 60, 60);
  const shard = k.svg('<path d="M1,2L11,5L3,10Z" fill="#0f0a07" stroke="#ffe6a6" stroke-width=".7" stroke-linejoin="round"/>', 12, 12);
  const spear = k.copy('shaft', 'f-spear');
  const spearActs = [];
  B.forEach((bl) => {
    const t = bl.t, [gx, gy] = bl.g, [nx, ny] = bl.n, s = bl.s, tang = (Math.atan2(nx, -ny) * 180) / Math.PI;
    const front = (d) => [gx + nx * d, gy + ny * d];
    fx(k.light('g-bast', bl.g, 68), [[t - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 20, { transform: `scale(${(1.3 * s).toFixed(2)})`, opacity: 1 }, eio], [t + 160, { transform: `scale(${(1.6 * s).toFixed(2)})`, opacity: 0.5 }, eio], [t + 480, { transform: 'scale(2.1)', opacity: 0 }]]);
    fx(k.pic(star, bl.g, 40, 40), [[t - 10, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [t + 25, { transform: `scale(${(0.8 * s).toFixed(2)}) rotate(12deg)`, opacity: 1 }], [t + 300, { transform: `scale(${(1.15 * s).toFixed(2)}) rotate(30deg)`, opacity: 0 }]]);
    fx(k.pic(ring, bl.g, 28, 28), [[t, { transform: `rotate(${tang.toFixed(0)}deg) scale(.3, .2)`, opacity: 0 }, 'ease-out'], [t + 40, { transform: `rotate(${tang.toFixed(0)}deg) scale(.6, .45)`, opacity: 0.95 }], [t + 460, { transform: `rotate(${tang.toFixed(0)}deg) scale(${(2.1 * s).toFixed(2)}, ${(1.3 * s).toFixed(2)})`, opacity: 0 }]]);
    fx(k.pic(ring, bl.g, 28, 28), [[t + 90, { transform: `rotate(${tang.toFixed(0)}deg) scale(.3, .2)`, opacity: 0 }, 'ease-out'], [t + 130, { transform: `rotate(${tang.toFixed(0)}deg) scale(.5, .35)`, opacity: 0.6 }], [t + 560, { transform: `rotate(${tang.toFixed(0)}deg) scale(${(3 * s).toFixed(2)}, ${(1.8 * s).toFixed(2)})`, opacity: 0 }]]);
    // cracks that spread on the skin, then heal
    let d = '';
    for (let j = 0; j < 5; j++) {
      const a = ((tang + [-155, -100, 150, 105, -55][j] + (rand() - 0.5) * 20) * Math.PI) / 180, l = 12 + rand() * 12;
      let x = 30, y = 30; d += `M${x},${y}`;
      for (let q = 1; q <= 3; q++) { x += (Math.cos(a) * l * 0.34 * 30) / 12 + (rand() - 0.5) * 3; y += (Math.sin(a) * l * 0.34 * 30) / 12 + (rand() - 0.5) * 3; d += `L${x.toFixed(1)},${y.toFixed(1)}`; }
    }
    const cr = k.svg(`<path d="${d}" fill="none" stroke="#fffbe8" stroke-width="1.1" stroke-linecap="round"/>`, 60, 60);
    fx(k.pic(cr, bl.g, 34, 34), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 60, { transform: 'scale(1)', opacity: 0.95 }], [t + 400, { transform: 'scale(1.04)', opacity: 0.7 }, eio], [t + 900, { transform: 'scale(1.06)', opacity: 0 }]]);
    // sparks flung off, outward along the normal, falling
    for (let j = 0; j < 12; j++) {
      const a = Math.atan2(ny, nx) + (rand() - 0.5) * 2.2, dist = 14 + rand() * 32, g = 10 + rand() * 12, sz = 6 + rand() * 6, t0 = t + rand() * 40;
      const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * dist * f, Math.sin(a) * dist * f + g * f * f)} scale(${sc})`, opacity: o });
      fx(k.pic('spark', bl.g, sz, sz), [[t0, P(0, 0.5, 0), 'ease-out'], [t0 + 40, P(0.2, 1.1, 1), 'ease-out'], [t0 + 240, P(0.75, 0.9, 0.9), 'ease-in'], [t0 + 480 + rand() * 160, P(1, 0.3, 0)]]);
    }
    if (alone) {
      // the spear flies in along the inward normal (170 ms), snaps, and tumbles off
      const th = (Math.atan2(-ny, -nx) - Math.atan2(ax[1], ax[0])) * 180 / Math.PI;
      const Q = front(13), at = (d, extra = 0, rr = 0) => `${k.T(Q[0] - tip[0] + nx * d, Q[1] - tip[1] + ny * d)} rotate(${(th + extra + rr).toFixed(1)}deg)`;
      spearActs.push([[t - 190, { transform: at(150), opacity: 0 }, 'ease-in'], [t - 170, { transform: at(140), opacity: 1 }, 'ease-in'], [t, { transform: at(0), opacity: 1 }, 'linear'], [t + 40, { transform: at(1, 0, -1), opacity: 1 }, 'ease-out'], [t + 330, { transform: at(22, 18, 0), opacity: 0 }]]);
      for (let j = 0; j < 7; j++) {
        const a = Math.atan2(ny, nx) + (rand() - 0.5) * 2.4, dist = 12 + rand() * 30, g = 14 + rand() * 12, r0 = Math.round(rand() * 360), sz = 5 + rand() * 4, t0 = t + rand() * 30;
        const P = (f, o) => ({ transform: `${k.T(Math.cos(a) * dist * f, Math.sin(a) * dist * f + g * f * f)} rotate(${Math.round(r0 + f * 360)}deg)`, opacity: o });
        fx(k.pic(shard, front(10), sz, sz, { lit: false }), [[t0, P(0, 0), 'ease-out'], [t0 + 20, P(0.08, 1), 'ease-out'], [t0 + 300, P(0.6, 1), 'ease-in'], [t0 + 650 + rand() * 150, P(1, 0)]]);
      }
    }
  });
  // (one spear copy, flying at each blow in turn: its moments merged into one list)
  if (spearActs.length) {
    const list = spearActs.flat().sort((a, b) => a[0] - b[0]);
    act(spear, [[0, { transform: 'translate(0px, 0px)', opacity: 0 }], ...list]);
  } else act(spear, [[0, { opacity: 0 }]]);
}
