// The Mountain Is Angry: the patient mountain loses its temper, and throws its
// fire at whoever is in reach.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker (the spell is the
// attack: the eruption and its lava bombs), element fire.
//   0-800     a low rumble: the mountain trembles about its foot, the eyes flare
//             and narrow, the lava column in the crater sinks and gutters, embers
//             skitter up from the crater lip.
//   800-1500  GATHER: it hunches (squashes down, the shaking harder), the crater
//             glows white-hot and swells, sparks are sucked back into it, the
//             lava column shrinks to almost nothing.
//   1500      RELEASE: it heaves up and the crater blows: the column leaps up, a
//             flash at the crater, three lava bombs (the first big) are thrown off
//             in high arcs towards T (k.aim, else the village at its foot), a fan of
//             sparks up and out, a thick ash cloud rolling up.
//   1950      IMPACT at T: the big bomb lands: a flash, a ring, billows and sparks,
//             flames catch, smoke; two more bombs land at 2060 and 2170, smaller.
//   1950-3500 the mountain's kick: it rocks back, shudders, the column sinks
//             through its flare; the glows die down; the lava on its face runs
//             bright; its fire at T smoulders down, the ash drifts away.
//   3500      at rest as drawn (END 4200).
// BEATS: release 1500, impact 1950, settle 3500.
//
// Aimed: T = k.aim || the village. The bombs are thrown from the crater (emit) along
// arcs to T (to either side); what flies and lands is on the overlay.
export const END = 4200;
export const BEATS = { release: 1500, impact: 1950, settle: 3500 };
export const STILLS = [350, 1000, 1480, 1600, 1800, 1960, 2500, 3900];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 200 + 55 * c * c, 110 + 120 * c * c * c, Math.min(1, c * c * 2.6)]; }],
  // a molten bomb: a dark crust with a white-hot heart showing through
  bomb: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2; if (r > 1) return [0, 0, 0, 0]; const h = Math.max(0, 1 - r * 1.25); const ed = Math.max(0, 1 - Math.abs(r - 0.78) * 5); return [255 - 130 * r * r * (1 - h), 120 + 135 * h * h, 40 + 170 * h * h * h, Math.min(1, (1 - r) * 5 + 0.15 + ed * 0.2)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const sp = k.spec, EM = sp.emit, CR = sp.crater, [bx, by] = sp.base;
  const mountain = k.part('mountain'), face = k.part('face'), erupt = k.part('eruption');
  const T = k.aim || sp.village;
  k.css('.g-hot { border-radius: 50%; background: radial-gradient(circle, rgba(255,255,236,.98), rgba(255,226,140,.75) 24%, rgba(255,140,40,.35) 50%, rgba(255,90,20,0) 70%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#ffd79a" stroke-width="6" filter="url(#b)"/>', 100, 100);

  const track = (pts) => (ms) => {
    let i = pts.length - 1;
    while (i > 0 && pts[i][0] > ms) i--;
    if (i === pts.length - 1) return pts[i][1];
    const [t0, v0, e] = pts[i], [t1, v1] = pts[i + 1], f = Math.min(1, Math.max(0, (ms - t0) / (t1 - t0)));
    return v0 + (v1 - v0) * (e === 'out' ? 1 - (1 - f) * (1 - f) : e === 'in' ? f * f : k.smooth(f));
  };

  // ── the mountain: squashes and stretches about its foot, and shakes (the shake strong in the gather,
  //    kicked at the release, dying away by 3500). The face goes with it, the column rides its crater.
  const sy = track([[0, 1], [400, 0.992], [800, 0.985], [1250, 0.955], [1420, 0.945, 'in'], [1500, 1.045, 'out'], [1620, 1.02], [1900, 0.99], [2300, 1.004], [2800, 0.998], [3500, 1]]);
  const sx = track([[0, 1], [800, 1.004], [1250, 1.022], [1420, 1.03, 'in'], [1500, 0.985, 'out'], [1620, 0.995], [2000, 1.003], [3500, 1]]);
  const amp = track([[0, 0], [150, 0.35], [800, 0.55], [1100, 1.0], [1450, 1.5], [1500, 2.6, 'out'], [1700, 1.6], [2100, 1.0], [2600, 0.5], [3100, 0.15], [3500, 0]]);
  const dirK = sp.hit[0] < T[0] ? 1 : -1; // it rocks back away from its target
  const kick = track([[0, 0], [1420, 0], [1500, -2.2 * dirK, 'out'], [1800, -1.0 * dirK], [2400, 0.3 * dirK], [3100, 0]]);
  const shake = (t) => { const a = amp(t); return [Math.sin(t / 23) * 0.55 * a + Math.sin(t / 37 + 1) * 0.3 * a, Math.sin(t / 17 + 2) * 0.35 * a]; };
  const grid = [];
  for (let t = 0; t < 3500; t += 36) grid.push(t);
  grid.push(1420, 1500, 1520, 3500);
  const ts = [...new Set(grid)].sort((a, b) => a - b);
  const mk = (t) => { const [dx, dy] = shake(t), r = kick(t) * 0.35 + dx * 0.25; return { dx, dy, r, y: sy(t), x: sx(t) }; };
  const mTf = (t) => { const m = mk(t); return { transform: `translate(${(m.dx * u).toFixed(2)}px, ${(m.dy * u).toFixed(2)}px) rotate(${m.r.toFixed(3)}deg) scale(${m.x.toFixed(4)}, ${m.y.toFixed(4)})` }; };
  const mKs = ts.map((t) => [t, mTf(t), 'linear']);
  mKs[mKs.length - 1][1] = { transform: 'none' };
  act(mountain, mKs);
  act(face, mKs);
  // where the crater is, at a moment (so what rides it follows it)
  const craterAt = (t, [px, py] = CR) => {
    const m = mk(Math.min(t, 3500)), a = (m.r * Math.PI) / 180, rx = (px - bx) * m.x, ry = (py - by) * m.y;
    return [bx + rx * Math.cos(a) - ry * Math.sin(a) + m.dx, by + rx * Math.sin(a) + ry * Math.cos(a) + m.dy];
  };
  // the lava column: sinks and gutters, is sucked down in the gather, leaps up at the release
  const ey = track([[0, 1], [150, 0.85], [350, 1.05], [560, 0.7], [800, 0.55], [1100, 0.42], [1380, 0.22, 'in'], [1470, 0.2], [1520, 1.55, 'out'], [1640, 1.35], [1800, 1.6], [2100, 1.35], [2500, 1.12], [3000, 1.02], [3500, 1]]);
  const ex = track([[0, 1], [800, 1.0], [1380, 1.3], [1470, 1.35], [1520, 0.85, 'out'], [1800, 0.95], [2400, 1.02], [3500, 1]]);
  const esk = track([[0, 0], [1500, 0], [1560, 7 * dirK, 'out'], [2000, 3 * dirK], [3000, 0]]);
  const flick = (t) => (t > 100 && t < 3300 ? Math.sin(t / 41) * 0.045 + Math.sin(t / 67 + 1) * 0.04 : 0) * Math.min(1, ey(t));
  act(erupt, ts.filter((t) => t % 2 === 0 || t > 1400).map((t) => {
    const [cx, cy] = craterAt(t), f = flick(t);
    return [t, { transform: `translate(${((cx - CR[0]) * u).toFixed(2)}px, ${((cy - CR[1]) * u).toFixed(2)}px) skewX(${(esk(t) + f * 20).toFixed(2)}deg) scale(${(ex(t) * (1 - f * 0.4)).toFixed(3)}, ${(ey(t) * (1 + f)).toFixed(3)})` }, 'linear'];
  }).map((kf, i, a) => (i === a.length - 1 ? [kf[0], { transform: 'none' }, 'linear'] : kf)));

  // ── light: the whole sky reddens a little as it gathers and blows; the crater; the eyes and mouth
  fx(k.lightIn('g-city', [150, 70], 360, 220), [[100, { opacity: 0 }, 'ease-out'], [1000, { opacity: 0.25 }, eio], [1500, { opacity: 0.65 }, 'ease-out'], [2000, { opacity: 0.75 }, eio], [2900, { opacity: 0.3 }, eio], [3600, { opacity: 0 }]]);
  const craterLit = [[500, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(.8)', opacity: 0.45 }, eio]];
  for (let t = 1000, i = 0; t < 1480; t += 90, i++) craterLit.push([t, { transform: `scale(${(1 + i * 0.1 + (i % 2) * 0.08).toFixed(2)})`, opacity: Math.min(1, 0.6 + i * 0.1) }, eio]);
  craterLit.push([1510, { transform: 'scale(2.4)', opacity: 1 }, 'ease-out'], [1750, { transform: 'scale(2.0)', opacity: 0.85 }, eio], [2300, { transform: 'scale(1.5)', opacity: 0.55 }, eio], [3100, { transform: 'scale(.9)', opacity: 0.15 }, eio], [3500, { transform: 'scale(.6)', opacity: 0 }]);
  fx(k.light('g-hot', CR, 54), craterLit);
  for (const [i, ey_] of [[0, 92], [1, 92]]) {
    const x = sp.eyes[i][0];
    fx(k.lightIn('g-warm', [x, ey_], 30, 16), [[250 + i * 70, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [520 + i * 70, { transform: 'scale(1.15)', opacity: 0.9 }, eio], [900, { transform: 'scale(.85)', opacity: 0.55 }, eio], [1300, { transform: 'scale(1.2)', opacity: 0.95 }, eio],
      [1500, { transform: 'scale(1.6)', opacity: 1 }, 'ease-out'], [2300, { transform: 'scale(1.3)', opacity: 0.8 }, eio], [3100, { transform: 'scale(.9)', opacity: 0.2 }], [3500, { transform: 'scale(.7)', opacity: 0 }]]);
  }
  // the mouth blazes as the lava surges down the face
  fx(k.lightIn('g-hot', sp.mouth, 46, 46), [[900, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [1400, { transform: 'scale(.9)', opacity: 0.55 }, eio], [1530, { transform: 'scale(1.5)', opacity: 0.95 }, 'ease-out'], [2300, { transform: 'scale(1.2)', opacity: 0.55 }, eio], [3200, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.lightIn('g-warm', [150, 160], 70, 54), [[1500, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [1750, { transform: 'scale(1.1)', opacity: 0.8 }, eio], [2600, { transform: 'scale(.9)', opacity: 0.45 }, eio], [3400, { transform: 'scale(.7)', opacity: 0 }]]);

  // ── embers skittering off the crater lip in the rumble (0-1400), and sucked back into it (900-1480)
  for (let i = 0; i < 12; i++) {
    const t = 120 + i * 100 + rand() * 60, [cx, cy] = craterAt(t), ox = (rand() - 0.5) * 34, h = 14 + rand() * 18;
    fx(k.picIn('spark', [cx + ox, cy - 2], 3.4, 3.4), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 90, { transform: `${k.T(ox * 0.1, -h * 0.5)} scale(1)`, opacity: 1 }, 'ease-out'],
      [t + 380, { transform: `${k.T(ox * 0.35, -h - 4 + 6)} scale(.8)`, opacity: 0.7 }, 'ease-in'], [t + 520, { transform: `${k.T(ox * 0.5, -h + 10)} scale(.2)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 16; i++) {
    const a = -Math.PI * rand(), d = 26 + rand() * 24, t0 = 1000 + i * 28 + rand() * 20, dur = 330 + rand() * 120, ox = Math.cos(a) * d * 1.3, oy = Math.sin(a) * d - 4;
    fx(k.pic('spark', CR, 4.5, 4.5), [[t0, { transform: `${k.T(ox, oy)} scale(.5)`, opacity: 0 }, 'ease-in'], [t0 + 70, { transform: `${k.T(ox * 0.9, oy * 0.9)} scale(1)`, opacity: 1 }, 'ease-in'], [t0 + dur, { transform: `${k.T(0, 2)} scale(.3)`, opacity: 0.9 }], [t0 + dur + 40, { transform: `${k.T(0, 2)} scale(.1)`, opacity: 0 }]]);
  }

  // ── RELEASE (1500): a flash and ring at the crater, sparks fanned up and out, ash rolling up
  fx(k.pic(ring, CR, 70, 30, { lit: true }), [[1500, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [1560, { transform: 'scale(.6)', opacity: 0.95 }, 'ease-out'], [1900, { transform: 'scale(1.5)', opacity: 0 }]]);
  for (let i = 0; i < 24; i++) {
    const t = 1500 + (i % 6) * 14, a = -Math.PI / 2 + (rand() - 0.5) * 2.3, v = 40 + rand() * 60, vx = Math.cos(a) * v, vy = Math.sin(a) * v, sz = 3 + rand() * 3.4, life = 700 + rand() * 500;
    const at = (f, s, o) => ({ transform: `${k.T(vx * f, vy * f + 80 * f * f)} scale(${s})`, opacity: o });
    fx(k.pic('spark', EM, sz, sz), [[t, at(0, 0.6, 0), 'ease-out'], [t + 60, at(0.08, 1, 1), 'ease-out'], [t + life * 0.5, at(0.5, 0.9, 0.95)], [t + life * 0.8, at(0.8, 0.6, 0.55), 'ease-in'], [t + life, at(1.0, 0.2, 0)]]);
  }
  for (let i = 0; i < 6; i++) {
    const t = 1500 + i * 150, r = Math.round(rand() * 360), x = CR[0] + (rand() - 0.5) * 36;
    fx(k.picIn('smoke', [x, CR[1] - 10 - i * 4], 40, 40, { lit: false }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 350, { transform: `${k.T(-1, -16)} rotate(${r + 20}deg) scale(.9)`, opacity: 0.6 }], [t + 1700, { transform: `${k.T((rand() - 0.5) * 30, -70)} rotate(${r + 60}deg) scale(2.1)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 5; i++) {
    const t = 1500 + i * 70, r = Math.round(rand() * 360);
    fx(k.pic(i % 2 ? 'puff' : 'puffHot', EM, 24, 24), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 100, { transform: `${k.T((rand() - 0.5) * 26, -8 - rand() * 14)} rotate(${r + 30}deg) scale(1.1)`, opacity: 0.9 }], [t + 480, { transform: `${k.T((rand() - 0.5) * 40, -22 - rand() * 18)} rotate(${r + 70}deg) scale(1.8)`, opacity: 0 }]]);
  }

  // ── the lava bombs: from the crater along high arcs to T (the first lands at IMPACT)
  const bombs = [{ t0: 1500, fly: 450, to: [0, 0], size: 24, trail: 10 }, { t0: 1560, fly: 500, to: [-16, 7], size: 15, trail: 7 }, { t0: 1640, fly: 530, to: [14, -6], size: 14, trail: 7 }];
  const lights = [];
  bombs.forEach((b, bi) => {
    const E = [T[0] + b.to[0], T[1] + b.to[1]], dist = Math.hypot(E[0] - EM[0], E[1] - EM[1]);
    const C = [(EM[0] + E[0]) / 2 + (bi - 1) * 14, Math.min(EM[1], E[1]) - 46 - dist * 0.16 - bi * 10];
    const bz = (f) => { const q = 1 - f; return [q * q * EM[0] + 2 * q * f * C[0] + f * f * E[0], q * q * EM[1] + 2 * q * f * C[1] + f * f * E[1]]; };
    const pace = (f) => f * 0.55 + f * f * 0.45;
    const fly = (el, size, t0, t1, so, sc = (f) => 0.8 + 0.4 * f, spin = 200) => {
      const ks = [];
      for (let t = t0; ; t += 30) {
        const tt = Math.min(t, t1), f = (tt - t0) / (t1 - t0), [x, y] = bz(pace(f));
        ks.push([tt, { transform: `${k.T(x - EM[0], y - EM[1])} rotate(${(f * spin).toFixed(0)}deg) scale(${(sc(f) * so).toFixed(2)})`, opacity: tt === t0 ? 0 : tt >= t1 ? 0.2 : 1 }, 'linear']);
        if (tt >= t1) break;
      }
      return fx(el, ks);
    };
    const t1 = b.t0 + b.fly;
    fly(k.light('g-warm', EM, b.size * 2.4), b.size, b.t0, t1, 1);
    fly(k.pic('bomb', EM, b.size, b.size), b.size, b.t0, t1, 1);
    // billows and sparks left along its path, each staying where it was
    for (let j = 0; j < b.trail; j++) {
      const f = 0.06 + (j / b.trail) * 0.9, tj = b.t0 + b.fly * (f <= 0 ? 0 : (-0.55 + Math.sqrt(0.3025 + 1.8 * f)) / 0.9), [x, y] = bz(f), r = Math.round(rand() * 360), s = b.size * (0.9 + rand() * 0.4);
      fx(k.pic(j % 3 === 2 ? 'puffCool' : j % 2 ? 'puff' : 'puffHot', [x + (rand() - 0.5) * 3, y + (rand() - 0.5) * 3], s, s), [[tj, { transform: `rotate(${r}deg) scale(.45)`, opacity: 0 }, 'ease-out'], [tj + 80, { transform: `rotate(${r + 20}deg) scale(.8)`, opacity: 0.85 }], [tj + 420, { transform: `${k.T((rand() - 0.5) * 6, -5)} rotate(${r + 50}deg) scale(1.5)`, opacity: 0 }]]);
    }
    // ── IMPACT: a flash, billows, flames and sparks where it lands
    const L = b.t0 + b.fly, big = bi === 0 ? 1 : 0.6;
    const il = [[L - 30, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [L + 50, { transform: `scale(${1.3 * big + 0.3})`, opacity: 1 }]];
    for (let t = L + 160, i = 0; t < L + 900; t += 110, i++) il.push([t, { transform: `scale(${((i % 2 ? 1.1 : 0.9) * big + 0.2).toFixed(2)})`, opacity: i % 2 ? 0.9 : 0.65 }, eio]);
    il.push([L + 1100, { transform: 'scale(.6)', opacity: 0 }]);
    fx(k.light('g-hot', E, 64 * big + 18), il);
    fx(k.pic(ring, E, 60 * big + 16, 26 * big + 8), [[L, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [L + 60, { transform: 'scale(.55)', opacity: 0.95 }, 'ease-out'], [L + 380, { transform: 'scale(1.3)', opacity: 0 }]]);
    const nb = bi === 0 ? 8 : 4;
    for (let j = 0; j < nb; j++) {
      const a = (j / nb) * Math.PI * 2 + rand(), d = (10 + rand() * 12) * big + 5, r = Math.round(rand() * 360), s = 18 * big + 8;
      fx(k.pic(j % 3 === 2 ? 'puffCool' : j % 2 ? 'puff' : 'puffHot', [E[0], E[1] - 2], s, s), [[L, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [L + 90, { transform: `${k.T(Math.cos(a) * d * 0.6, Math.sin(a) * d * 0.4 - 3)} rotate(${r + 20}deg) scale(1)`, opacity: 0.9 }], [L + 480, { transform: `${k.T(Math.cos(a) * d * 1.4, Math.sin(a) * d * 0.6 - 10)} rotate(${r + 60}deg) scale(1.7)`, opacity: 0 }]]);
    }
    for (let j = 0; j < (bi === 0 ? 14 : 7); j++) {
      const a = -Math.PI * (0.1 + 0.8 * rand()), v = (28 + rand() * 40) * (0.5 + 0.5 * big), vx = Math.cos(a) * v, vy = Math.sin(a) * v, sz = 2.6 + rand() * 2.6, life = 500 + rand() * 400;
      const at = (f, s, o) => ({ transform: `${k.T(vx * f, vy * f + 90 * f * f)} scale(${s})`, opacity: o });
      fx(k.pic('spark', E, sz, sz), [[L, at(0, 0.7, 0), 'ease-out'], [L + 40, at(0.08, 1, 1)], [L + life * 0.6, at(0.6, 0.8, 0.9)], [L + life, at(1, 0.2, 0)]]);
    }
    if (bi < 2) for (let j = 0; j < 3; j++) {
      const on = L + 60 + j * 80, off = 3000 + rand() * 300, ff = j % 2 ? 'flame' : 'flame2', x = E[0] + (j - 1) * 7 + (rand() - 0.5) * 3, w = 9 + rand() * 4, h = 15 + rand() * 8;
      const list = [[on, { transform: 'scale(.6, .12)', opacity: 0 }, 'ease-out'], [on + 120, { transform: 'scale(1, 1)', opacity: 0.95 }, eio]];
      for (let t = on + 120, i = 1; (t += 80 + rand() * 60) < off; i++) { const s = i % 2 ? 1 : -1; list.push([t, { transform: `scale(${(1 - s * 0.08 - rand() * 0.06).toFixed(2)}, ${(1 + s * 0.14 + rand() * 0.1).toFixed(2)}) skewX(${(s * (2 + rand() * 5)).toFixed(1)}deg)`, opacity: +(0.8 + rand() * 0.2).toFixed(2) }, eio]); }
      list.push([Math.min(k.END, off + 260), { transform: 'scale(.5, .15)', opacity: 0 }]);
      fx(k.pic(ff, [x, E[1] + 5], w, h, { base: true }), list);
    }
    if (bi === 0) for (let j = 0; j < 4; j++) {
      const t = L + 300 + j * 190, r = Math.round(rand() * 360);
      fx(k.pic('smoke', [E[0] + (rand() - 0.5) * 12, E[1] - 6], 28, 28, { lit: false, low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 300, { transform: `${k.T(-2, -12)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 1150, { transform: `${k.T(-8, -50)} rotate(${r + 50}deg) scale(2.1)`, opacity: 0 }]]);
    }
  });
  // a glow lingering where the fire fell
  fx(k.light('g-warm', T, 60), [[1900, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [2050, { transform: 'scale(1.2)', opacity: 0.55 }, eio], [2900, { transform: 'scale(1)', opacity: 0.3 }, eio], [3500, { transform: 'scale(.7)', opacity: 0 }]]);
}
