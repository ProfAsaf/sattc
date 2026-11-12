// The Bright Choir: the singers sing, the hall swells with light (the pool on the floor spreads, the column of song and the
// shafts of dawn widen), and the song's spirit does what the card says: one spirit climbs, splits in two, each of those
// splits in two, and again, doubling at every height, until the eight at the top split once more into sparks that stream
// up past the picture's frame; then the hall grows calm and the spirits are as drawn.
//
// PLAN (drawing units 300 x 210, ms of the move). Role aura (as suggested), element spirit.
//   0-850    the swell (BEATS.release 850): the singers' heads light one after another and motes of song rise from each,
//            arcing to the first spirit; the floor's pool, the column and the shafts widen and glow; the first spirit
//            swells while the rows above it dim away, as if the song were starting again.
//   850-2150 the doubling: at 870, 1320 and 1770 a row's spirits flare and each sends two bright orbs (with a trail)
//            up to its children, 380 ms; where they arrive (1250, 1700, 2150) the next row pops back into the drawing,
//            its trails drawn up behind it. BEATS.impact 2150: the top row, eight spirits, arrives: stars flash.
//   2150-3300 the aftermath: each of the eight sends two sparks of light up and out, past the frame; a wide glow breathes
//            over the hall and fades; the floor, column and shafts settle.
//   after    calm: all parts back where they were by 3700 (END 4300).
// An aura isn't aimed (k.aim and k.blows are ignored).
import { curve } from './_fx.js';
export const END = 4300;
export const BEATS = { release: 850, impact: 2150, settle: 3700 };
export const STILLS = [400, 900, 1200, 1700, 2150, 2500, 3000, 4000];
export const textures = {
  mote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 238 + 17 * c, 190 + 55 * c * c, Math.min(1, c * c * c * 2.4)]; }],
  star: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); const ax = Math.abs(x - 0.5) * 2, ay = Math.abs(y - 0.5) * 2, ray = Math.max(0, 1 - Math.min(ax, ay) * 9) * Math.max(0, 1 - Math.max(ax, ay)); return [255, 244 + 11 * c, 205 + 50 * c * c, Math.min(1, c * c * c * 1.6 + ray * 0.8)]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out';
  const S = k.spec, LV = S.levels;
  const ys = [102, 78, 55, 32];
  const arrive = [0, 1250, 1700, 2150]; // when each row arrives
  const depart = arrive.map((t) => t - 380);

  // ── the pool, the column and the shafts widen with the song
  act(k.part('floor'), [[0, { transform: 'none' }, eio], [450, { transform: 'scale(1.1, 1.25)' }, eio], [1000, { transform: 'scale(1.16, 1.45)' }, eio], [2300, { transform: 'scale(1.12, 1.3)' }, eio], [3700, { transform: 'none' }]]);
  act(k.part('column'), [[0, { transform: 'none' }, eio], [500, { transform: 'scale(1.5, 1.02)' }, eio], [1300, { transform: 'scale(1.9, 1.04)' }, eio], [2300, { transform: 'scale(1.7, 1.03)' }, eio], [3700, { transform: 'none' }]]);
  act(k.part('beams'), [[0, { transform: 'none' }, eio], [700, { transform: 'scale(1.05)' }, eio], [2300, { transform: 'scale(1.03)' }, eio], [3700, { transform: 'none' }]]);
  fx(k.lightIn('g-heal', [150, 172], 250, 46), [[100, { opacity: 0 }, 'ease-out'], [800, { opacity: 0.8 }, eio], [2300, { opacity: 0.7 }, eio], [3600, { opacity: 0 }]]);
  fx(k.lightIn('g-heal', [150, 140], 62, 120), [[200, { opacity: 0 }, 'ease-out'], [900, { opacity: 0.75 }, eio], [2400, { opacity: 0.6 }, eio], [3500, { opacity: 0 }]]);
  fx(k.lightIn('g-heal', [150, 96], 340, 230), [[1900, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [2250, { transform: 'scale(1)', opacity: 0.65 }, eio], [3500, { transform: 'scale(1.2)', opacity: 0 }]]);

  // ── the first spirit swells; the rows above dim away and come back as the doubling reaches them
  act(k.part('glow0'), [[0, { transform: 'none' }, eio], [500, { transform: 'scale(1)' }, 'ease-in'], [880, { transform: 'scale(1.8)' }, 'ease-out'], [1250, { transform: 'scale(1.25)' }, eio], [2150, { transform: 'scale(1.35)' }, eio], [3700, { transform: 'none' }]]);
  fx(k.lightIn('g-heal', [150, 100], 60, 60), [[300, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [880, { transform: 'scale(1.3)', opacity: 0.95 }, eio], [1500, { transform: 'scale(1)', opacity: 0.6 }, eio], [2400, { transform: 'scale(1)', opacity: 0.5 }, eio], [3300, { transform: 'scale(.8)', opacity: 0 }]]);
  for (let L = 1; L <= 3; L++) {
    const t = arrive[L], gone = 520 + L * 90;
    for (const n of [`glow${L}`, `tail${L}`]) {
      act(k.part(n), [[0, { transform: 'none', opacity: 1 }, eio], [gone - 100, { transform: 'none', opacity: 1 }, 'ease-in'], [gone + 120, { transform: 'scale(.6)', opacity: 0 }], [t - 150, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'],
        [t + 130, { transform: n[0] === 'g' ? 'scale(1.18)' : 'scale(1)', opacity: 1 }, eio], [t + 420, { transform: 'scale(1)', opacity: 1 }, eio], ...(t < 2000 ? [] : [[2800, { transform: 'scale(1.1)', opacity: 1 }, eio]]), [3700, { transform: 'none', opacity: 1 }]]);
    }
  }

  // ── the singers: their heads light up one after another, and motes of song rise to the first spirit
  const P = [150, 106];
  S.singers.forEach(([x, y], i) => {
    const t0 = 80 + i * 70;
    fx(k.lightIn('g-heal', [x, y], 34, 34), [[t0, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t0 + 320, { transform: 'scale(1.2)', opacity: 0.95 }, eio], [1900 + i * 40, { transform: 'scale(1)', opacity: 0.7 }, eio], [2800 + i * 40, { transform: 'scale(.8)', opacity: 0 }]]);
    for (let j = 0; j < 3; j++) {
      const s0 = t0 + 200 + j * 190 + rand() * 40, dur = 620 + rand() * 120, c = [(x + P[0]) / 2 + (x < 150 ? -12 : 12), Math.min(y, P[1]) - 22 - rand() * 12], r = 2.4 + rand() * 1.6;
      const pt = (f) => { const q = 1 - f; return [q * q * x + 2 * q * f * c[0] + f * f * P[0], q * q * y + 2 * q * f * c[1] + f * f * P[1]]; };
      fx(k.pic('mote', [x, y], r * 2, r * 2), [0, 0.3, 0.65, 1].map((f, n) => { const p = pt(f * f * 0.35 + f * 0.65); return [s0 + dur * f, { transform: `${k.T(p[0] - x, p[1] - y)} scale(${(n === 3 ? 0.5 : 1).toFixed(2)})`, opacity: n === 0 ? 0 : n === 3 ? 0 : 0.95 }, 'linear']; }));
    }
  });

  // ── the doubling: each spirit flares and sends two orbs up to its children
  for (let L = 1; L <= 3; L++) {
    const t = arrive[L], d0 = depart[L];
    LV[L].forEach(([cx, cy], i) => {
      const [px, py] = LV[L - 1][i >> 1], side = i % 2 ? 1 : -1;
      const ctrl = [(px + cx) / 2 + side * 6, Math.min(py, cy) - 7];
      const bz = (f) => { const q = 1 - f; return [q * q * px + 2 * q * f * ctrl[0] + f * f * cx, q * q * py + 2 * q * f * ctrl[1] + f * f * cy]; };
      const mk = (lag, size, o) => [0, 0.25, 0.5, 0.75, 1].map((f, n) => {
        const p = bz(k.smooth(Math.min(1, Math.max(0, f))));
        return [d0 + 380 * f + lag, { transform: `${k.T(p[0] - px, p[1] - py)} scale(${(n === 4 ? 0.8 : 1 + 0.3 * Math.sin(f * 3.14)).toFixed(2)})`, opacity: n === 0 ? 0 : n === 4 ? 0 : o }, 'linear'];
      });
      fx(k.pic('mote', [px, py], 11 - L, 11 - L), mk(0, 0, 1));
      fx(k.pic('mote', [px, py], (11 - L) * 1.7, (11 - L) * 1.7), mk(55, 0, 0.55));
      // where it arrives: a pop, and (the top row) a star
      fx(k.pic('mote', [cx, cy - 2], 20 - 2 * L, 20 - 2 * L), [[t - 70, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 10, { transform: 'scale(1.2)', opacity: 1 }, 'ease-out'], [t + 330, { transform: 'scale(1.6)', opacity: 0 }]]);
      if (L === 3) fx(k.pic('star', [cx, cy - 2], 20, 20), [[t - 40, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [t + 50, { transform: 'scale(1.2) rotate(30deg)', opacity: 1 }, 'ease-out'], [t + 360, { transform: 'scale(.5) rotate(70deg)', opacity: 0 }]]);
    });
    // the parents flare as they split
    LV[L - 1].forEach(([px, py]) => fx(k.lightIn('g-heal', [px, py - 2], 30 - 3 * L, 30 - 3 * L), [[d0 - 120, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [d0 + 60, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [d0 + 520, { transform: 'scale(1)', opacity: 0 }]]));
  }

  // ── the aftermath: the eight send sparks up and out past the frame
  LV[3].forEach(([x, y], i) => {
    for (let j = 0; j < 2; j++) {
      const side = j ? 1 : -1, t0 = 2200 + i * 40 + j * 70, dur = Math.min(1000 + rand() * 350, 4250 - t0), dx = side * (14 + rand() * 24) + (x - 150) * 0.12, dy = -(50 + rand() * 50), size = 4.4 + rand() * 2.4;
      const kf = [0, 0.25, 0.6, 1].map((f, n) => [t0 + dur * f, { transform: `${k.T(dx * f + Math.sin(f * 7 + i) * 3, dy * f * (1.1 - 0.2 * f))} scale(${(n === 3 ? 0.4 : 1).toFixed(2)})`, opacity: n === 0 ? 0 : n === 3 ? 0 : 1 }, n ? 'linear' : 'ease-out']);
      fx(k.pic('mote', [x, y - 2], size, size), kf);
    }
  });
  // and a few soft motes drifting down through the light as it calms
  for (let i = 0; i < 6; i++) {
    const x = 70 + rand() * 160, y = 40 + rand() * 40, t = 2500 + i * 170;
    fx(k.pic('mote', [x, y], 3.4, 3.4), [[t, { transform: `${k.T(0, 0)} scale(.5)`, opacity: 0 }, 'ease-out'], [t + 300, { transform: `${k.T((rand() - 0.5) * 8, 8)} scale(1)`, opacity: 0.9 }, 'linear'], [Math.min(t + 1200, 4250), { transform: `${k.T((rand() - 0.5) * 14, 42)} scale(.7)`, opacity: 0 }]]);
  }
}
