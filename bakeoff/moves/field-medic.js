// Field Medic: she binds her wounded knight's arm, and sends the healing on.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support, element: light.
//   0-900     she gathers the gift: leans in over his arm, her hands working the
//             bandage; the four turns of light round his forearm shimmer one after
//             another, the loose end flutters, the curl of light coils; golden
//             motes stream from the sun on her tabard down her arms, and from the
//             air round about, into the bandage, which swells with light.
//   900-1250  (BEATS.release 900) she lifts her hands toward T and lets it go:
//             the loose end whips, the curl is carried off, a stream of light
//             leaves the bandage, arcing to T, comets and sparks along it, the
//             turns of bandage rippling as it flows out.
//   1250      (BEATS.impact) it blooms at T: a flare, two rings of light, golden
//             motes rising. Alone, T is the knight's heart: he draws a deep
//             breath, sits up against the rock and lifts his head, glints of
//             healing running over him.
//   1700-3500 the glow warms and holds, then fades; she settles back over his
//             arm, the bandage quiets, the curl returns.
//   3500      at rest as drawn (the move ends at END).
//
// The contract (bakeoff/recipe.md): the gift goes to T = k.aim || the knight's
// heart (alone); every point of the stream's path is worked out from `emit`
// (the bandage) and T, and her arms lift toward T (at most 35 degrees). What
// flies and lands is on the overlay (k.pic / k.light), since T may be on another
// card. The knight only answers when she plays alone. Every motion of a part is
// one sampled list (every 40 ms).
export const END = 4200;
export const BEATS = { release: 900, impact: 1250, settle: 3500 };
export const STILLS = [300, 700, 950, 1150, 1300, 1700, 2600, 3800];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 232 + 23 * c * c, 160 + 95 * c * c, Math.min(1, c * c * 2.2)]; }],
  mote: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 240, 190, Math.min(1, c * 1.6)]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, E = S.emit, sho = S.shoulder, seat = S.seat, neck = S.neck, knee = S.knee, heart = S.alone;
  const alone = !k.aim, T = k.aim || heart;
  const ang = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const ph = (t, a, b) => sm(cl((t - a) / (b - a), 0, 1)); // 0..1 between a and b, eased

  k.css(`.g-gold { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,246,214,.95), rgba(255,218,140,.5) 25%, rgba(255,190,90,.14) 55%, rgba(255,170,60,0) 100%); }`);

  // ── how far her arms lift toward T (rotation about the shoulder, clockwise positive)
  const toT = T[0] < sho[0] ? ang(sho, E) - 35 : ang(sho, T);
  const D = cl((toT - ang(sho, E)) * 0.85, -35, 6);
  const lean = (t) => 1.1 * ph(t, 100, 600) * (1 - ph(t, 1500, 2700)) + 0.2 * Math.sin(t / 260) * ph(t, 100, 600) * (1 - ph(t, 800, 1000));
  const up = (t) => ph(t, 820, 1080) * (1 - ph(t, 1500, 2500));
  const wind = (t) => 1.5 * Math.sin((2 * Math.PI * (t - 150)) / 330) * ph(t, 150, 400) * (1 - ph(t, 700, 900));
  const carry = (p, th, o) => { const r = (th * Math.PI) / 180, vx = p[0] - o[0], vy = p[1] - o[1]; return [o[0] + vx * Math.cos(r) - vy * Math.sin(r), o[1] + vx * Math.sin(r) + vy * Math.cos(r)]; };
  const tfm = (pv, o, th, extra = '') => { const [x, y] = carry(pv, th, o); return { transform: `${k.T(x - pv[0], y - pv[1])} rotate(${th.toFixed(2)}deg)${extra}` }; };
  const grid = [];
  for (let t = 0; t <= 3560; t += 40) grid.push(t);
  const sample = (fn, last0 = {}) => [...grid.map((t) => [t, fn(t), 'linear']), [3700, { transform: 'none', ...last0 }]];
  act(k.part('her'), sample((t) => ({ transform: `rotate(${lean(t).toFixed(2)}deg)` })));
  act(k.part('arms'), sample((t) => { const a = tfm(sho, knee, lean(t)); return { transform: `${a.transform.replace(/ rotate.*$/, '')} rotate(${(lean(t) + wind(t) + D * up(t)).toFixed(2)}deg)` }; }));

  // ── the knight (alone): a deep breath, sitting up, his head lifting
  const sit = (t) => (alone ? ph(t, 1250, 1700) * (1 - ph(t, 2300, 3400)) : 0);
  const look = (t) => (alone ? ph(t, 1350, 1800) * (1 - ph(t, 2300, 3300)) : 0);
  const breath = (t) => (alone ? Math.sin(Math.PI * cl((t - 1250) / 700, 0, 1)) : 0);
  act(k.part('knight'), sample((t) => ({ transform: `${k.T(0, -0.5 * sit(t))} rotate(${(-1.6 * sit(t)).toFixed(2)}deg) scale(${(1 + 0.008 * breath(t)).toFixed(4)}, ${(1 + 0.014 * breath(t)).toFixed(4)})` })));
  act(k.part('kHead'), sample((t) => { const th = -1.6 * sit(t), [x, y] = carry(neck, th, seat); return { transform: `${k.T(x - neck[0], y - neck[1] - 0.5 * sit(t) - 0.5 * breath(t))} rotate(${(th + 4 * look(t)).toFixed(2)}deg)` }; }));

  // ── the bandage: each turn shimmers in sequence as it fills, and ripples as the light flows out
  const turns = S.turns;
  turns.forEach((pv, i) => act(k.part(`wrap${i}`), sample((t) => {
    let w = 0;
    for (const [c, r, a] of [[300 + i * 120, 110, 0.5], [650 + i * 120, 110, 0.7], [960 + i * 70, 120, 1], [1340 + i * 90, 130, 0.5]]) w = Math.max(w, a * Math.exp(-(((t - c) / r) ** 2)));
    return { transform: `${k.T(0, 0)} scale(${(1 + 0.55 * w).toFixed(3)}, ${(1 + 0.05 * w).toFixed(3)})` };
  })));
  // the loose end flutters in the gather, whips at the release, and droops back
  const flutter = [[0, 0, 0]];
  for (let t = 160, j = 0; t < 880; t += 120, j++) flutter.push([t, (j % 2 ? -1 : 1) * (4 + j * 1.6), (j % 2 ? 0.4 : -0.4)]);
  flutter.push([940, -26, -1.6], [1100, 14, 0.6], [1300, -7, 0.2], [1550, 5, 0], [1900, -2, 0], [2500, 1, 0], [3000, 0, 0]);
  act(k.part('loose'), [...flutter.map(([t, r, dy]) => [t, { transform: `${k.T(0, dy)} rotate(${r}deg)` }, eio]), [3400, { transform: 'none' }]]);
  // the curl of light lifting off the roll coils in the gather, is carried off at the release, and re-forms
  const dir = Math.atan2(T[1] - E[1], T[0] - E[0]), cx = Math.cos(dir) * 7, cy = Math.sin(dir) * 7 - 3;
  act(k.part('curl'), [[0, { transform: 'none', opacity: 1 }, eio], [350, { transform: 'rotate(-12deg) scale(1.15)', opacity: 1 }, eio], [700, { transform: 'rotate(10deg) scale(1.3)', opacity: 1 }, eio], [900, { transform: 'rotate(0deg) scale(1.2)', opacity: 1 }, 'ease-in'],
    [1100, { transform: `${k.T(cx, cy)} rotate(40deg) scale(.6)`, opacity: 0 }], [3300, { transform: 'none', opacity: 0 }, 'ease-out'], [3650, { transform: 'none', opacity: 1 }]]);

  // ── the bandage's light: swells as she gathers, flares at the release, fades
  fx(k.lightIn('g-gold', E, 58, 44), [[0, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [500, { transform: 'scale(1)', opacity: 0.55 }, eio], [900, { transform: 'scale(1.3)', opacity: 0.95 }, eio], [1100, { transform: 'scale(1.6)', opacity: 0.8 }, eio], [1500, { transform: 'scale(1.2)', opacity: 0.45 }, eio], [2600, { transform: 'scale(1)', opacity: 0.25 }, eio], [3400, { transform: 'scale(.7)', opacity: 0 }]]);
  // the sun sewn on her tabard glowing
  fx(k.lightIn('g-gold', [124, 143], 20, 20), [[150, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [600, { transform: 'scale(1)', opacity: 0.8 }, eio], [900, { transform: 'scale(1.3)', opacity: 1 }, eio], [1300, { transform: 'scale(1)', opacity: 0.4 }, eio], [2000, { transform: 'scale(.6)', opacity: 0 }]]);

  // ── the gather: motes streaming from the sun on her tabard down her arm to the bandage, and in from round about
  const [X0, Y0] = k.P(...E);
  const rel = (p) => { const [x, y] = k.P(...p); return [x - X0, y - Y0]; };
  for (let i = 0; i < 7; i++) {
    const t0 = 220 + i * 90, src = [124 + (rand() - 0.5) * 4, 143 + (rand() - 0.5) * 6], C = [(src[0] + E[0]) / 2, Math.min(src[1], E[1]) - 8 - rand() * 6];
    const pts = k.arc(src, C, E, 5), [sx, sy] = k.P(...src);
    fx(k.pic('mote', src, 3.2, 3.2), pts.map((p, j) => { const [x, y] = k.P(...p); return [Math.round(t0 + 90 * j), { transform: `translate(${(x - sx).toFixed(1)}px, ${(y - sy).toFixed(1)}px) scale(${(0.6 + 0.5 * j / 5).toFixed(2)})`, opacity: j === 0 || j === 5 ? 0 : 0.95 }, 'linear']; }));
  }
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2, d = 22 + rand() * 16, t0 = 150 + i * 80, sz = 2 + rand() * 2;
    const f = (u, o) => ({ transform: `${k.T(Math.cos(a) * d * (1 - u), Math.sin(a) * d * (1 - u) * 0.8)} scale(${(0.5 + 0.7 * u).toFixed(2)})`, opacity: o });
    fx(k.pic('spark', E, sz * 2, sz * 2), [[t0, f(0, 0), 'ease-in'], [t0 + 120, f(0.25, 0.9)], [t0 + 420, f(0.9, 0.9), 'ease-in'], [t0 + 520, f(1, 0)]]);
  }

  // ── the release (BEATS.release to .impact): the stream of light, arcing from the bandage to T on the overlay
  const dist = Math.hypot(T[0] - E[0], T[1] - E[1]), C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 14 - 0.14 * dist];
  const path = k.arc(E, C, T, 10, (u) => Math.pow(u, 1.2));
  const comet = k.svg('<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd77a" stop-opacity="0"/><stop offset=".7" stop-color="#ffeeb8" stop-opacity=".85"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs><path d="M0,3.5Q10,.4 28,3.5Q10,6.6 0,3.5Z" fill="url(#g)"/>', 28, 7);
  for (let i = 0; i < 5; i++) {
    const t0 = 900 + i * 55, off = (rand() - 0.5) * 5, len = 14 + rand() * 8;
    fx(k.pic(comet, E, len, 4.2), path.map((p, j) => {
      const [x, y] = k.P(...p), q = path[Math.min(10, j + 1)], q0 = path[Math.max(0, j - 1)], a = ang(q0, q);
      return [Math.round(t0 + (350 * j) / 10), { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + off * Math.sin((Math.PI * j) / 10) * k.u).toFixed(1)}px) rotate(${a.toFixed(1)}deg) scale(${(0.5 + 0.5 * Math.sin(Math.PI * Math.min(1, j / 6))).toFixed(2)}, 1)`, opacity: j === 0 ? 0 : j === 10 ? 0.4 : 1 }, 'linear'];
    }).concat([[t0 + 440, { transform: `translate(${(k.P(...T)[0] - X0).toFixed(1)}px, ${(k.P(...T)[1] - Y0).toFixed(1)}px) rotate(${ang(path[9], path[10]).toFixed(1)}deg) scale(.2, 1)`, opacity: 0 }]]));
  }
  for (let i = 0; i < 12; i++) {
    const t0 = 910 + i * 28, sz = 2.4 + rand() * 2.6, off = (rand() - 0.5) * 9, r = rand();
    fx(k.pic('spark', E, sz, sz), path.map((p, j) => { const [x, y] = k.P(...p); return [Math.round(t0 + (330 * j) / 10), { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + off * Math.sin((Math.PI * j) / 10) * k.u).toFixed(1)}px) scale(${(0.7 + 0.5 * r).toFixed(2)})`, opacity: j === 0 ? 0 : j === 10 ? 0.5 : 0.95 }, 'linear']; })
      .concat([[t0 + 400, { transform: `translate(${(k.P(...T)[0] - X0).toFixed(1)}px, ${(k.P(...T)[1] - Y0).toFixed(1)}px) scale(.3)`, opacity: 0 }]]));
  }

  // ── where it blooms (BEATS.impact): a flare, two rings, golden motes rising
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#fff3cc" stroke-width="3" filter="url(#b)"/>', 60, 60);
  const IM = 1250;
  fx(k.light('g-gold', T, 70), [[IM - 60, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.2)', opacity: 1 }, eio], [IM + 300, { transform: 'scale(1.5)', opacity: 0.65 }, eio], [IM + 1200, { transform: 'scale(1.7)', opacity: 0.3 }, eio], [IM + 2000, { transform: 'scale(1.3)', opacity: 0 }]]);
  [0, 140].forEach((dl, i) => fx(k.pic(ring, T, 26, 26), [[IM + dl, { transform: 'scale(.3, .3)', opacity: 0 }, 'ease-out'], [IM + dl + 60, { transform: 'scale(.55, .55)', opacity: 0.95 }], [IM + dl + 620, { transform: `scale(${1.9 + 0.6 * i}, ${1.9 + 0.6 * i})`, opacity: 0 }]]));
  for (let i = 0; i < 12; i++) {
    const t0 = IM + 40 + i * 70 + rand() * 40, x = (rand() - 0.5) * 22, rise = 18 + rand() * 20, sz = 2.2 + rand() * 2.6;
    const f = (u, o) => ({ transform: `${k.T(x + Math.sin(u * 5 + i) * 2.5, 4 - rise * u)} scale(${(0.6 + 0.6 * Math.sin(Math.PI * Math.min(1, u * 1.2))).toFixed(2)})`, opacity: o });
    fx(k.pic('spark', T, sz, sz), [[t0, f(0, 0), 'ease-out'], [t0 + 160, f(0.2, 0.95)], [t0 + 700, f(0.7, 0.85), 'ease-in'], [t0 + 1100 + rand() * 300, f(1, 0)]]);
  }
  // alone: it warms the knight, who is mended: a soft light on him and glints of healing running over him
  if (alone) {
    fx(k.lightIn('g-gold', [200, 150], 70, 64), [[IM, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [IM + 350, { transform: 'scale(1)', opacity: 0.75 }, eio], [IM + 1500, { transform: 'scale(1.1)', opacity: 0.45 }, eio], [IM + 2300, { transform: 'scale(1.2)', opacity: 0 }]]);
    const glints = [[205, 150], [196, 168], [214, 134], [186, 176], [216, 108], [190, 146], [210, 168], [200, 128]];
    glints.forEach(([x, y], i) => {
      const t0 = IM + 100 + i * 110, sz = 4 + rand() * 3;
      fx(k.picIn('spark', [x, y], sz, sz), [[t0, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [t0 + 140, { transform: 'scale(1.3)', opacity: 1 }, eio], [t0 + 360, { transform: `${k.T(0, -2)} scale(.5)`, opacity: 0.6 }, eio], [t0 + 560, { transform: `${k.T(0, -4)} scale(.1)`, opacity: 0 }]]);
    });
  }
}
