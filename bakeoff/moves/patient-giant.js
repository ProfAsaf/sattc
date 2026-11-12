// Patient Giant: arrows come at it, and it only grows.
//
// PLAN (drawing units 300 x 210, ms of the move). Role defender, element nature.
//   0-600     BRACE: it shifts its weight and draws itself up, head lifting a hair, the
//             trees on its head and shoulders swaying; its eyes stay calm.
//   900, 1450, 2000 (or k.blows, each snapped to its nearest guard point): a BLOW. An arrow
//             streaks in from the side of the blow and sinks into the giant; the body jolts
//             away a degree or two and settles back, the head nods, the old arrows in its
//             shoulder quiver; a flash of green-gold light, splinters of bark, leaves
//             shaken down from its trees, and a small green glow where the wound closes.
//             It never flinches more than that. The new arrow stays in.
//   after the last blow: GROWTH (+1 Power): a ring of light rises from its feet through the
//             body, a green-gold glow fills it, its eyes flare once and the trees bloom with
//             light, motes drifting up past its head; it stands a little taller, a slow breath.
//   3200-3700 the glow fades; the new arrows soften away and the giant is as drawn. END 4200.
// BEATS: release (the brace) 600, impact (the first blow) 900, settle 3700.
export const END = 4200;
export const BEATS = { release: 600, impact: 900, settle: 3700 };
export const STILLS = [350, 900, 1000, 1500, 2050, 2600, 3200, 3900];

export const textures = {
  mote: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [240, 255, 190 + 60 * c, Math.min(1, c * c * 3)]; }],
  orb: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [232 + 20 * c, 255, 150 + 90 * c * c, Math.min(1, c * c * 2.4)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const head = k.part('head'), torso = k.part('torso'), bark = k.part('bark'), arrows = k.part('arrows'), eyes = k.part('eyes');
  const G = k.spec.guard, [wx, wy] = k.spec.waist, [nx, ny] = k.spec.neck, [qx, qy] = k.spec.tips;
  k.css('.g-leaf { border-radius: 50%; background: radial-gradient(circle, rgba(250,255,214,.95), rgba(196,240,112,.55) 30%, rgba(130,205,70,.2) 58%, rgba(110,190,60,0) 72%); }');
  const leaf = k.svg('<defs><linearGradient id="g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#8fcf4a"/><stop offset="1" stop-color="#e8fba0"/></linearGradient></defs><path d="M10,30C2,22 3,8 10,1C17,8 18,22 10,30Z" fill="url(#g)"/><path d="M10,29L10,6" stroke="#5f9a2c" stroke-width=".9" fill="none" opacity=".7"/>', 20, 30);
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><ellipse cx="50" cy="25" rx="44" ry="20" fill="none" stroke="#eefcb4" stroke-width="3.2" filter="url(#b)"/><ellipse cx="50" cy="25" rx="44" ry="20" fill="none" stroke="#fbffe4" stroke-width="1.1"/>', 100, 50);
  // an arrow flying along +x: the tip is its right end (as the arrows drawn in its shoulder, dark with a fletch)
  const ARROW = 34;
  const arrowImg = k.svg('<path d="M1,3L33,3" stroke="#1b2a12" stroke-width="2" fill="none"/><path d="M30,0L34,3L30,6Z" fill="#1b2a12"/><path d="M1,3L8,0L5.5,3L8,6Z" fill="#1b2a12"/><path d="M1,3L8,0.6L6,3L8,5.4Z" fill="#33462a" opacity=".6"/>', ARROW, 6);
  const wood = k.svg('<path d="M0,1.5 L10,0 L11,2.2 L1,2.6Z" fill="#2e3f22"/>', 11, 3), pale = k.svg('<path d="M0,1 L7,0 L8,1.6 L1,2Z" fill="#dfe8a8"/>', 8, 2.4);

  // ── the blows: [{ at, to }] (another card's attack, or its own arrows), each snapped to its nearest guard point
  const snap = ([x, y]) => G.reduce((b, g) => (Math.hypot(g[0] - x, g[1] - y) < Math.hypot(b[0] - x, b[1] - y) ? g : b), G[0]);
  const blows = (k.blows || [{ at: 900, to: G[0] }, { at: 1450, to: G[1] }, { at: 2000, to: G[2] }]).map((b) => ({ at: Math.round(b.at), to: snap(b.to) })).sort((a, b) => a.at - b.at);
  const LAST = blows[blows.length - 1].at;
  const GROW = Math.min(LAST + 380, 2300);

  // ── its motion as tracks sampled every 40 ms: the torso's turn about its waist, the head's nod
  const pulse = (d) => (d < 0 ? 0 : (d / 45) * Math.exp(1 - d / 45)); // up to a peak at 45 ms after the blow, then away
  const rebound = (d) => (d < 0 ? 0 : Math.sin(d / 70) * Math.exp(-d / 230)); // and back past rest, settling
  const smooth = (a, b, t) => k.smooth(Math.min(1, Math.max(0, (t - a) / (b - a))));
  const lean = (t) => 0.9 * smooth(0, 600, t) - 0.9 * smooth(3000, 3650, t); // the brace, held, then released
  const rise = (t) => 0.9 * Math.sin(Math.PI * smooth(GROW, GROW + 900, t)) * (1 - smooth(GROW + 900, 3500, t)); // it draws up with the growth
  const torsoRot = (t) => { let r = -lean(t) * 0.4; for (const b of blows) { const s = b.to[0] <= nx ? 1 : -1, d = t - b.at; r += s * (1.7 * pulse(d) * Math.exp(-d / 160) + 0.7 * rebound(d)); } return r; };
  const torsoDx = (t) => { let x = 0; for (const b of blows) { const s = b.to[0] <= nx ? 1 : -1, d = t - b.at; x += s * 0.9 * pulse(d) * Math.exp(-d / 140); } return x; };
  const headNod = (t) => { let r = -1.2 * smooth(0, 600, t) * (1 - smooth(2900, 3600, t)) - 1.4 * rise(t); for (const b of blows) { const s = b.to[0] <= nx ? 1 : -1, d = t - b.at - 70; r += s * 2.4 * (d < 0 ? 0 : Math.sin(d / 95) * Math.exp(-d / 260)); } return r; };
  const qv = (t) => { let w = 0; for (const b of blows) { const d = t - b.at; if (d > 0) w += 4.5 * Math.sin(d / 28) * Math.exp(-d / 210); } return w; };

  const times = []; for (let t = 0; t <= 3700; t += 40) times.push(t);
  for (const b of blows) for (const d of [-1, 0, 14, 28]) times.push(b.at + d);
  times.push(600, GROW, 3700);
  const grid = [...new Set(times.filter((t) => t >= 0 && t <= 3700))].sort((a, b) => a - b);
  const du = (v) => `${(v * u).toFixed(2)}px`;
  const tf = {
    torso: (t) => ({ transform: `translate(${du(torsoDx(t))}, 0px) rotate(${torsoRot(t).toFixed(2)}deg)` }),
    head: (t) => ({ transform: `translate(${du(torsoDx(t))}, 0px) translate(0px, ${du(wy - ny)}) rotate(${torsoRot(t).toFixed(2)}deg) translate(0px, ${du(ny - wy)}) rotate(${headNod(t).toFixed(2)}deg)` }),
    arrows: (t) => ({ transform: `translate(${du(torsoDx(t))}, 0px) rotate(${torsoRot(t).toFixed(2)}deg) translate(${du(qx - wx)}, ${du(qy - wy)}) rotate(${qv(t).toFixed(2)}deg) translate(${du(wx - qx)}, ${du(wy - qy)})` }),
  };
  act(torso, grid.map((t) => [t, tf.torso(t), 'linear']));
  act(bark, grid.map((t) => [t, tf.torso(t), 'linear']));
  act(head, grid.map((t) => [t, tf.head(t), 'linear']));
  act(eyes, grid.map((t) => [t, tf.head(t), 'linear']));
  act(arrows, grid.map((t) => [t, tf.arrows(t), 'linear']));
  // where a point of the torso is at a moment (to carry a stuck arrow with it)
  const onTorso = ([x, y], t) => { const a = (torsoRot(t) * Math.PI) / 180, rx = x - wx, ry = y - wy; return [wx + rx * Math.cos(a) - ry * Math.sin(a) + torsoDx(t), wy + rx * Math.sin(a) + ry * Math.cos(a)]; };

  // ── each blow
  blows.forEach((b, bi) => {
    const t = b.at, [hx, hy] = b.to, side = hx <= nx ? -1 : 1; // side: which way the arrow comes from (-1: left)
    const ang = Math.atan2(0.62, -side * 0.78); // heading: down and toward the giant
    const dir = [Math.cos(ang), Math.sin(ang)], deg = (ang * 180) / Math.PI;
    const c0 = [hx - dir[0] * ARROW / 2, hy - dir[1] * ARROW / 2]; // the arrow's centre once it's in
    const flight = 300;
    const lst = [[t - flight, { transform: `${k.T(-dir[0] * 90, -dir[1] * 90)} rotate(${deg.toFixed(1)}deg)`, opacity: 0 }, 'ease-in'],
      [t - flight + 50, { transform: `${k.T(-dir[0] * 78, -dir[1] * 78)} rotate(${deg.toFixed(1)}deg)`, opacity: 1 }, 'ease-in'],
      [t - 8, { transform: `${k.T(-dir[0] * 4, -dir[1] * 4)} rotate(${deg.toFixed(1)}deg)`, opacity: 1 }, 'linear']];
    for (let m = t; m <= 3200; m += 40) { const p = onTorso(c0, m); lst.push([m, { transform: `${k.T(p[0] - c0[0], p[1] - c0[1])} rotate(${(deg + torsoRot(m)).toFixed(2)}deg)`, opacity: 1 }, 'linear']); }
    lst.push([3650, { transform: `${k.T(onTorso(c0, 3200)[0] - c0[0], onTorso(c0, 3200)[1] - c0[1])} rotate(${deg.toFixed(2)}deg)`, opacity: 0 }, 'ease-out']);
    fx(k.pic(arrowImg, c0, ARROW, 6), lst.filter((x, i, a) => i === 0 || x[0] > a[i - 1][0]));
    // a streak behind it in flight
    fx(k.pic('mote', [hx - dir[0] * 20, hy - dir[1] * 20], 5, 5), [[t - 120, { transform: `${k.T(-dir[0] * 40, -dir[1] * 40)} scale(.6)`, opacity: 0 }, 'ease-out'], [t - 30, { transform: `${k.T(-dir[0] * 8, -dir[1] * 8)} scale(1.4, .5)`, opacity: 0.8 }], [t + 80, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }]]);

    // the flash where it lands, and the closing of the hurt
    fx(k.light('g-leaf', [hx, hy], 38), [[t - 1, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 20, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [t + 160, { transform: 'scale(1.35)', opacity: 0.6 }, eio], [t + 700, { transform: 'scale(1.1)', opacity: 0 }]]);
    fx(k.light('g-leaf', [hx - side * 2, hy], 16), [[t - 1, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 15, { transform: 'scale(1.6)', opacity: 1 }], [t + 130, { transform: 'scale(2.2)', opacity: 0 }]]);
    fx(k.pic(ring, [hx, hy], 44, 22), [[t, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(.35)', opacity: 0.9 }, 'ease-out'], [t + 520, { transform: 'scale(1)', opacity: 0 }]]);
    // sparks of light and splinters of bark, thrown out the way the arrow came
    for (let n = 0; n < 9; n++) {
      const a = Math.atan2(-dir[1], -dir[0]) + (rand() - 0.5) * 2.2, r = 10 + rand() * 20, ex = Math.cos(a) * r, ey = Math.sin(a) * r * 0.9 - 4, sz = 2.2 + rand() * 2.6, t0 = t + rand() * 30, life = 380 + rand() * 300;
      const pts = k.arc([0, 0], [ex * 0.6, ey - 7 - rand() * 6], [ex + 2, ey + 10 + rand() * 8], 5);
      fx(k.pic('mote', [hx, hy], sz, sz), pts.map(([x, y], j) => [Math.round(t0 + life * j / 5), { transform: `${k.T(x, y)} scale(${(1 - 0.6 * j / 5).toFixed(2)})`, opacity: j === 5 ? 0 : 1 - 0.1 * j }, j < 2 ? 'ease-out' : 'linear']));
    }
    for (let n = 0; n < 6; n++) {
      const a = Math.atan2(-dir[1], -dir[0]) + (rand() - 0.5) * 2.4, r = 10 + rand() * 18, ex = Math.cos(a) * r, ey = Math.sin(a) * r * 0.9, t0 = t + 5 + rand() * 30, life = 450 + rand() * 250, spin = (rand() - 0.5) * 600;
      const pts = k.arc([0, 0], [ex * 0.55, ey - 10 - rand() * 6], [ex + 2, ey + 12 + rand() * 8], 5);
      fx(k.pic(n % 2 ? pale : wood, [hx, hy], n % 2 ? 6 : 8, n % 2 ? 2 : 2.6, { lit: false }), pts.map(([x, y], j) => [Math.round(t0 + life * j / 5), { transform: `${k.T(x, y)} rotate(${(spin * j / 5).toFixed(0)}deg)`, opacity: j === 5 ? 0 : 1 }, j < 2 ? 'ease-out' : 'linear']));
    }
    // leaves shaken down from the trees on its shoulders (only for blows high up)
    if (hy < 100) for (let n = 0; n < 3; n++) {
      const sx = 170 + rand() * 18, sy = 62 + rand() * 8, t0 = t + 40 + n * 70 + rand() * 50, drift = (rand() - 0.5) * 30, rt = Math.round((rand() - 0.5) * 120);
      const pts = k.arc([0, 0], [drift * 0.7, 14], [drift, 46 + rand() * 20], 5);
      fx(k.picIn(leaf, [sx, sy], 6, 9, { lit: false }), [[t0 - 1, { transform: `${k.T(0, 0)} rotate(${rt}deg) scale(.3)`, opacity: 0 }, 'ease-out'], ...pts.map(([x, y], j) => [Math.round(t0 + 1100 * j / 5), { transform: `${k.T(x, y)} rotate(${rt + Math.round((j % 2 ? 1 : -1) * 70 * j)}deg) scale(1)`, opacity: j === 5 ? 0 : j === 0 ? 0 : 0.95 }, 'ease-in-out'])]);
    }
  });

  // ── growth: a ring of light rises from its feet, a glow through the whole body, eyes and trees flare, motes lift
  const GR = GROW;
  fx(k.lightIn('g-leaf', [155, 112], 150, 200), [[GR - 80, { transform: 'scale(.7)', opacity: 0 }, 'ease-out'], [GR + 300, { transform: 'scale(1)', opacity: 0.75 }, eio], [GR + 800, { transform: 'scale(1.05)', opacity: 0.55 }, eio], [3400, { transform: 'scale(1)', opacity: 0 }]]);
  for (const [d, w] of [[0, 110], [260, 90]]) {
    fx(k.picIn(ring, [155, 186], w, w / 2), [[GR + d, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], [GR + d + 80, { transform: `${k.T(0, -2)} scale(.55)`, opacity: 0.9 }, 'linear'], [GR + d + 650, { transform: `${k.T(0, -78)} scale(.5)`, opacity: 0.6 }, 'ease-in'], [GR + d + 950, { transform: `${k.T(0, -118)} scale(.45)`, opacity: 0 }]]);
  }
  k.spec.eyes.forEach(([x, y], i) => {
    const hd = (t) => { const a = (headNod(t) * Math.PI) / 180, rx = x - nx, ry = y - ny; return [nx + rx * Math.cos(a) - ry * Math.sin(a), ny + rx * Math.sin(a) + ry * Math.cos(a)]; };
    fx(k.picIn('orb', [x, y], 14, 14), [[GR + 250, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [GR + 420, { transform: `${k.T(hd(GR + 420)[0] - x, hd(GR + 420)[1] - y)} scale(1.4)`, opacity: 1 }, 'ease-out'], [GR + 900, { transform: `${k.T(hd(GR + 900)[0] - x, hd(GR + 900)[1] - y)} scale(.9)`, opacity: 0.5 }, eio], [GR + 1500, { transform: 'scale(.4)', opacity: 0 }]]);
  });
  k.spec.crowns.forEach(([x, y], i) => {
    const t0 = GR + 80 + i * 130;
    fx(k.lightIn('g-leaf', [x, y], 30, 30), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 320, { transform: 'scale(1.2)', opacity: 0.9 }, 'ease-out'], [t0 + 700, { transform: 'scale(1)', opacity: 0.45 }, eio], [t0 + 1200, { transform: 'scale(.6)', opacity: 0 }]]);
  });
  for (let i = 0; i < 12; i++) {
    const x = 128 + rand() * 54, y = 60 + rand() * 90, t0 = GR + rand() * 500, life = 800 + rand() * 300, sz = 2.4 + rand() * 2.6;
    const pts = k.arc([0, 0], [(rand() - 0.5) * 24, -26], [(rand() - 0.5) * 34, -54 - rand() * 14], 5);
    fx(k.picIn('mote', [x, y], sz, sz), [[t0 - 1, { transform: `${k.T(0, 0)} scale(.3)`, opacity: 0 }, 'ease-out'], ...pts.map(([px, py], j) => [Math.round(t0 + life * j / 5), { transform: `${k.T(px, py)} scale(${1 - 0.4 * j / 5})`, opacity: j === 0 || j === 5 ? 0 : 0.9 }, 'ease-out'])]);
  }
}
