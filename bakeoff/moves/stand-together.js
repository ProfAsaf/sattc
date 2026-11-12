// Stand Together: the storm tears open, a beam of light falls on the wall of
// knights, and a wave of it runs down the line: each knight rises taller in
// turn, his shield's boss flaring, light passing from shield to shield.
//
// PLAN (drawing units 300 x 210, ms of the move)
//   role support, element light. The boon is the light through the storm.
//   0-900     gather: the two banks of cloud press in and creak, the light in
//             the gap swells and pulses, motes drift up toward it; the knights
//             brace, each settling a hair into his stance, nearest first.
//   900       RELEASE: the clouds are dragged apart, the gap flares, a ring
//             leaves it and a beam falls from it to T (alone: the middle of
//             the wall; aimed: the target), sparks running down it.
//   1300      IMPACT: the beam lands: a flash and a ring at T. The knight
//             nearest T is lit first: he rises tall, his shield's boss flares,
//             and the wave runs out both ways along the line (100 ms to a
//             knight), a glint passing between each pair of linked shields.
//   2300-3400 the knights ease back down in the same order, the light dims,
//             the clouds close part way and rest.
//   3600      at rest as drawn.
// The beam and the flash at T are on the overlay (T may be on another card).
export const END = 4200;
export const BEATS = { release: 900, impact: 1300, settle: 3600 };
export const STILLS = [450, 880, 1050, 1300, 1600, 1950, 2700, 3900];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 236 + 19 * c, 170 + 80 * c * c, Math.min(1, c * c * 2.6)]; }],
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 244, 200, Math.min(1, c * 1.4) * c]; }],
  beam: [8, 64, (x, y) => { const d = Math.abs(x - 0.5) * 2, c = Math.max(0, 1 - d); return [255, 240, 190, Math.min(1, c * c * 1.6) * (0.55 + 0.45 * Math.sin(y * 3.14159))]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out';
  const S = k.spec, E = S.emit, T = k.aim || [150, 150];
  const F1 = (n) => n.toFixed(1);
  k.css('.g-stand { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,250,226,.95), rgba(255,226,140,.55) 30%, rgba(255,196,90,.18) 60%, rgba(255,180,70,0) 100%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#fff0b8" stroke-width="5" filter="url(#b)"/>', 100, 100);
  const star = k.svg('<defs><filter id="s" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1"/></filter></defs><g fill="#fffbea" filter="url(#s)"><path d="M16,1 L18,14 L31,16 L18,18 L16,31 L14,18 L1,16 L14,14Z"/></g>', 32, 32);

  // the clouds: press in and creak, are dragged apart at the release, close part way
  act(k.part('cloudL'), [[0, { transform: 'none' }, eio], [450, { transform: `${k.T(3, 0)} rotate(.6deg)` }, eio], [880, { transform: `${k.T(4, 0.5)} rotate(.8deg)` }, 'ease-out'],
    [1500, { transform: `${k.T(-9, -1.5)} rotate(-1.4deg)` }, eio], [2600, { transform: `${k.T(-7, -1)} rotate(-1deg)` }, eio], [3600, { transform: 'none' }]]);
  act(k.part('cloudR'), [[0, { transform: 'none' }, eio], [450, { transform: `${k.T(-3, 0)} rotate(-.6deg)` }, eio], [880, { transform: `${k.T(-4, 0.5)} rotate(-.8deg)` }, 'ease-out'],
    [1500, { transform: `${k.T(9, -1.5)} rotate(1.4deg)` }, eio], [2600, { transform: `${k.T(7, -1)} rotate(1deg)` }, eio], [3600, { transform: 'none' }]]);

  // the light in the gap: swells and pulses, flares at the release
  const gp = [[150, { transform: 'scale(.5)', opacity: 0 }, 'ease-out']];
  for (let t = 400, i = 0; t < 880; t += 120, i++) gp.push([t, { transform: `scale(${(0.9 + 0.5 * (t / 880) + (i % 2 ? 0.15 : 0)).toFixed(2)})`, opacity: 0.55 + 0.4 * (t / 880) }, eio]);
  gp.push([960, { transform: 'scale(2.4)', opacity: 1 }, 'ease-out'], [1500, { transform: 'scale(1.5)', opacity: 0.75 }, eio], [2300, { transform: 'scale(1.7)', opacity: 0.55 }, eio], [3300, { transform: 'scale(1)', opacity: 0 }]);
  fx(k.lightIn('g-stand', S.gap, 110), gp);
  for (let i = 0; i < 8; i++) {
    const t = 100 + i * 100, x = 90 + rand() * 160, y = 70 + rand() * 40;
    fx(k.picIn('mote', [x, y], 5, 5), [[t, { transform: 'scale(.5)', opacity: 0 }, 'ease-in'], [t + 200, { transform: `${k.T((S.gap[0] - x) * 0.2, (S.gap[1] - y) * 0.2)} scale(1)`, opacity: 0.9 }, 'ease-in'], [t + 560, { transform: `${k.T(S.gap[0] - x, S.gap[1] - y)} scale(.4)`, opacity: 0 }]]);
  }
  fx(k.pic(star, E, 40, 40), [[900, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(1.4) rotate(25deg)', opacity: 1 }, 'ease-out'], [1500, { transform: 'scale(.5) rotate(70deg)', opacity: 0 }]]);
  for (let i = 0; i < 2; i++) fx(k.pic(ring, E, 50, 50), [[920 + i * 140, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [980 + i * 140, { transform: 'scale(.5)', opacity: 0.85 }, 'ease-out'], [1500 + i * 140, { transform: 'scale(2.4)', opacity: 0 }]]);

  // the beam from the gap to T: a long soft stripe drawn out toward T, then fading
  const dx = T[0] - E[0], dy = T[1] - E[1], len = Math.hypot(dx, dy), ang = (Math.atan2(dy, dx) * 180) / Math.PI - 90;
  const mid = [(E[0] + T[0]) / 2, (E[1] + T[1]) / 2];
  fx(k.pic('beam', mid, 14, len, { }), [[900, { transform: `rotate(${F1(ang)}deg) scale(.4, 1)`, opacity: 0 }, 'ease-out'], [1100, { transform: `rotate(${F1(ang)}deg) scale(1, 1)`, opacity: 0.85 }, eio], [1500, { transform: `rotate(${F1(ang)}deg) scale(1.6, 1)`, opacity: 0.7 }, eio], [2300, { transform: `rotate(${F1(ang)}deg) scale(1.3, 1)`, opacity: 0.35 }, eio], [3000, { transform: `rotate(${F1(ang)}deg) scale(.5, 1)`, opacity: 0 }]]);
  // sparks running down it
  const bz = (t) => [E[0] + dx * t, E[1] + dy * t];
  const [X0, Y0] = k.P(...E);
  for (let i = 0; i < 14; i++) {
    const t0 = 920 + i * 32, sz = i % 4 === 0 ? 12 : 8, jx = (rand() - 0.5) * 7 * u;
    const w = (t, sc, o) => { const [x, y] = k.P(...bz(t)); return { transform: `translate(${(x - X0 + jx * (1 - Math.abs(2 * t - 1))).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) scale(${sc})`, opacity: o }; };
    fx(k.pic('spark', E, sz, sz), [[t0, w(0, 0.4, 0), 'ease-out'], [t0 + 60, w(0.1, 1, 0.95)], [t0 + 220, w(0.6, 1.1, 0.95)], [t0 + 380, w(1, 1.2, 0.8), 'ease-out'], [t0 + 520, w(1, 1.9, 0)]]);
  }

  // the landing at T
  const bt = [[1260, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1380, { transform: 'scale(1.1)', opacity: 0.95 }]];
  for (let t = 1500, i = 0; t < 2300; t += 150, i++) bt.push([t, { transform: `scale(${i % 2 ? 1.12 : 0.95})`, opacity: i % 2 ? 0.95 : 0.7 }, eio]);
  bt.push([3000, { transform: 'scale(.8)', opacity: 0 }]);
  fx(k.light('g-stand', T, 90), bt);
  for (let i = 0; i < 2; i++) fx(k.pic(ring, T, 56, 56), [[1290 + i * 150, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [1350 + i * 150, { transform: 'scale(.5)', opacity: 0.9 }, 'ease-out'], [1900 + i * 150, { transform: 'scale(2.4)', opacity: 0 }]]);
  fx(k.pic(star, T, 34, 34), [[1290, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1370, { transform: 'scale(1.3) rotate(20deg)', opacity: 1 }, 'ease-out'], [1800, { transform: 'scale(.5) rotate(60deg)', opacity: 0 }]]);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * 6.28 + rand() * 0.4, d = 16 + rand() * 18, t = 1290 + rand() * 80;
    fx(k.pic('spark', T, 7, 7), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 60, { transform: `${k.T(Math.cos(a) * 3, Math.sin(a) * 3)} scale(1)`, opacity: 1 }, 'ease-out'],
      [t + 480, { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d + 6)} scale(.5)`, opacity: 0 }]]);
  }

  // the wave down the line: the knight nearest T first (alone: the one in the middle), outward both ways
  const feet = S.feet, gems = S.gems, sc = S.scales;
  let i0 = 0;
  feet.forEach((f, i) => { if (Math.abs(f[0] - T[0]) < Math.abs(feet[i0][0] - T[0])) i0 = i; });
  feet.forEach((f, i) => {
    const kk = sc[i], d = Math.abs(i - i0) * 100, t = 1300 + d, rise = 4.2 * kk + 0.6;
    const part = k.part('k' + i);
    // braced in the gather, rises when the light reaches him, holds, settles back
    act(part, [[0, { transform: 'none' }, eio], [Math.max(200, 700 - i * 30), { transform: `${k.T(0, 0.8 * kk)} scale(1, .99)` }, 'ease-out'], [t - 20, { transform: `${k.T(0, 0.8 * kk)} scale(1, .99)` }, 'cubic-bezier(.2,.9,.3,1)'],
      [t + 200, { transform: `${k.T(0, -rise)} scale(1.015, 1.035)` }, eio], [t + 520, { transform: `${k.T(0, -rise * 0.75)} scale(1.01, 1.025)` }, eio], [2300 + d, { transform: `${k.T(0, -rise * 0.7)} scale(1.01, 1.02)` }, eio], [3500, { transform: 'none' }]]);
    // his shield's boss flares
    const g = gems[i], gs = 22 * kk + 10;
    fx(k.lightIn('g-stand', g, gs), [[t - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 120, { transform: 'scale(1.5)', opacity: 1 }, eio], [t + 500, { transform: 'scale(1.1)', opacity: 0.8 }, eio], [2400 + d, { transform: 'scale(1)', opacity: 0.55 }, eio], [3400, { transform: 'scale(.6)', opacity: 0 }]]);
    // a glint passes to the next shield
    if (i < feet.length - 1 && i >= i0) {
      const n = gems[i + 1], tt = t + 60;
      fx(k.picIn('spark', g, 9 * kk + 4, 9 * kk + 4), [[tt, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [tt + 80, { transform: 'scale(1)', opacity: 1 }, 'ease-in'], [tt + 260, { transform: `${k.T(n[0] - g[0], n[1] - g[1])} scale(.8)`, opacity: 0.8 }, 'ease-out'], [tt + 340, { transform: `${k.T(n[0] - g[0], n[1] - g[1])} scale(.3)`, opacity: 0 }]]);
    } else if (i > 0 && i <= i0) {
      const n = gems[i - 1], tt = t + 60;
      fx(k.picIn('spark', g, 9 * kk + 4, 9 * kk + 4), [[tt, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [tt + 80, { transform: 'scale(1)', opacity: 1 }, 'ease-in'], [tt + 260, { transform: `${k.T(n[0] - g[0], n[1] - g[1])} scale(.8)`, opacity: 0.8 }, 'ease-out'], [tt + 340, { transform: `${k.T(n[0] - g[0], n[1] - g[1])} scale(.3)`, opacity: 0 }]]);
    }
    // a star on the shield's boss as the light arrives
    fx(k.picIn(star, g, 14 * kk + 6, 14 * kk + 6), [[t, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [t + 130, { transform: 'scale(1.1) rotate(20deg)', opacity: 1 }, 'ease-out'], [t + 520, { transform: 'scale(.4) rotate(50deg)', opacity: 0 }]]);
  });
  // a warm light along the whole wall
  fx(k.lightIn('g-stand', [150, 130], 300, 100), [[1300, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [1900, { transform: 'scale(1)', opacity: 0.5 }, eio], [2600, { transform: 'scale(1.05)', opacity: 0.35 }, eio], [3400, { transform: 'scale(.9)', opacity: 0 }]]);
}
