// Rolling Fog: the bank rolls in off the sea and swallows the army, and the two in front stand clear.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: aura (a Field: the place itself acts; it isn't aimed),
// element: water (the suggestion was shadow: it is sea fog, mist off the water).
//   0-800     the swell. The light drops; the first wisps slide in from the right over the hilltop. The two in
//             front tense: the spearman's spear leans in and his shield comes up, the swordsman draws his blade up.
//   800-1800  the bank rolls in: three tiers of mist (high over the sun, mid over the ranks, low round the feet)
//             pour across from the right, thicker toward the right, thinner round the two warriors, who stay clear.
//             The ranks go under it, and spear tips of the army nobody can see ghost up through it.
//   1800      PEAK (BEATS.impact): the bank is thickest; a pale pulse of fog-light washes the picture, the sun is gone,
//             a glint runs over the shield and the blade (the rule: no more than two can fight: only the two show).
//   1800-3700 the fog lifts: it thins and rises, drifting on to the left and away; the tips sink back into the
//             ranks; the warriors ease down, a small overshoot, and are at rest (BEATS.settle 3700); END 4200.
//
// The contract (bakeoff/recipe.md): an aura, so it isn't aimed: it spreads over its picture and past its frame (the
// fog enters at the right edge and leaves at the left). `hit` is the middle of the picture.
export const END = 4200;
export const BEATS = { release: 800, impact: 1800, settle: 3700 };
export const STILLS = [300, 800, 1200, 1600, 1900, 2500, 3200, 3900];

const soft = (x, y) => Math.hypot(x - 0.5, y - 0.5) * 2;
export const textures = {
  mist: [64, 64, (x, y) => {
    const r = Math.hypot((x - 0.5) * 1.05, (y - 0.5) * 1.15) * 2;
    const n = 0.82 + 0.18 * Math.sin(x * 17 + y * 7) * Math.cos(y * 13 - x * 9);
    return [228, 242, 238, Math.pow(Math.max(0, 1 - r), 1.15) * n];
  }],
  wisp: [32, 32, (x, y) => { const c = Math.max(0, 1 - soft(x, y)); return [236, 248, 244, Math.min(1, c * 1.4)]; }],
  drop: [8, 8, (x, y) => { const c = Math.max(0, 1 - soft(x, y)); return [214, 236, 240, Math.min(1, c * 2)]; }],
};

export function build(k) {
  const { act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const fx = (el, list) => { let last = -1; k.fx(el, list.slice().sort((a, b) => a[0] - b[0]).map((e) => { last = Math.max(last + 1, Math.min(e[0], k.END - 1)); return [last, ...e.slice(1)]; })); };
  k.css(`.g-fogl { border-radius: 50%; background: radial-gradient(closest-side, rgba(226,242,238,.75), rgba(200,226,224,.4) 40%, rgba(180,214,214,.14) 70%, rgba(170,210,212,0) 100%); }
.fx-glint { filter: brightness(2.6) saturate(.5); }`);

  // ── the two in front: the spear leans in, the shield rises, the blade comes up; held while the fog is thick;
  //    then they ease down with a little overshoot
  act(k.part('spear'), [[0, { transform: 'rotate(0deg)' }, eio], [450, { transform: 'rotate(-1.5deg)' }, 'ease-out'], [950, { transform: 'rotate(5deg)' }, eio], [1800, { transform: 'rotate(4deg)' }, eio],
    [2500, { transform: 'rotate(5.5deg)' }, eio], [3350, { transform: 'rotate(-1.2deg)' }, eio], [3700, { transform: 'rotate(0deg)' }]]);
  const shieldPose = (dy, r, s) => ({ transform: `${k.T(0, dy)} rotate(${r}deg) scale(${s})` });
  const shieldKeys = [[0, shieldPose(0, 0, 1), eio], [450, shieldPose(0.8, 1.5, 1), 'ease-out'], [950, shieldPose(-2.2, -4, 1.05), eio], [1800, shieldPose(-2, -3, 1.04), eio], [2500, shieldPose(-2.4, -4.5, 1.05), eio],
    [3350, shieldPose(0.5, 1, 1), eio], [3700, shieldPose(0, 0, 1)]];
  act(k.part('shield'), shieldKeys);
  act(k.part('sword'), [[0, { transform: 'rotate(0deg)' }, eio], [400, { transform: 'rotate(-4deg)' }, 'ease-out'], [900, { transform: 'rotate(16deg)' }, eio], [1800, { transform: 'rotate(13deg)' }, eio],
    [2500, { transform: 'rotate(15deg)' }, eio], [3350, { transform: 'rotate(-2.5deg)' }, eio], [3700, { transform: 'rotate(0deg)' }]]);
  // a glint along the shield and blade at the peak
  const glintS = k.copy('shield', 'fx-glint'), glintB = k.copy('sword', 'fx-glint');
  const sp5 = (op) => [[0, shieldPose(0, 0, 1), 0], [900, shieldPose(-2.2, -4, 1.05), 0.1], [1800, shieldPose(-2, -3, 1.04), op], [2500, shieldPose(-2.4, -4.5, 1.05), 0.1], [3350, shieldPose(0.5, 1, 1), 0], [3700, shieldPose(0, 0, 1), 0]];
  act(glintS, sp5(0.85).map(([t, p, o]) => [t, { ...p, opacity: o }, 'linear']));
  act(glintB, [[0, { transform: 'rotate(0deg)', opacity: 0 }, 'linear'], [900, { transform: 'rotate(16deg)', opacity: 0.15 }, 'linear'], [1800, { transform: 'rotate(13deg)', opacity: 0.9 }, 'linear'], [2500, { transform: 'rotate(15deg)', opacity: 0.1 }, 'linear'],
    [3350, { transform: 'rotate(-2.5deg)', opacity: 0 }, 'linear'], [3700, { transform: 'rotate(0deg)', opacity: 0 }]]);

  // ── the light: it drops under the bank (a pale pulse over everything at the peak), the sun smothered
  fx(k.lightIn('g-fogl', [150, 105], 380, 230), [[300, { opacity: 0 }, 'ease-out'], [1200, { opacity: 0.25 }, eio], [1800, { opacity: 0.5 }, eio], [2600, { opacity: 0.25 }, eio], [3500, { opacity: 0 }]]);
  fx(k.lightIn('g-fogl', [210, 46], 110, 110), [[500, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [1500, { transform: 'scale(1.2)', opacity: 0.95 }, eio], [2500, { transform: 'scale(1.3)', opacity: 0.9 }, eio], [3500, { transform: 'scale(1.5)', opacity: 0 }]]);

  // ── the bank: puffs of mist pour in from the right, in three tiers, thinner round the two in front
  //    (they enter past the right edge, run on past the left; each rises and thins as the bank lifts)
  const puff = (tex, y, x0, x1, t0, life, w, h, o, rise) => {
    const dx = x1 - x0, r = Math.round((rand() - 0.5) * 40);
    // thin it where it passes the two in front (x about 85-205, below the hat line)
    const nearThem = (xm, ym) => xm > 80 && xm < 215 && ym > 96;
    const half = nearThem((x0 + x1) / 2, y) ? 0.38 : 1;
    const at = (f, s, op, lift) => ({ transform: `${k.T(dx * f, -lift)} rotate(${r + Math.round(f * 20)}deg) scale(${s.toFixed(2)})`, opacity: +(op * half).toFixed(2) });
    fx(k.picIn(tex, [x0, y], w, h, { lit: false }), [[t0, at(0, 0.7, 0, 0), 'ease-out'], [t0 + life * 0.22, at(0.3, 0.95, o, 0), 'linear'], [t0 + life * 0.62, at(0.66, 1.15, o * 0.95, rise * 0.4), 'linear'], [t0 + life, at(1, 1.35, 0, rise)]]);
  };
  // high tier, over the sun and the far hill
  for (let i = 0; i < 8; i++) puff('mist', 22 + rand() * 50, 330 + rand() * 40, 60 + rand() * 120, 500 + i * 130, 2500, 90 + rand() * 30, 46 + rand() * 12, 0.85, 14);
  // mid tier, over the ranks
  for (let i = 0; i < 22; i++) puff('mist', 84 + rand() * 62, 335 + rand() * 50, -30 + rand() * 120, 560 + i * 70, 2300 + rand() * 300, 90 + rand() * 40, 52 + rand() * 16, 0.92, 18);
  // low tier, round their feet and over the near ground
  for (let i = 0; i < 10; i++) puff('mist', 164 + rand() * 38, 330 + rand() * 40, 20 + rand() * 140, 900 + i * 130, 2400, 70 + rand() * 26, 28 + rand() * 10, 0.6, 8);
  // wisps tearing off the bank's top as it runs
  for (let i = 0; i < 10; i++) puff('wisp', 40 + rand() * 120, 320 + rand() * 40, 60 + rand() * 120, 800 + i * 160, 1400, 24 + rand() * 18, 14 + rand() * 8, 0.8, 22);

  // ── the army under it: spear tips of ranks nobody can see, ghosting up through the fog at the peak
  const spear = k.svg('<path d="M4 8L4 70" stroke="#4e6a70" stroke-width="1.1" opacity=".75"/><path d="M4 0Q7 4 4 10Q1 4 4 0Z" fill="#587a80" opacity=".85"/><path d="M4 18L11 20L4 24Z" fill="#6e8e92" opacity=".7"/>', 12, 72);
  const spearP = k.svg('<path d="M4 8L4 70" stroke="#4e6a70" stroke-width="1.1" opacity=".75"/><path d="M4 0Q7 4 4 10Q1 4 4 0Z" fill="#587a80" opacity=".85"/>', 8, 72);
  for (let i = 0; i < 14; i++) {
    const x = 14 + i * 20 + (rand() - 0.5) * 12, b = 112 + rand() * 40, t0 = 1100 + rand() * 700, h = 28 + rand() * 16;
    if (x > 78 && x < 150 && b > 120) continue; // (not through the spearman)
    const sink = 10 + rand() * 6, dxm = -(8 + rand() * 10);
    fx(k.picIn(i % 3 ? spearP : spear, [x, b - h * 0.5], 7, h, { lit: false }), [[t0, { transform: `${k.T(0, sink)}`, opacity: 0 }, 'ease-out'], [t0 + 500, { transform: `${k.T(dxm * 0.3, 0)}`, opacity: 0.8 }, eio],
      [2300 + rand() * 300, { transform: `${k.T(dxm * 0.7, -1)}`, opacity: 0.8 }, eio], [3300 + rand() * 200, { transform: `${k.T(dxm, sink)}`, opacity: 0 }]]);
  }

  // ── the sea's drops: fine spray off the bank, riding the wind past the two in front
  for (let i = 0; i < 14; i++) {
    const x = 200 + rand() * 120, y = 70 + rand() * 110, t0 = 900 + rand() * 1500, dx = -(60 + rand() * 90), dy = -(3 + rand() * 12), s = 1.4 + rand() * 1.6;
    fx(k.picIn('drop', [x, y], s, s, { lit: false }), [[t0, { transform: `${k.T(0, 0)}`, opacity: 0 }, 'ease-out'], [t0 + 120, { transform: `${k.T(dx * 0.12, dy * 0.12)}`, opacity: 0.8 }, 'linear'], [t0 + 900, { transform: `${k.T(dx, dy)}`, opacity: 0 }]]);
  }
}
