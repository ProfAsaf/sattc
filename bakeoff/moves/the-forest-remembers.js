// The Forest Remembers: the colossus gathers every memory of the wood in its eyes, and sends them.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker, element spirit (Overrun: it
// rolls over what stands before it).
//   0-350     ANTICIPATION: it sinks a hair, the boughs drooping, the crown settling.
//   350-1350  GATHER: the boughs rise like arms (the one toward T highest), the crown rustles
//             and leans back; pale leaves (the memories) lift from the forest floor and spiral
//             in to its face; its eyes swell from a glow to a blaze, a mist of light fills the face.
//   1400      RELEASE: the boughs sweep down (the near one hard, with a lunge forward of the
//             crown); the eyes flash; a wave of memories (pale leaves, orbs of spirit light, a
//             rushing streak of mist) pours out from between its eyes along an arc to T
//             (k.aim, else the forest at its right); leaves are flung from the bough's tips.
//   1800      IMPACT at T: a flash, two rings of spirit light, a whirl of leaves flung out,
//             a pale surge rolling along the ground.
//   1800-3200 follow-through: the boughs swing back up and settle, the crown shakes and rains
//             leaves, the eyes burn and ebb, the whirl thins.
//   3200-3900 everything sinks home; at rest as drawn from 3900 (END 4400).
// BEATS: release 1400, impact 1800, settle 3900.
import { mul, rot, scl, app, curve, kit } from './_fx.js';
export const END = 4400;
export const BEATS = { release: 1400, impact: 1800, settle: 3900 };
export const STILLS = [250, 900, 1350, 1520, 1850, 2300, 3000, 4000];

export const textures = {
  orb: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [228 + 20 * c, 255, 190 + 55 * c * c, Math.min(1, c * c * 2.4)]; }],
  mote: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [238, 255, 205 + 50 * c, Math.min(1, c * c * 3)]; }],
};

export function build(k) {
  const { fx, u, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const crown = k.part('crown'), armL = k.part('armL'), armR = k.part('armR'), tL = k.part('tuftsL'), tR = k.part('tuftsR');
  const E = k.spec.emit, [eyeL, eyeR] = k.spec.eyes, [shL, shR] = k.spec.shoulders, [crx, cry] = k.spec.crown;
  const T = k.aim || [256, 144];
  const side = T[0] >= 150 ? 1 : -1; // +1: the right bough is the near one
  k.css('.g-mem { border-radius: 50%; background: radial-gradient(circle, rgba(246,255,222,.95), rgba(214,244,160,.55) 30%, rgba(170,225,120,.2) 58%, rgba(150,215,110,0) 72%); }');
  const leaf = k.svg('<defs><linearGradient id="g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#cfe98a"/><stop offset="1" stop-color="#fbffe8"/></linearGradient></defs><path d="M10,30C2,22 3,8 10,1C17,8 18,22 10,30Z" fill="url(#g)"/><path d="M10,29L10,6" stroke="#8fb85a" stroke-width=".9" fill="none" opacity=".7"/>', 20, 30);
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><ellipse cx="50" cy="25" rx="44" ry="20" fill="none" stroke="#eefcc4" stroke-width="3.2" filter="url(#b)"/><ellipse cx="50" cy="25" rx="44" ry="20" fill="none" stroke="#fbffee" stroke-width="1.1"/>', 100, 50);
  const streak = k.svg('<defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f4ffd8" stop-opacity="0"/><stop offset=".7" stop-color="#f4ffd8" stop-opacity=".7"/><stop offset="1" stop-color="#ffffff" stop-opacity="1"/></linearGradient><filter id="b" x="-10%" y="-80%" width="120%" height="260%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><path d="M0,10Q30,2 60,8L60,12Q30,18 0,10Z" fill="url(#s)" filter="url(#b)"/>', 60, 20);

  // ── its motion: the near bough (n) sweeps down hard, the far one (f) follows; the crown rustles and lunges
  const nearA = curve([[0, 0], [350, -4], [1000, 17], [1300, 25, 'out'], [1400, 25, 'in'], [1560, -16, 'out'], [1750, -19], [2200, -6], [2700, 3], [3300, -1], [3900, 0]]); // + raises
  const farA = curve([[0, 0], [350, -3], [1050, 10], [1400, 13, 'in'], [1600, 0, 'out'], [1900, -5], [2400, 3], [3000, -1.5], [3900, 0]]);
  const sway = (t) => (t < 1450 ? 0 : 3.2 * Math.sin((t - 1450) / 150) * Math.exp(-(t - 1450) / 560));
  const lean = curve([[0, 0], [350, 0.5], [1300, -2 * side, 'out'], [1400, -2.2 * side, 'in'], [1560, 3 * side, 'out'], [2000, 1.4 * side], [3200, 0.3 * side], [3900, 0]]);
  const grow = curve([[0, 1], [350, 0.995], [1300, 1.035, 'out'], [1560, 1.02], [2400, 1.012], [3900, 1]]);
  const armDeg = (isR, a) => (isR ? -a : a);
  const WL = (a) => (t) => rot(armDeg(false, a(t)), shL[0], shL[1]);
  const WR = (a) => (t) => rot(armDeg(true, a(t)), shR[0], shR[1]);
  const aOf = (isR) => (isR === (side === 1) ? nearA : farA);
  h.drive(armL, shL, WL(aOf(false)), 3900);
  h.drive(tL, shL, WL(aOf(false)), 3900);
  h.drive(armR, shR, WR(aOf(true)), 3900);
  h.drive(tR, shR, WR(aOf(true)), 3900);
  const WC = (t) => mul(rot(lean(t) + sway(t), crx, cry), scl(grow(t), grow(t), crx, cry));
  h.drive(crown, [crx, cry], WC, 3900);
  const tipOf = (isR, t) => app((isR ? WR : WL)(aOf(isR))(t), isR ? [258, 54] : [42, 58]); // a bough's twig-tip as it moves

  // ── its eyes: a glow, swelling to a blaze, flashing at the release, burning and ebbing
  for (const [x, y] of [eyeL, eyeR]) {
    const l = [[250, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(1.3)', opacity: 0.6 }, eio], [1400, { transform: 'scale(2.2)', opacity: 1 }, 'ease-out'], [1560, { transform: 'scale(3)', opacity: 1 }, 'ease-out']];
    for (let t = 1760, j = 0; t < 3000; t += 240, j++) l.push([t, { transform: `scale(${j % 2 ? 1.9 : 2.3})`, opacity: j % 2 ? 0.7 : 0.9 }, eio]);
    l.push([3500, { transform: 'scale(1.2)', opacity: 0 }]);
    fx(k.lightIn('g-mem', [x, y], 28, 20), l);
  }
  fx(k.lightIn('g-mem', [150, 110], 96, 70), [[350, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [1100, { transform: 'scale(1)', opacity: 0.55 }, eio], [1450, { transform: 'scale(1.35)', opacity: 0.95 }, 'ease-out'], [2000, { transform: 'scale(1.1)', opacity: 0.6 }, eio], [2800, { transform: 'scale(.9)', opacity: 0.25 }, eio], [3500, { transform: 'scale(.7)', opacity: 0 }]]);

  // ── gather: pale leaves and motes lift from the forest floor, wheeling in to its face
  const srcs = [[34, 176], [60, 168], [90, 174], [118, 170], [182, 170], [210, 174], [240, 168], [268, 176], [20, 150], [284, 152], [76, 150], [226, 148], [102, 160], [200, 160]];
  srcs.forEach(([x, y], i) => {
    const t0 = 160 + i * 75, life = 950 + rand() * 300, sd = x < 150 ? -1 : 1;
    const dx = E[0] - x, dy = E[1] - y;
    const pts = k.arc([0, 0], [dx * 0.25 + sd * 14, dy * 0.95 - 22], [dx, dy], 6, (t) => t * t * (3 - 2 * t));
    const isLeaf = i % 2 === 0, sz = isLeaf ? 7 + rand() * 2.5 : 3 + rand() * 2.5, rt = Math.round(rand() * 140);
    fx(isLeaf ? k.picIn(leaf, [x, y], sz, sz * 1.5, { lit: false }) : k.picIn('mote', [x, y], sz, sz), [[t0 - 1, { transform: `${k.T(0, 0)} rotate(${rt}deg) scale(.4)`, opacity: 0 }, 'ease-out'],
      ...pts.map(([px, py], j) => [Math.round(t0 + life * j / 5), { transform: `${k.T(px, py)} rotate(${rt + j * (isLeaf ? 70 : 0)}deg) scale(${(1 - 0.5 * j / 5 + (j === 0 ? -0.5 : 0.2)).toFixed(2)})`, opacity: j === 0 ? 0 : j === 5 ? 0 : 0.95 }, j < 2 ? 'ease-out' : 'ease-in-out'])]);
  });

  // ── release: the wave of memories from between its eyes along an arc to T (on the overlay: T may be another card)
  const C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 34];
  const bz = (t) => { const q = 1 - t; return [q * q * E[0] + 2 * q * t * C[0] + t * t * T[0], q * q * E[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const ang = (t) => { const a = bz(Math.max(0, t - 0.02)), b = bz(Math.min(1, t + 0.02)); return Math.atan2(b[1] - a[1], b[0] - a[0]); };
  const [X0, Y0] = k.P(...E);
  const REL = 1400, IM = 1800;
  fx(k.light('g-mem', E, 90), [[REL - 60, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [REL + 40, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [REL + 500, { transform: 'scale(1.1)', opacity: 0.5 }, eio], [REL + 1200, { transform: 'scale(.8)', opacity: 0 }]]);
  for (let i = 0; i < 22; i++) { // memories: pale leaves and orbs, spread across the wave
    const t0 = REL + 10 + i * 24, dur = 400 + rand() * 80, off = (rand() - 0.5) * 22, r = Math.round(rand() * 360), big = i % 4 === 0;
    const at = (f, s, o) => { const [x, y] = k.P(...bz(f)); const w = Math.sin(Math.PI * f); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + off * w * u).toFixed(1)}px) rotate(${r + Math.round(f * 220)}deg) scale(${s})`, opacity: o }; };
    const el = big ? k.pic('orb', E, 15, 15) : i % 3 === 1 ? k.pic('mote', E, 6, 6) : k.pic(leaf, E, 8, 12, { lit: false });
    fx(el, [[t0, at(0, 0.4, 0), 'ease-in'], [t0 + 70, at(0.15, 1, 0.95), 'linear'], [t0 + dur * 0.6, at(0.6, 1.15, 1), 'linear'], [t0 + dur, at(1, 1, 0.9), 'ease-out'], [t0 + dur + 140, at(1, big ? 1.8 : 0.6, 0)]]);
  }
  for (let i = 0; i < 4; i++) { // streaks of mist riding the wave
    const t0 = REL + i * 50, dur = 340, off = (i - 1.5) * 7;
    const at = (f, s, o) => { const [x, y] = k.P(...bz(f)); const w = Math.sin(Math.PI * f); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + off * w * u).toFixed(1)}px) rotate(${(ang(f) * 180 / Math.PI).toFixed(1)}deg) scale(${s})`, opacity: o }; };
    fx(k.pic(streak, E, 34, 11), [[t0, at(0, 0.4, 0), 'ease-in'], [t0 + 80, at(0.2, 1, 0.9), 'linear'], [t0 + dur * 0.7, at(0.75, 1.1, 0.9), 'linear'], [t0 + dur, at(1, 0.9, 0.7), 'ease-out'], [t0 + dur + 120, at(1, 0.5, 0)]]);
  }
  // leaves flung from the near bough's tip as it sweeps down
  for (let i = 0; i < 9; i++) {
    const t0 = REL + 40 + i * 28, tp0 = tipOf(side === 1, t0), tp1 = tipOf(side === 1, t0 + 220), r = Math.round(rand() * 360);
    const toward = [(T[0] - tp0[0]) * 0.3, (T[1] - tp0[1]) * 0.3 - 8 + rand() * 6];
    fx(k.pic(leaf, tp0, 7 + rand() * 2, 10 + rand() * 3, { lit: false }), [[t0, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 60, { transform: `${k.T(tp1[0] - tp0[0], tp1[1] - tp0[1])} rotate(${r + 70}deg) scale(1)`, opacity: 0.95 }, 'ease-out'], [t0 + 420, { transform: `${k.T(tp1[0] - tp0[0] + toward[0], tp1[1] - tp0[1] + toward[1])} rotate(${r + 220}deg) scale(.9)`, opacity: 0 }]]);
  }

  // ── impact at T: flash, rings, a whirl of leaves, a pale surge along the ground
  fx(k.light('g-mem', T, 78), [[IM - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [IM + 500, { transform: 'scale(1.25)', opacity: 0.6 }, eio], [IM + 1400, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.light('g-mem', T, 28), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.6)', opacity: 1 }], [IM + 260, { transform: 'scale(2.6)', opacity: 0 }]]);
  for (const [d, w, o] of [[0, 100, 0.95], [140, 76, 0.7], [300, 56, 0.5]]) {
    fx(k.pic(ring, T, w, w / 2), [[IM + d - 1, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + d + 40, { transform: 'scale(.3)', opacity: o }, 'ease-out'], [IM + d + 700, { transform: 'scale(1.15)', opacity: 0 }]]);
  }
  for (let i = 0; i < 14; i++) { // a whirl: leaves circling T as they are flung out
    const a0 = (i / 14) * Math.PI * 2, t0 = IM + 10 + rand() * 90, life = 900 + rand() * 500, r = 12 + rand() * 12, spin = (rand() < 0.5 ? -1 : 1) * (1.1 + rand() * 0.8), rt = Math.round(rand() * 360);
    const stops = [];
    for (let j = 0; j <= 5; j++) { const f = j / 5, a = a0 + spin * f * 2.4, rr = r * (0.3 + 1.5 * f); stops.push([Math.round(t0 + life * f), { transform: `${k.T(Math.cos(a) * rr * 1.3, Math.sin(a) * rr * 0.6 - 18 * f * f - 4 * f)} rotate(${rt + Math.round(f * 300)}deg) scale(${(j === 0 ? 0.4 : 1 - 0.3 * f).toFixed(2)})`, opacity: j === 0 ? 0 : j === 5 ? 0 : 0.95 }, j < 1 ? 'ease-out' : 'ease-in-out']); }
    stops[0][1].opacity = 0;
    fx(i % 3 === 2 ? k.pic('mote', T, 5, 5) : k.pic(leaf, T, 7 + rand() * 3, 10 + rand() * 4, { lit: false }), stops);
  }
  for (let i = 0; i < 10; i++) { // spirits of light rising
    const dx = (rand() - 0.5) * 56, t0 = IM + 80 + rand() * 800, life = 900 + rand() * 600, sz = 2.5 + rand() * 3;
    const pts = k.arc([0, 0], [dx * 0.6 + (rand() - 0.5) * 18, -28], [dx * 0.8 + (rand() - 0.5) * 20, -58 - rand() * 14], 5);
    fx(k.pic('mote', [T[0] + dx * 0.4, T[1] + 6 + rand() * 10], sz, sz), [[t0 - 1, { transform: `${k.T(0, 0)} scale(.3)`, opacity: 0 }, 'ease-out'],
      ...pts.map(([x, y], j) => [Math.round(t0 + life * j / 5), { transform: `${k.T(x, y)} scale(${1 - 0.45 * j / 5})`, opacity: j === 0 ? 0 : j === 5 ? 0 : 0.9 }, 'ease-out'])]);
  }
  fx(k.pic(streak, [T[0], T[1] + 8], 70, 14, { low: true }), [[IM, { transform: 'scaleX(-.2)', opacity: 0 }, 'ease-out'], [IM + 120, { transform: 'scaleX(1)', opacity: 0.7 }, 'ease-out'], [IM + 600, { transform: 'scaleX(1.5)', opacity: 0 }]]);

  // ── follow-through: the crown rains leaves as it shakes
  for (let i = 0; i < 12; i++) {
    const x = 66 + rand() * 168, y = 10 + rand() * 34, t0 = Math.round(1450 + i * 110 + rand() * 60), life = 1100 + rand() * 400, rt = Math.round(rand() * 120);
    const dx = (rand() - 0.5) * 36 + (T[0] > 150 ? 8 : -8), dy = 70 + rand() * 60;
    const pts = k.arc([0, 0], [dx * 0.6 + 12, dy * 0.3], [dx, dy], 5);
    fx(k.picIn(leaf, [x, y], 7 + rand() * 2, 10 + rand() * 3, { lit: false }), [[t0, { transform: `${k.T(0, 0)} rotate(${rt}deg) scale(.5)`, opacity: 0 }, 'ease-out'],
      ...pts.map(([px, py], j) => [Math.round(t0 + life * j / 5), { transform: `${k.T(px, py)} rotate(${rt + Math.round((j % 2 ? 1 : -1) * 50 * j)}deg) scale(1)`, opacity: j === 0 ? 0 : j === 5 ? 0 : 0.9 }, j < 1 ? 'ease-out' : 'ease-in-out'])]);
  }
}
