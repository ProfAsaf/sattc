// Reckless Initiate: he winds up and charges, hurling the torch's fire at his target.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker, element fire.
//   0-350     (if his target is behind him he turns round, through a sliver, as
//             Ashmaw's head does)
//   0-1200    GATHER: he coils (crouches, leans back), the spear draws back and its
//             tip lifts; the torch flares, hungry (the 2 Energy poured in), embers
//             streaming to it; his hair falls; a shudder before he goes.
//   1200-1320 he lunges (leaning into it, hair snapping back flat), the spear
//             thrusts through his hands; dust kicks from his feet.
//   1250      RELEASE: a fireball leaves the torch's tip (the lance's violet-less
//             cousin: a flare of orange) and flies to T, shedding puffs and embers.
//   1500      IMPACT at T: flash, rings, billows and sparks, flames catch, smoke.
//   1500-3000 the cost: "it takes 1 damage". He flinches and reels back, a red-hot
//             flash and sparks off his chest, hunched, then rights himself; the
//             torch gutters low, smoke streaming; the hair falls and floats back.
// BEATS: release 1250, impact 1500, settle 3000. At rest as drawn by 3000 (END 4200).
//
// Aimed: T = k.aim || [270, 112]. Everything that flies is on the overlay.
export const END = 4200;
export const BEATS = { release: 1250, impact: 1500, settle: 3000 };
export const STILLS = [450, 950, 1230, 1330, 1520, 1700, 2200, 3500];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 200 + 55 * c * c, 110 + 120 * c * c * c, Math.min(1, c * c * 2.6)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const sp = k.spec, [Fx, Fy] = sp.feet, H = sp.hand, HD = sp.head, TO = sp.torch, AX = sp.axis;
  const MID = 165;
  const parts = { body: k.part('body'), spear: k.part('spear'), hair: k.part('hair'), front: k.part('front'), tip: k.part('tip'), flame: k.part('flame') };
  const T = k.aim || [270, 112];
  const turn = T[0] < MID - 10; // the target is behind him
  k.css('.g-hit { border-radius: 50%; background: radial-gradient(circle, rgba(255,210,150,.95), rgba(255,90,40,.55) 30%, rgba(220,40,10,.2) 58%, rgba(200,30,0,0) 72%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#ffd79a" stroke-width="6" filter="url(#b)"/>', 100, 100);

  // ── tracks: a value over time, smooth between its points
  const track = (pts) => (ms) => {
    let i = pts.length - 1;
    while (i > 0 && pts[i][0] > ms) i--;
    if (i === pts.length - 1) return pts[i][1];
    const [t0, v0, e] = pts[i], [t1, v1] = pts[i + 1], f = Math.min(1, Math.max(0, (ms - t0) / (t1 - t0)));
    return v0 + (v1 - v0) * (e === 'out' ? 1 - (1 - f) * (1 - f) : e === 'in' ? f * f : k.smooth(f));
  };
  const M = turn ? track([[0, 1], [150, 1], [330, 0.06], [520, -1], [2750, -1], [2900, 0.06], [3100, 1]]) : () => 1;
  // his body: forward is +x, a forward lean is +rotation
  const bdx = track([[0, 0], [380, -2], [700, -3.2], [1000, -4.2], [1200, -4.8, 'in'], [1320, 7, 'out'], [1500, 9], [1620, 4.5, 'out'], [1850, -3.5], [2250, 1.2], [2700, -0.3], [3000, 0]]);
  const bdy = track([[0, 0], [380, 1.5], [800, 2.4], [1200, 2.6, 'in'], [1320, -1.4, 'out'], [1500, -0.4], [1700, 1.6], [2000, 2.2], [2500, 0.6], [3000, 0]]);
  const brot = track([[0, 0], [380, -3], [800, -5], [1000, -6.5], [1200, -7.5, 'in'], [1330, 7, 'out'], [1500, 7.5], [1640, -1], [1800, -6], [2050, -3.5], [2500, 1.2], [3000, 0]]);
  // the spear: slides along its length (+ is forward), and turns about the rear hand
  const sSlide = track([[0, 0], [400, -6], [1000, -9.5], [1200, -11, 'in'], [1330, 9, 'out'], [1500, 12], [1700, 2], [2100, -1], [2600, 0.4], [3000, 0]]);
  const sRot = track([[0, 0], [400, -5], [1000, -9], [1200, -11, 'in'], [1330, 6, 'out'], [1500, 7], [1750, -3], [2200, 1.5], [3000, 0]]);
  const hRot = track([[0, 0], [400, -5], [900, -9], [1200, -12, 'in'], [1330, 8, 'out'], [1500, 9], [1700, -10], [2000, 4], [2300, -4], [2700, 1.5], [3100, 0]]);
  // the torch flame's size: ravenous as it's fed, thrown with the spear, burnt low, then back
  const fSc = track([[0, 1], [400, 1.25], [800, 1.55], [1000, 1.8], [1200, 2.15], [1330, 2.4, 'out'], [1500, 0.75], [1800, 0.55], [2400, 0.9], [3000, 1]]);

  const rot = (v, d) => { const a = (d * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; };
  const bodyMap = (p, ms) => { const m = M(ms), r = rot([p[0] - Fx, p[1] - Fy], brot(ms)); return [MID + m * (Fx + r[0] + bdx(ms) - MID), Fy + r[1] + bdy(ms)]; };
  const spearMap = (p, ms) => {
    const r = rot([p[0] - H[0], p[1] - H[1]], sRot(ms)), s = sSlide(ms);
    return bodyMap([H[0] + r[0] + s * AX[0], H[1] + r[1] + s * AX[1]], ms);
  };
  const tf = (piv, map, rotF, sc = 1) => (ms) => {
    const [x, y] = map(piv, ms);
    return `translate(${((x - piv[0]) * u).toFixed(2)}px, ${((y - piv[1]) * u).toFixed(2)}px) scale(${(M(ms) * sc).toFixed(3)}, ${sc.toFixed(3)}) rotate(${rotF(ms).toFixed(2)}deg)`;
  };
  const grid = [];
  for (let t = 0; t <= 3100; t += 50) grid.push(t);
  grid.push(1250, 1500);
  const uniq = [...new Set(grid)].sort((a, b) => a - b);
  const play = (el, f) => act(el, uniq.map((t) => [t, { transform: f(t) }, 'linear']));
  const rB = (ms) => brot(ms);
  play(parts.body, tf([Fx, Fy], bodyMap, rB));
  play(parts.front, tf([Fx, Fy], bodyMap, rB));
  play(parts.spear, tf(H, spearMap, (ms) => brot(ms) + sRot(ms)));
  play(parts.tip, tf(H, spearMap, (ms) => brot(ms) + sRot(ms)));
  play(parts.hair, tf(HD, bodyMap, (ms) => brot(ms) + hRot(ms)));
  {
    const t0 = (ms) => tf(TO, spearMap, (m) => brot(m) + sRot(m))(ms);
    // the flame: the spear's pose with its own size, about its base
    act(parts.flame, uniq.map((t) => {
      const [x, y] = spearMap(TO, t), m = M(t), s = fSc(t), fl = Math.sin(t / 55) * 0.05;
      return [t, { transform: `translate(${((x - TO[0]) * u).toFixed(2)}px, ${((y - TO[1]) * u).toFixed(2)}px) scale(${(m * (s * 0.8 + 0.2) * (1 + fl)).toFixed(3)}, ${(s * (1 - fl)).toFixed(3)}) rotate(${(brot(t) + sRot(t) + Math.cos(t / 70) * 2).toFixed(2)}deg)` }, 'linear'];
    }));
    void t0;
  }

  // an effect riding a point of the spear / the body: `list` is [ms, scale, opacity] samples every 50 ms
  const ride = (el, pt, map, list, extra = '') => {
    const ks = [];
    for (let i = 0; i < list.length; i++) {
      const [t0, s0, o0] = list[i], nx = list[i + 1];
      const put = (t, s, o) => { const [x, y] = map(pt, t); ks.push([t, { transform: `${k.T(x - pt[0], y - pt[1])} ${extra}scale(${s.toFixed(3)})`, opacity: +o.toFixed(3) }, 'linear']); };
      put(t0, s0, o0);
      if (nx) for (let t = t0 + 50; t < nx[0] - 25; t += 50) { const f = (t - t0) / (nx[0] - t0); put(t, s0 + (nx[1] - s0) * f, o0 + (nx[2] - o0) * f); }
    }
    return fx(el, ks);
  };
  const tipAt = (ms) => spearMap(sp.emit, ms);
  const flick = (a, b, lo, hi, step = 90) => { const l = [[a, 0.3, 0]]; for (let t = a + 80, i = 0; t < b; t += step, i++) l.push([t, i % 2 ? hi : lo, 0.9 + (i % 2) * 0.1]); l.push([b, 0.5, 0]); return l; };

  // ── the torch: a light that swells as it's fed, blazes on the thrust, gutters after
  ride(k.light('g-warm', sp.emit, 46), sp.emit, spearMap, [[80, 0.3, 0], [500, 0.8, 0.5], [1000, 1.1, 0.8], [1200, 1.3, 0.95], [1330, 1.9, 1], [1500, 1.0, 0.7], [1800, 0.55, 0.4], [2400, 0.7, 0.35], [3000, 0.8, 0]]);
  // the flame's hot heart, flaring a second flame over it as it's fed
  ride(k.pic('puffHot', [TO[0] + 1, TO[1] - 8], 22, 22), [TO[0] + 1, TO[1] - 8], spearMap, [[300, 0.3, 0], [700, 0.7, 0.55], [1000, 1.0, 0.8], [1200, 1.25, 0.9], [1330, 1.5, 0.95], [1450, 0.6, 0.3], [1600, 0.3, 0]]);
  // embers streaming in to the torch while he gathers
  for (let i = 0; i < 12; i++) {
    const a = rand() * Math.PI * 2, d = 24 + rand() * 18, t0 = 330 + i * 70 + rand() * 40, dur = 360 + rand() * 120;
    const ox = Math.cos(a) * d, oy = Math.sin(a) * d * 0.8 - 6, m0 = tipAt(t0), m1 = tipAt(t0 + dur);
    fx(k.pic('spark', sp.emit, 5, 5), [[t0, { transform: `${k.T(m0[0] - sp.emit[0] + ox, m0[1] - sp.emit[1] + oy)} scale(.5)`, opacity: 0 }, 'ease-in'],
      [t0 + 80, { transform: `${k.T(m0[0] - sp.emit[0] + ox * 0.9, m0[1] - sp.emit[1] + oy * 0.9)} scale(1)`, opacity: 1 }, 'ease-in'],
      [t0 + dur, { transform: `${k.T(m1[0] - sp.emit[0], m1[1] - sp.emit[1])} scale(.35)`, opacity: 0.9 }], [t0 + dur + 50, { transform: `${k.T(m1[0] - sp.emit[0], m1[1] - sp.emit[1])} scale(.1)`, opacity: 0 }]]);
  }
  // a glow in his hands as the energy goes in
  ride(k.light('g-warm', H, 18), H, bodyMap, [[500, 0.4, 0], [900, 0.8, 0.4], [1200, 1.0, 0.55], [1330, 1.1, 0.6], [1500, 0.7, 0.3], [1700, 0.4, 0]]);

  // ── the lunge: dust kicked from his feet
  for (let i = 0; i < 5; i++) {
    const foot = i % 2 ? [187, 152] : [114, 164], t = 1290 + i * 55, r = Math.round(rand() * 360);
    const [x0, y0] = bodyMap(foot, t);
    fx(k.picIn('smoke', [x0 + (rand() - 0.5) * 6, y0 - 2], 22, 22, { lit: false }), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 160, { transform: `${k.T(-5 * M(t), -4)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 650, { transform: `${k.T(-14 * M(t), -10)} rotate(${r + 40}deg) scale(1.8)`, opacity: 0 }]]);
  }

  // ── the fireball (RELEASE 1250 to IMPACT 1500): from the torch's tip to T, bowed upward
  const E = tipAt(1290), C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 16];
  const bz = (t) => { const q = 1 - t; return [q * q * E[0] + 2 * q * t * C[0] + t * t * T[0], q * q * E[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const fly = (el, t0, t1, scaleFn, opFn, rot0 = 0, spin = 140, step = 25) => {
    const ks = [];
    for (let t = t0; ; t += step) {
      const tt = Math.min(t, t1), f = (tt - t0) / (t1 - t0), q = f * f * 0.4 + f * 0.6, [x, y] = bz(q);
      ks.push([tt, { transform: `${k.T(x - E[0], y - E[1])} rotate(${(rot0 + f * spin).toFixed(0)}deg) scale(${scaleFn(f).toFixed(2)})`, opacity: opFn(f) }, 'linear']);
      if (tt >= t1) break;
    }
    return fx(el, ks);
  };
  fly(k.light('g-warm', E, 30), 1250, 1500, (f) => 0.9 + 0.35 * f, (f) => (f > 0.96 ? 0.4 : 1));
  fly(k.pic('puffHot', E, 20, 20), 1250, 1500, (f) => 0.7 + 0.5 * f, (f) => (f > 0.96 ? 0.4 : 0.95));
  fly(k.pic('puff', E, 15, 15), 1255, 1500, (f) => 0.7 + 0.5 * f, (f) => (f > 0.96 ? 0.3 : 0.85), 90);
  // flame tongues streaming back off it, along the line of flight
  const dir = Math.atan2(T[1] - E[1], T[0] - E[0]), back = (dir * 180) / Math.PI - 90 + 180 + 180; // 'up' of the flame points back along the path
  for (let i = 0; i < 4; i++) {
    const lag = 22 + i * 18, ks = [];
    for (let t = 1250 + lag; ; t += 25) {
      const tt = Math.min(t, 1500 + lag * 0.4), f = (tt - 1250 - lag) / (250 + lag * 0.4 - lag), q = Math.min(1, Math.max(0, f)) * Math.min(1, Math.max(0, f)) * 0.4 + Math.min(1, Math.max(0, f)) * 0.6, [x, y] = bz(q);
      ks.push([tt, { transform: `${k.T(x - E[0], y - E[1])} rotate(${(back + (i - 1.5) * 9).toFixed(0)}deg) scale(${(0.9 - 0.2 * f + i * 0.05).toFixed(2)}, ${(1.5 - 0.3 * f).toFixed(2)})`, opacity: f > 0.9 ? 0.2 : 0.85 - 0.12 * i }, 'linear']);
      if (tt >= 1500 + lag * 0.4) break;
    }
    fx(k.pic(i % 2 ? 'flame' : 'flame2', E, 7, 13, { base: true }), ks);
  }
  // left hanging along the way: puffs and sparks, rising and fading
  for (let i = 0; i < 11; i++) {
    const f = 0.05 + (i / 11) * 0.88, t = 1250 + 250 * Math.sqrt(f) * 0.9, p = bz(f), r = Math.round(rand() * 360), id = i % 3;
    const dx = p[0] - E[0], dy = p[1] - E[1];
    fx(k.pic(id === 2 ? 'spark' : id === 1 ? 'puffCool' : 'puff', E, id === 2 ? 5 : 11, id === 2 ? 5 : 11), [[t, { transform: `${k.T(dx, dy)} rotate(${r}deg) scale(.6)`, opacity: 0 }, 'ease-out'], [t + 60, { transform: `${k.T(dx, dy)} rotate(${r + 20}deg) scale(.95)`, opacity: id === 2 ? 1 : 0.7 }],
      [t + 380, { transform: `${k.T(dx + (rand() - 0.5) * 6, dy - 7 - rand() * 6)} rotate(${r + 60}deg) scale(${id === 2 ? 0.2 : 1.4})`, opacity: 0 }]]);
  }

  // ── the strike (IMPACT 1500)
  const IM = 1500;
  const flash = [[IM - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [IM + 200, { transform: 'scale(1.9)', opacity: 0.6 }]];
  for (let t = IM + 340, i = 0; t < 2200; t += 110, i++) flash.push([t, { transform: `scale(${i % 2 ? 1.4 : 1.15})`, opacity: i % 2 ? 0.55 : 0.4 }, eio]);
  flash.push([2500, { transform: 'scale(.9)', opacity: 0 }]);
  fx(k.light('g-warm', T, 58), flash);
  fx(k.light('g-warm', T, 22), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 30, { transform: 'scale(1.6)', opacity: 1 }], [IM + 160, { transform: 'scale(2.6)', opacity: 0 }]]);
  fx(k.pic(ring, T, 56, 56), [[IM, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(.4)', opacity: 0.95 }, 'ease-out'], [IM + 400, { transform: 'scale(1.05)', opacity: 0 }]]);
  fx(k.pic(ring, T, 56, 56), [[IM + 90, { transform: 'scale(.1)', opacity: 0 }, 'ease-out'], [IM + 150, { transform: 'scale(.3)', opacity: 0.6 }, 'ease-out'], [IM + 520, { transform: 'scale(.75)', opacity: 0 }]]);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rand() * 0.5, d = 12 + rand() * 12, r = Math.round(rand() * 360), t = IM + rand() * 30;
    const dx = Math.cos(a) * d, dy = Math.sin(a) * d * 0.75 - 2;
    fx(k.pic(i % 3 === 2 ? 'puffCool' : i % 3 ? 'puffHot' : 'puff', T, 16, 16), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 70, { transform: `${k.T(dx * 0.5, dy * 0.5)} rotate(${r + 30}deg) scale(1)`, opacity: 0.95 }, 'ease-out'],
      [t + 260, { transform: `${k.T(dx, dy - 3)} rotate(${r + 70}deg) scale(1.5)`, opacity: 0.6 }], [t + 520, { transform: `${k.T(dx * 1.1, dy - 10)} rotate(${r + 100}deg) scale(1.9)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 16; i++) {
    const a = -Math.PI * (0.05 + rand() * 0.9), v = 16 + rand() * 32, t = IM + rand() * 40, life = 380 + rand() * 340, sz = 3 + rand() * 3;
    const px = (f) => Math.cos(a) * v * f, py = (f) => Math.sin(a) * v * f + 38 * f * f;
    fx(k.pic('spark', T, sz, sz), [0, 0.3, 0.65, 1].map((f, j) => [t + life * f, { transform: `${k.T(px(f), py(f))} scale(${(1 - 0.75 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']));
  }
  const flicker = (el, on, off) => {
    const list = [[on, { transform: 'scale(.6, .12)', opacity: 0 }, 'ease-out'], [on + 110, { transform: 'scale(1, 1)', opacity: 0.95 }, eio]];
    for (let t = on + 110, i = 1; (t += 80 + rand() * 60) < off; i++) list.push([t, { transform: `scale(${(i % 2 ? 0.88 : 1.06).toFixed(2)}, ${(i % 2 ? 1.1 : 0.92).toFixed(2)}) skewX(${i % 2 ? 5 : -5}deg)`, opacity: 0.8 + (i % 2) * 0.15 }, eio]);
    list.push([off, { transform: 'scale(.5, .2)', opacity: 0 }]);
    return fx(el, list);
  };
  for (let i = 0; i < 3; i++) flicker(k.pic(i % 2 ? 'flame' : 'flame2', [T[0] + (i - 1) * 6, T[1] + 6], 9 + rand() * 3, 15 + rand() * 8, { base: true }), IM + 60 + i * 60, 1850 + rand() * 250);
  for (let i = 0; i < 4; i++) {
    const t = IM + 280 + i * 190, r = Math.round(rand() * 360);
    fx(k.pic('smoke', [T[0] + (rand() - 0.5) * 12, T[1] - 4], 24, 24, { lit: false, low: true }), [[t, { transform: `rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'],
      [t + 300, { transform: `${k.T(-2, -10)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 1100, { transform: `${k.T(-7, -42)} rotate(${r + 50}deg) scale(1.9)`, opacity: 0 }]]);
  }

  // ── the cost (1 damage): a hot flash on his chest as he reels, sparks flying off him
  const chest = sp.hit;
  ride(k.light('g-hit', chest, 28), chest, bodyMap, [[1460, 0.3, 0], [1540, 1.2, 1], [1640, 1.0, 0.8], [1800, 0.7, 0.5], [2100, 0.5, 0.2], [2400, 0.4, 0]]);
  for (let i = 0; i < 9; i++) {
    const t = 1520 + i * 60 + rand() * 30, [x, y] = bodyMap([chest[0] + (rand() - 0.5) * 10, chest[1] + (rand() - 0.5) * 12], t), a = -Math.PI * (0.1 + rand() * 0.8), v = 8 + rand() * 14;
    const dir = M(t) >= 0 ? -1 : 1;
    fx(k.pic('spark', [x, y], 4, 4), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 90, { transform: `${k.T(dir * Math.abs(Math.cos(a)) * v * 0.4, Math.sin(a) * v * 0.4)} scale(1)`, opacity: 1 }],
      [t + 600, { transform: `${k.T(dir * Math.abs(Math.cos(a)) * v, Math.sin(a) * v + 16)} scale(.2)`, opacity: 0 }]]);
  }
  // his scorched hem throws embers as he rights himself
  for (let i = 0; i < 7; i++) {
    const t = 1700 + i * 130 + rand() * 60, [x, y] = bodyMap([110 + rand() * 62, 126 + rand() * 6], t), r = rand() - 0.5;
    fx(k.pic('spark', [x, y], 4, 4), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 90, { transform: 'scale(1)', opacity: 1 }], [t + 700, { transform: `${k.T(r * 14 - 6 * M(t), -16 - rand() * 12)} scale(.25)`, opacity: 0 }]]);
  }
  // the torch gutters: smoke pouring off it
  for (let i = 0; i < 5; i++) {
    const t = 1550 + i * 240, r = Math.round(rand() * 360), [x, y] = spearMap([TO[0], TO[1] - 6], t);
    fx(k.pic('smoke', [x, y], 24, 24, { lit: false }), [[t, { transform: `rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'],
      [t + 350, { transform: `${k.T(-5 * M(t), -9)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 1500, { transform: `${k.T(-26 * M(t), -34)} rotate(${r + 50}deg) scale(2)`, opacity: 0 }]]);
  }
}
