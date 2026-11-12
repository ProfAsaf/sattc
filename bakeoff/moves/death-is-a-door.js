// Death Is a Door: the lone stone door creaks, slams open, and the cold light behind it gathers and
// lashes out in a lance at its victim; where it lands the world folds inward (a ring contracting,
// a dark knot) and the victim's light is drawn back through the door. Then the door eases shut.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker (the spell destroys a creature or a
// Relic: the door is the attack), element spirit (the suggested "earth" is only the stone; what
// the picture and the move show is cold violet light and a pull).
//   0-500     ANTICIPATION: the door creaks nearly shut (the slab widens over the gap), the light
//             dims under a gloom, the frame shudders, the little wanderer steps back.
//   550-900   the door SLAMS open (the slab swings back to a sliver, rebounds), the frame jolts,
//             dust shakes off the lintel, the light surges: a flash and rays fanning out.
//   900-1400  the light gathers in the gap (a blazing knot, motes inhaled) as the frame hums.
//   1400      RELEASE: a lance of cold light leaves the gap, travelling to T (k.aim, else the little
//             wanderer, standing in the spill of light).
//   1800      IMPACT at T: flash, a ring contracting inward (taking, not exploding), a dark knot,
//             and, alone, the wanderer's light drawn out of him: he pales (and is back by 3000).
//   1800-2900 motes of the taken stream back along the lance to the door; the lance fades.
//   2400-3600 the door eases shut with a creak, the light and gloom settle. At rest by 3600 (END 4200).
// BEATS: release 1400, impact 1800, settle 3600.
import { mul, rot, scl, tr, curve, kit } from './_fx.js';

export const END = 4200;
export const BEATS = { release: 1400, impact: 1800, settle: 3600 };
export const STILLS = [300, 700, 850, 1250, 1600, 1900, 2500, 3800];

export const textures = {
  mote: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226, 208, 255, Math.min(1, c * c * 3)]; }],
  orb: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [214 + 41 * c, 180 + 70 * c * c, 255, Math.min(1, c * c * 2.4)]; }],
  dust: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [96, 80, 128, c * c * 0.75]; }],
  knot: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [14, 8, 26, Math.min(1, c * 1.6) * 0.95]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out', S = k.spec, X = kit(k);
  const slab = k.part('slab'), frame = k.part('frame'), walker = k.part('walker');
  const E = S.emit, HG = S.hinge, FT = S.wanderer;
  const alone = !k.aim;
  const T = k.aim || [199, 182];
  k.css('.g-cold { border-radius: 50%; background: radial-gradient(circle, rgba(250,244,255,.95), rgba(204,164,255,.62) 30%, rgba(150,96,255,.26) 56%, rgba(120,70,255,0) 72%); }');
  k.css('.g-gloom { border-radius: 50%; background: radial-gradient(circle, rgba(6,3,12,.85), rgba(6,3,12,.5) 45%, rgba(6,3,12,0) 72%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#b790f5" stroke-width="5" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#efe4ff" stroke-width="1.4"/>', 100, 100);
  // a lance of light pointing right, its tip at the far end: a long taper with a soft glow round it
  const lance = k.svg('<defs><filter id="b" x="-5%" y="-100%" width="110%" height="300%"><feGaussianBlur stdDeviation="2.2"/></filter><linearGradient id="c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b790f5" stop-opacity=".2"/><stop offset=".5" stop-color="#e2d0ff"/><stop offset="1" stop-color="#fff"/></linearGradient></defs>' +
    '<path d="M0,12L92,5L100,12L92,19Z" fill="#9b6bff" opacity=".7" filter="url(#b)"/><path d="M0,12L94,8.4L100,12L94,15.6Z" fill="url(#c)"/><path d="M6,12L94,11L94,13Z" fill="#fff"/>', 100, 24);
  const ray = k.svg('<defs><linearGradient id="r" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e2d0ff" stop-opacity=".9"/><stop offset="1" stop-color="#9b6bff" stop-opacity="0"/></linearGradient></defs><path d="M0,5L100,0.5L100,9.5Z" fill="url(#r)"/>', 100, 10);

  // a straight thing that grows from `a` toward `b` (f = 0..1 of the way): the element is drawn at
  // the segment's middle at rest; its transform slides and stretches it so its near end stays at `a`
  const stretch = (src, a, b, w, o, make) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
    const el = (o.pic || k.pic)(src, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], L, w, o);
    const tf = (f, g = 1) => `${k.T((b[0] - a[0]) * (f - 1) / 2, (b[1] - a[1]) * (f - 1) / 2)} rotate(${ang.toFixed(1)}deg) scale(${Math.max(0.001, f).toFixed(3)}, ${g})`;
    make(el, tf);
  };

  // ── the slab: creaks nearly shut, SLAMS open and rebounds, eases shut again
  const sx = (v) => ({ transform: `scale(${v}, 1)` });
  act(slab, [[0, sx(1), eio], [140, sx(1.05), eio], [330, sx(1.14), eio], [520, sx(1.14), 'ease-in'], [700, sx(0.08), 'ease-out'], [790, sx(0.34), eio], [880, sx(0.1), eio], [2500, sx(0.1), eio], [3000, sx(1.07), eio], [3300, sx(0.97), eio], [3600, sx(1)]]);

  // ── the frame: shudders in anticipation, jolts at the slam, hums while the light gathers, stills
  const jit = (x, r) => ({ transform: `translate(${(x * u).toFixed(2)}px, 0px) rotate(${r}deg)` });
  const fr = [[0, jit(0, 0), eio]];
  for (let t = 110, i = 0; t < 520; t += 70, i++) fr.push([t, jit((i % 2 ? 0.5 : -0.5) * (0.4 + t / 600), 0), eio]);
  fr.push([650, jit(-0.4, -0.1), 'ease-out'], [715, jit(1.3, 0.18), 'ease-out'], [800, jit(-0.9, -0.12), eio], [900, jit(0.5, 0.06), eio]);
  for (let t = 1000, i = 0; t < 1700; t += 90, i++) fr.push([t, jit((i % 2 ? 0.28 : -0.28), 0), eio]);
  fr.push([1900, jit(0, 0)]);
  act(frame, fr);

  // ── the wanderer: backs off from the door, braced; (alone, the target) pale as the lance takes him
  const wk = (x, r, o = 1) => ({ transform: `translate(${(x * u).toFixed(2)}px, 0px) rotate(${r}deg)`, opacity: o });
  act(walker, [[0, wk(0, 0), eio], [450, wk(2.4, 3), eio], [800, wk(3.6, 5), eio], [1400, wk(3.6, 5), eio], [1500, wk(alone ? 3.2 : 3.8, alone ? 8 : 6), 'ease-out'], [1800, wk(alone ? 2.4 : 3.6, alone ? 12 : 5), 'ease-in'],
    ...(alone ? [[1900, wk(0.6, 14, 0.5), eio], [2300, wk(-1.4, 10, 0.3), eio], [2800, wk(-0.6, 4, 0.55), eio]] : [[2500, wk(3.2, 4), eio]]), [3500, wk(0, 0)]]);

  // ── the light: dims under a gloom in anticipation, surges at the slam, burns, calms
  fx(k.lightIn('g-gloom', [150, 112], 120, 170), [[60, { transform: 'scale(.7)', opacity: 0 }, 'ease-out'], [420, { transform: 'scale(1)', opacity: 0.75 }], [640, { transform: 'scale(1)', opacity: 0.75 }, 'ease-in'], [720, { transform: 'scale(1.1)', opacity: 0 }]]);
  fx(k.lightIn('g-cold', E, 190, 190), [[640, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [740, { transform: 'scale(1.1)', opacity: 0.7 }, 'ease-out'], [1000, { transform: 'scale(.95)', opacity: 0.42 }, eio], [1400, { transform: 'scale(1.15)', opacity: 0.6 }, eio], [2100, { transform: 'scale(1)', opacity: 0.4 }, eio], [3000, { transform: 'scale(.9)', opacity: 0.3 }, eio], [3700, { transform: 'scale(.7)', opacity: 0 }]]);
  fx(k.lightIn('g-cold', [152, 112], 70, 160), [[640, { transform: 'scale(.4, .6)', opacity: 0 }, 'ease-out'], [760, { transform: 'scale(1)', opacity: 1 }, eio], [1400, { transform: 'scale(1.05)', opacity: 0.8 }, eio], [2200, { transform: 'scale(1)', opacity: 0.55 }, eio], [3200, { transform: 'scale(.8)', opacity: 0 }]]);
  // rays fanning out of the gap at the slam, then breathing
  for (let i = 0; i < 7; i++) {
    const a = -60 + i * 20 + (rand() - 0.5) * 8, len = 90 + rand() * 80, b = [E[0] + Math.cos((a * Math.PI) / 180) * len, E[1] + Math.sin((a * Math.PI) / 180) * len], t = 700 + i * 22;
    stretch(ray, E, b, 5 + rand() * 3, { pic: k.picIn }, (el, tf) => {
      const l = [[t, { transform: tf(0.1), opacity: 0 }, 'ease-out'], [t + 160, { transform: tf(1), opacity: 0.85 }, eio]];
      for (let q = t + 420, j = 0; q < 2400; q += 360, j++) l.push([q, { transform: tf(j % 2 ? 1.04 : 0.92), opacity: j % 2 ? 0.7 : 0.5 }, eio]);
      l.push([2900, { transform: tf(0.7), opacity: 0 }]);
      fx(el, l);
    });
  }
  // dust shaken from the lintel and posts at the slam
  for (let i = 0; i < 8; i++) {
    const x = 118 + i * 10 + (rand() - 0.5) * 5, t = 690 + i * 25, r = Math.round(rand() * 360);
    fx(k.picIn('dust', [x, 56], 20, 20, { lit: false }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 250, { transform: `${k.T((rand() - 0.5) * 6, 8)} rotate(${r + 25}deg) scale(1)`, opacity: 0.55 }], [t + 1100, { transform: `${k.T((rand() - 0.5) * 12, 26)} rotate(${r + 60}deg) scale(1.7)`, opacity: 0 }]]);
  }

  // ── 900-1400: the light gathers in the gap: a blazing knot, motes inhaled from the spill
  fx(k.pic('orb', E, 30, 30), [[880, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [1150, { transform: 'scale(.9)', opacity: 0.85 }, eio], [1300, { transform: 'scale(1.1)', opacity: 0.95 }, eio], [1400, { transform: 'scale(1.7)', opacity: 1 }, 'ease-out'], [1560, { transform: 'scale(2.4)', opacity: 0 }]]);
  for (let i = 0; i < 12; i++) {
    const a = rand() * Math.PI * 2, r = 22 + rand() * 20, t0 = 900 + i * 40, sz = 2.4 + rand() * 2.2, p = [E[0] + Math.cos(a) * r, E[1] + Math.sin(a) * r * 0.85];
    fx(k.pic('mote', p, sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 110, { transform: 'scale(1)', opacity: 0.9 }, 'ease-in'], [t0 + 470, { transform: `${k.T(E[0] - p[0], E[1] - p[1])} scale(.4)`, opacity: 0 }]]);
  }

  // ── release (1400): the lance of light from the gap to T, arriving at 1800
  const [t0, t1] = [1400, 1800];
  stretch(lance, E, T, 18, {}, (el, tf) => fx(el, [[t0, { transform: tf(0.02), opacity: 0 }, 'ease-in'], [t0 + 40, { transform: tf(0.08), opacity: 1 }, 'ease-in'], [t1, { transform: tf(1), opacity: 1 }, 'ease-out'], [t1 + 120, { transform: tf(1), opacity: 0.9 }, eio], [t1 + 700, { transform: tf(0.5, 0.6), opacity: 0.4 }, eio], [t1 + 1100, { transform: tf(0.12, 0.3), opacity: 0 }]]));
  stretch(lance, E, T, 7, {}, (el, tf) => fx(el, [[t0 + 30, { transform: tf(0.02), opacity: 0 }, 'ease-in'], [t0 + 80, { transform: tf(0.1), opacity: 1 }, 'ease-in'], [t1 - 20, { transform: tf(1), opacity: 1 }, 'ease-out'], [t1 + 500, { transform: tf(0.9, 0.8), opacity: 0.8 }, eio], [t1 + 900, { transform: tf(0.1, 0.3), opacity: 0 }]]));
  // a few sparks riding the lance
  for (let i = 0; i < 8; i++) {
    const f = 0.1 + i * 0.11, ts = Math.round(t0 + (t1 - t0) * f), sz = 2.4 + rand() * 2, p = [E[0] + (T[0] - E[0]) * f, E[1] + (T[1] - E[1]) * f];
    fx(k.pic('mote', p, sz, sz), [[ts, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [ts + 50, { transform: 'scale(1)', opacity: 0.95 }], [ts + 420, { transform: `${k.T((rand() - 0.5) * 10, (rand() - 0.5) * 10 + 5)} scale(.3)`, opacity: 0 }]]);
  }

  // ── impact (1800): a flash, rings folding inward, a dark knot; then what's taken streams back to the door
  const IM = 1800;
  fx(k.light('g-cold', T, 70), [[IM - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [IM + 500, { transform: 'scale(.9)', opacity: 0.5 }, eio], [IM + 1100, { transform: 'scale(.6)', opacity: 0 }]]);
  for (const [d, w, o] of [[0, 90, 0.95], [150, 64, 0.75], [300, 40, 0.6]]) {
    fx(k.pic(ring, T, w, w), [[IM + d - 1, { transform: 'scale(1.5)', opacity: 0 }, 'ease-in'], [IM + d + 40, { transform: 'scale(1.25)', opacity: o }, 'ease-in'], [IM + d + 460, { transform: 'scale(.08)', opacity: 0 }]]);
  }
  fx(k.pic('knot', T, 20, 20, { lit: false }), [[IM + 150, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [IM + 380, { transform: 'scale(1)', opacity: 0.95 }, eio], [IM + 800, { transform: 'scale(.9)', opacity: 0.8 }, 'ease-in'], [IM + 1100, { transform: 'scale(.15)', opacity: 0 }]]);
  for (let i = 0; i < 14; i++) {
    const a = rand() * Math.PI * 2, r = 14 + rand() * 18, ts = IM + 60 + i * 55, sz = 2.2 + rand() * 2.4, p = [T[0] + Math.cos(a) * r, T[1] + Math.sin(a) * r * 0.8];
    // pulled from around T into its centre, then streamed back along the lance to the door
    const mid = [(T[0] + E[0]) / 2 + (rand() - 0.5) * 14, (T[1] + E[1]) / 2 - 12 - rand() * 12];
    const pts = k.arc([0, 0], [mid[0] - p[0], mid[1] - p[1]], [E[0] - p[0], E[1] - p[1]], 4);
    fx(k.pic('mote', p, sz, sz), [[ts, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [ts + 90, { transform: 'scale(1)', opacity: 0.95 }, eio], ...pts.map(([x, y], j) => [Math.round(ts + 300 + 150 * j), { transform: `${k.T(x, y)} scale(${(1 - 0.5 * j / 4).toFixed(2)})`, opacity: j === 4 ? 0 : 0.9 }, 'linear'])]);
  }
  // the door takes it: a pulse in the gap as the motes arrive
  fx(k.pic('orb', E, 28, 28), [[IM + 700, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 950, { transform: 'scale(1)', opacity: 0.8 }, eio], [IM + 1250, { transform: 'scale(1.2)', opacity: 0.9 }, eio], [IM + 1600, { transform: 'scale(.5)', opacity: 0 }]]);
}
