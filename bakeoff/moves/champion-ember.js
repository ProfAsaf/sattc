// Pyra, Herald of Ash: she draws a breath, throws her head back and blows the long horn: the fire pours out of the
// bell in a roar and a stream of fire flies away to a target, bursting where it lands.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker, element fire (as suggested).
//   0-1100    gather: she inhales (head tips back, the horn lifts a little); the fire at the bell sinks to an ember
//             and sparks are drawn in from the sky; the bell glows, her robe and hood settle.
//   1150      RELEASE: head snaps forward, the horn drops to point at T and the plume bursts out of the bell,
//             stretched along the blast toward T (sound rings leave the bell, the sky flares, embers fly); the
//             robe and hood whip back; a stream of fire billows leaves the bell for T.
//   1700      IMPACT at T: a burst of fire, rings, billows and sparks, flames catch, smoke rolls up, a scorch.
//   1900-3500 follow-through: the plume dies back to its drawn size, the horn lowers back, her robe and hood
//             flutter to rest; the scorch smoulders. At rest as drawn from 3500 (END 4200).
// Aimed: T = k.aim || [270, 134] (the far peaks). The horn drops or lifts (clamped) toward T, the plume turns
// toward it, and the stream goes from the bell (spec.emit, carried by the horn's turn) to T on the overlay.
import { SPARK, mul, rot, scl, app, curve, kit } from './_fx.js';
export const END = 4200;
export const BEATS = { release: 1150, impact: 1700, settle: 3500 };
export const STILLS = [600, 1000, 1200, 1350, 1700, 2000, 2700, 3700];
export const textures = { spark: SPARK };

export function build(k) {
  const { fx, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const S = k.spec, HD = S.hands, EL = S.elbow, NK = S.neck, B = S.bell;
  const T = k.aim || [270, 134];

  // ── aim: the horn turns toward T (a good deal less than all the way, at most 30 up or 24 down)
  const aT = (Math.atan2(T[1] - HD[1], T[0] - HD[0]) * 180) / Math.PI, a0 = (Math.atan2(B[1] - HD[1], B[0] - HD[0]) * 180) / Math.PI;
  const hb = Math.max(-30, Math.min(24, 0.45 * (((aT - a0 + 540) % 360) - 180)));
  const hornA = curve([[0, 0], [300, 0], [900, -6], [1100, -8, 'in'], [1230, hb + 3 * Math.sign(hb || 1), 'out'], [1500, hb], [2300, hb * 0.8], [3300, 0], [3500, 0]]);
  const headA = curve([[0, 0], [250, 0], [850, -9], [1100, -11, 'in'], [1230, 4, 'out'], [1500, 2], [2300, 0.6], [3200, 0], [3500, 0]]);
  const wave = (t0, A, T0, dec) => (t) => (t < t0 ? 0 : A * Math.exp(-(t - t0) / dec) * Math.sin(((t - t0) * 2 * Math.PI) / T0));
  const robeA = (t) => (t < 1100 ? -1.2 * Math.sin(Math.PI * Math.min(1, t / 1100)) : wave(1100, 5, 700, 800)(t) - 0.7 * Math.exp(-(t - 1100) / 600));
  const hoodA = (t) => (t < 1100 ? -2.5 * Math.sin(Math.PI * Math.min(1, t / 1100)) : wave(1100, 9, 620, 900)(t) - 2 * Math.exp(-(t - 1100) / 500));
  const Wh = (t) => rot(hornA(t), EL[0], EL[1]);
  h.drive(k.part('horn'), EL, Wh, 3500);
  h.drive(k.part('head'), NK, (t) => rot(headA(t), NK[0], NK[1]), 3500);
  h.drive(k.part('hood'), [94, 86], (t) => rot(hoodA(t), 94, 86), 3500);
  h.drive(k.part('robe'), [88, 140], (t) => rot(robeA(t), 88, 140), 3500);

  // ── the plume: sinks to an ember as she inhales, bursts and stretches toward T, dies back to as drawn
  const aB = (Math.atan2(T[1] - B[1], T[0] - B[0]) * 180) / Math.PI;
  const ex = Math.max(-75, Math.min(75, ((aB - (-22 + hb) + 540) % 360) - 180));
  const sx = curve([[0, 1], [250, 1], [900, 0.5], [1130, 0.42, 'in'], [1300, 2.0, 'out'], [1900, 1.7], [2300, 1.3], [3100, 1.05], [3500, 1]]);
  const sy = curve([[0, 1], [250, 1], [900, 0.6], [1130, 0.5, 'in'], [1300, 1.4, 'out'], [1900, 1.2], [2300, 1.1], [3100, 1.0], [3500, 1]]);
  const turn = curve([[0, 0], [1130, 0], [1300, ex, 'out'], [1900, ex], [2500, ex * 0.4], [3300, 0], [3500, 0]]);
  const flick = (t) => (t > 1300 && t < 2300 ? 0.1 * Math.sin(t / 40) * Math.min(1, (2300 - t) / 600) : 0);
  const Wp = (t) => mul(Wh(t), mul(rot(turn(t) + flick(t) * 14, B[0], B[1]), scl(sx(t) * (1 + flick(t)), sy(t) * (1 - flick(t)), B[0], B[1])));
  const pop = curve([[0, 1], [250, 1], [900, 0.45], [1130, 0.3, 'in'], [1200, 1], [3500, 1]]);
  h.drive(k.part('plume'), HD, Wp, 3500, 60, pop);
  const Bt = (t) => app(Wh(t), B);
  const E1 = Bt(BEATS.release + 60);

  // ── the bell glows; her face and robe take the blaze; the sky flares
  h.ride(k.light('g-warm', B, 56), B, Wh, [[250, 0.3, 0], [900, 0.9, 0.7], [1100, 1.2, 1], [1300, 2.1, 1], [1900, 1.5, 0.85], [2600, 1.0, 0.4], [3300, 0.8, 0], [3500, 0.8, 0]]);
  fx(k.lightIn('g-warm', [112, 100], 60, 60), [[800, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [1250, { transform: 'scale(1)', opacity: 0.7 }, 'ease-out'], [2000, { transform: 'scale(1.1)', opacity: 0.5 }, eio], [3100, { transform: 'scale(.9)', opacity: 0 }]]);
  fx(k.lightIn('g-warm', [190, 60], 330, 150), [[1100, { opacity: 0 }, 'ease-out'], [1350, { opacity: 0.55 }, 'ease-out'], [1900, { opacity: 0.45 }, eio], [3000, { opacity: 0 }]]);

  // ── gather: sparks drawn in from the sky to the bell
  for (let i = 0; i < 11; i++) {
    const t0 = 200 + i * 78 + rand() * 40, dur = 520 + rand() * 180, a = -Math.PI * (0.05 + 0.9 * rand()), r0 = 25 + rand() * 40, sz = 3 + rand() * 3;
    const P = [B[0] + 10 + Math.cos(a) * r0 * 1.4, B[1] + Math.sin(a) * r0];
    h.fly(k.picIn('spark', P, sz, sz), P, (f) => { const q = f * f * (3 - 2 * f), b = Bt(t0 + dur * f); return [P[0] + (b[0] - P[0]) * q, P[1] + (b[1] - P[1]) * q]; }, t0, t0 + dur, (f) => 0.6 + 0.8 * Math.sin(Math.PI * f), (f) => (f < 0.1 ? f * 9 : f > 0.85 ? (1 - f) / 0.15 : 1), 0, 0, 50, (f) => f);
  }

  // ── RELEASE (1150): sound rings, embers flung along the blast, the stream of fire to T
  for (let i = 0; i < 3; i++) h.ride(k.pic(h.ring, B, 46, 46), B, Wh, [[1140 + i * 110, 0.2, 0], [1190 + i * 110, 0.5, 0.9], [1700 + i * 110, 2.6, 0]]);
  for (let i = 0; i < 12; i++) {
    const t = 1200 + i * 62 + rand() * 20, life = 500 + rand() * 400, v = 28 + rand() * 50, ang = ((aB + (rand() - 0.5) * 50) * Math.PI) / 180, sz = 3 + rand() * 3;
    const px = (f) => Math.cos(ang) * v * f, py = (f) => Math.sin(ang) * v * f * 0.8 + 16 * f * f - 8 * f;
    fx(k.pic('spark', E1, sz, sz), [0, 0.3, 0.7, 1].map((f, j) => [t + life * f, { transform: `${k.T(px(f), py(f))} scale(${(1.1 - 0.7 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']));
  }
  const bz = h.arcPath(E1, T, 18 + Math.hypot(T[0] - E1[0], T[1] - E1[1]) * 0.07);
  for (let i = 0; i < 14; i++) {
    const t0 = 1170 + i * 48, t1 = t0 + 520, id = i % 4, sz = [26, 18, 24, 20][id], side = (rand() - 0.5) * 12, r = Math.round(rand() * 360);
    const bz2 = (f) => { const p = bz(f); return [p[0], p[1] + side * Math.sin(Math.PI * f)]; };
    h.fly(k.pic(['puff', 'spark', 'puffHot', 'puffCool'][id], E1, sz, sz), E1, bz2, t0, t1, (f) => (id === 1 ? 1.4 - 0.5 * f : 0.5 + 0.9 * f), (f) => (f < 0.1 ? f * 9 : f > 0.92 ? 0.3 : 0.92), r, 120, 40);
  }
  for (let i = 0; i < 3; i++) { // tongues of flame riding the head of the stream
    const t0 = 1190 + i * 80;
    h.fly(k.pic(i % 2 ? 'flame' : 'flame2', E1, 11, 18, { base: true }), E1, bz, t0, t0 + 500, (f) => 0.6 + 0.6 * f, (f) => (f < 0.1 ? f * 9 : 0.9 * (1 - f * f * 0.5)), 0, 0, 40);
  }

  // ── IMPACT (1700): a burst, a scorch smouldering where it lands
  h.burst(T, BEATS.impact, { size: 1.15, flames: 3, linger: 1000 });
  const sc = ((rand() - 0.5) * 16).toFixed(1), gl = [[1740, { transform: `rotate(${sc}deg) scale(.15, .07)`, opacity: 0 }, 'ease-out'], [2300, { transform: `rotate(${sc}deg) scale(1, .45)`, opacity: 0.95 }]];
  for (let t = 2450, i = 0; t < 3000; t += 150, i++) gl.push([t, { transform: `rotate(${sc}deg) scale(1, .45)`, opacity: i % 2 ? 1 : 0.7 }, eio]);
  gl.push([3300, { transform: `rotate(${sc}deg) scale(1, .45)`, opacity: 0 }]);
  fx(k.pic('scorch1:char', [T[0], T[1] + 8], 50, 50, { lit: false, low: true }), [[1740, { transform: `rotate(${sc}deg) scale(.15, .07)`, opacity: 0 }, 'ease-out'], [2300, { transform: `rotate(${sc}deg) scale(1, .45)`, opacity: 1 }], [3000, { transform: `rotate(${sc}deg) scale(1, .45)`, opacity: 1 }, eio], [3500, { transform: `rotate(${sc}deg) scale(1, .45)`, opacity: 0 }]]);
  fx(k.pic('scorch1:glow', [T[0], T[1] + 8], 50, 50), gl);
}
