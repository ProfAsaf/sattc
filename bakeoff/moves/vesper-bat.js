// Vesper Bat (a creature, a support: "Drain": an opponent loses 1 Life, you gain 1). Its wings beat as it gathers: a
// crimson glow swells at its mouth. A hard downbeat lifts it, and it spits a cord of blood-light to T that lashes
// out and lands (a flash, a ring, drops); then the life comes back: crimson motes stream from T on curving paths to
// the bat's belly, each arrival beating in its chest, and it flares with a spreading ring, hovering on soft beats
// before settling back, wings spread, exactly as drawn.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support (as suggested: the boon is life regained), element
// blood (as suggested). T = k.aim, else the ruined arcade at the lower right (`town`). The bat tilts toward T. Its
// parts: body (with feet, ears), eyes, two wings with thumbs and veins; the wings turn from the shoulders and the
// body bobs with them (a chain: the wings ride the body's pose).
//   0-650    GATHER: wings lift and furl (up to -20), the body dips; glow swells at the mouth, motes drawn in.
//   650-880  DOWNBEAT: wings sweep down (+36), the body rises and tilts toward T; the cord is let go at 880 (RELEASE).
//   1350     IMPACT: the cord lands at T: flash, ring, drops thrown out, a stain of light.
//   1350-2500 DRAIN: motes stream from T back to the belly (arriving 1750-2400), each pulsing it; the bat hovers
//            on soft beats, flares and rings at the last.
//   2500-3700 it eases down: wings settle; SETTLE 3700, as drawn.
import { mul, rot, tr, app, curve, kit } from './_fx.js';

export const END = 4200;
export const BEATS = { release: 880, impact: 1350, settle: 3700 };
export const STILLS = [450, 800, 900, 1150, 1400, 1850, 2400, 3900];

export const textures = {
  bglob: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 120 + 100 * c * c, 130 + 90 * c * c, Math.min(1, c * 2.4)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const F = kit(k), { drive } = F;
  const S = k.spec, E = S.emit, HIT = S.hit, SL = S.shoulderL, SR = S.shoulderR, BP = S.body;
  const T = k.aim || S.town;
  const REL = BEATS.release, IM = BEATS.impact, BACK = BEATS.settle;
  const tidy = (l) => l.filter((q, i) => i === 0 || q[0] > l[i - 1][0]);
  k.css('.g-blood { border-radius: 50%; background: radial-gradient(circle, rgba(255, 232, 224, .95), rgba(255, 110, 120, .62) 30%, rgba(210, 44, 76, .22) 55%, rgba(170, 24, 64, 0) 70%); }');

  // ── the poses over time
  const aR = curve([[0, 0], [350, -8], [650, -20, 'in'], [880, 36], [1060, 6], [1300, -12], [1480, 18], [1700, -8], [1900, 12], [2150, -4], [2450, 8], [2900, -2], [3300, 2], [BACK, 0]]); // right wing (degrees, down is +); the left mirrors it
  const tilt = Math.max(-9, Math.min(9, (T[0] - BP[0]) / 11)), dive = Math.max(-1, Math.min(1, (T[1] - BP[1]) / 60));
  const aB = curve([[0, 0], [650, -tilt * 0.3], [880, tilt, 'out'], [1500, tilt * 0.7], [2400, tilt * 0.2], [BACK, 0]]);
  const bobC = curve([[0, 0], [650, 3.5], [880, -7 - dive * 1.5, 'out'], [1100, -3], [1500, -4.5], [1900, -2.5], [2400, -3], [3000, -1], [BACK, 0]]);
  const Wb = (t) => mul(tr(0, bobC(t)), rot(aB(t), BP[0], BP[1]));
  const wing = (sd, P) => (t) => mul(Wb(t), rot(sd * aR(t), P[0], P[1]));
  const WR = wing(1, SR), WL = wing(-1, SL), END_ = BACK + 100;
  drive(k.part('body'), BP, Wb, END_);
  drive(k.part('eyes'), BP, Wb, END_);
  drive(k.part('wingR'), SR, WR, END_); drive(k.part('thumbR'), SR, WR, END_); drive(k.part('veinsR'), SR, WR, END_);
  drive(k.part('wingL'), SL, WL, END_); drive(k.part('thumbL'), SL, WL, END_); drive(k.part('veinsL'), SL, WL, END_);

  const MOUTH = (t) => app(Wb(t), E), BELLY = (t) => app(Wb(t), HIT);
  const JA = MOUTH(REL);

  // ── gathering: a glow at the mouth swelling, motes drawn in; the eyes' light burns
  const g1 = [[200, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [650, { transform: 'scale(1)', opacity: 0.7 }, 'ease-in'], [REL, { transform: 'scale(1.6)', opacity: 1 }, eio], [1100, { transform: 'scale(1.1)', opacity: 0.7 }, eio], [1400, { transform: 'scale(.7)', opacity: 0.2 }, eio], [1700, { transform: 'scale(.5)', opacity: 0 }]];
  fx(k.lightIn('g-blood', E, 26, 26), g1.map(([t, kf, e]) => [t, kf, e]));
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2, r0 = 14 + rand() * 16, X = E[0] + Math.cos(a) * r0, Y = E[1] + Math.sin(a) * r0 * 0.8, t0 = 150 + i * 60, sz = 2.6 + rand() * 2.6;
    fx(k.picIn('bglob', [X, Y], sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 120, { transform: 'scale(1)', opacity: 0.9 }, 'ease-in'], [t0 + 520, { transform: `${k.T(E[0] - X, E[1] + bobC(660) - Y)} scale(.4)`, opacity: 0 }]]);
  }
  // a shock of crimson light from the downbeat: the wings throw it down
  fx(k.lightIn('g-blood', [150, 100], 120, 70), [[640, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [880, { transform: 'scale(1)', opacity: 0.45 }, eio], [1300, { transform: 'scale(1.1)', opacity: 0.2 }, eio], [1800, { transform: 'scale(1.2)', opacity: 0 }]]);

  // ── the cord (RELEASE to IMPACT): a thread of blood-light from the mouth to T, lashing out; a tail of glowing drops
  const dx = T[0] - JA[0], dy = T[1] - JA[1], len = Math.hypot(dx, dy) || 1, ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  const cord = k.svg('<defs><linearGradient id="c" x1="0" x2="1"><stop offset="0" stop-color="#ffd6d0"/><stop offset=".5" stop-color="#ff6a82"/><stop offset="1" stop-color="#c05cff"/></linearGradient><filter id="b" x="-5%" y="-300%" width="110%" height="700%"><feGaussianBlur stdDeviation="1.1"/></filter></defs><rect x="0" y="4.2" width="100" height="3.6" rx="1.8" fill="#ff5a78" filter="url(#b)" opacity=".8"/><rect x="0" y="5" width="100" height="2" rx="1" fill="url(#c)"/>', 100, 12);
  const cl = (f, o) => ({ transform: `rotate(${ang.toFixed(1)}deg) translate(${(len * u * f / 2).toFixed(1)}px, 0px) scale(${f.toFixed(3)}, ${o.toFixed(2)})`, opacity: o });
  fx(k.pic(cord, JA, len, 11), [[REL, cl(0.02, 0.9), 'ease-in'], [REL + 150, cl(0.55, 1)], [IM - 20, cl(1, 1), 'ease-out'], [IM + 160, cl(1, 0.8)], [IM + 520, cl(1, 0.5)], [IM + 900, cl(1, 0.15)], [IM + 1100, cl(1, 0)]]);
  const bz = (t, sd) => { const nx = -dy / len, ny = dx / len; return [JA[0] + dx * t + nx * sd * Math.sin(t * Math.PI), JA[1] + dy * t + ny * sd * Math.sin(t * Math.PI) - 6 * Math.sin(t * Math.PI)]; };
  for (let i = 0; i < 9; i++) {
    const t0 = REL + i * 38 + rand() * 20, D = (IM - REL) + 60 + rand() * 60, sd = (rand() - 0.5) * Math.min(14, len * 0.12), sz = 5 + rand() * 4, ks = [];
    for (let j = 0; j <= 7; j++) { const f = j / 7, [x, y] = bz(f, sd); ks.push([t0 + f * D, { transform: `${k.T(x - JA[0], y - JA[1])} scale(${(f < 0.1 ? 0.5 : 1.3 - 0.4 * f).toFixed(2)})`, opacity: j === 0 || j === 7 ? 0 : 0.95 }, 'linear']); }
    fx(k.pic('bglob', JA, sz, sz), ks);
  }

  // ── IMPACT at T: a flash, a ring, drops thrown, a stain of light that lingers a while
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#e8405c" stroke-width="6" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#ffd0cc" stroke-width="1.4"/>', 100, 100);
  fx(k.light('g-blood', T, 48), tidy([[IM - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(1.25)', opacity: 1 }, eio], [IM + 350, { transform: 'scale(.95)', opacity: 0.6 }, eio], [IM + 800, { transform: 'scale(1.0)', opacity: 0.45 }, eio], [IM + 1100, { transform: 'scale(.8)', opacity: 0.2 }, eio], [IM + 1500, { transform: 'scale(.6)', opacity: 0 }]]));
  for (let i = 0; i < 2; i++) { const t0 = IM + i * 150; fx(k.pic(ring, T, 36, 36), [[t0, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [t0 + 70, { transform: 'scale(.5)', opacity: 0.9 }], [t0 + 650, { transform: 'scale(1.5)', opacity: 0 }]]); }
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI * (0.05 + rand() * 0.9), sp = 10 + rand() * 20, t0 = IM + rand() * 40, life = 380 + rand() * 300, sz = 2.6 + rand() * 3.4;
    const px = (f) => Math.cos(a) * sp * f * u, py = (f) => (Math.sin(a) * sp * f + 30 * f * f) * u;
    fx(k.pic('bglob', T, sz, sz), [0, 0.35, 0.7, 1].map((f, j) => [t0 + life * f, { transform: `translate(${px(f).toFixed(1)}px, ${py(f).toFixed(1)}px) scale(${(1 - 0.7 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 0.95 }, j ? 'linear' : 'ease-out']));
  }

  // ── the drain: motes stream from T back to the belly (arriving 1750-2400), each one pulsing it
  const N = 14, nx = -dy / len, ny = dx / len;
  for (let i = 0; i < N; i++) {
    const t0 = IM + 120 + i * 38 + rand() * 25, D = 520 + rand() * 160, side = (i % 2 ? 1 : -1) * (6 + rand() * 12), s0 = [T[0] + (rand() - 0.5) * 12, T[1] + (rand() - 0.5) * 8], sz = 4.5 + rand() * 3.5, ks = [];
    const Bh = BELLY(t0 + D);
    for (let j = 0; j <= 8; j++) {
      const f = j / 8, e = f * f * 0.6 + f * 0.4, sw = Math.sin(e * Math.PI) * side;
      const x = s0[0] + (Bh[0] - s0[0]) * e + nx * sw, y = s0[1] + (Bh[1] - s0[1]) * e + ny * sw - 8 * Math.sin(e * Math.PI);
      ks.push([t0 + f * D, { transform: `${k.T(x - s0[0], y - s0[1])} scale(${(f < 0.1 ? 0.5 : 1.15 - 0.55 * f).toFixed(2)})`, opacity: j === 0 || j === 8 ? 0 : 0.95 }, 'linear']);
    }
    fx(k.pic('bglob', s0, sz, sz), ks);
  }
  // its belly takes them in: the glow beating with each arrival, a ring at the last
  const bl = [[IM + 560, { transform: 'scale(.4)', opacity: 0 }, 'ease-out']];
  for (let i = 0; i < 6; i++) { const t = IM + 640 + i * 120; bl.push([t, { transform: 'scale(1.15)', opacity: 0.95 }, eio], [t + 60, { transform: 'scale(.8)', opacity: 0.6 }, eio]); }
  bl.push([2450, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [2900, { transform: 'scale(1.9)', opacity: 0 }]);
  fx(k.lightIn('g-blood', HIT, 30, 30), tidy(bl));
  for (let i = 0; i < 2; i++) { const t0 = 2350 + i * 170; fx(k.pic(ring, HIT, 54, 54), [[t0, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [t0 + 80, { transform: 'scale(.4)', opacity: 0.9 }], [t0 + 800, { transform: 'scale(1.4)', opacity: 0 }]]); }
  for (let i = 0; i < 8; i++) {
    const a = rand() * Math.PI * 2, v = 10 + rand() * 18, t0 = 2400 + rand() * 250, sz = 2.2 + rand() * 2.6;
    fx(k.pic('bglob', HIT, sz, sz), [[t0, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t0 + 80, { transform: `${k.T(Math.cos(a) * v * 0.2, Math.sin(a) * v * 0.2)} scale(1)`, opacity: 0.95 }, 'linear'], [t0 + 650, { transform: `${k.T(Math.cos(a) * v, Math.sin(a) * v - 6)} scale(.6)`, opacity: 0 }]]);
  }
}
