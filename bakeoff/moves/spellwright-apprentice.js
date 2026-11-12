// Spellwright Apprentice: she casts the runes out of the book, and they settle.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support (a creature
// whose gift is a spell: it makes the next spell stronger), element: arcane.
//   0-500     the book wakes: its light swells, the curl of runes over it
//             shivers and brightens; she rocks back a little (anticipation).
//   500-1150  she lifts her arm toward T and leans in; the curl lifts off the
//             page and stretches, more runes unwinding from the book, a glow
//             gathering at her fingertips.
//   1200      RELEASE (BEATS.release): she throws, a rush of runes (small
//             glyphs of light) flies from the book through her fingertips
//             (emit) and on, along an arc, to T; her sleeve's runes flare.
//   1800      IMPACT (BEATS.impact): the runes land at T: a flash, two rings
//             of light, a star, motes rising. Alone, T is her own sleeve:
//             they wind round the wrist and settle, the sleeve's runes flare
//             and a ring runs up her arm.
//   1900-3300 she follows through (arm lowering, body settling back), the
//             glow at T dims, motes drift up, the curl drifts back down onto
//             the page and fills in again.
//   3700      at rest as drawn (the move ends at END).
//
// The contract (bakeoff/recipe.md): the boon leaves her fingertip (emit) and
// goes to T = k.aim, else her own sleeve. She turns to T: mirrored about her
// feet if T is to her left, her arm swings to point at it (alone, up and out).
// Everything that flies or lands is on the overlay (k.pic / k.light).
export const END = 4200;
export const BEATS = { release: 1200, impact: 1800, settle: 3700 };
export const STILLS = [250, 700, 1100, 1300, 1550, 1900, 2600, 3900];

export const textures = {
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [214, 250, 252, Math.min(1, c * c * 1.5)]; }],
  star: [32, 32, (x, y) => { const dx = Math.abs(x - 0.5) * 2, dy = Math.abs(y - 0.5) * 2, c = Math.max(0, 1 - Math.min(dx * 6 + dy, dy * 6 + dx) * 0.9); return [226, 252, 255, Math.min(1, c * c * 1.6 + Math.max(0, 0.5 - Math.hypot(dx, dy)) * 1.2)]; }],
};

export function build(k) {
  const { act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  // (keyframes must rise strictly: nudge any that touch)
  const fx = (el, list) => { let last = -1; k.fx(el, list.slice().sort((a, b) => a[0] - b[0]).map((e) => { last = Math.max(last + 1, Math.min(e[0], k.END - 1)); return [last, ...e.slice(1)]; })); };
  const S = k.spec, E = S.emit, BK = S.book, SL = S.sleeve, SH = S.shoulder, FT = S.feet, IMPACT = 1800;
  const aimed = !!k.aim;
  const T = k.aim || SL;
  const left = aimed && T[0] < FT[0] - 6; // she turns to her left: mirrored about her feet
  const mx = (p) => (left ? [2 * FT[0] - p[0], p[1]] : p); // a point of hers, mirrored if she is
  const SHm = mx(SH), Em = mx(E);

  k.css(`.g-arc { border-radius: 50%; background: radial-gradient(closest-side, rgba(244,254,255,.95), rgba(176,236,244,.55) 28%, rgba(110,200,226,.18) 58%, rgba(90,180,220,0) 100%); }
    .fx-copy.f-arc { mix-blend-mode: plus-lighter; filter: brightness(1.35) saturate(1.15); }`);

  // a track of keys [ms, a, b, ...] read at any ms by easing between them
  const track = (keys) => (t) => {
    let i = keys.length - 1;
    while (i > 0 && keys[i][0] > t) i--;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const f = b[0] === a[0] ? 0 : sm(Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))));
    return a.slice(1).map((v, j) => v + (b[j + 1] - v) * f);
  };
  const grid = [];
  for (let t = 0; t <= 3690; t += 30) grid.push(t);

  // ── her: rocks back to gather, in on the throw, follows through, settles; the arm swings about the shoulder
  // turning (if T is to her left): a quick sliver about her feet at the start, held mirrored, back at the end
  const sx = (t) => (left ? 1 - 2 * sm(Math.min(1, t / 420)) + (t > 3000 ? 2 * sm(Math.min(1, (t - 3000) / 420)) : 0) : 1);
  const d = left ? -1 : 1;
  const lean = track([[0, 0], [380, -1.6 * d], [900, -2.6 * d], [1150, 1.5 * d], [1260, 3.2 * d], [1600, 2.2 * d], [2300, 1.2 * d], [3000, 0.4 * d], [3690, 0]]);
  const bob = track([[0, 0], [380, 0.6], [1100, 0.3], [1260, -0.4], [2000, 0], [3690, 0]]);
  const her = (t) => `translate(0px, ${(bob(t)[0] * u).toFixed(2)}px) rotate(${lean(t)[0].toFixed(2)}deg) scaleX(${Math.abs(sx(t)) < 0.04 ? (sx(t) < 0 ? -0.04 : 0.04) : sx(t).toFixed(3)})`;
  // the arm's angle: toward T (alone: up and out), in degrees about the shoulder
  let aimA = aimed ? (Math.atan2(T[1] - SHm[1], T[0] - SHm[0]) * 180) / Math.PI - ((Math.atan2(E[1] - SH[1], E[0] - SH[0]) * 180) / Math.PI) : -26;
  aimA = Math.max(-58, Math.min(52, ((aimA + 540) % 360) - 180));
  const arm = track([[0, 0], [380, 5], [900, aimA * 0.55 - 4], [1150, aimA * 0.7 - 7], [1260, aimA + 3], [1500, aimA * 0.9], [2100, aimA * 0.5], [2800, 6], [3250, -1.5], [3690, 0]]);
  const sample = (fn, rest) => [...grid.map((t) => [t, fn(t), 'linear']), [3700, rest]];
  const rest = { transform: 'translate(0px, 0px) rotate(0deg) scaleX(1)' };
  act(k.part('her'), sample((t) => ({ transform: her(t) }), rest));
  act(k.part('settled'), sample((t) => ({ transform: her(t) }), rest));
  // the arm: its pivot is the shoulder, her turn is about her feet: shift by (F-S)(1-sx) while turning, then
  // the swing is made in the unmirrored frame (inside the mirror)
  const sxc = (t) => (Math.abs(sx(t)) < 0.04 ? (sx(t) < 0 ? -0.04 : 0.04) : sx(t));
  const armT = (t) => `translate(${(left ? (FT[0] - SH[0]) * (1 - sx(t)) * u : 0).toFixed(2)}px, ${(bob(t)[0] * u).toFixed(2)}px) rotate(${lean(t)[0].toFixed(2)}deg) scaleX(${sxc(t).toFixed(3)}) rotate(${arm(t)[0].toFixed(2)}deg)`;
  const restArm = { transform: 'translate(0px, 0px) rotate(0deg) scaleX(1) rotate(0deg)' };
  act(k.part('arm'), sample((t) => ({ transform: armT(t) }), restArm));

  // where her fingertip is at time t (drawing units): the arm swung about the shoulder, her body leaning/mirrored
  const tip = (t) => {
    const a = (arm(t)[0] * Math.PI) / 180, vx = E[0] - SH[0], vy = E[1] - SH[1];
    let p = [SH[0] + vx * Math.cos(a) - vy * Math.sin(a), SH[1] + vx * Math.sin(a) + vy * Math.cos(a)];
    p = mx(p);
    const lr = (lean(t)[0] * Math.PI) / 180, qx = p[0] - FT[0], qy = p[1] - FT[1];
    return [FT[0] + qx * Math.cos(lr) - qy * Math.sin(lr), FT[1] + qx * Math.sin(lr) + qy * Math.cos(lr)];
  };
  const TIP = tip(1260);

  // ── the book wakes: its light swells, shivers, and dims as the runes leave it
  const bl = [[0, { transform: 'scale(.7)', opacity: 0 }, 'ease-out'], [420, { transform: 'scale(1)', opacity: 0.55 }]];
  for (let t = 560, i = 0; t < 1200; t += 130, i++) bl.push([t, { transform: `scale(${i % 2 ? 1.14 : 0.96})`, opacity: i % 2 ? 0.8 : 0.62 }, eio]);
  bl.push([1260, { transform: 'scale(1.5)', opacity: 0.95 }, 'ease-out'], [1700, { transform: 'scale(1.05)', opacity: 0.45 }, eio], [2600, { transform: 'scale(.8)', opacity: 0 }]);
  fx(k.light('g-arc', [BK[0], BK[1] - 2], 58), bl);

  // ── the curl of runes over the book: shivers, lifts and unwinds as the runes go, then drifts back down and fills in
  const curl = k.part('curl');
  act(curl, [[0, { transform: 'none', opacity: 1 }, eio], [250, { transform: 'translateY(0px) scale(1, 1)', opacity: 1 }, eio], [440, { transform: `rotate(-2deg) scale(1.03, 1.05)`, opacity: 1 }, eio],
    [700, { transform: `rotate(1.5deg) scale(1.06, 1.1)`, opacity: 1 }, eio], [1000, { transform: `translateY(${-5 * u}px) rotate(-1deg) scale(1.1, 1.2)`, opacity: 1 }, 'ease-in'],
    [1280, { transform: `translateY(${-12 * u}px) rotate(2deg) scale(1.18, 1.32)`, opacity: 0.08 }, 'ease-out'], [2300, { transform: `translateY(${-9 * u}px) rotate(0deg) scale(1.1, 1.2)`, opacity: 0.08 }, eio],
    [3300, { transform: 'translateY(0px) rotate(0deg) scale(1, 1)', opacity: 1 }, eio], [3700, { transform: 'none', opacity: 1 }]]);
  const curlHot = k.copy('curl', 'f-arc');
  act(curlHot, [[0, { transform: 'none', opacity: 0 }, eio], [440, { transform: `rotate(-2deg) scale(1.03, 1.05)`, opacity: 0.5 }, eio], [700, { transform: `rotate(1.5deg) scale(1.06, 1.1)`, opacity: 0.8 }, eio],
    [1000, { transform: `translateY(${-5 * u}px) rotate(-1deg) scale(1.1, 1.2)`, opacity: 0.9 }, 'ease-in'], [1280, { transform: `translateY(${-12 * u}px) rotate(2deg) scale(1.18, 1.32)`, opacity: 0 }]]);
  // the runes on her sleeve: they flare when the casting goes out (alone: when the runes settle on them)
  const flareAt = aimed ? 1260 : IMPACT;
  act(k.copy('settled', 'f-arc'), sample((t) => ({ transform: her(t), opacity: +track([[0, 0], [flareAt - 120, 0], [flareAt + 60, 1], [flareAt + 420, 0.55], [flareAt + 1100, 0.7], [flareAt + 1700, 0]])(t)[0].toFixed(2) }), { transform: 'translate(0px, 0px) rotate(0deg) scaleX(1)', opacity: 0 }));

  // ── glow at her fingertips while she gathers, bursting at the throw
  const tg = [[500, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(.9)', opacity: 0.75 }]];
  for (let t = 1000, i = 0; t < 1200; t += 100, i++) tg.push([t, { transform: `scale(${i % 2 ? 1.1 : 0.9})`, opacity: 0.85 }, eio]);
  tg.push([1270, { transform: 'scale(1.6)', opacity: 1 }, 'ease-out'], [1700, { transform: 'scale(.8)', opacity: 0.3 }, eio], [2100, { transform: 'scale(.4)', opacity: 0 }]);
  // (it follows her fingertip: its path is her tip's at each moment)
  const [P0x, P0y] = k.P(...tip(0));
  const follow = (list) => list.map(([t, f, e]) => { const [x, y] = k.P(...tip(t)); return [t, { ...f, transform: `translate(${(x - P0x).toFixed(1)}px, ${(y - P0y).toFixed(1)}px) ${f.transform}` }, e]; });
  fx(k.light('g-arc', tip(0), 22), follow(tg));
  // rune motes tumbling off the book toward her hand while she gathers
  for (let i = 0; i < 6; i++) {
    const t0 = 420 + i * 120, b = [BK[0] + (rand() - 0.5) * 18, BK[1] - 4 - rand() * 12], [bx, by] = k.P(...b);
    const pts = [0, 0.4, 0.75, 1].map((f) => { const h = tip(t0 + 120 + f * 500); return [b[0] + (h[0] - b[0]) * f + Math.sin(f * 5 + i) * 4, b[1] + (h[1] - b[1]) * f - Math.sin(f * 3.14) * 12]; });
    const kf = pts.map(([x, y], j) => { const [px, py] = k.P(x, y); return [t0 + j * 170, { transform: `translate(${(px - bx).toFixed(1)}px, ${(py - by).toFixed(1)}px) scale(${j === 3 ? 0.4 : 0.5 + j * 0.18})`, opacity: j === 0 ? 0 : j === 3 ? 0 : 0.85 }, 'ease-in-out']; });
    fx(k.pic('mote', b, 6, 6), kf);
  }

  // ── runes (glyphs of light): a rush from the book, through her fingertip, to T
  const glyph = [
    k.svg('<g fill="none" stroke="#effdfb" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4,10 L8,2 L12,10 M5.4,7.4 H10.6"/></g>', 16, 12),
    k.svg('<g fill="none" stroke="#effdfb" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><path d="M8,2 V10 M4,4 L8,6 L12,4 M4,8 L8,10"/></g>', 16, 12),
    k.svg('<g fill="none" stroke="#effdfb" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4,3 L12,3 L4,9 L12,9"/></g>', 16, 12),
    k.svg('<g fill="none" stroke="#effdfb" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="6" r="3"/><path d="M8,1 V3 M8,9 V11"/></g>', 16, 12),
  ];
  // the route: up from the book to her fingertip (as it is at the throw), then on over an arc to T
  const B0 = [BK[0], BK[1] - 8], C2 = [(TIP[0] + T[0]) / 2, Math.min(TIP[1], T[1]) - (aimed ? 20 : 10)];
  const route = (f, side) => {
    if (f < 0.4) { const g = f / 0.4, q = 1 - g, c = [B0[0] - 4, Math.min(B0[1], TIP[1]) - 14]; return [q * q * B0[0] + 2 * q * g * c[0] + g * g * TIP[0] + side * 3 * Math.sin(g * 3.14), q * q * B0[1] + 2 * q * g * c[1] + g * g * TIP[1]]; }
    const g = (f - 0.4) / 0.6, q = 1 - g;
    return [q * q * TIP[0] + 2 * q * g * C2[0] + g * g * T[0] + side * 4 * Math.sin(g * 3.14), q * q * TIP[1] + 2 * q * g * C2[1] + g * g * T[1]];
  };
  const [O0x, O0y] = k.P(...B0);
  const N = 15, FLY = 640;
  for (let i = 0; i < N; i++) {
    const t0 = 1180 + i * 38 + rand() * 20, side = (rand() - 0.5) * 2, g = glyph[i % 4], r0 = Math.round((rand() - 0.5) * 80);
    const at = (f, sc, o) => { const [x, y] = k.P(...route(f, side)); return { transform: `translate(${(x - O0x).toFixed(1)}px, ${(y - O0y).toFixed(1)}px) rotate(${r0 + Math.round(f * 160 * (i % 2 ? 1 : -1))}deg) scale(${sc})`, opacity: o }; };
    const kf = [[t0, at(0, 0.5, 0), 'ease-out'], [t0 + 60, at(0.06, 0.8, 1)]];
    for (const f of [0.25, 0.4, 0.55, 0.7, 0.85]) kf.push([t0 + 60 + f * FLY, at(f, 1 + 0.12 * Math.sin(f * 9 + i), 1), 'linear']);
    kf.push([t0 + 60 + FLY, at(1, 1.1, 0.95), 'ease-out'], [t0 + 60 + FLY + 380, at(1, 1.6, 0)]);
    fx(k.pic(g, B0, 13, 10), kf);
    // a faint trail of light behind each (a mote, a hair later)
    const kt = kf.map(([t, f2, e]) => [t + 70, { ...f2, transform: f2.transform.replace(/rotate\([^)]*\)/, 'rotate(0deg)').replace(/scale\([^)]*\)/, 'scale(.7)'), opacity: +(f2.opacity * 0.5).toFixed(2) }, e]);
    fx(k.pic('mote', B0, 7, 7), kt);
  }

  // ── where they land (impact): a flash, rings, a star, motes rising; alone they settle on her sleeve
  const landT = IMPACT, cT = aimed ? T : SL;
  const ig = [[landT - 80, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [landT + 60, { transform: 'scale(1.2)', opacity: 1 }]];
  for (let t = landT + 220, i = 0; t < 2500; t += 130, i++) ig.push([t, { transform: `scale(${i % 2 ? 1.08 : 0.92})`, opacity: i % 2 ? 0.85 : 0.65 }, eio]);
  ig.push([3000, { transform: 'scale(.6)', opacity: 0 }]);
  fx(k.light('g-arc', cT, aimed ? 60 : 36), ig);
  fx(k.pic('star', cT, 40, 40), [[landT - 40, { transform: 'rotate(0deg) scale(.2)', opacity: 0 }, 'ease-out'], [landT + 70, { transform: 'rotate(20deg) scale(1)', opacity: 1 }], [landT + 420, { transform: 'rotate(50deg) scale(.5)', opacity: 0 }]]);
  const ring = k.svg('<circle cx="20" cy="20" r="17" fill="none" stroke="#d6f6fa" stroke-width="1.6"/><circle cx="20" cy="20" r="13" fill="none" stroke="#a6e4ec" stroke-width=".8" opacity=".6"/>', 40, 40);
  for (let i = 0; i < 2; i++) fx(k.pic(ring, cT, 40, 40), [[landT + i * 200, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [landT + 100 + i * 200, { transform: 'scale(.5)', opacity: 0.95 }, 'ease-out'], [landT + 800 + i * 200, { transform: `scale(${aimed ? 2.1 : 1.4})`, opacity: 0 }]]);
  for (let i = 0; i < 9; i++) {
    const a = rand() * 6.283, dist = 8 + rand() * 18, t = landT + 20 + rand() * 120, up = 10 + rand() * 20;
    fx(k.pic('mote', cT, 5 + rand() * 3, 5 + rand() * 3), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 160, { transform: `${k.T(Math.cos(a) * dist * 0.6, Math.sin(a) * dist * 0.4 - 4)} scale(1)`, opacity: 1 }, 'ease-out'],
      [t + 1100 + rand() * 500, { transform: `${k.T(Math.cos(a) * dist, Math.sin(a) * dist * 0.4 - up)} scale(.4)`, opacity: 0 }]]);
  }
  if (!aimed) {
    // settling on the sleeve: a few runes wind round the wrist and stay, then dissolve into the drawn ones
    const sp = [[-7, 2], [0, -3], [-9, -6], [-3, -9], [4, -7]];
    sp.forEach(([dx, dy], i) => {
      const t = landT + i * 70;
      fx(k.pic(glyph[(i + 1) % 4], [SL[0] + dx + 2, SL[1] + dy + 3], 7, 5.2), [[t, { transform: `${k.T(18 - i * 2, 2)} rotate(60deg) scale(1.4)`, opacity: 0 }, 'ease-out'], [t + 220, { transform: 'translate(0px, 0px) rotate(0deg) scale(1)', opacity: 1 }, eio], [2600, { transform: 'translate(0px, 0px) rotate(0deg) scale(1)', opacity: 0.8 }, eio], [3100, { transform: 'translate(0px, 0px) rotate(0deg) scale(1)', opacity: 0 }]]);
    });
    fx(k.pic(ring, [SL[0] + 2, SL[1] + 3], 22, 22), [[landT + 80, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [landT + 260, { transform: 'scale(.9)', opacity: 0.8 }], [landT + 800, { transform: 'scale(1.5)', opacity: 0 }]]);
  } else {
    // aimed: a few runes stay circling at T a while, then fade
    for (let i = 0; i < 4; i++) {
      const a0 = i * 1.57, t = landT + 120 + i * 60, g = glyph[i % 4];
      const orb = (ph, sc, o) => ({ transform: `${k.T(Math.cos(a0 + ph) * 10, Math.sin(a0 + ph) * 5)} rotate(${Math.round(ph * 60)}deg) scale(${sc})`, opacity: o });
      fx(k.pic(g, T, 8, 6), [[t, orb(0, 0.4, 0), 'ease-out'], [t + 200, orb(0.8, 1, 1), 'linear'], [t + 700, orb(2.4, 1, 0.9), 'linear'], [t + 1300, orb(4.2, 0.8, 0)]]);
    }
  }
  // her sleeve and the book: the follow-through glow, light spilling on the cave floor near her
  fx(k.light('g-arc', [112, 140], 70), [[1200, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [1350, { transform: 'scale(1)', opacity: 0.35 }], [2200, { transform: 'scale(1.1)', opacity: 0.2 }, eio], [3000, { transform: 'scale(.8)', opacity: 0 }]]);
}
