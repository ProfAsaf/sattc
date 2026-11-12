// Street Recruit: the kid bashes the sun out of his shield.
//
// PLAN (drawing units 300 x 210, ms of the move)
//   role attacker, element light. He faces right (shield on that side); aimed
//   at a target on his left he flips round (a sliver at ~220 ms) first.
//   0-520     gather: he leans back from his feet and crouches a hair, hauling
//             the shield in toward himself; the sun painted on it begins to
//             glow, motes of light stream in from round it.
//   520-940   wind-up: the shield trembles, the glow swells; the line of
//             soldiers behind him catch it, glinting in turn (Bond).
//   1000      RELEASE: he lunges (rocks forward 8 degrees), the shield thrusts
//             toward T, the glow flares white, and a spinning sun-disc, a
//             copy of the one painted on his shield, leaves the boss with a
//             streak of sparks.
//   1000-1380 the disc flies a high arc to T.
//   1380      IMPACT at T: white flash, an eight-rayed starburst, a ring of
//             light spreading, sparks, motes rising, a warm glow that beats.
//   1400-2400 follow-through: he rocks back from the thrust, rebounds, settles;
//             the shield's glow dies down.
//   3300      at rest as drawn.
// Alone, T is out past the line of soldiers, on his right.
export const END = 3800;
export const BEATS = { release: 1000, impact: 1380, settle: 3300 };
export const STILLS = [300, 750, 1040, 1200, 1400, 1550, 2100, 3500];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 236 + 19 * c, 170 + 80 * c * c, Math.min(1, c * c * 2.4)]; }],
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 240, 190, Math.min(1, c * 1.4) * c]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out';
  const kid = k.part('kid'), shield = k.part('shield');
  const F = k.spec.feet, E0 = k.spec.boss;
  const T = k.aim || [286, 134];
  const right = T[0] >= E0[0], d = right ? 1 : -1, sx = right ? 1 : -1;
  const E = right ? E0 : [2 * F[0] - E0[0], E0[1]]; // the boss, mirrored about his feet if he turns left
  k.css('.g-sun { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,250,228,.95), rgba(255,216,124,.5) 28%, rgba(255,176,72,.14) 58%, rgba(255,150,40,0) 100%); }');
  const F1 = (n) => n.toFixed(1);
  const rays = (n, cx, w, longer, shorter, base) => Array.from({ length: n }, (_, i) => {
    const a = (i * 2 * Math.PI) / n, l = i % 2 ? shorter : longer, hw = w;
    return `<path d="M${F1(cx + base * Math.cos(a - 1.2))},${F1(cx + base * Math.sin(a - 1.2))} L${F1(cx + l * Math.cos(a))},${F1(cx + l * Math.sin(a))} L${F1(cx + base * Math.cos(a + 1.2))},${F1(cx + base * Math.sin(a + 1.2))}Z"/>`;
  }).join('');
  const disc = k.svg('<defs><filter id="b" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.1"/></filter></defs><g filter="url(#b)" fill="#ffd77a">' +
    Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return `<path d="M20,20 L${F1(20 + 19 * Math.cos(a - 0.17))},${F1(20 + 19 * Math.sin(a - 0.17))} L${F1(20 + 19 * Math.cos(a + 0.17))},${F1(20 + 19 * Math.sin(a + 0.17))}Z"/>`; }).join('') +
    '</g><circle cx="20" cy="20" r="9" fill="#fff8e0"/><circle cx="20" cy="20" r="6" fill="#fffdf4"/>', 40, 40);
  const star = k.svg('<defs><filter id="b" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><g filter="url(#b)" fill="#fff0b8">' + rays(8, 40, 0, 39, 26, 6) + '</g><circle cx="40" cy="40" r="7" fill="#fffdf2"/>', 80, 80);
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#ffe19a" stroke-width="5" filter="url(#b)"/>', 100, 100);

  // ── his pose and the shield's: [ms, body dx, dy, lean (deg, toward T), crouch, shield's own dx, dy, ease]
  const tv = Math.hypot(T[0] - E[0], T[1] - E[1]) || 1, ux = (T[0] - E[0]) / tv, uy = (T[1] - E[1]) / tv;
  const th = [10 * ux, 6 * uy];
  const L = [
    [0, 0, 0, 0, 1, 0, 0, eio], [520, -1.5 * d, 0.5, -4.5, 0.985, -3 * d, 1, eio],
    [610, -1.6 * d, 0.5, -5, 0.983, -3.4 * d, 1.2, eio], [700, -1.5 * d, 0.6, -4.6, 0.986, -3.1 * d, 0.9, eio], [790, -1.7 * d, 0.5, -5.2, 0.982, -3.5 * d, 1.3, eio],
    [880, -1.6 * d, 0.6, -4.9, 0.984, -3.3 * d, 1, eio], [940, -1.8 * d, 0.6, -5.5, 0.98, -3.6 * d, 1.2, 'ease-out'],
    [1090, 2.5 * d, 0, 8, 1.01, th[0], th[1], eio], [1380, 2 * d, 0, 6.5, 1, th[0] * 0.85, th[1] * 0.85, eio],
    [1660, -1 * d, 0, -2.5, 1, -1.2 * d, 0.3, eio], [1950, 0.5 * d, 0, 0.8, 1, 0.6 * d, 0, eio], [2400, 0, 0, 0, 1, 0, 0, eio],
  ];
  const lean = (r) => (right ? r : -r); // (toward T: clockwise to the right, anti-clockwise to the left)
  const body = (p) => `${k.T(p[1], p[2])} rotate(${lean(p[3]).toFixed(1)}deg) scale(${sx}, ${p[4]})`;
  const shld = (p) => `${k.T(p[1] + p[5], p[2] + p[6])} rotate(${lean(p[3]).toFixed(1)}deg) scale(${sx}, ${p[4]})`;
  // (if he has to turn round, he does it in the first 450 ms, through a sliver)
  const first = { transform: 'translate(0px, 0px) rotate(0deg) scale(1, 1)' };
  const turn = right ? [] : [[220, { transform: 'translate(0px, 0px) rotate(0deg) scale(.06, 1)' }, eio]];
  act(kid, [[0, first, eio], ...turn, ...L.slice(1).map((p) => [p[0], { transform: body(p) }, p[7]])]);
  act(shield, [[0, first, eio], ...turn, ...L.slice(1).map((p) => [p[0], { transform: shld(p) }, p[7]])]);
  // where the boss is under a pose (about his feet), for what rides on the shield
  const bossAt = (p) => {
    const a = (lean(p[3]) * Math.PI) / 180, vx = E[0] - F[0], vy = (E[1] - F[1]) * p[4];
    return [F[0] + vx * Math.cos(a) - vy * Math.sin(a) + p[1] + p[5], F[1] + vx * Math.sin(a) + vy * Math.cos(a) + p[2] + p[6]];
  };
  const B0 = bossAt(L[6]);

  // ── the glow on the shield: gathers, swells, flares white at the release, dies down
  const glowOp = (ms) => (ms < 150 ? 0 : ms < 940 ? 0.15 + 0.7 * Math.pow((ms - 150) / 790, 1.3) : ms < 1090 ? 1 : ms < 1700 ? 1 - 0.6 * (ms - 1090) / 610 : ms < 2400 ? 0.4 * (1 - (ms - 1700) / 700) : 0);
  const glowSc = (ms) => (ms < 150 ? 0.4 : ms < 940 ? 0.5 + 0.55 * (ms - 150) / 790 : ms < 1090 ? 1.5 : ms < 1700 ? 1.5 - 0.5 * (ms - 1090) / 610 : 1);
  const poseAt = (t) => {
    let i = L.length - 2;
    while (i > 0 && L[i][0] > t) i--;
    const p = L[i], q = L[i + 1], f = Math.max(0, Math.min(1, (t - p[0]) / (q[0] - p[0])));
    return p.map((v, n) => (n === 0 || n === 7 ? t : v + (q[n] - v) * f));
  };
  const gl = [];
  for (const t of [150, 260, 400, 520, 610, 700, 790, 880, 940, 1010, 1090, 1200, 1380, 1660, 1950, 2400]) {
    const b = bossAt(poseAt(t)), fl = t > 880 && t < 1700 ? 1 + 0.09 * Math.sin(t / 38) : 1;
    gl.push([t, { transform: `${k.T(b[0] - E[0], b[1] - E[1])} scale(${(glowSc(t) * fl).toFixed(2)})`, opacity: +Math.min(1, glowOp(t)).toFixed(2) }, 'ease-out']);
  }
  fx(k.light('g-sun', E, 58), gl);
  // a hot little core on the boss itself
  fx(k.light('g-sun', E, 18), gl.map(([t, v, e]) => [t, { transform: v.transform, opacity: +Math.min(1, v.opacity * 1.1).toFixed(2) }, e]));

  // ── motes of light streaming in to the boss (gathering)
  const rel = (p) => [p[0] - E[0], p[1] - E[1]];
  for (let i = 0; i < 9; i++) {
    const t0 = 120 + i * 85 + rand() * 40, a = rand() * 6.28, r = 24 + rand() * 12, sz = 3 + rand() * 3;
    const o = [Math.cos(a) * r, Math.sin(a) * r * 0.8], b = bossAt(poseAt(t0 + 640)), rb = rel(b);
    fx(k.pic('mote', E, sz, sz), [[t0, { transform: `${k.T(o[0], o[1])} scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 120, { transform: `${k.T(o[0] * 0.85, o[1] * 0.85)} scale(1)`, opacity: 0.9 }, 'ease-in'],
      [t0 + 640, { transform: `${k.T(rb[0], rb[1])} scale(.5)`, opacity: 0 }]]);
  }

  // ── the bond: the line of soldiers glints in turn
  for (let i = 0; i < 5; i++) {
    const x = [166, 191, 217, 245, 271][i], t = 700 + i * 70;
    fx(k.lightIn('g-sun', [x, 148], 34, 62), [[t, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t + 160, { transform: 'scale(1)', opacity: 0.85 }, eio], [t + 420, { transform: 'scale(1.1)', opacity: 0.45 }, eio], [t + 900, { transform: 'scale(1.2)', opacity: 0 }]]);
  }

  // ── the sun-disc: a spinning copy of the one on his shield, along a high arc from the boss to T
  const mid = [(B0[0] + T[0]) / 2, Math.min(B0[1], T[1]) - 22];
  const arcPts = k.arc(B0, mid, T, 12, (t) => Math.pow(t, 1.25));
  const flight = (lag, op, spin, size0) => arcPts.map((p, j) => {
    const [dx, dy] = rel(p), f = j / 12;
    return [Math.round(1000 + lag + (380 - lag * 0.4) * f), { transform: `${k.T(dx, dy)} rotate(${(spin * f).toFixed(0)}deg) scale(${(size0 + 0.55 * Math.min(1, f * 3)).toFixed(2)})`, opacity: j === 12 ? 0 : op }, 'linear'];
  });
  const hold = { transform: `${k.T(...rel(B0))} scale(.2)`, opacity: 0 };
  fx(k.pic(disc, E, 22, 22), [[0, hold], [999, hold], ...flight(0, 1, 520 * d, 0.45)]);
  // (the streak behind it: sparks that follow its path a little late, smaller and fainter)
  for (let n = 1; n <= 6; n++) {
    const lag = n * 28, fl = flight(lag, 0.8 - n * 0.09, 0, 0.3);
    fx(k.pic('spark', E, 12 - n, 12 - n), [[0, hold], [1000 + lag - 1, hold], ...fl].filter((x, i, a) => i === 0 || x[0] > a[i - 1][0]));
  }
  // a flash of light and sparks off the shield as it thrusts
  fx(k.light('g-sun', B0, 58), [[1000, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1060, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [1300, { transform: 'scale(1.5)', opacity: 0.3 }], [1500, { transform: 'scale(1.7)', opacity: 0 }]]);
  const rb0 = rel(B0);
  for (let n = 0; n < 8; n++) {
    const a = -Math.PI / 2 + (rand() - 0.5) * 2.6 + (right ? 0.4 : -0.4), r = 10 + rand() * 18, sz = 2.2 + rand() * 2.6, t0 = 1020 + rand() * 60, life = 340 + rand() * 200;
    const e = [Math.cos(a) * r - ux * 4, Math.sin(a) * r];
    const pts = k.arc(rb0, [rb0[0] + e[0] * 0.6, rb0[1] + e[1] - 4], [rb0[0] + e[0], rb0[1] + e[1] + 6], 5);
    fx(k.pic('spark', E, sz, sz), pts.map(([x, y], j) => [Math.round(t0 + life * j / 5), { transform: `${k.T(x, y)} scale(${(1 - 0.6 * j / 5).toFixed(2)})`, opacity: j === 5 ? 0 : 1 - 0.1 * j }, j < 2 ? 'ease-out' : 'linear']));
  }

  // ── where it lands (BEATS.impact): flash, starburst, ring, sparks, motes, a warm glow that beats
  const IM = 1380;
  fx(k.light('g-sun', T, 80), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 30, { transform: 'scale(1.2)', opacity: 1 }, 'ease-out'], [IM + 200, { transform: 'scale(1.35)', opacity: 0.7 }, eio], [IM + 330, { transform: 'scale(1.2)', opacity: 0.85 }, eio], [IM + 600, { transform: 'scale(1.4)', opacity: 0.4 }, eio], [IM + 1000, { transform: 'scale(1.6)', opacity: 0 }]]);
  fx(k.pic(star, T, 46, 46), [[IM - 10, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1) rotate(12deg)', opacity: 1 }, 'ease-out'], [IM + 300, { transform: 'scale(1.35) rotate(28deg)', opacity: 0.5 }], [IM + 520, { transform: 'scale(1.5) rotate(40deg)', opacity: 0 }]]);
  for (const [dl, big] of [[0, 1.5], [150, 1.1]]) fx(k.pic(ring, T, 60, 60), [[IM + dl, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + dl + 50, { transform: 'scale(.3)', opacity: 0.95 }, 'ease-out'], [IM + dl + 600, { transform: `scale(${big})`, opacity: 0 }]]);
  for (let n = 0; n < 14; n++) {
    const a = rand() * 6.28, r = 14 + rand() * 26, sz = 2.6 + rand() * 3.4, t0 = IM + rand() * 40, life = 380 + rand() * 340;
    const e = [Math.cos(a) * r, Math.sin(a) * r * 0.85 - 3];
    const pts = k.arc([0, 0], [e[0] * 0.6, e[1] * 0.6 - 7 - rand() * 6], [e[0], e[1] + 7 + rand() * 7], 5);
    fx(k.pic('spark', T, sz, sz), pts.map(([x, y], j) => [Math.round(t0 + life * j / 5), { transform: `${k.T(x, y)} scale(${(1 - 0.65 * j / 5).toFixed(2)})`, opacity: j === 5 ? 0 : 1 - 0.1 * j }, j < 2 ? 'ease-out' : 'linear']));
  }
  for (let n = 0; n < 7; n++) {
    const t0 = IM + 120 + n * 90, x = (rand() - 0.5) * 22, sz = 3 + rand() * 3;
    fx(k.pic('mote', T, sz, sz), [[t0, { transform: `${k.T(x, 6)} scale(.5)`, opacity: 0 }, 'ease-out'], [t0 + 200, { transform: `${k.T(x * 1.1, -4)} scale(1)`, opacity: 0.9 }], [t0 + 1000, { transform: `${k.T(x * 1.4, -26 - rand() * 12)} scale(.6)`, opacity: 0 }]]);
  }
}
