// Grave Rat (a creature, an attacker with Venom: a scrawny rat digging at an old grave by moonlight).
// It digs, forelegs scrabbling and clods flying, bones on the spoil heap clattering; then it freezes,
// rears its nose, tail curling, its violet eye swelling; and it springs at T (round through a sliver
// if T is behind it), snapping, and flings a spray of bone splinters and violet venom at T, which
// break over it in dust, splinters and glowing droplets. It shakes its head, backs off and goes
// back to its digging posture, the venom fading.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker, element bone (the suggestion: the
// picture is bones and a grave; the venom is the violet that rides on them).
//   0-720     DIGGING (the anticipation: it is busy): head nods into the hole, forelegs scrabble, clods
//             fly back over its shoulder, the heap's bones clatter, dust rises.
//   720-1150  FREEZE AND REAR: it stops, the body rears about its hind foot (nose up), the head lifts,
//             forelegs curl, the tail curls up; the eye swells, venom glints at its jaws; (it turns to T).
//   1250      RELEASE: it springs at T and bites: the splinters and venom leave the jaw on arcs.
//   1600      IMPACT at T: flash, ring, dust, splinters thrown out and falling, venom droplets glowing.
//   1600-3400 it shakes its head, backs off, relaxes into the dig posture; the venom fades. At rest 3400.
// BEATS: release 1250, impact 1600, settle 3400.
import { mul, rot, scl, tr, app, curve, kit } from './_fx.js';
export const END = 4000;
export const BEATS = { release: 1250, impact: 1600, settle: 3400 };
export const STILLS = [350, 900, 1150, 1260, 1450, 1700, 2300, 3500];

export const textures = {
  dirt: [12, 12, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [58, 46, 78, Math.min(1, c * 3)]; }],
  vio: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [200, 160, 255, Math.min(1, c * c * 3)]; }],
  orb: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [214 + 41 * c, 170 + 80 * c * c, 255, Math.min(1, c * c * 2.4)]; }],
  dust: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [170, 154, 200, c * c * 0.6]; }],
};

export function build(k) {
  const { fx, u, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const S = k.spec, EM = S.emit, NK = S.neck, HIP = S.hip, SH = S.shoulder, EYE = S.eye, DIG = S.dig, TR = S.tailRoot, BN = S.bones;
  const P = (n) => k.part(n);
  const body = P('body'), head = P('head'), fore = P('forelegs'), hind = P('hind'), tail = P('tail'), ribs = P('ribs'), eye = P('eye'), bone = P('bone');
  const T = k.aim || [44, 168];
  const REL = 1250, IM = 1600, BACK = 3400, END_ = 4000;
  const CX = 192, right = T[0] > CX + 6, dirx = right ? 1 : -1;
  k.css('.g-venom { border-radius: 50%; background: radial-gradient(circle, rgba(244,234,255,.9), rgba(180,128,255,.55) 30%, rgba(120,70,220,.22) 55%, rgba(90,40,200,0) 72%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#b79cf0" stroke-width="5" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#e4d8ff" stroke-width="1.4"/>', 100, 100);
  const shard = k.svg('<path d="M1,3 L4,1.2 L12,2.2 L15,0.8 L15.6,2.6 L14,3.4 L15.4,5 L13,5.2 L4,4.6 L1.6,5.6Z" fill="#d9d0ea"/>', 16, 6);

  // ── the whole rat's world affine: turns round to T (through a sliver), rears about its hind foot, springs
  const sx = right ? curve([[0, 1], [760, 1], [860, 0.06], [960, -1], [2350, -1], [2500, 0.06], [2650, 1]]) : () => 1;
  const tilt = (t) => curve([[0, 0], [720, 0], [1000, 12, 'out'], [1130, 12], [1230, -6, 'out'], [1500, -4], [2300, 0], [END_, 0]])(t) + (t < 720 ? 1.1 * Math.sin(t / 90) : 0);
  const lunge = curve([[0, 0], [1000, 0], [1130, 4], [1300, -18, 'out'], [1520, -18], [2400, 0, 'in'], [END_, 0]]); // along its facing (left)
  const W = (t) => mul(tr(lunge(t) * (right ? -1 : 1), 0), mul(scl(sx(t), 1, CX, 0), rot(tilt(t), HIP[0], HIP[1])));
  // local motions (about each joint, drawn before the world affine)
  const nod = (t) => curve([[0, 0], [720, 0], [1000, 14], [1130, 14], [1220, -18, 'out'], [1380, -6], [2300, 0], [END_, 0]])(t) + (t < 720 ? -7 * Math.sin(t / 95 + 1.2) - 3 : 0) * curve([[0, 0], [90, 1], [640, 1], [720, 0]])(t)
    + (t > 1500 && t < 2300 ? 6 * Math.sin((t - 1500) / 55) * curve([[1500, 1], [2300, 0]])(t) : 0);
  const legs = (t) => curve([[0, 0], [720, 0], [1000, 30], [1130, 30], [1230, -24, 'out'], [1450, -6], [2300, 0], [END_, 0]])(t) + (t < 720 ? 17 * Math.sin(t / 80) * curve([[0, 0], [90, 1], [640, 1], [720, 0]])(t) : 0);
  const tl = (t) => curve([[0, 0], [720, 0], [1000, 16], [1130, 20], [1230, -20, 'out'], [1500, 6], [1900, -8], [2300, 4], [2800, 0], [END_, 0]])(t) + (t < 720 ? 4 * Math.sin(t / 130) : 0);
  const hn = (t) => curve([[0, 0], [720, 0], [1000, -3], [1230, 3], [2000, 0], [END_, 0]])(t);
  const headL = (t) => rot(nod(t), NK[0], NK[1]);
  const headW = (t) => mul(W(t), headL(t));
  const mk = (pv, f) => (t) => mul(W(t), rot(f(t), pv[0], pv[1]));
  h.drive(body, HIP, (t) => W(t), 3500, 40);
  h.drive(ribs, HIP, (t) => W(t), 3500, 40);
  h.drive(head, NK, headW, 3500, 40);
  h.drive(eye, NK, headW, 3500, 40);
  h.drive(fore, SH, mk(SH, legs), 3500, 40);
  h.drive(hind, [224, 152], mk([224, 152], hn), 3500, 40);
  h.drive(tail, TR, mk(TR, tl), 3500, 40);

  // ── the bones on the heap clatter as it digs (and are shaken by its lunge)
  const hop = [[0, { transform: 'none' }, 'ease-out']];
  for (const [t, dy, r] of [[130, -5, 14], [260, 0, 0], [380, -4, -18], [500, 0, -4], [620, -3.5, 12], [740, 0, 2], [1260, -2, 6], [1340, 0, 0]]) hop.push([t, { transform: `${k.T(0, dy)} rotate(${r}deg)` }, dy ? 'ease-out' : 'ease-in']);
  hop.push([END_ - 500, { transform: 'none' }]);
  k.act(bone, hop);

  // ── clods flung back over its shoulder as it digs; dust rising from the hole
  for (let i = 0; i < 13; i++) {
    const t0 = 80 + i * 48 + rand() * 30, v = 14 + rand() * 24, a = -Math.PI * (0.45 + rand() * 0.3) + (rand() - 0.5) * 0.3, life = 520 + rand() * 260, sz = 2.6 + rand() * 2.4;
    const px = (f) => -Math.cos(a) * v * f, py = (f) => Math.sin(a) * v * f + 46 * f * f;
    fx(k.picIn('dirt', [DIG[0] + 6 + rand() * 4, DIG[1] - 4], sz, sz, { lit: false }), [0, 0.3, 0.65, 1].map((f, j) => [Math.round(t0 + life * f), { transform: `${k.T(px(f), py(f))} scale(${(1 - 0.2 * f).toFixed(2)})`, opacity: j === 0 ? 0 : j === 3 ? 0 : 0.95 }, j ? 'linear' : 'ease-out']));
  }
  for (let i = 0; i < 4; i++) {
    const t = 200 + i * 160, r = Math.round(rand() * 360);
    fx(k.picIn('dust', [DIG[0] + 4 + rand() * 12, DIG[1] - 2], 22, 22, { lit: false }), [[t, { transform: `rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 280, { transform: `${k.T(-1, -9)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 1100, { transform: `${k.T(-5, -30)} rotate(${r + 50}deg) scale(1.9)`, opacity: 0 }]]);
  }

  // ── its eye: dim as it digs, swelling as it freezes, blazing at the bite, dying down; venom glints at its jaws
  const eyeL = [[300, 0.8, 0.0], [800, 1.0, 0.35], [1000, 1.7, 0.85], [1150, 1.9, 0.95], [REL + 60, 2.6, 1], [1600, 2, 0.8], [2400, 1.2, 0.45], [3200, 0.8, 0]];
  h.ride(k.lightIn('g-venom', EYE, 24, 20), EYE, headW, eyeL);
  h.ride(k.lightIn('g-venom', EM, 18, 18), EM, headW, [[900, 0.5, 0], [1100, 1.1, 0.7], [REL, 1.3, 0.9], [REL + 80, 2.4, 1], [1500, 1.5, 0.7], [2000, 0.8, 0]]);
  // venom dripping from its jaws as it rears
  for (let i = 0; i < 4; i++) {
    const t0 = 1000 + i * 70, sz = 2 + rand() * 1.5, ex = (rand() - 0.5) * 3;
    fx(k.picIn('vio', [EM[0] + 2 + ex, EM[1] - 2], sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 100, { transform: 'scale(1)', opacity: 0.95 }, 'ease-out'], [t0 + 420, { transform: `${k.T(ex, 12 + rand() * 4)} scale(.7)`, opacity: 0 }, 'ease-in']]);
  }

  // ── the bite and what it flings: splinters and venom leave the jaw along arcs to T
  const E = app(headW(REL), EM); // where the jaw is at the release
  for (let i = 0; i < 9; i++) {
    const t0 = REL + 10 + i * 26, tg = [T[0] + (rand() - 0.5) * 10, T[1] + (rand() - 0.5) * 8], bz = h.arcPath(E, tg, 20 + rand() * 16);
    h.fly(k.pic(shard, E, 10, 3.75), E, bz, t0, t0 + 330 + rand() * 40, (f) => 1 - f * 0.25, (f) => (f < 0.08 ? f * 12 : f > 0.92 ? Math.max(0, (1 - f) / 0.08) : 0.95), Math.round(rand() * 360), 520 + rand() * 240, 40, (f) => f * f * 0.45 + f * 0.55);
  }
  for (let i = 0; i < 9; i++) {
    const t0 = REL + 20 + i * 28, tg = [T[0] + (rand() - 0.5) * 8, T[1] + (rand() - 0.5) * 6], dur = 320 + rand() * 40, bz = h.arcPath(E, tg, 14 + rand() * 14);
    h.fly(k.pic(i % 3 ? 'vio' : 'orb', E, i % 3 ? 5 : 8, i % 3 ? 5 : 8), E, bz, t0, t0 + dur, (f) => 1 - f * 0.3, (f) => (f < 0.08 ? f * 12 : f > 0.9 ? Math.max(0, (1 - f) / 0.1) : 0.95), 0, 0, 40, (f) => f * f * 0.45 + f * 0.55);
  }
  // a little burst at the jaws when it snaps
  fx(k.light('g-venom', E, 30), [[REL + 30, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [REL + 110, { transform: 'scale(1.2)', opacity: 0.95 }, 'ease-out'], [REL + 380, { transform: 'scale(1.5)', opacity: 0 }]]);
  // dust from the springing feet
  const FT = [dirx < 0 ? 200 : 184, 182];
  for (let i = 0; i < 3; i++) {
    const t = REL + 40 + i * 60, r = Math.round(rand() * 360);
    fx(k.picIn('dust', [FT[0] + (rand() - 0.5) * 10, FT[1]], 22, 22, { lit: false }), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 200, { transform: `${k.T(-dirx * 6, -3)} rotate(${r + 20}deg) scale(1)`, opacity: 0.55 }], [t + 800, { transform: `${k.T(-dirx * 14, -9)} rotate(${r + 40}deg) scale(1.7)`, opacity: 0 }]]);
  }

  // ── where it lands (BEATS.impact): flash, ring, dust, splinters thrown out and falling, venom glowing
  const flash = [[IM - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [IM + 250, { transform: 'scale(1.25)', opacity: 0.65 }]];
  for (let t = IM + 380, i = 0; t < IM + 900; t += 120, i++) flash.push([t, { transform: `scale(${i % 2 ? 1.15 : 0.98})`, opacity: i % 2 ? 0.5 : 0.35 }, eio]);
  flash.push([IM + 1500, { transform: 'scale(.8)', opacity: 0 }]);
  fx(k.light('g-venom', T, 48), flash);
  fx(k.light('g-venom', T, 18), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 30, { transform: 'scale(1.6)', opacity: 1 }], [IM + 170, { transform: 'scale(2.6)', opacity: 0 }]]);
  for (const [d, w, o] of [[0, 50, 0.95], [100, 34, 0.65]]) fx(k.pic(ring, T, w, w), [[IM + d - 1, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + d + 50, { transform: 'scale(.4)', opacity: o }, 'ease-out'], [IM + d + 480, { transform: 'scale(1.1)', opacity: 0 }]]);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + rand() * 0.5, d = 10 + rand() * 12, r = Math.round(rand() * 360), t = IM + rand() * 30, dx = Math.cos(a) * d, dy = Math.sin(a) * d * 0.7 - 2;
    fx(k.pic('dust', T, 18, 18, { lit: false }), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 90, { transform: `${k.T(dx * 0.5, dy * 0.5)} rotate(${r + 30}deg) scale(1)`, opacity: 0.8 }, 'ease-out'], [t + 400, { transform: `${k.T(dx, dy - 3)} rotate(${r + 60}deg) scale(1.5)`, opacity: 0.5 }], [t + 900, { transform: `${k.T(dx * 1.1, dy - 10)} rotate(${r + 90}deg) scale(2)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI * (0.1 + rand() * 0.8), v = 14 + rand() * 26, t = IM + rand() * 40, life = 450 + rand() * 330, r = Math.round(rand() * 360), px = (f) => Math.cos(a) * v * f, py = (f) => Math.sin(a) * v * f + 40 * f * f;
    fx(k.pic(shard, T, 8, 3), [0, 0.3, 0.65, 1].map((f, j) => [Math.round(t + life * f), { transform: `${k.T(px(f), py(f))} rotate(${r + f * 300}deg) scale(${(1 - 0.3 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']));
  }
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI * (0.05 + rand() * 0.9), v = 14 + rand() * 30, t = IM + rand() * 40, life = 400 + rand() * 400, sz = 3 + rand() * 3, px = (f) => Math.cos(a) * v * f, py = (f) => Math.sin(a) * v * f + 34 * f * f;
    fx(k.pic(i % 3 ? 'vio' : 'orb', T, sz, sz), [0, 0.3, 0.65, 1].map((f, j) => [Math.round(t + life * f), { transform: `${k.T(px(f), py(f))} scale(${(1 - 0.7 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']));
  }
  // venom lingering where it landed, glowing and thinning
  const ven = [[IM + 60, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 400, { transform: 'scale(1)', opacity: 0.7 }, eio]];
  for (let t = IM + 600, i = 0; t < 2700; t += 220, i++) ven.push([t, { transform: `scale(${i % 2 ? 1.05 : 0.95})`, opacity: i % 2 ? 0.55 : 0.4 }, eio]);
  ven.push([3300, { transform: 'scale(1.1)', opacity: 0 }]);
  fx(k.light('g-venom', [T[0], T[1] + 3], 26), ven);
}
