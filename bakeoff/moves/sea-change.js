// Sea Change (a Trick, a support: a creature becomes a small, startled fish). The sea-magic
// gathers in the bubble: the streams of the spiral wind tighter, ghosts of them whirl, the bubble swells
// and bubbles draw in from all round, while the monster rears to roar. Then the gift is sent: a head of
// pale water and a trail of bubbles flies from the bubble's heart (emit) to T, where the magic takes hold:
// a flash, a ring of bubbles and a little whirlpool winding shut. The monster is wrung down small by the
// spiral, shaking, and springs back to its size; the bubble flashes and the fish inside flips and
// wriggles, startled. Then everything calms and settles as drawn.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support (a Trick that changes a creature), element
// water (as suggested). T = k.aim, else the monster's chest, so alone the spell works on the monster.
//   0-650    GATHER: the spiral winds tighter and whirls (ghost copies), the bubble swells, a glow
//            gathers in it, bubbles stream in; the monster rears and roars (leans back, swells).
//   700      RELEASE: a head of water leaves the bubble's heart for T on an arc, trailing bubbles.
//   1150     IMPACT: flash and rings at T, a whirlpool winding shut, bubbles burst out; the monster is
//            wrung small (squashed toward the spiral), the bubble flashes, the fish flips.
//   1250-2300 the monster shudders small, then springs back; the fish wriggles; bubbles rise.
//   2300-3500 the glows fade, the whirl unwinds, everything eases to rest. At rest from 3500.
// BEATS: release 700, impact 1150, settle 3500.
export const END = 4000;
export const BEATS = { release: 700, impact: 1150, settle: 3500 };
export const STILLS = [300, 650, 900, 1150, 1400, 1900, 2600, 3700];

export const textures = {
  glint: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [236 + 19 * c, 255, 255, Math.min(1, c * c * 2.6)]; }],
  head: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [190 + 60 * c, 246, 248, Math.min(1, c * 1.7)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const S = k.spec, E = S.emit, B = S.bubble;
  const monster = k.part('monster'), spiral = k.part('spiral'), bubble = k.part('bubble'), fish = k.part('fish'), shine = k.part('shine');
  k.css('.g-sea { border-radius: 50%; background: radial-gradient(circle, rgba(244,255,252,.95), rgba(168,236,236,.55) 30%, rgba(100,200,214,.18) 58%, rgba(80,180,200,0) 72%); }');
  const bub = k.svg('<circle cx="20" cy="20" r="15" fill="rgba(180,240,244,.14)" stroke="#e8fffd" stroke-width="2.4"/><path d="M10,16A11,11 0 0 1 17,9" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>', 40, 40);
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.5"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#d4f6f6" stroke-width="5" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#f4ffff" stroke-width="1.5"/>', 100, 100);
  // a little whirlpool: a spiral stroke
  let d = '';
  for (let i = 0; i <= 40; i++) { const t = i / 40, a = t * 4.2 * Math.PI, r = 4 + 36 * (1 - t); d += `${i ? 'L' : 'M'}${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`; }
  const whirl = k.svg(`<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2"/></filter></defs><path d="${d}" fill="none" stroke="#bff0f0" stroke-width="6" stroke-linecap="round" filter="url(#b)"/><path d="${d}" fill="none" stroke="#f6ffff" stroke-width="2" stroke-linecap="round"/>`, 100, 100);

  // ── where it goes: another card's point (k.aim), else the monster's chest
  const T = k.aim || S.hit;
  const IM = BEATS.impact, REL = BEATS.release, back = 3500;
  const tidy = (l) => l.filter((q, i) => i === 0 || q[0] > l[i - 1][0]);

  // ── the spiral: winds tighter while it gathers, whirls (rocking) as the spell goes, unwinds at the end
  act(spiral, tidy([[0, { transform: 'rotate(0deg) scale(1)' }, eio], [650, { transform: 'rotate(-4deg) scale(.94)' }, eio], [IM, { transform: 'rotate(5deg) scale(1.08)' }, eio], [1700, { transform: 'rotate(-3deg) scale(1.03)' }, eio], [2500, { transform: 'rotate(2deg) scale(1.01)' }, eio], [back, { transform: 'rotate(0deg) scale(1)' }]]));
  // ghosts of the streams whirling round (copies of the spiral, behind it and over it)
  for (const [i, ph] of [[0, 0], [1, 1]]) {
    const g = k.copy('spiral', '', { behind: i === 0 }), s = i ? -1 : 1;
    act(g, tidy([[0, { transform: 'rotate(0deg) scale(1)', opacity: 0 }, 'ease-out'], [300 + ph * 140, { transform: `rotate(${s * 4}deg) scale(.96)`, opacity: 0.4 }, eio], [IM, { transform: `rotate(${s * 22}deg) scale(1.05)`, opacity: 0.55 }, eio], [1700, { transform: `rotate(${s * 40}deg) scale(1.02)`, opacity: 0.3 }, eio], [2500, { transform: `rotate(${s * 52}deg) scale(1)`, opacity: 0 }]]));
  }

  // ── the bubble swells with the gathering, flashes at the impact; the shine goes with it
  const bs = [[0, { transform: 'scale(1)' }, eio], [650, { transform: 'scale(1.1)' }, 'ease-out'], [IM, { transform: 'scale(1.18)' }, 'ease-out'], [IM + 150, { transform: 'scale(1.04)' }, eio], [IM + 330, { transform: 'scale(1.1)' }, eio], [IM + 600, { transform: 'scale(.98)' }, eio], [IM + 900, { transform: 'scale(1.03)' }, eio], [back, { transform: 'scale(1)' }]];
  act(bubble, bs); act(shine, bs);

  // ── the fish: a start at the gathering, then at the impact it flips and wriggles, startled
  const fw = [[0, { transform: 'rotate(0deg) scale(1)' }, eio], [500, { transform: 'rotate(-6deg) scale(.95)' }, eio], [IM, { transform: 'rotate(-10deg) scale(.92)' }, 'ease-out']];
  [[1, -26, 1.12], [2, 24, 0.94], [3, -16, 1.06], [4, 12, 0.97], [5, -7, 1.02]].forEach(([i, a, s]) => fw.push([IM + i * 150, { transform: `rotate(${a}deg) scale(${s})` }, eio]));
  fw.push([IM + 1100, { transform: 'rotate(3deg) scale(1)' }, eio], [back - 300, { transform: 'rotate(0deg) scale(1)' }]);
  act(fish, tidy(fw));

  // ── the monster: rears to roar, is wrung down small toward the spiral at the impact, shudders, springs back
  const m = (dx, dy, r, sx, sy) => ({ transform: `translate(${(dx * u).toFixed(1)}px, ${(dy * u).toFixed(1)}px) rotate(${r}deg) scale(${sx}, ${sy})` });
  act(monster, tidy([[0, m(0, 0, 0, 1, 1), eio], [350, m(-1, -1.5, -2.5, 1.03, 1.04), eio], [650, m(-1.5, -2, -3.2, 1.05, 1.05), 'ease-in'], [IM, m(1, 1.5, 1.5, 0.96, 0.95), 'ease-out'],
    [IM + 180, m(7, 5, 5, 0.82, 0.8), eio], [IM + 300, m(6, 4.5, 3.5, 0.85, 0.82), eio], [IM + 420, m(7.5, 5.5, 6, 0.8, 0.79), eio], [IM + 540, m(6.5, 4.5, 3, 0.84, 0.82), eio],
    [1900, m(7, 5, 4.5, 0.83, 0.81), eio], [2200, m(-1.5, -1, -2, 1.05, 1.06), 'ease-out'], [2450, m(0.5, 0.4, 0.8, 0.99, 0.99), eio], [2800, m(0, 0, 0, 1, 1)]]));

  // ── the glow of the gathering in the bubble, flaring at the impact
  fx(k.light('g-sea', B, 70), tidy([[100, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [650, { transform: 'scale(1)', opacity: 0.75 }, eio], [REL + 60, { transform: 'scale(1.3)', opacity: 0.95 }, 'ease-out'], [IM, { transform: 'scale(1.7)', opacity: 1 }, eio], [IM + 500, { transform: 'scale(1.2)', opacity: 0.5 }, eio], [2600, { transform: 'scale(.9)', opacity: 0.25 }, eio], [back, { transform: 'scale(.7)', opacity: 0 }]]));
  fx(k.lightIn('g-sea', [150, 100], 220, 130), [[200, { transform: 'scale(.7)', opacity: 0 }, 'ease-out'], [IM, { transform: 'scale(1)', opacity: 0.3 }, eio], [2200, { transform: 'scale(1.05)', opacity: 0.2 }, eio], [back, { transform: 'scale(.8)', opacity: 0 }]]);

  // ── gathering: bubbles drawn in toward the bubble from all round (0-650)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + rand() * 0.5, r0 = 42 + rand() * 26, t0 = 80 + i * 45, sz = 3.5 + rand() * 4, [X, Y] = [B[0] + Math.cos(a) * r0, B[1] + Math.sin(a) * r0 * 0.7];
    fx(k.picIn(bub, [X, Y], sz, sz), [[t0, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 120, { transform: `${k.T((B[0] - X) * 0.12, (B[1] - Y) * 0.12)} scale(1)`, opacity: 0.85 }, 'ease-in'], [t0 + 560, { transform: `${k.T(B[0] - X, B[1] - Y)} scale(.5)`, opacity: 0 }]]);
  }

  // ── the gift: a head of water and a trail of bubbles from the bubble's heart to T (RELEASE to IMPACT)
  const C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 28];
  const bz = (t) => { const q = 1 - t; return [q * q * E[0] + 2 * q * t * C[0] + t * t * T[0], q * q * E[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const [X0, Y0] = k.P(...E);
  const at = (t, sc, o) => { const [x, y] = k.P(...bz(t)); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) scale(${sc})`, opacity: o }; };
  const FLY = IM - REL;
  fx(k.pic('head', E, 14, 14), [[REL, at(0, 0.5, 0), 'ease-out'], [REL + 60, at(0.03, 1, 1), 'ease-in'], [IM - 40, at(0.95, 1.2, 1), 'linear'], [IM + 40, at(1, 1.9, 0)]]);
  fx(k.light('g-sea', E, 30), [[REL, { ...at(0, 0.5, 0), transform: `${at(0, 0.5, 0).transform}` }, 'ease-out'], [REL + 60, at(0.03, 1, 0.9), 'ease-in'], [IM - 40, at(0.95, 1.1, 0.9), 'linear'], [IM + 60, at(1, 1.5, 0)]]);
  for (let i = 0; i < 12; i++) {
    const t0 = REL + 30 + i * 28, sz = 4 + rand() * 4, side = (rand() - 0.5) * 8;
    const bt = (f, s, o) => { const p = at(Math.max(0, Math.min(1, f)), s, o); return { transform: `${p.transform.replace(/translate\(([-\d.]+)px, ([-\d.]+)px\)/, (_, a, b) => `translate(${a}px, ${(+b + side * u * f).toFixed(1)}px)`)}`, opacity: o }; };
    fx(k.pic(bub, E, sz, sz), [[t0, bt(Math.max(0, (t0 - REL) / FLY * 0.9 - 0.02), 0.5, 0), 'ease-out'], [t0 + 50, bt((t0 + 50 - REL) / FLY * 0.9, 1, 0.9), 'linear'], [t0 + 280, bt(Math.min(1, (t0 + 280 - REL) / FLY * 0.9 + 0.1), 1, 0.7), 'linear'], [t0 + 520, bt(1, 0.4, 0)]]);
  }

  // ── IMPACT at T: a flash, rings, a whirlpool winding shut, bubbles bursting out
  fx(k.light('g-sea', T, 56), [[IM - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(1.2)', opacity: 1 }, eio], [IM + 260, { transform: 'scale(.95)', opacity: 0.55 }, eio], [IM + 800, { transform: 'scale(1.4)', opacity: 0 }]]);
  for (let i = 0; i < 2; i++) fx(k.pic(ring, T, 40, 40), [[IM + i * 130, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [IM + i * 130 + 70, { transform: 'scale(.5)', opacity: 0.9 }], [IM + i * 130 + 700, { transform: 'scale(2.3)', opacity: 0 }]]);
  fx(k.pic(whirl, T, 44, 44), [[IM - 20, { transform: 'rotate(0deg) scale(1.5)', opacity: 0 }, 'ease-out'], [IM + 80, { transform: 'rotate(60deg) scale(1.3)', opacity: 0.95 }, 'ease-in'], [IM + 820, { transform: 'rotate(420deg) scale(.15)', opacity: 0.9 }], [IM + 900, { transform: 'rotate(450deg) scale(.1)', opacity: 0 }]]);
  for (let i = 0; i < 14; i++) {
    const a = rand() * Math.PI * 2, v = 10 + rand() * 24, t0 = IM + rand() * 120, sz = 2.5 + rand() * 5, glint = i < 5;
    const pt = (f, s, o) => ({ transform: `translate(${(Math.cos(a) * v * f * u).toFixed(1)}px, ${((Math.sin(a) * v * f - 12 * f * f) * u).toFixed(1)}px) scale(${s})`, opacity: o });
    fx(k.pic(glint ? 'glint' : bub, T, glint ? sz * 0.8 : sz, glint ? sz * 0.8 : sz), [[t0, pt(0, 0.5, 0), 'ease-out'], [t0 + 60, pt(0.2, 1, 0.95), 'linear'], [t0 + 500, pt(0.9, 1, 0.8), 'ease-in'], [t0 + 700, pt(1, 1.4, 0)]]);
  }

  // ── at the bubble: a ring of the magic running out as the fish flips, bubbles rising (IMPACT on)
  fx(k.pic(ring, B, 60, 60), [[IM, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 80, { transform: 'scale(.6)', opacity: 0.8 }], [IM + 800, { transform: 'scale(1.7)', opacity: 0 }]]);
  for (let i = 0; i < 8; i++) {
    const t0 = IM + 100 + i * 170, x = B[0] + (rand() - 0.5) * 30, sz = 2.5 + rand() * 4;
    fx(k.picIn(bub, [x, B[1] - 6], sz, sz), [[t0, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 200, { transform: `${k.T((rand() - 0.5) * 4, -8)} scale(1)`, opacity: 0.85 }], [t0 + 1100, { transform: `${k.T((rand() - 0.5) * 8, -34 - rand() * 14)} scale(1.1)`, opacity: 0 }]]);
  }
  // and the monster's last breath of foam as it is wrung small
  for (let i = 0; i < 5; i++) {
    const t0 = IM + 60 + i * 110, [mx, my] = S.mouth;
    fx(k.picIn(bub, [mx - 8 + rand() * 16, my + rand() * 10], 3 + rand() * 3, 3 + rand() * 3), [[t0, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 200, { transform: `${k.T(8, 2)} scale(1)`, opacity: 0.8 }], [t0 + 800, { transform: `${k.T(26, -4)} scale(1)`, opacity: 0 }]]);
  }
}
