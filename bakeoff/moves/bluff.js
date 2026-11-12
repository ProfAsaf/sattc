// Bluff (a Trap): the masked figure has been standing calm with the box behind her back. Someone
// attacks: she shows it. The box comes out, the lid springs, violet light bursts up in her
// opponent's face (the swordsman, small down the alley), and a card of light flies out of it
// (Invest, and draw a card), arcing to T. Then the lid snaps shut and she stands as before.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support (its gift is a card and an Invest;
// it is a Trap that does not strike), element: arcane (suggested: light; the light is violet
// spill from a sealed box, a trick, not holy light). Parts: figure (her, with mask and ribbons,
// about her feet), box and lid (on a hinge), leak (the light under the lid). The box, lid and leak
// are laid over her and ride with her motion exactly, plus their own.
//   0-500     she stands quite calm, a slow breath; the light under the lid pulses.
//   500-1200  anticipation: she sways back a hair (away from the foe) as the light gathers: the
//             box tingles, the leak brightens and flickers, motes are drawn into it.
//   1250      RELEASE (BEATS.release): she bows forward with a flourish, the box pops up and the
//             lid flips open; the leak flares into a star of rays; the swordsman is dazzled in
//             violet; a card of light leaves `emit` (the box's mouth) for T.
//   1900      LANDS (BEATS.impact) at T = k.aim, else toward the player (beyond the picture's foot):
//             a flash, rings, a burst of motes; the card hangs a moment, glowing, and dissolves.
//   2100-2900 the box stays open, spilling sparks upward; the foe's flash fades; she holds the pose.
//   2900-3500 the lid snaps shut (a small bounce), the light drains to its leak, she straightens.
//   3600      at rest as drawn (the move ends at END).
//
// The contract: the card leaves from `emit` (the box) and goes to T.
export const END = 4200;
export const BEATS = { release: 1250, impact: 1900, settle: 3600 };
export const STILLS = [350, 900, 1300, 1500, 1900, 2300, 3100, 3900];

export const textures = {
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226, 206, 255, Math.min(1, c * c * 1.6)]; }],
  hot: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 250, 255, Math.min(1, c * c * 1.8)]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out';
  const S = k.spec, E = S.emit, T = k.aim || S.alone, [fx0, fy0] = S.feet, [bx, by] = S.box, [hx, hy] = S.hinge;
  const FOE = [106, 140];
  const sm = k.smooth;
  const wob = (t, c, w) => Math.exp(-(((t - c) / w) ** 2));
  const stage = (keys, t) => {
    let i = keys.length - 1;
    while (i > 0 && keys[i][0] > t) i--;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    return a[1] + (b[1] - a[1]) * (b[0] === a[0] ? 0 : sm(Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0])))));
  };
  const grid = [];
  for (let t = 0; t <= 3660; t += 30) grid.push(t);
  const env = (t) => Math.min(1, t / 300) * Math.min(1, Math.max(0, (3600 - t) / 400));
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3780, fn(3660)]];
  k.css(`.g-vio2 { border-radius: 50%; background: radial-gradient(circle, rgba(250,240,255,.95), rgba(196,150,255,.62) 30%, rgba(150,90,255,.22) 56%, rgba(130,70,255,0) 72%); }`);

  // ── her: a slow breath; sways back; bows forward with a flourish; holds; straightens. (degrees about her feet)
  const lean = (t) => stage([[0, 0], [450, 0], [1100, 2.3], [1250, 2.5], [1560, -4.6], [2000, -3.6], [2800, -3.8], [3400, 0]], t);
  const breath = (t) => 0.25 * env(t) * Math.sin(t / 560);
  const th = (t) => lean(t) + breath(t);
  const R = (a) => (a * Math.PI) / 180;
  // the transform that carries a part about its own origin B along with her turn about her feet P
  const ride = (B, t) => {
    const a = R(th(t)), dx = fx0 - B[0], dy = fy0 - B[1];
    return `translate(${((dx - (dx * Math.cos(a) - dy * Math.sin(a))) * u).toFixed(2)}px, ${((dy - (dx * Math.sin(a) + dy * Math.cos(a))) * u).toFixed(2)}px) rotate(${th(t).toFixed(2)}deg)`;
  };
  const hop = (t) => stage([[0, 0], [1240, 0], [1380, 8.5], [1700, 5], [2800, 5], [3150, 0]], t);
  const tilt = (t) => stage([[0, 0], [1240, 0], [1380, -14], [1700, -9], [2800, -9], [3150, 0]], t);
  const open = (t) => stage([[0, 0], [1240, 0], [1330, -126], [1460, -112], [1620, -118], [2860, -118], [3020, 0]], t) + (t > 3020 ? -7 * wob(t, 3060, 40) : 0);
  const tingle = (t) => 0.35 * wob(t, 900, 300) * Math.sin(t / 22);
  act(k.part('figure'), sample((t) => ({ transform: `rotate(${th(t).toFixed(2)}deg)` })));
  act(k.part('box'), sample((t) => ({ transform: `${ride(S.box, t)} translate(${tingle(t).toFixed(2)}px, ${(-hop(t) * u).toFixed(2)}px) rotate(${(tilt(t) + tingle(t)).toFixed(2)}deg)` })));
  act(k.part('lid'), sample((t) => ({ transform: `${ride(S.hinge, t)} translate(${tingle(t).toFixed(2)}px, ${(-hop(t) * u).toFixed(2)}px) rotate(${(tilt(t) + open(t)).toFixed(2)}deg)` })));
  // the light under the lid: pulses; gathers; flares into the open box; dies to its leak
  const leakS = (t) => stage([[0, 1], [500, 1], [900, 1.15], [1200, 1.2], [1260, 3.2], [1500, 2.3], [2800, 2], [3100, 1]], t) * (1 + 0.07 * Math.sin(t / 150) * (t > 1250 && t < 2900 ? 1 : 0.4 * wob(t, 800, 400)));
  const leakO = (t) => Math.min(1, stage([[0, 1], [500, 0.85], [1000, 1], [1260, 1], [3100, 1]], t) * (0.9 + 0.1 * Math.sin(t / 110)));
  act(k.part('leak'), sample((t) => ({ transform: `${ride([181.6, 136], t)} translate(${tingle(t).toFixed(2)}px, ${(-hop(t) * u).toFixed(2)}px) rotate(${tilt(t).toFixed(2)}deg) scale(${leakS(t).toFixed(3)})`, opacity: +leakO(t).toFixed(2) })));

  // ── light: the box's glow gathers and flares; a star of rays at the opening; spill on the floor
  const bl = [[300, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(.9)', opacity: 0.5 }, eio]];
  for (let t = 1000, i = 0; t < 1200; t += 60, i++) bl.push([t, { transform: `scale(${i % 2 ? 1.1 : 0.85})`, opacity: i % 2 ? 0.65 : 0.45 }, eio]);
  bl.push([1260, { transform: 'scale(2.1)', opacity: 1 }, 'ease-out'], [1500, { transform: 'scale(1.5)', opacity: 0.8 }, eio]);
  for (let t = 1700, i = 0; t < 2800; t += 160, i++) bl.push([t, { transform: `scale(${i % 2 ? 1.5 : 1.3})`, opacity: i % 2 ? 0.8 : 0.62 }, eio]);
  bl.push([3200, { transform: 'scale(.6)', opacity: 0 }]);
  fx(k.light('g-vio2', [bx + 0.5, by - 6], 70), bl);
  const star = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".5"/></filter></defs><g filter="url(#b)" fill="#f6ecff"><path d="M40,40L36,0L40,-8L44,0Z" transform="translate(0,8)"/><path d="M40,40L10,6L8,12L36,40Z"/><path d="M40,40L70,6L72,12L44,40Z"/><path d="M40,40L-4,30L0,36L36,42Z" transform="translate(4,0)"/><path d="M40,40L84,30L80,36L44,42Z" transform="translate(-4,0)"/><path d="M40,40L30,-6L36,-4L40,36Z"/><path d="M40,40L50,-6L44,-4L40,36Z"/></g>', 80, 80);
  fx(k.pic(star, [E[0], E[1] - 2], 56, 56, {}), [[1240, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [1330, { transform: 'scale(1) rotate(8deg)', opacity: 1 }, eio], [1800, { transform: 'scale(1.25) rotate(18deg)', opacity: 0.55 }, eio], [2500, { transform: 'scale(1.1) rotate(26deg)', opacity: 0.3 }, eio], [3000, { transform: 'scale(.6) rotate(30deg)', opacity: 0 }]]);
  fx(k.lightIn('g-aura', [fx0 + 8, fy0 - 4], 150, 40), [[1240, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [1500, { transform: 'scale(1)', opacity: 0.85 }, eio], [2800, { transform: 'scale(1.05)', opacity: 0.6 }, eio], [3500, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.lightIn('g-aura', [bx, by - 4], 170, 130), [[1240, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1400, { transform: 'scale(1)', opacity: 0.55 }, eio], [2800, { transform: 'scale(1.05)', opacity: 0.35 }, eio], [3500, { transform: 'scale(.9)', opacity: 0 }]]);
  // the swordsman down the alley, dazzled: a violet flash on him, fading
  fx(k.lightIn('g-vio2', FOE, 66, 90), [[1290, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1480, { transform: 'scale(1.05)', opacity: 0.85 }, eio], [2000, { transform: 'scale(1.1)', opacity: 0.6 }, eio], [2800, { transform: 'scale(1)', opacity: 0 }]]);

  // ── gather (500-1250): motes drawn into the box from round her
  for (let n = 0; n < 18; n++) {
    const t = 480 + n * 40 + rand() * 25, a = rand() * Math.PI * 2, d = 14 + rand() * 22, x0 = bx + Math.cos(a) * d, y0 = by - 4 + Math.sin(a) * d * 0.8, sz = 2.4 + rand() * 2.4;
    fx(k.picIn('mote', [x0, y0], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 130, { transform: 'scale(1)', opacity: 0.9 }, 'ease-in'], [t + 620, { transform: `${k.T(bx - x0, by - 4 - y0)} scale(.4)`, opacity: 0 }]]);
  }

  // ── sparks pouring up out of the open box while it stays open
  for (let n = 0; n < 22; n++) {
    const t = 1300 + n * 70 + rand() * 40, x0 = bx + (rand() - 0.5) * 8, sz = 2.2 + rand() * 3.2, rise = 20 + rand() * 30, sx = (rand() - 0.5) * 22;
    fx(k.picIn(n % 4 ? 'mote' : 'hot', [x0, by - 8], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 100, { transform: 'scale(1)', opacity: 1 }, 'ease-out'], [t + 700, { transform: `${k.T(sx * 0.6, -rise * 0.7)} scale(.9)`, opacity: 0.8 }, 'linear'], [t + 1300, { transform: `${k.T(sx, -rise)} scale(.4)`, opacity: 0 }]]);
  }

  // ── the card of light (release to impact): leaves the box, arcs to T, turning over as it goes
  const card = k.svg('<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6ff"/><stop offset="1" stop-color="#b98cff"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation=".7"/></filter></defs><rect x="3" y="3" width="24" height="34" rx="3" fill="#c49cff" filter="url(#b)"/><rect x="4.5" y="4.5" width="21" height="31" rx="2.4" fill="url(#g)"/><rect x="7.5" y="7.5" width="15" height="25" rx="1.4" fill="none" stroke="#7a4cc8" stroke-width="1"/><path d="M15,13L19,20L15,27L11,20Z" fill="#7a4cc8"/>', 30, 40);
  const C = [(E[0] + T[0]) / 2 + (T[0] < E[0] ? -10 : 10), Math.min(E[1], T[1]) - 30];
  const bz = (q) => { const w = 1 - q; return [w * w * E[0] + 2 * w * q * C[0] + q * q * T[0], w * w * E[1] + 2 * w * q * C[1] + q * q * T[1]]; };
  const [EX, EY] = k.P(...E);
  const flight = (cardEl, t0, dur, spin, big) => {
    const list = [];
    for (let i = 0; i <= 12; i++) {
      const f = i / 12, tt = Math.round(t0 + dur * f), [x, y] = k.P(...bz(sm(f)));
      list.push([tt, { transform: `translate(${(x - EX).toFixed(1)}px, ${(y - EY).toFixed(1)}px) rotate(${Math.round(spin * f * 180 - 20)}deg) scale(${(big * (0.35 + 0.65 * Math.min(1, f * 3)) * (1 + 0.15 * Math.sin(Math.PI * f))).toFixed(2)}, ${(0.55 + 0.45 * Math.abs(Math.cos(f * Math.PI * 2.5))).toFixed(2)})`, opacity: i === 0 ? 0 : 1 }, 'linear']);
    }
    return list;
  };
  const fl = flight(null, 1250, 650, 0.6, 1);
  // it hangs at T a moment, glowing, then dissolves
  fl.push([1960, { ...fl[fl.length - 1][1], opacity: 1 }, 'linear'], [2250, { ...fl[fl.length - 1][1], transform: fl[fl.length - 1][1].transform.replace(/scale\(([\d.]+),/, (m, a) => `scale(${(a * 1.35).toFixed(2)},`), opacity: 0.8 }, 'ease-in'], [2500, { ...fl[fl.length - 1][1], opacity: 0 }]);
  fx(k.pic(card, E, 20, 26.7), fl);
  // a trail of motes along the same arc
  for (let n = 0; n < 24; n++) {
    const t0 = 1270 + n * 24, sz = 2.6 + rand() * 3.6, side = (rand() - 0.5) * 8, dur = 330 + rand() * 80;
    const at = (f, sc, o) => { const [x, y] = k.P(...bz(sm(f))); return { transform: `translate(${(x - EX).toFixed(1)}px, ${(y - EY + side * Math.sin(Math.PI * f) * u).toFixed(1)}px) scale(${sc})`, opacity: o }; };
    fx(k.pic(n % 3 ? 'mote' : 'hot', E, sz, sz), [[t0, at(0, 0.4, 0), 'ease-out'], [t0 + 50, at(0.1, 1, 1), 'linear'], [t0 + dur, at(0.8, 0.9, 0.8), 'linear'], [t0 + dur + 220, at(1, 0.3, 0)]]);
  }

  // ── where it lands (impact, 1900): a flash, rings, a burst of motes
  const I = 1900;
  const ringC = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#f0e0ff" stroke-width="3" filter="url(#b)"/>', 60, 60);
  fx(k.light('g-vio2', T, 70), [[I - 70, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [I + 50, { transform: 'scale(1.25)', opacity: 1 }, eio], [I + 400, { transform: 'scale(1.4)', opacity: 0.6 }, eio], [2900, { transform: 'scale(1.1)', opacity: 0 }]]);
  [[0, 3.4, 0.9], [150, 2.5, 0.6]].forEach(([dt, sc, o]) => fx(k.pic(ringC, T, 28, 28), [[I + dt, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [I + dt + 50, { transform: 'scale(.6)', opacity: o }], [I + dt + 800, { transform: `scale(${sc})`, opacity: 0 }]]));
  for (let n = 0; n < 20; n++) {
    const a = rand() * Math.PI * 2, dist = 10 + rand() * 28, sz = 3 + rand() * 3.6, t = I + rand() * 120;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * dist * f, Math.sin(a) * dist * f * 0.8 - 14 * f)} scale(${sc})`, opacity: o });
    fx(k.pic(n % 3 ? 'mote' : 'hot', T, sz, sz), [[t, P(0, 0.5, 0), 'ease-out'], [t + 60, P(0.2, 1.1, 1), 'ease-out'], [t + 800 + rand() * 400, P(1, 0.4, 0)]]);
  }
}
