// Pearl Diver: she invests her pearl: it is sent out through the water, and where it lands it splits.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support (Pay 2 Energy: Invest: she puts
// something in and it grows; the suggestion was defender), element: water (as suggested). Alone
// her gift goes up and to the right, into the open water the light falls through (`alone`);
// aimed, to T = k.aim.
//   0-600      the gather: she kicks, her pearl arm draws the pearl in to her chest, and motes of
//              light run in to it from the water; the pearl swells and glows.
//   600-1100   a breath: the arm winds back a little, the pearl blazing, the light above brightening.
//   1100       (BEATS.release) the arm flings out toward T (past, then back), her legs kick, and
//              the pearl leaves her hand: a bead of light crossing the water on an arc, bubbles
//              shaken off in its wake.
//   1600       (BEATS.impact) at T the pearl flashes, rings run out, and it splits: two pearls
//              drift apart, then four small lights; bubbles and motes rise from them.
//   2000-3000  the arm comes home, the kicks die down; the lights cool and fade.
//   3000-3700  a new pearl forms in her hand (a pulse of light), the arm settled: at rest as
//              drawn (BEATS.settle); the move ends at END.
// Contract: T = k.aim || alone; the arm turns toward T (within what the arm can do), the flight is
// worked out from the pearl in her hand at the throw and T; everything that flies or lands is on
// the overlay (T may be on another card).
export const END = 4200;
export const BEATS = { release: 1100, impact: 1600, settle: 3700 };
export const STILLS = [350, 900, 1150, 1400, 1650, 2000, 2800, 3900];

export const textures = {
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [214 + 41 * c, 252, 246, Math.min(1, c * c * 2.2)]; }],
  star: [48, 48, (x, y) => { const dx = Math.abs(x - 0.5) * 2, dy = Math.abs(y - 0.5) * 2, c = Math.max(0, 1 - Math.hypot(dx, dy)), cr = Math.max(0, 1 - Math.min(dx * 9 + dy, dy * 9 + dx)), v = Math.min(1, c * c * 1.6 + cr * 0.9); return [235 + 20 * v, 252, 248, v]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth, fix = (n) => n.toFixed(2);
  const S = k.spec, E = S.emit, SH = S.shoulder, HIP = S.hip;
  const T = k.aim || S.alone, HOME = 3700;
  k.css(`.g-pearl { border-radius: 50%; background: radial-gradient(closest-side, rgba(244,255,250,.95), rgba(176,240,232,.6) 28%, rgba(110,210,216,.2) 58%, rgba(80,190,205,0) 100%); }
    .fx-copy.f-hot { mix-blend-mode: plus-lighter; filter: brightness(1.7) saturate(1.2); }`);
  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  const grid = [];
  for (let t = 0; t <= HOME + 20; t += 40) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [HOME + 100, { transform: 'none' }]];
  const turn = (P, deg) => { const r = (deg * Math.PI) / 180, vx = P[0] - SH[0], vy = P[1] - SH[1]; return [SH[0] + vx * Math.cos(r) - vy * Math.sin(r), SH[1] + vx * Math.sin(r) + vy * Math.cos(r)]; };

  // ── the arm: draws the pearl in, winds back, flings out toward T (as far as it can turn), comes home
  const angT = (Math.atan2(T[1] - SH[1], T[0] - SH[0]) * 180) / Math.PI, a0 = (Math.atan2(E[1] - SH[1], E[0] - SH[0]) * 180) / Math.PI;
  const D = Math.max(-55, Math.min(40, angT - a0));
  const phi = curve([[0, 0], [450, 40], [900, 44], [1020, 50], [1100, 50], [1190, D - 7], [1380, D], [1900, D * 0.9], [2900, 0], [3300, 0]]);
  act(k.part('arm'), sample((t) => ({ transform: `rotate(${fix(phi(t))}deg)` })));
  const handAt = (t) => turn(E, phi(t));
  const handTf = (t, extra = '') => { const [x, y] = handAt(t); return `translate(${fix((x - E[0]) * u)}px, ${fix((y - E[1]) * u)}px)${extra}`; };
  // ── the legs: a kick as she gathers, a harder one at the throw
  const kick = curve([[0, 0], [120, -6], [380, 7], [700, 0], [1050, 1], [1140, -12], [1500, 5], [1900, -2], [2400, 0]]);
  act(k.part('legs'), sample((t) => ({ transform: `rotate(${fix(kick(t))}deg)` })));

  // ── the pearl in her hand: swells with light, blazes, leaves at the throw; a new one forms at the end
  const gone = (t) => t > 1135 && t < 3000;
  const swell = curve([[0, 0], [500, 0.6], [1000, 1], [1100, 1.2], [1135, 0]]);
  const grow = curve([[3000, 0.3], [3550, 1.08], [HOME, 1]]);
  act(k.part('pearl'), [...grid.map((t) => [t, { transform: `${handTf(t)} scale(${fix(gone(t) ? 0.3 : t >= 3000 ? grow(t) : 1 + 0.12 * swell(t))})`, opacity: gone(t) ? 0 : t >= 3000 ? +Math.min(1, (t - 3000) / 300).toFixed(2) : 1 }, 'linear']), [HOME + 100, { transform: 'none', opacity: 1 }]]);
  act(k.copy('pearl', 'f-hot'), [...grid.map((t) => [t, { transform: `${handTf(t)} scale(${fix(gone(t) ? 0.3 : t >= 3000 ? grow(t) : 1 + 0.12 * swell(t))})`, opacity: gone(t) ? 0 : t >= 3000 ? +(Math.max(0, 1 - (t - 3000) / 900)).toFixed(2) : +(0.9 * swell(t)).toFixed(2) }, 'linear']), [HOME + 100, { transform: 'none', opacity: 0 }]]);
  // the glow round it, travelling with her hand
  const glowA = curve([[0, 0], [500, 0.6], [1000, 0.95], [1100, 1], [1135, 0.2], [1300, 0], [3000, 0], [3300, 0.8], [3700, 0]]);
  fx(k.light('g-pearl', E, 34), [...grid.map((t) => [t, { transform: `${handTf(t)} scale(${fix(0.5 + 0.9 * glowA(t))})`, opacity: +Math.min(0.95, glowA(t)).toFixed(2) }, 'linear']), [HOME + 100, { transform: 'scale(.5)', opacity: 0 }]]);
  // motes of light running in to the pearl as she gathers
  for (let i = 0; i < 16; i++) {
    const t0 = 60 + i * 38 + rand() * 30, a = rand() * Math.PI * 2, d = 20 + rand() * 18, [hx, hy] = handAt(t0 + 380), from = [hx + Math.cos(a) * d, hy + Math.sin(a) * d * 0.85], r = 4 + rand() * 3;
    const [x0, y0] = k.P(...from), [x1, y1] = k.P(hx, hy);
    const to = (f, o, s) => ({ transform: `translate(${fix((x1 - x0) * f)}px, ${fix((y1 - y0) * f)}px) scale(${s})`, opacity: o });
    fx(k.pic('mote', from, r, r), [[t0, to(0, 0, 0.5), 'ease-in'], [t0 + 100, to(0.15, 0.95, 1)], [t0 + 380, to(1, 0.9, 0.7), 'ease-in'], [t0 + 460, to(1, 0, 0.3)]]);
  }
  // the light from the surface answers the pearl: it brightens above her
  fx(k.lightIn('g-pearl', [176, 8], 230, 90), [[500, { transform: 'scale(.7)', opacity: 0 }, 'ease-out'], [1100, { transform: 'scale(1)', opacity: 0.5 }, eio], [1650, { transform: 'scale(1.1)', opacity: 0.75 }, eio], [2600, { transform: 'scale(1.05)', opacity: 0.3 }, eio], [3400, { transform: 'scale(1)', opacity: 0 }]]);

  // ── bubbles
  const bub = k.svg('<circle cx="10" cy="10" r="8.4" fill="#dffcf6" fill-opacity=".2" stroke="#effffb" stroke-width="1.3"/><path d="M5,8A6,6 0 0 1 9,4.4" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".9"/>', 20, 20);
  const bubbles = (from, t0, n, spread, riseBy, life) => {
    for (let i = 0; i < n; i++) {
      const ts = t0 + i * (50 + rand() * 30), r = 2.2 + rand() * 3.4, dx = (rand() - 0.5) * spread, side = (rand() - 0.5) * 5;
      const at = (f, o, s) => ({ transform: `translate(${fix((dx * f + side * Math.sin(f * 7 + i) * 0.5) * u)}px, ${fix(-riseBy * f * u)}px) scale(${s})`, opacity: o });
      fx(k.pic(bub, [from[0] + (rand() - 0.5) * 4, from[1]], r * 2, r * 2), [[ts, at(0, 0, 0.4), 'ease-out'], [ts + 120, at(0.1, 0.9, 1), 'linear'], [ts + life * 0.7, at(0.7, 0.8, 1), 'linear'], [ts + life, at(1, 0, 1.1)]]);
    }
  };

  // ── the throw: the pearl leaves her hand (BEATS.release) and crosses the water to T (BEATS.impact)
  const A = turn(E, D), R0 = 1100, R1 = 1600, dist = Math.hypot(T[0] - A[0], T[1] - A[1]), C = [(A[0] + T[0]) / 2, Math.min(A[1], T[1]) - 10 - dist * 0.15];
  const bz = (f) => { const q = 1 - f; return [q * q * A[0] + 2 * q * f * C[0] + f * f * T[0], q * q * A[1] + 2 * q * f * C[1] + f * f * T[1]]; };
  const pace = (f) => f * f * (0.35 + 0.65 * f);
  const [X0, Y0] = k.P(...A), at = (f) => { const [x, y] = k.P(...bz(f)); return `translate(${fix(x - X0)}px, ${fix(y - Y0)}px)`; };
  const pearl = k.svg('<defs><radialGradient id="g" cx=".38" cy=".34" r=".7"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#f8f4e6"/><stop offset=".8" stop-color="#d6eae6"/><stop offset="1" stop-color="#b0c4d4"/></radialGradient><filter id="b"><feGaussianBlur stdDeviation="2"/></filter></defs>' +
    '<circle cx="16" cy="16" r="11" fill="#eafffb" opacity=".7" filter="url(#b)"/><circle cx="16" cy="16" r="6.2" fill="url(#g)"/><circle cx="14" cy="13.8" r="1.5" fill="#fff"/>', 32, 32);
  const fl = [[R0 - 1, { transform: 'scale(1)', opacity: 0 }, 'linear'], [R0, { transform: 'scale(1)', opacity: 1 }, 'linear']];
  for (let i = 1; i <= 9; i++) { const f = i / 9; fl.push([R0 + (R1 - R0) * f, { transform: `${at(pace(f))} scale(${fix(1.05 + 0.15 * Math.sin(f * Math.PI))})`, opacity: 1 }, 'linear']); }
  fl.push([R1 + 60, { transform: `${at(1)} scale(1.3)`, opacity: 0 }]);
  fx(k.pic(pearl, A, 16, 16), fl);
  fx(k.light('g-pearl', A, 34), [[R0, { transform: 'scale(.6)', opacity: 0 }, 'linear'], ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => [R0 + (R1 - R0) * (i / 9), { transform: `${at(pace(i / 9))} scale(${fix(1.1 + 0.2 * Math.sin((i / 9) * Math.PI))})`, opacity: 0.85 }, 'linear']), [R1 + 120, { transform: `${at(1)} scale(1.3)`, opacity: 0 }]]);
  // a wake of bubbles and light-motes along the arc
  for (let i = 0; i < 18; i++) {
    const tau = 0.04 + (0.9 * i) / 18, [px, py] = k.P(...bz(pace(tau))), side = (rand() - 0.5) * 7, t0 = R0 + (R1 - R0) * tau, r = 2 + rand() * 3.2, isBub = i % 2;
    const dx = px - X0 + side, dy = py - Y0 + side;
    fx(k.pic(isBub ? bub : 'mote', A, r * 2, r * 2), [[t0, { transform: `translate(${fix(dx)}px, ${fix(dy)}px) scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 70, { transform: `translate(${fix(dx)}px, ${fix(dy)}px) scale(1)`, opacity: 0.9 }],
      [t0 + 520, { transform: `translate(${fix(dx + side * 0.5)}px, ${fix(dy - 12 * u)}px) scale(${isBub ? 1.1 : 0.4})`, opacity: 0 }]]);
  }
  bubbles([A[0], A[1] - 2], R0 + 20, 8, 10, 16, 1100);

  // ── where it lands (BEATS.impact): a flash, rings, and the pearl splits, then again
  fx(k.light('g-pearl', T, 76), [[R1 - 70, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [R1 + 40, { transform: 'scale(1.15)', opacity: 0.95 }], [R1 + 400, { transform: 'scale(1)', opacity: 0.6 }, eio], [R1 + 1300, { transform: 'scale(1.1)', opacity: 0.35 }, eio], [R1 + 1800, { transform: 'scale(1.3)', opacity: 0 }]]);
  fx(k.pic('star', T, 44, 44), [[R1 - 60, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [R1 + 30, { transform: 'scale(1.2) rotate(25deg)', opacity: 1 }], [R1 + 480, { transform: 'scale(.6) rotate(70deg)', opacity: 0 }]]);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1"/></filter></defs><circle cx="40" cy="40" r="34" fill="none" stroke="#eafffb" stroke-width="2.2" filter="url(#b)"/><circle cx="40" cy="40" r="29" fill="none" stroke="#a6efe8" stroke-width="1" opacity=".6"/>', 80, 80);
  fx(k.pic(ring, T, 60, 60), [[R1 - 30, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [R1 + 50, { transform: 'scale(.5)', opacity: 0.95 }], [R1 + 600, { transform: 'scale(1.7)', opacity: 0 }]]);
  fx(k.pic(ring, T, 60, 60), [[R1 + 150, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [R1 + 230, { transform: 'scale(.55)', opacity: 0.6 }], [R1 + 820, { transform: 'scale(2)', opacity: 0 }]]);
  // the pearl as it lands, splitting in two (a little after the flash), each splitting again into small ones
  const hang = (cx, cy, dx, dy, t0, size, tEnd) => {
    const mv = (f, s, o) => ({ transform: `translate(${fix(dx * f * u)}px, ${fix(dy * f * u)}px) scale(${s})`, opacity: o });
    fx(k.pic(pearl, [cx, cy], size, size), [[t0, mv(0, 0.5, 0), 'ease-out'], [t0 + 100, mv(0.05, 1.2, 1), eio], [t0 + 500, mv(1, 1, 1), 'ease-out'], [tEnd - 600, mv(1.1, 1, 0.9), eio], [tEnd, mv(1.15, 1.2, 0)]]);
    fx(k.light('g-pearl', [cx, cy], size * 1.9), [[t0, mv(0, 0.5, 0), 'ease-out'], [t0 + 120, mv(0.1, 1, 0.9), eio], [t0 + 500, mv(1, 1.05, 0.7), eio], [tEnd - 600, mv(1.1, 1, 0.5), eio], [tEnd, mv(1.15, 1.2, 0)]]);
  };
  hang(T[0], T[1], -13, -6, R1 + 40, 18, 3400);
  hang(T[0], T[1], 13, 5, R1 + 40, 18, 3400);
  hang(T[0], T[1], -22, 10, R1 + 560, 10, 3400);
  hang(T[0], T[1], 24, -9, R1 + 580, 10, 3400);
  hang(T[0], T[1], -2, -20, R1 + 620, 9, 3400);
  bubbles([T[0], T[1]], R1 + 100, 12, 26, 44, 1300);
  for (let i = 0; i < 14; i++) {
    const t0 = R1 + 150 + i * 60 + rand() * 40, a = rand() * Math.PI * 2, d = 8 + rand() * 24, from = [T[0] + Math.cos(a) * d, T[1] + Math.sin(a) * d * 0.7], r = 4 + rand() * 4;
    const rise = (f, o, s) => ({ transform: `translate(${fix(Math.cos(a) * 6 * f * u)}px, ${fix((-30 * f - 4 * f * f) * u)}px) scale(${s})`, opacity: o });
    fx(k.pic(i % 4 ? 'mote' : 'star', from, r, r), [[t0, rise(0, 0, 0.4), 'ease-out'], [t0 + 100, rise(0.1, 0.95, 1), 'linear'], [t0 + 800, rise(0.7, 0.6, 0.8), 'linear'], [t0 + 1200, rise(1, 0, 0.4)]]);
  }
  // ── a new pearl forms in her hand: a ring of light and a few bubbles (3000-3700)
  fx(k.pic(ring, E, 34, 34), [[3050, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [3250, { transform: 'scale(.7)', opacity: 0.8 }], [3750, { transform: 'scale(1.6)', opacity: 0 }]]);
  bubbles([E[0] + 3, E[1] - 6], 3100, 4, 6, 26, 650);
}
