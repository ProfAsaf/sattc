// The Arcane Well: the water wakes and sends its light up into the night.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: aura (a relic: the place
// itself acts), element: water. Not aimed.
//   0-650     the hush: the runes round the rim draw their light in and dim, the
//             water settles flat and a shade darker, the bucket hangs still; the
//             courtyard dims.
//   700       THE SWELL (BEATS.release): the water bulges, a hot copy lit over it;
//             the rune lights flare one after another round the rim, left to
//             right, rings run across the surface; the threads over the rim
//             stretch; the bucket is jolted and sways.
//   900-2300  the rising: a column of pale light climbs out of the well into the
//             night, and lights (orbs of the water's light) rise from it, drifting
//             up past the cloister roof and out of the picture, the courtyard
//             floor glowing under them.
//   1800      THE PEAK (BEATS.impact): the whole rim flares at once; a great ring of
//             light runs out across the flagstones and past the frame; the surface
//             flashes white; the moon brightens with it.
//   2300-3500 the light falls back: the orbs sink back into the water as sparkles,
//             each rippling the surface; the column thins, the runes breathe down,
//             the bucket's sway dies away.
//   3600      at rest as drawn (the move ends at END).
export const END = 4200;
export const BEATS = { release: 700, impact: 1800, settle: 3600 };
export const STILLS = [350, 760, 1000, 1400, 1800, 2200, 2900, 3900];

export const textures = {
  spark: [32, 32, (x, y) => { const dx = Math.abs(x - 0.5) * 2, dy = Math.abs(y - 0.5) * 2, c = Math.max(0, 1 - Math.hypot(dx, dy)), cr = Math.max(0, 1 - Math.min(dx * 7 + dy, dy * 7 + dx)); const v = Math.min(1, c * c * 1.6 + cr * 0.8); return [226, 252, 255, v]; }],
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [214, 250, 252, Math.min(1, c * c * 1.5)]; }],
};

export function build(k) {
  const { act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  // (keyframes must rise strictly: nudge any that touch)
  const fx = (el, list) => { let last = -1; k.fx(el, list.slice().sort((a, b) => a[0] - b[0]).map((e) => { last = Math.max(last + 1, Math.min(e[0], k.END - 1)); return [last, ...e.slice(1)]; })); };
  const S = k.spec, RIM = S.rim, RUNES = S.runeAt, IMPACT = 1800;
  k.css(`.g-wel { border-radius: 50%; background: radial-gradient(closest-side, rgba(244,254,255,.95), rgba(176,236,244,.55) 28%, rgba(110,200,226,.18) 58%, rgba(90,180,220,0) 100%); }
    .fx-copy.f-wel { mix-blend-mode: plus-lighter; filter: brightness(1.4) saturate(1.1); }`);
  const track = (keys) => (t) => {
    let i = keys.length - 1;
    while (i > 0 && keys[i][0] > t) i--;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const f = b[0] === a[0] ? 0 : sm(Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))));
    return a.slice(1).map((v, j) => v + (b[j + 1] - v) * f);
  };
  const grid = [];
  for (let t = 0; t <= 3590; t += 30) grid.push(t);
  const sample = (fn, last) => [...grid.map((t) => [t, fn(t), 'linear']), [3600, last]];

  // ── the water: settles in the hush, bulges at the swell, flashes at the peak, sinks back
  const wt = track([[0, 1, 1, 0.78, 0], [350, 0.99, 0.9, 0.7, 0], [650, 0.99, 0.88, 0.7, 0], [760, 1.03, 1.25, 1, -1.6], [1100, 1.02, 1.12, 0.95, -1], [1760, 1.04, 1.3, 1, -1.8], [1860, 1.05, 1.42, 1, -2.4], [2300, 1.02, 1.1, 0.95, -0.8], [3000, 1, 1.02, 0.9, 0], [3600, 1, 1, 1, 0]]);
  const wtf = (t) => { const [sx, sy, o, dy] = wt(t); return { transform: `translate(0px, ${(dy * u).toFixed(2)}px) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`, opacity: +Math.min(1, o).toFixed(2) }; };
  act(k.part('water'), sample(wtf, { transform: 'none', opacity: 1 }));
  const hotw = track([[0, 0], [700, 0], [800, 0.7], [1200, 0.3], [1780, 0.45], [1850, 0.95], [2300, 0.35], [3000, 0]]);
  act(k.copy('water', 'f-wel'), sample((t) => { const f = wtf(t); return { transform: f.transform, opacity: +hotw(t)[0].toFixed(2) }; }, { transform: 'none', opacity: 0 }));

  // ── the runes round the rim: dim in the hush, flare at the swell, flare together at the peak, breathe down
  const rt = track([[0, 1], [400, 0.35], [650, 0.3], [820, 1], [1300, 0.8], [1780, 0.9], [1840, 1], [2500, 0.75], [3200, 0.9], [3600, 1]]);
  act(k.part('runes'), sample((t) => ({ transform: 'none', opacity: +rt(t)[0].toFixed(2) }), { transform: 'none', opacity: 1 }));
  const hotr = track([[0, 0], [700, 0], [820, 0.9], [1300, 0.4], [1780, 0.5], [1850, 1], [2600, 0.35], [3300, 0]]);
  act(k.copy('runes', 'f-wel'), sample((t) => ({ transform: 'none', opacity: +hotr(t)[0].toFixed(2) }), { transform: 'none', opacity: 0 }));
  // the threads of water over the rim: stretch with the surge, then fall back (they hang from the lip)
  act(k.part('spill'), [[0, { transform: 'none', opacity: 1 }, eio], [600, { transform: 'scale(1, .9)', opacity: 0.7 }, 'ease-out'], [900, { transform: 'scale(1.5, 1.4)', opacity: 1 }, eio], [1500, { transform: 'scale(1.3, 1.25)', opacity: 0.95 }, eio],
    [1850, { transform: 'scale(1.8, 1.55)', opacity: 1 }, 'ease-out'], [2600, { transform: 'scale(1.2, 1.1)', opacity: 0.9 }, eio], [3400, { transform: 'none', opacity: 1 }]]);
  // the rune lights: one after another round the rim from the left, again all together at the peak
  RUNES.forEach(([x, y], i) => {
    const t = 740 + i * 62;
    fx(k.light('g-wel', [x, y - 1], 13), [[t - 90, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 80, { transform: 'scale(1.1)', opacity: 0.95 }, eio], [t + 420, { transform: 'scale(.8)', opacity: 0.35 }, eio], [IMPACT - 70, { transform: 'scale(.7)', opacity: 0.3 }, 'ease-out'],
      [IMPACT + 70, { transform: 'scale(1.5)', opacity: 1 }, eio], [IMPACT + 600, { transform: 'scale(1)', opacity: 0.4 }, eio], [3100, { transform: 'scale(.6)', opacity: 0 }]]);
  });

  // ── the bucket: jolted by the swell, a pendulum that dies away
  const bk = [[0, { transform: 'rotate(0deg)' }, eio], [680, { transform: 'rotate(-0.6deg)' }, 'ease-out'], [900, { transform: 'rotate(5deg)' }, eio]];
  for (let t = 1250, i = 0; t < 3500; t += 350 + i * 40, i++) bk.push([t, { transform: `rotate(${((i % 2 ? 1 : -1) * 4.6 * Math.pow(0.7, i)).toFixed(2)}deg)` }, eio]);
  bk.push([1860, { transform: 'rotate(-5.5deg)' }, eio]);
  bk.sort((a, b) => a[0] - b[0]);
  bk.push([3700, { transform: 'rotate(0deg)' }]);
  act(k.part('bucket'), bk);

  // ── rings on the surface (flat ellipses): at the swell, and the water's own light rolling out
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".5"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#d6f6fa" stroke-width="2" filter="url(#b)"/>', 60, 60);
  const flat = (sx, sy) => `scale(${sx}, ${sy})`;
  for (let i = 0; i < 3; i++) {
    const t = 760 + i * 230;
    fx(k.pic(ring, [RIM[0], RIM[1] + 1], 60, 60), [[t, { transform: flat(0.2, 0.05), opacity: 0 }, 'ease-out'], [t + 120, { transform: flat(0.55, 0.13), opacity: 0.9 }, 'ease-out'], [t + 800, { transform: flat(0.92, 0.22), opacity: 0 }]]);
  }
  // the great ring across the flagstones and out past the frame
  const wide = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1"/></filter></defs><circle cx="40" cy="40" r="35" fill="none" stroke="#c6f4f6" stroke-width="2.6" filter="url(#b)"/><circle cx="40" cy="40" r="31" fill="none" stroke="#effdfb" stroke-width=".9" opacity=".8"/>', 80, 80);
  for (let i = 0; i < 2; i++) {
    const t = IMPACT + i * 190;
    fx(k.pic(wide, [150, 162], 80, 80), [[t, { transform: flat(0.4, 0.09), opacity: 0 }, 'ease-out'], [t + 150, { transform: flat(1.2, 0.27), opacity: 0.95 }, 'ease-out'], [t + 1300, { transform: flat(5.6, 1.3), opacity: 0 }]]);
  }
  // a ring of light over the rim itself at the peak
  fx(k.pic(ring, [RIM[0], RIM[1]], 60, 60), [[IMPACT - 30, { transform: flat(0.5, 0.13), opacity: 0 }, 'ease-out'], [IMPACT + 90, { transform: flat(0.95, 0.25), opacity: 1 }, 'ease-out'], [IMPACT + 700, { transform: flat(1.3, 0.33), opacity: 0 }]]);

  // ── light: the column rising out of the well, the glow on the flagstones, the sky above, the moon
  fx(k.light('g-wel', [150, 70], 72, 170), [[780, { transform: 'scaleY(.2)', opacity: 0 }, 'ease-out'], [1100, { transform: 'scaleY(.8)', opacity: 0.5 }, eio], [IMPACT, { transform: 'scaleY(1.1)', opacity: 0.8 }, eio], [2500, { transform: 'scaleY(1)', opacity: 0.4 }, eio], [3300, { transform: 'scaleY(.5)', opacity: 0 }]]);
  fx(k.light('g-wel', [150, 164], 300, 64), [[0, { transform: 'scale(1)', opacity: 0 }], [300, { transform: 'scale(.9)', opacity: 0 }, 'ease-out'], [850, { transform: 'scale(1)', opacity: 0.5 }, eio], [IMPACT, { transform: 'scale(1.15)', opacity: 0.9 }, eio], [2800, { transform: 'scale(1)', opacity: 0.35 }, eio], [3500, { transform: 'scale(.9)', opacity: 0 }]]);
  fx(k.light('g-wel', [150, 122], 150, 60), [[740, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(1)', opacity: 0.75 }, eio], [1750, { transform: 'scale(1)', opacity: 0.6 }, 'ease-out'], [IMPACT + 100, { transform: 'scale(1.35)', opacity: 1 }, eio], [2600, { transform: 'scale(1)', opacity: 0.4 }, eio], [3400, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.light('g-wel', [150, 40], 220, 140), [[1000, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [IMPACT, { transform: 'scale(1)', opacity: 0.35 }, eio], [2800, { transform: 'scale(1.05)', opacity: 0.18 }, eio], [3500, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.light('g-wel', [236, 30], 70), [[IMPACT - 200, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [IMPACT + 150, { transform: 'scale(1)', opacity: 0.5 }, eio], [2900, { transform: 'scale(1.1)', opacity: 0.2 }, eio], [3500, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.pic('spark', [RIM[0], RIM[1] - 2], 70, 70), [[IMPACT - 40, { transform: 'rotate(0deg) scale(.2)', opacity: 0 }, 'ease-out'], [IMPACT + 90, { transform: 'rotate(12deg) scale(1)', opacity: 0.95 }, 'ease-out'], [IMPACT + 600, { transform: 'rotate(40deg) scale(.5)', opacity: 0 }]]);

  // ── the lights rising: orbs of the water's light climb in a column, drifting, thinning at the top, out past the picture
  const ORBS = 30;
  for (let i = 0; i < ORBS; i++) {
    const t0 = 880 + i * 48 + rand() * 80, x = RIM[0] + (rand() - 0.5) * 70, y = RIM[1] - 2 + (rand() - 0.5) * 8, sz = 3 + rand() * 4.4;
    const rise = 70 + rand() * 80, sway = (rand() - 0.5) * 30, life = 1500 + rand() * 900, ph = rand() * 6;
    const at = (f, sc, o) => ({ transform: `${k.T(sway * f + Math.sin(f * 5 + ph) * 5 * f, -rise * f * (1.2 - 0.2 * f))} scale(${sc})`, opacity: o });
    fx(k.pic('mote', [x, y], sz, sz), [[t0, at(0, 0.3, 0), 'ease-out'], [t0 + 160, at(0.06, 1, 0.95), 'linear'], [t0 + life * 0.5, at(0.5, 1.15, 0.9), 'linear'], [t0 + life * 0.85, at(0.85, 1, 0.55), 'linear'], [t0 + life, at(1, 0.6, 0)]]);
    if (i % 3 === 0) fx(k.pic('spark', [x, y], sz * 2.4, sz * 2.4), [[t0 + 100, at(0.05, 0.2, 0), 'ease-out'], [t0 + 260, at(0.12, 1, 0.8), 'linear'], [t0 + life * 0.6, at(0.6, 0.7, 0.3), 'linear'], [t0 + life * 0.9, at(0.95, 0.3, 0)]]);
  }
  // ── and the water taking them back: sparkles falling into the surface, each rippling it
  for (let i = 0; i < 11; i++) {
    const t0 = 2200 + i * 105 + rand() * 60, x = RIM[0] + (rand() - 0.5) * 66, y = RIM[1] + (rand() - 0.5) * 7, h = 30 + rand() * 28, sz = 2.6 + rand() * 2.2;
    fx(k.pic('mote', [x, y], sz, sz), [[t0, { transform: `${k.T((rand() - 0.5) * 6, -h)} scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 180, { transform: `${k.T((rand() - 0.5) * 4, -h * 0.8)} scale(1)`, opacity: 0.9 }, 'ease-in'], [t0 + 600, { transform: `${k.T(0, 0)} scale(.8)`, opacity: 0.95 }], [t0 + 700, { transform: `${k.T(0, 1)} scale(.3)`, opacity: 0 }]]);
    fx(k.pic(ring, [x, y + 1], 14, 14), [[t0 + 590, { transform: flat(0.2, 0.06), opacity: 0 }, 'ease-out'], [t0 + 680, { transform: flat(0.5, 0.15), opacity: 0.8 }, 'ease-out'], [t0 + 1250, { transform: flat(1.1, 0.33), opacity: 0 }]]);
  }
  // ── a few drops thrown off the swell, falling back over the rim
  for (let i = 0; i < 8; i++) {
    const t0 = IMPACT + 40 + rand() * 160, dir = i % 2 ? 1 : -1, dx = dir * (8 + rand() * 30), up = 12 + rand() * 18, sz = 1.8 + rand() * 1.6, x = RIM[0] + dir * rand() * 34;
    const at = (f, sc, o) => ({ transform: `${k.T(dx * f, -up * 4 * f * (1 - f) + 14 * f * f)} scale(${sc})`, opacity: o });
    fx(k.pic('mote', [x, RIM[1] - 2], sz, sz), [[t0, at(0, 0.5, 0), 'ease-out'], [t0 + 80, at(0.12, 1, 1), 'linear'], [t0 + 350, at(0.5, 1, 0.95), 'linear'], [t0 + 650, at(1, 0.7, 0)]]);
  }
}
