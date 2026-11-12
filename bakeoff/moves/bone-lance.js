// Bone Lance: the lance turns its point on the target, draws back, and is hurled.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker (the lance IS the attack), element: bone
// (violet fire on pale bone). It faces right. T = k.aim, or, alone, the foot of the right-hand stones (`alone`).
// The lance and its trail are drawn as parts at rest; the moment it starts to move (30 ms) they are handed to
// copies of themselves on the overlay (so it may fly out of the picture to either side), and handed back, as
// the lance re-forms, at the end.
//   0-540     it TURNS its point on T about its middle (if T is behind it, it swings round over the top), the violet
//             fire gathering: glows swell along its length, sparks drawn in from the dark.
//   300-650   it draws back along its new heading (10 units) and hangs, the trail pulling in.
//   640       RELEASE: it SURGES along the line to T, accelerating; the fire roars back off it in puffs, the
//             trail streams out behind it (stretched along the flight), ghostly faces pour off it.
//   1040      IMPACT: its point strikes T: a white-violet flash, a burst of violet spirit-fire, two rings,
//             sparks, faces thrown out; the lance shudders.
//   1070-1700 the flash runs through the graveyard (alone: each stone lit in turn from the blow; aimed: the
//             stones light as the lance leaves them, since the blow is elsewhere) and the mist glows.
//   1500-1900 the lance, struck home, dissolves into rising spirit; the trail fades.
//   2350-3100 it re-forms where it is drawn: sparks drawn in, glows along it, the bone and fire fading back in.
//   3100      at rest as drawn (BEATS.settle); the move ends at END.
// Contract: everything is worked out from the lance's own geometry (spec.butt, spec.point, spec.axis) and T.
export const END = 3600;
export const BEATS = { release: 640, impact: 1040, settle: 3100 };
export const STILLS = [300, 600, 900, 1050, 1250, 1700, 2600, 3300];

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

// the parts' boxes as baked (art/live/bone-lance.json): drawing units, and the joint in % of the box
const BOX = { lance: { x: 36, y: 44.5, w: 220.5, h: 91.5, ox: 10.9, oy: 30.1 }, trail: { x: 0, y: 42, w: 253, h: 89, ox: 23.7, oy: 33.7 } };

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, lance = k.part('lance'), trail = k.part('trail');
  const [bx, by] = S.butt, [ux, uy] = S.axis, [px, py] = S.point;
  const ang0 = Math.atan2(uy, ux) * 180 / Math.PI, RAD = Math.PI / 180;
  const LEN = Math.hypot(px - bx, py - by), HL = LEN / 2;
  const Q = [bx + ux * HL, by + uy * HL];           // its middle: it turns about this
  const T = k.aim || S.alone, C = T;
  const REL = 640, HIT = 1040, PULL = -10, TURN = 540;

  // where it turns to: the point toward T (by the shortest way over the top), and how far to go
  let delta = Math.atan2(T[1] - Q[1], T[0] - Q[0]) * 180 / Math.PI - ang0;
  while (delta > 70) delta -= 360;
  while (delta < -290) delta += 360;
  const phi = ang0 + delta, U1 = [Math.cos(phi * RAD), Math.sin(phi * RAD)], N1 = [-U1[1], U1[0]];
  const SURGE = Math.max(34, Math.hypot(T[0] - Q[0], T[1] - Q[1]) - HL);

  k.css(`.g-violet2 { border-radius: 50%; background: radial-gradient(closest-side, rgba(250,244,255,.95), rgba(196,150,255,.55) 24%, rgba(140,90,255,.2) 52%, rgba(120,60,255,0) 100%); }`);

  // ── its pose by time: how far it has turned (deg), how far along its heading, and a shudder (deg)
  const dl = (t) => delta * sm(Math.min(1, Math.max(0, (t - 60) / (TURN - 60))));
  const D = [[0, 0], [300, 0], [600, PULL], [650, PULL], [HIT, SURGE + 1], [1075, SURGE + 2.5], [1115, SURGE - 1.5], [1160, SURGE + 1], [1210, SURGE - 0.5], [1270, SURGE], [1500, SURGE - 0.5]];
  const sAt = (t) => {
    if (t <= 650) { // 0..650 is eased between the points, 650..HIT accelerates
      let i = 0; while (i < 3 && D[i + 1][0] <= t) i++;
      const a = D[i], b = D[i + 1], f = sm(Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0])))); return a[1] + (b[1] - a[1]) * f;
    }
    let i = 3; while (i < D.length - 2 && D[i + 1][0] <= t) i++;
    const a = D[i], b = D[i + 1], f = Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0])));
    return a[1] + (b[1] - a[1]) * (i === 3 ? Math.pow(f, 1.8) : sm(f));
  };
  const wob = (t) => (t < 1075 ? 0 : t < 1115 ? 0.6 : t < 1160 ? -0.7 : t < 1210 ? 0.5 : t < 1270 ? -0.35 : 0);
  // its butt at t, and the point a along it, p across it, at t
  const dirAt = (t) => { const h = (ang0 + dl(t)) * RAD; return [Math.cos(h), Math.sin(h)]; };
  const buttAt = (t) => { const [cx, cy] = dirAt(t), s = sAt(t) - HL; return [Q[0] + cx * s, Q[1] + cy * s]; };
  const pt = (t, a, p = 0) => { const [cx, cy] = dirAt(t), [bX, bY] = buttAt(t); return [bX + cx * a - cy * p, bY + cy * a + cx * p]; };
  const lancePose = (t) => { const [bX, bY] = buttAt(t); return `${k.T(bX - bx, bY - by)} rotate(${(dl(t) + wob(t)).toFixed(2)}deg)`; };
  const trailScale = (t) => (t < 650 ? 1 - 0.22 * sm(Math.min(1, t / 600)) : t < HIT ? 0.78 + 0.74 * Math.pow((t - 650) / (HIT - 650), 1.5) : t < 1500 ? 1.52 - 0.15 * (t - HIT) / 460 : 1.37);
  const trailPose = (t) => { const s = trailScale(t); return `${lancePose(t)} rotate(${ang0.toFixed(2)}deg) scale(${s.toFixed(3)}, ${s > 1.2 ? 0.92 : 1}) rotate(${(-ang0).toFixed(2)}deg)`; };

  // ── the lance and its trail: the parts hand over to copies on the overlay at 30 ms, and take over again at the end
  const copyOf = (name, part) => {
    const b = BOX[name], el = k.pic(part.src, [b.x + b.w / 2, b.y + b.h / 2], b.w, b.h, { lit: false });
    el.style.transformOrigin = `${b.ox}% ${b.oy}%`; return el;
  };
  const times = [30]; for (let t = 40; t <= 640; t += 40) times.push(t);
  times.push(650, HIT, 1075, 1115, 1160, 1210, 1270, 1500);
  const eas = (t) => (t === 650 ? 'cubic-bezier(.5,0,1,.6)' : t === HIT ? 'ease-out' : t >= 1075 ? eio : 'linear');
  const lk = times.map((t) => [t, { transform: lancePose(t), opacity: 1 }, eas(t)]);
  lk.push([1900, { transform: lancePose(1500), opacity: 0 }]);
  fx(copyOf('lance', lance), lk);
  const tk = times.map((t) => [t, { transform: trailPose(t), opacity: 1 }, eas(t)]);
  tk.push([1700, { transform: trailPose(1500), opacity: 0 }]);
  fx(copyOf('trail', trail), tk);
  // the parts themselves: handed over at 30 ms, back (re-formed) from 2350
  act(lance, [[0, { opacity: 1 }], [30, { opacity: 1 }], [32, { opacity: 0 }], [2350, { opacity: 0 }, 'ease-out'], [3050, { opacity: 1 }]]);
  act(trail, [[0, { opacity: 1 }], [30, { opacity: 1 }], [32, { opacity: 0 }], [2450, { opacity: 0 }, 'ease-out'], [3100, { opacity: 1 }]]);

  // ── glows along the lance, riding with it: swell with the fire, flash at the strike, die as it dissolves
  const GT = [0, 150, 300, 430, 560, 650, 850, HIT, 1075, 1160, 1500, 1700, 1900];
  const GO = [0, 0.25, 0.45, 0.55, 0.62, 0.72, 0.86, 0.95, 1, 1, 0.7, 0.35, 0];
  for (const f of [0.35, 0.6, 0.85]) {
    const x = bx + ux * LEN * f, y = by + uy * LEN * f;
    fx(k.light('g-violet2', [x, y], 62, 44), GT.map((t, i) => { const [gx, gy] = pt(t, LEN * f); return [t, { transform: `${k.T(gx - x, gy - y)} rotate(${dl(t).toFixed(1)}deg) scale(${t < 560 ? 0.8 : t < HIT ? 1.1 : 1.35})`, opacity: GO[i] }, eio]; }));
  }
  // sparks drawn in out of the dark as it gathers
  for (let i = 0; i < 16; i++) {
    const a = rand() * Math.PI * 2, r = 24 + rand() * 34, f = 0.15 + rand() * 0.75, t0 = 120 + Math.round(rand() * 330), t1 = Math.min(TURN + 80, t0 + 260 + rand() * 120);
    const e = pt(t1, LEN * f, (rand() - 0.5) * 6), sz = 2.4 + rand() * 2.6;
    fx(k.pic('vspark', e, sz, sz), [[Math.round(t0), { transform: `${k.T(Math.cos(a) * r, Math.sin(a) * r * 0.8)} scale(.6)`, opacity: 0 }, 'ease-out'], [Math.round(t0 + 90), { transform: `${k.T(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.56)} scale(1)`, opacity: 0.9 }, 'ease-in'], [Math.round(t1), { transform: 'scale(.5)', opacity: 0 }]]);
  }

  // ── the fire roaring back off it: violet billows streaming along the trail (560-1040)
  const A1 = phi.toFixed(1);
  for (let i = 0; i < 34; i++) {
    const t = 560 + i * 15 + rand() * 25, s = LEN * (0.3 + rand() * 0.68), o = (rand() - 0.5) * 9;
    const [sx, sy] = pt(Math.min(t, 1500), s, o), back = 26 + rand() * 48, rise = -3 - rand() * 7, sz = 15 + rand() * 12;
    const pose = (b, sc, extra = 0) => `${k.T(-U1[0] * b, -U1[1] * b + extra)} rotate(${A1}deg) scale(${(sc * (1 + b / 35)).toFixed(2)}, ${(sc * 0.7).toFixed(2)})`;
    fx(k.pic('vpuff', [sx, sy], sz, sz), [[Math.round(t), { transform: pose(0, 0.45), opacity: 0 }, 'ease-out'], [Math.round(t + 70), { transform: pose(back * 0.2, 0.8, rise * 0.2), opacity: 0.95 }, 'ease-out'],
      [Math.round(t + 360), { transform: pose(back * 0.7, 1.05, rise * 0.7), opacity: 0.55 }, 'ease-out'], [Math.round(t + 640), { transform: pose(back, 1.2, rise), opacity: 0 }]]);
  }
  // fire thrown forward off the point as it goes (a hot head)
  {
    const tip = (t) => pt(t, LEN - 6);
    const rest = [px - 6, py - 1], d = (q) => k.T(q[0] - rest[0], q[1] - rest[1]);
    fx(k.light('g-violet2', rest, 56, 40), [[600, { transform: `${d(tip(600))} scale(.6)`, opacity: 0 }, 'ease-in'], [HIT - 80, { transform: `${d(tip(HIT - 80))} scale(1.3)`, opacity: 1 }, 'ease-in'], [HIT + 20, { transform: `${d(tip(HIT + 20))} scale(1.6)`, opacity: 1 }], [HIT + 200, { transform: `${d(tip(HIT + 20))} scale(.8)`, opacity: 0 }]]);
  }

  // ── ghostly faces pouring off it, stretching as they stream back
  const face = k.svg('<defs><linearGradient id="t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d8c8f6" stop-opacity="0"/><stop offset="0.6" stop-color="#d8c8f6" stop-opacity=".7"/><stop offset="1" stop-color="#eee6ff" stop-opacity=".95"/></linearGradient></defs>' +
    '<path d="M2,7 L14,3 C20,0.5 28,1 31,7 C28,13 20,13.5 14,11Z" fill="url(#t)"/>' +
    '<ellipse cx="25.5" cy="5.4" rx="1.5" ry="2" fill="#150c26" opacity=".8"/><ellipse cx="25.5" cy="9" rx="1.5" ry="2" fill="#150c26" opacity=".8"/><ellipse cx="29.2" cy="7.2" rx="1.1" ry="1.9" fill="#150c26" opacity=".85"/>', 34, 14);
  for (let i = 0; i < 9; i++) {
    const t = 580 + i * 52 + rand() * 20, s = LEN * (0.05 + rand() * 0.5), o = (rand() - 0.5) * 16;
    const [sx, sy] = pt(Math.min(t, 1500), s, o), sz = 20 + rand() * 9, back = 60 + rand() * 70;
    const pose = (b, sx2, sy2, lift) => `${k.T(-U1[0] * b, -U1[1] * b + lift)} rotate(${A1}deg) scale(${sx2}, ${sy2})`;
    fx(k.pic(face, [sx, sy], sz, sz * 0.42, { lit: false }), [[Math.round(t), { transform: pose(0, 0.6, 0.6, 0), opacity: 0 }, 'ease-out'], [Math.round(t + 110), { transform: pose(back * 0.12, 1, 1, -1), opacity: 0.9 }],
      [Math.round(t + 520), { transform: pose(back * 0.6, 1.9, 0.85, -3), opacity: 0.55 }], [Math.round(t + 980), { transform: pose(back, 3.1, 0.6, -5), opacity: 0 }]]);
  }

  // ── the strike
  fx(k.light('g-violet2', C, 96, 96), [[HIT - 6, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [HIT + 14, { transform: 'scale(1)', opacity: 1 }, 'ease-out'], [HIT + 140, { transform: 'scale(1.5)', opacity: 0.85 }], [1500, { transform: 'scale(2.1)', opacity: 0.25 }, 'ease-out'], [2300, { transform: 'scale(2.5)', opacity: 0 }]]);
  fx(k.light('g-violet2', [C[0] - U1[0] * 40, C[1] - U1[1] * 40], 200, 110), [[HIT, { opacity: 0 }, 'ease-out'], [HIT + 40, { opacity: 0.5 }, 'ease-out'], [1400, { opacity: 0.3 }, eio], [2400, { opacity: 0 }]]);
  fx(k.light('g-violet2', C, 34, 34), [[HIT - 6, { transform: 'scale(.4)', opacity: 0 }], [HIT + 8, { transform: 'scale(1.1)', opacity: 1 }], [HIT + 90, { transform: 'scale(1.5)', opacity: 0.9 }], [HIT + 260, { transform: 'scale(.8)', opacity: 0 }]]);
  const ring = k.svg('<circle cx="30" cy="30" r="27" fill="none" stroke="#efe4ff" stroke-width="1.8"/><circle cx="30" cy="30" r="22" fill="none" stroke="#a678ff" stroke-width="1.1" stroke-opacity=".7"/>', 60, 60);
  for (const [t, big] of [[HIT, 1.1], [HIT + 130, 1.55]]) fx(k.pic(ring, C, 60, 60), [[t, { transform: 'scale(.1)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(.25)', opacity: 1 }, 'ease-out'], [t + 560, { transform: `scale(${big})`, opacity: 0 }]]);
  // billows of violet spirit-fire flung out
  for (let i = 0; i < 20; i++) {
    const a = rand() * Math.PI * 2, r = 12 + rand() * 30, ex = Math.cos(a) * r * 1.15, ey = Math.sin(a) * r * 0.8 - 5, sz = 20 + rand() * 16, t = HIT + rand() * 70;
    fx(k.pic('vpuff', C, sz, sz), [[Math.round(t), { transform: 'scale(.35) rotate(0deg)', opacity: 0 }, 'ease-out'], [Math.round(t + 70), { transform: `${k.T(ex * 0.4, ey * 0.4)} scale(.85) rotate(${(rand() * 90).toFixed(0)}deg)`, opacity: 0.95 }, 'ease-out'],
      [Math.round(t + 420), { transform: `${k.T(ex, ey)} scale(1.25) rotate(${(rand() * 200).toFixed(0)}deg)`, opacity: 0.45 }, 'ease-out'], [Math.round(t + 760), { transform: `${k.T(ex * 1.2, ey * 1.2 - 6)} scale(1.5) rotate(${(rand() * 300).toFixed(0)}deg)`, opacity: 0 }]]);
  }
  // wisps of spirit rising
  for (let i = 0; i < 7; i++) {
    const t = HIT + 40 + i * 70 + rand() * 40, x = C[0] + (rand() - 0.5) * 24, up = 24 + rand() * 34, sway = (rand() - 0.5) * 14, sz = 16 + rand() * 8;
    fx(k.pic('spirit', [x, C[1] + 6], sz, sz * 1.5), [[Math.round(t), { transform: 'scale(.4, .3)', opacity: 0 }, 'ease-out'], [Math.round(t + 160), { transform: `${k.T(sway * 0.3, -up * 0.3)} scale(.9, .9)`, opacity: 0.8 }, 'ease-out'], [Math.round(t + 900), { transform: `${k.T(sway, -up)} scale(1.4, 1.8)`, opacity: 0 }]]);
  }
  // sparks
  for (let i = 0; i < 18; i++) {
    const a = (rand() - 0.5) * Math.PI * 1.9 - Math.PI / 2 + (rand() - 0.5) * 0.8, r = 14 + rand() * 40, ex = Math.cos(a) * r, ey = Math.sin(a) * r * 0.9 + 4, sz = 2.2 + rand() * 3, t0 = HIT + rand() * 70, life = 420 + rand() * 360;
    const pts = k.arc([0, 0], [ex * 0.6, ey - 7 - rand() * 8], [ex + 2, ey + 12 + rand() * 12], 5);
    fx(k.pic('vspark', C, sz, sz), pts.map(([x, y], j) => [Math.round(t0 + life * j / 5), { transform: `${k.T(x, y)} scale(${(1 - 0.55 * j / 5).toFixed(2)})`, opacity: j === 5 ? 0 : 1 - 0.1 * j }, j < 2 ? 'ease-out' : 'linear']));
  }
  // faces thrown out of the blow, crying
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI * (0.15 + 0.7 * rand()), r = 26 + rand() * 30, t = HIT + 40 + rand() * 90, sz = 18 + rand() * 8, rot = ((a * 180) / Math.PI + 180).toFixed(0);
    fx(k.pic(face, C, sz, sz * 0.42, { lit: false }), [[Math.round(t), { transform: `rotate(${rot}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [Math.round(t + 120), { transform: `${k.T(Math.cos(a) * r * 0.35, Math.sin(a) * r * 0.35)} rotate(${rot}deg) scale(1.1, .9)`, opacity: 0.9 }, 'ease-out'],
      [Math.round(t + 900), { transform: `${k.T(Math.cos(a) * r, Math.sin(a) * r - 8)} rotate(${rot}deg) scale(2.4, .7)`, opacity: 0 }]]);
  }

  // ── the lance, struck home, dissolves into rising spirit
  for (let i = 0; i < 8; i++) {
    const f = 0.1 + (i / 7) * 0.85, t = 1380 + i * 55 + rand() * 30, [x, y] = pt(1500, LEN * f, (rand() - 0.5) * 4), up = 18 + rand() * 26, sz = 13 + rand() * 6;
    fx(k.pic('spirit', [x, y], sz, sz * 1.5), [[Math.round(t), { transform: 'scale(.5, .4)', opacity: 0 }, 'ease-out'], [Math.round(t + 170), { transform: `${k.T((rand() - 0.5) * 5, -up * 0.3)} scale(.9, .9)`, opacity: 0.8 }, 'ease-out'], [Math.round(t + 800), { transform: `${k.T((rand() - 0.5) * 12, -up)} scale(1.3, 1.7)`, opacity: 0 }]]);
  }

  // ── the graveyard lit by the flash
  const stones = [[278, 166, 20], [246, 192, 24], [286, 186, 36], [222, 165, 22], [176, 165, 18], [128, 168, 18], [84, 166, 24], [30, 168, 22], [20, 192, 26], [112, 142, 28], [232, 136, 34], [262, 138, 24], [76, 134, 40]];
  for (const [x, y, h] of stones) {
    const dist = Math.abs((k.aim ? Q[0] : C[0]) - x), t = k.aim ? 600 + dist / 0.45 : HIT + 30 + dist / 0.42, big = (1 - dist / 420) * (k.aim ? 0.7 : 1);
    fx(k.light('g-violet2', [x, y - 3], h * 2.8, h * 2.0), [[Math.round(t), { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [Math.round(t + 70), { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [Math.round(t + 280), { transform: 'scale(1.15)', opacity: +(0.7 * big + 0.2).toFixed(2) }], [Math.round(t + 900), { transform: 'scale(1.3)', opacity: 0 }]]);
  }
  // the mist along the ground glows as it passes
  fx(k.light('g-violet2', [160, 175], 330, 44), k.aim
    ? [[560, { opacity: 0 }, 'ease-out'], [900, { opacity: 0.8 }, 'ease-out'], [1500, { opacity: 0.4 }, eio], [2200, { opacity: 0 }]]
    : [[HIT + 80, { opacity: 0 }, 'ease-out'], [HIT + 330, { opacity: 1 }, 'ease-out'], [1500, { opacity: 0.55 }, eio], [2500, { opacity: 0 }]]);

  // ── it re-forms where it is drawn: sparks drawn in, glows along it, the fire and the bone coming back
  for (const f of [0.3, 0.55, 0.8]) {
    const x = bx + ux * LEN * f, y = by + uy * LEN * f;
    fx(k.light('g-violet2', [x, y], 62, 44), [[2350 + f * 200, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [2800, { transform: 'scale(1.1)', opacity: 0.85 }, eio], [3350, { transform: 'scale(.9)', opacity: 0 }]]);
  }
  for (let i = 0; i < 14; i++) {
    const a = rand() * Math.PI * 2, r = 20 + rand() * 30, f = 0.08 + rand() * 0.85, t0 = 2300 + Math.round(rand() * 400), x = bx + ux * LEN * f, y = by + uy * LEN * f, sz = 2.4 + rand() * 2.4;
    fx(k.pic('vspark', [x, y], sz, sz), [[t0, { transform: `${k.T(Math.cos(a) * r, Math.sin(a) * r * 0.8)} scale(.6)`, opacity: 0 }, 'ease-out'], [t0 + 120, { transform: `${k.T(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.56)} scale(1)`, opacity: 0.9 }, 'ease-in'], [t0 + 420, { transform: 'scale(.5)', opacity: 0 }]]);
  }
}
