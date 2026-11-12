// Whispered Doubt (a spell, a support: the foe's costly card goes to the bottom of their deck, they draw; you draw).
// The shadow rears back and then stoops to the sleeping king's ear, its eyes burning, violet light swelling in its
// hood and motes drawn in. It lets the whisper go: a bright bead of dream-light runs from the hood, in at his ear
// (the king stirs, head lifting, the crown slipping) and up out of his head, a stream of motes following it to T,
// where it blooms: a ring, glints, and a little card taking shape out of the light (the card you draw). The shadow
// draws back, its fingers drumming on the plans, the king sinks back to sleep; everything is as drawn at 3700.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support (as suggested: the boon is cards), element spirit (as
// suggested: dream-light). T = k.aim, else the dream above his head (`dream`). The whisper's track is the picture's
// own wisp (hood -> ear -> up over his head) and then an arc from the top of it to T.
//   0-1000   GATHER: the shadow rears back (sheared about its waist), then stoops in; eyes and hood glow, motes drawn in
//   1000-1200 the wisp in the picture dims; the whisper is let go (RELEASE 1200)
//   1250     at his ear: a flash and ring; the king stirs, the crown slips
//   1200-1900 the bead and its stream run out to T; IMPACT 1900: bloom, ring, glints, the card
//   1900-3000 the card hangs and fades, the shadow draws back, the king sinks, the wisp comes back
//   3000-3700 calm; SETTLE 3700, as drawn.
import { mul, rot, tr, app, curve, kit } from './_fx.js';

export const END = 4200;
export const BEATS = { release: 1200, impact: 1900, settle: 3700 };
export const STILLS = [450, 950, 1250, 1500, 1800, 2100, 2800, 3900];

export const textures = {
  mote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [214 + 41 * c * c, 170 + 76 * c * c, 255, Math.min(1, c * c * 2.4)]; }],
  glint: [48, 48, (x, y) => {
    const u = Math.abs(x - 0.5) * 2, v = Math.abs(y - 0.5) * 2, f = Math.pow(u, 0.5) + Math.pow(v, 0.5), c = Math.max(0, 1 - Math.hypot(u, v) * 1.8);
    return [236 + 19 * c, 214 + 30 * c, 255, Math.min(1, Math.max(Math.max(0, 1 - f * 0.95), c * c) * 1.5)];
  }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const F = kit(k), { drive, arcPath } = F;
  const S = k.spec, HOOD = S.hood, EAR = S.ear, NECK = S.neck, WAIST = S.waist;
  const T = k.aim || S.dream;
  const REL = BEATS.release, IM = BEATS.impact, BACK = BEATS.settle, END_ = BACK + 100;
  const tidy = (l) => l.filter((q, i) => i === 0 || q[0] > l[i - 1][0]);
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.5"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#a878ff" stroke-width="5.5" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#f1e6ff" stroke-width="1.3"/>', 100, 100);
  const card = k.svg('<defs><linearGradient id="c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a3fa8"/><stop offset="1" stop-color="#2a1a5a"/></linearGradient></defs><rect x="1" y="1" width="22" height="32" rx="3" fill="url(#c)" stroke="#f0dca0" stroke-width="1.4"/><circle cx="12" cy="17" r="5.4" fill="none" stroke="#f0dca0" stroke-width="1.1"/><path d="M12,10 V24 M5,17 H19" stroke="#f0dca0" stroke-width=".8"/>', 24, 34);

  // ── the whisper's track: the picture's own wisp up over his head, then an arc to T
  const pts = [[164, 96], [172, 98], [180, 100], [187, 100], [191, 94], [188, 84], [186, 72], [192, 62]];
  const out = arcPath(pts[7], T, 16), track = pts.slice();
  for (let i = 1; i <= 10; i++) track.push(out(i / 10));
  const seg = [0];
  for (let i = 1; i < track.length; i++) seg.push(seg[i - 1] + Math.hypot(track[i][0] - track[i - 1][0], track[i][1] - track[i - 1][1]));
  const total = seg[seg.length - 1];
  const at = (f) => {
    const d = Math.max(0, Math.min(1, f)) * total;
    let i = 1; while (i < seg.length - 1 && seg[i] < d) i++;
    const g = (d - seg[i - 1]) / ((seg[i] - seg[i - 1]) || 1);
    return [track[i - 1][0] + (track[i][0] - track[i - 1][0]) * g, track[i - 1][1] + (track[i][1] - track[i - 1][1]) * g];
  };
  const earF = seg[3] / total + 0.02; // (the bead is at his ear here)

  // ── the poses over time
  const lean = curve([[0, 0], [450, 1.6], [1000, -5.2, 'out'], [1500, -5.6], [2200, -3.2], [2900, -0.8], [3400, 0], [BACK, 0]]); // shear, degrees: negative leans toward the king
  const nod = curve([[0, 0], [380, 2.2], [900, -0.6], [1240, -1], [1380, -8.5, 'out'], [1700, -7.5], [2100, -2], [2600, 2.4], [3000, 0.8], [3400, 0], [BACK, 0]]);
  const slip = curve([[0, 0], [1300, 0], [1480, 17, 'out'], [1700, 4], [1960, 11], [2400, 5], [3000, 1.5], [3500, 0], [BACK, 0]]);
  const Wl = (t) => [1, 0, -Math.tan((lean(t) * Math.PI) / 180), 1, Math.tan((lean(t) * Math.PI) / 180) * WAIST[1], 0]; // x' = x + t (y - waist)
  const Wh = (t) => rot(nod(t), NECK[0], NECK[1]);
  const Wc = (t) => mul(Wh(t), rot(slip(t), 202, 95));
  drive(k.part('torso'), WAIST, (t) => { const a = Math.tan((lean(t) * Math.PI) / 180); return [1, 0, a, 1, -a * WAIST[1], 0]; }, END_);
  drive(k.part('eyes'), WAIST, (t) => { const a = Math.tan((lean(t) * Math.PI) / 180); return [1, 0, a, 1, -a * WAIST[1], 0]; }, END_);
  drive(k.part('head'), NECK, Wh, END_);
  drive(k.part('crown'), [202, 95], Wc, END_);
  drive(k.part('twink'), [208, 83], Wc, END_, 50, (t) => (t >= BACK ? 1 : 0.55 + 0.45 * Math.abs(Math.sin(t / 330))) * (t > 1400 && t < 2300 ? 0.5 : 1));
  // its fingers drum on the plans once it has let the whisper go
  const hk = [[0, { transform: 'none' }, 'ease-out']];
  for (let i = 0; i < 5; i++) { const t = 1500 + i * 190; hk.push([t, { transform: `translate(0px, ${(1.3 * u).toFixed(1)}px)` }, 'ease-out'], [t + 90, { transform: 'none' }, eio]); }
  act(k.part('hand'), hk);
  // the whisper in the picture dims while the bead runs, and comes back
  act(k.part('wisp'), [[0, { opacity: 1 }, eio], [500, { opacity: 0.8 }, eio], [1000, { opacity: 1 }, eio], [REL, { opacity: 0.3 }, eio], [2200, { opacity: 0.3 }, eio], [3000, { opacity: 0.85 }, eio], [BACK - 100, { opacity: 1 }]]);
  // the candle flickers all the time
  const fk = [[0, { transform: 'none' }, eio]];
  for (let t = 200, i = 0; t < BACK - 150; t += 150 + rand() * 90, i++) { const sg = i % 2 ? 1 : -1; fk.push([t, { transform: `scale(${(1 - sg * 0.08).toFixed(2)}, ${(1 + sg * 0.14 + rand() * 0.08).toFixed(2)}) skewX(${(sg * (2 + rand() * 4)).toFixed(1)}deg)` }, eio]); }
  fk.push([BACK, { transform: 'none' }]);
  act(k.part('flame'), fk);

  // ── GATHER: its eyes burn, light swells in the hood, motes are drawn in from the dark
  const E1 = [165, 91];
  fx(k.lightIn('g-violet', E1, 30, 22), tidy([[350, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(1)', opacity: 0.8 }, 'ease-in'], [REL, { transform: 'scale(1.4)', opacity: 1 }, eio], [1600, { transform: 'scale(1)', opacity: 0.5 }, eio], [2400, { transform: 'scale(.7)', opacity: 0.15 }, eio], [3000, { transform: 'scale(.5)', opacity: 0 }]]));
  for (let i = 0; i < 10; i++) {
    const a = rand() * Math.PI * 2, r0 = 20 + rand() * 24, X = HOOD[0] + Math.cos(a) * r0, Y = HOOD[1] + Math.sin(a) * r0 * 0.7 - 4, t0 = 150 + i * 80, sz = 3 + rand() * 3;
    fx(k.picIn('mote', [X, Y], sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 140, { transform: 'scale(1)', opacity: 0.9 }, 'ease-in'], [t0 + 700, { transform: `${k.T(HOOD[0] - X, HOOD[1] - Y)} scale(.4)`, opacity: 0 }]]);
  }

  // ── the whisper let go (RELEASE): a bead of light and a stream of motes along the track to T
  const lead = [], pos0 = at(0);
  for (let j = 0; j <= 16; j++) {
    const f = j / 16, e = f * f * 0.35 + f * 0.65, p = at(e), t = REL + (IM - REL) * f;
    lead.push([t, { transform: `${k.T(p[0] - pos0[0], p[1] - pos0[1])} scale(${(0.7 + 0.5 * Math.sin(f * Math.PI)).toFixed(2)})`, opacity: j === 0 ? 0 : j === 16 ? 0 : 1 }, 'linear']);
  }
  fx(k.pic('mote', pos0, 13, 13), lead);
  fx(k.light('g-violet', pos0, 34), lead.map(([t, kf]) => [t, { ...kf, opacity: kf.opacity * 0.9 }, 'linear']));
  for (let i = 0; i < 16; i++) {
    const t0 = REL + 40 + i * 48, D = 520 + rand() * 160, sz = 3 + rand() * 3.4, off = (rand() - 0.5) * 8, ks = [];
    for (let j = 0; j <= 9; j++) {
      const f = j / 9, e = f * f * 0.35 + f * 0.65, p = at(e);
      ks.push([t0 + D * f, { transform: `${k.T(p[0] - pos0[0] + off * Math.sin(f * Math.PI), p[1] - pos0[1] + off * 0.6 * Math.sin(f * Math.PI))} scale(${(f < 0.1 ? 0.4 : 1.1 - 0.5 * f).toFixed(2)})`, opacity: j === 0 || j === 9 ? 0 : 0.9 }, 'linear']);
    }
    fx(k.pic(i % 4 === 3 ? 'glint' : 'mote', pos0, i % 4 === 3 ? sz * 2 : sz, i % 4 === 3 ? sz * 2 : sz), ks);
  }
  // at his ear: a flash and a ring as the whisper goes in; the king stirs
  const EP = at(earF);
  fx(k.lightIn('g-violet', EAR, 36, 36), [[REL + 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1330, { transform: 'scale(1.2)', opacity: 1 }, eio], [1600, { transform: 'scale(1)', opacity: 0.55 }, eio], [2100, { transform: 'scale(.7)', opacity: 0 }]]);
  fx(k.picIn(ring, EP, 34, 34), [[1300, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [1360, { transform: 'scale(.5)', opacity: 0.9 }], [1900, { transform: 'scale(1.3)', opacity: 0 }]]);

  // ── IMPACT at T: the dream blooms: light, rings, glints, motes rising, and the card taking shape out of it
  fx(k.light('g-violet', T, 56), tidy([[IM - 60, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(1.2)', opacity: 1 }, eio], [IM + 400, { transform: 'scale(.95)', opacity: 0.65 }, eio], [IM + 900, { transform: 'scale(1)', opacity: 0.45 }, eio], [IM + 1400, { transform: 'scale(.6)', opacity: 0 }]]));
  for (let i = 0; i < 2; i++) { const t0 = IM + i * 150; fx(k.pic(ring, T, 46, 46), [[t0, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [t0 + 70, { transform: 'scale(.4)', opacity: 0.9 }], [t0 + 650, { transform: 'scale(1.3)', opacity: 0 }]]); }
  for (let i = 0; i < 8; i++) {
    const a = rand() * Math.PI * 2, d = 8 + rand() * 20, t0 = IM + i * 50, sz = 8 + rand() * 9;
    fx(k.pic('glint', [T[0] + Math.cos(a) * d, T[1] + Math.sin(a) * d * 0.8], sz, sz), [[t0, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [t0 + 120, { transform: 'scale(1.1) rotate(25deg)', opacity: 1 }, eio], [t0 + 520, { transform: 'scale(.2) rotate(70deg)', opacity: 0 }]]);
  }
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI * (0.1 + rand() * 0.8), sp = 10 + rand() * 24, t0 = IM + rand() * 80, life = 800 + rand() * 600, sz = 3 + rand() * 3;
    fx(k.pic('mote', T, sz, sz), [0, 0.4, 0.75, 1].map((f, j) => [t0 + life * f, { transform: `translate(${(Math.cos(a) * sp * f * u).toFixed(1)}px, ${((Math.sin(a) * sp * f - 14 * f) * u).toFixed(1)}px) scale(${(1 - 0.5 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 0.9 }, j ? 'linear' : 'ease-out']));
  }
  // the card (the one you draw): it takes shape, turning, hangs, and fades
  const ck = [[IM + 40, { transform: 'scale(.1, .1) rotate(-20deg)', opacity: 0 }, 'ease-out'], [IM + 260, { transform: `${k.T(0, -3)} scale(.2, 1.1) rotate(-8deg)`, opacity: 1 }, 'ease-out'], [IM + 480, { transform: `${k.T(0, -6)} scale(1, 1.1) rotate(0deg)`, opacity: 1 }, eio]];
  for (let t = IM + 700, i = 0; t < IM + 1300; t += 220, i++) ck.push([t, { transform: `${k.T(0, i % 2 ? -7 : -5)} scale(1, 1.1) rotate(${i % 2 ? -2 : 2}deg)`, opacity: 1 }, eio]);
  ck.push([IM + 1550, { transform: `${k.T(0, -10)} scale(.9, 1) rotate(0deg)`, opacity: 0 }]);
  fx(k.pic(card, T, 12, 17), ck);

  // ── the candle leans toward the light; and the shadow's eyes flare as it lets go
  fx(k.lightIn('g-violet', [279.5, 146], 30, 30), [[REL, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [IM, { transform: 'scale(1)', opacity: 0.6 }, eio], [IM + 800, { transform: 'scale(.7)', opacity: 0 }]]);
}
