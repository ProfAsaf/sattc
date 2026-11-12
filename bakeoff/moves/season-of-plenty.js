// Season of Plenty (a Relic, an aura: the orchard itself acts; role aura, element nature: as suggested). Whatever has
// been strengthened keeps growing: the young tree in the middle swells, its crown of leaves blazing, and a wave of
// golden-green light runs out from it across the orchard, row on row, so that every tree it reaches pulses and the fruit
// on the two old trees ripens in a glint as it passes; then the light drifts up past the frame and all is calm.
//
// PLAN (drawing units 300 x 210, ms of the move). Auras are not aimed: the place itself acts.
//   0-900    the swell (BEATS.release 900): the sun draws breath and widens, its shafts fan out; the young tree crouches a
//            little (anticipation) while motes of light stream in to its crown from the whole orchard; its glow builds.
//   900-1800 the growth: the tree shoots up and thickens (overshooting), the crown flares; a ring of light is born at its
//            foot and runs out over the grass.
//   1800     BEATS.impact: the ring reaches the old trees: their fruit swells and glints, the boughs sway, the far rows
//            light one after another; new leaves and seeds of light go up from the crown past the frame.
//   2400-3700 aftermath: the tree eases back to its drawn height, leaves and glints drift down, the wash fades; at rest by
//            3700 (BEATS.settle; END 4200).
import { kit } from './_fx.js';
export const END = 4200;
export const BEATS = { release: 900, impact: 1800, settle: 3700 };
export const STILLS = [350, 800, 1300, 1700, 1950, 2400, 3000, 3900];
export const textures = {
  glint: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 252, 200 + 40 * c, Math.min(1, c * c * 2.6)]; }],
  star: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); const ax = Math.abs(x - 0.5) * 2, ay = Math.abs(y - 0.5) * 2, ray = Math.max(0, 1 - Math.min(ax, ay) * 9) * Math.max(0, 1 - Math.max(ax, ay)); return [255, 250, 205 + 40 * c, Math.min(1, c * c * c * 1.6 + ray * 0.85)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const S = k.spec, E = S.emit, F = S.foot;
  const sun = k.part('sun'), shafts = k.part('shafts'), young = k.part('young'), crown = k.part('crown'), fruit = k.part('fruit');
  k.css('.g-grow { border-radius: 50%; background: radial-gradient(circle, rgba(252,255,216,.95), rgba(222,246,128,.55) 32%, rgba(190,226,90,.16) 58%, rgba(170,210,70,0) 72%); }');
  k.css('.g-sunw { border-radius: 50%; background: radial-gradient(circle, rgba(255,244,190,.8), rgba(255,226,140,.35) 42%, rgba(255,214,110,0) 70%); }');
  const flat = k.svg('<defs><filter id="b" x="-5%" y="-40%" width="110%" height="180%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><ellipse cx="125" cy="28" rx="120" ry="25.2" fill="none" stroke="#f0ff9c" stroke-width="5" filter="url(#b)" opacity=".8"/><ellipse cx="125" cy="28" rx="120" ry="25.2" fill="none" stroke="#fdffe0" stroke-width="1.8"/>', 250, 56);
  const leaf = k.svg('<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbffd8"/><stop offset="1" stop-color="#cfe97a"/></linearGradient></defs><path d="M2,10C4,3 12,1 18,2C17,9 11,15 2,10Z" fill="url(#g)"/><path d="M3,10C8,8 12,5 17,3" fill="none" stroke="#9db84a" stroke-width=".7"/>', 20, 14);

  // ── the sun draws breath and widens, its shafts fan out and settle; a warm wash behind the tree's light
  act(sun, [[0, { transform: 'none' }, eio], [700, { transform: 'scale(1.03)' }, eio], [1500, { transform: 'scale(1.13)' }, eio], [2500, { transform: 'scale(1.07)' }, eio], [3700, { transform: 'none' }]]);
  act(shafts, [[0, { transform: 'none' }, eio], [900, { transform: 'scale(1.08, 1.06) rotate(-1.2deg)' }, eio], [1900, { transform: 'scale(1.16, 1.1) rotate(1.4deg)' }, eio], [2800, { transform: 'scale(1.06) rotate(.4deg)' }, eio], [3700, { transform: 'none' }]]);
  fx(k.lightIn('g-sunw', [150, 84], 210, 120), [[200, { transform: 'scale(.7)', opacity: 0 }, 'ease-out'], [1500, { transform: 'scale(1)', opacity: 0.8 }, eio], [2500, { transform: 'scale(1.05)', opacity: 0.55 }, eio], [3500, { transform: 'scale(1.1)', opacity: 0 }]]);

  // ── the young tree: crouches (anticipation), shoots up and thickens past its height, eases back; the crown rides it
  const grow = [[0, { transform: 'none' }, eio], [450, { transform: 'scale(1.015, .97)' }, 'ease-in'], [900, { transform: 'scale(1.02, .955)' }, 'ease-out'], [1350, { transform: 'scale(1.1, 1.2)' }, 'ease-in-out'],
    [1700, { transform: 'scale(1.15, 1.26)' }, eio], [2100, { transform: 'scale(1.11, 1.21)' }, eio], [2900, { transform: 'scale(1.07, 1.13)' }, eio], [3700, { transform: 'none' }]];
  act(young, grow);
  act(crown, grow);
  // its glow: builds with the swell, blazes at the growth, eases
  fx(k.lightIn('g-grow', [E[0], E[1] + 6], 120, 120), [[150, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(.9)', opacity: 0.75 }, eio], [1350, { transform: 'scale(1.25)', opacity: 1 }, 'ease-out'], [1900, { transform: 'scale(1.5)', opacity: 0.9 }, eio], [2600, { transform: 'scale(1.35)', opacity: 0.45 }, eio], [3500, { transform: 'scale(1.2)', opacity: 0 }]]);
  fx(k.lightIn('g-grow', [F[0], F[1] - 4], 90, 30), [[600, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1300, { transform: 'scale(1.1)', opacity: 0.9 }, eio], [2400, { transform: 'scale(1.5)', opacity: 0.5 }, eio], [3400, { transform: 'scale(1.7)', opacity: 0 }]]);

  // ── motes streaming in to the crown from all over the orchard (0-1100), as the tree gathers its strength
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * 6.283 + rand() * 0.4, d = 55 + rand() * 55, t = 80 + i * 55, x0 = Math.cos(a) * d, y0 = Math.sin(a) * d * 0.55 + 20, sz = 4 + rand() * 3;
    fx(k.picIn('glint', E, sz, sz), [[t, { transform: `${k.T(x0, y0)} scale(.5)`, opacity: 0 }, 'ease-in'], [t + 280, { transform: `${k.T(x0 * 0.55, y0 * 0.55)} scale(1)`, opacity: 0.95 }, 'ease-in'], [t + 620, { transform: `${k.T(0, 4)} scale(.4)`, opacity: 0 }]]);
  }

  // ── the growth wave: rings of light run out over the grass from the foot, the second a beat behind
  for (const [t0, s1, o] of [[1250, 2.1, 0.95], [1450, 1.7, 0.7]]) {
    fx(k.picIn(flat, [F[0], F[1] - 22], 250, 56), [[t0, { transform: 'scale(.08)', opacity: 0 }, 'ease-out'], [t0 + 90, { transform: 'scale(.2)', opacity: o }, 'ease-out'], [t0 + 650, { transform: `scale(${s1})`, opacity: 0 }]]);
  }
  fx(k.picIn(flat, [F[0], 118], 250, 56), [[1450, { transform: 'scale(.1)', opacity: 0 }, 'ease-out'], [1550, { transform: 'scale(.3)', opacity: 0.55 }, 'ease-out'], [2300, { transform: 'scale(1.9)', opacity: 0 }]]);
  // the far rows light up one after another as the wave passes (a soft pulse where each tree stands)
  for (let i = 0; i < 12; i++) {
    const side = i % 2 ? 1 : -1, d = 14 + Math.floor(i / 2) * 22 + rand() * 6, x = F[0] + side * d, y = 108 + rand() * 24, t = 1500 + (d / 130) * 500;
    fx(k.picIn('glint', [x, y], 18, 18), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 160, { transform: 'scale(1.1)', opacity: 0.85 }, 'ease-out'], [t + 620, { transform: 'scale(1.5)', opacity: 0 }]]);
  }

  // ── the fruit ripens as the wave reaches the old trees (1800): swells and rocks, glints at each bunch
  act(fruit, [[0, { transform: 'none' }, eio], [1750, { transform: 'none' }, 'ease-out'], [1900, { transform: 'scale(1.035) rotate(-.7deg)' }, eio], [2150, { transform: 'scale(1.015) rotate(.6deg)' }, eio], [2450, { transform: 'scale(1.02) rotate(-.3deg)' }, eio], [2900, { transform: 'none' }]]);
  const left = [[27, 57], [86, 23], [95, 28], [71, 33], [50, 42], [52, 64], [60, 69], [69, 66], [80, 73], [87, 77], [94, 89], [104, 95], [106, 108], [69, 122], [74, 133], [42, 108]];
  left.forEach(([x, y], i) => {
    for (const side of [-1, 1]) {
      const px = side < 0 ? x : 306 - x, t = 1780 + (i % 5) * 70 + (side > 0 ? 40 : 0) + rand() * 40;
      fx(k.picIn('star', [px, y], 11, 11), [[t, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [t + 150, { transform: 'scale(1.1) rotate(25deg)', opacity: 1 }, 'ease-out'], [t + 600, { transform: 'scale(.4) rotate(70deg)', opacity: 0 }]]);
    }
  });

  // ── at the peak new leaves and seeds of light go up from the crown past the frame (overlay), some drift back down
  for (let i = 0; i < 12; i++) {
    const t = 1500 + i * 70 + rand() * 40, dx = (rand() - 0.5) * 90, up = 70 + rand() * 50, r = Math.round(rand() * 360), sz = 8 + rand() * 4;
    fx(k.pic(leaf, [E[0] + (rand() - 0.5) * 24, E[1] - 12], sz, sz * 0.7), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 300, { transform: `${k.T(dx * 0.35, -up * 0.55)} rotate(${r + 60}deg) scale(1)`, opacity: 0.95 }, 'ease-out'],
      [t + 1300, { transform: `${k.T(dx, -up)} rotate(${r + 160}deg) scale(.8)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 14; i++) {
    const t = 1550 + i * 60 + rand() * 50, dx = (rand() - 0.5) * 120, up = 50 + rand() * 60, sz = 4 + rand() * 3;
    fx(k.pic('glint', [E[0] + (rand() - 0.5) * 30, E[1]], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 200, { transform: `${k.T(dx * 0.3, -up * 0.5)} scale(1)`, opacity: 1 }, 'ease-out'], [t + 1100, { transform: `${k.T(dx, -up)} scale(.5)`, opacity: 0 }]]);
  }
  // a few leaves drifting down through the light as it calms
  for (let i = 0; i < 6; i++) {
    const t = 2300 + i * 150, x = 118 + rand() * 64, r = Math.round(rand() * 360);
    fx(k.picIn(leaf, [x, 100], 9, 6.3), [[t, { transform: `rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 300, { transform: `${k.T(-5, 12)} rotate(${r + 70}deg) scale(1)`, opacity: 0.85 }, eio], [t + 1100, { transform: `${k.T(6, 62)} rotate(${r + 190}deg) scale(1)`, opacity: 0 }]]);
  }
}
