// Canopy Archer: she draws deeper, the wind gathers on the arrowhead, and she looses it at T.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker (as suggested: a 2/2 that shoots
// fliers), element wind (pale green-white gusts and blown leaves).
//   0-1050    gather: she turns toward T (flipping if T is behind her) and lifts the bow to it, leaning
//             back into the draw; the string stretches deeper, the arrow slides back with it; curls of
//             wind spiral in onto the arrowhead and a pale glow swells on it; leaves lift off the branch.
//   1100      RELEASE: the arrow vanishes from the bow and flies (a long, thin arrow of light with
//             wind curling off it) to T; the string snaps straight and twangs, the bow kicks, the
//             drawing hand springs open, she rocks back; a gust ring and shaken leaves at the bow.
//   1400      IMPACT at T: flash, two rings, rays, a burst of leaves and motes; alone, T is the dark
//             winged thing: it is knocked back and tumbles, wings fluttering, then rights itself.
//   1500-3500 follow-through: the bow settles, the string stills, she draws another arrow
//             (2100-2500: it slides onto the string and the arrowhead catches the light), the bird
//             circles back to its place; at rest as drawn from 3500 (END 4000).
// Aimed: T = k.aim || [222, 29] (the winged shape). She turns toward T whichever side it is on, and
// the arrow goes from emit (the arrowhead, carried by the bow's own transform) to T.
import { mul, rot, scl, tr, app, curve, kit } from './_fx.js';
export const END = 4000;
export const BEATS = { release: 1100, impact: 1400, settle: 3500 };
export const STILLS = [450, 900, 1090, 1150, 1400, 1700, 2400, 3700];
export const textures = {
  mote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [240, 255, 226, Math.min(1, c * c * c * 2.4)]; }],
  star: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); const ax = Math.abs(x - 0.5) * 2, ay = Math.abs(y - 0.5) * 2, ray = Math.max(0, 1 - Math.min(ax, ay) * 9) * Math.max(0, 1 - Math.max(ax, ay)); return [244, 255, 232, Math.min(1, c * c * c * 1.6 + ray * 0.8)]; }],
};

export function build(k) {
  const { fx, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  k.css('.g-wind { border-radius: 50%; background: radial-gradient(circle, rgba(246,255,240,.95), rgba(196,238,196,.55) 32%, rgba(150,215,170,.2) 58%, rgba(120,200,160,0) 72%); }');
  const S = k.spec, E = S.emit, HIPS = S.hips, SH = S.aimAt, MX = S.mirrorX, BIRD = S.bird;
  const TIP1 = S.tips[0];
  const T = k.aim || [222, 29];
  const alone = !k.aim;
  const mirrored = T[0] < 100;
  const Tm = mirrored ? [2 * MX - T[0], T[1]] : T;
  const ang0 = -35;
  const aimDeg = (Math.atan2(Tm[1] - E[1], Tm[0] - E[0]) * 180) / Math.PI;
  const delta = Math.max(-50, Math.min(50, aimDeg - ang0));

  // ── her: flip, lean, aim; everything she holds turns about the bow's joint
  const m = curve(mirrored ? [[0, 1], [160, 1], [560, -1], [3000, -1], [3350, 1]] : [[0, 1], [4000, 1]]);
  const F = (t) => scl(Math.abs(m(t)) < 0.02 ? 0.02 : m(t), 1, MX, 0);
  const aim = curve([[0, 0], [200, 0], [760, delta, 'out'], [1100, delta], [1180, delta * 0.9], [1700, delta * 0.5], [3000, 0]]);
  const kick = curve([[0, 0], [1090, 0], [1130, -5, 'out'], [1260, 2.5], [1450, -1.2], [1700, 0.4], [2000, 0]]);
  const lean = curve([[0, 0], [300, -0.5], [1050, -3.2, 'in'], [1130, 1.6, 'out'], [1350, -0.8], [1800, 0.3], [2600, 0], [3300, 0]]);
  const L = (t) => rot(lean(t) + aim(t) * 0.12, HIPS[0], HIPS[1]);
  const WB = (t) => mul(F(t), L(t));
  const WBow = (t) => mul(F(t), mul(L(t), rot(aim(t) + kick(t), SH[0], SH[1])));
  // the string: stretched along the arrow's line, about the line through the bow's tips; snaps through straight
  const ux = Math.cos((ang0 * Math.PI) / 180), uy = Math.sin((ang0 * Math.PI) / 180);
  const lam = curve([[0, 1], [300, 1], [1050, 1.12, 'in'], [1095, 1.12], [1115, -0.55, 'out'], [1170, 0.38], [1230, -0.22], [1290, 0.12], [1350, -0.05], [1420, 0, 'lin'], [2100, 0], [2500, 1]]);
  const SS = (l) => [1 + (l - 1) * ux * ux, (l - 1) * ux * uy, (l - 1) * ux * uy, 1 + (l - 1) * uy * uy, 0, 0];
  const WS = (t) => { const M = SS(lam(t)); return mul(WBow(t), mul(tr(TIP1[0], TIP1[1]), mul(M, tr(-TIP1[0], -TIP1[1])))); };
  const back = (t) => curve([[0, 0], [300, 0], [1050, 2.3, 'in'], [1095, 2.3], [1115, -1.2, 'out'], [1180, 0], [2100, 0], [2500, 0]])(t);
  const WArrow = (t) => mul(WBow(t), tr(-ux * back(t), -uy * back(t)));
  const vis = curve([[0, 1], [1090, 1], [1110, 0, 'lin'], [2150, 0], [2480, 1]]);
  const WDraw = (t) => { const o = curve([[0, 0], [1090, 0], [1130, 5, 'out'], [1260, 1.5], [1700, 0]])(t) + back(t) * 0.6; return mul(WBow(t), tr(-ux * o, -uy * o)); };
  h.drive(k.part('body'), HIPS, WB, 3500);
  h.drive(k.part('bow'), SH, WBow, 3500);
  h.drive(k.part('hand'), SH, WBow, 3500);
  h.drive(k.part('draw'), SH, WDraw, 3500);
  h.drive(k.part('string'), SH, WS, 3500);
  h.drive(k.part('arrow'), SH, WArrow, 3500, 50, vis);
  h.drive(k.part('tip'), SH, WArrow, 3500, 50, vis);
  const E1 = app(WBow(1100), E); // where the arrow leaves from, as she holds the bow at the release
  const dir = ((T[0] - E1[0]) / (Math.hypot(T[0] - E1[0], T[1] - E1[1]) || 1)), diry = ((T[1] - E1[1]) / (Math.hypot(T[0] - E1[0], T[1] - E1[1]) || 1));
  const angT = (Math.atan2(diry, dir) * 180) / Math.PI;
  const Et = (t) => app(WBow(t), E);

  // ── the dark winged thing: knocked back and tumbling when hit; alone it is the target
  const hitF = alone ? 1 : 0.3, t0b = alone ? 1400 : 1150;
  const bmag = curve([[0, 0], [t0b, 0], [t0b + 60, 7 * hitF, 'out'], [t0b + 500, 2 * hitF], [t0b + 1300, 0]]);
  const brot = curve([[0, 0], [t0b, 0], [t0b + 90, -22 * hitF, 'out'], [t0b + 330, 15 * hitF], [t0b + 620, -7 * hitF], [t0b + 900, 3 * hitF], [t0b + 1500, 0]]);
  const bdy = curve([[0, 0], [t0b, 0], [t0b + 120, 6 * hitF, 'out'], [t0b + 500, -3 * hitF], [t0b + 1000, 0]]);
  const bsq = (t) => (t < t0b ? 1 : 1 + 0.2 * hitF * Math.sin((t - t0b) / 48) * Math.max(0, 1 - (t - t0b) / 1100));
  const WBird = (t) => mul(tr((alone ? dir : 0.8) * bmag(t), bmag(t) * (alone ? diry : -0.5) * 0.7 + bdy(t)), mul(rot(brot(t), BIRD[0], BIRD[1] + 1), scl(1, bsq(t), BIRD[0], BIRD[1] + 1)));
  h.drive(k.part('bird'), [222, 30], WBird, 3300, 40);

  // ── gather (200 - 1050): curls of wind spiral in on the arrowhead; a pale glow swells on it
  const curl = k.svg('<g fill="none" stroke="#f4ffe6" stroke-linecap="round"><path d="M3,14 C12,1 33,1 45,13" stroke-width="2.2"/><path d="M11,20 C19,12 31,12 38,18" stroke-width="1.3"/></g>', 48, 24);
  for (let i = 0; i < 11; i++) {
    const t0 = 250 + i * 70 + rand() * 40, dur = 560 + rand() * 120, a0 = rand() * Math.PI * 2, r0 = 30 + rand() * 18, sp = (i % 2 ? 1 : -1) * (1.3 + rand() * 0.6), sz = 9 + rand() * 6;
    const ks = [];
    for (let j = 0; j <= 6; j++) {
      const f = j / 6, a = a0 + sp * f * 2.2, r = r0 * (1 - f * f) + 1, c = Et(Math.min(1100, t0 + dur * f));
      const px = c[0] + Math.cos(a) * r - E[0], py = c[1] + Math.sin(a) * r * 0.8 - E[1];
      const tang = (a * 180) / Math.PI + (sp > 0 ? 90 : -90);
      ks.push([t0 + dur * f, { transform: `${k.T(px, py)} rotate(${tang.toFixed(0)}deg) scale(${(0.5 + 0.7 * (1 - f)).toFixed(2)})`, opacity: j === 0 ? 0 : j === 6 ? 0 : Math.min(0.9, 0.5 + 0.5 * Math.sin(Math.PI * f)) }, j ? 'linear' : 'ease-out']);
    }
    fx(k.pic(curl, E, sz, sz / 2), ks);
  }
  const gl = [[300, { transform: 'scale(.2)', opacity: 0 }, 'ease-out']];
  for (let t = 400; t <= 1100; t += 70) {
    const c = Et(t), f = Math.min(1, (t - 300) / 750), g = f * f * (3 - 2 * f);
    gl.push([t, { transform: `${k.T(c[0] - E[0], c[1] - E[1])} scale(${(0.25 + 1.1 * g + 0.05 * Math.sin(t / 45)).toFixed(2)})`, opacity: +(0.15 + 0.8 * g).toFixed(2) }, 'linear']);
  }
  gl.push([1160, { transform: `${k.T(E1[0] - E[0], E1[1] - E[1])} scale(2.1)`, opacity: 0.9 }, 'ease-out'], [1500, { transform: `${k.T(E1[0] - E[0], E1[1] - E[1])} scale(1.1)`, opacity: 0 }]);
  fx(k.pic('star', E, 16, 16), gl.map(([t, v, e]) => [t, v, e])); // the head's glint (same path, a star)
  fx(k.light('g-wind', E, 36), gl);
  // leaves lifting off the branch and the bark as the draw tightens
  const leafA = k.svg('<path d="M10,1 C17,6 17,17 10,25 C3,17 3,6 10,1Z" fill="#4f6b38"/><path d="M10,4 L10,22" stroke="#cfe69a" stroke-width=".9" fill="none"/>', 20, 26);
  const leafB = k.svg('<path d="M10,1 C17,6 17,17 10,25 C3,17 3,6 10,1Z" fill="#d6e89a"/><path d="M10,4 L10,22" stroke="#6f8c44" stroke-width=".9" fill="none"/>', 20, 26);
  for (let i = 0; i < 9; i++) {
    const t = 350 + i * 85 + rand() * 40, x0 = 120 + rand() * 150, y0 = 168 + rand() * 6, life = 1100 + rand() * 500, r0 = Math.round(rand() * 360);
    const ks = [0, 0.25, 0.55, 0.8, 1].map((f, j) => [t + life * f, { transform: `${k.T(-24 * f * (1 + rand() * 0.3) - 8 * f, -30 * Math.sin(f * 2.2) - 4 * f)} rotate(${Math.round(r0 + 280 * f)}deg) scale(${(0.5 + 0.6 * Math.min(1, f * 4)).toFixed(2)})`, opacity: j === 0 || j === 4 ? 0 : 1 }, j ? 'linear' : 'ease-out']);
    fx(k.picIn(i % 2 ? leafA : leafB, [x0, y0], 6, 8, { lit: false }), ks);
  }

  // ── RELEASE (1100): a gust ring at the bow, leaves shaken from the canopy, the arrow flies
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#f2ffe4" stroke-width="5" filter="url(#b)"/>', 100, 100);
  fx(k.light('g-wind', E1, 30), [[1070, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1130, { transform: 'scale(1.6)', opacity: 1 }, 'ease-out'], [1450, { transform: 'scale(2.2)', opacity: 0 }]]);
  fx(k.pic(ring, E1, 42, 42), [[1100, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [1150, { transform: 'scale(.4)', opacity: 0.9 }, 'ease-out'], [1560, { transform: 'scale(1.1)', opacity: 0 }]]);
  for (let i = 0; i < 9; i++) {
    const t = 1100 + rand() * 120, x0 = 30 + rand() * 90, y0 = 6 + rand() * 40, life = 1200 + rand() * 600, r0 = Math.round(rand() * 360), sw = rand() < 0.5 ? 1 : -1;
    const ks = [0, 0.2, 0.5, 0.8, 1].map((f, j) => [t + life * f, { transform: `${k.T(sw * Math.sin(f * 5) * 9 + 6 * f, 52 * f * f + 6 * f)} rotate(${Math.round(r0 + sw * 300 * f)}deg) scale(${(0.5 + 0.6 * Math.min(1, f * 4)).toFixed(2)})`, opacity: j === 0 || j === 4 ? 0 : 1 }, j ? 'linear' : 'ease-out']);
    fx(k.picIn(i % 2 ? leafA : leafB, [x0, y0], 6, 8, { lit: false }), ks);
  }
  // the arrow: a long, thin arrow of light, wind curling off it as it flies
  const arrow = k.svg('<defs><filter id="a" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="1"/></filter></defs>' +
    '<g stroke="#e8ffe0" stroke-width="3" stroke-linecap="round" opacity=".7" filter="url(#a)"><path d="M3,10 L38,10"/></g>' +
    '<path d="M4,10 L36,10" stroke="#fbfff4" stroke-width="1.3" stroke-linecap="round"/><path d="M34,6.4 L44,10 L34,13.6Z" fill="#ffffff"/>' +
    '<path d="M4,10 L1,7 M4,10 L1,13 M8,10 L5,7 M8,10 L5,13" stroke="#dff5d0" stroke-width="1.1" stroke-linecap="round"/>', 48, 20);
  const AL = 14; // the arrow's head sits this far ahead of its centre
  const line = (f, off = 0) => [E1[0] + (T[0] - E1[0]) * f - dir * (AL - off), E1[1] + (T[1] - E1[1]) * f - diry * (AL - off) - 5 * Math.sin(Math.PI * f) * (alone ? 1 : 0.6)];
  const t0a = 1100, t1a = 1400;
  h.fly(k.pic(arrow, E, 26, 11), E, (f) => line(f), t0a - 20, t1a, () => 1, (f) => (f < 0.04 ? f * 25 : 1), angT, 0, 25, (f) => f * f * 0.45 + f * 0.55);
  for (let i = 0; i < 7; i++) {
    // wind curling off it: curls shed along the flight, each opening out and fading
    const f0 = 0.08 + i * 0.12, tt = t0a + (f0 * f0 * 0.45 + f0 * 0.55) * (t1a - t0a), p = line(f0, 4 + i);
    fx(k.pic(curl, p, 12 + rand() * 4, 6 + rand() * 2), [[tt, { transform: `rotate(${(angT + (i % 2 ? 25 : -25)).toFixed(0)}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [tt + 60, { transform: `rotate(${(angT + (i % 2 ? 25 : -25)).toFixed(0)}deg) scale(.9)`, opacity: 0.9 }, 'ease-out'],
      [tt + 330, { transform: `${k.T(-dir * 4, -diry * 4)} rotate(${(angT + (i % 2 ? 60 : -60)).toFixed(0)}deg) scale(1.6)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 14; i++) {
    const t = t0a + i * 15, d = i / 14, sd = (rand() - 0.5) * 6, sz = [4, 3, 5][i % 3];
    const bz = (f) => { const p = line(f * 0.95, 8); return [p[0] - diry * sd * Math.sin(Math.PI * f), p[1] + dir * sd * Math.sin(Math.PI * f)]; };
    h.fly(k.pic('mote', E, sz, sz), E, bz, t, t + 300 - d * 40, (f) => 1 - 0.5 * f, (f) => (f < 0.1 ? f * 8 : 0.8 * (1 - f * 0.6)), 0, 0, 40, (f) => f * f * 0.45 + f * 0.55);
  }

  // ── IMPACT (1400): the gust bursts at T
  const IM = 1400;
  const rays = k.svg('<defs><radialGradient id="r" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fbfff4"/><stop offset="1" stop-color="#bfe8c4" stop-opacity="0"/></radialGradient></defs>' +
    Array.from({ length: 8 }, (_, i) => `<path d="M50,50 L${(50 + 48 * Math.cos((i * Math.PI) / 4 - 0.07)).toFixed(1)},${(50 + 48 * Math.sin((i * Math.PI) / 4 - 0.07)).toFixed(1)} L${(50 + 48 * Math.cos((i * Math.PI) / 4 + 0.07)).toFixed(1)},${(50 + 48 * Math.sin((i * Math.PI) / 4 + 0.07)).toFixed(1)}Z" fill="url(#r)"/>`).join(''), 100, 100);
  const fl = [[IM - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [IM + 250, { transform: 'scale(1.9)', opacity: 0.6 }]];
  for (let t = IM + 450, i = 0; t < IM + 900; t += 140, i++) fl.push([t, { transform: `scale(${i % 2 ? 1.5 : 1.25})`, opacity: i % 2 ? 0.45 : 0.32 }, eio]);
  fl.push([IM + 1300, { transform: 'scale(1)', opacity: 0 }]);
  fx(k.light('g-wind', T, 58), fl);
  fx(k.light('g-wind', T, 20), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.6)', opacity: 1 }], [IM + 200, { transform: 'scale(2.6)', opacity: 0 }]]);
  fx(k.pic(ring, T, 54, 54), [[IM, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(.4)', opacity: 0.95 }, 'ease-out'], [IM + 520, { transform: 'scale(1.1)', opacity: 0 }]]);
  fx(k.pic(ring, T, 54, 54), [[IM + 110, { transform: 'scale(.1)', opacity: 0 }, 'ease-out'], [IM + 170, { transform: 'scale(.3)', opacity: 0.6 }, 'ease-out'], [IM + 640, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.pic(rays, T, 50, 50), [[IM - 10, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [IM + 80, { transform: 'scale(.95) rotate(12deg)', opacity: 0.9 }, 'ease-out'], [IM + 650, { transform: 'scale(1.35) rotate(40deg)', opacity: 0 }]]);
  for (let i = 0; i < 3; i++) {
    const r0 = i * 40;
    fx(k.pic(curl, T, 36, 18), [[IM + 40 + i * 50, { transform: `rotate(${r0}deg) scale(.3)`, opacity: 0 }, 'ease-out'], [IM + 120 + i * 50, { transform: `rotate(${r0 + 50}deg) scale(1)`, opacity: 0.9 }, 'ease-out'], [IM + 600 + i * 50, { transform: `rotate(${r0 + 210}deg) scale(1.7)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + rand() * 0.4, d = 14 + rand() * 20, t = IM + rand() * 40, life = 600 + rand() * 500, sz = 3 + rand() * 3.5, spin = (i % 2 ? 1 : -1) * 0.5;
    const px = (f) => Math.cos(a + spin * f) * d * (0.3 + f), py = (f) => Math.sin(a + spin * f) * d * 0.75 * (0.3 + f) - 10 * f * f;
    const ks = [0, 0.25, 0.6, 1].map((f, j) => [t + life * f, { transform: `${k.T(px(f), py(f))} scale(${(1.1 - 0.7 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']);
    fx(k.pic('mote', T, sz, sz), ks);
  }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + rand() * 0.5, d = 14 + rand() * 20, t = IM + 20 + rand() * 80, life = 900 + rand() * 500, r0 = Math.round(rand() * 360), sw = rand() < 0.5 ? 1 : -1;
    const ks = [0, 0.2, 0.5, 0.8, 1].map((f, j) => [t + life * f, { transform: `${k.T(Math.cos(a + sw * f) * d * (0.2 + f), Math.sin(a + sw * f) * d * 0.7 * (0.2 + f) + 14 * f * f)} rotate(${Math.round(r0 + sw * 260 * f)}deg) scale(${(0.5 + 0.6 * Math.min(1, f * 5)).toFixed(2)})`, opacity: j === 0 || j === 4 ? 0 : 1 }, j ? 'linear' : 'ease-out']);
    fx(k.pic(i % 2 ? leafA : leafB, T, 6, 8, { lit: false }), ks);
  }

  // ── after: she draws another arrow (2100 - 2500): a glint as it settles onto the string
  const E2 = Et(2500);
  fx(k.light('g-wind', E, 22), [[2300, { transform: `${k.T(E2[0] - E[0], E2[1] - E[1])} scale(.3)`, opacity: 0 }, 'ease-out'], [2480, { transform: `${k.T(E2[0] - E[0], E2[1] - E[1])} scale(1.5)`, opacity: 0.85 }, 'ease-out'], [2900, { transform: `${k.T(E2[0] - E[0], E2[1] - E[1])} scale(.6)`, opacity: 0 }]]);
  for (let i = 0; i < 6; i++) {
    const t = 2250 + i * 90 + rand() * 40;
    fx(k.pic('mote', E, 4, 4), [[t, { transform: `${k.T(E2[0] - E[0] - 14 + rand() * 6, E2[1] - E[1] + 10 - rand() * 6)} scale(.4)`, opacity: 0 }, 'ease-out'], [t + 200, { transform: `${k.T(E2[0] - E[0], E2[1] - E[1])} scale(1)`, opacity: 1 }], [t + 400, { transform: `${k.T(E2[0] - E[0], E2[1] - E[1])} scale(.2)`, opacity: 0 }]]);
  }
}
