// Carrion Wyrm (a creature, an attacker: Soar, Venom). The skeletal wyrm circling low over the battlefield
// banks round to face its target (rolling over if T is behind it), sweeps its torn wings up and back and rears
// its neck, the violet light in its ribs swelling and the jaw yawning, then a hard downbeat flings it forward
// and it spits a volley of bone shards, each trailing violet light, that streak to T and stick: sparks, splinters,
// a ring and a cold flash where they land. It glides on, wings beating slower and slower, tail trailing, the
// light dying down in its ribs, and comes round to rest exactly as drawn.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker (as suggested), element bone (as suggested: the
// attack is its own bone, flung as shards). T = k.aim, else the battlefield below its jaws (`ground`). Facing left:
// if T is on its right, the whole wyrm rolls over (scaleX through a sliver, as Ashmaw turns its head) and aims from
// the mirrored frame. Everything that flies or lands is on the overlay (k.pic, k.light). The parts ride one
// chain: body (bank, bob), neck on it, skull on the neck, jaw on the skull; wings, tail, legs, ribs on the body.
//   0-800    GATHER: wings sweep up and back, the body sinks, the neck rears, the jaw opens; light swells in the ribs.
//   800-1020 DOWNBEAT: wings sweep down, the body surges, the neck whips to T; RELEASE 1000, the shards leave the jaws.
//   1350     IMPACT: the first shard lands at T; the rest follow in a volley: sparks, splinters, ring, flash.
//   1400-3200 it glides on: slower wing-beats, tail trailing, the light in its ribs dying down.
//   3200-3900 it comes round; SETTLE 3900, as drawn.
import { mul, rot, tr, scl, app, curve, kit } from './_fx.js';

export const END = 4400;
export const BEATS = { release: 1000, impact: 1350, settle: 3900 };
export const STILLS = [450, 850, 1050, 1250, 1450, 1900, 2800, 4100];

export const textures = {
  mote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [214 + 40 * c, 188 + 60 * c, 255, Math.min(1, c * c * 2.4)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const F = kit(k), { drive, ride } = F;
  const S = k.spec, E = S.emit, NK = S.neck, HD = S.head, HG = S.hinge, SL = S.shoulderL, SR = S.shoulderR, BP = S.body, TL = S.tail, EYE = S.eye, HEART = S.heart;
  const T = k.aim || S.ground;
  const REL = BEATS.release, IM = BEATS.impact, BACK = BEATS.settle, END_ = BACK + 100;
  const tidy = (l) => l.filter((q, i) => i === 0 || q[0] > l[i - 1][0]);
  const deg = (r) => (r * 180) / Math.PI, nrm = (a) => ((a + 540) % 360) - 180, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  k.css('.g-bone { border-radius: 50%; background: radial-gradient(circle, rgba(250, 246, 255, .95), rgba(204, 176, 255, .6) 30%, rgba(150, 100, 255, .2) 55%, rgba(120, 70, 255, 0) 70%); }');

  // ── which way it faces: left as drawn; rolled over to face right if T is on its right
  const flipped = T[0] > BP[0] + 25;
  const Tl = flipped ? [2 * BP[0] - T[0], T[1]] : T; // T as the left-facing wyrm sees it
  const a0 = deg(Math.atan2(E[1] - NK[1], E[0] - NK[0]));
  const dA = clamp(nrm(deg(Math.atan2(Tl[1] - NK[1], Tl[0] - NK[0])) - a0), -50, 50);
  const pitch = clamp(-(Tl[1] - 100) / 11, -7, 7);

  // ── the poses over time (degrees; the left wing up is +, the right mirrors it)
  const wl = curve([[0, 0], [300, 7, 'out'], [800, 25, 'in'], [1020, -36, 'out'], [1250, -6], [1520, 17], [1830, -12], [2150, 10], [2500, -7], [2850, 4], [3250, -2], [BACK, 0]]);
  const bob = (t) => 0.16 * wl(t);
  const tilt = curve([[0, 0], [800, -pitch * 0.35], [1020, pitch, 'out'], [1700, pitch * 0.5], [2700, pitch * 0.15], [3500, 0]]);
  const fl = flipped ? curve([[0, 1], [140, 1], [560, -1], [3000, -1], [3640, 1]]) : () => 1;
  const sgn = (v) => (Math.abs(v) < 0.06 ? (v < 0 ? -0.06 : 0.06) : v);
  const Wb = (t) => mul(scl(sgn(fl(t)), 1, BP[0], BP[1]), mul(tr(0, bob(t)), rot(tilt(t), BP[0], BP[1])));
  const nk = curve([[0, 0], [350, 4], [800, 15 + dA * 0.1, 'out'], [1020, dA * 0.6, 'out'], [1500, dA * 0.45], [2000, dA * 0.2], [2700, 3], [3500, 0]]);
  const hd = curve([[0, 0], [350, 3], [800, 10, 'out'], [1020, dA * 0.4, 'out'], [1500, dA * 0.3], [2000, 0], [2700, 2], [3500, 0]]);
  const ja = curve([[0, 0], [400, -12], [800, -30], [1020, -40, 'out'], [1500, -34], [1750, -12], [2100, 0]]);
  const tl = curve([[0, 0], [800, -9], [1020, 13, 'out'], [1300, -7], [1700, 8], [2100, -5], [2600, 3], [3200, 0]]);
  const Wn = (t) => mul(Wb(t), rot(nk(t), NK[0], NK[1]));
  const Wh = (t) => mul(Wn(t), rot(hd(t), HD[0], HD[1]));
  const Wj = (t) => mul(Wh(t), rot(ja(t), HG[0], HG[1]));
  const WL = (t) => mul(Wb(t), rot(wl(t), SL[0], SL[1]));
  const WR = (t) => mul(Wb(t), rot(-wl(t), SR[0], SR[1]));
  const Wt = (t) => mul(Wb(t), rot(tl(t), TL[0], TL[1]));
  for (const nm of ['trunk', 'ribs', 'legs', 'heart']) drive(k.part(nm), nm === 'trunk' || nm === 'ribs' || nm === 'legs' || nm === 'heart' ? BP : BP, Wb, END_);
  drive(k.part('neck'), NK, Wn, END_);
  drive(k.part('skull'), HD, Wh, END_);
  drive(k.part('eye'), HD, Wh, END_);
  drive(k.part('jaw'), HG, Wj, END_);
  drive(k.part('armL'), SL, WL, END_); drive(k.part('memL'), SL, WL, END_);
  drive(k.part('armR'), SR, WR, END_); drive(k.part('memR'), SR, WR, END_);
  drive(k.part('tail'), TL, Wt, END_);
  const MOUTH = (t) => app(Wh(t), E);

  // ── the light in its ribs swells, the eye flares; the thunder cue in the far sky
  ride(k.lightIn('g-bone', HEART, 72, 56), HEART, Wb, [[100, 0.5, 0], [800, 1.0, 0.6], [REL, 1.25, 0.8], [1300, 1.1, 0.55], [1800, 1, 0.4], [2600, 0.8, 0.2], [3300, 0.6, 0]]);
  ride(k.lightIn('g-bone', EYE, 24, 24), EYE, Wh, [[150, 0.4, 0], [800, 1.2, 0.7], [REL, 1.7, 1], [1500, 1.2, 0.7], [2300, 0.9, 0.35], [3000, 0.5, 0]]);
  fx(k.lightIn('g-bone', [275, 60], 36, 96), tidy([[960, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [1010, { transform: 'scale(1)', opacity: 0.9 }], [1080, { transform: 'scale(1)', opacity: 0.2 }], [1140, { transform: 'scale(1)', opacity: 0.75 }], [1400, { transform: 'scale(1.1)', opacity: 0 }]]));
  fx(k.lightIn('g-bone', [150, 118], 170, 54), tidy([[820, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [1040, { transform: 'scale(1)', opacity: 0.35 }, eio], [1500, { transform: 'scale(1.1)', opacity: 0.15 }, eio], [2100, { transform: 'scale(1.2)', opacity: 0 }]]));
  // souls and motes drawn up from the battlefield into the ribs
  for (let i = 0; i < 14; i++) {
    const X = 60 + rand() * 190, Y = 150 + rand() * 30, t0 = 100 + i * 48 + rand() * 30, D = 560 + rand() * 120, sz = 2.6 + rand() * 3, ks = [];
    const Hh = app(Wb(t0 + D), HEART), ddx = Hh[0] - X, ddy = Hh[1] - Y, dl = Math.hypot(ddx, ddy) || 1, sd = (i % 2 ? 1 : -1) * (6 + rand() * 10);
    for (let j = 0; j <= 7; j++) {
      const f = j / 7, e = f * f * 0.6 + f * 0.4, sw = Math.sin(e * Math.PI) * sd;
      ks.push([t0 + f * D, { transform: `${k.T(ddx * e - (ddy / dl) * sw, ddy * e + (ddx / dl) * sw)} scale(${(f < 0.1 ? 0.5 : 1.15 - 0.55 * f).toFixed(2)})`, opacity: j === 0 || j === 7 ? 0 : 0.9 }, 'linear']);
    }
    fx(k.pic('mote', [X, Y], sz, sz), ks);
  }

  // ── the volley (RELEASE to IMPACT and on): bone shards spat from the jaws, streaking to T
  const shard = k.svg('<defs><linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#8a5cf0"/><stop offset=".5" stop-color="#d9c2ff"/><stop offset="1" stop-color="#ffffff"/></linearGradient><filter id="b" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="1"/></filter></defs><path d="M0,3L11,.6L16,3L11,5.4Z" fill="#9b6bff" filter="url(#b)" opacity=".9"/><path d="M1,3L11,1L15.5,3L11,5Z" fill="url(#s)"/>', 16, 6);
  const JA = MOUTH(REL), NS = 9;
  for (let i = 0; i < NS; i++) {
    const lag = i * 42 + rand() * 16, spread = (rand() - 0.5) * 10, T2 = [T[0] + (rand() - 0.5) * 12, T[1] + spread * 0.5];
    const dx = T2[0] - JA[0], dy = T2[1] - JA[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, ang = deg(Math.atan2(dy, dx)), bend = (rand() - 0.5) * 8;
    const t0 = REL + lag, t1 = IM + lag * 0.7, ks = [];
    for (let j = 0; j <= 6; j++) {
      const f = j / 6, e = f * f * 0.5 + f * 0.5, sw = Math.sin(f * Math.PI) * bend;
      ks.push([t0 + (t1 - t0) * f, { transform: `${k.T(dx * e + nx * sw, dy * e + ny * sw)} rotate(${(ang + bend * (1 - f) * 2).toFixed(1)}deg) scale(${(0.55 + 0.55 * f).toFixed(2)})`, opacity: j === 0 ? 0 : 1 }, 'linear']);
    }
    // stuck for a moment, then fading
    ks.push([t1 + 60, { transform: `${k.T(dx, dy)} rotate(${(ang + 4).toFixed(1)}deg) scale(1.1)`, opacity: 1 }, 'linear'], [t1 + 520, { transform: `${k.T(dx, dy + 1.5)} rotate(${(ang + 6).toFixed(1)}deg) scale(1.05)`, opacity: 0.7 }], [t1 + 900, { transform: `${k.T(dx, dy + 3)} rotate(${(ang + 8).toFixed(1)}deg) scale(1)`, opacity: 0 }]);
    fx(k.pic(shard, JA, 17, 6.4), ks);
    // a trail of violet light behind it
    for (let j = 0; j < 2; j++) {
      const f0 = 0.15 + j * 0.3, e = f0 * f0 * 0.5 + f0 * 0.5, tt = t0 + (t1 - t0) * f0, sz = 3 + rand() * 2.4;
      fx(k.pic('mote', JA, sz, sz), [[tt, { transform: `${k.T(dx * e, dy * e)} scale(.5)`, opacity: 0 }, 'ease-out'], [tt + 70, { transform: `${k.T(dx * e, dy * e)} scale(1)`, opacity: 0.9 }, 'linear'], [tt + 460, { transform: `${k.T(dx * e + (rand() - 0.5) * 6, dy * e + 5 + rand() * 6)} scale(.3)`, opacity: 0 }]]);
    }
    // where it lands: a few sparks and a splinter
    for (let j = 0; j < 3; j++) {
      const a = -Math.PI * (0.05 + rand() * 0.9), sp = 8 + rand() * 18, tt = t1 - 20 + rand() * 40, life = 330 + rand() * 280, sz = 2.2 + rand() * 2.8;
      const px = (f) => dx + Math.cos(a) * sp * f, py = (f) => dy + Math.sin(a) * sp * f + 24 * f * f;
      fx(k.pic('mote', JA, sz, sz), [0, 0.35, 0.7, 1].map((f, q) => [tt + life * f, { transform: `${k.T(px(f), py(f))} scale(${(1 - 0.7 * f).toFixed(2)})`, opacity: q === 0 || q === 3 ? 0 : 0.95 }, q ? 'linear' : 'ease-out']));
    }
  }

  // ── the first blow at T (IMPACT): a cold flash, rings, a settling shadow
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#9b6bff" stroke-width="6" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#efe4ff" stroke-width="1.4"/>', 100, 100);
  fx(k.light('g-bone', T, 50), tidy([[IM - 50, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(1.25)', opacity: 1 }, eio], [IM + 330, { transform: 'scale(1)', opacity: 0.7 }, eio], [IM + 800, { transform: 'scale(.9)', opacity: 0.4 }, eio], [IM + 1300, { transform: 'scale(.6)', opacity: 0 }]]));
  fx(k.pic('gloom', T, 44, 38, { lit: false, low: true }), tidy([[IM - 60, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 300, { transform: 'scale(1)', opacity: 0.75 }, eio], [IM + 1400, { transform: 'scale(1.25) rotate(25deg)', opacity: 0 }]]));
  for (let i = 0; i < 3; i++) { const t0 = IM + i * 130; fx(k.pic(ring, T, 36, 36), [[t0, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [t0 + 70, { transform: 'scale(.5)', opacity: 0.9 }], [t0 + 700, { transform: 'scale(1.6)', opacity: 0 }]]); }
  // bone splinters thrown up and falling
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI * (0.1 + rand() * 0.8), sp = 14 + rand() * 20, tt = IM + 20 + rand() * 120, life = 520 + rand() * 260, r0 = Math.round(rand() * 360);
    const px = (f) => Math.cos(a) * sp * f, py = (f) => Math.sin(a) * sp * f + 34 * f * f;
    fx(k.pic(shard, T, 6, 2.4), [0, 0.35, 0.7, 1].map((f, q) => [tt + life * f, { transform: `${k.T(px(f), py(f))} rotate(${r0 + Math.round(f * 280)}deg) scale(${(1 - 0.5 * f).toFixed(2)})`, opacity: q === 0 || q === 3 ? 0 : 1 }, q ? 'linear' : 'ease-out']));
  }
}
