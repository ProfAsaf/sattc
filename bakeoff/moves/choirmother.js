// Choirmother: she sings, and her song makes a spirit.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support (her gift is a
// little spirit, like the ones she raises: "Create a 1/1 Spirit"; the suggested
// role was defender, changed), element: spirit.
//   0-500     she draws breath: sinks a hair, arms come in, wings close; the
//             light at her heart gathers.
//   500-1100  she sings (anticipation): she rises, arms lift out and up, wings
//             open, halo swells and brightens; rings of song ripple out from
//             her, each of the little ones round her flaring in turn as it is
//             stirred; a spirit takes shape in the halo (a light swelling).
//   1100      RELEASE (BEATS.release): she sweeps her arms toward T and leans
//             after it; the spirit leaves the halo on an arc, shedding motes.
//   1900      LANDS (BEATS.impact) at T = k.aim, else the dawn sky to her right:
//             a flash, a star, rings, motes rising; a new little spirit hovers
//             there, fluttering, then dims away.
//   1300-3000 she holds the last note, arms open, then lowers; the little ones
//             settle; wings fold, halo calms.
//   3700      at rest as drawn (the move ends at END).
//
// The contract: the boon leaves her halo (emit) and goes to T, on the overlay;
// she sweeps and leans toward T whether it is left or right of her.
export const END = 4300;
export const BEATS = { release: 1100, impact: 1900, settle: 3700 };
export const STILLS = [300, 800, 1050, 1300, 1700, 2000, 2700, 4000];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 226 + 29 * c * c, 150 + 105 * c * c, Math.min(1, c * c * 2.2)]; }],
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 244, 200, Math.min(1, c * c * 1.4)]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, F = S.feet, E = S.emit, SH = S.shoulders;
  const T = k.aim || S.alone;
  const dir = T[0] >= E[0] ? 1 : -1;
  const kids = [[104, 164, 0.5], [90, 134, 0.62], [96, 100, 0.72], [102, 68, 0.62], [88, 40, 0.54], [118, 18, 0.46],
    [198, 156, 0.55], [212, 126, 0.66], [206, 92, 0.72], [198, 60, 0.6], [214, 34, 0.52], [182, 12, 0.44]];

  k.css(`.g-choir { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,252,236,.95), rgba(255,230,160,.55) 28%, rgba(255,200,110,.16) 58%, rgba(255,180,80,0) 100%); }
    .fx-copy.f-hot { mix-blend-mode: plus-lighter; filter: brightness(1.3) saturate(1.2); }`);

  const track = (keys) => (t) => {
    let i = keys.length - 1;
    while (i > 0 && keys[i][0] > t) i--;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const f = b[0] === a[0] ? 0 : sm(Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))));
    return a.slice(1).map((v, j) => v + (b[j + 1] - v) * f);
  };
  const grid = [];
  for (let t = 0; t <= 3660; t += 30) grid.push(t);
  const sample = (fn, last = { transform: 'none' }) => [...grid.map((t) => [t, fn(t), 'linear']), [3800, last]];

  // ── her: sinks, rises as she sings (a tremble of vibrato on the held note), leans after her gift
  const d = dir;
  const lean = track([[0, 0], [450, -0.3 * d], [1000, 0.4 * d], [1100, 0.9 * d], [1350, 2.2 * d], [2100, 1.6 * d], [3000, 0.5 * d], [3700, 0]]);
  const lift = track([[0, 0], [450, 1.1], [1000, -3.2], [1150, -3.8], [2100, -3.2], [3000, -1], [3700, 0]]);
  const vib = (t) => (t > 600 && t < 2500 ? Math.sin(t / 38) * 0.35 * Math.min(1, (t - 600) / 300, (2500 - t) / 400) : 0);
  const pose = (t) => ({ th: lean(t)[0], dy: lift(t)[0] + vib(t) });
  // the displacement of a point about her feet, turned by `th`
  const turn = (p, th) => { const r = (th * Math.PI) / 180, vx = p[0] - F[0], vy = p[1] - F[1]; return [F[0] + vx * Math.cos(r) - vy * Math.sin(r) - p[0], F[1] + vx * Math.sin(r) + vy * Math.cos(r) - p[1]]; };
  const follow = (p, extra = '', rot = 0, dyExtra = 0) => (t) => { const { th, dy } = pose(t), [x, y] = turn(p, th); return { transform: `${k.T(x, y + dy + dyExtra)} rotate(${(th + rot).toFixed(2)}deg)${extra}` }; };
  act(k.part('her'), sample((t) => { const { th, dy } = pose(t); return { transform: `${k.T(0, dy)} rotate(${th.toFixed(2)}deg)` }; }));

  // wings: close as she draws breath, open wide on the song, fold again as she lowers
  const wing = track([[0, 0], [450, -3], [1000, 11], [1150, 15], [2100, 12], [3000, 5], [3700, 0]]);
  act(k.part('wingL'), sample((t) => follow(SH[0], '', wing(t)[0])(t)));
  act(k.part('wingR'), sample((t) => follow(SH[1], '', -wing(t)[0])(t)));

  // arms: in at the breath, lifted out in the song, swept to T at the release
  const aOut = track([[0, 0], [450, 7], [1000, -7], [1100, -9], [1250, -2], [2100, -4], [3000, -1], [3700, 0]]); // left arm, - is outward
  const sweep = track([[0, 0], [1000, 0], [1100, 0.3], [1250, 1], [2100, 0.7], [3000, 0.15], [3700, 0]]);
  act(k.part('armL'), sample((t) => follow(SH[0], '', aOut(t)[0] + d * 11 * sweep(t)[0] + vib(t) * 2)(t)));
  act(k.part('armR'), sample((t) => follow(SH[1], '', -aOut(t)[0] + d * 12 * sweep(t)[0] - vib(t) * 2)(t)));

  // halo: swells and brightens as the spirit forms in it, pulses on the held note
  const halo = track([[0, 1], [450, 0.95], [1000, 1.35], [1100, 1.55], [1300, 1.2], [2100, 1.15], [3000, 1.04], [3700, 1]]);
  const haloT = (t) => { const s = halo(t)[0] * (1 + (t > 1300 && t < 2500 ? 0.06 * Math.sin(t / 110) : 0)); return follow(S.emit, ` scale(${s.toFixed(3)})`)(t); };
  act(k.part('halo'), sample(haloT));
  const hh = track([[0, 0], [900, 0], [1100, 0.9], [1500, 0.5], [2400, 0.3], [3200, 0]]);
  act(k.copy('halo', 'f-hot'), sample((t) => ({ ...haloT(t), opacity: +hh(t)[0].toFixed(2) }), { transform: 'none', opacity: 0 }));

  // ── the light round her: sinks at the breath, blooms with the song
  fx(k.lightIn('g-choir', [150, 104], 170, 190), [[0, { transform: 'scale(.9)', opacity: 0 }, 'ease-out'], [450, { transform: 'scale(.8)', opacity: 0.3 }, eio], [1100, { transform: 'scale(1.1)', opacity: 0.55 }, eio],
    [2200, { transform: 'scale(1.15)', opacity: 0.45 }, eio], [3400, { transform: 'scale(.95)', opacity: 0 }]]);
  // the swelling of light in the halo where the spirit forms
  const sw = [[500, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(1)', opacity: 0.8 }, eio], [1090, { transform: 'scale(1.5)', opacity: 1 }, eio], [1400, { transform: 'scale(1.7)', opacity: 0 }]];
  fx(k.lightIn('g-choir', E, 56, 56), sw);

  // ── rings of song rippling out from her (500-1300), the little ones flaring as each ring reaches them
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><ellipse cx="30" cy="30" rx="26" ry="22" fill="none" stroke="#fff3cc" stroke-width="2.4" filter="url(#b)"/>', 60, 60);
  [[560, 8, 0.7], [800, 8.5, 0.62], [1040, 9, 0.55], [1300, 7, 0.4]].forEach(([t, sc, o]) => fx(k.pic(ring, [150, 90], 36, 36), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 60, { transform: 'scale(.6)', opacity: o }, 'ease-out'], [t + 900, { transform: `scale(${sc})`, opacity: 0 }]]));
  kids.forEach(([x, y, sz], i) => {
    const dist = Math.hypot(x - 150, y - 90), t = 600 + dist * 3.6 + rand() * 80, big = 20 + 24 * sz;
    fx(k.lightIn('g-choir', [x, y - 2], big, big), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 130, { transform: 'scale(1.2)', opacity: 0.95 }, eio], [t + 500, { transform: 'scale(1)', opacity: 0.55 }, eio], [t + 1500 + rand() * 300, { transform: 'scale(.8)', opacity: 0 }]]);
    for (let j = 0; j < 2; j++) {
      const m = 3 + rand() * 3, dx = (rand() - 0.5) * 10, tt = t + 120 + j * 190;
      fx(k.pic('mote', [x, y], m, m), [[tt, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [tt + 100, { transform: `${k.T(dx * 0.3, -4)} scale(1.1)`, opacity: 1 }, 'linear'], [tt + 800, { transform: `${k.T(dx, -22 - rand() * 10)} scale(.4)`, opacity: 0 }]]);
    }
  });
  // notes of light rising from her as she sings
  for (let i = 0; i < 18; i++) {
    const x = 142 + rand() * 16, y = 58 + rand() * 14, t = 560 + rand() * 1500, sz = 3 + rand() * 4, dx = (rand() - 0.5) * 50, dy = -30 - rand() * 36;
    fx(k.pic('mote', [x, y], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 150, { transform: `${k.T(dx * 0.2, dy * 0.15)} scale(1)`, opacity: 0.95 }, 'linear'], [t + 1000 + rand() * 500, { transform: `${k.T(dx, dy)} scale(.4)`, opacity: 0 }]]);
  }
  // motes gather into the halo as the spirit forms
  for (let i = 0; i < 12; i++) {
    const a = rand() * Math.PI * 2, r = 22 + rand() * 24, t = 550 + rand() * 450, sz = 3 + rand() * 3, sx = Math.cos(a) * r, sy = Math.sin(a) * r * 0.8;
    fx(k.pic('mote', E, sz, sz), [[t, { transform: `${k.T(sx, sy)} scale(.5)`, opacity: 0 }, 'ease-in'], [t + 100, { transform: `${k.T(sx * 0.9, sy * 0.9)} scale(1)`, opacity: 0.9 }, 'ease-in'], [t + 420, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }]]);
  }

  // ── the spirit that flies: an arc from her halo to T
  const wing2 = (m) => `M${22 + m * 2.2},14.5C${22 + m * 9},9 ${22 + m * 16},5.5 ${22 + m * 20.5},4.6C${22 + m * 14},10.5 ${22 + m * 8},15.5 ${22 + m * 3.6},19Z`;
  const spiritSvg = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1.6"/></filter></defs>' +
    `<g fill="#ffd77a" filter="url(#b)" opacity=".9"><path d="${wing2(-1)}"/><path d="${wing2(1)}"/><ellipse cx="22" cy="8.4" rx="5" ry="5"/><path d="M18.6,13L25.4,13L22,29Z"/></g>` +
    `<g fill="#fffdf2"><path d="${wing2(-1)}"/><path d="${wing2(1)}"/><ellipse cx="22" cy="8.4" rx="4.2" ry="4.3"/><path d="M19.2,13L24.8,13L22,28.4Z"/></g>`, 44, 32);
  const C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 34];
  const bz = (u) => { const q = 1 - u; return [q * q * E[0] + 2 * q * u * C[0] + u * u * T[0], q * q * E[1] + 2 * q * u * C[1] + u * u * T[1]]; };
  const [X0, Y0] = k.P(...E);
  const tf = (p, rotd, sc, fl) => { const [x, y] = k.P(...p); return `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) rotate(${rotd.toFixed(1)}deg) scale(${(sc * (2 - fl)).toFixed(3)}, ${(sc * fl).toFixed(3)})`; };
  const FL0 = 1100, FL1 = 1900, N = 17, flier = [];
  for (let j = 0; j <= N; j++) {
    const t = FL0 + ((FL1 - FL0) * j) / N, u = Math.pow(j / N, 0.85), p = bz(u), q = bz(Math.min(1, u + 0.04)), pp = bz(Math.max(0, u - 0.04));
    const bank = (q[0] > pp[0] ? 1 : -1) * 8 * Math.sin(Math.PI * (j / N)) + 3 * Math.sin(j * 1.3);
    const sc = 0.5 + 0.6 * Math.min(1, j / 3) - 0.3 * sm(j / N);
    flier.push([t, { transform: tf(p, bank, sc, 1 + 0.12 * Math.sin(j * 1.9)), opacity: j === 0 ? 0 : 1 }, 'linear']);
  }
  for (let t = FL1 + 90; t < 3100; t += 90) {
    const hov = [T[0], T[1] + 2.5 * Math.sin(t / 260)], sc = 0.75 + 0.3 * Math.exp(-(t - FL1) / 220) + (t > 2700 ? -0.25 * sm((t - 2700) / 400) : 0);
    flier.push([t, { transform: tf(hov, 0, sc, 1 + 0.14 * Math.sin(t / 45)), opacity: t > 2650 ? Math.max(0, 1 - (t - 2650) / 420) : 1 }, 'linear']);
  }
  flier.push([3100, { transform: tf(T, 0, 0.5, 1), opacity: 0 }]);
  fx(k.pic(spiritSvg, E, 38, 28), flier);
  for (let i = 0; i < 16; i++) {
    const u = 0.04 + (i / 16) * 0.92, p = bz(Math.pow(u, 0.85)), t = FL0 + (FL1 - FL0) * u + 20, sz = 3 + rand() * 4, dx = (rand() - 0.5) * 8, dy = 6 + rand() * 12;
    fx(k.pic('mote', p, sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 90, { transform: `${k.T(dx * 0.3, dy * 0.2)} scale(1.1)`, opacity: 1 }, 'linear'], [t + 600 + rand() * 300, { transform: `${k.T(dx, dy)} scale(.4)`, opacity: 0 }]]);
  }
  fx(k.light('g-choir', E, 44), [[FL0 + 20, { transform: 'scale(.6)', opacity: 0.9 }, 'ease-out'], [FL0 + 240, { transform: 'scale(1.3)', opacity: 0 }]]);

  // ── where it lands (BEATS.impact): a flash, a star, rings, motes rising, then a hover of light
  const star = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".6"/></filter></defs><path d="M30,2L33,27L58,30L33,33L30,58L27,33L2,30L27,27Z" fill="#fff8e0" filter="url(#b)"/><circle cx="30" cy="30" r="5" fill="#fff"/>', 60, 60);
  const I = FL1;
  fx(k.light('g-choir', T, 80), [[I - 60, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [I + 30, { transform: 'scale(1.3)', opacity: 1 }, eio], [I + 300, { transform: 'scale(1.6)', opacity: 0.6 }, eio], [2600, { transform: 'scale(1.7)', opacity: 0.45 }, eio], [3200, { transform: 'scale(1.2)', opacity: 0 }]]);
  fx(k.pic(star, T, 44, 44), [[I - 20, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [I + 30, { transform: 'scale(.9) rotate(15deg)', opacity: 1 }], [I + 380, { transform: 'scale(1.3) rotate(40deg)', opacity: 0 }]]);
  [[0, 3.4, 0.9], [150, 2.5, 0.6]].forEach(([dt, sc, o]) => fx(k.pic(ring, T, 28, 28), [[I + dt, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [I + dt + 50, { transform: 'scale(.6)', opacity: o }], [I + dt + 800, { transform: `scale(${sc})`, opacity: 0 }]]));
  for (let i = 0; i < 16; i++) {
    const a = rand() * Math.PI * 2, dist = 10 + rand() * 26, sz = 3 + rand() * 4, t = I + rand() * 120;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * dist * f, Math.sin(a) * dist * f * 0.7 - 24 * f)} scale(${sc})`, opacity: o });
    fx(k.pic('mote', T, sz, sz), [[t, P(0, 0.5, 0), 'ease-out'], [t + 60, P(0.2, 1.1, 1), 'ease-out'], [t + 900 + rand() * 500, P(1, 0.4, 0)]]);
  }
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI * (0.1 + 0.8 * rand()), dist = 12 + rand() * 24, g = 8 + rand() * 8, sz = 5 + rand() * 5, t0 = I + rand() * 40;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * dist * f, Math.sin(a) * dist * f + g * f * f)} scale(${sc})`, opacity: o });
    fx(k.pic('spark', T, sz, sz), [[t0, P(0, 0.5, 0), 'ease-out'], [t0 + 40, P(0.2, 1.1, 1), 'ease-out'], [t0 + 240, P(0.75, 0.9, 0.9), 'ease-in'], [t0 + 480 + rand() * 160, P(1, 0.3, 0)]]);
  }
}
