// The Eye of the Storm: the walls of the hurricane wind faster round the calm, lightning breaks in them, and
// the gold of the eye surges out over everything.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: aura (a Field: the place itself acts; it isn't aimed),
// element: lightning (as suggested: the flashes in the walls, and the gold they light).
//   0-900     the swell. The walls begin to turn about the eye, the inner ones faster than the outer (the drawn
//             spiral streaks turn with them); the gulls leave their places and begin to wheel; streaks of rain
//             start to run out through the walls; the eye's light gathers. First flash in the upper-left wall.
//   900-1700  it builds. The walls turn faster and swell outward a hair (the eye opens wider); flashes break in the
//             lower right and the upper right, each lighting the cloud round it blue-white; gold glints begin to
//             wake on the inner rim; the gulls circle at speed.
//   1700      PEAK (BEATS.impact): every bolt strikes at once, a cold flash over the whole picture, and at the same
//             instant the gold of the eye surges: a ring of light runs out through the walls to and past the frame
//             (a second, smaller one follows), the inner rims flare, the gulls are on the far side of their circle.
//   1700-3500 the storm eases: the walls wind back to where they were, the gold drains, the rain thins, a last
//             flash in the lower left; the gulls come round to their places. (BEATS.settle 3500); END 4200, at rest.
//
// The contract (bakeoff/recipe.md): an aura, so it isn't aimed: its move spreads over its picture and past its
// frame (the rings of light and the streaks leave it on every side). `hit` is the middle of the eye.
export const END = 4200;
export const BEATS = { release: 900, impact: 1700, settle: 3500 };
export const STILLS = [350, 760, 1200, 1600, 1760, 2100, 2800, 3900];

const soft = (x, y) => Math.hypot(x - 0.5, y - 0.5) * 2;
export const textures = {
  mote: [16, 16, (x, y) => { const c = Math.max(0, 1 - soft(x, y)); return [255, 236, 170, Math.min(1, Math.pow(c, 0.8) * 1.5)]; }],
  glint: [24, 24, (x, y) => { const c = Math.max(0, 1 - soft(x, y)), a = Math.max(0, 1 - Math.abs(x - 0.5) * 9) * Math.max(0, 1 - Math.abs(y - 0.5) * 2) + Math.max(0, 1 - Math.abs(y - 0.5) * 9) * Math.max(0, 1 - Math.abs(x - 0.5) * 2); return [255, 246, 210, Math.min(1, c * c * 1.4 + a * 0.9)]; }],
  // a streak of rain / wind, long on x, fading at both ends
  streak: [48, 6, (x, y) => { const a = Math.max(0, 1 - Math.abs(y - 0.5) * 2.2) * Math.sin(Math.PI * Math.pow(x, 0.8)); return [226, 240, 248, Math.max(0, a) * 0.9]; }],
};

export function build(k) {
  const { act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  // (the kit wants a thing's moments in strict order: nudge equal ones apart)
  const fx = (el, list) => { let last = -1; k.fx(el, list.slice().sort((a, b) => a[0] - b[0]).map((e) => { last = Math.max(last + 1, Math.min(e[0], k.END - 1)); return [last, ...e.slice(1)]; })); };
  k.css(`.g-cool { border-radius: 50%; background: radial-gradient(circle, rgba(244,250,255,.95), rgba(170,214,255,.55) 32%, rgba(110,170,255,.18) 60%, rgba(100,160,255,0) 72%); }
.fx-bolt { filter: brightness(2.6) saturate(.6); }
.fx-gold { filter: brightness(2.1) sepia(.6) saturate(2); }`);
  const sp = k.spec, [EX, EY] = sp.eye, SQ = 0.78;
  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  const keys = []; for (let t = 0; t < 3500; t += 50) keys.push(t); keys.push(3500);
  // a turn about the eye in the picture's own tilt: points go round the ellipse, not a circle
  const turn = (deg, sc) => `scale(${sc.toFixed(4)}) scaleY(${SQ}) rotate(${deg.toFixed(2)}deg) scaleY(${(1 / SQ).toFixed(4)})`;

  // ── the walls: they wind round faster, inner first, swell a hair at the peak, then wind back; two (the inner,
  //    gold-lit ones) get a lit copy that flares at the flashes and the surge
  const ANG = [30, 23, 17, 12, 8, 5], SW = [0.075, 0.06, 0.045, 0.035, 0.025, 0.015];
  const wind = curve([[0, 0], [500, 0.12], [1100, 0.5], [1700, 1], [2400, 0.62], [3000, 0.18], [3500, 0]]);
  const swell = curve([[0, 0], [900, 0.15], [1700, 1], [2500, 0.3], [3400, 0]]);
  const poseOf = (j, t) => turn(ANG[j] * wind(t - j * 40 > 0 ? t - j * 40 : 0) + 1.1 * Math.sin(t / 210 + j) * Math.min(1, t / 600) * Math.max(0, 1 - Math.max(0, t - 2200) / 1200), 1 + SW[j] * swell(t));
  const walls = [0, 1, 2, 3, 4, 5].map((j) => k.part(`wall${j}`));
  walls.forEach((w, j) => act(w, keys.map((t) => [t, { transform: poseOf(j, t) }, 'linear'])));
  const flare = (t) => { let o = 0; for (const [c, a, w] of [[640, 0.25, 260], [1020, 0.3, 280], [1380, 0.35, 280], [1700, 1, 520], [2050, 0.45, 420], [2200, 0.3, 260]]) o = Math.max(o, a * Math.max(0, 1 - Math.abs(t - c) / w)); return o; };
  [0, 1].forEach((j) => act(k.copy(`wall${j}`, 'fx-gold'), keys.map((t) => [t, { transform: poseOf(j, t), opacity: +(flare(t) * (j ? 0.55 : 0.8)).toFixed(2) }, 'linear'])));
  // the spiral streaks through the walls: turns the other way a little, faster, with a bright copy
  const spiral = k.part('spiral');
  const spin = curve([[0, 0], [500, 0.1], [1700, 1], [2500, 0.55], [3500, 0]]);
  const spPose = (t) => turn(-46 * spin(t), 1 + 0.03 * swell(t));
  act(spiral, keys.map((t) => [t, { transform: spPose(t) }, 'linear']));
  act(k.copy('spiral', 'fx-bolt'), keys.map((t) => [t, { transform: spPose(t), opacity: +(0.45 * spin(t) + 0.4 * flare(t)).toFixed(2) }, 'linear']));

  // ── lightning: the drawn bolts flicker, and flash with the strikes; more bolts break in the walls
  const STR = [640, 1020, 1380, 1700, 2200];
  const bolts = k.part('bolts');
  const lerp = (shape, dt) => { if (dt <= shape[0][0] || dt >= shape.at(-1)[0]) return dt <= shape[0][0] ? shape[0][1] : shape.at(-1)[1]; for (let i = 1; i < shape.length; i++) if (dt <= shape[i][0]) return shape[i - 1][1] + (shape[i][1] - shape[i - 1][1]) * ((dt - shape[i - 1][0]) / (shape[i][0] - shape[i - 1][0])); return 0; };
  const fk = []; for (let t = 0; t <= 2800; t += 25) fk.push(t);
  const DIP = [[-80, 1], [-60, 0.35], [0, 1], [110, 0.55], [190, 1]];
  act(bolts, fk.map((t) => [t, { opacity: +Math.min(1, ...STR.map((s) => lerp(DIP, t - s))).toFixed(2) }, 'linear']));
  const FLASH = [[-100, 0], [0, 1], [110, 0.25], [190, 0.8], [420, 0]];
  act(k.copy('bolts', 'fx-bolt'), fk.map((t) => [t, { opacity: +Math.max(0, ...STR.map((s) => lerp(FLASH, t - s))).toFixed(2) }, 'linear']));
  // (a bolt of my own: a jagged line from a to b, in a box of its own)
  const jag = (a, b, n, seed) => {
    const pad = 8, x0 = Math.min(a[0], b[0]) - pad, y0 = Math.min(a[1], b[1]) - pad, w = Math.abs(a[0] - b[0]) + 2 * pad, h = Math.abs(a[1] - b[1]) + 2 * pad;
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, pts = [];
    for (let i = 0; i <= n; i++) { const f = i / n, j = i === 0 || i === n ? 0 : (((Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453) % 1) + 1) % 1 - 0.5; pts.push([a[0] + dx * f + nx * j * L * 0.34 - x0, a[1] + dy * f + ny * j * L * 0.34 - y0]); }
    const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
    const fork = pts[Math.max(1, n >> 1)], fk = `M${fork[0].toFixed(1)} ${fork[1].toFixed(1)}L${(fork[0] + nx * 9 + dx / L * 6).toFixed(1)} ${(fork[1] + ny * 9 + dy / L * 6).toFixed(1)}`;
    return { src: k.svg(`<path d="${d}${fk}" fill="none" stroke="#8cc4ff" stroke-width="4.5" opacity=".3" stroke-linejoin="bevel" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#f2f9ff" stroke-width="1.4" stroke-linejoin="bevel"/><path d="${fk}" fill="none" stroke="#e4f2ff" stroke-width=".9"/>`, w, h), c: [x0 + w / 2, y0 + h / 2], w, h };
  };
  // each strike: [time, from, to] (the walls' own places, away from the drawn bolts)
  const NEW = [[640, [66, 24], [98, 54]], [1020, [232, 54], [204, 76]], [1380, [86, 164], [118, 142]], [1700, [214, 168], [186, 148]], [1700, [150, 12], [140, 40]], [2200, [70, 112], [96, 98]]];
  NEW.forEach(([t, a, b], i) => {
    const B = jag(a, b, 6, i + 3), pk = [[t - 40, 0], [t, 1], [t + 90, 0.3], [t + 150, 1], [t + 260, 0.45], [t + 400, 0]];
    fx(k.pic(B.src, B.c, B.w, B.h, {}), pk.map(([tt, o]) => [tt, { opacity: o }, 'linear']));
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    fx(k.lightIn('g-cool', mid, 92, 70), [[t - 60, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t, { transform: 'scale(1)', opacity: 0.95 }, 'linear'], [t + 150, { transform: 'scale(1.1)', opacity: 0.55 }, 'linear'], [t + 520, { transform: 'scale(1.3)', opacity: 0 }]]);
  });
  // the drawn bolts' own glow where they end, at their strikes
  sp.bolts.forEach(([x, y], i) => {
    const t = STR[[0, 1, 2, 3][i]] ?? 1700;
    fx(k.lightIn('g-cool', [x, y], 80, 60), [[t - 60, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t, { transform: 'scale(1)', opacity: 0.85 }, 'linear'], [t + 190, { transform: 'scale(1.15)', opacity: 0.5 }, 'linear'], [t + 560, { transform: 'scale(1.3)', opacity: 0 }]]);
  });
  // the cold flash over the whole picture, at the peak and (small) at the others
  const WA = [[640, 0.12], [1020, 0.14], [1380, 0.16], [1700, 0.5], [2200, 0.12]];
  const wash = fk.map((t) => [t, { opacity: +Math.max(0, ...WA.map(([s, a]) => a * lerp(FLASH, t - s))).toFixed(3) }, 'linear']);
  fx(k.lightIn('g-cool', [150, 105], 420, 300), wash);

  // ── the gold of the eye: gathers, surges at the peak, drains; glints wake on its rim; rings of light run out
  fx(k.lightIn('g-heal', [EX, EY], 150, 120), [[0, { transform: 'scale(.85)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(1.1)', opacity: 0.55 }, eio], [1700, { transform: 'scale(1.35)', opacity: 0.8 }, 'ease-out'], [1850, { transform: 'scale(1.7)', opacity: 1 }, eio], [2700, { transform: 'scale(1.25)', opacity: 0.4 }, eio], [3500, { transform: 'scale(1)', opacity: 0 }]]);
  fx(k.lightIn('g-heal', [EX, EY], 420, 300), [[900, { opacity: 0 }, 'ease-out'], [1750, { opacity: 0.5 }, 'ease-out'], [2000, { opacity: 0.55 }, eio], [3000, { opacity: 0.15 }, eio], [3700, { opacity: 0 }]]);
  const ringImg = k.svg('<ellipse cx="60" cy="47" rx="56" ry="43.7" fill="none" stroke="#ffe39a" stroke-width="7" opacity=".26"/><ellipse cx="60" cy="47" rx="56" ry="43.7" fill="none" stroke="#fff3c8" stroke-width="2.6"/><ellipse cx="60" cy="47" rx="50" ry="39" fill="none" stroke="#fff8e0" stroke-width="1" opacity=".7"/>', 120, 94);
  [[1700, 1700, 1], [2000, 1700, 0.55]].forEach(([t0, life, o]) => {
    const at = (f, op) => ({ transform: `scale(${(0.5 + 4.6 * f).toFixed(3)})`, opacity: +(op * o).toFixed(2) });
    fx(k.pic(ringImg, [EX, EY], 120, 94, {}), [[t0, at(0, 0), 'ease-out'], [t0 + 140, at(0.05, 0.95), 'linear'], [t0 + life * 0.65, at(0.6, 0.55), 'ease-out'], [t0 + life, at(1, 0)]]);
  });
  // glints waking round the eye's rim
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + rand() * 0.3, r = 66 + rand() * 6, t0 = 1000 + i * 80 + (i % 3) * 120 + Math.round(rand() * 120), sz = 8 + (i % 3) * 3;
    fx(k.pic('glint', [EX + Math.cos(a) * r, EY + 6 + Math.sin(a) * r * SQ], sz, sz, {}), [[t0, { transform: 'rotate(0deg) scale(.3)', opacity: 0 }, 'ease-out'], [t0 + 240, { transform: 'rotate(25deg) scale(1.1)', opacity: 1 }, eio], [t0 + 800, { transform: 'rotate(60deg) scale(.4)', opacity: 0 }]]);
  }
  // motes of gold lifting off the rim and drifting up toward the sky (toward us, so: out and away)
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2, r = 30 + rand() * 38, t0 = 1100 + rand() * 1700, sz = 1.8 + rand() * 2.4, drift = 18 + rand() * 30, life = 1300 + rand() * 900;
    const x = EX + Math.cos(a) * r, y = EY + Math.sin(a) * r * SQ, ca = Math.cos(a), sa = Math.sin(a) * SQ;
    fx(k.pic('mote', [x, y], sz, sz, {}), [[t0, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 250, { transform: `${k.T(ca * drift * 0.2, sa * drift * 0.2)} scale(1)`, opacity: 0.95 }, 'linear'],
      [t0 + life * 0.7, { transform: `${k.T(ca * drift * 0.75, sa * drift * 0.75)} scale(.9)`, opacity: 0.7 }, 'linear'], [t0 + life, { transform: `${k.T(ca * drift, sa * drift)} scale(.5)`, opacity: 0 }]]);
  }

  // ── wind and rain streaking out through the walls, from the eye past the frame
  for (let i = 0; i < 30; i++) {
    const a = rand() * Math.PI * 2, r0 = 78 + rand() * 40, r1 = r0 + 70 + rand() * 80, t0 = 250 + rand() * 2600, life = 500 + rand() * 450, len = 18 + rand() * 16;
    const ca = Math.cos(a), sa = Math.sin(a) * SQ, ang = (Math.atan2(sa, ca) * 180) / Math.PI;
    const at = (r, o, sc) => ({ transform: `${k.T(ca * r, sa * r)} rotate(${ang.toFixed(1)}deg) scale(${sc})`, opacity: o });
    const peak = 0.55 * (0.45 + 0.55 * Math.min(1, swell(t0 + life / 2) * 1.2 + 0.2));
    fx(k.pic('streak', [EX, EY + 6], len, 2.4, {}), [[t0, at(r0, 0, 0.4), 'ease-out'], [t0 + life * 0.25, at(r0 + (r1 - r0) * 0.25, peak, 1), 'linear'], [t0 + life * 0.8, at(r0 + (r1 - r0) * 0.8, peak * 0.8, 1.4), 'linear'], [t0 + life, at(r1, 0, 1.6)]]);
  }

  // ── the gulls: each wheels once right round the eye (its own pace and way), banking and flapping, and is back
  const GP = sp.gulls;
  GP.forEach(([x, y], i) => {
    const R0 = Math.hypot(x - EX, (y - EY) / SQ), th0 = Math.atan2((y - EY) / SQ, x - EX), dir = i % 2 ? -1 : 1;
    const t0 = 250 + i * 110, t1 = 3000 - i * 110, go = curve([[t0, 0], [t0 + 500, 0.2], [t1 - 700, 0.8], [t1, 1]]);
    const list = [];
    for (const t of keys) {
      const f = go(t), th = th0 + dir * f * Math.PI * 2, R = R0 * (1 + 0.55 * Math.sin(f * Math.PI));
      const px = EX + R * Math.cos(th), py = EY + R * Math.sin(th) * SQ;
      const active = Math.min(1, Math.max(0, (t - t0) / 300)) * Math.max(0, 1 - Math.max(0, t - t1 + 200) / 400);
      const flap = 1 - 0.45 * Math.max(0, Math.sin((t - t0) / (95 + i * 14))) * active;
      list.push([t, { transform: `${k.T(px - x, py - y)} rotate(${(dir * 14 * Math.sin(f * Math.PI * 2) * active).toFixed(1)}deg) scale(1, ${flap.toFixed(3)})` }, 'linear']);
    }
    act(k.part(`gull${i}`), list);
  });
}
