// Ymra, Heart of the Mountain: she plants herself and takes the blows like a mountain.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: defender, element: earth.
//   100-520   she braces (BEATS.release 450): the stone grinds, dust puffs at her hands; both
//             arms press down into the slopes, her head lowers, the fire in her chest
//             climbs (veins flare, the heart swells, her eyes catch), the lava at her feet glows.
//   1000, 1650, 2300 (alone; else k.blows)  a hurled boulder comes at her (from the left
//             over her forearm, then her chest, then the right) and strikes (BEATS.impact:
//             the first). At each blow: the nearest arm is driven down and rebounds, the
//             woods on her shoulders shiver and shed needles, her head rocks, the fire
//             surges (a hot copy of the veins and heart), a flash at the guard, sparks, stone
//             chips and dust fly, a crack of molten light opens in the stone; the tremor runs
//             down to the lava at her feet. Each blow a little stronger.
//   last+550  she heaves herself up: head back, the whole heart flares and a ring of gold
//             goes out across her; embers rise off her shoulders; the cracks heal.
//   3700      at rest as drawn (the move ends at END).
//
// The contract (bakeoff/recipe.md): blows come as k.blows || her own three boulders; each
// is taken at its time `at`, on the nearest of her `guard` points. A boulder is drawn only
// when she plays alone. Every moving part is one sampled list (every 40 ms), the sum of
// every blow's damped shake.
export const END = 4200;
export const BEATS = { release: 450, impact: 1000, settle: 3700 };
export const STILLS = [350, 900, 1020, 1120, 1700, 2350, 3000, 3800];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 190 + 65 * c * c, 90 + 150 * c * c, Math.min(1, c * c * 2.4)]; }],
  dust: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, n = 0.7 + 0.3 * Math.sin(x * 15 + y * 9) * Math.cos(y * 12 - x * 6); return [150, 112, 86, Math.max(0, 1 - r) * 0.75 * n]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out', sm = k.smooth, D2R = Math.PI / 180;
  const S = k.spec, G = S.guard, H = S.heart, SH = S.shoulders, NECK = S.neck;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const alone = !k.blows;
  const own = [{ at: 1000, to: G[0] }, { at: 1650, to: G[2] }, { at: 2300, to: G[1] }];
  const near = (to) => G.reduce((b, g) => (Math.hypot(g[0] - to[0], g[1] - to[1]) < Math.hypot(b[0] - to[0], b[1] - to[1]) ? g : b), G[0]);
  const B = (k.blows || own).slice().sort((a, b) => a.at - b.at).map((b, i) => ({ t: clamp(b.at, 300, 2600), g: near(b.to), s: 1 + 0.14 * i }));
  const last = B.at(-1).t, holdTo = Math.min(last + 600, 2900), relaxTo = 3560;

  k.css(`.fx-copy.f-hot { mix-blend-mode: plus-lighter; filter: brightness(1.6) saturate(1.3) hue-rotate(-6deg); }`);
  const chip = k.svg('<path d="M1,6 L4,0.6 L9,1.4 L11,5 L7,8.6 L2.4,8Z" fill="#2a1a12" stroke="#ffb060" stroke-width=".9" stroke-linejoin="round"/>', 12, 9.4);
  const crack = k.svg('<path d="M1,9 L7,6 L11,10 L17,5 L20,8 L27,3 M11,10 L13,16 M17,5 L18,0" fill="none" stroke="#ff9a3a" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><path d="M1,9 L7,6 L11,10 L17,5 L20,8 L27,3" fill="none" stroke="#ffe8a8" stroke-width=".8" stroke-linejoin="round"/>', 28, 18);
  const needle = k.svg('<path d="M0,1 L9,0 L0,2Z" fill="#3a5a1c"/>', 9, 2);
  const ring = k.svg('<circle cx="30" cy="30" r="27" fill="none" stroke="#ffc86a" stroke-width="2.6"/><circle cx="30" cy="30" r="27" fill="none" stroke="#fff2c0" stroke-width=".9"/>', 60, 60);
  const rock = k.svg('<defs><radialGradient id="h"><stop offset="0" stop-color="#ffb060" stop-opacity=".9"/><stop offset="1" stop-color="#ff7020" stop-opacity="0"/></radialGradient></defs><circle cx="9" cy="7" r="9" fill="url(#h)"/><path d="M2,8 L5,2 L11,0.6 L16,3.4 L17,9 L13,13 L6,13Z" fill="#3a261a" stroke="#ff9a4a" stroke-width="1.1" stroke-linejoin="round"/><path d="M6,4 L11,3 L13,7" fill="none" stroke="#7a5a44" stroke-width=".8"/>', 18, 14);

  // ── her state at ms t: the brace (0..1), each blow's damped shake and flash
  const brace = (t) => sm(clamp((t - 100) / 420, 0, 1)) * (1 - sm(clamp((t - holdTo) / (relaxTo - holdTo), 0, 1)));
  const shake = (tau) => (tau <= 0 ? 0 : (Math.exp(-tau / 160) * Math.sin((2 * Math.PI * tau) / 270)) / 0.66);
  const flash = (tau) => (tau < -15 ? 0 : tau < 0 ? 1 + tau / 15 : Math.exp(-tau / 260));
  const heave = (t) => { const a = Math.min(last + 550, 2850); return sm(clamp((t - a) / 380, 0, 1)) * (1 - sm(clamp((t - a - 380) / 700, 0, 1))); };
  const dist = (g, p) => Math.hypot(g[0] - p[0], g[1] - p[1]);
  const weight = (b, p, r = 80) => b.s / (1 + dist(b.g, p) / r);
  const hitAt = (t, p, r = 90, lag = 0) => Math.max(0, ...B.map((b) => flash(t - b.t - lag) * weight(b, p, r)));
  const shakeAt = (t, p, r = 80, lag = 0) => B.reduce((a, b) => a + shake(t - b.t - lag) * weight(b, p, r), 0);

  const grid = []; for (let t = 0; t <= 3560; t += 40) grid.push(t);
  const sample = (fn, last0 = {}) => [...grid.map((t) => [t, fn(t), 'linear']), [3700, { transform: 'none', ...last0 }]];

  // ── her arms (with the woods on them): pressed down at the brace, driven down and rebounding at each blow
  [['armL', 'treesL', -1, SH[0]], ['armR', 'treesR', 1, SH[1]]].forEach(([arm, trees, dir, sh]) => {
    const ang = (t) => dir * (3.4 * brace(t) + 5 * shakeAt(t, [sh[0] + dir * 30, sh[1] + 32], 70) - 1.4 * heave(t));
    act(k.part(arm), sample((t) => ({ transform: `rotate(${ang(t).toFixed(2)}deg)` })));
    act(k.part(trees), sample((t) => ({ transform: `rotate(${(ang(t) + dir * 1.5 * shakeAt(t, sh, 90, 30)).toFixed(2)}deg)` })));
  });
  // the woods on her shoulders shiver
  [['pinesL', [108, 92]], ['pinesR', [192, 92]]].forEach(([nm, p]) => act(k.part(nm), sample((t) => ({ transform: `rotate(${(2.4 * shakeAt(t, p, 110, 20) + 0.5 * Math.sin(t / 55) * hitAt(t, p, 110)).toFixed(2)}deg)` }))));
  // her head and face and eyes, one pose: lowered at the brace, rocking at each blow, thrown back at the heave
  const headTf = (t) => {
    const th = 1.3 * brace(t) + B.reduce((a, b) => a + shake(t - b.t - 40) * b.s * 0.9 * (b.g[0] < 150 ? 1 : -1) * (b.g[1] < 110 ? 0.6 : 1), 0) - 3 * heave(t);
    return { transform: `${k.T(0, 0.9 * brace(t) - 1.2 * heave(t))} rotate(${th.toFixed(2)}deg)` };
  };
  for (const nm of ['head', 'face', 'eyes']) act(k.part(nm), sample(headTf));
  // the fire in her chest swells and surges, a hot copy over it
  const coreTf = (t, a) => `scale(${(1 + a * 0.05 * brace(t) + a * 0.14 * hitAt(t, H, 140) + a * 0.1 * heave(t)).toFixed(3)})`;
  const coreHot = (t) => clamp(0.35 * brace(t) + 0.9 * hitAt(t, H, 150) + 0.7 * heave(t), 0, 1);
  for (const [nm, a] of [['veins', 1], ['heart', 1.8]]) {
    act(k.part(nm), sample((t) => ({ transform: coreTf(t, a) })));
    act(k.copy(nm, 'f-hot'), sample((t) => ({ transform: coreTf(t, a), opacity: +coreHot(t).toFixed(2) }), { opacity: 0 }));
  }
  act(k.copy('eyes', 'f-hot'), sample((t) => ({ ...headTf(t), opacity: +clamp(0.5 * brace(t) + 0.7 * hitAt(t, H, 150) + 0.6 * heave(t), 0, 1).toFixed(2) }), { opacity: 0 }));

  // ── light: the heart climbing, beating with each blow; the lava at her feet answering
  const heartL = [];
  for (const t of grid) heartL.push([t, { transform: `scale(${(0.9 + 0.2 * brace(t) + 0.25 * hitAt(t, H, 150) + 0.4 * heave(t)).toFixed(2)})`, opacity: +clamp(0.05 + 0.2 * brace(t) + 0.3 * hitAt(t, H, 150) + 0.3 * heave(t), 0, 0.75).toFixed(2) }, 'linear']);
  heartL.push([3700, { transform: 'scale(.9)', opacity: 0 }]);
  fx(k.light('g-warm', H, 64), heartL);
  [[108, 188], [192, 188]].forEach(([x, y], i) => {
    const l = [];
    for (const t of grid) l.push([t, { transform: `scale(${(0.7 + 0.5 * brace(t)).toFixed(2)})`, opacity: +clamp(0.55 * brace(t) + 0.8 * hitAt(t, [x, y], 220, 90 + i * 20) + 0.5 * heave(t), 0, 1).toFixed(2) }, 'linear']);
    l.push([3700, { transform: 'scale(.7)', opacity: 0 }]);
    fx(k.lightIn('g-warm', [x, y], 64, 26), l);
  });
  // dust puffs at her hands at the brace
  [[64, 166], [236, 166], [96, 176], [204, 176]].forEach(([x, y], i) => {
    const t = 140 + i * 70, r = Math.round(rand() * 360);
    fx(k.picIn('dust', [x, y], 18, 12, { lit: false }), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 150, { transform: `${k.T((x < 150 ? -3 : 3), -3)} rotate(${r + 15}deg) scale(.9)`, opacity: 0.6 }], [t + 700, { transform: `${k.T((x < 150 ? -9 : 9), -9)} rotate(${r + 40}deg) scale(1.5)`, opacity: 0 }]]);
  });

  // ── a boulder comes at her (only when she plays alone), and each blow's effects
  const PINES = [[90, 100], [104, 90], [120, 88], [180, 88], [196, 90], [210, 100], [66, 122], [234, 122]];
  B.forEach((b, bi) => {
    const [gx, gy] = b.g, t = b.t, s = b.s, ox = gx < 150 ? -1 : 1, away = (() => { const dx = gx - H[0], dy = gy - H[1], n = Math.hypot(dx, dy) || 1; return [dx / n, dy / n]; })();
    // the boulder, from out beyond the picture along a flat arc
    if (alone) {
      const st = [gx + (gy === H[1] ? -1 : ox) * 140, gy - 80], C = [(st[0] + gx) / 2, st[1] - 10], pts = [];
      for (let i = 0; i <= 7; i++) { const q = i / 7, w = 1 - q; pts.push([w * w * st[0] + 2 * w * q * C[0] + q * q * gx, w * w * st[1] + 2 * w * q * C[1] + q * q * gy]); }
      const [x0, y0] = k.P(gx, gy), tf = (p, j) => { const [x, y] = k.P(...p); return `translate(${(x - x0).toFixed(1)}px, ${(y - y0).toFixed(1)}px) rotate(${j * 90}deg)`; };
      fx(k.pic(rock, [gx, gy], 26, 20), [[t - 360, { transform: `${tf(pts[0], 0)} scale(.8)`, opacity: 0 }, 'ease-out'], ...pts.map((p, j) => [t - 340 + (j / 7) * 340, { transform: `${tf(p, j)} scale(1)`, opacity: 1 }, 'linear']), [t + 30, { transform: `${tf(pts[7], 8)} scale(.4)`, opacity: 0 }]]);
    }
    // flash at the guard and a crack of molten light that closes again
    fx(k.light('g-warm', b.g, 64 * s), [[t - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 50, { transform: 'scale(1.15)', opacity: 1 }, eio], [t + 300, { transform: 'scale(.9)', opacity: 0.35 }, eio], [t + 620, { transform: 'scale(.6)', opacity: 0 }]]);
    const rr = Math.round(away[0] * 40 + (rand() - 0.5) * 50);
    fx(k.pic(crack, [gx + away[0] * 4, gy + away[1] * 4], 20 * s, 12.9 * s), [[t - 10, { transform: `rotate(${rr}deg) scale(.2)`, opacity: 0 }, 'ease-out'], [t + 130, { transform: `rotate(${rr}deg) scale(1)`, opacity: 1 }, eio], [last + 800, { transform: `rotate(${rr}deg) scale(1)`, opacity: 0.85 }, eio], [3350, { transform: `rotate(${rr}deg) scale(.9)`, opacity: 0 }]]);
    // sparks, chips and dust, flung out from the guard
    for (let i = 0; i < 9; i++) {
      const a = Math.atan2(away[1], away[0]) + (rand() - 0.5) * 2.2, d = 18 + rand() * 32, up = 8 + rand() * 14, t0 = t + rand() * 40, sz = 5 + rand() * 4;
      const at = (q) => `translate(${(Math.cos(a) * d * q * u).toFixed(1)}px, ${((Math.sin(a) * d * q * 0.8 - up * Math.sin(q * 2.4) + 20 * q * q) * u).toFixed(1)}px)`;
      fx(k.pic('spark', b.g, sz, sz), [[t0, { transform: `${at(0)} scale(.5)`, opacity: 0 }, 'ease-out'], [t0 + 60, { transform: `${at(0.25)} scale(1)`, opacity: 1 }, 'linear'], [t0 + 280, { transform: `${at(0.7)} scale(.7)`, opacity: 0.8 }, 'linear'], [t0 + 560, { transform: `${at(1)} scale(.3)`, opacity: 0 }]]);
    }
    for (let i = 0; i < 6; i++) {
      const a = Math.atan2(away[1], away[0]) + (rand() - 0.5) * 2.6, d = 14 + rand() * 24, up = 12 + rand() * 12, t0 = t + 10 + rand() * 50, r = rand() * 360, sp = (rand() - 0.5) * 700, sz = 6 + rand() * 5;
      const at = (q) => `translate(${(Math.cos(a) * d * q * u).toFixed(1)}px, ${((Math.sin(a) * d * q * 0.7 - up * Math.sin(q * 2.2) + 34 * q * q) * u).toFixed(1)}px) rotate(${(r + sp * q).toFixed(0)}deg)`;
      fx(k.pic(chip, b.g, sz, sz * 0.78, { lit: false }), [[t0, { transform: `${at(0)} scale(.5)`, opacity: 0 }, 'ease-out'], [t0 + 50, { transform: `${at(0.15)} scale(1)`, opacity: 1 }, 'linear'], [t0 + 420, { transform: `${at(0.8)} scale(1)`, opacity: 1 }, 'linear'], [t0 + 640, { transform: `${at(1)} scale(.9)`, opacity: 0 }]]);
    }
    for (let i = 0; i < 3; i++) {
      const t0 = t + 20 + i * 60, r = Math.round(rand() * 360), sc = 0.9 + rand() * 0.5;
      fx(k.pic('dust', [gx + (rand() - 0.5) * 10, gy + 3], 22, 18, { lit: false }), [[t0, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 160, { transform: `${k.T(away[0] * 5, -4)} rotate(${r + 15}deg) scale(${sc.toFixed(2)})`, opacity: 0.65 }], [t0 + 1000, { transform: `${k.T(away[0] * 12, -16)} rotate(${r + 40}deg) scale(${(sc * 1.9).toFixed(2)})`, opacity: 0 }]]);
    }
    // needles shaken off the nearest trees
    PINES.slice().sort((p, q) => dist(b.g, p) - dist(b.g, q)).slice(0, 3).forEach(([px, py], j) => {
      for (let i = 0; i < 2; i++) {
        const t0 = t + 50 + j * 40 + i * 70, dx = (rand() - 0.5) * 16, r = Math.round(rand() * 360);
        const at = (q) => `translate(${(dx * q + 3 * Math.sin(q * 6)).toFixed(1) * u}px, ${(26 * q * u).toFixed(1)}px) rotate(${(r + 200 * q).toFixed(0)}deg)`;
        fx(k.picIn(needle, [px + (rand() - 0.5) * 8, py - 4], 7, 1.6, { lit: false }), [[t0, { transform: `${at(0)} scale(.6)`, opacity: 0 }, 'ease-out'], [t0 + 80, { transform: `${at(0.1)} scale(1)`, opacity: 0.95 }, 'linear'], [t0 + 700, { transform: `${at(1)} scale(1)`, opacity: 0 }]]);
      }
    });
  });

  // ── the heave after the last blow: the heart flares, a ring of gold crosses her, embers rise off her shoulders
  const HV = Math.min(last + 550, 2850);
  fx(k.pic(ring, H, 120, 120), [[HV + 100, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [HV + 180, { transform: 'scale(.3)', opacity: 0.9 }, 'ease-out'], [HV + 800, { transform: 'scale(1.9)', opacity: 0 }]]);
  for (let i = 0; i < 12; i++) {
    const x = 70 + rand() * 160, y = 96 + (Math.abs(x - 150) < 40 ? -10 : rand() * 20), t0 = HV + 60 + rand() * 250, sz = 4 + rand() * 3.4, dx = (rand() - 0.5) * 20, rise = 30 + rand() * 40;
    fx(k.pic('spark', [x, y], sz, sz), [[t0, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 120, { transform: `${k.T(dx * 0.2, -rise * 0.2)} scale(1)`, opacity: 1 }, 'linear'], [t0 + 500, { transform: `${k.T(dx * 0.7, -rise * 0.7)} scale(.8)`, opacity: 0.7 }, 'linear'], [t0 + 900, { transform: `${k.T(dx, -rise)} scale(.3)`, opacity: 0 }]]);
  }
}
