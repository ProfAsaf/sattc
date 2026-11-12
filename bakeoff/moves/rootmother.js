// Rootmother: she draws life up from the earth through her roots and trunk, and lets it flow
// out of her fingers along the vines to the wounds, which close; everything it touches grows.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support (a healer and buffer: her text
// makes healed creatures bigger for good; power 2 but nothing in her picture strikes or guards),
// element: nature. Parts: her (trunk, head, arms; about her roots), hair (the roots on her head,
// swinging about the back of it), stag (its body) and head (its head and antlers, about its neck),
// the vines and the wounds' light.
//   0-300     she breathes; a faint sway.
//   300-1100  she gathers (anticipation): she draws back a hair, then bows toward the stag; rings
//             spread in the earth at her roots and motes of green light are drawn up from the roots
//             through the trunk to her hands, which glow; her hair swings after her.
//   1200      RELEASE (BEATS.release): the hands flare and the healing runs out: a light along each
//             vine toward the wounds, and a stream of motes and leaves arcs from `emit` to T.
//   1900      LANDS (BEATS.impact) at T = k.aim, else the wounds on the stag (its own target):
//             a flash, rings, a burst of motes, little leaves unfurling there. The wounds'
//             green light swells as they close; the stag shudders and lifts its head.
//   2300-3300 it has grown (+1/+1): +1 signs of light rise from her and from the stag, a pulse of
//             green over both; the vines swell a little.
//   3800      at rest as drawn (the move ends at END).
//
// The contract: the healing leaves from `emit` (her fingertips) and goes to T.
export const END = 4400;
export const BEATS = { release: 1200, impact: 1900, settle: 3800 };
export const STILLS = [450, 900, 1200, 1450, 1900, 2300, 3000, 4100];

export const textures = {
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226, 255, 160, Math.min(1, c * c * 1.5)]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out';
  const S = k.spec, E = S.emit, T = k.aim || S.alone, [fx0, fy0] = S.feet;
  const bump = (t, c, w) => Math.exp(-(((t - c) / w) ** 2));
  const grid = [];
  for (let t = 0; t <= 3720; t += 30) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3840, { transform: 'none' }]];
  const env = (t) => Math.min(1, t / 300) * Math.min(1, Math.max(0, (3700 - t) / 500));
  const sm = k.smooth;
  const stage = (keys, t) => { // a curve through [ms, value] keys, eased between them
    let i = keys.length - 1;
    while (i > 0 && keys[i][0] > t) i--;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    return a[1] + (b[1] - a[1]) * (b[0] === a[0] ? 0 : sm(Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0])))));
  };
  const bowK = [[0, 0], [300, 0], [560, -1.3], [1050, 2.8], [1250, 3.2], [2600, 2.6], [3500, 0]]; // the bow (deg about her roots): back a hair, then toward the stag
  const bow = (t) => stage(bowK, t);
  const lift = (t) => stage([[0, 0], [1900, 0], [2150, 1], [2900, 0.9], [3600, 0]], t); // the stag's head lifts

  k.css(`.g-heal2 { border-radius: 50%; background: radial-gradient(closest-side, rgba(246,255,200,.95), rgba(196,244,130,.55) 30%, rgba(130,214,110,.2) 60%, rgba(100,200,110,0) 100%); }`);

  // ── her: breathes, draws back, bows toward the stag and holds, then rises; her hair swings after her
  act(k.part('her'), sample((t) => ({ transform: `rotate(${(bow(t) + 0.35 * env(t) * Math.sin(t / 520)).toFixed(2)}deg) scale(${(1 + 0.004 * env(t) * Math.sin(t / 520 + 1)).toFixed(4)}, ${(1 + 0.007 * env(t) * Math.sin(t / 520 + 1)).toFixed(4)})` })));
  act(k.part('hair'), sample((t) => ({ transform: `rotate(${(bow(t - 140) * 0.9 + 4.5 * bump(t, 1350, 260) + 2.6 * env(t) * Math.sin((t - 120) / 380) * (1 - 0.5 * bump(t, 1500, 700))).toFixed(2)}deg)` })));
  // the stag: breathes deeper as it mends, shudders as the wounds close, lifts its head
  act(k.part('stag'), sample((t) => ({ transform: `scale(${(1 + 0.012 * env(t) * Math.sin(t / 480) + 0.028 * bump(t, 2050, 260) + 0.012 * bump(t, 2900, 400)).toFixed(4)}, ${(1 + 0.02 * env(t) * Math.sin(t / 480) + 0.045 * bump(t, 2050, 260) + 0.02 * bump(t, 2900, 400)).toFixed(4)})` })));
  act(k.part('head'), sample((t) => ({ transform: `rotate(${(4.2 * lift(t) + 0.5 * env(t) * Math.sin(t / 480) - 1.6 * bump(t, 2000, 120)).toFixed(2)}deg)` })));
  // the vines swell as the healing runs through them; the wounds' light swells as they close
  act(k.part('vines'), sample((t) => ({ transform: `${k.T(0.0 + 0.6 * bow(t) / 3, 0.9 * bow(t) / 3)} scale(${(1 + 0.05 * bump(t, 1900, 260) + 0.035 * bump(t, 2700, 350)).toFixed(3)})` })));
  act(k.part('wounds'), sample((t) => ({ transform: `scale(${(1 + 0.3 * bump(t, 1950, 220) + 0.12 * bump(t, 2500, 500)).toFixed(3)})` })));

  // ── earth: rings at her roots, a warm patch under her, and motes drawn up from the roots through the trunk to her hands
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".7"/></filter></defs><ellipse cx="30" cy="10" rx="26" ry="6.5" fill="none" stroke="#f0ffc8" stroke-width="1.7" filter="url(#b)"/>', 60, 20);
  [[380, 0.6, 3.4, 950], [880, 0.8, 4.2, 1000], [1250, 0.9, 5, 1100]].forEach(([t, o, sc, d]) => fx(k.picIn(ring, [fx0, fy0 + 2], 44, 14.7), [[t, { transform: 'scale(.3, .3)', opacity: 0 }, 'ease-out'], [t + 60, { transform: 'scale(.6, .6)', opacity: o }, 'ease-out'], [t + d, { transform: `scale(${sc}, ${sc})`, opacity: 0 }]]));
  fx(k.lightIn('g-heal2', [fx0, fy0 + 2], 110, 22), [[300, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(1)', opacity: 0.55 }, eio], [1500, { transform: 'scale(1.15)', opacity: 0.7 }, eio], [2600, { transform: 'scale(1.05)', opacity: 0.4 }, eio], [3600, { transform: 'scale(.9)', opacity: 0 }]]);
  // the route up her body to her hands (roots, trunk, shoulder, arm)
  const route = [[fx0 + (rand() - 0.5) * 20, fy0 + 2], [110, 160], [111, 130], [118, 108], [140, 98], [168, 112], [S.hands[0][0], S.hands[0][1]]];
  for (let n = 0; n < 20; n++) {
    const t = Math.round(400 + n * 32 + rand() * 30), sz = 3 + rand() * 3.2, x0 = fx0 + (rand() - 0.5) * 40, y0 = fy0 + 1 + rand() * 4;
    const keys = [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 100, { transform: 'scale(1)', opacity: 0.95 }, 'linear']];
    let tt = t + 100;
    for (let j = 1; j < route.length; j++) {
      const [rx, ry] = route[j], jit = (rand() - 0.5) * 5;
      tt += Math.hypot(rx - route[j - 1][0], ry - route[j - 1][1]) * 2.8;
      keys.push([Math.round(tt), { transform: `${k.T(rx + jit - x0, ry + jit * 0.5 - y0)} scale(${(1 - j * 0.08).toFixed(2)})`, opacity: j === route.length - 1 ? 0 : 0.95 }, 'linear']);
    }
    fx(k.pic('mote', [x0, y0], sz, sz), keys);
  }
  // her hands glow as the light gathers there, and flare as it leaves
  S.hands.forEach(([x, y], i) => fx(k.light('g-heal2', [x, y], 40), [[640 + i * 60, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1150, { transform: 'scale(1)', opacity: 0.8 }, eio], [1230, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [1700, { transform: 'scale(1)', opacity: 0.5 }, eio], [2500, { transform: 'scale(.6)', opacity: 0 }]]));

  // ── the healing runs out along the vines (BEATS.release to .impact): a light along each vine to the wounds
  S.vine.forEach((path, n) => {
    const keys = [], x0 = path[0][0], y0 = path[0][1];
    let t = 1230 + n * 60;
    keys.push([t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out']);
    path.forEach((q, j) => {
      if (j) t += Math.hypot(q[0] - path[j - 1][0], q[1] - path[j - 1][1]) * 3.6;
      keys.push([Math.round(t), { transform: `${k.T(q[0] - x0, q[1] - y0)} scale(1)`, opacity: j ? 0.95 : 0.9 }, 'linear']);
    });
    keys.push([Math.round(t) + 500, { transform: `${k.T(path[path.length - 1][0] - x0, path[path.length - 1][1] - y0)} scale(1.6)`, opacity: 0 }]);
    fx(k.lightIn('g-heal2', [x0, y0], 22, 18), keys);
  });

  // ── the boon: a stream of motes and leaves along an arc from her fingertips to T
  const leaf = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".5"/></filter></defs><path d="M3,10C5,3 13,1 17,2C16,9 11,16 3,10Z" fill="#b6e98f" filter="url(#b)"/><path d="M3.6,9.6C6,4.5 12,3 15.5,3.2C14.5,8.5 10.5,13.5 3.6,9.6Z" fill="#effcc8"/>', 20, 14);
  const C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 30];
  const bz = (q) => { const w = 1 - q; return [w * w * E[0] + 2 * w * q * C[0] + q * q * T[0], w * w * E[1] + 2 * w * q * C[1] + q * q * T[1]]; };
  const [X0, Y0] = k.P(...E);
  for (let n = 0; n < 30; n++) {
    const t0 = 1200 + n * 20, kind = n % 4 === 3 ? 'leaf' : 'mote', sz = kind === 'leaf' ? 10 : 4.5 + rand() * 4.5, side = (rand() - 0.5) * 9, dur = 560 + rand() * 120, spin = Math.round((rand() - 0.5) * 360);
    const at = (f, sc, o) => { const [x, y] = k.P(...bz(f)); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + side * Math.sin(Math.PI * f) * u).toFixed(1)}px) rotate(${Math.round(spin * f)}deg) scale(${sc})`, opacity: o }; };
    fx(k.pic(kind === 'leaf' ? leaf : 'mote', E, sz, kind === 'leaf' ? sz * 0.7 : sz), [[t0, at(0, 0.4, 0), 'ease-out'], [t0 + 60, at(0.08, 1, 1), 'linear'], [t0 + dur * 0.5, at(0.5, 1, 1), 'linear'], [t0 + dur, at(1, 1.1, 0.9), 'ease-out'], [t0 + dur + 220, at(1, 0.4, 0)]]);
  }

  // ── where it lands (BEATS.impact): a flash and rings, a burst of motes, little leaves unfurling
  const I = 1900;
  const ringC = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#f0ffd0" stroke-width="3" filter="url(#b)"/>', 60, 60);
  fx(k.light('g-heal2', T, 78), [[I - 70, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [I + 40, { transform: 'scale(1.3)', opacity: 1 }, eio], [I + 320, { transform: 'scale(1.45)', opacity: 0.65 }, eio], [2800, { transform: 'scale(1.45)', opacity: 0.45 }, eio], [3400, { transform: 'scale(1.1)', opacity: 0 }]]);
  [[0, 3.3, 0.9], [160, 2.4, 0.6]].forEach(([dt, sc, o]) => fx(k.pic(ringC, T, 28, 28), [[I + dt, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [I + dt + 50, { transform: 'scale(.6)', opacity: o }], [I + dt + 850, { transform: `scale(${sc})`, opacity: 0 }]]));
  for (let n = 0; n < 18; n++) {
    const a = rand() * Math.PI * 2, dist = 9 + rand() * 26, sz = 3 + rand() * 3.8, t = I + rand() * 140;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * dist * f, Math.sin(a) * dist * f * 0.7 - 20 * f)} scale(${sc})`, opacity: o });
    fx(k.pic('mote', T, sz, sz), [[t, P(0, 0.5, 0), 'ease-out'], [t + 60, P(0.2, 1.1, 1), 'ease-out'], [t + 900 + rand() * 500, P(1, 0.4, 0)]]);
  }
  // new leaves unfurling round T, standing a while, then fading
  for (let n = 0; n < 6; n++) {
    const a = -150 + n * 60 + (rand() - 0.5) * 20, d = 6 + rand() * 9, s0 = I + 80 + n * 90, w = 10 + rand() * 4, rr = a * Math.PI / 180;
    const x = T[0] + Math.cos(rr) * d, y = T[1] + Math.sin(rr) * d * 0.7 - 3;
    fx(k.pic(leaf, [x, y], w, w * 0.7), [[s0, { transform: `rotate(${a + 90}deg) scale(.1)`, opacity: 0 }, 'cubic-bezier(.2,.8,.3,1)'], [s0 + 300, { transform: `rotate(${a + 90}deg) scale(1.15)`, opacity: 1 }, eio], [s0 + 460, { transform: `rotate(${a + 90}deg) scale(1)`, opacity: 1 }, eio],
      [s0 + 1300, { transform: `rotate(${a + 98}deg) scale(1.03)`, opacity: 0.95 }, eio], [s0 + 1800, { transform: `rotate(${a + 90}deg) scale(.8)`, opacity: 0 }]]);
  }
  // the wounds closing on the stag: a green light that swells and dies slowly
  fx(k.lightIn('g-heal2', S.alone, 56, 40), [[I - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [I + 120, { transform: 'scale(1.2)', opacity: 1 }, eio], [2400, { transform: 'scale(1.05)', opacity: 0.8 }, eio], [3300, { transform: 'scale(.8)', opacity: 0 }]]);

  // ── grown (+1/+1): signs of light rising from her and from the stag, and a pulse of green over both
  fx(k.lightIn('g-heal2', [160, 120], 260, 150), [[2200, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [2700, { transform: 'scale(1)', opacity: 0.5 }, eio], [3000, { transform: 'scale(1.05)', opacity: 0.4 }, eio], [3700, { transform: 'scale(1.1)', opacity: 0 }]]);
  const plus = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".5"/></filter></defs><path d="M7,1H9V7H15V9H9V15H7V9H1V7H7Z" fill="#d8ffa8" filter="url(#b)"/><path d="M7.3,2H8.7V7.3H14V8.7H8.7V14H7.3V8.7H2V7.3H7.3Z" fill="#fffff0"/>', 16, 16);
  [[2300, 118, 46], [2500, 190, 98], [2650, 232, 138], [2850, 96, 70]].forEach(([t, x, y]) => fx(k.pic(plus, [x, y], 10, 10), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 180, { transform: `${k.T(0, -5)} scale(1.1)`, opacity: 1 }, 'linear'], [t + 1000, { transform: `${k.T(0, -26)} scale(.8)`, opacity: 0 }]]));
  for (let n = 0; n < 18; n++) {
    const onStag = n % 2, t = Math.round(2200 + n * 55 + rand() * 40), x = onStag ? 200 + rand() * 60 : 96 + rand() * 40, y = onStag ? 140 + rand() * 40 : 80 + rand() * 80, dx = (rand() - 0.5) * 14, sz = 2.6 + rand() * 3;
    fx(k.pic('mote', [x, y], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 120, { transform: `${k.T(dx * 0.2, -5)} scale(1)`, opacity: 0.95 }, 'linear'], [t + 950, { transform: `${k.T(dx, -26 - rand() * 12)} scale(.4)`, opacity: 0 }]]);
  }
}
