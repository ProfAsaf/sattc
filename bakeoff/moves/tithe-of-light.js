// Tithe of Light: the villagers set their candles in the bowl, and its light is given.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support, element: light
// (suggestion kept: Invest, gain 3 Life: a boon).
//   0-900     the villagers lean toward the great bowl and set their candles in, one after
//             another (the woman's at 250, the child's at 480, the old man's at 700): each
//             candle carries over the rim and goes out into the crowd of flames, which
//             leaps higher with it; the bowl's glow swells, motes lift off it.
//   900       (BEATS.release) the bowl flares: all its flames leap, a ring of light runs
//             out across it, a column of light shoots up, and three bright orbs (the three
//             Life) leave it one after another, arcing to T, with comets and glints.
//   1350      (BEATS.impact) the first lands at T: a flare, a ring; the second at 1500 and
//             the third at 1650, each a brighter bloom, with motes rising. Alone, T is the
//             rafters: they flare gold and the light spills back down the pillars.
//   1900-3400 the flames settle, the glow fades, the villagers straighten and each takes a
//             new candle (it fades back in, as drawn); at rest as drawn by 3500.
//
// The contract (bakeoff/recipe.md): the gift goes to T = k.aim || the rafters; every point of
// the orbs' paths is worked out from `emit` (the bowl's heart) and T. What flies and lands
// is on the overlay (k.pic / k.light), since T may be on another card. The column and the
// villagers are in the picture. Every motion of a part is one sampled list (every 40 ms).
export const END = 4200;
export const BEATS = { release: 900, impact: 1350, settle: 3500 };
export const STILLS = [250, 600, 950, 1150, 1400, 1700, 2600, 3800];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 232 + 23 * c * c, 160 + 95 * c * c, Math.min(1, c * c * 2.2)]; }],
  mote: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 240, 190, Math.min(1, c * 1.6)]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, E = S.emit, rim = S.rim, held = S.held;
  const T = k.aim || S.alone;
  const ang = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const ph = (t, a, b) => sm(cl((t - a) / (b - a), 0, 1));
  const carry = (p, th, o) => { const r = (th * Math.PI) / 180, vx = p[0] - o[0], vy = p[1] - o[1]; return [o[0] + vx * Math.cos(r) - vy * Math.sin(r), o[1] + vx * Math.sin(r) + vy * Math.cos(r)]; };
  const grid = [];
  for (let t = 0; t <= 3560; t += 40) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3700, { transform: 'none', opacity: 1 }]];
  k.css(`.g-gold { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,246,214,.95), rgba(255,218,140,.5) 25%, rgba(255,190,90,.14) 55%, rgba(255,170,60,0) 100%); }`);

  // ── the villagers lean toward the bowl, set their candle in (at `when`), straighten
  const feet = [[82, 192], [196, 192], [226, 192]], amp = [3.2, 2.6, -2.2], when = [250, 480, 700];
  const lean = (i) => (t) => amp[i] * (ph(t, 80 + i * 100, 520 + i * 100) * (1 - ph(t, 1500, 2900)) + 0.25 * Math.sin(Math.PI * ph(t, 900, 1500)) * 0);
  ['woman', 'child', 'old'].forEach((n, i) => act(k.part(n), sample((t) => ({ transform: `rotate(${lean(i)(t).toFixed(2)}deg)` }))));
  // each candle goes with its villager, then over the rim and out into the flames, and a new one comes back
  const aim = [[rim[0] - 30, rim[1] - 3], [rim[0], rim[1] - 3], [rim[0] + 30, rim[1] - 3]];
  ['candleW', 'candleC', 'candleO'].forEach((n, i) => {
    const a = held[i], B = aim[i], w = when[i];
    const mv = (t) => ph(t, w - 190, w);
    act(k.part(n), [...grid.filter((t) => t < 3000).map((t) => {
      const th = lean(i)(t), [x, y] = carry(a, th, feet[i]), m = mv(t), up = -3 * Math.sin(Math.PI * Math.min(1, m) * 0.5) * (1 - m);
      const dx = x - a[0] + (B[0] - x) * m, dy = y - a[1] + (B[1] - y) * m + up;
      const o = t < w ? 1 : t < w + 60 ? 1 - (t - w) / 60 : 0;
      return [t, { transform: `${k.T(dx, dy)} scale(${(1 - 0.25 * m).toFixed(3)})`, opacity: o }, 'linear'];
    }), [3000, { transform: 'none', opacity: 0 }, 'linear'], [3500, { transform: 'none', opacity: 1 }]]);
  });

  // ── the crowd of flames: each flame group leaps as a candle goes in, flares at the release, settles
  const leap = (g) => (t) => {
    let s = 0;
    when.forEach((c, i) => { s += Math.exp(-(((t - c - 40) / 130) ** 2)) * (g === i ? 1.2 : 0.35); });
    s += 0.35 * ph(t, 300, 880) * (1 - ph(t, 900, 1000));
    s += 1.5 * ph(t, 900, 1060) * (1 - ph(t, 1060, 1700));
    s += 0.18 * ph(t, 1700, 2300) * (1 - ph(t, 2300, 3300));
    s += 0.08 * Math.sin(t / 70 + g * 2) * ph(t, 200, 900) * (1 - ph(t, 900, 1000));
    return s * (1 - ph(t, 3100, 3500));
  };
  ['flamesL', 'flamesM', 'flamesR'].forEach((n, g) => { const f = leap(g); act(k.part(n), sample((t) => ({ transform: `scale(${(1 + 0.12 * f(t)).toFixed(3)}, ${(1 + 0.75 * f(t)).toFixed(3)})` }))); });

  // ── the bowl's light: swells with every candle, flares at the release, burns down
  fx(k.lightIn('g-gold', [150, 122], 150, 80), [[100, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [700, { transform: 'scale(.9)', opacity: 0.5 }, eio], [940, { transform: 'scale(1.3)', opacity: 1 }, eio], [1500, { transform: 'scale(1.2)', opacity: 0.7 }, eio], [2600, { transform: 'scale(1)', opacity: 0.3 }, eio], [3500, { transform: 'scale(.8)', opacity: 0 }]]);
  // each candle set in: a puff of light at the rim
  aim.forEach(([x, y], i) => fx(k.picIn('spark', [x, y], 12, 12), [[when[i] - 60, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [when[i] + 40, { transform: 'scale(1.4)', opacity: 1 }, eio], [when[i] + 400, { transform: 'scale(.6)', opacity: 0 }]]));
  // motes lift off the crowd of flames
  for (let i = 0; i < 14; i++) {
    const t0 = 300 + i * 70 + rand() * 60, x = 150 + (rand() - 0.5) * 90, rise = 20 + rand() * 30, sz = 2 + rand() * 2.2;
    const f = (u, o) => ({ transform: `${k.T(Math.sin(u * 5 + i) * 3, -rise * u)} scale(${(0.6 + 0.6 * Math.sin(Math.PI * Math.min(1, u * 1.2))).toFixed(2)})`, opacity: o });
    fx(k.picIn('spark', [x, 120], sz, sz), [[t0, f(0, 0), 'ease-out'], [t0 + 160, f(0.2, 0.95)], [t0 + 800, f(0.7, 0.8), 'ease-in'], [t0 + 1300, f(1, 0)]]);
  }
  // the ring of light running out across the bowl, and the column climbing to the rafters
  const wide = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1"/></filter></defs><ellipse cx="40" cy="10" rx="36" ry="6" fill="none" stroke="#fff3cc" stroke-width="2.6" filter="url(#b)"/>', 80, 20);
  [900, 1050].forEach((t, i) => fx(k.picIn(wide, [150, 124], 70, 14), [[t, { transform: 'scale(.3, .5)', opacity: 0 }, 'ease-out'], [t + 70, { transform: 'scale(.55, .6)', opacity: 0.95 }], [t + 650, { transform: `scale(${1.5 + 0.4 * i}, 1.1)`, opacity: 0 }]]));
  fx(k.lightIn('g-gold', [150, 70], 58, 130), [[880, { transform: 'scale(.3, .15)', opacity: 0 }, 'ease-out'], [1060, { transform: 'scale(1, .8)', opacity: 0.95 }, eio], [1400, { transform: 'scale(1.1, 1)', opacity: 0.8 }, eio], [2300, { transform: 'scale(1, 1)', opacity: 0.3 }, eio], [3000, { transform: 'scale(.7, 1)', opacity: 0 }]]);

  // ── the release (BEATS.release to .impact): three orbs of light, the three Life, arcing from the bowl to T
  const [X0, Y0] = k.P(...E);
  const dist = Math.hypot(T[0] - E[0], T[1] - E[1]);
  const REL = 900, TRAVEL = 450, GAP = 150;
  const comet = k.svg('<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd77a" stop-opacity="0"/><stop offset=".7" stop-color="#ffeeb8" stop-opacity=".85"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs><path d="M0,3.5Q10,.4 28,3.5Q10,6.6 0,3.5Z" fill="url(#g)"/>', 28, 7);
  const lands = [];
  for (let i = 0; i < 3; i++) {
    const t0 = REL + i * GAP, to = [T[0] + (i - 1) * 7 + (rand() - 0.5) * 4, T[1] + (rand() - 0.5) * 6], from = [E[0] + (i - 1) * 10, E[1] - 2];
    const C = [(from[0] + to[0]) / 2 + (i - 1) * (14 + 0.08 * dist), Math.min(from[1], to[1]) - 10 - 0.1 * dist];
    const pts = k.arc(from, C, to, 10, (u) => Math.pow(u, 1.25)), tr = TRAVEL;
    const [fx0, fy0] = k.P(...from);
    const og = pts.map((p, j) => { const [x, y] = k.P(...p); return [Math.round(t0 + (tr * j) / 10), { transform: `translate(${(x - fx0).toFixed(1)}px, ${(y - fy0).toFixed(1)}px) scale(${(0.55 + 0.6 * Math.sin(Math.PI * Math.min(1, (j + 1) / 6))).toFixed(2)})`, opacity: j === 0 ? 0 : 1 }, 'linear']; });
    const ta = t0 + tr;
    og.push([ta + 90, { transform: `translate(${(k.P(...to)[0] - fx0).toFixed(1)}px, ${(k.P(...to)[1] - fy0).toFixed(1)}px) scale(1.5)`, opacity: 1 }, eio], [ta + 420, { transform: `translate(${(k.P(...to)[0] - fx0).toFixed(1)}px, ${(k.P(...to)[1] - fy0 - 4 * k.u).toFixed(1)}px) scale(.4)`, opacity: 0 }]);
    fx(k.pic('spark', from, 11, 11), og);
    // its comet-tail, drawn out along the way
    fx(k.pic(comet, from, 22, 4.6), pts.map((p, j) => {
      const [x, y] = k.P(...p), a = ang(pts[Math.max(0, j - 1)], pts[Math.min(10, j + 1)]);
      return [Math.round(t0 + 20 + (tr * j) / 10), { transform: `translate(${(x - fx0).toFixed(1)}px, ${(y - fy0).toFixed(1)}px) rotate(${a.toFixed(1)}deg) scale(${(0.5 + 0.5 * Math.sin(Math.PI * Math.min(1, j / 6))).toFixed(2)}, 1)`, opacity: j === 0 ? 0 : j === 10 ? 0.3 : 0.9 }, 'linear'];
    }));
    for (let q = 0; q < 5; q++) {
      const off = (rand() - 0.5) * 8, sz = 2.2 + rand() * 2.2, d0 = t0 + 40 + q * 30;
      fx(k.pic('spark', from, sz, sz), pts.map((p, j) => { const [x, y] = k.P(...p); return [Math.round(d0 + (tr * j) / 10), { transform: `translate(${(x - fx0).toFixed(1)}px, ${(y - fy0 + off * Math.sin((Math.PI * j) / 10) * k.u).toFixed(1)}px) scale(${(0.6 + 0.5 * rand()).toFixed(2)})`, opacity: j === 0 ? 0 : j === 10 ? 0.4 : 0.9 }, 'linear']; })
        .concat([[d0 + tr + 260, { transform: `translate(${(k.P(...to)[0] - fx0).toFixed(1)}px, ${(k.P(...to)[1] - fy0).toFixed(1)}px) scale(.2)`, opacity: 0 }]]));
    }
    lands.push([ta, to]);
  }
  // ── where it lands (BEATS.impact = the first): each orb a bloom of light, a ring and motes rising
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#fff3cc" stroke-width="3" filter="url(#b)"/>', 60, 60);
  lands.forEach(([t, to], i) => {
    fx(k.light('g-gold', to, 52 + 8 * i), [[t - 70, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 60, { transform: 'scale(1.2)', opacity: 1 }, eio], [t + 400, { transform: 'scale(1.4)', opacity: 0.7 }, eio], [t + 1500 - i * 200, { transform: 'scale(1.5)', opacity: 0.3 }, eio], [t + 2000 - i * 200, { transform: 'scale(1.2)', opacity: 0 }]]);
    fx(k.pic(ring, to, 24, 24), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 60, { transform: 'scale(.55)', opacity: 0.95 }], [t + 650, { transform: `scale(${1.9 + 0.4 * i})`, opacity: 0 }]]);
    for (let q = 0; q < 5; q++) {
      const t0 = t + 40 + q * 90 + rand() * 40, x = (rand() - 0.5) * 20, rise = 16 + rand() * 18, sz = 2.2 + rand() * 2.4;
      const f = (u, o) => ({ transform: `${k.T(x + Math.sin(u * 5 + q) * 2.5, 4 - rise * u)} scale(${(0.6 + 0.6 * Math.sin(Math.PI * Math.min(1, u * 1.2))).toFixed(2)})`, opacity: o });
      fx(k.pic('spark', to, sz, sz), [[t0, f(0, 0), 'ease-out'], [t0 + 160, f(0.2, 0.95)], [t0 + 700, f(0.7, 0.85), 'ease-in'], [t0 + 1100 + rand() * 300, f(1, 0)]]);
    }
  });
  // alone: the rafters take the light and spill it back: they glow gold, the pillars catch it
  if (!k.aim) {
    fx(k.lightIn('g-gold', [150, 28], 250, 56), [[lands[0][0] - 60, { transform: 'scale(.6, .8)', opacity: 0 }, 'ease-out'], [lands[0][0] + 80, { transform: 'scale(1, 1)', opacity: 0.8 }, eio], [lands[2][0] + 100, { transform: 'scale(1.1, 1.1)', opacity: 1 }, eio], [2400, { transform: 'scale(1, 1)', opacity: 0.4 }, eio], [3300, { transform: 'scale(.9, .9)', opacity: 0 }]]);
    [[22, 110], [278, 110]].forEach(([x, y], i) => fx(k.lightIn('g-gold', [x, y], 40, 150), [[lands[1][0] + i * 60, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [lands[1][0] + 300, { transform: 'scale(1)', opacity: 0.5 }, eio], [2500, { transform: 'scale(1)', opacity: 0.2 }, eio], [3300, { transform: 'scale(.8)', opacity: 0 }]]));
  }
}
