// Sky Warden: the knight and his griffin stoop and cast the net of light.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker, element: light
// (the suggestion was wind; what the picture throws is the golden net, and the
// card's text is that it snares: "exhaust an enemy creature").
//   0-540     the gather. The griffin rears back, nose up; both wings are drawn up
//             and cocked forward; the knight leans back and draws his casting arm
//             behind him. The net is pulled in to his hand (it shrinks to a bright
//             knot) and gold motes stream into it. If the target is behind them the
//             griffin turns about in the air (through a sliver, as Ashmaw does).
//   540-760   the stoop: the griffin drops its nose and lunges forward and down, the
//             wings sweep down hard, the knight throws himself forward and his arm
//             after it. Puffs of cloud are shed off the wings.
//   760       RELEASE: the knot bursts from his hand; the net unfurls toward T (turned
//             and scaled to reach it) and a streak of gold flies ahead of it.
//   1060      IMPACT at T: a flash, a ring, and a small net of light blooms and settles
//             over the target, knots flaring, sparks thrown out, gold glitter falling.
//   1100-2300 the griffin recovers: a second, slower wingbeat; the net holds, shimmering,
//             then is drawn back in.
//   2300-2900 the net, now a knot again, unfurls once more as drawn; wings, griffin and
//             knight come back to their places.
//   3000      at rest as drawn (BEATS.settle); the move ends at END.
//
// The contract (bakeoff/recipe.md): T = k.aim, or its own spot (the clouds low on the
// right). The whole group (griffin, wings, knight, his arm and the net) moves by one
// pose, the pose function Phi: a turn about in the air (mirroring, if T is behind),
// a tilt toward T and the lunge. The net leaves his hand, wherever that has got to,
// and is turned and scaled to reach T; the streak, the knot and the bloom are worked
// out from that same hand and from T.
export const END = 3800;
export const BEATS = { release: 760, impact: 1060, settle: 3000 };
export const STILLS = [260, 520, 700, 820, 1080, 1500, 2300, 3300];

const noise = (x, y) => 0.75 + 0.2 * Math.sin(x * 13 + y * 5) * Math.cos(y * 9 - x * 4) + 0.1 * Math.sin(x * 25 - y * 17);
export const textures = {
  // a gold spark: white-hot at its heart
  gspark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 226 + 29 * c * c, 150 + 105 * c * c, Math.min(1, c * c * 2.4)]; }],
  // a soft puff of cloud, pale
  cloud: [48, 48, (x, y) => { const r = Math.hypot((x - 0.5) * 1.15, y - 0.5) * 2; return [246, 250, 244, Math.pow(Math.max(0, 1 - r), 1.2) * noise(x * 1.2, y) * 0.8]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const sp = k.spec, H0 = sp.hand, S0 = sp.shoulder, Cc = sp.centre, HEAD = sp.heading, PN = [145, 111];
  const T = k.aim || sp.alone;
  const rad = (d) => (d * Math.PI) / 180, deg = (r) => (r * 180) / Math.PI;
  const norm = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  k.css(`.g-gold { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,252,236,.95), rgba(255,226,150,.55) 28%, rgba(255,200,100,.17) 58%, rgba(255,180,80,0) 100%); }`);

  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  // ── which way it faces: turned about in the air if T is behind them
  const sg = T[0] < H0[0] - 12 ? -1 : 1;
  const MR = sg > 0 ? () => 1 : curve([[0, 1], [120, 1], [420, -1], [2300, -1], [2900, 1]]);
  const DV = curve([[0, 0], [480, -0.5], [600, -0.5], [780, 1], [1000, 0.75], [1700, 0.55], [2900, 0]]);
  // ── the arm, and so the hand (local, as drawn: positive turns the hand back)
  const ARM = curve([[0, 0], [300, 12], [560, 42], [640, 42], [780, -36], [1500, -26], [2300, -6], [2900, 0]]);
  const RD = curve([[0, 0], [300, -5], [560, -9], [780, 10], [1000, 4], [1700, 3], [2900, 0]]); // the knight leans back, then forward
  const rotAbout = (p, c, d) => { const a = rad(d), vx = p[0] - c[0], vy = p[1] - c[1]; return [c[0] + vx * Math.cos(a) - vy * Math.sin(a), c[1] + vx * Math.sin(a) + vy * Math.cos(a)]; };
  const shoulder = (t) => rotAbout(S0, sp.seat, RD(t));
  const handLocal = (t) => rotAbout(rotAbout(H0, S0, ARM(t)), sp.seat, RD(t));
  // the pose of the whole group: p goes to Phi(p, t) (a turn about, a tilt, the lunge)
  const dive = (t) => { const a = DV(t); return [sg * 11 * a, 8 * a]; };
  const phi0 = (p, t, th) => {
    const m = MR(t), a = rad(th), c = Math.cos(a), s = Math.sin(a), ux = m * (p[0] - Cc[0]), uy = p[1] - Cc[1], d = dive(t);
    return [Cc[0] + ux * c - uy * s + d[0], Cc[1] + ux * s + uy * c + d[1]];
  };
  // tilt toward T: the griffin dives nose down toward it, a little (the net does the rest)
  const hw = phi0(handLocal(760), 760, 0), angT0 = deg(Math.atan2(T[1] - hw[1], T[0] - hw[0]));
  const nat = sg > 0 ? HEAD : 180 - HEAD;
  const thT = clamp(norm(angT0 - nat) * 0.4, -18, 18);
  const TH = curve([[0, 0], [200, 0], [500, -6 * sg], [640, -6 * sg], [780, thT], [1700, thT], [2900, 0]]);
  function shake(t) { const tau = t - 800; return tau > 0 && tau < 1500 ? 1.4 * Math.exp(-tau / 380) * Math.sin(tau / 55) * sg : 0; }
  const Phi = (p, t) => phi0(p, t, TH(t) + shake(t));
  // now the net: where it leaves from, how it must turn and how big it must be
  const Hw = (t) => Phi(handLocal(t), t);
  const H760 = Hw(760), angT = deg(Math.atan2(T[1] - H760[1], T[0] - H760[0])), D = Math.hypot(T[0] - H760[0], T[1] - H760[1]);
  const alpha = sg > 0 ? angT - TH(760) : 180 - angT + TH(760);
  const rT = norm(alpha - HEAD), Smax = clamp(D / sp.reach, 0.35, 2.2);
  const RN = curve([[0, 0], [560, 0], [780, rT], [2200, rT], [2400, 0]]);
  const SN = (t) => curve([[0, 1], [220, 1], [540, 0.16], [760, 0.2], [1000, Smax * 1.08], [1060, Smax], [1160, Smax * 0.95], [1700, Smax * 0.97], [2250, 0.14], [2350, 0.14], [2900, 1]])(t) * (t > 1100 && t < 2000 ? 1 + 0.025 * Math.sin(t / 70) : 1);
  const ON = curve([[0, 1], [220, 1], [540, 0.9], [2250, 0.7], [2350, 0.7], [2900, 1]]);

  const grid = [];
  for (let t = 0; t <= 3000; t += 40) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3200, { transform: 'none' }]];
  const base = (P, t, own = '') => { const q = Phi(P, t); return `${k.T(q[0] - P[0], q[1] - P[1])} rotate(${(TH(t) + shake(t)).toFixed(2)}deg) scaleX(${MR(t).toFixed(3)})${own}`; };
  // wings: drawn up and cocked forward, a hard downstroke on the stoop, then a slower second beat
  const WN = curve([[0, 0], [300, 6], [520, 15], [640, 17], [860, -24], [1100, -10], [1400, 5], [1700, -7], [2100, 4], [2500, -2], [2900, 0]]);
  const WF = (t) => 0.85 * WN(t - 70);
  act(k.part('wingF'), sample((t) => ({ transform: base(sp.wing, t, ` rotate(${WF(t).toFixed(2)}deg)`) })));
  act(k.part('wingN'), sample((t) => ({ transform: base(sp.wing, t, ` rotate(${WN(t).toFixed(2)}deg)`) })));
  act(k.part('body'), sample((t) => ({ transform: base(Cc, t) })));
  act(k.part('rider'), sample((t) => ({ transform: base(sp.seat, t, ` rotate(${RD(t).toFixed(2)}deg)`) })));
  act(k.part('arm'), sample((t) => { const q = Phi(shoulder(t), t); return { transform: `${k.T(q[0] - S0[0], q[1] - S0[1])} rotate(${(TH(t) + shake(t)).toFixed(2)}deg) scaleX(${MR(t).toFixed(3)}) rotate(${(RD(t) + ARM(t)).toFixed(2)}deg)` }; }));
  // the net: its pivot goes where the hand has gone; it shrinks to a knot, unfurls toward T, holds, is drawn in, comes back as drawn
  act(k.part('net'), sample((t) => { const q = Hw(t); return { transform: `${k.T(q[0] - PN[0], q[1] - PN[1])} rotate(${(TH(t) + shake(t)).toFixed(2)}deg) scaleX(${MR(t).toFixed(3)}) rotate(${RN(t).toFixed(2)}deg) scale(${SN(t).toFixed(3)})`, opacity: +ON(t).toFixed(2) }; }));

  // ── at the hand: a light that gathers into the knot, bursts at the release, dies down
  const follow = (t0, t1, f, step = 40) => {
    const out = [];
    for (let t = t0; t <= t1; t += step) { const q = Hw(t), e = f(t); out.push([t, { transform: `${k.T(q[0] - H0[0], q[1] - H0[1])} scale(${e.s.toFixed(3)})`, opacity: +e.o.toFixed(2) }, 'linear']); }
    return out;
  };
  fx(k.lightIn('g-gold', H0, 46, 46), follow(200, 2600, (t) => ({ s: t < 760 ? 0.5 + 1.0 * sm((t - 200) / 560) : 1.5 - 0.5 * sm((t - 760) / 700), o: t < 760 ? 0.95 * sm((t - 200) / 400) : t < 2250 ? 0.8 * (1 - sm((t - 760) / 1500) * 0.7) : 0.8 * (1 - sm((t - 2250) / 350)) })));
  fx(k.light('g-gold', H760, 70), [[740, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [800, { transform: 'scale(1.2)', opacity: 0.95 }], [1100, { transform: 'scale(1.6)', opacity: 0 }]]);
  // gold motes streaming into the knot as it gathers
  for (let i = 0; i < 10; i++) {
    const a = rand() * Math.PI * 2, r = 24 + rand() * 24, t0 = 160 + i * 38 + Math.round(rand() * 30), c0 = Hw(t0 + 330);
    const from = [c0[0] + Math.cos(a) * r, c0[1] + Math.sin(a) * r], at = (f) => ({ transform: `${k.T((from[0] - H0[0]) + (c0[0] - from[0]) * f, (from[1] - H0[1]) + (c0[1] - from[1]) * f)} scale(${(1.1 - 0.7 * f).toFixed(2)})` });
    fx(k.pic('gspark', H0, 5 + rand() * 4, 5 + rand() * 4), [[t0, { ...at(0), opacity: 0 }, 'ease-in'], [t0 + 60, { ...at(0.12), opacity: 1 }, 'ease-in'], [t0 + 330, { ...at(1), opacity: 0.9 }], [t0 + 380, { ...at(1), opacity: 0 }]]);
  }
  // cloud shed off the wings on the downstroke
  [[96, 48], [84, 28], [104, 66], [76, 14], [112, 80]].forEach(([x, y], i) => {
    const t0 = 700 + i * 50, q = Phi([x, y], t0 + 60), r = Math.round(rand() * 360), s0 = 0.5 + rand() * 0.3;
    fx(k.pic('cloud', q, 22, 22, { lit: false }), [[t0, { transform: `rotate(${r}deg) scale(${s0})`, opacity: 0 }, 'ease-out'], [t0 + 150, { transform: `${k.T(-sg * 4, 3)} rotate(${r + 15}deg) scale(1)`, opacity: 0.6 }], [t0 + 900, { transform: `${k.T(-sg * 22, 14)} rotate(${r + 40}deg) scale(1.8)`, opacity: 0 }]]);
  });

  // ── the streak flung ahead of the net, from the hand to T
  const [X0, Y0] = k.P(...H760), FLY = BEATS.impact - BEATS.release, dx = T[0] - H760[0], dy = T[1] - H760[1];
  const at = (f, s, o) => { const [x, y] = k.P(H760[0] + dx * f, H760[1] + dy * f - Math.sin(Math.PI * f) * Math.min(8, D * 0.06)); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) rotate(${angT.toFixed(1)}deg) scale(${(s * 2.2).toFixed(2)}, ${s})`, opacity: o }; };
  fx(k.pic('gspark', H760, 16, 16), [[760, at(0, 0.5, 0), 'ease-out'], [800, at(0.12, 1, 1)], [900, at(0.5, 0.95, 0.95)], [BEATS.impact, at(1, 0.8, 0.9), 'ease-out'], [BEATS.impact + 50, at(1, 1.2, 0)]]);
  for (let i = 0; i < 12; i++) {
    const t0 = 770 + Math.round(rand() * 120), f1 = 0.08 + rand() * 0.14, off = (rand() - 0.5) * 7, sz = 4 + rand() * 4;
    const pt = (f, s, o) => { const [x, y] = k.P(H760[0] + dx * f - (dy / D) * off * Math.sin(Math.PI * f), H760[1] + dy * f + (dx / D) * off * Math.sin(Math.PI * f)); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) scale(${s})`, opacity: o }; };
    fx(k.pic('gspark', H760, sz, sz), [[t0, pt(0, 0.5, 0), 'ease-out'], [t0 + 50, pt(f1, 1, 1)], [t0 + FLY - 80, pt(0.8, 0.8, 0.8), 'ease-in'], [t0 + FLY + 60, pt(1, 0.3, 0)]]);
  }

  // ── where it lands (BEATS.impact): a flash, a ring, a small net of light settling over the target
  const IMP = BEATS.impact;
  const il = [[IMP - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 40, { transform: 'scale(1.3)', opacity: 1 }]];
  for (let t = IMP + 180, i = 0; t < 1900; t += 140, i++) il.push([t, { transform: `scale(${i % 2 ? 1.08 : 0.94})`, opacity: i % 2 ? 0.85 : 0.6 }, eio]);
  il.push([2300, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.light('g-gold', T, 80), il);
  const web = (() => {
    let d = '';
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; d += `M30,30L${(30 + Math.cos(a) * 27).toFixed(1)},${(30 + Math.sin(a) * 27).toFixed(1)}`; }
    for (const R of [8, 15, 22, 27]) { for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, b = ((i + 1) / 8) * Math.PI * 2; d += `M${(30 + Math.cos(a) * R).toFixed(1)},${(30 + Math.sin(a) * R).toFixed(1)}L${(30 + Math.cos(b) * R).toFixed(1)},${(30 + Math.sin(b) * R).toFixed(1)}`; } }
    return k.svg(`<defs><filter id="b"><feGaussianBlur stdDeviation="1.2"/></filter></defs><path d="${d}" fill="none" stroke="#ffd77a" stroke-width="2.6" opacity=".6" filter="url(#b)"/><path d="${d}" fill="none" stroke="#fff4cf" stroke-width=".9"/>`, 60, 60);
  })();
  const rw = Math.round(rand() * 45);
  fx(k.pic(web, T, 46, 46), [[IMP - 20, { transform: `rotate(${rw}deg) scale(1.6)`, opacity: 0 }, 'ease-out'], [IMP + 70, { transform: `rotate(${rw + 8}deg) scale(1.05)`, opacity: 1 }, 'ease-out'], [IMP + 260, { transform: `rotate(${rw + 12}deg) scale(.95)`, opacity: 0.95 }],
    [1900, { transform: `rotate(${rw + 14}deg) scale(.97)`, opacity: 0.7 }, eio], [2500, { transform: `rotate(${rw + 14}deg) scale(1.1)`, opacity: 0 }]]);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#fff3cc" stroke-width="3" filter="url(#b)"/>', 60, 60);
  fx(k.pic(ring, T, 34, 34), [[IMP, { transform: 'scale(.25)', opacity: 0 }, 'ease-out'], [IMP + 50, { transform: 'scale(.6)', opacity: 0.95 }], [IMP + 560, { transform: 'scale(2.2)', opacity: 0 }]]);
  for (let i = 0; i < 16; i++) {
    const a = rand() * Math.PI * 2, dist = 12 + rand() * 32, g = 8 + rand() * 12, sz = 4 + rand() * 5, t0 = Math.round(IMP + rand() * 50);
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * dist * f, Math.sin(a) * dist * f + g * f * f)} scale(${sc})`, opacity: o });
    fx(k.pic('gspark', T, sz, sz), [[t0, P(0, 0.6, 0), 'ease-out'], [t0 + 40, P(0.2, 1.1, 1), 'ease-out'], [t0 + 300, P(0.75, 0.9, 0.9), 'ease-in'], [Math.round(t0 + 560 + rand() * 200), P(1, 0.3, 0)]]);
  }
  // glitter drifting down off the net
  for (let i = 0; i < 9; i++) {
    const x = (rand() - 0.5) * 34, t0 = Math.round(IMP + 200 + rand() * 700), sz = 3 + rand() * 3, fall = 14 + rand() * 18;
    fx(k.pic('gspark', [T[0] + x, T[1] - 4 + (rand() - 0.5) * 12], sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 100, { transform: `${k.T(0, 2)} scale(1)`, opacity: 0.9 }], [t0 + 700, { transform: `${k.T((rand() - 0.5) * 6, fall)} scale(.6)`, opacity: 0 }]]);
  }
}
