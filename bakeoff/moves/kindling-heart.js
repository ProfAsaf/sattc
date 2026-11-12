// Kindling Heart: it never stops climbing, and then it lets go.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker, element: fire
// (as suggested: Unstable, a heart of molten stone whose fire keeps swelling).
//   0-1380    it gathers. The heart beats, each beat harder and closer than the last:
//             it swells about its point in the rock, the light in its split flares with
//             every beat and a heat ring leaves it; sparks are drawn in to the split
//             from the dark; it starts to tremble, and leans away from its target.
//   1380-1400 it clenches (anticipation): shrinks, leans right back, the light sucked
//             down to a point.
//   1400      RELEASE: it throws itself open and forward: a white flash at the split and
//             a ball of fire is flung out along a lob to T, trailing billows and sparks.
//   1700      IMPACT at T: a flash of light, a ring, a fire burst, flames left standing,
//             a scorch that smoulders, sparks thrown with gravity, smoke going up.
//   1450-3500 it recoils and shudders, aftershock beats fading, the heart glowing
//             back down to the way it is drawn; the scorch and flames die away.
//   3500      at rest as drawn (BEATS.settle); the move ends at END.
//
// The contract (bakeoff/recipe.md): T = k.aim, or its own spot (the dark ground to its
// right). Every point of the fireball's flight is worked out from the split
// (spec.emit) and T; the heart leans toward whichever side T is on.
export const END = 4200;
export const BEATS = { release: 1400, impact: 1700, settle: 3500 };
export const STILLS = [500, 1000, 1300, 1420, 1700, 1900, 2600, 3900];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, h = Math.max(0, 1 - r); return [255, 200 + 55 * h * h, 110 + 130 * h * h * h, Math.min(1, h * h * 1.8)]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const E0 = k.spec.emit, TIP = k.spec.tip;
  const T = k.aim || k.spec.alone;
  const dir = T[0] >= E0[0] ? 1 : -1;
  const REL = 1400, FLY = 300, IMP = REL + FLY;

  k.css(`.g-white { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,252,232,.98), rgba(255,226,150,.6) 30%, rgba(255,150,60,.2) 62%, rgba(255,120,40,0) 100%); }`);

  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  // a beat: a quick swell then a slow ease back
  const beat = (t, b) => (t < b ? 0 : t - b < 55 ? (t - b) / 55 : Math.exp(-(t - b - 55) / 120));
  const BEATS_IN = [[250, 0.03], [640, 0.04], [930, 0.055], [1150, 0.07], [1290, 0.08]];
  const BEATS_OUT = [[2000, 0.035], [2520, 0.022], [3000, 0.012]];
  const pulse = (t) => BEATS_IN.concat(BEATS_OUT).reduce((s, [b, a]) => s + a * beat(t, b), 0);
  const BASE = curve([[0, 1], [1290, 1], [1385, 0.915], [1400, 0.915], [1465, 1.14], [1620, 1.04], [1950, 0.975], [2500, 1.008], [3000, 1], [3500, 1]]);
  const LEAN = curve([[0, 0], [900, 0], [1385, -5 * dir], [1400, -5 * dir], [1470, 7 * dir], [1700, 3.5 * dir], [2200, -0.8 * dir], [2800, 0.2 * dir], [3500, 0]]);
  const tremble = (t) => (t > 700 && t < 1385 ? 0.9 * sm((t - 700) / 600) * Math.sin(t / 19) + 0.5 * sm((t - 700) / 600) * Math.sin(t / 31 + 1) : t > 1470 && t < 2300 ? 1.6 * Math.exp(-(t - 1470) / 380) * Math.sin(t / 22) : 0);
  const grid = [];
  for (let t = 0; t <= 3500; t += 35) grid.push(t);
  const heart = k.part('heart');
  act(heart, [...grid.map((t) => {
    const s = BASE(t) + pulse(t), sx = s + (t >= 1400 && t < 1700 ? 0.03 * Math.exp(-(t - 1400) / 100) : 0);
    return [t, { transform: `rotate(${(LEAN(t) + tremble(t)).toFixed(2)}deg) scale(${sx.toFixed(4)}, ${(s * (t > 1385 && t < 1480 ? 1 : 1 + (sx - 1) * 0.15)).toFixed(4)})` }, 'linear'];
  }), [3600, { transform: 'none' }]]);

  // ── the light in its split: it builds with every beat, is sucked down at the clench, flares at the release, dies back
  const GLOW = curve([[0, 0], [250, 0.15], [900, 0.45], [1290, 0.85], [1385, 0.25], [1400, 0.3], [1440, 1], [1700, 0.8], [2300, 0.35], [2900, 0.12], [3400, 0]]);
  const split = [E0[0], E0[1] + 6];
  fx(k.lightIn('g-warm', split, 130, 130), [...grid.filter((t) => t >= 100).map((t) => [t, { transform: `scale(${(0.7 + 0.4 * GLOW(t) + 0.5 * pulse(t) * 4).toFixed(3)})`, opacity: +Math.min(1, GLOW(t) * (1 + 1.5 * pulse(t))).toFixed(3) }, 'linear']), [3600, { transform: 'scale(.7)', opacity: 0 }]]);
  // a white-hot core: with each late beat, then the release flash
  const WH = curve([[1000, 0], [1250, 0.55], [1385, 0.15], [1420, 1], [1560, 0.55], [1900, 0], [2000, 0.15], [2150, 0]]);
  fx(k.lightIn('g-white', split, 80, 80), [...grid.filter((t) => t >= 1000 && t <= 2300).map((t) => [t, { transform: `scale(${(0.4 + 0.7 * WH(t)).toFixed(3)})`, opacity: +(WH(t) * (1 + pulse(t) * 1.5 > 1 ? 1 : 1)).toFixed(3) }, 'linear']), [2500, { transform: 'scale(.5)', opacity: 0 }]]);
  // the heat in the air round it: a warm wash
  fx(k.lightIn('g-warm', [150, 70], 200, 160), [[200, { opacity: 0 }, 'ease-out'], [1300, { opacity: 0.45 }, eio], [1440, { opacity: 0.8 }, 'ease-out'], [2300, { opacity: 0.2 }, eio], [3300, { opacity: 0 }]]);

  // ── heat rings leaving it with each beat (they grow with the beats), and the shock of the release
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1"/></filter></defs><circle cx="30" cy="30" r="25" fill="none" stroke="#ffc878" stroke-width="2.6" filter="url(#b)"/>', 60, 60);
  const ringAt = (t0, big, o, c = split, dur = 600) => fx(k.pic(ring, c, 40, 40, { low: true }), [[t0, { transform: 'scale(.55)', opacity: 0 }, 'ease-out'], [t0 + 40, { transform: 'scale(.8)', opacity: o }, 'ease-out'], [t0 + dur, { transform: `scale(${big})`, opacity: 0 }]]);
  BEATS_IN.forEach(([b, a], i) => ringAt(b, 1.2 + i * 0.25, 0.35 + 0.1 * i));
  BEATS_OUT.forEach(([b], i) => ringAt(b, 1.4 - i * 0.2, 0.3 - i * 0.07));
  ringAt(REL + 10, 3.4, 0.95, split, 700);
  ringAt(REL + 80, 2.2, 0.6, split, 560);

  // ── sparks drawn in to the split while it gathers
  for (let i = 0; i < 20; i++) {
    const t0 = 250 + Math.round(rand() * 950), a = rand() * Math.PI * 2, d = 40 + rand() * 40, sz = 3 + rand() * 3;
    const from = k.T(Math.cos(a) * d, Math.sin(a) * d * 0.8), dur = 260 + rand() * 120;
    fx(k.pic('spark', split, sz, sz), [[t0, { transform: `${from} scale(.4)`, opacity: 0 }, 'ease-in'], [t0 + 60, { transform: `${k.T(Math.cos(a) * d * 0.9, Math.sin(a) * d * 0.72)} scale(1)`, opacity: 0.9 }, 'ease-in'], [Math.round(t0 + dur), { transform: `${k.T(0, 0)} scale(.3)`, opacity: 0 }]]);
  }
  // flames licking higher from the split as it swells, and flaring up at the release
  const lick = (on, off, dx, w, h, hot) => {
    const L = [[on, { transform: 'scale(.5, .1)', opacity: 0 }, 'ease-out'], [on + 160, { transform: 'scale(1,1)', opacity: 0.9 * hot }, eio]];
    for (let t = on + 160, i = 0; (t += 90 + rand() * 60) < off; i++) L.push([Math.round(t), { transform: `translateY(${(-rand() * 2).toFixed(1)}px) scale(${(0.9 + (i % 2) * 0.22 - rand() * 0.06).toFixed(2)}, ${(1 + (i % 2 ? 0.18 : -0.1) + rand() * 0.1).toFixed(2)}) skewX(${((i % 2 ? 1 : -1) * (2 + rand() * 4)).toFixed(1)}deg)`, opacity: +(hot * (0.8 + rand() * 0.2)).toFixed(2) }, eio]);
    L.push([off, { transform: 'scale(.5, .1)', opacity: 0 }]);
    fx(k.picIn(rand() < 0.5 ? 'flame' : 'flame2', [split[0] + dx, split[1] + 2], w, h, { base: true }), L);
  };
  lick(700, 1385, -4, 12, 26, 0.7); lick(900, 1385, 4, 11, 30, 0.8); lick(1100, 1385, 0, 14, 36, 0.9);
  lick(1400, 2100, -6, 14, 40, 1); lick(1420, 2200, 6, 13, 36, 1); lick(1440, 2600, 0, 16, 46, 1);
  lick(2000, 2900, 0, 10, 24, 0.55);

  // ── the ball of fire, from the split to T: a lob, its head and a trail of billows and sparks
  const L = Math.hypot(T[0] - E0[0], T[1] - E0[1]), ang = (Math.atan2(T[1] - E0[1], T[0] - E0[0]) * 180) / Math.PI;
  const C = [(E0[0] + T[0]) / 2, (E0[1] + T[1]) / 2 - Math.min(26, 6 + L * 0.2)];
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
  along('puffHot', REL, FLY, 0, 42, 0.7, 1.05, 1, 40);        // the head
  along('puffHot', REL + 6, FLY - 10, 0, 24, 0.9, 0.8, 1, -30); // its hot heart
  along('spark', REL, FLY, 0, 14, 1.2, 1, 1, 0);
  for (let i = 0; i < 9; i++) along(i % 3 === 2 ? 'puffCool' : 'puff', REL + 20 + i * 24, FLY - 20 + i * 16, (rand() - 0.5) * 7, 20 + rand() * 6, 0.85, 0.5, 0.85, (rand() - 0.5) * 90, 3 + rand() * 4);
  for (let i = 0; i < 12; i++) along('spark', REL + 10 + Math.round(rand() * 180), FLY - 20 + Math.round(rand() * 110), (rand() - 0.5) * 16, 4 + rand() * 4, 1, 0.6, 0.95, 0, 5 + rand() * 12);
  // it leaves a hot streak in the air that cools
  const sk = k.svg(`<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#ffb04a" stop-opacity="0"/><stop offset=".6" stop-color="#ff9a3a" stop-opacity=".75"/><stop offset="1" stop-color="#fff0c0"/></linearGradient></defs><path d="M0,3 L${(L * 1.0).toFixed(1)},0.6 L${(L * 1.0).toFixed(1)},5.4 Z" fill="url(#g)"/>`, L, 6);
  fx(k.pic(sk, [(E0[0] + T[0]) / 2, (E0[1] + T[1]) / 2 - 3], L, 6, { low: true }), [[REL, { transform: `rotate(${ang.toFixed(1)}deg) scale(.1, .6)`, opacity: 0 }, 'ease-out'], [REL + 90, { transform: `rotate(${ang.toFixed(1)}deg) scale(.7, 1)`, opacity: 0.7 }, 'ease-out'], [IMP, { transform: `rotate(${ang.toFixed(1)}deg) scale(1, .8)`, opacity: 0.6 }, 'ease-in'], [IMP + 260, { transform: `rotate(${ang.toFixed(1)}deg) scale(1, .2)`, opacity: 0 }]]);

  // ── where it lands (BEATS.impact)
  const il = [[IMP - 50, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 40, { transform: 'scale(1.3)', opacity: 1 }]];
  for (let t = IMP + 170, i = 0; t < 2400; t += 120, i++) il.push([t, { transform: `scale(${i % 2 ? 1.12 : 0.94})`, opacity: i % 2 ? 0.85 : 0.6 }, eio]);
  il.push([3000, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.light('g-warm', T, 110), il);
  fx(k.light('g-white', T, 50), [[IMP - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 30, { transform: 'scale(1.3)', opacity: 1 }], [IMP + 260, { transform: 'scale(.8)', opacity: 0 }]]);
  ringAt(IMP, 2.4, 0.9, T, 620);
  ringAt(IMP + 90, 1.6, 0.6, T, 500);
  // the burst: billows thrown out flat and up
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI * (0.05 + 0.9 * (i / 7)) + (rand() - 0.5) * 0.3, d = 14 + rand() * 12, t0 = IMP + Math.round(rand() * 40), sz = 20 + rand() * 8;
    const P = (f, s, o) => ({ transform: `${k.T(Math.cos(a) * d * f * 1.3, Math.sin(a) * d * f * 0.7)} rotate(${Math.round(f * 60)}deg) scale(${s})`, opacity: o });
    fx(k.pic(i % 3 === 2 ? 'puffCool' : 'puffHot', T, sz, sz), [[t0, P(0, 0.3, 0), 'ease-out'], [t0 + 60, P(0.35, 0.9, 0.95), 'ease-out'], [t0 + 280, P(1, 1.3, 0.55)], [t0 + 520, P(1.2, 1.7, 0)]]);
  }
  for (let i = 0; i < 18; i++) {
    const a = -Math.PI * (0.04 + 0.92 * rand()), dist = 16 + rand() * 40, g = 14 + rand() * 16, sz = 3 + rand() * 4, t0 = IMP + Math.round(rand() * 50);
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * dist * f * 1.2, Math.sin(a) * dist * f + g * f * f)} scale(${sc})`, opacity: o });
    fx(k.pic('spark', T, sz, sz), [[t0, P(0, 0.6, 0), 'ease-out'], [t0 + 40, P(0.2, 1.1, 1), 'ease-out'], [t0 + 300, P(0.75, 0.9, 0.9), 'ease-in'], [Math.round(t0 + 560 + rand() * 200), P(1, 0.3, 0)]]);
  }
  // flames left standing, a scorch that smoulders, smoke going up
  for (let i = 0; i < 5; i++) {
    const x = T[0] + (i - 2) * 7 + (rand() - 0.5) * 3, on = IMP + 60 + i * 60, off = 2300 + rand() * 500;
    const F = [[on, { transform: 'scale(.6,.12)', opacity: 0 }, 'ease-out'], [on + 120, { transform: 'scale(1,1)', opacity: 0.95 }, eio]];
    for (let t = on + 120, j = 1; (t += 90 + rand() * 50) < off; j++) F.push([Math.round(t), { transform: `translateY(${(-rand() * 1.5).toFixed(1)}px) scale(${(1 - (j % 2 ? 0.08 : -0.08) - rand() * 0.06).toFixed(2)}, ${(1 + (j % 2 ? 0.14 : -0.14) + rand() * 0.1).toFixed(2)}) skewX(${((j % 2 ? 1 : -1) * (2 + rand() * 5)).toFixed(1)}deg)`, opacity: +(0.8 + rand() * 0.2).toFixed(2) }, eio]);
    F.push([Math.round(off + 280), { transform: 'scale(.5,.15)', opacity: 0 }]);
    fx(k.pic(i % 2 ? 'flame' : 'flame2', [x, T[1] + 5], 10 + rand() * 3, 16 + rand() * 12, { base: true }), F);
  }
  const sr = ((rand() - 0.5) * 16).toFixed(1), sc = (o, s) => ({ transform: `rotate(${sr}deg) scale(${s}, ${(s * 0.5).toFixed(2)})`, opacity: o });
  fx(k.pic('scorch1:char', T, 56, 56, { lit: false }), [[IMP, sc(0, 0.15), 'cubic-bezier(.2,.7,.4,1)'], [IMP + 260, sc(1, 1)], [2900, sc(1, 1), eio], [3500, sc(0, 1)]]);
  const gl = [[IMP, sc(0, 0.15), 'cubic-bezier(.2,.7,.4,1)'], [IMP + 260, sc(0.95, 1)]];
  for (let t = IMP + 400, i = 0; t < 2700; t += 140 + rand() * 90, i++) gl.push([Math.round(t), sc(i % 2 ? 1 : 0.55, 1), eio]);
  gl.push([3100, sc(0, 1)]);
  fx(k.pic('scorch1:glow', T, 56, 56), gl);
  for (let i = 0; i < 4; i++) {
    const t = IMP + 250 + i * 220, r = Math.round(rand() * 360), x = (rand() - 0.5) * 10;
    fx(k.pic('smoke', [T[0] + x, T[1] - 6], 28, 28, { lit: false, low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 320, { transform: `${k.T(-2, -12)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 1400, { transform: `${k.T(-8, -48)} rotate(${r + 50}deg) scale(2)`, opacity: 0 }]]);
  }
  // sparks and smoke leaving the heart's split after the throw
  for (let i = 0; i < 8; i++) {
    const t0 = REL + 80 + Math.round(rand() * 500), dx = (rand() - 0.5) * 50, dy = -(26 + rand() * 40), sz = 3 + rand() * 3;
    fx(k.pic('spark', split, sz, sz), [[t0, { transform: `${k.T(0, 0)} scale(.5)`, opacity: 0 }, 'ease-out'], [t0 + 60, { transform: `${k.T(dx * 0.1, dy * 0.15)} scale(1)`, opacity: 1 }, 'ease-out'], [t0 + 700, { transform: `${k.T(dx, dy)} scale(.3)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 3; i++) {
    const t = REL + 200 + i * 340, r = Math.round(rand() * 360);
    fx(k.pic('smoke', [split[0] + (rand() - 0.5) * 14, split[1] - 18], 30, 30, { lit: false, low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 360, { transform: `${k.T(0, -12)} rotate(${r + 20}deg) scale(1)`, opacity: 0.42 }], [t + 1500, { transform: `${k.T(-4, -46)} rotate(${r + 50}deg) scale(2)`, opacity: 0 }]]);
  }
}
