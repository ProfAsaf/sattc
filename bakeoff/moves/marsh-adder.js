// Marsh Adder (a creature, an attacker: a black snake rearing out of the reeds against the moon; its venom is the attack).
// It coils back, swaying, venom welling on its fangs and dripping; then strikes: the whole upper body snaps toward T
// (the head turned to it, mirrored if T lies to its right), jaws wide, and spits its venom: a spray of glowing violet
// globs along arcs from its fangs to T, where it bursts into a splash, rings and a creeping violet cloud with bubbles
// that pop. It holds the strike, tongue flicking, then recoils, slides back and settles, as drawn.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker (as suggested), element venom (the suggestion was
// light: the picture is a snake and its fangs; its attack is venom). T = k.aim, else the dark water to its left
// (`reeds`). Parts: neck (the upper S with its zig-zag: turned about the bend), head and face (turned on the neck).
//   0-760    GATHER: it sways back and up (neck leans away from T, head tips up), venom wells on the fangs, drips,
//            a violet glow gathers at its jaws.
//   760-940  STRIKE: neck snaps toward T (ease-in), head turns to T; two afterimages trail the head.
//   880      RELEASE: the globs leave the fangs for T.   1280  IMPACT: they land (first), splash, rings, cloud.
//   940-1500 held, jaws open, tongue flicking; 1500-2300 recoil, then slides back; the cloud rises and thins.
//   3100     SETTLE: head, neck and zig-zag exactly as drawn.
import { mul, rot, scl, tr, app, curve, kit } from './_fx.js';

export const END = 3900;
export const BEATS = { release: 880, impact: 1280, settle: 3100 };
export const STILLS = [600, 800, 900, 1000, 1150, 1350, 1700, 3600];

export const textures = {
  glob: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [170 + 80 * c, 110 + 110 * c * c, 255, Math.min(1, c * 2.4)]; }],
  vcloud: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [120 + 40 * c, 70 + 30 * c, 200 + 30 * c, Math.min(0.55, c * c * 1.1)]; }],
  bub: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2; const e = Math.exp(-Math.pow((r - 0.78) / 0.16, 2)); const h = Math.exp(-Math.pow(Math.hypot(x - 0.36, y - 0.34) / 0.1, 2)); return [215, 190, 255, Math.min(1, e * 0.9 + h * 0.9)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const F = kit(k), { ride, drive } = F;
  const S = k.spec, E = S.emit, NK = S.neck, HD = S.head;
  const neck = k.part('neck'), zig = k.part('zig'), head = k.part('head'), face = k.part('face');
  const T = k.aim || S.reeds;
  const REL = BEATS.release, IM = BEATS.impact, BACK = BEATS.settle;
  const tidy = (l) => l.filter((q, i) => i === 0 || q[0] > l[i - 1][0]);

  // ── which way it strikes (-1: left, as drawn; +1: it turns its head round to the right)
  const dir = T[0] < HD[0] - 4 ? -1 : 1, mir = dir > 0;
  const wrap = (d) => ((d + 540) % 360) - 180;
  const STR = 30 * dir;                                           // the neck's lean at the strike
  const LUNGE = [dir * 14, 5];                                     // it also darts forward, along its line of strike
  const Wn0 = mul(tr(LUNGE[0], LUNGE[1]), rot(STR, NK[0], NK[1]));
  const Hs = app(Wn0, HD);                                        // where the head's joint is at the strike
  const v = [(mir ? -1 : 1) * (E[0] - HD[0]), E[1] - HD[1]];      // its jaws' line (mirrored when turned round)
  const ax = (Math.atan2(v[1], v[0]) * 180) / Math.PI;
  const aim = (Math.atan2(T[1] - Hs[1], T[0] - Hs[0]) * 180) / Math.PI;
  const HA = Math.max(-60, Math.min(60, wrap(aim - ax - STR)));   // the head's turn, on top of the neck's
  // the poses over time: neck angle, head angle on the neck
  const nAng = curve([[0, 0], [380, -6 * dir, 'out'], [760, -20 * dir], [900, STR, 'in'], [1500, STR * 0.96], [1850, -4 * dir, 'out'], [2500, 2 * dir], [BACK, 0]]);
  const sway = (t) => (t < 760 ? Math.sin(t / 150) * 1.3 * Math.min(1, t / 300) : 0);
  const hAng = curve([[0, 0], [380, 6, 'out'], [760, -dir * 9], [900, HA * 1.1, 'in'], [1000, HA], [1500, HA * 0.8], [1850, -dir * 5, 'out'], [2500, 0], [BACK, 0]]);
  const lunge = curve([[0, 0], [760, -0.25], [900, 1, 'in'], [1500, 0.95], [1850, 0, 'out'], [BACK, 0]]);
  const Wn = (t) => mul(tr(LUNGE[0] * lunge(t), LUNGE[1] * lunge(t)), rot(nAng(t) + sway(t), NK[0], NK[1]));
  // the head is mirrored (a flip about its joint) from just before the strike to just after the recoil, if it strikes right
  const flipC = curve([[0, 1], [600, 1], [680, 0.06], [760, -1], [1800, -1], [1900, 0.06], [2000, 1]]);
  const mirrorAt = (t) => (mir ? flipC(t) : 1);
  const Wh = (t) => mul(Wn(t), mul(rot(hAng(t), HD[0], HD[1]), scl(mirrorAt(t), 1, HD[0], HD[1])));
  drive(neck, NK, Wn, BACK + 100);
  drive(zig, NK, Wn, BACK + 100);
  drive(head, HD, Wh, BACK + 100);
  drive(face, HD, Wh, BACK + 100);
  // afterimages of the head as it strikes (copies of it, trailing the strike)
  for (const [lag, o] of [[40, 0.3], [85, 0.16]]) {
    const gh = k.copy('head', '', { behind: true });
    const ks = [];
    for (let t = 740; t <= 1160; t += 40) ks.push([t, { transform: F.css(Wh(Math.max(0, t - lag)), HD), opacity: t > 760 && t < 1100 ? o : 0 }, 'linear']);
    act(gh, ks);
  }

  // where its jaws are over time (the fangs' tips at rest `E`)
  const jaws = (t) => app(Wh(t), E);
  const JA = jaws(REL);

  // ── venom welling on the fangs and dripping while it gathers; the glow at its jaws
  ride(k.lightIn('g-violet', E, 22, 22), E, Wh, [[250, 0.3, 0], [760, 0.9, 0.55], [900, 1.5, 0.95], [1100, 1.3, 0.8], [1500, 0.9, 0.35], [2000, 0.5, 0]]);
  for (let i = 0; i < 4; i++) {
    const fxp = [E[0] - 1.2 + (i % 2) * 5.2, E[1] - 0.4], t0 = 300 + i * 150, fall = 9 + rand() * 6;
    ride(k.picIn('glob', fxp, 3.2, 3.2), fxp, Wh, [[t0, 0.3, 0], [t0 + 200, 1.0, 0.95], [t0 + 420, 1.1, 0.95]], '');
    // the drop that lets go falls on its own
    fx(k.picIn('glob', fxp, 3.2, 3.2), [[t0 + 420, { transform: 'translateY(0px) scale(1)', opacity: 0 }], [t0 + 440, { transform: 'translateY(0px) scale(1)', opacity: 0.95 }, 'ease-in'], [t0 + 760, { transform: `translateY(${(fall * u).toFixed(1)}px) scale(.7, 1.5)`, opacity: 0 }]]);
  }

  // ── the spray (RELEASE to IMPACT): globs along arcs from the fangs to T (on the overlay: T may be on another card)
  const dist = Math.hypot(T[0] - JA[0], T[1] - JA[1]) || 1, nx = -(T[1] - JA[1]) / dist, ny = (T[0] - JA[0]) / dist;
  const N = 11;
  for (let i = 0; i < N; i++) {
    const t0 = REL + i * 34 + rand() * 18, D = 400 + rand() * 90, sd = (rand() - 0.5) * Math.min(22, dist * 0.22), lift = 6 + rand() * 14;
    const tg = [T[0] + (rand() - 0.5) * 14, T[1] + (rand() - 0.5) * 8];
    const C = [(JA[0] + tg[0]) / 2 + nx * sd, Math.min(JA[1], tg[1]) - lift + ny * sd];
    const bz = (t) => { const q = 1 - t; return [q * q * JA[0] + 2 * q * t * C[0] + t * t * tg[0], q * q * JA[1] + 2 * q * t * C[1] + t * t * tg[1]]; };
    const sz = 6 + rand() * 5, ks = [];
    for (let j = 0, f = 0; j <= 8; j++, f = j / 8) {
      const [x, y] = bz(f), [x2, y2] = bz(Math.min(1, f + 0.05)), ang = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI;
      ks.push([t0 + f * D, { transform: `${k.T(x - JA[0], y - JA[1])} rotate(${ang.toFixed(0)}deg) scale(${(f < 0.1 ? 0.5 : 1.6 - 0.5 * f).toFixed(2)}, ${(f < 0.1 ? 0.5 : 0.9 - 0.2 * f).toFixed(2)})`, opacity: f === 0 ? 0 : f >= 1 ? 0 : 0.95 }, 'linear']);
    }
    fx(k.pic('glob', JA, sz, sz), ks);
    // a tail of fine drops that falls behind
    for (let j = 0; j < 2; j++) {
      const f = 0.3 + j * 0.3, [x, y] = bz(f), tt = t0 + f * D;
      fx(k.pic('glob', [x, y], 2.6, 2.6), [[tt, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [tt + 60, { transform: 'scale(1)', opacity: 0.85 }, 'linear'], [tt + 420, { transform: `${k.T(0, 10 + rand() * 6)} scale(.5)`, opacity: 0 }]]);
    }
  }

  // a glow riding the heart of the spray
  {
    const C = [(JA[0] + T[0]) / 2, Math.min(JA[1], T[1]) - 12], bz = (t) => { const q = 1 - t; return [q * q * JA[0] + 2 * q * t * C[0] + t * t * T[0], q * q * JA[1] + 2 * q * t * C[1] + t * t * T[1]]; }, ks = [];
    for (let j = 0; j <= 8; j++) { const f = j / 8, [x, y] = bz(f); ks.push([REL + 40 + f * 380, { transform: `${k.T(x - JA[0], y - JA[1])} scale(${(0.6 + 0.5 * Math.sin(f * Math.PI)).toFixed(2)})`, opacity: j === 0 || j === 8 ? 0 : 0.85 }, 'linear']); }
    fx(k.light('g-violet', JA, 18), ks);
  }

  // ── IMPACT at T: a flash, rings, a splash flung out, a creeping violet cloud, bubbles that pop
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#9b6bff" stroke-width="6" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#e7d7ff" stroke-width="1.4"/>', 100, 100);
  fx(k.light('g-violet', T, 44), tidy([[IM - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(1.25)', opacity: 1 }, eio], [IM + 380, { transform: 'scale(.9)', opacity: 0.55 }, eio], [IM + 900, { transform: 'scale(1.0)', opacity: 0.4 }, eio], [IM + 1700, { transform: 'scale(1.2)', opacity: 0 }]]));
  for (let i = 0; i < 2; i++) {
    const t0 = IM + i * 150;
    fx(k.pic(ring, T, 38, 38), [[t0, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [t0 + 70, { transform: 'scale(.5)', opacity: 0.9 }], [t0 + 650, { transform: 'scale(1.5)', opacity: 0 }]]);
  }
  for (let i = 0; i < 14; i++) {
    const a = -Math.PI * (0.05 + rand() * 0.9), sp = 10 + rand() * 22, t0 = IM + rand() * 40, life = 380 + rand() * 300, sz = 3 + rand() * 4;
    const px = (f) => Math.cos(a) * sp * f * u, py = (f) => (Math.sin(a) * sp * f + 30 * f * f) * u;
    fx(k.pic('glob', T, sz, sz), [0, 0.35, 0.7, 1].map((f, j) => [t0 + life * f, { transform: `translate(${px(f).toFixed(1)}px, ${py(f).toFixed(1)}px) scale(${(1 - 0.7 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 0.95 }, j ? 'linear' : 'ease-out']));
  }
  for (let i = 0; i < 5; i++) {
    const t0 = IM + 80 + i * 170, r = Math.round(rand() * 360), dx = (rand() - 0.5) * 20;
    fx(k.pic('vcloud', [T[0] + (rand() - 0.5) * 12, T[1] - 2], 34, 34, { lit: false }), [[t0, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 320, { transform: `${k.T(dx * 0.3, -6)} rotate(${r + 20}deg) scale(1)`, opacity: 0.75 }], [t0 + 1500, { transform: `${k.T(dx, -26)} rotate(${r + 50}deg) scale(1.7)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 7; i++) {
    const t0 = IM + 250 + i * 150, x = T[0] + (rand() - 0.5) * 22, sz = 3 + rand() * 3, rise = 8 + rand() * 12;
    fx(k.pic('bub', [x, T[1] + 2], sz, sz), [[t0, { transform: 'translateY(0px) scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 160, { transform: `translateY(${(-rise * 0.3 * u).toFixed(1)}px) scale(1)`, opacity: 0.9 }, 'linear'], [t0 + 560, { transform: `translateY(${(-rise * u).toFixed(1)}px) scale(1.3)`, opacity: 0.9 }, 'ease-in'], [t0 + 620, { transform: `translateY(${(-rise * u).toFixed(1)}px) scale(1.9)`, opacity: 0 }]]);
  }
}
