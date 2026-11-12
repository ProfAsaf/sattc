// Weatherwitch: she lets the little storm out of her jar.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support (the suggestion was defender: her text
// makes Fields cheaper and brings one back, it never blocks; what the picture offers is her storm as a gift),
// element: wind (the gale she keeps in a jar).
//   0-900     the gather. She leans back into the gale, her arm swings the jar back over her head, her cloak
//             billows. The storm in the jar swells: lightning flickers inside, a pale light beats, wisps of wind
//             spiral in to it from all round, the sky dims a shade.
//   900-1000  the throw: she snaps forward, the arm sweeps down toward T, the jar tips.
//   1000      RELEASE: the lid pops, a flash and a ring; the storm pours out of the jar as a stream of dark
//             and pale cloud along an arc to T, streaks of gale racing ahead of it, a bolt flickering in it.
//   1450      IMPACT at T: a flash, rings, the storm blooms open there: a little cloud swirls round,
//             gale arcs turn about it, rain falls and drifts, a spark of lightning, glitter rises (the boon).
//   1100-2400 she follows through: a rebound, the jar rights itself, the cloak settles; the rain thins.
//   2400-3400 the arm comes back down to where it is drawn; (BEATS.settle 3400); END 4000 at rest as drawn.
//
// The contract (bakeoff/recipe.md): the storm goes to T = k.aim, or her own spot (the sunlit sea at the right).
// If T is behind her she turns about (through a sliver, as Ashmaw does) and the whole puppet is mirrored
// about her; the jar's place at every moment is worked out from the arm, the lean and the turn, the stream and
// the bloom from that place and T. What flies and lands is on the overlay.
export const END = 4000;
export const BEATS = { release: 1000, impact: 1450, settle: 3400 };
export const STILLS = [300, 750, 990, 1150, 1480, 1800, 2500, 3700];

const soft = (x, y) => Math.hypot(x - 0.5, y - 0.5) * 2;
export const textures = {
  // a pale wisp of wind-cloud
  wisp: [48, 48, (x, y) => { const r = Math.hypot((x - 0.5) * 1.1, y - 0.5) * 2, n = 0.78 + 0.22 * Math.sin(x * 14 + y * 6) * Math.cos(y * 11 - x * 5); return [236, 252, 252, Math.pow(Math.max(0, 1 - r), 0.8) * n * 1.0]; }],
  // a little dark storm cloud's puff
  gray: [48, 48, (x, y) => { const r = Math.hypot((x - 0.5) * 1.1, y - 0.5) * 2, n = 0.74 + 0.26 * Math.sin(x * 12 - y * 7) * Math.cos(y * 13 + x * 4); return [58, 98, 112, Math.pow(Math.max(0, 1 - r), 0.8) * n * 1.0]; }],
  spark: [24, 24, (x, y) => { const r = soft(x, y), c = Math.max(0, 1 - r); return [226, 252, 252, Math.min(1, c * c * 2.2)]; }],
  drop: [8, 24, (x, y) => [214, 244, 244, Math.max(0, 1 - Math.abs(x - 0.5) * 2.6) * Math.pow(y, 0.7) * 0.9]],
};

export function build(k) {
  const { act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const fx = (el, list) => { let last = -1; k.fx(el, list.slice().sort((a, b) => a[0] - b[0]).map((e) => { last = Math.max(last + 1, Math.min(e[0], k.END - 1)); return [last, ...e.slice(1)]; })); };
  const sp = k.spec, S0 = sp.shoulder, F0 = sp.feet, P0 = sp.hand, J0 = sp.emit, CL0 = [122, 97];
  const T = k.aim || sp.alone;
  k.css(`.g-sky { border-radius: 50%; background: radial-gradient(closest-side, rgba(244,255,253,.95), rgba(190,240,244,.5) 30%, rgba(150,220,230,.16) 60%, rgba(140,210,225,0) 100%); }`);
  const rad = (d) => (d * Math.PI) / 180, deg = (r) => (r * 180) / Math.PI;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  const rot = (p, c, d) => { const a = rad(d), vx = p[0] - c[0], vy = p[1] - c[1]; return [c[0] + vx * Math.cos(a) - vy * Math.sin(a), c[1] + vx * Math.sin(a) + vy * Math.cos(a)]; };

  // ── which way she faces (turned about, through a sliver, if T is behind her)
  const AX = 120, behind = T[0] < AX - 14;
  const Tu = behind ? [2 * AX - T[0], T[1]] : T; // T as seen from the unmirrored pose
  const M = behind ? curve([[0, 1], [140, 1], [470, -1], [3000, -1], [3600, 1]]) : () => 1;
  // ── the pose: lean (about her feet), the arm (about the shoulder), the jar's own tilt, the cloak
  const angT = deg(Math.atan2(Tu[1] - S0[1], Tu[0] - S0[0]));
  const aT = clamp(angT + 66.8, 28, 84);
  const TH = curve([[0, 0], [260, -1], [640, -4.5], [900, -4.5], [1010, 5.5], [1400, 3], [2000, 1.2], [2500, 0.8], [3400, 0]]);
  const AL = curve([[0, 0], [300, -10], [700, -34], [900, -38], [1000, aT * 0.55], [1060, aT], [1500, aT * 0.94], [1900, aT * 0.86], [2500, aT * 0.45], [3300, 0]]);
  const BE = curve([[0, 0], [500, -6], [900, -12], [1000, 6], [1060, 40], [1300, 46], [1800, 18], [2300, 0]]);
  const GA = curve([[0, 0], [400, 4], [820, 7], [1020, -9], [1300, -5], [1700, 2], [2300, -1], [3400, 0]]);
  const BI = curve([[0, 1], [500, 1.04], [880, 1.1], [1030, 0.96], [1300, 1.05], [2000, 1.02], [3400, 1]]); // the cloak's billow
  // a point of the jar (unmirrored: jar tilt, arm, lean), then the turn about her
  const jarPt = (p, t) => { const m = M(t); const q = rot(rot(rot(p, P0, BE(t)), S0, AL(t)), F0, TH(t)); return [AX + m * (q[0] - AX), q[1]]; };
  const keys = []; for (let t = 0; t < 3400; t += 50) keys.push(t); keys.push(3400, k.END - 1);
  const pose = (P, rotAt, m, q, sc) => { const d = [q[0] - P[0], q[1] - P[1]]; return { transform: `${k.T(d[0], d[1])} scaleX(${(Math.abs(m) < 0.05 ? 0.05 * Math.sign(m || 1) : m).toFixed(3)}) rotate(${rotAt.toFixed(2)}deg)${sc ? ` scale(${sc.toFixed(3)}, 1)` : ''}` }; };
  const track = (P, rotFn, mapFn, scFn) => keys.map((t) => { const m = M(t); const q = mapFn(t); return [t, pose(P, rotFn(t), m, [AX + m * (q[0] - AX), q[1]], scFn && scFn(t)), 'linear']; });
  act(k.part('her'), track(F0, (t) => TH(t), (t) => F0));
  act(k.part('arm'), track(S0, (t) => AL(t) + TH(t), (t) => rot(S0, F0, TH(t))));
  act(k.part('jar'), track(P0, (t) => BE(t) + AL(t) + TH(t), (t) => rot(rot(P0, S0, AL(t)), F0, TH(t))));
  act(k.part('cloak'), track(CL0, (t) => GA(t) + TH(t), (t) => rot(CL0, F0, TH(t)), BI));

  // where the jar's heart is at ms t (true places), and the jar's top (where it pours from)
  const Jc = (t) => jarPt(J0, t), Jtop = (t) => jarPt([J0[0], J0[1] - 14], t);
  const trackFx = (fn, t0, t1, mk) => { const out = []; for (let t = t0; t <= t1; t += 50) { const c = fn(t), c0 = fn(t0); out.push([t, mk(t, [c[0] - c0[0], c[1] - c0[1]])]); } return out; };

  // ── the gather: sky dims a shade; the jar's light swells and beats; lightning flickers in it; wind spirals in
  fx(k.picIn('gloom', [150, 105], 380, 280, { lit: false }), [[0, { opacity: 0 }, 'ease-in'], [880, { opacity: 0.4 }, 'linear'], [1000, { opacity: 0 }, 'linear'], [1500, { opacity: 0.12 }, eio], [2300, { opacity: 0 }]]);
  const c0 = Jc(0);
  const jl = trackFx(Jc, 100, 1000, (t, d) => { const beat = 0.5 + 0.5 * Math.sin(t / 70), g = sm(Math.min(1, t / 900)); return { transform: `${k.T(d[0], d[1])} scale(${(0.45 + 1.0 * g + 0.12 * beat).toFixed(2)})`, opacity: +(0.15 + 0.8 * g * (0.75 + 0.25 * beat)).toFixed(2) }; });
  fx(k.light('g-sky', c0, 54), [[0, { transform: 'scale(.4)', opacity: 0 }, 'linear'], ...jl, [1020, { transform: 'scale(.5)', opacity: 0 }]]);
  const bolts = [k.svg('<path d="M9 0L3 12L9 13L2 30" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="bevel" stroke-linecap="round"/><path d="M9 0L3 12L9 13L2 30" fill="none" stroke="#bff0f4" stroke-width="4" stroke-linejoin="bevel" opacity=".45"/>', 12, 32),
    k.svg('<path d="M3 0L9 10L3 12L10 28" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="bevel" stroke-linecap="round"/><path d="M3 0L9 10L3 12L10 28" fill="none" stroke="#bff0f4" stroke-width="4" stroke-linejoin="bevel" opacity=".45"/>', 12, 32)];
  [[180, 0], [330, 1], [470, 0], [590, 1], [700, 0], [790, 1], [870, 0], [940, 1]].forEach(([t, v], i) => {
    const sz = 9 + i * 0.8, mk = (tt, o) => { const d = (fn) => { const c = Jc(tt); return [c[0] - c0[0], c[1] - c0[1]]; }; const [dx, dy] = d(); return { transform: `${k.T(dx, dy)} scale(${sz / 12 / 1.0 * 1})`, opacity: o }; };
    fx(k.pic(bolts[v], c0, 12, 32), [[t, mk(t, 0), 'linear'], [t + 20, mk(t + 20, 1), 'linear'], [t + 70, mk(t + 70, 0.4), 'linear'], [t + 100, mk(t + 100, 0.9), 'linear'], [t + 150, mk(t + 150, 0)]]);
  });
  // wisps spiralling in to the jar, and the pour's pop at the lid
  for (let i = 0; i < 16; i++) {
    const th0 = rand() * Math.PI * 2, spin = i % 2 ? 1 : -1, r0 = 24 + rand() * 24, t0 = 40 + rand() * 600, dur = 420 + rand() * 260, sz = 5 + rand() * 6, list = [];
    for (let j = 0; j <= 6; j++) {
      const f = j / 6, th = th0 + spin * f * Math.PI * 1.6, r = r0 * (1 - f * f), t = Math.round(t0 + dur * f), cj = Jc(Math.min(t, k.END - 1));
      list.push([t, { transform: `${k.T(cj[0] - c0[0] + Math.cos(th) * r * 1.15, cj[1] - c0[1] + Math.sin(th) * r * 0.75)} scale(${(0.5 + 0.8 * (1 - f)).toFixed(2)}) rotate(${Math.round(th * 40)}deg)`, opacity: j === 0 || j === 6 ? 0 : 0.8 }, 'linear']);
    }
    fx(k.pic(i % 3 === 0 ? 'gray' : 'wisp', c0, sz, sz, i % 3 === 0 ? { lit: false } : undefined), list);
  }

  // ── RELEASE: the lid pops; flash, ring; the storm pours out along an arc to T
  const Er = Jtop(1010), Ec = Jc(1010);
  const f0 = Jc(1010);
  const popAt = (t) => { const c = Jtop(t); return [c[0] - c0[0], c[1] - c0[1]]; };
  fx(k.light('g-sky', c0, 80), [[960, { transform: `${k.T(...popAt(960))} scale(.3)`, opacity: 0 }, 'ease-out'], [1030, { transform: `${k.T(...popAt(1030))} scale(1.5)`, opacity: 1 }, 'ease-out'], [1160, { transform: `${k.T(...popAt(1160))} scale(1.3)`, opacity: 0.5 }, 'ease-out'], [1400, { transform: `${k.T(...popAt(1400))} scale(.8)`, opacity: 0 }]]);
  const ring = k.svg('<circle cx="20" cy="20" r="17" fill="none" stroke="#e8fffe" stroke-width="2.2"/><circle cx="20" cy="20" r="17" fill="none" stroke="#9fe0e8" stroke-width="5" opacity=".35"/>', 40, 40);
  const ringAt = (pos, t0, size, scale1, dur) => fx(k.pic(ring, pos, size, size), [[t0, { transform: 'scale(.25)', opacity: 0 }, 'ease-out'], [t0 + 60, { transform: 'scale(.5)', opacity: 0.95 }, 'ease-out'], [t0 + dur, { transform: `scale(${scale1})`, opacity: 0 }]]);
  ringAt(Er, 1010, 22, 2.4, 520);
  // the stream: puffs of dark and pale cloud along the arc, from where the jar's mouth is at 1010 to T
  const C = [(Er[0] + T[0]) / 2, Math.min(Er[1], T[1]) - 24];
  const bz = (t) => { const q = 1 - t; return [q * q * Er[0] + 2 * q * t * C[0] + t * t * T[0], q * q * Er[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const [X0, Y0] = k.P(...Er), rel = (p) => { const [x, y] = k.P(...p); return [x - X0, y - Y0]; };
  const dist = Math.hypot(T[0] - Er[0], T[1] - Er[1]), flight = clamp(260 + dist * 1.6, 340, 520);
  for (let i = 0; i < 26; i++) {
    const t0 = 1010 + i * 24, r = Math.round(rand() * 360), side = (rand() - 0.5) * 9 * u, sz = 30 + rand() * 14, dark = i % 3 === 0;
    const at = (f, sc, o) => { const [x, y] = rel(bz(f)); return { transform: `translate(${(x + side * Math.sin(f * 3.1)).toFixed(1)}px, ${y.toFixed(1)}px) rotate(${r + Math.round(f * 120)}deg) scale(${sc})`, opacity: o }; };
    fx(k.pic(dark ? 'gray' : 'wisp', Er, sz, sz, dark ? { lit: false } : undefined), [[t0, at(0, 0.4, 0), 'ease-out'], [t0 + 50, at(0.08, 0.7, 0.95)], [t0 + flight * 0.5, at(0.5, 1, 0.9)], [t0 + flight, at(1, 1.25, 0.75), 'ease-out'], [t0 + flight + 380, at(1, 2.1, 0)]]);
  }
  // streaks of gale racing ahead, and bolts flickering in the stream
  const streak = k.svg('<path d="M1 6Q10 1 22 5T46 5" fill="none" stroke="#f0ffff" stroke-width="1.6" stroke-linecap="round"/><path d="M6 9Q16 5 28 8" fill="none" stroke="#bff0f4" stroke-width="1.1" stroke-linecap="round" opacity=".8"/>', 48, 12);
  const angOf = (a, b) => Math.round(deg(Math.atan2(b[1] - a[1], b[0] - a[0])));
  for (let i = 0; i < 6; i++) {
    const t0 = 1000 + i * 55, off = (i - 2.5) * 3.2, a0 = angOf(bz(0), bz(0.2));
    const at = (f, o, s) => { const [x, y] = rel(bz(f)); const a = f < 0.95 ? angOf(bz(f), bz(Math.min(1, f + 0.05))) : angOf(bz(0.9), bz(1)); return { transform: `translate(${x.toFixed(1)}px, ${(y + off * u).toFixed(1)}px) rotate(${a}deg) scale(${s}, 1)`, opacity: o }; };
    fx(k.pic(streak, Er, 26, 6.5), [[t0, at(0, 0, 0.5), 'ease-out'], [t0 + 50, at(0.1, 0.8, 1)], [t0 + flight * 0.55, at(0.6, 0.85, 1.2)], [t0 + flight * 0.85, at(1, 0.8, 1.35), 'ease-out'], [t0 + flight + 160, at(1.05, 0, 1.5)]]);
  }
  [[0.3, 1070], [0.55, 1160], [0.78, 1250]].forEach(([f, t], i) => {
    const p = bz(f), [x, y] = rel(p), a = Math.round(deg(Math.atan2(bz(Math.min(1, f + 0.05))[1] - p[1], bz(Math.min(1, f + 0.05))[0] - p[0])) + 90 + (i % 2 ? 22 : -22));
    fx(k.pic(bolts[i % 2], Er, 10, 26), [[t, { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${a}deg) scale(.6)`, opacity: 0 }, 'linear'], [t + 20, { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${a}deg) scale(1)`, opacity: 1 }, 'linear'], [t + 70, { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${a}deg) scale(1)`, opacity: 0.35 }, 'linear'], [t + 100, { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${a}deg) scale(1)`, opacity: 0.9 }, 'linear'], [t + 150, { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${a}deg) scale(1)`, opacity: 0 }]]);
  });

  // ── IMPACT at T: flash, rings, the storm blooms open, gale turns about it, rain, a spark, glitter rises
  const I = 1450;
  const il = [[I - 60, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [I + 40, { transform: 'scale(1.35)', opacity: 1 }, 'ease-out']];
  for (let t = I + 160, i = 0; t < 2300; t += 120, i++) il.push([t, { transform: `scale(${i % 2 ? 1.1 : 0.95})`, opacity: i % 2 ? 0.7 : 0.5 }, eio]);
  il.push([2700, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.light('g-sky', T, 78), il);
  ringAt(T, I, 24, 3.2, 640); ringAt(T, I + 150, 24, 2.4, 560);
  // the little storm cloud that opens there, turning slowly, and thins away
  for (let i = 0; i < 7; i++) {
    const th = (i / 7) * Math.PI * 2 + rand(), rr = 3 + rand() * 7, sz = 24 + rand() * 12, x = Math.cos(th) * rr, y = Math.sin(th) * rr * 0.55 - 5, spin = (i % 2 ? 1 : -1) * (14 + rand() * 18);
    const pos = (s, dx, dy, a) => ({ transform: `${k.T(x * s + dx, y * s + dy)} rotate(${a}deg) scale(${s})` });
    fx(k.pic(i % 2 ? 'wisp' : 'gray', T, sz, sz, i % 2 ? undefined : { lit: false }), [[I - 40 + i * 25, { ...pos(0.3, 0, 0, 0), opacity: 0 }, 'ease-out'], [I + 220 + i * 25, { ...pos(1.1, 0, -1, spin), opacity: 0.88 }, eio], [I + 1000, { ...pos(1.35, 2, -4, spin * 2.5), opacity: 0.6 }, eio], [I + 1700, { ...pos(1.7, 5, -9, spin * 4), opacity: 0 }]]);
  }
  // gale arcs turning round it
  const swirl = k.svg('<path d="M4 18Q4 4 18 4T32 17Q31 26 22 26T12 18Q13 12 19 12" fill="none" stroke="#f0ffff" stroke-width="1.5" stroke-linecap="round"/><path d="M8 24Q16 31 27 25" fill="none" stroke="#bff0f4" stroke-width="1" stroke-linecap="round" opacity=".7"/>', 36, 32);
  for (let i = 0; i < 3; i++) fx(k.pic(swirl, T, 30 + i * 10, 27 + i * 9), [[I + i * 60, { transform: `rotate(${i * 70}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [I + 260 + i * 60, { transform: `rotate(${i * 70 + 90}deg) scale(1)`, opacity: 0.85 }, 'linear'], [I + 1100, { transform: `rotate(${i * 70 + 300}deg) scale(1.2)`, opacity: 0.5 }, 'linear'], [I + 1700, { transform: `rotate(${i * 70 + 480}deg) scale(1.4)`, opacity: 0 }]]);
  // a bolt strikes within it, twice
  [I + 40, I + 220].forEach((t, i) => fx(k.pic(bolts[i % 2], [T[0] + (i ? 5 : -4), T[1] - 4], 11, 29), [[t, { transform: 'scale(.6)', opacity: 0 }, 'linear'], [t + 20, { transform: 'scale(1)', opacity: 1 }, 'linear'], [t + 80, { transform: 'scale(1)', opacity: 0.3 }, 'linear'], [t + 110, { transform: 'scale(1)', opacity: 0.85 }, 'linear'], [t + 170, { transform: 'scale(1)', opacity: 0 }]]));
  // rain falling from it, slanted by the gale, thinning
  for (let i = 0; i < 18; i++) {
    const x = (rand() - 0.5) * 40, t0 = I + 120 + i * 62 + rand() * 40, fall = 22 + rand() * 12;
    fx(k.pic('drop', [T[0] + x, T[1] - 14], 1.6, 6), [[t0, { transform: `${k.T(0, 0)} rotate(14deg)`, opacity: 0 }, 'ease-in'], [t0 + 60, { transform: `${k.T(-1, 3)} rotate(14deg)`, opacity: 0.9 }, 'linear'], [t0 + 330, { transform: `${k.T(-6, fall)} rotate(14deg)`, opacity: 0 }]]);
  }
  // glitter rising from the bloom: the boon
  for (let i = 0; i < 12; i++) {
    const t0 = I + 100 + rand() * 700, x = (rand() - 0.5) * 34, sz = 2.5 + rand() * 3;
    fx(k.pic('spark', [T[0] + x, T[1] + 4], sz, sz), [[t0, { transform: `${k.T(0, 0)} scale(.3)`, opacity: 0 }, 'ease-out'], [t0 + 200, { transform: `${k.T(x * 0.1, -8)} scale(1)`, opacity: 0.95 }, eio], [t0 + 900, { transform: `${k.T(x * 0.2 + 4, -26)} scale(.4)`, opacity: 0 }]]);
  }
}
