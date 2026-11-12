// Seedling: it gathers all the growth in it and gives it away.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support, element nature.
//   0-600     curious: it cocks its body away from where its gift will go, its
//             leaf-arms fluttering, the shoot nodding; a mote drifts down.
//   600-1380  GATHER: it crouches into the soil (the lip of earth heaving and
//             trembling, clods hopping), both leaf-arms rising over its head,
//             the shoot straightening and its tip swelling with green-gold light;
//             motes of light drift in from round about to the tip.
//   1380-1450 the wind-up: the throwing arm back, the shoot bowed away.
//   1450      RELEASE: it springs up and flings its arm forward, the shoot whips
//             after it: a seed of light leaves the tip, trailing motes, on an arc to T
//             (k.aim, else the bare soil beside it).
//   1800      IMPACT/bloom at T: a ripple and a green light; a stem shoots up and
//             leaves unfurl round it; gold motes rise (alone it is a sprout in the soil
//             beside it, gone again by 3200).
//   1800-3200 delighted: it hops, lands squashed, hops a little again, the arms
//             flapping, the shoot nodding; the light sinks.
//   3200      at rest as drawn (END 3800).
// BEATS: release 1450, impact 1800, settle 3200.
import { mul, scl, tr, rot, kit } from './_fx.js';

export const END = 3800;
export const BEATS = { release: 1450, impact: 1800, settle: 3200 };
export const STILLS = [300, 1000, 1380, 1500, 1700, 1850, 2250, 3500];

export const textures = {
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226 + 20 * c, 255, 150 + 70 * c * c, Math.min(1, c * c * 2.4)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const sp = k.spec, FEET = sp.feet, SH = sp.shoot, EM = sp.emit, HL = sp.handL, HR = sp.handR;
  const K = kit(k);
  const P = { body: k.part('body'), face: k.part('face'), armL: k.part('armL'), armR: k.part('armR'), sprout: k.part('sprout'), tip: k.part('tip'), lip: k.part('lip') };
  const T = k.aim || [224, 168];
  const d = T[0] >= FEET[0] ? 1 : -1; // which side its gift goes to
  k.css('.g-leaf { border-radius: 50%; background: radial-gradient(circle, rgba(250,255,210,.95), rgba(190,240,110,.55) 30%, rgba(120,200,70,.2) 58%, rgba(100,190,60,0) 72%); }');
  const leaf = k.svg('<defs><linearGradient id="g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#4f9a2a"/><stop offset="1" stop-color="#e4fa9a"/></linearGradient></defs><path d="M20,60C5,44 7,16 20,2C33,16 35,44 20,60Z" fill="url(#g)"/><path d="M20,58L20,12" stroke="#fffbd0" stroke-width="1.4" opacity=".7"/>', 40, 60);
  const stem = k.svg('<path d="M20,100C16,72 24,40 20,6" stroke="#4f8a22" stroke-width="4.5" stroke-linecap="round" fill="none"/><path d="M20,100C16,72 24,40 20,6" stroke="#e8fba0" stroke-width="1.3" stroke-linecap="round" fill="none" opacity=".8"/>', 40, 100);
  const ripple = k.svg('<ellipse cx="50" cy="25" rx="44" ry="18" fill="none" stroke="#f2ffc8" stroke-width="3.5"/>', 100, 50);
  const seed = k.svg('<defs><radialGradient id="s"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#f1ffa8"/><stop offset="1" stop-color="#a8e04c"/></radialGradient></defs><path d="M20,4C8,14 9,32 20,38C31,32 32,14 20,4Z" fill="url(#s)"/>', 40, 40);

  const track = (pts) => (ms) => {
    let i = pts.length - 1;
    while (i > 0 && pts[i][0] > ms) i--;
    if (i === pts.length - 1) return pts[i][1];
    const [t0, v0, e] = pts[i], [t1, v1] = pts[i + 1], f = Math.min(1, Math.max(0, (ms - t0) / (t1 - t0)));
    return v0 + (v1 - v0) * (e === 'out' ? 1 - (1 - f) * (1 - f) : e === 'in' ? f * f : k.smooth(f));
  };
  // ── the body: crouches in the gather, springs at the release, hops twice in delight
  const sy = track([[0, 1], [300, 1.01], [600, 1], [1000, 0.95], [1370, 0.89, 'in'], [1450, 1.13, 'out'], [1600, 1.02], [1850, 0.99], [2000, 1.1, 'out'], [2250, 0.91, 'in'], [2400, 1.03], [2600, 0.99], [2750, 1.05, 'out'], [2950, 0.97, 'in'], [3100, 1.0], [3200, 1]]);
  const sx = track([[0, 1], [1000, 1.03], [1370, 1.07], [1450, 0.92, 'out'], [1600, 1.0], [2000, 0.95], [2250, 1.07, 'in'], [2400, 0.99], [2750, 0.97], [2950, 1.03], [3200, 1]]);
  const lean = track([[0, 0], [250, -4 * d], [600, 1.5 * d], [1370, -4 * d], [1450, 9 * d, 'out'], [1700, 3 * d], [2000, 0], [2400, 1 * d], [2800, -1.5 * d], [3200, 0]]);
  const dy = track([[0, 0], [1450, 0], [1520, -2.2, 'out'], [1650, 0], [2000, 0], [2120, -5, 'out'], [2250, 0, 'in'], [2750, 0], [2850, -2.5, 'out'], [2950, 0, 'in'], [3200, 0]]);
  const Wb = (t) => mul(tr(0, dy(t)), mul(rot(lean(t), FEET[0], FEET[1]), scl(sx(t), sy(t), FEET[0], FEET[1])));
  K.drive(P.body, FEET, Wb, 3200, 40);
  K.drive(P.face, FEET, Wb, 3200, 40);
  // ── the arms (about the shoulders, on top of the body's own motion)
  const thr = d > 0
    ? track([[0, 0], [350, -6], [700, -40], [1100, -85], [1370, -108, 'in'], [1450, -30, 'out'], [1650, -22], [1900, -34], [2300, 4], [2450, -12], [2800, 6], [3200, 0]])
    : track([[0, 0], [350, 5], [700, 20], [1100, 38], [1370, 52, 'in'], [1450, -33, 'out'], [1650, -22], [1900, -32], [2300, 4], [2450, 14], [2800, -6], [3200, 0]]);
  const bal = d > 0
    ? track([[0, 0], [400, 6], [800, 20], [1250, 38], [1380, 44], [1460, 26, 'out'], [1800, 30], [2050, 40], [2250, 22], [2500, 4], [2800, -6], [3200, 0]])
    : track([[0, 0], [400, -6], [800, -30], [1250, -75], [1380, -85], [1460, -50, 'out'], [1800, -55], [2050, -75], [2250, -40], [2500, -6], [2800, 8], [3200, 0]]);
  const aL = d > 0 ? bal : thr, aR = d > 0 ? thr : bal;
  const shL = sp.shoulderL, shR = sp.shoulderR;
  const WL = (t) => mul(Wb(t), rot(aL(t), shL[0], shL[1])), WR = (t) => mul(Wb(t), rot(aR(t), shR[0], shR[1]));
  K.drive(P.armL, shL, WL, 3200, 40);
  K.drive(P.armR, shR, WR, 3200, 40);
  // ── the shoot (about its base): nods, straightens in the gather, bows away at the wind-up, whips at the release
  const sr = track([[0, 0], [300, -5], [600, 4], [1000, 1], [1370, -12 * d], [1450, 17 * d, 'out'], [1600, 4 * d], [1800, -6 * d], [2000, 8 * d], [2250, -9 * d], [2500, 3 * d], [2850, -4 * d], [3200, 0]]);
  const Ws = (t) => mul(Wb(t), rot(sr(t), SH[0], SH[1]));
  K.drive(P.sprout, SH, Ws, 3200, 40);
  K.drive(P.tip, SH, Ws, 3200, 40);
  // ── the lip of soil: heaves and trembles in the gather, jolts at the spring and the landing
  act(P.lip, (() => {
    const ks = [];
    for (let t = 0; t <= 3200; t += 40) {
      const g = t > 600 && t < 1450 ? (t - 600) / 850 : 0, ju = (t > 1450 && t < 1750 ? 1 - (t - 1450) / 300 : 0) + (t > 2230 && t < 2500 ? 1 - (t - 2230) / 270 : 0);
      ks.push([t, { transform: `translate(${(Math.sin(t / 19) * g * 0.5 * u).toFixed(2)}px, ${((-g * 1.4 - ju * 0.8 + Math.sin(t / 13) * g * 0.35) * u).toFixed(2)}px)` }, 'linear']);
    }
    ks[ks.length - 1][1] = { transform: 'none' };
    return ks;
  })());
  // where its tip and hands are at a moment
  const tipAt = (t) => { const [x, y] = K_app(Ws(t), EM); return [x, y]; };
  function K_app(A, [x, y]) { return [A[0] * x + A[2] * y + A[4], A[1] * x + A[3] * y + A[5]]; }

  // ── light: a warm green dawn over the glade, the tip swelling, the gift's light
  fx(k.lightIn('g-heal', [150, 120], 330, 160, { under: true }), [[300, { opacity: 0 }, 'ease-out'], [1400, { opacity: 0.35 }, eio], [2200, { opacity: 0.3 }, eio], [3100, { opacity: 0 }]]);
  const tipLight = [[500, 0.3, 0], [900, 0.8, 0.6], [1250, 1.2, 0.95], [1380, 1.35, 1], [1450, 1.7, 1], [1600, 1.0, 0.55], [2000, 0.6, 0.2], [2500, 0.3, 0.05], [2800, 0.3, 0]];
  K.ride(k.light('g-leaf', EM, 34, 34), EM, Ws, tipLight);
  K.ride(k.light('g-heal', EM, 20, 20), EM, Ws, [[800, 0.3, 0], [1200, 0.9, 0.55], [1450, 1.3, 0.9], [1650, 0.7, 0.2], [1900, 0.4, 0]]);
  // motes drifting in to the tip while it gathers
  for (let i = 0; i < 14; i++) {
    const a = rand() * Math.PI * 2, dist = 22 + rand() * 24, t0 = 560 + i * 55 + rand() * 40, dur = 440 + rand() * 120, sz = 3 + rand() * 2.4;
    const ox = Math.cos(a) * dist, oy = Math.sin(a) * dist * 0.7;
    const p0 = tipAt(t0), p1 = tipAt(t0 + dur);
    fx(k.pic('mote', EM, sz, sz), [[t0, { transform: `${k.T(p0[0] - EM[0] + ox, p0[1] - EM[1] + oy)} scale(.5)`, opacity: 0 }, 'ease-in'], [t0 + 90, { transform: `${k.T(p0[0] - EM[0] + ox * 0.9, p0[1] - EM[1] + oy * 0.9)} scale(1)`, opacity: 1 }, 'ease-in'],
      [t0 + dur, { transform: `${k.T(p1[0] - EM[0], p1[1] - EM[1])} scale(.35)`, opacity: 0.9 }], [t0 + dur + 50, { transform: `${k.T(p1[0] - EM[0], p1[1] - EM[1])} scale(.1)`, opacity: 0 }]]);
  }
  // a mote drifting down, a nod to the one in the picture
  fx(k.picIn('mote', [118, 50], 3.4, 3.4), [[100, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [300, { transform: `${k.T(2, 8)} scale(1)`, opacity: 0.9 }], [650, { transform: `${k.T(6, 22)} scale(.6)`, opacity: 0 }]]);
  // clods hopping off the soil as it crouches, and a puff of earth as it springs
  for (let i = 0; i < 5; i++) {
    const t = 900 + i * 95, x = 126 + i * 11 + (rand() - 0.5) * 4, h = 3 + rand() * 4;
    fx(k.picIn('puffCool', [x, 166], 6, 6, { lit: false }), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 90, { transform: `${k.T(0, -h)} scale(.8)`, opacity: 0.55 }], [t + 260, { transform: `${k.T((i - 2) * 1.5, -h * 0.3)} scale(1)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 6; i++) {
    const t = 1450 + i * 12, a = Math.PI * (1.05 + i * 0.18), r = Math.round(rand() * 360);
    fx(k.picIn('puffCool', [150, 168], 10, 10, { lit: false }), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 90, { transform: `${k.T(Math.cos(a) * 12, Math.sin(a) * 5)} rotate(${r + 20}deg) scale(1)`, opacity: 0.6 }], [t + 360, { transform: `${k.T(Math.cos(a) * 19, Math.sin(a) * 7 - 2)} rotate(${r + 40}deg) scale(1.4)`, opacity: 0 }]]);
  }

  // ── the gift: a seed of light from the tip along an arc to T (RELEASE 1450 - IMPACT 1800)
  const S0 = tipAt(1450), dist = Math.hypot(T[0] - S0[0], T[1] - S0[1]);
  const bz = K.arcPath(S0, T, 14 + dist * 0.2);
  K.fly(k.light('g-leaf', EM, 22), EM, (f) => { const [x, y] = bz(f); return [x - S0[0] + EM[0], y - S0[1] + EM[1]]; }, 1450, 1800, (f) => 0.9 + 0.3 * f, (f) => (f > 0.97 ? 0.4 : 1), 0, 0, 30);
  K.fly(k.pic(seed, EM, 8, 8), EM, (f) => { const [x, y] = bz(f); return [x - S0[0] + EM[0], y - S0[1] + EM[1]]; }, 1450, 1800, (f) => 0.8 + 0.3 * f, (f) => (f > 0.97 ? 0.3 : 1), 0, 300, 30);
  for (let i = 0; i < 9; i++) {
    const f = 0.06 + i * 0.1, t = 1450 + 350 * (-0.45 + Math.sqrt(0.2025 + 1.1 * f)) / 0.55, [x, y] = bz(f), sz = 3 + rand() * 2.2;
    fx(k.pic('mote', [x + (rand() - 0.5) * 3, y + (rand() - 0.5) * 3], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 70, { transform: 'scale(1)', opacity: 1 }], [t + 450, { transform: `${k.T((rand() - 0.5) * 6, 4 + rand() * 4)} scale(.3)`, opacity: 0 }]]);
  }

  // ── IMPACT (1800): a ripple and light at T, a stem shoots up, leaves unfurl, motes rise
  const IM = 1800, GO = 3000;
  const bl = [[IM - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 80, { transform: 'scale(1.2)', opacity: 1 }]];
  for (let t = IM + 220, i = 0; t < 2500; t += 130, i++) bl.push([t, { transform: `scale(${i % 2 ? 1.1 : 0.95})`, opacity: i % 2 ? 0.95 : 0.75 }, eio]);
  bl.push([GO, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.light('g-leaf', [T[0], T[1] - 14], 62), bl);
  fx(k.light('g-leaf', T, 24), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.6)', opacity: 1 }], [IM + 200, { transform: 'scale(2.6)', opacity: 0 }]]);
  for (const [dly, o] of [[0, 1], [110, 0.7]]) fx(k.pic(ripple, T, 56, 28, { lit: false }), [[IM + dly, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + dly + 70, { transform: 'scale(.4)', opacity: o }, 'ease-out'], [IM + dly + 520, { transform: 'scale(1.1)', opacity: 0 }]]);
  // a stem shooting up from T: grows from its base, sways, then withdraws
  const H = 40;
  fx(k.pic(stem, T, 9, H, { base: true, lit: false }), [[IM + 40, { transform: 'scaleY(.05)', opacity: 0 }, 'ease-out'], [IM + 300, { transform: 'scaleY(1.08) skewX(2deg)', opacity: 1 }, 'ease-out'], [IM + 500, { transform: 'scaleY(1) skewX(-2deg)', opacity: 1 }, eio], [2350, { transform: 'scaleY(1) skewX(2deg)', opacity: 1 }, eio], [2700, { transform: 'scaleY(1) skewX(-1deg)', opacity: 1 }, eio], [GO + 100, { transform: 'scaleY(.3) skewX(0deg)', opacity: 0 }]]);
  // leaves unfurling up the stem and round its top
  const lv = [[0.25, -1.05, 11], [0.45, 1.05, 12], [0.7, -0.8, 12], [0.88, 0.75, 13], [1.0, 0, 14]];
  lv.forEach(([f, a, s], i) => {
    const t = IM + 200 + i * 80, x = T[0] + (i === 4 ? 0 : (a < 0 ? -2 : 2)), y = T[1] - H * f * 0.96;
    const end = GO + 100 - i * 20, deg = Math.round((a * 180) / Math.PI);
    fx(k.pic(leaf, [x, y], s * 0.9, s * 1.6, { base: true, lit: false }), [[t, { transform: `rotate(${deg * 0.2}deg) scale(.08)`, opacity: 0 }, 'ease-out'], [t + 220, { transform: `rotate(${deg + (a < 0 ? -8 : 8)}deg) scale(1.12)`, opacity: 1 }, 'ease-out'], [t + 380, { transform: `rotate(${deg}deg) scale(1)`, opacity: 1 }, eio],
      [2780, { transform: `rotate(${deg + (a < 0 ? 6 : -6)}deg) scale(1)`, opacity: 1 }, eio], [2920, { transform: `rotate(${deg}deg) scale(1)`, opacity: 1 }], [end, { transform: `rotate(${deg * 0.3}deg) scale(.2)`, opacity: 0 }]]);
  });
  // gold motes rising from it
  for (let i = 0; i < 12; i++) {
    const t = IM + 120 + i * 85 + rand() * 40, ox = (rand() - 0.5) * 30, sz = 2.6 + rand() * 2.2;
    fx(k.pic('mote', [T[0] + ox, T[1] - 6], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 150, { transform: `${k.T(ox * 0.1, -8)} scale(1)`, opacity: 1 }], [t + 800, { transform: `${k.T(ox * 0.3, -34 - rand() * 12)} scale(.4)`, opacity: 0 }]]);
  }
  // little leaves of light bursting out round it
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI * (0.1 + 0.8 * (i / 5)), v = 18 + rand() * 12, r = Math.round(rand() * 120 - 60);
    fx(k.pic(leaf, T, 5, 7.5, { lit: true }), [[IM, { transform: `rotate(${r}deg) scale(.3)`, opacity: 0 }, 'ease-out'], [IM + 120, { transform: `${k.T(Math.cos(a) * v * 0.5, Math.sin(a) * v * 0.5)} rotate(${r + 40}deg) scale(1)`, opacity: 1 }, 'ease-out'], [IM + 700, { transform: `${k.T(Math.cos(a) * v, Math.sin(a) * v + 8)} rotate(${r + 160}deg) scale(.7)`, opacity: 0 }]]);
  }
  // the seedling's own delight: a soft glow in its leaves as the bloom lands
  fx(k.lightIn('g-leaf', [150, 135], 80, 70), [[IM, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [IM + 200, { transform: 'scale(1.1)', opacity: 0.55 }, eio], [2500, { transform: 'scale(1)', opacity: 0.3 }, eio], [3100, { transform: 'scale(.8)', opacity: 0 }]]);
}
