// Wild Growth: overnight, the sapling became a tree.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support (it gives a creature
// +2/+2), element nature.
//   0-1300    the held breath: the vines draw back in towards the wolf (shrinking
//             to little more than half), the wolf crouches, the light under it
//             swelling; motes of green light sink into the ground, bark creaking.
//   1300-1500 the wind-up: everything pulled in tight, the ground-light white.
//   1500      RELEASE: the vines whip out (past their size, then back), the wolf
//             swells and stretches, a ring bursts from the ground: a rope of
//             leaves and light leaves the ground along an arc to T (k.aim, else the
//             wolf's own chest).
//   2000      IMPACT/bloom at T: a ripple and a green light, leaves bursting out round
//             it, motes rising; the wolf swells again (thicker than before).
//   2000-3700 follow-through: the vines sway and settle, each side out of step with
//             the other, the buds pulsing; the wolf's bulk relaxes to as drawn; lights
//             sink. At rest as drawn by 3700 (END 4400).
// BEATS: release 1500, impact 2000, settle 3700.
import { mul, scl, tr, rot, kit } from './_fx.js';

export const END = 4400;
export const BEATS = { release: 1500, impact: 2000, settle: 3700 };
export const STILLS = [500, 1100, 1450, 1560, 1800, 2050, 2800, 4000];

export const textures = {
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226 + 20 * c, 255, 150 + 70 * c * c, Math.min(1, c * c * 2.4)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const sp = k.spec, EM = sp.emit, FEET = sp.feet, RL = sp.rootL, RR = sp.rootR;
  const K = kit(k);
  const P = { vL: k.part('vinesL'), vR: k.part('vinesR'), wolf: k.part('wolf'), tL: k.part('tipsL'), tR: k.part('tipsR') };
  const T = k.aim || sp.chest;
  k.css('.g-leaf { border-radius: 50%; background: radial-gradient(circle, rgba(250,255,210,.95), rgba(190,240,110,.55) 30%, rgba(120,200,70,.2) 58%, rgba(100,190,60,0) 72%); }');
  const leaf = k.svg('<defs><linearGradient id="g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#4f9a2a"/><stop offset="1" stop-color="#e4fa9a"/></linearGradient></defs><path d="M20,60C5,44 7,16 20,2C33,16 35,44 20,60Z" fill="url(#g)"/><path d="M20,58L20,12" stroke="#fffbd0" stroke-width="1.4" opacity=".7"/>', 40, 60);
  const ripple = k.svg('<ellipse cx="50" cy="25" rx="44" ry="18" fill="none" stroke="#f2ffc8" stroke-width="3.5"/>', 100, 50);

  const track = (pts) => (ms) => {
    let i = pts.length - 1;
    while (i > 0 && pts[i][0] > ms) i--;
    if (i === pts.length - 1) return pts[i][1];
    const [t0, v0, e] = pts[i], [t1, v1] = pts[i + 1], f = Math.min(1, Math.max(0, (ms - t0) / (t1 - t0)));
    return v0 + (v1 - v0) * (e === 'out' ? 1 - (1 - f) * (1 - f) : e === 'in' ? f * f : k.smooth(f));
  };
  // ── the vines: draw in (to .55), whip out (to 1.2) and settle; each side swaying out of step, damped
  const base = (a, b) => track([[0, 1], [300, 1.02], [700, 0.86], [1100, 0.68], [1330, 0.55, 'in'], [1400, 0.52], [1500 + a, 1.22, 'out'], [1700 + a, 1.06], [1950 + a, 1.12], [2300 + a, 0.98], [2700 + a, 1.03], [3200, 1.0], [3700, 1]]);
  const sL = base(0), sR = base(40);
  const swayK = (ph, amp) => (t) => (t < 1480 ? Math.sin(t / 230 + ph) * 0.8 * Math.min(1, t / 400) : Math.sin((t - 1480) / 210 + ph) * amp * Math.exp(-(t - 1480) / 800) * (t > 3700 ? 0 : 1));
  const rL = swayK(0, 7), rR = swayK(2.2, -7);
  const wL = (t) => mul(rot(rL(t), RL[0], RL[1]), scl(sL(t), sL(t), RL[0], RL[1]));
  const wR = (t) => mul(rot(rR(t), RR[0], RR[1]), scl(sR(t), sR(t), RR[0], RR[1]));
  K.drive(P.vL, RL, wL, 3700, 40);
  K.drive(P.tL, RL, wL, 3700, 40);
  K.drive(P.vR, RR, wR, 3700, 40);
  K.drive(P.tR, RR, wR, 3700, 40);
  // ── the wolf: crouches in the held breath, swells and stretches at the release, again at the impact
  const wy = track([[0, 1], [300, 1.005], [900, 0.985], [1330, 0.96, 'in'], [1500, 1.07, 'out'], [1700, 1.03], [1950, 1.02], [2050, 1.06, 'out'], [2300, 1.025], [2900, 1.01], [3700, 1]]);
  const wx = track([[0, 1], [900, 1.01], [1330, 1.035, 'in'], [1500, 1.05, 'out'], [1700, 1.06], [2000, 1.05], [2060, 1.1, 'out'], [2350, 1.055], [2900, 1.02], [3700, 1]]);
  const wr = track([[0, 0], [1330, -1.2, 'in'], [1500, 1.5, 'out'], [2060, -1, 'out'], [2500, 0.4], [3700, 0]]);
  K.drive(P.wolf, FEET, (t) => mul(rot(wr(t), FEET[0], FEET[1]), scl(wx(t), wy(t), FEET[0], FEET[1])), 3700, 40);

  // ── light: the glade dims a little as it draws in, then blazes
  fx(k.lightIn('g-leaf', [150, 160], 300, 120, { under: true }), [[200, { opacity: 0 }, 'ease-out'], [1330, { opacity: 0.35 }, eio], [1500, { opacity: 0.8 }, 'ease-out'], [2200, { opacity: 0.5 }, eio], [3300, { opacity: 0 }]]);
  const gl = [[300, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(.9)', opacity: 0.55 }, eio], [1330, { transform: 'scale(1.3)', opacity: 0.9 }, eio], [1490, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [1650, { transform: 'scale(2.2)', opacity: 0.9 }, eio], [2300, { transform: 'scale(1.7)', opacity: 0.5 }, eio], [3300, { transform: 'scale(1.1)', opacity: 0 }]];
  fx(k.light('g-leaf', EM, 60, 36), gl);
  fx(k.light('g-heal', EM, 34, 20), [[900, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [1400, { transform: 'scale(1.2)', opacity: 0.8 }, eio], [1520, { transform: 'scale(2)', opacity: 1 }, 'ease-out'], [2000, { transform: 'scale(1.5)', opacity: 0.45 }, eio], [2800, { transform: 'scale(1)', opacity: 0 }]]);
  // the buds at the vine-tips: swell and flash with the vines, pulsing as they settle (each rides its vine)
  sp.tips.forEach(([x, y], i) => {
    const left = x < 150, W = left ? wL : wR, ph = i * 0.9;
    const list = [[200, 0.9, 0.55], [1300, 0.5, 0.35], [1400, 0.5, 0.4], [1530, 1.9, 1], [1700, 1.3, 0.8]];
    for (let t = 1900, j = 0; t < 3500; t += 220, j++) list.push([t, 1.0 + 0.25 * Math.sin(ph + j * 1.7), 0.5 + 0.2 * Math.sin(ph + j * 1.7)]);
    list.push([3700, 1, 0.35]);
    K.ride(k.light('g-leaf', [x, y], 24, 24), [x, y], W, list);
  });
  // motes sinking into the ground in the held breath, and sparks of leaf-light up with the vines at the release
  for (let i = 0; i < 16; i++) {
    const a = -Math.PI * rand(), dist = 30 + rand() * 40, t0 = 500 + i * 55 + rand() * 40, dur = 480 + rand() * 150, sz = 3 + rand() * 2.4;
    const ox = Math.cos(a) * dist * 1.3, oy = Math.sin(a) * dist * 0.8;
    fx(k.pic('mote', EM, sz, sz), [[t0, { transform: `${k.T(ox, oy)} scale(.5)`, opacity: 0 }, 'ease-in'], [t0 + 90, { transform: `${k.T(ox * 0.9, oy * 0.9)} scale(1)`, opacity: 1 }, 'ease-in'], [t0 + dur, { transform: `${k.T(0, -2)} scale(.35)`, opacity: 0.9 }], [t0 + dur + 50, { transform: `${k.T(0, -2)} scale(.1)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 18; i++) {
    const a = -Math.PI * (0.05 + 0.9 * rand()), v = 40 + rand() * 60, t = 1500 + rand() * 80, sz = 3 + rand() * 3, life = 700 + rand() * 500;
    const at = (f, s, o) => ({ transform: `${k.T(Math.cos(a) * v * f, Math.sin(a) * v * f + 60 * f * f)} scale(${s})`, opacity: o });
    fx(k.pic('mote', EM, sz, sz), [[t, at(0, 0.6, 0), 'ease-out'], [t + 60, at(0.1, 1, 1)], [t + life * 0.6, at(0.6, 0.8, 0.85)], [t + life, at(1, 0.3, 0)]]);
  }
  // a ring bursting from the ground at the release, and dust
  for (const [dly, o] of [[0, 1], [120, 0.7]]) fx(k.pic(ripple, EM, 150, 40, { lit: false }), [[1500 + dly, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [1560 + dly, { transform: 'scale(.4)', opacity: o }, 'ease-out'], [2050 + dly, { transform: 'scale(1)', opacity: 0 }]]);
  for (let i = 0; i < 6; i++) {
    const t = 1500 + i * 14, a = Math.PI * (1.0 + i * 0.2), r = Math.round(rand() * 360);
    fx(k.picIn('puffCool', [EM[0] + (i - 2.5) * 6, 170], 14, 14, { lit: false }), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 90, { transform: `${k.T(Math.cos(a) * 14, Math.sin(a) * 4)} rotate(${r + 20}deg) scale(1)`, opacity: 0.6 }], [t + 450, { transform: `${k.T(Math.cos(a) * 26, Math.sin(a) * 6 - 3)} rotate(${r + 40}deg) scale(1.5)`, opacity: 0 }]]);
  }

  // ── the gift: a rope of leaves and light from the ground to T (RELEASE 1500 - IMPACT 2000)
  const dist = Math.hypot(T[0] - EM[0], T[1] - EM[1]);
  const bz = K.arcPath(EM, T, 14 + dist * 0.22);
  const flyer = (el, t0, t1, sc, spin) => K.fly(el, EM, bz, t0, t1, sc, (f) => (f > 0.97 ? 0.4 : 1), 0, spin, 30);
  flyer(k.light('g-leaf', EM, 30), 1500, 2000, (f) => 0.9 + 0.4 * f, 0);
  flyer(k.pic('mote', EM, 9, 9), 1500, 2000, (f) => 0.9 + 0.2 * f, 0);
  for (let i = 0; i < 8; i++) flyer(k.pic(leaf, EM, 5.5, 8.5, { lit: false }), 1510 + i * 26, 2000 - 20 + i * 4, (f) => 0.6 + 0.5 * f, 360 + i * 45);
  for (let i = 0; i < 10; i++) {
    const f = 0.06 + i * 0.09, t = 1500 + 500 * (-0.45 + Math.sqrt(0.2025 + 1.1 * f)) / 0.55, [x, y] = bz(f), sz = 3 + rand() * 2.2;
    fx(k.pic('mote', [x + (rand() - 0.5) * 3, y + (rand() - 0.5) * 3], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 70, { transform: 'scale(1)', opacity: 1 }], [t + 480, { transform: `${k.T((rand() - 0.5) * 6, 4 + rand() * 4)} scale(.3)`, opacity: 0 }]]);
  }

  // ── IMPACT (2000): a ripple, a green light and leaves bursting out at T, motes rising
  const IM = 2000;
  const bl = [[IM - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 80, { transform: 'scale(1.2)', opacity: 1 }]];
  for (let t = IM + 220, i = 0; t < 2800; t += 130, i++) bl.push([t, { transform: `scale(${i % 2 ? 1.1 : 0.95})`, opacity: i % 2 ? 0.95 : 0.75 }, eio]);
  bl.push([3300, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.light('g-leaf', T, 64), bl);
  fx(k.light('g-leaf', T, 24), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.6)', opacity: 1 }], [IM + 200, { transform: 'scale(2.6)', opacity: 0 }]]);
  for (const [dly, o] of [[0, 1], [110, 0.7]]) fx(k.pic(ripple, T, 64, 32, { lit: false }), [[IM + dly, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + dly + 70, { transform: 'scale(.4)', opacity: o }, 'ease-out'], [IM + dly + 520, { transform: 'scale(1.1)', opacity: 0 }]]);
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * (0.05 + 0.9 * (i / 8)) , v = 16 + rand() * 16, r = Math.round(rand() * 120 - 60), s = 6 + rand() * 3;
    fx(k.pic(leaf, T, s, s * 1.5, { lit: i % 2 === 0 }), [[IM, { transform: `rotate(${r}deg) scale(.3)`, opacity: 0 }, 'ease-out'], [IM + 140, { transform: `${k.T(Math.cos(a) * v * 0.5, Math.sin(a) * v * 0.5)} rotate(${r + 50}deg) scale(1)`, opacity: 1 }, 'ease-out'], [IM + 800, { transform: `${k.T(Math.cos(a) * v * 1.1, Math.sin(a) * v + 12)} rotate(${r + 200}deg) scale(.7)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 12; i++) {
    const t = IM + 100 + i * 85 + rand() * 40, ox = (rand() - 0.5) * 34, sz = 2.6 + rand() * 2.2;
    fx(k.pic('mote', [T[0] + ox, T[1] - 4], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 150, { transform: `${k.T(ox * 0.1, -8)} scale(1)`, opacity: 1 }], [t + 850, { transform: `${k.T(ox * 0.3, -34 - rand() * 12)} scale(.4)`, opacity: 0 }]]);
  }
  // the wolf's own glow while it thickens
  fx(k.lightIn('g-leaf', sp.chest, 110, 80), [[1500, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [1700, { transform: 'scale(1.1)', opacity: 0.5 }, eio], [2060, { transform: 'scale(1.3)', opacity: 0.7 }, 'ease-out'], [2900, { transform: 'scale(1)', opacity: 0.25 }, eio], [3600, { transform: 'scale(.8)', opacity: 0 }]]);
}
