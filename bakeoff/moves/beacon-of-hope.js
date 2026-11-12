// Beacon of Hope: the tower lights, and a spirit is born.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: aura (a relic: the
// place itself acts), element: light. Not aimed.
//   0-700     the tower wakes from the ground up: its door and two slits light
//             in turn (100, 330, 560); the great flame dips and gathers.
//   800       SWELL (BEATS.release): the flame surges up (a hot copy of it lit
//             over it), flinging embers into the beam; a pulse of light and two
//             rings of light run out over the picture and past its frame.
//   850-1700  the beam surges: a lit wedge of light from the flame out across
//             the card and well past its edge; motes of light stream along it
//             and gather into the spirit, which swells and trembles as it fills.
//   1750      BIRTH (BEATS.impact): the spirit flashes white, bursts in a ring
//             and sparks, rebounds and flutters (wings spread, rising, then
//             a quiver); a new spirit (a copy of it) leaves it...
//   1800-2700 ...and flies off down the sky to the village in the valley, small
//             and fading, where the lit windows flare in turn as it lands.
//   2300-3300 the flame settles, the beam and the lights die down, and the
//             spirit comes back to its fullness.
//   3600      at rest as drawn (the move ends at END).
export const END = 4200;
export const BEATS = { release: 800, impact: 1750, settle: 3600 };
export const STILLS = [350, 800, 1000, 1450, 1760, 2000, 2600, 3900];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 226 + 29 * c * c, 150 + 105 * c * c, Math.min(1, c * c * 2.2)]; }],
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 244, 200, Math.min(1, c * c * 1.4)]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const H = k.spec.heart, SP = k.spec.spirit, WIN = k.spec.windows, VIL = k.spec.village;
  const IMPACT = 1750;

  k.css(`.g-beacon { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,252,236,.95), rgba(255,226,150,.55) 28%, rgba(255,196,100,.16) 58%, rgba(255,170,70,0) 100%); }
    .fx-copy.f-hot { mix-blend-mode: plus-lighter; filter: brightness(1.25) saturate(1.25); }
    .fx-copy.f-white { filter: brightness(0) invert(1) drop-shadow(0 0 3px rgba(255,248,220,.95)) drop-shadow(0 0 9px rgba(255,220,140,.8)); }
    .fx-copy.f-born { mix-blend-mode: plus-lighter; }`);

  // a track: a list of keys [ms, a, b, c, ...] read at any ms by easing between them
  const track = (keys) => (t) => {
    let i = keys.length - 1;
    while (i > 0 && keys[i][0] > t) i--;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const f = b[0] === a[0] ? 0 : sm(Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))));
    return a.slice(1).map((v, j) => v + (b[j + 1] - v) * f);
  };
  const grid = (to) => { const g = []; for (let t = 0; t <= to; t += 30) g.push(t); return g; };

  // ── the great flame: dips and gathers, surges, flickers as it dies down (a hot copy lit over it)
  const fk = [[0, 1, 1, 0], [300, 1.03, 0.9, 0], [700, 0.98, 0.82, -1], [800, 1.1, 1.42, 0], [920, 1.0, 1.3, 2]];
  for (let t = 1020, i = 0; t < 2300; t += 110, i++) { const L = 1.3 - ((t - 920) / 1380) * 0.2, a = 0.1 * (1 - (t - 920) / 1500), s = i % 2 ? 1 : -1; fk.push([t, 1 - s * a * 0.6, L + s * a * 1.2, s * (2 + rand() * 3)]); }
  fk.push([2300, 1.03, 1.1, 0], [3300, 1, 1, 0]);
  const fire = track(fk), fpose = (t) => { const [sx, sy, sk] = fire(t); return `scale(${sx.toFixed(3)}, ${sy.toFixed(3)}) skewX(${sk.toFixed(2)}deg)`; };
  const sampled = (to, fn, rest) => [...grid(to).map((t) => [t, fn(t), 'linear']), [to + 100, rest]];
  act(k.part('fire'), sampled(3300, (t) => ({ transform: fpose(t) }), { transform: 'none' }));
  const hot = track([[0, 0], [790, 0], [830, 0.8], [1100, 0.45], [1800, 0.3], [2800, 0]]);
  act(k.copy('fire', 'f-hot'), sampled(3300, (t) => ({ transform: fpose(t), opacity: +hot(t)[0].toFixed(2) }), { transform: 'none', opacity: 0 }));

  // ── the tower wakes from the ground up: door, then the two slits
  WIN.forEach(([x, y], i) => {
    const t = 100 + i * 230, big = i === 0 ? 1.15 : 1;
    fx(k.lightIn('g-beacon', [x, y], 26 * big, 34 * big), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 160, { transform: 'scale(1)', opacity: 0.95 }, eio], [900, { transform: 'scale(1.1)', opacity: 0.8 }, eio], [1750, { transform: 'scale(1.2)', opacity: 1 }, eio], [2700, { transform: 'scale(1)', opacity: 0.5 }, eio], [3400, { transform: 'scale(.8)', opacity: 0 }]]);
  });
  // a lift of light up the tower's face, from its foot to its head
  fx(k.lightIn('g-beacon', [96, 128], 46, 120), [[150, { transform: 'scale(1, .3)', opacity: 0 }, 'ease-out'], [700, { transform: 'scale(1, .9)', opacity: 0.3 }, eio], [1000, { transform: 'scale(1, 1)', opacity: 0.4 }, eio], [2200, { transform: 'scale(1, 1)', opacity: 0.2 }, eio], [3200, { transform: 'scale(1, .9)', opacity: 0 }]]);

  // ── the surge (800): a pulse of light at the flame and across the picture, two rings, embers into the beam
  const pulse = [[600, { transform: 'scale(.6)', opacity: 0.2 }, 'ease-out'], [800, { transform: 'scale(1.1)', opacity: 1 }, eio]];
  for (let t = 1000, i = 0; t < 2200; t += 130, i++) pulse.push([t, { transform: `scale(${i % 2 ? 1.12 : 0.96})`, opacity: i % 2 ? 0.95 : 0.78 }, eio]);
  pulse.push([2800, { transform: 'scale(.8)', opacity: 0 }]);
  fx(k.lightIn('g-beacon', H, 130, 130), [[300, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], ...pulse]);
  fx(k.light('g-beacon', H, 340, 250), [[790, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [910, { transform: 'scale(1)', opacity: 0.8 }, eio], [1400, { transform: 'scale(1.15)', opacity: 0.5 }, eio], [2500, { transform: 'scale(1.3)', opacity: 0 }]]);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#fff3cc" stroke-width="3" filter="url(#b)"/>', 60, 60);
  [[800, 4.8, 0.9], [960, 3.6, 0.65]].forEach(([t, sc, o]) => fx(k.pic(ring, H, 50, 50), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 60, { transform: 'scale(.6)', opacity: o }], [t + 800, { transform: `scale(${sc})`, opacity: 0 }]]));
  // embers flung up and carried off along the beam
  for (let i = 0; i < 30; i++) {
    const x = 96 + (rand() - 0.5) * 26, y = 24 + rand() * 12, t = 800 + rand() * 520, s = 4 + rand() * 6, dx = 26 + rand() * 80, dy = -22 + rand() * 40;
    const P = (f, sc, o) => ({ transform: `${k.T(dx * f, dy * f - 18 * Math.sin(Math.PI * f * 0.7))} scale(${sc})`, opacity: o });
    fx(k.pic('spark', [x, y], s, s), [[t, P(0, 0.5, 0), 'ease-out'], [t + 70, P(0.08, 1.1, 1), 'linear'], [t + 700, P(0.55, 0.9, 0.9), 'linear'], [t + 1300 + rand() * 500, P(1, 0.3, 0)]]);
  }

  // ── the beam surges (850-1700): a lit wedge from the flame out across the card and past its edge
  const BX = [96, 31], BW = 330, BY = [-62, 132]; // (the box of the wedge: x from the flame to 426, y -62..132)
  const C = [BX[0] + BW / 2, (BY[0] + BY[1]) / 2], bh = BY[1] - BY[0];
  const wedge = k.svg(
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fffbea" stop-opacity=".9"/><stop offset=".4" stop-color="#ffe9b0" stop-opacity=".42"/><stop offset="1" stop-color="#ffe6a6" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".5" stop-color="#fff6d6" stop-opacity=".4"/><stop offset="1" stop-color="#fff3cc" stop-opacity="0"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation="3.5"/></filter></defs>` +
    `<g filter="url(#b)"><path d="M0,${24 - BY[0]}L${BW},${-60 - BY[0]}L${BW},${128 - BY[0]}L0,${38 - BY[0]}Z" fill="url(#g)"/><path d="M0,${29 - BY[0]}L${BW},${2 - BY[0]}L${BW},${66 - BY[0]}L0,${33 - BY[0]}Z" fill="url(#c)"/></g>`, BW, bh);
  const wk = (sx, sy, o) => ({ transform: `${k.T((BX[0] - C[0]) * (1 - sx), (BX[1] - C[1]) * (1 - sy))} scale(${sx}, ${sy})`, opacity: o });
  const wl = [[850, wk(0.12, 0.5, 0), 'ease-out'], [1020, wk(1, 1, 0.95), eio], [1250, wk(1.04, 1.06, 0.8), eio]];
  for (let t = 1400, i = 0; t < 2300; t += 150, i++) wl.push([t, wk(1, i % 2 ? 1.04 : 0.97, i % 2 ? 0.85 : 0.7), eio]);
  wl.push([2900, wk(1.02, 0.9, 0)]);
  fx(k.pic(wedge, C, BW, bh), wl);

  // ── the spirit: motes stream along the beam and gather into it (1250-1750); it swells, flashes at its birth, rebounds, flutters
  for (let i = 0; i < 18; i++) {
    const a = rand() * Math.PI * 2, r = 22 + rand() * 38, ox = -Math.abs(Math.cos(a)) * r * 1.5 - 4, oy = Math.sin(a) * r * 0.8, t1 = 1380 + (i / 18) * 380 + rand() * 40, t0 = t1 - 430 - rand() * 140, s = 4 + rand() * 4;
    fx(k.pic('mote', SP, s, s), [[t0, { transform: `${k.T(ox, oy)} scale(.5)`, opacity: 0 }, 'ease-in'], [t0 + 110, { transform: `${k.T(ox * 0.85, oy * 0.85)} scale(1)`, opacity: 0.95 }, 'ease-in'], [t1, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0.9 }, 'ease-in'], [t1 + 50, { transform: `${k.T(0, 0)} scale(.2)`, opacity: 0 }]]);
  }
  const sk = track([[0, 1, 1, 0, 0, 0, 1], [900, 1, 1, 0, 0, 0, 1], [1100, 1.1, 1.1, 0, 0, -2, 1], [1400, 1.2, 1.2, 0, -1, 2, 1], [1730, 1.38, 1.38, 0, 0, -3, 1], [1775, 0.9, 0.9, 0, 1, 0, 0.9],
    [1900, 1.2, 1.0, 0, -4, -5, 0.7], [2150, 0.95, 1.08, 0, -2, 4, 0.75], [2500, 1.05, 0.98, 0, -1, -2, 0.9], [3100, 1, 1, 0, 0, 0, 1]]);
  const spose = (t, flash = 0) => { const [sx, sy, dx, dy, r, o] = sk(t); return { transform: `${k.T(dx, dy)} rotate(${r.toFixed(2)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`, opacity: +(flash ? o : o).toFixed(2) }; };
  act(k.part('spirit'), sampled(3100, (t) => spose(t), { transform: 'none', opacity: 1 }));
  const wf = track([[0, 0], [1725, 0], [1765, 1], [1900, 0.35], [2100, 0]]);
  act(k.copy('spirit', 'f-white'), sampled(2100, (t) => ({ ...spose(t), opacity: +wf(t)[0].toFixed(2) }), { transform: 'none', opacity: 0 }));
  // the birth: a flash, a ring and sparks at the spirit
  fx(k.light('g-beacon', SP, 96), [[IMPACT - 60, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMPACT + 20, { transform: 'scale(1.2)', opacity: 1 }, eio], [IMPACT + 400, { transform: 'scale(1.5)', opacity: 0.5 }, eio], [2500, { transform: 'scale(1.9)', opacity: 0 }]]);
  fx(k.pic(ring, SP, 30, 30), [[IMPACT, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMPACT + 50, { transform: 'scale(.6)', opacity: 0.95 }], [IMPACT + 700, { transform: 'scale(3.4)', opacity: 0 }]]);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + rand() * 0.4, d = 18 + rand() * 26, t = IMPACT + rand() * 60, s = 4 + rand() * 5;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * d * f, Math.sin(a) * d * f + 6 * f * f)} scale(${sc})`, opacity: o });
    fx(k.pic('spark', SP, s, s), [[t, P(0, 0.5, 0), 'ease-out'], [t + 50, P(0.25, 1.1, 1), 'ease-out'], [t + 300, P(0.8, 0.9, 0.9), 'ease-in'], [t + 620 + rand() * 200, P(1, 0.3, 0)]]);
  }

  // ── a new spirit leaves it (1760) and flies off down the sky to the village (lands 2650), small and fading
  const born = k.copy('spirit', 'f-born');
  const path = k.arc(SP, [262, 74], [226, 176], 10, (t) => sm(t) * 0.7 + t * 0.3);
  const bl = [[1750, { transform: 'scale(.9)', opacity: 0 }, 'ease-out'], [1800, { transform: 'scale(1)', opacity: 0.95 }, 'linear']];
  path.forEach(([x, y], j) => {
    if (j === 0) return;
    const f = j / 10, t = Math.round(1800 + 860 * f), sc = 1 - 0.62 * f + 0.05 * Math.sin(f * 14);
    bl.push([t, { transform: `${k.T(x - SP[0], y - SP[1])} rotate(${(-8 + 16 * Math.sin(f * 9)).toFixed(1)}deg) scale(${sc.toFixed(3)})`, opacity: f < 0.7 ? 0.95 : 0.95 * (1 - (f - 0.7) / 0.3 * 0.8) }, 'linear']);
  });
  bl.push([2760, { transform: `${k.T(path[10][0] - SP[0], path[10][1] - SP[1])} scale(.34)`, opacity: 0 }]);
  act(born, bl);
  // glints shed along its flight
  for (let i = 0; i < 9; i++) {
    const f = (i + 1) / 10, [x, y] = path[i + 1], t = Math.round(1800 + 860 * f);
    fx(k.pic('mote', [x, y], 6, 6), [[t, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t + 90, { transform: 'scale(1)', opacity: 0.9 }], [t + 520, { transform: `${k.T(3, 5)} scale(.3)`, opacity: 0 }]]);
  }
  // where it lands: the valley's lit windows flare in turn
  fx(k.lightIn('g-beacon', [226, 178], 56, 36), [[2600, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [2720, { transform: 'scale(1.1)', opacity: 0.9 }, eio], [3500, { transform: 'scale(1.3)', opacity: 0 }]]);
  VIL.forEach(([x, y], i) => {
    const t = 2560 + i * 90;
    fx(k.lightIn('g-beacon', [x, y], 22, 18), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 120, { transform: 'scale(1)', opacity: 0.95 }, eio], [t + 400, { transform: 'scale(1.1)', opacity: 0.7 }, eio], [3700, { transform: 'scale(.8)', opacity: 0 }]]);
  });
}
