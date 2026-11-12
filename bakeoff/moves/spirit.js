// Spirit: the little winged child of light gathers a star between its hands and throws it.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker (as suggested: it is a 1/1
// creature that strikes), element spirit (white-gold light).
//   0-950     gather: it draws back from its target, rising a little, wings swept up and back;
//             motes of dawn light stream in from all around into a star that swells between
//             its open hands; its halo brightens and widens.
//   1000      RELEASE: it throws itself toward T, wings snapping forward and down, and the
//             star leaves its hands trailing a comet of light.
//   1350      IMPACT at T: a flash, two rings and a burst of rays, motes flung and spiralling,
//             a soft glow that lingers and drifts up.
//   1400-3000 follow-through: it rocks back from the throw, the wings flutter three times
//             (smaller each time) and the halo shimmers, then everything eases back; at rest
//             as drawn from 3100 (END 3600).
// Aimed: T = k.aim || [236, 142] (the low dawn light on its right). It leans and lunges toward
// T whichever side that is; the star leaves from emit (between its hands, carried by the same
// transforms as the child) and goes to T.
import { mul, rot, scl, tr, app, curve, kit } from './_fx.js';
export const END = 3600;
export const BEATS = { release: 1000, impact: 1350, settle: 3100 };
export const STILLS = [350, 800, 1000, 1150, 1360, 1700, 2300, 3300];
export const textures = {
  mote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 246, 214, Math.min(1, c * c * c * 2.4)]; }],
  star: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); const ax = Math.abs(x - 0.5) * 2, ay = Math.abs(y - 0.5) * 2, ray = Math.max(0, 1 - Math.min(ax, ay) * 9) * Math.max(0, 1 - Math.max(ax, ay)); return [255, 244 + 10 * c, 205 + 40 * c * c, Math.min(1, c * c * c * 1.6 + ray * 0.8)]; }],
};

export function build(k) {
  const { fx, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const wingL = k.part('wingL'), wingR = k.part('wingR'), child = k.part('child'), halo = k.part('halo');
  const E = k.spec.emit, FEET = [150, 118], SHL = [146, 98], SHR = [154, 98], HALO = [150, 69];
  const T = k.aim || [236, 142];
  const dx = T[0] - E[0], dy = T[1] - E[1], len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
  const side = Math.abs(ux) < 0.15 ? 0 : Math.sign(ux); // which way it leans

  // ── the child: draws back and up, then throws itself toward T, rocks back and settles
  const lunge = curve([[0, 0], [500, -0.35], [940, -0.6, 'in'], [1080, 1, 'out'], [1350, 0.8], [1700, -0.2], [2200, 0.08], [2900, 0]]);
  const bob = curve([[0, 0], [500, -2.5], [940, -4, 'in'], [1080, -1], [1500, 1.2], [2000, -0.8], [2600, 0.2], [3100, 0]]);
  const lean = curve([[0, 0], [500, -3], [940, -6, 'in'], [1080, 9, 'out'], [1350, 6], [1700, -2], [2300, 0.8], [3000, 0]]);
  const WC = (t) => {
    const L = lunge(t), d = L * (L < 0 ? 5 : 11);
    return mul(tr(ux * d, uy * d * 0.5 + bob(t)), rot(side * lean(t), FEET[0], FEET[1]));
  };
  // wings: swept up and back while it gathers, snapped down and forward on the throw, then three flutters
  const flap = (t) => {
    let a = curve([[0, 0], [500, 14], [940, 22, 'in'], [1060, -26, 'out'], [1250, -14], [1500, 4], [3000, 0]])(t);
    for (const [t0, A] of [[1450, 10], [1750, 7], [2050, 4]]) if (t > t0 && t < t0 + 500) a += A * Math.sin(((t - t0) * 2 * Math.PI) / 300) * (1 - (t - t0) / 500);
    return a;
  };
  const WL = (t) => mul(WC(t), rot(flap(t), SHL[0], SHL[1])); // the left wing: clockwise lifts its tip
  const WR = (t) => mul(WC(t), rot(-flap(t), SHR[0], SHR[1]));
  const pulse = curve([[0, 1], [900, 1.35], [1060, 1.6, 'out'], [1400, 1.2], [2000, 1.1], [2800, 1]]); // the halo widens
  const WH = (t) => mul(WC(t), scl(pulse(t), pulse(t) * 0.9 + 0.1, HALO[0], HALO[1]));
  h.drive(child, [150, 104], WC, 3100);
  h.drive(wingL, SHL, WL, 3100);
  h.drive(wingR, SHR, WR, 3100);
  h.drive(halo, [150, 80], WH, 3100);

  // ── the star between its hands, swelling as it gathers, and a glow around the child
  const M0 = app(WC(1050), E);
  const star = k.pic('star', E, 22, 22), starGlow = k.light('g-heal', E, 38);
  const sk = [[250, { transform: 'scale(.1)', opacity: 0 }, 'ease-out']], gk = [[250, { transform: 'scale(.1)', opacity: 0 }, 'ease-out']];
  const wob = (t) => app(WC(t), E);
  for (let t = 400; t <= 1000; t += 60) {
    const p = wob(t), f = Math.min(1, (t - 250) / 750), g = f * f * (3 - 2 * f);
    sk.push([t, { transform: `${k.T(p[0] - E[0], p[1] - E[1])} scale(${(0.2 + 0.9 * g + 0.06 * Math.sin(t / 55)).toFixed(2)}) rotate(${Math.round(t / 6)}deg)`, opacity: 1 }, 'linear']);
    gk.push([t, { transform: `${k.T(p[0] - E[0], p[1] - E[1])} scale(${(0.25 + 1.1 * g).toFixed(2)})`, opacity: +(0.2 + 0.75 * g).toFixed(2) }, 'linear']);
  }
  sk.push([1070, { transform: `${k.T(M0[0] - E[0], M0[1] - E[1])} scale(1.5) rotate(180deg)`, opacity: 1 }, 'ease-out'], [1120, { transform: `${k.T(M0[0] - E[0], M0[1] - E[1])} scale(1.1) rotate(200deg)`, opacity: 0 }]);
  gk.push([1070, { transform: `${k.T(M0[0] - E[0], M0[1] - E[1])} scale(1.9)`, opacity: 1 }, 'ease-out'], [1500, { transform: `${k.T(M0[0] - E[0], M0[1] - E[1])} scale(1.1)`, opacity: 0 }]);
  fx(star, sk);
  fx(starGlow, gk);
  // the whole child glows with the effort
  fx(k.light('g-heal', [150, 98], 120), [[150, { opacity: 0 }, 'ease-out'], [950, { opacity: 0.55 }, eio], [1100, { opacity: 0.85 }, eio], [1800, { opacity: 0.35 }, eio], [2800, { opacity: 0 }]]);

  // ── gathering: motes of dawn light stream in from all round to its hands
  for (let i = 0; i < 20; i++) {
    const t0 = 150 + i * 40 + rand() * 30, dur = 480 + rand() * 140, sz = 3 + rand() * 3, a = rand() * Math.PI * 2, r0 = 40 + rand() * 40;
    const from = [E[0] + Math.cos(a) * r0 * 1.3, E[1] + Math.sin(a) * r0 * 0.8 + 6], ks = [];
    for (let t = t0; t <= t0 + dur + 1; t += 50) {
      const f = Math.min(1, (t - t0) / dur), g = f * f * (3 - 2 * f), c = app(WC(Math.min(t, 3100)), E), sp = (1 - g) * 0.4 * Math.sin(f * 7 + i);
      ks.push([Math.min(t, t0 + dur), { transform: `${k.T((c[0] - from[0]) * g + sp * 6, (c[1] - from[1]) * g)} scale(${(0.5 + 0.8 * Math.sin(Math.PI * f)).toFixed(2)})`, opacity: f > 0.95 ? 0 : f < 0.1 ? f * 10 : 1 }, 'linear']);
    }
    fx(k.pic('mote', from, sz, sz), ks);
  }

  // ── the throw (1000 - 1350): the star flies to T trailing a comet of light
  const bz = h.arcPath(M0, T, 9 + Math.min(14, len * 0.08));
  fx(k.pic('star', M0, 24, 24), [[1040, { transform: 'scale(.4) rotate(0deg)', opacity: 0 }, 'ease-out'], ...[0, 0.2, 0.4, 0.6, 0.8, 1].map((f, i) => {
    const p = bz(f * f * 0.5 + f * 0.5);
    return [1070 + f * 280, { transform: `${k.T(p[0] - M0[0], p[1] - M0[1])} scale(${(1.3 - 0.2 * f).toFixed(2)}) rotate(${Math.round(f * 200)}deg)`, opacity: i === 5 ? 0.9 : 1 }, 'linear'];
  }), [1420, { transform: `${k.T(T[0] - M0[0], T[1] - M0[1])} scale(1.5) rotate(240deg)`, opacity: 0 }]]);
  for (let i = 0; i < 16; i++) {
    const t0 = 1060 + i * 17, t1 = 1330 + i * 16 + rand() * 20, sz = [8, 4, 11][i % 3], sd = (rand() - 0.5) * 7;
    const bz2 = (f) => { const p = bz(f); return [p[0], p[1] + sd * Math.sin(Math.PI * f)]; };
    h.fly(k.pic('mote', M0, sz, sz), M0, bz2, t0, t1, (f) => 1.1 - 0.7 * f, (f) => (f < 0.1 ? f * 9 : 0.9 * (1 - f * 0.5)), 0, 0, 50, (f) => f * f * 0.5 + f * 0.5);
  }

  // ── the strike (1350): flash, rings, rays, flung motes, a glow that lingers and lifts
  const IM = 1350;
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#fff4d0" stroke-width="5" filter="url(#b)"/>', 100, 100);
  const rays = k.svg('<defs><radialGradient id="r" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbe8"/><stop offset="1" stop-color="#ffd77a" stop-opacity="0"/></radialGradient></defs>' +
    Array.from({ length: 8 }, (_, i) => `<path d="M50,50 L${(50 + 48 * Math.cos((i * Math.PI) / 4 - 0.07)).toFixed(1)},${(50 + 48 * Math.sin((i * Math.PI) / 4 - 0.07)).toFixed(1)} L${(50 + 48 * Math.cos((i * Math.PI) / 4 + 0.07)).toFixed(1)},${(50 + 48 * Math.sin((i * Math.PI) / 4 + 0.07)).toFixed(1)}Z" fill="url(#r)"/>`).join(''), 100, 100);
  const flash = [[IM - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [IM + 250, { transform: 'scale(1.9)', opacity: 0.6 }]];
  for (let t = IM + 450, i = 0; t < IM + 900; t += 140, i++) flash.push([t, { transform: `scale(${i % 2 ? 1.5 : 1.25})`, opacity: i % 2 ? 0.5 : 0.38 }, eio]);
  flash.push([IM + 1300, { transform: 'scale(1)', opacity: 0 }]);
  fx(k.light('g-heal', T, 60), flash);
  fx(k.light('g-warm', T, 22), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.6)', opacity: 1 }], [IM + 200, { transform: 'scale(2.6)', opacity: 0 }]]);
  fx(k.pic(ring, T, 56, 56), [[IM, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(.4)', opacity: 0.95 }, 'ease-out'], [IM + 520, { transform: 'scale(1.1)', opacity: 0 }]]);
  fx(k.pic(ring, T, 56, 56), [[IM + 110, { transform: 'scale(.1)', opacity: 0 }, 'ease-out'], [IM + 170, { transform: 'scale(.3)', opacity: 0.6 }, 'ease-out'], [IM + 640, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.pic(rays, T, 54, 54), [[IM - 10, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [IM + 80, { transform: 'scale(.95) rotate(12deg)', opacity: 0.95 }, 'ease-out'], [IM + 650, { transform: 'scale(1.35) rotate(40deg)', opacity: 0 }]]);
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + rand() * 0.4, d = 14 + rand() * 20, t = IM + rand() * 40, life = 600 + rand() * 500, sz = 3 + rand() * 3.5, spin = (i % 2 ? 1 : -1) * 0.5;
    const px = (f) => Math.cos(a + spin * f) * d * (0.3 + f), py = (f) => Math.sin(a + spin * f) * d * 0.75 * (0.3 + f) - 10 * f * f;
    const ks = [0, 0.25, 0.6, 1].map((f, j) => [t + life * f, { transform: `${k.T(px(f), py(f))} scale(${(1.1 - 0.7 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']);
    fx(k.pic('mote', T, sz, sz), ks);
  }
  // a few motes left, rising from T
  for (let i = 0; i < 7; i++) {
    const t = IM + 300 + i * 100 + rand() * 60, p = [T[0] + (rand() - 0.5) * 22, T[1] + 4 + rand() * 6];
    fx(k.pic('mote', p, 4, 4), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 150, { transform: 'scale(1)', opacity: 1 }], [t + 1000, { transform: `${k.T((rand() - 0.5) * 8, -26 - rand() * 12)} scale(.3)`, opacity: 0 }]]);
  }

  // ── after: a shimmer of motes falls from its wings as they flutter
  for (let i = 0; i < 10; i++) {
    const t = 1450 + i * 120 + rand() * 60, p = [150 + (rand() < 0.5 ? -1 : 1) * (14 + rand() * 30), 74 + rand() * 40];
    fx(k.pic('mote', p, 4, 4), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 120, { transform: 'scale(1)', opacity: 1 }], [t + 900, { transform: `${k.T((rand() - 0.5) * 8, 14 + rand() * 12)} scale(.3)`, opacity: 0 }]]);
  }
}
