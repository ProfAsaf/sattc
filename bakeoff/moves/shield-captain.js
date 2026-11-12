// Shield Captain: she holds the line against a charge out of the dawn.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: defender, element: light.
//   60-400    she braces (BEATS.release): leans into her tall shield, which comes
//             forward; the sword goes up and blazes; down the line the ten
//             shield-bearers shuffle in one after another and lock their shields
//             (a click of gold light at each, running away to the right).
//   900, 1500, 2060 (alone; else k.blows)  a spear of shadow comes out of the
//             dawn from the left and strikes her shield (BEATS.impact: the first).
//             At each blow: the shield is driven back into her and rebounds, she
//             rocks on her feet, the sun on her shield flares, a flash and a ring
//             of gold at the guard, sparks flung back, dust at her feet, a beam
//             leaps up her sword; and the shock RUNS DOWN THE LINE: each
//             bearer in turn jolts and rebounds, a gold light pulsing on his
//             shield as it passes, dust at his feet. Each blow a little stronger.
//   after the last, she holds, then eases; the sword's blaze and the gold die down.
//   3500      at rest as drawn (the move ends at END).
//
// The contract (bakeoff/recipe.md): blows come as k.blows || her own three
// spears; each is taken at its time `at`, on the nearest of her `guard` points.
// A spear is drawn only when she plays alone. Her shield, body, sword, sun and
// each bearer are one sampled list each (every 40 ms), the sum of every blow's
// damped shake, so blows may come as close together as they like.
export const END = 4000;
export const BEATS = { release: 400, impact: 900, settle: 3500 };
export const STILLS = [250, 600, 880, 940, 1150, 1560, 2300, 3750];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 226 + 29 * c * c, 150 + 105 * c * c, Math.min(1, c * c * 2.2)]; }],
  dust: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, n = 0.75 + 0.25 * Math.sin(x * 17 + y * 11) * Math.cos(y * 13 - x * 7); return [190, 160, 112, Math.max(0, 1 - r) * 0.8 * n]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, G = S.guard, feet = S.feet, foot = S.foot, hand = S.hand, bodyC = S.hit, ROW = S.rowFeet;
  const alone = !k.blows;
  const own = [{ at: 900, to: G[0] }, { at: 1500, to: G[1] }, { at: 2060, to: G[2] }];
  const near = (to) => G.reduce((b, g) => (Math.hypot(g[0] - to[0], g[1] - to[1]) < Math.hypot(b[0] - to[0], b[1] - to[1]) ? g : b), G[0]);
  const B = (k.blows || own).slice().sort((a, b) => a.at - b.at).map((b, i) => ({ t: Math.max(300, Math.min(2600, b.at)), g: near(b.to), s: 1 + 0.12 * i }));
  const last = B.at(-1).t;

  k.css(`.g-dawn { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,252,236,.95), rgba(255,230,160,.55) 28%, rgba(255,200,110,.16) 58%, rgba(255,180,80,0) 100%); }`);

  // ── what shakes her: the brace (0..1), and each blow's damped shake (push, then rebound)
  const holdTo = Math.min(last + 800, 2800), relaxTo = 3560;
  const brace = (t) => sm(Math.max(0, Math.min(1, (t - 60) / 340))) * (1 - sm(Math.max(0, Math.min(1, (t - holdTo) / (relaxTo - holdTo)))));
  const shake = (tau) => (tau <= 0 ? 0 : (Math.exp(-tau / 170) * Math.sin((2 * Math.PI * tau) / 280)) / 0.66);
  const flash = (tau) => (tau < -15 ? 0 : tau < 0 ? 1 + tau / 15 : Math.exp(-tau / 240));
  const hit = (t) => Math.max(0, ...B.map((b) => flash(t - b.t) * b.s));
  const away = (g, p) => { const d = [p[0] - g[0], p[1] - g[1]], n = Math.hypot(...d) || 1; return [d[0] / n, d[1] / n]; };

  // ── where she and her shield are at ms t (a pose: drawing units and degrees)
  const man = (t) => {
    const b = brace(t);
    let dx = -0.3 * b, dy = 0, th = -0.8 * b;
    for (const bl of B) {
      const x = shake(t - bl.t - 25) * bl.s, d = away(bl.g, bodyC);
      dx += d[0] * 1.5 * x; dy += d[1] * 0.6 * x + 0.3 * Math.abs(x); th += 1.8 * x * Math.sign(d[0] || 1);
    }
    return { dx, dy, th };
  };
  // a point of hers carried by the body's pose (it turns about her feet)
  const carry = (p, m) => { const r = (m.th * Math.PI) / 180, vx = p[0] - feet[0], vy = p[1] - feet[1]; return [feet[0] + vx * Math.cos(r) - vy * Math.sin(r) + m.dx, feet[1] + vx * Math.sin(r) + vy * Math.cos(r) + m.dy]; };
  const shield = (t, m) => {
    const b = brace(t);
    let dx = 1.3 * b, dy = -0.2 * b, th = 0.8 * b;
    for (const bl of B) {
      const x = shake(t - bl.t) * bl.s, d = away(bl.g, bodyC), side = Math.max(-1, Math.min(1, (bl.g[1] - 140) / 20));
      dx += d[0] * 3.6 * x; dy += d[1] * 3.2 * x; th += x * (1.5 * side * Math.sign(d[0] || 1) - 0.8);
    }
    const [px, py] = carry(foot, m);
    return { dx: px - foot[0] + dx, dy: py - foot[1] + dy, th: m.th + th };
  };
  const sword = (t, m) => {
    const b = brace(t);
    let dy = -2.4 * b, th = -5 * b;
    for (const bl of B) { const tau = t - bl.t - 70; if (tau > 0) th += bl.s * 4.2 * Math.exp(-tau / 330) * Math.sin((2 * Math.PI * tau) / 420); }
    const [px, py] = carry(hand, m);
    return { dx: px - hand[0], dy: py - hand[1] + dy, th: m.th + th };
  };
  // each bearer: shuffles in and locks (staggered down the line), and takes the shock when it reaches him
  const bearer = (t, i, rel) => {
    const [x] = ROW[i];
    const tb = t - 90 - i * 38, bi = sm(Math.max(0, Math.min(1, tb / 240))) * (1 - sm(Math.max(0, Math.min(1, (t - holdTo - i * 25) / (relaxTo - holdTo - 250)))));
    let dx = -0.5 * bi, dy = 0.5 * bi, th = 0;
    for (const bl of B) {
      const dist = Math.abs(x - bl.g[0]), tau = t - bl.t - 60 - dist * 2.1, a = bl.s / (1 + dist / 120), sx = shake(tau) * a, dir = Math.sign(x - bl.g[0]) || 1;
      dx += dir * 1.2 * sx; dy += 0.5 * Math.abs(sx); th += dir * 1.6 * sx;
    }
    return { dx, dy, th };
  };
  const tf = (p) => `${k.T(p.dx, p.dy)} rotate(${p.th.toFixed(2)}deg)`;
  const grid = [];
  for (let t = 0; t <= 3560; t += 40) grid.push(t);
  const sample = (fn, last0 = {}) => [...grid.map((t) => [t, fn(t), 'linear']), [3700, { transform: 'none', ...last0 }]];
  const M = (t) => man(t);
  act(k.part('her'), sample((t) => ({ transform: tf(M(t)) })));
  act(k.part('shield'), sample((t) => ({ transform: tf(shield(t, M(t))) })));
  act(k.part('sword'), sample((t) => ({ transform: tf(sword(t, M(t))) })));
  // the sun on her shield rides with it, and brightens at each blow (a scale pulse)
  act(k.part('sunmark'), sample((t) => ({ transform: `${tf(shield(t, M(t)))} scale(${(1 + 0.16 * hit(t)).toFixed(3)})` })));
  ROW.forEach((_, i) => act(k.part(`row${i}`), sample((t) => ({ transform: tf(bearer(t, i)) }))));

  // ── the gold edge of her shield: a gold copy behind it, 7% larger, lit by the brace and at each blow
  const rim = k.copy('shield', 'fx-rim', { behind: true });
  act(rim, sample((t) => ({ transform: `${tf(shield(t, M(t)))} scale(1.07)`, opacity: +Math.min(1, 0.03 + 0.3 * brace(t) + 0.9 * hit(t)).toFixed(2) }), { opacity: 0 }));
  // a ward of light standing before the shield, flaring at each blow
  const ward = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1.1"/></filter><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9b0" stop-opacity="0"/><stop offset=".5" stop-color="#fffbea"/><stop offset="1" stop-color="#ffe9b0" stop-opacity="0"/></linearGradient></defs>' +
    '<path d="M34,3Q4,38 34,73" fill="none" stroke="url(#g)" stroke-width="3.2" filter="url(#b)"/>', 40, 76);
  act(k.pic(ward, [100, 141], 30, 64), sample((t) => {
    const s = shield(t, M(t)), f = hit(t), b = brace(t);
    return { transform: `${k.T(s.dx - 1.5 * f, s.dy)} scale(${(0.8 + 0.2 * b + 0.14 * f).toFixed(3)})`, opacity: +Math.min(1, 0.35 * b + 0.7 * f).toFixed(2) };
  }, { opacity: 0 }));

  // ── her sword blazes: a light at its tip and a beam leaping up from it at each blow
  const tip = [hand[0], 32];
  const beam = k.svg('<defs><linearGradient id="g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff6dc" stop-opacity=".95"/><stop offset="1" stop-color="#ffe7a0" stop-opacity="0"/></linearGradient></defs><path d="M3,60L1,0L5,0Z" fill="url(#g)"/>', 6, 60);
  act(k.light('g-dawn', tip, 54), sample((t) => ({ transform: `${k.T(sword(t, M(t)).dx, sword(t, M(t)).dy)} scale(${(0.7 + 0.5 * brace(t) + 0.5 * hit(t)).toFixed(3)})`, opacity: +Math.min(1, 0.7 * brace(t) + 0.5 * hit(t)).toFixed(2) }), { opacity: 0 }));
  act(k.pic(beam, [hand[0], 20], 7, 60), sample((t) => ({ transform: `${k.T(sword(t, M(t)).dx, sword(t, M(t)).dy)} scale(${(0.8 + 0.5 * hit(t)).toFixed(3)}, ${(0.6 + 1.0 * hit(t)).toFixed(3)})`, opacity: +Math.min(1, 0.12 * brace(t) + 0.85 * hit(t)).toFixed(2) }), { opacity: 0 }));

  // ── the line locking: a click of gold at each bearer's shield as he shuffles in, and the shock passing
  ROW.forEach(([x, b], i) => {
    const sy = b - 27 * (0.84 - i * 0.05), w = 18 - i * 0.9, list = [[0, { opacity: 0, transform: 'scale(.5)' }, 'ease-out']];
    const ts = 90 + i * 38 + 200;
    list.push([ts, { opacity: 0, transform: 'scale(.5)' }, 'ease-out'], [ts + 50, { opacity: 0.9, transform: 'scale(1.1)' }], [ts + 320, { opacity: 0, transform: 'scale(1.5)' }]);
    for (const bl of B) {
      const dist = Math.abs(x - bl.g[0]), tp = Math.round(bl.t + 60 + dist * 2.1), a = Math.min(1, bl.s / (1 + dist / 220));
      list.push([tp - 20, { opacity: 0, transform: 'scale(.6)' }, 'ease-out'], [tp + 30, { opacity: +a.toFixed(2), transform: 'scale(1.2)' }], [tp + 320, { opacity: 0, transform: 'scale(1.7)' }]);
    }
    list.sort((p, q) => p[0] - q[0]);
    fx(k.lightIn('g-dawn', [x, sy], w, w * 1.5), list.filter((e, j, a) => j === 0 || e[0] > a[j - 1][0]));
    // dust kicked up at his feet as the shock passes
    for (const bl of B) {
      const dist = Math.abs(x - bl.g[0]), tp = Math.round(bl.t + 80 + dist * 2.1), r = Math.round(rand() * 360), sc = 0.5 + 0.5 * Math.min(1, bl.s / (1 + dist / 140));
      fx(k.picIn('dust', [x, b + 1], 11, 10, { lit: false }), [[tp, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [tp + 120, { transform: `${k.T(1.5, -2)} rotate(${r + 15}deg) scale(${sc.toFixed(2)})`, opacity: 0.5 * sc }], [tp + 560, { transform: `${k.T(5, -8)} rotate(${r + 40}deg) scale(${(1.3 * sc).toFixed(2)})`, opacity: 0 }]]);
    }
  });

  // ── at each blow: a flash and a ring of light at the guard, the sun flaring, sparks flung back, dust at her feet
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#fff3cc" stroke-width="3" filter="url(#b)"/>', 60, 60);
  const bolt = k.svg('<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a1d38" stop-opacity="0"/><stop offset=".6" stop-color="#241a30" stop-opacity=".9"/><stop offset="1" stop-color="#0d0812"/></linearGradient></defs>' +
    '<path d="M0,5Q14,1 28,5Q14,9 0,5Z" fill="url(#g)"/><path d="M20,4.6Q27,4 30,5Q27,6 20,5.4Z" fill="#8c6bd0" opacity=".7"/>', 30, 10);
  B.forEach((bl, i) => {
    const t = bl.t, [gx, gy] = bl.g, s = bl.s, side = gx < 150 ? -1 : 1; // sparks fly back the way the blow came
    fx(k.light('g-dawn', bl.g, 66), [[t - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 20, { transform: `scale(${(1.3 * s).toFixed(2)})`, opacity: 1 }, eio], [t + 160, { transform: `scale(${(1.6 * s).toFixed(2)})`, opacity: 0.5 }, eio], [t + 440, { transform: 'scale(2.1)', opacity: 0 }]]);
    fx(k.pic(ring, bl.g, 26, 26), [[t, { transform: 'scale(.3, .2)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(.6, .45)', opacity: 0.95 }], [t + 420, { transform: `scale(${(1.9 * s).toFixed(2)}, ${(1.4 * s).toFixed(2)})`, opacity: 0 }]]);
    // the sun mark flaring
    fx(k.light('g-dawn', [112, 141], 40), [[t - 20, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 30, { transform: `scale(${(1.1 * s).toFixed(2)})`, opacity: 0.95 }], [t + 380, { transform: 'scale(1.5)', opacity: 0 }]]);
    for (let j = 0; j < 11; j++) {
      const a = Math.atan2(-0.7, side) + (rand() - 0.5) * 2, dist = 14 + rand() * 30, g = 10 + rand() * 12, sz = 6 + rand() * 6, t0 = t + rand() * 40;
      const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * dist * f, Math.sin(a) * dist * f + g * f * f)} scale(${sc})`, opacity: o });
      fx(k.pic('spark', bl.g, sz, sz), [[t0, P(0, 0.5, 0), 'ease-out'], [t0 + 40, P(0.2, 1.1, 1), 'ease-out'], [t0 + 240, P(0.75, 0.9, 0.9), 'ease-in'], [t0 + 480 + rand() * 160, P(1, 0.3, 0)]]);
    }
    for (let j = 0; j < 3; j++) {
      const x = feet[0] + (j - 1) * 9 + (rand() - 0.5) * 4, t0 = t + 30 + j * 30, r = Math.round(rand() * 360);
      fx(k.picIn('dust', [x, feet[1] + 1], 16, 16, { lit: false }), [[t0, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 120, { transform: `${k.T((j - 1) * 3, -3)} rotate(${r + 15}deg) scale(.9)`, opacity: 0.55 }], [t0 + 650, { transform: `${k.T((j - 1) * 7, -11)} rotate(${r + 40}deg) scale(1.6)`, opacity: 0 }]]);
    }
    // alone: a spear of shadow comes out of the dawn (100 ms of flight) and bursts into gloom the light thins away
    if (alone) {
      const Sx = [gx - 125 - rand() * 12, gy - 26 + (i - 1) * 12], C = [(Sx[0] + gx) / 2, Math.min(Sx[1], gy) - 14];
      const pts = k.arc(Sx, C, bl.g, 7, (u) => Math.pow(u, 1.5)), [X0, Y0] = k.P(...Sx), T0 = t - 190;
      const ang = (p, q) => (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI;
      const GP = k.P(...bl.g);
      fx(k.pic(bolt, Sx, 40, 13), [...pts.map((p, j) => { const [x, y] = k.P(...p), a = ang(pts[Math.max(0, j - 1)], pts[Math.min(7, j + 1)]); return [Math.round(T0 + (190 * j) / 7), { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) rotate(${a.toFixed(1)}deg)`, opacity: j === 0 ? 0 : 1 }, 'linear']; }), [t + 18, { transform: `translate(${(GP[0] - X0).toFixed(1)}px, ${(GP[1] - Y0).toFixed(1)}px) rotate(${ang(pts[6], pts[7]).toFixed(1)}deg)`, opacity: 0 }]]);
      for (let j = 1; j < 7; j++) fx(k.pic('gloom', pts[j], 20, 20, { lit: false }), [[Math.round(T0 + (190 * j) / 7), { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [Math.round(T0 + (190 * j) / 7) + 80, { transform: 'scale(.8)', opacity: 0.5 }], [Math.round(T0 + (190 * j) / 7) + 240, { transform: `${k.T(-2, -4)} scale(1.4)`, opacity: 0 }]]);
      for (let j = 0; j < 5; j++) {
        const a = Math.atan2(-0.4, side) + (rand() - 0.5) * 2.2, d = 8 + rand() * 12, r = Math.round(rand() * 360);
        fx(k.pic('gloom', bl.g, 20, 20, { lit: false }), [[t - 5, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 70, { transform: `${k.T(Math.cos(a) * d * 0.5, Math.sin(a) * d * 0.5 - 2)} rotate(${r + 20}deg) scale(1)`, opacity: 0.7 }], [t + 600, { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d - 12)} rotate(${r + 60}deg) scale(1.8)`, opacity: 0 }]]);
      }
    }
  });
}
