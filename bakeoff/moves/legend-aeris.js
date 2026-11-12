// Aeris, Queen of the Winds: she lends the sky. A great wingbeat and a sweep of her raised arm
// send a flock of her birds, carried on a gust, to whoever she gives the sky to.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support, element: wind.
//   0-700     she gathers: her wings drop (anticipation), her raised arm winds back, the
//             updraft off the sea quickens, light gathers at her hand and crown, the birds
//             in her cloak begin to turn.
//   700-1100  THE SWEEP: her wings beat up, hard, her whole figure rising on the stroke;
//             her raised arm throws toward T (BEATS.release 1100: the flock leaves her
//             hand): the cloak surges, flaring, the light at her crown, wings and hand.
//   1100-1800 the flock streams along a curve from her hand to T on a gust (puffs of wind,
//             nine birds one after another, each beating its wings).
//   1800      THE GIFT (BEATS.impact): the first birds arrive at T: a flash of pale light,
//             rings, a whirl of motes and feathers; the flock circles T.
//   1800-3200 the whirl turns and widens; the flock lifts away and thins out; her wings
//             settle in beats, the cloak and birds in it wheel home, the arm lowers.
//   3800      at rest as drawn (the move ends at END).
//
// The contract (bakeoff/recipe.md): the gift goes to T = k.aim || her own target, the sky over
// the left cliff (k.spec.alone). Her raised arm turns from the shoulder toward T (as far as it
// reaches), and the flock leaves from her hand's place at the throw; every point of its way is
// worked out from that and T. What flies and lands is on the overlay, since T may be on another card.
export const END = 4200;
export const BEATS = { release: 1100, impact: 1800, settle: 3800 };
export const STILLS = [350, 800, 1100, 1400, 1800, 2200, 2900, 4000];

export const textures = {
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [236, 253, 250, Math.min(1, c * c * 1.5)]; }],
  gust: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, n = 0.8 + 0.2 * Math.sin(x * 15 + y * 9) * Math.cos(y * 11 - x * 6); return [232, 252, 250, Math.max(0, 1 - r) * 0.7 * n]; }],
};

export function build(k) {
  const { act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const fx = (el, list) => { let last = -1; k.fx(el, list.slice().sort((a, b) => a[0] - b[0]).map((e) => { last = Math.max(last + 1, Math.min(e[0], k.END - 1)); return [last, ...e.slice(1)]; })); };
  const S = k.spec, SH = S.shoulder, HAND = S.hand, LOOP = S.loop, CROWN = S.crownAt;
  const T = k.aim || S.alone;
  k.css(`.g-wind { border-radius: 50%; background: radial-gradient(closest-side, rgba(250,255,252,.95), rgba(214,248,246,.55) 30%, rgba(170,232,238,.16) 60%, rgba(150,225,235,0) 100%); }
    .fx-copy.f-hot { mix-blend-mode: plus-lighter; filter: brightness(1.4) saturate(1.1); }`);

  // ── a keyed curve: values at moments, eased between
  const track = (keys) => (t) => {
    let i = keys.length - 1;
    while (i > 0 && keys[i][0] > t) i--;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const f = b[0] === a[0] ? 0 : sm(Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))));
    return a.slice(1).map((v, j) => v + (b[j + 1] - v) * f);
  };
  const grid = []; for (let t = 0; t <= 3800; t += 40) grid.push(t);
  const sample = (fn, rest = {}) => [...grid.map((t) => [t, fn(t), 'linear']), [3900, { transform: 'none', ...rest }]];

  // ── where the raised arm goes: toward T (turning from the shoulder as far as it reaches)
  const ang = (v) => (Math.atan2(v[1], v[0]) * 180) / Math.PI;
  let dA = ang([T[0] - SH[0], T[1] - SH[1]]) - ang([HAND[0] - SH[0], HAND[1] - SH[1]]);
  dA = ((dA + 540) % 360) - 180; dA = Math.max(-70, Math.min(115, dA));
  const rotAbout = (p, c, deg) => { const r = (deg * Math.PI) / 180; return [c[0] + (p[0] - c[0]) * Math.cos(r) - (p[1] - c[1]) * Math.sin(r), c[1] + (p[0] - c[0]) * Math.sin(r) + (p[1] - c[1]) * Math.cos(r)]; };
  const wind = -Math.sign(dA || 1) * 9;
  const armA = track([[0, 0], [350, 0], [740, wind], [1060, dA * 1.06], [1260, dA], [2100, dA * 0.94], [3350, 0]]);
  const E = rotAbout(HAND, SH, dA); // the hand as it throws: where the flock leaves
  // the hover: she rises on each wingbeat
  const bob = track([[0, 0], [420, 1.6], [900, -2.8], [1300, -1.2], [1700, -2.6], [2100, -1], [2600, -2.2], [3200, -0.6], [3700, 0]]);
  const wingA = track([[0, 0], [380, -6], [720, -13], [1000, 21], [1250, 12], [1520, 3], [1820, 16], [2160, 4], [2520, 12], [3000, 2], [3700, 0]]);
  const surge = track([[0, 0], [700, 0], [1050, 1], [1500, 0.7], [2300, 0.25], [3300, 0]]);

  // ── her: the figure rises on each wingbeat; the raised arm winds back, throws, holds, and lowers
  const dy = (t) => bob(t)[0];
  act(k.part('her'), sample((t) => ({ transform: k.T(0, dy(t)) })));
  act(k.part('armL'), sample((t) => ({ transform: `${k.T(0, dy(t))} rotate(${armA(t)[0].toFixed(2)}deg)` })));
  act(k.part('crown'), sample((t) => ({ transform: `${k.T(0, dy(t))} scale(${(1 + 0.35 * surge(t)[0]).toFixed(3)})` })));
  act(k.part('wingL'), sample((t) => ({ transform: `${k.T(0, dy(t))} rotate(${wingA(t)[0].toFixed(2)}deg)` })));
  act(k.part('wingR'), sample((t) => ({ transform: `${k.T(0, dy(t - 20))} rotate(${(-wingA(t - 25)[0]).toFixed(2)}deg)` })));
  act(k.part('wglow'), sample((t) => ({ transform: `${k.T(0, dy(t))} scale(${(1 + 0.16 * surge(t)[0] + 0.012 * wingA(t)[0]).toFixed(3)})` })));
  // her cloak surges (turning and swelling about its middle) and her birds wheel along it, home again by the end
  const cloakA = track([[0, 0], [900, 0], [1500, 6], [2300, 3.5], [3300, 0]]), birdsA = track([[0, 0], [700, -3], [1500, 13], [2300, 17], [3300, 5], [3800, 0]]);
  act(k.part('cloak'), sample((t) => ({ transform: `${k.T(0, dy(t) * 0.6)} rotate(${cloakA(t)[0].toFixed(2)}deg) scale(${(1 + 0.05 * surge(t)[0]).toFixed(3)})` })));
  act(k.part('wisp'), sample((t) => ({ transform: `${k.T(0, dy(t) * 0.6)} rotate(${(cloakA(t)[0] * 1.3).toFixed(2)}deg) scale(${(1 + 0.05 * surge(t)[0]).toFixed(3)})` })));
  act(k.part('birds'), sample((t) => ({ transform: `${k.T(0, dy(t) * 0.5)} rotate(${birdsA(t)[0].toFixed(2)}deg)` })));
  // a bright copy of the cloak lit over it as it surges
  act(k.copy('cloak', 'f-hot'), sample((t) => ({ transform: `${k.T(0, dy(t) * 0.6)} rotate(${cloakA(t)[0].toFixed(2)}deg) scale(${(1 + 0.05 * surge(t)[0]).toFixed(3)})`, opacity: +(0.7 * surge(t)[0]).toFixed(2) }), { opacity: 0 }));

  // ── the gathering: the updraft quickens, light at her hand and crown, a flare on the wings at the sweep
  const hp = (t) => { const p = rotAbout(HAND, SH, armA(t)[0]); return [p[0] - HAND[0], p[1] - HAND[1] + dy(t)]; };
  act(k.lightIn('g-wind', HAND, 30, 30), [[0, { transform: 'scale(.3)', opacity: 0 }, 'linear'], ...grid.filter((t) => t >= 160 && t <= 3300).map((t) => { const [x, y] = hp(t), g = sm(Math.max(0, Math.min(1, (t - 160) / 700))) * (1 - sm(Math.max(0, Math.min(1, (t - 2300) / 1000)))), f = 0.35 * g + 0.65 * Math.exp(-Math.abs(t - 1100) / 260); return [t, { transform: `${k.T(x, y)} scale(${(0.4 + 0.8 * f + 0.3 * g).toFixed(2)})`, opacity: +Math.min(1, 0.9 * f + 0.4 * g).toFixed(2) }, 'linear']; }), [3400, { transform: 'scale(.3)', opacity: 0 }]]);
  fx(k.lightIn('g-wind', CROWN, 46, 40), [[500, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1020, { transform: 'scale(1.3)', opacity: 0.95 }, eio], [1500, { transform: 'scale(1)', opacity: 0.5 }, eio], [2600, { transform: 'scale(1.1)', opacity: 0.2 }, eio], [3400, { transform: 'scale(.5)', opacity: 0 }]]);
  fx(k.lightIn('g-wind', [150, 66], 220, 90), [[700, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [1020, { transform: 'scale(1)', opacity: 0.85 }, eio], [1300, { transform: 'scale(1.05)', opacity: 0.45 }, eio], [1820, { transform: 'scale(1.05)', opacity: 0.65 }, eio], [2300, { transform: 'scale(1)', opacity: 0.2 }, eio], [3200, { transform: 'scale(.8)', opacity: 0 }]]);
  // the updraft off the sea quickens: a light under her, and streaks rising to her
  fx(k.lightIn('g-wind', [150, 172], 200, 46), [[200, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(1)', opacity: 0.7 }, eio], [1700, { transform: 'scale(1.1)', opacity: 0.5 }, eio], [3000, { transform: 'scale(1)', opacity: 0.2 }, eio], [3700, { transform: 'scale(.6)', opacity: 0 }]]);
  const rise = k.svg('<defs><linearGradient id="g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#effffc" stop-opacity="0"/><stop offset=".5" stop-color="#effffc" stop-opacity=".8"/><stop offset="1" stop-color="#effffc" stop-opacity="0"/></linearGradient></defs>' +
    '<g stroke="url(#g)" stroke-width="1.4" fill="none" stroke-linecap="round"><path d="M10,60Q6,40 12,20M24,64Q30,42 22,16M38,62Q34,38 40,12M52,60Q58,40 50,22M66,58Q62,40 68,26"/></g>', 76, 64);
  for (let i = 0; i < 4; i++) {
    const t = 500 + i * 330, x = 124 + i * 17 + (rand() - 0.5) * 8;
    fx(k.picIn(rise, [x, 168], 38, 32, { base: true }), [[t, { transform: `${k.T(0, 6)} scale(.7, .5)`, opacity: 0 }, 'ease-out'], [t + 220, { transform: `${k.T(0, -6)} scale(1, .9)`, opacity: 0.8 }, 'linear'], [t + 900, { transform: `${k.T(0, -48)} scale(1, 1.3)`, opacity: 0 }]]);
  }

  // ── THE FLOCK: nine birds leave her hand one after another and stream along a curve to T, each beating its wings;
  //    puffs of wind go with them; the first arrive at BEATS.impact and circle T, then lift away
  const gull = k.svg('<path d="M0,5.4Q4,0.4 9,4.4Q14,0.4 18,5.4Q14,3.6 9,7.8Q4,3.6 0,5.4Z" fill="#0d2830" stroke="#e6fdfc" stroke-width=".5" stroke-opacity=".7"/>', 18, 10);
  const dive = k.svg('<path d="M0,6Q5,3 10,5L19,4.4L12,7Q6,8 0,6Z" fill="#0b2229" stroke="#e6fdfc" stroke-width=".5" stroke-opacity=".7"/><path d="M8,5Q10,0.6 15,0.6Q12,3 11,5Z" fill="#0b2229"/>', 20, 10);
  const L = Math.hypot(T[0] - E[0], T[1] - E[1]), nrm = [-(T[1] - E[1]) / (L || 1), (T[0] - E[0]) / (L || 1)];
  const FLY = 700, NB = 9;
  const bz = (c, t) => { const q = 1 - t; return [q * q * E[0] + 2 * q * t * c[0] + t * t * T[0], q * q * E[1] + 2 * q * t * c[1] + t * t * T[1]]; };
  const bearing = (p, q) => ang([q[0] - p[0], q[1] - p[1]]);
  for (let i = 0; i < NB; i++) {
    const lane = (i - (NB - 1) / 2) / ((NB - 1) / 2), t0 = 1100 + i * 75, bulge = Math.min(46, 16 + L * 0.2) * (1 - 0.45 * Math.abs(lane)) + 10 * lane;
    const C = [(E[0] + T[0]) / 2 - nrm[0] * (0.8 * bulge + 6) * (i % 2 ? 1 : 0.5) - 0, (E[1] + T[1]) / 2 - 22 - nrm[1] * (0.8 * bulge) * (i % 2 ? 1 : 0.5)];
    const off = [nrm[0] * lane * 6, nrm[1] * lane * 6 + lane * 2];
    const [X0, Y0] = k.P(...E);
    const list = [], P = (p) => { const [x, y] = k.P(p[0] + off[0], p[1] + off[1]); return [x - X0, y - Y0]; };
    const pts = [];
    const nf = 10;
    for (let j = 0; j <= nf; j++) pts.push(bz(C, sm(j / nf) * 0.5 + (j / nf) * 0.5));
    pts.forEach((p, j) => {
      const [x, y] = P(p), a = bearing(pts[Math.max(0, j - 1)], pts[Math.min(nf, j + 1)]), flap = j % 2 ? 1 : 0.42;
      const sz = 0.35 + 0.65 * Math.min(1, j / 3);
      list.push([Math.round(t0 + (FLY * j) / nf), { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${a.toFixed(1)}deg) scale(${sz.toFixed(2)}, ${(sz * flap).toFixed(2)})`, opacity: j === 0 ? 0 : 1 }, 'linear']);
    });
    // arrived (at t0 + FLY): it circles T (a loop of radius r), then lifts away and fades
    const ta = t0 + FLY, r = 9 + (i % 3) * 4.5 + L * 0.0, spin = i % 2 ? 1 : -1, a0 = bearing(pts[nf - 1], pts[nf]);
    const hd = a0 * (Math.PI / 180);
    // (the circling, done plainly: the bird's place is the circle's centre plus r at an angle that turns; its heading is that angle's tangent)
    const cen = [T[0] + Math.cos(hd + spin * 1.5708) * r, T[1] + Math.sin(hd + spin * 1.5708) * r];
    for (let j = 1; j <= 12; j++) {
      const f = j / 12, th = hd - spin * 1.5708 + spin * f * Math.PI * 2.2, q = [cen[0] + Math.cos(th) * r, cen[1] + Math.sin(th) * r - f * 4];
      const [x, y] = P(q), a = ((th + spin * 1.5708) * 180) / Math.PI, flap = j % 2 ? 1 : 0.45, fl = 1 - 0.12 * f;
      list.push([Math.round(ta + 55 + f * 760), { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${a.toFixed(1)}deg) scale(${fl.toFixed(2)}, ${(fl * flap).toFixed(2)})`, opacity: 1 }, 'linear']);
    }
    // then it lifts away, up and out, fading
    const tl = ta + 55 + 760, away = [(rand() - 0.5) * 70 + (T[0] < 150 ? -30 : 30), -(40 + rand() * 40)], [xe, ye] = P([T[0] + away[0], T[1] + away[1]]);
    list.push([tl + 420, { transform: `translate(${xe.toFixed(1)}px, ${ye.toFixed(1)}px) rotate(${Math.round(bearing([0, 0], away))}deg) scale(.5, .3)`, opacity: 0 }, 'ease-in']);
    fx(k.pic(i % 3 === 1 ? dive : gull, E, 11, 6, { lit: false }), list);
    // a puff of wind riding with it
    if (i % 2 === 0) {
      const [px0, py0] = P(E), r0 = Math.round(rand() * 360);
      const pl = [[t0, { transform: `rotate(${r0}deg) scale(.4)`, opacity: 0 }, 'ease-out']];
      pts.forEach((p, j) => { if (j % 2 === 0 && j > 0) { const [x, y] = P(p); pl.push([Math.round(t0 + (FLY * j) / nf), { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${r0 + j * 14}deg) scale(${(0.6 + 0.07 * j).toFixed(2)})`, opacity: 0.55 }, 'linear']); } });
      const [xl, yl] = P(T); pl.push([t0 + FLY + 260, { transform: `translate(${xl.toFixed(1)}px, ${yl.toFixed(1)}px) rotate(${r0 + 170}deg) scale(1.5)`, opacity: 0 }, 'ease-out']);
      fx(k.pic('gust', E, 20, 20, { lit: false }), pl);
    }
  }
  // a gust at her hand as it throws
  for (let j = 0; j < 4; j++) {
    const r = Math.round(rand() * 360), t = 1040 + j * 60;
    fx(k.pic('gust', E, 18, 18, { lit: false }), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 130, { transform: `${k.T((T[0] - E[0]) * 0.06 * (j + 1), (T[1] - E[1]) * 0.06 * (j + 1))} rotate(${r + 40}deg) scale(1.1)`, opacity: 0.6 }], [t + 600, { transform: `${k.T((T[0] - E[0]) * 0.1 * (j + 1), (T[1] - E[1]) * 0.1 * (j + 1) - 4)} rotate(${r + 90}deg) scale(1.9)`, opacity: 0 }]]);
  }

  // ── THE GIFT (BEATS.impact): a flash and rings of pale light at T, a whirl of motes and feathers
  fx(k.light('g-wind', T, 78), [[1740, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1840, { transform: 'scale(1.2)', opacity: 1 }, eio], [2150, { transform: 'scale(1.35)', opacity: 0.6 }, eio], [2900, { transform: 'scale(1.6)', opacity: 0.25 }, eio], [3500, { transform: 'scale(1.8)', opacity: 0 }]]);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#effffc" stroke-width="2.6" filter="url(#b)"/>', 60, 60);
  [[1800, 3.6, 0.95], [1990, 2.8, 0.7], [2220, 2.2, 0.5]].forEach(([t, s2, o]) => fx(k.pic(ring, T, 26, 26), [[t, { transform: 'scale(.25)', opacity: 0 }, 'ease-out'], [t + 70, { transform: 'scale(.55)', opacity: o }], [t + 900, { transform: `scale(${s2})`, opacity: 0 }]]));
  const feather = k.svg('<path d="M0,3Q5,0 12,2.4Q6,6 0,3Z" fill="#f4fffd"/><path d="M0.6,3L10,2.5" stroke="#9fd0d4" stroke-width=".5" fill="none"/>', 12, 6);
  for (let i = 0; i < 22; i++) {
    const th0 = rand() * Math.PI * 2, spin = i % 2 ? 1 : -1, r0 = 4 + rand() * 6, r1 = 16 + rand() * 20, t0 = 1780 + rand() * 500, dur = 1100 + rand() * 700, kind = i % 3 === 0 ? feather : 'mote', sz = kind === feather ? 6 + rand() * 3 : 2.6 + rand() * 3;
    const list = [];
    for (let j = 0; j <= 7; j++) {
      const f = j / 7, th = th0 + spin * f * Math.PI * 2.4, r = r0 + (r1 - r0) * f, x = Math.cos(th) * r * 1.25, y = Math.sin(th) * r * 0.7 - f * 9;
      list.push([Math.round(t0 + dur * f), { transform: `${k.T(x, y)} rotate(${Math.round(th * 57 + 90)}deg) scale(${(0.5 + 0.7 * Math.sin(Math.PI * Math.min(1, f * 1.05))).toFixed(2)})`, opacity: j === 0 ? 0 : j === 7 ? 0 : 0.9 }, 'linear']);
    }
    fx(k.pic(kind, T, sz, kind === feather ? sz * 0.5 : sz), list);
  }

  // ── as she calms: motes lift off the sea round her, and a last glint on her crown
  for (let i = 0; i < 12; i++) {
    const x = 100 + rand() * 100, y = 150 + rand() * 40, t = 1500 + rand() * 1500, s = 2.2 + rand() * 2.6, dx = (rand() - 0.5) * 14;
    fx(k.picIn('mote', [x, y], s, s), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 160, { transform: `${k.T(dx * 0.1, -6)} scale(1)`, opacity: 0.85 }, 'linear'], [t + 1400, { transform: `${k.T(dx, -56 - rand() * 30)} scale(.5)`, opacity: 0 }]]);
  }
}
