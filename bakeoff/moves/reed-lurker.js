// Reed Lurker (Ambush): all that shows is two eyes and a spear point in the mist. Then the hunter
// strikes: he coils back in the murk, bone-white light gathering along the spear, and bursts up,
// thrusting the spear out of the water in a burst of spray; a spear of bone flies from its point
// to T and breaks there in shards, and he sinks back to lurk as before.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker (Ambush creature, 3 power:
// he strikes first), element: bone (suggested; the spear is of bone). Parts: mer (his whole
// figure and his eyes, turning together about the middle of his coil) and spear (shaft, head and
// the pale line along it, turning about his hand and thrusting along its own length).
//   0-700     lurks: a slow breath, the eyes glow; ripples at the surface.
//   700-1300  coils (anticipation): he sinks and draws back away from his target, the spear drawn
//             back along its length; bubbles rise; bone-white light gathers along the spear's
//             head; the eyes flare.
//   1300      RELEASE (BEATS.release): he lunges, the spear thrusts (turned toward T) and breaks
//             through the surface in spray and rings; a spear of bone leaves its point for T.
//   1700      LANDS (BEATS.impact) at T = k.aim, else the reeds at the right (its own target): a flash,
//             bone shards flung out, a ring, mist; reeds shiver.
//   1700-3000 follow-through: the spear is drawn back (a little past rest), he sinks and the water
//             closes over his coil; the light drains.
//   3600      at rest as drawn (the move ends at END).
//
// The contract: the bone spear leaves from `emit` (the spear's point as it thrusts) and goes to T.
export const END = 4200;
export const BEATS = { release: 1300, impact: 1700, settle: 3600 };
export const STILLS = [400, 1000, 1300, 1480, 1750, 2200, 3000, 3900];

export const textures = {
  bone: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [250, 244, 216, Math.min(1, c * c * 1.7)]; }],
  mist: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [214, 238, 232, Math.min(1, c * 1.2) * 0.55]; }],
  foam: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [236, 252, 250, Math.min(1, c * 1.4) * 0.9]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out';
  const S = k.spec, [hx, hy] = S.hand, [tx0, ty0] = S.tip, [cx, cy] = S.coil, [sx, sy] = S.surface;
  const T = k.aim || S.alone;
  const sm = k.smooth;
  const D = Math.PI / 180;
  const stage = (keys, t) => {
    let i = keys.length - 1;
    while (i > 0 && keys[i][0] > t) i--;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    return a[1] + (b[1] - a[1]) * (b[0] === a[0] ? 0 : sm(Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0])))));
  };
  const grid = [];
  for (let t = 0; t <= 3660; t += 30) grid.push(t);
  const env = (t) => Math.min(1, t / 300) * Math.min(1, Math.max(0, (3600 - t) / 400));
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3780, fn(3660)]];
  k.css(`.g-bone { border-radius: 50%; background: radial-gradient(circle, rgba(255,252,232,.95), rgba(238,232,196,.6) 30%, rgba(170,214,206,.22) 58%, rgba(140,200,200,0) 72%); }`);

  // ── the spear's aim: it turns about his hand from its rest line (8.2 deg off the vertical) toward T, at most 36 deg
  const rest = Math.atan2(tx0 - hx, hy - ty0) / D; // (its rest line, deg from the vertical, clockwise)
  const toT = Math.atan2(T[0] - hx, hy - T[1]) / D;
  const delta = Math.max(-36, Math.min(36, toT - rest));
  const aimA = (rest + delta) * D, ax = Math.sin(aimA), ay = -Math.cos(aimA); // the aimed axis (unit)
  const dir = T[0] >= cx ? 1 : -1; // which way he lunges
  // the spear: draws back a little (turning the other way), thrusts out along the aim, comes back past rest, settles
  const rotK = [[0, 0], [700, 0], [1280, -0.22 * delta - 1.5 * dir], [1360, delta], [1900, delta * 0.7], [2300, 0.12 * delta * -1], [3000, 0.04 * delta], [3500, 0]];
  const thrK = [[0, 0], [700, 0], [1280, -8], [1380, 15], [1480, 13], [1900, 8], [2300, -2], [3000, 0.8], [3500, 0]];
  const rotOf = (t) => stage(rotK, t) + 0.12 * env(t) * Math.sin(t / 420);
  const thrOf = (t) => stage(thrK, t);
  // where its point is at ms t: the rest point turned about the hand, then pushed along the axis the spear is on then
  const tipAt = (t) => {
    const r = rotOf(t) * D, vx = tx0 - hx, vy = ty0 - hy, ang = (rest + rotOf(t)) * D;
    return [hx + vx * Math.cos(r) - vy * Math.sin(r) + Math.sin(ang) * thrOf(t), hy + vx * Math.sin(r) + vy * Math.cos(r) - Math.cos(ang) * thrOf(t)];
  };
  act(k.part('spear'), sample((t) => { const ang = (rest + rotOf(t)) * D; return { transform: `translate(${(Math.sin(ang) * thrOf(t) * u).toFixed(2)}px, ${(-Math.cos(ang) * thrOf(t) * u).toFixed(2)}px) rotate(${rotOf(t).toFixed(2)}deg)` }; }));
  // he: breathes; sinks and draws back as he coils; lunges with the spear; sinks back and rises to lurk
  const sinkK = [[0, 0], [700, 0], [1250, 1], [1380, -1.15], [1560, -0.8], [2100, 0.35], [2800, 0.1], [3500, 0]];
  const mer = (t) => {
    const f = stage(sinkK, t), b = 0.012 * env(t) * Math.sin(t / 620);
    const dx = dir * (f > 0 ? -3.5 * f : 5.5 * -f), dy = f > 0 ? 6 * f : 8 * f;
    return `translate(${(dx * u).toFixed(2)}px, ${((dy - 0.5 * env(t) * Math.sin(t / 620)) * u).toFixed(2)}px) rotate(${(dir * (f > 0 ? -4.5 * f : 8 * -f)).toFixed(2)}deg) scale(${(1 + b - (f > 0 ? 0.03 * f : -0.04 * f)).toFixed(4)}, ${(1 - b + (f > 0 ? -0.04 * f : -0.06 * f)).toFixed(4)})`;
  };
  act(k.part('mer'), sample((t) => ({ transform: mer(t) })));

  // ── lurking: the eyes glow, a ripple trembles at the surface
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".8"/></filter></defs><ellipse cx="30" cy="30" rx="26" ry="26" fill="none" stroke="#ecfffa" stroke-width="2.4" filter="url(#b)"/>', 60, 60);
  const ripple = (c, t, o, sc, d) => fx(k.picIn(ring, [c[0], c[1] + 0.5], 30, 30), [[t, { transform: 'scale(.2, .06)', opacity: 0 }, 'ease-out'], [t + 70, { transform: 'scale(.4, .12)', opacity: o }, 'ease-out'], [t + d, { transform: `scale(${sc}, ${sc * 0.3})`, opacity: 0 }]]);
  ripple([cx, 104], 100, 0.5, 2.4, 1500); ripple([cx, 104], 900, 0.5, 2.8, 1400);
  ripple([sx, sy], 450, 0.4, 1.5, 1300);
  fx(k.lightIn('g-bone', [cx, 100.5], 34, 18), [[500, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(1)', opacity: 0.5 }, eio], [1290, { transform: 'scale(1.5)', opacity: 0.9 }, 'ease-out'], [1500, { transform: 'scale(1.2)', opacity: 0.8 }, eio], [2300, { transform: 'scale(1)', opacity: 0.3 }, eio], [2900, { transform: 'scale(.6)', opacity: 0 }]]);

  // ── coiling (700-1300): bubbles rising round him, bone-white light gathering along the spear's head
  for (let n = 0; n < 12; n++) {
    const t = 640 + n * 55 + rand() * 30, x0 = cx + (rand() - 0.5) * 70, y0 = 150 + rand() * 30, sz = 2 + rand() * 2.4, drift = (rand() - 0.5) * 8;
    fx(k.picIn('foam', [x0, y0], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 100, { transform: 'scale(1)', opacity: 0.85 }, 'linear'], [t + 1000, { transform: `${k.T(drift, -(y0 - 100))} scale(.8)`, opacity: 0.6 }, 'linear'], [t + 1120, { transform: `${k.T(drift, -(y0 - 103))} scale(1.3)`, opacity: 0 }]]);
  }
  const gl = [[760, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1200, { transform: 'scale(.9)', opacity: 0.6 }, eio]];
  for (let t = 1240, i = 0; t < 1290; t += 25, i++) gl.push([t, { transform: 'scale(1.1)', opacity: 0.85 }, eio]);
  fx(k.light('g-bone', [tx0 - 0.5, ty0 + 8], 30), gl.concat([[1330, { transform: 'scale(1.5)', opacity: 0 }]]));
  for (let n = 0; n < 12; n++) {
    const t = 780 + n * 40 + rand() * 20, a = rand() * Math.PI * 2, d = 14 + rand() * 16, x0 = tx0 + Math.cos(a) * d, y0 = ty0 + 8 + Math.sin(a) * d * 0.9, sz = 2 + rand() * 2.2;
    fx(k.pic('bone', [x0, y0], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 110, { transform: 'scale(1)', opacity: 0.9 }, 'ease-in'], [t + 480, { transform: `${k.T(tx0 - x0, ty0 + 8 - y0)} scale(.4)`, opacity: 0 }]]);
  }

  // ── breaking through the surface (1300-): a column of spray, rings, foam on the waterline
  [[1330, 0.9, 4.4, 1200], [1450, 0.7, 3.4, 1300], [1620, 0.5, 2.6, 1300]].forEach(([t, o, sc, d]) => ripple([sx + dir * 1, sy], t, o, sc, d));
  ripple([cx, 104], 1360, 0.6, 4, 1400);
  for (let n = 0; n < 24; n++) {
    const t = 1330 + n * 12 + rand() * 20, a = (-90 + (rand() - 0.5) * 100) * D, v = 14 + rand() * 24, sz = 2.4 + rand() * 3.4;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * v * f, Math.sin(a) * v * f + 30 * f * f)} scale(${sc})`, opacity: o });
    fx(k.picIn(n % 3 ? 'foam' : 'bone', [sx, sy + 1], sz, sz), [[t, P(0, 0.5, 0), 'ease-out'], [t + 80, P(0.15, 1.1, 1), 'ease-out'], [t + 400, P(0.7, 1, 0.9), 'ease-in'], [t + 700 + rand() * 250, P(1, 0.5, 0)]]);
  }
  fx(k.lightIn('g-bone', [sx, sy - 6], 56, 44), [[1310, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1390, { transform: 'scale(1.1)', opacity: 0.9 }, eio], [1900, { transform: 'scale(1.2)', opacity: 0.35 }, eio], [2500, { transform: 'scale(1)', opacity: 0 }]]);
  // mist thrown up with it
  for (let n = 0; n < 5; n++) {
    const t = 1350 + n * 110, x0 = sx + (rand() - 0.5) * 28, r = Math.round(rand() * 360);
    fx(k.picIn('mist', [x0, 98], 34, 34), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 350, { transform: `${k.T(0, -6)} rotate(${r + 15}deg) scale(1)`, opacity: 0.6 }], [t + 1400, { transform: `${k.T(-4, -26)} rotate(${r + 40}deg) scale(1.8)`, opacity: 0 }]]);
  }

  // ── the spear of bone (release 1300 to impact 1700): leaves the point as it thrusts, flies straight to T
  const E = tipAt(1380), [EX, EY] = k.P(...E);
  const head = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".7"/></filter><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#d8d0b0"/><stop offset="1" stop-color="#fffdf0"/></linearGradient></defs><path d="M2,12Q14,6 38,12Q14,18 2,12Z" fill="#f4ecc8" filter="url(#b)"/><path d="M4,12Q16,8.4 36,12Q16,15.6 4,12Z" fill="url(#g)"/><path d="M0,12L6,10.6L6,13.4Z" fill="#e8e0bc"/>', 40, 24);
  const heading = (Math.atan2(T[1] - E[1], T[0] - E[0]) * 180) / Math.PI;
  const bzp = (f) => [E[0] + (T[0] - E[0]) * f, E[1] + (T[1] - E[1]) * f];
  const fl = [];
  for (let i = 0; i <= 8; i++) {
    const f = sm(i / 8), [x, y] = k.P(...bzp(f));
    fl.push([1340 + i * 45, { transform: `translate(${(x - EX).toFixed(1)}px, ${(y - EY).toFixed(1)}px) rotate(${heading.toFixed(1)}deg) scale(${(0.5 + 0.55 * Math.min(1, i / 3)).toFixed(2)})`, opacity: i === 0 ? 0 : 1 }, 'linear']);
  }
  const last = fl[fl.length - 1][1];
  fl.push([1760, { ...last, opacity: 0.9 }, 'linear'], [1860, { ...last, opacity: 0 }]);
  fx(k.pic(head, E, 28, 17), fl);
  fx(k.light('g-bone', E, 22), [[1330, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1400, { transform: 'scale(1.3)', opacity: 1 }, eio], [1750, { transform: 'scale(.9)', opacity: 0.4 }, eio], [1900, { transform: 'scale(.5)', opacity: 0 }]]);
  // a trail of bone-white motes and mist along the line of flight
  for (let n = 0; n < 22; n++) {
    const t0 = 1340 + n * 17, sz = 3 + rand() * 4, side = (rand() - 0.5) * 6, dur = 280 + rand() * 80;
    const at = (f, sc, o) => { const [x, y] = k.P(...bzp(sm(f))); return { transform: `translate(${(x - EX).toFixed(1)}px, ${(y - EY + side * Math.sin(Math.PI * f) * u).toFixed(1)}px) scale(${sc})`, opacity: o }; };
    fx(k.pic(n % 3 ? 'bone' : 'mist', E, n % 3 ? sz : sz * 2.6, n % 3 ? sz : sz * 2.6), [[t0, at(0, 0.4, 0), 'ease-out'], [t0 + 40, at(0.08, 1, 0.9), 'linear'], [t0 + dur, at(0.85, 0.9, 0.75), 'linear'], [t0 + dur + 250, at(1, 0.3, 0)]]);
  }

  // ── where it lands (impact, 1700): a flash, shards of bone flung out, a ring, mist
  const I = 1700;
  const shard = k.svg('<path d="M0,5L10,0L14,4L8,10Z" fill="#f4ecc8"/><path d="M1.6,5L9.6,1.6L11,4L7.6,7.4Z" fill="#fffdf0"/>', 14, 10);
  const ringC = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#f8f2d0" stroke-width="3" filter="url(#b)"/>', 60, 60);
  fx(k.light('g-bone', T, 66), [[I - 70, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [I + 50, { transform: 'scale(1.2)', opacity: 1 }, eio], [I + 350, { transform: 'scale(1.35)', opacity: 0.6 }, eio], [2700, { transform: 'scale(1.1)', opacity: 0 }]]);
  [[0, 3.4, 0.9], [150, 2.5, 0.6]].forEach(([dt, sc, o]) => fx(k.pic(ringC, T, 28, 28), [[I + dt, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [I + dt + 50, { transform: 'scale(.6)', opacity: o }], [I + dt + 800, { transform: `scale(${sc})`, opacity: 0 }]]));
  for (let n = 0; n < 12; n++) {
    const a = (n / 12) * Math.PI * 2 + rand() * 0.4, v = 14 + rand() * 24, sz = 5 + rand() * 4, t = I + rand() * 60, spin = Math.round((rand() - 0.5) * 540);
    const P = (f, sc, o, g) => ({ transform: `${k.T(Math.cos(a) * v * f, Math.sin(a) * v * f + g * f * f)} rotate(${Math.round(spin * f)}deg) scale(${sc})`, opacity: o });
    fx(k.pic(shard, T, sz, sz * 0.72), [[t, P(0, 0.5, 0, 0), 'ease-out'], [t + 60, P(0.12, 1.1, 1, 8), 'ease-out'], [t + 500, P(0.75, 1, 0.9, 14), 'ease-in'], [t + 800 + rand() * 250, P(1, 0.6, 0, 20)]]);
  }
  for (let n = 0; n < 16; n++) {
    const a = rand() * Math.PI * 2, dist = 8 + rand() * 24, sz = 2.6 + rand() * 3, t = I + rand() * 100;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * dist * f, Math.sin(a) * dist * f * 0.8 - 10 * f)} scale(${sc})`, opacity: o });
    fx(k.pic('bone', T, sz, sz), [[t, P(0, 0.5, 0), 'ease-out'], [t + 60, P(0.2, 1.1, 1), 'ease-out'], [t + 700 + rand() * 400, P(1, 0.4, 0)]]);
  }
  for (let n = 0; n < 4; n++) {
    const t = I + 120 + n * 140, r = Math.round(rand() * 360);
    fx(k.pic('mist', [T[0] + (rand() - 0.5) * 14, T[1] - 4], 30, 30, { low: true }), [[t, { transform: `rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 300, { transform: `${k.T(-2, -10)} rotate(${r + 15}deg) scale(1)`, opacity: 0.55 }], [t + 1300, { transform: `${k.T(-8, -34)} rotate(${r + 40}deg) scale(2)`, opacity: 0 }]]);
  }
}
