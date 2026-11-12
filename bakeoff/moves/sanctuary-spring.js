// Sanctuary Spring: the spring wells up and the grotto heals, the stag lifts his head from the water, whole.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: aura (a field: the place
// itself acts), element: water. Not aimed.
//   0-700     the hush: the stag sips (a small dip of his head); light gathers on the
//             water where he drinks and at the far spring, first rings stir.
//   700-1300  he feels it and lifts his head (a dip, then up, overshooting a little).
//   900       THE WELLING (BEATS.release): the spring surges: rings roll out from both
//             springs across the pool, a column of gold rises from the water to the
//             grotto's mouth, which flares; droplets leap off the pool and hang in light.
//   1500      THE HEALING (BEATS.impact): a great ring runs out over the whole pool and
//             past the frame; the light reaches the stag: the wound on his shoulder
//             flares and a ring of gold spreads over him, motes lift off his back; the
//             light dancing on the cave's walls leaps up and the walls glow.
//   1650-2100 he shakes the water from his muzzle (droplets fly, fall, splash rings).
//   2300-3700 the surge dies down: rings widen and fade, the column and walls dim, he
//             lowers his head to the water to drink again.
//   3700      at rest as drawn (the move ends at END).
export const END = 4200;
export const BEATS = { release: 900, impact: 1500, settle: 3700 };
export const STILLS = [350, 800, 1100, 1450, 1700, 2100, 2900, 3900];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 240 + 15 * c, 190 + 65 * c * c, Math.min(1, c * c * 2.2)]; }],
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 246, 214, Math.min(1, c * c * 1.5)]; }],
};

export function build(k) {
  const { act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  // (keyframes must rise strictly: nudge any that touch)
  const fx = (el, list) => { let last = -1; k.fx(el, list.slice().sort((a, b) => a[0] - b[0]).map((e) => { last = Math.max(last + 1, Math.min(e[0], k.END - 1)); return [last, ...e.slice(1)]; })); };
  const S = k.spec, D = S.drink, P2 = S.pool2, W = S.wound, M = S.mouth, SH = S.shoulder, IMPACT = 1500;
  k.css(`.g-spr { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,252,236,.95), rgba(255,236,170,.55) 30%, rgba(255,214,120,.16) 60%, rgba(255,200,100,0) 100%); }`);

  // ── the stag: sips, feels it, lifts his head, shakes the water off, and lowers it to drink again
  const head = k.part('head');
  act(head, [[0, { transform: 'none' }, eio], [260, { transform: 'rotate(-3deg)' }, eio], [680, { transform: 'rotate(-3.5deg)' }, 'ease-in'], [1000, { transform: 'rotate(14deg)' }, 'ease-out'],
    [1300, { transform: 'rotate(40deg)' }, eio], [1460, { transform: 'rotate(35deg)' }, eio], [1650, { transform: 'rotate(38deg)' }, eio], [1760, { transform: 'rotate(30deg)' }, eio],
    [1870, { transform: 'rotate(38deg)' }, eio], [1980, { transform: 'rotate(32deg)' }, eio], [2100, { transform: 'rotate(36deg)' }, eio], [2500, { transform: 'rotate(34deg)' }, eio],
    [3150, { transform: 'rotate(10deg)' }, 'ease-in'], [3500, { transform: 'rotate(-2.5deg)' }, 'ease-out'], [3700, { transform: 'none' }]]);

  // ── the hush: light gathers on the water at both springs, first rings stir
  fx(k.lightIn('g-spr', D, 60, 26), [[250, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(1)', opacity: 0.7 }, eio], [1500, { transform: 'scale(1.5)', opacity: 0.9 }, eio], [2600, { transform: 'scale(1.1)', opacity: 0.4 }, eio], [3500, { transform: 'scale(.7)', opacity: 0 }]]);
  fx(k.lightIn('g-spr', P2, 80, 34), [[300, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(1)', opacity: 0.8 }, eio], [1400, { transform: 'scale(1.4)', opacity: 0.95 }, eio], [2600, { transform: 'scale(1.1)', opacity: 0.45 }, eio], [3500, { transform: 'scale(.7)', opacity: 0 }]]);

  // ── rings rolling out over the pool: a stroked ellipse, widening and fading
  const ringImg = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".7"/></filter></defs><ellipse cx="50" cy="12" rx="47" ry="9.6" fill="none" stroke="#fff6d8" stroke-width="1.8" filter="url(#b)"/>', 100, 24);
  const ringImgB = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1.1"/></filter></defs><ellipse cx="50" cy="12" rx="47" ry="9.6" fill="none" stroke="#ffeab0" stroke-width="3.2" filter="url(#b)"/>', 100, 24);
  const ring = (c, t, wEnd, o, img = ringImg, over = false) => {
    const w0 = 18, make = over ? k.pic : k.picIn;
    fx(make(img, c, w0, w0 * 0.24), [[t, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [t + 90, { transform: 'scale(.4)', opacity: o }, 'ease-out'], [t + 1100, { transform: `scale(${(wEnd / w0).toFixed(2)})`, opacity: 0 }]]);
  };
  ring(P2, 520, 70, 0.8); ring(D, 640, 52, 0.8);
  ring(P2, 930, 130, 0.95); ring(D, 1010, 100, 0.95); ring(P2, 1160, 96, 0.7); ring(D, 1260, 70, 0.7);
  // 1500: the great ring, over the whole pool and past the frame
  ring([150, 168], IMPACT - 80, 420, 1, ringImgB, true);
  ring([150, 168], IMPACT + 150, 330, 0.7, ringImg, true);
  // ripples as the stag lowers to drink again
  ring(D, 3150, 54, 0.6); ring(P2, 3000, 60, 0.5); ring(D, 3330, 40, 0.5);

  // ── the column of gold rising off the pool to the grotto's mouth, and the mouth flaring
  const col = k.svg('<defs><linearGradient id="g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff6d8" stop-opacity=".9"/><stop offset=".55" stop-color="#ffeab0" stop-opacity=".35"/><stop offset="1" stop-color="#ffe2a0" stop-opacity="0"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation="3"/></filter></defs>' +
    '<g filter="url(#b)" fill="url(#g)"><path d="M18,160L26,10L54,10L62,160Z"/></g>', 80, 170);
  const cl = [[880, { transform: 'scale(.35, .3)', opacity: 0 }, 'ease-out'], [1150, { transform: 'scale(1, 1)', opacity: 0.85 }, eio]];
  for (let t = 1350, i = 0; t < 2700; t += 170, i++) cl.push([t, { transform: `scale(${i % 2 ? 1 : 1.1}, 1)`, opacity: i % 2 ? 0.8 : 0.62 }, eio]);
  cl.push([3500, { transform: 'scale(.6, .9)', opacity: 0 }]);
  const colEl = k.picIn(col, [P2[0] + 30, 164], 80, 170, { base: true });
  fx(colEl, cl);
  fx(k.picIn(col, [D[0] - 4, 168], 60, 150, { base: true }), cl.map(([t, tr, o], i) => [t + 60, i % 2 ? tr : tr, o]));
  fx(k.lightIn('g-spr', M, 220, 150), [[900, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [1300, { transform: 'scale(1)', opacity: 0.8 }, eio], [IMPACT, { transform: 'scale(1.1)', opacity: 0.95 }, eio], [2600, { transform: 'scale(1.05)', opacity: 0.45 }, eio], [3600, { transform: 'scale(.9)', opacity: 0 }]]);

  // ── droplets leaping off the pool and hanging in the light
  for (let i = 0; i < 30; i++) {
    const base = i % 2 ? P2 : D, x = base[0] + (rand() - 0.5) * 50, y = base[1] + (rand() - 0.5) * 12, t = 880 + rand() * 900, s = 2.4 + rand() * 3.2;
    const dx = (rand() - 0.5) * 16, up = 24 + rand() * 40, g = 20 + rand() * 12;
    const P = (f, sc, o) => ({ transform: `${k.T(dx * f, -up * 4 * f * (1 - f) * 1.4 + g * f * f * 0.5 - up * 0.25 * f)} scale(${sc})`, opacity: o });
    fx(k.picIn(i % 3 ? 'spark' : 'mote', [x, y], s, s), [[t, P(0, 0.4, 0), 'ease-out'], [t + 100, P(0.12, 1, 0.95), 'linear'], [t + 700, P(0.7, 0.9, 0.85), 'linear'], [t + 1100, P(1, 0.3, 0)]]);
  }

  // ── the healing reaches the stag (1500): his wound flares, a ring of gold spreads over him, motes lift off his back
  fx(k.light('g-spr', W, 74), [[IMPACT - 120, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMPACT + 40, { transform: 'scale(1.2)', opacity: 1 }, eio], [IMPACT + 400, { transform: 'scale(1.5)', opacity: 0.7 }, eio], [2300, { transform: 'scale(1.7)', opacity: 0.3 }, eio], [3100, { transform: 'scale(1.2)', opacity: 0 }]]);
  fx(k.lightIn('g-spr', [218, 132], 80, 50), [[IMPACT - 80, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IMPACT + 120, { transform: 'scale(1)', opacity: 0.55 }, eio], [2100, { transform: 'scale(1.1)', opacity: 0.35 }, eio], [2900, { transform: 'scale(1)', opacity: 0 }]]);
  const halo = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".8"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#fff3cc" stroke-width="2.6" filter="url(#b)"/>', 60, 60);
  [[IMPACT - 20, 56, 0.95], [IMPACT + 200, 80, 0.7]].forEach(([t, w, o]) => fx(k.picIn(halo, W, 20, 20), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 70, { transform: 'scale(.6)', opacity: o }], [t + 800, { transform: `scale(${(w / 20).toFixed(2)})`, opacity: 0 }]]));
  for (let i = 0; i < 16; i++) {
    const x = 196 + rand() * 50, y = 120 + rand() * 18, t = IMPACT + 40 + rand() * 700, s = 2.4 + rand() * 3, dx = (rand() - 0.5) * 8, dy = -(18 + rand() * 30);
    fx(k.picIn(i % 3 ? 'spark' : 'mote', [x, y], s, s), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 130, { transform: `${k.T(dx * 0.2, dy * 0.2)} scale(1)`, opacity: 0.95 }], [t + 1100, { transform: `${k.T(dx, dy)} scale(.5)`, opacity: 0 }]]);
  }

  // ── the light dancing on the cave's walls leaps up and the walls glow
  [[30, 136, 60], [274, 134, 60], [48, 96, 44], [254, 100, 44]].forEach(([x, y, w], i) => {
    const t = IMPACT - 150 + i * 70, l = [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 300, { transform: 'scale(1)', opacity: 0.8 }, eio]];
    for (let u = t + 550, j = 0; u < 2700; u += 230, j++) l.push([u, { transform: `scale(${j % 2 ? 1 : 1.12})`, opacity: j % 2 ? 0.8 : 0.55 }, eio]);
    l.push([3500, { transform: 'scale(.7)', opacity: 0 }]);
    fx(k.lightIn('g-spr', [x, y], w, w * 0.8), l);
  });

  // ── he shakes the water off his muzzle: droplets fly, fall into the pool, splash rings
  const MUZ = [148, 141];
  for (let i = 0; i < 11; i++) {
    const t = 1650 + i * 45 + rand() * 30, a = Math.PI * (0.9 + 0.25 * rand()) * (i % 2 ? 1 : 0.8), v = 12 + rand() * 20, s = 2 + rand() * 2.4, fall = 160 - MUZ[1] + rand() * 14;
    const dx = Math.cos(a) * v * 2 * (i % 2 ? 1 : -1) * -1, P = (f, sc, o) => ({ transform: `${k.T(dx * f, -10 * f + fall * f * f)} scale(${sc})`, opacity: o });
    fx(k.picIn('spark', MUZ, s, s), [[t, P(0, 0.5, 0), 'ease-out'], [t + 60, P(0.1, 1, 0.95), 'linear'], [t + 420, P(0.8, 0.9, 0.9), 'linear'], [t + 520, P(1, 0.5, 0)]]);
    if (i % 3 === 0) {
      const sx = MUZ[0] + dx, st = t + 500;
      fx(k.picIn(ringImg, [sx, 160], 6, 1.5), [[st, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [st + 40, { transform: 'scale(.7)', opacity: 0.8 }], [st + 520, { transform: 'scale(3)', opacity: 0 }]]);
    }
  }
  // a last sparkle in the air above the springs as the surge dies down
  for (let i = 0; i < 8; i++) {
    const c = i % 2 ? D : P2, x = c[0] + (rand() - 0.5) * 60, y = c[1] - 20 - rand() * 40, t = 2400 + rand() * 900;
    fx(k.picIn('mote', [x, y], 3 + rand() * 2, 3 + rand() * 2), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 200, { transform: 'scale(1)', opacity: 0.7 }], [t + 700, { transform: `${k.T(0, -8)} scale(.4)`, opacity: 0 }]]);
  }
}
