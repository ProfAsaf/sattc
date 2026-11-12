// Deep Roots: light wakes in the deep, runs up every root into the young tree, which swells and
// unfurls, and the tree sends the gift on: a stream of light and leaves to the weakest creature.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support (Invest: +1/+1 for good), element:
// nature. Parts: the tangle of roots with their glowing tips (grow a hair, from the trunk's foot),
// the stem (from its foot) and its leaves (riding the stem, from the crown).
//   0-300     still: the tree sways a little in the breeze.
//   300-1500  the gather: a glow swells in the deep; the glowing tips flare one after another, the
//             farthest first, and each sends a mote of light running up its root to the trunk; the
//             roots stir and thicken a touch as the light passes.
//   1400-1750 the light surges up the trunk: a glow climbs the stem into the crown, which swells,
//             the leaves opening.
//   1700      RELEASE (BEATS.release): the crown flares; a stream of light, motes and leaves arcs
//             from `emit` (the crown) to T; the tree kicks back and settles.
//   2200      LANDS (BEATS.impact) at T = k.aim, else the meadow on its right: a flash, rings,
//             motes, two "+1" signs of light rising, fine roots growing down from the spot and a
//             little sprout rising from the ground.
//   2300-3700 the glow in the deep fades, the roots and tree ease back to rest.
//
// The contract: the boon leaves from `emit` (the crown) and goes to T.
export const END = 4200;
export const BEATS = { release: 1700, impact: 2200, settle: 3700 };
export const STILLS = [200, 700, 1100, 1500, 1750, 2200, 2800, 3900];

export const textures = {
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [236, 255, 170, Math.min(1, c * c * 1.5)]; }],
  crumb: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2; return [48, 36, 22, r < 0.8 ? 1 : Math.max(0, (1 - r) * 5)]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, sm = k.smooth, eio = 'ease-in-out';
  const S = k.spec, [bx, by] = S.base, [cx, cy] = S.crown, E = S.emit, T = k.aim || S.alone;
  const stem = k.part('stem'), leaves = k.part('leaves'), roots = k.part('roots');
  const rad = (d) => (d * Math.PI) / 180;

  k.css(`.g-nature { border-radius: 50%; background: radial-gradient(circle, rgba(250,255,226,.95), rgba(196,242,112,.6) 30%, rgba(120,200,70,.2) 55%, rgba(90,180,60,0) 70%); }
.g-deep { border-radius: 50%; background: radial-gradient(ellipse, rgba(236,255,150,.75), rgba(190,240,100,.3) 45%, rgba(160,220,80,0) 72%); }`);

  const track = (keys) => (t) => {
    let i = keys.length - 1;
    while (i > 0 && keys[i][0] > t) i--;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const f = b[0] === a[0] ? 0 : sm(Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))));
    return a[1] + (b[1] - a[1]) * f;
  };
  // growth (0..1, with overshoot), the kick as the gift leaves, the breeze, the roots' stir, the leaves' unfurl
  const grow = track([[0, 0], [1400, 0], [1900, 1.25], [2300, 1.0], [2900, 1.05], [3700, 0]]);
  const kick = track([[1700, 0], [1760, -1], [1900, 0.4], [2100, 0]]);
  const swayK = track([[0, 0], [200, 1], [900, 0.5], [1400, 0], [2400, 0.3], [3000, 0.8], [3700, 0]]);
  const stir = track([[0, 0], [1000, 0], [1700, 1], [2400, 0.8], [3300, 0.25], [3700, 0]]);
  const open = track([[0, 0], [1550, 0], [1850, 1.2], [2200, 0.9], [3000, 0.9], [3700, 0]]);
  const flick = track([[1650, 0], [1730, 1], [1950, -0.3], [2200, 0]]);
  const pose = (t) => {
    const g = grow(t), kk = kick(t), sw = swayK(t) * 1.3 * Math.sin(t / 420);
    const sy = 1 + 0.19 * g + 0.04 * kk, sx = 1 + 0.07 * g - 0.02 * kk;
    return { r: sw, sx, sy };
  };
  const grid = [];
  for (let t = 0; t <= 3700; t += 40) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3800, { transform: 'none' }]];
  act(stem, sample((t) => { const p = pose(t); return { transform: `rotate(${p.r.toFixed(2)}deg) scale(${p.sx.toFixed(3)}, ${p.sy.toFixed(3)})` }; }));
  // the leaves ride the top of the stem (their joint, the crown, is carried by it), open and flick
  act(leaves, sample((t) => {
    const p = pose(t), dx0 = cx - bx, dy0 = cy - by, sxv = dx0 * p.sx, syv = dy0 * p.sy, rr = rad(p.r);
    const nx = bx + sxv * Math.cos(rr) - syv * Math.sin(rr), ny = by + sxv * Math.sin(rr) + syv * Math.cos(rr);
    const o = open(t), fl = flick(t), sl = 1 + 0.2 * o;
    return { transform: `translate(${((nx - cx) * u).toFixed(2)}px, ${((ny - cy) * u).toFixed(2)}px) rotate(${(p.r + 5 * fl + 2 * Math.sin(t / 260) * o).toFixed(2)}deg) scale(${sl.toFixed(3)})` };
  }));
  // the roots thicken and reach a touch as the light passes
  act(roots, sample((t) => { const s = stir(t); return { transform: `scale(${(1 + 0.012 * s).toFixed(4)}, ${(1 + 0.03 * s).toFixed(4)})` }; }));

  // ── the glow in the deep, rising through the soil
  fx(k.lightIn('g-deep', [150, 196], 330, 130), [[250, { transform: 'scale(.7)', opacity: 0 }, 'ease-out'], [1200, { transform: 'scale(1)', opacity: 0.8 }, eio], [1750, { transform: 'scale(1.08)', opacity: 1 }, eio], [2500, { transform: 'scale(1.05)', opacity: 0.75 }, eio], [3500, { transform: 'scale(.95)', opacity: 0 }]]);
  fx(k.lightIn('g-deep', [150, 120], 300, 110), [[700, { transform: 'scale(.7)', opacity: 0 }, 'ease-out'], [1500, { transform: 'scale(1)', opacity: 0.55 }, eio], [1900, { transform: 'scale(1.06)', opacity: 0.7 }, eio], [2700, { transform: 'scale(1)', opacity: 0.3 }, eio], [3500, { transform: 'scale(.95)', opacity: 0 }]]);

  // ── the tips flare, farthest first, each sending a mote of light running up its root to the trunk's foot
  const tips = S.tips, root = [bx, by + 4];
  const dist = (p) => Math.hypot(p[0] - root[0], p[1] - root[1]), dmax = Math.max(...tips.map(dist));
  tips.forEach((p, i) => {
    const far = dist(p) / dmax, t0 = 420 + (1 - far) * 560 + rand() * 90, run = 560 + far * 300;
    const bend = (rand() - 0.5) * 12, nrm = [-(root[1] - p[1]), root[0] - p[0]];
    const nl = Math.hypot(nrm[0], nrm[1]) || 1;
    const at = (q) => [p[0] + (root[0] - p[0]) * q + (nrm[0] / nl) * bend * Math.sin(Math.PI * q), p[1] + (root[1] - p[1]) * q + (nrm[1] / nl) * bend * Math.sin(Math.PI * q)];
    // the tip's own flare
    fx(k.picIn('mote', p, 13, 13), [[t0, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t0 + 120, { transform: 'scale(1.3)', opacity: 1 }, eio], [t0 + 420, { transform: 'scale(.9)', opacity: 0.55 }, eio], [t0 + 900, { transform: 'scale(.6)', opacity: 0 }]]);
    // the mote running up
    const sz = 4 + rand() * 2.4, list = [[t0 + 80, { transform: 'scale(.4)', opacity: 0 }, 'ease-out']], steps = 5;
    for (let s = 0; s <= steps; s++) { const q = s / steps, a = at(q); list.push([t0 + 150 + run * q, { transform: `${k.T(a[0] - p[0], a[1] - p[1])} scale(${(0.9 + 0.4 * Math.sin(Math.PI * q)).toFixed(2)})`, opacity: q > 0.9 ? 0.2 : 0.95 }, 'linear']); }
    list.push([t0 + 250 + run, { transform: `${k.T(root[0] - p[0], root[1] - p[1])} scale(.4)`, opacity: 0 }]);
    fx(k.picIn('mote', p, sz, sz), list);
  });
  // the trunk's foot gathers it all, swelling
  const foot = [bx, by + 2];
  fx(k.lightIn('g-nature', foot, 74, 50), [[760, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1450, { transform: 'scale(1)', opacity: 0.9 }, eio], [1600, { transform: 'scale(1.3)', opacity: 1 }, eio], [2300, { transform: 'scale(1.1)', opacity: 0.55 }, eio], [3100, { transform: 'scale(.8)', opacity: 0 }]]);
  // rings through the soil round the foot as the light arrives
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".8"/></filter></defs><ellipse cx="30" cy="10" rx="26" ry="6.5" fill="none" stroke="#f4ffd2" stroke-width="1.7" filter="url(#b)"/>', 60, 20);
  [[1350, 0.6, 4.6, 900], [1650, 0.8, 5.4, 1000], [2000, 0.45, 4.2, 900]].forEach(([t, o, sc, d]) => fx(k.picIn(ring, [bx, by + 3], 22, 7.4), [[t, { transform: 'scale(.3, .3)', opacity: 0 }, 'ease-out'], [t + 60, { transform: 'scale(.6, .6)', opacity: o }, 'ease-out'], [t + d, { transform: `scale(${sc}, ${sc})`, opacity: 0 }]]));

  // ── up the trunk: a glow climbs the stem into the crown (1450-1750)
  fx(k.lightIn('g-nature', [bx, by - 4], 34, 34), [[1400, { transform: `${k.T(0, 0)} scale(.5)`, opacity: 0 }, 'ease-out'], [1500, { transform: `${k.T(0, -6)} scale(1)`, opacity: 1 }, 'linear'], [1740, { transform: `${k.T(cx - bx, cy - by + 4)} scale(1.1)`, opacity: 1 }, 'ease-in'], [1880, { transform: `${k.T(cx - bx, cy - by - 2)} scale(1.6)`, opacity: 0 }]]);
  for (let n = 0; n < 12; n++) {
    const t = 1400 + n * 42 + rand() * 30, y0 = by - 4 - rand() * 6, side = (rand() - 0.5) * 7, sz = 2.6 + rand() * 2.4;
    fx(k.pic('mote', [bx + side, y0], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 100, { transform: `${k.T(0, -4)} scale(1)`, opacity: 0.95 }, 'linear'], [t + 380 + rand() * 120, { transform: `${k.T((rand() - 0.5) * 8, cy - y0 - rand() * 6)} scale(.5)`, opacity: 0 }]]);
  }
  // the crown: swells with light, flares as the gift leaves, glows a while, then fades
  const cl = [[1500, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [1690, { transform: 'scale(1.1)', opacity: 0.85 }, 'ease-out'], [1760, { transform: 'scale(1.6)', opacity: 1 }, eio]];
  for (let t = 1950, i = 0; t < 2700; t += 170, i++) cl.push([t, { transform: `scale(${i % 2 ? 1.35 : 1.15})`, opacity: i % 2 ? 0.8 : 0.6 }, eio]);
  cl.push([3300, { transform: 'scale(.9)', opacity: 0 }]);
  fx(k.light('g-nature', [cx, cy - 2], 80), cl);

  // ── the gift (BEATS.release): a stream of light, motes and little leaves arcs from the crown to T
  const leafLight = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".45"/></filter></defs><path d="M3,10C5,3 13,1 17,2C16,9 11,16 3,10Z" fill="#b6e98f" filter="url(#b)"/><path d="M3.6,9.6C6,4.5 12,3 15.5,3.2C14.5,8.5 10.5,13.5 3.6,9.6Z" fill="#effcc8"/>', 20, 14);
  fx(k.light('g-nature', E, 60), [[1650, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1725, { transform: 'scale(1.2)', opacity: 1 }, 'ease-out'], [2100, { transform: 'scale(1.6)', opacity: 0 }]]);
  const C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 30];
  const bz = (q) => { const w = 1 - q; return [w * w * E[0] + 2 * w * q * C[0] + q * q * T[0], w * w * E[1] + 2 * w * q * C[1] + q * q * T[1]]; };
  const [X0, Y0] = k.P(...E);
  for (let n = 0; n < 36; n++) {
    const t0 = 1700 + n * 16, kind = n % 4 === 3 ? 'leaf' : 'mote', sz = kind === 'leaf' ? 10 : 5 + rand() * 5, side = (rand() - 0.5) * 9, spin = Math.round((rand() - 0.5) * 360), dur = 480 + rand() * 80;
    const at = (f, sc, o) => { const [x, y] = k.P(...bz(f)); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + side * Math.sin(Math.PI * f) * u).toFixed(1)}px) rotate(${Math.round(spin * f)}deg) scale(${sc})`, opacity: o }; };
    fx(k.pic(kind === 'leaf' ? leafLight : 'mote', E, sz, kind === 'leaf' ? sz * 0.7 : sz), [[t0, at(0, 0.4, 0), 'ease-out'], [t0 + 60, at(0.08, 1, 1), 'linear'], [t0 + dur * 0.5, at(0.5, 1, 1), 'linear'], [t0 + dur, at(1, 1.1, 0.9), 'ease-out'], [t0 + dur + 200, at(1, 0.4, 0)]]);
  }

  // ── where it lands (BEATS.impact): flash, rings, motes, +1 signs, fine roots growing down, a sprout rising
  const I = 2200;
  const ringC = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#f0ffd2" stroke-width="3" filter="url(#b)"/>', 60, 60);
  fx(k.light('g-nature', T, 78), [[I - 70, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [I + 40, { transform: 'scale(1.3)', opacity: 1 }, eio], [I + 300, { transform: 'scale(1.4)', opacity: 0.6 }, eio], [3000, { transform: 'scale(1.3)', opacity: 0.4 }, eio], [3600, { transform: 'scale(1)', opacity: 0 }]]);
  [[0, 3.3, 0.9], [160, 2.3, 0.6]].forEach(([dt, sc, o]) => fx(k.pic(ringC, T, 26, 26), [[I + dt, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [I + dt + 50, { transform: 'scale(.6)', opacity: o }], [I + dt + 850, { transform: `scale(${sc})`, opacity: 0 }]]));
  for (let n = 0; n < 16; n++) {
    const a = rand() * Math.PI * 2, d = 8 + rand() * 24, sz = 3 + rand() * 3.4, t = I + rand() * 120;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * d * f, Math.sin(a) * d * f * 0.7 - 20 * f)} scale(${sc})`, opacity: o });
    fx(k.pic('mote', T, sz, sz), [[t, P(0, 0.5, 0), 'ease-out'], [t + 60, P(0.2, 1.1, 1), 'ease-out'], [t + 900 + rand() * 500, P(1, 0.4, 0)]]);
  }
  // the two "+1" signs of light (power and vitality), rising
  const plus = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".5"/></filter></defs><path d="M7,1H9V7H15V9H9V15H7V9H1V7H7Z" fill="#d8ffa8" filter="url(#b)"/><path d="M7.3,2H8.7V7.3H14V8.7H8.7V14H7.3V8.7H2V7.3H7.3Z" fill="#fffff0"/>', 16, 16);
  [[I + 200, -8], [I + 360, 8]].forEach(([t, dx]) => fx(k.pic(plus, [T[0] + dx, T[1] - 12], 10, 10), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 180, { transform: `${k.T(0, -5)} scale(1.1)`, opacity: 1 }, 'linear'], [t + 1100, { transform: `${k.T(0, -28)} scale(.8)`, opacity: 0 }]]));
  // fine roots reaching down from T's spot, glowing, then fading
  const hair = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".6"/></filter></defs><g fill="none" stroke-linecap="round"><path d="M30,0C29,12 33,20 30,32C28,40 25,46 26,56M30,14C22,20 17,26 15,36M30,22C38,28 44,32 45,42M28,34C22,40 22,46 18,52" stroke="#d6f58c" stroke-width="2.6" filter="url(#b)"/><path d="M30,0C29,12 33,20 30,32C28,40 25,46 26,56M30,14C22,20 17,26 15,36M30,22C38,28 44,32 45,42M28,34C22,40 22,46 18,52" stroke="#fbffe2" stroke-width=".9"/></g>', 60, 60);
  fx(k.pic(hair, [T[0], T[1] + 6], 30, 30, { top: true }), [[I + 60, { transform: 'scale(.4, .05)', opacity: 0 }, 'cubic-bezier(.2,.8,.3,1)'], [I + 460, { transform: 'scale(1.05, 1.05)', opacity: 1 }, eio], [I + 1000, { transform: 'scale(1, 1)', opacity: 0.9 }, eio], [I + 1700, { transform: 'scale(1.03, 1.06)', opacity: 0 }]]);
  // a small sprout rising where it lands, standing a while, then fading
  const sprout = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".5"/></filter></defs><g filter="url(#b)"><path d="M20,40C20,32 19,26 20,20" stroke="#7fc460" stroke-width="2.4" fill="none"/><path d="M20,22C13,22 6,17 4,10C12,10 19,15 20,22Z" fill="#b8ec8a"/><path d="M20,22C27,22 34,17 36,10C28,10 21,15 20,22Z" fill="#b8ec8a"/></g><path d="M19.4,21C13.5,20.5 8.5,17 7,12.5C13,13 18,16 19.4,21Z" fill="#f2fdd0" opacity=".85"/><path d="M20.6,21C26.5,20.5 31.5,17 33,12.5C27,13 22,16 20.6,21Z" fill="#f2fdd0" opacity=".85"/>', 40, 42);
  const s0 = I + 220;
  fx(k.pic(sprout, [T[0], T[1] + 8], 24, 25, { base: true }), [[s0, { transform: 'scale(.15, .05)', opacity: 0 }, 'cubic-bezier(.2,.8,.3,1)'], [s0 + 320, { transform: 'scale(1.1, 1.12)', opacity: 1 }, eio], [s0 + 480, { transform: 'scale(1, 1)', opacity: 1 }, eio],
    [s0 + 1000, { transform: 'scale(1.03, .98) rotate(2deg)', opacity: 1 }, eio], [s0 + 1300, { transform: 'scale(1, 1) rotate(-2deg)', opacity: 0.9 }, eio], [s0 + 1700, { transform: 'scale(.9, .9)', opacity: 0 }]]);
}
