// Bonepicker: the gaunt vulture-horror on its broken wall coils, then leaps (Soar) and strikes with its
// beak, spraying bone splinters and violet gloom at T, and flaps back to its perch.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker, element bone (changed from the
// suggested earth: it feeds on the dead and what it throws is bone, with violet gloom riding on it).
//   0-700     SNIFFING (anticipation: it is hungry): the head sways at the wall, the wing twitches,
//             the eyes flicker; it turns to T if T is behind it (round through a sliver).
//   700-1100  COIL: it crouches on its legs, the wing cocks up and forward, the neck draws right
//             back, the eyes swell with violet light, gloom gathers at the beak.
//   1150      RELEASE: it leaps (body up and out toward T), the wing slams down, the neck strikes;
//             a spray of bone splinters and gloom leaves the beak along arcs to T.
//   1450      IMPACT at T: flash, ring, splinters thrown out and falling, dust, gloom.
//   1450-3600 it beats its wing twice, feathers shed and drift, it sinks back to the wall, the head
//             droops, the eyes dim. At rest as drawn by 3600 (END 4200).
// BEATS: release 1150, impact 1450, settle 3600.
import { curve } from './_fx.js';
export const END = 4200;
export const BEATS = { release: 1150, impact: 1450, settle: 3600 };
export const STILLS = [350, 850, 1100, 1260, 1480, 1900, 2700, 3800];

export const textures = {
  orb: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226 + 29 * c, 190 + 60 * c * c, 255, Math.min(1, c * c * 2.4)]; }],
  vio: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [196, 150, 255, Math.min(1, c * c * 3)]; }],
  dust: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [150, 120, 160, c * c * 0.6]; }],
  gloom: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [52, 30, 84, c * c * 0.75]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const S = k.spec, N = S.neck, EY = S.eyes, TIP = S.emit, [wx, wy] = S.wingRoot;
  const T = k.aim || [24, 150];
  const CX = 165, right = T[0] > CX + 10;
  const mp = ([x, y]) => (right ? [2 * CX - x, y] : [x, y]); // a point of its left-facing frame, as seen
  const Tm = right ? [2 * CX - T[0], T[1]] : T;              // T in its left-facing frame
  k.css('.g-bonevio { border-radius: 50%; background: radial-gradient(circle, rgba(250,240,255,.95), rgba(204,150,255,.6) 30%, rgba(150,90,255,.24) 56%, rgba(120,60,255,0) 72%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#b790f5" stroke-width="5" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#f0e6ff" stroke-width="1.4"/>', 100, 100);
  const shard = k.svg('<path d="M1,3 L4,1.2 L12,2.2 L15,0.8 L15.6,2.6 L14,3.4 L15.4,5 L13,5.2 L4,4.6 L1.6,5.6Z" fill="#eee6f4"/>', 16, 6);
  const feather = k.svg('<path d="M1,3C4,0.6 10,0.8 15,3C10,5.2 4,5.4 1,3Z" fill="#241a36"/><path d="M1,3H15" stroke="#6a5088" stroke-width=".5"/>', 16, 6);

  // ── the world: turning to T (through a sliver if it is behind), the leap, the head's strike
  const Sx = right ? curve([[0, 1], [380, 1], [470, 0.08], [560, -1], [2850, -1], [2950, 0.08], [3050, 1]]) : () => 1;
  const dxC = curve([[0, 0], [700, 0], [950, 3], [1150, -15, 'out'], [1500, -17], [2100, -9], [2900, 0]]);
  const dyC = curve([[0, 0], [600, 0], [950, 4], [1150, -11, 'out'], [1500, -13], [2100, -5], [2900, 0]]);
  const th0 = Math.atan2(TIP[1] - N[1], TIP[0] - N[0]);
  let aim = (Math.atan2(Tm[1] - (N[1] + dyC(1300)), Tm[0] - (N[0] + dxC(1300))) - th0) * 180 / Math.PI;
  aim = Math.max(-60, Math.min(60, ((aim + 540) % 360) - 180));
  const headA = (t) => curve([[0, 0], [250, 6], [450, -5], [650, 8], [950, 62], [1100, 64], [1190, aim - 8, 'out'], [1300, aim], [1700, aim + 4], [2200, aim * 0.4 + 10], [2700, 12], [3200, -3], [3600, 0]])(t) + (t < 700 ? 2 * Math.sin(t / 60) : 0);
  const wingA = curve([[0, 0], [250, -3], [500, 2], [700, -10], [950, -22], [1100, -22], [1250, 42, 'in'], [1500, 10], [1750, 38], [2000, 6], [2400, 20], [2900, 3], [3600, 0]]);
  const tailA = curve([[0, 0], [950, -5], [1150, 12], [1500, -6], [2000, 6], [2600, -2], [3600, 0]]);
  const legA = (j) => curve([[0, 0], [700, 0], [950, -7 - j * 2], [1150, 24 + j * 4], [1500, 30 + j * 3], [2100, 12], [2800, 2], [3600, 0]]);
  const bodyA = curve([[0, 0], [700, 0], [950, 6], [1150, -9], [1500, -5], [2300, -2], [3000, 0], [3600, 0]]);
  // the beak's tip as seen at time t
  const beak = (t) => {
    const a = (headA(t) * Math.PI) / 180, dx = TIP[0] - N[0], dy = TIP[1] - N[1];
    return mp([N[0] + dx * Math.cos(a) - dy * Math.sin(a) + dxC(t), N[1] + dx * Math.sin(a) + dy * Math.cos(a) + dyC(t)]);
  };
  const eyeAt = (t) => {
    const a = (headA(t) * Math.PI) / 180, dx = EY[0] - N[0], dy = EY[1] - N[1];
    return mp([N[0] + dx * Math.cos(a) - dy * Math.sin(a) + dxC(t), N[1] + dx * Math.sin(a) + dy * Math.cos(a) + dyC(t)]);
  };
  const grid = [];
  for (let t = 0; t <= 3600; t += t < 2000 ? 70 : 150) grid.push(t);
  for (const t of [1100, 1150, 1190, 1250]) if (!grid.includes(t)) grid.push(t);
  grid.sort((a, b) => a - b);
  const drive = (el, pv, rotF) => act(el, grid.map((t) => {
    const sx = Sx(t), tx = (CX - pv[0]) * (1 - sx), [dx, dy] = [dxC(t), dyC(t)];
    return [t, { transform: `translate(${((tx + dx * sx) * u).toFixed(2)}px, ${(dy * u).toFixed(2)}px) scaleX(${sx.toFixed(3)}) rotate(${rotF(t).toFixed(2)}deg)` }, 'linear'];
  }));
  drive(k.part('body'), [168, 112], bodyA);
  drive(k.part('head'), N, headA);
  drive(k.part('wing'), S.wingRoot, wingA);
  drive(k.part('tail'), S.tailRoot, tailA);
  S.hips.forEach((h, j) => drive(k.part('leg' + (j + 1)), h, legA(j)));
  // the eyes: they ride the head, flicker while it sniffs, and swell at the coil (the glow itself, in the light below)
  act(k.part('eyes'), grid.map((t) => {
    const sx = Sx(t), tx = (CX - N[0]) * (1 - sx);
    const o = t < 700 ? (0.8 + 0.2 * Math.sin(t / 70) ** 2) : t < 3000 ? 1 : 1;
    return [t, { transform: `translate(${((tx + dxC(t) * sx) * u).toFixed(2)}px, ${(dyC(t) * u).toFixed(2)}px) scaleX(${sx.toFixed(3)}) rotate(${headA(t).toFixed(2)}deg)`, opacity: +o.toFixed(2) }, 'linear'];
  }));
  // violet light that follows the eyes: warms, flares at the coil and the strike, dims
  const gridE = grid.filter((t) => t >= 500 && t <= 3300);
  const eyeLight = (size, peak) => fx(k.lightIn('g-bonevio', EY, size, size), gridE.map((t) => {
    const o = curve([[500, 0], [900, peak * 0.6], [1100, peak], [1250, peak * 0.9], [1700, peak * 0.5], [2400, peak * 0.2], [3300, 0]])(t);
    const e = eyeAt(t), sc = 0.8 + 0.5 * curve([[500, 0], [1100, 1], [1500, 0.5], [3300, 0]])(t);
    return [t, { transform: `${k.T(e[0] - EY[0], e[1] - EY[1])} scale(${sc.toFixed(2)})`, opacity: +o.toFixed(2) }, 'linear'];
  }));
  eyeLight(34, 0.9);
  eyeLight(80, 0.4);
  // gloom gathering at the beak during the coil, riding it
  fx(k.pic('gloom', TIP, 26, 26), grid.filter((t) => t >= 650 && t <= 1500).map((t) => {
    const b = beak(t), o = curve([[650, 0], [950, 0.8], [1150, 0.9], [1400, 0]])(t), sc = curve([[650, 0.4], [1100, 1.2], [1500, 1.8]])(t);
    return [t, { transform: `${k.T(b[0] - TIP[0], b[1] - TIP[1])} scale(${sc.toFixed(2)})`, opacity: +o.toFixed(2) }, 'linear'];
  }));
  fx(k.pic('orb', TIP, 16, 16), grid.filter((t) => t >= 700 && t <= 1400).map((t) => {
    const b = beak(t), o = curve([[700, 0], [1000, 0.7], [1150, 1], [1400, 0]])(t), sc = curve([[700, 0.3], [1150, 1.3], [1400, 0.8]])(t);
    return [t, { transform: `${k.T(b[0] - TIP[0], b[1] - TIP[1])} scale(${sc.toFixed(2)})`, opacity: +o.toFixed(2) }, 'linear'];
  }));

  // ── the leap: dust kicked off the wall, feathers shed by the wing and drifting down
  for (let i = 0; i < 6; i++) {
    const x = mp([150 + i * 14, 168])[0] + (rand() - 0.5) * 8, t = 1120 + i * 40, r = Math.round(rand() * 360);
    fx(k.picIn('dust', [x, 172], 20, 20, { lit: false }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'],
      [t + 240, { transform: `${k.T((i - 2.5) * 5, -8)} rotate(${r + 25}deg) scale(1)`, opacity: 0.6 }], [t + 1100, { transform: `${k.T((i - 2.5) * 10, -22)} rotate(${r + 60}deg) scale(1.8)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 5; i++) {
    const t = 1200 + i * 190, wp = mp([208 - i * 3, 40 + i * 6]), rr = Math.round(rand() * 180 - 90), dx = (rand() - 0.5) * 30;
    const pts = k.arc([0, 0], [dx * 0.5, 20], [dx, 62 + rand() * 20], 5);
    fx(k.pic(feather, wp, 7, 2.6, { lit: false }), [[t, { transform: `${k.T(0, 0)} rotate(${rr}deg) scale(.5)`, opacity: 0 }, 'ease-out'],
      ...pts.map(([x, y], j) => [Math.round(t + 100 + 900 * j / 5), { transform: `${k.T(x, y)} rotate(${rr + Math.round((rand() - 0.5) * 220 * j)}deg) scale(1)`, opacity: j === 5 ? 0 : 0.95 }, 'ease-in-out'])]);
  }

  // ── release (1150): bone splinters and gloom from the beak to T on arcs, on the overlay
  const B = beak(1200), REL = 1150;
  const C = [(B[0] + T[0]) / 2, Math.min(B[1], T[1]) - 18];
  const bz = (t) => { const q = 1 - t; return [q * q * B[0] + 2 * q * t * C[0] + t * t * T[0], q * q * B[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const [X0, Y0] = k.P(...B);
  for (let i = 0; i < 9; i++) {
    const t0 = REL + 30 + i * 30, dur = 280 + rand() * 80, side = (rand() - 0.5) * 12, rr = Math.round(rand() * 360);
    const at = (f, s, o) => { const [x, y] = k.P(...bz(f)); const [ax, ay] = k.P(...bz(Math.min(1, f + 0.02))); const ang = Math.atan2(ay - y + 1e-3, ax - x + 1e-3) * 180 / Math.PI; return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + side * Math.sin(Math.PI * f) * u).toFixed(1)}px) rotate(${(i % 3 === 2 ? rr : ang).toFixed(0)}deg) scale(${s})`, opacity: o }; };
    fx(k.pic(i % 3 === 2 ? 'vio' : shard, B, i % 3 === 2 ? 8 : 9, i % 3 === 2 ? 8 : 3.4), [[t0, at(0, 0.5, 0), 'ease-in'], [t0 + 30, at(0.06, 1, 1), 'linear'], [t0 + dur * 0.6, at(0.6, 1.1, 1), 'linear'], [t0 + dur, at(1, 1, 0.95), 'ease-out'], [t0 + dur + 60, at(1, 1.3, 0)]]);
  }
  for (let i = 0; i < 5; i++) {
    const t0 = REL + 20 + i * 50, dur = 300, r = Math.round(rand() * 360);
    const at = (f, s, o) => { const [x, y] = k.P(...bz(f)); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) rotate(${r}deg) scale(${s})`, opacity: o }; };
    fx(k.pic('gloom', B, 22, 22), [[t0, at(0, 0.4, 0), 'ease-out'], [t0 + 60, at(0.2, 0.7, 0.9)], [t0 + dur * 0.7, at(0.7, 1, 0.8)], [t0 + dur, at(1, 1.4, 0.7), 'ease-out'], [t0 + dur + 320, at(1, 2, 0)]]);
  }

  // ── impact (1450): flash, ring, splinters thrown out and falling, dust and gloom
  const IM = 1450;
  fx(k.light('g-bonevio', T, 62), [[IM - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [IM + 450, { transform: 'scale(1.15)', opacity: 0.5 }, eio], [IM + 1300, { transform: 'scale(.8)', opacity: 0 }]]);
  for (const [d, w, o] of [[0, 78, 0.95], [140, 54, 0.7]]) {
    fx(k.pic(ring, T, w, w), [[IM + d - 1, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + d + 40, { transform: 'scale(.3)', opacity: o }, 'ease-out'], [IM + d + 650, { transform: 'scale(1.1)', opacity: 0 }]]);
  }
  for (let i = 0; i < 11; i++) {
    const a = -Math.PI * (0.05 + 0.9 * rand()), r = 18 + rand() * 24, ex = Math.cos(a) * r * 1.2, ey = Math.sin(a) * r, t1 = IM + 10 + rand() * 90, life = 700 + rand() * 400, rt = Math.round(rand() * 360);
    const pts = k.arc([0, 0], [ex * 0.7, ey - 6], [ex * 1.1, ey + 22 + rand() * 12], 5);
    fx(k.pic(shard, T, 7 + rand() * 3, 2.8, { lit: false }), [[t1, { transform: `${k.T(0, 0)} rotate(${rt}deg) scale(.3)`, opacity: 0 }, 'ease-out'],
      ...pts.map(([x, y], j) => [Math.round(t1 + 40 + life * j / 5), { transform: `${k.T(x, y)} rotate(${rt + Math.round((rand() - 0.2) * 400 * j / 5)}deg) scale(1)`, opacity: j === 5 ? 0 : 0.95 }, j < 1 ? 'ease-out' : 'ease-in'])]);
  }
  for (let i = 0; i < 4; i++) {
    const t1 = IM + 100 + i * 140, r = Math.round(rand() * 360), dx = (rand() - 0.5) * 24;
    fx(k.pic(i % 2 ? 'dust' : 'gloom', [T[0] + dx * 0.4, T[1] + 4], 26, 26, { lit: false, low: true }), [[t1, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'],
      [t1 + 260, { transform: `${k.T(dx * 0.5, -8)} rotate(${r + 20}deg) scale(1)`, opacity: 0.6 }], [t1 + 1200, { transform: `${k.T(dx, -28)} rotate(${r + 50}deg) scale(2)`, opacity: 0 }]]);
  }
}
