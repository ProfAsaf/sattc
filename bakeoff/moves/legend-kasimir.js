// Kasimir, the First Blade: he never arrives second. A sword blazing, he flings himself at the foe: one
// great slash, and the fire of it flies on ahead.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker, element: fire (the suggestion was earth;
// what his picture shows is the blazing sword and the dawn gold).
//   0-140     if his target is behind him he turns about (through a sliver), mirrored from then on.
//   140-900   the gather: he coils back in the air, leaning away, the sword arm winds back over his head,
//             the banner drags and streams behind; the sword's fire swells, white at the heart, embers
//             spiralling in to the blade, the dawn flares up behind him.
//   900-1000  the lunge: he throws himself forward and the sword arm whips down toward T, a bright arc of
//             fire swept through the air behind the blade.  BEATS.release 1000: the slash lets go of the tip.
//   1000-1250 a crescent of fire flies from the sword's tip to T, trailing billows and sparks.
//   1250      IMPACT at T (BEATS.impact): a flash, rings, billows bursting, flames catching, sparks and smoke.
//   1000-3600 he follows through (the arm holds, then lifts, the banner snaps forward and settles), the fire
//             at T burns down; (BEATS.settle 3600); END 4200: at rest as drawn.
//
// The contract (bakeoff/recipe.md): the slash goes to T = k.aim || the enemy line below in the smoke
// (k.spec.alone). If T is behind him he turns about and the whole puppet is mirrored about his middle; the
// sword arm turns toward T and every point of the slash is worked out from the sword's tip then, and T.
// What flies and lands is on the overlay (k.pic / k.light), since T may be on another card.
export const END = 4200;
export const BEATS = { release: 1000, impact: 1250, settle: 3600 };
export const STILLS = [450, 850, 1000, 1130, 1260, 1500, 2300, 3900];

const soft = (x, y) => Math.hypot(x - 0.5, y - 0.5) * 2;
export const textures = {
  ember: [24, 24, (x, y) => { const c = Math.max(0, 1 - soft(x, y)); return [255, 214, 120, Math.min(1, c * c * 2.0)]; }],
  spark: [24, 24, (x, y) => { const c = Math.max(0, 1 - soft(x, y)); return [255, 246, 210, Math.min(1, c * c * 2.4)]; }],
};

export function build(k) {
  const { act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const fx = (el, list) => { let last = -1; k.fx(el, list.slice().sort((a, b) => a[0] - b[0]).map((e) => { last = Math.max(last + 1, Math.min(e[0], k.END - 1)); return [last, ...e.slice(1)]; })); };
  const S = k.spec, SS = S.shoulder, BS = S.bshoulder, TOP = S.top, MID = S.mid, TIP = S.emit;
  const T = k.aim || S.alone;
  const AX = 150, behind = T[0] < AX - 14;
  const Tu = behind ? [2 * AX - T[0], T[1]] : T; // T as seen from the unmirrored pose
  k.css(`.fx-copy.f-hot { mix-blend-mode: plus-lighter; filter: brightness(1.45) saturate(1.1); }`);

  // ── helpers
  const track = (keys) => (t) => {
    let i = keys.length - 1;
    while (i > 0 && keys[i][0] > t) i--;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const f = b[0] === a[0] ? 0 : sm(Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))));
    return a.slice(1).map((v, j) => v + (b[j + 1] - v) * f);
  };
  const ang = (v) => (Math.atan2(v[1], v[0]) * 180) / Math.PI;
  const rotAbout = (p, c, deg) => { const r = (deg * Math.PI) / 180; return [c[0] + (p[0] - c[0]) * Math.cos(r) - (p[1] - c[1]) * Math.sin(r), c[1] + (p[0] - c[0]) * Math.sin(r) + (p[1] - c[1]) * Math.cos(r)]; };
  const grid = []; for (let t = 0; t <= 3600; t += 40) grid.push(t);

  // ── which way he faces: turned about (through a sliver) if T is behind him
  const M = behind ? track([[0, 1], [140, 1], [470, -1], [3000, -1], [3600, 1]]) : () => [1];
  // ── the pose, in his own (unmirrored) space
  let dA = ang([Tu[0] - SS[0], Tu[1] - SS[1]]) - ang([TIP[0] - SS[0], TIP[1] - SS[1]]);
  dA = ((dA + 540) % 360) - 180; dA = Math.max(-35, Math.min(150, dA));
  const lean = track([[0, 0], [500, -5], [860, -9], [1010, 8], [1250, 5], [2100, 2], [3500, 0]]);
  const hopX = track([[0, 0], [500, -4], [860, -7], [1010, 9], [1250, 6], [2100, 2], [3500, 0]]);
  const hopY = track([[0, 0], [500, 3], [860, 5], [1010, -4], [1250, -1], [2200, 0.6], [3500, 0]]);
  const armS = track([[0, 0], [300, -6], [860, -40], [960, -46], [1040, dA * 0.92], [1110, dA * 1.04], [1300, dA], [2300, dA * 0.84], [3500, 0]]);
  const armB = track([[0, 0], [500, 7], [860, 15], [1010, -12], [1300, -5], [2200, 3], [3500, 0]]);
  const flap = track([[0, 0], [500, 5], [860, 11], [1010, -15], [1200, -7], [1500, 5], [1900, -4], [2400, 3], [3000, -1], [3500, 0]]);
  const gust = track([[0, 1], [860, 0.93], [1010, 1.12], [1300, 1], [1900, 1.04], [2500, 1], [3500, 1]]);
  const surge = track([[0, 0], [880, 0.5], [1000, 1], [1400, 0.6], [2300, 0.25], [3500, 0]]);
  // a point of his (unmirrored) body, through its chain: an arm (turned about its joint), the lean about his middle, the hop
  const W = (p, t, joint, a = 0) => { let q = joint ? rotAbout(p, joint, a) : p; q = rotAbout(q, MID, lean(t)[0]); return [q[0] + hopX(t)[0], q[1] + hopY(t)[0]]; };
  const tru = (p, t) => [AX + M(t)[0] * (p[0] - AX), p[1]]; // to the true (mirrored) place
  const pose = (P, q, rot, m, sc) => ({ transform: `${k.T(q[0] - P[0], q[1] - P[1])} scaleX(${(Math.abs(m) < 0.05 ? 0.05 * Math.sign(m || 1) : m).toFixed(3)}) rotate(${rot.toFixed(2)}deg)${sc ? ` scale(${sc[0].toFixed(3)}, ${sc[1].toFixed(3)})` : ''}` });
  const sampled = (P, mk, extra) => [...grid.map((t) => { const m = M(t)[0], q = tru(mk.q(t), t); return [t, { ...pose(P, q, mk.r(t), m, mk.s && mk.s(t)), ...(extra ? extra(t) : {}) }, 'linear']; }), [3800, { transform: 'none', ...(extra ? extra(3800) : {}) }]];
  const chains = {
    body: { q: (t) => W(MID, t), r: (t) => lean(t)[0] },
    decor: { q: (t) => W(MID, t), r: (t) => lean(t)[0] },
    armS: { q: (t) => W(SS, t), r: (t) => lean(t)[0] + armS(t)[0] },
    sword: { q: (t) => W(SS, t), r: (t) => lean(t)[0] + armS(t)[0] },
    armB: { q: (t) => W(BS, t), r: (t) => lean(t)[0] + armB(t)[0] },
    banner: { q: (t) => W(rotAbout(TOP, BS, armB(t)[0]), t), r: (t) => lean(t)[0] + armB(t)[0] + flap(t)[0], s: (t) => [gust(t)[0], 1 / Math.sqrt(gust(t)[0])] },
  };
  // (an arm's chain: W(joint, t) alone is wrong when the arm is turned about its own joint; the joint stays put, so it is right)
  for (const name of ['body', 'decor', 'armS', 'armB', 'banner', 'sword']) {
    const pv = { body: MID, decor: MID, armS: SS, sword: SS, armB: BS, banner: TOP }[name];
    act(k.part(name), sampled(pv, chains[name]));
  }
  // the sword's heart flares white: a bright copy over it, shown by opacity
  act(k.copy('sword', 'f-hot'), sampled(SS, chains.sword, (t) => ({ opacity: +(0.85 * surge(t)[0]).toFixed(2) })));

  // where the blade is at ms t, a fraction f of the way from the shoulder to the tip (true place)
  const bladeAt = (f, t) => tru(W([SS[0] + (TIP[0] - SS[0]) * f, SS[1] + (TIP[1] - SS[1]) * f], t, SS, armS(t)[0]), t);
  const track2 = (fn, t0, t1, mk, step = 50) => { const out = []; for (let t = t0; t <= t1; t += step) out.push([t, mk(t, fn(t)), 'linear']); return out; };
  const E = bladeAt(1, 1030); // the tip as it throws: where the slash leaves
  const rel = (p, base) => [p[0] - base[0], p[1] - base[1]];

  // ── the dawn flares behind him as he gathers
  fx(k.lightIn('g-warm', [236, 150], 230, 120), [[200, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(1.1)', opacity: 0.75 }, eio], [1600, { transform: 'scale(1)', opacity: 0.5 }, eio], [2600, { transform: 'scale(1.05)', opacity: 0.25 }, eio], [3500, { transform: 'scale(.8)', opacity: 0 }]]);

  // ── the gather: the blade swells with light, embers spiral in to it
  const c0 = bladeAt(0.6, 0);
  fx(k.light('g-warm', c0, 60), [[100, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], ...track2((t) => bladeAt(0.6, t), 150, 1250, (t, c) => { const g = surge(t)[0], b = 0.5 + 0.5 * Math.sin(t / 60); return { transform: `${k.T(...rel(c, c0))} scale(${(0.7 + 1.1 * g + 0.12 * b).toFixed(2)})`, opacity: +Math.min(1, 0.3 + 0.6 * g + 0.1 * b).toFixed(2) }; }, 50), [1700, { transform: `${k.T(...rel(bladeAt(0.6, 1700), c0))} scale(.9)`, opacity: 0.25 }, eio], [2500, { transform: `${k.T(...rel(bladeAt(0.6, 2500), c0))} scale(.7)`, opacity: 0 }]]);
  const tip0 = bladeAt(1, 0);
  fx(k.light('g-warm', tip0, 34), [[300, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], ...track2((t) => bladeAt(1, t), 350, 1100, (t, c) => ({ transform: `${k.T(...rel(c, tip0))} scale(${(0.6 + 1.1 * surge(t)[0]).toFixed(2)})`, opacity: +(0.3 + 0.7 * surge(t)[0]).toFixed(2) }), 50), [1400, { transform: `${k.T(...rel(bladeAt(1, 1400), tip0))} scale(1)`, opacity: 0.35 }, eio], [2000, { transform: `${k.T(...rel(bladeAt(1, 2000), tip0))} scale(.5)`, opacity: 0 }]]);
  for (let i = 0; i < 14; i++) {
    const th0 = rand() * 6.28, spin = i % 2 ? 1 : -1, r0 = 18 + rand() * 20, t0 = 160 + rand() * 600, dur = 380 + rand() * 220, list = [];
    for (let j = 0; j <= 5; j++) { const f = j / 5, th = th0 + spin * f * 4.2, r = r0 * (1 - f * f), t = Math.round(t0 + dur * f), b = bladeAt(0.5 + 0.5 * rand(), Math.min(t, 1000)); list.push([t, { transform: `${k.T(...rel([b[0] + Math.cos(th) * r, b[1] + Math.sin(th) * r * 0.8], c0))} scale(${(0.5 + 0.8 * (1 - f)).toFixed(2)})`, opacity: j === 0 || j === 5 ? 0 : 0.95 }, 'linear']); }
    fx(k.pic(i % 3 ? 'ember' : 'spark', c0, 3.2 + rand() * 2.4, 3.2 + rand() * 2.4), list);
  }
  // a few licks of flame at the blade while he holds the wind-up
  const flicker = (el, on, off, lean2 = 0) => {
    const sk = (d) => `skewX(${(lean2 + d).toFixed(1)}deg)`;
    const list = [[on, { transform: `translateY(0px) scale(.6, .12) ${sk(0)}`, opacity: 0 }, 'ease-out'], [on + 120, { transform: `translateY(0px) scale(1, 1) ${sk(0)}`, opacity: 0.95 }, eio]];
    for (let t = on + 120, i = 1; (t += 70 + rand() * 60) < off; i++) { const s = i % 2 ? 1 : -1; list.push([t, { transform: `translateY(${(-rand() * 1.5).toFixed(1)}px) scale(${(1 - s * 0.08 - rand() * 0.06).toFixed(2)}, ${(1 + s * 0.14 + rand() * 0.1).toFixed(2)}) ${sk(s * (2 + rand() * 5))}`, opacity: +(0.8 + rand() * 0.2).toFixed(2) }, eio]); }
    list.push([Math.min(k.END, off + 260), { transform: `translateY(0px) scale(.5, .15) ${sk(0)}`, opacity: 0 }]);
    fx(el, list);
  };

  // ── THE SWEEP (900-1200): a bright arc of fire swept through the air behind the blade, about the shoulder
  const R = Math.hypot(TIP[0] - SS[0], TIP[1] - SS[1]), a0 = ang([TIP[0] - SS[0], TIP[1] - SS[1]]); // (a0: the blade's angle at rest)
  const arcShape = (th0, th1, ro, ri) => { // a crescent between two radii, tapering at both ends, in a 2(ro+2) box centred on its middle
    const c = ro + 2, pts = [], n = 18;
    for (let i = 0; i <= n; i++) { const th = ((th0 + (th1 - th0) * (i / n)) * Math.PI) / 180; pts.push([c + Math.cos(th) * ro, c + Math.sin(th) * ro]); }
    for (let i = n; i >= 0; i--) { const f = i / n, th = ((th0 + (th1 - th0) * f) * Math.PI) / 180, r = ro - (ro - ri) * Math.sin(Math.PI * f) ** 0.7; pts.push([c + Math.cos(th) * r, c + Math.sin(th) * r]); }
    return 'M' + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L') + 'Z';
  };
  const swing = Math.min(110, Math.max(70, Math.abs(dA) + 40));
  const arcSrc = k.svg(`<defs><filter id="b"><feGaussianBlur stdDeviation="1.1"/></filter></defs><path d="${arcShape(-swing, 0, R, R - 15)}" fill="#ff9a3a" opacity=".6" filter="url(#b)"/><path d="${arcShape(-swing, 0, R - 1, R - 8)}" fill="#ffe9a8"/><path d="${arcShape(-swing * 0.8, 0, R - 2, R - 4)}" fill="#ffffff" opacity=".85"/>`, 2 * (R + 2), 2 * (R + 2));
  const SSt = tru(SS, 1000), mm = M(1100)[0] < 0 ? -1 : 1;
  // (the arc's head follows the blade: its angle runs from the wind-up's blade angle to the throw's)
  const headA = (t) => a0 + armS(t)[0] + lean(t)[0];
  const arcPose = (t, o) => ({ transform: `scaleX(${mm}) rotate(${(headA(t)).toFixed(1)}deg)`, opacity: o });
  fx(k.pic(arcSrc, SSt, 2 * (R + 2), 2 * (R + 2)), [[950, arcPose(960, 0), 'linear'], [1000, arcPose(1000, 0.85), 'linear'], [1060, arcPose(1060, 1), 'linear'], [1120, arcPose(1120, 0.9), 'linear'], [1220, arcPose(1180, 0.4), 'linear'], [1340, arcPose(1200, 0)]]);
  // a flash at the tip as it lets go, and gusts of sparks flung off the blade
  fx(k.light('g-warm', E, 54), [[960, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1030, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [1200, { transform: 'scale(1.1)', opacity: 0.5 }, 'ease-out'], [1600, { transform: 'scale(.6)', opacity: 0 }]]);
  for (let i = 0; i < 10; i++) {
    const t = 1000 + i * 18, f = 0.5 + 0.5 * rand(), b = bladeAt(f, 1040), dx = (rand() - 0.2) * 22, dy = (rand() - 0.2) * 22;
    fx(k.pic(i % 2 ? 'ember' : 'spark', E, 2.6 + rand() * 2.4, 2.6 + rand() * 2.4), [[t, { transform: `${k.T(...rel(b, E))} scale(.4)`, opacity: 0 }, 'ease-out'], [t + 80, { transform: `${k.T(...rel(b, E))} scale(1)`, opacity: 1 }, 'ease-out'], [t + 460, { transform: `${k.T(b[0] - E[0] + dx, b[1] - E[1] + dy + 10)} scale(.3)`, opacity: 0 }]]);
  }

  // ── THE SLASH (BEATS.release 1000 to .impact 1250): a crescent of fire flies from the tip to T, trailing billows
  const L = Math.hypot(T[0] - E[0], T[1] - E[1]) || 1, dir = [(T[0] - E[0]) / L, (T[1] - E[1]) / L], dAng = Math.round(ang(dir));
  const C = [(E[0] + T[0]) / 2 - dir[1] * 0 , Math.min(E[1], T[1]) - 8 + (E[1] > T[1] ? 0 : 0)]; // a slight lift to the flight
  const bz = (f) => { const q = 1 - f; return [q * q * E[0] + 2 * q * f * C[0] + f * f * T[0], q * q * E[1] + 2 * q * f * C[1] + f * f * T[1]]; };
  const [X0, Y0] = k.P(...E), relP = (p) => { const [x, y] = k.P(...p); return [x - X0, y - Y0]; };
  const cres = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".8"/></filter><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff8a2a" stop-opacity="0"/><stop offset=".5" stop-color="#ffb14a"/><stop offset="1" stop-color="#fff2c0"/></linearGradient></defs>' +
    '<path d="M6,2Q34,12 38,28Q22,20 6,38Q16,20 6,2Z" fill="#ff7a1a" opacity=".55" filter="url(#b)"/><path d="M8,4Q32,13 36,27Q22,21 8,36Q16,20 8,4Z" fill="url(#g)"/><path d="M20,10Q32,15 35,26Q26,21 20,10Z" fill="#fffaf0" opacity=".9"/>', 40, 40);
  const cl = [], FL = 250;
  for (let j = 0; j <= 7; j++) { const f = j / 7, t = Math.round(1000 + FL * f), [x, y] = relP(bz(f)), sc = 0.55 + 0.75 * f; cl.push([t, { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${dAng}deg) scale(${sc.toFixed(2)}, ${(sc * (0.8 + 0.3 * f)).toFixed(2)})`, opacity: j === 0 ? 0 : 1 }, 'linear']); }
  { const [x, y] = relP(T); cl.push([1290, { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${dAng}deg) scale(1.6, 1.5)`, opacity: 0 }, 'ease-out']); }
  fx(k.pic(cres, E, 26 + Math.min(10, L * 0.05), 26 + Math.min(10, L * 0.05)), cl);
  // billows of fire trailing it, drawn out along the flight
  for (let i = 0; i < 12; i++) {
    const t0 = 1000 + i * 20, r = Math.round(rand() * 360), side = (rand() - 0.5) * 8, sz = 16 + rand() * 8, hot = i % 3 === 2;
    const at = (f, sc, o) => { const [x, y] = relP(bz(f)); return { transform: `translate(${(x - dir[1] * side * u).toFixed(1)}px, ${(y + dir[0] * side * u).toFixed(1)}px) rotate(${r + Math.round(f * 60)}deg) scale(${sc})`, opacity: o }; };
    fx(k.pic(hot ? 'puffCool' : 'puffHot', E, sz, sz), [[t0, at(0, 0.4, 0), 'ease-out'], [t0 + 50, at(0.1, 0.7, 0.9)], [t0 + FL * 0.5, at(0.55, 0.9, 0.85)], [t0 + FL * 0.95, at(1, 1.1, 0.7), 'ease-out'], [t0 + FL + 420, at(1, 1.9, 0)]]);
  }

  // ── IMPACT at T (BEATS.impact 1250): a flash, rings, billows burst, flames catch, sparks, smoke
  const I = 1250;
  const il = [[I - 50, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [I + 40, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out']];
  for (let t = I + 160, i = 0; t < 2100; t += 120, i++) il.push([t, { transform: `scale(${i % 2 ? 1.12 : 0.95})`, opacity: i % 2 ? 0.95 : 0.72 }, eio]);
  il.push([2700, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.light('g-warm', T, 70), il);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#fff0c0" stroke-width="2.6" filter="url(#b)"/>', 60, 60);
  [[I, 3.6, 0.95], [I + 140, 2.8, 0.7], [I + 300, 2.2, 0.5]].forEach(([t, s2, o]) => fx(k.pic(ring, T, 26, 26), [[t, { transform: 'scale(.25)', opacity: 0 }, 'ease-out'], [t + 60, { transform: 'scale(.55)', opacity: o }], [t + 800, { transform: `scale(${s2})`, opacity: 0 }]]));
  for (let i = 0; i < 8; i++) {
    const a = rand() * 6.28, r = 6 + rand() * 14, t = I - 10 + rand() * 90, rr = Math.round(rand() * 360);
    fx(k.pic(i % 3 === 2 ? 'puffCool' : 'puff', T, 22, 22), [[t, { transform: `rotate(${rr}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 90, { transform: `${k.T(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.4 - 3)} rotate(${rr + 30}deg) scale(1)`, opacity: 0.95 }], [t + 330, { transform: `${k.T(Math.cos(a) * r, Math.sin(a) * r * 0.6 - 6)} rotate(${rr + 60}deg) scale(1.5)`, opacity: 0.6 }, 'ease-out'], [t + 700, { transform: `${k.T(Math.cos(a) * r * 1.2, Math.sin(a) * r * 0.7 - 10)} rotate(${rr + 80}deg) scale(1.9)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 5; i++) flicker(k.pic(i % 2 ? 'flame' : 'flame2', [T[0] + (i - 2) * 6.5 + (rand() - 0.5) * 3, T[1] + 5], 10 + rand() * 4, 16 + rand() * 8, { base: true }), I + 60 + i * 60, 2250 + rand() * 250);
  for (let i = 0; i < 16; i++) {
    const a = rand() * 6.28, r = 12 + rand() * 24, t = I + rand() * 120, sz = 2.4 + rand() * 2.6;
    fx(k.pic(i % 3 ? 'ember' : 'spark', T, sz, sz), [[t, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], [t + 100, { transform: `${k.T(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.5 - 6)} scale(1)`, opacity: 1 }, 'ease-out'], [t + 620, { transform: `${k.T(Math.cos(a) * r, Math.sin(a) * r * 0.4 + 12)} scale(.3)`, opacity: 0 }, 'ease-in']]);
  }
  for (let i = 0; i < 4; i++) {
    const t = I + 300 + i * 180, r = Math.round(rand() * 360);
    fx(k.pic('smoke', [T[0] + (rand() - 0.5) * 12, T[1] - 6], 26, 26, { lit: false, low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 300, { transform: `${k.T(-2, -12)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 1300, { transform: `${k.T(-8, -46)} rotate(${r + 50}deg) scale(2)`, opacity: 0 }]]);
  }

  // ── as he settles: embers lift off the blade, and a last glint
  for (let i = 0; i < 8; i++) {
    const t = 1500 + rand() * 1500, b = bladeAt(0.5 + 0.5 * rand(), Math.min(t, 3400)), s2 = 2 + rand() * 2;
    fx(k.pic('ember', b, s2, s2), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 160, { transform: `${k.T(0, -4)} scale(1)`, opacity: 0.85 }, 'linear'], [t + 1100, { transform: `${k.T((rand() - 0.5) * 12, -30 - rand() * 20)} scale(.4)`, opacity: 0 }]]);
  }
}
