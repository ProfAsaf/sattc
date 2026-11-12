// Marisol, the Harbormistress: she throws up her lantern, and its light stands
// as a golden ward while the river's surges break on it.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: defender, element: water
// (suggestions kept: a Reach creature, a guard on the quay; the river is her tide).
//   0-700     the brace (BEATS.release 700): she crouches a hair, then plants
//             her feet and thrusts the lantern higher; its glow swells; a dome of
//             golden light unfurls round her from the lantern, rippling.
//   1000      (BEATS.impact) the first surge arrives. Each blow (k.blows, or alone
//             two surges of the river from her right) flies in as a crest of
//             water, hits the dome at the nearest `guard` point: a ripple runs
//             over the dome, a flash, a spray of droplets, and she is jolted
//             back with the arm kicking and the lantern flaring.
//   1800-3400 she holds, the dome thins; the lantern settles, the dome fades,
//             a last shimmer runs over it.
//   3400      at rest as drawn (the move ends at END).
//
// The contract (bakeoff/recipe.md): blows come as k.blows || her own (the
// river's surges); each one's flight starts 330 ms before its `at`, from the
// side it comes from, to its guard point; the jolt is away from it. Her body is
// one part swaying about her feet; the arm and lantern light ride on it and
// raise about the shoulder (a part about its pivot, carried by the body's
// motion, as field-medic does). All that flies is on the overlay.
export const END = 4000;
export const BEATS = { release: 700, impact: 1000, settle: 3400 };
export const STILLS = [250, 650, 900, 1050, 1250, 1600, 2400, 3700];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 236 + 19 * c * c, 190 + 65 * c * c, Math.min(1, c * c * 2.2)]; }],
  drop: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [214 + 41 * c, 244, 255, Math.min(1, c * 1.8)]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, sho = S.shoulder, feet = S.feet, [wx, wy, wrx, wry] = S.ward, lamp = S.lamp;
  const blows = (k.blows || S.blows).map((b) => {
    let G = S.guard[0], dd = 1e9;
    for (const g of S.guard) { const d = Math.hypot(g[0] - b.to[0], g[1] - b.to[1]); if (d < dd) { dd = d; G = g; } }
    return { at: b.at, G, from: G[0] >= wx ? 1 : -1 };
  });
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const ph = (t, a, b) => sm(cl((t - a) / (b - a), 0, 1));
  const f1 = (v) => +v.toFixed(2);

  k.css(`.g-gold { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,246,214,.95), rgba(255,218,140,.5) 25%, rgba(255,190,90,.14) 55%, rgba(255,170,60,0) 100%); }`);
  const domeUrl = k.svg(`<defs><radialGradient id="d" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe9b0" stop-opacity="0"/><stop offset=".7" stop-color="#ffd98a" stop-opacity=".07"/><stop offset=".93" stop-color="#ffe2a0" stop-opacity=".34"/><stop offset="1" stop-color="#fff0c8" stop-opacity=".55"/></radialGradient></defs><ellipse cx="${wrx + 3}" cy="${wry + 3}" rx="${wrx}" ry="${wry}" fill="url(#d)"/><ellipse cx="${wrx + 3}" cy="${wry + 3}" rx="${wrx}" ry="${wry}" fill="none" stroke="#ffd98a" stroke-width="3" opacity=".25"/><ellipse cx="${wrx + 3}" cy="${wry + 3}" rx="${wrx}" ry="${wry}" fill="none" stroke="#fff4d4" stroke-width="1"/>`, wrx * 2 + 6, wry * 2 + 6);
  const rippleUrl = k.svg(`<circle cx="16" cy="16" r="13" fill="none" stroke="#ffe6a8" stroke-width="3" opacity=".35"/><circle cx="16" cy="16" r="13" fill="none" stroke="#fffaf0" stroke-width="1.2"/>`, 32, 32);
  const crestUrl = k.svg(`<defs><linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8fbff"/><stop offset=".5" stop-color="#8ccfd8"/><stop offset="1" stop-color="#3c7f90"/></linearGradient></defs><path d="M2,14C4,6 10,2 18,2C23,2 26,5 28,9C25,7 22,7 20,9C23,10 24,12 23,14Z" fill="url(#w)"/><path d="M3,13C6,8 11,5 17,5" fill="none" stroke="#ffffff" stroke-width="1.2" opacity=".8"/><circle cx="21" cy="4" r="1.2" fill="#fff"/><circle cx="25" cy="7" r=".9" fill="#fff"/>`, 30, 16);

  // ── the body: crouch, plant, lean into the blows, jolted by each; carried by `carry` for the arm
  const jolt = (t) => { let j = 0; for (const b of blows) if (t >= b.at) { const e = (t - b.at) / 1000; j += -b.from * Math.exp(-e * 7) * Math.sin(e * 24 + 0.4) * 2.4 * Math.min(1, e * 30); } return j; };
  const kick = (t) => { let j = 0; for (const b of blows) if (t >= b.at) { const e = (t - b.at) / 1000; j += b.from * Math.exp(-e * 6) * Math.sin(e * 22) * 4 * Math.min(1, e * 30); } return j; };
  const hold = (t) => ph(t, 600, 900) * (1 - ph(t, 2900, 3400));
  const crouch = (t) => Math.sin(Math.PI * ph(t, 80, 560)) * (t < 560 ? 1 : 0); // a hair down before the thrust
  const body = (t) => ({ dx: jolt(t) * 0.9, th: jolt(t) * 0.5 - 1.0 * hold(t), sy: 1 - 0.018 * crouch(t) });
  const raise = (t) => 13 * ph(t, 420, 720) * (1 - ph(t, 2800, 3400)) + 2.2 * Math.sin(t / 170) * hold(t) * (1 - ph(t, 2500, 3100)) + kick(t) * 0.8;
  const carry = (p, th, o) => { const r = (th * Math.PI) / 180, vx = p[0] - o[0], vy = p[1] - o[1]; return [o[0] + vx * Math.cos(r) - vy * Math.sin(r), o[1] + vx * Math.sin(r) + vy * Math.cos(r)]; };
  const grid = [];
  for (let t = 0; t <= 3560; t += 40) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3700, { transform: 'none' }]];
  const bodyTf = (t) => { const b = body(t); return `${k.T(b.dx, 0)} rotate(${f1(b.th)}deg) scale(1, ${f1(b.sy)})`; };
  act(k.part('her'), sample((t) => ({ transform: bodyTf(t) })));
  act(k.part('ledger'), sample((t) => ({ transform: bodyTf(t) })));
  const armTf = (t) => {
    const b = body(t), sp = carry(sho, b.th, feet), rr = raise(t);
    return { transform: `${k.T(sp[0] - sho[0] + b.dx, sp[1] - sho[1])} rotate(${f1(b.th + rr)}deg)` };
  };
  act(k.part('arm'), sample(armTf));
  act(k.part('lamplight'), sample(armTf));
  // where the lantern is at t (the body's lean and the arm's raise carried): for its flare
  const lampAt = (t) => { const b = body(t), sp = carry(sho, b.th, feet), q = carry(lamp, raise(t), sho); return [q[0] + (sp[0] - sho[0]) + b.dx, q[1] + (sp[1] - sho[1])]; };
  const flareList = (size, pk) => {
    const L = [], P0 = lampAt(0);
    for (const t of grid.filter((x) => x >= 300 && x <= 3200)) {
      const p = lampAt(t);
      let o = 0.55 * ph(t, 300, 700) * (1 - ph(t, 2800, 3300));
      for (const b of blows) if (t >= b.at) o += 0.5 * Math.exp(-(t - b.at) / 260);
      L.push([t, { transform: `${k.T(p[0] - P0[0], p[1] - P0[1])} scale(${f1(0.7 + 0.5 * ph(t, 300, 700) + pk * o)})`, opacity: f1(cl(o, 0, 1)) }, 'linear']);
    }
    return L;
  };
  fx(k.light('g-gold', lampAt(0), 46), [[0, { opacity: 0, transform: 'scale(.6)' }, 'ease-out'], ...flareList(46, 0.25), [3400, { transform: 'scale(.7)', opacity: 0 }]]);

  // ── the ward: a dome of light unfurling from the lantern, breathing, ringing at each blow, fading
  const dl = [[300, { transform: 'scale(.3, .15)', opacity: 0 }, 'ease-out'], [700, { transform: 'scale(.82, .7)', opacity: 0.7 }, 'ease-out'], [900, { transform: 'scale(1.04)', opacity: 0.95 }, eio]];
  for (let t = 1000, i = 0; t < 2900; t += 130, i++) {
    let o = 0.7 + 0.1 * (i % 2);
    for (const b of blows) if (t >= b.at) o += 0.3 * Math.exp(-(t - b.at) / 200);
    dl.push([t, { transform: `scale(${i % 2 ? 1 : 1.015})`, opacity: f1(Math.min(1, o)) }, eio]);
  }
  dl.push([3300, { transform: 'scale(1)', opacity: 0.2 }, 'ease-in'], [3500, { transform: 'scale(1.04)', opacity: 0 }]);
  fx(k.pic(domeUrl, [wx, wy], wrx * 2 + 6, wry * 2 + 6), dl);
  fx(k.light('g-heal', [wx, wy + 10], 120, 130), [[400, { opacity: 0, transform: 'scale(.5)' }, 'ease-out'], [900, { opacity: 0.55, transform: 'scale(1)' }, eio], [2700, { opacity: 0.4, transform: 'scale(1)' }, eio], [3400, { opacity: 0, transform: 'scale(1.1)' }]]);

  // ── each blow: a crest of the river in flight, then on the dome a ripple, a flash, spray
  const FL = 330;
  blows.forEach((b, i) => {
    const [gx, gy] = b.G, sx = gx + b.from * 96, sy = gy - 16 - (i % 2) * 10, t0 = b.at - FL;
    const cx = (sx + gx) / 2, cy = Math.min(sy, gy) - 22 - (i % 2) * 6;
    const bz = (u) => { const q = 1 - u; return [q * q * sx + 2 * q * u * cx + u * u * gx, q * q * sy + 2 * q * u * cy + u * u * gy]; };
    const flip = b.from > 0 ? -1 : 1; // the crest faces the way it travels
    const at = (u, s, o) => { const p = bz(u); return { transform: `${k.T(p[0] - sx, p[1] - sy)} scale(${f1(flip * s)}, ${f1(s)}) rotate(${f1(flip * -28 * (1 - u))}deg)`, opacity: o }; };
    const run = (delay, size, src, o0, st) => {
      const L = [[t0 + delay, at(0, st * 0.5, 0), 'ease-in']];
      for (let m = 1; m <= 8; m++) { const u = m / 8; L.push([t0 + delay + Math.round(u * FL), at(u, st * (0.9 + 0.3 * u), o0), 'linear']); }
      L.push([b.at + delay * 0.4 + 120, at(1, st * 1.4, 0)]);
      return L;
    };
    fx(k.pic(crestUrl, [sx, sy], 26, 14, { lit: false }), run(0, 26, crestUrl, 1, 1));
    for (let j = 1; j <= 5; j++) fx(k.pic('drop', [sx, sy], 4 + (j % 2) * 2, 4 + (j % 2) * 2), run(j * 28, 4, 'drop', 0.85 - j * 0.1, 0.8));
    // the hit
    fx(k.light('g-warm', [gx, gy], 34), [[b.at - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [b.at + 40, { transform: 'scale(1.1)', opacity: 0.95 }, 'ease-out'], [b.at + 420, { transform: 'scale(.7)', opacity: 0 }]]);
    fx(k.pic(rippleUrl, [gx, gy], 34, 34), [[b.at, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [b.at + 60, { transform: 'scale(.5)', opacity: 1 }, 'ease-out'], [b.at + 650, { transform: 'scale(1.7)', opacity: 0 }]]);
    fx(k.pic(rippleUrl, [gx, gy], 22, 22), [[b.at + 90, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [b.at + 160, { transform: 'scale(.6)', opacity: 0.8 }, 'ease-out'], [b.at + 700, { transform: 'scale(1.9)', opacity: 0 }]]);
    for (let j = 0; j < 9; j++) {
      const a = (b.from > 0 ? 0 : Math.PI) + (rand() - 0.5) * 2.3 - 0.5 * b.from, d = 10 + rand() * 18, g = 6 + rand() * 6, up = 0.5 + rand() * 0.6;
      const sp = (f, s, o) => ({ transform: `${k.T(Math.cos(a) * d * f * 0.9 + b.from * 4 * f, Math.sin(a) * d * 0.4 * f - 16 * up * Math.sin(f * 2.1) + g * f * f)} scale(${s})`, opacity: o });
      fx(k.pic(j % 3 ? 'drop' : 'spark', [gx, gy], 4 + rand() * 2.5, 4 + rand() * 2.5), [[b.at + 10, sp(0, 0.5, 0), 'ease-out'], [b.at + 70, sp(0.3, 1, 1), 'ease-out'], [b.at + 330, sp(1, 0.9, 0.7), 'ease-in'], [b.at + 520, sp(1.2, 0.5, 0)]]);
    }
  });
}
