// The One Who Came Back: the towering revenant draws itself up under the violet storm, one chained arm
// hauled high with a knot of shadow gathering in the fist, and brings it down: the chain lashes out at
// its victim, the storm's bolt striking in time, and where it lands a ring of darkness folds out and
// shocks the ground. It rocks back from the blow, the cloak falls, the storm quietens.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker (Echo 7; when it returns, each
// opponent loses 3: the lash is the attack), element shadow (the suggestion fits: darkness and
// violet storm). It lashes with the arm on T's side: left arm if T is left of it, else the right.
//   0-600     ANTICIPATION: a bolt flickers in the storm; the revenant hunches and gathers (a breath
//             in: shoulders and cloak draw in), the lashing arm pulls down and back, the eye blazes.
//   600-1450  RISE: it draws itself up to full height, the arm hauled high overhead, a knot of shadow
//             and violet motes gathering in its fist, the cloak billowing; it quivers at the top.
//   1520      RELEASE: it throws its weight forward, the arm whips down and the chain lashes from the
//             fist to T (k.aim, else the ground at its left front); the storm's bolt strikes with it.
//   1850      IMPACT at T: a flash, a ring of darkness and a violet ring folding outward, cracks of
//             violet lightning, shadow billows, debris; the ground shocks where it stamps.
//   1850-3900 it rocks back from the blow, the cloak falls and settles, the chain slides home, the
//             dust and shadow clear. At rest as drawn by 3900 (END 4400).
// BEATS: release 1520, impact 1850, settle 3900.
import { mul, rot, scl, tr, app, curve, kit } from './_fx.js';

export const END = 4400;
export const BEATS = { release: 1520, impact: 1850, settle: 3900 };
export const STILLS = [300, 900, 1400, 1560, 1800, 2000, 2700, 4000];

export const textures = {
  mote: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226, 206, 255, Math.min(1, c * c * 3)]; }],
  orb: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [190 + 60 * c, 150 + 90 * c * c, 255, Math.min(1, c * c * 2.4)]; }],
  knot: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [12, 6, 22, Math.min(1, c * 1.7) * 0.95]; }],
  dust: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [92, 70, 130, c * c * 0.75]; }],
  shade: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [10, 5, 20, c * c * 0.9]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out', S = k.spec, X = kit(k);
  const body = k.part('body'), cloak = k.part('cloak'), larm = k.part('larm'), rarm = k.part('rarm');
  const chainL = k.part('chainL'), chainR = k.part('chainR'), glints = k.part('glints');
  const FT = S.feet, CR = S.cloakRoot;
  const T = k.aim || [44, 160];
  const left = T[0] < 146, a = left ? 1 : -1, toward = left ? -1 : 1;   // a: +1 when the left arm lashes
  const SHL = S.shoulderL, SHR = S.shoulderR, HL = S.emit, HR = S.handR;
  const SHa = left ? SHL : SHR, Ha = left ? HL : HR, SHb = left ? SHR : SHL, Hb = left ? HR : HL;
  k.css('.g-cold { border-radius: 50%; background: radial-gradient(circle, rgba(250,244,255,.95), rgba(204,164,255,.62) 30%, rgba(150,96,255,.26) 56%, rgba(120,70,255,0) 72%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#b790f5" stroke-width="5" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#efe4ff" stroke-width="1.4"/>', 100, 100);
  const darkRing = k.svg('<defs><filter id="b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="2"/></filter></defs><circle cx="50" cy="50" r="38" fill="none" stroke="#07030f" stroke-width="9" filter="url(#b)"/><circle cx="50" cy="50" r="42" fill="none" stroke="#9b6bff" stroke-width="1.6" opacity=".8"/>', 100, 100);
  // the chain lash: a long dark ribbon of links edged in violet light, its tip at the far end (right)
  const lash = k.svg('<defs><filter id="b" x="-5%" y="-120%" width="110%" height="340%"><feGaussianBlur stdDeviation="2.4"/></filter></defs>' +
    '<path d="M0,12L94,5L100,12L94,19Z" fill="#9b6bff" opacity=".75" filter="url(#b)"/><path d="M0,12L95,7.6L100,12L95,16.4Z" fill="#0a0510"/>' +
    '<path d="M2,12L96,12" stroke="#d6c2fa" stroke-width="2.4" stroke-dasharray="3 2.2" opacity=".9"/>', 100, 24);
  const thin = k.svg('<defs><linearGradient id="c" x1="0" x2="1"><stop offset="0" stop-color="#b790f5" stop-opacity=".3"/><stop offset="1" stop-color="#fff"/></linearGradient></defs><path d="M0,6L96,4.2L100,6L96,7.8Z" fill="url(#c)"/>', 100, 12);
  // the storm's bolt, redrawn in a box 40 x 124 centred on (226, 56): flashed in time with the blow
  const bp = [[240, -4], [231, 20], [239, 23], [225, 52], [233, 55], [218, 86], [225, 88], [212, 112]];
  const bd = 'M' + bp.map(([x, y]) => `${(x - 206).toFixed(1)},${(y + 6).toFixed(1)}`).join('L') + 'M25,26L13,38M19,58L6,70';
  const bolt = k.svg(`<defs><filter id="b" x="-40%" y="-10%" width="180%" height="120%"><feGaussianBlur stdDeviation="2.2"/></filter></defs><g fill="none" stroke-linejoin="bevel"><path d="${bd}" stroke="#c9a6ff" stroke-width="6" opacity=".7" filter="url(#b)"/><path d="${bd}" stroke="#fbf6ff" stroke-width="2.2"/></g>`, 40, 124);
  const crack = k.svg('<defs><filter id="b" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><path d="M0,10L30,6L38,14L62,8L100,12" fill="none" stroke="#9b6bff" stroke-width="5" opacity=".7" filter="url(#b)"/><path d="M0,10L30,6L38,14L62,8L100,12" fill="none" stroke="#fbf6ff" stroke-width="1.6" stroke-linejoin="bevel"/>', 100, 20);

  // ── the body: the rig (all in one world transform), then each limb on top of it
  const lean = curve([[0, 0], [350, -toward * 3], [800, -toward * 3.5], [1300, -toward * 5], [1450, -toward * 5.5], [1560, toward * 5.5, 'out'], [1850, toward * 7], [2400, toward * 2.5], [3100, -toward * 1.2], [3900, 0]]);
  const sy = curve([[0, 1], [350, 0.982], [850, 1.032], [1450, 1.034], [1620, 0.988, 'out'], [1850, 0.978], [2500, 1.004], [3900, 1]]);
  const dx = curve([[0, 0], [1450, 0], [1850, toward * 3.2], [2500, toward * 1.2], [3900, 0]]);
  const Wr = (t) => mul(tr(dx(t), 0), mul(rot(lean(t), FT[0], FT[1]), scl(1 + (1 - sy(t)) * 0.7, sy(t), FT[0], FT[1])));
  const angA = curve([[0, 0], [300, -8], [700, 42], [1300, 125], [1440, 132], [1480, 128, 'in'], [1570, 28, 'out'], [1700, 18], [2100, 7], [2900, -3], [3900, 0]]);
  const angB = curve([[0, 0], [350, 5], [1100, 14], [1560, 20], [1700, -5], [2300, 4], [3000, -1], [3900, 0]]);
  const Wa = (t) => mul(Wr(t), rot(a * angA(t), SHa[0], SHa[1]));
  const Wb = (t) => mul(Wr(t), rot(-a * angB(t), SHb[0], SHb[1]));
  const cl = (t) => curve([[0, 0], [350, 3], [800, -6], [1300, -4], [1450, -8], [1620, -11], [1900, 5], [2300, -2], [2900, 1], [3900, 0]])(t) * 1 + 1.1 * Math.sin(t / 85) * Math.max(0, Math.min(1, (t - 600) / 300)) * Math.max(0, Math.min(1, (3300 - t) / 900));
  const Wc = (t) => mul(Wr(t), rot(cl(t), CR[0], CR[1]));
  const chainFade = curve([[0, 1], [620, 1], [850, 0], [3000, 0], [3500, 1], [3900, 1]]);
  X.drive(body, FT, Wr, 3900);
  X.drive(glints, [146, 90], Wr, 3900);
  X.drive(cloak, CR, Wc, 3900);
  X.drive(left ? larm : rarm, SHa, Wa, 3900);
  X.drive(left ? rarm : larm, SHb, Wb, 3900);
  X.drive(left ? chainL : chainR, Ha, Wr, 3900, 50, chainFade);
  X.drive(left ? chainR : chainL, Hb, (t) => { const p = app(Wb(t), Hb); return tr(p[0] - Hb[0], p[1] - Hb[1]); }, 3900);
  const H = (t) => app(Wa(t), Ha);   // the lashing fist, as it moves

  // ── the storm: the bolt flickers in anticipation, strikes with the blow
  const flash = (t, hold = 90) => { // a bolt flash at t
    fx(k.picIn(bolt, [226, 56], 40, 124, { lit: false }), [[t, { opacity: 0 }, 'ease-out'], [t + 40, { opacity: 1 }], [t + hold, { opacity: 0.35 }], [t + hold + 50, { opacity: 0.9 }], [t + hold + 190, { opacity: 0 }]]);
    fx(k.lightIn('g-cold', [222, 60], 190, 160), [[t, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [t + 50, { transform: 'scale(1)', opacity: 0.8 }], [t + hold + 100, { transform: 'scale(1.05)', opacity: 0.45 }], [t + hold + 420, { transform: 'scale(.9)', opacity: 0 }]]);
  };
  flash(240, 80); flash(1500, 120);
  fx(k.lightIn('g-cold', [222, 60], 220, 200), [[1840, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [1900, { transform: 'scale(1)', opacity: 1 }], [2150, { transform: 'scale(1.05)', opacity: 0.5 }], [2800, { transform: 'scale(.9)', opacity: 0 }]]);
  fx(k.picIn(bolt, [226, 56], 40, 124, { lit: false }), [[1850, { opacity: 0 }, 'ease-out'], [1890, { opacity: 1 }], [1970, { opacity: 0.3 }], [2030, { opacity: 1 }], [2300, { opacity: 0 }]]);

  // ── the eye blazes as it gathers and strikes
  fx(k.lightIn('g-cold', [147, 58], 50, 30), [[200, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [450, { transform: 'scale(1.2)', opacity: 0.9 }, eio], [1000, { transform: 'scale(1)', opacity: 0.6 }, eio], [1450, { transform: 'scale(1.25)', opacity: 0.95 }, eio], [1900, { transform: 'scale(1.35)', opacity: 1 }, eio], [2800, { transform: 'scale(.9)', opacity: 0.3 }, eio], [3500, { transform: 'scale(.5)', opacity: 0 }]]);

  // ── 600-1500: a knot of shadow gathers in the raised fist, violet motes drawn in
  const fist = Ha;
  X.ride(k.pic('shade', fist, 40, 40, { lit: false }), fist, Wa, [[800, 0.2, 0], [1100, 0.8, 0.8], [1400, 1.1, 0.95], [1500, 1.3, 0.95], [1620, 1.5, 0]]);
  X.ride(k.pic('orb', fist, 22, 22), fist, Wa, [[900, 0.2, 0], [1250, 0.8, 0.7], [1450, 1.2, 1], [1560, 1.6, 0.9], [1700, 2, 0]]);
  for (let i = 0; i < 10; i++) {
    const an = rand() * Math.PI * 2, r = 20 + rand() * 12, t0 = 900 + i * 55, sz = 2.2 + rand() * 2;
    const p0 = [fist[0] + Math.cos(an) * r, fist[1] + Math.sin(an) * r * 0.9];
    X.ride(k.pic('mote', p0, sz, sz), p0, Wa, [[t0, 0.4, 0], [t0 + 110, 1, 0.9], [t0 + 400, 0.4, 0]]);
  }

  // ── release: the chain lashes from the fist (as it is mid-whip) to T; arrives at 1850
  const R = 1520, IM = 1850, H0 = H(1545);
  const stretch = (src, A, B, w, o, make) => {
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]), ang = (Math.atan2(B[1] - A[1], B[0] - A[0]) * 180) / Math.PI;
    const el = k.pic(src, [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], L, w, o);
    make(el, (f, g = 1) => `${k.T((B[0] - A[0]) * (f - 1) / 2, (B[1] - A[1]) * (f - 1) / 2)} rotate(${ang.toFixed(1)}deg) scale(${Math.max(0.001, f).toFixed(3)}, ${g})`);
  };
  stretch(lash, H0, T, 26, { lit: false }, (el, tf) => fx(el, [[R + 25, { transform: tf(0.02), opacity: 0 }, 'ease-in'], [R + 60, { transform: tf(0.1), opacity: 1 }, 'ease-in'], [IM, { transform: tf(1), opacity: 1 }, 'ease-out'], [IM + 160, { transform: tf(1), opacity: 0.95 }, eio], [IM + 700, { transform: tf(0.7, 0.7), opacity: 0.5 }, eio], [IM + 1200, { transform: tf(0.15, 0.3), opacity: 0 }]]));
  stretch(thin, H0, T, 8, {}, (el, tf) => fx(el, [[R + 55, { transform: tf(0.02), opacity: 0 }, 'ease-in'], [R + 100, { transform: tf(0.1), opacity: 1 }, 'ease-in'], [IM - 20, { transform: tf(1), opacity: 1 }, 'ease-out'], [IM + 400, { transform: tf(0.9, 0.8), opacity: 0.7 }, eio], [IM + 800, { transform: tf(0.1, 0.3), opacity: 0 }]]));
  // shadow billowing off the lash, sparks riding it
  for (let i = 0; i < 9; i++) {
    const f = 0.1 + i * 0.1, ts = Math.round(R + 60 + (IM - R - 60) * f), p = [H0[0] + (T[0] - H0[0]) * f, H0[1] + (T[1] - H0[1]) * f], r = Math.round(rand() * 360);
    fx(k.pic(i % 2 ? 'shade' : 'mote', p, i % 2 ? 22 : 4, i % 2 ? 22 : 4, { lit: i % 2 === 0 }), [[ts, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [ts + 70, { transform: `rotate(${r}deg) scale(1)`, opacity: i % 2 ? 0.7 : 0.95 }], [ts + 520, { transform: `${k.T((rand() - 0.5) * 10, (rand() - 0.5) * 8 + 4)} rotate(${r + 30}deg) scale(${i % 2 ? 1.8 : 0.3})`, opacity: 0 }]]);
  }
  // the fist's burst as it lets go
  fx(k.light('g-cold', H0, 40), [[R, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [R + 50, { transform: 'scale(1.2)', opacity: 0.95 }, 'ease-out'], [R + 400, { transform: 'scale(.8)', opacity: 0 }]]);

  // ── the ground shocks where it stamps (1560-2000): dust at its feet, a ripple
  for (let i = 0; i < 8; i++) {
    const x = 96 + (i % 2 ? 90 : 0) + (rand() - 0.5) * 16, t = 1580 + i * 30, r = Math.round(rand() * 360), d = (i % 2 ? 1 : -1);
    fx(k.picIn('dust', [x, 188], 24, 24, { lit: false }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 260, { transform: `${k.T(d * (6 + rand() * 8), -6)} rotate(${r + 25}deg) scale(1)`, opacity: 0.6 }], [t + 1200, { transform: `${k.T(d * (16 + rand() * 14), -24)} rotate(${r + 60}deg) scale(1.9)`, opacity: 0 }]]);
  }
  fx(k.picIn(ring, [143, 192], 150, 40, { lit: true }), [[1570, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [1620, { transform: 'scale(.4)', opacity: 0.8 }, 'ease-out'], [2200, { transform: 'scale(1.3)', opacity: 0 }]]);

  // ── impact (1850): a flash, a ring of darkness and a violet ring folding out, cracks, billows, debris
  fx(k.light('g-cold', T, 76), [[IM - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [IM + 500, { transform: 'scale(.9)', opacity: 0.5 }, eio], [IM + 1200, { transform: 'scale(.6)', opacity: 0 }]]);
  fx(k.pic('shade', T, 56, 56, { lit: false }), [[IM, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [IM + 120, { transform: 'scale(1)', opacity: 0.95 }, 'ease-out'], [IM + 800, { transform: 'scale(1.3)', opacity: 0.6 }, eio], [IM + 1600, { transform: 'scale(1.6)', opacity: 0 }]]);
  fx(k.pic(darkRing, T, 92, 92, { lit: false }), [[IM - 1, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(.3)', opacity: 1 }, 'ease-out'], [IM + 600, { transform: 'scale(1.1)', opacity: 0 }]]);
  for (const [d, w, o] of [[60, 84, 0.9], [200, 56, 0.6]]) {
    fx(k.pic(ring, T, w, w), [[IM + d - 1, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + d + 40, { transform: 'scale(.3)', opacity: o }, 'ease-out'], [IM + d + 600, { transform: 'scale(1.1)', opacity: 0 }]]);
  }
  for (let i = 0; i < 6; i++) {
    const an = -150 + i * 60 + (rand() - 0.5) * 24, len = 24 + rand() * 20, B = [T[0] + Math.cos((an * Math.PI) / 180) * len, T[1] + Math.sin((an * Math.PI) / 180) * len * 0.8];
    stretch(crack, T, B, 5, {}, (el, tf) => fx(el, [[IM, { transform: tf(0.05), opacity: 0 }, 'ease-out'], [IM + 70, { transform: tf(1), opacity: 1 }, 'ease-out'], [IM + 160, { transform: tf(1), opacity: 0.35 }, eio], [IM + 230, { transform: tf(1), opacity: 0.9 }, eio], [IM + 600, { transform: tf(1), opacity: 0 }]]));
  }
  for (let i = 0; i < 14; i++) {
    const an = -Math.PI * (0.05 + rand() * 0.9), v = 14 + rand() * 30, ts = IM + rand() * 50, life = 450 + rand() * 450, sz = 2.2 + rand() * 2.4;
    const pts = k.arc([0, 0], [Math.cos(an) * v * 0.7, Math.sin(an) * v - 6], [Math.cos(an) * v * 1.2, 14 + rand() * 10], 5);
    fx(k.pic(i % 3 ? 'mote' : 'shade', T, i % 3 ? sz : sz * 4, i % 3 ? sz : sz * 4, { lit: i % 3 !== 0 }), [[ts, { transform: `${k.T(0, 0)} scale(.3)`, opacity: 0 }, 'ease-out'],
      ...pts.map(([x, y], j) => [Math.round(ts + 40 + life * j / 5), { transform: `${k.T(x, y)} scale(${(1 - 0.4 * j / 5).toFixed(2)})`, opacity: j === 5 ? 0 : 0.9 }, j < 1 ? 'ease-out' : eio])]);
  }
}
