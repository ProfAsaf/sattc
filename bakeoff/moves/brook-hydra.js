// Brook Hydra: it drinks from the stream, grows, and sends its growth on.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support (it grows, and
// the growth is a boon it sends: green life), element: nature.
//   0-300     the five heads sway lazily, each on its own beat.
//   300-1000  it drinks (anticipation): the necks bow and lean in, the heads dip
//             toward the stream; rings spread at each neck's foot, and motes of
//             water and green light are drawn up the necks.
//   1000-1200 the heads rise (the necks stretch up and open out); the head
//             nearest T rears back a little for the strike.
//   1200      RELEASE (BEATS.release): that neck strikes toward T and spits a
//             stream of dew and leaves; the others lean after it, each a beat
//             behind the one beside it (a wave out along the heads).
//   1900      LANDS (BEATS.impact) at T = k.aim, else the bank on its left: a
//             flash, a ring, a burst of motes, and a sprig of leaves unfurling
//             that stands, then fades.
//   2000-3000 it grows: all five necks swell a little (the +1/+1) in a pulse of
//             green light, little plus signs of light rising from every head;
//             the swell eases back.
//   3700      at rest as drawn (the move ends at END).
//
// The contract: the boon leaves the mouth of the head nearest T (the neck turns
// toward T, left or right) and goes to T, on the overlay.
export const END = 4300;
export const BEATS = { release: 1200, impact: 1900, settle: 3700 };
export const STILLS = [350, 800, 1100, 1300, 1700, 2000, 2600, 4000];

export const textures = {
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226, 255, 190, Math.min(1, c * c * 1.5)]; }],
  drop: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [190, 245, 236, Math.min(1, c * c * 1.6)]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, M = S.heads, B = S.bases;
  const PV = k.spec.parts.map((p) => p.pivot);
  const T = k.aim || S.alone;
  const rad = (a) => (a * Math.PI) / 180;
  const rot = (v, a) => [v[0] * Math.cos(rad(a)) - v[1] * Math.sin(rad(a)), v[0] * Math.sin(rad(a)) + v[1] * Math.cos(rad(a))];

  k.css(`.g-brook { border-radius: 50%; background: radial-gradient(closest-side, rgba(244,255,214,.95), rgba(180,236,150,.55) 28%, rgba(120,206,140,.2) 58%, rgba(90,190,130,0) 100%); }`);

  const track = (keys) => (t) => {
    let i = keys.length - 1;
    while (i > 0 && keys[i][0] > t) i--;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const f = b[0] === a[0] ? 0 : sm(Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))));
    return a.slice(1).map((v, j) => v + (b[j + 1] - v) * f);
  };
  const grid = [];
  for (let t = 0; t <= 3660; t += 30) grid.push(t);
  const sample = (fn, last = { transform: 'none' }) => [...grid.map((t) => [t, fn(t), 'linear']), [3800, last]];

  // ── which neck strikes: the head nearest T; how far it turns to face it (about its joint)
  let j = 0;
  M.forEach((m, i) => { if (Math.hypot(m[0] - T[0], m[1] - T[1]) < Math.hypot(M[j][0] - T[0], M[j][1] - T[1])) j = i; });
  const ang = (p, q) => (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI;
  let turnJ = ang(PV[j], T) - ang(PV[j], M[j]);
  turnJ = Math.max(-60, Math.min(60, ((turnJ + 540) % 360) - 180));
  const dirT = T[0] >= PV[j][0] ? 1 : -1; // (the others lean after it this way)

  const bow = track([[0, 0], [300, 0], [800, 1], [1000, 1], [1120, 0]]);
  const rise = track([[0, 0], [980, 0], [1200, 1], [1600, 0.7], [2100, 0.3], [2800, 0]]);
  const grow = track([[0, 0], [2000, 0], [2400, 1], [2800, 1], [3500, 0]]);
  const swayEnv = track([[0, 0], [250, 1], [900, 0.5], [1200, 0.2], [2800, 1], [3400, 0.5], [3700, 0]]);
  const strike = track([[0, 0], [980, 0], [1090, -0.3], [1200, 1], [1340, 0.9], [1750, 0.45], [2350, 0.1], [3000, 0]]);
  const lean = track([[0, 0], [1150, 0], [1300, 1], [1700, 0.8], [2400, 0.2], [3200, 0]]); // the others, after it
  const neck = (i, t) => {
    const sg = Math.sign(M[i][0] - PV[i][0]) || 1;
    const lag = Math.abs(i - j) * 85;
    let r = swayEnv(t)[0] * (1.7 + 0.5 * (i % 2)) * Math.sin(t / 430 + i * 1.3);
    let sy = 1 - 0.07 * bow(t)[0] + 0.07 * rise(t)[0];
    r += -sg * 8 * bow(t)[0] + sg * 5 * rise(t)[0];
    if (i === j) { const s = strike(t)[0]; r += s * turnJ; sy += 0.11 * Math.max(0, s); }
    else r += dirT * 5.5 * lean(t - lag)[0];
    const g = grow(t)[0];
    return { r, sy: sy * (1 + 0.05 * g), sx: 1 + 0.06 * g };
  };
  const nTf = (i, t) => { const p = neck(i, t); return `rotate(${p.r.toFixed(2)}deg) scale(${p.sx.toFixed(3)}, ${p.sy.toFixed(3)})`; };
  for (let i = 0; i < 5; i++) act(k.part(`neck${i}`), sample((t) => ({ transform: nTf(i, t) })));
  // where the striking head's mouth is at time t
  const mouth = (t) => { const p = neck(j, t), v = rot([(M[j][0] - PV[j][0]) * p.sx, (M[j][1] - PV[j][1]) * p.sy], p.r); return [PV[j][0] + v[0], PV[j][1] + v[1]]; };
  const E = mouth(1260);

  // ── light and water: rings at the necks' feet, spreading as it drinks and again as it strikes
  const ringE = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".7"/></filter></defs><ellipse cx="30" cy="10" rx="26" ry="6.5" fill="none" stroke="#eefbe0" stroke-width="1.6" filter="url(#b)"/>', 60, 20);
  B.forEach(([x, y], i) => {
    [[350 + i * 90, 3.2, 0.7], [820 + i * 60, 3.6, 0.55]].forEach(([t, sc, o]) => fx(k.picIn(ringE, [x, y + 5], 22, 7.4), [[t, { transform: 'scale(.3, .3)', opacity: 0 }, 'ease-out'], [t + 60, { transform: 'scale(.6, .6)', opacity: o }, 'ease-out'], [t + 900, { transform: `scale(${sc}, ${sc})`, opacity: 0 }]]));
    const ts = 1200 + Math.abs(i - 2) * 90 + (i === j ? -40 : 0);
    fx(k.picIn(ringE, [x, y + 5], 22, 7.4), [[ts, { transform: 'scale(.3, .3)', opacity: 0 }, 'ease-out'], [ts + 60, { transform: 'scale(.6, .6)', opacity: 0.8 }, 'ease-out'], [ts + 1000, { transform: 'scale(4.2, 4.2)', opacity: 0 }]]);
  });
  // a soft green light in the water that gathers as it drinks
  fx(k.lightIn('g-brook', [150, 158], 230, 70), [[250, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(1)', opacity: 0.6 }, eio], [1500, { transform: 'scale(1.1)', opacity: 0.4 }, eio], [2300, { transform: 'scale(1.1)', opacity: 0.7 }, eio], [3500, { transform: 'scale(.9)', opacity: 0 }]]);

  // ── drinking: motes of water and green light drawn up each neck from its foot to its head
  for (let i = 0; i < 5; i++) {
    for (let n = 0; n < 5; n++) {
      const t = 330 + n * 120 + rand() * 120 + i * 20, sz = 3 + rand() * 3, f = 0.5 + rand() * 0.5;
      const dx = (M[i][0] - B[i][0]) * f, dy = (M[i][1] - B[i][1]) * f, jx = (rand() - 0.5) * 8;
      fx(k.pic(n % 2 ? 'drop' : 'mote', [B[i][0] + jx, B[i][1]], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 100, { transform: `${k.T(dx * 0.1, dy * 0.1)} scale(1)`, opacity: 0.95 }, 'linear'], [t + 700 + rand() * 200, { transform: `${k.T(dx, dy)} scale(.4)`, opacity: 0 }]]);
    }
  }
  // the heads glow as they drink, and flare as they rise
  M.forEach(([x, y], i) => {
    const t = 750 + i * 40;
    fx(k.lightIn('g-brook', [x - 8 * Math.sign(x - B[i][0]), y - 2], 36, 30), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 300, { transform: 'scale(1)', opacity: 0.7 }, eio], [t + 700, { transform: 'scale(1.2)', opacity: 0.3 }, eio], [t + 1700, { transform: 'scale(.8)', opacity: 0 }]]);
  });

  // ── the strike (BEATS.release): a puff of spray at the mouth, then a stream of dew and leaves along an arc to T
  const leaf = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".5"/></filter></defs><path d="M3,10C5,3 13,1 17,2C16,9 11,16 3,10Z" fill="#b6e98f" filter="url(#b)"/><path d="M3.6,9.6C6,4.5 12,3 15.5,3.2C14.5,8.5 10.5,13.5 3.6,9.6Z" fill="#effcc8"/>', 20, 14);
  const C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 30];
  const bz = (u) => { const q = 1 - u; return [q * q * E[0] + 2 * q * u * C[0] + u * u * T[0], q * q * E[1] + 2 * q * u * C[1] + u * u * T[1]]; };
  const [X0, Y0] = k.P(...E);
  fx(k.light('g-brook', E, 46), [[1170, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1260, { transform: 'scale(1.1)', opacity: 0.95 }, 'ease-out'], [1560, { transform: 'scale(1.4)', opacity: 0 }]]);
  for (let n = 0; n < 24; n++) {
    const t0 = 1200 + n * 26, u0 = 0, kind = n % 4 === 3 ? 'leaf' : n % 2 ? 'drop' : 'mote', sz = kind === 'leaf' ? 9 : 5 + rand() * 4, side = (rand() - 0.5) * 9, spin = Math.round((rand() - 0.5) * 360);
    const dur = 640 + rand() * 120;
    const at = (f, sc, o) => { const [x, y] = k.P(...bz(f)); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + side * Math.sin(Math.PI * f) * k.u).toFixed(1)}px) rotate(${Math.round(spin * f)}deg) scale(${sc})`, opacity: o }; };
    fx(k.pic(kind === 'leaf' ? leaf : kind, E, sz, kind === 'leaf' ? sz * 0.7 : sz), [[t0, at(u0, 0.4, 0), 'ease-out'], [t0 + 60, at(0.08, 1, 1), 'linear'], [t0 + dur * 0.5, at(0.5, 1, 1), 'linear'], [t0 + dur, at(1, 1.1, 0.9), 'ease-out'], [t0 + dur + 220, at(1, 0.4, 0)]]);
  }

  // ── where it lands (BEATS.impact): a flash and a ring, a burst of motes, a sprig of leaves unfurling
  const I = 1900;
  const ringC = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#eaffd0" stroke-width="3" filter="url(#b)"/>', 60, 60);
  fx(k.light('g-brook', T, 80), [[I - 60, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [I + 40, { transform: 'scale(1.3)', opacity: 1 }, eio], [I + 300, { transform: 'scale(1.5)', opacity: 0.6 }, eio], [2600, { transform: 'scale(1.5)', opacity: 0.4 }, eio], [3200, { transform: 'scale(1.1)', opacity: 0 }]]);
  [[0, 3.4, 0.9], [150, 2.5, 0.6]].forEach(([dt, sc, o]) => fx(k.pic(ringC, T, 28, 28), [[I + dt, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [I + dt + 50, { transform: 'scale(.6)', opacity: o }], [I + dt + 800, { transform: `scale(${sc})`, opacity: 0 }]]));
  for (let n = 0; n < 18; n++) {
    const a = rand() * Math.PI * 2, dist = 10 + rand() * 26, sz = 3 + rand() * 4, t = I + rand() * 120;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * dist * f, Math.sin(a) * dist * f * 0.7 - 22 * f)} scale(${sc})`, opacity: o });
    fx(k.pic(n % 3 ? 'mote' : 'drop', T, sz, sz), [[t, P(0, 0.5, 0), 'ease-out'], [t + 60, P(0.2, 1.1, 1), 'ease-out'], [t + 900 + rand() * 500, P(1, 0.4, 0)]]);
  }
  // a sprig: a stalk and leaves growing from T's ground, standing, then fading
  const sprig = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".5"/></filter></defs><g filter="url(#b)" fill="#9fdc7a"><path d="M20,40C20,28 19,20 20,8" stroke="#7fc460" stroke-width="2.2" fill="none"/><path d="M20,30C12,28 6,22 5,15C13,16 19,22 20,30Z"/><path d="M20,24C28,22 34,16 35,9C27,10 21,16 20,24Z"/><path d="M20,15C15,13 12,9 12,3C18,5 20,9 20,15Z"/><path d="M20,12C25,10 28,6 28,0C22,2 20,6 20,12Z"/></g><g fill="#effcc8" opacity=".8"><path d="M20,30C13,28 9,24 8,19C14,20 19,24 20,30Z"/><path d="M20,24C27,22 31,18 32,12C26,13 21,18 20,24Z"/></g>', 40, 42);
  [[-6, 0.9, 0], [7, 1.1, 120], [1, 0.8, 260]].forEach(([dx, sc, dt]) => {
    const s0 = I + 80 + dt, h = 24 * sc;
    fx(k.pic(sprig, [T[0] + dx, T[1] + 8], 24 * sc, h, { base: true }), [[s0, { transform: 'scale(.15, .05)', opacity: 0 }, 'cubic-bezier(.2,.8,.3,1)'], [s0 + 320, { transform: 'scale(1.08, 1.1)', opacity: 1 }, eio], [s0 + 480, { transform: 'scale(1, 1)', opacity: 1 }, eio],
      [s0 + 1000, { transform: 'scale(1.03, .98) rotate(2deg)', opacity: 1 }, eio], [s0 + 1300, { transform: 'scale(1, 1) rotate(-2deg)', opacity: 0.9 }, eio], [s0 + 1700, { transform: 'scale(.9, .9)', opacity: 0 }]]);
  });

  // ── it grows (2000-3000): a pulse of green light over the hydra, and +1 signs of light rising from every head
  fx(k.lightIn('g-brook', [150, 112], 220, 170), [[1950, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [2400, { transform: 'scale(1)', opacity: 0.75 }, eio], [2800, { transform: 'scale(1.1)', opacity: 0.55 }, eio], [3500, { transform: 'scale(1.2)', opacity: 0 }]]);
  const plus = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".5"/></filter></defs><path d="M7,1H9V7H15V9H9V15H7V9H1V7H7Z" fill="#d8ffa8" filter="url(#b)"/><path d="M7.3,2H8.7V7.3H14V8.7H8.7V14H7.3V8.7H2V7.3H7.3Z" fill="#fffff0"/>', 16, 16);
  M.forEach(([x, y], i) => {
    const t = 2150 + i * 130;
    fx(k.pic(plus, [x, y - 10], 9, 9), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 160, { transform: `${k.T(0, -5)} scale(1.1)`, opacity: 1 }, 'linear'], [t + 900, { transform: `${k.T(0, -24)} scale(.8)`, opacity: 0 }]]);
    for (let n = 0; n < 4; n++) {
      const tt = t + n * 90, dx = (rand() - 0.5) * 24, sz = 3 + rand() * 3;
      fx(k.pic('mote', [x + (rand() - 0.5) * 8, y - 4], sz, sz), [[tt, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [tt + 120, { transform: `${k.T(dx * 0.2, -6)} scale(1)`, opacity: 0.95 }, 'linear'], [tt + 800, { transform: `${k.T(dx, -26 - rand() * 10)} scale(.4)`, opacity: 0 }]]);
    }
  });
}
