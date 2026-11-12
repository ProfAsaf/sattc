// Grave Robber (a 2/2 that, when played, puts the three costliest creatures from each opponent's discard pile on the
// bottom of their deck: an attacker; its element is the earth he heaves). Hooded and sack on his shoulder, he crouches and
// drives the shovel's blade into the open grave: the violet light under the stair flares, crumbs of earth fall from the
// blade. He heaves it up and back with his whole body (the sack swinging out behind him, the gleam of gold at its neck
// flashing) and flings a spray of clods, dust and a few stolen glints over his shoulder along an arc to T. They land with
// a thud: a flat ring of dust, clods bouncing, a dark mound heaped up, and three faint violet cards that hung over the
// spot drop into it one after the other and are buried. He rocks back (the sack rattling), the dust drifts off, and he
// lowers the shovel, as drawn.
//
// PLAN (drawing units 300 x 210, ms). Role attacker (as suggested), element earth (as suggested). T = k.aim, else the
// cemetery to his right (`ground`). The blade is flung up and over (a swing of the shovel about the hand, back to
// -85 degrees); the earth leaves from where the blade is then, wherever T is, so a target on his left gets a lob over
// his head. Everything that flies or lands is on the overlay (k.pic, k.light): T may be on another card.
//   0-250    GATHER: he draws back, the blade lifts a little.
//   250-780  SCOOP: he leans into it, the blade dips into the grave; the grave's light flares, crumbs fall.
//   780-1000 HEAVE: leans back and up, the shovel whips up; RELEASE 1000, at the top of the swing.
//   1000-1500 the earth flies; the sack swings out and back, the gleam flashes.
//   1500     IMPACT: dust ring, clods, the mound, violet flash; the three cards are buried 1600-2300.
//   2300-3700 the dust drifts, he rocks forward, the shovel lowers; SETTLE 3700, as drawn.
import { mul, rot, tr, app, curve, kit } from './_fx.js';

export const END = 4200;
export const BEATS = { release: 1000, impact: 1500, settle: 3700 };
export const STILLS = [250, 650, 900, 1050, 1300, 1600, 2100, 3900];

export const textures = {
  clod: [24, 24, (x, y) => {
    const dx = x - 0.5, dy = y - 0.5, r = Math.hypot(dx, dy) * 2, a = Math.atan2(dy, dx), edge = 0.82 + 0.14 * Math.sin(a * 5 + 1) + 0.06 * Math.sin(a * 9);
    if (r > edge) return [0, 0, 0, Math.max(0, 1 - (r - edge) * 12)];
    const hi = Math.max(0, -(dx + dy) * 1.6);
    return [58 + 90 * hi, 42 + 78 * hi, 66 + 96 * hi, 1];
  }],
  dust: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [176, 156, 214, c * c * 0.85]; }],
  mound: [48, 28, (x, y) => {
    const dx = (x - 0.5) * 2, dy = 1 - y, h = 1 - dx * dx * 0.95;
    if (dy > h * 0.95 || h <= 0) return [0, 0, 0, 0];
    const light = 0.4 + 0.6 * (1 - dy / (h * 0.95)) - dx * 0.18;
    return [30 + 60 * light, 22 + 44 * light, 44 + 70 * light, 1];
  }],
  gcard: [32, 44, (x, y) => {
    const dx = Math.abs(x - 0.5), dy = Math.abs(y - 0.5);
    if (dx > 0.46 || dy > 0.48) return [0, 0, 0, 0];
    if (dx > 0.38 || dy > 0.4) return [214, 196, 255, 0.95];
    const line = (Math.abs(y - 0.32) < 0.03 || Math.abs(y - 0.5) < 0.03 || Math.abs(y - 0.68) < 0.03) && dx < 0.26;
    return line ? [214, 196, 255, 0.8] : [120, 96, 190, 0.55];
  }],
  glint: [20, 20, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 220 + 35 * c, 120 + 120 * c, Math.min(1, c * 2.4)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const F = kit(k), { drive, ride } = F;
  const S = k.spec, E = S.emit, HAND = S.hand, AN = S.ankles, NK = S.neck;
  const T = k.aim || S.ground;
  const REL = BEATS.release, IM = BEATS.impact, BACK = BEATS.settle;
  k.css('.g-gold { border-radius: 50%; background: radial-gradient(circle, rgba(255,244,200,.95), rgba(255,208,112,.55) 30%, rgba(255,182,80,.18) 55%, rgba(255,170,60,0) 72%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter></defs><ellipse cx="50" cy="50" rx="42" ry="42" fill="none" stroke="#cbb8f2" stroke-width="6" filter="url(#b)" opacity=".8"/>', 100, 100);

  // ── the poses: body leans from the ankles; the shovel turns in the hand; the sack lags on the shoulder
  const lean = curve([[0, 0], [250, -2.4], [700, 3.4], [780, 3.6, 'in'], [1000, -6.2, 'out'], [1250, -4.2], [1800, -1.2], [2500, 1.4], [3100, -0.5], [BACK, 0]]);
  const bob = curve([[0, 0], [250, 0.8], [700, 1.5], [780, 1.5, 'in'], [1000, -1.5, 'out'], [1400, -0.5], [2000, 0.4], [3000, 0], [BACK, 0]]);
  const sw = curve([[0, 0], [250, 7], [700, 17], [780, 17, 'in'], [1000, -84, 'out'], [1180, -92], [1700, -62], [2400, -26], [3100, 5], [3350, -2], [BACK, 0]]);
  const sk = curve([[0, 0], [250, -1.5], [700, 3], [780, 3, 'in'], [1050, 8, 'out'], [1300, -9], [1550, 5], [1850, -3], [2250, 1.5], [2800, -0.6], [3300, 0]]);
  const Wb = (t) => mul(tr(0, bob(t)), rot(lean(t), AN[0], AN[1]));
  const Ws = (t) => mul(Wb(t), rot(sw(t), HAND[0], HAND[1]));
  const Wk = (t) => mul(Wb(t), rot(sk(t), NK[0], NK[1] + 8.4));
  drive(k.part('body'), AN, Wb, BACK);
  drive(k.part('under'), AN, Wb, BACK);
  drive(k.part('shovel'), HAND, Ws, BACK);
  drive(k.part('sack'), [120.6, 94.4], Wk, BACK);
  drive(k.part('creases'), [120.6, 94.4], Wk, BACK);
  drive(k.part('gleam'), NK, Wk, BACK);
  // the gold at the sack's neck flashes with the heave and the landing
  ride(k.light('g-gold', NK, 22), NK, Wk, [[780, 0.4, 0], [1040, 1.3, 0.95], [1250, 0.8, 0.5], [1500, 1.2, 0.8], [1800, 0.7, 0.3], [2200, 0.5, 0]]);

  // ── the grave's light flares as the blade digs, with crumbs falling from the blade
  fx(k.lightIn('g-violet', [144, 188], 110, 54), [[300, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [740, { transform: 'scale(1.15)', opacity: 0.95 }, eio], [1100, { transform: 'scale(1.25)', opacity: 0.7 }, eio], [2000, { transform: 'scale(1)', opacity: 0.3 }, eio], [2900, { transform: 'scale(.8)', opacity: 0 }]]);
  const blade = (t) => app(Ws(t), E);
  for (let i = 0; i < 6; i++) {
    const t = 640 + i * 55 + rand() * 30, B = blade(Math.min(t, 780)), r = Math.round(rand() * 360), sz = 3 + rand() * 3, dx = (rand() - 0.5) * 12;
    fx(k.picIn('clod', [B[0] + (rand() - 0.5) * 8, B[1] - 4], sz, sz), [[t, { transform: `rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 90, { transform: `${k.T(dx * 0.2, -3)} rotate(${r + 30}deg) scale(1)`, opacity: 1 }, 'ease-out'],
      [t + 420, { transform: `${k.T(dx * 0.6, 14 + rand() * 6)} rotate(${r + 120}deg) scale(.9)`, opacity: 0 }, 'ease-in']]);
  }
  // dust puffs from the grave's mouth when the blade bites
  for (let i = 0; i < 3; i++) {
    const t = 700 + i * 70, B = blade(740), r = Math.round(rand() * 360);
    fx(k.picIn('dust', [B[0] - 6, B[1] + 2], 18, 14), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 160, { transform: `${k.T(-3 - i * 3, -3)} rotate(${r + 15}deg) scale(1)`, opacity: 0.7 }], [t + 800, { transform: `${k.T(-8 - i * 4, -9)} rotate(${r + 40}deg) scale(1.6)`, opacity: 0 }]]);
  }

  // ── the spray: from the blade at the top of the swing to T, a lob over (clods, dust, glints of stolen gold)
  const A = blade(REL);
  const lob = (to) => { const C = [(A[0] + to[0]) / 2, Math.min(A[1], to[1]) - 44]; return (t) => { const q = 1 - t; return [q * q * A[0] + 2 * q * t * C[0] + t * t * to[0], q * q * A[1] + 2 * q * t * C[1] + t * t * to[1]]; }; };
  const TRAVEL = IM - REL;
  const flyAlong = (tex, size, t0, dur, to, o = {}) => {
    const path = lob(to), ks = [], r = Math.round(rand() * 360), spin = (rand() - 0.5) * 700, steps = 9;
    for (let j = 0; j <= steps; j++) {
      const f = j / steps, p = path(f * f * 0.35 + f * 0.65);
      ks.push([t0 + dur * f, { transform: `${k.T(p[0] - A[0], p[1] - A[1])} rotate(${(r + spin * f).toFixed(0)}deg) scale(${(o.grow ? 0.5 + f * o.grow : 1).toFixed(2)})`, opacity: j === 0 ? 0 : o.fade ? +(0.8 * (1 - f * 0.4)).toFixed(2) : 1 }, j ? 'linear' : 'ease-out']);
    }
    fx(k.pic(tex, A, size, size, o.pic), ks);
  };
  for (let i = 0; i < 16; i++) {
    const to = [T[0] + (rand() - 0.5) * 26, T[1] + (rand() - 0.5) * 8];
    flyAlong('clod', 5.5 + rand() * 5, REL + i * 24 + rand() * 30, TRAVEL * (0.85 + rand() * 0.3), to);
  }
  for (let i = 0; i < 7; i++) flyAlong('dust', 14 + rand() * 10, REL + i * 40, TRAVEL * (0.9 + rand() * 0.25), [T[0] + (rand() - 0.5) * 20, T[1]], { grow: 1.6, fade: true });
  for (let i = 0; i < 4; i++) flyAlong('glint', 4 + rand() * 2, REL + 30 + i * 70, TRAVEL * (0.9 + rand() * 0.2), [T[0] + (rand() - 0.5) * 18, T[1] - 2]);
  // the swing's flash at the top
  fx(k.light('g-violet', A, 34), [[REL - 60, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [REL + 30, { transform: 'scale(1)', opacity: 0.75 }, eio], [REL + 380, { transform: 'scale(.7)', opacity: 0 }]]);

  // ── where it lands (IMPACT): flash, a flat ring of dust, clods bouncing, the mound heaped, the three cards buried
  fx(k.light('g-violet', T, 64), [[IM - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(1.1)', opacity: 0.95 }, 'ease-out'], [IM + 500, { transform: 'scale(1)', opacity: 0.6 }, eio], [IM + 1300, { transform: 'scale(1.1)', opacity: 0.3 }, eio], [IM + 1900, { transform: 'scale(1.2)', opacity: 0 }]]);
  fx(k.pic(ring, T, 58, 40), [[IM, { transform: 'scale(.2, .15)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(.4, .3)', opacity: 0.95 }, 'ease-out'], [IM + 520, { transform: 'scale(1.15, .8)', opacity: 0 }]]);
  fx(k.pic(ring, T, 58, 40), [[IM + 100, { transform: 'scale(.1, .08)', opacity: 0 }, 'ease-out'], [IM + 160, { transform: 'scale(.3, .22)', opacity: 0.6 }, 'ease-out'], [IM + 650, { transform: 'scale(.85, .6)', opacity: 0 }]]);
  for (let i = 0; i < 9; i++) {
    const side = i % 2 ? 1 : -1, d = 8 + rand() * 20, r = Math.round(rand() * 360), t = IM + rand() * 60, sz = 14 + rand() * 10;
    fx(k.pic('dust', [T[0], T[1] + 2], sz, sz * 0.8, { low: true }), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 150, { transform: `${k.T(side * d * 0.5, -3)} rotate(${r + 20}deg) scale(1)`, opacity: 0.8 }, 'ease-out'],
      [t + 700, { transform: `${k.T(side * d, -8 - rand() * 6)} rotate(${r + 50}deg) scale(1.7)`, opacity: 0.45 }, eio], [t + 1800, { transform: `${k.T(side * d * 1.3, -16 - rand() * 8)} rotate(${r + 80}deg) scale(2.3)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI * (0.1 + rand() * 0.8), v = 14 + rand() * 24, t = IM + rand() * 50, life = 420 + rand() * 280, sz = 3 + rand() * 3.5, dx = Math.cos(a) * v, dy = Math.sin(a) * v;
    fx(k.pic('clod', T, sz, sz), [[t, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t + life * 0.4, { transform: `${k.T(dx * 0.55, dy)} rotate(${Math.round(rand() * 360)}deg) scale(1)`, opacity: 1 }, 'ease-out'],
      [t + life, { transform: `${k.T(dx, 3 + rand() * 4)} rotate(${Math.round(rand() * 540)}deg) scale(.9)`, opacity: 1 }, 'ease-in'], [t + life + 700, { transform: `${k.T(dx, 3 + rand() * 4)} scale(.9)`, opacity: 0 }]]);
  }
  // the mound: heaped as the cards go under, settling and sinking back to the ground
  fx(k.pic('mound', [T[0], T[1] + 7], 34, 20, { base: true }), [[IM + 60, { transform: 'scale(.3, .1)', opacity: 0 }, 'ease-out'], [IM + 300, { transform: 'scale(.9, 1)', opacity: 1 }, 'ease-out'], [IM + 900, { transform: 'scale(1.05, 1.15)', opacity: 1 }, eio], [2600, { transform: 'scale(1.05, 1.1)', opacity: 0.95 }, eio], [3300, { transform: 'scale(.9, .3)', opacity: 0 }]]);
  for (let i = 0; i < 3; i++) {
    const t = IM + 60 + i * 230, x = (i - 1) * 7, r = (i - 1) * 14;
    fx(k.pic('gcard', [T[0] + x, T[1] - 14 - i], 9, 12.5), [[t - 120, { transform: `rotate(${r - 10}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t, { transform: `${k.T(0, -1)} rotate(${r}deg) scale(1)`, opacity: 0.95 }, eio], [t + 160, { transform: `${k.T(0, -2.5)} rotate(${r + 4}deg) scale(1)`, opacity: 1 }, 'ease-in'],
      [t + 420, { transform: `${k.T(x * -0.3, 13)} rotate(${r + 22}deg) scale(.7, .3)`, opacity: 0 }]]);
  }
}
