// Hallowed Ground: the dawn in the gate swells and a hush of gold goes out over the ring.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: aura (a Field: the place itself acts; it isn't aimed),
// element: light (the suggestion was earth: the stones only hold the light; what the move is made of is the dawn).
//   0-800     the swell. The sun in the gate gathers and grows, its rays turn; the low stone in the middle lifts a
//             hair and its edge of light brightens; the stones take a faint gold along their lit edges; motes begin
//             to lift from the grass.
//   800-1900  the hush goes out: from the low stone three flat rings of gold run out over the grass, one after
//             another, each wider than the last, to and past the stones; as each reaches them the stones flare
//             (gold along the far ring, then the near pair), the grass bows in the wave, and columns of light
//             stand up in the gaps between the stones.
//   1900      PEAK (BEATS.impact): the last ring is at the frame's edge, the sun is flaring, a pale gold wash lies over
//             the whole picture, motes pour off the grass. (Nobody can attack the turn they arrive: the place is still.)
//   1900-3700 calm returns: the rings and columns fade, the wash drains, the stones cool, the grass lifts and
//             rests, the sun settles; the motes finish rising (BEATS.settle 3700); END 4200 at rest as drawn.
//
// The contract (bakeoff/recipe.md): an aura, so it isn't aimed: its move spreads over its picture and past its
// frame (the rings leave it on both sides). `hit` is the middle of the ring.
export const END = 4200;
export const BEATS = { release: 800, impact: 1900, settle: 3700 };
export const STILLS = [300, 800, 1200, 1600, 1950, 2500, 3200, 3900];

const soft = (x, y) => Math.hypot(x - 0.5, y - 0.5) * 2;
export const textures = {
  mote: [16, 16, (x, y) => { const c = Math.max(0, 1 - soft(x, y)); return [255, 236, 170, Math.min(1, Math.pow(c, 0.8) * 1.5)]; }],
  glint: [24, 24, (x, y) => { const c = Math.max(0, 1 - soft(x, y)), a = Math.max(0, 1 - Math.abs(x - 0.5) * 9) * Math.max(0, 1 - Math.abs(y - 0.5) * 2) + Math.max(0, 1 - Math.abs(y - 0.5) * 9) * Math.max(0, 1 - Math.abs(x - 0.5) * 2); return [255, 246, 210, Math.min(1, c * c * 1.4 + a * 0.9)]; }],
};

export function build(k) {
  const { act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const fx = (el, list) => { let last = -1; k.fx(el, list.slice().sort((a, b) => a[0] - b[0]).map((e) => { last = Math.max(last + 1, Math.min(e[0], k.END - 1)); return [last, ...e.slice(1)]; })); };
  k.css(`.g-hallow { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,240,190,.85), rgba(255,222,150,.42) 38%, rgba(255,210,130,.14) 70%, rgba(255,205,120,0) 100%); }
.fx-gold { filter: brightness(2.5) sepia(.7) saturate(2.2); }`);
  const sp = k.spec, [AX, AY] = sp.altar, [SX, SY] = sp.sun;
  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  const keys = []; for (let t = 0; t < 3700; t += 50) keys.push(t); keys.push(3700);

  // ── the low stone lifts a hair, its light brightening; the grass bows in the wave and lifts
  act(k.part('altar'), [[0, { transform: 'translateY(0px)' }, 'ease-out'], [700, { transform: 'translateY(-1.5px)' }, eio], [1900, { transform: 'translateY(-2px)' }, eio], [3000, { transform: 'translateY(-0.4px)' }, eio], [3700, { transform: 'translateY(0px)' }]]);
  const bow = curve([[0, 0], [1000, 0], [1400, 1], [1900, 0.5], [2500, -0.35], [3100, 0.12], [3700, 0]]);
  act(k.part('grass'), keys.map((t) => { const b = bow(t); return [t, { transform: `skewX(${(b * 1.6).toFixed(2)}deg) scale(1, ${(1 + 0.035 * Math.abs(b)).toFixed(3)})` }, 'linear']; }));
  // the stones breathe: the far ring and the near pair settle a hair as the light passes over them
  act(k.part('ring'), keys.map((t) => { const b = curve([[0, 0], [1100, 0], [1550, 1], [2100, 0.35], [2900, 0]])(t); return [t, { transform: `scale(${(1 + 0.006 * b).toFixed(4)})` }, 'linear']; }));
  act(k.part('near'), keys.map((t) => { const b = curve([[0, 0], [1300, 0], [1750, 1], [2300, 0.3], [3100, 0]])(t); return [t, { transform: `scale(${(1 + 0.005 * b).toFixed(4)})` }, 'linear']; }));
  // gold along the stones as the rings reach them: the far ring first, then the near pair
  const goldRing = k.copy('ring', 'fx-gold'), goldNear = k.copy('near', 'fx-gold');
  act(goldRing, keys.map((t) => { const b = curve([[0, 0], [500, 0.22], [1100, 0.3], [1550, 0.8], [1900, 0.6], [2500, 0.2], [3300, 0]])(t); return [t, { transform: `scale(${(1 + 0.006 * curve([[0, 0], [1100, 0], [1550, 1], [2100, 0.35], [2900, 0]])(t)).toFixed(4)})`, opacity: +b.toFixed(2) }, 'linear']; }));
  act(goldNear, keys.map((t) => { const b = curve([[0, 0], [900, 0.1], [1450, 0.2], [1850, 0.75], [2300, 0.45], [3000, 0.1], [3500, 0]])(t); return [t, { transform: `scale(${(1 + 0.005 * curve([[0, 0], [1300, 0], [1750, 1], [2300, 0.3], [3100, 0]])(t)).toFixed(4)})`, opacity: +b.toFixed(2) }, 'linear']; }));

  // ── the dawn in the gate: swells, flares at the peak, settles; its rays turn
  const burst = k.svg(`<g stroke="#fff2c4" stroke-linecap="round" fill="none">${Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2, r0 = 12, r1 = i % 2 ? 36 : 48, w = i % 2 ? 1.6 : 2.4; return `<path d="M${(50 + Math.cos(a) * r0).toFixed(1)} ${(50 + Math.sin(a) * r0).toFixed(1)}L${(50 + Math.cos(a) * r1).toFixed(1)} ${(50 + Math.sin(a) * r1).toFixed(1)}" stroke-width="${w}" opacity="${i % 2 ? 0.55 : 0.85}"/>`; }).join('')}</g>`, 100, 100);
  fx(k.lightIn('g-hallow', [SX, SY], 150, 150), [[0, { transform: 'scale(.8)', opacity: 0 }, 'ease-out'], [800, { transform: 'scale(1.1)', opacity: 0.7 }, eio], [1900, { transform: 'scale(1.55)', opacity: 1 }, eio], [2900, { transform: 'scale(1.15)', opacity: 0.35 }, eio], [3700, { transform: 'scale(.9)', opacity: 0 }]]);
  fx(k.pic(burst, [SX, SY], 90, 90, {}), [[200, { transform: 'rotate(0deg) scale(.55)', opacity: 0 }, 'ease-out'], [1000, { transform: 'rotate(20deg) scale(.95)', opacity: 0.5 }, eio], [1900, { transform: 'rotate(55deg) scale(1.3)', opacity: 0.85 }, eio], [3000, { transform: 'rotate(90deg) scale(1.05)', opacity: 0.2 }, eio], [3700, { transform: 'rotate(110deg) scale(.9)', opacity: 0 }]]);
  // the pale gold wash over the whole picture at the peak
  fx(k.lightIn('g-hallow', [150, 120], 380, 240), [[500, { opacity: 0 }, 'ease-out'], [1400, { opacity: 0.22 }, eio], [1900, { opacity: 0.4 }, eio], [2700, { opacity: 0.16 }, eio], [3600, { opacity: 0 }]]);
  // the low stone's own light
  fx(k.lightIn('g-hallow', [AX, AY - 1], 70, 22), [[300, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(1)', opacity: 0.9 }, eio], [1900, { transform: 'scale(1.3)', opacity: 1 }, eio], [3000, { transform: 'scale(1)', opacity: 0.4 }, eio], [3700, { transform: 'scale(.7)', opacity: 0 }]]);

  // ── the hush: flat rings of gold running out over the grass from the low stone, wider each time
  const ring = k.svg('<ellipse cx="60" cy="12" rx="56" ry="9" fill="none" stroke="#ffe39a" stroke-width="5" opacity=".28"/><ellipse cx="60" cy="12" rx="56" ry="9" fill="none" stroke="#fff3c8" stroke-width="2.2"/><ellipse cx="60" cy="12" rx="50" ry="7.8" fill="none" stroke="#fff8e0" stroke-width=".9" opacity=".7"/>', 120, 24);
  [[800, 2000, 1], [1150, 2150, 0.85], [1500, 2300, 0.7]].forEach(([t0, life, o]) => {
    const at = (f, op) => ({ transform: `${k.T(0, 0)} scale(${(0.12 + 3.4 * f).toFixed(3)})`, opacity: +(op * o).toFixed(2) });
    fx(k.picIn(ring, [AX, AY + 6], 120, 24, { lit: true }), [[t0, at(0, 0), 'ease-out'], [t0 + 160, at(0.06, 0.9), 'linear'], [t0 + life * 0.7, at(0.75, 0.7), 'ease-out'], [t0 + life, at(1, 0)]]);
    // the line of light the ring leaves on the grass, fading behind it
    fx(k.picIn(ring, [AX, AY + 6], 120, 24, { lit: true, under: true }), [[t0 + 120, at(0.04, 0), 'ease-out'], [t0 + 320, at(0.16, 0.45), 'linear'], [t0 + life * 0.75, at(0.8, 0.25)], [t0 + life + 200, at(1, 0)]]);
  });

  // ── columns of light standing up between the stones, over the grass inside the ring
  const gaps = [[78, 112], [114, 128], [186, 128], [222, 112], [150, 122]];
  gaps.forEach(([x, y], i) => {
    const t0 = 1000 + (i === 4 ? 0 : i % 4 * 110), hh = i === 4 ? 92 : 78;
    fx(k.picIn(k.svg(`<defs><linearGradient id="c${i}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff0b8" stop-opacity=".0"/><stop offset=".25" stop-color="#ffeaa0" stop-opacity=".55"/><stop offset=".8" stop-color="#ffe29a" stop-opacity=".16"/><stop offset="1" stop-color="#ffe29a" stop-opacity="0"/></linearGradient></defs><rect x="0" y="0" width="24" height="100" fill="url(#c${i})"/>`, 24, 100), [x, y + 40 - hh * 0.5], 14 + (i === 4 ? 6 : 0), hh, {}),
      [[t0, { transform: 'scaleY(.2) scaleX(.6)', opacity: 0 }, 'ease-out'], [t0 + 450, { transform: 'scaleY(1) scaleX(1)', opacity: i === 4 ? 0.8 : 0.65 }, eio], [1900, { transform: 'scaleY(1.05) scaleX(1.15)', opacity: i === 4 ? 0.9 : 0.75 }, eio], [2900, { transform: 'scaleY(1) scaleX(1.3)', opacity: 0.2 }, eio], [3500, { transform: 'scaleY(.8) scaleX(1.4)', opacity: 0 }]]);
  });

  // ── motes lifting off the grass in the wave, drifting and fading; glints on the stones' lit tops
  for (let i = 0; i < 34; i++) {
    const x = 30 + rand() * 240, y = 150 + rand() * 56, t0 = 700 + rand() * 2000, sz = 1.6 + rand() * 2.2, rise = 22 + rand() * 40, sway = (rand() - 0.5) * 14, life = 1400 + rand() * 900;
    fx(k.picIn('mote', [x, y], sz, sz, {}), [[t0, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 250, { transform: `${k.T(sway * 0.2, -rise * 0.2)} scale(1)`, opacity: 0.95 }, 'linear'],
      [t0 + life * 0.7, { transform: `${k.T(sway * 0.8, -rise * 0.75)} scale(.9)`, opacity: 0.7 }, 'linear'], [t0 + life, { transform: `${k.T(sway, -rise)} scale(.5)`, opacity: 0 }]]);
  }
  const tops = [[46, 76], [116, 96], [184, 96], [254, 76], [150, 66], [28, 66], [274, 70], [92, 90], [208, 90]];
  tops.forEach(([x, y], i) => {
    const t0 = 1250 + i * 120, sz = 9 + (i % 3) * 3;
    fx(k.picIn('glint', [x, y], sz, sz, {}), [[t0, { transform: 'rotate(0deg) scale(.3)', opacity: 0 }, 'ease-out'], [t0 + 220, { transform: 'rotate(25deg) scale(1.1)', opacity: 1 }, eio], [t0 + 700, { transform: 'rotate(60deg) scale(.4)', opacity: 0 }]]);
  });
}
