// Ember Duelist: the fencer's salute turns to a lunge, and her red-hot rapier throws a lance of fire.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker (as suggested: Swift, Hunt, 2 Energy
// to deal 1 damage), element fire (as suggested). Facing left.
//   0-640     (only if T lies on her right: she turns about through a sliver, mirrored about her hips.)
//   100-900   gather: the rapier, held up in salute, heats: a white-hot copy of it brightens, its glow
//             swells along the blade, sparks shed off it and fall; her arm lifts the blade a little back
//             and she sinks and leans away, hem and coat drawn behind her.
//   900-1000  the wind-up: the blade cocked furthest back, one breath held.
//   1000-1090 RELEASE: she lunges into the cut, her arm snapping round and out toward T (the blade turned
//             to point at T from the hand), a crescent of fire swept along the blade's tip.
//   1090      the lance of fire leaves the tip, straight to T.
//   1330      IMPACT at T: burst of fire in a flash, rings, flung billows and sparks, flames, smoke.
//   1330-2900 she holds the lunge a breath, then rises; the arm brings the rapier back to the salute and the
//             blade cools from white to red. At rest as drawn from 3400 (END 3800).
// Aimed: T = k.aim || [36, 96] (the burning city to her left, past the balustrade). The arm and blade turn
// from the shoulder to point at T; all of her, the arm and the rapier are placed by one affine each
// (mirrored when T is on her right), so the tip's world position is exact whichever side. The lance and
// everything that lands is on the overlay.
import { SPARK, mul, rot, scl, tr, app, curve, kit } from './_fx.js';
export const END = 3800;
export const BEATS = { release: 1090, impact: 1330, settle: 3400 };
export const STILLS = [500, 900, 1030, 1110, 1230, 1400, 2200, 3600];
export const textures = {
  spark: SPARK,
  mote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 200 + 40 * c, 120 + 100 * c * c, Math.min(1, c * c * c * 2.4)]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const body = k.part('body'), arm = k.part('arm'), rapier = k.part('rapier');
  const S = k.spec, HIPS = S.hips, SH = S.shoulder, HAND = S.hand, TIPR = S.emit;
  const T = k.aim || [36, 96];
  const flip = T[0] > HIPS[0] + 10; // she faces left; for a target on her right she turns about
  const Tm = flip ? [2 * HIPS[0] - T[0], T[1]] : T; // the target as she sees it, in her own (unmirrored) frame
  const RE = 1000, SEND = 1090, IM = 1330;
  const G0 = flip ? 640 : 100;

  // ── her pose over time, in her own frame; W(t) is the whole of it (the mirror last)
  const sxc = curve(flip ? [[0, 1], [200, 1, 'in'], [420, 0.06], [640, -1]] : [[0, 1]]);
  const F = (t) => scl(sxc(t), 1, HIPS[0], 0);
  const lean = curve([[0, 0], [G0, 0], [G0 + 450, -2.8], [900, -6.5], [RE - 10, -7.5, 'in'], [RE + 110, 8, 'out'], [IM, 5], [1900, 3], [2800, 0.6], [3400, 0]]); // + = toward T (counter-clockwise from her)
  const dxl = curve([[0, 0], [G0, 0], [900, -2], [RE - 10, -3, 'in'], [RE + 110, 7, 'out'], [IM, 5], [1900, 3], [2800, 0.5], [3400, 0]]); // toward T
  const dyl = curve([[0, 0], [G0, 0], [G0 + 450, 1.8], [900, 3], [RE - 10, 3.2, 'in'], [RE + 110, -0.5, 'out'], [IM + 200, 0.5], [2000, 1.2], [3400, 0]]);
  const Wb = (t) => mul(F(t), mul(rot(-lean(t), ...HIPS), tr(-dxl(t), dyl(t))));
  // the arm: lifts the blade back, then snaps round to aim it at T from the hand
  const ang0 = Math.atan2(TIPR[1] - HAND[1], TIPR[0] - HAND[0]); // the blade's drawn heading
  const aimA = Math.max(-165, Math.min(25, (((Math.atan2(Tm[1] - HAND[1], Tm[0] - HAND[0]) - ang0) * 180) / Math.PI + 540) % 360 - 180));
  const aim = curve([[0, 0], [G0, 0], [G0 + 450, 6], [900, 14], [RE - 10, 18, 'in'], [RE + 40, aimA * 0.45, 'lin'], [SEND, aimA - 7, 'out'], [IM, aimA - 4, 'out'], [1800, aimA - 4], [2300, aimA * 0.3], [2900, 3], [3400, 0]]);
  const ux = Tm[0] - HAND[0], uy = Tm[1] - HAND[1], ul = Math.hypot(ux, uy) || 1;
  const ext = curve([[0, 0], [G0, 0], [RE - 10, -3, 'in'], [SEND, 9, 'out'], [IM + 200, 6], [1800, 3], [2600, 0]]); // thrust along the aim
  const Wa = (t) => mul(Wb(t), mul(tr((ux / ul) * ext(t), (uy / ul) * ext(t)), rot(aim(t), ...SH)));
  h.drive(body, HIPS, Wb, 3400);
  h.drive(arm, SH, Wa, 3400);
  h.drive(rapier, SH, Wa, 3400);
  // the blade heats: a white-hot copy of it (the same motion), brightening in the gather and cooling after
  k.css('.fx-copy.hotblade { mix-blend-mode: plus-lighter; filter: brightness(1.5) saturate(.8); }');
  const hot = k.copy('rapier', 'hotblade');
  const heat = curve([[0, 0], [G0 + 100, 0.1], [900, 0.8], [SEND, 1, 'out'], [IM + 300, 0.85], [2200, 0.35], [3000, 0]]);
  h.drive(hot, SH, Wa, 3400, 50, heat);

  // ── where the tip is at any moment (world)
  const tip = (t) => app(Wa(t), TIPR);
  const rest = app(F(3400), TIPR);

  // ── the glow along the blade as it heats, and the court it lights
  const BM = app(F(G0 + 450), S.blade);
  const gl = [[G0, { transform: 'scale(.6)', opacity: 0 }, 'ease-out']];
  for (let t = G0 + 250, i = 0; t < 960; t += 110, i++) gl.push([t, { transform: `scale(${(0.9 + ((t - G0) / (960 - G0)) * 0.4 + (i % 2 ? 0.1 : -0.04)).toFixed(2)})`, opacity: +(0.4 + 0.45 * ((t - G0) / (960 - G0))).toFixed(2) }, eio]);
  gl.push([RE + 70, { transform: 'scale(1.5)', opacity: 0.7 }, 'ease-out'], [1400, { transform: 'scale(.9)', opacity: 0.1 }, eio], [1600, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.lightIn('g-warm', BM, 40, 90), gl);
  fx(k.lightIn('g-city', [150, 120], 320, 150), [[G0, { opacity: 0 }, 'ease-out'], [940, { opacity: 0.45 }, eio], [SEND + 100, { opacity: 0.85 }, 'ease-out'], [IM + 200, { opacity: 0.95 }, eio], [2300, { opacity: 0.4 }, eio], [3200, { opacity: 0 }]]);
  // the blade's tip kindling as it heats, flaring at the release
  const ptk = [[G0 + 200, { transform: 'scale(.4)', opacity: 0 }, 'ease-out']];
  for (let t = G0 + 400, i = 0; t < 960; t += 100, i++) ptk.push([t, { transform: `scale(${(0.9 + 0.5 * ((t - G0) / (960 - G0)) + (i % 2 ? 0.1 : -0.05)).toFixed(2)})`, opacity: +(0.5 + 0.4 * ((t - G0) / (960 - G0))).toFixed(2) }, eio]);
  ptk.push([RE - 10, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [RE + 140, { transform: 'scale(.6)', opacity: 0.2 }]);
  fx(k.light('g-warm', rest, 30), ptk);
  // sparks shed along the blade: each flicks off and falls, lightly sideways
  for (let i = 0; i < 20; i++) {
    const t = G0 + 150 + i * 42 + rand() * 30, fy = rand(), p = app(F(t), [153 + (155 - 153) * (1 - fy) + 2, 14 + fy * 56]);
    fx(k.pic(rand() < 0.5 ? 'spark' : 'mote', p, 3 + rand() * 2.5, 3 + rand() * 2.5), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 80, { transform: 'scale(1)', opacity: 1 }], [t + 500 + rand() * 300, { transform: `${k.T((rand() - 0.3) * 12 * (flip ? -1 : 1), 10 + rand() * 24)} scale(.25)`, opacity: 0 }]]);
  }
  // fire licking up off the tip while it holds
  for (let i = 0; i < 4; i++) h.flicker(k.pic(i % 2 ? 'flame' : 'flame2', [rest[0] + (i - 1.5) * 2, rest[1] + 3], 6 + rand() * 2, 10 + rand() * 6, { base: true }), G0 + 500 + i * 90, RE + 30 + rand() * 50, 0);

  // ── the cut (1000-1090): a crescent of fire along the swing, billows streaming off the tip
  for (let i = 0; i < 12; i++) {
    const t0 = RE + 4 + i * 8, t1 = t0 + 300, id = i % 3, sz = [14, 5, 12][id], p0 = tip(t0), p1 = tip(Math.min(SEND + 100, t0 + 120)), r = Math.round(rand() * 360);
    fx(k.pic(['puffHot', 'spark', 'puff'][id], p0, sz, sz), [[t0, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 70, { transform: `${k.T(p1[0] - p0[0], p1[1] - p0[1])} rotate(${r + 40}deg) scale(1)`, opacity: 0.95 }, 'ease-out'], [t1, { transform: `${k.T(p1[0] - p0[0] + (rand() - 0.5) * 6, p1[1] - p0[1] - 6)} rotate(${r + 90}deg) scale(1.6)`, opacity: 0 }]]);
  }
  const E = tip(SEND); // the lance leaves here
  fx(k.pic('spark', E, 26, 26), [[SEND - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [SEND + 30, { transform: 'scale(1.9) rotate(25deg)', opacity: 1 }, 'ease-out'], [SEND + 260, { transform: 'scale(.6) rotate(70deg)', opacity: 0 }]]);
  fx(k.light('g-warm', E, 40), [[SEND - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [SEND + 40, { transform: 'scale(1.7)', opacity: 1 }, 'ease-out'], [SEND + 500, { transform: 'scale(.8)', opacity: 0 }]]);

  // ── the lance (1090-1330): a spear of fire from the tip straight to T
  const dx = T[0] - E[0], dy = T[1] - E[1], len = Math.hypot(dx, dy) || 1, ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  const lance = k.svg('<defs><filter id="b" x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur stdDeviation="1.6"/></filter><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff5a14" stop-opacity="0"/><stop offset=".5" stop-color="#ff8a3a"/><stop offset="1" stop-color="#ffb04a"/></linearGradient></defs>' +
    '<path d="M2,10 C30,3 70,6 98,10 C70,14 30,17 2,10Z" fill="url(#g)" filter="url(#b)"/><path d="M20,10 C50,6.5 76,8 98,10 C76,12 50,13.5 20,10Z" fill="#ffd27a"/><path d="M52,10 C70,8.4 86,9 98,10 C86,11 70,11.6 52,10Z" fill="#fff4d8"/>', 100, 20);
  const LW = 50, steps = 8;
  const ls = [[SEND - 10, { transform: `rotate(${ang.toFixed(1)}deg) scale(.2, .5)`, opacity: 0 }, 'ease-out']];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps, q = f * f * 0.5 + f * 0.5, t = SEND + (IM - SEND) * f;
    ls.push([t, { transform: `${k.T(dx * q, dy * q)} rotate(${ang.toFixed(1)}deg) scale(${(0.7 + 0.5 * Math.sin(Math.PI * Math.min(1, f * 0.9 + 0.05))).toFixed(2)}, ${(0.8 + 0.4 * f).toFixed(2)})`, opacity: i === steps ? 0.5 : 1 }, 'linear']);
  }
  ls.push([IM + 40, { transform: `${k.T(dx, dy)} rotate(${ang.toFixed(1)}deg) scale(.5, 1)`, opacity: 0 }]);
  fx(k.pic(lance, E, LW, LW * 0.2, {}), ls);
  for (let i = 0; i < 18; i++) {
    const t0 = SEND + 4 + i * 11, t1 = IM + 10 + i * 6, id = i % 3, sz = [14, 5, 11][id], side = (rand() - 0.5) * 7;
    const bz = (f) => [E[0] + dx * f - (dy / len) * side * Math.sin(Math.PI * f), E[1] + dy * f + (dx / len) * side * Math.sin(Math.PI * f)];
    h.fly(k.pic(['puffHot', 'spark', 'puff'][id], E, sz, sz), E, bz, t0, t1, (f) => (id === 1 ? 1.1 - 0.4 * f : 0.5 + 0.8 * f), (f) => (f < 0.1 ? f * 9 : f > 0.94 ? 0.2 : 0.9), Math.round(rand() * 360), 90, 40, (f) => f * f * 0.5 + f * 0.5);
  }
  // a light riding the lance's head
  const hl = [[SEND - 10, { transform: 'scale(.4)', opacity: 0 }, 'ease-out']];
  for (let i = 0; i <= steps; i++) { const f = i / steps, q = f * f * 0.5 + f * 0.5; hl.push([SEND + (IM - SEND) * f, { transform: `${k.T(dx * q, dy * q)} scale(${(0.9 + 0.5 * f).toFixed(2)})`, opacity: i === steps ? 0.5 : 1 }, 'linear']); }
  hl.push([IM + 80, { transform: `${k.T(dx, dy)} scale(.6)`, opacity: 0 }]);
  fx(k.light('g-warm', E, 30), hl);

  // ── the impact (1330) and the scorch left on the court
  h.burst(T, IM, { size: 1.15, flames: 4, linger: 1100 });
  const sc = ((rand() - 0.5) * 16).toFixed(1);
  const glw = [[IM + 40, { transform: `rotate(${sc}deg) scale(.15, .07)`, opacity: 0 }, 'ease-out'], [IM + 480, { transform: `rotate(${sc}deg) scale(1, .45)`, opacity: 0.95 }]];
  for (let t = IM + 640, i = 0; t < 2200; t += 150, i++) glw.push([t, { transform: `rotate(${sc}deg) scale(1, .45)`, opacity: i % 2 ? 1 : 0.7 }, eio]);
  glw.push([2700, { transform: `rotate(${sc}deg) scale(1, .45)`, opacity: 0 }]);
  fx(k.pic('scorch2:char', [T[0], T[1] + 9], 40, 40, { lit: false, low: true }), [[IM + 40, { transform: `rotate(${sc}deg) scale(.15, .07)`, opacity: 0 }, 'ease-out'], [IM + 480, { transform: `rotate(${sc}deg) scale(1, .45)`, opacity: 1 }], [2200, { transform: `rotate(${sc}deg) scale(1, .45)`, opacity: 1 }, eio], [2900, { transform: `rotate(${sc}deg) scale(1, .45)`, opacity: 0 }]]);
  fx(k.pic('scorch2:glow', [T[0], T[1] + 9], 40, 40), glw);

  // ── after: the blade cooling, a few embers falling from it as she rises
  for (let i = 0; i < 8; i++) {
    const t = 1700 + i * 130 + rand() * 60, p = app(Wa(Math.min(t, 3300)), [153 + rand() * 4, 20 + rand() * 40]);
    fx(k.pic('spark', p, 4, 4), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 100, { transform: 'scale(1)', opacity: 1 }], [t + 800, { transform: `${k.T((rand() - 0.5) * 12, 16 + rand() * 18)} scale(.25)`, opacity: 0 }]]);
  }
}
