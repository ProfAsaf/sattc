// War Chest: the hoard wakes. The lantern flares, the heap sinks and then bursts up, throwing coins that
// spin up through the lantern light and rain back onto it; a ring of gold runs out over the whole tent
// and past its frame, the banners billow, and what the chest has won is invested: coins of light rise
// out of it, glinting, until the tent is calm again.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: aura (a relic: the place itself acts; as
// suggested), element: light (the gold of the coins and of the lantern). Not aimed: it swells over its own
// picture and spills past its frame.
//   0-560     the gather. The lantern's light swells, the hoard sinks a little and pulls tight, the red banner
//             leans in, a glow gathers at the heart of the heap.
//   650       RELEASE (BEATS.release): the hoard bursts up and a ring of gold runs out from the heart; coins
//             are thrown up out of it, spinning.
//   1050      IMPACT (BEATS.impact): the peak. The heap is at its height, hot; glints pop one after another
//             across it; a second ring; the tent wall flares; the banners billow.
//   1050-2400 the coins rain back into the heap, each with a small flash; the heap settles with a bounce or
//             two; coins of light (the investment) rise from it, glinting, and fade into the dark of the tent.
//   2400-3300 the lights die down, the banners and the pole stop swaying. BEATS.settle 3300; END 3800.
export const END = 3800;
export const BEATS = { release: 650, impact: 1050, settle: 3300 };
export const STILLS = [350, 700, 900, 1100, 1450, 1900, 2600, 3500];

const soft = (x, y) => Math.hypot(x - 0.5, y - 0.5) * 2;
export const textures = {
  coin: [32, 32, (x, y) => {
    const dx = (x - 0.5) * 2, dy = (y - 0.5) * 2, r = Math.hypot(dx, dy), a = Math.min(1, Math.max(0, (1 - r) * 8));
    const face = r < 0.68 ? 1 : 0, hi = Math.max(0, 1 - Math.hypot(dx + 0.35, dy + 0.4) * 1.5);
    const v = 0.55 + 0.25 * face + 0.5 * hi;
    return [Math.min(255, 255 * v + 20), Math.min(255, 196 * v + 16), Math.min(255, 70 * v + 10), a];
  }],
  mote: [16, 16, (x, y) => { const c = Math.max(0, 1 - soft(x, y)); return [255, 232, 160, Math.min(1, Math.pow(c, 0.8) * 1.5)]; }],
  hot: [16, 16, (x, y) => { const c = Math.max(0, 1 - soft(x, y)); return [255, 248, 220, Math.min(1, Math.pow(c, 0.8) * 1.6)]; }],
  star: [48, 48, (x, y) => {
    const dx = Math.abs(x - 0.5) * 2, dy = Math.abs(y - 0.5) * 2, c = Math.max(0, 1 - Math.hypot(dx, dy)), cr = Math.max(0, 1 - Math.min(dx * 9 + dy, dy * 9 + dx));
    const v = Math.min(1, c * c * 1.4 + cr * 0.9);
    return [255, 232 + 23 * v, 170 + 85 * v, v];
  }],
};

export function build(k) {
  const { act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  // (every effect's moments kept inside the move, in order)
  const fx = (el, list) => { let last = -1; k.fx(el, list.slice().sort((a, b) => a[0] - b[0]).map((e) => { last = Math.max(last + 1, Math.min(e[0], k.END - 1)); return [last, ...e.slice(1)]; })); };
  const S = k.spec, [HX, HY] = S.heart, [LX, LY] = S.lantern;
  k.css(`.f-hot { mix-blend-mode: plus-lighter; filter: brightness(1.7) saturate(1.3) sepia(.3); }
    .g-gold { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,252,236,.95), rgba(255,226,150,.6) 28%, rgba(255,196,100,.18) 58%, rgba(255,170,70,0) 100%); }`);
  const R0 = 650, PK = 1050;

  // ── the hoard: sinks and tightens, bursts up, bounces back down; a hot copy glows with it
  const hoardList = [[0, { transform: 'none' }, eio], [380, { transform: `${k.T(0, 1.4)} scale(1.035, .93)` }, 'ease-in'], [560, { transform: `${k.T(0, 1.8)} scale(1.04, .92)` }, 'ease-out'],
    [720, { transform: `${k.T(0, -6)} scale(.97, 1.09)` }, 'ease-out'], [900, { transform: `${k.T(0, -3.5)} scale(.99, 1.04)` }, eio], [1050, { transform: `${k.T(0, -5)} scale(.985, 1.07)` }, 'ease-in'],
    [1300, { transform: `${k.T(0, 1.2)} scale(1.03, .96)` }, 'ease-out'], [1520, { transform: `${k.T(0, -1.8)} scale(.99, 1.025)` }, eio], [1800, { transform: `${k.T(0, 0.5)} scale(1.01, .99)` }, eio],
    [2100, { transform: `${k.T(0, -0.6)} scale(1, 1.01)` }, eio], [2600, { transform: 'none' }]];
  act(k.part('hoard'), hoardList);
  const hot = (o) => hoardList.map(([t, f, e]) => [t, { ...f, opacity: o(t) }, e]);
  act(k.copy('hoard', 'f-hot'), hoardList.map(([t, f, e]) => [t, { ...f, opacity: t < 300 ? 0 : t < 560 ? 0.2 : t < 700 ? 0.55 : t < 1050 ? 0.7 : t < 1400 ? 0.45 : t < 2000 ? 0.2 : 0 }, e]));
  void hot;

  // ── the banners: the red one leans in, then swings and flutters; the blue one sways on its pole
  act(k.part('redflag'), [[0, { transform: 'none' }, eio], [450, { transform: 'rotate(2.5deg) skewX(2deg)' }, eio], [750, { transform: 'rotate(-6deg) skewX(-5deg)' }, eio], [1050, { transform: 'rotate(5deg) skewX(4deg)' }, eio],
    [1350, { transform: 'rotate(-3.5deg) skewX(-3deg)' }, eio], [1700, { transform: 'rotate(2.2deg) skewX(2deg)' }, eio], [2100, { transform: 'rotate(-1.2deg) skewX(-1deg)' }, eio], [2600, { transform: 'rotate(.4deg)' }, eio], [3100, { transform: 'none' }]]);
  act(k.part('blueflag'), [[0, { transform: 'none' }, eio], [650, { transform: 'rotate(.6deg)' }, eio], [950, { transform: 'rotate(-2.2deg)' }, eio], [1250, { transform: 'rotate(1.5deg)' }, eio], [1600, { transform: 'rotate(-1deg)' }, eio],
    [2000, { transform: 'rotate(.6deg)' }, eio], [2500, { transform: 'rotate(-.25deg)' }, eio], [3000, { transform: 'none' }]]);

  // ── the lantern flares as the chest wakes (a light over its glass), and the tent glows
  fx(k.lightIn('g-gold', [LX, LY + 2], 54, 54), [[100, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [560, { transform: 'scale(1.15)', opacity: 0.8 }, eio], [900, { transform: 'scale(1.5)', opacity: 1 }, eio],
    [1500, { transform: 'scale(1.25)', opacity: 0.75 }, eio], [2300, { transform: 'scale(1.1)', opacity: 0.4 }, eio], [3200, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.lightIn('g-gold', [HX, HY - 4], 190, 120), [[150, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [560, { transform: 'scale(.8)', opacity: 0.55 }, eio], [900, { transform: 'scale(1.1)', opacity: 0.85 }, eio],
    [1050, { transform: 'scale(1.2)', opacity: 1 }, eio], [1800, { transform: 'scale(1.1)', opacity: 0.6 }, eio], [2700, { transform: 'scale(.95)', opacity: 0.2 }, eio], [3300, { transform: 'scale(.8)', opacity: 0 }]]);
  // the wall flares at the peak, light thrown over the whole tent and past it
  fx(k.light('g-heal', [HX, HY - 10], 330, 220), [[R0 - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [PK, { transform: 'scale(1)', opacity: 0.5 }, eio], [1500, { transform: 'scale(1.06)', opacity: 0.35 }, eio], [2600, { transform: 'scale(1.1)', opacity: 0 }]]);
  // the glow gathering at the heart of the heap, bursting as it goes
  fx(k.pic('hot', [HX, HY], 26, 26, {}), [[200, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [560, { transform: 'scale(1)', opacity: 0.9 }, 'ease-in'], [R0 + 50, { transform: 'scale(2.4)', opacity: 1 }, 'ease-out'], [PK + 300, { transform: 'scale(3.2)', opacity: 0 }]]);

  // ── the rings of gold running out (the second is bigger and slower), over the tent and past its frame
  const ring = k.svg('<ellipse cx="60" cy="60" rx="54" ry="54" fill="none" stroke="#ffe39a" stroke-width="7" opacity=".3"/><ellipse cx="60" cy="60" rx="54" ry="54" fill="none" stroke="#fff6d8" stroke-width="2.4"/>', 120, 120);
  [[R0, 1, 90], [PK - 20, 0.75, 130]].forEach(([t, o, sz], i) => fx(k.pic(ring, [HX, HY + 2], sz, sz * 0.55, {}), [[t, { transform: 'scale(.12)', opacity: 0 }, 'ease-out'], [t + 90, { transform: 'scale(.3)', opacity: o }, 'ease-out'], [t + 900 + i * 300, { transform: 'scale(2.9)', opacity: 0 }]]));

  // ── a coin: thrown from (x0, y0) at t0, up to a height H and back down to where it started over `dur` ms, drifting `drift` units
  //    sideways, spinning (it goes edge-on twice a turn); the far ones fly on the overlay, past the frame
  const flight = (x0, y0, H, drift, t0, dur, size, spin, over) => {
    const list = [], N = Math.max(8, Math.round(dur / 60)), T = dur / 1000;
    for (let i = 0; i <= N; i++) {
      const f = i / N, t = f * T, y = -4 * H * f * (1 - f), flip = Math.abs(Math.cos(spin * t * Math.PI * 2));
      list.push([t0 + Math.round(f * dur), { transform: `${k.T(drift * f, y)} scale(${(0.6 + 0.4 * Math.min(1, i / 2)).toFixed(2)}, ${(0.2 + 0.8 * flip).toFixed(2)}) rotate(${Math.round(f * spin * 60)}deg)`, opacity: i === 0 || i === N ? 0 : 1 }, 'linear']);
    }
    fx(over ? k.pic('coin', [x0, y0], size, size, { lit: false }) : k.picIn('coin', [x0, y0], size, size, { lit: false }), list);
  };
  for (let i = 0; i < 30; i++) {
    const x0 = 112 + rand() * 90, y0 = 128 + rand() * 12, H = 28 + rand() * 62, drift = (x0 - HX) * 0.9 + (rand() - 0.5) * 30;
    flight(x0, y0, H, drift, R0 + 20 + Math.round(rand() * 380), Math.round(560 + H * 7 + rand() * 200), 6.5 + rand() * 3, 1.2 + rand() * 1.6, i % 4 === 0);
  }
  // little flashes where coins land: glints on the heap in turn
  for (let i = 0; i < 12; i++) {
    const t = 1100 + i * 120 + Math.round(rand() * 80), x = 112 + rand() * 90, y = 126 + rand() * 14, s = 7 + rand() * 6;
    fx(k.picIn('star', [x, y], s, s, {}), [[t, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [t + 120, { transform: 'scale(1) rotate(20deg)', opacity: 1 }, eio], [t + 480, { transform: 'scale(.3) rotate(50deg)', opacity: 0 }]]);
  }
  // at the peak the glints pop one after another across the hoard
  for (let i = 0; i < 9; i++) {
    const t = 850 + i * 55 + Math.round(rand() * 30), x = 114 + i * 10 + (rand() - 0.5) * 8, y = 128 + (rand() - 0.5) * 12, s = 10 + rand() * 9;
    fx(k.picIn('star', [x, y], s, s, {}), [[t, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [t + 140, { transform: 'scale(1.1) rotate(25deg)', opacity: 1 }, eio], [t + 560, { transform: 'scale(.3) rotate(60deg)', opacity: 0 }]]);
  }
  // the lantern's own star
  fx(k.pic('star', [LX, LY + 2], 26, 26, {}), [[500, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(1.1) rotate(30deg)', opacity: 1 }, eio], [1500, { transform: 'scale(.7) rotate(50deg)', opacity: 0.7 }, eio], [2300, { transform: 'scale(.2) rotate(70deg)', opacity: 0 }]]);

  // ── the investment: coins of light rise out of the heap, glinting, and fade into the dark of the tent
  for (let i = 0; i < 11; i++) {
    const t0 = 1250 + i * 150 + Math.round(rand() * 90), x = 116 + rand() * 80, y = 130 + rand() * 6, rise = 36 + rand() * 38, dx = (rand() - 0.5) * 22, s = 4.5 + rand() * 2.5;
    fx(k.pic('coin', [x, y], s, s, { lit: true }), [[t0, { transform: `${k.T(0, 0)} scale(.4, .3)`, opacity: 0 }, 'ease-out'], [t0 + 220, { transform: `${k.T(dx * 0.2, -rise * 0.25)} scale(1, 1)`, opacity: 0.95 }, 'linear'],
      [t0 + 700, { transform: `${k.T(dx * 0.6, -rise * 0.7)} scale(.9, .45)`, opacity: 0.85 }, 'linear'], [t0 + 1100, { transform: `${k.T(dx, -rise)} scale(.8, 1)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 16; i++) {
    const a = rand() * Math.PI * 2, r = 6 + rand() * 40, t0 = 700 + Math.round(rand() * 1400), sz = 2 + rand() * 2.4, rise = 14 + rand() * 30;
    const x = HX + Math.cos(a) * r * 1.4, y = HY - 4 + Math.sin(a) * r * 0.5;
    fx(k.pic(i % 3 ? 'mote' : 'star', [x, y], i % 3 ? sz : sz * 3.5, i % 3 ? sz : sz * 3.5, {}), [[t0, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 240, { transform: `${k.T(0, -rise * 0.2)} scale(1)`, opacity: 0.95 }, 'linear'],
      [t0 + 900, { transform: `${k.T((rand() - 0.5) * 8, -rise)} scale(.6)`, opacity: 0 }]]);
  }
}
