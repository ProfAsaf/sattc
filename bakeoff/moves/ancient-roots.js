// Ancient Roots: the old roots feed the glowing stones, and the stones give back.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support, element nature.
//   0-1000    GATHER: the stones draw in (they shrink a little and darken), and pulses
//             of light run down the two great glowing veins from the tree's foot, round
//             the coils, into the stones: three in turn, each brighter; every time
//             one arrives the stones swell and flicker.
//   1100      RELEASE: the stones flare to nearly twice their size, a crack of green
//             light round them; an orb of light leaves their heart for T (k.aim, else up
//             through the coil to where the roots meet the tree's foot, in daylight).
//   1450      IMPACT/bloom at T: a flare and a ring spread, motes and leaves fly out;
//             alone, the daylit strip above blazes warm and the shafts through the
//             soil brighten, a second, gentler light running back down the veins.
//   1450-2800 the stones settle through a few slow swells; sparks and motes drift up
//             through the earth; the veins' extra light fades.
//   2800-3500 everything dims to as drawn. END 4000.
// BEATS: release 1100, impact 1450, settle 3500.
import { spline } from '../../js/art/kit.js';

export const END = 4000;
export const BEATS = { release: 1100, impact: 1450, settle: 3500 };
export const STILLS = [350, 800, 1100, 1300, 1550, 1900, 2800, 3700];

export const textures = {
  orb: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [232 + 20 * c, 255, 150 + 90 * c * c, Math.min(1, c * c * 2.4)]; }],
  mote: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [240, 255, 190 + 60 * c, Math.min(1, c * c * 3)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const stones = k.part('stones');
  const E = k.spec.emit, T = k.aim || k.spec.up;
  k.css('.g-leaf { border-radius: 50%; background: radial-gradient(circle, rgba(250,255,214,.95), rgba(196,240,112,.55) 30%, rgba(130,205,70,.2) 58%, rgba(110,190,60,0) 72%); }');
  const leaf = k.svg('<defs><linearGradient id="g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#8fcf4a"/><stop offset="1" stop-color="#e8fba0"/></linearGradient></defs><path d="M10,30C2,22 3,8 10,1C17,8 18,22 10,30Z" fill="url(#g)"/><path d="M10,29L10,6" stroke="#5f9a2c" stroke-width=".9" fill="none" opacity=".7"/>', 20, 30);
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><ellipse cx="50" cy="25" rx="44" ry="20" fill="none" stroke="#eefcb4" stroke-width="3.2" filter="url(#b)"/><ellipse cx="50" cy="25" rx="44" ry="20" fill="none" stroke="#fbffe4" stroke-width="1.1"/>', 100, 50);

  // ── the stones: draw in, swell as each pulse arrives, flare at the release, settle
  const sc = (s) => ({ transform: `scale(${s})` });
  act(stones, [[0, sc(1), eio], [450, sc(0.94), eio], [760, sc(1.05), 'ease-out'], [900, sc(0.96), eio], [1020, sc(1.12), 'ease-out'], [1100, sc(1.22), 'ease-out'], [1250, sc(1.1), eio],
    [1700, sc(0.97), eio], [2100, sc(1.05), eio], [2500, sc(0.99), eio], [2900, sc(1.02), eio], [3300, sc(1)]]);
  // the stones' light, behind the veins' own: swelling with them
  const bump = [[0, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [760, { transform: 'scale(.9)', opacity: 0.5 }, eio], [1100, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [1500, { transform: 'scale(1.25)', opacity: 0.75 }, eio],
    [2100, { transform: 'scale(1.1)', opacity: 0.55 }, eio], [2900, { transform: 'scale(.9)', opacity: 0.15 }, eio], [3400, { transform: 'scale(.7)', opacity: 0 }]];
  fx(k.lightIn('g-leaf', E, 120, 110), bump);

  // ── pulses of light down the veins, into the stones: a line of glowing dots along each curve
  const run = (pts, reverse) => {
    const s = spline(pts, 8);
    return reverse ? s.slice().reverse() : s;
  };
  const veins = [run(k.spec.veinA, false), run(k.spec.veinB, false)];
  const lenAt = (path) => { const L = [0]; for (let i = 1; i < path.length; i++) L.push(L[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1])); return L; };
  const pointAt = (path, L, f) => { const d = f * L[L.length - 1]; let i = 1; while (i < L.length - 1 && L[i] < d) i++; const g = (d - L[i - 1]) / (L[i] - L[i - 1] || 1); return [path[i - 1][0] + (path[i][0] - path[i - 1][0]) * g, path[i - 1][1] + (path[i][1] - path[i - 1][1]) * g]; };
  // three pulses; each a bright dot with a short tail of dimmer ones, starting 60, 330, 600 and 640 ms to run
  const PULSE = [[60, 1.0], [330, 1.15], [600, 1.35]];
  veins.forEach((path, vi) => {
    const L = lenAt(path);
    PULSE.forEach(([t0, big], pi) => {
      for (let tail = 0; tail < 4; tail++) {
        const w = (7 - tail * 1.3) * big, o = 1 - tail * 0.22, lag = tail * 55;
        const list = [];
        const start = pointAt(path, L, 0), N = 9;
        list.push([t0 + lag - 1, { transform: `${k.T(0, 0)} scale(.3)`, opacity: 0 }, 'ease-out']);
        for (let j = 0; j <= N; j++) {
          const f = j / N, p = pointAt(path, L, f), tt = Math.round(t0 + lag + 640 * (f * f * 0.35 + f * 0.65));
          list.push([tt, { transform: `${k.T(p[0] - start[0], p[1] - start[1])} scale(${(j === N ? 1.6 : 1).toFixed(2)})`, opacity: j === N ? 0 : o * (j === 0 ? 0.6 : 1) }, 'linear']);
        }
        fx(k.picIn('orb', start, w, w), list.filter((x, i, a) => i === 0 || x[0] > a[i - 1][0]));
      }
    });
  });
  // a spark of light where each pulse reaches the stones
  PULSE.forEach(([t0, big], pi) => {
    const t = t0 + 640;
    fx(k.picIn('orb', [E[0] + (pi - 1) * 8, E[1] - 8 + pi * 3], 20 * big, 20 * big), [[t - 60, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 30, { transform: 'scale(1.1)', opacity: 0.95 }, 'ease-out'], [t + 260, { transform: 'scale(1.5)', opacity: 0 }]]);
  });

  // ── release: the stones' crack of light, an orb to T (on the overlay: T may be another card)
  fx(k.lightIn('g-leaf', E, 150, 150), [[1020, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1130, { transform: 'scale(1)', opacity: 0.9 }, 'ease-out'], [1600, { transform: 'scale(1.15)', opacity: 0.35 }, eio], [2200, { transform: 'scale(1)', opacity: 0 }]]);
  fx(k.pic(ring, E, 100, 50), [[1100, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1160, { transform: 'scale(.55)', opacity: 0.9 }, 'ease-out'], [1750, { transform: 'scale(1.5)', opacity: 0 }]]);
  const C = [(E[0] + T[0]) / 2 + (T[0] >= E[0] ? 14 : -14), Math.min(E[1], T[1]) - 10];
  const bz = (t) => { const q = 1 - t; return [q * q * E[0] + 2 * q * t * C[0] + t * t * T[0], q * q * E[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const [X0, Y0] = k.P(...E);
  for (let i = 0; i < 4; i++) {
    const t0 = 1100 + i * 60, dur = 350, off = (i - 1.5) * 5, w = 17 - i * 2;
    const at = (f, s, o) => { const [x, y] = k.P(...bz(f)); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + off * Math.sin(Math.PI * f) * u).toFixed(1)}px) scale(${s})`, opacity: o }; };
    fx(k.pic('orb', E, w, w), [[t0, at(0, 0.5, 0), 'ease-in'], [t0 + 50, at(0.15, 1.1, 1), 'linear'], [t0 + dur * 0.6, at(0.6, 1.2, 1), 'linear'], [t0 + dur, at(1, 1, 0.9), 'ease-out'], [t0 + dur + 120, at(1, 1.8, 0)]]);
    for (let j = 0; j < 3; j++) {
      const f = 0.2 + j * 0.25, ts = Math.round(t0 + dur * f);
      fx(k.pic('mote', E, 5, 5), [[ts, at(f, 0.5, 0), 'ease-out'], [ts + 40, at(f, 1, 0.9)], [ts + 260, at(f, 0.3, 0)]]);
    }
  }

  // ── impact
  const IM = 1450;
  fx(k.light('g-leaf', T, 70), [[IM - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [IM + 500, { transform: 'scale(1.2)', opacity: 0.55 }, eio], [IM + 1400, { transform: 'scale(.8)', opacity: 0 }]]);
  for (const [d, w, o] of [[0, 96, 0.95], [150, 72, 0.7]]) fx(k.pic(ring, T, w, w / 2), [[IM + d - 1, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + d + 40, { transform: 'scale(.3)', opacity: o }, 'ease-out'], [IM + d + 650, { transform: 'scale(1.1)', opacity: 0 }]]);
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * (0.05 + 0.9 * rand()), r = 20 + rand() * 24, ex = Math.cos(a) * r * 1.2, ey = Math.sin(a) * r * 0.9, t0 = IM + 20 + rand() * 120, life = 800 + rand() * 500, rt = Math.round((rand() - 0.5) * 140);
    const pts = k.arc([0, 0], [ex * 0.7, ey - 8], [ex * 1.1, ey + 12 + rand() * 10], 5);
    fx(k.pic(leaf, T, 7 + rand() * 3, 10 + rand() * 4, { lit: false }), [[t0, { transform: `${k.T(0, 0)} rotate(${rt}deg) scale(.2)`, opacity: 0 }, 'ease-out'],
      ...pts.map(([x, y], j) => [Math.round(t0 + 60 + life * j / 5), { transform: `${k.T(x, y)} rotate(${rt + Math.round((rand() - 0.2) * 160 * j)}deg) scale(${j === 0 ? 0.6 : 1})`, opacity: j === 5 ? 0 : 0.95 }, j < 1 ? 'ease-out' : 'ease-in-out'])]);
  }
  for (let i = 0; i < 12; i++) {
    const dx = (rand() - 0.5) * 70, t0 = IM + 80 + rand() * 700, life = 900 + rand() * 600, sz = 2.5 + rand() * 3;
    const pts = k.arc([0, 0], [dx * 0.6 + (rand() - 0.5) * 18, -24], [dx * 0.8 + (rand() - 0.5) * 20, -50 - rand() * 14], 5);
    fx(k.pic('mote', [T[0] + dx * 0.4, T[1] + 6 + rand() * 10], sz, sz), [[t0 - 1, { transform: `${k.T(0, 0)} scale(.3)`, opacity: 0 }, 'ease-out'],
      ...pts.map(([x, y], j) => [Math.round(t0 + life * j / 5), { transform: `${k.T(x, y)} scale(${1 - 0.45 * j / 5})`, opacity: j === 0 ? 0 : j === 5 ? 0 : 0.9 }, 'ease-out'])]);
  }

  // ── through the earth: motes drift up round the stones for the rest of the move; alone, the daylit strip blazes
  for (let i = 0; i < 12; i++) {
    const x = 100 + rand() * 100, y = 120 + rand() * 50, t0 = 1250 + rand() * 1000, life = 1000 + rand() * 600, sz = 2.2 + rand() * 2.4;
    const pts = k.arc([0, 0], [(rand() - 0.5) * 30, -28], [(rand() - 0.5) * 36, -62 - rand() * 20], 5);
    fx(k.picIn('mote', [x, y], sz, sz), [[t0 - 1, { transform: `${k.T(0, 0)} scale(.3)`, opacity: 0 }, 'ease-out'],
      ...pts.map(([px, py], j) => [Math.round(t0 + life * j / 5), { transform: `${k.T(px, py)} scale(${1 - 0.4 * j / 5})`, opacity: j === 0 ? 0 : j === 5 ? 0 : 0.85 }, 'ease-out'])]);
  }
  if (!k.aim) {
    fx(k.lightIn('g-leaf', [150, 24], 230, 70), [[IM, { opacity: 0, transform: 'scale(.6)' }, 'ease-out'], [IM + 200, { opacity: 0.8, transform: 'scale(1)' }, 'ease-out'], [IM + 900, { opacity: 0.5, transform: 'scale(1.05)' }, eio], [2900, { opacity: 0, transform: 'scale(1)' }]]);
    // a second, gentler pulse back down the veins
    veins.forEach((path) => {
      const L = lenAt(path), start = pointAt(path, L, 1), N = 8, list = [[IM + 60, { transform: `${k.T(0, 0)} scale(.3)`, opacity: 0 }, 'ease-out']];
      for (let j = 0; j <= N; j++) { const f = 1 - j / N, p = pointAt(path, L, f); list.push([Math.round(IM + 100 + 700 * (j / N)), { transform: `${k.T(p[0] - start[0], p[1] - start[1])} scale(${j === N ? 1.5 : 1})`, opacity: j === N ? 0 : 0.8 }, 'linear']); }
      fx(k.picIn('orb', start, 7, 7), list);
    });
  }
}
