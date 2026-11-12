// Ironhide Charger: the armoured beast paws, drops its head, and charges; the blow
// bursts in a wall of dust, flung clods and cracking ground.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker (as suggested); element
// earth (the suggested wind was the dust, but what it throws is the ground itself: dust,
// clods, cracks).
//   0-880     gather: it rocks back and squats on its haunches, head dropping and the horn
//             levelling at T, shuddering; its hooves scrape and kick dust up behind it.
//   900       RELEASE: it springs forward (body stretched), a ground-hugging wave of dust and
//             flung clods leaves the horn for T, the dust boils up behind its heels.
//   1250      IMPACT at T: the horn strikes: a flash of dust-lit sun, two shock rings, dust
//             billowing out, clods thrown in arcs, cracks running across the ground; its
//             head tosses up (hit the target, flung it) as the body slams down and rocks.
//   1250-2600 follow-through: it overshoots, then drags back, snorting dust from its nostrils,
//             the dust cloud lifting and thinning. At rest as drawn from 3300 (END 3700).
// Aimed: T = k.aim || [4, 144] (a foe just ahead of the horn). It works in its own
// (left-facing) space, mirrored as a whole, through a sliver, when T is on its right. The
// wave and the blow are worked out from spec.emit (the horn's tip) and T. It runs at most
// 58 units toward T, the wave carries the rest of the way.
import { mul, rot, scl, tr, app, curve, kit } from './_fx.js';
export const END = 3700;
export const BEATS = { release: 900, impact: 1250, settle: 3300 };
export const STILLS = [450, 850, 1000, 1150, 1300, 1550, 2100, 3500];
export const textures = {
  dust: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, a = Math.max(0, 1 - r); const b = 0.88 + 0.12 * Math.sin(x * 17) * Math.cos(y * 13); return [232 * b, 212 * b, 158 * b, Math.min(1, a * a * 2.1) * 0.9]; }],
  clod: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2; const sh = 1 - 0.5 * (x + y - 0.6); return [88 * sh, 70 * sh, 40 * sh, r < 0.82 ? 1 : Math.max(0, (1 - r) * 5)]; }],
  glint: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 240, 190 + 40 * c, Math.min(1, c * c * 2.4)]; }],
};

export function build(k) {
  const { fx, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const body = k.part('body'), head = k.part('head'), plates = k.part('plates'), eye = k.part('eye');
  const MID = k.spec.mid, NK = k.spec.neck, E = k.spec.emit, G = k.spec.ground;
  const T = k.aim || [4, 144];
  const mirrored = T[0] > MID[0] + 10;
  const Tl = mirrored ? [2 * MID[0] - T[0], T[1]] : T; // the target in its own (left-facing) space
  const dx = Tl[0] - E[0], dy = Tl[1] - E[1], dist = Math.hypot(dx, dy) || 1, ux = dx / dist, uy = dy / dist;
  const D = Math.max(22, Math.min(58, dist - 8)); // how far it runs
  const back = mirrored ? -1 : 1; // which way is behind it, in the world

  k.css('.g-dust { border-radius: 50%; background: radial-gradient(circle, rgba(255,246,206,.9), rgba(244,218,150,.5) 34%, rgba(214,184,104,.16) 62%, rgba(204,172,90,0) 76%); }');
  const crackSvg = k.svg('<defs><filter id="b" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation=".9"/></filter></defs>' +
    '<path d="M60,8L46,14L40,10L28,18L18,15L4,22M60,8L50,2L44,6L36,0M60,8L58,22L66,30L62,42M60,8L74,13L84,10L96,18L106,15L118,22M60,8L70,3L78,6L88,0" stroke="#ffe6a0" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".75" filter="url(#b)"/>' +
    '<path d="M60,8L46,14L40,10L28,18L18,15L4,22M60,8L50,2L44,6L36,0M60,8L58,22L66,30L62,42M60,8L74,13L84,10L96,18L106,15L118,22M60,8L70,3L78,6L88,0" stroke="#1c2612" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>', 120, 44);
  const ringSvg = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.8"/></filter></defs><ellipse cx="50" cy="50" rx="42" ry="42" fill="none" stroke="#f6e2a8" stroke-width="6" filter="url(#b)"/>', 100, 100);

  // ── its motion: one body (and the plates and eye drawn over it) lunging from its middle,
  //    the head (and its eye) tossing from the neck; the whole thing mirrored when T is on its right
  const flip = mirrored ? curve([[0, 1], [380, -1], [2750, -1], [3200, 1]]) : () => 1;
  const MIR = (t) => { const v = flip(t); return scl(Math.sign(v || 1) * Math.max(0.06, Math.abs(v)), 1, MID[0], 0); };
  const lunge = curve([[0, 0], [300, -0.25], [880, -0.55, 'in'], [1010, 0.55, 'out'], [1250, 1], [1480, 1.1], [1900, 0.4], [2500, 0.03], [3100, 0]]);
  const turn = curve([[0, 0], [880, -2.2], [1010, -3, 'out'], [1250, -1], [1330, 3.5], [1700, -1.6], [2300, 0.6], [3000, 0]]); // + lifts the nose
  const squash = curve([[0, 1], [500, 0.97], [880, 0.93, 'in'], [1010, 1.045, 'out'], [1250, 1.0], [1330, 0.955], [1700, 1.01], [2300, 1], [3000, 1]]);
  const shudder = curve([[0, 0], [250, 0.4], [880, 1, 'in'], [1000, 0], [3000, 0]]);
  const BODY = (t) => {
    const L = lunge(t), d = L * (L < 0 ? 14 : D), s = squash(t), sh = shudder(t) * Math.sin(t * 0.19) * 0.9;
    return mul(tr(ux * d, uy * d * 0.25 + sh), mul(rot(turn(t), MID[0], MID[1]), scl(1 + (1 - s) * 0.5, s, MID[0], G)));
  };
  const psi = curve([[0, 0], [400, -4], [880, -12, 'in'], [1040, -10, 'out'], [1250, -6], [1310, 22, 'out'], [1420, 27], [1800, 9], [2200, -3], [3000, 0]]); // head about the neck (- is down)
  const sniff = curve([[0, 0], [1900, 0], [2050, -5], [2200, 3], [2400, -4], [2600, 0]]);
  const WB = (t) => mul(MIR(t), BODY(t));
  const WH = (t) => mul(WB(t), rot(psi(t) + sniff(t), NK[0], NK[1]));
  h.drive(body, MID, WB, 3300);
  h.drive(plates, MID, WB, 3300);
  h.drive(head, NK, WH, 3300);
  h.drive(eye, NK, WH, 3300);

  // ── a billow of dust at a world point (overlay), rolling outward / up and thinning
  const billow = (p, t0, size, vx, vy, life, o0 = 0.8, grow = 1.9, base = 0.45) => {
    const r = Math.round(rand() * 360);
    fx(k.pic('dust', p, size, size, { lit: false }), [[t0, { transform: `rotate(${r}deg) scale(${base * 0.7})`, opacity: 0 }, 'ease-out'], [t0 + 140, { transform: `${k.T(vx * 0.4, vy * 0.4)} rotate(${r + 15}deg) scale(${base + 0.5 * (grow - base)})`, opacity: o0 }, 'ease-out'],
      [t0 + life, { transform: `${k.T(vx, vy)} rotate(${r + 40}deg) scale(${grow})`, opacity: 0 }]]);
  };
  const feet = [[111, 184], [155, 184]];
  const lowBillow = (p, t0, size, vx, vy, life, o0 = 0.75, grow = 1.7) => {
    const r = Math.round(rand() * 360);
    fx(k.picIn('dust', p, size, size, { lit: false }), [[t0, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 140, { transform: `${k.T(vx * 0.4, vy * 0.4)} rotate(${r + 15}deg) scale(${0.4 + 0.5 * (grow - 0.4)})`, opacity: o0 }, 'ease-out'],
      [t0 + life, { transform: `${k.T(vx, vy)} rotate(${r + 40}deg) scale(${grow})`, opacity: 0 }]]);
  };

  // ── light: the dust takes the low sun and glints on the plates and horn
  fx(k.lightIn('g-dust', [170, 150], 300, 110, { under: true }), [[300, { opacity: 0 }, 'ease-out'], [1000, { opacity: 0.35 }, eio], [1350, { opacity: 0.6 }, eio], [2300, { opacity: 0.3 }, eio], [3300, { opacity: 0 }]]);
  h.ride(k.light('g-dust', E, 28), E, WH, [[600, 0.4, 0], [900, 1.0, 0.6], [1100, 1.4, 0.9], [1250, 1.5, 0.9], [1500, 1.0, 0.45], [1900, 0.5, 0]]);
  for (const [i, p] of [[0, [118, 118]], [1, [150, 112]], [2, [182, 118]]]) h.ride(k.light('g-dust', p, 26), p, WB, [[600 + i * 100, 0.4, 0], [1040, 1.0, 0.45], [1300, 1.2, 0.55], [1900, 0.7, 0.2], [2500, 0.4, 0]]);

  // ── gathering: it paws and scrapes; dust kicked up behind its hooves, a rumble in the ground
  for (let i = 0; i < 12; i++) {
    const t0 = 220 + i * 55 + rand() * 25, f = feet[i % 2], p = app(WB(Math.min(t0, 3300)), [f[0] + (rand() - 0.5) * 8, f[1]]);
    lowBillow(p, t0, 12 + rand() * 7, back * (10 + rand() * 12), -(6 + rand() * 8), 520 + rand() * 120, 0.7, 1.7);
  }
  // clods flicked up by the scraping hoof
  for (let i = 0; i < 6; i++) {
    const t0 = 420 + i * 80 + rand() * 30, f = feet[i % 2], p = app(WB(Math.min(t0, 3300)), [f[0] - 4, f[1] - 2]);
    const vx = back * (8 + rand() * 14), vy = -(14 + rand() * 12), life = 380 + rand() * 120, sz = 3 + rand() * 2;
    const ks = [0, 0.35, 0.7, 1].map((f2, j) => [t0 + life * f2, { transform: `${k.T(vx * f2, vy * f2 + 34 * f2 * f2)} rotate(${Math.round(f2 * 220)}deg)`, opacity: j === 0 || j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']);
    fx(k.picIn('clod', p, sz, sz, { lit: false }), ks);
  }

  // ── the charge (900-1250): dust boiling up behind its heels, and a ground-hugging wave off the horn to T
  for (let i = 0; i < 12; i++) {
    const t0 = 930 + i * 34, f = feet[i % 2], p = app(WB(t0), [f[0] + 14 + rand() * 40, f[1] - 2]);
    lowBillow(p, t0, 17 + rand() * 9, back * (14 + rand() * 18), -(5 + rand() * 9), 650 + rand() * 150, 0.85, 1.9);
  }
  const M = app(WH(1060), E), bz = h.arcPath(M, T, 8);
  for (let i = 0; i < 20; i++) {
    const t0 = 950 + i * 16, t1 = 1185 + i * 12, id = i % 4, sz = [15, 5, 12, 6][id], side = (rand() - 0.5) * 6, r = Math.round(rand() * 360);
    const bz2 = (f) => { const p = bz(f); return [p[0], p[1] + side * Math.sin(Math.PI * f)]; };
    h.fly(k.pic(['dust', 'clod', 'dust', 'glint'][id], M, sz, sz, { lit: false }), M, bz2, t0, t1, (f) => (id === 1 ? 1 : id === 3 ? 1.2 - 0.5 * f : 0.5 + 0.9 * f), (f) => (f < 0.1 ? f * 9 : f > 0.94 ? 0.2 : 0.9), r, 160);
  }

  // ── the blow (BEATS.impact) at T
  const IM = 1250;
  const flash = [[IM - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [IM + 200, { transform: 'scale(1.9)', opacity: 0.6 }]];
  for (let t = IM + 340, i = 0; t < IM + 800; t += 120, i++) flash.push([t, { transform: `scale(${i % 2 ? 1.4 : 1.15})`, opacity: i % 2 ? 0.5 : 0.35 }, eio]);
  flash.push([IM + 1200, { transform: 'scale(.9)', opacity: 0 }]);
  fx(k.light('g-dust', T, 66), flash);
  fx(k.light('g-dust', T, 22), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 30, { transform: 'scale(1.6)', opacity: 1 }], [IM + 170, { transform: 'scale(2.6)', opacity: 0 }]]);
  fx(k.pic(ringSvg, T, 62, 62), [[IM, { transform: 'scale(.15, .08)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(.4, .22)', opacity: 0.95 }, 'ease-out'], [IM + 440, { transform: 'scale(1.15, .6)', opacity: 0 }]]);
  fx(k.pic(ringSvg, T, 62, 62), [[IM + 100, { transform: 'scale(.1, .05)', opacity: 0 }, 'ease-out'], [IM + 160, { transform: 'scale(.3, .16)', opacity: 0.6 }, 'ease-out'], [IM + 560, { transform: 'scale(.85, .45)', opacity: 0 }]]);
  // dust flung out and rolling up
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + rand() * 0.4, d = 16 + rand() * 20, t = IM + rand() * 40;
    billow([T[0] + Math.cos(a) * 3, T[1] + 2 + Math.sin(a) * 2], t, 18 + rand() * 12, Math.cos(a) * d, Math.sin(a) * d * 0.55 - 6 - rand() * 8, 800 + rand() * 300, 0.85, 1.9);
  }
  // a pillar of dust standing up where it struck
  for (let i = 0; i < 5; i++) billow([T[0] + (rand() - 0.5) * 10, T[1] + 2], IM + 80 + i * 90, 22 + rand() * 8, (rand() - 0.5) * 12, -(18 + i * 8), 1200 + rand() * 300, 0.7, 2.3, 0.5);
  // clods thrown in arcs
  for (let i = 0; i < 16; i++) {
    const a = -Math.PI * (0.08 + rand() * 0.84), v = 18 + rand() * 38, t = IM + rand() * 40, life = 480 + rand() * 360, sz = 3.5 + rand() * 3.5;
    const px = (f) => Math.cos(a) * v * f, py = (f) => Math.sin(a) * v * f + 44 * f * f;
    const ks = [0, 0.3, 0.65, 1].map((f, j) => [t + life * f, { transform: `${k.T(px(f), py(f))} rotate(${Math.round(f * 260)}deg) scale(${(1 - 0.3 * f).toFixed(2)})`, opacity: j === 0 ? 0 : j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']);
    fx(k.pic(i % 3 === 2 ? 'glint' : 'clod', T, sz, sz, { lit: false }), ks);
  }
  // glints of sun on flung grit
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI * (0.05 + rand() * 0.9), v = 16 + rand() * 30, t = IM + rand() * 30, life = 300 + rand() * 260;
    const px = (f) => Math.cos(a) * v * f, py = (f) => Math.sin(a) * v * f + 34 * f * f;
    const ks = [0, 0.35, 0.7, 1].map((f, j) => [t + life * f, { transform: `${k.T(px(f), py(f))} scale(${(1 - 0.7 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']);
    fx(k.pic('glint', T, 4 + rand() * 2, 4 + rand() * 2), ks);
  }
  // the ground cracks, a glow in the splits, and heals back to the earth as it settles
  const cr = ((rand() - 0.5) * 8).toFixed(1);
  fx(k.pic(crackSvg, [T[0], T[1] + 12], 96, 35, { lit: false, low: true }), [[IM + 20, { transform: `rotate(${cr}deg) scale(.15, .15)`, opacity: 0 }, 'cubic-bezier(.2,.7,.4,1)'], [IM + 260, { transform: `rotate(${cr}deg) scale(1, 1)`, opacity: 1 }], [2500, { transform: `rotate(${cr}deg) scale(1, 1)`, opacity: 1 }, eio], [3200, { transform: `rotate(${cr}deg) scale(1, 1)`, opacity: 0 }]]);

  // ── after: it has dragged to a halt; dust lifting off its plates, snorting
  for (let i = 0; i < 6; i++) {
    const t = 1500 + i * 170 + rand() * 60, p = app(WB(Math.min(t, 3300)), [120 + rand() * 80, 100 + rand() * 12]);
    billow(p, t, 14 + rand() * 7, back * (5 + rand() * 8), -(10 + rand() * 12), 900, 0.5, 1.8, 0.5);
  }
  for (let i = 0; i < 4; i++) {
    const t = 1950 + i * 150, p = app(WH(Math.min(t, 3300)), [54, 150]);
    billow(p, t, 10 + rand() * 4, -back * (6 + rand() * 6), -(3 + rand() * 5), 500, 0.6, 1.5, 0.5);
  }
}
