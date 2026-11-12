// Crescendo (a Spell that deals damage equal to the Spells played this turn; role attacker, element fire: the mage is the
// spell, her spiral of flame is its power). She conducts: each sweep of her arms swells the spiral louder and brighter,
// three beats, each bigger than the last, then she flings the fire from the white-hot ring at its top to the target,
// where it bursts, and the spiral sinks back.
//
// PLAN (drawing units 300 x 210, ms of the move). T = k.aim, else a point down on the right of her picture.
//   0-1250   GATHER, three beats (400, 800, 1150), each bigger: both arms sweep down and up, the spiral's front runs
//            surge out (scale about its base) and turn (they swing narrow and wide, as it were winding up), the ring's
//            light swells, sparks are drawn up the spiral into the ring, the glow at her feet pulses.
//   1250     BEATS.release: the arm on T's side throws, pointing at T; the fire in the ring (emit) is flung: billows
//            streaming along an arc to T (12 hot billows, embers and smoke); the spiral's front runs dim (the fire has
//            left them) while the other arm falls.
//   1750     BEATS.impact: the burst at T (flash, rings, billows flung out, sparks, flames, smoke).
//   1750-3700 follow-through: the throwing arm recoils and eases home, the spiral swells back up by 3700; embers drift.
//   3700     BEATS.settle (END 4200).
import { kit } from './_fx.js';
export const END = 4200;
export const BEATS = { release: 1250, impact: 1750, settle: 3700 };
export const STILLS = [300, 700, 1100, 1300, 1550, 1800, 2500, 3900];
export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 200 + 55 * c * c, 110 + 120 * c * c * c, Math.min(1, c * c * 2.6)]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const S = k.spec, E = S.emit, T = k.aim || [262, 138];
  const armL = k.part('armL'), armR = k.part('armR'), sp = k.part('spiralF');
  const right = T[0] >= 150; // the arm on T's side throws
  const norm = (a) => ((a + 540) % 360) - 180;
  const ang = (p, q) => (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI;
  const throwArm = right ? armR : armL, otherArm = right ? armL : armR;
  const sh = right ? S.shoulderR : S.shoulderL, rest = right ? ang(S.shoulderR, [179, 84]) : ang(S.shoulderL, [125, 82]);
  const aimRot = Math.max(-75, Math.min(75, norm(ang(sh, T) - rest)));
  const sgn = right ? 1 : -1; // + turns the right arm down and out, the left arm up and in
  const L = (d) => `rotate(${(-sgn * d).toFixed(0)}deg)`, R = (d) => `rotate(${(sgn * d).toFixed(0)}deg)`;

  // ── her arms: conducting three beats, then the throw
  // (a beat: both arms sink, then sweep up wide; the sign of the throw's rotation is that of the throwing arm's side)
  const wave = (side) => (d) => `rotate(${(side * d).toFixed(0)}deg)`; // side +1 for the right arm: + lowers it; the left arm: - lowers it
  const wR = wave(1), wL = wave(-1);
  const beats = [[250, 12], [400, -8], [650, 16], [800, -12], [1050, 22], [1170, -16]]; // [ms, degrees lowered (+) or raised (-)]
  const conduct = (w, extra) => [[0, { transform: 'none' }, eio], ...beats.map(([t, d]) => [t, { transform: w(d) }, eio]), ...extra];
  const aimed = `rotate(${aimRot.toFixed(0)}deg)`;
  if (right) {
    act(armR, conduct(wR, [[1250, { transform: aimed }, 'ease-out'], [1650, { transform: `rotate(${(aimRot + 10).toFixed(0)}deg)` }, eio], [2100, { transform: `rotate(${(aimRot * 0.4).toFixed(0)}deg)` }, eio], [3700, { transform: 'none' }]]));
    act(armL, conduct(wL, [[1250, { transform: wL(-16) }, eio], [1900, { transform: wL(6) }, eio], [3700, { transform: 'none' }]]));
  } else {
    act(armL, conduct(wL, [[1250, { transform: aimed }, 'ease-out'], [1650, { transform: `rotate(${(aimRot - 10).toFixed(0)}deg)` }, eio], [2100, { transform: `rotate(${(aimRot * 0.4).toFixed(0)}deg)` }, eio], [3700, { transform: 'none' }]]));
    act(armR, conduct(wR, [[1250, { transform: wR(-16) }, eio], [1900, { transform: wR(6) }, eio], [3700, { transform: 'none' }]]));
  }
  void throwArm; void otherArm; void L; void R;

  // ── the spiral: three surges, each bigger (it swings narrow and wide as it winds up); dim once the fire has left, then back
  act(sp, [[0, { transform: 'none', opacity: 1 }, eio], [400, { transform: 'scale(.95, 1.02)', opacity: 1 }, eio], [520, { transform: 'scale(1.04, 1.03)', opacity: 1 }, eio], [800, { transform: 'scale(.93, 1.04)', opacity: 1 }, eio],
    [930, { transform: 'scale(1.08, 1.06)', opacity: 1 }, eio], [1150, { transform: 'scale(.9, 1.07)', opacity: 1 }, eio], [1260, { transform: 'scale(1.13, 1.1)', opacity: 1 }, 'ease-out'], [1500, { transform: 'scale(1.0, 1.04)', opacity: 0.45 }, eio],
    [2300, { transform: 'scale(.98, 1.02)', opacity: 0.55 }, eio], [3700, { transform: 'none', opacity: 1 }]]);

  // ── light: the ring swelling with each beat, the ground glow, then the ring spent
  const ring = [[100, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [400, { transform: 'scale(.8)', opacity: 0.5 }, eio], [520, { transform: 'scale(.95)', opacity: 0.4 }, eio], [930, { transform: 'scale(1.2)', opacity: 0.75 }, eio], [1060, { transform: 'scale(1.05)', opacity: 0.6 }, eio], [1260, { transform: 'scale(1.9)', opacity: 1 }, 'ease-out'], [1500, { transform: 'scale(1.2)', opacity: 0.6 }, eio], [2400, { transform: 'scale(.9)', opacity: 0.2 }], [3200, { transform: 'scale(.7)', opacity: 0 }]];
  fx(k.light('g-warm', E, 96), ring);
  fx(k.light('g-warm', [150, 188], 120, 26), [[100, { opacity: 0 }, 'ease-out'], [420, { opacity: 0.55 }, eio], [820, { opacity: 0.7 }, eio], [1260, { opacity: 1 }, eio], [2200, { opacity: 0.6 }, eio], [3500, { opacity: 0 }]]);
  fx(k.light('g-warm', [150, 120], 170, 150), [[300, { opacity: 0 }, 'ease-out'], [1260, { opacity: 0.55 }, eio], [1800, { opacity: 0.35 }, eio], [3200, { opacity: 0 }]]);

  // ── sparks drawn up the spiral into the ring on each beat (they climb round the helix's front, left to right)
  for (let b = 0; b < 3; b++) {
    const t0 = [380, 780, 1110][b];
    for (let i = 0; i < 6; i++) {
      const t = t0 + i * 38, dur = 360 + rand() * 80, x0 = 150 + (rand() - 0.5) * 50, y0 = 176 - rand() * 20;
      const via = [150 + (i % 2 ? -1 : 1) * (30 + b * 18), 120 - i * 6];
      const ks = [];
      for (let j = 0; j <= 6; j++) {
        const f = j / 6, q = 1 - f;
        const x = q * q * x0 + 2 * q * f * via[0] + f * f * E[0], y = q * q * y0 + 2 * q * f * via[1] + f * f * E[1];
        ks.push([t + dur * f, { transform: `${k.T(x - x0, y - y0)} scale(${(0.5 + 0.7 * Math.sin(Math.PI * f)).toFixed(2)})`, opacity: j === 0 || j === 6 ? 0 : 1 }, 'linear']);
      }
      fx(k.pic('spark', [x0, y0], 4 + rand() * 2.5, 4 + rand() * 2.5), ks);
    }
  }
  // the ring's own tongues of flame, licking up as it swells
  for (let i = 0; i < 4; i++) h.flicker(k.pic(i % 2 ? 'flame' : 'flame2', [E[0] + (i - 1.5) * 10, E[1] + 8], 11 + rand() * 3, 20 + rand() * 8, { base: true }), 600 + i * 120, 1300);

  // ── the throw (1250): fire from the ring along an arc to T
  const bz = h.arcPath(E, T, Math.max(30, Math.hypot(T[0] - E[0], T[1] - E[1]) * 0.25));
  for (let i = 0; i < 20; i++) {
    const t0 = 1250 + i * 26, t1 = 1740 + i * 14, id = i % 5, sz = [26, 8, 22, 20, 16][id], side = (rand() - 0.5) * 10, r = Math.round(rand() * 360);
    const bz2 = (f) => { const p = bz(f); return [p[0], p[1] + side * Math.sin(Math.PI * f)]; };
    h.fly(k.pic(['puff', 'spark', 'puffHot', 'puffCool', 'puffHot'][id], E, sz, sz), E, bz2, t0, t1, (f) => (id === 1 ? 1.3 - 0.5 * f : 0.55 + 1.0 * f), (f) => (f < 0.1 ? f * 9 : f > 0.94 ? 0.2 : 0.95), r, 130);
  }
  // a hot core riding ahead of the billows
  h.fly(k.pic('puffHot', E, 30, 30), E, bz, 1250, 1745, (f) => 0.7 + 0.9 * Math.sin(Math.PI * Math.min(1, f * 1.1)), (f) => (f < 0.08 ? f * 12 : f > 0.96 ? 0 : 1), 0, 200);
  fx(k.light('g-warm', E, 60), [[1220, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [1280, { transform: 'scale(1.6)', opacity: 1 }, 'ease-out'], [1700, { transform: 'scale(.8)', opacity: 0 }]]);

  // ── the strike
  h.burst(T, 1750, { flames: 5, linger: 1100, size: 1.15 });
  const sc = ((rand() - 0.5) * 16).toFixed(1);
  fx(k.pic('scorch1:char', [T[0], T[1] + 8], 46, 46, { lit: false, low: true }), [[1790, { transform: `rotate(${sc}deg) scale(.15, .07)`, opacity: 0 }, 'ease-out'], [2300, { transform: `rotate(${sc}deg) scale(1, .45)`, opacity: 1 }], [3100, { transform: `rotate(${sc}deg) scale(1, .45)`, opacity: 1 }, eio], [3700, { transform: `rotate(${sc}deg) scale(1, .45)`, opacity: 0 }]]);

  // ── embers drifting off her and the spiral after the throw
  for (let i = 0; i < 10; i++) {
    const t = 1500 + i * 150 + rand() * 60, p0 = [120 + rand() * 60, 60 + rand() * 110];
    fx(k.pic('spark', p0, 4, 4), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 90, { transform: 'scale(1)', opacity: 1 }], [t + 800, { transform: `${k.T((rand() - 0.5) * 16, -22 - rand() * 14)} scale(.25)`, opacity: 0 }]]);
  }
}
