// Storm Shepherd: she calls the sun's gold down her crook and the swan beats it out as a gale.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support (her text lifts the Field: +2/+1), element: wind
// (the suggestion stands: a golden gale off the swan's wings, with its feathers in it).
//   0-900     the gather. The swan lifts both wings high and rears its nose, the shepherdess leans back and draws
//             her crook up and back over her shoulder. The sun behind answers: its light swells; gold motes
//             spiral in to the crook's hook, which blazes; the flock of three crowds in beside the swan.
//   900-1100  the great downstroke: the wings sweep down hard (feathers shed from them), the swan surges
//             forward and nose down, she swings the crook forward to point at T.
//   1100      RELEASE: from the hook's tip a gale of gold flies to T: billows of golden light, a few
//             streaks, and feathers tumbling in it.
//   1500      IMPACT at T: a sunburst (rays, rings), a golden glow, the feathers spin round and up, gold glitter
//             rises (the boon), the sun's light holds there.
//   1700-2300 a second, slower wingbeat; the glow thins.
//   2300-3400 the crook and the wings come back to where they are drawn, the flock settles; (BEATS.settle 3400);
//             END 4200 at rest as drawn.
//
// The contract (bakeoff/recipe.md): the gale goes from the hook's tip (k.spec.emit, carried by the pose) to
// T = k.aim, or her own spot (the sunlit sea of cloud on the right). If T is behind her, the whole puppet turns
// about through a sliver (mirrored about the swan) before the throw, and turns back after. The crook's tilt and
// every point of the gale's arc are worked out from T; everything that flies and lands is on the overlay.
export const END = 4200;
export const BEATS = { release: 1100, impact: 1500, settle: 3400 };
export const STILLS = [350, 800, 1000, 1180, 1520, 1800, 2500, 3900];

const soft = (x, y) => Math.hypot(x - 0.5, y - 0.5) * 2;
export const textures = {
  goldwisp: [48, 48, (x, y) => { const r = Math.hypot((x - 0.5) * 1.1, y - 0.5) * 2, n = 0.8 + 0.2 * Math.sin(x * 13 + y * 7) * Math.cos(y * 10 - x * 6); return [255, 232, 160, Math.pow(Math.max(0, 1 - r), 0.85) * n]; }],
  gspark: [24, 24, (x, y) => { const c = Math.max(0, 1 - soft(x, y)); return [255, 236 + 19 * c * c, 170 + 85 * c * c, Math.min(1, c * c * 2.2)]; }],
};

export function build(k) {
  const { act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const fx = (el, list) => { let last = -1; k.fx(el, list.slice().sort((a, b) => a[0] - b[0]).map((e) => { last = Math.max(last + 1, Math.min(e[0], k.END - 1)); return [last, ...e.slice(1)]; })); };
  const sp = k.spec, SEAT = sp.seat, H0 = sp.hand, W0 = sp.wing, E0 = sp.emit, SW = [120, 148], FL = [55, 120];
  const T = k.aim || sp.alone;
  k.css(`.g-gold { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,250,228,.95), rgba(255,226,150,.55) 30%, rgba(255,196,96,.17) 60%, rgba(255,180,80,0) 100%); }`);
  const rad = (d) => (d * Math.PI) / 180, deg = (r) => (r * 180) / Math.PI;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  const rot = (p, c, d) => { const a = rad(d), vx = p[0] - c[0], vy = p[1] - c[1]; return [c[0] + vx * Math.cos(a) - vy * Math.sin(a), c[1] + vx * Math.sin(a) + vy * Math.cos(a)]; };

  // ── which way she faces: mirrored about the swan if T is behind her, turning through a sliver
  const AX = 120, behind = T[0] < AX - 20;
  const Tu = behind ? [2 * AX - T[0], T[1]] : T;
  const M = behind ? curve([[0, 1], [140, 1], [480, -1], [3100, -1], [3700, 1]]) : () => 1;
  // ── the poses: bob and surge (g), pitch (about the swan), wings, her lean, the crook's tilt about her hand
  const GY = curve([[0, 0], [500, 2.5], [800, -1], [1000, -5], [1300, -3], [1700, -0.5], [1950, -3.5], [2300, -0.5], [3000, 0.4], [3500, 0]]);
  const GX = curve([[0, 0], [500, -2.5], [900, -1], [1050, 4.5], [1500, 2.5], [2300, 1], [3400, 0]]);
  const TH = curve([[0, 0], [500, -5], [900, -5.5], [1040, 5], [1500, 2.5], [2300, 0.8], [3400, 0]]);
  const WG = curve([[0, 0], [350, 7], [700, 17], [880, 14], [1060, -34], [1160, -36], [1400, -4], [1700, 6], [1950, -20], [2200, -14], [2700, 1], [3400, 0]]);
  const RH = curve([[0, 0], [600, -5], [900, -6.5], [1040, 6], [1500, 3.5], [2100, 1.2], [3400, 0]]);
  const angT = deg(Math.atan2(Tu[1] - H0[1], Tu[0] - H0[0]));
  const bT = clamp(angT + 80.6, 24, 72);
  const BE = curve([[0, 0], [500, -14], [900, -26], [1040, bT * 0.6], [1110, bT], [1700, bT * 0.92], [2300, bT * 0.5], [3300, 0]]);
  // a point p carried by `level`: 0 swan, 1 rider (leans about her seat), 2 crook (tilts about her hand, then rides her)
  const lift = (p, t, level) => {
    let q = p;
    if (level >= 2) q = rot(q, H0, BE(t));
    if (level >= 1) q = rot(q, SEAT, RH(t));
    q = rot(q, SW, TH(t));
    q = [q[0] + GX(t), q[1] + GY(t)];
    return [AX + M(t) * (q[0] - AX), q[1]];
  };
  const keys = []; for (let t = 0; t < 3400; t += 50) keys.push(t); keys.push(3400, k.END - 1);
  const pose = (P, ang, t, q, extra = '') => { let m = M(t); if (Math.abs(m) < 0.05) m = 0.05 * (m < 0 ? -1 : 1); return { transform: `${k.T(q[0] - P[0], q[1] - P[1])} scaleX(${m.toFixed(3)}) rotate(${ang.toFixed(2)}deg)${extra}` }; };
  const track = (P, level, angFn, mapPt) => keys.map((t) => { const q = lift(mapPt || P, t, level); return [t, pose(P, angFn(t), t, q), 'linear']; });
  act(k.part('swan'), track(SW, 0, (t) => TH(t)));
  act(k.part('rider'), track(SEAT, 1, (t) => RH(t) + TH(t)));
  act(k.part('crook'), track(H0, 2, (t) => BE(t) + RH(t) + TH(t)));
  act(k.part('glint'), track(H0, 2, (t) => BE(t) + RH(t) + TH(t)));
  // the wings: from where they join the body; the far one a beat behind, a little less
  const wingK = (lag, amp) => keys.map((t) => { const w = WG(Math.max(0, t - lag)) * amp, q = lift(W0, t, 0); return [t, pose(W0, w + TH(t), t, q), 'linear']; });
  act(k.part('wingnear'), wingK(0, 1));
  act(k.part('wingfar'), wingK(45, 0.88));
  // the flock: crowds in during the gather, darts forward at the throw, bobbing all the while
  const FX = curve([[0, 0], [700, 7], [1050, 13], [1500, 9], [2300, 3], [3400, 0]]);
  const FY = curve([[0, 0], [700, -3], [1050, -6], [1500, -3], [3400, 0]]);
  act(k.part('flock'), keys.map((t) => { const bob = Math.sin(t / 260) * 1.6 * Math.min(1, t / 300, (3500 - t) / 300 > 0 ? 1 : 0); return [t, pose(FL, Math.sin(t / 330) * 2.5, t, lift2(FL, t, bob), ''), 'linear']; }));
  function lift2(p, t, bob) { const q = [p[0] + FX(t), p[1] + FY(t) + bob]; return [AX + M(t) * (q[0] - AX), q[1]]; }

  // where the hook's tip is (true places) at ms t
  const Hk = (t) => lift(E0, t, 2), c0 = Hk(0);
  const trk = (t0, t1, mk, step = 50) => { const out = []; for (let t = t0; t <= t1; t += step) { const c = Hk(t); out.push([t, mk(t, [c[0] - c0[0], c[1] - c0[1]])]); } return out; };

  // ── the gather: the sun answers, gold swirls in to the hook, which blazes
  fx(k.lightIn('g-gold', [232, 52], 150, 150), [[0, { opacity: 0 }, 'ease-in'], [700, { opacity: 0.55 }, eio], [1100, { opacity: 0.8 }, 'ease-out'], [1700, { opacity: 0.55 }, eio], [2800, { opacity: 0 }]]);
  const hl = trk(80, 1100, (t, d) => { const g = sm(Math.min(1, t / 950)), beat = 0.5 + 0.5 * Math.sin(t / 75); return { transform: `${k.T(d[0], d[1])} scale(${(0.4 + 1.1 * g + 0.12 * beat).toFixed(2)})`, opacity: +(0.2 + 0.75 * g * (0.78 + 0.22 * beat)).toFixed(2) }; });
  fx(k.light('g-gold', c0, 44), [[0, { transform: 'scale(.4)', opacity: 0 }, 'linear'], ...hl, [1200, { transform: `${k.T(...(() => { const c = Hk(1200); return [c[0] - c0[0], c[1] - c0[1]]; })())} scale(.9)`, opacity: 0.3 }, 'ease-out'], [1500, { transform: `${k.T(...(() => { const c = Hk(1500); return [c[0] - c0[0], c[1] - c0[1]]; })())} scale(.5)`, opacity: 0 }]]);
  for (let i = 0; i < 18; i++) {
    const th0 = rand() * Math.PI * 2, spin = i % 2 ? 1 : -1, r0 = 24 + rand() * 26, t0 = 40 + rand() * 640, dur = 450 + rand() * 260, sz = 2.6 + rand() * 2.6, list = [];
    for (let j = 0; j <= 6; j++) {
      const f = j / 6, th = th0 + spin * f * Math.PI * 1.6, r = r0 * (1 - f * f), t = Math.round(t0 + dur * f), cj = Hk(Math.min(t, k.END - 1));
      list.push([t, { transform: `${k.T(cj[0] - c0[0] + Math.cos(th) * r * 1.1, cj[1] - c0[1] + Math.sin(th) * r * 0.8)} scale(${(0.5 + 0.8 * (1 - f)).toFixed(2)})`, opacity: j === 0 || j === 6 ? 0 : 0.95 }, 'linear']);
    }
    fx(k.pic('gspark', c0, sz, sz), list);
  }
  // feathers shed by the downstroke, tumbling away behind and down
  const feather = k.svg('<path d="M1 5.5Q9 0 22 4.6Q10 11 1 5.5Z" fill="#f6eedb" stroke="#b09c7c" stroke-width=".7"/><path d="M2.4 5.4Q12 4 20 4.7" fill="none" stroke="#b09c7c" stroke-width=".6"/>', 24, 11);
  for (let i = 0; i < 10; i++) {
    const t0 = 900 + i * 45 + rand() * 40, q0 = lift([W0[0] - 12 - rand() * 40, W0[1] - 18 - rand() * 50], t0, 0), r = Math.round(rand() * 360), dx = (rand() - 0.2) * -26 * M(t0), dy = 18 + rand() * 26, sz = 8 + rand() * 4;
    fx(k.pic(feather, q0, sz, sz * 0.46, { lit: false }), [[t0, { transform: `rotate(${r}deg) scale(.6)`, opacity: 0 }, 'ease-out'], [t0 + 120, { transform: `${k.T(dx * 0.1, dy * 0.1)} rotate(${r + 40}deg) scale(1)`, opacity: 0.95 }, 'linear'], [t0 + 700, { transform: `${k.T(dx * 0.6, dy * 0.6)} rotate(${r + 190}deg) scale(1)`, opacity: 0.8 }, 'linear'], [t0 + 1400, { transform: `${k.T(dx, dy)} rotate(${r + 330}deg) scale(.9)`, opacity: 0 }]]);
  }

  // ── RELEASE: the gale of gold goes from the hook's tip to T
  const Er = Hk(1110);
  const ring = k.svg('<circle cx="20" cy="20" r="17" fill="none" stroke="#fff4cc" stroke-width="2.2"/><circle cx="20" cy="20" r="17" fill="none" stroke="#ffd070" stroke-width="5" opacity=".35"/>', 40, 40);
  const ringAt = (pos, t0, size, s1, dur) => fx(k.pic(ring, pos, size, size), [[t0, { transform: 'scale(.25)', opacity: 0 }, 'ease-out'], [t0 + 60, { transform: 'scale(.5)', opacity: 0.95 }, 'ease-out'], [t0 + dur, { transform: `scale(${s1})`, opacity: 0 }]]);
  ringAt(Er, 1110, 20, 2.4, 520);
  fx(k.light('g-gold', Er, 70), [[1060, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1130, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [1280, { transform: 'scale(1.3)', opacity: 0.45 }, 'ease-out'], [1500, { transform: 'scale(.8)', opacity: 0 }]]);
  const C = [(Er[0] + T[0]) / 2, Math.min(Er[1], T[1]) - 22];
  const bz = (t) => { const q = 1 - t; return [q * q * Er[0] + 2 * q * t * C[0] + t * t * T[0], q * q * Er[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const [X0, Y0] = k.P(...Er), rel = (p) => { const [x, y] = k.P(...p); return [x - X0, y - Y0]; };
  const dist = Math.hypot(T[0] - Er[0], T[1] - Er[1]), flight = clamp(240 + dist * 1.5, 320, 500);
  for (let i = 0; i < 26; i++) {
    const t0 = 1110 + i * 24, r = Math.round(rand() * 360), side = (rand() - 0.5) * 9 * u, sz = 26 + rand() * 14;
    const at = (f, sc, o) => { const [x, y] = rel(bz(f)); return { transform: `translate(${(x + side * Math.sin(f * 3.1)).toFixed(1)}px, ${y.toFixed(1)}px) rotate(${r + Math.round(f * 120)}deg) scale(${sc})`, opacity: o }; };
    fx(k.pic('goldwisp', Er, sz, sz), [[t0, at(0, 0.4, 0), 'ease-out'], [t0 + 50, at(0.08, 0.7, 0.9)], [t0 + flight * 0.5, at(0.5, 1, 0.85)], [t0 + flight, at(1, 1.25, 0.7), 'ease-out'], [t0 + flight + 380, at(1, 2, 0)]]);
  }
  const streak = k.svg('<path d="M1 6Q10 1 22 5T46 5" fill="none" stroke="#fff6d8" stroke-width="1.6" stroke-linecap="round"/><path d="M6 9Q16 5 28 8" fill="none" stroke="#ffd884" stroke-width="1.1" stroke-linecap="round" opacity=".8"/>', 48, 12);
  const angOf = (a, b) => Math.round(deg(Math.atan2(b[1] - a[1], b[0] - a[0])));
  for (let i = 0; i < 6; i++) {
    const t0 = 1100 + i * 55, off = (i - 2.5) * 3.2;
    const at = (f, o, s) => { const [x, y] = rel(bz(f)); const a = f < 0.95 ? angOf(bz(f), bz(Math.min(1, f + 0.05))) : angOf(bz(0.9), bz(1)); return { transform: `translate(${x.toFixed(1)}px, ${(y + off * u).toFixed(1)}px) rotate(${a}deg) scale(${s}, 1)`, opacity: o }; };
    fx(k.pic(streak, Er, 26, 6.5), [[t0, at(0, 0, 0.5), 'ease-out'], [t0 + 50, at(0.1, 0.8, 1)], [t0 + flight * 0.55, at(0.6, 0.85, 1.2)], [t0 + flight * 0.85, at(1, 0.8, 1.35), 'ease-out'], [t0 + flight + 160, at(1.05, 0, 1.5)]]);
  }
  // feathers tumbling in the gale
  for (let i = 0; i < 8; i++) {
    const t0 = 1130 + i * 40, r = Math.round(rand() * 360), side = (rand() - 0.5) * 12 * u, sz = 9 + rand() * 3;
    const at = (f, o, sp) => { const [x, y] = rel(bz(f)); return { transform: `translate(${(x + side * Math.sin(f * 4)).toFixed(1)}px, ${(y + side * 0.3 * Math.cos(f * 5)).toFixed(1)}px) rotate(${r + Math.round(f * sp)}deg)`, opacity: o }; };
    fx(k.pic(feather, Er, sz, sz * 0.46, { lit: false }), [[t0, at(0, 0, 0), 'ease-out'], [t0 + 60, at(0.08, 0.95, 60)], [t0 + flight * 0.6, at(0.6, 1, 420)], [t0 + flight, at(1, 0.95, 700), 'linear'], [t0 + flight + 120, at(1, 0, 760)]]);
  }

  // ── IMPACT at T: a sunburst, rings, glow; feathers spin round and up; gold glitter rises
  const I = 1500;
  const rays = k.svg('<g fill="#fff2c4">' + Array.from({ length: 12 }, (_, i) => `<path transform="rotate(${i * 30} 30 30)" d="M30 30L27.6 2L32.4 2Z" opacity="${i % 2 ? 0.55 : 0.9}"/>`).join('') + '</g>', 60, 60);
  fx(k.pic(rays, T, 60, 60), [[I - 20, { transform: 'rotate(0deg) scale(.3)', opacity: 0 }, 'ease-out'], [I + 100, { transform: 'rotate(18deg) scale(1)', opacity: 0.9 }, 'ease-out'], [I + 700, { transform: 'rotate(50deg) scale(1.15)', opacity: 0.35 }, 'linear'], [I + 1300, { transform: 'rotate(80deg) scale(1.3)', opacity: 0 }]]);
  const il = [[I - 60, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [I + 40, { transform: 'scale(1.35)', opacity: 1 }, 'ease-out']];
  for (let t = I + 160, i = 0; t < 2400; t += 120, i++) il.push([t, { transform: `scale(${i % 2 ? 1.1 : 0.95})`, opacity: i % 2 ? 0.75 : 0.55 }, eio]);
  il.push([2900, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.light('g-gold', T, 82), il);
  ringAt(T, I, 24, 3.2, 640); ringAt(T, I + 150, 24, 2.4, 560);
  for (let i = 0; i < 9; i++) {
    const th = (i / 9) * Math.PI * 2 + rand(), t0 = I + i * 35, sz = 10 + rand() * 3, spin = 300 + rand() * 120;
    const pos = (f, s) => { const a = th + f * 3.2 * (i % 2 ? 1 : -1), rr = (5 + 14 * f) * s; return { transform: `${k.T(Math.cos(a) * rr * 1.2, Math.sin(a) * rr * 0.7 - 16 * f * f)} rotate(${Math.round(th * 50 + spin * f)}deg)` }; };
    fx(k.pic(feather, T, sz, sz * 0.46, { lit: false }), [[t0, { ...pos(0, 0.2), opacity: 0 }, 'ease-out'], [t0 + 160, { ...pos(0.15, 1), opacity: 0.95 }, 'linear'], [t0 + 700, { ...pos(0.6, 1), opacity: 0.9 }, 'linear'], [t0 + 1300, { ...pos(1, 1), opacity: 0 }]]);
  }
  for (let i = 0; i < 14; i++) {
    const t0 = I + 80 + rand() * 800, x = (rand() - 0.5) * 36, sz = 2.6 + rand() * 3.2;
    fx(k.pic('gspark', [T[0] + x, T[1] + 5], sz, sz), [[t0, { transform: `${k.T(0, 0)} scale(.3)`, opacity: 0 }, 'ease-out'], [t0 + 220, { transform: `${k.T(x * 0.1, -9)} scale(1)`, opacity: 0.95 }, eio], [t0 + 950, { transform: `${k.T(x * 0.2 + 4, -28)} scale(.4)`, opacity: 0 }]]);
  }
  // a second, slower pulse of the gale off the wings' second beat
  for (let i = 0; i < 6; i++) {
    const t0 = 1900 + i * 45, q = lift([W0[0] - 30 - rand() * 30, W0[1] - 25 - rand() * 35], t0, 0), r = Math.round(rand() * 360), sz = 16 + rand() * 8, dir = M(t0);
    fx(k.pic('goldwisp', q, sz, sz), [[t0, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 160, { transform: `${k.T(3 * dir, 2)} rotate(${r + 30}deg) scale(.8)`, opacity: 0.5 }, 'ease-out'], [t0 + 700, { transform: `${k.T(16 * dir, 6)} rotate(${r + 80}deg) scale(1.4)`, opacity: 0 }]]);
  }
}
