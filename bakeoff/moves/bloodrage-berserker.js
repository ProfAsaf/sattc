// Bloodrage Berserker: every wound is fuel.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker (the suggestion was
// support: but he is the one who hits, and his card text is about hitting harder),
// element: fire (his burning axe, his wounds like coals).
//   0-340     (only if his target is on his left: he turns round on the spot, through a
//             sliver, and turns back at the end.)
//   300-1130  he gathers his rage. He leans back, drawing the axe back over his head;
//             the fire on its blade swells and stretches; his wounds flare one after
//             another, each beat brighter, sparks tearing off him; he roars, and a
//             shock ring leaves his mouth at each roar.
//   1130-1180 a beat held, wound up as far as he goes.
//   1180-1330 the swing: the axe comes round and down toward T, afterimages of fire
//             along its arc, his whole body thrown after it (the lunge).
//   1330      RELEASE: at the end of the swing the fire on the blade is flung off as a
//             crescent of flame, with billows and sparks behind it, over a short arc to T.
//   1660      IMPACT at T: a flash, a ring, a ground shock, a fire burst, sparks, flames
//             left standing, a scorch that smoulders, smoke.
//   1400-3500 he holds the follow-through, heaving, wounds guttering; the axe comes back
//             up; the fire on the blade rebuilds; the flames and scorch die away.
//   3500      at rest as drawn (BEATS.settle); the move ends at END.
//
// The contract (bakeoff/recipe.md): T = k.aim, or its own spot (the burning field to his
// right). The axe's swing is worked out from his shoulder and T; the crescent leaves from
// the blade where the swing ends (spec.blade carried through the arm's swing). If T is on
// his left, he is mirrored about his feet.
export const END = 4200;
export const BEATS = { release: 1330, impact: 1660, settle: 3500 };
export const STILLS = [700, 1100, 1250, 1340, 1660, 1900, 2800, 3900];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, h = Math.max(0, 1 - r); return [255, 200 + 55 * h * h, 110 + 130 * h * h * h, Math.min(1, h * h * 1.8)]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec.shoulder, B = k.spec.blade, F = k.spec.feet, MOUTH = k.spec.mouth, x0 = F[0];
  const T = k.aim || k.spec.alone;
  const left = T[0] < x0, fT = left ? -1 : 1;
  const REL = 1330, FLY = 330, IMP = REL + FLY;
  const rad = (d) => (d * Math.PI) / 180;
  k.css(`.g-white { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,252,232,.98), rgba(255,226,150,.6) 30%, rgba(255,150,60,.2) 62%, rgba(255,120,40,0) 100%); }`);

  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  // ── how far round the axe swings to reach T (clockwise, in his own frame)
  const Tl = left ? [2 * x0 - T[0], T[1]] : T;
  const phiT = (Math.atan2(Tl[1] - S[1], Tl[0] - S[0]) * 180) / Math.PI, phiB = (Math.atan2(B[1] - S[1], B[0] - S[0]) * 180) / Math.PI;
  const A = Math.max(55, Math.min(150, phiT - phiB));
  // ── his curves: the axe arm (deg), his lean (deg), his lunge (units), the turn (left only)
  const ARM = curve([[0, 0], [300, 0], [700, -16], [1010, -33], [1180, -36], [1330, A], [1460, A + 9], [1800, A + 4], [2500, A * 0.35], [3500, 0]]);
  const LEAN = curve([[0, 0], [300, 0], [1000, -4.5], [1180, -6], [1330, 9], [1480, 7], [2300, 2.5], [3000, 0.6], [3500, 0]]);
  const LUNGE = curve([[0, 0], [1100, -0.8], [1180, -1.4], [1330, 4.5], [1600, 2.6], [3000, 0.3], [3500, 0]]);
  const HEAVE = (t) => (t > 1400 && t < 3100 ? 0.012 * Math.exp(-(t - 1400) / 1100) * Math.sin(t / 95) : t > 600 && t < 1180 ? 0.006 * sm((t - 600) / 500) * Math.sin(t / 40) : 0);
  const FL = left ? curve([[0, 1], [170, 0.03], [340, -1], [3300, -1], [3470, -0.03], [3620, 1]]) : () => 1;
  // the fire on the blade: swells, stretches with the swing, is flung off, rebuilds
  const FSY = curve([[0, 1], [300, 1], [1130, 1.3], [1230, 1.4], [1330, 0.75], [1480, 0.55], [2300, 0.8], [3300, 1]]);
  const FSX = curve([[0, 1], [300, 1], [1130, 1.2], [1330, 0.8], [1480, 0.7], [2300, 0.95], [3300, 1]]);
  const FO = curve([[0, 1], [1330, 1], [1400, 0.3], [2300, 0.5], [3100, 1]]);

  const bodyPos = (p, t) => { const a = rad(LEAN(t)), c = Math.cos(a), s = Math.sin(a), vx = p[0] - F[0], vy = p[1] - F[1]; return [F[0] + vx * c - vy * s + LUNGE(t), F[1] + vx * s + vy * c]; };
  const armPos = (p, t) => { const a = rad(ARM(t)), c = Math.cos(a), s = Math.sin(a), vx = p[0] - S[0], vy = p[1] - S[1]; return bodyPos([S[0] + vx * c - vy * s, S[1] + vx * s + vy * c], t); };
  const W = (p, t) => [x0 + FL(t) * (p[0] - x0), p[1]];                 // (turning/mirroring about his feet)
  const base = (p) => [x0 + fT * (p[0] - x0), p[1]];                    // where a still effect for p is placed
  const flipTf = (pv, t) => `${k.T((1 - FL(t)) * (x0 - pv[0]), 0)} scaleX(${FL(t).toFixed(3)})`;

  const grid = [];
  for (let t = 0; t <= 3500; t += 35) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3600, { transform: 'none' }]];
  // ── the parts
  act(k.part('man'), sample((t) => ({ transform: `${flipTf(F, t)} ${k.T(LUNGE(t), 0)} rotate(${LEAN(t).toFixed(2)}deg) scale(${(1 - HEAVE(t) * 0.5).toFixed(4)}, ${(1 + HEAVE(t)).toFixed(4)})` })));
  act(k.part('wounds'), sample((t) => ({ transform: `${flipTf(F, t)} ${k.T(LUNGE(t), 0)} rotate(${LEAN(t).toFixed(2)}deg) scale(${(1 - HEAVE(t) * 0.5).toFixed(4)}, ${(1 + HEAVE(t)).toFixed(4)})` })));
  const armTf = (t) => { const s2 = bodyPos(S, t); return `${flipTf(S, t)} ${k.T(s2[0] - S[0], s2[1] - S[1])} rotate(${(LEAN(t) + ARM(t)).toFixed(2)}deg)`; };
  act(k.part('axe'), sample((t) => ({ transform: armTf(t) })));
  act(k.part('edge'), sample((t) => ({ transform: armTf(t) })));
  act(k.part('glow'), [[0, { opacity: 1 }, eio], [500, { opacity: 0.3 }, eio], [1500, { opacity: 0.25 }, eio], [3200, { opacity: 1 }]]);
  act(k.part('fire'), sample((t) => ({ transform: `${armTf(t)} ${k.T(B[0] - S[0], B[1] - S[1])} scale(${FSX(t).toFixed(3)}, ${FSY(t).toFixed(3)}) ${k.T(S[0] - B[0], S[1] - B[1])}`, opacity: +FO(t).toFixed(3) })));

  // ── an effect that rides a point on him: `who(p, t)` carries it, f(t) gives its scale/opacity/offset
  const ride = (p0, who, t0, t1, f, step = 35) => {
    const out = [], b = base(p0);
    for (let t = t0; t <= t1; t += step) { const q = W(who(p0, t), t), e = f(t); out.push([t, { transform: `${k.T(q[0] - b[0] + (e.dx || 0), q[1] - b[1] + (e.dy || 0))} scale(${(e.s ?? 1).toFixed(3)})`, opacity: +Math.max(0, Math.min(1, e.o)).toFixed(3) }, 'linear']); }
    return out;
  };
  // ── the rage: how hot his wounds are (it builds with each beat, flares at the swing, gutters)
  const BT = [[460, 0.16], [760, 0.2], [1000, 0.24], [1330, 0.4]];
  const beat = (t, b) => (t < b ? 0 : t - b < 55 ? (t - b) / 55 : Math.exp(-(t - b - 55) / 150));
  const RAGE = curve([[300, 0], [1130, 0.65], [1330, 1], [1500, 0.8], [2300, 0.5], [3000, 0.18], [3400, 0]]);
  const heat = (t) => Math.min(1, RAGE(t) * 0.8 + BT.reduce((s, [b, a]) => s + a * beat(t, b), 0));
  (k.spec.wounds).forEach((p, i) => {
    const size = [20, 17, 14, 16, 14, 12][i] || 14;
    fx(k.lightIn('g-warm', p, size, size), ride(p, bodyPos, 300, 3450, (t) => ({ s: 0.5 + 0.9 * heat(t), o: heat(t) * 0.75 })));
  });
  const aw = [164, 106];
  fx(k.lightIn('g-warm', aw, 20, 20), ride(aw, armPos, 300, 3450, (t) => ({ s: 0.5 + 0.9 * heat(t), o: heat(t) * 0.7 })));
  // the light of the blade's fire, riding the axe: swelling, then flung
  const BL = curve([[300, 0.1], [1130, 0.8], [1230, 1], [1330, 1], [1400, 0.5], [2300, 0.35], [3000, 0.12], [3400, 0]]);
  fx(k.lightIn('g-warm', B, 90, 90), ride(B, armPos, 300, 3450, (t) => ({ s: 0.6 + 0.8 * BL(t), o: BL(t) })));
  fx(k.lightIn('g-white', B, 40, 40), ride(B, armPos, 1000, 1700, (t) => ({ s: 0.4 + 0.9 * curve([[1000, 0], [1230, 0.7], [1330, 1], [1520, 0.1]])(t), o: curve([[1000, 0], [1230, 0.6], [1330, 1], [1560, 0]])(t) })));
  // a warm wash on the sky and field: heat all round him
  fx(k.lightIn('g-warm', [150, 100], 280, 190), [[300, { opacity: 0 }, 'ease-out'], [1100, { opacity: 0.4 }, eio], [1400, { opacity: 0.7 }, 'ease-out'], [2300, { opacity: 0.25 }, eio], [3300, { opacity: 0 }]]);

  // ── rings: his roars (from his mouth), the swing's shock, the landing
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1"/></filter></defs><circle cx="30" cy="30" r="25" fill="none" stroke="#ffc878" stroke-width="2.6" filter="url(#b)"/>', 60, 60);
  const ringAt = (t0, big, o, c, dur = 600, flat = 1) => fx(k.pic(ring, c, 40, 40, { low: true }), [[t0, { transform: `scale(.5, ${(0.5 * flat).toFixed(2)})`, opacity: 0 }, 'ease-out'], [t0 + 40, { transform: `scale(.8, ${(0.8 * flat).toFixed(2)})`, opacity: o }, 'ease-out'], [t0 + dur, { transform: `scale(${big}, ${(big * flat).toFixed(2)})`, opacity: 0 }]]);
  const mouthB = base(MOUTH);
  [[560, 1.6, 0.4], [880, 2.0, 0.5], [1160, 2.6, 0.6]].forEach(([t, big, o]) => ringAt(t, big, o, mouthB, 560));
  // sparks tearing off him while he gathers (they rise and gutter), more at the swing
  const body = [[146, 150], [140, 120], [152, 128], [132, 170], [158, 160], [146, 100], [120, 135], [166, 118]];
  for (let i = 0; i < 26; i++) {
    const p = body[i % body.length], t0 = 400 + Math.round(rand() * 850), sz = 3 + rand() * 3, dx = (rand() - 0.5) * 30, dy = -(24 + rand() * 40);
    const b = base(p);
    fx(k.pic('spark', b, sz, sz), [[t0, { transform: `${k.T(0, 0)} scale(.5)`, opacity: 0 }, 'ease-out'], [t0 + 70, { transform: `${k.T(dx * 0.1, dy * 0.12)} scale(1)`, opacity: 0.95 }, 'ease-out'], [t0 + 650 + Math.round(rand() * 250), { transform: `${k.T(dx, dy)} scale(.3)`, opacity: 0 }]]);
  }
  // flames licking off the blade's fire while it swells
  const BF = (p) => base(p);

  // ── the swing: afterimages of fire along the arc of the blade
  for (let i = 0; i < 9; i++) {
    const t = 1185 + i * 17, q = W(armPos(B, t), t), sz = 34 - i * 0.8;
    fx(k.light('g-warm', q, sz), [[t, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(1)', opacity: 0.55 + i * 0.04 }, 'ease-out'], [t + 320, { transform: 'scale(1.4)', opacity: 0 }]]);
  }

  // ── the crescent: flung from the blade where the swing ends, over a short arc, to T
  const E = W(armPos(B, REL), REL), Lt = Math.hypot(T[0] - E[0], T[1] - E[1]), ang = (Math.atan2(T[1] - E[1], T[0] - E[0]) * 180) / Math.PI;
  const C = [(E[0] + T[0]) / 2, (E[1] + T[1]) / 2 - Math.min(14, 3 + Lt * 0.1)];
  const bz = (t) => { const q = 1 - t; return [q * q * E[0] + 2 * q * t * C[0] + t * t * T[0], q * q * E[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const [X0, Y0] = k.P(...E);
  const along = (tex, t0, dur, lat, sx, sy, sc0, sc1, o, spin = 0, drop = 0, rotAlong = false) => {
    const kf = [];
    for (let j = 0; j <= 8; j++) {
      const f = j / 8, w = Math.pow(f, 0.85), q = bz(w), [x, y] = k.P(...q), off = lat * Math.sin(Math.PI * w) * u + drop * f * f * u, s = sc0 + (sc1 - sc0) * f;
      kf.push([Math.round(t0 + dur * f), { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + off).toFixed(1)}px) rotate(${(rotAlong ? ang : 0) + spin * f}deg) scale(${s.toFixed(2)})`, opacity: j === 0 ? 0 : j === 8 ? 0.85 * o : o }, j < 8 ? 'linear' : 'ease-out']);
    }
    kf.push([Math.round(t0 + dur + 60), { ...kf.at(-1)[1], opacity: 0 }]);
    fx(k.pic(tex, E, sx, sy), kf);
  };
  const crescent = (id, c1, c2) => k.svg(`<defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${c2}" stop-opacity=".25"/><stop offset=".6" stop-color="${c1}" stop-opacity=".95"/><stop offset="1" stop-color="#fff6d0"/></linearGradient><filter id="b${id}"><feGaussianBlur stdDeviation=".7"/></filter></defs><path d="M6,1 Q36,6 38,22 Q36,38 6,43 Q22,22 6,1Z" fill="url(#${id})" filter="url(#b${id})"/>`, 44, 44);
  const bigC = crescent('c1', '#ffa040', '#d23c14'), smallC = crescent('c2', '#ffe08a', '#ff8a32');
  along(bigC, REL, FLY, 0, 34, 34, 0.7, 1.15, 1, 0, 0, true);        // the crescent
  along(smallC, REL + 6, FLY - 10, 0, 22, 22, 0.8, 1.0, 1, 0, 0, true); // its hot core
  along('puffHot', REL, FLY, 0, 20, 20, 0.8, 0.9, 0.9, 40);
  for (let i = 0; i < 8; i++) along(i % 3 === 2 ? 'puffCool' : 'puff', REL + 20 + i * 26, FLY - 20 + i * 14, (rand() - 0.5) * 8, 20 + rand() * 6, 20 + rand() * 6, 0.9, 0.5, 0.8, (rand() - 0.5) * 90, 3 + rand() * 4);
  for (let i = 0; i < 12; i++) along('spark', REL + 10 + Math.round(rand() * 180), FLY - 20 + Math.round(rand() * 110), (rand() - 0.5) * 18, 5 + rand() * 4, 5 + rand() * 4, 1, 0.6, 0.95, 0, 5 + rand() * 12);

  // ── where it lands (BEATS.impact)
  const il = [[IMP - 50, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 40, { transform: 'scale(1.3)', opacity: 1 }]];
  for (let t = IMP + 170, i = 0; t < 2500; t += 120, i++) il.push([t, { transform: `scale(${i % 2 ? 1.12 : 0.94})`, opacity: i % 2 ? 0.85 : 0.6 }, eio]);
  il.push([3100, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.light('g-warm', T, 120), il);
  fx(k.light('g-white', T, 56), [[IMP - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 30, { transform: 'scale(1.3)', opacity: 1 }], [IMP + 260, { transform: 'scale(.8)', opacity: 0 }]]);
  ringAt(IMP, 2.6, 0.9, T, 640, 0.6);
  ringAt(IMP + 90, 1.7, 0.6, T, 520, 0.6);
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI * (0.05 + 0.9 * (i / 7)) + (rand() - 0.5) * 0.3, d = 14 + rand() * 12, t0 = IMP + Math.round(rand() * 40), sz = 20 + rand() * 8;
    const P = (f, s, o) => ({ transform: `${k.T(Math.cos(a) * d * f * 1.4, Math.sin(a) * d * f * 0.7)} rotate(${Math.round(f * 60)}deg) scale(${s})`, opacity: o });
    fx(k.pic(i % 3 === 2 ? 'puffCool' : 'puffHot', T, sz, sz), [[t0, P(0, 0.3, 0), 'ease-out'], [t0 + 60, P(0.35, 0.9, 0.95), 'ease-out'], [t0 + 280, P(1, 1.3, 0.55)], [t0 + 520, P(1.2, 1.7, 0)]]);
  }
  for (let i = 0; i < 20; i++) {
    const a = -Math.PI * (0.04 + 0.92 * rand()), dist = 16 + rand() * 44, g = 14 + rand() * 16, sz = 3 + rand() * 4, t0 = IMP + Math.round(rand() * 50);
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * dist * f * 1.3, Math.sin(a) * dist * f + g * f * f)} scale(${sc})`, opacity: o });
    fx(k.pic('spark', T, sz, sz), [[t0, P(0, 0.6, 0), 'ease-out'], [t0 + 40, P(0.2, 1.1, 1), 'ease-out'], [t0 + 300, P(0.75, 0.9, 0.9), 'ease-in'], [Math.round(t0 + 560 + rand() * 200), P(1, 0.3, 0)]]);
  }
  for (let i = 0; i < 5; i++) {
    const x = T[0] + (i - 2) * 7 + (rand() - 0.5) * 3, on = IMP + 60 + i * 60, off = 2300 + rand() * 500;
    const Fk = [[on, { transform: 'scale(.6,.12)', opacity: 0 }, 'ease-out'], [on + 120, { transform: 'scale(1,1)', opacity: 0.95 }, eio]];
    for (let t = on + 120, j = 1; (t += 90 + rand() * 50) < off; j++) Fk.push([Math.round(t), { transform: `translateY(${(-rand() * 1.5).toFixed(1)}px) scale(${(1 - (j % 2 ? 0.08 : -0.08) - rand() * 0.06).toFixed(2)}, ${(1 + (j % 2 ? 0.14 : -0.14) + rand() * 0.1).toFixed(2)}) skewX(${((j % 2 ? 1 : -1) * (2 + rand() * 5)).toFixed(1)}deg)`, opacity: +(0.8 + rand() * 0.2).toFixed(2) }, eio]);
    Fk.push([Math.round(off + 280), { transform: 'scale(.5,.15)', opacity: 0 }]);
    fx(k.pic(i % 2 ? 'flame' : 'flame2', [x, T[1] + 5], 10 + rand() * 3, 16 + rand() * 12, { base: true }), Fk);
  }
  const sr = ((rand() - 0.5) * 16).toFixed(1), sc = (o, s) => ({ transform: `rotate(${sr}deg) scale(${s}, ${(s * 0.5).toFixed(2)})`, opacity: o });
  fx(k.pic('scorch2:char', T, 60, 60, { lit: false }), [[IMP, sc(0, 0.15), 'cubic-bezier(.2,.7,.4,1)'], [IMP + 260, sc(1, 1)], [2900, sc(1, 1), eio], [3500, sc(0, 1)]]);
  const gl = [[IMP, sc(0, 0.15), 'cubic-bezier(.2,.7,.4,1)'], [IMP + 260, sc(0.95, 1)]];
  for (let t = IMP + 400, i = 0; t < 2700; t += 140 + rand() * 90, i++) gl.push([Math.round(t), sc(i % 2 ? 1 : 0.55, 1), eio]);
  gl.push([3100, sc(0, 1)]);
  fx(k.pic('scorch2:glow', T, 60, 60), gl);
  for (let i = 0; i < 4; i++) {
    const t = IMP + 250 + i * 220, r = Math.round(rand() * 360), x = (rand() - 0.5) * 10;
    fx(k.pic('smoke', [T[0] + x, T[1] - 6], 28, 28, { lit: false, low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 320, { transform: `${k.T(-2, -12)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 1400, { transform: `${k.T(-8, -48)} rotate(${r + 50}deg) scale(2)`, opacity: 0 }]]);
  }
  // embers shaken loose off the axe as it comes back, and smoke off his shoulders
  for (let i = 0; i < 8; i++) {
    const t = 1600 + i * 190, p = armPos(B, t), q = W(p, t), r = rand();
    fx(k.pic('spark', q, 4, 4), [[t, { transform: `${k.T(0, 0)} scale(.6)`, opacity: 0 }, 'ease-out'], [t + 50, { transform: `${k.T(0, 2)} scale(1)`, opacity: 0.9 }, 'ease-out'], [t + 600, { transform: `${k.T((r - 0.5) * 14, 24 + r * 12)} scale(.3)`, opacity: 0 }, 'ease-in']]);
  }
  for (let i = 0; i < 3; i++) {
    const t = 1500 + i * 420, r = Math.round(rand() * 360), q = base([150, 98]);
    fx(k.pic('smoke', q, 28, 28, { lit: false, low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 360, { transform: `${k.T(0, -12)} rotate(${r + 20}deg) scale(1)`, opacity: 0.35 }], [t + 1500, { transform: `${k.T(-3, -42)} rotate(${r + 50}deg) scale(1.9)`, opacity: 0 }]]);
  }
  void BF;
}
