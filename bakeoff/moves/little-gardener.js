// Little Gardener: he waters, and what he waters grows.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support, element nature.
//   0-600     he turns to face his target if it is behind him (back through a
//             sliver, as Ashmaw's head does); his ears prick up and he hunches a
//             little, as if listening to the garden.
//   500-1250  GATHER: green-gold motes drift in from round about to the can; it
//             swings back and up, a warm light swelling in it; he rises on his toes.
//   1250      RELEASE: the can tips; a stream of water leaves its spout (a brisk
//             arc to T, k.aim, else the glowing sprout), droplets catching the light.
//   1600      IMPACT/bloom at T: the water splashes and ripples, a green light
//             swells, leaves unfurl round it, motes of gold rise (alone, the sprout
//             itself grows taller and puts out leaves).
//   1600-2300 he keeps pouring, the can shaking out its last; ears flop.
//   2300-3100 the can swings home, he settles (and turns back); the green light
//             sinks and the motes thin out. At rest as drawn by 3100 (END 3800).
// BEATS: release 1250, impact 1600, settle 3100.
export const END = 3800;
export const BEATS = { release: 1250, impact: 1600, settle: 3100 };
export const STILLS = [350, 900, 1250, 1500, 1750, 2100, 2700, 3400];

export const textures = {
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226 + 20 * c, 255, 150 + 70 * c * c, Math.min(1, c * c * 2.4)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const body = k.part('body'), ears = k.part('ears'), arm = k.part('arm');
  const [sx0, sy0] = k.spec.spout, [shx, shy] = k.spec.shoulder, MID = k.spec.mid, [fx0, fy0] = k.spec.feet;
  const T = k.aim || k.spec.sprout;
  const solo = !k.aim;
  const turn = T[0] > MID; // his target is behind him: he turns round
  const mT = turn ? -1 : 1;
  k.css('.g-leaf { border-radius: 50%; background: radial-gradient(circle, rgba(250,255,210,.95), rgba(190,240,110,.55) 30%, rgba(120,200,70,.2) 58%, rgba(100,190,60,0) 72%); }');
  const drop = k.svg('<path d="M10,2C10,2 3,11 3,16a7,7 0 0 0 14,0C17,11 10,2 10,2Z" fill="#e6f6ff" stroke="#7fb3c6" stroke-width="1.2"/><ellipse cx="7.5" cy="15" rx="1.4" ry="2.4" fill="#fff" opacity=".8"/>', 20, 24);
  const leaf = k.svg('<defs><linearGradient id="g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#8fcf4a"/><stop offset="1" stop-color="#e4fa9a"/></linearGradient></defs><path d="M20,60C5,44 7,16 20,2C33,16 35,44 20,60Z" fill="url(#g)"/><path d="M20,58L20,12" stroke="#fffbd0" stroke-width="1.4" opacity=".7"/>', 40, 60);
  const ripple = k.svg('<ellipse cx="50" cy="25" rx="44" ry="18" fill="none" stroke="#e8f8ff" stroke-width="3.5"/>', 100, 50);
  const stem = k.svg('<path d="M20,100L20,6" stroke="#cfee70" stroke-width="4" stroke-linecap="round" fill="none"/>', 40, 100);

  // ── tracks: a value over time, smooth between its points
  const track = (pts) => (ms) => {
    let i = pts.length - 1;
    while (i > 0 && pts[i][0] > ms) i--;
    if (i === pts.length - 1) return pts[i][1];
    const [t0, v0, e] = pts[i], [t1, v1] = pts[i + 1], f = Math.min(1, Math.max(0, (ms - t0) / (t1 - t0)));
    return v0 + (v1 - v0) * (e === 'out' ? 1 - (1 - f) * (1 - f) : e === 'in' ? f * f : k.smooth(f));
  };
  const M = turn ? track([[0, 1], [180, 1], [450, 0.06], [750, -1], [2450, -1], [2750, 0.06], [3050, 1]]) : () => 1;
  const bodyRot = track([[0, 0], [700, 1], [1000, -1.5], [1230, -3, 'in'], [1330, -4.5, 'out'], [1700, -3], [2200, -2], [2800, 0.5], [3100, 0]]);
  const bodySy = track([[0, 1], [350, 0.965], [700, 0.975], [1100, 1.035], [1250, 1.045, 'in'], [1350, 0.99, 'out'], [1800, 1.01], [2300, 1], [2800, 0.995], [3100, 1]]);
  const earRot = track([[0, 0], [300, -9], [800, -6], [1250, -11], [1350, 14, 'out'], [1700, 6], [2100, 10], [2500, 3], [3100, 0]]);
  const armRot = track([[0, 0], [550, 3], [1000, 14], [1230, 17, 'in'], [1360, -17, 'out'], [1500, -13], [1700, -15], [1850, -12.5], [2050, -15], [2250, -8], [2500, 5], [2850, -1.5], [3100, 0]]);

  // a part's transform from a mirror factor, its pivot x and its own rotate/scale
  const tfOf = (ms, px, rot, sy = 1) => { const m = M(ms); return `translate(${((MID - px) * (1 - m) * u).toFixed(2)}px, 0px) scale(${m.toFixed(3)}, ${sy.toFixed(3)}) rotate(${rot.toFixed(2)}deg)`; };
  const grid = [];
  for (let t = 0; t <= 3100; t += 50) grid.push(t);
  grid.push(1250, 1600);
  grid.sort((a, b) => a - b);
  const uniq = grid.filter((t, i) => t !== grid[i - 1]);
  const sample = (px, rotF, syF) => uniq.map((t) => [t, { transform: tfOf(t, px, rotF(t), syF ? syF(t) : 1) }, 'linear']);
  act(body, sample(fx0, bodyRot, bodySy));
  act(ears, sample(181, (t) => earRot(t) + bodyRot(t), bodySy));
  act(arm, sample(shx, armRot));

  // a point of the arm (or of the body) at a moment: where it is on the card then
  const armPt = ([x, y], ms) => {
    const a = (armRot(ms) * Math.PI) / 180, m = M(ms), rx = x - shx, ry = y - shy;
    return [shx + m * (rx * Math.cos(a) - ry * Math.sin(a)) + (MID - shx) * (1 - m), shy + rx * Math.sin(a) + ry * Math.cos(a)];
  };
  const spout = (ms) => armPt([sx0, sy0], ms);
  const bodyPt = ([x, y], ms) => {
    const a = (bodyRot(ms) * Math.PI) / 180, m = M(ms), sy = bodySy(ms), rx = x - fx0, ry = (y - fy0) * sy;
    return [fx0 + m * (rx * Math.cos(a) - ry * Math.sin(a)) + (MID - fx0) * (1 - m), fy0 + rx * Math.sin(a) + ry * Math.cos(a)];
  };
  // an effect riding on the can's spout / mouth of the can: [ms, scale, opacity] points, sampled every 60 ms
  const ride = (el, pt, list, ptF) => {
    const ks = [];
    for (let i = 0; i < list.length; i++) {
      const [t0, s0, o0] = list[i], nx = list[i + 1];
      const put = (t, s, o) => { const [x, y] = ptF(pt, t); ks.push([t, { transform: `${k.T(x - pt[0], y - pt[1])} scale(${s.toFixed(3)})`, opacity: o }, 'linear']); };
      put(t0, s0, o0);
      if (nx) for (let t = t0 + 60; t < nx[0] - 30; t += 60) { const f = (t - t0) / (nx[0] - t0); put(t, s0 + (nx[1] - s0) * f, o0 + (nx[2] - o0) * f); }
    }
    return fx(el, ks);
  };

  // ── gather (500-1250): a warm green light swelling in the can, motes drifting in to it
  const canC = [147, 145]; // the middle of the can as drawn
  const swell = [[480, 0.3, 0], [800, 0.8, 0.7], [1000, 1, 0.9], [1150, 1.15, 1], [1250, 1.3, 1], [1400, 0.9, 0.7], [1900, 0.7, 0.4], [2400, 0.4, 0.15], [2800, 0.3, 0]];
  ride(k.light('g-leaf', canC, 34, 34), canC, swell, armPt);
  ride(k.light('g-heal', canC, 22, 22), canC, [[700, 0.3, 0], [1000, 0.9, 0.55], [1250, 1.2, 0.8], [1450, 0.8, 0.3], [1700, 0.5, 0]], armPt);
  for (let i = 0; i < 12; i++) {
    const a = rand() * Math.PI * 2, d = 24 + rand() * 22, t0 = 480 + i * 55 + rand() * 40, dur = 420 + rand() * 120, sz = 3 + rand() * 2.5;
    const ox = Math.cos(a) * d, oy = Math.sin(a) * d * 0.7 + 4;
    const p0 = armPt(canC, t0), p1 = armPt(canC, t0 + dur);
    fx(k.pic('mote', canC, sz, sz), [[t0, { transform: `${k.T(p0[0] - canC[0] + ox, p0[1] - canC[1] + oy)} scale(.5)`, opacity: 0 }, 'ease-in'],
      [t0 + 90, { transform: `${k.T(p0[0] - canC[0] + ox * 0.9, p0[1] - canC[1] + oy * 0.9)} scale(1)`, opacity: 1 }, 'ease-in'],
      [t0 + dur, { transform: `${k.T(p1[0] - canC[0], p1[1] - canC[1])} scale(.35)`, opacity: 0.9 }], [t0 + dur + 50, { transform: `${k.T(p1[0] - canC[0], p1[1] - canC[1])} scale(.1)`, opacity: 0 }]]);
  }
  // sun-warmth: the whole glade brightens a little while he gathers and pours
  fx(k.lightIn('g-heal', [150, 130], 320, 150, { under: true }), [[300, { opacity: 0 }, 'ease-out'], [1250, { opacity: 0.4 }, eio], [2000, { opacity: 0.35 }, eio], [3000, { opacity: 0 }]]);

  // ── the stream (1250-2100): drops from the spout along an arc to T; each lands about 350 ms after it leaves
  const FLY = 350;
  const dist = Math.hypot(T[0] - sx0, T[1] - sy0);
  const arch = 8 + dist * 0.22;
  for (let i = 0; i < 24; i++) {
    const t0 = 1250 + i * 36 + rand() * 8, S = spout(t0), jx = (rand() - 0.5) * 4, jy = (rand() - 0.5) * 3, E = [T[0] + jx, T[1] + jy];
    const C = [(S[0] + E[0]) / 2, Math.min(S[1], E[1]) - arch];
    const bz = (f) => { const q = 1 - f; return [q * q * S[0] + 2 * q * f * C[0] + f * f * E[0], q * q * S[1] + 2 * q * f * C[1] + f * f * E[1]]; };
    const sz = 2.6 + rand() * 1.4, ks = [];
    [0, 0.2, 0.4, 0.6, 0.8, 1].forEach((f, j) => {
      const [x, y] = bz(f), ang = Math.atan2(...(f < 1 ? [bz(f + 0.05)[1] - y, bz(f + 0.05)[0] - x] : [E[1] - bz(0.95)[1], E[0] - bz(0.95)[0]])) * 180 / Math.PI - 90;
      ks.push([t0 + f * FLY, { transform: `${k.T(x - sx0, y - sy0)} rotate(${ang.toFixed(0)}deg) scale(${j ? 1 : 0.5}, ${j ? 1.25 : 0.5})`, opacity: j === 0 ? 0 : 1 }, 'linear']);
    });
    ks.push([t0 + FLY + 40, { transform: `${k.T(E[0] - sx0, E[1] - sy0)} scale(.5)`, opacity: 0 }]);
    fx(k.pic(drop, [sx0, sy0], sz, sz * 1.2, { lit: false }), ks);
  }
  // a glint travelling the stream
  for (let i = 0; i < 6; i++) {
    const t0 = 1260 + i * 130, S = spout(t0), E = T, C = [(S[0] + E[0]) / 2, Math.min(S[1], E[1]) - arch];
    const bz = (f) => { const q = 1 - f; return [q * q * S[0] + 2 * q * f * C[0] + f * f * E[0], q * q * S[1] + 2 * q * f * C[1] + f * f * E[1]]; };
    fx(k.pic('mote', [sx0, sy0], 5, 5), [0, 0.25, 0.5, 0.75, 1].map((f, j) => [t0 + f * FLY, { transform: `${k.T(bz(f)[0] - sx0, bz(f)[1] - sy0)} scale(${(0.6 + 0.5 * Math.sin(f * Math.PI)).toFixed(2)})`, opacity: j === 0 ? 0 : j === 4 ? 0 : 0.95 }, 'linear']));
  }

  // ── where it lands: splashes, ripples (1600, repeated while the stream lasts)
  const IM = 1600;
  for (let b = 0; b < 4; b++) {
    const tb = IM + b * 220;
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI * (0.15 + 0.7 * (i / 5)) + (rand() - 0.5) * 0.3, v = 8 + rand() * 9;
      const pxy = (f) => [Math.cos(a) * v * f, Math.sin(a) * v * f + 14 * f * f];
      const fr = [0, 0.35, 0.7, 1], pts = fr.map((f) => pxy(f));
      fx(k.pic(drop, T, 2.2, 2.6, { lit: false }), fr.map((f, j) => [tb + f * 330, { transform: `${k.T(pts[j][0], pts[j][1])} scale(${(1 - 0.3 * f).toFixed(2)})`, opacity: j === 0 ? 0 : j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']));
    }
    fx(k.pic(ripple, [T[0], T[1] + 2], 26, 13, { lit: false }), [[tb, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [tb + 60, { transform: 'scale(.4)', opacity: 0.8 }, 'ease-out'], [tb + 480, { transform: 'scale(1.3)', opacity: 0 }]]);
  }

  // ── the bloom (from 1600): a green light, leaves unfurling round it, gold motes rising
  const bl = [[IM - 60, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 220, { transform: 'scale(1.1)', opacity: 0.95 }, eio]];
  for (let t = IM + 450, i = 0; t < 2600; t += 160, i++) bl.push([t, { transform: `scale(${i % 2 ? 1.28 : 1.08})`, opacity: i % 2 ? 0.95 : 0.75 }, eio]);
  bl.push([3000, { transform: 'scale(.8)', opacity: 0 }]);
  fx(k.light('g-leaf', T, 58, 58), bl);
  fx(k.light('g-heal', T, 30, 30), [[IM, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [IM + 120, { transform: 'scale(1.5)', opacity: 0.95 }, 'ease-out'], [IM + 600, { transform: 'scale(1.9)', opacity: 0 }]]);
  fx(k.pic(ripple, [T[0], T[1]], 60, 30), [[IM + 150, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [IM + 260, { transform: 'scale(.4)', opacity: 0.55 }, 'ease-out'], [IM + 900, { transform: 'scale(1.2)', opacity: 0 }]]);
  // leaves: each unfurls from T, swings out and waves, then folds away
  const nL = 7;
  for (let i = 0; i < nL; i++) {
    const ang = -78 + (i / (nL - 1)) * 156 + (rand() - 0.5) * 14, t0 = IM + 100 + i * 70, big = 0.75 + rand() * 0.35;
    fx(k.pic(leaf, [T[0], T[1]], 8 * big, 12 * big, { base: true }), [[t0, { transform: `rotate(${(ang * 0.3).toFixed(0)}deg) scale(.1)`, opacity: 0 }, 'ease-out'], [t0 + 200, { transform: `rotate(${ang.toFixed(0)}deg) scale(1)`, opacity: 0.95 }, 'ease-out'],
      [t0 + 500, { transform: `rotate(${(ang + (i % 2 ? 6 : -6)).toFixed(0)}deg) scale(1.05)`, opacity: 0.9 }, eio], [t0 + 900, { transform: `rotate(${(ang - (i % 2 ? 4 : -4)).toFixed(0)}deg) scale(1)`, opacity: 0.8 }, eio], [t0 + 1400, { transform: `rotate(${(ang * 0.5).toFixed(0)}deg) scale(.5)`, opacity: 0 }]]);
  }
  // motes of gold rising
  for (let i = 0; i < 16; i++) {
    const t0 = IM + 150 + i * 62 + rand() * 40, x = T[0] + (rand() - 0.5) * 22, y = T[1] + 4 + (rand() - 0.5) * 8, sz = 2.8 + rand() * 2.8;
    fx(k.pic('mote', [x, y], sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 140, { transform: `${k.T((rand() - 0.5) * 4, -4)} scale(1)`, opacity: 1 }], [t0 + 800, { transform: `${k.T((rand() - 0.5) * 12, -26 - rand() * 14)} scale(.3)`, opacity: 0 }]]);
  }
  // alone, the sprout itself grows: a taller stem, and two fresh leaves
  if (solo) {
    const [sx, sy] = k.spec.sprout, by = 177;
    fx(k.picIn(stem, [sx, by], 4, 30, { base: true }), [[IM + 150, { transform: 'scaleY(.05)', opacity: 0 }, 'ease-out'], [IM + 500, { transform: 'scaleY(.55)', opacity: 0.95 }, 'ease-out'], [IM + 1100, { transform: 'scaleY(.62)', opacity: 0.9 }, eio], [2900, { transform: 'scaleY(.5)', opacity: 0.7 }], [3300, { transform: 'scaleY(.3)', opacity: 0 }]]);
    [[-1, 0], [1, 120]].forEach(([d, lag]) => {
      fx(k.picIn(leaf, [sx, by - 18], 11, 16, { base: true }), [[IM + 450 + lag, { transform: `rotate(${d * 10}deg) scale(.05)`, opacity: 0 }, 'ease-out'], [IM + 800 + lag, { transform: `rotate(${d * 62}deg) scale(1)`, opacity: 0.95 }, 'ease-out'],
        [IM + 1300 + lag, { transform: `rotate(${d * 56}deg) scale(1.05)`, opacity: 0.9 }, eio], [3150, { transform: `rotate(${d * 50}deg) scale(.9)`, opacity: 0.6 }], [3450, { transform: `rotate(${d * 20}deg) scale(.2)`, opacity: 0 }]]);
    });
  }

  // ── a happy rustle of his own: a few motes shaken off his cloak at the end of the pour
  for (let i = 0; i < 6; i++) {
    const t0 = 2150 + i * 90, x = 174 + rand() * 20, y = 120 + rand() * 40, sz = 2.4 + rand() * 2;
    fx(k.pic('mote', [x, y], sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 120, { transform: 'scale(1)', opacity: 0.9 }], [t0 + 800, { transform: `${k.T((rand() - 0.5) * 10, -16 - rand() * 12)} scale(.3)`, opacity: 0 }]]);
  }
}
