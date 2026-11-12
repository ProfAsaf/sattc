// Prism Duelist: inside her bubble she takes the strikes on its skin, and every one breaks into rainbow.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: defender (Shield), element: light (the
// suggestion was water; her bubble, rapier and rainbows are all light split into colour).
// Alone, the "blows" are three needles of black water out of the sea air, striking the bubble's skin
// on its right (high, middle, low).
//   0-450     the brace (BEATS.release): she drops into her lunge and gathers: wings flare and
//             beat, the rapier lifts a little, the bubble swells and brightens with a hot sheen
//             creeping round it, and flecks of colour stream in off the skin to the rapier's point
//             where a star kindles.
//   1100, 1700, 2300 (alone; else k.blows)  a blow lands on the nearest `guard` point on the skin
//             (BEATS.impact: the first): the bubble is driven in and rebounds, shivers, is lit hot
//             (a lit copy), a ring of every colour runs out of the point, a star and a flash, the
//             blow's strength is split into a fan of rainbow thrown back out along the skin's
//             normal, coloured sparks; she is knocked back inside it a beat later, the wings
//             stutter, the sword arm flicks a parry; the sea below flashes with colour.
//   after the last blow (+450) her riposte: she lunges forward, the rapier flares white and throws
//             a beam of light out along its line, the fan of rainbow beyond it blazes.
//   2900-3600 the light dies down; the bubble sinks back, she rises from her lunge to rest.
//   3600      at rest as drawn (BEATS.settle); the move ends at END.
// Contract: each blow is read at its time `at`, snapped to the nearest `guard` point; every effect at
// a blow is built from that point on the overlay (a blow may come from another card); the
// needle that comes in is drawn only when she plays alone.
export const END = 4200;
export const BEATS = { release: 300, impact: 1100, settle: 3600 };
export const STILLS = [350, 1130, 1300, 1780, 2400, 2900, 3300, 3900];

const HUES = [[255, 106, 106], [255, 178, 74], [255, 240, 106], [124, 240, 154], [106, 208, 255], [160, 122, 255]];
export const textures = {
  star: [48, 48, (x, y) => { const dx = Math.abs(x - 0.5) * 2, dy = Math.abs(y - 0.5) * 2, c = Math.max(0, 1 - Math.hypot(dx, dy)), cr = Math.max(0, 1 - Math.min(dx * 9 + dy, dy * 9 + dx)), v = Math.min(1, c * c * 1.6 + cr * 0.9); return [235 + 20 * v, 252, 255, v]; }],
  spark: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [240 + 15 * c, 250, 255, Math.min(1, c * c * 2.2)]; }],
  ...Object.fromEntries(HUES.map(([r, g, b], i) => [`fleck${i}`, [24, 24, (x, y) => { const d = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - d); return [r, g, b, Math.min(1, c * c * 2.4)]; }]])),
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, G = S.guard, C = S.centre, R = S.radius, SH = S.shoulder, W = S.roots, WA = S.waist, TIP = S.tip;
  const alone = !k.blows;
  const near = (to) => G.reduce((b, g) => (Math.hypot(g[0] - to[0], g[1] - to[1]) < Math.hypot(b[0] - to[0], b[1] - to[1]) ? g : b), G[0]);
  const own = [{ at: 1100, to: G[0] }, { at: 1700, to: G[1] }, { at: 2300, to: G[2] }];
  const B = (k.blows || own).slice().sort((a, b) => a.at - b.at).map((b, i) => ({ t: Math.max(700, Math.min(2500, b.at)), g: near(b.to), s: 1 + 0.12 * i }));
  const last = B.at(-1).t, HOME = 3600, RIP = last + 450;
  const unit = (g) => { const d = [g[0] - C[0], g[1] - C[1]], n = Math.hypot(...d) || 1; return [d[0] / n, d[1] / n]; }; // outward from her
  const deg = (a) => (a * 180) / Math.PI;
  const bladeAng = deg(Math.atan2(TIP[1] - 80, TIP[0] - 183.8)); // the rapier's line as drawn (about -7 degrees)

  k.css(`.g-prism { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,255,255,.95), rgba(214,248,255,.6) 28%, rgba(170,228,255,.2) 58%, rgba(150,210,255,0) 100%); }
    .fx-copy.f-hot { mix-blend-mode: plus-lighter; filter: brightness(1.6) saturate(1.3); }`);
  // textures of svg: a ring of every colour, a fan of rainbow (its point at the middle), a beam, a ring of white, a needle
  const spectrum = ['#ff6a6a', '#ffb24a', '#fff06a', '#7cf09a', '#6ad0ff', '#a07aff'];
  const ringRB = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".6"/></filter></defs>' + spectrum.map((c, i) => `<circle cx="30" cy="30" r="${14 + i * 2.6}" fill="none" stroke="${c}" stroke-width="1.8" opacity=".85"/>`).join('').replace(/<circle/g, '<circle filter="url(#b)"'), 60, 60);
  const ringW = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1.2"/></filter></defs><circle cx="60" cy="60" r="54" fill="none" stroke="#f2fdff" stroke-width="2.4" filter="url(#b)"/>', 120, 120);
  let wedges = '';
  spectrum.forEach((c, i) => { const a = (-16 + i * 6.4) * Math.PI / 180, a2 = a + 0.1; wedges += `<path d="M80,20L${(80 + Math.cos(a) * 76).toFixed(1)},${(20 + Math.sin(a) * 76).toFixed(1)}L${(80 + Math.cos(a2) * 76).toFixed(1)},${(20 + Math.sin(a2) * 76).toFixed(1)}Z" fill="${c}" opacity=".7"/>`; });
  const fan = k.svg(`<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><g filter="url(#b)">${wedges}</g>`, 160, 40);
  const beam = k.svg('<defs><linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#e4fbff" stop-opacity=".8"/><stop offset="1" stop-color="#bfeaff" stop-opacity="0"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation=".8"/></filter></defs><path d="M120,6Q150,3 200,5.4L238,6L200,6.6Q150,9 120,6Z" fill="url(#s)" filter="url(#b)"/>', 240, 12);
  const needle = k.svg('<defs><linearGradient id="n" x1="0" x2="1"><stop offset="0" stop-color="#0a1a26" stop-opacity="0"/><stop offset=".5" stop-color="#0d2634"/><stop offset="1" stop-color="#1a4a5e"/></linearGradient></defs><path d="M0,5Q30,2.4 62,4.4L74,5L62,5.6Q30,7.6 0,5Z" fill="url(#n)"/><path d="M30,3.3Q52,3 72,4.7" stroke="#8fe0ea" stroke-width=".5" fill="none" opacity=".8"/>', 74, 10);

  // ── the shaking: the brace (0..1), the lunge of the riposte (0..1), each blow's damped shake
  const brace = (t) => sm(Math.max(0, Math.min(1, (t - 40) / 380))) * (1 - sm(Math.max(0, Math.min(1, (t - (RIP + 700)) / (HOME - RIP - 700)))));
  const lunge = (t) => sm(Math.max(0, Math.min(1, (t - RIP) / 200))) * (1 - sm(Math.max(0, Math.min(1, (t - RIP - 330) / 620))));
  const shake = (tau) => (tau <= 0 ? 0 : (Math.exp(-tau / 170) * Math.sin((2 * Math.PI * tau) / 280)) / 0.66);
  const flash = (tau) => (tau < -20 ? 0 : tau < 0 ? 1 + tau / 20 : Math.exp(-tau / 260));
  const hit = (t) => Math.max(0, ...B.map((b) => flash(t - b.t) * b.s));
  const grid = [];
  for (let t = 0; t <= HOME + 20; t += 40) grid.push(t);
  const fix = (n) => n.toFixed(2);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [HOME + 100, { transform: 'none' }]];
  // her whole pose: the body about her waist (drawing units and degrees)
  const body = (t) => {
    const b = brace(t), L = lunge(t);
    let dx = 4.2 * L, dy = 1.3 * b + Math.sin(t / 330) * 0.5 * Math.min(1, t / 400) * (1 - sm(Math.max(0, Math.min(1, (t - 3000) / 500)))) - 0.6 * L, th = -1.2 * b + 1.5 * L;
    for (const bl of B) {
      const x = shake(t - bl.t - 55) * bl.s, d = unit(bl.g);
      dx -= d[0] * 1.7 * x; dy -= d[1] * 0.9 * x; th -= 2.3 * x * Math.sign(d[0] || 1) * Math.sign(1);
    }
    return { dx, dy, th };
  };
  // where a point P of the picture rides: translate and turn that follow her body about her waist
  const follow = (P, t) => {
    const { dx, dy, th } = body(t), r = (th * Math.PI) / 180, vx = P[0] - WA[0], vy = P[1] - WA[1];
    const nx = WA[0] + vx * Math.cos(r) - vy * Math.sin(r) + dx, ny = WA[1] + vx * Math.sin(r) + vy * Math.cos(r) + dy;
    return { tx: (nx - P[0]) * u, ty: (ny - P[1]) * u, th };
  };
  const tfm = (P, t, extra = 0, tail = '') => { const f = follow(P, t); return `translate(${fix(f.tx)}px, ${fix(f.ty)}px) rotate(${fix(f.th + extra)}deg)${tail}`; };
  // the bubble's own pose: driven in and back off each blow, swelling as she braces
  const skin = (t, extraRot = 0) => {
    let dx = 0, dy = 0, sc = 1 + 0.022 * brace(t) + 0.012 * lunge(t);
    for (const bl of B) { const x = shake(t - bl.t) * bl.s, d = unit(bl.g); dx -= d[0] * 2.3 * x; dy -= d[1] * 2.3 * x; sc -= 0.018 * x; }
    return `translate(${fix(dx * u)}px, ${fix(dy * u)}px) rotate(${fix(extraRot)}deg) scale(${fix(sc)})`;
  };
  const swing = (t) => 5 * Math.sin(t / 620) * brace(t) + B.reduce((a, bl) => a + 9 * shake(t - bl.t) * bl.s, 0);

  // ── the picture: her, her arm and rapier (turning together about the shoulder), wings, bubble
  act(k.part('her'), sample((t) => ({ transform: tfm(WA, t) })));
  const armRot = (t) => -5 * brace(t) + B.reduce((a, bl) => a + 6 * shake(t - bl.t - 30) * bl.s, 0) + 4 * lunge(t);
  const armTf = (t) => ({ transform: tfm(SH, t, armRot(t)) });
  act(k.part('arm'), sample(armTf));
  const blade = k.part('blade');
  act(blade, sample((t) => ({ transform: tfm(SH, t, armRot(t), ` scale(${fix(1 + 0.06 * lunge(t))}, 1)`) })));
  const flutter = (t) => 1 + 0.16 * Math.sin(t / 95) * Math.max(0.55 * brace(t), hit(t), 0.8 * lunge(t));
  act(k.part('wings'), sample((t) => ({ transform: tfm(W, t, 0, ` scale(${fix(1 + 0.05 * brace(t))}, ${fix(flutter(t))})`) })));
  act(k.part('bubble'), sample((t) => ({ transform: skin(t) })));
  act(k.part('sheen'), sample((t) => ({ transform: skin(t, swing(t)) })));
  act(k.part('foot'), sample((t) => ({ transform: skin(t) })));
  act(k.part('fan'), sample((t) => ({ transform: `${tfm(TIP, t)} scale(${fix(1 + 0.18 * hit(t) + 0.5 * lunge(t))}, ${fix(1 + 0.1 * hit(t) + 0.35 * lunge(t))})` })));
  // lit copies: the skin, the fan of rainbow and the rainbow at its foot, hot when struck
  const hotOp = (t) => Math.min(1, 0.55 * hit(t) + 0.12 * brace(t) + 0.2 * lunge(t));
  const sampleHot = (tf, op) => [...grid.map((t) => [t, { transform: tf(t).transform || tf(t), opacity: +op(t).toFixed(2) }, 'linear']), [HOME + 100, { transform: 'none', opacity: 0 }]];
  act(k.copy('bubble', 'f-hot'), sampleHot((t) => skin(t), (t) => 0.9 * hotOp(t)));
  act(k.copy('fan', 'f-hot'), sampleHot((t) => `${tfm(TIP, t)} scale(${fix(1 + 0.18 * hit(t) + 0.5 * lunge(t))}, ${fix(1 + 0.1 * hit(t) + 0.35 * lunge(t))})`, (t) => Math.min(1, 0.9 * hit(t) + 0.9 * lunge(t))));
  act(k.copy('foot', 'f-hot'), sampleHot((t) => skin(t), (t) => Math.min(1, 1.1 * hit(t))));
  act(k.copy('blade', 'f-hot'), sampleHot((t) => tfm(SH, t, armRot(t), ` scale(${fix(1 + 0.06 * lunge(t))}, 1)`), (t) => Math.min(1, 0.25 * brace(t) + 0.6 * hit(t) + 0.8 * lunge(t))));

  // ── the light in the water below, flashing with colour
  const lowOp = (t) => Math.min(0.95, 0.9 * hit(t) + 0.35 * brace(t) + 0.8 * lunge(t));
  fx(k.lightIn('g-prism', [150, 166], 190, 44), [...grid.map((t) => [t, { opacity: +lowOp(t).toFixed(2) }, 'linear']), [HOME + 100, { opacity: 0 }]]);

  // ── the brace: colour streaming in off the skin to the point of the rapier, a star kindling there
  for (let i = 0; i < 9; i++) {
    const t0 = 60 + i * 38, a = rand() * Math.PI * 2, fr = [C[0] + Math.cos(a) * R * 0.95, C[1] + Math.sin(a) * R * 0.95], [fx0, fy0] = k.P(...fr), [tx, ty] = k.P(...TIP);
    const to = (f, o, s) => ({ transform: `translate(${((tx - fx0) * f).toFixed(1)}px, ${((ty - fy0) * f).toFixed(1)}px) scale(${s})`, opacity: o });
    fx(k.pic(`fleck${i % 6}`, fr, 9, 9), [[t0, to(0, 0, 0.4), 'ease-in'], [t0 + 80, to(0.15, 0.95, 0.9)], [t0 + 330, to(1, 0.95, 0.7), 'ease-in'], [t0 + 400, to(1, 0, 0.3)]]);
  }
  fx(k.pic('star', TIP, 26, 26), [[250, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [430, { transform: 'scale(1.1) rotate(30deg)', opacity: 1 }], [620, { transform: 'scale(.8) rotate(60deg)', opacity: 0.7 }, eio], [900, { transform: 'scale(.3) rotate(90deg)', opacity: 0 }]]);

  // ── each blow
  const nx = (a) => [Math.cos(a), Math.sin(a)];
  B.forEach((bl, bi) => {
    const t = bl.t, s = bl.s, g = bl.g, d = unit(g), ang = deg(Math.atan2(d[1], d[0]));
    // the needle out of the air (alone only): it comes in from outside along the skin's normal
    if (alone) {
      const far = (f) => ({ transform: `translate(${fix(d[0] * f * u)}px, ${fix(d[1] * f * u)}px) rotate(${fix(ang + 180)}deg)` });
      fx(k.pic(needle, g, 38, 5.2), [[t - 280, { ...far(120), opacity: 0 }, 'linear'], [t - 240, { ...far(104), opacity: 1 }, 'linear'], [t - 6, { ...far(18), opacity: 1 }, 'linear'], [t + 26, { transform: `translate(${fix(d[0] * 12 * u)}px, ${fix(d[1] * 12 * u)}px) rotate(${fix(ang + 180)}deg) scale(.4, 1.6)`, opacity: 0 }]]);
    }
    // the flash, the star
    fx(k.light('g-prism', g, 46 * s), [[t - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(1.1)', opacity: 0.7 }], [t + 220, { transform: 'scale(1)', opacity: 0.4 }, eio], [t + 650, { transform: 'scale(1.3)', opacity: 0 }]]);
    fx(k.pic('star', g, 28 * s, 28 * s), [[t - 20, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(1.15) rotate(20deg)', opacity: 1 }], [t + 360, { transform: 'scale(.6) rotate(55deg)', opacity: 0 }]]);
    // the ring of every colour out of the point, and the shiver across the skin
    fx(k.pic(ringRB, g, 44 * s, 44 * s), [[t, { transform: 'scale(.25)', opacity: 0 }, 'ease-out'], [t + 50, { transform: 'scale(.55)', opacity: 0.95 }], [t + 560, { transform: 'scale(1.5)', opacity: 0 }]]);
    fx(k.pic(ringW, C, R * 2 + 8, R * 2 + 8), [[t, { transform: 'scale(.92)', opacity: 0 }, 'ease-out'], [t + 70, { transform: 'scale(1)', opacity: 0.8 }], [t + 520, { transform: 'scale(1.12)', opacity: 0 }]]);
    // the blow's strength split into a fan of rainbow, thrown back out along the normal
    fx(k.pic(fan, g, 120 * s, 30 * s, { lit: true }), [[t, { transform: `rotate(${fix(ang)}deg) scale(.2, .5)`, opacity: 0 }, 'ease-out'], [t + 90, { transform: `rotate(${fix(ang)}deg) scale(.75, .9)`, opacity: 0.9 }], [t + 330, { transform: `rotate(${fix(ang)}deg) scale(1, 1)`, opacity: 0.6 }, eio], [t + 760, { transform: `rotate(${fix(ang + 6)}deg) scale(1.15, 1.1)`, opacity: 0 }]]);
    // coloured sparks flung out
    for (let i = 0; i < 9; i++) {
      const a = Math.atan2(d[1], d[0]) + (rand() - 0.5) * 2.1, dist = 14 + rand() * 30, v = nx(a), r = 0.9 + rand() * 0.7, t0 = t + rand() * 40;
      const at = (f, o, sc) => ({ transform: `translate(${fix(v[0] * dist * f * u)}px, ${fix((v[1] * dist * f + 7 * f * f) * u)}px) scale(${sc})`, opacity: o });
      fx(k.pic(i % 3 ? `fleck${(i + bi) % 6}` : 'spark', g, 8 * r, 8 * r), [[t0, at(0, 0, 0.5), 'ease-out'], [t0 + 50, at(0.3, 1, 1)], [t0 + 440, at(1, 0, 0.4)]]);
    }
  });

  // ── the riposte: she lunges, the rapier flares, and a beam leaves its point along its line
  const ba = bladeAng * Math.PI / 180, bd = [Math.cos(ba), Math.sin(ba)];
  const beamLen = 1; // (it is drawn at full length at its peak)
  fx(k.pic(beam, TIP, 240 * 0.42, 12 * 0.42), [[RIP, { transform: `rotate(${fix(bladeAng)}deg) scale(.1, .6)`, opacity: 0 }, 'ease-out'], [RIP + 120, { transform: `rotate(${fix(bladeAng)}deg) scale(${beamLen}, 1.2)`, opacity: 1 }], [RIP + 360, { transform: `rotate(${fix(bladeAng)}deg) scale(${beamLen}, .8)`, opacity: 0.75 }, eio], [RIP + 700, { transform: `rotate(${fix(bladeAng)}deg) scale(${beamLen * 1.08}, .2)`, opacity: 0 }]]);
  fx(k.pic('star', TIP, 38, 38), [[RIP - 30, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [RIP + 100, { transform: 'scale(1.3) rotate(25deg)', opacity: 1 }], [RIP + 450, { transform: 'scale(.7) rotate(70deg)', opacity: 0.5 }, eio], [RIP + 800, { transform: 'scale(.2) rotate(110deg)', opacity: 0 }]]);
  fx(k.light('g-prism', TIP, 56), [[RIP - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [RIP + 110, { transform: 'scale(1.2)', opacity: 0.95 }], [RIP + 500, { transform: 'scale(1)', opacity: 0.5 }, eio], [RIP + 950, { transform: 'scale(1.4)', opacity: 0 }]]);
  for (let i = 0; i < 10; i++) {
    const a = ba + (rand() - 0.5) * 1.2, dist = 16 + rand() * 36, v = nx(a), t0 = RIP + 60 + rand() * 160, r = 0.9 + rand() * 0.7;
    const at = (f, o, sc) => ({ transform: `translate(${fix(v[0] * dist * f * u)}px, ${fix((v[1] * dist * f + 4 * f * f) * u)}px) scale(${sc})`, opacity: o });
    fx(k.pic(`fleck${i % 6}`, TIP, 8 * r, 8 * r), [[t0, at(0, 0, 0.5), 'ease-out'], [t0 + 60, at(0.25, 1, 1)], [t0 + 520, at(1, 0, 0.4)]]);
  }
  void bd;
}
