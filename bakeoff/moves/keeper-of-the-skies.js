// Keeper of the Skies: she holds her palm up and the storm breaks on her ward, three times, and does not pass.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: defender (as suggested: she holds the storm back),
// element: wind (as suggested). Alone, the blows are the storm's own: three bolts thrown out of the black front
// at the ward (the first at 1100, the others at 1750 and 2400), each on the `guard` point the picture's ward bows
// toward; aimed (k.blows), the blows are whatever comes, each snapped to the nearest `guard` point, at its time.
//   0-600     she braces (BEATS.release 600): her arm gathers a hair back, then presses the palm hard against the
//             storm; the palm's light swells, the ward kindles along its whole length; the storm leans in, swelling,
//             lightning flickering in its heart; her hair and scarf whip on the wind.
//   1100 (and each blow)  a blow lands on the ward (BEATS.impact: the first): the storm surges and the ward is
//             driven back a hair (her arm takes it, jolting), a white star and a ring of light burst at the point,
//             sparks fly back into the storm, a hairline of light runs the ward, a gust of rain is flung at the
//             glass and bursts into mist. Each blow a little stronger.
//   after the last  she thrusts: a great ring spreads from her palm and the ward blazes top to bottom; the storm is
//             shoved back and holds off, light mists off it.
//   2900-3700 the light dies down, the storm settles back against the ward, her arm eases down, her hair rests
//             (BEATS.settle 3700); END 4200, at rest as drawn.
// Contract: blows are k.blows || the storm's three; every effect at a blow is built from that blow's guard point.
export const END = 4200;
export const BEATS = { release: 600, impact: 1100, settle: 3700 };
export const STILLS = [350, 700, 1040, 1180, 1800, 2480, 3000, 3900];

const soft = (x, y) => Math.hypot(x - 0.5, y - 0.5) * 2;
export const textures = {
  star: [48, 48, (x, y) => { const dx = Math.abs(x - 0.5) * 2, dy = Math.abs(y - 0.5) * 2, c = Math.max(0, 1 - Math.hypot(dx, dy)), cr = Math.max(0, 1 - Math.min(dx * 9 + dy, dy * 9 + dx)), v = Math.min(1, c * c * 1.6 + cr * 0.9); return [255, 246 + 9 * v, 214 + 41 * v, v]; }],
  spark: [24, 24, (x, y) => { const c = Math.max(0, 1 - soft(x, y)); return [255, 236 + 19 * c * c, 170 + 85 * c * c, Math.min(1, c * c * 2.2)]; }],
  mist: [48, 48, (x, y) => { const r = Math.hypot((x - 0.5) * 1.1, y - 0.5) * 2, n = 0.8 + 0.2 * Math.sin(x * 15 + y * 6) * Math.cos(y * 11 - x * 5); return [230, 240, 246, Math.pow(Math.max(0, 1 - r), 1.1) * n]; }],
  bolt: [24, 24, (x, y) => { const c = Math.max(0, 1 - soft(x, y)); return [214, 232, 255, Math.min(1, c * c * 1.8)]; }],
};

export function build(k) {
  const { act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const fx = (el, list) => { let last = -1; k.fx(el, list.slice().sort((a, b) => a[0] - b[0]).map((e) => { last = Math.max(last + 1, Math.min(e[0], k.END - 1)); return [last, ...e.slice(1)]; })); };
  const S = k.spec, G = S.guard, [PX, PY] = S.palm;
  const alone = !k.blows, HOME = 3700;
  const near = (to) => G.reduce((b, g) => (Math.hypot(g[0] - to[0], g[1] - to[1]) < Math.hypot(b[0] - to[0], b[1] - to[1]) ? g : b), G[0]);
  const own = [{ at: 1100, to: G[1] }, { at: 1750, to: G[2] }, { at: 2400, to: G[0] }];
  const B = (k.blows || own).slice().sort((a, b) => a.at - b.at).map((b, i) => ({ t: Math.max(800, Math.min(2500, b.at)), g: near(b.to), s: 1 + 0.15 * i }));
  const last = B.at(-1).t, THRUST = last + 480;
  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  const shake = (tau) => (tau <= 0 ? 0 : (Math.exp(-tau / 170) * Math.sin((2 * Math.PI * tau) / 270)) / 0.66);
  const flash = (tau) => (tau < -15 ? 0 : tau < 0 ? 1 + tau / 15 : Math.exp(-tau / 240));
  const grid = (step) => { const a = []; for (let t = 0; t < HOME; t += step) a.push(t); a.push(HOME); return a; };
  const G40 = grid(40);
  const hit = (t) => Math.max(0, ...B.map((b) => flash(t - b.t) * b.s));
  const jolt = (t) => B.reduce((a, b) => a + shake(t - b.t) * b.s, 0);
  const calm = (t) => (t > THRUST + 500 ? Math.max(0, 1 - (t - THRUST - 500) / 1500) : 1); // (the storm's pressure dies away at the end)
  k.css(`.g-keep { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,252,236,.95), rgba(255,232,168,.55) 30%, rgba(255,214,130,.16) 62%, rgba(255,200,110,0) 100%); }
.g-bolt { border-radius: 50%; background: radial-gradient(closest-side, rgba(226,240,255,.85), rgba(170,200,240,.35) 40%, rgba(150,180,230,0) 100%); }`);

  // ── her arm: gathers back a hair, presses the palm to the storm, takes each blow, thrusts, eases down
  const pressed = curve([[0, 0], [300, 3], [600, -5], [THRUST - 200, -5.5], [THRUST, -9], [THRUST + 400, -6], [3300, -1.5], [HOME, 0]]);
  act(k.part('arm'), G40.map((t) => [t, { transform: `rotate(${(pressed(t) + 2.4 * jolt(t) * (t < HOME ? 1 : 0)).toFixed(2)}deg)` }, 'linear']));
  // ── her hair and scarf: whipped on the wind, lifting at each blow, streaming back to rest
  const gust = (t) => curve([[0, 0], [400, 1], [1000, 1], [3200, 0.5], [HOME, 0]])(t);
  act(k.part('hair'), G40.map((t) => [t, { transform: `rotate(${(2.6 * gust(t) * Math.sin(t / 210) - 1.8 * gust(t) - 8 * hit(t) * (t < HOME ? 1 : 0)).toFixed(2)}deg)` }, 'linear']));
  // ── the storm: leans in and swells, surges at each blow, is shoved back at the thrust, settles against the ward
  const lean = (t) => curve([[0, 0], [600, 1.2], [THRUST - 100, 1.4], [THRUST + 160, -3.4], [THRUST + 1100, -1.6], [HOME, 0]])(t) + 1.6 * hit(t) * calm(t);
  act(k.part('storm'), G40.map((t) => { const L = lean(t); return [t, { transform: `${k.T(L, 0)} scale(${(1 + 0.012 * Math.max(0, L)).toFixed(4)}, 1)` }, 'linear']; }));

  // ── the ward: its whole length kindles with her palm, blazes at each blow and at the thrust
  const wardX = (y) => PX - 9 + 0.0016 * (y - PY) * (y - PY);
  const y0 = -12, y1 = 138, bx = 100, bw = 38, pts = [];
  for (let y = y0; y <= y1; y += 6) pts.push(`${(wardX(y) - bx).toFixed(1)} ${(y - y0).toFixed(1)}`);
  const wl = 'M' + pts.join('L');
  const wardSvg = k.svg(`<path d="${wl}" fill="none" stroke="#ffe7a0" stroke-width="6" opacity=".35" stroke-linecap="round"/><path d="${wl}" fill="none" stroke="#fff6dc" stroke-width="2.2" stroke-linecap="round"/>`, bw, y1 - y0);
  const wardHot = (t) => Math.min(1, 0.35 * curve([[0, 0], [450, 1], [2900, 1], [HOME, 0]])(t) + 0.55 * hit(t) + 0.8 * Math.max(0, 1 - Math.abs(t - THRUST - 150) / 450));
  fx(k.picIn(wardSvg, [bx + bw / 2, (y0 + y1) / 2], bw, y1 - y0, {}), G40.map((t) => [t, { opacity: +wardHot(t).toFixed(2) }, 'linear']));
  // the palm's light, and a bloom along the ward that swells with it
  const palm = (t) => 0.5 * curve([[0, 0], [450, 1], [2900, 1], [HOME, 0]])(t) + 0.5 * hit(t) + 0.6 * Math.max(0, 1 - Math.abs(t - THRUST - 120) / 500);
  fx(k.lightIn('g-keep', [PX, PY], 46, 46), G40.map((t) => [t, { transform: `scale(${(0.8 + 0.5 * palm(t)).toFixed(3)})`, opacity: +Math.min(1, palm(t)).toFixed(2) }, 'linear']));
  fx(k.lightIn('g-keep', [PX + 4, 70], 40, 190), G40.map((t) => [t, { opacity: +Math.min(1, 0.55 * wardHot(t)).toFixed(2) }, 'linear']));
  // lightning flickering in the storm's heart while it gathers (and the sky above her stays gold)
  const sx = S.storm;
  [[300, 20, -10], [820, 40, 20], [1500, 30, -26], [2150, 22, 14], [2700, 36, 0]].forEach(([t0, dx, dy], i) => {
    fx(k.picIn('bolt', [sx[0] + dx - 10, sx[1] + dy], 80, 70, {}), [[t0, { opacity: 0, transform: 'scale(.7)' }, 'ease-out'], [t0 + 70, { opacity: 0.7, transform: 'scale(1)' }, 'linear'], [t0 + 130, { opacity: 0.2, transform: 'scale(1)' }, 'linear'], [t0 + 190, { opacity: 0.65, transform: 'scale(1.05)' }, 'linear'], [t0 + 520, { opacity: 0, transform: 'scale(1.2)' }]]);
    void i;
  });

  // ── a blow, at its guard point, at its time
  const ring = k.svg('<circle cx="30" cy="30" r="26" fill="none" stroke="#ffe7a0" stroke-width="4" opacity=".3"/><circle cx="30" cy="30" r="26" fill="none" stroke="#fffaf0" stroke-width="1.8"/>', 60, 60);
  const rain = k.svg('<path d="M3 1L7 31" stroke="#c8d8e8" stroke-width="1.3" stroke-linecap="round" opacity=".9"/><path d="M8 6L10 22" stroke="#e6eef6" stroke-width=".8" stroke-linecap="round" opacity=".7"/>', 12, 32);
  const toward = (g) => [g[0] - 0.2, g[1]]; void toward;
  B.forEach((b, bi) => {
    const [gx, gy] = b.g, t = b.t, s = b.s;
    // the bolt thrown out of the black front (alone): jagged, forking, flashing
    if (alone) {
      const sx0 = gx - 70 - rand() * 12, sy0 = gy - 30 + rand() * 12, n = 6, pts2 = [[sx0, sy0]];
      for (let i = 1; i < n; i++) { const f = i / n; pts2.push([sx0 + (gx - sx0) * f + (rand() - 0.5) * 8, sy0 + (gy - sy0) * f + (rand() - 0.5) * 14]); }
      pts2.push([gx, gy]);
      const x0 = sx0 - 8, yy0 = Math.min(sy0, gy) - 18, bw2 = gx - x0 + 6, bh2 = Math.max(sy0, gy) - yy0 + 18;
      const d = 'M' + pts2.map(([x, y]) => `${(x - x0).toFixed(1)} ${(y - yy0).toFixed(1)}`).join('L');
      const fk = pts2[2], fe = [fk[0] + 12, fk[1] + 26];
      const dk = `M${(fk[0] - x0).toFixed(1)} ${(fk[1] - yy0).toFixed(1)}L${(fe[0] - x0 - 3).toFixed(1)} ${(fe[1] - yy0 - 5).toFixed(1)}L${(fe[0] - x0).toFixed(1)} ${(fe[1] - yy0).toFixed(1)}`;
      const img = k.svg(`<path d="${d}" fill="none" stroke="#9cb8ff" stroke-width="3.6" opacity=".35" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#eef6ff" stroke-width="1.5" stroke-linejoin="round"/><path d="${dk}" fill="none" stroke="#dcebff" stroke-width=".9"/>`, bw2, bh2);
      fx(k.picIn(img, [x0 + bw2 / 2, yy0 + bh2 / 2], bw2, bh2, {}), [[t - 140, { opacity: 0 }, 'linear'], [t - 100, { opacity: 0.9 }, 'linear'], [t - 40, { opacity: 0.3 }, 'linear'], [t, { opacity: 1 }, 'linear'], [t + 70, { opacity: 0.55 }, 'linear'], [t + 220, { opacity: 0 }]]);
      fx(k.lightIn('g-bolt', [sx0 + 8, sy0 + 6], 70, 60), [[t - 140, { opacity: 0 }, 'ease-out'], [t - 90, { opacity: 0.9 }], [t + 40, { opacity: 0.5 }], [t + 400, { opacity: 0 }]]);
    }
    // a gust of rain flung at the glass, bursting into mist where it meets it
    for (let i = 0; i < 8; i++) {
      const y = gy - 16 + rand() * 40, x = gx - 46 - rand() * 20, tt = t - 260 + i * 22;
      fx(k.picIn(rain, [x, y], 3, 9, { lit: false }), [[tt, { transform: `${k.T(0, 0)} rotate(-70deg) scale(.8)`, opacity: 0 }, 'ease-out'], [tt + 60, { transform: `${k.T(6, 1)} rotate(-70deg) scale(1)`, opacity: 0.85 }, 'linear'], [tt + 260, { transform: `${k.T(gx - 1 - x, (rand() - 0.5) * 6)} rotate(-70deg) scale(1)`, opacity: 0.8 }, 'linear'], [tt + 290, { transform: `${k.T(gx - x, 0)} rotate(-70deg) scale(.4)`, opacity: 0 }]]);
    }
    for (let i = 0; i < 3; i++) {
      const r = Math.round(rand() * 360), sz = 12 + rand() * 8;
      fx(k.picIn('mist', [gx - 3, gy + (i - 1) * 8], sz, sz, { lit: false }), [[t - 10, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 150, { transform: `${k.T(-5, (i - 1) * 3)} rotate(${r + 20}deg) scale(1)`, opacity: 0.6 }, 'ease-out'], [t + 800, { transform: `${k.T(-14, (i - 1) * 9 - 4)} rotate(${r + 50}deg) scale(1.9)`, opacity: 0 }]]);
    }
    // the star and the ring at the point, a lingering light on the glass
    fx(k.picIn('star', [gx, gy], 32 * s, 32 * s, {}), [[t - 20, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(1.1) rotate(10deg)', opacity: 1 }, 'ease-out'], [t + 420, { transform: 'scale(.6) rotate(25deg)', opacity: 0 }]]);
    fx(k.picIn(ring, [gx, gy], 40, 40, {}), [[t, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [t + 60, { transform: 'scale(.35)', opacity: 0.95 }, 'linear'], [t + 560, { transform: `scale(${(1.15 * s).toFixed(2)})`, opacity: 0 }]]);
    fx(k.lightIn('g-keep', [gx, gy], 50 * s, 60 * s), [[t - 30, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 50, { transform: 'scale(1)', opacity: 1 }], [t + 650, { transform: 'scale(1.3)', opacity: 0 }]]);
    // sparks thrown back into the storm
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + (rand() - 0.5) * 2.1, d = (16 + rand() * 30) * s, sz = 2 + rand() * 2.2;
      fx(k.picIn('spark', [gx, gy], sz, sz, {}), [[t, { transform: `${k.T(0, 0)} scale(.6)`, opacity: 0 }, 'ease-out'], [t + 50, { transform: `${k.T(Math.cos(a) * d * 0.2, Math.sin(a) * d * 0.2)} scale(1.1)`, opacity: 1 }, 'linear'], [t + 440, { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d + 8)} scale(.5)`, opacity: 0 }]]);
    }
    void bi;
  });

  // ── the thrust: a great ring from her palm, the ward blazing, mist torn off the shoved-back storm
  const big = [[0, 0.1], [0, 0.1]];
  void big;
  fx(k.picIn(ring, [PX, PY], 60, 60, {}), [[THRUST - 60, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [THRUST + 40, { transform: 'scale(.6)', opacity: 1 }, 'linear'], [THRUST + 900, { transform: 'scale(4)', opacity: 0 }]]);
  fx(k.picIn(ring, [PX, PY], 60, 60, {}), [[THRUST + 120, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [THRUST + 220, { transform: 'scale(.5)', opacity: 0.8 }, 'linear'], [THRUST + 1100, { transform: 'scale(3.2)', opacity: 0 }]]);
  fx(k.picIn('star', [PX, PY], 46, 46, {}), [[THRUST - 60, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [THRUST + 50, { transform: 'scale(1.2) rotate(15deg)', opacity: 1 }, 'ease-out'], [THRUST + 600, { transform: 'scale(.7) rotate(35deg)', opacity: 0 }]]);
  for (let i = 0; i < 9; i++) {
    const y = 6 + i * 15 + (rand() - 0.5) * 8, x = wardX(y) - 3, t0 = THRUST + 100 + i * 50, sz = 14 + rand() * 10, r = Math.round(rand() * 360);
    fx(k.picIn('mist', [x, y], sz, sz, { lit: false }), [[t0, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t0 + 250, { transform: `${k.T(-6, -2)} rotate(${r + 20}deg) scale(1)`, opacity: 0.55 }, 'ease-out'], [t0 + 1100, { transform: `${k.T(-26, -10)} rotate(${r + 60}deg) scale(1.9)`, opacity: 0 }]]);
  }
  // motes of gold drifting off the palm and the ward as the light dies down
  for (let i = 0; i < 12; i++) {
    const y = 20 + rand() * 100, x = wardX(y) + 3, t0 = THRUST + 150 + rand() * 900, sz = 1.8 + rand() * 1.8;
    fx(k.picIn('spark', [x, y], sz, sz, {}), [[t0, { transform: `${k.T(0, 0)} scale(.5)`, opacity: 0 }, 'ease-out'], [t0 + 200, { transform: `${k.T(2, -4)} scale(1)`, opacity: 0.9 }, 'linear'], [t0 + 1000, { transform: `${k.T(8 + rand() * 10, -22 - rand() * 14)} scale(.5)`, opacity: 0 }]]);
  }
}
