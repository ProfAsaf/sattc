// Ione, the Bloomcaller (a support: her Spells give boons). PLAN.
// She draws a breath and gathers: little lights from the riverbank spiral in
// to the open book and its pages flare (0-900). She leans in and reads the
// spell aloud (release, 900): two strands of light, one leaf-gold and one
// river-pale, twist round each other off the pages and fly in an arc to T,
// petals and leaves caught along them. They land (impact, 1500): a ring of
// light, a burst of petals, flowers opening where it falls, and the tree's
// crown swells and rocks with the blossom (when T is the tree). She rocks
// back, the strands she drew in the picture come back, and everything
// settles (settle, 3600).
// Aimed: T = k.aim || the crown. If T is behind her she turns (narrowing
// through a sliver, like Ashmaw's head) and reads toward it; the strands
// start at the book wherever it is then, and everything lands at T.
// All in the drawing's units (300 x 210) and ms of the move.
export const END = 4000;
export const BEATS = { release: 900, impact: 1500, settle: 3600 };
export const STILLS = [300, 750, 1050, 1300, 1550, 1900, 2600, 3800];

export const textures = {
  orbG: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, a = Math.max(0, 1 - r); return [235 + 20 * (1 - r), 250, 150 + 90 * (1 - r), Math.min(1, a * a * 2.2)]; }],
  orbB: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, a = Math.max(0, 1 - r); return [190 + 60 * (1 - r), 246, 250, Math.min(1, a * a * 2.2)]; }],
  mote: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, a = Math.max(0, 1 - r); return [255, 252, 215, a * a]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const her = k.part('her'), wreath = k.part('wreath'), spell = k.part('spell'), crown = k.part('crown'), blossom = k.part('blossom');
  const [rx] = k.spec.root, [bx, by] = k.spec.book;
  const T = k.aim || k.spec.bough;
  const flip = T[0] < rx - 14; // her target is behind her: she turns round
  // where the book is: mirrored about her when she's turned
  const E = flip ? [2 * rx - k.spec.emit[0], k.spec.emit[1]] : k.spec.emit;
  const near = Math.hypot(T[0] - 216, T[1] - 60) < 70; // is the tree what it lands on?

  // ── she: one pose for her, her wreath and the spell on her (same pivot, same keyframes)
  const dir = flip ? -1 : 1;
  const pose = (dy, rot, sx = dir === -1 ? -1 : 1, dx = 0) => ({ transform: `translate(${(dx * u).toFixed(1)}px, ${(dy * u).toFixed(1)}px) rotate(${(rot * dir).toFixed(1)}deg) scale(${sx}, 1)` });
  const sl = { transform: 'translate(0px, 0px) rotate(0deg) scale(.06, 1)' };
  const poses = [[0, pose(0, 0, 1), eio]];
  if (flip) poses.push([300, sl, eio], [600, pose(0, 0, -1), eio]);
  poses.push([850, pose(-1.4, -2, dir), 'ease-in'], [1020, pose(0.6, 3.2, dir, 1.2), 'ease-out'], [1500, pose(0.2, 1.8, dir, 0.8), eio], [2000, pose(-0.6, -1.2, dir), eio], [2600, pose(0, 0.4, dir), eio]);
  if (flip) poses.push([3000, pose(0, 0, dir), eio], [3300, sl, eio], [3600, pose(0, 0, 1)]);
  else poses.push([3600, pose(0, 0, 1)]);
  const sit = (el, extra) => act(el, poses.map(([t, p, e]) => [t, { ...p, ...(extra ? extra(t) : {}) }, e]));
  sit(her); sit(wreath);
  // the spell drawn on the pages: it brightens as she gathers, thins as hers is released, and flows back
  const dim = (t) => ({ opacity: t < 800 ? 1 : t < 1500 ? 0.2 : t < 2400 ? 0.35 : 1 });
  act(spell, [...poses.filter(([t]) => [0, 300, 600, 850, 1020, 1500, 2000, 2600, 3000, 3300, 3600].includes(t)).map(([t, p, e]) => [t, { ...p, ...dim(t) }, e]), [2900, { ...pose(0, 0, dir), opacity: 1 }, eio]].sort((a, b) => a[0] - b[0]));
  // (the poses are pushed in time order already; the sort only places the 2900 moment)

  // ── a glow at the book that gathers, flares as she reads, and dies down
  const bookAt = (t) => (flip && t >= 600 && t < 3000 ? E : [bx, by]);
  fx(k.lightIn('g-heal', [bx, by - 2], 80, 80), [[150, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [700, { transform: 'scale(.9)', opacity: 0.8 }, eio], [1000, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [1700, { transform: 'scale(1)', opacity: 0.6 }, eio], [2400, { transform: 'scale(.6)', opacity: 0 }]]);
  if (flip) fx(k.lightIn('g-heal', [E[0], E[1] - 2], 80, 80), [[600, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [1700, { transform: 'scale(1)', opacity: 0.6 }, eio], [2400, { transform: 'scale(.6)', opacity: 0 }]]);
  // lights from the bank spiralling in to the pages
  for (let i = 0; i < 6; i++) {
    const a0 = rand() * 6.28, r0 = 30 + rand() * 18, t0 = 100 + i * 70, o = Math.round(rand());
    const pt = (f, ph) => { const r = r0 * (1 - f), a = a0 + ph * f; return k.T(Math.cos(a) * r, Math.sin(a) * r * 0.7); };
    fx(k.picIn(o ? 'orbB' : 'orbG', [E[0], E[1]], 6 + rand() * 3, 6 + rand() * 3), [[t0, { transform: `${pt(0, 2.4)} scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 160, { transform: `${pt(0.35, 2.4)} scale(.8)`, opacity: 0.9 }, eio],
      [t0 + 380, { transform: `${pt(0.75, 2.4)} scale(1)`, opacity: 0.9 }, eio], [t0 + 560, { transform: `${pt(1, 2.4)} scale(.4)`, opacity: 0 }]]);
  }

  // ── the spell: two strands of light twisting round each other from the book to T, on the overlay
  const M = E, C = [(M[0] + T[0]) / 2, Math.min(M[1], T[1]) - 30 - Math.abs(T[0] - M[0]) * 0.05];
  const base = (t) => { const q = 1 - t; return [q * q * M[0] + 2 * q * t * C[0] + t * t * T[0], q * q * M[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const along = (t, ph) => {
    const [x, y] = base(t), [x2, y2] = base(Math.min(1, t + 0.02)), dx = x2 - x, dy = y2 - y, l = Math.hypot(dx, dy) || 1;
    const o = Math.sin(t * Math.PI * 4 + ph) * (1.5 + 5 * Math.sin(t * Math.PI));
    return [x - (dy / l) * o, y + (dx / l) * o];
  };
  const [X0, Y0] = k.P(...M);
  const D = 600;
  const leaf = k.svg('<path d="M5,0C9,3 9,8 5,12C1,8 1,3 5,0Z" fill="#e6f78f"/><path d="M5,2V11" stroke="#fffbd0" stroke-width=".6"/>', 10, 12);
  const petal = k.svg('<path d="M5,0C9,3 9,8 5,12C1,8 1,3 5,0Z" fill="#fbe6ea"/>', 10, 12);
  for (let s = 0; s < 2; s++) {
    const ph = s ? Math.PI : 0;
    for (let i = 0; i < 10; i++) {
      const t0 = 900 + i * 60 + s * 30, sc = 0.9 + 0.5 * Math.sin((i / 9) * Math.PI);
      const step = (f, o, z) => { const [x, y] = k.P(...along(f, ph)); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) scale(${z.toFixed(2)})`, opacity: o }; };
      fx(k.pic(s ? 'orbB' : 'orbG', M, 14, 14), [[t0, step(0, 0, 0.3 * sc), 'ease-out'], [t0 + D * 0.15, step(0.15, 0.95, sc)], [t0 + D * 0.45, step(0.45, 0.9, sc * 1.1)], [t0 + D * 0.75, step(0.75, 0.9, sc * 1.1)], [t0 + D, step(1, 0.8, sc * 1.2), 'ease-out'], [t0 + D + 200, step(1, 0, sc * 0.5)]]);
    }
  }
  // petals and leaves caught along the strands, tumbling as they go
  for (let i = 0; i < 9; i++) {
    const t0 = 920 + i * 66, ph = i % 2 ? Math.PI : 0, r = Math.round(rand() * 360), spin = (rand() - 0.5) * 320;
    const step = (f, o, z) => { const [x, y] = k.P(...along(f, ph)); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + (f > 0.8 ? (f - 0.8) * 30 * u : 0)).toFixed(1)}px) rotate(${(r + spin * f).toFixed(0)}deg) scale(${z})`, opacity: o }; };
    fx(k.pic(i % 3 === 1 ? leaf : petal, M, 8, 9.6, { lit: false }), [[t0, step(0, 0, 0.3), 'ease-out'], [t0 + D * 0.2, step(0.2, 0.9, 1)], [t0 + D * 0.6, step(0.6, 0.9, 1.1)], [t0 + D, step(1, 0.8, 1.1), 'ease-out'], [t0 + D + 500, step(1.05, 0, 0.9)]]);
  }

  // ── where it lands (impact 1500): the light, a ring, petals bursting, flowers opening
  const IM = 1500;
  fx(k.light('g-heal', T, 96), [[IM - 80, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 120, { transform: 'scale(1.1)', opacity: 1 }, eio], [IM + 600, { transform: 'scale(.9)', opacity: 0.7 }, eio], [IM + 1400, { transform: 'scale(1.2)', opacity: 0 }]]);
  fx(k.light('g-warm', T, 48), [[IM - 60, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 80, { transform: 'scale(1)', opacity: 0.9 }], [IM + 500, { transform: 'scale(.6)', opacity: 0 }]]);
  const ring = k.svg('<circle cx="20" cy="20" r="17" fill="none" stroke="#f7ffc8" stroke-width="2.2"/><circle cx="20" cy="20" r="13" fill="none" stroke="#fff" stroke-width=".7" opacity=".7"/>', 40, 40);
  fx(k.pic(ring, T, 64, 64), [[IM, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + 120, { transform: 'scale(.5)', opacity: 0.95 }, 'ease-out'], [IM + 700, { transform: 'scale(1.5)', opacity: 0 }]]);
  fx(k.pic(ring, T, 64, 64), [[IM + 150, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + 280, { transform: 'scale(.4)', opacity: 0.7 }, 'ease-out'], [IM + 950, { transform: 'scale(1.1)', opacity: 0 }]]);
  // petals thrown out and drifting down
  for (let i = 0; i < 13; i++) {
    const a = (i / 13) * 6.28 + rand() * 0.3, d = 16 + rand() * 24, r0 = Math.round(rand() * 360), t0 = IM + rand() * 80, sc = 0.8 + rand() * 0.7;
    fx(k.pic(i % 4 === 3 ? leaf : petal, T, 8, 9.6, { lit: false }), [[t0, { transform: `${k.T(0, 0)} rotate(${r0}deg) scale(.3)`, opacity: 0 }, 'ease-out'],
      [t0 + 240, { transform: `${k.T(Math.cos(a) * d * 0.75, Math.sin(a) * d * 0.75 - 6)} rotate(${r0 + 120}deg) scale(${sc})`, opacity: 0.95 }, 'ease-out'],
      [t0 + 1500, { transform: `${k.T(Math.cos(a) * d * 1.1, Math.sin(a) * d * 0.5 + 24 + rand() * 14)} rotate(${r0 + 340}deg) scale(${sc})`, opacity: 0.9 }, 'ease-in'],
      [t0 + 1900, { transform: `${k.T(Math.cos(a) * d * 1.2, Math.sin(a) * d * 0.5 + 38)} rotate(${r0 + 420}deg) scale(${sc * 0.8})`, opacity: 0 }]]);
  }
  // flowers opening where it falls: they pop (overshooting), hold, and close
  const flower = k.svg(`<g fill="#fff6f0">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="10" cy="4.2" rx="2.6" ry="4" transform="rotate(${a} 10 10)"/>`).join('')}</g><circle cx="10" cy="10" r="2" fill="#ffd36a"/>`, 20, 20);
  for (let i = 0; i < 7; i++) {
    const a = i * 0.9 + rand(), d = 6 + rand() * 20, p = [T[0] + Math.cos(a) * d, T[1] + Math.sin(a) * d * 0.7], t0 = IM + 120 + i * 90, r0 = Math.round(rand() * 70), s = 0.8 + rand() * 0.5;
    fx(k.pic(flower, p, 12, 12), [[t0, { transform: `rotate(${r0}deg) scale(.1)`, opacity: 0 }, 'ease-out'], [t0 + 180, { transform: `rotate(${r0 + 30}deg) scale(${(s * 1.3).toFixed(2)})`, opacity: 1 }, eio], [t0 + 320, { transform: `rotate(${r0 + 36}deg) scale(${s.toFixed(2)})`, opacity: 1 }, eio], [t0 + 1100, { transform: `rotate(${r0 + 60}deg) scale(${s.toFixed(2)})`, opacity: 0.9 }, eio], [t0 + 1500, { transform: `rotate(${r0 + 80}deg) scale(.2)`, opacity: 0 }]]);
  }
  // motes of light rising off it
  for (let i = 0; i < 7; i++) {
    const t0 = IM + 100 + i * 110, x = (rand() - 0.5) * 36;
    fx(k.pic(i % 2 ? 'mote' : 'orbG', [T[0] + x, T[1] + 8], 6 + rand() * 4, 6 + rand() * 4), [[t0, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 300, { transform: `${k.T(x * 0.1, -9)} scale(1)`, opacity: 0.9 }], [t0 + 1100, { transform: `${k.T(x * 0.2 + (rand() - 0.5) * 8, -34)} scale(.5)`, opacity: 0 }]]);
  }

  // ── the tree answers when it's what the spell lands on: the crown swells and rocks, its blossom a beat behind
  const tree = (dt, el) => act(el, near
    ? [[0, { transform: 'scale(1) rotate(0deg)' }, eio], [IM - 40 + dt, { transform: 'scale(1) rotate(0deg)' }, 'ease-out'], [IM + 160 + dt, { transform: 'scale(1.035) rotate(-.8deg)' }, eio], [IM + 520 + dt, { transform: 'scale(1.012) rotate(.6deg)' }, eio],
      [IM + 1000 + dt, { transform: 'scale(1.02) rotate(-.3deg)' }, eio], [IM + 1700 + dt, { transform: 'scale(1) rotate(0deg)' }]]
    : [[0, { transform: 'scale(1) rotate(0deg)' }, eio], [IM + 200 + dt, { transform: 'scale(1) rotate(0deg)' }, eio], [IM + 600 + dt, { transform: 'scale(1.008) rotate(.4deg)' }, eio], [IM + 1200 + dt, { transform: 'scale(1) rotate(0deg)' }]]);
  tree(0, crown); tree(50, blossom);
  if (near) fx(k.light('g-heal', [244, 60], 90), [[IM + 100, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [IM + 500, { transform: 'scale(1)', opacity: 0.55 }, eio], [IM + 1600, { transform: 'scale(1.1)', opacity: 0 }]]);
}
