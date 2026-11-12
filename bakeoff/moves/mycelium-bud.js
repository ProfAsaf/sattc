// Mycelium Bud: the network wakes, the big cap breathes out its spores, and new caps pop up.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support (Multiply: it makes
// more of itself, a boon it sends on; power 1 but it is a grower), element: nature.
// Its parts: the eleven mushrooms m0 (the big one) .. m10, each about its foot in the moss.
//   0-300     still, a faint sway.
//   300-1000  the network wakes (anticipation): pulses of light run out along the threads
//             under the moss from the middle, and the mushrooms dip one after another
//             outward from the big one (a ripple), each cap's light swelling as the pulse
//             reaches it; the big cap sinks a little, gathering.
//   1100      RELEASE (BEATS.release): the big cap breathes out (squashes, then leans toward
//             T), a puff of spores under it, and a stream of spores and drifting clouds
//             arcs from `emit` to T, on the overlay.
//   1800      LANDS (BEATS.impact) at T = k.aim, else the moss on its right: a flash, a ring,
//             a burst of spores, and three little caps popping up there, glowing.
//   1300-3000 it multiplies: a second pulse runs out along the threads and every mushroom
//             swells in a ripple; little new caps pop up all round its own mound (they
//             dissolve into spores again); then everything eases back.
//   3600      at rest as drawn (the move ends at END).
//
// The contract: the boon leaves from `emit` (under the big cap) and goes to T.
export const END = 4200;
export const BEATS = { release: 1100, impact: 1800, settle: 3600 };
export const STILLS = [450, 800, 1150, 1450, 1800, 2200, 2900, 3900];

export const textures = {
  spore: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [240, 255, 190, Math.min(1, c * c * 1.5)]; }],
  cloud: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226, 246, 160, 0.55 * c * c * (0.8 + 0.2 * Math.sin(x * 14 + y * 9))]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, sm = k.smooth, eio = 'ease-in-out';
  const S = k.spec, E = S.emit, T = k.aim || S.alone;
  const CAP = S.caps, BASE = S.bases;
  const dirT = T[0] >= BASE[0][0] ? 1 : -1;
  const CX = 150, CY = 181; // the heart of the network, under the big mushroom

  k.css(`.g-myc { border-radius: 50%; background: radial-gradient(closest-side, rgba(250,255,214,.95), rgba(222,248,150,.55) 30%, rgba(170,224,120,.2) 60%, rgba(120,200,110,0) 100%); }`);

  const bump = (t, c, w) => Math.exp(-(((t - c) / w) ** 2));
  const dist = (i) => Math.hypot(BASE[i][0] - CX, BASE[i][1] - CY);
  const grid = [];
  for (let t = 0; t <= 3540; t += 30) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3660, { transform: 'none' }]];

  // ── the mushrooms: dip as the pulse reaches them, breathe, swell in a ripple, ease back
  for (let i = 0; i < 11; i++) {
    const d = dist(i) * 3.2, big = i === 0, small = i >= 3;
    act(k.part(`m${i}`), sample((t) => {
      const env = bump(t, 250, 300) * 0 + Math.min(1, t / 300) * Math.min(1, Math.max(0, (3500 - t) / 500));
      let sy = 1, sx = 1, r = 0.9 * env * Math.sin(t / 430 + i * 1.7) * (small ? 1.5 : 1);
      const dip = bump(t, 520 + d, 190);
      sy -= (big ? 0.045 : 0.06) * dip; sx += 0.03 * dip;
      const sw1 = bump(t, 1400 + d * 0.9, 260), sw2 = bump(t, 2250 + d * 0.9, 330);
      sy += (small ? 0.2 : 0.085) * sw1 + (small ? 0.12 : 0.05) * sw2;
      sx += (small ? 0.11 : 0.05) * sw1 + (small ? 0.06 : 0.03) * sw2;
      if (big) {
        sy += -0.075 * bump(t, 1130, 90) + 0.05 * bump(t, 1290, 110);
        sx += 0.05 * bump(t, 1130, 90) - 0.025 * bump(t, 1290, 110);
        r += dirT * (-1.5 * bump(t, 950, 160) + 5 * bump(t, 1330, 230) + 1.2 * bump(t, 1800, 300));
      }
      return { transform: `rotate(${r.toFixed(2)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})` };
    }));
  }

  // ── the glow under each cap swells as the pulse reaches it, and again as it multiplies
  CAP.forEach(([x, y], i) => {
    const rx = [30, 20, 17, 10, 8, 6, 4, 4.4, 4.4, 3, 3][i], d = dist(i) * 3.2, w = Math.max(18, rx * 3.4);
    for (const [t0, o, hold] of [[Math.round(480 + d), 0.65, 460], [Math.round(1380 + d * 0.9), 0.85, 700]]) {
      fx(k.lightIn('g-myc', [x, y + 3], w, w * 0.55), [[t0, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t0 + 220, { transform: 'scale(1)', opacity: o }, eio], [t0 + hold, { transform: 'scale(1.15)', opacity: o * 0.6 }, eio], [t0 + hold + 450, { transform: 'scale(.8)', opacity: 0 }]]);
    }
  });

  // ── pulses of light running out along the threads under the moss (the network waking, then again as it multiplies)
  const paths = [[[150, 181], [124, 187], [96, 195], [66, 205]], [[150, 181], [176, 189], [210, 195], [244, 207]], [[124, 187], [118, 199], [104, 213]], [[176, 189], [186, 201], [180, 213]],
    [[96, 195], [84, 191], [74, 189]], [[210, 195], [222, 191], [232, 189]], [[150, 181], [148, 197], [142, 213]]];
  const SPEED = 0.17; // units per ms
  const seg = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const delay = [0, 0, seg(paths[0][0], paths[0][1]), seg(paths[1][0], paths[1][1]), seg(paths[0][0], paths[0][1]) + seg(paths[0][1], paths[0][2]), seg(paths[1][0], paths[1][1]) + seg(paths[1][1], paths[1][2]), 0];
  for (const [t00, o] of [[360, 0.85], [1350, 1]]) {
    paths.forEach((p, n) => {
      const t0 = Math.round(t00 + delay[n] / SPEED), keys = [];
      let t = t0;
      const [x0, y0] = p[0];
      keys.push([t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out']);
      p.forEach((q, j) => {
        if (j) t += seg(p[j - 1], q) / SPEED;
        keys.push([Math.round(t), { transform: `${k.T(q[0] - x0, q[1] - y0)} scale(${j === 1 ? 1 : 0.9 - 0.1 * j})`, opacity: j === p.length - 1 ? o * 0.5 : o }, 'linear']);
      });
      keys.push([Math.round(t + 260), { transform: `${k.T(p[p.length - 1][0] - x0, p[p.length - 1][1] - y0)} scale(.3)`, opacity: 0 }]);
      keys[1][1].opacity = o; // (it's at full strength a moment after it starts)
      fx(k.lightIn('g-myc', [x0, y0], 15, 11), keys);
    });
  }
  // a soft light over the whole mound: the network, then the multiplying
  fx(k.lightIn('g-myc', [150, 150], 270, 110), [[300, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(1)', opacity: 0.4 }, eio], [1500, { transform: 'scale(1.05)', opacity: 0.65 }, eio], [2500, { transform: 'scale(1.1)', opacity: 0.55 }, eio], [3500, { transform: 'scale(.9)', opacity: 0 }]]);

  // ── spores drifting from the big cap's gills as it gathers, then a puff as it breathes out
  for (let n = 0; n < 16; n++) {
    const t = 640 + n * 30 + rand() * 40, x = 128 + rand() * 40, sz = 2.4 + rand() * 2.6, dx = (rand() - 0.5) * 14, dy = 8 + rand() * 12;
    fx(k.pic('spore', [x, E[1] + 1], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 100, { transform: 'scale(1)', opacity: 0.9 }, 'linear'], [t + 520 + rand() * 200, { transform: `${k.T(dx, dy)} scale(.5)`, opacity: 0 }]]);
  }
  fx(k.light('g-myc', E, 64), [[1000, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1120, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [1600, { transform: 'scale(1.5)', opacity: 0 }]]);

  // ── the stream (BEATS.release to .impact): spores and clouds along an arc from under the big cap to T
  const C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 30];
  const bz = (q) => { const w = 1 - q; return [w * w * E[0] + 2 * w * q * C[0] + q * q * T[0], w * w * E[1] + 2 * w * q * C[1] + q * q * T[1]]; };
  const [X0, Y0] = k.P(...E);
  for (let n = 0; n < 38; n++) {
    const cloud = n % 5 === 4, t0 = 1100 + n * 16, sz = cloud ? 15 + rand() * 6 : 4.5 + rand() * 4.5, side = (rand() - 0.5) * 12, dur = 560 + rand() * 120, spin = Math.round((rand() - 0.5) * 200);
    const at = (f, sc, o) => { const [x, y] = k.P(...bz(f)); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + side * Math.sin(Math.PI * f) * u).toFixed(1)}px) rotate(${Math.round(spin * f)}deg) scale(${sc})`, opacity: o }; };
    fx(k.pic(cloud ? 'cloud' : 'spore', E, sz, sz), [[t0, at(0, 0.4, 0), 'ease-out'], [t0 + 60, at(0.08, 1, cloud ? 0.8 : 1), 'linear'], [t0 + dur * 0.5, at(0.5, cloud ? 1.3 : 1, cloud ? 0.8 : 1), 'linear'], [t0 + dur, at(1, cloud ? 1.6 : 1.1, 0.9), 'ease-out'], [t0 + dur + 220, at(1, cloud ? 2.2 : 0.4, 0)]]);
  }

  // ── a little mushroom, as drawn in the picture: dark stem and cap, pale rim, glowing gills
  const mini = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs>'
    + '<path d="M9,31C9.4,24 9.2,18 8.4,13.5L11.8,13.5C11.2,18 11,24 11.4,31Z" fill="#e6f0b0" transform="translate(-.5 -.6)"/>'
    + '<path d="M1,13C1,5 6,1.5 10.5,1.5C15,1.5 20,5 20,13C17,15.2 4,15.2 1,13Z" fill="#e6f0b0" transform="translate(-.5 -.7)"/>'
    + '<path d="M9,31C9.4,24 9.2,18 8.4,13.5L11.8,13.5C11.2,18 11,24 11.4,31Z" fill="#1b2714"/>'
    + '<path d="M1,13C1,5 6,1.5 10.5,1.5C15,1.5 20,5 20,13C17,15.2 4,15.2 1,13Z" fill="#1b2714"/>'
    + '<g filter="url(#b)"><ellipse cx="10.5" cy="12.8" rx="8" ry="2" fill="#f2ffbc"/></g><ellipse cx="10.5" cy="12.8" rx="7.2" ry="1.4" fill="#fbffe0"/>'
    + '<circle cx="7" cy="6.5" r=".9" fill="#f4ffc4"/><circle cx="12" cy="5" r="1" fill="#f4ffc4"/>', 21, 32);
  // it pops up at [x, y] (its foot), height h, from `on` to `off`; inside the picture (`inside`) or on the overlay
  const pop = (x, y, h, on, off, inside) => {
    const w = h * 0.66, pic = inside ? k.picIn : k.pic;
    fx(pic(mini, [x, y + 1], w, h, { base: true, lit: false }), [[on, { transform: 'scale(.1, .02)', opacity: 0 }, 'cubic-bezier(.2,.8,.3,1)'], [on + 260, { transform: 'scale(1.1, 1.2)', opacity: 1 }, eio], [on + 420, { transform: 'scale(1, 1)', opacity: 1 }, eio],
      [off - 500, { transform: 'scale(1.03, .98) rotate(1.5deg)', opacity: 1 }, eio], [off - 150, { transform: 'scale(1, 1) rotate(-1.5deg)', opacity: 0.8 }, eio], [off, { transform: 'scale(.6, .5)', opacity: 0 }]]);
    fx(pic === k.pic ? k.light('g-myc', [x, y - h * 0.55], h * 1.9) : k.lightIn('g-myc', [x, y - h * 0.55], h * 1.9, h * 1.5), [[on + 80, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [on + 360, { transform: 'scale(1)', opacity: 0.9 }, eio], [off - 500, { transform: 'scale(1.1)', opacity: 0.6 }, eio], [off, { transform: 'scale(.6)', opacity: 0 }]]);
  };

  // ── where it lands (BEATS.impact): a flash, rings, a burst of spores, three caps popping up
  const I = 1800;
  const ringC = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#f4ffd0" stroke-width="3" filter="url(#b)"/>', 60, 60);
  fx(k.light('g-myc', T, 76), [[I - 60, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [I + 40, { transform: 'scale(1.3)', opacity: 1 }, eio], [I + 300, { transform: 'scale(1.4)', opacity: 0.6 }, eio], [2700, { transform: 'scale(1.4)', opacity: 0.4 }, eio], [3300, { transform: 'scale(1)', opacity: 0 }]]);
  [[0, 3.3, 0.9], [150, 2.4, 0.6]].forEach(([dt, sc, o]) => fx(k.pic(ringC, T, 26, 26), [[I + dt, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [I + dt + 50, { transform: 'scale(.6)', opacity: o }], [I + dt + 800, { transform: `scale(${sc})`, opacity: 0 }]]));
  for (let n = 0; n < 18; n++) {
    const a = rand() * Math.PI * 2, dist2 = 8 + rand() * 26, sz = 3 + rand() * 4, t = I + rand() * 120;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * dist2 * f, Math.sin(a) * dist2 * f * 0.7 - 18 * f)} scale(${sc})`, opacity: o });
    fx(k.pic('spore', T, sz, sz), [[t, P(0, 0.5, 0), 'ease-out'], [t + 60, P(0.2, 1.1, 1), 'ease-out'], [t + 900 + rand() * 500, P(1, 0.4, 0)]]);
  }
  pop(T[0] - 9, T[1] + 4, 14, I + 60, 3350);
  pop(T[0] + 8, T[1] + 3, 18, I + 170, 3500);
  pop(T[0] + 1, T[1] + 7, 10, I + 290, 3300);

  // ── it multiplies: little new caps pop up round its own mound, in a ripple, and dissolve again
  [[118, 196, 12, 1500], [180, 197, 14, 1620], [208, 200, 10, 1740], [94, 200, 9, 1840], [234, 205, 8, 1960], [64, 210, 7, 2080]].forEach(([x, y, h, on]) => pop(x, y, h, on, on + 1500, true));
  // spores rising from the whole mound
  for (let n = 0; n < 16; n++) {
    const t = 1500 + n * 90 + rand() * 60, x = 70 + rand() * 160, y = 170 + rand() * 25, sz = 2.4 + rand() * 3, dx = (rand() - 0.5) * 18;
    fx(k.pic('spore', [x, y], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 150, { transform: `${k.T(dx * 0.2, -6)} scale(1)`, opacity: 0.95 }, 'linear'], [t + 1000, { transform: `${k.T(dx, -34 - rand() * 14)} scale(.4)`, opacity: 0 }]]);
  }
}
