// Mirror Shield: the polished gold takes the charge, throws the light back, and the attacker with it.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: defender (suggestion changed from
// attacker: it is a shield, it never strikes first: it answers a charge), element: light (kept).
// Alone, the "blows" are the brute's own claws, three strikes at the face.
//   0-600     the brace (BEATS.release): the brute draws back, hunched; the shield sets itself, the
//             contact burst sinks, and a gold rim and a slow glint creep over the polished face.
//   1200, 1700, 2200 (alone; else k.blows)  a blow lands on the nearest `guard` point (BEATS.impact:
//             the first): the brute lunges in, the shield rocks back and is lit white (a hot copy
//             of it, and its gold rim), the burst flares at the meeting point, a ring and a star
//             of light, rays all round, and light thrown back off the face in a fan of beams to
//             the left; sparks.
//   2200-2800 the answer: after the last blow the whole face flares, a great beam leaves it and
//             strikes the brute, who is hurled back along the ground, scorched with light.
//   2800-3800 the light dies down; the brute staggers upright and walks back to where it stood;
//             the shield stills; the burst comes up again.
//   3800      at rest as drawn (BEATS.settle); the move ends at END.
// Contract: each blow is read at its time `at` and snapped to the nearest `guard` point; every
// effect at a blow is built from that point (overlay, since the blow may come from another card).
export const END = 4600;
export const BEATS = { release: 600, impact: 1200, settle: 3800 };
export const STILLS = [450, 1150, 1260, 1450, 2250, 2500, 3100, 4100];

export const textures = {
  star: [48, 48, (x, y) => { const dx = Math.abs(x - 0.5) * 2, dy = Math.abs(y - 0.5) * 2, c = Math.max(0, 1 - Math.hypot(dx, dy)), cr = Math.max(0, 1 - Math.min(dx * 9 + dy, dy * 9 + dx)), v = Math.min(1, c * c * 1.6 + cr * 0.9); return [255, 244 + 11 * v, 200 + 55 * v, v]; }],
  spark: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 232 + 23 * c * c, 160 + 90 * c * c, Math.min(1, c * c * 2)]; }],
  dust: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, n = 0.75 + 0.25 * Math.sin(x * 17 + y * 11) * Math.cos(y * 13 - x * 7); return [226, 196, 150, Math.max(0, 1 - r) * 0.8 * n]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, G = S.guard, PT = S.point;
  const near = (to) => G.reduce((b, g) => (Math.hypot(g[0] - to[0], g[1] - to[1]) < Math.hypot(b[0] - to[0], b[1] - to[1]) ? g : b), G[0]);
  const own = [{ at: 1200, to: G[0] }, { at: 1700, to: G[1] }, { at: 2200, to: G[2] }];
  const B = (k.blows || own).slice().sort((a, b) => a.at - b.at).map((b) => ({ t: Math.max(800, Math.min(2300, b.at)), g: near(b.to) }));
  const last = B.at(-1).t, FLARE = last + 80, HOME = 3800, SEATED = last + 650;
  const MID = [190, 100], BRUTE = [58, 112];

  k.css(`.g-gold { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,250,232,.95), rgba(255,216,140,.55) 26%, rgba(255,176,80,.16) 58%, rgba(255,150,40,0) 100%); }
    .fx-copy.f-hot { mix-blend-mode: plus-lighter; filter: brightness(1.5) saturate(1.2); }
    .fx-copy.f-rim { filter: brightness(1.5) saturate(1.6) drop-shadow(0 0 2px rgba(255,226,150,.95)) drop-shadow(0 0 6px rgba(255,190,80,.8)); }`);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1"/></filter></defs><circle cx="30" cy="30" r="25" fill="none" stroke="#fff0c2" stroke-width="2.6" filter="url(#b)"/>', 60, 60);
  // a beam of light: hot at its right end, fading to the left (it is rotated to point where it goes)
  const beam = k.svg('<defs><linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#ffcf7a" stop-opacity="0"/><stop offset=".6" stop-color="#ffe9b0" stop-opacity=".9"/><stop offset="1" stop-color="#ffffff"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation=".7"/></filter></defs><path d="M0,8 Q30,2 70,6 L100,8 L70,10 Q30,14 0,8Z" fill="url(#s)" filter="url(#b)"/>', 100, 16);
  // rays all round a point
  let rr = '';
  for (let i = 0; i < 14; i++) { const a = (i * 25.7 + (i % 2) * 7) * Math.PI / 180, r1 = 8, r2 = i % 2 ? 22 : 38; rr += `M${(40 + Math.cos(a) * r1).toFixed(1)},${(40 + Math.sin(a) * r1).toFixed(1)}L${(40 + Math.cos(a) * r2).toFixed(1)},${(40 + Math.sin(a) * r2).toFixed(1)}`; }
  const rays = k.svg(`<defs><filter id="b"><feGaussianBlur stdDeviation=".6"/></filter></defs><path d="${rr}" stroke="#fff6dc" stroke-width="1.5" stroke-linecap="round" filter="url(#b)"/>`, 80, 80);

  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  const grid = [];
  for (let t = 0; t <= HOME + 20; t += 40) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [HOME + 100, { transform: 'none' }]];
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const jolt = (tau) => (tau < 0 ? 0 : (Math.exp(-tau / 200) * Math.sin((2 * Math.PI * tau) / 300)));
  const flash = (tau) => (tau < -30 ? 0 : tau < 0 ? 1 + tau / 30 : Math.exp(-tau / 230));
  const hot = (t) => Math.min(1, Math.max(0, ...B.map((b) => flash(t - b.t))), flash(t - FLARE) * 1.2);
  const calm = (t) => 1 - sm(clamp01((t - SEATED) / (HOME - SEATED)));
  const brace = curve([[0, 0], [550, 1], [HOME - 400, 1], [HOME, 0]]);

  // ── the shield: sets itself, rocks back at each blow (and hardest at the answer), stills
  act(k.part('shield'), sample((t) => {
    let j = 0;
    for (const b of B) j += jolt(t - b.t);
    j += 1.5 * jolt(t - FLARE);
    j *= calm(t);
    return { transform: `${k.T(0.8 * brace(t) + 0.9 * j, 0)} rotate(${(-1.2 * brace(t) + 2.6 * j).toFixed(2)}deg)` };
  }));
  // a gold rim behind it, and a hot copy over it, lit at each blow and at the answer
  const shieldPose = (t) => { let j = 0; for (const b of B) j += jolt(t - b.t); j += 1.5 * jolt(t - FLARE); j *= calm(t); return `${k.T(0.8 * brace(t) + 0.9 * j, 0)} rotate(${(-1.2 * brace(t) + 2.6 * j).toFixed(2)}deg)`; };
  const gl = curve([[0, 0], [550, 0.55], [FLARE - 40, 0.55], [FLARE + 150, 1], [SEATED + 400, 0.45], [HOME, 0]]);
  act(k.copy('shield', 'f-rim', { behind: true }), sample((t) => ({ transform: `${shieldPose(t)} scale(1.07)`, opacity: +Math.min(1, gl(t) * 0.8 + hot(t) * 0.3).toFixed(3) })));
  act(k.copy('shield', 'f-hot'), sample((t) => ({ transform: shieldPose(t), opacity: +(0.18 * gl(t) + 0.75 * hot(t)).toFixed(3) })));

  // ── the burst where the claws meet: sinks as the brute draws back, flares at each lunge, goes out at the answer
  const BU = curve([[0, 1], [350, 0.25], [B[0].t - 120, 0.3], [B[0].t, 1.5], ...B.slice(1).flatMap((b) => [[b.t - 200, 0.35], [b.t, 1.5]]), [FLARE + 150, 0.1], [SEATED + 500, 0.2], [HOME, 1]].filter((p, i, a) => i === 0 || p[0] > a[i - 1][0]));
  act(k.part('burst'), sample((t) => ({ transform: `scale(${(0.4 + 0.6 * BU(t)).toFixed(3)})`, opacity: +Math.min(1, BU(t)).toFixed(3) })));

  // ── the brute: draws back, lunges at each blow and is thrown off, flung back along the ground, walks home
  const bx = curve([[0, 0], [550, -7], [FLARE - 20, -7], [SEATED, -38], [SEATED + 650, -38], [HOME, 0]]);
  const br = curve([[0, 0], [550, -4], [FLARE - 20, -4], [SEATED, -15], [SEATED + 650, -12], [HOME - 300, -2], [HOME, 0]]);
  const by = curve([[0, 0], [FLARE + 20, 0], [FLARE + 280, -11], [SEATED, 0], [HOME, 0]]);
  const bump = (t) => {
    let v = 0;
    for (const b of B) { const tau = t - b.t; v = Math.max(v, tau < -220 ? 0 : tau < 0 ? sm((tau + 220) / 220) : tau < 320 ? 1 - sm(tau / 320) : 0); }
    return v;
  };
  const sway = (t) => (t > SEATED + 650 && t < HOME ? Math.sin((t - SEATED - 650) / 120) * 1.2 * (1 - sm((t - SEATED - 650) / (HOME - SEATED - 650))) : 0);
  act(k.part('brute'), sample((t) => ({ transform: `${k.T(bx(t) + 11 * bump(t) * (t < FLARE ? 1 : 0), by(t))} rotate(${(br(t) + 6 * bump(t) * (t < FLARE ? 1 : 0) + sway(t)).toFixed(2)}deg)` })));
  // where the brute's chest is as it goes (for the lights that follow it)
  const bpos = (t) => [BRUTE[0] + bx(t), BRUTE[1] + by(t)];

  // ── the brace: the face begins to glint, a soft light gathers on the shield
  const SL = curve([[0, 0], [550, 0.6], [FLARE, 0.7], [FLARE + 200, 1], [SEATED + 400, 0.5], [HOME, 0]]);
  fx(k.lightIn('g-gold', [196, 110], 150, 170), [...grid.filter((t) => t >= 40).map((t) => [t, { transform: `scale(${(0.85 + 0.2 * SL(t)).toFixed(3)})`, opacity: +(SL(t) * 0.85).toFixed(3) }, 'linear']), [HOME + 100, { transform: 'scale(.85)', opacity: 0 }]]);
  for (let i = 0; i < 6; i++) {
    const t0 = 150 + i * 130, x = 168 + rand() * 50, y = 74 + rand() * 80;
    fx(k.picIn('star', [x, y], 7, 7), [[t0, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [t0 + 150, { transform: 'scale(1) rotate(20deg)', opacity: 1 }, eio], [t0 + 500, { transform: 'scale(.2) rotate(45deg)', opacity: 0 }]]);
  }

  // ── each blow: a flash and a star at the meeting point, a ring, rays, a fan of beams back, sparks
  B.forEach((b, bi) => {
    const [gx, gy] = b.g, t = b.t;
    fx(k.light('g-gold', b.g, 64), [[t - 50, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [t + 300, { transform: 'scale(.9)', opacity: 0.5 }, eio], [t + 800, { transform: 'scale(1.1)', opacity: 0 }]]);
    fx(k.pic('star', b.g, 30, 30), [[t - 20, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(1.1) rotate(15deg)', opacity: 1 }, 'ease-out'], [t + 460, { transform: 'scale(.3) rotate(50deg)', opacity: 0 }]]);
    fx(k.pic(rays, b.g, 60, 60, { low: true }), [[t - 10, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [t + 50, { transform: 'scale(.9) rotate(8deg)', opacity: 0.95 }, 'ease-out'], [t + 520, { transform: 'scale(1.5) rotate(20deg)', opacity: 0 }]]);
    [[0, 3.2, 0.9], [130, 4.6, 0.5]].forEach(([d, big, o]) => fx(k.pic(ring, b.g, 30, 30, { low: true }), [[t + d, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + d + 40, { transform: 'scale(.6)', opacity: o }, 'ease-out'], [t + d + 650, { transform: `scale(${big})`, opacity: 0 }]]));
    // light thrown back off the face, a fan to the left
    for (let i = 0; i < 4; i++) {
      const ang = 180 + (i - 1.5) * 15 + (rand() - 0.5) * 8 + (bi % 2 ? 6 : -6), len = 62 + rand() * 22, a = (ang * Math.PI) / 180, t0 = t + i * 25, cx = gx + Math.cos(a) * len / 2, cy = gy + Math.sin(a) * len / 2;
      fx(k.pic(beam, [cx, cy], len, 7, { low: true }), [[t0, { transform: `rotate(${ang}deg) scale(.1, .5)`, opacity: 0 }, 'ease-out'], [t0 + 60, { transform: `rotate(${ang}deg) scale(1, 1)`, opacity: 0.95 }, 'ease-out'], [t0 + 380, { transform: `rotate(${ang}deg) scale(1, .3)`, opacity: 0 }]]);
    }
    for (let i = 0; i < 12; i++) {
      const a = rand() * Math.PI * 2, d = 10 + rand() * 26, t0 = t + Math.round(rand() * 120), sz = 2.4 + rand() * 2.8;
      fx(k.pic('spark', b.g, sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 90, { transform: `${k.T(Math.cos(a) * d * 0.4, Math.sin(a) * d * 0.4)} scale(1)`, opacity: 1 }, 'ease-out'], [t0 + 700 + Math.round(rand() * 400), { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d * 0.7 + 12 + rand() * 8)} scale(.3)`, opacity: 0 }]]);
    }
    // the brute's feet scuff the ground at its lunge
    for (let i = 0; i < 2; i++) {
      const r = Math.round(rand() * 360), t0 = t - 160 + i * 70;
      fx(k.picIn('dust', [bpos(t)[0] + 14 + i * 10, 169], 20, 20, { lit: false, low: true }), [[t0, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 250, { transform: `${k.T(-5, -5)} rotate(${r + 20}deg) scale(1)`, opacity: 0.45 }], [t0 + 1000, { transform: `${k.T(-10, -16)} rotate(${r + 50}deg) scale(1.8)`, opacity: 0 }]]);
    }
  });

  // ── the answer: the whole face flares and a great beam leaves it, to the brute, who is hurled back
  const BT = bpos(SEATED), blen = Math.hypot(MID[0] - 76, MID[1] - 110), bang = (Math.atan2(110 - MID[1], 76 - MID[0]) * 180) / Math.PI, bmid = [(MID[0] + 76) / 2, (MID[1] + 110) / 2];
  fx(k.light('g-gold', MID, 120), [[FLARE - 60, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [FLARE + 60, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [FLARE + 500, { transform: 'scale(1)', opacity: 0.45 }, eio], [SEATED + 500, { transform: 'scale(.7)', opacity: 0 }]]);
  fx(k.pic(rays, MID, 120, 120, { low: true }), [[FLARE, { transform: 'scale(.4) rotate(0deg)', opacity: 0 }, 'ease-out'], [FLARE + 80, { transform: 'scale(1) rotate(10deg)', opacity: 0.95 }, 'ease-out'], [FLARE + 600, { transform: 'scale(1.7) rotate(26deg)', opacity: 0 }]]);
  fx(k.pic('star', MID, 56, 56), [[FLARE, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [FLARE + 70, { transform: 'scale(1.1) rotate(15deg)', opacity: 1 }, 'ease-out'], [FLARE + 600, { transform: 'scale(.3) rotate(60deg)', opacity: 0 }]]);
  fx(k.pic(ring, MID, 50, 50, { low: true }), [[FLARE, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [FLARE + 50, { transform: 'scale(.8)', opacity: 0.9 }, 'ease-out'], [FLARE + 750, { transform: 'scale(4)', opacity: 0 }]]);
  for (const [w, o, d] of [[16, 1, 0], [30, 0.55, 20]]) fx(k.pic(beam, bmid, blen, w, { low: true }), [[FLARE + d, { transform: `rotate(${bang.toFixed(1)}deg) scale(.1, .3)`, opacity: 0 }, 'ease-out'], [FLARE + d + 70, { transform: `rotate(${bang.toFixed(1)}deg) scale(1, 1)`, opacity: o }, 'ease-out'], [FLARE + d + 160, { transform: `rotate(${bang.toFixed(1)}deg) scale(1, .85)`, opacity: o * 0.9 }, eio], [FLARE + d + 330, { transform: `rotate(${bang.toFixed(1)}deg) scale(1, .2)`, opacity: 0 }]]);
  // where it strikes the brute: a flash that goes with it as it is flung, sparks and dust
  const hitL = [[FLARE + 80, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [FLARE + 140, { transform: `${k.T(0, 0)} scale(1.3)`, opacity: 1 }, 'ease-out']];
  for (let t = FLARE + 240; t <= SEATED; t += 90) { const p = bpos(t); hitL.push([t, { transform: `${k.T(p[0] - 76, p[1] - 110)} scale(${(1 - 0.3 * clamp01((t - FLARE - 140) / 400)).toFixed(2)})`, opacity: +(0.9 - 0.4 * clamp01((t - FLARE - 140) / 400)).toFixed(2) }, 'linear']); }
  hitL.push([SEATED + 300, { transform: `${k.T(BT[0] - 76, BT[1] - 110)} scale(.5)`, opacity: 0 }]);
  fx(k.light('g-gold', [76, 110], 80), hitL);
  for (let i = 0; i < 14; i++) {
    const a = rand() * Math.PI * 2, d = 10 + rand() * 24, t0 = FLARE + 110 + Math.round(rand() * 140), sz = 2.6 + rand() * 3;
    fx(k.pic('spark', [76, 110], sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 100, { transform: `${k.T(Math.cos(a) * d * 0.5, Math.sin(a) * d * 0.5)} scale(1)`, opacity: 1 }, 'ease-out'], [t0 + 800 + Math.round(rand() * 400), { transform: `${k.T(Math.cos(a) * d - 10, Math.sin(a) * d * 0.7 + 14 + rand() * 10)} scale(.3)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 7; i++) {
    const r = Math.round(rand() * 360), t0 = FLARE + 200 + i * 90, x = 40 + rand() * 34 + (i % 2 ? -14 : 0);
    fx(k.picIn('dust', [x, 168], 26, 26, { lit: false, low: true }), [[t0, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 320, { transform: `${k.T((rand() - 0.5) * 8, -8)} rotate(${r + 20}deg) scale(1)`, opacity: 0.55 }], [t0 + 1300, { transform: `${k.T((rand() - 0.5) * 18, -30)} rotate(${r + 50}deg) scale(2.1)`, opacity: 0 }]]);
  }
  // motes of light drift off the shield as it settles
  for (let i = 0; i < 12; i++) {
    const t0 = SEATED + Math.round(rand() * 800), x = 160 + rand() * 70, y = 70 + rand() * 90, sz = 2.2 + rand() * 2.4;
    fx(k.picIn('spark', [x, y], sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 200, { transform: `${k.T(0, -4)} scale(1)`, opacity: 0.9 }, 'ease-out'], [t0 + 1000, { transform: `${k.T((rand() - 0.5) * 10, -22 - rand() * 14)} scale(.3)`, opacity: 0 }]]);
  }
}
