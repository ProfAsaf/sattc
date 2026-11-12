// Riptide (a Trap, a defender: the wave takes whoever attacks and drags it back to the sea).
// The great wave rears over the beach, the knight setting his feet. A strike comes in from the
// shore side, a pale slash across the air, and where it reaches the wave (the lip, the curl's
// underside or the face) the water TAKES it: a jolt, a flash, a burst of foam and drops, the slash
// swallowed and dragged off along the wave's face as streaks. Then the wave crashes forward over
// itself and the backwash hauls everything toward it: the white water at his feet, the knight leaned
// back and slid toward the surf with his sword up; foam sheds off the lip. It holds, then lets go and
// the sea eases back; the knight and the wave settle as drawn.
//
// PLAN (drawing units 300 x 210, ms of the move). Role defender (a Trap: it blocks an attack), element
// water (as suggested). The wave only ever grows (scales up about its foot, tilts), so the drawing
// behind it is never uncovered.
//   0-450      BRACE (RELEASE 450): the wave rears (tilts back, swells), the knight sets his feet, the
//              light under the curl brightens, the backwash tightens.
//   each blow (k.blows, else two of its own at 1000 and 1750, on the lip and the face), snapped to the
//   nearest guard point:
//     -380     the strike comes in from the left on a flat arc: a head and a streak behind it
//     at       IMPACT: flash, ring, foam and drops flung back, the wave jolted, the knight shoved,
//              the blade flares; the strike is swallowed and streaks run off along the wave to its foot
//   first blow + 120 .. +700: the wave crashes forward, the knight is dragged toward it
//   last blow + 800: it lets go; back at rest by 3500.
// BEATS: release 450, impact (the first blow) 1000, settle 3500.
export const END = 3900;
export const BEATS = { release: 450, impact: 1000, settle: 3500 };
export const STILLS = [300, 700, 990, 1120, 1450, 2000, 2800, 3650];

export const textures = {
  drop: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226 + 29 * c, 250, 252, Math.min(1, c * 1.8)]; }],
  glint: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [240 + 15 * c, 255, 255, Math.min(1, c * c * 2.6)]; }],
  foam: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r), n = 0.8 + 0.2 * Math.sin(x * 19 + y * 7) * Math.cos(y * 15 - x * 9); return [240, 252, 250, Math.min(1, c * 1.6) * 0.85 * n]; }],
  mist: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [214, 240, 242, c * c * 0.55]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const S = k.spec, G = S.guard, FEET = S.feet, BASE = S.base;
  const wave = k.part('wave'), wash = k.part('wash'), knight = k.part('knight'), foam = k.part('foam');
  k.css('.g-sea { border-radius: 50%; background: radial-gradient(circle, rgba(244,255,252,.95), rgba(168,236,236,.55) 30%, rgba(100,200,214,.18) 58%, rgba(80,180,200,0) 72%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.5"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#d4f6f6" stroke-width="5" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#f4ffff" stroke-width="1.5"/>', 100, 100);
  // the strike: a bright crescent head pointing right, and a long tapering streak behind it
  const head = k.svg('<defs><filter id="b" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="1"/></filter></defs><path d="M3,2Q22,5 34,18Q18,13 3,34Q9,18 3,2Z" fill="#c8f2f2" filter="url(#b)"/><path d="M6,6Q22,9 31,18Q18,16 7,28Q11,17 6,6Z" fill="#f6ffff"/>', 36, 36);
  const streak = k.svg('<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#bfeeee" stop-opacity="0"/><stop offset="1" stop-color="#f4ffff" stop-opacity=".95"/></linearGradient></defs><path d="M0,7L80,1L80,13Z" fill="url(#g)"/>', 80, 14);
  const run = k.svg('<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#f4ffff" stop-opacity=".95"/><stop offset="1" stop-color="#bfeeee" stop-opacity="0"/></linearGradient></defs><path d="M0,1L60,5L0,7Z" fill="url(#g)"/>', 60, 8);

  // ── the blows: k.blows, else its own two; each snapped to the nearest guard point
  const raw = k.blows || [{ at: 1000, to: G[0] }, { at: 1750, to: G[2] }];
  const blows = raw.slice().sort((a, b) => a.at - b.at).slice(0, 4).map((b) => {
    let g = G[0], dm = 1e9;
    for (const q of G) { const d = Math.hypot(q[0] - b.to[0], q[1] - b.to[1]); if (d < dm) { dm = d; g = q; } }
    return { at: Math.max(520, Math.min(2100, Math.round(b.at))), g };
  }).filter((b, i, a) => i === 0 || b.at >= a[i - 1].at + 150);
  const first = blows[0].at, last = blows[blows.length - 1].at;
  const back = 3500, letGo = Math.min(last + 800, back - 900);

  // ── motion curves, sampled every 50 ms
  const lerp = (st, t) => { for (let i = 0; i < st.length - 1; i++) if (t <= st[i + 1][0]) { const f = (t - st[i][0]) / (st[i + 1][0] - st[i][0]), g = f * f * (3 - 2 * f); return st[i][1] + (st[i + 1][1] - st[i][1]) * g; } return st[st.length - 1][1]; };
  const waveRot = [[0, 0], [450, 1.5], [first, 1.7], [first + 130, 0.2], [first + 650, -3.3], [letGo, -3.1], [back, 0], [END, 0]];
  const waveSc = [[0, 1], [450, 1.03], [first, 1.035], [first + 650, 1.05], [letGo, 1.045], [back, 1], [END, 1]];
  const drag = [[0, 0], [first + 120, 0], [first + 700, 1], [letGo, 1], [back, 0], [END, 0]];
  const wv = [], kn = [], fo = [], ws = [];
  for (let t = 0; t <= back + 50; t += 50) {
    const tt = Math.min(t, back);
    let r = lerp(waveRot, tt), sc = lerp(waveSc, tt), d = lerp(drag, tt), shake = 0, nudge = 0;
    for (const b of blows) {
      const dt = tt - b.at;
      if (dt < 0) continue;
      const e = Math.exp(-dt / 260), c = Math.cos((2 * Math.PI * dt) / 380);
      r += 0.9 * e * c * (1 - Math.exp(-dt / 30));
      sc += 0.012 * e * c;
      shake += e * c * (1 - Math.exp(-dt / 25));
      nudge += Math.exp(-dt / 180) * (1 - Math.exp(-dt / 30));
    }
    const sway = d * Math.sin(tt / 230) * 0.7 * (tt < letGo ? 1 : Math.max(0, 1 - (tt - letGo) / 500));
    wv.push([t, { transform: `translate(${(7 * d * u).toFixed(1)}px, 0px) rotate(${r.toFixed(3)}deg) scale(${sc.toFixed(4)})` }, 'linear']);
    const dx = 16 * d + 1.8 * nudge + sway;
    kn.push([t, { transform: `translate(${(dx * u).toFixed(1)}px, ${((0.7 * d - 0.5 * shake) * u).toFixed(1)}px) rotate(${(9 * d + 1.2 * shake).toFixed(2)}deg) scale(1, ${(1 - 0.014 * Math.min(1, tt / 450) + 0.01 * shake).toFixed(4)})` }, 'linear']);
    fo.push([t, { transform: `translate(${((dx + 4 * d) * u).toFixed(1)}px, 0px) scale(${(1 + 0.22 * d).toFixed(3)}, 1)` }, 'linear']);
    ws.push([t, { transform: `translate(${(26 * d * u).toFixed(1)}px, 0px) scale(${(1 + 0.16 * d - 0.05 * Math.min(1, tt / 450) * (1 - d)).toFixed(3)}, ${(1 + 0.2 * d).toFixed(3)})` }, 'linear']);
  }
  for (const l of [wv, kn, fo, ws]) l[l.length - 1][1] = { ...l[l.length - 1][1] };
  act(wave, wv); act(knight, kn); act(foam, fo); act(wash, ws);

  // ── light: the sea's light under the curl brightening as the wave rears and crashes, the blade's glint
  fx(k.lightIn('g-sea', [150, 84], 170, 120), [[200, { transform: 'scale(.7)', opacity: 0 }, 'ease-out'], [700, { transform: 'scale(1)', opacity: 0.32 }, eio], [first + 600, { transform: 'scale(1.12)', opacity: 0.5 }, eio], [letGo, { transform: 'scale(1.05)', opacity: 0.35 }, eio], [back, { transform: 'scale(.8)', opacity: 0 }]]);
  // (the blade's glint rides with him as he is dragged: about 13 + 3 units right at the full drag)
  const bt = (t, sc, o, e) => [t, { transform: `${k.T(20 * lerp(drag, t), 2 * lerp(drag, t))} scale(${sc})`, opacity: o }, e];
  const bl = [bt(300, 0.5, 0, 'ease-out'), bt(520, 1, 0.6, eio)];
  for (const b of blows) bl.push(bt(b.at, 1.7, 1, 'ease-out'), bt(b.at + 300, 1.1, 0.6, eio));
  bl.push(bt(letGo, 1, 0.45, eio), bt(back - 200, 0.6, 0, eio));
  fx(k.light('g-sea', [S.blade[0], S.blade[1] + 6], 30), bl.filter((q, i) => i === 0 || q[0] > bl[i - 1][0]));

  // ── each blow
  blows.forEach((b, bi) => {
    const [gx, gy] = b.g, IM = b.at;
    // the strike's path: in from the shore side, a flat arc dropping onto the guard point
    const Sx = Math.min(-30, gx - 150), Sy = gy - 34 - bi * 8;
    const [X0, Y0] = k.P(Sx, Sy), [X1, Y1] = k.P(gx, gy);
    const ang = (Math.atan2(gy - Sy, gx - Sx) * 180) / Math.PI;
    const dx = X1 - X0, dy = Y1 - Y0, T0 = IM - 380;
    const at = (f, sc, o) => ({ transform: `translate(${(dx * f).toFixed(1)}px, ${(dy * f - Math.sin(Math.PI * f) * 5 * u).toFixed(1)}px) rotate(${ang.toFixed(1)}deg) scale(${sc})`, opacity: o });
    fx(k.pic(head, [Sx, Sy], 20, 20), [[T0, at(0, 0.6, 0), 'ease-out'], [T0 + 50, at(0.03, 0.9, 1), 'ease-in'], [IM - 20, at(1, 1.05, 1), 'ease-in'], [IM + 60, at(1, 0.5, 0)]]);
    fx(k.light('g-sea', [Sx, Sy], 26), [[T0, { transform: `${k.T(0, 0)} scale(.5)`, opacity: 0 }, 'ease-out'], [T0 + 60, { transform: `${k.T(0, 0)} scale(1)`, opacity: 0.7 }, 'ease-in'], [IM, { transform: `${k.T(gx - Sx, gy - Sy)} scale(1.1)`, opacity: 0.8 }], [IM + 80, { transform: `${k.T(gx - Sx, gy - Sy)} scale(1.4)`, opacity: 0 }]]);
    const len = Math.hypot(gx - Sx, gy - Sy);
    for (let i = 0; i < 3; i++) {
      const lag = 0.06 + i * 0.05;
      fx(k.pic(streak, [Sx, Sy], 40 - i * 8, 7 - i, { low: true }), [[T0, { ...at(0, 0.2, 0), transform: at(0, 0.2, 0).transform.replace('scale(0.2)', 'scale(.2, 1)') }, 'ease-out'], [T0 + 70, at(Math.max(0, lag * 0.5), 1, 0.85), 'ease-in'], [IM - 10, at(Math.max(0, 1 - lag * 0.4), 1, 0.7), 'ease-in'], [IM + 110, at(1, 0.3, 0)]]);
    }
    void len;

    // IMPACT: flash, ring, the blade's flare is above; foam and drops flung back toward the shore
    fx(k.light('g-sea', [gx, gy], 54), [[IM - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.2)', opacity: 1 }, eio], [IM + 230, { transform: 'scale(.95)', opacity: 0.55 }, eio], [IM + 600, { transform: 'scale(1.4)', opacity: 0 }]]);
    fx(k.pic(ring, [gx, gy], 34, 34), [[IM, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(.5)', opacity: 0.95 }], [IM + 560, { transform: 'scale(2.1)', opacity: 0 }]]);
    for (let i = 0; i < 9; i++) {
      const t = IM + 20 + i * 45, r = Math.round(rand() * 360), vx = -(8 + rand() * 20) * (rand() < 0.25 ? -0.5 : 1), vy = -(6 + rand() * 18), sz = 14 + rand() * 10;
      fx(k.pic('foam', [gx, gy], sz, sz, { lit: false }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 120, { transform: `${k.T(vx * 0.4, vy * 0.5)} rotate(${r + 20}deg) scale(1)`, opacity: 0.9 }],
        [t + 650, { transform: `${k.T(vx, vy + 10)} rotate(${r + 50}deg) scale(1.7)`, opacity: 0 }]]);
    }
    for (let i = 0; i < 14; i++) {
      const vx = -(10 + rand() * 30) * (rand() < 0.2 ? -0.4 : 1), up = 8 + rand() * 22, t0 = IM + rand() * 70, glint = i < 6;
      const sz = glint ? 3.5 + rand() * 2.5 : 2.2 + rand() * 2.6;
      const pt = (f, s, o) => ({ transform: `translate(${(vx * f * u).toFixed(1)}px, ${((-up * 4 * f * (1 - f) + 18 * f * f) * u).toFixed(1)}px) scale(${s})`, opacity: o });
      fx(k.pic(glint ? 'glint' : 'drop', [gx, gy], sz, sz), [[t0, pt(0, 0.6, 0), 'ease-out'], [t0 + 40, pt(0.05, 1, 1), 'linear'], [t0 + 250, pt(0.45, 1, 0.95), 'linear'], [t0 + 460, pt(0.8, 0.8, 0.7), 'linear'], [t0 + 640, pt(1, 0.5, 0)]]);
    }
    // swallowed: streaks run off along the wave's face to its foot, the way the knight is dragged
    const [fx0, fy0] = [BASE[0] - 70, BASE[1] - 50];
    for (let i = 0; i < 4; i++) {
      const t = IM + 70 + i * 55, ex = fx0 - gx + (rand() - 0.5) * 30, ey = fy0 - gy + (rand() - 0.5) * 20, a = (Math.atan2(ey, ex) * 180) / Math.PI;
      fx(k.pic(run, [gx, gy], 26 + rand() * 10, 3.4, { low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${a.toFixed(1)}deg) scale(.3, 1)`, opacity: 0 }, 'ease-out'], [t + 90, { transform: `${k.T(ex * 0.25, ey * 0.25)} rotate(${a.toFixed(1)}deg) scale(1, 1)`, opacity: 0.9 }, 'ease-in'], [t + 480, { transform: `${k.T(ex, ey)} rotate(${a.toFixed(1)}deg) scale(1.2, .7)`, opacity: 0 }]]);
    }
  });

  // ── the wave crashes (first blow + 120 .. + 700): foam sheds off the lip and the crest, mist falls inside the curl
  for (let i = 0; i < 12; i++) {
    const t = first + 100 + i * 70, r = Math.round(rand() * 360), x = 92 + i * 12 + (rand() - 0.5) * 8, y = 84 - Math.min(i, 6) * 4 + (i > 6 ? -(i - 6) * 7 : 0) - 4 + (rand() - 0.5) * 6;
    const vx = -(8 + rand() * 12), vy = 10 + rand() * 14;
    fx(k.pic('foam', [x, y], 13 + rand() * 6, 13 + rand() * 6, { lit: false }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 150, { transform: `${k.T(vx * 0.3, vy * 0.2)} rotate(${r + 20}deg) scale(1)`, opacity: 0.85 }], [t + 700, { transform: `${k.T(vx, vy)} rotate(${r + 60}deg) scale(1.6)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 6; i++) {
    const t = first + 250 + i * 150, x = 118 + rand() * 80, r = Math.round(rand() * 360);
    fx(k.picIn('mist', [x, 90 + rand() * 20], 40, 40, { lit: false }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 400, { transform: `${k.T(-4, 4)} rotate(${r + 15}deg) scale(1)`, opacity: 0.6 }], [t + 1400, { transform: `${k.T(-12, 12)} rotate(${r + 40}deg) scale(1.7)`, opacity: 0 }]]);
  }
  // the backwash at his feet: white water streaming toward the wave, then draining back
  for (let i = 0; i < 7; i++) {
    const t = first + 200 + i * 110, x = FEET[0] - 28 + i * 9, r = Math.round(rand() * 360);
    fx(k.picIn('foam', [x, FEET[1] + 1 + (rand() - 0.5) * 6], 16 + rand() * 8, 9, { lit: false }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 200, { transform: `${k.T(10, 0)} rotate(${r + 10}deg) scale(1)`, opacity: 0.8 }], [t + 900, { transform: `${k.T(38 + rand() * 12, 2)} rotate(${r + 40}deg) scale(1.4, .9)`, opacity: 0 }]]);
  }
  // the pull of the sea: a long ring running out across the shallows
  const R0 = [FEET[0] + 20, FEET[1] + 2];
  fx(k.picIn(ring, R0, 90, 90), [[first + 100, { transform: 'scale(1, .14) scale(.3)', opacity: 0 }, 'ease-out'], [first + 250, { transform: 'scale(1, .14) scale(.6)', opacity: 0.6 }], [first + 1300, { transform: 'scale(1, .14) scale(1.7)', opacity: 0 }]]);
}
