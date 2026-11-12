// Bloodbinder: hunger, then healing, then the gift passed on.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support (the suggestion; her text
// buffers every creature that has Drain), element: blood. The boon goes to T = k.aim, or,
// alone, to the torn banner on the far left (60, 118). If T is on her right, she turns round
// on the spot (through a sliver) and turns back at the end.
//   0-1100    she drinks: the knight shudders as beads of red light run along the stream out of
//             him into her palm, the stream thickening; she leans back and swells with it, her
//             wounds flaring one after another (each beat brighter), then closing in a flash.
//   1100-1250 (if T is behind her: she turns.) The stream lets go: it dims.
//   1200-1480 she gathers: her arm draws back, the palm blazing with all she has taken.
//   1500      RELEASE: her arm sweeps to T, her body thrown after it, and the palm lets go of
//             its light: a ribbon of red light, streaks and sparks, along an arc to T.
//   1900      IMPACT at T: a flash, two rings, a swell of red-rose light, motes rising and
//             drifting down like a blessing (what was taken is given).
//   2000-3400 she holds, arm falling; the stream's light returns; her wounds open again
//             (as drawn); she turns back.
//   3500      at rest as drawn (BEATS.settle); the move ends at END.
export const END = 4200;
export const BEATS = { release: 1500, impact: 1900, settle: 3500 };
export const STILLS = [350, 800, 1050, 1350, 1520, 1900, 2500, 3900];

export const textures = {
  spark: [32, 32, (x, y) => { const dx = Math.abs(x - 0.5) * 2, dy = Math.abs(y - 0.5) * 2, c = Math.max(0, 1 - Math.hypot(dx, dy)), cr = Math.max(0, 1 - Math.min(dx * 7 + dy, dy * 7 + dx)), v = Math.min(1, c * c * 1.6 + cr * 0.8); return [255, 150 + 100 * v, 160 + 90 * v, v]; }],
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 110 + 90 * c * c, 130 + 80 * c * c, Math.min(1, c * c * 1.6)]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec.shoulder, F = k.spec.feet, H = k.spec.emit, x0 = F[0];
  const T = k.aim || [60, 118];
  const left = T[0] < x0, fT = left ? 1 : -1; // (she faces left as drawn; fT -1 means mirrored)
  const mirrored = !left;
  const REL = 1500, FLY = 400, IMP = REL + FLY;
  const rad = (d) => (d * Math.PI) / 180;
  k.css(`.g-blood { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,232,236,.95), rgba(255,98,118,.62) 28%, rgba(220,40,70,.24) 58%, rgba(200,30,60,0) 100%); }
    .g-bloodsky { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,70,96,.5), rgba(210,40,70,.2) 50%, rgba(200,30,60,0) 100%); }
    .g-rose { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,246,248,.95), rgba(255,184,198,.55) 32%, rgba(255,120,150,.2) 60%, rgba(255,100,130,0) 100%); }`);
  const dropImg = k.svg('<defs><linearGradient id="d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7a8a"/><stop offset="1" stop-color="#d81c3c"/></linearGradient></defs><path d="M4,0 C4.6,3 8,5.6 8,8.6 A4,4 0 0 1 0,8.6 C0,5.6 3.4,3 4,0Z" fill="url(#d)"/>', 8, 12.6);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1"/></filter></defs><circle cx="30" cy="30" r="25" fill="none" stroke="#ff5a74" stroke-width="2.6" filter="url(#b)"/>', 60, 60);
  const streak = k.svg('<defs><linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#ff3a58" stop-opacity="0"/><stop offset=".7" stop-color="#ff6a80"/><stop offset="1" stop-color="#fff0f2"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation=".5"/></filter></defs><path d="M0,4 Q10,1.2 24,3 Q30,4 24,5 Q10,6.8 0,4Z" fill="url(#s)" filter="url(#b)"/>', 30, 8);

  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  // ── how far round her arm must turn to point at T (clockwise, in her own frame)
  const Tl = mirrored ? [2 * x0 - T[0], T[1]] : T;
  const phiT = (Math.atan2(Tl[1] - S[1], Tl[0] - S[0]) * 180) / Math.PI, phiH = (Math.atan2(H[1] - S[1], H[0] - S[0]) * 180) / Math.PI;
  let A = ((phiT - phiH + 540) % 360) - 180;
  A = Math.max(-60, Math.min(70, A));
  // ── her curves: the arm (deg), her lean (deg), her lunge (units), her breath, the turn (mirrored only)
  const ARM = curve([[0, 0], [500, 0], [900, 5], [1150, 5], [1330, -20], [1440, -24], [REL, A], [REL + 150, A + 6], [2300, A + 2], [2900, A * 0.4], [3450, 0]]);
  const LEAN = curve([[0, 0], [300, 0], [900, -2.4], [1200, -2.8], [1400, -4], [REL, 4.5], [REL + 160, 3.6], [2400, 1.2], [3000, 0.3], [3450, 0]]);
  const LUNGE = curve([[0, 0], [1300, -0.5], [1440, -1.2], [REL, -4.5 * 0 + 3.2], [2200, 1.4], [3000, 0.3], [3450, 0]]);
  const SWELL = curve([[0, 0], [250, 0], [700, 1], [1000, 1.4], [1200, 0.6], [1400, 0.2], [2400, 0], [3450, 0]]);
  const FL = mirrored ? curve([[0, 1], [1050, 1], [1150, 0.03], [1250, -1], [3300, -1], [3380, -0.03], [3480, 1]]) : () => 1;
  const bodyPos = (p, t) => { const a = rad(LEAN(t)), c = Math.cos(a), s = Math.sin(a), vx = p[0] - F[0], vy = p[1] - F[1]; return [F[0] + vx * c - vy * s + LUNGE(t), F[1] + vx * s + vy * c]; };
  const armPos = (p, t) => { const a = rad(ARM(t)), c = Math.cos(a), s = Math.sin(a), vx = p[0] - S[0], vy = p[1] - S[1]; return bodyPos([S[0] + vx * c - vy * s, S[1] + vx * s + vy * c], t); };
  const W = (p, t) => [x0 + FL(t) * (p[0] - x0), p[1]];
  const flipTf = (pv, t) => `${k.T((1 - FL(t)) * (x0 - pv[0]), 0)} scaleX(${FL(t).toFixed(3)})`;
  const grid = [];
  for (let t = 0; t <= 3500; t += 35) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3600, { transform: 'none' }]];
  const bodyTf = (t) => `${flipTf(F, t)} ${k.T(LUNGE(t), 0)} rotate(${LEAN(t).toFixed(2)}deg) scale(${(1 - 0.006 * SWELL(t)).toFixed(4)}, ${(1 + 0.014 * SWELL(t)).toFixed(4)})`;
  const armTf = (t) => { const s2 = bodyPos(S, t); return `${flipTf(S, t)} ${k.T(s2[0] - S[0], s2[1] - S[1])} rotate(${(LEAN(t) + ARM(t)).toFixed(2)}deg)`; };
  // ride: an effect that stays on a point `p0` of her (carried by `who`), f(t) its scale/opacity
  const baseP = (p) => [x0 + fT * (p[0] - x0), p[1]];
  const ride = (p0, who, t0, t1, f, step = 35) => {
    const out = [], b = baseP(p0);
    for (let t = t0; t <= t1; t += step) { const q = W(who(p0, t), t), e = f(t); out.push([t, { transform: `${k.T(q[0] - b[0], q[1] - b[1])} scale(${(e.s ?? 1).toFixed(3)})`, opacity: +Math.max(0, Math.min(1, e.o)).toFixed(3) }, 'linear']); }
    return out;
  };

  act(k.part('body'), sample((t) => ({ transform: bodyTf(t) })));
  act(k.part('face'), sample((t) => ({ transform: bodyTf(t) })));
  act(k.part('arm'), sample((t) => ({ transform: armTf(t) })));
  // her wounds: they flare as she drinks, close in a flash, and come back as drawn at the end
  const WND = curve([[0, 1], [350, 1], [1000, 1], [1060, 0], [3250, 0], [3500, 1]]);
  act(k.part('woundsB'), sample((t) => ({ transform: bodyTf(t), opacity: +WND(t).toFixed(2) })));
  act(k.part('woundsA'), sample((t) => ({ transform: armTf(t), opacity: +WND(t).toFixed(2) })));
  // the stream thickens as she drinks, lets go, and its light returns
  act(k.part('stream'), [[0, { transform: 'none', opacity: 1 }, eio], [350, { transform: 'scale(1, 1.18)', opacity: 1 }, eio], [700, { transform: 'scale(1, 1.1)', opacity: 1 }, eio], [1000, { transform: 'scale(1, 1.25)', opacity: 1 }, 'ease-in'],
    [1250, { transform: 'scale(1, .7)', opacity: 0.1 }, eio], [3000, { transform: 'scale(1, .8)', opacity: 0.2 }, eio], [3500, { transform: 'none', opacity: 1 }]]);
  // the knight shudders as he is drained (and lies still after)
  const sh = [[0, { transform: 'none' }, eio]];
  for (let t = 150, i = 0; t < 1100; t += 85, i++) sh.push([t, { transform: `${k.T((i % 2 ? -0.5 : 0.5) * (1 - t / 1400), (i % 3 ? 0.2 : -0.4))} rotate(${(i % 2 ? -0.35 : 0.35).toFixed(2)}deg)` }, eio]);
  sh.push([1250, { transform: 'scale(.995)' }, eio], [3300, { transform: 'scale(.995)' }, eio], [3500, { transform: 'none' }]);
  act(k.part('knight'), sh);

  // ── the drinking: beads of red light run along the stream out of him into her palm
  const ctrl = [[84, 171], [88, 156], [98, 142], [114, 130], [130, 121], [146, 116], [156, 115]];
  const bead = (f) => { const x = f * (ctrl.length - 1), i = Math.min(ctrl.length - 2, Math.floor(x)), r = x - i; return [ctrl[i][0] + (ctrl[i + 1][0] - ctrl[i][0]) * r, ctrl[i][1] + (ctrl[i + 1][1] - ctrl[i][1]) * r]; };
  for (let i = 0; i < 16; i++) {
    const t0 = 90 + i * 58, dur = 360 + Math.round(rand() * 60), sz = 4 + rand() * 3.5, lat = (rand() - 0.5) * 2.4, kf = [];
    for (let j = 0; j <= 7; j++) { const f = j / 7, [x, y] = bead(f); kf.push([t0 + Math.round(dur * f), { transform: `${k.T(x - ctrl[0][0], y - ctrl[0][1] + lat)} scale(${(0.7 + 0.6 * f).toFixed(2)})`, opacity: j === 0 ? 0 : j === 7 ? 0.9 : 1 }, 'linear']); }
    kf.push([t0 + dur + 60, { ...kf.at(-1)[1], opacity: 0 }]);
    fx(k.pic(i % 3 === 0 ? 'spark' : 'mote', ctrl[0], sz, sz), kf);
  }
  // a glow where he is drained, going out as it ends
  fx(k.light('g-blood', ctrl[0], 36), [[80, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [350, { transform: 'scale(1)', opacity: 0.85 }, eio], [800, { transform: 'scale(1.1)', opacity: 0.8 }, eio], [1150, { transform: 'scale(.6)', opacity: 0 }]]);
  // the palm drinking: its light builds, blazes at the gather, and goes at the throw
  const PL = curve([[300, 0], [900, 0.6], [1150, 0.8], [1440, 1], [REL, 1], [REL + 160, 0.2], [2300, 0.15], [2800, 0]]);
  fx(k.lightIn('g-blood', H, 52, 52), ride(H, armPos, 300, 2800, (t) => ({ s: 0.5 + 0.9 * PL(t), o: PL(t) })));
  fx(k.lightIn('g-rose', H, 20, 20), ride(H, armPos, 1100, 1700, (t) => ({ s: 0.4 + 0.9 * curve([[1100, 0], [1440, 0.8], [REL, 1], [REL + 150, 0.1]])(t), o: curve([[1100, 0], [1440, 0.8], [REL, 1], [REL + 160, 0]])(t) })));
  // what she takes in: her breast glows, her wounds flare one after another, then close in a flash
  const BR = curve([[250, 0], [900, 0.7], [1000, 1], [1100, 0.3], [1500, 0.15], [2300, 0], [3000, 0]]);
  const chest = [186, 120];
  fx(k.lightIn('g-blood', chest, 46, 46), ride(chest, bodyPos, 250, 2300, (t) => ({ s: 0.6 + 0.6 * BR(t), o: BR(t) * 0.8 })));
  const WP = [[178, 108, 'A'], [168, 110, 'A'], [185, 112, 'B']];
  WP.forEach(([x, y, w], i) => {
    const t0 = 420 + i * 170, who = w === 'A' ? armPos : bodyPos;
    fx(k.lightIn('g-blood', [x, y], 12, 12), ride([x, y], who, 300, 1300, (t) => ({ s: t < t0 ? 0.3 : t < 1000 ? 0.7 + 0.5 * Math.min(1, (t - t0) / 300) : 1.5 - 0.7 * Math.min(1, (t - 1000) / 200), o: t < t0 ? 0 : t < 1000 ? 0.7 : Math.max(0, 1 - (t - 1000) / 220) })));
  });
  // the flash as they close, and a ring from her breast
  fx(k.light('g-rose', [180, 110], 40), [[960, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1040, { transform: 'scale(1.2)', opacity: 0.9 }, 'ease-out'], [1400, { transform: 'scale(1.6)', opacity: 0 }]]);
  fx(k.pic(ring, [180, 112], 24, 24, { low: true }), [[980, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1020, { transform: 'scale(.7)', opacity: 0.8 }, 'ease-out'], [1600, { transform: 'scale(3)', opacity: 0 }]]);
  // the sky and field take a red cast while the blood moves
  fx(k.lightIn('g-bloodsky', [150, 120], 300, 190), [[120, { opacity: 0 }, 'ease-out'], [900, { opacity: 0.5 }, eio], [REL, { opacity: 0.6 }, 'ease-out'], [IMP + 300, { opacity: 0.35 }, eio], [2900, { opacity: 0 }]]);
  // motes rising off her as she swells
  for (let i = 0; i < 14; i++) {
    const t0 = 400 + Math.round(rand() * 800), p = [186 + (rand() - 0.5) * 20, 120 + (rand() - 0.5) * 40], sz = 3 + rand() * 3, b = baseP(p);
    fx(k.pic('mote', b, sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 100, { transform: `${k.T(0, -3)} scale(1)`, opacity: 0.9 }, 'ease-out'], [t0 + 750, { transform: `${k.T((rand() - 0.5) * 12, -22 - rand() * 14)} scale(.3)`, opacity: 0 }]]);
  }

  // ── the gift: a ribbon of red light from her palm where the swing ends, along an arc to T
  const E = W(armPos(H, REL), REL);
  const C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 20];
  const bz = (t) => { const q = 1 - t; return [q * q * E[0] + 2 * q * t * C[0] + t * t * T[0], q * q * E[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const [X0, Y0] = k.P(...E);
  const along = (tex, t0, dur, lat, sx, sy, s0, s1, o, tangent, linger = 0) => {
    const kf = [], n = 8;
    for (let j = 0; j <= n; j++) {
      const f = j / n, w = Math.pow(f, 0.9), q = bz(w), q2 = bz(Math.min(1, w + 0.02)), q1 = bz(Math.max(0, w - 0.02)), [x, y] = k.P(...q);
      const ang = (Math.atan2(q2[1] - q1[1], q2[0] - q1[0]) * 180) / Math.PI, off = lat * Math.sin(Math.PI * w) * u;
      kf.push([Math.round(t0 + dur * f), { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + off).toFixed(1)}px) rotate(${tangent ? ang.toFixed(1) : 0}deg) scale(${(s0 + (s1 - s0) * f).toFixed(2)})`, opacity: j === 0 ? 0 : o }, 'linear']);
    }
    kf.push([Math.round(t0 + dur + 50 + linger), { ...kf.at(-1)[1], opacity: 0 }]);
    fx(k.pic(tex, E, sx, sy), kf);
  };
  for (let i = 0; i < 9; i++) along(streak, REL + i * 22, FLY - 40 + i * 6, (rand() - 0.5) * 6, 26, 7, 0.7, 1, 0.9, true, 80);
  along('mote', REL, FLY, 0, 18, 18, 0.9, 1.1, 1, false);
  along('spark', REL + 10, FLY - 10, 0, 12, 12, 1, 1.2, 1, false);
  for (let i = 0; i < 14; i++) along(i % 2 ? 'spark' : 'mote', REL + 10 + Math.round(rand() * 220), FLY - 60 + Math.round(rand() * 120), (rand() - 0.5) * 16, 4 + rand() * 4, 4 + rand() * 4, 1, 0.5, 0.95, false, 120);
  const lk = [];
  for (let j = 0; j <= 8; j++) { const f = j / 8, q = bz(f), [x, y] = k.P(...q); lk.push([Math.round(REL + FLY * f), { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) scale(${(1.1 - 0.4 * f).toFixed(2)})`, opacity: j === 0 ? 0 : 0.95 }, 'linear']); }
  lk.push([IMP + 80, { ...lk.at(-1)[1], opacity: 0 }]);
  fx(k.light('g-blood', E, 34), lk);

  // ── where it lands (BEATS.impact): a flash, two rings, a swell of rose light, motes rising, then falling like a blessing
  fx(k.light('g-blood', T, 62), [[IMP - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 50, { transform: 'scale(1.2)', opacity: 1 }, 'ease-out'], [IMP + 260, { transform: 'scale(.9)', opacity: 0.7 }, eio],
    [IMP + 520, { transform: 'scale(1.05)', opacity: 0.8 }, eio], [IMP + 900, { transform: 'scale(.9)', opacity: 0.5 }, eio], [3000, { transform: 'scale(.6)', opacity: 0 }]]);
  fx(k.light('g-rose', T, 30), [[IMP - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 60, { transform: 'scale(1)', opacity: 0.95 }, 'ease-out'], [IMP + 700, { transform: 'scale(1.4)', opacity: 0 }]]);
  [[0, 3.0, 0.8], [150, 4.2, 0.5]].forEach(([d, big, o]) => fx(k.pic(ring, T, 30, 30, { low: true }), [[IMP + d, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + d + 40, { transform: 'scale(.6)', opacity: o }, 'ease-out'], [IMP + d + 700, { transform: `scale(${big})`, opacity: 0 }]]));
  for (let i = 0; i < 18; i++) {
    const a = rand() * Math.PI * 2, d = 10 + rand() * 20, t0 = IMP + Math.round(rand() * 160), sz = 3 + rand() * 4;
    fx(k.pic(i % 3 ? 'mote' : 'spark', T, sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 90, { transform: `${k.T(Math.cos(a) * d * 0.4, Math.sin(a) * d * 0.4)} scale(1)`, opacity: 1 }, 'ease-out'],
      [t0 + 800 + Math.round(rand() * 500), { transform: `${k.T(Math.cos(a) * d * 0.9, Math.sin(a) * d * 0.5 - 18 - rand() * 14)} scale(.3)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 5; i++) {
    const t0 = IMP + 350 + i * 150, x = T[0] + (rand() - 0.5) * 22;
    fx(k.pic(dropImg, [x, T[1] - 4], 3, 4.7), [[t0, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t0 + 120, { transform: 'scale(1)', opacity: 0.9 }], [t0 + 900, { transform: `${k.T((rand() - 0.5) * 5, 14 + rand() * 8)} scale(.7)`, opacity: 0 }]]);
  }
}
