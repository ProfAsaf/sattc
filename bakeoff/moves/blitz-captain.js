// Blitz Captain: she rears her horse higher, hauls her burning banner back, and then throws herself forward:
// the horse crashes down into the charge, the banner swings over and the fire on it is flung off its pole as
// a stream of billows, which bursts where it lands (a foe, or the red horizon) while the riders of the charge
// surge forward below.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker (Rush: she charges; as suggested), element:
// fire (the burning banner, the red horizon; as suggested). Faces right; her target is k.aim, or alone the
// red horizon on the right. If the target is to the left she turns the whole group round, through a sliver.
//   0-1150    the gather. The horse rears higher and quivers, she leans back and hauls the banner back with it,
//             the fire on its tail swells and brightens, a light gathers at the pole top, embers lift off.
//   1150-1260 the strike: the horse crashes forward (the hooves slam, dust and sparks), she throws herself
//             and the pole forward (a wind-up over, then the whip).
//   1260      RELEASE (BEATS.release): the fire is flung from the pole top: billows pour along an arc to T,
//             a flash at the pole; the charge below surges.
//   1560      IMPACT (BEATS.impact): the stream breaks on T: a flash, a light that beats with the billows,
//             flames catching, sparks and smoke.
//   1560-3500 follow-through: she rocks back up on her horse, the banner flutters down, the riders fall back
//             into their gallop; the fire and lights die down. BEATS.settle 3500; END 4200; at rest as drawn.
//
// The contract (bakeoff/recipe.md): every point of the stream is worked out from the pole top (`emit`, found
// where it has swung to at each moment) and T = k.aim || spec.alone.
export const END = 4200;
export const BEATS = { release: 1260, impact: 1560, settle: 3500 };
export const STILLS = [450, 1050, 1230, 1350, 1580, 1900, 2800, 3900];

const soft = (x, y) => Math.hypot(x - 0.5, y - 0.5) * 2;
export const textures = {
  ember: [16, 16, (x, y) => { const c = Math.max(0, 1 - soft(x, y)); return [255, 190 + 60 * c, 90 + 120 * c * c, Math.min(1, Math.pow(c, 0.7) * 1.5)]; }],
  hot: [24, 24, (x, y) => { const c = Math.max(0, 1 - soft(x, y)); return [255, 244, 210, Math.min(1, Math.pow(c, 0.8) * 1.6)]; }],
};

export function build(k) {
  const { act, rand, u, art } = k, eio = 'ease-in-out', sm = k.smooth;
  void art;
  const fx = (el, list) => { let last = -1; k.fx(el, list.slice().sort((a, b) => a[0] - b[0]).map((e) => { last = Math.max(last + 1, Math.min(e[0], k.END - 1)); return [last, ...e.slice(1)]; })); };
  k.css(`.f-hot { mix-blend-mode: plus-lighter; filter: brightness(1.8) saturate(1.2); }`);
  const S = k.spec, HOOF = S.hoof, SEAT = S.seat, TIP = S.tip, X0 = 126;
  const PIV = { far: [226, 172], near: [150, 190], steed: HOOF, rider: SEAT, flag: SEAT, fire: SEAT };
  const T = k.aim || S.alone;
  const right = T[0] >= X0;
  const R0 = 1260, IMPACT = 1560, BACK = 3500;

  // a curve through [ms, value, ease?] points ('in': accelerating to it, 'out': decelerating)
  const track = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) {
      const f = (t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]), e = pts[i][2];
      return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * (e === 'in' ? Math.pow(f, 2.2) : e === 'out' ? 1 - Math.pow(1 - f, 2.2) : sm(f));
    }
    return pts.at(-1)[1];
  };
  // the group's turning round, left or right: 1 (facing right) .. -1 (facing left), through a sliver
  const flip = right ? () => 1 : (t) => {
    const f = t < 2800 ? sm(Math.min(1, Math.max(0, (t - 150) / 520))) : 1 - sm(Math.min(1, Math.max(0, (t - 2900) / 520)));
    const c = Math.cos(Math.PI * f); return Math.abs(c) < 0.05 ? (c < 0 ? -0.05 : 0.05) : c;
  };
  // the horse: its turn about its hooves (+ is down and forward), a lunge, a bob; she: a lean about her seat; the flag's flutter
  const hAng = track([[0, 0], [520, -5], [900, -6.2], [1150, -7.6, 'out'], [1262, 4.2, 'in'], [1450, 2.8], [1900, -2.6], [2400, 1.2], [2900, -0.4], [BACK, 0]]);
  const hDx = track([[0, 0], [1150, -1.8], [1262, 5.5, 'in'], [1500, 3.5], [2200, 1.2], [BACK, 0]]);
  const hDy = track([[0, 0], [520, 1.2], [1150, -2.2], [1262, 1.6, 'in'], [1400, 0.2], [BACK, 0]]);
  const lean = track([[0, 0], [520, -12], [1150, -20], [1262, 27, 'in'], [1450, 21], [1900, 8], [2500, -3], [3100, 0]]);
  const gust = track([[0, 0.3], [1150, 0.9], [1262, 1.6], [2200, 0.7], [BACK, 0.2], [3900, 0]]);
  const fl = (t) => (3.2 * Math.sin(t / 130) + 1.8 * Math.sin(t / 53 + 1)) * gust(t) + (t > 1262 ? 9 * Math.exp(-(t - 1262) / 260) : 0);
  const fs = (t) => 1 - 0.05 * gust(t) * (1 + Math.sin(t / 130 + 1)) - (t > 1262 ? 0.1 * Math.exp(-(t - 1262) / 300) : 0);
  // the riders of the charge: surge forward when it is let go, and gallop
  const surge = track([[0, 0], [1150, -1.2], [1262, 5, 'in'], [1700, 9], [2400, 3.5], [3300, 0]]);
  const gallop = (t) => (t > 200 && t < 3400 ? 0.55 * Math.abs(Math.sin(t / 115)) * Math.min(1, (t - 200) / 300) * Math.min(1, (3400 - t) / 400) * (1 + (t > 1262 && t < 2400 ? 1.2 : 0)) : 0);

  // every part's transform as a list of operations (outermost first), about its own pivot
  const css = (ops) => ops.map((o) => (o[0] === 't' ? `translate(${(o[1] * u).toFixed(2)}px, ${(o[2] * u).toFixed(2)}px)` : o[0] === 's' ? `scale(${o[1].toFixed(4)}, ${o[2].toFixed(4)})` : o[0] === 'k' ? `skewY(${o[1].toFixed(2)}deg)` : `rotate(${o[1].toFixed(2)}deg)`)).join(' ');
  const apply = (ops, P, pt) => {
    let x = pt[0] - P[0], y = pt[1] - P[1];
    for (let i = ops.length - 1; i >= 0; i--) {
      const o = ops[i];
      if (o[0] === 't') { x += o[1]; y += o[2]; } else if (o[0] === 's') { x *= o[1]; y *= o[2]; } else if (o[0] === 'k') { y += x * Math.tan((o[1] * Math.PI) / 180); } else { const a = (o[1] * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a); [x, y] = [x * c - y * s, x * s + y * c]; }
    }
    return [x + P[0], y + P[1]];
  };
  const opsOf = (name, t) => {
    const P = PIV[name], s = flip(t), mir = [['t', (X0 - P[0]) * (1 - s), 0], ['s', s, 1]];
    if (name === 'far' || name === 'near') return [...mir, ['t', surge(t) * (name === 'far' ? 0.8 : 1.15), -gallop(t) * (name === 'far' ? 0.7 : 1)]];
    const horse = [['t', hDx(t), hDy(t)], ['t', HOOF[0] - P[0], HOOF[1] - P[1]], ['r', hAng(t)], ['t', P[0] - HOOF[0], P[1] - HOOF[1]]];
    if (name === 'steed') return [...mir, ...horse];
    const rider = [...mir, ...horse, ['r', lean(t)]];
    if (name === 'rider') return rider;
    const Q = [TIP[0] - P[0], TIP[1] - P[1]];
    return [...rider, ['t', Q[0], Q[1]], ['k', fl(t) * (name === 'fire' ? 1.2 : 1)], ['s', fs(t), 1], ['t', -Q[0], -Q[1]]];
  };
  const posOf = (name, pt, t) => apply(opsOf(name, t), PIV[name], pt);
  const keys = []; for (let t = 0; t < 1000; t += 80) keys.push(t); for (let t = 1000; t < 1700; t += 35) keys.push(t); for (let t = 1700; t <= 4000; t += 80) keys.push(t);
  for (const name of Object.keys(PIV)) act(k.part(name), keys.map((t) => [t, { transform: css(opsOf(name, t)) }, 'linear']));
  // the fire on the banner's tail swells and brightens as she gathers, flares as it is flung
  const heat = track([[0, 0], [300, 0.1], [1150, 0.7], [1262, 1], [1700, 0.7], [2500, 0.25], [3300, 0]]);
  act(k.copy('fire', 'f-hot'), keys.map((t) => [t, { transform: css(opsOf('fire', t)), opacity: +Math.min(1, heat(t)).toFixed(2) }, 'linear']));

  // ── a light that follows a point of a part (the pole top): grows as she gathers, flashes on the strike
  const follow = (el, name, pt, f) => act2(el, keys.filter((t) => f(t) !== null).map((t) => { const p = posOf(name, pt, t), v = f(t); return [t, { transform: `${k.T(p[0] - pt[0], p[1] - pt[1])} scale(${v[0].toFixed(3)})`, opacity: +v[1].toFixed(2) }, 'linear']; }));
  const act2 = (el, list) => fx(el, list);
  const tipGlow = track([[250, 0], [1150, 0.75], [1262, 1], [1700, 0.55], [2300, 0]]);
  follow(k.light('g-warm', TIP, 44), 'rider', TIP, (t) => (t < 250 || t > 2300 ? null : [0.6 + 0.9 * tipGlow(t), tipGlow(t)]));
  const hotTip = (t) => (t < 1000 || t > 1700 ? null : [0.4 + 1.4 * Math.exp(-Math.abs(t - 1275) / 140), Math.exp(-Math.abs(t - 1275) / 150)]);
  follow(k.pic('hot', TIP, 18, 18, {}), 'rider', TIP, hotTip);
  // a light on the flame itself, beating
  const FC = [70, 42];
  follow(k.light('g-warm', FC, 50), 'fire', FC, (t) => (t < 150 || t > 3500 ? null : [0.85 + 0.15 * Math.sin(t / 90) + 0.5 * heat(t), Math.min(0.95, 0.15 + 0.85 * heat(t))]));
  // embers lifting off the flame, more of them as she gathers
  for (let i = 0; i < 22; i++) {
    const t0 = 200 + Math.round(rand() * 2900), sz = 2 + rand() * 2.6, rise = 22 + rand() * 34, dx = -8 + (rand() - 0.5) * 22;
    const p = posOf('fire', [FC[0] + (rand() - 0.5) * 14, FC[1] + 3 + rand() * 8], t0);
    fx(k.pic('ember', p, sz, sz, {}), [[t0, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 200, { transform: `${k.T(dx * 0.3, -rise * 0.3)} scale(1)`, opacity: 0.95 }, 'linear'], [t0 + 1000, { transform: `${k.T(dx, -rise)} scale(.3)`, opacity: 0 }]]);
  }

  // ── the hooves crash down (R0 - 100): dust thrown out both ways, sparks, a ring of shock
  const HX = [HOOF[0] + 4, HOOF[1] + 2];
  for (let i = 0; i < 6; i++) {
    const t = R0 - 110 + i * 25, side = i % 2 ? 1 : -1, r = Math.round(rand() * 360), p = posOf('steed', HX, t + 60);
    fx(k.pic('smoke', p, 24, 18, { lit: false }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 160, { transform: `${k.T(side * (6 + rand() * 6), -3)} rotate(${r + 20}deg) scale(.9)`, opacity: 0.5 }], [t + 900, { transform: `${k.T(side * (16 + rand() * 12), -12)} rotate(${r + 50}deg) scale(1.7)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 9; i++) {
    const t = R0 - 100 + Math.round(rand() * 40), a = -Math.PI / 2 + (rand() - 0.5) * 2.6, v = 14 + rand() * 20, p = posOf('steed', HX, t + 40);
    fx(k.pic('ember', p, 3, 3, {}), [[t, { transform: `${k.T(0, 0)} scale(.6)`, opacity: 0 }, 'ease-out'], [t + 80, { transform: `${k.T(Math.cos(a) * v * 0.6, Math.sin(a) * v * 0.6)} scale(1)`, opacity: 1 }, 'ease-out'], [t + 520, { transform: `${k.T(Math.cos(a) * v, Math.sin(a) * v + 12)} scale(.3)`, opacity: 0 }]]);
  }

  // ── the stream: billows from the pole top, where it has swung to, along an arc to T (on the overlay, since T may be on another card)
  const flow = (E) => {
    const C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 24 - Math.hypot(T[0] - E[0], T[1] - E[1]) * 0.08];
    return (f) => { const q = 1 - f; return [q * q * E[0] + 2 * q * f * C[0] + f * f * T[0], q * q * E[1] + 2 * q * f * C[1] + f * f * T[1]]; };
  };
  for (let i = 0; i < 20; i++) {
    const t0 = R0 + 10 + i * 42, E = posOf('rider', TIP, t0), bz = flow(E), [EX, EY] = k.P(...E), r = Math.round(rand() * 360), side = (rand() - 0.5) * 8;
    const at = (f, sc, o) => { const [x, y] = k.P(...bz(f)); return { transform: `translate(${(x - EX).toFixed(1)}px, ${(y - EY + side * f * u).toFixed(1)}px) rotate(${r + Math.round(f * 60)}deg) scale(${sc})`, opacity: o }; };
    fx(k.pic(i % 3 === 2 ? 'puffCool' : 'puff', E, 34, 34), [[t0, at(0, 0.4, 0), 'ease-out'], [t0 + 60, at(0.25, 0.6, 0.95)], [t0 + 140, at(0.55, 0.8, 0.9)], [t0 + 230, at(0.85, 0.95, 0.85)], [t0 + 300, at(1, 1.2, 0.7), 'ease-out'], [t0 + 560, at(1, 1.8, 0)]]);
    if (i % 2 === 0) fx(k.pic('flame2', E, 13, 19, {}), [[t0, at(0, 0.5, 0), 'ease-out'], [t0 + 90, at(0.3, 0.9, 0.95)], [t0 + 220, at(0.8, 0.8, 0.8)], [t0 + 320, at(1, 0.5, 0)]]);
  }
  // …the pole's flash as it lets go
  const [TX, TY] = [T[0], T[1]];
  // where it lands (BEATS.impact): a flash, a light beating with the billows, flames catching, sparks, smoke
  const il = [[IMPACT - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IMPACT + 60, { transform: 'scale(1.15)', opacity: 0.95 }]];
  for (let t = IMPACT + 180, i = 0; t < 2500; t += 120, i++) il.push([t, { transform: `scale(${i % 2 ? 1.12 : 0.95})`, opacity: i % 2 ? 0.95 : 0.75 }, eio]);
  il.push([2900, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.light('g-warm', T, 70), il);
  fx(k.pic('hot', T, 34, 34, {}), [[IMPACT - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMPACT + 40, { transform: 'scale(1.1)', opacity: 1 }, 'linear'], [IMPACT + 320, { transform: 'scale(2)', opacity: 0 }]]);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + rand(), v = 12 + rand() * 12, r = Math.round(rand() * 360);
    fx(k.pic(i % 2 ? 'puffHot' : 'puff', T, 18, 18), [[IMPACT - 10, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [IMPACT + 90, { transform: `${k.T(Math.cos(a) * v * 0.6, Math.sin(a) * v * 0.5)} rotate(${r + 30}deg) scale(1)`, opacity: 0.9 }, 'linear'], [IMPACT + 480, { transform: `${k.T(Math.cos(a) * v * 1.3, Math.sin(a) * v - 6)} rotate(${r + 70}deg) scale(1.6)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 10; i++) {
    const t = IMPACT + Math.round(rand() * 80), a = -Math.PI / 2 + (rand() - 0.5) * 3.2, v = 18 + rand() * 30;
    fx(k.pic('ember', T, 3 + rand() * 2, 3 + rand() * 2, {}), [[t, { transform: `${k.T(0, 0)} scale(.6)`, opacity: 0 }, 'ease-out'], [t + 110, { transform: `${k.T(Math.cos(a) * v * 0.6, Math.sin(a) * v * 0.6)} scale(1)`, opacity: 1 }, 'ease-out'], [t + 650, { transform: `${k.T(Math.cos(a) * v, Math.sin(a) * v + 14)} scale(.3)`, opacity: 0 }]]);
  }
  const flicker = (el, on, off) => {
    const l = [[on, { transform: 'translateY(0px) scale(.6, .12)', opacity: 0 }, 'ease-out'], [on + 120, { transform: 'translateY(0px) scale(1, 1)', opacity: 0.95 }, eio]];
    for (let t = on + 120, i = 1; (t += 80 + rand() * 60) < off; i++) { const s = i % 2 ? 1 : -1; l.push([t, { transform: `translateY(${(-rand() * 1.5).toFixed(1)}px) scale(${(1 - s * 0.08 - rand() * 0.06).toFixed(2)}, ${(1 + s * 0.14 + rand() * 0.1).toFixed(2)})`, opacity: +(0.8 + rand() * 0.2).toFixed(2) }, eio]); }
    l.push([off + 260, { transform: 'translateY(0px) scale(.5, .15)', opacity: 0 }]);
    fx(el, l);
  };
  for (let i = 0; i < 5; i++) flicker(k.pic(i % 2 ? 'flame' : 'flame2', [TX + (i - 2) * 7, TY + 5], 10 + rand() * 4, 16 + rand() * 8, { base: true }), IMPACT + 60 + i * 70, 2500 + rand() * 250);
  for (let i = 0; i < 4; i++) {
    const t = IMPACT + 300 + i * 180, r = Math.round(rand() * 360);
    fx(k.pic('smoke', [TX + (rand() - 0.5) * 10, TY - 6], 26, 26, { lit: false, low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 300, { transform: `${k.T(-2, -12)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 1300, { transform: `${k.T(-8, -46)} rotate(${r + 50}deg) scale(2)`, opacity: 0 }]]);
  }
  // ── the charge below picks up dust as it surges
  for (let i = 0; i < 6; i++) {
    const t = R0 + i * 130, x = 80 + i * 40 + (rand() - 0.5) * 20, r = Math.round(rand() * 360), s = right ? 1 : -1;
    fx(k.picIn('smoke', [x, 186], 28, 20, { lit: false }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 300, { transform: `${k.T(-s * 8, -4)} rotate(${r + 20}deg) scale(1)`, opacity: 0.4 }], [t + 1400, { transform: `${k.T(-s * 26, -14)} rotate(${r + 50}deg) scale(1.9)`, opacity: 0 }]]);
  }
}
