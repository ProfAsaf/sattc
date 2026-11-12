// Grandmother Bramble: she gathers the low sun's gold into her palm, lifts her long arm, and sweeps
// the light out over the saplings; they leap up where it passes and a new one springs where it lands.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support (as suggested: her text is a boon, "+1/+1
// more"), element nature (changed from the suggested wind: the picture is growth and moss, not air).
//   0-1150    GATHER: the crown sways and the chicks in the nests chirp (little flashes at the beaks); motes
//             of the sun's gold drift down to her cupped hand and it glows brighter; she lifts her arm,
//             drawing it back as she winds up; the saplings lean toward her.
//   1250      RELEASE: she sweeps arm and hand out toward T and flicks her fingers open; a shower of
//             light falls from the hand along its sweep and an orb of light leaves it for T on a low
//             arc, a trail of motes behind it. The saplings leap up one after another as it passes.
//   1750      IMPACT at T: a flash, a ring along the ground, a new sapling springs up (and two little
//             ones), leaves and motes swirl; every sapling holds its light a moment, then settles.
//   1800-3700 follow-through: arm and hand ease home, the saplings sway and sink back to their size, the
//             birds, startled, flutter up and circle back, the crown keeps swaying until it is still;
//             at rest as drawn from 3700 (END 4200).
// Aimed: T = k.aim || [284, 186] (alone: the end of her row, where a fifth sapling springs). The arm turns
// toward T (as far as it can reach, at most 38 degrees from where it rests); the orb and its trail go
// from the palm (emit, carried by arm and hand) to T on the overlay (T may be on another card).
import { mul, rot, curve, kit, app } from './_fx.js';
export const END = 4200;
export const BEATS = { release: 1250, impact: 1750, settle: 3700 };
export const STILLS = [450, 950, 1250, 1450, 1760, 2100, 2900, 3900];
export const textures = {
  mote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 246, 170 + 50 * c, Math.min(1, c * c * c * 2.4)]; }],
  gmote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [236, 255, 170 + 50 * c, Math.min(1, c * c * c * 2.4)]; }],
  star: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); const ax = Math.abs(x - 0.5) * 2, ay = Math.abs(y - 0.5) * 2, ray = Math.max(0, 1 - Math.min(ax, ay) * 9) * Math.max(0, 1 - Math.max(ax, ay)); return [250, 255, 190 + 55 * c * c, Math.min(1, c * c * c * 1.6 + ray * 0.85)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  k.css('.g-grow { border-radius: 50%; background: radial-gradient(circle, rgba(255,252,210,.95), rgba(226,240,120,.55) 30%, rgba(170,210,70,.2) 55%, rgba(140,190,50,0) 70%); }');
  const S = k.spec, E = S.emit, SH = S.shoulder, WR = S.wrist, CR = S.crown, GY = S.ground;
  const T = k.aim || [284, 186];

  // ── her arm and hand: the arm turns from the shoulder, the hand from the wrist and with the arm
  const deg = (r) => (r * 180) / Math.PI;
  const aE = Math.atan2(E[1] - SH[1], E[0] - SH[0]), aT = Math.atan2(T[1] - SH[1], T[0] - SH[0]);
  const dAim = Math.max(-38, Math.min(38, ((deg(aT - aE) + 540) % 360) - 180));
  const armA = curve([[0, 0], [300, 0], [900, -7, 'in'], [1180, -13], [1260, dAim + 6, 'out'], [1450, dAim], [1900, dAim * 0.9 + 1], [2500, dAim * 0.35], [3100, -1.2], [3700, 0]]);
  const handA = curve([[0, 0], [500, 9], [1150, 20], [1260, -20, 'out'], [1520, -9], [2000, -5], [2800, 2], [3300, -0.5], [3700, 0]]);
  const WA = (t) => rot(armA(t), SH[0], SH[1]);
  const WH = (t) => mul(WA(t), rot(handA(t), WR[0], WR[1]));
  h.drive(k.part('arm'), SH, WA, 3700);
  h.drive(k.part('hand'), WR, WH, 3700);
  const Ep = (t) => app(WH(t), E);          // the palm, wherever the hand is
  // ── the crown sways, and the beaks with it
  const swayA = curve([[0, 0], [600, 0.5], [1300, 1.0, 'out'], [2300, 1.25], [3000, 0.5], [3700, 0]]);
  const WC = (t) => rot(swayA(t) * Math.sin(t / 430), CR[0], CR[1]);
  h.drive(k.part('crown'), CR, WC, 3700);
  h.drive(k.part('beaks'), CR, WC, 3700);
  // ── the birds, startled by the light, flutter up and circle back
  const bx = curve([[0, 0], [1500, 0], [1700, 6, 'out'], [2100, 16], [2500, 8], [2900, -3], [3300, 1.5], [3600, 0]]), by = curve([[0, 0], [1500, 0], [1700, -4], [2000, -11], [2400, -4], [2800, 3], [3200, -1], [3600, 0]]), br = curve([[0, 0], [1500, 0], [1800, -8], [2300, 6], [2800, -4], [3400, 1], [3600, 0]]);
  h.drive(k.part('birds'), S.birds || [214, 42], (t) => mul([1, 0, 0, 1, bx(t), by(t)], rot(br(t), 214, 42)), 3600);

  // ── the saplings: lean toward her as she gathers, leap as the light passes, settle
  const sapW = (sx, sy, r) => ({ transform: `rotate(${r}deg) scale(${sx}, ${sy})` });
  const flightX = (x) => (T[0] === E[0] ? 0 : (x - E[0]) / (T[0] - E[0]));
  S.saps.forEach(([[x]], i) => {
    const f = flightX(x), on = f > 0.02 && f < 1.05 && Math.abs(T[1] - 176) < 40;
    const tp = on ? 1250 + f * 460 : 1480 + i * 110, a = on ? 1 : 0.5;
    act(k.part('sap' + i), [[0, sapW(1, 1, 0), eio], [700, sapW(1, 1.02, -2 - i * 0.3), eio], [tp - 100, sapW(1, 1.03, -3), 'ease-in'], [tp + 120, sapW(1 + 0.12 * a, 1 + 0.38 * a, 3), 'ease-out'], [tp + 360, sapW(1 + 0.04 * a, 1 + 0.14 * a, -3), eio],
      [tp + 700, sapW(1 + 0.08 * a, 1 + 0.24 * a, 2.5), eio], [Math.min(3200, tp + 1200), sapW(1.02, 1.08, -1.5), eio], [Math.min(3500, tp + 1800), sapW(1, 1.03, 0.8), eio], [3600, sapW(1, 1, 0)]]);
    // each sapling's light flares as the orb passes
    fx(k.lightIn('g-grow', [x + 1, 190 - 12 - i * 1.5], 30, 30), [[tp - 60, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [tp + 120, { transform: 'scale(1.3)', opacity: 0.9 * a + 0.1 }, 'ease-out'], [tp + 900, { transform: 'scale(1)', opacity: 0.4 * a }, eio], [tp + 1700, { transform: 'scale(.7)', opacity: 0 }]]);
  });

  // ── 0-1150 gather: chirps at the beaks, the sun's gold drifting to her palm, the palm glowing
  [[82, 76, 340], [90, 77, 470], [160, 40, 600], [82, 76, 780], [160, 40, 950], [88, 77, 2000], [160, 40, 2200], [82, 76, 2380]].forEach(([x, y, t], i) => {
    const dx = (rand() - 0.5) * 6;
    fx(k.pic('star', [x, y - 2], 10, 10), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 90, { transform: `${k.T(dx, -3)} scale(1.1) rotate(20deg)`, opacity: 1 }, 'ease-out'], [t + 340, { transform: `${k.T(dx * 1.5, -9)} scale(.4) rotate(60deg)`, opacity: 0 }]]);
  });
  h.ride(k.lightIn('g-grow', E, 30, 30), E, WH, [[250, 0.3, 0], [700, 0.8, 0.55], [1150, 1.4, 0.95], [1250, 2.2, 1], [1500, 1.2, 0.6], [2100, 0.8, 0.25], [2700, 0.5, 0]]);
  h.ride(k.pic('star', E, 14, 14), E, WH, [[500, 0.3, 0], [1000, 0.9, 0.9], [1150, 1.2, 1], [1250, 1.7, 1], [1480, 0.9, 0.5], [1800, 0.4, 0]]);
  // the sun's gold drifts down to the palm
  const SUN = [104, 58];
  for (let i = 0; i < 20; i++) {
    const t0 = 200 + i * 45 + rand() * 30, dur = 700 + rand() * 200, sz = 3 + rand() * 3.5, a = rand() * Math.PI * 2, r0 = 6 + rand() * 22;
    const from = [SUN[0] + Math.cos(a) * r0, SUN[1] + Math.sin(a) * r0], ks = [];
    for (let j = 0; j <= 6; j++) {
      const f = j / 6, g = f * f * (3 - 2 * f), t = t0 + dur * f, p = Ep(Math.min(1100, t)), sp = Math.sin(f * 5 + i) * 6 * (1 - g);
      const x = from[0] + (p[0] - from[0]) * g + sp, y = from[1] + (p[1] - from[1]) * g;
      ks.push([t, { transform: `${k.T(x - from[0], y - from[1])} scale(${(0.5 + 0.8 * Math.sin(Math.PI * f)).toFixed(2)})`, opacity: j === 0 || j === 6 ? 0 : 1 }, 'linear']);
    }
    fx(k.picIn('mote', from, sz, sz), ks);
  }

  // ── 1250 release: a ring at the palm, a shower of light along the hand's sweep, the orb for T
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#f4ffb0" stroke-width="5" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#fffef0" stroke-width="1.2"/>', 100, 100);
  const P0 = Ep(1262);
  fx(k.pic(ring, P0, 40, 40), [[1250, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [1310, { transform: 'scale(.5)', opacity: 0.95 }, 'ease-out'], [1750, { transform: 'scale(1.5)', opacity: 0 }]]);
  for (let i = 0; i < 16; i++) {
    const t = 1240 + i * 30 + rand() * 20, p = Ep(Math.min(1500, t)), life = 520 + rand() * 300, sz = 3.5 + rand() * 3, dx = (rand() - 0.2) * 12;
    fx(k.pic('mote', p, sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 90, { transform: 'scale(1)', opacity: 1 }], [t + life, { transform: `${k.T(dx, 16 + rand() * 16)} scale(.3)`, opacity: 0 }]]);
  }
  const IM = 1750;
  const bz = h.arcPath(P0, T, 8 + Math.min(18, Math.hypot(T[0] - P0[0], T[1] - P0[1]) * 0.08));
  const orbKeys = [[1250, { transform: 'scale(.4) rotate(0deg)', opacity: 0 }, 'ease-out']];
  for (let j = 0; j <= 6; j++) { const f = j / 6, p = bz(f * f * 0.5 + f * 0.5); orbKeys.push([1310 + f * (IM - 1310), { transform: `${k.T(p[0] - P0[0], p[1] - P0[1])} scale(${(1.5 - 0.3 * f).toFixed(2)}) rotate(${Math.round(f * 220)}deg)`, opacity: 1 }, 'linear']); }
  orbKeys.push([IM + 90, { transform: `${k.T(T[0] - P0[0], T[1] - P0[1])} scale(1.6) rotate(260deg)`, opacity: 0 }]);
  fx(k.pic('star', P0, 24, 24), orbKeys);
  fx(k.light('g-grow', P0, 30), orbKeys.map(([t, s, e], j) => [t, { transform: s.transform.replace(/ rotate\([^)]*\)/, ''), opacity: j === 0 || j === orbKeys.length - 1 ? 0 : 0.8 }, e]));
  for (let i = 0; i < 18; i++) {
    const t0 = 1270 + i * 24, t1 = IM - 30 + i * 14 + rand() * 20, sz = [8, 4, 10][i % 3], sd = (rand() - 0.5) * 8;
    const bz2 = (f) => { const p = bz(f); return [p[0], p[1] + sd * Math.sin(Math.PI * f)]; };
    h.fly(k.pic(i % 4 === 3 ? 'gmote' : 'mote', P0, sz, sz), P0, bz2, t0, t1, (f) => 1.1 - 0.6 * f, (f) => (f < 0.1 ? f * 9 : 0.9 * (1 - f * 0.5)), 0, 0, 50, (f) => f * f * 0.5 + f * 0.5);
  }

  // ── 1750 impact at T: a flash, rings, a sapling (and two little ones) springing, leaves and motes
  const sap = (c1, c2) => k.svg(`<path d="M12,34 C11,26 14,18 12,8" stroke="${c1}" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M12,22 C6,21 3,16 3,12 C8,12 11,16 12,22Z M12,16 C18,15 21,10 21,6 C16,6 13,10 12,16Z" fill="${c2}"/><path d="M12,8 C9,5 10,2 12,1 C14,2 15,5 12,8Z" fill="#f4ffc0"/>`, 24, 34);
  const saps = [sap('#7fa845', '#b4dc6a'), sap('#6f9a3c', '#d6ee86'), sap('#7fa845', '#9ccc58')];
  const fl = [[IM - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [IM + 250, { transform: 'scale(1.9)', opacity: 0.6 }]];
  for (let t = IM + 450, i = 0; t < IM + 1000; t += 140, i++) fl.push([t, { transform: `scale(${i % 2 ? 1.5 : 1.25})`, opacity: i % 2 ? 0.5 : 0.38 }, eio]);
  fl.push([IM + 1500, { transform: 'scale(1)', opacity: 0 }]);
  fx(k.light('g-grow', [T[0], T[1] - 6], 60), fl);
  fx(k.light('g-grow', [T[0], T[1] - 4], 22), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.6)', opacity: 1 }], [IM + 200, { transform: 'scale(2.6)', opacity: 0 }]]);
  fx(k.pic(ring, [T[0], T[1] + 2], 56, 56), [[IM, { transform: 'scale(.15, .08)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(.4, .2)', opacity: 0.95 }, 'ease-out'], [IM + 620, { transform: 'scale(1.3, .6)', opacity: 0 }]]);
  fx(k.pic(ring, [T[0], T[1] + 2], 56, 56), [[IM + 110, { transform: 'scale(.1, .05)', opacity: 0 }, 'ease-out'], [IM + 170, { transform: 'scale(.3, .15)', opacity: 0.6 }, 'ease-out'], [IM + 700, { transform: 'scale(.9, .45)', opacity: 0 }]]);
  [[-11, 70, 17], [0, 0, 30], [11, 130, 20]].forEach(([dx, dly, hgt], i) => {
    const t = IM + 40 + dly, w = hgt * 0.7, sw = (a) => `rotate(${a}deg)`;
    fx(k.pic(saps[i], [T[0] + dx, T[1] + 5], w, hgt, { base: true }), [[t, { transform: `scale(.1, .05) ${sw(0)}`, opacity: 0 }, 'ease-out'], [t + 230, { transform: `scale(1.1, 1.18) ${sw(-3)}`, opacity: 1 }, 'ease-out'], [t + 420, { transform: `scale(1, 1) ${sw(2)}`, opacity: 1 }, eio],
      [t + 800, { transform: `scale(1, 1) ${sw(-2.5)}`, opacity: 1 }, eio], [t + 1200, { transform: `scale(1, 1) ${sw(2)}`, opacity: 1 }, eio], [t + 1650, { transform: `scale(.9, .6) ${sw(0)}`, opacity: 0.8 }, 'ease-in'], [t + 1950, { transform: `scale(.3, .05) ${sw(0)}`, opacity: 0 }]]);
  });
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + rand() * 0.4, d = 14 + rand() * 20, t = IM + rand() * 40, life = 650 + rand() * 500, sz = 3 + rand() * 3.5, spin = (i % 2 ? 1 : -1) * 0.5;
    const px = (f) => Math.cos(a + spin * f) * d * (0.3 + f), py = (f) => Math.sin(a + spin * f) * d * 0.75 * (0.3 + f) - 10 * f * f;
    fx(k.pic('gmote', T, sz, sz), [0, 0.25, 0.6, 1].map((f, j) => [t + life * f, { transform: `${k.T(px(f), py(f) - 4)} scale(${(1.1 - 0.7 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']));
  }
  const leafA = k.svg('<path d="M10,1 C17,6 17,17 10,25 C3,17 3,6 10,1Z" fill="#5f7f3e"/><path d="M10,4 L10,22" stroke="#dff3a0" stroke-width=".9" fill="none"/>', 20, 26);
  const leafB = k.svg('<path d="M10,1 C17,6 17,17 10,25 C3,17 3,6 10,1Z" fill="#d6e89a"/><path d="M10,4 L10,22" stroke="#7e9a4c" stroke-width=".9" fill="none"/>', 20, 26);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rand() * 0.5, d = 14 + rand() * 18, t = IM + 20 + rand() * 80, life = 900 + rand() * 500, r0 = Math.round(rand() * 360), sw = rand() < 0.5 ? 1 : -1;
    fx(k.pic(i % 2 ? leafA : leafB, T, 6, 8, { lit: false }), [0, 0.2, 0.5, 0.8, 1].map((f, j) => [t + life * f, { transform: `${k.T(Math.cos(a + sw * f) * d * (0.2 + f), Math.sin(a + sw * f) * d * 0.7 * (0.2 + f) + 14 * f * f - 6)} rotate(${Math.round(r0 + sw * 260 * f)}deg) scale(${(0.5 + 0.6 * Math.min(1, f * 5)).toFixed(2)})`, opacity: j === 0 || j === 4 ? 0 : 1 }, j ? 'linear' : 'ease-out']));
  }
  // the earth along her row glows where the light touched it, then fades; motes lift off the soil
  fx(k.lightIn('g-grow', [226, GY + 2], 120, 22), [[1300, { opacity: 0 }, 'ease-out'], [IM, { opacity: 0.7 }, eio], [2400, { opacity: 0.45 }, eio], [3300, { opacity: 0 }]]);
  for (let i = 0; i < 10; i++) {
    const t = 1800 + i * 150 + rand() * 60, p = [196 + rand() * 80, GY - 2 + rand() * 4];
    fx(k.picIn('gmote', p, 4, 4), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 150, { transform: 'scale(1)', opacity: 1 }], [t + 1000, { transform: `${k.T((rand() - 0.5) * 8, -22 - rand() * 14)} scale(.3)`, opacity: 0 }]]);
  }
}
