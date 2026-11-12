// Mossback: the great wading beast takes a breath of the forest and grows.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support, element nature.
//   0-800     GATHER: it lifts its head from the stream and draws breath; the little
//             tree on its shell leans, then straightens and swells; the four blossoms
//             warm into small green-gold lights; motes lift from the shell and the
//             water round its legs and spiral in to the tree's crown, where a light
//             swells.
//   1000      RELEASE: the crown flares; three orbs of green-gold light leave it in
//             turn, along arcs, to T (k.aim, else the middle of its own shell).
//   1350      IMPACT/bloom at T: a ring of light spreads, a flare, leaves unfurl and
//             fly outward, motes of gold rise; alone, the whole shell glows with
//             the growth, a heavier ring runs through the water at its feet.
//   1350-2600 its head bows with the weight of it, the tree sways, settling; the
//             blossoms burn and dim; the motes thin out.
//   2600-3500 the lights sink, the ripples die, head and tree come home. At rest as drawn
//             by 3500 (END 4000).
// BEATS: release 1000, impact 1350, settle 3500.
export const END = 4000;
export const BEATS = { release: 1000, impact: 1350, settle: 3500 };
export const STILLS = [400, 900, 1150, 1400, 1650, 2100, 2800, 3700];

export const textures = {
  orb: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [230 + 25 * c, 255, 150 + 90 * c * c, Math.min(1, c * c * 2.4)]; }],
  mote: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [240, 255, 190 + 60 * c, Math.min(1, c * c * 3)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const head = k.part('head'), tree = k.part('tree');
  const [fx0, fy0] = k.spec.treeFoot, [nx, ny] = k.spec.neck, E = k.spec.emit, flowers = k.spec.flowers;
  const T = k.aim || k.spec.hit;
  const solo = !k.aim;
  k.css('.g-leaf { border-radius: 50%; background: radial-gradient(circle, rgba(250,255,214,.95), rgba(196,240,112,.55) 30%, rgba(130,205,70,.2) 58%, rgba(110,190,60,0) 72%); }');
  const leaf = k.svg('<defs><linearGradient id="g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#8fcf4a"/><stop offset="1" stop-color="#e8fba0"/></linearGradient></defs><path d="M10,30C2,22 3,8 10,1C17,8 18,22 10,30Z" fill="url(#g)"/><path d="M10,29L10,6" stroke="#5f9a2c" stroke-width=".9" fill="none" opacity=".7"/>', 20, 30);
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><ellipse cx="50" cy="25" rx="44" ry="20" fill="none" stroke="#eefcb4" stroke-width="3.2" filter="url(#b)"/><ellipse cx="50" cy="25" rx="44" ry="20" fill="none" stroke="#fbffe4" stroke-width="1.1"/>', 100, 50);
  const ripple = k.svg('<ellipse cx="50" cy="25" rx="44" ry="14" fill="none" stroke="#f5f3dc" stroke-width="2.2"/>', 100, 50);

  // ── the head: lifts to breathe, bows under the weight of the growth, home
  const hd = (deg) => ({ transform: `rotate(${deg}deg)` });
  act(head, [[0, hd(0), eio], [650, hd(-11), eio], [1000, hd(-14), eio], [1350, hd(-6), 'ease-out'], [1800, hd(5), eio], [2500, hd(3), eio], [3300, hd(0)]]);
  // ── the tree: leans, straightens and swells, then sways itself still
  const tf = (deg, s) => ({ transform: `rotate(${deg}deg) scale(${s})` });
  act(tree, [[0, tf(0, 1), eio], [300, tf(-4, 1.02), eio], [750, tf(2, 1.08), eio], [1000, tf(0, 1.13), 'ease-out'], [1350, tf(3.5, 1.1), eio], [1700, tf(-3, 1.05), eio],
    [2100, tf(2, 1.03), eio], [2500, tf(-1.2, 1.01), eio], [2900, tf(0.6, 1), eio], [3300, tf(0, 1)]]);
  // where the crown is as the tree turns about its foot (to ride a light on it)
  const crownAt = (deg, s) => { const a = (deg * Math.PI) / 180, rx = (E[0] - fx0) * s, ry = (E[1] - fy0) * s; return [fx0 + rx * Math.cos(a) - ry * Math.sin(a), fy0 + rx * Math.sin(a) + ry * Math.cos(a)]; };
  const cT = (deg, s) => { const p = crownAt(deg, s); return k.T(p[0] - E[0], p[1] - E[1]); };

  // ── the blossoms warm into lights, flare at the impact, dim (they ride the shell: still)
  flowers.slice(0, 3).forEach(([x, y], i) => {
    const t0 = 120 + i * 130, big = 1;
    const l = [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 450, { transform: `scale(${1 * big})`, opacity: 0.55 }, eio], [1000, { transform: `scale(${1.15 * big})`, opacity: 0.75 }, eio],
      [1350 + i * 40, { transform: `scale(${1.9 * big})`, opacity: 1 }, 'ease-out']];
    for (let t = 1550 + i * 40, j = 0; t < 2500; t += 230, j++) l.push([t, { transform: `scale(${(j % 2 ? 1.35 : 1.6) * big})`, opacity: j % 2 ? 0.7 : 0.9 }, eio]);
    l.push([3000, { transform: 'scale(.9)', opacity: 0 }]);
    fx(k.lightIn('g-leaf', [x, y], 30, 30), l);
  });

  // ── gather: motes lift from the shell and the water round its legs, spiralling in to the crown
  const srcs = [[96, 100], [120, 92], [170, 90], [190, 108], [86, 156], [188, 156], [150, 100], [110, 128], [178, 128], [136, 96]];
  srcs.forEach(([x, y], i) => {
    const t0 = 150 + i * 70, life = 700 + rand() * 250, side = i % 2 ? 1 : -1;
    const pts = k.arc([0, 0], [(E[0] - x) * 0.3 + side * 22, (E[1] - y) * 0.9 - 12], [E[0] - x, E[1] - y], 6, (t) => t * t * (3 - 2 * t));
    const sz = 3 + rand() * 2.5;
    fx(k.picIn('mote', [x, y], sz, sz), [[t0 - 1, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], ...pts.map(([px, py], j) => [Math.round(t0 + life * j / 5), { transform: `${k.T(px, py)} scale(${(1 - 0.5 * j / 5 + (j === 0 ? -0.5 : 0.2)).toFixed(2)})`, opacity: j === 0 ? 0 : j === 5 ? 0 : 0.95 }, j < 2 ? 'ease-out' : 'ease-in-out'])]);
  });
  // a light swelling at the crown (it follows the sway), flaring at the release
  fx(k.picIn('orb', E, 34, 34), [
    [300, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'],
    [750, { transform: `${cT(2, 1.08)} scale(.9)`, opacity: 0.7 }, eio],
    [1000, { transform: 'scale(1.7)', opacity: 1 }, 'ease-out'],
    [1200, { transform: `${cT(3.5, 1.1)} scale(1.2)`, opacity: 0.8 }, eio],
    [1900, { transform: 'scale(.8)', opacity: 0.3 }, eio], [2500, { transform: 'scale(.4)', opacity: 0 }]]);
  fx(k.lightIn('g-leaf', E, 70, 70), [[700, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(1.1)', opacity: 0.7 }, 'ease-out'], [1500, { transform: 'scale(1)', opacity: 0.3 }, eio], [2200, { transform: 'scale(.7)', opacity: 0 }]]);

  // ── release: three orbs along arcs from the crown to T (overlay: T may be another card)
  const C = [(E[0] + T[0]) / 2 + (T[0] >= E[0] ? 6 : -6), Math.min(E[1], T[1]) - 22];
  const bz = (t) => { const q = 1 - t; return [q * q * E[0] + 2 * q * t * C[0] + t * t * T[0], q * q * E[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const [X0, Y0] = k.P(...E);
  for (let i = 0; i < 3; i++) {
    const t0 = 1000 + i * 70, dur = 350, off = (i - 1) * 4;
    const at = (f, s, o) => { const [x, y] = k.P(...bz(f)); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + off * Math.sin(Math.PI * f) * u).toFixed(1)}px) scale(${s})`, opacity: o }; };
    fx(k.pic('orb', E, 16 - i * 2, 16 - i * 2), [[t0, at(0, 0.5, 0), 'ease-in'], [t0 + 60, at(0.2, 1.1, 1), 'linear'], [t0 + dur * 0.6, at(0.6, 1.2, 1), 'linear'], [t0 + dur, at(1, 1, 0.9), 'ease-out'], [t0 + dur + 120, at(1, 1.8, 0)]]);
    // a trail of little motes behind it
    for (let j = 0; j < 4; j++) {
      const f = 0.12 + j * 0.2, ts = Math.round(t0 + dur * f);
      fx(k.pic('mote', E, 5, 5), [[ts, at(f, 0.5, 0), 'ease-out'], [ts + 40, at(f, 1, 0.9)], [ts + 260, { ...at(f, 0.3, 0) }]]);
    }
  }

  // ── impact: ring, flares, leaves unfurling and flying outward, gold motes rising
  const IM = 1350;
  fx(k.light('g-leaf', T, 64), [[IM - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [IM + 500, { transform: 'scale(1.2)', opacity: 0.55 }, eio], [IM + 1400, { transform: 'scale(.8)', opacity: 0 }]]);
  for (const [d, w, o] of [[0, 90, 0.95], [140, 70, 0.7]]) {
    fx(k.pic(ring, T, w, w / 2), [[IM + d - 1, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + d + 40, { transform: 'scale(.3)', opacity: o }, 'ease-out'], [IM + d + 650, { transform: 'scale(1.1)', opacity: 0 }]]);
  }
  for (let i = 0; i < 9; i++) {
    const a = (-Math.PI * (0.1 + 0.8 * rand())), r = 20 + rand() * 24, ex = Math.cos(a) * r * 1.2, ey = Math.sin(a) * r * 0.9, t0 = IM + 20 + rand() * 120, life = 800 + rand() * 500, rt = Math.round((rand() - 0.5) * 140);
    const pts = k.arc([0, 0], [ex * 0.7, ey - 8], [ex * 1.1, ey + 12 + rand() * 10], 5);
    fx(k.pic(leaf, T, 7 + rand() * 3, 10 + rand() * 4, { lit: false }), [[t0, { transform: `${k.T(0, 0)} rotate(${rt}deg) scale(.2)`, opacity: 0 }, 'ease-out'],
      ...pts.map(([x, y], j) => [Math.round(t0 + 60 + life * j / 5), { transform: `${k.T(x, y)} rotate(${rt + Math.round((rand() - 0.2) * 160 * j)}deg) scale(${j === 0 ? 0.6 : 1})`, opacity: j === 5 ? 0 : 0.95 }, j < 1 ? 'ease-out' : 'ease-in-out'])]);
  }
  for (let i = 0; i < 12; i++) {
    const dx = (rand() - 0.5) * 70, t0 = IM + 80 + rand() * 700, life = 900 + rand() * 600, sz = 2.5 + rand() * 3;
    const pts = k.arc([0, 0], [dx * 0.6 + (rand() - 0.5) * 18, -30], [dx * 0.8 + (rand() - 0.5) * 20, -62 - rand() * 14], 5);
    fx(k.pic('mote', [T[0] + dx * 0.4, T[1] + 6 + rand() * 10], sz, sz), [[t0 - 1, { transform: `${k.T(0, 0)} scale(.3)`, opacity: 0 }, 'ease-out'],
      ...pts.map(([x, y], j) => [Math.round(t0 + life * j / 5), { transform: `${k.T(x, y)} scale(${1 - 0.45 * j / 5})`, opacity: j === 0 ? 0 : j === 5 ? 0 : 0.9 }, 'ease-out'])]);
  }

  // ── alone, the growth goes through the whole beast: the shell glows, the water rings at its feet
  if (solo) {
    fx(k.lightIn('g-leaf', [136, 118], 190, 100), [[IM, { opacity: 0, transform: 'scale(.6)' }, 'ease-out'], [IM + 220, { opacity: 0.8, transform: 'scale(1)' }, 'ease-out'], [IM + 900, { opacity: 0.55, transform: 'scale(1.04)' }, eio], [2900, { opacity: 0, transform: 'scale(1)' }]]);
    for (const [x, d] of [[187, 120], [86, 200]]) for (let j = 0; j < 2; j++) {
      fx(k.picIn(ripple, [x, 167], 56, 28, { lit: false }), [[IM + d + j * 300, { transform: 'scale(.35, .35)', opacity: 0 }, 'ease-out'], [IM + d + j * 300 + 100, { transform: 'scale(.5, .5)', opacity: 0.8 }, 'ease-out'], [IM + d + j * 300 + 1000, { transform: 'scale(1.25, 1.25)', opacity: 0 }]]);
    }
  }
}
