// Ash Squire: he digs in, the blade catches fire from his torch, and he lunges and cuts a crescent of fire
// across at his target, which bursts in sparks and flame.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker (Rush: he hits first), element: fire.
//   0-500     anticipation. He checks his run and rocks back on his rear foot (leans away, sinks); the sword arm
//             draws back and up, the torch arm swings the torch forward; dust lifts at his heels. If his target is
//             behind him he whirls round (through a sliver) first.
//   500-1050  the gather. The blade takes fire from the torch: flames climb it, a hot light swells at its point; the
//             torch flare grows and streams; he holds, quivering, for a beat.
//   1050      RELEASE (BEATS.release): he drives forward (a lunge of his whole body), the arm cuts down and through,
//             and a crescent of fire leaves the blade's point for the target, billows of fire along its path.
//   1380      IMPACT (BEATS.impact): the crescent lands on T: a flash and ring, sparks flung out, flames catch,
//             smoke rolls up. Speed streaks hang behind him; dust and embers at his heels.
//   1400-3500 follow-through: he rocks back from the effort (a little past rest), the blade's fire dies down, the torch
//             calms, the flames at T burn low and go out; he settles. (BEATS.settle 3500); END 4000, at rest.
//
// The contract (bakeoff/recipe.md): its target is k.aim when another card is there, else its own (the ground
// ahead of it, at the right); every point of the crescent's path is worked out from its point (`emit`, followed as
// the arm turns) and the target; if the target is behind him he turns to face it.
export const END = 4000;
export const BEATS = { release: 1050, impact: 1380, settle: 3500 };
export const STILLS = [300, 750, 1040, 1200, 1400, 1800, 2700, 3800];

const soft = (x, y) => Math.hypot(x - 0.5, y - 0.5) * 2;
export const textures = {
  ember: [16, 16, (x, y) => { const c = Math.max(0, 1 - soft(x, y)); return [255, 176, 80, Math.min(1, Math.pow(c, 0.7) * 1.5)]; }],
  hot: [16, 16, (x, y) => { const c = Math.max(0, 1 - soft(x, y)); return [255, 240, 190, Math.min(1, Math.pow(c, 0.8) * 1.6)]; }],
  // a long streak of fire, hot at its head (the right end), thinning to nothing behind
  streak: [48, 8, (x, y) => { const a = Math.max(0, 1 - Math.abs(y - 0.5) * 2.4) * Math.pow(x, 1.4); return [255, 190 + 50 * x, 100 + 90 * x, a * 0.9]; }],
};

export function build(k) {
  const { act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const fx = (el, list) => { let last = -1; k.fx(el, list.slice().sort((a, b) => a[0] - b[0]).map((e) => { last = Math.max(last + 1, Math.min(e[0], k.END - 1)); return [last, ...e.slice(1)]; })); };
  k.css(`.fx-hotblade { filter: brightness(2.2) sepia(.8) saturate(2.4) hue-rotate(-12deg); }`);
  const sp = k.spec, F = sp.feet, S = sp.shoulder, TN = sp.shoulderT, TOP = sp.torch, TIP = sp.emit;
  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  const keys = []; for (let t = 0; t < 3600; t += 40) keys.push(t); keys.push(3600);
  const rad = (d) => (d * Math.PI) / 180;
  const coarse = keys.filter((_, i) => i % 2 === 0); // (the lights and flames that follow the arm: every other moment is plenty)

  // ── where it goes, and whether he must turn for it
  const T = k.aim || sp.alone;
  const FLIP = T[0] < 128;
  // (his turn: 1 -> -1 over 0..380 through a sliver, held, then -1 -> 1 over 3050..3450)
  const SX = (t) => {
    if (!FLIP) return 1;
    const v = t >= 3050 ? -Math.cos(Math.PI * Math.min(1, (t - 3050) / 400)) : Math.cos(Math.PI * Math.min(1, t / 380));
    return Math.abs(v) < 0.05 ? (v < 0 ? -0.05 : 0.05) : v;
  };
  const W = (p) => (FLIP ? [300 - p[0], p[1]] : p);

  // ── his body's motion (in his own frame: facing right, forward is +x): rocks back, drives forward, rocks back from it
  const DX = curve([[0, 0], [260, -3], [520, -6], [1000, -8], [1050, -8], [1180, 15], [1500, 19], [1900, -3.5], [2600, 0.5], [3500, 0]]);
  const DY = curve([[0, 0], [520, 1.6], [1000, 2.2], [1050, 2.2], [1160, -2.2], [1500, -0.5], [1900, 0.7], [2700, 0], [3500, 0]]);
  const AA = curve([[0, 0], [520, -5.5], [1000, -7.5], [1050, -7.5], [1180, 4.5], [1500, 6], [1900, -2.2], [2600, 0.5], [3500, 0]]);
  const body = (t) => ({ dx: DX(t) + 0.45 * Math.sin(t / 55) * (t > 780 && t < 1050 ? (t - 780) / 270 : 0), dy: DY(t), a: AA(t) });
  // a part's transform: mirror ∘ body ∘ local (its own turn about its pivot, and a shift)
  const tf = (Pv, t, l = {}) => {
    const b = body(t), sx = SX(t), fx_ = F[0] - Pv[0], fy_ = F[1] - Pv[1];
    return `translate(${((1 - sx) * (150 - Pv[0]) * u).toFixed(2)}px, 0px) scale(${sx.toFixed(3)}, 1) ${k.T(b.dx, b.dy)} ${k.T(fx_, fy_)} rotate(${b.a.toFixed(2)}deg) ${k.T(-fx_, -fy_)} ${k.T(l.x || 0, l.y || 0)} rotate(${(l.r || 0).toFixed(2)}deg) scale(${(l.sx ?? 1).toFixed(3)}, ${(l.sy ?? 1).toFixed(3)})`;
  };
  // where a point of a part is in the picture at t (given the part's own turn r about Pv and shift)
  const ptW = (Pv, p, t, l = {}) => {
    const b = body(t), sx = SX(t), r = rad(l.r || 0), a = rad(b.a);
    let x = p[0] - Pv[0], y = p[1] - Pv[1];
    [x, y] = [x * Math.cos(r) - y * Math.sin(r) + (l.x || 0), x * Math.sin(r) + y * Math.cos(r) + (l.y || 0)];
    x += Pv[0] - F[0]; y += Pv[1] - F[1];
    [x, y] = [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
    x += F[0] + b.dx; y += F[1] + b.dy;
    return [150 + sx * (x - 150), y];
  };

  // ── the sword arm: draws back and up, holds, cuts down through the lunge, comes back to rest
  const SR = curve([[0, 0], [300, -22], [520, -46], [1000, -52], [1050, -52], [1130, 34], [1260, 25], [1500, 28], [2000, 8], [2700, 0]]);
  const sword = k.part('sword');
  const swordL = (t) => ({ r: SR(t) + 0.8 * Math.sin(t / 40) * (t > 800 && t < 1050 ? (t - 800) / 250 : 0) });
  act(sword, keys.map((t) => [t, { transform: tf(S, t, swordL(t)) }, 'linear']));
  const hotBlade = k.copy('sword', 'fx-hotblade');
  const HB = curve([[0, 0], [500, 0], [900, 0.8], [1380, 0.9], [1900, 0.35], [2500, 0]]);
  act(hotBlade, keys.map((t) => [t, { transform: tf(S, t, swordL(t)), opacity: +HB(t).toFixed(2) }, 'linear']));
  // ── the torch arm: swings the torch forward as he gathers, streams back as he lunges
  const TR = curve([[0, 0], [500, 11], [1000, 13], [1050, 13], [1180, -9], [1500, -6], [2100, 2], [2800, 0]]);
  act(k.part('torch'), keys.map((t) => [t, { transform: tf(TN, t, { r: TR(t) }) }, 'linear']));
  // ── the torch's flame: follows the torch's head, swells and streams back harder in the lunge, flickers always
  const topShift = (t) => { const r = rad(TR(t)), vx = TOP[0] - TN[0], vy = TOP[1] - TN[1]; return [vx * Math.cos(r) - vy * Math.sin(r) - vx, vx * Math.sin(r) + vy * Math.cos(r) - vy]; };
  const FS = curve([[0, 1], [500, 1.12], [1000, 1.3], [1050, 1.3], [1180, 1.7], [1500, 1.45], [2100, 1.1], [2900, 1]]);
  const flameL = (t) => { const [sx_, sy_] = topShift(t), s = FS(t), fl = Math.sin(t / 45) * 0.06 + Math.sin(t / 71 + 1) * 0.04, amp = Math.min(1, t / 300) * (1 - Math.max(0, t - 2900) / 600); return { x: sx_, y: sy_, r: TR(t) * 0.5 + (s - 1) * -6 + Math.sin(t / 90) * 3 * amp, sx: 1 + (s - 1) + fl * amp, sy: 1 + (s - 1) * 0.25 - fl * 0.5 * amp }; };
  act(k.part('flame'), keys.map((t) => [t, { transform: tf(TOP, t, flameL(t)) }, 'linear']));
  // the flame's light, following it
  {
    const [x0, y0] = [TOP[0] - 8, TOP[1] + 10];
    const lt = (t, sc, o) => { const [sx_, sy_] = topShift(t), b = ptW(TOP, [x0, y0], t, { x: sx_, y: sy_, r: TR(t) }); return [t, { transform: `${k.T(b[0] - x0, b[1] - y0)} scale(${sc.toFixed(2)})`, opacity: o }, 'linear']; };
    fx(k.lightIn('g-warm', [x0, y0], 62, 62), coarse.map((t) => lt(t, 0.9 + 0.5 * (FS(t) - 1) + 0.08 * Math.sin(t / 60), Math.min(1, 0.35 + 0.8 * (FS(t) - 1)))));
  }

  // ── dust and embers at his heels: kicked up as he checks his run and again as he drives off
  const heel = W([128, 188]);
  [[200, 0.9], [330, 0.7], [1090, 1.2], [1180, 1], [1290, 0.8], [1420, 0.7]].forEach(([t, s], i) => {
    const r = Math.round(rand() * 360), back = FLIP ? 1 : -1, x = heel[0] + (rand() - 0.5) * 8;
    fx(k.picIn('smoke', [x, 184], 24 * s, 20 * s, { lit: false }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 260, { transform: `${k.T(back * 7, -5)} rotate(${r + 20}deg) scale(.9)`, opacity: 0.55 }], [t + 900, { transform: `${k.T(back * 20, -16)} rotate(${r + 40}deg) scale(1.7)`, opacity: 0 }]]);
  });
  for (let i = 0; i < 9; i++) {
    const t = 1090 + i * 38 + rand() * 50, back = FLIP ? 1 : -1, ex = heel[0] + 6 * -back, vx = back * (16 + rand() * 26), vy = -(8 + rand() * 22);
    fx(k.picIn('ember', [ex, 182], 3.2, 3.2, {}), [[t, { transform: `${k.T(0, 0)} scale(.6)`, opacity: 0 }, 'ease-out'], [t + 90, { transform: `${k.T(vx * 0.35, vy * 0.6)} scale(1)`, opacity: 1 }, 'linear'], [t + 520, { transform: `${k.T(vx, vy * 0.2 + 12)} scale(.5)`, opacity: 0 }]]);
  }
  // speed streaks hanging behind him as he drives forward
  for (let i = 0; i < 5; i++) {
    const t = 1130 + i * 45, y = 120 + i * 13 + (rand() - 0.5) * 4, x = W([112 - i * 3, y])[0], len = 34 + rand() * 12, back = FLIP ? 1 : -1;
    fx(k.picIn('streak', [x, y], len, 3.2, {}), [[t, { transform: `${k.T(back * -10, 0)} scaleX(${FLIP ? -0.4 : 0.4})`, opacity: 0 }, 'ease-out'], [t + 100, { transform: `${k.T(0, 0)} scaleX(${FLIP ? -1 : 1})`, opacity: 0.85 }, 'linear'], [t + 340, { transform: `${k.T(back * 14, 0)} scaleX(${FLIP ? -1.3 : 1.3})`, opacity: 0 }]]);
  }

  // ── the blade takes fire: flames climbing it (carried with the arm), a light swelling at its point
  const along = [[183, 124.5], [194, 128.5], [205, 132.4], [215, 135.6]];
  along.forEach((p, i) => {
    const on = 520 + i * 110, off = 2100 + i * 90;
    const list = [];
    for (const t of coarse) {
      if (t < on - 80 || t > off + 120) continue;
      const w = ptW(S, p, t, swordL(t)), env = t < on ? 0 : t < on + 150 ? (t - on) / 150 : t > off ? Math.max(0, 1 - (t - off) / 220) : 1, st = (t > 1000 && t < 1700 ? 1.45 : 1.15) * (0.9 + 0.2 * Math.sin(t / 50 + i * 2));
      list.push([t, { transform: `${k.T(w[0] - p[0], w[1] - p[1])} scale(${(0.9 * st).toFixed(2)}, ${(st * (1 + 0.15 * Math.sin(t / 70 + i))).toFixed(2)}) skewX(${(Math.sin(t / 60 + i) * 6 + (FLIP ? 8 : -8) * (t > 1000 ? 1 : 0)).toFixed(1)}deg)`, opacity: +(env * 0.95).toFixed(2) }, 'linear']);
    }
    fx(k.pic(i % 2 ? 'flame' : 'flame2', p, 9 + (i % 2) * 2, 15 + i * 2, { base: true }), list);
  });
  {
    const list = [];
    for (const t of coarse) {
      if (t < 380 || t > 2300) continue;
      const w = ptW(S, TIP, t, swordL(t)), s = curve([[380, 0.2], [1000, 1], [1050, 1.1], [1380, 1.3], [1800, 0.7], [2300, 0.2]])(t), o = curve([[380, 0], [900, 0.85], [1380, 1], [1900, 0.4], [2300, 0]])(t);
      list.push([t, { transform: `${k.T(w[0] - TIP[0], w[1] - TIP[1])} scale(${(s * (1 + 0.1 * Math.sin(t / 55))).toFixed(2)})`, opacity: +o.toFixed(2) }, 'linear']);
    }
    fx(k.lightIn('g-warm', TIP, 46, 46), list);
  }

  // ── the crescent: leaves the point at the release, along a low arc to T, billows of fire along its way
  const R0 = 1090, TL = 1380; // (leaves at 1090 as the arm comes down; lands at 1380)
  const M = ptW(S, TIP, R0, swordL(R0));
  const C = [(M[0] + T[0]) / 2, Math.min(M[1], T[1]) - 14 - Math.abs(T[0] - M[0]) * 0.08];
  const bz = (f) => { const q = 1 - f; return [q * q * M[0] + 2 * q * f * C[0] + f * f * T[0], q * q * M[1] + 2 * q * f * C[1] + f * f * T[1]]; };
  const dirAt = (f) => { const a = bz(Math.max(0, f - 0.02)), b = bz(Math.min(1, f + 0.02)); return (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI; };
  const crescent = k.svg(`<defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff7a2a" stop-opacity=".0"/><stop offset=".45" stop-color="#ffb04a"/><stop offset="1" stop-color="#fff6d8"/></linearGradient></defs>` +
    `<path d="M6 1Q40 3 38 15Q40 27 6 29Q24 15 6 1Z" fill="#ff8a3a" opacity=".35" transform="translate(-1 0) scale(1.06 1.03)"/><path d="M6 1Q40 3 38 15Q40 27 6 29Q24 15 6 1Z" fill="url(#cg)"/>`, 44, 30);
  const [PX, PY] = k.P(...M);
  const place = (f, sc, o) => { const [x, y] = k.P(...bz(f)); return { transform: `translate(${(x - PX).toFixed(1)}px, ${(y - PY).toFixed(1)}px) rotate(${dirAt(f).toFixed(1)}deg) scale(${sc})`, opacity: o }; };
  fx(k.pic(crescent, M, 40, 28, {}), [[R0 - 20, place(0, 0.4, 0), 'ease-out'], [R0 + 40, place(0.06, 0.9, 1), 'linear'], [R0 + 120, place(0.3, 1.1, 1), 'linear'], [R0 + 220, place(0.7, 1.25, 1), 'linear'], [TL - 10, place(0.97, 1.4, 1), 'ease-out'], [TL + 90, place(1, 1.9, 0)]]);
  for (let i = 0; i < 12; i++) {
    const t0 = R0 + i * 24, r = Math.round(rand() * 360), side = (rand() - 0.5) * 9;
    const at = (f, sc, o) => { const [x, y] = k.P(...bz(f)); return { transform: `translate(${(x - PX).toFixed(1)}px, ${(y - PY + side * f * u).toFixed(1)}px) rotate(${r + Math.round(f * 70)}deg) scale(${sc})`, opacity: o }; };
    const f0 = Math.min(0.96, (t0 - R0) / (TL - R0) * 0.9);
    fx(k.pic(i % 3 === 2 ? 'puffCool' : 'puff', M, 17, 17, {}), [[t0, at(f0, 0.45, 0), 'ease-out'], [t0 + 50, at(Math.min(1, f0 + 0.1), 0.7, 0.9)], [t0 + 160, at(Math.min(1, f0 + 0.25), 0.85, 0.7)], [t0 + 420, at(Math.min(1, f0 + 0.3), 1.3, 0)]]);
  }

  // ── where it lands: flash and ring, sparks flung, flames catching, smoke rolling up
  fx(k.light('g-warm', T, 58), [[TL - 50, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [TL + 40, { transform: 'scale(1.25)', opacity: 1 }, 'linear'], [TL + 220, { transform: 'scale(1)', opacity: 0.8 }, 'linear'], [TL + 420, { transform: 'scale(1.1)', opacity: 0.95 }, eio], [TL + 560, { transform: 'scale(.95)', opacity: 0.7 }, eio], [2300, { transform: 'scale(1.05)', opacity: 0.6 }, eio], [2900, { transform: 'scale(.6)', opacity: 0 }]]);
  fx(k.pic('hot', T, 28, 28, {}), [[TL - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [TL + 30, { transform: 'scale(1.1)', opacity: 1 }, 'linear'], [TL + 260, { transform: 'scale(1.8)', opacity: 0 }]]);
  const ring = k.svg('<ellipse cx="30" cy="30" rx="27" ry="27" fill="none" stroke="#ffd48a" stroke-width="5" opacity=".3"/><ellipse cx="30" cy="30" rx="27" ry="27" fill="none" stroke="#fff0c8" stroke-width="2"/>', 60, 60);
  fx(k.pic(ring, T, 60, 60, {}), [[TL - 20, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [TL + 60, { transform: 'scale(.5)', opacity: 0.95 }, 'ease-out'], [TL + 520, { transform: 'scale(1.5)', opacity: 0 }]]);
  for (let i = 0; i < 16; i++) {
    const a = rand() * Math.PI * 2, v = 14 + rand() * 30, t0 = TL + rand() * 50, hot = i % 3 === 0;
    const vx = Math.cos(a) * v, vy = Math.sin(a) * v * 0.8 - 8;
    fx(k.pic(hot ? 'hot' : 'ember', T, 3.6 + rand() * 1.8, 3.6 + rand() * 1.8, {}), [[t0, { transform: `${k.T(0, 0)} scale(.5)`, opacity: 0 }, 'ease-out'], [t0 + 100, { transform: `${k.T(vx * 0.5, vy * 0.5)} scale(1.1)`, opacity: 1 }, 'linear'], [t0 + 360, { transform: `${k.T(vx, vy * 0.9 + 12)} scale(.7)`, opacity: 0.7 }, 'linear'], [t0 + 640, { transform: `${k.T(vx * 1.2, vy * 0.9 + 26)} scale(.3)`, opacity: 0 }]]);
  }
  const flicker = (el, on, off, lean = 0) => {
    const sk = (d) => `skewX(${(lean + d).toFixed(1)}deg)`;
    const list = [[on, { transform: `translateY(0px) scale(.6, .12) ${sk(0)}`, opacity: 0 }, 'ease-out'], [on + 120, { transform: `translateY(0px) scale(1, 1) ${sk(0)}`, opacity: 0.95 }, eio]];
    for (let t = on + 120, i = 1; (t += 80 + rand() * 60) < off; i++) { const s = i % 2 ? 1 : -1; list.push([t, { transform: `translateY(${(-rand() * 1.5).toFixed(1)}px) scale(${(1 - s * 0.08 - rand() * 0.06).toFixed(2)}, ${(1 + s * 0.14 + rand() * 0.1).toFixed(2)}) ${sk(s * (2 + rand() * 5))}`, opacity: +(0.8 + rand() * 0.2).toFixed(2) }, eio]); }
    list.push([Math.min(k.END, off + 260), { transform: `translateY(0px) scale(.5, .15) ${sk(0)}`, opacity: 0 }]);
    fx(el, list);
  };
  for (let i = 0; i < 5; i++) flicker(k.pic(i % 2 ? 'flame' : 'flame2', [T[0] + (i - 2) * 7, T[1] + 7], 10 + rand() * 4, 16 + rand() * 9, { base: true }), TL + 40 + i * 70, 2300 + rand() * 450);
  for (let i = 0; i < 4; i++) {
    const t = TL + 280 + i * 190, r = Math.round(rand() * 360);
    fx(k.pic('smoke', [T[0] + (rand() - 0.5) * 12, T[1] - 4], 26, 26, { lit: false, low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 300, { transform: `${k.T(-2, -12)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 1300, { transform: `${k.T(-8, -46)} rotate(${r + 50}deg) scale(2)`, opacity: 0 }]]);
  }
}
