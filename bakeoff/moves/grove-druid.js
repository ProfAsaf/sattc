// Grove Druid: kneeling over the seed she bows deeper, gathers the grove's light into it, then presses
// it into the earth: light runs out along the roots and saplings spring up where the boon lands.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support (changed from the suggested attacker: the
// picture is a planting, and her text is mostly growth: +1 maximum Energy), element nature.
//   0-1150    gather: she bows lower over the seed (the head nods, the antlers dip), pollen and motes of
//             green light stream in to the seed; it swells and the roots glow brighter.
//   1200      RELEASE: she presses the seed in and rises (body straightens, head lifts), a ring of light
//             runs across the earth, the roots flash and pulses run out along them both ways; an orb of
//             light leaves the seed low along the ground for T.
//   1750      IMPACT at T: saplings spring up out of the ground (grow from their bases), a ring, a swirl
//             of leaves and motes, a glow that lingers and lifts. Alone, T is the ground at her right,
//             on the right-hand root.
//   1800-3500 follow-through: the saplings sway and sink back, the roots dim, she settles back with a
//             slow nod; at rest as drawn from 3500 (END 4000).
// Aimed: T = k.aim || [250, 186]. The orb and its trail go from emit (the seed) to T along a low arc;
// saplings and the bloom stand at T on the overlay (T may be on another card).
import { mul, rot, tr, scl, curve, kit } from './_fx.js';
export const END = 4000;
export const BEATS = { release: 1200, impact: 1750, settle: 3500 };
export const STILLS = [500, 1000, 1200, 1400, 1760, 2100, 2700, 3700];
export const textures = {
  mote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [236, 255, 170 + 50 * c, Math.min(1, c * c * c * 2.4)]; }],
  star: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); const ax = Math.abs(x - 0.5) * 2, ay = Math.abs(y - 0.5) * 2, ray = Math.max(0, 1 - Math.min(ax, ay) * 9) * Math.max(0, 1 - Math.max(ax, ay)); return [240, 255, 190 + 55 * c * c, Math.min(1, c * c * c * 1.6 + ray * 0.8)]; }],
};

export function build(k) {
  const { fx, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  k.css('.g-grow { border-radius: 50%; background: radial-gradient(circle, rgba(252,255,214,.95), rgba(214,240,120,.55) 30%, rgba(150,208,72,.2) 55%, rgba(120,190,50,0) 70%); }');
  const S = k.spec, E = S.emit, HIPS = S.hips, NECK = S.neck, GY = S.ground;
  const T = k.aim || [250, 186];
  const alone = !k.aim;

  // ── her
  const lean = curve([[0, 0], [250, 0], [1100, 3.6, 'in'], [1200, 5.2, 'out'], [1500, -3.5], [2000, -4], [2800, -1.2], [3400, 0]]);
  const nod = curve([[0, 0], [250, 0], [1100, 7, 'in'], [1200, 8, 'out'], [1480, -9], [2100, -6], [2900, 2], [3400, 0]]);
  const WB = (t) => rot(lean(t), HIPS[0], HIPS[1]);
  const WH = (t) => mul(WB(t), rot(nod(t), NECK[0], NECK[1]));
  h.drive(k.part('body'), HIPS, WB, 3500);
  h.drive(k.part('head'), NECK, WH, 3500);

  // ── the roots, lit again: a copy of them in light that swells while she gathers and flashes on release
  const roots = 'M182,173C168,178 152,180 136,184C116,188 96,190 74,194C52,197 30,196 6,194M136,184C130,192 128,200 122,212M98,190C92,198 84,204 76,212' +
    'M182,173C198,177 214,180 232,184C252,188 272,186 306,184M232,184C236,194 234,204 240,212M262,187C270,194 276,198 288,204M182,175C184,186 180,198 184,212M182,175C176,186 166,196 156,206';
  const rootsLit = k.svg(`<defs><filter id="b" x="-5%" y="-30%" width="110%" height="160%"><feGaussianBlur stdDeviation="1.3"/></filter></defs><g transform="translate(0,-140)" fill="none" stroke-linecap="round"><path d="${roots}" stroke="#e3ff8a" stroke-width="4.5" opacity=".55" filter="url(#b)"/><path d="${roots}" stroke="#fbffe0" stroke-width="1.5"/></g>`, 310, 80);
  fx(k.picIn(rootsLit, [155, 180], 310, 80), [[300, { opacity: 0 }, 'ease-out'], [1100, { opacity: 0.5 }, eio], [1200, { opacity: 1 }, 'ease-out'], [1330, { opacity: 0.6 }, eio], [1500, { opacity: 0.9 }, eio], [2300, { opacity: 0.4 }, eio], [3100, { opacity: 0 }]]);
  // the seed swells in her hands, a glow around it
  fx(k.picIn('star', E, 22, 22), [[250, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [1100, { transform: 'scale(1.1) rotate(100deg)', opacity: 1 }, eio], [1200, { transform: 'scale(1.7) rotate(150deg)', opacity: 1 }, 'ease-out'], [1500, { transform: 'scale(1) rotate(210deg)', opacity: 0.7 }, eio], [2400, { transform: 'scale(.5) rotate(260deg)', opacity: 0 }]]);
  fx(k.lightIn('g-grow', [E[0], E[1] - 2], 72, 56), [[250, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1100, { transform: 'scale(1)', opacity: 0.7 }, eio], [1220, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [1700, { transform: 'scale(1.1)', opacity: 0.55 }, eio], [2600, { transform: 'scale(.7)', opacity: 0 }]]);
  // the crown's tips catch the light
  fx(k.lightIn('g-grow', [180, 100], 70, 70), [[1200, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1500, { transform: 'scale(1)', opacity: 0.45 }, 'ease-out'], [2300, { transform: 'scale(1.1)', opacity: 0 }]]);

  // ── gather: pollen and motes stream in to the seed
  for (let i = 0; i < 22; i++) {
    const t0 = 250 + i * 40 + rand() * 30, dur = 560 + rand() * 160, sz = 3 + rand() * 3.5, a = -Math.PI * rand(), r0 = 40 + rand() * 50;
    const from = [E[0] + Math.cos(a) * r0 * 1.3, E[1] + Math.sin(a) * r0 * 0.9 - 8], ks = [];
    for (let j = 0; j <= 5; j++) {
      const f = j / 5, g = f * f * (3 - 2 * f), sp = (1 - g) * Math.sin(f * 6 + i) * 5;
      ks.push([t0 + dur * f, { transform: `${k.T((E[0] - from[0]) * g + sp, (E[1] - from[1]) * g)} scale(${(0.5 + 0.8 * Math.sin(Math.PI * f)).toFixed(2)})`, opacity: j === 0 || j === 5 ? 0 : 1 }, 'linear']);
    }
    fx(k.picIn('mote', from, sz, sz), ks);
  }

  // ── RELEASE (1200): a ring runs across the earth, pulses run out along the roots both ways
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#eaffa6" stroke-width="5" filter="url(#b)"/>', 100, 100);
  fx(k.picIn(ring, [E[0], GY + 6], 100, 100), [[1200, { transform: 'scale(.2, .05)', opacity: 0 }, 'ease-out'], [1260, { transform: 'scale(.5, .12)', opacity: 0.95 }, 'ease-out'], [1900, { transform: 'scale(2.6, .55)', opacity: 0 }]]);
  fx(k.picIn(ring, [E[0], GY + 6], 100, 100), [[1300, { transform: 'scale(.15, .04)', opacity: 0 }, 'ease-out'], [1360, { transform: 'scale(.4, .1)', opacity: 0.6 }, 'ease-out'], [2000, { transform: 'scale(2.0, .45)', opacity: 0 }]]);
  const cub = (p0, p1, p2, p3) => (t) => { const q = 1 - t; return [q * q * q * p0[0] + 3 * q * q * t * p1[0] + 3 * q * t * t * p2[0] + t * t * t * p3[0], q * q * q * p0[1] + 3 * q * q * t * p1[1] + 3 * q * t * t * p2[1] + t * t * t * p3[1]]; };
  const polyline = (segs) => (f) => { const n = segs.length, i = Math.min(n - 1, Math.floor(f * n)); return segs[i]((f * n) - i); };
  const rootL = polyline([cub([182, 173], [168, 178], [152, 180], [136, 184]), cub([136, 184], [116, 188], [96, 190], [74, 194]), cub([74, 194], [52, 197], [30, 196], [6, 194])]);
  const rootR = polyline([cub([182, 173], [198, 177], [214, 180], [232, 184]), cub([232, 184], [252, 188], [272, 186], [306, 184])]);
  for (const [root, n, dly] of [[rootL, 7, 0], [rootR, 7, 25]]) {
    for (let i = 0; i < n; i++) {
      const t0 = 1230 + i * 55 + dly + rand() * 20, t1 = t0 + 720 + rand() * 120, sz = 5 + rand() * 4;
      h.fly(k.picIn('mote', E, sz, sz), E, root, t0, t1, (f) => 1.3 - 0.8 * f, (f) => (f < 0.08 ? f * 12 : 1 - f * f), 0, 0, 40, (f) => 1 - (1 - f) * (1 - f) * 0.75);
    }
  }
  // the orb for T: low over the earth, a trail of motes behind it (alone, T is on the right-hand root)
  const lift = 6 + Math.min(14, Math.hypot(T[0] - E[0], T[1] - E[1]) * 0.06);
  const bz = h.arcPath(E, T, lift);
  const orb = k.pic('star', E, 24, 24);
  const ok = [[1240, { transform: 'scale(.4) rotate(0deg)', opacity: 0 }, 'ease-out']];
  for (let j = 0; j <= 6; j++) { const f = j / 6, p = bz(f * f * 0.5 + f * 0.5); ok.push([1300 + f * 440, { transform: `${k.T(p[0] - E[0], p[1] - E[1])} scale(${(1.4 - 0.2 * f).toFixed(2)}) rotate(${Math.round(f * 220)}deg)`, opacity: 1 }, 'linear']); }
  ok.push([1830, { transform: `${k.T(T[0] - E[0], T[1] - E[1])} scale(1.6) rotate(260deg)`, opacity: 0 }]);
  fx(orb, ok);
  for (let i = 0; i < 18; i++) {
    const t0 = 1260 + i * 24, t1 = 1720 + i * 14 + rand() * 20, sz = [8, 4, 10][i % 3], sd = (rand() - 0.5) * 6;
    const bz2 = (f) => { const p = bz(f); return [p[0], p[1] + sd * Math.sin(Math.PI * f)]; };
    h.fly(k.pic('mote', E, sz, sz), E, bz2, t0, t1, (f) => 1.1 - 0.6 * f, (f) => (f < 0.1 ? f * 9 : 0.9 * (1 - f * 0.5)), 0, 0, 50, (f) => f * f * 0.5 + f * 0.5);
  }

  // ── IMPACT (1750): the earth opens at T and saplings spring up
  const IM = 1750;
  const sap = (c1, c2) => k.svg(`<path d="M12,34 C11,26 14,18 12,8" stroke="${c1}" stroke-width="2.2" fill="none" stroke-linecap="round"/>` +
    `<path d="M12,22 C6,21 3,16 3,12 C8,12 11,16 12,22Z M12,16 C18,15 21,10 21,6 C16,6 13,10 12,16Z" fill="${c2}"/>` +
    `<path d="M12,8 C9,5 10,2 12,1 C14,2 15,5 12,8Z" fill="#f4ffc0"/>`, 24, 34);
  const saps = [sap('#7fa845', '#b4dc6a'), sap('#6f9a3c', '#d6ee86'), sap('#7fa845', '#9ccc58')];
  const fl = [[IM - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [IM + 250, { transform: 'scale(1.9)', opacity: 0.6 }]];
  for (let t = IM + 450, i = 0; t < IM + 1000; t += 140, i++) fl.push([t, { transform: `scale(${i % 2 ? 1.5 : 1.25})`, opacity: i % 2 ? 0.5 : 0.38 }, eio]);
  fl.push([IM + 1500, { transform: 'scale(1)', opacity: 0 }]);
  fx(k.light('g-grow', [T[0], T[1] - 6], 60), fl);
  fx(k.light('g-grow', [T[0], T[1] - 4], 22), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.6)', opacity: 1 }], [IM + 200, { transform: 'scale(2.6)', opacity: 0 }]]);
  fx(k.pic(ring, [T[0], T[1] + 2], 56, 56), [[IM, { transform: 'scale(.15, .08)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(.4, .2)', opacity: 0.95 }, 'ease-out'], [IM + 620, { transform: 'scale(1.3, .6)', opacity: 0 }]]);
  fx(k.pic(ring, [T[0], T[1] + 2], 56, 56), [[IM + 110, { transform: 'scale(.1, .05)', opacity: 0 }, 'ease-out'], [IM + 170, { transform: 'scale(.3, .15)', opacity: 0.6 }, 'ease-out'], [IM + 700, { transform: 'scale(.9, .45)', opacity: 0 }]]);
  [[-12, 0, 26], [0, 55, 34], [12, 110, 27]].forEach(([dx, dly, hgt], i) => {
    const t = IM + 40 + dly, w = hgt * 0.7;
    const sw = (a) => `rotate(${a}deg)`;
    fx(k.pic(saps[i], [T[0] + dx, T[1] + 5], w, hgt, { base: true }), [[t, { transform: `scale(.1, .05) ${sw(0)}`, opacity: 0 }, 'ease-out'], [t + 230, { transform: `scale(1.1, 1.18) ${sw(-3)}`, opacity: 1 }, 'ease-out'], [t + 420, { transform: `scale(1, 1) ${sw(2)}`, opacity: 1 }, eio],
      [t + 800, { transform: `scale(1, 1) ${sw(-2.5)}`, opacity: 1 }, eio], [t + 1200, { transform: `scale(1, 1) ${sw(2)}`, opacity: 1 }, eio], [t + 1650, { transform: `scale(.9, .6) ${sw(0)}`, opacity: 0.8 }, 'ease-in'], [t + 1950, { transform: `scale(.3, .05) ${sw(0)}`, opacity: 0 }]]);
  });
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + rand() * 0.4, d = 14 + rand() * 20, t = IM + rand() * 40, life = 650 + rand() * 500, sz = 3 + rand() * 3.5, spin = (i % 2 ? 1 : -1) * 0.5;
    const px = (f) => Math.cos(a + spin * f) * d * (0.3 + f), py = (f) => Math.sin(a + spin * f) * d * 0.75 * (0.3 + f) - 10 * f * f;
    const ks = [0, 0.25, 0.6, 1].map((f, j) => [t + life * f, { transform: `${k.T(px(f), py(f) - 4)} scale(${(1.1 - 0.7 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']);
    fx(k.pic('mote', T, sz, sz), ks);
  }
  const leafA = k.svg('<path d="M10,1 C17,6 17,17 10,25 C3,17 3,6 10,1Z" fill="#5f7f3e"/><path d="M10,4 L10,22" stroke="#dff3a0" stroke-width=".9" fill="none"/>', 20, 26);
  const leafB = k.svg('<path d="M10,1 C17,6 17,17 10,25 C3,17 3,6 10,1Z" fill="#d6e89a"/><path d="M10,4 L10,22" stroke="#7e9a4c" stroke-width=".9" fill="none"/>', 20, 26);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + rand() * 0.5, d = 14 + rand() * 18, t = IM + 20 + rand() * 80, life = 900 + rand() * 500, r0 = Math.round(rand() * 360), sw = rand() < 0.5 ? 1 : -1;
    const ks = [0, 0.2, 0.5, 0.8, 1].map((f, j) => [t + life * f, { transform: `${k.T(Math.cos(a + sw * f) * d * (0.2 + f), Math.sin(a + sw * f) * d * 0.7 * (0.2 + f) + 14 * f * f - 6)} rotate(${Math.round(r0 + sw * 260 * f)}deg) scale(${(0.5 + 0.6 * Math.min(1, f * 5)).toFixed(2)})`, opacity: j === 0 || j === 4 ? 0 : 1 }, j ? 'linear' : 'ease-out']);
    fx(k.pic(i % 2 ? leafA : leafB, T, 6, 8, { lit: false }), ks);
  }
  for (let i = 0; i < 8; i++) {
    const t = IM + 350 + i * 110 + rand() * 60, p = [T[0] + (rand() - 0.5) * 24, T[1] + 2 + rand() * 6];
    fx(k.pic('mote', p, 4, 4), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 150, { transform: 'scale(1)', opacity: 1 }], [t + 1000, { transform: `${k.T((rand() - 0.5) * 8, -26 - rand() * 12)} scale(.3)`, opacity: 0 }]]);
  }
  // a little pollen lifts from the earth where she pressed the seed in
  for (let i = 0; i < 10; i++) {
    const t = 1300 + i * 120 + rand() * 60, p = [E[0] - 14 + rand() * 40, E[1] + rand() * 8];
    fx(k.picIn('mote', p, 4, 4), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 150, { transform: 'scale(1)', opacity: 1 }], [t + 900, { transform: `${k.T((rand() - 0.5) * 10, -20 - rand() * 16)} scale(.3)`, opacity: 0 }]]);
  }
}
