// Shared helpers for lane A's moves (ash-collector, wildfire, phoenix-of-the-last-spark):
// affine maths for puppets that turn, lean and mirror as one, and the fire effects
// every one of them uses (flame flicker, a burst where an attack lands, a light that
// rides a moving point). Everything is in the drawing's units (300 x 210) and ms.

export const SPARK = [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 200 + 55 * c * c, 110 + 120 * c * c * c, Math.min(1, c * c * 2.6)]; }];

// affines [a, b, c, d, e, f]: x' = a x + c y + e, y' = b x + d y + f; mul(A, B) applies B first
export const ID = [1, 0, 0, 1, 0, 0];
export const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
export const rot = (deg, cx, cy) => { const r = (deg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r); return [c, s, -s, c, cx - c * cx + s * cy, cy - s * cx - c * cy]; };
export const scl = (sx, sy, cx, cy) => [sx, 0, 0, sy, cx - sx * cx, cy - sy * cy];
export const tr = (dx, dy) => [1, 0, 0, 1, dx, dy];
export const app = (A, [x, y]) => [A[0] * x + A[2] * y + A[4], A[1] * x + A[3] * y + A[5]];

// a value over time from [ms, value, ease?] stops (eased between each pair; the ease at a stop shapes the way to the next)
export const curve = (stops) => (t) => {
  if (t <= stops[0][0]) return stops[0][1];
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, v0, e] = stops[i], [t1, v1] = stops[i + 1];
    if (t <= t1) {
      const f = (t - t0) / (t1 - t0);
      const g = e === 'in' ? f * f : e === 'out' ? 1 - (1 - f) * (1 - f) : e === 'lin' ? f : f * f * (3 - 2 * f);
      return v0 + (v1 - v0) * g;
    }
  }
  return stops[stops.length - 1][1];
};

export function kit(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  k.css('.g-ember { border-radius: 50%; background: radial-gradient(circle, rgba(255,226,160,.95), rgba(255,140,40,.6) 28%, rgba(255,80,10,.2) 55%, rgba(255,60,0,0) 72%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#ffd79a" stroke-width="6" filter="url(#b)"/>', 100, 100);

  // a CSS matrix that applies the world affine W to a part drawn at rest, turning about its joint P
  const css = (W, P) => {
    const tx = W[4] - P[0] + W[0] * P[0] + W[2] * P[1], ty = W[5] - P[1] + W[1] * P[0] + W[3] * P[1];
    return `matrix(${W[0].toFixed(4)}, ${W[1].toFixed(4)}, ${W[2].toFixed(4)}, ${W[3].toFixed(4)}, ${(tx * u).toFixed(2)}, ${(ty * u).toFixed(2)})`;
  };
  // move a part by a world affine over time: Wfn(ms) -> affine, sampled every `step` ms from 0 to `end`
  const drive = (part, P, Wfn, end, step = 50, extra) => {
    const ks = [];
    for (let t = 0; ; t += step) {
      const tt = Math.min(t, end);
      ks.push([tt, { transform: css(Wfn(tt), P), ...(extra ? { opacity: extra(tt) } : {}) }, 'linear']);
      if (tt >= end) break;
    }
    ks[ks.length - 1][1] = { transform: 'none', ...(extra ? { opacity: extra(end) } : {}) };
    act(part, ks);
  };
  // an effect riding a point of a moving part: centred at `pt` at rest; list of [ms, scale, opacity] sampled every 60 ms
  const ride = (el, pt, Wfn, list, extra = '') => {
    const ks = [];
    for (let i = 0; i < list.length; i++) {
      const [t0, s0, o0] = list[i], nx = list[i + 1];
      const put = (t, s, o) => { const p = app(Wfn(t), pt); ks.push([t, { transform: `${k.T(p[0] - pt[0], p[1] - pt[1])} ${extra}scale(${s.toFixed(3)})`, opacity: +o.toFixed(3) }, 'linear']); };
      put(t0, s0, o0);
      if (nx) for (let t = t0 + 60; t < nx[0] - 30; t += 60) { const f = (t - t0) / (nx[0] - t0); put(t, s0 + (nx[1] - s0) * f, o0 + (nx[2] - o0) * f); }
    }
    fx(el, ks);
  };
  // a flame catching at `on`, flickering till `off`
  const flicker = (el, on, off, lean = 0) => {
    const sk = (d) => `skewX(${(lean + d).toFixed(1)}deg)`;
    const list = [[on, { transform: `translateY(0px) scale(.6, .12) ${sk(0)}`, opacity: 0 }, 'ease-out'], [on + 120, { transform: `translateY(0px) scale(1, 1) ${sk(0)}`, opacity: 0.95 }, eio]];
    for (let t = on + 120, i = 1; (t += 80 + rand() * 60) < off; i++) {
      const s = i % 2 ? 1 : -1;
      list.push([t, { transform: `translateY(${(-rand() * 1.5).toFixed(1)}px) scale(${(1 - s * 0.08 - rand() * 0.06).toFixed(2)}, ${(1 + s * 0.14 + rand() * 0.1).toFixed(2)}) ${sk(s * (2 + rand() * 5))}`, opacity: +(0.8 + rand() * 0.2).toFixed(2) }, eio]);
    }
    list.push([Math.min(k.END, off + 260), { transform: `translateY(0px) scale(.5, .15) ${sk(0)}`, opacity: 0 }]);
    fx(el, list);
  };
  // a path through two points bent up by `lift`: t in 0..1 -> [x, y]
  const arcPath = (M, T, lift) => {
    const C = [(M[0] + T[0]) / 2, Math.min(M[1], T[1]) - lift];
    return (t) => { const q = 1 - t; return [q * q * M[0] + 2 * q * t * C[0] + t * t * T[0], q * q * M[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  };
  // a thing flying along `bz` from t0 to t1 (an effect centred at M at rest)
  const fly = (el, M, bz, t0, t1, scaleFn, opFn, rot0 = 0, spin = 140, step = 50, pace = (f) => f * f * 0.55 + f * 0.45) => {
    const ks = [];
    for (let t = t0; ; t += step) {
      const tt = Math.min(t, t1), f = (tt - t0) / (t1 - t0), [x, y] = bz(pace(f));
      ks.push([tt, { transform: `${k.T(x - M[0], y - M[1])} rotate(${(rot0 + f * spin).toFixed(0)}deg) scale(${scaleFn(f).toFixed(2)})`, opacity: opFn(f) }, 'linear']);
      if (tt >= t1) break;
    }
    fx(el, ks);
  };
  // fire landing at T at time IM: flash, two rings, billows flung out, sparks arcing down, flames catch, smoke, a scorch
  const burst = (T, IM, o = {}) => {
    const size = o.size || 1;
    const flash = [[IM - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [IM + 200, { transform: 'scale(1.9)', opacity: 0.6 }]];
    for (let t = IM + 340, i = 0; t < IM + 700; t += 110, i++) flash.push([t, { transform: `scale(${i % 2 ? 1.4 : 1.15})`, opacity: i % 2 ? 0.55 : 0.4 }, eio]);
    flash.push([IM + 1000, { transform: 'scale(.9)', opacity: 0 }]);
    fx(k.light('g-warm', T, 62 * size), flash);
    fx(k.light('g-warm', T, 22 * size), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 30, { transform: 'scale(1.6)', opacity: 1 }], [IM + 160, { transform: 'scale(2.6)', opacity: 0 }]]);
    fx(k.pic(ring, T, 60 * size, 60 * size), [[IM, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(.4)', opacity: 0.95 }, 'ease-out'], [IM + 400, { transform: 'scale(1.05)', opacity: 0 }]]);
    fx(k.pic(ring, T, 60 * size, 60 * size), [[IM + 90, { transform: 'scale(.1)', opacity: 0 }, 'ease-out'], [IM + 150, { transform: 'scale(.3)', opacity: 0.6 }, 'ease-out'], [IM + 520, { transform: 'scale(.75)', opacity: 0 }]]);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + rand() * 0.5, d = (13 + rand() * 12) * size, r = Math.round(rand() * 360), t = IM + rand() * 30;
      const dx = Math.cos(a) * d, dy = Math.sin(a) * d * 0.75 - 2;
      fx(k.pic(i % 3 === 2 ? 'puffCool' : i % 3 ? 'puffHot' : 'puff', T, 16, 16), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 70, { transform: `${k.T(dx * 0.5, dy * 0.5)} rotate(${r + 30}deg) scale(1)`, opacity: 0.95 }, 'ease-out'],
        [t + 260, { transform: `${k.T(dx, dy - 3)} rotate(${r + 70}deg) scale(1.5)`, opacity: 0.6 }], [t + 520, { transform: `${k.T(dx * 1.1, dy - 10)} rotate(${r + 100}deg) scale(1.9)`, opacity: 0 }]]);
    }
    for (let i = 0; i < 16; i++) {
      const a = -Math.PI * (0.05 + rand() * 0.9), v = (16 + rand() * 34) * size, t = IM + rand() * 40, life = 380 + rand() * 360, sz = 3 + rand() * 3;
      const px = (f) => Math.cos(a) * v * f, py = (f) => Math.sin(a) * v * f + 38 * f * f;
      fk([0, 0.3, 0.65, 1], (f, j) => [t + life * f, { transform: `${k.T(px(f), py(f))} scale(${(1 - 0.75 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out'], k.pic('spark', T, sz, sz));
    }
    const nfl = o.flames ?? 5, end = IM + (o.linger ?? 700);
    for (let i = 0; i < nfl; i++) flicker(k.pic(i % 2 ? 'flame' : 'flame2', [T[0] + (i - (nfl - 1) / 2) * 6 * size, T[1] + 6], 9 + rand() * 3, 15 + rand() * 8, { base: true }), IM + 60 + i * 60, end + rand() * 300);
    for (let i = 0; i < 4; i++) {
      const t = IM + 280 + i * 190, r = Math.round(rand() * 360);
      fx(k.pic('smoke', [T[0] + (rand() - 0.5) * 12, T[1] - 4], 24, 24, { lit: false, low: true }), [[t, { transform: `rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'],
        [t + 300, { transform: `${k.T(-2, -10)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 1100, { transform: `${k.T(-7, -42)} rotate(${r + 50}deg) scale(1.9)`, opacity: 0 }]]);
    }
  };
  const fk = (fr, fn, el) => fx(el, fr.map(fn));
  return { css, drive, ride, flicker, arcPath, fly, burst, ring, eio };
}
