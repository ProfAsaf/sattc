// Dawn's Judgment: the pillar falls.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker (the spell is
// the attack: a pillar of dawn that destroys what charges), element: light.
//   0-780     it gathers: the storm's tear brightens and the two halves of the
//             cloud draw apart; the pillar it already shows swells; the dark
//             knight rears higher, tensing, trembling in the light.
//   780       RELEASE. Alone, the pillar simply drops on him. Aimed, a comet of
//             light flies from the tear (emit) up and over to the top of a new
//             pillar standing over T.
//   880-1000  the pillar DROPS: a thin white thread to the ground, then
//   1000      IMPACT: it flares wide; flash at T, two rings spread along the
//             ground, sparks and a flung ring of light; the ground's cracks
//             light up in turn; the clouds are thrown wider, their torn edges lit.
//             Alone, the dark knight is struck: a white flash of his shape, he
//             arches back, burns out to gloom and sparks and motes rise.
//   1200-2400 the light holds, then narrows and dies; motes drift up; the
//             clouds close again; the knight's shape comes back as drawn.
//   3500      at rest as drawn (the move ends at END).
//
// The contract (bakeoff/recipe.md): emit is the tear; T = k.aim || the knight
// in the road. Everything that flies or lands is on the overlay (k.pic /
// k.light), since T may be on another card.
export const END = 4000;
export const BEATS = { release: 780, impact: 1000, settle: 3500 };
export const STILLS = [300, 780, 930, 1010, 1150, 1700, 2600, 3700];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 226 + 29 * c * c, 150 + 105 * c * c, Math.min(1, c * c * 2.2)]; }],
  // a soft drifting mote of light, paler and fainter
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 240, 190, Math.min(1, c * c * 1.3)]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out';
  const knight = k.part('knight'), cloudL = k.part('cloudL'), cloudR = k.part('cloudR');
  const [ex, ey] = k.spec.emit, alone = !k.aim;
  const T = k.aim || [150, 128];
  const GROUND = alone ? k.spec.ground[1] : T[1] + 14; // where the pillar stands
  const FLOOR = [T[0], GROUND];
  const IMPACT = 1000;

  k.css(`.g-dawn { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,252,236,.95), rgba(255,230,160,.55) 28%, rgba(255,200,110,.16) 58%, rgba(255,180,80,0) 100%); }
    .fx-copy.w-flash { filter: brightness(0) invert(1) drop-shadow(0 0 3px rgba(255,244,210,.95)) drop-shadow(0 0 8px rgba(255,214,130,.8)); }`);

  // ── the pictures of light: a pillar (white core, gold edges, fading at the top), a wider spill, a ring
  const colSvg = (w, h, core) => k.svg(
    `<defs><linearGradient id="h" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffe6a6" stop-opacity="0"/><stop offset=".22" stop-color="#ffe3a0" stop-opacity=".5"/>` +
    `<stop offset="${0.5 - core}" stop-color="#fff6d6" stop-opacity=".95"/><stop offset=".5" stop-color="#fff" stop-opacity="1"/><stop offset="${0.5 + core}" stop-color="#fff6d6" stop-opacity=".95"/>` +
    `<stop offset=".78" stop-color="#ffe3a0" stop-opacity=".5"/><stop offset="1" stop-color="#ffe6a6" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".22" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient>` +
    `<mask id="m"><rect width="${w}" height="${h}" fill="url(#v)"/></mask></defs><rect width="${w}" height="${h}" fill="url(#h)" mask="url(#m)"/>`, w, h);
  const COL_H = 250;
  const core = colSvg(44, COL_H, 0.07), spill = colSvg(110, COL_H, 0.16);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#fff3cc" stroke-width="3" filter="url(#b)"/>', 60, 60);

  // ── the clouds: they draw apart as the light gathers, are thrown wide at the blow, and close again
  const cl = (s, dx, dy, d) => ({ transform: `${k.T(s * dx, dy)} rotate(${(s * d).toFixed(2)}deg)` });
  act(cloudL, [[0, cl(-1, 0, 0, 0), eio], [650, cl(-1, 2.2, -0.8, 1.1), eio], [IMPACT - 20, cl(-1, 2.6, -0.9, 1.3), 'ease-out'], [IMPACT + 120, cl(-1, 7, -2.4, 3.4), eio], [IMPACT + 380, cl(-1, 5.6, -1.9, 2.7), eio], [2400, cl(-1, 5, -1.7, 2.4), eio], [3300, cl(-1, 0, 0, 0)]]);
  act(cloudR, [[0, cl(1, 0, 0, 0), eio], [700, cl(1, 2.2, -0.8, 1.1), eio], [IMPACT - 20, cl(1, 2.6, -0.9, 1.3), 'ease-out'], [IMPACT + 140, cl(1, 7, -2.4, 3.4), eio], [IMPACT + 400, cl(1, 5.6, -1.9, 2.7), eio], [2400, cl(1, 5, -1.7, 2.4), eio], [3350, cl(1, 0, 0, 0)]]);
  // the torn edges, lit
  for (const [x, y, w] of [[96, 26, 72], [204, 28, 72], [150, 10, 90]]) {
    const gl = [[300, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [780, { transform: 'scale(.9)', opacity: 0.7 }, eio], [IMPACT, { transform: 'scale(1)', opacity: 0.8 }, 'ease-out'], [IMPACT + 100, { transform: 'scale(1.5)', opacity: 1 }, eio], [2300, { transform: 'scale(1.2)', opacity: 0.5 }, eio], [3200, { transform: 'scale(.9)', opacity: 0 }]];
    fx(k.lightIn('g-dawn', [x, y], w, w * 0.5), gl);
  }

  // ── the dark knight: rears higher as the light gathers, trembling; alone, he is struck and burns out
  const R = (dx, dy, deg, s = 1) => `${k.T(dx, dy)} rotate(${deg}deg) scale(${s})`;
  const kl = [[0, { transform: 'none', opacity: 1 }, eio], [300, { transform: R(0, -0.4, -1.5, 1.01), opacity: 1 }, eio], [560, { transform: R(0.2, -0.9, -2.8, 1.02), opacity: 1 }, eio]];
  for (let t = 620, i = 0; t < 960; t += 50, i++) kl.push([t, { transform: R(i % 2 ? 0.5 : -0.3, -0.9, -3 + (i % 2 ? 0.5 : -0.4), 1.025), opacity: 1 }, eio]);
  if (alone) {
    kl.push([IMPACT - 8, { transform: R(0, -1, -3.2, 1.03), opacity: 1 }, 'ease-out'], [IMPACT + 50, { transform: R(3.6, -3, 6, 1.05), opacity: 1 }, 'ease-out'],
      [IMPACT + 150, { transform: R(5.5, -4, 8, 1.07), opacity: 0.4 }, 'ease-in'], [IMPACT + 260, { transform: R(6, -5, 8.5, 1.08), opacity: 0 }, 'linear'], [2750, { transform: R(0, 0, 0, 1), opacity: 0 }, 'ease-in-out'], [3450, { transform: 'none', opacity: 1 }]);
  } else {
    // (the spell is not for him: he rears back from the light and settles)
    kl.push([IMPACT, { transform: R(0.2, -0.9, -3.2, 1.025), opacity: 1 }, 'ease-out'], [IMPACT + 140, { transform: R(-1.4, 0.2, -5, 1.03), opacity: 1 }, eio], [1500, { transform: R(-0.8, 0, -3.6, 1.02), opacity: 1 }, eio], [2400, { transform: R(-0.3, 0, -1.2, 1.005), opacity: 1 }, eio], [3300, { transform: 'none', opacity: 1 }]);
  }
  act(knight, kl);
  if (alone) {
    // his shape flares white as the light strikes him
    const flash = k.copy('knight', 'w-flash');
    act(flash, [[0, { transform: 'none', opacity: 0 }], [IMPACT - 8, { transform: R(0, -1, -3.2, 1.03), opacity: 0 }, 'ease-out'], [IMPACT + 12, { transform: R(0.6, -1.4, -2, 1.03), opacity: 1 }, 'ease-out'], [IMPACT + 70, { transform: R(3.6, -3, 6, 1.05), opacity: 1 }, 'ease-in'],
      [IMPACT + 190, { transform: R(5.6, -4, 8, 1.07), opacity: 0.6 }, 'linear'], [IMPACT + 320, { transform: R(6, -5, 8.5, 1.08), opacity: 0 }]]);
  }

  // ── the card's own pillar flares as the light gathers (and stays lit while it strikes, alone)
  const pil = [[250, { transform: 'scale(.85, 1)', opacity: 0 }, 'ease-out'], [780, { transform: 'scale(1.1, 1)', opacity: 0.55 }, eio]];
  if (alone) pil.push([IMPACT + 100, { transform: 'scale(1.25, 1)', opacity: 0.6 }, eio], [2200, { transform: 'scale(1.2, 1)', opacity: 0.4 }, eio], [3000, { transform: 'scale(1, 1)', opacity: 0 }]);
  else pil.push([IMPACT, { transform: 'scale(.9, 1)', opacity: 0.2 }, eio], [1500, { transform: 'scale(.9, 1)', opacity: 0 }]);
  fx(k.picIn(spill, [150, -6], 110, 192, { top: true }), pil);
  // the pool of light where it stands, swelling
  const pool = [[400, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [780, { transform: 'scale(.9)', opacity: 0.6 }, eio]];
  if (alone) pool.push([IMPACT + 80, { transform: 'scale(1.3, 1.3)', opacity: 1 }, eio], [2300, { transform: 'scale(1.1)', opacity: 0.6 }, eio], [3200, { transform: 'scale(.8)', opacity: 0 }]);
  else pool.push([IMPACT, { transform: 'scale(.9)', opacity: 0.3 }, eio], [1500, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.lightIn('g-dawn', k.spec.ground, 190, 40), pool);
  // a flash through the whole picture at the blow
  fx(k.lightIn('g-dawn', [150, 100], 420, 300), alone ? [[IMPACT - 30, { transform: 'scale(.7)', opacity: 0 }, 'ease-out'], [IMPACT + 30, { transform: 'scale(1)', opacity: 0.4 }, eio], [IMPACT + 400, { transform: 'scale(1.1)', opacity: 0 }]]
    : [[780, { transform: 'scale(.7)', opacity: 0 }, 'ease-out'], [830, { transform: 'scale(1)', opacity: 0.35 }, eio], [1150, { transform: 'scale(1.1)', opacity: 0 }]]);
  // gathering at the tear: a star of light that swells, then flares as it lets go
  fx(k.lightIn('g-dawn', k.spec.tear, 56, 56), [[200, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [700, { transform: 'scale(1)', opacity: 0.85 }, eio], [780, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [1000, { transform: 'scale(1.1)', opacity: 0.7 }, eio], [1700, { transform: 'scale(.7)', opacity: 0 }]]);
  // (and sparks gathered in toward it)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + rand() * 0.6, d = 26 + rand() * 12, t = 120 + i * 70 + rand() * 40;
    const [tx, ty] = k.spec.tear, sx = Math.cos(a) * d, sy = Math.sin(a) * d * 0.7;
    fx(k.picIn('spark', [tx + sx, ty + sy], 5, 5), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-in'], [t + 100, { transform: 'scale(1)', opacity: 0.9 }, 'ease-in'], [t + 420, { transform: `${k.T(-sx, -sy)} scale(.5)`, opacity: 0 }]]);
  }

  // ── RELEASE (780): aimed, a comet flies from the tear to the top of the pillar it calls down on T
  const TOP = [T[0], GROUND - COL_H];
  if (!alone) {
    const [X0, Y0] = k.P(ex, ey), C = [(ex + TOP[0]) / 2, Math.min(ey, TOP[1]) - 40];
    const comet = (src, w, tOff, o) => {
      const pts = k.arc([ex, ey], C, [TOP[0], TOP[1] + 30], 6, (t) => Math.pow(t, 1.3));
      fx(k.pic(src, [ex, ey], w, w), pts.map(([x, y], j) => { const [px, py] = k.P(x, y); return [780 + tOff + j * 20, { transform: `translate(${(px - X0).toFixed(1)}px, ${(py - Y0).toFixed(1)}px) scale(${(j === 0 ? 0.5 : 1 - j * 0.07).toFixed(2)})`, opacity: j === 0 ? 0 : o * (j === 6 ? 0.4 : 1) }, 'linear']; }));
    };
    comet('spark', 16, 0, 1); comet('spark', 10, 18, 0.8); comet('spark', 7, 36, 0.6); comet('mote', 12, 60, 0.5);
  }

  // ── the pillar drops (880-1000) onto T, flares wide at the blow, narrows and dies
  const pc = [[880, { transform: 'scale(.12, 0)', opacity: 0 }, 'ease-in'], [IMPACT - 4, { transform: 'scale(.35, 1)', opacity: 1 }, 'ease-out'], [IMPACT + 50, { transform: 'scale(1.2, 1)', opacity: 1 }, eio], [IMPACT + 300, { transform: 'scale(.95, 1)', opacity: 0.9 }, eio], [1500, { transform: 'scale(1.0, 1)', opacity: 0.8 }, eio]];
  for (let t = 1500, i = 0; t < 2100; t += 110, i++) pc.push([t + 110, { transform: `scale(${i % 2 ? 0.92 : 1.06}, 1)`, opacity: i % 2 ? 0.7 : 0.82 }, eio]);
  pc.push([2400, { transform: 'scale(.55, 1)', opacity: 0.45 }, eio], [2800, { transform: 'scale(.2, 1)', opacity: 0 }]);
  fx(k.pic(core, TOP, 44, COL_H, { top: true }), pc);
  fx(k.pic(spill, TOP, 110, COL_H, { top: true }), [[900, { transform: 'scale(.2, 0)', opacity: 0 }, 'ease-in'], [IMPACT, { transform: 'scale(.6, 1)', opacity: 0.8 }, 'ease-out'], [IMPACT + 120, { transform: 'scale(1.1, 1)', opacity: 0.8 }, eio], [1700, { transform: 'scale(1.05, 1)', opacity: 0.55 }, eio], [2600, { transform: 'scale(.6, 1)', opacity: 0 }]]);

  // ── the blow, at T
  const hot = [[IMPACT - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMPACT + 20, { transform: 'scale(1.25)', opacity: 1 }, eio]];
  for (let t = IMPACT + 150, i = 0; t < 1800; t += 130, i++) hot.push([t, { transform: `scale(${i % 2 ? 1.12 : 0.95})`, opacity: i % 2 ? 0.9 : 0.7 }, eio]);
  hot.push([2300, { transform: 'scale(.6)', opacity: 0 }]);
  fx(k.light('g-dawn', T, 96), hot);
  // rings of light run out along the ground
  for (let i = 0; i < 2; i++) {
    const t = IMPACT + i * 130;
    fx(k.pic(ring, FLOOR, 64, 64), [[t, { transform: 'scale(.25, .1)', opacity: 0 }, 'ease-out'], [t + 60, { transform: 'scale(.5, .17)', opacity: 0.95 }], [t + 600, { transform: `scale(${(3.1 - i * 0.5).toFixed(1)}, ${(0.95 - i * 0.15).toFixed(2)})`, opacity: 0 }]]);
  }
  // sparks flung from T, falling; and the flung rim of light
  for (let i = 0; i < 20; i++) {
    const a = (-Math.PI * (0.05 + 0.9 * rand())) - (i % 5 === 0 ? -Math.PI * 0.9 : 0), dist = 22 + rand() * 40, t = IMPACT + rand() * 70, g = 14 + rand() * 12, s = 5 + rand() * 5;
    const at = (f) => ({ x: Math.cos(a) * dist * f, y: Math.sin(a) * dist * f + g * f * f });
    const P = (f, sc, o) => ({ transform: `${k.T(at(f).x, at(f).y)} scale(${sc})`, opacity: o });
    fx(k.pic('spark', T, s, s), [[t, P(0, 0.5, 0), 'ease-out'], [t + 50, P(0.2, 1.1, 1), 'ease-out'], [t + 280, P(0.75, 0.9, 0.9), 'ease-in'], [t + 560 + rand() * 200, P(1, 0.3, 0)]]);
  }
  // motes of light drift up from the place of the blow, and hang
  for (let i = 0; i < 12; i++) {
    const x = (rand() - 0.5) * 36, t = IMPACT + 150 + i * 105 + rand() * 80, s = 4 + rand() * 4;
    fx(k.pic('mote', [T[0] + x, T[1] + 14 - rand() * 10], s, s), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 250, { transform: `${k.T(x * 0.1, -8)} scale(1)`, opacity: 0.9 }, 'ease-out'], [t + 1250, { transform: `${k.T(x * 0.2 + (rand() - 0.5) * 8, -34 - rand() * 14)} scale(.7)`, opacity: 0 }]]);
  }

  // ── only alone: the ground's cracks light in turn, and the dark knight burns to gloom and sparks
  if (alone) {
    const cracks = [[96, 196], [118, 204], [186, 202], [208, 192], [70, 186], [234, 186]];
    cracks.forEach(([x, y], i) => {
      const t = IMPACT + 40 + Math.abs(x - 150) * 1.6;
      fx(k.lightIn('g-dawn', [x, y], 40, 18), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 90, { transform: 'scale(1)', opacity: 0.95 }, eio], [t + 700, { transform: 'scale(1.1)', opacity: 0.6 }, eio], [t + 1700, { transform: 'scale(.8)', opacity: 0 }]]);
    });
    // gloom: the knight comes apart into dark smoke that thins in the light
    for (let i = 0; i < 9; i++) {
      const x = 126 + rand() * 62, y = 80 + rand() * 90, t = IMPACT + 40 + rand() * 160, r = Math.round(rand() * 360);
      fx(k.picIn('gloom', [x, y], 34, 34, { lit: false }), [[t, { transform: `rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 180, { transform: `${k.T((x - 150) * 0.25, -6)} rotate(${r + 20}deg) scale(1)`, opacity: 0.8 }, 'ease-out'], [t + 1100, { transform: `${k.T((x - 150) * 0.6, -36 - rand() * 14)} rotate(${r + 60}deg) scale(1.8)`, opacity: 0 }]]);
    }
    // sparks of him, rising
    for (let i = 0; i < 18; i++) {
      const x = 122 + rand() * 66, y = 64 + rand() * 108, t = IMPACT + 60 + rand() * 260, s = 4 + rand() * 4;
      fx(k.picIn('spark', [x, y], s, s), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 90, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [t + 900 + rand() * 500, { transform: `${k.T((rand() - 0.5) * 16, -(30 + rand() * 40))} scale(.3)`, opacity: 0 }]]);
    }
  }
}
