// Venom Shard: the crystal hanging over the palm swells with poison, turns on its target,
// and is flung; where it lands, the poison bursts; a new shard grows from the pool in the palm.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker (the suggestion kept: Venom, it
// poisons what it hits), element: venom (the card's suggestion kept: green poison, black crystal).
// Alone, T = the far right (268, 128), beyond the palm.
//   0-800     the gathering: the shard sinks a little toward the palm (anticipation), then lifts and
//             swells with green light; the pool in the palm brims; drops fall from its point into
//             the pool, rippling it; fumes curl up thicker.
//   800-1300  it turns, point toward T (a shiver of overshoot), drawing back from its target; the
//             hand cups round it; green light climbs the seams.
//   1300      RELEASE: it is let go: the crystal flashes, a ring of green light, the hand kicks back
//             away from T, and the shard flies on the overlay in a straight line to T, spinning off
//             drops and fumes behind it.
//   1700      IMPACT at T: a flash, two rings, a splash of poison thrown out in drops, a cloud of
//             green fume boiling up and hanging.
//   1900-3300 the hand settles; the pool is dark, then wells again; a new shard grows from it, lifts
//             to its place and drips; the cloud at T thins.
//   3500      at rest as drawn (BEATS.settle); the move ends at END.
// Contract: T = k.aim or its own; the shard turns to T and flies from `emit` along a straight line
// worked out from `emit` and T; the hand kicks back from T.
export const END = 4200;
export const BEATS = { release: 1300, impact: 1700, settle: 3500 };
export const STILLS = [300, 700, 1100, 1310, 1500, 1750, 2500, 3900];

export const textures = {
  spark: [32, 32, (x, y) => { const dx = Math.abs(x - 0.5) * 2, dy = Math.abs(y - 0.5) * 2, c = Math.max(0, 1 - Math.hypot(dx, dy)), cr = Math.max(0, 1 - Math.min(dx * 7 + dy, dy * 7 + dx)), v = Math.min(1, c * c * 1.6 + cr * 0.8); return [170 + 70 * v, 255, 130 + 100 * v, v]; }],
  fume: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r), n = 0.75 + 0.25 * Math.sin(x * 17 + y * 11); return [120 + 60 * c, 225, 100 + 50 * c, Math.min(1, c * c * 1.5 * n)]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, E = S.emit, TIP = S.tip, POOL = S.pool;
  const T = k.aim || S.alone;
  const REL = 1300, FLY = 400, IMP = REL + FLY;
  k.css(`.g-venom { border-radius: 50%; background: radial-gradient(closest-side, rgba(236,255,214,.95), rgba(150,255,110,.6) 28%, rgba(80,220,70,.24) 58%, rgba(60,200,60,0) 100%); }
    .g-miasma { border-radius: 50%; background: radial-gradient(closest-side, rgba(170,255,130,.42), rgba(100,220,80,.22) 50%, rgba(80,200,70,.08) 75%, rgba(60,200,60,0) 100%); }`);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1"/></filter></defs><circle cx="30" cy="30" r="25" fill="none" stroke="#9dff7a" stroke-width="2.6" filter="url(#b)"/>', 60, 60);
  const drop = k.svg('<defs><radialGradient id="d" cx=".4" cy=".6" r=".7"><stop offset="0" stop-color="#f2ffe0"/><stop offset=".5" stop-color="#a8ff7a"/><stop offset="1" stop-color="#4cc03a"/></radialGradient></defs><path d="M5,0 Q8,6 8,9 A3.4,3.4 0 1,1 2,9 Q2,6 5,0Z" fill="url(#d)"/>', 10, 14);
  // the shard in flight: its point to the right
  const bolt = k.svg('<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#1a1226"/><stop offset="1" stop-color="#0a0610"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation=".6"/></filter></defs>' +
    '<path d="M2,8.5 L18,0.8 L82,4.6 L100,8.5 L82,12.4 L18,16.2Z" fill="url(#g)" stroke="#9dff7a" stroke-width="1.1" stroke-linejoin="round" filter="url(#b)"/><path d="M26,6 L36,10 L46,7.4 L58,10.6" fill="none" stroke="#c8ff9a" stroke-width=".9"/>', 102, 17);
  const streak = k.svg('<defs><linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#4cc03a" stop-opacity="0"/><stop offset=".7" stop-color="#9dff7a"/><stop offset="1" stop-color="#f2ffe0"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation=".5"/></filter></defs><path d="M0,4 Q10,1.2 24,3 Q30,4 24,5 Q10,6.8 0,4Z" fill="url(#s)" filter="url(#b)"/>', 30, 8);

  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  const grid = [];
  for (let t = 0; t <= 3500; t += 35) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3700, { transform: 'none' }]];

  // ── the aim: the shard's point (down at rest, 99.65 degrees from +x) is turned to T
  const A0 = (Math.atan2(TIP[1] - S.butt[1], TIP[0] - S.butt[0]) * 180) / Math.PI;
  const A1 = (Math.atan2(T[1] - E[1], T[0] - E[0]) * 180) / Math.PI;
  const D = ((A1 - A0 + 540) % 360) - 180;
  const ux = Math.cos((A1 * Math.PI) / 180), uy = Math.sin((A1 * Math.PI) / 180);

  // ── the shard: sinks, lifts and swells, turns on T drawing back, is let go (and hidden: the bolt takes over), grows anew from the pool
  const tf = (x, y, r, s) => `translate(${(x * u).toFixed(1)}px, ${(y * u).toFixed(1)}px) rotate(${r.toFixed(2)}deg) scale(${s.toFixed(3)})`;
  const DY = curve([[0, 0], [200, 0], [560, 3], [900, -6], [1100, -3], [1300, -3]]);
  const ROT = curve([[0, 0], [900, 0], [1030, D * 1.06], [1130, D * 0.97], [1250, D]]);
  const PB = curve([[0, 0], [900, 0], [1030, 7], [1300, 7]]);
  const SC = curve([[0, 1], [560, 0.985], [900, 1.05], [1300, 1.06]]);
  const sh = [];
  for (let t = 0; t <= 1300; t += 35) sh.push([t, { transform: tf(-ux * PB(t), DY(t) - uy * PB(t), ROT(t), SC(t)), opacity: 1 }, 'linear']);
  sh.push([1350, { transform: tf(ux * 3, -3 + uy * 3, D, 1.1), opacity: 0 }, 'ease-out'], [1360, { transform: tf(0, 80, 0, 0.35), opacity: 0 }], [2000, { transform: tf(0, 80, 0, 0.35), opacity: 0 }, 'ease-out'],
    [2750, { transform: tf(0, -5, 0, 1.05), opacity: 1 }, eio], [3100, { transform: 'none', opacity: 1 }]);
  act(k.part('shard'), sh);

  // ── the hand: cups round the shard, kicks back from T at the release, settles
  const HK = curve([[0, 0], [500, 0.4], [1100, 0.9], [1290, 1], [REL + 80, -2.2], [REL + 260, -1], [2000, 0.3], [2600, -0.1], [3300, 0]]);
  const HR = curve([[0, 0], [500, 0.2], [1100, 0.7], [1290, 0.9], [REL + 80, -1.4], [REL + 300, -0.5], [2200, 0.2], [3300, 0]]);
  act(k.part('hand'), sample((t) => ({ transform: `${k.T(-ux * HK(t) * 0.9, 0.3 * HK(t) - uy * HK(t) * 0.9)} rotate(${(-HR(t) * Math.sign(ux || 1)).toFixed(2)}deg)` })));

  // ── the pool: brims as the poison gathers, is spent at the release, wells again
  const PW = curve([[0, 1], [400, 1.08], [1100, 1.2], [1290, 1.25], [REL + 60, 0.5], [REL + 220, 0.15], [1900, 0.2], [2400, 0.9], [2800, 1.15], [3200, 1]]);
  const PO = curve([[0, 1], [1290, 1], [REL + 120, 0.3], [1900, 0.35], [2600, 1]]);
  act(k.part('pool'), sample((t) => ({ transform: `scale(${PW(t).toFixed(3)}, ${(1 + (PW(t) - 1) * 0.6).toFixed(3)})`, opacity: +PO(t).toFixed(3) })));
  const GL = curve([[0, 0.1], [500, 0.35], [1100, 0.8], [1290, 1], [REL + 60, 0.25], [REL + 300, 0], [2100, 0], [2700, 0.45], [3000, 0.3], [3500, 0]]);
  fx(k.lightIn('g-venom', [E[0], E[1] + 4], 80, 120), [...grid.filter((t) => t >= 35).map((t) => [t, { transform: `scale(${(0.8 + 0.35 * GL(t)).toFixed(3)})`, opacity: +(GL(t) * 0.85).toFixed(3) }, 'linear']), [3700, { transform: 'scale(.8)', opacity: 0 }]]);
  const PL = curve([[0, 0], [300, 0.4], [1100, 0.9], [1290, 1], [REL + 80, 0.2], [1900, 0], [2500, 0.7], [3000, 0.4], [3500, 0]]);
  fx(k.lightIn('g-venom', POOL, 46, 26), [...grid.filter((t) => t >= 35).map((t) => [t, { transform: `scale(${(0.8 + 0.4 * PL(t)).toFixed(3)})`, opacity: +(PL(t) * 0.9).toFixed(3) }, 'linear']), [3700, { transform: 'scale(.8)', opacity: 0 }]]);

  // ── drops falling from the point into the pool (gathering, and after it has grown anew), each rippling it
  const dropsAt = (t0s) => t0s.forEach((t0, i) => {
    const x = TIP[0] + (i % 2) * 1.2;
    fx(k.picIn(drop, [x, TIP[1] + 3], 3.2, 4.4), [[t0, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t0 + 120, { transform: 'scale(1)', opacity: 1 }, 'ease-in'], [t0 + 440, { transform: `${k.T(POOL[0] - x, POOL[1] - TIP[1] - 4)} scale(.9)`, opacity: 1 }, 'linear'], [t0 + 470, { transform: `${k.T(POOL[0] - x, POOL[1] - TIP[1] - 2)} scale(.3)`, opacity: 0 }]]);
    fx(k.picIn(ring, [POOL[0] + (i % 2) * 2, POOL[1]], 20, 8, { low: true }), [[t0 + 440, { transform: 'scale(.2, .15)', opacity: 0 }, 'ease-out'], [t0 + 480, { transform: 'scale(.4, .25)', opacity: 0.8 }, 'ease-out'], [t0 + 880, { transform: 'scale(1.2, .8)', opacity: 0 }]]);
  });
  dropsAt([150, 520, 800, 1030]);
  dropsAt([2900, 3250]);

  // ── fumes curling up from the shard and the pool, thicker as the poison gathers; a cloud boils off at the release
  for (let i = 0; i < 12; i++) {
    const t0 = 100 + Math.round(rand() * 1050), x = E[0] - 14 + rand() * 30, y = POOL[1] - 4 - rand() * 10, r = Math.round(rand() * 360);
    fx(k.picIn('fume', [x, y], 16, 16, { lit: false }), [[t0, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 450, { transform: `${k.T((rand() - 0.5) * 8, -26)} rotate(${r + 25}deg) scale(1)`, opacity: 0.45 }], [t0 + 1500, { transform: `${k.T((rand() - 0.5) * 18, -80)} rotate(${r + 60}deg) scale(1.9)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 6; i++) {
    const t0 = 2300 + Math.round(rand() * 500), x = E[0] - 10 + rand() * 24, r = Math.round(rand() * 360);
    fx(k.picIn('fume', [x, POOL[1] - 6], 14, 14, { lit: false }), [[t0, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 400, { transform: `${k.T(0, -22)} rotate(${r + 25}deg) scale(1)`, opacity: 0.4 }], [t0 + 1200, { transform: `${k.T((rand() - 0.5) * 12, -60)} rotate(${r + 50}deg) scale(1.7)`, opacity: 0 }]]);
  }
  // light and sparks climbing the seams as it turns
  for (let i = 0; i < 14; i++) {
    const t0 = 700 + Math.round(rand() * 550), y = 52 + rand() * 80, x = 176 + (159 - 176) * ((y - 40) / 100) + (rand() - 0.5) * 8, sz = 2.4 + rand() * 2.6;
    fx(k.picIn(i % 2 ? 'spark' : 'fume', [x, y], sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 120, { transform: `${k.T(0, -2)} scale(1)`, opacity: 0.95 }, 'ease-out'], [t0 + 620, { transform: `${k.T((rand() - 0.5) * 8, -20 - rand() * 12)} scale(.3)`, opacity: 0 }]]);
  }

  // ── the release: the crystal flashes, a ring of light, the bolt flies to T
  fx(k.light('g-venom', E, 90), [[REL - 70, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [REL + 20, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [REL + 280, { transform: 'scale(1)', opacity: 0.35 }, eio], [REL + 700, { transform: 'scale(.6)', opacity: 0 }]]);
  fx(k.pic(ring, E, 40, 40, { low: true }), [[REL, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [REL + 40, { transform: 'scale(.7)', opacity: 0.9 }, 'ease-out'], [REL + 600, { transform: 'scale(3)', opacity: 0 }]]);
  fx(k.lightIn('g-miasma', [150, 110], 300, 190), [[300, { opacity: 0 }, 'ease-out'], [REL, { opacity: 0.55 }, 'ease-out'], [IMP + 300, { opacity: 0.35 }, eio], [3000, { opacity: 0 }]]);
  const [X0, Y0] = k.P(...E);
  const pos = (f, lat = 0) => { const x = E[0] + (T[0] - E[0]) * f - uy * lat * Math.sin(Math.PI * f), y = E[1] + (T[1] - E[1]) * f + ux * lat * Math.sin(Math.PI * f), [px, py] = k.P(x, y); return `translate(${(px - X0).toFixed(1)}px, ${(py - Y0).toFixed(1)}px)`; };
  const flight = (tex, t0, dur, lat, sx, sy, s0, s1, o, rot, linger = 0, back = 0) => {
    const kf = [], n = 6;
    for (let j = 0; j <= n; j++) { const f = j / n; kf.push([Math.round(t0 + dur * f), { transform: `${pos(Math.pow(f, 0.85), lat)} rotate(${rot === 'aim' ? A1.toFixed(1) : (rot * f).toFixed(0)}deg) scale(${(s0 + (s1 - s0) * f).toFixed(2)})`, opacity: j === 0 ? 0 : o }, 'linear']); }
    kf.push([Math.round(t0 + dur + 40 + linger), { ...kf.at(-1)[1], opacity: 0 }]);
    fx(k.pic(tex, E, sx, sy), kf);
    void back;
  };
  // the bolt itself: begins as big as the shard, narrowing as it goes
  flight(bolt, REL, FLY, 0, 100, 17, 1, 0.55, 1, 'aim', 40);
  for (let i = 0; i < 6; i++) flight(streak, REL + 20 + i * 30, FLY - 40, (rand() - 0.5) * 8, 32, 8, 0.9, 1.1, 0.85, 'aim', 60);
  for (let i = 0; i < 12; i++) flight(i % 3 ? 'spark' : drop, REL + 10 + Math.round(rand() * 260), FLY - 60 + Math.round(rand() * 90), (rand() - 0.5) * 20, 4 + rand() * 4, 4 + rand() * 5, 1, 0.5, 0.95, Math.round(rand() * 180), 160);
  for (let i = 0; i < 6; i++) flight('fume', REL + 40 + i * 50, FLY - 40, (rand() - 0.5) * 8, 14, 14, 0.8, 1.5, 0.55, Math.round(rand() * 120), 250);
  const lt = [];
  for (let j = 0; j <= 8; j++) { const f = j / 8; lt.push([Math.round(REL + FLY * f), { transform: `${pos(f)} scale(${(1.1 - 0.3 * f).toFixed(2)})`, opacity: j === 0 ? 0 : 0.9 }, 'linear']); }
  lt.push([IMP + 80, { ...lt.at(-1)[1], opacity: 0 }]);
  fx(k.light('g-venom', E, 40), lt);

  // ── where it lands (BEATS.impact): the poison bursts
  fx(k.light('g-venom', T, 66), [[IMP - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 60, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [IMP + 280, { transform: 'scale(.9)', opacity: 0.7 }, eio], [IMP + 600, { transform: 'scale(1.05)', opacity: 0.7 }, eio], [IMP + 1100, { transform: 'scale(.9)', opacity: 0.4 }, eio], [3300, { transform: 'scale(.6)', opacity: 0 }]]);
  fx(k.light('g-miasma', T, 110), [[IMP, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IMP + 400, { transform: 'scale(1)', opacity: 0.9 }, 'ease-out'], [2600, { transform: 'scale(1.1)', opacity: 0.6 }, eio], [3500, { transform: 'scale(1.3)', opacity: 0 }]]);
  [[0, 3.2, 0.9], [150, 4.6, 0.55]].forEach(([d, big, o]) => fx(k.pic(ring, T, 30, 30, { low: true }), [[IMP + d, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + d + 40, { transform: 'scale(.6)', opacity: o }, 'ease-out'], [IMP + d + 700, { transform: `scale(${big})`, opacity: 0 }]]));
  // the splash: drops thrown out, falling with gravity
  for (let i = 0; i < 18; i++) {
    const a = rand() * Math.PI * 2, d = 12 + rand() * 24, t0 = IMP + Math.round(rand() * 70), sz = 3.2 + rand() * 3.6, rr = Math.round(Math.atan2(Math.sin(a), Math.cos(a)) * 57.3 - 90);
    const px = Math.cos(a) * d, py = Math.sin(a) * d * 0.7 - 6;
    fx(k.pic(drop, T, sz, sz * 1.4), [[t0, { transform: `translate(0px, 0px) rotate(${rr}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 100, { transform: `${k.T(px * 0.6, py * 0.6)} rotate(${rr}deg) scale(1)`, opacity: 1 }, 'ease-out'], [t0 + 320, { transform: `${k.T(px, py)} rotate(${rr + 40}deg) scale(.95)`, opacity: 1 }, 'ease-in'], [t0 + 650 + Math.round(rand() * 250), { transform: `${k.T(px * 1.2, py + 22 + rand() * 10)} rotate(${rr + 80}deg) scale(.5)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 14; i++) {
    const a = rand() * Math.PI * 2, d = 8 + rand() * 20, t0 = IMP + Math.round(rand() * 140), sz = 3 + rand() * 3;
    fx(k.pic(i % 2 ? 'spark' : 'fume', T, sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 90, { transform: `${k.T(Math.cos(a) * d * 0.4, Math.sin(a) * d * 0.4)} scale(1)`, opacity: 1 }, 'ease-out'], [t0 + 800 + Math.round(rand() * 400), { transform: `${k.T(Math.cos(a) * d * 0.9, Math.sin(a) * d * 0.5 - 16 - rand() * 12)} scale(.3)`, opacity: 0 }]]);
  }
  // the cloud: green fume boiling up and hanging, thinning away
  for (let i = 0; i < 7; i++) {
    const t = IMP + 60 + i * 150, r = Math.round(rand() * 360), x = T[0] + (rand() - 0.5) * 26;
    fx(k.pic('fume', [x, T[1] + 2], 28, 28, { lit: false, low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 350, { transform: `${k.T(-2, -12)} rotate(${r + 20}deg) scale(1)`, opacity: 0.6 }], [t + 1500, { transform: `${k.T((rand() - 0.5) * 16, -44)} rotate(${r + 50}deg) scale(2)`, opacity: 0 }]]);
  }
}
