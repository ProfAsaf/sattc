// The Drowned Clock: the place itself acts. Three times the sunken clock chimes: the bell
// swings in the belfry, the whole tower shudders, the face flares and the minute hand
// jumps a third of the way round, and rings of light spread out from the belfry across
// the sky and from its foot over the sea, spilling past the picture's frame, sparks
// shaken off the bell and drifting up. Each chime is bigger; the third (the count
// complete) is the peak: a flash from the face and a shock of rings that sweep the
// whole card. Then the hands come round to where they were, the rings die away and the
// sea calms.
//
// PLAN (drawing units 300 x 210, ms of the move). Role aura (as suggested: the place acts),
// element water (the sea and its rings; the light is the clock's).
//   500   chime 1:  bell swings, tower shudders, face flares, hand ticks, two rings out.
//   1300  chime 2 (BEATS.release: the swell, bigger): the same, a little more.
//   2100  chime 3 (BEATS.impact: the peak, the count complete): a flash, a shock of rings
//         over sky and sea, glints running across the water, a wide wash of light.
//   2100-3600 the bell stills, the hands settle (the minute hand has turned a full round),
//         the light and the rings fade; bubbles rise. At rest as drawn from 3600.
// Auras aren't aimed (k.aim is ignored): the move spreads over its picture and past its frame.
import { mul, rot, scl, curve, kit } from './_fx.js';
export const END = 4200;
export const BEATS = { release: 1300, impact: 2100, settle: 3600 };
export const STILLS = [250, 560, 800, 1400, 2150, 2400, 3000, 4000];
export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 238 + 17 * c, 180 + 60 * c * c, Math.min(1, c * c * 2.6)]; }],
  glint: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 248, 214 + 30 * c, Math.min(1, c * c * 2.6)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const S = k.spec, BL = S.bell, FC = S.face, BASE = S.base;
  const part = (n) => k.part(n);
  const CH = [[500, 1], [1300, 1.25], [2100, 1.8]]; // the three chimes: [ms, how big]
  const BACK = BEATS.settle, End = BACK + 200;
  k.css('.g-clock { border-radius: 50%; background: radial-gradient(circle, rgba(255,248,216,.95), rgba(246,228,164,.5) 32%, rgba(240,212,140,.16) 60%, rgba(240,210,140,0) 74%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.7"/></filter></defs><circle cx="50" cy="50" r="42" fill="none" stroke="#f6ecc4" stroke-width="5" filter="url(#b)"/><circle cx="50" cy="50" r="42" fill="none" stroke="#fffbe8" stroke-width="1.4"/>', 100, 100);
  const bub = k.svg('<circle cx="20" cy="20" r="15" fill="rgba(180,240,244,.12)" stroke="#e8fffd" stroke-width="2.4"/><path d="M10,16A11,11 0 0 1 17,9" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>', 40, 40);

  // after-chime decay: sum over the chimes already struck of (how big) x e^-(t - chime)/tau
  const ring_ = (t, tau, lead = 0) => CH.reduce((a, [c, A]) => a + (t >= c - lead ? A * Math.exp(-(t - c + lead) / tau) : 0), 0);
  // ── the tower shudders at each chime (rotating about its foot, with a little squash)
  const Wt = (t) => {
    const shake = CH.reduce((a, [c, A]) => a + (t >= c ? A * 0.42 * Math.exp(-(t - c) / 230) * Math.sin((t - c) / 52) : 0), 0);
    const p = ring_(t, 170) * 0.011;
    return mul(rot(shake, 148, 150), scl(1 + p * 0.5, 1 - p, 148, 150));
  };
  h.drive(part('tower'), [148, 150], Wt, End, 25);
  // ── the bell swings in the belfry about the top of its hanger
  const bell = [[0, 0]];
  CH.forEach(([c, A]) => bell.push([c - 110, -12 * A], [c, 15 * A], [c + 120, -11 * A], [c + 240, 7.5 * A], [c + 360, -4.5 * A], [c + 480, 2.2 * A], [c + 620, 0]));
  bell.push([End, 0]);
  const B = curve(bell.map(([t, v]) => [t, v, 'io']));
  h.drive(part('bell'), [140.8, 44.4], (t) => mul(Wt(t), rot(B(t), 140.8, 44.4)), End, 25);
  // ── the face flares; the minute hand ticks a third round at each chime (a full round by the third)
  const hand = [[0, 0]];
  CH.forEach(([c], i) => hand.push([c + 20, i * 120], [c + 90, i * 120 - 5], [c + 230, i * 120 + 127], [c + 350, i * 120 + 118], [c + 450, i * 120 + 120]));
  hand.push([End, 360]);
  const Hd = curve(hand.map(([t, v]) => [t, v, 'io']));
  const Wface = (t) => { const f = 1 + ring_(t, 240) * 0.026; return mul(Wt(t), scl(f, f, FC[0], FC[1])); };
  h.drive(part('face'), FC, Wface, End, 25);
  h.drive(part('hour'), FC, Wface, End, 25);
  h.drive(part('minute'), FC, (t) => mul(Wface(t), rot(Hd(t), FC[0], FC[1])), End, 25);
  // ── the rings in the sky breathe out; the rings and the reflection on the sea ride the chimes too
  h.drive(part('rings'), [141.3, 50.4], (t) => { const s = 1 + ring_(t, 320) * 0.028; return scl(s, s, 141.3, 50.4); }, End, 40);
  h.drive(part('ripples'), [149, 142], (t) => { const s = 1 + ring_(t, 340) * 0.03; return scl(s, 1 + (s - 1) * 0.6, 149, 142); }, End, 40);
  h.drive(part('reflect'), [146, 146], (t) => scl(1 + ring_(t, 300) * 0.16, 1, 146, 146), End, 40);

  // ── echoes: the sky's rings and the sea's ripples run outward from their drawn places
  CH.forEach(([c, A], i) => {
    const er = k.copy('rings', ''), ew = k.copy('ripples', ''), big = i === 2;
    act(er, [[c, { transform: 'scale(.72)', opacity: 0 }, 'ease-out'], [c + 80, { transform: 'scale(.8)', opacity: 0.85 }, 'ease-out'], [c + (big ? 1300 : 1000), { transform: `scale(${(1.5 + 0.15 * A).toFixed(2)})`, opacity: 0 }]]);
    act(ew, [[c + 40, { transform: 'scale(.7)', opacity: 0 }, 'ease-out'], [c + 150, { transform: 'scale(.82)', opacity: 0.8 }, 'ease-out'], [c + (big ? 1400 : 1100), { transform: `scale(${(1.45 + 0.15 * A).toFixed(2)})`, opacity: 0 }]]);
    // the face's own halo, thrown out
    const ef = k.copy('face', '');
    act(ef, [[c, { transform: 'scale(1)', opacity: 0 }, 'ease-out'], [c + 40, { transform: 'scale(1.04)', opacity: 0.55 }, 'ease-out'], [c + 600, { transform: `scale(${(1.25 + 0.08 * A).toFixed(2)})`, opacity: 0 }]]);
  });

  // ── light: the face's glow flares at each chime, a wash over the sea and sky, a flash at the peak
  const fl = [[200, { transform: 'scale(.8)', opacity: 0 }, 'ease-out']];
  CH.forEach(([c, A], i) => fl.push([c - 40, { transform: 'scale(.95)', opacity: 0.3 + i * 0.05 }, 'ease-out'], [c + 60, { transform: `scale(${(1.1 + 0.12 * A).toFixed(2)})`, opacity: Math.min(0.85, 0.5 + 0.15 * A) }, 'ease-out'], [c + 520, { transform: 'scale(1.05)', opacity: 0.4 + i * 0.1 }, eio]));
  fl.push([2900, { transform: 'scale(1)', opacity: 0.35 }, eio], [BACK, { transform: 'scale(.85)', opacity: 0 }]);
  fx(k.light('g-clock', FC, 62), fl);
  fx(k.light('g-clock', BL, 36), [[CH[0][0] - 60, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [CH[0][0] + 50, { transform: 'scale(1.3)', opacity: 0.8 }, eio], [CH[1][0] + 50, { transform: 'scale(1.5)', opacity: 0.9 }, eio], [CH[2][0] + 50, { transform: 'scale(1.9)', opacity: 1 }, eio], [2900, { transform: 'scale(1)', opacity: 0.2 }, eio], [BACK, { transform: 'scale(.7)', opacity: 0 }]]);
  fx(k.lightIn('g-clock', [150, 110], 360, 230, { under: true }), [[300, { opacity: 0 }, 'ease-out'], [700, { opacity: 0.22 }, eio], [1500, { opacity: 0.3 }, eio], [CH[2][0] + 60, { opacity: 0.55 }, 'ease-out'], [2900, { opacity: 0.2 }, eio], [BACK, { opacity: 0 }]]);
  const peak = CH[2][0];
  fx(k.light('g-clock', FC, 110), [[peak - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [peak + 50, { transform: 'scale(1.2)', opacity: 0.5 }, 'ease-out'], [peak + 450, { transform: 'scale(1.9)', opacity: 0 }]]);
  fx(k.light('g-clock', [149, 148], 210, 40), [[peak, { transform: 'scale(.4, .6)', opacity: 0 }, 'ease-out'], [peak + 150, { transform: 'scale(1)', opacity: 0.85 }, 'ease-out'], [peak + 1000, { transform: 'scale(1.3)', opacity: 0 }]]);

  // ── the rings of light, spilling past the frame: out from the belfry, and flat over the sea from the foot
  CH.forEach(([c, A], i) => {
    const big = i === 2;
    for (let j = 0; j < (big ? 3 : 2); j++) {
      const t = c + j * 130, far = (3.6 + 1.4 * A) * (1 - j * 0.1);
      fx(k.pic(ring, BL, 100, 100), [[t, { transform: 'scale(.1)', opacity: 0 }, 'ease-out'], [t + 60, { transform: 'scale(.3)', opacity: (0.9 - j * 0.2) * Math.min(1, 0.6 + 0.2 * A) }, 'ease-out'], [t + 1100 + j * 120, { transform: `scale(${far.toFixed(2)})`, opacity: 0 }]]);
      fx(k.pic(ring, [BASE[0], BASE[1] + 1], 100, 100), [[t + 120, { transform: 'scale(.12, .02)', opacity: 0 }, 'ease-out'], [t + 190, { transform: 'scale(.3, .05)', opacity: (0.8 - j * 0.2) * Math.min(1, 0.6 + 0.2 * A) }, 'ease-out'], [t + 1250 + j * 120, { transform: `scale(${(far * 1.1).toFixed(2)}, ${(far * 0.17).toFixed(2)})`, opacity: 0 }]]);
    }
  });

  // ── sparks shaken from the bell drifting up and out
  CH.forEach(([c, A], i) => {
    const n = 6 + i * 3;
    for (let j = 0; j < n; j++) {
      const a = -Math.PI * (0.05 + rand() * 0.9), v = (14 + rand() * 26) * (0.8 + 0.2 * A), t = c + rand() * 80, life = 700 + rand() * 600, sz = 3 + rand() * 3.5;
      const px = (f) => Math.cos(a) * v * f, py = (f) => Math.sin(a) * v * f - 14 * f * f + 10 * f * f * f;
      fx(k.pic('spark', [BL[0], BL[1] + 4], sz, sz), [0, 0.25, 0.7, 1].map((f, q) => [t + life * f, { transform: `${k.T(px(f), py(f))} scale(${(1 - 0.5 * f).toFixed(2)})`, opacity: q === 0 || q === 3 ? 0 : 0.95 }, q ? 'linear' : 'ease-out']));
    }
  });
  // glints running across the water at each chime (the third runs wider)
  CH.forEach(([c, A], i) => {
    const n = 4 + i * 4;
    for (let j = 0; j < n; j++) {
      const x = 150 + (rand() - 0.5) * (80 + 70 * i + 30 * A), y = 143 + rand() * 32, t = c + 120 + rand() * 300, sz = 5 + rand() * 5;
      fx(k.picIn('glint', [x, y], sz * 1.8, sz * 0.7), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 130, { transform: 'scale(1)', opacity: 0.95 }, eio], [t + 420, { transform: 'scale(.3)', opacity: 0 }]]);
    }
  });
  // bubbles rising round its drowned foot, all the way through
  for (let i = 0; i < 12; i++) {
    const t0 = 150 + i * 240 + rand() * 80, x = 124 + rand() * 50, sz = 2.6 + rand() * 3.2;
    fx(k.picIn(bub, [x, 150 + rand() * 12], sz, sz), [[t0, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 200, { transform: `${k.T((rand() - 0.5) * 3, -8)} scale(1)`, opacity: 0.8 }], [t0 + 1200, { transform: `${k.T((rand() - 0.5) * 10, -30 - rand() * 18)} scale(1.1)`, opacity: 0 }]]);
  }
}
