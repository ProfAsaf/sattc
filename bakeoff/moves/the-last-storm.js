// The Last Storm: the storm gathers all it has and lets the one great bolt go. The bolt in the picture
// stutters and dies, the storm's eye swells with charge (sparks spiral in to it, the sky dims, the
// cloud bellies pulse), then FLASH: a new bolt, lightning with a ribbon of fire wound round it, strikes
// from the eye down to its target in a handful of beats, forks splitting off as it goes. It bursts there
// in a starburst, a ring, sparks flung away, flames catching and smoke going up; the bolt stutters
// and fades, the sky calms, and the picture comes back exactly as drawn.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker, element: lightning.
//   0-1050    GATHER: the drawn bolt flickers and dies; the eye (k.spec.emit) swells; charge
//             spirals in to it; the sky dims; the cloud bellies pulse with each flicker.
//   1100      RELEASE (BEATS.release): a flash over the whole sky; the new bolt strikes from the
//             eye to T in ten segments, 20 ms apart; forks branch off; a ring leaves the eye.
//   1300      IMPACT (BEATS.impact): the bolt reaches T: starburst, flash, shock rings, sparks,
//             a light on the sea/ground under it, flames catch, smoke.
//   1300-2600 the bolt stutters (it re-strikes three times) and fades; the burst lights beat.
//   2400-3500 the picture's own bolt and star return; the flames die; (BEATS.settle 3500).
//   4000      END, at rest as drawn.
//
// The contract (bakeoff/recipe.md): the bolt goes from k.spec.emit to T = k.aim || k.spec.alone (the
// tower's top). Every point of it (the jagged channel, the wound fire, the forks) is worked out from
// those two points; what flies and lands is on the overlay, since T may be on another card.
export const END = 4000;
export const BEATS = { release: 1100, impact: 1300, settle: 3500 };
export const STILLS = [450, 900, 1110, 1220, 1330, 1700, 2600, 3800];

export const textures = {
  spark: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 236, 190, Math.min(1, c * c * 1.8)]; }],
};

export function build(k) {
  const { act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const fx = (el, list) => { let last = -1; k.fx(el, list.slice().sort((a, b) => a[0] - b[0]).map((e) => { last = Math.max(last + 1, Math.min(e[0], k.END - 1)); return [last, ...e.slice(1)]; })); };
  const E = k.spec.emit, T = k.aim || k.spec.alone;
  k.css(`.g-white { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,250,236,.95), rgba(255,226,170,.5) 35%, rgba(255,182,92,.14) 66%, rgba(255,170,80,0) 100%); }`);

  // ── the picture's own bolt and the star on the tower: they flicker and die as the storm gathers, and come back at the end
  act(k.part('bolt'), [[0, { opacity: 1 }, 'linear'], [250, { opacity: 0.5 }, 'linear'], [330, { opacity: 1 }, 'linear'], [520, { opacity: 0.32 }, 'linear'], [600, { opacity: 0.9 }, 'linear'],
    [760, { opacity: 0.22 }, 'linear'], [840, { opacity: 0.7 }, 'linear'], [1000, { opacity: 0.12 }, 'linear'], [1090, { opacity: 0 }, 'linear'], [2500, { opacity: 0 }, eio], [3400, { opacity: 1 }]]);
  act(k.part('glint'), [[0, { transform: 'none', opacity: 1 }, 'ease-in'], [500, { transform: 'scale(.7)', opacity: 0.55 }, 'ease-in'], [1090, { transform: 'scale(.3)', opacity: 0 }, 'linear'], [2800, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [3500, { transform: 'none', opacity: 1 }]]);

  // ── GATHER: the sky dims, the eye swells and crackles, the cloud bellies pulse with each flicker
  fx(k.picIn('gloom', [150, 105], 380, 280, { lit: false }), [[0, { opacity: 0 }, 'ease-in'], [1050, { opacity: 0.55 }, 'linear'], [1100, { opacity: 0 }, 'linear'], [1500, { opacity: 0.18 }, eio], [2400, { opacity: 0 }]]);
  const fl = [[0, 0.1], [200, 0.45], [330, 0.2], [500, 0.6], [600, 0.3], [740, 0.8], [850, 0.45], [980, 1], [1090, 0.9]];
  const eye = [[0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out']];
  fl.forEach(([t, v]) => eye.push([t + 100, { transform: `scale(${(0.5 + 0.9 * v).toFixed(2)})`, opacity: +(0.25 + 0.7 * v).toFixed(2) }, 'linear']));
  eye.push([1150, { transform: 'scale(2.1)', opacity: 1 }, 'ease-out'], [1400, { transform: 'scale(1.5)', opacity: 0.8 }, eio], [2000, { transform: 'scale(1.2)', opacity: 0.45 }, eio], [2800, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.light('g-white', E, 64), eye);
  const belly = [[0, { opacity: 0 }, 'linear']];
  fl.forEach(([t, v]) => belly.push([t + 90, { opacity: +(0.5 * v).toFixed(2) }, 'linear']));
  belly.push([1150, { opacity: 0.95 }, 'ease-out'], [1330, { opacity: 0.5 }, 'linear'], [1420, { opacity: 0.85 }, 'linear'], [1700, { opacity: 0.35 }, eio], [2400, { opacity: 0 }]);
  fx(k.lightIn('g-warm', [150, 80], 330, 120), belly);
  // charge spiralling in to the eye
  for (let i = 0; i < 16; i++) {
    const th0 = rand() * Math.PI * 2, spin = i % 2 ? 1 : -1, r0 = 22 + rand() * 26, t0 = 80 + rand() * 520, dur = 480 + rand() * 250, sz = 2.4 + rand() * 2.4, list = [];
    for (let j = 0; j <= 6; j++) {
      const f = j / 6, th = th0 + spin * f * Math.PI * 1.7, r = r0 * (1 - f * f);
      list.push([Math.round(t0 + dur * f), { transform: `${k.T(Math.cos(th) * r * 1.2, Math.sin(th) * r * 0.7)} scale(${(0.5 + 0.7 * f).toFixed(2)})`, opacity: j === 0 || j === 6 ? 0 : 0.95 }, 'linear']);
    }
    fx(k.pic('spark', E, sz, sz), list);
  }

  // ── RELEASE: a flash over the whole sky, a ring leaving the eye
  const flash = [[1090, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [1115, { transform: 'scale(1)', opacity: 0.75 }, 'ease-out'], [1190, { transform: 'scale(1)', opacity: 0.35 }, 'linear'], [1300, { transform: 'scale(1)', opacity: 0.7 }, 'ease-out'],
    [1420, { transform: 'scale(1)', opacity: 0.3 }, 'linear'], [1560, { transform: 'scale(1)', opacity: 0.5 }, 'linear'], [2000, { transform: 'scale(1)', opacity: 0.12 }, eio], [2600, { transform: 'scale(1)', opacity: 0 }]];
  fx(k.lightIn('g-warm', [150, 105], 400, 290), flash);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#fff4d8" stroke-width="2.6" filter="url(#b)"/>', 60, 60);
  [[1100, 3.4, 0.95], [1230, 2.6, 0.6]].forEach(([t, s2, o]) => fx(k.pic(ring, E, 26, 26), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 60, { transform: 'scale(.6)', opacity: o }], [t + 800, { transform: `scale(${s2})`, opacity: 0 }]]));

  // ── THE BOLT: a jagged channel from the eye to T (ten segments that strike one after another),
  //    a ribbon of fire wound round it, forks branching off
  const NS = 10, STEPS = NS * 2, dx = T[0] - E[0], dy = T[1] - E[1], L = Math.hypot(dx, dy) || 1, d = [dx / L, dy / L], nrm = [-d[1], d[0]];
  const line = [];
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS, amp = i === 0 || i === STEPS ? 0 : Math.min(9, 3 + L * 0.05) * Math.pow(Math.sin(Math.PI * t), 0.6) * (rand() * 2 - 1);
    line.push([E[0] + dx * t + nrm[0] * amp, E[1] + dy * t + nrm[1] * amp]);
  }
  const onLine = (t) => { const x = t * STEPS, i = Math.min(STEPS - 1, Math.floor(x)), f = x - i; return [line[i][0] + (line[i + 1][0] - line[i][0]) * f, line[i][1] + (line[i + 1][1] - line[i][1]) * f]; };
  const wind = (t, ph) => { const w = Math.sin(t * Math.PI * (3 + L / 40) + ph) * 8 * (1 - t * 0.5), c = onLine(t); return [c[0] + nrm[0] * w, c[1] + nrm[1] * w]; };
  const fmt = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
  // an image of some shapes (given in drawing units) cut to their bounding box (+pad): { src, c, w, h }
  const cut = (pts, make, pad = 10) => {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad, w = Math.max(...xs) - x0 + pad, h = Math.max(...ys) - y0 + pad;
    const mv = (p) => [p[0] - x0, p[1] - y0];
    return { src: k.svg(`<defs><filter id="b" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.7"/></filter></defs>${make(mv)}`, w, h), c: [x0 + w / 2, y0 + h / 2], w, h };
  };
  const strikes = [[1300, 1], [1380, 0.5], [1440, 1], [1520, 0.65], [1600, 1], [1720, 0.7], [1860, 0.9], [2100, 0.45], [2450, 0]]; // the bolt re-strikes, then dies
  const keysFor = (t0) => { const l = [[t0 - 1, { opacity: 0 }, 'linear'], [t0 + 12, { opacity: 1 }, 'linear']]; strikes.forEach(([t, v], j) => l.push([t + (j < 2 ? 0 : 6), { opacity: +v.toFixed(2) }, 'linear'])); return l; };
  const tSeg = (i) => 1100 + i * 20;
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
  // forks: where they leave, and where they go
  const rotv = (v, deg) => { const r = (deg * Math.PI) / 180; return [v[0] * Math.cos(r) - v[1] * Math.sin(r), v[0] * Math.sin(r) + v[1] * Math.cos(r)]; };
  [[4, 40, 36], [8, -48, 30], [12, 52, 40], [16, -38, 30]].forEach(([si, ang, len], fi) => {
    const from = line[si], dir = rotv(d, ang), pts = [from];
    for (let j = 1; j <= 4; j++) pts.push([from[0] + dir[0] * len * (j / 4) + (rand() - 0.5) * 7, from[1] + dir[1] * len * (j / 4) + (rand() - 0.5) * 7 + j * 1.5]);
    const im = cut(pts, (mv) => { const p = 'M' + pts.map((q) => fmt(mv(q))).join('L'); return `<g filter="url(#b)"><path d="${p}" stroke="#bfefff" stroke-width="4" fill="none" opacity=".5"/></g><path d="${p}" stroke="#f0fcff" stroke-width="1.2" fill="none" stroke-linejoin="round"/>`; }, 6);
    const t0 = tSeg(si / 2) + 10, l = [[t0 - 1, { opacity: 0 }, 'linear'], [t0 + 14, { opacity: 1 }, 'linear']];
    strikes.forEach(([t, v], j) => l.push([t - 30 + fi * 5, { opacity: +(v * (fi % 2 ? 0.85 : 1)).toFixed(2) }, 'linear']));
    l.push([2300, { opacity: 0 }]);
    fx(k.pic(im.src, im.c, im.w, im.h, { lit: false }), l);
  });

  // ── IMPACT (BEATS.impact): a starburst, a flash, rings, sparks flung away, flames catching, smoke
  const star = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1.2"/></filter></defs><g filter="url(#b)" opacity=".7"><path d="M0,-30L3,-3L30,0L3,3L0,30L-3,3L-30,0L-3,-3Z" transform="translate(32 32)" fill="#ffe2a8"/></g>' +
    '<path d="M0,-27L2.2,-2.2L27,0L2.2,2.2L0,27L-2.2,2.2L-27,0L-2.2,-2.2Z" transform="translate(32 32)" fill="#fff"/><path d="M0,-15L1.8,-1.8L15,0L1.8,1.8L0,15L-1.8,1.8L-15,0L-1.8,-1.8Z" transform="translate(32 32) rotate(45)" fill="#fff"/>', 64, 64);
  const stl = [[1290, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [1330, { transform: 'scale(1.5) rotate(6deg)', opacity: 1 }, 'ease-out']];
  strikes.slice(1).forEach(([t, v], j) => stl.push([t + 10, { transform: `scale(${(0.7 + 0.7 * v).toFixed(2)}) rotate(${10 + j * 5}deg)`, opacity: +Math.min(1, v + 0.1).toFixed(2) }, 'linear']));
  fx(k.pic(star, T, 58, 58, { lit: false }), stl);
  const hot = [[1280, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1330, { transform: 'scale(1.25)', opacity: 1 }, 'ease-out']];
  strikes.slice(1).forEach(([t, v]) => hot.push([t + 20, { transform: `scale(${(0.8 + 0.4 * v).toFixed(2)})`, opacity: +(0.3 + 0.65 * v).toFixed(2) }, 'linear']));
  hot.push([2600, { transform: 'scale(1)', opacity: 0.25 }, eio], [3300, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.light('g-white', T, 54), hot);
  const il = [[1280, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1340, { transform: 'scale(1.1)', opacity: 0.95 }, 'ease-out']];
  for (let t = 1450, i = 0; t < 2700; t += 130, i++) il.push([t, { transform: `scale(${i % 2 ? 1.1 : 0.94})`, opacity: i % 2 ? 0.9 : 0.65 }, eio]);
  il.push([3300, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.light('g-warm', T, 96), il);
  [[1300, 3.4, 1], [1420, 2.6, 0.7], [1580, 2, 0.45]].forEach(([t, s2, o]) => fx(k.pic(ring, T, 28, 28), [[t, { transform: 'scale(.25)', opacity: 0 }, 'ease-out'], [t + 60, { transform: 'scale(.5)', opacity: o }], [t + 850, { transform: `scale(${s2})`, opacity: 0 }]]));
  // its light on the water or ground under it
  if (Math.abs(T[1] - 154) < 60) fx(k.lightIn('g-warm', [T[0], 156], 140, 26), [[1300, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1380, { transform: 'scale(1)', opacity: 0.95 }, 'linear'], [1900, { transform: 'scale(1.05)', opacity: 0.55 }, eio], [3000, { transform: 'scale(1.2)', opacity: 0 }]]);
  // sparks flung away from where the bolt came from, falling under their weight
  const away = Math.atan2(dy, dx);
  for (let i = 0; i < 30; i++) {
    const a = away + (rand() - 0.5) * 2.7 - (rand() * 0.5), sp = 14 + rand() * 38, t0 = 1300 + rand() * 90, dur = 650 + rand() * 650, sz = 2 + rand() * 2.8, list = [];
    for (let j = 0; j <= 5; j++) {
      const f = j / 5, x = Math.cos(a) * sp * (1 - Math.pow(1 - f, 2)) * 1.15, y = Math.sin(a) * sp * (1 - Math.pow(1 - f, 2)) * 0.8 + 38 * f * f - 5;
      list.push([Math.round(t0 + dur * f), { transform: `${k.T(x, y)} scale(${(1.1 - 0.7 * f).toFixed(2)})`, opacity: j === 0 ? 0 : j === 5 ? 0 : +(0.95 - 0.5 * f).toFixed(2) }, 'linear']);
    }
    fx(k.pic('spark', T, sz, sz), list);
  }
  // flames catching on it, smoke going up
  const flicker = (el, on, off) => {
    const list = [[on, { transform: 'scale(.6, .12)', opacity: 0 }, 'ease-out'], [on + 120, { transform: 'scale(1, 1)', opacity: 0.95 }, eio]];
    for (let t = on + 120, i = 1; (t += 90 + rand() * 60) < off; i++) { const s = i % 2 ? 1 : -1; list.push([t, { transform: `translateY(${(-rand() * 1.5).toFixed(1)}px) scale(${(1 - s * 0.08 - rand() * 0.06).toFixed(2)}, ${(1 + s * 0.14 + rand() * 0.1).toFixed(2)}) skewX(${(s * (2 + rand() * 5)).toFixed(1)}deg)`, opacity: +(0.8 + rand() * 0.2).toFixed(2) }, eio]); }
    list.push([off + 260, { transform: 'scale(.5, .15)', opacity: 0 }]);
    fx(el, list);
  };
  for (let i = 0; i < 5; i++) flicker(k.pic(i % 2 ? 'flame' : 'flame2', [T[0] + (i - 2) * 6.5, T[1] + 4], 9 + rand() * 4, 14 + rand() * 8, { base: true }), 1340 + i * 70, 2500 + rand() * 450);
  for (let i = 0; i < 4; i++) {
    const t = 1500 + i * 200, r = Math.round(rand() * 360);
    fx(k.pic('smoke', [T[0] + (rand() - 0.5) * 12, T[1] - 4], 26, 26, { lit: false, low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'],
      [t + 300, { transform: `${k.T(-2, -12)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 1400, { transform: `${k.T(-9, -48)} rotate(${r + 50}deg) scale(2)`, opacity: 0 }]]);
  }
}
