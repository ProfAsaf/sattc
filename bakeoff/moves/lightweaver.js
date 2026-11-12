// Lightweaver: she lets the spirit she has woven go, and weaves another.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support (a creature whose
// gift is a spirit made of light), element: spirit.
//   0-450     the weave shimmers: the threads between her hands pulse, the little
//             spirit trembles; motes of light begin to drift in toward her hands.
//   450-1000  she gathers (anticipation): she leans back, her hands draw apart
//             (the upper arm lifts, the lower drops) and the threads stretch taut;
//             the spirit coils in on itself and dims; more motes stream in.
//   1000      RELEASE (BEATS.release): she throws her hands forward, leaning in;
//             the threads burst and fray into motes; the spirit flashes and
//             leaves the picture as a spirit of its own, which flies over her
//             head on an arc to T, wings fluttering, shedding motes.
//   1850      LANDS (BEATS.impact) at T = k.aim, else her faint follower on the
//             far left: a flash, a ring of light, a star, motes rising; it
//             hovers there, fluttering, then dims away (alone, into the follower).
//   1200-2400 she follows it with her arms low, her weight settling back.
//   2300-3600 she weaves again: her hands rise to their places, motes gather,
//             the threads spin back together and the spirit forms again in them,
//             with a pulse of light as it fills.
//   3600      at rest as drawn (the move ends at END).
//
// The contract (bakeoff/recipe.md): the boon leaves her weave (emit) and goes to
// T = k.aim || her own follower; the spirit's path and the flash where it lands
// are worked from `emit` and T, on the overlay. She turns her throw toward T: her
// lean and the arms' sweep follow whether T is left or right of her.
export const END = 4200;
export const BEATS = { release: 1000, impact: 1850, settle: 3600 };
export const STILLS = [250, 800, 1100, 1350, 1800, 2000, 2800, 3900];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 226 + 29 * c * c, 150 + 105 * c * c, Math.min(1, c * c * 2.2)]; }],
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 244, 200, Math.min(1, c * c * 1.4)]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, F = S.feet, SH = S.shoulders, W0 = S.weave, E = S.emit;
  const T = k.aim || S.follower;
  const right = T[0] >= E[0] - 1, dir = right ? 1 : -1; // which way she throws

  k.css(`.g-weave { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,252,236,.95), rgba(255,230,160,.55) 28%, rgba(255,200,110,.16) 58%, rgba(255,180,80,0) 100%); }
    .fx-copy.f-hot { mix-blend-mode: plus-lighter; filter: brightness(1.3) saturate(1.2); }`);

  // a track: a list of keys [ms, a, b, ...] read at any ms by easing between them
  const track = (keys) => (t) => {
    let i = keys.length - 1;
    while (i > 0 && keys[i][0] > t) i--;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const f = b[0] === a[0] ? 0 : sm(Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))));
    return a.slice(1).map((v, j) => v + (b[j + 1] - v) * f);
  };
  const grid = [];
  for (let t = 0; t <= 3570; t += 30) grid.push(t);
  const rest = { transform: 'none' };
  const sample = (fn, last0 = {}) => [...grid.map((t) => [t, fn(t), 'linear']), [3700, { ...rest, ...last0 }]];

  // ── her: leans back to gather, in on the throw, settles; arms swing about the shoulders
  const d = dir;
  const lean = track([[0, 0], [450, -0.4 * d], [900, -2.3 * d], [1000, -2.3 * d], [1150, 2.8 * d], [1500, 1.8 * d], [2300, 0.9 * d], [3000, 0.3 * d], [3600, 0]]);
  const upper = track([[0, 0], [450, -3], [900, -12], [1000, -12], [1130, 5], [1500, 8], [2300, 6], [2900, -3], [3300, -1], [3600, 0]]);
  const lower = track([[0, 0], [450, 2], [900, 10], [1000, 10], [1130, -5], [1500, 3], [2300, 5], [2900, -2], [3300, -1], [3600, 0]]);
  const turn = (p, th) => { const r = (th * Math.PI) / 180, vx = p[0] - F[0], vy = p[1] - F[1]; return [F[0] + vx * Math.cos(r) - vy * Math.sin(r) - p[0], F[1] + vx * Math.sin(r) + vy * Math.cos(r) - p[1]]; };
  act(k.part('her'), sample((t) => ({ transform: `rotate(${lean(t)[0].toFixed(2)}deg)` })));
  act(k.part('sun'), sample((t) => ({ transform: `rotate(${lean(t)[0].toFixed(2)}deg)` })));
  const armTf = (i, t) => {
    const th = lean(t)[0], [dx, dy] = turn(SH[i], th), a = (i ? lower : upper)(t)[0] * d;
    return `${k.T(dx, dy)} rotate(${(th + a).toFixed(2)}deg)`;
  };
  act(k.part('armU'), sample((t) => ({ transform: armTf(0, t) })));
  act(k.part('armL'), sample((t) => ({ transform: armTf(1, t) })));

  // ── the threads between her hands: stretch as she draws them taut, burst at the throw, reform at the end
  const stretch = track([[0, 1, 1], [200, 1.06, 1], [450, 1, 1], [900, 1.32, 1], [1000, 1.4, 1], [1060, 1.9, 0.9], [1260, 2.6, 0], [2100, 0.6, 0], [2500, 0.7, 0.6], [3000, 1.08, 1], [3300, 1, 1], [3600, 1, 1]]);
  const wob = (t) => (t < 450 ? 1 + 0.025 * Math.sin(t / 55) : 1);
  const thr = (t) => { const [sy, o] = stretch(t), th = lean(t)[0], [dx, dy] = turn(W0, th); return { transform: `${k.T(dx, dy)} rotate(${(th + (t > 2100 && t < 3000 ? -30 * (1 - sm((t - 2100) / 900)) : 0)).toFixed(2)}deg) scale(${(wob(t) * (1 + (sy - 1) * 0.3)).toFixed(3)}, ${(wob(t) * sy).toFixed(3)})`, opacity: +o.toFixed(2) }; };
  act(k.part('threads'), sample(thr, { opacity: 1 }));
  const thot = (t) => { const hot = track([[0, 0], [200, 0.5], [450, 0], [900, 0.5], [1000, 0.9], [1100, 0.9], [1260, 0], [2900, 0], [3050, 0.7], [3400, 0]])(t)[0]; return { ...thr(t), opacity: +Math.min(1, hot * thr(t).opacity).toFixed(2) }; };
  act(k.copy('threads', 'f-hot'), sample(thot, { opacity: 0 }));

  // ── the spirit forming in them (its body and its halo): trembles, coils, flashes and goes; forms again at the end
  const sp = track([[0, 1, 1], [450, 1.04, 1], [950, 0.84, 0.9], [1000, 0.88, 0.95], [1060, 1.32, 0.95], [1160, 1.5, 0], [2850, 0.2, 0], [3000, 0.5, 0.9], [3250, 1.12, 1], [3600, 1, 1]]);
  const spt = (t) => { const [s, o] = sp(t), th = lean(t)[0], [dx, dy] = turn(E, th), fl = t < 950 || t > 3000 ? 1 + 0.035 * Math.sin(t / 70) * (t < 450 ? 1 : 0.5) : 1; return { transform: `${k.T(dx, dy)} rotate(${th.toFixed(2)}deg) scale(${(s * (2 - fl)).toFixed(3)}, ${(s * fl).toFixed(3)})`, opacity: +o.toFixed(2) }; };
  act(k.part('spirit'), sample(spt, { opacity: 1 }));
  act(k.part('halo'), sample((t) => { const p = spt(t); return { transform: p.transform, opacity: +(p.opacity * (t > 950 && t < 1200 ? 1.0 : 1)).toFixed(2) }; }, { opacity: 1 }));
  const shot = track([[0, 0], [950, 0], [1030, 0.9], [1160, 0], [3000, 0], [3120, 0.8], [3420, 0]]);
  act(k.copy('spirit', 'f-hot'), sample((t) => ({ ...spt(t), opacity: +Math.min(1, shot(t)[0] * Math.max(0.3, spt(t).opacity)).toFixed(2) }), { opacity: 0 }));

  // ── light at her hands: swells as she gathers, flashes at the throw, again as it re-forms
  fx(k.lightIn('g-weave', E, 90, 90), [[400, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [950, { transform: 'scale(1)', opacity: 0.55 }, eio], [1040, { transform: 'scale(1.5)', opacity: 1 }, eio], [1400, { transform: 'scale(1.9)', opacity: 0 }, 'ease-out'],
    [2900, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [3150, { transform: 'scale(1.1)', opacity: 0.7 }, eio], [3500, { transform: 'scale(1.3)', opacity: 0 }]]);

  // ── motes drawn in toward her hands: while she gathers (450-1000), and again as she weaves (2300-3000)
  const gather = (t0, t1, n) => {
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2, r = 30 + rand() * 40, t = t0 + rand() * (t1 - t0 - 400), sz = 3 + rand() * 4;
      const sx = Math.cos(a) * r, sy = Math.sin(a) * r * 0.8;
      fx(k.pic('mote', E, sz, sz), [[t, { transform: `${k.T(sx, sy)} scale(.5)`, opacity: 0 }, 'ease-in'], [t + 120, { transform: `${k.T(sx * 0.9, sy * 0.9)} scale(1)`, opacity: 0.9 }, 'ease-in'], [t + 480, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }]]);
    }
  };
  gather(150, 1000, 12);
  gather(2300, 3150, 14);

  // ── the threads burst into motes at the throw
  for (let i = 0; i < 16; i++) {
    const a = rand() * Math.PI * 2, dist = 16 + rand() * 34, sz = 3 + rand() * 4, t = 1000 + rand() * 120;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * dist * f + dir * 10 * f, Math.sin(a) * dist * f - 8 * f)} scale(${sc})`, opacity: o });
    fx(k.pic('mote', W0, sz, sz), [[t, P(0, 0.5, 0), 'ease-out'], [t + 70, P(0.25, 1.1, 1), 'ease-out'], [t + 700 + rand() * 300, P(1, 0.4, 0)]]);
  }

  // ── the spirit that flies: an arc over her head from her weave to T
  const wing = (m) => `M${22 + m * 2.2},14.5C${22 + m * 9},9 ${22 + m * 16},5.5 ${22 + m * 20.5},4.6C${22 + m * 14},10.5 ${22 + m * 8},15.5 ${22 + m * 3.6},19Z`;
  const spiritSvg = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1.6"/></filter></defs>' +
    `<g fill="#ffd77a" filter="url(#b)" opacity=".9"><path d="${wing(-1)}"/><path d="${wing(1)}"/><ellipse cx="22" cy="8.4" rx="5" ry="5"/><path d="M18.6,13L25.4,13L22,29Z"/></g>` +
    `<g fill="#fffdf2"><path d="${wing(-1)}"/><path d="${wing(1)}"/><ellipse cx="22" cy="8.4" rx="4.2" ry="4.3"/><path d="M19.2,13L24.8,13L22,28.4Z"/></g>`, 44, 32);
  const C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 46];
  const bz = (u) => { const q = 1 - u; return [q * q * E[0] + 2 * q * u * C[0] + u * u * T[0], q * q * E[1] + 2 * q * u * C[1] + u * u * T[1]]; };
  const [X0, Y0] = k.P(...E);
  const flier = [];
  const tf = (p, rotd, sc, fl) => { const [x, y] = k.P(...p); return `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) rotate(${rotd.toFixed(1)}deg) scale(${(sc * (2 - fl)).toFixed(3)}, ${(sc * fl).toFixed(3)})`; };
  const FL0 = 1000, FL1 = 1850, N = 17;
  for (let j = 0; j <= N; j++) {
    const t = FL0 + ((FL1 - FL0) * j) / N, u = Math.pow(j / N, 0.85), p = bz(u), q = bz(Math.min(1, u + 0.04)), pp = bz(Math.max(0, u - 0.04));
    const bank = (q[0] > pp[0] ? 1 : -1) * 8 * Math.sin(Math.PI * (j / N)) + 3 * Math.sin(j * 1.3); // (rocks as it flies)
    const sc = 1.1 - 0.35 * sm(j / N);
    flier.push([t, { transform: tf(p, bank, sc, 1 + 0.12 * Math.sin(j * 1.9)), opacity: j === 0 ? 0 : 1 }, 'linear']);
  }
  for (let t = FL1 + 90; t < 3100; t += 90) {
    const hov = [T[0], T[1] + 2.5 * Math.sin(t / 260)], sc = 0.75 + 0.3 * Math.exp(-(t - FL1) / 220) + (t > 2700 ? -0.25 * sm((t - 2700) / 400) : 0);
    flier.push([t, { transform: tf(hov, 0, sc, 1 + 0.14 * Math.sin(t / 45)), opacity: t > 2650 ? Math.max(0, 1 - (t - 2650) / 420) : 1 }, 'linear']);
  }
  flier.push([3100, { transform: tf(T, 0, 0.5, 1), opacity: 0 }]);
  fx(k.pic(spiritSvg, E, 28, 20), flier);
  // motes shed along the way
  for (let i = 0; i < 16; i++) {
    const u = 0.04 + (i / 16) * 0.92, p = bz(Math.pow(u, 0.85)), t = FL0 + (FL1 - FL0) * u + 20, sz = 3 + rand() * 4, dx = (rand() - 0.5) * 8, dy = 6 + rand() * 12;
    fx(k.pic('mote', p, sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 90, { transform: `${k.T(dx * 0.3, dy * 0.2)} scale(1.1)`, opacity: 1 }, 'linear'], [t + 600 + rand() * 300, { transform: `${k.T(dx, dy)} scale(.4)`, opacity: 0 }]]);
  }
  fx(k.light('g-weave', E, 40), [[FL0 + 40, { transform: 'scale(.6)', opacity: 0.9 }, 'ease-out'], [FL0 + 220, { transform: 'scale(1.2)', opacity: 0 }]]);

  // ── where it lands (BEATS.impact): a flash, rings, a star, motes rising; alone, the follower's light answers
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#fff3cc" stroke-width="3" filter="url(#b)"/>', 60, 60);
  const star = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".6"/></filter></defs><path d="M30,2L33,27L58,30L33,33L30,58L27,33L2,30L27,27Z" fill="#fff8e0" filter="url(#b)"/><circle cx="30" cy="30" r="5" fill="#fff"/>', 60, 60);
  const I = FL1;
  fx(k.light('g-weave', T, 80), [[I - 60, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [I + 30, { transform: 'scale(1.3)', opacity: 1 }, eio], [I + 300, { transform: 'scale(1.6)', opacity: 0.6 }, eio], [2400, { transform: 'scale(1.7)', opacity: 0.45 }, eio], [3100, { transform: 'scale(1.2)', opacity: 0 }]]);
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
