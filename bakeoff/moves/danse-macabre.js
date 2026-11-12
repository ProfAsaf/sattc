// Danse Macabre: the dead dance faster round the violet fire, and it throws four
// spirits out to rise again.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support, element: bone
// (suggestion kept: a gift of the dead, raised from the discard pile).
//   0-1000    the gather: the four near dancers (two skeletons, two ghosts) whirl up
//             to speed, hopping out of step, swaying; the bonfire swells, violet
//             tongues of flame climbing, its light beating; pale motes stream from
//             each dancer into the fire.
//   1100      (BEATS.release) the dancers leap, arms flung up, and the fire roars
//             up a column of light: four violet spirits leave it one after another,
//             fanning out in arcs to T, comets of sparks behind them.
//   1500      (BEATS.impact) the first lands at T, the rest after it along a row:
//             each a flare, a ring on the ground, a little ghost standing up out
//             of it, bone-pale shards thrown off.
//   1900-3500 the dancers slow; the fire sinks; the risen ghosts waver and fade,
//             the rings and glows go out.
//   3500      at rest as drawn (the move ends at END).
//
// The contract (bakeoff/recipe.md): the gift goes to T = k.aim || the ground in
// front of the fire (alone); each spirit's path is a curve from `emit` (the fire's
// heart) to its own place along a row at T. All that flies and lands is on the
// overlay (k.pic / k.light), since T may be on another card. The dancers only
// dance in place. Every dancer's motion is one sampled list (every 40 ms).
export const END = 4000;
export const BEATS = { release: 1100, impact: 1500, settle: 3500 };
export const STILLS = [300, 750, 1100, 1300, 1550, 1900, 2800, 3700];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [236 + 19 * c, 214 + 41 * c * c, 255, Math.min(1, c * c * 2.2)]; }],
  mote: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [240, 232, 255, Math.min(1, c * 1.6)]; }],
  // a tongue of violet flame standing on its base (y = 1), white-hot at the heart
  flamev: [32, 64, (x, y) => {
    const hw = 0.46 * Math.pow(y, 0.7) * Math.pow(1 - y * 0.12, 1) * (1 - Math.pow(1 - y, 2) * 0.1), d = Math.abs(x - 0.5);
    if (y < 0.02 || d > hw) return [0, 0, 0, 0];
    const e = 1 - d / hw, core = Math.max(0, e - 0.35) / 0.65;
    return [196 + 40 * core, 140 + 80 * core, 255, Math.min(1, e * 1.6) * (0.35 + 0.65 * Math.min(1, y * 1.6))];
  }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, E = S.emit, FIRE = S.fire;
  const T = k.aim || S.alone;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const ph = (t, a, b) => sm(cl((t - a) / (b - a), 0, 1));
  const f1 = (v) => +v.toFixed(2);

  k.css(`.g-bone { border-radius: 50%; background: radial-gradient(closest-side, rgba(250,246,255,.95), rgba(214,196,255,.55) 30%, rgba(170,120,255,.16) 62%, rgba(150,90,255,0) 100%); }`);
  const ghostUrl = k.svg(`<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf6ff"/><stop offset="1" stop-color="#b8a2ee" stop-opacity=".25"/></linearGradient></defs><path d="M10,1C4.5,1 1.5,5.5 1.5,11V26L4.5,23.5L7,26L10,23.5L13,26L15.5,23.5L18.5,26V11C18.5,5.5 15.5,1 10,1Z" fill="url(#g)" stroke="#f6f0ff" stroke-width=".7"/><ellipse cx="7" cy="10" rx="1.7" ry="2.3" fill="#1a1030"/><ellipse cx="13" cy="10" rx="1.7" ry="2.3" fill="#1a1030"/><ellipse cx="10" cy="15" rx="1.5" ry="2" fill="#1a1030"/>`, 20, 28);
  const ringUrl = k.svg(`<ellipse cx="30" cy="12" rx="26" ry="8" fill="none" stroke="#b894ff" stroke-width="4" opacity=".3"/><ellipse cx="30" cy="12" rx="26" ry="8" fill="none" stroke="#e4d4ff" stroke-width="2" opacity=".6"/><ellipse cx="30" cy="12" rx="26" ry="8" fill="none" stroke="#fbf6ff" stroke-width=".9"/>`, 60, 24);
  const boneUrl = k.svg(`<path d="M1.5,5.5L8.5,2.5M2,2.2A1.4,1.4 0 1 1 3.8,3.8M1.2,6.6A1.4,1.4 0 1 0 3.2,7.2M9,2.2A1.4,1.4 0 1 1 7.2,3.8" stroke="#f4ecff" stroke-width="1.5" fill="none" stroke-linecap="round"/><circle cx="2.4" cy="2.8" r="1.5" fill="#f4ecff"/><circle cx="8.2" cy="3.2" r="1.5" fill="#f4ecff"/>`, 10, 9);

  // ── the dancers: whirling up to speed, a leap at the release, slowing by 3300
  const env = (t) => ph(t, 0, 900) * (1 - ph(t, 1900, 3300));
  const peak = (t) => Math.exp(-(((t - 1180) / 260) ** 2));
  const grid = [];
  for (let t = 0; t <= 3560; t += 40) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3700, { transform: 'none' }]];
  const skel = (name, p, dir) => act(k.part(name), sample((t) => {
    const e = env(t), pk = peak(t), h = Math.abs(Math.sin((Math.PI * t) / 380 + p)), up = -e * (5 + 9 * pk) * h;
    return { transform: `${k.T(0, up)} rotate(${f1(e * dir * (5 * Math.sin((2 * Math.PI * t) / 760 + p) - 7 * pk))}deg) scale(${f1(1 + e * 0.02 * (1 - h))}, ${f1(1 - e * 0.04 * (1 - h) + e * 0.05 * pk)})` };
  }));
  const ghost = (name, p, dir) => act(k.part(name), sample((t) => {
    const e = env(t), pk = peak(t);
    return { transform: `${k.T(0, -e * (3 + 8 * pk) * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 900 + p)))} rotate(${f1(e * dir * (7 * Math.sin((2 * Math.PI * t) / 1000 + p) - 5 * pk))}deg)` };
  }));
  skel('skelL', 0, 1); skel('skelR', 1.7, -1); ghost('ghostL', 0.6, 1); ghost('ghostR', 2.3, -1);

  // ── the fire: swelling, a column roaring up at the release, sinking
  fx(k.lightIn('g-violet', [FIRE[0], FIRE[1] + 4], 150, 110), [[0, { opacity: 0 }, 'ease-out'], [700, { opacity: 0.55 }, eio], [1000, { opacity: 0.7 }, 'ease-out'], [1200, { opacity: 0.85 }, eio], [1700, { opacity: 0.75 }, eio], [2500, { opacity: 0.3 }, eio], [3300, { opacity: 0 }]]);
  fx(k.lightIn('g-bone', [FIRE[0], FIRE[1] - 6], 70, 80), [[400, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(1)', opacity: 0.45 }, eio], [1150, { transform: 'scale(1.4)', opacity: 0.6 }, 'ease-out'], [1600, { transform: 'scale(1.1)', opacity: 0.4 }, eio], [2600, { transform: 'scale(.8)', opacity: 0 }]]);
  const tongue = (x, w, hgt, t0, lean) => {
    const L = [[t0, { transform: 'scale(.5, .15)', opacity: 0 }, 'ease-out']];
    for (let t = t0 + 140, i = 0; t < 2500; t += 90 + rand() * 50, i++) {
      const up = ph(t, 900, 1150) * (1 - ph(t, 1500, 2300)), s = i % 2 ? 1 : -1;
      L.push([t, { transform: `skewX(${f1(lean + s * (2 + rand() * 4))}deg) scale(${f1((1 - s * 0.08) * (0.9 + 0.1 * ph(t, t0, 900)))}, ${f1((0.8 + 0.4 * ph(t, t0, 900) + 0.7 * up) * (1 + s * 0.1) * (1 - 0.5 * ph(t, 2000, 2500)))})`, opacity: f1(0.5 + 0.3 * ph(t, t0, 900) + rand() * 0.05) }, eio]);
    }
    L.push([2900, { transform: 'scale(.5, .15)', opacity: 0 }]);
    fx(k.picIn('flamev', [x, 176], w, hgt, { base: true }), L);
  };
  [[150, 22, 78, 200, 0], [137, 17, 60, 300, -6], [163, 17, 62, 380, 6], [126, 12, 42, 450, -9], [174, 12, 42, 520, 9], [145, 13, 50, 600, -3], [156, 13, 52, 680, 3]].forEach(([x, w, h, t0, ln]) => tongue(x, w, h, t0, ln));

  // ── pale motes drawn from each dancer into the fire while the dance gathers
  [[86, 150], [214, 150], [38, 142], [264, 142]].forEach(([x, y], d) => {
    for (let i = 0; i < 3; i++) {
      const t = 150 + d * 90 + i * 240 + Math.round(rand() * 60), yy = y + (rand() - 0.5) * 16, ex = FIRE[0] + (rand() - 0.5) * 14, ey = FIRE[1] - 4 + (rand() - 0.5) * 10;
      const at = (f, s, o) => ({ transform: `${k.T((ex - x) * f, (ey - yy) * f - Math.sin(f * Math.PI) * 14)} scale(${s})`, opacity: o });
      fx(k.pic('mote', [x, yy], 5, 5), [[t, at(0, 0.6, 0), 'ease-in'], [t + 100, at(0.1, 1, 0.9)], [t + 380, at(0.7, 0.8, 0.85), 'ease-in'], [t + 540, at(1, 0.3, 0)]]);
    }
  });

  // ── four spirits leave the fire in turn (BEATS.release) and land in a row at T
  const flight = 400;
  for (let i = 0; i < 4; i++) {
    const t0 = 1100 + i * 90, ti = t0 + flight, side = (i - 1.5), Ti = [T[0] + side * 28, T[1]];
    const C = [(E[0] + Ti[0]) / 2 + side * 26, Math.min(E[1], Ti[1]) - 46 - (i % 2) * 10];
    const bz = (u) => { const q = 1 - u; return [q * q * E[0] + 2 * q * u * C[0] + u * u * Ti[0], q * q * E[1] + 2 * q * u * C[1] + u * u * Ti[1]]; };
    const at = (u, s, o) => { const p = bz(u); return { transform: `${k.T(p[0] - E[0], p[1] - E[1])} scale(${s})`, opacity: o }; };
    const along = (delay, s0, o0, size, src) => {
      const L = [[t0 + delay, at(0, s0 * 0.4, 0), 'ease-out']];
      for (let m = 1; m <= 9; m++) { const u = Math.min(1, m / 9); L.push([t0 + delay + Math.round(u * flight), at(u, s0 * (1 - 0.35 * u * (delay > 0)), o0 * (1 - 0.2 * u)), 'linear']); }
      L.push([t0 + delay + flight + 160, at(1, s0 * 0.3, 0)]);
      return L;
    };
    // the orb itself and its comet tail
    fx(k.light('g-bone', E, 16), along(0, 1, 1));
    for (let j = 1; j <= 4; j++) fx(k.pic('spark', E, 8 - j, 8 - j), along(j * 34, 1, 0.9 - j * 0.12));
    // where it lands (at Ti)
    const [x, y] = Ti;
    fx(k.light('g-violet', [x, y - 4], 38), [[ti - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [ti + 60, { transform: 'scale(1.2)', opacity: 1 }, eio], [ti + 500, { transform: 'scale(.9)', opacity: 0.55 }, eio], [ti + 1500, { transform: 'scale(1)', opacity: 0.4 }, eio], [ti + 1900, { transform: 'scale(.6)', opacity: 0 }]]);
    fx(k.pic(ringUrl, [x, y + 2], 34, 14, { low: true }), [[ti, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [ti + 80, { transform: 'scale(.5)', opacity: 1 }, 'ease-out'], [ti + 600, { transform: 'scale(1.5)', opacity: 0.35 }, 'ease-out'], [ti + 900, { transform: 'scale(1.9)', opacity: 0 }]]);
    fx(k.pic(ringUrl, [x, y + 2], 22, 9, { low: true }), [[ti + 120, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [ti + 220, { transform: 'scale(.8)', opacity: 0.9 }], [ti + 1500, { transform: 'scale(1)', opacity: 0.5 }, eio], [ti + 1900, { transform: 'scale(1.2)', opacity: 0 }]]);
    // the little ghost standing up out of the ground, wavering, then fading
    const sway = (tt, d) => `${k.T(Math.sin(tt / 230 + i) * 1.2, d + Math.sin(tt / 300 + i * 2) * 1.6)} scale(1)`;
    const gl = [[ti + 20, { transform: `${k.T(0, 4)} scale(.4, .1)`, opacity: 0 }, 'ease-out'], [ti + 260, { transform: `${k.T(0, -1)} scale(1.05, 1.1)`, opacity: 0.95 }, 'ease-out'], [ti + 380, { transform: `${k.T(0, -2)} scale(1)`, opacity: 0.95 }, eio]];
    for (let tt = ti + 560; tt < ti + 1600; tt += 180) gl.push([tt, { transform: sway(tt, -3 - (tt - ti) * 0.004), opacity: 0.9 }, eio]);
    gl.push([ti + 1950, { transform: `${k.T(0, -12)} scale(.9, 1.06)`, opacity: 0 }]);
    fx(k.pic(ghostUrl, [x, y + 4], 19, 26.6, { base: true }), gl);
    // bone-pale shards thrown off at the landing
    for (let b = 0; b < 4; b++) {
      const a = (b / 4) * Math.PI * 2 + rand() * 1.2, dist = 12 + rand() * 12, r = Math.round(rand() * 360);
      const bp = (f, s, o) => ({ transform: `${k.T(Math.cos(a) * dist * f, Math.sin(a) * dist * 0.55 * f - 12 * Math.sin(f * 2.6))} rotate(${r + Math.round(f * 160)}deg) scale(${s})`, opacity: o });
      fx(k.pic(boneUrl, [x, y - 2], 4.5, 4, { lit: false }), [[ti + 20, bp(0, 0.6, 0), 'ease-out'], [ti + 80, bp(0.25, 1, 1), 'ease-out'], [ti + 480, bp(1, 0.9, 0.7), 'ease-in'], [ti + 700, bp(1.1, 0.8, 0)]]);
      fx(k.pic('spark', [x, y - 2], 6, 6), [[ti + 10, bp(0, 0.5, 0), 'ease-out'], [ti + 70, bp(0.3, 1, 1), 'ease-out'], [ti + 340, bp(0.9, 0.5, 0)]]);
    }
  }
  // a pool of light on the ground at T while the dead stand
  fx(k.light('g-aura', [T[0], T[1] + 2], 110, 46), [[1500, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1900, { transform: 'scale(1)', opacity: 0.9 }, eio], [2900, { transform: 'scale(1.1)', opacity: 0.5 }, eio], [3400, { transform: 'scale(1.2)', opacity: 0 }]]);
}
