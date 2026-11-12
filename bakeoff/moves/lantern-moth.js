// Lantern Moth: it gathers the dusk's light into its lantern and lets its swarm go.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker, element: light
// (suggestion kept: Soar + Multiply, a swarm of 1/1 lights that strike from the air).
//   0-700     it gathers: slow wing beats, the feelers twitch, the lantern swells and
//             brightens; glints stream in from the small moths of the swarm to its lantern
//             ("more joining them"). Its glow grows.
//   700-1000  it draws its wings back, lantern squeezed small and blazing.
//   1000      (BEATS.release) wings snap forward, the lantern flares and a swarm of nine
//             little glowing moths flutters out of it, fanning in an arc to T.
//   1460      (BEATS.impact) the first lands: a flare, a ring of light, sparks; each moth
//             that lands pops into two tiny ones that scatter outward (Multiply) and fade.
//   1800-3400 the glow at T warms and fades; its wings beat more and more gently, the
//             lantern settles, the feelers fold back; at rest as drawn by 3400.
//
// The contract (bakeoff/recipe.md): the swarm leaves `emit` (the lantern) for T = k.aim ||
// its own target (up and away over the meadow); every point of its path is worked out
// from those two. The wing nearer T sweeps harder and the feelers lean toward it.
// What flies and lands is on the overlay (k.pic / k.light), since T may be on another card.
// Every motion of a part is one sampled list (every 40 ms).
export const END = 4000;
export const BEATS = { release: 1000, impact: 1460, settle: 3400 };
export const STILLS = [350, 800, 1020, 1200, 1480, 1700, 2500, 3600];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 232 + 23 * c * c, 160 + 95 * c * c, Math.min(1, c * c * 2.2)]; }],
  mote: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 240, 190, Math.min(1, c * 1.6)]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, E = S.emit, root = S.root, lamp = S.lamp;
  const T = k.aim || S.alone, right = T[0] >= root[0];
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const ph = (t, a, b) => sm(cl((t - a) / (b - a), 0, 1));
  const grid = [];
  for (let t = 0; t <= 3400; t += 40) grid.push(t);
  const sample = (fn, last0 = {}) => [...grid.map((t) => [t, fn(t), 'linear']), [3560, { transform: 'none', ...last0 }]];

  k.css(`.g-gold { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,246,214,.95), rgba(255,218,140,.5) 25%, rgba(255,190,90,.14) 55%, rgba(255,170,60,0) 100%); }`);

  // ── the wings: slow beats as it gathers, drawn back, a snap forward at the release, then gentler beats
  //    f > 0: wings drawn back and in (foreshortened); f < 0: thrown forward and wide
  const flap = (t) => {
    let f = 0.3 * (0.5 - 0.5 * Math.cos((2 * Math.PI * t) / 520)) * ph(t, 0, 300) * (1 - ph(t, 600, 800));
    f += 1.0 * ph(t, 640, 980);
    f -= 1.45 * ph(t, 980, 1080);
    f += 0.45 * ph(t, 1080, 1300);
    if (t > 1300) f += 0.0;
    const calm = ph(t, 1300, 3300);
    f += (0.2 * Math.sin((2 * Math.PI * (t - 1300)) / 600)) * (1 - calm) * ph(t, 1300, 1500);
    return f * (1 - ph(t, 3000, 3400) * 0.0);
  };
  const wing = (t, near) => {
    const f = flap(t) * (near ? 1.15 : 0.9), w = f > 0 ? f : f * 0.6;
    const end = ph(t, 3000, 3400); // eases to exactly the drawn pose
    const g = w * (1 - end);
    return { s: 1 - 0.45 * g, sy: 1 + 0.04 * Math.abs(g) - 0.03 * g, r: -9 * g };
  };
  const fw = (side) => (t) => { const a = wing(t, (side > 0) === right); return { transform: `rotate(${(a.r * side).toFixed(2)}deg) scale(${a.s.toFixed(3)}, ${a.sy.toFixed(3)})` }; };
  act(k.part('wingR'), sample(fw(1)));
  act(k.part('wingL'), sample(fw(-1)));
  // the feelers twitch as it gathers, sweep back with the wings, and lean toward T when it lets go
  const feel = (side) => (t) => {
    const lean = (right ? 1 : -1) * 7 * (ph(t, 980, 1100) * (1 - ph(t, 1500, 2300)));
    const tw = Math.sin(t / 95 + side) * 3.2 * ph(t, 100, 400) * (1 - ph(t, 650, 800)) + Math.sin(t / 130) * 1.6 * ph(t, 1500, 1800) * (1 - ph(t, 2600, 3200));
    const back = -side * 8 * (ph(t, 700, 980) * (1 - ph(t, 1080, 1500)));
    return { transform: `rotate(${(lean + tw + back).toFixed(2)}deg)` };
  };
  act(k.part('feelR'), sample(feel(1)));
  act(k.part('feelL'), sample(feel(-1)));
  // the lantern swells and brightens as it gathers, is squeezed small, flares, and settles
  const lampS = (t) => {
    let s = 1 + 0.16 * ph(t, 0, 650) + 0.03 * Math.sin(t / 70) * ph(t, 150, 600) * (1 - ph(t, 650, 800));
    s -= 0.22 * ph(t, 700, 980);
    s += 0.62 * ph(t, 980, 1060);
    s -= 0.4 * ph(t, 1060, 1500);
    s += 0.1 * ph(t, 1500, 2000) * (1 - ph(t, 2000, 3300));
    s -= 0.1 * ph(t, 3000, 3500) * 0;
    return 1 + (s - 1) * (1 - ph(t, 3000, 3400));
  };
  act(k.part('lantern'), sample((t) => ({ transform: `scale(${lampS(t).toFixed(3)})` })));

  // ── the lantern's light: swells, flares at the release, burns down
  fx(k.lightIn('g-gold', lamp, 78, 70), [[0, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [500, { transform: 'scale(1)', opacity: 0.55 }, eio], [900, { transform: 'scale(.8)', opacity: 0.8 }, eio], [1040, { transform: 'scale(1.6)', opacity: 1 }, eio], [1400, { transform: 'scale(1.3)', opacity: 0.6 }, eio], [2400, { transform: 'scale(1.1)', opacity: 0.3 }, eio], [3400, { transform: 'scale(.8)', opacity: 0 }]]);
  // the dusk around it glows too: a wide soft light on the wings
  fx(k.lightIn('g-gold', [150, 90], 170, 90), [[300, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(.9)', opacity: 0.35 }, eio], [1100, { transform: 'scale(1.1)', opacity: 0.5 }, eio], [2200, { transform: 'scale(1)', opacity: 0.2 }, eio], [3300, { transform: 'scale(.8)', opacity: 0 }]]);

  // ── the gather: glints stream in from the little moths of the swarm to the lantern
  const [X0, Y0] = k.P(...E);
  const rel = (p) => { const [x, y] = k.P(...p); return [x - X0, y - Y0]; };
  const swarmAt = [[58, 170], [70, 150], [52, 128], [84, 120], [70, 98], [100, 60], [214, 52], [236, 78], [228, 128], [246, 152], [204, 168], [270, 104]];
  swarmAt.forEach((src, i) => {
    const t0 = 60 + i * 52, C = [(src[0] + E[0]) / 2, Math.min(src[1], E[1]) - 10 - rand() * 10];
    const pts = k.arc(src, C, E, 6), [sx, sy] = k.P(...src);
    fx(k.picIn('mote', src, 3.4, 3.4), pts.map((p, j) => { const [x, y] = k.P(...p); return [Math.round(t0 + 80 * j), { transform: `translate(${(x - sx).toFixed(1)}px, ${(y - sy).toFixed(1)}px) scale(${(0.7 + 0.4 * j / 6).toFixed(2)})`, opacity: j === 0 || j === 6 ? 0 : 0.95 }, 'linear']; }));
  });
  for (let i = 0; i < 8; i++) {
    const a = rand() * Math.PI * 2, d = 20 + rand() * 14, t0 = 250 + i * 55, sz = 2 + rand() * 2;
    const f = (u, o) => ({ transform: `${k.T(Math.cos(a) * d * (1 - u), Math.sin(a) * d * (1 - u) * 0.8)} scale(${(0.5 + 0.7 * u).toFixed(2)})`, opacity: o });
    fx(k.picIn('spark', lamp, sz * 2, sz * 2), [[t0, f(0, 0), 'ease-in'], [t0 + 120, f(0.25, 0.9)], [t0 + 380, f(0.9, 0.9), 'ease-in'], [t0 + 470, f(1, 0)]]);
  }

  // ── the swarm (BEATS.release to .impact): nine little moths, dark wings and a bright body, fluttering
  //    out of the lantern, fanning in an arc to T on the overlay
  const wingPic = k.svg('<path d="M8,5C6.5,-.4 1.4,-.8 .5,2.8C-.1,5.8 4,8.4 8,5Z M8,5C9.5,-.4 14.6,-.8 15.5,2.8C16.1,5.8 12,8.4 8,5Z" fill="#33251a" stroke="#ffe0a0" stroke-width=".55" stroke-linejoin="round"/>', 16, 9);
  const dist = Math.hypot(T[0] - E[0], T[1] - E[1]), nrm = [-(T[1] - E[1]) / dist, (T[0] - E[0]) / dist];
  const N = 9, REL = 1000, TRAVEL = 460;
  const fly = (i, t0, from, to, bend, travel, sz, sq) => {
    const mid = [(from[0] + to[0]) / 2 + nrm[0] * bend, (from[1] + to[1]) / 2 + nrm[1] * bend - 6];
    const pts = k.arc(from, mid, to, 8, (u) => Math.pow(u, 1.15)), [fx0, fy0] = k.P(...from);
    const row = (j, kind) => {
      const [x, y] = k.P(...pts[j]), vis = j === 0 ? 0 : j === 8 ? 0 : 1, fl = j % 2 ? 0.5 : 1.05, s = sz * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, (j + 1) / 5)));
      return [Math.round(t0 + (travel * j) / 8), { transform: `translate(${(x - fx0).toFixed(1)}px, ${(y - fy0).toFixed(1)}px) scale(${(kind === 'w' ? s * fl : s).toFixed(2)}, ${(kind === 'w' ? s : s).toFixed(2)})`, opacity: kind === 'w' ? (vis ? 0.95 : 0) : (vis ? 1 : 0) }, 'linear'];
    };
    const wl = [], gl = [];
    for (let j = 0; j <= 8; j++) { wl.push(row(j, 'w')); gl.push(row(j, 'g')); }
    fx(k.pic(wingPic, from, 7 * sz, 4 * sz, { lit: false }), wl);
    fx(k.pic('spark', from, 4.4 * sz, 4.4 * sz), gl);
  };
  const landers = [];
  for (let i = 0; i < N; i++) {
    const t0 = REL + 10 + i * 48, spread = (i - (N - 1) / 2) / ((N - 1) / 2);
    const to = [T[0] + (rand() - 0.5) * 14, T[1] + (rand() - 0.5) * 12], from = [E[0] + (rand() - 0.5) * 6, E[1] + (rand() - 0.5) * 6];
    fly(i, t0, from, to, spread * (10 + 0.12 * dist) + (rand() - 0.5) * 5, TRAVEL - 30 + rand() * 40, 1.7 + rand() * 0.4);
    landers.push([t0 + TRAVEL - 10, to]);
  }
  // ── where it lands (BEATS.impact = the first): a flare, a ring, sparks; each moth that lands splits in two
  const IM = REL + 10 + TRAVEL - 10;
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#fff3cc" stroke-width="3" filter="url(#b)"/>', 60, 60);
  fx(k.light('g-gold', T, 68), [[IM - 70, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 30, { transform: 'scale(1.2)', opacity: 1 }, eio], [IM + 450, { transform: 'scale(1.35)', opacity: 0.7 }, eio], [IM + 1400, { transform: 'scale(1.5)', opacity: 0.25 }, eio], [IM + 2000, { transform: 'scale(1.2)', opacity: 0 }]]);
  [0, 160, 320].forEach((dl, i) => fx(k.pic(ring, T, 24, 24), [[IM + dl, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + dl + 60, { transform: 'scale(.55)', opacity: 0.95 }], [IM + dl + 640, { transform: `scale(${1.8 + 0.5 * i})`, opacity: 0 }]]));
  landers.forEach(([t, to], i) => {
    // a pop where each lands, and two tiny moths scatter out from it
    fx(k.pic('spark', to, 8, 8), [[t - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(1.5)', opacity: 1 }, eio], [t + 330, { transform: 'scale(.6)', opacity: 0 }]]);
    for (let q = 0; q < 2; q++) {
      const a = (q ? 1 : -1) * (0.9 + rand() * 0.7) + (rand() - 0.5) * 0.4 - Math.PI / 2, d = 12 + rand() * 12;
      const pos = (u) => `${k.T(Math.cos(a) * d * u, Math.sin(a) * d * u - 6 * u)}`;
      const wl = [], gl = [];
      for (let j = 0; j <= 7; j++) {
        const u = j / 7, fl = j % 2 ? 0.5 : 1.05, op = j === 0 ? 0 : j > 5 ? Math.max(0, (7 - j) / 2) : 1;
        wl.push([Math.round(t + 20 + j * 60), { transform: `${pos(u)} scale(${(fl * 0.9).toFixed(2)}, .9)`, opacity: 0.9 * op }, 'linear']);
        gl.push([Math.round(t + 20 + j * 60), { transform: `${pos(u)} scale(.9)`, opacity: op }, 'linear']);
      }
      fx(k.pic(wingPic, to, 5, 3, { lit: false }), wl);
      fx(k.pic('spark', to, 3.4, 3.4), gl);
    }
  });
  for (let i = 0; i < 14; i++) {
    const a = rand() * Math.PI * 2, d = 12 + rand() * 20, t0 = IM + rand() * 260, sz = 2 + rand() * 2.6;
    fx(k.pic('spark', T, sz, sz), [[t0, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t0 + 100, { transform: `${k.T(Math.cos(a) * d * 0.4, Math.sin(a) * d * 0.4)} scale(1.2)`, opacity: 1 }], [t0 + 650, { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d - 4)} scale(.3)`, opacity: 0 }]]);
  }
  // golden motes rising from where it landed
  for (let i = 0; i < 8; i++) {
    const t0 = IM + 120 + i * 130 + rand() * 60, x = (rand() - 0.5) * 20, rise = 14 + rand() * 18, sz = 2 + rand() * 2.2;
    const f = (u, o) => ({ transform: `${k.T(x + Math.sin(u * 5 + i) * 2.5, 3 - rise * u)} scale(${(0.6 + 0.6 * Math.sin(Math.PI * Math.min(1, u * 1.2))).toFixed(2)})`, opacity: o });
    fx(k.pic('spark', T, sz, sz), [[t0, f(0, 0), 'ease-out'], [t0 + 150, f(0.2, 0.9)], [t0 + 700, f(0.7, 0.8), 'ease-in'], [t0 + 1100, f(1, 0)]]);
  }
}
