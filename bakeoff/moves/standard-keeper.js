// Standard Keeper: a gust hits the hilltop; he sets his feet, the standard
// cracks taut and a wave of golden light runs down it and off its tail on the
// wind, to bless whatever lies downwind.
//
// PLAN (drawing units 300 x 210, ms of the move)
//   role support (his rules text lifts the others), element wind. The boon is
//   his standard's light, carried on the wind.
//   0-800     gather: the wind drops, the standard sags and goes slack, his
//             cloak hangs; he is pushed back a hair, then plants his feet and
//             leans in, gripping. Gold gathers at the pole's head, motes
//             slipping up the pole.
//   800       RELEASE: the gust. The standard snaps taut and streams (stretches,
//             whips), the cloak cracks out behind him, wind streaks sweep
//             across from the left. A light runs down the standard from the
//             pole to its tail and leaves it as a stream of gold sparks and
//             little wind curls toward T (alone: the field downwind; aimed:
//             the target).
//   1500      IMPACT: gold blooms at T, a ring, sparks, motes borne on a curl
//             of wind.
//   1800-3200 the standard flutters and slackens, the cloak settles, he eases
//             upright; the light fades.
//   3300      at rest as drawn.
// The sparks and bloom at T are on the overlay (T may be on another card).
export const END = 3800;
export const BEATS = { release: 800, impact: 1500, settle: 3300 };
export const STILLS = [400, 800, 1000, 1250, 1500, 1800, 2500, 3500];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 236 + 19 * c, 170 + 80 * c * c, Math.min(1, c * c * 2.6)]; }],
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 244, 200, Math.min(1, c * 1.4) * c]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out';
  const flag = k.part('flag'), keeper = k.part('keeper'), cloak = k.part('cloak');
  const S = k.spec, E = S.emit, T = k.aim || S.field;
  const [fx0, fy0] = S.feet;
  k.css('.g-keeper { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,250,226,.95), rgba(255,226,140,.55) 30%, rgba(255,196,90,.18) 60%, rgba(255,180,70,0) 100%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#fff0b8" stroke-width="5" filter="url(#b)"/>', 100, 100);
  const star = k.svg('<defs><filter id="s" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1"/></filter></defs><g fill="#fffbea" filter="url(#s)"><path d="M16,1 L18,14 L31,16 L18,18 L16,31 L14,18 L1,16 L14,14Z"/></g>', 32, 32);
  // a streak of wind: a thin curl, drawn once
  const streak = k.svg('<defs><filter id="w" x="-10%" y="-100%" width="120%" height="300%"><feGaussianBlur stdDeviation=".5"/></filter></defs><path d="M2,12 C30,4 52,20 80,10 C100,4 112,10 118,8" fill="none" stroke="#fff8e0" stroke-width="2.2" stroke-linecap="round" filter="url(#w)"/>', 120, 20);

  // he leans from his feet: a part turning about its own pivot Q also moves as the lean about his feet takes it
  const lean = (Q, th) => {
    const r = (th * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r), dx = Q[0] - fx0, dy = Q[1] - fy0;
    return `${k.T(fx0 + c * dx - s * dy - Q[0], fy0 + s * dx + c * dy - Q[1])} rotate(${th}deg)`;
  };
  const L = [[0, 0], [260, 0.5], [700, 1.4], [830, 1.1], [1000, -1.7], [1500, -1.4], [2300, -0.5], [3300, 0]]; // lean over time (deg)
  const eases = [eio, eio, 'ease-out', eio, eio, eio, eio, eio];
  const body = (Q, extra) => L.map(([t, th], i) => [t, { transform: `${lean(Q, th)}${extra ? ' ' + extra(t) : ''}` }, eases[i]]);
  act(keeper, body(S.feet));

  // the cloak: hangs, then cracks out behind him, flutters, settles
  const ckf = (t) => {
    if (t < 700) return 'rotate(2deg) skewY(2deg)';
    if (t < 900) return 'rotate(3deg) skewY(2deg)';
    if (t < 1100) return 'rotate(-4deg) scale(1.06, 1.1) skewY(-5deg)';
    const d = Math.exp(-(t - 1000) / 900), s = (Math.floor(t / 250) % 2) ? 1 : -1;
    return t >= 3300 ? 'none' : `rotate(${(s * 2.4 * d).toFixed(2)}deg) scale(${(1 + 0.04 * d).toFixed(3)}, ${(1 + 0.05 * d).toFixed(3)}) skewY(${(s * -3 * d).toFixed(2)}deg)`;
  };
  // the lean at t, interpolated between its stops
  const leanAt = (t) => { for (let i = 0; i < L.length - 1; i++) if (t <= L[i + 1][0]) { const f = (t - L[i][0]) / (L[i + 1][0] - L[i][0]); return L[i][1] + (L[i + 1][1] - L[i][1]) * k.smooth(f); } return 0; };
  const cl2 = [];
  for (const t of [0, 260, 700, 830, 1000, 1250, 1500, 1750, 2000, 2250, 2500, 2800, 3300]) cl2.push([t, { transform: `${lean(S.cloakRoot, +leanAt(t).toFixed(2))} ${t === 0 || t === 3300 ? 'none' : ckf(t)}`.replace(/ none$/, '') }, eio]);
  act(cloak, cl2);

  // the standard: sags slack in the gather, snaps taut at the gust, whips, flutters, slackens
  const flf = (t) => {
    if (t === 0 || t >= 3300) return '';
    if (t < 700) return 'rotate(3deg) scale(.94, .96) skewY(-2deg)';
    if (t < 900) return 'rotate(5deg) scale(.9, .94) skewY(-3deg)';
    if (t < 1050) return 'rotate(-3deg) scale(1.1, 1.04) skewY(3deg)';
    const d = Math.exp(-(t - 1000) / 1100), s = (Math.floor(t / 250) % 2) ? 1 : -1;
    return `rotate(${(s * -2.2 * d).toFixed(2)}deg) scale(${(1 + 0.07 * d + 0.01).toFixed(3)}, ${(1 + 0.02 * d).toFixed(3)}) skewY(${(s * 4 * d).toFixed(2)}deg)`;
  };
  const fl = [];
  for (const t of [0, 400, 700, 880, 1050, 1250, 1500, 1750, 2000, 2250, 2500, 2800, 3300]) fl.push([t, { transform: `${lean(S.flagRoot, +leanAt(t).toFixed(2))} ${flf(t)}`.trim() }, t === 880 ? 'cubic-bezier(.2,.8,.3,1)' : eio]);
  act(flag, fl);

  // gold gathers at the pole's head, slips up the pole
  const fin = S.finial;
  const gl = [[150, { transform: 'scale(.4)', opacity: 0 }, 'ease-out']];
  for (let t = 400, i = 0; t < 800; t += 110, i++) gl.push([t, { transform: `scale(${(0.9 + 0.5 * (t / 800) + (i % 2 ? 0.15 : 0)).toFixed(2)})`, opacity: 0.55 + 0.4 * (t / 800) }, eio]);
  gl.push([880, { transform: 'scale(2.1)', opacity: 1 }, 'ease-out'], [1500, { transform: 'scale(1.2)', opacity: 0.6 }, eio], [2300, { transform: 'scale(.9)', opacity: 0.3 }, eio], [3000, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.lightIn('g-keeper', fin, 40), gl);
  for (let i = 0; i < 7; i++) {
    const t = 150 + i * 90, y0 = 120 - rand() * 40, x0 = 80 - (y0 - 20) * 0.075 + (rand() - 0.5) * 4;
    fx(k.picIn('mote', [x0, y0], 5, 5), [[t, { transform: 'scale(.5)', opacity: 0 }, 'ease-in'], [t + 160, { transform: `${k.T(0, -(y0 - 40) * 0.3)} scale(1)`, opacity: 0.9 }, 'ease-in'], [t + 520, { transform: `${k.T(0, -(y0 - fin[1]))} scale(.4)`, opacity: 0 }]]);
  }

  // wind streaks sweep across from the left at the gust
  for (let i = 0; i < 6; i++) {
    const y = 30 + i * 22 + rand() * 10, t = 780 + i * 70 + rand() * 40, w = 40 + rand() * 40, h = w / 6;
    fx(k.picIn(streak, [-20, y], w, h, { lit: false }), [[t, { transform: `${k.T(0, 0)} scale(.5, 1)`, opacity: 0 }, 'ease-out'], [t + 160, { transform: `${k.T(80, -2)} scale(1, 1)`, opacity: 0.7 }, eio], [t + 620, { transform: `${k.T(340, 2)} scale(1.3, 1)`, opacity: 0 }]]);
  }

  // the light runs down the standard from the pole to its tail
  fx(k.lightIn('g-keeper', [100, 46], 70, 60), [[820, { transform: `${k.T(-22, 0)} scale(.5)`, opacity: 0 }, 'ease-out'], [1000, { transform: `${k.T(0, 0)} scale(1)`, opacity: 0.9 }, eio], [1250, { transform: `${k.T(80, 0)} scale(1.1)`, opacity: 0.9 }, eio],
    [1400, { transform: `${k.T(150, 6)} scale(.9)`, opacity: 0.8 }, 'ease-out'], [1600, { transform: `${k.T(158, 6)} scale(.5)`, opacity: 0 }]]);
  // ...and off its tail toward T, on the wind: sparks along an arc, a curl of wind with them
  const C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 16];
  const bz = (t) => { const q = 1 - t; return [q * q * E[0] + 2 * q * t * C[0] + t * t * T[0], q * q * E[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const [X0, Y0] = k.P(...E);
  for (let i = 0; i < 18; i++) {
    const t0 = 1050 + i * 30, sz = i % 4 === 0 ? 13 : 8, jit = (rand() - 0.5) * 0.06, jx = (rand() - 0.5) * 8 * u, jy = (rand() - 0.5) * 8 * u;
    const w = (t, sc, o) => { const [x, y] = k.P(...bz(Math.max(0, Math.min(1, t + jit)))); return { transform: `translate(${(x - X0 + jx * t).toFixed(1)}px, ${(y - Y0 + jy * t).toFixed(1)}px) scale(${sc})`, opacity: o }; };
    fx(k.pic('spark', E, sz, sz), [[t0, w(0, 0.4, 0), 'ease-out'], [t0 + 60, w(0.1, 1, 0.95)], [t0 + 240, w(0.55, 1.1, 0.95)], [t0 + 430, w(1, 1.2, 0.85), 'ease-out'], [t0 + 600, w(1, 1.9, 0)]]);
  }
  // the standard's tail throws off the light as it cracks
  fx(k.pic(star, E, 30, 30), [[1250, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [1350, { transform: 'scale(1.3) rotate(25deg)', opacity: 1 }, 'ease-out'], [1750, { transform: 'scale(.5) rotate(70deg)', opacity: 0 }]]);
  for (let i = 0; i < 3; i++) {
    const t = 1100 + i * 110, dir = T[0] >= E[0] ? 1 : -1;
    fx(k.pic(streak, [E[0] + dir * 30, E[1] + 8 + i * 10], 70, 12, { lit: false }), [[t, { transform: `${k.T(-dir * 20, 0)} scale(.4, 1)`, opacity: 0 }, 'ease-out'], [t + 200, { transform: `${k.T(0, 0)} scale(1, 1)`, opacity: 0.75 }, eio], [t + 700, { transform: `${k.T(dir * 40, 0)} scale(1.1, 1)`, opacity: 0 }]]);
  }

  // the bloom at T, borne on a curl of wind
  const bt = [[1450, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1570, { transform: 'scale(1.1)', opacity: 0.95 }]];
  for (let t = 1700, i = 0; t < 2500; t += 150, i++) bt.push([t, { transform: `scale(${i % 2 ? 1.12 : 0.95})`, opacity: i % 2 ? 0.95 : 0.7 }, eio]);
  bt.push([3100, { transform: 'scale(.8)', opacity: 0 }]);
  fx(k.light('g-keeper', T, 110), bt);
  fx(k.light('g-warm', T, 60), [[1470, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1590, { transform: 'scale(1)', opacity: 0.55 }, eio], [2300, { transform: 'scale(1.1)', opacity: 0.3 }, eio], [2900, { transform: 'scale(.7)', opacity: 0 }]]);
  for (let i = 0; i < 3; i++) fx(k.pic(ring, T, 56, 56), [[1480 + i * 140, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [1540 + i * 140, { transform: 'scale(.5)', opacity: 0.9 }, 'ease-out'], [2100 + i * 140, { transform: 'scale(2.4)', opacity: 0 }]]);
  fx(k.pic(star, T, 34, 34), [[1480, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1560, { transform: 'scale(1.3) rotate(20deg)', opacity: 1 }, 'ease-out'], [2000, { transform: 'scale(.5) rotate(60deg)', opacity: 0 }]]);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 6.28 + rand() * 0.4, d = 18 + rand() * 20, t = 1480 + rand() * 80;
    fx(k.pic('spark', T, 7, 7), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 60, { transform: `${k.T(Math.cos(a) * 3, Math.sin(a) * 3)} scale(1)`, opacity: 1 }, 'ease-out'],
      [t + 480, { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d + 6)} scale(.5)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 14; i++) {
    const x = T[0] + (rand() - 0.5) * 70, y = T[1] + (rand() - 0.2) * 14, t = 1600 + rand() * 700, dr = 30 + rand() * 30, drift = 18 + rand() * 20;
    fx(k.pic('mote', [x, y], 5, 5), [[t, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t + 300, { transform: `${k.T(drift * 0.4, -dr * 0.4)} scale(1)`, opacity: 0.9 }, eio], [t + 1300, { transform: `${k.T(drift, -dr)} scale(.6)`, opacity: 0 }]]);
  }
}
