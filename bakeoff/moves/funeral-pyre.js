// Funeral Pyre: the dead are sacrificed and the pyre sends them as a blast.
//
// PLAN (drawing units 300 x 210, ms of the move). An attacker (element: fire; the souls
// ride in it, so the blast is violet at its heart and orange at its edge).
//   150-900   the inhale: the fire is drawn down (squashed, wider) and the pyre's light
//             gathers; the mourners shrink back from the heat; the ghosts in the smoke
//             stretch and wail. The body's soul lifts off the shroud as a pale light.
//   900-1500  the surge: the fire shoots up tall and violet at the crown (BEATS.release 1500
//             is where the blast leaves); the ghosts are drawn down into the crown,
//             swelling, spiralling in one after another; the soul joins them; embers
//             pour up. The mourners flinch, the logs' little flames leap.
//   1500-2160 the blast: a stream of fire and violet light from the crown (emit) to T, the
//             three ghosts streaking at its head like comets, one behind another, each
//             turned head-first to T, with glows riding them. The pyre kicks back.
//   2000-2160 (BEATS.impact 2000, the first ghost; the others every 80 ms) they land on T:
//             flashes, rings, sparks, flames catching, smoke rolling up.
//             Alone, T is above the right-hand mourner, in the picture's own sky.
//   2300-3500 the fire sinks back, the light fades, the mourners straighten. The ghosts
//             re-form in the smoke where they were, from 3250.
//   3900      (BEATS.settle) at rest as drawn.
import { kit, SPARK } from './_fx.js';

export const END = 4400;
export const BEATS = { release: 1500, impact: 2000, settle: 3900 };
export const STILLS = [350, 800, 1250, 1600, 1850, 2060, 2800, 4100];

export const textures = {
  spark: SPARK,
  orb: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [245, 232 - 40 * (1 - c), 255, Math.min(1, c * c * c * 3.2 + c * 0.4)]; }],
  violet: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [200 + 40 * c, 130 + 90 * c * c, 255, Math.min(1, c * c * 1.6)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const K = kit(k);
  const gh = [k.part('ghost0'), k.part('ghost1'), k.part('ghost2')];
  const flames = k.part('flames'), pyre = k.part('pyre'), tongues = k.part('tongues'), mL = k.part('mournerL'), mR = k.part('mournerR');
  const E = k.spec.emit, G = k.spec.ghosts, [BX, BY] = k.spec.body, BASE = k.spec.base;
  const T = k.aim || [236, 70];
  const IM = 2000;

  // ── the fire: drawn down, shoots up, kicks back at the blast, flares again and dies down
  const fl = [[0, { transform: 'none' }, eio], [250, { transform: 'scale(1.03, .94)' }, 'ease-in'], [850, { transform: 'scale(1.09, .76)' }, 'ease-out'], [1250, { transform: 'scale(.86, 1.34)' }, eio], [1480, { transform: 'scale(.9, 1.27)' }, 'ease-in'], [1600, { transform: 'scale(.97, .98)' }, 'ease-out'], [1850, { transform: 'scale(.9, 1.22)' }, eio]];
  for (let t = 1990, i = 0; t < 2500; t += 130 + rand() * 40, i++) fl.push([Math.round(t), { transform: `scale(${(0.93 - (i % 2) * 0.05).toFixed(2)}, ${(1.18 + (i % 2) * 0.1 - i * 0.03).toFixed(2)})` }, eio]);
  fl.push([2750, { transform: 'scale(1.03, .9)' }, eio], [3300, { transform: 'scale(.99, 1.03)' }, eio], [3700, { transform: 'none' }]);
  act(flames, fl);
  const tg = [[0, { transform: 'none' }, eio], [850, { transform: 'scale(1.02, .85)' }, 'ease-out'], [1250, { transform: 'scale(1.1, 1.7)' }, eio], [1480, { transform: 'scale(1.05, 1.5)' }, 'ease-in'], [1600, { transform: 'scale(1, .95)' }, 'ease-out'], [1900, { transform: 'scale(1.08, 1.5)' }, eio], [2400, { transform: 'scale(1.04, 1.3)' }, eio], [2900, { transform: 'scale(1, 1.05)' }, eio], [3500, { transform: 'none' }]];
  act(tongues, tg);
  // the pyre itself shudders a hair as the fire goes
  const py = [[0, { transform: 'none' }, eio]];
  for (let t = 1250, i = 0; t < 2300; t += 70, i++) py.push([t, { transform: `${k.T((i % 2 ? 0.35 : -0.35) * Math.max(0.2, 1 - (t - 1250) / 1000), 0)}` }, 'linear']);
  py.push([2500, { transform: 'none' }]);
  act(pyre, py);
  // the mourners: shrink back from the heat, flinch at the surge, straighten
  const mourn = (part, d) => act(part, [[0, { transform: 'none' }, eio], [500, { transform: `rotate(${d * -1.6}deg) scale(1, .995)` }, eio], [900, { transform: `rotate(${d * -2.6}deg) scale(1, .985)` }, 'ease-out'], [1250, { transform: `rotate(${d * -4.4}deg) scale(1, .975)` }, 'ease-out'], [1500, { transform: `rotate(${d * -3.6}deg) scale(1, .98)` }, eio], [2300, { transform: `rotate(${d * -3}deg) scale(1, .985)` }, eio], [3100, { transform: `rotate(${d * 0.5}deg) scale(1, 1)` }, eio], [3500, { transform: 'none' }]]);
  mourn(mL, 1); mourn(mR, -1);

  // ── the lights: the pyre's, the violet at the crown, then the blast's
  fx(k.lightIn('g-warm', [150, 150], 210, 130), [[150, { opacity: 0 }, 'ease-out'], [850, { opacity: 0.5 }, eio], [1250, { opacity: 0.62 }, eio], [1700, { opacity: 0.45 }, eio], [2300, { opacity: 0.55 }, eio], [3000, { opacity: 0.2 }, eio], [3600, { opacity: 0 }]]);
  fx(k.lightIn('g-aura', [150, 62], 120, 90), [[600, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [1250, { transform: 'scale(1.1)', opacity: 0.6 }, eio], [1700, { transform: 'scale(1.2)', opacity: 0.5 }, eio], [2400, { transform: 'scale(1)', opacity: 0.35 }, eio], [3200, { transform: 'scale(.8)', opacity: 0 }]]);
  // the soul lifts off the shroud, rises into the crown
  fx(k.picIn('orb', [BX, BY], 16, 16), [[300, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [700, { transform: `${k.T(0, -6)} scale(.8)`, opacity: 1 }, 'ease-in'], [1300, { transform: `${k.T(E[0] - BX, E[1] - BY)} scale(1.3)`, opacity: 1 }, 'ease-out'], [1550, { transform: `${k.T(E[0] - BX, E[1] - BY)} scale(2.2)`, opacity: 0 }]]);
  fx(k.lightIn('g-aura', [BX, BY - 4], 40, 30), [[300, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [700, { transform: 'scale(1)', opacity: 0.9 }, eio], [1100, { transform: 'scale(.6)', opacity: 0 }]]);
  // embers pouring up the column
  for (let i = 0; i < 26; i++) {
    const t0 = 1000 + rand() * 1500, x = BASE[0] + (rand() - 0.5) * 70, y = 150 - rand() * 40, rise = 50 + rand() * 70, dx = (rand() - 0.5) * 26, sz = 2 + rand() * 3;
    fx(k.picIn('spark', [x, y], sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 220, { transform: `${k.T(dx * 0.2, -rise * 0.2)} scale(1)`, opacity: 1 }, 'ease-out'], [t0 + 1100, { transform: `${k.T(dx, -rise)} scale(.4)`, opacity: 0 }]]);
  }
  // extra tongues of flame standing up on the pyre's top while it surges
  for (let i = 0; i < 6; i++) {
    const x = 122 + i * 11 + (rand() - 0.5) * 4;
    K.flicker(k.picIn(i % 2 ? 'flame' : 'flame2', [x, 132], 12 + rand() * 4, 26 + rand() * 18, { base: true }), 1000 + i * 70, 2350 + rand() * 250);
  }

  // ── the ghosts: stretch and wail, are drawn into the crown, then go as comets
  const arcOf = (S, Q, lift) => K.arcPath(S, Q, lift);
  const pace = (f) => f * f * 0.6 + f * 0.4;
  gh.forEach((g, i) => {
    const P = G[i], dep = 1500 + i * 80, land = IM + i * 80, conv = 1000 + i * 90;
    const S = [E[0] + (i - 1) * 11, E[1] + (i % 2 ? 7 : -4)], Ti = [T[0] + (i - 1) * 5, T[1] + (i % 2 ? 4 : -3)];
    const rel = (p) => k.T(p[0] - P[0], p[1] - P[1]);
    const L = [[0, { transform: 'none', opacity: 1 }, eio], [450 + i * 60, { transform: `${k.T(0, -2.5)} scale(.96, 1.1)`, opacity: 1 }, eio], [conv, { transform: `${k.T(0, -3)} scale(.9, 1.16)`, opacity: 1 }, 'ease-in']];
    // drawn into the crown, swelling
    const conA = arcOf(P, S, 12);
    const spin = (i % 2 ? -1 : 1) * 34;
    for (let j = 1; j <= 5; j++) { const f = j / 5, p = conA(f * f * 0.5 + f * 0.5); L.push([Math.round(conv + (dep - 100 - conv) * f), { transform: `${rel(p)} rotate(${(spin * f).toFixed(0)}deg) scale(${(0.9 + 0.3 * f).toFixed(2)}, ${(1.16 - 0.2 * f).toFixed(2)})`, opacity: 1 }, 'linear']); }
    L.push([dep, { transform: `${rel(S)} rotate(${spin}deg) scale(1.3, 1.1)`, opacity: 1 }, 'ease-in']);
    // the flight, head first, long and thin
    const ang = (Math.atan2(Ti[1] - S[1], Ti[0] - S[0]) * 180) / Math.PI + 90, C = [(S[0] + Ti[0]) / 2, Math.min(S[1], Ti[1]) - 24 - i * 6], fb = arcOf(S, Ti, 0);
    const N = 10, bz = (f) => { const q = 1 - f; return [q * q * S[0] + 2 * q * f * C[0] + f * f * Ti[0], q * q * S[1] + 2 * q * f * C[1] + f * f * Ti[1]]; };
    for (let j = 1; j <= N; j++) { const f = j / N, p = bz(pace(f)); L.push([Math.round(dep + (land - dep) * f), { transform: `${rel(p)} rotate(${ang.toFixed(0)}deg) scale(1, 1.75)`, opacity: 1 }, 'linear']); }
    L.push([land + 90, { transform: `${rel(Ti)} rotate(${ang.toFixed(0)}deg) scale(1.5, 2)`, opacity: 0 }, 'ease-out']);
    L.push([3200, { transform: `${rel(Ti)} rotate(${ang.toFixed(0)}deg) scale(1.5, 2)`, opacity: 0 }, 'linear'], [3250 + i * 90, { transform: `${k.T(0, 7)} scale(.92, .92)`, opacity: 0 }, 'ease-out'], [3900, { transform: 'none', opacity: 1 }]);
    act(g, L.filter((x, j, a) => j === 0 || x[0] > a[j - 1][0]));
    // glows riding it: violet and fire, in flight
    const ride = (cls, size, o) => {
      const Lg = [[dep - 60, { transform: `${k.T(S[0] - P[0], S[1] - P[1])} scale(.3)`, opacity: 0 }, 'ease-out'], [dep, { transform: `${k.T(0, 0)} scale(1)`, opacity: o }, 'ease-in']];
      return { Lg, size, cls };
    };
    for (const [cls, size, o] of [['g-aura', 46, 1], ['g-warm', 24, 0.9]]) {
      const el = k.light(cls, S, size), Lg = [[dep - 80, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [dep, { transform: 'scale(1)', opacity: o }, 'ease-in']];
      for (let j = 1; j <= N; j++) { const f = j / N, p = bz(pace(f)); Lg.push([Math.round(dep + (land - dep) * f), { transform: `${k.T(p[0] - S[0], p[1] - S[1])} scale(1.1)`, opacity: o }, 'linear']); }
      Lg.push([land + 60, { transform: `${k.T(Ti[0] - S[0], Ti[1] - S[1])} scale(2.4)`, opacity: 0 }, 'ease-out']);
      fx(el, Lg);
    }
    // the little flash as it lands, in violet
    fx(k.light('g-aura', Ti, 44), [[land - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [land + 30, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [land + 380, { transform: 'scale(1.9)', opacity: 0 }]]);
    fx(K.ring ? k.pic(K.ring, Ti, 44, 44) : k.pic('violet', Ti, 40, 40), [[land, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [land + 50, { transform: 'scale(.4)', opacity: 0.8 }, 'ease-out'], [land + 420, { transform: 'scale(1)', opacity: 0 }]]);
  });

  // ── the blast's body: fire and violet billows along an arc from the crown to T
  const C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 28];
  const bz = (t) => { const q = 1 - t; return [q * q * E[0] + 2 * q * t * C[0] + t * t * T[0], q * q * E[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  for (let i = 0; i < 20; i++) {
    const t0 = 1480 + i * 42, r = Math.round(rand() * 360), side = (rand() - 0.5) * 7, src = ['puff', 'violet', 'puffHot', 'violet', 'puffCool'][i % 5];
    const at = (t, sc, o) => { const p = bz(t); return { transform: `${k.T(p[0] - E[0], p[1] - E[1] + side * t)} rotate(${r + Math.round(t * 60)}deg) scale(${sc})`, opacity: o }; };
    fx(k.pic(src, E, 34, 34), [[t0, at(0, 0.4, 0), 'ease-out'], [t0 + 60, at(0.2, 0.65, 0.95)], [t0 + 160, at(0.5, 0.85, 0.9)], [t0 + 280, at(0.85, 1, 0.85)], [t0 + 360, at(1, 1.25, 0.7), 'ease-out'], [t0 + 620, at(1, 1.9, 0)]]);
  }
  // fire at its mouth, the crown's flames licking out while it leaves
  for (let i = 0; i < 4; i++) K.flicker(k.pic(i % 2 ? 'flame' : 'flame2', [E[0] + (i - 1.5) * 8, E[1] + 12], 12 + rand() * 3, 22 + rand() * 8, { base: true }), 1250 + i * 80, 1900 + rand() * 200, 0);
  // and where the first lands: the fire's burst
  K.burst(T, IM, { size: 1.15, flames: 4, linger: 800 });
  // a violet bloom over the fire at T, lingering
  fx(k.light('g-aura', T, 86), [[IM - 20, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 120, { transform: 'scale(1.1)', opacity: 0.9 }, 'ease-out'], [IM + 600, { transform: 'scale(1.2)', opacity: 0.5 }, eio], [IM + 1300, { transform: 'scale(1.5)', opacity: 0 }]]);
}
