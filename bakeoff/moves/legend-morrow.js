// Morrow, the Bone Gardener: she flings a handful of glowing seed, and where it
// lands the grave puts out lilies and glowing mushrooms.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support, element: nature
// (suggestions kept: her gift is growth, from the graves).
//   0-850     the gather: the mushrooms along the graves brighten and shed motes
//             that drift to her hand; the lantern on her spade swells; her hand
//             dips and closes on the seed, a green-gold glow gathering in it.
//   900       (BEATS.release) her arm flicks up and out and the seed leaves her
//             hand: a spray of glowing grains arcing to T (over her shoulder if T
//             is to her right), each on its own curve, trailing a spark.
//   1400      (BEATS.impact) the first grains land at T: a green flash and a ring
//             on the ground; lilies and glowing mushrooms push up out of it one
//             after another, with overshoot, swaying, motes rising from them.
//   2000-3600 the garden holds and glows, then sinks back; the light fades; her
//             hand comes down.
//   3600      at rest as drawn (the move ends at END).
//
// The contract (bakeoff/recipe.md): the seed goes to T = k.aim || the grave mound
// at her left (alone); every grain's path is a curve from `emit` (her hand) to
// its own place around T. The arm only lifts (it cannot turn to the right), so
// for a T on her right the grains arc up and over her. All that flies and grows
// is on the overlay (k.pic / k.light), since T may be on another card.
export const END = 4200;
export const BEATS = { release: 900, impact: 1400, settle: 3600 };
export const STILLS = [300, 700, 950, 1200, 1500, 1800, 2700, 3900];

export const textures = {
  seed: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226 + 29 * c, 255, 150 + 70 * c * c, Math.min(1, c * c * 2.4)]; }],
  mote: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226, 250, 150, Math.min(1, c * 1.6)]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, H = S.emit, sho = S.shoulder, lamp = S.lamp;
  const T = k.aim || S.alone;
  const over = T[0] > 146; // the target is on her right: the seed goes over her
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const ph = (t, a, b) => sm(cl((t - a) / (b - a), 0, 1));
  const f1 = (v) => +v.toFixed(2);

  k.css(`.g-sprout { border-radius: 50%; background: radial-gradient(closest-side, rgba(244,255,200,.9), rgba(200,240,120,.45) 32%, rgba(150,210,80,.14) 62%, rgba(130,200,60,0) 100%); }
.g-moss { border-radius: 50%; background: radial-gradient(closest-side, rgba(216,240,138,.7), rgba(170,220,90,.26) 45%, rgba(150,210,80,0) 100%); }`);
  const lilyUrl = k.svg(`<defs><linearGradient id="l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf8ff"/><stop offset="1" stop-color="#bdb6d4"/></linearGradient></defs><path d="M8,26C8,20 8.4,14 8,10" fill="none" stroke="#8da07a" stroke-width="1.3" stroke-linecap="round"/><path d="M8,22C4,21 2.5,17 2,14C5,15 7,18 8,22Z" fill="#8da07a"/><path d="M8,11C3.5,10.5 2.5,5 4.6,1.6C6,3.4 7,4.6 8,6.4C9,4.6 10,3.4 11.4,1.6C13.5,5 12.5,10.5 8,11Z" fill="url(#l)" stroke="#e8e2f6" stroke-width=".5"/>`, 16, 26);
  const mushUrl = k.svg(`<defs><radialGradient id="m" cx=".5" cy=".9" r=".9"><stop offset="0" stop-color="#f6ffc8"/><stop offset=".6" stop-color="#cfe880"/><stop offset="1" stop-color="#7a9a3a"/></radialGradient></defs><path d="M5.2,12L5.6,6.4H8.4L8.8,12Z" fill="#dff0a8"/><path d="M1,7C1,3 3.6,1 7,1C10.4,1 13,3 13,7Z" fill="url(#m)"/><circle cx="4.6" cy="4.4" r=".7" fill="#fcffe4"/><circle cx="8.4" cy="3.4" r=".6" fill="#fcffe4"/>`, 14, 13);
  const ringUrl = k.svg(`<ellipse cx="30" cy="12" rx="26" ry="8" fill="none" stroke="#c8ec7c" stroke-width="4" opacity=".3"/><ellipse cx="30" cy="12" rx="26" ry="8" fill="none" stroke="#f2ffc8" stroke-width="1.2"/>`, 60, 24);

  // ── her arm: dips to close on the seed (anticipation), flicks up at the release, a little overshoot, lowers
  const arm = k.part('arm');
  act(arm, [[0, { transform: 'none' }, eio], [350, { transform: 'rotate(-9deg)' }, eio], [830, { transform: 'rotate(-13deg)' }, 'ease-in'], [960, { transform: 'rotate(21deg)' }, 'ease-out'],
    [1150, { transform: 'rotate(16deg)' }, eio], [1500, { transform: 'rotate(18deg)' }, eio], [2300, { transform: 'rotate(11deg)' }, eio], [3300, { transform: 'rotate(-3deg)' }, eio], [3600, { transform: 'none' }]]);
  // the hand's place as it goes (rotation about the shoulder joint), for the glows that follow it
  const handAt = (th) => { const r = (th * Math.PI) / 180, vx = H[0] - sho[0], vy = H[1] - sho[1]; return [sho[0] + vx * Math.cos(r) - vy * Math.sin(r), sho[1] + vx * Math.sin(r) + vy * Math.cos(r)]; };
  const hp = (th) => { const p = handAt(th); return k.T(p[0] - H[0], p[1] - H[1]); };
  // the glow of the seed in her hand, gathering, then let go with it
  fx(k.light('g-sprout', H, 20), [[250, { transform: `${hp(-6)} scale(.3)`, opacity: 0 }, 'ease-out'], [600, { transform: `${hp(-11)} scale(.9)`, opacity: 0.8 }, eio], [840, { transform: `${hp(-13)} scale(1.15)`, opacity: 1 }, 'ease-out'], [960, { transform: `${hp(21)} scale(1.5)`, opacity: 0.9 }, 'ease-out'], [1300, { transform: `${hp(17)} scale(.6)`, opacity: 0 }]]);

  // ── the lantern swells as the garden is called, and stays warm while it grows
  fx(k.light('g-moss', lamp, 54), [[200, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [850, { transform: 'scale(1)', opacity: 0.6 }, eio], [1500, { transform: 'scale(1.15)', opacity: 0.85 }, eio], [2600, { transform: 'scale(1)', opacity: 0.6 }, eio], [3500, { transform: 'scale(.7)', opacity: 0 }]]);

  // ── the mushrooms and graves answer: a green light over each mound, motes drifting to her hand
  for (const [mx, my] of [[48, 182], [100, 190], [220, 184], [250, 190]]) {
    fx(k.light('g-moss', [mx, my], 56, 34), [[150, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [800, { transform: 'scale(1)', opacity: 0.55 }, eio], [1500, { transform: 'scale(1.1)', opacity: 0.4 }, eio], [2800, { transform: 'scale(1)', opacity: 0.2 }, eio], [3500, { transform: 'scale(.8)', opacity: 0 }]]);
  }
  [[48, 184], [96, 190], [222, 186]].forEach(([x, y], d) => {
    for (let i = 0; i < 3; i++) {
      const t = 120 + d * 140 + i * 210, sx = x + (rand() - 0.5) * 16, ex = H[0] + (rand() - 0.5) * 6, ey = H[1] + (rand() - 0.5) * 6;
      const at = (f, s, o) => ({ transform: `${k.T((ex - sx) * f, (ey - y) * f - Math.sin(f * Math.PI) * 18)} scale(${s})`, opacity: o });
      fx(k.pic('mote', [sx, y], 5, 5), [[t, at(0, 0.6, 0), 'ease-in'], [t + 120, at(0.08, 1, 0.9)], [t + 430, at(0.7, 0.85, 0.85), 'ease-in'], [t + 620, at(1, 0.3, 0)]]);
    }
  });

  // ── the seed: a spray of grains leaving her hand (BEATS.release), each on its own curve to its own place round T
  const GN = 16, fl = 470;
  for (let i = 0; i < GN; i++) {
    const t0 = 900 + Math.round(i * 14 + rand() * 40), spread = (i / (GN - 1) - 0.5) * 36 + (rand() - 0.5) * 8;
    const Ti = [T[0] + spread, T[1] + (rand() - 0.5) * 8];
    const lift = over ? 70 + rand() * 24 : 26 + rand() * 20;
    const C = [(H[0] + Ti[0]) / 2 + (rand() - 0.5) * 16, Math.min(H[1], Ti[1]) - lift];
    const bz = (u) => { const q = 1 - u; return [q * q * H[0] + 2 * q * u * C[0] + u * u * Ti[0], q * q * H[1] + 2 * q * u * C[1] + u * u * Ti[1]]; };
    const at = (u, s, o) => { const p = bz(u); return { transform: `${k.T(p[0] - H[0], p[1] - H[1])} scale(${s})`, opacity: o }; };
    const sz = 3 + rand() * 2.2;
    const L = [[t0, at(0, 0.4, 0), 'ease-out']];
    for (let m = 1; m <= 9; m++) { const u = m / 9; L.push([t0 + Math.round(u * fl), at(u, 1 - 0.2 * u, 0.95), 'linear']); }
    L.push([t0 + fl + 110, at(1, 1.5, 0)]);
    fx(k.pic('seed', H, sz, sz), L);
    if (i % 2 === 0) {
      const L2 = [[t0 + 40, at(0, 0.3, 0), 'ease-out']];
      for (let m = 1; m <= 9; m++) { const u = Math.max(0, (m - 1.3) / 9); L2.push([t0 + 40 + Math.round(m / 9 * fl), at(u, 0.8 * (1 - u * 0.5), 0.5), 'linear']); }
      L2.push([t0 + fl + 200, at(1, 0.3, 0)]);
      fx(k.pic('mote', H, sz * 0.9, sz * 0.9), L2);
    }
  }

  // ── where it lands (BEATS.impact): a flash, a ring, then the garden grows, one after another
  const I = 1400;
  fx(k.light('g-sprout', [T[0], T[1] - 4], 70, 54), [[I - 60, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [I + 80, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [I + 500, { transform: 'scale(.9)', opacity: 0.65 }, eio], [2700, { transform: 'scale(1)', opacity: 0.45 }, eio], [3500, { transform: 'scale(1.1)', opacity: 0 }]]);
  fx(k.pic(ringUrl, [T[0], T[1] + 2], 56, 22, { low: true }), [[I, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [I + 100, { transform: 'scale(.55)', opacity: 1 }, 'ease-out'], [I + 800, { transform: 'scale(1.5)', opacity: 0 }]]);
  fx(k.pic(ringUrl, [T[0], T[1] + 2], 36, 14, { low: true }), [[I + 250, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [I + 360, { transform: 'scale(.7)', opacity: 0.8 }, 'ease-out'], [I + 1200, { transform: 'scale(1.6)', opacity: 0 }]]);
  // a grave's worth: lilies and mushrooms at their own spots, each growing on its own beat
  const plants = [[-20, 1, 'lily', 15], [-10, 3, 'mush', 9], [-2, 0, 'lily', 19], [8, 3, 'mush', 11], [16, 1, 'lily', 14], [24, 4, 'mush', 8], [-28, 4, 'mush', 7], [3, 4, 'mush', 7]];
  plants.forEach(([dx, dy, kind, h], i) => {
    const t = I + 120 + i * 105, x = T[0] + dx, y = T[1] + dy + 4, lean = (rand() - 0.5) * 6, w = kind === 'lily' ? h * 0.62 : h * 1.1;
    const src = kind === 'lily' ? lilyUrl : mushUrl, o = kind === 'lily' ? { base: true, lit: false } : { base: true };
    const L = [[t, { transform: 'scale(.15, .05)', opacity: 0 }, 'ease-out'], [t + 160, { transform: `rotate(${f1(lean)}deg) scale(1.12, 1.2)`, opacity: 1 }, 'ease-out'], [t + 300, { transform: `rotate(${f1(lean)}deg) scale(.97, .95)`, opacity: 1 }, eio]];
    for (let s = t + 500, j = 0; s < 3000; s += 260, j++) L.push([s, { transform: `rotate(${f1(lean + (j % 2 ? -2.2 : 2.2))}deg) scale(1, 1)`, opacity: 1 }, eio]);
    L.push([3200, { transform: `rotate(${f1(lean)}deg) scale(1, .85)`, opacity: 0.8 }, 'ease-in'], [3560, { transform: `rotate(${f1(lean)}deg) scale(.5, .1)`, opacity: 0 }]);
    fx(k.pic(src, [x, y], w, h, o), L);
    if (kind === 'mush') fx(k.light('g-moss', [x, y - h * 0.45], 18), [[t + 80, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 330, { transform: 'scale(1.1)', opacity: 0.95 }, eio], [2900, { transform: 'scale(1)', opacity: 0.6 }, eio], [3500, { transform: 'scale(.7)', opacity: 0 }]]);
    // a mote lifting from each
    const mt = t + 260, mxx = rand() * 8 - 4;
    fx(k.pic('mote', [x, y - h * 0.6], 4, 4), [[mt, { transform: `${k.T(0, 0)} scale(.5)`, opacity: 0 }, 'ease-out'], [mt + 250, { transform: `${k.T(mxx * 0.4, -8)} scale(1)`, opacity: 0.9 }], [mt + 1300, { transform: `${k.T(mxx, -30)} scale(.5)`, opacity: 0 }]]);
  });
}
