// Unearth: a skeletal hand claws up out of the fresh grave, a pale spirit-card gathering in its palm,
// and flings it up and away to your hand.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support (a creature returns from the discard
// pile to your hand: the spell's gift is the returning spirit), element bone (the suggestion: the
// picture is a skeletal hand, the violet light rides on it).
//   0-500     TREMOR: the earth shudders, clods hop, the cracks flare, violet light swells from
//             below; the hand sinks a little (anticipation).
//   500-1000  THRUST: the hand claws up, the arm stretching from its foot, fingers splayed; dust
//             puffs along the grave; a spirit-card gathers in the palm, glowing.
//   1000-1150 the fingers close round it, then FLICK open (1150, release): the card leaves the
//             palm along an arc to T (k.aim, else straight up out of the picture).
//   1550      IMPACT at T: flare, ring, a shower of pale motes and bone-white dust.
//   1550-3400 the fingers relax and curl, the hand sinks back into the earth, the cracks dim, the
//             light fades. At rest as drawn by 3400 (END 4000).
// BEATS: release 1150, impact 1550, settle 3400.
export const END = 4000;
export const BEATS = { release: 1150, impact: 1550, settle: 3400 };
export const STILLS = [300, 700, 1000, 1200, 1450, 1700, 2500, 3700];

export const textures = {
  orb: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [214 + 41 * c, 180 + 70 * c * c, 255, Math.min(1, c * c * 2.4)]; }],
  mote: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [232, 216, 255, Math.min(1, c * c * 3)]; }],
  dust: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [84, 66, 112, c * c * 0.7]; }],
  bone: [12, 12, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [238, 230, 244, Math.min(1, c * 2.2)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const S = k.spec, E = S.emit, G = S.grave;
  const arm = k.part('arm'), palm = k.part('palm'), lip = k.part('lip'), cracks = k.part('cracks'), clods = k.part('clods');
  const fing = [1, 2, 3, 4, 5].map((i) => k.part('f' + i));
  const T = k.aim || [150, 36];
  k.css('.g-bonevio { border-radius: 50%; background: radial-gradient(circle, rgba(250,244,255,.95), rgba(204,164,255,.6) 30%, rgba(150,96,255,.24) 56%, rgba(120,70,255,0) 72%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#b790f5" stroke-width="5" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#efe4ff" stroke-width="1.4"/>', 100, 100);
  const card = k.svg('<defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4ecff"/><stop offset="1" stop-color="#a77bf0"/></linearGradient><filter id="b" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.2"/></filter></defs><rect x="2" y="2" width="14" height="20" rx="2" fill="#c9a6ff" filter="url(#b)"/><rect x="3" y="3" width="12" height="18" rx="1.6" fill="url(#c)" stroke="#fff" stroke-width=".8"/><path d="M9,7l1.4,3.4l3.4,.4l-2.6,2.2l.8,3.4l-3,-1.8l-3,1.8l.8,-3.4l-2.6,-2.2l3.4,-.4Z" fill="#6a3fc4" opacity=".75"/>', 18, 24);

  // ── the hand rises (dy, drawing units, negative is up): the arm stretches from its foot, palm and fingers lift
  const DY = [[0, 0], [350, 3], [700, -12], [1100, -13], [1250, -9], [2000, -11], [2800, -4], [3400, 0]];
  const armK = DY.map(([t, dy]) => [t, { transform: `scale(1, ${(1 - dy / 52).toFixed(3)})` }, eio]);
  act(arm, armK);
  const lift = (dy, extra = '') => ({ transform: `translate(0px, ${(dy * u).toFixed(1)}px)${extra}` });
  act(palm, DY.map(([t, dy]) => [t, lift(dy), eio]));
  // fingers: splay as they come up, close round the spirit, flick open at the release, relax and curl
  const spread = [-16, -6, 0, 6, 16], base = [-4, -2, 0, 2, 4];
  fing.forEach((f, i) => {
    const sp = spread[i], cl = -spread[i] * 1.2;
    const at = (dy, rot) => lift(dy, ` rotate(${rot.toFixed(1)}deg)`);
    act(f, [[0, at(0, 0), eio], [350, at(3, -base[i] * 1.5), eio], [700, at(-12, sp), eio], [1000, at(-13, cl * 0.8), 'ease-in'], [1150, at(-13, sp * 1.5), 'ease-out'], [1400, at(-11, sp * 1.1), eio],
      [2000, at(-11, sp * 0.4 + base[i]), eio], [2800, at(-4, base[i] * 0.8), eio], [3400, at(0, 0)]]);
  });

  // ── the earth: the lip shudders, clods hop, the cracks flare and pulse
  const sh = (x, y) => ({ transform: `translate(${(x * u).toFixed(1)}px, ${(y * u).toFixed(1)}px)` });
  const shake = [[0, sh(0, 0), eio]];
  for (let t = 60, i = 0; t < 900; t += 70, i++) shake.push([t, sh((i % 2 ? 0.7 : -0.7) * (1 - t / 1100), (i % 3 ? 0.4 : -0.3)), eio]);
  shake.push([1000, sh(0, 0)]);
  act(lip, shake);
  const hop = (px, py, rr) => ({ transform: `translate(${(px * u).toFixed(1)}px, ${(py * u).toFixed(1)}px) rotate(${rr}deg)` });
  act(clods, [[0, hop(0, 0, 0), eio], [200, hop(0, 0, 0), 'ease-out'], [380, hop(1, -4, 3), 'ease-in'], [520, hop(0, 0.6, -1), 'ease-out'], [700, hop(-1, -5, -4), 'ease-in'], [860, hop(0, 0, 0), eio], [1100, hop(0, 0, 0)]]);
  const cr = (o, s) => ({ opacity: o, transform: `scale(${s})` });
  act(cracks, [[0, cr(1, 1), eio], [250, cr(0.55, 1), eio], [700, cr(1, 1.03), eio], [1000, cr(0.7, 1), eio], [1200, cr(1, 1.04), 'ease-out'], [2000, cr(0.85, 1.02), eio], [3000, cr(1, 1)]]);
  // the glow from below swells, spills up the arm
  fx(k.lightIn('g-bonevio', [150, 168], 200, 110), [[0, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [500, { transform: 'scale(1)', opacity: 0.65 }, eio], [1200, { transform: 'scale(1.1)', opacity: 0.8 }, eio], [2200, { transform: 'scale(1)', opacity: 0.5 }, eio], [3300, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.lightIn('g-bonevio', [150, 120], 90, 140), [[550, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [1000, { transform: 'scale(1)', opacity: 0.45 }, eio], [2000, { transform: 'scale(1)', opacity: 0.3 }, eio], [2900, { transform: 'scale(.8)', opacity: 0 }]]);
  // dust puffing along the grave as the hand breaks out, and bone-pale grit flung off the knuckles
  for (let i = 0; i < 9; i++) {
    const x = 128 + i * 6 + (rand() - 0.5) * 6, t = 520 + i * 50, r = Math.round(rand() * 360), dir = i < 4 ? -1 : 1;
    fx(k.picIn('dust', [x, 168], 22, 22, { lit: false }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'],
      [t + 260, { transform: `${k.T(dir * (5 + rand() * 7), -9)} rotate(${r + 25}deg) scale(1)`, opacity: 0.6 }], [t + 1100, { transform: `${k.T(dir * (12 + rand() * 12), -30)} rotate(${r + 60}deg) scale(1.9)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 7; i++) {
    const t = 560 + i * 60, dx = (rand() - 0.5) * 50, sz = 1.6 + rand() * 1.6;
    fx(k.picIn('bone', [150 + (rand() - 0.5) * 30, 150], sz, sz), [[t, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'],
      [t + 160, { transform: `${k.T(dx * 0.5, -26 - rand() * 10)} scale(1)`, opacity: 0.9 }, 'ease-out'], [t + 650, { transform: `${k.T(dx, 14)} scale(.8)`, opacity: 0 }, 'ease-in']]);
  }

  // ── the spirit-card gathers in the palm (riding the rising hand), flares as the fingers close
  const Lp = [E[0], E[1] - 13]; // the palm at its height
  fx(k.picIn('orb', E, 30, 30), [[500, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [900, { transform: `${k.T(0, -12)} scale(.8)`, opacity: 0.8 }, eio], [1100, { transform: `${k.T(0, -13)} scale(1.4)`, opacity: 1 }, 'ease-out'], [1250, { transform: `${k.T(0, -12)} scale(1.8)`, opacity: 0.5 }, 'ease-out'], [1500, { transform: `${k.T(0, -11)} scale(2.2)`, opacity: 0 }]]);
  fx(k.picIn(card, E, 9, 12, { lit: false }), [[620, { transform: `${k.T(0, 4)} scale(.3) rotate(-10deg)`, opacity: 0 }, 'ease-out'], [900, { transform: `${k.T(0, -12)} scale(.9) rotate(-4deg)`, opacity: 0.95 }, eio], [1100, { transform: `${k.T(0, -13)} scale(1) rotate(2deg)`, opacity: 1 }, eio], [1150, { transform: `${k.T(0, -13)} scale(1) rotate(2deg)`, opacity: 0 }]]);
  for (let i = 0; i < 8; i++) {
    const a = rand() * Math.PI * 2, r = 14 + rand() * 8, t0 = 600 + i * 55, sz = 2.5 + rand() * 2;
    fx(k.picIn('mote', [E[0] + Math.cos(a) * r, E[1] + Math.sin(a) * r * 0.8], sz, sz), [[t0, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'],
      [t0 + 120, { transform: `${k.T(0, 0)} scale(1)`, opacity: 0.9 }, 'ease-in'], [t0 + 440, { transform: `${k.T(-Math.cos(a) * r, -Math.sin(a) * r * 0.8 - 13)} scale(.4)`, opacity: 0 }]]);
  }

  // ── release (1150): the spirit-card flies from the palm to T on an arc, on the overlay
  const C = [(Lp[0] + T[0]) / 2 + (T[0] >= Lp[0] ? 8 : -8), Math.min(Lp[1], T[1]) - 28];
  const bz = (t) => { const q = 1 - t; return [q * q * Lp[0] + 2 * q * t * C[0] + t * t * T[0], q * q * Lp[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const [X0, Y0] = k.P(...Lp);
  const at = (f, s, o, rr = 0) => { const [x, y] = k.P(...bz(f)); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) scale(${s}) rotate(${rr}deg)`, opacity: o }; };
  const t0 = 1150, dur = 400;
  fx(k.pic(card, Lp, 11, 15, { lit: false }), [[t0, at(0, 0.9, 0), 'ease-in'], [t0 + 40, at(0.05, 1, 1, 0), 'ease-in'], [t0 + dur * 0.5, at(0.5, 1.1, 1, 200), 'linear'], [t0 + dur, at(1, 1, 0.95, 380), 'ease-out'], [t0 + dur + 120, at(1, 1.9, 0, 400)]]);
  fx(k.pic('orb', Lp, 18, 18), [[t0, at(0, 0.5, 0), 'ease-in'], [t0 + 60, at(0.1, 1.2, 1), 'linear'], [t0 + dur * 0.6, at(0.6, 1.3, 1), 'linear'], [t0 + dur, at(1, 1.1, 0.9), 'ease-out'], [t0 + dur + 140, at(1, 2, 0)]]);
  for (let j = 0; j < 7; j++) {
    const f = 0.08 + j * 0.13, ts = Math.round(t0 + dur * f);
    fx(k.pic('mote', Lp, 4.5, 4.5), [[ts, at(f, 0.5, 0), 'ease-out'], [ts + 40, at(f, 1, 0.9)], [ts + 300, at(f, 0.3, 0)]]);
  }

  // ── impact (1550): a flare, rings, motes and bone-white grit scattering
  const IM = 1550;
  fx(k.light('g-bonevio', T, 70), [[IM - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [IM + 500, { transform: 'scale(1.2)', opacity: 0.55 }, eio], [IM + 1500, { transform: 'scale(.8)', opacity: 0 }]]);
  for (const [d, w, o] of [[0, 80, 0.95], [150, 56, 0.7]]) {
    fx(k.pic(ring, T, w, w), [[IM + d - 1, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + d + 40, { transform: 'scale(.3)', opacity: o }, 'ease-out'], [IM + d + 700, { transform: 'scale(1.1)', opacity: 0 }]]);
  }
  for (let i = 0; i < 12; i++) {
    const a = rand() * Math.PI * 2, r = 16 + rand() * 22, t1 = IM + 20 + rand() * 120, life = 700 + rand() * 500, sz = 2.2 + rand() * 2.6;
    const ex = Math.cos(a) * r, ey = Math.sin(a) * r;
    const pts = k.arc([0, 0], [ex * 0.7, ey - 6], [ex * 1.1, ey + 10 + rand() * 10], 5);
    fx(k.pic(i % 3 === 0 ? 'bone' : 'mote', T, sz, sz), [[t1, { transform: `${k.T(0, 0)} scale(.3)`, opacity: 0 }, 'ease-out'],
      ...pts.map(([x, y], j) => [Math.round(t1 + 40 + life * j / 5), { transform: `${k.T(x, y)} scale(${1 - 0.4 * j / 5})`, opacity: j === 5 ? 0 : 0.9 }, j < 1 ? 'ease-out' : eio])]);
  }
}
