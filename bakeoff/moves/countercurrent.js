// Countercurrent (a Trap, a defender: the sea rises and swallows the next spell cast). The
// spout braces: it squashes down, then stretches up, the fireball it holds squeezed and then
// flaring, the whirlpool tightening. A spell comes in (a fireball) and strikes the spout's
// face; the water takes it with a jolt and a hiss: a flash, steam rolling up, sparks and drops
// flung off, the fireball inside flaring as it feeds, the pool's rings pulsing. The spout rocks
// back and forth, shedding the blow, and stands still. The calm mage turns his head to watch.
//
// PLAN (drawing units 300 x 210, ms of the move). Role defender (a Trap that cancels a spell: a
// protective card), element water (the suggestion, fire, is the threat it swallows).
//   0-350     BRACE (RELEASE at 350): the spout squashes, the fire inside squeezes, the pool draws in.
//   350-700   it rears: stretches tall, the crest lifts, the fire flares, the pool widens.
//   each blow (k.blows, else two of its own at 1000 and 1750, on the right and left fingers):
//             -380 the fireball comes in on a falling arc, trailing flame, to the nearest guard point;
//             at   IMPACT: a flash, a jolt (the spout is thrown off its base and rocks back, squashing),
//                  steam, sparks, drops; the fire inside flares; a ring runs out across the pool.
//   after     it rocks to rest, the steam rises and thins, glows fade. At rest from 3300.
// BEATS: release 350, impact 1000 (the first blow), settle 3300.
export const END = 3800;
export const BEATS = { release: 350, impact: 1000, settle: 3300 };
export const STILLS = [250, 600, 850, 1000, 1150, 1800, 2400, 3500];

export const textures = {
  spark: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 200 + 55 * c, 110 + 110 * c * c, Math.min(1, c * c * 2.8)]; }],
  drop: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [210 + 40 * c, 246, 250, Math.min(1, c * 1.6)]; }],
  steam: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [244, 232, 224, c * c * 0.6]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const S = k.spec, BASE = S.base, HEART = S.heart, G = S.guard;
  const spout = k.part('spout'), crest = k.part('crest'), fire = k.part('fire'), pool = k.part('pool'), head = k.part('head');
  k.css('.g-steamy { border-radius: 50%; background: radial-gradient(circle, rgba(255,236,206,.9), rgba(255,170,100,.45) 34%, rgba(255,120,60,.14) 60%, rgba(255,100,40,0) 72%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.5"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#cdf4f4" stroke-width="5" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#f2ffff" stroke-width="1.5"/>', 100, 100);

  // ── the blows: k.blows, else its own two (the right finger, then the left); each snapped to the nearest guard point
  const raw = k.blows || [{ at: 1000, to: [236, 64] }, { at: 1750, to: [158, 64] }];
  const blows = raw.map((b) => {
    let g = G[0], dm = 1e9;
    for (const q of G) { const d = Math.hypot(q[0] - b.to[0], q[1] - b.to[1]); if (d < dm) { dm = d; g = q; } }
    return { at: Math.max(450, Math.min(2300, Math.round(b.at))), g, dir: g[0] > BASE[0] + 4 ? 1 : g[0] < BASE[0] - 4 ? -1 : 0, raw: b.to };
  });
  const last = Math.max(...blows.map((b) => b.at));

  // ── the spout as one body (spout, crest and fire turn about its foot together), sampled every 50 ms
  const lerp = (st, t) => { for (let i = 0; i < st.length - 1; i++) if (t <= st[i + 1][0]) { const f = (t - st[i][0]) / (st[i + 1][0] - st[i][0]), g = f * f * (3 - 2 * f); return st[i][1] + (st[i + 1][1] - st[i][1]) * g; } return st[st.length - 1][1]; };
  const rest = last + 900, back = 3300;
  const baseSy = [[0, 1], [350, 0.955], [700, 1.055], [rest, 1.03], [back, 1], [END, 1]];
  const baseSx = [[0, 1], [350, 1.03], [700, 0.985], [rest, 0.99], [back, 1], [END, 1]];
  const fireS = [[0, 1], [350, 0.88], [700, 1.1], [rest, 1.04], [back, 1], [END, 1]];
  const body = (t) => {
    let rot = 0, sy = lerp(baseSy, t), sx = lerp(baseSx, t), fs = lerp(fireS, t);
    for (const b of blows) {
      const dt = t - b.at;
      if (dt < 0) continue;
      const e = Math.exp(-dt / 300), c = Math.cos((2 * Math.PI * dt) / 420);
      rot += -b.dir * 3.8 * e * c;
      sy -= 0.05 * Math.exp(-dt / 200) * Math.cos((2 * Math.PI * dt) / 330);
      sx += 0.03 * Math.exp(-dt / 200) * Math.cos((2 * Math.PI * dt) / 330);
      fs += 0.18 * Math.exp(-dt / 260) * (1 - Math.exp(-dt / 40));
    }
    return { rot, sy, sx, fs };
  };
  const sm = [], cr = [], fi = [];
  for (let t = 0; t <= back + 50; t += 50) {
    const tt = Math.min(t, back), b = body(tt), main = `rotate(${b.rot.toFixed(2)}deg) scale(${b.sx.toFixed(3)}, ${b.sy.toFixed(3)})`;
    sm.push([t, { transform: main }, 'linear']);
    cr.push([t, { transform: main }, 'linear']);
    fi.push([t, { transform: `${main} translate(0px, ${(-(1 - b.fs) * (BASE[1] - HEART[1]) * u).toFixed(1)}px) scale(${b.fs.toFixed(3)})` }, 'linear']);
  }
  for (const l of [sm, cr, fi]) l[l.length - 1][1] = { ...l[l.length - 1][1] };
  act(spout, sm); act(crest, cr); act(fire, fi);

  // ── the pool: draws in with the brace, widens as it rears, pulses at every blow
  const pl = [];
  for (let t = 0; t <= back + 50; t += 50) {
    const tt = Math.min(t, back);
    let w = lerp([[0, 1], [350, 0.92], [700, 1.06], [rest, 1.03], [back, 1], [END, 1]], tt), h = w;
    for (const b of blows) { const dt = tt - b.at; if (dt >= 0) { const e = Math.exp(-dt / 280) * Math.sin((2 * Math.PI * dt) / 380 + 0.8); w += 0.05 * e; h += 0.12 * e; } }
    pl.push([t, { transform: `scale(${w.toFixed(3)}, ${h.toFixed(3)})` }, 'linear']);
  }
  act(pool, pl);

  // ── the mage turns his head to watch it, a small rock at each blow
  const hd = [[0, { transform: 'rotate(0deg)' }, eio], [380, { transform: 'rotate(-3deg)' }, eio], [900, { transform: 'rotate(-4deg)' }, eio]];
  for (const b of blows) hd.push([b.at + 80, { transform: 'rotate(-1.5deg)' }, eio], [b.at + 380, { transform: 'rotate(-4.5deg)' }, eio]);
  hd.push([Math.min(rest + 300, back - 300), { transform: 'rotate(-3deg)' }, eio], [back, { transform: 'rotate(0deg)' }]);
  hd.sort((a, b) => a[0] - b[0]);
  act(head, hd.filter((q, i) => i === 0 || q[0] > hd[i - 1][0]));

  // ── the glow of the fire in the water: swelling with the brace, flaring at each blow
  const gl = [[150, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [350, { transform: 'scale(.9)', opacity: 0.4 }, eio], [700, { transform: 'scale(1.3)', opacity: 0.85 }, eio]];
  for (const b of blows) gl.push([b.at, { transform: 'scale(1.8)', opacity: 1 }, 'ease-out'], [b.at + 260, { transform: 'scale(1.3)', opacity: 0.8 }, eio]);
  gl.push([Math.min(rest + 300, back - 100), { transform: 'scale(1.1)', opacity: 0.5 }, eio], [back, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.light('g-warm', HEART, 90), gl.filter((q, i) => i === 0 || q[0] > gl[i - 1][0]));
  // the sea's cool light, brightening as the spout rears
  fx(k.light('g-aura', [196, 100], 130), [[250, { transform: 'scale(.7)', opacity: 0 }, 'ease-out'], [700, { transform: 'scale(1)', opacity: 0.35 }, eio], [rest, { transform: 'scale(1.05)', opacity: 0.3 }, eio], [back, { transform: 'scale(.8)', opacity: 0 }]]);

  // ── each blow: the fireball comes in, and where it lands the water hisses
  blows.forEach((b, bi) => {
    const [gx, gy] = b.g, IM = b.at;
    // its source: out beyond the guard point, away from the spout, from above
    let nx = gx - BASE[0] + (b.dir === 0 ? (rand() - 0.5) * 30 : 0), ny = gy - 100 - 55;
    const nl = Math.hypot(nx, ny) || 1;
    nx /= nl; ny /= nl;
    const Sx = gx + nx * 120, Sy = gy + ny * 120;
    const [X0, Y0] = k.P(Sx, Sy), [X1, Y1] = k.P(gx, gy);
    const dx = X1 - X0, dy = Y1 - Y0;
    const at = (f, sc, o) => ({ transform: `translate(${(dx * f).toFixed(1)}px, ${(dy * f).toFixed(1)}px) scale(${sc})`, opacity: o });
    const T0 = IM - 380;
    // the flaring head, then its trailing billows
    fx(k.pic('puffHot', [Sx, Sy], 26, 26), [[T0, at(0, 0.4, 0), 'ease-out'], [T0 + 50, at(0.04, 0.8, 1)], [T0 + 380, at(1, 1.15, 1), 'ease-in'], [T0 + 450, at(1, 1.6, 0)]]);
    fx(k.light('g-warm', [Sx, Sy], 40), [[T0, { transform: `${k.T(0, 0)} scale(.5)`, opacity: 0 }, 'ease-out'], [T0 + 60, { transform: `${k.T(0, 0)} scale(1)`, opacity: 0.9 }], [T0 + 380, { transform: `${k.T(gx - Sx, gy - Sy)} scale(1.1)`, opacity: 0.9 }, 'ease-in'], [T0 + 450, { transform: `${k.T(gx - Sx, gy - Sy)} scale(1.5)`, opacity: 0 }]]);
    for (let i = 1; i < 9; i++) {
      const t0 = T0 + i * 26, r = Math.round(rand() * 360), lag = i * 0.045;
      const ps = (f) => at(Math.max(0, Math.min(1, f)), 1, 1).transform;
      fx(k.pic(i % 3 === 2 ? 'puffCool' : 'puff', [Sx, Sy], 22 - i, 22 - i), [[t0, { transform: `${ps(0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t0 + 40, { transform: `${ps(0.1)} rotate(${r}deg) scale(.8)`, opacity: 0.85 }, 'linear'],
        [t0 + 380 - i * 14, { transform: `${ps(1 - lag * 0.2)} rotate(${r + 40}deg) scale(1)`, opacity: 0.8 }, 'ease-in'], [t0 + 470 - i * 14, { transform: `${ps(1)} rotate(${r + 60}deg) scale(1.3)`, opacity: 0 }]]);
    }

    // IMPACT: flash and the hiss
    const fl = [[IM - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(1.2)', opacity: 1 }, eio], [IM + 220, { transform: 'scale(.9)', opacity: 0.6 }, eio], [IM + 520, { transform: 'scale(1.3)', opacity: 0 }]];
    fx(k.light('g-warm', [gx, gy], 48), fl);
    fx(k.light('g-water', [gx, gy], 40), [[IM + 40, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [IM + 160, { transform: 'scale(1.2)', opacity: 0.8 }, eio], [IM + 700, { transform: 'scale(1.5)', opacity: 0 }]]);
    fx(k.pic(ring, [gx, gy], 30, 30), [[IM, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(.5)', opacity: 0.9 }], [IM + 560, { transform: 'scale(2)', opacity: 0 }]]);
    // a ring running out over the pool
    fx(k.pic(ring, [BASE[0], BASE[1] - 1], 60, 60), [[IM + 80, { transform: 'scale(1, .16) scale(.3)', opacity: 0 }, 'ease-out'], [IM + 160, { transform: 'scale(1, .16) scale(.55)', opacity: 0.7 }], [IM + 1000, { transform: 'scale(1, .16) scale(1.9)', opacity: 0 }]]);
    // steam rolling up and out from the guard point
    for (let i = 0; i < 7; i++) {
      const t = IM + 30 + i * 95, r = Math.round(rand() * 360), sd = b.dir || (rand() < 0.5 ? -1 : 1), x = gx + (rand() - 0.5) * 8;
      fx(k.pic('steam', [x, gy], 26 + rand() * 8, 26 + rand() * 8, { lit: false }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 260, { transform: `${k.T(sd * 3, -10)} rotate(${r + 20}deg) scale(1)`, opacity: 0.75 }],
        [t + 1300, { transform: `${k.T(sd * (8 + rand() * 8), -(32 + rand() * 16))} rotate(${r + 55}deg) scale(2.1)`, opacity: 0 }]]);
    }
    // sparks and drops flung off the blow, thrown back the way it came
    for (let i = 0; i < 12; i++) {
      const sd = b.dir || (rand() < 0.5 ? -1 : 1), vx = sd * (10 + rand() * 26) * (rand() < 0.2 ? -0.4 : 1), up = 8 + rand() * 20, t0 = IM + rand() * 60, spark = i < 7;
      const sz = spark ? 3 + rand() * 2.5 : 2.5 + rand() * 2.5;
      const pt = (f, s, o) => ({ transform: `translate(${(vx * f * u).toFixed(1)}px, ${((-up * 4 * f * (1 - f) + 14 * f * f) * u).toFixed(1)}px) scale(${s})`, opacity: o });
      fx(k.pic(spark ? 'spark' : 'drop', [gx, gy], sz, sz), [[t0, pt(0, 0.6, 0), 'ease-out'], [t0 + 40, pt(0.05, 1, 1), 'linear'], [t0 + 240, pt(0.45, 1, 0.95), 'linear'], [t0 + 440, pt(0.8, 0.8, 0.7), 'linear'], [t0 + 600, pt(1, 0.5, 0)]]);
    }
    void bi;
  });
}
