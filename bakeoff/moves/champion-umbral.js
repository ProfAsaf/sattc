// Morwen, the Gravekeeper: she lifts her spade and drives it into the earth, and the dead answer: the six wisps behind her
// swell with light and send streams of motes flowing to her; then, at every blow, a spirit rises out of the ground at the
// place it lands, takes it with open hands and bursts into lavender light, while she and her spade take the jolt, holds,
// and settles back to lean on her spade as drawn.
//
// PLAN (drawing units 300 x 210, ms of the move). Role defender (as suggested), element spirit.
//   0-700     brace (BEATS.release 700): her spade lifts (200-540) as she straightens, then comes down hard (540-650) into the
//             ground: she bows into it, a ring and cracks of light run out along the ground, dust and motes jump from the
//             blade. As it falls the six wisps swell with light, and motes stream from their heads to her.
//   blow n    (alone: 1500, 1950, 2400; a curse-bolt comes in from the right to a guard point) a spirit stands up out of the
//             ground at that point 400 ms before, takes the bolt on its hands: flash, star, ring, motes and dark shards
//             flying; she and the spade jolt away from it (a damped kick, a lean, a squash), the blade and the wisps flare.
//   after     the spirits dissolve upward, the wisps' light and the blade's glow fade; she's at rest as drawn from 3700
//             (END 4200).
// Aimed: blows are k.blows || the three above; each is snapped to the nearest of spec.guard. When k.blows is given the
// attacker brings its own attack, so no bolt is drawn flying in.
import { mul, rot, scl, tr, curve, kit } from './_fx.js';
export const END = 4200;
export const BEATS = { release: 700, impact: 1500, settle: 3700 };
export const STILLS = [350, 600, 760, 1250, 1500, 1580, 2000, 3900];
export const textures = {
  mote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [232 + 20 * c, 214 + 30 * c, 255, Math.min(1, c * c * c * 2.4)]; }],
  star: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); const ax = Math.abs(x - 0.5) * 2, ay = Math.abs(y - 0.5) * 2, ray = Math.max(0, 1 - Math.min(ax, ay) * 9) * Math.max(0, 1 - Math.max(ax, ay)); return [236 + 18 * c, 222 + 30 * c, 255, Math.min(1, c * c * c * 1.6 + ray * 0.8)]; }],
};

export function build(k) {
  const { fx, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  k.css('.g-wraith { border-radius: 50%; background: radial-gradient(circle, rgba(246,238,255,.95), rgba(190,150,255,.55) 30%, rgba(140,100,230,.2) 55%, rgba(110,70,210,0) 70%); }');
  const S = k.spec, F = S.feet, HIT = S.hit, BL = S.blade, GR = S.grip;
  const clean = (l) => l.sort((a, b) => a[0] - b[0]).filter((e, i, a) => i === 0 || e[0] > a[i - 1][0]);

  // ── the blows, each snapped to the nearest guard point
  const own = [{ at: 1500, to: [164, 140] }, { at: 1950, to: [152, 120] }, { at: 2400, to: [164, 176] }];
  const blows = (k.blows && k.blows.length ? k.blows : own).slice().sort((a, b) => a.at - b.at).map((b) => {
    const G = S.guard.reduce((best, g) => (Math.hypot(g[0] - b.to[0], g[1] - b.to[1]) < Math.hypot(best[0] - b.to[0], best[1] - b.to[1]) ? g : best), S.guard[0]);
    let dx = HIT[0] - G[0], dy = HIT[1] - G[1];
    const l = Math.hypot(dx, dy);
    if (l < 3) { dx = -1; dy = 0.2; } else { dx /= l; dy /= l; }
    return { at: b.at, G, dx, dy };
  });
  const alone = !(k.blows && k.blows.length);
  const last = blows[blows.length - 1].at;
  const holdEnd = Math.max(1100, Math.min(3000, last + 650));

  // ── how she moves
  const lift = curve([[0, 0], [200, 0], [540, 7, 'out'], [575, 7, 'in'], [655, -1.5, 'out'], [780, 0]]); // the spade up, then driven down
  const bow = curve([[0, 0], [200, 0], [540, -1.5], [655, 0.9, 'out'], [holdEnd, 0.9], [3650, 0]]);
  const slam = curve([[0, 0], [590, 0], [655, 0.026, 'out'], [800, 0]]);
  const ring = (t, a, dec, per) => (t < a ? 0 : Math.exp(-(t - a) / dec) * Math.cos(((t - a) * 2 * Math.PI) / per));
  const kick = (t, f) => blows.reduce((s, b) => s + f(b) * ring(t, b.at, 170, 380), 0);
  const WB = (t) => mul(tr(kick(t, (b) => 2.4 * b.dx), kick(t, (b) => 2.4 * b.dy) - 0.35 * lift(t)),
    mul(rot(bow(t) + kick(t, (b) => -1.3 * Math.sign(b.dx || -1)), F[0], F[1]), scl(1 + (slam(t) + kick(t, () => 0.01)) * 0.6, 1 - slam(t) - kick(t, () => 0.01), F[0], F[1])));
  const WS = (t) => mul(WB(t), tr(kick(t, (b) => 2.2 * b.dx), kick(t, (b) => 2.2 * b.dy) - 0.65 * lift(t)));
  h.drive(k.part('body'), F, WB, 3700, 70);
  h.drive(k.part('spade'), GR, WS, 3700, 70);

  // ── the wisps behind her: light swells over each, a pulse at every blow, then they fade
  const flare = (base, pk, on = 120) => {
    const l = [[on, 0.5, 0], [on + 520, 1.0, base], [Math.max(holdEnd, 900), 0.95, base * 0.85]];
    for (const b of blows) l.push([b.at - 30, 1.0, base * 0.9], [b.at + 60, pk, 1], [b.at + 380, 1.0, base * 0.85]);
    l.push([3400, 0.7, 0], [3701, 0.7, 0]);
    return clean(l);
  };
  S.graves.forEach(([x, y], i) => fx(k.lightIn('g-wraith', [x, y + 2], 44, 44), flare(0.55, 1.35, 90 + i * 70).map(([t, s, o]) => [t, { transform: `scale(${s.toFixed(2)})`, opacity: o }, eio])));
  fx(k.lightIn('g-wraith', [136, 168], 230, 90, { under: true }), [[220, { opacity: 0 }, 'ease-out'], [800, { opacity: 0.5 }, eio], [holdEnd, { opacity: 0.4 }, eio], [3400, { opacity: 0 }]]);
  // the blade's glow, riding the spade, and a pulse at her chest at every blow
  h.ride(k.lightIn('g-wraith', BL, 36, 30), BL, WS, clean([[500, 0.4, 0], [655, 1.3, 0.95], [900, 0.9, 0.6], ...blows.flatMap((b) => [[b.at - 20, 0.9, 0.55], [b.at + 60, 1.35, 1], [b.at + 360, 0.9, 0.55]]), [3300, 0.7, 0], [3701, 0.7, 0]]));
  h.ride(k.lightIn('g-wraith', [140, 126], 84, 84), [140, 126], WB, clean([[1000, 0.8, 0], ...blows.flatMap((b) => [[b.at - 20, 0.8, 0], [b.at + 50, 1.1, 0.55], [b.at + 420, 1.25, 0]])]));

  // ── motes streaming from the wisps' heads to her, arcing up and over
  const P = [150, 100];
  S.graves.forEach(([x, y], i) => {
    for (let j = 0; j < 3; j++) {
      const t0 = 160 + i * 70 + j * 150 + rand() * 40, dur = 520 + rand() * 120, c = [(x + P[0]) / 2, Math.min(y, P[1]) - 18 - rand() * 14], r = 2.2 + rand() * 1.6;
      const pt = (f) => { const q = 1 - f; return [q * q * x + 2 * q * f * c[0] + f * f * P[0], q * q * y + 2 * q * f * c[1] + f * f * P[1]]; };
      const kf = [0, 0.3, 0.65, 1].map((f, n) => { const p = pt(f * f * 0.4 + f * 0.6); return [t0 + dur * f, { transform: `${k.T(p[0] - x, p[1] - y)} scale(${(n === 3 ? 0.5 : 1).toFixed(2)})`, opacity: n === 0 ? 0 : n === 3 ? 0 : 0.95 }, 'linear']; });
      fx(k.pic('mote', [x, y], r * 2, r * 2), kf);
    }
  });

  // ── the spade driven into the ground (655 ms): a flat ring, cracks of light, dust, motes jumping
  const flatRing = k.svg('<defs><filter id="b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><ellipse cx="50" cy="15" rx="42" ry="8" fill="none" stroke="#e4d2ff" stroke-width="4" filter="url(#b)"/>', 100, 30);
  fx(k.picIn(flatRing, [BL[0], BL[1] + 1], 90, 27), [[640, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [700, { transform: 'scale(.45)', opacity: 0.95 }, 'ease-out'], [1250, { transform: 'scale(1.3)', opacity: 0 }]]);
  fx(k.picIn(flatRing, [BL[0], BL[1] + 1], 90, 27), [[720, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [790, { transform: 'scale(.4)', opacity: 0.6 }, 'ease-out'], [1300, { transform: 'scale(1.0)', opacity: 0 }]]);
  fx(k.picIn('mote', [BL[0], BL[1] - 2], 50, 40), [[630, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [690, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [1000, { transform: 'scale(1.5)', opacity: 0 }]]);
  fx(k.picIn('star', [BL[0], BL[1] - 2], 26, 26), [[630, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [690, { transform: 'scale(1.2) rotate(25deg)', opacity: 1 }, 'ease-out'], [960, { transform: 'scale(.5) rotate(60deg)', opacity: 0 }]]);
  const crack = k.svg('<defs><linearGradient id="c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f4eaff"/><stop offset=".6" stop-color="#b790ff" stop-opacity=".8"/><stop offset="1" stop-color="#b790ff" stop-opacity="0"/></linearGradient></defs><path d="M0,3L14,4L22,2L36,4.5L48,3L60,3.6L60,4.4L48,4L36,5.4L22,3.2L14,5Z" fill="url(#c)"/>', 60, 8);
  for (const [dir, len, dl] of [[1, 46, 0], [-1, 52, 30], [1, 28, 70], [-1, 30, 90]]) {
    const L = (s) => `translateX(${(dir * (len / 2) * (1 - s) * -k.u).toFixed(2)}px) scaleX(${(dir * Math.max(0.03, s)).toFixed(3)})`;
    fx(k.picIn(crack, [BL[0] + dir * len / 2, BL[1] + 2 + dl / 45], len, len * 0.13), [[640 + dl, { transform: L(0.03), opacity: 0 }, 'ease-out'], [700 + dl, { transform: L(0.15), opacity: 1 }, 'ease-out'], [900 + dl, { transform: L(1), opacity: 0.9 }, eio], [1500 + dl, { transform: L(1), opacity: 0 }]]);
  }
  for (let i = 0; i < 4; i++) {
    const x = BL[0] + (i - 1.5) * 12 + (rand() - 0.5) * 5, t = 650 + i * 40, r = Math.round(rand() * 360);
    fx(k.picIn('smoke', [x, BL[1] + 3], 20, 20, { lit: false }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 260, { transform: `${k.T((i - 1.5) * 5, -5)} rotate(${r + 20}deg) scale(.9)`, opacity: 0.3 }], [t + 1000, { transform: `${k.T((i - 1.5) * 9, -13)} rotate(${r + 40}deg) scale(1.5)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.45 + (rand() - 0.5) * 0.2, v = 18 + rand() * 18, life = 600 + rand() * 300;
    const pp = (f) => k.T(Math.cos(a) * v * f, Math.sin(a) * v * f + 38 * f * f);
    fx(k.pic('mote', [BL[0], BL[1] - 3], 4, 4), [0, 0.35, 0.7, 1].map((f, j) => [655 + life * f, { transform: `${pp(f)} scale(${(1 - 0.4 * f).toFixed(2)})`, opacity: j === 0 ? 0 : j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']));
  }

  // ── what each blow does
  const ward = k.svg('<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf6ff"/><stop offset=".55" stop-color="#d2baf8" stop-opacity=".85"/><stop offset="1" stop-color="#a98ae8" stop-opacity="0"/></linearGradient><filter id="b" x="-40%" y="-20%" width="180%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter></defs>' +
    '<g filter="url(#b)" opacity=".7"><path d="M14,14C7,15 4,23 5,33C6,42 10,46 9,56C13,51 17,51 20,56C18,46 23,42 23,33C24,23 21,15 14,14Z" fill="#c9a8ff"/></g>' +
    '<path d="M14,13C8,14 5,22 6,32C7,41 11,45 10,54C14,49 17,49 19,54C18,45 22,41 22,32C23,22 20,14 14,13Z" fill="url(#g)"/>' +
    '<path d="M7,25C2,21 0,14 3,7L5.4,8.4C3.6,14 6,18 9.4,21Z M21,25C26,21 28,14 25,7L22.6,8.4C24.4,14 22,18 18.6,21Z" fill="#f2e8ff"/>' +
    '<circle cx="14" cy="8" r="4.8" fill="#fbf6ff"/><ellipse cx="12.2" cy="8" rx="1" ry="1.4" fill="#3a2a66"/><ellipse cx="16.2" cy="8" rx="1" ry="1.4" fill="#3a2a66"/>', 28, 58);
  const bolt = k.svg('<defs><linearGradient id="t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a62e8" stop-opacity="0"/><stop offset=".7" stop-color="#cdb4f6" stop-opacity=".9"/><stop offset="1" stop-color="#fff"/></linearGradient></defs><path d="M0,5L38,1.6Q47,5 38,8.4Z" fill="url(#t)"/><circle cx="41" cy="5" r="3.4" fill="#fff"/><circle cx="41" cy="5" r="2" fill="#2a1c48" opacity=".55"/>', 48, 10);
  const shard = k.svg('<path d="M0,3L12,0L9,4Z" fill="#2a1c48"/><path d="M0,3L12,0L10,1.4Z" fill="#b99af0"/>', 12, 5);
  const gring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#eadbff" stroke-width="5" filter="url(#b)"/>', 100, 100);
  blows.forEach((b, bi) => {
    const [gx, gy] = b.G, IM = b.at, out = [-b.dx, -b.dy], W = [gx + out[0] * 9, gy + out[1] * 9 + 3];
    // a spirit stands up out of the ground where it will land, takes the bolt on its hands, and comes apart
    fx(k.lightIn('g-wraith', W, 42, 42), [[IM - 440, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM - 140, { transform: 'scale(1)', opacity: 0.8 }], [IM, { transform: 'scale(1.1)', opacity: 0.8 }, 'ease-out'], [IM + 120, { transform: 'scale(1.5)', opacity: 0.9 }], [IM + 560, { transform: 'scale(1.8)', opacity: 0 }]]);
    fx(k.pic(ward, W, 26, 53.8), [[IM - 440, { transform: `${k.T(0, 16)} scale(.5, .35)`, opacity: 0 }, 'ease-out'], [IM - 140, { transform: `${k.T(0, 0)} scale(1, 1)`, opacity: 0.95 }, eio], [IM, { transform: `${k.T(-out[0] * 1.5, -1)} scale(1.04, 1.03)`, opacity: 1 }, 'ease-out'], [IM + 120, { transform: `${k.T(0, -4)} scale(1.25, 1.12)`, opacity: 0.8 }, 'ease-out'], [IM + 520, { transform: `${k.T(2, -22)} scale(1.3, 1.5)`, opacity: 0 }]]);
    // (alone) the bolt comes in from outside and strikes the guard point
    if (alone) {
      const st = [gx + out[0] * 105 + (bi - 1) * 8, gy + out[1] * 105 - 22], ang = (Math.atan2(W[1] - st[1], W[0] - st[0]) * 180) / Math.PI;
      const at = (f) => k.T((W[0] - st[0]) * f, (W[1] - st[1]) * f);
      fx(k.pic(bolt, st, 48, 10), [[IM - 300, { transform: `${at(0)} rotate(${ang.toFixed(1)}deg)`, opacity: 0 }, 'ease-in'], [IM - 270, { transform: `${at(0.1)} rotate(${ang.toFixed(1)}deg)`, opacity: 1 }, 'ease-in'], [IM, { transform: `${at(1)} rotate(${ang.toFixed(1)}deg)`, opacity: 1 }], [IM + 50, { transform: `${at(1.03)} rotate(${ang.toFixed(1)}deg)`, opacity: 0 }]]);
    }
    fx(k.pic('mote', W, 56, 56), [[IM - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [IM + 420, { transform: 'scale(1.7)', opacity: 0 }]]);
    fx(k.pic('star', W, 30, 30), [[IM - 20, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.2) rotate(30deg)', opacity: 1 }, 'ease-out'], [IM + 330, { transform: 'scale(.6) rotate(70deg)', opacity: 0 }]]);
    fx(k.pic(gring, W, 44, 44), [[IM, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(.4)', opacity: 0.95 }, 'ease-out'], [IM + 480, { transform: 'scale(1.15)', opacity: 0 }]]);
    // lavender motes and dark shards flying off, away from the blow
    for (let i = 0; i < 10; i++) {
      const a = Math.atan2(out[1], out[0]) + (rand() - 0.5) * 2.6, v = 14 + rand() * 26, life = 420 + rand() * 340, r0 = Math.round(rand() * 360), sh = i % 3 === 0;
      const px = (f) => Math.cos(a) * v * f, py = (f) => Math.sin(a) * v * f + (sh ? 30 : -10) * f * f - 4 * f;
      fx(k.pic(sh ? shard : 'mote', W, sh ? 7 : 4, sh ? 3 : 4, sh ? { lit: false } : {}), [0, 0.3, 0.7, 1].map((f, j) => [IM + life * f, { transform: `${k.T(px(f), py(f))} rotate(${r0 + Math.round(f * 200)}deg) scale(${(1.1 - 0.3 * f).toFixed(2)})`, opacity: j === 0 ? 0 : j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']));
    }
  });
}
