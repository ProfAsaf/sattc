// Pickpocket (a 1/2 flyer: "Soar. Whenever it hits an opponent in a fight, a random card from their hand goes to their
// discard pile"). The magpie turns on its target, rears back with its wings flung up and the purse swinging, then
// stoops: one hard downbeat and it darts at T, a rush of wind streaks and the purse's coins flung from its beak
// ahead of it; at T the coins burst in glints, a gust ring and black feathers fly, and a little card is knocked
// flipping out of the air (the discard). It recoils on soft beats, the purse swinging out its momentum, then turns
// back and settles, exactly as drawn. The merchant below shakes his fist the whole while, flinching when it lands.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker (as suggested), element wind (changed from water:
// what flies is a gust, feathers and glints of coin, nothing watery). T = k.aim, else the merchant's head (`merchant`).
// The bird is drawn facing left; if T is to its right it turns round (a flip through a sliver, 0-480) and tips its
// beak toward T. Every piece of the bird rides one world affine about `body` (flip, tilt, lunge, bob); the wings
// add their beat about their shoulders, the cloak lags about the neck, the purse swings about the beak.
//   0-480    TURN (if T is behind it) and GATHER: wings flung up, body rears back, purse swings forward
//   480-1050 the coil: wings held high, a glint swells on the purse; 900-1050 the DOWNBEAT
//   1050     RELEASE: streaks and coins go out from the beak/purse to T
//   1300     IMPACT: coins burst at T: glints, gust ring, feathers, a card knocked out of the air
//   1300-2400 recoil, soft beats, the purse swinging out, glints and feathers settling
//   2400-3700 turns back, eases down; SETTLE 3700, as drawn.
import { mul, rot, scl, tr, app, curve, kit } from './_fx.js';

export const END = 4200;
export const BEATS = { release: 1050, impact: 1300, settle: 3700 };
export const STILLS = [350, 750, 1000, 1150, 1330, 1650, 2300, 3900];

export const textures = {
  coin: [24, 24, (x, y) => {
    const r = Math.hypot(x - 0.5, y - 0.5) * 2, edge = Math.min(1, Math.max(0, (1 - r) * 8));
    const h = Math.max(0, 1 - Math.hypot(x - 0.38, y - 0.36) * 4);
    const rim = r > 0.72 ? 0.62 : 1;
    return [255 * rim + 0 * h, (214 + 30 * h) * rim, (110 + 110 * h) * rim, edge];
  }],
  glint: [48, 48, (x, y) => {
    const u = Math.abs(x - 0.5) * 2, v = Math.abs(y - 0.5) * 2, f = Math.pow(u, 0.5) + Math.pow(v, 0.5), c = Math.max(0, 1 - Math.hypot(u, v) * 1.8);
    const a = Math.max(Math.max(0, 1 - f * 0.95), c * c);
    return [255, 246 - 20 * (1 - c), 210 - 60 * (1 - c), Math.min(1, a * 1.5)];
  }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const F = kit(k), { drive, fly, arcPath } = F;
  const S = k.spec, E = S.emit, B = S.body, SF = S.shoulderF, SN = S.shoulderN, BK = S.beak;
  const T = k.aim || S.merchant;
  const REL = BEATS.release, IM = BEATS.impact, BACK = BEATS.settle;
  const [X, Y] = B, NECK = [112, 67], FIST = [232, 117], SHO = [236, 153];
  const tidy = (l) => l.filter((q, i) => i === 0 || q[0] > l[i - 1][0]);
  k.css('.g-gold { border-radius: 50%; background: radial-gradient(circle, rgba(255, 248, 214, .95), rgba(255, 212, 120, .55) 32%, rgba(240, 172, 64, .18) 58%, rgba(240, 160, 40, 0) 72%); }');
  const streak = k.svg('<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#e8fffa" stop-opacity="0"/><stop offset=".7" stop-color="#e8fffa" stop-opacity=".8"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs><path d="M0,3.5 L36,1.2 Q42,3.5 36,5.8Z" fill="url(#g)"/>', 42, 7);
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#bfeee6" stroke-width="5" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#ffffff" stroke-width="1.2"/>', 100, 100);
  const feather = k.svg('<path d="M1,6 Q14,-1 30,4 Q38,6 30,9 Q14,13 1,6Z" fill="#0b1a20"/><path d="M3,6 H34" stroke="#bfe4e0" stroke-width=".7"/><path d="M12,6 L17,1.6 M18,6 L23,2.2 M12,6 L17,10.4 M18,6 L23,9.8" stroke="#1d4a52" stroke-width=".6"/>', 38, 12);
  const card = k.svg('<rect x="1" y="1" width="18" height="26" rx="2.6" fill="#3a2f7a" stroke="#f0d890" stroke-width="1.3"/><circle cx="10" cy="14" r="4.4" fill="none" stroke="#f0d890" stroke-width="1"/><path d="M10,9 V19 M5,14 H15" stroke="#f0d890" stroke-width=".7"/>', 20, 28);

  // ── which way it faces: drawn facing left; T on its right means turning round (a flip about `body`)
  const flip = T[0] > X;
  const E1 = flip ? [2 * X - E[0], E[1]] : E;
  const base = Math.atan2(E1[1] - Y, E1[0] - X), tg = Math.atan2(T[1] - Y, T[0] - X);
  let da = ((((tg - base) * 180) / Math.PI + 540) % 360) - 180;
  if (!flip) da = Math.max(-35, Math.min(35, da)); else da = Math.max(-40, Math.min(40, da));
  const dist = Math.hypot(T[0] - X, T[1] - Y) || 1, hx = (T[0] - X) / dist, hy = (T[1] - Y) / dist;
  const L = Math.min(34, dist * 0.4);

  // ── its poses over time
  const sF = flip ? curve([[0, 1], [210, 0.06], [480, -1], [2650, -1], [2900, 0.06], [3200, 1]]) : () => 1;
  const aT = curve([[0, 0], [480, da * 0.25], [1000, da * 0.45], [1280, da, 'out'], [1800, da * 0.7], [2500, da * 0.25], [3300, 0], [BACK, 0]]);
  const dT = curve([[0, 0], [480, -6], [1000, -11, 'in'], [1300, L, 'out'], [1550, L * 0.92], [1900, -4], [2300, -1.5], [3000, 0], [BACK, 0]]);
  const bT = curve([[0, 0], [480, 4], [1000, 7], [1300, -3], [1600, -5], [2000, -2], [2600, -3.5], [3100, -1], [BACK, 0]]);
  const Wb = (t) => mul(tr(hx * dT(t), hy * dT(t) + bT(t)), mul(rot(aT(t), X, Y), scl(sF(t), 1, X, Y)));
  const wN = curve([[0, 0], [300, -22], [620, -36, 'in'], [900, -32], [1060, 42, 'out'], [1200, 20], [1360, -4], [1600, -22], [1800, 6], [2000, -14], [2300, 5], [2600, -8], [2900, 2], [3300, -2], [BACK, 0]]);
  const wF = (t) => -0.9 * wN(t);
  const cT = curve([[0, 0], [600, -7], [1060, 11], [1360, -9], [1700, 7], [2100, -4], [2600, 3], [3100, -2], [BACK, 0]]);
  const pT = curve([[0, 0], [480, 7], [900, -10], [1100, -24], [1320, 16], [1520, -9], [1750, 7], [2000, -4], [2400, 3], [2900, -1], [BACK, 0]]);
  const aS = curve([[0, 0], [500, 0], [600, -11], [760, 8], [920, -10], [1080, 8], [1240, -10], [1300, 17, 'out'], [1480, -7], [1640, 7], [1820, -6], [2020, 5], [2300, -4], [2650, 3], [3000, -2], [3300, 0], [BACK, 0]]);
  const WN = (t) => mul(Wb(t), rot(wN(t), SN[0], SN[1])), WF = (t) => mul(Wb(t), rot(wF(t), SF[0], SF[1]));
  const WC = (t) => mul(Wb(t), rot(cT(t), NECK[0], NECK[1])), WP = (t) => mul(Wb(t), rot(pT(t), BK[0], BK[1]));
  const WA = (t) => rot(aS(t), SHO[0], SHO[1]), END_ = BACK + 100;
  drive(k.part('body'), B, Wb, END_);
  drive(k.part('farwing'), SF, WF, END_);
  drive(k.part('cloak'), B, WC, END_);
  drive(k.part('nearwing'), SN, WN, END_);
  drive(k.part('purse'), BK, WP, END_);
  drive(k.part('arm'), SHO, WA, END_, 60);
  drive(k.part('shake'), SHO, WA, END_, 60);

  const BEAK = (t) => app(Wb(t), E), PURSE = (t) => app(WP(t), [90, 82]), FISTP = (t) => app(WA(t), FIST);

  // ── gathering: a glint swelling on the purse, motes of light drawn in; a hush of wind under the downbeat
  fx(k.lightIn('g-gold', [90, 82], 26, 26), [[250, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [700, { transform: 'scale(1)', opacity: 0.8 }, 'ease-in'], [REL, { transform: 'scale(1.5)', opacity: 1 }, eio], [1300, { transform: 'scale(1)', opacity: 0.5 }, eio], [1700, { transform: 'scale(.6)', opacity: 0 }]]);
  for (let i = 0; i < 3; i++) {
    const t0 = 320 + i * 220, px = 90 + (rand() - 0.5) * 8, py = 80 + (rand() - 0.5) * 8, sz = 7 + rand() * 4;
    fx(k.picIn('glint', [px, py], sz, sz), [[t0, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [t0 + 130, { transform: 'scale(1) rotate(20deg)', opacity: 1 }, eio], [t0 + 420, { transform: 'scale(.2) rotate(50deg)', opacity: 0 }]]);
  }
  // pale puffs of air flung down by the downbeat
  for (let i = 0; i < 5; i++) {
    const t0 = 930 + i * 40, r = Math.round(rand() * 360), x = X - 6 + i * 9 + (rand() - 0.5) * 6;
    fx(k.picIn('puffCool', [x, Y - 4], 14, 14, { lit: false }), [[t0, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 150, { transform: `${k.T((rand() - 0.5) * 8, 10 + rand() * 6)} rotate(${r + 30}deg) scale(1)`, opacity: 0.5 }], [t0 + 560, { transform: `${k.T((rand() - 0.5) * 14, 26 + rand() * 8)} rotate(${r + 60}deg) scale(1.8)`, opacity: 0 }]]);
  }

  // ── the rush (RELEASE to IMPACT): wind streaks from the beak along the line to T, and the coins from the purse ahead of it
  const ang = (Math.atan2(T[1] - BEAK(REL)[1], T[0] - BEAK(REL)[0]) * 180) / Math.PI;
  const B0 = BEAK(REL + 60);
  for (let i = 0; i < 6; i++) {
    const t0 = REL - 30 + i * 36, off = (i - 2.5) * 3.4, nx = -hy, ny = hx;
    const a = [B0[0] + nx * off, B0[1] + ny * off], b = [T[0] + nx * off * 0.5, T[1] + ny * off * 0.5];
    const sl = Math.min(34, Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.5);
    fly(k.pic(streak, a, sl, 3.2 + rand() * 1.6), a, arcPath(a, b, 0), t0, t0 + (IM - REL) + 90, (f) => 0.5 + 0.7 * Math.sin(f * Math.PI), (f) => (f < 0.12 || f > 0.9 ? 0.0 : 0.85), ang, 0, 40, (f) => f * f * 0.5 + f * 0.5);
  }
  const P1 = PURSE(REL);
  for (let i = 0; i < 8; i++) {
    const t0 = REL - 20 + i * 28, sz = 4.4 + rand() * 2.4, tt = [T[0] + (rand() - 0.5) * 14, T[1] + (rand() - 0.5) * 10];
    fly(k.pic('coin', P1, sz, sz), P1, arcPath(P1, tt, 14 + rand() * 14), t0, IM + 20 + i * 14, (f) => 0.5 + 0.7 * f, (f) => (f < 0.08 ? f / 0.08 : f > 0.94 ? 0 : 1), Math.round(rand() * 360), 360 + rand() * 300, 40, (f) => f * f * 0.45 + f * 0.55);
  }

  // ── IMPACT at T: gold light, glints, a gust ring, feathers, and a card knocked out of the air
  fx(k.light('g-gold', T, 52), tidy([[IM - 50, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(1.2)', opacity: 1 }, eio], [IM + 320, { transform: 'scale(.95)', opacity: 0.6 }, eio], [IM + 700, { transform: 'scale(.9)', opacity: 0.35 }, eio], [IM + 1100, { transform: 'scale(.6)', opacity: 0 }]]));
  for (let i = 0; i < 2; i++) { const t0 = IM + i * 130; fx(k.pic(ring, T, 44, 44), [[t0, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [t0 + 70, { transform: 'scale(.4)', opacity: 0.9 }], [t0 + 560, { transform: 'scale(1.3)', opacity: 0 }]]); }
  for (let i = 0; i < 7; i++) {
    const a = rand() * Math.PI * 2, d = 6 + rand() * 18, t0 = IM + i * 45, sz = 8 + rand() * 9;
    fx(k.pic('glint', [T[0] + Math.cos(a) * d, T[1] + Math.sin(a) * d * 0.8], sz, sz), [[t0, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [t0 + 110, { transform: 'scale(1.1) rotate(25deg)', opacity: 1 }, eio], [t0 + 470, { transform: 'scale(.2) rotate(70deg)', opacity: 0 }]]);
  }
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI * (0.05 + rand() * 0.9), sp = 10 + rand() * 24, t0 = IM + rand() * 40, life = 420 + rand() * 340, sz = 3 + rand() * 2.4;
    const px = (f) => Math.cos(a) * sp * f * u, py = (f) => (Math.sin(a) * sp * f + 34 * f * f) * u;
    fx(k.pic('coin', T, sz, sz), [0, 0.35, 0.7, 1].map((f, j) => [t0 + life * f, { transform: `translate(${px(f).toFixed(1)}px, ${py(f).toFixed(1)}px) rotate(${Math.round(f * 500)}deg) scale(${(1 - 0.4 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']));
  }
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI * (0.1 + rand() * 0.8), sp = 14 + rand() * 20, t0 = IM + 20 + i * 40, life = 1100 + rand() * 500, r0 = Math.round(rand() * 360), w = 7 + rand() * 4, ks = [];
    for (let j = 0; j <= 6; j++) {
      const f = j / 6, e = 1 - (1 - f) * (1 - f), sway = Math.sin(f * 9 + i) * 5 * f;
      ks.push([t0 + life * f, { transform: `translate(${(Math.cos(a) * sp * e + sway).toFixed(1) * u}px, ${((Math.sin(a) * sp * e + 30 * f * f) * u).toFixed(1)}px) rotate(${Math.round(r0 + f * 260 + Math.sin(f * 9 + i) * 40)}deg) scale(${(0.6 + 0.5 * Math.min(1, f * 4)).toFixed(2)})`, opacity: j === 0 || j === 6 ? 0 : 0.95 }, 'linear']);
    }
    fx(k.pic(feather, T, w, w * 0.32), ks);
  }
  // the card, knocked up out of the air, flipping, and away
  const cks = [];
  for (let j = 0; j <= 9; j++) {
    const f = j / 9, e = 1 - (1 - f) * (1 - f);
    cks.push([IM + 40 + 1250 * f, { transform: `translate(${(((flip ? -1 : 1) * 20 * e + Math.sin(f * 7) * 3) * u).toFixed(1)}px, ${(((-30 * Math.sin(Math.min(1, f * 1.3) * Math.PI * 0.7)) + 34 * f * f) * u).toFixed(1)}px) rotate(${Math.round(f * 300 * (flip ? -1 : 1))}deg) scale(${Math.cos(f * 14).toFixed(2)}, 1)`, opacity: j === 0 || j === 9 ? 0 : 0.95 }, 'linear']);
  }
  fx(k.pic(card, T, 7, 10), cks);

  // ── the merchant: a flash of anger as it lands, his fist ringing
  fx(k.lightIn('g-gold', FISTP(IM + 80), 18, 18), [[IM, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 90, { transform: 'scale(1)', opacity: 0.45 }, eio], [IM + 500, { transform: 'scale(.6)', opacity: 0 }]]);

  // ── recoil: a few glints shaken from the purse as it swings out, and one more gust off the wings
  for (let i = 0; i < 4; i++) {
    const t0 = 1450 + i * 220, p = PURSE(t0 + 100), sz = 6 + rand() * 4;
    fx(k.pic('glint', p, sz, sz), [[t0, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [t0 + 120, { transform: 'scale(1) rotate(25deg)', opacity: 0.95 }, eio], [t0 + 440, { transform: 'scale(.2) rotate(60deg)', opacity: 0 }]]);
  }
}
