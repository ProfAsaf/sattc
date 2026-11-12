// Borrowed Time: a ghostly knight rises from his tomb holding a cracked hourglass; he turns it over,
// the sand running fast, and out of it steps a spirit, which flies to where it is wanted, stands a
// moment (its borrowed turn) and comes apart like sand.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support (a creature returns from the discard
// pile for a turn: the gift is the spirit out of the hourglass), element spirit (the suggestion;
// the picture's violet light, the ghost knight).
//   0-450     SINK: the knight settles down behind the tomb, the hourglass lowers (anticipation); the
//             tomb shudders, the lid scrapes, mist spills over the rim; the visor dims.
//   450-1000  RISE: he comes up out of the tomb past his rest, the arm lifting the hourglass, the
//             visor blazing, a light swelling from the tomb; the glass tips back.
//   1000-1450 TURN: the hourglass flips over (a flourish, with overshoot); the sand starts to run;
//             a spirit gathers in the glass, motes drawn in; grains leak from the crack.
//   1500      RELEASE: the arm throws, the spirit steps out of the glass and flies (the head follows
//             it) along an arc to T (k.aim, else the open crypt floor at the left).
//   1950      IMPACT at T: flare, rings, motes; the knight's ghost stands there, visor flaring.
//   1950-3100 it holds a beat (its borrowed turn) then comes apart in sand and motes; the hourglass
//             turns back over, the arm lowers, the knight sinks home, the tomb stills.
//   3700      at rest as drawn (END 4200).
// BEATS: release 1500, impact 1950, settle 3700.
import { mul, rot, tr, app, curve, kit } from './_fx.js';

export const END = 4200;
export const BEATS = { release: 1500, impact: 1950, settle: 3700 };
export const STILLS = [250, 700, 1150, 1450, 1700, 2000, 2500, 3900];

const ball = (r, g, b) => [32, 32, (x, y) => { const d = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - d); return [r + (255 - r) * c * c, g + (255 - g) * c * c, b + (255 - b) * c * c * 0.3, Math.min(1, c * c * 2.4)]; }];
export const textures = {
  orb: ball(214, 180, 255),
  mote: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [232, 216, 255, Math.min(1, c * c * 3)]; }],
  mist: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [190, 168, 236, c * c * 0.6]; }],
  sand: [8, 8, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [244, 230, 255, Math.min(1, c * 2.4)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out', S = k.spec, X = kit(k);
  const body = k.part('body'), arm = k.part('arm'), head = k.part('head'), visor = k.part('visor'), glass = k.part('glass');
  const tomb = k.part('tomb'), panels = k.part('panels'), lid = k.part('lid');
  const SH = S.shoulder, NK = S.neck, GL = S.glass;
  const T = k.aim || [64, 122];
  const dirT = Math.max(-1, Math.min(1, (T[0] - NK[0]) / 70));
  k.css('.g-spirit { border-radius: 50%; background: radial-gradient(circle, rgba(250,244,255,.95), rgba(204,164,255,.6) 30%, rgba(150,96,255,.24) 56%, rgba(120,70,255,0) 72%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#b790f5" stroke-width="5" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#efe4ff" stroke-width="1.4"/>', 100, 100);
  // the spirit: a little ghost knight, helm and shoulders and a tail of mist
  const ghost = k.svg('<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf6ff"/><stop offset=".6" stop-color="#cbb0f8"/><stop offset="1" stop-color="#9a74e6" stop-opacity="0"/></linearGradient><filter id="b" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.3"/></filter></defs>' +
    '<g filter="url(#b)" fill="#b790f5" opacity=".8"><path d="M8,13V8Q8,3 12,2Q16,3 16,8V13Z"/><path d="M3,20Q4,13 12,12Q20,13 21,20L20,24Q12,26 4,24Z"/></g>' +
    '<g fill="url(#g)"><path d="M8,12V8Q8,3.4 12,2.4Q16,3.4 16,8V12Z"/><path d="M3,19Q4,13.4 12,12.6Q20,13.4 21,19L20.5,23Q18,25 16,28Q14,26 12,31Q10,26 8,28Q6,25 3.5,23Z"/></g><path d="M9,8H15" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>', 24, 32);

  // ── the knight: sink (0-450), rise past rest (to 1000), held up while he turns the glass, sinking home by 3700
  const dy = curve([[0, 0], [450, 8], [1000, -4], [1500, -3], [2400, -3], [3000, -1], [3700, 0]]);
  const th = curve([[0, 0], [450, 6], [1000, -10], [1400, -13], [1520, -3, 'out'], [1700, -8], [2300, -8], [3100, -2], [3700, 0]]);
  const phi = curve([[0, 0], [450, 0], [900, -14], [1250, 190, 'out'], [1330, 180], [2300, 180], [2450, 168], [2850, 372, 'out'], [2950, 360], [3700, 360]]);
  const psi = curve([[0, 0], [450, 4], [1000, -2], [1450, dirT * 7], [2300, dirT * 5], [3100, 0]]);
  const Wb = (t) => tr(0, dy(t));
  const Wa = (t) => mul(tr(0, dy(t)), rot(th(t), SH[0], SH[1]));
  const Wg = (t) => mul(Wa(t), rot(phi(t), GL[0], GL[1]));
  const Wh = (t) => mul(tr(0, dy(t)), rot(psi(t), NK[0], NK[1]));
  const vis = curve([[0, 1], [250, 0.25], [450, 0.25], [700, 1], [3700, 1]]);
  X.drive(body, [142, 150], Wb, 3700);
  X.drive(arm, SH, Wa, 3700);
  X.drive(glass, GL, Wg, 3700);
  X.drive(head, NK, Wh, 3700);
  X.drive(visor, [142, 80], Wh, 3700, 50, vis);

  // ── the tomb shudders, the lid scrapes aside a little and back
  const sh = (x, y) => ({ transform: `translate(${(x * u).toFixed(2)}px, ${(y * u).toFixed(2)}px)` });
  const shake = [[0, sh(0, 0), eio]];
  for (let t = 120, i = 0; t < 1000; t += 70, i++) shake.push([t, sh((i % 2 ? 0.5 : -0.5) * (1 - Math.abs(t - 550) / 600), (i % 3 ? 0.3 : -0.2)), eio]);
  shake.push([1100, sh(0, 0)]);
  act(tomb, shake);
  act(panels, shake.map(([t, v, e]) => [t, v, e]));
  act(lid, [[0, { transform: 'none' }, 'ease-out'], [300, { transform: 'none' }, eio], [700, { transform: `${k.T(2.6, 1.3)} rotate(-1.2deg)` }, eio], [2400, { transform: `${k.T(2.6, 1.3)} rotate(-1.2deg)` }, eio], [3500, { transform: 'none' }]]);

  // ── light from the tomb, and mist spilling over its rim
  fx(k.lightIn('g-spirit', [142, 150], 200, 90), [[300, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(1)', opacity: 0.38 }, eio], [2000, { transform: 'scale(1.1)', opacity: 0.34 }, eio], [3200, { transform: 'scale(.8)', opacity: 0 }]]);
  for (let i = 0; i < 9; i++) {
    const x = 78 + i * 18 + (rand() - 0.5) * 8, t = 250 + i * 110 + rand() * 60, r = Math.round(rand() * 360), dx = (rand() - 0.5) * 22;
    fx(k.picIn('mist', [x, 149], 36, 30, { lit: false }), [[t, { transform: `${k.T(0, 2)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'],
      [t + 500, { transform: `${k.T(dx * 0.4, -7)} rotate(${r + 15}deg) scale(1)`, opacity: 0.6 }], [t + 1800, { transform: `${k.T(dx, -30)} rotate(${r + 40}deg) scale(1.9)`, opacity: 0 }]]);
  }

  // ── the visor blazes as he rises
  fx(k.lightIn('g-spirit', [142, 80], 44, 30), [[500, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [800, { transform: 'scale(1.3)', opacity: 0.95 }, eio], [1100, { transform: 'scale(1)', opacity: 0.7 }, eio], [1500, { transform: 'scale(1.1)', opacity: 0.75 }, eio], [2300, { transform: 'scale(1)', opacity: 0.4 }, eio], [3100, { transform: 'scale(.6)', opacity: 0 }]]);

  // ── the hourglass: a glow riding it, then the spirit gathering and the sand running
  X.ride(k.lightIn('g-spirit', GL, 54, 62), GL, Wa, [[900, 0.5, 0], [1250, 1.1, 0.8], [1500, 1.4, 1], [1620, 1.5, 0.9], [2000, 1.2, 0.75], [2300, 1.1, 0.5], [2700, 0.9, 0.4], [3100, 0.7, 0]]);
  X.ride(k.pic('orb', GL, 26, 26), GL, Wa, [[1050, 0.2, 0], [1300, 1, 0.85], [1500, 1.6, 1], [1640, 2.1, 0]]);
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2, r = 16 + rand() * 9, t0 = 1050 + i * 45, sz = 2.4 + rand() * 2;
    const p = [GL[0] + Math.cos(a) * r, GL[1] + Math.sin(a) * r * 0.9];
    // drawn in toward the glass as it gathers
    fx(k.pic('mote', p, sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 100, { transform: 'scale(1)', opacity: 0.9 }, 'ease-in'], [t0 + 420, { transform: `${k.T(GL[0] - p[0], GL[1] - p[1] + dy(t0 + 420))} scale(.4)`, opacity: 0 }]]);
  }
  // the sand running through the neck of the turned glass: bright grains falling, again and again
  for (let i = 0; i < 4; i++) {
    const list = [], x = (i - 1.5) * 0.5;
    for (let t = 1340 + i * 40; t < 2300; t += 150) {
      list.push([t, { transform: `${k.T(x, 0)} scale(.6)`, opacity: 0 }, 'ease-in'], [t + 40, { transform: `${k.T(x, 2)} scale(1)`, opacity: 0.95 }, 'linear'], [t + 130, { transform: `${k.T(x, 12)} scale(.8)`, opacity: 0 }]);
    }
    fx(k.pic('sand', [GL[0], GL[1] - 3 + dy(1340)], 3, 3), list);
  }
  // grains leaking from the crack, falling off the glass
  for (let i = 0; i < 8; i++) {
    const t = 1380 + i * 110 + rand() * 40, x = 184 + rand() * 6, dx = -4 - rand() * 8;
    fx(k.pic('sand', [x, 38 + dy(t)], 2.6, 2.6), [[t, { transform: `${k.T(0, 0)} scale(.5)`, opacity: 0 }, 'ease-out'], [t + 80, { transform: `${k.T(dx * 0.2, 3)} scale(1)`, opacity: 0.95 }, 'ease-in'], [t + 520, { transform: `${k.T(dx, 40 + rand() * 14)} scale(.7)`, opacity: 0 }]]);
  }

  // ── release (1500): the spirit steps out of the glass and flies to T on an arc, over the overlay
  const Lp = app(Wa(1500), GL);
  const C = [(Lp[0] + T[0]) / 2 + (T[0] >= Lp[0] ? 6 : -6), Math.min(Lp[1], T[1]) - 30];
  const bz = (t) => { const q = 1 - t; return [q * q * Lp[0] + 2 * q * t * C[0] + t * t * T[0], q * q * Lp[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const [X0, Y0] = k.P(...Lp);
  const at = (f, s, o, rr = 0, fall = 0) => { const [x, y] = k.P(...bz(f)); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + fall * u).toFixed(1)}px) rotate(${rr}deg) scale(${s})`, opacity: o }; };
  const t0 = 1500, dur = 450, side = T[0] >= Lp[0] ? 1 : -1;
  fx(k.pic(ghost, Lp, 13, 17.5, { lit: false }), [[t0 - 1, at(0, 0.4, 0), 'ease-out'], [t0 + 60, at(0.03, 0.9, 1, -6 * side), 'ease-in'], [t0 + dur * 0.5, at(0.5, 1.15, 1, 10 * side), 'linear'], [t0 + dur, at(1, 1.4, 0.95, 0), 'ease-out'], [t0 + dur + 100, at(1, 1.8, 0, 0)]]);
  fx(k.pic('orb', Lp, 20, 20), [[t0, at(0, 0.5, 0), 'ease-in'], [t0 + 60, at(0.1, 1.2, 1), 'linear'], [t0 + dur * 0.6, at(0.6, 1.3, 0.9), 'linear'], [t0 + dur, at(1, 1.2, 0.8), 'ease-out'], [t0 + dur + 120, at(1, 2, 0)]]);
  for (let j = 0; j < 10; j++) {
    const f = 0.06 + j * 0.095, ts = Math.round(t0 + dur * f), sz = 2.6 + rand() * 2;
    fx(k.pic(j % 2 ? 'sand' : 'mote', Lp, sz, sz), [[ts, at(f, 0.5, 0), 'ease-out'], [ts + 40, at(f, 1, 0.9)], [ts + 380, at(f, 0.3, 0, 0, 12)]]);
  }

  // ── impact (1950): a flare, rings, motes; the knight's ghost stands there a moment, then comes apart in sand
  const IM = 1950;
  fx(k.light('g-spirit', T, 76), [[IM - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [IM + 600, { transform: 'scale(1.2)', opacity: 0.6 }, eio], [IM + 1100, { transform: 'scale(1)', opacity: 0.55 }, eio], [IM + 1700, { transform: 'scale(.7)', opacity: 0 }]]);
  for (const [d, w, o] of [[0, 86, 0.95], [140, 58, 0.7]]) {
    fx(k.pic(ring, T, w, w), [[IM + d - 1, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + d + 40, { transform: 'scale(.3)', opacity: o }, 'ease-out'], [IM + d + 700, { transform: 'scale(1.1)', opacity: 0 }]]);
  }
  fx(k.pic(ghost, T, 30, 40, { lit: false }), [[IM - 1, { transform: `${k.T(0, 4)} scale(.3)`, opacity: 0 }, 'ease-out'], [IM + 120, { transform: `${k.T(0, -1)} scale(1.1)`, opacity: 0.95 }, 'ease-out'], [IM + 260, { transform: `${k.T(0, 0)} scale(1)`, opacity: 0.95 }, eio],
    [IM + 700, { transform: `${k.T(0, -1)} scale(1.02)`, opacity: 0.9 }, eio], [IM + 1000, { transform: `${k.T(0, 0)} scale(1)`, opacity: 0.8 }, 'ease-in'], [IM + 1250, { transform: `${k.T(0, -5)} scale(.9, 1.1)`, opacity: 0 }]]);
  fx(k.pic('orb', [T[0], T[1] - 6], 14, 6), [[IM + 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 180, { transform: 'scale(1.3)', opacity: 1 }, eio], [IM + 520, { transform: 'scale(1)', opacity: 0.6 }, eio], [IM + 900, { transform: 'scale(1.4)', opacity: 0.9 }, 'ease-in'], [IM + 1250, { transform: 'scale(.4)', opacity: 0 }]]);
  for (let i = 0; i < 12; i++) {
    const a = rand() * Math.PI * 2, r = 16 + rand() * 24, t1 = IM + 20 + rand() * 120, life = 700 + rand() * 500, sz = 2.2 + rand() * 2.6;
    const ex = Math.cos(a) * r, ey = Math.sin(a) * r;
    const pts = k.arc([0, 0], [ex * 0.7, ey - 6], [ex * 1.1, ey + 10 + rand() * 10], 5);
    fx(k.pic(i % 3 === 0 ? 'sand' : 'mote', T, sz, sz), [[t1, { transform: `${k.T(0, 0)} scale(.3)`, opacity: 0 }, 'ease-out'],
      ...pts.map(([x, y], j) => [Math.round(t1 + 40 + life * j / 5), { transform: `${k.T(x, y)} scale(${1 - 0.4 * j / 5})`, opacity: j === 5 ? 0 : 0.9 }, j < 1 ? 'ease-out' : eio])]);
  }
  // as it comes apart: sand pouring off it, like the glass running out
  for (let i = 0; i < 10; i++) {
    const t = IM + 900 + i * 55 + rand() * 40, x = (rand() - 0.5) * 14, sz = 2.2 + rand() * 1.8;
    fx(k.pic('sand', [T[0] + x, T[1] - 6 + rand() * 8], sz, sz), [[t, { transform: `${k.T(0, 0)} scale(.6)`, opacity: 0 }, 'ease-out'], [t + 100, { transform: `${k.T(0, 3)} scale(1)`, opacity: 0.95 }, 'ease-in'], [t + 650, { transform: `${k.T(x * 0.5, 22 + rand() * 12)} scale(.6)`, opacity: 0 }]]);
  }
}
