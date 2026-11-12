// Ripple (a Spell: draw a card, the next Spell costs 1 less; role support, element water: as suggested). A bright drop
// swells on the last leaf, lets go and falls into the pool; where it lands the water answers: new rings of light run out
// across the pool to the reeds, the reeds and lily pads rocking as they pass, and the gift (a stream of bright drops) arcs
// from the splash to its target, where it lands in rings of its own.
//
// PLAN (drawing units 300 x 210, ms of the move). T = k.aim, else the reeds at the pool's right edge.
//   0-150    the drawn drop and its thread of light fade (the new drop is about to form), the drawn rings dim a little.
//   150-800  GATHER: a bead of light swells at the leaf's tip (the branch dips under its weight, glints gather).
//   800-1100 BEATS.release 900: the bead lets go and falls (accelerating, a thread of light after it); the branch springs
//            up and shivers; the bead strikes the water at 1100.
//   1100     the splash: a flash and a crown of drops thrown up, and four rings born at the middle run out, one every
//            110 ms, the first reaching the reeds at about 1750; the drops of the gift leave for T along an arc.
//   1700     BEATS.impact: the gift lands at T (rings, light and glints; alone, the ring meets the reeds there); the reeds
//            lean away and spring back, the lily pads bob as each ring passes them.
//   1800-3400 the water settles: the drawn rings return, the branch and reeds still, glints twinkle and fade.
//   3700     BEATS.settle: all as drawn, the drop hanging above the pool again (END 4200).
import { kit } from './_fx.js';
export const END = 4200;
export const BEATS = { release: 900, impact: 1700, settle: 3700 };
export const STILLS = [100, 600, 1000, 1150, 1400, 1750, 2500, 3900];
export const textures = {
  glint: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [240 + 15 * c, 255, 255, Math.min(1, c * c * 2.6)]; }],
  star: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); const ax = Math.abs(x - 0.5) * 2, ay = Math.abs(y - 0.5) * 2, ray = Math.max(0, 1 - Math.min(ax, ay) * 9) * Math.max(0, 1 - Math.max(ax, ay)); return [236 + 19 * c, 255, 252, Math.min(1, c * c * c * 1.6 + ray * 0.85)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const S = k.spec, P = S.pool, E = S.emit, T = k.aim || S.rim;
  const rings = k.part('rings'), drop = k.part('drop'), pads = k.part('pads'), reedsL = k.part('reedsL'), reedsR = k.part('reedsR'), branch = k.part('branch');
  k.css('.g-sea { border-radius: 50%; background: radial-gradient(circle, rgba(244,255,252,.95), rgba(168,236,236,.55) 30%, rgba(100,200,214,.18) 58%, rgba(80,180,200,0) 72%); }');
  // a flat ring of light (the pool seen at a slant), a bead of water and the thread of light behind it
  const flat = k.svg('<defs><filter id="b" x="-5%" y="-40%" width="110%" height="180%"><feGaussianBlur stdDeviation="1.4"/></filter><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4fffc"/><stop offset=".6" stop-color="#d6f8f7"/><stop offset="1" stop-color="#9fdbe2"/></linearGradient></defs><ellipse cx="125" cy="28" rx="120" ry="25.2" fill="none" stroke="#bfeeee" stroke-width="5" filter="url(#b)" opacity=".7"/><ellipse cx="125" cy="28" rx="120" ry="25.2" fill="none" stroke="url(#g)" stroke-width="1.8"/>', 250, 56);
  const round = k.svg('<defs><filter id="b" x="-5%" y="-40%" width="110%" height="180%"><feGaussianBlur stdDeviation="2"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#d4f6f6" stroke-width="5" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#f4ffff" stroke-width="1.6"/>', 100, 100);
  const bead = k.svg('<defs><filter id="b" x="-60%" y="-40%" width="220%" height="180%"><feGaussianBlur stdDeviation="1.2"/></filter></defs><path d="M10,1C11,6 17,11 17,17A7,7 0 0 1 3,17C3,11 9,6 10,1Z" fill="#bff0f2" filter="url(#b)"/><path d="M10,3C11,7 15.4,11 15.4,16.6A5.4,5.4 0 0 1 4.6,16.6C4.6,11 9,7 10,3Z" fill="#f6fffe"/><ellipse cx="8" cy="16" rx="1.6" ry="2.4" fill="#fff"/>', 20, 26);
  const thread = k.svg('<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9fffb" stop-opacity="0"/><stop offset="1" stop-color="#f4fffc" stop-opacity=".85"/></linearGradient></defs><path d="M3,0L6,0L5,60L4,60Z" fill="url(#g)"/>', 8, 60);

  // ── the drawn drop and its thread give way to the new one; the drawn rings dim while the new ones run, then return
  act(drop, [[0, { opacity: 1 }, eio], [150, { opacity: 0 }], [3300, { opacity: 0 }, eio], [3750, { opacity: 1 }]]);
  act(rings, [[0, { opacity: 1 }, eio], [200, { opacity: 0.8 }, eio], [1150, { opacity: 0.55 }, eio], [1700, { opacity: 0.35 }, eio], [2600, { opacity: 0.75 }, eio], [3500, { opacity: 1 }]]);

  // ── gather: the bead swells on the leaf's tip, the branch dips under it, light collects
  const BY = E[1] + 6; // where the bead hangs
  const fall = (P[1] - BY) * u;
  fx(k.picIn(bead, [E[0], BY], 18, 23.4), [[150, { transform: `scale(.1)`, opacity: 0 }, 'ease-out'], [350, { transform: 'scale(.55, .5)', opacity: 1 }, eio], [820, { transform: 'scale(1, 1.15)', opacity: 1 }, 'ease-in'], [900, { transform: `${k.T(0, 1)} scale(1, 1.3)`, opacity: 1 }, 'ease-in'],
    [1100, { transform: `translateY(${fall.toFixed(1)}px) scale(.9, 1.5)`, opacity: 1 }], [1112, { transform: `translateY(${fall.toFixed(1)}px) scale(.3, .3)`, opacity: 0 }]]);
  fx(k.picIn(thread, [E[0], BY - 6], 4, 30, { top: true }), [[900, { transform: 'scaleY(.1)', opacity: 0 }, 'ease-out'], [1000, { transform: `${k.T(0, (P[1] - BY) * 0.4)} scaleY(.8)`, opacity: 0.9 }, 'ease-in'], [1100, { transform: `translateY(${fall.toFixed(1)}px) scaleY(1)`, opacity: 0.9 }], [1220, { transform: `translateY(${fall.toFixed(1)}px) scaleY(.2)`, opacity: 0 }]]);
  fx(k.lightIn('g-sea', [E[0], BY], 26, 26), [[200, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [820, { transform: 'scale(1)', opacity: 0.85 }, eio], [900, { transform: 'scale(1.1)', opacity: 0.9 }, 'ease-in'], [1100, { transform: `translateY(${fall.toFixed(1)}px) scale(.8)`, opacity: 0.8 }], [1180, { transform: `translateY(${fall.toFixed(1)}px) scale(.3)`, opacity: 0 }]]);
  for (let i = 0; i < 6; i++) { // glints drawn in to the leaf
    const a = rand() * 6.28, d = 14 + rand() * 12, t = 200 + i * 90;
    fx(k.picIn('glint', E, 4, 4), [[t, { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d * 0.7 + 4)} scale(.6)`, opacity: 0 }, 'ease-in'], [t + 380, { transform: `${k.T(0, 6)} scale(1)`, opacity: 0.95 }, 'ease-in'], [t + 520, { transform: `${k.T(0, 6)} scale(.3)`, opacity: 0 }]]);
  }
  // the branch: dips under the bead, springs up when it lets go, shivers still
  act(branch, [[0, { transform: 'none' }, eio], [800, { transform: 'rotate(1.5deg)' }, 'ease-in'], [930, { transform: 'rotate(-1.9deg)' }, eio], [1150, { transform: 'rotate(.9deg)' }, eio], [1400, { transform: 'rotate(-.7deg)' }, eio], [1700, { transform: 'rotate(.3deg)' }, eio], [2000, { transform: 'none' }]]);

  // ── the splash (1100)
  const SP = 1100;
  fx(k.light('g-sea', P, 74, 26), [[SP - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [SP + 40, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [SP + 300, { transform: 'scale(1.3)', opacity: 0.7 }, eio], [SP + 900, { transform: 'scale(1.5)', opacity: 0 }]]);
  fx(k.light('g-sea', [P[0], P[1] - 8], 22), [[SP - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [SP + 40, { transform: 'scale(1.5)', opacity: 1 }], [SP + 220, { transform: 'scale(2.4)', opacity: 0 }]]);
  for (let i = 0; i < 12; i++) { // the crown: drops thrown up and falling back
    const a = -Math.PI * (0.2 + 0.6 * (i / 11)) + (rand() - 0.5) * 0.2, v = 16 + rand() * 20, t = SP + rand() * 30, life = 480 + rand() * 200, sz = 3 + rand() * 2.5;
    const px = (f) => Math.cos(a) * v * f * 1.1, py = (f) => Math.sin(a) * v * f + 36 * f * f;
    const ks = [0, 0.25, 0.5, 0.75, 1].map((f, j) => [t + life * f, { transform: `${k.T(px(f), py(f))} scale(${(1 - 0.5 * f).toFixed(2)})`, opacity: j === 0 || j === 4 ? 0 : 1 }, j ? 'linear' : 'ease-out']);
    fx(k.pic('glint', [P[0], P[1] - 2], sz, sz), ks);
  }
  // new rings of light, born at the middle, running out across the pool (picked up by the reeds at the edges)
  for (let i = 0; i < 4; i++) {
    const t = SP + 20 + i * 110, dur = 900 + i * 120, w = 250;
    fx(k.picIn(flat, P, w, 56), [[t, { transform: 'scale(.03)', opacity: 0 }, 'ease-out'], [t + 70, { transform: 'scale(.09)', opacity: 1 - i * 0.12 }, 'ease-out'], [t + dur * 0.55, { transform: 'scale(.62)', opacity: 0.8 - i * 0.1 }, 'ease-out'], [t + dur, { transform: 'scale(1.0)', opacity: 0 }]]);
  }
  // lily pads and reeds as the rings pass
  const bob = (a) => [[0, { transform: 'none' }, eio], [1350, { transform: 'none' }, 'ease-out'], [1480, { transform: `${k.T(0, -1.6 * a)} rotate(${(1.5 * a).toFixed(1)}deg)` }, eio], [1750, { transform: `${k.T(0, 1.1 * a)} rotate(${(-1 * a).toFixed(1)}deg)` }, eio], [2100, { transform: `${k.T(0, -0.7 * a)}` }, eio], [2500, { transform: `${k.T(0, 0.4 * a)}` }, eio], [3000, { transform: 'none' }]];
  act(pads, bob(1));
  act(reedsL, [[0, { transform: 'none' }, eio], [1500, { transform: 'none' }, 'ease-out'], [1650, { transform: 'rotate(-2.4deg)' }, eio], [1900, { transform: 'rotate(1.4deg)' }, eio], [2200, { transform: 'rotate(-1deg)' }, eio], [2550, { transform: 'rotate(.5deg)' }, eio], [3000, { transform: 'none' }]]);
  act(reedsR, [[0, { transform: 'none' }, eio], [1560, { transform: 'none' }, 'ease-out'], [1720, { transform: 'rotate(2.6deg)' }, eio], [1970, { transform: 'rotate(-1.5deg)' }, eio], [2270, { transform: 'rotate(1.1deg)' }, eio], [2620, { transform: 'rotate(-.5deg)' }, eio], [3100, { transform: 'none' }]]);

  // ── the gift: bright drops arc from the splash to T (billowing a little as they go), landing at BEATS.impact
  const bz = h.arcPath([P[0], P[1] - 4], T, Math.max(20, Math.hypot(T[0] - P[0], T[1] - P[1]) * 0.28));
  for (let i = 0; i < 12; i++) {
    const t0 = SP + 60 + i * 36, t1 = t0 + 520, sz = 6 + rand() * 4, side = (rand() - 0.5) * 8;
    const bz2 = (f) => { const p = bz(f); return [p[0], p[1] + side * Math.sin(Math.PI * f)]; };
    h.fly(k.pic(i % 4 === 3 ? 'star' : 'glint', [P[0], P[1] - 4], sz, sz), [P[0], P[1] - 4], bz2, t0, t1, (f) => 0.6 + 0.8 * Math.sin(Math.PI * Math.min(1, f * 1.05)), (f) => (f < 0.1 ? f * 9 : f > 0.94 ? 0.3 : 1), 0, 90, 40, (f) => f * 0.6 + f * f * 0.4);
  }
  // where it lands (BEATS.impact 1700): rings in the surface, a light, glints rising
  const IM = 1700;
  fx(k.light('g-sea', T, 46, 22), [[IM - 80, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 80, { transform: 'scale(1.2)', opacity: 1 }, 'ease-out'], [IM + 500, { transform: 'scale(1.1)', opacity: 0.6 }, eio], [IM + 1200, { transform: 'scale(1.4)', opacity: 0 }]]);
  for (let i = 0; i < 3; i++) {
    const t = IM + i * 160;
    fx(k.pic(flat, T, 70, 15.7), [[t, { transform: 'scale(.05)', opacity: 0 }, 'ease-out'], [t + 70, { transform: 'scale(.15)', opacity: 1 }, 'ease-out'], [t + 800, { transform: 'scale(1)', opacity: 0 }]]);
  }
  fx(k.pic('star', T, 22, 22), [[IM - 20, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [IM + 90, { transform: 'scale(1.3) rotate(30deg)', opacity: 1 }, 'ease-out'], [IM + 500, { transform: 'scale(.5) rotate(80deg)', opacity: 0 }]]);
  for (let i = 0; i < 10; i++) {
    const tt = IM + 60 + i * 80, x = T[0] + (rand() - 0.5) * 30, y = T[1] + (rand() - 0.5) * 6;
    fx(k.pic('glint', [x, y], 4 + rand() * 2.5, 4 + rand() * 2.5), [[tt, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [tt + 160, { transform: `${k.T((rand() - 0.5) * 4, -5)} scale(1)`, opacity: 0.95 }], [Math.min(k.END, tt + 1100), { transform: `${k.T((rand() - 0.5) * 10, -22 - rand() * 12)} scale(.4)`, opacity: 0 }]]);
  }
  void round;
  // glints twinkling on the pool as it settles
  for (let i = 0; i < 8; i++) {
    const tt = 1900 + i * 190, x = 60 + rand() * 180, y = 128 + rand() * 48;
    fx(k.picIn('glint', [x, y], 4, 4), [[tt, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [tt + 200, { transform: 'scale(1)', opacity: 0.9 }], [tt + 650, { transform: 'scale(.3)', opacity: 0 }]]);
  }
}
