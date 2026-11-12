// Perfect Recall: the old archivist, on the last dry stair of her flooded library, calls three scrolls
// back out of the water. They rise one after another, rocking, trailing drops and light, and settle
// into her hands; she lifts them to the window light, then lets them go: they spin away on an arc
// (alone, into her own chest, where they burst into light) and are hers again. The empty water
// ripples, and the three scrolls form again where they were drawn.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support (a boon: spells come back to hand;
// the suggestion fits), element water (the flood is the engine of the card).
//   0-350     ANTICIPATION: her arms dip and draw back; rings spread on the water where the first
//             scroll lies, the water begins to glow.
//   350-1250  the scrolls rise out of the flood, A then B then C (each loops up on its own sway, spinning
//             slowly, trailing motes) and gather in her hands.
//   1250-1700 she lifts her arms (the scrolls ride them), light builds in her hands.
//   1720      RELEASE: the arms thrust toward T and the three scrolls fly off (copies on the overlay, each a
//             beat behind the last); alone, T is her chest, and she is turned toward it.
//   2100      IMPACT: the first scroll lands at T: a flash, rings, motes lifting (the others follow).
//   2100-3000 the arms return to rest; light dies down; the water ripples where the scrolls were.
//   2900-3500 the three scrolls re-form where they were drawn (rising, fading in with a shimmer).
// BEATS: release 1720, impact 2100, settle 3500.
import { mul, rot, scl, tr, app, curve, kit } from './_fx.js';
export const END = 4200;
export const BEATS = { release: 1720, impact: 2100, settle: 3500 };
export const STILLS = [250, 800, 1250, 1650, 1900, 2150, 2700, 3500];

export const textures = {
  orb: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 250 - 20 * (1 - c), 220 - 40 * (1 - c), Math.min(1, c * c * 2.4)]; }],
  mote: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 250, 225, Math.min(1, c * c * 3)]; }],
  cool: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [196, 244, 246, Math.min(1, c * c * 3)]; }],
};

export function build(k) {
  const { fx, u, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const S = k.spec, SH = S.shoulder, H0 = S.emit, WL = S.water, REST = S.scrolls;
  const arms = k.part('arms'), sc = [k.part('scrollA'), k.part('scrollB'), k.part('scrollC')];
  const aimed = !!k.aim, T = k.aim || S.hit;
  const REL = 1720, IM = 2100, RE0 = 2900, END_ = 4200;
  k.css('.g-page { border-radius: 50%; background: radial-gradient(circle, rgba(255,250,230,.95), rgba(255,226,160,.5) 32%, rgba(255,210,130,.18) 58%, rgba(255,200,110,0) 72%); }');
  k.css('.g-pool { border-radius: 50%; background: radial-gradient(ellipse, rgba(214,252,252,.9), rgba(160,230,236,.4) 40%, rgba(120,210,225,0) 70%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.3"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#d6fbfa" stroke-width="4.5" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#f3ffff" stroke-width="1.3"/>', 100, 100);
  const scrollImg = k.svg('<g transform="translate(12 5)"><rect x="-8" y="-3.2" width="16" height="6.4" rx="1" fill="#fbf6dc"/><rect x="-10.6" y="-4.1" width="3.4" height="8.2" rx="1.5" fill="#d3c493"/><rect x="7.2" y="-4.1" width="3.4" height="8.2" rx="1.5" fill="#d3c493"/><path d="M-5.5,-1h11M-5.5,1.2h8" stroke="#a9b6a8" stroke-width=".5"/></g>', 24, 10);

  // ── her arms: dip, lift, then thrust toward T (turned round through a sliver if T is behind her)
  const rel0 = [H0[0] - SH[0], H0[1] - SH[1]], l0 = Math.hypot(rel0[0], rel0[1]);
  const right = T[0] >= SH[0] - 4;
  let aT = (Math.atan2(T[1] - SH[1], T[0] - SH[0]) * 180) / Math.PI - (Math.atan2(rel0[1], rel0[0]) * 180) / Math.PI;
  if (!right) aT = (Math.atan2(T[1] - SH[1], -(T[0] - SH[0])) * 180) / Math.PI - (Math.atan2(rel0[1], rel0[0]) * 180) / Math.PI;
  aT = Math.max(-45, Math.min(55, ((aT + 540) % 360) - 180));
  const ang = curve([[0, 0], [330, 5], [1300, -9], [1660, -15], [REL, -15], [REL + 200, right ? aT : -aT, 'out'], [2350, right ? aT : -aT], [3300, 0]]);
  const sx = right ? () => 1 : curve([[0, 1], [REL, 1], [REL + 90, 0.06], [REL + 200, -1], [2350, -1], [2700, 0.06], [3000, 1]]);
  const armW = (t) => mul(scl(sx(t), 1, SH[0], SH[1]), rot(ang(t), SH[0], SH[1]));
  h.drive(arms, SH, armW, 3300, 40);
  const hand = (t) => app(armW(Math.min(t, 3300)), H0);

  // ── the scrolls: each rises from the water on its own sway to her hands, rides her lifted arms,
  //    and goes at the release; each forms again where it was drawn
  const START = [350, 520, 700], ARR = [1250, 1230, 1190], OFF = [[7, 1], [3, 8], [6, -7]], REST_ROT = [28, -14, 8], HELD_ROT = [-6, 10, -16];
  const posOf = (i, t) => {
    const R = REST[i], hp = hand(Math.min(t, REL)), tgt = [hp[0] + OFF[i][0], hp[1] + OFF[i][1]];
    if (t <= START[i]) return [R[0], R[1] + 0.8 * Math.sin(t / 260 + i * 2) * (t / START[i])];
    if (t < ARR[i]) {
      const w = k.smooth((t - START[i]) / (ARR[i] - START[i])), sw = Math.sin(w * Math.PI), side = i % 2 ? -1 : 1;
      return [R[0] + (tgt[0] - R[0]) * w + 7 * sw * side, R[1] + (tgt[1] - R[1]) * w - 9 * sw];
    }
    return tgt;
  };
  const rotOf = (i, t) => {
    if (t <= START[i]) return 0;
    const held = HELD_ROT[i] - REST_ROT[i], w = k.smooth(Math.min(1, (t - START[i]) / (ARR[i] - START[i])));
    return held * w + 10 * Math.sin(t / 150 + i) * Math.sin(w * Math.PI) + (t > ARR[i] && t < REL ? 3 * Math.sin(t / 190 + i) : 0);
  };
  const opOf = curve([[0, 1], [REL - 10, 1], [REL + 40, 0], [RE0 - 1, 0], [RE0 + 450, 1, 'out']]);
  sc.forEach((part, i) => {
    const R = REST[i];
    h.drive(part, R, (t) => {
      if (t >= RE0) { const w = k.smooth(Math.min(1, (t - RE0) / 500)), q = 0.8 + 0.2 * w; return mul(tr(0, 7 * (1 - w)), scl(q, q, R[0], R[1])); }
      const p = posOf(i, Math.min(t, REL)), r = rotOf(i, Math.min(t, REL));
      return mul(tr(p[0] - R[0], p[1] - R[1]), rot(r, R[0], R[1]));
    }, END_, 40, opOf);
  });

  // ── light riding each scroll, and drops and motes shed as it rises
  sc.forEach((_, i) => {
    const R = REST[i], T0 = START[i];
    h.ride(k.lightIn('g-page', R, 22, 22), R, (t) => { const p = posOf(i, Math.min(t, REL)); return tr(p[0] - R[0], p[1] - R[1]); },
      [[T0 - 150, 0.6, 0], [T0 + 150, 1.3, 0.7], [ARR[i], 1.4, 0.7], [REL - 150, 1.5, 0.65], [REL + 20, 1.8, 0.7], [REL + 90, 1, 0]]);
    for (let j = 0; j < 7; j++) {
      const ts = T0 + 40 + j * ((ARR[i] - T0 - 100) / 7), p = posOf(i, ts), sz = 2 + rand() * 2.4;
      fx(k.picIn(j % 2 ? 'cool' : 'mote', [p[0] + (rand() - 0.5) * 8, p[1] + 3], sz, sz), [[ts, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [ts + 90, { transform: `${k.T(0, 1)} scale(1)`, opacity: 0.9 }, 'ease-out'], [ts + 520 + rand() * 300, { transform: `${k.T((rand() - 0.5) * 8, 10 + rand() * 8)} scale(.5)`, opacity: 0 }, 'ease-in']]);
    }
  });

  // ── the flood: rings spread and a pool of light wakes where the first scroll lay, then again as they re-form
  const flatRing = (x, y, w, t0, o = 0.7) => fx(k.picIn(ring, [x, y], w, w * 0.3), [[t0, { transform: 'scale(.25)', opacity: 0 }, 'ease-out'], [t0 + 80, { transform: 'scale(.45)', opacity: o }, 'ease-out'], [t0 + 900, { transform: 'scale(1.4)', opacity: 0 }]]);
  flatRing(WL[0], WL[1], 54, 250, 0.5); flatRing(WL[0] - 5, WL[1] + 2, 70, 480, 0.55); flatRing(WL[0] + 2, WL[1], 56, 760, 0.7); flatRing(WL[0] + 4, WL[1] + 3, 80, 960, 0.5);
  fx(k.lightIn('g-pool', [WL[0], WL[1] - 2], 90, 30), [[150, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [800, { transform: 'scale(1)', opacity: 0.6 }, eio], [1400, { transform: 'scale(1.05)', opacity: 0.35 }, eio], [2300, { transform: 'scale(.9)', opacity: 0 }, 'ease-out']]);
  flatRing(WL[0], WL[1], 50, RE0 + 80, 0.6); flatRing(WL[0] - 3, WL[1] + 2, 72, RE0 + 300, 0.45);
  fx(k.lightIn('g-pool', [WL[0], WL[1] - 2], 80, 28), [[RE0, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [RE0 + 400, { transform: 'scale(1)', opacity: 0.5 }, eio], [RE0 + 950, { transform: 'scale(.9)', opacity: 0 }]]);
  // the scrolls shimmering into place
  sc.forEach((_, i) => {
    const R = REST[i], t0 = RE0 + i * 90;
    fx(k.lightIn('g-page', R, 30, 30), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 330, { transform: 'scale(1.2)', opacity: 0.85 }, eio], [t0 + 850, { transform: 'scale(1)', opacity: 0 }]]);
    for (let j = 0; j < 4; j++) {
      const a = (j / 4) * Math.PI * 2 + rand(), d = 12 + rand() * 6, t1 = t0 - 60 + j * 60;
      fx(k.picIn('mote', R, 3.5, 3.5), [[t1, { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d * 0.7)} scale(.4)`, opacity: 0 }, 'ease-out'], [t1 + 160, { transform: `${k.T(Math.cos(a) * d * 0.8, Math.sin(a) * d * 0.56)} scale(1)`, opacity: 0.9 }, 'ease-in'], [t1 + 480, { transform: 'scale(.4)', opacity: 0 }]]);
    }
  });

  // ── light gathering in her hands as she lifts them, then flaring at the release
  const pre = [[1150, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1500, { transform: 'scale(1)', opacity: 0.6 }, eio]];
  for (let t = 1650, j = 0; t < REL - 30; t += 120, j++) pre.push([t, { transform: `scale(${j % 2 ? 1.1 : 0.95})`, opacity: j % 2 ? 0.5 : 0.4 }, eio]);
  pre.push([REL + 60, { transform: 'scale(1.3)', opacity: 0.9 }, 'ease-out'], [REL + 400, { transform: 'scale(.8)', opacity: 0 }]);
  const hp0 = hand(REL);
  fx(k.lightIn('g-page', H0, 40, 34), pre.map(([t, f, e]) => [t, { ...f, transform: `${k.T(hp0[0] - H0[0] + 6, hp0[1] - H0[1])} ${f.transform}` }, e]));
  // the window's light seems to answer: a soft wash over her as she lifts
  fx(k.lightIn('g-pool', [90, 100], 70, 80), [[1200, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [1650, { transform: 'scale(1)', opacity: 0.4 }, eio], [2400, { transform: 'scale(1)', opacity: 0.3 }, eio], [3100, { transform: 'scale(.8)', opacity: 0 }]]);

  // ── release: three scrolls fly (copies on the overlay), each a beat behind, on an arc to T
  const M = [hp0[0] + 0, hp0[1]];
  for (let i = 0; i < 3; i++) {
    const m = [hp0[0] + OFF[i][0], hp0[1] + OFF[i][1]], t0 = REL + i * 70, t1 = IM + i * 70, lift = 18 + i * 6 + (aimed ? 0 : 6);
    const bz = h.arcPath(m, [T[0] + (i - 1) * 4, T[1] + (i - 1) * 3], lift);
    const el = k.pic(scrollImg, m, 24, 10);
    h.fly(el, m, bz, t0, t1, (f) => (f < 0.8 ? 1 : 1 - (f - 0.8) * 2), (f) => (f < 0.04 ? f * 25 : f > 0.94 ? Math.max(0, (1 - f) / 0.06) : 1), HELD_ROT[i], 420 + i * 60, 40, (f) => f * f * 0.5 + f * 0.5);
    // sparkling trail
    const [X0, Y0] = k.P(...m);
    for (let j = 1; j < 9; j++) {
      const f = j / 9, e = f * f * 0.5 + f * 0.5, ts = Math.round(t0 + (t1 - t0) * f), [x, y] = k.P(...bz(e)), tx = `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px)`;
      fx(k.pic(j % 2 ? 'mote' : 'orb', m, j % 2 ? 5 : 8, j % 2 ? 5 : 8), [[ts, { transform: `${tx} scale(.5)`, opacity: 0 }, 'ease-out'], [ts + 40, { transform: `${tx} scale(1)`, opacity: 0.9 }], [ts + 340, { transform: `${tx} scale(.3)`, opacity: 0 }]]);
    }
    // a flash and ring and lifting motes where it lands
    const L = [T[0] + (i - 1) * 4, T[1] + (i - 1) * 3], tl = t1;
    fx(k.light('g-page', L, 34 + (i === 0 ? 14 : 0)), [[tl - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [tl + 60, { transform: 'scale(1.1)', opacity: i === 0 ? 1 : 0.8 }, 'ease-out'], [tl + 500, { transform: 'scale(1.2)', opacity: 0.45 }, eio], [tl + 1100, { transform: 'scale(.8)', opacity: 0 }]]);
    fx(k.pic(ring, L, 44 - i * 6, 44 - i * 6), [[tl - 1, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [tl + 40, { transform: 'scale(.3)', opacity: 0.85 }, 'ease-out'], [tl + 650, { transform: 'scale(1.1)', opacity: 0 }]]);
    for (let j = 0; j < 5; j++) {
      const a = (j / 5) * Math.PI * 2 + rand() * 0.5, d = 7 + rand() * 12, t2 = tl + rand() * 70, life = 700 + rand() * 400, sz = 2.5 + rand() * 2.5, ex = Math.cos(a) * d, ey = Math.sin(a) * d * 0.8;
      fx(k.pic(j % 3 ? 'mote' : 'orb', L, sz, sz), [[t2, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t2 + 120, { transform: `${k.T(ex, ey)} scale(1)`, opacity: 0.9 }, 'ease-out'], [t2 + life, { transform: `${k.T(ex * 1.2, ey - 24 - rand() * 14)} scale(.6)`, opacity: 0 }, eio]]);
    }
  }
  fx(k.light('g-page', T, 22), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.6)', opacity: 1 }], [IM + 240, { transform: 'scale(2.6)', opacity: 0 }]]);
  if (!aimed) {
    // alone the scrolls are taken into her: her whole figure glows with them for a while
    fx(k.lightIn('g-heal spirit', [84, 112], 64, 90), [[IM, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [IM + 200, { transform: 'scale(1)', opacity: 0.7 }, 'ease-out'], [2600, { transform: 'scale(1.05)', opacity: 0.45 }, eio], [3300, { transform: 'scale(1.1)', opacity: 0 }]]);
  }
}
