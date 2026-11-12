// Ward of Dawn: the claw comes down, the dome of dawn light snaps shut under it, and the blows break on the glass.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: defender (a protective Trick), element: light
// (both as suggested). Alone, the blows are the claw's own: it rears back, then slams the glass
// three times at its talons' tips (`guard`, the four on the right); aimed (k.blows), the claw draws
// back into the storm and stays there, and the blows are only what lands on the glass.
//   0-450     the claw draws back (rears up and away), its tip-glows and sparks die; the dome thins
//             and flickers, the soldier ducks under it.
//   450-600   the dome SNAPS shut (BEATS.release at 600): it gathers in, slams to a hair too tight,
//             a flash, a ring of light across the turf, the soldier lifts his head.
//   1100, 1700, 2300 (alone; else k.blows)  a blow lands on the nearest `guard` point (BEATS.impact:
//             the first): the claw slams down (alone), the dome takes it (driven in, rebounds, hot
//             white), a star and a ring at the point, a hairline crack that heals, shards of glass
//             and sparks flung out along the glass's normal, the turf rings pulse, the soldier
//             flinches. Each blow a little stronger.
//   after the last: a burst of rays; the claw is hurled back into the storm (alone) and the soldier
//             straightens under the unbroken dome.
//   2900-3600 the light dies down; the claw comes back down to rest on the glass, its glints kindling;
//             the soldier settles.
//   3600      at rest as drawn (BEATS.settle); the move ends at END.
// Contract: blows are k.blows || the claw's three, each at its time `at` on the nearest `guard`; every
// effect at a blow is built from that point on the overlay (a blow may come from another card).
export const END = 4200;
export const BEATS = { release: 600, impact: 1100, settle: 3600 };
export const STILLS = [300, 580, 700, 1090, 1180, 1750, 2500, 3900];

export const textures = {
  star: [48, 48, (x, y) => { const dx = Math.abs(x - 0.5) * 2, dy = Math.abs(y - 0.5) * 2, c = Math.max(0, 1 - Math.hypot(dx, dy)), cr = Math.max(0, 1 - Math.min(dx * 9 + dy, dy * 9 + dx)), v = Math.min(1, c * c * 1.6 + cr * 0.9); return [255, 246 + 9 * v, 214 + 41 * v, v]; }],
  spark: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 236 + 19 * c * c, 170 + 85 * c * c, Math.min(1, c * c * 2.2)]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, G = S.guard, TP = S.tips, [DX, DY, DRX, DRY] = S.dome, soldierFeet = S.feet;
  const alone = !k.blows, HOME = 3600;
  const near = (to) => G.reduce((b, g) => (Math.hypot(g[0] - to[0], g[1] - to[1]) < Math.hypot(b[0] - to[0], b[1] - to[1]) ? g : b), G[0]);
  const own = [{ at: 1100, to: G[1] }, { at: 1700, to: G[3] }, { at: 2300, to: G[0] }];
  const B = (k.blows || own).slice().sort((a, b) => a.at - b.at).map((b, i) => ({ t: Math.max(800, Math.min(2500, b.at)), g: near(b.to), s: 1 + 0.15 * i }));
  const last = B.at(-1).t;
  const norm = (g) => { const n = [(g[0] - DX) / (DRX * DRX), (g[1] - DY) / (DRY * DRY)], l = Math.hypot(...n) || 1; return [n[0] / l, n[1] / l]; };
  const tipMid = [TP.reduce((a, p) => a + p[0], 0) / TP.length, TP.reduce((a, p) => a + p[1], 0) / TP.length];
  const fix = (n) => n.toFixed(2);
  const deg = (a) => (a * 180) / Math.PI;

  k.css(`.g-dawn { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,252,236,.95), rgba(255,230,160,.55) 28%, rgba(255,200,110,.16) 58%, rgba(255,180,80,0) 100%); }
    .fx-copy.f-hot { mix-blend-mode: plus-lighter; filter: brightness(1.7) saturate(1.2); }`);
  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  const shake = (tau) => (tau <= 0 ? 0 : (Math.exp(-tau / 160) * Math.sin((2 * Math.PI * tau) / 260)) / 0.66);
  const flash = (tau) => (tau < -15 ? 0 : tau < 0 ? 1 + tau / 15 : Math.exp(-tau / 230));
  const hit = (t) => Math.max(0, ...B.map((b) => flash(t - b.t) * b.s));
  const grid = (step) => { const a = []; for (let t = 0; t <= HOME + 20; t += step) a.push(t); return a; };
  const G40 = grid(40), G20 = grid(20);
  const sample = (g, fn, rest = { transform: 'none' }) => [...g.map((t) => [t, fn(t), 'linear']), [HOME + 100, rest]];

  // ── the claw: its pose (drawing units and degrees, about its joint in the storm) at ms t
  const RAISE = [9, -23, 8], GONE = [30, -64, 15];
  const pt = (arr, f = 1) => arr.map((v) => v * f);
  const slam = (i) => { const g = B[i].g; return [Math.max(-8, Math.min(8, (g[0] - tipMid[0]) * 0.5)), Math.max(-8, Math.min(8, (g[1] - tipMid[1]) * 0.5)), -1.6]; };
  const claw = (() => {
    const key = [];
    if (alone) {
      key.push([0, [0, 0, 0]], [300, pt(RAISE, 1.1)], [B[0].t - 260, pt(RAISE, 1.0)]);
      B.forEach((b, i) => {
        key.push([b.t - 130, pt(RAISE, 1.15)], [b.t, slam(i)], [b.t + 70, [slam(i)[0], slam(i)[1] + 0.8, -2.2]], [b.t + 300, pt(RAISE, 0.8)]);
        if (B[i + 1]) key.push([B[i + 1].t - 300, pt(RAISE, 0.95)]);
      });
      key.push([last + 520, pt(GONE, 0.6)], [last + 1000, GONE]);
    } else key.push([0, [0, 0, 0]], [450, GONE], [last + 1000, GONE]);
    key.push([3150, GONE], [3520, [0, 0.7, -1.2]], [HOME, [0, 0, 0]]);
    const ks = key.filter((e, i) => i === 0 || e[0] > key[i - 1][0]);
    return (t) => {
      if (t <= ks[0][0]) return ks[0][1];
      for (let i = 1; i < ks.length; i++) if (t <= ks[i][0]) {
        const f = (t - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0]), e = ks[i][1][2] < ks[i - 1][1][2] - 0.5 || ks[i][0] - ks[i - 1][0] < 200 ? f * f * (2 - f) : sm(f); // (a fall is quick and hard)
        return ks[i - 1][1].map((v, j) => v + (ks[i][1][j] - v) * e);
      }
      return ks.at(-1)[1];
    };
  })();
  const clawTf = (t) => { const [dx, dy, th] = claw(t); return `translate(${fix(dx * u)}px, ${fix(dy * u)}px) rotate(${fix(th)}deg)`; };
  act(k.part('claw'), sample(G20, (t) => ({ transform: clawTf(t) })));
  // its glow and the sparks at its tips: alight only where it touches, kindled again at the end
  const restW = curve([[0, 1], [240, 0], [3250, 0], [3600, 1]]);
  const touch = (t) => (alone ? Math.max(0, ...B.map((b) => (t < b.t - 25 ? 0 : t < b.t ? (t - b.t + 25) / 25 : Math.exp(-(t - b.t) / 190)))) : 0);
  const lit = (t) => +Math.max(restW(t), touch(t)).toFixed(2);
  act(k.part('tipglow'), [...G20.map((t) => [t, { transform: clawTf(t), opacity: lit(t) }, 'linear']), [HOME + 100, { transform: 'none', opacity: 1 }]]);
  act(k.part('sparks'), [...G20.map((t) => [t, { transform: clawTf(t), opacity: +Math.min(1, lit(t) * (t > 3200 || t < 100 ? 1 : 1.2)).toFixed(2) }, 'linear']), [HOME + 100, { transform: 'none', opacity: 1 }]]);

  // ── the dome: thins as she draws back, SNAPS shut at 600, then takes each blow
  const SNAP = 600;
  const base = curve([[0, 0], [180, 1], [430, 1], [SNAP - 70, 0.6], [SNAP, -1], [SNAP + 110, 0.5], [SNAP + 260, 0]]);
  const body = (t) => {
    const b = base(t); // 1 thin, -1 snapped tight
    let sx = 1 + 0.05 * Math.max(0, b) - 0.04 * Math.max(0, -b), sy = 1 + 0.06 * Math.max(0, b) - 0.07 * Math.max(0, -b) - 0.02 * Math.min(0, Math.max(-1, b)) * 0;
    let dx = 0;
    for (const bl of B) { const x = shake(t - bl.t) * bl.s, n = norm(bl.g); sy -= 0.03 * x * Math.abs(n[1]) + 0.012 * x; sx -= 0.03 * x * Math.abs(n[0]); dx -= n[0] * 1.2 * x; }
    return { sx, sy, dx, o: 1 - 0.55 * Math.max(0, b) };
  };
  const domeTf = (t) => { const d = body(t); return { transform: `translate(${fix(d.dx * u)}px, 0px) scale(${fix(d.sx)}, ${fix(d.sy)})`, opacity: +d.o.toFixed(2) }; };
  act(k.part('dome'), sample(G40, domeTf, { transform: 'none', opacity: 1 }));
  act(k.part('domefill'), sample(G40, domeTf, { transform: 'none', opacity: 1 }));
  const hotOp = (t) => Math.min(1, 0.85 * hit(t) + 1.1 * flash(t - SNAP - 60) * (t > SNAP - 20 ? 1 : 0));
  act(k.copy('dome', 'f-hot'), [...G40.map((t) => { const d = domeTf(t); return [t, { transform: d.transform, opacity: +(0.9 * hotOp(t)).toFixed(2) }, 'linear']; }), [HOME + 100, { transform: 'none', opacity: 0 }]]);
  // the rings of light on the ground at its foot
  act(k.part('rings'), sample(G40, (t) => { const f = Math.max(hit(t) * 0.6, flash(t - SNAP - 40)); return { transform: `scale(${fix(1 + 0.08 * f)}, ${fix(1 + 0.2 * f)})`, opacity: 1 }; }, { transform: 'none', opacity: 1 }));
  // the soldier: ducks as the claw rears, lifts his head at the snap, flinches at each blow, rises at the end
  const duck = curve([[0, 0], [260, 1], [SNAP - 60, 1], [SNAP + 120, -0.8], [SNAP + 420, -0.2], [last + 500, -0.3], [last + 1000, -1], [3500, 0]]);
  act(k.part('soldier'), sample(G40, (t) => {
    const d = duck(t); let dy = 1.1 * Math.max(0, d), sy = 1 - 0.035 * Math.max(0, d) + 0.025 * Math.max(0, -d), sx = 1 + 0.02 * Math.max(0, d) - 0.01 * Math.max(0, -d);
    for (const bl of B) { const x = shake(t - bl.t - 40) * bl.s; dy += 0.8 * Math.abs(x); sy -= 0.02 * Math.abs(x); }
    return { transform: `translate(0px, ${fix(dy * u)}px) scale(${fix(sx)}, ${fix(sy)})` };
  }));

  // ── the light on the soldier from under the dome
  fx(k.lightIn('g-dawn', [DX, DY - 40], 150, 170), [...G40.map((t) => [t, { opacity: +Math.min(0.9, 0.7 * hit(t) + 0.85 * flash(t - SNAP - 80) * (t > SNAP ? 1 : 0)).toFixed(2) }, 'linear']), [HOME + 100, { opacity: 0 }]]);

  // ── the snap: a flash at the dome's crown, a ring across the turf
  const ringT = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".8"/></filter></defs><ellipse cx="80" cy="12" rx="74" ry="8" fill="none" stroke="#fff0c2" stroke-width="1.7" filter="url(#b)"/><ellipse cx="80" cy="12" rx="62" ry="6" fill="none" stroke="#ffe2a0" stroke-width=".9" opacity=".6"/>', 160, 24);
  fx(k.picIn(ringT, [DX, DY + 1], 150, 22), [[SNAP - 30, { transform: 'scale(.4, .5)', opacity: 0 }, 'ease-out'], [SNAP + 60, { transform: 'scale(.8, .85)', opacity: 0.95 }], [SNAP + 800, { transform: 'scale(1.9, 1.7)', opacity: 0 }]]);
  fx(k.light('g-dawn', [DX, DY - 78], 80), [[SNAP - 50, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [SNAP + 40, { transform: 'scale(1.2)', opacity: 0.95 }], [SNAP + 420, { transform: 'scale(1)', opacity: 0.35 }, eio], [SNAP + 900, { transform: 'scale(1.3)', opacity: 0 }]]);
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI * (0.1 + 0.8 * (i / 11)), at0 = [DX + Math.cos(a) * DRX, DY + Math.sin(a) * DRY], t0 = SNAP + rand() * 50, r = 5 + rand() * 3;
    const n = [Math.cos(a), Math.sin(a)], at = (f, o, sc) => ({ transform: `translate(${fix(n[0] * 14 * f * u)}px, ${fix((n[1] * 14 * f + 5 * f * f) * u)}px) scale(${sc})`, opacity: o });
    fx(k.pic(i % 3 ? 'spark' : 'star', at0, r, r), [[t0, at(0, 0, 0.4), 'ease-out'], [t0 + 60, at(0.2, 0.95, 1)], [t0 + 520, at(1, 0, 0.4)]]);
  }

  // ── svg of a crack in the glass, a ring, rays, a shard
  const ringG = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1"/></filter></defs><circle cx="40" cy="40" r="34" fill="none" stroke="#fff4d4" stroke-width="2.4" filter="url(#b)"/>', 80, 80);
  let cr = '';
  for (let i = 0; i < 7; i++) { const a = i * 0.9 + 0.3, l = 14 + (i % 3) * 8, x1 = 40 + Math.cos(a) * l * 0.5 + 2 * Math.sin(i * 3), y1 = 40 + Math.sin(a) * l * 0.5 - 2, x2 = 40 + Math.cos(a + 0.12) * l, y2 = 40 + Math.sin(a + 0.12) * l; cr += `M40,40L${x1.toFixed(1)},${y1.toFixed(1)}L${x2.toFixed(1)},${y2.toFixed(1)}`; }
  const crack = k.svg(`<defs><filter id="b"><feGaussianBlur stdDeviation=".35"/></filter></defs><path d="${cr}" stroke="#ffffff" stroke-width=".9" fill="none" stroke-linecap="round" stroke-linejoin="round" filter="url(#b)"/>`, 80, 80);
  let rr = '';
  for (let i = 0; i < 14; i++) { const a = (i * 25.7 + (i % 2) * 7) * Math.PI / 180, r1 = 9, r2 = i % 2 ? 22 : 38; rr += `M${(40 + Math.cos(a) * r1).toFixed(1)},${(40 + Math.sin(a) * r1).toFixed(1)}L${(40 + Math.cos(a) * r2).toFixed(1)},${(40 + Math.sin(a) * r2).toFixed(1)}`; }
  const rays = k.svg(`<defs><filter id="b"><feGaussianBlur stdDeviation=".6"/></filter></defs><path d="${rr}" stroke="#fff6dc" stroke-width="1.5" stroke-linecap="round" filter="url(#b)"/>`, 80, 80);
  const shard = k.svg('<path d="M0,3L8,0L5,5Z" fill="#fff8e2" stroke="#fff" stroke-width=".4"/>', 8, 5);

  // ── each blow
  B.forEach((bl, bi) => {
    const t = bl.t, s = bl.s, g = bl.g, n = norm(g), ang = deg(Math.atan2(n[1], n[0]));
    fx(k.light('g-dawn', g, 50 * s), [[t - 30, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(1.1)', opacity: 0.95 }], [t + 240, { transform: 'scale(1)', opacity: 0.5 }, eio], [t + 700, { transform: 'scale(1.3)', opacity: 0 }]]);
    fx(k.pic('star', g, 32 * s, 32 * s), [[t - 15, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(1.2) rotate(20deg)', opacity: 1 }], [t + 380, { transform: 'scale(.6) rotate(60deg)', opacity: 0 }]]);
    fx(k.pic(ringG, g, 44 * s, 44 * s), [[t, { transform: 'scale(.25)', opacity: 0 }, 'ease-out'], [t + 50, { transform: 'scale(.5)', opacity: 0.95 }], [t + 520, { transform: 'scale(1.6)', opacity: 0 }]]);
    // the hairline crack, and it healing
    fx(k.pic(crack, g, 30 * s, 30 * s), [[t, { transform: `rotate(${fix(bi * 40)}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 40, { transform: `rotate(${fix(bi * 40)}deg) scale(1)`, opacity: 1 }], [t + 420, { transform: `rotate(${fix(bi * 40)}deg) scale(1)`, opacity: 0.75 }, eio], [t + 900, { transform: `rotate(${fix(bi * 40)}deg) scale(1)`, opacity: 0 }]]);
    // shards of glass and sparks flung out along the glass's normal
    for (let i = 0; i < 10; i++) {
      const a = Math.atan2(n[1], n[0]) + (rand() - 0.5) * 2.2, dist = 12 + rand() * 30, v = [Math.cos(a), Math.sin(a)], r = 0.8 + rand() * 0.8, t0 = t + rand() * 40, spin = Math.round((rand() - 0.5) * 540), isShard = i % 3 === 0;
      const at = (f, o, sc) => ({ transform: `translate(${fix(v[0] * dist * f * u)}px, ${fix((v[1] * dist * f + 9 * f * f) * u)}px) rotate(${isShard ? Math.round(spin * f) : 0}deg) scale(${sc})`, opacity: o });
      fx(isShard ? k.pic(shard, g, 6 * r, 4 * r) : k.pic('spark', g, 8 * r, 8 * r), [[t0, at(0, 0, 0.6), 'ease-out'], [t0 + 40, at(0.25, 1, 1)], [t0 + 520, at(1, 0, 0.5)]]);
    }
    // each blow stronger: the light in the glass runs round the dome as a ripple (a ring drawn on it)
    if (alone) void ang;
  });

  // ── after the last blow: rays, and the dome stands
  fx(k.pic(rays, B.at(-1).g, 64, 64), [[last, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [last + 70, { transform: 'scale(1) rotate(8deg)', opacity: 1 }], [last + 520, { transform: 'scale(1.25) rotate(18deg)', opacity: 0 }]]);
  for (let i = 0; i < 10; i++) {
    const t0 = last + 200 + i * 70, x = DX + (rand() - 0.5) * 2 * DRX * 0.8, y = DY - 6 - rand() * 40, r = 5 + rand() * 4;
    const at = (f, o, sc) => ({ transform: `translate(${fix((rand() - 0.5) * 3 * u)}px, ${fix(-26 * f * u)}px) scale(${sc})`, opacity: o });
    fx(k.pic('spark', [x, y], r, r), [[t0, at(0, 0, 0.4), 'ease-out'], [t0 + 120, at(0.1, 0.9, 1)], [t0 + 900, at(1, 0, 0.5)]]);
  }
}
