// Cloud Ray: the manta draws its wings up, gathering the sea-mist along them, then snaps
// them down in a dive and slices a crescent of water off the wing-tip at its target, where
// it bursts in spray.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker (as suggested), element water
// (the mist off its wings; the blade it throws is spray).
//   0-880     gather: it rises and folds its wings up (the span narrows), the mist streaming
//             from the tips stretching out; mist and drops are drawn in to the striking
//             wing-tip, which glows pale.
//   900       RELEASE: the wings snap down (the span spreads wide), it banks and dives toward T,
//             and a crescent of spray, trailing drops, leaves the wing-tip for T.
//   1300      IMPACT at T: a flash of cool light, two flat rings, a crown of drops thrown up
//             (arcing back down), mist billows rolling off, foam spreading on the surface.
//   1300-3400 follow-through: it sweeps back up with two slow beats of its wings, the mist
//             trailing behind; the spray settles. At rest as drawn from 3400 (END 3800).
// Aimed: T = k.aim || [205, 150] (the sea below, where the sun sits on the horizon). The wing
// nearest T strikes: its tip (spec.emit right, spec.tipL left) is where the crescent leaves, and
// the body banks toward that side. The crescent is turned along its way from the tip to T.
import { mul, rot, scl, tr, app, curve, kit } from './_fx.js';
export const END = 3800;
export const BEATS = { release: 900, impact: 1300, settle: 3400 };
export const STILLS = [500, 850, 1000, 1150, 1350, 1700, 2400, 3600];
export const textures = {
  drop: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226 + 29 * c, 248, 252, Math.min(1, c * 3)]; }],
  vapor: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, a = Math.max(0, 1 - r); const b = 0.92 + 0.08 * Math.sin(x * 16) * Math.cos(y * 12); return [226 * b, 242 * b, 244 * b, Math.min(1, a * a * 2) * 0.8]; }],
};

export function build(k) {
  const { fx, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const ray = k.part('ray'), mist = k.part('mist'), eyes = k.part('eyes');
  const C = k.spec.mid, AX = k.spec.axis, SEA = k.spec.sea;
  const T = k.aim || [205, 150];
  const right = T[0] >= C[0];
  const tip = right ? k.spec.emit : k.spec.tipL;
  const side = right ? 1 : -1;

  k.css('.g-sea { border-radius: 50%; background: radial-gradient(circle, rgba(236,252,255,.9), rgba(170,226,236,.5) 34%, rgba(120,190,210,.16) 62%, rgba(110,180,200,0) 76%); }');
  const ringSvg = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.8"/></filter></defs><ellipse cx="50" cy="50" rx="42" ry="42" fill="none" stroke="#e8fbff" stroke-width="5" filter="url(#b)"/>', 100, 100);
  const blade = k.svg('<defs><filter id="b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation=".9"/></filter><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#bfe8f0" stop-opacity="0"/><stop offset=".5" stop-color="#e8fbff"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs>' +
    '<path d="M2,16C10,5 26,1 44,10C28,8 14,12 2,16Z" fill="url(#g)" filter="url(#b)"/><path d="M2,17C16,8 30,5 46,10C30,10 16,13 2,17Z" fill="#a8dce8" opacity=".5" filter="url(#b)"/>', 48, 22);

  // ── its motion: the whole ray, turning about its middle; a wing flap is the span stretching/narrowing
  //    along its own axis; the mist follows a beat behind
  const rise = curve([[0, 0], [880, -1, 'in'], [1010, 0.5, 'out'], [1300, 1], [1700, 0.3], [2100, -0.15], [2600, 0.1], [3300, 0]]);
  const span = curve([[0, 1], [500, 0.9], [880, 0.78, 'in'], [1000, 1.12, 'out'], [1300, 1.1], [1650, 0.86], [2000, 1.06], [2450, 0.93], [2900, 1.02], [3300, 1]]);
  const bank = curve([[0, 0], [880, -5 * 1, 'in'], [1010, 13, 'out'], [1300, 10], [1800, -3], [2400, 1], [3300, 0]]);
  const dive = curve([[0, 0], [880, -0.3, 'in'], [1050, 1, 'out'], [1350, 1.05], [1900, 0.3], [2700, 0], [3300, 0]]);
  const DX = Math.max(-1, Math.min(1, (T[0] - C[0]) / 120)), DY = Math.max(-0.5, Math.min(1, (T[1] - C[1]) / 90));
  const W = (t, dl = 0) => {
    const tt = Math.max(0, t - dl), s = span(tt) + (dl ? 0.04 * (span(tt) - 1) : 0), d = dive(tt), r = rise(tt);
    const A = mul(rot(AX, C[0], C[1]), mul(scl(s, 1, C[0], C[1]), rot(-AX, C[0], C[1])));
    return mul(tr(DX * 12 * d, r * 7 + DY * 7 * Math.max(0, d)), mul(rot(side * bank(tt), C[0], C[1]), A));
  };
  h.drive(ray, C, (t) => W(t), 3300);
  h.drive(eyes, C, (t) => W(t), 3300);
  h.drive(mist, C, (t) => W(t, 110), 3300);

  // ── light: a cool glow gathers along the striking wing, the sea takes it
  fx(k.lightIn('g-sea', [170, 150], 300, 100, { under: true }), [[400, { opacity: 0 }, 'ease-out'], [1000, { opacity: 0.35 }, eio], [1400, { opacity: 0.55 }, eio], [2400, { opacity: 0.25 }, eio], [3300, { opacity: 0 }]]);
  h.ride(k.light('g-sea', tip, 34), tip, (t) => W(t), [[300, 0.4, 0], [880, 1.0, 0.7], [1020, 1.5, 0.95], [1300, 1.2, 0.7], [1800, 0.6, 0.2], [2200, 0.4, 0]]);

  // ── gathering: mist and drops pulled in to the striking wing-tip from the cloud sea, and mist streaming off it
  for (let i = 0; i < 14; i++) {
    const t0 = 220 + i * 48 + rand() * 30, dur = 450 + rand() * 120, sz = 3 + rand() * 2.5, a = rand() * Math.PI * 2, r0 = 24 + rand() * 24;
    const from = [tip[0] + Math.cos(a) * r0 * 1.2, tip[1] + 10 + Math.sin(a) * r0 * 0.6], ks = [];
    for (let t = t0; ; t += 50) {
      const tt = Math.min(t, t0 + dur), f = (tt - t0) / dur, g = f * f * (3 - 2 * f), c = app(W(Math.min(tt, 3300)), tip);
      ks.push([tt, { transform: `${k.T(from[0] + (c[0] - from[0]) * g - from[0], from[1] + (c[1] - from[1]) * g - from[1])} scale(${(0.5 + 0.7 * Math.sin(Math.PI * f)).toFixed(2)})`, opacity: f > 0.95 ? 0 : f < 0.1 ? f * 10 : 1 }, 'linear']);
      if (tt >= t0 + dur) break;
    }
    fx(k.pic('drop', from, sz, sz), ks);
  }
  for (let i = 0; i < 6; i++) {
    const t0 = 300 + i * 120, p = app(W(t0), [tip[0] - side * (i % 2) * 6, tip[1] + 14 + i * 3]), r = Math.round(rand() * 360);
    fx(k.picIn('vapor', p, 20 + rand() * 8, 20 + rand() * 8, { lit: false }), [[t0, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 200, { transform: `rotate(${r + 15}deg) scale(.9)`, opacity: 0.55 }], [t0 + 900, { transform: `${k.T(-side * 6, 16)} rotate(${r + 40}deg) scale(1.6)`, opacity: 0 }]]);
  }

  // ── the strike (BEATS.release to .impact): a crescent of spray off the wing-tip, drops trailing
  const M = app(W(1050), tip), bz = h.arcPath(M, T, 12);
  const ang = (Math.atan2(T[1] - M[1], T[0] - M[0]) * 180) / Math.PI;
  for (let i = 0; i < 3; i++) {
    const t0 = 960 + i * 45, t1 = 1250 + i * 18, off = (i - 1) * 3;
    const bz2 = (f) => { const p = bz(f); return [p[0], p[1] + off * Math.sin(Math.PI * f)]; };
    h.fly(k.pic(blade, M, 26 - i * 4, 12 - i * 2), M, bz2, t0, t1, (f) => 0.6 + 0.5 * f, (f) => (f < 0.1 ? f * 8 : f > 0.94 ? 0.3 : 0.95 - i * 0.2), ang, 0, 40);
  }
  for (let i = 0; i < 22; i++) {
    const t0 = 970 + i * 14, t1 = 1230 + i * 10, id = i % 3, sz = [4, 14, 5][id], sd = (rand() - 0.5) * 10, r = Math.round(rand() * 360);
    const bz2 = (f) => { const p = bz(f); return [p[0], p[1] + sd * Math.sin(Math.PI * f) + 3 * f]; };
    h.fly(k.pic(id === 1 ? 'vapor' : 'drop', M, sz, sz, { lit: id !== 1 }), M, bz2, t0, t1, (f) => (id === 1 ? 0.5 + 0.8 * f : 1.2 - 0.5 * f), (f) => (f < 0.1 ? f * 8 : f > 0.94 ? 0.2 : id === 1 ? 0.6 : 0.95), r, 90, 50);
  }

  // ── it lands at T (BEATS.impact): a splash
  const IM = 1300;
  const fl = [[IM - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [IM + 200, { transform: 'scale(1.9)', opacity: 0.6 }]];
  for (let t = IM + 340, i = 0; t < IM + 800; t += 120, i++) fl.push([t, { transform: `scale(${i % 2 ? 1.4 : 1.15})`, opacity: i % 2 ? 0.5 : 0.35 }, eio]);
  fl.push([IM + 1200, { transform: 'scale(.9)', opacity: 0 }]);
  fx(k.light('g-sea', T, 64), fl);
  fx(k.light('g-sea', T, 22), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 30, { transform: 'scale(1.6)', opacity: 1 }], [IM + 170, { transform: 'scale(2.6)', opacity: 0 }]]);
  fx(k.pic(ringSvg, [T[0], T[1] + 3], 66, 66), [[IM, { transform: 'scale(.15, .07)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(.4, .2)', opacity: 0.95 }, 'ease-out'], [IM + 450, { transform: 'scale(1.1, .5)', opacity: 0 }]]);
  fx(k.pic(ringSvg, [T[0], T[1] + 3], 66, 66), [[IM + 100, { transform: 'scale(.1, .05)', opacity: 0 }, 'ease-out'], [IM + 160, { transform: 'scale(.3, .14)', opacity: 0.6 }, 'ease-out'], [IM + 580, { transform: 'scale(.85, .38)', opacity: 0 }]]);
  // a crown of drops thrown up, arcing down
  for (let i = 0; i < 22; i++) {
    const a = -Math.PI * (0.1 + rand() * 0.8), v = 18 + rand() * 36, t = IM + rand() * 50, life = 520 + rand() * 340, sz = 3 + rand() * 3.5;
    const px = (f) => Math.cos(a) * v * f, py = (f) => Math.sin(a) * v * f + 46 * f * f;
    const ks = [0, 0.3, 0.65, 1].map((f, j) => [t + life * f, { transform: `${k.T(px(f), py(f))} scale(${(1 - 0.5 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']);
    fx(k.pic('drop', T, sz, sz), ks);
  }
  // mist billowing off the splash
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + rand() * 0.4, d = 14 + rand() * 20, t = IM + rand() * 50, r = Math.round(rand() * 360), sz = 16 + rand() * 10;
    fx(k.pic('vapor', [T[0] + Math.cos(a) * 3, T[1] + 3], sz, sz, { lit: false }), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 150, { transform: `${k.T(Math.cos(a) * d * 0.5, Math.sin(a) * d * 0.3)} rotate(${r + 15}deg) scale(1)`, opacity: 0.75 }, 'ease-out'], [t + 1000, { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d * 0.5 - 10)} rotate(${r + 40}deg) scale(1.9)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 4; i++) {
    const t = IM + 120 + i * 140;
    fx(k.pic('vapor', [T[0] + (rand() - 0.5) * 12, T[1]], 20 + rand() * 6, 20 + rand() * 6, { lit: false }), [[t, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t + 300, { transform: `${k.T(-2, -12)} scale(1)`, opacity: 0.6 }], [t + 1300, { transform: `${k.T(-6, -42)} scale(2)`, opacity: 0 }]]);
  }

  // ── after: it sweeps back up beating slowly, shedding mist from the tips
  for (let i = 0; i < 9; i++) {
    const t = 1500 + i * 150 + rand() * 60, tp = i % 2 ? k.spec.emit : k.spec.tipL, p = app(W(Math.min(t, 3300)), tp), r = Math.round(rand() * 360);
    fx(k.picIn('vapor', p, 12 + rand() * 7, 12 + rand() * 7, { lit: false }), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 160, { transform: `rotate(${r + 15}deg) scale(.9)`, opacity: 0.55 }], [t + 1000, { transform: `${k.T((rand() - 0.5) * 8, 14 + rand() * 8)} rotate(${r + 40}deg) scale(1.7)`, opacity: 0 }]]);
  }
}
