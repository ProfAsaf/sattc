// Blood Pact: the price is paid, and the pact gives.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support (the suggestion was
// attacker: but the card's text is an Invest, a cost paid now for a gift later; nobody
// is struck), element: blood. The gift (a ribbon of red light) goes to T = k.aim, or,
// alone, up into the sky on the right (226, 44).
//   0-1200    the clasp tightens: the hands squeeze in a double heartbeat that grows,
//             the red thread swells and glows with each beat, a ring of red light
//             runs out of the clasp at each; the candle flames duck and gutter.
//   780-1260  three drops of blood fall from the clasp onto the altar (the Life
//             paid: 3), each splashing as a flat ring of red light on its face.
//   1300      RELEASE: the thread snaps taut, then dims; the gift is lifted out of the
//             clasp as a ribbon of red light with sparks, along an arc to T.
//   1700      IMPACT: it blooms at T: a flash, two rings, a swell of red light and
//             motes rising; the sky glows red for a moment.
//   1800-3400 the hands loosen, the thread's light returns, the candles flare back up
//             (the pact sealed) and burn as drawn.
//   3500      at rest as drawn (BEATS.settle); the move ends at END.
export const END = 4000;
export const BEATS = { release: 1300, impact: 1700, settle: 3500 };
export const STILLS = [350, 700, 1000, 1280, 1500, 1750, 2300, 3700];

export const textures = {
  spark: [32, 32, (x, y) => { const dx = Math.abs(x - 0.5) * 2, dy = Math.abs(y - 0.5) * 2, c = Math.max(0, 1 - Math.hypot(dx, dy)), cr = Math.max(0, 1 - Math.min(dx * 7 + dy, dy * 7 + dx)), v = Math.min(1, c * c * 1.6 + cr * 0.8); return [255, 150 + 100 * v, 160 + 90 * v, v]; }],
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 110 + 90 * c * c, 130 + 80 * c * c, Math.min(1, c * c * 1.6)]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const E = k.spec.emit, [cx, cy] = k.spec.clasp, ALT = [150, 152];
  const T = k.aim || [226, 44];
  const REL = 1300, FLY = 400, IMP = REL + FLY;
  k.css(`.g-blood { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,232,236,.95), rgba(255,98,118,.62) 28%, rgba(220,40,70,.24) 58%, rgba(200,30,60,0) 100%); }
    .g-bloodsky { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,70,96,.5), rgba(210,40,70,.2) 50%, rgba(200,30,60,0) 100%); }`);
  const dropImg = k.svg('<defs><linearGradient id="d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7a8a"/><stop offset="1" stop-color="#d81c3c"/></linearGradient></defs><path d="M4,0 C4.6,3 8,5.6 8,8.6 A4,4 0 0 1 0,8.6 C0,5.6 3.4,3 4,0Z" fill="url(#d)"/>', 8, 12.6);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1"/></filter></defs><circle cx="30" cy="30" r="25" fill="none" stroke="#ff5a74" stroke-width="2.6" filter="url(#b)"/>', 60, 60);
  const streak = k.svg('<defs><linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#ff3a58" stop-opacity="0"/><stop offset=".7" stop-color="#ff6a80"/><stop offset="1" stop-color="#fff0f2"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation=".5"/></filter></defs><path d="M0,4 Q10,1.2 24,3 Q30,4 24,5 Q10,6.8 0,4Z" fill="url(#s)" filter="url(#b)"/>', 30, 8);

  // ── the clasp: a double heartbeat that grows; the hands squeeze, the thread swells
  const beats = [[360, 1], [640, 0.7], [880, 1.2], [1050, 0.9], [1180, 1.5]];
  const armKf = [[0, { transform: 'none' }, eio]], thKf = [[0, { transform: 'none' }, eio]];
  for (const [t, a] of beats) {
    armKf.push([t, { transform: `scale(${(1 + 0.012 * a).toFixed(4)}, ${(1 - 0.01 * a).toFixed(4)})` }, 'ease-out'], [t + 90, { transform: `scale(${(1 + 0.004 * a).toFixed(4)})` }, eio]);
    thKf.push([t, { transform: `scale(${(1 + 0.05 * a).toFixed(3)}, ${(1 + 0.12 * a).toFixed(3)})`, opacity: 1 }, 'ease-out'], [t + 90, { transform: `scale(${(1 + 0.015 * a).toFixed(3)})`, opacity: 1 }, eio]);
  }
  armKf.push([REL, { transform: 'scale(1.006, .996)' }, 'ease-out'], [REL + 220, { transform: 'scale(.996, 1.002)' }, eio], [2200, { transform: 'scale(1.002)' }, eio], [3300, { transform: 'none' }]);
  // the thread snaps taut at the release, dims while it gives, then its light returns
  thKf.push([REL, { transform: 'scale(1.09, 1.2) rotate(-1.5deg)', opacity: 1 }, 'ease-out'], [REL + 140, { transform: 'scale(1.0, .96) rotate(1deg)', opacity: 0.45 }, eio],
    [IMP + 200, { transform: 'scale(.98, .95)', opacity: 0.3 }, eio], [2500, { transform: 'scale(.995)', opacity: 0.6 }, eio], [3300, { transform: 'none', opacity: 1 }]);
  act(k.part('arms'), armKf);
  act(k.part('thread'), thKf);
  // candle flames duck at each beat, gutter, then flare when the pact is sealed
  const fl = [[0, { transform: 'none' }, eio]];
  for (const [t, a] of beats) fl.push([t, { transform: `scale(${(1 - 0.12 * a).toFixed(2)}, ${(1 - 0.3 * a).toFixed(2)}) skewX(${(a * 4).toFixed(1)}deg)` }, 'ease-out'], [t + 130, { transform: 'scale(.98, .94)' }, eio]);
  fl.push([REL + 100, { transform: 'scale(.8, .55) skewX(-6deg)' }, eio], [IMP + 400, { transform: 'scale(.9, .75)' }, eio], [2300, { transform: 'scale(1.22, 1.5) skewX(3deg)' }, 'ease-out'],
    [2600, { transform: 'scale(1.05, 1.2) skewX(-2deg)' }, eio], [2950, { transform: 'scale(1.1, 1.18)' }, eio], [3400, { transform: 'none' }]);
  act(k.part('flames'), fl);

  // ── the red glow at the clasp, with each heartbeat; the tint on the sky
  const gl = [[40, { transform: 'scale(.5)', opacity: 0 }, 'ease-out']];
  for (const [t, a] of beats) gl.push([t, { transform: `scale(${(0.9 + 0.35 * a).toFixed(2)})`, opacity: +Math.min(1, 0.45 + 0.35 * a).toFixed(2) }, 'ease-out'], [t + 100, { transform: `scale(${(0.7 + 0.2 * a).toFixed(2)})`, opacity: +(0.3 + 0.12 * a).toFixed(2) }, eio]);
  gl.push([REL, { transform: 'scale(1.7)', opacity: 1 }, 'ease-out'], [REL + 300, { transform: 'scale(1.1)', opacity: 0.6 }, eio], [2000, { transform: 'scale(.9)', opacity: 0.3 }, eio], [3000, { transform: 'scale(.5)', opacity: 0 }]);
  fx(k.light('g-blood', E, 70), gl);
  fx(k.lightIn('g-bloodsky', [150, 80], 300, 190), [[260, { opacity: 0 }, 'ease-out'], [REL, { opacity: 0.55 }, 'ease-out'], [IMP + 200, { opacity: 0.4 }, eio], [2600, { opacity: 0 }]]);
  // a ring of red light out of the clasp at each beat
  beats.forEach(([t, a], i) => fx(k.pic(ring, E, 30, 30, { low: true }), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(.7)', opacity: 0.55 + 0.1 * a }, 'ease-out'], [t + 560 + i * 40, { transform: `scale(${(2.4 + 0.5 * a).toFixed(1)})`, opacity: 0 }]]));
  // motes lifting off the thread as it swells
  for (let i = 0; i < 14; i++) {
    const t0 = 300 + Math.round(rand() * 900), x = 120 + rand() * 60, y = 96 + (rand() - 0.5) * 14, sz = 3 + rand() * 3;
    fx(k.pic('mote', [x, y], sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 120, { transform: `${k.T(0, -3)} scale(1)`, opacity: 0.9 }, 'ease-out'], [t0 + 700 + Math.round(rand() * 300), { transform: `${k.T((rand() - 0.5) * 12, -18 - rand() * 18)} scale(.3)`, opacity: 0 }]]);
  }

  // ── the cost: three drops of blood fall from the clasp onto the altar, each splashing
  for (let i = 0; i < 3; i++) {
    const t = 780 + i * 240, x = 150 + (i - 1) * 2.4, y0 = 108, fall = (ALT[1] - 4 - y0) * u;
    fx(k.pic(dropImg, [x, y0], 3.6, 5.6), [[t, { transform: 'translate(0px, 0px) scale(.3)', opacity: 0 }, 'ease-out'], [t + 90, { transform: 'translate(0px, 0px) scale(1)', opacity: 1 }, 'ease-in'],
      [t + 420, { transform: `translate(0px, ${(fall * 0.97).toFixed(1)}px) scale(.9, 1.35)`, opacity: 1 }, 'ease-in'], [t + 450, { transform: `translate(0px, ${fall.toFixed(1)}px) scale(.4, .2)`, opacity: 0 }]]);
    const s0 = t + 420;
    fx(k.pic(ring, [x, ALT[1] - 1], 22, 22, { low: true }), [[s0, { transform: 'scale(.2, .06)', opacity: 0 }, 'ease-out'], [s0 + 50, { transform: 'scale(.4, .12)', opacity: 0.85 }, 'ease-out'], [s0 + 520, { transform: 'scale(1.4, .4)', opacity: 0 }]]);
    fx(k.light('g-blood', [x, ALT[1] - 2], 18), [[s0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [s0 + 60, { transform: 'scale(1)', opacity: 0.9 }], [s0 + 500, { transform: 'scale(1.2)', opacity: 0 }]]);
    for (let j = 0; j < 3; j++) {
      const a = (j - 1) * 0.7 + (rand() - 0.5) * 0.4;
      fx(k.pic('spark', [x, ALT[1] - 2], 3, 3), [[s0, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [s0 + 40, { transform: 'scale(1)', opacity: 0.95 }, 'ease-out'], [s0 + 340, { transform: `${k.T(Math.sin(a) * 9, -6 - rand() * 5)} scale(.3)`, opacity: 0 }]]);
    }
  }

  // ── the gift: a ribbon of red light lifted out of the clasp along an arc to T
  const C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 22];
  const bz = (t) => { const q = 1 - t; return [q * q * E[0] + 2 * q * t * C[0] + t * t * T[0], q * q * E[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const [X0, Y0] = k.P(...E);
  const along = (tex, t0, dur, lat, sx, sy, s0, s1, o, tangent, linger = 0) => {
    const kf = [], n = 8;
    for (let j = 0; j <= n; j++) {
      const f = j / n, w = Math.pow(f, 0.9), q = bz(w), q2 = bz(Math.min(1, w + 0.02)), q1 = bz(Math.max(0, w - 0.02)), [x, y] = k.P(...q);
      const ang = (Math.atan2(q2[1] - q1[1], q2[0] - q1[0]) * 180) / Math.PI, off = lat * Math.sin(Math.PI * w) * u;
      kf.push([Math.round(t0 + dur * f), { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + off).toFixed(1)}px) rotate(${tangent ? ang.toFixed(1) : 0}deg) scale(${(s0 + (s1 - s0) * f).toFixed(2)})`, opacity: j === 0 ? 0 : o }, 'linear']);
    }
    const last = kf.at(-1);
    kf.push([Math.round(t0 + dur + 50 + linger), { ...last[1], opacity: 0 }]);
    fx(k.pic(tex, E, sx, sy), kf);
  };
  for (let i = 0; i < 9; i++) along(streak, REL + i * 22, FLY - 40 + i * 6, (rand() - 0.5) * 6, 26, 7, 0.7, 1, 0.9, true, 80);
  along('mote', REL, FLY, 0, 18, 18, 0.9, 1.1, 1, false);
  along('spark', REL + 10, FLY - 10, 0, 12, 12, 1, 1.2, 1, false);
  for (let i = 0; i < 14; i++) along(i % 2 ? 'spark' : 'mote', REL + 10 + Math.round(rand() * 220), FLY - 60 + Math.round(rand() * 120), (rand() - 0.5) * 16, 4 + rand() * 4, 4 + rand() * 4, 1, 0.5, 0.95, false, 120);
  // the light carried along with it
  const lk = [];
  for (let j = 0; j <= 8; j++) { const f = j / 8, q = bz(f), [x, y] = k.P(...q); lk.push([Math.round(REL + FLY * f), { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) scale(${(1.1 - 0.4 * f).toFixed(2)})`, opacity: j === 0 ? 0 : 0.95 }, 'linear']); }
  lk.push([IMP + 80, { ...lk.at(-1)[1], opacity: 0 }]);
  fx(k.light('g-blood', E, 34), lk);

  // ── where it lands (BEATS.impact): a flash, two rings, a swell of light, motes rising
  fx(k.light('g-blood', T, 62), [[IMP - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 50, { transform: 'scale(1.2)', opacity: 1 }, 'ease-out'], [IMP + 260, { transform: 'scale(.9)', opacity: 0.7 }, eio],
    [IMP + 520, { transform: 'scale(1.05)', opacity: 0.8 }, eio], [IMP + 900, { transform: 'scale(.9)', opacity: 0.5 }, eio], [2900, { transform: 'scale(.6)', opacity: 0 }]]);
  fx(k.light('g-warm', T, 22), [[IMP - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 40, { transform: 'scale(1)', opacity: 0.9 }, 'ease-out'], [IMP + 300, { transform: 'scale(1.5)', opacity: 0 }]]);
  [[0, 3.0, 0.8], [140, 4.2, 0.5]].forEach(([d, big, o]) => fx(k.pic(ring, T, 30, 30, { low: true }), [[IMP + d, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + d + 40, { transform: 'scale(.6)', opacity: o }, 'ease-out'], [IMP + d + 700, { transform: `scale(${big})`, opacity: 0 }]]));
  for (let i = 0; i < 18; i++) {
    const a = rand() * Math.PI * 2, d = 10 + rand() * 20, t0 = IMP + Math.round(rand() * 160), sz = 3 + rand() * 4;
    fx(k.pic(i % 3 ? 'mote' : 'spark', T, sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 90, { transform: `${k.T(Math.cos(a) * d * 0.4, Math.sin(a) * d * 0.4)} scale(1)`, opacity: 1 }, 'ease-out'],
      [t0 + 800 + Math.round(rand() * 500), { transform: `${k.T(Math.cos(a) * d * 0.9, Math.sin(a) * d * 0.5 - 18 - rand() * 14)} scale(.3)`, opacity: 0 }]]);
  }
  // a few of them drift down like a blessing: the gift settling
  for (let i = 0; i < 5; i++) {
    const t0 = IMP + 350 + i * 150, x = T[0] + (rand() - 0.5) * 22;
    fx(k.pic(dropImg, [x, T[1] - 4], 3, 4.7), [[t0, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t0 + 120, { transform: 'scale(1)', opacity: 0.9 }], [t0 + 900, { transform: `${k.T((rand() - 0.5) * 5, 14 + rand() * 8)} scale(.7)`, opacity: 0 }]]);
  }
}
