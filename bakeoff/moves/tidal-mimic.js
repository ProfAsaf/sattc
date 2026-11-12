// Tidal Mimic: the half-formed water-knight in its tide pool. It is a mimic, so before it
// strikes it tries other shapes on: ghosts of itself swell wide, stretch thin and flicker out
// while its body goes loose and jellylike, the pool rippling round its feet. Then it settles
// on the knight, draws the sword back over its shoulder (a pale light gathering in the blade)
// and slashes: a crescent of water, drops trailing, leaves the blade's tip for T and bursts
// there in a splash. Its body wobbles like set jelly, its plume whipping, the arm swinging on
// and sinking back; ghosts of other shapes flicker once more, and it holds the knight again.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker (as suggested), element water.
//   0-820    GATHER: it turns toward T if T is on its right (through a sliver, mirrored), goes
//            loose (ghosts: a wide shape, a tall thin one, flickering), the pool rings out,
//            bubbles rise through it, the sword draws back and a light gathers on the blade.
//   960      RELEASE: the sword slashes down toward T (ghost swipes trailing it), body lunges,
//            and a crescent of water leaves the tip with drops trailing.
//   1340     IMPACT at T: flash, flat rings, a whirl, a crown of drops thrown up and arcing down.
//   1340-3300 follow-through: jelly wobble, plume whips, ghosts flicker, drops shed into the
//            pool, rings; the arm returns and everything settles. At rest as drawn from 3300.
// Aimed: T = k.aim || [48, 118] (the sea beyond the rock, where the sword points). The sword
// swings about the hand to point at T; the figure mirrors to face it if T is on its right.
import { mul, rot, scl, tr, app, curve, kit } from './_fx.js';
export const END = 3800;
export const BEATS = { release: 960, impact: 1340, settle: 3300 };
export const STILLS = [300, 700, 900, 1000, 1150, 1400, 2000, 3500];
export const textures = {
  glint: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226 + 29 * c, 252, 255, Math.min(1, c * c * 2.6)]; }],
  drop: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [210 + 45 * c, 248, 252, Math.min(1, c * 3)]; }],
  vapor: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, a = Math.max(0, 1 - r); const b = 0.92 + 0.08 * Math.sin(x * 16) * Math.cos(y * 12); return [214 * b, 240 * b, 246 * b, Math.min(1, a * a * 2) * 0.8]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const S = k.spec, F = S.feet, SH = S.shoulder, HD = S.hand, TIP = S.emit, AXIS = S.mid;
  const body = k.part('body'), plume = k.part('plume'), arm = k.part('arm'), sword = k.part('sword');
  const REL = BEATS.release, IM = BEATS.impact, BACK = BEATS.settle;
  k.css('.g-sea { border-radius: 50%; background: radial-gradient(circle, rgba(236,252,255,.92), rgba(170,226,236,.5) 32%, rgba(120,190,210,.16) 60%, rgba(110,180,200,0) 74%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><circle cx="50" cy="50" r="42" fill="none" stroke="#d4f6f6" stroke-width="5" filter="url(#b)"/><circle cx="50" cy="50" r="42" fill="none" stroke="#f4ffff" stroke-width="1.4"/>', 100, 100);
  const crescent = k.svg('<defs><filter id="b" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation=".9"/></filter><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#bfe8f0" stop-opacity="0"/><stop offset=".55" stop-color="#e8fbff"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs>' +
    '<path d="M4,3C20,6 34,12 40,20C34,28 20,34 4,37C16,29 18,11 4,3Z" fill="url(#g)" filter="url(#b)"/><path d="M8,6C22,9 33,14 38,20C33,26 22,31 8,34C18,27 19,13 8,6Z" fill="#ffffff" opacity=".7"/>', 44, 40);
  const bub = k.svg('<circle cx="20" cy="20" r="15" fill="rgba(180,240,244,.14)" stroke="#e8fffd" stroke-width="2.4"/><path d="M10,16A11,11 0 0 1 17,9" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>', 40, 40);
  let wd = '';
  for (let i = 0; i <= 40; i++) { const t = i / 40, a = t * 4.2 * Math.PI, r = 4 + 36 * (1 - t); wd += `${i ? 'L' : 'M'}${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`; }
  const whirl = k.svg(`<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2"/></filter></defs><path d="${wd}" fill="none" stroke="#bff0f0" stroke-width="6" stroke-linecap="round" filter="url(#b)"/><path d="${wd}" fill="none" stroke="#f6ffff" stroke-width="2" stroke-linecap="round"/>`, 100, 100);

  // ── where its slash goes: another card's point, else the sea beyond the rock on its sword side
  const T = k.aim || [48, 118];
  const mir = T[0] > AXIS + 1;                       // T on its right: it turns about to face it
  const side = mir ? -1 : 1;
  const sm = mir ? curve([[0, 1], [170, 1], [340, 0.06], [520, -1], [BACK - 260, -1], [BACK - 90, 0.06], [BACK + 90, 1]]) : () => 1;
  const MW = (t) => scl(sm(t), 1, AXIS, 0);          // the mirror (a world affine)
  const Tu = mir ? [2 * AXIS - T[0], T[1]] : T;      // T as seen from the unmirrored figure
  // the angle (clockwise from straight up) the blade must point at to point at T, from the hand
  let theta = (Math.atan2(Tu[0] - HD[0], HD[1] - Tu[1]) * 180) / Math.PI;
  theta = Math.max(-170, Math.min(150, theta));
  const wind = theta <= 0 ? 52 : -38;

  // ── its motion
  const sy = curve([[0, 1], [220, 0.985], [450, 1.04], [650, 0.975], [820, 0.945], [960, 1.06], [1100, 0.99], [IM, 0.965], [1560, 1.045], [1780, 0.985], [2000, 1.025], [2250, 0.995], [2550, 1.01], [2900, 0.998], [BACK, 1]]);
  const lean = curve([[0, 0], [260, 1], [560, -1], [820, 3.2], [960, -4.2], [1130, -1.4], [1420, 1.5], [1800, -0.6], [2300, 0.3], [BACK, 0]]);
  const rho = curve([[0, 0], [200, -4], [820, wind, 'in'], [1010, theta, 'out'], [1140, theta - 12, 'io'], [1420, theta + 3, 'io'], [1900, theta * 0.55, 'io'], [2600, theta * 0.12 - 3, 'io'], [BACK, 0]]);
  const Wb = (t) => { const s = sy(t), x = 1 + (1 - s) * 0.7; return mul(rot(lean(t), F[0], F[1]), scl(x, s, F[0], F[1])); };
  const Warm = (t) => mul(Wb(t), rot(rho(t) * 0.3, SH[0], SH[1]));
  const Wsword = (t) => mul(Warm(t), rot(rho(t) * 0.7, HD[0], HD[1]));
  const env = curve([[0, 0], [700, 0.25], [1000, 1], [1500, 0.8], [2300, 0.3], [BACK, 0]]);
  const Wplume = (t, dl = 0) => { const tt = Math.max(0, t - dl); return mul(Wb(t), rot(16 * env(tt) * Math.sin(tt / 62) + 8 * (lean(t) > 0 ? 1 : -1) * env(tt) * 0.4, 153, 53)); };
  const End = BACK + 160;
  h.drive(body, F, (t) => mul(MW(t), Wb(t)), End, 40);
  h.drive(plume, [153, 53], (t) => mul(MW(t), Wplume(t, 40)), End, 40);
  h.drive(arm, SH, (t) => mul(MW(t), Warm(t)), End, 30);
  h.drive(sword, HD, (t) => mul(MW(t), Wsword(t)), End, 30);
  const tipAt = (t) => app(mul(MW(t), Wsword(t)), TIP);

  // ── trying shapes on: ghosts of the body swell wide, stretch thin, flicker (a copy behind, a copy over)
  const ghost = (behind, forms, on) => {
    const g = k.copy('body', '', { behind });
    const o = curve(forms.map(([t, , , op]) => [t, op]));
    const sx = curve(forms.map(([t, x]) => [t, x])), sz = curve(forms.map(([t, , y]) => [t, y]));
    h.drive(g, F, (t) => mul(MW(t), mul(Wb(t), scl(sx(t), sz(t), F[0], F[1]))), End, 40, (t) => +o(t).toFixed(2));
  };
  ghost(true, [[0, 1, 1, 0], [180, 1, 1, 0], [330, 1.26, 0.94, 0.42], [470, 1.18, 0.97, 0.12], [600, 1.3, 0.92, 0.38], [820, 1.1, 0.98, 0.18], [940, 1.0, 1.0, 0], [1480, 1.0, 1.0, 0], [1620, 1.24, 0.95, 0.34], [1800, 1.12, 0.98, 0.1], [2000, 1.22, 0.94, 0.26], [2300, 1.04, 1, 0], [End, 1, 1, 0]]);
  ghost(false, [[0, 1, 1, 0], [280, 1, 1, 0], [430, 0.78, 1.12, 0.36], [560, 0.86, 1.07, 0.1], [700, 0.74, 1.14, 0.34], [900, 0.9, 1.04, 0.14], [1000, 1, 1, 0], [1560, 1, 1, 0], [1720, 0.8, 1.1, 0.3], [1900, 0.9, 1.05, 0.08], [2150, 0.84, 1.08, 0.2], [2450, 1, 1, 0], [End, 1, 1, 0]]);
  // swipes of the sword: copies lagging behind the slash
  for (let i = 1; i <= 3; i++) {
    const g = k.copy('sword', '', { behind: true });
    h.drive(g, HD, (t) => mul(MW(t), Wsword(t - i * 38)), End, 30, (t) => +(t > 840 && t < 1300 ? 0.55 / i * Math.min(1, (t - 840) / 120) * (t > 1140 ? Math.max(0, 1 - (t - 1140) / 160) : 1) : 0).toFixed(2));
  }

  // ── light: a glow in the body (loosening, flaring at the slash), a light riding the blade's tip
  const ch = app(MW(1000), [S.hit[0], S.hit[1] - 4]);
  fx(k.light('g-sea', ch, 80), [[150, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [700, { transform: 'scale(1)', opacity: 0.4 }, eio], [REL, { transform: 'scale(1.3)', opacity: 0.6 }, 'ease-out'], [IM + 200, { transform: 'scale(1.1)', opacity: 0.35 }, eio], [2500, { transform: 'scale(.9)', opacity: 0.2 }, eio], [BACK, { transform: 'scale(.7)', opacity: 0 }]]);
  h.ride(k.light('g-sea', TIP, 30), TIP, (t) => mul(MW(t), Wsword(t)), [[300, 0.3, 0], [820, 1.0, 0.75], [REL, 1.6, 0.95], [1200, 1.2, 0.6], [1700, 0.6, 0.2], [2100, 0.4, 0]]);
  fx(k.lightIn('g-sea', [150, 176], 190, 56, { under: true }), [[100, { opacity: 0 }, 'ease-out'], [800, { opacity: 0.4 }, eio], [IM, { opacity: 0.5 }, eio], [2300, { opacity: 0.2 }, eio], [BACK, { opacity: 0 }]]);

  // ── the pool: rings run out from its feet, bubbles rise through the body, drops shed into the pool
  const ringAt = (t0, sc, o, dur) => fx(k.picIn(ring, [150, 177], 40, 40), [[t0, { transform: 'scale(.35, .06)', opacity: 0 }, 'ease-out'], [t0 + 60, { transform: `scale(.5, ${(0.5 * 0.17).toFixed(3)})`, opacity: o }, 'ease-out'], [t0 + dur, { transform: `scale(${sc}, ${(sc * 0.17).toFixed(3)})`, opacity: 0 }]]);
  [[100, 2.0, 0.55, 1100], [380, 1.7, 0.5, 1000], [660, 2.2, 0.6, 1100], [900, 2.4, 0.7, 1200], [REL + 70, 2.5, 0.8, 1300], [IM + 60, 2.2, 0.6, 1300], [1700, 1.8, 0.45, 1100], [2150, 1.5, 0.35, 1000], [2600, 1.3, 0.25, 900]].forEach((q) => ringAt(...q));
  for (let i = 0; i < 11; i++) {
    const t0 = 120 + i * 95 + rand() * 40, x = 138 + rand() * 26, sz = 2.6 + rand() * 3.4, [wx, wy] = [x, 172];
    fx(k.picIn(bub, [wx, wy], sz, sz), [[t0, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 160, { transform: `${k.T((rand() - 0.5) * 3, -12)} scale(1)`, opacity: 0.85 }], [t0 + 900, { transform: `${k.T((rand() - 0.5) * 8, -46 - rand() * 40)} scale(1.1)`, opacity: 0 }]]);
  }
  // shimmer: glints sliding over the loosened body as it tries shapes
  for (let i = 0; i < 9; i++) {
    const t0 = 260 + i * 80 + rand() * 40, p = app(MW(t0), [136 + rand() * 30, 92 + rand() * 70]), sz = 6 + rand() * 5;
    fx(k.picIn('glint', p, sz, sz), [[t0, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t0 + 110, { transform: 'scale(1)', opacity: 0.9 }, eio], [t0 + 330, { transform: 'scale(.3)', opacity: 0 }]]);
  }
  for (let i = 0; i < 8; i++) {
    const t0 = 1500 + i * 120 + rand() * 60, p = app(MW(t0), [136 + rand() * 30, 92 + rand() * 70]), sz = 6 + rand() * 5;
    fx(k.picIn('glint', p, sz, sz), [[t0, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t0 + 110, { transform: 'scale(1)', opacity: 0.8 }, eio], [t0 + 330, { transform: 'scale(.3)', opacity: 0 }]]);
  }
  // water shaken loose by the slash and the jelly wobble running down it into the pool
  for (let i = 0; i < 10; i++) {
    const t0 = 1000 + i * 150 + rand() * 60, x = 138 + rand() * 26, y0 = 100 + rand() * 40, sd = (rand() - 0.5) * 10;
    const p0 = app(MW(t0), [x, y0]);
    fx(k.picIn('drop', p0, 3 + rand() * 2.5, 3 + rand() * 2.5), [[t0, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t0 + 80, { transform: `${k.T(0, 3)} scale(1)`, opacity: 0.95 }, 'ease-in'], [t0 + 430, { transform: `${k.T(sd, 176 - y0)} scale(.8)`, opacity: 0.9 }], [t0 + 470, { transform: `${k.T(sd, 177 - y0)} scale(.4)`, opacity: 0 }]]);
  }

  // ── gathering: drops drawn in to the blade's tip (it lifts, drawing the sword back)
  for (let i = 0; i < 13; i++) {
    const t0 = 260 + i * 44 + rand() * 30, dur = 450 + rand() * 120, sz = 3 + rand() * 2.5, a = rand() * Math.PI * 2, r0 = 22 + rand() * 24;
    const from = [TIP[0] + Math.cos(a) * r0 * 1.1, TIP[1] + 10 + Math.sin(a) * r0 * 0.7], ks = [];
    for (let t = t0; ; t += 50) {
      const tt = Math.min(t, t0 + dur), f = (tt - t0) / dur, g = f * f * (3 - 2 * f), c = tipAt(tt);
      ks.push([tt, { transform: `${k.T(from[0] + (c[0] - from[0]) * g - from[0], from[1] + (c[1] - from[1]) * g - from[1])} scale(${(0.5 + 0.7 * Math.sin(Math.PI * f)).toFixed(2)})`, opacity: f > 0.95 ? 0 : f < 0.1 ? f * 10 : 1 }, 'linear']);
      if (tt >= t0 + dur) break;
    }
    fx(k.pic('drop', from, sz, sz), ks);
  }

  // ── the slash (RELEASE to IMPACT): a crescent of water off the blade's tip, drops trailing
  const M = tipAt(REL + 30), bz = h.arcPath(M, T, 14);
  const ang = (Math.atan2(T[1] - M[1], T[0] - M[0]) * 180) / Math.PI;
  for (let i = 0; i < 3; i++) {
    const t0 = REL + i * 40, t1 = IM + i * 16, off = (i - 1) * 3;
    const bz2 = (f) => { const p = bz(f); return [p[0], p[1] + off * Math.sin(Math.PI * f)]; };
    h.fly(k.pic(crescent, M, 30 - i * 5, 28 - i * 4), M, bz2, t0, t1, (f) => 0.6 + 0.6 * f, (f) => (f < 0.1 ? f * 8 : f > 0.94 ? 0.3 : 0.95 - i * 0.2), ang, 0, 40);
  }
  for (let i = 0; i < 20; i++) {
    const t0 = REL + 10 + i * 14, t1 = IM - 20 + i * 10, id = i % 3, sz = [4, 14, 5][id], sd = (rand() - 0.5) * 10, r = Math.round(rand() * 360);
    const bz2 = (f) => { const p = bz(f); return [p[0], p[1] + sd * Math.sin(Math.PI * f) + 3 * f]; };
    h.fly(k.pic(id === 1 ? 'vapor' : 'drop', M, sz, sz, { lit: id !== 1 }), M, bz2, t0, t1, (f) => (id === 1 ? 0.5 + 0.8 * f : 1.2 - 0.5 * f), (f) => (f < 0.1 ? f * 8 : f > 0.94 ? 0.2 : id === 1 ? 0.6 : 0.95), r, 90, 50);
  }
  // the flash where the sword leaves it
  fx(k.light('g-sea', M, 40), [[REL - 30, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [REL + 50, { transform: 'scale(1.4)', opacity: 1 }, 'ease-out'], [REL + 260, { transform: 'scale(1.9)', opacity: 0 }]]);

  // ── it lands at T (IMPACT): a splash
  const fl = [[IM - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [IM + 200, { transform: 'scale(1.9)', opacity: 0.6 }]];
  for (let t = IM + 340, i = 0; t < IM + 800; t += 120, i++) fl.push([t, { transform: `scale(${i % 2 ? 1.4 : 1.15})`, opacity: i % 2 ? 0.5 : 0.35 }, eio]);
  fl.push([IM + 1200, { transform: 'scale(.9)', opacity: 0 }]);
  fx(k.light('g-sea', T, 64), fl);
  fx(k.light('g-sea', T, 22), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 30, { transform: 'scale(1.6)', opacity: 1 }], [IM + 170, { transform: 'scale(2.6)', opacity: 0 }]]);
  fx(k.pic(ring, [T[0], T[1] + 3], 66, 66), [[IM, { transform: 'scale(.15, .07)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(.4, .2)', opacity: 0.95 }, 'ease-out'], [IM + 450, { transform: 'scale(1.1, .5)', opacity: 0 }]]);
  fx(k.pic(ring, [T[0], T[1] + 3], 66, 66), [[IM + 100, { transform: 'scale(.1, .05)', opacity: 0 }, 'ease-out'], [IM + 160, { transform: 'scale(.3, .14)', opacity: 0.6 }, 'ease-out'], [IM + 580, { transform: 'scale(.85, .38)', opacity: 0 }]]);
  fx(k.pic(whirl, [T[0], T[1] + 3], 40, 40), [[IM - 20, { transform: 'rotate(0deg) scale(1.3, .6)', opacity: 0 }, 'ease-out'], [IM + 80, { transform: 'rotate(60deg) scale(1.1, .5)', opacity: 0.9 }, 'ease-in'], [IM + 800, { transform: 'rotate(420deg) scale(.15, .07)', opacity: 0.8 }], [IM + 880, { transform: 'rotate(450deg) scale(.1, .05)', opacity: 0 }]]);
  for (let i = 0; i < 22; i++) {
    const a = -Math.PI * (0.1 + rand() * 0.8), v = 18 + rand() * 36, t = IM + rand() * 50, life = 520 + rand() * 340, sz = 3 + rand() * 3.5;
    const px = (f) => Math.cos(a) * v * f, py = (f) => Math.sin(a) * v * f + 46 * f * f;
    const ks = [0, 0.3, 0.65, 1].map((f, j) => [t + life * f, { transform: `${k.T(px(f), py(f))} scale(${(1 - 0.5 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']);
    fx(k.pic(i % 4 === 3 ? bub : 'drop', T, sz, sz), ks);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + rand() * 0.4, d = 14 + rand() * 20, t = IM + rand() * 50, r = Math.round(rand() * 360), sz = 14 + rand() * 8;
    fx(k.pic('vapor', [T[0] + Math.cos(a) * 3, T[1] + 3], sz, sz, { lit: false }), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 150, { transform: `${k.T(Math.cos(a) * d * 0.5, Math.sin(a) * d * 0.3)} rotate(${r + 15}deg) scale(1)`, opacity: 0.6 }, 'ease-out'], [t + 900, { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d * 0.5 - 8)} rotate(${r + 40}deg) scale(1.6)`, opacity: 0 }]]);
  }
}
