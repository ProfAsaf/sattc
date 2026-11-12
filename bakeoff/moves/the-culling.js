// The Culling (a spell, an attacker: "Destroy every creature with 2 or less Power": the spell is the scythe, and
// the sweep). The giant scythe of violet light draws back and up, its blade charging with light while the souls
// of those already cut stir and are drawn up; then it sweeps down and through the field to the left, fast, and
// the people standing ahead of its blade come apart into wisps as it passes. A crescent of reaping light is
// let go from the blade's tip and flies to T, where it bursts: a flash, rings, wisps of the dissolved lifting
// away. The scythe follows through and eases back; the swath's light dies down; the people re-form from the
// dust, and everything is as drawn.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker (as suggested: the spell is the attack), element
// spirit (as suggested: souls and wisps). T = k.aim, else the three people at the left (`stand`), so alone the
// wave goes to them as the blade does. The scythe turns about its grip (the peg on the handle): lifted back to
// the right, then swept left through the field. The crescent leaves from the tip as it passes `release` and
// turns to face T whichever side it is on. Everything that flies or lands is on the overlay (k.pic, k.light),
// since T may be on another card; the people of the picture are parts, and dissolve as the tip passes them.
//   0-780    GATHER: the scythe lifts back, its blade charging with light; ghosts stir, motes rise to it.
//   780-1000 SWEEP: the scythe slashes down and left through the field; RELEASE 900 the crescent leaves the tip.
//   1150     IMPACT: the crescent lands at T: flash, rings, wisps; the people at the left have come apart by now.
//   1000-2600 follow-through: the scythe eases back, the wisps lift and fade, the swath's light dies down.
//   2900-3500 the people re-form; the scythe is at rest; SETTLE 3700.
import { mul, rot, tr, app, curve, kit } from './_fx.js';

export const END = 4200;
export const BEATS = { release: 900, impact: 1150, settle: 3700 };
export const STILLS = [350, 760, 920, 1050, 1250, 1700, 2600, 3900];

export const textures = {
  mote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [214 + 40 * c, 188 + 60 * c, 255, Math.min(1, c * c * 2.4)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const F = kit(k), { drive, ride } = F;
  const S = k.spec, E = S.emit, G = S.grip, BL = S.blade;
  const T = k.aim || S.stand;
  const REL = BEATS.release, IM = BEATS.impact, BACK = BEATS.settle;
  const tidy = (l) => l.filter((q, i) => i === 0 || q[0] > l[i - 1][0]);
  const deg = (r) => (r * 180) / Math.PI;

  // ── the scythe: lifted back, swept left through the field, eased home
  const dx = curve([[0, 0], [300, 9, 'out'], [780, 40, 'in'], [1000, -32, 'out'], [1300, -40], [1900, -26], [2700, -6], [3400, 0]]);
  const dy = curve([[0, 0], [300, -6, 'out'], [780, -28, 'in'], [1000, 3, 'out'], [1300, 5], [1900, 3], [2700, 1], [3400, 0]]);
  const rr = curve([[0, 0], [300, 2, 'out'], [780, 8, 'in'], [1000, -5, 'out'], [1300, -7], [1900, -4], [2700, -1], [3400, 0]]);
  const Wsc = (t) => mul(tr(dx(t), dy(t)), rot(rr(t), G[0], G[1]));
  drive(k.part('scythe'), G, Wsc, 3500);
  const TIP = (t) => app(Wsc(t), E);
  // the ghosts and wisps of those already cut stir with it, and thin as it passes
  for (const nm of ['ghosts', 'wisps']) {
    const w = nm === 'wisps';
    act(k.part(nm), [[0, { transform: 'none', opacity: 1 }, eio], [780, { transform: `${k.T(-1, -2)} scale(1.02, 1.05)`, opacity: 1 }, 'ease-in'], [1000, { transform: `${k.T(-3, -3)} scale(1.04, 1.1)`, opacity: 1 }, 'ease-out'],
      [1500, { transform: `${k.T(-5, -w ? 8 : 3)} scale(1.05, ${w ? 1.2 : 1.06})`, opacity: 0.55 }, eio], [2400, { transform: `${k.T(-2, -w ? 4 : 1)} scale(1.02, 1.05)`, opacity: 0.8 }, eio], [3300, { transform: 'none', opacity: 1 }]]);
  }

  // ── the blade charges; the swath and the spared giant catch its light
  ride(k.lightIn('g-violet', BL, 200, 46), BL, Wsc, [[100, 0.6, 0], [780, 1.1, 0.5], [REL, 1.25, 0.65], [1150, 1.1, 0.5], [1600, 1, 0.3], [2300, 0.8, 0.12], [3000, 0.7, 0]]);
  fx(k.lightIn('g-violet', S.swath, 240, 54), tidy([[760, { transform: 'scale(.7)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(1)', opacity: 0.5 }, eio], [1700, { transform: 'scale(1.05)', opacity: 0.35 }, eio], [2700, { transform: 'scale(1.1)', opacity: 0.1 }, eio], [3400, { transform: 'scale(1.1)', opacity: 0 }]]));
  fx(k.lightIn('g-violet', [S.giant[0], S.giant[1] - 6], 44, 80), tidy([[780, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [980, { transform: 'scale(1)', opacity: 0.8 }, eio], [1400, { transform: 'scale(1.05)', opacity: 0.3 }, eio], [2000, { transform: 'scale(1.1)', opacity: 0 }]]));
  // souls drawn up toward the lifted blade
  for (let i = 0; i < 12; i++) {
    const x = 84 + rand() * 190, y = 150 + rand() * 18, t0 = 100 + i * 55 + rand() * 40, sz = 2.6 + rand() * 3;
    fx(k.picIn('mote', [x, y], sz, sz), [[t0, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t0 + 120, { transform: 'scale(1)', opacity: 0.9 }, 'linear'], [t0 + 650, { transform: `${k.T((rand() - 0.5) * 8, -20 - rand() * 12)} scale(.4)`, opacity: 0 }]]);
  }

  // ── the people ahead of the blade come apart as its tip passes them
  const wispSvg = k.svg('<defs><linearGradient id="w" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#9b6bff"/><stop offset=".6" stop-color="#e6d6ff"/><stop offset="1" stop-color="#ffffff"/></linearGradient><filter id="b" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation=".9"/></filter></defs><path d="M4,27C4,16 10,8 25,3C17,10 15,18 14,27Z" fill="#9b6bff" filter="url(#b)" opacity=".8"/><path d="M4,27C4,16 10,8 25,3C17,10 15,18 14,27Z" fill="url(#w)"/>', 28, 30);
  const wisp = (x, y, t0, life, sc, lean) => {
    const r = Math.round((rand() - 0.5) * 24);
    fx(k.picIn(wispSvg, [x, y], 12 * sc, 13 * sc, { base: true }), [[t0, { transform: `rotate(${r}deg) scale(.4, .2)`, opacity: 0 }, 'ease-out'], [t0 + 160, { transform: `${k.T(lean * 0.2, -4)} rotate(${r}deg) scale(1, 1)`, opacity: 0.95 }, 'ease-out'],
      [t0 + life * 0.6, { transform: `${k.T(lean * 0.7, -18)} rotate(${r - 8}deg) scale(.9, 1.3)`, opacity: 0.6 }, 'linear'], [t0 + life, { transform: `${k.T(lean, -30)} rotate(${r - 16}deg) scale(.5, 1.6)`, opacity: 0 }]]);
  };
  S.folk.forEach(([fx0, fy0], i) => {
    let td = 900;
    for (let t = 700; t < 1400; t += 10) { if (TIP(t)[0] < fx0 + 18) { td = t; break; } }
    const hid = { transform: `${k.T(-3, -10)} scale(.9, 1.2)`, opacity: 0 };
    act(k.part(`folk${i}`), [[0, { transform: 'none', opacity: 1 }, 'ease-in'], [td - 50, { transform: 'none', opacity: 1 }, 'ease-in'], [td + 70, { transform: `${k.T(-1.5, 0)} scale(1.03, .98) skewX(-6deg)`, opacity: 0.85 }, 'linear'], [td + 400, hid, 'linear'],
      [2900 + i * 130, { transform: `${k.T(0, 3)} scale(1, .85)`, opacity: 0 }, 'ease-out'], [3480 + i * 70, { transform: 'none', opacity: 1 }]]);
    for (let j = 0; j < 3; j++) wisp(fx0 + (j - 1) * 4 + (rand() - 0.5) * 3, fy0 - 6 - j * 4, td + 40 + j * 90, 1100 + rand() * 300, 0.9 + rand() * 0.5, -6 - rand() * 6);
    for (let j = 0; j < 5; j++) {
      const x = fx0 + (rand() - 0.5) * 12, y = fy0 - 8 - rand() * 12, t0 = td + 30 + rand() * 260, sz = 2.4 + rand() * 3;
      fx(k.pic('mote', [x, y], sz, sz), [[t0, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t0 + 100, { transform: 'scale(1)', opacity: 0.95 }, 'linear'], [t0 + 800, { transform: `${k.T(-6 - rand() * 10, -14 - rand() * 18)} scale(.4)`, opacity: 0 }]]);
    }
    // re-forming: a soft light and motes sinking back
    fx(k.lightIn('g-heal spirit', [fx0, fy0 - 10], 28, 36), [[2900 + i * 130, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [3250 + i * 100, { transform: 'scale(1)', opacity: 0.85 }, eio], [3700 + i * 40, { transform: 'scale(1.2)', opacity: 0 }]]);
    for (let j = 0; j < 4; j++) {
      const x = fx0 + (rand() - 0.5) * 16, t0 = 2850 + i * 130 + j * 70 + rand() * 40, sz = 2.4 + rand() * 2.4;
      fx(k.pic('mote', [x, fy0 - 30 - rand() * 8], sz, sz), [[t0, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t0 + 100, { transform: 'scale(1)', opacity: 0.9 }, 'linear'], [t0 + 520, { transform: `${k.T((fx0 - x) * 0.5, 22 + rand() * 6)} scale(.4)`, opacity: 0 }]]);
    }
  });

  // ── the reaping wave (RELEASE to IMPACT): a crescent of light let go from the tip, flying to T
  const tip0 = TIP(REL), ddx = T[0] - tip0[0], ddy = T[1] - tip0[1], dist = Math.hypot(ddx, ddy), face = deg(Math.atan2(ddy, ddx)) - 180;
  const P = 'M60,12C48,3 24,4 2,25C20,16 42,12 58,18Z';
  const crescent = k.svg(`<defs><linearGradient id="w" x1="1" x2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#d9c2ff"/><stop offset="1" stop-color="#8a5cf0"/></linearGradient><filter id="b" x="-20%" y="-30%" width="140%" height="170%"><feGaussianBlur stdDeviation="1.5"/></filter></defs><path d="${P}" fill="#9b6bff" filter="url(#b)" opacity=".9"/><path d="${P}" fill="url(#w)"/>`, 64, 30);
  const fly = (el, lag, scale0, scale1, op) => {
    const ks = [];
    for (let j = 0; j <= 6; j++) {
      const f = j / 6, e = f * f * 0.45 + f * 0.55, s = scale0 + (scale1 - scale0) * f;
      ks.push([REL + lag + (IM - REL) * f, { transform: `${k.T(ddx * e, ddy * e)} rotate(${face.toFixed(1)}deg) scale(${s.toFixed(2)}, ${(s * 0.9).toFixed(2)})`, opacity: j === 0 ? 0 : op * (j === 1 ? 0.8 : 1) }, 'linear']);
    }
    ks.push([IM + lag + 220, { transform: `${k.T(ddx, ddy)} rotate(${face.toFixed(1)}deg) scale(${(scale1 * 1.5).toFixed(2)}, ${(scale1 * 1.1).toFixed(2)})`, opacity: 0 }]);
    fx(el, ks);
  };
  const cw = Math.min(26, 16 + dist * 0.06);
  fly(k.pic(crescent, tip0, cw, cw * 0.47), 0, 0.7, 1.3, 1);
  fly(k.pic(crescent, tip0, cw, cw * 0.47), 70, 0.55, 1.05, 0.55);
  fly(k.pic(crescent, tip0, cw, cw * 0.47), 140, 0.45, 0.85, 0.3);
  for (let i = 0; i < 8; i++) {
    const f0 = 0.12 + i * 0.1, t0 = REL + (IM - REL) * f0 * 0.9, sz = 3 + rand() * 3, e = f0 * f0 * 0.45 + f0 * 0.55;
    fx(k.pic('mote', tip0, sz, sz), [[t0, { transform: `${k.T(ddx * e, ddy * e)} scale(.5)`, opacity: 0 }, 'ease-out'], [t0 + 80, { transform: `${k.T(ddx * e, ddy * e)} scale(1)`, opacity: 0.95 }, 'linear'], [t0 + 600, { transform: `${k.T(ddx * e + (rand() - 0.5) * 10, ddy * e + 10 + rand() * 10)} scale(.4)`, opacity: 0 }]]);
  }

  // ── IMPACT at T: a flash, the crescent bursting wide, two rings, wisps lifting away, motes thrown
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#9b6bff" stroke-width="6" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#efe4ff" stroke-width="1.4"/>', 100, 100);
  fx(k.light('g-violet', T, 56), tidy([[IM - 50, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(1.25)', opacity: 1 }, eio], [IM + 350, { transform: 'scale(.95)', opacity: 0.6 }, eio], [IM + 900, { transform: 'scale(.8)', opacity: 0.35 }, eio], [IM + 1400, { transform: 'scale(.6)', opacity: 0 }]]));
  fx(k.pic(crescent, T, 44, 21), [[IM - 20, { transform: `rotate(${face.toFixed(1)}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [IM + 60, { transform: `rotate(${face.toFixed(1)}deg) scale(1)`, opacity: 1 }, 'ease-out'], [IM + 380, { transform: `rotate(${(face - 14).toFixed(1)}deg) scale(1.5)`, opacity: 0 }]]);
  for (let i = 0; i < 2; i++) { const t0 = IM + i * 150; fx(k.pic(ring, T, 38, 38), [[t0, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [t0 + 70, { transform: 'scale(.5)', opacity: 0.9 }], [t0 + 700, { transform: 'scale(1.6)', opacity: 0 }]]); }
  for (let i = 0; i < 5; i++) {
    const r = Math.round((rand() - 0.5) * 30), t0 = IM + 60 + i * 110, sx = T[0] + (i - 2) * 6 + (rand() - 0.5) * 4;
    fx(k.pic(wispSvg, [sx, T[1] + 6], 12, 13, { base: true }), [[t0, { transform: `rotate(${r}deg) scale(.4, .2)`, opacity: 0 }, 'ease-out'], [t0 + 160, { transform: `${k.T(0, -4)} rotate(${r}deg) scale(1, 1)`, opacity: 0.95 }, 'ease-out'], [t0 + 700, { transform: `${k.T(-4, -20)} rotate(${r - 8}deg) scale(.9, 1.3)`, opacity: 0.6 }, 'linear'], [t0 + 1300, { transform: `${k.T(-9, -36)} rotate(${r - 16}deg) scale(.5, 1.6)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI * (0.05 + rand() * 0.9), sp = 10 + rand() * 20, t0 = IM + rand() * 50, life = 400 + rand() * 350, sz = 2.6 + rand() * 3.2;
    const px = (f) => Math.cos(a) * sp * f * u, py = (f) => (Math.sin(a) * sp * f + 26 * f * f) * u;
    fx(k.pic('mote', T, sz, sz), [0, 0.35, 0.7, 1].map((f, j) => [t0 + life * f, { transform: `translate(${px(f).toFixed(1)}px, ${py(f).toFixed(1)}px) scale(${(1 - 0.7 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 0.95 }, j ? 'linear' : 'ease-out']));
  }
}
