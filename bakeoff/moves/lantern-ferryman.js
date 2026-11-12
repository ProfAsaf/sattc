// Lantern Ferryman (a Shade creature: whenever a friend dies he makes a spirit; role support, element spirit: as suggested).
// He leans back, sets the pole and shoves: the boat surges, the lantern swings back and then whips forward, flaring, and
// lets a spirit go: a bright orb with a trail of wisps arcs from the lantern to its target, where it lands on the water
// in rings and a little pale spirit stands up out of them; meanwhile the spirit in his wake reaches after the boat.
// Then the boat rocks to rest, the lantern's swing dying down, and the target's spirit melts into the mist.
//
// PLAN (drawing units 300 x 210, ms of the move). T = k.aim, else the water ahead of the bow (k.spec.river).
//   0-650    GATHER: he draws the pole back and leans away (the boat dips back), the lantern swings back, its light and the
//            wake spirit's light build, the spirit in the wake lifts and reaches.
//   650-1300 the shove: he leans into the pole (the pole stays in his hands as the boat slides past its foot), the boat
//            surges forward and pitches up, rings run out from the pole's foot, the lantern swings far back.
//   1300     BEATS.release: the lantern whips forward (toward T, left or right) and flares; the orb leaves it along an arc
//            to T with wisps streaming after it (700 ms).
//   2000     BEATS.impact: the orb lands at T: a flash, two rings across the water, motes thrown up, and a small spirit
//            rises out of the rings, bobs, then fades into the mist (by 3200).
//   2000-3700 the boat rocks and settles, the lantern swings less and less, the wake spirit sinks back, light fades;
//            BEATS.settle 3700: all as drawn (END 4200).
import { kit, ID, mul, rot, tr, app, curve } from './_fx.js';
export const END = 4200;
export const BEATS = { release: 1300, impact: 2000, settle: 3700 };
export const STILLS = [450, 1000, 1300, 1550, 2050, 2500, 3100, 3900];
export const textures = {
  orb: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226 + 29 * c, 214 + 41 * c, 255, Math.min(1, c * c * 2.8)]; }],
  star: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); const ax = Math.abs(x - 0.5) * 2, ay = Math.abs(y - 0.5) * 2, ray = Math.max(0, 1 - Math.min(ax, ay) * 9) * Math.max(0, 1 - Math.max(ax, ay)); return [236 + 19 * c, 226 + 29 * c, 255, Math.min(1, c * c * c * 1.6 + ray * 0.85)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const S = k.spec, E = S.emit, HIPS = S.hips, HOOK = S.hook, FOOT = S.foot;
  const T = k.aim || S.river;
  const hull = k.part('hull'), man = k.part('man'), eyes = k.part('eyes'), pole = k.part('pole'), lantern = k.part('lantern'), ghost = k.part('ghost');
  const dir = T[0] >= HOOK[0] ? -1 : 1; // the sign of a swing of the lantern toward T (it hangs from its hook)
  const ring = k.svg('<defs><filter id="b" x="-5%" y="-40%" width="110%" height="180%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><ellipse cx="50" cy="12" rx="46" ry="9.2" fill="none" stroke="#cdb6f4" stroke-width="4" filter="url(#b)" opacity=".8"/><ellipse cx="50" cy="12" rx="46" ry="9.2" fill="none" stroke="#f4ecff" stroke-width="1.5"/>', 100, 24);
  const spirit = k.svg('<defs><filter id="b" x="-40%" y="-20%" width="180%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8f4ff"/><stop offset=".55" stop-color="#e0d4fa" stop-opacity=".85"/><stop offset="1" stop-color="#b8a6e2" stop-opacity="0"/></linearGradient></defs>' +
    '<path d="M20,6C27,6 30,12 29,18C28,22 30,28 34,36C36,40 36,44 30,48C26,52 24,56 20,58C16,56 14,52 10,48C4,44 4,40 6,36C10,28 12,22 11,18C10,12 13,6 20,6Z" fill="#c9b8f2" filter="url(#b)" opacity=".8"/>' +
    '<path d="M20,7C26,7 28.5,12 27.6,18C26.8,23 29,29 32,36C34,40 33,43 29,46C25,50 23,54 20,56C17,54 15,50 11,46C7,43 6,40 8,36C11,29 13,23 12.4,18C11.5,12 14,7 20,7Z" fill="url(#g)"/>' +
    '<ellipse cx="17" cy="16" rx="1.5" ry="2" fill="#4a3a78"/><ellipse cx="23" cy="16" rx="1.5" ry="2" fill="#4a3a78"/>', 40, 60);

  // ── the boat's motion: it dips back, surges forward past the planted pole, pitches, rocks to rest
  const damp = (t) => Math.max(0, (3700 - t) / 3700);
  const bx = curve([[0, 0], [650, -2], [1300, 6.5], [1700, 4.5], [2500, 1.5], [3300, 0.2], [3700, 0]]);
  const pitch = curve([[0, 0], [650, 0.9], [1300, -1.3], [1800, -0.5], [2600, 0.3], [3700, 0]]);
  const B = (t) => mul(mul(tr(bx(t), 0.5 * Math.sin(t / 420) * damp(t)), rot(pitch(t) + 0.3 * Math.sin(t / 330) * damp(t), 150, 158)), ID);
  const lean = curve([[0, 0], [650, -3.5], [1250, 6], [1700, 3.5], [2500, 1], [3700, 0]]);
  const Wman = (t) => mul(B(t), rot(lean(t), HIPS[0], HIPS[1]));
  // the pole stays planted at its foot and stays in his hands: it turns to follow the hands as the boat slides past
  const H0 = [135, 106], ang = (p) => Math.atan2(p[1] - FOOT[1], p[0] - FOOT[0]);
  const Wpole = (t) => rot(((ang(app(Wman(t), H0)) - ang(H0)) * 180) / Math.PI, FOOT[0], FOOT[1]);
  const sw = curve([[0, 0], [650, -4], [1150, -11], [1380, 14], [1750, -6], [2150, 4], [2600, -2], [3000, 1], [3700, 0]]);
  const Wlan = (t) => mul(B(t), rot(dir * sw(t), HOOK[0], HOOK[1]));
  h.drive(hull, S.boat, B, 3700);
  h.drive(man, HIPS, Wman, 3700);
  h.drive(eyes, HIPS, Wman, 3700);
  h.drive(pole, FOOT, Wpole, 3700);
  h.drive(lantern, HOOK, Wlan, 3700);
  // the spirit in the wake rises and reaches after the boat, flares, sinks back
  const Wk = S.wake;
  act(ghost, [[0, { transform: 'none' }, eio], [650, { transform: `${k.T(0, -2)} rotate(-3deg) scale(1.03, 1.07)` }, eio], [1350, { transform: `${k.T(2, -5)} rotate(-6deg) scale(1.06, 1.15)` }, eio], [2200, { transform: `${k.T(1, -4)} rotate(-4deg) scale(1.05, 1.1)` }, eio], [3300, { transform: `${k.T(0, -1)} rotate(-1deg) scale(1.01, 1.02)` }, eio], [3700, { transform: 'none' }]]);
  fx(k.lightIn('g-violet', [50, 130], 70, 80), [[300, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [1200, { transform: 'scale(1)', opacity: 0.55 }, eio], [1500, { transform: 'scale(1.15)', opacity: 0.7 }, eio], [2500, { transform: 'scale(1.2)', opacity: 0.3 }, eio], [3500, { transform: 'scale(1.3)', opacity: 0 }]]);

  // ── the lantern's light: builds, a burst as it whips forward, glows on while the orb is away, fades
  h.ride(k.light('g-violet', E, 46), E, Wlan, [[100, 0.5, 0], [650, 0.9, 0.7], [1150, 1.2, 0.85], [1380, 2.1, 1], [1800, 1.5, 0.8], [2400, 1.1, 0.4], [3100, 1.0, 0.15], [3600, 0.9, 0]]);
  h.ride(k.light('g-violet', E, 16), E, Wlan, [[1250, 0.4, 0], [1380, 2.2, 1], [1700, 1.4, 0.4], [2000, 1.0, 0]]);
  // the ferryman's eyes burn a moment as he sends the spirit
  h.ride(k.light('g-violet', [123, 67], 16), [123, 67], Wman, [[1000, 0.4, 0], [1380, 1.4, 0.9], [1900, 1.1, 0.5], [2400, 0.8, 0]]);
  // rings run out from the pole's foot as he shoves, and a swell off the stern
  for (const [t0, w] of [[700, 36], [1000, 48], [1300, 40]]) fx(k.picIn(ring, [FOOT[0], FOOT[1] + 1], w, w * 0.24), [[t0, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t0 + 120, { transform: 'scale(.5)', opacity: 0.8 }, 'ease-out'], [t0 + 900, { transform: 'scale(1.7)', opacity: 0 }]]);
  for (const [t0, w] of [[900, 60], [1350, 70]]) fx(k.picIn(ring, [64, 160], w, w * 0.24), [[t0, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t0 + 140, { transform: 'scale(.6)', opacity: 0.7 }, 'ease-out'], [t0 + 1100, { transform: 'scale(1.8)', opacity: 0 }]]);
  // motes drawn in to the lantern while it gathers
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * 6.283 + rand() * 0.5, d = 20 + rand() * 14, t = 200 + i * 90, sz = 3.5 + rand() * 2.5;
    fx(k.picIn('orb', E, sz, sz), [[t, { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d * 0.8)} scale(.6)`, opacity: 0 }, 'ease-in'], [t + 300, { transform: `${k.T(Math.cos(a) * d * 0.5, Math.sin(a) * d * 0.4)} scale(1)`, opacity: 0.95 }, 'ease-in'], [t + 520, { transform: 'scale(.3)', opacity: 0 }]]);
  }

  // ── release (1300 to 2000): the orb leaves the lantern (as it is when it whips forward) for T on the overlay, wisps after it
  const M = app(Wlan(1380), E);
  const bz = h.arcPath(M, T, 30 + Math.abs(T[0] - M[0]) * 0.08);
  h.fly(k.pic('orb', M, 15, 15), M, bz, 1380, 2000, (f) => 0.7 + 0.5 * Math.sin(f * 3.14), (f) => Math.min(1, f * 12) * (f > 0.96 ? 0 : 1), 0, 0, 40);
  h.fly(k.light('g-violet', M, 30), M, bz, 1380, 2000, () => 1, (f) => Math.min(1, f * 10) * 0.9 * (f > 0.96 ? 0 : 1), 0, 0, 40);
  for (let i = 0; i < 9; i++) {
    const lag = 40 + i * 38, sz = 9 - i * 0.5, tt0 = 1380 + lag, tt1 = 2000 + lag * 0.6;
    h.fly(k.pic('orb', M, sz, sz), M, bz, tt0, tt1, (f) => 0.9 - f * 0.4, (f) => Math.min(1, f * 8) * (0.8 - f * 0.5) * (f > 0.97 ? 0 : 1), 0, 0, 50);
  }

  // ── where it lands (2000): flash, rings across the water, motes up, a small spirit stands up out of the rings and fades
  const IM = 2000;
  fx(k.light('g-violet', [T[0], T[1] - 6], 60), [[IM - 50, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [IM + 500, { transform: 'scale(1.05)', opacity: 0.7 }, eio], [IM + 1300, { transform: 'scale(.9)', opacity: 0 }]]);
  fx(k.light('g-violet', T, 20), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.7)', opacity: 1 }], [IM + 220, { transform: 'scale(2.8)', opacity: 0 }]]);
  for (const [dt, w] of [[0, 56], [160, 78]]) fx(k.pic(ring, T, w, w * 0.24, { low: true }), [[IM + dt, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [IM + dt + 100, { transform: 'scale(.4)', opacity: 0.9 }, 'ease-out'], [IM + dt + 900, { transform: 'scale(1.7)', opacity: 0 }]]);
  fx(k.pic(spirit, [T[0], T[1] + 12], 22, 33, { base: true }), [[IM + 40, { transform: 'scale(.2, .1)', opacity: 0 }, 'ease-out'], [IM + 380, { transform: `${k.T(0, -4)} scale(1, 1)`, opacity: 0.95 }, eio], [IM + 800, { transform: `${k.T(0, -9)} scale(1.04, 1.05)`, opacity: 0.95 }, eio], [IM + 1200, { transform: `${k.T(0, -12)} scale(1, 1.05)`, opacity: 0.75 }, eio], [IM + 1750, { transform: `${k.T(1, -20)} scale(.9, 1.1)`, opacity: 0 }]]);
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI * (0.1 + rand() * 0.8), v = 14 + rand() * 26, t = IM + rand() * 120, life = 700 + rand() * 500, sz = 3 + rand() * 3.5;
    const px = (f) => Math.cos(a) * v * f, py = (f) => Math.sin(a) * v * f + 12 * f * f - 8 * f;
    fx(k.pic(i % 3 ? 'orb' : 'star', T, sz * (i % 3 ? 1 : 2), sz * (i % 3 ? 1 : 2)), [0, 0.3, 0.65, 1].map((f, j) => [t + life * f, { transform: `${k.T(px(f), py(f))} scale(${(1 - 0.5 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 0.95 }, j ? 'linear' : 'ease-out']));
  }
}
