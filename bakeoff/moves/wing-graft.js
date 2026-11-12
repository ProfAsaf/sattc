// Wing Graft: her borrowed wings beat once and fling a volley of spray feathers.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker (a Bird with
// Soar: its wings strike), element: water. Aimed: the volley goes to
// T = k.aim, or, alone, out over the sea to the left (38, 138), the way she
// looks.
//   0-700     gathers: the wings sweep up and back and spread (a little larger),
//             she crouches and leans toward T; drops of spray and motes are
//             drawn in to the shoulders, a glow gathers between the wings.
//   700-1000  the downstroke: both wings slam forward and down (fast,
//             ease-in); at 1000 (RELEASE) a flash runs over them (a lit copy),
//             she is lifted onto her toes, a ring of light at the shoulders,
//             and the feathers are flung: long spray feathers, turned along
//             their flight, with drops streaming behind, from the wings on the
//             side of T, one after another, along an arc to T. The downdraft
//             throws foam out over the sea on both sides.
//   1500      IMPACT: they strike T in a burst of spray: starburst, ring,
//             foam and drops, light, bubbles of foam rising; the water thrown up.
//   1000-2400 the wings overshoot and flutter, damped (three decreasing
//             beats); she sinks back and settles; the light dies down.
//   3000      at rest as drawn (the move ends at END).
export const END = 4200;
export const BEATS = { release: 1000, impact: 1500, settle: 3200 };
export const STILLS = [350, 800, 1000, 1180, 1500, 1800, 2400, 3900];

export const textures = {
  drop: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226, 252, 252, Math.min(1, c * 2.2)]; }],
  foam: [48, 48, (x, y) => {
    const r = Math.hypot(x - 0.5, y - 0.5) * 2, n = 0.5 + 0.5 * Math.sin(x * 19 + y * 11) * Math.cos(y * 17 - x * 7);
    const c = Math.max(0, 1 - r * (0.85 + 0.3 * n)); return [232, 253, 250, Math.min(1, c * c * 1.5)];
  }],
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [214, 250, 250, Math.min(1, c * c * 1.5)]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const E = k.spec.emit, [SL, SR] = k.spec.shoulders;
  const T = k.aim || [38, 138];
  const sgn = T[0] >= E[0] ? 1 : -1, REL = 1000, IMP = 1500;
  const wl = k.part('wingL'), wr = k.part('wingR'), her = k.part('her');

  k.css(`.g-sea { border-radius: 50%; background: radial-gradient(closest-side, rgba(238,255,253,.92), rgba(196,244,244,.42) 34%, rgba(150,225,232,.12) 64%, rgba(150,225,232,0) 100%); }
    .fx-copy.f-lit { filter: brightness(2.2) saturate(.6) drop-shadow(0 0 3px rgba(235,255,255,.9)); }`);

  // a track: keys [ms, a, b, ...] read at any ms, eased between
  const track = (keys) => (t) => {
    let i = keys.length - 1;
    while (i > 0 && keys[i][0] > t) i--;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const f = b[0] === a[0] ? 0 : sm(Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))));
    return a.slice(1).map((v, j) => v + (b[j + 1] - v) * f);
  };
  const grid = [];
  for (let t = 0; t <= 3300; t += 40) grid.push(t);
  const sampled = (fn, rest) => [...grid.map((t) => [t, fn(t), 'linear']), [3500, rest]];

  // ── the wings: up and back (gather), the downstroke, overshoot, then damped beats; each about its shoulder
  const wk = track([[0, 0, 1], [700, 17, 1.05], [830, 18, 1.055], [1000, -19, 0.96], [1150, -2, 1.02], [1290, 7, 1.02], [1450, -8, 0.99], [1620, 4, 1], [1800, -4, 1], [2000, 2, 1], [2250, -1, 1], [2800, 0, 1]]);
  const wpose = (t, side) => { const [a, s] = wk(t); return `rotate(${(side * a).toFixed(2)}deg) scale(${s.toFixed(3)})`; };
  act(wl, sampled((t) => ({ transform: wpose(t, 1) }), { transform: 'none' }));
  act(wr, sampled((t) => ({ transform: wpose(t, -1) }), { transform: 'none' }));
  // a flash over the wings at the stroke (lit copies, moving with them)
  const fk = track([[0, 0], [940, 0], [1010, 0.9], [1180, 0.35], [1600, 0]]);
  act(k.copy('wingL', 'f-lit'), sampled((t) => ({ transform: wpose(t, 1), opacity: +fk(t)[0].toFixed(2) }), { transform: 'none', opacity: 0 }));
  act(k.copy('wingR', 'f-lit'), sampled((t) => ({ transform: wpose(t, -1), opacity: +fk(t)[0].toFixed(2) }), { transform: 'none', opacity: 0 }));
  // she crouches, is lifted onto her toes by the stroke, sinks back and settles
  const hk = track([[0, 0, 1, 0], [650, 1.8, 0.984, sgn * 1.2], [820, 2.1, 0.98, sgn * 1.4], [1000, -3.4, 1.03, sgn * -1.2], [1160, -0.6, 1, 0], [1400, 1.0, 0.99, sgn * 0.4], [1750, -0.3, 1, 0], [2300, 0.2, 1, 0], [2900, 0, 1, 0]]);
  act(her, sampled((t) => { const [y, s, r] = hk(t); return { transform: `${k.T(0, y)} rotate(${r.toFixed(2)}deg) scale(1, ${s.toFixed(3)})` }; }, { transform: 'none' }));

  // ── gathering: a glow between the wings, spray and motes drawn in to the shoulders
  fx(k.lightIn('g-sea', [150, 96], 150, 110), [[100, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [820, { transform: 'scale(1)', opacity: 0.55 }, eio], [1020, { transform: 'scale(1.2)', opacity: 1 }, eio], [1500, { transform: 'scale(1.3)', opacity: 0.55 }, eio], [2400, { transform: 'scale(1.1)', opacity: 0 }]]);
  for (let i = 0; i < 18; i++) {
    const side = i % 2 ? 1 : -1, t1 = 700 + (i / 18) * 300, t0 = t1 - 500 - rand() * 100;
    const x0 = 150 + side * (40 + rand() * 80), y0 = 56 + rand() * 60, s = 3 + rand() * 4, S = side < 0 ? SL : SR;
    fx(k.pic(i % 3 ? 'drop' : 'mote', [x0, y0], s, s), [[t0, { transform: 'scale(.5)', opacity: 0 }, 'ease-in'], [t0 + 130, { transform: 'scale(1)', opacity: 0.95 }, 'ease-in'], [t1, { transform: `${k.T(S[0] - x0, S[1] - y0)} scale(.4)`, opacity: 0.9 }, 'ease-in'], [t1 + 60, { transform: `${k.T(S[0] - x0, S[1] - y0)} scale(.2)`, opacity: 0 }]]);
  }

  // ── the stroke (RELEASE): a ring of light at the shoulders, and the downdraft: foam thrown out over the sea both sides
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".8"/></filter></defs><circle cx="30" cy="30" r="25" fill="none" stroke="#effffe" stroke-width="3" filter="url(#b)"/>', 60, 60);
  fx(k.pic(ring, E, 40, 40), [[REL - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [REL + 40, { transform: 'scale(.7)', opacity: 0.95 }], [REL + 760, { transform: 'scale(4.8)', opacity: 0 }]]);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const x = 150 + side * (22 + i * 11 + rand() * 6), y = 133 + rand() * 6, t = REL - 20 + i * 30 + rand() * 40, sz = 11 + rand() * 7;
      fx(k.pic('foam', [x, y], sz * 1.4, sz * 0.8), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 100, { transform: `${k.T(side * 4, -3)} scale(1)`, opacity: 0.8 }, 'linear'], [t + 700, { transform: `${k.T(side * 22, -9)} scale(1.7, 1.2)`, opacity: 0 }]]);
    }
    const rip = k.svg('<ellipse cx="30" cy="30" rx="27" ry="6" fill="none" stroke="#e8fffd" stroke-width="1.6"/>', 60, 60);
    fx(k.pic(rip, [150 + side * 40, 138], 40, 40), [[REL + 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [REL + 120, { transform: 'scale(.6)', opacity: 0.7 }], [REL + 900, { transform: 'scale(2.6, 2)', opacity: 0 }]]);
  }

  // ── the volley: spray feathers along an arc from the wings (on T's side) to T, one after another
  const feather = k.svg('<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#bff0f2" stop-opacity="0"/><stop offset=".55" stop-color="#e6fffc" stop-opacity=".85"/><stop offset="1" stop-color="#fff"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation=".5"/></filter></defs>' +
    '<g filter="url(#b)"><path d="M0,8 C14,7 30,4 46,1 L50,8 L46,15 C30,12 14,9 0,8Z" fill="url(#g)"/></g><path d="M4,8 L46,8" stroke="#fff" stroke-width=".8" opacity=".8"/>', 50, 16);
  const C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 30 - Math.min(40, Math.abs(T[0] - E[0]) * 0.1)];
  const bz = (t, o) => { const q = 1 - t; return [q * q * E[0] + 2 * q * t * C[0] + t * t * (T[0] + o[0]), q * q * E[1] + 2 * q * t * C[1] + t * t * (T[1] + o[1])]; };
  const ang = (t, o) => { const a = bz(Math.max(0, t - 0.02), o), b = bz(Math.min(1, t + 0.02), o); return (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI; };
  const FT = IMP - REL;
  for (let i = 0; i < 14; i++) {
    const t0 = REL + i * 34 + rand() * 20, dur = FT - i * 14, o = [(rand() - 0.5) * 14, (rand() - 0.5) * 8];
    const start = [E[0] + sgn * (12 + rand() * 36), E[1] - 14 + rand() * 30], size = 15 + rand() * 9;
    const kf = [];
    for (let j = 0; j <= 7; j++) {
      const f = j / 7, e = f * f * 0.6 + f * 0.4, [x, y] = bz(e, o), bx = start[0] + (x - start[0]) * Math.min(1, f * 1.6 + 0.0), by = start[1] + (y - start[1]) * Math.min(1, f * 1.6);
      kf.push([Math.round(t0 + dur * f), { transform: `${k.T(bx - E[0], by - E[1])} rotate(${ang(e, o).toFixed(0)}deg) scale(${(0.5 + 0.55 * sm(Math.min(1, f * 2.2))).toFixed(2)}, ${(0.8 + 0.3 * f).toFixed(2)})`, opacity: j === 0 ? 0 : 1 }, j === 0 ? 'ease-out' : 'linear']);
    }
    const [lx, ly] = bz(1, o);
    kf.push([Math.round(t0 + dur + 120), { transform: `${k.T(lx - E[0], ly - E[1])} rotate(${ang(1, o).toFixed(0)}deg) scale(.3, .5)`, opacity: 0 }]);
    fx(k.pic(feather, [E[0] + sgn * 0, E[1]], size, size * 0.32), kf);
    // drops streaming behind it
    for (let j = 0; j < 3; j++) {
      const f = 0.25 + j * 0.25, e = f * f * 0.6 + f * 0.4, [x, y] = bz(e, o), t = t0 + dur * f + 20;
      fx(k.pic('drop', [x + (rand() - 0.5) * 5, y + (rand() - 0.5) * 5], 2.4 + rand() * 1.8, 2.4 + rand() * 1.8), [[t, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t + 60, { transform: 'scale(1)', opacity: 0.95 }, 'linear'], [t + 420, { transform: `${k.T((rand() - 0.5) * 6, 8 + rand() * 6)} scale(.4)`, opacity: 0 }]]);
    }
  }

  // ── the landing (IMPACT): a starburst of spray, a ring, light, foam and drops, bubbles, the water thrown up
  const star = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".6"/></filter></defs><g filter="url(#b)" fill="#f4fffe">' +
    Array.from({ length: 11 }, (_, i) => { const a = (-150 + i * 30 + (i % 2) * 6) * Math.PI / 180, l = i % 2 ? 15 : 26, w = i % 2 ? 3.2 : 4.4;
      return `<path d="M${30 + Math.cos(a + 1.57) * w},${30 + Math.sin(a + 1.57) * w}L${30 + Math.cos(a) * l},${30 + Math.sin(a) * l}L${30 + Math.cos(a - 1.57) * w},${30 + Math.sin(a - 1.57) * w}Z"/>`; }).join('') + '<circle cx="30" cy="30" r="5" fill="#fff"/></g>', 60, 60);
  fx(k.pic(star, T, 54, 54), [[IMP - 10, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [IMP + 40, { transform: 'scale(1) rotate(8deg)', opacity: 1 }, 'ease-out'], [IMP + 360, { transform: 'scale(1.5) rotate(16deg)', opacity: 0 }]]);
  fx(k.pic(ring, T, 36, 36), [[IMP - 10, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 40, { transform: 'scale(.6)', opacity: 0.95 }], [IMP + 700, { transform: 'scale(3.8)', opacity: 0 }]]);
  const rip2 = k.svg('<ellipse cx="30" cy="30" rx="27" ry="7" fill="none" stroke="#e8fffd" stroke-width="1.8"/>', 60, 60);
  [0, 160].forEach((d) => fx(k.pic(rip2, [T[0], T[1] + 6], 36, 36), [[IMP + d, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + d + 90, { transform: 'scale(.6)', opacity: 0.8 }], [IMP + d + 900, { transform: 'scale(3.2, 2.4)', opacity: 0 }]]));
  const il = [[IMP - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 50, { transform: 'scale(1.1)', opacity: 1 }, eio]];
  for (let t = IMP + 200, i = 0; t < 2300; t += 140, i++) il.push([t, { transform: `scale(${i % 2 ? 1.08 : 0.94})`, opacity: i % 2 ? 0.9 : 0.72 }, eio]);
  il.push([2800, { transform: 'scale(.8)', opacity: 0 }]);
  fx(k.light('g-sea', T, 80), il);
  for (let i = 0; i < 22; i++) {
    const a = rad(-200 + rand() * 220), d = 14 + rand() * 40, sz = 2 + rand() * 2.8, t0 = IMP + rand() * 60;
    const P = (f, sc, o) => { const e = 1 - (1 - f) * (1 - f); return { transform: `${k.T(Math.cos(a) * d * e, Math.sin(a) * d * e - 10 * e + 22 * f * f)} scale(${sc})`, opacity: o }; };
    fx(k.pic('drop', T, sz, sz), [[t0, P(0, 0.5, 0), 'ease-out'], [t0 + 40, P(0.12, 1.1, 1), 'linear'], [t0 + 380, P(0.75, 1, 0.9), 'linear'], [t0 + 700 + rand() * 200, P(1, 0.4, 0)]]);
  }
  for (let i = 0; i < 8; i++) {
    const a = rad(-190 + (200 * i) / 7 + (rand() - 0.5) * 16), d = 8 + rand() * 18, sz = 10 + rand() * 8, t0 = IMP + 10 + rand() * 60;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * d * f, Math.sin(a) * d * f * 0.9 - 6 * f)} scale(${sc})`, opacity: o });
    fx(k.pic('foam', T, sz, sz), [[t0, P(0, 0.4, 0), 'ease-out'], [t0 + 90, P(0.4, 1, 0.9), 'ease-out'], [t0 + 380, P(0.9, 1.2, 0.6), 'ease-in'], [t0 + 720, P(1, 1.5, 0)]]);
  }
  // a column of water thrown up at T, falling back
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * 4, t0 = IMP + 40 + i * 35;
    fx(k.pic('foam', [T[0] + x, T[1] + 6], 9 + rand() * 4, 14 + rand() * 6, { base: true }), [[t0, { transform: 'scale(.5, .2)', opacity: 0 }, 'ease-out'], [t0 + 140, { transform: `${k.T(x * 0.3, -6)} scale(1, 1.1)`, opacity: 0.9 }, 'ease-in-out'], [t0 + 520, { transform: `${k.T(x * 0.6, 0)} scale(1.1, .6)`, opacity: 0 }]]);
  }
  // wake: motes of spray drift down from the wings as they settle
  for (let i = 0; i < 10; i++) {
    const side = i % 2 ? 1 : -1, x = 150 + side * (30 + rand() * 90), y = 60 + rand() * 50, t = 1100 + rand() * 900;
    fx(k.pic('drop', [x, y], 2 + rand() * 1.6, 2 + rand() * 1.6), [[t, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t + 120, { transform: 'scale(1)', opacity: 0.9 }, 'linear'], [t + 900, { transform: `${k.T((rand() - 0.5) * 8, 20 + rand() * 16)} scale(.6)`, opacity: 0 }]]);
  }
}
const rad = (d) => (d * Math.PI) / 180;
