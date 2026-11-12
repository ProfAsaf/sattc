// Nim, the Tidecaller: she draws her raised hand back, the wave behind her swelling and shining and its scrolls and fish
// trembling, then sweeps it out toward her friend: the wave pours what it carries, each scroll and silver fish
// lifting out of the water to her hand and streaming from it in a leaping arc to the target, where they land in a
// splash of light and rising bubbles. Then the wave's cargo settles back where it was, and she lowers her arm.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support (changed from the suggested defender: her text is drawing
// extra cards, so her move is the gift of the scrolls), element water.
//   0-450     gather: her arm draws back, the light in her hand dims, a swell of light runs up the wave, its crest
//             shimmers; each scroll and fish quivers and hops in its place (staggered); hair and hem settle, her low arm
//             swings against the other.
//   450-1050  the sweep: her arm throws out toward T (at most 75 degrees round, whichever side), the hand's light blazing.
//   release 1100  the first scroll arrives at her hand and leaves it; every one has lifted from the wave to her hand
//             (380 ms) and then flies in an arc to T (520-600 ms), 45 ms apart, scrolls tumbling, fish leaping and turned
//             along their path, a bright trail behind each. BEATS.impact 1620: the first lands; splashes of light, rings,
//             droplets as the groups land (alone, in the sea below the wave's curl), bubbles rising.
//   after     the light fades, the wave's cargo shimmers back into place (2900-3500), her arm lowers; at rest as drawn
//             from 3900 (END 4400).
// Aimed: the stream goes to T = k.aim || spec.sea, from her hand's real place at that moment, outside the picture if it
// must, on the overlay.
import { mul, rot, tr, app, curve, kit } from './_fx.js';
export const END = 4400;
export const BEATS = { release: 1100, impact: 1620, settle: 3900 };
export const STILLS = [1000, 1250, 1400, 1550, 1700, 1850, 2000, 2300];
export const textures = {
  mote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [200 + 50 * c, 248, 252, Math.min(1, c * c * c * 2.4)]; }],
  star: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); const ax = Math.abs(x - 0.5) * 2, ay = Math.abs(y - 0.5) * 2, ray = Math.max(0, 1 - Math.min(ax, ay) * 9) * Math.max(0, 1 - Math.max(ax, ay)); return [220 + 30 * c, 252, 254, Math.min(1, c * c * c * 1.6 + ray * 0.8)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  k.css('.g-tide { border-radius: 50%; background: radial-gradient(circle, rgba(240,255,254,.95), rgba(150,232,236,.55) 30%, rgba(90,200,214,.2) 55%, rgba(60,170,200,0) 70%); }');
  const S = k.spec, SH = S.shoulder, E0 = S.emit;
  const clean = (l) => l.sort((a, b) => a[0] - b[0]).filter((e, i, a) => i === 0 || e[0] > a[i - 1][0]);

  // ── where it goes, and how far her arm turns to throw it there
  const T = k.aim || S.sea;
  const ang = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  const sgn = T[0] >= SH[0] ? 1 : -1;
  let A = ang(SH, T) - ang(SH, E0);
  A = ((A + 540) % 360) - 180;
  A = Math.max(-75, Math.min(75, A));
  const arm = curve([[0, 0], [160, 0], [470, -sgn * 13], [860, A * 1.1, 'out'], [1040, A], [2350, A], [3300, 0]]);
  const WA = (t) => rot(arm(t), SH[0], SH[1]);
  const Eat = (t) => app(WA(t), E0);

  // ── her: arm and its light, the low arm, hair and hem
  const dim = curve([[0, 1], [160, 1], [470, 0.5], [900, 1]]);
  h.drive(k.part('arm'), SH, WA, 3700, 70);
  h.drive(k.part('handlight'), SH, WA, 3700, 70, dim);
  const gust = (t) => Math.exp(-Math.abs(t - 1000) / 450);
  const WL = (t) => rot(-0.45 * arm(t) + 3 * Math.sin(t / 380), S.shoulderL[0], S.shoulderL[1]);
  const WH = (t) => rot(4 * Math.sin(t / 300 + 1) * (0.3 + gust(t)) - sgn * 9 * gust(t) * 0.4, S.hair[0], S.hair[1]);
  const WM = (t) => rot(3.2 * Math.sin(t / 340 + 2) * (0.3 + gust(t)) + sgn * 3 * gust(t), S.hem[0], S.hem[1]);
  h.drive(k.part('armL'), S.shoulderL, WL, 3700, 70);
  h.drive(k.part('hair'), S.hair, WH, 3700, 70);
  h.drive(k.part('hem'), S.hem, WM, 3700, 70);

  // ── the light in her hand swells, blazes through the sweep and the stream, and fades
  h.ride(k.lightIn('g-tide', E0, 52, 52), E0, WA, clean([[200, 0.4, 0], [620, 0.9, 0.5], [1000, 1.6, 1], [1500, 1.4, 0.9], [1750, 1.6, 1], [2100, 1.1, 0.8], [2600, 0.6, 0], [3701, 0.6, 0]]));
  h.ride(k.picIn('star', E0, 30, 30), E0, WA, clean([[900, 0.3, 0], [1100, 1.2, 1], [1400, 0.9, 0.8], [1800, 1.2, 0.9], [2300, 0.4, 0], [3701, 0.4, 0]]));
  // the swell running up the wave, and its crest shimmering
  fx(k.lightIn('g-tide', [150, 86], 300, 150, { under: true }), [[100, { opacity: 0 }, 'ease-out'], [600, { opacity: 0.55 }, eio], [1100, { opacity: 0.75 }, eio], [2100, { opacity: 0.6 }, eio], [3100, { opacity: 0 }]]);
  const crest = k.svg('<defs><filter id="b" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><path d="M10,34C30,24 50,14 80,10C100,12 116,20 126,32C132,42 130,52 126,58" fill="none" stroke="#f6fffe" stroke-width="4.2" stroke-linecap="round" filter="url(#b)"/>', 140, 66);
  const cl = [[150, { opacity: 0 }, eio]];
  for (let t = 500, i = 0; t < 2600; t += 170, i++) cl.push([t, { opacity: i % 2 ? 0.55 : 0.95 }, eio]);
  cl.push([3100, { opacity: 0 }]);
  fx(k.picIn(crest, [210, 40], 140, 66), cl);

  // ── the cargo: each scroll and fish quivers, hops, lifts to her hand, flies to T, and later returns in place
  const scrollSvg = k.svg('<rect x="3.4" y="2.6" width="15.2" height="3.8" rx="1" fill="#fbfaee"/><rect x="1" y="1.8" width="3.4" height="5.4" rx="1.6" fill="#d8dcc4"/><rect x="17.6" y="1.8" width="3.4" height="5.4" rx="1.6" fill="#d8dcc4"/><path d="M6,4h10" stroke="#9fb4b0" stroke-width=".5"/>', 22, 9);
  const fishSvg = k.svg('<path d="M7,5Q14,0 22,5Q14,10 7,5Z" fill="#eef7f8"/><path d="M7,5L1,1L2.6,5L1,9Z" fill="#eef7f8"/><circle cx="18.4" cy="4.4" r=".8" fill="#2d6470"/>', 23, 10);
  const items = [];
  S.scrolls.forEach((p, i) => items.push({ name: `scroll${i}`, S: p, kind: 'scroll', r0: [-24, 16, -32, 28, -8][i] }));
  S.fish.forEach((p, i) => items.push({ name: `fish${i}`, S: p, kind: 'fish', r0: [-24, -30, -40, -34, 20, 40, -10, -14, -28][i] }));
  const E1 = Eat(1100);
  items.sort((a, b) => Math.hypot(a.S[0] - E1[0], a.S[1] - E1[1]) - Math.hypot(b.S[0] - E1[0], b.S[1] - E1[1]));
  const C = [(E1[0] + T[0]) / 2, Math.min(E1[1], T[1]) - 44];
  const arrivals = [];
  items.forEach((it, i) => {
    const t0 = 720 + i * 45, ta = t0 + 380, [sx, sy] = it.S, part = k.part(it.name), q = (it.kind === 'fish' ? 1 : -1) * (i % 2 ? 1 : -1);
    const Ea = Eat(ta), flyT = 520 + rand() * 90 + (it.kind === 'fish' ? 20 : 0), tl = ta + flyT;
    arrivals.push(tl);
    const mid = [(sx + Ea[0]) / 2 + (rand() - 0.5) * 8, Math.min(sy, Ea[1]) - 8 - rand() * 8];
    // (the part, inside the picture: quiver, hop, then up to her hand)
    const hop = 150 + i * 28;
    act(part, [[0, { transform: 'none' }, eio], [hop, { transform: `${k.T(0, 0)} rotate(0deg) scale(1)` }, eio], [hop + 90, { transform: `${k.T(0, -2)} rotate(${q * 7}deg) scale(1.08)` }, eio], [hop + 180, { transform: `${k.T(0, 0)} rotate(${-q * 5}deg) scale(1.02)` }, eio],
      [t0 - 60, { transform: `${k.T(0, -2.5)} rotate(${q * 6}deg) scale(1.1)` }, 'ease-in'], [t0 + 200, { transform: `${k.T(mid[0] - sx, mid[1] - sy)} rotate(${q * 40}deg) scale(.9)`, opacity: 1 }, 'ease-out'],
      [ta - 30, { transform: `${k.T(Ea[0] - sx, Ea[1] - sy)} rotate(${q * 80}deg) scale(.7)`, opacity: 1 }], [ta, { transform: `${k.T(Ea[0] - sx, Ea[1] - sy)} rotate(${q * 80}deg) scale(.7)`, opacity: 0 }],
      [3000 + i * 30, { transform: `${k.T(0, 0)} rotate(0deg) scale(1)`, opacity: 0 }], [3350 + i * 30, { transform: 'none', opacity: 1 }, 'ease-out']]);
    // (the flight to T, on the overlay, from her hand)
    const bz = (f) => { const p = 1 - f; return [p * p * Ea[0] + 2 * p * f * C[0] + f * f * T[0], p * p * Ea[1] + 2 * p * f * C[1] + f * f * T[1]]; };
    const pace = (f) => f * f * 0.45 + f * 0.55;
    const N = 6, fl = [], tr2 = [];
    for (let n = 0; n <= N; n++) {
      const f = n / N, p = bz(pace(f)), p2 = bz(Math.min(1, pace(f) + 0.04)), p1 = bz(Math.max(0, pace(f) - 0.04));
      const tan = ang(p1, p2), sc = (it.kind === 'fish' ? 1 : 0.9) * (0.7 + 0.5 * Math.sin(Math.min(1, f * 1.3) * Math.PI * 0.5));
      const r = it.kind === 'fish' ? tan + Math.sin(f * 6 + i) * 10 : it.r0 + q * 360 * f * 1.2;
      const base = { transform: `${k.T(p[0] - Ea[0], p[1] - Ea[1])} rotate(${r.toFixed(0)}deg) scale(${(f === 1 ? sc * 0.7 : sc).toFixed(2)})`, opacity: n === 0 ? 0 : n === N ? 0 : 1 };
      fl.push([ta + flyT * f, n === 0 ? { ...base, opacity: 1 } : base, 'linear']);
      tr2.push([ta + flyT * Math.min(1, f + 0.12), { transform: `${k.T(p[0] - Ea[0], p[1] - Ea[1])} scale(${(1.4 - f * 0.5).toFixed(2)})`, opacity: n === 0 ? 0 : n === N ? 0 : 0.8 }, 'linear']);
    }
    fx(k.pic(it.kind === 'fish' ? fishSvg : scrollSvg, Ea, it.kind === 'fish' ? 18 : 17.5, it.kind === 'fish' ? 7.8 : 7), fl);
    fx(k.pic('mote', Ea, 16, 16), tr2);
    // (a shimmer where it returns to the wave)
    fx(k.lightIn('g-tide', it.S, 22, 22), [[3150 + i * 30, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [3380 + i * 30, { transform: 'scale(1.1)', opacity: 0.85 }, 'ease-out'], [3750 + i * 30, { transform: 'scale(1.5)', opacity: 0 }]]);
  });

  // ── where it lands: the sea (or the friend) bursts into light as the groups arrive
  const first = Math.min(...arrivals), lastA = Math.max(...arrivals);
  fx(k.light('g-tide', T, 80), [[first - 80, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [first + 90, { transform: 'scale(1.1)', opacity: 0.9 }, eio], [lastA, { transform: 'scale(1.2)', opacity: 0.85 }, eio], [lastA + 700, { transform: 'scale(1.5)', opacity: 0 }]]);
  const ringSvg = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#e6fffc" stroke-width="5" filter="url(#b)"/>', 100, 100);
  const drop = k.svg('<path d="M3,0C5,3 6,5 3,8C0,5 1,3 3,0Z" fill="#e9fffd"/>', 6, 8);
  [0, 0.4, 0.8].forEach((fr, gi) => {
    const IM = Math.round(first + fr * (lastA - first)) - 20;
    fx(k.pic('mote', T, 52, 52), [[IM - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [IM + 420, { transform: 'scale(1.7)', opacity: 0 }]]);
    fx(k.pic(ringSvg, T, 50 + gi * 8, 50 + gi * 8), [[IM, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(.4)', opacity: 0.95 }, 'ease-out'], [IM + 560, { transform: 'scale(1.15)', opacity: 0 }]]);
    if (gi === 0) fx(k.pic('star', T, 34, 34), [[IM - 20, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(1.2) rotate(30deg)', opacity: 1 }, 'ease-out'], [IM + 400, { transform: 'scale(.6) rotate(70deg)', opacity: 0 }]]);
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (rand() - 0.5) * 2.2, v = 16 + rand() * 22, life = 520 + rand() * 260, r0 = Math.round(a * 57.3 + 90);
      const pp = (f) => k.T(Math.cos(a) * v * f, Math.sin(a) * v * f + 46 * f * f);
      fx(k.pic(drop, T, 3.6, 4.8), [0, 0.3, 0.7, 1].map((f, j) => [IM + life * f, { transform: `${pp(f)} rotate(${r0 + Math.round(f * 60)}deg) scale(${(1.1 - 0.4 * f).toFixed(2)})`, opacity: j === 0 ? 0 : j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']));
    }
  });
  // bubbles of light rising from it, and the light settling
  for (let i = 0; i < 8; i++) {
    const t = first + 160 + i * 160 + rand() * 80, x = T[0] + (rand() - 0.5) * 30, y = T[1] + (rand() - 0.2) * 10, d = 18 + rand() * 18;
    fx(k.pic('mote', [x, y], 3 + rand() * 2.4, 3 + rand() * 2.4), [[t, { transform: `${k.T(0, 0)} scale(.5)`, opacity: 0 }, 'ease-out'], [t + 300, { transform: `${k.T((rand() - 0.5) * 6, -d * 0.3)} scale(1)`, opacity: 0.9 }, 'linear'], [t + 1100, { transform: `${k.T((rand() - 0.5) * 10, -d)} scale(.8)`, opacity: 0 }]]);
  }
  // a light running up the wave as the last ones leave, and spray at her hand as each takes off
  for (let i = 0; i < 6; i++) {
    const t = 1080 + i * 130, a = -Math.PI / 2 + sgn * (0.2 + i * 0.22) + (rand() - 0.5) * 0.4, v = 10 + rand() * 12;
    fx(k.pic('mote', E1, 4, 4), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 160, { transform: `${k.T(Math.cos(a) * v * 0.6, Math.sin(a) * v * 0.6)} scale(1)`, opacity: 1 }, 'linear'], [t + 520, { transform: `${k.T(Math.cos(a) * v, Math.sin(a) * v + 6)} scale(.5)`, opacity: 0 }]]);
  }
}
