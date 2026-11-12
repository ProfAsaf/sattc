// Lumen, Mother of Moths: she lets her light go, and it comes home.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support, element: light.
//   150-1100  she gathers: her stained-glass wings begin to beat (foreshortened from the
//             front: each wing folds in toward her and out again, faster and faster), the
//             panes lighting from within; the fourteen little moths on her swarm leave
//             their places one after another, spiralling up round her and out toward T.
//   1150      (BEATS.release) a burst of light under her wings; the great swarm (twenty-eight
//             more, glowing) pours out from beneath them toward T, spiralling.
//   1800      (BEATS.impact) the first of them reach T: a bloom of gold light, a violet
//             ring, shards of coloured glass rising, motes drifting up; the moths circle
//             there, a lantern of wings, the light holding.
//   2500-3700 they come home: each wheels back to where it sat; the rest stream under her
//             wings and are gone in a pulse of light; her wings beat slower and fold to rest.
//   3700      at rest as drawn (the move ends at END).
//
// The contract (bakeoff/recipe.md): her boon goes to T = k.aim || her own target (the
// meadow on her right); the swarm leaves from `emit` (under her wings) and every flight is
// worked out from emit and T. The fourteen drawn moths are parts and can only fly inside her
// picture: if T is beyond its frame they go as far as the frame's edge and vanish into the
// overlay's swarm, which goes on to T, and they reappear coming home. BEATS: when the
// swarm leaves, when it lands, when she is at rest again.
export const END = 4200;
export const BEATS = { release: 1150, impact: 1800, settle: 3700 };
export const STILLS = [450, 900, 1180, 1500, 1850, 2300, 3000, 3900];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 226 + 29 * c * c, 150 + 105 * c * c, Math.min(1, c * c * 2.4)]; }],
  mote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [230 + 25 * c, 200 + 40 * c, 255, Math.min(1, c * c * 2.2)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out', sm = k.smooth, D2R = Math.PI / 180, TAU = Math.PI * 2;
  const S = k.spec, E = S.emit, MOTHS = S.moths, N = MOTHS.length;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const T = k.aim || S.alone;

  k.css(`.g-lamp { border-radius: 50%; background: radial-gradient(circle, rgba(255,250,228,.95), rgba(255,214,130,.6) 30%, rgba(210,150,230,.22) 58%, rgba(160,110,230,0) 72%); }
    .g-pane { border-radius: 50%; background: radial-gradient(circle, rgba(255,236,190,.7), rgba(255,190,120,.3) 40%, rgba(200,130,240,.1) 65%, rgba(160,100,230,0) 75%); }`);
  const moth = k.svg('<defs><radialGradient id="h"><stop offset="0" stop-color="#ffe6a8" stop-opacity=".55"/><stop offset="1" stop-color="#ffd77a" stop-opacity="0"/></radialGradient></defs><circle cx="7" cy="5" r="6.5" fill="url(#h)"/><g fill="#ffeab0"><path d="M7,5 C5.4,1.6 1.4,1.2 1,3.6 C.8,5.4 4.4,5.8 7,5Z"/><path d="M7,5 C8.6,1.6 12.6,1.2 13,3.6 C13.2,5.4 9.6,5.8 7,5Z"/><path d="M7,5.4 C5.4,7.2 3,8.6 3.8,9 C5,9.4 6.6,7.6 7,5.4Z" opacity=".8"/><path d="M7,5.4 C8.6,7.2 11,8.6 10.2,9 C9,9.4 7.4,7.6 7,5.4Z" opacity=".8"/></g><circle cx="7" cy="5" r="1" fill="#fff"/>', 14, 10);
  const ring = k.svg('<defs><linearGradient id="r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0c0"/><stop offset=".6" stop-color="#ffc870"/><stop offset="1" stop-color="#b88aff"/></linearGradient></defs><circle cx="30" cy="30" r="27" fill="none" stroke="url(#r)" stroke-width="2.6"/><circle cx="30" cy="30" r="27" fill="none" stroke="#fff8e0" stroke-width=".8" opacity=".8"/>', 60, 60);
  const shard = (c1, c2) => k.svg(`<defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><path d="M5,0 L9,4.5 L6,10 L1,6Z" fill="url(#s)" stroke="#1a1020" stroke-width=".7" stroke-linejoin="round"/>`, 10, 10);
  const shards = [shard('#ffe39a', '#ff9a5a'), shard('#d8b0ff', '#8a5ad8'), shard('#ffd0a8', '#e0709a')];

  // ── geometry helpers
  const inFrame = (p) => p[0] > 8 && p[0] < 292 && p[1] > 8 && p[1] < 202;
  const edge = (() => { if (inFrame(T)) return T; let lo = 0, hi = 1; for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2, p = [E[0] + (T[0] - E[0]) * m, E[1] + (T[1] - E[1]) * m]; if (inFrame(p)) lo = m; else hi = m; } return [E[0] + (T[0] - E[0]) * lo, E[1] + (T[1] - E[1]) * lo]; })();
  const outside = edge !== T;
  // a point along a bent path from a to b (bent through c), with a spiral round it
  const bez = (a, b, c, s) => { const q = 1 - s; return [q * q * a[0] + 2 * q * s * c[0] + s * s * b[0], q * q * a[1] + 2 * q * s * c[1] + s * s * b[1]]; };
  const spir = (a, b, c, s, amp, loops, ph) => {
    const p = bez(a, b, c, s), q = bez(a, b, c, Math.min(1, s + 0.02)), r = bez(a, b, c, Math.max(0, s - 0.02));
    let dx = q[0] - r[0], dy = q[1] - r[1]; const n = Math.hypot(dx, dy) || 1; dx /= n; dy /= n;
    const w = amp * Math.pow(Math.sin(Math.PI * s), 0.8) * Math.sin(TAU * loops * s + ph), w2 = amp * 0.5 * Math.pow(Math.sin(Math.PI * s), 0.8) * Math.cos(TAU * loops * s + ph);
    return [p[0] - dy * w + dx * w2, p[1] + dx * w + dy * w2];
  };
  const O = (p) => k.P(...p);
  const mvTo = (from, p) => { const [a, b] = O(from), [c, d] = O(p); return `translate(${(c - a).toFixed(1)}px, ${(d - b).toFixed(1)}px)`; };
  const flutter = (t, ph, rate = 150) => 0.5 + 0.5 * Math.abs(Math.cos(((t + ph) / rate) * Math.PI));

  // ── her wings: they fold in and out (seen from the front), faster as the light gathers, easing to rest
  const env = (t) => sm(clamp((t - 150) / 700, 0, 1)) * (1 - sm(clamp((t - 3000) / 560, 0, 1)));
  const freq = (t) => 1.3 + 2.4 * sm(clamp((t - 300) / 900, 0, 1)) * (1 - 0.7 * sm(clamp((t - 2300) / 700, 0, 1)));
  const grid = [], phase = []; { let ph = 0; for (let t = 0; t <= 3600; t += 20) { grid.push(t); phase.push(ph); ph += TAU * freq(t) * 0.02; } }
  const wingTf = (i, dir) => {
    const t = grid[i], e = env(t), c = 0.5 + 0.5 * Math.cos(phase[i]);
    const catchIt = Math.exp(-Math.pow((t - 3450) / 110, 2)); // a last beat as the swarm comes home
    const sx = 1 - (0.26 * e + 0.06 * catchIt) * c, r = dir * (-7 * e * (1 - c) + 2 * catchIt);
    return `rotate(${r.toFixed(2)}deg) scale(${sx.toFixed(3)}, 1)`;
  };
  [['wingL', -1], ['wingR', 1]].forEach(([nm, dir]) => act(k.part(nm), [...grid.map((t, i) => [t, { transform: wingTf(i, dir) }, 'linear']), [3700, { transform: 'none' }]]));
  // the panes light from within: a gold glow over each wing, beating with it
  [[-1, [100, 100]], [1, [200, 100]]].forEach(([dir, p]) => {
    const l = grid.map((t, i) => [t, { transform: `scale(${(0.85 + 0.2 * (0.5 + 0.5 * Math.cos(phase[i])) * env(t)).toFixed(3)})`, opacity: +clamp(0.5 * env(t) * (0.8 + 0.3 * Math.cos(phase[i] + 1)), 0, 0.6).toFixed(2) }, 'linear']);
    fx(k.lightIn('g-pane', p, 120, 90), [...l, [3700, { transform: 'scale(.85)', opacity: 0 }]]);
  });
  fx(k.lightIn('g-lamp', [150, 96], 70, 70), [[100, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(1.1)', opacity: 0.55 }, eio], [2000, { transform: 'scale(1)', opacity: 0.4 }, eio], [3300, { transform: 'scale(.9)', opacity: 0.4 }, eio], [3650, { transform: 'scale(.7)', opacity: 0 }]]);

  // ── the fourteen drawn moths: wheel up round her, stream to T (or to the frame's edge), circle there, wheel home
  const order = MOTHS.map((m, i) => i).sort((a, b) => Math.hypot(MOTHS[a][0] - T[0], MOTHS[a][1] - T[1]) - Math.hypot(MOTHS[b][0] - T[0], MOTHS[b][1] - T[1]));
  order.forEach((i, rank) => {
    const R = [MOTHS[i][0], MOTHS[i][1]], ph = rand() * TAU, tl = 420 + rank * 70, F = 820, tr = 2400 + rank * 35, FR = 760, ctl = [(R[0] + edge[0]) / 2 + (R[0] < 150 ? -14 : 14), Math.min(R[1], edge[1]) - 40 - rand() * 24];
    const orbR = 9 + rand() * 7, w = (2.2 + rand() * 0.8) * (rank % 2 ? 1 : -1), mine = (t) => {
      // its position at ms t
      if (t < tl) return R;
      if (t < tl + F) return spir(R, edge, ctl, sm((t - tl) / F), 16, 1.5, ph);
      if (t < tr) { const a = ph + ((t - tl - F) / 1000) * w * 2, fade = Math.min(1, (t - tl - F) / 220); return [edge[0] + fade * orbR * Math.cos(a), edge[1] + fade * orbR * 0.6 * Math.sin(a)]; }
      if (t < tr + FR) { const a = ph + ((tr - tl - F) / 1000) * w * 2, s0 = [edge[0] + orbR * Math.cos(a), edge[1] + orbR * 0.6 * Math.sin(a)]; return spir(s0, R, ctl, sm((t - tr) / FR), 12, 1.2, ph + 2); }
      return R;
    };
    const vis = (t) => (outside ? (t < tl + F - 140 ? 1 : t < tl + F + 40 ? 1 - sm((t - tl + 140 - F) / 180) : t < tr + 200 ? 0 : t < tr + 420 ? sm((t - tr - 200) / 220) : 1) : 1);
    const keys = []; for (let t = 0; t <= 3640; t += 30) {
      const p = mine(t), moving = t >= tl && t <= tr + FR, dx = p[0] - R[0], dy = p[1] - R[1];
      keys.push([t, { transform: `${k.T(dx, dy)} scale(${(moving ? 0.55 + 0.45 * flutter(t, i * 37) : 1).toFixed(2)}, 1)`, opacity: +vis(t).toFixed(2) }, 'linear']);
    }
    act(k.part(`moth${i}`), [...keys, [3700, { transform: 'none', opacity: 1 }]]);
  });

  // ── the burst under her wings as the swarm leaves
  fx(k.light('g-lamp', E, 62), [[1080, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1190, { transform: 'scale(1.1)', opacity: 1 }, eio], [1700, { transform: 'scale(.9)', opacity: 0.25 }, eio], [2000, { transform: 'scale(.6)', opacity: 0 }]]);
  fx(k.pic(ring, E, 50, 50), [[1130, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [1180, { transform: 'scale(.4)', opacity: 0.9 }, 'ease-out'], [1600, { transform: 'scale(1.5)', opacity: 0 }]]);

  // ── the swarm: twenty-eight glowing moths from under her wings to T, round it, and home
  const NS = 28;
  for (let j = 0; j < NS; j++) {
    const ph = rand() * TAU, t0 = 1150 + j * 18 + rand() * 20, F = 650 + rand() * 150, sz = 11 + rand() * 6;
    const goal = [T[0] + (rand() - 0.5) * 16, T[1] + (rand() - 0.5) * 12], start = [E[0] + (rand() - 0.5) * 18, E[1] + (rand() - 0.5) * 6];
    const ctl = [(start[0] + goal[0]) / 2 + (rand() - 0.5) * 30, Math.min(start[1], goal[1]) - 30 - rand() * 28];
    const orbR = 6 + rand() * 14, w = (2 + rand() * 1.4) * (j % 2 ? 1 : -1), tback = 2500 + j * 22, FR = 700, pos = (t) => {
      if (t < t0 + F) return spir(start, goal, ctl, sm((t - t0) / F), 14, 1.5, ph);
      if (t < tback) { const a = ph + ((t - t0 - F) / 1000) * w * 2, f = Math.min(1, (t - t0 - F) / 250); return [goal[0] + f * orbR * Math.cos(a), goal[1] + f * orbR * 0.6 * Math.sin(a) - f * 4]; }
      const a = ph + ((tback - t0 - F) / 1000) * w * 2, s0 = [goal[0] + orbR * Math.cos(a), goal[1] + orbR * 0.6 * Math.sin(a) - 4];
      return spir(s0, start, ctl, sm((t - tback) / FR), 12, 1.2, ph + 2);
    };
    const tend = tback + FR, keys = [[t0 - 20, { transform: `${mvTo(start, start)} scale(.3, .3)`, opacity: 0 }, 'ease-out']];
    for (let t = t0; t <= tend; t += 30) {
      const p = pos(t), near = t > t0 + F && t < tback, op = t < t0 + 120 ? sm((t - t0) / 120) : t > tend - 160 ? 1 - sm((t - tend + 160) / 160) : 1;
      keys.push([t, { transform: `${mvTo(start, p)} scale(${(0.6 + 0.5 * flutter(t, j * 53)).toFixed(2)}, ${(near ? 1 : 0.9).toFixed(2)})`, opacity: +(op * 0.95).toFixed(2) }, 'linear']);
    }
    keys.push([tend + 40, { transform: `${mvTo(start, start)} scale(.3, .3)`, opacity: 0 }]);
    fx(k.pic(moth, start, sz, sz * 0.714), keys);
  }

  // ── where it lands (BEATS.impact): a bloom of light, a ring, shards of coloured glass, motes
  const IM = 1800;
  fx(k.light('g-lamp', T, 84), [[IM - 80, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 120, { transform: 'scale(1.1)', opacity: 0.95 }, eio], [IM + 600, { transform: 'scale(1)', opacity: 0.75 }, eio], [IM + 1000, { transform: 'scale(1.05)', opacity: 0.8 }, eio], [2900, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.light('g-pane', T, 130), [[IM, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 300, { transform: 'scale(1)', opacity: 0.6 }, eio], [2500, { transform: 'scale(1.05)', opacity: 0.5 }, eio], [3000, { transform: 'scale(.9)', opacity: 0 }]]);
  fx(k.pic(ring, T, 60, 60), [[IM - 20, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(.4)', opacity: 1 }, 'ease-out'], [IM + 600, { transform: 'scale(1.6)', opacity: 0 }]]);
  fx(k.pic(ring, T, 60, 60), [[IM + 300, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 360, { transform: 'scale(.4)', opacity: 0.6 }, 'ease-out'], [IM + 1000, { transform: 'scale(2)', opacity: 0 }]]);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU + rand() * 0.5, d = 18 + rand() * 24, t0 = IM + 20 + rand() * 120, sz = 7 + rand() * 4, r = rand() * 360, sp = (rand() - 0.5) * 400;
    const at = (q) => `translate(${(Math.cos(a) * d * q * u).toFixed(1)}px, ${((Math.sin(a) * d * q * 0.7 - 16 * q - 10 * Math.sin(q * 3)) * u).toFixed(1)}px) rotate(${(r + sp * q).toFixed(0)}deg)`;
    fx(k.pic(shards[i % 3], T, sz, sz), [[t0, { transform: `${at(0)} scale(.3)`, opacity: 0 }, 'ease-out'], [t0 + 90, { transform: `${at(0.2)} scale(1)`, opacity: 1 }, 'linear'], [t0 + 700, { transform: `${at(0.75)} scale(1)`, opacity: 0.9 }, 'linear'], [t0 + 1300, { transform: `${at(1)} scale(.8)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 14; i++) {
    const x = T[0] + (rand() - 0.5) * 40, y = T[1] + (rand() - 0.5) * 16, t0 = IM + 100 + rand() * 900, sz = 3 + rand() * 3, rise = 20 + rand() * 24, dx = (rand() - 0.5) * 12;
    fx(k.pic(i % 3 ? 'spark' : 'mote', [x, y], sz, sz), [[t0, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 200, { transform: `${k.T(dx * 0.2, -rise * 0.2)} scale(1)`, opacity: 1 }, 'linear'], [t0 + 800, { transform: `${k.T(dx * 0.8, -rise * 0.8)} scale(.8)`, opacity: 0.7 }, 'linear'], [t0 + 1200, { transform: `${k.T(dx, -rise)} scale(.3)`, opacity: 0 }]]);
  }

  // ── home: the last of the swarm pours under her wings in a pulse of light
  fx(k.light('g-lamp', E, 70), [[3150, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [3420, { transform: 'scale(1.1)', opacity: 0.95 }, eio], [3700, { transform: 'scale(.9)', opacity: 0.3 }, eio], [4000, { transform: 'scale(.6)', opacity: 0 }]]);
  fx(k.pic(ring, E, 60, 60, { low: true }), [[3380, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [3430, { transform: 'scale(.4)', opacity: 0.7 }, 'ease-out'], [3900, { transform: 'scale(1.6)', opacity: 0 }]]);
}
