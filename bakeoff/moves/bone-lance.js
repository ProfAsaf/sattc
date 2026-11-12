// Bone Lance: the lance strikes.
//
// PLAN (drawing units 300 x 210, ms of the move)
//   0-600     it draws back along its flight (8 units) and the violet fire
//             gathers: glows swell along its length, the trail pulls in.
//   600-1040  it SURGES forward along its flight (+26 units), accelerating; the
//             fire roars back off it in puffs, the trail streams out behind it
//             (stretched along the flight to 1.8x), ghostly faces pour off it,
//             stretching as they stream back.
//   1040      it strikes home at its point (273, 127): a white-violet flash, a
//             burst of violet spirit-fire (billows flung out, wisps of spirit
//             rising), two rings of light spreading, sparks, faces thrown
//             out; the lance shudders.
//   1070-1700 the flash runs left across the graveyard: each stone lights up
//             in turn, 70-500 ms after the blow, and the fog glows.
//   1500-2700 the lance drifts back to where it is drawn, the trail draws in,
//             the fire and the lights die.
//   3000      at rest as drawn (the move ends at END).
export const END = 3600;
export const STILLS = [300, 700, 950, 1060, 1200, 1500, 2100, 3100];

const noise = (x, y) => 0.55 + 0.25 * Math.sin(x * 9 + y * 4) * Math.cos(y * 7 - x * 3) + 0.2 * Math.sin(x * 21 - y * 13);
export const textures = {
  // violet fire: a soft billow, white-hot in the middle, violet at its edge
  vpuff: [48, 48, (x, y) => {
    const r = Math.hypot(x - 0.5, y - 0.5) * 2, a = Math.pow(Math.max(0, 1 - r), 1.2) * noise(x, y) * 1.25, h = Math.min(1, a * 1.25);
    return [150 + 100 * h * h, 90 + 150 * h * h, 255, Math.min(1, a)];
  }],
  // spirit: paler, softer, taller than it is wide
  spirit: [32, 48, (x, y) => {
    const r = Math.hypot((x - 0.5) * 1.6, y - 0.5) * 2, a = Math.pow(Math.max(0, 1 - r), 1.5) * noise(x * 1.3, y) * 0.95;
    return [214, 196, 255, Math.min(1, a)];
  }],
  vspark: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [210 + 45 * c * c, 190 + 65 * c * c, 255, Math.min(1, c * c * 2.4)]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out';
  const lance = k.part('lance'), trail = k.part('trail');
  const [bx, by] = k.spec.butt, [ux, uy] = k.spec.axis, [px, py] = k.spec.point;
  const ang = Math.atan2(uy, ux) * 180 / Math.PI, [nx, ny] = [-uy, ux];
  const LEN = Math.hypot(px - bx, py - by);
  const SURGE = 26, PULL = -8, HIT = 1040;
  const C = [px + ux * SURGE, py + uy * SURGE]; // where it strikes

  k.css(`.g-violet2 { border-radius: 50%; background: radial-gradient(closest-side, rgba(250,244,255,.95), rgba(196,150,255,.55) 24%, rgba(140,90,255,.2) 52%, rgba(120,60,255,0) 100%); }`);

  // ── the lance's offset along its flight, by time (what it and its lights ride on): [ms, offset, wobble deg, easing]
  const D = [[0, 0, 0, eio], [560, PULL, 0, eio], [650, PULL, 0, 'cubic-bezier(.5,0,1,.6)'], [HIT, SURGE + 1, 0, 'ease-out'], [1075, SURGE + 2.5, 0.6, eio], [1115, SURGE - 1.5, -0.7, eio], [1160, SURGE + 1, 0.5, eio],
    [1210, SURGE - 0.5, -0.35, eio], [1270, SURGE, 0.15, eio], [1500, SURGE - 0.5, 0, eio], [2700, 0, 0, eio]];
  const at = (ms) => { let i = D.length - 1; while (i > 0 && D[i][0] > ms) i--; const a = D[i], b = D[Math.min(i + 1, D.length - 1)], f = b[0] === a[0] ? 0 : Math.min(1, Math.max(0, (ms - a[0]) / (b[0] - a[0]))); return a[1] + (b[1] - a[1]) * f; };
  const shift = (d) => k.T(ux * d, uy * d);
  act(lance, D.map(([t, d, w, e]) => [t, { transform: `${shift(d)} rotate(${w}deg)` }, e]));
  // the trail: stretched along the flight about the butt (as the lance goes, it streams out), drawn in after
  const TS = [[0, 1], [560, 0.78], [650, 0.78], [HIT, 1.85], [1100, 1.7], [1500, 1.45], [2700, 1]];
  const trailK = TS.map(([t, s]) => [t, { transform: `${shift(at(t))} rotate(${ang.toFixed(2)}deg) scale(${s}, ${s > 1.2 ? 0.92 : 1}) rotate(${(-ang).toFixed(2)}deg)` }, t === 650 ? 'cubic-bezier(.5,0,1,.6)' : t === HIT ? 'ease-out' : eio]);
  act(trail, trailK);

  // ── glows along the lance, riding with it: swell with the fire, flash at the strike, die
  for (const f of [0.35, 0.6, 0.85]) {
    const x = bx + ux * LEN * f, y = by + uy * LEN * f, ks = [];
    for (const t of [0, 300, 560, 650, 850, HIT, 1075, 1160, 1500, 2100, 2700]) {
      const o = t < 300 ? 0 : t < 560 ? 0.45 : t < 650 ? 0.7 : t < HIT ? 0.85 : t < 1160 ? 1 : t < 1500 ? 0.7 : t < 2100 ? 0.4 : 0;
      ks.push([t, { transform: `${shift(at(t))} scale(${t < 560 ? 0.8 : t < HIT ? 1.1 : 1.35})`, opacity: o }, eio]);
    }
    fx(k.lightIn('g-violet2', [x, y], 62, 44), ks);
  }

  // ── the fire roaring back off it: violet billows streaming along the trail (600-1040)
  for (let i = 0; i < 34; i++) {
    const t = 560 + i * 15 + rand() * 25, s = LEN * (0.3 + rand() * 0.68), o = (rand() - 0.5) * 9, d0 = at(t) + 2;
    const sx = bx + ux * (s + d0) + nx * o, sy = by + uy * (s + d0) + ny * o, back = 26 + rand() * 48, rise = -3 - rand() * 7, sz = 15 + rand() * 12;
    const pose = (b, sc, extra = 0) => `${k.T(-ux * b, -uy * b + extra)} rotate(${ang.toFixed(1)}deg) scale(${(sc * (1 + b / 35)).toFixed(2)}, ${(sc * 0.7).toFixed(2)})`;
    fx(k.picIn('vpuff', [sx, sy], sz, sz), [[Math.round(t), { transform: pose(0, 0.45), opacity: 0 }, 'ease-out'], [Math.round(t + 70), { transform: pose(back * 0.2, 0.8, rise * 0.2), opacity: 0.95 }, 'ease-out'],
      [Math.round(t + 360), { transform: pose(back * 0.7, 1.05, rise * 0.7), opacity: 0.55 }, 'ease-out'], [Math.round(t + 640), { transform: pose(back, 1.2, rise), opacity: 0 }]]);
  }
  // fire thrown forward off the point as it goes (a hot head)
  fx(k.lightIn('g-violet2', [px - 6, py - 1], 56, 40), [[600, { transform: `${shift(PULL)} scale(.6)`, opacity: 0 }, 'ease-in'], [HIT - 80, { transform: `${shift(SURGE - 6)} scale(1.3)`, opacity: 1 }, 'ease-in'], [HIT + 20, { transform: `${shift(SURGE)} scale(1.6)`, opacity: 1 }]]);

  // ── ghostly faces pouring off it, stretching as they stream back
  const face = k.svg('<defs><linearGradient id="t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d8c8f6" stop-opacity="0"/><stop offset="0.6" stop-color="#d8c8f6" stop-opacity=".7"/><stop offset="1" stop-color="#eee6ff" stop-opacity=".95"/></linearGradient></defs>' +
    '<path d="M2,7 L14,3 C20,0.5 28,1 31,7 C28,13 20,13.5 14,11Z" fill="url(#t)"/>' +
    '<ellipse cx="25.5" cy="5.4" rx="1.5" ry="2" fill="#150c26" opacity=".8"/><ellipse cx="25.5" cy="9" rx="1.5" ry="2" fill="#150c26" opacity=".8"/><ellipse cx="29.2" cy="7.2" rx="1.1" ry="1.9" fill="#150c26" opacity=".85"/>', 34, 14);
  for (let i = 0; i < 9; i++) {
    const t = 580 + i * 52 + rand() * 20, s = LEN * (0.05 + rand() * 0.5), o = (rand() - 0.5) * 16, d0 = at(t);
    const sx = bx + ux * (s + d0) + nx * o, sy = by + uy * (s + d0) + ny * o, sz = 20 + rand() * 9, back = 60 + rand() * 70;
    const pose = (b, sx2, sy2, lift) => `${k.T(-ux * b, -uy * b + lift)} rotate(${ang.toFixed(1)}deg) scale(${sx2}, ${sy2})`;
    fx(k.picIn(face, [sx, sy], sz, sz * 0.42, { lit: false }), [[Math.round(t), { transform: pose(0, 0.6, 0.6, 0), opacity: 0 }, 'ease-out'], [Math.round(t + 110), { transform: pose(back * 0.12, 1, 1, -1), opacity: 0.9 }],
      [Math.round(t + 520), { transform: pose(back * 0.6, 1.9, 0.85, -3), opacity: 0.55 }], [Math.round(t + 980), { transform: pose(back, 3.1, 0.6, -5), opacity: 0 }]]);
  }

  // ── the strike
  // flashes
  fx(k.lightIn('g-violet2', C, 96, 96), [[HIT - 6, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [HIT + 14, { transform: 'scale(1)', opacity: 1 }, 'ease-out'], [HIT + 140, { transform: 'scale(1.5)', opacity: 0.85 }], [1500, { transform: 'scale(2.1)', opacity: 0.25 }, 'ease-out'], [2300, { transform: 'scale(2.5)', opacity: 0 }]]);
  fx(k.lightIn('g-violet2', [C[0] - 40, C[1] + 20], 260, 130), [[HIT, { opacity: 0 }, 'ease-out'], [HIT + 40, { opacity: 0.55 }, 'ease-out'], [1400, { opacity: 0.3 }, eio], [2400, { opacity: 0 }]]);
  // a hard white core, brief
  fx(k.lightIn('g-violet2', C, 34, 34), [[HIT - 6, { transform: 'scale(.4)', opacity: 0 }], [HIT + 8, { transform: 'scale(1.1)', opacity: 1 }], [HIT + 90, { transform: 'scale(1.5)', opacity: 0.9 }], [HIT + 260, { transform: 'scale(.8)', opacity: 0 }]]);
  // rings of light spreading
  const ring = k.svg('<circle cx="30" cy="30" r="27" fill="none" stroke="#efe4ff" stroke-width="1.8"/><circle cx="30" cy="30" r="22" fill="none" stroke="#a678ff" stroke-width="1.1" stroke-opacity=".7"/>', 60, 60);
  for (const [t, big] of [[HIT, 1.1], [HIT + 130, 1.55]]) fx(k.picIn(ring, C, 60, 60), [[t, { transform: 'scale(.1)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(.25)', opacity: 1 }, 'ease-out'], [t + 560, { transform: `scale(${big})`, opacity: 0 }]]);
  // billows of violet spirit-fire flung out
  for (let i = 0; i < 20; i++) {
    const a = rand() * Math.PI * 2, r = 12 + rand() * 30, ex = Math.cos(a) * r * 1.15, ey = Math.sin(a) * r * 0.8 - 5, sz = 20 + rand() * 16, t = HIT + rand() * 70;
    fx(k.picIn('vpuff', C, sz, sz), [[Math.round(t), { transform: 'scale(.35) rotate(0deg)', opacity: 0 }, 'ease-out'], [Math.round(t + 70), { transform: `${k.T(ex * 0.4, ey * 0.4)} scale(.85) rotate(${(rand() * 90).toFixed(0)}deg)`, opacity: 0.95 }, 'ease-out'],
      [Math.round(t + 420), { transform: `${k.T(ex, ey)} scale(1.25) rotate(${(rand() * 200).toFixed(0)}deg)`, opacity: 0.45 }, 'ease-out'], [Math.round(t + 760), { transform: `${k.T(ex * 1.2, ey * 1.2 - 6)} scale(1.5) rotate(${(rand() * 300).toFixed(0)}deg)`, opacity: 0 }]]);
  }
  // wisps of spirit rising
  for (let i = 0; i < 7; i++) {
    const t = HIT + 40 + i * 70 + rand() * 40, x = C[0] + (rand() - 0.5) * 24, up = 24 + rand() * 34, sway = (rand() - 0.5) * 14, sz = 16 + rand() * 8;
    fx(k.picIn('spirit', [x, C[1] + 6], sz, sz * 1.5), [[Math.round(t), { transform: 'scale(.4, .3)', opacity: 0 }, 'ease-out'], [Math.round(t + 160), { transform: `${k.T(sway * 0.3, -up * 0.3)} scale(.9, .9)`, opacity: 0.8 }, 'ease-out'], [Math.round(t + 900), { transform: `${k.T(sway, -up)} scale(1.4, 1.8)`, opacity: 0 }]]);
  }
  // sparks
  for (let i = 0; i < 18; i++) {
    const a = (rand() - 0.5) * Math.PI * 1.9 - Math.PI / 2 + (rand() - 0.5) * 0.8, r = 14 + rand() * 40, ex = Math.cos(a) * r, ey = Math.sin(a) * r * 0.9 + 4, sz = 2.2 + rand() * 3, t0 = HIT + rand() * 70, life = 420 + rand() * 360;
    const pts = k.arc([0, 0], [ex * 0.6, ey - 7 - rand() * 8], [ex + 2, ey + 12 + rand() * 12], 5);
    fx(k.picIn('vspark', C, sz, sz), pts.map(([x, y], j) => [Math.round(t0 + life * j / 5), { transform: `${k.T(x, y)} scale(${(1 - 0.55 * j / 5).toFixed(2)})`, opacity: j === 5 ? 0 : 1 - 0.1 * j }, j < 2 ? 'ease-out' : 'linear']));
  }
  // faces thrown out of the blow, crying
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI * (0.15 + 0.7 * rand()), r = 26 + rand() * 30, t = HIT + 40 + rand() * 90, sz = 18 + rand() * 8, rot = ((a * 180) / Math.PI + 180).toFixed(0);
    fx(k.picIn(face, C, sz, sz * 0.42, { lit: false }), [[Math.round(t), { transform: `rotate(${rot}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [Math.round(t + 120), { transform: `${k.T(Math.cos(a) * r * 0.35, Math.sin(a) * r * 0.35)} rotate(${rot}deg) scale(1.1, .9)`, opacity: 0.9 }, 'ease-out'],
      [Math.round(t + 900), { transform: `${k.T(Math.cos(a) * r, Math.sin(a) * r - 8)} rotate(${rot}deg) scale(2.4, .7)`, opacity: 0 }]]);
  }

  // ── the graveyard lit as the flash runs left: each stone in its turn
  const stones = [[278, 166, 20], [246, 192, 24], [286, 186, 36], [222, 165, 22], [176, 165, 18], [128, 168, 18], [84, 166, 24], [30, 168, 22], [20, 192, 26], [112, 142, 28], [232, 136, 34], [262, 138, 24], [76, 134, 40]];
  for (const [x, y, h] of stones) {
    const t = HIT + 30 + Math.abs(C[0] - x) / 0.42, big = 1 - Math.abs(C[0] - x) / 420;
    fx(k.lightIn('g-violet2', [x, y - 3], h * 2.8, h * 2.0), [[Math.round(t), { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [Math.round(t + 70), { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [Math.round(t + 280), { transform: 'scale(1.15)', opacity: +(0.7 * big + 0.2).toFixed(2) }], [Math.round(t + 900), { transform: 'scale(1.3)', opacity: 0 }]]);
  }
  // the mist along the ground glows as it passes
  fx(k.lightIn('g-violet2', [160, 175], 330, 44), [[HIT + 80, { opacity: 0 }, 'ease-out'], [HIT + 330, { opacity: 1 }, 'ease-out'], [1500, { opacity: 0.55 }, eio], [2500, { opacity: 0 }]]);
}
