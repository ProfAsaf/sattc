// Not Yet: the wave rears, takes each blow on its face (a jolt, a flash, a spray of drops), then sweeps
// forward and whisks the goblin off over its crest, out to sea; he and his spear dissolve into
// sparkles that drift up (back to hand), and re-form where they were as the wave settles.
//
// PLAN (drawing units 300 x 210, ms of the move). Role defender (a Trick that turns a creature away:
// the wave is a guard that takes blows and sweeps the attacker back), element water.
//   0-250     ANTICIPATION: the wave sinks a little and draws back (scale down, leaning back).
//   250-560   it rears: scaling up about its foot (so the beach never shows a gap), crest curling
//             higher and leaning back, light pooling on the crest, drops shed off its lip.  RELEASE 450.
//   900       IMPACT (the first blow; k.blows, else two of its own: 900 on the crest's tip, 1260
//             on the hollow's far wall). Each blow, snapped to the nearest guard point: the wave
//             jolts (a sharp scale/rotate kick that rings out), a flash and two rings at the guard,
//             a fan of drops flung off it, foam puffs; the goblin and the spear rock with it.
//   last+260  THE SWEEP: the wave surges forward and over (a fast swell leaning in), the crest
//             throws foam; the goblin tumbles up out of the hollow, shrinking, over the crest and
//             out to sea (trailing foam), where he dissolves in a splash; the spear flings away
//             spinning and dissolves. Sparkles lift away upward (back to hand).
//   2900-3500 the wave eases back down; the goblin and the spear re-form where they were, with
//             a soft light and rising motes. At rest from 3500.
// BEATS: release 450, impact 900, settle 3500. (Only the wave takes blows: a defender isn't aimed.)
import { mul, rot, scl, tr, curve, kit } from './_fx.js';
export const END = 4500;
export const BEATS = { release: 450, impact: 900, settle: 3500 };
export const STILLS = [350, 700, 960, 1300, 1700, 2100, 3100, 3500];

export const textures = {
  foam: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r), n = 0.85 + 0.15 * Math.sin(x * 23 + y * 17); return [246, 255, 252, Math.min(1, c * c * 1.9 * n)]; }],
  drop: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [240, 255, 255, Math.min(1, c * 2.4)]; }],
  mote: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [235, 255, 252, Math.min(1, c * c * 3)]; }],
};

export function build(k) {
  const { fx, u, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const S = k.spec, GOB = S.goblin, SEA = S.sea, SPEAR = S.spear, PV = [20, 200], END_ = 3500;
  const wave = k.part('wave'), gob = k.part('goblin'), spear = k.part('spear');
  k.css('.g-foam { border-radius: 50%; background: radial-gradient(circle, rgba(250,255,252,.95), rgba(220,250,244,.55) 32%, rgba(190,240,236,.2) 60%, rgba(170,235,232,0) 72%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.3"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#f4fffa" stroke-width="4.5" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#ffffff" stroke-width="1.4"/>', 100, 100);

  // ── the blows: k.blows, else its own two; each snapped to the nearest guard point
  const own = [{ at: 900, to: [226, 92] }, { at: 1260, to: [120, 118] }];
  const snap = (p) => S.guard.reduce((b, g) => (Math.hypot(g[0] - p[0], g[1] - p[1]) < Math.hypot(b[0] - p[0], b[1] - p[1]) ? g : b));
  const B = (k.blows || own).map((b) => ({ at: Math.min(b.at, 1600), g: snap(b.to) })).sort((a, b) => a.at - b.at);
  const SW = Math.min(1900, Math.max(1500, B[B.length - 1].at + 280)); // the sweep begins
  const CEN = [150, 120];

  // ── the wave: sinks, rears, jolts at each blow, surges at the sweep, eases back
  const sc = curve([[0, 1], [250, 0.985], [560, 1.045, 'out'], [SW - 100, 1.05], [SW + 260, 1.105, 'out'], [SW + 900, 1.02], [3400, 1]]);
  const rt = curve([[0, 0], [250, 0.5], [560, -1.3, 'out'], [SW - 100, -1.3], [SW + 260, 2.3, 'out'], [SW + 900, 0.6], [3400, 0]]);
  const jolt = (t) => { let s = 0, r = 0; for (const [i, b] of B.entries()) { const d = t - b.at; if (d < 0 || d > 700) continue; const e = Math.exp(-d / 150) * Math.cos(d / 30), side = b.g[0] > CEN[0] ? -1 : 1; s += 0.016 * e; r += side * (i % 2 ? -1.3 : 1.3) * e; } return [s, r]; };
  const heave = (t) => 0.004 * Math.sin(t / 320) * curve([[0, 0], [560, 0], [800, 1], [SW, 1], [SW + 400, 0]])(t);
  const W = (t) => { const [js, jr] = jolt(t), s = sc(t) + js + heave(t); return mul(rot(rt(t) + jr, PV[0], PV[1]), scl(s, s, PV[0], PV[1])); };
  h.drive(wave, PV, W, END_, 30);

  // ── the goblin: rocks in the hollow with each blow, then is carried over the crest and out to sea, dissolving; re-forms
  const C = [212, 134];
  const bz = (f) => { const q = 1 - f; return [q * q * GOB[0] + 2 * q * f * C[0] + f * f * SEA[0], q * q * GOB[1] + 2 * q * f * C[1] + f * f * SEA[1]]; };
  const T0 = SW - 60, T1 = SW + 780, RE0 = 2850, RE1 = 3400;
  const rock = (t) => { let r = 0; for (const [i, b] of B.entries()) { const d = t - b.at; if (d < 0 || d > 650) continue; r += (i % 2 ? -1 : 1) * 6 * Math.exp(-d / 170) * Math.cos(d / 40); } return r; };
  const gOwn = (t) => {
    if (t < T0) return mul(tr(0, -0.8 * Math.sin(t / 400) * (t > 300 ? 1 : 0)), rot(rock(t), GOB[0], GOB[1]));
    if (t < T1) { const f = k.smooth((t - T0) / (T1 - T0)), [x, y] = bz(f), s = 1 - 0.68 * f; return mul(tr(x - GOB[0], y - GOB[1]), mul(rot(420 * f, GOB[0], GOB[1]), scl(s, s, GOB[0], GOB[1]))); }
    if (t < RE0) { const [x, y] = bz(1); return mul(tr(x - GOB[0], y - GOB[1]), mul(rot(420, GOB[0], GOB[1]), scl(0.32, 0.32, GOB[0], GOB[1]))); }
    const s = 0.8 + 0.2 * k.smooth(Math.min(1, (t - RE0) / (RE1 - RE0))); return scl(s, s, GOB[0], GOB[1]);
  };
  const gOp = curve([[0, 1], [SW + 250, 1], [T1 - 40, 0], [RE0, 0], [RE1, 1]]);
  h.drive(gob, GOB, (t) => mul(W(t), gOwn(t)), END_, 30, gOp);

  // ── the spear: jolted by the blows, flung away at the sweep, dissolving, re-forming
  const sOwn = (t) => {
    if (t < SW + 40) { let r = 0; for (const [i, b] of B.entries()) { const d = t - b.at; if (d < 0 || d > 600) continue; r += (i % 2 ? 1 : -1) * 9 * Math.exp(-d / 160) * Math.cos(d / 36); } return rot(r, SPEAR[0], SPEAR[1]); }
    if (t < SW + 700) { const f = k.smooth((t - SW - 40) / 660); return mul(tr(34 * f, -26 * f), rot(520 * f, SPEAR[0], SPEAR[1])); }
    if (t < RE0) return mul(tr(34, -26), rot(520, SPEAR[0], SPEAR[1]));
    return ID_;
  };
  const ID_ = [1, 0, 0, 1, 0, 0];
  const spOp = curve([[0, 1], [SW + 300, 1], [SW + 700, 0], [RE0 + 150, 0], [RE1, 1]]);
  h.drive(spear, SPEAR, (t) => mul(W(t), sOwn(t)), END_, 30, spOp);

  const fk = (fr, fn, el) => fx(el, fr.map(fn));
  // ── light on the crest as it rears and again as it sweeps
  const crestL = [[200, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [560, { transform: 'scale(1.1)', opacity: 0.75 }, eio], [SW - 100, { transform: 'scale(1.15)', opacity: 0.6 }, 'ease-in'], [SW + 260, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [SW + 1000, { transform: 'scale(1.1)', opacity: 0.3 }, eio], [3200, { transform: 'scale(.8)', opacity: 0 }]];
  fx(k.lightIn('g-foam', [190, 44], 130, 60), crestL);
  // drops shed off its lip as it rears
  for (let i = 0; i < 7; i++) {
    const t0 = 420 + i * 90 + Math.round(rand() * 40), x = 214 + rand() * 14, y = 96 + rand() * 6, fall = 22 + rand() * 20;
    fx(k.picIn('drop', [x, y], 3.2, 3.2), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 60, { transform: `${k.T(2, 1)} scale(1)`, opacity: 0.95 }, 'ease-in'], [t0 + 380, { transform: `${k.T(3, fall)} scale(.7)`, opacity: 0 }]]);
  }

  // ── each blow: flash, rings, a fan of drops thrown off, foam
  for (const [bi, b] of B.entries()) {
    const t = b.at, g = b.g, out = Math.atan2(g[1] - CEN[1], g[0] - CEN[0]);
    fx(k.light('g-foam', g, 40), [[t - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(1.4)', opacity: 1 }, 'ease-out'], [t + 280, { transform: 'scale(1.8)', opacity: 0 }]]);
    fx(k.light('g-foam', g, 18), [[t - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 30, { transform: 'scale(1.6)', opacity: 1 }], [t + 160, { transform: 'scale(2.6)', opacity: 0 }]]);
    for (const [d, w, o] of [[0, 34, 0.95], [110, 24, 0.7]]) fx(k.pic(ring, g, w, w), [[t + d - 1, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [t + d + 40, { transform: 'scale(.35)', opacity: o }, 'ease-out'], [t + d + 420, { transform: 'scale(1.15)', opacity: 0 }]]);
    for (let i = 0; i < 12; i++) {
      const a = out + (rand() - 0.5) * 2.2, v = 14 + rand() * 26, t0 = t + rand() * 30, life = 380 + rand() * 330, sz = 2.6 + rand() * 3;
      const px = (f) => Math.cos(a) * v * f, py = (f) => Math.sin(a) * v * f - 6 * f + 36 * f * f;
      fk([0, 0.3, 0.65, 1], (f, j) => [Math.round(t0 + life * f), { transform: `${k.T(px(f), py(f))} scale(${(1 - 0.6 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out'], k.pic('drop', g, sz, sz));
    }
    for (let i = 0; i < 4; i++) {
      const a = out + (rand() - 0.5) * 1.6, d = 8 + rand() * 9, t0 = t + 20 + rand() * 40, r = Math.round(rand() * 360);
      fx(k.pic('foam', g, 14, 14), [[t0, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 90, { transform: `${k.T(Math.cos(a) * d * 0.6, Math.sin(a) * d * 0.6)} rotate(${r + 20}deg) scale(1)`, opacity: 0.85 }, 'ease-out'], [t0 + 480, { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d + 6)} rotate(${r + 50}deg) scale(1.5)`, opacity: 0 }]]);
    }
  }

  // ── the sweep: foam flung off the crest, a trail behind the goblin, a splash where he dissolves
  for (let i = 0; i < 14; i++) {
    const t0 = SW + 120 + i * 45 + Math.round(rand() * 30), r = Math.round(rand() * 360), sz = 12 + rand() * 8;
    const A = [196 + rand() * 24, 40 + rand() * 14], Z = [A[0] + 40 + rand() * 24, A[1] + 26 + rand() * 22];
    fx(k.picIn('foam', A, sz, sz), [[t0, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 100, { transform: `${k.T((Z[0] - A[0]) * 0.3, (Z[1] - A[1]) * 0.1)} rotate(${r + 20}deg) scale(1)`, opacity: 0.9 }, 'ease-out'],
      [t0 + 480, { transform: `${k.T(Z[0] - A[0], Z[1] - A[1])} rotate(${r + 70}deg) scale(1.5)`, opacity: 0 }]]);
  }
  const [X0, Y0] = k.P(...GOB);
  for (let j = 0; j < 10; j++) {
    const f = 0.06 + j * 0.092, ts = Math.round(T0 + (T1 - T0) * 0.97 * f), [x, y] = bz(f), [px, py] = k.P(x, y);
    fx(k.pic(j % 2 ? 'foam' : 'mote', GOB, j % 2 ? 11 : 6, j % 2 ? 11 : 6), [[ts, { transform: `translate(${(px - X0).toFixed(1)}px, ${(py - Y0).toFixed(1)}px) scale(.5)`, opacity: 0 }, 'ease-out'], [ts + 60, { transform: `translate(${(px - X0).toFixed(1)}px, ${(py - Y0).toFixed(1)}px) scale(1)`, opacity: 0.85 }], [ts + 420, { transform: `translate(${(px - X0).toFixed(1)}px, ${(py - Y0 + 4 * u).toFixed(1)}px) scale(1.5)`, opacity: 0 }]]);
  }
  fx(k.light('g-foam', SEA, 52), [[T1 - 160, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [T1 - 30, { transform: 'scale(1.2)', opacity: 1 }, 'ease-out'], [T1 + 500, { transform: 'scale(1)', opacity: 0.4 }, eio], [T1 + 1000, { transform: 'scale(.8)', opacity: 0 }]]);
  for (const [d, w] of [[-80, 46], [30, 32]]) fx(k.pic(ring, SEA, w, w * 0.4), [[T1 + d, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [T1 + d + 50, { transform: 'scale(.4)', opacity: 0.9 }, 'ease-out'], [T1 + d + 620, { transform: 'scale(1.2)', opacity: 0 }]]);
  // sparkles of the dissolved goblin and spear drifting up and away (back to hand)
  for (let i = 0; i < 14; i++) {
    const t0 = T1 - 140 + i * 55 + Math.round(rand() * 30), life = 1000 + rand() * 300, sz = 2.6 + rand() * 3.2;
    const from = i % 4 === 3 ? [SPEAR[0] + 30, SPEAR[1] - 22] : SEA, up = 60 + rand() * 40;
    const pts = k.arc([0, 0], [(rand() - 0.5) * 24, -up * 0.5], [(rand() - 0.5) * 40, -up], 5);
    fx(k.pic(i % 3 ? 'mote' : 'drop', [from[0] + (rand() - 0.5) * 12, from[1] - 2], sz, sz), [[t0 - 1, { transform: `${k.T(0, 0)} scale(.3)`, opacity: 0 }, 'ease-out'],
      ...pts.map(([px, py], j) => [Math.round(t0 + life * j / 5), { transform: `${k.T(px, py)} scale(${(1 - 0.5 * j / 5).toFixed(2)})`, opacity: j === 0 || j === 5 ? 0 : 0.9 }, 'ease-out'])]);
  }

  // ── re-forming: motes gather to where the goblin lay, a soft light, a ring in the hollow
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rand(), d = 22 + rand() * 10, t0 = RE0 - 120 + i * 40;
    fx(k.picIn('mote', GOB, 4.5, 4.5), [[t0, { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d * 0.8)} scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 120, { transform: `${k.T(Math.cos(a) * d * 0.8, Math.sin(a) * d * 0.64)} scale(1)`, opacity: 0.9 }, 'ease-in'], [t0 + 460, { transform: 'scale(.4)', opacity: 0 }]]);
  }
  fx(k.lightIn('g-foam', GOB, 70, 70), [[RE0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [RE0 + 330, { transform: 'scale(1.1)', opacity: 0.85 }, eio], [RE1 + 100, { transform: 'scale(1.2)', opacity: 0.5 }, eio], [END_, { transform: 'scale(.9)', opacity: 0 }]]);
}
