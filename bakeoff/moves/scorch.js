// Scorch: the hand cocks back, gathers its white-hot bolt, flicks it away, and the wolf is struck.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker (a damage spell: the bolt is the attack),
// element fire (changed from the suggested lightning: the picture's bolt is a white-hot ball with a comet
// of flame, lit orange; nothing in it is lightning). Facing right.
//   0-780     gather: the wolf drifts closer in its leap; the bolt draws in to the fingertips, small and
//             spitting, its glow swelling, embers pulled in; the wrist cocks back (fingers dip).
//   780-850   the wind-up: bolt and hand coil back a hair.
//   850       RELEASE: the wrist snaps toward T, the bolt tears off the fingers along an arc, a comet of
//             embers and flame behind it, lighting the ravine as it passes.
//   1180      IMPACT at T: flash, rings, billows and sparks flung out, smoke; (alone) the wolf is
//             punched back along the bolt's line, tumbling, and shows its snarl lit white.
//   1180-2300 the wolf tumbles and falls back to its leap; the hand follows through and relaxes.
//   2000-3200 a new bolt is kindled at the fingertips: a pinprick that swells to the drawn bolt, with
//             embers drawn in. At rest as drawn from 3300 (END 3700).
// Aimed: T = k.aim || the wolf's chest (spec.hit). The hand turns from its wrist toward T, the bolt turns
// about its tail and flies from emit to T; the wolf only reacts when T is on it.
import { SPARK, kit } from './_fx.js';
export const END = 3700;
export const BEATS = { release: 850, impact: 1180, settle: 3300 };
export const STILLS = [450, 800, 950, 1100, 1220, 1500, 2300, 3500];
export const textures = {
  spark: SPARK,
  mote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 220 + 30 * c, 140 + 100 * c * c, Math.min(1, c * c * c * 2.4)]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out';
  const h = kit(k);
  const hand = k.part('hand'), bolt = k.part('bolt'), wolf = k.part('wolf');
  const E = k.spec.emit, TIP = k.spec.tip, WR = k.spec.wrist, HIT = k.spec.hit;
  const T = k.aim || HIT;
  const onWolf = Math.hypot(T[0] - HIT[0], T[1] - HIT[1]) < 45;
  const RE = 850, IM = 1180; // release, impact
  const dx = T[0] - E[0], dy = T[1] - E[1], len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
  const deg = (r) => (r * 180) / Math.PI;
  const drawn = Math.atan2(TIP[1] - E[1], TIP[0] - E[0]); // the bolt's drawn heading
  const L = Math.hypot(TIP[0] - E[0], TIP[1] - E[1]);

  // ── the hand: cocks back, snaps toward T, follows through, relaxes
  const rest = Math.atan2(163 - WR[1], 95 - WR[0]); // wrist to its fingertips as drawn
  const turn = Math.max(-40, Math.min(40, deg(Math.atan2(T[1] - WR[1], T[0] - WR[0]) - rest)));
  act(hand, [[0, { transform: 'none' }, eio], [520, { transform: `${k.T(-1.5, 1.2)} rotate(${(turn + 9).toFixed(1)}deg)` }, eio], [780, { transform: `${k.T(-2.6, 2)} rotate(${(turn + 15).toFixed(1)}deg)` }, 'ease-in'],
    [RE + 60, { transform: `${k.T(2, -1.5)} rotate(${(turn - 5).toFixed(1)}deg)` }, 'ease-out'], [1250, { transform: `${k.T(3.4, -2)} rotate(${(turn - 7).toFixed(1)}deg)` }, eio],
    [1900, { transform: `${k.T(1.2, -0.6)} rotate(${(turn * 0.35).toFixed(1)}deg)` }, eio], [2700, { transform: `${k.T(0, 0.4)} rotate(1.2deg)` }, eio], [3300, { transform: 'none' }]]);

  // ── the bolt: draws in small at the fingertips, coils, tears off along its arc, is kindled anew
  // (it turns about its tail, at the fingers: its head is put at P(f); the part is drawn tail-first)
  const bz = h.arcPath(TIP, T, 10 + Math.min(16, len * 0.08));
  const at = (P, s, o) => { // head at P, bolt turned to its heading, scaled s about the tail
    const p0 = P, p1 = bz(Math.min(1, 0));
    const ang = Math.atan2(P[1] - E[1], P[0] - E[0]);
    const r = ang - drawn, c = Math.cos(r), sn = Math.sin(r);
    const bx = (TIP[0] - E[0]) * s, by = (TIP[1] - E[1]) * s;
    const hx = E[0] + bx * c - by * sn, hy = E[1] + bx * sn + by * c;
    return { transform: `${k.T(P[0] - hx, P[1] - hy)} rotate(${deg(r).toFixed(1)}deg) scale(${s.toFixed(3)})`, opacity: o };
  };
  void L;
  const bk = [[0, { transform: 'scale(1)', opacity: 1 }, eio]];
  for (let t = 120, i = 0; t < 780; t += 90, i++) bk.push([t, { transform: `${k.T(0, (i % 2 ? 0.6 : -0.4))} scale(${(1 - 0.5 * Math.min(1, t / 520) + (i % 2 ? 0.06 : -0.03)).toFixed(2)})`, opacity: 1 }, eio]);
  bk.push([RE - 40, { transform: 'scale(.4)', opacity: 1 }, 'ease-in']);
  const N = 8, T0 = RE, T1 = IM;
  for (let i = 0; i <= N; i++) {
    const f = i / N, q = f * f * 0.6 + f * 0.4, P = bz(q), s = 0.5 + 0.75 * Math.sin(Math.min(1, f * 1.2) * Math.PI * 0.6);
    bk.push([T0 + (T1 - T0) * f, at(P, Math.min(1.25, 0.5 + f * 0.9), i === N ? 0.4 : 1), 'linear']);
  }
  bk.push([IM + 40, { ...at(T, 1.25, 0), }], [1900, { transform: 'scale(.04)', opacity: 0 }, 'ease-out'], [2400, { transform: 'scale(.5)', opacity: 0.9 }, 'ease-out'], [2850, { transform: 'scale(1.15)', opacity: 1 }, eio], [3150, { transform: 'scale(.97)', opacity: 1 }, eio], [3300, { transform: 'none', opacity: 1 }]);
  act(bolt, bk);

  // ── the wolf: closer in its leap as the bolt gathers; struck back and tumbling; falls back to its leap
  if (onWolf) {
    const kx = ux * 15, ky = uy * 10, tum = ux >= 0 ? -9 : 9;
    act(wolf, [[0, { transform: 'none' }, eio], [IM - 80, { transform: `${k.T(-3, 1.2)} rotate(1deg)` }, 'ease-in'], [IM + 60, { transform: `${k.T(-3 + kx, 1.2 + ky)} rotate(${tum}deg) scale(.96)` }, 'ease-out'],
      [IM + 260, { transform: `${k.T(-2 + kx * 1.2, 2 + ky * 1.3 - 2)} rotate(${tum * 1.5}deg) scale(.95)` }, eio], [1800, { transform: `${k.T(kx * 0.35, ky * 0.4 + 3)} rotate(${tum * 0.4}deg)` }, eio], [2600, { transform: `${k.T(0, 0.4)} rotate(-1deg)` }, eio], [3300, { transform: 'none' }]]);
  } else {
    act(wolf, [[0, { transform: 'none' }, eio], [IM, { transform: `${k.T(-3, 1.2)} rotate(1deg)` }, eio], [2400, { transform: `${k.T(-1, 0.6)}` }, eio], [3300, { transform: 'none' }]]);
  }

  // ── the glow at the fingertips: swells as it gathers, flares at the release, dims as the bolt is gone and kindles anew
  const g = [[100, { transform: 'scale(.5)', opacity: 0 }, 'ease-out']];
  for (let t = 420, i = 0; t < 800; t += 100, i++) g.push([t, { transform: `scale(${(0.9 + (t / 800) * 0.4 + (i % 2 ? 0.1 : -0.04)).toFixed(2)})`, opacity: +(0.4 + 0.4 * (t / 800)).toFixed(2) }, eio]);
  g.push([RE + 20, { transform: 'scale(2.1)', opacity: 1 }, 'ease-out'], [1300, { transform: 'scale(1)', opacity: 0.2 }, eio], [1900, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [2500, { transform: 'scale(.7)', opacity: 0.4 }, eio], [2900, { transform: 'scale(1.1)', opacity: 0.55 }, eio], [3400, { transform: 'scale(.8)', opacity: 0 }]);
  fx(k.light('g-warm', E, 58), g);
  // the ravine lit as the bolt crosses it, and the end of the ravine
  const mid = [(E[0] + T[0]) / 2, (E[1] + T[1]) / 2 - 8];
  fx(k.lightIn('g-city', mid, 280, 200), [[RE - 40, { opacity: 0 }, 'ease-out'], [RE + 150, { opacity: 0.8 }, 'ease-out'], [IM + 60, { opacity: 1 }, eio], [1500, { opacity: 0.45 }, eio], [2300, { opacity: 0 }]]);
  // a light riding the bolt's head
  const [X0, Y0] = [TIP[0], TIP[1]], hl = [[RE - 20, { transform: 'scale(.4)', opacity: 0 }, 'ease-out']];
  for (let i = 0; i <= N; i++) {
    const f = i / N, q = f * f * 0.6 + f * 0.4, P = bz(q);
    hl.push([T0 + (T1 - T0) * f, { transform: `${k.T(P[0] - X0, P[1] - Y0)} scale(${(0.9 + 0.5 * f).toFixed(2)})`, opacity: i === N ? 0.5 : 1 }, 'linear']);
  }
  hl.push([IM + 80, { transform: `${k.T(T[0] - X0, T[1] - Y0)} scale(.6)`, opacity: 0 }]);
  fx(k.light('g-warm', TIP, 30), hl);

  // ── embers drawn into the fingers while it gathers, and again as the new bolt is kindled
  const pull = (t0, dur, from, sz) => {
    const ks = [];
    for (let t = t0; t <= t0 + dur + 1; t += 50) {
      const f = Math.min(1, (t - t0) / dur), e = f * f * (3 - 2 * f);
      ks.push([Math.min(t, t0 + dur), { transform: `${k.T((E[0] - from[0]) * e, (E[1] - from[1]) * e)} scale(${(0.5 + 0.8 * Math.sin(Math.PI * f)).toFixed(2)})`, opacity: f > 0.95 ? 0 : f < 0.1 ? f * 10 : 1 }, 'linear']);
    }
    fx(k.pic('mote', from, sz, sz), ks);
  };
  for (let i = 0; i < 16; i++) {
    const a = rand() * Math.PI * 2, r0 = 22 + rand() * 30;
    pull(120 + i * 42 + rand() * 30, 440 + rand() * 120, [E[0] + Math.cos(a) * r0 * 1.2, E[1] + Math.sin(a) * r0 * 0.8], 3 + rand() * 3);
  }
  for (let i = 0; i < 8; i++) {
    const a = rand() * Math.PI * 2, r0 = 20 + rand() * 22;
    pull(2050 + i * 90 + rand() * 40, 440 + rand() * 100, [E[0] + Math.cos(a) * r0 * 1.2, E[1] + Math.sin(a) * r0 * 0.8], 3 + rand() * 2.5);
  }

  // ── the flight (850-1180): a comet of flame and embers along its arc, spitting sparks
  for (let i = 0; i < 20; i++) {
    const t0 = RE + 4 + i * 14, t1 = IM + 20 + i * 8, id = i % 3, sz = [14, 5, 11][id], side = (rand() - 0.5) * 7;
    const bz2 = (f) => { const p = bz(f); return [p[0] + 0, p[1] + side * Math.sin(Math.PI * f)]; };
    h.fly(k.pic(['puffHot', 'spark', 'puff'][id], TIP, sz, sz), TIP, bz2, t0, t1, (f) => (id === 1 ? 1.1 - 0.4 * f : 0.5 + 0.8 * f), (f) => (f < 0.1 ? f * 9 : f > 0.94 ? 0.2 : 0.9), Math.round(rand() * 360), 90, 40, (f) => f * f * 0.6 + f * 0.4);
  }
  for (let i = 0; i < 9; i++) { // sparks shed along the way, falling
    const f = 0.1 + i * 0.1, P = bz(f * f * 0.6 + f * 0.4), t = RE + (IM - RE) * f;
    fx(k.pic('spark', P, 4, 4), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 70, { transform: 'scale(1)', opacity: 1 }], [t + 420, { transform: `${k.T((rand() - 0.5) * 8, 10 + rand() * 10)} scale(.2)`, opacity: 0 }]]);
  }
  fx(k.pic('spark', E, 22, 22), [[RE - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [RE + 40, { transform: 'scale(1.8) rotate(25deg)', opacity: 1 }, 'ease-out'], [RE + 260, { transform: 'scale(.6) rotate(70deg)', opacity: 0 }]]);

  // ── the impact (1180): burst in the bolt's colours; the wolf's snarl lit white
  h.burst(T, IM, { size: 1.05, flames: 0, linger: 700 });
  fx(k.light('g-warm', T, 36), [[IM - 20, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(1.4)', opacity: 1 }, 'ease-out'], [IM + 300, { transform: 'scale(1)', opacity: 0.55 }, eio], [IM + 700, { transform: 'scale(.8)', opacity: 0.35 }, eio], [IM + 1200, { transform: 'scale(.6)', opacity: 0 }]]);
  // a ring of embers thrown off the wolf's coat and left drifting up
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + rand() * 0.6, d = 10 + rand() * 16, t = IM + 60 + rand() * 120, p = [T[0] + Math.cos(a) * 6, T[1] + Math.sin(a) * 5];
    fx(k.pic('mote', p, 3.5 + rand() * 2, 3.5 + rand() * 2), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 100, { transform: `${k.T(Math.cos(a) * d * 0.5, Math.sin(a) * d * 0.4)} scale(1)`, opacity: 1 }], [t + 900, { transform: `${k.T(Math.cos(a) * d + (rand() - 0.5) * 6, Math.sin(a) * d * 0.5 - 18 - rand() * 14)} scale(.3)`, opacity: 0 }]]);
  }
  // the hand's follow-through: a puff of heat off the fingertips as the bolt leaves
  for (let i = 0; i < 3; i++) {
    const t = RE + 20 + i * 70, r = Math.round(rand() * 360);
    fx(k.pic('puffHot', E, 13, 13), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 90, { transform: `${k.T(ux * 6, uy * 6)} rotate(${r + 30}deg) scale(1)`, opacity: 0.85 }], [t + 380, { transform: `${k.T(ux * 12, uy * 12 - 6)} rotate(${r + 80}deg) scale(1.7)`, opacity: 0 }]]);
  }
}
