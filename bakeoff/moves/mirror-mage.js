// Mirror Mage (a creature, an attacker: the spell goes into the mirror of water and comes out
// twice). He draws his casting arm back, the orb of light in his hand swelling and the mirror
// drawing in its breath; thrusts, and a bolt of light runs along the beam into the mirror; the
// mirror flashes, rings of light running through it, and two bolts leave it, one swinging high
// and one low, and meet at T in a burst of water: a ring, spray flung up and falling, mist.
// Then the mirror shivers itself still, the beams return and he settles, hat and cloak last.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker, element water (suggestion kept).
//   0-420     ANTICIPATION: arm draws back (rotate down, hand lowered), orb swells, hat tips back,
//             cloak pulls forward; the beams die away, the mirror shrinks and dims.
//   450-600   THRUST: the arm snaps forward past rest, orb flares; the beam in grows from his hand.
//   520-880   a bolt runs hand -> mirror along the beam; at 880 the mirror flashes (scale up,
//             light, rings spreading).
//   1000      RELEASE: two bolts leave the mirror's heart, arcing apart and meeting at T (k.aim, else
//             the sea to the right); the beams out flare; the mirror tilts toward T.
//   1400      IMPACT at T: flash, ring, spray, mist.
//   1400-3300 follow-through: arm recoils and settles, cloak whips and settles, mirror shivers,
//             splash falls, glows fade. At rest from 3300.
// BEATS: release 1000, impact 1400, settle 3300.
export const END = 3700;
export const BEATS = { release: 1000, impact: 1400, settle: 3300 };
export const STILLS = [250, 520, 800, 950, 1150, 1450, 2000, 3500];

export const textures = {
  orb: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [210 + 40 * c, 252, 252, Math.min(1, c * c * 2.6)]; }],
  drop: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [200 + 50 * c, 246, 250, Math.min(1, c * 1.6)]; }],
  mist: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [190, 232, 238, c * c * 0.55]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const S = k.spec, SH = S.shoulder, HAND = S.hand, M = S.emit;
  const arm = k.part('arm'), orb = k.part('orb'), hat = k.part('hat'), cloak = k.part('cloak');
  const mirror = k.part('mirror'), beamIn = k.part('beamIn'), beamsOut = k.part('beamsOut');
  k.css('.g-water { border-radius: 50%; background: radial-gradient(circle, rgba(236,255,254,.95), rgba(170,238,242,.6) 30%, rgba(90,190,205,.22) 58%, rgba(60,170,190,0) 72%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#bff3f4" stroke-width="6" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#f2ffff" stroke-width="1.8"/>', 100, 100);

  const T = k.aim || [282, 138];

  // ── the arm and the orb in its hand, on one set of poses [ms, degrees, dx, dy, ease]
  const poses = [[0, 0, 0, 0, eio], [420, 11, -3.5, 1.2, 'ease-in'], [460, 11, -3.5, 1.2, 'ease-out'], [570, -9, 3.2, -1.4, eio], [800, -5, 1.6, -0.6, eio], [1100, -7, 2.2, -0.9, eio],
    [1350, 4, -1.6, 0.6, eio], [1700, -2, 0.7, -0.2, eio], [2100, 1, -0.3, 0.1, eio], [2800, 0, 0, 0, eio], [3300, 0, 0, 0]];
  const tf = ([, a, dx, dy]) => ({ transform: `translate(${(dx * u).toFixed(1)}px, ${(dy * u).toFixed(1)}px) rotate(${a}deg)` });
  const ap = poses.map((p) => [p[0], tf(p), p[4]]);
  act(arm, ap); act(orb, ap);
  // where the hand is on a pose, relative to where it is drawn (for the glow that rides it)
  const handAt = ([, a, dx, dy]) => {
    const r = (a * Math.PI) / 180, vx = HAND[0] - SH[0], vy = HAND[1] - SH[1];
    return [SH[0] + vx * Math.cos(r) - vy * Math.sin(r) + dx - HAND[0], SH[1] + vx * Math.sin(r) + vy * Math.cos(r) + dy - HAND[1]];
  };
  const handNow = (t) => {
    let i = 0; while (i < poses.length - 2 && poses[i + 1][0] <= t) i++;
    const a = poses[i], b = poses[i + 1], f = Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))), s = f * f * (3 - 2 * f), A = handAt(a), B = handAt(b);
    return [A[0] + (B[0] - A[0]) * s, A[1] + (B[1] - A[1]) * s];
  };
  const hg = [[0, 0.5, 0], [200, 1.3, 0.8], [420, 1.9, 1], [470, 1.9, 1], [580, 2.8, 1], [800, 1.3, 0.7], [1100, 1.0, 0.45], [1500, 0.7, 0.2], [1900, 0.5, 0]];
  fx(k.lightIn('g-water', HAND, 22, 22), hg.map(([t, s, o], i) => { const [x, y] = handNow(t); return [t, { transform: `${k.T(x, y)} scale(${s})`, opacity: o }, i === 3 ? 'ease-out' : eio]; }));

  // ── hat and cloak: the hat tips back with the draw, snaps forward; the cloak pulls then whips
  act(hat, [[0, { transform: 'rotate(0deg)' }, eio], [420, { transform: 'rotate(-5deg)' }, eio], [620, { transform: 'rotate(3.5deg)' }, eio], [900, { transform: 'rotate(-2deg)' }, eio], [1300, { transform: 'rotate(1.5deg)' }, eio], [1900, { transform: 'rotate(-.6deg)' }, eio], [2500, { transform: 'rotate(0deg)' }]]);
  act(cloak, [[0, { transform: 'rotate(0deg)' }, eio], [420, { transform: 'rotate(-3deg)' }, 'ease-out'], [700, { transform: 'rotate(7deg)' }, eio], [1000, { transform: 'rotate(-3.5deg)' }, eio], [1350, { transform: 'rotate(4deg)' }, eio],
    [1750, { transform: 'rotate(-1.6deg)' }, eio], [2300, { transform: 'rotate(.7deg)' }, eio], [2900, { transform: 'rotate(0deg)' }]]);

  // ── the beams: they die away for the gather, the beam in grows from his hand, the beams out flare at the release
  act(beamIn, [[0, { transform: 'scale(1, 1)', opacity: 1 }, 'ease-out'], [300, { transform: 'scale(.5, .6)', opacity: 0.1 }, eio], [470, { transform: 'scale(.3, .5)', opacity: 0 }, 'ease-out'],
    [700, { transform: 'scale(1.04, 1.5)', opacity: 1 }, eio], [1100, { transform: 'scale(1, 1.25)', opacity: 1 }, eio], [1700, { transform: 'scale(1, 1)', opacity: 1 }]]);
  act(beamsOut, [[0, { transform: 'scale(1, 1)', opacity: 1 }, 'ease-out'], [300, { transform: 'scale(.6, .6)', opacity: 0.1 }, eio], [900, { transform: 'scale(.5, .5)', opacity: 0 }, 'ease-out'],
    [1060, { transform: 'scale(1.08, 1.3)', opacity: 1 }, eio], [1500, { transform: 'scale(1, 1.1)', opacity: 1 }, eio], [2300, { transform: 'scale(1, 1)', opacity: 1 }]]);

  // ── the mirror: draws in, flashes when the bolt enters, tilts toward T as the bolts leave, shivers still
  const ang = Math.max(-14, Math.min(14, ((Math.atan2(T[1] - M[1], Math.abs(T[0] - M[0]) + 40) * 180) / Math.PI) * 0.35));
  act(mirror, [[0, { transform: 'scale(1)' }, eio], [380, { transform: 'scale(.92)' }, 'ease-in'], [880, { transform: 'scale(.95)' }, 'ease-out'], [960, { transform: 'scale(1.1, 1.08)' }, eio], [1060, { transform: `rotate(${ang.toFixed(1)}deg) scale(.96, 1.04)` }, eio],
    [1250, { transform: `rotate(${ang.toFixed(1)}deg) scale(1.04, .97)` }, eio], [1500, { transform: `rotate(${(ang * 0.5).toFixed(1)}deg) scale(.98, 1.02)` }, eio], [1900, { transform: 'rotate(-1.2deg) scale(1.01)' }, eio], [2500, { transform: 'rotate(.4deg) scale(1)' }, eio], [3000, { transform: 'rotate(0deg) scale(1)' }]]);
  // light in the mirror: swelling with the draw, flaring at the flash and the release
  const ml = [[250, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [700, { transform: 'scale(.9)', opacity: 0.45 }, eio], [900, { transform: 'scale(1.2)', opacity: 1 }, 'ease-out'], [1060, { transform: 'scale(1.7)', opacity: 0.95 }, eio]];
  for (let t = 1250, i = 0; t < 1900; t += 170, i++) ml.push([t, { transform: `scale(${i % 2 ? 1.4 : 1.15})`, opacity: i % 2 ? 0.8 : 0.55 }, eio]);
  ml.push([2400, { transform: 'scale(.9)', opacity: 0 }]);
  fx(k.light('g-water', M, 86), ml);
  // rings running through the mirror (at the flash) and out of it (at the release)
  for (const [t, s1, s2, o] of [[880, 0.2, 0.9, 0.9], [980, 0.3, 1.5, 0.8], [1080, 0.3, 2.1, 0.6]]) {
    fx(k.pic(ring, M, 50, 50), [[t, { transform: `scale(${s1})`, opacity: 0 }, 'ease-out'], [t + 70, { transform: `scale(${(s1 + (s2 - s1) * 0.2).toFixed(2)})`, opacity: o }], [t + 520, { transform: `scale(${s2})`, opacity: 0 }]]);
  }

  // ── the bolt along the beam, hand -> mirror (520-880)
  const [HX, HY] = k.P(...HAND), [MX, MY] = k.P(M[0] - 14, M[1] - 3);
  for (let i = 0; i < 6; i++) {
    const t0 = 520 + i * 40, sz = 11 - i * 1.2;
    const at = (f, sc, o) => ({ transform: `translate(${((MX - HX) * f).toFixed(1)}px, ${((MY - HY) * f).toFixed(1)}px) scale(${sc})`, opacity: o });
    fx(k.pic('orb', [HAND[0] + 2, HAND[1]], sz, sz), [[t0, at(0, 0.4, 0), 'ease-out'], [t0 + 60, at(0.05, 1, 1)], [t0 + 260, at(0.9, 1, 1), 'ease-in'], [t0 + 340, at(1, 0.4, 0)]]);
  }

  // ── the doubled bolts, mirror -> T (1000-1400): one swings high, one low, and they meet
  const [X0, Y0] = k.P(...M), [X1, Y1] = k.P(...T);
  const dist = Math.hypot(T[0] - M[0], T[1] - M[1]) || 1, bend = Math.min(34, 10 + dist * 0.18);
  const nx = -(T[1] - M[1]) / dist, ny = (T[0] - M[0]) / dist;
  for (let b = 0; b < 2; b++) {
    const sgn = b ? 1 : -1, C = [(M[0] + T[0]) / 2 + nx * bend * sgn, (M[1] + T[1]) / 2 + ny * bend * sgn], S0 = [M[0], M[1] + sgn * 5];
    const bz = (t) => { const q = 1 - t; return [q * q * S0[0] + 2 * q * t * C[0] + t * t * T[0], q * q * S0[1] + 2 * q * t * C[1] + t * t * T[1]]; };
    for (let i = 0; i < 14; i++) {
      const t0 = 1000 + b * 40 + i * 17, sz = i === 0 ? 17 : 15 - i * 0.8, hold = 400 - i * 4, kf = [];
      for (let j = 0; j <= 5; j++) {
        const [x, y] = k.P(...bz(Math.pow(j / 5, 0.85)));
        kf.push([t0 + Math.round(hold * (j / 5)), { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) scale(${j === 0 ? 0.4 : 1})`, opacity: j === 0 ? 0 : 1 }, j === 0 ? 'ease-out' : 'linear']);
      }
      kf.push([t0 + hold + 90, { transform: `translate(${(X1 - X0).toFixed(1)}px, ${(Y1 - Y0).toFixed(1)}px) scale(${i === 0 ? 1.6 : 0.5})`, opacity: 0 }]);
      fx(k.pic('orb', M, sz, sz), kf);
    }
    // little drops shed along the way
    for (let i = 0; i < 4; i++) {
      const f = 0.25 + i * 0.18, [x, y] = k.P(...bz(f)), t0 = 1000 + b * 40 + Math.round(400 * f), p = `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px)`;
      fx(k.pic('drop', M, 4, 4), [[t0, { transform: `${p} scale(.6)`, opacity: 0 }, 'ease-out'], [t0 + 40, { transform: `${p} scale(1)`, opacity: 0.9 }],
        [t0 + 420, { transform: `translate(${(x - X0 + (rand() - 0.5) * 8 * u).toFixed(1)}px, ${(y - Y0 + (10 + rand() * 8) * u).toFixed(1)}px) scale(.5)`, opacity: 0 }]]);
    }
  }

  // ── where they land (1400): a flash, rings, spray flung up and falling, mist
  const IM = BEATS.impact;
  const il = [[IM - 60, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.3)', opacity: 1 }, eio]];
  for (let t = IM + 180, i = 0; t < 2000; t += 140, i++) il.push([t, { transform: `scale(${i % 2 ? 1.1 : 0.9})`, opacity: i % 2 ? 0.75 : 0.5 }, eio]);
  il.push([2400, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.light('g-water', T, 56), il);
  for (const [dt, s2, o] of [[0, 1.8, 0.95], [130, 2.6, 0.7], [280, 3.2, 0.45]]) {
    fx(k.pic(ring, T, 34, 34), [[IM + dt, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + dt + 70, { transform: 'scale(.4)', opacity: o }], [IM + dt + 650, { transform: `scale(${s2})`, opacity: 0 }]]);
  }
  for (let i = 0; i < 14; i++) {
    const up = 14 + rand() * 20, dx = (rand() - 0.5) * 2 * (10 + rand() * 18), sz = 3 + rand() * 3.4, t0 = IM + rand() * 70;
    const pt = (f, s, o) => ({ transform: `translate(${(dx * f * u).toFixed(1)}px, ${((-up * 4 * f * (1 - f) + 6 * f * f) * u).toFixed(1)}px) scale(${s})`, opacity: o });
    fx(k.pic('drop', T, sz, sz), [[t0, pt(0, 0.5, 0), 'ease-out'], [t0 + 40, pt(0.06, 1, 1), 'linear'], [t0 + 200, pt(0.4, 1, 1), 'linear'], [t0 + 380, pt(0.7, 0.9, 0.9), 'linear'], [t0 + 560, pt(1, 0.6, 0)]]);
  }
  for (let i = 0; i < 4; i++) {
    const t = IM + 80 + i * 150, r = Math.round(rand() * 360), x = T[0] + (rand() - 0.5) * 18;
    fx(k.pic('mist', [x, T[1] + 2], 30, 30, { low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 300, { transform: `${k.T(-1, -9)} rotate(${r + 20}deg) scale(1)`, opacity: 0.7 }], [t + 1300, { transform: `${k.T((rand() - 0.5) * 8, -30)} rotate(${r + 50}deg) scale(1.8)`, opacity: 0 }]]);
  }
}
