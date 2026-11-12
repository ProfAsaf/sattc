// Shackles: the beast strains against its irons, the runes blaze, and the binding is flung out.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support (the suggestion kept: a Hex is a
// gift laid on a creature, here a curse on an enemy: the boon goes to T), element: shadow (violet
// runes and gloom; the card's suggestion kept). Alone, T is the beast's own head (78, 112), where
// the binding closes: it is the one thing in the picture still free.
//   0-1000    the gathering: the runes go dark, then relight cuff by cuff as light climbs the chains
//             from the stakes; the stakes' pools pulse; the beast strains: the head yanks up, the
//             body heaves back, the chains rattle and the cuffs jolt with every pull.
//   1000-1350 the wind-up: the beast gives one huge lunge, the chains snap taut, the runes blaze.
//   1350      RELEASE: from each cuff a chain of spectral links is flung in an arc to T.
//   1750      IMPACT at T: a ring of runes clamps shut (closing from wide), a flash, links and
//             sparks, gloom boiling off; the beast's head slams down and the body shudders.
//   1900-3300 it is held: the clamp glows and turns slowly, the gloom rises; the beast goes still;
//             all the light drains back into the runes; the chains settle.
//   3500      at rest as drawn (BEATS.settle); the move ends at END.
// Contract: T = k.aim or its own; the chains are worked out from each cuff to T on the overlay.
export const END = 4200;
export const BEATS = { release: 1350, impact: 1750, settle: 3500 };
export const STILLS = [300, 700, 1150, 1360, 1600, 1800, 2500, 3900];

export const textures = {
  spark: [32, 32, (x, y) => { const dx = Math.abs(x - 0.5) * 2, dy = Math.abs(y - 0.5) * 2, c = Math.max(0, 1 - Math.hypot(dx, dy)), cr = Math.max(0, 1 - Math.min(dx * 7 + dy, dy * 7 + dx)), v = Math.min(1, c * c * 1.6 + cr * 0.8); return [215 + 40 * v, 175 + 70 * v, 255, v]; }],
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [190 + 60 * c * c, 140 + 90 * c * c, 255, Math.min(1, c * c * 1.6)]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, CUFFS = S.cuffs, STAKES = S.stakes, NECK = S.neck;
  const T = k.aim || S.alone;
  const REL = 1350, FLY = 400, IMP = REL + FLY;
  k.css(`.g-spirit { border-radius: 50%; background: radial-gradient(closest-side, rgba(248,242,255,.95), rgba(190,146,255,.62) 28%, rgba(140,80,255,.24) 58%, rgba(120,60,255,0) 100%); }
    .g-hexlit { border-radius: 50%; background: radial-gradient(closest-side, rgba(226,200,255,.55), rgba(160,110,255,.3) 45%, rgba(120,60,255,.1) 75%, rgba(120,60,255,0) 100%); }`);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1"/></filter></defs><circle cx="30" cy="30" r="25" fill="none" stroke="#c9a6ff" stroke-width="2.6" filter="url(#b)"/>', 60, 60);
  const streak = k.svg('<defs><linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#9a5cff" stop-opacity="0"/><stop offset=".7" stop-color="#c9a6ff"/><stop offset="1" stop-color="#fbf6ff"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation=".5"/></filter></defs><path d="M0,4 Q10,1.2 24,3 Q30,4 24,5 Q10,6.8 0,4Z" fill="url(#s)" filter="url(#b)"/>', 30, 8);
  // chain links: one seen face on, one edge on
  const linkA = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".35"/></filter></defs><rect x="1.5" y="1.5" width="15" height="9" rx="4.5" fill="none" stroke="#e6d6ff" stroke-width="2.2" filter="url(#b)"/>', 18, 12);
  const linkB = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".35"/></filter></defs><rect x="2" y="4" width="14" height="4" rx="2" fill="#d6bfff" filter="url(#b)"/>', 18, 12);
  // the clamp: a heavy ring cut with runes, and a second, finer ring inside it
  const clamp = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".7"/></filter></defs><g filter="url(#b)" fill="none" stroke="#e6d6ff" stroke-linecap="round"><circle cx="24" cy="24" r="18" stroke-width="5" stroke="#8a6ad0"/><circle cx="24" cy="24" r="18" stroke-width="1.4"/><circle cx="24" cy="24" r="13" stroke-width=".9" opacity=".8"/>' +
    '<path stroke-width="1.5" d="M24,3.5v4M24,40.5v4M3.5,24h4M40.5,24h4M9.5,9.5l2.8,2.8M35.7,35.7l2.8,2.8M38.5,9.5l-2.8,2.8M12.3,35.7l-2.8,2.8"/></g>', 48, 48);

  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  const grid = [];
  for (let t = 0; t <= 3500; t += 35) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3700, { transform: 'none' }]];
  // pulls: the beast heaves at its irons at these moments (ms, strength)
  const PULLS = [[480, 0.6], [780, 0.8], [1070, 1], [1300, 1.4]];
  const pull = (t) => { let a = 0; for (const [tt, s] of PULLS) if (t > tt - 60) a += s * Math.exp(-Math.max(0, t - tt) / 160) * (t < tt ? sm((t - tt + 60) / 60) : 1); return a; };
  const shake = (t) => { let a = 0; for (const [tt, s] of PULLS) if (t > tt) a += s * Math.exp(-(t - tt) / 220) * Math.sin((t - tt) / 22); return a; };
  const slam = (t) => (t > IMP ? Math.exp(-(t - IMP) / 300) * Math.sin((t - IMP) / 26) : 0);

  // ── the beast: heaves back at every pull, one great lunge, then slams down and is still
  const HEAD = curve([[0, 0], [380, 0], [520, 6], [700, 1], [820, 8], [980, 2], [1110, 10], [1330, 11], [REL + 60, 13], [IMP - 30, 12], [IMP + 90, -5], [2150, -1.6], [2700, 0.5], [3400, 0]]);
  act(k.part('head'), sample((t) => ({ transform: `rotate(${(HEAD(t) + shake(t) * 0.5 + slam(t) * 1.4).toFixed(2)}deg)` })));
  const BX = curve([[0, 0], [380, 0], [520, 1.2], [700, 0.2], [820, 1.6], [980, 0.3], [1110, 2.2], [1330, 2.6], [REL + 60, 3.2], [IMP, 2.8], [IMP + 120, -0.8], [2300, 0.2], [3200, 0]]);
  const BS = curve([[0, 1], [380, 1], [1100, 1.008], [REL + 60, 1.014], [IMP + 120, 0.992], [2400, 1.002], [3300, 1]]);
  act(k.part('beast'), sample((t) => ({ transform: `${k.T(-BX(t) * 0.5 + shake(t) * 0.25, slam(t) * 0.45)} rotate(${(-BX(t) * 0.18 + shake(t) * 0.06).toFixed(3)}deg) scale(${BS(t).toFixed(4)})` })));

  // ── the cuffs jolt with each pull; the chains rattle and go taut
  act(k.part('cuffs'), sample((t) => ({ transform: `${k.T(shake(t) * 0.4 - pull(t) * 0.3, slam(t) * 0.4)}` })));
  const CHR = (t) => shake(t) * 1.3 + slam(t) * 1.2;
  act(k.part('chains'), sample((t) => ({ transform: `${k.T(0, 0)} rotate(${CHR(t).toFixed(2)}deg) scale(${(1 + 0.008 * pull(t)).toFixed(4)}, 1)` })));

  // ── runes: go dark, then relight cuff by cuff as the light climbs; blaze at the wind-up and the release
  act(k.part('runes'), [[0, { opacity: 1 }, eio], [200, { opacity: 0.25 }, eio], [900, { opacity: 0.7 }, eio], [1150, { opacity: 1 }, eio], [REL, { opacity: 1 }, eio], [2200, { opacity: 0.7 }, eio], [3100, { opacity: 1 }]]);
  const CL = curve([[0, 0.2], [250, 0.05], [800, 0.55], [1150, 0.85], [REL, 1], [REL + 400, 0.6], [2200, 0.4], [3000, 0.12], [3500, 0]]);
  CUFFS.forEach(([x, y], i) => {
    const d = i * 120, sz = i === 1 ? 46 : 54;
    fx(k.lightIn('g-spirit', [x, y], sz, sz * 0.62), [...grid.filter((t) => t >= 35).map((t) => [t, { transform: `scale(${(0.7 + 0.5 * CL(Math.max(0, t - d))).toFixed(3)})`, opacity: +Math.min(1, CL(Math.max(0, t - d))).toFixed(3) }, 'linear']), [3700, { transform: 'scale(.7)', opacity: 0 }]]);
  });
  // the stakes' pools pulse as the chains are hauled on, and flare at the release
  act(k.part('pads'), [[0, { opacity: 1 }, eio], [250, { opacity: 0.45 }, eio], [520, { opacity: 1 }, 'ease-out'], [800, { opacity: 0.5 }, eio], [1070, { opacity: 1 }, 'ease-out'], [1300, { opacity: 0.6 }, eio], [REL + 60, { opacity: 1 }, 'ease-out'], [2300, { opacity: 0.8 }, eio], [3000, { opacity: 1 }]]);
  STAKES.forEach(([x, y], i) => {
    const kf = [];
    for (const [t, s] of PULLS) kf.push([t - 30 + i * 18, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t + 60 + i * 18, { transform: `scale(${(0.9 + 0.3 * s).toFixed(2)})`, opacity: 0.85 }, 'ease-out']);
    kf.push([REL + 60, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [REL + 500, { transform: 'scale(1)', opacity: 0.5 }, eio], [2400, { transform: 'scale(.8)', opacity: 0.25 }, eio], [3200, { transform: 'scale(.4)', opacity: 0 }]);
    // each pull's flash fades before the next (sorted already: the list above is in time order)
    const out = [kf[0]];
    for (let j = 1; j < kf.length; j++) { out.push(kf[j]); if (kf[j][1].opacity > 0 && j < 8 && j % 2 === 1) out.push([kf[j][0] + 180, { transform: 'scale(.8)', opacity: 0.1 }, 'ease-out']); }
    out.sort((a, b) => a[0] - b[0]);
    fx(k.lightIn('g-spirit', [x, y], 34, 14), out);
  });
  // light climbs each chain from its stake to its cuff, at every pull
  [[0, 1], [1, 2], [2, 3]].forEach(([si, ci]) => {
    const A = STAKES[si], B = CUFFS[ci - 1];
    for (let p = 0; p < PULLS.length; p++) {
      const t0 = PULLS[p][0] - 150 + si * 25;
      const kf = [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 60, { transform: 'scale(1)', opacity: 1 }, 'linear'], [t0 + 280, { transform: `${k.T(B[0] - A[0], B[1] - A[1] + 6)} scale(1)`, opacity: 0.9 }, 'linear'], [t0 + 340, { transform: `${k.T(B[0] - A[0], B[1] - A[1] + 6)} scale(.3)`, opacity: 0 }]];
      fx(k.picIn('spark', [A[0], A[1] - 2], 6, 6), kf);
    }
  });
  // sparks where the chains jerk at the beast's legs
  for (let i = 0; i < 18; i++) {
    const c = CUFFS[i % 3], pt = PULLS[i % 4][0] + 30 + Math.round(rand() * 80), a = -0.5 - rand() * 2.1, d = 5 + rand() * 12, sz = 2 + rand() * 2.4;
    fx(k.picIn(i % 2 ? 'spark' : 'mote', [c[0] + (rand() - 0.5) * 12, c[1] + 4], sz, sz), [[pt, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [pt + 60, { transform: `${k.T(Math.cos(a) * d * 0.3, Math.sin(a) * d * 0.3)} scale(1)`, opacity: 1 }, 'ease-out'], [pt + 450, { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d + 6)} scale(.3)`, opacity: 0 }]]);
  }
  // a violet wash over the whole picture as the rune-light climbs
  fx(k.lightIn('g-hexlit', [150, 150], 300, 100), [[200, { opacity: 0 }, 'ease-out'], [REL, { opacity: 0.8 }, 'ease-out'], [IMP + 300, { opacity: 0.55 }, eio], [3000, { opacity: 0 }]]);

  // ── the release: a chain of spectral links from every cuff to T, on the overlay
  const [OX, OY] = [0, 0];
  const along = (E, tex, t0, dur, lat, sx, sy, s0, s1, o, mode, linger = 0) => {
    const C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 30 - lat * 2];
    const bz = (t) => { const q = 1 - t; return [q * q * E[0] + 2 * q * t * C[0] + t * t * T[0], q * q * E[1] + 2 * q * t * C[1] + t * t * T[1]]; };
    const [X0, Y0] = k.P(...E), kf = [], n = 8;
    for (let j = 0; j <= n; j++) {
      const f = j / n, w = Math.pow(f, 0.9), q = bz(w), q2 = bz(Math.min(1, w + 0.02)), q1 = bz(Math.max(0, w - 0.02)), [x, y] = k.P(...q);
      const ang = (Math.atan2(q2[1] - q1[1], q2[0] - q1[0]) * 180) / Math.PI;
      kf.push([Math.round(t0 + dur * f), { transform: `translate(${(x - X0 + OX).toFixed(1)}px, ${(y - Y0 + OY + lat * Math.sin(Math.PI * w) * u * 0.5).toFixed(1)}px) rotate(${mode ? ang.toFixed(1) : 0}deg) scale(${(s0 + (s1 - s0) * f).toFixed(2)})`, opacity: j === 0 ? 0 : o }, 'linear']);
    }
    kf.push([Math.round(t0 + dur + 50 + linger), { ...kf.at(-1)[1], opacity: 0 }]);
    fx(k.pic(tex, E, sx, sy), kf);
  };
  CUFFS.forEach((E, ci) => {
    const lat = (ci - 1) * 10;
    for (let i = 0; i < 7; i++) along(E, i % 2 ? linkB : linkA, REL + ci * 30 + i * 38, FLY - 70 + i * 6, lat + (rand() - 0.5) * 4, 11, 7.5, 1, 1, 0.95, true, 180);
    along(E, streak, REL + ci * 30, FLY - 20, lat, 30, 8, 0.8, 1, 0.85, true, 60);
    along(E, 'spark', REL + ci * 30 + 10, FLY - 30, lat, 10, 10, 1, 1.2, 1, null, 40);
    fx(k.light('g-spirit', E, 36), [[REL - 80 + ci * 30, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [REL + 30 + ci * 30, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [REL + 380, { transform: 'scale(.9)', opacity: 0.3 }, eio], [REL + 700, { transform: 'scale(.5)', opacity: 0 }]]);
  });
  for (let i = 0; i < 12; i++) along(CUFFS[i % 3], i % 2 ? 'spark' : 'mote', REL + 10 + Math.round(rand() * 240), FLY - 60 + Math.round(rand() * 120), (rand() - 0.5) * 18, 4 + rand() * 4, 4 + rand() * 4, 1, 0.5, 0.95, null, 120);

  // ── where it lands (BEATS.impact): the clamp closes
  fx(k.pic(clamp, T, 40, 40), [[IMP - 90, { transform: 'rotate(-70deg) scale(2.2)', opacity: 0 }, 'ease-in'], [IMP - 40, { transform: 'rotate(-55deg) scale(1.9)', opacity: 0.9 }, 'ease-in'], [IMP + 60, { transform: 'rotate(0deg) scale(.92)', opacity: 1 }, 'ease-out'], [IMP + 160, { transform: 'rotate(0deg) scale(1)', opacity: 1 }, eio],
    [2400, { transform: 'rotate(40deg) scale(1.02)', opacity: 0.9 }, eio], [3000, { transform: 'rotate(70deg) scale(1.05)', opacity: 0.6 }, eio], [3400, { transform: 'rotate(80deg) scale(1.1)', opacity: 0 }]]);
  fx(k.pic(clamp, T, 28, 28), [[IMP - 60, { transform: 'rotate(60deg) scale(2)', opacity: 0 }, 'ease-in'], [IMP, { transform: 'rotate(40deg) scale(1.6)', opacity: 0.8 }, 'ease-in'], [IMP + 90, { transform: 'rotate(0deg) scale(.9)', opacity: 1 }, 'ease-out'], [IMP + 200, { transform: 'rotate(-6deg) scale(1)', opacity: 1 }, eio],
    [2400, { transform: 'rotate(-40deg) scale(1.02)', opacity: 0.85 }, eio], [3000, { transform: 'rotate(-70deg) scale(1.05)', opacity: 0.5 }, eio], [3400, { transform: 'rotate(-80deg) scale(1.1)', opacity: 0 }]]);
  fx(k.light('g-spirit', T, 62), [[IMP - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 70, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [IMP + 280, { transform: 'scale(.9)', opacity: 0.7 }, eio], [IMP + 600, { transform: 'scale(1.05)', opacity: 0.75 }, eio], [IMP + 1000, { transform: 'scale(.9)', opacity: 0.45 }, eio], [3100, { transform: 'scale(.6)', opacity: 0 }]]);
  [[60, 3.2, 0.9], [200, 4.6, 0.55]].forEach(([d, big, o]) => fx(k.pic(ring, T, 30, 30, { low: true }), [[IMP + d, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + d + 40, { transform: 'scale(.6)', opacity: o }, 'ease-out'], [IMP + d + 700, { transform: `scale(${big})`, opacity: 0 }]]));
  // links and sparks thrown off by the closing, and gloom boiling up from the lock
  for (let i = 0; i < 8; i++) {
    const a = rand() * Math.PI * 2, d = 12 + rand() * 18, t0 = IMP + 20 + Math.round(rand() * 100), r = Math.round(rand() * 180);
    fx(k.pic(i % 2 ? linkA : linkB, T, 9, 6), [[t0, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.6)`, opacity: 0 }, 'ease-out'], [t0 + 80, { transform: `${k.T(Math.cos(a) * d * 0.5, Math.sin(a) * d * 0.5)} rotate(${r + 60}deg) scale(1)`, opacity: 1 }, 'ease-out'], [t0 + 650, { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d + 10)} rotate(${r + 200}deg) scale(.8)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 18; i++) {
    const a = rand() * Math.PI * 2, d = 10 + rand() * 22, t0 = IMP + Math.round(rand() * 140), sz = 3 + rand() * 4;
    fx(k.pic(i % 3 ? 'mote' : 'spark', T, sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 90, { transform: `${k.T(Math.cos(a) * d * 0.4, Math.sin(a) * d * 0.4)} scale(1)`, opacity: 1 }, 'ease-out'], [t0 + 800 + Math.round(rand() * 400), { transform: `${k.T(Math.cos(a) * d * 0.9, Math.sin(a) * d * 0.5 - 14 - rand() * 12)} scale(.3)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 5; i++) {
    const t = IMP + 150 + i * 190, r = Math.round(rand() * 360);
    fx(k.pic('gloom', [T[0] + (rand() - 0.5) * 16, T[1] - 2], 30, 30, { lit: false, low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 320, { transform: `${k.T(-2, -10)} rotate(${r + 20}deg) scale(1)`, opacity: 0.55 }], [t + 1300, { transform: `${k.T(-6, -34)} rotate(${r + 50}deg) scale(1.8)`, opacity: 0 }]]);
  }
}
