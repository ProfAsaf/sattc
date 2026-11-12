// Aurelia, the Lightkeeper: she gathers the Spirits into her lantern, throws her arm out and sends them streaming
// to a friend, where they circle and bless it, and the lantern is lit again.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support (changed from the suggested defender: her text is
// Spirits and boosting them, and the picture is a gift of light), element spirit.
//   0-1000    gather: she draws the lantern back (the arm pulls back, the lantern swings behind it, the cloak
//             settles), Spirits peel off from round the lantern and stream into it; it swells, a warm spill of
//             light on her breastplate.
//   1150      RELEASE: the arm throws out toward T (rays burst from the lantern, a flare), nine Spirits stream
//             out of the lantern along arcs to T, motes trailing; the cloak flares behind, the halo gives its
//             light away (dims).
//   1750      IMPACT at T: a burst of light, two rings, a column of dawn; the Spirits settle and circle round
//             T, motes rise.
//   2200-3500 follow-through: the arm lowers back with the lantern swinging, the halo is lit again, the cloak
//             sways to rest; the Spirits fade up out of the light. At rest as drawn from 3500 (END 4200).
// Aimed: T = k.aim || [228, 134]. The arm is turned (about the shoulder, clamped) to point at T; the Spirits leave
// from where the lantern is at the release, and fly, circle and bless at T on the overlay.
import { mul, rot, scl, app, curve, kit } from './_fx.js';
export const END = 4200;
export const BEATS = { release: 1150, impact: 1750, settle: 3500 };
export const STILLS = [1000, 1250, 1500, 1700, 1900, 2100, 2500, 2900];
export const textures = {
  mote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 238, 176 + 60 * c, Math.min(1, c * c * c * 2.4)]; }],
  star: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); const ax = Math.abs(x - 0.5) * 2, ay = Math.abs(y - 0.5) * 2, ray = Math.max(0, 1 - Math.min(ax, ay) * 9) * Math.max(0, 1 - Math.max(ax, ay)); return [255, 240, 190 + 60 * c * c, Math.min(1, c * c * c * 1.6 + ray * 0.85)]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  k.css('.g-lamp { border-radius: 50%; background: radial-gradient(circle, rgba(255,251,230,.95), rgba(255,228,150,.5) 32%, rgba(255,204,112,.18) 56%, rgba(255,190,90,0) 72%); }');
  const S = k.spec, SH = S.shoulder, HD = S.hand, E0 = S.emit;
  const T = k.aim || [228, 134];

  // ── the arm turns to its target (about the shoulder; at rest it points 19 degrees right of up)
  const a0 = (Math.atan2(HD[0] - SH[0], SH[1] - HD[1]) * 180) / Math.PI;
  const aT = (Math.atan2(T[0] - SH[0], SH[1] - T[1]) * 180) / Math.PI;
  const d = Math.max(-80, Math.min(70, ((aT - a0 + 540) % 360) - 180));
  const sg = Math.sign(d) || 1;
  const arm = curve([[0, 0], [260, 0], [820, -9 * sg, 'in'], [1020, -12 * sg, 'out'], [1230, d, 'out'], [1360, d + 7 * sg], [1650, d - 1 * sg], [2250, d], [3350, 0], [3500, 0]]);
  const sw = curve([[0, 0], [300, 0], [820, 5], [1020, 7], [1260, -16], [1460, 8], [1720, -4], [2050, 2], [2300, 2], [2700, 6], [3050, 4], [3330, -3], [3500, 0]]);
  const cloak = curve([[0, 0], [500, 0], [900, 1.2], [1250, 4.5], [1700, -2], [2300, 2.5], [2900, -1.2], [3500, 0]]);
  const halo = curve([[0, 1], [500, 1], [1000, 1.12], [1150, 1.25], [1350, 0.4], [3000, 0.4], [3500, 1]]);
  const Wa = (t) => rot(arm(t), SH[0], SH[1]);
  const Wl = (t) => mul(Wa(t), rot(sw(t), HD[0], HD[1]));
  const Wh = (t) => mul(Wl(t), scl(halo(t), halo(t), E0[0], E0[1]));
  h.drive(k.part('arm'), SH, Wa, 3500);
  h.drive(k.part('lantern'), SH, Wl, 3500);
  h.drive(k.part('halo'), SH, Wh, 3500, 50, (t) => Math.min(1, 0.45 + 0.55 * Math.max(0, Math.min(1, halo(t) > 0.9 ? 1 : (halo(t) - 0.4) / 0.5))));
  h.drive(k.part('cloak'), S.cloak, (t) => rot(cloak(t), S.cloak[0], S.cloak[1]), 3500);
  const L = (t) => app(Wl(t), E0); // where the lantern's heart is
  const E1 = L(BEATS.release);

  // ── the lantern swells, flares, gives its light away, and is lit again (effects ride it)
  h.ride(k.picIn('star', E0, 30, 30), E0, Wl, [[0, 0.3, 0], [500, 0.5, 0], [1000, 1.2, 0.8], [1150, 2.3, 1], [1320, 1.7, 0.95], [1800, 1, 0.5], [2600, 0.55, 0.1], [3100, 0.4, 0], [3300, 1.2, 0.5], [3500, 0.6, 0], [3501, 0.6, 0]]);
  h.ride(k.lightIn('g-lamp', E0, 80, 80), E0, Wl, [[300, 0.3, 0], [1000, 0.9, 0.7], [1160, 1.5, 1], [1500, 1.1, 0.7], [2400, 0.8, 0.35], [3000, 0.8, 0.5], [3300, 1.1, 0.5], [3499, 0.5, 0]]);
  const rays = k.svg('<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff6d8" stop-opacity=".95"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></linearGradient></defs>' +
    Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * 360 + (i % 2) * 6, w = i % 3 ? 3.2 : 5.2, l = i % 2 ? 44 : 60; return `<path transform="translate(60 60) rotate(${a})" d="M2,${-w / 2}L${l},0L2,${w / 2}Z" fill="url(#g)"/>`; }).join(''), 120, 120);
  h.ride(k.picIn(rays, E0, 120, 120), E0, Wl, [[1000, 0.3, 0], [1150, 1, 0.95], [1450, 1.35, 0.5], [1800, 1.6, 0]]);
  // the warm spill of light on her
  fx(k.lightIn('g-lamp', [140, 108], 62, 62), [[500, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [1050, { transform: 'scale(1)', opacity: 0.5 }, eio], [1200, { transform: 'scale(1.15)', opacity: 0.7 }, 'ease-out'], [2100, { transform: 'scale(1)', opacity: 0.3 }, eio], [3000, { transform: 'scale(.8)', opacity: 0 }]]);

  // ── a Spirit: a small winged figure, painted once
  const spirit = k.svg('<defs><filter id="b" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>' +
    '<g id="s"><path d="M13.6,10Q8,4 1,2.5Q3.8,7.5 5.6,9.6Q9,11.8 13.6,12.4Z"/><path d="M16.4,10Q22,4 29,2.5Q26.2,7.5 24.4,9.6Q21,11.8 16.4,12.4Z"/><circle cx="15" cy="7.4" r="3.1"/><path d="M12.4,10L17.6,10L15,21.5Z"/></g>' +
    '<use href="#s" fill="#ffe9a8" filter="url(#b)"/><use href="#s" fill="#fffcf0"/>', 30, 24);
  // a Spirit flying along `pos` (f in 0..1 -> [x, y]) between t0 and t1, its wings beating
  const flap = (t) => 0.62 + 0.38 * Math.cos((t / 170) * Math.PI * 2);
  const flight = (el, M, pos, t0, t1, scaleFn, opFn, pace = (f) => f * f * 0.5 + f * 0.5) => {
    const ks = [];
    for (let t = t0; ; t += 40) {
      const tt = Math.min(t, t1), f = (tt - t0) / (t1 - t0), [x, y] = pos(pace(f)), s = scaleFn(f);
      ks.push([tt, { transform: `${k.T(x - M[0], y - M[1])} scale(${(s * flap(tt)).toFixed(3)}, ${s.toFixed(3)})`, opacity: +opFn(f).toFixed(3) }, 'linear']);
      if (tt >= t1) break;
    }
    fx(el, ks);
  };
  const lerp = (A, B) => (f) => [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f];

  // ── gather: Spirits peel off from round the lantern and stream into it
  S.spirits.forEach((P, i) => {
    const t0 = 150 + i * 85, t1 = 860 + i * 18, sz = [17, 14, 16, 18, 15, 14, 13, 11, 10][i];
    // the drawn Spirit leaves its place the moment its copy takes off, and is back in it as the move ends
    const orig = k.part('spirit' + i), tb = 3000 + i * 40;
    k.act(orig, [[0, { opacity: 1 }], [t0, { opacity: 1 }], [t0 + 1, { opacity: 0 }], [tb, { opacity: 0 }, eio], [3500, { opacity: 1 }]]);
    const swirl = (f) => { const q = lerp(P, L(t0 + (t1 - t0) * f))(f); const b = Math.sin(f * Math.PI) * (i % 2 ? 7 : -7); return [q[0] + b * 0.6, q[1] - b * 0.4]; };
    flight(k.picIn(spirit, P, sz, sz * 0.8), P, swirl, t0, t1, (f) => 0.9 - 0.55 * f * f, (f) => (f > 0.8 ? (1 - f) / 0.2 : 1), (f) => f * f * (3 - 2 * f));
    h.fly(k.picIn('mote', P, 5, 5), P, (f) => swirl(Math.max(0, f - 0.12)), t0 + 60, t1 + 30, (f) => 1 - 0.5 * f, (f) => (f < 0.1 ? f * 8 : 0.9 * (1 - f * 0.6)), 0, 0, 50, (f) => f * f * (3 - 2 * f));
  });
  // motes drawn in from all round
  for (let i = 0; i < 8; i++) {
    const t0 = 200 + i * 90 + rand() * 30, dur = 520 + rand() * 160, a = rand() * Math.PI * 2, r0 = 24 + rand() * 30, sz = 3 + rand() * 3;
    const P = [E0[0] + Math.cos(a) * r0, E0[1] + Math.sin(a) * r0 * 0.8];
    h.fly(k.picIn('mote', P, sz, sz), P, (f) => lerp(P, L(t0 + dur * f))(f), t0, t0 + dur, (f) => 0.5 + 0.9 * Math.sin(Math.PI * f), (f) => (f < 0.12 || f > 0.88 ? Math.min(f, 1 - f) * 8 : 1), 0, 0, 50, (f) => f * f * (3 - 2 * f));
  }

  // ── RELEASE (1150): nine Spirits stream from the lantern along arcs to T
  const REL = BEATS.release, IM = BEATS.impact;
  const Ti = [], flock = 9;
  for (let i = 0; i < flock; i++) {
    const a = (i / flock) * Math.PI * 2 + 0.4, r = 9 + (i % 3) * 7;
    Ti.push([T[0] + Math.cos(a) * r, T[1] + Math.sin(a) * r * 0.7 - 4]);
  }
  const dist = Math.hypot(T[0] - E1[0], T[1] - E1[1]);
  for (let i = 0; i < flock; i++) {
    const t0 = REL + i * 55, t1 = IM + i * 55, side = (i % 2 ? 1 : -1) * (6 + (i % 4) * 5), sz = [17, 15, 19, 16, 14, 18, 15, 16, 14][i];
    const bz0 = h.arcPath(E1, Ti[i], 14 + (i % 3) * 14 + dist * 0.08);
    const bz = (f) => { const p = bz0(f); return [p[0], p[1] + side * Math.sin(Math.PI * f)]; };
    // out of the lantern, over to T, then circling and rising there, fading by ~3000
    const ks = [];
    for (let t = t0; t <= t1; t += 40) {
      const f = (t - t0) / (t1 - t0), pace = f * f * 0.5 + f * 0.5, [x, y] = bz(pace), s = (0.35 + 0.7 * Math.min(1, f * 1.6)) * (sz / 17);
      ks.push([t, { transform: `${k.T(x - E1[0], y - E1[1])} scale(${(s * flap(t)).toFixed(3)}, ${s.toFixed(3)})`, opacity: f < 0.08 ? f / 0.08 : 1 }, 'linear']);
    }
    const lap = 1150 + i * 20, ci = 0.7 + 0.6 * ((i * 37) % 10) / 10;
    for (let t = t1 + 40; t <= t1 + lap; t += 40) {
      const f = (t - t1) / lap, an = i * 0.7 + f * Math.PI * 2 * (i % 2 ? 1 : -1) * 0.9, rr = (10 + (i % 3) * 6) * (0.6 + 0.6 * f);
      const x = T[0] + Math.cos(an) * rr, y = T[1] + Math.sin(an) * rr * 0.55 - 6 - f * 20 - 4 * Math.sin(f * 9 + i), s = (sz / 17) * (1.05 - 0.2 * f) * ci * 1.1;
      ks.push([t, { transform: `${k.T(x - E1[0], y - E1[1])} scale(${(s * flap(t)).toFixed(3)}, ${s.toFixed(3)})`, opacity: f > 0.55 ? Math.max(0, 1 - (f - 0.55) / 0.45) : 1 }, 'linear']);
    }
    fx(k.pic(spirit, E1, sz, sz * 0.8), ks);
    // each Spirit's own small light, riding with it
    const gl = ks.map(([t, v]) => [t, { transform: v.transform.replace(/scale\([^)]*\)/, `scale(${(0.7 + 0.5 * (sz / 17)).toFixed(2)})`), opacity: +(v.opacity * 0.7).toFixed(2) }, 'linear']);
    fx(k.lightIn('g-lamp', E1, 22, 22, { }), gl);
    // a trail of motes behind it
    for (let j = 0; j < 2; j++) {
      const q0 = t0 + 70 + j * 55, q1 = t1 + 120 + j * 55, off = (rand() - 0.5) * 7;
      h.fly(k.pic('mote', E1, 3.5 + rand() * 2.5, 3.5 + rand() * 2), E1, (f) => { const p = bz(Math.min(1, f)); return [p[0] + off * Math.sin(f * 5), p[1] + off * 0.6 + f * 3]; }, q0, q1, (f) => 1.1 - 0.6 * f, (f) => (f < 0.1 ? f * 8 : 0.85 * (1 - f * f)), 0, 0, 50, (f) => f * f * 0.5 + f * 0.5);
    }
  }

  // ── IMPACT (1750): a burst at T, a column of dawn, rings, motes rising
  const ring = h.ring;
  const fl = [[IM - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [IM + 260, { transform: 'scale(1.9)', opacity: 0.65 }]];
  for (let t = IM + 450, i = 0; t < IM + 1500; t += 160, i++) fl.push([t, { transform: `scale(${i % 2 ? 1.55 : 1.3})`, opacity: i % 2 ? 0.55 : 0.42 }, eio]);
  fl.push([IM + 1900, { transform: 'scale(1)', opacity: 0 }]);
  fx(k.light('g-lamp', [T[0], T[1] - 4], 64), fl);
  fx(k.light('g-lamp', T, 22), [[IM - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 30, { transform: 'scale(1.6)', opacity: 1 }], [IM + 220, { transform: 'scale(2.6)', opacity: 0 }]]);
  fx(k.pic('star', T, 36, 36), [[IM - 20, { transform: 'scale(.2) rotate(0deg)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(1.3) rotate(30deg)', opacity: 1 }, 'ease-out'], [IM + 700, { transform: 'scale(.7) rotate(80deg)', opacity: 0 }]]);
  fx(k.pic(ring, [T[0], T[1] + 3], 60, 60), [[IM, { transform: 'scale(.15, .1)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(.4, .25)', opacity: 0.95 }, 'ease-out'], [IM + 600, { transform: 'scale(1.1, .62)', opacity: 0 }]]);
  fx(k.pic(ring, [T[0], T[1] + 3], 60, 60), [[IM + 140, { transform: 'scale(.1, .06)', opacity: 0 }, 'ease-out'], [IM + 200, { transform: 'scale(.3, .18)', opacity: 0.6 }, 'ease-out'], [IM + 800, { transform: 'scale(.85, .5)', opacity: 0 }]]);
  const col = k.svg('<defs><linearGradient id="c" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff4cc" stop-opacity=".95"/><stop offset=".5" stop-color="#ffe8a8" stop-opacity=".4"/><stop offset="1" stop-color="#ffe0a0" stop-opacity="0"/></linearGradient><filter id="b" x="-50%" y="0" width="200%" height="100%"><feGaussianBlur stdDeviation="2.2"/></filter></defs><path d="M3,0H17L21,80H-1Z" fill="url(#c)" filter="url(#b)" transform="translate(2 0)"/>', 24, 82);
  fx(k.pic(col, [T[0], T[1] + 4], 24, 82, { base: true }), [[IM, { transform: 'scale(.3, .05)', opacity: 0 }, 'ease-out'], [IM + 220, { transform: 'scale(1.1, 1.05)', opacity: 0.9 }, 'ease-out'], [IM + 600, { transform: 'scale(1, 1)', opacity: 0.8 }, eio], [IM + 1200, { transform: 'scale(1.15, 1.1)', opacity: 0.5 }, eio], [IM + 1700, { transform: 'scale(.6, 1.2)', opacity: 0 }]]);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + rand() * 0.4, dd = 10 + rand() * 24, t = IM + rand() * 60, life = 900 + rand() * 800, sz = 3 + rand() * 3.5, spin = (i % 2 ? 1 : -1) * 0.6;
    const px = (f) => Math.cos(a + spin * f) * dd * (0.3 + f), py = (f) => Math.sin(a + spin * f) * dd * 0.6 * (0.3 + f) - 24 * f;
    fx(k.pic('mote', T, sz, sz), [0, 0.2, 0.6, 1].map((f, j) => [t + life * f, { transform: `${k.T(px(f), py(f) - 2)} scale(${(1.1 - 0.6 * f).toFixed(2)})`, opacity: j === 0 || j === 3 ? 0 : 1 }, j ? 'linear' : 'ease-out']));
  }
  // the light the Spirits leave behind, a slow bloom, lifting
  fx(k.light('g-heal', [T[0], T[1] - 8], 56, 40), [[IM + 150, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [IM + 500, { transform: 'scale(1)', opacity: 0.8 }, eio], [IM + 1300, { transform: `${k.T(0, -6)} scale(1.2)`, opacity: 0.5 }, eio], [IM + 2000, { transform: `${k.T(0, -12)} scale(1.4)`, opacity: 0 }]]);
}
