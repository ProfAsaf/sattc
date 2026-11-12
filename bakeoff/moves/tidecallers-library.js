// Tidecaller's Library: the scrolls wake and send two of themselves up into the light.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: aura (a relic: the place
// itself acts), element: water. Not aimed.
//   0-800     the hush: the glowing scrolls draw their light in and dim, the
//             shoals hang still, the shafts from above narrow; then the fish
//             scatter, startled (shoals flick off in three directions).
//   900       THE SWELL (BEATS.release): the lights flare back from the bottom
//             row up (900, 1050, 1200, then the rose of lights above, 1350), a
//             hot copy lit over the scrolls; the shafts of light from far above
//             surge; bubbles lift off the case.
//   1000-1900 a scroll slides out of the shelf and rises through the water,
//             swaying, a trail of glints and runes behind it; a second leaves
//             a beat after the first, from the bottom row.
//   1900      THE PAGE (BEATS.impact): the first scroll reaches the light and
//             unfurls into a glowing page: a flash, rings, runes thrown off; the
//             second sweeps up past it and out of the picture.
//   2300-3900 the page lifts away in motes, the rows go down one by one, the
//             shoals drift home, the light settles.
//   3900      at rest as drawn (the move ends at END).
export const END = 4500;
export const BEATS = { release: 900, impact: 1900, settle: 3900 };
export const STILLS = [450, 800, 1050, 1400, 1900, 2300, 3100, 4100];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 246 + 9 * c, 200 + 55 * c * c, Math.min(1, c * c * 2.2)]; }],
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [235, 252, 246, Math.min(1, c * c * 1.5)]; }],
};

export function build(k) {
  const { act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const fx = (el, list) => { let last = -1; k.fx(el, list.slice().sort((a, b) => a[0] - b[0]).map((e) => { last = Math.max(last + 1, Math.min(e[0], k.END - 1)); return [last, ...e.slice(1)]; })); };
  const [r0, r1, r2] = k.spec.rows, ROSE = k.spec.rose, TOP = k.spec.top, IMPACT = 1900;
  k.css(`.g-lib { border-radius: 50%; background: radial-gradient(closest-side, rgba(250,252,232,.95), rgba(236,250,226,.55) 28%, rgba(200,240,230,.16) 58%, rgba(180,235,235,0) 100%); }
    .fx-copy.f-hot { mix-blend-mode: plus-lighter; filter: brightness(1.35) saturate(1.2); }`);
  const track = (keys) => (t) => {
    let i = keys.length - 1;
    while (i > 0 && keys[i][0] > t) i--;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const f = b[0] === a[0] ? 0 : sm(Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))));
    return a.slice(1).map((v, j) => v + (b[j + 1] - v) * f);
  };
  const grid = (to) => { const g = []; for (let t = 0; t <= to; t += 30) g.push(t); return g; };
  const sampled = (to, fn, rest) => [...grid(to).map((t) => [t, fn(t), 'linear']), [to + 100, rest]];

  // ── the scrolls: draw their light in (dim), flare, and breathe as the page leaves; a hot copy lit over them
  const sc = track([[0, 1, 1], [450, 0.55, 0.985], [850, 0.5, 0.98], [980, 1, 1.05], [1500, 1, 1.02], [1900, 1, 1.05], [2300, 1, 1.02], [3300, 1, 1]]);
  act(k.part('scrolls'), sampled(3300, (t) => { const [o, s] = sc(t); return { transform: `scale(${s.toFixed(3)})`, opacity: +o.toFixed(2) }; }, { transform: 'none', opacity: 1 }));
  const hot = track([[0, 0], [880, 0], [1000, 0.55], [1400, 0.3], [1850, 0.35], [1940, 0.6], [2500, 0.2], [3400, 0]]);
  act(k.copy('scrolls', 'f-hot'), sampled(3500, (t) => { const [, s] = sc(t); return { transform: `scale(${s.toFixed(3)})`, opacity: +hot(t)[0].toFixed(2) }; }, { transform: 'none', opacity: 0 }));
  // the lights flare row by row, from the bottom up
  [[r0, 900, 102, 24], [r1 - 2, 1050, 104, 36], [119, 1170, 104, 26], [ROSE[1] + 2, 1320, 74, 44]].forEach(([y, t, w, h], i) => {
    const cx = i === 3 ? ROSE[0] : 150;
    fx(k.lightIn('g-lib', [cx, y], w, h), [[t - 150, { transform: 'scale(.3, .5)', opacity: 0 }, 'ease-out'], [t + 120, { transform: 'scale(1.05)', opacity: 0.6 }, eio], [1700, { transform: 'scale(1)', opacity: 0.4 }, eio],
      [IMPACT, { transform: 'scale(1.1)', opacity: 0.6 }, eio], [2700 + i * 150, { transform: 'scale(1)', opacity: 0.25 }, eio], [3500 + i * 60, { transform: 'scale(.8)', opacity: 0 }]]);
  });
  fx(k.lightIn('g-lib', [150, 140], 150, 160), [[950, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [1300, { transform: 'scale(1)', opacity: 0.35 }, eio], [2200, { transform: 'scale(1.05)', opacity: 0.25 }, eio], [3500, { transform: 'scale(.9)', opacity: 0 }]]);

  // ── the shafts of light from far above: narrow in the hush, surging, and a pool of light at the top spilling past the frame
  const SW = 300, SH = 230;
  const shaft = k.svg(`<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2fffa" stop-opacity=".8"/><stop offset=".6" stop-color="#d4f6ee" stop-opacity=".28"/><stop offset="1" stop-color="#c6f4f0" stop-opacity="0"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation="3.5"/></filter></defs>` +
    `<g filter="url(#b)" fill="url(#g)"><path d="M126,0H174L226,${SH}H74Z"/><path d="M100,0H116L120,${SH}H46Z" opacity=".6"/><path d="M184,0H200L254,${SH}H182Z" opacity=".6"/></g>`, SW, SH);
  const shl = [[200, { transform: 'scale(.5, 1)', opacity: 0 }, 'ease-out'], [800, { transform: 'scale(.45, 1)', opacity: 0.25 }, eio], [1100, { transform: 'scale(1.05, 1)', opacity: 0.95 }, eio]];
  for (let t = 1400, i = 0; t < 2700; t += 170, i++) shl.push([t, { transform: `scale(${i % 2 ? 1.0 : 1.08}, 1)`, opacity: i % 2 ? 0.85 : 0.65 }, eio]);
  shl.push([3500, { transform: 'scale(.8, 1)', opacity: 0 }]);
  fx(k.picIn(shaft, [150, 100], SW, SH, { under: false }), shl);
  fx(k.light('g-lib', [150, -10], 380, 190), [[850, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1150, { transform: 'scale(1)', opacity: 0.75 }, eio], [IMPACT, { transform: 'scale(1.15)', opacity: 0.9 }, eio], [2700, { transform: 'scale(1.2)', opacity: 0.35 }, eio], [3600, { transform: 'scale(1)', opacity: 0 }]]);

  // ── the shoals: startled at the swell (they flick off in three directions), drifting home by 3300
  const flick = (name, dx, dy, rot, t0 = 780) => act(k.part(name), [[0, { transform: 'none' }, eio], [t0, { transform: 'none' }, 'ease-out'], [t0 + 220, { transform: `${k.T(dx, dy)} rotate(${rot}deg)` }, eio],
    [t0 + 1100, { transform: `${k.T(dx * 0.9, dy * 0.85)} rotate(${rot * 0.8}deg)` }, eio], [t0 + 1900, { transform: `${k.T(dx * 0.3, dy * 0.3 - 2)} rotate(${rot * -0.2}deg)` }, eio], [3300, { transform: 'none' }]]);
  flick('shoalL', -11, -7, -7); flick('shoalR', 13, 6, 6, 840); flick('shoalT', 6, -12, 9, 900);

  // ── bubbles lifting off the case and the scrolls
  const bub = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".35"/></filter></defs><circle cx="6" cy="6" r="4.2" fill="none" stroke="#e8fcf8" stroke-width="1.1" filter="url(#b)"/><circle cx="4.6" cy="4.6" r="1" fill="#fff" opacity=".9"/>', 12, 12);
  for (let i = 0; i < 26; i++) {
    const x = 112 + rand() * 76, y = 120 + rand() * 66, t = 900 + rand() * 1500, s = 3 + rand() * 4, dx = (rand() - 0.5) * 16, dy = -(44 + rand() * 60);
    const P = (f, sc, o) => ({ transform: `${k.T(dx * f + Math.sin(f * 8 + i) * 3, dy * f)} scale(${sc})`, opacity: o });
    fx(k.picIn(bub, [x, y], s, s, { lit: false }), [[t, P(0, 0.5, 0), 'ease-out'], [t + 150, P(0.1, 1, 0.9), 'linear'], [t + 1200, P(0.7, 1.1, 0.8), 'linear'], [t + 1900, P(1, 1.2, 0)]]);
  }

  // ── two scrolls leave the shelves and rise through the water (1000-1900)
  const scroll = k.svg('<rect x="3" y="2.4" width="18" height="7.2" rx="1" fill="#fbfaee"/><rect x="0" y="1.4" width="4.2" height="9.2" rx="1.8" fill="#d8dcc4"/><rect x="19.8" y="1.4" width="4.2" height="9.2" rx="1.8" fill="#d8dcc4"/><path d="M6,5h12M6,7.2h9" stroke="#9aa890" stroke-width=".7"/>', 24, 12);
  const flight = (from, to, t0, t1, sway, spin, o) => {
    const l = [[t0, { transform: `${k.T(0, 0)} rotate(${spin[0]}deg) scale(.5)`, opacity: 0 }, 'ease-out']];
    const n = 9;
    for (let j = 1; j <= n; j++) {
      const f = j / n, e = f * f * (3 - 2 * f) * 0.6 + f * 0.4, x = (to[0] - from[0]) * e + Math.sin(f * 7 + sway) * 6 * (1 - f * 0.3), y = (to[1] - from[1]) * e;
      l.push([Math.round(t0 + (t1 - t0) * f), { transform: `${k.T(x, y)} rotate(${(spin[0] + (spin[1] - spin[0]) * f + Math.sin(f * 9 + sway) * 8).toFixed(1)}deg) scale(${(0.5 + 0.6 * Math.min(1, f * 3)).toFixed(2)})`, opacity: j === 1 ? 1 : o(f) }, 'linear']);
    }
    return l;
  };
  const S1 = [132, 148], S2 = [168, 178];
  const p1 = flight(S1, [150, 40], 1000, IMPACT, 0.4, [-60, 0], () => 1);
  fx(k.pic(scroll, S1, 18, 9), p1);
  // a trail of glints and runes behind the first
  for (let i = 0; i < 12; i++) {
    const f = 0.1 + i * 0.075, t = Math.round(1000 + (IMPACT - 1000) * f), x = S1[0] + (150 - S1[0]) * f + Math.sin(f * 7 + 0.4) * 6, y = S1[1] + (40 - S1[1]) * (f * f * (3 - 2 * f) * 0.6 + f * 0.4);
    fx(k.pic('spark', [x, y], 5 + rand() * 3, 5 + rand() * 3), [[t, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t + 90, { transform: 'scale(1)', opacity: 0.95 }], [t + 560, { transform: `${k.T((rand() - 0.5) * 10, 7 + rand() * 6)} scale(.3)`, opacity: 0 }]]);
  }
  const p2 = flight(S2, [150, -26], 1250, 2350, 2.1, [50, 0], (f) => (f > 0.85 ? 1 - (f - 0.85) / 0.15 * 0.2 : 1));
  fx(k.pic(scroll, S2, 18, 9), p2);
  for (let i = 0; i < 12; i++) {
    const f = 0.08 + i * 0.075, t = Math.round(1250 + 1100 * f), x = S2[0] + (150 - S2[0]) * f + Math.sin(f * 7 + 2.1) * 6, y = S2[1] + (-26 - S2[1]) * (f * f * (3 - 2 * f) * 0.6 + f * 0.4);
    fx(k.pic('spark', [x, y], 4 + rand() * 3, 4 + rand() * 3), [[t, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t + 90, { transform: 'scale(1)', opacity: 0.9 }], [t + 520, { transform: `${k.T((rand() - 0.5) * 10, 7 + rand() * 6)} scale(.3)`, opacity: 0 }]]);
  }
  // where each leaves its shelf: a flash on the row
  [[S1, 960], [S2, 1210]].forEach(([p, t]) => fx(k.lightIn('g-lib', p, 30, 22), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 150, { transform: 'scale(1.1)', opacity: 1 }], [t + 650, { transform: 'scale(.8)', opacity: 0 }]]));

  // ── the page (1900): the scroll unfurls into a glowing page, a flash, rings, runes thrown off
  const page = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1.2"/></filter></defs><rect x="3" y="3" width="34" height="44" rx="2" fill="#fffbe6" filter="url(#b)" opacity=".6"/><rect x="5" y="5" width="30" height="40" rx="1.6" fill="#fbf6dc"/>' +
    '<path d="M10,12h20M10,17h20M10,22h14M10,27h20M10,32h17M10,37h11" stroke="#a89a58" stroke-width="1.5" stroke-linecap="round"/><rect x="5" y="5" width="30" height="40" rx="1.6" fill="none" stroke="#e2d6a0" stroke-width="1"/>', 40, 50);
  const pg = (y, sx, sy, r, o) => ({ transform: `${k.T(0, y)} rotate(${r}deg) scale(${sx}, ${sy})`, opacity: o });
  fx(k.pic(page, TOP, 30, 37.5), [[IMPACT - 30, pg(0, 0.08, 0.3, 0, 0), 'ease-out'], [IMPACT + 150, pg(-2, 1.12, 1.1, 2, 1), eio], [IMPACT + 320, pg(-4, 1, 1, -1, 1), eio], [2300, pg(-8, 1.02, 1.02, 1.5, 1), eio], [2700, pg(-16, 0.96, 1, -2, 0.85), 'ease-in'], [3000, pg(-30, 0.5, 1.1, 0, 0)]]);
  fx(k.light('g-lib', TOP, 110), [[IMPACT - 70, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMPACT + 30, { transform: 'scale(1.2)', opacity: 1 }, eio], [IMPACT + 450, { transform: 'scale(1.5)', opacity: 0.55 }, eio], [2800, { transform: 'scale(1.9)', opacity: 0 }]]);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#e6fcf6" stroke-width="3" filter="url(#b)"/>', 60, 60);
  [[IMPACT, 4.2, 0.95], [IMPACT + 180, 3, 0.7]].forEach(([t, s2, o]) => fx(k.pic(ring, TOP, 36, 36), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 60, { transform: 'scale(.6)', opacity: o }], [t + 850, { transform: `scale(${s2 * 1.6})`, opacity: 0 }]]));
  // runes thrown off the page, and the motes it dissolves into as it lifts away
  const rune = k.svg('<path d="M3,1v10M3,6h6M9,1v10M13,2l4,4l-4,4" stroke="#fbf8d8" stroke-width="1.6" stroke-linecap="round" fill="none"/>', 20, 12);
  for (let i = 0; i < 14; i++) {
    const a = -Math.PI / 2 + (i / 14 - 0.5) * 3.6 + rand() * 0.3, d = 16 + rand() * 34, t = IMPACT + rand() * 90, s = 4 + rand() * 3, r = Math.round(rand() * 120 - 60);
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * d * f, Math.sin(a) * d * f + 8 * f * f)} rotate(${r * f}deg) scale(${sc})`, opacity: o });
    fx(k.pic(i % 3 ? 'spark' : rune, TOP, i % 3 ? s : s * 2.4, i % 3 ? s : s * 1.4), [[t, P(0, 0.5, 0), 'ease-out'], [t + 70, P(0.2, 1.1, 1), 'ease-out'], [t + 400, P(0.75, 0.95, 0.9), 'ease-in'], [t + 800 + rand() * 300, P(1, 0.3, 0)]]);
  }
  for (let i = 0; i < 18; i++) {
    const t = 2350 + i * 38 + rand() * 60, x = TOP[0] + (rand() - 0.5) * 24, y = TOP[1] - 10 + (rand() - 0.5) * 24, s = 3 + rand() * 3;
    fx(k.pic('mote', [x, y], s, s), [[t, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t + 150, { transform: `${k.T((rand() - 0.5) * 10, -6)} scale(1)`, opacity: 0.9 }], [t + 1100 + rand() * 400, { transform: `${k.T((rand() - 0.5) * 22, -34 - rand() * 24)} scale(.4)`, opacity: 0 }]]);
  }
}
