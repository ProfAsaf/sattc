// Sproutling: it drinks the beam of sun, springs up a size, and sends its growth on.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support (Grows 1, power 0:
// it only helps), element: nature. Its parts: the stem (about its foot in the soil),
// the two leaves (about the stem's top; they ride the stem as it bends and stretches)
// and the seed husk on the left leaf's tip.
//   0-250     still, a faint sway.
//   250-1000  it gathers (anticipation): it crouches a little as the leaves cup up
//             toward the beam; motes of light are drawn down the beam into the leaves,
//             a ring spreads in the soil, the glow between the leaves swells.
//   1000-1180 it springs: the stem stretches up with overshoot, the leaves fling open
//             and down (the one on T's side flicks up first), crumbs of soil jump.
//   1100      RELEASE (BEATS.release): a flash between the leaves, and a stream of
//             motes and little leaves arcs from `emit` to T, on the overlay.
//   1700      LANDS (BEATS.impact) at T = k.aim, else the ground on its right: a flash,
//             a ring, a burst of motes, and a tiny sprout of two leaves unfurling there.
//   1300-2800 it has grown: stem and leaves a size larger in a pulse of light, +1 signs
//             rising from the leaves; then it eases back down.
//   3500      at rest as drawn (the move ends at END).
//
// The contract: the boon leaves from `emit` (between the leaves) and goes to T.
export const END = 4000;
export const BEATS = { release: 1100, impact: 1700, settle: 3500 };
export const STILLS = [250, 700, 1000, 1150, 1450, 1800, 2500, 3800];

export const textures = {
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [240, 255, 200, Math.min(1, c * c * 1.5)]; }],
  crumb: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2; return [48, 36, 22, r < 0.8 ? 1 : Math.max(0, (1 - r) * 5)]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, sm = k.smooth, eio = 'ease-in-out';
  const S = k.spec, [jx, jy] = S.joint, [bx, by] = S.base;
  const E = S.emit, T = k.aim || S.alone;
  const stem = k.part('stem'), leafL = k.part('leafL'), leafR = k.part('leafR'), husk = k.part('husk');
  const dirT = T[0] >= jx ? 1 : -1; // the leaf on T's side flicks first (+1: the right one)

  k.css(`.g-sprout { border-radius: 50%; background: radial-gradient(closest-side, rgba(250,255,222,.95), rgba(214,248,150,.55) 30%, rgba(160,222,120,.2) 60%, rgba(120,200,110,0) 100%); }`);

  // a curve through [ms, value] keys, eased between them
  const track = (keys) => (t) => {
    let i = keys.length - 1;
    while (i > 0 && keys[i][0] > t) i--;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const f = b[0] === a[0] ? 0 : sm(Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))));
    return a[1] + (b[1] - a[1]) * f;
  };
  const crouch = track([[0, 0], [250, 0], [900, 1], [1000, 1], [1100, 0]]); // sinks, leaves cup up
  const spring = track([[0, 0], [1000, 0], [1160, 1.35], [1330, 1.0], [1700, 1.1], [2800, 1], [3500, 0]]); // the stretch, with overshoot
  const open = track([[0, 0], [1000, 0], [1150, 1], [1500, 0.55], [2800, 0.5], [3500, 0]]); // leaves flung wide and down
  const sway = track([[0, 0], [250, 1], [900, 0.4], [1100, 0], [2300, 1], [3300, 0.4], [3600, 0]]);
  const flick = track([[0, 0], [1060, 0], [1130, 1], [1400, 0.2], [1700, 0]]); // the T-side leaf throws the boon
  const big = track([[0, 0], [1250, 0], [1650, 1], [2700, 1], [3500, 0]]); // grown a size (Grows 1)

  const pose = (t) => {
    const c = crouch(t), s = spring(t), o = open(t), sw = sway(t) * 1.6 * Math.sin(t / 380), g = big(t);
    const sy = 1 - 0.06 * c + 0.05 * s + 0.045 * g;
    const sx = 1 + 0.05 * g;
    const r = sw + (t > 1100 && t < 1700 ? 0.6 * s * Math.sin(t / 90) : 0);
    const rr = (r * Math.PI) / 180;
    // the stem's top, carried by the stem (rotate then scale: scale is applied first)
    const h = (by - jy) * sy;
    const dx = h * Math.sin(rr), dy = -h * Math.cos(rr) + (by - jy);
    return { sy, sx, r, dx, dy, c, s, o, g };
  };
  const grid = [];
  for (let t = 0; t <= 3500; t += 30) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3600, { transform: 'none' }]];
  act(stem, sample((t) => { const p = pose(t); return { transform: `rotate(${p.r.toFixed(2)}deg) scale(${p.sx.toFixed(3)}, ${p.sy.toFixed(3)})` }; }));
  // the leaves: ride the stem's top, cup up as it crouches, fling open and down, the T-side one flicking first
  const leaf = (side) => (t) => {
    const p = pose(t), up = side > 0 ? -1 : 1; // the rotate() sign that lifts this leaf's tip
    const fl = side === dirT ? flick(t) : 0;
    const a = p.r + up * (26 * p.c + 24 * fl) - up * 20 * p.o - up * 2.5 * Math.sin(t / 300 + side) * sway(t);
    const sc = 1 - 0.07 * p.c + 0.07 * p.s + 0.1 * p.g;
    return { transform: `translate(${(p.dx * u).toFixed(2)}px, ${(p.dy * u).toFixed(2)}px) rotate(${a.toFixed(2)}deg) scale(${sc.toFixed(3)})` };
  };
  act(leafL, sample(leaf(-1)));
  act(leafR, sample(leaf(1)));
  act(husk, sample(leaf(-1))); // (the husk is caught on the left leaf's tip, so it goes with it)

  // ── light: a glow between the leaves that swells as it drinks, flares as it springs, pulses as it grows
  const J = [jx, jy - 6];
  fx(k.lightIn('g-sprout', J, 90, 70), [[200, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [950, { transform: 'scale(1)', opacity: 0.75 }, eio], [1150, { transform: 'scale(1.5)', opacity: 1 }, eio],
    [1700, { transform: 'scale(1.25)', opacity: 0.8 }, eio], [2300, { transform: 'scale(1.35)', opacity: 0.55 }, eio], [2800, { transform: 'scale(1.25)', opacity: 0.7 }, eio], [3500, { transform: 'scale(.9)', opacity: 0 }]]);
  // a warm patch on the soil round its foot
  fx(k.lightIn('g-sprout', [bx, by + 2], 120, 26), [[300, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(1)', opacity: 0.55 }, eio], [1200, { transform: 'scale(1.2)', opacity: 0.8 }, eio], [2400, { transform: 'scale(1.1)', opacity: 0.5 }, eio], [3400, { transform: 'scale(.9)', opacity: 0 }]]);

  // ── the beam's light drawn down into the leaves
  for (let n = 0; n < 16; n++) {
    const f = 0.15 + rand() * 0.7, sx0 = 56 + 48 * f + (rand() - 0.5) * 6, sy0 = 4 + 74 * f, t = 300 + n * 45 + rand() * 40;
    const tx = jx + (rand() - 0.5) * 36, ty = jy - 8 + (rand() - 0.5) * 8, sz = 3 + rand() * 3.4;
    fx(k.pic('mote', [sx0, sy0], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 120, { transform: 'scale(1)', opacity: 0.95 }, 'linear'],
      [t + 620 + rand() * 120, { transform: `${k.T(tx - sx0, ty - sy0)} scale(.5)`, opacity: 0 }]]);
  }

  // ── rings in the soil at its foot: as it drinks, springs, and grows
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".7"/></filter></defs><ellipse cx="30" cy="10" rx="26" ry="6.5" fill="none" stroke="#f4ffd2" stroke-width="1.7" filter="url(#b)"/>', 60, 20);
  [[400, 0.6, 3.6, 900], [1090, 0.9, 4.6, 1000], [1700, 0.6, 5, 1100]].forEach(([t, o, sc, d]) => fx(k.picIn(ring, [bx, by + 2], 22, 7.4), [[t, { transform: 'scale(.3, .3)', opacity: 0 }, 'ease-out'], [t + 60, { transform: 'scale(.6, .6)', opacity: o }, 'ease-out'], [t + d, { transform: `scale(${sc}, ${sc})`, opacity: 0 }]]));
  // crumbs of soil jumping as it springs
  for (let n = 0; n < 9; n++) {
    const t = 1080 + rand() * 80, dx = (rand() - 0.5) * 40, up = 10 + rand() * 14, sz = 1.4 + rand() * 1.6;
    const P = (f, y, o) => ({ transform: `${k.T(dx * f, -y)} scale(1)`, opacity: o });
    fx(k.picIn('crumb', [bx + (rand() - 0.5) * 20, by + 1], sz, sz, { lit: false }), [[t, P(0, 0, 1), 'cubic-bezier(.2,.7,.4,1)'], [t + 220, P(0.5, up, 1), 'cubic-bezier(.5,0,.8,.5)'], [t + 480, P(1, -2, 0)]]);
  }

  // ── the boon (BEATS.release): a flash between the leaves, then a stream of motes and little leaves along an arc to T
  const leafImg = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".5"/></filter></defs><path d="M3,10C5,3 13,1 17,2C16,9 11,16 3,10Z" fill="#b6e98f" filter="url(#b)"/><path d="M3.6,9.6C6,4.5 12,3 15.5,3.2C14.5,8.5 10.5,13.5 3.6,9.6Z" fill="#effcc8"/>', 20, 14);
  fx(k.light('g-sprout', E, 56), [[1040, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1110, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [1500, { transform: 'scale(1.5)', opacity: 0 }]]);
  const C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 28];
  const bz = (q) => { const w = 1 - q; return [w * w * E[0] + 2 * w * q * C[0] + q * q * T[0], w * w * E[1] + 2 * w * q * C[1] + q * q * T[1]]; };
  const [X0, Y0] = k.P(...E);
  for (let n = 0; n < 34; n++) {
    const t0 = 1100 + n * 17, kind = n % 4 === 3 ? 'leaf' : 'mote', sz = kind === 'leaf' ? 10 : 5 + rand() * 5, side = (rand() - 0.5) * 8, spin = Math.round((rand() - 0.5) * 360), dur = 520 + rand() * 90;
    const at = (f, sc, o) => { const [x, y] = k.P(...bz(f)); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + side * Math.sin(Math.PI * f) * u).toFixed(1)}px) rotate(${Math.round(spin * f)}deg) scale(${sc})`, opacity: o }; };
    fx(k.pic(kind === 'leaf' ? leafImg : 'mote', E, sz, kind === 'leaf' ? sz * 0.7 : sz), [[t0, at(0, 0.4, 0), 'ease-out'], [t0 + 60, at(0.08, 1, 1), 'linear'], [t0 + dur * 0.5, at(0.5, 1, 1), 'linear'], [t0 + dur, at(1, 1.1, 0.9), 'ease-out'], [t0 + dur + 200, at(1, 0.4, 0)]]);
  }

  // ── where it lands (BEATS.impact): flash, ring, motes, and a tiny sprout unfurling
  const I = 1700;
  const ringC = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#f0ffd2" stroke-width="3" filter="url(#b)"/>', 60, 60);
  fx(k.light('g-sprout', T, 74), [[I - 60, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [I + 40, { transform: 'scale(1.3)', opacity: 1 }, eio], [I + 300, { transform: 'scale(1.4)', opacity: 0.6 }, eio], [2500, { transform: 'scale(1.4)', opacity: 0.4 }, eio], [3100, { transform: 'scale(1)', opacity: 0 }]]);
  [[0, 3.2, 0.9], [150, 2.3, 0.6]].forEach(([dt, sc, o]) => fx(k.pic(ringC, T, 26, 26), [[I + dt, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [I + dt + 50, { transform: 'scale(.6)', opacity: o }], [I + dt + 800, { transform: `scale(${sc})`, opacity: 0 }]]));
  for (let n = 0; n < 16; n++) {
    const a = rand() * Math.PI * 2, dist = 8 + rand() * 24, sz = 3 + rand() * 3.4, t = I + rand() * 120;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * dist * f, Math.sin(a) * dist * f * 0.7 - 20 * f)} scale(${sc})`, opacity: o });
    fx(k.pic('mote', T, sz, sz), [[t, P(0, 0.5, 0), 'ease-out'], [t + 60, P(0.2, 1.1, 1), 'ease-out'], [t + 900 + rand() * 500, P(1, 0.4, 0)]]);
  }
  // a small sprout: a stalk and two leaves, growing from T's ground, standing a while, then fading
  const sprout = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".5"/></filter></defs><g filter="url(#b)"><path d="M20,40C20,32 19,26 20,20" stroke="#7fc460" stroke-width="2.4" fill="none"/><path d="M20,22C13,22 6,17 4,10C12,10 19,15 20,22Z" fill="#b8ec8a"/><path d="M20,22C27,22 34,17 36,10C28,10 21,15 20,22Z" fill="#b8ec8a"/></g><path d="M19.4,21C13.5,20.5 8.5,17 7,12.5C13,13 18,16 19.4,21Z" fill="#f2fdd0" opacity=".85"/><path d="M20.6,21C26.5,20.5 31.5,17 33,12.5C27,13 22,16 20.6,21Z" fill="#f2fdd0" opacity=".85"/>', 40, 42);
  [[-5, 0.9, 0], [8, 1.1, 130]].forEach(([dx, sc, dt]) => {
    const s0 = I + 80 + dt, h = 22 * sc;
    fx(k.pic(sprout, [T[0] + dx, T[1] + 8], 22 * sc, h, { base: true }), [[s0, { transform: 'scale(.15, .05)', opacity: 0 }, 'cubic-bezier(.2,.8,.3,1)'], [s0 + 320, { transform: 'scale(1.1, 1.12)', opacity: 1 }, eio], [s0 + 480, { transform: 'scale(1, 1)', opacity: 1 }, eio],
      [s0 + 1000, { transform: 'scale(1.03, .98) rotate(2deg)', opacity: 1 }, eio], [s0 + 1300, { transform: 'scale(1, 1) rotate(-2deg)', opacity: 0.9 }, eio], [s0 + 1700, { transform: 'scale(.9, .9)', opacity: 0 }]]);
  });

  // ── it has grown: +1 signs of light rising from the leaves, and sparkles round them
  const plus = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".5"/></filter></defs><path d="M7,1H9V7H15V9H9V15H7V9H1V7H7Z" fill="#d8ffa8" filter="url(#b)"/><path d="M7.3,2H8.7V7.3H14V8.7H8.7V14H7.3V8.7H2V7.3H7.3Z" fill="#fffff0"/>', 16, 16);
  [[1450, -36, 62], [1700, 38, 66], [1950, 0, 52]].forEach(([t, dx, y]) => fx(k.pic(plus, [jx + dx, y], 10, 10), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 180, { transform: `${k.T(0, -5)} scale(1.1)`, opacity: 1 }, 'linear'], [t + 1000, { transform: `${k.T(0, -26)} scale(.8)`, opacity: 0 }]]));
  for (let n = 0; n < 14; n++) {
    const t = 1400 + n * 110 + rand() * 60, side = n % 2 ? 1 : -1, x = jx + side * (10 + rand() * 40), dx = (rand() - 0.5) * 14, sz = 2.6 + rand() * 3;
    fx(k.pic('mote', [x, jy - 12 + rand() * 12], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 120, { transform: `${k.T(dx * 0.2, -5)} scale(1)`, opacity: 0.95 }, 'linear'], [t + 900, { transform: `${k.T(dx, -26 - rand() * 12)} scale(.4)`, opacity: 0 }]]);
  }
}
