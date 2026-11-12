// Molten Core: the giant presses the core into his chest, and fires it.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker (Swift: it hits fast),
// element: earth (molten rock: the bolt is a flung lump of lava, the burst is stone and
// liquid fire; the card's suggestion kept).
//   0-1000    the hands dip, then lift the orb up the giant's chest toward the socket;
//             he draws a breath and leans back, the orb's light and the socket's swell,
//             sparks drawn in to the socket, the stone cracks brightening.
//   1050-1150 the core is pressed home: the orb shrinks into the socket, a white flash,
//             a ring; he heaves forward round it (the clench), his eyes flare.
//   1150-1500 the chest charges: the socket goes white, its cracks blaze, the whole stone lit.
//   1500      RELEASE: the socket spits the core out as a lob of molten rock, spinning, with
//             a tail of billows and sparks, to T; he recoils the other way, hands dropping.
//   1900      IMPACT at T: a flash, rings, liquid fire and stone thrown with gravity, a molten
//             pool and flames left standing, smoke rolling up.
//   1900-3500 he shudders and settles; the hands come back down; the orb forms again in them
//             and glows up to the way it is drawn; the socket cools, the scorch heals.
//   3600      at rest as drawn (BEATS.settle); the move ends at END.
//
// The contract (bakeoff/recipe.md): T = k.aim, or its own spot (the far right, beside him).
// The bolt's flight is worked out from the socket (spec.emit) and T; he recoils away from T.
export const END = 4200;
export const BEATS = { release: 1500, impact: 1900, settle: 3600 };
export const STILLS = [700, 1100, 1300, 1480, 1600, 1950, 2500, 3900];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, h = Math.max(0, 1 - r); return [255, 200 + 55 * h * h, 110 + 130 * h * h * h, Math.min(1, h * h * 1.8)]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, E0 = S.emit, SK = S.socket, OR = S.orb;
  const T = k.aim || S.alone;
  const dir = T[0] >= E0[0] ? 1 : -1;
  const REL = 1500, FLY = 400, IMP = REL + FLY;
  const LIFT = OR[1] - SK[1] - 3;                  // how far the orb goes up to reach the socket
  k.css(`.g-white { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,252,232,.98), rgba(255,226,150,.6) 30%, rgba(255,150,60,.2) 62%, rgba(255,120,40,0) 100%); }`);
  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  const grid = [];
  for (let t = 0; t <= 3500; t += 40) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3700, { transform: 'none' }]];
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1"/></filter></defs><circle cx="30" cy="30" r="25" fill="none" stroke="#ffc878" stroke-width="2.6" filter="url(#b)"/>', 60, 60);
  const ringAt = (t0, big, o, c, dur = 600) => fx(k.pic(ring, c, 40, 40, { low: true }), [[t0, { transform: 'scale(.55)', opacity: 0 }, 'ease-out'], [t0 + 40, { transform: 'scale(.8)', opacity: o }, 'ease-out'], [t0 + dur, { transform: `scale(${big})`, opacity: 0 }]]);
  // the lump of molten rock: a dark crust split by fire, white at its heart
  const rock = k.svg('<defs><radialGradient id="r" cx=".42" cy=".4" r=".62"><stop offset="0" stop-color="#ffffff"/><stop offset=".3" stop-color="#fff0b0"/><stop offset=".65" stop-color="#ff9a3a"/><stop offset="1" stop-color="#8a2a0c"/></radialGradient></defs><path d="M16,2 L25,6 L30,15 L27,25 L19,30 L9,28 L3,20 L4,9 L10,3 Z" fill="url(#r)"/><path d="M6,12 L13,15 L18,11 M17,22 L22,18 L27,21 M12,24 L14,19" fill="none" stroke="#7a240c" stroke-width="1.6" opacity=".8"/>', 32, 32);
  const shard = k.svg('<path d="M3,1 L11,5 L9,13 L1,10 Z" fill="#2a120a" stroke="#ff9a4a" stroke-width="1"/>', 12, 14);

  // ── the giant: draws a breath and leans back, heaves round the core, recoils from the shot, shudders, settles
  const LEAN = curve([[0, 0], [250, 0], [850, -1.2 * dir], [1040, -1.4 * dir], [1130, 1.6 * dir], [1480, 1.3 * dir], [1500, 0.6 * dir], [1570, -2.8 * dir], [1800, -1.2 * dir], [2300, 0.5 * dir], [2900, -0.1 * dir], [3500, 0]]);
  const SCL = curve([[0, 1], [250, 1], [900, 1.012], [1040, 1.014], [1130, 1.035], [1480, 1.03], [1500, 1.022], [1570, 0.985], [1900, 1.006], [2600, 1], [3500, 1]]);
  const TX = curve([[0, 0], [1480, 0], [1570, -3.2 * dir], [1800, -1.4 * dir], [2300, 0.3 * dir], [2900, 0], [3500, 0]]);
  const shud = (t) => (t > 1580 && t < 2500 ? 1.1 * Math.exp(-(t - 1580) / 330) * Math.sin(t / 21) : 0) + (t > IMP && t < 2500 ? 0.9 * Math.exp(-(t - IMP) / 260) * Math.sin(t / 17 + 2) : 0);
  act(k.part('giant'), sample((t) => ({ transform: `${k.T(TX(t) + shud(t) * 0.5, shud(t) * 0.35)} rotate(${(LEAN(t) + shud(t)).toFixed(2)}deg) scale(${SCL(t).toFixed(4)})` })));

  // ── the hands: dip, then lift the core up the chest; hold it home; let go and drop at the shot; come back down empty
  const HY = curve([[0, 0], [250, 0], [420, 3], [1000, -LIFT * 0.97], [1060, -LIFT], [1470, -LIFT], [1570, -LIFT * 0.4], [1900, 3], [2200, -1.5], [2500, 0.4], [3000, 0]]);
  act(k.part('hands'), sample((t) => ({ transform: `${k.T(TX(t) * 0.6 + shud(t) * 0.4, HY(t) + shud(t) * 0.3)} rotate(${(shud(t) * 0.4).toFixed(2)}deg)` })));

  // ── the orb: leads the hands up, is pressed home (it shrinks into the socket), forms again in the hands afterward
  const OY = curve([[0, 0], [250, 0], [420, 2], [1000, -LIFT - 1], [1060, -LIFT - 2]]);
  const OS = curve([[0, 1], [420, 1], [1000, 0.9], [1060, 0.8]]);
  const orb = k.part('orb');
  act(orb, [...grid.filter((t) => t <= 1060).map((t) => [t, { transform: `${k.T(0, OY(t))} scale(${OS(t).toFixed(3)})`, opacity: 1 }, 'linear']),
    [1110, { transform: `${k.T(0, -LIFT - 4)} scale(.4)`, opacity: 0.8 }, 'ease-in'], [1150, { transform: `${k.T(0, -LIFT - 4)} scale(.2)`, opacity: 0 }],
    [2150, { transform: `${k.T(0, 3)} scale(.4)`, opacity: 0 }, 'ease-out'], [2500, { transform: `${k.T(0, 0)} scale(.8)`, opacity: 0.8 }, 'ease-out'], [3200, { transform: 'none', opacity: 1 }]]);

  // ── the light: the orb's own, in the cup; the socket's, building then white at the press, then at the shot
  const SOCK = curve([[0, 0.12], [400, 0.3], [1000, 0.7], [1060, 0.9], [1120, 1], [1490, 0.95], [1510, 1], [1700, 0.55], [2400, 0.25], [3100, 0.08], [3500, 0.03]]);
  const flick = (t) => (t > 1100 && t < 2600 ? 0.07 * Math.sin(t / 53) : 0);
  fx(k.lightIn('g-warm', SK, 90, 90), [...grid.filter((t) => t >= 40).map((t) => [t, { transform: `scale(${(0.7 + 0.5 * SOCK(t)).toFixed(3)})`, opacity: +Math.min(1, SOCK(t) + flick(t)).toFixed(3) }, 'linear']), [3700, { transform: 'scale(.7)', opacity: 0 }]]);
  const WH = curve([[1030, 0], [1100, 1], [1180, 0.3], [1400, 0.4], [1490, 0.55], [1520, 1], [1700, 0.2], [1900, 0]]);
  fx(k.lightIn('g-white', SK, 34, 34), [...grid.filter((t) => t >= 1000 && t <= 2000).map((t) => [t, { transform: `scale(${(0.4 + 0.9 * WH(t)).toFixed(3)})`, opacity: +WH(t).toFixed(3) }, 'linear']), [2200, { transform: 'scale(.4)', opacity: 0 }]]);
  // the stone of his chest lit from the socket: a warm wash over all of him
  fx(k.lightIn('g-warm', [150, 100], 250, 200), [[300, { opacity: 0 }, 'ease-out'], [1100, { opacity: 0.3 }, 'ease-out'], [1500, { opacity: 0.55 }, 'ease-out'], [2000, { opacity: 0.35 }, eio], [3200, { opacity: 0 }]]);
  // eyes flare at the press
  S.eyes.forEach((e) => fx(k.lightIn('g-white', e, 18, 18), [[1080, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [1160, { transform: 'scale(1.2)', opacity: 0.95 }, eio], [1500, { transform: 'scale(1)', opacity: 0.8 }, eio], [1620, { transform: 'scale(1.3)', opacity: 1 }], [2300, { transform: 'scale(.6)', opacity: 0 }]]));
  // the orb reforming in the hands: a glow that grows with it
  fx(k.lightIn('g-warm', OR, 80, 80), [[2150, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [2700, { transform: 'scale(.9)', opacity: 0.8 }, eio], [3300, { transform: 'scale(1)', opacity: 0.45 }, eio], [3700, { transform: 'scale(1)', opacity: 0 }]]);

  // ── heat rings: with the press, and the shot
  ringAt(1090, 2.8, 0.9, SK, 700);
  ringAt(1170, 1.8, 0.55, SK, 600);
  ringAt(REL + 10, 3.6, 0.95, SK, 700);
  ringAt(REL + 80, 2.2, 0.6, SK, 560);
  // ── sparks drawn in to the socket while he gathers, and flung off at the press
  for (let i = 0; i < 20; i++) {
    const t0 = 400 + Math.round(rand() * 650), a = rand() * Math.PI * 2, d = 30 + rand() * 38, sz = 2.8 + rand() * 3;
    fx(k.pic('spark', SK, sz, sz), [[t0, { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d * 0.8)} scale(.4)`, opacity: 0 }, 'ease-in'], [t0 + 60, { transform: `${k.T(Math.cos(a) * d * 0.9, Math.sin(a) * d * 0.72)} scale(1)`, opacity: 0.9 }, 'ease-in'], [Math.round(t0 + 230 + rand() * 120), { transform: `${k.T(0, 0)} scale(.3)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 12; i++) {
    const t0 = 1090 + Math.round(rand() * 60), a = Math.PI * 2 * rand(), dist = 14 + rand() * 30, g = 8 + rand() * 14, sz = 3 + rand() * 3.5;
    fx(k.pic('spark', SK, sz, sz), [[t0, { transform: `${k.T(0, 0)} scale(.5)`, opacity: 0 }, 'ease-out'], [t0 + 40, { transform: `${k.T(Math.cos(a) * dist * 0.25, Math.sin(a) * dist * 0.25)} scale(1.1)`, opacity: 1 }, 'ease-out'], [t0 + 600, { transform: `${k.T(Math.cos(a) * dist, Math.sin(a) * dist + g)} scale(.3)`, opacity: 0 }]]);
  }
  // heat shimmering up off his shoulders and head while he holds the charge
  for (let i = 0; i < 4; i++) {
    const t = 1200 + i * 280, r = Math.round(rand() * 360), x = SK[0] + (rand() - 0.5) * 60;
    fx(k.pic('smoke', [x, 66], 30, 30, { lit: false, low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 300, { transform: `${k.T(0, -8)} rotate(${r + 20}deg) scale(1)`, opacity: 0.3 }], [t + 1300, { transform: `${k.T(2, -34)} rotate(${r + 50}deg) scale(1.9)`, opacity: 0 }]]);
  }

  // ── the lump of molten rock: out of the socket and along a lob to T, spinning, with billows and sparks behind
  const L = Math.hypot(T[0] - E0[0], T[1] - E0[1]), ang = (Math.atan2(T[1] - E0[1], T[0] - E0[0]) * 180) / Math.PI;
  const C = [(E0[0] + T[0]) / 2, (E0[1] + T[1]) / 2 - Math.min(30, 8 + L * 0.22)];
  const bz = (t) => { const q = 1 - t; return [q * q * E0[0] + 2 * q * t * C[0] + t * t * T[0], q * q * E0[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const [X0, Y0] = k.P(...E0);
  const along = (tex, t0, dur, lat, sz, sc0, sc1, o, spin = 0, drop = 0) => {
    const kf = [];
    for (let j = 0; j <= 8; j++) {
      const f = j / 8, w = Math.pow(f, 0.9), q = bz(w), [x, y] = k.P(...q), off = lat * Math.sin(Math.PI * w) * u + drop * f * f * u, s = sc0 + (sc1 - sc0) * f;
      kf.push([Math.round(t0 + dur * f), { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + off).toFixed(1)}px) rotate(${(spin * f).toFixed(0)}deg) scale(${s.toFixed(2)})`, opacity: j === 0 ? 0 : j === 8 ? 0.85 * o : o }, j < 8 ? 'linear' : 'ease-out']);
    }
    kf.push([Math.round(t0 + dur + 60), { ...kf.at(-1)[1], opacity: 0 }]);
    fx(k.pic(tex, E0, sz, sz), kf);
  };
  along(rock, REL, FLY, 0, 30, 0.55, 1.1, 1, 300 * dir);       // the core itself
  along('puffHot', REL, FLY, 0, 44, 0.7, 1.05, 1, 40);          // its glow
  along('spark', REL, FLY, 0, 16, 1.2, 1, 1, 0);
  for (let i = 0; i < 9; i++) along(i % 3 === 2 ? 'puffCool' : 'puff', REL + 20 + i * 24, FLY - 20 + i * 16, (rand() - 0.5) * 7, 20 + rand() * 6, 0.85, 0.5, 0.85, (rand() - 0.5) * 90, 3 + rand() * 4);
  for (let i = 0; i < 12; i++) along('spark', REL + 10 + Math.round(rand() * 180), FLY - 20 + Math.round(rand() * 110), (rand() - 0.5) * 16, 4 + rand() * 4, 1, 0.6, 0.95, 0, 5 + rand() * 12);
  for (let i = 0; i < 4; i++) along(shard, REL + 30 + i * 40, FLY - 30, (rand() - 0.5) * 12, 6 + rand() * 3, 1, 0.8, 0.9, 200 * (rand() - 0.5), 8 + rand() * 12);
  // the streak it leaves in the air
  const sk = k.svg(`<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#ffb04a" stop-opacity="0"/><stop offset=".6" stop-color="#ff9a3a" stop-opacity=".75"/><stop offset="1" stop-color="#fff0c0"/></linearGradient></defs><path d="M0,3.6 L${L.toFixed(1)},0.6 L${L.toFixed(1)},6.6 Z" fill="url(#g)"/>`, L, 7);
  fx(k.pic(sk, [(E0[0] + T[0]) / 2, (E0[1] + T[1]) / 2 - 4], L, 7, { low: true }), [[REL, { transform: `rotate(${ang.toFixed(1)}deg) scale(.1, .6)`, opacity: 0 }, 'ease-out'], [REL + 90, { transform: `rotate(${ang.toFixed(1)}deg) scale(.7, 1)`, opacity: 0.7 }, 'ease-out'], [IMP, { transform: `rotate(${ang.toFixed(1)}deg) scale(1, .8)`, opacity: 0.6 }, 'ease-in'], [IMP + 260, { transform: `rotate(${ang.toFixed(1)}deg) scale(1, .2)`, opacity: 0 }]]);
  // the shot kicks smoke and sparks out of the socket
  for (let i = 0; i < 8; i++) {
    const t0 = REL + 40 + Math.round(rand() * 400), a = -Math.PI * (0.1 + 0.8 * rand()), d = 14 + rand() * 34, sz = 3 + rand() * 3;
    fx(k.pic('spark', SK, sz, sz), [[t0, { transform: `${k.T(0, 0)} scale(.5)`, opacity: 0 }, 'ease-out'], [t0 + 60, { transform: `${k.T(Math.cos(a) * d * 0.15, Math.sin(a) * d * 0.15)} scale(1)`, opacity: 1 }, 'ease-out'], [t0 + 700, { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d + 18)} scale(.3)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 3; i++) {
    const t = REL + 120 + i * 300, r = Math.round(rand() * 360);
    fx(k.pic('smoke', [SK[0] + (rand() - 0.5) * 18, SK[1] - 6], 30, 30, { lit: false, low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 340, { transform: `${k.T(0, -12)} rotate(${r + 20}deg) scale(1)`, opacity: 0.4 }], [t + 1400, { transform: `${k.T(-3, -42)} rotate(${r + 50}deg) scale(2)`, opacity: 0 }]]);
  }

  // ── where it lands (BEATS.impact)
  const il = [[IMP - 50, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 40, { transform: 'scale(1.3)', opacity: 1 }]];
  for (let t = IMP + 170, i = 0; t < 2700; t += 120, i++) il.push([t, { transform: `scale(${i % 2 ? 1.12 : 0.94})`, opacity: i % 2 ? 0.85 : 0.6 }, eio]);
  il.push([3300, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.light('g-warm', T, 110), il);
  fx(k.light('g-white', T, 52), [[IMP - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 30, { transform: 'scale(1.3)', opacity: 1 }], [IMP + 260, { transform: 'scale(.8)', opacity: 0 }]]);
  ringAt(IMP, 2.6, 0.9, T, 640);
  ringAt(IMP + 90, 1.7, 0.6, T, 520);
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI * (0.05 + 0.9 * (i / 7)) + (rand() - 0.5) * 0.3, d = 14 + rand() * 12, t0 = IMP + Math.round(rand() * 40), sz = 20 + rand() * 8;
    const P = (f, s, o) => ({ transform: `${k.T(Math.cos(a) * d * f * 1.3, Math.sin(a) * d * f * 0.7)} rotate(${Math.round(f * 60)}deg) scale(${s})`, opacity: o });
    fx(k.pic(i % 3 === 2 ? 'puffCool' : 'puffHot', T, sz, sz), [[t0, P(0, 0.3, 0), 'ease-out'], [t0 + 60, P(0.35, 0.9, 0.95), 'ease-out'], [t0 + 280, P(1, 1.3, 0.55)], [t0 + 520, P(1.2, 1.7, 0)]]);
  }
  // liquid fire and stone thrown with gravity
  for (let i = 0; i < 18; i++) {
    const a = -Math.PI * (0.04 + 0.92 * rand()), dist = 16 + rand() * 44, g = 14 + rand() * 18, sz = 3 + rand() * 5, t0 = IMP + Math.round(rand() * 50);
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * dist * f * 1.2, Math.sin(a) * dist * f + g * f * f)} scale(${sc})`, opacity: o });
    fx(k.pic('spark', T, sz, sz), [[t0, P(0, 0.6, 0), 'ease-out'], [t0 + 40, P(0.2, 1.1, 1), 'ease-out'], [t0 + 320, P(0.75, 0.9, 0.9), 'ease-in'], [Math.round(t0 + 580 + rand() * 200), P(1, 0.3, 0)]]);
  }
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI * (0.1 + 0.8 * rand()), dist = 18 + rand() * 34, g = 24 + rand() * 18, sz = 5 + rand() * 4, t0 = IMP + Math.round(rand() * 40), spin = Math.round((rand() - 0.5) * 540);
    const P = (f, o) => ({ transform: `${k.T(Math.cos(a) * dist * f * 1.2, Math.sin(a) * dist * f + g * f * f)} rotate(${Math.round(spin * f)}deg) scale(1)`, opacity: o });
    fx(k.pic(shard, T, sz, sz * 1.15), [[t0, P(0, 0), 'ease-out'], [t0 + 30, P(0.1, 1), 'ease-out'], [t0 + 500, P(0.85, 1), 'ease-in'], [t0 + 640, P(1, 0)]]);
  }
  // a molten pool and flames left standing, smoke going up
  for (let i = 0; i < 5; i++) {
    const x = T[0] + (i - 2) * 7 + (rand() - 0.5) * 3, on = IMP + 60 + i * 60, off = 2700 + rand() * 500;
    const F = [[on, { transform: 'scale(.6,.12)', opacity: 0 }, 'ease-out'], [on + 120, { transform: 'scale(1,1)', opacity: 0.95 }, eio]];
    for (let t = on + 120, j = 1; (t += 90 + rand() * 50) < off; j++) F.push([Math.round(t), { transform: `translateY(${(-rand() * 1.5).toFixed(1)}px) scale(${(1 - (j % 2 ? 0.08 : -0.08) - rand() * 0.06).toFixed(2)}, ${(1 + (j % 2 ? 0.14 : -0.14) + rand() * 0.1).toFixed(2)}) skewX(${((j % 2 ? 1 : -1) * (2 + rand() * 5)).toFixed(1)}deg)`, opacity: +(0.8 + rand() * 0.2).toFixed(2) }, eio]);
    F.push([Math.round(off + 280), { transform: 'scale(.5,.15)', opacity: 0 }]);
    fx(k.pic(i % 2 ? 'flame' : 'flame2', [x, T[1] + 5], 10 + rand() * 3, 16 + rand() * 12, { base: true }), F);
  }
  const sr = ((rand() - 0.5) * 16).toFixed(1), sc = (o, s) => ({ transform: `rotate(${sr}deg) scale(${s}, ${(s * 0.5).toFixed(2)})`, opacity: o });
  fx(k.pic('scorch1:char', T, 60, 60, { lit: false }), [[IMP, sc(0, 0.15), 'cubic-bezier(.2,.7,.4,1)'], [IMP + 260, sc(1, 1)], [3200, sc(1, 1), eio], [3750, sc(0, 1)]]);
  const gl = [[IMP, sc(0, 0.15), 'cubic-bezier(.2,.7,.4,1)'], [IMP + 260, sc(0.95, 1)]];
  for (let t = IMP + 400, i = 0; t < 3000; t += 140 + rand() * 90, i++) gl.push([Math.round(t), sc(i % 2 ? 1 : 0.55, 1), eio]);
  gl.push([3500, sc(0, 1)]);
  fx(k.pic('scorch1:glow', T, 60, 60), gl);
  for (let i = 0; i < 4; i++) {
    const t = IMP + 250 + i * 190, r = Math.round(rand() * 360), x = (rand() - 0.5) * 10;
    fx(k.pic('smoke', [T[0] + x, T[1] - 6], 30, 30, { lit: false, low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 320, { transform: `${k.T(-2, -12)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 1400, { transform: `${k.T(-8, -48)} rotate(${r + 50}deg) scale(2)`, opacity: 0 }]]);
  }
}
