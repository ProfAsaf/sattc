// The Windborne Sage (a creature, a support: when she is played she draws a card). The wind rises round
// her: her hair, scarf and robe stream harder, the gulls bank on the gust, long wisps of air and torn
// pages sweep across. She lifts her glowing book; a page of light lifts out of it, and at RELEASE she
// flicks it away: it spins off on an arc to T, trailing glints, and where it arrives a card unfolds out
// of the air (the card she draws) with a ring and sparkles. Her arm swings through and back, her robe
// billows and settles, the gulls glide back to where they were drawn, and everything is at rest again.
//
// PLAN (drawing units 300 x 210, ms of the move). Role support (she draws a card for you), element wind
// (the suggestion, water, is only the sea below her: what she moves is the wind). T = k.aim, else the sky
// up and to the right of her.
//   0-500     GATHER: the book rises with her arm, glowing; hair, scarf, robe stream harder; gulls bank
//             off on the gust; wisps of wind and torn pages begin to sweep.
//   500-800   a page of light lifts from the book and hangs, trembling.
//   800       RELEASE: her arm flicks the page away (follow-through), it flies to T.
//   1300      IMPACT: a card unfolds at T, a ring, sparkles; her robe and hair whip with the throw.
//   1300-2400 the card hangs, then is drawn off up; the wind eases, the gulls glide back.
//   2400-3300 her arm lowers, everything eases to rest. At rest from 3300.
// BEATS: release 800, impact 1300, settle 3300.
export const END = 3800;
export const BEATS = { release: 800, impact: 1300, settle: 3300 };
export const STILLS = [350, 700, 900, 1100, 1350, 1800, 2500, 3500];

export const textures = {
  glint: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 250, 226 + 29 * c, Math.min(1, c * c * 2.6)]; }],
  mote: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [246, 252, 236, Math.min(1, c * 1.8)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const S = k.spec, E = S.emit, SH = S.shoulder;
  const hair = k.part('hair'), scarf = k.part('scarf'), robe = k.part('robe'), arm = k.part('arm'), sleeve = k.part('sleeve'), book = k.part('book');
  const gulls = [0, 1, 2, 3, 4].map((i) => k.part(`bird${i}`));
  k.css('.g-wind { border-radius: 50%; background: radial-gradient(circle, rgba(250,255,240,.9), rgba(214,244,232,.5) 32%, rgba(180,230,222,.16) 58%, rgba(170,225,220,0) 72%); }');
  const T = k.aim || [214, 44];
  const IM = BEATS.impact, REL = BEATS.release, back = BEATS.settle;
  const tidy = (l) => l.filter((q, i) => i === 0 || q[0] > l[i - 1][0]);
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.5"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#f6f2cc" stroke-width="5" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#fffdf0" stroke-width="1.5"/>', 100, 100);
  const sheet = k.svg('<defs><filter id="b" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><rect x="4" y="3" width="20" height="28" rx="2.4" fill="#fff6c8" filter="url(#b)"/><rect x="6" y="5" width="16" height="24" rx="1.8" fill="#fbf6dc"/><path d="M9,11h10M9,15h10M9,19h7M9,23h9" stroke="#b9c3ad" stroke-width="1.1"/>', 28, 34);
  const paper = k.svg('<rect x="0" y="0" width="9" height="12" rx=".8" fill="#f4f0d6"/><path d="M1.8,3h5.4M1.8,5h5.4M1.8,7h3.6" stroke="#9aa79e" stroke-width=".5"/>', 9, 12);
  const wisp = k.svg('<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#f4fff4" stop-opacity="0"/><stop offset=".6" stop-color="#f4fff4" stop-opacity=".8"/><stop offset="1" stop-color="#f4fff4" stop-opacity="0"/></linearGradient></defs><path d="M0,10C20,2 38,2 56,8C70,12 84,14 100,8C84,11 70,9 56,6C38,0 20,1 0,10Z" fill="url(#g)"/><path d="M8,14C28,8 44,9 62,13" stroke="url(#g)" stroke-width="1.2" fill="none"/>', 100, 20);

  // a part's transform: rotate `deg` about `c` (default its own joint), then scale about its joint, shifted (dx, dy)
  const mk = (piv) => (deg, o = {}) => {
    const c = o.c || piv, r = (deg * Math.PI) / 180, px = piv[0] - c[0], py = piv[1] - c[1];
    const ex = c[0] + px * Math.cos(r) - py * Math.sin(r) - piv[0] + (o.dx || 0), ey = c[1] + px * Math.sin(r) + py * Math.cos(r) - piv[1] + (o.dy || 0);
    return { transform: `translate(${(ex * u).toFixed(1)}px, ${(ey * u).toFixed(1)}px) rotate(${deg}deg) scale(${o.sx || 1}, ${o.sy || 1})` };
  };

  // ── the arm lifts the book (0-500), holds it out, flicks it at RELEASE, follows through, lowers
  const A = mk([134, 78]), B = mk([107, 80]);
  const armPoses = [[0, 0, 1], [480, 13, 1], [REL - 60, 15, 1], [REL + 60, -9, 1], [REL + 240, -12, 1], [IM + 150, 4, 1], [1900, 1, 1], [2600, 0.5, 1], [back, 0, 1]];
  act(arm, tidy(armPoses.map(([t, d], i) => [t, A(d), eio])));
  const bookPoses = [[0, 0, 1], [480, 13, 1.02], [REL - 60, 15, 1.04], [REL + 60, -9, 1.14], [REL + 240, -12, 1.06], [IM + 150, 4, 1.02], [1900, 1, 1], [2600, 0.5, 1], [back, 0, 1]];
  act(book, tidy(bookPoses.map(([t, d, s]) => [t, { ...B(d, { c: [134, 78], sx: s, sy: s }) }, eio])));
  // the book's glow: gathering, flaring as the page leaves, dimming
  fx(k.light('g-heal', [106, 76], 56), tidy([[100, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [500, { transform: 'scale(1.1)', opacity: 0.7 }, eio], [REL, { transform: 'scale(1.5)', opacity: 0.95 }, 'ease-out'], [REL + 300, { transform: 'scale(1.1)', opacity: 0.6 }, eio], [2200, { transform: 'scale(.9)', opacity: 0.3 }, eio], [back, { transform: 'scale(.7)', opacity: 0 }]]));

  // ── hair, scarf, sleeve and robe: streaming harder on the rising wind, gusting, whipped by the throw
  const gust = (piv, base, amp, per, phase, lagMs) => {
    const Pf = mk(piv), list = [[0, Pf(0), eio]];
    for (let t = 150; t < back - 200; t += per) {
      const env = t < 500 ? t / 500 : t < IM + 300 ? 1 : Math.max(0, 1 - (t - IM - 300) / (back - 200 - IM - 300));
      const a = base * Math.min(1, t / 500) * (t > back - 800 ? Math.max(0, (back - t) / 800) : 1) + amp * env * Math.sin((t + phase) / per * Math.PI);
      list.push([t + lagMs, Pf(+a.toFixed(2)), eio]);
    }
    list.push([back, Pf(0)]);
    return tidy(list);
  };
  act(hair, gust([131, 58], -5, 4.5, 260, 0, 0));
  act(scarf, gust([136, 70], -6, 5, 300, 130, 40));
  act(sleeve, gust([140, 75], -4, 3.5, 280, 60, 20));
  const RB = mk([140, 98]);
  const rb = [[0, RB(0), eio], [450, RB(2, { sx: 1.02 }), eio], [REL + 60, RB(-3, { sx: 0.98 }), 'ease-out'], [IM, RB(5, { sx: 1.07 }), eio], [IM + 350, RB(-1.5, { sx: 0.99 }), eio], [1900, RB(2.5, { sx: 1.04 }), eio], [2500, RB(-0.8, { sx: 0.995 }), eio], [back, RB(0)]];
  act(robe, tidy(rb));

  // ── the gulls: banked off on the gust, flapping, gliding back to where they were drawn
  const GP = S.gulls;
  gulls.forEach((g, i) => {
    const Gp = mk(GP[i]), t0 = 420 + i * 110, dx = 12 + rand() * 10 - (i === 2 ? 4 : 0), dy = -(4 + rand() * 8) * (i > 2 ? 0.5 : 1);
    const l = [[0, Gp(0), eio], [t0, Gp(0), eio], [t0 + 500, Gp(-8, { dx, dy }), eio]];
    for (let t = t0 + 560, n = 0; t < 2300; t += 150, n++) l.push([t, Gp(-6 + (n % 2 ? 3 : -3), { dx: dx * (1 + n * 0.05), dy: dy + (n % 2 ? 1.2 : -1.2), sy: n % 2 ? 0.55 : 1.15 }), eio]);
    l.push([2900, Gp(2, { dx: dx * 0.2, dy: 0 }), eio], [back, Gp(0)]);
    act(g, tidy(l));
  });

  // ── wind: long wisps of air and torn pages sweeping across (400-2200)
  for (let i = 0; i < 6; i++) {
    const t = 350 + i * 260, y = 34 + rand() * 110, w = 60 + rand() * 40, x0 = -30 - rand() * 20;
    fx(k.picIn(wisp, [x0, y], w, w * 0.2, { lit: false }), [[t, { transform: `${k.T(0, 0)} scale(.5, 1)`, opacity: 0 }, 'ease-out'], [t + 250, { transform: `${k.T(90, -3)} scale(1, 1)`, opacity: 0.6 }, 'linear'], [t + 900, { transform: `${k.T(330, -9)} scale(1.1, 1)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 5; i++) {
    const t = 500 + i * 330, y = 40 + rand() * 100, r = Math.round(rand() * 90);
    fx(k.picIn(paper, [-6, y], 9, 12, { lit: false }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.9)`, opacity: 0 }, 'ease-out'], [t + 200, { transform: `${k.T(52, -6)} rotate(${r + 120}deg) scale(1)`, opacity: 0.9 }, 'linear'],
      [t + 800, { transform: `${k.T(180, 6)} rotate(${r + 380}deg) scale(1)`, opacity: 0.85 }, 'linear'], [t + 1500, { transform: `${k.T(330, -10)} rotate(${r + 640}deg) scale(.9)`, opacity: 0 }]]);
  }
  fx(k.lightIn('g-wind', [160, 90], 260, 150), [[200, { transform: 'scale(.7)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(1)', opacity: 0.22 }, eio], [2000, { transform: 'scale(1.05)', opacity: 0.18 }, eio], [back, { transform: 'scale(.8)', opacity: 0 }]]);

  // ── a page of light lifts out of the book (500-800), then is flicked to T (RELEASE to IMPACT)
  const C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 30];
  const bz = (t) => { const q = 1 - t; return [q * q * E[0] + 2 * q * t * C[0] + t * t * T[0], q * q * E[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const [X0, Y0] = k.P(E[0], E[1] - 4);
  const lift = k.T(-1, -9);
  const at = (f, sc, o, rot) => { const [x, y] = k.P(...bz(f)); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + 4 * u).toFixed(1)}px) rotate(${rot}deg) scale(${sc})`, opacity: o }; };
  fx(k.pic(sheet, [E[0], E[1] - 4], 11, 13.5), [[500, { transform: 'translate(0px, 0px) rotate(0deg) scale(.3)', opacity: 0 }, 'ease-out'], [REL - 40, { transform: `${lift} rotate(-8deg) scale(1)`.replace(lift, `translate(${(-1 * u).toFixed(1)}px, ${(-9 * u).toFixed(1)}px)`), opacity: 1 }, eio],
    [REL + 20, { ...at(0.02, 1, 1, -12) }, 'ease-in'], [REL + 140, at(0.2, 1.05, 1, 80)], [REL + 300, at(0.5, 1.1, 1, 260)], [IM - 60, at(0.93, 1.1, 1, 410), 'ease-in'], [IM, at(1, 1.2, 0, 440)]]);
  fx(k.light('g-wind', [E[0], E[1] - 4], 26), [[500, { transform: 'translate(0px, 0px) scale(.4)', opacity: 0 }, 'ease-out'], [REL - 40, { transform: `translate(${(-1 * u).toFixed(1)}px, ${(-9 * u).toFixed(1)}px) scale(1)`, opacity: 0.8 }, eio], [REL + 20, { ...at(0.02, 1, 0.9, 0), transform: at(0.02, 1, 0.9, 0).transform.replace('rotate(0deg) ', '') }, 'ease-in'],
    [IM - 60, { ...at(0.93, 1.1, 0.9, 0), transform: at(0.93, 1.1, 0.9, 0).transform.replace('rotate(0deg) ', '') }, 'linear'], [IM + 60, { transform: at(1, 1.6, 0, 0).transform.replace('rotate(0deg) ', ''), opacity: 0 }]]);
  for (let i = 0; i < 12; i++) {
    const t0 = REL + 30 + i * 34, sz = 2.5 + rand() * 3, side = (rand() - 0.5) * 10, f0 = Math.max(0, (t0 - REL) / (IM - REL) * 0.9);
    const pt = (f, s, o) => { const p = at(Math.min(1, Math.max(0, f)), s, o, 0); return { transform: p.transform.replace('rotate(0deg) ', '').replace(/translate\(([-\d.]+)px, ([-\d.]+)px\)/, (_, a, b) => `translate(${a}px, ${(+b + side * f * u).toFixed(1)}px)`), opacity: o }; };
    fx(k.pic(i % 3 ? 'mote' : 'glint', E, sz, sz), [[t0, pt(f0, 0.5, 0), 'ease-out'], [t0 + 40, pt(f0 + 0.04, 1, 0.9), 'linear'], [t0 + 300, pt(Math.min(1, f0 + 0.32), 0.9, 0.6), 'linear'], [t0 + 520, pt(Math.min(1, f0 + 0.5), 0.4, 0)]]);
  }

  // ── IMPACT at T: the card unfolds out of the air (turns edge-on and open), a ring, sparkles; then it is drawn off up
  fx(k.light('g-wind', T, 56), [[IM - 50, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(1.2)', opacity: 0.95 }, eio], [IM + 400, { transform: 'scale(1)', opacity: 0.6 }, eio], [IM + 1100, { transform: 'scale(1.2)', opacity: 0 }]]);
  fx(k.pic(sheet, T, 16, 19.5), [[IM - 20, { transform: 'translate(0px, 0px) scale(.15, .2) rotate(-12deg)', opacity: 0 }, 'ease-out'], [IM + 90, { transform: 'translate(0px, 0px) scale(1.1, 1.1) rotate(-4deg)', opacity: 1 }, eio], [IM + 220, { transform: 'translate(0px, 0px) scale(.15, 1) rotate(0deg)', opacity: 1 }, eio],
    [IM + 340, { transform: `translate(0px, ${(-1 * u).toFixed(1)}px) scale(1, 1) rotate(2deg)`, opacity: 1 }, eio], [IM + 800, { transform: `translate(0px, ${(-2.5 * u).toFixed(1)}px) scale(1, 1) rotate(-1deg)`, opacity: 1 }, eio], [IM + 1250, { transform: `translate(${(5 * u).toFixed(1)}px, ${(-16 * u).toFixed(1)}px) scale(.7, .7) rotate(8deg)`, opacity: 0 }]]);
  fx(k.pic(ring, T, 40, 40), [[IM, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [IM + 70, { transform: 'scale(.5)', opacity: 0.9 }], [IM + 700, { transform: 'scale(2.2)', opacity: 0 }]]);
  fx(k.pic(ring, T, 40, 40), [[IM + 140, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [IM + 220, { transform: 'scale(.4)', opacity: 0.6 }], [IM + 850, { transform: 'scale(1.7)', opacity: 0 }]]);
  for (let i = 0; i < 14; i++) {
    const a = rand() * Math.PI * 2, v = 12 + rand() * 24, t0 = IM + rand() * 140, sz = 2.5 + rand() * 4, glint = i < 7;
    const pt = (f, s, o) => ({ transform: `translate(${(Math.cos(a) * v * f * u).toFixed(1)}px, ${((Math.sin(a) * v * f - 10 * f * f) * u).toFixed(1)}px) scale(${s})`, opacity: o });
    fx(k.pic(glint ? 'glint' : 'mote', T, sz, sz), [[t0, pt(0, 0.5, 0), 'ease-out'], [t0 + 60, pt(0.2, 1, 0.95), 'linear'], [t0 + 500, pt(0.85, 1, 0.8), 'ease-in'], [t0 + 750, pt(1, 0.4, 0)]]);
  }
  // a breath of wind at T: the wisps part round it
  fx(k.pic(wisp, [T[0] - 10, T[1] + 4], 40, 8), [[IM, { transform: 'scale(.4, 1) rotate(-10deg)', opacity: 0 }, 'ease-out'], [IM + 200, { transform: `${k.T(14, -3)} scale(1, 1) rotate(-10deg)`, opacity: 0.6 }], [IM + 800, { transform: `${k.T(50, -8)} scale(1.2, 1) rotate(-10deg)`, opacity: 0 }]]);
}
