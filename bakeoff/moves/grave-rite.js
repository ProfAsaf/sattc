// Grave Rite: under the violet moon the rite is worked, and what it takes it gives back.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker (the suggestion kept: its middle
// chapter drains each opponent, 2 Life), element: spirit (the pale hands and the violet light; the
// suggested "earth" was only the graves). Alone, the drain goes to T = the far right (268, 140).
//   0-1000    the gathering: the four hooded figures lean back, arms to the moon; the moon swells
//             and its light with it; the ring's three rings beat and spill light; the three hands
//             sink, then claw up, one after another; motes spiral up out of the ring.
//   1000-1380 the wind-up: the hands clench, the ring flares white-violet, the figures rock back.
//   1380      RELEASE: the figures fling their arms to T (lunging at it); the hands open and throw;
//             a flight of ghostly hands and streaks of spirit goes from the ring in an arc to T,
//             a ring of light bursting from the earth.
//   1780      IMPACT at T: a flash, two rings, spirit motes bursting, ghost hands rising.
//   1900-2900 the drain comes home: motes stream back from T to the ring and the moon; the moon
//             swells once more and the ring glows (you gain 2); the figures rock and settle.
//   3600      at rest as drawn (BEATS.settle); the move ends at END.
// Contract: T = k.aim or its own; the figures lunge toward T (mirrored if it is on the left); the
// flight is worked out from `emit` and T and is on the overlay, since T may be on another card.
export const END = 4200;
export const BEATS = { release: 1380, impact: 1780, settle: 3600 };
export const STILLS = [350, 800, 1250, 1400, 1650, 1800, 2400, 3900];

export const textures = {
  spark: [32, 32, (x, y) => { const dx = Math.abs(x - 0.5) * 2, dy = Math.abs(y - 0.5) * 2, c = Math.max(0, 1 - Math.hypot(dx, dy)), cr = Math.max(0, 1 - Math.min(dx * 7 + dy, dy * 7 + dx)), v = Math.min(1, c * c * 1.6 + cr * 0.8); return [215 + 40 * v, 175 + 70 * v, 255, v]; }],
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [190 + 60 * c * c, 140 + 90 * c * c, 255, Math.min(1, c * c * 1.6)]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, E = S.emit, RG = S.ring;
  const T = k.aim || S.alone;
  const dir = T[0] >= E[0] ? 1 : -1;
  const REL = 1380, FLY = 400, IMP = REL + FLY;
  k.css(`.g-spirit { border-radius: 50%; background: radial-gradient(closest-side, rgba(248,242,255,.95), rgba(190,146,255,.62) 28%, rgba(140,80,255,.24) 58%, rgba(120,60,255,0) 100%); }
    .g-moonlit { border-radius: 50%; background: radial-gradient(closest-side, rgba(236,220,255,.5), rgba(180,130,255,.28) 50%, rgba(130,70,255,.1) 75%, rgba(120,60,255,0) 100%); }`);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1"/></filter></defs><circle cx="30" cy="30" r="25" fill="none" stroke="#c9a6ff" stroke-width="2.6" filter="url(#b)"/>', 60, 60);
  const streak = k.svg('<defs><linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#9a5cff" stop-opacity="0"/><stop offset=".7" stop-color="#c9a6ff"/><stop offset="1" stop-color="#fbf6ff"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation=".5"/></filter></defs><path d="M0,4 Q10,1.2 24,3 Q30,4 24,5 Q10,6.8 0,4Z" fill="url(#s)" filter="url(#b)"/>', 30, 8);
  // a ghost hand, fingers up, a trail of mist below the wrist
  const ghand = k.svg('<defs><linearGradient id="h" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#9a5cff" stop-opacity="0"/><stop offset=".45" stop-color="#d6bfff"/><stop offset="1" stop-color="#fbf6ff"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation=".4"/></filter></defs><g fill="url(#h)" filter="url(#b)"><path d="M7,30 L7,16 Q5,12 9,12 L15,12 Q19,12 17,17 L17,30Z"/><path d="M7.5,13 L4,5 Q3.5,3.5 5,4 L9,12Z"/><path d="M10,12 L9,2 Q9,.6 10.4,1.4 L13,12Z"/><path d="M13,12 L14,1.6 Q14.6,.4 15.8,1.4 L16,12Z"/><path d="M16,13 L19.4,5 Q20.2,3.8 21,5 L18,14Z"/><path d="M16.5,19 L22,15 Q23.6,14.4 23,16.2 L17,23Z"/></g>', 26, 32);

  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  const grid = [];
  for (let t = 0; t <= 3500; t += 35) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3700, { transform: 'none' }]];

  // ── the moon: swells as the rite gathers, throbs at the release, swells again as the drain comes home
  const MS = curve([[0, 1], [300, 1], [1000, 1.05], [1300, 1.07], [REL, 1.09], [REL + 250, 1.03], [2100, 1.02], [2500, 1.06], [2900, 1.05], [3500, 1]]);
  act(k.part('moon'), sample((t) => ({ transform: `scale(${MS(t).toFixed(4)})` })));
  const ML = curve([[0, 0], [300, 0.2], [1000, 0.6], [REL, 1], [REL + 400, 0.5], [2100, 0.4], [2500, 0.8], [3000, 0.4], [3500, 0]]);
  fx(k.lightIn('g-moonlit', [150, 84], 170, 170), [...grid.filter((t) => t >= 35).map((t) => [t, { transform: `scale(${(0.85 + 0.3 * ML(t)).toFixed(3)})`, opacity: +(ML(t) * 0.9).toFixed(3) }, 'linear']), [3700, { transform: 'scale(.85)', opacity: 0 }]]);

  // ── the ring: beats with the gathering, flares at the release
  const RB = curve([[0, 1], [350, 1.015], [700, 1], [1050, 1.03], [1300, 1.05], [REL, 1.09], [REL + 280, 1.02], [2100, 1.01], [2500, 1.04], [3000, 1.01], [3500, 1]]);
  act(k.part('ring'), sample((t) => ({ transform: `scale(${RB(t).toFixed(4)})` })));
  const RL = curve([[0, 0.15], [350, 0.5], [700, 0.3], [1050, 0.75], [1300, 0.9], [REL, 1], [REL + 400, 0.6], [2100, 0.4], [2600, 0.8], [3200, 0.2], [3500, 0]]);
  fx(k.lightIn('g-spirit', RG, 200, 56), [...grid.filter((t) => t >= 35).map((t) => [t, { transform: `scale(${(0.8 + 0.35 * RL(t)).toFixed(3)})`, opacity: +(RL(t) * 0.8).toFixed(3) }, 'linear']), [3700, { transform: 'scale(.8)', opacity: 0 }]]);
  // rings of light going out of the ring's earth: with the gathering, at the release, as the drain returns
  [[300, 2.4, 0.5], [750, 2.6, 0.55], [1150, 2.9, 0.65], [REL, 3.8, 0.9], [2500, 2.2, 0.6]].forEach(([t, big, o]) =>
    fx(k.picIn(ring, [RG[0], RG[1] + 2], 90, 26, { low: true }), [[t, { transform: 'scale(.4, .3)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(.6, .45)', opacity: o }, 'ease-out'], [t + 800, { transform: `scale(${big}, ${(big * 0.9).toFixed(2)})`, opacity: 0 }]]));

  // ── the hands: sink, then claw up one after another; clench at the wind-up; fling open at the release; sink back
  const H = [['handL', -1, 0], ['handM', 0, 90], ['handR', 1, 190]];
  H.forEach(([name, side, d]) => {
    const claw = curve([[0, 0], [220 + d, 0], [380 + d, -2], [800 + d, 5], [1100, 3.2], [1330, 4.6], [REL + 40, 8.5], [REL + 330, 3], [2100, 1.5], [2900, 0.4], [3400, 0]]);
    const rot = curve([[0, 0], [380 + d, 0], [800 + d, 4 * side], [1100, -3 * side], [1330, -5 * side], [REL + 40, 10 * side], [REL + 330, 3 * side], [2100, 1], [3000, 0]]);
    const scl = curve([[0, 1], [380 + d, 1], [800 + d, 1.05], [1330, 0.97], [REL + 60, 1.1], [REL + 330, 1.02], [2100, 1.0], [3300, 1]]);
    act(k.part(name), sample((t) => ({ transform: `${k.T(0, -claw(t))} rotate(${rot(t).toFixed(2)}deg) scale(${scl(t).toFixed(3)})` })));
  });
  act(k.part('clods'), [[0, { transform: 'none' }, eio], [900, { transform: `${k.T(0, -1)} scale(1, 1.1)` }, 'ease-out'], [REL, { transform: `${k.T(0, -5)} scale(1.04, 1.5)` }, 'ease-out'], [REL + 300, { transform: `${k.T(0, 1)} scale(1)` }, eio], [2000, { transform: 'none' }]]);
  // the hands glow as the rite builds
  S.tips.forEach(([x, y], i) => fx(k.lightIn('g-spirit', [x, y + 6], 30, 30), [[400 + i * 90, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1250, { transform: 'scale(1)', opacity: 0.6 }, eio], [REL, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [REL + 420, { transform: 'scale(1)', opacity: 0.4 }, eio], [2500, { transform: 'scale(.9)', opacity: 0.3 }, eio], [3300, { transform: 'scale(.4)', opacity: 0 }]]));

  // ── the figures: arms to the moon, leaning back; they fling themselves toward T at the release; rock; settle
  const FIG = [['farL', 0.5, 0], ['farR', 0.5, 70], ['nearL', 1, 30], ['nearR', 1, 110]];
  FIG.forEach(([name, a, d]) => {
    const LN = curve([[0, 0], [250 + d, 0], [900 + d, -2.6 * dir * a], [1300, -3.8 * dir * a], [REL - 20, -4.2 * dir * a], [REL + 150, 6 * dir * a], [REL + 420, 3.4 * dir * a], [2000, 0.8 * dir * a], [2600, -0.4 * dir * a], [3500, 0]]);
    const ST = curve([[0, 1], [250 + d, 1], [1000, 1.012], [REL - 20, 1.016], [REL + 150, 0.985], [REL + 420, 1.006], [2400, 1], [3500, 1]]);
    act(k.part(name), sample((t) => ({ transform: `rotate(${LN(t).toFixed(2)}deg) scale(${(1 / Math.sqrt(ST(t))).toFixed(4)}, ${ST(t).toFixed(4)})` })));
  });

  // ── motes spiralling up out of the ring through the gathering, toward the moon
  for (let i = 0; i < 26; i++) {
    const t0 = 150 + Math.round(rand() * 1150), x = RG[0] + (rand() - 0.5) * 100, y = RG[1] + (rand() - 0.5) * 12, sz = 2.6 + rand() * 3.4, sw = (rand() - 0.5) * 16;
    fx(k.picIn(i % 3 ? 'mote' : 'spark', [x, y], sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 140, { transform: `${k.T(0, -4)} scale(1)`, opacity: 0.95 }, 'ease-out'],
      [t0 + 650, { transform: `${k.T(sw * 0.5, -34 - rand() * 14)} scale(.9)`, opacity: 0.8 }, eio], [t0 + 1100 + Math.round(rand() * 300), { transform: `${k.T(sw + (150 - x) * 0.3, -70 - rand() * 20)} scale(.3)`, opacity: 0 }]]);
  }

  // ── the release: a burst of light from the ring, and the flight to T
  fx(k.light('g-spirit', E, 74), [[REL - 80, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [REL + 30, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [REL + 300, { transform: 'scale(1.1)', opacity: 0.6 }, eio], [2100, { transform: 'scale(.8)', opacity: 0.3 }, eio], [2900, { transform: 'scale(.5)', opacity: 0 }]]);
  fx(k.lightIn('g-aura', [150, 100], 300, 190), [[200, { opacity: 0 }, 'ease-out'], [REL, { opacity: 0.7 }, 'ease-out'], [IMP + 300, { opacity: 0.45 }, eio], [3000, { opacity: 0 }]]);
  const C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 34];
  const bz = (t) => { const q = 1 - t; return [q * q * E[0] + 2 * q * t * C[0] + t * t * T[0], q * q * E[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const [X0, Y0] = k.P(...E);
  const along = (tex, t0, dur, lat, sx, sy, s0, s1, o, mode, linger = 0, back = false) => {
    const kf = [], n = 8;
    for (let j = 0; j <= n; j++) {
      const f = j / n, w = back ? 1 - f : Math.pow(f, 0.9), q = bz(w), q2 = bz(Math.min(1, w + 0.02)), q1 = bz(Math.max(0, w - 0.02)), [x, y] = k.P(...q);
      let ang = (Math.atan2(q2[1] - q1[1], q2[0] - q1[0]) * 180) / Math.PI;
      if (back) ang += 180;
      if (mode === 'hand') ang += 90;
      const off = lat * Math.sin(Math.PI * w) * u;
      kf.push([Math.round(t0 + dur * f), { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + off).toFixed(1)}px) rotate(${mode ? ang.toFixed(1) : 0}deg) scale(${(s0 + (s1 - s0) * f).toFixed(2)})`, opacity: j === 0 ? 0 : o }, 'linear']);
    }
    kf.push([Math.round(t0 + dur + 50 + linger), { ...kf.at(-1)[1], opacity: 0 }]);
    fx(k.pic(tex, E, sx, sy), kf);
  };
  for (let i = 0; i < 10; i++) along(streak, REL + i * 22, FLY - 40 + i * 6, (rand() - 0.5) * 8, 36, 9, 0.8, 1.1, 0.95, 'streak', 80);
  for (let i = 0; i < 4; i++) along(ghand, REL + i * 45, FLY - 20 + i * 10, (i - 1.5) * 8, 20, 25, 0.8, 1.2, 0.9, 'hand', 120);
  along('mote', REL, FLY, 0, 20, 20, 0.9, 1.1, 1, null);
  along('spark', REL + 10, FLY - 10, 0, 13, 13, 1, 1.2, 1, null);
  for (let i = 0; i < 16; i++) along(i % 2 ? 'spark' : 'mote', REL + 10 + Math.round(rand() * 240), FLY - 60 + Math.round(rand() * 120), (rand() - 0.5) * 18, 4 + rand() * 4, 4 + rand() * 4, 1, 0.5, 0.95, null, 120);
  const lt = [];
  for (let j = 0; j <= 8; j++) { const f = j / 8, q = bz(f), [x, y] = k.P(...q); lt.push([Math.round(REL + FLY * f), { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) scale(${(1.1 - 0.4 * f).toFixed(2)})`, opacity: j === 0 ? 0 : 0.95 }, 'linear']); }
  lt.push([IMP + 80, { ...lt.at(-1)[1], opacity: 0 }]);
  fx(k.light('g-spirit', E, 36), lt);

  // ── where it lands (BEATS.impact): the drain
  fx(k.light('g-spirit', T, 64), [[IMP - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 50, { transform: 'scale(1.2)', opacity: 1 }, 'ease-out'], [IMP + 260, { transform: 'scale(.9)', opacity: 0.7 }, eio],
    [IMP + 520, { transform: 'scale(1.05)', opacity: 0.75 }, eio], [IMP + 900, { transform: 'scale(.9)', opacity: 0.4 }, eio], [2900, { transform: 'scale(.6)', opacity: 0 }]]);
  [[0, 3.0, 0.85], [150, 4.4, 0.5]].forEach(([d, big, o]) => fx(k.pic(ring, T, 30, 30, { low: true }), [[IMP + d, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + d + 40, { transform: 'scale(.6)', opacity: o }, 'ease-out'], [IMP + d + 700, { transform: `scale(${big})`, opacity: 0 }]]));
  for (let i = 0; i < 4; i++) {
    const cx = Math.sin((i - 1.5) * 0.55), t0 = IMP + i * 50, r = (i - 1.5) * 22;
    fx(k.pic(ghand, T, 12, 15, { base: true }), [[t0, { transform: `translate(${(cx * 3).toFixed(1)}px, 4px) rotate(${r}deg) scale(.3)`, opacity: 0 }, 'ease-out'], [t0 + 160, { transform: `translate(${(cx * 6 * u).toFixed(1)}px, ${(-8 * u).toFixed(1)}px) rotate(${r + 3}deg) scale(1.1)`, opacity: 0.95 }, eio], [t0 + 700, { transform: `translate(${(cx * 9 * u).toFixed(1)}px, ${(-15 * u).toFixed(1)}px) rotate(${r + 8}deg) scale(1.2)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 20; i++) {
    const a = rand() * Math.PI * 2, d = 10 + rand() * 22, t0 = IMP + Math.round(rand() * 160), sz = 3 + rand() * 4;
    fx(k.pic(i % 3 ? 'mote' : 'spark', T, sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 90, { transform: `${k.T(Math.cos(a) * d * 0.4, Math.sin(a) * d * 0.4)} scale(1)`, opacity: 1 }, 'ease-out'],
      [t0 + 800 + Math.round(rand() * 500), { transform: `${k.T(Math.cos(a) * d * 0.9, Math.sin(a) * d * 0.5 - 18 - rand() * 14)} scale(.3)`, opacity: 0 }]]);
  }
  // the drain comes home: motes stream back from T to the ring (you gain 2)
  for (let i = 0; i < 12; i++) along(i % 2 ? 'spark' : 'mote', IMP + 200 + i * 70, 520, (rand() - 0.5) * 22, 4 + rand() * 3, 4 + rand() * 3, 0.9, 1.1, 0.95, null, 60, true);
  for (let i = 0; i < 4; i++) along(streak, IMP + 280 + i * 120, 520, (rand() - 0.5) * 10, 28, 7, 0.8, 0.9, 0.8, 'streak', 40, true);
  fx(k.light('g-heal spirit', E, 50), [[IMP + 700, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IMP + 1000, { transform: 'scale(1.1)', opacity: 0.85 }, 'ease-out'], [2900, { transform: 'scale(1.5)', opacity: 0 }]]);
}
