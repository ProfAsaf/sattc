// Hour of Glory: the sun over the hill blazes and lets go its light; it runs through the host (every weapon
// point flares and streams gold behind it as it passes, the ranks' dust and embers lifting) and breaks over
// the creatures it is sent to (+3 power, Rush): a flash, rings, a glow that holds, chevrons rising.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support (it gives every creature +3/+0 and Rush; as
// suggested), element: light (the dawn gold streaming off the weapons, with embers riding it; I changed the
// suggestion from fire: it is the gold that acts). Not a figure: the boon goes from the sun (`emit`) to
// T = k.aim, or alone to the middle of the host.
//   0-1050    the gather. The sun swells and warms the whole sky, weapon points glint one after another, the
//             leader hunkers and braces, his banner lifts and strains; embers lift off the ranks.
//   1150      RELEASE (BEATS.release): the sun flashes and a ring runs out of it; an orb of light leaves it
//             along an arc to T with three waves of gold after it. As the wave passes each weapon point it
//             flares and streams a long ribbon of light back up the hill; the leader rises and throws his
//             banner out; the host's embers burst.
//   1550      IMPACT (BEATS.impact): the wave breaks over T: a flash, two rings, a glow that holds, chevrons
//             (+3) and motes rising.
//   1550-3600 the leader and banner settle with a bounce, the ribbons fade, the glow drains. BEATS.settle
//             3600; END 4200; at rest as drawn.
export const END = 4200;
export const BEATS = { release: 1150, impact: 1550, settle: 3600 };
export const STILLS = [450, 950, 1170, 1350, 1560, 1900, 2800, 3900];

const soft = (x, y) => Math.hypot(x - 0.5, y - 0.5) * 2;
export const textures = {
  mote: [16, 16, (x, y) => { const c = Math.max(0, 1 - soft(x, y)); return [255, 232, 160, Math.min(1, Math.pow(c, 0.8) * 1.5)]; }],
  hot: [24, 24, (x, y) => { const c = Math.max(0, 1 - soft(x, y)); return [255, 248, 220, Math.min(1, Math.pow(c, 0.8) * 1.6)]; }],
  ember: [16, 16, (x, y) => { const c = Math.max(0, 1 - soft(x, y)); return [255, 170 + 70 * c, 80 + 100 * c * c, Math.min(1, Math.pow(c, 0.7) * 1.5)]; }],
  star: [48, 48, (x, y) => {
    const dx = Math.abs(x - 0.5) * 2, dy = Math.abs(y - 0.5) * 2, c = Math.max(0, 1 - Math.hypot(dx, dy)), cr = Math.max(0, 1 - Math.min(dx * 9 + dy, dy * 9 + dx));
    const v = Math.min(1, c * c * 1.4 + cr * 0.9);
    return [255, 232 + 23 * v, 170 + 85 * v, v];
  }],
};

export function build(k) {
  const { act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const fx = (el, list) => { let last = -1; k.fx(el, list.slice().sort((a, b) => a[0] - b[0]).map((e) => { last = Math.max(last + 1, Math.min(e[0], k.END - 1)); return [last, ...e.slice(1)]; })); };
  const S = k.spec, E = S.emit, T = k.aim || S.alone, FEET = S.feet, POLE = [223, 70];
  const R0 = 1150, TL = 1550;
  k.css(`.g-gold { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,252,236,.95), rgba(255,226,150,.6) 28%, rgba(255,196,100,.18) 58%, rgba(255,170,70,0) 100%); }`);

  // a curve through [ms, value, ease?] points
  const track = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) {
      const f = (t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]), e = pts[i][2];
      return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * (e === 'in' ? Math.pow(f, 2.2) : e === 'out' ? 1 - Math.pow(1 - f, 2.2) : sm(f));
    }
    return pts.at(-1)[1];
  };
  const css = (ops) => ops.map((o) => (o[0] === 't' ? `translate(${(o[1] * u).toFixed(2)}px, ${(o[2] * u).toFixed(2)}px)` : o[0] === 's' ? `scale(${o[1].toFixed(4)}, ${o[2].toFixed(4)})` : o[0] === 'k' ? `skewY(${o[1].toFixed(2)}deg)` : `rotate(${o[1].toFixed(2)}deg)`)).join(' ');

  // ── the leader: hunkers and braces, rises as it is let go, settles with a bounce; his banner rides him and snaps
  const lDy = track([[0, 0], [500, 1.3], [950, 1.7], [1150, -2.6, 'in'], [1300, -1.2, 'out'], [1500, 0.6], [1800, -0.6], [2200, 0.2], [2700, 0]]);
  const lSy = track([[0, 1], [950, 0.975], [1150, 1.045, 'in'], [1400, 1.01], [1800, 0.995], [2400, 1]]);
  const bAng = track([[0, 0], [800, -1.5], [1050, -3.5], [1150, 6, 'in'], [1300, 2.5], [1600, -1.5], [2000, 1.2], [2500, -0.4], [3000, 0]]);
  const gust = track([[0, 0.3], [1100, 0.9], [1200, 1.6], [2200, 0.8], [3300, 0.2], [3900, 0]]);
  const fl = (t) => (2.6 * Math.sin(t / 120) + 1.4 * Math.sin(t / 51 + 1)) * gust(t) + (t > R0 ? 7 * Math.exp(-(t - R0) / 260) : 0);
  const keys = []; for (let t = 0; t < 1000; t += 80) keys.push(t); for (let t = 1000; t < 1600; t += 30) keys.push(t); for (let t = 1600; t <= 3900; t += 80) keys.push(t);
  const lOps = (P, t) => [['t', FEET[0] - P[0], FEET[1] - P[1] + lDy(t) * 0], ['t', 0, lDy(t)], ['s', 1, lSy(t)], ['t', P[0] - FEET[0], P[1] - FEET[1]]];
  void lOps;
  const leaderOps = (P, t) => [['t', 0, lDy(t)], ['t', FEET[0] - P[0], FEET[1] - P[1]], ['s', 1, lSy(t)], ['t', P[0] - FEET[0], P[1] - FEET[1]]];
  act(k.part('leader'), keys.map((t) => [t, { transform: css(leaderOps(FEET, t)) }, 'linear']));
  act(k.part('banner'), keys.map((t) => [t, { transform: css([...leaderOps(POLE, t), ['r', bAng(t)], ['k', fl(t)], ['s', 1 - 0.04 * gust(t) * (1 + Math.sin(t / 120 + 1)), 1]]) }, 'linear']));

  // ── the sun swells, warms the sky; flashes at the release; its ring runs out
  const [SX, SY] = E;
  fx(k.lightIn('g-gold', [SX, SY], 160, 130), [[0, { transform: 'scale(.7)', opacity: 0 }, 'ease-out'], [700, { transform: 'scale(1)', opacity: 0.6 }, eio], [1100, { transform: 'scale(1.25)', opacity: 0.95 }, eio], [1250, { transform: 'scale(1.5)', opacity: 1 }, eio],
    [2000, { transform: 'scale(1.3)', opacity: 0.6 }, eio], [3000, { transform: 'scale(1.1)', opacity: 0.2 }, eio], [3700, { transform: 'scale(.9)', opacity: 0 }]]);
  fx(k.lightIn('g-heal', [150, 120], 380, 240), [[300, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [R0, { transform: 'scale(1)', opacity: 0.45 }, eio], [1500, { transform: 'scale(1.05)', opacity: 0.55 }, eio], [2600, { transform: 'scale(1.1)', opacity: 0.2 }, eio], [3500, { transform: 'scale(1.1)', opacity: 0 }]]);
  fx(k.pic('hot', [SX, SY], 44, 44, {}), [[800, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [R0 - 20, { transform: 'scale(.9)', opacity: 0.8 }, 'ease-in'], [R0 + 60, { transform: 'scale(1.7)', opacity: 1 }, 'ease-out'], [R0 + 420, { transform: 'scale(2.4)', opacity: 0 }]]);
  const ring = k.svg('<ellipse cx="40" cy="40" rx="36" ry="36" fill="none" stroke="#ffe39a" stroke-width="5" opacity=".3"/><ellipse cx="40" cy="40" rx="36" ry="36" fill="none" stroke="#fff6d8" stroke-width="2"/>', 80, 80);
  fx(k.pic(ring, [SX, SY], 80, 80, {}), [[R0 - 20, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [R0 + 60, { transform: 'scale(.55)', opacity: 0.95 }, 'ease-out'], [R0 + 800, { transform: 'scale(2.6)', opacity: 0 }]]);
  // the sun's own rays kicked out: a ring of long thin spikes
  const spike = k.svg('<defs><linearGradient id="sg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff6d8"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></linearGradient></defs><path d="M1 40L3 0L5 40Z" fill="url(#sg)"/>', 6, 40);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * 360 + rand() * 12, l = 26 + rand() * 26, t = R0 + Math.round(rand() * 60);
    fx(k.pic(spike, [SX, SY], 3, l, { base: true }), [[t, { transform: `rotate(${a.toFixed(0)}deg) translateY(${(-9 * u).toFixed(1)}px) scaleY(.2)`, opacity: 0 }, 'ease-out'], [t + 120, { transform: `rotate(${a.toFixed(0)}deg) translateY(${(-9 * u).toFixed(1)}px) scaleY(1)`, opacity: 0.9 }, 'linear'], [t + 600, { transform: `rotate(${a.toFixed(0)}deg) translateY(${(-9 * u).toFixed(1)}px) scaleY(1.3)`, opacity: 0 }]]);
  }

  // ── the boon: from the sun at the release to T: an orb of light and three waves of gold after it
  const dist = Math.hypot(T[0] - E[0], T[1] - E[1]);
  const C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 18 - dist * 0.12];
  const bz = (f) => { const q = 1 - f; return [q * q * E[0] + 2 * q * f * C[0] + f * f * T[0], q * q * E[1] + 2 * q * f * C[1] + f * f * T[1]]; };
  const dirAt = (f) => { const a = bz(Math.max(0, f - 0.02)), b = bz(Math.min(1, f + 0.02)); return (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI; };
  const [EX, EY] = k.P(...E);
  const at = (f, sc, o, extra = '') => { const [x, y] = k.P(...bz(f)); return { transform: `translate(${(x - EX).toFixed(1)}px, ${(y - EY).toFixed(1)}px) rotate(${dirAt(f).toFixed(1)}deg) scale(${sc})${extra}`, opacity: o }; };
  const orbList = []; const N = 9;
  for (let i = 0; i <= N; i++) { const f = i / N; orbList.push([R0 + 30 + f * (TL - R0 - 30), at(f, 0.7 + 0.6 * Math.sin(Math.PI * f), i === 0 ? 0 : i === N ? 0 : 1), 'linear']); }
  fx(k.pic('hot', E, 22, 22, {}), orbList);
  fx(k.light('g-heal', E, 52), orbList.map(([t, v]) => [t, { transform: v.transform, opacity: v.opacity * 0.9 }, 'linear']));
  const wave = k.svg('<defs><linearGradient id="wg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd27a" stop-opacity=".1"/><stop offset="1" stop-color="#fff6d8"/></linearGradient></defs><path d="M8 3Q26 15 8 27" fill="none" stroke="#ffd27a" stroke-opacity=".35" stroke-width="7" stroke-linecap="round"/><path d="M8 3Q26 15 8 27" fill="none" stroke="url(#wg)" stroke-width="3" stroke-linecap="round"/>', 30, 30);
  for (let i = 0; i < 3; i++) {
    const t0 = R0 + i * 70, span = TL - R0 - i * 40, l = [];
    for (let j = 0; j <= 6; j++) { const f = j / 6; l.push([t0 + f * span, at(Math.min(1, f), 0.6 + 1.0 * f + 0.2 * i, f === 0 ? 0 : f > 0.85 ? 0.85 * (1 - (f - 0.85) / 0.15) : 0.9 - 0.15 * i), 'linear']); }
    fx(k.pic(wave, E, 20 + i * 5, 20 + i * 5, {}), l);
  }
  // motes streaming along it
  for (let i = 0; i < 12; i++) {
    const f0 = rand() * 0.3, t0 = R0 + 40 + Math.round(rand() * 380), sz = 2 + rand() * 2.4, side = (rand() - 0.5) * 16, l = [];
    for (let j = 0; j <= 4; j++) { const f = f0 + (1 - f0) * (j / 4), [x, y] = bz(f), [bx, by] = k.P(x, y); l.push([t0 + Math.round(j * 130), { transform: `translate(${(bx - EX).toFixed(1)}px, ${(by - EY + side * Math.sin(Math.PI * f) * u).toFixed(1)}px) scale(${j === 0 || j === 4 ? 0.4 : 1})`, opacity: j === 0 || j === 4 ? 0 : 0.95 }, 'linear']); }
    fx(k.pic(i % 3 ? 'mote' : 'ember', E, sz, sz, {}), l);
  }

  // ── the weapon points: glint in turn as it gathers; flare as the wave passes each; each streams a ribbon of light back up the hill
  const tips = S.tips, ux = -0.95, uy = -0.32, ang = Math.round((Math.atan2(ux, -uy) * 180) / Math.PI);
  const along = (p) => { const dx = T[0] - E[0], dy = T[1] - E[1], l2 = dx * dx + dy * dy; return Math.min(1, Math.max(0, ((p[0] - E[0]) * dx + (p[1] - E[1]) * dy) / l2)); };
  const streak = k.svg('<defs><linearGradient id="tg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff6d8"/><stop offset=".5" stop-color="#ffd27a" stop-opacity=".7"/><stop offset="1" stop-color="#ffb04a" stop-opacity="0"/></linearGradient></defs><path d="M0.4 40L2.5 0L4.6 40Z" fill="url(#tg)"/>', 5, 40);
  tips.forEach((p, i) => {
    const tg = 250 + Math.round(rand() * 800), tp = R0 + 40 + along(p) * (TL - R0 - 40) + Math.round(rand() * 40), s = 8 + rand() * 4;
    // gathering glint
    fx(k.pic('star', p, s, s, {}), [[tg, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [tg + 140, { transform: 'scale(.9) rotate(20deg)', opacity: 0.95 }, eio], [tg + 460, { transform: 'scale(.3) rotate(45deg)', opacity: 0 }]]);
    // the flare as the wave passes, and the ribbon it throws back
    fx(k.pic('star', p, s * 2, s * 2, {}), [[tp, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [tp + 110, { transform: 'scale(1.1) rotate(25deg)', opacity: 1 }, eio], [tp + 640, { transform: 'scale(.3) rotate(60deg)', opacity: 0 }]]);
    const L = 40 + rand() * 24;
    fx(k.pic(streak, p, 3.2, L, { base: true }), [[tp, { transform: `rotate(${ang}deg) scaleY(.1)`, opacity: 0 }, 'ease-out'], [tp + 160, { transform: `rotate(${ang}deg) scaleY(1)`, opacity: 0.95 }, 'linear'], [tp + 900, { transform: `rotate(${ang}deg) scaleY(1.25)`, opacity: 0 }]]);
    // sparks flung off it
    for (let j = 0; j < 1; j++) {
      const a = -Math.PI / 2 + (rand() - 0.5) * 2.6, v = 10 + rand() * 18, t = tp + Math.round(rand() * 60);
      fx(k.pic(j ? 'ember' : 'mote', p, 3, 3, {}), [[t, { transform: `${k.T(0, 0)} scale(.6)`, opacity: 0 }, 'ease-out'], [t + 100, { transform: `${k.T(Math.cos(a) * v * 0.6, Math.sin(a) * v * 0.6)} scale(1)`, opacity: 1 }, 'ease-out'], [t + 600, { transform: `${k.T(Math.cos(a) * v, Math.sin(a) * v + 10)} scale(.3)`, opacity: 0 }]]);
    }
  });
  // embers lifting off the host, more and higher as it passes
  for (let i = 0; i < 14; i++) {
    const p = tips[Math.floor(rand() * tips.length)], t0 = 300 + Math.round(rand() * 2600), sz = 2 + rand() * 2.4, rise = 22 + rand() * 40;
    fx(k.pic('ember', [p[0] + (rand() - 0.5) * 16, p[1] + 14 + rand() * 30], sz, sz, {}), [[t0, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 220, { transform: `${k.T(2, -rise * 0.25)} scale(1)`, opacity: 0.95 }, 'linear'], [t0 + 1100, { transform: `${k.T(10 + rand() * 8, -rise)} scale(.3)`, opacity: 0 }]]);
  }
  // the leader's own point, hot as he lifts his banner
  fx(k.light('g-gold', [260, 111], 30), [[R0 - 300, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [R0 + 60, { transform: 'scale(1.4)', opacity: 0.95 }, eio], [2000, { transform: 'scale(1)', opacity: 0.45 }, eio], [3000, { transform: 'scale(.7)', opacity: 0 }]]);

  // ── at T: a flash and rings, a glow that holds, +3 chevrons rising, motes
  fx(k.light('g-heal', T, 80), [[TL - 60, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [TL + 60, { transform: 'scale(1.3)', opacity: 1 }, 'linear'], [TL + 400, { transform: 'scale(1)', opacity: 0.85 }, eio], [2500, { transform: 'scale(1.1)', opacity: 0.6 }, eio], [3300, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.pic('hot', T, 34, 34, {}), [[TL - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [TL + 40, { transform: 'scale(1.1)', opacity: 1 }, 'linear'], [TL + 320, { transform: 'scale(1.9)', opacity: 0 }]]);
  [[TL - 20, 1], [TL + 220, 0.6]].forEach(([t, o]) => fx(k.pic(ring, T, 70, 70, {}), [[t, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [t + 90, { transform: 'scale(.4)', opacity: 0.95 * o }, 'ease-out'], [t + 650, { transform: 'scale(1.4)', opacity: 0 }]]));
  const chev = k.svg('<path d="M3 12L10 4L17 12" fill="none" stroke="#ffe39a" stroke-width="5" opacity=".35" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 12L10 4L17 12M3 21L10 13L17 21" fill="none" stroke="#fff6d8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>', 20, 26);
  for (let i = 0; i < 5; i++) {
    const t0 = TL + 80 + i * 120, x = T[0] + (i - 2) * 8 + (rand() - 0.5) * 3, y = T[1] + 8 - (i % 2) * 5, s = 0.9 + (i % 2) * 0.3;
    fx(k.pic(chev, [x, y], 9 * s, 12 * s, {}), [[t0, { transform: `${k.T(0, 6)} scale(.6)`, opacity: 0 }, 'ease-out'], [t0 + 200, { transform: `${k.T(0, -4)} scale(1)`, opacity: 1 }, 'linear'], [t0 + 700, { transform: `${k.T(0, -20)} scale(1)`, opacity: 0.8 }, 'linear'], [t0 + 1100, { transform: `${k.T(0, -34)} scale(.9)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 10; i++) {
    const a = rand() * Math.PI * 2, r = 4 + rand() * 20, t0 = TL + rand() * 700, sz = 2 + rand() * 2.4, rise = 14 + rand() * 26, life = 1000 + rand() * 700;
    const x = T[0] + Math.cos(a) * r, y = T[1] + Math.sin(a) * r * 0.7;
    fx(k.pic(i % 3 ? 'mote' : 'star', [x, y], i % 3 ? sz : sz * 3, i % 3 ? sz : sz * 3, {}), [[t0, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 220, { transform: `${k.T(0, -rise * 0.2)} scale(1)`, opacity: 0.95 }, 'linear'], [t0 + life * 0.7, { transform: `${k.T((rand() - 0.5) * 8, -rise * 0.8)} scale(.8)`, opacity: 0.8 }, 'linear'], [t0 + life, { transform: `${k.T((rand() - 0.5) * 10, -rise)} scale(.5)`, opacity: 0 }]]);
  }
}
