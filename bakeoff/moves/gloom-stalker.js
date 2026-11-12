// Gloom Stalker: it flings its poison.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker, element: venom
// (the card says Venom; the picture's green is the poison on its fingers).
//   0-860    it gathers. It draws back into the dark of the doorway (a hair smaller)
//            and the throwing hand (the one on the target's side) is pulled back and
//            curled, trembling; the pale eyes flare violet; every fingertip swells a
//            bead of poison, drips run; the pools on the step glow; shadow seeps out
//            of the doorway and along the wall.
//   860-940  RELEASE: the arm whips out, long, toward T; the body unfolds out of
//            the door after it (leaning, a step forward); a green flash at the hand.
//   920      the poison leaves the four fingertips, a lead glob from each and a
//            spray, in a short lob (dark shadow-smoke curling in its wake).
//   1240     IMPACT at T: a flash, a staining splash, a ring, droplets flung with
//            gravity, a puff of shadow, hissing vapour rising.
//   1000-3600 follow-through and recoil: the hand overshoots and shivers, comes back;
//            the free hand twitches, the foot feels for the step; drips from the
//            fingers; the eyes dim; the stain sizzles, fades.
//   3600     at rest as drawn (BEATS.settle); the move ends at END.
//
// The contract (bakeoff/recipe.md): T = k.aim, or its own spot (the step at the
// right). The hand on T's side whips round its shoulder to point at T, and every
// point of the flight is worked out from that hand's fingertips (spec.tipsL/tipsR,
// carried through the whip) and T.
export const END = 4200;
export const BEATS = { release: 920, impact: 1240, settle: 3600 };
export const STILLS = [300, 700, 900, 980, 1100, 1250, 1700, 3000];

const noise = (x, y) => 0.7 + 0.2 * Math.sin(x * 11 + y * 5) * Math.cos(y * 9 - x * 4) + 0.1 * Math.sin(x * 23 - y * 17);
export const textures = {
  // a bead of poison: lime, white-hot at its heart
  vglob: [40, 40, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, a = Math.pow(Math.max(0, 1 - r), 0.85) * 1.2, h = Math.min(1, a * a); return [140 + 110 * h, 232 + 23 * h, 70 + 130 * h, Math.min(1, a)]; }],
  // a splash seen flat: ragged, rays thrown out
  vsplat: [64, 64, (x, y) => {
    const dx = x - 0.5, dy = y - 0.5, r = Math.hypot(dx, dy) * 2, an = Math.atan2(dy, dx);
    const edge = 0.5 + 0.17 * Math.sin(an * 5 + 1) + 0.12 * Math.sin(an * 9 + 2) + 0.2 * Math.max(0, Math.sin(an * 7 + 0.5)) ** 3;
    const a = Math.max(0, Math.min(1, (edge - r) * 5)) * (1 - 0.3 * r) * noise(x, y);
    return [96 + 90 * (1 - r), 176 + 60 * (1 - r), 62 + 60 * (1 - r), a];
  }],
  // vapour off the burning stain
  vvap: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2; return [176, 234, 140, Math.pow(Math.max(0, 1 - r), 1.4) * noise(x * 1.3, y) * 0.65]; }],
  // a wisp of the dark (shadow, violet-black)
  wisp: [48, 48, (x, y) => { const r = Math.hypot((x - 0.5) * 1.2, (y - 0.5) * 0.9) * 2; return [14, 8, 26, Math.pow(Math.max(0, 1 - r), 1.2) * noise(y * 1.1, x) * 0.8]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth, sp = k.spec;
  const T = k.aim || sp.alone;
  const rad = (d) => (d * Math.PI) / 180;
  const useR = T[0] >= 150;
  const S = useR ? sp.shoulderR : sp.shoulderL, tips = useR ? sp.tipsR : sp.tipsL;
  const handName = useR ? 'handR' : 'handL', freeName = useR ? 'handL' : 'handR';
  const mid = sp.mid, kn = sp.knee;

  k.css(`.g-venom { border-radius: 50%; background: radial-gradient(closest-side, rgba(236,255,190,.95), rgba(172,242,100,.55) 28%, rgba(120,212,72,.17) 58%, rgba(100,200,60,0) 100%); }`);

  // ── a curve through [ms, value] points, eased between them
  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  const grid = [];
  for (let t = 0; t <= 3600; t += 40) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3800, { transform: 'none' }]];

  // ── the throwing hand: how far it turns about its shoulder (deg, clockwise) to point at T
  const mean = (a, i) => a.reduce((s, p) => s + p[i], 0) / a.length;
  const C0 = [mean(tips, 0), mean(tips, 1)];
  const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
  let d = ((ang(S, T) - ang(S, C0)) * 180) / Math.PI;
  d = ((d + 540) % 360) - 180;
  d = Math.max(-75, Math.min(75, d));
  if (Math.abs(d) < 14) d = d < 0 ? -14 : 14; // (always a visible whip)
  const wsg = Math.abs(d) > 12 ? -Math.sign(d) : useR ? -1 : 1;
  const wd = wsg * (34 + 0.2 * Math.abs(d)); // wound back the other way
  const trem = (t) => (t > 480 && t < 880 ? 1.3 * Math.sin(t / 36) * sm(Math.min(1, (t - 480) / 160)) : 0);
  const shiver = (t) => { const tau = t - 960; return tau > 0 ? 3.4 * Math.exp(-tau / 520) * Math.sin(tau / 70) * Math.sign(d) : 0; };
  const HA = curve([[0, 0], [200, 0], [620, wd], [860, wd * 1.12], [950, d * 1.2], [1060, d * 0.94], [1260, d * 1.03], [2100, d * 0.78], [3100, d * 0.16], [3600, 0]]);
  const HS = curve([[0, 1], [620, 0.92], [860, 0.9], [950, 1.17], [1100, 1.03], [2100, 1.02], [3600, 1]]);
  const handA = (t) => HA(t) + trem(t) + shiver(t);
  const tipAt = (p, t) => { const a = rad(handA(t)), c = Math.cos(a), s = Math.sin(a), sc = HS(t), vx = p[0] - S[0], vy = p[1] - S[1]; return [S[0] + sc * (vx * c - vy * s), S[1] + sc * (vx * s + vy * c)]; };
  act(k.part(handName), sample((t) => ({ transform: `rotate(${handA(t).toFixed(2)}deg) scale(${HS(t).toFixed(3)})` })));

  // ── the free hand twitches (curling in, then loosening); the foot feels for the step
  const fsg = useR ? 1 : -1, FA = curve([[0, 0], [620, 5.5 * fsg], [940, -4 * fsg], [1400, 3 * fsg], [2300, -1 * fsg], [3100, 0]]);
  const FS = curve([[0, 1], [620, 0.95], [950, 1.04], [1500, 1], [3100, 1]]);
  act(k.part(freeName), sample((t) => ({ transform: `rotate(${(FA(t) + (t > 400 && t < 900 ? 0.8 * Math.sin(t / 45 + 1) : 0)).toFixed(2)}deg) scale(${FS(t).toFixed(3)})` })));
  const tsg = Math.sign(T[0] - 150) || 1;
  const KA = curve([[0, 0], [600, -3 * tsg], [960, 6 * tsg], [1500, 2 * tsg], [2500, 0]]);
  act(k.part('foot'), sample((t) => ({ transform: `rotate(${KA(t).toFixed(2)}deg)` })));

  // ── the body: draws back into the dark, then unfolds out of the door after the arm
  const dx = Math.max(-5, Math.min(5, (T[0] - 150) * 0.06)) || 2 * tsg;
  const BX = curve([[0, 0], [620, -dx * 0.5], [860, -dx * 0.7], [980, dx * 1.5], [1500, dx], [2600, dx * 0.4], [3500, 0]]);
  const BY = curve([[0, 0], [620, 1.5], [980, -2.2], [1500, -1], [3500, 0]]);
  const BR = curve([[0, 0], [860, -tsg * 1.2], [1000, tsg * 2.6], [1600, tsg * 1.6], [3500, 0]]);
  const BS = curve([[0, 1], [620, 0.965], [860, 0.955], [990, 1.075], [1500, 1.045], [3500, 1]]);
  act(k.part('body'), sample((t) => ({ transform: `${k.T(BX(t), BY(t))} rotate(${BR(t).toFixed(2)}deg) scale(${BS(t).toFixed(3)})` })));
  const bpos = (p, t) => { const a = rad(BR(t)), c = Math.cos(a), s = Math.sin(a), sc = BS(t), vx = p[0] - mid[0], vy = p[1] - mid[1]; return [mid[0] + BX(t) + sc * (vx * c - vy * s), mid[1] + BY(t) + sc * (vx * s + vy * c)]; };

  // ── effects that ride with something: [ms, {dx, dy, s, o}] -> keyframes
  const ride = (pos, p, t0, t1, f, step = 40) => {
    const out = [];
    for (let t = t0; t <= t1; t += step) { const q = pos(p, t), e = f(t); out.push([t, { transform: `${k.T(q[0] - p[0] + (e.dx || 0), q[1] - p[1] + (e.dy || 0))} scale(${(e.s ?? 1).toFixed(3)})`, opacity: +Math.max(0, Math.min(1, e.o)).toFixed(2) }, 'linear']); }
    return out;
  };

  // eyes flare violet in the dark, riding with the body
  fx(k.lightIn('g-violet', sp.eyes, 52, 52), ride(bpos, sp.eyes, 120, 3000, (t) => ({ s: 0.8 + 0.6 * sm(Math.min(1, t / 800)) + (t > 900 && t < 1100 ? 0.25 : 0), o: 0.95 * Math.min(sm((t - 120) / 450), 1 - sm((t - 1700) / 1300)) })));
  // the pools on the step swell and glow as the poison gathers, and burn off after
  sp.pools.forEach(([x, y], i) => fx(k.lightIn('g-venom', [x, y], 46, 24), [[200 + i * 120, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [820, { transform: 'scale(1.1)', opacity: 0.7 }, eio], [1000, { transform: 'scale(1.3)', opacity: 0.9 }, eio], [2300, { transform: 'scale(1)', opacity: 0.35 }, eio], [3300, { transform: 'scale(.8)', opacity: 0 }]]));

  // shadow seeping out of the doorway, and along the wall, while it gathers and unfolds
  for (let i = 0; i < 5; i++) {
    const t = 100 + i * 190, side = i % 2 ? 1 : -1, x = 150 + side * (6 + rand() * 18), r = Math.round(rand() * 360), len = 20 + rand() * 24;
    fx(k.picIn('wisp', [x, 150 + rand() * 18], 34, 26, { lit: false }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 400, { transform: `${k.T(side * len * 0.5, 2)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }, eio], [t + 1200, { transform: `${k.T(side * len, -6)} rotate(${r + 50}deg) scale(1.6)`, opacity: 0 }]]);
  }

  // ── the throwing hand's fingertips: beads swell, drip, and are flung
  const REL = 920;
  tips.forEach((p, i) => {
    const t0 = 260 + i * 70;
    fx(k.picIn('vglob', p, 14, 14), ride(tipAt, p, t0, REL, (t) => { const f = Math.min(1, (t - t0) / 560); return { dy: 0.8 * f, s: 0.3 + 0.95 * sm(f), o: t >= REL - 40 ? 0 : 0.95 * sm(Math.min(1, (t - t0) / 160)) }; }));
    // (the bead goes in the last 40 ms: the flung globs take over)
    const q = [p[0] + (rand() - 0.5), p[1]], td = 480 + i * 130;
    fx(k.picIn('vglob', q, 6, 6), ride(tipAt, q, td, td + 330, (t) => { const f = (t - td) / 330; return { dy: 1 + 16 * f * f, s: (0.5 + 0.7 * sm(Math.min(1, f * 2))) * (1 - 0.3 * f), o: f < 0.8 ? 0.9 : 0.9 * (1 - (f - 0.8) / 0.2) }; }));
  });
  // a green flash at the hand as it whips, and licks of light along the fingers
  const Cm = [C0[0], C0[1]];
  fx(k.lightIn('g-venom', Cm, 58, 58), ride(tipAt, Cm, 760, 1500, (t) => ({ s: 0.5 + 0.9 * sm((t - 760) / 200), o: t < 880 ? 0.7 * sm((t - 760) / 120) : 0.95 * (1 - sm((t - 920) / 560)) })));

  // ── the flight: a lead glob from each fingertip and a spray, each from where its tip is at the release
  const Tt = (j) => [T[0] + (j - 1.5) * 3.2, T[1] + ((j * 5) % 3 - 1) * 1.6];
  const FLY = 320, ptsFrom = tips.map((p) => tipAt(p, REL));
  const fly = (E, G, t0, dur, lat, sz, sc0, sc1, o, stretch, gdrop, tex = 'vglob', lit = true, low = false) => {
    const L = Math.hypot(G[0] - E[0], G[1] - E[1]) || 1, an = (Math.atan2(G[1] - E[1], G[0] - E[0]) * 180) / Math.PI;
    const C = [(E[0] + G[0]) / 2, (E[1] + G[1]) / 2 - Math.min(18, L * 0.16)];
    const bz = (w) => { const q = 1 - w; return [q * q * E[0] + 2 * q * w * C[0] + w * w * G[0], q * q * E[1] + 2 * q * w * C[1] + w * w * G[1]]; };
    const nrm = [-(G[1] - E[1]) / L, (G[0] - E[0]) / L], [X0, Y0] = k.P(...E), kf = [];
    for (let j = 0; j <= 7; j++) {
      const f = j / 7, w = Math.pow(f, 0.85), q = bz(w), [x, y] = k.P(...q), off = lat * Math.sin(Math.PI * w) * u + gdrop * f * f * u, s = sc0 + (sc1 - sc0) * f;
      kf.push([Math.round(t0 + dur * f), { transform: `translate(${(x - X0 + nrm[0] * off).toFixed(1)}px, ${(y - Y0 + nrm[1] * off).toFixed(1)}px) rotate(${an.toFixed(1)}deg) scale(${(s * stretch).toFixed(2)}, ${s.toFixed(2)})`, opacity: j === 0 ? 0 : j === 7 ? 0.9 * o : o }, j < 7 ? 'linear' : 'ease-out']);
    }
    kf.push([Math.round(t0 + dur + 50), { ...kf.at(-1)[1], opacity: 0 }]);
    fx(k.pic(tex, E, sz, sz, { lit, low }), kf);
  };
  ptsFrom.forEach((E, i) => {
    fly(E, Tt(i), REL, FLY - i * 12, (i - 1.5) * 1.6, 25 - i, 1, 0.85, 1, 1.9, 0);
    fly(E, Tt(i), REL + 14, FLY - 30, (i % 2 ? 1 : -1) * 1.2, 14, 0.9, 0.7, 0.95, 1.7, 0);
  });
  for (let i = 0; i < 12; i++) {
    const E = ptsFrom[Math.floor(rand() * 4)], g = Tt(rand() * 4), dd = rand() * 150, lat = (rand() - 0.5) * 12, sz = 7 + rand() * 7;
    fly(E, [g[0] + (rand() - 0.5) * 10, g[1] + (rand() - 0.5) * 6], REL + 10 + dd, FLY - 30 + rand() * 80, lat, sz, 0.9, 0.7, 0.9, 1.3 + rand() * 0.6, 4 + rand() * 5);
  }
  // dark smoke curling in the wake (drawn dark: not lit)
  for (let i = 0; i < 3; i++) fly(ptsFrom[i + 1], Tt(i), REL + i * 40, FLY + 100, (rand() - 0.5) * 8, 16, 0.6, 1.3, 0.4, 1.2, 3, 'wisp', false, true);

  // ── where it lands (BEATS.impact): light, a staining splash, a ring, droplets, a puff of shadow, vapour
  const IMP = REL + FLY, rot0 = Math.round(rand() * 360);
  const il = [[IMP - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 40, { transform: 'scale(1.25)', opacity: 0.95 }]];
  for (let t = IMP + 160, i = 0; t < 2000; t += 130, i++) il.push([t, { transform: `scale(${i % 2 ? 1.1 : 0.92})`, opacity: i % 2 ? 0.8 : 0.55 }, eio]);
  il.push([2500, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.light('g-venom', T, 66), il);
  const st = (s, a, o) => ({ transform: `rotate(${rot0 + a}deg) scale(${s}, ${(s * 0.8).toFixed(3)})`, opacity: o });
  fx(k.pic('vsplat', T, 48, 48, { lit: false }), [[IMP - 10, st(0.2, 0, 0), 'cubic-bezier(.2,.7,.4,1)'], [IMP + 120, st(1, 4, 0.92)], [2700, st(1.04, 6, 0.9), eio], [3500, st(1.04, 6, 0)]]);
  const gl = [[IMP - 10, st(0.2, 0, 0), 'cubic-bezier(.2,.7,.4,1)'], [IMP + 120, st(1, 4, 0.95)]];
  for (let t = IMP + 260, i = 0; t < 2600; t += 130 + rand() * 80, i++) gl.push([Math.round(t), st(1.02, 5, i % 2 ? 0.75 : 0.35), eio]);
  gl.push([3000, st(1.04, 6, 0)]);
  fx(k.pic('vsplat', T, 48, 48), gl);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#dcffa8" stroke-width="3" filter="url(#b)"/>', 60, 60);
  fx(k.pic(ring, T, 40, 40), [[IMP, { transform: 'scale(.25, .2)', opacity: 0 }, 'ease-out'], [IMP + 50, { transform: 'scale(.6, .48)', opacity: 0.95 }], [IMP + 520, { transform: 'scale(2, 1.6)', opacity: 0 }]]);
  for (let i = 0; i < 16; i++) {
    const a = -Math.PI * (0.08 + 0.84 * rand()), dist = 16 + rand() * 38, g = 12 + rand() * 14, sz = 5 + rand() * 7, t0 = Math.round(IMP + rand() * 50);
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * dist * f * 1.2, Math.sin(a) * dist * f + g * f * f)} scale(${sc})`, opacity: o });
    fx(k.pic('vglob', T, sz, sz), [[t0, P(0, 0.6, 0), 'ease-out'], [t0 + 40, P(0.2, 1.1, 1), 'ease-out'], [t0 + 280, P(0.75, 0.9, 0.9), 'ease-in'], [Math.round(t0 + 520 + rand() * 160), P(1, 0.3, 0)]]);
  }
  for (let i = 0; i < 4; i++) {
    const r = Math.round(rand() * 360), a = (i / 4) * 6.28 + rand();
    fx(k.pic('wisp', T, 30, 24, { lit: false }), [[IMP, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [IMP + 160, { transform: `${k.T(Math.cos(a) * 8, Math.sin(a) * 4)} rotate(${r + 15}deg) scale(1)`, opacity: 0.55 }], [IMP + 900, { transform: `${k.T(Math.cos(a) * 18, Math.sin(a) * 8 - 6)} rotate(${r + 40}deg) scale(1.7)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 5; i++) {
    const t = IMP + 120 + i * 240, r = Math.round(rand() * 360), x = (rand() - 0.5) * 12;
    fx(k.pic('vvap', [T[0] + x, T[1] - 4], 36, 36, { lit: false, low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 350, { transform: `${k.T(-1, -9)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 1500, { transform: `${k.T(-5 + x * 0.3, -40)} rotate(${r + 50}deg) scale(1.9)`, opacity: 0 }]]);
  }

  // ── after the throw: poison runs and drips from the fingertips of the hand as it comes back
  tips.forEach((p, i) => {
    const t0 = 1150 + i * 220, q = [p[0] + (i - 1.5) * 0.4, p[1] + 1];
    fx(k.picIn('vglob', q, 7, 7), ride(tipAt, q, t0, t0 + 700, (t) => { const f = (t - t0) / 700; return { dy: 1 + 22 * f * f, s: (0.4 + 0.8 * sm(Math.min(1, f * 2))) * (1 - 0.3 * f), o: f < 0.85 ? 0.9 : 0.9 * (1 - (f - 0.85) / 0.15) }; }));
  });
  void kn;
}
