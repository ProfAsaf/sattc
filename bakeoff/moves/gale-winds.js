// Gale Winds: the gale off the sea breaks over the cliff.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: aura (a Field: the place itself acts; fields and relics
// are auras), element: wind (the suggestion was water: the sea is only where the wind comes from; what the
// picture is made of is the gale).
//   0-900     the swell. The wind picks up: long streaks race in from the right, past the frame; the lone tree bends
//             and thrashes, the gulls lean into it and are carried along, the great curl begins to turn faster.
//   900-1700  the gale breaks: the curl surges (grows, brightens, a lit copy pulses over it) and its eye spins with
//             gale arcs; spray is torn off the whitecaps; the kites are swept right round the curl's eye; seeds and
//             blades are flung off the cliff top; the sun flares.
//   1700      PEAK (BEATS.impact): the brightest moment, a pulse of pale light over the whole picture, a last
//             wave of streaks, the gulls at the end of their glide.
//   1700-3500 the wind eases: the curl settles back, the tree rocks to rest, the gulls glide home, the kites finish
//             their circle; the last streaks leave. (BEATS.settle 3500); END 4200 at rest as drawn.
//
// The contract (bakeoff/recipe.md): an aura, so it isn't aimed: its move spreads over its picture and past its
// frame (streaks and spray enter and leave beyond the edges). `hit` is the middle of the picture.
export const END = 4200;
export const BEATS = { release: 900, impact: 1700, settle: 3500 };
export const STILLS = [350, 800, 1100, 1400, 1700, 2100, 2800, 3900];

const soft = (x, y) => Math.hypot(x - 0.5, y - 0.5) * 2;
export const textures = {
  spray: [24, 24, (x, y) => { const c = Math.max(0, 1 - soft(x, y)); return [244, 255, 252, Math.min(1, c * 1.6)]; }],
  wisp: [48, 48, (x, y) => { const r = Math.hypot((x - 0.5) * 1.1, y - 0.5) * 2, n = 0.8 + 0.2 * Math.sin(x * 14 + y * 6) * Math.cos(y * 11 - x * 5); return [240, 255, 252, Math.pow(Math.max(0, 1 - r), 0.9) * n]; }],
  seed: [8, 8, (x, y) => { const c = Math.max(0, 1 - soft(x, y)); return [30, 70, 62, Math.min(1, c * 2.4)]; }],
};

export function build(k) {
  const { act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const fx = (el, list) => { let last = -1; k.fx(el, list.slice().sort((a, b) => a[0] - b[0]).map((e) => { last = Math.max(last + 1, Math.min(e[0], k.END - 1)); return [last, ...e.slice(1)]; })); };
  const sp = k.spec, EYE = sp.eye, EDGE = sp.edge;
  k.css(`.g-wind { border-radius: 50%; background: radial-gradient(closest-side, rgba(250,255,252,.8), rgba(210,248,244,.4) 35%, rgba(170,236,238,.14) 65%, rgba(160,230,235,0) 100%); }
.fx-curl { filter: brightness(2.4) saturate(.5); }`);
  const rad = (d) => (d * Math.PI) / 180;
  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  const keys = []; for (let t = 0; t < 3500; t += 50) keys.push(t); keys.push(3500, k.END - 1);
  const dedupe = (l) => l.filter((x, i, a) => i === 0 || x[0] > a[i - 1][0]);

  // ── the great curl: swells, surges at the break, settles; a lit copy pulses over it
  const curl = k.part('curl');
  const CS = curve([[0, 1], [500, 1.04], [900, 1.1], [1250, 1.22], [1700, 1.17], [2400, 1.08], [3300, 1]]);
  const CR = (t) => curve([[0, 0], [600, 1.2], [1000, -2.5], [1300, -5], [1700, -3.2], [2500, -1], [3400, 0]])(t) + 0.8 * Math.sin(t / 130) * Math.min(1, Math.max(0, (t - 500) / 400)) * Math.max(0, 1 - Math.max(0, t - 1800) / 1300);
  const CX = curve([[0, 0], [900, -2], [1300, -7], [1700, -5], [2500, -1.5], [3400, 0]]);
  const curlPose = (t) => ({ transform: `${k.T(CX(t), 0)} rotate(${CR(t).toFixed(2)}deg) scale(${CS(t).toFixed(3)})` });
  act(curl, keys.map((t) => [t, curlPose(t), 'linear']));
  const rim = k.copy('curl', 'fx-curl');
  const pulse = (t) => { let o = 0; for (const [c, a, w] of [[1250, 0.5, 520], [1700, 0.75, 650], [2150, 0.3, 450]]) o = Math.max(o, a * Math.max(0, 1 - Math.abs(t - c) / w)); return o; };
  act(rim, keys.map((t) => [t, { ...curlPose(t), opacity: +pulse(t).toFixed(2) }, 'linear']));

  // ── the tree: bends further and thrashes in the gusts, rocks to rest
  const TR = (t) => curve([[0, 0], [500, -3], [900, -5.5], [1250, -2], [1700, -6.5], [2200, -2], [2800, -0.6], [3500, 0]])(t) + 1.6 * Math.sin(t / 95) * Math.min(1, Math.max(0, (t - 300) / 500)) * Math.max(0, 1 - Math.max(0, t - 1700) / 1500);
  act(k.part('tree'), keys.map((t) => [t, { transform: `rotate(${TR(t).toFixed(2)}deg)` }, 'linear']));

  // ── the gulls: lean into the gale, are carried along and flap, glide home; each its own beat
  const G = sp.gulls;
  G.forEach(([x, y], i) => {
    const part = k.part(`gull${i}`), lag = i * 60 + (i % 3) * 40, dx = -(26 + (i % 4) * 9) * (i % 2 ? 1 : 1.15), dy = (i % 3 - 1) * 5 - 3, tilt = 7 - (i % 3) * 5;
    const pos = curve([[0, 0], [500 + lag, 0.12], [1300 + lag, 1], [1900 + lag, 0.86], [3000 + lag * 0.4, 0]]);
    const list = [];
    for (const t of keys) {
      const tt = Math.max(0, t - 0), p = pos(tt - lag > 0 ? tt - 0 : 0), flap = 1 - 0.42 * Math.max(0, Math.sin((t - 200 - lag) / (90 + i * 12))) * Math.min(1, Math.max(0, (t - 300) / 300)) * Math.max(0, 1 - Math.max(0, t - 2000 - lag) / 800);
      list.push([t, { transform: `${k.T(dx * p, dy * p + Math.sin(t / 210 + i) * 1.6 * p)} rotate(${(tilt * p).toFixed(1)}deg) scale(1, ${flap.toFixed(3)})` }, 'linear']);
    }
    act(part, list);
  });
  // ── the kites: swept in a circle round the curl's eye, kite 0 once, kite 1 once the other way round
  sp.kites.forEach(([x, y], i) => {
    const R = Math.hypot(x - EYE[0], y - EYE[1]), th0 = Math.atan2(y - EYE[1], x - EYE[0]), dir = i ? -1 : 1, t0 = 800 + i * 150, t1 = 2500 + i * 200;
    const sweep = curve([[t0, 0], [t0 + 250, 0.08], [t1 - 150, 0.92], [t1, 1]]);
    const list = [];
    for (const t of keys) {
      const f = sweep(t), th = th0 + dir * f * Math.PI * 2, Rr = R * (1 + 0.5 * Math.sin(f * Math.PI)) , px = EYE[0] + Rr * Math.cos(th), py = EYE[1] + Rr * Math.sin(th) * 0.9;
      list.push([t, { transform: `${k.T(px - x, py - y)} rotate(${(dir * f * 360).toFixed(1)}deg)` }, 'linear']);
    }
    act(k.part(`kite${i}`), list);
  });

  // ── the wind itself: long streaks racing in from the right, past the frame, in two waves (the second is the peak)
  const streak = (w) => k.svg(`<path d="M1 7Q${w * 0.2} 3 ${w * 0.45} 6T${w - 2} 6" fill="none" stroke="#0c4452" stroke-width="2.6" stroke-linecap="round" opacity=".28"/><path d="M1 6Q${w * 0.2} 2 ${w * 0.45} 5T${w - 2} 5" fill="none" stroke="#f4fffd" stroke-width="2" stroke-linecap="round"/><path d="M${w * 0.15} 9Q${w * 0.4} 6 ${w * 0.7} 8" fill="none" stroke="#c8f4f2" stroke-width="1" stroke-linecap="round" opacity=".8"/>`, w, 12);
  const sU = [streak(60), streak(90), streak(120)];
  const ys = [22, 44, 58, 78, 96, 112, 126, 140, 154, 170, 30, 70, 104, 134, 16, 36, 86, 118, 148, 164];
  ys.forEach((y, i) => {
    const wave = i < 10 ? 0 : 1, t0 = (wave ? 1300 : 300) + (i % 10) * 85 + (i >= 14 ? 40 : 0) + rand() * 60, w = [60, 90, 120][i % 3], dur = 700 + (i % 3) * 120, a = (rand() - 0.5) * 3;
    const at = (x, o, sx) => ({ transform: `${k.T(x, a * (x / 80))} scale(${sx}, 1)`, opacity: o });
    fx(k.pic(sU[i % 3], [150, y], w * 0.78, 9, { lit: false }), [[t0, at(210, 0, 0.7), 'linear'], [t0 + 90, at(170, 0.85, 1)], [t0 + dur * 0.5, at(0, 0.9, 1.15), 'linear'], [t0 + dur - 90, at(-170, 0.8, 1.25)], [t0 + dur, at(-215, 0, 1.4)]]);
  });
  // a pale pulse of the wind's light over the picture, and the sun flaring
  fx(k.lightIn('g-wind', [150, 90], 360, 200), [[500, { opacity: 0 }, 'ease-out'], [1200, { opacity: 0.35 }, eio], [1700, { opacity: 0.7 }, 'ease-out'], [2300, { opacity: 0.25 }, eio], [3200, { opacity: 0 }]]);
  fx(k.lightIn('g-wind', [240, 24], 120, 120), [[600, { transform: 'scale(.7)', opacity: 0 }, 'ease-out'], [1500, { transform: 'scale(1.3)', opacity: 0.9 }, eio], [2600, { transform: 'scale(1)', opacity: 0 }]]);

  // ── the curl's eye: gale arcs spinning in it
  const arcs = k.svg('<path d="M4 18Q4 4 18 4T32 17Q31 26 22 26T12 18Q13 12 19 12" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/><path d="M8 24Q16 31 27 25" fill="none" stroke="#dcfaf8" stroke-width="1" stroke-linecap="round" opacity=".7"/>', 36, 32);
  for (let i = 0; i < 3; i++) fx(k.pic(arcs, EYE, 34 + i * 12, 30 + i * 10.5), [[900 + i * 70, { transform: `rotate(${i * 80}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [1250 + i * 70, { transform: `rotate(${i * 80 - 120}deg) scale(1)`, opacity: 0.9 }, 'linear'], [1900, { transform: `rotate(${i * 80 - 330}deg) scale(1.1)`, opacity: 0.6 }, 'linear'], [2600, { transform: `rotate(${i * 80 - 520}deg) scale(1.25)`, opacity: 0 }]]);
  // puffs of wind riding the curl's route from the cliff edge round its eye
  const route = [[318, 126], [272, 123], [226, 120], [190, 116], [166, 106], [154, 88], [150, 68], [138, 50], [118, 42], [100, 48], [94, 62], [102, 74]];
  const alongRoute = (f) => { const x = f * (route.length - 1), i = Math.min(route.length - 2, Math.floor(x)), g = x - i; return [route[i][0] + (route[i + 1][0] - route[i][0]) * g, route[i][1] + (route[i + 1][1] - route[i][1]) * g]; };
  for (let i = 0; i < 16; i++) {
    const t0 = 700 + i * 90, r = Math.round(rand() * 360), sz = 14 + rand() * 8, side = (rand() - 0.5) * 7;
    const a = (f, sc, o) => { const p = alongRoute(f); return { transform: `${k.T(p[0] - 150 + side * Math.sin(f * 5), p[1] - 90 + side * 0.5)} rotate(${r + Math.round(f * 200)}deg) scale(${sc})`, opacity: o }; };
    fx(k.pic('wisp', [150, 90], sz, sz), [[t0, a(0.2, 0.5, 0), 'ease-out'], [t0 + 120, a(0.3, 0.8, 0.75)], [t0 + 520, a(0.62, 1, 0.8), 'linear'], [t0 + 920, a(0.95, 1.2, 0.55), 'ease-out'], [t0 + 1200, a(1, 1.6, 0)]]);
  }
  // spray torn off the whitecaps, blades and seeds flung off the cliff
  for (let i = 0; i < 18; i++) {
    const x = 170 + rand() * 140, y = 140 + rand() * 60, t0 = 600 + rand() * 1700, dx = -(50 + rand() * 60), dy = -(6 + rand() * 24), sz = 1.6 + rand() * 2;
    fx(k.pic('spray', [x, y], sz, sz), [[t0, { transform: `${k.T(0, 0)} scale(.5)`, opacity: 0 }, 'ease-out'], [t0 + 90, { transform: `${k.T(dx * 0.1, dy * 0.1)} scale(1)`, opacity: 0.9 }, 'linear'], [t0 + 560, { transform: `${k.T(dx, dy)} scale(.8)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 9; i++) {
    const x = 20 + rand() * 120, y = 104 + rand() * 8, t0 = 900 + rand() * 1100, dx = -(40 + rand() * 50), dy = -(10 + rand() * 26), sz = 1.6 + rand() * 1.4;
    fx(k.pic('seed', [x, y], sz, sz, { lit: false }), [[t0, { transform: `${k.T(0, 0)}`, opacity: 0 }, 'ease-out'], [t0 + 80, { transform: `${k.T(dx * 0.1, dy * 0.1)}`, opacity: 0.9 }, 'linear'], [t0 + 700, { transform: `${k.T(dx, dy)}`, opacity: 0 }]]);
  }
  // spume flung up where the sea meets the cliff foot
  for (let i = 0; i < 6; i++) {
    const t0 = 1000 + i * 260 + rand() * 80, x = 158 + rand() * 20, sz = 8 + rand() * 6;
    fx(k.pic('wisp', [x, 188], sz, sz), [[t0, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 200, { transform: `${k.T(-3, -9)} scale(1)`, opacity: 0.8 }, eio], [t0 + 800, { transform: `${k.T(-16, -30)} scale(1.6)`, opacity: 0 }]]);
  }
}
