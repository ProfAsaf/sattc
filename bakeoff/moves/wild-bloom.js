// Wild Bloom (a Trick: double a creature's Power and Vitality this turn; role support, element nature: as suggested).
// The plant coils (it crouches, the great flower closes to a bud, light and motes drawn into its heart), then springs:
// the stalk shoots up past its height and the flower flings open, throwing a ring of light and petals every way, while
// a stream of petals and light arcs from its heart to its target, where it lands in a doubled flash: two rings, and a
// flower of light opening at the spot. Then the plant rocks back to rest, the flower swaying.
//
// PLAN (drawing units 300 x 210, ms of the move). T = k.aim, else the ground to the right (k.spec.ground).
//   0-700    GATHER: the stalk squashes down and fattens, the flower closes (the bud rides the stalk's top), the heart's
//            light builds and motes stream in to it from the whole clearing.
//   700-1000 the spring: the stalk shoots up (overshooting), the flower flings open past its size. BEATS.release 1000:
//            a flash at the heart, a ring of light over the ground, a ring of 16 petals flung out past the frame, and the
//            gift (petals, with light after them) leaves the heart along an arc to T (600 ms).
//   1600     BEATS.impact: at T a flash, two rings (doubled) across the ground, motes thrown up, and a flower of light
//            opens there, holds, and fades by 2900.
//   1000-3300 the plant rocks back to its drawn height, the flower swaying, light fading; BEATS.settle 3300 (END 3800).
import { kit, mul, scl, rot, tr, curve } from './_fx.js';
export const END = 3800;
export const BEATS = { release: 1000, impact: 1600, settle: 3300 };
export const STILLS = [350, 700, 900, 1050, 1300, 1700, 2300, 3500];
export const textures = {
  glint: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [250 + 5 * c, 255, 205 + 40 * c, Math.min(1, c * c * 2.6)]; }],
  star: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); const ax = Math.abs(x - 0.5) * 2, ay = Math.abs(y - 0.5) * 2, ray = Math.max(0, 1 - Math.min(ax, ay) * 9) * Math.max(0, 1 - Math.max(ax, ay)); return [250, 255, 215 + 30 * c, Math.min(1, c * c * c * 1.6 + ray * 0.85)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const S = k.spec, E = S.emit, F = S.foot;
  const T = k.aim || S.ground;
  const stalk = k.part('stalk'), bloom = k.part('bloom');
  k.css('.g-bl { border-radius: 50%; background: radial-gradient(circle, rgba(253,255,226,.95), rgba(232,250,150,.55) 32%, rgba(206,236,100,.16) 58%, rgba(190,226,80,0) 72%); }');
  const flat = k.svg('<defs><filter id="b" x="-5%" y="-40%" width="110%" height="180%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><ellipse cx="125" cy="28" rx="120" ry="25.2" fill="none" stroke="#f0ff9c" stroke-width="5" filter="url(#b)" opacity=".8"/><ellipse cx="125" cy="28" rx="120" ry="25.2" fill="none" stroke="#fdffe0" stroke-width="1.8"/>', 250, 56);
  const petal = k.svg('<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#efe6b0"/></linearGradient></defs><path d="M6,0C11,5 11,15 6,24C1,15 1,5 6,0Z" fill="url(#g)" stroke="#b8ad66" stroke-width=".6"/>', 12, 24);
  let wheel = '';
  for (let i = 0; i < 8; i++) wheel += `<path transform="rotate(${i * 45 + 22} 30 30)" d="M30,30C35,24 35,10 30,3C25,10 25,24 30,30Z" fill="#fbf6d6" stroke="#cfc47a" stroke-width=".5"/>`;
  const flower = k.svg(`<defs><filter id="b" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter></defs><g filter="url(#b)" opacity=".8">${wheel.replace(/#fbf6d6/g, '#f2ffb8')}</g>${wheel}<circle cx="30" cy="30" r="5" fill="#fffef0"/><circle cx="30" cy="30" r="2.4" fill="#fff"/>`, 60, 60);

  // ── the plant: crouches and fattens, springs past its height, rocks back; the flower rides the stalk's top, closes to a bud, flings open
  const sy = curve([[0, 1], [300, 0.97], [700, 0.8], [1000, 1.14], [1300, 0.97], [1650, 1.05], [2150, 0.99], [2600, 1.01], [3300, 1]]);
  const Wst = (t) => { const y = sy(t); return scl(1 + 0.4 * (1 - y), y, F[0], F[1]); };
  const bs = curve([[0, 1], [350, 0.9], [700, 0.62], [1000, 1.32], [1250, 1.1], [1650, 1.05], [2300, 1.0], [3300, 1]]);
  const sway = curve([[0, 0], [1000, 0], [1250, 3.5], [1650, -2.5], [2150, 1.4], [2700, -0.6], [3300, 0]]);
  const SW = (t) => mul(Wst(t), rot(sway(t) * 0.35, F[0], F[1]));
  const Wbl = (t) => mul(SW(t), mul(rot(sway(t), E[0], E[1]), scl(bs(t), bs(t), E[0], E[1])));
  h.drive(stalk, F, SW, 3300, 50);
  h.drive(bloom, E, Wbl, 3300, 50);

  // ── light at the heart: builds while it is a bud, blazes as it opens, fades with the sway; rides the bloom
  const Wb2 = Wbl;
  h.ride(k.light('g-bl', E, 54), E, Wb2, [[100, 0.4, 0], [700, 0.7, 0.8], [950, 1.0, 0.95], [1050, 2.2, 1], [1400, 1.7, 0.85], [2000, 1.3, 0.5], [2800, 1.1, 0.15], [3300, 1.0, 0]]);
  h.ride(k.light('g-bl', E, 22), E, Wb2, [[880, 0.4, 0], [1010, 2.4, 1], [1200, 1.6, 0.5], [1500, 1.0, 0]]);
  // motes drawn in to the bud
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * 6.283 + rand() * 0.4, d = 40 + rand() * 60, t = 60 + i * 42, x0 = Math.cos(a) * d, y0 = Math.sin(a) * d * 0.7, sz = 4 + rand() * 3;
    fx(k.picIn('glint', E, sz, sz), [[t, { transform: `${k.T(x0, y0)} scale(.5)`, opacity: 0 }, 'ease-in'], [t + 260, { transform: `${k.T(x0 * 0.5, y0 * 0.5)} scale(1)`, opacity: 0.95 }, 'ease-in'], [t + 520, { transform: `${k.T(0, 3)} scale(.4)`, opacity: 0 }]]);
  }
  // the burst at the foot: a ring over the ground and a lift of light as the stalk shoots up
  fx(k.lightIn('g-bl', [F[0], F[1] - 8], 120, 34), [[650, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(1.1)', opacity: 0.95 }, 'ease-out'], [1900, { transform: 'scale(1.4)', opacity: 0.3 }, eio], [2700, { transform: 'scale(1.5)', opacity: 0 }]]);
  for (const [t0, s1] of [[1000, 2.0], [1150, 1.6]]) fx(k.picIn(flat, [F[0], F[1] - 8], 250, 56), [[t0, { transform: 'scale(.08)', opacity: 0 }, 'ease-out'], [t0 + 90, { transform: 'scale(.2)', opacity: 0.95 }, 'ease-out'], [t0 + 700, { transform: `scale(${s1})`, opacity: 0 }]]);
  // dust and bits of earth thrown up round the foot
  for (let i = 0; i < 8; i++) {
    const side = i % 2 ? 1 : -1, dx = side * (14 + rand() * 30), up = 22 + rand() * 24, t = 960 + rand() * 120, sz = 2.2 + rand() * 1.6;
    fx(k.picIn('glint', [F[0] + side * 6, F[1] - 12], sz, sz, { lit: false }), [[t, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [t + 160, { transform: `${k.T(dx * 0.5, -up)} scale(1)`, opacity: 0.9 }, 'ease-out'], [t + 520, { transform: `${k.T(dx, 2)} scale(.7)`, opacity: 0 }]]);
  }

  // ── the flung ring: 16 petals thrown out of the heart in every direction, past the frame (overlay), spinning
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * 6.283 + (rand() - 0.5) * 0.3, d = 60 + rand() * 50, t = 1000 + rand() * 80, r = Math.round(rand() * 360), sz = 8 + rand() * 4;
    const dx = Math.cos(a) * d, dy = Math.sin(a) * d * 0.85;
    fx(k.pic(petal, E, sz * 0.5, sz), [[t, { transform: `rotate(${r}deg) scale(.3)`, opacity: 0 }, 'ease-out'], [t + 160, { transform: `${k.T(dx * 0.4, dy * 0.4)} rotate(${r + 100}deg) scale(1)`, opacity: 0.95 }, 'ease-out'],
      [t + 900, { transform: `${k.T(dx, dy + 12)} rotate(${r + 300}deg) scale(.9)`, opacity: 0 }]]);
  }

  // ── the gift: petals and light leave the heart for T along an arc (1000 to 1600), on the overlay
  const bz = h.arcPath(E, T, 34 + Math.abs(T[0] - E[0]) * 0.1);
  h.fly(k.pic('glint', E, 16, 16), E, bz, 1020, 1600, (f) => 0.8 + 0.4 * Math.sin(f * 3.14), (f) => Math.min(1, f * 10) * (f > 0.96 ? 0 : 1), 0, 0, 40);
  h.fly(k.light('g-bl', E, 32), E, bz, 1020, 1600, () => 1, (f) => Math.min(1, f * 9) * 0.9 * (f > 0.96 ? 0 : 1), 0, 0, 40);
  for (let i = 0; i < 10; i++) {
    const lag = 30 + i * 36, sz = 12 - i * 0.6;
    h.fly(k.pic(i % 2 ? petal : 'glint', E, sz * (i % 2 ? 0.5 : 0.6), sz * (i % 2 ? 1 : 0.6)), E, bz, 1020 + lag, 1600 + lag * 0.5, (f) => 0.9 - f * 0.3, (f) => Math.min(1, f * 8) * (0.85 - f * 0.4) * (f > 0.97 ? 0 : 1), Math.round(rand() * 360), 220, 50);
  }

  // ── where it lands (1600): a doubled flash, two rings, motes up, a flower of light opens, holds, fades
  const IM = 1600;
  fx(k.light('g-bl', [T[0], T[1] - 6], 62), [[IM - 50, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [IM + 250, { transform: 'scale(.9)', opacity: 0.6 }, eio], [IM + 420, { transform: 'scale(1.25)', opacity: 0.95 }, eio], [IM + 1200, { transform: 'scale(1.0)', opacity: 0 }]]);
  fx(k.light('g-bl', T, 20), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.7)', opacity: 1 }], [IM + 220, { transform: 'scale(2.8)', opacity: 0 }]]);
  for (const [dt, w] of [[0, 54], [190, 72]]) fx(k.pic(flat, [T[0], T[1] + 4], w, w * 0.22, { low: true }), [[IM + dt, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [IM + dt + 90, { transform: 'scale(.4)', opacity: 0.9 }, 'ease-out'], [IM + dt + 850, { transform: 'scale(1.0)', opacity: 0 }]]);
  fx(k.pic(flower, [T[0], T[1] - 10], 34, 34), [[IM + 30, { transform: 'rotate(-30deg) scale(.1)', opacity: 0 }, 'ease-out'], [IM + 260, { transform: 'rotate(0deg) scale(1.15)', opacity: 1 }, 'ease-out'], [IM + 450, { transform: 'rotate(10deg) scale(.95)', opacity: 1 }, eio],
    [IM + 1000, { transform: 'rotate(18deg) scale(1.05)', opacity: 0.85 }, eio], [IM + 1300, { transform: 'rotate(30deg) scale(1.3)', opacity: 0 }]]);
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI * (0.08 + rand() * 0.84), v = 14 + rand() * 28, t = IM + rand() * 100, life = 650 + rand() * 450, sz = 3 + rand() * 3.5;
    const px = (f) => Math.cos(a) * v * f, py = (f) => Math.sin(a) * v * f + 14 * f * f - 6 * f;
    fx(k.pic(i % 3 ? 'glint' : 'star', T, sz * (i % 3 ? 1 : 2), sz * (i % 3 ? 1 : 2)), [0, 0.3, 0.65, 1].map((f, j) => [t + life * f, { transform: `${k.T(px(f), py(f))} scale(${(1 - 0.5 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 0.95 }, j ? 'linear' : 'ease-out']));
  }
}
