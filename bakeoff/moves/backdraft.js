// Backdraft: the gate draws a breath, and the fire comes back out.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker (changed from the suggested
// support: the Trap deals 2 damage to each attacker, so the fire IS the attack), element: fire.
// Alone it strikes the attackers in the picture, one on each side (`alone`: both points);
// aimed, it goes to the one point k.aim.
//   0-900     the draw of breath: the line of attackers charges in a pace, the blast sucks back
//             into the arch (shrinking, dimming), the white-hot door gutters, embers are drawn
//             in, the man caught in the arch lifts his arms.
//   900-1000  the hush: the blast is a spark, the door dark red.
//   1000      RELEASE: the blast bursts out of the arch (it overshoots, flashes white) and fireballs
//             are flung in arcs from the arch to T: billows, a streak of flame, sparks.
//   1300      IMPACT at T: a burst of fire and light, flames catch and flicker, smoke rolls up,
//             sparks fly; the line is thrown back, the man in the arch flung up and let fall.
//   1500-3100 the blast roars and shrinks back to its drawn size, the flames at T die, the line
//             finds its feet again, smoke pours up over the wall.
//   3300      at rest as drawn (BEATS.settle); the move ends at END.
// Contract: T = k.aim (one point) or the picture's own two points; every stream is worked out from
// the arch (`emit`) to its T on the overlay.
export const END = 4000;
export const BEATS = { release: 1000, impact: 1300, settle: 3300 };
export const STILLS = [350, 800, 1000, 1120, 1320, 1600, 2400, 3700];

export const textures = {
  ember: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r), h = c * c; return [255, 150 + 100 * h, 60 + 150 * h * h, Math.min(1, c * c * 2)]; }],
  glint: [32, 32, (x, y) => { const dx = Math.abs(x - 0.5) * 2, dy = Math.abs(y - 0.5) * 2, c = Math.max(0, 1 - Math.hypot(dx, dy)), cr = Math.max(0, 1 - Math.min(dx * 8 + dy, dy * 8 + dx)), v = Math.min(1, c * c * 1.5 + cr * 0.8); return [255, 230 + 25 * v, 170 + 85 * v, v]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, E = S.emit;
  const TS = k.aim ? [k.aim] : S.alone;
  const REL = 1000, FLY = 300, IMP = REL + FLY;
  const c01 = (x) => Math.max(0, Math.min(1, x));
  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  const grid = [];
  for (let t = 0; t <= 3300; t += 35) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3500, { transform: 'none' }]];
  k.css(`.g-fire { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,248,220,.95), rgba(255,176,74,.6) 30%, rgba(255,106,31,.25) 60%, rgba(255,90,20,0) 100%); }
    .g-hot { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,150,60,.55), rgba(255,100,30,.28) 45%, rgba(200,60,20,.1) 75%, rgba(200,60,20,0) 100%); }`);

  // ── the blast: sucked back into the arch, a spark of it, then out with a roar, and home as drawn
  const BS = curve([[0, 1], [220, 0.9], [650, 0.5], [REL - 80, 0.4], [REL + 90, 1.4], [REL + 260, 1.2], [REL + 600, 1.1], [1800, 1.07], [2600, 1.02], [3300, 1]]);
  const BO = curve([[0, 1], [650, 0.55], [REL - 80, 0.45], [REL + 90, 1], [3300, 1]]);
  const flick = (t) => (t > REL + 100 && t < 2800 ? Math.sin(t / 55) * 0.05 * Math.exp(-(t - REL) / 1100) : 0);
  act(k.part('blast'), sample((t) => ({ transform: `scale(${(BS(t) + flick(t)).toFixed(3)}, ${(BS(t) - flick(t) * 1.4).toFixed(3)})`, opacity: +BO(t).toFixed(3) })));
  // the white-hot door gutters in the draught, goes dark, then flares
  act(k.part('hot'), [[0, { opacity: 1 }, eio], [180, { opacity: 0.55 }, eio], [330, { opacity: 0.9 }, eio], [520, { opacity: 0.4 }, eio], [700, { opacity: 0.7 }, eio], [900, { opacity: 0.25 }, eio], [REL + 60, { opacity: 1 }, eio], [2000, { opacity: 0.85 }, eio], [3200, { opacity: 1 }]]);
  // the line: charges in a pace (bigger, lower), is thrown back by the blast, shivers, finds its feet
  const CR = curve([[0, 0], [300, 0.5], [850, 1], [REL, 1], [REL + 70, -1.3], [IMP + 200, -0.7], [2100, -0.2], [3000, 0]]);
  const shiv = (t) => (t > REL ? Math.exp(-(t - REL) / 260) * Math.sin((t - REL) / 24) : 0);
  act(k.part('crew'), sample((t) => ({ transform: `${k.T(shiv(t) * 0.7, CR(t) * 1.2 * (CR(t) > 0 ? 1 : 2.6))} scale(${(1 + 0.012 * CR(t)).toFixed(4)}) rotate(${(shiv(t) * 0.9).toFixed(2)}deg)` })));
  // the man in the arch: arms up, flung up and back as it bursts, let fall
  const CY = curve([[0, 0], [700, 0.6], [REL - 40, 0.2], [REL + 100, -9], [REL + 260, -12], [IMP + 400, -4], [IMP + 720, 0.6], [IMP + 900, 0], [3000, 0]]);
  const CRo = curve([[0, 0], [REL - 40, 0], [REL + 140, 9], [IMP + 420, 4], [IMP + 760, -2], [IMP + 950, 0]]);
  act(k.part('caught'), sample((t) => ({ transform: `${k.T(0, CY(t))} rotate(${CRo(t).toFixed(2)}deg) scale(${(1 + 0.02 * c01((t - REL) / 200) * (1 - c01((t - IMP) / 800))).toFixed(3)})` })));

  // ── light: the arch's glow draws in and bursts; a warm wash over the whole picture
  const AL = curve([[0, 0.5], [650, 0.15], [REL - 60, 0.1], [REL + 80, 1], [REL + 400, 0.8], [1800, 0.55], [3000, 0.1], [3400, 0]]);
  fx(k.lightIn('g-fire', [150, 140], 170, 150), [...grid.filter((t) => t >= 35).map((t) => [t, { transform: `scale(${(0.5 + 0.7 * AL(t) + flick(t)).toFixed(3)})`, opacity: +(0.9 * AL(t)).toFixed(3) }, 'linear']), [3600, { transform: 'scale(.5)', opacity: 0 }]]);
  fx(k.lightIn('g-hot', [150, 150], 330, 190), [[REL - 60, { opacity: 0 }, 'ease-out'], [REL + 120, { opacity: 1 }, 'ease-out'], [IMP + 500, { opacity: 0.6 }, eio], [2900, { opacity: 0 }]]);
  // a flash on the wall
  fx(k.lightIn('g-fire', [150, 120], 300, 200), [[REL - 20, { opacity: 0 }, 'ease-out'], [REL + 70, { opacity: 0.8 }, 'ease-out'], [REL + 300, { opacity: 0 }]]);

  // ── the draw of breath: embers and sparks pulled in to the arch
  for (let i = 0; i < 22; i++) {
    const t = 150 + Math.round(rand() * 650), a = rand() * Math.PI * 2, d = 40 + rand() * 50, sz = 2.2 + rand() * 2.6;
    const x = 150 + Math.cos(a) * d, y = 146 + Math.sin(a) * d * 0.6;
    fx(k.picIn('ember', [x, y], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-in'], [t + 120, { transform: 'scale(1)', opacity: 1 }, 'ease-in'], [t + 330, { transform: `${k.T(150 - x, 146 - y)} scale(.3)`, opacity: 0 }]]);
  }
  // ── at the burst: sparks radiate out of the arch, smoke rolls up over the wall
  for (let i = 0; i < 26; i++) {
    const t = REL + 40 + Math.round(rand() * 120), a = rand() * Math.PI * 2, d = 40 + rand() * 80, sz = 2.2 + rand() * 3;
    fx(k.picIn(i % 3 ? 'ember' : 'glint', [150, 140], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 150, { transform: `${k.T(Math.cos(a) * d * 0.7, Math.sin(a) * d * 0.5)} scale(1)`, opacity: 1 }, 'ease-out'], [t + 900 + Math.round(rand() * 500), { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d * 0.7 + 24)} scale(.3)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 5; i++) {
    const t = REL + 150 + i * 240, x = 118 + rand() * 64, r = Math.round(rand() * 360);
    fx(k.picIn('smoke', [x, 70], 34, 34, { lit: false }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 400, { transform: `${k.T(-3, -14)} rotate(${r + 20}deg) scale(1)`, opacity: 0.6 }], [t + 1700, { transform: `${k.T(-9, -56)} rotate(${r + 50}deg) scale(2.1)`, opacity: 0 }]]);
  }
  // flames left standing on the steps of the gate, flickering and dying
  const flicker = (el, on, off, lean = 0) => {
    const sk = (d) => `skewX(${(lean + d).toFixed(1)}deg)`;
    const list = [[on, { transform: `translateY(0px) scale(.6, .12) ${sk(0)}`, opacity: 0 }, 'ease-out'], [on + 120, { transform: `translateY(0px) scale(1, 1) ${sk(0)}`, opacity: 0.95 }, eio]];
    const step = off - on > 1200 ? 120 : 70;
    for (let t = on + 120, i = 1; (t += step + rand() * 60) < off; i++) {
      const s = i % 2 ? 1 : -1;
      list.push([t, { transform: `translateY(${(-rand() * 1.5).toFixed(1)}px) scale(${(1 - s * 0.08 - rand() * 0.06).toFixed(2)}, ${(1 + s * 0.14 + rand() * 0.1).toFixed(2)}) ${sk(s * (2 + rand() * 5))}`, opacity: +(0.8 + rand() * 0.2).toFixed(2) }, eio]);
    }
    list.push([Math.min(k.END, off + 260), { transform: `translateY(0px) scale(.5, .15) ${sk(0)}`, opacity: 0 }]);
    fx(el, list);
  };
  for (let i = 0; i < 6; i++) flicker(k.picIn(i % 2 ? 'flame' : 'flame2', [112 + i * 15 + (rand() - 0.5) * 4, 180], 11 + rand() * 4, 18 + rand() * 12, { base: true }), REL + 80 + i * 60, 2200 + rand() * 500);

  // ── the release: fireballs from the arch to each T (arcs, billows, a streak of flame), on the overlay
  const [X0, Y0] = k.P(...E);
  TS.forEach((T, ti) => {
    const C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 18 - Math.abs(T[0] - E[0]) * 0.08];
    const bz = (t) => { const q = 1 - t; return [q * q * E[0] + 2 * q * t * C[0] + t * t * T[0], q * q * E[1] + 2 * q * t * C[1] + t * t * T[1]]; };
    for (let i = 0; i < 12; i++) {
      const t0 = REL + ti * 20 + i * 30, r = Math.round(rand() * 360), side = (rand() - 0.5) * 7;
      const at = (t, sc, o) => { const [x, y] = k.P(...bz(t)); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + side * Math.sin(Math.PI * t) * u).toFixed(1)}px) rotate(${r + Math.round(t * 60)}deg) scale(${sc})`, opacity: o }; };
      fx(k.pic(i % 3 === 2 ? 'puffCool' : i % 4 === 0 ? 'puffHot' : 'puff', E, 24, 24), [[t0, at(0, 0.45, 0), 'ease-out'], [t0 + 50, at(0.25, 0.65, 0.95)], [t0 + 120, at(0.55, 0.85, 0.9)],
        [t0 + 200, at(0.85, 1, 0.85)], [t0 + FLY - 40, at(1, 1.25, 0.7), 'ease-out'], [t0 + FLY + 220, at(1, 1.9, 0)]]);
    }
    // a streak of flame, and the ball of fire that leads
    for (const [tex, sz, s1, d] of [['flame', 16, 1.2, 0], ['puffHot', 20, 1.1, 40]]) {
      const kf = [], n = 8;
      for (let j = 0; j <= n; j++) {
        const f = j / n, q = bz(f), [x, y] = k.P(...q);
        kf.push([Math.round(REL + ti * 20 + d + (FLY - 20) * f), { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) scale(${(0.6 + (s1 - 0.6) * f).toFixed(2)})`, opacity: j === 0 ? 0 : 1 }, 'linear']);
      }
      kf.push([REL + ti * 20 + d + FLY + 40, { ...kf.at(-1)[1], opacity: 0 }]);
      fx(k.pic(tex, E, sz, sz), kf);
    }
    // where it lands (BEATS.impact): a burst of light, flames catching, smoke rolling up, sparks
    const IT = IMP + ti * 20;
    const il = [[IT - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IT + 60, { transform: 'scale(1.2)', opacity: 0.95 }]];
    for (let t = IT + 180, i = 0; t < 2300; t += 120, i++) il.push([t, { transform: `scale(${i % 2 ? 1.12 : 0.95})`, opacity: i % 2 ? 0.95 : 0.7 }, eio]);
    il.push([2700, { transform: 'scale(.7)', opacity: 0 }]);
    fx(k.light('g-fire', T, 62), il);
    for (let i = 0; i < 4; i++) flicker(k.pic(i % 2 ? 'flame' : 'flame2', [T[0] + (i - 1.5) * 7, T[1] + 6], 10 + rand() * 4, 16 + rand() * 8, { base: true }), IT + 60 + i * 70, 2200 + rand() * 250);
    for (let i = 0; i < 5; i++) {
      const t = IT + 20 + Math.round(rand() * 60), r = Math.round(rand() * 360);
      fx(k.pic(i % 2 ? 'puff' : 'puffHot', T, 24, 24), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 100, { transform: `${k.T((rand() - 0.5) * 16, (rand() - 0.7) * 12)} rotate(${r + 40}deg) scale(1.3)`, opacity: 0.95 }], [t + 500, { transform: `${k.T((rand() - 0.5) * 24, -14 - rand() * 10)} rotate(${r + 80}deg) scale(1.9)`, opacity: 0 }]]);
    }
    for (let i = 0; i < 14; i++) {
      const a = rand() * Math.PI * 2, d = 10 + rand() * 24, t0 = IT + Math.round(rand() * 120), sz = 2.4 + rand() * 3;
      fx(k.pic(i % 3 ? 'ember' : 'glint', T, sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 100, { transform: `${k.T(Math.cos(a) * d * 0.5, Math.sin(a) * d * 0.5 - 4)} scale(1)`, opacity: 1 }, 'ease-out'], [t0 + 700 + Math.round(rand() * 400), { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d * 0.6 + 12)} scale(.3)`, opacity: 0 }]]);
    }
    for (let i = 0; i < 4; i++) {
      const t = IT + 300 + i * 180, r = Math.round(rand() * 360);
      fx(k.pic('smoke', [T[0] + (rand() - 0.5) * 10, T[1] - 6], 26, 26, { lit: false, low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 300, { transform: `${k.T(-2, -12)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 1300, { transform: `${k.T(-8, -46)} rotate(${r + 50}deg) scale(2)`, opacity: 0 }]]);
    }
  });
}
