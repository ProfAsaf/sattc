// Apex Predator: the sabre-tooth pounces and rakes with a fire-clawed swipe.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker (as suggested), element fire
// (its stripes smoulder; the jungle burns around it).
//   0-880     gather: it rocks back on its haunches, coiling (squash, nose up), the front legs
//             drawn up, its stripes blazing brighter; embers are sucked in from the burning
//             jungle and run along its spine.
//   900       RELEASE: it springs at T; a fire trail streams off its back; the front legs
//             swing down in a rake, and a ribbon of fire leaves the claws for T.
//   1250      IMPACT at T: flash, rings, billows and sparks, flames catch, and three claw
//             streaks of fire score the spot.
//   1250-2500 follow-through: it overshoots, lands heavily (squash) and rocks back; it has
//             won, so it swells with the fire (a glow along the stripes, a deep breath),
//             then eases back down. At rest as drawn from 3300 (END 3700).
// Aimed: T = k.aim || [262, 146] (prey just beyond its claws). It works in its own
// (right-facing) space and is mirrored as a whole, through a sliver, when T is on its left, so
// every point of the strike comes from its claws (spec.emit, carried by the same transforms).
import { SPARK, mul, rot, scl, tr, app, curve, kit } from './_fx.js';
export const END = 3700;
export const BEATS = { release: 900, impact: 1250, settle: 3300 };
export const STILLS = [400, 800, 1000, 1150, 1300, 1700, 2300, 3500];
export const textures = { spark: SPARK };

export function build(k) {
  const { fx, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const body = k.part('body'), paws = k.part('paws'), stripes = k.part('stripes'), face = k.part('face');
  const MID = k.spec.mid, SH = k.spec.shoulder, E = k.spec.emit;
  const T = k.aim || [262, 146];
  const mirrored = T[0] < MID[0] - 10;
  const Tl = mirrored ? [2 * MID[0] - T[0], T[1]] : T; // the target in its own (right-facing) space

  // direction of the leap
  const dx = Tl[0] - MID[0], dy = Tl[1] - MID[1], len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI, lr = Math.max(-14, Math.min(14, ang * 0.45));

  const flip = mirrored ? curve([[0, 1], [380, -1], [2750, -1], [3200, 1]]) : () => 1;
  const MIR = (t) => { const v = flip(t); return scl(Math.sign(v || 1) * Math.max(0.06, Math.abs(v)), 1, MID[0], 0); };
  const lunge = curve([[0, 0], [520, -0.4], [880, -0.55, 'in'], [1040, 1, 'out'], [1250, 1.08], [1480, 0.4], [1800, -0.06], [2250, 0.02], [3000, 0]]);
  const turn = curve([[0, 0], [520, -5], [880, -9, 'in'], [1040, lr, 'out'], [1250, lr + 2], [1600, -2.5], [2000, 1], [3000, 0]]);
  const squash = curve([[0, 1], [520, 0.97], [880, 0.925, 'in'], [1040, 1.05, 'out'], [1250, 1.03], [1480, 0.955], [1800, 1.01], [2400, 1], [3000, 1]]);
  const swell = curve([[0, 1], [1500, 1], [1950, 1.05], [2500, 1.05], [3200, 1]]);
  const psi = curve([[0, 0], [520, -18], [880, -32, 'in'], [1020, 36, 'out'], [1250, 30], [1500, 6], [1900, -2], [2400, 0]]); // the front legs, about the shoulder
  const BODY = (t) => {
    const L = lunge(t), d = L * (L < 0 ? 20 : 38), s = squash(t), g = swell(t);
    return mul(tr(ux * d, uy * d), mul(rot(turn(t), MID[0], MID[1]), mul(scl(1 + (1 - s) * 0.6, s, MID[0], 138), scl(g, g, MID[0], 138))));
  };
  const WB = (t) => mul(MIR(t), BODY(t));
  const WP = (t) => mul(WB(t), rot(psi(t), SH[0], SH[1]));
  h.drive(body, MID, WB, 3300);
  h.drive(stripes, MID, WB, 3300);
  h.drive(face, MID, WB, 3300);
  h.drive(paws, SH, WP, 3300);

  // ── light: the jungle takes the glow; lights ride its spine and claws
  fx(k.lightIn('g-city', [150, 150], 320, 110, { under: true }), [[200, { opacity: 0 }, 'ease-out'], [900, { opacity: 0.45 }, eio], [1300, { opacity: 0.75 }, eio], [2200, { opacity: 0.35 }, eio], [3300, { opacity: 0 }]]);
  const spine = [[128, 82], [152, 80], [175, 84]];
  spine.forEach((p, i) => h.ride(k.light('g-ember', p, 42), p, WB, [[200 + i * 80, 0.5, 0], [800, 1.0, 0.7], [1040, 1.25, 0.95], [1300, 1.1, 0.8], [1950, 1.5, 0.85], [2600, 1.0, 0.35], [3300, 0.6, 0]]));
  h.ride(k.light('g-warm', E, 36), E, WP, [[700, 0.4, 0], [900, 0.9, 0.7], [1040, 1.4, 1], [1300, 1.1, 0.6], [1700, 0.7, 0]]);
  const J = k.spec.jaws;
  h.ride(k.light('g-warm', J, 26), J, WB, [[500, 0.5, 0], [900, 1.0, 0.8], [1100, 1.2, 0.9], [1500, 0.8, 0.3], [1800, 0.5, 0]]);

  // ── gathering: embers pulled in from the burning jungle and running along its spine
  for (let i = 0; i < 14; i++) {
    const t0 = 200 + i * 48 + rand() * 30, dur = 420 + rand() * 120, sz = 3 + rand() * 2.5, a = rand() * Math.PI * 2, r0 = 40 + rand() * 30;
    const from = [MID[0] + Math.cos(a) * r0 * 1.4, MID[1] + 14 + Math.sin(a) * r0 * 0.6], to0 = spine[i % 3], ks = [];
    for (let t = t0; t <= t0 + dur + 1; t += 50) {
      const f = Math.min(1, (t - t0) / dur), g = f * f * (3 - 2 * f), c = app(WB(Math.min(t, 3300)), to0);
      ks.push([Math.min(t, t0 + dur), { transform: `${k.T(from[0] + (c[0] - from[0]) * g - from[0], from[1] + (c[1] - from[1]) * g - from[1])} scale(${(0.5 + 0.7 * Math.sin(Math.PI * f)).toFixed(2)})`, opacity: f > 0.95 ? 0 : f < 0.1 ? f * 10 : 1 }, 'linear']);
    }
    fx(k.pic('spark', from, sz, sz), ks);
  }
  // flames licking up off its stripes as it coils
  for (let i = 0; i < 4; i++) h.flicker(k.pic(i % 2 ? 'flame' : 'flame2', [128 + i * 15, 84], 8 + rand() * 3, 13 + rand() * 6, { base: true }), 480 + i * 90, 880 + rand() * 60);

  // ── the leap: fire streaming off its back
  const dir = mirrored ? -1 : 1;
  for (let i = 0; i < 12; i++) {
    const t0 = 930 + i * 38, r = Math.round(rand() * 360), p0 = app(WB(t0), [130 + rand() * 50, 86 + rand() * 10]);
    fx(k.pic(i % 3 === 2 ? 'puffCool' : 'puffHot', p0, 18, 18), [[t0, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 100, { transform: `${k.T(-dir * 4, -2)} rotate(${r + 25}deg) scale(1)`, opacity: 0.9 }],
      [t0 + 480, { transform: `${k.T(-dir * 12, -14 - rand() * 8)} rotate(${r + 70}deg) scale(1.7)`, opacity: 0 }]]);
  }

  // ── the strike (900-1250): a ribbon of fire off its claws to T
  const M = app(WP(1060), E), bz = h.arcPath(M, T, 10);
  for (let i = 0; i < 18; i++) {
    const t0 = 960 + i * 18, t1 = 1190 + i * 14, id = i % 3, sz = [20, 6, 16][id], side = (rand() - 0.5) * 8, r = Math.round(rand() * 360);
    const bz2 = (f) => { const p = bz(f); return [p[0], p[1] + side * Math.sin(Math.PI * f)]; };
    h.fly(k.pic(['puffHot', 'spark', 'puff'][id], M, sz, sz), M, bz2, t0, t1, (f) => (id === 1 ? 1.2 - 0.4 * f : 0.6 + 0.9 * f), (f) => (f < 0.1 ? f * 9 : f > 0.94 ? 0.2 : 0.95), r, 100);
  }
  h.burst(T, 1250, { flames: 5, linger: 1000, size: 1.25 });
  // three claws of fire score T (streaks, raking down and across)
  const streak = k.svg('<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2c0" stop-opacity="0"/><stop offset=".35" stop-color="#ffd27a"/><stop offset=".7" stop-color="#ff8a3a"/><stop offset="1" stop-color="#ff5a14" stop-opacity="0"/></linearGradient></defs><path d="M4,3 C22,10 38,26 52,50 C36,32 20,17 4,3Z" fill="url(#g)"/>', 56, 54);
  for (let i = 0; i < 3; i++) {
    const o = (i - 1) * 9 * dir, p = [T[0] + o - 4 * dir, T[1] - 2 + (i - 1) * 4], t = 1270 + i * 50;
    fx(k.pic(streak, p, 32, 32), [[t, { transform: `scale(${dir * 0.3}, .3)`, opacity: 0 }, 'ease-out'], [t + 90, { transform: `scale(${dir * 1.15}, 1.15)`, opacity: 1 }, 'ease-out'], [t + 330, { transform: `scale(${dir * 1.25}, 1.2)`, opacity: 0.8 }], [t + 800, { transform: `scale(${dir * 1.3}, 1.2)`, opacity: 0 }]]);
  }
  // a scorch left where the blow lands, healing
  const sc = ((rand() - 0.5) * 16).toFixed(1), gl = [[1300, { transform: `rotate(${sc}deg) scale(.15, .07)`, opacity: 0 }, 'ease-out'], [1800, { transform: `rotate(${sc}deg) scale(1, .45)`, opacity: 0.95 }]];
  for (let t = 1950, i = 0; t < 2700; t += 150, i++) gl.push([t, { transform: `rotate(${sc}deg) scale(1, .45)`, opacity: i % 2 ? 1 : 0.7 }, eio]);
  gl.push([3100, { transform: `rotate(${sc}deg) scale(1, .45)`, opacity: 0 }]);
  fx(k.pic('scorch2:char', [T[0], T[1] + 10], 44, 44, { lit: false, low: true }), [[1300, { transform: `rotate(${sc}deg) scale(.15, .07)`, opacity: 0 }, 'ease-out'], [1800, { transform: `rotate(${sc}deg) scale(1, .45)`, opacity: 1 }], [2700, { transform: `rotate(${sc}deg) scale(1, .45)`, opacity: 1 }, eio], [3300, { transform: `rotate(${sc}deg) scale(1, .45)`, opacity: 0 }]]);
  fx(k.pic('scorch2:glow', [T[0], T[1] + 10], 44, 44), gl);

  // ── after: it has won; embers lift off its stripes as it swells and breathes out
  for (let i = 0; i < 12; i++) {
    const t = 1550 + i * 120 + rand() * 60, p0 = app(WB(Math.min(t, 3300)), [110 + rand() * 90, 84 + rand() * 20]);
    fx(k.pic('spark', p0, 4, 4), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 100, { transform: 'scale(1)', opacity: 1 }], [t + 800, { transform: `${k.T((rand() - 0.5) * 14, -22 - rand() * 14)} scale(.25)`, opacity: 0 }]]);
  }
}
