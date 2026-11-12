// Bastion Wall: the living wall of golden stone takes a volley and does not give.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: defender, element: earth.
//   0-300     it braces (BEATS.release): sets itself, the carved brow drops, the
//             eyes narrow and begin to glow; the arrows hang in the air and
//             tremble, the five of them, then come on one after another.
//   800, 1250, 1700, 2150, 2600 (alone; else k.blows)  an arrow strikes the
//             wall's flank where it is drawn to (BEATS.impact: the first).
//             At each blow: the wall is shoved and rebounds (its whole face
//             rides with it), a flash and a ring of light at the guard, the
//             burst of sparks on that flank flares, stone chips and gold sparks
//             fly, the arrow breaks (splinters, the head drops), the brow drops
//             lower and the eyes flare and loose a lance of light back out at
//             the one who loosed it; dust shakes from the battlements; the
//             arrows and spears lying round it jump; pebbles hop at its foot.
//   after the last, it holds, then eases: the brow lifts, the eyes calm.
//   3900      at rest as drawn; the arrows fade back, hanging where drawn (the
//             move ends at END).
//
// The contract (bakeoff/recipe.md): blows come as k.blows || its own five
// arrows; each is taken at its time `at`, on the nearest of its `guard`
// points. An arrow flies and breaks only when it plays alone: with k.blows
// given, the attacker brings its own, and the drawn arrows only fade out of
// the way and back. Every motion is one sampled list (every 40 ms), the sum
// of every blow's damped shake, so blows may come as close together as they like.
export const END = 4400;
export const BEATS = { release: 300, impact: 800, settle: 3800 };
export const STILLS = [200, 600, 780, 850, 1300, 2200, 3200, 4000];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 226 + 29 * c * c, 150 + 105 * c * c, Math.min(1, c * c * 2.2)]; }],
  dust: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, n = 0.75 + 0.25 * Math.sin(x * 17 + y * 11) * Math.cos(y * 13 - x * 7); return [196, 160, 104, Math.max(0, 1 - r) * 0.8 * n]; }],
  chip: [16, 16, (x, y) => { const r = Math.max(Math.abs(x - 0.5), Math.abs(y - 0.5)) * 2, hi = y < 0.45 && x < 0.55 ? 1 : 0; return [hi ? 214 : 150, hi ? 176 : 114, hi ? 112 : 66, r < 0.85 ? 1 : 0]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, G = S.guard, base = S.base, heads = S.heads, lying = S.lying, bursts = S.bursts, eyes = S.eyes;
  const alone = !k.blows;
  // (own blows: arrow, time, which guard point it strikes)
  const ownOrder = [[0, 800, 0], [2, 1250, 3], [1, 1700, 1], [3, 2150, 4], [4, 2600, 2]];
  const own = ownOrder.map(([i, at, g]) => ({ at, to: G[g], arrow: i }));
  const near = (to) => G.reduce((b, g) => (Math.hypot(g[0] - to[0], g[1] - to[1]) < Math.hypot(b[0] - to[0], b[1] - to[1]) ? g : b), G[0]);
  const B = (k.blows || own).slice().sort((a, b) => a.at - b.at).map((b, i) => ({ t: Math.max(500, Math.min(2800, b.at)), g: near(b.to), s: 1 + 0.08 * i, arrow: b.arrow, side: near(b.to)[0] < 150 ? -1 : 1 }));
  const last = B.at(-1).t;

  k.css(`.g-gold { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,246,214,.95), rgba(255,208,130,.5) 25%, rgba(255,170,70,.14) 55%, rgba(255,150,40,0) 100%); }`);

  const holdTo = Math.min(last + 700, 3300), relaxTo = 3800;
  const brace = (t) => sm(Math.max(0, Math.min(1, t / 300))) * (1 - sm(Math.max(0, Math.min(1, (t - holdTo) / (relaxTo - holdTo)))));
  const shake = (tau) => (tau <= 0 ? 0 : (Math.exp(-tau / 190) * Math.sin((2 * Math.PI * tau) / 300)) / 0.66);
  const flash = (tau) => (tau < -15 ? 0 : tau < 0 ? 1 + tau / 15 : Math.exp(-tau / 260));
  const hit = (t) => Math.max(0, ...B.map((b) => flash(t - b.t) * b.s));
  // how hard the face is set: the brace, then each blow drives it harder (until the hold ends)
  const grim = (t) => Math.min(1, 0.5 * brace(t) + 0.28 * brace(t) * B.filter((b) => t > b.t).length + 0.5 * hit(t));

  // ── the wall's pose (drawing units, degrees; it turns about its foot), and any point of it carried by that
  const wall = (t) => {
    let dx = 0, dy = 0.35 * brace(t), th = 0;
    for (const bl of B) { const x = shake(t - bl.t - 10) * bl.s; dx += -bl.side * 1.2 * x; dy += 0.5 * Math.abs(x); th += -bl.side * 0.5 * x; }
    return { dx, dy, th };
  };
  const carry = (p, m) => { const r = (m.th * Math.PI) / 180, vx = p[0] - base[0], vy = p[1] - base[1]; return [base[0] + vx * Math.cos(r) - vy * Math.sin(r) + m.dx, base[1] + vx * Math.sin(r) + vy * Math.cos(r) + m.dy]; };
  const ride = (p, t, extra = '') => { const m = wall(t), [x, y] = carry(p, m); return { transform: `${k.T(x - p[0], y - p[1])} rotate(${m.th.toFixed(2)}deg)${extra}` }; };
  const grid = [];
  for (let t = 0; t <= 3860; t += 40) grid.push(t);
  const sample = (fn, last0 = {}) => [...grid.map((t) => [t, fn(t), 'linear']), [3900, { transform: 'none', ...last0 }]];
  const part = (name, pv, extra) => act(k.part(name), sample((t) => ride(pv, t, extra ? extra(t) : '')));
  part('wall', base);
  part('brow', [150, 95], (t) => ` translate(0px, ${(1.7 * grim(t) * k.u).toFixed(2)}px) scale(1, ${(1 - 0.16 * grim(t)).toFixed(3)})`);
  part('eyes', [150, 112], (t) => ` scale(${(1 + 0.04 * hit(t)).toFixed(3)}, ${(1 - 0.42 * grim(t)).toFixed(3)})`);
  part('nose', [150, 108]);
  part('mouth', [150, 154], (t) => ` scale(${(1 + 0.05 * grim(t)).toFixed(3)}, ${(1 + 0.1 * grim(t)).toFixed(3)})`);
  // the bursts of sparks on its flanks flare with every blow near them
  bursts.forEach((b, i) => part(`burst${i}`, b, (t) => {
    let w = 0;
    for (const bl of B) w = Math.max(w, flash(t - bl.t) * bl.s * Math.exp(-Math.hypot(b[0] - bl.g[0], b[1] - bl.g[1]) / 55));
    return ` scale(${(1 + 1.3 * w).toFixed(3)})`;
  }));
  // the pebbles at its foot hop with each blow
  act(k.part('pebbles'), sample((t) => {
    let h = 0, r = 0;
    for (const bl of B) { const tau = t - bl.t - 30; if (tau > 0) { const e = Math.exp(-tau / 160); h += bl.s * 1.6 * e * Math.abs(Math.sin((2 * Math.PI * tau) / 300)); r += bl.s * 3 * e * Math.sin((2 * Math.PI * tau) / 300); } }
    return { transform: `${k.T(0, -h)} rotate(${r.toFixed(2)}deg)` };
  }));
  // the arrows and spears lying round it jump (the nearer the blow, the higher), and settle
  lying.forEach((p, i) => act(k.part(`fall${i}`), sample((t) => {
    let h = 0, r = 0, sx = 0;
    for (const bl of B) {
      const d = Math.hypot(p[0] - bl.g[0], p[1] - bl.g[1]), tau = t - bl.t - 30 - d * 0.6, a = bl.s * 3.2 / (1 + d / 70);
      if (tau > 0) { const e = Math.exp(-tau / 170); h += a * e * Math.abs(Math.sin((2 * Math.PI * tau) / 330 + 0.4)); r += (i % 2 ? 1 : -1) * a * 4 * e * Math.sin((2 * Math.PI * tau) / 330); sx += -bl.side * 0.3 * a * e; }
    }
    return { transform: `${k.T(sx, -h)} rotate(${r.toFixed(2)}deg)` };
  })));

  // ── the arrows in flight (as drawn, five): trembling in the air, then each comes on (alone) and breaks; with
  //    others' blows they only fade out of the way, and back in where they are drawn
  const ang = (i) => [18, 8, 160, 172, 2][i];
  heads.forEach((h, i) => {
    const bl = alone ? B.find((b) => b.arrow === i) : null, list = [[0, { transform: 'none', opacity: 1 }, eio]];
    if (bl) {
      const ts = bl.t - 380, d = [bl.g[0] - h[0], bl.g[1] - h[1]];
      for (let t = 140, j = 0; t < ts - 60; t += 130 + rand() * 40, j++) list.push([t, { transform: `${k.T((j % 2 ? 0.5 : -0.4) * (t / ts), (j % 2 ? 0.4 : -0.3))} rotate(${((j % 2 ? 1 : -1) * (0.7 + rand() * 0.8)).toFixed(2)}deg)`, opacity: 1 }, eio]);
      for (let j = 1; j <= 8; j++) { const f = Math.pow(j / 8, 1.6); list.push([Math.round(ts + (380 * j) / 8), { transform: `${k.T(d[0] * f, d[1] * f)} rotate(0deg)`, opacity: 1 }, 'linear']); }
      list.push([bl.t + 24, { transform: `${k.T(d[0] * 1.02, d[1] * 1.02)}`, opacity: 0 }]);
    } else {
      for (let t = 160, j = 0; t < 300; t += 140, j++) list.push([t, { transform: `rotate(${(j % 2 ? 1 : -1) * 0.8}deg)`, opacity: 1 }, eio]);
      list.push([480 + i * 60, { transform: 'none', opacity: 0 }]);
    }
    list.push([3500, { transform: 'none', opacity: 0 }, 'linear'], [3920, { transform: 'none', opacity: 1 }]);
    act(k.part(`fly${i}`), list.filter((e, j, a) => j === 0 || e[0] > a[j - 1][0]));
  });

  // ── at each blow
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#fff3cc" stroke-width="3" filter="url(#b)"/>', 60, 60);
  const lance = k.svg('<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff6dc" stop-opacity=".95"/><stop offset=".5" stop-color="#ffdf94" stop-opacity=".5"/><stop offset="1" stop-color="#ffc060" stop-opacity="0"/></linearGradient></defs><path d="M0,5Q20,2 60,4.6Q20,8 0,5Z" fill="url(#g)"/>', 60, 10);
  const wood = k.svg('<path d="M0,1.5 L11,0 L12,2.2 L1,2.6Z" fill="#2a1f15"/>', 12, 3), headp = k.svg('<path d="M0,3 L6,0 L9,3 L6,6Z" fill="#1c140d"/>', 9, 6);
  // each flank's eye lights, flaring with the blows on its side (and the brace)
  eyes.forEach((e, i) => {
    const list = [[0, { transform: 'scale(.6)', opacity: 0 }, eio]];
    for (let t = 80; t <= 3860; t += 40) list.push([t, { transform: `scale(${(0.85 + 0.3 * grim(t) + 0.6 * hit(t)).toFixed(3)})`, opacity: +Math.min(1, 0.1 + 0.5 * grim(t) + 0.5 * hit(t)).toFixed(2) }, 'linear']);
    list.push([3900, { transform: 'scale(.6)', opacity: 0 }]);
    fx(k.lightIn('g-gold', e, 34, 20), list);
  });
  B.forEach((bl, bi) => {
    const t = bl.t, [gx, gy] = bl.g, s = bl.s, side = bl.side, eye = eyes[side < 0 ? 0 : 1], out = -side; // `out`: away from the wall, the way the blow came from
    fx(k.light('g-gold', bl.g, 62), [[t - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 20, { transform: `scale(${(1.3 * s).toFixed(2)})`, opacity: 1 }, eio], [t + 160, { transform: `scale(${(1.6 * s).toFixed(2)})`, opacity: 0.5 }, eio], [t + 440, { transform: 'scale(2.1)', opacity: 0 }]]);
    fx(k.pic(ring, bl.g, 26, 26), [[t, { transform: 'scale(.3, .2)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(.6, .45)', opacity: 0.95 }], [t + 420, { transform: `scale(${(1.9 * s).toFixed(2)}, ${(1.5 * s).toFixed(2)})`, opacity: 0 }]]);
    // the lance of light loosed from its eye back out at the one who loosed the arrow
    const ex = eye[0], ey = eye[1], len = 70;
    fx(k.pic(lance, [ex + out * (len / 2), ey], len, 10), [[t + 40, { transform: `scale(${out < 0 ? -0.2 : 0.2}, .4)`, opacity: 0 }, 'ease-out'], [t + 90, { transform: `scale(${out < 0 ? -0.7 : 0.7}, 1)`, opacity: 0.9 }], [t + 220, { transform: `${k.T(out * 8, 0)} scale(${out < 0 ? -1 : 1}, .6)`, opacity: 0.5 }], [t + 380, { transform: `${k.T(out * 20, 0)} scale(${out < 0 ? -1.1 : 1.1}, .2)`, opacity: 0 }]]);
    // sparks and stone chips thrown out from the guard, falling
    for (let j = 0; j < 8; j++) {
      const a = Math.atan2(-0.55, out) + (rand() - 0.5) * 1.9, dist = 12 + rand() * 28, g = 10 + rand() * 12, sz = 5 + rand() * 6, t0 = t + rand() * 40;
      const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * dist * f, Math.sin(a) * dist * f + g * f * f)} scale(${sc})`, opacity: o });
      fx(k.pic('spark', bl.g, sz, sz), [[t0, P(0, 0.5, 0), 'ease-out'], [t0 + 40, P(0.2, 1.1, 1), 'ease-out'], [t0 + 240, P(0.75, 0.9, 0.9), 'ease-in'], [t0 + 440 + rand() * 160, P(1, 0.3, 0)]]);
    }
    for (let j = 0; j < 5; j++) {
      const a = Math.atan2(-0.8, out) + (rand() - 0.5) * 1.5, dist = 9 + rand() * 20, sz = 2 + rand() * 2.4, t0 = t + 10 + rand() * 40, spin = Math.round((rand() - 0.5) * 540), fall = 18 + rand() * 12;
      const P = (f, o) => ({ transform: `${k.T(Math.cos(a) * dist * f, Math.sin(a) * dist * f + fall * f * f)} rotate(${Math.round(spin * f)}deg)`, opacity: o });
      fx(k.pic('chip', bl.g, sz, sz, { lit: false }), [[t0, P(0, 0), 'ease-out'], [t0 + 20, P(0.05, 1), 'ease-out'], [t0 + 260, P(0.6, 1), 'ease-in'], [t0 + 520 + rand() * 120, P(1, 0)]]);
    }
    // dust puffed off its face where it struck, and shaken from the battlements
    for (let j = 0; j < 2; j++) { const r = Math.round(rand() * 360); fx(k.picIn('dust', [gx - out * 4 + (rand() - 0.5) * 6, gy + (rand() - 0.5) * 8], 20, 18, { lit: false }), [[t + 20, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 150, { transform: `${k.T(-out * 2, 2)} rotate(${r + 20}deg) scale(1)`, opacity: 0.6 }], [t + 800, { transform: `${k.T(-out * 6, 8)} rotate(${r + 50}deg) scale(1.8)`, opacity: 0 }]]); }
    for (let j = 0; j < 2; j++) {
      const x = 80 + ((bi * 2 + j) * 47) % 140 + rand() * 10, r = Math.round(rand() * 360);
      fx(k.picIn('dust', [x, 48], 14, 14, { lit: false }), [[t + 40 + j * 50, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 170 + j * 50, { transform: `${k.T(0, 3)} rotate(${r + 15}deg) scale(.8)`, opacity: 0.45 }], [t + 900 + j * 50, { transform: `${k.T(side * 2, 26)} rotate(${r + 40}deg) scale(1.3)`, opacity: 0 }]]);
    }
    // alone: the arrow breaks: splinters fly back, the head drops
    if (alone) {
      for (let j = 0; j < 4; j++) {
        const a = Math.atan2(-0.4, out) + (rand() - 0.5) * 1.8, dist = 8 + rand() * 18, t0 = t + 5 + rand() * 25, spin = Math.round((rand() - 0.5) * 700), w = 6 + rand() * 5;
        const P = (f, o) => ({ transform: `${k.T(Math.cos(a) * dist * f, Math.sin(a) * dist * f + 16 * f * f)} rotate(${Math.round(spin * f)}deg)`, opacity: o });
        fx(k.pic(wood, bl.g, w, 2.2, { lit: false }), [[t0, P(0, 0), 'ease-out'], [t0 + 15, P(0.05, 1), 'ease-out'], [t0 + 300, P(0.6, 1), 'ease-in'], [t0 + 560, P(1, 0)]]);
      }
      const dd = 14 + rand() * 6;
      fx(k.pic(headp, bl.g, 5, 4, { lit: false }), [[t, { transform: 'none', opacity: 0 }, 'ease-out'], [t + 15, { transform: `${k.T(out * 2, 0)}`, opacity: 1 }, 'ease-out'], [t + 330, { transform: `${k.T(out * 6, dd * 0.55)} rotate(${out * 160}deg)`, opacity: 1 }, 'ease-in'], [t + 520, { transform: `${k.T(out * 8, dd)} rotate(${out * 230}deg)`, opacity: 0 }]]);
    }
  });
}
