// Blight Beetle (a 1/3: "Pay 2 Energy: an enemy creature loses +1/+1 of the growth it got for good"). The beetle gnaws
// the great tree's glowing root; it stops, lifts its head and rears on its hind legs, the root's light drawn up
// into its jaws as a sickly glow, antennae spread, a few dead leaves coming loose above. It snaps its jaws and
// spits the blight at T: a stream of spores and rot, olive and brown, in an arc; where it lands the life goes
// out of everything: a sick light, a ring, leaves browning and curling away, spores drifting down. It recoils,
// jaws working, comes down, and goes back to gnawing the root, exactly as drawn at 3700.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker (changed from the suggested defender: the picture
// shows it gnawing and its ability is a blight loosed at an enemy), element nature (rot and withering: kept). T = k.aim,
// else the withering boughs above it (`bough`). Drawn facing left; if T is to its right it turns round (a flip about
// its middle, through a sliver). The body rears about its hind feet (`rear`), the head turns on its neck toward T
// (never more than 75 degrees), the antennae sway on their own joint, the shell's colours ride the body.
//   0-760    GNAW: the head bobs on the root (chews), light from the wound pulled into its jaws
//   760-1250 REAR: the body lifts (if T is behind it, the turn first), head up and round, a sickly glow gathers at the jaws
//   1250     RELEASE: jaws snap, the blight goes out along an arc to T
//   1750     IMPACT: rot blooms at T: light, ring, spores, leaves browning and falling
//   1750-3000 recoil, jaws working, the glow dying down; it comes down toward the root
//   3000-3700 gnawing again; SETTLE 3700, as drawn.
import { mul, rot, scl, tr, app, curve, kit } from './_fx.js';

export const END = 4200;
export const BEATS = { release: 1250, impact: 1750, settle: 3700 };
export const STILLS = [400, 950, 1200, 1350, 1650, 1950, 2700, 3900];

export const textures = {
  spore: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226 + 29 * c * c, 244, 130 + 100 * c * c, Math.min(1, c * c * 2.6)]; }],
  rot: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r), n = 0.85 + 0.15 * Math.sin(x * 19) * Math.cos(y * 17); return [92 + 40 * c, 96 + 36 * c, 38 + 10 * c, Math.min(0.9, c * c * 1.7 * n)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const F = kit(k), { drive, arcPath } = F;
  const S = k.spec, E = S.emit, R = S.rear, N = S.neck, A = S.feelers;
  const T = k.aim || S.bough;
  const REL = BEATS.release, IM = BEATS.impact, BACK = BEATS.settle, END_ = BACK + 100;
  const [X, Y] = [178, 118];
  const tidy = (l) => l.filter((q, i) => i === 0 || q[0] > l[i - 1][0]);
  k.css('.g-blight { border-radius: 50%; background: radial-gradient(circle, rgba(250, 255, 190, .95), rgba(214, 238, 110, .6) 30%, rgba(160, 190, 70, .22) 56%, rgba(120, 150, 40, 0) 72%); } .g-wither { border-radius: 50%; background: radial-gradient(circle, rgba(236, 226, 150, .85), rgba(170, 160, 70, .45) 34%, rgba(110, 100, 40, .16) 58%, rgba(90, 80, 30, 0) 72%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.5"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#c8d86a" stroke-width="5.5" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#f6ffc8" stroke-width="1.3"/>', 100, 100);
  const leafG = k.svg('<path d="M1,6 Q12,-1 26,5 Q12,13 1,6Z" fill="#6a8a34"/><path d="M2,6 H24" stroke="#2c3e14" stroke-width=".6"/>', 28, 12);
  const leafB = k.svg('<path d="M1,6 Q10,0 22,3 Q26,6 20,8 Q10,12 1,6Z" fill="#9a7230"/><path d="M2,6 H22" stroke="#4a3412" stroke-width=".6"/>', 28, 12);

  // ── which way it faces; how far its head must turn
  const flip = T[0] > X;
  const Nw = N, base = flip ? Math.atan2(E[1] - Nw[1], 2 * X - E[0] - Nw[0]) : Math.atan2(E[1] - Nw[1], E[0] - Nw[0]);
  const tg = Math.atan2(T[1] - Nw[1], T[0] - Nw[0]);
  let dh = ((((tg - base) * 180) / Math.PI + 540) % 360) - 180;
  dh = Math.max(-35, Math.min(75, dh)) - 15 * (flip ? -1 : 1); // (what the head adds to the rear's lift)
  const REAR = 15;

  // ── the poses over time
  const sF = flip ? curve([[0, 1], [700, 1], [900, 0.06], [1060, -1], [2450, -1], [2650, 0.06], [2850, 1]]) : () => 1;
  const bT = curve([[0, 0], [500, 1.5], [800, 3], [1250, REAR, 'out'], [1550, REAR - 2], [2050, 7], [2700, 2], [3100, 0.4], [BACK, 0]]); // the rear lifts (degrees)
  const hGnaw = (t) => (t < 760 ? -3.5 * Math.sin((t / 760) * Math.PI * 4) * Math.min(1, t / 140) : 0) + (t > 3000 && t < BACK ? -3.5 * Math.sin(((t - 3000) / 700) * Math.PI * 3) * Math.min(1, (BACK - t) / 200) : 0);
  const hT = curve([[0, 0], [760, 0], [1250, dh, 'out'], [1550, dh * 0.95], [2050, dh * 0.45], [2750, 0], [BACK, 0]]);
  const aT = (t) => 6 * Math.sin(t / 210) * (t < 700 ? 0.5 : 1) * Math.max(0, Math.min(1, (BACK - t) / 400)) + 9 * (t > 800 && t < 2300 ? Math.min(1, (t - 800) / 400, (2300 - t) / 500) : 0);
  const Wb = (t) => { const F = scl(sF(t), 1, X, Y), r = app(F, R); return mul(rot(bT(t) * sF(t), r[0], r[1]), F); }; // (turned about its middle, then reared about its hind feet as they are now)
  const Wh = (t) => { const n = app(Wb(t), N); return mul(rot(hT(t) + hGnaw(t), n[0], n[1]), Wb(t)); };
  const Wa = (t) => { const a = app(Wh(t), A); return mul(rot(aT(t), a[0], a[1]), Wh(t)); };
  drive(k.part('body'), R, Wb, END_);
  drive(k.part('shell'), R, Wb, END_);
  drive(k.part('head'), N, Wh, END_);
  drive(k.part('ant'), A, Wa, END_);

  const JAW = (t) => app(Wh(t), E), WOUND = [X - 57 * 1.3, Y + 26 * 1.3];

  // ── gnawing, then gathering: crumbs and light drawn up from the wound into the jaws, a sickly glow at the mouth
  for (let i = 0; i < 9; i++) {
    const t0 = 120 + i * 100, sz = 2.4 + rand() * 2.2, ox = (rand() - 0.5) * 12;
    fx(k.picIn('spore', [WOUND[0] + ox, WOUND[1] + 2], sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 140, { transform: `${k.T(-ox * 0.4 - 3, -7)} scale(1)`, opacity: 0.95 }, eio], [t0 + 520, { transform: `${k.T(-ox * 0.2 + (E[0] - WOUND[0]) * 0.6, -14 - rand() * 6)} scale(.5)`, opacity: 0 }]]);
  }
  fx(k.lightIn('g-blight', [JAW(0)[0], JAW(0)[1] - 2], 24, 24), [[300, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [700, { transform: 'scale(.8)', opacity: 0.45 }, eio], [900, { transform: 'scale(.6)', opacity: 0 }]]);
  const JR = JAW(REL);
  const gl = [[760, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1100, { transform: 'scale(1)', opacity: 0.8 }, 'ease-in'], [REL, { transform: 'scale(1.5)', opacity: 1 }, eio], [1550, { transform: 'scale(1)', opacity: 0.55 }, eio], [2100, { transform: 'scale(.6)', opacity: 0.15 }, eio], [2500, { transform: 'scale(.4)', opacity: 0 }]];
  fx(k.light('g-blight', JR, 32), gl);
  // the root's light is drawn up into the glow, and a little of the glow stays at the wound
  for (let i = 0; i < 8; i++) {
    const t0 = 800 + i * 55, ox = (rand() - 0.5) * 16, sz = 3 + rand() * 2.6, p = JAW(REL - 100);
    fx(k.picIn('spore', [WOUND[0] + ox, WOUND[1]], sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 120, { transform: `${k.T(0, -3)} scale(1)`, opacity: 0.9 }, 'ease-in'], [t0 + 420, { transform: `${k.T(p[0] - WOUND[0] - ox, p[1] - WOUND[1])} scale(.5)`, opacity: 0 }]]);
  }
  // dead leaves come loose over it as it draws the life in
  for (let i = 0; i < 5; i++) {
    const x0 = 110 + rand() * 90, y0 = 24 + rand() * 30, t0 = 850 + i * 170, r = Math.round(rand() * 360);
    fx(k.picIn(leafB, [x0, y0], 9, 4), [[t0, { transform: `rotate(${r}deg) scale(.8)`, opacity: 0 }, 'ease-out'], [t0 + 120, { transform: `${k.T(1, 4)} rotate(${r + 25}deg) scale(1)`, opacity: 0.95 }, eio], [t0 + 1500, { transform: `${k.T(-12 + rand() * 10, 80)} rotate(${r + 200}deg) scale(1)`, opacity: 0.9 }, 'ease-in'], [t0 + 1800, { transform: `${k.T(-13, 95)} rotate(${r + 240}deg) scale(1)`, opacity: 0 }]]);
  }

  // ── the blight (RELEASE to IMPACT): rot and spores in an arc from its jaws to T
  const bz = arcPath(JR, T, 26 + Math.hypot(T[0] - JR[0], T[1] - JR[1]) * 0.12);
  const [dx, dy] = [T[0] - JR[0], T[1] - JR[1]], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
  for (let i = 0; i < 16; i++) {
    const t0 = REL + i * 34, D = (IM - REL) + 120 + rand() * 80, sd = (rand() - 0.5) * 10, big = i % 3 !== 2, sz = big ? 11 + rand() * 6 : 4 + rand() * 3, ks = [];
    for (let j = 0; j <= 8; j++) {
      const f = j / 8, e = f * f * 0.4 + f * 0.6, p = bz(e), w = Math.sin(e * Math.PI) * sd;
      ks.push([t0 + D * f, { transform: `${k.T(p[0] - JR[0] + nx * w, p[1] - JR[1] + ny * w)} rotate(${Math.round(f * 160)}deg) scale(${(f < 0.12 ? 0.4 : 0.8 + 0.5 * f).toFixed(2)})`, opacity: j === 0 || j === 8 ? 0 : big ? 0.8 : 0.95 }, 'linear']);
    }
    fx(big ? k.pic('rot', JR, sz, sz, { lit: false }) : k.pic('spore', JR, sz, sz), ks);
  }
  fx(k.light('g-blight', JR, 18), tidy([[REL - 30, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [REL + 60, { transform: 'scale(1.3)', opacity: 1 }, eio], [REL + 300, { transform: 'scale(.8)', opacity: 0.4 }, eio], [REL + 500, { transform: 'scale(.4)', opacity: 0 }]]));

  // ── IMPACT at T: the life goes out of it: a sick light, rings, spores, leaves browning and curling away
  fx(k.light('g-blight', T, 40), tidy([[IM - 50, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(1.2)', opacity: 1 }, eio], [IM + 400, { transform: 'scale(.9)', opacity: 0.55 }, eio], [IM + 1000, { transform: 'scale(.7)', opacity: 0.3 }, eio], [IM + 1400, { transform: 'scale(.5)', opacity: 0 }]]));
  fx(k.light('g-wither', T, 58), tidy([[IM + 100, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 500, { transform: 'scale(1)', opacity: 0.7 }, eio], [IM + 1300, { transform: 'scale(1.1)', opacity: 0.35 }, eio], [IM + 1800, { transform: 'scale(1.2)', opacity: 0 }]]));
  for (let i = 0; i < 2; i++) { const t0 = IM + i * 140; fx(k.pic(ring, T, 46, 46), [[t0, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [t0 + 70, { transform: 'scale(.4)', opacity: 0.9 }], [t0 + 620, { transform: 'scale(1.3)', opacity: 0 }]]); }
  for (let i = 0; i < 4; i++) {
    const a = rand() * Math.PI * 2, d = 6 + rand() * 12, t0 = IM + 30 + i * 90, r = Math.round(rand() * 360);
    fx(k.pic('rot', [T[0] + Math.cos(a) * d, T[1] + Math.sin(a) * d * 0.7], 20, 20, { lit: false }), [[t0, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 200, { transform: `${k.T(Math.cos(a) * 5, Math.sin(a) * 4)} rotate(${r + 40}deg) scale(1)`, opacity: 0.75 }], [t0 + 1100, { transform: `${k.T(Math.cos(a) * 9, Math.sin(a) * 6 - 14)} rotate(${r + 90}deg) scale(1.8)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 14; i++) {
    const a = -Math.PI * (0.05 + rand() * 0.9), sp = 8 + rand() * 20, t0 = IM + rand() * 60, life = 700 + rand() * 600, sz = 2.6 + rand() * 3;
    fx(k.pic('spore', T, sz, sz), [0, 0.4, 0.75, 1].map((f, j) => [t0 + life * f, { transform: `translate(${(Math.cos(a) * sp * f * u).toFixed(1)}px, ${((Math.sin(a) * sp * f + 24 * f * f) * u).toFixed(1)}px) scale(${(1 - 0.4 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 0.9 }, j ? 'linear' : 'ease-out']));
  }
  // leaves: green at first, browning (the green one fades as the brown comes up), curling and falling away
  for (let i = 0; i < 8; i++) {
    const x0 = T[0] + (rand() - 0.5) * 34, y0 = T[1] + (rand() - 0.5) * 16, t0 = IM + 30 + i * 60, r = Math.round(rand() * 360), dxf = (rand() - 0.5) * 22, ww = 9 + rand() * 3;
    const pose = (f, o, s = 1) => ({ transform: `${k.T(dxf * f + Math.sin(f * 6 + i) * 3, 56 * f * f + 2 * f)} rotate(${Math.round(r + f * 220)}deg) scale(${s})`, opacity: o });
    fx(k.pic(leafG, [x0, y0], ww, ww * 0.43, { lit: false }), [[t0, pose(0, 0, 0.7), 'ease-out'], [t0 + 100, pose(0, 1), eio], [t0 + 420, pose(0.1, 1)], [t0 + 620, pose(0.18, 0)]]);
    fx(k.pic(leafB, [x0, y0], ww, ww * 0.43, { lit: false }), [[t0 + 100, pose(0, 0, 0.9), 'ease-out'], [t0 + 440, pose(0.1, 1)], [t0 + 1500, pose(0.8, 0.95, 0.8), 'ease-in'], [t0 + 1900, pose(1, 0, 0.7)]]);
  }

  // ── the root: the wound's light flares as it comes back down, and settles
  fx(k.lightIn('g-blight', WOUND, 36, 24), [[2500, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [3000, { transform: 'scale(1)', opacity: 0.55 }, eio], [3400, { transform: 'scale(1.1)', opacity: 0.35 }, eio], [BACK, { transform: 'scale(.7)', opacity: 0 }]]);
}
