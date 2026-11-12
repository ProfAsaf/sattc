// We Grow Together: the dryad and the knight, hands clasped, give their strength away.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support, element nature.
//   0-900     GATHER: they lean in toward each other (the dryad right, the knight
//             left) and settle a hair into their stance; the light at their clasped
//             hands swells and pulses; green and gold leaf-motes drift in from round
//             about to the clasp; the light shafts brighten.
//   900       RELEASE: the clasp flares and a ring leaves it; a stream of green and
//             gold leaves spirals out along an arc to T (alone: up the shafts, above
//             them; aimed: another card's point).
//   1000-1500 the boon also lands on the two of them: each rises taller from the
//             feet, a green light washing over them, sprouts unfurling at their feet.
//   1300      IMPACT: the first leaves land at T: a flash, a ring, a ring of leaves
//             thrown out, gold motes rising.
//   1800-3500 they hold their new height a moment, then ease back down to rest, the
//             sprouts fold away, the motes thin out, the light sinks.
//   3500      at rest as drawn (END 4000).
// The stream and the bloom at T are on the overlay (T may be on another card).
export const END = 4000;
export const BEATS = { release: 900, impact: 1300, settle: 3500 };
export const STILLS = [450, 880, 1050, 1150, 1300, 1650, 2900, 3700];

export const textures = {
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [236 + 19 * c, 255, 170 + 60 * c * c, Math.min(1, c * c * 2.4)]; }],
  gold: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 228 + 20 * c, 130 + 90 * c * c, Math.min(1, c * c * 2.4)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const dryad = k.part('dryad'), knight = k.part('knight');
  const E = k.spec.emit, [[dfx, dfy], [kfx, kfy]] = k.spec.feet;
  const T = k.aim || [150, 36];
  k.css('.g-leaf { border-radius: 50%; background: radial-gradient(circle, rgba(250,255,214,.95), rgba(190,240,110,.55) 30%, rgba(120,200,70,.2) 58%, rgba(100,190,60,0) 72%); }');
  const leafG = k.svg('<defs><linearGradient id="g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#7fc243"/><stop offset="1" stop-color="#dff79a"/></linearGradient></defs><path d="M10,30C2,22 3,8 10,1C17,8 18,22 10,30Z" fill="url(#g)"/><path d="M10,28L10,6" stroke="#f4ffd0" stroke-width="1" opacity=".7"/>', 20, 30);
  const leafY = k.svg('<defs><linearGradient id="g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffc24a"/><stop offset="1" stop-color="#fff0b0"/></linearGradient></defs><path d="M10,30C2,22 3,8 10,1C17,8 18,22 10,30Z" fill="url(#g)"/><path d="M10,28L10,6" stroke="#fffbe0" stroke-width="1" opacity=".7"/>', 20, 30);
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#e6ffa8" stroke-width="5" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#ffffff" stroke-width="1.6"/>', 100, 100);
  const ringGold = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#ffd77a" stroke-width="5" filter="url(#b)"/>', 100, 100);

  // ── the pair: lean in, settle into the stance, rise as the boon comes through, settle back
  const side = (el, dir) => act(el, [
    [0, { transform: 'none' }, eio],
    [350, { transform: `rotate(${(dir * 0.8).toFixed(1)}deg) scale(1, .99)` }, eio],
    [880, { transform: `rotate(${(dir * 1.7).toFixed(1)}deg) scale(1, .985)` }, 'ease-in'],
    [1020, { transform: 'rotate(0deg) scale(1.012, 1.03)' }, 'ease-out'],
    [1400, { transform: 'rotate(0deg) scale(1.03, 1.075)' }, eio],
    [1700, { transform: 'rotate(0deg) scale(1.025, 1.06)' }, eio],
    [2500, { transform: 'rotate(0deg) scale(1.02, 1.05)' }, eio],
    [3050, { transform: `rotate(${(dir * -0.5).toFixed(1)}deg) scale(1, .996)` }, eio],
    [3500, { transform: 'none' }],
  ]);
  side(dryad, 1); side(knight, -1);

  // ── light: the shafts swell, the clasp pulses, then it sinks
  fx(k.lightIn('g-heal', [150, 40], 240, 130), [[0, { opacity: 0 }, 'ease-out'], [700, { opacity: 0.45 }, eio], [1300, { opacity: 0.8 }, eio], [2500, { opacity: 0.4 }, eio], [3500, { opacity: 0 }]]);
  const pl = [[100, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [500, { transform: 'scale(.7)', opacity: 0.6 }, eio]];
  for (let t = 600, i = 0; t < 880; t += 90, i++) pl.push([t, { transform: `scale(${i % 2 ? 0.85 : 1.05})`, opacity: i % 2 ? 0.8 : 0.95 }, eio]);
  pl.push([930, { transform: 'scale(1.15)', opacity: 1 }, 'ease-out'], [1250, { transform: 'scale(.8)', opacity: 0.45 }, eio], [2000, { transform: 'scale(.6)', opacity: 0.2 }], [2700, { transform: 'scale(.5)', opacity: 0 }]);
  fx(k.lightIn('g-warm', E, 54, 54), pl);
  fx(k.lightIn('g-leaf', E, 70, 70), [[500, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(1)', opacity: 0.7 }, eio], [1400, { transform: 'scale(1.1)', opacity: 0.45 }, eio], [2400, { transform: 'scale(1)', opacity: 0.3 }], [3000, { transform: 'scale(.7)', opacity: 0 }]]);
  // a ring leaves the clasp at the release, and a smaller one just after
  fx(k.pic(ring, E, 100, 100), [[900, { transform: 'scale(.1)', opacity: 0 }, 'ease-out'], [960, { transform: 'scale(.22)', opacity: 0.95 }, 'ease-out'], [1500, { transform: 'scale(.95)', opacity: 0 }]]);
  fx(k.pic(ringGold, E, 100, 100), [[1050, { transform: 'scale(.1)', opacity: 0 }, 'ease-out'], [1110, { transform: 'scale(.2)', opacity: 0.8 }, 'ease-out'], [1600, { transform: 'scale(.65)', opacity: 0 }]]);
  // green light washing over each of them as they grow
  for (const [x, y, w, h] of [[130, 132, 60, 100], [170, 128, 70, 108]]) {
    fx(k.lightIn('g-leaf', [x, y], w, h), [[950, { opacity: 0 }, 'ease-out'], [1300, { opacity: 0.75 }, eio], [1900, { opacity: 0.55 }, eio], [2700, { opacity: 0 }]]);
  }

  // ── leaf-motes drawn in to the clasp while they gather
  for (let i = 0; i < 16; i++) {
    const a = rand() * Math.PI * 2, r = 36 + rand() * 40, sx = E[0] + Math.cos(a) * r * 1.3, sy = E[1] + Math.sin(a) * r * 0.8 - 6, t0 = 150 + i * 42 + rand() * 50;
    const sz = 3 + rand() * 3, src = i % 3 === 0 ? 'gold' : 'mote', pts = k.arc([sx - E[0], sy - E[1]], [(sx - E[0]) * 0.3 + (rand() - 0.5) * 14, (sy - E[1]) * 0.3 - 12], [0, 0], 5);
    fx(k.picIn(src, E, sz, sz), pts.map(([x, y], j) => [Math.round(t0 + 520 * j / 5), { transform: `${k.T(x, y)} scale(${(0.6 + 0.4 * j / 5).toFixed(2)})`, opacity: j === 0 ? 0 : j === 5 ? 0 : 0.95 }, j < 2 ? 'ease-out' : 'ease-in']));
  }

  // ── the stream: leaves spiralling along an arc from the clasp to T (overlay)
  const C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 18];
  const bz = (t) => { const q = 1 - t; return [q * q * E[0] + 2 * q * t * C[0] + t * t * T[0], q * q * E[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const [X0, Y0] = k.P(...E), dist = Math.hypot(T[0] - E[0], T[1] - E[1]);
  const dx = (T[0] - E[0]) / (dist || 1), dy = (T[1] - E[1]) / (dist || 1), nx = -dy, ny = dx;
  for (let i = 0; i < 20; i++) {
    const t0 = 900 + i * 34, trav = 400 + rand() * 60, ph = rand() * 6.28, amp = 5 + rand() * 6, r0 = Math.round(rand() * 360), src = i % 3 === 1 ? leafY : leafG, sz = 9 + rand() * 4;
    const pos = (f) => { const [x, y] = bz(f), w = Math.sin(ph + f * 9) * amp * Math.sin(Math.PI * f); const [px, py] = k.P(x + nx * w, y + ny * w); return [px - X0, py - Y0]; };
    const key = (f, sc, o) => { const [x, y] = pos(f); return [Math.round(t0 + trav * f), { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${r0 + Math.round(f * 320)}deg) scale(${sc})`, opacity: o }, f === 0 ? 'ease-out' : 'linear']; };
    fx(k.pic(src, E, sz * 0.7, sz * 1.05), [key(0, 0.3, 0), key(0.12, 0.8, 0.95), key(0.4, 1, 1), key(0.7, 1.05, 1), key(1, 0.9, 0.95), [t0 + trav + 160, { transform: `${k.T(pos(1)[0] / u, pos(1)[1] / u)} rotate(${r0 + 380}deg) scale(.2)`, opacity: 0 }]]);
    // a mote trailing behind each leaf
    if (i % 2 === 0) fx(k.pic(i % 4 === 0 ? 'gold' : 'mote', E, 4, 4), [0, 0.2, 0.45, 0.75, 1].map((f, j) => { const [x, y] = pos(f); return [Math.round(t0 + 60 + trav * f), { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(1 - f * 0.4).toFixed(2)})`, opacity: j === 0 ? 0 : j === 4 ? 0 : 0.8 }, 'linear']; }));
  }

  // ── sprouts unfurling at their feet as they grow
  for (const [x, y, s, r, g] of [[121, 183, 1, -18, 0], [127, 184, 0.8, 8, 1], [140, 184, 0.9, 20, 0], [160, 183, 0.9, -20, 1], [168, 185, 0.8, 4, 0], [181, 184, 1, 22, 1]]) {
    const t = 1000 + rand() * 260, w = 5 * s, h = 8.5 * s;
    fx(k.picIn(g ? leafY : leafG, [x, y], w, h, { base: true }), [[t, { transform: `rotate(${r}deg) scale(.2, 0)`, opacity: 0 }, 'ease-out'], [t + 250, { transform: `rotate(${r}deg) scale(1.15, 1.2)`, opacity: 1 }, eio], [t + 450, { transform: `rotate(${r}deg) scale(1, 1)`, opacity: 1 }, eio],
      [2400, { transform: `rotate(${r + 4}deg) scale(1.03, 1.05)`, opacity: 1 }, eio], [3200, { transform: `rotate(${r}deg) scale(.3, .1)`, opacity: 0 }]]);
  }
  // motes rising off them while they hold
  for (let i = 0; i < 12; i++) {
    const x = (i < 6 ? dfx : kfx) + (rand() - 0.5) * 26, y = 100 + rand() * 80, t = 1200 + i * 150 + rand() * 80, sz = 2.5 + rand() * 2.5;
    fx(k.picIn(i % 3 ? 'mote' : 'gold', [x, y], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 300, { transform: `${k.T((rand() - 0.5) * 4, -8)} scale(1)`, opacity: 0.9 }, eio], [t + 1100, { transform: `${k.T((rand() - 0.5) * 8, -28)} scale(.5)`, opacity: 0 }]]);
  }

  // ── where it lands (BEATS.impact): a flash, rings, a burst of leaves, gold motes rising
  const IM = 1300;
  fx(k.light('g-warm', T, 46), [[IM - 60, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(1.2)', opacity: 1 }, 'ease-out'], [IM + 400, { transform: 'scale(.95)', opacity: 0.7 }, eio], [IM + 1100, { transform: 'scale(.6)', opacity: 0 }]]);
  fx(k.light('g-leaf', T, 80), [[IM - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 200, { transform: 'scale(1)', opacity: 0.85 }, eio], [IM + 800, { transform: 'scale(1.2)', opacity: 0.6 }, eio], [IM + 1700, { transform: 'scale(1.4)', opacity: 0 }]]);
  fx(k.pic(ring, T, 80, 80), [[IM, { transform: 'scale(.1)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(.25)', opacity: 0.95 }, 'ease-out'], [IM + 700, { transform: 'scale(1)', opacity: 0 }]]);
  fx(k.pic(ringGold, T, 80, 80), [[IM + 160, { transform: 'scale(.1)', opacity: 0 }, 'ease-out'], [IM + 220, { transform: 'scale(.2)', opacity: 0.85 }, 'ease-out'], [IM + 950, { transform: 'scale(.75)', opacity: 0 }]]);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + rand() * 0.4, r = 14 + rand() * 16, t = IM + 20 + rand() * 90, r0 = Math.round(a * 57.3 + 90), src = i % 3 === 1 ? leafY : leafG, sz = 9 + rand() * 4;
    const ex = Math.cos(a) * r, ey = Math.sin(a) * r * 0.8 - 4;
    fx(k.pic(src, T, sz * 0.7, sz * 1.05), [[t, { transform: `rotate(${r0}deg) scale(.3)`, opacity: 0 }, 'ease-out'], [t + 150, { transform: `${k.T(ex * 0.6, ey * 0.6)} rotate(${r0 + 40}deg) scale(1)`, opacity: 1 }, 'ease-out'],
      [t + 700, { transform: `${k.T(ex, ey + 6)} rotate(${r0 + 150}deg) scale(.9)`, opacity: 0.8 }, eio], [t + 1100, { transform: `${k.T(ex * 1.05, ey + 16)} rotate(${r0 + 220}deg) scale(.4)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 14; i++) {
    const t = IM + 120 + i * 80 + rand() * 60, x = T[0] + (rand() - 0.5) * 30, sz = 2.5 + rand() * 3;
    fx(k.pic(i % 3 ? 'gold' : 'mote', [x, T[1] + 6], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 350, { transform: `${k.T((rand() - 0.5) * 6, -12)} scale(1)`, opacity: 1 }, eio], [t + 1300, { transform: `${k.T((rand() - 0.5) * 10, -36)} scale(.4)`, opacity: 0 }]]);
  }
}
