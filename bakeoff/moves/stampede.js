// Stampede: thunder cracks over the plain, and the whole herd surges into a gallop; its
// charge rolls out as a stream of ghostly beasts in dust and flows to a creature, which
// blooms with it: a ring of light, motes and leaves, two golden chevrons rising (+2/+2).
//
// PLAN (drawing units 300 x 210, ms of the move). Role support (a Trick that boosts your
// creatures), element earth (the suggested lightning is only the storm overhead: what it gives
// is the ground charging, dust and growing green-gold power).
//   0-880     gather: the herd rocks back on its haunches, trembling; dust gathers low at
//             every hoof, a gold light creeping along the ground.
//   860-1000  thunder: the bolt flickers and the sky flashes.
//   950       RELEASE: the lead beast and the herd leap forward into a gallop (bobbing, pitching,
//             the far herd following a beat later); five ghost beasts of dust and gold run out
//             of the lead's brow along an arc to T, their hooves throwing dust.
//   1300      IMPACT at T: the boon blooms: flash, two flat rings, dust, motes and leaves,
//             golden chevrons rising.
//   1300-3400 the herd gallops on, easing back as the dust thins and the storm light dims. At
//             rest as drawn from 3400 (END 3800).
// Aimed: T = k.aim || [24, 172] (the ground ahead of the lead beast). The herd faces left; it
// is mirrored as a whole, through a sliver, when T is on its right (the bolt stays). The
// ghosts leave from spec.emit, carried by the same transforms.
import { mul, rot, scl, tr, app, curve, kit } from './_fx.js';
export const END = 3800;
export const BEATS = { release: 950, impact: 1300, settle: 3400 };
export const STILLS = [500, 880, 1050, 1200, 1350, 1700, 2500, 3600];
export const textures = {
  dust: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, a = Math.max(0, 1 - r); const b = 0.9 + 0.1 * Math.sin(x * 15) * Math.cos(y * 12); return [226 * b, 212 * b, 156 * b, Math.min(1, a * a * 2.1) * 0.9]; }],
  glint: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 244, 190 + 40 * c, Math.min(1, c * c * 2.4)]; }],
  mote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [200 + 50 * c, 250, 150 + 60 * c, Math.min(1, c * c * 2.6)]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const far = k.part('far'), mid = k.part('mid'), lead = k.part('lead'), eye = k.part('eye'), bolt = k.part('bolt');
  const E = k.spec.emit, G = k.spec.ground;
  const T = k.aim || [24, 172];
  const mirrored = T[0] > 160;
  const dir = mirrored ? 1 : -1; // the way it runs, in the world
  const back = -dir;

  k.css('.g-gold { border-radius: 50%; background: radial-gradient(circle, rgba(255,246,196,.9), rgba(236,226,136,.5) 34%, rgba(168,206,96,.18) 62%, rgba(150,200,90,0) 76%); }');
  k.css('.g-flash { border-radius: 50%; background: radial-gradient(circle, rgba(248,255,236,.95), rgba(220,240,214,.5) 38%, rgba(190,220,190,.14) 66%, rgba(190,220,190,0) 78%); }');
  const ringSvg = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.8"/></filter></defs><ellipse cx="50" cy="50" rx="42" ry="42" fill="none" stroke="#f4ecae" stroke-width="6" filter="url(#b)"/>', 100, 100);
  const chevron = k.svg('<defs><filter id="b" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1"/></filter></defs>' +
    '<path d="M3,12L12,3L21,12M3,22L12,13L21,22" fill="none" stroke="#fff4b0" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round" filter="url(#b)"/>' +
    '<path d="M3,12L12,3L21,12M3,22L12,13L21,22" fill="none" stroke="#f0ffcc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>', 24, 26);
  const leaf = k.svg('<path d="M2,10C4,3 12,1 18,2C17,9 11,14 2,10Z" fill="#b6e07a"/><path d="M3,9.5C8,7 12,5 17,2.4" stroke="#eaffc0" stroke-width=".8" fill="none"/>', 20, 14);
  // a ghost of the herd: a beast of gold dust, running (facing the way it runs)
  const beast = (flip) => k.svg(`<defs><filter id="b" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="1"/></filter><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4b8"/><stop offset="1" stop-color="#b4d86c"/></linearGradient></defs>` +
    `<g transform="${flip ? 'translate(48 0) scale(-1 1)' : ''}" fill="url(#g)" filter="url(#b)"><path d="M12,8C16,2 26,1 34,4C42,7 44,12 40,17L30,19L20,19L14,15Z"/><path d="M12,9L6,15L3,22L7,22L13,17Z"/><path d="M10,8L7,2L10,5Z"/><path d="M14,6L14,0L17,4Z"/><path d="M16,18L13,27L16,27L20,19Z"/><path d="M33,18L38,27L41,26L38,17Z"/><path d="M26,19L24,27L27,27L30,19Z"/></g>`, 48, 28);
  const ghostL = beast(false), ghostR = beast(true);

  // ── its motion: three groups galloping, each from its own feet; mirrored as one when T is on the right
  const flip = mirrored ? curve([[0, 1], [380, -1], [2750, -1], [3200, 1]]) : () => 1;
  const MIR = (t) => { const v = flip(t); return scl(Math.sign(v || 1) * Math.max(0.06, Math.abs(v)), 1, 150, 0); };
  const amp = curve([[0, 0], [300, 0.1], [880, 0.12], [1050, 1, 'out'], [1700, 1], [2600, 0.5], [3300, 0]]);
  const lungeL = curve([[0, 0], [400, -0.3], [880, -0.6, 'in'], [1100, 1, 'out'], [1500, 0.9], [2300, 0.35], [3000, 0]]);
  const trem = curve([[0, 0], [300, 0.3], [880, 1, 'in'], [960, 0], [3000, 0]]);
  const grp = (feet, lag, lunge, per) => (t) => {
    const tt = Math.max(0, t - lag), a = amp(tt), ph = (tt / per) * Math.PI * 2, sh = trem(t) * Math.sin(t * 0.21) * 0.6;
    const L = lungeL(tt);
    const y = -a * 2.6 * Math.max(0, Math.sin(ph)) + sh, pitch = a * 2.4 * Math.sin(ph + 0.6) + trem(t) * 1.5;
    const sq = 1 + (L < 0 ? 0.03 * -L : 0) - a * 0.02 * Math.sin(ph);
    return mul(MIR(t), mul(tr(L * lunge * -1, y), mul(rot(pitch, feet[0], feet[1]), scl(1 / Math.sqrt(sq), sq, feet[0], feet[1]))));
  };
  const WL = grp([118, 190], 0, 14, 400), WM = grp([240, 182], 70, 9, 430), WF = grp([240, 160], 150, 5, 460);
  h.drive(lead, [118, 190], WL, 3300);
  h.drive(eye, [118, 190], WL, 3300);
  h.drive(mid, [240, 182], WM, 3300);
  h.drive(far, [240, 160], WF, 3300);

  // ── thunder: the bolt flickers, the sky flashes
  act(bolt, [[0, { opacity: 1 }, 'linear'], [840, { opacity: 1 }], [880, { opacity: 0 }], [920, { opacity: 1 }], [960, { opacity: 0.1 }], [1010, { opacity: 1 }], [1140, { opacity: 0.2 }], [1260, { opacity: 1 }]]);
  fx(k.lightIn('g-flash', [200, 40], 300, 150), [[850, { opacity: 0 }, 'ease-out'], [885, { opacity: 0.7 }], [930, { opacity: 0.1 }], [980, { opacity: 0.55 }], [1200, { opacity: 0 }]]);
  fx(k.lightIn('g-gold', [150, 160], 330, 110, { under: true }), [[250, { opacity: 0 }, 'ease-out'], [950, { opacity: 0.4 }, eio], [1350, { opacity: 0.6 }, eio], [2500, { opacity: 0.3 }, eio], [3400, { opacity: 0 }]]);
  // a gold light riding the lead's brow
  h.ride(k.light('g-gold', E, 30), E, WL, [[500, 0.4, 0], [900, 1.0, 0.6], [1050, 1.4, 0.95], [1300, 1.2, 0.8], [1800, 0.7, 0.2], [2300, 0.4, 0]]);

  // ── dust at the hooves: gathering (low, trembling), then thrown back as it gallops
  const hoof = [[[100, 190], [128, 190]], [[222, 182], [252, 182]], [[232, 164], [262, 164]]];
  const W3 = [WL, WM, WF];
  const dustIn = (p, t0, size, vx, vy, life, o0, grow) => {
    const r = Math.round(rand() * 360);
    fx(k.picIn('dust', p, size, size, { lit: false }), [[t0, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 150, { transform: `${k.T(vx * 0.4, vy * 0.4)} rotate(${r + 15}deg) scale(${0.4 + 0.5 * (grow - 0.4)})`, opacity: o0 }, 'ease-out'], [t0 + life, { transform: `${k.T(vx, vy)} rotate(${r + 40}deg) scale(${grow})`, opacity: 0 }]]);
  };
  for (let g = 0; g < 3; g++) {
    for (let i = 0; i < 6; i++) {
      const t0 = 260 + i * 110 + g * 30 + rand() * 40, f = hoof[g][i % 2], p = app(W3[g](t0), [f[0] + (rand() - 0.5) * 10, f[1]]);
      dustIn(p, t0, (g ? 10 : 13) + rand() * 6, back * (6 + rand() * 8), -(4 + rand() * 6), 520, g === 2 ? 0.45 : 0.65, 1.6);
    }
    for (let i = 0; i < 11 - g * 2; i++) {
      const t0 = 1000 + g * 90 + i * (150 + g * 20) + rand() * 50, f = hoof[g][i % 2], p = app(W3[g](Math.min(t0, 3300)), [f[0] + (rand() - 0.5) * 12, f[1] - 1]);
      dustIn(p, t0, (g ? 12 : 17) + rand() * 8, back * (14 + rand() * 18), -(5 + rand() * 9), 650 + rand() * 200, g === 2 ? 0.5 : 0.75, 1.9);
    }
  }

  // ── the boon (BEATS.release to .impact): ghost beasts running out of the lead's brow to T, trailing dust
  const M = app(WL(1100), E), bz = h.arcPath(M, T, 12);
  const gdir = T[0] >= M[0] ? ghostR : ghostL;
  for (let i = 0; i < 5; i++) {
    const t0 = 960 + i * 55, t1 = 1250 + i * 30, side = (i - 2) * 2;
    const bz2 = (f) => { const p = bz(f); return [p[0], p[1] + side * Math.sin(Math.PI * f)]; };
    h.fly(k.pic(gdir, M, 26 - i, 15 - i * 0.5, { lit: true }), M, bz2, t0, t1, (f) => 0.55 + 0.6 * Math.sin(Math.PI * Math.min(1, f * 1.05)) * 0.5 + 0.45 * f, (f) => (f < 0.12 ? f * 7 : f > 0.9 ? Math.max(0, (1 - f) * 7) : 0.8), 0, 0, 40);
  }
  for (let i = 0; i < 18; i++) {
    const t0 = 970 + i * 17, t1 = 1230 + i * 12, id = i % 3, sz = [14, 5, 11][id], side = (rand() - 0.5) * 8, r = Math.round(rand() * 360);
    const bz2 = (f) => { const p = bz(f); return [p[0], p[1] + side * Math.sin(Math.PI * f) + 4 * f]; };
    h.fly(k.pic(['dust', 'glint', 'dust'][id], M, sz, sz, { lit: false }), M, bz2, t0, t1, (f) => (id === 1 ? 1.2 - 0.5 * f : 0.5 + 0.9 * f), (f) => (f < 0.1 ? f * 8 : f > 0.94 ? 0.2 : 0.85), r, 120, 50);
  }

  // ── it blooms at T
  const IM = 1300;
  const fl = [[IM - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [IM + 220, { transform: 'scale(1.9)', opacity: 0.65 }]];
  for (let t = IM + 380, i = 0; t < IM + 1000; t += 130, i++) fl.push([t, { transform: `scale(${i % 2 ? 1.4 : 1.15})`, opacity: i % 2 ? 0.55 : 0.4 }, eio]);
  fl.push([IM + 1500, { transform: 'scale(.9)', opacity: 0 }]);
  fx(k.light('g-gold', T, 70), fl);
  fx(k.light('g-gold', T, 24), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.6)', opacity: 1 }], [IM + 190, { transform: 'scale(2.6)', opacity: 0 }]]);
  fx(k.pic(ringSvg, [T[0], T[1] + 6], 70, 70), [[IM, { transform: 'scale(.15, .08)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(.4, .2)', opacity: 0.95 }, 'ease-out'], [IM + 520, { transform: 'scale(1.1, .55)', opacity: 0 }]]);
  fx(k.pic(ringSvg, [T[0], T[1] + 6], 70, 70), [[IM + 120, { transform: 'scale(.1, .05)', opacity: 0 }, 'ease-out'], [IM + 190, { transform: 'scale(.3, .15)', opacity: 0.6 }, 'ease-out'], [IM + 650, { transform: 'scale(.8, .4)', opacity: 0 }]]);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + rand() * 0.4, d = 14 + rand() * 18, t = IM + rand() * 40, r = Math.round(rand() * 360), sz = 16 + rand() * 10;
    fx(k.pic('dust', [T[0] + Math.cos(a) * 3, T[1] + 6], sz, sz, { lit: false }), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 150, { transform: `${k.T(Math.cos(a) * d * 0.5, Math.sin(a) * d * 0.3)} rotate(${r + 15}deg) scale(1)`, opacity: 0.8 }, 'ease-out'], [t + 900, { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d * 0.5 - 8)} rotate(${r + 40}deg) scale(1.8)`, opacity: 0 }]]);
  }
  // motes of green-gold power rising, and leaves lifting
  for (let i = 0; i < 16; i++) {
    const t = IM + 60 + i * 70 + rand() * 40, x = T[0] + (rand() - 0.5) * 34, y = T[1] + 8 - rand() * 6, sz = 3 + rand() * 3;
    fx(k.pic('mote', [x, y], sz, sz), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 160, { transform: `${k.T((rand() - 0.5) * 6, -8)} scale(1)`, opacity: 1 }], [t + 1100, { transform: `${k.T((rand() - 0.5) * 14, -34 - rand() * 18)} scale(.3)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 6; i++) {
    const t = IM + 100 + i * 120, x = T[0] + (rand() - 0.5) * 26, r = Math.round(rand() * 120 - 60);
    fx(k.pic(leaf, [x, T[1] + 4], 11, 8), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 200, { transform: `${k.T((rand() - 0.5) * 8, -12)} rotate(${r + 30}deg) scale(1)`, opacity: 1 }], [t + 1200, { transform: `${k.T((rand() - 0.5) * 26, -38 - rand() * 12)} rotate(${r + 200}deg) scale(.9)`, opacity: 0 }]]);
  }
  // +2/+2: two golden chevrons rising from it
  for (let i = 0; i < 2; i++) {
    const t = IM + 160 + i * 280, x = T[0] + (i ? 8 : -8);
    fx(k.pic(chevron, [x, T[1] - 4], 14, 15), [[t, { transform: `${k.T(0, 6)} scale(.5)`, opacity: 0 }, 'ease-out'], [t + 220, { transform: `${k.T(0, -4)} scale(1)`, opacity: 1 }, 'ease-out'], [t + 650, { transform: `${k.T(0, -14)} scale(1.05)`, opacity: 0.8 }], [t + 1000, { transform: `${k.T(0, -26)} scale(1)`, opacity: 0 }]]);
  }
  // a quake ripple along the ground where it lands, fading as the herd slows
  fx(k.pic(ringSvg, [T[0], T[1] + 10], 110, 110, { low: true }), [[IM + 200, { transform: 'scale(.1, .03)', opacity: 0 }, 'ease-out'], [IM + 300, { transform: 'scale(.3, .09)', opacity: 0.45 }, 'ease-out'], [IM + 1100, { transform: 'scale(1.1, .3)', opacity: 0 }]]);
}
