// Overgrowth: the sun pours in and the ruined city grows too much.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: aura (a field: the place
// itself acts), element: nature. Not aimed.
//   0-700     the gather: the light draws in (the sun's glow swells at the top, the
//             shafts brighten) while the great vine breathes in and shrinks back a
//             hair, the leaves and flowers hushed.
//   800       THE SWELL (BEATS.release): the vine surges up and sways, thicker for
//             a moment, its leaves fluttering behind it; a pulse of sunlight and a
//             wide beam sweep out over the picture and past its frame; the flowers
//             flare (a hot copy lit over them), each with a glow of its own.
//   900-2000  the growth runs out from the tower to both sides, each thing a beat
//             after the one nearer: new leaves pop out along the vine, new
//             blossoms open in the trees of the temple and the arcade, long
//             tendrils spill down the arcade's face, and petals and pollen are
//             shaken loose and drift off on the warm air.
//   1700      THE PEAK (BEATS.impact): the great flowers burst open: a ring of
//             golden light runs out past the frame, a flash at their heart, a
//             shower of pollen.
//   2300-3900 it all settles: the vine rocks back to rest, the new leaves,
//             blossoms and tendrils close and fade, the light dims.
//   3900      at rest as drawn (the move ends at END).
export const END = 4500;
export const BEATS = { release: 800, impact: 1700, settle: 3900 };
export const STILLS = [350, 650, 950, 1300, 1700, 2100, 2900, 4100];

export const textures = {
  pollen: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 224 + 31 * c * c, 120 + 120 * c * c, Math.min(1, c * c * 2.2)]; }],
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 252, 220, Math.min(1, c * c * 1.5)]; }],
};

export function build(k) {
  const { act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const SUN = k.spec.sun, F = k.spec.flowers, IMPACT = 1700, CORE = [130, 140];
  // (a keyframe list in time order, one per moment: later growth pushes the rest back)
  const fx = (el, list) => { let last = -1; k.fx(el, list.slice().sort((a, b) => a[0] - b[0]).map((e) => { last = Math.max(last + 1, Math.min(e[0], k.END - 1)); return [last, ...e.slice(1)]; })); };
  k.css(`.g-sun { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,253,232,.95), rgba(255,240,170,.55) 28%, rgba(255,224,130,.16) 58%, rgba(255,210,100,0) 100%); }
    .fx-copy.f-hot { mix-blend-mode: plus-lighter; filter: brightness(1.3) saturate(1.2); }`);

  // a track: a list of keys [ms, a, b, ...] read at any ms by easing between them
  const track = (keys) => (t) => {
    let i = keys.length - 1;
    while (i > 0 && keys[i][0] > t) i--;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const f = b[0] === a[0] ? 0 : sm(Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))));
    return a.slice(1).map((v, j) => v + (b[j + 1] - v) * f);
  };
  const grid = (to) => { const g = []; for (let t = 0; t <= to; t += 30) g.push(t); return g; };
  const sampled = (to, fn, rest) => [...grid(to).map((t) => [t, fn(t), 'linear']), [to + 100, rest]];

  // ── the vine, its leaves and its flowers: they breathe in, surge, and rock back to rest together
  //    about the vine's foot (leaves flutter a little more, flowers go a little behind)
  const env = track([[0, 0], [620, -0.35], [1000, 1], [1700, 0.85], [2500, 0.45], [3300, 0]]);
  const calm = (t) => 1 - sm(Math.max(0, Math.min(1, (t - 2700) / 700)));
  const wob = (t, lag) => (t < 1000 + lag ? 0 : 1.1 * Math.exp(-(t - 1000 - lag) / 650) * Math.sin((t - 1000 - lag) / 175) * calm(t));
  const pose = (lag, flutter) => (t) => {
    const e = env(t)[0], r = -1.3 * e + wob(t, lag) + (flutter ? flutter * Math.sin(t / 120) * Math.max(0, e) * calm(t) : 0), s = 1 + 0.032 * e;
    return { transform: `rotate(${r.toFixed(2)}deg) scale(${s.toFixed(4)})` };
  };
  act(k.part('vine'), sampled(3500, pose(0, 0), { transform: 'none' }));
  act(k.part('leaves'), sampled(3500, pose(60, 0.9), { transform: 'none' }));
  act(k.part('flowers'), sampled(3500, pose(120, 0), { transform: 'none' }));
  // the flowers flare: a hot copy lit over them
  const hot = track([[0, 0], [760, 0], [900, 0.8], [1250, 0.45], [1650, 0.55], [1760, 1], [2100, 0.4], [3000, 0]]);
  const fp = pose(120, 0);
  act(k.copy('flowers', 'f-hot'), sampled(3300, (t) => ({ ...fp(t), opacity: +hot(t)[0].toFixed(2) }), { transform: 'none', opacity: 0 }));

  // ── the sun: its glow draws in, swells, and a wide beam sweeps out past the frame
  fx(k.lightIn('g-sun', SUN, 200, 170), [[0, { transform: 'scale(.8)', opacity: 0 }, 'ease-out'], [500, { transform: 'scale(.65)', opacity: 0.55 }, eio], [900, { transform: 'scale(1.15)', opacity: 0.95 }, eio], [1700, { transform: 'scale(1.3)', opacity: 0.85 }, eio], [2700, { transform: 'scale(1.1)', opacity: 0.35 }, eio], [3700, { transform: 'scale(.9)', opacity: 0 }]]);
  fx(k.light('g-sun', SUN, 380, 300), [[780, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(1)', opacity: 0.6 }, eio], [1800, { transform: 'scale(1.1)', opacity: 0.42 }, eio], [2900, { transform: 'scale(1.3)', opacity: 0 }]]);
  const BW = 330, BH = 270;
  const beam = k.svg(`<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fffbe6" stop-opacity=".85"/><stop offset=".45" stop-color="#fff0b8" stop-opacity=".35"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation="4"/></filter></defs>` +
    `<g filter="url(#b)"><path d="M0,10L${BW},${BH * 0.3}L${BW},${BH * 0.9}L0,34Z" fill="url(#g)"/><path d="M0,18L${BW},${BH * 0.42}L${BW},${BH * 0.62}L0,26Z" fill="url(#g)"/></g>`, BW, BH);
  const bc = [SUN[0] - 6 + BW / 2, SUN[1] - 10 + BH / 2];
  const bl = [[800, { transform: 'scale(.15, .5)', opacity: 0 }, 'ease-out'], [1080, { transform: 'scale(1, 1)', opacity: 0.85 }, eio]];
  for (let t = 1250, i = 0; t < 2400; t += 150, i++) bl.push([t, { transform: `scale(1, ${i % 2 ? 1.04 : 0.97})`, opacity: i % 2 ? 0.8 : 0.62 }, eio]);
  bl.push([3100, { transform: 'scale(1.03, .94)', opacity: 0 }]);
  fx(k.pic(beam, bc, BW, BH), bl);
  // pulses of sunlight rolling out from the sun and from the great flowers, past the frame
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#fff3c4" stroke-width="3" filter="url(#b)"/>', 60, 60);
  fx(k.pic(ring, SUN, 50, 50), [[800, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [860, { transform: 'scale(.6)', opacity: 0.85 }], [1800, { transform: 'scale(6.4)', opacity: 0 }]]);
  [[IMPACT, 4.4, 0.95], [IMPACT + 170, 3.2, 0.7]].forEach(([t, sc, o]) => fx(k.pic(ring, CORE, 50, 50), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 60, { transform: 'scale(.6)', opacity: o }], [t + 850, { transform: `scale(${sc * 1.7})`, opacity: 0 }]]));

  // ── the flowers: each flares in turn (800-1150), and bursts at the peak
  F.forEach(([x, y], i) => {
    const t = 820 + i * 55, big = i === 0 || i === 2 ? 1.3 : 1;
    fx(k.lightIn('g-sun', [x, y], 40 * big, 40 * big), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 200, { transform: 'scale(1)', opacity: 0.95 }, eio], [1500, { transform: 'scale(1.1)', opacity: 0.65 }, eio],
      [IMPACT, { transform: 'scale(1.4)', opacity: 1 }, eio], [2400, { transform: 'scale(1)', opacity: 0.4 }, eio], [3300, { transform: 'scale(.8)', opacity: 0 }]]);
  });
  fx(k.lightIn('g-sun', CORE, 110, 110), [[IMPACT - 80, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMPACT + 30, { transform: 'scale(1.2)', opacity: 1 }, eio], [IMPACT + 500, { transform: 'scale(1.5)', opacity: 0.5 }, eio], [2700, { transform: 'scale(1.9)', opacity: 0 }]]);

  // ── the growth runs out from the tower (x about 130) to both sides: each thing a beat after the nearer
  const lag = (x) => 900 + Math.abs(x - 130) * 5;
  const leaf = k.svg('<path d="M0,10C8,2 24,2 34,10C24,18 8,18 0,10Z" fill="#6e9a3a"/><path d="M2,10H32" stroke="#bfe08a" stroke-width="1.2" opacity=".8"/><path d="M8,6.5q6,3.5 12,3.5M8,13.5q6,-3.5 12,-3.5" stroke="#a6cf70" stroke-width=".8" fill="none" opacity=".7"/>', 34, 20);
  const blossom = k.svg(`${[0, 1, 2, 3, 4].map((i) => `<ellipse cx="20" cy="9" rx="5.2" ry="8.2" fill="#fffbea" transform="rotate(${i * 72} 20 20)"/>`).join('')}<circle cx="20" cy="20" r="4" fill="#f0c95a"/>`, 40, 40);
  const petal = k.svg('<path d="M0,6C4,-1 14,-1 18,6C14,13 4,13 0,6Z" fill="#fff8e6"/><path d="M2,6H15" stroke="#f1d58a" stroke-width=".8"/>', 18, 12);
  const tendril = k.svg('<path d="M10,0C4,14 16,26 8,42C2,56 14,66 8,82C6,90 8,94 10,98" fill="none" stroke="#6f9a3a" stroke-width="3.2" stroke-linecap="round"/><path d="M8,30l8,-5M9,62l-8,-5M8,86l7,-4" stroke="#5a8630" stroke-width="2" stroke-linecap="round"/><ellipse cx="17" cy="25" rx="5" ry="2.6" fill="#8bbb4c" transform="rotate(-20 17 25)"/><ellipse cx="1" cy="57" rx="5" ry="2.6" fill="#8bbb4c" transform="rotate(20 1 57)"/><ellipse cx="15" cy="82" rx="5" ry="2.6" fill="#8bbb4c" transform="rotate(-20 15 82)"/>', 22, 100);
  const END_FADE = 3700;
  // new leaves along the vine
  const nodes = [[118, 196, -40], [134, 186, 20], [154, 166, -20], [142, 140, 30], [114, 126, -150], [100, 108, 160], [118, 90, -30], [146, 76, 15], [176, 150, -10], [86, 112, 190], [150, 100, -70], [124, 160, 160]];
  nodes.forEach(([x, y, a], i) => {
    const t = lag(x) + (rand() - 0.5) * 80, len = 15 + rand() * 6, r = (a * Math.PI) / 180, cx = x + Math.cos(r) * len * 0.5, cy = y + Math.sin(r) * len * 0.5;
    fx(k.picIn(leaf, [cx, cy], len, len * 0.58, { lit: false }), [[t, { transform: `rotate(${a}deg) scale(.1)`, opacity: 0 }, 'ease-out'], [t + 200, { transform: `rotate(${a}deg) scale(1.2)`, opacity: 1 }, eio], [t + 340, { transform: `rotate(${a}deg) scale(1)`, opacity: 1 }, eio],
      [2400, { transform: `rotate(${a + 3}deg) scale(1.03)`, opacity: 1 }, eio], [END_FADE - 300 + i * 20, { transform: `rotate(${a}deg) scale(.9)`, opacity: 0 }]]);
  });
  // new blossoms in the trees of the temple and the arcade, and on the tower
  const blooms = [[40, 92, 11], [58, 84, 13], [74, 94, 10], [30, 104, 8], [52, 70, 8], [236, 104, 11], [254, 96, 13], [270, 104, 9], [222, 108, 8], [244, 88, 10], [168, 62, 8], [112, 64, 8]];
  blooms.forEach(([x, y, r], i) => {
    const t = lag(x) + 120 + (rand() - 0.5) * 120, a = Math.round(rand() * 72);
    const L = k.lightIn('g-sun', [x, y], r * 3.2, r * 3.2);
    fx(L, [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 260, { transform: 'scale(1)', opacity: 0.85 }, eio], [2400, { transform: 'scale(1)', opacity: 0.55 }, eio], [END_FADE - 100, { transform: 'scale(.7)', opacity: 0 }]]);
    fx(k.picIn(blossom, [x, y], r * 1.6, r * 1.6, { lit: false }), [[t, { transform: `rotate(${a}deg) scale(.05)`, opacity: 0 }, 'ease-out'], [t + 230, { transform: `rotate(${a + 20}deg) scale(1.25)`, opacity: 1 }, eio], [t + 400, { transform: `rotate(${a + 28}deg) scale(1)`, opacity: 1 }, eio],
      [2500, { transform: `rotate(${a + 34}deg) scale(1.06)`, opacity: 1 }, eio], [END_FADE - 250 + i * 15, { transform: `rotate(${a + 40}deg) scale(.5)`, opacity: 0 }]]);
  });
  // tendrils spilling down the arcade's face and the temple's wall
  [[200, 112, 62], [218, 116, 50], [238, 112, 66], [258, 114, 54], [276, 110, 58], [36, 130, 44], [70, 128, 52]].forEach(([x, y, h], i) => {
    const t = lag(x) + 200 + i * 20, sw = 3 + rand() * 2;
    fx(k.picIn(tendril, [x, y], 9, h, { top: true, lit: false }), [[t, { transform: 'scaleY(.04) skewX(0deg)', opacity: 0 }, 'cubic-bezier(.2,.7,.4,1)'], [t + 520, { transform: 'scaleY(1.04) skewX(0deg)', opacity: 1 }, eio],
      [t + 800, { transform: `scaleY(1) skewX(${sw}deg)`, opacity: 1 }, eio], [2300, { transform: `scaleY(1) skewX(${-sw}deg)`, opacity: 1 }, eio], [3000, { transform: `scaleY(1) skewX(${sw * 0.5}deg)`, opacity: 1 }, eio], [END_FADE, { transform: 'scaleY(.8) skewX(0deg)', opacity: 0 }]]);
  });

  // ── petals shaken loose and pollen lifting on the warm air (a breeze to the right)
  for (let i = 0; i < 20; i++) {
    const [x, y] = F[i % F.length], t = 900 + rand() * 1500, a = Math.round(rand() * 360), dx = 18 + rand() * 40, dy = 34 + rand() * 46, ph = rand() * 6;
    const P = (f, o) => ({ transform: `${k.T(dx * f, dy * f + 6 * Math.sin(f * 7 + ph))} rotate(${a + f * 260}deg) scale(${(0.8 + 0.3 * Math.cos(f * 9 + ph)).toFixed(2)}, ${(0.6 + 0.5 * Math.abs(Math.sin(f * 6 + ph))).toFixed(2)})`, opacity: o });
    fx(k.picIn(petal, [x + (rand() - 0.5) * 8, y + (rand() - 0.5) * 6], 7, 4.7, { lit: false }), [[t, P(0, 0), 'ease-out'], [t + 150, P(0.06, 1), 'linear'], [t + 900, P(0.5, 0.95), 'linear'], [t + 1700, P(1, 0)]]);
  }
  for (let i = 0; i < 34; i++) {
    const [x, y] = i < 14 ? CORE : F[i % F.length], burst = i < 14, t = burst ? IMPACT + rand() * 90 : 850 + rand() * 1600, s = 3 + rand() * 4, a = rand() * Math.PI * 2, d = burst ? 14 + rand() * 40 : 6 + rand() * 14;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * d * f + (burst ? 6 * f : 12 * f), Math.sin(a) * d * f - 8 * f - (burst ? 0 : 18 * f))} scale(${sc})`, opacity: o });
    fx(k.pic('pollen', [x, y], s, s), [[t, P(0, 0.5, 0), 'ease-out'], [t + 90, P(0.2, 1.1, 1), 'linear'], [t + 800, P(0.7, 0.9, 0.9), 'linear'], [t + 1500 + rand() * 600, P(1, 0.3, 0)]]);
  }
  // the light motes drawn in toward the sun in the gather
  for (let i = 0; i < 12; i++) {
    const a = rand() * Math.PI * 2, r = 26 + rand() * 40, t1 = 520 + i * 25 + rand() * 40, t0 = t1 - 480 - rand() * 150, s = 3 + rand() * 3;
    fx(k.pic('mote', SUN, s, s), [[t0, { transform: `${k.T(Math.cos(a) * r, Math.sin(a) * r * 0.8)} scale(.5)`, opacity: 0 }, 'ease-in'], [t0 + 120, { transform: `${k.T(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.7)} scale(1)`, opacity: 0.9 }, 'ease-in'], [t1, { transform: 'scale(.4)', opacity: 0.9 }, 'ease-in'], [t1 + 60, { transform: 'scale(.2)', opacity: 0 }]]);
  }
}
