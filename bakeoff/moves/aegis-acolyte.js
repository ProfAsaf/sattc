// Aegis Acolyte: she gives her Shield: the dome lets go, then comes down again, glowing, over the knight.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support, element: light (both as suggested).
// Alone, her gift goes to the dome over the knight (T = the heart of the dome, `alone`); aimed, it
// goes to T = k.aim, where a new dome forms and hers is left alone.
//   0-500     the gather: she sinks and draws her hands in, the threads of light drawn between her
//             and the dome fade out; the dome shimmers, thins and lets go (alone), its last panes
//             drifting up and away; flecks of gold run in to her hands, and a light swells in each.
//   500-1000  she rises on her toes and flings both arms up, the lights blaze (BEATS.release at
//             1000): she thrusts them toward T.
//   1000-1300 three threads of light flash from her hands to T, a stream of gold motes running
//             along each.
//   1300      (BEATS.impact) at T the Shield forms: a flash, a ring of gold, and the dome rises out
//             of the ground (alone: over the knight, who lifts his head, the glass hot and golden, a
//             ring running out over the turf, motes rising) or a bubble of glass blooms (aimed).
//   2400-3200 the glow cools; the panes drift back in from the glass to where they hang; she comes
//             down; the threads kindle again between her hands and the dome.
//   3700      at rest as drawn (BEATS.settle); the move ends at END.
// Contract: T = k.aim || alone; the threads' arcs and the burst are built from her `emit` hands and T;
// everything that lands at T is on the overlay (T may be on another card).
export const END = 4400;
export const BEATS = { release: 1000, impact: 1300, settle: 3700 };
export const STILLS = [350, 800, 1060, 1300, 1550, 2000, 2800, 3900];

export const textures = {
  spark: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 236 + 19 * c * c, 170 + 80 * c * c, Math.min(1, c * c * 2.2)]; }],
  star: [48, 48, (x, y) => { const dx = Math.abs(x - 0.5) * 2, dy = Math.abs(y - 0.5) * 2, c = Math.max(0, 1 - Math.hypot(dx, dy)), cr = Math.max(0, 1 - Math.min(dx * 9 + dy, dy * 9 + dx)), v = Math.min(1, c * c * 1.6 + cr * 0.9); return [255, 244 + 11 * v, 205 + 50 * v, v]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, SH = S.shoulder, FEET = S.feet, [DX, DY, DRX, DRY] = S.dome, E = S.emit;
  const own = !k.aim, T = k.aim || S.alone, HOME = 3700;
  const H0 = [109.7, 109.8], H1 = [103.8, 102.8]; // her two hands as drawn
  const fix = (n) => n.toFixed(2);
  const deg = (a) => (a * 180) / Math.PI;
  const dp = (a, out = 0) => {
    const r = (a * Math.PI) / 180, c = Math.cos(r), sn = Math.sin(r), nx = c / DRX, ny = sn / DRY, nl = Math.hypot(nx, ny);
    return [DX + c * DRX + (nx / nl) * out, DY + sn * DRY + (ny / nl) * out];
  };
  k.css(`.g-gold { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,252,236,.95), rgba(255,226,150,.6) 28%, rgba(255,196,100,.18) 58%, rgba(255,170,70,0) 100%); }
    .fx-copy.f-hot { mix-blend-mode: plus-lighter; filter: brightness(1.7) saturate(1.3) sepia(.3); }`);
  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  const grid = [];
  for (let t = 0; t <= HOME + 20; t += 40) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [HOME + 100, { transform: 'none' }]];

  // ── her: she sinks, rises, thrusts and comes down; her arms ride her body and turn about the sleeves
  const sink = curve([[0, 0], [330, 1], [900, -0.5], [1060, 0.6], [1700, 0.1], [3300, 0]]);
  const lean = curve([[0, 0], [330, -0.6], [900, 0.3], [1060, 1], [1900, 0.6], [3300, 0]]);
  const body = (t) => ({ dx: 0.5 * lean(t), dy: 1.4 * sink(t), th: 1.8 * lean(t) });
  const onBody = (P, t) => { // a point of her, after her body's pose (about her feet)
    const { dx, dy, th } = body(t), r = (th * Math.PI) / 180, vx = P[0] - FEET[0], vy = P[1] - FEET[1];
    return [FEET[0] + vx * Math.cos(r) - vy * Math.sin(r) + dx, FEET[1] + vx * Math.sin(r) + vy * Math.cos(r) + dy];
  };
  const bodyTf = (P, t, extra = 0) => { const [nx, ny] = onBody(P, t), th = body(t).th + extra; return `translate(${fix((nx - P[0]) * u)}px, ${fix((ny - P[1]) * u)}px) rotate(${fix(th)}deg)`; };
  // where her arms point at the thrust: toward T, from the rest line (about -52 degrees), within reach
  const angT = deg(Math.atan2(T[1] - E[1], T[0] - E[0])), phiT = Math.max(-28, Math.min(30, angT + 52));
  const phi = curve([[0, 0], [330, 7], [900, -17], [1000, -17], [1090, phiT], [2200, phiT * 0.8], [3250, 0]]);
  // a point of hers (a hand), after the turn of her arms about the sleeves and then her body
  const handAt = (H, t) => {
    const r = (phi(t) * Math.PI) / 180, vx = H[0] - SH[0], vy = H[1] - SH[1];
    return onBody([SH[0] + vx * Math.cos(r) - vy * Math.sin(r), SH[1] + vx * Math.sin(r) + vy * Math.cos(r)], t);
  };
  act(k.part('her'), sample((t) => ({ transform: bodyTf(FEET, t) })));
  act(k.part('arms'), sample((t) => ({ transform: bodyTf(SH, t, phi(t)) })));
  const spent = curve([[0, 1], [900, 1], [1100, 0.35], [3000, 0.35], [3500, 1]]);
  act(k.part('orbs'), [...grid.map((t) => [t, { transform: bodyTf(SH, t, phi(t)), opacity: +spent(t).toFixed(2) }, 'linear']), [HOME + 100, { transform: 'none', opacity: 1 }]]);
  // the threads drawn between her and the dome: out at the start, kindled again at the end
  const thOp = curve([[0, 1], [260, 0], [3150, 0], [3650, 1]]);
  act(k.part('threads'), [...grid.map((t) => [t, { opacity: +thOp(t).toFixed(2) }, 'linear']), [HOME + 100, { opacity: 1 }]]);

  // ── the lights in her hands, swelling as she gathers, blazing at the thrust, dying down
  const swell = curve([[100, 0], [500, 0.45], [980, 1.25], [1120, 1.5], [1500, 0.8], [2300, 0.25], [2900, 0]]);
  [H0, H1].forEach((H, i) => {
    const pos = (t) => { const [x, y] = handAt(H, t); return `translate(${fix((x - H[0]) * u)}px, ${fix((y - H[1]) * u)}px)`; };
    fx(k.light('g-gold', H, 26), [...grid.map((t) => [t, { transform: `${pos(t)} scale(${fix(0.3 + 0.9 * swell(t))})`, opacity: +Math.min(0.95, swell(t) * 0.8).toFixed(2) }, 'linear']), [HOME + 100, { transform: 'scale(.3)', opacity: 0 }]]);
    fx(k.pic('star', H, 15, 15), [[900 + i * 40, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [1040 + i * 40, { transform: `${pos(1040)} scale(1.2) rotate(30deg)`, opacity: 1 }], [1400, { transform: `${pos(1400)} scale(.6) rotate(70deg)`, opacity: 0 }]]);
  });
  // flecks of gold running in to her hands while she gathers
  for (let i = 0; i < 12; i++) {
    const t0 = 90 + i * 55, a = rand() * Math.PI * 2, d = 18 + rand() * 18, H = i % 2 ? H0 : H1, from = [H[0] + Math.cos(a) * d, H[1] + Math.sin(a) * d * 0.8];
    const [x0, y0] = k.P(...from), [x1, y1] = k.P(...H);
    const to = (f, o, s) => ({ transform: `translate(${((x1 - x0) * f).toFixed(1)}px, ${((y1 - y0) * f).toFixed(1)}px) scale(${s})`, opacity: o });
    fx(k.pic('spark', from, 6, 6), [[t0, to(0, 0, 0.5), 'ease-in'], [t0 + 120, to(0.2, 0.95, 1)], [t0 + 420, to(1, 0.9, 0.7), 'ease-in'], [t0 + 500, to(1, 0, 0.3)]]);
  }

  // ── the dome (alone): thins and lets go, comes down again, hot and golden, then settles; the panes come back
  const PANES = [[-58, 12], [-44, 20], [-30, 10], [-68, 24]];
  const hold = (list) => [...list, [HOME + 100, { transform: 'none', opacity: 1 }]];
  if (own) {
    const form = (peak) => hold([[0, { transform: 'none', opacity: 1 }, eio], [120, { transform: 'none', opacity: 1 }, 'ease-out'], [520, { transform: 'scale(1.05, 1.03)', opacity: 0.1 }], [1250, { transform: 'scale(.72, .5)', opacity: 0 }, 'ease-out'],
      [1450, { transform: `scale(${peak}, ${peak - 0.02})`, opacity: 1 }, eio], [1660, { transform: 'scale(.99, .995)', opacity: 1 }], [1900, { transform: 'none', opacity: 1 }]]);
    act(k.part('dome'), form(1.07));
    act(k.part('domefill'), form(1.04));
    const hotDome = [[0, { transform: 'scale(.72, .5)', opacity: 0 }], [1250, { transform: 'scale(.72, .5)', opacity: 0 }, 'ease-out'], [1450, { transform: 'scale(1.07, 1.05)', opacity: 0.95 }, eio], [1660, { transform: 'scale(.99, .995)', opacity: 0.8 }], [1900, { transform: 'none', opacity: 0.6 }, eio], [2900, { transform: 'none', opacity: 0.2 }], [3500, { transform: 'none', opacity: 0 }]];
    act(k.copy('dome', 'f-hot'), hotDome);
    PANES.forEach(([a, d], i) => {
      const [px, py] = dp(a, d), [sx, sy] = dp(a, 0), off = [(sx - px) * u, (sy - py) * u], away = (f) => `translate(${fix(off[0] * f + (i - 1.5) * 4 * u * (1 - f))}px, ${fix(off[1] * f - 14 * u * (1 - f))}px)`;
      act(k.part(`pane${i}`), [[0, { transform: 'none', opacity: 1 }, eio], [110 + i * 60, { transform: 'none', opacity: 1 }, 'ease-out'], [520 + i * 50, { transform: `translate(${fix((i - 1.5) * 5 * u)}px, ${fix(-16 * u)}px) rotate(${(i % 2 ? 40 : -35)}deg)`, opacity: 0 }],
        [2350 + i * 130, { transform: `${away(1)} rotate(${(i % 2 ? -30 : 25)}deg)`, opacity: 0 }, 'ease-out'], [2500 + i * 130, { transform: `${away(1)} rotate(${(i % 2 ? -30 : 25)}deg)`, opacity: 0.85 }], [3150 + i * 90, { transform: 'none', opacity: 1 }, eio], [HOME + 100, { transform: 'none', opacity: 1 }]]);
    });
    // the knight lifts his head as it settles over him
    act(k.part('knight'), [[0, { transform: 'none' }, eio], [1300, { transform: 'none' }, 'ease-out'], [1550, { transform: 'translate(0px, -1.2px) rotate(-1.4deg) scale(1.01)' }, eio], [2700, { transform: 'translate(0px, -1.2px) rotate(-1.4deg) scale(1.01)' }, eio], [3500, { transform: 'none' }]]);
    // the light of the new dome over the knight, and the turf below
    fx(k.lightIn('g-gold', [DX, DY - 40], 150, 160), [[1250, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [1500, { transform: 'scale(1)', opacity: 0.85 }], [2300, { transform: 'scale(1.05)', opacity: 0.5 }, eio], [3400, { transform: 'scale(1.1)', opacity: 0 }]]);
    const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".8"/></filter></defs><ellipse cx="80" cy="12" rx="74" ry="8" fill="none" stroke="#fff0c2" stroke-width="1.6" filter="url(#b)"/><ellipse cx="80" cy="12" rx="62" ry="6" fill="none" stroke="#ffe2a0" stroke-width=".9" opacity=".6"/>', 160, 24);
    fx(k.picIn(ring, [DX, DY + 1], 150, 22, { base: false }), [[1300, { transform: 'scale(.4, .5)', opacity: 0 }, 'ease-out'], [1420, { transform: 'scale(.7, .75)', opacity: 0.95 }], [2150, { transform: 'scale(1.35, 1.3)', opacity: 0 }]]);
  } else {
    // aimed: a new bubble of glass blooms at T
    const gl = k.svg('<defs><radialGradient id="g"><stop offset="0" stop-color="#fff2cc" stop-opacity=".05"/><stop offset=".6" stop-color="#d6f6f4" stop-opacity=".16"/><stop offset=".9" stop-color="#e8fffd" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><filter id="b"><feGaussianBlur stdDeviation=".5"/></filter></defs><circle cx="40" cy="40" r="37" fill="url(#g)"/><g filter="url(#b)" fill="none"><circle cx="40" cy="40" r="35" stroke="#dcfbff" stroke-width="1.5"/><circle cx="40" cy="40" r="32.5" stroke="#ffe2a0" stroke-width=".7" opacity=".75"/><circle cx="40" cy="40" r="25" stroke="#c6f4f6" stroke-width=".6" opacity=".4"/><path d="M14,30A28,28 0 0 1 30,13" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></g>', 80, 80);
    fx(k.pic(gl, T, 80, 80), [[1300, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1480, { transform: 'scale(1.1)', opacity: 1 }, eio], [1680, { transform: 'scale(.97)', opacity: 1 }], [1900, { transform: 'scale(1)', opacity: 1 }], [3000, { transform: 'scale(1)', opacity: 0.9 }, eio], [3500, { transform: 'scale(1.06)', opacity: 0 }]]);
    fx(k.light('g-gold', T, 100), [[1300, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1500, { transform: 'scale(1)', opacity: 0.75 }], [2400, { transform: 'scale(1)', opacity: 0.35 }, eio], [3300, { transform: 'scale(1.15)', opacity: 0 }]]);
  }

  // ── the three threads of light, hand to T, and a stream of gold along each
  const hands1 = [handAt(H0, 1090), handAt(H1, 1090)];
  const ends = own ? [dp(-112), dp(-90), dp(-146)] : [[T[0] - 9, T[1] - 7], T, [T[0] + 8, T[1] + 9]];
  const starts = [hands1[0], hands1[1], hands1[0]];
  starts.forEach((A, i) => {
    const B = ends[i], dist = Math.hypot(B[0] - A[0], B[1] - A[1]), Cp = [(A[0] + B[0]) / 2 + (i - 1) * 4, Math.min(A[1], B[1]) - 20 - dist * 0.14];
    const bz = (f) => { const q = 1 - f; return [q * q * A[0] + 2 * q * f * Cp[0] + f * f * B[0], q * q * A[1] + 2 * q * f * Cp[1] + f * f * B[1]]; };
    // the thread itself: a glowing arc in a picture sized to it
    const pts = [0, 0.25, 0.5, 0.75, 1].map(bz), minx = Math.min(...pts.map((p) => p[0]), Cp[0]) - 6, miny = Math.min(...pts.map((p) => p[1]), Cp[1]) - 6, maxx = Math.max(...pts.map((p) => p[0])) + 6, maxy = Math.max(...pts.map((p) => p[1])) + 6;
    const w = maxx - minx, h = maxy - miny, L = (p) => `${fix(p[0] - minx)},${fix(p[1] - miny)}`;
    const d = `M${L(A)}Q${L(Cp)} ${L(B)}`;
    const thread = k.svg(`<defs><filter id="b"><feGaussianBlur stdDeviation="1.1"/></filter></defs><path d="${d}" fill="none" stroke="#ffd98a" stroke-width="3" opacity=".7" filter="url(#b)"/><path d="${d}" fill="none" stroke="#fff8e0" stroke-width="1.1" stroke-linecap="round"/>`, w, h);
    const t0 = 1000 + i * 40;
    fx(k.pic(thread, [(minx + maxx) / 2, (miny + maxy) / 2], w, h), [[t0, { opacity: 0 }, 'ease-out'], [t0 + 90, { opacity: 1 }], [t0 + 260, { opacity: 0.85 }, eio], [t0 + 520, { opacity: 0 }]]);
    const [X0, Y0] = k.P(...A);
    for (let j = 0; j < 8; j++) {
      const s0 = 1010 + j * 34 + i * 18, r = 6 + rand() * 4, side = (rand() - 0.5) * 6;
      const at = (f, o, sc) => { const [x, y] = k.P(...bz(f)); return { transform: `translate(${(x - X0 + side * Math.sin(f * Math.PI) * u).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) scale(${sc})`, opacity: o }; };
      fx(k.pic(j % 3 ? 'spark' : 'star', A, r, r), [[s0, at(0, 0, 0.4), 'ease-in'], [s0 + 70, at(0.2, 0.95, 1)], [s0 + 190, at(0.55, 0.95, 1.1)], [s0 + 300, at(1, 0.9, 0.9), 'ease-out'], [s0 + 400, at(1, 0, 0.3)]]);
    }
  });

  // ── where it lands (BEATS.impact): flash, star, ring of gold, motes rising
  fx(k.light('g-gold', T, own ? 70 : 60), [[1260, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1340, { transform: 'scale(1.15)', opacity: 0.95 }], [1700, { transform: 'scale(1)', opacity: 0.5 }, eio], [2200, { transform: 'scale(1.3)', opacity: 0 }]]);
  fx(k.pic('star', T, 40, 40), [[1270, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [1350, { transform: 'scale(1.2) rotate(25deg)', opacity: 1 }], [1750, { transform: 'scale(.6) rotate(70deg)', opacity: 0 }]]);
  const ringG = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1"/></filter></defs><circle cx="40" cy="40" r="34" fill="none" stroke="#fff0c2" stroke-width="2.4" filter="url(#b)"/>', 80, 80);
  fx(k.pic(ringG, T, 60, 60), [[1290, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [1360, { transform: 'scale(.5)', opacity: 0.95 }], [1900, { transform: 'scale(1.5)', opacity: 0 }]]);
  for (let i = 0; i < 14; i++) {
    const t0 = 1300 + i * 50 + rand() * 40, a = rand() * Math.PI * 2, d = 8 + rand() * 24, from = [T[0] + Math.cos(a) * d, T[1] + Math.sin(a) * d * 0.7], r = 5 + rand() * 4;
    const at = (f, o, sc) => ({ transform: `translate(${fix(Math.cos(a) * 6 * f * u)}px, ${fix((-34 * f - 4 * f * f) * u)}px) scale(${sc})`, opacity: o });
    fx(k.pic(i % 4 ? 'spark' : 'star', from, r, r), [[t0, at(0, 0, 0.4), 'ease-out'], [t0 + 100, at(0.1, 0.95, 1)], [t0 + 700, at(0.7, 0.6, 0.8)], [t0 + 1100, at(1, 0, 0.4)]]);
  }
}
