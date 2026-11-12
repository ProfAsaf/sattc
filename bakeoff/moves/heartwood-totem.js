// Heartwood Totem: the heart-knot draws the glade's light in, swells, and gives it back to the
// creature that needs it: a pulse of green light runs out through the glade, past the card's edges.
//
// PLAN (drawing units 300 x 210, ms of the move). Role aura (a relic, so the place itself acts: its boon,
// +1/+1 for the weakest creature, goes out all round, not at one point), element nature.
//   0-950     SWELL: motes of light stream in from the glade to the heart-knot; it draws in and beats
//             faster, three beats, each bigger; the owl's eyes and the carved face at the foot kindle;
//             the wings fold in a little, the sprout bends toward the heart.
//   1000      RELEASE: the heart flares to half again its size, the wings throw up wide, the sprout
//             whips upright; two rings of light run out from the heart across the glade and past the card,
//             light brightens in the shafts and on the moss, the leaf tips flash one after another.
//   1500      IMPACT: the second, bigger flare; leaves burst from the sprout; motes and leaves stream out
//             both sides, on and past the frame, and a column of light rises from the crown.
//   1500-3700 CALM: the heart settles through slow swells, the wings fold back with a flutter and a
//             couple of swings, the sprout sways, the light fades, the little visitor's ears twitch twice;
//             at rest as drawn from 3700 (END 4200).
import { kit } from './_fx.js';
export const END = 4200;
export const BEATS = { release: 1000, impact: 1500, settle: 3700 };
export const STILLS = [350, 800, 1000, 1150, 1500, 1900, 2800, 3900];
export const textures = {
  mote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [236, 255, 170 + 50 * c, Math.min(1, c * c * c * 2.4)]; }],
  star: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); const ax = Math.abs(x - 0.5) * 2, ay = Math.abs(y - 0.5) * 2, ray = Math.max(0, 1 - Math.min(ax, ay) * 9) * Math.max(0, 1 - Math.max(ax, ay)); return [240, 255, 190 + 55 * c * c, Math.min(1, c * c * c * 1.6 + ray * 0.85)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  k.css('.g-leaf { border-radius: 50%; background: radial-gradient(circle, rgba(252,255,214,.95), rgba(214,240,120,.55) 30%, rgba(150,208,72,.2) 55%, rgba(120,190,50,0) 72%); }');
  const S = k.spec, H = S.heart, [EL, ER] = S.eyes, FACE = S.face, CROWN = S.crown;

  // ── the parts: `rot` (deg) about each one's own joint
  const R = (d, s = 1, sy = s) => ({ transform: `rotate(${d}deg) scale(${s}, ${sy})` });
  const wing = (sign, dly) => [[0, R(0), eio], [380 + dly, R(sign * 2), eio], [680 + dly, R(sign * -3), eio], [950 + dly, R(sign * -5), 'ease-in'], [1100 + dly, R(sign * 17), 'ease-out'], [1260 + dly, R(sign * 11), eio],
    [1520 + dly, R(sign * 15), eio], [1900 + dly, R(sign * 8), eio], [2250 + dly, R(sign * 10), eio], [2650 + dly, R(sign * 3.5), eio], [3000 + dly, R(sign * -1.6), eio], [3350 + dly, R(sign * 0.6), eio], [3700, R(0)]];
  const wl = wing(1, 0), wr = wing(-1, 35);
  act(k.part('wingL'), wl); act(k.part('linesL'), wl);
  act(k.part('wingR'), wr); act(k.part('linesR'), wr);
  act(k.part('sprout'), [[0, R(0), eio], [420, R(-3), eio], [800, R(-5, 1, 0.97), eio], [1010, R(-4, 1, 0.96), 'ease-in'], [1130, R(9, 1.04, 1.12), 'ease-out'], [1330, R(-6, 1, 1.02), eio], [1700, R(5), eio], [2150, R(-3), eio], [2700, R(1.8), eio], [3200, R(-0.7), eio], [3700, R(0)]]);
  const hs = (s) => ({ transform: `scale(${s})` });
  act(k.part('heart'), [[0, hs(1), eio], [260, hs(0.95), eio], [470, hs(1.07), eio], [640, hs(0.95), eio], [800, hs(1.12), eio], [930, hs(0.92), 'ease-in'], [1010, hs(1.45), 'ease-out'], [1190, hs(1.16), eio], [1500, hs(1.38), 'ease-out'], [1720, hs(1.08), eio],
    [2050, hs(1.17), eio], [2450, hs(1.03), eio], [2950, hs(1.08), eio], [3350, hs(0.995), eio], [3700, hs(1)]]);
  act(k.part('ears'), [[0, R(0), eio], [1650, R(0), eio], [1740, R(9), eio], [1830, R(-5), eio], [1930, R(0), eio], [2150, R(0), eio], [2230, R(-8), eio], [2330, R(5), eio], [2430, R(0)]]);

  // ── the heart's light on the trunk: beats with it
  const beat = [[0, { transform: 'scale(.9)', opacity: 0 }, 'ease-out'], [260, { transform: 'scale(.85)', opacity: 0.2 }, eio], [470, { transform: 'scale(1)', opacity: 0.45 }, eio], [640, { transform: 'scale(.9)', opacity: 0.25 }, eio], [800, { transform: 'scale(1.1)', opacity: 0.6 }, eio], [930, { transform: 'scale(.9)', opacity: 0.3 }, 'ease-in'],
    [1010, { transform: 'scale(1.3)', opacity: 0.85 }, 'ease-out'], [1190, { transform: 'scale(1.05)', opacity: 0.5 }, eio], [1500, { transform: 'scale(1.4)', opacity: 0.9 }, 'ease-out'], [1720, { transform: 'scale(1.3)', opacity: 0.55 }, eio], [2050, { transform: 'scale(1.5)', opacity: 0.6 }, eio], [2450, { transform: 'scale(1.2)', opacity: 0.35 }, eio], [2950, { transform: 'scale(1.3)', opacity: 0.35 }, eio], [3450, { transform: 'scale(1)', opacity: 0 }]];
  fx(k.lightIn('g-leaf', H, 76, 76), beat);
  fx(k.lightIn('g-leaf', [H[0], H[1] + 6], 34, 34), [[800, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1010, { transform: 'scale(1)', opacity: 0.6 }, 'ease-out'], [1190, { transform: 'scale(.8)', opacity: 0.3 }, eio], [1500, { transform: 'scale(1.1)', opacity: 0.7 }, 'ease-out'], [1900, { transform: 'scale(1)', opacity: 0.3 }, eio], [2600, { transform: 'scale(.6)', opacity: 0 }]]);
  // light lifting through the whole glade: the shafts brighten, the moss glows
  fx(k.lightIn('g-leaf', [150, 90], 360, 250), [[500, { opacity: 0 }, 'ease-out'], [1020, { opacity: 0.28 }, 'ease-out'], [1500, { opacity: 0.45 }, 'ease-out'], [2200, { opacity: 0.3 }, eio], [3300, { opacity: 0 }]]);
  fx(k.lightIn('g-leaf', [150, 184], 230, 40), [[600, { opacity: 0 }, 'ease-out'], [1050, { opacity: 0.8 }, 'ease-out'], [1550, { opacity: 0.9 }, eio], [2600, { opacity: 0.35 }, eio], [3500, { opacity: 0 }]]);

  // ── eyes of the owl and the face at the foot kindle
  for (const [P, big] of [[EL, 1], [ER, 1], [FACE, 0.0]]) {
    if (!big) continue;
    fx(k.lightIn('g-leaf', P, 15, 15), [[560, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(.9)', opacity: 0.6 }, eio], [1020, { transform: 'scale(1.7)', opacity: 1 }, 'ease-out'], [1250, { transform: 'scale(1.2)', opacity: 0.7 }, eio], [1500, { transform: 'scale(1.6)', opacity: 1 }, 'ease-out'], [2300, { transform: 'scale(1)', opacity: 0.5 }, eio], [3200, { transform: 'scale(.5)', opacity: 0 }]]);
  }
  for (const dx of [-7.5, 7.5]) {
    fx(k.lightIn('g-leaf', [FACE[0] + dx, FACE[1]], 11, 11), [[700, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1040, { transform: 'scale(1.3)', opacity: 0.9 }, 'ease-out'], [1500, { transform: 'scale(1.5)', opacity: 1 }, eio], [2500, { transform: 'scale(1)', opacity: 0.4 }, eio], [3300, { transform: 'scale(.4)', opacity: 0 }]]);
  }

  // ── 0-950 swell: motes of light streaming in from the glade to the heart
  for (let i = 0; i < 26; i++) {
    const t0 = 80 + i * 32 + rand() * 25, dur = 560 + rand() * 180, sz = 3 + rand() * 3.5, a = rand() * Math.PI * 2, r0 = 48 + rand() * 70;
    const from = [H[0] + Math.cos(a) * r0 * 1.5, H[1] + Math.sin(a) * r0 * 0.85], ks = [];
    for (let j = 0; j <= 5; j++) {
      const f = j / 5, g = f * f * (3 - 2 * f), sp = (1 - g) * Math.sin(f * 6 + i) * 6;
      ks.push([t0 + dur * f, { transform: `${k.T((H[0] - from[0]) * g + sp, (H[1] - from[1]) * g)} scale(${(0.5 + 0.8 * Math.sin(Math.PI * f)).toFixed(2)})`, opacity: j === 0 || j === 5 ? 0 : 1 }, 'linear']);
    }
    fx(k.picIn('mote', from, sz, sz), ks);
  }

  // ── 1000 release, 1500 impact: rings of light run out from the heart, across the glade and past the card
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#e6ff9c" stroke-width="5" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#fbffe4" stroke-width="1.2"/>', 100, 100);
  for (const [t, sz, to, o] of [[1000, 60, 4.2, 0.95], [1120, 50, 3.3, 0.6], [1500, 60, 5.4, 1], [1640, 50, 4.2, 0.65]]) {
    fx(k.pic(ring, H, sz, sz), [[t, { transform: 'scale(.12)', opacity: 0 }, 'ease-out'], [t + 70, { transform: 'scale(.4)', opacity: o }, 'ease-out'], [t + 950, { transform: `scale(${to})`, opacity: 0 }]]);
  }
  // the leaf tips flash one after another
  const tips = [[146, 8], [92, 55], [208, 55], [182, 80], [120, 132], [200, 164]];
  tips.forEach(([x, y], i) => {
    const t = 1060 + i * 95, big = i < 5 ? 1 : 0.7;
    fx(k.pic('star', [x, y], 18 * big, 18 * big), [[t, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [t + 110, { transform: 'scale(1.3) rotate(40deg)', opacity: 1 }, 'ease-out'], [t + 500, { transform: 'scale(.6) rotate(100deg)', opacity: 0 }]]);
    fx(k.lightIn('g-leaf', [x, y], 24, 24), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 130, { transform: 'scale(1.3)', opacity: 0.9 }, 'ease-out'], [t + 800, { transform: 'scale(.8)', opacity: 0 }]]);
  });
  // leaves burst from the sprout on the crown, and a column of light rises from it
  const leafA = k.svg('<path d="M10,1 C17,6 17,17 10,25 C3,17 3,6 10,1Z" fill="#5f7f3e"/><path d="M10,4 L10,22" stroke="#dff3a0" stroke-width=".9" fill="none"/>', 20, 26);
  const leafB = k.svg('<path d="M10,1 C17,6 17,17 10,25 C3,17 3,6 10,1Z" fill="#d6e89a"/><path d="M10,4 L10,22" stroke="#7e9a4c" stroke-width=".9" fill="none"/>', 20, 26);
  const leafC = k.svg('<path d="M10,1 C17,6 17,17 10,25 C3,17 3,6 10,1Z" fill="#9cc85a"/><path d="M10,4 L10,22" stroke="#effcb8" stroke-width=".9" fill="none"/>', 20, 26);
  const leaves = [leafA, leafB, leafC];
  const TOP = [150, 12];
  for (let i = 0; i < 14; i++) {
    const a = -Math.PI * (0.08 + rand() * 0.84), sp = 22 + rand() * 38, t = 1500 + rand() * 80, life = 1100 + rand() * 700, r0 = Math.round(rand() * 360), sw = rand() < 0.5 ? 1 : -1, sz = 6 + rand() * 4;
    const px = (f) => Math.cos(a) * sp * Math.min(1, f * 2.4) + sw * Math.sin(f * 8 + i) * 4 * f, py = (f) => Math.sin(a) * sp * 0.8 * Math.min(1, f * 2.4) + 78 * f * f;
    fx(k.pic(leaves[i % 3], TOP, sz, sz * 1.3, { lit: false }), [0, 0.15, 0.45, 0.75, 1].map((f, j) => [t + life * f, { transform: `${k.T(px(f), py(f))} rotate(${Math.round(r0 + sw * 380 * f)}deg) scale(${(0.5 + 0.6 * Math.min(1, f * 6)).toFixed(2)})`, opacity: j === 0 || j === 4 ? 0 : 1 }, j ? 'linear' : 'ease-out']));
  }
  fx(k.lightIn('g-leaf', [CROWN[0], CROWN[1] - 8], 30, 80), [[1450, { transform: 'scale(.4, .3)', opacity: 0 }, 'ease-out'], [1560, { transform: 'scale(1, 1)', opacity: 0.9 }, 'ease-out'], [2200, { transform: 'scale(1.2, 1.2)', opacity: 0.4 }, eio], [2900, { transform: 'scale(.8, 1)', opacity: 0 }]]);

  // ── 1000-2400: the boon streams out both sides, on and past the frame: motes and leaves
  for (let i = 0; i < 26; i++) {
    const side = i % 2 ? 1 : -1, t0 = 1000 + (i >> 1) * 75 + rand() * 50, t1 = t0 + 1100 + rand() * 500, sz = 3.5 + rand() * 3.5;
    const to = [H[0] + side * (190 + rand() * 60), 50 + rand() * 110], c = [(H[0] + to[0]) / 2, Math.min(H[1], to[1]) - 26 - rand() * 24], ks = [], n = 8;
    for (let j = 0; j <= n; j++) {
      const f = j / n, g = f * f * 0.5 + f * 0.5, q = 1 - g, x = q * q * H[0] + 2 * q * g * c[0] + g * g * to[0], y = q * q * H[1] + 2 * q * g * c[1] + g * g * to[1];
      ks.push([t0 + (t1 - t0) * f, { transform: `${k.T(x - H[0], y - H[1])} scale(${(0.6 + 0.7 * Math.sin(Math.PI * Math.min(1, f * 1.05))).toFixed(2)})`, opacity: j === 0 ? 0 : j === n ? 0 : 0.95 }, 'linear']);
    }
    fx(k.pic('mote', H, sz, sz), ks);
  }
  for (let i = 0; i < 10; i++) {
    const side = i % 2 ? 1 : -1, t0 = 1100 + (i >> 1) * 140 + rand() * 60, t1 = t0 + 1500 + rand() * 500, sz = 6 + rand() * 3, r0 = Math.round(rand() * 360);
    const to = [H[0] + side * (180 + rand() * 60), 90 + rand() * 80], c = [(H[0] + to[0]) / 2, 40 + rand() * 30], ks = [], n = 10;
    for (let j = 0; j <= n; j++) {
      const f = j / n, q = 1 - f, x = q * q * H[0] + 2 * q * f * c[0] + f * f * to[0], y = q * q * H[1] + 2 * q * f * c[1] + f * f * to[1];
      ks.push([t0 + (t1 - t0) * f, { transform: `${k.T(x - H[0], y - H[1])} rotate(${Math.round(r0 + f * 540 * side)}deg) scale(${(0.5 + 0.6 * Math.min(1, f * 6)).toFixed(2)})`, opacity: j === 0 ? 0 : j === n ? 0 : 1 }, 'linear']);
    }
    fx(k.pic(leaves[i % 3], H, sz, sz * 1.3, { lit: false }), ks);
  }
  // motes rising slowly off the moss and the trunk while it calms
  for (let i = 0; i < 14; i++) {
    const t = 1500 + i * 100 + rand() * 80, p = [100 + rand() * 100, 120 + rand() * 62];
    fx(k.picIn('mote', p, 4, 4), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 180, { transform: 'scale(1)', opacity: 1 }], [t + 1100, { transform: `${k.T((rand() - 0.5) * 14, -30 - rand() * 24)} scale(.3)`, opacity: 0 }]]);
  }
}
