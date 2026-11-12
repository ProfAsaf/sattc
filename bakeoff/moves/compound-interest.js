// Compound Interest: the ledger pays out; its pages split in two as they leave and land as more.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support (Draw a card for every 3 maximum
// Energy: a gift of cards), element: water (the tide faction's cave: sea-light and foam, as suggested).
// Aimed: the gift goes to T = k.aim, or, alone, out of the cave mouth onto the moonlit sea (`alone`).
//   0-760     the gather: the book breathes in (its leaves lift and the spiral draws down into it), its light
//             swells, and motes of light run in to it from the dark; the pages rustle.
//   800       RELEASE: the spiral surges up and twirls (pages and coins turning against each other); pages
//             and coins peel off all along it, one after another, and cross to T on an arc, each page
//             splitting in two as it flies; the spiral gives some of itself, thinning as they go.
//   1500      IMPACT: they land at T in a burst of light and foam, rings run out, three pages flip up and
//             fan (the cards drawn), coins scatter, motes rise.
//   1700-3200 the spiral fills out again (new pages splitting into it), the glints die down.
//   3700      at rest as drawn (BEATS.settle); the move ends at END.
// Contract: T = k.aim || alone; each page and coin starts at its own point of the spiral (worked out
// from the drawing's helix) and its arc is worked out from there to T; everything that flies or
// lands is on the overlay (T may be on another card).
export const END = 4200;
export const BEATS = { release: 800, impact: 1500, settle: 3700 };
export const STILLS = [400, 800, 1000, 1250, 1550, 1900, 2700, 3900];

export const textures = {
  page: [32, 40, (x, y) => {
    const ax = Math.abs(x - 0.5), ay = Math.abs(y - 0.5);
    if (ax > 0.4 || ay > 0.46) return [0, 0, 0, 0];
    const a = Math.min(1, (0.4 - ax) * 18, (0.46 - ay) * 18);
    const row = y > 0.2 && y < 0.82 && Math.sin(y * 70) > 0.35 && ax < 0.28;
    const c = row ? 0 : 1;
    return [239 - 36 * (1 - c), 255 - 18 * (1 - c), 246 - 14 * (1 - c), a];
  }],
  coin: [32, 32, (x, y) => {
    const r = Math.hypot(x - 0.5, y - 0.5) * 2;
    if (r > 0.92) return [0, 0, 0, 0];
    const a = Math.min(1, (0.92 - r) * 14), rim = r > 0.7, hi = Math.max(0, 1 - Math.hypot(x - 0.36, y - 0.34) * 3.2);
    return rim ? [172 + 60 * hi, 120 + 60 * hi, 30, a] : [255, 214 + 30 * hi, 110 + 110 * hi, a];
  }],
  spark: [32, 32, (x, y) => {
    const dx = Math.abs(x - 0.5) * 2, dy = Math.abs(y - 0.5) * 2, c = Math.max(0, 1 - Math.hypot(dx, dy)), cross = Math.max(0, 1 - Math.min(dx * 7 + dy, dy * 7 + dx));
    const v = Math.min(1, c * c * 1.6 + cross * 0.9); return [236 + 19 * v, 252, 248, v];
  }],
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [214 + 41 * c, 252, 246, Math.min(1, c * c * 1.5)]; }],
  foam: [48, 48, (x, y) => {
    const r = Math.hypot(x - 0.5, y - 0.5) * 2, n = 0.5 + 0.5 * Math.sin(x * 19 + y * 11) * Math.cos(y * 17 - x * 7);
    const c = Math.max(0, 1 - r * (0.85 + 0.3 * n)); return [236, 253, 250, Math.min(1, c * c * 1.5)];
  }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, E = S.emit, BK = S.book;
  const T = k.aim || S.alone, REL = 800, IMP = 1500, HOME = 3700;
  const dxT = T[0] - E[0], right = dxT >= 0;
  const rad = (d) => (d * Math.PI) / 180;
  k.css(`.g-ledger { border-radius: 50%; background: radial-gradient(closest-side, rgba(244,255,250,.95), rgba(176,240,232,.6) 28%, rgba(110,210,216,.2) 58%, rgba(80,190,205,0) 100%); }
    .g-ink { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,246,214,.95), rgba(255,222,130,.5) 32%, rgba(255,205,110,.14) 62%, rgba(255,190,90,0) 100%); }`);

  // ── the spiral as drawn (the helix of its drawing: x, y at t of its climb from the book)
  const cx = 172, by = 152;
  const helix = (t) => { const th = 0.5 + t * 4 * Math.PI * 2, r = 5 + 54 * Math.pow(t, 0.8); return [cx + Math.cos(th) * r, by - 6 - 108 * t + Math.sin(th) * r * 0.25]; };

  // ── the parts: the book breathes in and lifts its leaves; the spiral draws down, surges and twirls
  //    (pages and coins turning against each other), thins as its gifts leave, fills out again
  act(k.part('book'), [[0, { transform: 'none' }, eio], [520, { transform: 'scale(1.03, .94)' }, 'ease-out'], [REL + 120, { transform: 'scale(.97, 1.1)' }, eio], [1500, { transform: 'scale(1.02, .97)' }, eio], [2300, { transform: 'scale(1, 1.02)' }, eio], [3100, { transform: 'none' }]]);
  const twirl = (ph, amp) => { const l = []; let i = 0; for (let t = REL + 100; t <= 2100; t += 170, i++) l.push([t, { transform: `rotate(${(((i + ph) % 2) ? 2 : -2) * amp}deg) scale(${((i + ph) % 2) ? 1 - 0.14 * amp : 1 + 0.07 * amp}, ${1.06 + 0.02 * amp})` }, eio]); return l; };
  act(k.part('stream'), [[0, { transform: 'none', opacity: 1 }, eio], [600, { transform: 'scale(.96, .84)', opacity: 1 }, 'ease-out'], [REL + 120, { transform: 'scale(1.05, 1.1)', opacity: 1 }, eio], [IMP, { transform: 'scale(1.02, 1.06)', opacity: 0.55 }, eio], [2000, { transform: 'scale(.99, 1.01)', opacity: 0.8 }, eio], [2900, { transform: 'none', opacity: 1 }, eio], [HOME, { transform: 'none', opacity: 1 }]]);
  act(k.part('pages'), [[0, { transform: 'none', opacity: 1 }, eio], [600, { transform: 'rotate(-3deg) scale(.9, .8)', opacity: 1 }, 'ease-out'], ...twirl(0, 1).map(([t, v], i) => i === 0 ? [t, { ...v, opacity: 1 }, eio] : [t, { ...v, opacity: Math.max(0.3, 1 - 0.14 * i) }, eio]),
    [2300, { transform: 'rotate(1deg) scale(1, 1.02)', opacity: 0.5 }, eio], [3000, { transform: 'none', opacity: 1 }, eio], [HOME, { transform: 'none', opacity: 1 }]]);
  act(k.part('coins'), [[0, { transform: 'none', opacity: 1 }, eio], [600, { transform: 'rotate(3deg) scale(.92, .82)', opacity: 1 }, 'ease-out'], ...twirl(1, 1.4).map(([t, v], i) => [t, { ...v, opacity: Math.max(0.4, 1 - 0.1 * i) }, eio]),
    [2300, { transform: 'rotate(-1deg) scale(1, 1.02)', opacity: 0.6 }, eio], [3000, { transform: 'none', opacity: 1 }, eio], [HOME, { transform: 'none', opacity: 1 }]]);

  // ── the gather: the book's light swells, motes of light run in to it from the dark
  fx(k.lightIn('g-ledger', [cx, by - 6], 96, 60), [[100, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [700, { transform: 'scale(1)', opacity: 0.8 }, eio], [REL + 200, { transform: 'scale(1.25)', opacity: 0.95 }, eio], [1800, { transform: 'scale(1.05)', opacity: 0.55 }, eio], [3100, { transform: 'scale(.9)', opacity: 0 }]]);
  fx(k.lightIn('g-ink', [cx, E[1]], 110, 130), [[300, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [REL + 250, { transform: 'scale(1)', opacity: 0.45 }, eio], [IMP, { transform: 'scale(1.1)', opacity: 0.5 }, eio], [2600, { transform: 'scale(.9)', opacity: 0 }]]);
  for (let i = 0; i < 11; i++) {
    const side = i % 2 ? 1 : -1, x0 = cx + side * (40 + rand() * 50), y0 = by - 20 - rand() * 60, t = 60 + i * 55, s = 3 + rand() * 3;
    fx(k.picIn('mote', [x0, y0], s, s), [[t, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t + 120, { transform: 'scale(1)', opacity: 0.9 }, 'ease-in'], [t + 560, { transform: `${k.T(cx - x0, by - 6 - y0)} scale(.5)`, opacity: 0 }]]);
  }
  // the pages of the book rustle: a page flicks up and over
  for (let i = 0; i < 3; i++) {
    const t = 300 + i * 210, side = i % 2 ? 1 : -1;
    fx(k.picIn('page', [cx + side * 12, by - 7], 9, 11, { lit: false }), [[t, { transform: 'scale(.3, .3)', opacity: 0 }, 'ease-out'], [t + 120, { transform: `${k.T(side * 2, -8)} rotate(${side * 20}deg) scale(1, 1)`, opacity: 0.9 }, eio], [t + 360, { transform: `${k.T(-side * 4, -18)} rotate(${-side * 30}deg) scale(.1, 1)`, opacity: 0.8 }, eio], [t + 640, { transform: `${k.T(-side * 6, -30)} rotate(${-side * 40}deg) scale(.8, .9)`, opacity: 0 }]]);
  }

  // ── the release: a swell of light up the spiral, and a ring at its heart
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".8"/></filter></defs><circle cx="30" cy="30" r="25" fill="none" stroke="#effffc" stroke-width="3" filter="url(#b)"/>', 60, 60);
  fx(k.pic(ring, E, 44, 44), [[REL - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [REL + 80, { transform: 'scale(.7)', opacity: 0.9 }], [REL + 800, { transform: 'scale(3.6)', opacity: 0 }]]);

  // ── the gift: pages (each splitting in two as it flies) and coins, from points all along the spiral, one after another
  const FT = IMP - REL, arcH = 28 + Math.min(34, Math.abs(dxT) * 0.1);
  const flyTo = (O, off, f0) => { // the arc's point at f of its flight, from O to T+off
    const C = [(O[0] + T[0]) / 2 + (right ? -6 : 6), Math.min(O[1], T[1]) - arcH];
    return (f) => { const q = 1 - f; return [q * q * O[0] + 2 * q * f * C[0] + f * f * (T[0] + off[0]), q * q * O[1] + 2 * q * f * C[1] + f * f * (T[1] + off[1])]; };
  };
  const pageFly = (tOn, t0, dur, off, split, w) => {
    const O = helix(tOn), bz = flyTo(O, off), a0 = rand() * 40 - 20;
    const N = 6;
    const mk = (sgn, ox) => {
      const kf = [];
      for (let j = 0; j <= N; j++) {
        const f = j / N, [x, y] = bz(f), sf = split > 0 && f > split ? (f - split) / (1 - split) : 0, p = sm(sf);
        const sc = (0.45 + 0.55 * sm(Math.min(1, f * 3))) * (1 + 0.1 * Math.sin(f * Math.PI)) * (sgn ? 0.82 + 0.18 * (1 - p) : 1);
        const flip = Math.abs(Math.cos((f * 2.2 + a0 / 90) * Math.PI)) * 0.8 + 0.2;
        kf.push([Math.round(t0 + dur * f), { transform: `${k.T(x - O[0] + sgn * ox * p, y - O[1] - sgn * 3 * p)} rotate(${Math.round(a0 + f * 200 + sgn * 24 * p)}deg) scale(${(sc * flip).toFixed(2)}, ${sc.toFixed(2)})`, opacity: j === 0 ? 0 : (j === 1 ? 0.95 : 1) }, j === 0 ? 'ease-out' : 'linear']);
      }
      const [lx, ly] = bz(1);
      kf.push([t0 + dur + 140, { transform: `${k.T(lx - O[0] + sgn * ox, ly - O[1] - 3)} rotate(${Math.round(a0 + 224 + sgn * 24)}deg) scale(${w / 9})`, opacity: 1 }, 'ease-in'], [t0 + dur + 480, { transform: `${k.T(lx - O[0] + sgn * ox * 1.3, ly - O[1] + 2)} rotate(${Math.round(a0 + 240 + sgn * 30)}deg) scale(${(w / 9) * 0.8})`, opacity: 0 }]);
      return kf;
    };
    fx(k.pic('page', O, w, w * 1.25, { lit: false }), mk(0, 0));
    if (split > 0) fx(k.pic('page', O, w, w * 1.25, { lit: false }), mk(1, 7 + rand() * 4));
  };
  for (let i = 0; i < 16; i++) {
    const tOn = 0.12 + (i / 15) * 0.82, t0 = REL + i * 34, dur = FT - 120 + (i / 15) * 90 - rand() * 40;
    pageFly(tOn, t0, dur, [(rand() - 0.5) * 18, (rand() - 0.5) * 8], i % 3 === 2 ? 0 : 0.45 + rand() * 0.2, 7.5 + rand() * 2);
  }
  // coins
  for (let i = 0; i < 12; i++) {
    const O = helix(0.1 + (i / 11) * 0.84), off = [(rand() - 0.5) * 22, (rand() - 0.5) * 9], bz = flyTo(O, off), t0 = REL + 40 + i * 46, dur = FT - 90 + rand() * 70, spin = rand(), kf = [];
    for (let j = 0; j <= 6; j++) {
      const f = j / 6, [x, y] = bz(f), sc = 0.5 + 0.5 * sm(Math.min(1, f * 3));
      kf.push([Math.round(t0 + dur * f), { transform: `${k.T(x - O[0], y - O[1])} rotate(${Math.round(f * 180)}deg) scale(${(sc * (Math.abs(Math.cos((f * 2.4 + spin) * Math.PI)) * 0.85 + 0.15)).toFixed(2)}, ${sc.toFixed(2)})`, opacity: j === 0 ? 0 : (j === 1 ? 0.95 : 1) }, j === 0 ? 'ease-out' : 'linear']);
    }
    const [lx, ly] = bz(1);
    kf.push([t0 + dur + 160, { transform: `${k.T(lx - O[0] + (rand() - 0.5) * 8, ly - O[1] - 5)} rotate(200deg) scale(1)`, opacity: 1 }, 'ease-in'], [t0 + dur + 520, { transform: `${k.T(lx - O[0] + (rand() - 0.5) * 12, ly - O[1] + 2)} rotate(220deg) scale(.8)`, opacity: 0 }]);
    fx(k.pic('coin', O, 7.5, 7.5, { lit: false }), kf);
  }
  // glints along the flight
  for (let i = 0; i < 12; i++) {
    const O = helix(0.15 + rand() * 0.8), f = 0.15 + 0.75 * rand(), [x, y] = flyTo(O, [0, 0])(f), t = REL + 40 + f * FT + rand() * 160, s = 5 + rand() * 4;
    fx(k.pic('spark', [x + (rand() - 0.5) * 8, y + (rand() - 0.5) * 6], s, s), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 90, { transform: 'scale(1) rotate(20deg)', opacity: 1 }], [t + 380, { transform: `${k.T(0, 4)} scale(.3) rotate(60deg)`, opacity: 0 }]]);
  }
  // sparkles shed along the spiral as it gives
  for (let i = 0; i < 14; i++) {
    const [x, y] = helix(0.08 + rand() * 0.88), t = REL + 60 + rand() * 700, s = 4 + rand() * 4;
    fx(k.picIn('spark', [x, y], s, s), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 110, { transform: 'scale(1) rotate(25deg)', opacity: 1 }], [t + 460, { transform: 'scale(.3) rotate(70deg)', opacity: 0 }]]);
  }

  // ── the landing (IMPACT): light and foam, rings, three pages flip up and fan, coins scatter, motes rise
  const il = [[IMP - 60, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 60, { transform: 'scale(1.15)', opacity: 1 }, eio]];
  for (let t = IMP + 220, i = 0; t < 2400; t += 150, i++) il.push([t, { transform: `scale(${i % 2 ? 1.1 : 0.94})`, opacity: i % 2 ? 0.95 : 0.78 }, eio]);
  il.push([3000, { transform: 'scale(.8)', opacity: 0 }]);
  fx(k.light('g-ledger', T, 82), il);
  fx(k.light('g-ink', T, 70, 54), [[IMP - 20, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IMP + 140, { transform: 'scale(1)', opacity: 0.8 }, eio], [2200, { transform: 'scale(1.2)', opacity: 0 }]]);
  // rings run out over the water: wide and flat, then a bright ring
  [[IMP, 5.0, 0.9, 0.42], [IMP + 170, 3.8, 0.65, 0.42], [IMP + 340, 3, 0.5, 0.42]].forEach(([t, sc, o, fl]) => fx(k.pic(ring, [T[0], T[1] + 3], 38, 38), [[t, { transform: `scale(.3, ${(0.3 * fl).toFixed(2)})`, opacity: 0 }, 'ease-out'], [t + 70, { transform: `scale(.6, ${(0.6 * fl).toFixed(2)})`, opacity: o }], [t + 960, { transform: `scale(${sc}, ${(sc * fl).toFixed(2)})`, opacity: 0 }]]));
  for (let i = 0; i < 12; i++) {
    const a = rad(-180 + (180 * (i + 0.5)) / 12 + (rand() - 0.5) * 10), d = 14 + rand() * 20, t = IMP - 20 + rand() * 80, s = 8 + rand() * 7;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * d * f, Math.sin(a) * d * f * 0.8 + 12 * f * f)} scale(${sc})`, opacity: o });
    fx(k.pic('foam', T, s, s), [[t, P(0, 0.4, 0), 'ease-out'], [t + 80, P(0.35, 1, 0.95), 'ease-out'], [t + 300, P(0.85, 1.1, 0.8), 'ease-in'], [t + 620, P(1, 1.3, 0)]]);
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + rand() * 0.3, d = 14 + rand() * 22, t = IMP + rand() * 90, s = 4 + rand() * 5;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * d * f, Math.sin(a) * d * f - 10 * f + 8 * f * f)} scale(${sc})`, opacity: o });
    fx(k.pic('spark', T, s, s), [[t, P(0, 0.5, 0), 'ease-out'], [t + 60, P(0.25, 1.1, 1), 'ease-out'], [t + 330, P(0.8, 0.9, 0.9), 'ease-in'], [t + 700 + rand() * 200, P(1, 0.3, 0)]]);
  }
  // three pages flip up and fan: the cards drawn
  [[-14, 0, -26], [0, 110, 0], [14, 220, 26]].forEach(([dx, dt, rot]) => {
    const t = IMP + 100 + dt, P = (f, sx, o) => ({ transform: `${k.T(dx * (0.4 + 0.6 * f), -34 * f + 12 * f * f)} rotate(${(rot * f).toFixed(0)}deg) scale(${sx}, 1.3)`, opacity: o });
    fx(k.pic('page', [T[0], T[1] - 4], 10, 12.5, { lit: false }), [[t, { ...P(0, 0.2, 0), transform: 'scale(.4)' }, 'ease-out'], [t + 90, P(0.15, 1, 1), 'linear'], [t + 270, P(0.45, 0.15, 1), 'linear'], [t + 450, P(0.7, 1, 1), 'linear'], [t + 650, P(0.9, 0.25, 0.9), 'linear'], [t + 850, P(1, 0.9, 0)]]);
  });
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI * (0.1 + 0.8 * rand()), d = 16 + rand() * 18, t = IMP + 40 + rand() * 120;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * d * f, Math.sin(a) * d * f + 16 * f * f)} rotate(${Math.round(f * 300)}deg) scale(${sc})`, opacity: o });
    fx(k.pic('coin', [T[0], T[1] - 2], 7, 7, { lit: false }), [[t, P(0, 0.4, 0), 'ease-out'], [t + 80, P(0.3, 1, 1), 'linear'], [t + 450, P(0.9, 0.9, 1), 'ease-in'], [t + 700, P(1, 0.8, 0)]]);
  }
  for (let i = 0; i < 14; i++) {
    const x = (rand() - 0.5) * 36, t = IMP + 160 + rand() * 800, s = 3 + rand() * 4;
    fx(k.pic('mote', [T[0] + x, T[1] + 2], s, s), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 160, { transform: `${k.T(x * 0.1, -6)} scale(1)`, opacity: 0.95 }, 'linear'], [t + 1100, { transform: `${k.T(x * 0.3, -34 - rand() * 18)} scale(.5)`, opacity: 0 }]]);
  }

  // ── the ledger refills: a pulse of light at its heart, new pages splitting in
  fx(k.lightIn('g-ledger', [cx, by - 30], 80, 80), [[2200, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [2700, { transform: 'scale(1)', opacity: 0.55 }, eio], [HOME, { transform: 'scale(1.1)', opacity: 0 }]]);
  for (let i = 0; i < 8; i++) {
    const [x, y] = helix(0.1 + (i / 7) * 0.8), t = 2200 + i * 110, s = 5 + rand() * 4;
    fx(k.picIn('spark', [x, y], s, s), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 130, { transform: 'scale(1) rotate(25deg)', opacity: 1 }], [t + 520, { transform: 'scale(.3) rotate(70deg)', opacity: 0 }]]);
  }
}
