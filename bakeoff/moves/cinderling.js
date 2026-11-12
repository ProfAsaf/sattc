// Cinderling: the imp hurls a fireball.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker, element fire.
//   0-500     gather: he crouches (squashes about his feet), wings fold in, tail
//             curls down; the lava cracks and his eyes brighten; the volcano glow rises.
//   500-1250  inhale: he stretches up and rears back away from his target, wings
//             flaring wide, sparks streaming in to his mouth from all round, a
//             fireball swelling and shuddering there; tail curled tight.
//   1250      RELEASE: he lunges toward T (leaning into it), wings snap down, tail
//             whips up; the fireball leaves his mouth.
//   1250-1650 the fireball flies an arc to T (k.aim, else the far hillside),
//             shedding sparks and puffs, accelerating.
//   1650      IMPACT at T: flash, a ring of light, billows and sparks flung out,
//             flames catch and flicker, smoke rises.
//   1650-3000 recoil: he rocks back with the force of it (wings flutter, tail
//             flicks), overshoots, settles; the light dies, the cracks cool to as drawn.
// BEATS: release 1250, impact 1650, settle 3000. At rest as drawn by 3000 (END 3700).
//
// Aimed: T = k.aim || [246, 118]; he leans, and the fireball is bent, toward T
// whichever side it is on. Everything that flies is on the overlay (k.pic / k.light).
export const END = 3700;
export const BEATS = { release: 1250, impact: 1650, settle: 3000 };
export const STILLS = [350, 900, 1220, 1400, 1660, 1800, 2300, 3300];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 200 + 55 * c * c, 110 + 120 * c * c * c, Math.min(1, c * c * 2.6)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const wingL = k.part('wingL'), wingR = k.part('wingR'), tail = k.part('tail'), imp = k.part('imp');
  const [mx, my] = k.spec.mouth, [fx0, fy0] = k.spec.feet;
  const T = k.aim || [246, 118];
  const sgn = T[0] >= mx ? 1 : -1; // which way he leans: toward his target
  k.css('.g-ember { border-radius: 50%; background: radial-gradient(circle, rgba(255,226,160,.95), rgba(255,140,40,.6) 28%, rgba(255,80,10,.2) 55%, rgba(255,60,0,0) 72%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#ffd79a" stroke-width="6" filter="url(#b)"/>', 100, 100);

  // ── his body: poses [ms, [dx, dy, rot, sx, sy], easing] about his feet; effects ride on the same poses
  const S = sgn;
  const POSES = [
    [0, [0, 0, 0, 1, 1], eio], [420, [0, 0, -S * 1.5, 1.07, 0.92], eio], [760, [-S * 0.6, -0.8, -S * 4, 0.97, 1.05], eio],
    [1100, [-S * 1, -1.2, -S * 6.5, 0.96, 1.07], 'ease-in'], [1250, [-S * 1.6, 0.3, -S * 8, 1.04, 0.95], 'ease-out'], [1380, [S * 4.5, -0.5, S * 7.5, 1.03, 0.97], eio],
    [1650, [S * 4, 0, S * 6, 1.01, 0.99], 'ease-out'], [1740, [-S * 3.2, 0.2, -S * 3.5, 0.98, 1.03], eio], [2050, [S * 1.4, 0, S * 1.6, 1.01, 0.99], eio],
    [2400, [-S * 0.4, 0, -S * 0.5, 1, 1], eio], [3000, [0, 0, 0, 1, 1]],
  ];
  const lerp = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);
  const ease = (e, f) => (e === 'ease-out' ? 1 - (1 - f) * (1 - f) : e === 'ease-in' ? f * f : k.smooth(f));
  const pose = (ms) => {
    let i = POSES.length - 1;
    while (i > 0 && POSES[i][0] > ms) i--;
    if (i === POSES.length - 1) return POSES[i][1];
    const [t0, p0, e] = POSES[i], t1 = POSES[i + 1][0];
    return lerp(p0, POSES[i + 1][1], ease(e, Math.min(1, Math.max(0, (ms - t0) / (t1 - t0)))));
  };
  const tfOf = (p) => `${k.T(p[0], p[1])} rotate(${p[2].toFixed(2)}deg) scale(${p[3].toFixed(3)}, ${p[4].toFixed(3)})`;
  // where a point of the imp is at a moment
  const ptAt = ([x, y], ms) => {
    const [dx, dy, r, sx, sy] = pose(ms), a = (r * Math.PI) / 180, rx = (x - fx0) * sx, ry = (y - fy0) * sy;
    return [fx0 + dx + rx * Math.cos(a) - ry * Math.sin(a), fy0 + dy + rx * Math.sin(a) + ry * Math.cos(a)];
  };
  act(imp, POSES.map(([t, p, e]) => [t, { transform: tfOf(p) }, e]));

  // an effect riding on the imp's body: centred at `pt`, a list of [ms, scale, opacity, easing] sampled every 70 ms
  const ride = (el, pt, list, extra = '') => {
    const ks = [];
    for (let i = 0; i < list.length; i++) {
      const [t0, s0, o0, e0] = list[i], nxt = list[i + 1];
      ks.push([t0, { transform: `${k.T(...ptAt(pt, t0).map((v, j) => v - pt[j]))} ${extra}scale(${s0})`, opacity: o0 }, e0 || 'linear']);
      if (nxt) for (let t = t0 + 70; t < nxt[0] - 35; t += 70) {
        const f = (t - t0) / (nxt[0] - t0), s = s0 + (nxt[1] - s0) * f, o = o0 + (nxt[2] - o0) * f;
        ks.push([t, { transform: `${k.T(...ptAt(pt, t).map((v, j) => v - pt[j]))} ${extra}scale(${s.toFixed(3)})`, opacity: o }, 'linear']);
      }
    }
    return fx(el, ks);
  };

  // ── wings: fold, flare wide, snap down on the release, flutter back (left raises with +, right with -)
  const W = [[0, 0, eio], [360, -7, eio], [800, 15, eio], [1230, 21, 'ease-in'], [1330, -17, 'ease-out'], [1560, -5, eio], [1760, 9, eio], [1960, -3, eio], [2200, 2, eio], [2500, 0]];
  act(wingL, W.map(([t, d, e]) => [t, { transform: `rotate(${d}deg)` }, e]));
  act(wingR, W.map(([t, d, e], i) => { const lag = i > 2 && i < 8 ? 30 : 0; return [t + lag, { transform: `rotate(${-d * (i === 7 ? 0.8 : 1)}deg)` }, e]; }));
  // the tail: curls down as he gathers, tight when he rears, whips up on the release, flicks twice
  const TL = [[0, 0, eio], [420, 9, eio], [1100, 14, eio], [1260, 18, 'ease-out'], [1400, -22, eio], [1650, -9, eio], [1800, 11, eio], [2000, -5, eio], [2250, 3, eio], [2600, 0]];
  act(tail, TL.map(([t, d, e]) => [t, { transform: `rotate(${d}deg)` }, e]));

  // ── light: his cracks and eyes brighten, the volcano glows
  const eyeL = [144, 121], eyeR = [156, 121], chest = [150, 148];
  const glowList = (peak) => [[200, 0.5, 0, 'ease-out'], [700, 0.9 * peak, 0.55 * peak, eio], [1230, 1.1 * peak, 0.9 * peak, 'ease-out'], [1330, 1.5 * peak, 1, eio], [1700, 1 * peak, 0.55 * peak, eio], [2400, 0.8 * peak, 0.15 * peak], [2900, 0.6 * peak, 0]];
  ride(k.lightIn('g-ember', eyeL, 18, 18), eyeL, glowList(1));
  ride(k.lightIn('g-ember', eyeR, 18, 18), eyeR, glowList(1));
  ride(k.lightIn('g-ember', chest, 34, 40), chest, glowList(0.85));
  fx(k.lightIn('g-city', [150, 150], 330, 130, { under: true }), [[100, { opacity: 0 }, 'ease-out'], [800, { opacity: 0.55 }, eio], [1300, { opacity: 0.9 }, eio], [1700, { opacity: 0.8 }, eio], [2500, { opacity: 0.2 }], [3200, { opacity: 0 }]]);

  // ── gathering: sparks streaming in to his mouth, and the fireball swelling there (riding his head)
  for (let i = 0; i < 13; i++) {
    const a = rand() * Math.PI * 2, d = 26 + rand() * 20, t0 = 480 + i * 55 + rand() * 40, dur = 380 + rand() * 120;
    const ox = Math.cos(a) * d, oy = Math.sin(a) * d * 0.8 - 4;
    const m1 = ptAt([mx, my], t0 + dur), m0 = ptAt([mx, my], t0);
    fx(k.pic('spark', [mx, my], 5, 5), [[t0, { transform: `${k.T(m0[0] - mx + ox, m0[1] - my + oy)} scale(.5)`, opacity: 0 }, 'ease-in'],
      [t0 + 80, { transform: `${k.T(m0[0] - mx + ox * 0.9, m0[1] - my + oy * 0.9)} scale(1)`, opacity: 1 }, 'ease-in'],
      [t0 + dur, { transform: `${k.T(m1[0] - mx, m1[1] - my)} scale(.35)`, opacity: 0.9 }], [t0 + dur + 50, { transform: `${k.T(m1[0] - mx, m1[1] - my)} scale(.1)`, opacity: 0 }]]);
  }
  const ball = [[650, 0.2, 0, 'ease-out'], [800, 0.45, 0.8, eio]];
  for (let t = 900, i = 0; t < 1230; t += 80, i++) ball.push([t, 0.55 + 0.1 * Math.min(i, 3) + (i % 2 ? 0.06 : -0.04), i % 2 ? 1 : 0.88, eio]);
  ball.push([1250, 0.9, 1, 'ease-out'], [1300, 0.5, 0.5], [1360, 0.2, 0]);
  ride(k.light('g-ember', [mx, my], 22, 22), [mx, my], ball);
  ride(k.pic('puffHot', [mx, my], 14, 14), [mx, my], [[700, 0.2, 0, 'ease-out'], [900, 0.7, 0.9, eio], [1100, 0.9, 0.85, eio], [1250, 1.1, 0.95, 'ease-out'], [1330, 0.5, 0.4], [1400, 0.2, 0]], 'rotate(25deg) ');
  ride(k.pic('puff', [mx, my], 12, 12), [mx, my], [[820, 0.2, 0, 'ease-out'], [1000, 0.7, 0.7, eio], [1250, 1, 0.8, 'ease-out'], [1340, 0.4, 0.3], [1400, 0.1, 0]], 'rotate(-40deg) ');

  // ── the fireball in flight (1250-1650): from his mouth at the release to T, an arc bent upward
  const M = ptAt([mx, my], 1260), C = [(M[0] + T[0]) / 2, Math.min(M[1], T[1]) - 24];
  const bz = (t) => { const q = 1 - t; return [q * q * M[0] + 2 * q * t * C[0] + t * t * T[0], q * q * M[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const pace = (f) => f * f * 0.55 + f * 0.45; // accelerating
  const fly = (el, t0, t1, scaleFn, opFn, rot = 0, step = 50) => {
    const ks = [];
    for (let t = t0; ; t += step) {
      const tt = Math.min(t, t1), f = (tt - t0) / (t1 - t0), [x, y] = bz(pace(f));
      ks.push([tt, { transform: `${k.T(x - M[0], y - M[1])} rotate(${(rot + f * 140).toFixed(0)}deg) scale(${scaleFn(f).toFixed(2)})`, opacity: opFn(f) }, 'linear']);
      if (tt >= t1) break;
    }
    return fx(el, ks);
  };
  fly(k.light('g-ember', M, 30, 30), 1250, 1650, (f) => 0.85 + 0.3 * f, (f) => (f > 0.97 ? 0.5 : 1));
  fly(k.pic('puffHot', M, 18, 18), 1250, 1650, (f) => 0.6 + 0.5 * f, (f) => (f > 0.97 ? 0.4 : 0.95), 0);
  fly(k.pic('puff', M, 14, 14), 1255, 1650, (f) => 0.7 + 0.5 * f, (f) => (f > 0.97 ? 0.3 : 0.85), 90);
  // flame licks streaming back off it
  for (let i = 0; i < 4; i++) {
    const lag = 28 + i * 22, off = (i - 1.5) * 3;
    fly(k.pic(i % 2 ? 'flame' : 'flame2', M, 7, 12, { base: true }), 1250 + lag, 1650 + lag * 0.4, (f) => 0.8 - 0.3 * f + i * 0.05, (f) => (f > 0.9 ? 0.2 : 0.8 - 0.15 * i), off * 3);
  }
  // shed along the way: puffs and sparks left hanging in the air, rising and fading
  for (let i = 0; i < 12; i++) {
    const f = 0.04 + (i / 12) * 0.9, t = 1250 + 400 * Math.sqrt(f) * 0.95, p = bz(f), r = Math.round(rand() * 360);
    const dx = p[0] - M[0], dy = p[1] - M[1], id = i % 3;
    fx(k.pic(id === 2 ? 'spark' : id === 1 ? 'puffCool' : 'puff', M, id === 2 ? 5 : 11, id === 2 ? 5 : 11), [[t, { transform: `${k.T(dx, dy)} rotate(${r}deg) scale(.6)`, opacity: 0 }, 'ease-out'], [t + 60, { transform: `${k.T(dx, dy)} rotate(${r + 20}deg) scale(.95)`, opacity: id === 2 ? 1 : 0.7 }],
      [t + 380, { transform: `${k.T(dx + (rand() - 0.5) * 6, dy - 7 - rand() * 6)} rotate(${r + 60}deg) scale(${id === 2 ? 0.2 : 1.4})`, opacity: 0 }]]);
  }

  // ── the strike (1650): flash, ring, billows and sparks flung out, flames catch, smoke rises
  const IM = 1650;
  const flash = [[IM - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [IM + 200, { transform: 'scale(1.9)', opacity: 0.6 }]];
  for (let t = IM + 340, i = 0; t < 2300; t += 110, i++) flash.push([t, { transform: `scale(${i % 2 ? 1.4 : 1.15})`, opacity: i % 2 ? 0.55 : 0.4 }, eio]);
  flash.push([2600, { transform: 'scale(.9)', opacity: 0 }]);
  fx(k.light('g-warm', T, 62), flash);
  fx(k.light('g-warm', T, 22), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 30, { transform: 'scale(1.6)', opacity: 1 }], [IM + 160, { transform: 'scale(2.6)', opacity: 0 }]]);
  fx(k.pic(ring, T, 60, 60), [[IM, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(.4)', opacity: 0.95 }, 'ease-out'], [IM + 400, { transform: 'scale(1.05)', opacity: 0 }]]);
  fx(k.pic(ring, T, 60, 60), [[IM + 90, { transform: 'scale(.1)', opacity: 0 }, 'ease-out'], [IM + 150, { transform: 'scale(.3)', opacity: 0.6 }, 'ease-out'], [IM + 520, { transform: 'scale(.75)', opacity: 0 }]]);
  // billows flung out
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rand() * 0.5, d = 13 + rand() * 12, r = Math.round(rand() * 360), t = IM + rand() * 30;
    const dx = Math.cos(a) * d, dy = Math.sin(a) * d * 0.75 - 2;
    fx(k.pic(i % 3 === 2 ? 'puffCool' : i % 3 ? 'puffHot' : 'puff', T, 16, 16), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 70, { transform: `${k.T(dx * 0.5, dy * 0.5)} rotate(${r + 30}deg) scale(1)`, opacity: 0.95 }, 'ease-out'],
      [t + 260, { transform: `${k.T(dx, dy - 3)} rotate(${r + 70}deg) scale(1.5)`, opacity: 0.6 }], [t + 520, { transform: `${k.T(dx * 1.1, dy - 10)} rotate(${r + 100}deg) scale(1.9)`, opacity: 0 }]]);
  }
  // sparks flung, arcing down
  for (let i = 0; i < 16; i++) {
    const a = -Math.PI * (0.05 + rand() * 0.9), v = 16 + rand() * 34, t = IM + rand() * 40, life = 380 + rand() * 360, sz = 3 + rand() * 3;
    const px = (f) => Math.cos(a) * v * f, py = (f) => Math.sin(a) * v * f + 38 * f * f;
    const fr = [0, 0.3, 0.65, 1];
    fx(k.pic('spark', T, sz, sz), fr.map((f, j) => [t + life * f, { transform: `${k.T(px(f), py(f))} scale(${(1 - 0.75 * f).toFixed(2)})`, opacity: j === 0 ? 0 : j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']));
  }
  // flames catch where it landed
  const flicker = (el, on, off, lean = 0) => {
    const sk = (d) => `skewX(${(lean + d).toFixed(1)}deg)`;
    const list = [[on, { transform: `scale(.6, .12) ${sk(0)}`, opacity: 0 }, 'ease-out'], [on + 110, { transform: `scale(1, 1) ${sk(0)}`, opacity: 0.95 }, eio]];
    for (let t = on + 110, i = 1; (t += 80 + rand() * 60) < off; i++) list.push([t, { transform: `scale(${(i % 2 ? 0.88 : 1.06).toFixed(2)}, ${(i % 2 ? 1.1 : 0.92).toFixed(2)}) ${sk(i % 2 ? 5 : -5)}`, opacity: 0.8 + (i % 2) * 0.15 }, eio]);
    list.push([off, { transform: `scale(.5, .2) ${sk(0)}`, opacity: 0 }]);
    return fx(el, list);
  };
  for (let i = 0; i < 5; i++) flicker(k.pic(i % 2 ? 'flame' : 'flame2', [T[0] + (i - 2) * 6, T[1] + 6], 9 + rand() * 3, 15 + rand() * 8, { base: true }), IM + 60 + i * 60, 2350 + rand() * 300);
  for (let i = 0; i < 4; i++) {
    const t = IM + 280 + i * 190, r = Math.round(rand() * 360);
    fx(k.pic('smoke', [T[0] + (rand() - 0.5) * 12, T[1] - 4], 24, 24, { lit: false, low: true }), [[t, { transform: `rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'],
      [t + 300, { transform: `${k.T(-2, -10)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 1100, { transform: `${k.T(-7, -42)} rotate(${r + 50}deg) scale(1.9)`, opacity: 0 }]]);
  }

  // ── embers popping off him after the throw (the recoil): sparks from the cracks, drifting up
  for (let i = 0; i < 8; i++) {
    const t = 1700 + i * 120 + rand() * 60, x = 138 + rand() * 24, y = 138 + rand() * 20, r = rand() - 0.5;
    fx(k.pic('spark', [x, y], 4, 4), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 90, { transform: 'scale(1)', opacity: 1 }], [t + 700, { transform: `${k.T(r * 14, -18 - rand() * 12)} scale(.25)`, opacity: 0 }]]);
  }
}
