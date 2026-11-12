// Hungry Ghoul (a creature, a support: it grows with every death, and can eat a creature of yours). The ghoul
// crouched on its gravestone draws back and yawns, its three eyes flaring and shadow gathering round its jaws,
// then lunges its long skull at T and lets go a tendril of violet hunger that lashes out and hooks what is
// there: a little soul tugged up out of the ground. The soul is yanked along the tendril, stretching, torn to
// motes of light that stream into its open mouth; the jaw snaps shut on each one. It swallows, and swells: back
// and haunches heave up a size, the eyes blaze, a violet light and two rings spread from its belly, motes rise.
// Then it eases back down, exactly as drawn.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support (as suggested: it feeds itself, a boon of +1/+1),
// element shadow (as suggested). T = k.aim, else the cross in the foreground (`cross`), so alone it plucks a soul
// from the grave marker. The head turns toward T about the neck (up to 40 degrees down, 110 up and over its back
// when T is behind it); the long arm reaches after it. Everything that flies or lands is on the overlay (k.pic,
// k.light): T may be on another card. The parts ride one chain: body (squash, lean, swell), head and arms on it,
// the jaw on the head, the eyes with the head.
//   0-650    GATHER: it sinks and draws back, the head rears, the jaw opens; shadow and motes drawn into the mouth.
//   650-880  LUNGE: the head snaps toward T, the arm reaches; the tendril is let go at 880 (RELEASE).
//   1280     IMPACT: the tendril hooks T: a flash, two rings; a soul stands tugged out of the ground.
//   1300-2300 FEED: the soul is yanked along the tendril and torn to motes; they stream into the jaws (arriving
//            1650-2300), each one a snap of the jaw and a pulse in the throat.
//   2300-3000 SWELL: it heaves up a size (+1/+1) with a bloom of violet light, rings and rising motes.
//   3000-3700 it eases back down; SETTLE 3700, as drawn.
import { mul, rot, tr, scl, app, curve, kit } from './_fx.js';

export const END = 4300;
export const BEATS = { release: 880, impact: 1280, settle: 3700 };
export const STILLS = [400, 800, 1000, 1300, 1700, 2150, 2600, 3900];

export const textures = {
  mote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [214 + 40 * c, 188 + 60 * c, 255, Math.min(1, c * c * 2.4)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const F = kit(k), { drive, ride } = F;
  const S = k.spec, E = S.emit, N = S.neck, H = S.hinge, SA = S.shoulderA, SB = S.shoulderB, FT = S.feet;
  const T = k.aim || S.cross;
  const REL = BEATS.release, IM = BEATS.impact, BACK = BEATS.settle, END_ = BACK + 100;
  const tidy = (l) => l.filter((q, i) => i === 0 || q[0] > l[i - 1][0]);
  const deg = (r) => (r * 180) / Math.PI, nrm = (a) => ((a + 540) % 360) - 180, clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ── where the head and arm turn: toward T
  const a0 = deg(Math.atan2(E[1] - N[1], E[0] - N[0]));
  let dA = nrm(deg(Math.atan2(T[1] - N[1], T[0] - N[0])) - a0);
  const out = (x) => (x < -40 ? -40 - x : x > 110 ? x - 110 : 0);
  if (out(dA + 360) < out(dA)) dA += 360;
  dA = clamp(dA, -40, 110);
  const headDir = ((a0 + dA) * Math.PI) / 180, hx = Math.cos(headDir), hy = Math.sin(headDir);
  const aaT = clamp(nrm(deg(Math.atan2(T[1] - SA[1], T[0] - SA[0])) - 112) * 0.7, -22, 30);
  const side = T[0] < FT[0] ? -1 : 1;

  // ── the poses over time
  const sw = curve([[0, 1], [2300, 1], [2650, 1.075, 'out'], [2800, 1.065, 'eio'], [3000, 1.072], [BACK, 1]]); // the swell
  const sq = curve([[0, 1], [600, 0.962], [880, 1.018, 'out'], [1500, 1], [BACK, 1]]); // squash and surge
  const lean = curve([[0, 0], [600, -1.6], [880, 2.6, 'out'], [1500, 1.2], [2300, 0.4], [3300, 0]]);
  const bob = curve([[0, 0], [600, 0.9], [880, -0.8, 'out'], [1500, 0], [2300, 0.6], [2650, -1.4, 'out'], [3100, -0.8], [BACK, 0]]);
  const Wbody = (t) => mul(tr(0, bob(t)), mul(rot(side * lean(t), FT[0], FT[1]), scl(sw(t), sw(t) * sq(t), FT[0], FT[1])));
  const dh = curve([[0, 0], [200, 0.05 * dA], [650, -0.2 * dA + 7], [870, dA, 'out'], [1300, dA * 0.96], [1600, dA * 0.7], [1750, dA * 0.45], [2150, dA * 0.3], [2600, -4], [3000, -3], [3500, 0]]);
  const lg = curve([[0, 0], [650, -3.2], [870, 8.5, 'out'], [1300, 3.6], [1650, 1.2], [1800, 3.4], [1950, 1], [2150, 2.4], [2500, 0.4], [3300, 0]]); // the head's lunge, along its heading
  const Whead = (t) => mul(Wbody(t), mul(tr(hx * lg(t), hy * lg(t)), rot(dh(t), N[0], N[1])));
  const ja = curve([[0, 0], [350, -11], [650, -26], [870, -36, 'out'], [1450, -33], [1620, -4, 'in'], [1720, -23], [1830, -3, 'in'], [1930, -19], [2040, -2, 'in'], [2130, -14], [2220, 0], [2400, -7], [2700, 0], [3000, 0]]);
  const Wjaw = (t) => mul(Whead(t), rot(ja(t), H[0], H[1]));
  const aa = curve([[0, 0], [450, -5], [880, aaT, 'out'], [1300, aaT * 0.92], [1650, aaT * 0.5], [1750, aaT * 0.8], [1950, aaT * 0.3], [2300, 2], [3300, 0]]);
  const ab = curve([[0, 0], [500, 2.5], [900, -3], [1500, -1.5], [2300, 0.5], [2650, -2.5], [3300, 0]]);
  const Warm = (t) => mul(Wbody(t), rot(aa(t), SA[0], SA[1]));
  const WarmB = (t) => mul(Wbody(t), rot(ab(t), SB[0], SB[1]));
  drive(k.part('body'), FT, Wbody, END_);
  drive(k.part('ribs'), FT, Wbody, END_);
  drive(k.part('head'), N, Whead, END_);
  drive(k.part('eyes'), N, Whead, END_);
  drive(k.part('jaw'), H, Wjaw, END_);
  drive(k.part('armA'), SA, Warm, END_);
  drive(k.part('armB'), SB, WarmB, END_);
  const MOUTH = (t) => app(Whead(t), E), EYE = [116, 55], BELLY = [172, 76];

  // ── gathering: shadow round the jaws, motes drawn in; light swelling in the mouth, the eyes flaring
  fx(k.picIn('gloom', [112, 62], 50, 42, { lit: false }), tidy([[80, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [650, { transform: 'scale(1)', opacity: 0.8 }, eio], [1500, { transform: 'scale(1.1) rotate(10deg)', opacity: 0.6 }, eio], [2200, { transform: 'scale(1.2) rotate(20deg)', opacity: 0 }]]));
  ride(k.lightIn('g-violet', E, 26, 26), E, Whead, [[120, 0.3, 0], [650, 1, 0.7], [REL, 1.6, 1], [1100, 1.1, 0.8], [1400, 0.9, 0.55], [1700, 1.3, 0.9], [2050, 1.1, 0.7], [2500, 0.7, 0.25], [2800, 0.4, 0]]);
  ride(k.lightIn('g-violet', EYE, 24, 24), EYE, Whead, [[150, 0.4, 0], [650, 1.2, 0.65], [REL, 1.6, 0.9], [1500, 1.2, 0.6], [2300, 1.4, 0.7], [2650, 2.1, 1], [3000, 1.5, 0.75], [3400, 0.8, 0.25], [3650, 0.4, 0]]);
  const M7 = MOUTH(700);
  for (let i = 0; i < 12; i++) {
    const a = rand() * Math.PI * 2, r0 = 14 + rand() * 20, X = M7[0] + Math.cos(a) * r0, Y = M7[1] + Math.sin(a) * r0 * 0.8, t0 = 120 + i * 48, sz = 2.6 + rand() * 3;
    fx(k.pic('mote', [X, Y], sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 120, { transform: 'scale(1)', opacity: 0.9 }, 'ease-in'], [t0 + 520, { transform: `${k.T(M7[0] - X, M7[1] - Y)} scale(.3)`, opacity: 0 }]]);
  }

  // ── the tendril (RELEASE to IMPACT): two braided cords of violet light from the jaws to T, lashing out
  const JA = MOUTH(REL), dx = T[0] - JA[0], dy = T[1] - JA[1], len = Math.hypot(dx, dy) || 1, ang = deg(Math.atan2(dy, dx));
  const cordSvg = k.svg('<defs><linearGradient id="c" x1="0" x2="1"><stop offset="0" stop-color="#f6eeff"/><stop offset=".55" stop-color="#b98cff"/><stop offset="1" stop-color="#7a4fd0"/></linearGradient><filter id="b" x="-5%" y="-300%" width="110%" height="700%"><feGaussianBlur stdDeviation="1.1"/></filter></defs><rect x="0" y="4" width="100" height="4" rx="2" fill="#9b6bff" filter="url(#b)" opacity=".85"/><rect x="0" y="5" width="100" height="2" rx="1" fill="url(#c)"/>', 100, 12);
  const cl = (f, o, d = 0, th = 1) => ({ transform: `rotate(${(ang + d).toFixed(1)}deg) translate(${(len * u * f / 2).toFixed(1)}px, 0px) scale(${f.toFixed(3)}, ${(o * th).toFixed(2)})`, opacity: o });
  fx(k.pic(cordSvg, JA, len, 15), tidy([[REL, cl(0.02, 0.9), 'ease-in'], [REL + 150, cl(0.55, 1)], [IM - 20, cl(1, 1), 'ease-out'], [IM + 120, cl(1, 0.95)], [IM + 380, cl(1, 0.7, 0, 0.8)], [IM + 640, cl(1, 0.4, 0, 0.6)], [IM + 900, cl(1, 0)]]));
  fx(k.pic(cordSvg, JA, len, 15), tidy([[REL + 40, cl(0.02, 0.6, 3), 'ease-in'], [REL + 200, cl(0.6, 0.7, 2.5)], [IM, cl(1, 0.7, 1.5), 'ease-out'], [IM + 200, cl(1, 0.55, -2)], [IM + 500, cl(1, 0.3, -3, 0.7)], [IM + 760, cl(1, 0)]]));
  const nx = -dy / len, ny = dx / len;
  const bz = (t, sd) => [JA[0] + dx * t + nx * sd * Math.sin(t * Math.PI), JA[1] + dy * t + ny * sd * Math.sin(t * Math.PI) - 5 * Math.sin(t * Math.PI)];
  for (let i = 0; i < 9; i++) {
    const t0 = REL + i * 36 + rand() * 20, D = IM - REL + 40 + rand() * 60, sd = (rand() - 0.5) * Math.min(14, len * 0.12), sz = 4 + rand() * 4, ks = [];
    for (let j = 0; j <= 7; j++) { const f = j / 7, [x, y] = bz(f, sd); ks.push([t0 + f * D, { transform: `${k.T(x - JA[0], y - JA[1])} scale(${(f < 0.1 ? 0.5 : 1.3 - 0.4 * f).toFixed(2)})`, opacity: j === 0 || j === 7 ? 0 : 0.95 }, 'linear']); }
    fx(k.pic('mote', JA, sz, sz), ks);
  }

  // ── IMPACT at T: a flash, two rings, motes thrown, a shadow settling; and the soul standing there
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#9b6bff" stroke-width="6" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#efe4ff" stroke-width="1.4"/>', 100, 100);
  fx(k.light('g-violet', T, 46), tidy([[IM - 60, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(1.25)', opacity: 1 }, eio], [IM + 350, { transform: 'scale(.95)', opacity: 0.6 }, eio], [IM + 800, { transform: 'scale(.8)', opacity: 0.35 }, eio], [IM + 1200, { transform: 'scale(.6)', opacity: 0 }]]));
  fx(k.pic('gloom', T, 40, 36, { lit: false, low: true }), tidy([[IM - 80, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 300, { transform: 'scale(1)', opacity: 0.8 }, eio], [IM + 1200, { transform: 'scale(1.2) rotate(30deg)', opacity: 0 }]]));
  for (let i = 0; i < 2; i++) { const t0 = IM + i * 150; fx(k.pic(ring, T, 34, 34), [[t0, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [t0 + 70, { transform: 'scale(.5)', opacity: 0.9 }], [t0 + 650, { transform: 'scale(1.5)', opacity: 0 }]]); }
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI * (0.05 + rand() * 0.9), sp = 8 + rand() * 16, t0 = IM + rand() * 40, life = 380 + rand() * 300, sz = 2.4 + rand() * 3;
    const px = (f) => Math.cos(a) * sp * f * u, py = (f) => (Math.sin(a) * sp * f + 22 * f * f) * u;
    fx(k.pic('mote', T, sz, sz), [0, 0.35, 0.7, 1].map((f, j) => [t0 + life * f, { transform: `translate(${px(f).toFixed(1)}px, ${py(f).toFixed(1)}px) scale(${(1 - 0.7 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 0.95 }, j ? 'linear' : 'ease-out']));
  }
  // the soul: a little hooded wisp, pulled up where the tendril lands, then yanked along it to the jaws, stretching
  const soul = k.svg('<defs><radialGradient id="g" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cdb8ff"/></radialGradient></defs><path d="M4,10Q4,1.5 9,1.5Q14,1.5 14,10L15.4,22Q12.6,19.4 9,22.6Q5.4,19.4 2.6,22Z" fill="url(#g)"/><ellipse cx="6.8" cy="9" rx="1.2" ry="1.8" fill="#2a1d44"/><ellipse cx="11.2" cy="9" rx="1.2" ry="1.8" fill="#2a1d44"/>', 18, 24);
  const SC = [T[0], T[1] - 6], Mj = MOUTH(1840), sdx = Mj[0] - SC[0], sdy = Mj[1] - SC[1], sa = deg(Math.atan2(sdy, sdx)) + 90;
  const sl = (f, sx, sy, o, r = 0) => ({ transform: `${k.T(sdx * f, sdy * f)} rotate(${(f > 0 ? sa : r).toFixed(1)}deg) scale(${sx.toFixed(2)}, ${sy.toFixed(2)})`, opacity: o });
  fx(k.pic(soul, SC, 13, 17), [[IM - 240, { transform: 'translate(0px, 4px) scale(.2)', opacity: 0 }, 'ease-out'], [IM - 40, { transform: 'translate(0px, 0px) scale(.95)', opacity: 0.9 }, 'ease-out'],
    [IM + 70, { transform: 'translate(0px, -1px) rotate(-5deg) scale(1.05)', opacity: 1 }, eio], [IM + 150, { transform: 'translate(0px, 0px) rotate(4deg) scale(1)', opacity: 1 }, 'ease-in'],
    [IM + 220, sl(0.02, 0.95, 1.1, 1), 'ease-in'], [IM + 360, sl(0.3, 0.7, 1.9, 0.95)], [IM + 480, sl(0.7, 0.45, 2.8, 0.7)], [1840, sl(1, 0.12, 3.4, 0)]]);
  // motes torn from it stream to the jaws on curving paths, arriving 1650-2300
  const NM = 24;
  for (let i = 0; i < NM; i++) {
    const t0 = IM + 180 + i * 34 + rand() * 24, D = 420 + rand() * 180, sd = (i % 2 ? 1 : -1) * (5 + rand() * 12), s0 = [T[0] + (rand() - 0.5) * 12, T[1] - 5 + (rand() - 0.5) * 8], sz = 3.6 + rand() * 3.4, ks = [];
    const Mh = MOUTH(t0 + D), ddx = Mh[0] - s0[0], ddy = Mh[1] - s0[1], dl = Math.hypot(ddx, ddy) || 1;
    for (let j = 0; j <= 8; j++) {
      const f = j / 8, e = f * f * 0.6 + f * 0.4, sw2 = Math.sin(e * Math.PI) * sd;
      ks.push([t0 + f * D, { transform: `${k.T(ddx * e - (ddy / dl) * sw2, ddy * e + (ddx / dl) * sw2 - 7 * Math.sin(e * Math.PI))} scale(${(f < 0.1 ? 0.5 : 1.15 - 0.55 * f).toFixed(2)})`, opacity: j === 0 || j === 8 ? 0 : 0.95 }, 'linear']);
    }
    fx(k.pic('mote', s0, sz, sz), ks);
  }

  // ── the swell: it heaves up a size; a bloom of violet light and two rings from its belly, motes rising
  fx(k.lightIn('g-violet', BELLY, 64, 52), tidy([[2300, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [2650, { transform: 'scale(1.2)', opacity: 0.85 }, eio], [3000, { transform: 'scale(1.05)', opacity: 0.6 }, eio], [3500, { transform: 'scale(.9)', opacity: 0 }]]));
  for (let i = 0; i < 2; i++) { const t0 = 2480 + i * 200; fx(k.picIn(ring, BELLY, 62, 62), [[t0, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [t0 + 90, { transform: 'scale(.4)', opacity: 0.9 }], [t0 + 850, { transform: 'scale(1.3)', opacity: 0 }]]); }
  for (let i = 0; i < 12; i++) {
    const x = BELLY[0] + (rand() - 0.5) * 50, y = BELLY[1] + (rand() - 0.3) * 26, t0 = 2450 + rand() * 450, sz = 2.4 + rand() * 3;
    fx(k.picIn('mote', [x, y], sz, sz), [[t0, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t0 + 100, { transform: 'scale(1)', opacity: 0.9 }, 'linear'], [t0 + 900, { transform: `${k.T((rand() - 0.5) * 8, -16 - rand() * 14)} scale(.4)`, opacity: 0 }]]);
  }
}
