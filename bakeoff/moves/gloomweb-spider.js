// Gloomweb Spider: it spits venom.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker, element: venom
// (the card says Venom; the suggestion was nature, the green of the picture's fungus
// is the venom's colour).
//   0-560     it gathers. It draws itself up its silk (6 units), curls its legs in
//             and swings round on the thread to face its target; the fangs spread,
//             its eyes flare violet, an acid-green bead swells between the fangs
//             and drips; the web tenses and trembles.
//   560-780   it drops on the silk and lunges, legs thrown wide, abdomen squeezed.
//   800       RELEASE: the venom is spat, a lead glob and a spray of droplets along
//             a short lob from the fangs to T, over a strand of silk that grows with
//             it from the fangs.
//   1100      IMPACT at T: a flash of green light, a flat splash that stains, a ring,
//             droplets flung with gravity, hissing vapour rising.
//   900-2400  it recoils; the legs shiver, the web shakes and rings out; the fangs
//             close; the stain sizzles, then fades.
//   3400      at rest as drawn (BEATS.settle); the move ends at END.
//
// The contract (bakeoff/recipe.md): T = k.aim, or its own spot (a lower corner of
// the web). The spider swings about the foot of its silk (spec.hang) toward T, and
// every point of the spit is worked out from the fangs (spec.emit, carried through
// the swing and lunge) and T.
export const END = 4000;
export const BEATS = { release: 800, impact: 1100, settle: 3400 };
export const STILLS = [300, 560, 780, 900, 1120, 1500, 2300, 3700];

const noise = (x, y) => 0.7 + 0.2 * Math.sin(x * 11 + y * 5) * Math.cos(y * 9 - x * 4) + 0.1 * Math.sin(x * 23 - y * 17);
export const textures = {
  // a bead of acid venom: lime, white-hot at its heart
  vglob: [40, 40, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, a = Math.pow(Math.max(0, 1 - r), 0.85) * 1.2, h = Math.min(1, a * a); return [140 + 110 * h, 232 + 23 * h, 70 + 130 * h, Math.min(1, a)]; }],
  // a splash seen flat: ragged, rays thrown out
  vsplat: [64, 64, (x, y) => {
    const dx = x - 0.5, dy = y - 0.5, r = Math.hypot(dx, dy) * 2, an = Math.atan2(dy, dx);
    const edge = 0.5 + 0.17 * Math.sin(an * 5 + 1) + 0.12 * Math.sin(an * 9 + 2) + 0.2 * Math.max(0, Math.sin(an * 7 + 0.5)) ** 3;
    const a = Math.max(0, Math.min(1, (edge - r) * 5)) * (1 - 0.3 * r) * noise(x, y);
    return [96 + 90 * (1 - r), 176 + 60 * (1 - r), 62 + 60 * (1 - r), a];
  }],
  // vapour off the burning stain
  vvap: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2; return [176, 234, 140, Math.pow(Math.max(0, 1 - r), 1.4) * noise(x * 1.3, y) * 0.65]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const Q = k.spec.hang, E0 = k.spec.emit, eyes = k.spec.eyes, roots = k.spec.roots;
  const T = k.aim || k.spec.alone;
  const rad = (d) => (d * Math.PI) / 180;

  k.css(`.g-venom { border-radius: 50%; background: radial-gradient(closest-side, rgba(236,255,190,.95), rgba(172,242,100,.55) 28%, rgba(120,212,72,.17) 58%, rgba(100,200,60,0) 100%); }`);

  // ── a curve through [ms, value] points, eased between them
  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  // how far round it swings (deg, clockwise): to face T, at most 50 off straight down
  const th0 = Math.max(-50, Math.min(50, (-Math.atan2(T[0] - Q[0], T[1] - Q[1]) * 180) / Math.PI));
  const TH = curve([[0, 0], [200, 0], [720, th0], [1650, th0], [2900, 0]]);
  // how far it hangs down its silk (units): up, then the drop
  const LG = curve([[0, 0], [440, -6], [560, -6.5], [790, 9], [980, 4], [1600, 5], [2500, 3], [3400, 0]]);
  // its legs: curled in while gathering (negative), flung wide on the lunge, relaxing
  const FLEX = curve([[0, 0], [440, -7], [560, -8], [780, 14], [920, 8], [1500, 5], [2800, 1], [3400, 0]]);
  const FANG = curve([[0, 1], [300, 1.25], [560, 1.45], [860, 1.45], [1060, 0.88], [1260, 1.06], [1600, 1], [3400, 1]]);
  const BODY = curve([[0, 1], [520, 1.045], [800, 0.95], [1000, 1.02], [1500, 1], [3400, 1]]);
  const pos = (p, t) => {
    const a = rad(TH(t)), c = Math.cos(a), s = Math.sin(a), vx = p[0] - Q[0], vy = p[1] - Q[1], l = LG(t);
    return [Q[0] + vx * c - vy * s - s * l, Q[1] + vx * s + vy * c + c * l];
  };
  const mv = (p, t) => { const q = pos(p, t); return k.T(q[0] - p[0], q[1] - p[1]); };

  const grid = [];
  for (let t = 0; t <= 3400; t += 40) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3600, { transform: 'none' }]];
  // each leg from its root: pairs have their own timing (front first), and shiver after the spit
  const shiver = (t, i, side) => { const tau = t - 830 - i * 40; return tau > 0 ? 2.6 * Math.exp(-tau / 650) * Math.sin(tau / (95 + i * 12) + i * 1.3 + side) : 0; };
  const pre = (t, i, side) => (t < 600 && t > 150 ? 1.1 * Math.sin(t / 55 + i * 2 + side) * sm(Math.min(1, (t - 150) / 200)) : 0); // tense, trembling
  for (let i = 0; i < 4; i++) {
    const mult = [1.35, 1.1, 0.9, 0.75][i];
    for (const side of [0, 1]) {
      const name = (side ? 'legR' : 'legL') + i, sg = side ? -1 : 1, P = side ? [300 - roots[i][0], roots[i][1]] : roots[i];
      act(k.part(name), sample((t) => ({ transform: `${mv(P, t)} rotate(${(TH(t) + sg * (FLEX(t) * mult + shiver(t, i, side) + pre(t, i, side))).toFixed(2)}deg)` })));
    }
  }
  act(k.part('fangs'), sample((t) => ({ transform: `${mv([150, 112], t)} rotate(${TH(t).toFixed(2)}deg) scale(${FANG(t).toFixed(3)}, 1)` })));
  act(k.part('body'), sample((t) => ({ transform: `${mv([150, 80], t)} rotate(${TH(t).toFixed(2)}deg) scale(${(2 - BODY(t)).toFixed(3)}, ${BODY(t).toFixed(3)})` })));
  // the silk it hangs by: from its fixed end to wherever the spider's top has got to
  act(k.part('thread'), sample((t) => {
    const e = pos(Q, t), vx = e[0] - 150, vy = e[1], a = (-Math.atan2(vx, vy) * 180) / Math.PI;
    return { transform: `rotate(${a.toFixed(2)}deg) scale(1, ${(Math.hypot(vx, vy) / Q[1]).toFixed(3)})` };
  }));
  // the web: pulled as it tenses, jolted by the lunge and the spit, ringing out
  act(k.part('web'), sample((t) => {
    const tau = t - 700, tau2 = t - 820, g = sm(Math.max(0, Math.min(1, (t - 100) / 400))) * (1 - sm(Math.max(0, Math.min(1, (t - 600) / 150))));
    const a = (tau > 0 ? 0.013 * Math.exp(-tau / 800) * Math.sin(tau / 36) : 0) + 0.004 * g * Math.sin(t / 50) + (tau2 > 0 ? 0.006 * Math.exp(-tau2 / 600) * Math.sin(tau2 / 61) : 0);
    const r = (tau > 0 ? 0.55 * Math.exp(-tau / 900) * Math.sin(tau / 65) : 0) + 0.25 * g * Math.sin(t / 77);
    return { transform: `rotate(${r.toFixed(3)}deg) scale(${(1 + a).toFixed(4)}, ${(1 - a * 0.8 + 0.006 * g).toFixed(4)})` };
  }));

  // ── at the fangs (they ride with the spider): eyes flare, a bead swells and drips, then it is spat
  const follow = (p, t0, t1, f, step = 40) => {
    const out = [];
    for (let t = t0; t <= t1; t += step) { const q = pos(p, t), e = f(t); out.push([t, { transform: `${k.T(q[0] - p[0] + (e.dx || 0), q[1] - p[1] + (e.dy || 0))} scale(${(e.s ?? 1).toFixed(3)})`, opacity: +e.o.toFixed(2) }, 'linear']); }
    return out;
  };
  fx(k.lightIn('g-violet', eyes, 46, 46), follow(eyes, 120, 2100, (t) => ({ s: 0.8 + 0.5 * sm(Math.min(1, t / 700)), o: 0.95 * Math.min(sm((t - 120) / 400), 1 - sm((t - 1000) / 1100)) })));
  fx(k.lightIn('g-venom', E0, 44, 44), follow(E0, 380, 1000, (t) => ({ s: 0.4 + 0.9 * sm((t - 380) / 400) + (t > 800 ? 0.6 * sm((t - 800) / 120) : 0), o: t < 800 ? 0.85 * sm((t - 380) / 250) : 0.9 * (1 - sm((t - 800) / 200)) })));
  fx(k.picIn('vglob', E0, 13, 13), follow(E0, 380, 860, (t) => ({ dy: t < 800 ? 0.7 * sm((t - 380) / 420) : 0, s: t < 800 ? 0.25 + 1.0 * sm((t - 380) / 420) : 1.25 + 0.9 * sm((t - 800) / 60), o: t < 800 ? 0.95 : 0.95 * (1 - sm((t - 800) / 60)) })));
  // drips off the fangs while it gathers
  [[-7, 420], [6, 540], [-2, 650]].forEach(([dx, t0]) => {
    const p = [E0[0] + dx * 0.5, E0[1] - 1];
    fx(k.picIn('vglob', p, 7, 7), follow(p, t0, t0 + 320, (t) => { const f = (t - t0) / 320; return { dy: 2 + 15 * f * f, s: (0.5 + 0.7 * sm(Math.min(1, f * 2))) * (1 - 0.3 * f), o: f < 0.8 ? 0.9 : 0.9 * (1 - (f - 0.8) / 0.2) }; }));
  });

  // ── the spit: from the fangs as they are at the release, over a short lob, to T
  const E = pos(E0, 800), L = Math.hypot(T[0] - E[0], T[1] - E[1]), ang = (Math.atan2(T[1] - E[1], T[0] - E[0]) * 180) / Math.PI;
  const C = [(E[0] + T[0]) / 2, (E[1] + T[1]) / 2 - Math.min(10, L * 0.08)];
  const bz = (t) => { const q = 1 - t; return [q * q * E[0] + 2 * q * t * C[0] + t * t * T[0], q * q * E[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const nrm = [-(T[1] - E[1]) / L, (T[0] - E[0]) / L];
  const [X0, Y0] = k.P(...E);
  const FLY = 300;
  // a strand of silk, grown from the fangs (a long strip, drawn on its right half only, turned about the fangs)
  const strand = k.svg(`<path d="M${L.toFixed(1)},2L${(2 * L).toFixed(1)},2" stroke="#e6defa" stroke-width=".7" opacity=".85"/><path d="M${(L * 1.25).toFixed(1)},2.1L${(L * 1.9).toFixed(1)},2.1" stroke="#c9f08a" stroke-width=".5" stroke-dasharray="1.4 5" opacity=".9"/>`, 2 * L, 4);
  const sa = ang.toFixed(1);
  fx(k.pic(strand, E, 2 * L, 4, { low: true }), [[780, { transform: `rotate(${sa}deg) scale(.02, 1)`, opacity: 0 }, 'ease-out'], [800, { transform: `rotate(${sa}deg) scale(.04, 1)`, opacity: 0.9 }, 'ease-out'], [800 + FLY, { transform: `rotate(${sa}deg) scale(1, 1)`, opacity: 0.9 }],
    [1500, { transform: `rotate(${sa}deg) scale(1, 1)`, opacity: 0.55 }, eio], [2000, { transform: `rotate(${sa}deg) scale(1, 1)`, opacity: 0 }]]);
  const along = (t0, dur, lat, sz, sc0, sc1, o, stretch = 1.7, gdrop = 0) => {
    const kf = [];
    for (let j = 0; j <= 7; j++) {
      const f = j / 7, w = Math.pow(f, 0.85), q = bz(w), [x, y] = k.P(...q), off = lat * Math.sin(Math.PI * w) * u + gdrop * f * f * u, s = sc0 + (sc1 - sc0) * f;
      kf.push([Math.round(t0 + dur * f), { transform: `translate(${(x - X0 + nrm[0] * off).toFixed(1)}px, ${(y - Y0 + nrm[1] * off).toFixed(1)}px) rotate(${ang.toFixed(1)}deg) scale(${(s * stretch).toFixed(2)}, ${s.toFixed(2)})`, opacity: j === 0 ? 0 : j === 7 ? 0.9 * o : o }, j < 7 ? 'linear' : 'ease-out']);
    }
    kf.push([Math.round(t0 + dur + 50), { ...kf.at(-1)[1], opacity: 0 }]);
    fx(k.pic('vglob', E, sz, sz), kf);
  };
  along(800, FLY, 0, 22, 1, 0.85, 1, 1.9);       // the lead glob
  along(812, FLY - 20, 0.5, 14, 0.9, 0.7, 0.95, 1.7); // and a second
  for (let i = 0; i < 12; i++) {
    const d = rand() * 160, lat = (rand() - 0.5) * 12, sz = 6 + rand() * 6;
    along(810 + d, FLY - 20 + rand() * 80, lat, sz, 0.9, 0.7, 0.9, 1.3 + rand() * 0.6, 4 + rand() * 5);
  }

  // ── where it lands (BEATS.impact): light, a staining splash, a ring, droplets, vapour
  const IMP = 800 + FLY, rot0 = Math.round(rand() * 360);
  const il = [[IMP - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 40, { transform: 'scale(1.25)', opacity: 0.95 }]];
  for (let t = IMP + 160, i = 0; t < 1900; t += 130, i++) il.push([t, { transform: `scale(${i % 2 ? 1.1 : 0.92})`, opacity: i % 2 ? 0.8 : 0.55 }, eio]);
  il.push([2400, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.light('g-venom', T, 84), il);
  const st = (s, a, o) => ({ transform: `rotate(${rot0 + a}deg) scale(${s}, ${(s * 0.8).toFixed(3)})`, opacity: o });
  fx(k.pic('vsplat', T, 48, 48, { lit: false }), [[IMP - 10, st(0.2, 0, 0), 'cubic-bezier(.2,.7,.4,1)'], [IMP + 120, st(1, 4, 0.92)], [2600, st(1.04, 6, 0.9), eio], [3300, st(1.04, 6, 0)]]);
  const gl = [[IMP - 10, st(0.2, 0, 0), 'cubic-bezier(.2,.7,.4,1)'], [IMP + 120, st(1, 4, 0.95)]];
  for (let t = IMP + 260, i = 0; t < 2500; t += 130 + rand() * 80, i++) gl.push([Math.round(t), st(1.02, 5, i % 2 ? 0.75 : 0.35), eio]);
  gl.push([2900, st(1.04, 6, 0)]);
  fx(k.pic('vsplat', T, 48, 48), gl);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#dcffa8" stroke-width="3" filter="url(#b)"/>', 60, 60);
  fx(k.pic(ring, T, 40, 40), [[IMP, { transform: 'scale(.25, .2)', opacity: 0 }, 'ease-out'], [IMP + 50, { transform: 'scale(.6, .48)', opacity: 0.95 }], [IMP + 520, { transform: 'scale(2, 1.6)', opacity: 0 }]]);
  for (let i = 0; i < 16; i++) {
    const a = -Math.PI * (0.08 + 0.84 * rand()), dist = 16 + rand() * 38, g = 12 + rand() * 14, sz = 5 + rand() * 7, t0 = Math.round(IMP + rand() * 50);
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * dist * f * 1.2, Math.sin(a) * dist * f + g * f * f)} scale(${sc})`, opacity: o });
    fx(k.pic('vglob', T, sz, sz), [[t0, P(0, 0.6, 0), 'ease-out'], [t0 + 40, P(0.2, 1.1, 1), 'ease-out'], [t0 + 280, P(0.75, 0.9, 0.9), 'ease-in'], [Math.round(t0 + 520 + rand() * 160), P(1, 0.3, 0)]]);
  }
  for (let i = 0; i < 5; i++) {
    const t = IMP + 120 + i * 240, r = Math.round(rand() * 360), x = (rand() - 0.5) * 12;
    fx(k.pic('vvap', [T[0] + x, T[1] - 4], 36, 36, { lit: false, low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 350, { transform: `${k.T(-1, -9)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 1500, { transform: `${k.T(-5 + x * 0.3, -40)} rotate(${r + 50}deg) scale(1.9)`, opacity: 0 }]]);
  }
}
