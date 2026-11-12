// Static Spark: the spark gathers at the fingertip and leaps to the wick.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker (a spell: the
// spark is the attack), element: lightning. Alone, T = the candle's wick.
//   0-450     the room holds its breath: the hand draws back a hair, the
//             crackling thread between finger and wick dims and shrinks, the
//             shivering air tightens in toward the fingertip.
//   450-1000  the gathering (anticipation): a bead of light grows at the
//             fingertip, little arcs flicker round it in all directions, the
//             hand trembles, the light of the room pulses with it.
//   1000      RELEASE (BEATS.release): the hand flicks toward T and the bolt
//             leaps: a jagged thread, forking, flickering through five
//             different shapes in a few frames, flashing at both ends.
//   1090      IMPACT (BEATS.impact): at T, a white-gold flash, a star, a ring,
//             a spray of sparks falling in arcs, short arcs crawling out. Alone
//             the wick catches: a small flame stands up, gutters and goes out
//             in a wisp of smoke.
//   1300-2400 the hand eases home with a little overshoot; the flash at T
//             dims; the flame gutters.
//   2400-3200 the thread of lightning re-forms between finger and wick,
//             flickering back to its glow, and the shivering air settles.
//   3300      at rest as drawn (BEATS.settle; the move ends at END).
//
// The contract (bakeoff/recipe.md): the bolt is worked out from `emit` (the
// fingertip, as the hand is turned at the release) and T = k.aim, else the wick.
// The hand turns a little toward T (it swings from the far end of its sleeve);
// everything that flies or lands is on the overlay.
export const END = 3800;
export const BEATS = { release: 1000, impact: 1090, settle: 3300 };
export const STILLS = [300, 800, 1020, 1060, 1200, 1500, 2300, 3500];

export const textures = {
  spark: [32, 32, (x, y) => { const dx = Math.abs(x - 0.5) * 2, dy = Math.abs(y - 0.5) * 2, c = Math.max(0, 1 - Math.hypot(dx, dy)), cr = Math.max(0, 1 - Math.min(dx * 7 + dy, dy * 7 + dx)); const v = Math.min(1, c * c * 1.6 + cr * 0.9); return [255, 226 + 29 * v, 150 + 100 * v * v, v]; }],
  dot: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 236, 170, Math.min(1, c * 2.2)]; }],
};

export function build(k) {
  const { act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  // (keyframes must rise strictly: nudge any that touch)
  const fx = (el, list) => { let last = -1; k.fx(el, list.slice().sort((a, b) => a[0] - b[0]).map((e) => { last = Math.max(last + 1, Math.min(e[0], k.END - 1)); return [last, ...e.slice(1)]; })); };
  const S = k.spec, E = S.emit, W = S.wrist, REL = 1000, IMP = 1090;
  const aimed = !!k.aim;
  const T = k.aim || S.alone;
  k.css(`.g-spk { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,250,228,.95), rgba(255,214,130,.55) 28%, rgba(255,150,60,.16) 58%, rgba(255,110,40,0) 100%); }
    .g-cand { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,214,140,.55), rgba(255,150,70,.22) 45%, rgba(255,110,40,0) 100%); }`);
  const track = (keys) => (t) => {
    let i = keys.length - 1;
    while (i > 0 && keys[i][0] > t) i--;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const f = b[0] === a[0] ? 0 : sm(Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))));
    return a.slice(1).map((v, j) => v + (b[j + 1] - v) * f);
  };
  const grid = [];
  for (let t = 0; t <= 3290; t += 30) grid.push(t);

  // ── the hand: draws back, trembles while it gathers, flicks toward T, eases home
  // (its joint is the far end of the sleeve: W, so the fingertip, 150 units out, swings far more than the hand)
  const ang0 = (Math.atan2(T[1] - E[1], T[0] - E[0]) * 180) / Math.PI;
  const aim = aimed ? Math.max(-9, Math.min(9, ang0 * 0.5)) : -1.5;
  const hand = track([[0, 0, 0, 0], [450, -2.2, -1.3, 0], [700, -2.6, -1.5, 0], [940, -3.2, -2.0, 0], [1010, aim + 1.4, 3.4, 0], [1150, aim - 0.4, 2.0, 0], [1500, aim * 0.5 + 0.5, 0.8, 0], [2000, -0.6, -0.3, 0], [2600, 0.2, 0.1, 0], [3290, 0, 0, 0]]);
  const handTf = (t) => {
    const [a, tx] = hand(t), trem = t > 450 && t < 1000 ? Math.sin(t / 22) * 0.45 * sm((t - 450) / 300) * (1 - sm((t - 900) / 100)) : 0;
    return `translate(${(tx * u).toFixed(2)}px, 0px) rotate(${(a + trem).toFixed(2)}deg)`;
  };
  const sample = (fn, last) => [...grid.map((t) => [t, fn(t), 'linear']), [3300, last]];
  const rest = { transform: 'translate(0px, 0px) rotate(0deg)' };
  act(k.part('hand'), sample((t) => ({ transform: handTf(t) }), rest));
  // where its fingertip is at time t (drawing units)
  const tip = (t) => {
    const [a, tx] = hand(t), r = (a * Math.PI) / 180, dx = E[0] - W[0], dy = E[1] - W[1];
    return [W[0] + dx * Math.cos(r) - dy * Math.sin(r) + tx, W[1] + dx * Math.sin(r) + dy * Math.cos(r)];
  };
  const E1 = tip(1010), E0 = tip(0);

  // ── the thread of lightning as drawn: dims and shrinks as it gathers, flickers back at the end
  const sp = [[0, { opacity: 1 }, eio], [250, { opacity: 0.55 }, eio], [450, { opacity: 0.2 }, eio], [900, { opacity: 0.1 }, eio], [1000, { opacity: 0 }]];
  const back = [[2300, { opacity: 0 }, eio]];
  for (let t = 2450, i = 0; t < 3150; t += 70, i++) back.push([t, { opacity: i % 2 ? 0.55 + rand() * 0.2 : 0.2 + rand() * 0.2 }, 'linear']);
  back.push([3200, { opacity: 0.85 }, eio], [3350, { opacity: 1 }]);
  act(k.part('spark'), [...sp, ...back]);
  // the shivering air: tightens in toward the fingertip, then spreads wide with the bolt, then settles back
  const dxs = (E0[0] - 177) * u, dys = (E0[1] - 99) * u;
  act(k.part('shim'), [[0, { transform: 'translate(0px, 0px) scale(1)', opacity: 1 }, eio], [450, { transform: `translate(${(dxs * 0.55).toFixed(1)}px, ${(dys * 0.55).toFixed(1)}px) scale(.6)`, opacity: 1 }, eio],
    [950, { transform: `translate(${(dxs * 0.75).toFixed(1)}px, ${(dys * 0.75).toFixed(1)}px) scale(.38)`, opacity: 0.8 }, 'ease-out'], [1090, { transform: 'translate(0px, 0px) scale(1.25)', opacity: 1 }, 'ease-out'],
    [1600, { transform: 'translate(0px, 0px) scale(1.12)', opacity: 0.6 }, eio], [2600, { transform: 'translate(0px, 0px) scale(1.04)', opacity: 0.85 }, eio], [3300, { transform: 'none', opacity: 1 }]]);

  // ── a bolt as a picture: a jagged thread of `len` units laid along x, from one end to the other (rotated to fit)
  const jag = (len, n, amp, seed) => {
    const pts = [[0, 0]];
    for (let i = 1; i < n; i++) pts.push([(len * i) / n + (rand() - 0.5) * (len / n) * 0.6, (rand() - 0.5) * 2 * amp * Math.sin((Math.PI * i) / n + 0.3)]);
    pts.push([len, 0]);
    return pts;
  };
  const bolt = (len, amp, forks, w = 1) => {
    const pad = 8, H = Math.max(24, amp * 8 + 16), m = H / 2, main = jag(len, Math.max(5, Math.round(len / 9)), amp);
    const d = (pts, ox = 0, oy = 0) => 'M' + pts.map(([x, y]) => `${(pad + ox + x).toFixed(1)},${(m + oy + y).toFixed(1)}`).join(' L');
    let strokes = '';
    for (let f = 0; f < forks; f++) {
      const at = main[1 + Math.floor(rand() * (main.length - 2))], dir = rand() < 0.5 ? -1 : 1, fl = 6 + rand() * 12, fp = [[0, 0]];
      for (let j = 1; j <= 3; j++) fp.push([(fl * j) / 3 * 0.7 + (rand() - 0.5) * 3, dir * (fl * j) / 3 + (rand() - 0.5) * 3]);
      strokes += `<path d="${d(fp, at[0], at[1])}" fill="none" stroke="#ff9a3c" stroke-width="${(2.6 * w).toFixed(1)}" opacity=".4" stroke-linejoin="round"/><path d="${d(fp, at[0], at[1])}" fill="none" stroke="#fff4d0" stroke-width="${(0.7 * w).toFixed(1)}" stroke-linejoin="round"/>`;
    }
    const svg = `<path d="${d(main)}" fill="none" stroke="#ff9a3c" stroke-width="${(4 * w).toFixed(1)}" opacity=".45" stroke-linejoin="round"/><path d="${d(main)}" fill="none" stroke="#ffe2a0" stroke-width="${(1.8 * w).toFixed(1)}" stroke-linejoin="round"/><path d="${d(main)}" fill="none" stroke="#ffffff" stroke-width="${(0.8 * w).toFixed(1)}" stroke-linejoin="round"/>${strokes}`;
    return { src: k.svg(svg, len + pad * 2, H), w: len + pad * 2, h: H, pad };
  };
  // one bolt picture placed between two points (units), flickering on for `on` ms from `t`
  const flick = (a, b, t, on, v, o = 1) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI, c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    return { make: () => k.pic(v.src, c, v.w, v.h), tf: `rotate(${ang.toFixed(2)}deg)`, t, on, o };
  };
  const show = (e) => { const el = e.make(); fx(el, [[Math.max(0, e.t - 1), { transform: e.tf, opacity: 0 }, 'linear'], [e.t, { transform: e.tf, opacity: e.o }, 'linear'], [e.t + e.on - 1, { transform: e.tf, opacity: e.o * 0.8 }, 'linear'], [e.t + e.on, { transform: e.tf, opacity: 0 }]]); };

  // ── the bolt: five flickering frames, each its own jagged shape, from the fingertip to T
  const L = Math.max(10, Math.hypot(T[0] - E1[0], T[1] - E1[1]));
  [0, 1, 2, 3, 4].forEach((i) => show(flick(E1, T, REL + i * 48, i === 4 ? 90 : 48, bolt(L, Math.min(9, 3 + L / 16), 3), i % 2 ? 0.95 : 1)));
  // and a fainter ghost of it after the last (the afterimage)
  show(flick(E1, T, REL + 5 * 48 + 90, 120, bolt(L, 5, 1, 0.8), 0.45));

  // ── light: the bead at the fingertip (grows, pulses), the flash at the release, at T
  const tg = [[380, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [700, { transform: 'scale(.8)', opacity: 0.7 }, eio]];
  for (let t = 780, i = 0; t < 960; t += 60, i++) tg.push([t, { transform: `scale(${i % 2 ? 1.2 : 0.9})`, opacity: i % 2 ? 0.95 : 0.8 }, 'linear']);
  tg.push([REL + 30, { transform: 'scale(1.7)', opacity: 1 }, 'ease-out'], [REL + 350, { transform: 'scale(.9)', opacity: 0.35 }, eio], [REL + 800, { transform: 'scale(.3)', opacity: 0 }]);
  fx(k.light('g-spk', E1, 26), tg);
  fx(k.pic('spark', E1, 22, 22), [[900, { transform: 'rotate(0deg) scale(.2)', opacity: 0 }, 'ease-out'], [REL + 20, { transform: 'rotate(20deg) scale(1.1)', opacity: 1 }], [REL + 220, { transform: 'rotate(50deg) scale(.4)', opacity: 0 }]]);
  // little arcs crawling round the bead while it gathers
  for (let i = 0; i < 9; i++) {
    const t = 470 + i * 58 + rand() * 20, a = rand() * 360, len = 7 + rand() * 7, v = bolt(len, 2.2, 0, 0.8), ang = a;
    const c = [E0[0] + Math.cos((a * Math.PI) / 180) * (len / 2 + 2), E0[1] + Math.sin((a * Math.PI) / 180) * (len / 2 + 2)];
    const el = k.pic(v.src, c, v.w, v.h);
    fx(el, [[t - 1, { transform: `rotate(${ang}deg)`, opacity: 0 }, 'linear'], [t, { transform: `rotate(${ang}deg)`, opacity: 0.9 }, 'linear'], [t + 54, { transform: `rotate(${ang}deg)`, opacity: 0 }]]);
  }

  // ── where it lands: a flash, a star, a ring, sparks falling in arcs, arcs crawling out
  const ig = [[IMP - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 40, { transform: 'scale(1.3)', opacity: 1 }]];
  for (let t = IMP + 150, i = 0; t < 1500; t += 80, i++) ig.push([t, { transform: `scale(${i % 2 ? 1.05 : 0.85})`, opacity: i % 2 ? 0.8 : 0.55 }, 'linear']);
  ig.push([1900, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.light('g-spk', T, aimed ? 46 : 36), ig);
  fx(k.pic('spark', T, 32, 32), [[IMP - 20, { transform: 'rotate(0deg) scale(.2)', opacity: 0 }, 'ease-out'], [IMP + 50, { transform: 'rotate(15deg) scale(1.2)', opacity: 1 }], [IMP + 400, { transform: 'rotate(55deg) scale(.4)', opacity: 0 }]]);
  const ring = k.svg('<circle cx="20" cy="20" r="17" fill="none" stroke="#ffe2a0" stroke-width="1.6"/><circle cx="20" cy="20" r="13" fill="none" stroke="#ff9a3c" stroke-width="1" opacity=".5"/>', 40, 40);
  fx(k.pic(ring, T, 40, 40), [[IMP, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IMP + 90, { transform: 'scale(.5)', opacity: 0.95 }, 'ease-out'], [IMP + 700, { transform: 'scale(1.9)', opacity: 0 }]]);
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI * rand() * 1.1 + 0.1 - (rand() - 0.2) * 0.4, sp2 = 10 + rand() * 24, t = IMP + rand() * 60, fall = 8 + rand() * 18, sz = 2.4 + rand() * 2;
    const at = (f) => k.T(Math.cos(a) * sp2 * (1 - (1 - f) * (1 - f)), Math.sin(a) * sp2 * (1 - (1 - f) * (1 - f)) + fall * f * f);
    fx(k.pic('dot', T, sz, sz), [[t, { transform: `${at(0)} scale(.5)`, opacity: 0 }, 'ease-out'], [t + 60, { transform: `${at(0.15)} scale(1.1)`, opacity: 1 }, 'linear'], [t + 330, { transform: `${at(0.6)} scale(.9)`, opacity: 0.9 }, 'linear'], [t + 700 + rand() * 250, { transform: `${at(1)} scale(.3)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 4; i++) {
    const a = i * 90 + 20 + rand() * 50, len = 8 + rand() * 8, v = bolt(len, 2.5, 0, 0.8), c = [T[0] + Math.cos((a * Math.PI) / 180) * (len / 2 + 2), T[1] + Math.sin((a * Math.PI) / 180) * (len / 2 + 2)], t = IMP + 30 + i * 70;
    fx(k.pic(v.src, c, v.w, v.h), [[t - 1, { transform: `rotate(${a.toFixed(0)}deg)`, opacity: 0 }, 'linear'], [t, { transform: `rotate(${a.toFixed(0)}deg)`, opacity: 0.9 }, 'linear'], [t + 60, { transform: `rotate(${a.toFixed(0)}deg)`, opacity: 0 }]]);
  }

  // ── at the wick (alone): it catches. A flame stands up, flickers, gutters and dies in a wisp of smoke; the
  //    candle's glow swells with it. (Aimed elsewhere: a few embers stay where it landed, drifting up.)
  if (!aimed) {
    const wick = [T[0], T[1] + 0.5];
    fx(k.light('g-cand', [T[0], T[1] + 2], 56), [[IMP + 30, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [IMP + 260, { transform: 'scale(1)', opacity: 0.9 }, eio], [1900, { transform: 'scale(.95)', opacity: 0.8 }, eio], [2500, { transform: 'scale(.7)', opacity: 0 }]]);
    const fl = [[IMP + 40, { transform: 'scale(.3, .1) skewX(0deg)', opacity: 0 }, 'ease-out'], [IMP + 190, { transform: 'scale(1, 1) skewX(0deg)', opacity: 0.95 }, eio]];
    for (let t = IMP + 190, i = 1; (t += 80 + rand() * 50) < 2150; i++) { const s = i % 2 ? 1 : -1; fl.push([t, { transform: `scale(${(1 - s * 0.1 - rand() * 0.06).toFixed(2)}, ${(1 + s * 0.15 + rand() * 0.1 - (t > 1700 ? (t - 1700) / 1400 : 0)).toFixed(2)}) skewX(${(s * (2 + rand() * 5)).toFixed(1)}deg)`, opacity: +(0.8 + rand() * 0.2).toFixed(2) }, eio]); }
    fl.push([2400, { transform: 'scale(.4, .15) skewX(0deg)', opacity: 0 }]);
    fx(k.pic('flame', [wick[0], wick[1] + 1], 8.5, 15, { base: true }), fl);
    fx(k.pic('flame2', [wick[0] + 0.3, wick[1] + 1], 5, 9, { base: true }), fl.map(([t, f2, e]) => [t + 40, { ...f2, opacity: +(f2.opacity * 0.9).toFixed(2) }, e]));
    for (let i = 0; i < 3; i++) {
      const t = 2150 + i * 280, r = Math.round(rand() * 360);
      fx(k.pic('smoke', [wick[0], wick[1] - 8], 14, 14, { lit: false }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 350, { transform: `${k.T(-1.5, -9)} rotate(${r + 20}deg) scale(.9)`, opacity: 0.4 }], [t + 1100, { transform: `${k.T(-5, -34)} rotate(${r + 50}deg) scale(1.8)`, opacity: 0 }]]);
    }
  } else {
    for (let i = 0; i < 4; i++) {
      const t = IMP + 150 + i * 160 + rand() * 80, dx = (rand() - 0.5) * 14;
      fx(k.pic('dot', [T[0] + dx, T[1] + 2], 3, 3), [[t, { transform: 'translate(0px, 0px) scale(.5)', opacity: 0 }, 'ease-out'], [t + 120, { transform: `${k.T(dx * 0.1, -2)} scale(1)`, opacity: 1 }], [t + 1000, { transform: `${k.T(dx * 0.5, -22 - rand() * 10)} scale(.4)`, opacity: 0 }]]);
    }
  }
  // the warm light the spark throws on the hand and candle as it gathers and goes
  fx(k.light('g-spk', [(E0[0] + T[0]) / 2 > 60 ? 160 : 150, 105], 90), [[450, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [950, { transform: 'scale(1)', opacity: 0.4 }, eio], [IMP + 30, { transform: 'scale(1.3)', opacity: 0.75 }, 'ease-out'], [1500, { transform: 'scale(1.1)', opacity: 0.25 }, eio], [2200, { transform: 'scale(.8)', opacity: 0 }]]);
}
