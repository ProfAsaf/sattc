// Fish (a token creature, an attacker: a small, round, startled fish in a bubble of seawater; 1/1, Glub). It
// flinches, then sucks in a breath of water: its cheeks puff, its fins and horn nubs stand on end, the eye
// widens, little bubbles are drawn into its mouth. Then it spits: a jet of seawater, a string of bright drops,
// leaves its mouth for T, punching out through the bubble's skin (a ring spreads there and the bubble
// shudders), the fish thrown back by the spit and its tail whipping. Where the jet lands it splashes: rings
// spreading, drops thrown up and falling back, a flash of light. The fish recoils and wobbles, the bubble
// jiggles like a jelly, bubbles rise from its mouth; then it settles as drawn.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker, element water (as suggested). T = k.aim,
// else a spot on the sea to its left (it spits into the sea); if T is on its right the fish turns about (all
// its pieces mirror about its middle) and spits that way, and turns back at the end.
//   0-900    GATHER: a flinch (350), then it puffs up (820): cheeks, fins and horns stand out; bubbles into the mouth.
//   1000     RELEASE: the spit: the fish is thrown back, squashed; the jet leaves the mouth (emit) for T.
//   1400     IMPACT: the jet lands: rings, drops thrown up, a flash.
//   1400-2800 recoil: fish, fins and bubble wobble and settle; bubbles rise from its mouth.
//   2800-3300 everything eases to rest. At rest from 3300.
// BEATS: release 1000, impact 1400, settle 3300.
export const END = 3800;
export const BEATS = { release: 1000, impact: 1400, settle: 3300 };
export const STILLS = [250, 600, 850, 1050, 1400, 1800, 2400, 3500];

export const textures = {
  glint: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226 + 29 * c, 255, 252, Math.min(1, c * c * 2.4)]; }],
  drop: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, hl = Math.max(0, 1 - Math.hypot(x - 0.38, y - 0.36) * 4.5); return [150 + 105 * hl, 226 + 29 * hl, 236 + 19 * hl, r > 1 ? 0 : Math.min(1, (1 - r) * 4) * (0.72 + 0.28 * r + hl * 0.2)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const S = k.spec, B = S.bubble, R = S.radius, [cx, cy] = S.centre;
  const bubble = k.part('bubble'), bshine = k.part('bshine'), fbody = k.part('fbody'), ftail = k.part('ftail'), ftop = k.part('ftop'), fbelly = k.part('fbelly'), fhorns = k.part('fhorns'), fface = k.part('fface');
  k.css('.g-brine { border-radius: 50%; background: radial-gradient(circle, rgba(246,255,252,.95), rgba(176,240,236,.55) 30%, rgba(110,206,216,.18) 58%, rgba(90,190,210,0) 72%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.5"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#bdf3f2" stroke-width="5" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#f2fffd" stroke-width="1.4"/>', 100, 100);
  const bub = k.svg('<circle cx="20" cy="20" r="15" fill="rgba(180,240,244,.14)" stroke="#e8fffd" stroke-width="2.4"/><path d="M10,16A11,11 0 0 1 17,9" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>', 40, 40);
  const tidy = (l) => l.filter((q, i) => i === 0 || q[0] > l[i - 1][0]);
  const REL = BEATS.release, IM = BEATS.impact, back = BEATS.settle, FLY = IM - REL;

  // ── where the spit goes: another card's point (k.aim), else the sea to its left; which way the fish faces
  const T = k.aim || [40, 152];
  const right = T[0] > cx + 4;
  const E = right ? [2 * cx - S.mouth[0], S.mouth[1]] : S.mouth;
  const bf = right ? -1 : 1; // which way the bubble is thrown by the recoil
  // a pose in the fish's own (left-facing) frame, and the turn that mirrors it about its middle
  const P = (dx, dy, r, sx, sy) => `translate(${(dx * u).toFixed(1)}px, ${(dy * u).toFixed(1)}px) rotate(${r}deg) scale(${sx}, ${sy})`;
  const pre = (px, mir) => (mir ? `translate(${((2 * cx - 2 * px) * u).toFixed(1)}px, 0px) scaleX(-1)` : 'translate(0px, 0px) scaleX(1)');
  // keyframes for one piece of the fish: `list` is [[ms, pose, easing]...] in its own frame; the turn about is added for a right-facing target
  const fish = (el, px, list) => {
    const body = list.map(([t, p, e]) => [t, { transform: `${pre(px, right)} ${p}` }, e]);
    if (right) body.unshift([0, { transform: `${pre(px, false)} ${P(0, 0, 0, 1, 1)}` }, eio]), body.splice(1, 0, [300, { transform: `${pre(px, true)} ${P(0, 0, 0, 1, 1)}` }, eio]), body.push([back, { transform: `${pre(px, true)} ${P(0, 0, 0, 1, 1)}` }, eio], [back + 300, { transform: `${pre(px, false)} ${P(0, 0, 0, 1, 1)}` }]);
    else body.unshift([0, { transform: `${pre(px, false)} ${P(0, 0, 0, 1, 1)}` }, eio]), body.push([back, { transform: `${pre(px, false)} ${P(0, 0, 0, 1, 1)}` }]);
    act(el, tidy(body));
  };
  const id = P(0, 0, 0, 1, 1);

  // ── the body (and its face with it): flinches, puffs up, is thrown back by the spit and wobbles
  const bodyKeys = [[350, P(0.8, 0.5, 0, 0.95, 0.96), eio], [820, P(-0.5, 0, 0, 1.14, 1.12), 'ease-in'], [REL, P(3.4, 0, 2, 0.9, 1.02), 'ease-out'], [REL + 180, P(-0.9, 0, -1, 1.06, 0.98), eio], [REL + 420, P(1, 0, 0.5, 0.98, 1.01), eio], [1900, P(-0.3, 0, -0.2, 1.01, 1), eio], [2600, P(0.2, 0, 0.1, 1, 1), eio], [3000, P(0, 0, 0, 1, 1), eio]];
  fish(fbody, cx, bodyKeys);
  fish(fface, cx, bodyKeys);
  // the tail whips with the spit; the fins stand on end as it puffs and flap after; the horn nubs quiver
  fish(ftail, 160, [[350, P(0, 0, 5, 1, 1), eio], [820, P(2.2, 0, -6, 1.04, 1.04), eio], [REL, P(2.6, 0, 13, 1, 1), 'ease-out'], [REL + 180, P(0, 0, -10, 1, 1), eio], [REL + 420, P(1, 0, 6, 1, 1), eio], [REL + 720, P(0, 0, -4, 1, 1), eio], [1900, P(0, 0, 3, 1, 1), eio], [2600, P(0, 0, -1, 1, 1), eio], [3000, P(0, 0, 0, 1, 1), eio]]);
  fish(ftop, 146, [[350, P(0, 1, 4, 1, 0.95), eio], [820, P(-0.4, -3.8, -6, 1.06, 1.14), eio], [REL, P(2.6, -0.5, 9, 1, 1), 'ease-out'], [REL + 180, P(-0.6, -1.5, -6, 1, 1.05), eio], [REL + 420, P(1, 0, 3, 1, 1), eio], [1900, P(0, 0, -1.5, 1, 1), eio], [3000, P(0, 0, 0, 1, 1), eio]]);
  fish(fbelly, 145, [[350, P(0, -0.8, -4, 1, 0.95), eio], [820, P(0.2, 4, 6, 1.06, 1.16), eio], [REL, P(2.6, 0.4, -9, 1, 1), 'ease-out'], [REL + 180, P(-0.4, 1.4, 6, 1, 1.05), eio], [REL + 420, P(1, 0, -3, 1, 1), eio], [1900, P(0, 0, 1.5, 1, 1), eio], [3000, P(0, 0, 0, 1, 1), eio]]);
  fish(fhorns, 130, [[350, P(0, 0.4, 3, 1, 1), eio], [820, P(-2.8, -3.4, -9, 1.08, 1.12), eio], [REL, P(1.6, 0, 8, 1, 1), 'ease-out'], [REL + 200, P(-1, -1, -5, 1, 1), eio], [REL + 420, P(0.6, 0, 3, 1, 1), eio], [1900, P(0, 0, -1, 1, 1), eio], [3000, P(0, 0, 0, 1, 1), eio]]);
  void id;

  // ── the bubble: bulges as the fish puffs, shudders as the jet punches out through it, jiggles like a jelly
  const bkeys = [[0, 'scale(1, 1)', eio], [350, `translate(${(-0.6 * bf * u).toFixed(1)}px, 0px) scale(.985, 1.01)`, eio], [820, 'scale(1.04, 1.04)', 'ease-in'], [REL + 30, `translate(${(1.8 * bf * u).toFixed(1)}px, 0px) scale(.95, 1.05)`, 'ease-out'], [REL + 230, `translate(${(-0.6 * bf * u).toFixed(1)}px, 0px) scale(1.04, .97)`, eio], [REL + 480, `translate(${(0.5 * bf * u).toFixed(1)}px, 0px) scale(.985, 1.015)`, eio], [REL + 780, 'scale(1.015, .99)', eio], [2000, 'scale(.995, 1.005)', eio], [2700, 'scale(1.003, .998)', eio], [back, 'scale(1, 1)']];
  const bk = bkeys.map(([t, p, e]) => [t, { transform: p }, e]);
  act(bubble, tidy(bk)); act(bshine, tidy(bk));

  // ── light: a glow gathering in the water round the fish, then bright at its mouth as it spits
  fx(k.lightIn('g-brine', [cx, cy], 150, 120), tidy([[150, { transform: 'scale(.7)', opacity: 0 }, 'ease-out'], [820, { transform: 'scale(1)', opacity: 0.18 }, eio], [REL + 120, { transform: 'scale(1.1)', opacity: 0.26 }, eio], [2000, { transform: 'scale(1)', opacity: 0.2 }, eio], [back, { transform: 'scale(.9)', opacity: 0 }]]));
  fx(k.lightIn('g-brine', E, 30, 30), tidy([[500, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(1)', opacity: 0.75 }, 'ease-in'], [REL + 60, { transform: 'scale(1.5)', opacity: 1 }, eio], [REL + 500, { transform: 'scale(.8)', opacity: 0.3 }, eio], [2000, { transform: 'scale(.5)', opacity: 0 }]]));

  // ── gathering (150-900): bubbles of seawater drawn into its mouth
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + rand() * 0.6, r0 = 16 + rand() * 12, X = E[0] + Math.cos(a) * r0 * (right ? 1 : 1), Y = E[1] + Math.sin(a) * r0 * 0.8, t0 = 120 + i * 85, sz = 2.6 + rand() * 3;
    fx(k.picIn(bub, [X, Y], sz, sz), [[t0, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 120, { transform: `${k.T((E[0] - X) * 0.1, (E[1] - Y) * 0.1)} scale(1)`, opacity: 0.9 }, 'ease-in'], [t0 + 520, { transform: `${k.T(E[0] - X, E[1] - Y)} scale(.4)`, opacity: 0 }]]);
  }

  // ── the jet (RELEASE to IMPACT): a string of bright drops along an arc from its mouth to T, on the overlay
  const C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 20];
  const bz = (t) => { const q = 1 - t; return [q * q * E[0] + 2 * q * t * C[0] + t * t * T[0], q * q * E[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const at = (t, s, o) => { const [x, y] = bz(t); return { transform: `${k.T(x - E[0], y - E[1])} scale(${s})`, opacity: o }; };
  // where it leaves the bubble's skin
  let fo = 0.2;
  for (let t = 0; t <= 1; t += 0.01) { const [x, y] = bz(t); if (Math.hypot(x - B[0], y - B[1]) > R) { fo = t; break; } }
  const wall = bz(fo), tw = REL + fo * FLY;
  fx(k.pic(ring, wall, 22, 22), [[tw - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [tw + 40, { transform: 'scale(.6)', opacity: 0.95 }], [tw + 520, { transform: 'scale(1.5)', opacity: 0 }]]);
  fx(k.light('g-brine', wall, 20), [[tw - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [tw + 40, { transform: 'scale(1.2)', opacity: 0.9 }], [tw + 360, { transform: 'scale(.7)', opacity: 0 }]]);
  fx(k.pic('drop', E, 10, 10), [[REL, at(0, 0.5, 0), 'ease-out'], [REL + 50, at(0.03, 1.2, 1), 'linear'], [IM - 30, at(0.96, 1, 1), 'ease-in'], [IM + 30, at(1, 0.8, 0)]]);
  for (let i = 0; i < 14; i++) {
    const t0 = REL + 15 + i * 24, sz = 3.4 + rand() * 3.4, side = (rand() - 0.5) * 5, fl = FLY - 20 + rand() * 40;
    const bt = (f, s, o) => { const [x, y] = bz(Math.max(0, Math.min(1, f))); return { transform: `${k.T(x - E[0], y - E[1] + side * f)} scale(${s})`, opacity: o }; };
    fx(k.pic(i % 4 === 3 ? 'glint' : 'drop', E, sz, sz), [[t0, bt(0, 0.5, 0), 'ease-out'], [t0 + 40, bt(0.04, 1, 0.95), 'linear'], [t0 + fl, bt(1, 1, 0.9), 'ease-in'], [t0 + fl + 90, bt(1, 0.5, 0)]]);
  }

  // ── IMPACT at T: a flash, rings spreading (flat on the sea when it lands alone), drops thrown up and falling back
  const flat = k.aim ? 1 : 0.34;
  fx(k.light('g-brine', T, 46), tidy([[IM - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(1.2)', opacity: 1 }, eio], [IM + 300, { transform: 'scale(.9)', opacity: 0.5 }, eio], [IM + 900, { transform: 'scale(1.4)', opacity: 0 }]]));
  for (let i = 0; i < 3; i++) {
    const t0 = IM + i * 150;
    fx(k.pic(ring, T, 34, 34), [[t0, { transform: `scale(.2, ${(0.2 * flat).toFixed(2)})`, opacity: 0 }, 'ease-out'], [t0 + 70, { transform: `scale(.5, ${(0.5 * flat).toFixed(2)})`, opacity: 0.9 }], [t0 + 800, { transform: `scale(1.7, ${(1.7 * flat).toFixed(2)})`, opacity: 0 }]]);
  }
  for (let i = 0; i < 14; i++) {
    const a = -Math.PI / 2 + (rand() - 0.5) * 2.2, v = 8 + rand() * 18, t0 = IM + rand() * 120, sz = 2.6 + rand() * 4.2, gl = i < 4;
    const pt = (f, s, o) => ({ transform: `translate(${(Math.cos(a) * v * f * u).toFixed(1)}px, ${((Math.sin(a) * v * f + 26 * f * f) * u).toFixed(1)}px) scale(${s})`, opacity: o });
    fx(k.pic(gl ? 'glint' : 'drop', T, sz, sz), [[t0, pt(0, 0.5, 0), 'ease-out'], [t0 + 60, pt(0.15, 1, 0.95), 'linear'], [t0 + 620, pt(1, 1, 0.8), 'ease-in'], [t0 + 760, pt(1.1, 0.8, 0)]]);
  }

  // ── after the spit: bubbles drift up from its mouth
  for (let i = 0; i < 7; i++) {
    const t0 = REL + 120 + i * 190, sz = 2.2 + rand() * 3.4;
    fx(k.picIn(bub, [E[0] + (rand() - 0.5) * 5, E[1] - 1], sz, sz), [[t0, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 200, { transform: `${k.T((rand() - 0.5) * 5, -6)} scale(1)`, opacity: 0.85 }], [t0 + 1100, { transform: `${k.T((rand() - 0.5) * 9, -30 - rand() * 12)} scale(1.1)`, opacity: 0 }]]);
  }
}
