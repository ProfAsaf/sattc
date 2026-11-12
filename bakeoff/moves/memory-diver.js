// Memory Diver: it kicks down for the glowing page, takes it, and three memories fan out of it:
// one is kept, two sink away.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support (it looks at the top three cards and
// keeps one: card selection, not a strike, so changed from the suggested attacker), element water.
//   0-600     ANTICIPATION: it draws back up the water, arm swept back, reaching arm drawn in,
//             head tucked; a first scissor kick, bubbles breaking from its feet.
//   600-1300  DIVE: hard kicks, the body surging along its line of descent, the reaching arm
//             stretching out; the page glows as it nears, sheets of old paper drift in to it.
//   1300      it takes the page: the hand closes on it, the arm draws back, bringing it up
//             to the face; the page flares.
//   1500      RELEASE: three memories (sheets of light) fan out of the page, turning over; the
//             two that are not kept sink away dimming, trailing bubbles; the kept one glows
//             and (1840) streaks to T (k.aim, else the diver's own head) on an arc.
//   2000      IMPACT at T: a flash, rings of water-light, a spray of bubbles and motes lifting;
//             alone, the memory sinks into its head and the whole body glows a moment.
//   2000-3700 it lets the page go back to where it hung, arm and legs relaxing, hair streaming,
//             drifting back to its place; the light dies down; bubbles thin. At rest from 3700.
// Not turned toward T (a diver in profile, it gives with the hand toward the page).
// BEATS: release 1500, impact 2000, settle 3700.
import { mul, rot, scl, tr, app, curve, kit } from './_fx.js';
export const END = 4200;
export const BEATS = { release: 1500, impact: 2000, settle: 3700 };
export const STILLS = [350, 900, 1300, 1550, 1850, 2050, 2700, 3900];

export const textures = {
  orb: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [214 + 30 * c, 255, 245, Math.min(1, c * c * 2.4)]; }],
  mote: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [225, 255, 250, Math.min(1, c * c * 3)]; }],
};

export function build(k) {
  const { fx, u, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const S = k.spec, [sF, sB] = S.shoulders, [hA, hB] = S.hips, [nx, ny] = S.neck, HAND = S.hands[0], PG = S.page;
  const body = k.part('body'), armF = k.part('armF'), armB = k.part('armB'), legA = k.part('legA'), legB = k.part('legB'), hair = k.part('hair'), head = k.part('head'), page = k.part('page');
  const T = k.aim || S.head;
  k.css('.g-dive { border-radius: 50%; background: radial-gradient(circle, rgba(240,255,250,.95), rgba(190,246,240,.55) 30%, rgba(120,214,224,.2) 58%, rgba(90,200,215,0) 72%); }');
  const sheet = k.svg('<g transform="translate(10 13) rotate(22)"><rect x="-5" y="-6.5" width="10" height="13" rx=".8" fill="#fdfbea"/><path d="M-3.4,-3.6h6.8M-3.4,-1.4h6.8M-3.4,.8h5M-3.4,3h6" stroke="#a7b7ac" stroke-width=".5"/></g>', 20, 26);
  const bubble = k.svg('<circle cx="10" cy="10" r="8" fill="#bfeff2" fill-opacity=".12" stroke="#e3fbfb" stroke-width="1.3"/><circle cx="7" cy="7" r="2.2" fill="#ffffff" opacity=".85"/>', 20, 20);
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><ellipse cx="50" cy="25" rx="44" ry="20" fill="none" stroke="#d6fbfa" stroke-width="3.2" filter="url(#b)"/><ellipse cx="50" cy="25" rx="44" ry="20" fill="none" stroke="#f3ffff" stroke-width="1.1"/>', 100, 50);

  // ── its motion: one swim (surge along its dive, a tilt) carried by every piece, then each piece's own
  const D = [Math.cos((35 * Math.PI) / 180), Math.sin((35 * Math.PI) / 180)];
  const surge = curve([[0, 0], [500, -5], [1000, 5, 'in'], [1300, 9, 'out'], [1700, 5], [2600, 2], [3500, 0.2], [3700, 0]]);
  const tilt = curve([[0, 0], [500, -3], [1300, 3], [2000, 1], [3700, 0]]);
  const W = (t) => mul(tr(D[0] * surge(t), D[1] * surge(t)), rot(tilt(t), 170, 94));
  const kickAmp = curve([[0, 0], [160, 0], [420, 9], [700, 15], [1300, 15], [1700, 6], [2300, 3], [3200, 0.5], [3600, 0], [3700, 0]]);
  const kick = (t) => kickAmp(t) * Math.sin(t / 125);
  const stretch = curve([[0, 1], [400, 0.93], [1000, 1.14], [1300, 1.27, 'out'], [1550, 1.02, 'in'], [2400, 1], [3000, 1], [3700, 1]]);
  const armLift = curve([[0, 0], [1300, 0], [1550, -12, 'out'], [2300, -14], [3000, -3], [3700, 0]]);
  const AX = Math.atan2(HAND[1] - sF[1], HAND[0] - sF[0]) * 180 / Math.PI;
  const armW = (t) => mul(W(t), mul(rot(armLift(t), sF[0], sF[1]), mul(rot(AX, sF[0], sF[1]), mul(scl(stretch(t), 1, sF[0], sF[1]), rot(-AX, sF[0], sF[1])))));
  const backA = curve([[0, 0], [500, -14], [1000, 8], [1300, 12], [2000, 3], [2900, -2], [3700, 0]]);
  const hairA = (t) => 5 * Math.sin(t / 210) * curve([[0, 0], [300, 0.4], [1300, 1], [2200, 0.6], [3400, 0.1], [3700, 0]])(t);
  const nod = curve([[0, 0], [500, 4], [1300, -5], [2000, -2], [3700, 0]]);
  h.drive(body, [170, 94], W, 3700);
  h.drive(armF, sF, armW, 3700);
  h.drive(armB, sB, (t) => mul(W(t), rot(backA(t), sB[0], sB[1])), 3700);
  h.drive(legA, hA, (t) => mul(W(t), rot(kick(t), hA[0], hA[1])), 3700);
  h.drive(legB, hB, (t) => mul(W(t), rot(-kick(t) * 0.9, hB[0], hB[1])), 3700);
  h.drive(hair, [187.9, 99.7], (t) => mul(W(t), rot(hairA(t), 187.9, 99.7)), 3700);
  h.drive(head, [nx, ny], (t) => mul(W(t), rot(nod(t), nx, ny)), 3700);

  // ── the page: hangs and bobs, is taken by the hand at 1300 and carried with it, then given back to where it hung
  const OFF = [PG[0] - HAND[0], PG[1] - HAND[1]];
  const handAt = (t) => app(armW(t), HAND);
  const qOff = curve([[2700, 0], [3500, 1]]);
  const pagePos = (t) => {
    const bob = [0, 1.3 * Math.sin(t / 380)];
    const hp = handAt(t), ho = qOff(t);
    const carried = [hp[0] + OFF[0] * ho, hp[1] + OFF[1] * ho];
    if (t < 1230) return [PG[0] + bob[0], PG[1] + bob[1] * (t < 1230 ? 1 : 0)];
    if (t < 1330) { const w = k.smooth((t - 1230) / 100); return [PG[0] + (carried[0] - PG[0]) * w, PG[1] + (carried[1] - PG[1]) * w]; }
    return carried;
  };
  const pageRot = curve([[0, 0], [1300, 0], [1550, 14], [2300, 16], [3300, 4], [3700, 0]]);
  h.drive(page, PG, (t) => { const p = pagePos(t); return mul(tr(p[0] - PG[0], p[1] - PG[1]), rot(pageRot(t), PG[0], PG[1])); }, 3700);
  const E = pagePos(1500); // where the memories leave from: the page, drawn up to its face
  const EM = [E[0], E[1] - 1];

  // ── the page's light: swells as the diver nears, flares at the take and the release, burns, ebbs (riding the page)
  const gl = [[0, 0.8, 0.3], [600, 1, 0.45], [1200, 1.4, 0.8], [1330, 1.8, 1], [1500, 2.6, 1], [1700, 2, 0.85]];
  for (let t = 1900, j = 0; t < 3000; t += 230, j++) gl.push([t, j % 2 ? 1.5 : 1.8, j % 2 ? 0.55 : 0.7]);
  gl.push([3500, 0.8, 0.3]);
  h.ride(k.lightIn('g-dive', PG, 40, 40), PG, (t) => { const p = pagePos(t); return tr(p[0] - PG[0], p[1] - PG[1]); }, gl);

  // ── bubbles: a rise of them (wobbling up and out), breaking from its feet as it kicks and trailing from the page
  const rise = (x, y, t0, dist, life0, sz, dir = 1) => {
    const stops = [], life = Math.min(life0, 4190 - t0);
    for (let j = 0; j <= 4; j++) { const f = j / 4; stops.push([Math.round(t0 + life * f), { transform: `${k.T(Math.sin(f * 5 + x) * 3 * dir + 4 * f * dir, -dist * f)} scale(${(0.5 + 0.7 * f).toFixed(2)})`, opacity: j === 0 ? 0 : j === 4 ? 0 : 0.85 }, j ? eio : 'ease-out']); }
    fx(k.picIn(bubble, [x, y], sz, sz, { lit: false }), stops);
  };
  for (let i = 0; i < 22; i++) { // from its feet as they kick
    const t0 = 420 + i * 55 + Math.round(rand() * 30), [fx0, fy0] = i % 2 ? [102, 40] : [92, 70];
    rise(fx0 + (rand() - 0.5) * 12 + surge(t0) * 0.8, fy0 + (rand() - 0.5) * 10 + surge(t0) * 0.57, t0, 26 + rand() * 24, 900 + rand() * 500, 3 + rand() * 4);
  }
  for (let i = 0; i < 10; i++) rise(PG[0] + 6 + (rand() - 0.5) * 20, PG[1] - 4, 1380 + i * 110, 30 + rand() * 20, 900 + rand() * 400, 2.5 + rand() * 3.5, -1); // off the page as it is taken
  for (let i = 0; i < 6; i++) rise(190 + (rand() - 0.5) * 18, 98, 2800 + i * 130, 24, 900, 3 + rand() * 2); // off its head at the end

  // ── gather: sheets of old paper drift in to the page as it nears
  const drift = [[64, 124], [246, 80], [106, 30], [270, 134], [30, 150], [286, 60], [150, 170]];
  drift.slice(0, 6).forEach(([x, y], i) => {
    const t0 = 500 + i * 120, life = 800 + rand() * 250, dx = PG[0] - x, dy = PG[1] - y, sd = x < PG[0] ? -1 : 1, rt = Math.round(rand() * 80);
    const pts = k.arc([0, 0], [dx * 0.3 + sd * 14, dy * 0.8 - 14], [dx * 0.96, dy * 0.96], 5, (t) => t * t * (3 - 2 * t));
    fx(k.picIn(sheet, [x, y], 7, 9, { lit: false }), [[t0 - 1, { transform: `${k.T(0, 0)} rotate(${rt}deg) scale(.4)`, opacity: 0 }, 'ease-out'],
      ...pts.map(([px, py], j) => [Math.round(t0 + life * j / 4), { transform: `${k.T(px, py)} rotate(${rt + j * 70}deg) scale(${(1 - 0.45 * j / 4).toFixed(2)})`, opacity: j === 0 ? 0 : j === 4 ? 0 : 0.6 }, j < 1 ? 'ease-out' : 'ease-in-out'])]);
  });

  // ── release: three memories fan out of the page, turning over; two sink away, one is kept and streaks to T
  const REL = 1500, IM = 2000, FLY = 1840;
  const C = [(EM[0] + T[0]) / 2, Math.min(EM[1], T[1]) - 28];
  const bz = (t) => { const q = 1 - t; return [q * q * EM[0] + 2 * q * t * C[0] + t * t * T[0], q * q * EM[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const [X0, Y0] = k.P(...EM);
  const fan = [[-1, 0.9], [0, 1.15], [1, 0.9]]; // left, kept (top), right
  fan.forEach(([sd, sz], i) => {
    const kept = i === 1, fx1 = sd * 22, fy1 = kept ? -26 : -10, t0 = REL + (kept ? 0 : i * 20);
    const flip = (s) => `scale(${s}, 1)`;
    const P0 = { transform: `${k.T(0, 0)} rotate(0deg) ${flip(0.2)}` };
    const el = k.pic(sheet, EM, 11 * sz, 14 * sz, { lit: false });
    const rot0 = sd * 18;
    if (kept) {
      const [xe, ye] = bz(1), [xs, ys] = k.P(...EM), [xt, yt] = k.P(xe, ye);
      const at = (f, s, o, r) => { const [x, y] = k.P(...bz(f)); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) rotate(${r}deg) scale(${s})`, opacity: o }; };
      fx(el, [[t0, { transform: 'rotate(0deg) scale(.2, .4)', opacity: 0 }, 'ease-out'], [t0 + 140, { transform: `${k.T(fx1, fy1 * 0.6)} rotate(${rot0}deg) scale(-1, 1.1)`, opacity: 1 }, 'ease-out'], [t0 + 260, { transform: `${k.T(fx1, fy1)} rotate(${rot0 - 8}deg) scale(1, 1.15)`, opacity: 1 }, eio],
        [FLY - 20, { transform: `${k.T(fx1, fy1 - 2)} rotate(${rot0}deg) scale(-1, 1.15)`, opacity: 1 }, 'ease-in'],
        [FLY + 40, at(0.08, 1.1, 1, 0)], [FLY + 100, at(0.45, 1.2, 1, 140)], [IM - 20, at(0.97, 1, 1, 260)], [IM + 100, at(1, 1.7, 0, 300)]]);
      // its trail
      for (let j = 0; j < 7; j++) { const f = 0.1 + j * 0.13, ts = Math.round(FLY + 30 + (IM - FLY - 40) * f); const a = (ff, s, o) => { const [x, y] = k.P(...bz(ff)); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) scale(${s})`, opacity: o }; };
        fx(k.pic(j % 2 ? 'mote' : 'orb', EM, j % 2 ? 5 : 8, j % 2 ? 5 : 8), [[ts, a(f, 0.5, 0), 'ease-out'], [ts + 40, a(f, 1, 0.9)], [ts + 280, a(f, 0.3, 0)]]); }
      fx(k.pic('orb', EM, 18, 18), [[t0 + 100, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t0 + 260, { transform: `${k.T(fx1, fy1)} scale(1.1)`, opacity: 0.9 }, eio], [FLY - 20, { transform: `${k.T(fx1, fy1)} scale(1.4)`, opacity: 1 }, 'ease-in'],
        [FLY + 40, at(0.08, 1.2, 1, 0)], [IM - 20, at(0.97, 1, 1, 0)], [IM + 100, at(1, 1.8, 0)]]);
    } else {
      const sink = [fx1 * 1.6 + sd * 6, 46 + rand() * 12], dim = (o) => ({ opacity: o });
      fx(el, [[t0, { transform: 'rotate(0deg) scale(.2, .4)', opacity: 0 }, 'ease-out'], [t0 + 140, { transform: `${k.T(fx1 * 0.6, fy1 * 0.5)} rotate(${rot0}deg) scale(-1, 1.1)`, opacity: 0.95 }, 'ease-out'], [t0 + 280, { transform: `${k.T(fx1, fy1)} rotate(${rot0 - 6}deg) scale(1, 1.1)`, opacity: 0.9 }, eio],
        [FLY, { transform: `${k.T(fx1, fy1 + 2)} rotate(${rot0}deg) scale(-1, 1)`, opacity: 0.7 }, 'ease-in-out'], [FLY + 450, { transform: `${k.T(fx1 + sd * 4, fy1 + 20)} rotate(${rot0 + sd * 30}deg) scale(1, 1)`, opacity: 0.5 }, eio],
        [FLY + 1100, { transform: `${k.T(sink[0], sink[1])} rotate(${rot0 + sd * 70}deg) scale(-.8, .9)`, opacity: 0.25 }, eio], [FLY + 1700, { transform: `${k.T(sink[0] + sd * 6, sink[1] + 26)} rotate(${rot0 + sd * 110}deg) scale(.7, .8)`, opacity: 0 }]]);
      for (let j = 0; j < 3; j++) rise(EM[0] + fx1 + (rand() - 0.5) * 8, EM[1] + fy1 + 10 + j * 8, FLY + 150 + j * 240 + i * 40, 18, 900, 2.5 + rand() * 2);
    }
  });
  fx(k.lightIn('g-dive', EM, 70, 70), [[REL - 100, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [REL + 40, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [REL + 500, { transform: 'scale(1.1)', opacity: 0.55 }, eio], [REL + 1300, { transform: 'scale(.8)', opacity: 0 }]]);

  // ── impact at T: flash, rings of water-light, a spray of bubbles and motes; alone, it sinks into the head and the body glows
  fx(k.light('g-dive', T, 70), [[IM - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [IM + 500, { transform: 'scale(1.2)', opacity: 0.6 }, eio], [IM + 1400, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.light('g-dive', T, 28), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.6)', opacity: 1 }], [IM + 260, { transform: 'scale(2.6)', opacity: 0 }]]);
  for (const [d, w, o] of [[0, 90, 0.95], [150, 66, 0.7]]) {
    fx(k.pic(ring, T, w, w / 2), [[IM + d - 1, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + d + 40, { transform: 'scale(.3)', opacity: o }, 'ease-out'], [IM + d + 700, { transform: 'scale(1.1)', opacity: 0 }]]);
  }
  for (let i = 0; i < 12; i++) { // bubbles burst outward from T, then drift up
    const a = (i / 12) * Math.PI * 2 + rand() * 0.4, d = 10 + rand() * 18, t0 = IM + rand() * 80, life = 800 + rand() * 500, sz = 3 + rand() * 4;
    const ex = Math.cos(a) * d, ey = Math.sin(a) * d * 0.8;
    fx(k.pic(bubble, T, sz, sz, { lit: false }), [[t0, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t0 + 120, { transform: `${k.T(ex, ey)} scale(1)`, opacity: 0.9 }, 'ease-out'], [t0 + life, { transform: `${k.T(ex * 1.2, ey - 30 - rand() * 16)} scale(1.2)`, opacity: 0 }, eio]]);
  }
  for (let i = 0; i < 12; i++) {
    const dx = (rand() - 0.5) * 50, t0 = IM + 60 + rand() * 800, life = 900 + rand() * 600, sz = 2.5 + rand() * 3;
    const pts = k.arc([0, 0], [dx * 0.6 + (rand() - 0.5) * 18, -24], [dx * 0.8 + (rand() - 0.5) * 20, -50 - rand() * 14], 5);
    fx(k.pic('mote', [T[0] + dx * 0.4, T[1] + 4 + rand() * 8], sz, sz), [[t0 - 1, { transform: `${k.T(0, 0)} scale(.3)`, opacity: 0 }, 'ease-out'],
      ...pts.map(([x, y], j) => [Math.round(t0 + life * j / 5), { transform: `${k.T(x, y)} scale(${1 - 0.45 * j / 5})`, opacity: j === 0 ? 0 : j === 5 ? 0 : 0.9 }, 'ease-out'])]);
  }
  if (!k.aim) { // the memory goes in: its whole body glows a moment
    fx(k.lightIn('g-dive', [165, 92], 120, 80), [[IM, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [IM + 220, { transform: 'scale(1)', opacity: 0.75 }, 'ease-out'], [IM + 900, { transform: 'scale(1.05)', opacity: 0.5 }, eio], [3100, { transform: 'scale(1)', opacity: 0 }]]);
  }
}
