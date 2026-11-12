// Old Root, Grove Warden: he plants himself, roots creeping out across the ground from his feet, raises the shield of woven
// roots, his eyes and the bud on its boss blazing; then he takes the blows on the shield, each one a jolt that runs through
// shield, trunk and crown (a flash of green light at the blow, bark splinters and sap flying, leaves shaken from the crown),
// holds, and settles.
//
// PLAN (drawing units 300 x 210, ms of the move). Role defender (as suggested), element nature.
//   0-700     brace (BEATS.release 700): he sinks onto his feet and leans into the shield, which comes up and forward;
//             roots run out along the ground from his feet (dust and a few leaves where he plants), his eyes and the
//             shield's bud swell with light; the crown draws in, then spreads.
//   blow n    (alone: 1500, 1950, 2400; each flies in from outside the shield, arrow-like, and strikes the nearest guard
//             point) the shield jolts inward and twists, the trunk takes it (a lean and a squash), the crown whips, a
//             flash and a ring at the guard point, splinters, sap and leaves; the bud and eyes flare.
//   after     he holds a moment, then lets go: shield lowers, roots sink back, light fades; at rest as drawn
//             from 3700 (END 4200).
// Aimed: blows are k.blows || the three above; each is snapped to the nearest of spec.guard and reacted to at its time
// and place, pushing the shield in from there. (When k.blows is given, the attacker brings its own attack: nothing is
// drawn flying in.)
import { mul, rot, scl, tr, app, curve, kit } from './_fx.js';
export const END = 4200;
export const BEATS = { release: 700, impact: 1500, settle: 3700 };
export const STILLS = [450, 900, 1480, 1560, 1750, 2000, 2800, 3900];
export const textures = {
  mote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [236, 255, 170 + 50 * c, Math.min(1, c * c * c * 2.4)]; }],
  star: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); const ax = Math.abs(x - 0.5) * 2, ay = Math.abs(y - 0.5) * 2, ray = Math.max(0, 1 - Math.min(ax, ay) * 9) * Math.max(0, 1 - Math.max(ax, ay)); return [240, 255, 190 + 55 * c * c, Math.min(1, c * c * c * 1.6 + ray * 0.8)]; }],
};

export function build(k) {
  const { fx, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  k.css('.g-grow { border-radius: 50%; background: radial-gradient(circle, rgba(252,255,214,.95), rgba(214,240,120,.55) 30%, rgba(150,208,72,.2) 55%, rgba(120,190,50,0) 70%); }');
  const S = k.spec, C = S.shield, F = S.feet, CR = S.crown, BUD = S.bud;
  const rad = (a) => (a * Math.PI) / 180;

  // ── the blows, each snapped to the nearest guard point
  const own = [{ at: 1500, to: [199, 128] }, { at: 1950, to: [192, 148] }, { at: 2400, to: [192, 108] }];
  const blows = (k.blows && k.blows.length ? k.blows : own).slice().sort((a, b) => a.at - b.at).map((b) => {
    const G = S.guard.reduce((best, g) => (Math.hypot(g[0] - b.to[0], g[1] - b.to[1]) < Math.hypot(best[0] - b.to[0], best[1] - b.to[1]) ? g : best), S.guard[0]);
    let dx = C[0] - G[0], dy = C[1] - G[1];
    const l = Math.hypot(dx, dy);
    if (l < 3) { dx = -1; dy = 0.2; } else { dx /= l; dy /= l; } // (the push: inward from the guard point)
    return { at: b.at, G, dx, dy };
  });
  const alone = !(k.blows && k.blows.length);
  const last = blows[blows.length - 1].at;
  const holdEnd = Math.max(1100, Math.min(3000, last + 650));

  // ── how he moves (br: 0 at rest, 1 braced)
  const br = curve([[0, 0], [220, 0], [700, 1, 'out'], [holdEnd, 1], [3650, 0]]);
  const ring = (t, a, dec, per) => (t < a ? 0 : Math.exp(-(t - a) / dec) * Math.cos(((t - a) * 2 * Math.PI) / per)); // a damped kick: in, then back past
  const kick = (t, f) => blows.reduce((s, b) => s + f(b) * ring(t, b.at, 170, 380), 0);
  const jx = (t) => kick(t, (b) => 3.8 * b.dx), jy = (t) => kick(t, (b) => 3.8 * b.dy);
  const jr = (t) => kick(t, (b) => (b.G[1] < C[1] ? 1 : -1) * 2.6 * Math.abs(b.dx) + 0.8 * b.dy * 2);
  const lean = (t) => -0.8 * br(t) + kick(t, (b) => -1.05 * Math.sign(b.dx || 1) * 0.9);
  const sq = (t) => 0.02 * br(t) + kick(t, () => 0.012);
  const WB = (t) => mul(rot(lean(t), F[0], F[1]), scl(1 + sq(t) * 0.6, 1 - sq(t), F[0], F[1]));
  const WS = (t) => mul(WB(t), mul(tr(jx(t), jy(t) - 3 * br(t)), mul(rot(jr(t), C[0], C[1]), scl(1 + 0.05 * br(t), 1 + 0.05 * br(t), C[0], C[1]))));
  const sway = (t) => br(t) * 1.3 * Math.sin(t / 230) * Math.min(1, (700 - Math.abs(t - 700)) / 400 + 0.35) + kick(t, () => 2.4) * 1.0 + blows.reduce((s, b) => s + (t < b.at ? 0 : 2.2 * Math.exp(-(t - b.at) / 260) * Math.sin(((t - b.at) * 2 * Math.PI) / 330)), 0);
  const WC = (t) => mul(WB(t), rot(sway(t), CR[0], CR[1]));
  const STEP = 45;
  for (const n of ['body', 'face', 'eyeglow', 'eyes']) h.drive(k.part(n), F, WB, 3700, STEP);
  h.drive(k.part('crown'), CR, WC, 3700, STEP);
  for (const n of ['shield', 'weave', 'bud']) h.drive(k.part(n), C, WS, 3700, STEP);

  // ── light: his eyes and the shield's bud swell as he braces, and flare at every blow
  const flare = (base, pk) => { // [ms, scale, opacity] riding stops: brace, a spike at each blow, fade
    const l = [[250, 0.5, 0], [700, 1.0, base], [Math.max(holdEnd, 900), 0.9, base * 0.85]];
    const pts = [];
    for (const b of blows) pts.push([b.at - 30, 1.0, base], [b.at + 40, pk, 1], [b.at + 330, 1.1, base * 0.9]);
    const all = [...l, ...pts].sort((a, b) => a[0] - b[0]);
    all.push([3300, 0.6, 0], [3701, 0.6, 0]);
    return all.filter((e, i) => i === 0 || e[0] > all[i - 1][0]);
  };
  for (const [ex, ey] of S.eyes) h.ride(k.lightIn('g-grow', [ex, ey], 24, 24), [ex, ey], WB, flare(0.7, 1.8));
  h.ride(k.picIn('star', BUD, 24, 24), BUD, WS, flare(0.7, 2.0).map(([t, s, o]) => [t, s, o * 0.9]));
  h.ride(k.lightIn('g-grow', BUD, 56, 56), BUD, WS, flare(0.55, 1.7));
  h.ride(k.lightIn('g-grow', [F[0], 110], 160, 170, { under: true }), [F[0], 110], WB, [[300, 0.8, 0], [800, 1, 0.4], [Math.max(holdEnd, 900), 1, 0.35], [3400, 0.9, 0], [3701, 0.9, 0]]);

  // ── roots run out along the ground from his feet (grow from the foot outward, sink back at the end)
  const rootSvg = (flip) => k.svg('<defs><linearGradient id="r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9c878"/><stop offset=".4" stop-color="#4d6a3a"/><stop offset="1" stop-color="#22331a"/></linearGradient></defs>' +
    `<g transform="${flip ? 'translate(80 0) scale(-1 1)' : ''}"><path d="M0,9C10,6 22,8 34,6C48,4 62,7 80,5C64,10 50,10 36,11C24,12 10,13 0,13Z" fill="url(#r)"/>` +
    '<path d="M24,7C28,2 34,1 38,2M46,5C50,10 54,13 60,14M58,6C62,3 68,2 74,3" stroke="#3b5428" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
    '<path d="M3,9.4C14,8 26,9 40,7.6C52,6.6 64,8 76,6" stroke="#ecff9a" stroke-width="1" fill="none" opacity=".85"/></g>', 80, 16);
  const rootsOut = [[F[0] - 8, 202, -1, 70, 0], [F[0] + 8, 203, 1, 82, 40], [F[0] - 4, 206, -1, 44, 90], [F[0] + 4, 207, 1, 52, 130]];
  for (const [x0, y, dir, len, dl] of rootsOut) {
    const el = k.picIn(rootSvg(dir < 0), [x0 + dir * len / 2, y], len, len * 0.2);
    const Ls = (s) => ({ transform: `translateX(${(dir * (len / 2) * -(1 - s) * k.u).toFixed(2)}px) scaleX(${Math.max(0.02, s).toFixed(3)})` });
    fx(el, [[220 + dl, { ...Ls(0.02), opacity: 0 }, 'ease-out'], [300 + dl, { ...Ls(0.1), opacity: 1 }, 'ease-out'], [760 + dl, { ...Ls(1), opacity: 1 }, eio], [Math.max(holdEnd, 1000) + dl, { ...Ls(1), opacity: 1 }, eio], [3500 + dl, { ...Ls(0.02), opacity: 0.6 }, 'ease-in'], [3560 + dl, { ...Ls(0.02), opacity: 0 }]]);
  }
  // dust where he plants his feet
  for (let i = 0; i < 4; i++) {
    const x = F[0] + (i - 1.5) * 16 + (rand() - 0.5) * 6, t = 430 + i * 50, r = Math.round(rand() * 360);
    fx(k.picIn('smoke', [x, 201], 24, 24, { lit: false }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 260, { transform: `${k.T((i - 1.5) * 5, -5)} rotate(${r + 20}deg) scale(.9)`, opacity: 0.4 }], [t + 1000, { transform: `${k.T((i - 1.5) * 9, -14)} rotate(${r + 40}deg) scale(1.5)`, opacity: 0 }]]);
  }

  // ── what the blows do
  const leafA = k.svg('<path d="M10,1C17,6 17,17 10,25C3,17 3,6 10,1Z" fill="#6f9a3c"/><path d="M10,4L10,22" stroke="#dff3a0" stroke-width=".9" fill="none"/>', 20, 26);
  const leafB = k.svg('<path d="M10,1C17,6 17,17 10,25C3,17 3,6 10,1Z" fill="#d6e89a"/><path d="M10,4L10,22" stroke="#7e9a4c" stroke-width=".9" fill="none"/>', 20, 26);
  const shard = k.svg('<path d="M0,3L12,0L9,4Z" fill="#3a2a1c"/><path d="M0,3L12,0L10,1.4Z" fill="#8a6a44"/>', 12, 5);
  const gring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#eaffa6" stroke-width="5" filter="url(#b)"/>', 100, 100);
  const arrow = k.svg('<path d="M3,3.2L33,3.2" stroke="#5a4230" stroke-width="1.6" stroke-linecap="round"/><path d="M33,0.8L40,3.2L33,5.6Z" fill="#c9cfd6"/><path d="M3,3.2L0,0.6M3,3.2L0,5.8M7,3.2L4,1M7,3.2L4,5.4" stroke="#8a6a44" stroke-width="1.3" fill="none" stroke-linecap="round"/>', 40, 6.4);
  blows.forEach((b, bi) => {
    const [gx, gy] = b.G, IM = b.at, out = [-b.dx, -b.dy];
    // (alone) it flies in from outside the shield and strikes the guard point
    if (alone) {
      const st = [gx + out[0] * 110 + (bi - 1) * 8, gy + out[1] * 110 - 24], ang = (Math.atan2(gy - st[1], gx - st[0]) * 180) / Math.PI;
      const at = (f) => k.T((gx - st[0]) * f, (gy - st[1]) * f);
      fx(k.pic(arrow, st, 40, 6.4), [[IM - 300, { transform: `${at(0)} rotate(${ang.toFixed(1)}deg)`, opacity: 0 }, 'ease-in'], [IM - 270, { transform: `${at(0.1)} rotate(${ang.toFixed(1)}deg)`, opacity: 1 }, 'ease-in'], [IM, { transform: `${at(1)} rotate(${ang.toFixed(1)}deg)`, opacity: 1 }], [IM + 30, { transform: `${at(1.02)} rotate(${(ang + 4).toFixed(1)}deg)`, opacity: 1 }], [IM + 420, { transform: `${at(1.02)} rotate(${(ang - 3).toFixed(1)}deg)`, opacity: 0.9 }, eio], [IM + 700, { transform: `${at(1.02)} rotate(${ang.toFixed(1)}deg)`, opacity: 0 }]]);
    }
    // the flash, a ring, a star at the guard point
    fx(k.pic('mote', [gx, gy], 56, 56), [[IM - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [IM + 420, { transform: 'scale(1.7)', opacity: 0 }]]);
    fx(k.light('g-grow', [gx, gy], 44), [[IM - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.3)', opacity: 0.95 }, 'ease-out'], [IM + 500, { transform: 'scale(1.7)', opacity: 0 }]]);
    fx(k.pic('star', [gx, gy], 30, 30), [[IM - 20, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.2) rotate(30deg)', opacity: 1 }, 'ease-out'], [IM + 330, { transform: 'scale(.6) rotate(70deg)', opacity: 0 }]]);
    fx(k.pic(gring, [gx, gy], 44, 44), [[IM, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(.4)', opacity: 0.95 }, 'ease-out'], [IM + 480, { transform: 'scale(1.15)', opacity: 0 }]]);
    // bark splinters and sap flying off, away from the blow's push (outward and sideways)
    for (let i = 0; i < 9; i++) {
      const a = Math.atan2(out[1], out[0]) + (rand() - 0.5) * 2.4, v = 14 + rand() * 26, life = 420 + rand() * 300, r0 = Math.round(rand() * 360);
      const px = (f) => Math.cos(a) * v * f, py = (f) => Math.sin(a) * v * f + 30 * f * f - 6 * f;
      const sp = k.pic(i % 3 ? shard : 'mote', [gx, gy], i % 3 ? 7 : 4, i % 3 ? 3 : 4, i % 3 ? { lit: false } : {});
      fx(sp, [0, 0.3, 0.7, 1].map((f, j) => [IM + life * f, { transform: `${k.T(px(f), py(f))} rotate(${r0 + Math.round(f * 220)}deg) scale(${(1.1 - 0.3 * f).toFixed(2)})`, opacity: j === 0 ? 0 : j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']));
    }
    // leaves shaken from the crown, falling and turning
    for (let i = 0; i < 3; i++) {
      const lx = CR[0] - 36 + rand() * 76, ly = 52 + rand() * 18, t = IM + 40 + i * 70 + rand() * 40, life = Math.min(1400 + rand() * 500, 4150 - t), sd = (rand() - 0.5) * 30;
      const fk = [0, 0.25, 0.5, 0.75, 1].map((f, j) => [t + life * f, { transform: `${k.T(sd * f + Math.sin(f * 9 + i + bi) * 7, f * (90 + rand() * 20))} rotate(${Math.round(Math.sin(f * 7 + i) * 60 + f * 90)}deg) scale(${(0.5 + 0.2 * Math.sin(f * 5)).toFixed(2)}, ${(0.6 + 0.4 * Math.abs(Math.cos(f * 8 + i))).toFixed(2)})`, opacity: j === 0 ? 0 : j === 4 ? 0 : 1 }, 'linear']);
      fx(k.pic((i + bi) % 2 ? leafA : leafB, [lx, ly], 8, 10, { lit: false }), fk);
    }
  });
}
