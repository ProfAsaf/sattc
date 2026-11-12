// Sudden Growth: the Trick that makes a creature enormous. The fox is the growth itself: the earth heaves,
// roots and vines surge up, the fox swells and its tail whips, and the green-gold light of the boon goes to T.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support (as suggested: a buff, +3/+3), element nature.
//   0-800     gather: the ground glows at the fox's feet, motes of green light stream in along the soil
//             to the spell's heart (emit); the roots and vines tremble, the fox crouches a hair as it
//             draws a breath.
//   800       RELEASE: the earth bursts: a ring of light runs out along the ground, clods and leaves are
//             thrown up, the fox surges up and out (squashing and rising from its feet), the roots heave
//             and the front vines whip; a stream of light and leaves leaves emit for T.
//   1250      IMPACT at T: a flash, a ring, rising chevrons (bigger!), a swirl of leaves and motes, a glow
//             that lingers and lifts. Alone, T is the fox's chest: the surge itself.
//   1250-3000 follow-through: the fox overshoots, rocks back and settles, the tail whips and damps,
//             the vines sway down, the buds flare and fade, leaves drift down; at rest from 3300 (END 3800).
// Aimed: T = k.aim || [156, 118]. The stream goes from emit to T along an arc and the bloom opens at T,
// on the overlay (it may be on another card); the fox surges whichever way, as the picture of the spell.
import { mul, rot, scl, tr, app, curve, kit } from './_fx.js';
export const END = 3800;
export const BEATS = { release: 800, impact: 1250, settle: 3300 };
export const STILLS = [450, 780, 900, 1050, 1300, 1700, 2400, 3500];
export const textures = {
  mote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [236, 255, 170 + 50 * c, Math.min(1, c * c * c * 2.4)]; }],
  star: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); const ax = Math.abs(x - 0.5) * 2, ay = Math.abs(y - 0.5) * 2, ray = Math.max(0, 1 - Math.min(ax, ay) * 9) * Math.max(0, 1 - Math.max(ax, ay)); return [240, 255, 190 + 55 * c * c, Math.min(1, c * c * c * 1.6 + ray * 0.8)]; }],
  clod: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2; return [44, 36, 22, r < 1 ? Math.min(1, (1 - r) * 5) : 0]; }],
};

export function build(k) {
  const { fx, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  k.css('.g-grow { border-radius: 50%; background: radial-gradient(circle, rgba(252,255,214,.95), rgba(214,240,120,.55) 30%, rgba(150,208,72,.2) 55%, rgba(120,190,50,0) 70%); }');
  const E = k.spec.emit, FEET = k.spec.feet, TAIL = k.spec.tailRoot, RL = k.spec.rootL, RR = k.spec.rootR;
  const T = k.aim || [156, 118];
  const bz = h.arcPath(E, T, 14 + Math.min(18, Math.hypot(T[0] - E[0], T[1] - E[1]) * 0.1));
  const fxt = (v) => v.toFixed(2);

  // ── the pieces
  const sy = curve([[0, 1], [400, 0.985], [790, 0.94, 'in'], [1010, 1.15, 'out'], [1250, 1.07], [1650, 0.985], [2200, 1.015], [2900, 1]]);
  const WB = (t) => scl(1 + (1 - sy(t)) * 0.55, sy(t), FEET[0], FEET[1]);
  const ta = curve([[0, 0], [600, 5], [790, 9, 'in'], [960, -17, 'out'], [1160, 10], [1400, -6], [1700, 3.5], [2000, -1.5], [2400, 0.5], [2900, 0]]);
  const WT = (t) => mul(WB(t), rot(ta(t), TAIL[0], TAIL[1]));
  h.drive(k.part('body'), FEET, WB, 3300);
  h.drive(k.part('eye'), FEET, WB, 3300);
  h.drive(k.part('tail'), TAIL, WT, 3300);
  const ry = (d) => curve([[0, 1], [500, 0.985], [790, 0.96, 'in'], [1000 + d, 1.1, 'out'], [1250 + d, 1.04], [1700 + d, 0.99], [2300 + d, 1.01], [3000, 1]]);
  const rrot = (d, a) => curve([[0, 0], [500, -a * 0.3], [790, a * 0.4, 'in'], [1000 + d, -a, 'out'], [1300 + d, a * 0.5], [1800 + d, -a * 0.2], [2500, 0]]);
  const rl = ry(0), rr = ry(70), al = rrot(0, 4), ar = rrot(70, -4);
  const WRL = (t) => mul(rot(al(t), RL[0], RL[1]), scl(1 + (1 - rl(t)) * 0.4, rl(t), RL[0], RL[1]));
  const WRR = (t) => mul(rot(ar(t), RR[0], RR[1]), scl(1 + (1 - rr(t)) * 0.4, rr(t), RR[0], RR[1]));
  h.drive(k.part('rootsL'), RL, WRL, 3300);
  h.drive(k.part('budsL'), RL, WRL, 3300);
  h.drive(k.part('rootsR'), RR, WRR, 3300);
  h.drive(k.part('budsR'), RR, WRR, 3300);
  const fl = curve([[0, 0], [790, 1.5, 'in'], [950, -5, 'out'], [1250, 3], [1700, -1.2], [2300, 0]]);
  const fr = curve([[0, 0], [830, -1.5, 'in'], [1020, 5, 'out'], [1320, -3], [1800, 1.2], [2400, 0]]);
  const flu = curve([[0, 0], [790, 0.5, 'in'], [950, -4, 'out'], [1250, 1], [1800, 0]]);
  h.drive(k.part('frontL'), [20, 200], (t) => mul(tr(0, flu(t)), rot(fl(t), 20, 200)), 3300);
  h.drive(k.part('frontR'), [290, 200], (t) => mul(tr(0, flu(t + 40)), rot(fr(t), 290, 200)), 3300);

  // ── light: the ground glows at the fox's feet while it gathers, the whole fox is lit as it grows
  fx(k.lightIn('g-grow', [150, 188], 170, 40), [[150, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [700, { transform: 'scale(1)', opacity: 0.6 }, eio], [900, { transform: 'scale(1.25)', opacity: 0.95 }, eio], [1500, { transform: 'scale(1.1)', opacity: 0.5 }, eio], [2400, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.lightIn('g-grow', [152, 116], 190, 190), [[700, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [960, { transform: 'scale(1.1)', opacity: 0.6 }, 'ease-out'], [1250, { transform: 'scale(1)', opacity: 0.4 }, eio], [1700, { transform: 'scale(1.05)', opacity: 0.3 }, eio], [2500, { transform: 'scale(.9)', opacity: 0 }]]);
  const rays = k.svg('<defs><radialGradient id="r" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fdffe0"/><stop offset="1" stop-color="#d9f58a" stop-opacity="0"/></radialGradient></defs>' +
    Array.from({ length: 12 }, (_, i) => `<path d="M50,50 L${(50 + 48 * Math.cos((i * Math.PI) / 6 - 0.06)).toFixed(1)},${(50 + 48 * Math.sin((i * Math.PI) / 6 - 0.06)).toFixed(1)} L${(50 + 48 * Math.cos((i * Math.PI) / 6 + 0.06)).toFixed(1)},${(50 + 48 * Math.sin((i * Math.PI) / 6 + 0.06)).toFixed(1)}Z" fill="url(#r)"/>`).join(''), 100, 100);
  fx(k.picIn(rays, [152, 112], 250, 250), [[800, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(.8) rotate(10deg)', opacity: 0.7 }, 'ease-out'], [1900, { transform: 'scale(1.15) rotate(30deg)', opacity: 0.2 }], [2500, { transform: 'scale(1.3) rotate(40deg)', opacity: 0 }]]);
  // the buds at the vine tips flare, riding their vines
  [[[36, 92], WRL], [[70, 44], WRL], [[246, 52], WRR], [[280, 104], WRR]].forEach(([p, W], i) => {
    const d = i * 55;
    h.ride(k.lightIn('g-grow', p, 40, 40), p, W, [[0, 0.4, 0], [880 + d, 0.5, 0], [1000 + d, 1.9, 0.95], [1350 + d, 1.35, 0.7], [1900 + d, 1.1, 0.5], [2700 + d, 0.6, 0]]);
  });
  fx(k.lightIn('g-grow', [134, 77], 26, 26), [[880, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1020, { transform: 'scale(1.4)', opacity: 0.95 }, 'ease-out'], [1500, { transform: 'scale(1)', opacity: 0.5 }, eio], [2300, { transform: 'scale(.5)', opacity: 0 }]]);

  // ── gather (0 - 800): motes of green light stream along the soil to the spell's heart
  for (let i = 0; i < 24; i++) {
    const t0 = 80 + i * 26 + rand() * 20, dur = 520 + rand() * 120, sz = 3 + rand() * 3.5, x = 30 + rand() * 240, from = [x, 188 + rand() * 12];
    const ks = [];
    for (let j = 0; j <= 5; j++) {
      const f = j / 5, g = f * f * (3 - 2 * f), lift = Math.sin(Math.PI * f) * (10 + rand() * 6);
      ks.push([t0 + dur * f, { transform: `${k.T((E[0] - from[0]) * g, (E[1] - from[1]) * g - lift)} scale(${(0.6 + 0.8 * Math.sin(Math.PI * f)).toFixed(2)})`, opacity: f === 1 ? 0 : f === 0 ? 0 : 1 }, 'linear']);
    }
    fx(k.picIn('mote', from, sz, sz), ks);
  }
  // a swelling seed of light at the heart, ready to go
  fx(k.picIn('star', E, 20, 20), [[250, { transform: 'scale(.1)', opacity: 0 }, 'ease-out'], [700, { transform: `scale(1.1) rotate(120deg)`, opacity: 1 }, eio], [790, { transform: 'scale(1.5) rotate(160deg)', opacity: 1 }, 'ease-out'], [900, { transform: 'scale(.4) rotate(200deg)', opacity: 0 }]]);

  // ── RELEASE (800): the ground bursts: rings of light run out, clods and leaves are thrown up
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#eaffa6" stroke-width="5" filter="url(#b)"/>', 100, 100);
  const ground = [[800, { transform: 'scale(.2, .05)', opacity: 0 }, 'ease-out'], [860, { transform: 'scale(.5, .13)', opacity: 0.95 }, 'ease-out'], [1400, { transform: 'scale(1.9, .5)', opacity: 0 }]];
  fx(k.picIn(ring, [150, 188], 100, 100), ground);
  fx(k.picIn(ring, [150, 188], 100, 100), [[900, { transform: 'scale(.15, .04)', opacity: 0 }, 'ease-out'], [960, { transform: 'scale(.4, .1)', opacity: 0.6 }, 'ease-out'], [1500, { transform: 'scale(1.5, .38)', opacity: 0 }]]);
  const leafA = k.svg('<path d="M10,1 C17,6 17,17 10,25 C3,17 3,6 10,1Z" fill="#5f7f3e"/><path d="M10,4 L10,22" stroke="#dff3a0" stroke-width=".9" fill="none"/>', 20, 26);
  const leafB = k.svg('<path d="M10,1 C17,6 17,17 10,25 C3,17 3,6 10,1Z" fill="#d6e89a"/><path d="M10,4 L10,22" stroke="#7e9a4c" stroke-width=".9" fill="none"/>', 20, 26);
  const leafC = k.svg('<path d="M10,1 C17,6 17,17 10,25 C3,17 3,6 10,1Z" fill="#2f4421"/><path d="M10,4 L10,22" stroke="#9fbb62" stroke-width=".9" fill="none"/>', 20, 26);
  const spots = [[RL[0] + 4, 190], [RL[0] + 24, 192], [FEET[0] - 40, 188], [FEET[0] + 40, 188], [RR[0] - 20, 190], [RR[0] + 8, 192], [100, 186], [200, 186]];
  for (let i = 0; i < 26; i++) {
    const [sx, sy0] = spots[i % spots.length], t = 820 + rand() * 200, life = 1300 + rand() * 600, a = -Math.PI * (0.12 + rand() * 0.76), v = 44 + rand() * 70, sz = 7 + rand() * 5;
    const vx = Math.cos(a) * v * 0.8, vy = Math.sin(a) * v, r0 = Math.round(rand() * 360), spin = (rand() - 0.5) * 500;
    const ks = [0, 0.1, 0.3, 0.55, 0.8, 1].map((f, j) => [t + life * f, { transform: `${k.T(vx * f + Math.sin(f * 9 + i) * 3 * f, vy * f + 80 * f * f)} rotate(${Math.round(r0 + spin * f)}deg) scale(${(0.5 + 0.6 * Math.min(1, f * 6)).toFixed(2)})`, opacity: j === 0 || j === 5 ? 0 : 1 }, j ? 'linear' : 'ease-out']);
    fx(k.picIn(i % 3 === 0 ? leafB : i % 3 === 1 ? leafA : leafC, [sx + (rand() - 0.5) * 16, sy0], sz * 0.75, sz, { lit: false }), ks);
  }
  for (let i = 0; i < 12; i++) {
    const [sx, sy0] = spots[(i * 3) % spots.length], t = 810 + rand() * 80, life = 650 + rand() * 350, a = -Math.PI * (0.1 + rand() * 0.8), v = 30 + rand() * 50, sz = 3 + rand() * 3;
    const ks = [0, 0.3, 0.65, 1].map((f, j) => [t + life * f, { transform: `${k.T(Math.cos(a) * v * f, Math.sin(a) * v * f + 70 * f * f)} scale(${(1 - 0.4 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']);
    fx(k.picIn('clod', [sx + (rand() - 0.5) * 20, sy0 + 2], sz, sz, { lit: false }), ks);
  }

  // ── the stream: light and leaves leave emit for T (800 - 1250)
  const lead = k.pic('star', E, 24, 24);
  const lk = [[840, { transform: 'scale(.4) rotate(0deg)', opacity: 0 }, 'ease-out']];
  for (let j = 0; j <= 6; j++) { const f = j / 6, p = bz(f * f * 0.45 + f * 0.55); lk.push([900 + f * 340, { transform: `${k.T(p[0] - E[0], p[1] - E[1])} scale(${(1.4 - 0.2 * f).toFixed(2)}) rotate(${Math.round(f * 200)}deg)`, opacity: 1 }, 'linear']); }
  lk.push([1330, { transform: `${k.T(T[0] - E[0], T[1] - E[1])} scale(1.6) rotate(240deg)`, opacity: 0 }]);
  fx(lead, lk);
  for (let i = 0; i < 18; i++) {
    const t0 = 850 + i * 18, t1 = 1190 + i * 12 + rand() * 20, sz = [8, 4, 10][i % 3], sd = (rand() - 0.5) * 12;
    const bz2 = (f) => { const p = bz(f); return [p[0] + sd * Math.sin(Math.PI * f) * 0.5, p[1] + sd * Math.sin(Math.PI * f)]; };
    h.fly(k.pic('mote', E, sz, sz), E, bz2, t0, t1, (f) => 1.1 - 0.6 * f, (f) => (f < 0.1 ? f * 9 : 0.9 * (1 - f * 0.4)), 0, 0, 50, (f) => f * f * 0.5 + f * 0.5);
  }
  for (let i = 0; i < 7; i++) {
    const t0 = 860 + i * 40, t1 = 1230 + i * 14, sd = (rand() - 0.5) * 16;
    const bz2 = (f) => { const p = bz(f); return [p[0] + sd * Math.sin(Math.PI * f), p[1] + sd * 0.6 * Math.sin(Math.PI * f)]; };
    h.fly(k.pic(i % 2 ? leafA : leafB, E, 8, 10.5, { lit: false }), E, bz2, t0, t1, (f) => 0.7 + 0.5 * Math.sin(Math.PI * f), (f) => (f < 0.12 ? f * 8 : f > 0.85 ? (1 - f) * 6 : 1), Math.round(rand() * 360), 300 + rand() * 200, 50, (f) => f * f * 0.5 + f * 0.5);
  }

  // ── IMPACT (1250): the boon blooms at T
  const IM = 1250;
  const fl2 = [[IM - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [IM + 250, { transform: 'scale(1.9)', opacity: 0.6 }]];
  for (let t = IM + 450, i = 0; t < IM + 1000; t += 140, i++) fl2.push([t, { transform: `scale(${i % 2 ? 1.5 : 1.25})`, opacity: i % 2 ? 0.5 : 0.38 }, eio]);
  fl2.push([IM + 1500, { transform: 'scale(1)', opacity: 0 }]);
  fx(k.light('g-grow', T, 66), fl2);
  fx(k.light('g-heal', T, 24), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.6)', opacity: 1 }], [IM + 220, { transform: 'scale(2.6)', opacity: 0 }]]);
  fx(k.pic(ring, T, 58, 58), [[IM, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(.4)', opacity: 0.95 }, 'ease-out'], [IM + 520, { transform: 'scale(1.15)', opacity: 0 }]]);
  fx(k.pic(ring, T, 58, 58), [[IM + 110, { transform: 'scale(.1)', opacity: 0 }, 'ease-out'], [IM + 170, { transform: 'scale(.3)', opacity: 0.6 }, 'ease-out'], [IM + 640, { transform: 'scale(.85)', opacity: 0 }]]);
  fx(k.pic(rays, T, 52, 52), [[IM - 10, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [IM + 80, { transform: 'scale(.95) rotate(12deg)', opacity: 0.9 }, 'ease-out'], [IM + 650, { transform: 'scale(1.35) rotate(40deg)', opacity: 0 }]]);
  // rising chevrons: bigger, stronger
  const chev = k.svg('<defs><filter id="c" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1"/></filter></defs><g fill="none" stroke="#f4ffc0" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#c)"><path d="M6,20 L20,8 L34,20"/><path d="M6,34 L20,22 L34,34"/></g>', 40, 42);
  for (let i = 0; i < 3; i++) {
    const t = IM + 80 + i * 200;
    fx(k.pic(chev, [T[0], T[1] + 4], 20, 21), [[t, { transform: `${k.T(0, 6)} scale(.6)`, opacity: 0 }, 'ease-out'], [t + 160, { transform: `${k.T(0, -4)} scale(1)`, opacity: 0.95 }, 'linear'], [t + 520, { transform: `${k.T(0, -26)} scale(1.1)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + rand() * 0.4, d = 14 + rand() * 20, t = IM + rand() * 40, life = 650 + rand() * 500, sz = 3 + rand() * 3.5, spin = (i % 2 ? 1 : -1) * 0.5;
    const px = (f) => Math.cos(a + spin * f) * d * (0.3 + f), py = (f) => Math.sin(a + spin * f) * d * 0.75 * (0.3 + f) - 10 * f * f;
    const ks = [0, 0.25, 0.6, 1].map((f, j) => [t + life * f, { transform: `${k.T(px(f), py(f))} scale(${(1.1 - 0.7 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']);
    fx(k.pic('mote', T, sz, sz), ks);
  }
  // a swirl of leaves out of the bloom
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + rand() * 0.5, d = 16 + rand() * 20, t = IM + 20 + rand() * 80, life = 900 + rand() * 500, r0 = Math.round(rand() * 360), sw = (rand() < 0.5 ? 1 : -1);
    const ks = [0, 0.2, 0.5, 0.8, 1].map((f, j) => [t + life * f, { transform: `${k.T(Math.cos(a + sw * f) * d * (0.2 + f), Math.sin(a + sw * f) * d * 0.7 * (0.2 + f) + 14 * f * f)} rotate(${Math.round(r0 + sw * 260 * f)}deg) scale(${(0.5 + 0.6 * Math.min(1, f * 5)).toFixed(2)})`, opacity: j === 0 || j === 4 ? 0 : 1 }, j ? 'linear' : 'ease-out']);
    fx(k.pic(i % 2 ? leafA : leafB, T, 6, 8, { lit: false }), ks);
  }
  // a few motes left, rising from T
  for (let i = 0; i < 8; i++) {
    const t = IM + 350 + i * 110 + rand() * 60, p = [T[0] + (rand() - 0.5) * 24, T[1] + 4 + rand() * 6];
    fx(k.pic('mote', p, 4, 4), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 150, { transform: 'scale(1)', opacity: 1 }], [t + 1000, { transform: `${k.T((rand() - 0.5) * 8, -26 - rand() * 12)} scale(.3)`, opacity: 0 }]]);
  }
  // motes shaken loose from the fox as it overshoots and settles
  for (let i = 0; i < 10; i++) {
    const t = 1050 + i * 150 + rand() * 70, p = [110 + rand() * 90, 60 + rand() * 100];
    fx(k.picIn('mote', p, 4, 4), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 150, { transform: 'scale(1)', opacity: 1 }], [t + 900, { transform: `${k.T((rand() - 0.5) * 8, -14 - rand() * 14)} scale(.3)`, opacity: 0 }]]);
  }
}
