// Kiss of Night (a Trick, a support: a creature you control gets Venom and Drain: the boon is the kiss). The
// hooded woman breathes in and brings her pale hand to her lips; the violet moths drawn in the picture are
// pulled in toward the hand, circling, and vanish into it as the palm fills with light. Then she blows the
// kiss: the hand sweeps out toward T, flicking open, and a swarm of moths pours off the palm, wheeling away
// on curving paths to T, shedding violet dust and beating their wings, while she leans after them and the
// moon swells. At T they close round it, circling, a shadow gathering and a violet ring spreading as it is
// touched by the night, then break up into dust. The moths drawn in the picture come back to where they were
// (rising out of the dust, beating), her hand settles, and everything is as drawn.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support (the spell gives a creature Venom and Drain),
// element shadow (as suggested). T = k.aim, else the dead tree on the moor (`tree`), so alone the moths
// settle on the tree. The hand sweeps toward T (the arm turned up to 25 degrees); the moths leave the palm
// (`emit`) for T. Everything that flies or lands is on the overlay (k.pic, k.light), since T may be on
// another card; the moths of the picture are parts, which cannot leave it.
//   0-1000   GATHER: she inhales, leans back; the hand rises to her lips; the picture's moths are drawn in to
//            the palm and fade into it; the palm fills with light.
//   1100     RELEASE: the hand sweeps out, she leans after it; moths pour off the palm for T on curving paths.
//   1700     IMPACT: the first moths arrive: a flash, a ring, a gathering shadow; the moths circle T.
//   1700-2800 the moths circle and break up into dust; the shadow and glow die away.
//   2300-3700 the moths of the picture rise back to where they were; the hand and woman ease to rest.
// BEATS: release 1100, impact 1700, settle 3700.
export const END = 4300;
export const BEATS = { release: 1100, impact: 1700, settle: 3700 };
export const STILLS = [350, 800, 1100, 1350, 1750, 2200, 3000, 3900];

export const textures = {
  dust: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [196 + 40 * c, 160 + 60 * c, 255, Math.min(1, c * c * 2.2)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const S = k.spec, E = S.emit, SH = S.shoulder, W = S.wrist;
  const lady = k.part('lady'), sleeve = k.part('sleeve'), hand = k.part('hand'), moon = k.part('moon');
  const moths = S.moths.map((_, i) => k.part(`moth${i}`));
  const tidy = (l) => l.filter((q, i) => i === 0 || q[0] > l[i - 1][0]);
  const REL = BEATS.release, IM = BEATS.impact, back = BEATS.settle;
  const T = k.aim || S.tree;

  const wing = '<defs><radialGradient id="w" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f1e6ff"/><stop offset=".45" stop-color="#b98cff"/><stop offset="1" stop-color="#6a3fc0"/></radialGradient><filter id="b" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.1"/></filter></defs>';
  const mothSvg = k.svg(wing + '<g filter="url(#b)" opacity=".55"><ellipse cx="8.6" cy="10" rx="8" ry="5.6" transform="rotate(-28 8.6 10)" fill="#9b6bff"/><ellipse cx="21.4" cy="10" rx="8" ry="5.6" transform="rotate(28 21.4 10)" fill="#9b6bff"/></g>' +
    '<g fill="url(#w)"><ellipse cx="8.6" cy="10" rx="8" ry="5.6" transform="rotate(-28 8.6 10)"/><ellipse cx="21.4" cy="10" rx="8" ry="5.6" transform="rotate(28 21.4 10)"/><ellipse cx="10" cy="17" rx="5" ry="3.4" transform="rotate(26 10 17)"/><ellipse cx="20" cy="17" rx="5" ry="3.4" transform="rotate(-26 20 17)"/></g>' +
    '<g fill="#1a1028"><circle cx="7.4" cy="9.4" r="1.5"/><circle cx="22.6" cy="9.4" r="1.5"/><ellipse cx="15" cy="12.5" rx="1.2" ry="6.2"/></g><path d="M14.4,6.6Q12.4,3 10.6,2.4M15.6,6.6Q17.6,3 19.4,2.4" fill="none" stroke="#1a1028" stroke-width=".7" stroke-linecap="round"/>', 30, 24);
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#9b6bff" stroke-width="6" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#e7d7ff" stroke-width="1.4"/>', 100, 100);

  // ── the arm: toward T for the blow (up to 25 degrees off the line it was drawn on)
  const rest = Math.atan2(-36, 29);
  let da = ((Math.atan2(T[1] - SH[1], T[0] - SH[0]) - rest) * 180) / Math.PI;
  da = Math.max(-25, Math.min(25, ((da + 540) % 360) - 180));
  const wx = ((W[0] - SH[0]) * u).toFixed(1), wy = ((W[1] - SH[1]) * u).toFixed(1);
  const HA = (a, s, b) => ({ transform: `rotate(${a}deg) scale(${s}) translate(${wx}px, ${wy}px) rotate(${b}deg) translate(${-wx}px, ${-wy}px)` });
  const SA = (a, s) => ({ transform: `rotate(${a}deg) scale(${s})` });
  const arm = [[0, 0, 1, 0, eio], [450, -12, 1.08, 8, eio], [900, -20, 1.15, 12, eio], [REL - 60, -21, 1.15, 14, 'ease-in'], [REL + 140, da.toFixed(1), 1.1, -26, 'ease-out'], [1500, (da + 3).toFixed(1), 1.08, -18, eio], [2100, (da * 0.7).toFixed(1), 1.04, -10, eio], [2900, da * 0.2, 1.0, -2, eio], [back, 0, 1, 0, eio]];
  act(hand, tidy(arm.map(([t, a, s, b, e]) => [t, HA(+a, s, b), e])));
  act(sleeve, tidy(arm.map(([t, a, s, , e]) => [t, SA(+a, s), e])));

  // ── the woman: inhales and leans back, leans after the kiss, eases back (about her feet)
  const L = (r, sx, sy) => ({ transform: `rotate(${r}deg) scale(${sx}, ${sy})` });
  act(lady, tidy([[0, L(0, 1, 1), eio], [550, L(-0.6, 1.003, 1.007), eio], [REL - 60, L(-0.9, 1.004, 1.01), 'ease-in'], [REL + 220, L(1.3, 1, 1), 'ease-out'], [1600, L(0.9, 1, 1), eio], [2500, L(0.3, 1, 1), eio], [back, L(0, 1, 1), eio]]));
  // the moon swells as the night is given
  act(moon, tidy([[0, { transform: 'scale(1)' }, eio], [REL, { transform: 'scale(1)' }, 'ease-out'], [IM + 100, { transform: 'scale(1.05)' }, eio], [2500, { transform: 'scale(1.02)' }, eio], [back, { transform: 'scale(1)' }]]));

  // ── the moths of the picture: drawn in toward the palm, circling, and gone into it; they come back where they were
  S.moths.forEach(([mx, my], i) => {
    const tg = 520 + i * 55, dxp = E[0] - mx, dyp = E[1] - my, a = Math.atan2(dyp, dxp), sd = i % 2 ? 1 : -1;
    const px = -Math.sin(a) * sd, py = Math.cos(a) * sd;
    const P = (f, r, sc, o, bend) => ({ transform: `${k.T(dxp * f + px * bend, dyp * f + py * bend)} rotate(${r}deg) scale(${sc})`, opacity: o });
    const back0 = 2300 + i * 60;
    act(moths[i], tidy([[0, P(0, 0, 1, 1, 0), eio], [Math.max(120, tg - 400), P(0, sd * -6, 1.04, 1, 0), eio], [tg, P(0.35, sd * 40, 0.95, 1, 8), eio], [REL - 100, P(0.82, sd * 160, 0.7, 0.9, 5), 'ease-in'], [REL + 60, P(0.97, sd * 300, 0.3, 0, 0), 'ease-out'], [back0 - 1, P(0.97, sd * 300, 0.3, 0, 0), eio],
      [back0, P(0.1, -sd * 20, 0.5, 0, 0), 'ease-out'], [back0 + 380, P(0.04, -sd * 10, 0.9, 0.9, -2), eio], [back0 + 700, P(0, sd * 4, 1.04, 1, 0), eio], [back0 + 950, P(0, 0, 1, 1, 0)]]));
  });

  // ── light: the palm filling as the moths are drawn in, flaring as the kiss is blown; the moon's glow swelling
  fx(k.light('g-violet', E, 36), tidy([[400, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(1)', opacity: 0.7 }, 'ease-in'], [REL + 100, { transform: 'scale(1.7)', opacity: 1 }, eio], [1600, { transform: 'scale(1)', opacity: 0.5 }, eio], [2300, { transform: 'scale(.6)', opacity: 0 }]]));
  fx(k.lightIn('g-violet', [226, 50], 130, 100), tidy([[REL, { transform: 'scale(.8)', opacity: 0 }, 'ease-out'], [IM + 100, { transform: 'scale(1)', opacity: 0.4 }, eio], [2600, { transform: 'scale(1.05)', opacity: 0.15 }, eio], [back, { transform: 'scale(.9)', opacity: 0 }]]));
  // a few motes drawn into the palm
  for (let i = 0; i < 8; i++) {
    const a = rand() * Math.PI * 2, r0 = 12 + rand() * 18, X = E[0] + Math.cos(a) * r0, Y = E[1] + Math.sin(a) * r0 * 0.8, t0 = 300 + i * 80, sz = 3 + rand() * 3;
    fx(k.pic('dust', [X, Y], sz, sz), [[t0, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 120, { transform: `${k.T((E[0] - X) * 0.1, (E[1] - Y) * 0.1)} scale(1)`, opacity: 0.9 }, 'ease-in'], [t0 + 480, { transform: `${k.T(E[0] - X, E[1] - Y)} scale(.4)`, opacity: 0 }]]);
  }

  // ── the swarm (RELEASE to IMPACT and on): moths pour off the palm for T on curving paths, then circle it and break up
  const dx = T[0] - E[0], dy = T[1] - E[1], dist = Math.hypot(dx, dy) || 1, nx = -dy / dist, ny = dx / dist;
  const N = 10;
  for (let i = 0; i < N; i++) {
    const t0 = REL + i * 55 + rand() * 20, D = 560 + rand() * 120, side = (i % 2 ? 1 : -1) * (14 + rand() * 18), th0 = rand() * Math.PI * 2, orR = 8 + rand() * 8;
    const Tm = [T[0] + Math.cos(th0) * orR, T[1] + Math.sin(th0) * orR * 0.7];
    const C = [(E[0] + Tm[0]) / 2 + nx * side, (E[1] + Tm[1]) / 2 + ny * side - 6];
    const bz = (t) => { const q = 1 - t; return [q * q * E[0] + 2 * q * t * C[0] + t * t * Tm[0], q * q * E[1] + 2 * q * t * C[1] + t * t * Tm[1]]; };
    const head = (t) => { const q = 1 - t, hx = 2 * q * (C[0] - E[0]) + 2 * t * (Tm[0] - C[0]), hy = 2 * q * (C[1] - E[1]) + 2 * t * (Tm[1] - C[1]); return (Math.atan2(hy, hx) * 180) / Math.PI + 90; };
    const sz = 0.9 + rand() * 0.35, fl = (j) => (j % 2 ? 0.45 : 1);
    const kf = (pt, r, j, o, s = sz) => ({ transform: `${k.T(pt[0] - E[0], pt[1] - E[1])} rotate(${r.toFixed(0)}deg) scale(${(fl(j) * s).toFixed(2)}, ${s.toFixed(2)})`, opacity: o });
    const list = [[t0, kf(E, head(0), 0, 0, 0.4), 'ease-out']];
    const steps = 7;
    for (let j = 1; j <= steps; j++) { const f = j / steps; list.push([t0 + f * D, kf(bz(f), head(f), j, j === 1 ? 0.95 : 0.92), 'linear']); }
    // circling T, then breaking up into dust
    const ta = t0 + D;
    for (let j = 1; j <= 4; j++) {
      const th = th0 + j * 1.5, pp = [T[0] + Math.cos(th) * orR, T[1] + Math.sin(th) * orR * 0.7];
      list.push([ta + j * 115, kf(pp, (th * 180) / Math.PI + 180, j + steps, 0.9), eio]);
    }
    list.push([ta + 700, kf([T[0] + Math.cos(th0 + 7) * orR * 1.6, T[1] - 8], 0, 0, 0, 1.15), 'ease-in']);
    fx(k.pic(mothSvg, E, 15, 12), tidy(list));
    // the dust it sheds along its way
    for (let j = 0; j < 3; j++) {
      const f = 0.2 + j * 0.25, [px, py] = bz(f), t1 = t0 + f * D, sz2 = 2.6 + rand() * 2.6;
      fx(k.pic('dust', [px, py], sz2, sz2), [[t1, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t1 + 80, { transform: 'scale(1)', opacity: 0.85 }, 'linear'], [t1 + 560, { transform: `${k.T((rand() - 0.5) * 6, 8 + rand() * 6)} scale(.5)`, opacity: 0 }]]);
    }
  }

  // ── IMPACT at T: a flash, a ring, a shadow gathering round it, glints of dust thrown up
  fx(k.pic('gloom', T, 48, 48, { lit: false }), tidy([[IM - 60, { transform: 'scale(.4) rotate(0deg)', opacity: 0 }, 'ease-out'], [IM + 250, { transform: 'scale(1) rotate(25deg)', opacity: 0.85 }, eio], [2400, { transform: 'scale(1.1) rotate(70deg)', opacity: 0.65 }, eio], [3000, { transform: 'scale(1.3) rotate(100deg)', opacity: 0 }]]));
  fx(k.light('g-violet', T, 56), tidy([[IM - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 70, { transform: 'scale(1.2)', opacity: 1 }, eio], [IM + 400, { transform: 'scale(.95)', opacity: 0.55 }, eio], [2400, { transform: 'scale(1.05)', opacity: 0.45 }, eio], [3000, { transform: 'scale(1.3)', opacity: 0 }]]));
  for (let i = 0; i < 2; i++) {
    const t0 = IM + 40 + i * 260;
    fx(k.pic(ring, T, 36, 36), [[t0, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [t0 + 80, { transform: 'scale(.5)', opacity: 0.9 }], [t0 + 850, { transform: 'scale(2)', opacity: 0 }]]);
  }
  for (let i = 0; i < 14; i++) {
    const a = rand() * Math.PI * 2, v = 8 + rand() * 22, t0 = IM + 600 + rand() * 500, sz = 2.6 + rand() * 4;
    const pt = (f, s, o) => ({ transform: `translate(${(Math.cos(a) * v * f * u).toFixed(1)}px, ${((Math.sin(a) * v * f - 10 * f) * u).toFixed(1)}px) scale(${s})`, opacity: o });
    fx(k.pic('dust', T, sz, sz), [[t0, pt(0, 0.5, 0), 'ease-out'], [t0 + 80, pt(0.2, 1, 0.95), 'linear'], [t0 + 700, pt(1, 0.8, 0)]]);
  }
}
