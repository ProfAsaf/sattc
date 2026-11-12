// One More Wave (a spell, a support: you take an extra turn, so the sea gives you one more).
// The second wave behind the boat rears: it swells taller and leans over the boat, foam
// churning along the crest, spray torn off it and flung ahead on the wind, a pale light
// gathering along the crest, while the sailor leans back to look up at it and the boat lifts
// on the first wave. Then the sea gives its gift: a surge of lit water, foam and glints
// trailing, runs down off the crest to T, and then -- one more -- a second, smaller surge
// follows it. Where it lands a flash and rings bloom, a crown of drops is thrown up and warm
// motes rise; the first wave swells under the boat, which is thrown up and rocks, the
// lantern flares, the sailor jolts and cheers. Then the great wave settles back, the boat
// rocks to a stop, and everything is as drawn.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support (as suggested: the sea gives
// its boon), element water.
//   0-800    GATHER: the wave rears (taller, leaning in), foam churns, spray flung, light
//            gathers along the crest; the sailor leans back; the boat lifts and pitches.
//   800      RELEASE: the first surge leaves the crest (emit) for T on an arc, foam trailing
//            (the wave surges forward as it lets go). A second, smaller surge at 1180.
//   1250     IMPACT at T: flash, rings, crown of drops, motes; the near wave swells, the boat
//            and sailor are thrown up, the lantern flares. The second surge lands at 1630.
//   1630-3400 the great wave sinks back, the boat rocks to a stop, light and motes fade. At
//            rest as drawn from 3400.
// Aimed: T = k.aim || the boat (spec.hit). The surge is built from the crest (emit) to T.
import { mul, rot, scl, tr, app, curve, kit } from './_fx.js';
export const END = 3900;
export const BEATS = { release: 800, impact: 1250, settle: 3400 };
export const STILLS = [350, 700, 900, 1100, 1300, 1700, 2400, 3700];
export const textures = {
  glint: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226 + 29 * c, 252, 255, Math.min(1, c * c * 2.6)]; }],
  drop: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [214 + 41 * c, 248, 250, Math.min(1, c * 3)]; }],
  vapor: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, a = Math.max(0, 1 - r); const b = 0.92 + 0.08 * Math.sin(x * 16) * Math.cos(y * 12); return [226 * b, 244 * b, 244 * b, Math.min(1, a * a * 2) * 0.8]; }],
  warm: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 226 + 29 * c, 150 + 90 * c * c, Math.min(1, c * c * 2.6)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const S = k.spec, E = S.emit, BO = S.boat, WA = S.waist, LA = S.lantern;
  const REL = BEATS.release, IM = BEATS.impact, BACK = BEATS.settle, End = BACK + 200;
  const T = k.aim || S.hit;
  k.css('.g-sea { border-radius: 50%; background: radial-gradient(circle, rgba(240,255,250,.92), rgba(176,236,226,.5) 32%, rgba(120,200,200,.16) 60%, rgba(110,190,196,0) 74%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><circle cx="50" cy="50" r="42" fill="none" stroke="#d4f6ee" stroke-width="5" filter="url(#b)"/><circle cx="50" cy="50" r="42" fill="none" stroke="#f4fffb" stroke-width="1.4"/>', 100, 100);
  const swell = k.svg('<defs><filter id="b" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation=".9"/></filter><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#bfe8e0" stop-opacity="0"/><stop offset=".5" stop-color="#e8fff8"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs>' +
    '<path d="M2,26C6,13 20,4 34,6C44,8 48,17 43,24C39,16 30,13 23,17C16,21 9,26 2,26Z" fill="url(#g)" filter="url(#b)"/><path d="M6,24C10,14 21,8 33,9C40,10 43,15 41,20C37,15 30,14 24,17C17,20 11,24 6,24Z" fill="#ffffff" opacity=".75"/>', 48, 30);

  // ── the great wave rears, leaning in over the boat, about its foot; everything on it moves with it
  const sy = curve([[0, 1], [350, 1.02], [650, 1.055], [820, 1.075, 'out'], [1250, 1.05], [1800, 1.02], [2400, 1.03], [3000, 1.01], [BACK, 1]]);
  const lean = curve([[0, 0], [350, -0.7], [650, -1.5], [820, -2.4, 'out'], [1250, -1.7], [1800, -0.8], [2500, -1], [3000, -0.3], [BACK, 0]]);
  const Ww = (t) => mul(rot(lean(t), 240, 214), scl(1, sy(t), 240, 214));
  const act1 = curve([[0, 0], [300, 0.7], [1000, 1], [2000, 0.5], [2900, 0.1], [BACK, 0]]);
  h.drive(k.part('wave'), [240, 214], Ww, End, 40);
  h.drive(k.part('foam'), [240, 214], (t) => { const a = act1(t); return mul(Ww(t), scl(1 + 0.008 * a * Math.sin(t / 85), 1 + 0.018 * a * Math.sin(t / 66 + 1), 240, 20)); }, End, 40);
  h.drive(k.part('spray'), [262, 70], (t) => { const a = act1(t); return mul(Ww(t), mul(tr(-3 * a * (1 + Math.sin(t / 140)), 1.5 * a * Math.sin(t / 95)), rot(10 * a * Math.sin(t / 120), 262, 70))); }, End, 30);
  h.drive(k.part('mist'), [240, 214], (t) => mul(Ww(t), tr(-4 * act1(t) * Math.sin(t / 400), 0)), End, 50);

  // ── the first wave swells under the boat; the boat rides it
  const ny = curve([[0, 0], [450, 0.012], [800, 0.004], [IM - 150, 0.006], [IM + 90, 0.052, 'out'], [IM + 450, -0.01], [IM + 820, 0.02], [IM + 1250, -0.005], [1950, 0.007], [2600, -0.002], [BACK, 0]]);
  const pitch = curve([[0, 0], [300, -2], [700, 2], [IM - 100, 1], [IM + 100, -5, 'out'], [IM + 400, 3.5], [IM + 800, -2.6], [IM + 1250, 1.6], [1950, -0.8], [2600, 0.3], [BACK, 0]]);
  h.drive(k.part('near'), [150, 214], (t) => scl(1, 1 + ny(t), 150, 214), End, 30);
  const Wh = (t) => mul(tr(0, -ny(t) * (214 - BO[1])), rot(pitch(t), 100, 120));
  h.drive(k.part('hull'), [100, 120], Wh, End, 30);
  // the sailor: leans back to look up at the wave, jolts when the swell takes the boat, cheers (rises), settles
  const slean = curve([[0, 0], [500, 5], [800, 7], [IM - 60, 6], [IM + 90, -4, 'out'], [IM + 350, 6], [IM + 650, 0.5], [IM + 1000, 2.5], [1900, 0.5], [BACK, 0]]);
  const sup = curve([[0, 1], [IM + 60, 1], [IM + 250, 1.06, 'out'], [IM + 600, 1], [BACK, 1]]);
  h.drive(k.part('sailor'), WA, (t) => mul(Wh(t), mul(rot(slean(t), WA[0], WA[1]), scl(1, sup(t), WA[0], WA[1]))), End, 30);
  const lf = curve([[0, 1], [500, 1.12], [REL, 1.2], [IM - 100, 1.1], [IM + 60, 2.1, 'out'], [IM + 320, 1.35], [IM + 800, 1.18], [2400, 1.05], [BACK, 1]]);
  h.drive(k.part('lantern'), LA, (t) => mul(Wh(t), scl(lf(t), lf(t), LA[0], LA[1])), End, 30);

  // ── a pale light gathers along the crest and goes with the surge; the lantern's warm light flares
  const crestPts = [[96, 51], [128, 38], [158, 27], [186, 19], [210, 15], [234, 18], [254, 28]];
  const crestY = (x) => { for (let i = 0; i < crestPts.length - 1; i++) { const [x0, y0] = crestPts[i], [x1, y1] = crestPts[i + 1]; if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0); } return 28; };
  fx(k.light('g-sea', [212, 20], 90), [[150, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [REL - 60, { transform: 'scale(1.05)', opacity: 0.55 }, eio], [REL + 40, { transform: 'scale(1.35)', opacity: 0.85 }, 'ease-out'], [IM, { transform: 'scale(1.1)', opacity: 0.4 }, eio], [2000, { transform: 'scale(.9)', opacity: 0.2 }, eio], [BACK, { transform: 'scale(.7)', opacity: 0 }]]);
  fx(k.lightIn('g-sea', [170, 60], 260, 90, { under: true }), [[200, { opacity: 0 }, 'ease-out'], [REL, { opacity: 0.35 }, eio], [IM, { opacity: 0.3 }, eio], [2400, { opacity: 0.1 }, eio], [BACK, { opacity: 0 }]]);
  const flare = [[IM - 120, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(1.5)', opacity: 0.95 }, 'ease-out'], [IM + 400, { transform: 'scale(1.1)', opacity: 0.5 }, eio], [1900, { transform: 'scale(1)', opacity: 0.25 }, eio], [BACK, { transform: 'scale(.7)', opacity: 0 }]];
  fx(k.light('g-warm', LA, 46), flare);

  // ── gathering: spray torn off the crest and flung ahead of it on the wind (to the left, toward the boat)
  for (let i = 0; i < 18; i++) {
    const t0 = 120 + i * 40 + rand() * 40, x = 140 + rand() * 118, y = crestY(x) - 1 + rand() * 4, sz = 2.6 + rand() * 3.2, p0 = app(Ww(t0), [x, y]);
    const dx = -(18 + rand() * 34), dy = 6 + rand() * 22, life = 650 + rand() * 400;
    fx(k.pic(i % 4 === 3 ? 'vapor' : 'drop', p0, i % 4 === 3 ? sz * 3 : sz, i % 4 === 3 ? sz * 3 : sz, { lit: i % 4 !== 3 }), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 90, { transform: `${k.T(dx * 0.12, -3)} scale(1)`, opacity: i % 4 === 3 ? 0.5 : 0.95 }, 'ease-out'], [t0 + life * 0.6, { transform: `${k.T(dx * 0.6, dy * 0.3)} scale(1)`, opacity: 0.8 }, 'linear'], [t0 + life, { transform: `${k.T(dx, dy)} scale(.6)`, opacity: 0 }]]);
  }

  // ── the gifts: a surge of lit water off the crest to T (REL to IM), and a smaller one behind it
  const surge = (t0, t1, size, base, off) => {
    const M = app(Ww(t0 + 40), [E[0] + off, E[1] + off * 0.3]), bz = h.arcPath(M, T, 16);
    const ang = (Math.atan2(T[1] - M[1], T[0] - M[0]) * 180) / Math.PI;
    for (let i = 0; i < 3; i++) {
      const a0 = t0 + i * 40, a1 = t1 + i * 14, o2 = (i - 1) * 3;
      const bz2 = (f) => { const p = bz(f); return [p[0], p[1] + o2 * Math.sin(Math.PI * f)]; };
      h.fly(k.pic(swell, M, (30 - i * 5) * size, (19 - i * 3) * size), M, bz2, a0, a1, (f) => 0.6 + 0.55 * f, (f) => (f < 0.1 ? f * 8 : f > 0.94 ? 0.3 : (0.95 - i * 0.2) * base), ang, 0, 40);
    }
    for (let i = 0; i < Math.round(20 * size); i++) {
      const s0 = t0 + 10 + i * 14, s1 = t1 - 30 + i * 10, id = i % 3, sz = [4, 13, 5][id] * (0.7 + 0.3 * size), sd = (rand() - 0.5) * 10, r = Math.round(rand() * 360);
      const bz2 = (f) => { const p = bz(f); return [p[0], p[1] + sd * Math.sin(Math.PI * f) + 3 * f]; };
      h.fly(k.pic(id === 1 ? 'vapor' : 'drop', M, sz, sz, { lit: id !== 1 }), M, bz2, s0, s1, (f) => (id === 1 ? 0.5 + 0.8 * f : 1.2 - 0.5 * f), (f) => (f < 0.1 ? f * 8 : f > 0.94 ? 0.2 : id === 1 ? 0.55 : 0.95), r, 90, 50);
    }
    fx(k.light('g-sea', M, 34 * size), [[t0 - 30, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 60, { transform: 'scale(1.3)', opacity: 0.95 }, 'ease-out'], [t0 + 260, { transform: 'scale(1.8)', opacity: 0 }]]);
  };
  surge(REL, IM, 1, 1, 0);
  surge(1180, 1630, 0.7, 0.85, -14);

  // ── where each lands (IMPACT, and a beat later the second): flash, rings, drops thrown up, warm motes rising
  const bloom = (IMt, size) => {
    const fl = [[IMt - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMt + 40, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [IMt + 200, { transform: 'scale(1.9)', opacity: 0.6 }]];
    for (let t = IMt + 340, i = 0; t < IMt + 800; t += 120, i++) fl.push([t, { transform: `scale(${i % 2 ? 1.4 : 1.15})`, opacity: i % 2 ? 0.5 : 0.35 }, eio]);
    fl.push([IMt + 1200, { transform: 'scale(.9)', opacity: 0 }]);
    fx(k.light('g-sea', T, 60 * size), fl);
    fx(k.light('g-sea', T, 20 * size), [[IMt - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMt + 30, { transform: 'scale(1.6)', opacity: 1 }], [IMt + 170, { transform: 'scale(2.6)', opacity: 0 }]]);
    fx(k.pic(ring, T, 64 * size, 64 * size), [[IMt, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IMt + 50, { transform: 'scale(.4)', opacity: 0.95 }, 'ease-out'], [IMt + 600, { transform: 'scale(1.15)', opacity: 0 }]]);
    fx(k.pic(ring, [T[0], T[1] + 5], 64 * size, 64 * size), [[IMt + 80, { transform: 'scale(.12, .06)', opacity: 0 }, 'ease-out'], [IMt + 150, { transform: 'scale(.3, .14)', opacity: 0.8 }, 'ease-out'], [IMt + 750, { transform: 'scale(1.3, .55)', opacity: 0 }]]);
    for (let i = 0; i < Math.round(20 * size); i++) {
      const a = -Math.PI * (0.1 + rand() * 0.8), v = (18 + rand() * 34) * size, t = IMt + rand() * 50, life = 520 + rand() * 340, sz = 3 + rand() * 3.2;
      const px = (f) => Math.cos(a) * v * f, py = (f) => Math.sin(a) * v * f + 44 * f * f;
      fx(k.pic('drop', T, sz, sz), [0, 0.3, 0.65, 1].map((f, j) => [t + life * f, { transform: `${k.T(px(f), py(f))} scale(${(1 - 0.5 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']));
    }
    for (let i = 0; i < Math.round(9 * size); i++) {
      const t = IMt + 120 + i * 90 + rand() * 50, x = T[0] + (rand() - 0.5) * 26 * size, y = T[1] + (rand() - 0.5) * 10, sz = 3 + rand() * 3;
      fx(k.pic('warm', [x, y], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 180, { transform: `${k.T((rand() - 0.5) * 4, -9)} scale(1)`, opacity: 0.95 }, eio], [t + 1300, { transform: `${k.T((rand() - 0.5) * 12, -44 - rand() * 18)} scale(.6)`, opacity: 0 }]]);
    }
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + rand() * 0.5, d = 12 + rand() * 16, t = IMt + rand() * 40, r = Math.round(rand() * 360), sz = 14 + rand() * 8;
      fx(k.pic('vapor', [T[0], T[1] + 3], sz, sz, { lit: false }), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 150, { transform: `${k.T(Math.cos(a) * d * 0.5, Math.sin(a) * d * 0.3)} rotate(${r + 15}deg) scale(1)`, opacity: 0.55 }, 'ease-out'], [t + 900, { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d * 0.5 - 8)} rotate(${r + 40}deg) scale(1.6)`, opacity: 0 }]]);
    }
  };
  bloom(IM, 1);
  bloom(1630, 0.65);

  // ── the swell runs along the near wave's crest from the boat, glints sparkling
  for (let i = 0; i < 9; i++) {
    const t0 = IM + 60 + i * 70 + rand() * 30, dir = i % 2 ? 1 : -1, x = Math.max(8, Math.min(292, BO[0] + dir * (24 + Math.floor(i / 2) * 36))), y = 133 - (x > 150 ? 1 : 3) + rand() * 3, sz = 6 + rand() * 4;
    fx(k.picIn('glint', [x, y], sz * 1.8, sz * 0.8), [[t0, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t0 + 120, { transform: 'scale(1)', opacity: 0.95 }, eio], [t0 + 420, { transform: 'scale(.3)', opacity: 0 }]]);
  }
}
