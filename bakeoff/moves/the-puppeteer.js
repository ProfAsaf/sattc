// The Puppeteer: he sets two enemies on each other, and takes one in his strings.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker (the suggestion was
// defender; his card makes an enemy fight another, so he strikes), element: shadow.
//   0-860    he gathers. His arms rise and the bars lift and tilt; the strings draw
//            taut and the two marionette knights are hauled back and crouch, swords
//            raised; the glint where the blades crossed dies; the spotlight's pool
//            swells; a light gathers at the bars.
//   860      RELEASE: his arm (on T's side) flicks down and a thread of violet shadow
//            runs from its bar to T, beads of light racing along it.
//   880-1110 the knights are hauled forward and lunge together.
//   1110     IMPACT: at T the thread falls as five strings from a ghostly control
//            bar, drawing taut and tugging, shadow puffing, a violet burst and ring;
//            and the blades clash (a big star-flash, sparks flung with gravity).
//   1110-2400 the duel goes on: three more clashes, smaller, the bars tilting to
//            them, the arms working; the strings at T tug twice more and let go.
//   2400-3500 knights step back and are lowered; arms drop; the glint comes back;
//            the pool calms; at rest as drawn (BEATS.settle); the move ends at END.
//
// The contract (bakeoff/recipe.md): T = k.aim, or its own spot (where the blades
// cross, in his own picture). The thread leaves the bar on T's side (spec.emit /
// spec.emitL, carried through the arm's swing) and every point of it is worked out
// from there and T.
export const END = 4000;
export const BEATS = { release: 860, impact: 1110, settle: 3500 };
export const STILLS = [300, 700, 880, 1000, 1130, 1300, 1900, 3700];

export const textures = {
  // a star-glint: a hot core with a cross of rays
  vspark: [48, 48, (x, y) => {
    const dx = x - 0.5, dy = y - 0.5, r = Math.hypot(dx, dy) * 2, core = Math.pow(Math.max(0, 1 - r), 2.2);
    const rx = Math.max(0, 1 - Math.abs(dy) * 10) * Math.pow(Math.max(0, 1 - Math.abs(dx) * 2), 1.6), ry = Math.max(0, 1 - Math.abs(dx) * 10) * Math.pow(Math.max(0, 1 - Math.abs(dy) * 2), 1.6);
    return [225 + 30 * core, 205 + 50 * core, 255, Math.min(1, core * 1.2 + 0.8 * (rx + ry))];
  }],
  // a soft violet mote
  vdust: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2; return [212, 178, 255, Math.pow(Math.max(0, 1 - r), 1.5)]; }],
  // a wisp of the dark
  wisp: [48, 48, (x, y) => { const r = Math.hypot((x - 0.5) * 1.2, (y - 0.5) * 0.9) * 2; return [14, 8, 26, Math.pow(Math.max(0, 1 - r), 1.2) * (0.7 + 0.2 * Math.sin(y * 11 + x * 5) * Math.cos(x * 9)) * 0.8]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth, sp = k.spec;
  const T = k.aim || sp.alone;
  const rad = (d) => (d * Math.PI) / 180;
  const useR = T[0] >= 148;
  const REL = 860, IMP = 1110;

  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  const grid = [];
  for (let t = 0; t <= 3500; t += 40) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3700, { transform: 'none' }]];
  const rot = (p, c, a) => { const r = rad(a), co = Math.cos(r), si = Math.sin(r), vx = p[0] - c[0], vy = p[1] - c[1]; return [c[0] + vx * co - vy * si, c[1] + vx * si + vy * co]; };
  const mean = (a, i) => a.reduce((s, p) => s + p[i], 0) / a.length;

  // ── the arms and bars. sg: +1 on the left (clockwise lifts its hand), -1 on the right
  const SIDES = {
    L: { sg: 1, sh: sp.shoulderL, bar: sp.barL, F: sp.feetL, H: sp.handL, ends: sp.endsL },
    R: { sg: -1, sh: sp.shoulderR, bar: sp.barR, F: sp.feetR, H: sp.handR, ends: sp.endsR },
  };
  const thrower = useR ? 'R' : 'L';
  // lift (1 = raised), pulled down on the release, working with the duel
  const LIFT = (thr, lag) => curve(thr
    ? [[0, 0], [500 + lag, 1.4], [860 + lag, 1.6], [960 + lag, -1.7], [1150 + lag, -0.3], [1700 + lag, 0.4], [2500 + lag, 0]]
    : [[0, 0], [500 + lag, 1], [820 + lag, 1.1], [930 + lag, -0.7], [1100 + lag, -0.2], [1500 + lag, 0.6], [1620 + lag, -0.5], [1950 + lag, 0.5], [2500 + lag, 0]]);
  const TILT = curve([[0, 0], [500, -8], [880, -10], [1050, 12], [1200, -3], [1500, 4], [1700, -3], [2000, 3], [2600, 0]]);
  // the knights: hauled back and crouched, lunge, clash, trade blows, return
  const KX = (lag) => curve([[0, 0], [200 + lag, 0], [700 + lag, -7], [880 + lag, -7.5], [1050 + lag, 4.5], [1110 + lag, 3.5], [1250 + lag, -2.2], [1500 + lag, -1], [1620 + lag, 3.2], [1750 + lag, -1], [1950 + lag, 2.5], [2300 + lag, -1.5], [3000 + lag, 0]]);
  const KY = curve([[0, 0], [700, 1.5], [880, 2], [1000, -3], [1110, 0], [1250, 0], [1500, -1], [1620, -1.5], [1750, 0], [3000, 0]]);
  const KA = (lag) => curve([[0, 0], [700 + lag, -5], [880 + lag, -6], [1050 + lag, 5], [1250 + lag, -2], [1500 + lag, -1], [1620 + lag, 4], [1750 + lag, -1], [1950 + lag, 3], [2300 + lag, -1], [3000 + lag, 0]]);
  const SX = curve([[0, 0], [700, -16], [880, -20], [1060, 10], [1110, 6], [1250, -8], [1500, -4], [1620, 8], [1750, -6], [1950, 7], [2300, -3], [3000, 0]]);
  const st = {};
  for (const [name, S] of Object.entries(SIDES)) {
    const sg = S.sg, lag = name === 'R' ? 30 : 0, thr = name === thrower, lift = LIFT(thr, name === 'R' ? 40 : 0);
    const kx = KX(lag), ka = KA(lag);
    const swSign = name === 'L' ? 1 : -1;
    const c0 = [mean(S.ends, 0), mean(S.ends, 1)];
    Object.assign(st, {
      [name]: {
        armA: (t) => sg * lift(t) * 6 + (t > 400 && t < 860 ? 0.5 * Math.sin(t / 50 + sg) : 0),
        barPos: (t) => rot(S.bar, S.sh, st[name].armA(t)),
        knight: (p, t) => { const q = rot(p, S.F, sg * ka(t)); return [q[0] + sg * kx(t), q[1] + KY(t)]; }, // (mirrored: the right knight leans the other way)
        c0,
        swAng: (t) => swSign * SX(t),
      },
    });
  }
  for (const [name, S] of Object.entries(SIDES)) {
    const e = st[name], hx = (S.bar[0] - S.sh[0]) * u, hy = (S.bar[1] - S.sh[1]) * u;
    act(k.part('arm' + name), sample((t) => ({ transform: `rotate(${e.armA(t).toFixed(2)}deg)` })));
    act(k.part('bar' + name), sample((t) => ({ transform: `rotate(${e.armA(t).toFixed(2)}deg) translate(${hx.toFixed(2)}px, ${hy.toFixed(2)}px) rotate(${(S.sg * TILT(t)).toFixed(2)}deg) translate(${(-hx).toFixed(2)}px, ${(-hy).toFixed(2)}px)` })));
    const tr = (nm, t) => [S.sg * KX(nm === 'R' ? 30 : 0)(t), KY(t)];
    const ang = (nm, t) => S.sg * (nm === 'L' ? KA(0)(t) : KA(30)(t));
    act(k.part('knight' + name), sample((t) => ({ transform: `${k.T(...tr(name, t))} rotate(${ang(name, t).toFixed(2)}deg)` })));
    // the sword: carried by its knight (about the feet), then swung about its hand
    act(k.part('sword' + name), sample((t) => {
      const a = ang(name, t), [tx, ty] = tr(name, t);
      const h2 = rot(S.H, S.F, a); const d = [h2[0] + tx - S.H[0], h2[1] + ty - S.H[1]];
      return { transform: `${k.T(d[0], d[1])} rotate(${(a + e.swAng(t)).toFixed(2)}deg)` };
    }));
    // the strings: the whole bundle from the bar (moved by the arm) to its knight, as one similarity
    act(k.part('strings' + name), sample((t) => {
      const b1 = e.barPos(t), a = ang(name, t), [tx, ty] = tr(name, t);
      const c1 = rot(e.c0, S.F, a); c1[0] += tx; c1[1] += ty;
      const v0 = [e.c0[0] - S.bar[0], e.c0[1] - S.bar[1]], v1 = [c1[0] - b1[0], c1[1] - b1[1]];
      const th = (Math.atan2(v1[1], v1[0]) - Math.atan2(v0[1], v0[0])) * 180 / Math.PI, sc = Math.hypot(...v1) / Math.hypot(...v0);
      return { transform: `${k.T(b1[0] - S.bar[0], b1[1] - S.bar[1])} rotate(${th.toFixed(3)}deg) scale(${sc.toFixed(4)})` };
    }));
  }

  // ── the glint where the blades cross: dies as they part, flares at each clash
  const CL = [1110, 1620, 1950], clashAt = sp.clash;
  act(k.part('glint'), [[0, { transform: 'scale(1)', opacity: 1 }, eio], [400, { transform: 'scale(.7)', opacity: 0.55 }, eio], [700, { transform: 'scale(.3)', opacity: 0 }], [1030, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'],
    [1110, { transform: 'scale(2.4)', opacity: 1 }, eio], [1300, { transform: 'scale(1.2)', opacity: 0.8 }, eio], [1500, { transform: 'scale(.6)', opacity: 0.25 }, 'ease-out'], [1620, { transform: 'scale(1.8)', opacity: 1 }, eio],
    [1800, { transform: 'scale(.9)', opacity: 0.6 }, 'ease-out'], [1950, { transform: 'scale(1.6)', opacity: 1 }, eio], [2400, { transform: 'scale(1.1)', opacity: 1 }, eio], [3000, { transform: 'scale(1)', opacity: 1 }]]);

  // ── light: the bars gather it, the spotlight's pool swells and flashes with the clashes
  for (const [name, S] of Object.entries(SIDES)) {
    const e = st[name], thr = name === thrower, p = S.bar;
    const kf = [];
    for (let t = 240; t <= 1500; t += 40) {
      const q = e.barPos(t), o = t < 860 ? 0.8 * sm((t - 240) / 500) : 0.8 * (1 - sm((t - 860) / 600)) * (thr ? 1 : 0.6);
      kf.push([t, { transform: `${k.T(q[0] - p[0], q[1] - p[1])} scale(${(0.5 + 0.7 * sm((t - 240) / 600)).toFixed(3)})`, opacity: +o.toFixed(2) }, 'linear']);
    }
    fx(k.lightIn('g-violet', p, 38, 38), kf);
  }
  const pool = [[240, 0], [800, 0.6], [1000, 0.7], [1110, 1], [1300, 0.55], [1620, 0.9], [1800, 0.55], [1950, 0.85], [2500, 0.35], [3300, 0]];
  fx(k.lightIn('g-violet', [150, 176], 200, 60), pool.map(([t, o], i) => [t, { transform: `scale(${(0.8 + 0.3 * o).toFixed(2)})`, opacity: +(o * 0.72).toFixed(2) }, i ? eio : 'ease-out']));

  // ── a clash: a star-flash, a light, a ring, sparks flung with gravity
  const clash = (t0, big) => {
    const [x, y] = clashAt, n = big ? 11 : 6;
    fx(k.picIn('vspark', [x, y], 40 * (big ? 1 : 0.7), 40 * (big ? 1 : 0.7)), [[t0 - 40, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [t0 + 30, { transform: 'scale(1.1) rotate(20deg)', opacity: 1 }], [t0 + 300, { transform: 'scale(.4) rotate(60deg)', opacity: 0 }]]);
    fx(k.lightIn('g-violet', [x, y], 70, 70), [[t0 - 30, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 40, { transform: `scale(${big ? 1.3 : 0.9})`, opacity: big ? 0.95 : 0.7 }], [t0 + 420, { transform: 'scale(.8)', opacity: 0 }]]);
    for (let i = 0; i < n; i++) {
      const a = -Math.PI * (0.05 + 0.9 * rand()), dist = 14 + rand() * (big ? 36 : 22), g = 10 + rand() * 12, sz = 4 + rand() * 5, ts = Math.round(t0 + rand() * 40);
      const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * dist * f * 1.2, Math.sin(a) * dist * f + g * f * f)} scale(${sc})`, opacity: o });
      fx(k.picIn('vspark', [x, y], sz, sz), [[ts, P(0, 0.6, 0), 'ease-out'], [ts + 40, P(0.2, 1.1, 1), 'ease-out'], [ts + 260, P(0.75, 0.9, 0.9), 'ease-in'], [Math.round(ts + 450 + rand() * 150), P(1, 0.3, 0)]]);
    }
  };
  clash(CL[0], true); clash(CL[1], false); clash(CL[2], false);
  const ringSvg = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#e0ccff" stroke-width="3" filter="url(#b)"/>', 60, 60);
  fx(k.picIn(ringSvg, clashAt, 40, 40), [[IMP, { transform: 'scale(.25, .2)', opacity: 0 }, 'ease-out'], [IMP + 50, { transform: 'scale(.6, .48)', opacity: 0.95 }], [IMP + 520, { transform: 'scale(2.2, 1.7)', opacity: 0 }]]);

  // ── the thread: from the throwing bar (as the arm flicks) to T
  const E1 = st[thrower].barPos(REL + 30), E = [E1[0], E1[1]];
  const L = Math.hypot(T[0] - E[0], T[1] - E[1]) || 1, ang = (Math.atan2(T[1] - E[1], T[0] - E[0]) * 180) / Math.PI, sa = ang.toFixed(1);
  const C = [(E[0] + T[0]) / 2, (E[1] + T[1]) / 2 - Math.min(14, L * 0.12)];
  const bz = (w) => { const q = 1 - w; return [q * q * E[0] + 2 * q * w * C[0] + w * w * T[0], q * q * E[1] + 2 * q * w * C[1] + w * w * T[1]]; };
  const [X0, Y0] = k.P(...E);
  const strand = k.svg(`<path d="M${L.toFixed(1)},2L${(2 * L).toFixed(1)},2" stroke="#e6d6ff" stroke-width=".9" opacity=".9"/><path d="M${L.toFixed(1)},2L${(2 * L).toFixed(1)},2" stroke="#b07cff" stroke-width="2.4" opacity=".28"/>`, 2 * L, 4);
  fx(k.pic(strand, E, 2 * L, 4), [[REL - 20, { transform: `rotate(${sa}deg) scale(.02, 1)`, opacity: 0 }, 'ease-out'], [REL, { transform: `rotate(${sa}deg) scale(.04, 1)`, opacity: 0.95 }, 'ease-out'], [IMP, { transform: `rotate(${sa}deg) scale(1, 1)`, opacity: 0.95 }],
    [1500, { transform: `rotate(${sa}deg) scale(1, 1)`, opacity: 0.55 }, eio], [2100, { transform: `rotate(${sa}deg) scale(1, 1)`, opacity: 0 }]]);
  // beads of light racing along it
  for (let i = 0; i < 9; i++) {
    const t0 = REL + i * 22, dur = IMP - REL - i * 10 + rand() * 40, sz = i < 2 ? 12 : 5 + rand() * 4, lat = (rand() - 0.5) * 6, kf = [];
    const nrm = [-(T[1] - E[1]) / L, (T[0] - E[0]) / L];
    for (let j = 0; j <= 7; j++) {
      const f = j / 7, q = bz(Math.pow(f, 0.9)), [x, y] = k.P(...q), off = lat * Math.sin(Math.PI * f) * u;
      kf.push([Math.round(t0 + dur * f), { transform: `translate(${(x - X0 + nrm[0] * off).toFixed(1)}px, ${(y - Y0 + nrm[1] * off).toFixed(1)}px) rotate(${Math.round(f * 90)}deg) scale(${(1 - 0.3 * f).toFixed(2)})`, opacity: j === 0 ? 0 : j === 7 ? 0.9 : 1 }, j < 7 ? 'linear' : 'ease-out']);
    }
    kf.push([Math.round(t0 + dur + 60), { ...kf.at(-1)[1], opacity: 0 }]);
    fx(k.pic('vspark', E, sz, sz), kf);
  }
  // shadow curling off it
  for (let i = 0; i < 3; i++) {
    const t0 = REL + 30 + i * 60, kf = [];
    for (let j = 0; j <= 6; j++) { const f = j / 6, q = bz(f), [x, y] = k.P(...q); kf.push([Math.round(t0 + (IMP - REL) * f), { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) rotate(${i * 90 + j * 12}deg) scale(${(0.7 + f).toFixed(2)})`, opacity: j === 0 ? 0 : 0.5 }, 'linear']); }
    kf.push([t0 + (IMP - REL) + 500, { ...kf.at(-1)[1], opacity: 0 }]);
    fx(k.pic('wisp', E, 18, 14, { lit: false, low: true }), kf);
  }

  // ── at T (BEATS.impact): five strings fall from a ghostly bar, draw taut and tug; a burst, a ring, shadow
  const TOP = T[1] - 48, line = k.svg('<path d="M1.5,0V48" stroke="#e6d6ff" stroke-width=".7"/><path d="M1.5,0V48" stroke="#b07cff" stroke-width="2" opacity=".25"/><circle cx="1.5" cy="48" r="1.5" fill="#ffffff"/>', 3, 49);
  [-9, -4.5, 0, 4.5, 9].forEach((dx, i) => {
    const t0 = IMP - 70 + i * 22, Y = (v) => (v * u).toFixed(1);
    fx(k.pic(line, [T[0] + dx, TOP], 3, 49, { top: true }), [[t0, { transform: 'translate(0px, 0px) scale(1, .05)', opacity: 0 }, 'ease-out'], [t0 + 90, { transform: 'translate(0px, 0px) scale(1, 1)', opacity: 0.95 }, eio], [1250, { transform: `translate(0px, ${Y(3)}px) scale(1, 1)`, opacity: 0.95 }, eio], [1340, { transform: `translate(0px, ${Y(-1.5)}px) scale(1, 1)`, opacity: 0.95 }, eio],
      [1500, { transform: `translate(0px, ${Y(3.5)}px) scale(1, 1)`, opacity: 0.9 }, eio], [1640, { transform: `translate(0px, ${Y(-1)}px) scale(1, 1)`, opacity: 0.85 }, eio], [1800, { transform: `translate(0px, ${Y(2)}px) scale(1, 1)`, opacity: 0.7 }, eio], [2300, { transform: `translate(0px, ${Y(0)}px) scale(1, 1)`, opacity: 0 }]]);
  });
  const bar = k.svg('<path d="M0,4H30" stroke="#d8c0ff" stroke-width="2.4"/><path d="M15,0V9" stroke="#d8c0ff" stroke-width="2.2"/><path d="M0,4H30" stroke="#8a5ad8" stroke-width="5" opacity=".3"/>', 30, 9);
  fx(k.pic(bar, [T[0], TOP], 30, 9), [[IMP - 80, { transform: 'translate(0px, 0px) scale(.6)', opacity: 0 }, 'ease-out'], [IMP + 20, { transform: 'translate(0px, 0px) scale(1)', opacity: 0.9 }, eio], [1250, { transform: `translate(0px, ${(2 * u).toFixed(1)}px) scale(1)`, opacity: 0.9 }, eio], [1500, { transform: `translate(0px, ${(-1 * u).toFixed(1)}px) scale(1)`, opacity: 0.85 }, eio], [1800, { transform: `translate(0px, ${(1.5 * u).toFixed(1)}px) scale(1)`, opacity: 0.6 }, eio], [2300, { transform: 'translate(0px, 0px) scale(1)', opacity: 0 }]]);
  const il = [[IMP - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 50, { transform: 'scale(1.2)', opacity: 0.95 }]];
  for (let t = IMP + 180, i = 0; t < 1900; t += 140, i++) il.push([t, { transform: `scale(${i % 2 ? 1.05 : 0.9})`, opacity: i % 2 ? 0.7 : 0.45 }, eio]);
  il.push([2400, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.light('g-violet', T, 70), il);
  fx(k.pic(ringSvg, T, 44, 44), [[IMP, { transform: 'scale(.25, .2)', opacity: 0 }, 'ease-out'], [IMP + 50, { transform: 'scale(.6, .48)', opacity: 0.95 }], [IMP + 560, { transform: 'scale(2.2, 1.7)', opacity: 0 }]]);
  for (let i = 0; i < 4; i++) {
    const r = Math.round(rand() * 360), a = (i / 4) * 6.28 + rand();
    fx(k.pic('wisp', T, 32, 26, { lit: false }), [[IMP, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [IMP + 160, { transform: `${k.T(Math.cos(a) * 8, Math.sin(a) * 4)} rotate(${r + 15}deg) scale(1)`, opacity: 0.6 }], [IMP + 1100, { transform: `${k.T(Math.cos(a) * 18, Math.sin(a) * 8 - 6)} rotate(${r + 40}deg) scale(1.7)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI * (0.05 + 0.9 * rand()), dist = 12 + rand() * 30, g = 8 + rand() * 10, sz = 4 + rand() * 5, t0 = Math.round(IMP + rand() * 60);
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * dist * f * 1.2, Math.sin(a) * dist * f + g * f * f)} scale(${sc})`, opacity: o });
    fx(k.pic('vspark', T, sz, sz), [[t0, P(0, 0.6, 0), 'ease-out'], [t0 + 40, P(0.2, 1.1, 1), 'ease-out'], [t0 + 300, P(0.75, 0.9, 0.9), 'ease-in'], [Math.round(t0 + 560 + rand() * 160), P(1, 0.3, 0)]]);
  }
  // violet motes rising off the stage's pool while he works
  for (let i = 0; i < 8; i++) {
    const t0 = 300 + i * 260, x = 120 + rand() * 62, r = Math.round(rand() * 360);
    fx(k.picIn('vdust', [x, 172], 8, 8), [[t0, { transform: `${k.T(0, 0)} scale(.5)`, opacity: 0 }, 'ease-out'], [t0 + 300, { transform: `${k.T((rand() - 0.5) * 6, -14)} scale(1)`, opacity: 0.9 }], [t0 + 1500, { transform: `${k.T((rand() - 0.5) * 14, -52 - r * 0.05)} scale(.6)`, opacity: 0 }]]);
  }
}
