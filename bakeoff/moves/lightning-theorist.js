// Lightning Theorist: she hurls the lightning.
//
// PLAN (drawing units 300 x 210, ms of the move)
//   0-250     anticipation: the storm darkens; she leans back, the arc she holds
//             starts to buzz; a trembling begins.
//   250-1050  gathering: small crackles snap between her hands, faster and
//             faster; the arc swells and flickers; her hands glow; thin feeder
//             bolts flicker down from the cloud; sparks spit off her hands;
//             she trembles with it.
//   1050-1110 the blaze: everything at its peak, the arc as bright as it gets.
//   1110      she throws (snaps forward ~6 deg about her feet). The arc she held
//             goes out and a bolt leaps from the cloud, through her hands and
//             out across the sea in strokes (1110, 1230, 1360, 1500: each a
//             different jagged shape, instant, gone), forking. Each stroke
//             flashes the clouds, the sea and her hands, and the dark overlay
//             drops for that instant.
//   1130-2000 where it strikes the water (238, 146): a white burst, a spike of
//             water, droplets thrown up and falling, rings spreading across
//             the sea; the sea stays lit for a while.
//   1500-2800 follow-through: she rocks back past rest and settles; the storm
//             dims away.
//   2300-3100 the arc between her hands returns, stuttering back to full.
//   3500      everything is at rest as drawn (the move ends at END).
export const END = 3800;
export const STILLS = [220, 700, 1000, 1125, 1240, 1500, 2450, 3400];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [200 + 55 * c * c, 215 + 40 * c * c, 255, Math.min(1, c * c * 2.2)]; }],
  dim: [8, 8, () => [3, 8, 18, 0.5]],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out';
  const arc = k.part('arc'), her = k.part('her');
  const [hl, hr] = k.spec.hands, [fx0, fy0] = k.spec.feet, S = k.spec.sea;

  k.css(`.g-bolt { border-radius: 50%; background: radial-gradient(closest-side, rgba(246,248,255,.95), rgba(170,190,255,.55) 22%, rgba(110,120,255,.2) 50%, rgba(90,90,255,.06) 78%, rgba(90,90,255,0) 100%); }
.g-gold { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,246,214,.9), rgba(255,208,130,.45) 25%, rgba(255,170,70,.12) 55%, rgba(255,150,40,0) 100%); }`);

  // ── lightning drawing: jagged strokes as SVG (painted once)
  const jag = (a, b, n, amp) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, o = i === 0 || i === n ? 0 : (rand() - 0.5) * 2 * amp;
      pts.push([a[0] + dx * t + nx * o, a[1] + dy * t + ny * o]);
    }
    return pts;
  };
  const d = (pts) => 'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L');
  // strokes: [{ pts, w }] drawn in a box [x0, y0, w, h]; a blue halo, a pale blue body, a white-hot core
  const boltSvg = (box, strokes) => {
    const [x0, y0, w, h] = box, all = (f) => strokes.map((s) => f(s)).join('');
    const layer = (mul, col, op, filt) => `<g ${filt ? 'filter="url(#b)"' : ''} fill="none" stroke="${col}" stroke-opacity="${op}" stroke-linejoin="round" stroke-linecap="round">${all((s) => `<path d="${d(s.pts)}" stroke-width="${(s.w * mul).toFixed(2)}"/>`)}</g>`;
    return k.svg(`<defs><filter id="b" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.8"/></filter></defs><g transform="translate(${-x0} ${-y0})">${layer(5, '#6f7dff', 0.75, true)}${layer(2.1, '#b4c8ff', 0.85, false)}${layer(0.8, '#ffffff', 1, false)}</g>`, w, h);
  };

  // the great bolt: from the cloud, through her hands, out over the sea (four different strokes)
  const BOX = [90, -10, 175, 165], BC = [BOX[0] + BOX[2] / 2, BOX[1] + BOX[3] / 2];
  const sky = [136, -4], mid = [126, 34];
  const great = [0, 1, 2, 3].map((v) => {
    const s1 = jag(sky, mid, 5, 7), s2 = jag(mid, hr, 3, 5), s3 = jag(hr, S, 11, 12 + v * 2);
    const forks = [
      { pts: jag(s3[4], [s3[4][0] + 30, s3[4][1] + (v % 2 ? 4 : 22)], 4, 5), w: 0.55 },
      { pts: jag(s3[7], [s3[7][0] + 6, S[1] + 8], 3, 4), w: 0.5 },
      { pts: jag(s1[2], [166 - v * 9, 14 + v * 3], 4, 4), w: 0.5 },
      { pts: jag(s3[2], [s3[2][0] - 14, s3[2][1] + 16], 3, 3), w: 0.45 },
    ];
    return boltSvg(BOX, [{ pts: [...s1, ...s2.slice(1), ...s3.slice(1)], w: 1 }, ...forks]);
  });
  // small crackles snapping between her hands, and feeder bolts from the cloud
  const CB = [80, 28, 80, 56];
  const crackle = [0, 1, 2, 3].map((v) => {
    const top = [(hl[0] + hr[0]) / 2 + (rand() - 0.5) * 20, 41 - v * 3];
    const a = jag(hl, top, 5, 4), b = jag(top, hr, 5, 4);
    const extra = jag(top, [top[0] + (rand() - 0.5) * 24, top[1] - 10 - rand() * 8], 3, 3);
    return boltSvg(CB, [{ pts: [...a, ...b.slice(1)], w: 0.7 }, { pts: extra, w: 0.4 }]);
  });
  const FB = [100, -8, 56, 60];
  const feed = [0, 1, 2].map(() => boltSvg(FB, [{ pts: jag([136, -6], [124, 40], 6, 6), w: 0.7 }, { pts: jag([128, 20], [112 - rand() * 6, 34], 3, 3), w: 0.4 }]));

  // ── a flicker: a thing that is lit for `dur` ms at each of a list of starts, hard-cut between
  const blinks = (evs, tail = 0.55) => {
    const l = []; let end = -9;
    for (const [t, dur, o = 1] of evs) {
      if (t < end + 3) continue;
      l.push([t - 1, { opacity: 0 }], [t, { opacity: o }], [t + dur, { opacity: o * tail }], [t + dur + 22, { opacity: 0 }]);
      end = t + dur + 22;
    }
    return l;
  };

  // ── she: the leaning (about her feet), tremble while charging, the throw, the rocking back to rest
  const lean = [[0, 0], [250, -3], [420, -3.4], [1040, -4.2], [1108, -4.6], [1170, 6.8], [1380, 5.2], [1700, -1.8], [2050, 1.2], [2400, -0.4], [2800, 0]];
  const trem = [];
  for (let t = 450; t < 1040; t += 55) trem.push([t, -3.4 - (t - 450) / 590 * 0.8 + (trem.length % 2 ? 0.7 : -0.7) * (0.5 + (t - 450) / 590)]);
  const her_k = [...lean.filter(([t]) => t < 450 || t > 1040), ...trem].sort((a, b) => a[0] - b[0]);
  act(her, her_k.map(([t, a], i) => [t, { transform: `rotate(${a.toFixed(2)}deg)` }, t === 1108 ? 'ease-in' : t === 1170 ? 'ease-out' : eio]));
  // where a point on her (her hands) is when she is leaned `a` degrees: as px from rest
  const at = (p, a) => { const r = a * Math.PI / 180, dx = p[0] - fx0, dy = p[1] - fy0; return [fx0 + dx * Math.cos(r) - dy * Math.sin(r) - p[0], fy0 + dx * Math.sin(r) + dy * Math.cos(r) - p[1]]; };
  const follow = (p, scales) => her_k.map(([t, a], i) => { const [dx, dy] = at(p, a); return [t, { transform: `${k.T(dx, dy)} scale(${scales(t)})`, opacity: 1 }]; });

  // ── the dark of the storm: gathers before the throw, cut away at each flash, then dims off
  const dark = k.picIn('dim', [150, 105], 300, 210, { lit: false });
  fx(dark, [[0, { opacity: 0 }, 'ease-in'], [950, { opacity: 1 }], [1107, { opacity: 1 }], [1109, { opacity: 0.15 }], [1228, { opacity: 0.15 }], [1232, { opacity: 0.6 }], [1358, { opacity: 0.6 }], [1362, { opacity: 0.3 }],
    [1500, { opacity: 0.3 }], [1700, { opacity: 0.75 }], [2600, { opacity: 0.45 }, eio], [3500, { opacity: 0 }]]);

  // ── the arc she holds: buzzes and swells while she gathers, blazes, goes out at the throw, stutters back
  const arcK = [[0, { transform: 'scale(1)', opacity: 1 }, eio]];
  for (let t = 260, i = 0; t < 1060; t += 60 + rand() * 25, i++) {
    const g = (t - 260) / 800, s = 1 + g * 0.26 + (i % 2 ? 0.03 : -0.02);
    arcK.push([t, { transform: `scale(${s.toFixed(3)})`, opacity: +(i % 2 ? 1 : 0.62 + 0.2 * g).toFixed(2) }, 'linear']);
  }
  arcK.push([1100, { transform: 'scale(1.3)', opacity: 1 }], [1104, { transform: 'scale(1.3)', opacity: 0 }], [2300, { transform: 'scale(.9)', opacity: 0 }],
    [2340, { transform: 'scale(.95)', opacity: 0.8 }], [2400, { transform: 'scale(.95)', opacity: 0.15 }], [2480, { transform: 'scale(1.02)', opacity: 0.9 }], [2540, { transform: 'scale(1)', opacity: 0.3 }],
    [2640, { transform: 'scale(1.04)', opacity: 1 }], [3000, { transform: 'scale(1)', opacity: 1 }]);
  act(arc, arcK);

  // ── crackles between her hands, getting faster; feeders from the cloud
  const cv = [[], [], [], []], fv = [[], [], []];
  for (let t = 330, n = 0; t < 1090; n++) {
    const g = (t - 330) / 760;
    cv[Math.floor(rand() * 4)].push([t, 40 + rand() * 40, 0.7 + 0.3 * g]);
    if (n % 3 === 1) fv[Math.floor(rand() * 3)].push([t + 20, 55 + rand() * 30, 0.5 + 0.4 * g]);
    t += 120 - g * 70 + rand() * 30;
  }
  crackle.forEach((src, v) => fx(k.picIn(src, [CB[0] + CB[2] / 2, CB[1] + CB[3] / 2], CB[2], CB[3]), blinks(cv[v])));
  feed.forEach((src, v) => fx(k.picIn(src, [FB[0] + FB[2] / 2, FB[1] + FB[3] / 2], FB[2], FB[3]), blinks(fv[v])));
  // after the throw: a few last crackles die on her hands
  const dv = [[2000, 45, 0.5], [2090, 40, 0.4], [2230, 50, 0.45]];
  fx(k.picIn(crackle[2], [CB[0] + CB[2] / 2, CB[1] + CB[3] / 2], CB[2], CB[3]), blinks([]).concat([[2000, { opacity: 0 }], [2001, { opacity: 0.5 }], [2050, { opacity: 0 }], [2260, { opacity: 0 }], [2261, { opacity: 0.5 }], [2310, { opacity: 0 }]]));

  // ── glows on her hands (they ride with her): swell while she gathers, flash at each stroke, fade
  for (const p of [hl, hr]) {
    const gl = k.lightIn('g-bolt', p, 44, 44);
    const sc = (t) => (t < 1050 ? 0.45 + 0.55 * Math.max(0, (t - 250) / 800) : t < 1500 ? 1.5 : 0.9);
    const base = follow(p, sc), ks = [];
    for (const [t, f] of base) {
      const o = t < 250 ? 0 : t < 1050 ? 0.45 + 0.5 * ((t - 250) / 800) * (ks.length % 2 ? 0.75 : 1) : t < 1700 ? 0.95 : t < 2300 ? 0.45 : 0;
      ks.push([t, { ...f, opacity: o }]);
    }
    // (the glow's keyframes are her keyframes, so it rides with her)
    fx(gl, ks.filter((x, i, a) => i === 0 || x[0] > a[i - 1][0]));
  }

  // ── lights from the flashes: the clouds, the sea and the impact. strokes at 1110, 1230, 1360, 1500
  const strokes = [[1110, 95, 1], [1230, 80, 0.85], [1360, 70, 0.75], [1500, 45, 0.45]];
  const flash = (el, tail = 0.5, scale = 1) => fx(el, [[1050, { transform: 'scale(.9)', opacity: 0 }, 'ease-out'], [1100, { transform: 'scale(1)', opacity: 0.35 }],
    ...strokes.flatMap(([t, dur, o]) => [[t - 1, { transform: 'scale(1)', opacity: 0.25 }], [t, { transform: `scale(${scale})`, opacity: o }], [t + dur, { transform: `scale(${scale * 0.95})`, opacity: o * tail }], [t + dur + 12, { transform: 'scale(1)', opacity: 0.2 }]]),
    [1900, { transform: 'scale(1)', opacity: 0.1 }, 'ease-out'], [2100, { transform: 'scale(1)', opacity: 0 }]]);
  flash(k.lightIn('g-bolt', [150, 14], 330, 110));
  flash(k.lightIn('g-bolt', [200, 52], 250, 80), 0.4);
  flash(k.lightIn('g-bolt', [S[0] - 10, S[1] + 8], 230, 62), 0.55, 1.1);
  // the sea stays lit, then fades
  fx(k.lightIn('g-bolt', [S[0], S[1] + 6], 150, 40), [[1110, { opacity: 0 }, 'ease-out'], [1160, { opacity: 0.7 }], [1500, { opacity: 0.45 }, eio], [2300, { opacity: 0 }]]);
  // a flash of her: warm light on her face and shoulders at the blaze
  fx(k.lightIn('g-gold', [122, 84], 110, 90), [[900, { opacity: 0 }, eio], [1060, { opacity: 0.55 }], [1108, { opacity: 0.7 }], [1112, { opacity: 0.2 }], [1500, { opacity: 0.2 }, eio], [2000, { opacity: 0 }]]);
  // (also the blaze itself: a white bloom between her hands just before the throw)
  fx(k.lightIn('g-bolt', [122, 52], 95, 60), [[900, { transform: 'scale(.5)', opacity: 0 }, 'ease-in'], [1100, { transform: 'scale(1.35)', opacity: 1 }], [1112, { transform: 'scale(1.5)', opacity: 0.9 }], [1260, { transform: 'scale(.9)', opacity: 0.3 }], [1500, { transform: 'scale(.6)', opacity: 0 }]]);

  // ── the bolt itself, in strokes
  great.forEach((src, v) => {
    const [t, dur, o] = strokes[v];
    fx(k.picIn(src, BC, BOX[2], BOX[3]), [[t - 1, { opacity: 0 }], [t, { opacity: 1 }], [t + dur * 0.45, { opacity: 1 }], [t + dur, { opacity: 0.5 * o }], [t + dur + 28, { opacity: 0 }]]);
  });
  // a pale after-image of the first stroke, hanging in the dark a moment
  fx(k.picIn(great[0], BC, BOX[2], BOX[3]), [[1160, { opacity: 0 }], [1170, { opacity: 0.35 }], [1215, { opacity: 0.2 }], [1226, { opacity: 0 }], [1420, { opacity: 0 }], [1421, { opacity: 0.22 }], [1470, { opacity: 0 }]]);

  // ── where it strikes the water: burst, spike of water, droplets, rings
  fx(k.lightIn('g-bolt', S, 70, 44), [[1108, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1118, { transform: 'scale(1.1)', opacity: 1 }], [1200, { transform: 'scale(1.7)', opacity: 0.6 }, 'ease-out'], [1230, { transform: 'scale(1.2)', opacity: 0.9 }], [1500, { transform: 'scale(2)', opacity: 0.2 }, 'ease-out'], [1800, { transform: 'scale(2.3)', opacity: 0 }]]);
  const spike = k.svg('<defs><linearGradient id="g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#cfe0ff" stop-opacity=".9"/><stop offset="0.6" stop-color="#ffffff"/><stop offset="1" stop-color="#bcd0ff" stop-opacity="0"/></linearGradient></defs><path d="M8,0 L10.5,9 L9.5,15 L14,34 L2,34 L6.5,15 L5.5,9Z" fill="url(#g)"/>', 16, 34);
  const spk = (x, t, sx, sy) => fx(k.picIn(spike, [x, S[1] + 2], 16 * sx, 34 * sy, { base: true }), [[t, { transform: 'scale(.3, 0)', opacity: 0 }, 'ease-out'], [t + 70, { transform: 'scale(1, 1)', opacity: 1 }, 'ease-in'], [t + 190, { transform: 'scale(1.2, .9)', opacity: 0.8 }], [t + 380, { transform: 'scale(.6, .15)', opacity: 0 }]]);
  spk(S[0], 1112, 1, 1); spk(S[0] - 7, 1150, 0.6, 0.6); spk(S[0] + 8, 1180, 0.55, 0.7); spk(S[0] + 2, 1235, 0.7, 0.55);
  const ring = k.svg('<ellipse cx="30" cy="8" rx="28" ry="6" fill="none" stroke="#e8f0ff" stroke-width="1.4"/><ellipse cx="30" cy="8" rx="22" ry="4.4" fill="none" stroke="#9fb4ff" stroke-width=".8" stroke-opacity=".7"/>', 60, 16);
  for (const [t, big] of [[1118, 1.25], [1250, 1.7], [1410, 2.1], [1600, 2.4]]) {
    fx(k.picIn(ring, [S[0], S[1] + 3], 60, 16), [[t, { transform: 'scale(.12)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(.3)', opacity: 0.95 }, 'ease-out'], [t + 650, { transform: `scale(${big})`, opacity: 0 }]]);
  }
  // droplets thrown up, falling back
  for (let i = 0; i < 22; i++) {
    const t = 1118 + i * 22 + rand() * 40, dx = (rand() - 0.5) * 48, rise = 14 + rand() * 24, sz = 3 + rand() * 4, life = 380 + rand() * 260;
    const pts = k.arc([0, 0], [dx * 0.5, -rise * 1.9], [dx, 2 + rand() * 4], 6);
    fx(k.picIn('spark', [S[0] + (rand() - 0.5) * 8, S[1] + 1], sz, sz), pts.map(([x, y], j) => [Math.round(t + life * j / 6), { transform: `${k.T(x, y)} scale(${(1 - 0.45 * j / 6).toFixed(2)})`, opacity: j === 6 ? 0 : 1 - 0.1 * j }, j < 3 ? 'ease-out' : 'ease-in']));
  }
  // sparks spat off her hands as she gathers, and a few more thrown with the bolt
  for (const [p, dir] of [[hl, -1], [hr, 1]]) {
    for (let i = 0; i < 8; i++) {
      const t = 520 + i * 70 + rand() * 40, ang = (rand() * 1.2 - 0.2) * Math.PI * 0.8, r = 8 + rand() * 14, ex = dir * Math.cos(ang) * r * 1.2, ey = -Math.sin(ang) * r * 0.9 + 6 + rand() * 8;
      const sz = 2 + rand() * 2.6, pts = k.arc([0, 0], [ex * 0.6, ey - 8], [ex, ey], 4);
      fx(k.picIn('spark', p, sz, sz), pts.map(([x, y], j) => [Math.round(t + 280 * j / 4), { transform: `${k.T(x, y)} scale(${(1 - 0.5 * j / 4).toFixed(2)})`, opacity: j === 4 ? 0 : 1 }, 'ease-out']));
    }
  }
  for (let i = 0; i < 12; i++) {
    const t = 1112 + rand() * 120, f = rand(), px = hr[0] + (S[0] - hr[0]) * f + (rand() - 0.5) * 8, py = hr[1] + (S[1] - hr[1]) * f + (rand() - 0.5) * 8;
    const dx = (rand() - 0.5) * 26, dy = 6 + rand() * 14, sz = 2.5 + rand() * 2.5;
    fx(k.picIn('spark', [px, py], sz, sz), [[t, { transform: 'scale(1.3)', opacity: 0 }, 'ease-out'], [t + 25, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [t + 330, { transform: `${k.T(dx, dy)} scale(.2)`, opacity: 0 }]]);
  }
}
