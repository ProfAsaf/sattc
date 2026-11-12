// Mire Witch: she gathers the wisps into her lantern, hurls them, and the life they drain comes home to her.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker (the drain is the blow: "each opponent loses 1 Life
// and you gain 2"; the suggestion was defender, but her text is a drain, not a block), element: spirit (violet
// will-o'-wisps; the suggestion stands). She faces right, the lantern in her raised hand. T = k.aim, or, alone,
// the open water before the dead tree (`alone`). If T is behind her she does not turn.
//   0-760     the gather: she dips the lantern (anticipation), then raises it high; the seven wisps
//             stir, then stream into the lantern one after another, spiralling, dwindling; the lantern swells
//             with light, lime motes drifting up from it.
//   960-1060  the throw: the arm flung out and down; the lantern flares.
//   1040      RELEASE: the wisps burst out of the lantern as seven violet-white orbs, a ripple of them, each
//             trailing puffs and sparks along its own arc to T.
//   1560      IMPACT (the first lands; the rest by 1700): each bursts at T: a flash, a ring, sparks; a big violet
//             flash where they strike.
//   1600-2400 the drain: motes of pale lime-gold light are torn out at T and stream home to her chest, arriving
//             one after another: a green glow in her, rings spreading on the water round her knees, the lantern
//             answering.
//   2200-2900 she settles: the arm comes down.
//   2600-3400 the wisps come out of the lantern again, one after another, and drift home to their places.
//   3500      at rest as drawn (BEATS.settle); the move ends at END.
// Contract: T = k.aim || alone; the orbs leave from where the lantern is at the throw (worked out from her pose) and
// each goes to T plus its own offset; everything that flies or lands is on the overlay.
export const END = 4000;
export const BEATS = { release: 1040, impact: 1560, settle: 3500 };
export const STILLS = [500, 900, 1060, 1300, 1580, 1900, 2400, 3700];

export const textures = {
  // violet fire, white-hot in the heart
  wpuff: [40, 40, (x, y) => {
    const r = Math.hypot(x - 0.5, y - 0.5) * 2, a = Math.pow(Math.max(0, 1 - r), 1.3) * (0.7 + 0.3 * Math.sin(x * 15 + y * 8) * Math.cos(y * 11 - x * 5)), h = Math.min(1, a * 1.2);
    return [160 + 90 * h * h, 110 + 130 * h * h, 255, Math.min(1, a * 1.15)];
  }],
  wspark: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [214 + 41 * c * c, 190 + 65 * c * c, 255, Math.min(1, c * c * 2.4)]; }],
  // the life taken: pale lime-gold
  lmote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226 + 29 * c * c, 247, 150 + 90 * c * c, Math.min(1, c * c * 2.2)]; }],
  lpuff: [40, 40, (x, y) => {
    const r = Math.hypot(x - 0.5, y - 0.5) * 2, a = Math.pow(Math.max(0, 1 - r), 1.4) * (0.7 + 0.3 * Math.sin(x * 13 + y * 9) * Math.cos(y * 7 - x * 6)), h = Math.min(1, a * 1.2);
    return [190 + 55 * h, 235 + 20 * h, 120 + 90 * h * h, Math.min(1, a * 1.1)];
  }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, L0 = S.lamp, SH = S.shoulder, FT = S.feet, HIT = S.hit;
  const T = k.aim || S.alone, RAD = Math.PI / 180;
  const REL = 1040, IMP = 1560, FLY = 520;
  k.css(`.g-wisp { border-radius: 50%; background: radial-gradient(closest-side, rgba(250,244,255,.95), rgba(196,150,255,.58) 26%, rgba(140,90,255,.2) 58%, rgba(120,60,255,0) 100%); }
    .g-lamp { border-radius: 50%; background: radial-gradient(closest-side, rgba(250,255,220,.95), rgba(216,240,138,.6) 28%, rgba(170,214,90,.2) 60%, rgba(150,200,70,0) 100%); }`);

  // ── her pose: [ms, lean (deg, about her feet: none, she is part of the picture), arm (deg, about her shoulder), easing]
  const PK = [[0, 0, 0, eio], [240, 0, 7, eio], [760, 0, -48, 'ease-in'], [960, 0, -53, 'ease-in'], [1060, 0, 11, 'ease-out'], [1250, 0, 6, eio], [2200, 0, 6, eio], [2900, 0, 0]];
  const rot = (v, d) => { const c = Math.cos(d * RAD), s = Math.sin(d * RAD); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; };
  const leanD = (l) => { const v = [SH[0] - FT[0], SH[1] - FT[1]], r = rot(v, l); return [r[0] - v[0], r[1] - v[1]]; };
  const lampAt = (l, a) => { const d = leanD(l), r = rot([L0[0] - SH[0], L0[1] - SH[1]], l + a); return [SH[0] + d[0] + r[0], SH[1] + d[1] + r[1]]; };
  const armT = (l, a) => { const d = leanD(l); return `${k.T(d[0], d[1])} rotate(${(l + a).toFixed(2)}deg)`; };
  for (const n of ['arm', 'glass']) act(k.part(n), PK.map(([t, l, a, e]) => [t, { transform: armT(l, a) }, e]));
  const lampMoves = PK.map(([t, l, a, e]) => [t, lampAt(l, a), e]);   // the lantern's heart through the move
  const lampNow = (t) => { let i = 0; while (i < lampMoves.length - 2 && lampMoves[i + 1][0] <= t) i++; const a = lampMoves[i], b = lampMoves[i + 1], f = sm(Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0])))); return [a[1][0] + (b[1][0] - a[1][0]) * f, a[1][1] + (b[1][1] - a[1][1]) * f]; };
  const rel = (p, q) => k.T(p[0] - q[0], p[1] - q[1]);

  // ── the lantern's light: swells as the wisps pour in, flares at the throw, answers the drain
  const LK = [[0, 0.0, 0.8], [240, 0.35, 0.9], [760, 0.7, 1.15], [960, 0.9, 1.3], [1060, 1, 1.9], [1250, 0.8, 1.4], [1600, 0.6, 1.2], [2150, 0.95, 1.5], [2500, 0.7, 1.2], [2900, 0.35, 1], [3300, 0, 0.9]];
  fx(k.light('g-lamp', L0, 54, 54), LK.map(([t, o, s], i) => [t, { transform: `${rel(lampNow(t), L0)} scale(${s})`, opacity: o }, eio]));
  fx(k.light('g-wisp', L0, 40, 40), [[560, { transform: `${rel(lampNow(560), L0)} scale(.6)`, opacity: 0 }, 'ease-out'], [960, { transform: `${rel(lampNow(960), L0)} scale(1)`, opacity: 0.6 }, 'ease-in'], [1060, { transform: `${rel(lampNow(1060), L0)} scale(1.35)`, opacity: 0.8 }, 'ease-out'], [1250, { transform: `${rel(lampNow(1250), L0)} scale(1.3)`, opacity: 0.5 }, eio], [1450, { transform: `${rel(lampNow(1450), L0)} scale(.8)`, opacity: 0 }]]);
  // lime motes drifting up off the lantern as it fills
  for (let i = 0; i < 9; i++) {
    const t = 420 + i * 60 + rand() * 40, p0 = lampNow(Math.min(t, 1000)), x = p0[0] + (rand() - 0.5) * 6, up = 10 + rand() * 14, sz = 2.2 + rand() * 1.8;
    fx(k.pic('lmote', [x, p0[1] - 4], sz, sz), [[Math.round(t), { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [Math.round(t + 120), { transform: `${k.T((rand() - 0.5) * 3, -up * 0.3)} scale(1)`, opacity: 0.9 }, 'ease-out'], [Math.round(t + 620), { transform: `${k.T((rand() - 0.5) * 10, -up)} scale(.5)`, opacity: 0 }]]);
  }

  // ── the wisps: stir, then stream into the lantern; later come out of it and drift home
  const W = S.wisps, DEL = [0, 40, 80, 25, 110, 60, 140];
  W.forEach(([x, y, kk], i) => {
    const home = [x, y + 3 * kk], t0 = 470 + i * 48, t1 = t0 + 430, tgt = lampNow(Math.min(t1, 1000));
    const dist = Math.hypot(tgt[0] - home[0], tgt[1] - home[1]), sw = Math.min(26, 8 + dist * 0.12) * (i % 2 ? -1 : 1), mid = [(home[0] + tgt[0]) / 2 - (tgt[1] - home[1]) / dist * sw, (home[1] + tgt[1]) / 2 + (tgt[0] - home[0]) / dist * sw];
    const pts = k.arc(home, mid, tgt, 6, (t) => t * t * (3 - 2 * t));
    const list = [[0, { transform: 'translate(0px, 0px) scale(1)', opacity: 1 }, eio], [250 + i * 28, { transform: `${k.T(0, -1.6)} scale(1.12)`, opacity: 1 }, eio], [t0, { transform: `${k.T(0, 0.4)} scale(1.05)`, opacity: 1 }, 'ease-in']];
    pts.forEach(([px, py], j) => { if (j === 0) return; const f = j / 6; list.push([Math.round(t0 + (t1 - t0) * f), { transform: `${rel([px, py], home)} scale(${(1.05 - 0.6 * f).toFixed(2)})`, opacity: j === 6 ? 0 : 1 }, 'linear']); });
    const e0 = 2620 + i * 60;
    list.push([e0, { transform: `${rel(L0, home)} scale(.35)`, opacity: 0 }, 'ease-out'], [e0 + 520, { transform: 'translate(0px, 0px) scale(1)', opacity: 1 }, 'ease-in-out']);
    act(k.part('glow' + i), list);
    act(k.part('wisp' + i), list);
    // a little flare as each goes in
    fx(k.light('g-wisp', tgt, 16, 16), [[Math.round(t1 - 60), { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [Math.round(t1 + 40), { transform: 'scale(1.1)', opacity: 0.8 }, 'ease-out'], [Math.round(t1 + 260), { transform: 'scale(.7)', opacity: 0 }]]);
  });

  // ── RELEASE: the orbs burst out of the lantern and go to T, a ripple
  const S0 = lampNow(1060), dxT = T[0] - S0[0], dyT = T[1] - S0[1], dist = Math.hypot(dxT, dyT) || 1, dir = [dxT / dist, dyT / dist];
  let nx = -dir[1], ny = dir[0]; if (ny > 0) { nx = -nx; ny = -ny; }          // bend upward
  const ringV = k.svg('<circle cx="30" cy="30" r="27" fill="none" stroke="#f0e6ff" stroke-width="1.8"/><circle cx="30" cy="30" r="22" fill="none" stroke="#a678ff" stroke-width="1" stroke-opacity=".7"/>', 60, 60);
  const landed = [];
  for (let i = 0; i < 7; i++) {
    const kk = W[i][2], off = [((i % 3) - 1) * 6 + (rand() - 0.5) * 3, (i - 3) * 2.6 + (rand() - 0.5) * 3];
    const E = [T[0] + off[0] * (k.aim ? 0.5 : 1), T[1] + off[1] * (k.aim ? 0.5 : 1)], t0 = REL + DEL[i], dur = FLY + (rand() - 0.5) * 50, t1 = Math.round(t0 + dur);
    const bend = (10 + dist * 0.1) * (i % 2 ? 0.7 : 1.1), mid = [(S0[0] + E[0]) / 2 + nx * bend, (S0[1] + E[1]) / 2 + ny * bend];
    const pace = (t) => Math.pow(t, 1.5), N = 10, pts = k.arc(S0, mid, E, N, pace);
    const sz = 11 + kk * 3;
    const run = (cls, w, o) => fx(k.light(cls, S0, w, w), [[t0 - 60, { transform: `${k.T(0, 0)} scale(.3)`, opacity: 0 }, 'ease-out'], ...pts.map(([px, py], j) => [Math.round(t0 + dur * j / N), { transform: `${rel([px, py], S0)} scale(${(1 - 0.25 * j / N).toFixed(2)})`, opacity: j === 0 ? o * 0.9 : o }, 'linear']), [t1 + 70, { transform: `${rel(E, S0)} scale(.3)`, opacity: 0 }]]);
    run('g-wisp', sz * 2.1, 0.75);
    run('g-wisp', sz * 0.9, 1);
    // its trail
    for (let j = 0; j < 5; j++) {
      const f = (j + rand() * 0.5) / 5, tt = Math.round(t0 + dur * f), w = pace(f), q = 1 - w, p = [q * q * S0[0] + 2 * q * w * mid[0] + w * w * E[0], q * q * S0[1] + 2 * q * w * mid[1] + w * w * E[1]];
      const spark = j % 2 === 1, sz2 = spark ? 3 + rand() * 2 : 9 + rand() * 6;
      fx(k.pic(spark ? 'wspark' : 'wpuff', p, sz2, sz2), [[tt, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [tt + 70, { transform: `${k.T(-dir[0] * 2, -dir[1] * 2)} scale(1)`, opacity: spark ? 0.95 : 0.65 }, 'ease-out'], [tt + 480, { transform: `${k.T(-dir[0] * 9 + (rand() - 0.5) * 6, -dir[1] * 9 + 5)} scale(${spark ? 0.4 : 1.5})`, opacity: 0 }]]);
    }
    landed.push([E, t1]);
    // where it lands
    fx(k.light('g-wisp', E, 30, 30), [[t1 - 25, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t1 + 25, { transform: 'scale(1)', opacity: 1 }, 'ease-out'], [t1 + 360, { transform: 'scale(1.5)', opacity: 0 }]]);
    fx(k.pic(ringV, E, 26, 26), [[t1 - 10, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [t1 + 25, { transform: 'scale(.3)', opacity: 1 }, 'ease-out'], [t1 + 460, { transform: 'scale(1.3)', opacity: 0 }]]);
    fx(k.pic('wpuff', E, 22, 22), [[t1 - 10, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t1 + 70, { transform: `${k.T(off[0] * 0.6, off[1] * 0.6 - 3)} scale(1)`, opacity: 0.85 }, 'ease-out'], [t1 + 520, { transform: `${k.T(off[0] * 1.3, off[1] * 1.3 - 9)} scale(1.5)`, opacity: 0 }]]);
    for (let j = 0; j < 3; j++) {
      const a = -Math.PI * (0.1 + 0.8 * rand()), r = 8 + rand() * 18, ex = Math.cos(a) * r, ey = Math.sin(a) * r, s2 = 2 + rand() * 2.2, life = 400 + rand() * 250, ps = k.arc([0, 0], [ex * 0.6, ey - 4 - rand() * 5], [ex + 1, ey + 9 + rand() * 8], 4);
      fx(k.pic('wspark', E, s2, s2), ps.map(([x, y], m) => [Math.round(t1 + life * m / 4), { transform: `${k.T(x, y)} scale(${(1 - 0.5 * m / 4).toFixed(2)})`, opacity: m === 4 ? 0 : 1 - 0.1 * m }, m < 2 ? 'ease-out' : 'linear']));
    }
  }
  // the whole strike: a big flash and a spread of light on whatever is there
  fx(k.light('g-wisp', T, 84, 84), [[IMP - 10, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 40, { transform: 'scale(1)', opacity: 1 }, 'ease-out'], [IMP + 240, { transform: 'scale(1.4)', opacity: 0.8 }, 'ease-out'], [IMP + 900, { transform: 'scale(1.9)', opacity: 0.2 }, 'ease-out'], [IMP + 1400, { transform: 'scale(2.1)', opacity: 0 }]]);
  fx(k.light('g-wisp', T, 40, 40), [[IMP - 10, { transform: 'scale(.4)', opacity: 0 }], [IMP + 30, { transform: 'scale(1.1)', opacity: 1 }], [IMP + 150, { transform: 'scale(1.5)', opacity: 0.9 }], [IMP + 380, { transform: 'scale(.8)', opacity: 0 }]]);
  for (const [t, big] of [[IMP + 20, 1.5], [IMP + 170, 2.2]]) fx(k.pic(ringV, T, 60, 60), [[t, { transform: 'scale(.1)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(.25)', opacity: 1 }, 'ease-out'], [t + 560, { transform: `scale(${big})`, opacity: 0 }]]);

  // ── the drain: the life torn out at T streams home to her chest, mote after mote
  const ringL = k.svg('<ellipse cx="30" cy="12" rx="28" ry="9" fill="none" stroke="#e8ffb0" stroke-width="1.6"/><ellipse cx="30" cy="12" rx="22" ry="6.5" fill="none" stroke="#a8d85a" stroke-width="1" stroke-opacity=".7"/>', 60, 24);
  const hdist = Math.hypot(HIT[0] - T[0], HIT[1] - T[1]) || 1;
  let hx = -(HIT[1] - T[1]) / hdist, hy = (HIT[0] - T[0]) / hdist; if (hy > 0) { hx = -hx; hy = -hy; }
  const arrive = [];
  for (let i = 0; i < 10; i++) {
    const t0 = 1620 + i * 62 + Math.round(rand() * 25), s0 = [T[0] + (rand() - 0.5) * 22, T[1] + (rand() - 0.5) * 14], e0 = [HIT[0] + (rand() - 0.5) * 8, HIT[1] + (rand() - 0.5) * 8], dur = 640 + rand() * 120;
    const bend = (14 + hdist * 0.12) * (0.7 + rand() * 0.6), mid = [(s0[0] + e0[0]) / 2 + hx * bend, (s0[1] + e0[1]) / 2 + hy * bend], N = 9, pts = k.arc(s0, mid, e0, N, (t) => t * t * (3 - 2 * t));
    const big = i % 3 === 0, sz = big ? 5 : 3.2;
    fx(k.pic('lmote', s0, sz * 1.6, sz * 1.6), [[t0, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], ...pts.map(([px, py], j) => [Math.round(t0 + dur * j / N), { transform: `${rel([px, py], s0)} scale(${(1 + 0.4 * Math.sin(Math.PI * j / N)).toFixed(2)})`, opacity: j === 0 ? 0.3 : j === N ? 0 : 0.95 }, 'linear'])]);
    // a soft light-trail behind it
    for (let j = 1; j < 4; j++) {
      const f = (j * 0.22 + rand() * 0.1), tt = Math.round(t0 + dur * f), w = sm(f), q = 1 - w, p = [q * q * s0[0] + 2 * q * w * mid[0] + w * w * e0[0], q * q * s0[1] + 2 * q * w * mid[1] + w * w * e0[1]];
      fx(k.pic('lpuff', p, 7 + rand() * 5, 7 + rand() * 5), [[tt, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [tt + 70, { transform: 'scale(1)', opacity: 0.55 }, 'ease-out'], [tt + 380, { transform: `${k.T(0, -3)} scale(1.4)`, opacity: 0 }]]);
    }
    arrive.push(Math.round(t0 + dur));
  }
  // where it comes home: a green glow in her, her lantern answering, rings on the water round her
  const last = Math.max(...arrive), first = Math.min(...arrive);
  fx(k.light('g-lamp', [HIT[0], HIT[1] - 2], 60, 70), [[first - 150, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [first + 80, { transform: 'scale(1)', opacity: 0.7 }, 'ease-out'], [last, { transform: 'scale(1.2)', opacity: 1 }, 'ease-out'], [last + 350, { transform: 'scale(1.3)', opacity: 0.6 }, eio], [last + 1000, { transform: 'scale(1)', opacity: 0 }]]);
  fx(k.light('g-lamp', [HIT[0], HIT[1] - 2], 26, 30), [[first, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [last + 60, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [last + 500, { transform: 'scale(.9)', opacity: 0 }]]);
  for (const [dt, big] of [[0, 1.5], [220, 2.2], [440, 2.9]]) fx(k.pic(ringL, [FT[0], FT[1] + 5], 46, 18), [[first + 100 + dt, { transform: 'scale(.2, .2)', opacity: 0 }, 'ease-out'], [first + 160 + dt, { transform: 'scale(.35, .35)', opacity: 0.9 }, 'ease-out'], [first + 800 + dt, { transform: `scale(${big}, ${big})`, opacity: 0 }]]);
  for (let i = 0; i < 8; i++) {
    const t = first + 60 + i * 70 + rand() * 40, x = HIT[0] + (rand() - 0.5) * 22, up = 14 + rand() * 20, sway = (rand() - 0.5) * 8, sz = 2.4 + rand() * 2;
    fx(k.pic('lmote', [x, HIT[1] + 10 + rand() * 16], sz, sz), [[Math.round(t), { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [Math.round(t + 140), { transform: `${k.T(sway * 0.3, -up * 0.3)} scale(1)`, opacity: 0.9 }, 'ease-out'], [Math.round(t + 800), { transform: `${k.T(sway, -up)} scale(.5)`, opacity: 0 }]]);
  }
}
