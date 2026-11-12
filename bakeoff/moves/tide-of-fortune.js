// Tide of Fortune: the wave gives up its fortune.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support (the wave
// brings a gift: draw two cards), element: water. Aimed: the gift goes to
// T = k.aim, or, alone, across the beach to the strand of pearls (226, 168).
//   0-700     the sea draws back (anticipation): the burst of spray sinks and
//             narrows, the gold glints and swells with warm light, drops of
//             spray are sucked down toward the rock.
//   760       RELEASE: the spray surges up and leans toward T, throwing a
//             stream of foam, coins and pearls along an arc, one after another.
//   1400      IMPACT: they land at T in a burst of foam and gold light, a ring
//             runs out, two coins flip up and fade (two cards drawn), motes
//             of gold rise and the pearls glint.
//   1500-3000 the spray falls back and settles; the gold's light dies down.
//   3500      at rest as drawn (the move ends at END).
export const END = 4000;
export const BEATS = { release: 760, impact: 1400, settle: 3500 };
export const STILLS = [350, 760, 980, 1240, 1450, 1750, 2500, 3700];

export const textures = {
  foam: [48, 48, (x, y) => {
    const r = Math.hypot(x - 0.5, y - 0.5) * 2, n = 0.5 + 0.5 * Math.sin(x * 19 + y * 11) * Math.cos(y * 17 - x * 7);
    const c = Math.max(0, 1 - r * (0.85 + 0.3 * n)); return [236, 253, 250, Math.min(1, c * c * 1.5)];
  }],
  coin: [32, 32, (x, y) => {
    const r = Math.hypot(x - 0.5, (y - 0.5) * 1.0) * 2;
    if (r > 0.92) return [0, 0, 0, 0];
    const a = Math.min(1, (0.92 - r) * 14);
    const rim = r > 0.72, hi = Math.max(0, 1 - Math.hypot(x - 0.36, y - 0.34) * 3.2);
    return rim ? [158 + 60 * hi, 110 + 60 * hi, 28, a] : [255, 214 + 30 * hi, 100 + 120 * hi, a];
  }],
  pearl: [24, 24, (x, y) => {
    const r = Math.hypot(x - 0.5, y - 0.5) * 2, hi = Math.max(0, 1 - Math.hypot(x - 0.38, y - 0.34) * 3.4);
    if (r > 0.92) return [0, 0, 0, 0];
    const b = 1 - r * 0.22; return [(236 + 19 * hi) * b, (232 + 23 * hi) * b, (250 + 5 * hi) * b, Math.min(1, (0.92 - r) * 14)];
  }],
  spark: [32, 32, (x, y) => {
    const dx = Math.abs(x - 0.5) * 2, dy = Math.abs(y - 0.5) * 2, c = Math.max(0, 1 - Math.hypot(dx, dy)), cross = Math.max(0, 1 - Math.min(dx * 7 + dy, dy * 7 + dx));
    const v = Math.min(1, c * c * 1.6 + cross * 0.9); return [255, 238 + 17 * v, 190 + 65 * v, v];
  }],
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 236, 170, Math.min(1, c * c * 1.5)]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const E = k.spec.emit, PILE = k.spec.pile;
  const T = k.aim || [226, 168];
  const dxT = T[0] - E[0], right = dxT >= 0, lean = (right ? 1 : -1) * Math.min(14, 4 + Math.abs(dxT) / 14);
  const REL = 760, IMP = 1400;

  k.css(`.g-fortune { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,250,225,.95), rgba(255,226,140,.55) 30%, rgba(255,205,110,.16) 60%, rgba(255,190,90,0) 100%); }
    .g-sea { border-radius: 50%; background: radial-gradient(closest-side, rgba(235,255,252,.85), rgba(190,240,238,.4) 35%, rgba(150,225,230,.12) 65%, rgba(150,225,230,0) 100%); }`);

  // ── the spray: sinks as the sea draws back, surges and leans toward T, falls back and settles
  act(k.part('spray'), [[0, { transform: 'none' }, eio], [420, { transform: 'scale(.92, .78)' }, 'ease-in'], [700, { transform: 'scale(.86, .72)' }, 'ease-out'],
    [REL + 140, { transform: `rotate(${lean}deg) scale(1.22, 1.45)` }, eio], [IMP + 200, { transform: `rotate(${lean * 0.6}deg) scale(1.1, 1.2)` }, eio],
    [1900, { transform: 'rotate(-2deg) scale(.96, .9)' }, eio], [2400, { transform: 'scale(1.02, 1.04)' }, eio], [3100, { transform: 'none' }]]);
  // the gold swells and glints as the sea draws back, then gives a little of itself
  act(k.part('gold'), [[0, { transform: 'none' }, eio], [600, { transform: 'scale(1.035)' }, eio], [REL, { transform: 'scale(1.05)' }, 'ease-out'], [REL + 260, { transform: 'scale(.985)' }, eio], [1300, { transform: 'scale(1.02)' }, eio], [2300, { transform: 'scale(1.01)' }, eio], [3200, { transform: 'none' }]]);
  act(k.part('pearls'), [[0, { transform: 'none' }, eio], [500, { transform: 'translate(0px, 0px) rotate(0deg)' }, eio], [REL + 100, { transform: `${k.T(0, -1.2)} rotate(-1.6deg)` }, eio], [1300, { transform: `${k.T(0, 0.5)} rotate(1deg)` }, eio], [2000, { transform: `${k.T(0, -0.3)} rotate(-.4deg)` }, eio], [2800, { transform: 'none' }]]);

  // ── the sea draws back: warm light on the gold, a cool glow in the spray, drops sucked down toward the rock
  fx(k.lightIn('g-fortune', PILE, 90, 52), [[150, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [700, { transform: 'scale(1)', opacity: 0.75 }, eio], [REL + 200, { transform: 'scale(1.15)', opacity: 0.95 }, eio], [1700, { transform: 'scale(1.05)', opacity: 0.6 }, eio], [3000, { transform: 'scale(.9)', opacity: 0 }]]);
  fx(k.lightIn('g-sea', E, 96, 84), [[250, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [700, { transform: 'scale(.8)', opacity: 0.45 }, eio], [REL + 160, { transform: 'scale(1.25)', opacity: 0.9 }, eio], [1500, { transform: 'scale(1.15)', opacity: 0.55 }, eio], [2500, { transform: 'scale(1)', opacity: 0 }]]);
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * (0.05 + 0.9 * rand()), d = 26 + rand() * 34, x0 = Math.cos(a) * d, y0 = Math.sin(a) * d * 0.8, t = 80 + i * 60, s = 3 + rand() * 3;
    fx(k.pic('foam', [E[0] + x0, E[1] + y0 + 6], s, s), [[t, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [t + 90, { transform: 'scale(1)', opacity: 0.9 }, 'ease-in'], [t + 560, { transform: `${k.T(-x0 * 0.9, -y0 * 0.7 + 14)} scale(.5)`, opacity: 0 }]]);
  }

  // ── the surge: a ring of water at the spray, foam thrown up
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".8"/></filter></defs><circle cx="30" cy="30" r="25" fill="none" stroke="#effffc" stroke-width="3" filter="url(#b)"/>', 60, 60);
  fx(k.pic(ring, E, 40, 40), [[REL - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [REL + 60, { transform: 'scale(.7)', opacity: 0.9 }], [REL + 760, { transform: 'scale(3.8)', opacity: 0 }]]);
  for (let i = 0; i < 14; i++) {
    const a = rad(-170 + (160 * i) / 13 + (rand() - 0.5) * 12), d = 18 + rand() * 30, t = REL + rand() * 160, s = 7 + rand() * 7;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * d * f, Math.sin(a) * d * f + 16 * f * f)} scale(${sc})`, opacity: o });
    fx(k.pic('foam', [E[0], E[1] + 10], s, s), [[t, P(0, 0.4, 0), 'ease-out'], [t + 90, P(0.35, 1, 0.95), 'ease-out'], [t + 360, P(0.9, 1.1, 0.8), 'ease-in'], [t + 700, P(1, 1.3, 0)]]);
  }

  // ── the gift: foam, coins and pearls along an arc from the spray to T, one after another
  const C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 34 - Math.min(40, Math.abs(dxT) * 0.12)];
  const bz = (t, off) => { const q = 1 - t; return [q * q * E[0] + 2 * q * t * C[0] + t * t * (T[0] + off[0]) , q * q * E[1] + 2 * q * t * C[1] + t * t * (T[1] + off[1])]; };
  const fly = (src, w, h, t0, dur, off, o) => {
    const { spin = 0, flat = false, lit = true, so = 1, fade = 460 } = o || {};
    const kf = [];
    const N = 6;
    for (let j = 0; j <= N; j++) {
      const f = j / N, [x, y] = bz(f, off), ex = flat ? 1 : 1;
      const sc = (0.4 + 0.6 * sm(Math.min(1, f * 3))) * (1 + 0.15 * Math.sin(f * Math.PI)) * so;
      const sx = src === 'coin' ? Math.abs(Math.cos((f * 2.2 + spin) * Math.PI)) * 0.85 + 0.15 : 1;
      kf.push([Math.round(t0 + dur * f), { transform: `${k.T(x - E[0], y - E[1])} rotate(${Math.round(f * 220 * (spin || 1))}deg) scale(${(sc * sx * ex).toFixed(2)}, ${sc.toFixed(2)})`, opacity: j === 0 ? 0 : (j === 1 ? 0.95 : 1) }, j === 0 ? 'ease-out' : 'linear']);
    }
    const [lx, ly] = bz(1, off);
    kf.push([t0 + dur + fade * 0.4, { transform: `${k.T(lx - E[0], ly - E[1] - 3)} rotate(260deg) scale(${so})`, opacity: 1 }, 'ease-in'], [t0 + dur + fade, { transform: `${k.T(lx - E[0], ly - E[1] + 1)} rotate(280deg) scale(${(so * 0.9).toFixed(2)})`, opacity: 0 }]);
    fx(k.pic(src, E, w, h, { lit }), kf);
  };
  const FT = IMP - REL;
  for (let i = 0; i < 20; i++) fly('foam', 15 + rand() * 9, 15 + rand() * 6, REL + i * 26, FT - i * 8, [(rand() - 0.5) * 16, (rand() - 0.5) * 8], { spin: 0.3, fade: 300 });
  for (let i = 0; i < 9; i++) fly('coin', 9.5, 9.5, REL + 30 + i * 52, FT - 40 + rand() * 40, [(i - 4) * 4 + (rand() - 0.5) * 5, (rand() - 0.5) * 8], { spin: rand(), lit: false, so: 0.9 + rand() * 0.4 });
  for (let i = 0; i < 5; i++) fly('pearl', 6, 6, REL + 70 + i * 80, FT - 60 + rand() * 40, [(i - 2) * 5 + (rand() - 0.5) * 4, (rand() - 0.5) * 8], { spin: 0.2, lit: false, so: 1 });
  // glints along the flight
  for (let i = 0; i < 10; i++) {
    const f = 0.12 + 0.8 * rand(), [x, y] = bz(f, [0, 0]), t = REL + 40 + f * FT * 0.9 + rand() * 120;
    fx(k.pic('spark', [x + (rand() - 0.5) * 8, y + (rand() - 0.5) * 6], 5 + rand() * 4, 5 + rand() * 4), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 90, { transform: 'scale(1) rotate(20deg)', opacity: 1 }], [t + 380, { transform: `${k.T(0, 4)} scale(.3) rotate(60deg)`, opacity: 0 }]]);
  }

  // ── the landing (IMPACT): foam bursts, golden light, a ring, two coins flip up, motes rise, pearls glint
  const il = [[IMP - 60, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 60, { transform: 'scale(1.15)', opacity: 1 }, eio]];
  for (let t = IMP + 220, i = 0; t < 2300; t += 150, i++) il.push([t, { transform: `scale(${i % 2 ? 1.1 : 0.94})`, opacity: i % 2 ? 0.95 : 0.78 }, eio]);
  il.push([2900, { transform: 'scale(.8)', opacity: 0 }]);
  fx(k.light('g-fortune', T, 78), il);
  fx(k.light('g-sea', T, 120, 70), [[IMP - 30, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IMP + 120, { transform: 'scale(1)', opacity: 0.8 }, eio], [2000, { transform: 'scale(1.2)', opacity: 0 }]]);
  const gring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="25" fill="none" stroke="#ffeaa8" stroke-width="3" filter="url(#b)"/>', 60, 60);
  [[IMP, 4.6, 0.95], [IMP + 150, 3.4, 0.7]].forEach(([t, sc, o]) => fx(k.pic(gring, T, 36, 36), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 60, { transform: 'scale(.6)', opacity: o }], [t + 820, { transform: `scale(${sc})`, opacity: 0 }]]));
  for (let i = 0; i < 12; i++) {
    const a = rad(-180 + (180 * (i + 0.5)) / 12 + (rand() - 0.5) * 10), d = 14 + rand() * 20, t = IMP - 20 + rand() * 80, s = 8 + rand() * 7;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * d * f, Math.sin(a) * d * f * 0.8 + 12 * f * f)} scale(${sc})`, opacity: o });
    fx(k.pic('foam', T, s, s), [[t, P(0, 0.4, 0), 'ease-out'], [t + 80, P(0.35, 1, 0.95), 'ease-out'], [t + 300, P(0.85, 1.1, 0.8), 'ease-in'], [t + 620, P(1, 1.3, 0)]]);
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + rand() * 0.3, d = 14 + rand() * 22, t = IMP + rand() * 90, s = 4 + rand() * 5;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * d * f, Math.sin(a) * d * f - 10 * f + 8 * f * f)} scale(${sc})`, opacity: o });
    fx(k.pic('spark', T, s, s), [[t, P(0, 0.5, 0), 'ease-out'], [t + 60, P(0.25, 1.1, 1), 'ease-out'], [t + 330, P(0.8, 0.9, 0.9), 'ease-in'], [t + 700 + rand() * 200, P(1, 0.3, 0)]]);
  }
  // two coins flip up and fade: the two cards drawn
  [[-11, 0], [11, 120]].forEach(([dx, dt], i) => {
    const t = IMP + 120 + dt, P = (f, sx, o) => ({ transform: `${k.T(dx * (0.4 + 0.6 * f), -34 * f + 14 * f * f)} scale(${sx}, 1.35)`, opacity: o });
    fx(k.pic('coin', [T[0], T[1] - 4], 9, 9, { lit: false }), [[t, { ...P(0, 0.2, 0), transform: 'scale(.4)' }, 'ease-out'], [t + 90, P(0.15, 1, 1), 'linear'], [t + 270, P(0.45, 0.15, 1), 'linear'], [t + 450, P(0.7, 1, 1), 'linear'], [t + 640, P(0.9, 0.2, 0.9), 'linear'], [t + 820, P(1, 0.9, 0)]]);
  });
  // gold motes rising from the landing
  for (let i = 0; i < 12; i++) {
    const x = (rand() - 0.5) * 34, t = IMP + 160 + rand() * 700, s = 3 + rand() * 4;
    fx(k.pic('mote', [T[0] + x, T[1] + 2], s, s), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 160, { transform: `${k.T(x * 0.1, -6)} scale(1)`, opacity: 0.95 }, 'linear'], [t + 1100, { transform: `${k.T(x * 0.3, -34 - rand() * 18)} scale(.5)`, opacity: 0 }]]);
  }

  // ── at the pile: its own glints answer, the pearls shine
  for (let i = 0; i < 6; i++) {
    const x = PILE[0] + (rand() - 0.5) * 50, y = PILE[1] + (rand() - 0.5) * 14 - 2, t = 500 + i * 420 + rand() * 200;
    fx(k.picIn('spark', [x, y], 8 + rand() * 4, 8 + rand() * 4), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 110, { transform: 'scale(1) rotate(25deg)', opacity: 1 }], [t + 460, { transform: 'scale(.3) rotate(70deg)', opacity: 0 }]]);
  }
}
const rad = (d) => (d * Math.PI) / 180;
