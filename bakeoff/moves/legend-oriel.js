// Oriel, Lady of Storms: she hurls the storm she has called.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker (the suggestion was defender: she never
// blocks; her text counts Fields and, at last, deals 2 to every opponent: she throws the storm), element:
// lightning (what gathers in the rain cloud her raised hand is in).
//   0-900     the gather. The rain cloud darkens and the rain thickens; lightning flickers inside it and forks
//             crackle down from it into her raised hand, where a ball of storm light swells and beats. Her arm
//             winds back, her wings drop and her cloak sinks (anticipation); her other hand lifts its palm to
//             the sun, which flares and sends its gold up to her circlet.
//   900-1000  THE THROW: her wings beat up hard, she rises on the stroke and her raised arm whips toward T
//             (BEATS.release 1000): a flash at her hand and a jagged bolt from her hand to T, flickering.
//   1080      IMPACT at T (BEATS.impact): a flash, rings, a plume of spray, little ground forks running off,
//             sparks; steam rolls up. She follows through (the arm holds, her cloak billows).
//   1300-3600 the storm dies down: the cloud lightens, the rain thins to what is drawn, the arm lowers, wings
//             settle in beats, the sun's flare eases; (BEATS.settle 3600); END 4200, at rest as drawn.
//
// The contract (bakeoff/recipe.md): the bolt goes to T = k.aim || her own target, the sea under the rain
// (k.spec.alone). Her raised arm turns from its shoulder toward T (as far as it reaches) and the bolt leaves
// from the hand's place at the throw; every point of it is worked out from that place and T. What flies and
// lands is on the overlay (k.pic / k.light), since T may be on another card.
export const END = 4200;
export const BEATS = { release: 1000, impact: 1080, settle: 3600 };
export const STILLS = [450, 850, 1010, 1100, 1300, 1700, 2800, 3900];

const soft = (x, y) => Math.hypot(x - 0.5, y - 0.5) * 2;
export const textures = {
  spark: [24, 24, (x, y) => { const c = Math.max(0, 1 - soft(x, y)); return [226, 248, 255, Math.min(1, c * c * 2.2)]; }],
  mote: [24, 24, (x, y) => { const c = Math.max(0, 1 - soft(x, y)); return [255, 240, 196, Math.min(1, c * c * 1.8)]; }],
  mist: [48, 48, (x, y) => { const r = Math.hypot((x - 0.5) * 1.1, y - 0.5) * 2, n = 0.78 + 0.22 * Math.sin(x * 13 + y * 7) * Math.cos(y * 11 - x * 5); return [226, 242, 244, Math.pow(Math.max(0, 1 - r), 0.85) * n * 0.9]; }],
  drop: [8, 24, (x, y) => [214, 240, 246, Math.max(0, 1 - Math.abs(x - 0.5) * 2.6) * Math.pow(y, 0.7) * 0.9]],
};

export function build(k) {
  const { act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const fx = (el, list) => { let last = -1; k.fx(el, list.slice().sort((a, b) => a[0] - b[0]).map((e) => { last = Math.max(last + 1, Math.min(e[0], k.END - 1)); return [last, ...e.slice(1)]; })); };
  const S = k.spec, SH = S.shoulder, PS = S.palmShoulder, HAND = S.emit, PALM = S.palm, CROWN = S.crownAt, CLOUD = S.cloud, SUN = S.sun;
  const T = k.aim || S.alone;
  k.css(`.g-bolt { border-radius: 50%; background: radial-gradient(closest-side, rgba(246,253,255,.98), rgba(190,232,255,.6) 28%, rgba(120,190,240,.2) 60%, rgba(110,180,235,0) 100%); }
    .fx-copy.f-hot { mix-blend-mode: plus-lighter; filter: brightness(1.5) saturate(1.1); }`);

  // ── a keyed curve: values at moments, eased between
  const track = (keys) => (t) => {
    let i = keys.length - 1;
    while (i > 0 && keys[i][0] > t) i--;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const f = b[0] === a[0] ? 0 : sm(Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))));
    return a.slice(1).map((v, j) => v + (b[j + 1] - v) * f);
  };
  const grid = []; for (let t = 0; t <= 3600; t += 40) grid.push(t);
  const sample = (fn, rest = {}) => [...grid.map((t) => [t, fn(t), 'linear']), [3800, { transform: 'none', ...rest }]];
  const ang = (v) => (Math.atan2(v[1], v[0]) * 180) / Math.PI;
  const rotAbout = (p, c, deg) => { const r = (deg * Math.PI) / 180; return [c[0] + (p[0] - c[0]) * Math.cos(r) - (p[1] - c[1]) * Math.sin(r), c[1] + (p[0] - c[0]) * Math.sin(r) + (p[1] - c[1]) * Math.cos(r)]; };

  // ── where her raised arm throws: toward T (turning from the shoulder as far as it reaches)
  let dA = ang([T[0] - SH[0], T[1] - SH[1]]) - ang([HAND[0] - SH[0], HAND[1] - SH[1]]);
  dA = ((dA + 540) % 360) - 180; dA = Math.max(-70, Math.min(115, dA));
  const wind = -Math.sign(dA || 1) * 11;
  const armA = track([[0, 0], [260, 0], [760, wind], [960, wind * 1.1], [1030, dA * 1.06], [1200, dA], [2300, dA * 0.93], [3500, 0]]);
  const bob = track([[0, 0], [420, 1.8], [850, 3.2], [1010, -3.6], [1300, -1.4], [1900, -2.6], [2500, -0.8], [3500, 0]]);
  const wingA = track([[0, 0], [400, -7], [850, -16], [1020, 24], [1250, 11], [1560, 3], [1850, 14], [2250, 3], [2800, 9], [3500, 0]]);
  const palmA = track([[0, 0], [500, -7], [900, -15], [1030, -17], [1300, -4], [2300, -7], [3400, 0]]);
  const surge = track([[0, 0], [900, 0.45], [1010, 1], [1500, 0.5], [2300, 0.2], [3400, 0]]);
  const cloakR = track([[0, 0], [850, -2.2], [1100, 3.2], [1700, 1.6], [2800, -0.5], [3500, 0]]);
  const dy = (t) => bob(t)[0];
  const E = rotAbout(HAND, SH, dA); // her hand as it throws: where the bolt leaves

  // ── her: she sinks as she gathers and rises on the throw; the raised arm winds back, whips, holds, lowers
  act(k.part('torso'), sample((t) => ({ transform: k.T(0, dy(t)) })));
  act(k.part('armUp'), sample((t) => ({ transform: `${k.T(0, dy(t))} rotate(${armA(t)[0].toFixed(2)}deg)` })));
  act(k.part('armP'), sample((t) => ({ transform: `${k.T(0, dy(t))} rotate(${palmA(t)[0].toFixed(2)}deg)` })));
  const palmAt = (t) => { const p = rotAbout(PALM, PS, palmA(t)[0]); return [p[0] - PALM[0], p[1] - PALM[1] + dy(t)]; };
  act(k.part('palmlight'), sample((t) => ({ transform: `${k.T(...palmAt(t))} scale(${(1 + 0.3 * surge(t)[0]).toFixed(3)})` })));
  act(k.copy('palmlight', 'f-hot'), sample((t) => ({ transform: `${k.T(...palmAt(t))} scale(${(1 + 0.3 * surge(t)[0]).toFixed(3)})`, opacity: +(0.8 * surge(t)[0]).toFixed(2) }), { opacity: 0 }));
  act(k.part('crown'), sample((t) => ({ transform: `${k.T(0, dy(t))} scale(${(1 + 0.4 * surge(t)[0]).toFixed(3)})` })));
  act(k.part('wingL'), sample((t) => ({ transform: `${k.T(0, dy(t))} rotate(${wingA(t)[0].toFixed(2)}deg)` })));
  act(k.part('wingR'), sample((t) => ({ transform: `${k.T(0, dy(t - 20))} rotate(${(-wingA(t - 25)[0]).toFixed(2)}deg)` })));
  act(k.part('cape'), sample((t) => ({ transform: `${k.T(0, dy(t) * 0.7)} rotate(${cloakR(t)[0].toFixed(2)}deg) scale(${(1 + 0.035 * surge(t)[0]).toFixed(3)})` })));
  act(k.copy('cape', 'f-hot'), sample((t) => ({ transform: `${k.T(0, dy(t) * 0.7)} rotate(${cloakR(t)[0].toFixed(2)}deg) scale(${(1 + 0.035 * surge(t)[0]).toFixed(3)})`, opacity: +(0.12 * surge(t)[0]).toFixed(2) }), { opacity: 0 }));
  const hp = (t) => { const p = rotAbout(HAND, SH, armA(t)[0]); return [p[0] - HAND[0], p[1] - HAND[1] + dy(t)]; };

  // ── bolts: jagged strokes drawn once along their own length, turned and laid where they are wanted
  const bolt = (L, seed, forks = true) => {
    let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const n = Math.max(5, Math.round(L / 7)), H = 30, pts = [];
    for (let i = 0; i <= n; i++) pts.push([(L * i) / n, H / 2 + (i === 0 || i === n ? 0 : (rnd() - 0.5) * 12)]);
    const line = (p) => p.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ');
    let f = '';
    if (forks) for (let i = 2; i < n - 1; i += 3) { const [x, y] = pts[i], dir = rnd() > 0.5 ? 1 : -1; f += `<polyline points="${line([[x, y], [x + 5, y + dir * 6], [x + 9, y + dir * 5], [x + 15, y + dir * 12]])}" fill="none" stroke="#ffffff" stroke-width="1" stroke-linejoin="bevel" opacity=".8"/>`; }
    return k.svg(`<polyline points="${line(pts)}" fill="none" stroke="#9ed4ff" stroke-width="7" stroke-linejoin="round" opacity=".42"/><polyline points="${line(pts)}" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="bevel" stroke-linecap="round"/>${f}`, L, H);
  };
  const aimed = (a, b, seed, o = {}) => { // a bolt picture from a to b: [pic, centre, w, h, angle]
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return { src: bolt(L, seed, o.forks !== false), mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], L, deg: Math.round(ang([b[0] - a[0], b[1] - a[1]])) };
  };
  const flick = (el, deg, t0, spec) => fx(el, spec.map(([dt, o]) => [t0 + dt, { transform: `rotate(${deg}deg)`, opacity: o }, 'linear']));

  // ── the gather: the cloud darkens and flickers, forks crackle into her hand, the storm ball swells there
  fx(k.picIn('gloom', [58, 36], 190, 110, { lit: false }), [[80, { opacity: 0 }, 'ease-in'], [880, { opacity: 0.55 }, 'linear'], [1010, { opacity: 0.25 }, eio], [2200, { opacity: 0.2 }, eio], [3300, { opacity: 0 }]]);
  const cloudBolts = [[[40, 40], [58, 28]], [[72, 44], [92, 30]], [[28, 28], [44, 52]], [[86, 38], [110, 34]], [[60, 30], [75, 54]]];
  [[190, 0], [330, 3], [440, 1], [560, 4], [650, 2], [740, 0], [820, 3], [900, 1]].forEach(([t, v], i) => {
    const [a, b] = cloudBolts[v], A = aimed(a, b, 50 + i * 7, { forks: false });
    flick(k.picIn(A.src, A.mid, A.L, 30, { lit: true }), A.deg, t, [[0, 0], [20, 1], [70, 0.35], [100, 0.9], [150, 0]]);
    fx(k.lightIn('g-bolt', [a[0] + (b[0] - a[0]) / 2, a[1] + (b[1] - a[1]) / 2], 70, 46), [[t, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [t + 30, { transform: 'scale(1)', opacity: 0.42 + i * 0.04 }, eio], [t + 190, { transform: 'scale(1.2)', opacity: 0 }]]);
  });
  // crackles from the cloud down into her raised hand (they follow it as it winds back)
  const arcFrom = [[80, 36], [96, 30], [70, 44]];
  [[300, 0], [470, 1], [600, 2], [720, 0], [830, 1], [920, 2]].forEach(([t, v], i) => {
    const a = arcFrom[v], h = hp(t), b = [HAND[0] + h[0], HAND[1] + h[1]], A = aimed(a, b, 90 + i * 11, { forks: false });
    flick(k.pic(A.src, A.mid, A.L, 30), A.deg, t, [[0, 0], [18, 1], [60, 0.4], [90, 0.95], [130, 0]]);
  });
  // the storm ball at her hand
  const hl = [[120, { transform: `${k.T(0, 0)} scale(.3)`, opacity: 0 }, 'ease-out']];
  for (let t = 200; t <= 1000; t += 60) { const [x, y] = hp(t), g = sm(Math.min(1, (t - 120) / 800)), b = 0.5 + 0.5 * Math.sin(t / 55); hl.push([t, { transform: `${k.T(x, y)} scale(${(0.4 + 1.1 * g + 0.14 * b).toFixed(2)})`, opacity: +(0.2 + 0.78 * g * (0.75 + 0.25 * b)).toFixed(2) }, 'linear']); }
  hl.push([1030, { transform: `${k.T(...hp(1030))} scale(2.2)`, opacity: 1 }, 'ease-out'], [1250, { transform: `${k.T(...hp(1250))} scale(1.4)`, opacity: 0.45 }, eio], [1700, { transform: `${k.T(...hp(1700))} scale(.8)`, opacity: 0 }]);
  fx(k.light('g-bolt', HAND, 40), hl);
  // sparks spiral in to the hand
  for (let i = 0; i < 12; i++) {
    const th0 = rand() * 6.28, spin = i % 2 ? 1 : -1, r0 = 14 + rand() * 16, t0 = 200 + rand() * 520, dur = 360 + rand() * 200, list = [];
    for (let j = 0; j <= 5; j++) { const f = j / 5, th = th0 + spin * f * 4, r = r0 * (1 - f * f), t = Math.round(t0 + dur * f), [hx, hy] = hp(Math.min(t, 1000)); list.push([t, { transform: `${k.T(hx + Math.cos(th) * r, hy + Math.sin(th) * r * 0.8)} scale(${(0.5 + 0.8 * (1 - f)).toFixed(2)})`, opacity: j === 0 || j === 5 ? 0 : 0.9 }, 'linear']); }
    fx(k.pic('spark', HAND, 4 + rand() * 2.5, 4 + rand() * 2.5), list);
  }

  // ── the rain thickens over the sea on the left, and thins again
  const streak = k.svg('<line x1="2" y1="0" x2="1" y2="22" stroke="#e4f6f8" stroke-width="1" stroke-linecap="round"/>', 4, 22);
  for (let i = 0; i < 10; i++) {
    const x = 6 + i * 11 + rand() * 6, y0 = 66 + rand() * 18, fall = 60 + rand() * 20;
    for (let c = 0, t = 220 + rand() * 300; t < 3000; c++, t += 560 + rand() * 100) {
      const o = 0.7 * sm(Math.min(1, t / 900)) * (1 - sm(Math.max(0, Math.min(1, (t - 2000) / 1000))));
      fx(k.picIn(streak, [x, y0], 1.6, 20, { lit: false }), [[t, { transform: `${k.T(0, 0)} rotate(5deg)`, opacity: 0 }, 'ease-in'], [t + 70, { transform: `${k.T(-0.5, 4)} rotate(5deg)`, opacity: +o.toFixed(2) }, 'linear'], [t + 400, { transform: `${k.T(-5, fall)} rotate(5deg)`, opacity: 0 }]]);
    }
  }

  // ── her sun flares to her palm and circlet, and eases as the storm dies
  fx(k.lightIn('g-warm', SUN, 120, 90), [[300, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(1.15)', opacity: 0.8 }, eio], [1500, { transform: 'scale(1)', opacity: 0.55 }, eio], [2500, { transform: 'scale(1.08)', opacity: 0.3 }, eio], [3500, { transform: 'scale(.8)', opacity: 0 }]]);
  const pl = [[300, { transform: 'scale(.4)', opacity: 0 }, 'ease-out']];
  for (let t = 500; t <= 3300; t += 100) { const [x, y] = palmAt(t), g = surge(t)[0]; pl.push([t, { transform: `${k.T(x, y)} scale(${(0.6 + 0.9 * g).toFixed(2)})`, opacity: +(0.15 + 0.7 * g).toFixed(2) }, 'linear']); }
  pl.push([3600, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }]);
  fx(k.light('g-warm', PALM, 30), pl);
  fx(k.light('g-warm', [CROWN[0], CROWN[1]], 26), [[600, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1020, { transform: 'scale(1.3)', opacity: 0.9 }, eio], [1600, { transform: 'scale(1)', opacity: 0.4 }, eio], [2600, { transform: 'scale(1.1)', opacity: 0.15 }, eio], [3400, { transform: 'scale(.5)', opacity: 0 }]]);

  // ── THE THROW (BEATS.release 1000): a flash at her hand, a jagged bolt from her hand to T, flickering
  const E2 = [E[0], E[1] - 3.6];
  fx(k.light('g-bolt', E2, 70), [[960, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1020, { transform: 'scale(1.4)', opacity: 1 }, 'ease-out'], [1160, { transform: 'scale(1.2)', opacity: 0.5 }, 'ease-out'], [1500, { transform: 'scale(.7)', opacity: 0 }]]);
  const variants = [aimed(E2, T, 11), aimed(E2, T, 29), aimed(E2, T, 47)];
  const bt = [[[1000, 0], [1012, 1], [1066, 0.85], [1084, 0], [1230, 0], [1244, 0.7], [1300, 0], [1330, 0]],
    [[1000, 0], [1084, 0], [1098, 1], [1150, 0.6], [1172, 0], [1330, 0]],
    [[1000, 0], [1168, 0], [1182, 0.9], [1222, 0], [1330, 0]]];
  variants.forEach((V, i) => fx(k.pic(V.src, V.mid, V.L, 30), bt[i].map(([t, o]) => [t, { transform: `rotate(${V.deg}deg)`, opacity: o }, 'linear'])));
  // a lit halo along the whole bolt (one soft stroke, brighter than the bolt), flashing with it
  const halo = aimed(E2, T, 5, { forks: false });
  fx(k.pic(k.svg(`<line x1="0" y1="15" x2="${halo.L.toFixed(1)}" y2="15" stroke="#bfe6ff" stroke-width="13" stroke-linecap="round" opacity=".55"/>`, halo.L, 30), halo.mid, halo.L, 30, { low: true }), [[1000, { transform: `rotate(${halo.deg}deg)`, opacity: 0 }, 'linear'], [1030, { transform: `rotate(${halo.deg}deg)`, opacity: 0.8 }, 'linear'], [1110, { transform: `rotate(${halo.deg}deg)`, opacity: 0.2 }, 'linear'], [1135, { transform: `rotate(${halo.deg}deg)`, opacity: 0.6 }, 'linear'], [1340, { transform: `rotate(${halo.deg}deg)`, opacity: 0 }]]);

  // ── IMPACT at T (BEATS.impact 1080): a flash, rings, a plume of spray, ground forks, sparks, steam
  const I = 1080;
  const il = [[I - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [I + 30, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out']];
  for (let t = I + 170, i = 0; t < 1900; t += 130, i++) il.push([t, { transform: `scale(${i % 2 ? 1.1 : 0.95})`, opacity: i % 2 ? 0.6 : 0.4 }, eio]);
  il.push([2300, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.light('g-bolt', T, 100), il);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><ellipse cx="30" cy="30" rx="26" ry="26" fill="none" stroke="#eaf8ff" stroke-width="2.6" filter="url(#b)"/>', 60, 60);
  [[I, 3.4, 0.95], [I + 140, 2.7, 0.7], [I + 320, 2.1, 0.5]].forEach(([t, s2, o]) => fx(k.pic(ring, T, 34, 34), [[t, { transform: 'scale(.25)', opacity: 0 }, 'ease-out'], [t + 60, { transform: 'scale(.55)', opacity: o }], [t + 800, { transform: `scale(${s2})`, opacity: 0 }]]));
  // forks running off along the surface
  for (let i = 0; i < 5; i++) {
    const a = ((i - 2) * 28 + (rand() - 0.5) * 12) * Math.PI / 180, r = 18 + rand() * 12, b = [T[0] + Math.sin(a) * r * 1.3, T[1] - Math.cos(a) * r * 0.55 + 2], A = aimed(T, b, 130 + i * 9, { forks: false });
    flick(k.pic(A.src, A.mid, A.L, 30), A.deg, I + i * 22, [[0, 0], [16, 1], [60, 0.4], [90, 0.8], [150, 0]]);
  }
  // spray: spouts of water thrown up, dropping back, with drops flung out
  for (let i = 0; i < 5; i++) {
    const dx = (i - 2) * 7 + (rand() - 0.5) * 3, h = 22 + rand() * 14, t = I + 20 + i * 24;
    fx(k.pic('mist', [T[0] + dx, T[1] - 2], 20, 20, { lit: false }), [[t, { transform: `${k.T(0, 0)} scale(.4, .3)`, opacity: 0 }, 'ease-out'], [t + 130, { transform: `${k.T(dx * 0.3, -h * 0.7)} scale(.9, 1.5)`, opacity: 0.85 }, 'ease-out'], [t + 330, { transform: `${k.T(dx * 0.5, -h)} scale(1.3, 1.2)`, opacity: 0.6 }, 'ease-in'], [t + 700, { transform: `${k.T(dx * 0.7, 1)} scale(1.6, .6)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 14; i++) {
    const a = (rand() - 0.5) * 2.4, v = 14 + rand() * 18, t = I + 30 + rand() * 120, up = v * Math.cos(a), sd = v * Math.sin(a) * 1.3;
    fx(k.pic('drop', T, 2.2, 7), [[t, { transform: `${k.T(0, 0)} rotate(${Math.round(a * 30)}deg)`, opacity: 0 }, 'ease-out'], [t + 90, { transform: `${k.T(sd * 0.5, -up * 0.9)} rotate(${Math.round(a * 50)}deg)`, opacity: 0.95 }, 'ease-out'], [t + 520, { transform: `${k.T(sd, 4)} rotate(${Math.round(a * 90 + 60)}deg)`, opacity: 0 }, 'ease-in']]);
  }
  for (let i = 0; i < 10; i++) {
    const a = rand() * 6.28, r = 10 + rand() * 20, t = I + 20 + rand() * 120, sz = 2.2 + rand() * 2.6;
    fx(k.pic('spark', T, sz, sz), [[t, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], [t + 90, { transform: `${k.T(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.4 - 6)} scale(1)`, opacity: 1 }, 'ease-out'], [t + 520, { transform: `${k.T(Math.cos(a) * r, Math.sin(a) * r * 0.5 + 3)} scale(.3)`, opacity: 0 }]]);
  }
  // steam rolling up off the water after
  for (let i = 0; i < 5; i++) {
    const t = I + 280 + i * 200, r = Math.round(rand() * 360), dx = (rand() - 0.5) * 18;
    fx(k.pic('mist', [T[0] + dx, T[1] - 4], 20, 20, { lit: false, low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 350, { transform: `${k.T(-1, -9)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 1500, { transform: `${k.T(-5, -34)} rotate(${r + 50}deg) scale(1.9)`, opacity: 0 }]]);
  }

  // ── as the storm dies: motes of gold lift off the sea round her
  for (let i = 0; i < 10; i++) {
    const x = 120 + rand() * 120, y = 140 + rand() * 40, t = 1700 + rand() * 1500, s2 = 2 + rand() * 2.4, dx = (rand() - 0.5) * 14;
    fx(k.picIn('mote', [x, y], s2, s2), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 160, { transform: `${k.T(dx * 0.1, -6)} scale(1)`, opacity: 0.85 }, 'linear'], [t + 1300, { transform: `${k.T(dx, -50 - rand() * 26)} scale(.5)`, opacity: 0 }]]);
  }
}
