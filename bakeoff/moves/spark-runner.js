// Spark Runner: it coils, then bolts, throwing a fork of lightning at its target.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker, element lightning.
//   0-400     (if its target is behind it, it spins round through a sliver)
//   400-1100  GATHER: it coils down onto its haunches (body drops back, forelegs
//             tucked, ears flat, tail low), the streak behind it shrinks to a
//             sputter; its veins and the air round it crackle with little arcs,
//             sparks streaming in to its muzzle, a white-gold light swelling there.
//   1100      RELEASE: it springs (legs scissoring, body stretched out toward T), the
//             streak snaps out long behind it, dust and sparks kicked up; a lightning
//             bolt jags from its muzzle to T (three flickering variants).
//   1250      IMPACT at T: a white flash, rings, arcs forking out, sparks and
//             billows, flames catch, smoke.
//   1250-3000 it overshoots, skids back, rears and shakes off the charge (ears
//             flick, tail whips); the veins and the streak die back to as drawn,
//             stride wobbling out to nothing.
// BEATS: release 1100, impact 1250, settle 3000. At rest as drawn by 3000 (END 3800).
//
// Aimed: T = k.aim || [8, 112]; it turns toward T if T is behind it (to its right),
// the bolt is jagged afresh from its muzzle to T. Everything that flies is on the overlay.
export const END = 3800;
export const BEATS = { release: 1100, impact: 1250, settle: 3000 };
export const STILLS = [350, 900, 1130, 1220, 1300, 1600, 2200, 3400];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 214 + 41 * c * c, 130 + 110 * c * c * c, Math.min(1, c * c * 2.6)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const sp = k.spec, [Fx, Fy] = sp.feet, MID = sp.mid, EM = sp.emit;
  const P = { trail: k.part('trail'), mane: k.part('mane'), hind: k.part('hind'), tail: k.part('tail'), fore: k.part('fore'), ears: k.part('ears'), body: k.part('body'), veins: k.part('veins') };
  const T = k.aim || [8, 112];
  const turn = T[0] > MID + 10; // the target is behind it (to its right)
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#fff0c0" stroke-width="6" filter="url(#b)"/>', 100, 100);

  const track = (pts) => (ms) => {
    let i = pts.length - 1;
    while (i > 0 && pts[i][0] > ms) i--;
    if (i === pts.length - 1) return pts[i][1];
    const [t0, v0, e] = pts[i], [t1, v1] = pts[i + 1], f = Math.min(1, Math.max(0, (ms - t0) / (t1 - t0)));
    return v0 + (v1 - v0) * (e === 'out' ? 1 - (1 - f) * (1 - f) : e === 'in' ? f * f : k.smooth(f));
  };
  const M = turn ? track([[0, 1], [140, 1], [320, 0.06], [500, -1], [2800, -1], [2950, 0.06], [3100, 1]]) : () => 1;
  // its body: forward is toward its muzzle (-x as drawn); a forward lean is +rotation
  const fwd = track([[0, 0], [400, -1], [900, -5], [1060, -6.5, 'in'], [1200, 17, 'out'], [1350, 21], [1560, 7, 'out'], [1850, -4.5], [2250, 1.6], [2700, -0.4], [3000, 0]]);
  const bdy = track([[0, 0], [400, 1.4], [900, 4], [1060, 4.6, 'in'], [1200, -2.2, 'out'], [1400, -0.4], [1700, 1.8], [2100, 2], [2600, 0.5], [3000, 0]]);
  const lean = track([[0, 0], [500, 2], [1060, 5.5, 'in'], [1210, 9.5, 'out'], [1400, 8], [1650, -6], [1950, -3], [2400, 1.2], [3000, 0]]);
  // joints (+ is clockwise as drawn; the muzzle points left)
  const foreR = track([[0, 0], [500, -12], [1060, -26, 'in'], [1210, 16, 'out'], [1400, 10], [1700, -8], [2100, 4], [2600, -1], [3000, 0]]);
  const hindR = track([[0, 0], [500, 10], [1060, 22, 'in'], [1210, -20, 'out'], [1400, -12], [1700, 8], [2100, -4], [2600, 1.5], [3000, 0]]);
  const tailR = track([[0, 0], [500, 6], [1060, 12], [1210, -14, 'out'], [1500, -10], [1750, 18], [2050, -7], [2400, 5], [2800, -1.5], [3100, 0]]);
  const earR = track([[0, 0], [500, 8], [1060, 17], [1210, 26, 'out'], [1500, 22], [1750, -12], [2000, 9], [2250, -6], [2600, 2], [3000, 0]]);
  // the stride that breaks out as it springs, dying away (it scissors the legs about their joints)
  const env = (ms) => (ms < 1100 ? 0 : ms < 1500 ? 1 : Math.max(0, 1 - (ms - 1500) / 1500));
  const stride = (ms) => Math.sin((ms - 1100) / 62) * env(ms);
  const trailX = track([[0, 1], [500, 0.75], [1060, 0.45], [1130, 0.7], [1220, 2.3, 'out'], [1550, 1.7], [2200, 1.2], [3000, 1]]);
  const maneX = track([[0, 1], [500, 0.8], [1060, 0.6], [1220, 1.9, 'out'], [1550, 1.4], [2200, 1.1], [3000, 1]]);
  const trailO = track([[0, 1], [1060, 0.85], [1220, 1], [2500, 1]]);

  const rot = (v, d) => { const a = (d * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; };
  const brot = (ms) => lean(ms) * -1; // a forward lean for a left-facing body is counter-clockwise
  const bodyMap = (p, ms) => { const m = M(ms), r = rot([p[0] - Fx, p[1] - Fy], brot(ms)); return [MID + m * (Fx + r[0] - fwd(ms) - MID), Fy + r[1] + bdy(ms)]; };
  const tf = (piv, rotF, sx = () => 1) => (ms) => {
    const [x, y] = bodyMap(piv, ms);
    return `translate(${((x - piv[0]) * u).toFixed(2)}px, ${((y - piv[1]) * u).toFixed(2)}px) scale(${(M(ms) * sx(ms)).toFixed(3)}, 1) rotate(${rotF(ms).toFixed(2)}deg)`;
  };
  const grid = [];
  for (let t = 0; t <= 3100; t += 40) grid.push(t);
  grid.push(1100, 1250);
  const uniq = [...new Set(grid)].sort((a, b) => a - b);
  const play = (el, f, op) => act(el, uniq.map((t) => [t, op ? { transform: f(t), opacity: +op(t).toFixed(3) } : { transform: f(t) }, 'linear']));
  play(P.body, tf([Fx, Fy], brot));
  play(P.veins, tf([Fx, Fy], brot));
  play(P.fore, tf(k.spec.parts.find((q) => q.name === 'fore').pivot, (ms) => brot(ms) + foreR(ms) + 9 * stride(ms)));
  play(P.hind, tf(k.spec.parts.find((q) => q.name === 'hind').pivot, (ms) => brot(ms) + hindR(ms) - 11 * stride(ms)));
  play(P.tail, tf(k.spec.parts.find((q) => q.name === 'tail').pivot, (ms) => brot(ms) + tailR(ms) + 3 * stride(ms)));
  play(P.ears, tf(k.spec.parts.find((q) => q.name === 'ears').pivot, (ms) => brot(ms) + earR(ms)));
  play(P.trail, tf(k.spec.parts.find((q) => q.name === 'trail').pivot, (ms) => brot(ms) + 1.5 * stride(ms), trailX), trailO);
  play(P.mane, tf(k.spec.parts.find((q) => q.name === 'mane').pivot, (ms) => brot(ms) + 2 * stride(ms), maneX));

  const ride = (el, pt, list, extra = '') => {
    const ks = [];
    for (let i = 0; i < list.length; i++) {
      const [t0, s0, o0] = list[i], nx = list[i + 1];
      const put = (t, s, o) => { const [x, y] = bodyMap(pt, t); ks.push([t, { transform: `${k.T(x - pt[0], y - pt[1])} ${extra}scale(${s.toFixed(3)})`, opacity: +o.toFixed(3) }, 'linear']); };
      put(t0, s0, o0);
      if (nx) for (let t = t0 + 40; t < nx[0] - 20; t += 40) { const f = (t - t0) / (nx[0] - t0); put(t, s0 + (nx[1] - s0) * f, o0 + (nx[2] - o0) * f); }
    }
    return fx(el, ks);
  };

  // ── lightning pictures: a jagged bolt from a to b (in units), drawn afresh with a seed
  const boltSvg = (len, h, seed, w = 1) => {
    let a = seed >>> 0;
    const rr = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const n = Math.max(4, Math.round(len / 9)), cy = h / 2, pts = [[0, cy]];
    for (let i = 1; i < n; i++) { const edge = Math.min(i, n - i) / (n / 2); pts.push([(len * i) / n + (rr() - 0.5) * 5, cy + (rr() - 0.5) * 2 * Math.min(8, h * 0.32) * Math.min(1, edge * 1.6)]); }
    pts.push([len, cy]);
    const d = 'M' + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L');
    let forks = '';
    for (let j = 0; j < Math.min(3, Math.floor(n / 4)); j++) {
      const i = 1 + Math.floor(rr() * (n - 2)), [x, y] = pts[i], dir = rr() < 0.5 ? -1 : 1, fl = 10 + rr() * Math.min(26, len * 0.2);
      forks += `M${x.toFixed(1)},${y.toFixed(1)}L${(x + fl * 0.5).toFixed(1)},${(y + dir * fl * 0.3 + (rr() - 0.5) * 4).toFixed(1)}L${(x + fl).toFixed(1)},${(y + dir * fl * 0.55).toFixed(1)}`;
    }
    return k.svg(`<defs><filter id="g" x="-5%" y="-40%" width="110%" height="180%"><feGaussianBlur stdDeviation="2.2"/></filter></defs><g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${d}${forks}" stroke="#ff9a3a" stroke-width="${(7 * w).toFixed(1)}" opacity=".75" filter="url(#g)"/><path d="${d}" stroke="#ffe3a0" stroke-width="${(3 * w).toFixed(1)}"/><path d="${forks}" stroke="#ffd48a" stroke-width="${(1.6 * w).toFixed(1)}"/><path d="${d}" stroke="#fffbe8" stroke-width="${(1.2 * w).toFixed(1)}"/></g>`, len, h);
  };
  const E = bodyMap(EM, 1230);
  const dx = T[0] - E[0], dy = T[1] - E[1], L = Math.max(24, Math.hypot(dx, dy)), ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  const C = [E[0] + dx / 2, E[1] + dy / 2];
  // three flickering variants of the one bolt, each centred between the muzzle and T
  const bolts = [boltSvg(L, 36, 11), boltSvg(L, 36, 29), boltSvg(L, 36, 47)];
  const boltKeys = (v) => {
    const ks = [], t0 = 1100 + (v === 0 ? 0 : 0), tr = `rotate(${ang.toFixed(1)}deg)`;
    const on = [1, 0, 0, 0], seq = v === 0 ? [[1100, 0], [1112, 1], [1170, 1], [1180, 0], [1230, 1], [1290, 0.9], [1360, 0], [1480, 0]] : v === 1 ? [[1100, 0], [1180, 0], [1190, 1], [1235, 1], [1245, 0], [1300, 1], [1370, 0.8], [1450, 0]] : [[1100, 0], [1245, 0], [1255, 1], [1300, 1], [1315, 0], [1340, 0.9], [1410, 0.7], [1520, 0]];
    void on; void t0;
    for (const [t, o] of seq) ks.push([t, { transform: tr, opacity: o }, 'linear']);
    return ks;
  };
  bolts.forEach((b, v) => fx(k.pic(b, C, L, 36), boltKeys(v)));
  // a hot head racing out along it, and the muzzle's light
  ride(k.light('g-warm', EM, 30), EM, [[500, 0.4, 0], [900, 0.8, 0.6], [1060, 1.1, 0.9], [1200, 1.6, 1], [1400, 1.0, 0.6], [1800, 0.5, 0.25], [2300, 0.3, 0]]);
  fx(k.pic('puffHot', E, 16, 16), [[1120, { transform: `${k.T(0, 0)} scale(.6)`, opacity: 0 }, 'ease-out'], [1160, { transform: `${k.T(dx * 0.1, dy * 0.1)} scale(1)`, opacity: 1 }, 'linear'], [1250, { transform: `${k.T(dx, dy)} scale(1.1)`, opacity: 0.8 }], [1300, { transform: `${k.T(dx, dy)} scale(.4)`, opacity: 0 }]]);

  // ── veins: the whole body lights; lights ride it
  const pts = [[100, 100], [126, 106], [152, 106], [178, 112], [114, 118]];
  pts.forEach((pt, i) => ride(k.light('g-warm', pt, 26), pt, [[420 + i * 60, 0.4, 0], [800 + i * 40, 0.9, 0.55], [1060, 1.1, 0.8], [1200, 1.5, 1], [1500, 1.0, 0.6], [2100, 0.7, 0.2], [2600, 0.5, 0]]));
  // little arcs crackling over its body while it coils, and again as it settles
  const arc = [k.svg('<g fill="none" stroke-linecap="round"><path d="M1,5L5,2L8,6L12,3L16,6L20,4" stroke="#ffd48a" stroke-width="2.6" opacity=".6"/><path d="M1,5L5,2L8,6L12,3L16,6L20,4" stroke="#fffbe8" stroke-width="1"/></g>', 22, 8), k.svg('<g fill="none" stroke-linecap="round"><path d="M1,3L4,6L8,2L12,5L15,2L20,5" stroke="#ffd48a" stroke-width="2.6" opacity=".6"/><path d="M1,3L4,6L8,2L12,5L15,2L20,5" stroke="#fffbe8" stroke-width="1"/></g>', 22, 8)];
  const crackle = (t, pt, r) => { const [x, y] = bodyMap(pt, t); fx(k.pic(arc[Math.floor(rand() * 2)], [x, y], 20, 7), [[t, { transform: `rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 30, { transform: `rotate(${r}deg) scale(1)`, opacity: 1 }], [t + 90, { transform: `rotate(${r + 15}deg) scale(1)`, opacity: 0 }]]); };
  for (let i = 0; i < 22; i++) {
    const t = 480 + i * 33 + rand() * 20;
    crackle(t < 1100 ? t : t + 0, [95 + rand() * 90, 98 + rand() * 24], Math.round(rand() * 180));
  }
  for (let i = 0; i < 10; i++) crackle(1700 + i * 90 + rand() * 40, [100 + rand() * 80, 100 + rand() * 26], Math.round(rand() * 180));
  // sparks streaming in to its muzzle as it coils
  for (let i = 0; i < 11; i++) {
    const a = rand() * Math.PI * 2, d = 20 + rand() * 16, t0 = 520 + i * 55 + rand() * 40, dur = 340 + rand() * 100;
    const ox = Math.cos(a) * d, oy = Math.sin(a) * d * 0.8, m0 = bodyMap(EM, t0), m1 = bodyMap(EM, t0 + dur);
    fx(k.pic('spark', EM, 5, 5), [[t0, { transform: `${k.T(m0[0] - EM[0] + ox, m0[1] - EM[1] + oy)} scale(.5)`, opacity: 0 }, 'ease-in'],
      [t0 + 70, { transform: `${k.T(m0[0] - EM[0] + ox * 0.9, m0[1] - EM[1] + oy * 0.9)} scale(1)`, opacity: 1 }, 'ease-in'],
      [t0 + dur, { transform: `${k.T(m1[0] - EM[0], m1[1] - EM[1])} scale(.35)`, opacity: 0.9 }], [t0 + dur + 50, { transform: `${k.T(m1[0] - EM[0], m1[1] - EM[1])} scale(.1)`, opacity: 0 }]]);
  }
  // the ground lit under it
  fx(k.lightIn('g-warm', [Fx, 160], 190, 40, { under: true }), [[300, { opacity: 0 }, 'ease-out'], [1000, { opacity: 0.35 }, eio], [1250, { opacity: 0.6 }, eio], [2000, { opacity: 0.25 }, eio], [2900, { opacity: 0 }]]);

  // ── the spring: dust and sparks kicked up behind it
  const sgn = M(1200) >= 0 ? 1 : -1; // which way "behind" is, on the page
  for (let i = 0; i < 6; i++) {
    const t = 1120 + i * 60, r = Math.round(rand() * 360), [x, y] = bodyMap([170 + rand() * 30, 142], t);
    fx(k.picIn('smoke', [x, Math.min(150, y + 6)], 24, 24, { lit: false }), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 160, { transform: `${k.T(7 * sgn, -3)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 700, { transform: `${k.T(20 * sgn, -9)} rotate(${r + 40}deg) scale(1.9)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 14; i++) {
    const t = 1100 + i * 35 + rand() * 20, [x, y] = bodyMap([170 + rand() * 40, 118 + rand() * 20], t), a = rand() * 0.9 - 0.45, v = 14 + rand() * 24;
    fx(k.pic('spark', [x, y], 4, 4), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 70, { transform: 'scale(1)', opacity: 1 }], [t + 500, { transform: `${k.T(sgn * Math.cos(a) * v, Math.sin(a) * v + 10)} scale(.2)`, opacity: 0 }]]);
  }

  // ── the strike (IMPACT 1250)
  const IM = 1250;
  const flash = [[IM - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [IM + 200, { transform: 'scale(1.9)', opacity: 0.6 }]];
  for (let t = IM + 340, i = 0; t < 2000; t += 110, i++) flash.push([t, { transform: `scale(${i % 2 ? 1.4 : 1.15})`, opacity: i % 2 ? 0.5 : 0.35 }, eio]);
  flash.push([2300, { transform: 'scale(.9)', opacity: 0 }]);
  fx(k.light('g-warm', T, 56), flash);
  fx(k.light('g-warm', T, 22), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 30, { transform: 'scale(1.6)', opacity: 1 }], [IM + 160, { transform: 'scale(2.6)', opacity: 0 }]]);
  fx(k.pic(ring, T, 56, 56), [[IM, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(.4)', opacity: 0.95 }, 'ease-out'], [IM + 400, { transform: 'scale(1.05)', opacity: 0 }]]);
  fx(k.pic(ring, T, 56, 56), [[IM + 90, { transform: 'scale(.1)', opacity: 0 }, 'ease-out'], [IM + 150, { transform: 'scale(.3)', opacity: 0.6 }, 'ease-out'], [IM + 520, { transform: 'scale(.75)', opacity: 0 }]]);
  // arcs forking out of the strike
  const spokes = [boltSvg(26, 14, 5, 0.7), boltSvg(26, 14, 9, 0.7), boltSvg(26, 14, 14, 0.7)];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * 360 + rand() * 30, r = 14 + rand() * 6, t = IM + 10 + rand() * 80, rad = (a * Math.PI) / 180;
    fx(k.pic(spokes[i % 3], [T[0] + Math.cos(rad) * r, T[1] + Math.sin(rad) * r], 26, 14), [[t, { transform: `rotate(${a.toFixed(0)}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 40, { transform: `rotate(${a.toFixed(0)}deg) scale(1)`, opacity: 1 }], [t + 90, { transform: `rotate(${a.toFixed(0)}deg) scale(1)`, opacity: 0.2 }], [t + 130, { transform: `rotate(${a.toFixed(0)}deg) scale(1.1)`, opacity: 0.9 }], [t + 200, { transform: `rotate(${a.toFixed(0)}deg) scale(1.2)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + rand() * 0.5, d = 12 + rand() * 12, r = Math.round(rand() * 360), t = IM + rand() * 30;
    const px = Math.cos(a) * d, py = Math.sin(a) * d * 0.75 - 2;
    fx(k.pic(i % 3 === 2 ? 'puffCool' : i % 3 ? 'puffHot' : 'puff', T, 15, 15), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 70, { transform: `${k.T(px * 0.5, py * 0.5)} rotate(${r + 30}deg) scale(1)`, opacity: 0.95 }, 'ease-out'],
      [t + 260, { transform: `${k.T(px, py - 3)} rotate(${r + 70}deg) scale(1.5)`, opacity: 0.6 }], [t + 520, { transform: `${k.T(px * 1.1, py - 10)} rotate(${r + 100}deg) scale(1.9)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 14; i++) {
    const a = -Math.PI * (0.05 + rand() * 0.9), v = 16 + rand() * 30, t = IM + rand() * 40, life = 380 + rand() * 340, sz = 3 + rand() * 3;
    const px = (f) => Math.cos(a) * v * f, py = (f) => Math.sin(a) * v * f + 38 * f * f;
    fx(k.pic('spark', T, sz, sz), [0, 0.3, 0.65, 1].map((f, j) => [t + life * f, { transform: `${k.T(px(f), py(f))} scale(${(1 - 0.75 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']));
  }
  const flicker = (el, on, off) => {
    const list = [[on, { transform: 'scale(.6, .12)', opacity: 0 }, 'ease-out'], [on + 110, { transform: 'scale(1, 1)', opacity: 0.95 }, eio]];
    for (let t = on + 110, i = 1; (t += 80 + rand() * 60) < off; i++) list.push([t, { transform: `scale(${(i % 2 ? 0.88 : 1.06).toFixed(2)}, ${(i % 2 ? 1.1 : 0.92).toFixed(2)}) skewX(${i % 2 ? 5 : -5}deg)`, opacity: 0.8 + (i % 2) * 0.15 }, eio]);
    list.push([off, { transform: 'scale(.5, .2)', opacity: 0 }]);
    return fx(el, list);
  };
  for (let i = 0; i < 3; i++) flicker(k.pic(i % 2 ? 'flame' : 'flame2', [T[0] + (i - 1) * 6, T[1] + 6], 9 + rand() * 3, 15 + rand() * 8, { base: true }), IM + 60 + i * 60, 1900 + rand() * 250);
  for (let i = 0; i < 3; i++) {
    const t = IM + 260 + i * 200, r = Math.round(rand() * 360);
    fx(k.pic('smoke', [T[0] + (rand() - 0.5) * 12, T[1] - 4], 24, 24, { lit: false, low: true }), [[t, { transform: `rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'],
      [t + 300, { transform: `${k.T(-2, -10)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 1100, { transform: `${k.T(-7, -42)} rotate(${r + 50}deg) scale(1.9)`, opacity: 0 }]]);
  }
  // embers shaken off it as it skids and settles
  for (let i = 0; i < 8; i++) {
    const t = 1500 + i * 150 + rand() * 60, [x, y] = bodyMap([105 + rand() * 80, 104 + rand() * 18], t), r = rand() - 0.5;
    fx(k.pic('spark', [x, y], 4, 4), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 90, { transform: 'scale(1)', opacity: 1 }], [t + 700, { transform: `${k.T(r * 14, -16 - rand() * 12)} scale(.25)`, opacity: 0 }]]);
  }
}
