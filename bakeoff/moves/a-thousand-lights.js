// A Thousand Lights: the valley sends five bright spirits to the one who watches.
//
// PLAN (drawing units 300 x 210, ms of the move). A support (element: spirit, gold-white light).
//   0-1000    the gathering: the river of lights surges up out of the valley (it stretches
//             tall and narrow about its mouth); a glow builds at the mouth and a pillar of
//             light stands over it; lights stream up out of it, one after another, the
//             whole move. The watcher draws a breath: he rises on his toes and tips his
//             head back; his cloak stirs in the updraught.
//   560-1500  five great lights form in the river, one after another, and
//   1000-1500 (BEATS.release 1000) leave it: each lifts, then goes on an arc to T,
//             a small wake of motes trailing it. The river slumps a little.
//   1800-2300 (BEATS.impact 1800 the first; the rest follow every 100 ms) each lands on T
//             in a flash, absorbed. T blooms: a warm light, two rings, little stars lifting
//             off in a ring and rising. Alone, T is the watcher's chest: he straightens up,
//             springs, glows gold from within and his cloak whips; aimed at another card,
//             he leans toward it as the lights go and the bloom is at T.
//   2600-3600 the glow, the pillar and the stars die down; the river sinks back, he settles.
//   3600      (BEATS.settle) at rest as drawn.
import { curve } from './_fx.js';

export const END = 4200;
export const BEATS = { release: 1000, impact: 1800, settle: 3600 };
export const STILLS = [400, 900, 1250, 1550, 1900, 2200, 2900, 3900];

export const textures = {
  orb: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 246 - 20 * (1 - c), 214 - 80 * (1 - c), Math.min(1, c * c * c * 3.4 + c * 0.35)]; }],
  mote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 238, 190, Math.min(1, c * c * c * 2.4)]; }],
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 226 + 29 * c * c, 150 + 100 * c * c, Math.min(1, c * c * 2.4)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const river = k.part('river'), watcher = k.part('watcher'), cloak = k.part('cloak');
  const E = k.spec.emit, [HX, HY] = k.spec.hit, [MX, MY] = k.spec.mouth;
  const self = !k.aim;
  const T = k.aim || [HX, HY - 4];
  const sx = Math.abs(T[0] - 82) < 14 ? 0 : T[0] > 82 ? 1 : -1; // which way he leans when it goes elsewhere
  const TI = 1800; // the first light lands

  k.css('.g-gold { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,247,222,.95), rgba(255,222,150,.5) 26%, rgba(255,196,100,.15) 56%, rgba(255,180,80,0) 100%); }');
  const star = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".8"/></filter></defs><path d="M10,0 Q11,9 20,10 Q11,11 10,20 Q9,11 0,10 Q9,9 10,0Z" fill="#ffe9a8" filter="url(#b)"/><path d="M10,2.5 Q10.6,9.4 17.5,10 Q10.6,10.6 10,17.5 Q9.4,10.6 2.5,10 Q9.4,9.4 10,2.5Z" fill="#fffdf0"/>', 20, 20);
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><circle cx="50" cy="50" r="38" fill="none" stroke="#ffe4a8" stroke-width="5" filter="url(#b)"/><circle cx="50" cy="50" r="38" fill="none" stroke="#fffbe8" stroke-width="1.3"/>', 100, 100);

  // ── the river surges, then slumps and settles
  act(river, [[0, { transform: 'none' }, eio], [600, { transform: 'scale(.99, 1.03)' }, 'ease-out'], [1000, { transform: 'scale(.96, 1.07)' }, eio], [1500, { transform: 'scale(1.02, .97)' }, eio], [2300, { transform: 'scale(1, 1.02)' }, eio], [3200, { transform: 'scale(1, .995)' }, eio], [3600, { transform: 'none' }]]);

  // ── the watcher: draws a breath, tips back; springs up as the lights come (or leans toward T)
  const lean = self ? -2.5 : -1.2 + sx * 3;
  const wr = curve([[0, 0], [500, 0, 'out'], [1000, lean], [TI - 150, lean, 'in'], [TI + 80, self ? 1.2 : lean], [TI + 300, self ? -1 : lean], [2700, self ? -0.5 : lean * 0.6], [3300, 0.3], [3600, 0]]);
  const wy = curve([[0, 0], [500, 0], [1000, -1.2, 'out'], [TI - 100, -1.2], [TI + 110, -3.4, 'out'], [TI + 330, -1.3], [2700, -1], [3300, 0.2], [3600, 0]]);
  const wsy = curve([[0, 1], [500, 1], [1000, 1.025, 'out'], [TI - 100, 1.025], [TI + 110, self ? 1.07 : 1.03, 'out'], [TI + 330, 1.03], [2700, 1.02], [3300, 0.998], [3600, 1]]);
  const wl = [];
  for (let t = 0; t <= 3600; t += 50) wl.push([t, { transform: `${k.T(0, wy(t))} rotate(${wr(t).toFixed(2)}deg) scale(${(1 + (wsy(t) - 1) * -0.3).toFixed(3)}, ${wsy(t).toFixed(3)})` }, 'linear']);
  wl.push([END, { transform: 'none' }]); wl[0][1] = { transform: 'none' };
  act(watcher, wl);
  // the cloak stirs in the updraught, whips as the lights land
  const stir = curve([[0, 0], [300, 1.5], [700, 5, 'out'], [1200, 3], [1700, 6], [TI + 60, self ? 13 : 7, 'out'], [TI + 350, self ? 4 : 5], [2000, 9], [2500, 4], [3000, 5], [3500, 0.5], [3700, 0]]);
  const cl = [];
  for (let t = 0; t <= 3700; t += 50) cl.push([t, { transform: `${k.T(0, wy(t))} rotate(${(stir(t) + 0.8 * Math.sin(t / 140) * Math.min(1, t / 600)).toFixed(2)}deg)` }, 'linear']);
  cl.push([END, { transform: 'none' }]); cl[0][1] = { transform: 'none' };
  act(cloak, cl);

  // ── the glow at the valley's mouth and the pillar of light over it
  fx(k.lightIn('g-gold', [MX, MY - 12], 150, 80), [[100, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(1)', opacity: 0.85 }, eio], [1300, { transform: 'scale(1.1)', opacity: 0.95 }, eio], [2100, { transform: 'scale(1)', opacity: 0.7 }, eio], [3100, { transform: 'scale(.9)', opacity: 0.2 }, eio], [3700, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.lightIn('g-gold', [MX, 96], 46, 190), [[300, { transform: 'scale(.4, .5)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(1, 1)', opacity: 0.6 }, eio], [1500, { transform: 'scale(1.1, 1.05)', opacity: 0.7 }, eio], [2300, { transform: 'scale(.9, 1)', opacity: 0.4 }, eio], [3300, { transform: 'scale(.7, .95)', opacity: 0 }]]);
  // lights streaming up from the river, the whole time
  for (let i = 0; i < 30; i++) {
    const t0 = 150 + rand() * 2500, x = MX + (rand() - 0.5) * 50, y = 178 - rand() * 60, rise = 40 + rand() * 60, dx = (rand() - 0.5) * 18, sz = 2 + rand() * 3.2;
    fx(k.picIn('mote', [x, y], sz, sz), [[t0, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t0 + 260, { transform: `${k.T(dx * 0.2, -rise * 0.2)} scale(1)`, opacity: 0.95 }, 'ease-out'], [t0 + 1500, { transform: `${k.T(dx, -rise)} scale(.6)`, opacity: 0 }]]);
  }

  // ── five great lights form in the river and go to T on arcs
  for (let i = 0; i < 5; i++) {
    const tf = 560 + i * 110, td = 1000 + i * 90, tl = TI + i * 100; // forms, departs, lands
    const S = [MX + (rand() - 0.5) * 36, MY - 20 - rand() * 28], Ti = [T[0] + (i - 2) * 3.5 + (rand() - 0.5) * 5, T[1] + (rand() - 0.5) * 10];
    const C = [(S[0] + Ti[0]) / 2 + (rand() - 0.5) * 30, Math.min(S[1], Ti[1]) - 34 - i * 7];
    const pace = (f) => f * f * 0.55 + f * 0.45;
    const pts = k.arc(S, C, Ti, 14, pace), N = 14, sz = 13 + (i % 2) * 2;
    const L = [[tf, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [tf + 220, { transform: 'scale(.9)', opacity: 1 }, eio], [td, { transform: `${k.T(0, -3)} scale(1)`, opacity: 1 }, 'ease-in']];
    pts.forEach(([x, y], j) => { if (j) L.push([Math.round(td + ((tl - td) * j) / N), { transform: `${k.T(x - S[0], y - S[1])} scale(${(1 + 0.12 * Math.sin(j * 1.7 + i)).toFixed(2)})`, opacity: 1 }, 'linear']); });
    L.push([tl + 50, { transform: `${k.T(Ti[0] - S[0], Ti[1] - S[1])} scale(1.8)`, opacity: 0.8 }, 'ease-out'], [tl + 200, { transform: `${k.T(Ti[0] - S[0], Ti[1] - S[1])} scale(2.4)`, opacity: 0 }]);
    // the clean-up of times: strictly increasing
    fx(k.pic('orb', S, sz, sz), L.filter((x, j, a) => j === 0 || x[0] > a[j - 1][0]));
    // a wake: motes dropped behind it, each following the path a little later
    for (let w = 1; w <= 4; w++) {
      const lag = w * 55, ws = sz * (0.7 - w * 0.1);
      const W = [[tf + 60 + lag, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [td + lag * 0.5, { transform: `${k.T(0, -3)} scale(.9)`, opacity: 0.55 - w * 0.08 }, 'ease-in']];
      pts.forEach(([x, y], j) => { if (j) W.push([Math.round(td + lag + ((tl - td) * j) / N), { transform: `${k.T(x - S[0], y - S[1])} scale(.9)`, opacity: Math.max(0, 0.6 - w * 0.1) }, 'linear']); });
      W.push([tl + lag + 100, { transform: `${k.T(Ti[0] - S[0], Ti[1] - S[1])} scale(.2)`, opacity: 0 }]);
      fx(k.pic('mote', S, ws, ws), W.filter((x, j, a) => j === 0 || x[0] > a[j - 1][0]));
    }
    // it lands: flash, and a few motes thrown outward
    fx(k.light('g-gold', Ti, 26), [[tl - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [tl + 30, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [tl + 300, { transform: 'scale(1.9)', opacity: 0 }]]);
    for (let n = 0; n < 4; n++) {
      const a = rand() * 6.28, r = 8 + rand() * 12, ex = Math.cos(a) * r, ey = Math.sin(a) * r - 4, z = 2 + rand() * 2.4, t0 = tl + rand() * 30;
      fx(k.pic('spark', Ti, z, z), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 90, { transform: `${k.T(ex * 0.6, ey * 0.6)} scale(1)`, opacity: 1 }, 'ease-out'], [t0 + 420, { transform: `${k.T(ex, ey + 9)} scale(.3)`, opacity: 0 }]]);
    }
  }

  // ── T blooms: a warm light, two rings, stars lifting off in a ring
  const bl = [[TI - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [TI + 100, { transform: 'scale(1.1)', opacity: 0.95 }, 'ease-out']];
  for (let t = TI + 260, i = 0; t < 2700; t += 160, i++) bl.push([t, { transform: `scale(${i % 2 ? 1.12 : 0.96})`, opacity: i % 2 ? 0.9 : 0.7 }, eio]);
  bl.push([3300, { transform: 'scale(.8)', opacity: 0 }]);
  fx(k.light('g-gold', T, 78), bl);
  fx(k.pic(ring, T, 60, 60), [[TI + 100, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [TI + 170, { transform: 'scale(.45)', opacity: 0.9 }, 'ease-out'], [TI + 760, { transform: 'scale(1.1)', opacity: 0 }]]);
  fx(k.pic(ring, T, 60, 60), [[TI + 330, { transform: 'scale(.1)', opacity: 0 }, 'ease-out'], [TI + 400, { transform: 'scale(.3)', opacity: 0.6 }, 'ease-out'], [TI + 1000, { transform: 'scale(.85)', opacity: 0 }]]);
  for (let n = 0; n < 9; n++) {
    const a = (n / 9) * 6.28 + rand() * 0.5, r = 10 + rand() * 10, x = Math.cos(a) * r, y = Math.sin(a) * r * 0.8, rise = 16 + rand() * 20, sz = 5 + rand() * 4, t0 = TI + 250 + rand() * 500, life = 900 + rand() * 600;
    fx(k.pic(star, [T[0] + x * 0.4, T[1] + y * 0.4], sz, sz), [[t0, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [t0 + 200, { transform: `${k.T(x * 0.6, y * 0.6 - rise * 0.2)} scale(1.1) rotate(30deg)`, opacity: 1 }, 'ease-out'], [t0 + life, { transform: `${k.T(x, y - rise)} scale(.4) rotate(80deg)`, opacity: 0 }]]);
  }
  // alone, he glows gold from within
  if (self) {
    const g = [[TI - 60, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [TI + 120, { transform: 'scale(1.05)', opacity: 0.85 }, 'ease-out'], [TI + 500, { transform: 'scale(1)', opacity: 0.6 }, eio], [2700, { transform: 'scale(1)', opacity: 0.45 }, eio], [3400, { transform: 'scale(.9)', opacity: 0 }]];
    fx(k.lightIn('g-gold', [82, 122], 44, 86), g);
    fx(k.lightIn('g-gold', [93, 118], 12, 76), [[TI + 20, { transform: 'scale(1, .4)', opacity: 0 }, 'ease-out'], [TI + 200, { transform: 'scale(1, 1)', opacity: 0.9 }, eio], [2700, { transform: 'scale(1, 1)', opacity: 0.5 }, eio], [3400, { transform: 'scale(1, .7)', opacity: 0 }]]);
  } else {
    // aimed elsewhere: only a flare at his staff as the lights go
    fx(k.lightIn('g-gold', [93, 86], 30, 30), [[800, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1050, { transform: 'scale(1.2)', opacity: 0.9 }, 'ease-out'], [1700, { transform: 'scale(.8)', opacity: 0 }]]);
  }
}
