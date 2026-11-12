// Rally: the captain throws her sword up and the gonfalon snaps open; her light
// runs out along the spears to her army, which leaps, cheering, spears flashing.
//
// PLAN (drawing units 300 x 210, ms of the move)
//   role support, element light. The boon is a rallying light.
//   0-900     gather: she dips her sword back and down, the gonfalon sags,
//             the army crouches a hair; light gathers at the sword's tip,
//             pulsing, motes drawn into it.
//   900       RELEASE: the sword thrusts up (overshoots, settles higher), a
//             flash and a ring leave the tip, the gonfalon cracks open like
//             a whip (billows, then flutters); a comet of light runs from
//             the tip to T (alone: the army below; aimed: the target).
//   1300      IMPACT: the light blooms at T, a ring spreads, the army leaps
//             (twice, the second smaller), spear tips flash one after
//             another, motes rise from them.
//   1900-3400 the sword eases back, the banner's flutter dies, the light
//             fades, the crowd settles.
//   3400      at rest as drawn.
// The comet and the bloom at T are on the overlay (T may be on another card);
// the sparkle on the spears is inside the picture.
export const END = 3800;
export const BEATS = { release: 900, impact: 1300, settle: 3400 };
export const STILLS = [450, 850, 1000, 1300, 1600, 2000, 2800, 3600];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 236 + 19 * c, 170 + 80 * c * c, Math.min(1, c * c * 2.6)]; }],
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 244, 200, Math.min(1, c * 1.4) * c]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out';
  const banner = k.part('banner'), sword = k.part('sword'), army = k.part('army');
  const E = k.spec.emit;
  const T = k.aim || k.spec.crowd;
  const F1 = (n) => n.toFixed(1);
  k.css('.g-rally { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,250,226,.95), rgba(255,226,140,.55) 30%, rgba(255,196,90,.18) 60%, rgba(255,180,70,0) 100%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#fff0b8" stroke-width="5" filter="url(#b)"/>', 100, 100);
  const star = k.svg('<defs><filter id="s" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1"/></filter></defs><g fill="#fffbea" filter="url(#s)"><path d="M16,1 L18,14 L31,16 L18,18 L16,31 L14,18 L1,16 L14,14Z"/></g>', 32, 32);

  // the sword: back and down to gather, thrown up at the release, settling
  act(sword, [[0, { transform: 'rotate(0deg)' }, eio], [250, { transform: 'rotate(2deg)' }, 'ease-in'], [880, { transform: 'rotate(16deg)' }, 'cubic-bezier(.2,.8,.3,1)'],
    [1060, { transform: 'rotate(-9deg)' }, eio], [1400, { transform: 'rotate(-5deg)' }, eio], [2200, { transform: 'rotate(-6deg)' }, eio], [3400, { transform: 'rotate(0deg)' }]]);
  // the gonfalon: sags in the gather, cracks open at the release, flutters, dies down
  const bl = [[0, { transform: 'none' }, eio], [500, { transform: 'scale(.97, .95) skewX(1.5deg)' }, eio], [890, { transform: 'scale(.96, .94) skewX(2deg)' }, 'ease-out'],
    [1040, { transform: 'scale(1.06, 1.09) skewX(-7deg)' }, eio]];
  for (let t = 1240, i = 0; t < 3000; t += 210, i++) {
    const d = Math.exp(-(t - 1000) / 900);
    bl.push([t, { transform: `scale(${(1 + 0.035 * d * (i % 2 ? 1 : 0.4)).toFixed(3)}, ${(1 + 0.04 * d).toFixed(3)}) skewX(${((i % 2 ? 1 : -1) * 5 * d).toFixed(2)}deg)` }, eio]);
  }
  bl.push([3400, { transform: 'none' }]);
  act(banner, bl);
  // the sun shining through it flares
  fx(k.lightIn('g-rally', [143, 62], 80, 100), [[860, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [1060, { transform: 'scale(1.1)', opacity: 0.85 }, eio], [1700, { transform: 'scale(1)', opacity: 0.45 }, eio], [2600, { transform: 'scale(.9)', opacity: 0 }]]);
  // the army: crouches, leaps on the impact, again smaller, settles
  act(army, [[0, { transform: 'none' }, eio], [700, { transform: `${k.T(0, 1.2)} scale(1.004, .985)` }, 'ease-out'], [1290, { transform: `${k.T(0, 1.2)} scale(1.004, .985)` }, 'cubic-bezier(.2,.8,.3,1)'],
    [1480, { transform: `${k.T(0, -4.5)} scale(1, 1.03)` }, 'ease-in'], [1700, { transform: `${k.T(0, 0.6)} scale(1.006, .99)` }, 'ease-out'], [1900, { transform: `${k.T(0, -2.5)} scale(1, 1.015)` }, 'ease-in'],
    [2120, { transform: `${k.T(0, 0.3)} scale(1.003, .996)` }, eio], [2400, { transform: 'none' }]]);

  // light gathering at the sword's tip
  const gl = [[150, { transform: 'scale(.4)', opacity: 0 }, 'ease-out']];
  for (let t = 400, i = 0; t < 880; t += 120, i++) gl.push([t, { transform: `scale(${(0.9 + 0.5 * (t / 880) + (i % 2 ? 0.15 : 0)).toFixed(2)})`, opacity: 0.55 + 0.4 * (t / 880) }, eio]);
  gl.push([950, { transform: 'scale(2.2)', opacity: 1 }, 'ease-out'], [1400, { transform: 'scale(1.2)', opacity: 0.6 }, eio], [2000, { transform: 'scale(1.5)', opacity: 0.4 }, eio], [2900, { transform: 'scale(.8)', opacity: 0 }]);
  fx(k.light('g-rally', E, 46), gl);
  // motes drawn in to the tip
  for (let i = 0; i < 9; i++) {
    const t = 150 + i * 80, a = rand() * 6.28, d = 14 + rand() * 12, dx = Math.cos(a) * d, dy = Math.sin(a) * d;
    fx(k.pic('mote', E, 6, 6), [[t, { transform: `${k.T(dx, dy)} scale(.6)`, opacity: 0 }, 'ease-in'], [t + 120, { transform: `${k.T(dx * 0.8, dy * 0.8)} scale(1)`, opacity: 0.9 }, 'ease-in'], [t + 480, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }]]);
  }
  // flash and rings at the release
  fx(k.pic(star, E, 34, 34), [[880, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [980, { transform: 'scale(1.3) rotate(25deg)', opacity: 1 }, 'ease-out'], [1400, { transform: 'scale(.5) rotate(70deg)', opacity: 0 }]]);
  for (let i = 0; i < 2; i++) fx(k.pic(ring, E, 40, 40), [[900 + i * 130, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [960 + i * 130, { transform: 'scale(.5)', opacity: 0.85 }, 'ease-out'], [1400 + i * 130, { transform: 'scale(2.2)', opacity: 0 }]]);
  // rays: long thin lights from the tip
  for (let i = 0; i < 5; i++) {
    const a = -150 + i * 30 + (rand() - 0.5) * 10, len = 40 + rand() * 20, r = `rotate(${(a + 90).toFixed(1)}deg)`;
    fx(k.pic('spark', E, 6, len), [[900, { transform: `${r} translateY(${(-len * 0.5 * u).toFixed(1)}px) scale(.3, .2)`, opacity: 0 }, 'ease-out'],
      [1000, { transform: `${r} translateY(${(-len * 0.6 * u).toFixed(1)}px) scale(1, 1)`, opacity: 0.7 }, 'ease-out'], [1350, { transform: `${r} translateY(${(-len * 0.8 * u).toFixed(1)}px) scale(.6, 1.2)`, opacity: 0 }]]);
  }

  // the comet of light from the tip to T
  const C = [(E[0] + T[0]) / 2 + (T[0] > E[0] ? 14 : -14), Math.min(E[1], T[1]) - 14];
  const bz = (t) => { const q = 1 - t; return [q * q * E[0] + 2 * q * t * C[0] + t * t * T[0], q * q * E[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const [X0, Y0] = k.P(...E);
  for (let i = 0; i < 16; i++) {
    const t0 = 900 + i * 28, sz = i % 4 === 0 ? 14 : 9, jit = (rand() - 0.5) * 0.06, jx = (rand() - 0.5) * 6 * u, jy = (rand() - 0.5) * 6 * u;
    const w = (t, sc, o) => { const [x, y] = k.P(...bz(Math.max(0, Math.min(1, t + jit)))); return { transform: `translate(${(x - X0 + jx * t).toFixed(1)}px, ${(y - Y0 + jy * t).toFixed(1)}px) scale(${sc})`, opacity: o }; };
    fx(k.pic('spark', E, sz, sz), [[t0, w(0, 0.4, 0), 'ease-out'], [t0 + 60, w(0.1, 1, 0.95)], [t0 + 220, w(0.55, 1.1, 0.95)], [t0 + 400, w(1, 1.2, 0.85), 'ease-out'], [t0 + 560, w(1, 1.9, 0)]]);
  }

  // the bloom at T
  const bt = [[1260, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1380, { transform: 'scale(1.1)', opacity: 0.95 }]];
  for (let t = 1500, i = 0; t < 2300; t += 150, i++) bt.push([t, { transform: `scale(${i % 2 ? 1.12 : 0.95})`, opacity: i % 2 ? 0.95 : 0.7 }, eio]);
  bt.push([3000, { transform: 'scale(.8)', opacity: 0 }]);
  fx(k.light('g-rally', T, 120), bt);
  fx(k.light('g-warm', T, 70), [[1280, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1400, { transform: 'scale(1)', opacity: 0.6 }, eio], [2200, { transform: 'scale(1.1)', opacity: 0.3 }, eio], [2800, { transform: 'scale(.7)', opacity: 0 }]]);
  for (let i = 0; i < 3; i++) fx(k.pic(ring, T, 60, 60), [[1290 + i * 140, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [1350 + i * 140, { transform: 'scale(.5)', opacity: 0.9 }, 'ease-out'], [1900 + i * 140, { transform: 'scale(2.4)', opacity: 0 }]]);
  fx(k.pic(star, T, 36, 36), [[1290, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1370, { transform: 'scale(1.3) rotate(20deg)', opacity: 1 }, 'ease-out'], [1800, { transform: 'scale(.5) rotate(60deg)', opacity: 0 }]]);
  // sparks flung out of the bloom, then motes rising
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 6.28 + rand() * 0.4, d = 18 + rand() * 20, t = 1290 + rand() * 80;
    fx(k.pic('spark', T, 7, 7), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 60, { transform: `${k.T(Math.cos(a) * 3, Math.sin(a) * 3)} scale(1)`, opacity: 1 }, 'ease-out'],
      [t + 480, { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d + 6)} scale(.5)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 14; i++) {
    const x = T[0] + (rand() - 0.5) * 90, y = T[1] + (rand() - 0.2) * 12, t = 1400 + rand() * 700, dr = 30 + rand() * 30;
    fx(k.pic('mote', [x, y], 5, 5), [[t, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t + 300, { transform: `${k.T((rand() - 0.5) * 6, -dr * 0.4)} scale(1)`, opacity: 0.9 }, eio], [t + 1300, { transform: `${k.T((rand() - 0.5) * 12, -dr)} scale(.6)`, opacity: 0 }]]);
  }
  // spear tips flash one after another (inside the picture)
  const tips = [[31, 142], [52, 135], [75, 135], [91, 122], [117, 154], [159, 155], [185, 163], [199, 154], [209, 155], [235, 131], [265, 136]];
  tips.sort((a, b) => Math.abs(a[0] - T[0]) - Math.abs(b[0] - T[0]));
  tips.forEach((tp, i) => {
    const t = 1380 + i * 55;
    fx(k.picIn(star, tp, 15, 15), [[t, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [t + 100, { transform: `${k.T(0, -3)} scale(1.1) rotate(20deg)`, opacity: 1 }, 'ease-out'], [t + 400, { transform: `${k.T(0, -1)} scale(.4) rotate(50deg)`, opacity: 0 }]]);
  });
  // a light along the whole army while it cheers
  fx(k.lightIn('g-rally', [150, 185], 300, 70), [[1280, { transform: 'scale(.6, .6)', opacity: 0 }, 'ease-out'], [1500, { transform: 'scale(1, 1)', opacity: 0.65 }, eio], [2200, { transform: 'scale(1.05, 1)', opacity: 0.4 }, eio], [3000, { transform: 'scale(1, .8)', opacity: 0 }]]);
}
