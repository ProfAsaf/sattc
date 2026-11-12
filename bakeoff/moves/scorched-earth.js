// Scorched Earth: the burnt plain breathes, and a wave of heat runs across it.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: aura (a Field: the place itself
// acts), element: fire (as suggested).
//   0-1000    the swell. The ground draws heat: the cracks beat like a slow pulse (three
//             beats, each closer and stronger), the sun dims behind thickening smoke, the
//             far fires' smoke columns thicken, embers lift off the ash, the light in the
//             haze deepens. The snapped trunk's inner fire starts to lick.
//   1000      RELEASE: the trunk's heart flares white at its roots and a shock of heat runs out
//             along the plain, a flat ring racing to each edge and past it. The trunk jolts.
//   1000-1700 the wave passes each crack, stump and far trunk in its time: the crack flares,
//             a tongue of flame stands up from it, sparks leap, the stumps shudder; the
//             trunk's fire roars out of its crown; embers are torn off the ground and
//             blown on the wind, away from the trunk.
//   1600      IMPACT (the peak): the whole plain glows, the light spilling past the frame, the
//             sun flares through the haze; smoke columns surge up and lean on the wind.
//   1700-3600 it drops back: flames sink, cracks beat slower and fainter, the light drains
//             out of the haze, embers go on drifting, smoke rolls away, the sun clears.
//   3600      at rest as drawn (BEATS.settle); the move ends at END.
//
// The contract (bakeoff/recipe.md): an aura isn't aimed; its move spreads over its picture
// and past its frame (the wave and the light run out beyond it).
export const END = 4300;
export const BEATS = { release: 1000, impact: 1600, settle: 3600 };
export const STILLS = [500, 950, 1150, 1350, 1600, 2000, 2900, 4000];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, h = Math.max(0, 1 - r); return [255, 200 + 55 * h * h, 110 + 130 * h * h * h, Math.min(1, h * h * 1.8)]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, B = S.base, REL = 1000, PEAK = 1600;
  k.css(`.g-white { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,252,232,.98), rgba(255,226,150,.6) 30%, rgba(255,150,60,.2) 62%, rgba(255,120,40,0) 100%); }`);
  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  const grid = [];
  for (let t = 0; t <= 3600; t += 40) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3700, { transform: 'none' }]];
  // when the wave reaches a point: it runs from the trunk's roots, flatter than it is wide
  const arrive = (x, y) => Math.round(REL + 3.1 * Math.hypot(x - B[0], (y - B[1]) * 1.7));
  const beat = (t, b, w = 140) => (t < b ? 0 : t - b < 60 ? (t - b) / 60 : Math.exp(-(t - b - 60) / w));
  const slow = [[260, 0.5], [640, 0.7], [900, 1]];                       // the swell's heartbeats, each harder
  const after = [[2150, 0.55], [2650, 0.35], [3150, 0.2]];                // and the ones after the wave
  const pulse = (t) => slow.concat(after).reduce((s, [b, a]) => s + a * beat(t, b), 0);

  // ── the cracks: they beat with the heat, flare as it passes, and quieten
  act(k.part('cracks'), sample((t) => ({ transform: `scale(${(1 + 0.012 * pulse(t)).toFixed(4)})`, opacity: +Math.min(1, 0.82 + 0.18 * Math.min(1, pulse(t) * 1.3 + (t > REL && t < 2300 ? 0.5 : 0))).toFixed(3) })).map((f, i, a) => i === a.length - 1 ? [3700, { transform: 'none', opacity: 1 }] : f));
  // ── the sun: dims as the smoke thickens, flares through the haze at the peak, clears
  const SUN = curve([[0, 1], [800, 0.82], [1000, 0.78], [1450, 1.1], [1600, 1.16], [2200, 0.9], [3000, 0.97], [3600, 1]]);
  act(k.part('sun'), sample((t) => ({ transform: `scale(${(0.985 + 0.015 * SUN(t) + (SUN(t) > 1 ? (SUN(t) - 1) * 0.15 : 0)).toFixed(4)})`, opacity: +Math.min(1, SUN(t)).toFixed(3) })));
  // ── the trunk: jolts as the shock leaves it, shudders; its inner fire swells, roars and sinks
  const jolt = (t) => (t > REL + 20 && t < 2200 ? 1.3 * Math.exp(-(t - REL - 20) / 380) * Math.sin((t - REL) / 24) : 0);
  act(k.part('trunk'), sample((t) => ({ transform: `rotate(${jolt(t).toFixed(3)}deg)` })));
  const FY = curve([[0, 1], [500, 1.04], [900, 1.12], [1000, 1.08], [1060, 1.5], [1500, 1.38], [2200, 1.1], [3000, 1.02], [3600, 1]]);
  const flick = (t) => (t > 500 && t < 3000 ? 0.07 * Math.sin(t / 57) * sm(Math.min(1, (t - 500) / 300)) * Math.min(1, (3000 - t) / 500) : 0);
  act(k.part('fire'), sample((t) => ({ transform: `scale(${(1 + (FY(t) - 1) * 0.35 + flick(t) * 0.5).toFixed(4)}, ${(FY(t) + flick(t)).toFixed(4)})` })));
  // ── the stumps: shudder as the wave goes by
  const shudder = (t) => (t > arrive(160, 150) && t < 2300 ? 0.9 * Math.exp(-(t - arrive(160, 150)) / 260) * Math.sin(t / 19) : 0);
  act(k.part('stumps'), sample((t) => ({ transform: `${k.T(shudder(t) * 0.5, -Math.abs(shudder(t)) * 0.6)} rotate(${(shudder(t) * 0.6).toFixed(3)}deg)` })));

  // ── the light: the haze deepens, the whole plain glows at the peak, and it spills past the frame
  const GLOW = curve([[0, 0], [500, 0.25], [950, 0.5], [1100, 0.65], [1600, 1], [2200, 0.65], [3000, 0.2], [3600, 0]]);
  const light = (el, mulOp, mulSc) => el && fx(el, [...grid.filter((t) => t >= 40).map((t) => [t, { transform: `scale(${(0.85 + mulSc * GLOW(t)).toFixed(3)})`, opacity: +Math.min(1, GLOW(t) * mulOp).toFixed(3) }, 'linear']), [3700, { transform: 'scale(.85)', opacity: 0 }]]);
  light(k.lightIn('g-warm', [150, 135], 380, 150), 0.45, 0.15);        // the haze at the horizon
  light(k.lightIn('g-warm', [150, 175], 330, 160), 0.3, 0.2);      // the plain
  light(k.light('g-warm', [150, 150], 520, 330, { low: true }), 0.22, 0.25);   // spilling past the frame
  // the trunk's heart, white-hot at the release, burning on
  fx(k.lightIn('g-white', [B[0], B[1] - 14], 70, 50), [[REL - 60, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [REL + 40, { transform: 'scale(1.4)', opacity: 1 }, 'ease-out'], [REL + 400, { transform: 'scale(1)', opacity: 0.35 }, eio], [2000, { transform: 'scale(.7)', opacity: 0 }]]);
  fx(k.lightIn('g-warm', [S.top[0], S.top[1] + 12], 80, 80), [[500, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [1060, { transform: 'scale(1.2)', opacity: 0.95 }, 'ease-out'], [1800, { transform: 'scale(1)', opacity: 0.6 }, eio], [3000, { transform: 'scale(.7)', opacity: 0.1 }, eio], [3500, { transform: 'scale(.6)', opacity: 0 }]]);
  // a flare on the sun
  fx(k.lightIn('g-warm', S.sun, 150, 150), [[900, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [1600, { transform: 'scale(1.1)', opacity: 0.9 }, 'ease-in-out'], [2600, { transform: 'scale(.8)', opacity: 0 }]]);

  // ── the shock: a flat ring of heat running out along the ground from the roots, past the frame
  const ringA = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1.2"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#ffb870" stroke-width="1.5" filter="url(#b)"/>', 60, 60);
  const ringB = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="3"/></filter></defs><circle cx="30" cy="30" r="25" fill="none" stroke="#ff8a3a" stroke-width="6" filter="url(#b)"/>', 60, 60);
  const wave = (src, t0, o, size = 40, dur = 1100, far = 10) => {
    const at = [B[0], B[1] - 8], S0 = (sx) => `scale(${sx.toFixed(2)}, ${(sx * 0.3).toFixed(2)})`;
    fx(k.pic(src, at, size, size, { low: true }), [[t0, { transform: S0(0.5), opacity: 0 }, 'ease-out'], [t0 + 50, { transform: S0(1), opacity: o }, 'linear'], [t0 + dur * 0.75, { transform: S0(far * 0.75), opacity: o * 0.7 }, 'linear'], [t0 + dur, { transform: S0(far), opacity: 0 }]]);
  };
  wave(ringA, REL, 0.9); wave(ringB, REL + 20, 0.4, 40, 1200); wave(ringA, REL + 130, 0.5, 40, 1000, 8);
  // the shock leaves the roots: a burst of light and sparks
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1"/></filter></defs><circle cx="30" cy="30" r="25" fill="none" stroke="#ffc878" stroke-width="2.6" filter="url(#b)"/>', 60, 60);
  fx(k.pic(ring, [B[0], B[1] - 14], 40, 40, { low: true }), [[REL, { transform: 'scale(.55)', opacity: 0 }, 'ease-out'], [REL + 40, { transform: 'scale(.8)', opacity: 0.9 }, 'ease-out'], [REL + 600, { transform: 'scale(3)', opacity: 0 }]]);
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI * (0.05 + 0.9 * rand()), dist = 14 + rand() * 38, g = 14 + rand() * 14, sz = 3 + rand() * 4, t0 = REL + Math.round(rand() * 80);
    fx(k.pic('spark', [B[0], B[1] - 18], sz, sz), [[t0, { transform: `${k.T(0, 0)} scale(.6)`, opacity: 0 }, 'ease-out'], [t0 + 40, { transform: `${k.T(Math.cos(a) * dist * 0.2, Math.sin(a) * dist * 0.2)} scale(1.1)`, opacity: 1 }, 'ease-out'], [t0 + 700, { transform: `${k.T(Math.cos(a) * dist, Math.sin(a) * dist + g)} scale(.3)`, opacity: 0 }]]);
  }

  // ── as the wave passes: each crack flares and throws up a tongue of flame and sparks; far trunks catch
  const standing = (x, y, w, h, on, off, tex) => {
    const F = [[on, { transform: 'scale(.6,.12)', opacity: 0 }, 'ease-out'], [on + 130, { transform: 'scale(1,1)', opacity: 0.95 }, eio]];
    for (let t = on + 130, j = 1; (t += 90 + rand() * 50) < off; j++) F.push([Math.round(t), { transform: `translateY(${(-rand() * 1.5).toFixed(1)}px) scale(${(1 - (j % 2 ? 0.08 : -0.08) - rand() * 0.06).toFixed(2)}, ${(1 + (j % 2 ? 0.14 : -0.14) + rand() * 0.1).toFixed(2)}) skewX(${((j % 2 ? 1 : -1) * (2 + rand() * 5)).toFixed(1)}deg)`, opacity: +(0.8 + rand() * 0.2).toFixed(2) }, eio]);
    F.push([Math.round(off + 280), { transform: 'scale(.5,.15)', opacity: 0 }]);
    fx(k.picIn(tex, [x, y], w, h, { base: true }), F);
  };
  const spots = S.cracks.concat([[40, 140], [252, 142], [176, 142], [196, 152], [250, 160], [30, 156]]);
  spots.forEach(([x, y], i) => {
    const t = arrive(x, y), big = i < S.cracks.length;
    // the crack's own light
    fx(k.lightIn('g-warm', [x, y], big ? 70 : 46, big ? 40 : 30), [[t - 90, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 70, { transform: 'scale(1.2)', opacity: 0.8 }, 'ease-out'], [t + 400, { transform: 'scale(1)', opacity: 0.5 }, eio], [2300 + (i % 4) * 130, { transform: 'scale(.8)', opacity: 0.3 }, eio], [3300, { transform: 'scale(.6)', opacity: 0 }]]);
    standing(x, y + 2, big ? 11 + rand() * 4 : 7 + rand() * 3, big ? 22 + rand() * 14 : 14 + rand() * 8, t + 20, 2000 + rand() * 500 + (i % 3) * 120, i % 2 ? 'flame' : 'flame2');
    for (let j = 0; j < 2; j++) {
      const a = -Math.PI * (0.15 + 0.7 * rand()), dist = 8 + rand() * 20, g = 10 + rand() * 12, sz = 2.6 + rand() * 3, t0 = t + Math.round(rand() * 80);
      fx(k.pic('spark', [x, y], sz, sz), [[t0, { transform: `${k.T(0, 0)} scale(.6)`, opacity: 0 }, 'ease-out'], [t0 + 40, { transform: `${k.T(Math.cos(a) * dist * 0.2, Math.sin(a) * dist * 0.2)} scale(1.1)`, opacity: 1 }, 'ease-out'], [t0 + 560, { transform: `${k.T(Math.cos(a) * dist, Math.sin(a) * dist + g)} scale(.3)`, opacity: 0 }]]);
    }
  });
  // the trunk's crown roars: tongues standing on its splintered top, sparks lifting off it
  [[-5, 14, 34], [0, 16, 44], [5, 13, 30]].forEach(([dx, w, h], i) => standing(S.top[0] + dx, S.top[1] + 14, w, h, REL + 80 + i * 70, 2200 + i * 260, i % 2 ? 'flame' : 'flame2'));
  for (let i = 0; i < 12; i++) {
    const t0 = REL + 100 + Math.round(rand() * 900), dx = 10 + rand() * 40, dy = -(20 + rand() * 38), sz = 2.6 + rand() * 3;
    fx(k.pic('spark', [S.top[0] + (rand() - 0.5) * 8, S.top[1] + 4], sz, sz), [[t0, { transform: `${k.T(0, 0)} scale(.5)`, opacity: 0 }, 'ease-out'], [t0 + 60, { transform: `${k.T(dx * 0.1, dy * 0.15)} scale(1)`, opacity: 1 }, 'ease-out'], [t0 + 900, { transform: `${k.T(dx, dy)} scale(.3)`, opacity: 0 }]]);
  }

  // ── embers lifted off the ash and blown on the wind, away from the trunk, from the moment the wave reaches them
  for (let i = 0; i < 34; i++) {
    const x = rand() * 300, y = 140 + rand() * 66, t0 = arrive(x, y) + Math.round(rand() * 250) - (i % 4 === 0 ? 700 : 0), sz = 2.4 + rand() * 3.4;
    const wd = (x >= B[0] ? 1 : -0.35) * (26 + rand() * 40), up = -(24 + rand() * 54), dur = 1100 + rand() * 700, sway = (rand() - 0.5) * 12, st = Math.max(300, t0);
    fx(k.pic('spark', [x, y], sz, sz), [[st, { transform: `${k.T(0, 0)} scale(.5)`, opacity: 0 }, 'ease-out'], [st + 100, { transform: `${k.T(wd * 0.06, up * 0.06)} scale(1)`, opacity: 0.95 }, 'ease-out'], [Math.round(st + dur * 0.55), { transform: `${k.T(wd * 0.5 + sway, up * 0.6)} scale(.85)`, opacity: 0.8 }, 'linear'], [Math.round(st + dur), { transform: `${k.T(wd, up)} scale(.3)`, opacity: 0 }]]);
  }
  // ── smoke: the far columns thicken during the swell and surge at the peak, leaning on the wind; the trunk's smoulders harder
  const cols = [[40, 128, 0.5], [252, 130, 0.6], [176, 134, 0.6], [S.top[0], S.top[1] - 2, 0.9]];
  cols.forEach(([x, y, lean], c) => {
    for (let i = 0; i < 4; i++) {
      const t = 250 + c * 110 + i * 420, r = Math.round(rand() * 360), big = c === 3 ? 30 : 36, drift = lean * 18 + 4;
      fx(k.pic('smoke', [x + (rand() - 0.5) * 6, y - 6], big, big, { lit: false, low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.6)`, opacity: 0 }, 'ease-out'], [t + 400, { transform: `${k.T(drift * 0.3, -12)} rotate(${r + 20}deg) scale(1)`, opacity: i < 2 ? 0.45 : 0.55 }], [t + 1500, { transform: `${k.T(drift, -52)} rotate(${r + 60}deg) scale(2)`, opacity: 0 }]]);
    }
  });
}
