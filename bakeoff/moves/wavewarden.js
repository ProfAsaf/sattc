// Wavewarden: he takes a spear of water on his scallop shield.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: defender (Bodyguard:
// he stands between the attack and the little ones), element: water. Blows
// come as k.blows, else its own: two spears of water out of the left, at 1200
// and 2050, which strike the shield at its guard points.
//   0-450     the spear drawn on the shield (frozen mid-burst) drains away to
//             the left; he braces: leans in, the shell comes forward on its
//             hinge, the little ones behind him tuck in; bubbles stir.
//   1200      IMPACT (the first blow): a twisting spear streaks in (it arrives
//             in the 160 ms before each blow's time), bursts on the shield:
//             the shell jolts back into him and rings (damped), a pale flash
//             runs round its rim, a ring and a starburst of foam, drops fly
//             off along the shell, bubbles rise, silt kicks up at his tail;
//             he is shoved and rocks (a beat later), the fish flinch.
//   2050      the second blow, the same, from a little lower.
//   2600-3500 he holds, then eases; the spear as drawn re-forms (a flash and
//             a swell) where the burst was; everything at rest.
//   3700      at rest as drawn.
// Poses are sums of damped kicks, one per blow, sampled; so any blows work.
export const END = 4200;
export const BEATS = { release: 450, impact: 1200, settle: 3700 };
export const STILLS = [300, 1000, 1220, 1330, 1700, 2090, 2700, 3900];

export const textures = {
  drop: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226, 252, 252, Math.min(1, c * 2.2)]; }],
  foam: [48, 48, (x, y) => {
    const r = Math.hypot(x - 0.5, y - 0.5) * 2, n = 0.5 + 0.5 * Math.sin(x * 19 + y * 11) * Math.cos(y * 17 - x * 7);
    const c = Math.max(0, 1 - r * (0.85 + 0.3 * n)); return [232, 253, 250, Math.min(1, c * c * 1.5)];
  }],
  silt: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, n = 0.75 + 0.25 * Math.sin(x * 15 + y * 9) * Math.cos(y * 13 - x * 7); return [120, 168, 168, Math.max(0, 1 - r) * 0.55 * n]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const G = k.spec.guard;
  const BL = (k.blows || [{ at: 1200, to: G[0] }, { at: 2050, to: G[2] }]).slice().sort((a, b) => a.at - b.at);
  // each blow lands on the nearest guard point
  const snap = (to) => G.reduce((b, g) => (Math.hypot(g[0] - to[0], g[1] - to[1]) < Math.hypot(b[0] - to[0], b[1] - to[1]) ? g : b), G[0]);
  const HIT = BL.map((b, i) => ({ t: b.at, p: snap(b.to), s: i === 0 ? 1 : 0.85 }));
  const shield = k.part('shield'), man = k.part('man'), fish = k.part('fish'), spear = k.part('spear');
  const ANG = 14, ar = (ANG * Math.PI) / 180, dir = [Math.cos(ar), Math.sin(ar)]; // the way spears fly: from the left, a little downward

  k.css(`.g-sea { border-radius: 50%; background: radial-gradient(closest-side, rgba(238,255,253,.92), rgba(196,244,244,.42) 34%, rgba(150,225,232,.12) 64%, rgba(150,225,232,0) 100%); }
    .fx-copy.f-lit { filter: brightness(2.6) saturate(.5) drop-shadow(0 0 2px rgba(235,255,255,.95)) drop-shadow(0 0 6px rgba(190,245,250,.8)); }`);

  // ── poses as sums: the brace (0-450 in, 2600-3500 out) and a damped kick per blow
  const brace = (t) => (t < 450 ? sm(t / 450) : t < 2600 ? 1 : t < 3500 ? 1 - sm((t - 2600) / 900) : 0);
  const kick = (t, dly, a) => { let v = 0; for (const h of HIT) { const d = t - h.t - dly; if (d > 0) v += h.s * a * Math.exp(-d / 150) * Math.sin(d / 38); } return v; };
  const times = [];
  for (let t = 0; t <= 3700; t += 50) times.push(t);
  for (const h of HIT) for (let d = -20; d <= 520; d += 20) times.push(h.t + d);
  const grid = [...new Set(times.filter((t) => t >= 0 && t <= 3700).map(Math.round))].sort((a, b) => a - b);
  const sampled = (fn, rest) => [...grid.map((t) => [t, fn(t), 'linear']), [3800, rest]];
  const shieldPose = (t) => { const b = brace(t), kk = kick(t, 0, 1); return `${k.T(1.4 * b + 3.2 * kk, 0.4 * b + 0.9 * kk)} rotate(${(0.7 * b + 2.4 * kk).toFixed(2)}deg)`; };
  act(shield, sampled((t) => ({ transform: shieldPose(t) }), { transform: 'none' }));
  const fl = (t) => { let v = 0; for (const h of HIT) { const d = t - h.t; if (d > -10) v += h.s * 0.95 * Math.exp(-Math.max(0, d) / 130); } return Math.min(1, v); };
  act(k.copy('shield', 'f-lit'), sampled((t) => ({ transform: shieldPose(t), opacity: +(fl(t) * (t < 3000 ? 1 : 0)).toFixed(2) }), { transform: 'none', opacity: 0 }));
  act(man, sampled((t) => { const b = brace(t), kk = kick(t, 45, 1); return { transform: `${k.T(0.8 * b + 1.8 * kk, 0.5 * b + 0.5 * kk)} rotate(${(-0.7 * b - 1.1 * kk).toFixed(2)}deg)` }; }, { transform: 'none' }));
  act(fish, sampled((t) => { const b = brace(t), kk = kick(t, 110, 1); return { transform: `${k.T(1.3 * b + 1.2 * kk, -0.6 * b - 1.0 * Math.abs(kk))} rotate(${(1.1 * b + 1.6 * kk).toFixed(2)}deg)` }; }, { transform: 'none' }));

  // ── the spear as drawn: drains away to the left as he braces, re-forms at the end
  act(spear, [[0, { transform: 'none', opacity: 1 }, 'ease-in'], [420, { transform: `${k.T(-26, -9)} scale(.5, .8)`, opacity: 0 }], [3000, { transform: `${k.T(-26, -9)} scale(.5, .8)`, opacity: 0 }, 'ease-out'], [3500, { transform: 'scale(1.06)', opacity: 1 }, eio], [3800, { transform: 'none', opacity: 1 }]]);
  // drops of the drained spear stream off to the left, and bubbles stir as he braces
  for (let i = 0; i < 12; i++) {
    const t = 40 + i * 30, x = 84 + rand() * 20, y = 98 + rand() * 12;
    fx(k.pic('drop', [x, y], 3 + rand() * 2, 3 + rand() * 2), [[t, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [t + 70, { transform: 'scale(1)', opacity: 0.95 }, 'linear'], [t + 520, { transform: `${k.T(-30 - rand() * 30, -8 - rand() * 12)} scale(.5)`, opacity: 0 }]]);
  }
  const bub = k.svg('<circle cx="10" cy="10" r="7.4" fill="rgba(220,250,250,.14)" stroke="#e8fffd" stroke-width="1.5"/><circle cx="7.6" cy="7.4" r="1.7" fill="#fff" opacity=".9"/>', 20, 20);
  const bubbles = (P, t0, n, spread) => { for (let i = 0; i < n; i++) { const x = P[0] + (rand() - 0.5) * spread, t = t0 + rand() * 260, s = 2.6 + rand() * 3.4, rise = 26 + rand() * 40;
    fx(k.pic(bub, [x, P[1]], s, s), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 120, { transform: 'scale(1)', opacity: 0.9 }, 'linear'], [t + 900 + rand() * 500, { transform: `${k.T((rand() - 0.5) * 12, -rise)} scale(1.1)`, opacity: 0 }]]); } };
  bubbles([128, 138], 80, 7, 50);

  // ── the spear's streak: a body of water with two twisting strands, thin at the tail, bright at the head
  const L = 124;
  const streak = k.svg('<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c6f4f6" stop-opacity="0"/><stop offset=".6" stop-color="#e3fbf8" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity=".97"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs>' +
    '<g filter="url(#b)"><path d="M0,15 C30,14 70,9 118,5 L124,15 L118,25 C70,21 30,16 0,15Z" fill="url(#g)"/></g>' +
    `<path d="M0,15 ${Array.from({ length: 12 }, (_, i) => `L${(i + 1) * 10},${(15 - (i + 1) * 0.8 + Math.sin(i * 1.1) * (1 + i * 0.28)).toFixed(1)}`).join(' ')}" fill="none" stroke="#fff" stroke-width="1.2" opacity=".8" stroke-linecap="round"/>` +
    `<path d="M0,15 ${Array.from({ length: 12 }, (_, i) => `L${(i + 1) * 10},${(15 - (i + 1) * 0.8 - Math.sin(i * 1.1) * (1 + i * 0.28)).toFixed(1)}`).join(' ')}" fill="none" stroke="#e6fffd" stroke-width="1" opacity=".6" stroke-linecap="round"/>`, L, 30);
  const burstStar = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".6"/></filter></defs><g filter="url(#b)" fill="#f4fffe">' +
    Array.from({ length: 11 }, (_, i) => { const a = (-150 + i * 30 + (i % 2) * 6) * Math.PI / 180, l = i % 2 ? 15 : 26, w = i % 2 ? 3.2 : 4.4;
      return `<path d="M${30 + Math.cos(a + 1.57) * w},${30 + Math.sin(a + 1.57) * w}L${30 + Math.cos(a) * l},${30 + Math.sin(a) * l}L${30 + Math.cos(a - 1.57) * w},${30 + Math.sin(a - 1.57) * w}Z"/>`; }).join('') + '<circle cx="30" cy="30" r="5" fill="#fff"/></g>', 60, 60);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".8"/></filter></defs><circle cx="30" cy="30" r="25" fill="none" stroke="#effffe" stroke-width="3" filter="url(#b)"/>', 60, 60);

  HIT.forEach((h, n) => {
    const [px, py] = h.p, t = h.t, s = h.s;
    // the spear arrives: its head runs from far left along the line to the guard point, shrinking to nothing as it bursts
    const at = (f, sx, o) => ({ transform: `${k.T(-dir[0] * L * 1.5 * (1 - f) - dir[0] * (L / 2) * sx, -dir[1] * L * 1.5 * (1 - f) - dir[1] * (L / 2) * sx)} rotate(${ANG}deg) scale(${sx}, ${(0.8 + 0.5 * f).toFixed(2)})`, opacity: o });
    fx(k.pic(streak, [px, py], L, 30), [[t - 190, at(0, 0.7, 0), 'ease-in'], [t - 130, at(0.35, 1, 0.95), 'ease-in'], [t - 8, at(1, 1, 1), 'ease-out'], [t + 70, at(1, 0.4, 0.6)], [t + 160, at(1, 0.1, 0)]]);
    // the burst: a starburst and ring, light, foam
    fx(k.pic(burstStar, [px, py], 46 * s, 46 * s), [[t - 10, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [t + 30, { transform: 'scale(1) rotate(8deg)', opacity: 1 }, 'ease-out'], [t + 300, { transform: 'scale(1.5) rotate(16deg)', opacity: 0 }]]);
    fx(k.pic(ring, [px, py], 34, 34), [[t - 10, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 30, { transform: 'scale(.6)', opacity: 0.95 }], [t + 600, { transform: `scale(${(3.4 * s).toFixed(1)})`, opacity: 0 }]]);
    fx(k.light('g-sea', [px, py], 78 * s), [[t - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(1.1)', opacity: 1 }, eio], [t + 260, { transform: 'scale(1.2)', opacity: 0.55 }, eio], [t + 750, { transform: 'scale(1.5)', opacity: 0 }]]);
    // the shock runs over the sheltering ones: a faint pale ring behind
    fx(k.lightIn('g-sea', [190, 122], 90, 70), [[t + 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 150, { transform: 'scale(1)', opacity: 0.28 * s }, eio], [t + 700, { transform: 'scale(1.3)', opacity: 0 }]]);
    // drops thrown off along the shell and up, slowing in the water; foam billows
    for (let i = 0; i < 20; i++) {
      const a = rad(-205 + rand() * 250), d = 14 + rand() * 42, sz = 2 + rand() * 2.6, t0 = t + rand() * 50;
      const P = (f, sc, o) => { const e = 1 - (1 - f) * (1 - f); return { transform: `${k.T(Math.cos(a) * d * e, Math.sin(a) * d * e * 0.9 - 6 * f)} scale(${sc})`, opacity: o }; };
      fx(k.pic('drop', [px, py], sz, sz), [[t0, P(0, 0.5, 0), 'ease-out'], [t0 + 40, P(0.15, 1.1, 1), 'linear'], [t0 + 300, P(0.7, 1, 0.9), 'linear'], [t0 + 620 + rand() * 200, P(1, 0.4, 0)]]);
    }
    for (let i = 0; i < 7; i++) {
      const a = rad(-200 + (230 * i) / 6 + (rand() - 0.5) * 20), d = 10 + rand() * 16, sz = 9 + rand() * 7, t0 = t + 10 + rand() * 50;
      const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * d * f, Math.sin(a) * d * f)} scale(${sc})`, opacity: o });
      fx(k.pic('foam', [px, py], sz, sz), [[t0, P(0, 0.4, 0), 'ease-out'], [t0 + 80, P(0.4, 1, 0.9), 'ease-out'], [t0 + 340, P(0.9, 1.2, 0.6), 'ease-in'], [t0 + 650, P(1, 1.5, 0)]]);
    }
    // shards of the shattered spear skip off along the shell
    for (let i = 0; i < 4; i++) {
      const sgn = i % 2 ? 1 : -1, a = ANG + sgn * (40 + rand() * 35), d = 18 + rand() * 18, t0 = t + 10 + i * 12;
      const P = (f, sx, o) => ({ transform: `${k.T(Math.cos(rad(a)) * d * f, Math.sin(rad(a)) * d * f)} rotate(${a}deg) scale(${sx}, .8)`, opacity: o });
      fx(k.pic(streak, [px - Math.cos(rad(a)) * 7, py - Math.sin(rad(a)) * 7], 16, 4.5), [[t0, P(0, 0.3, 0), 'ease-out'], [t0 + 50, P(0.3, 1, 1), 'linear'], [t0 + 400, P(1, 0.5, 0)]]);
    }
    bubbles([px + 6, py + 8], t + 80, 5, 22);
    // silt kicked up at the seabed under his tail
    for (let i = 0; i < 3; i++) {
      const x = 150 + (rand() - 0.5) * 30, t0 = t + 90 + i * 70, sz = 20 + rand() * 12;
      fx(k.picIn('silt', [x, 188], sz, sz, { lit: false }), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 220, { transform: `${k.T((rand() - 0.5) * 8, -6)} scale(1)`, opacity: 0.55 * s }, 'linear'], [t0 + 1200, { transform: `${k.T((rand() - 0.5) * 12, -18)} scale(1.7)`, opacity: 0 }]]);
    }
  });
  // the spear re-forming at the end: a swell of light on the shield's face
  fx(k.light('g-sea', [108, 104], 56), [[3300, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [3560, { transform: 'scale(1.1)', opacity: 0.8 }, eio], [4050, { transform: 'scale(1.3)', opacity: 0 }]]);
}
const rad = (d) => (d * Math.PI) / 180;
