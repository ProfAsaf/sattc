// Worldtree Stag: the stag bows, lifts its antlers into the light, and gives its strength away.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support, element nature ("give another
// creature +2/+2 permanently").
//   0-350     ANTICIPATION: it bows its head a little, the antlers dipping with it.
//   350-1250  GATHER: it lifts its head, antlers swelling; the eight blossoms warm into lights
//             one after another; motes and leaves lift from the meadow and the forest floor
//             round its feet and spiral up to the sun caught between the antlers (its
//             `emit`), which swells.
//   1250      RELEASE: the head tosses up, the antlers flare, whip and shed light; three
//             orbs of green-gold light leave the crown in turn, along arcs, to T (k.aim, else
//             the clearing at its right).
//   1700      IMPACT at T: a flare, two rings of light, a pillar of light, sprouts and
//             blossoms springing from the ground there, leaves flung outward, gold motes
//             rising (the +2/+2).
//   1700-3000 follow-through: the antlers sway back and forth like branches after a gust
//             (each side a beat apart), leaves drift down off them, the blossom-lights
//             burn and ebb, the motes thin out.
//   3000-3700 head and antlers sink home; at rest as drawn from 3700 (END 4200).
// BEATS: release 1250, impact 1700, settle 3700.
import { mul, rot, scl, curve, kit } from './_fx.js';
export const END = 4200;
export const BEATS = { release: 1250, impact: 1700, settle: 3700 };
export const STILLS = [250, 800, 1250, 1500, 1750, 2150, 2900, 3900];

export const textures = {
  orb: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [230 + 25 * c, 255, 150 + 90 * c * c, Math.min(1, c * c * 2.4)]; }],
  mote: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [240, 255, 190 + 60 * c, Math.min(1, c * c * 3)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const aL = k.part('antlersL'), aR = k.part('antlersR'), head = k.part('head');
  const [cx, cy] = k.spec.crown, [nx, ny] = k.spec.neck, E = k.spec.emit, blossoms = k.spec.blossoms;
  const T = k.aim || [244, 150];
  k.css('.g-leaf { border-radius: 50%; background: radial-gradient(circle, rgba(250,255,214,.95), rgba(196,240,112,.55) 30%, rgba(130,205,70,.2) 58%, rgba(110,190,60,0) 72%); }');
  k.css('.g-gold { border-radius: 50%; background: radial-gradient(circle, rgba(255,250,214,.95), rgba(255,226,130,.55) 30%, rgba(255,200,90,.2) 58%, rgba(255,190,80,0) 72%); }');
  const leaf = k.svg('<defs><linearGradient id="g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#8fcf4a"/><stop offset="1" stop-color="#e8fba0"/></linearGradient></defs><path d="M10,30C2,22 3,8 10,1C17,8 18,22 10,30Z" fill="url(#g)"/><path d="M10,29L10,6" stroke="#5f9a2c" stroke-width=".9" fill="none" opacity=".7"/>', 20, 30);
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><ellipse cx="50" cy="25" rx="44" ry="20" fill="none" stroke="#eefcb4" stroke-width="3.2" filter="url(#b)"/><ellipse cx="50" cy="25" rx="44" ry="20" fill="none" stroke="#fbffe4" stroke-width="1.1"/>', 100, 50);
  const bud = k.svg('<defs><linearGradient id="s" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#6fae3c"/><stop offset="1" stop-color="#d8f58c"/></linearGradient></defs><path d="M10,40C9.4,28 10.6,18 10,8" stroke="url(#s)" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M10,24C5,22 2,18 2,13C7,14 10,18 10,24Z" fill="#9ed24f"/><path d="M10,18C15,16 18,12 18,7C13,8 10,12 10,18Z" fill="#c5ec74"/><circle cx="10" cy="7" r="3" fill="#fffbe2"/>', 20, 40);

  // ── its motion: the head nods about the neck; the antlers ride the head, swell, and whip about the crown
  const hd = curve([[0, 0], [350, -4.5], [1000, 7], [1250, 12, 'out'], [1700, 8], [2300, 6], [3000, 2], [3700, 0]]);
  const swell = curve([[0, 1], [350, 1], [1000, 1.05], [1250, 1.1, 'out'], [1700, 1.07], [2400, 1.04], [3000, 1.01], [3700, 1]]);
  const whip = (ph) => (t) => (t < 1180 ? 0 : 5 * Math.sin((t - 1180) / 170 + ph) * Math.exp(-(t - 1180) / 620) * Math.min(1, (3600 - t) / 600 > 0 ? 1 : 0));
  const wL = whip(0), wR = whip(0.9);
  const WH = (t) => rot(hd(t), nx, ny);
  const WA = (w) => (t) => mul(WH(t), mul(rot(w(t), cx, cy), scl(swell(t), swell(t), cx, cy)));
  h.drive(head, [nx, ny], WH, 3700);
  h.drive(aL, [cx, cy], WA(wL), 3700);
  h.drive(aR, [cx, cy], WA(wR), 3700);
  const WAm = (t) => mul(WH(t), mul(rot((wL(t) + wR(t)) / 2, cx, cy), scl(swell(t), swell(t), cx, cy))); // the antlers as one, for lights riding them

  // ── the blossoms warm into lights, one after another, flare at the release, burn and ebb (riding the antlers)
  blossoms.forEach(([x, y], i) => {
    const t0 = 330 + i * 60;
    const list = [[0, 0.4, 0], [t0, 0.4, 0], [t0 + 420, 1.1, 0.7], [1250, 1.5, 0.9], [1400 + i * 30, 2.3, 1]];
    for (let t = 1600 + i * 30, j = 0; t < 2700; t += 220, j++) list.push([t, j % 2 ? 1.7 : 2.0, j % 2 ? 0.7 : 0.9]);
    list.push([3300, 1, 0.1], [3500, 0.8, 0]);
    h.ride(k.lightIn('g-gold', [x, y], 26, 26), [x, y], WAm, list);
  });

  // ── the sun caught between the antlers swells (gather), flares (release), glows and ebbs
  fx(k.lightIn('g-gold', E, 92, 92), [[350, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(1)', opacity: 0.7 }, eio], [1250, { transform: 'scale(1.6)', opacity: 1 }, 'ease-out'],
    [1700, { transform: 'scale(1.2)', opacity: 0.7 }, eio], [2400, { transform: 'scale(1)', opacity: 0.35 }, eio], [3200, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.picIn('orb', E, 30, 30), [[500, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(1)', opacity: 0.8 }, eio], [1250, { transform: 'scale(1.9)', opacity: 1 }, 'ease-out'], [1550, { transform: 'scale(1.1)', opacity: 0.8 }, eio], [2200, { transform: 'scale(.6)', opacity: 0 }]]);

  // ── gather: motes and leaves lift from the meadow round its feet, spiralling up to the sun between the antlers
  const srcs = [[96, 182], [118, 184], [140, 183], [162, 184], [186, 183], [208, 182], [230, 184], [74, 180], [250, 181], [128, 176], [196, 176], [64, 170], [110, 180], [176, 180]];
  srcs.forEach(([x, y], i) => {
    const t0 = 120 + i * 62, life = 900 + rand() * 300, side = i % 2 ? 1 : -1;
    const dx = E[0] - x, dy = E[1] - y;
    const pts = k.arc([0, 0], [dx * 0.2 + side * 26, dy * 0.7], [dx, dy], 6, (t) => t * t * (3 - 2 * t));
    const isLeaf = i % 3 === 0, sz = isLeaf ? 6 + rand() * 2 : 3 + rand() * 2.5, rt = Math.round(rand() * 120);
    fx(isLeaf ? k.picIn(leaf, [x, y], sz, sz * 1.5, { lit: false }) : k.picIn('mote', [x, y], sz, sz), [[t0 - 1, { transform: `${k.T(0, 0)} rotate(${rt}deg) scale(.4)`, opacity: 0 }, 'ease-out'],
      ...pts.map(([px, py], j) => [Math.round(t0 + life * j / 5), { transform: `${k.T(px, py)} rotate(${rt + j * (isLeaf ? 55 : 0)}deg) scale(${(1 - 0.5 * j / 5 + (j === 0 ? -0.5 : 0.2)).toFixed(2)})`, opacity: j === 0 ? 0 : j === 5 ? 0 : 0.95 }, j < 2 ? 'ease-out' : 'ease-in-out'])]);
  });

  // ── release: three orbs along arcs from the crown to T, each with a trail of motes (on the overlay: T may be another card)
  const C = [(E[0] + T[0]) / 2 + (T[0] >= E[0] ? 6 : -6), Math.min(E[1], T[1]) - 30];
  const bz = (t) => { const q = 1 - t; return [q * q * E[0] + 2 * q * t * C[0] + t * t * T[0], q * q * E[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const [X0, Y0] = k.P(...E);
  for (let i = 0; i < 3; i++) {
    const t0 = 1250 + i * 75, dur = 380, off = (i - 1) * 5;
    const at = (f, s, o) => { const [x, y] = k.P(...bz(f)); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + off * Math.sin(Math.PI * f) * u).toFixed(1)}px) scale(${s})`, opacity: o }; };
    fx(k.pic('orb', E, 20 - i * 3, 20 - i * 3), [[t0, at(0, 0.5, 0), 'ease-in'], [t0 + 60, at(0.2, 1.1, 1), 'linear'], [t0 + dur * 0.6, at(0.6, 1.2, 1), 'linear'], [t0 + dur, at(1, 1, 0.9), 'ease-out'], [t0 + dur + 120, at(1, 1.8, 0)]]);
    for (let j = 0; j < 5; j++) {
      const f = 0.1 + j * 0.17, ts = Math.round(t0 + dur * f);
      fx(k.pic(j % 2 ? 'mote' : leaf, E, j % 2 ? 5 : 6, j % 2 ? 5 : 9, { lit: j % 2 === 1 }), [[ts, at(f, 0.5, 0), 'ease-out'], [ts + 40, at(f, 1, 0.9)], [ts + 280, at(f, 0.3, 0)]]);
    }
  }
  fx(k.light('g-gold', E, 60), [[1220, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1300, { transform: 'scale(1.3)', opacity: 0.9 }, 'ease-out'], [1700, { transform: 'scale(1)', opacity: 0.25 }, eio], [2100, { transform: 'scale(.8)', opacity: 0 }]]);

  // ── impact at T: flare, rings, a pillar of light, sprouts, leaves flung out, motes rising
  const IM = 1700;
  fx(k.light('g-leaf', T, 70), [[IM - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [IM + 500, { transform: 'scale(1.2)', opacity: 0.6 }, eio], [IM + 1500, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.light('g-gold', T, 30), [[IM - 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.5)', opacity: 1 }], [IM + 260, { transform: 'scale(2.4)', opacity: 0 }]]);
  fx(k.light('g-leaf', [T[0], T[1] - 22], 44, 90), [[IM, { transform: 'scale(.5, .1)', opacity: 0 }, 'ease-out'], [IM + 160, { transform: 'scale(1, 1)', opacity: 0.85 }, 'ease-out'], [IM + 700, { transform: 'scale(.9, 1.15)', opacity: 0.5 }, eio], [IM + 1500, { transform: 'scale(.6, 1.3)', opacity: 0 }]]);
  for (const [d, w, o] of [[0, 96, 0.95], [150, 72, 0.7]]) {
    fx(k.pic(ring, T, w, w / 2), [[IM + d - 1, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + d + 40, { transform: 'scale(.3)', opacity: o }, 'ease-out'], [IM + d + 700, { transform: 'scale(1.1)', opacity: 0 }]]);
  }
  for (let i = 0; i < 6; i++) { // sprouts spring from the ground there
    const x = T[0] + (i - 2.5) * 7 + (rand() - 0.5) * 3, t0 = IM + 60 + i * 55, hgt = 16 + rand() * 10, lean = (rand() - 0.5) * 16;
    fx(k.pic(bud, [x, T[1] + 8], hgt * 0.5, hgt, { base: true, lit: false }), [[t0, { transform: 'scale(.4, .05)', opacity: 0 }, 'ease-out'], [t0 + 280, { transform: `rotate(${lean}deg) scale(1, 1.08)`, opacity: 1 }, 'ease-out'], [t0 + 450, { transform: `rotate(${lean * 0.6}deg) scale(1, 1)`, opacity: 1 }, eio],
      [IM + 1500, { transform: `rotate(${lean * 0.8}deg) scale(1, 1)`, opacity: 0.9 }, eio], [IM + 2100, { transform: `rotate(${lean}deg) scale(.9, .7)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI * (0.05 + 0.9 * rand()), r = 20 + rand() * 26, ex = Math.cos(a) * r * 1.2, ey = Math.sin(a) * r * 0.9, t0 = IM + 20 + rand() * 120, life = 800 + rand() * 500, rt = Math.round((rand() - 0.5) * 140);
    const pts = k.arc([0, 0], [ex * 0.7, ey - 8], [ex * 1.1, ey + 12 + rand() * 10], 5);
    fx(k.pic(leaf, T, 7 + rand() * 3, 10 + rand() * 4, { lit: false }), [[t0, { transform: `${k.T(0, 0)} rotate(${rt}deg) scale(.2)`, opacity: 0 }, 'ease-out'],
      ...pts.map(([x, y], j) => [Math.round(t0 + 60 + life * j / 5), { transform: `${k.T(x, y)} rotate(${rt + Math.round((rand() - 0.2) * 160 * j)}deg) scale(${j === 0 ? 0.6 : 1})`, opacity: j === 5 ? 0 : 0.95 }, j < 1 ? 'ease-out' : 'ease-in-out'])]);
  }
  for (let i = 0; i < 14; i++) {
    const dx = (rand() - 0.5) * 60, t0 = IM + 80 + rand() * 800, life = 900 + rand() * 600, sz = 2.5 + rand() * 3;
    const pts = k.arc([0, 0], [dx * 0.6 + (rand() - 0.5) * 18, -30], [dx * 0.8 + (rand() - 0.5) * 20, -62 - rand() * 14], 5);
    fx(k.pic('mote', [T[0] + dx * 0.4, T[1] + 6 + rand() * 10], sz, sz), [[t0 - 1, { transform: `${k.T(0, 0)} scale(.3)`, opacity: 0 }, 'ease-out'],
      ...pts.map(([x, y], j) => [Math.round(t0 + life * j / 5), { transform: `${k.T(x, y)} scale(${1 - 0.45 * j / 5})`, opacity: j === 0 ? 0 : j === 5 ? 0 : 0.9 }, 'ease-out'])]);
  }

  // ── follow-through: leaves drift down off the swaying antlers
  for (let i = 0; i < 9; i++) {
    const [bx, by] = blossoms[i % blossoms.length], t0 = Math.round(1300 + i * 130 + rand() * 80), life = 1100 + rand() * 400, rt = Math.round(rand() * 120);
    const dx = (rand() - 0.5) * 30, dy = 60 + rand() * 50;
    const pts = k.arc([0, 0], [dx * 0.6 + 14, dy * 0.3], [dx, dy], 5);
    fx(k.picIn(leaf, [bx, by], 6 + rand() * 2, 9 + rand() * 3, { lit: false }), [[t0, { transform: `${k.T(0, 0)} rotate(${rt}deg) scale(.5)`, opacity: 0 }, 'ease-out'],
      ...pts.map(([x, y], j) => [Math.round(t0 + life * j / 5), { transform: `${k.T(x, y)} rotate(${rt + Math.round((j % 2 ? 1 : -1) * 50 * j)}deg) scale(1)`, opacity: j === 0 ? 0 : j === 5 ? 0 : 0.9 }, j < 1 ? 'ease-out' : 'ease-in-out'])]);
  }
}
