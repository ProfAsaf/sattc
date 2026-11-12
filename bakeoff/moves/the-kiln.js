// The Kiln: a creature dies, and the kiln takes its soul and answers.
//
// PLAN (drawing units 300 x 210, ms of the move). Role aura (a relic: the place
// itself acts), element spirit. It isn't aimed; its move spreads past its frame.
//   0-900     SWELL (release): the fire in its mouth draws breath: the flames
//             lengthen and flutter, the white-hot arch brightens, the courtyard
//             floor and arcade warm; sparks stir.
//   600-1900  souls (pale hollow-eyed wisps, as drawn) come drifting in from
//             the dark arches either side and spiral into the fire, one after
//             another; light climbs through the leaking joints of the dome as
//             the fire gathers.
//   1900      PEAK (impact): the fire leaps: the arch flashes white, the flames
//             shoot up, a column of light roars out of the vent and rings of
//             spirit-fire sweep out across the court and past the card's edge;
//             sparks fly, and the souls pour out of the chimney, up and away.
//   2300-3500 CALM (settle): the flames sink back, the vent's light and the
//             rings die, smoke curls from the vent, the courtyard cools to as drawn.
// BEATS: release 900, impact 1900, settle 3500 (END 4200).
export const END = 4200;
export const BEATS = { release: 900, impact: 1900, settle: 3500 };
export const STILLS = [400, 1000, 1500, 1850, 2000, 2300, 2900, 3800];

const noise = (x, y) => 0.55 + 0.25 * Math.sin(x * 9 + y * 4) * Math.cos(y * 7 - x * 3) + 0.2 * Math.sin(x * 21 - y * 13);
export const textures = {
  // a soul: a hollow-eyed head at the top and a curl of smoke trailing below it, pale cream
  wisp: [32, 64, (x, y) => {
    const hx = (x - 0.5) / 0.2, hy = (y - 0.18) / 0.13, head = Math.max(0, 1 - Math.hypot(hx, hy));
    const w = 0.2 * Math.max(0, 1 - Math.max(0, y - 0.2) / 0.78) * (1 + 0.25 * Math.sin(y * 14)), cx = 0.5 + 0.06 * Math.sin(y * 9), tail = y > 0.16 ? Math.max(0, 1 - Math.abs(x - cx) / Math.max(0.001, w)) * (1 - (y - 0.16) / 0.84) : 0;
    let a = Math.max(Math.min(1, head * 2.2) * 0.9, tail * 0.7) * (0.85 + 0.15 * noise(x, y));
    const e1 = Math.hypot((x - 0.42) / 0.035, (y - 0.15) / 0.06), e2 = Math.hypot((x - 0.58) / 0.035, (y - 0.15) / 0.06), m = Math.hypot((x - 0.5) / 0.04, (y - 0.24) / 0.05);
    if (e1 < 1 || e2 < 1 || m < 1) a *= 0.25;
    return [255, 232, 196, Math.min(1, a)];
  }],
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 200 + 55 * c * c, 110 + 120 * c * c * c, Math.min(1, c * c * 2.6)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const flames = k.part('flames'), mouth = k.part('mouth');
  const [mx, my] = k.spec.mouth, [vx, vy] = k.spec.vent;
  k.css(`.fx-copy.hot { mix-blend-mode: plus-lighter; filter: brightness(1.35) saturate(1.15); }
    .g-beam { border-radius: 40% 40% 50% 50% / 8% 8% 50% 50%; background: linear-gradient(to top, rgba(255,236,190,.95), rgba(255,170,70,.55) 40%, rgba(255,120,30,.15) 75%, rgba(255,100,20,0)); }
    .g-spirit { border-radius: 50%; background: radial-gradient(circle, rgba(255,246,226,.9), rgba(255,214,170,.45) 32%, rgba(255,150,80,.15) 58%, rgba(255,120,50,0) 72%); }`);
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.8"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#ffd9a8" stroke-width="5" filter="url(#b)"/>', 100, 100);
  const ringS = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter></defs><ellipse cx="50" cy="50" rx="44" ry="30" fill="none" stroke="#fff0dc" stroke-width="3.5" filter="url(#b)"/>', 100, 100);

  // ── the flames: lengthen as it draws breath, flutter, leap at the peak, sink back
  const FL = [[0, 1, eio], [300, 1.12, eio], [600, 1.2, eio]];
  for (let t = 760, i = 0; t < 1850; t += 110, i++) FL.push([t, 1.28 + (i % 2 ? 0.1 : -0.04) + 0.05 * Math.min(i, 6) / 6, eio]);
  FL.push([1900, 1.85, 'ease-out'], [2050, 1.5, eio]);
  for (let t = 2200, i = 0; t < 3300; t += 130, i++) FL.push([t, 1.25 - 0.18 * ((t - 2200) / 1100) + (i % 2 ? 0.08 : -0.05), eio]);
  FL.push([3500, 1, eio]);
  const flameTf = ([t, s, e], i) => [t, { transform: `scale(${(1 + (s - 1) * 0.45).toFixed(3)}, ${s.toFixed(3)}) skewX(${i % 2 ? 2.5 : -2.5}deg)` }, e];
  act(flames, FL.map(flameTf));
  // the arch breathes a little: its whole face swells slightly with the fire
  act(mouth, [[0, { transform: 'none' }, eio], [900, { transform: 'scale(1.0, 1.015)' }, eio], [1900, { transform: 'scale(1.02, 1.03)' }, 'ease-out'], [2300, { transform: 'scale(1.0, 1.01)' }, eio], [3500, { transform: 'none' }]]);
  // a hot copy of each, brightening with the fire (the same keyframes as the flames themselves)
  const hotF = k.copy('flames', 'hot');
  act(hotF, FL.map((f, i) => { const [t, o, e] = flameTf(f, i); return [t, { ...o, opacity: Math.min(1, Math.max(0, (f[1] - 1) * 1.25)) }, e]; }));
  const hot = k.copy('mouth', 'hot');
  act(hot, [[0, { transform: 'none', opacity: 0 }, eio], [900, { transform: 'scale(1.0, 1.015)', opacity: 0.35 }, eio], [1900, { transform: 'scale(1.02, 1.03)', opacity: 1 }, 'ease-out'], [2300, { transform: 'scale(1.0, 1.01)', opacity: 0.3 }, eio], [3500, { transform: 'none', opacity: 0 }]]);

  // ── light: the mouth, the courtyard and the arcade
  const mouthLight = [[150, { transform: 'scale(.6)', opacity: 0 }, eio], [900, { transform: 'scale(1)', opacity: 0.5 }, eio]];
  for (let t = 1000, i = 0; t < 1850; t += 120, i++) mouthLight.push([t, { transform: `scale(${i % 2 ? 1.12 : 1})`, opacity: i % 2 ? 0.7 : 0.58 }, eio]);
  mouthLight.push([1900, { transform: 'scale(1.9)', opacity: 1 }, 'ease-out'], [2200, { transform: 'scale(1.5)', opacity: 0.7 }, eio], [3000, { transform: 'scale(1.1)', opacity: 0.25 }, eio], [3700, { transform: 'scale(.9)', opacity: 0 }]);
  fx(k.lightIn('g-warm', [mx, my + 4], 120, 110), mouthLight);
  fx(k.lightIn('g-city', [150, 160], 340, 130, { under: true }), [[100, { opacity: 0 }, 'ease-out'], [900, { opacity: 0.5 }, eio], [1850, { opacity: 0.75 }, eio], [1950, { opacity: 1 }, eio], [2600, { opacity: 0.7 }, eio], [3500, { opacity: 0 }]]);
  // the whole court, warming
  fx(k.lightIn('g-city', [150, 100], 330, 210, { under: true }), [[500, { opacity: 0 }, 'ease-out'], [1900, { opacity: 0.35 }, 'ease-out'], [2300, { opacity: 0.5 }, eio], [3500, { opacity: 0 }]]);
  // light climbing through the dome's leaking joints (bottom to top), one after another
  const joints = [[100, 150], [196, 129], [106, 120], [186, 148], [118, 98], [182, 112], [138, 90], [162, 94], [150, 76]];
  joints.forEach(([x, y], i) => {
    const t = 1000 + i * 60;
    fx(k.lightIn('g-warm', [x, y], 16, 14), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 160, { transform: 'scale(1)', opacity: 0.6 }, eio], [t + 420, { transform: 'scale(1.2)', opacity: 0.4 }, eio], [1980, { transform: 'scale(1.7)', opacity: 0.75 }, 'ease-out'], [2500, { transform: 'scale(1.2)', opacity: 0.3 }, eio], [3100, { transform: 'scale(.8)', opacity: 0 }]]);
  });

  // ── sparks stirring at the mouth through the swell
  const sparkUp = (x, y, t, sz, rise, drift, life) => fx(k.pic('spark', [x, y], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 100, { transform: `${k.T(drift * 0.2, -rise * 0.18)} scale(1)`, opacity: 1 }], [t + life, { transform: `${k.T(drift, -rise)} scale(.2)`, opacity: 0 }]]);
  for (let i = 0; i < 14; i++) sparkUp(mx - 14 + rand() * 28, 176 + rand() * 8, 250 + i * 110 + rand() * 60, 2.4 + rand() * 2, 18 + rand() * 20, (rand() - 0.5) * 14, 600 + rand() * 300);

  // ── souls drifting in from the arches and spiralling into the fire (600-1900)
  const mover = (el, t0, dur, pos, rotF, sc0, sc1, o) => {
    const ks = [], [ox, oy] = pos(0);
    for (let t = 0; t <= dur + 1; t += 70) {
      const f = Math.min(1, t / dur), [x, y] = pos(f);
      ks.push([t0 + Math.min(t, dur), { transform: `${k.T(x - ox, y - oy)} rotate(${rotF(f).toFixed(1)}deg) scale(${(sc0 + (sc1 - sc0) * f).toFixed(3)})`, opacity: o(f) }, 'linear']);
    }
    return fx(el, ks);
  };
  const starts = [[46, 150], [254, 148], [64, 96], [238, 100], [30, 118]];
  starts.forEach(([ax, ay], i) => {
    const t0 = 560 + i * 250, dur = 900, side = ax < 150 ? 1 : -1;
    const pos = (f) => { const e = f * f * (3 - 2 * f), q = 1 - e, cx = ax + side * 30, cy = Math.min(ay, my) - 34;
      return [q * q * ax + 2 * q * e * cx + e * e * mx + 4 * Math.sin(f * 11 + i) * (1 - f), q * q * ay + 2 * q * e * cy + e * e * my + 3 * Math.cos(f * 9 + i) * (1 - f)]; };
    const head = (f) => { const [x0, y0] = pos(Math.max(0, f - 0.04)), [x1, y1] = pos(Math.min(1, f + 0.04)); return (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI + 90; };
    mover(k.pic('wisp', [ax, ay], 18, 36, { lit: false }), t0, dur, pos, head, 1, 0.3, (f) => (f < 0.12 ? f / 0.12 : f > 0.86 ? Math.max(0, (1 - f) / 0.14) : 1));
    // each soul's arrival: a little flare at the mouth
    fx(k.lightIn('g-spirit', [mx, my], 34, 34), [[t0 + dur - 120, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + dur + 20, { transform: 'scale(1.1)', opacity: 0.8 }, 'ease-out'], [t0 + dur + 330, { transform: 'scale(1.5)', opacity: 0 }]]);
  });

  // ── the peak (1900): the rings of spirit-fire, the column of light from the vent, souls pouring up
  const IM = 1900;
  fx(k.pic(ring, [mx, my], 70, 70), [[IM, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(.5)', opacity: 0.95 }, 'ease-out'], [IM + 900, { transform: 'scale(5.2)', opacity: 0 }]]);
  fx(k.pic(ringS, [mx, my + 6], 70, 70), [[IM + 120, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [IM + 200, { transform: 'scale(.6)', opacity: 0.75 }, 'ease-out'], [IM + 1100, { transform: 'scale(6.4)', opacity: 0 }]]);
  fx(k.pic(ring, [mx, my], 70, 70), [[IM + 260, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [IM + 330, { transform: 'scale(.5)', opacity: 0.55 }, 'ease-out'], [IM + 1300, { transform: 'scale(4.6)', opacity: 0 }]]);
  // the flash at the mouth
  fx(k.light('g-warm', [mx, my], 80), [[IM - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(1.4)', opacity: 0.8 }, 'ease-out'], [IM + 400, { transform: 'scale(1.8)', opacity: 0.4 }, eio], [IM + 900, { transform: 'scale(1.5)', opacity: 0 }]]);
  // the column of light roaring out of the vent, up past the frame
  fx(k.light('g-beam', [vx, vy - 40], 26, 130), [[IM + 40, { transform: 'scaleY(.1) scaleX(.5)', opacity: 0 }, 'ease-out'], [IM + 220, { transform: 'scaleY(1) scaleX(1)', opacity: 0.95 }, 'ease-out'], [IM + 700, { transform: 'scaleY(1.05) scaleX(.85)', opacity: 0.7 }, eio], [IM + 1400, { transform: 'scaleY(.8) scaleX(.5)', opacity: 0 }]]);
  fx(k.light('g-warm', [vx, vy - 4], 56), [[IM + 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 200, { transform: 'scale(1.3)', opacity: 0.95 }, 'ease-out'], [IM + 900, { transform: 'scale(1)', opacity: 0.55 }, eio], [IM + 1600, { transform: 'scale(.6)', opacity: 0 }]]);
  // souls pouring up out of the vent and away, past the frame
  for (let i = 0; i < 9; i++) {
    const t0 = IM + 90 + i * 100 + rand() * 40, dur = 900 + rand() * 300, x0 = vx + (rand() - 0.5) * 10, sw = 6 + rand() * 8, ph = rand() * 6, tx = (rand() - 0.5) * 70, top = -34 - rand() * 18, sz = 0.8 + rand() * 0.45;
    const pos = (f) => [x0 + tx * f * f + sw * Math.sin(f * 7 + ph) * (0.3 + f), vy - 6 + (top - (vy - 6)) * (1 - Math.pow(1 - f, 1.6))];
    mover(k.pic('wisp', [x0, vy - 6], 16 * sz, 32 * sz, { lit: false }), t0, dur, pos, (f) => 8 * Math.cos(f * 7 + ph), 0.5, 1.1, (f) => (f < 0.15 ? f / 0.15 * 0.8 : Math.max(0, 1 - (f - 0.15) / 0.85) * 0.8));
  }
  // sparks thrown from the vent, and from the mouth
  for (let i = 0; i < 20; i++) {
    const fromMouth = i % 3 === 0, x = fromMouth ? mx + (rand() - 0.5) * 30 : vx + (rand() - 0.5) * 12, y = fromMouth ? my + 8 : vy - 2;
    const a = -Math.PI * (0.18 + rand() * 0.64), v = 24 + rand() * 40, t = IM + 20 + rand() * 260, life = 700 + rand() * 600, sz = 2.6 + rand() * 2.6;
    const pt = (f) => [Math.cos(a) * v * f, Math.sin(a) * v * f + 34 * f * f];
    fx(k.pic('spark', [x, y], sz, sz), [0, 0.3, 0.65, 1].map((f, j) => [t + life * f, { transform: `${k.T(...pt(f))} scale(${(1 - 0.7 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']));
  }
  // flames flung out of the mouth with the leap
  for (let i = 0; i < 5; i++) {
    const t = IM + 20 + i * 40, dx = (i - 2) * 5;
    fx(k.pic(i % 2 ? 'flame' : 'flame2', [mx + dx, 188], 12, 30 + rand() * 14, { base: true }), [[t, { transform: 'scale(.5, .1)', opacity: 0 }, 'ease-out'], [t + 130, { transform: `${k.T(dx * 0.5, 0)} scale(1.1, 1)`, opacity: 0.7 }, eio], [t + 380, { transform: `${k.T(dx, 0)} scale(.9, .9) skewX(${i % 2 ? 6 : -6}deg)`, opacity: 0.8 }, eio], [t + 700, { transform: `${k.T(dx, 0)} scale(.5, .3)`, opacity: 0 }]]);
  }
  // smoke curling from the vent as it calms
  for (let i = 0; i < 4; i++) {
    const t = 2300 + i * 200, r = Math.round(rand() * 360);
    fx(k.pic('smoke', [vx + (rand() - 0.5) * 8, vy - 6], 26, 26, { lit: false, low: true }), [[t, { transform: `rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 400, { transform: `${k.T(-2, -16)} rotate(${r + 20}deg) scale(1)`, opacity: 0.45 }], [t + 1100, { transform: `${k.T(-10, -60)} rotate(${r + 50}deg) scale(2)`, opacity: 0 }]]);
  }
}
