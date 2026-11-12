// Bark Graft: the living bark armour braces and takes three blows, splintering and knitting whole.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: defender (Reach, Symbiote: a 1/3 that is
// armour more than weapon), element: nature. Parts: the warrior with his pauldron (from his feet),
// his raised arm (about the seam at the upper arm), the moss on him, the leaves unfurling from the bark.
//   0-250     still.
//   250-650   he braces: sinks and leans into it, the raised arm comes round in front, the bark
//             swells and a green light gathers in it; the new leaves open wider; motes crawl up the
//             forearm's scales.
//   600       BRACE (BEATS.release): the guard is up and holds.
//   1250      FIRST BLOW (BEATS.impact), at k.blows[0] (alone: the forearm), then the others (alone:
//             the pauldron at 1700, the forearm again at 2150). On each, snapped to the nearest
//             `guard` point: a slash of pale light drives in, he is jolted back and rings like a
//             struck bell, the arm is shoved, a flash and splinters of bark and torn leaves fly, then
//             the bark knits back in a pulse of green light.
//   2500-3500 he holds, eases, the light fades, he settles.
//   3600      at rest as drawn.
//
// The contract: blows come as k.blows (a list of { at, to }); alone, its own three.
export const END = 4100;
export const BEATS = { release: 600, impact: 1250, settle: 3600 };
export const STILLS = [300, 650, 1190, 1290, 1700, 2180, 2900, 3800];

export const textures = {
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226, 255, 160, Math.min(1, c * c * 1.5)]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, sm = k.smooth, eio = 'ease-in-out';
  const S = k.spec, F = S.feet, AP = S.seam, LP = [175, 100];
  const him = k.part('him'), arm = k.part('arm'), moss = k.part('moss'), leaves = k.part('leaves');
  const rad = (d) => (d * Math.PI) / 180;
  const rot = (a, [x, y]) => [x * Math.cos(rad(a)) - y * Math.sin(rad(a)), x * Math.sin(rad(a)) + y * Math.cos(rad(a))];

  k.css(`.g-nature { border-radius: 50%; background: radial-gradient(circle, rgba(250,255,226,.95), rgba(196,242,112,.6) 30%, rgba(120,200,70,.2) 55%, rgba(90,180,60,0) 70%); }
.fx-copy.f-sap { mix-blend-mode: plus-lighter; filter: brightness(1.5) saturate(1.3) hue-rotate(45deg); }`);

  // ── the blows: (k.blows when another card attacks, else its own three), each snapped to the nearest guard point
  const own = [{ at: 1250, to: S.guard[0] }, { at: 1700, to: S.guard[2] }, { at: 2150, to: [197, 100] }];
  const blows = (k.blows || own).map((b, i) => {
    let g = 0, best = 1e9;
    S.guard.forEach((p, j) => { const d = Math.hypot(p[0] - b.to[0], p[1] - b.to[1]); if (d < best) { best = d; g = j; } });
    return { t: b.at, g, p: S.guard[g], s: [1, 1.15, 1.3, 1.4][Math.min(i, 3)] };
  });

  const track = (keys) => (t) => {
    let i = keys.length - 1;
    while (i > 0 && keys[i][0] > t) i--;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const f = b[0] === a[0] ? 0 : sm(Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))));
    return a[1] + (b[1] - a[1]) * f;
  };
  // a blow's ring: snaps back at once, then rings out
  const ring = (dt) => (dt < 0 ? 0 : (1 - Math.exp(-dt / 10)) * Math.exp(-dt / 150) * Math.cos(dt / 52));
  const rung = (fn) => (t) => blows.reduce((s, b) => s + b.s * fn(b, ring(t - b.t)), 0);

  const lean = track([[0, 0], [250, 0], [650, 1.8], [2500, 1.8], [3300, 0.5], [3600, 0]]);
  const sink = track([[0, 0], [250, 0], [650, 1.2], [2500, 1.2], [3300, 0.3], [3600, 0]]);
  const guardUp = track([[0, 0], [250, 0], [650, 1], [2500, 1], [3300, 0.3], [3600, 0]]);
  const leafOpen = track([[0, 0], [300, 0], [700, 1], [1250, 0.55], [2500, 0.75], [3300, 0.2], [3600, 0]]);
  const J = rung((b, r) => r); // (how far every blow so far has shaken him, at this moment)
  const body = (t) => ({ tx: -1.7 * J(t), ty: sink(t) + 0.45 * Math.abs(J(t)), a: lean(t) - 1.3 * J(t) });
  // the arm: raised round in front (clockwise), swelling; shoved by blows on it
  const armLoc = (t) => {
    const j = rung((b, r) => (b.g < 2 ? 1 : 0.28) * r)(t);
    return { dx: -2.6 * j + 0.0, dy: 0.7 * j, b: 6 * guardUp(t) - 5.5 * j, sc: 1 + 0.05 * guardUp(t) };
  };
  const bodyPivot = (p, t) => { const b = body(t), r = rot(b.a, [p[0] - F[0], p[1] - F[1]]); return [F[0] + b.tx + r[0] - p[0], F[1] + b.ty + r[1] - p[1]]; };
  const grid = [];
  for (let t = 0; t <= 3600; t += 25) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3700, { transform: 'none' }]];
  const f2 = (v) => v.toFixed(2);
  act(him, sample((t) => { const b = body(t); return { transform: `translate(${f2(b.tx * u)}px, ${f2(b.ty * u)}px) rotate(${f2(b.a)}deg)` }; }));
  act(moss, sample((t) => { const b = body(t); return { transform: `translate(${f2(b.tx * u)}px, ${f2(b.ty * u)}px) rotate(${f2(b.a)}deg)` }; }));
  act(arm, sample((t) => {
    const b = body(t), d = bodyPivot(AP, t), l = armLoc(t);
    return { transform: `translate(${f2(d[0] * u)}px, ${f2(d[1] * u)}px) rotate(${f2(b.a)}deg) translate(${f2(l.dx * u)}px, ${f2(l.dy * u)}px) rotate(${f2(l.b)}deg) scale(${l.sc.toFixed(3)})` };
  }));
  act(leaves, sample((t) => {
    const b = body(t), d = bodyPivot(LP, t), o = leafOpen(t), fl = rung((bl, r) => r)(t);
    return { transform: `translate(${f2(d[0] * u)}px, ${f2(d[1] * u)}px) rotate(${f2(b.a + 6 * fl + 2 * o * Math.sin(t / 240))}deg) scale(${(1 + 0.28 * o).toFixed(3)})` };
  }));
  // a lit copy of the arm: a sheen as it braces, a flash on each blow that lands on it
  act(k.copy('arm', 'f-sap'), sample((t) => {
    const b = body(t), d = bodyPivot(AP, t), l = armLoc(t);
    const fl = blows.reduce((m, bl) => (bl.g < 2 && t >= bl.t ? Math.max(m, Math.exp(-(t - bl.t) / 110)) : m), 0);
    return { transform: `translate(${f2(d[0] * u)}px, ${f2(d[1] * u)}px) rotate(${f2(b.a)}deg) translate(${f2(l.dx * u)}px, ${f2(l.dy * u)}px) rotate(${f2(l.b)}deg) scale(${l.sc.toFixed(3)})`, opacity: +Math.min(1, 0.22 * guardUp(t) + 0.7 * fl).toFixed(2) };
  }));

  // ── the brace: green light gathering in the bark, motes crawling up the forearm, leaves opening
  const FA = S.guard[0], PA = S.guard[2];
  fx(k.light('g-nature', [FA[0] - 2, FA[1] + 6], 74), [[300, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [700, { transform: 'scale(1)', opacity: 0.5 }, eio], [2600, { transform: 'scale(1)', opacity: 0.38 }, eio], [3400, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.light('g-nature', PA, 80), [[350, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [750, { transform: 'scale(1)', opacity: 0.42 }, eio], [2600, { transform: 'scale(1)', opacity: 0.3 }, eio], [3400, { transform: 'scale(.8)', opacity: 0 }]]);
  for (let n = 0; n < 10; n++) {
    const t = 280 + n * 40 + rand() * 30, x = 192 + rand() * 8, sz = 3 + rand() * 2.6;
    fx(k.pic('mote', [x, 112], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 110, { transform: `${k.T(0, -6)} scale(1)`, opacity: 0.95 }, 'linear'], [t + 520, { transform: `${k.T(4 + rand() * 6, -52 - rand() * 14)} scale(.5)`, opacity: 0 }]]);
  }
  for (const [i, [x, y]] of [[183, 72], [220, 78], [218, 97], [182, 92], [203, 132], [113, 117], [123, 97], [162, 87]].entries()) {
    const t = 420 + i * 60, sz = 5 + rand() * 3;
    fx(k.pic('mote', [x, y], sz, sz), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 160, { transform: 'scale(1.3)', opacity: 1 }, eio], [t + 700, { transform: `${k.T((rand() - 0.5) * 6, -8)} scale(.5)`, opacity: 0 }]]);
  }

  // ── each blow
  const slash = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".8"/></filter></defs><path d="M4,34C10,14 24,4 46,2C26,8 14,20 8,38Z" fill="#f2ffd0" filter="url(#b)"/><path d="M6,30C12,14 25,6 42,3C27,10 17,21 10,34Z" fill="#fffffa"/>', 50, 40);
  const shard = k.svg('<path d="M1,6L8,1L14,4L11,9L4,10Z" fill="#6a5030"/><path d="M2,6L8,2L12,4L5,8Z" fill="#a8844e"/><path d="M1,6L8,1" stroke="#f0e2b0" stroke-width=".7"/>', 15, 11);
  const leafBit = k.svg('<path d="M3,10C5,3 13,1 17,2C16,9 11,16 3,10Z" fill="#8cc460"/><path d="M3.6,9.6C6,4.5 12,3 15.5,3.2C14.5,8.5 10.5,13.5 3.6,9.6Z" fill="#e8fabc"/>', 20, 14);
  const ringC = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#f0ffd2" stroke-width="3" filter="url(#b)"/>', 60, 60);
  blows.forEach((b, bi) => {
    const t = b.t, [x, y] = b.p, s = b.s;
    // the slash coming in from the right, a hair before it lands (alone only: another card's attack brings its own)
    if (!k.blows) fx(k.pic(slash, [x + 7, y - 4], 24, 19), [[t - 150, { transform: `${k.T(16, -8)} rotate(0deg) scale(.5)`, opacity: 0 }, 'ease-in'], [t - 70, { transform: `${k.T(7, -3)} rotate(-10deg) scale(1)`, opacity: 1 }, 'ease-in'], [t + 20, { transform: `${k.T(-4, 3)} rotate(-24deg) scale(1.1)`, opacity: 0.9 }], [t + 130, { transform: `${k.T(-6, 4)} rotate(-30deg) scale(1)`, opacity: 0 }]]);
    // the flash and a ring
    fx(k.light('g-nature', [x, y], 52 + 6 * s), [[t - 10, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 30, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [t + 420, { transform: 'scale(1.7)', opacity: 0 }]]);
    fx(k.pic(ringC, [x, y], 20, 20), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(.6)', opacity: 0.85 }], [t + 520, { transform: `scale(${(2.4 + 0.3 * s).toFixed(1)})`, opacity: 0 }]]);
    // splinters of bark
    for (let n = 0; n < 8; n++) {
      const a = Math.PI + (rand() - 0.5) * 3.2, d = 12 + rand() * 18 * s, sz = 5 + rand() * 4, r = Math.round((rand() - 0.5) * 540), fall = 8 + rand() * 14;
      const P = (f, g, o) => ({ transform: `${k.T(Math.cos(a) * d * f, Math.sin(a) * d * f + g)} rotate(${Math.round(r * f)}deg) scale(${f > 0.9 ? 0.8 : 1})`, opacity: o });
      fx(k.pic(shard, [x, y], sz, sz * 0.73, { lit: false }), [[t, P(0, 0, 0), 'ease-out'], [t + 20, P(0.1, 0, 1), 'ease-out'], [t + 240, P(0.8, -3, 1), 'ease-in'], [t + 620 + rand() * 200, P(1.1, fall, 0)]]);
    }
    // torn leaves
    for (let n = 0; n < 3; n++) {
      const a = Math.PI + (rand() - 0.5) * 3, d = 10 + rand() * 18, r = Math.round((rand() - 0.5) * 420);
      const P = (f, g, o) => ({ transform: `${k.T(Math.cos(a) * d * f, Math.sin(a) * d * f * 0.8 + g)} rotate(${Math.round(r * f)}deg) scale(${f > 0.9 ? 0.8 : 1})`, opacity: o });
      fx(k.pic(leafBit, [x, y - 2], 9, 6.3, { lit: false }), [[t + 20, P(0, 0, 0), 'ease-out'], [t + 60, P(0.12, 0, 1), 'ease-out'], [t + 500, P(0.7, 8 + rand() * 6, 1), 'ease-in'], [t + 1000 + rand() * 300, P(1, 22, 0)]]);
    }
    // sparks of sap-light
    for (let n = 0; n < 7; n++) {
      const a = rand() * Math.PI * 2, d = 8 + rand() * 18, sz = 3 + rand() * 3, t0 = t + rand() * 50;
      const P = (f, o, sc) => ({ transform: `${k.T(Math.cos(a) * d * f, Math.sin(a) * d * f - 6 * f)} scale(${sc})`, opacity: o });
      fx(k.pic('mote', [x, y], sz, sz), [[t0, P(0, 0, 0.5), 'ease-out'], [t0 + 50, P(0.3, 1, 1.1), 'ease-out'], [t0 + 500 + rand() * 300, P(1, 0, 0.4)]]);
    }
    // the bark knits back: a pulse of green light as the scales close, motes drawn in
    const kn = t + 480 + (bi % 2) * 40;
    fx(k.light('g-nature', [x, y], 40), [[kn, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [kn + 200, { transform: 'scale(1.1)', opacity: 0.8 }, eio], [kn + 700, { transform: 'scale(1.3)', opacity: 0 }]]);
    for (let n = 0; n < 5; n++) {
      const a = rand() * Math.PI * 2, d = 10 + rand() * 12, sz = 2.6 + rand() * 2.2, t0 = kn - 60 + n * 40;
      fx(k.pic('mote', [x + Math.cos(a) * d, y + Math.sin(a) * d], sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 100, { transform: 'scale(1)', opacity: 0.95 }, 'linear'], [t0 + 420, { transform: `${k.T(-Math.cos(a) * d, -Math.sin(a) * d)} scale(.4)`, opacity: 0 }]]);
    }
  });

  // ── at the end: the leaves shake out and a few new motes rise from the settled bark
  for (let n = 0; n < 8; n++) {
    const t = 2600 + n * 80 + rand() * 50, x = 125 + rand() * 90, y = 96 + rand() * 40, sz = 2.6 + rand() * 2.6;
    fx(k.pic('mote', [x, y], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 150, { transform: `${k.T(0, -4)} scale(1)`, opacity: 0.9 }, 'linear'], [t + 800, { transform: `${k.T((rand() - 0.5) * 10, -22 - rand() * 12)} scale(.4)`, opacity: 0 }]]);
  }
}
