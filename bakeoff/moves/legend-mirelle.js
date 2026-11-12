// Mirelle, the Mask-Maker: she lends her masks. She draws the glowing half-mask up and back, and every
// mask on the walls wakes in a wave of violet light, eyes shining, rippling out from her. Then she
// throws: the mask slips out of her hand and three glowing half-masks spin away on a curve to whoever
// she lends them to, where they land in a flash, a ring and a whirl of violet motes (a mask stamped in
// light for a moment). The wall masks sleep again, and her own mask comes home.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support, element: arcane.
//   0-1000    GATHER: she draws a breath, leaning back (anticipation) as the mask rises and brightens;
//             the wall masks wake in a ripple outward from her, the moon in the window brightens.
//   1000-1300 she swings forward toward T and throws: the mask tips, the wall masks flare together
//             (BEATS.release 1300: the first half-mask leaves her hand).
//   1300-2000 three half-masks spin away along a curve to T, one after another, with motes in their wake.
//   2000      THE GIFT (BEATS.impact): the first lands at T: a flash, rings, a half-mask stamped in light, motes whirling up.
//   2000-3400 the whirl turns and thins; she settles (a follow-through sway); her mask fades back onto her
//             face; the wall masks drift back to sleep.
//   3800      at rest as drawn (the move ends at END).
//
// The contract (bakeoff/recipe.md): the gift goes to T = k.aim || her own target, the half-carved mask on the
// workbench (k.spec.alone). She leans toward T and the masks leave from k.spec.emit; every point of their
// way is worked out from that and T. What flies and lands is on the overlay, since T may be on another card.
export const END = 4200;
export const BEATS = { release: 1300, impact: 2000, settle: 3800 };
export const STILLS = [450, 900, 1250, 1500, 1800, 2050, 2700, 4000];

export const textures = {
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [236, 224, 255, Math.min(1, c * c * 1.6)]; }],
};

export function build(k) {
  const { act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const fx = (el, list) => { let last = -1; k.fx(el, list.slice().sort((a, b) => a[0] - b[0]).map((e) => { last = Math.max(last + 1, Math.min(e[0], k.END - 1)); return [last, ...e.slice(1)]; })); };
  const S = k.spec, E = S.emit, FEET = S.feet, T = k.aim || S.alone;
  const side = T[0] >= 150 ? 1 : -1, ang = (v) => (Math.atan2(v[1], v[0]) * 180) / Math.PI;
  k.css('.g-white { border-radius: 50%; background: radial-gradient(closest-side, rgba(250,244,255,.95), rgba(226,208,255,.5) 35%, rgba(190,150,255,.14) 66%, rgba(180,140,255,0) 100%); }');
  const track = (keys) => (t) => {
    let i = keys.length - 1;
    while (i > 0 && keys[i][0] > t) i--;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const f = b[0] === a[0] ? 0 : sm(Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))));
    return a.slice(1).map((v, j) => v + (b[j + 1] - v) * f);
  };
  const grid = []; for (let t = 0; t <= 3700; t += 50) grid.push(t);
  const sample = (fn, rest = {}) => [...grid.map((t) => [t, fn(t), 'linear']), [3800, { transform: 'none', ...rest }]];

  // ── her: she leans back to gather (anticipation), forward into the throw, and settles in a slow sway
  const lean = track([[0, 0, 0], [350, -1.2 * side, 0.6], [1000, -2.2 * side, 1.4], [1300, 2.8 * side, -0.4], [1600, 1.6 * side, 0], [2300, 0.5 * side, 0.3], [3000, -0.3 * side, 0], [3700, 0, 0]]);
  // ── her mask: it rises and brightens as she gathers, tips toward T and slips from her hand, dims, then returns
  const maskT = track([[0, 0, 0, 0, 1], [900, -2, -5, -8 * side, 1.12], [1250, 4 * side, -3, 14 * side, 1.18], [1500, 0, 0, 22 * side, 1], [2500, 0, 0, 22 * side, 1], [3300, 0, 0, 0, 1]]);
  const maskO = track([[0, 1], [1200, 1], [1420, 0.25], [2500, 0.25], [3200, 1]]);
  act(k.part('her'), sample((t) => { const [r, dy] = lean(t); return { transform: `${k.T(0, dy)} rotate(${r.toFixed(2)}deg)` }; }));
  act(k.part('mask'), sample((t) => {
    const [r, dy] = lean(t), [mx, my, mr, ms] = maskT(t);
    // (it turns with her about her feet: the shift of the mask's place under her lean, approximated by its height over her feet)
    const sw = ((E[1] - FEET[1]) * Math.sin((r * Math.PI) / 180)) * -1;
    return { transform: `${k.T(mx + sw, my + dy)} rotate(${mr.toFixed(2)}deg) scale(${ms.toFixed(3)})`, opacity: +maskO(t)[0].toFixed(2) };
  }, { opacity: 1 }));

  // ── the masks on the walls wake in a ripple outward from her, flare as she throws, and sleep again
  const spots = [];
  for (let row = 0; row < 5; row++) for (let i = 0; i < 4; i++) {
    spots.push([14 + i * 21 + (row % 2) * 9, 26 + row * 30]);
    spots.push([300 - (14 + i * 21 + ((row + 1) % 2) * 9), 26 + row * 30]);
  }
  for (const [x, y] of spots) {
    if (Math.hypot(x - 150, y - 82) < 72) continue;
    const dist = Math.hypot(x - E[0], y - E[1]), t0 = 220 + dist * 3.6 + rand() * 50, eyes = [x, y - 0.5];
    fx(k.lightIn('g-violet', eyes, 26, 20), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 260, { transform: 'scale(1)', opacity: 0.8 }, eio], [1180, { transform: 'scale(1)', opacity: 0.45 }, 'ease-in'],
      [1330, { transform: 'scale(1.3)', opacity: 0.95 }, 'ease-out'], [1700, { transform: 'scale(1.05)', opacity: 0.6 }, eio], [2300 + dist * 2, { transform: 'scale(1)', opacity: 0.4 }, eio], [3300 + dist, { transform: 'scale(.6)', opacity: 0 }]]);
  }
  // the moon in the round window, and the room, brighten with her
  fx(k.lightIn('g-violet', [150, 82], 170, 150), [[300, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(1)', opacity: 0.4 }, eio], [1330, { transform: 'scale(1.1)', opacity: 0.6 }, 'ease-out'], [2200, { transform: 'scale(1)', opacity: 0.3 }, eio], [3400, { transform: 'scale(.8)', opacity: 0 }]]);
  // light at her mask, swelling as she gathers, flaring as it leaves, then back
  const hm = [[0, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [500, { transform: 'scale(1.1)', opacity: 0.6 }, eio], [950, { transform: 'scale(1.7)', opacity: 0.9 }, eio], [1300, { transform: 'scale(2.4)', opacity: 1 }, 'ease-out'], [1650, { transform: 'scale(1.2)', opacity: 0.4 }, eio],
    [2600, { transform: 'scale(1)', opacity: 0.3 }, eio], [3100, { transform: 'scale(1.5)', opacity: 0.9 }, 'ease-out'], [3600, { transform: 'scale(.8)', opacity: 0 }]];
  fx(k.light('g-violet', E, 44), hm);
  // motes of light rising off her as she gathers
  for (let i = 0; i < 10; i++) {
    const x = 128 + rand() * 44, t = 200 + rand() * 900, s = 2 + rand() * 2.4;
    fx(k.picIn('mote', [x, 76 + rand() * 40], s, s), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 150, { transform: `${k.T(0, -4)} scale(1)`, opacity: 0.9 }, 'linear'], [t + 900, { transform: `${k.T((rand() - 0.5) * 12, -34 - rand() * 20)} scale(.5)`, opacity: 0 }]]);
  }

  // ── THE HALF-MASKS: three of them leave her hand one after another and spin away along a curve to T
  const maskSvg = (a, b) => k.svg(`<defs><filter id="b"><feGaussianBlur stdDeviation="1.2"/></filter></defs><g filter="url(#b)" opacity=".8"><path d="M2,6Q10,-2 20,4Q30,-2 38,6L35,17Q30,20 25,17L20,14L15,17Q10,20 5,17Z" transform="translate(2 4)" fill="${b}"/></g>` +
    `<path d="M2,6Q10,-2 20,4Q30,-2 38,6L35,17Q30,20 25,17L20,14L15,17Q10,20 5,17Z" transform="translate(2 4)" fill="${a}"/>` +
    '<path d="M7.6,10.4Q12,7.6 17,11.4Q12,14.2 7.6,10.4ZM32.4,10.4Q28,7.6 23,11.4Q28,14.2 32.4,10.4Z" transform="translate(2 4)" fill="#3a2a5c"/>', 44, 28);
  const m1 = maskSvg('#f2ecff', '#c9a6ff');
  const L = Math.hypot(T[0] - E[0], T[1] - E[1]) || 1, nrm = [-(T[1] - E[1]) / L, (T[0] - E[0]) / L];
  const FLY = 700, [X0, Y0] = k.P(...E);
  const bz = (c, t) => { const q = 1 - t; return [q * q * E[0] + 2 * q * t * c[0] + t * t * T[0], q * q * E[1] + 2 * q * t * c[1] + t * t * T[1]]; };
  const P = (p, off) => { const [x, y] = k.P(p[0] + off[0], p[1] + off[1]); return [x - X0, y - Y0]; };
  for (let i = 0; i < 3; i++) {
    const t0 = 1300 + i * 110, lane = i - 1, bulge = Math.min(42, 20 + L * 0.16), C = [(E[0] + T[0]) / 2 + nrm[0] * lane * 9, Math.min(E[1], T[1]) - bulge - 4 * i + nrm[1] * lane * 6];
    const off = [nrm[0] * lane * 3, nrm[1] * lane * 3], list = [], nf = 10, spinDir = side * (i % 2 ? -1 : 1);
    for (let j = 0; j <= nf; j++) {
      const f = j / nf, [x, y] = P(bz(C, sm(f) * 0.4 + f * 0.6), off), sc = 0.35 + 0.65 * Math.min(1, j / 3) - 0.18 * f;
      list.push([Math.round(t0 + (FLY * j) / nf), { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${Math.round(spinDir * (f * 340) + (i - 1) * 10 + 8 * side)}deg) scale(${sc.toFixed(2)})`, opacity: j === 0 ? 0 : 1 }, 'linear']);
    }
    const [xe, ye] = P(T, off), tl = t0 + FLY;
    list.push([tl + 90, { transform: `translate(${xe.toFixed(1)}px, ${ye.toFixed(1)}px) rotate(${Math.round(spinDir * 380)}deg) scale(1.05)`, opacity: 1 }, 'ease-out'], [tl + 330, { transform: `translate(${xe.toFixed(1)}px, ${ye.toFixed(1)}px) rotate(${Math.round(spinDir * 400)}deg) scale(1.5)`, opacity: 0 }]);
    fx(k.pic(m1, E, 17, 11, { lit: false }), list);
    // a light riding with it, and motes shed in its wake
    const gl = [[t0, { transform: 'scale(.3)', opacity: 0 }, 'ease-out']];
    for (let j = 1; j <= nf; j += 2) { const [x, y] = P(bz(C, sm(j / nf) * 0.4 + (j / nf) * 0.6), off); gl.push([Math.round(t0 + (FLY * j) / nf), { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(0.7 + 0.06 * j).toFixed(2)})`, opacity: 0.85 }, 'linear']); }
    gl.push([tl + 250, { transform: `translate(${xe.toFixed(1)}px, ${ye.toFixed(1)}px) scale(1.4)`, opacity: 0 }]);
    fx(k.light('g-violet', E, 20), gl);
    for (let j = 1; j < 8; j++) {
      const f = (j / 8) * 0.9, [x, y] = P(bz(C, sm(f) * 0.4 + f * 0.6), off), t = Math.round(t0 + FLY * f), s = 2.2 + rand() * 2.6;
      fx(k.pic('mote', E, s, s), [[t, { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 90, { transform: `translate(${x.toFixed(1)}px, ${(y + (rand() - 0.2) * 3 * k.u).toFixed(1)}px) scale(1)`, opacity: 0.9 }, 'linear'], [t + 560, { transform: `translate(${(x + (rand() - 0.5) * 8 * k.u).toFixed(1)}px, ${(y + 8 * k.u).toFixed(1)}px) scale(.3)`, opacity: 0 }]]);
    }
  }
  // a flare at her hand as it throws
  [[1280, 3, 0.9], [1400, 2.2, 0.55]].forEach(([t, s2, o]) => fx(k.pic(k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#e6d6ff" stroke-width="2.6" filter="url(#b)"/>', 60, 60), E, 24, 24), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 60, { transform: 'scale(.6)', opacity: o }], [t + 800, { transform: `scale(${s2})`, opacity: 0 }]]));

  // ── THE GIFT (BEATS.impact): a flash and rings at T, a half-mask stamped in light, a whirl of motes
  fx(k.light('g-violet', T, 84), [[1930, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [2030, { transform: 'scale(1.2)', opacity: 1 }, eio], [2400, { transform: 'scale(1.35)', opacity: 0.65 }, eio], [3000, { transform: 'scale(1.55)', opacity: 0.3 }, eio], [3600, { transform: 'scale(1.8)', opacity: 0 }]]);
  fx(k.light('g-white', T, 30), [[1950, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [2040, { transform: 'scale(1.3)', opacity: 0.95 }, 'ease-out'], [2300, { transform: 'scale(1)', opacity: 0.3 }, eio], [2700, { transform: 'scale(.6)', opacity: 0 }]]);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#efe4ff" stroke-width="2.6" filter="url(#b)"/>', 60, 60);
  [[2000, 3.8, 0.95], [2180, 2.9, 0.7], [2400, 2.2, 0.5]].forEach(([t, s2, o]) => fx(k.pic(ring, T, 26, 26), [[t, { transform: 'scale(.25)', opacity: 0 }, 'ease-out'], [t + 70, { transform: 'scale(.55)', opacity: o }], [t + 950, { transform: `scale(${s2})`, opacity: 0 }]]));
  // the stamp: a half-mask in light that blooms over T and fades
  fx(k.pic(maskSvg('#ffffff', '#d6c0ff'), T, 24, 15, { lit: false }), [[1990, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [2090, { transform: 'scale(1.1)', opacity: 0.95 }, 'ease-out'], [2400, { transform: `${k.T(0, -2)} scale(1.3)`, opacity: 0.7 }, eio], [2900, { transform: `${k.T(0, -7)} scale(1.7)`, opacity: 0 }]]);
  // a ripple spreading flat along the floor or sea under it
  fx(k.pic(ring, [T[0], T[1] + 6], 40, 10), [[2020, { transform: 'scale(.2, .2)', opacity: 0 }, 'ease-out'], [2120, { transform: 'scale(.6, .6)', opacity: 0.8 }], [3000, { transform: 'scale(2.3, 1.5)', opacity: 0 }]]);
  const feather = k.svg('<path d="M0,3Q5,0 12,2.4Q6,6 0,3Z" fill="#f4ecff"/>', 12, 6);
  for (let i = 0; i < 24; i++) {
    const th0 = rand() * Math.PI * 2, spin = i % 2 ? 1 : -1, r0 = 4 + rand() * 6, r1 = 14 + rand() * 18, t0 = 1990 + rand() * 450, dur = 1000 + rand() * 700, kind = i % 4 === 0 ? feather : 'mote', sz = kind === feather ? 5 + rand() * 3 : 2.6 + rand() * 3, list = [];
    for (let j = 0; j <= 7; j++) {
      const f = j / 7, th = th0 + spin * f * Math.PI * 2.4, r = r0 + (r1 - r0) * f;
      list.push([Math.round(t0 + dur * f), { transform: `${k.T(Math.cos(th) * r * 1.2, Math.sin(th) * r * 0.75 - f * 12)} rotate(${Math.round(th * 57 + 90)}deg) scale(${(0.5 + 0.7 * Math.sin(Math.PI * Math.min(1, f * 1.05))).toFixed(2)})`, opacity: j === 0 || j === 7 ? 0 : 0.9 }, 'linear']);
    }
    fx(k.pic(kind, T, sz, kind === feather ? sz * 0.5 : sz), list);
  }
}
