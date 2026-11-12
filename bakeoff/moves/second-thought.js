// Second Thought: the scholar leans over the pool; her reflection shimmers and offers two pages, which
// float up out of the water to her reaching hand. She draws them to her face and reads; she keeps
// one (it flares into her / flies to T) and lets the other go: it falls back into the pool and
// dissolves in rings. Then the two pages re-form in the water as drawn.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support (draw two, discard one: card
// flow, a gift to its caster), element water (the pool is the engine; the suggestion fits).
//   0-500     ANTICIPATION: she draws her arm back and leans in, head dipping toward the water;
//             rings on the pool.
//   500-1000  the reflection stirs (it shimmers about the waterline), the pages glow in it.
//   1000-1260 the pages float up out of the water, A then B, rocking, to her hand, which reaches
//             down to take them (her arm stretches); drops fall off them.
//   1260-1750 she draws them to her face and reads; her head tilts, the pages' light on her.
//   1900      RELEASE: alone, the kept page flares and is taken into her (light spills over her);
//             aimed (k.aim = T), her arm flings toward T and the page flies there on an arc.
//   2050      the other page is let go: it tumbles down into the pool.
//   2400      IMPACT: the kept page lands (a flash and rings at T, motes lifting; alone, her hand and
//             chest glow) and the other splashes into the pool: rings, motes.
//   2400-3500 she lowers her arm and straightens, light dying down.
//   3500-4300 the two pages re-form in the water, the reflection shimmers once more. At rest 4300.
// BEATS: release 1900, impact 2400, settle 4300.
import { mul, rot, scl, tr, app, curve, kit } from './_fx.js';
export const END = 4700;
export const BEATS = { release: 1900, impact: 2400, settle: 4300 };
export const STILLS = [300, 900, 1200, 1550, 2000, 2450, 3100, 4300];

export const textures = {
  orb: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 250 - 20 * (1 - c), 220 - 40 * (1 - c), Math.min(1, c * c * 2.4)]; }],
  mote: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 250, 225, Math.min(1, c * c * 3)]; }],
  cool: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [196, 244, 246, Math.min(1, c * c * 3)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const S = k.spec, SH = S.shoulder, NK = S.neck, H0 = S.hand, PG = S.pages, RD = S.read, RC = S.reach, WL = S.water, KN = S.knee;
  const refl = k.part('reflection'), body = k.part('body'), head = k.part('head'), arm = k.part('arm'), pageA = k.part('pageA'), pageB = k.part('pageB');
  const T = k.aim || RD, aimed = !!k.aim;
  const REL = 1900, IM = 2400, END_ = 4300, RE0 = 3500;
  k.css('.g-page { border-radius: 50%; background: radial-gradient(circle, rgba(255,250,230,.95), rgba(255,226,160,.5) 32%, rgba(255,210,130,.18) 58%, rgba(255,200,110,0) 72%); }');
  k.css('.g-pool { border-radius: 50%; background: radial-gradient(ellipse, rgba(214,252,252,.9), rgba(160,230,236,.4) 40%, rgba(120,210,225,0) 70%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.3"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#d6fbfa" stroke-width="4.5" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#f3ffff" stroke-width="1.3"/>', 100, 100);

  // where she throws to when aimed: the arm's hand heads toward T (a clamped direction from the shoulder)
  const dirT = (() => { let a = Math.atan2(T[1] - SH[1], T[0] - SH[0]); const lo = (-70 * Math.PI) / 180, hi = (60 * Math.PI) / 180; a = Math.max(lo, Math.min(hi, a)); return [SH[0] + Math.cos(a) * 27, SH[1] + Math.sin(a) * 27]; })();

  // ── her: a lean about the knee carried by body, head and arm; the arm placed by where its hand is
  const lean = curve([[0, 0], [500, 2.6], [1000, 3], [1260, 3.4], [1750, 1.2], [2500, 0.5], [3300, 0], [END_, 0]]);
  const Wb = (t) => rot(lean(t), KN[0], KN[1]);
  h.drive(body, KN, Wb, END_, 40);
  const nod = curve([[0, 0], [500, 6], [1000, 9], [1260, 11], [1500, -3, 'out'], [1750, -5], [1900, -3], [2400, 2], [3000, 0], [END_, 0]]);
  h.drive(head, NK, (t) => mul(Wb(t), rot(nod(t), NK[0], NK[1])), END_, 40);
  // the hand's path (a target for the arm)
  const hx = curve([[0, H0[0]], [450, H0[0] - 4], [1000, H0[0] - 4], [1230, RC[0], 'out'], [1280, RC[0]], [1700, RD[0], 'in'], [REL - 60, RD[0]], [REL + 160, dirT[0], 'out'], [REL + 520, dirT[0]], [2800, H0[0]], [END_, H0[0]]]);
  const hy = curve([[0, H0[1]], [450, H0[1] - 5], [1000, H0[1] - 5], [1230, RC[1], 'out'], [1280, RC[1]], [1700, RD[1], 'in'], [REL - 60, RD[1]], [REL + 160, dirT[1], 'out'], [REL + 520, dirT[1]], [2800, H0[1]], [END_, H0[1]]]);
  // for an unaimed move she doesn't fling: her hand stays reading
  const handAt = (t) => (aimed ? [hx(t), hy(t)] : [curve([[0, H0[0]], [450, H0[0] - 4], [1000, H0[0] - 4], [1230, RC[0], 'out'], [1280, RC[0]], [1700, RD[0], 'in'], [2400, RD[0]], [2900, H0[0]], [END_, H0[0]]])(t), curve([[0, H0[1]], [450, H0[1] - 5], [1000, H0[1] - 5], [1230, RC[1], 'out'], [1280, RC[1]], [1700, RD[1], 'in'], [2400, RD[1]], [2900, H0[1]], [END_, H0[1]]])(t)]);
  const v0 = [H0[0] - SH[0], H0[1] - SH[1]], a0 = Math.atan2(v0[1], v0[0]), l0 = Math.hypot(v0[0], v0[1]);
  const armOwn = (t) => {
    const hp = handAt(t), v = [hp[0] - SH[0], hp[1] - SH[1]], a = Math.atan2(v[1], v[0]), l = Math.hypot(v[0], v[1]) / l0, d = ((a - a0) * 180) / Math.PI;
    return mul(rot(d, SH[0], SH[1]), mul(rot((a0 * 180) / Math.PI, SH[0], SH[1]), mul(scl(l, 1, SH[0], SH[1]), rot((-a0 * 180) / Math.PI, SH[0], SH[1]))));
  };
  const armW = (t) => mul(Wb(t), armOwn(t));
  h.drive(arm, SH, armW, END_, 40);
  const handNow = (t) => app(armW(t), H0); // where her hand really is

  // ── the reflection: shimmers about the waterline (a shear and a stretch) as it offers, then calms
  const shAmp = curve([[0, 0], [300, 0.6], [600, 2.6], [1000, 3.4], [1500, 2], [2400, 1.2], [3300, 0.4], [3600, 2.2], [4000, 0.8], [END_, 0]]);
  h.drive(refl, [130, WL], (t) => { const a = shAmp(t) * Math.sin(t / 170), sk = Math.tan((a * Math.PI) / 180), st = 1 + 0.012 * shAmp(t) * Math.sin(t / 230 + 1); return mul([1, 0, sk, 1, -sk * WL, 0], scl(1, st, 130, WL)); }, END_, 40);

  // ── the pages: each floats up out of the water to her hand (A at 1000, B just after), then A goes on, B falls back
  const OFFA = [3, -2.5], OFFB = [-3.5, -5];
  const pRock = (t, ph) => 8 * Math.sin(t / 170 + ph) * curve([[0, 0], [1000, 0], [1100, 1], [1700, 0.6], [2000, 1], [2400, 0.3]])(t);
  const bobAt = (t, ph) => 1.2 * Math.sin(t / 380 + ph) * curve([[0, 1], [1000, 1], [1100, 0]])(t);
  // A: rest, up to her hand (arrives 1260), rides it; alone, flares and is taken in at 2300; aimed, flies to T by IM
  const CT = [(RD[0] + T[0]) / 2, Math.min(RD[1], T[1]) - 26];
  const flightA = (f) => { const q = 1 - f; const s = [handNow(REL + 160)[0] + OFFA[0], handNow(REL + 160)[1] + OFFA[1]]; return [q * q * s[0] + 2 * q * f * CT[0] + f * f * T[0], q * q * s[1] + 2 * q * f * CT[1] + f * f * T[1]]; };
  const posA = (t) => {
    const hnd = handNow(t), hp = [hnd[0] + OFFA[0], hnd[1] + OFFA[1]];
    if (t < 1000) return [PG[0], PG[1] + bobAt(t, 0)];
    if (t < 1280) { const w = k.smooth((t - 1000) / 280); return [PG[0] + (hp[0] - PG[0]) * w, PG[1] + (hp[1] - PG[1]) * w - 10 * Math.sin(w * Math.PI)]; }
    if (aimed && t > REL + 160) { const f = Math.min(1, (t - REL - 160) / (IM - REL - 160)), e = f * f * 0.5 + f * 0.5; return flightA(e); }
    return hp;
  };
  const posB = (t) => {
    const hnd = handNow(t), hp = [hnd[0] + OFFB[0], hnd[1] + OFFB[1]];
    if (t < 1060) return [PG[0], PG[1] + bobAt(t, 2)];
    if (t < 1340) { const w = k.smooth((t - 1060) / 280); return [PG[0] + (hp[0] - PG[0]) * w, PG[1] + (hp[1] - PG[1]) * w - 8 * Math.sin(w * Math.PI)]; }
    if (t < 2050) return hp;
    if (t < 2420) { const f = (t - 2050) / 370, e = f * f, st = [handNow(2050)[0] + OFFB[0], handNow(2050)[1] + OFFB[1]], end = [PG[0] - 6, WL + 6]; return [st[0] + (end[0] - st[0]) * f * 0.8 + 8 * Math.sin(f * Math.PI) * -1, st[1] + (end[1] - st[1]) * e]; }
    return [PG[0] - 6, WL + 6];
  };
  const rotA = (t) => curve([[0, 0], [1000, 0], [1280, 14], [1700, 4], [REL, 8], [IM, 330]])(t) + pRock(t, 0) * 0.5;
  const rotB = (t) => curve([[0, 0], [1060, 0], [1340, -18], [2050, -8], [2420, -200]])(t) + pRock(t, 2) * 0.5;
  const opA = curve([[0, 1], [aimed ? IM + 120 : 2300, 1], [aimed ? IM + 300 : 2380, 0], [RE0, 0], [RE0 + 500, 1]]);
  const opB = curve([[0, 1], [2400, 1], [2520, 0], [RE0, 0], [RE0 + 500, 1]]);
  const pageW = (pos, rotf, scf) => (t) => { const p = pos(t); return mul(tr(p[0] - PG[0], p[1] - PG[1]), mul(rot(rotf(t), PG[0], PG[1]), scl(scf(t), scf(t), PG[0], PG[1]))); };
  const scA = (t) => (t < REL ? 1 : aimed ? 1 + 0.5 * curve([[REL, 0], [IM - 100, 0], [IM, 1]])(t) : 1 + 0.6 * curve([[REL, 0], [REL + 200, 1], [2300, 0.2]])(t));
  const reform = (t) => { const q = 0.85 + 0.15 * k.smooth((t - RE0) / 500); return scl(q, q, PG[0], PG[1]); };
  h.drive(pageA, PG, (t) => (t < RE0 ? pageW(posA, rotA, scA)(t) : reform(t)), END_, 40, opA);
  h.drive(pageB, PG, (t) => (t < RE0 ? pageW(posB, rotB, () => 1)(t) : reform(t)), END_, 40, opB);

  // ── light on and from the pages: a warm glow riding each, a light on her face and hand while she reads
  const rideP = (el, pos, list, op) => h.ride(el, PG, (t) => { const p = pos(t); return tr(p[0] - PG[0], p[1] - PG[1]); }, list, '');
  const gl = (a, b, c) => [[600, 0.5, 0], [1000, 1.5, 0.8], [1300, 1.9, 1], [1750, 1.6, 0.85], [REL, 2.4, 1], [b, 1.6, c], [b + 220, 0.6, 0]];
  rideP(k.lightIn('g-page', PG, 22, 22), posA, gl(0, aimed ? IM : 2300, aimed ? 0.8 : 0.4));
  rideP(k.lightIn('g-page', PG, 18, 18), posB, [[640, 0.5, 0], [1060, 1.4, 0.75], [1340, 1.6, 0.9], [2050, 1.5, 0.8], [2400, 1.2, 0.6], [2520, 0.5, 0]]);
  const faceL = [[1200, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [1500, { transform: 'scale(1)', opacity: 0.55 }, eio]];
  for (let t = 1700, i = 0; t < 2300; t += 160, i++) faceL.push([t, { transform: `scale(${i % 2 ? 1.05 : 0.95})`, opacity: i % 2 ? 0.55 : 0.4 }, eio]);
  faceL.push([2900, { transform: 'scale(.8)', opacity: 0 }]);
  fx(k.lightIn('g-page', [136, 62], 52, 52), faceL);

  // ── the pool: rings as she leans over it and as the pages rise; the reflection's glow
  const flatRing = (x, y, w, t0, o = 0.7) => fx(k.picIn(ring, [x, y], w, w * 0.3), [[t0, { transform: 'scale(.25)', opacity: 0 }, 'ease-out'], [t0 + 80, { transform: 'scale(.45)', opacity: o }, 'ease-out'], [t0 + 900, { transform: 'scale(1.4)', opacity: 0 }]]);
  flatRing(PG[0], 134, 50, 300, 0.5); flatRing(PG[0] - 6, 140, 70, 560, 0.5); flatRing(PG[0], 134, 56, 980, 0.8); flatRing(PG[0] + 4, 138, 74, 1100, 0.6);
  fx(k.lightIn('g-pool', [130, 145], 120, 48), [[200, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(1)', opacity: 0.55 }, eio], [1300, { transform: 'scale(1.05)', opacity: 0.4 }, eio], [2400, { transform: 'scale(.95)', opacity: 0.4 }, eio], [3300, { transform: 'scale(.7)', opacity: 0 }, 'ease-out'], [3600, { transform: 'scale(.7)', opacity: 0 }, 'ease-out'], [4000, { transform: 'scale(1)', opacity: 0.45 }, eio], [END_ + 100, { transform: 'scale(.8)', opacity: 0 }]]);
  // drops and motes lifting off the pages as they rise
  for (let i = 0; i < 10; i++) {
    const t0 = 1000 + i * 40 + Math.round(rand() * 40), x = PG[0] + (rand() - 0.5) * 12, y = PG[1] - 2 - rand() * 4, life = 600 + rand() * 400, sz = 2 + rand() * 2.5;
    fx(k.picIn(i % 2 ? 'cool' : 'mote', [x, y], sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 80, { transform: `${k.T(0, -4)} scale(1)`, opacity: 0.9 }, 'ease-out'], [t0 + life, { transform: `${k.T((rand() - 0.5) * 8, 10 + rand() * 8)} scale(.6)`, opacity: 0 }, 'ease-in']]);
  }

  // ── release: alone, the kept page flares and is taken in; aimed, it flies (a trail) to T
  if (aimed) {
    const F0 = REL + 160, [X0, Y0] = k.P(...PG);
    for (let j = 0; j < 9; j++) {
      const f = 0.06 + j * 0.1, ts = Math.round(F0 + (IM - F0) * (f * 0.5 + f * f * 0.5)), [x, y] = k.P(...flightA(f * 0.5 + f * f * 0.5));
      fx(k.pic(j % 2 ? 'mote' : 'orb', PG, j % 2 ? 5 : 8, j % 2 ? 5 : 8), [[ts, { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) scale(.5)`, opacity: 0 }, 'ease-out'], [ts + 40, { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) scale(1)`, opacity: 0.9 }], [ts + 320, { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) scale(.3)`, opacity: 0 }]]);
    }
  } else {
    fx(k.lightIn('g-page', RD, 60, 60), [[REL - 60, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [REL + 140, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [IM - 60, { transform: 'scale(1.1)', opacity: 0.8 }, eio], [IM + 700, { transform: 'scale(.8)', opacity: 0 }]]);
    fx(k.lightIn('g-page', [116, 84], 70, 80), [[2200, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [IM + 120, { transform: 'scale(1)', opacity: 0.6 }, 'ease-out'], [3000, { transform: 'scale(1.05)', opacity: 0 }]]);
  }
  // ── impact: a flash and rings at T (alone, at her hands, in a halo of motes)
  fx(k.light('g-page', T, 54), [[IM - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [IM + 500, { transform: 'scale(1.2)', opacity: 0.6 }, eio], [IM + 1300, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.light('g-page', T, 24), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.6)', opacity: 1 }], [IM + 240, { transform: 'scale(2.6)', opacity: 0 }]]);
  for (const [d, w, o] of [[0, 56, 0.9], [150, 40, 0.65]]) fx(k.pic(ring, T, w, w), [[IM + d - 1, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + d + 40, { transform: 'scale(.3)', opacity: o }, 'ease-out'], [IM + d + 700, { transform: 'scale(1.1)', opacity: 0 }]]);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + rand() * 0.4, d = 8 + rand() * 14, t0 = IM + rand() * 80, life = 800 + rand() * 500, sz = 2.5 + rand() * 3, ex = Math.cos(a) * d, ey = Math.sin(a) * d * 0.8;
    fx(k.pic(i % 3 ? 'mote' : 'orb', T, sz, sz), [[t0, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t0 + 120, { transform: `${k.T(ex, ey)} scale(1)`, opacity: 0.9 }, 'ease-out'], [t0 + life, { transform: `${k.T(ex * 1.2, ey - 26 - rand() * 14)} scale(.6)`, opacity: 0 }, eio]]);
  }
  // the discarded page lands in the pool: a splash of rings and a spray of drops
  const LAND = [PG[0] - 6, WL + 6];
  fx(k.lightIn('g-pool', LAND, 44, 20), [[IM - 80, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [IM + 700, { transform: 'scale(1)', opacity: 0 }]]);
  flatRing(LAND[0], LAND[1] + 2, 36, IM - 20, 0.95); flatRing(LAND[0], LAND[1] + 3, 56, IM + 130, 0.7); flatRing(LAND[0], LAND[1] + 4, 76, IM + 290, 0.45);
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * (0.1 + rand() * 0.8), v = 8 + rand() * 16, t0 = IM + rand() * 40, life = 380 + rand() * 260, sz = 2 + rand() * 2.2;
    const px = (f) => Math.cos(a) * v * f, py = (f) => Math.sin(a) * v * f + 30 * f * f;
    fx(k.picIn('cool', LAND, sz, sz), [0, 0.35, 0.7, 1].map((f, j) => [Math.round(t0 + life * f), { transform: `${k.T(px(f), py(f))} scale(${(1 - 0.5 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']));
  }
  // re-forming in the water: a soft shimmer where the pages are
  fx(k.lightIn('g-page', PG, 34, 34), [[RE0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [RE0 + 350, { transform: 'scale(1.2)', opacity: 0.85 }, eio], [RE0 + 900, { transform: 'scale(1)', opacity: 0 }]]);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + rand(), d = 14 + rand() * 6, t0 = RE0 - 100 + i * 50;
    fx(k.picIn('mote', PG, 3.5, 3.5), [[t0, { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d * 0.7)} scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 140, { transform: `${k.T(Math.cos(a) * d * 0.8, Math.sin(a) * d * 0.56)} scale(1)`, opacity: 0.9 }, 'ease-in'], [t0 + 460, { transform: 'scale(.4)', opacity: 0 }]]);
  }
}
