// Kindly Undertaker: the gentle old man among his coffins, his lantern warming toward you.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support (he gains you life when your
// creatures die), element light (the suggestion: the lantern's soft white-violet light is his gift).
//   0-500     ANTICIPATION: he bows his head, the lantern arm dips back; the tape sways.
//   300-1100  GATHER: his lantern lifts on its arm, swelling; pale souls (motes) drift up from the
//             coffins on either side and spiral in to the lantern; a violet light swells round it.
//   1100      RELEASE: the lantern flares; three orbs of soft light leave it, along arcs, to T
//             (k.aim, else the coffins to his right); if T is behind him his tape arm lifts too.
//   1500      IMPACT/bloom at T: a ring spreads, a flare, motes of light rise and settle.
//   1500-2800 he tips his hat (head nods), the lantern lowers, the light dims, motes thin out.
//   2800-3600 arm, head and tape return; at rest as drawn by 3600 (END 4200).
// BEATS: release 1100, impact 1500, settle 3600.
export const END = 4200;
export const BEATS = { release: 1100, impact: 1500, settle: 3600 };
export const STILLS = [300, 750, 1050, 1250, 1550, 1900, 2600, 3800];

export const textures = {
  orb: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226 + 29 * c, 210 + 45 * c * c, 255, Math.min(1, c * c * 2.4)]; }],
  mote: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [236, 224, 255, Math.min(1, c * c * 3)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const arm = k.part('arm'), lamp = k.part('lamp'), head = k.part('head'), glint = k.part('glint'), tapearm = k.part('tapearm'), tape = k.part('tape');
  const S = k.spec, E = S.emit, [sx, sy] = S.shoulder, [tx, ty] = S.tapeShoulder, [hx, hy] = S.tapeHand;
  const T = k.aim || S.coffins[1];
  const behind = T[0] > sx + 10; // T lies behind his back (he faces left)
  k.css('.g-soul { border-radius: 50%; background: radial-gradient(circle, rgba(250,244,255,.95), rgba(214,184,255,.55) 30%, rgba(160,110,255,.22) 56%, rgba(130,80,255,0) 72%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><ellipse cx="50" cy="25" rx="44" ry="20" fill="none" stroke="#cfb4ff" stroke-width="3.2" filter="url(#b)"/><ellipse cx="50" cy="25" rx="44" ry="20" fill="none" stroke="#f4ecff" stroke-width="1.1"/>', 100, 50);

  // ── the lantern arm (about the shoulder): dips, lifts, holds, lowers; the lamp's glass and light ride on it
  const A = [[0, 0], [300, -7], [1100, 34], [1500, 30], [2300, 36], [2800, 8], [3600, 0]];
  const rotPt = ([x, y], deg) => { const a = (deg * Math.PI) / 180, dx = x - sx, dy = y - sy; return [sx + dx * Math.cos(a) - dy * Math.sin(a), sy + dx * Math.sin(a) + dy * Math.cos(a)]; };
  const armKeys = A.map(([t, d], i) => [t, { transform: `rotate(${d}deg)` }, i === 0 ? 'ease-in-out' : eio]);
  act(arm, armKeys);
  act(lamp, armKeys);
  const lampTf = (deg, s = 1, o = 1) => { const p = rotPt(E, deg); return { transform: `${k.T(p[0] - E[0], p[1] - E[1])} scale(${s})`, opacity: o }; };
  // the lantern's own light follows the arm and swells
  fx(k.lightIn('g-soul', E, 56, 56), [[200, lampTf(0, 0.6, 0), 'ease-out'], [700, lampTf(18, 1, 0.7), eio], [1100, lampTf(34, 1.5, 1), 'ease-out'], [1500, lampTf(30, 1.25, 0.8), eio],
    [2300, lampTf(36, 1.1, 0.55), eio], [2800, lampTf(8, 0.8, 0.2), eio], [3300, lampTf(0, 0.6, 0)]]);
  fx(k.lightIn('g-soul', E, 120, 90), [[300, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [1100, { transform: 'scale(1)', opacity: 0.45 }, 'ease-out'], [2000, { transform: 'scale(1.1)', opacity: 0.3 }, eio], [3200, { transform: 'scale(.8)', opacity: 0 }]]);

  // ── head: bows in, lifts to watch, tips his hat at the end
  const hd = (d) => ({ transform: `rotate(${d}deg)` });
  const hk = [[0, hd(0), eio], [450, hd(6), eio], [1000, hd(-3), eio], [1500, hd(-4), eio], [2000, hd(2), eio], [2500, hd(9), eio], [3000, hd(8), eio], [3600, hd(0)]];
  act(head, hk);
  act(glint, hk);

  // ── the tape arm and the tape: sways with the lantern's lift; reaches toward T if T is behind him
  const tp = (d) => ({ transform: `rotate(${d}deg)` });
  act(tapearm, [[0, tp(0), eio], [300, tp(4), eio], [1000, tp(behind ? -34 : 8), eio], [1800, tp(behind ? -28 : 5), eio], [2800, tp(2), eio], [3600, tp(0)]]);
  act(tape, [[0, tp(0), eio], [300, tp(-4), eio], [700, tp(7), eio], [1100, tp(-8), eio], [1500, tp(6), eio], [2000, tp(-4), eio], [2600, tp(3), eio], [3100, tp(-1), eio], [3600, tp(0)]]);

  // ── gather: pale souls rise from the coffins either side and spiral in to the lantern (it rides the arm)
  const srcs = [[40, 140], [62, 128], [24, 150], [84, 140], [200, 130], [226, 138], [180, 128], [250, 140], [72, 160], [210, 156]];
  srcs.forEach(([x, y], i) => {
    const t0 = 200 + i * 70, life = 650 + rand() * 250, side = i % 2 ? 1 : -1;
    const end = rotPt(E, 26);
    const pts = k.arc([0, 0], [(end[0] - x) * 0.3 + side * 16, (end[1] - y) * 0.9 - 16], [end[0] - x, end[1] - y], 6, (t) => t * t * (3 - 2 * t));
    const sz = 3 + rand() * 2.5;
    fx(k.pic('mote', [x, y], sz, sz), [[t0 - 1, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'],
      ...pts.map(([px, py], j) => [Math.round(t0 + life * j / 5), { transform: `${k.T(px, py)} scale(${(1 - 0.5 * j / 5 + (j === 0 ? -0.5 : 0.2)).toFixed(2)})`, opacity: j === 0 ? 0 : j === 5 ? 0 : 0.95 }, j < 2 ? 'ease-out' : eio])]);
  });
  // a spot of light on the glass, flaring at the release
  fx(k.pic('orb', E, 30, 30), [[500, lampTf(10, 0.3, 0), 'ease-out'], [900, lampTf(26, 0.8, 0.7), eio], [1100, lampTf(34, 1.7, 1), 'ease-out'], [1350, lampTf(32, 1.1, 0.7), eio], [2000, lampTf(36, 0.7, 0.3), eio], [2700, lampTf(10, 0.3, 0)]]);

  // ── release: three orbs along arcs from the lantern (raised) to T, on the overlay
  const L = rotPt(E, 34);
  const C = [(L[0] + T[0]) / 2, Math.min(L[1], T[1]) - 24];
  const bz = (t) => { const q = 1 - t; return [q * q * L[0] + 2 * q * t * C[0] + t * t * T[0], q * q * L[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const [X0, Y0] = k.P(...L);
  for (let i = 0; i < 3; i++) {
    const t0 = 1100 + i * 70, dur = 400, off = (i - 1) * 4;
    const at = (f, s, o) => { const [x, y] = k.P(...bz(f)); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + off * Math.sin(Math.PI * f) * u).toFixed(1)}px) scale(${s})`, opacity: o }; };
    fx(k.pic('orb', L, 16 - i * 2, 16 - i * 2), [[t0, at(0, 0.5, 0), 'ease-in'], [t0 + 60, at(0.2, 1.1, 1), 'linear'], [t0 + dur * 0.6, at(0.6, 1.2, 1), 'linear'], [t0 + dur, at(1, 1, 0.9), 'ease-out'], [t0 + dur + 120, at(1, 1.8, 0)]]);
    for (let j = 0; j < 4; j++) {
      const f = 0.12 + j * 0.2, ts = Math.round(t0 + dur * f);
      fx(k.pic('mote', L, 5, 5), [[ts, at(f, 0.5, 0), 'ease-out'], [ts + 40, at(f, 1, 0.9)], [ts + 260, at(f, 0.3, 0)]]);
    }
  }

  // ── impact (1500): a bloom of soft light at T, a ring, motes rising
  const IM = 1500;
  fx(k.light('g-soul', T, 70), [[IM - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [IM + 500, { transform: 'scale(1.2)', opacity: 0.55 }, eio], [IM + 1500, { transform: 'scale(.8)', opacity: 0 }]]);
  fx(k.light('g-heal spirit', T, 46, 46, { low: true }), [[IM, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [IM + 250, { transform: 'scale(1)', opacity: 0.9 }, eio], [IM + 1400, { transform: 'scale(1.2)', opacity: 0 }]]);
  for (const [d, w, o] of [[0, 90, 0.95], [150, 70, 0.7]]) {
    fx(k.pic(ring, T, w, w / 2), [[IM + d - 1, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + d + 40, { transform: 'scale(.3)', opacity: o }, 'ease-out'], [IM + d + 700, { transform: 'scale(1.1)', opacity: 0 }]]);
  }
  for (let i = 0; i < 13; i++) {
    const dx = (rand() - 0.5) * 60, t0 = IM + 60 + rand() * 700, life = 900 + rand() * 600, sz = 2.5 + rand() * 3;
    const pts = k.arc([0, 0], [dx * 0.6 + (rand() - 0.5) * 16, -26], [dx * 0.8 + (rand() - 0.5) * 20, -56 - rand() * 14], 5);
    fx(k.pic('mote', [T[0] + dx * 0.4, T[1] + 6 + rand() * 10], sz, sz), [[t0 - 1, { transform: `${k.T(0, 0)} scale(.3)`, opacity: 0 }, 'ease-out'],
      ...pts.map(([x, y], j) => [Math.round(t0 + life * j / 5), { transform: `${k.T(x, y)} scale(${1 - 0.45 * j / 5})`, opacity: j === 0 ? 0 : j === 5 ? 0 : 0.9 }, 'ease-out'])]);
  }
}
