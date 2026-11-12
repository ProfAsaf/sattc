// Turnabout (a Trick): the swordsman at the top of his somersault turns himself over, and the sea
// turns his double over with him: power and vitality swapped.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support (it hands a creature a swap and
// draws a card; nothing in the picture strikes or guards), element: water. Parts: swordsman
// (the man and his sword, turning about his hips) and double (his reflection in the glass, about
// its own hips).
//   0-600     gather (anticipation): he draws back, curling against the spin (-24 deg, a hair
//             smaller); water light gathers at his sword's tip and drops are drawn up from the
//             glass, rings spread at the double.
//   600-1350  he spins over once, fast, a ring of drops flung off the sword's tip as it sweeps
//             round; the spin eases out and he lands back in his own pose.
//   1350      RELEASE (BEATS.release): the sword flicks, the tip flares, and a stream of drops and
//             spray leaves `emit` (the tip) and arcs to T.
//   1750      LANDS (BEATS.impact) at T = k.aim, else the double in the glass (its own target):
//             a splash crown, rings spreading flat over the water, a flash of aqua light, drops.
//   1800-2700 the swap: the double (or whatever is at T) turns over once in the glass, hopping;
//             two arcs of drops cross between the man and his double, each going the other's way;
//             rings on the water; the man jolts as it arrives.
//   2700-3600 calm: the rings spread out and die, a last glint on the sword; the light drains.
//   3600      at rest as drawn (the move ends at END).
//
// The contract: the gift leaves from `emit` (the sword's tip) and goes to T.
export const END = 4200;
export const BEATS = { release: 1350, impact: 1750, settle: 3600 };
export const STILLS = [350, 900, 1400, 1650, 1900, 2300, 2900, 3900];

export const textures = {
  drop: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [214, 252, 250, Math.min(1, c * c * 1.6)]; }],
  foam: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [240, 255, 252, Math.min(1, c * 1.3) * 0.9]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out';
  const S = k.spec, E = S.emit, [hx, hy] = S.hips, [dx, dy] = S.mirror;
  const T = k.aim || S.alone;
  const sm = k.smooth;
  const wob = (t, c, w) => Math.exp(-(((t - c) / w) ** 2));
  k.css(`.g-aqua { border-radius: 50%; background: radial-gradient(circle, rgba(236,255,252,.95), rgba(150,236,232,.6) 30%, rgba(80,196,206,.22) 58%, rgba(60,170,190,0) 72%); }`);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".8"/></filter></defs><ellipse cx="30" cy="30" rx="26" ry="26" fill="none" stroke="#eafffb" stroke-width="2.4" filter="url(#b)"/>', 60, 60);
  const leanDeg = T[0] < hx ? -7 : 7; // he throws a little toward his target

  // ── the swordsman: curls back, spins over once (about his hips), lands, flicks the sword toward T, jolts at the swap
  act(k.part('swordsman'), [
    [0, { transform: 'rotate(0deg) scale(1)' }, 'ease-in-out'],
    [330, { transform: 'rotate(-14deg) scale(.985)' }, 'ease-in-out'],
    [600, { transform: 'rotate(-24deg) scale(.97)' }, 'cubic-bezier(.45,0,.35,1)'],
    [1000, { transform: 'rotate(150deg) scale(1.03)' }, 'cubic-bezier(.3,.6,.4,1)'],
    [1350, { transform: 'rotate(366deg) scale(1)' }, 'ease-out'],
    [1480, { transform: `rotate(${360 + leanDeg}deg) scale(1.02)` }, eio],
    [1750, { transform: `rotate(${360 + leanDeg * 0.5}deg) scale(1)` }, eio],
    [1950, { transform: 'rotate(356deg) scale(.985)' }, eio],
    [2250, { transform: 'rotate(361.5deg) scale(1.005)' }, eio],
    [2700, { transform: 'rotate(360deg) scale(1)' }],
  ]);

  // ── the double: waits (a ripple's tremble), then turns over once in the glass, hopping, as it lands
  const hop = (t) => -7 * Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 1800) / 900)));
  const dl = [[0, { transform: 'translate(0px, 0px) rotate(0deg) scale(1)' }, eio], [500, { transform: `${k.T(0, 0.8)} rotate(0deg) scale(1.006, .99)` }, eio], [1100, { transform: `${k.T(0, -0.4)} rotate(0deg) scale(.998, 1.006)` }, eio], [1750, { transform: `${k.T(0, 0)} rotate(0deg) scale(1.03, .94)` }, 'ease-out']];
  for (let t = 1850; t <= 2700; t += 50) {
    const f = sm((t - 1800) / 900);
    dl.push([t, { transform: `${k.T(0, hop(t))} rotate(${(-360 * f).toFixed(1)}deg) scale(${(1 + 0.05 * Math.sin(Math.PI * f)).toFixed(3)})` }, 'linear']);
  }
  dl.push([2850, { transform: `${k.T(0, 1.2)} rotate(-360deg) scale(1.02, .975)` }, eio], [3150, { transform: `${k.T(0, 0)} rotate(-360deg) scale(1)` }]);
  act(k.part('double'), dl);

  // ── gather: aqua light at the sword's tip, drops drawn up off the glass into it, rings at the double
  const tg = [[100, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [600, { transform: 'scale(.8)', opacity: 0.5 }, eio]];
  tg.push([1300, { transform: 'scale(1.1)', opacity: 0.8 }, 'ease-in'], [1350, { transform: 'scale(1.9)', opacity: 1 }, 'ease-out'], [1900, { transform: 'scale(1.2)', opacity: 0.55 }, eio], [2900, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.light('g-aqua', E, 38), tg);
  [[150, 0.5, 3.2, 1100], [650, 0.6, 4, 1100]].forEach(([t, o, sc, d]) => fx(k.picIn(ring, [dx, dy + 2], 36, 12), [[t, { transform: 'scale(.2, .07)', opacity: 0 }, 'ease-out'], [t + 70, { transform: 'scale(.4, .13)', opacity: o }, 'ease-out'], [t + d, { transform: `scale(${sc}, ${sc * 0.34})`, opacity: 0 }]]));
  fx(k.lightIn('g-aqua', [dx, dy + 6], 130, 40), [[200, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(1)', opacity: 0.35 }, eio], [1700, { transform: 'scale(1.1)', opacity: 0.55 }, eio], [2700, { transform: 'scale(1)', opacity: 0.3 }, eio], [3500, { transform: 'scale(.8)', opacity: 0 }]]);
  // drops rising from the glass round the double and drawn up toward the sword's tip
  for (let n = 0; n < 14; n++) {
    const t = 200 + n * 55 + rand() * 30, x0 = dx + (rand() - 0.5) * 56, y0 = 120 + rand() * 30, sz = 2.6 + rand() * 2.6;
    const [mx, my] = [x0 + (E[0] - x0) * 0.25 + (rand() - 0.5) * 14, y0 - 30 - rand() * 18];
    fx(k.pic('drop', [x0, y0], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 120, { transform: 'scale(1)', opacity: 0.9 }, 'linear'], [t + 520, { transform: `${k.T(mx - x0, my - y0)} scale(.9)`, opacity: 0.8 }, 'ease-in'], [t + 900, { transform: `${k.T(E[0] - x0, E[1] - y0)} scale(.4)`, opacity: 0 }]]);
  }

  // ── the spin: drops flung off the sword's tip as it sweeps round, on the circle it draws about his hips
  const R = Math.hypot(E[0] - hx, E[1] - hy), a0 = Math.atan2(E[1] - hy, E[0] - hx);
  const [EX, EY] = k.P(...E);
  for (let n = 0; n < 22; n++) {
    const t = 640 + n * 32 + rand() * 16, ang = -24 + (366 + 24) * sm((t - 600) / 750); // (the sword's turn at t)
    const a = a0 + (ang * Math.PI) / 180, px = hx + Math.cos(a) * R, py = hy + Math.sin(a) * R;
    const vx = -Math.sin(a) * (7 + rand() * 6), vy = Math.cos(a) * (7 + rand() * 6); // thrown along the tangent (the way it is turning)
    const sz = 3 + rand() * 3.4;
    fx(k.pic(n % 4 === 3 ? 'foam' : 'drop', [px, py], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(1)', opacity: 0.95 }, 'linear'], [t + 420, { transform: `${k.T(vx * 1.6, vy * 1.6 + 5)} scale(.5)`, opacity: 0 }]]);
  }
  // a ring of light drawn by the sword as it goes round
  fx(k.light('g-aqua', [hx, hy], 140), [[620, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(1)', opacity: 0.45 }, eio], [1380, { transform: 'scale(1.1)', opacity: 0.3 }, eio], [1800, { transform: 'scale(1.2)', opacity: 0 }]]);

  // ── the stream (release to impact): drops and spray along an arc from the sword's tip to T, on the overlay
  const C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 22];
  const bz = (q) => { const w = 1 - q; return [w * w * E[0] + 2 * w * q * C[0] + q * q * T[0], w * w * E[1] + 2 * w * q * C[1] + q * q * T[1]]; };
  for (let n = 0; n < 30; n++) {
    const t0 = 1330 + n * 14, sz = 3 + rand() * 4.5, side = (rand() - 0.5) * 9, dur = 360 + rand() * 80;
    const at = (f, sc, o) => { const [x, y] = k.P(...bz(f)); return { transform: `translate(${(x - EX).toFixed(1)}px, ${(y - EY + side * Math.sin(Math.PI * f) * u).toFixed(1)}px) scale(${sc})`, opacity: o }; };
    fx(k.pic(n % 3 === 2 ? 'foam' : 'drop', E, sz, sz), [[t0, at(0, 0.4, 0), 'ease-out'], [t0 + 50, at(0.08, 1, 1), 'linear'], [t0 + dur * 0.55, at(0.55, 1.05, 1), 'linear'], [t0 + dur, at(1, 1.2, 0.9), 'ease-out'], [t0 + dur + 200, at(1, 0.4, 0)]]);
  }
  // a glint where the flick starts
  fx(k.pic(k.svg('<path d="M0,10L9,8.6L10,0L11,8.6L20,10L11,11.4L10,20L9,11.4Z" fill="#fff"/>', 20, 20), E, 16, 16), [[1320, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [1400, { transform: 'scale(1) rotate(25deg)', opacity: 1 }, eio], [1700, { transform: 'scale(.3) rotate(60deg)', opacity: 0 }]]);

  // ── where it lands (impact, 1750): a splash crown, flat rings, a flash of aqua light
  const I = 1750;
  fx(k.light('g-aqua', T, 70), [[I - 70, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [I + 50, { transform: 'scale(1.2)', opacity: 1 }, eio], [I + 350, { transform: 'scale(1.35)', opacity: 0.6 }, eio], [2900, { transform: 'scale(1.2)', opacity: 0.35 }, eio], [3500, { transform: 'scale(1)', opacity: 0 }]]);
  [[0, 3.6, 0.9], [170, 3, 0.65], [380, 2.2, 0.45]].forEach(([dt, sc, o]) => fx(k.pic(ring, T, 28, 28), [[I + dt, { transform: 'scale(.2, .07)', opacity: 0 }, 'ease-out'], [I + dt + 60, { transform: 'scale(.5, .17)', opacity: o }], [I + dt + 1100, { transform: `scale(${sc}, ${sc * 0.34})`, opacity: 0 }]]));
  // the crown: drops thrown up and out, falling back
  for (let n = 0; n < 20; n++) {
    const a = (-170 + n * 8.4 + (rand() - 0.5) * 8) * Math.PI / 180, v = 12 + rand() * 20, sz = 2.6 + rand() * 3.2, t = I + rand() * 90;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * v * f * 1.25, Math.sin(a) * v * f + 26 * f * f)} scale(${sc})`, opacity: o });
    fx(k.pic(n % 4 === 3 ? 'foam' : 'drop', [T[0], T[1] + 2], sz, sz), [[t, P(0, 0.5, 0), 'ease-out'], [t + 70, P(0.12, 1.1, 1), 'ease-out'], [t + 330, P(0.65, 1, 0.9), 'ease-in'], [t + 620 + rand() * 200, P(1, 0.5, 0)]]);
  }

  // ── the swap (1800-2700): two arcs of drops cross between the man and his double, each the other's way,
  //    with a glow at each end as it arrives
  const cross = (from, to, bow, t00) => {
    const Cc = [(from[0] + to[0]) / 2 + bow, (from[1] + to[1]) / 2], [X0, Y0] = k.P(...from);
    const q = (f) => { const w = 1 - f; return [w * w * from[0] + 2 * w * f * Cc[0] + f * f * to[0], w * w * from[1] + 2 * w * f * Cc[1] + f * f * to[1]]; };
    for (let n = 0; n < 15; n++) {
      const t0 = t00 + n * 26, sz = 3 + rand() * 3.4, dur = 520 + rand() * 80;
      const at = (f, sc, o) => { const [x, y] = k.P(...q(f)); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) scale(${sc})`, opacity: o }; };
      fx(k.pic(n % 3 === 2 ? 'foam' : 'drop', from, sz, sz), [[t0, at(0, 0.4, 0), 'ease-out'], [t0 + 60, at(0.1, 1, 0.95), 'linear'], [t0 + dur * 0.6, at(0.6, 1, 1), 'linear'], [t0 + dur, at(1, 1.2, 0.8), 'ease-out'], [t0 + dur + 180, at(1, 0.4, 0)]]);
    }
  };
  cross([dx + 6, dy - 12], [hx + 6, hy + 10], 62, 1950);
  cross([hx - 4, hy + 8], [dx - 4, dy - 14], -62, 2000);
  for (const [t, p, sz] of [[2500, [hx, hy], 56], [2550, [dx, dy - 6], 64]]) {
    fx(k.light('g-aqua', p, sz), [[t - 80, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 60, { transform: 'scale(1.2)', opacity: 0.9 }, eio], [t + 700, { transform: 'scale(1.4)', opacity: 0 }]]);
  }
  // rings on the water where the double turns, and drops hopping off with it
  for (const [dt, sc, o] of [[0, 3.4, 0.6], [260, 3, 0.5], [560, 2.6, 0.4]]) fx(k.picIn(ring, [dx, 119], 36, 36), [[1850 + dt, { transform: 'scale(.3, .1)', opacity: 0 }, 'ease-out'], [1920 + dt, { transform: 'scale(.6, .2)', opacity: o }], [2900 + dt, { transform: `scale(${sc}, ${sc * 0.3})`, opacity: 0 }]]);
  for (let n = 0; n < 12; n++) {
    const t = 1900 + rand() * 700, x0 = dx + (rand() - 0.5) * 70, sz = 2.2 + rand() * 2.6, up = 14 + rand() * 20;
    fx(k.picIn('drop', [x0, 124 + rand() * 12], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 90, { transform: 'scale(1)', opacity: 0.9 }, 'ease-out'], [t + 380, { transform: `${k.T((rand() - 0.5) * 10, -up)} scale(.9)`, opacity: 0.8 }, 'ease-in'], [t + 760, { transform: `${k.T((rand() - 0.5) * 14, 2)} scale(.5)`, opacity: 0 }]]);
  }
  // a last glint on the sword's tip as everything settles
  fx(k.pic(k.svg('<path d="M0,10L9,8.6L10,0L11,8.6L20,10L11,11.4L10,20L9,11.4Z" fill="#fff"/>', 20, 20), E, 13, 13), [[3000, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [3140, { transform: 'scale(1) rotate(20deg)', opacity: 0.95 }, eio], [3450, { transform: 'scale(.2) rotate(50deg)', opacity: 0 }]]);
}
