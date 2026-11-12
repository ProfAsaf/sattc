// Seren, the Storm-Scholar: she lends the storm. Lightning from the gap she has torn in the clouds
// strikes her staff again and again, the coil flaring and the book in her other hand shaking with
// charge; she leans back, then sweeps the staff forward and a great arc of lightning (fire wound
// round it) leaps from its tip to whoever she lends the storm to, the book snapping open and loose
// pages tumbling after it on the gale, each flaring into sparks where it lands. Then the storm
// quiets and the picture is as drawn.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support, element: lightning.
//   0-1200    GATHER: she leans back (anticipation), the staff pulls back; three strikes out of the gap hit
//             its tip (each flashes the coil, the sky and the book); charge crackles round the tip and
//             the book shakes.
//   1200-1300 THE SWEEP: she leans in, the staff sweeps forward toward T, the book snaps.
//   1300      RELEASE (BEATS.release): the arc leaps from the tip to T in eight segments, forks off
//             it; nine pages tumble out of the book after it along a curve.
//   1500      IMPACT (BEATS.impact): the arc reaches T: a starburst, a flash, rings, sparks flung away.
//   1500-2900 the arc stutters and fades; the pages arrive one after another (a flash each) and burn out
//             into sparks; motes of charge whirl and thin.
//   2600-3900 she and the staff settle (a follow-through sway), the coil and the book calm; (BEATS.settle 3900).
//   4400      END, at rest as drawn.
//
// The contract (bakeoff/recipe.md): the gift goes from the staff's tip (k.spec.emit, moved with her lean and the
// staff's sweep) to T = k.aim || her own target, the sea at the right (k.spec.alone). She leans and the staff
// sweeps toward T, whichever side it is; every point of the arc and the pages' way is worked out from the tip
// and T. What flies and lands is on the overlay, since T may be on another card.
export const END = 4400;
export const BEATS = { release: 1300, impact: 1500, settle: 3900 };
export const STILLS = [500, 950, 1250, 1400, 1520, 1900, 2600, 4200];

export const textures = {
  spark: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 236, 190, Math.min(1, c * c * 1.8)]; }],
};

export function build(k) {
  const { act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const fx = (el, list) => { let last = -1; k.fx(el, list.slice().sort((a, b) => a[0] - b[0]).map((e) => { last = Math.max(last + 1, Math.min(e[0], k.END - 1)); return [last, ...e.slice(1)]; })); };
  const S = k.spec, FEET = S.feet, G = S.grip, TIP0 = S.emit, BOOK = S.book, T = k.aim || S.alone;
  const side = T[0] >= 150 ? 1 : -1;
  k.css(`.g-white { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,250,236,.95), rgba(255,226,170,.5) 35%, rgba(255,182,92,.14) 66%, rgba(255,170,80,0) 100%); }
    .fx-copy.f-hot { mix-blend-mode: plus-lighter; filter: brightness(1.5) saturate(1.1); }`);
  const track = (keys) => (t) => {
    let i = keys.length - 1;
    while (i > 0 && keys[i][0] > t) i--;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const f = b[0] === a[0] ? 0 : sm(Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))));
    return a.slice(1).map((v, j) => v + (b[j + 1] - v) * f);
  };
  const grid = []; for (let t = 0; t <= 4000; t += 50) grid.push(t);
  const sample = (fn, rest = {}) => [...grid.map((t) => [t, fn(t), 'linear']), [4100, { transform: 'none', ...rest }]];
  const rotAbout = (p, c, deg) => { const r = (deg * Math.PI) / 180; return [c[0] + (p[0] - c[0]) * Math.cos(r) - (p[1] - c[1]) * Math.sin(r), c[1] + (p[0] - c[0]) * Math.sin(r) + (p[1] - c[1]) * Math.cos(r)]; };

  // ── her lean (about her feet) and the staff's sweep (about her grip), both toward T
  const lean = track([[0, 0], [450, -1.6 * side], [1000, -3 * side], [1260, 3.4 * side], [1700, 2 * side], [2500, 0.7 * side], [3200, -0.4 * side], [3900, 0]]);
  const sweep = track([[0, 0], [500, -5 * side], [1000, -11 * side], [1180, -12 * side], [1330, 15 * side], [1700, 11 * side], [2500, 4 * side], [3200, -1.5 * side], [3900, 0]]);
  const shake = (t) => (t > 300 && t < 1250 ? Math.sin(t / 22) * 0.9 * Math.min(1, (t - 300) / 600) : 0);
  // where a point of the rig (the staff's tip, the book) is at a moment: the staff swings about the grip, then the whole figure leans
  const rig = (p, c, t, sw) => rotAbout(rotAbout(p, c, sw), FEET, lean(t)[0]);
  const TIP = (t) => rig(TIP0, G, t, sweep(t)[0]);
  const BK = (t) => rig(BOOK, BOOK, t, 0);
  const tf = (c, t, sw, ex = '') => { const r = lean(t)[0], p = rotAbout(c, FEET, r); return `${k.T(p[0] - c[0], p[1] - c[1])} rotate(${(r + sw).toFixed(2)}deg)${ex}`; };

  // ── the strikes out of the gap: when each hits the tip, how hard
  const HITS = [[620, 0.7], [900, 0.85], [1160, 1]];
  const charge = (t) => { // 0..1: the staff's charge, rising with each strike
    let v = 0.25 + 0.55 * sm(Math.min(1, t / 1200));
    for (const [h, p] of HITS) if (t >= h) v = Math.max(v, 0.6 + 0.4 * p * Math.exp(-(t - h) / 140));
    if (t > 1300) v = 1.1 * Math.exp(-(t - 1300) / 900) + 0.25 * sm(Math.min(1, Math.max(0, (3300 - t) / 1800)));
    return v;
  };

  // ── her and what she holds
  act(k.part('her'), sample((t) => ({ transform: `rotate(${lean(t)[0].toFixed(2)}deg)` })));
  act(k.part('staff'), sample((t) => ({ transform: tf(G, t, sweep(t)[0]) })));
  act(k.part('coil'), sample((t) => ({ transform: tf(G, t, sweep(t)[0] + shake(t) * 0.4, ` scale(${(1 + 0.06 * charge(t)).toFixed(3)})`) })));
  act(k.copy('coil', 'f-hot'), sample((t) => ({ transform: tf(G, t, sweep(t)[0] + shake(t) * 0.4, ` scale(${(1 + 0.06 * charge(t)).toFixed(3)})`), opacity: +Math.max(0, Math.min(1, 1.1 * (charge(t) - 0.5))).toFixed(2) }), { opacity: 0 }));
  // the book shakes with charge, snaps open as she throws, then calms
  const snap = (t) => (t >= 1260 && t < 1700 ? Math.sin(((t - 1260) / 440) * Math.PI) : 0);
  act(k.part('book'), sample((t) => { const r = lean(t)[0], p = rotAbout(BOOK, FEET, r), sy = 1 + 0.12 * snap(t) + 0.04 * shake(t), sx = 1 - 0.06 * snap(t); return { transform: `${k.T(p[0] - BOOK[0], p[1] - BOOK[1])} rotate(${(r + shake(t) * 1.2 - 5 * snap(t) * side).toFixed(2)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})` }; }));

  // ── the sky: the gap flares with each strike
  const gap = [[0, { transform: 'scale(.6)', opacity: 0 }, 'ease-out']];
  for (const [h, p] of HITS) gap.push([h - 20, { transform: 'scale(1)', opacity: 0.12 }, 'linear'], [h + 20, { transform: 'scale(1.1)', opacity: +(0.3 + 0.3 * p).toFixed(2) }, 'ease-out'], [h + 160, { transform: 'scale(1)', opacity: 0.12 }, 'linear']);
  gap.push([1320, { transform: 'scale(1.15)', opacity: 0.6 }, 'ease-out'], [1700, { transform: 'scale(1)', opacity: 0.25 }, eio], [2600, { transform: 'scale(.9)', opacity: 0.08 }, eio], [3400, { transform: 'scale(.6)', opacity: 0 }]);
  fx(k.lightIn('g-warm', [183, 20], 250, 150), gap);
  fx(k.lightIn('g-warm', [150, 80], 330, 130), [[500, { opacity: 0 }, 'ease-out'], [640, { opacity: 0.15 }, 'linear'], [900, { opacity: 0.22 }, 'linear'], [1180, { opacity: 0.4 }, 'ease-out'], [1330, { opacity: 0.4 }, 'linear'], [1700, { opacity: 0.15 }, eio], [2600, { opacity: 0 }]]);
  // the strikes themselves: a bolt from above the frame to the staff's tip
  HITS.forEach(([h, p], i) => {
    const [tx, ty] = TIP(h), x0 = tx + (i - 1) * 9, pts = [[x0 + 6, -16], [x0 - 4, -6], [x0 + 3, 0], [tx - 1, ty - 4], [tx, ty]];
    const x1 = Math.min(...pts.map((q) => q[0])) - 8, w = Math.max(...pts.map((q) => q[0])) + 8 - x1, y1 = -18, hh = ty + 8 - y1;
    const d = 'M' + pts.map((q) => `${(q[0] - x1).toFixed(1)},${(q[1] - y1).toFixed(1)}`).join('L');
    const im = k.svg(`<defs><filter id="b"><feGaussianBlur stdDeviation="1.4"/></filter></defs><g filter="url(#b)"><path d="${d}" stroke="#bfefff" stroke-width="6" fill="none" opacity=".6"/></g><path d="${d}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linejoin="round"/>`, w, hh);
    fx(k.pic(im, [x1 + w / 2, y1 + hh / 2], w, hh, { lit: false }), [[h - 1, { opacity: 0 }, 'linear'], [h + 8, { opacity: 1 }, 'linear'], [h + 40, { opacity: 0.3 }, 'linear'], [h + 70, { opacity: 0.9 * p }, 'linear'], [h + 150, { opacity: 0 }]]);
  });
  // light on the tip: swelling as it charges, beating with each strike, flaring on the throw, then calm
  const tipL = [[0, { opacity: 0 }, 'linear']];
  grid.filter((t) => t >= 100 && t <= 3300).forEach((t) => { const [x, y] = TIP(t), c = charge(t); tipL.push([t, { transform: `${k.T(x - TIP0[0], y - TIP0[1])} scale(${(0.5 + 0.9 * c).toFixed(2)})`, opacity: +Math.min(1, 0.2 + 0.8 * c).toFixed(2) }, 'linear']); });
  tipL.push([3500, { opacity: 0, transform: 'scale(.4)' }]);
  fx(k.lightIn('g-white', TIP0, 40, 40), tipL);
  // the book, lit by the storm's charge
  const bl = [[0, { opacity: 0 }, 'linear']];
  grid.filter((t) => t >= 100 && t <= 3300).forEach((t) => { const [x, y] = BK(t), c = charge(t); bl.push([t, { transform: `${k.T(x - BOOK[0], y - BOOK[1])} scale(${(0.5 + 0.4 * c + 0.3 * snap(t)).toFixed(2)})`, opacity: +Math.min(0.85, 0.1 + 0.45 * c + 0.3 * snap(t)).toFixed(2) }, 'linear']); });
  bl.push([3500, { opacity: 0, transform: 'scale(.5)' }]);
  fx(k.lightIn('g-warm', BOOK, 40, 32), bl);
  // charge crackling round the tip
  for (let i = 0; i < 10; i++) {
    const th0 = rand() * Math.PI * 2, spin = i % 2 ? 1 : -1, r0 = 16 + rand() * 12, t0 = 150 + rand() * 900, dur = 450 + rand() * 250, sz = 2.2 + rand() * 2.2, list = [];
    for (let j = 0; j <= 6; j++) {
      const f = j / 6, th = th0 + spin * f * Math.PI * 1.6, r = r0 * (1 - f * f), [x, y] = TIP(t0 + dur * f);
      list.push([Math.round(t0 + dur * f), { transform: `${k.T(x - TIP0[0] + Math.cos(th) * r, y - TIP0[1] + Math.sin(th) * r * 0.8)} scale(${(0.5 + 0.7 * f).toFixed(2)})`, opacity: j === 0 || j === 6 ? 0 : 0.95 }, 'linear']);
    }
    fx(k.pic('spark', TIP0, sz, sz), list);
  }

  // ── RELEASE: an arc of lightning, fire wound round it, from the staff's tip to T in eight segments; forks branch off
  const E = TIP(1300), NS = 8, STEPS = NS * 2, dx = T[0] - E[0], dy = T[1] - E[1], L = Math.hypot(dx, dy) || 1, d = [dx / L, dy / L], nrm = [-d[1], d[0]];
  const line = [];
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS, amp = i === 0 || i === STEPS ? 0 : Math.min(8, 3 + L * 0.05) * Math.pow(Math.sin(Math.PI * t), 0.6) * (rand() * 2 - 1);
    line.push([E[0] + dx * t + nrm[0] * amp, E[1] + dy * t + nrm[1] * amp]);
  }
  const onLine = (t) => { const x = t * STEPS, i = Math.min(STEPS - 1, Math.floor(x)), f = x - i; return [line[i][0] + (line[i + 1][0] - line[i][0]) * f, line[i][1] + (line[i + 1][1] - line[i][1]) * f]; };
  const wind = (t, ph) => { const w = Math.sin(t * Math.PI * (3 + L / 45) + ph) * 7 * (1 - t * 0.5), c = onLine(t); return [c[0] + nrm[0] * w, c[1] + nrm[1] * w]; };
  const fmt = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
  const cut = (pts, make, pad = 10) => {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad, w = Math.max(...xs) - x0 + pad, h = Math.max(...ys) - y0 + pad;
    const mv = (p) => [p[0] - x0, p[1] - y0];
    return { src: k.svg(`<defs><filter id="b" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.7"/></filter></defs>${make(mv)}`, w, h), c: [x0 + w / 2, y0 + h / 2], w, h };
  };
  const strikes = [[1500, 1], [1580, 0.5], [1640, 1], [1720, 0.6], [1800, 0.95], [1920, 0.5], [2060, 0.8], [2300, 0.35], [2600, 0]];
  const keysFor = (t0) => { const l = [[t0 - 1, { opacity: 0 }, 'linear'], [t0 + 12, { opacity: 1 }, 'linear']]; strikes.forEach(([t, v], j) => l.push([t + (j < 2 ? 0 : 6), { opacity: +v.toFixed(2) }, 'linear'])); return l; };
  const tSeg = (i) => 1300 + i * 25;
  for (let i = 0; i < NS; i++) {
    const a = i / NS, b = (i + 1) / NS, core = line.slice(2 * i, 2 * i + 3), fire = [], fire2 = [];
    for (let j = 0; j <= 12; j++) { const t = a + (b - a) * (j / 12); fire.push(wind(t, 0)); fire2.push(wind(t, Math.PI)); }
    const im = cut([...core, ...fire, ...fire2], (mv) => {
      const pl = (ps) => 'M' + ps.map((p) => fmt(mv(p))).join('L');
      return `<g filter="url(#b)"><path d="${pl(core)}" stroke="#bfefff" stroke-width="8" fill="none" opacity=".5" stroke-linejoin="round"/><path d="${pl(fire)}" stroke="#ff8a3a" stroke-width="5" fill="none" opacity=".7"/></g>` +
        `<path d="${pl(fire2)}" stroke="#ff7a2e" stroke-width="2.4" fill="none" opacity=".85" stroke-linecap="round"/><path d="${pl(fire)}" stroke="#ffd27a" stroke-width="2.6" fill="none" stroke-linecap="round"/>` +
        `<path d="${pl(core)}" stroke="#ffffff" stroke-width="2.6" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;
    });
    fx(k.pic(im.src, im.c, im.w, im.h, { lit: false }), keysFor(tSeg(i)));
  }
  const rotv = (v, deg) => { const r = (deg * Math.PI) / 180; return [v[0] * Math.cos(r) - v[1] * Math.sin(r), v[0] * Math.sin(r) + v[1] * Math.cos(r)]; };
  [[4, 42, 30], [8, -46, 26], [12, 50, 32]].forEach(([si, ang, len], fi) => {
    const from = line[si], dir = rotv(d, ang), pts = [from];
    for (let j = 1; j <= 4; j++) pts.push([from[0] + dir[0] * len * (j / 4) + (rand() - 0.5) * 7, from[1] + dir[1] * len * (j / 4) + (rand() - 0.5) * 7 + j * 1.5]);
    const im = cut(pts, (mv) => { const p = 'M' + pts.map((q) => fmt(mv(q))).join('L'); return `<g filter="url(#b)"><path d="${p}" stroke="#bfefff" stroke-width="4" fill="none" opacity=".5"/></g><path d="${p}" stroke="#f0fcff" stroke-width="1.2" fill="none" stroke-linejoin="round"/>`; }, 6);
    const t0 = tSeg(si / 2) + 10, l = [[t0 - 1, { opacity: 0 }, 'linear'], [t0 + 14, { opacity: 1 }, 'linear']];
    strikes.forEach(([t, v]) => l.push([t - 30 + fi * 5, { opacity: +(v * (fi % 2 ? 0.85 : 1)).toFixed(2) }, 'linear']));
    l.push([2700, { opacity: 0 }]);
    fx(k.pic(im.src, im.c, im.w, im.h, { lit: false }), l);
  });
  // a flash at the tip as it lets go, and a ring
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#fff4d8" stroke-width="2.6" filter="url(#b)"/>', 60, 60);
  [[1300, 3.2, 0.95], [1420, 2.4, 0.6]].forEach(([t, s2, o]) => fx(k.pic(ring, E, 24, 24), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 60, { transform: 'scale(.6)', opacity: o }], [t + 750, { transform: `scale(${s2})`, opacity: 0 }]]));
  fx(k.light('g-white', E, 46), [[1290, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1320, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [1600, { transform: 'scale(1)', opacity: 0.4 }, eio], [2200, { transform: 'scale(.7)', opacity: 0 }]]);

  // ── THE PAGES: nine loose pages tumble out of the book after the arc and fly along a curve to T; each flares into sparks where it lands
  const page = k.svg('<path d="M1,2L11,0.6L12.4,9L2.6,10.4Z" fill="#f4ecd6" stroke="#fff0c8" stroke-width=".5"/><path d="M3,4L9.6,3M3.4,6.2L10,5.2M3.8,8.2L9.2,7.4" stroke="#8a7a58" stroke-width=".4" fill="none"/>', 13, 11);
  const B = BK(1300), FLY = 760, [X0, Y0] = k.P(...B);
  const Lp = Math.hypot(T[0] - B[0], T[1] - B[1]) || 1, np = [-(T[1] - B[1]) / Lp, (T[0] - B[0]) / Lp];
  const bz = (c, t) => { const q = 1 - t; return [q * q * B[0] + 2 * q * t * c[0] + t * t * T[0], q * q * B[1] + 2 * q * t * c[1] + t * t * T[1]]; };
  const Pp = (p, off) => { const [x, y] = k.P(p[0] + off[0], p[1] + off[1]); return [x - X0, y - Y0]; };
  for (let i = 0; i < 9; i++) {
    const t0 = 1320 + i * 85, lane = (i - 4) / 4, bulge = Math.min(50, 24 + Lp * 0.2), C = [(B[0] + T[0]) / 2 + np[0] * lane * 14, Math.min(B[1], T[1]) - bulge - 8 * (i % 3) + np[1] * lane * 8];
    const off = [np[0] * lane * 4, np[1] * lane * 4], list = [], nf = 12, spin = (i % 2 ? 1 : -1) * (300 + 60 * (i % 3));
    for (let j = 0; j <= nf; j++) {
      const f = j / nf, [x, y] = Pp(bz(C, sm(f) * 0.35 + f * 0.65), off), sc = 0.4 + 0.6 * Math.min(1, j / 3) - 0.2 * f, flip = j % 2 ? 1 : 0.35;
      list.push([Math.round(t0 + (FLY * j) / nf), { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${Math.round(spin * f + i * 31)}deg) scale(${sc.toFixed(2)}, ${(sc * flip).toFixed(2)})`, opacity: j === 0 ? 0 : 1 }, 'linear']);
    }
    const [xe, ye] = Pp(T, off), tl = t0 + FLY;
    list.push([tl + 80, { transform: `translate(${xe.toFixed(1)}px, ${ye.toFixed(1)}px) rotate(${Math.round(spin + i * 31)}deg) scale(1)`, opacity: 1 }, 'ease-out'], [tl + 200, { transform: `translate(${xe.toFixed(1)}px, ${ye.toFixed(1)}px) rotate(${Math.round(spin + i * 31 + 30)}deg) scale(1.3)`, opacity: 0 }]);
    fx(k.pic(page, B, 11, 9.2, { lit: false }), list);
    // a spark riding each page, and a flash where it lands
    const gl = [[t0, { transform: 'scale(.3)', opacity: 0 }, 'ease-out']];
    for (let j = 1; j <= nf; j += 2) { const [x, y] = Pp(bz(C, sm(j / nf) * 0.35 + (j / nf) * 0.65), off); gl.push([Math.round(t0 + (FLY * j) / nf), { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(0.7 + 0.04 * j).toFixed(2)})`, opacity: 0.7 }, 'linear']); }
    gl.push([tl + 200, { transform: `translate(${xe.toFixed(1)}px, ${ye.toFixed(1)}px) scale(1.5)`, opacity: 0 }]);
    fx(k.light('g-warm', B, 14), gl);
    fx(k.light('g-white', [T[0] + off[0] * 1.5, T[1] + off[1] * 1.5], 26), [[tl + 20, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [tl + 90, { transform: 'scale(1.2)', opacity: 0.9 }, 'ease-out'], [tl + 420, { transform: 'scale(.8)', opacity: 0 }]]);
    for (let q = 0; q < 2; q++) {
      const a = Math.atan2(dy, dx) + (rand() - 0.5) * 3.2, sp = 8 + rand() * 18, ts = tl + 40 + rand() * 60, sz = 1.8 + rand() * 1.8, l2 = [];
      for (let j = 0; j <= 3; j++) { const f = j / 3; l2.push([Math.round(ts + 420 * f), { transform: `${k.T(Math.cos(a) * sp * f + off[0], Math.sin(a) * sp * f * 0.8 + 16 * f * f + off[1])} scale(${(1 - 0.6 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 0.9 }, 'linear']); }
      fx(k.pic('spark', T, sz, sz), l2);
    }
  }

  // ── IMPACT (BEATS.impact): a starburst, a flash, rings, sparks flung away from where it came
  const star = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1.2"/></filter></defs><g filter="url(#b)" opacity=".7"><path d="M0,-30L3,-3L30,0L3,3L0,30L-3,3L-30,0L-3,-3Z" transform="translate(32 32)" fill="#ffe2a8"/></g>' +
    '<path d="M0,-27L2.2,-2.2L27,0L2.2,2.2L0,27L-2.2,2.2L-27,0L-2.2,-2.2Z" transform="translate(32 32)" fill="#fff"/><path d="M0,-15L1.8,-1.8L15,0L1.8,1.8L0,15L-1.8,1.8L-15,0L-1.8,-1.8Z" transform="translate(32 32) rotate(45)" fill="#fff"/>', 64, 64);
  const stl = [[1490, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [1530, { transform: 'scale(1.4) rotate(6deg)', opacity: 1 }, 'ease-out']];
  strikes.slice(1).forEach(([t, v], j) => stl.push([t + 10, { transform: `scale(${(0.6 + 0.7 * v).toFixed(2)}) rotate(${10 + j * 5}deg)`, opacity: +Math.min(1, v + 0.1).toFixed(2) }, 'linear']));
  fx(k.pic(star, T, 50, 50, { lit: false }), stl);
  const il = [[1480, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1540, { transform: 'scale(1.2)', opacity: 1 }, 'ease-out']];
  for (let t = 1680, i = 0; t < 2700; t += 130, i++) il.push([t, { transform: `scale(${i % 2 ? 1.1 : 0.92})`, opacity: i % 2 ? 0.85 : 0.55 }, eio]);
  il.push([3300, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.light('g-warm', T, 90), il);
  fx(k.light('g-white', T, 46), [[1480, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1540, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [1900, { transform: 'scale(1)', opacity: 0.4 }, eio], [2500, { transform: 'scale(.6)', opacity: 0 }]]);
  [[1500, 3.4, 1], [1620, 2.6, 0.7], [1780, 2, 0.45]].forEach(([t, s2, o]) => fx(k.pic(ring, T, 28, 28), [[t, { transform: 'scale(.25)', opacity: 0 }, 'ease-out'], [t + 60, { transform: 'scale(.5)', opacity: o }], [t + 850, { transform: `scale(${s2})`, opacity: 0 }]]));
  if (Math.abs(T[1] - 140) < 60) fx(k.lightIn('g-warm', [T[0], 138], 150, 30), [[1500, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1580, { transform: 'scale(1)', opacity: 0.9 }, 'linear'], [2100, { transform: 'scale(1.05)', opacity: 0.5 }, eio], [3100, { transform: 'scale(1.2)', opacity: 0 }]]);
  const away = Math.atan2(dy, dx);
  for (let i = 0; i < 20; i++) {
    const a = away + (rand() - 0.5) * 2.7 - rand() * 0.5, sp = 14 + rand() * 38, t0 = 1500 + rand() * 90, dur = 650 + rand() * 650, sz = 2 + rand() * 2.8, list = [];
    for (let j = 0; j <= 5; j++) {
      const f = j / 5, x = Math.cos(a) * sp * (1 - Math.pow(1 - f, 2)) * 1.15, y = Math.sin(a) * sp * (1 - Math.pow(1 - f, 2)) * 0.8 + 38 * f * f - 5;
      list.push([Math.round(t0 + dur * f), { transform: `${k.T(x, y)} scale(${(1.1 - 0.7 * f).toFixed(2)})`, opacity: j === 0 || j === 5 ? 0 : +(0.95 - 0.5 * f).toFixed(2) }, 'linear']);
    }
    fx(k.pic('spark', T, sz, sz), list);
  }
  // motes of charge whirling up from where it landed, thinning out
  for (let i = 0; i < 10; i++) {
    const th0 = rand() * Math.PI * 2, spin = i % 2 ? 1 : -1, r0 = 4 + rand() * 6, r1 = 14 + rand() * 16, t0 = 1700 + rand() * 700, dur = 900 + rand() * 600, sz = 2.2 + rand() * 2.4, list = [];
    for (let j = 0; j <= 6; j++) {
      const f = j / 6, th = th0 + spin * f * Math.PI * 2.2, r = r0 + (r1 - r0) * f;
      list.push([Math.round(t0 + dur * f), { transform: `${k.T(Math.cos(th) * r * 1.2, Math.sin(th) * r * 0.75 - f * 12)} scale(${(0.5 + 0.7 * Math.sin(Math.PI * Math.min(1, f * 1.05))).toFixed(2)})`, opacity: j === 0 || j === 6 ? 0 : 0.9 }, 'linear']);
    }
    fx(k.pic('spark', T, sz, sz), list);
  }
}
