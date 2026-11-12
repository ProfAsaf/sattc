// War Drummer: she beats the drum three times, then a great fourth stroke with both sticks, and the beat goes
// out as waves of gold to her ally, who is lifted by it.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support (her other creatures have +1/+0 attacking),
// element: light (the dawn gold of the beat).
//   0-440     the gather. She draws a breath and rises on her toes; the stick at the drum lifts; the raised arm
//             cocks back; the column marching below picks up the pace; the banners begin to stir.
//   450 760 1030   three beats: the stick falls (accelerating) and rebounds high, the drum squashes and jolts, its
//             skin flashes, a flat ring runs out over it and sparks jump off; the rings of sound in the air
//             flash outward; the column hops, the banners snap; each beat harder and quicker than the last.
//   1000-1250 the finale winds up: the stick at the drum goes high, the raised arm swings right round overhead.
//   1250      RELEASE (BEATS.release): both sticks strike together; the drum leaps, the skin blazes, and the beat goes
//             out from its head to T: three waves of gold, one after another, round an orb of light.
//   1650      IMPACT (BEATS.impact): the waves break over T: a flash and rings, a glow that holds, rising chevrons
//             (+1 power) and motes; the column and banners surge in answer and the sun behind them flares.
//   1650-3700 she lowers her sticks, the column and banners settle, the glow and chevrons drain. (BEATS.settle 3700);
//             END 4200, at rest as drawn.
//
// The contract (bakeoff/recipe.md): the boon goes to T = k.aim, or alone to the column on the left; every point of
// its path is worked out from the drum's head (`emit`) and T, on the overlay since T may be on another card.
export const END = 4200;
export const BEATS = { release: 1250, impact: 1650, settle: 3700 };
export const STILLS = [350, 480, 780, 1060, 1260, 1650, 2300, 3900];

const soft = (x, y) => Math.hypot(x - 0.5, y - 0.5) * 2;
export const textures = {
  mote: [16, 16, (x, y) => { const c = Math.max(0, 1 - soft(x, y)); return [255, 232, 160, Math.min(1, Math.pow(c, 0.8) * 1.5)]; }],
  hot: [16, 16, (x, y) => { const c = Math.max(0, 1 - soft(x, y)); return [255, 248, 220, Math.min(1, Math.pow(c, 0.8) * 1.6)]; }],
  glint: [24, 24, (x, y) => { const c = Math.max(0, 1 - soft(x, y)), a = Math.max(0, 1 - Math.abs(x - 0.5) * 9) * Math.max(0, 1 - Math.abs(y - 0.5) * 2) + Math.max(0, 1 - Math.abs(y - 0.5) * 9) * Math.max(0, 1 - Math.abs(x - 0.5) * 2); return [255, 246, 210, Math.min(1, c * c * 1.4 + a * 0.9)]; }],
};

export function build(k) {
  const { act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const fx = (el, list) => { let last = -1; k.fx(el, list.slice().sort((a, b) => a[0] - b[0]).map((e) => { last = Math.max(last + 1, Math.min(e[0], k.END - 1)); return [last, ...e.slice(1)]; })); };
  k.css(`.fx-gold { filter: brightness(2.3) sepia(.6) saturate(2.2); }`);
  const sp = k.spec, [SKX, SKY] = sp.skin, SB = sp.shoulderB, SF = sp.shoulderF, TF = sp.tipF;
  const rad = (d) => (d * Math.PI) / 180;
  // a curve through [ms, value, ease?] points: the ease names how the way TO that point goes ('in': accelerating, 'out': decelerating)
  const track = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) {
      const f = (t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]), e = pts[i][2];
      return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * (e === 'in' ? Math.pow(f, 2.2) : e === 'out' ? 1 - Math.pow(1 - f, 2.2) : sm(f));
    }
    return pts.at(-1)[1];
  };
  const keys = []; for (let t = 0; t < 400; t += 40) keys.push(t); for (let t = 400; t < 1360; t += 20) keys.push(t); for (let t = 1360; t <= 3800; t += 40) keys.push(t);
  const HITS = [[450, 0.55], [760, 0.65], [1030, 0.8], [1250, 1]];
  const env = (t, h) => (t < h ? 0 : t < h + 30 ? (t - h) / 30 : Math.pow(Math.max(0, 1 - (t - h - 30) / 260), 2));
  const hitSum = (t, lag = 0) => HITS.reduce((a, [h, s]) => a + s * env(t, h + lag), 0);

  // ── her: rises on her toes as she gathers, drops a hair on each beat (the body, the tabard and both arms ride it)
  const BY = track([[0, 0], [320, -1.8], [620, -0.4], [900, -0.9], [1150, -2.4], [1250, 0.4], [1700, -0.3], [2400, 0]]);
  const by = (t) => BY(t) + 0.8 * hitSum(t);
  const body = k.part('body'), tabard = k.part('tabard');
  act(body, keys.map((t) => [t, { transform: `${k.T(0, by(t))}` }, 'linear']));
  act(tabard, keys.map((t) => [t, { transform: `${k.T(0, by(t))}` }, 'linear']));
  // ── the stick at the drum: lifts, falls and rebounds on each beat, high before the finale
  const RF = track([[0, 0], [300, 36], [440, -3, 'in'], [520, 26, 'out'], [750, -3, 'in'], [830, 30, 'out'], [1020, -3, 'in'], [1090, 46, 'out'], [1240, -5, 'in'], [1340, 16, 'out'], [1800, 5], [2500, 0]]);
  // ── the raised arm: cocks back, then swings right round overhead to strike with the other on the finale
  const RB = track([[0, 0], [300, 6], [950, 13], [1000, 15], [1245, -156, 'in'], [1340, -146, 'out'], [1800, -66], [2500, -10], [3200, 0]]);
  const sB = (t) => 1 - 0.09 * Math.min(1, Math.max(0, (-RB(t) - 100) / 56));
  const armF = k.part('armF'), armB = k.part('armB');
  act(armF, keys.map((t) => [t, { transform: `${k.T(0, by(t))} rotate(${RF(t).toFixed(2)}deg)` }, 'linear']));
  act(armB, keys.map((t) => [t, { transform: `${k.T(0, by(t))} rotate(${RB(t).toFixed(2)}deg) scale(${sB(t).toFixed(3)})` }, 'linear']));
  // (where a point of an arm is: its turn about its shoulder, riding her bob)
  const armPt = (S, p, t, r, sc = 1) => { const a = rad(r), x = (p[0] - S[0]) * sc, y = (p[1] - S[1]) * sc; return [S[0] + x * Math.cos(a) - y * Math.sin(a), S[1] + x * Math.sin(a) + y * Math.cos(a) + by(t)]; };

  // ── the drum: squashes and jolts on each beat (the finale leaps); its skin rides it and flashes
  const dTf = (t) => { const h = hitSum(t), big = env(t, 1250); return `${k.T(0, 0.45 * h - 1.4 * big)} scale(${(1 + 0.012 * h).toFixed(4)}, ${(1 - 0.034 * h).toFixed(4)})`; };
  act(k.part('drum'), keys.map((t) => [t, { transform: dTf(t) }, 'linear']));
  act(k.part('skin'), keys.map((t) => [t, { transform: dTf(t) }, 'linear']));
  act(k.copy('skin', 'fx-gold'), keys.map((t) => [t, { transform: dTf(t), opacity: +Math.min(0.95, 0.75 * hitSum(t)).toFixed(2) }, 'linear']));
  // the rings of sound in the air: pushed out and dimmed at each beat, with a bright copy running outward after it
  const beat = k.part('beat');
  act(beat, keys.map((t) => { const m = Math.max(...HITS.map(([h, s]) => s * env(t, h))); return [t, { transform: `scale(${(1 + 0.16 * m).toFixed(3)})`, opacity: +(1 - 0.75 * m).toFixed(2) }, 'linear']; }));
  HITS.forEach(([h, s]) => fx(k.copy('beat', 'fx-gold'), [[h + 20, { transform: 'scale(1)', opacity: 0 }, 'ease-out'], [h + 80, { transform: 'scale(1.06)', opacity: 0.95 * s }, 'linear'], [h + 520, { transform: `scale(${(1.4 + 0.35 * s).toFixed(2)})`, opacity: 0 }]]));

  // ── the column: marches in time, hops on each beat, and surges when the boon breaks
  const T = k.aim || sp.alone, R0 = 1250, TL = 1650;
  const march = (t) => (t > 150 && t < 3300 ? 0.5 * Math.abs(Math.sin((Math.PI * t) / 330)) * Math.min(1, (t - 150) / 300) * Math.min(1, (3300 - t) / 400) : 0);
  act(k.part('column'), keys.map((t) => [t, { transform: `${k.T(0, -(march(t) + 1.3 * hitSum(t, 60) + 2.2 * env(t, TL)))}` }, 'linear']));
  // ── the banners: stir, snap on the beats, stream hard when the boon breaks, calm
  const gust = track([[0, 0], [400, 0.3], [1250, 0.7], [1650, 1], [2500, 0.4], [3300, 0]]);
  const flagTf = (t) => { const g = gust(t), a = (3.4 * Math.sin(t / 140) + 2 * Math.sin(t / 61 + 1)) * g + 5 * hitSum(t); return `skewY(${a.toFixed(2)}deg) scale(${(1 - 0.03 * g * (1 + Math.sin(t / 140 + 1)) - 0.015 * hitSum(t)).toFixed(3)}, 1)`; };
  act(k.part('flags'), keys.map((t) => [t, { transform: flagTf(t) }, 'linear']));
  act(k.part('mark'), keys.map((t) => [t, { transform: flagTf(t) }, 'linear']));
  // the sun behind her flares as the boon lands
  fx(k.lightIn('g-heal', [226, 136], 130, 100), [[R0, { transform: 'scale(.8)', opacity: 0 }, 'ease-out'], [TL, { transform: 'scale(1.1)', opacity: 0.55 }, eio], [2300, { transform: 'scale(1.3)', opacity: 0.3 }, eio], [3300, { transform: 'scale(1)', opacity: 0 }]]);

  // ── on each beat: a flat ring runs out over the skin, a flash, sparks jump off
  const ripple = k.svg('<ellipse cx="40" cy="10" rx="36" ry="8" fill="none" stroke="#ffe39a" stroke-width="4" opacity=".3"/><ellipse cx="40" cy="10" rx="36" ry="8" fill="none" stroke="#fff6d8" stroke-width="1.6"/>', 80, 20);
  HITS.forEach(([h, s], hi) => {
    const big = hi === 3;
    fx(k.lightIn('g-heal', [SKX, SKY], 82, 40), [[h - 10, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [h + 30, { transform: `scale(${(0.9 + 0.4 * s).toFixed(2)})`, opacity: Math.min(1, 0.5 + 0.5 * s) }, 'linear'], [h + (big ? 700 : 340), { transform: 'scale(1.2)', opacity: 0 }]]);
    fx(k.pic(ripple, [SKX, SKY + 1], 70, 17, { lit: true }), [[h, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [h + 50, { transform: 'scale(.45)', opacity: 0.95 }, 'linear'], [h + (big ? 700 : 420), { transform: `scale(${big ? 2.4 : 1.5})`, opacity: 0 }]]);
    for (let i = 0; i < (big ? 9 : 5); i++) {
      const a = -Math.PI / 2 + (rand() - 0.5) * 2.4, v = (big ? 24 : 15) + rand() * 18, x0 = SKX + (rand() - 0.5) * 36, t0 = h + rand() * 30;
      fx(k.pic(i % 2 ? 'hot' : 'mote', [x0, SKY], 3 + rand() * 2, 3 + rand() * 2, {}), [[t0, { transform: `${k.T(0, 0)} scale(.5)`, opacity: 0 }, 'ease-out'], [t0 + 120, { transform: `${k.T(Math.cos(a) * v * 0.6, Math.sin(a) * v * 0.7)} scale(1)`, opacity: 1 }, 'linear'], [t0 + 520, { transform: `${k.T(Math.cos(a) * v, Math.sin(a) * v * 0.6 + 10)} scale(.4)`, opacity: 0 }]]);
    }
  });
  // glints on the stick-heads at the strikes
  for (const [h] of HITS) {
    const l = []; for (const t of keys) { if (t < h - 60 || t > h + 200) continue; const p = armPt(SF, TF, t, RF(t)); l.push([t, { transform: `${k.T(p[0] - TF[0], p[1] - TF[1])} rotate(${(t - h) / 3}deg) scale(${(0.4 + 1.1 * env(t, h)).toFixed(2)})`, opacity: +Math.min(1, env(t, h) * 1.4).toFixed(2) }, 'linear']); }
    fx(k.pic('glint', TF, 12, 12, {}), l);
  }

  // ── the boon: from the drum's head at the finale to T: an orb of light and three waves of gold after it
  const E = sp.emit, dist = Math.hypot(T[0] - E[0], T[1] - E[1]);
  const C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 14 - dist * 0.1];
  const bz = (f) => { const q = 1 - f; return [q * q * E[0] + 2 * q * f * C[0] + f * f * T[0], q * q * E[1] + 2 * q * f * C[1] + f * f * T[1]]; };
  const dirAt = (f) => { const a = bz(Math.max(0, f - 0.02)), b = bz(Math.min(1, f + 0.02)); return (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI; };
  const [EX, EY] = k.P(...E);
  const at = (f, sc, o, extra = '') => { const [x, y] = k.P(...bz(f)); return { transform: `translate(${(x - EX).toFixed(1)}px, ${(y - EY).toFixed(1)}px) rotate(${dirAt(f).toFixed(1)}deg) scale(${sc})${extra}`, opacity: o }; };
  const orbList = []; const N = 8;
  for (let i = 0; i <= N; i++) { const f = i / N; orbList.push([R0 + 30 + f * (TL - R0 - 30), at(f, 0.6 + 0.5 * Math.sin(Math.PI * f), i === 0 ? 0 : i === N ? 0 : 1), 'linear']); }
  fx(k.pic('hot', E, 20, 20, {}), orbList);
  fx(k.light('g-heal', E, 46), orbList.map(([t, v]) => [t, { transform: v.transform, opacity: v.opacity * 0.85 }, 'linear']));
  const wave = k.svg('<defs><linearGradient id="wg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd27a" stop-opacity=".1"/><stop offset="1" stop-color="#fff6d8"/></linearGradient></defs><path d="M8 3Q26 15 8 27" fill="none" stroke="#ffd98a" stroke-width="7" opacity=".3" stroke-linecap="round"/><path d="M8 3Q26 15 8 27" fill="none" stroke="url(#wg)" stroke-width="2.6" stroke-linecap="round"/>', 30, 30);
  for (let i = 0; i < 3; i++) {
    const t0 = R0 + i * 70, span = TL - R0 - i * 40;
    const l = []; for (let j = 0; j <= 6; j++) { const f = j / 6; l.push([t0 + f * span, at(Math.min(1, f), 0.5 + 0.9 * f + 0.2 * i, f === 0 ? 0 : f > 0.85 ? 0.85 * (1 - (f - 0.85) / 0.15) : 0.9 - 0.15 * i), 'linear']); }
    fx(k.pic(wave, E, 18 + i * 5, 18 + i * 5, {}), l);
  }
  // at T: a flash and rings, a glow that holds, chevrons rising, motes
  fx(k.light('g-heal', T, 72), [[TL - 60, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [TL + 60, { transform: 'scale(1.3)', opacity: 1 }, 'linear'], [TL + 400, { transform: 'scale(1)', opacity: 0.85 }, eio], [2400, { transform: 'scale(1.1)', opacity: 0.6 }, eio], [3200, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.pic('hot', T, 30, 30, {}), [[TL - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [TL + 40, { transform: 'scale(1.1)', opacity: 1 }, 'linear'], [TL + 300, { transform: 'scale(1.9)', opacity: 0 }]]);
  const ring = k.svg('<ellipse cx="40" cy="40" rx="36" ry="36" fill="none" stroke="#ffe39a" stroke-width="5" opacity=".28"/><ellipse cx="40" cy="40" rx="36" ry="36" fill="none" stroke="#fff6d8" stroke-width="2"/>', 80, 80);
  [[TL - 20, 1], [TL + 220, 0.6]].forEach(([t, o]) => fx(k.pic(ring, T, 70, 70, {}), [[t, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [t + 90, { transform: 'scale(.4)', opacity: 0.95 * o }, 'ease-out'], [t + 650, { transform: 'scale(1.35)', opacity: 0 }]]));
  const chev = k.svg('<path d="M3 12L10 4L17 12" fill="none" stroke="#ffe39a" stroke-width="5" opacity=".35" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 12L10 4L17 12M3 21L10 13L17 21" fill="none" stroke="#fff6d8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>', 20, 26);
  for (let i = 0; i < 5; i++) {
    const t0 = TL + 80 + i * 130, x = T[0] + (i - 2) * 9 + (rand() - 0.5) * 3, y = T[1] + 8 - (i % 2) * 5, s = 0.8 + (i % 2) * 0.25;
    fx(k.pic(chev, [x, y], 9 * s, 12 * s, {}), [[t0, { transform: `${k.T(0, 6)} scale(.6)`, opacity: 0 }, 'ease-out'], [t0 + 200, { transform: `${k.T(0, -4)} scale(1)`, opacity: 1 }, 'linear'], [t0 + 700, { transform: `${k.T(0, -20)} scale(1)`, opacity: 0.8 }, 'linear'], [t0 + 1100, { transform: `${k.T(0, -30)} scale(.9)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 14; i++) {
    const a = rand() * Math.PI * 2, r = 4 + rand() * 18, t0 = TL + rand() * 700, sz = 2 + rand() * 2.4, rise = 14 + rand() * 26, life = 1000 + rand() * 700;
    const x = T[0] + Math.cos(a) * r, y = T[1] + Math.sin(a) * r * 0.7;
    fx(k.pic(i % 3 ? 'mote' : 'glint', [x, y], i % 3 ? sz : sz * 3, i % 3 ? sz : sz * 3, {}), [[t0, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 220, { transform: `${k.T(0, -rise * 0.2)} scale(1)`, opacity: 0.95 }, 'linear'], [t0 + life * 0.7, { transform: `${k.T((rand() - 0.5) * 6, -rise * 0.75)} scale(.9)`, opacity: 0.7 }, 'linear'], [t0 + life, { transform: `${k.T(0, -rise)} scale(.5)`, opacity: 0 }]]);
  }
}
