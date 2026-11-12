// Dawnsinger (a 2/3 whose song makes Spirits; role support, element spirit: as suggested). She draws a breath and sings:
// a stream of tiny winged spirits pours out of her mouth, rides her song over the hill to the rising sun (or to whatever
// card she sings to) and blooms there in light.
//
// PLAN (drawing units 300 x 210, ms of the move). T = k.aim, else the sun.
//   0-800    GATHER: she tips her head a little forward and her arms sink, as a singer does before the note; light
//            gathers at her mouth and a few motes are drawn in toward it.
//   800-1000 BEATS.release 900: the head is thrown right back, the arms open wide and lift; the first spirits are loosed.
//   900-1500 the spirits pour out one after another (80 ms apart, 14 of them), each beating its wings, along the song's
//            arc (the drawn ribbon when alone) to T, a trail of light motes left behind each. The ribbon glows.
//   1500     BEATS.impact: the first spirit arrives; each one that arrives flares and bursts into a ring of light.
//   1500-2900 the blooming: a warm light swells at T, rings run out, motes rise; the sun (alone) swells. Her head and arms
//            ease down and she holds the note, the glow at her mouth fading.
//   3500     BEATS.settle: all at rest as drawn (END 4000).
// If T is behind her (to the left of her mouth) her head turns to it.
export const END = 4000;
export const BEATS = { release: 900, impact: 1500, settle: 3500 };
export const STILLS = [350, 800, 1000, 1250, 1550, 1900, 2600, 3700];

export const textures = {
  mote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 240 + 15 * c, 190 + 55 * c * c, Math.min(1, c * c * c * 2.4)]; }],
  star: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); const ax = Math.abs(x - 0.5) * 2, ay = Math.abs(y - 0.5) * 2, ray = Math.max(0, 1 - Math.min(ax, ay) * 9) * Math.max(0, 1 - Math.max(ax, ay)); return [255, 246 + 9 * c, 215 + 40 * c * c, Math.min(1, c * c * c * 1.6 + ray * 0.85)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const S = k.spec, M = S.emit, T = k.aim || S.sun;
  const head = k.part('head'), armL = k.part('armL'), armR = k.part('armR');
  k.css('.g-song { border-radius: 50%; background: radial-gradient(circle, rgba(255,252,236,.95), rgba(255,232,168,.6) 30%, rgba(255,206,120,.2) 58%, rgba(255,190,100,0) 72%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#ffe9b4" stroke-width="5" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#fffdf2" stroke-width="1.8"/>', 100, 100);
  // a tiny winged spirit: two wings swept up from a bright body (drawn once; it beats by scaling across)
  const spirit = k.svg('<defs><filter id="b" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.3"/></filter></defs><g filter="url(#b)" fill="#ffe7a8"><path d="M20,26Q8,24 2,8Q12,14 20,22Z"/><path d="M20,26Q32,24 38,8Q28,14 20,22Z"/><circle cx="20" cy="22" r="4.5"/></g><path d="M20,27Q9,25 3,10Q12,15 20,23Z M20,27Q31,25 37,10Q28,15 20,23Z" fill="#fffcf0"/><circle cx="20" cy="21" r="2.6" fill="#fff"/><path d="M20,24Q19,30 20,35Q21,30 20,24Z" fill="#fff6d2" opacity=".8"/>', 40, 40);

  // ── her song's path: the drawn ribbon when she sings to the sun, else an arc to T
  const RIB = [[95, 66], [102, 46], [124, 29], [158, 21], [194, 27], [222, 50], [234, 88], [238, 128]];
  const alone = !k.aim;
  const C = [(M[0] + T[0]) / 2, Math.min(M[1], T[1]) - Math.max(70, Math.hypot(T[0] - M[0], T[1] - M[1]) * 0.35)];
  const path = (t) => {
    if (alone) { // along the drawn ribbon (a Catmull-Rom through its points)
      const n = RIB.length - 1, f = Math.max(0, Math.min(0.9999, t)) * n, i = Math.floor(f), s = f - i;
      const p0 = RIB[Math.max(0, i - 1)], p1 = RIB[i], p2 = RIB[i + 1], p3 = RIB[Math.min(n, i + 2)];
      const c = (a, b, cc, d) => 0.5 * (2 * b + (-a + cc) * s + (2 * a - 5 * b + 4 * cc - d) * s * s + (-a + 3 * b - 3 * cc + d) * s * s * s);
      return [c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])];
    }
    const q = 1 - t; return [q * q * M[0] + 2 * q * t * C[0] + t * t * T[0], q * q * M[1] + 2 * q * t * C[1] + t * t * T[1]];
  };
  const [X0, Y0] = k.P(...M);
  const at = (p) => { const [x, y] = k.P(...p); return `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px)`; };

  // ── her: a breath in, then the note
  const toLeft = T[0] < M[0] - 8;
  const thrown = toLeft ? 8 : -14; // the head, in degrees (negative: back and up)
  act(head, [[0, { transform: 'none' }, eio], [520, { transform: 'rotate(5deg)' }, 'ease-in-out'], [820, { transform: 'rotate(6deg)' }, 'ease-out'], [1050, { transform: `rotate(${thrown}deg)` }, eio],
    [2500, { transform: `rotate(${thrown * 0.8}deg)` }, eio], [3500, { transform: 'none' }]]);
  act(armL, [[0, { transform: 'none' }, eio], [520, { transform: 'rotate(-9deg)' }, 'ease-in-out'], [820, { transform: 'rotate(-10deg)' }, 'ease-out'], [1100, { transform: 'rotate(34deg)' }, eio],
    [1500, { transform: 'rotate(30deg)' }, eio], [2600, { transform: 'rotate(32deg)' }, eio], [3500, { transform: 'none' }]]);
  act(armR, [[0, { transform: 'none' }, eio], [520, { transform: 'rotate(9deg)' }, 'ease-in-out'], [840, { transform: 'rotate(10deg)' }, 'ease-out'], [1130, { transform: 'rotate(-34deg)' }, eio],
    [1520, { transform: 'rotate(-30deg)' }, eio], [2620, { transform: 'rotate(-32deg)' }, eio], [3500, { transform: 'none' }]]);

  // ── the breath gathers: a light at her mouth, motes drawn in, then the note
  const gl = [[150, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [800, { transform: 'scale(1)', opacity: 0.7 }, eio], [1000, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out']];
  for (let t = 1150, i = 0; t < 2300; t += 130, i++) gl.push([t, { transform: `scale(${i % 2 ? 1.35 : 1.1})`, opacity: i % 2 ? 0.95 : 0.7 }, eio]);
  gl.push([2900, { transform: 'scale(.6)', opacity: 0 }]);
  fx(k.light('g-song', M, 40), gl);
  for (let i = 0; i < 7; i++) {
    const a = rand() * Math.PI * 2, d = 22 + rand() * 14, t = 200 + i * 80;
    fx(k.pic('mote', M, 5, 5), [[t, { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d * 0.8)} scale(.6)`, opacity: 0 }, 'ease-in'], [t + 320, { transform: `${k.T(Math.cos(a) * d * 0.4, Math.sin(a) * d * 0.32)} scale(1)`, opacity: 0.95 }, 'ease-in'], [t + 520, { transform: 'scale(.3)', opacity: 0 }]]);
  }
  // the song's ribbon brightens along its whole length while she sings
  if (alone) {
    for (let i = 0; i < 6; i++) {
      const t0 = 950 + i * 110, p = path(0.1 + i * 0.16), r = Math.round(rand() * 360);
      fx(k.pic('mote', p, 18, 18), [[t0, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t0 + 250, { transform: 'scale(1.1)', opacity: 0.75 }, eio], [t0 + 900, { transform: 'scale(1.5)', opacity: 0 }]]);
    }
  }

  // ── the spirits: 14, each beating its wings along the song, a trail of light left behind it
  const N = 14, FLY = 640;
  for (let i = 0; i < N; i++) {
    const t0 = 900 + i * 85, sz = 20 + rand() * 7, off = (rand() - 0.5) * 7, wob = rand() * 6;
    const ks = [];
    for (let j = 0, ms = t0; ms <= t0 + FLY; j++, ms += 40) {
      const f = Math.min(1, (ms - t0) / FLY), e = f * f * 0.35 + f * 0.65, p = path(e), q = path(Math.min(1, e + 0.02));
      const ang = Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI + 90;
      const sx = j % 2 ? 0.55 : 1.05, grow = 0.5 + 0.6 * Math.sin(Math.PI * Math.min(1, f * 1.1));
      const pp = [p[0] + off * (1 - f) + Math.sin(f * 9 + wob) * 1.5, p[1] - Math.sin(f * 6 + wob) * 1.2];
      ks.push([ms, { transform: `${at(pp)} rotate(${(ang * 0.35).toFixed(0)}deg) scale(${(sx * grow).toFixed(2)}, ${(0.9 + 0.2 * (1 - sx)).toFixed(2)})`, opacity: f < 0.1 ? f * 9 : f > 0.95 ? 0.4 : 1 }, 'linear']);
    }
    fx(k.pic(spirit, M, sz, sz), ks);
    for (let j = 0; j < 3; j++) { // motes left hanging on the song, fading
      const f = 0.2 + j * 0.28, e = f * f * 0.35 + f * 0.65, p = path(e), tm = t0 + FLY * f + 20;
      fx(k.pic('mote', M, 4 + rand() * 2, 4 + rand() * 2), [[tm, { transform: `${at(p)} scale(.4)`, opacity: 0 }, 'ease-out'], [tm + 120, { transform: `${at([p[0], p[1] + 1])} scale(1)`, opacity: 0.9 }], [tm + 650, { transform: `${at([p[0] + (rand() - 0.5) * 4, p[1] - 5])} scale(.4)`, opacity: 0 }]]);
    }
    // each spirit blooms where it arrives (the first at BEATS.impact)
    const ta = t0 + FLY - 30, r = Math.round(rand() * 360), a = rand() * 6.28, d = 5 + rand() * 9;
    const at2 = [T[0] + Math.cos(a) * d * 0.4, T[1] + Math.sin(a) * d * 0.3];
    fx(k.pic('star', at2, 18, 18), [[ta, { transform: `rotate(${r}deg) scale(.3)`, opacity: 0 }, 'ease-out'], [ta + 90, { transform: `rotate(${r + 20}deg) scale(1.3)`, opacity: 1 }, 'ease-out'], [ta + 460, { transform: `rotate(${r + 70}deg) scale(.6)`, opacity: 0 }]]);
    if (i % 3 === 0) fx(k.pic(ring, at2, 30, 30), [[ta + 20, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [ta + 90, { transform: 'scale(.4)', opacity: 0.85 }, 'ease-out'], [ta + 520, { transform: 'scale(1.1)', opacity: 0 }]]);
  }

  // ── where the song arrives: a warm light swelling (a heartbeat of brightness with each arrival), then rising motes
  const IM = 1500;
  const il = [[IM - 120, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 120, { transform: 'scale(1)', opacity: 0.85 }, eio]];
  for (let t = IM + 300, i = 0; t < 2600; t += 150, i++) il.push([t, { transform: `scale(${i % 2 ? 1.15 : 0.95})`, opacity: i % 2 ? 0.95 : 0.75 }, eio]);
  il.push([3300, { transform: 'scale(1.3)', opacity: 0 }]);
  fx(k.light('g-song', T, 70), il);
  fx(k.light('g-heal', T, 130, 80), [[IM + 200, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [IM + 700, { transform: 'scale(1)', opacity: 0.75 }, eio], [3000, { transform: 'scale(1.2)', opacity: 0 }]]);
  fx(k.pic(ring, T, 90, 90), [[IM + 80, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + 160, { transform: 'scale(.3)', opacity: 0.9 }, 'ease-out'], [IM + 900, { transform: 'scale(1.1)', opacity: 0 }]]);
  fx(k.pic(ring, T, 90, 90), [[IM + 500, { transform: 'scale(.1)', opacity: 0 }, 'ease-out'], [IM + 580, { transform: 'scale(.25)', opacity: 0.6 }, 'ease-out'], [IM + 1350, { transform: 'scale(.9)', opacity: 0 }]]);
  for (let i = 0; i < 14; i++) {
    const t = IM + 150 + i * 90, x = T[0] + (rand() - 0.5) * 34, y = T[1] + 6 + rand() * 8;
    fx(k.pic('mote', [x, y], 5 + rand() * 3, 5 + rand() * 3), [[t, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 200, { transform: `${k.T((rand() - 0.5) * 4, -6)} scale(1)`, opacity: 0.95 }], [Math.min(k.END, t + 1200), { transform: `${k.T((rand() - 0.5) * 12, -30 - rand() * 14)} scale(.5)`, opacity: 0 }]]);
  }
}
