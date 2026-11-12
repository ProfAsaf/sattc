// Twin Souls: the two spirits slip their helix and swoop out to be born.
//
// PLAN (drawing units 300 x 210, ms of the move)
//   role support, element spirit. The boon is two small spirits.
//   0-1300    gather: the pool at the foot of the helix swells with light and
//             motes spiral up both strands; the helix tightens and brightens,
//             the two spirits at its tips tremble and flare, flapping.
//   1300      RELEASE: each spirit lets go of its strand and swoops off in a
//             looping arc (the right one to the right, the left to the left;
//             flapping fast, tilting into the turn), a streak of light behind
//             it. The helix, let go, falls back into the pool and dims.
//   1900      IMPACT: each lands at its mark T (alone: the field on either
//             side; aimed: either side of the target card's point): a flash,
//             two rings of light, sparks, motes rising. Each hovers there,
//             bobbing, shining: a new spirit.
//   2700-3400 they fly home along the same arcs; the helix winds back up
//             beneath them.
//   3400-3800 they settle on their tips, the pool glows, the light dies.
//   3800      at rest as drawn.
// The spirits that fly are overlay pictures (they may leave the card); the
// drawn ones fade out as they go and back in as they return.
export const END = 4200;
export const BEATS = { release: 1300, impact: 1900, settle: 3800 };
export const STILLS = [350, 900, 1300, 1550, 1900, 2300, 3100, 3900];

export const textures = {
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 244, 200, Math.min(1, c * 1.4) * c]; }],
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 240 + 15 * c, 190 + 60 * c * c, Math.min(1, c * c * 2.4)]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out';
  const helix = k.part('helix'), souls = [k.part('soul0'), k.part('soul1')];
  const H = k.spec.heads, pool = k.spec.pool;
  const aimed = !!k.aim;
  // where each spirit goes: alone, out over the field either side; aimed, either side of the target
  const Q = aimed ? [[k.aim[0] - 12, k.aim[1]], [k.aim[0] + 12, k.aim[1]]] : [[110, 146], [214, 146]];
  k.css('.g-spirit { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,252,236,.95), rgba(255,236,170,.5) 28%, rgba(255,214,120,.16) 58%, rgba(255,200,100,0) 100%); }');
  const F1 = (n) => n.toFixed(1);
  // a little spirit like the two on the helix: body, tail and two wings, with a halo; 32 x 28, its body at (16, 11.5)
  const wing = (dd) => `<path d="M${F1(16 + 1.5 * dd)},10 L${F1(16 + 6 * dd)},3.5 L${F1(16 + 11 * dd)},2 L${F1(16 + 14 * dd)},4.5 L${F1(16 + 11 * dd)},7 L${F1(16 + 6 * dd)},10.5 L${F1(16 + 1.5 * dd)},14Z"/>`;
  const shape = `<ellipse cx="16" cy="11.5" rx="2.9" ry="3"/><path d="M13.8,14 L16,26 L18.2,14Z"/>${wing(-1)}${wing(1)}`;
  const spirit = k.svg('<defs><filter id="h" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>' +
    `<g fill="#ffe3a0" filter="url(#h)" opacity=".9">${shape}</g><g fill="#fffbea">${shape}</g>`, 32, 28);
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#fff0b8" stroke-width="4.5" filter="url(#b)"/>', 100, 100);

  // ── the helix: gathers (tightens, brightens), is let go at the release and falls back into the pool, winds up again
  act(helix, [[0, { transform: 'scale(1, 1)', opacity: 1 }, eio], [350, { transform: 'scale(1.025, 1.01)', opacity: 1 }, eio], [900, { transform: 'scale(1.045, 1.025)', opacity: 1 }, eio], [1290, { transform: 'scale(1.055, 1.03)', opacity: 1 }, 'ease-in'],
    [1750, { transform: 'scale(.86, .1)', opacity: 0.2 }, eio], [3000, { transform: 'scale(.86, .1)', opacity: 0.2 }, 'ease-out'], [3800, { transform: 'scale(1, 1)', opacity: 1 }]]);
  // the drawn spirits: trembling and flaring while they gather, gone as they leave, back as they return
  souls.forEach((s, i) => {
    const sg = i ? 1 : -1, list = [[0, { transform: 'rotate(0deg) scale(1, 1)', opacity: 1 }, eio]];
    for (let t = 300, j = 0; t < 1250; t += 110, j++) {
      const f = Math.min(1, (t - 200) / 1000);
      list.push([t, { transform: `${k.T(0, -0.6 * f * (1 + (j % 2)))} rotate(${((j % 2 ? 1 : -1) * 3.5 * f * sg).toFixed(1)}deg) scale(${(1 + 0.12 * f + (j % 2 ? 0.06 : 0)).toFixed(3)}, ${(1 + 0.08 * f).toFixed(3)})`, opacity: 1 }, eio]);
    }
    list.push([1285, { transform: 'rotate(0deg) scale(1.16, 1.1)', opacity: 1 }, 'linear'], [1305, { transform: 'rotate(0deg) scale(1.16, 1.1)', opacity: 0 }, 'linear'],
      [3340, { transform: 'rotate(0deg) scale(1, 1)', opacity: 0 }, 'ease-out'], [3480, { transform: 'rotate(0deg) scale(1, 1)', opacity: 1 }]);
    act(s, list);
  });

  // ── the pool at the foot swells, light gathers at the tips
  fx(k.lightIn('g-spirit', [pool[0], pool[1] - 6], 96, 40), [[100, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [700, { transform: 'scale(1)', opacity: 0.8 }, eio], [1300, { transform: 'scale(1.15)', opacity: 1 }, eio], [1800, { transform: 'scale(1.3)', opacity: 0.5 }, eio],
    [2900, { transform: 'scale(.8)', opacity: 0.15 }, eio], [3500, { transform: 'scale(1.1)', opacity: 0.7 }, eio], [4000, { transform: 'scale(1)', opacity: 0 }]]);
  H.forEach((h, i) => {
    const ls = [[300 + i * 90, { transform: 'scale(.5)', opacity: 0 }, 'ease-out']];
    for (let t = 500 + i * 60, j = 0; t < 1280; t += 120, j++) ls.push([t, { transform: `scale(${(0.9 + 0.5 * Math.min(1, t / 1200) + (j % 2 ? 0.12 : 0)).toFixed(2)})`, opacity: 0.55 + 0.4 * Math.min(1, t / 1200) }, eio]);
    ls.push([1330, { transform: 'scale(1.8)', opacity: 0.9 }, 'ease-out'], [1700, { transform: 'scale(1)', opacity: 0 }]);
    fx(k.light('g-spirit', h, 52), ls);
  });
  // light spiralling up both strands (the helix is x = 162 + (6 + 22 t) sin(1.25 tau t + phase), y = 176 - 126 t)
  const hx = (ph, t) => [162 + (6 + 22 * t) * Math.sin(t * 1.25 * 2 * Math.PI + ph), 176 - 126 * t];
  for (let i = 0; i < 12; i++) {
    const ph = i % 2 ? 0 : Math.PI, t0 = 80 + i * 85 + rand() * 30, sz = 2.8 + rand() * 2.4, life = 800 + rand() * 200, tmax = i % 2 ? 1 : 0.93;
    const list = [];
    for (let j = 0; j <= 6; j++) { const [x, y] = hx(ph, (tmax * j) / 6); list.push([Math.round(t0 + (life * j) / 6), { transform: `${k.T(x - 162, y - 176)} scale(${(j === 0 || j === 6 ? 0.4 : 1).toFixed(1)})`, opacity: j === 0 || j === 6 ? 0 : 0.95 }, 'linear']); }
    fx(k.picIn('mote', [162, 176], sz, sz), list);
  }

  // ── the swoop: each spirit's way out (a looping arc), and back
  const SW = [];
  H.forEach((h, i) => {
    const sg = i ? 1 : -1, S = [h[0], h[1] - 2], P = Q[i];
    const mid = [(S[0] + P[0]) / 2 + sg * 16, Math.min(S[1], P[1]) - 30];
    const base = k.arc(S, mid, P, 14, (t) => k.smooth(t));
    // a little spiral on the way: sideways about the line, dying away toward the end
    const pts = base.map((p, j, a) => {
      const f = j / 14, nx = a[Math.min(j + 1, 14)][1] - a[Math.max(j - 1, 0)][1], ny = -(a[Math.min(j + 1, 14)][0] - a[Math.max(j - 1, 0)][0]), nn = Math.hypot(nx, ny) || 1;
      const w = 9 * Math.sin(f * Math.PI * 3) * (1 - f) * (aimed ? 0.8 : 1);
      return [p[0] + (nx / nn) * w, p[1] + (ny / nn) * w];
    });
    SW.push({ S, P, pts });
    const rel = (p) => [p[0] - S[0], p[1] - S[1]];
    const tilt = (j, rev) => { const a = pts[Math.max(0, Math.min(14, j + (rev ? -1 : 1)))], b = pts[Math.max(0, Math.min(14, j - (rev ? -1 : 1)))]; return Math.max(-55, Math.min(55, (Math.atan2(a[0] - b[0], -(a[1] - b[1])) * 180) / Math.PI * 0.6)) * (rev ? -1 : 1); };
    const pose = (p, rot, sx, sy, op) => ({ transform: `${k.T(...rel(p))} rotate(${rot.toFixed(0)}deg) scale(${sx.toFixed(2)}, ${sy.toFixed(2)})`, opacity: op });
    const list = [[0, pose(S, 0, 1, 1, 0), 'linear'], [1280, pose(S, 0, 1.16, 1.1, 0), 'linear'], [1300, pose(S, 0, 1.16, 1.1, 1), 'linear']];
    // out
    pts.forEach((p, j) => { if (j) list.push([Math.round(1300 + (600 * j) / 14), pose(p, tilt(j, false), j % 2 ? 0.8 : 1.22, j % 2 ? 1.12 : 0.92, 1), 'linear']); });
    // hovering, bobbing, flapping, in its place
    for (let t = 1990, j = 0; t < 2700; t += 120, j++) list.push([t, pose([P[0] + (j % 2 ? 1.2 : -1.2) * sg, P[1] + (j % 3 === 1 ? -2.4 : j % 3 === 2 ? 0.6 : -0.8)], (j % 2 ? 5 : -5) * sg, j % 2 ? 0.86 : 1.14, j % 2 ? 1.06 : 0.95), 'linear']);
    // home
    for (let j = 14; j >= 0; j--) list.push([Math.round(2700 + (650 * (14 - j)) / 14), pose(pts[j], -tilt(j, true) * 0 + (j < 14 ? tilt(j, true) : 0), (14 - j) % 2 ? 0.82 : 1.18, (14 - j) % 2 ? 1.1 : 0.94, 1), 'linear']);
    list.push([3360, pose(S, 0, 1.06, 1.03, 0), 'linear']);
    fx(k.pic(spirit, S, 32, 28), list.filter((x, n, a) => n === 0 || x[0] > a[n - 1][0]));
    // its light rides with it
    const ll = [[0, { transform: 'scale(.5)', opacity: 0 }, 'linear'], [1299, { transform: 'scale(.5)', opacity: 0 }, 'linear']];
    pts.forEach((p, j) => ll.push([Math.round(1300 + (600 * j) / 14), { transform: `${k.T(...rel(p))} scale(${(0.7 + 0.5 * Math.sin((j / 14) * Math.PI)).toFixed(2)})`, opacity: 0.9 }, 'linear']));
    for (let t = 2000, j = 0; t < 2700; t += 140, j++) ll.push([t, { transform: `${k.T(...rel(P))} scale(${j % 2 ? 1.25 : 1})`, opacity: j % 2 ? 0.95 : 0.75 }, eio]);
    for (let j = 14; j >= 0; j--) ll.push([Math.round(2700 + (650 * (14 - j)) / 14), { transform: `${k.T(...rel(pts[j]))} scale(${(0.7 + 0.5 * Math.sin((j / 14) * Math.PI)).toFixed(2)})`, opacity: 0.9 }, 'linear']);
    ll.push([3400, { transform: 'scale(1.3)', opacity: 0.7 }, 'ease-out'], [3700, { transform: 'scale(.8)', opacity: 0 }, 'linear']);
    fx(k.light('g-spirit', S, 34), ll.filter((x, n, a) => n === 0 || x[0] > a[n - 1][0]));
    // the streak behind it on the way out: sparks that follow its path, late, small, fading
    for (let n = 1; n <= 7; n++) {
      const lag = n * 34, l2 = [[0, { transform: 'scale(.3)', opacity: 0 }, 'linear'], [1300 + lag - 1, { transform: `${k.T(...rel(S))} scale(.3)`, opacity: 0 }, 'linear']];
      pts.forEach((p, j) => l2.push([Math.round(1300 + lag + (600 * j) / 14), { transform: `${k.T(...rel(p))} scale(${(1 - n * 0.09).toFixed(2)})`, opacity: j === 14 ? 0 : 0.85 - n * 0.09 }, 'linear']));
      fx(k.pic('spark', S, 9 - n * 0.7, 9 - n * 0.7), l2.filter((x, m, a) => m === 0 || x[0] > a[m - 1][0]));
    }
  });

  // ── where they land (BEATS.impact): a flash, two rings, sparks, motes rising; and, alone, ripples on the field
  const IM = 1900;
  Q.forEach((P, i) => {
    fx(k.light('g-spirit', P, 70), [[IM - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.2)', opacity: 1 }, 'ease-out'], [IM + 250, { transform: 'scale(1.35)', opacity: 0.7 }, eio], [IM + 450, { transform: 'scale(1.2)', opacity: 0.8 }, eio], [IM + 800, { transform: 'scale(1.5)', opacity: 0 }]]);
    for (const [dl, big] of [[i * 40, 1.4], [i * 40 + 170, 1.0]]) fx(k.pic(ring, P, 50, 50), [[IM + dl, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + dl + 50, { transform: 'scale(.3)', opacity: 0.95 }, 'ease-out'], [IM + dl + 650, { transform: `scale(${big})`, opacity: 0 }]]);
    if (!aimed) fx(k.picIn(ring, [P[0], P[1] + 26], 56, 56), [[IM + 40, { transform: 'scale(.15, .05)', opacity: 0 }, 'ease-out'], [IM + 100, { transform: 'scale(.3, .09)', opacity: 0.8 }, 'ease-out'], [IM + 900, { transform: 'scale(1.1, .3)', opacity: 0 }]]);
    for (let n = 0; n < 11; n++) {
      const a = rand() * 6.28, r = 10 + rand() * 22, sz = 2.4 + rand() * 3, t0 = IM + rand() * 40, life = 400 + rand() * 360;
      const e = [Math.cos(a) * r, Math.sin(a) * r * 0.85 - 4];
      const pts = k.arc([0, 0], [e[0] * 0.6, e[1] * 0.6 - 8 - rand() * 6], [e[0], e[1] + 6 + rand() * 7], 5);
      fx(k.pic('spark', P, sz, sz), pts.map(([x, y], j) => [Math.round(t0 + life * j / 5), { transform: `${k.T(x, y)} scale(${(1 - 0.65 * j / 5).toFixed(2)})`, opacity: j === 5 ? 0 : 1 - 0.1 * j }, j < 2 ? 'ease-out' : 'linear']));
    }
    for (let n = 0; n < 7; n++) {
      const t0 = IM + 150 + n * 100 + i * 30, x = (rand() - 0.5) * 24, sz = 3 + rand() * 3;
      fx(k.pic('mote', P, sz, sz), [[t0, { transform: `${k.T(x, 6)} scale(.5)`, opacity: 0 }, 'ease-out'], [t0 + 250, { transform: `${k.T(x * 1.1, -4)} scale(1)`, opacity: 0.9 }], [t0 + 1100, { transform: `${k.T(x * 1.4, -28 - rand() * 14)} scale(.6)`, opacity: 0 }]]);
    }
  });
  // the spirits wake as they arrive home: a pulse of light on each tip
  H.forEach((h, i) => fx(k.light('g-spirit', h, 46), [[3320 + i * 40, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [3440 + i * 40, { transform: 'scale(1.4)', opacity: 0.9 }, 'ease-out'], [3900, { transform: 'scale(1)', opacity: 0 }]]));
}
