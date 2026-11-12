// Fog Bank: the silver fog rolls in and swallows the charge: no blow gets through.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: defender (suggestion changed from
// support: the Trap protects you: nothing that charges deals damage), element: water (kept: fog
// is water). Alone, the "blows" are the charge itself: three blows on the bank's face.
//   0-600     the gathering (BEATS.release): the bank swells and begins to roll toward us, the sheets
//             of fog drift, mist starts to creep along the shore from the far side; the warriors run on.
//   1200, 1700, 2200 (alone; else k.blows)  a blow reaches the nearest `guard` point on the face of the
//             bank (BEATS.impact: the first): it is swallowed: a pale ring spreads in the fog and
//             a soft flash goes out in it, a puff of mist billows, water drops hang and fall; the bank
//             gives a little (a slow recoil, a sheen lit over it); and the warriors fade deeper.
//   1000-2800 the mist thickens over the whole picture, rolling in from the right; the warriors dim
//             to shadows, the nearest the last.
//   2800-3900 the fog draws back, the warriors come clear again; the bank settles; the mist is gone.
//   3900      at rest as drawn (BEATS.settle); the move ends at END.
// Contract: each blow is read at its time `at` and snapped to the nearest `guard` point; the effects at
// a blow are built from that point on the overlay (the blow may come from another card).
export const END = 4700;
export const BEATS = { release: 600, impact: 1200, settle: 3900 };
export const STILLS = [450, 1200, 1500, 1900, 2400, 2900, 3500, 4200];

export const textures = {
  mist: [64, 64, (x, y) => { const u = (x - 0.5) * 2, v = (y - 0.5) * 2, r = Math.hypot(u, v), n = 0.7 + 0.3 * Math.sin(x * 13 + y * 7) * Math.cos(y * 11 - x * 5); return [226, 244, 242, Math.max(0, 1 - r * r) * 0.85 * n]; }],
  drop: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, (y - 0.5) * 0.8) * 2, c = Math.max(0, 1 - r); return [226, 252, 252, Math.min(1, c * 2.2)]; }],
  glint: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [240, 255, 253, Math.min(1, c * c * 2)]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, G = S.guard, CORNER = S.corner;
  const near = (to) => G.reduce((b, g) => (Math.hypot(g[0] - to[0], g[1] - to[1]) < Math.hypot(b[0] - to[0], b[1] - to[1]) ? g : b), G[0]);
  const own = [{ at: 1200, to: G[1] }, { at: 1700, to: G[0] }, { at: 2200, to: G[2] }];
  const B = (k.blows || own).slice().sort((a, b) => a.at - b.at).map((b) => ({ t: Math.max(800, Math.min(2300, b.at)), g: near(b.to) }));
  const last = B.at(-1).t, THICK = last + 350, CLEAR = Math.max(THICK + 400, 2900), HOME = 3900;

  k.css(`.g-fog { border-radius: 50%; background: radial-gradient(closest-side, rgba(240,255,253,.9), rgba(190,232,230,.5) 30%, rgba(150,210,210,.18) 60%, rgba(130,200,200,0) 100%); }
    .fx-copy.f-sheen { mix-blend-mode: plus-lighter; filter: brightness(.55) saturate(.8); }`);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1.4"/></filter></defs><circle cx="30" cy="30" r="25" fill="none" stroke="#e8fffc" stroke-width="3" filter="url(#b)"/>', 60, 60);

  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  const grid = [];
  for (let t = 0; t <= HOME + 20; t += 40) grid.push(t);
  const sample = (fn, end = 1) => [...grid.map((t) => [t, fn(t), 'linear']), [HOME + 100, { transform: 'none', opacity: end }]];
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const swallow = (tau) => (tau < 0 ? 0 : tau < 160 ? sm(tau / 160) : Math.exp(-(tau - 160) / 380));
  const glow = (tau) => (tau < -30 ? 0 : tau < 0 ? 1 + tau / 30 : Math.exp(-tau / 300));
  const thick = curve([[0, 0], [500, 0.25], [B[0].t, 0.5], [THICK, 1], [CLEAR, 1], [HOME, 0]]);

  // ── the bank: swells, rolls toward us as it thickens, gives a little at each blow
  const bankPose = (t) => {
    let g = 0;
    for (const b of B) g += swallow(t - b.t);
    return `${k.T(1.4 * g * (1 - 0.6 * thick(t)), 0.6 * g)} scale(${(1 + 0.03 * thick(t) + 0.006 * g).toFixed(4)})`;
  };
  act(k.part('bank'), sample((t) => ({ transform: bankPose(t) })));
  act(k.copy('bank', 'f-sheen'), sample((t) => { let g = 0; for (const b of B) g = Math.max(g, glow(t - b.t)); return { transform: bankPose(t), opacity: +Math.min(1, 0.12 * thick(t) + 0.45 * g).toFixed(3) }; }, 0));

  // ── the veils of fog drift over the warriors; the warriors run on and fade
  const veil = (name, amp, ph) => act(k.part(name), sample((t) => ({ transform: `${k.T(-amp * thick(t) + Math.sin(t / 420 + ph) * 1.2 * thick(t), -0.8 * Math.sin(t / 560 + ph) * thick(t))}`, opacity: 1 })));
  veil('veil0', 5, 0); veil('veil1', 8, 1.7); veil('veil2', 11, 3.1);
  const runner = (name, depth, lowest, runDx) => {
    const st = 500 + depth * 140;
    act(k.part(name), sample((t) => {
      const f = sm(clamp01((t - st) / 800)) * (1 - sm(clamp01((t - CLEAR) / (HOME - CLEAR))));
      const bob = Math.sin(t / 150 + depth) * 0.9 * f;
      return { transform: `${k.T(runDx * f, bob)}`, opacity: +(1 - (1 - lowest) * f).toFixed(3) };
    }));
  };
  runner('farmen', 0, 0.04, 6);
  runner('man2', 1, 0.1, 5);
  runner('man3', 2, 0.2, 4);
  runner('near', 3, 0.32, 3);

  // ── the mist: rolls in over the whole picture from the right, thickest at the answer, then draws back
  const TH = curve([[0, 0], [600, 0.4], [THICK, 1], [CLEAR, 0.9], [HOME, 0]]);
  fx(k.lightIn('g-fog', [210, 105], 280, 190), [...grid.filter((t) => t >= 40).map((t) => [t, { transform: `scale(${(0.9 + 0.15 * TH(t)).toFixed(3)})`, opacity: +(0.5 * TH(t)).toFixed(3) }, 'linear']), [HOME + 100, { transform: 'scale(.9)', opacity: 0 }]]);
  for (let i = 0; i < 18; i++) {
    const t0 = 250 + Math.round(((last + 300 - 250) * i) / 17) + Math.round((rand() - 0.5) * 140), y = 40 + rand() * 140, x0 = 300 + rand() * 40, sz = 80 + rand() * 50, r = Math.round(rand() * 360), life = 1700 + Math.round(rand() * 500);
    const x1 = 90 + rand() * 120, op = 0.35 + rand() * 0.25;
    fx(k.picIn('mist', [x0, y], sz, sz * 0.7, { lit: false }), [[t0, { transform: `rotate(${r}deg) scale(.6)`, opacity: 0 }, 'ease-out'], [t0 + life * 0.45, { transform: `${k.T(x1 - x0, (rand() - 0.5) * 6)} rotate(${r + 14}deg) scale(1)`, opacity: op }, eio],
      [t0 + life, { transform: `${k.T(x1 - x0 - 24, (rand() - 0.5) * 10)} rotate(${r + 30}deg) scale(1.25)`, opacity: 0 }]]);
  }
  // low mist creeping along the shore, ahead of the bank
  for (let i = 0; i < 7; i++) {
    const t0 = 150 + i * 260, y = 150 + rand() * 40, r = Math.round(rand() * 360), x0 = 190 + rand() * 40;
    fx(k.picIn('mist', [x0, y], 90, 34, { lit: false }), [[t0, { transform: `rotate(${(r % 20) - 10}deg) scale(.6, .6)`, opacity: 0 }, 'ease-out'], [t0 + 900, { transform: `${k.T(-70 - rand() * 40, 0)} scale(1, 1)`, opacity: 0.5 }, eio], [t0 + 2200, { transform: `${k.T(-130 - rand() * 40, -2)} scale(1.2, 1)`, opacity: 0 }]]);
  }

  // ── each blow: swallowed in the fog: a pale ring, a soft flash, a billow of mist, drops hanging and falling
  for (const b of B) {
    const [gx, gy] = b.g, t = b.t;
    fx(k.light('g-fog', b.g, 66), [[t - 80, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 60, { transform: 'scale(1.25)', opacity: 0.95 }, 'ease-out'], [t + 400, { transform: 'scale(1)', opacity: 0.5 }, eio], [t + 1000, { transform: 'scale(1.2)', opacity: 0 }]]);
    [[0, 3.2, 0.85], [160, 4.6, 0.5]].forEach(([d, big, o]) => fx(k.pic(ring, b.g, 30, 30, { low: true }), [[t + d, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + d + 60, { transform: 'scale(.6)', opacity: o }, 'ease-out'], [t + d + 900, { transform: `scale(${big})`, opacity: 0 }]]));
    for (let i = 0; i < 5; i++) {
      const r = Math.round(rand() * 360), t0 = t + i * 70, x = gx + (rand() - 0.5) * 24, y = gy + (rand() - 0.5) * 16;
      fx(k.pic('mist', [x, y], 34, 30, { low: true }), [[t0, { transform: `rotate(${r}deg) scale(.3)`, opacity: 0 }, 'ease-out'], [t0 + 280, { transform: `${k.T(8 + rand() * 8, (rand() - 0.5) * 10)} rotate(${r + 20}deg) scale(1)`, opacity: 0.85 }], [t0 + 1400, { transform: `${k.T(18 + rand() * 12, -10 - rand() * 12)} rotate(${r + 50}deg) scale(2)`, opacity: 0 }]]);
    }
    for (let i = 0; i < 12; i++) {
      const a = -Math.PI * (0.05 + 0.9 * rand()) - Math.PI * 0.5 * 0, d = 8 + rand() * 22, t0 = t + Math.round(rand() * 90), sz = 2 + rand() * 2.4, px = Math.cos(a) * d - 6, py = Math.sin(a) * d * 0.7;
      fx(k.pic(i % 3 ? 'drop' : 'glint', b.g, sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 110, { transform: `${k.T(px * 0.7, py * 0.7)} scale(1)`, opacity: 1 }, 'ease-out'], [t0 + 380, { transform: `${k.T(px, py)} scale(1)`, opacity: 0.9 }, 'ease-in'], [t0 + 900 + Math.round(rand() * 300), { transform: `${k.T(px * 1.1, py + 20 + rand() * 12)} scale(.7)`, opacity: 0 }]]);
    }
  }

  // ── at the answer: a great pale light across the bank's face, then the mist rolls back; motes drift off
  fx(k.light('g-fog', [215, 100], 200), [[THICK - 300, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [THICK, { transform: 'scale(1)', opacity: 0.55 }, 'ease-out'], [THICK + 500, { transform: 'scale(1.1)', opacity: 0.3 }, eio], [CLEAR + 200, { transform: 'scale(1.2)', opacity: 0 }]]);
  for (let i = 0; i < 12; i++) {
    const t0 = CLEAR - 300 + Math.round(rand() * 800), x = 150 + rand() * 140, y = 40 + rand() * 120, sz = 2 + rand() * 2.4;
    fx(k.picIn('glint', [x, y], sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 200, { transform: `${k.T(0, -3)} scale(1)`, opacity: 0.9 }, 'ease-out'], [t0 + 1000, { transform: `${k.T((rand() - 0.5) * 12, -20 - rand() * 12)} scale(.3)`, opacity: 0 }]]);
  }
  void CORNER; void u;
}
