// The Granary: the granary gives up its grain and gathers it in again, the whole evening glowing.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: aura (a relic: the place itself acts; as
// suggested), element: earth (grain, stone, harvest; as suggested). Not aimed: it swells over its
// own picture and spills past its frame.
//   0-300      the door glows brighter, the heap of grain heaves, a breath of wind stirs the wheat.
//   300-1100   grain pours out of the door: seeds of gold tumble down the slope into the three
//              baskets, each jumping as they land; a pulse of warm light runs out over the hill
//              (900, BEATS.release).
//   1100-1800  the baskets glow hot; ribbons of golden motes rise out of them and the door, up the
//              drum and the thatch to the finial: the grain is saved up.
//   1800       (BEATS.impact) at the finial a flare, a ring, a beam of light up the thatch; a great
//              ring of gold rolls out over the hill and the delta, past the frame, the wheat
//              bowing as it passes, the sheaves rustling, the sun and the water glinting.
//   2000-3300  the afterglow: motes drift up and away toward the sun; the lights die down; the
//              wheat settles.
//   3700       at rest as drawn (BEATS.settle); the move ends at END.
export const END = 4400;
export const BEATS = { release: 900, impact: 1800, settle: 3700 };
export const STILLS = [250, 600, 950, 1400, 1800, 2200, 2900, 4000];

export const textures = {
  spark: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 236 + 19 * c * c, 170 + 80 * c * c, Math.min(1, c * c * 2.2)]; }],
  seed: [16, 16, (x, y) => { const r = Math.hypot((x - 0.5) * 1.25, (y - 0.5) * 2) * 2, c = Math.max(0, 1 - r); return [255 - 20 * (1 - c), 205 + 40 * c, 90 + 100 * c, Math.min(1, c * 3)]; }],
  star: [48, 48, (x, y) => { const dx = Math.abs(x - 0.5) * 2, dy = Math.abs(y - 0.5) * 2, c = Math.max(0, 1 - Math.hypot(dx, dy)), cr = Math.max(0, 1 - Math.min(dx * 9 + dy, dy * 9 + dx)), v = Math.min(1, c * c * 1.6 + cr * 0.9); return [255, 244 + 11 * v, 205 + 50 * v, v]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', fix = (n) => n.toFixed(2);
  const S = k.spec, DOOR = S.door, BASK = S.baskets, ROOF = S.roof, SUN = S.sun, HOME = 3700;
  k.css(`.g-gold { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,252,236,.95), rgba(255,226,150,.6) 28%, rgba(255,196,100,.18) 58%, rgba(255,170,70,0) 100%); }
    .fx-copy.f-hot { mix-blend-mode: plus-lighter; filter: brightness(1.6) saturate(1.3) sepia(.25); }`);

  // ── the door and the grain: glowing brighter, heaving as the grain pours, hot at the peak
  act(k.part('doorglow'), [[0, { transform: 'none' }, eio], [300, { transform: 'scale(1.05)' }, eio], [1100, { transform: 'scale(1.02)' }, eio], [1800, { transform: 'scale(1.08)' }, eio], [3000, { transform: 'scale(1.01)' }, eio], [HOME, { transform: 'none' }]]);
  act(k.copy('doorglow', 'f-hot'), [[0, { transform: 'none', opacity: 0 }, eio], [300, { transform: 'scale(1.05)', opacity: 0.35 }, eio], [900, { transform: 'scale(1.03)', opacity: 0.2 }, eio], [1800, { transform: 'scale(1.08)', opacity: 0.9 }, eio], [3000, { transform: 'scale(1.01)', opacity: 0.2 }, eio], [HOME, { transform: 'none', opacity: 0 }]]);
  const heave = [[0, { transform: 'none' }, eio], [260, { transform: 'scale(1.04, 1.12)' }, eio], [420, { transform: 'scale(1.0, 1.04)' }, eio], [600, { transform: 'scale(1.05, 1.13)' }, eio], [800, { transform: 'scale(1.01, 1.05)' }, eio], [1000, { transform: 'scale(1.05, 1.1)' }, eio],
    [1300, { transform: 'scale(1.02, 1.04)' }, eio], [1800, { transform: 'scale(1.06, 1.14)' }, eio], [2300, { transform: 'scale(1.02, 1.05)' }, eio], [3200, { transform: 'none' }]];
  act(k.part('grain'), heave);
  act(k.copy('grain', 'f-hot'), heave.map(([t, f, e]) => [t, { ...f, opacity: t < 200 ? 0 : t < 1100 ? 0.35 : t < 2000 ? 0.85 : t < 3000 ? 0.3 : 0 }, e]));

  // ── the baskets: jumping as the grain lands (300-1100), glowing hot while it is saved
  const bj = [[0, { transform: 'none' }, 'ease-out']];
  for (let t = 520, i = 0; t < 1160; t += 70, i++) bj.push([t, { transform: `translate(${fix((rand() - 0.5) * 0.6)}px, ${fix(-(0.6 + rand() * 0.8) * u)}px) scale(1.01)` }, 'ease-out'], [t + 35, { transform: 'none' }, 'ease-in']);
  bj.push([1800, { transform: 'scale(1.03)' }, eio], [2300, { transform: 'scale(1.01)' }, eio], [HOME, { transform: 'none' }]);
  act(k.part('baskets'), bj);
  act(k.copy('baskets', 'f-hot'), [[0, { transform: 'none', opacity: 0 }, 'ease-out'], [600, { transform: 'none', opacity: 0 }, eio], [1100, { transform: 'scale(1.01)', opacity: 0.5 }, eio], [1800, { transform: 'scale(1.03)', opacity: 0.9 }, eio], [2400, { transform: 'scale(1.01)', opacity: 0.4 }, eio], [3300, { transform: 'none', opacity: 0 }]]);
  // ── the sheaves rustle, the wheat sways, bowing hardest as the great ring rolls over it (about 2000)
  const sway = (amp, ph) => [[0, { transform: 'none' }, eio], [250 + ph, { transform: `rotate(${fix(-amp * 0.5)}deg)` }, eio], [700 + ph, { transform: `rotate(${fix(amp * 0.4)}deg)` }, eio], [1200 + ph, { transform: `rotate(${fix(-amp * 0.6)}deg)` }, eio],
    [1800 + ph, { transform: `rotate(${fix(amp * 1.6)}deg)` }, eio], [2300 + ph, { transform: `rotate(${fix(-amp * 0.8)}deg)` }, eio], [2800 + ph, { transform: `rotate(${fix(amp * 0.3)}deg)` }, eio], [3500, { transform: 'none' }]];
  act(k.part('wheat'), sway(3.4, 100));
  act(k.part('stooks'), sway(1.4, 300));

  // ── warm light over the whole hill, rolling up and fading
  fx(k.lightIn('g-gold', [124, 150], 330, 190), [[150, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(.8)', opacity: 0.5 }, eio], [1800, { transform: 'scale(1)', opacity: 0.8 }, eio], [2800, { transform: 'scale(1.1)', opacity: 0.4 }, eio], [3500, { transform: 'scale(1.2)', opacity: 0 }]]);
  fx(k.lightIn('g-warm', [124, 156], 150, 90), [[100, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [500, { transform: 'scale(1)', opacity: 0.85 }, eio], [1300, { transform: 'scale(.95)', opacity: 0.65 }, eio], [1800, { transform: 'scale(1.1)', opacity: 0.95 }, eio], [3000, { transform: 'scale(1)', opacity: 0.3 }, eio], [3600, { transform: 'scale(.9)', opacity: 0 }]]);
  const ringE = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1"/></filter></defs><ellipse cx="50" cy="14" rx="44" ry="8" fill="none" stroke="#fff0c2" stroke-width="2.2" filter="url(#b)"/><ellipse cx="50" cy="14" rx="38" ry="6.4" fill="none" stroke="#ffe2a0" stroke-width="1" opacity=".6"/>', 100, 28);
  fx(k.picIn(ringE, [124, 158], 100, 28), [[800, { transform: 'scale(.3, .4)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(.6, .7)', opacity: 0.9 }], [1700, { transform: 'scale(3.4, 3)', opacity: 0 }]]);

  // ── the grain pours: seeds from the door, down the slope into the baskets (300-1100)
  for (let i = 0; i < 36; i++) {
    const t0 = 280 + i * 24 + rand() * 20, b = BASK[i % 3], sx = DOOR[0] + (rand() - 0.5) * 9, sy = DOOR[1] - 4 + rand() * 4, tx = b[0] + (rand() - 0.5) * 9, ty = b[1] - 2 + rand() * 3, dur = 300 + rand() * 120, r = 3 + rand() * 2;
    const at = (f, o, s) => ({ transform: `translate(${fix((tx - sx) * f * u)}px, ${fix(((ty - sy) * f - 9 * Math.sin(Math.PI * f) + 14 * f * (1 - f) * 0) * u)}px) scale(${s})`, opacity: o });
    fx(k.picIn('seed', [sx, sy], r, r * 1.3), [[t0, at(0, 0, 0.6), 'linear'], [t0 + 30, at(0.08, 1, 1), 'linear'], [t0 + dur * 0.55, at(0.6, 1, 1), 'linear'], [t0 + dur, at(1, 0.9, 0.9), 'linear'], [t0 + dur + 110, at(1, 0, 0.4)]]);
  }

  // ── the grain saved: ribbons of golden motes from the baskets and the door up to the finial (1000-1850)
  for (let i = 0; i < 30; i++) {
    const from = i % 4 === 3 ? DOOR : BASK[i % 3], sx = from[0] + (rand() - 0.5) * 8, sy = from[1] - 2, t0 = 1000 + i * 28 + rand() * 30, dur = 700 + rand() * 200;
    const sw = (rand() < 0.5 ? -1 : 1) * (10 + rand() * 12), r = 4 + rand() * 4, dx = ROOF[0] - sx, dy = ROOF[1] - sy;
    const at = (f, o, s) => ({ transform: `translate(${fix((dx * f + sw * Math.sin(f * Math.PI * 1.2) * (1 - f)) * u)}px, ${fix(dy * Math.pow(f, 0.8) * u)}px) scale(${s})`, opacity: o });
    fx(k.picIn(i % 3 ? 'spark' : 'star', [sx, sy], r, r), [[t0, at(0, 0, 0.4), 'ease-out'], [t0 + 90, at(0.06, 0.95, 1), 'linear'], [t0 + dur * 0.6, at(0.6, 0.9, 1), 'linear'], [t0 + dur, at(1, 0.8, 0.9), 'ease-out'], [t0 + dur + 120, at(1, 0, 0.3)]]);
  }

  // ── the peak (BEATS.impact): the finial flares, a beam up the thatch, the great ring over hill and delta
  fx(k.light('g-gold', ROOF, 80), [[1650, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1830, { transform: 'scale(1.1)', opacity: 0.95 }], [2300, { transform: 'scale(.95)', opacity: 0.6 }, eio], [3100, { transform: 'scale(1.1)', opacity: 0 }]]);
  fx(k.pic('star', ROOF, 52, 52), [[1680, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [1810, { transform: 'scale(1.2) rotate(25deg)', opacity: 1 }], [2350, { transform: 'scale(.6) rotate(70deg)', opacity: 0 }]]);
  fx(k.lightIn('g-gold', [124, 78], 46, 130), [[1650, { transform: 'scale(.4, .5)', opacity: 0 }, 'ease-out'], [1850, { transform: 'scale(1, 1)', opacity: 0.7 }], [2500, { transform: 'scale(.9, 1.05)', opacity: 0 }]]);
  fx(k.lightIn('g-gold', [136, 108], 18, 18), [[1650, { transform: 'scale(.4)', opacity: 0 }], [1850, { transform: 'scale(1.2)', opacity: 0.95 }, eio], [2800, { transform: 'scale(1)', opacity: 0 }]]);
  const ringG = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1"/></filter></defs><circle cx="40" cy="40" r="34" fill="none" stroke="#fff0c2" stroke-width="2.4" filter="url(#b)"/>', 80, 80);
  fx(k.pic(ringG, ROOF, 60, 60), [[1700, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [1800, { transform: 'scale(.5)', opacity: 0.95 }], [2300, { transform: 'scale(1.5)', opacity: 0 }]]);
  // the great ring, rolling out from the heart of the granary past the picture's frame
  const [GX, GY] = [124, 120];
  fx(k.pic(ringG, [GX, GY], 80, 80, { low: true }), [[1780, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1900, { transform: 'scale(.8)', opacity: 0.8 }], [2900, { transform: 'scale(6)', opacity: 0 }]]);
  fx(k.pic(ringG, [GX, GY], 80, 80, { low: true }), [[1980, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [2080, { transform: 'scale(.8)', opacity: 0.5 }], [3100, { transform: 'scale(5)', opacity: 0 }]]);
  fx(k.light('g-gold', [GX, GY + 20], 340), [[1760, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1950, { transform: 'scale(.8)', opacity: 0.6 }], [2800, { transform: 'scale(1.2)', opacity: 0 }]]);
  // ── the sun and the water answer, a moment after the ring passes
  fx(k.lightIn('g-gold', SUN, 70, 70), [[2000, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [2350, { transform: 'scale(1.2)', opacity: 0.9 }, eio], [3200, { transform: 'scale(1)', opacity: 0 }]]);
  fx(k.picIn('star', SUN, 40, 40), [[2050, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [2350, { transform: 'scale(1.1) rotate(30deg)', opacity: 0.9 }], [3000, { transform: 'scale(.5) rotate(60deg)', opacity: 0 }]]);
  for (let i = 0; i < 12; i++) {
    const x = 180 + rand() * 110, y = 118 + (x - 180) * 0.12 + rand() * 40, t0 = 2000 + ((x - 150) / 150) * 400 + rand() * 300, r = 6 + rand() * 6;
    fx(k.picIn('star', [x, y], r, r), [[t0, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [t0 + 160, { transform: 'scale(1)', opacity: 0.95 }], [t0 + 480, { transform: 'scale(.3)', opacity: 0 }]]);
  }
  // ── the afterglow: motes drifting up from the hill and away toward the sun
  for (let i = 0; i < 24; i++) {
    const x = 70 + rand() * 120, y = 120 + rand() * 50, t0 = 1900 + i * 40 + rand() * 40, dur = 800 + rand() * 500, r = 3 + rand() * 3.5, a = rand();
    const rise = (f, o, s) => ({ transform: `translate(${fix((18 + a * 40) * f * u)}px, ${fix((-30 - a * 40) * f * u - Math.sin(f * 6) * 2 * u)}px) scale(${s})`, opacity: o });
    fx(k.picIn(i % 3 ? 'spark' : 'seed', [x, y], r, r), [[t0, rise(0, 0, 0.4), 'ease-out'], [t0 + 200, rise(0.12, 0.95, 1), 'linear'], [t0 + dur * 0.7, rise(0.7, 0.6, 0.8), 'linear'], [t0 + dur, rise(1, 0, 0.4)]]);
  }
}
