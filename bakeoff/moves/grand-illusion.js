// Grand Illusion: the curtain of seawater sweeps over the field, and the fighters
// come apart into bubbles.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker (the suggestion was
// defender; it is a spell that sweeps creatures off the field, so the wave is the
// attack), element: water.
//   0-800    it gathers. The wall draws back and rears (a hair narrower, taller), its
//            crest tips and glitters, a pale light swells at the crest; bubbles rise
//            inside it; the fighters at the right go on fighting (they hop, braced).
//   800-1180 the wall surges forward (stretching from its left edge: its front
//            runs 55 units on), the crest pitches over, foam runs along its front,
//            a pale wash of light passes over the picture.
//   1000     RELEASE: from the crest a sweep of foam, bubbles and spray is thrown to T.
//   940-1360 as the front passes them the fighters come apart, left to right: a poof
//            of foam at each and bubbles rising off them.
//   1340     IMPACT at T: a pale flash, ripples, a burst of bubbles rising, splashing
//            foam, mist.
//   1400-3400 the wall holds, then draws slowly back; bubbles drift; the fighters
//            re-form out of drifting bubbles (2400-3100), as drawn; the light and
//            the mist die away.
//   3400     at rest as drawn (BEATS.settle); the move ends at END.
//
// The contract (bakeoff/recipe.md): T = k.aim, or its own spot (the beast among the
// fighters). The sweep leaves the crest (spec.emit, carried through the surge and
// the pitch) and every point of it is worked out from there and T.
export const END = 4200;
export const BEATS = { release: 1000, impact: 1340, settle: 3400 };
export const STILLS = [400, 800, 1000, 1150, 1350, 1700, 2600, 3800];

const noise = (x, y) => 0.75 + 0.15 * Math.sin(x * 13 + y * 7) * Math.cos(y * 10 - x * 5) + 0.1 * Math.sin(x * 25 - y * 19);
export const textures = {
  // a bubble: a thin bright ring, a faint body, a highlight
  bubble: [48, 48, (x, y) => {
    const dx = x - 0.5, dy = y - 0.5, r = Math.hypot(dx, dy) * 2, ring = Math.exp(-(((r - 0.82) / 0.09) ** 2)), hl = Math.exp(-(((Math.hypot(dx + 0.18, dy + 0.2) * 2) / 0.16) ** 2)) * (r < 0.85 ? 1 : 0);
    const a = Math.min(1, ring * 0.9 + (r < 0.82 ? 0.1 * (0.4 + r) : 0) + hl * 0.7);
    return [226 + 29 * hl, 252, 248, a];
  }],
  // a clot of foam
  foam: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2; return [236, 255, 252, Math.min(1, Math.pow(Math.max(0, 1 - r), 0.7) * 1.1) * noise(x, y)]; }],
  // mist
  mist: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2; return [214, 244, 240, Math.pow(Math.max(0, 1 - r), 1.5) * noise(x * 1.2, y) * 0.6]; }],
  // a glitter: a hot core with a cross of rays
  glit: [48, 48, (x, y) => {
    const dx = x - 0.5, dy = y - 0.5, r = Math.hypot(dx, dy) * 2, core = Math.pow(Math.max(0, 1 - r), 2.2);
    const rx = Math.max(0, 1 - Math.abs(dy) * 10) * Math.pow(Math.max(0, 1 - Math.abs(dx) * 2), 1.6), ry = Math.max(0, 1 - Math.abs(dx) * 10) * Math.pow(Math.max(0, 1 - Math.abs(dy) * 2), 1.6);
    return [240, 255, 252, Math.min(1, core * 1.2 + 0.8 * (rx + ry))];
  }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth, sp = k.spec;
  const T = k.aim || sp.alone;
  const REL = 1000, FLY = 340, IMP = REL + FLY;
  k.css(`.g-sea { border-radius: 50%; background: radial-gradient(closest-side, rgba(244,255,252,.95), rgba(176,236,232,.5) 30%, rgba(130,206,208,.16) 60%, rgba(110,196,200,0) 100%); }`);

  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  const grid = [];
  for (let t = 0; t <= 3400; t += 40) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3600, { transform: 'none' }]];

  // ── the wall: it rears, surges forward (stretched from its left edge), holds, draws back
  const SX = curve([[0, 1], [500, 0.96], [800, 0.94], [1000, 1.1], [1180, 1.33], [1500, 1.3], [2300, 1.14], [3300, 1]]);
  const SY = curve([[0, 1], [500, 1.03], [800, 1.06], [1000, 1.02], [1180, 0.99], [1500, 1], [3300, 1]]);
  const RT = curve([[0, 0], [500, -6], [800, -10], [1000, 8], [1180, 26], [1500, 28], [2300, 12], [3300, 0]]);
  act(k.part('curtain'), sample((t) => ({ transform: `scale(${SX(t).toFixed(4)}, ${SY(t).toFixed(4)})` })));
  // the spray rides the front and crest, pitching over
  const [cx, cy] = sp.crest, fy = sp.foot[1];
  const dxs = (t) => (cx - 20) * (SX(t) - 1), dys = (t) => -(fy - cy) * (SY(t) - 1);
  act(k.part('spray'), sample((t) => ({ transform: `${k.T(dxs(t), dys(t))} rotate(${RT(t).toFixed(2)}deg)` })));
  const crestAt = (t) => [cx + dxs(t), cy + dys(t)];
  const frontX = (x, y, t) => [x * SX(t), fy - (fy - y) * SY(t)];

  // ── the fighters: braced and hopping as the wall rears, then coming apart as it passes
  act(k.part('fighters'), [[0, { transform: 'translate(0px, 0px) scale(1)', opacity: 1 }, eio], [360, { transform: `${k.T(0, -1.2)} scale(1)`, opacity: 1 }, eio], [560, { transform: `${k.T(0.8, 0.4)} scale(1)`, opacity: 1 }, eio], [760, { transform: `${k.T(-0.6, -1.4)} scale(1)`, opacity: 1 }, eio],
    [940, { transform: `${k.T(0.3, 0)} scale(1)`, opacity: 1 }, 'ease-in'], [1450, { transform: `${k.T(-1, -4)} scale(.94)`, opacity: 0 }], [2450, { transform: `${k.T(-1, -4)} scale(.94)`, opacity: 0 }, 'ease-out'], [3150, { transform: 'translate(0px, 0px) scale(1)', opacity: 1 }]]);

  // ── light: a swell at the crest while it gathers and pitches, a wash passing over the picture
  const lk = [];
  for (let t = 300; t <= 2200; t += 40) { const q = crestAt(t), o = 0.85 * Math.min(sm((t - 300) / 500), 1 - sm((t - 1300) / 900)); lk.push([t, { transform: `${k.T(q[0] - cx, q[1] - cy)} scale(${(0.6 + 0.7 * sm((t - 300) / 600)).toFixed(3)})`, opacity: +o.toFixed(2) }, 'linear']); }
  fx(k.lightIn('g-sea', [cx, cy], 70, 70), lk);
  fx(k.lightIn('g-sea', [150, 110], 220, 170), [[800, { transform: `${k.T(-80, 0)} scale(.8)`, opacity: 0 }, 'ease-in'], [1150, { transform: `${k.T(10, 0)} scale(1)`, opacity: 0.5 }, eio], [1700, { transform: `${k.T(110, 0)} scale(1.05)`, opacity: 0 }]]);
  // glitter at the crest as it tips
  [[0, -2, 640], [12, 6, 760], [-14, 10, 880]].forEach(([dx, dy, t0], i) => {
    const kf = [];
    for (let t = t0; t <= t0 + 700; t += 50) { const q = crestAt(t), f = (t - t0) / 700; kf.push([t, { transform: `${k.T(q[0] - cx + dx, q[1] - cy + dy)} scale(${(0.5 + 0.9 * Math.sin(Math.PI * f) + (i % 2 ? 0.2 * Math.sin(t / 40) : 0)).toFixed(3)}) rotate(${Math.round(f * 80)}deg)`, opacity: +(Math.sin(Math.PI * f) * 0.95).toFixed(2) }, 'linear']); }
    fx(k.picIn('glit', [cx, cy], 14, 14), kf);
  });
  // foam running along the front as it surges (each rides its own height on the front)
  for (let i = 0; i < 8; i++) {
    const y = 56 + i * 16 + rand() * 6, t0 = 900 + i * 22, kf = [], sz = 14 + rand() * 8, r = Math.round(rand() * 360);
    for (let t = t0; t <= t0 + 1000; t += 50) {
      const [x, yy] = frontX(176 + (y - 120) * 0.0, y, t), f = (t - t0) / 1000;
      kf.push([t, { transform: `${k.T(x - 176, yy - y)} rotate(${r + Math.round(f * 40)}deg) scale(${(0.4 + 0.9 * sm(Math.min(1, f * 3))).toFixed(3)})`, opacity: +(0.85 * Math.min(sm(f * 5), 1 - sm((f - 0.35) / 0.65))).toFixed(2) }, 'linear']);
    }
    fx(k.picIn('foam', [176, y], sz, sz), kf);
  }
  // bubbles rising inside the wall while it rears and surges
  for (let i = 0; i < 9; i++) {
    const x = 20 + rand() * 140, y = 100 + rand() * 60, t0 = 150 + i * 170, sz = 4 + rand() * 6;
    fx(k.picIn('bubble', [x, y], sz, sz), [[t0, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 250, { transform: `${k.T((rand() - 0.5) * 6, -12)} scale(1)`, opacity: 0.85 }, eio], [t0 + 1300, { transform: `${k.T((rand() - 0.5) * 12, -48 - rand() * 14)} scale(.9)`, opacity: 0 }]]);
  }

  // ── the sweep: foam, bubbles and spray from the crest (as it is at the release) to T
  const E = crestAt(REL + 40), L = Math.hypot(T[0] - E[0], T[1] - E[1]) || 1, ang = (Math.atan2(T[1] - E[1], T[0] - E[0]) * 180) / Math.PI;
  const C = [(E[0] + T[0]) / 2 + 8, (E[1] + T[1]) / 2 - Math.min(26, L * 0.25)];
  const bz = (w) => { const q = 1 - w; return [q * q * E[0] + 2 * q * w * C[0] + w * w * T[0], q * q * E[1] + 2 * q * w * C[1] + w * w * T[1]]; };
  const nrm = [-(T[1] - E[1]) / L, (T[0] - E[0]) / L], [X0, Y0] = k.P(...E);
  const fly = (tex, t0, dur, lat, sz, sc0, sc1, o, stretch, gdrop, spin = 0, kind = 'pic') => {
    const kf = [], r = Math.round(rand() * 360);
    for (let j = 0; j <= 7; j++) {
      const f = j / 7, q = bz(Math.pow(f, 0.9)), [x, y] = k.P(...q), off = lat * Math.sin(Math.PI * f) * u + gdrop * f * f * u, s = sc0 + (sc1 - sc0) * f;
      kf.push([Math.round(t0 + dur * f), { transform: `translate(${(x - X0 + nrm[0] * off).toFixed(1)}px, ${(y - Y0 + nrm[1] * off).toFixed(1)}px) rotate(${Math.round(spin ? r + f * spin : ang)}deg) scale(${(s * stretch).toFixed(2)}, ${s.toFixed(2)})`, opacity: j === 0 ? 0 : j === 7 ? 0.85 * o : o }, j < 7 ? 'linear' : 'ease-out']);
    }
    kf.push([Math.round(t0 + dur + 70), { ...kf.at(-1)[1], opacity: 0 }]);
    fx(k.pic(tex, E, sz, sz), kf);
  };
  for (let i = 0; i < 14; i++) fly('foam', REL + i * 26, FLY - 10 + rand() * 40, (rand() - 0.5) * 8, 22 + rand() * 8, 0.5, 1.2, 0.9, 1.5, 0, 0);
  for (let i = 0; i < 16; i++) fly('bubble', REL + 10 + rand() * 260, FLY - 30 + rand() * 90, (rand() - 0.5) * 16, 6 + rand() * 6, 0.8, 1, 0.9, 1, -6 + rand() * 8, 120);
  for (let i = 0; i < 12; i++) fly('foam', REL + 20 + rand() * 240, FLY - 40 + rand() * 70, (rand() - 0.5) * 12, 5 + rand() * 4, 0.9, 0.7, 0.9, 1.3, 6 + rand() * 8, 0);

  // ── the fighters come apart, left to right: a poof of foam and bubbles rising off them; later they re-form
  const bodies = sp.bodies.slice().sort((a, b) => a[0] - b[0]), xs = bodies.map((b) => b[0]), x0 = xs[0], x1 = xs.at(-1);
  bodies.forEach(([x, y], i) => {
    const t1 = Math.round(940 + ((x - x0) / (x1 - x0)) * 420), t2 = Math.round(2450 + ((x - x0) / (x1 - x0)) * 600), r = Math.round(rand() * 360);
    fx(k.picIn('foam', [x, y], 20, 20), [[t1 - 30, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t1 + 90, { transform: `rotate(${r + 20}deg) scale(1.15)`, opacity: 0.9 }, eio], [t1 + 480, { transform: `rotate(${r + 40}deg) scale(1.7)`, opacity: 0 }]]);
    for (let j = 0; j < 3; j++) {
      const tj = t1 + j * 60, sz = 6 + rand() * 6, dx = (rand() - 0.5) * 16;
      fx(k.picIn('bubble', [x + (rand() - 0.5) * 8, y + (rand() - 0.5) * 6], sz, sz), [[tj, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], [tj + 120, { transform: `${k.T(dx * 0.3, -5)} scale(1)`, opacity: 0.95 }, eio], [tj + 1000, { transform: `${k.T(dx, -26 - rand() * 18)} scale(.9)`, opacity: 0 }]]);
    }
    // re-forming: bubbles drift back in to where it stands, and pop as it comes whole
    for (let j = 0; j < 2; j++) {
      const tj = t2 + j * 80, sz = 6 + rand() * 5, dx = (rand() - 0.5) * 14;
      fx(k.picIn('bubble', [x, y], sz, sz), [[tj - 300, { transform: `${k.T(dx, -22)} scale(.5)`, opacity: 0 }, 'ease-out'], [tj, { transform: `${k.T(dx * 0.3, -6)} scale(1)`, opacity: 0.9 }, eio], [tj + 300, { transform: `${k.T(0, 0)} scale(1.4)`, opacity: 0 }]]);
    }
  });

  // ── where it lands (BEATS.impact): a flash, ripples, a burst of bubbles, splashing foam, mist
  const il = [[IMP - 50, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 50, { transform: 'scale(1.2)', opacity: 0.95 }]];
  for (let t = IMP + 180, i = 0; t < 1900; t += 150, i++) il.push([t, { transform: `scale(${i % 2 ? 1.05 : 0.9})`, opacity: i % 2 ? 0.65 : 0.4 }, eio]);
  il.push([2400, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.light('g-sea', T, 80), il);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#f0fffc" stroke-width="3" filter="url(#b)"/>', 60, 60);
  [0, 160].forEach((d) => fx(k.pic(ring, T, 44, 44), [[IMP + d, { transform: 'scale(.25, .2)', opacity: 0 }, 'ease-out'], [IMP + d + 50, { transform: 'scale(.6, .48)', opacity: 0.95 }], [IMP + d + 600, { transform: 'scale(2.3, 1.8)', opacity: 0 }]]));
  for (let i = 0; i < 22; i++) {
    const a = -Math.PI * (0.05 + 0.9 * rand()), dist = 10 + rand() * 40, sz = 5 + rand() * 8, t0 = Math.round(IMP + rand() * 120), lift = 10 + rand() * 30;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * dist * f * 1.1, Math.sin(a) * dist * f * 0.8 - lift * f)} scale(${sc})`, opacity: o });
    fx(k.pic('bubble', T, sz, sz), [[t0, P(0, 0.5, 0), 'ease-out'], [t0 + 80, P(0.25, 1, 0.95), 'ease-out'], [t0 + 700, P(0.8, 1.1, 0.8), eio], [Math.round(t0 + 1100 + rand() * 500), P(1, 1.3, 0)]]);
  }
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI * (0.1 + 0.8 * rand()), dist = 12 + rand() * 30, g = 10 + rand() * 12, sz = 5 + rand() * 6, t0 = Math.round(IMP + rand() * 50);
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * dist * f * 1.2, Math.sin(a) * dist * f + g * f * f)} scale(${sc})`, opacity: o });
    fx(k.pic('foam', T, sz, sz), [[t0, P(0, 0.6, 0), 'ease-out'], [t0 + 40, P(0.2, 1.1, 1), 'ease-out'], [t0 + 300, P(0.75, 0.9, 0.9), 'ease-in'], [Math.round(t0 + 520 + rand() * 160), P(1, 0.3, 0)]]);
  }
  for (let i = 0; i < 4; i++) {
    const t = IMP + 60 + i * 200, r = Math.round(rand() * 360), x = (rand() - 0.5) * 16;
    fx(k.pic('mist', [T[0] + x, T[1] - 2], 40, 34, { lit: false, low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 350, { transform: `${k.T(-1, -8)} rotate(${r + 20}deg) scale(1)`, opacity: 0.55 }], [t + 1500, { transform: `${k.T(-5 + x * 0.3, -34)} rotate(${r + 50}deg) scale(1.8)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 3; i++) fx(k.pic('glit', [T[0] + (i - 1) * 12, T[1] - 8 - (i % 2) * 8], 12, 12), [[IMP + 20 + i * 60, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [IMP + 120 + i * 60, { transform: 'scale(1) rotate(30deg)', opacity: 0.95 }], [IMP + 520 + i * 60, { transform: 'scale(.3) rotate(80deg)', opacity: 0 }]]);
}
