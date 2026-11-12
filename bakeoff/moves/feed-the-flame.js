// Feed the Flame: the hooded feeder gives the shadow-creature to the fire, and the
// fire answers with a blast at its target.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker (the spell is the
// attack: the blast), element fire.
//   0-600     the creature struggles in his raised hands (the arms lift it, he leans
//             back, it kicks and twists, the fire shrinking low as if wary).
//   600-1050  he leans in and lowers it over the flames, struggling harder.
//   1050-1200 he lets go (shoves): it plunges into the bowl, shrinking, and is gone;
//             a ring of orange light at the bowl, a curl of shadow-smoke rising.
//   1200-1320 GATHER: the fire gulps, flaring then drawn down to nothing, embers
//             streaming into it from all round, the hall's light dipping.
//   1320      RELEASE: the fire erupts, tongues leaping, leaning toward T, the hall
//             blazing; a fireball leaves the flames' top and flies an arc to T.
//   1650      IMPACT at T: flash, rings, billows and sparks, flames catch, smoke.
//   1650-3000 the blast's kick: the brazier jolts, he is thrown back, arm up over his
//             face; embers shower from the fire as it sinks back to its dance.
//   3000-3500 a curl of smoke, and the creature is back as drawn (a new offering).
// BEATS: release 1320, impact 1650, settle 3000. END 4200.
//
// Aimed: T = k.aim || [276, 34]. The fire leans, and the fireball is bent, toward T
// whichever side it is on. Everything that flies is on the overlay.
export const END = 4200;
export const BEATS = { release: 1320, impact: 1650, settle: 3000 };
export const STILLS = [400, 900, 1130, 1280, 1420, 1650, 2300, 3700];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 200 + 55 * c * c, 110 + 120 * c * c * c, Math.min(1, c * c * 2.6)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const sp = k.spec, [Fx, Fy] = sp.feet, S = sp.shoulder, G = sp.grip, HELD = sp.held, BOWL = sp.bowl, EM = sp.emit, BASE = sp.base;
  const P = { fireA: k.part('fireA'), fireB: k.part('fireB'), fireC: k.part('fireC'), brazier: k.part('brazier'), man: k.part('man'), arms: k.part('arms'), thing: k.part('thing'), eyes: k.part('eyes') };
  const T = k.aim || [276, 34];
  const sgn = T[0] >= BASE[0] ? 1 : -1;
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#ffd79a" stroke-width="6" filter="url(#b)"/>', 100, 100);

  const track = (pts) => (ms) => {
    let i = pts.length - 1;
    while (i > 0 && pts[i][0] > ms) i--;
    if (i === pts.length - 1) return pts[i][1];
    const [t0, v0, e] = pts[i], [t1, v1] = pts[i + 1], f = Math.min(1, Math.max(0, (ms - t0) / (t1 - t0)));
    return v0 + (v1 - v0) * (e === 'out' ? 1 - (1 - f) * (1 - f) : e === 'in' ? f * f : k.smooth(f));
  };
  // the feeder: leans (+ is toward the fire) about his feet; his arms turn about the shoulder (+ lowers them to the fire)
  const lean = track([[0, 0], [300, -3], [550, -4], [900, 3], [1040, 4.5, 'in'], [1200, 2], [1320, -7, 'out'], [1500, -9], [1900, -4.5], [2500, -1], [3000, 0]]);
  const armR = track([[0, 0], [300, -12], [550, -10], [800, 5], [1040, 15, 'in'], [1160, 11], [1320, -32, 'out'], [1750, -27], [2250, -11], [2750, 1.5], [3000, 0]]);
  const rot = (v, d) => { const a = (d * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; };
  const manMap = (p, ms) => { const r = rot([p[0] - Fx, p[1] - Fy], lean(ms)); return [Fx + r[0], Fy + r[1]]; };
  const armsMap = (p, ms) => { const r = rot([p[0] - S[0], p[1] - S[1]], armR(ms)); return manMap([S[0] + r[0], S[1] + r[1]], ms); };

  const grid = [];
  for (let t = 0; t <= 3100; t += 40) grid.push(t);
  grid.push(1040, 1320, 1650);
  const uniq = [...new Set(grid)].sort((a, b) => a - b);
  act(P.man, uniq.map((t) => [t, { transform: `rotate(${lean(t).toFixed(2)}deg)` }, 'linear']));
  act(P.arms, uniq.map((t) => { const [x, y] = manMap(S, t); return [t, { transform: `translate(${((x - S[0]) * u).toFixed(2)}px, ${((y - S[1]) * u).toFixed(2)}px) rotate(${(lean(t) + armR(t)).toFixed(2)}deg)` }, 'linear']; }));

  // ── the creature: carried by his hands (struggling), plunged into the bowl, gone, then back as drawn
  const wig = track([[0, 2], [500, 5], [1040, 10]]);
  const thingKeys = (() => {
    const ks = [];
    const sample = (t) => {
      let dx, dy, rt, sc = 1, op = 1;
      if (t <= 1040) {
        const [x, y] = armsMap(G, t), a = wig(t), w = Math.sin(t / 43) * a, ph = Math.sin(t / 31) * (0.5 + a * 0.12);
        dx = x - G[0] + ph; dy = y - G[1] + Math.cos(t / 37) * (0.4 + a * 0.1); rt = w;
      } else {
        const [x, y] = armsMap(G, 1040), f = Math.min(1, (t - 1040) / 150), e = f * f;
        dx = x - G[0] + (BOWL[0] - HELD[0] - (x - G[0])) * e; dy = y - G[1] + (BOWL[1] + 6 - HELD[1] - (y - G[1])) * e; rt = Math.sin(t / 43) * 10 + 25 * f; sc = 1 - 0.75 * e; op = f < 0.7 ? 1 : 1 - (f - 0.7) / 0.3;
      }
      return { transform: `translate(${(dx * u).toFixed(2)}px, ${(dy * u).toFixed(2)}px) rotate(${rt.toFixed(2)}deg) scale(${sc.toFixed(3)})`, opacity: +op.toFixed(3) };
    };
    for (let t = 0; t <= 1190; t += 40) ks.push([t, sample(t), 'linear']);
    ks.push([1190, sample(1190), 'linear']);
    ks.push([1200, { transform: 'translate(15px, 30px) rotate(25deg) scale(.25)', opacity: 0 }, 'linear'], [3000, { transform: 'translate(0px, 8px) rotate(0deg) scale(.6)', opacity: 0 }, 'ease-out']);
    ks.push([3250, { transform: 'translate(0px, 1px) rotate(0deg) scale(1.06)', opacity: 1 }, eio], [3500, { transform: 'translate(0px, 0px) rotate(0deg) scale(1)', opacity: 1 }]);
    return ks;
  })();
  // (the plunge's translate is in units: the keyframes above are px, so scale by u where it was written by hand)
  const thingKs = thingKeys.map(([t, v, e]) => [t, v, e]);
  const fixHand = (ks) => ks.map(([t, v, e]) => (t >= 1200 ? [t, { ...v, transform: v.transform.replace(/translate\(([-\d.]+)px, ([-\d.]+)px\)/, (m, a, b) => `translate(${(a * u).toFixed(2)}px, ${(b * u).toFixed(2)}px)`) }, e] : [t, v, e]));
  const finalKs = fixHand(thingKs);
  act(P.thing, finalKs);
  act(P.eyes, finalKs);

  // ── the fire: low and wary, gulping, drawn in, then erupting, leaning toward T, and sinking back to its dance
  const fy = track([[0, 1], [300, 0.82], [700, 0.72], [1000, 0.88], [1090, 1.0], [1160, 1.32, 'out'], [1230, 0.6, 'in'], [1320, 0.46], [1340, 1.28, 'out'], [1480, 1.62], [1900, 1.32], [2500, 1.06], [3000, 1]]);
  const fx_ = track([[0, 1], [700, 0.92], [1090, 1.0], [1160, 1.2], [1230, 0.78], [1320, 0.7], [1350, 1.25, 'out'], [1700, 1.1], [2500, 1.02], [3000, 1]]);
  const skew = track([[0, 0], [1100, 0], [1320, 0], [1360, 11 * sgn, 'out'], [1750, 6 * sgn], [2400, 1 * sgn], [3000, 0]]);
  const firePart = (el, ph, amp) => act(el, uniq.map((t) => {
    const w = Math.sin(t / (52 + ph * 9) + ph * 2) * amp * (0.55 + 0.45 * Math.min(1, fy(t))), s2 = Math.sin(t / (71 + ph * 13) + ph) * amp * 2.2;
    return [t, { transform: `scale(${(fx_(t) * (1 - w * 0.6)).toFixed(3)}, ${(fy(t) * (1 + w)).toFixed(3)}) skewX(${(skew(t) + s2 * (t > 40 ? 1 : 0) * (t < 3000 ? 1 : 0) * 0.8).toFixed(2)}deg)` }, 'linear'];
  }));
  firePart(P.fireA, 0, 0.05); firePart(P.fireB, 1, 0.06); firePart(P.fireC, 2, 0.075);
  // the brazier: jolts with the blast
  act(P.brazier, uniq.map((t) => {
    const e = t < 1320 ? (t > 1090 && t < 1230 ? 0.25 * Math.sin((t - 1090) / 18) : 0) : Math.max(0, 1 - (t - 1320) / 450) * Math.sin((t - 1320) / 36);
    return [t, { transform: `translate(0px, ${(e * 1.7 * u).toFixed(2)}px)` }, 'linear'];
  }));

  // ── light: the hall dips, then blazes
  fx(k.lightIn('g-warm', [190, 110], 340, 240), [[0, { opacity: 0 }, 'ease-out'], [700, { opacity: 0.08 }, eio], [1160, { opacity: 0.42 }, 'ease-out'], [1230, { opacity: 0.0 }, 'ease-in'], [1330, { opacity: 0.5 }, 'ease-out'], [1650, { opacity: 0.45 }, eio], [2300, { opacity: 0.25 }, eio], [3000, { opacity: 0 }]]);
  fx(k.lightIn('g-warm', [BASE[0], 126], 120, 62), [[0, { transform: 'scale(1)', opacity: 0 }], [1090, { transform: 'scale(1)', opacity: 0.3 }, 'ease-out'], [1170, { transform: 'scale(1.3)', opacity: 0.9 }, 'ease-in'], [1260, { transform: 'scale(.6)', opacity: 0.3 }, 'ease-out'], [1340, { transform: 'scale(1.4)', opacity: 0.7 }, eio], [2200, { transform: 'scale(1.1)', opacity: 0.4 }, eio], [3000, { transform: 'scale(1)', opacity: 0 }]]);
  fx(k.light('g-warm', [BASE[0], 78], 70, 130), [[1320, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1400, { transform: 'scale(1.2)', opacity: 0.6 }, eio], [1900, { transform: 'scale(1.0)', opacity: 0.4 }, eio], [2600, { transform: 'scale(.6)', opacity: 0 }]]);
  // his front lit by the blaze
  fx(k.lightIn('g-warm', [122, 112], 100, 130), [[1330, { opacity: 0 }, 'ease-out'], [1420, { opacity: 0.4 }, eio], [2200, { opacity: 0.2 }, eio], [3000, { opacity: 0 }]]);

  // ── the plunge (1050-1200): a ring at the bowl, a curl of shadow rising, sparks flung up
  fx(k.picIn(ring, [BOWL[0], BOWL[1] - 2], 50, 22), [[1090, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [1140, { transform: 'scale(.5)', opacity: 0.95 }, 'ease-out'], [1420, { transform: 'scale(1.15)', opacity: 0 }]]);
  for (let i = 0; i < 3; i++) {
    const t = 1130 + i * 90, r = Math.round(rand() * 360);
    fx(k.picIn('gloom', [BOWL[0] + (i - 1) * 7, BOWL[1] - 6], 28, 28, { lit: false }), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 200, { transform: `${k.T(0, -12)} rotate(${r + 20}deg) scale(.9)`, opacity: 0.7 }], [t + 900, { transform: `${k.T((i - 1) * 6, -46)} rotate(${r + 50}deg) scale(1.9)`, opacity: 0 }]]);
  }
  // embers streaming into the fire as it draws in (1170-1320)
  for (let i = 0; i < 14; i++) {
    const a = rand() * Math.PI * 2, d = 26 + rand() * 24, t0 = 1130 + i * 14 + rand() * 20, dur = 170 + rand() * 60;
    const ox = Math.cos(a) * d, oy = Math.sin(a) * d * 0.7 - 14;
    fx(k.pic('spark', [BASE[0], 112], 5, 5), [[t0, { transform: `${k.T(ox, oy)} scale(.5)`, opacity: 0 }, 'ease-in'], [t0 + 50, { transform: `${k.T(ox * 0.85, oy * 0.85)} scale(1)`, opacity: 1 }, 'ease-in'], [t0 + dur, { transform: `${k.T(0, 4)} scale(.3)`, opacity: 0.9 }], [t0 + dur + 40, { transform: `${k.T(0, 4)} scale(.1)`, opacity: 0 }]]);
  }

  // ── the blast: a fireball from the top of the flames to T (RELEASE 1320 - IMPACT 1650)
  const C = [(EM[0] + T[0]) / 2, Math.min(EM[1], T[1]) - 28];
  const bz = (t) => { const q = 1 - t; return [q * q * EM[0] + 2 * q * t * C[0] + t * t * T[0], q * q * EM[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const pace = (f) => f * f * 0.5 + f * 0.5;
  const fly = (el, t0, t1, scaleFn, opFn, rot0 = 0, spin = 140, step = 30) => {
    const ks = [];
    for (let t = t0; ; t += step) {
      const tt = Math.min(t, t1), f = (tt - t0) / (t1 - t0), [x, y] = bz(pace(f));
      ks.push([tt, { transform: `${k.T(x - EM[0], y - EM[1])} rotate(${(rot0 + f * spin).toFixed(0)}deg) scale(${scaleFn(f).toFixed(2)})`, opacity: opFn(f) }, 'linear']);
      if (tt >= t1) break;
    }
    return fx(el, ks);
  };
  fly(k.light('g-warm', EM, 44), 1320, 1650, (f) => 0.9 + 0.3 * f, (f) => (f > 0.97 ? 0.4 : 1));
  fly(k.pic('puffHot', EM, 26, 26), 1320, 1650, (f) => 0.7 + 0.5 * f, (f) => (f > 0.97 ? 0.4 : 0.95));
  fly(k.pic('puff', EM, 20, 20), 1325, 1650, (f) => 0.7 + 0.5 * f, (f) => (f > 0.97 ? 0.3 : 0.85), 90);
  fly(k.pic('puffHot', EM, 14, 14), 1345, 1650, (f) => 0.8 + 0.3 * f, (f) => (f > 0.97 ? 0.3 : 0.8), 200, 220);
  for (let i = 0; i < 5; i++) {
    const lag = 24 + i * 20, ks = [], t1 = 1650 + lag * 0.4;
    for (let t = 1320 + lag; ; t += 30) {
      const tt = Math.min(t, t1), f = Math.min(1, Math.max(0, (tt - 1320 - lag) / (t1 - 1320 - lag))), [x, y] = bz(pace(f));
      const dx = T[0] - EM[0], dy = T[1] - EM[1], back = (Math.atan2(dx, -dy) * 180) / Math.PI + 180; // the tongue points back along the flight
      ks.push([tt, { transform: `${k.T(x - EM[0], y - EM[1])} rotate(${(back - 20 + (i - 2) * 11).toFixed(0)}deg) scale(${(0.95 - 0.25 * f + i * 0.04).toFixed(2)}, ${(1.6 - 0.35 * f).toFixed(2)})`, opacity: f > 0.9 ? 0.2 : 0.85 - 0.1 * i }, 'linear']);
      if (tt >= t1) break;
    }
    fx(k.pic(i % 2 ? 'flame' : 'flame2', EM, 8, 15, { base: true }), ks);
  }
  for (let i = 0; i < 12; i++) {
    const f = 0.04 + (i / 12) * 0.9, t = 1320 + 330 * Math.sqrt(f) * 0.95, p = bz(pace(f)), r = Math.round(rand() * 360), id = i % 3;
    const dx = p[0] - EM[0], dy = p[1] - EM[1];
    fx(k.pic(id === 2 ? 'spark' : id === 1 ? 'puffCool' : 'puff', EM, id === 2 ? 5 : 12, id === 2 ? 5 : 12), [[t, { transform: `${k.T(dx, dy)} rotate(${r}deg) scale(.6)`, opacity: 0 }, 'ease-out'], [t + 60, { transform: `${k.T(dx, dy)} rotate(${r + 20}deg) scale(.95)`, opacity: id === 2 ? 1 : 0.7 }],
      [t + 400, { transform: `${k.T(dx + (rand() - 0.5) * 6, dy - 7 - rand() * 6)} rotate(${r + 60}deg) scale(${id === 2 ? 0.2 : 1.4})`, opacity: 0 }]]);
  }
  // sparks bursting up out of the fire at the release, and a slow shower after
  for (let i = 0; i < 26; i++) {
    const t = 1330 + i * 55 + rand() * 40, x = BASE[0] + (rand() - 0.5) * 50, a = (rand() - 0.5) * 0.9, v = 22 + rand() * 40, life = 800 + rand() * 600, sz = 3 + rand() * 2.5;
    fx(k.picIn('spark', [x, 112], sz, sz), [[t, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t + 90, { transform: 'scale(1)', opacity: 1 }], [t + life * 0.6, { transform: `${k.T(Math.sin(a) * v * 0.7 + sgn * 6, -v * 1.1)} scale(.6)`, opacity: 0.8 }], [t + life, { transform: `${k.T(Math.sin(a) * v + sgn * 14, -v * 1.2 + 10)} scale(.2)`, opacity: 0 }]]);
  }
  // smoke rolling off the brazier as it sinks back
  for (let i = 0; i < 4; i++) {
    const t = 1900 + i * 260, r = Math.round(rand() * 360);
    fx(k.picIn('smoke', [BASE[0] + (rand() - 0.5) * 36, 100], 30, 30, { lit: false }), [[t, { transform: `rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 400, { transform: `${k.T(-3, -14)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 1400, { transform: `${k.T(-9, -48)} rotate(${r + 50}deg) scale(2)`, opacity: 0 }]]);
  }
  // the creature comes back (3000): a curl of smoke where it stands
  for (let i = 0; i < 2; i++) {
    const t = 2960 + i * 90, r = Math.round(rand() * 360);
    fx(k.picIn('gloom', [HELD[0] + (i - 0.5) * 8, HELD[1] + 6], 26, 26, { lit: false }), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 220, { transform: `rotate(${r + 15}deg) scale(1)`, opacity: 0.55 }], [t + 900, { transform: `${k.T(0, -10)} rotate(${r + 40}deg) scale(1.6)`, opacity: 0 }]]);
  }

  // ── the strike (IMPACT 1650)
  const IM = 1650;
  const flash = [[IM - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.6)', opacity: 1 }, 'ease-out'], [IM + 200, { transform: 'scale(2.0)', opacity: 0.6 }]];
  for (let t = IM + 340, i = 0; t < 2400; t += 110, i++) flash.push([t, { transform: `scale(${i % 2 ? 1.5 : 1.2})`, opacity: i % 2 ? 0.55 : 0.4 }, eio]);
  flash.push([2700, { transform: 'scale(.9)', opacity: 0 }]);
  fx(k.light('g-warm', T, 66), flash);
  fx(k.light('g-warm', T, 24), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 30, { transform: 'scale(1.6)', opacity: 1 }], [IM + 160, { transform: 'scale(2.6)', opacity: 0 }]]);
  fx(k.pic(ring, T, 64, 64), [[IM, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(.4)', opacity: 0.95 }, 'ease-out'], [IM + 420, { transform: 'scale(1.05)', opacity: 0 }]]);
  fx(k.pic(ring, T, 64, 64), [[IM + 90, { transform: 'scale(.1)', opacity: 0 }, 'ease-out'], [IM + 150, { transform: 'scale(.3)', opacity: 0.6 }, 'ease-out'], [IM + 540, { transform: 'scale(.75)', opacity: 0 }]]);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + rand() * 0.5, d = 13 + rand() * 13, r = Math.round(rand() * 360), t = IM + rand() * 30;
    const px = Math.cos(a) * d, py = Math.sin(a) * d * 0.75 - 2;
    fx(k.pic(i % 3 === 2 ? 'puffCool' : i % 3 ? 'puffHot' : 'puff', T, 17, 17), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 70, { transform: `${k.T(px * 0.5, py * 0.5)} rotate(${r + 30}deg) scale(1)`, opacity: 0.95 }, 'ease-out'],
      [t + 260, { transform: `${k.T(px, py - 3)} rotate(${r + 70}deg) scale(1.5)`, opacity: 0.6 }], [t + 540, { transform: `${k.T(px * 1.1, py - 10)} rotate(${r + 100}deg) scale(1.9)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 18; i++) {
    const a = -Math.PI * (0.05 + rand() * 0.9), v = 16 + rand() * 34, t = IM + rand() * 40, life = 380 + rand() * 360, sz = 3 + rand() * 3;
    const px = (f) => Math.cos(a) * v * f, py = (f) => Math.sin(a) * v * f + 38 * f * f;
    fx(k.pic('spark', T, sz, sz), [0, 0.3, 0.65, 1].map((f, j) => [t + life * f, { transform: `${k.T(px(f), py(f))} scale(${(1 - 0.75 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']));
  }
  const flicker = (el, on, off) => {
    const list = [[on, { transform: 'scale(.6, .12)', opacity: 0 }, 'ease-out'], [on + 110, { transform: 'scale(1, 1)', opacity: 0.95 }, eio]];
    for (let t = on + 110, i = 1; (t += 80 + rand() * 60) < off; i++) list.push([t, { transform: `scale(${(i % 2 ? 0.88 : 1.06).toFixed(2)}, ${(i % 2 ? 1.1 : 0.92).toFixed(2)}) skewX(${i % 2 ? 5 : -5}deg)`, opacity: 0.8 + (i % 2) * 0.15 }, eio]);
    list.push([off, { transform: 'scale(.5, .2)', opacity: 0 }]);
    return fx(el, list);
  };
  for (let i = 0; i < 2; i++) flicker(k.pic(i % 2 ? 'flame' : 'flame2', [T[0] + (i - 0.5) * 7, T[1] + 6], 9 + rand() * 3, 15 + rand() * 8, { base: true }), IM + 60 + i * 60, 2000 + rand() * 200);
  for (let i = 0; i < 4; i++) {
    const t = IM + 280 + i * 190, r = Math.round(rand() * 360);
    fx(k.pic('smoke', [T[0] + (rand() - 0.5) * 12, T[1] - 4], 24, 24, { lit: false, low: true }), [[t, { transform: `rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'],
      [t + 300, { transform: `${k.T(-2, -10)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 1100, { transform: `${k.T(-7, -42)} rotate(${r + 50}deg) scale(1.9)`, opacity: 0 }]]);
  }
}
