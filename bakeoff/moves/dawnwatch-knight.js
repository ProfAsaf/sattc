// Dawnwatch Knight: he holds the wall against a volley.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: defender, element: light.
//   60-400    he braces (BEATS.release): leans into the shield, which comes up
//             and forward; its gold edge lights, a faint ward of light stands
//             before it; his long banner draws taut and begins to ripple.
//   900, 1500, 2060 (alone; else k.blows)  a bolt of shadow comes in from the
//             right and strikes the shield's face (BEATS.impact: the first).
//             At each blow: the shield is driven back into him and rebounds,
//             he is shoved and rocks on his feet, a flash of gold and a ring of
//             light at the guard, sparks flung back out, dust kicked up at his
//             feet; the shadow bursts into gloom the light thins away; and a
//             ripple runs the length of the banner, from the spear out to its
//             tail (each of its four pieces turns on its own joint, chained).
//             Their strength grows a little with each blow.
//   after the last, he holds, then eases; the gold dies down; the banner
//             stills.
//   3500      at rest as drawn (the move ends at END).
//
// The contract (bakeoff/recipe.md): blows come as k.blows || his own three
// bolts; each is taken at its time `at`, on the nearest of his `guard` points.
// A bolt is drawn only when he plays alone: with k.blows given, the attacker
// brings its own attack, and he only answers it. The motions of his shield,
// body, rim, ward and banner are one sampled list each (every 30 ms), the sum
// of every blow's damped shake, so blows may come as close together as they like.
export const END = 4000;
export const BEATS = { release: 380, impact: 900, settle: 3500 };
export const STILLS = [250, 600, 880, 930, 1100, 1560, 2200, 3700];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 226 + 29 * c * c, 150 + 105 * c * c, Math.min(1, c * c * 2.2)]; }],
  dust: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, n = 0.75 + 0.25 * Math.sin(x * 17 + y * 11) * Math.cos(y * 13 - x * 7); return [190, 160, 112, Math.max(0, 1 - r) * 0.8 * n]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const G = k.spec.guard, feet = k.spec.feet, sho = k.spec.shoulder, J = k.spec.joints;
  const alone = !k.blows;
  const own = [{ at: 900, to: G[0] }, { at: 1500, to: G[1] }, { at: 2060, to: G[2] }];
  const near = (to) => G.reduce((b, g) => (Math.hypot(g[0] - to[0], g[1] - to[1]) < Math.hypot(b[0] - to[0], b[1] - to[1]) ? g : b), G[0]);
  const B = (k.blows || own).slice().sort((a, b) => a.at - b.at).map((b, i) => ({ t: Math.max(300, Math.min(3000, b.at)), g: near(b.to), s: 1 + 0.12 * i }));
  const last = B.at(-1).t;
  const bodyC = k.spec.hit;

  k.css(`.g-dawn { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,252,236,.95), rgba(255,230,160,.55) 28%, rgba(255,200,110,.16) 58%, rgba(255,180,80,0) 100%); }`);

  // ── what shakes him: the brace (0..1), and each blow's damped shake (push, then rebound)
  const holdTo = last + 800, relaxTo = Math.min(holdTo + 750, 3560);
  const brace = (t) => sm(Math.max(0, Math.min(1, (t - 60) / 340))) * (1 - sm(Math.max(0, Math.min(1, (t - holdTo) / (relaxTo - holdTo)))));
  const shake = (tau) => (tau <= 0 ? 0 : (Math.exp(-tau / 170) * Math.sin((2 * Math.PI * tau) / 280)) / 0.66);
  const flash = (tau) => (tau < -15 ? 0 : tau < 0 ? 1 + tau / 15 : Math.exp(-tau / 240));
  const fold = (f) => B.reduce((a, b) => a + b.s * f(b), 0);

  // ── where he and his shield are at ms t (pose: drawing units and degrees)
  const man = (t) => {
    const b = brace(t);
    let dx = 0.5 * b, dy = 0, th = 1.0 * b;
    for (const bl of B) {
      const x = shake(t - bl.t - 25) * bl.s, d = [bodyC[0] - bl.g[0], bodyC[1] - bl.g[1]], n = Math.hypot(...d);
      dx += (d[0] / n) * 1.6 * x; dy += (d[1] / n) * 0.8 * x + 0.35 * Math.abs(x); th += -2 * x;
    }
    return { dx, dy, th };
  };
  const at = (p, m) => { const r = (m.th * Math.PI) / 180, vx = p[0] - feet[0], vy = p[1] - feet[1]; return [feet[0] + vx * Math.cos(r) - vy * Math.sin(r) + m.dx, feet[1] + vx * Math.sin(r) + vy * Math.cos(r) + m.dy]; };
  const shield = (t, m) => {
    const b = brace(t);
    let dx = 1.6 * b, dy = -0.3 * b, th = 1.2 * b;
    for (const bl of B) {
      const x = shake(t - bl.t) * bl.s, d = [bodyC[0] - bl.g[0], bodyC[1] - bl.g[1]], n = Math.hypot(...d), side = Math.max(-1, Math.min(1, (bl.g[1] - 121) / 12));
      dx += (d[0] / n) * 3.8 * x; dy += (d[1] / n) * 3.8 * x; th += x * (1.6 * side - 0.9);
    }
    const [px, py] = at(sho, m);
    return { dx: px - sho[0] + dx, dy: py - sho[1] + dy, th: m.th + th };
  };
  const tf = (p) => `${k.T(p.dx, p.dy)} rotate(${p.th.toFixed(2)}deg)`;
  // the banner: four pieces chained from the spear, each turning on its own joint
  const banner = (t, m) => {
    const b = brace(t);
    let [jx, jy] = at(J[0], m), th = m.th;
    return J.map((j, i) => {
      let a = b * 1.6 * Math.sin(t / 170 - i * 0.9) * (0.5 + 0.2 * i) - b * 1.2;
      for (const bl of B) {
        const tau = t - bl.t - 20 - i * 65;
        if (tau > 0) a += bl.s * (10 - i * 1.2) * Math.exp(-tau / 420) * Math.sin((2 * Math.PI * tau) / 520);
      }
      th += a;
      const out = { dx: jx - j[0], dy: jy - j[1], th };
      if (i < 3) { const L = J[i + 1][0] - j[0]; jx += L * Math.cos((th * Math.PI) / 180); jy += L * Math.sin((th * Math.PI) / 180); }
      return out;
    });
  };
  const grid = [];
  for (let t = 0; t <= 3570; t += 30) grid.push(t);
  const rest = { transform: 'none' };
  const sample = (fn, last0 = {}) => [...grid.map((t) => [t, fn(t), 'linear']), [3700, { ...rest, ...last0 }]];
  act(k.part('man'), sample((t) => ({ transform: tf(man(t)) })));
  act(k.part('shield'), sample((t) => ({ transform: tf(shield(t, man(t))) })));
  [0, 1, 2, 3].forEach((i) => act(k.part(`banner${i}`), sample((t) => ({ transform: tf(banner(t, man(t))[i]) }))));

  // ── the gold edge of the shield: a gold copy behind it, 7% larger, lit by the brace and at each blow
  const rim = k.copy('shield', 'fx-rim', { behind: true });
  act(rim, sample((t) => ({ transform: `${tf(shield(t, man(t)))} scale(1.07)`, opacity: +Math.min(1, 0.03 + 0.3 * brace(t) + 0.9 * Math.max(0, ...B.map((b) => flash(t - b.t)))).toFixed(2) }), { opacity: 0 }));
  // a faint ward of light standing before the shield, flaring at each blow
  const ward = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1.1"/></filter><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9b0" stop-opacity="0"/><stop offset=".5" stop-color="#fffbea"/><stop offset="1" stop-color="#ffe9b0" stop-opacity="0"/></linearGradient></defs>' +
    '<path d="M6,3Q36,38 6,73" fill="none" stroke="url(#g)" stroke-width="3.2" filter="url(#b)"/>', 40, 76);
  const W0 = [152, 123];
  act(k.pic(ward, W0, 30, 58), sample((t) => {
    const s = shield(t, man(t)), f = Math.max(0, ...B.map((b) => flash(t - b.t))), b = brace(t);
    return { transform: `${k.T(s.dx, s.dy)} scale(${(0.8 + 0.2 * b + 0.14 * f).toFixed(3)})`, opacity: +Math.min(1, 0.4 * b + 0.7 * f).toFixed(2) };
  }, { opacity: 0 }));

  // ── at each blow: a flash and a ring of light at the guard, sparks flung back, dust at his feet
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#fff3cc" stroke-width="3" filter="url(#b)"/>', 60, 60);
  const bolt = k.svg('<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a1d38" stop-opacity="0"/><stop offset=".6" stop-color="#241a30" stop-opacity=".9"/><stop offset="1" stop-color="#0d0812"/></linearGradient></defs>' +
    '<path d="M0,5Q14,1 28,5Q14,9 0,5Z" fill="url(#g)"/><path d="M20,4.6Q27,4 30,5Q27,6 20,5.4Z" fill="#8c6bd0" opacity=".7"/>', 30, 10);
  B.forEach((bl, i) => {
    const t = bl.t, [gx, gy] = bl.g, s = bl.s;
    fx(k.light('g-dawn', bl.g, 66), [[t - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 20, { transform: `scale(${(1.3 * s).toFixed(2)})`, opacity: 1 }, eio], [t + 160, { transform: `scale(${(1.6 * s).toFixed(2)})`, opacity: 0.5 }, eio], [t + 440, { transform: 'scale(2.1)', opacity: 0 }]]);
    fx(k.pic(ring, bl.g, 26, 26), [[t, { transform: 'scale(.3, .2)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(.6, .45)', opacity: 0.95 }], [t + 420, { transform: `scale(${(1.9 * s).toFixed(2)}, ${(1.4 * s).toFixed(2)})`, opacity: 0 }]]);
    // sparks, thrown back the way the blow came (to the right) and up, falling
    for (let j = 0; j < 11; j++) {
      const a = -0.2 - Math.PI * (0.1 + 0.55 * rand()) + (rand() - 0.5) * 0.4, dist = 14 + rand() * 30, g = 10 + rand() * 12, sz = 6 + rand() * 6, t0 = t + rand() * 40;
      const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * dist * f, Math.sin(a) * dist * f + g * f * f)} scale(${sc})`, opacity: o });
      fx(k.pic('spark', bl.g, sz, sz), [[t0, P(0, 0.5, 0), 'ease-out'], [t0 + 40, P(0.2, 1.1, 1), 'ease-out'], [t0 + 240, P(0.75, 0.9, 0.9), 'ease-in'], [t0 + 480 + rand() * 160, P(1, 0.3, 0)]]);
    }
    // dust kicked up at his feet
    for (let j = 0; j < 3; j++) {
      const x = feet[0] + (j - 1) * 9 + (rand() - 0.5) * 4, t0 = t + 30 + j * 30, r = Math.round(rand() * 360);
      fx(k.picIn('dust', [x, feet[1] + 1], 16, 16, { lit: false }), [[t0, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 120, { transform: `${k.T((j - 1) * 3, -3)} rotate(${r + 15}deg) scale(.9)`, opacity: 0.55 }], [t0 + 650, { transform: `${k.T((j - 1) * 7, -11)} rotate(${r + 40}deg) scale(1.6)`, opacity: 0 }]]);
    }
    // alone: the bolt of shadow comes in from the right (100 ms of flight), and bursts into gloom the light thins away
    if (alone) {
      const S = [gx + 118 + rand() * 12, gy - 30 + (i - 1) * 12], C = [(S[0] + gx) / 2, Math.min(S[1], gy) - 14];
      const pts = k.arc(S, C, bl.g, 7, (u) => Math.pow(u, 1.5)), [X0, Y0] = k.P(...S), T0 = t - 190;
      const ang = (p, q) => (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI;
      fx(k.pic(bolt, S, 40, 13), [...pts.map((p, j) => { const [x, y] = k.P(...p), a = ang(pts[Math.max(0, j - 1)], pts[Math.min(7, j + 1)]); return [Math.round(T0 + (190 * j) / 7), { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) rotate(${a.toFixed(1)}deg)`, opacity: j === 0 ? 0 : 1 }, 'linear']; }), [t + 18, { transform: `translate(${(k.P(...bl.g)[0] - X0).toFixed(1)}px, ${(k.P(...bl.g)[1] - Y0).toFixed(1)}px) rotate(${ang(pts[6], pts[7]).toFixed(1)}deg)`, opacity: 0 }]]);
      for (let j = 1; j < 7; j++) fx(k.pic('gloom', pts[j], 20, 20, { lit: false }), [[Math.round(T0 + (190 * j) / 7), { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [Math.round(T0 + (190 * j) / 7) + 80, { transform: 'scale(.8)', opacity: 0.5 }], [Math.round(T0 + (190 * j) / 7) + 240, { transform: `${k.T(-2, -4)} scale(1.4)`, opacity: 0 }]]);
      for (let j = 0; j < 5; j++) {
        const a = Math.PI * (0.6 + 0.8 * rand()), d = 8 + rand() * 12, r = Math.round(rand() * 360);
        fx(k.pic('gloom', bl.g, 20, 20, { lit: false }), [[t - 5, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 70, { transform: `${k.T(Math.cos(a) * d * 0.5, Math.sin(a) * d * 0.5 - 2)} rotate(${r + 20}deg) scale(1)`, opacity: 0.7 }], [t + 600, { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d - 12)} rotate(${r + 60}deg) scale(1.8)`, opacity: 0 }]]);
      }
    }
  });
}
